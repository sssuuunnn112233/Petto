// pages/login/login.js
const app = getApp()

Page({
  data: {
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    isLoading: false
  },

  onLoad(options) {
    console.log('📱 登录页面加载')
    
    // 检查是否已经登录
    if (app.checkLoginStatus()) {
      console.log('✅ 用户已登录，跳转到首页')
      this.redirectToHome()
      return
    }
    
    // 检查跳转来源
    this.redirectUrl = options.redirect || '/pages/pet/index'
    console.log('🔗 登录成功后将跳转到:', this.redirectUrl)
  },

  // 微信授权登录
  async onWxLogin() {
    if (this.data.isLoading) return
    
    this.setData({ isLoading: true })
    
    try {
      const result = await app.wxLogin()
      
      if (result.success) {
        console.log('✅ 登录成功，准备跳转')
        
        // 延迟跳转，让用户看到成功提示
        setTimeout(() => {
          this.redirectToHome()
        }, 1500)
      } else {
        console.error('❌ 登录失败:', result.message)
      }
    } catch (error) {
      console.error('❌ 登录异常:', error)
    } finally {
      this.setData({ isLoading: false })
    }
  },

  // 跳转到首页
  redirectToHome() {
    const url = this.redirectUrl || '/pages/pet/index'
    const loadingNavigator = require('../../utils/loadingNavigator');
    
    console.log('🔄 登录成功，跳转到:', url);
    // 使用智能导航，自动判断是否为tabBar页面
    loadingNavigator.smartNavigate(url);
  },

  // 游客模式（暂时跳过登录）
  onGuestMode() {
    wx.showModal({
      title: '提示',
      content: '游客模式下部分功能将受限，建议登录获得完整体验',
      confirmText: '继续',
      cancelText: '去登录',
      success: (res) => {
        if (res.confirm) {
          // 设置游客模式标记
          wx.setStorageSync('guestMode', true)
          this.redirectToHome()
        }
      }
    })
  },

  // 查看隐私政策
  onPrivacyPolicy() {
    wx.showModal({
      title: '隐私政策',
      content: '我们重视您的隐私，仅会收集必要的用户信息用于提供更好的服务体验。您的个人信息将得到妥善保护。',
      showCancel: false,
      confirmText: '我知道了'
    })
  },

  // 联系客服
  onContactService() {
    wx.showModal({
      title: '联系我们',
      content: '如有问题，请通过小程序内的反馈功能联系我们，我们会及时为您解决。',
      showCancel: false,
      confirmText: '好的'
    })
  }
})