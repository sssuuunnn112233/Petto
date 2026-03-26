// pages/my-posts/my-posts.js
const { cloudApi, handleCloudError } = require('../../utils/cloudApi')
const imagePool = require('../../utils/imagePool')

Page({
  data: {
    userPosts: [],
    loading: false,
    hasMore: true,
    page: 1,
    limit: 10,
    useCloudData: true,
    cloudError: false,
    refreshing: false,
    totalLikes: 0,
    totalFavorites: 0
  },

  onLoad() {
    this.testCloudConnection()
    this.loadUserPosts()
  },

  onShow() {
    // 检查是否需要刷新
    const needRefresh = wx.getStorageSync('needRefreshPosts')
    if (needRefresh) {
      wx.removeStorageSync('needRefreshPosts')
      this.onRefresh()
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

  // 加载用户动态
  async loadUserPosts(isRefresh = false) {
    if (this.data.loading) return

    this.setData({ loading: true })

    try {
      const page = isRefresh ? 1 : this.data.page
      const result = await cloudApi.community.getUserPosts(page, this.data.limit)
      
      if (result.success) {
        const posts = result.data.posts.map(post => ({
          ...post,
          id: post._id,
          postId: post._id,
          image: this.processImageUrl(post.images?.[0]),
          images: post.images?.map(img => this.processImageUrl(img)) || [],
          timeText: this.formatTime(post.createdAt)
        }))
        
        if (isRefresh) {
          this.setData({
            userPosts: posts,
            page: 1,
            hasMore: posts.length === this.data.limit
          })
        } else {
          this.setData({
            userPosts: [...this.data.userPosts, ...posts],
            hasMore: posts.length === this.data.limit
          })
        }
        
        // 计算统计数据
        this.calculateStats()
        
        console.log('✅ 用户动态加载成功:', posts.length, '条')
      } else {
        console.log('❌ 用户动态加载失败:', result.message)
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('❌ 用户动态加载异常:', error)
      handleCloudError(error)
    } finally {
      this.setData({ 
        loading: false,
        refreshing: false
      })
    }
  },

  // 计算统计数据
  calculateStats() {
    const posts = this.data.userPosts
    const totalLikes = posts.reduce((sum, post) => sum + (post.likeCount || 0), 0)
    const totalFavorites = posts.reduce((sum, post) => sum + (post.favoriteCount || 0), 0)
    
    this.setData({
      totalLikes,
      totalFavorites
    })
  },

  // 处理图片URL
  processImageUrl(imageUrl) {
    if (!imageUrl) {
      return imagePool.getRandomImage()
    }
    
    if (imageUrl.startsWith('cloud://')) {
      return imageUrl
    }
    
    if (imageUrl.startsWith('/images/pokemon/')) {
      return imagePool.getRandomImage()
    }
    
    return imageUrl
  },

  // 格式化时间
  formatTime(dateStr) {
    if (!dateStr) return '刚刚'
    
    const now = new Date()
    const postTime = new Date(dateStr)
    const diff = now - postTime
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 30) return `${days}天前`
    
    return `${postTime.getMonth() + 1}-${postTime.getDate()}`
  },

  // 查看帖子详情
  onPostTap(e) {
    const post = e.currentTarget.dataset.post
    if (!post) return
    
    const loadingNav = require('../../utils/loadingNavigator')
    const url = `/pages/post-detail/post-detail?id=${post.id}&postId=${encodeURIComponent(post.postId)}&title=${encodeURIComponent(post.title || '')}&authorName=${encodeURIComponent(post.author?.name || '')}&authorAvatar=${encodeURIComponent(post.author?.avatar || '')}&images=${encodeURIComponent(JSON.stringify(post.images))}&baseLikeCount=${post.likeCount || 0}&baseFavoriteCount=${post.favoriteCount || 0}`
    
    loadingNav.navigateTo(url)
  },

  // 下拉刷新
  onRefresh() {
    this.setData({ 
      refreshing: true,
      page: 1 
    })
    this.loadUserPosts(true)
  },

  // 上拉加载更多
  onLoadMore() {
    if (!this.data.hasMore || this.data.loading) return
    
    this.setData({ page: this.data.page + 1 })
    this.loadUserPosts()
  },

  // 滚动到底部
  onScrollToLower() {
    this.onLoadMore()
  },

  // 创建新动态
  onCreatePost() {
    const loadingNav = require('../../utils/loadingNavigator')
    loadingNav.navigateTo('/pages/create-post/create-post')
  },

  // 删除帖子
  onDeletePost(e) {
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

  // 执行删除帖子
  async deletePost(post) {
    try {
      wx.showLoading({ title: '删除中...' })
      
      const result = await cloudApi.community.deletePost(post.id || post._id)
      
      if (result.success) {
        // 从本地数据中移除
        const updatedPosts = this.data.userPosts.filter(p => 
          (p.id || p._id) !== (post.id || post._id)
        )
        
        this.setData({ userPosts: updatedPosts })
        
        // 重新计算统计数据
        this.calculateStats()
        
        // 标记需要刷新个人主页
        wx.setStorageSync('needRefreshProfile', true)
        
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        })
        
        console.log('✅ 帖子删除成功:', post.title)
      } else {
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
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 空函数，用于阻止事件冒泡
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
  },

  // 图片加载错误处理
  onImageError(e) {
    const postId = e.currentTarget.dataset.postId
    console.error('我的动态图片加载错误:', postId)
    
    // 为用户发布的帖子提供备用图片
    const fallbackImage = imagePool.getImageById(postId, true)
    
    // 更新对应帖子的图片
    const userPosts = this.data.userPosts.map(post => {
      const matchId = post.postId || post.id
      if (String(matchId) === String(postId)) {
        return {
          ...post,
          image: fallbackImage,
          images: [fallbackImage]
        }
      }
      return post
    })
    
    this.setData({ userPosts })
    console.log('用户动态图片加载失败，已替换为备用图片:', fallbackImage)
  }
})