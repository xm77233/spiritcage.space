/**
 * 游戏数据修复脚本
 * 
 * 使用方法：
 * 1. 打开浏览器开发者工具 (F12)
 * 2. 切换到控制台 (Console) 标签
 * 3. 复制粘贴此脚本
 * 4. 按回车执行
 * 5. 刷新页面查看效果
 */

(function() {
  // 显示开始信息
  console.log('=== 游戏数据修复工具 ===');
  console.log('开始诊断游戏数据加载问题...');
  
  // 检查当前游戏数据
  console.log('当前游戏数据状态:');
  console.log('window.gameData 是否存在:', !!window.gameData);
  if (window.gameData) {
    console.log('当前游戏数量:', window.gameData.length);
  }
  
  // 清除缓存
  console.log('清除本地存储缓存...');
  try {
    localStorage.removeItem('spirit_cage_games_data');
    localStorage.removeItem('spirit_cage_games_timestamp');
    localStorage.removeItem('games_last_sync_time');
    console.log('✓ 缓存已清除');
  } catch (error) {
    console.error('无法清除缓存:', error);
  }
  
  // 加载游戏数据
  console.log('开始加载games_data.json文件...');
  
  // 添加时间戳防止缓存
  const url = 'games_data.json?t=' + new Date().getTime();
  
  fetch(url)
    .then(response => {
      console.log('服务器响应状态:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error('HTTP错误: ' + response.status);
      }
      
      return response.json();
    })
    .then(data => {
      console.log('数据解析完成，数据类型:', typeof data);
      console.log('是否为数组:', Array.isArray(data));
      
      if (Array.isArray(data) && data.length > 0) {
        console.log('✓ 成功加载游戏数据，数量:', data.length);
        console.log('第一个游戏标题:', data[0].title);
        
        // 修复数据格式
        console.log('开始修复数据格式...');
        const fixedData = data.map(game => {
          // 确保title字段存在
          if (!game.title) {
            game.title = '未命名游戏';
          }
          
          // 确保tags字段是字符串
          if (game.tags && Array.isArray(game.tags)) {
            game.tags = game.tags.join(',');
          } else if (!game.tags) {
            game.tags = '';
          }
          
          // 确保description字段存在
          if (!game.description) {
            game.description = '暂无描述';
          }
          
          // 确保image字段存在
          if (!game.image) {
            game.image = 'images/placeholder.jpg';
          }
          
          return game;
        });
        
        console.log('✓ 数据格式修复完成');
        
        // 更新游戏数据
        window.gameData = fixedData;
        
        // 保存到本地存储
        try {
          localStorage.setItem('spirit_cage_games_data', JSON.stringify(fixedData));
          localStorage.setItem('spirit_cage_games_timestamp', new Date().getTime().toString());
          console.log('✓ 数据已保存到本地存储');
        } catch (error) {
          console.error('保存到本地存储失败:', error);
        }
        
        // 触发游戏数据加载完成事件
        const event = new CustomEvent('gamesDataLoaded', {
          detail: fixedData
        });
        document.dispatchEvent(event);
        console.log('✓ 已触发gamesDataLoaded事件');
        
        console.log('=== 修复完成 ===');
        console.log('现在请刷新页面，应该可以看到全部', fixedData.length, '个游戏了');
        
        // 添加刷新按钮
        const refreshBtn = document.createElement('button');
        refreshBtn.textContent = '刷新页面';
        refreshBtn.style.position = 'fixed';
        refreshBtn.style.top = '10px';
        refreshBtn.style.right = '10px';
        refreshBtn.style.zIndex = '9999';
        refreshBtn.style.padding = '10px 15px';
        refreshBtn.style.backgroundColor = '#4CAF50';
        refreshBtn.style.color = 'white';
        refreshBtn.style.border = 'none';
        refreshBtn.style.borderRadius = '4px';
        refreshBtn.style.cursor = 'pointer';
        refreshBtn.style.fontSize = '16px';
        
        refreshBtn.addEventListener('click', function() {
          location.reload();
        });
        
        document.body.appendChild(refreshBtn);
        
      } else {
        console.error('加载的数据不是有效的游戏数组');
      }
    })
    .catch(error => {
      console.error('加载游戏数据失败:', error);
      console.log('尝试从备用URL加载...');
      
      // 尝试从绝对路径加载
      fetch('/games_data.json')
        .then(response => response.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            console.log('✓ 从备用URL成功加载游戏数据，数量:', data.length);
            window.gameData = data;
            
            // 触发游戏数据加载完成事件
            const event = new CustomEvent('gamesDataLoaded', {
              detail: data
            });
            document.dispatchEvent(event);
          } else {
            console.error('从备用URL加载的数据不是有效的游戏数组');
          }
        })
        .catch(backupError => {
          console.error('备用URL加载也失败:', backupError);
        });
    });
})(); 