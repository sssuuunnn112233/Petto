// pages/edit-profile/index.js
const { cloudApi, handleCloudError } = require('../../utils/cloudApi')

Page({
  data: {
    userInfo: {
      name: '',
      avatar: '',
      gender: '',
      bio: ''
    },
    canSave: false,
    originalData: {},
    useCloudData: true,
    cloudError: false
  },

  onLoad(options) {
    // 获取传入的用户信息
    this.loadUserData();
    this.testCloudConnection();
  },

  // 测试云开发连接
  async testCloudConnection() {
    try {
      const result = await cloudApi.user.getProfile()
      if (result.success) {
        this.setData({ useCloudData: true, cloudError: false })
      } else {
        this.setData({ useCloudData: false, cloudError: true })
      }
    } catch (error) {
      this.setData({ useCloudData: false, cloudError: true })
    }
  },

  loadUserData() {
    // 从应用全局获取用户信息
    const app = getApp()
    const appUserInfo = app.getUserInfo()
    
    let userInfo = {
      name: '泡芙喵',
      avatar: '/images/user-avatar.png',
      gender: '♀',
      bio: '爱猫人士，喜欢记录和分享宠物日常~'
    }
    
    if (appUserInfo) {
      userInfo = {
        name: appUserInfo.nickname || appUserInfo.nickName || userInfo.name,
        avatar: appUserInfo.avatar || appUserInfo.avatarUrl || userInfo.avatar,
        gender: this.getGenderSymbol(appUserInfo.gender) || userInfo.gender,
        bio: appUserInfo.bio || userInfo.bio
      }
    }
    
    this.setData({
      userInfo: { ...userInfo },
      originalData: { ...userInfo },
      canSave: false
    });
  },

  // 转换性别数字为符号
  getGenderSymbol(gender) {
    switch (gender) {
      case 1: return '♂'
      case 2: return '♀'
      default: return '♀'
    }
  },

  // 转换性别符号为数字
  getGenderNumber(genderSymbol) {
    switch (genderSymbol) {
      case '♂': return 1
      case '♀': return 2
      default: return 2
    }
  },

  onNameInput(e) {
    const name = e.detail.value.trim();
    this.setData({
      'userInfo.name': name,
      canSave: this.checkCanSave()
    });
  },

  onGenderSelect(e) {
    const gender = e.currentTarget.dataset.gender;
    this.setData({
      'userInfo.gender': gender,
      canSave: this.checkCanSave()
    });
  },

  onBioInput(e) {
    const bio = e.detail.value;
    this.setData({
      'userInfo.bio': bio,
      canSave: this.checkCanSave()
    });
  },

  onChooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({
          'userInfo.avatar': tempFilePath,
          canSave: this.checkCanSave()
        });
      },
      fail: (err) => {
        console.error('选择头像失败:', err);
        wx.showToast({
          title: '选择头像失败',
          icon: 'none'
        });
      }
    });
  },

  checkCanSave() {
    const { userInfo, originalData } = this.data;
    return userInfo.name !== originalData.name ||
           userInfo.avatar !== originalData.avatar ||
           userInfo.gender !== originalData.gender ||
           userInfo.bio !== originalData.bio;
  },

  async onSave() {
    if (!this.data.canSave) {
      return;
    }

    const { userInfo } = this.data;
    
    // 验证必填字段
    if (!userInfo.name.trim()) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      });
      return;
    }

    if (!userInfo.gender) {
      wx.showToast({
        title: '请选择性别',
        icon: 'none'
      });
      return;
    }

    // 显示加载状态
    wx.showLoading({
      title: '保存中...'
    });

    try {
      // 先尝试上传头像到云存储（如果是新选择的头像）
      let avatarUrl = userInfo.avatar
      if (userInfo.avatar && userInfo.avatar.startsWith('wxfile://')) {
        avatarUrl = await this.uploadAvatarToCloud(userInfo.avatar)
      }

      // 准备更新数据
      const updateData = {
        nickName: userInfo.name,
        nickname: userInfo.name,
        avatarUrl: avatarUrl,
        avatar: avatarUrl,
        gender: this.getGenderNumber(userInfo.gender),
        bio: userInfo.bio
      }

      // 尝试同步到云端
      if (this.data.useCloudData && !this.data.cloudError) {
        try {
          const result = await cloudApi.user.updateProfile(updateData)
          if (result.success) {
            console.log('✅ 用户信息已同步到云端')
          } else {
            console.log('⚠️ 云端同步失败，仅保存到本地:', result.message)
            wx.showToast({
              title: '云端同步失败，已保存到本地',
              icon: 'none',
              duration: 2000
            })
          }
        } catch (error) {
          console.error('❌ 云端同步异常:', error)
          wx.showToast({
            title: '云端同步异常，已保存到本地',
            icon: 'none',
            duration: 2000
          })
        }
      } else {
        console.log('⚠️ 云端不可用，仅保存到本地')
        wx.showToast({
          title: '已保存到本地',
          icon: 'none',
          duration: 1500
        })
      }

      // 更新应用全局数据
      const app = getApp()
      app.updateUserInfo(updateData)

      // 保存到本地存储（备用）
      wx.setStorageSync('userInfo', {
        ...userInfo,
        avatar: avatarUrl
      })

      // 通知其他页面刷新数据
      this.notifyPagesRefresh()

      wx.hideLoading()
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })

      // 延迟返回上一页
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)

    } catch (error) {
      console.error('❌ 保存用户信息失败:', error)
      wx.hideLoading()
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      })
    }
  },

  // 上传头像到云存储
  async uploadAvatarToCloud(tempFilePath) {
    try {
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substr(2, 9)
      const cloudPath = `avatars/${timestamp}_${randomStr}.jpg`
      
      const uploadResult = await wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: tempFilePath
      })
      
      if (uploadResult.fileID) {
        console.log('✅ 头像上传成功:', uploadResult.fileID)
        return uploadResult.fileID
      } else {
        console.error('❌ 头像上传失败:', uploadResult)
        return tempFilePath // 返回原路径作为备用
      }
    } catch (error) {
      console.error('❌ 头像上传异常:', error)
      return tempFilePath // 返回原路径作为备用
    }
  },

  // 通知其他页面刷新数据
  notifyPagesRefresh() {
    const pages = getCurrentPages()
    
    // 通知个人主页刷新
    const profilePage = pages.find(page => page.route === 'pages/profile/index')
    if (profilePage && profilePage.onRefresh) {
      profilePage.onRefresh()
      console.log('✅ 已通知个人主页刷新')
    }
    
    // 通知社区页面刷新（更新用户发布的帖子作者信息）
    const communityPage = pages.find(page => page.route === 'pages/community/index')
    if (communityPage && communityPage.loadPosts) {
      communityPage.loadPosts(true)
      console.log('✅ 已通知社区页面刷新')
    }
    
    // 设置页面刷新标记，确保返回时刷新
    wx.setStorageSync('needRefreshProfile', true)
    
    console.log('✅ 已通知相关页面刷新数据')
  }
})
