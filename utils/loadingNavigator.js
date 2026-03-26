/**
 * 带loading页面的导航工具（已启用loading过渡效果）
 * 提供统一的页面跳转接口，支持智能loading过渡动画
 */

const LOADING_DURATION = 1000; // loading持续时间（优化为1秒）

// tabBar页面列表
const TAB_BAR_PAGES = [
  '/pages/game/index',
  '/pages/community/index', 
  '/pages/pet/index',
  '/pages/message/index',
  '/pages/profile/index'
];

/**
 * 智能导航 - 自动判断使用switchTab还是其他跳转方式
 * @param {string} targetUrl - 目标页面路径
 * @param {object} options - 配置选项
 * @param {string} options.method - 跳转方法: 'auto'(默认) | 'navigateTo' | 'redirectTo' | 'switchTab' | 'reLaunch'
 * @param {number} options.duration - loading持续时间(毫秒)，默认2000
 * @param {string} options.style - loading样式(1-4)，不指定则随机选择
 */
function smartNavigate(targetUrl, options = {}) {
  const {
    method = 'auto',
    duration = LOADING_DURATION,
    style
  } = options;

  let finalMethod = method;
  
  // 自动判断跳转方式
  if (method === 'auto') {
    // 确保路径以/开头进行比较
    const normalizedUrl = targetUrl.startsWith('/') ? targetUrl : `/${targetUrl}`;
    if (TAB_BAR_PAGES.includes(normalizedUrl)) {
      finalMethod = 'switchTab';
    } else {
      finalMethod = 'navigateTo';
    }
  }

  console.log('智能导航:', {
    targetUrl,
    originalMethod: method,
    finalMethod,
    duration,
    style: style || 'random'
  });

  // 启用loading过渡
  let loadingUrl = `/pages/loading/index?target=${encodeURIComponent(targetUrl)}&method=${finalMethod}&duration=${duration}`;
  if (style) {
    loadingUrl += `&style=${style}`;
  }
  
  console.log('智能导航跳转到loading页面:', loadingUrl);
  
  wx.navigateTo({ 
    url: loadingUrl,
    fail: (err) => {
      console.error('智能导航跳转到loading页面失败:', err);
      // 如果loading页面跳转失败，直接跳转到目标页面
      wx[finalMethod]({
        url: targetUrl,
        fail: (err2) => {
          console.error('智能导航直接跳转也失败:', err2);
          wx.showToast({
            title: '跳转失败，请重试',
            icon: 'none'
          });
        }
      });
    }
  });
}

/**
 * 启用loading过渡的导航工具
 * @param {string} targetUrl - 目标页面路径
 * @param {object} options - 配置选项
 * @param {string} options.method - 跳转方法: 'navigateTo'(默认) | 'redirectTo' | 'switchTab' | 'reLaunch'
 * @param {number} options.duration - loading持续时间(毫秒)，默认2000
 * @param {string} options.style - loading样式(1-4)，不指定则随机选择
 */
function navigateWithLoading(targetUrl, options = {}) {
  const {
    method = 'navigateTo',
    duration = LOADING_DURATION,
    style // 可选，不指定则随机选择背景
  } = options;

  console.log('启用loading过渡页导航:', {
    targetUrl,
    method,
    duration,
    style: style || 'random'
  });

  // 启用loading过渡
  let loadingUrl = `/pages/loading/index?target=${encodeURIComponent(targetUrl)}&method=${method}&duration=${duration}`;
  if (style) {
    loadingUrl += `&style=${style}`;
  }
  
  console.log('跳转到loading页面:', loadingUrl);
  
  // 跳转到loading页面
  wx.navigateTo({ 
    url: loadingUrl,
    fail: (err) => {
      console.error('跳转到loading页面失败:', err);
      // 如果loading页面跳转失败，直接跳转到目标页面
      wx[method]({
        url: targetUrl,
        fail: (err2) => {
          console.error('直接导航也失败:', err2);
          wx.showToast({
            title: '跳转失败，请重试',
            icon: 'none'
          });
        }
      });
    }
  });
}

/**
 * 快捷方法：navigateTo with loading
 * @param {string} url - 目标URL
 * @param {number} duration - loading时长，默认1000ms
 * @param {boolean} fast - 是否使用快速模式（600ms）
 */
function navigateTo(url, duration, fast = false) {
  const actualDuration = fast ? 600 : (duration || LOADING_DURATION);
  navigateWithLoading(url, { method: 'navigateTo', duration: actualDuration });
}

/**
 * 快捷方法：redirectTo with loading
 */
function redirectTo(url, duration, fast = false) {
  const actualDuration = fast ? 600 : (duration || LOADING_DURATION);
  navigateWithLoading(url, { method: 'redirectTo', duration: actualDuration });
}

/**
 * 快捷方法：switchTab with loading
 */
function switchTab(url, duration, fast = false) {
  const actualDuration = fast ? 600 : (duration || LOADING_DURATION);
  navigateWithLoading(url, { method: 'switchTab', duration: actualDuration });
}

module.exports = {
  smartNavigate,
  navigateWithLoading,
  navigateTo,
  redirectTo,
  switchTab,
  TAB_BAR_PAGES
};
