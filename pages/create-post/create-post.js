// pages/create-post/create-post.js
const imagePool = require('../../utils/imagePool')

Page({
  data: {
    // 媒体文件
    mediaType: 'image', // image 或 video
    images: [],
    video: null,
    
    // 表单数据
    title: '',
    category: 'recommend',
    categories: [
      { id: 'recommend', name: '推荐' },
      { id: 'feeding', name: '喂养' },
      { id: 'care', name: '照料' },
      { id: 'play', name: '互动' },
      { id: 'growth', name: '成长' },
      { id: 'daily', name: '日常' }
    ],
    tags: [],
    selectedTags: [],
    availableTags: [],
    
    // UI状态
    showCategoryPicker: false,
    showTagPicker: false,
    isPublishing: false
  },

  onLoad(options) {
    // 检查登录状态
    const app = getApp()
    if (!app.checkLoginStatus()) {
      console.log('❌ 用户未登录，返回社区页面')
      wx.showModal({
        title: '提示',
        content: '请先登录后再发布帖子',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            const loadingNav = require('../../utils/loadingNavigator');
            loadingNav.redirectTo('/pages/login/login?redirect=' + encodeURIComponent('/pages/community/index'));
          } else {
            wx.navigateBack()
          }
        }
      })
      return
    }

    // 根据传入的分类设置默认分类
    if (options.category) {
      this.setData({ category: options.category })
    }
    this.updateAvailableTags()
    
    // 初始化 selectedTags 为空数组（如果还没有）
    if (!this.data.selectedTags) {
      this.setData({ selectedTags: [] })
    }

    console.log('✅ 创建帖子页面加载成功，用户已登录')
  },

  // 选择媒体类型
  onSelectMediaType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ mediaType: type })
    
    // 切换类型时清空已选内容
    if (type === 'image') {
      this.setData({ video: null })
    } else {
      this.setData({ images: [] })
    }
  },

  // 选择图片
  onChooseImage() {
    const maxCount = 9 - this.data.images.length
    if (maxCount <= 0) {
      wx.showToast({ title: '最多只能选择9张图片', icon: 'none' })
      return
    }

    wx.chooseMedia({
      count: maxCount,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newImages = res.tempFiles.map(file => file.tempFilePath)
        this.setData({
          images: [...this.data.images, ...newImages]
        })
      },
      fail: (err) => {
        console.error('选择图片失败:', err)
        wx.showToast({ title: '选择图片失败', icon: 'none' })
      }
    })
  },

  // 选择视频
  onChooseVideo() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['video'],
      sourceType: ['album', 'camera'],
      maxDuration: 60, // 最长60秒
      success: (res) => {
        this.setData({
          video: res.tempFiles[0].tempFilePath
        })
      },
      fail: (err) => {
        console.error('选择视频失败:', err)
        wx.showToast({ title: '选择视频失败', icon: 'none' })
      }
    })
  },

  // 删除图片
  onDeleteImage(e) {
    const index = e.currentTarget.dataset.index
    const images = this.data.images
    images.splice(index, 1)
    this.setData({ images })
  },

  // 删除视频
  onDeleteVideo() {
    this.setData({ video: null })
  },

  // 输入标题
  onTitleInput(e) {
    this.setData({ title: e.detail.value })
  },

  // 选择分类
  onSelectCategory(e) {
    const category = e.currentTarget.dataset.id
    this.setData({ category })
    this.updateAvailableTags()
  },

  // 更新可用标签
  updateAvailableTags() {
    const category = this.data.category
    const tagsByCategory = {
      recommend: ['推荐', '新手', '攻略', '养成', '精选'],
      feeding: ['喂养', '喂食', '营养', '食物', '能量'],
      care: ['照料', '清洁', '护理', '健康', '心情'],
      play: ['互动', '玩耍', '游戏', '娱乐', '快乐'],
      growth: ['成长', '进化', '升级', '培养', '记录'],
      daily: ['日常', '生活', '陪伴', '温馨', 'vlog']
    }
    this.setData({
      availableTags: tagsByCategory[category] || tagsByCategory.recommend
    })
  },

  // 切换标签选择
  onToggleTag(e) {
    const tag = e.currentTarget.dataset.tag
    
    if (!tag) {
      return
    }
    
    let selectedTags = this.data.selectedTags || []
    selectedTags = [...selectedTags] // 创建新数组
    const index = selectedTags.indexOf(tag)
    
    if (index > -1) {
      // 取消选择
      selectedTags.splice(index, 1)
    } else {
      // 选择标签
      if (selectedTags.length >= 3) {
        wx.showToast({ title: '最多选择3个标签', icon: 'none' })
        return
      }
      selectedTags.push(tag)
    }
    
    // 强制更新视图 - 使用新数组确保触发更新
    this.setData({ 
      selectedTags: [...selectedTags]
    })
  },

  // 返回
  onBack() {
    // 检查页面栈，如果是从loading页面跳转来的，直接跳转到社区页面
    const pages = getCurrentPages()
    if (pages.length >= 2) {
      const prevPage = pages[pages.length - 2]
      if (prevPage.route === 'pages/loading/index') {
        // 从loading页面跳转来的，直接跳转到社区页面
        wx.switchTab({
          url: '/pages/community/index'
        })
        return
      }
    }
    
    // 正常返回
    wx.navigateBack()
  },

  // 发布
  async onPublish() {
    // 验证
    if (this.data.mediaType === 'image' && this.data.images.length === 0) {
      wx.showToast({ title: '请至少选择一张图片', icon: 'none' })
      return
    }
    
    if (this.data.mediaType === 'video' && !this.data.video) {
      wx.showToast({ title: '请选择视频', icon: 'none' })
      return
    }
    
    if (!this.data.title.trim()) {
      wx.showToast({ title: '请输入标题', icon: 'none' })
      return
    }

    // 再次检查登录状态
    const app = getApp()
    if (!app.checkLoginStatus()) {
      wx.showModal({
        title: '提示',
        content: '登录状态已过期，请重新登录',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            const loadingNav = require('../../utils/loadingNavigator');
            loadingNav.redirectTo('/pages/login/login?redirect=' + encodeURIComponent('/pages/community/index'));
          }
        }
      })
      return
    }

    if (this.data.isPublishing) return

    this.setData({ isPublishing: true })

    // 显示发布中提示
    wx.showLoading({ title: '发布中...', mask: true })

    try {
      // 尝试发布到云端
      const cloudResult = await this.publishToCloud()
      
      if (cloudResult.success) {
        // 云端发布成功
        console.log('✅ 帖子已发布到云端:', cloudResult.data.postId || cloudResult.data._id)
        console.log('📊 云端帖子数据:', cloudResult.data)
        
        // 更新社区页面数据
        this.updateCommunityPage(cloudResult.data)
        
        wx.hideLoading()
        wx.showToast({
          title: '发布成功（已保存到云端）',
          icon: 'success',
          duration: 2000
        })

        // 延迟返回，让用户看到成功提示
        setTimeout(() => {
          this.setData({ isPublishing: false })
          // 直接跳转到社区页面，避免返回到loading页面
          wx.switchTab({
            url: '/pages/community/index'
          })
        }, 2000)
      } else {
        throw new Error(cloudResult.message || '发布失败')
      }
    } catch (error) {
      console.error('❌ 云端发布失败，使用本地模式:', error)
      
      // 云端发布失败，使用本地模式
      this.publishLocally()
    }
  },

  // 发布到云端
  async publishToCloud() {
    try {
      const { cloudApi } = require('../../utils/cloudApi')
      
      // 先上传图片到云存储
      let processedImages = []
      if (this.data.mediaType === 'image' && this.data.images.length > 0) {
        console.log('📤 开始上传图片到云存储...')
        wx.showLoading({ title: '上传图片中...', mask: true })
        
        processedImages = await this.processImagesForCloud()
        
        wx.showLoading({ title: '发布中...', mask: true })
        console.log('✅ 图片上传完成，开始创建帖子')
      }
      
      // 准备帖子数据
      const postData = {
        title: this.data.title.trim(),
        content: '这是一个精彩的帖子内容...', // 可以后续添加内容编辑功能
        category: this.data.category,
        tags: this.data.selectedTags.length > 0 ? this.data.selectedTags : this.getRandomTags(this.data.category),
        type: this.data.mediaType,
        images: processedImages,
        petType: this.getRandomPetType()
      }
      
      console.log('📤 准备发布到云端:', {
        ...postData,
        images: postData.images.map(img => img.length > 50 ? img.substring(0, 50) + '...' : img)
      })
      
      // 调用云函数创建帖子
      const result = await cloudApi.community.createPost(postData)
      
      if (result.success) {
        console.log('✅ 云端创建帖子成功:', result.data)
        
        // 转换为前端显示格式
        const displayPost = this.convertCloudPostToDisplay(result.data)
        
        // 保存到本地存储以便持久化
        this.savePostToLocal(displayPost)
        
        return { success: true, data: displayPost }
      } else {
        console.error('❌ 云端创建帖子失败:', result.message)
        return { success: false, message: result.message }
      }
    } catch (error) {
      console.error('❌ 云端发布异常:', error)
      return { success: false, message: error.message }
    }
  },

  // 保存帖子到本地存储
  savePostToLocal(post) {
    try {
      // 获取现有的本地帖子
      let localPosts = wx.getStorageSync('userPosts') || []
      
      // 添加新帖子到顶部
      localPosts.unshift(post)
      
      // 限制本地存储的帖子数量（最多保存50条）
      if (localPosts.length > 50) {
        localPosts = localPosts.slice(0, 50)
      }
      
      // 保存到本地存储
      wx.setStorageSync('userPosts', localPosts)
      
      console.log('✅ 帖子已保存到本地存储')
    } catch (error) {
      console.error('❌ 保存帖子到本地存储失败:', error)
    }
  },

  // 处理图片用于云端存储
  async processImagesForCloud() {
    try {
      const uploadedImages = []
      
      // 遍历所有选择的图片，上传到云存储
      for (let i = 0; i < this.data.images.length; i++) {
        const imagePath = this.data.images[i]
        
        try {
          // 生成唯一的文件名
          const timestamp = Date.now()
          const randomStr = Math.random().toString(36).substr(2, 9)
          const fileExtension = imagePath.split('.').pop() || 'jpg'
          const cloudPath = `posts/${timestamp}_${i}_${randomStr}.${fileExtension}`
          
          console.log(`📤 正在上传图片 ${i + 1}/${this.data.images.length}:`, cloudPath)
          
          // 上传图片到云存储
          const uploadResult = await wx.cloud.uploadFile({
            cloudPath: cloudPath,
            filePath: imagePath
          })
          
          if (uploadResult.fileID) {
            console.log(`✅ 图片 ${i + 1} 上传成功:`, uploadResult.fileID)
            uploadedImages.push(uploadResult.fileID)
          } else {
            console.error(`❌ 图片 ${i + 1} 上传失败:`, uploadResult)
            // 上传失败时使用图床URL作为备用
            uploadedImages.push(`https://picsum.photos/400/300?random=${timestamp + i}`)
          }
        } catch (uploadError) {
          console.error(`❌ 图片 ${i + 1} 上传异常:`, uploadError)
          // 上传异常时使用图床URL作为备用
          const timestamp = Date.now()
          uploadedImages.push(`https://picsum.photos/400/300?random=${timestamp + i}`)
        }
      }
      
      console.log('📊 图片处理完成:', uploadedImages.length, '张')
      return uploadedImages
    } catch (error) {
      console.error('❌ 图片处理失败:', error)
      // 如果整个过程失败，返回图床URL作为备用
      return this.data.images.map((img, index) => {
        return `https://picsum.photos/400/300?random=${Date.now() + index}`
      })
    }
  },

  // 转换云端帖子数据为显示格式
  convertCloudPostToDisplay(cloudPost) {
    const app = getApp()
    const userInfo = app.getUserInfo()
    
    return {
      id: cloudPost.postId || cloudPost._id,
      postId: cloudPost.postId || cloudPost._id,
      pokemonId: Math.floor(Math.random() * 150) + 1,
      type: cloudPost.type || 'image',
      image: cloudPost.images && cloudPost.images.length > 0 ? cloudPost.images[0] : 'https://picsum.photos/400/300?random=1',
      images: cloudPost.images || ['https://picsum.photos/400/300?random=1'],
      title: cloudPost.title,
      author: {
        name: userInfo?.nickname || userInfo?.nickName || '匿名用户',
        avatar: userInfo?.avatar || userInfo?.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg?seed=default&size=50'
      },
      baseLikeCount: 0,
      likeCount: 0,
      liked: false,
      baseFavoriteCount: 0,
      collectCount: 0,
      collected: false,
      petType: cloudPost.petType || this.getRandomPetType(),
      tags: cloudPost.tags || [],
      gameType: Math.floor(Math.random() * 3),
      gameStyle: 'pokemon',
      createdAt: cloudPost.createdAt || new Date().toISOString()
    }
  },

  // 本地发布（备用方案）
  publishLocally() {
    setTimeout(() => {
      // 生成新帖子数据
      const newPost = this.generateNewPost()
      
      if (!newPost) {
        // 生成帖子失败
        wx.hideLoading()
        this.setData({ isPublishing: false })
        return
      }
      
      // 更新社区页面数据
      this.updateCommunityPage(newPost)

      wx.hideLoading()
      wx.showToast({
        title: '发布成功（本地）',
        icon: 'success',
        duration: 1500
      })

      // 延迟返回，让用户看到成功提示
      // 延迟返回，让用户看到成功提示
      setTimeout(() => {
        this.setData({ isPublishing: false })
        // 直接跳转到社区页面，避免返回到loading页面
        wx.switchTab({
          url: '/pages/community/index'
        })
      }, 1500)
    }, 1000)
  },

  // 更新社区页面数据
  updateCommunityPage(newPost) {
    // 获取页面栈，找到社区页面并更新数据
    const pages = getCurrentPages()
    const communityPage = pages.find(page => page.route === 'pages/community/index')
    
    if (communityPage) {
      // 将新帖子添加到列表顶部
      const posts = [newPost, ...communityPage.data.posts]
      const allPosts = [newPost, ...communityPage.data.allPosts]
      
      communityPage.setData({
        posts,
        allPosts
      })
      
      console.log('✅ 帖子已添加到社区页面:', newPost.title)
    }
  },

  // 生成新帖子数据
  generateNewPost() {
    const { images, video, title, category, selectedTags, mediaType } = this.data
    
    // 获取应用全局用户信息
    const app = getApp()
    const userInfo = app.getUserInfo()
    
    if (!userInfo) {
      wx.showModal({
        title: '错误',
        content: '获取用户信息失败，请重新登录',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            const loadingNav = require('../../utils/loadingNavigator');
            loadingNav.redirectTo('/pages/login/login?redirect=' + encodeURIComponent('/pages/community/index'));
          }
        }
      })
      return null
    }
    
    // 生成随机ID（实际应该由服务器生成）
    const id = Date.now()
    
    // 随机选择一个宠物ID
    const pokemonRanges = {
      recommend: [1, 150],
      feeding: [152, 251],
      care: [387, 493],
      play: [494, 649],
      growth: [1, 251],
      daily: [1, 898]
    }
    const range = pokemonRanges[category] || [1, 150]
    const rangeSize = range[1] - range[0] + 1
    const randomPokemonId = Math.floor(Math.random() * rangeSize) + range[0]
    
    // 使用应用全局的用户信息
    const userName = userInfo.nickname || userInfo.nickName || '匿名用户'
    const userAvatar = userInfo.avatar || userInfo.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg?seed=default&size=50'
    
    console.log('📝 创建帖子，用户信息:', { userName, userAvatar })
    
    // 确定显示的图片
    let displayImage
    if (mediaType === 'image') {
      // 图片类型：使用第一张图片
      displayImage = images[0]
    } else {
      // 视频类型：使用宠物图片作为封面
      displayImage = this.getPokemonImageById(randomPokemonId)
    }
    
    // 生成稳定的postId（用于点赞状态匹配）
    // 用户发布的帖子使用时间戳作为postId，确保唯一性
    const postId = `user_${id}`
    
    return {
      id,
      postId: postId, // 保存稳定的postId用于点赞状态匹配
      pokemonId: randomPokemonId,
      type: mediaType,
      image: displayImage,
      video: mediaType === 'video' ? video : null,
      images: mediaType === 'image' ? images : [], // 保存所有图片
      title: title.trim(),
      author: {
        name: userName,
        avatar: userAvatar
      },
      baseLikeCount: 0, // 用户发布的帖子基础点赞数为0
      likeCount: 0, // 初始点赞数为0
      liked: false,
      baseFavoriteCount: 0, // 用户发布的帖子基础收藏数为0
      collectCount: 0, // 初始收藏数为0
      collected: false,
      petType: this.getRandomPetType(),
      tags: selectedTags.length > 0 ? selectedTags : this.getRandomTags(category),
      gameType: id % 3,
      gameStyle: 'pokemon',
      createdAt: new Date().toISOString()
    }
  },

  // 根据宠物ID获取图片
  getPokemonImageById(pokemonId) {
    return `/images/pokemon/${pokemonId}.png`
  },

  // 获取随机电子宠物类型
  getRandomPetType() {
    const types = ['🐾', '💕', '🌸', '🍀', '🌈', '⭐', '🎈', '🧸', '🎀', '💝']
    return types[Math.floor(Math.random() * types.length)]
  },

  // 获取随机标签
  getRandomTags(category) {
    const tagsByCategory = {
      recommend: ['推荐', '新手', '攻略'],
      feeding: ['喂养', '喂食', '营养'],
      care: ['照料', '清洁', '护理'],
      play: ['互动', '玩耍', '游戏'],
      growth: ['成长', '进化', '升级'],
      daily: ['日常', '生活', '陪伴']
    }
    const availableTags = tagsByCategory[category] || tagsByCategory.recommend
    const tagCount = Math.floor(Math.random() * 2) + 1
    const shuffled = [...availableTags].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, tagCount)
  }
})

