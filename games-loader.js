// 游戏数据
window.gameData = []; // 首先初始化为空数组

// 从本地games_data.json加载游戏数据
(function() {
  // 定义常量
  const GAMES_CACHE_KEY = 'spirit_cage_games_data';
  const GAMES_CACHE_TIMESTAMP_KEY = 'spirit_cage_games_timestamp';
  const CACHE_VALID_DURATION = 24 * 60 * 60 * 1000; // 缓存有效期：24小时
  
  // 定义一个标志变量，避免重复触发加载完成事件
  let dataLoadedEventTriggered = false;
  
  // 触发数据加载完成事件
  function triggerDataLoadedEvent(data) {
    if (dataLoadedEventTriggered) return; // 避免重复触发
    
    dataLoadedEventTriggered = true;
    console.log('游戏数据加载完成，共 ' + data.length + ' 个游戏');
    
    // 预加载前20个游戏的图片
    preloadGameImages(data.slice(0, 20));
    
    // 触发自定义事件，通知应用游戏数据已加载
    const event = new CustomEvent('gamesDataLoaded', { detail: data });
    document.dispatchEvent(event);
  }
  
  // 预加载游戏图片
  function preloadGameImages(games) {
    if (!games || !games.length) return;
    
    // 创建一个隐藏容器来预加载图片
    const preloadContainer = document.createElement('div');
    preloadContainer.style.position = 'absolute';
    preloadContainer.style.width = '0';
    preloadContainer.style.height = '0';
    preloadContainer.style.overflow = 'hidden';
    preloadContainer.style.visibility = 'hidden';
    document.body.appendChild(preloadContainer);
    
    // 开始预加载图片
    games.forEach(game => {
      if (game.image) {
        const img = new Image();
        img.src = game.image;
        preloadContainer.appendChild(img);
      }
    });
    
    // 60秒后删除预加载容器
    setTimeout(() => {
      document.body.removeChild(preloadContainer);
    }, 60000);
  }
  
  // 尝试从缓存加载游戏数据
  function tryLoadFromCache() {
    try {
      const cachedTimestampStr = localStorage.getItem(GAMES_CACHE_TIMESTAMP_KEY);
      if (!cachedTimestampStr) return null;
      
      const cachedTimestamp = parseInt(cachedTimestampStr);
      const now = new Date().getTime();
      
      // 检查缓存是否过期
      if (now - cachedTimestamp > CACHE_VALID_DURATION) {
        console.log('游戏数据缓存已过期');
        return null;
      }
      
      // 尝试获取缓存数据
      const cachedDataStr = localStorage.getItem(GAMES_CACHE_KEY);
      if (!cachedDataStr) return null;
      
      const cachedData = JSON.parse(cachedDataStr);
      if (Array.isArray(cachedData) && cachedData.length > 0) {
        console.log('从缓存加载游戏数据，共 ' + cachedData.length + ' 个游戏');
        return cachedData;
      }
      
      return null;
    } catch (error) {
      console.error('读取缓存游戏数据失败:', error);
      return null;
    }
  }
  
  // 保存数据到缓存
  function saveToCache(data) {
    try {
      if (!data || !Array.isArray(data) || data.length === 0) return;
      
      // 压缩数据，只保留必要字段
      const compressedData = data.map(game => ({
        title: game.title,
        embed: game.embed,
        image: game.image,
        tags: game.tags,
        description: game.description ? game.description.substring(0, 200) : '' // 限制描述长度
      }));
      
      // 保存数据到本地存储
      localStorage.setItem(GAMES_CACHE_KEY, JSON.stringify(compressedData));
      localStorage.setItem(GAMES_CACHE_TIMESTAMP_KEY, new Date().getTime().toString());
      
      console.log('游戏数据已保存到缓存');
    } catch (error) {
      console.error('保存游戏数据到缓存失败:', error);
      // 如果是存储配额错误，清理其他不重要的缓存
      if (error.name === 'QuotaExceededError') {
        localStorage.removeItem(GAMES_CACHE_KEY);
        localStorage.removeItem(GAMES_CACHE_TIMESTAMP_KEY);
      }
    }
  }
  
  // 定义加载本地数据的函数
  function loadLocalGamesData() {
    console.log('正在加载游戏数据...');
    
    // 首先尝试从缓存读取
    const cachedData = tryLoadFromCache();
    if (cachedData) {
      window.gameData = cachedData;
      triggerDataLoadedEvent(cachedData);
      
      // 后台静默更新缓存
      setTimeout(() => {
        fetchFreshData();
      }, 2000);
      
      return;
    }
    
    // 缓存未命中，直接获取新数据
    fetchFreshData();
  }
  
  // 获取最新游戏数据
  function fetchFreshData() {
    console.log('开始获取games_data.json文件...');
    
    // 添加时间戳防止缓存
    const url = 'games_data.json?t=' + new Date().getTime();
    
    fetch(url)
      .then(response => {
        console.log('games_data.json请求状态: ' + response.status);
        if (!response.ok) {
          throw new Error('无法加载本地游戏数据: ' + response.status);
        }
        return response.json();
      })
      .then(data => {
        console.log('games_data.json解析完成，数据类型: ' + typeof data);
        console.log('是否为数组: ' + Array.isArray(data));
        if (data) console.log('数据长度: ' + (Array.isArray(data) ? data.length : '非数组'));
        
        if (Array.isArray(data) && data.length > 0) {
          console.log('成功从本地JSON文件加载游戏数据，共 ' + data.length + ' 个游戏');
          
          // 更新游戏数据
          window.gameData = data;
          
          // 打印第一个游戏的信息用于调试
          if (data.length > 0) {
            console.log('第一个游戏标题: ' + data[0].title);
          }
          
          // 保存到缓存
          saveToCache(data);
          
          // 如果之前没有触发过加载完成事件，触发一次
          triggerDataLoadedEvent(data);
        } else {
          console.error('本地游戏数据格式不正确');
          useBackupData();
        }
      })
      .catch(error => {
        console.error('加载本地游戏数据失败，详细错误:', error);
        console.error('错误名称:', error.name);
        console.error('错误消息:', error.message);
        console.error('错误堆栈:', error.stack);
        
        // 尝试直接从当前路径加载
        console.log('尝试从绝对路径加载games_data.json');
        fetch('/games_data.json')
          .then(response => {
            if (!response.ok) {
              throw new Error('从绝对路径加载失败: ' + response.status);
            }
            return response.json();
          })
          .then(data => {
            if (Array.isArray(data) && data.length > 0) {
              console.log('从绝对路径成功加载游戏数据，共 ' + data.length + ' 个游戏');
              window.gameData = data;
              saveToCache(data);
              triggerDataLoadedEvent(data);
            } else {
              throw new Error('从绝对路径加载的数据格式不正确');
            }
          })
          .catch(secondError => {
            console.error('从绝对路径加载失败，使用备用数据:', secondError);
            // 如果加载本地数据失败，使用原始的备用数据
            useBackupData();
          });
      });
  }
  
  // 定义使用备用数据的函数
  function useBackupData() {
    console.log('使用备用游戏数据');
    // 备用游戏数据（保留原始的备用数据）
    window.gameData = [
      {
        "title": "麻将连连看",
        "embed": "https://cloud.onlinegames.io/games/2025/unity/mahjong/index-og.html",
        "image": "https://www.onlinegames.io/media/posts/966/responsive/Mahjong-xs.jpg",
        "tags": "1-player,2d,brain,cozy,free,html5,logic,mouse,puzzle,strategy",
        "description": "麻将连连看是一款考验耐心、技巧和一点运气的游戏。在这个版本中，你的目标是匹配相同的牌，将它们从棋盘上移除，直到没有牌为止。规则是只能选择自由的牌，被阻挡的牌必须至少在一侧开放。"
      },
      {
        "title": "Nuts and Bolts Puzzle",
        "embed": "https://cloud.onlinegames.io/games/2025/unity/nuts-and-bolts-puzzle/index-og.html",
        "image": "https://www.onlinegames.io/media/posts/965/responsive/nuts-and-bolts-puzzle-xs.jpg",
        "tags": "1-player,2d,arcade,brain,cozy,free,fun,logic,puzzle",
        "description": "在这个有趣的拼图游戏中，你需要拆解各种螺母和螺栓的组合。不需要复杂的说明，只需要享受拆解的乐趣。解开谜题，测试你的逻辑思维能力。"
      },
      {
        "title": "Drift King",
        "embed": "https://www.onlinegames.io/games/2024/unity/drift-king/index.html",
        "image": "https://www.onlinegames.io/media/posts/729/responsive/Drift-King-xs.jpg",
        "tags": "3d,car,crazy,drift,driving,free,multiplayer,simulator,speed,unity",
        "description": "Drift King是一款3D赛车游戏，提供了独特的漂移体验，你可以从后视窗看到自己留下的烟雾。游戏提供10辆跑车和6张地图，以及全面的调校选项。控制方式：WASD或方向键移动，M查看后视镜，C更改视角，R重置车辆。"
      },
      {
        "title": "Highway Traffic",
        "embed": "https://www.onlinegames.io/games/2022/unity/highway-traffic/index.html",
        "image": "https://www.onlinegames.io/media/posts/32/responsive/Highway-Traffic-2-xs.jpg",
        "tags": "1-player,3d,car,crash,crazy,driving,endless,free,police,racing,speed,traffic,unity",
        "description": "Highway Traffic游戏让你在高速公路上驾驶，躲避其他车辆，避免事故。游戏变得困难是因为其他车辆会减速、加速或突然停止，所以你必须保持注意力并准备进行快速操作。不撞车的时间越长，获得的分数越多，可以解锁更多升级。"
      }
    ];
    
    // 触发数据加载完成事件
    triggerDataLoadedEvent(window.gameData);
  }
  
  // 检查是否已经有游戏数据（可能由其他脚本提前加载）
  if (window.gameData && window.gameData.length > 0) {
    console.log('检测到已有游戏数据，跳过加载步骤');
    triggerDataLoadedEvent(window.gameData);
    return;
  }
  
  // 页面加载时立即加载本地数据
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadLocalGamesData);
  } else {
    loadLocalGamesData();
  }
})();

// 数据同步功能
(function() {
  // API地址
  const API_URL = 'https://www.onlinegames.io/media/plugins/genGames/embed.json';
  
  // 最后同步时间的本地存储键名
  const LAST_SYNC_KEY = 'games_last_sync_time';
  const SYNC_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7天，单位为毫秒
  
  // 检查是否需要同步
  function checkSyncNeeded() {
    const lastSyncTime = localStorage.getItem(LAST_SYNC_KEY);
    const now = new Date().getTime();
    
    // 如果从未同步或者已经超过同步间隔，则进行同步
    if (!lastSyncTime || (now - parseInt(lastSyncTime)) > SYNC_INTERVAL) {
      return true;
    }
    
    return false;
  }
  
  // 执行同步
  function syncGamesData() {
    console.log('正在同步游戏数据...');
    
    fetch(API_URL)
      .then(response => {
        if (!response.ok) {
          throw new Error('同步游戏数据失败: ' + response.status);
        }
        return response.json();
      })
      .then(remoteData => {
        if (Array.isArray(remoteData) && remoteData.length > 0) {
          // 更新本地数据
          window.gameData = remoteData;
          console.log('游戏数据同步成功，共获取 ' + remoteData.length + ' 个游戏');
          
          // 更新最后同步时间
          localStorage.setItem(LAST_SYNC_KEY, new Date().getTime().toString());
          
          // 触发自定义事件通知应用游戏数据已更新
          const event = new CustomEvent('gamesDataUpdated', { detail: remoteData });
          document.dispatchEvent(event);
        }
      })
      .catch(error => {
        console.error('游戏数据同步失败:', error);
      });
  }
  
  // 在本地数据加载后检查是否需要同步
  document.addEventListener('gamesDataLoaded', function() {
    if (checkSyncNeeded()) {
      // 延迟2秒再同步，让页面有时间先渲染游戏
      setTimeout(syncGamesData, 2000);
    }
  });
  
  // 添加手动同步方法到全局对象
  window.manualSyncGamesData = syncGamesData;
})(); 