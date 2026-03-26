// app.js
App({
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    openid: null,
    unionid: null
  },

  onLaunch() {
    console.log('🚀 应用启动')

    // 初始化云开发
    wx.cloud.init({
      env: 'cloud1-5g8m4npnaa8acd18',
      traceUser: true
    })

    // 自动登录
    this.autoLogin()
  },

  // 自动登录
  async autoLogin() {
    try {
      console.log('🔍 检查登录状态...')

      // 检查本地是否有用户信息
      const localUserInfo = wx.getStorageSync('userInfo')
      const localOpenid = wx.getStorageSync('openid')

      if (localUserInfo && localOpenid) {
        console.log('📱 发现本地用户信息，尝试自动登录')
        this.globalData.userInfo = localUserInfo
        this.globalData.openid = localOpenid
        this.globalData.isLoggedIn = true

        // 静默登录，更新用户信息
        this.silentLogin()

        // 如果当前在登录页面，跳转到宠物页面
        const pages = getCurrentPages()
        if (pages.length > 0 && pages[pages.length - 1].route === 'pages/login/login') {
          wx.switchTab({
            url: '/pages/pet/index'
          })
        }
      } else {
        console.log('❌ 未找到本地用户信息，需要手动登录')
        // 如果不在登录页面，跳转到登录页面
        const pages = getCurrentPages()
        if (pages.length > 0 && pages[pages.length - 1].route !== 'pages/login/login') {
          wx.redirectTo({
            url: '/pages/login/login'
          })
        }
      }
    } catch (error) {
      console.error('❌ 自动登录失败:', error)
    }
  },

  // 静默登录（更新用户信息，不弹授权框）
  async silentLogin() {
    try {
      console.log('🔄 执行静默登录...')

      const result = await wx.cloud.callFunction({
        name: 'login',
        data: {}
      })

      if (result.result && result.result.success) {
        const userData = result.result.data
        console.log('✅ 静默登录成功:', userData.user.nickname)

        // 更新全局数据
        this.globalData.userInfo = userData.user
        this.globalData.openid = userData.openid
        this.globalData.unionid = userData.unionid
        this.globalData.isLoggedIn = true

        // 更新本地存储
        wx.setStorageSync('userInfo', userData.user)
        wx.setStorageSync('openid', userData.openid)
        if (userData.unionid) {
          wx.setStorageSync('unionid', userData.unionid)
        }
      } else {
        console.error('❌ 静默登录失败:', result.result?.message)
      }
    } catch (error) {
      console.error('❌ 静默登录异常:', error)
    }
  },

  // 微信授权登录
  async wxLogin() {
    try {
      console.log('🔐 开始微信授权登录...')

      // 获取用户授权
      const userProfile = await this.getUserProfile()
      if (!userProfile) {
        throw new Error('用户取消授权')
      }

      console.log('👤 获取用户信息成功:', userProfile.userInfo.nickName)

      // 调用登录云函数
      wx.showLoading({ title: '登录中...' })

      const result = await wx.cloud.callFunction({
        name: 'login',
        data: {
          userInfo: userProfile.userInfo
        }
      })

      wx.hideLoading()

      if (result.result && result.result.success) {
        const userData = result.result.data
        console.log('✅ 微信登录成功:', userData.user.nickname)

        // 更新全局数据
        this.globalData.userInfo = userData.user
        this.globalData.openid = userData.openid
        this.globalData.unionid = userData.unionid
        this.globalData.isLoggedIn = true

        // 保存到本地存储
        wx.setStorageSync('userInfo', userData.user)
        wx.setStorageSync('openid', userData.openid)
        if (userData.unionid) {
          wx.setStorageSync('unionid', userData.unionid)
        }

        // 显示登录成功提示
        if (userData.user.isNewUser) {
          wx.showToast({
            title: '欢迎加入Petto！',
            icon: 'success',
            duration: 2000
          })
        } else {
          wx.showToast({
            title: `欢迎回来，${userData.user.nickname}！`,
            icon: 'success',
            duration: 2000
          })
        }

        return { success: true, data: userData }
      } else {
        const errorMsg = result.result?.message || '登录失败'
        console.error('❌ 微信登录失败:', errorMsg)
        wx.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 2000
        })
        return { success: false, message: errorMsg }
      }
    } catch (error) {
      wx.hideLoading()
      console.error('❌ 微信登录异常:', error)

      let errorMsg = '登录失败'
      if (error.message === '用户取消授权') {
        errorMsg = '需要授权才能使用完整功能'
      } else if (error.errMsg && error.errMsg.includes('getUserProfile')) {
        errorMsg = '获取用户信息失败'
      }

      wx.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 2000
      })

      return { success: false, message: errorMsg }
    }
  },

  // 获取用户信息
  getUserProfile() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          console.log('👤 用户授权成功:', res.userInfo.nickName)
          resolve(res)
        },
        fail: (err) => {
          console.log('❌ 用户拒绝授权:', err)
          reject(new Error('用户取消授权'))
        }
      })
    })
  },

  // 退出登录
  logout() {
    console.log('👋 用户退出登录')

    // 清空全局数据
    this.globalData.userInfo = null
    this.globalData.isLoggedIn = false
    this.globalData.openid = null
    this.globalData.unionid = null

    // 清空本地存储
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('openid')
    wx.removeStorageSync('unionid')

    // 清空其他相关数据
    wx.removeStorageSync('likedPosts')
    wx.removeStorageSync('favoritedPosts')
    wx.removeStorageSync('postComments')
    wx.removeStorageSync('likedComments')

    wx.showToast({
      title: '已退出登录',
      icon: 'success',
      duration: 1500
    })
  },

  // 检查登录状态
  checkLoginStatus() {
    return this.globalData.isLoggedIn && this.globalData.userInfo && this.globalData.openid
  },

  // 获取用户信息
  getUserInfo() {
    return this.globalData.userInfo
  },

  // 获取OpenID
  getOpenId() {
    return this.globalData.openid
  },

  // 更新用户信息
  updateUserInfo(newUserInfo) {
    console.log('🔄 更新应用全局用户信息:', newUserInfo)

    // 合并新的用户信息
    this.globalData.userInfo = {
      ...this.globalData.userInfo,
      ...newUserInfo
    }

    // 同步更新本地存储
    wx.setStorageSync('userInfo', this.globalData.userInfo)

    console.log('✅ 用户信息更新完成:', this.globalData.userInfo.nickname || this.globalData.userInfo.nickName)
  }
})

