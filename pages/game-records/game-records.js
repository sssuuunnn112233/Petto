// pages/game-records/game-records.js
const { cloudApi, handleCloudError } = require('../../utils/cloudApi')

Page({
  data: {
    gameRecords: [],
    gameStats: {
      totalGames: 0,
      totalScore: 0,
      totalPoints: 0,
      bestScore: 0
    },
    selectedGame: 'all', // all, 2048, flipcard
    gameTypes: [
      { value: 'all', label: '全部游戏', icon: '/assets/icon/全部游戏.png' },
      { value: '2048', label: '2048', icon: '/assets/icon/2048.png' },
      { value: 'flipcard', label: '翻牌游戏', icon: '/assets/icon/翻牌-copy.png' }
    ],
    loading: false,
    hasMore: true,
    page: 1,
    limit: 20,
    useCloudData: true,
    cloudError: false,
    userPoints: 0 // 用户当前积分
  },

  onLoad() {
    this.testCloudConnection()
    this.loadGameRecords()
    this.loadGameStats()
    this.loadUserPoints()
  },

  onShow() {
    // 每次显示页面时重新加载数据，确保数据是最新的
    console.log('🔄 游戏记录页面显示，重新加载数据')
    
    // 先加载游戏记录，再加载统计数据
    this.loadGameRecords(true).then(() => {
      // 记录加载完成后再加载统计，这样可以基于记录计算统计
      this.loadGameStats()
    })
    
    this.loadUserPoints()
    
    // 检查是否需要刷新游戏记录
    const needRefresh = wx.getStorageSync('needRefreshGameRecords')
    if (needRefresh) {
      console.log('🔄 检测到游戏记录刷新标记，重新加载记录')
      wx.removeStorageSync('needRefreshGameRecords')
    }
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

  // 加载游戏记录
  async loadGameRecords(isRefresh = false) {
    if (this.data.loading) return

    this.setData({ loading: true })

    try {
      const page = isRefresh ? 1 : this.data.page
      const gameType = this.data.selectedGame === 'all' ? undefined : this.data.selectedGame
      
      console.log('🎮 加载游戏记录...', { page, gameType, useCloudData: this.data.useCloudData })
      
      const result = await cloudApi.game.getRecords(page, this.data.limit, gameType)
      
      console.log('🎮 游戏记录结果:', result)
      
      if (result.success) {
        const records = result.data.gameRecords.map(record => ({
          ...record,
          id: record._id,
          timeText: this.formatTime(record.startTime),
          gameTypeText: this.getGameTypeText(record.gameType),
          gameIcon: this.getGameIcon(record.gameType),
          pointsEarned: record.experienceGained || this.calculatePoints(record.score, record.gameType),
          durationText: this.formatDuration(record.duration)
        }))
        
        if (isRefresh) {
          this.setData({
            gameRecords: records,
            page: 1,
            hasMore: records.length === this.data.limit
          })
        } else {
          this.setData({
            gameRecords: [...this.data.gameRecords, ...records],
            hasMore: records.length === this.data.limit
          })
        }
        
        console.log('✅ 游戏记录加载成功:', records.length, '条')
      } else {
        console.log('❌ 游戏记录加载失败:', result.message)
        // 显示空状态，不使用模拟数据
        this.setData({
          gameRecords: [],
          hasMore: false
        })
        
        // 显示错误提示
        wx.showToast({
          title: result.message || '加载失败',
          icon: 'none',
          duration: 2000
        })
      }
    } catch (error) {
      console.error('❌ 游戏记录加载异常:', error)
      // 显示空状态，不使用模拟数据
      this.setData({
        gameRecords: [],
        hasMore: false
      })
      
      // 显示错误提示
      wx.showToast({
        title: '网络异常，请稍后重试',
        icon: 'none',
        duration: 2000
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 加载游戏统计
  async loadGameStats() {
    try {
      console.log('🎮 加载游戏统计数据...')
      
      // 检查是否有修复后的数据
      const fixedStats = wx.getStorageSync('gameStatsFixed')
      if (fixedStats) {
        console.log('✅ 使用修复后的统计数据:', fixedStats)
        this.setData({ gameStats: fixedStats })
        return
      }
      
      // 使用直接计算方式
      console.log('🎯 使用直接计算方式获取游戏统计...')
      const directStats = await this.calculateGameStatsDirectly()
      
      if (directStats.success) {
        this.setData({ gameStats: directStats.data })
        console.log('✅ 直接计算游戏统计成功:', directStats.data)
        return
      }
      
      // 如果直接计算失败，尝试云函数
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
      } else {
        console.log('❌ 游戏统计数据加载失败:', result.message)
        // 使用默认数据作为备用
        const localPoints = wx.getStorageSync('userPoints') || 0
        this.setData({
          gameStats: {
            totalGames: 0,
            totalScore: 0,
            bestScore: 0,
            totalPoints: localPoints
          }
        })
      }
    } catch (error) {
      console.error('❌ 游戏统计加载异常:', error)
      // 使用默认数据作为备用
      const localPoints = wx.getStorageSync('userPoints') || 0
      this.setData({
        gameStats: {
          totalGames: 0,
          totalScore: 0,
          bestScore: 0,
          totalPoints: localPoints
        }
      })
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

  // 加载用户积分
  async loadUserPoints() {
    try {
      // 从本地存储获取积分，实际项目中应该从云端获取
      const points = wx.getStorageSync('userPoints') || 1250
      this.setData({ userPoints: points })
    } catch (error) {
      console.error('❌ 用户积分加载异常:', error)
      this.setData({ userPoints: 1250 })
    }
  },

  // 计算积分
  calculatePoints(score, gameType) {
    switch (gameType) {
      case '2048':
        return Math.floor(score / 100)
      case 'flipcard':
        return Math.floor(score / 50)
      default:
        return Math.floor(score / 100)
    }
  },

  // 获取游戏类型文本
  getGameTypeText(gameType) {
    const typeMap = {
      '2048': '2048',
      'flipcard': '翻牌游戏'
    }
    return typeMap[gameType] || '未知游戏'
  },

  // 获取游戏图标
  getGameIcon(gameType) {
    const iconMap = {
      '2048': '/assets/icon/2048.png',
      'flipcard': '/assets/icon/翻牌-copy.png'
    }
    return iconMap[gameType] || '/assets/icon/全部游戏.png'
  },

  // 格式化时长
  formatDuration(seconds) {
    if (!seconds) return '0秒'
    
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes > 0) {
      return `${minutes}分${remainingSeconds}秒`
    } else {
      return `${remainingSeconds}秒`
    }
  },

  // 格式化时间
  formatTime(dateStr) {
    if (!dateStr) return '刚刚'
    
    const now = new Date()
    const gameTime = new Date(dateStr)
    const diff = now - gameTime
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 30) return `${days}天前`
    
    return `${gameTime.getMonth() + 1}-${gameTime.getDate()}`
  },

  // 切换游戏类型
  onGameTypeChange(e) {
    const gameType = e.currentTarget.dataset.type
    this.setData({ 
      selectedGame: gameType,
      page: 1,
      gameRecords: []
    })
    this.loadGameRecords(true)
  },

  // 下拉刷新
  onRefresh() {
    this.setData({ page: 1 })
    this.loadGameRecords(true)
    this.loadGameStats()
    this.loadUserPoints()
  },

  // 上拉加载更多
  onLoadMore() {
    if (!this.data.hasMore || this.data.loading) return
    
    this.setData({ page: this.data.page + 1 })
    this.loadGameRecords()
  },

  // 滚动到底部
  onScrollToLower() {
    this.onLoadMore()
  },

  // 查看记录详情
  onRecordTap(e) {
    const record = e.currentTarget.dataset.record
    wx.showModal({
      title: '游戏记录详情',
      content: `游戏: ${record.gameTypeText}\n得分: ${record.score}\n用时: ${record.durationText}\n获得积分: ${record.pointsEarned}\n时间: ${record.timeText}`,
      showCancel: false,
      confirmText: '确定'
    })
  },

  // 去积分商店
  onGoToStore() {
    const loadingNav = require('../../utils/loadingNavigator')
    loadingNav.navigateTo('/pages/points-store/points-store')
  },

  // 去游戏中心
  onGoToGames() {
    const loadingNav = require('../../utils/loadingNavigator')
    loadingNav.switchTab('/pages/game/index')
  },

  // 返回
  onBack() {
    // 检查页面栈，如果是从loading页面跳转来的，直接跳转到profile页面
    const pages = getCurrentPages()
    if (pages.length >= 2) {
      const prevPage = pages[pages.length - 2]
      if (prevPage.route === 'pages/loading/index') {
        // 从loading页面跳转来的，直接跳转到profile页面
        wx.switchTab({
          url: '/pages/profile/index'
        })
        return
      }
    }
    
    // 正常返回
    wx.navigateBack()
  }
})