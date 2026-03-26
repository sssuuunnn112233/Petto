Page({
  data: {
    progress: 0,
    backgroundImage: '/assets/loading/1.gif', // 默认背景，会被随机替换
    isTargetPageReady: false, // 目标页面是否准备好
    minLoadingTime: 500, // 最小loading时间（毫秒）- 减少到500ms
    maxLoadingTime: 1000 // 最大loading时间（毫秒）- 减少到1000ms
  },

  onLoad(options) {
    console.log('Loading 页面参数:', options);
    
    const target = decodeURIComponent(options.target || '/pages/game/index');
    const method = options.method || 'navigateTo';
    const duration = parseInt(options.duration || '1000'); // 默认改为1秒
    const style = options.style; // 如果指定了style则使用指定的，否则随机
    
    console.log('Loading 解析参数:', { target, method, duration, style });
    
    // 随机选择背景图片或使用指定的样式
    const selectedStyle = style || this.getRandomStyle();
    this.setData({
      backgroundImage: `/assets/loading/${selectedStyle}.gif`
    });
    
    console.log('Loading 选择背景:', selectedStyle);
    
    this.targetPage = target;
    this.navMethod = method;
    this.loadStartTime = Date.now();
    
    // 添加全局超时保护，防止页面卡住
    this.globalTimeout = setTimeout(() => {
      console.log('⚠️ Loading页面全局超时，强制跳转');
      this.forceNavigation();
    }, 3000); // 3秒超时保护 - 从5秒减少到3秒
    
    // 立即开始预加载目标页面
    this.preloadTargetPage();
    
    // 开始智能loading
    this.startSmartLoading(duration);
  },

  // 随机选择1-4中的一个样式
  getRandomStyle() {
    return Math.floor(Math.random() * 4) + 1; // 生成1-4的随机数
  },

  // 预加载目标页面
  preloadTargetPage() {
    console.log('🚀 开始预加载目标页面:', this.targetPage);
    
    // 使用隐藏的方式预加载页面，但不显示
    // 这样可以让页面在后台开始加载资源
    const preloadStartTime = Date.now();
    
    // 模拟页面预加载检测
    setTimeout(() => {
      const preloadTime = Date.now() - preloadStartTime;
      console.log('📱 目标页面预加载完成，耗时:', preloadTime + 'ms');
      this.setData({ isTargetPageReady: true });
    }, Math.random() * 300 + 200); // 200-500ms的随机预加载时间
  },

  // 智能loading - 根据实际加载情况调整
  startSmartLoading(maxDuration) {
    console.log('🧠 开始智能loading，最大时长:', maxDuration);
    
    let progress = 0;
    const interval = 16; // 60fps的更新频率
    const minDuration = this.data.minLoadingTime;
    const maxDuration_actual = Math.min(maxDuration, this.data.maxLoadingTime);
    
    console.log('⏱️ Loading时间配置:', {
      minDuration,
      maxDuration_actual,
      originalMaxDuration: maxDuration
    });
    
    // 快速阶段：0-70% 在前60%的时间内完成
    const fastPhaseTime = maxDuration_actual * 0.6;
    const fastIncrement = (70 / fastPhaseTime) * interval;
    
    // 慢速阶段：70-95% 在后30%的时间内完成
    const slowPhaseTime = maxDuration_actual * 0.3;
    const slowIncrement = (25 / slowPhaseTime) * interval;
    
    // 等待阶段：95-100% 等待目标页面准备好
    
    this.loadingTimer = setInterval(() => {
      const elapsedTime = Date.now() - this.loadStartTime;
      
      if (progress < 70) {
        // 快速阶段
        progress += fastIncrement;
      } else if (progress < 95) {
        // 慢速阶段
        progress += slowIncrement;
      } else {
        // 等待阶段 - 检查目标页面是否准备好且达到最小时间
        if (this.data.isTargetPageReady && elapsedTime >= minDuration) {
          progress = 100;
          console.log('✅ 目标页面准备完成，开始跳转');
        } else if (elapsedTime >= maxDuration_actual) {
          // 超过最大时间，强制完成
          progress = 100;
          console.log('⏰ 达到最大时间，强制跳转');
        } else {
          // 缓慢增长到99%
          progress = Math.min(99, progress + 0.1);
        }
      }
      
      if (progress >= 100) {
        progress = 100;
        this.setData({ progress: Math.round(progress) });
        console.log('✅ Loading完成，总耗时:', elapsedTime + 'ms');
        clearInterval(this.loadingTimer);
        this.loadingTimer = null;
        this.loadingComplete();
      } else {
        this.setData({ progress: Math.round(progress) });
      }
    }, interval);
  },

  onUnload() {
    if (this.loadingTimer) {
      clearInterval(this.loadingTimer);
    }
    if (this.globalTimeout) {
      clearTimeout(this.globalTimeout);
    }
  },

  // 强制跳转（超时保护）
  forceNavigation() {
    if (this.loadingTimer) {
      clearInterval(this.loadingTimer);
      this.loadingTimer = null;
    }
    if (this.globalTimeout) {
      clearTimeout(this.globalTimeout);
      this.globalTimeout = null;
    }
    
    console.log('🚨 强制执行页面跳转');
    this.performNavigation();
  },

  loadingComplete() {
    if (this.loadingTimer) {
      clearInterval(this.loadingTimer);
      this.loadingTimer = null;
    }
    if (this.globalTimeout) {
      clearTimeout(this.globalTimeout);
      this.globalTimeout = null;
    }
    
    // 立即跳转，不再有额外延迟
    this.performNavigation();
  },

  // 执行页面跳转
  performNavigation() {
    console.log('🚀 开始执行页面跳转...');
    
    // 对于Tab页面，需要去掉URL中的参数
    let targetUrl = this.targetPage;
    let finalMethod = this.navMethod;
    
    // 定义tabbar页面列表
    const tabbarPages = [
      '/pages/game/index',
      '/pages/community/index', 
      '/pages/pet/index',
      '/pages/message/index',
      '/pages/profile/index'
    ];
    
    // 检查目标页面是否是tabbar页面
    const targetPath = targetUrl.split('?')[0];
    // 确保路径以/开头进行比较
    const normalizedPath = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
    const isTabbarPage = tabbarPages.includes(normalizedPath);
    
    if (isTabbarPage) {
      // 如果是tabbar页面，移除URL参数，并强制使用switchTab
      targetUrl = targetPath;
      finalMethod = 'switchTab';
    }
    
    console.log('Loading 跳转信息:', {
      method: this.navMethod,
      finalMethod: finalMethod,
      originalUrl: this.targetPage,
      finalUrl: targetUrl,
      isTabbarPage: isTabbarPage
    });
    
    const navOptions = { 
      url: targetUrl,
      success: () => {
        console.log('✅ Loading 跳转成功:', targetUrl);
      },
      fail: (err) => {
        console.error('❌ Loading 跳转失败:', err);
        // 如果跳转失败，尝试使用switchTab（可能是tabbar页面）
        if (isTabbarPage || finalMethod === 'switchTab') {
          console.log('🔄 尝试使用switchTab跳转...');
          wx.switchTab({ 
            url: targetUrl,
            success: () => {
              console.log('✅ switchTab跳转成功:', targetUrl);
            },
            fail: (err2) => {
              console.error('❌ switchTab也失败，尝试reLaunch:', err2);
              // 最后的备用方案
              wx.reLaunch({ 
                url: targetUrl,
                success: () => {
                  console.log('✅ reLaunch跳转成功:', targetUrl);
                },
                fail: (err3) => {
                  console.error('❌ 所有跳转方式都失败:', err3);
                }
              });
            }
          });
        } else {
          wx.showToast({
            title: '跳转失败',
            icon: 'none'
          });
          // 备用方案：返回上一页
          setTimeout(() => {
            console.log('🔙 跳转失败，尝试返回上一页');
            wx.navigateBack();
          }, 1500);
        }
      }
    };
    
    console.log('🎯 使用跳转方法:', finalMethod);
    
    switch(finalMethod) {
      case 'redirectTo':
        wx.redirectTo(navOptions);
        break;
      case 'switchTab':
        wx.switchTab(navOptions);
        break;
      case 'reLaunch':
        wx.reLaunch(navOptions);
        break;
      default:
        wx.navigateTo(navOptions);
    }
  }
});