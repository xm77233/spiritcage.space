// 全局变量
const API_URL = 'https://www.onlinegames.io/media/plugins/genGames/embed.json';
let allGames = []; // 存储所有游戏数据
let allTags = {}; // 存储所有标签及其计数

// DOM元素加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
  // 侧边栏切换功能
  const toggleSidebarBtn = document.getElementById('toggle-sidebar');
  if (toggleSidebarBtn) {
    toggleSidebarBtn.addEventListener('click', toggleSidebar);
    
    // 从本地存储读取侧边栏状态
    const sidebarHidden = localStorage.getItem('sidebarHidden') === 'true';
    // 在移动设备上默认隐藏侧边栏
    const isMobile = window.innerWidth <= 768;
    
    // 初始化侧边栏状态
    if (sidebarHidden || isMobile) {
      document.body.classList.add('sidebar-hidden');
      // 设置按钮位置
      toggleSidebarBtn.style.left = '15px';
      // 更新按钮图标方向
      const icon = toggleSidebarBtn.querySelector('i');
      if (icon) icon.style.transform = 'rotate(180deg)';
    } else {
      // 设置按钮位置为默认
      if (!isMobile) {
        toggleSidebarBtn.style.left = 'calc(var(--sidebar-width) - 15px)';
        // 重置按钮图标方向
        const icon = toggleSidebarBtn.querySelector('i');
        if (icon) icon.style.transform = 'rotate(0deg)';
      }
    }
    
    // 监听游戏数据更新事件
    document.addEventListener('gamesDataUpdated', function(e) {
      console.log('检测到游戏数据更新，正在重新加载页面...');
      // 更新全局游戏数据
      allGames = e.detail;
      
      // 重新处理所有标签
      processAllTags();
      
      // 根据当前页面类型重新渲染内容
      rerenderCurrentPage();
    });
    
    // 监听点击事件，当点击侧边栏外部区域时自动隐藏侧边栏（仅限移动设备）
    document.addEventListener('click', (e) => {
      if (isMobile && !document.body.classList.contains('sidebar-hidden')) {
        // 如果点击的不是侧边栏内部元素，也不是切换按钮
        if (!e.target.closest('.sidebar') && e.target !== toggleSidebarBtn && !toggleSidebarBtn.contains(e.target)) {
          toggleSidebar();
        }
      }
    });
    
    // 监听窗口大小变化
    window.addEventListener('resize', () => {
      const isMobileNow = window.innerWidth <= 768;
      // 是否侧边栏已隐藏
      const isSidebarHidden = document.body.classList.contains('sidebar-hidden');
      
      // 在移动设备上默认隐藏侧边栏
      if (isMobileNow && !isSidebarHidden) {
        document.body.classList.add('sidebar-hidden');
        toggleSidebarBtn.style.left = '15px';
        // 更新按钮图标方向
        const icon = toggleSidebarBtn.querySelector('i');
        if (icon) icon.style.transform = 'rotate(180deg)';
      }
      
      // 根据窗口大小和侧边栏状态设置按钮位置
      if (isMobileNow) {
        // 移动设备上按钮始终在左侧
        toggleSidebarBtn.style.left = '15px';
      } else if (isSidebarHidden) {
        // 桌面设备且侧边栏隐藏时
        toggleSidebarBtn.style.left = '15px';
      } else {
        // 桌面设备且侧边栏显示时
        toggleSidebarBtn.style.left = 'calc(var(--sidebar-width) - 15px)';
      }
    });
  }
  
  // 移动端导航切换（保留为兼容性考虑）
  const mobileToggle = document.querySelector('.mobile-toggle');
  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      document.body.classList.toggle('show-nav');
    });
  }

  // 获取当前页面类型
  const currentPage = document.body.dataset.page;

  // 加载游戏数据
  fetchGames().then(() => {
    // 根据页面类型执行不同的渲染逻辑
    switch (currentPage) {
      case 'home':
        renderFeaturedGames();
        renderNewGames(8); // 首页显示8个最新游戏
        break;
      case 'new-games':
        renderNewGames(); // 显示所有新游戏
        break;
      case 'tags':
        renderAllTags();
        break;
      case 'tag-detail':
        const tagName = new URLSearchParams(window.location.search).get('tag');
        if (tagName) {
          renderGamesByTag(tagName);
        }
        break;
      case 'all-games':
        renderAllGames();
        break;
    }
    
    // 更新标签下拉菜单
    updateTagsDropdown();
  }).catch(error => {
    console.error('Error fetching games:', error);
    document.querySelector('.main-content').innerHTML = `
      <div class="error-message">
        <h2>Failed to load games</h2>
        <p>Please try again later</p>
      </div>
    `;
  });
});

// 切换侧边栏显示/隐藏
function toggleSidebar() {
  const body = document.body;
  
  // 切换sidebar-hidden类
  body.classList.toggle('sidebar-hidden');
  
  // 添加抖动动画到切换按钮，增强视觉反馈
  const toggleBtn = document.getElementById('toggle-sidebar');
  if (toggleBtn) {
    // 添加切换动画
    toggleBtn.classList.add('toggle-animate');
    
    // 300毫秒后移除动画类
    setTimeout(() => {
      toggleBtn.classList.remove('toggle-animate');
    }, 300);
    
    // 确保按钮始终可见
    if (body.classList.contains('sidebar-hidden')) {
      // 侧边栏隐藏时，确保按钮位于正确位置
      toggleBtn.style.left = '15px';
      // 确保按钮图标旋转
      const icon = toggleBtn.querySelector('i');
      if (icon) icon.style.transform = 'rotate(180deg)';
    } else {
      // 侧边栏显示时，根据设备类型调整按钮位置
      if (window.innerWidth <= 768) {
        // 移动设备上按钮位置不变
        toggleBtn.style.left = '15px';
      } else {
        // 桌面设备上按钮位置随侧边栏变化
        toggleBtn.style.left = 'calc(var(--sidebar-width) - 15px)';
      }
      // 重置按钮图标旋转
      const icon = toggleBtn.querySelector('i');
      if (icon) icon.style.transform = 'rotate(0deg)';
    }
  }
  
  // 保存状态到本地存储
  localStorage.setItem('sidebarHidden', body.classList.contains('sidebar-hidden') ? 'true' : 'false');
}

// 获取游戏数据
async function fetchGames() {
  const loader = document.querySelector('.loader');
  try {
    if (loader) loader.style.display = 'flex';
    
    // 如果games-loader.js已经加载了游戏数据，优先使用
    if (window.gameData && window.gameData.length > 0) {
      console.log('使用本地游戏数据');
      allGames = window.gameData;
      processAllTags();
      return window.gameData;
    }
    
    // 否则尝试从远程获取
    console.log('尝试从远程获取游戏数据');
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const data = await response.json();
    allGames = data; // 存储所有游戏数据
    
    // 处理并统计所有标签
    processAllTags();
    
    return data;
  } catch (error) {
    console.error('获取游戏数据失败:', error);
    // 如果有本地游戏数据作为备份，仍然可以使用
    if (window.gameData && window.gameData.length > 0) {
      console.log('使用本地备份游戏数据');
      allGames = window.gameData;
      processAllTags();
      return window.gameData;
    }
    throw error;
  } finally {
    if (loader) loader.style.display = 'none';
  }
}

// 处理并统计所有标签
function processAllTags() {
  allGames.forEach(game => {
    if (game.tags && Array.isArray(game.tags)) {
      game.tags.forEach(tag => {
        if (allTags[tag]) {
          allTags[tag]++;
        } else {
          allTags[tag] = 1;
        }
      });
    }
  });
}

// 渲染精选游戏
function renderFeaturedGames() {
  const featuredContainer = document.querySelector('#featured-games');
  if (!featuredContainer) return;

  // 隐藏加载动画
  const loader = document.getElementById('featured-loader');
  if (loader) loader.style.display = 'none';

  // 随机选择12个游戏作为精选游戏（或者所有游戏，如果总数少于12个）
  const featuredCount = Math.min(12, allGames.length);
  const featuredGames = getRandomGames(allGames, featuredCount);
  
  // 清空容器
  featuredContainer.innerHTML = '';
  
  // 使用文档片段一次性添加所有卡片
  const fragment = document.createDocumentFragment();
  featuredGames.forEach(game => {
    fragment.appendChild(createGameCard(game));
  });
  
  featuredContainer.appendChild(fragment);
}

// 渲染最新游戏
function renderNewGames(limit = null) {
  const newGamesContainer = document.querySelector('#new-games');
  if (!newGamesContainer) return;

  // 隐藏加载动画
  const loader = document.getElementById('new-loader');
  if (loader) loader.style.display = 'none';

  // 按日期排序游戏（如果有日期字段）或使用最近获取的前N个
  let newGames = [...allGames];
  
  // 随机混合游戏顺序，以便在没有日期字段的情况下也能展示不同游戏
  newGames.sort(() => Math.random() - 0.5);
  
  const gameCount = limit ? Math.min(limit, newGames.length) : Math.min(20, newGames.length);
  newGames = newGames.slice(0, gameCount);
  
  // 清空容器
  newGamesContainer.innerHTML = '';
  
  // 使用文档片段一次性添加所有卡片
  const fragment = document.createDocumentFragment();
  newGames.forEach(game => {
    fragment.appendChild(createGameCard(game));
  });
  
  newGamesContainer.appendChild(fragment);
}

// 渲染所有游戏
function renderAllGames() {
  const allGamesContainer = document.querySelector('#all-games');
  if (!allGamesContainer) return;

  // 隐藏加载动画
  const loader = document.querySelector('.loader');
  if (loader) loader.style.display = 'none';

  // 清空容器
  allGamesContainer.innerHTML = '';
  
  // 创建包装容器
  const fragment = document.createDocumentFragment();
  
  // 使用批量处理方式渲染游戏
  const batchSize = 30; // 每批次处理的游戏数量
  const totalGames = allGames.length;
  let processedCount = 0;
  
  // 添加批处理渲染函数
  function renderNextBatch() {
    // 计算本批次需要处理的数量
    const currentBatchSize = Math.min(batchSize, totalGames - processedCount);
    if (currentBatchSize <= 0) {
      // 所有批次处理完毕，添加到DOM
      allGamesContainer.appendChild(fragment);
      return;
    }
    
    // 渲染当前批次
    const endIndex = processedCount + currentBatchSize;
    for (let i = processedCount; i < endIndex; i++) {
      fragment.appendChild(createGameCard(allGames[i]));
    }
    
    // 更新已处理计数
    processedCount += currentBatchSize;
    
    // 设置渲染下一批次的时间
    setTimeout(renderNextBatch, 10); // 短暂延迟允许浏览器更新UI
  }
  
  // 开始批处理渲染
  renderNextBatch();
}

// 渲染特定标签的游戏
function renderGamesByTag(tagName) {
  const tagGamesContainer = document.querySelector('#tag-games');
  if (!tagGamesContainer) return;

  // 更新页面标题
  const tagTitle = document.querySelector('#tag-title');
  if (tagTitle) {
    tagTitle.textContent = `Games Tagged: ${tagName}`;
  }

  // 筛选带有指定标签的游戏
  const taggedGames = allGames.filter(game => 
    game.tags && (
      (typeof game.tags === 'string' && game.tags.includes(tagName)) ||
      (Array.isArray(game.tags) && game.tags.includes(tagName))
    )
  );
  
  tagGamesContainer.innerHTML = '';
  if (taggedGames.length === 0) {
    tagGamesContainer.innerHTML = '<p>No games found with this tag</p>';
    return;
  }
  
  // 创建一个文档片段提高性能
  const fragment = document.createDocumentFragment();
  taggedGames.forEach(game => {
    fragment.appendChild(createGameCard(game));
  });
  
  // 一次性添加到DOM
  tagGamesContainer.appendChild(fragment);
}

// 渲染所有标签
function renderAllTags() {
  const tagsContainer = document.querySelector('#tags-grid');
  if (!tagsContainer) return;

  tagsContainer.innerHTML = '';
  
  // 将标签对象转换为数组并排序
  const sortedTags = Object.entries(allTags)
    .sort((a, b) => b[1] - a[1]); // 按照游戏数量降序排序
  
  sortedTags.forEach(([tag, count]) => {
    const tagCard = document.createElement('a');
    tagCard.href = `tag-detail.html?tag=${encodeURIComponent(tag)}`;
    tagCard.className = 'tag-card';
    tagCard.innerHTML = `
      <h3>${tag}</h3>
      <span class="tag-count">${count} games</span>
    `;
    tagsContainer.appendChild(tagCard);
  });
}

// 创建游戏卡片元素 - 优化版本
function createGameCard(game) {
  const card = document.createElement('div');
  card.className = 'game-card';
  
  // 处理可能不同格式的标签数据
  let tags = [];
  if (game.tags) {
    if (typeof game.tags === 'string') {
      tags = game.tags.split(',').map(tag => tag.trim()).filter(tag => tag).slice(0, 3);
    } else if (Array.isArray(game.tags)) {
      tags = game.tags.slice(0, 3);
    }
  }
  
  // 使用字符串模板一次性创建HTML内容 - 避免多次DOM操作
  const tagsHtml = tags.map(tag => 
    `<a href="tag-detail.html?tag=${encodeURIComponent(tag)}" class="game-tag">${tag}</a>`
  ).join('');
  
  // 设置卡片HTML
  card.innerHTML = `
    <a href="game.html?title=${encodeURIComponent(game.title || 'Game')}">
      <div class="game-image-container">
        <img src="${game.image || 'images/placeholder.jpg'}" alt="${game.title || 'Game'}" class="game-image" loading="lazy">
      </div>
      <div class="game-info">
        <h3 class="game-title">${game.title || 'Untitled Game'}</h3>
        ${tagsHtml ? `<div class="game-tags">${tagsHtml}</div>` : ''}
      </div>
    </a>
  `;
  
  return card;
}

// 从数组中随机获取n个元素
function getRandomGames(array, n) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

// 更新侧边栏标签下拉菜单
function updateTagsDropdown() {
  const dropdownContent = document.querySelector('.tags-dropdown-content');
  if (!dropdownContent) return;
  
  dropdownContent.innerHTML = '';
  
  // 最多显示10个最热门的标签
  const topTags = Object.entries(allTags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  topTags.forEach(([tag, count]) => {
    const tagLink = document.createElement('a');
    tagLink.href = `tag-detail.html?tag=${encodeURIComponent(tag)}`;
    tagLink.textContent = `${tag} (${count})`;
    dropdownContent.appendChild(tagLink);
  });
  
  // 添加"查看所有标签"链接
  const viewAllLink = document.createElement('a');
  viewAllLink.href = 'tags.html';
  viewAllLink.textContent = 'View All Tags';
  viewAllLink.style.borderTop = '1px solid #eee';
  viewAllLink.style.marginTop = '5px';
  viewAllLink.style.fontWeight = 'bold';
  dropdownContent.appendChild(viewAllLink);
}

// 根据当前页面类型重新渲染内容
function rerenderCurrentPage() {
  // 获取当前页面类型
  const currentPage = document.body.dataset.page;
  
  // 根据页面类型执行不同的渲染逻辑
  switch (currentPage) {
    case 'home':
      renderFeaturedGames();
      renderNewGames(8); // 首页显示8个最新游戏
      break;
    case 'new-games':
      renderNewGames(); // 显示所有新游戏
      break;
    case 'tags':
      renderAllTags();
      break;
    case 'tag-detail':
      const tagName = new URLSearchParams(window.location.search).get('tag');
      if (tagName) {
        renderGamesByTag(tagName);
      }
      break;
    case 'all-games':
      renderAllGames();
      break;
    case 'game-detail':
      // 如果是游戏详情页，重新加载游戏详情
      if (typeof loadGameDetails === 'function') {
        loadGameDetails();
      }
      break;
  }
  
  // 更新标签下拉菜单
  updateTagsDropdown();
}