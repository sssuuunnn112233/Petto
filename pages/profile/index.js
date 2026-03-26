// pages/profile/index.js
const { cloudApi, handleCloudError } = require('../../utils/cloudApi')
const imagePool = require('../../utils/imagePool')

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    userPosts: [], // 用户发布的帖子
    userStats: {
      dynamic: 0,
      followers: 0,
      following: 0,
      likes: 0
    },
    totalFavorites: 0, // 添加总收藏数
    pets: [], // 用户的宠物
    loading: false,
    useCloudData: true,
    cloudError: false,
    // 签到相关数据
    checkInData: {
      hasCheckedToday: false,
      consecutiveDays: 0,
      totalCheckIns: 0,
      lastCheckInDate: null,
      todayReward: 10 // 今日签到奖励积分
    },
    showCheckinModal: false, // 控制签到记录弹窗显示
    calendarDays: [], // 日历数据
    // 游戏统计数据
    gameStats: {
      totalGames: 0,
      totalScore: 0,
      totalPoints: 0
    },
    defaultUserInfo: {
      name: '泡芙喵',
      avatar: '/assets/flipcards1/1/flipcards11.png',
      gender: '♀',
      bio: '爱猫人士，喜欢记录和分享宠物日常~',
      daysTogether: 99,
      stats: {
        dynamic: 0,
        followers: 0,
        following: 0,
        likes: 0
      },
      pets: [{
        id: 1,
        name: '旺仔',
        avatar: '/images/pet-wangzai.png',
        gender: '♂',
        age: '9个月',
        weight: '7kg'
      }]
    }
  },

  onLoad() {
    // 检查登录状态
    const app = getApp()
    if (!app.checkLoginStatus()) {
      console.log('❌ 用户未登录，跳转到登录页面')
      const loadingNav = require('../../utils/loadingNavigator');
      loadingNav.redirectTo('/pages/login/login?redirect=' + encodeURIComponent('/pages/profile/index'));
      return
    }
    
    console.log('🔄 Profile页面onLoad - 开始加载数据')
    this.loadUserData()
    this.testCloudConnection()
    this.loadCheckInData()
    
    // 确保在onLoad时也加载云端数据
    setTimeout(() => {
      this.loadCloudData()
    }, 500)
  },

  onShow() {
    // 每次显示页面时都重新加载用户数据
    const app = getApp()
    if (app.checkLoginStatus()) {
      console.log('🔄 Profile页面onShow - 重新加载数据')
      
      // 检查是否需要刷新
      const needRefresh = wx.getStorageSync('needRefreshProfile')
      if (needRefresh) {
        console.log('🔄 检测到刷新标记，强制刷新数据')
        wx.removeStorageSync('needRefreshProfile')
        
        // 强制刷新
        this.setData({ loading: true })
        setTimeout(() => {
          this.loadUserData()
          this.loadCloudData()
        }, 100)
      } else {
        // 正常加载
        this.loadUserData()
        // 始终重新加载云端数据，确保数据是最新的
        this.loadCloudData()
      }
    }
  },

  // 测试云开发连接
  async testCloudConnection() {
    try {
      console.log('🔍 个人主页测试云开发连接...')
      const result = await cloudApi.user.getProfile()
      
      if (result.success) {
        console.log('✅ 个人主页云开发连接成功！')
        this.setData({ useCloudData: true, cloudError: false })
      } else {
        console.log('❌ 个人主页云开发连接失败:', result.message)
        this.setData({ useCloudData: false, cloudError: true })
      }
    } catch (error) {
      console.log('❌ 个人主页云开发连接异常:', error)
      this.setData({ useCloudData: false, cloudError: true })
    }
  },

  loadUserData() {
    const app = getApp()
    const appUserInfo = app.getUserInfo()
    
    if (appUserInfo) {
      // 合并应用全局用户信息和默认信息
      const mergedUserInfo = {
        ...this.data.defaultUserInfo,
        name: appUserInfo.nickname || appUserInfo.nickName || this.data.defaultUserInfo.name,
        avatar: appUserInfo.avatar || appUserInfo.avatarUrl || this.data.defaultUserInfo.avatar,
        gender: this.getGenderSymbol(appUserInfo.gender) || this.data.defaultUserInfo.gender,
        bio: appUserInfo.bio || this.data.defaultUserInfo.bio
      }
      
      // 加载真实的宠物信息和相处天数
      this.loadRealPetData(mergedUserInfo)
      
      this.setData({
        userInfo: mergedUserInfo,
        isLoggedIn: true
      })
      
      console.log('✅ 用户信息加载成功:', mergedUserInfo.name)
    } else {
      // 使用默认信息
      this.setData({
        userInfo: this.data.defaultUserInfo,
        isLoggedIn: false
      })
      console.log('⚠️ 使用默认用户信息')
    }
  },

  // 加载真实的宠物数据和相处天数
  loadRealPetData(userInfo) {
    try {
      // 从本地存储获取宠物数据
      const petData = wx.getStorageSync('petData')
      
      if (petData && petData.name) {
        // 使用真实的宠物名字
        userInfo.pets = [{
          ...this.data.defaultUserInfo.pets[0],
          name: petData.name,
          avatar: petData.avatar || this.data.defaultUserInfo.pets[0].avatar
        }]
        
        // 计算真实的相处天数
        const createTime = petData.createTime || wx.getStorageSync('petCreateTime')
        if (createTime) {
          const today = new Date()
          const petCreateDate = new Date(createTime)
          const diffTime = today - petCreateDate
          const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
          userInfo.daysTogether = diffDays
        } else {
          // 如果没有创建时间，使用当前时间作为创建时间
          const now = new Date().toISOString()
          wx.setStorageSync('petCreateTime', now)
          userInfo.daysTogether = 1
        }
        
        console.log('✅ 真实宠物数据加载成功:', userInfo.pets[0].name, '相处', userInfo.daysTogether, '天')
      } else {
        // 如果没有宠物数据，创建默认宠物并设置创建时间
        const now = new Date().toISOString()
        const defaultPetData = {
          name: this.data.defaultUserInfo.pets[0].name,
          avatar: this.data.defaultUserInfo.pets[0].avatar,
          createTime: now
        }
        
        wx.setStorageSync('petData', defaultPetData)
        wx.setStorageSync('petCreateTime', now)
        userInfo.daysTogether = 1
        
        console.log('✅ 创建默认宠物数据:', defaultPetData.name)
      }
    } catch (error) {
      console.error('❌ 宠物数据加载失败:', error)
      // 使用默认数据
      userInfo.daysTogether = this.data.defaultUserInfo.daysTogether
    }
  },

  // 加载云端数据
  async loadCloudData() {
    if (!this.data.useCloudData || this.data.cloudError) {
      console.log('⚠️ 云端数据不可用，跳过加载')
      return
    }

    console.log('🔄 Profile页面开始加载云端数据...')
    this.setData({ loading: true })

    try {
      // 先加载帖子和宠物数据
      console.log('📡 开始并行加载帖子和宠物数据...')
      const [postsResult, petsResult] = await Promise.all([
        this.loadUserPosts(),
        this.loadUserPets()
      ])

      console.log('📊 帖子加载结果:', postsResult?.success ? '成功' : '失败')
      console.log('🐾 宠物加载结果:', petsResult?.success ? '成功' : '失败')

      // 帖子数据加载完成后，再加载统计数据
      console.log('📊 开始加载统计和游戏数据...')
      const [statsResult, gameStatsResult] = await Promise.all([
        this.loadUserStats(),
        this.loadGameStats()
      ])

      console.log('📈 统计加载结果:', statsResult?.success ? '成功' : '失败')
      console.log('🎮 游戏统计加载结果:', gameStatsResult?.success ? '成功' : '失败')

      console.log('✅ Profile页面云端数据加载完成')
    } catch (error) {
      console.error('❌ Profile页面云端数据加载失败:', error)
      handleCloudError(error, false)
    } finally {
      this.setData({ loading: false })
    }
  },

  // 加载用户发布的帖子
  async loadUserPosts() {
    try {
      console.log('🔍 Profile页面开始加载用户帖子...')
      const result = await cloudApi.community.getUserPosts(1, 20)
      
      console.log('📡 Profile页面API调用结果:', result)
      
      if (result.success) {
        const posts = result.data.posts.map(post => ({
          ...post,
          id: post._id,
          postId: post._id,
          image: this.processImageUrl(post.images?.[0]),
          images: post.images?.map(img => this.processImageUrl(img)) || []
        }))
        
        console.log('✅ Profile页面用户帖子处理完成:', posts.length, '条')
        console.log('📊 Profile页面帖子详情:', posts.map(p => ({ id: p.id, title: p.title })))
        
        // 计算总收藏数
        const totalFavorites = posts.reduce((sum, post) => {
          return sum + (post.favoriteCount || 0)
        }, 0)
        
        this.setData({ 
          userPosts: posts,
          totalFavorites: totalFavorites
        })
        
        console.log('✅ Profile页面用户帖子加载成功:', posts.length, '条，总收藏数:', totalFavorites)
        return result
      } else {
        console.log('❌ Profile页面用户帖子加载失败:', result.message)
        return result
      }
    } catch (error) {
      console.error('❌ Profile页面用户帖子加载异常:', error)
      throw error
    }
  },

  // 加载用户宠物信息
  async loadUserPets() {
    try {
      const result = await cloudApi.pet.get()
      
      if (result.success) {
        const pets = result.data.pets || [result.data]
        this.setData({ pets: pets })
        
        // 更新用户信息中的宠物数据和相处天数
        if (pets.length > 0) {
          const updatedUserInfo = { ...this.data.userInfo }
          updatedUserInfo.pets = pets
          
          // 计算与第一只宠物的相处天数
          const firstPet = pets[0]
          if (firstPet.createTime) {
            const today = new Date()
            const petCreateDate = new Date(firstPet.createTime)
            const diffTime = today - petCreateDate
            const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
            updatedUserInfo.daysTogether = diffDays
          }
          
          this.setData({ userInfo: updatedUserInfo })
          console.log('✅ 用户宠物加载成功:', pets[0].name, '相处', updatedUserInfo.daysTogether, '天')
        }
        
        return result
      } else {
        console.log('❌ 用户宠物加载失败:', result.message)
        // 使用本地宠物数据
        this.loadLocalPetData()
        return result
      }
    } catch (error) {
      console.error('❌ 用户宠物加载异常:', error)
      // 使用本地宠物数据
      this.loadLocalPetData()
      throw error
    }
  },

  // 加载本地宠物数据作为备用
  loadLocalPetData() {
    try {
      const petData = wx.getStorageSync('petData')
      if (petData && petData.name) {
        const pets = [{
          ...this.data.defaultUserInfo.pets[0],
          name: petData.name,
          avatar: petData.avatar || this.data.defaultUserInfo.pets[0].avatar
        }]
        
        const updatedUserInfo = { ...this.data.userInfo }
        updatedUserInfo.pets = pets
        
        // 计算相处天数
        const createTime = petData.createTime || wx.getStorageSync('petCreateTime')
        if (createTime) {
          const today = new Date()
          const petCreateDate = new Date(createTime)
          const diffTime = today - petCreateDate
          const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
          updatedUserInfo.daysTogether = diffDays
        }
        
        this.setData({ 
          pets: pets,
          userInfo: updatedUserInfo
        })
        
        console.log('✅ 本地宠物数据加载成功:', pets[0].name, '相处', updatedUserInfo.daysTogether, '天')
      } else {
        // 使用默认宠物
        this.setData({ pets: this.data.defaultUserInfo.pets })
      }
    } catch (error) {
      console.error('❌ 本地宠物数据加载失败:', error)
      this.setData({ pets: this.data.defaultUserInfo.pets })
    }
  },

  // 加载用户统计数据
  async loadUserStats() {
    try {
      // 优先从云端获取真实统计数据
      if (this.data.useCloudData && !this.data.cloudError) {
        console.log('🔍 尝试从云端获取用户统计数据...')
        
        try {
          const result = await cloudApi.community.getUserStats()
          console.log('📊 云端统计数据结果:', result)
          
          if (result.success) {
            const stats = result.data
            this.setData({ userStats: stats })
            
            // 更新用户信息中的统计数据
            const updatedUserInfo = {
              ...this.data.userInfo,
              stats: stats
            }
            this.setData({ userInfo: updatedUserInfo })
            
            console.log('✅ 云端用户统计数据加载成功:', stats)
            return { success: true, data: stats }
          } else {
            console.log('⚠️ 云端统计数据获取失败，原因:', result.message)
            // 继续执行本地计算，不抛出错误
          }
        } catch (cloudError) {
          console.log('⚠️ 云端统计数据请求异常:', cloudError.message || cloudError)
          // 继续执行本地计算，不抛出错误
        }
      } else {
        console.log('⚠️ 云端数据不可用，直接使用本地计算')
      }
      
      // 云端数据获取失败时，使用本地数据计算
      console.log('📊 使用本地数据计算统计信息...')
      console.log('📊 当前帖子数据:', this.data.userPosts.length, '条')
      const postsCount = this.data.userPosts.length
      
      // 计算总点赞数（所有帖子的点赞数之和）
      const totalLikes = this.data.userPosts.reduce((sum, post) => {
        return sum + (post.likeCount || 0)
      }, 0)
      
      console.log('❤️ 计算总点赞数:', totalLikes)
      
      // 从本地存储获取关注数据（如果有的话）
      const localStats = wx.getStorageSync('userStats') || {}
      
      const stats = {
        dynamic: postsCount,
        likes: totalLikes,
        followers: localStats.followers || 0, // 使用本地存储的粉丝数，默认0
        following: localStats.following || 0   // 使用本地存储的关注数，默认0
      }
      
      this.setData({ userStats: stats })
      
      // 更新用户信息中的统计数据
      const updatedUserInfo = {
        ...this.data.userInfo,
        stats: stats
      }
      this.setData({ userInfo: updatedUserInfo })
      
      console.log('✅ 本地用户统计数据计算完成:', stats)
      return { success: true, data: stats }
    } catch (error) {
      console.warn('⚠️ 用户统计数据加载异常，使用基础数据:', error.message || error)
      
      // 异常情况下使用最基本的数据
      const basicStats = {
        dynamic: this.data.userPosts.length || 0,
        likes: 0,
        followers: 0,
        following: 0
      }
      
      this.setData({ userStats: basicStats })
      
      const updatedUserInfo = {
        ...this.data.userInfo,
        stats: basicStats
      }
      this.setData({ userInfo: updatedUserInfo })
      
      console.log('⚠️ 使用基础统计数据:', basicStats)
      return { success: true, data: basicStats } // 返回成功，避免上层错误
    }
  },

  // 加载游戏统计数据
  async loadGameStats() {
    try {
      console.log('🎮 加载游戏统计数据...')
      
      // 检查是否有修复后的数据
      const fixedStats = wx.getStorageSync('gameStatsFixed')
      if (fixedStats) {
        console.log('✅ 使用修复后的统计数据:', fixedStats)
        
        // 确保包含积分信息
        const gameStats = {
          totalGames: fixedStats.totalGames || 0,
          totalScore: fixedStats.totalScore || 0,
          bestScore: fixedStats.bestScore || 0,
          totalPoints: fixedStats.totalPoints || wx.getStorageSync('userPoints') || 0
        }
        
        this.setData({ gameStats })
        return { success: true, data: gameStats }
      }
      
      // 使用直接计算方式（不依赖云函数）
      console.log('🎯 使用直接计算方式获取游戏统计...')
      const directStats = await this.calculateGameStatsDirectly()
      
      if (directStats.success) {
        this.setData({ gameStats: directStats.data })
        console.log('✅ 直接计算游戏统计成功:', directStats.data)
        return directStats
      }
      
      // 如果直接计算也失败，使用云函数作为备用
      if (this.data.useCloudData && !this.data.cloudError) {
        const result = await cloudApi.game.getStats()
        
        if (result.success) {
          const gameStats = {
            totalGames: result.data.totalGames || 0,
            totalScore: result.data.totalScore || 0,
            totalPoints: result.data.totalPoints || wx.getStorageSync('userPoints') || 0,
            bestScore: result.data.bestScore || 0
          }
          
          this.setData({ gameStats })
          console.log('✅ 云函数游戏统计成功:', gameStats)
          return { success: true, data: gameStats }
        }
      }
      
      // 最后的默认数据
      const localPoints = wx.getStorageSync('userPoints') || 0
      const defaultStats = {
        totalGames: 0,
        totalScore: 0,
        bestScore: 0,
        totalPoints: localPoints
      }
      
      this.setData({ gameStats: defaultStats })
      console.log('⚠️ 使用默认游戏统计数据:', defaultStats)
      return { success: true, data: defaultStats }
    } catch (error) {
      console.error('❌ 游戏统计数据加载异常:', error)
      
      const localPoints = wx.getStorageSync('userPoints') || 0
      const defaultStats = {
        totalGames: 0,
        totalScore: 0,
        bestScore: 0,
        totalPoints: localPoints
      }
      
      this.setData({ gameStats: defaultStats })
      throw error
    }
  },

  // 直接计算游戏统计（不依赖用户表和云函数）
  async calculateGameStatsDirectly() {
    try {
      console.log('🎯 开始直接计算游戏统计...')
      
      const db = wx.cloud.database()
      
      // 直接查询所有游戏记录
      const allRecordsResult = await db.collection('gamerecords').get()
      
      if (!allRecordsResult.data || allRecordsResult.data.length === 0) {
        console.log('⚠️ 没有找到游戏记录')
        return { success: false, message: '没有游戏记录' }
      }
      
      const records = allRecordsResult.data
      console.log(`📊 找到 ${records.length} 条游戏记录`)
      
      // 计算统计数据
      let totalScore = 0
      let bestScore = 0
      let totalGames = records.length
      let totalPoints = 0
      
      records.forEach((record) => {
        const score = record.score || 0
        const exp = record.experienceGained || 0
        
        totalScore += score
        totalPoints += exp
        
        if (score > bestScore) {
          bestScore = score
        }
      })
      
      const stats = {
        totalGames,
        totalScore,
        bestScore,
        totalPoints
      }
      
      console.log('✅ 直接计算结果:', stats)
      
      return { success: true, data: stats }
      
    } catch (error) {
      console.error('❌ 直接计算游戏统计失败:', error)
      return { success: false, message: error.message }
    }
  },

  // 初始化游戏数据（如果需要）
  async initializeGameDataIfNeeded() {
    try {
      // 检查是否已经尝试过初始化
      const hasTriedInit = wx.getStorageSync('hasTriedGameInit')
      if (hasTriedInit) {
        console.log('⚠️ 已尝试过初始化，跳过')
        return
      }
      
      console.log('🎮 开始初始化游戏数据...')
      
      // 简化的游戏数据初始化
      const defaultGameStats = {
        totalGames: 0,
        totalScore: 0,
        bestScore: 0,
        totalPoints: 0
      }
      
      wx.setStorageSync('gameStats', defaultGameStats)
      
      console.log('✅ 游戏数据初始化成功')
      
      // 重新加载游戏统计
      setTimeout(() => {
        this.loadGameStats()
      }, 1000)
      
      wx.showToast({
        title: '游戏数据已初始化',
        icon: 'success',
        duration: 2000
      })
      
      // 标记已尝试初始化
      wx.setStorageSync('hasTriedGameInit', true)
      
    } catch (error) {
      console.error('❌ 初始化游戏数据异常:', error)
    }
  },

  // 处理图片URL
  processImageUrl(imageUrl) {
    if (!imageUrl) {
      return imagePool.getRandomImage()
    }
    
    // 如果是云存储文件ID，直接返回
    if (imageUrl.startsWith('cloud://')) {
      return imageUrl
    }
    
    // 如果是本地路径，转换为图床URL
    if (imageUrl.startsWith('/images/pokemon/')) {
      return imagePool.getRandomImage()
    }
    
    return imageUrl
  },

  // 转换性别数字为符号
  getGenderSymbol(gender) {
    switch (gender) {
      case 1: return '♂'
      case 2: return '♀'
      default: return '♀'
    }
  },

  // 查看我的动态
  onViewMyPosts() {
    const loadingNav = require('../../utils/loadingNavigator');
    loadingNav.navigateTo('/pages/my-posts/my-posts');
  },

  // 查看游戏记录
  onViewGameRecords() {
    const loadingNav = require('../../utils/loadingNavigator');
    loadingNav.navigateTo('/pages/game-records/game-records');
  },

  // 查看用户帖子详情
  onPostTap(e) {
    const post = e.currentTarget.dataset.post
    if (!post) return
    
    const loadingNav = require('../../utils/loadingNavigator');
    const url = `/pages/post-detail/post-detail?id=${post.id}&postId=${encodeURIComponent(post.postId)}&title=${encodeURIComponent(post.title || '')}&authorName=${encodeURIComponent(post.author?.name || '')}&authorAvatar=${encodeURIComponent(post.author?.avatar || '')}&images=${encodeURIComponent(JSON.stringify(post.images))}&baseLikeCount=${post.likeCount || 0}&baseFavoriteCount=${post.favoriteCount || 0}`
    
    loadingNav.navigateTo(url);
  },

  onEditProfile() {
    const loadingNav = require('../../utils/loadingNavigator');
    loadingNav.navigateTo('/pages/edit-profile/index');
  },

  onPetTap(e) {
    const pet = e.currentTarget.dataset.pet;
    wx.showToast({
      title: `查看${pet.name}的详情`,
      icon: 'none'
    });
  },

  // 查看成就
  onViewAchievements() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 分享个人主页
  onShareProfile() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 查看数据统计
  onViewStats() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 刷新数据
  onRefresh() {
    if (this.data.loading) return
    
    console.log('🔄 刷新个人主页数据')
    this.loadUserData()
    this.loadCloudData()
    this.loadCheckInData()
  },

  // ==================== 签到相关功能 ====================

  // 加载签到数据
  loadCheckInData() {
    try {
      const checkInData = wx.getStorageSync('checkInData') || {
        hasCheckedToday: false,
        consecutiveDays: 0,
        totalCheckIns: 0,
        lastCheckInDate: null,
        todayReward: 10
      }
      
      // 检查是否是新的一天
      const today = new Date().toDateString()
      const lastCheckIn = checkInData.lastCheckInDate
      
      if (lastCheckIn !== today) {
        // 如果不是今天，重置今日签到状态
        checkInData.hasCheckedToday = false
        
        // 检查连续签到
        if (lastCheckIn) {
          const lastDate = new Date(lastCheckIn)
          const todayDate = new Date(today)
          const diffTime = todayDate - lastDate
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          
          if (diffDays > 1) {
            // 断签了，重置连续天数
            checkInData.consecutiveDays = 0
          }
        }
      }
      
      this.setData({ checkInData })
      console.log('✅ 签到数据加载成功:', checkInData)
    } catch (error) {
      console.error('❌ 签到数据加载异常:', error)
    }
  },

  // 保存签到数据
  saveCheckInData() {
    try {
      wx.setStorageSync('checkInData', this.data.checkInData)
    } catch (error) {
      console.error('❌ 签到数据保存异常:', error)
    }
  },

  // 每日签到
  onDailyCheckIn() {
    const { checkInData } = this.data
    
    if (checkInData.hasCheckedToday) {
      wx.showToast({
        title: '今日已签到',
        icon: 'none'
      })
      return
    }

    // 计算奖励积分（连续签到有额外奖励）
    let rewardPoints = 10 // 基础奖励
    const consecutiveDays = checkInData.consecutiveDays + 1
    
    // 连续签到奖励
    if (consecutiveDays >= 7) {
      rewardPoints += 20 // 连续7天额外20积分
    } else if (consecutiveDays >= 3) {
      rewardPoints += 10 // 连续3天额外10积分
    }

    const today = new Date().toDateString()

    // 更新签到数据
    const newCheckInData = {
      ...checkInData,
      hasCheckedToday: true,
      consecutiveDays: consecutiveDays,
      totalCheckIns: checkInData.totalCheckIns + 1,
      lastCheckInDate: today,
      todayReward: rewardPoints
    }

    // 保存签到历史记录
    const checkinHistory = wx.getStorageSync('checkinHistory') || []
    if (!checkinHistory.includes(today)) {
      checkinHistory.push(today)
      wx.setStorageSync('checkinHistory', checkinHistory)
    }

    // 更新用户积分
    const currentPoints = wx.getStorageSync('userPoints') || 0
    const newPoints = currentPoints + rewardPoints
    wx.setStorageSync('userPoints', newPoints)

    // 保存数据
    this.setData({ checkInData: newCheckInData })
    this.saveCheckInData()

    // 显示签到成功
    let message = `签到成功！获得 ${rewardPoints} 积分`
    if (consecutiveDays >= 7) {
      message += `\n🎉 连续签到${consecutiveDays}天，额外奖励！`
    } else if (consecutiveDays >= 3) {
      message += `\n🔥 连续签到${consecutiveDays}天，继续保持！`
    }

    wx.showModal({
      title: '签到成功',
      content: message,
      showCancel: false,
      confirmText: '确定'
    })

    console.log('✅ 签到成功:', newCheckInData)
  },

  // 查看签到记录
  onViewCheckInHistory() {
    this.generateCalendarDays()
    this.setData({ showCheckinModal: true })
  },

  // 生成日历数据
  generateCalendarDays() {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    
    // 获取本月第一天和最后一天
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    // 获取本月第一天是星期几
    const firstDayWeek = firstDay.getDay()
    
    // 获取签到记录
    const checkinHistory = wx.getStorageSync('checkinHistory') || []
    
    const calendarDays = []
    
    // 添加上个月的日期填充
    for (let i = firstDayWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i)
      calendarDays.push({
        day: prevDate.getDate(),
        isCurrentMonth: false,
        isToday: false,
        isChecked: false
      })
    }
    
    // 添加本月的日期
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const currentDate = new Date(year, month, day)
      const dateString = currentDate.toDateString()
      const isToday = dateString === today.toDateString()
      const isChecked = checkinHistory.includes(dateString) || (isToday && this.data.checkInData.hasCheckedToday)
      
      calendarDays.push({
        day: day,
        isCurrentMonth: true,
        isToday: isToday,
        isChecked: isChecked
      })
    }
    
    // 添加下个月的日期填充（确保总共42个格子，6行7列）
    const remainingDays = 42 - calendarDays.length
    for (let day = 1; day <= remainingDays; day++) {
      calendarDays.push({
        day: day,
        isCurrentMonth: false,
        isToday: false,
        isChecked: false
      })
    }
    
    this.setData({ calendarDays })
  },

  // 关闭签到记录弹窗
  onCloseCheckinModal() {
    this.setData({ showCheckinModal: false })
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 空函数，用于阻止事件冒泡
  },

  onSettings() {
    wx.showActionSheet({
      itemList: ['账号设置', '隐私设置', '通知设置', '修复游戏统计', '刷新数据', '退出登录'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            wx.showToast({ title: '账号设置', icon: 'none' })
            break
          case 1:
            this.onPrivacy()
            break
          case 2:
            wx.showToast({ title: '通知设置', icon: 'none' })
            break
          case 3:
            this.onFixGameStats()
            break
          case 4:
            this.onRefresh()
            break
          case 5:
            this.onLogout()
            break
        }
      }
    })
  },

  onPrivacy() {
    wx.showToast({
      title: '隐私中心',
      icon: 'none'
    });
  },

  onFeedback() {
    // 直接跳转，不使用loading页面，避免返回时卡住
    wx.navigateTo({
      url: '/pages/feedback/feedback',
      success: () => {
        console.log('✅ 成功跳转到问题反馈页面');
      },
      fail: (err) => {
        console.error('❌ 跳转问题反馈页面失败:', err);
        wx.showToast({
          title: '打开页面失败',
          icon: 'none'
        });
      }
    });
  },

  // 退出登录
  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '退出登录后将清空本地数据，确定要退出吗？',
      confirmText: '退出',
      confirmColor: '#ff4444',
      success: (res) => {
        if (res.confirm) {
          const app = getApp()
          app.logout()
          
          // 跳转到登录页面
          const loadingNav = require('../../utils/loadingNavigator');
          loadingNav.redirectTo('/pages/login/login');
        }
      }
    })
  },

  // 测试点击事件
  testClick() {
    wx.showToast({
      title: '测试点击成功！',
      icon: 'success'
    })
    console.log('测试点击事件被触发')
  },

  // 删除帖子
  onDeletePost(e) {
    console.log('删除按钮被点击')
    wx.showToast({
      title: '删除按钮被点击',
      icon: 'none'
    })
    
    const post = e.currentTarget.dataset.post
    if (!post) return

    wx.showModal({
      title: '确认删除',
      content: `确定要删除动态"${post.title || '无标题'}"吗？删除后无法恢复。`,
      confirmText: '删除',
      confirmColor: '#ff4444',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.deletePost(post)
        }
      }
    })
  },

  // 图片加载错误处理
  onImageError(e) {
    console.log('图片加载错误:', e)
    const postId = e.currentTarget.dataset.postId
    
    if (postId) {
      // 使用图片池中的随机图片作为替代
      const fallbackImage = imagePool.getRandomImage()
      
      // 更新对应帖子的图片
      const updatedPosts = this.data.userPosts.map(post => {
        if ((post.id || post._id) === postId) {
          return {
            ...post,
            image: fallbackImage,
            images: [fallbackImage]
          }
        }
        return post
      })
      
      this.setData({ userPosts: updatedPosts })
      console.log('已替换失效图片为:', fallbackImage)
    }
  },

  // 执行删除帖子
  async deletePost(post) {
    console.log('🚀 开始执行删除帖子:', post)
    try {
      wx.showLoading({ title: '删除中...' })
      
      console.log('📡 调用云函数删除帖子:', post.id || post._id)
      const result = await cloudApi.community.deletePost(post.id || post._id)
      console.log('📡 云函数返回结果:', result)
      
      if (result.success) {
        console.log('✅ 云函数删除成功，更新本地数据')
        // 从本地数据中移除
        const updatedPosts = this.data.userPosts.filter(p => 
          (p.id || p._id) !== (post.id || post._id)
        )
        
        console.log('📊 更新前帖子数量:', this.data.userPosts.length)
        console.log('📊 更新后帖子数量:', updatedPosts.length)
        
        this.setData({ userPosts: updatedPosts })
        
        // 重新计算统计数据
        await this.loadUserStats()
        
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        })
        
        console.log('✅ 帖子删除成功:', post.title)
      } else {
        console.log('❌ 云函数删除失败:', result.message)
        wx.showToast({
          title: result.message || '删除失败',
          icon: 'none'
        })
        console.error('❌ 帖子删除失败:', result.message)
      }
    } catch (error) {
      console.error('❌ 删除帖子异常:', error)
      wx.showToast({
        title: '删除失败: ' + error.message,
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  }
})

