// pages/feedback/feedback.js
const { cloudApi, handleCloudError } = require('../../utils/cloudApi')

Page({
  data: {
    feedbackType: 'bug', // bug, suggestion, other
    feedbackTypes: [
      { value: 'bug', label: '🐛 Bug反馈', desc: '功能异常、闪退、卡顿等问题' },
      { value: 'suggestion', label: '💡 功能建议', desc: '新功能建议、体验优化建议' },
      { value: 'other', label: '💬 其他问题', desc: '账号问题、内容举报等' }
    ],
    title: '',
    content: '',
    contact: '',
    images: [],
    maxImages: 3,
    submitting: false,
    useCloudData: true,
    cloudError: false
  },

  onLoad() {
    this.testCloudConnection()
    this.loadUserContact()
  },

  // 测试云开发连接
  async testCloudConnection() {
    try {
      console.log('🔍 问题反馈页面测试云开发连接...')
      const result = await cloudApi.user.getProfile()
      
      if (result.success) {
        console.log('✅ 问题反馈页面云开发连接成功！')
        this.setData({ useCloudData: true, cloudError: false })
      } else {
        console.log('❌ 问题反馈页面云开发连接失败:', result.message)
        this.setData({ useCloudData: false, cloudError: true })
      }
    } catch (error) {
      console.log('❌ 问题反馈页面云开发连接异常:', error)
      this.setData({ useCloudData: false, cloudError: true })
    }
  },

  // 加载用户联系方式
  loadUserContact() {
    const app = getApp()
    const userInfo = app.getUserInfo()
    
    if (userInfo) {
      // 使用用户昵称作为默认联系方式
      this.setData({
        contact: userInfo.nickname || userInfo.nickName || ''
      })
    }
  },

  // 选择反馈类型
  onTypeSelect(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ feedbackType: type })
  },

  // 标题输入
  onTitleInput(e) {
    this.setData({ title: e.detail.value })
  },

  // 内容输入
  onContentInput(e) {
    this.setData({ content: e.detail.value })
  },

  // 联系方式输入
  onContactInput(e) {
    this.setData({ contact: e.detail.value })
  },

  // 选择图片
  onChooseImage() {
    const { images, maxImages } = this.data
    const remainCount = maxImages - images.length
    
    if (remainCount <= 0) {
      wx.showToast({
        title: `最多只能上传${maxImages}张图片`,
        icon: 'none'
      })
      return
    }

    wx.chooseMedia({
      count: remainCount,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newImages = res.tempFiles.map(file => ({
          path: file.tempFilePath,
          size: file.size
        }))
        
        this.setData({
          images: [...images, ...newImages]
        })
      },
      fail: (err) => {
        console.error('选择图片失败:', err)
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        })
      }
    })
  },

  // 预览图片
  onPreviewImage(e) {
    const index = e.currentTarget.dataset.index
    const urls = this.data.images.map(img => img.path)
    
    wx.previewImage({
      current: urls[index],
      urls: urls
    })
  },

  // 删除图片
  onDeleteImage(e) {
    const index = e.currentTarget.dataset.index
    const images = [...this.data.images]
    images.splice(index, 1)
    this.setData({ images })
  },

  // 提交反馈
  async onSubmit() {
    const { feedbackType, title, content, contact, images, submitting } = this.data
    
    if (submitting) return

    // 验证必填字段
    if (!title.trim()) {
      wx.showToast({
        title: '请输入问题标题',
        icon: 'none'
      })
      return
    }

    if (!content.trim()) {
      wx.showToast({
        title: '请详细描述问题',
        icon: 'none'
      })
      return
    }

    if (content.trim().length < 10) {
      wx.showToast({
        title: '问题描述至少10个字符',
        icon: 'none'
      })
      return
    }

    this.setData({ submitting: true })
    wx.showLoading({ title: '提交中...' })

    try {
      // 上传图片到云存储
      const imageUrls = await this.uploadImages(images)

      // 准备反馈数据
      const feedbackData = {
        type: feedbackType,
        title: title.trim(),
        content: content.trim(),
        contact: contact.trim(),
        images: imageUrls,
        deviceInfo: this.getDeviceInfo(),
        appVersion: '1.0.0',
        timestamp: new Date()
      }

      // 提交反馈
      const result = await this.submitFeedback(feedbackData)

      wx.hideLoading()

      if (result.success) {
        wx.showModal({
          title: '提交成功',
          content: '感谢您的反馈！我们会尽快处理您的问题。',
          showCancel: false,
          confirmText: '确定',
          success: () => {
            // 直接跳转到个人主页，避免loading页面问题
            wx.switchTab({
              url: '/pages/profile/index'
            })
          }
        })
      } else {
        wx.showToast({
          title: result.message || '提交失败，请重试',
          icon: 'none'
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('提交反馈失败:', error)
      wx.showToast({
        title: '提交失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ submitting: false })
    }
  },

  // 上传图片到云存储
  async uploadImages(images) {
    if (!images || images.length === 0) return []

    const uploadPromises = images.map(async (image, index) => {
      try {
        const timestamp = Date.now()
        const randomStr = Math.random().toString(36).substr(2, 9)
        const cloudPath = `feedback/${timestamp}_${index}_${randomStr}.jpg`
        
        const uploadResult = await wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: image.path
        })
        
        return uploadResult.fileID
      } catch (error) {
        console.error('图片上传失败:', error)
        return null
      }
    })

    const results = await Promise.all(uploadPromises)
    return results.filter(url => url !== null)
  },

  // 提交反馈到云端
  async submitFeedback(feedbackData) {
    if (this.data.useCloudData && !this.data.cloudError) {
      try {
        // 使用云函数提交反馈
        const result = await wx.cloud.callFunction({
          name: 'community', // 复用社区云函数
          data: {
            action: 'submitFeedback',
            feedbackData
          }
        })
        
        if (result.result && result.result.success) {
          return result.result
        } else {
          throw new Error(result.result?.message || '云端提交失败')
        }
      } catch (error) {
        console.error('云端提交失败:', error)
        // 降级到本地存储
        return this.saveFeedbackLocally(feedbackData)
      }
    } else {
      // 云端不可用，保存到本地
      return this.saveFeedbackLocally(feedbackData)
    }
  },

  // 保存反馈到本地存储
  saveFeedbackLocally(feedbackData) {
    try {
      const feedbacks = wx.getStorageSync('userFeedbacks') || []
      const newFeedback = {
        ...feedbackData,
        id: Date.now().toString(),
        status: 'pending',
        createdAt: new Date().toISOString()
      }
      
      feedbacks.unshift(newFeedback)
      
      // 只保留最近50条反馈
      if (feedbacks.length > 50) {
        feedbacks.splice(50)
      }
      
      wx.setStorageSync('userFeedbacks', feedbacks)
      
      console.log('✅ 反馈已保存到本地存储')
      return { success: true, message: '反馈已保存，将在网络恢复后同步' }
    } catch (error) {
      console.error('本地存储失败:', error)
      return { success: false, message: '保存失败，请重试' }
    }
  },

  // 获取设备信息
  getDeviceInfo() {
    try {
      const systemInfo = wx.getSystemInfoSync()
      return {
        platform: systemInfo.platform,
        system: systemInfo.system,
        version: systemInfo.version,
        model: systemInfo.model,
        brand: systemInfo.brand,
        screenWidth: systemInfo.screenWidth,
        screenHeight: systemInfo.screenHeight
      }
    } catch (error) {
      console.error('获取设备信息失败:', error)
      return {}
    }
  },

  // 查看反馈历史
  onViewHistory() {
    // 直接跳转，不使用loading页面
    wx.navigateTo({
      url: '/pages/feedback-history/feedback-history',
      success: () => {
        console.log('✅ 成功跳转到反馈历史页面');
      },
      fail: (err) => {
        console.error('❌ 跳转反馈历史页面失败:', err);
        wx.showToast({
          title: '页面不存在或打开失败',
          icon: 'none'
        });
      }
    });
  },

  // 返回上一页
  onBack() {
    // 直接跳转到个人主页，避免loading页面问题
    wx.switchTab({
      url: '/pages/profile/index',
      success: () => {
        console.log('✅ 成功返回个人主页');
      },
      fail: (err) => {
        console.error('❌ 返回个人主页失败:', err);
        // 如果switchTab失败，尝试navigateBack
        wx.navigateBack({
          fail: (err2) => {
            console.error('❌ navigateBack也失败:', err2);
            // 最后的备选方案：reLaunch到个人主页
            wx.reLaunch({
              url: '/pages/profile/index'
            });
          }
        });
      }
    });
  }
})