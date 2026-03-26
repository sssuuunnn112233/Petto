// index.js
const { cloudApi, handleCloudError } = require('../../utils/cloudApi')
const imagePool = require('../../utils/imagePool')

Page({
  data: {
    // 顶部导航
    currentTab: 'discover', // follow, discover, location
    followBadge: 8,
    messageBadge: 3,
    locationName: '养宠社区',

    // 搜索相关
    showSearchBar: false,
    searchKeyword: '',
    isSearching: false,

    // 分类导航
    currentCategory: 'recommend', // 当前分类
    categories: [
      { id: 'recommend', name: '推荐', active: true },
      { id: 'feeding', name: '喂养', active: false },
      { id: 'care', name: '照料', active: false },
      { id: 'play', name: '互动', active: false },
      { id: 'growth', name: '成长', active: false },
      { id: 'daily', name: '日常', active: false }
    ],

    // 内容数据
    posts: [],
    allPosts: [], // 存储所有帖子用于搜索
    refreshing: false,
    loadingMore: false,
    noMore: false,
    page: 1,
    pageSize: 10,
    
    // 云开发相关
    useCloudData: true, // 启用云端数据
    cloudError: false // 云端数据加载失败标记
  },

  onLoad() {
    // 检查登录状态
    const app = getApp()
    if (!app.checkLoginStatus()) {
      console.log('❌ 用户未登录，跳转到登录页面')
      const loadingNav = require('../../utils/loadingNavigator');
      loadingNav.redirectTo('/pages/login/login?redirect=' + encodeURIComponent('/pages/community/index'));
      return
    }
    
    // 异步测试云开发连接和加载数据，不阻塞页面显示
    setTimeout(() => {
      this.testCloudConnection()
      this.loadPosts(true)
    }, 100)
  },

  // 测试云开发连接
  async testCloudConnection() {
    try {
      console.log('🔍 开始测试云开发连接...')
      const result = await cloudApi.community.getPosts('recommend', 1, 1)
      
      if (result.success) {
        console.log('✅ 云开发连接成功！')
        this.setData({ useCloudData: true, cloudError: false })
      } else {
        console.log('❌ 云开发连接失败:', result.message)
        this.setData({ useCloudData: false, cloudError: true })
      }
    } catch (error) {
      console.log('❌ 云开发连接异常:', error)
      this.setData({ useCloudData: false, cloudError: true })
    }
  },

  // 加载帖子数据
  async loadPosts(replace) {
    const { page, pageSize, currentCategory } = this.data

    try {
      // 优先尝试从云端加载数据
      if (this.data.useCloudData && !this.data.cloudError) {
        await this.loadCloudPosts(replace)
        return
      }
    } catch (error) {
      console.error('云端数据加载失败，使用本地数据:', error)
      this.setData({ cloudError: true })
    }

    // 云端数据加载失败时，显示空数据
    this.setData({
      posts: [],
      allPosts: [],
      noMore: true,
      refreshing: false,
      loadingMore: false
    })
  },

  // 从云端加载帖子数据
  async loadCloudPosts(replace) {
    const { page, pageSize, currentCategory } = this.data

    // 如果是替换加载（刷新），重置图片分配计数器
    if (replace) {
      imagePool.resetImageCounter()
    }

    try {
      // 并行加载通用帖子和用户帖子
      const [generalResult, userResult] = await Promise.all([
        cloudApi.community.getPosts(currentCategory, page, pageSize),
        page === 1 ? cloudApi.community.getUserPosts(1, 20) : Promise.resolve({ success: true, data: { posts: [] } })
      ])
      
      let allCloudPosts = []
      
      // 处理通用帖子（系统帖子）
      if (generalResult.success) {
        const generalPosts = generalResult.data.posts.map((post, index) => {
          // 处理图片路径 - 系统帖子使用Pokemon图片
          let processedImages = []
          if (post.images && post.images.length > 0) {
            processedImages = post.images.map(img => {
              if (img.startsWith('cloud://')) {
                return img
              }
              // 系统帖子使用指定的Pokemon图片，基于索引位置
              return imagePool.getPokemonImageByIndex(index)
            })
          } else {
            // 系统帖子使用Pokemon图片，基于索引位置
            processedImages = [imagePool.getPokemonImageByIndex(index)]
          }

          return {
            ...post,
            id: post._id,
            postId: post._id,
            pokemonId: Math.floor(Math.random() * 150) + 1,
            image: processedImages[0],
            images: processedImages,
            type: post.type || 'image',
            liked: false,
            collected: false,
            baseLikeCount: 0, // 所有帖子基础点赞数都从0开始
            baseFavoriteCount: post.favoriteCount || post.collectCount || 0, // 使用云端真实数据
            gameType: Math.floor(Math.random() * 3),
            gameStyle: 'pokemon',
            isUserPost: false // 标记为系统帖子
          }
        })
        allCloudPosts = allCloudPosts.concat(generalPosts)
      }
      
      // 处理用户帖子（只在第一页加载）
      if (page === 1 && userResult.success && userResult.data.posts.length > 0) {
        console.log('✅ 加载到用户云端帖子:', userResult.data.posts.length, '条')
        
        const userPosts = userResult.data.posts.map(post => {
          let processedImages = []
          if (post.images && post.images.length > 0) {
            processedImages = post.images.map(img => {
              if (img.startsWith('cloud://')) {
                return img
              }
              // 用户帖子使用猫狗图片
              return imagePool.getImageById(post._id || post.id, true)
            })
          } else {
            // 用户帖子使用猫狗图片
            processedImages = [imagePool.getImageById(post._id || post.id, true)]
          }

          return {
            ...post,
            id: post._id,
            postId: post._id,
            pokemonId: Math.floor(Math.random() * 150) + 1,
            image: processedImages[0],
            images: processedImages,
            type: post.type || 'image',
            liked: false,
            collected: false,
            baseLikeCount: 0, // 所有帖子基础点赞数都从0开始
            baseFavoriteCount: post.favoriteCount || post.collectCount || 0, // 使用云端真实数据
            gameType: Math.floor(Math.random() * 3),
            gameStyle: 'pokemon',
            isUserPost: true // 标记为用户帖子
          }
        })
        
        // 去重处理
        const existingPostIds = new Set(allCloudPosts.map(p => p.postId || p._id))
        const uniqueUserPosts = userPosts.filter(p => !existingPostIds.has(p.postId || p._id))
        
        allCloudPosts = uniqueUserPosts.concat(allCloudPosts)
        console.log('📊 去重后用户帖子:', uniqueUserPosts.length, '条')
      }

      // 合并本地点赞收藏状态
      const postsWithLocalState = this.mergeLocalState(allCloudPosts)
      
      const posts = replace ? postsWithLocalState : this.data.posts.concat(postsWithLocalState)
      const allPosts = replace ? postsWithLocalState : this.data.allPosts.concat(postsWithLocalState)
      
      this.setData({
        posts,
        allPosts,
        noMore: !generalResult.data?.hasMore,
        refreshing: false,
        loadingMore: false
      })

      console.log('✅ 云端帖子加载成功:', allCloudPosts.length, '条（包含用户帖子）')
      return
    } catch (error) {
      console.error('❌ 云端帖子加载失败:', error)
      throw error
    }
  },

  // 合并本地点赞收藏状态到云端数据
  mergeLocalState(posts) {
    const likedPosts = wx.getStorageSync('likedPosts') || {}
    const likeCountChanges = wx.getStorageSync('likeCountChanges') || {}
    const favoritedPosts = wx.getStorageSync('favoritedPosts') || {}
    const favoriteCountChanges = wx.getStorageSync('favoriteCountChanges') || {}

    return posts.map(post => {
      const postId = post.postId || post._id
      const liked = likedPosts[postId] === true
      const favorited = favoritedPosts[postId] === true
      const likeCountChange = Number(likeCountChanges[postId]) || 0
      const favoriteCountChange = Number(favoriteCountChanges[postId]) || 0

      return {
        ...post,
        liked,
        collected: favorited,
        likeCount: post.baseLikeCount + likeCountChange,
        collectCount: post.baseFavoriteCount + favoriteCountChange // 使用真实的基础收藏数
      }
    })
  },

  // 切换分类
  onCategoryChange(e) {
    const categoryId = e.currentTarget.dataset.id
    const categories = this.data.categories.map(cat => Object.assign({}, cat, {
      active: cat.id === categoryId
    }))
    this.setData({
      categories,
      currentCategory: categoryId
    })
    this.loadPosts(true)
  },

  // 下拉刷新
  onRefresh() {
    if (this.data.refreshing) return
    this.setData({ refreshing: true, page: 1, noMore: false })
    this.loadPosts(true)
  },

  // 上拉加载更多
  onLoadMore() {
    if (this.data.loadingMore || this.data.noMore || this.data.refreshing) return
    
    console.log('🔄 触发上拉加载更多')
    this.setData({ 
      loadingMore: true, 
      page: this.data.page + 1 
    })
    this.loadPosts(false)
  },

  // 点赞功能
  async onToggleLike(e) {
    const id = e.currentTarget.dataset.id
    
    const posts = this.data.posts.map(p => {
      const matchId = p.postId || String(p.id)
      if (String(p.id) === String(id) || matchId === String(id)) {
        const liked = !p.liked
        const postId = p.postId || String(p.id)
        
        // 保存到本地存储
        const likedPosts = wx.getStorageSync('likedPosts') || {}
        likedPosts[postId] = liked
        wx.setStorageSync('likedPosts', likedPosts)
        
        // 保存点赞数变化
        const likeCountChanges = wx.getStorageSync('likeCountChanges') || {}
        const currentChange = Number(likeCountChanges[postId]) || 0
        const newChange = currentChange + (liked ? 1 : -1)
        likeCountChanges[postId] = newChange
        wx.setStorageSync('likeCountChanges', likeCountChanges)
        
        const baseLikeCount = p.baseLikeCount !== undefined ? p.baseLikeCount : (p.likeCount - currentChange)
        const newLikeCount = baseLikeCount + newChange
        
        // 同步到云端
        if (this.data.useCloudData && !this.data.cloudError && !postId.startsWith('mock_')) {
          this.syncLikeToCloud(postId, liked).catch(error => {
            console.error('同步点赞状态到云端失败:', error)
          })
        }
        
        return Object.assign({}, p, { 
          liked: liked, 
          baseLikeCount: baseLikeCount,
          likeCount: newLikeCount 
        })
      }
      return p
    })
    
    this.setData({ posts })
  },

  // 收藏功能
  async onCollect(e) {
    const id = e.currentTarget.dataset.id
    
    const posts = this.data.posts.map(p => {
      const matchId = p.postId || String(p.id)
      if (String(p.id) === String(id) || matchId === String(id)) {
        const collected = !p.collected
        const postId = p.postId || String(p.id)
        
        // 保存到本地存储
        const favoritedPosts = wx.getStorageSync('favoritedPosts') || {}
        favoritedPosts[postId] = collected
        wx.setStorageSync('favoritedPosts', favoritedPosts)
        
        // 保存收藏数变化
        const favoriteCountChanges = wx.getStorageSync('favoriteCountChanges') || {}
        const currentChange = Number(favoriteCountChanges[postId]) || 0
        favoriteCountChanges[postId] = currentChange + (collected ? 1 : -1)
        wx.setStorageSync('favoriteCountChanges', favoriteCountChanges)
        
        const newFavoriteCountChange = favoriteCountChanges[postId]
        const baseFavoriteCount = p.baseFavoriteCount !== undefined ? p.baseFavoriteCount : ((p.collectCount || 0) - currentChange)
        const newFavoriteCount = baseFavoriteCount + newFavoriteCountChange
        
        // 同步到云端
        if (this.data.useCloudData && !this.data.cloudError && !postId.startsWith('mock_')) {
          this.syncFavoriteToCloud(postId, collected).catch(error => {
            console.error('同步收藏状态到云端失败:', error)
          })
        }
        
        return Object.assign({}, p, { 
          collected: collected, 
          baseFavoriteCount: baseFavoriteCount,
          collectCount: newFavoriteCount 
        })
      }
      return p
    })
    
    this.setData({ posts })
    wx.showToast({
      title: posts.find(p => String(p.id) === String(id) || (p.postId || String(p.id)) === String(id))?.collected ? '已收藏' : '取消收藏',
      icon: 'none'
    })
  },

  // 同步点赞状态到云端
  async syncLikeToCloud(postId, liked) {
    try {
      const result = await cloudApi.community.likePost(postId)
      if (result.success) {
        console.log('点赞状态同步到云端成功:', { postId, liked })
      }
    } catch (error) {
      console.error('点赞状态同步到云端异常:', error)
      throw error
    }
  },

  // 同步收藏状态到云端
  async syncFavoriteToCloud(postId, favorited) {
    try {
      const result = await cloudApi.community.favoritePost(postId)
      if (result.success) {
        console.log('收藏状态同步到云端成功:', { postId, favorited })
      }
    } catch (error) {
      console.error('收藏状态同步到云端异常:', error)
      throw error
    }
  },

  // 打开帖子详情
  onOpenPost(e) {
    const { id, postId, pokemonId, title, authorName, authorAvatar, image, type, video } = e.currentTarget.dataset
    
    const stableId = postId || id
    const stablePostId = postId || `${this.data.currentCategory}_${Math.floor((id - 1) / this.data.pageSize) + 1}_${(id - 1) % this.data.pageSize}`
    
    let imageArray = []
    const currentPost = this.data.posts.find(p => {
      const pPostId = p.postId || String(p.id)
      return pPostId === stablePostId || String(p.id) === String(stableId)
    })
    
    if (currentPost && currentPost.images && Array.isArray(currentPost.images)) {
      imageArray = currentPost.images
    } else if (image) {
      imageArray = [image]
    } else {
      imageArray = [imagePool.getImageById(stableId)]
    }
    
    // 获取基础收藏数
    let baseFavoriteCount = 0
    if (currentPost) {
      baseFavoriteCount = currentPost.baseFavoriteCount !== undefined ? currentPost.baseFavoriteCount : 0
    }
    
    let url = `/pages/post-detail/post-detail?id=${stableId}&postId=${encodeURIComponent(stablePostId)}&pokemonId=${pokemonId}&title=${encodeURIComponent(title || '')}&authorName=${encodeURIComponent(authorName || '')}&authorAvatar=${encodeURIComponent(authorAvatar || '')}&baseFavoriteCount=${baseFavoriteCount}`
    
    if (imageArray.length > 0) {
      url += `&images=${encodeURIComponent(JSON.stringify(imageArray))}`
    }
    
    if (type) {
      url += `&type=${type}`
    }
    if (video) {
      url += `&video=${encodeURIComponent(video)}`
    }
    
    const loadingNav = require('../../utils/loadingNavigator');
    loadingNav.navigateTo(url);
  },

  // 创建帖子
  async onCreatePost() {
    const app = getApp()
    if (!app.checkLoginStatus()) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再发布帖子',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            const loadingNav = require('../../utils/loadingNavigator');
            loadingNav.navigateTo('/pages/login/login?redirect=' + encodeURIComponent('/pages/community/index'));
          }
        }
      })
      return
    }

    const loadingNav = require('../../utils/loadingNavigator');
    loadingNav.navigateTo(`/pages/create-post/create-post?category=${this.data.currentCategory}&useCloud=${this.data.useCloudData && !this.data.cloudError}`);
  },

  // 搜索相关方法
  onSearch() {
    this.setData({ showSearchBar: true })
  },

  onCloseSearch() {
    this.setData({ 
      showSearchBar: false, 
      searchKeyword: '', 
      isSearching: false,
      posts: this.data.allPosts 
    })
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
  },

  onSearchConfirm() {
    const keyword = this.data.searchKeyword.trim()
    if (!keyword) {
      this.setData({ isSearching: false, posts: this.data.allPosts })
      return
    }

    const filteredPosts = this.data.allPosts.filter(post => {
      return post.title.toLowerCase().includes(keyword.toLowerCase()) ||
             (post.author && post.author.name && post.author.name.toLowerCase().includes(keyword.toLowerCase())) ||
             (post.content && post.content.toLowerCase().includes(keyword.toLowerCase()))
    })

    this.setData({ 
      isSearching: true, 
      posts: filteredPosts 
    })
  },

  // 图片加载错误处理
  onImageError(e) {
    const { id, postId } = e.currentTarget.dataset
    const targetId = postId || id
    
    console.log('图片加载失败，使用默认图片:', targetId)
    
    // 使用默认的宠物图片作为备用
    const fallbackImage = '/assets/pet_idle.png'
    
    // 更新对应帖子的图片
    const posts = this.data.posts.map(post => {
      const matchId = post.postId || String(post.id)
      if (String(post.id) === String(targetId) || matchId === String(targetId)) {
        return { ...post, image: fallbackImage }
      }
      return post
    })
    
    const allPosts = this.data.allPosts.map(post => {
      const matchId = post.postId || String(post.id)
      if (String(post.id) === String(targetId) || matchId === String(targetId)) {
        return { ...post, image: fallbackImage }
      }
      return post
    })
    
    this.setData({ posts, allPosts })
  }
})