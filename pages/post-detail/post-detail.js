// post-detail/post-detail.js
const { cloudApi, handleCloudError } = require('../../utils/cloudApi')

const imagePool = require('../../utils/imagePool')

Page({
  data: {
    post: {},
    comments: [],
    userAvatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=me&size=50',
    userName: '我',
    commentText: '',
    bottomCommentText: '', // 底部输入框的文本
    isFollowed: false,
    replyingTo: null, // 正在回复的评论ID
    replyingToUserName: '', // 正在回复的用户名
    showCommentInput: false, // 是否显示评论输入框
    commentCount: 0, // 评论总数
    useCloudData: true, // 是否使用云端数据
    cloudError: false, // 云端数据加载失败标记
    expandedComments: {} // 展开的评论ID集合，格式：{commentId: true}
  },

  onLoad(options) {
    console.log('详情页接收参数:', options)
    
    // 初始化用户信息
    this.initUserInfo()
    
    // 保存options供后续使用
    this.options = options
    
    // 接收从首页传来的数据
    const { id, postId, pokemonId, title, authorName, authorAvatar, images, image, type, video, baseLikeCount, baseFavoriteCount } = options
    
    // 保存基础点赞数（从社区页面传递，用于同步）
    this.baseLikeCount = baseLikeCount ? parseInt(baseLikeCount) : null
    
    // 保存基础收藏数（从社区页面传递，用于同步）
    this.baseFavoriteCount = baseFavoriteCount ? parseInt(baseFavoriteCount) : null
    
    // 优先使用postId（用于点赞状态匹配），如果没有则使用id
    this.postId = postId ? decodeURIComponent(postId) : String(id || Date.now())
    console.log('详情页postId:', this.postId, '原始id:', id)
    
    // 如果postId看起来像云端数据库ID，尝试从云端加载完整数据
    if (this.postId && this.postId.length === 24 && !this.postId.startsWith('mock_')) {
      console.log('检测到云端帖子ID，从云端加载数据...')
      this.loadCloudPostDetail(this.postId)
    } else {
      // 使用传递的参数数据
      this.loadPostDetailFromParams(options)
    }
    
    this.loadComments()
  },

  // 初始化用户信息
  initUserInfo() {
    const app = getApp()
    const userInfo = app.getUserInfo()
    
    if (userInfo) {
      this.setData({
        userName: userInfo.nickname || userInfo.nickName || '我',
        userAvatar: userInfo.avatar || userInfo.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg?seed=me&size=50'
      })
      console.log('✅ 用户信息初始化成功:', this.data.userName)
    } else {
      console.log('⚠️ 未获取到用户信息，使用默认值')
    }
  },

  // 从云端加载帖子详情
  async loadCloudPostDetail(postId) {
    try {
      console.log('🔍 从云端加载帖子详情:', postId)
      
      // 调用云函数获取帖子详情
      const result = await wx.cloud.callFunction({
        name: 'community',
        data: {
          action: 'getPostDetail',
          postId: postId
        }
      })
      
      console.log('📡 云函数调用结果:', result)
      
      if (result.result && result.result.success) {
        const cloudPost = result.result.data
        console.log('✅ 云端帖子数据:', cloudPost)
        
        // 处理图片路径 - 直接使用云端图片或根据帖子类型使用对应图片
        let processedImages = []
        if (cloudPost.images && cloudPost.images.length > 0) {
          processedImages = cloudPost.images.map(img => {
            // 如果是云端图片，直接使用
            if (img.startsWith('cloud://') || img.startsWith('http')) {
              return img
            }
            // 如果是本地路径，根据帖子是否为用户帖子决定使用哪种图片
            const isUserPost = cloudPost.userId && cloudPost.userId === wx.getStorageSync('userId')
            return imagePool.getImageById(cloudPost._id, isUserPost)
          })
        } else {
          // 如果没有图片，根据帖子是否为用户帖子决定使用哪种图片
          const isUserPost = cloudPost.userId && cloudPost.userId === wx.getStorageSync('userId')
          processedImages = [imagePool.getImageById(cloudPost._id, isUserPost)]
        }
        
        // 确保中文内容正确显示
        const post = {
          id: cloudPost._id,
          postId: cloudPost._id,
          title: cloudPost.title || '未命名帖子',
          content: cloudPost.content || '这是一个精彩的帖子内容...',
          author: {
            name: cloudPost.author?.name || '匿名用户',
            avatar: cloudPost.author?.avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=default'
          },
          images: processedImages,
          type: cloudPost.type || 'image',
          tags: cloudPost.tags || ['虚拟宠物', '养成攻略'],
          petType: cloudPost.petType || '🐾',
          likeCount: cloudPost.likeCount || 0,
          favoriteCount: cloudPost.favoriteCount || 0,
          collectCount: cloudPost.favoriteCount || 0,
          createdAt: cloudPost.createdAt,
          // 添加时间格式化
          timeText: this.formatTime(cloudPost.createdAt)
        }
        
        console.log('🎯 格式化后的帖子数据:', {
          title: post.title,
          author: post.author.name,
          images: post.images,
          likeCount: post.likeCount,
          favoriteCount: post.favoriteCount
        })
        
        // 合并本地点赞收藏状态
        const likedPosts = wx.getStorageSync('likedPosts') || {}
        const favoritedPosts = wx.getStorageSync('favoritedPosts') || {}
        
        post.liked = likedPosts[post.postId] === true
        post.collected = favoritedPosts[post.postId] === true
        
        this.setData({ 
          post: post,
          useCloudData: true,
          cloudError: false
        })
        
        // 如果有云端评论数据，使用云端评论
        if (cloudPost.comments && cloudPost.comments.length > 0) {
          this.setData({
            comments: cloudPost.comments,
            commentCount: cloudPost.commentCount || cloudPost.comments.length
          })
          console.log('✅ 使用云端评论数据:', cloudPost.comments.length, '条')
        } else {
          // 否则加载本地评论
          this.loadComments()
        }
        
        console.log('✅ 云端帖子详情加载成功，标题:', post.title)
      } else {
        const errorMsg = result.result?.message || '获取帖子详情失败'
        console.error('❌ 云端帖子详情加载失败:', errorMsg)
        throw new Error(errorMsg)
      }
    } catch (error) {
      console.error('❌ 云端帖子详情加载异常:', error)
      this.setData({ cloudError: true })
      // 降级到参数数据
      this.loadPostDetailFromParams(this.options || {})
    }
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
    if (days < 7) return `${days}天前`
    
    // 超过7天显示具体日期
    return `${postTime.getMonth() + 1}-${postTime.getDate()}`
  },

  // 使用传递的参数加载帖子详情
  loadPostDetailFromParams(options) {
    const { id, postId, pokemonId, title, authorName, authorAvatar, images, image, type, video, baseLikeCount, baseFavoriteCount } = options
    
    console.log('📥 接收到的参数:', options)
    
    // 安全解码函数
    const safeDecodeURIComponent = (str) => {
      if (!str) return ''
      try {
        const decoded = decodeURIComponent(str)
        console.log('✅ 解码成功:', { original: str, decoded })
        return decoded
      } catch (e) {
        console.warn('⚠️ 解码失败，使用原始字符串:', { original: str, error: e.message })
        return str
      }
    }
    
    // 解析图片数据 - 直接使用传递过来的图片，保持与封面一致
    let postImages = []
    if (images) {
      try {
        console.log('🖼️ 原始图片数据:', images)
        
        // 先解码URL编码
        let decodedImages = safeDecodeURIComponent(images)
        console.log('🔍 解码后的图片数据:', decodedImages)
        
        // 尝试解析JSON
        const parsed = JSON.parse(decodedImages)
        console.log('📋 解析后的图片数组:', parsed)
        
        if (Array.isArray(parsed) && parsed.length > 0) {
          // 直接使用传递过来的图片，不做任何转换
          postImages = parsed
        } else {
          // 如果解析失败，使用单张图片
          postImages = [decodedImages]
        }
      } catch (e) {
        console.error('❌ 解析图片数据失败:', e)
        // 如果JSON解析失败，使用image参数
        if (image) {
          postImages = [safeDecodeURIComponent(image)]
        } else {
          // 最后的备用方案
          postImages = ['/images/pokemon/1.png']
        }
      }
    } else if (image) {
      // 直接使用image参数
      postImages = [safeDecodeURIComponent(image)]
    }
    
    // 如果还是没有图片，使用默认图片
    if (postImages.length === 0) {
      postImages = ['/images/pokemon/1.png']
    }
    
    console.log('🎯 最终图片数组:', postImages)
    
    // 安全解码标题和作者信息
    const decodedTitle = safeDecodeURIComponent(title) || '未命名帖子'
    const decodedAuthorName = safeDecodeURIComponent(authorName) || '匿名用户'
    const decodedAuthorAvatar = safeDecodeURIComponent(authorAvatar) || 'https://api.dicebear.com/7.x/adventurer/svg?seed=default'
    const decodedVideo = video ? safeDecodeURIComponent(video) : null
    
    console.log('🔍 解码后的数据:', {
      title: decodedTitle,
      authorName: decodedAuthorName,
      images: postImages
    })
    
    // 构建帖子数据
    const post = {
      id: String(id || this.postId),
      postId: this.postId,
      title: decodedTitle,
      content: '这是一个精彩的帖子内容...',
      author: {
        name: decodedAuthorName,
        avatar: decodedAuthorAvatar
      },
      images: postImages,
      image: postImages[0], // 确保image字段也设置正确
      type: type || 'image',
      video: decodedVideo,
      tags: ['虚拟宠物', '养成攻略', '新手必看'],
      petType: '🐾',
      likeCount: parseInt(baseLikeCount) || 0,
      favoriteCount: parseInt(baseFavoriteCount) || 0,
      collectCount: parseInt(baseFavoriteCount) || 0,
      timeText: '今天 13:47'
    }
    
    // 合并本地点赞收藏状态
    const likedPosts = wx.getStorageSync('likedPosts') || {}
    const favoritedPosts = wx.getStorageSync('favoritedPosts') || {}
    
    post.liked = likedPosts[post.postId] === true
    post.collected = favoritedPosts[post.postId] === true
    
    this.setData({ 
      post: post,
      useCloudData: false,
      cloudError: true
    })
    
    console.log('✅ 参数帖子详情加载成功，图片:', post.images)
  },

  // 加载帖子详情（默认数据）
  loadPostDetail() {
    const titles = [
      '我的电子宠物终于进阶了！',
      '新手必看的虚拟宠物养成技巧',
      '分享一只超可爱的稀有宠物',
      '照顾宠物30天的成长记录',
      '这只宠物的颜值太高了！',
      '虚拟宠物喂养心得分享'
    ]
    
    const tagSets = [
      ['虚拟宠物', '养成攻略', '新手必看'],
      ['电子宠物', '成长记录', '心得分享'],
      ['萌宠日常', '稀有宠物', '收藏展示'],
      ['宠物互动', '每日打卡', '养成日记'],
      ['宠物进阶', '喂养技巧', '护理心得']
    ]

    const randomIndex = Math.floor(Math.random() * titles.length)
    const pokemonIds = [
      Math.floor(Math.random() * 150) + 1,
      Math.floor(Math.random() * 150) + 1,
      Math.floor(Math.random() * 150) + 1
    ]
    
    // 确保ID是字符串类型
    const postId = String(this.postId || 1)
    
    // 从本地存储读取点赞状态（完全由用户手动控制）
    const likedPosts = wx.getStorageSync('likedPosts') || {}
    const liked = likedPosts[postId] === true || likedPosts[postId] === 'true'
    
    // 从本地存储读取点赞数变化
    const likeCountChanges = wx.getStorageSync('likeCountChanges') || {}
    const likeCountChange = Number(likeCountChanges[postId]) || 0
    
    const post = {
      id: postId,
      title: titles[randomIndex],
      tags: tagSets[randomIndex % tagSets.length],
      time: '今天 13:47',
      location: '北京',
      author: {
        name: 'Luna爱养宠',
        avatar: 'https://api.dicebear.com/7.x/lorelei/svg?seed=author1'
      },
      images: pokemonIds.map(id => `/images/pokemon/${id}.png`),
      likeCount: 0 + likeCountChange, // 基础点赞数 + 变化
      favoriteCount: 0, // 用户发布的帖子初始收藏数为0
      liked: liked, // 完全由本地存储控制，不自动点赞
      favorited: false
    }
    this.setData({ post })
  },

  // 加载评论
  async loadComments() {
    // 使用帖子ID和评论ID组合作为唯一标识
    const postId = this.data.post.postId || String(this.data.post.id || this.postId)
    
    console.log('🔍 开始加载评论，postId:', postId)
    
    // 优先尝试从云端加载评论
    if (this.data.useCloudData && !this.data.cloudError && postId && postId.length === 24 && !postId.startsWith('mock_')) {
      try {
        await this.loadCloudComments(postId)
        return
      } catch (error) {
        console.error('❌ 云端评论加载失败，使用本地数据:', error)
      }
    }
    
    // 云端加载失败或不使用云端数据时，使用本地模拟数据
    this.loadMockComments(postId)
  },

  // 从云端加载评论
  async loadCloudComments(postId) {
    try {
      console.log('☁️ 从云端加载评论:', postId)
      
      const result = await cloudApi.community.getComments(postId, 1, 50)
      
      if (result.success) {
        const cloudComments = result.data.comments.map(comment => ({
          id: comment._id,
          userName: comment.userName || '匿名用户',
          avatar: comment.avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=default&size=50',
          content: comment.content || '',
          time: comment.time || this.formatTime(comment.createdAt),
          location: comment.location || '北京',
          likeCount: comment.likeCount || 0,
          liked: false, // 需要单独查询用户点赞状态
          replies: comment.replies || [],
          totalReplies: comment.replyCount || comment.totalReplies || 0,
          tag: ''
        }))
        
        // 合并本地点赞状态
        const commentsWithLocalState = this.mergeCommentLocalState(cloudComments, postId)
        
        // 从本地存储读取用户发布的评论
        const postComments = wx.getStorageSync('postComments') || {}
        const savedComments = postComments[postId] || []
        
        // 合并云端评论和本地评论
        const commentIdSet = new Set()
        const allComments = []
        
        // 先添加用户发布的评论（优先级更高）
        savedComments.forEach(comment => {
          if (!commentIdSet.has(comment.id)) {
            commentIdSet.add(comment.id)
            allComments.push(comment)
          }
        })
        
        // 再添加云端评论（如果不存在）
        commentsWithLocalState.forEach(comment => {
          if (!commentIdSet.has(comment.id)) {
            commentIdSet.add(comment.id)
            allComments.push(comment)
          }
        })
        
        this.setData({ 
          comments: allComments,
          commentCount: allComments.length
        })
        
        console.log('✅ 云端评论加载成功:', cloudComments.length, '条云端评论，', savedComments.length, '条本地评论')
        return
      } else {
        throw new Error(result.message || '获取评论失败')
      }
    } catch (error) {
      console.error('❌ 云端评论加载异常:', error)
      throw error
    }
  },

  // 合并评论的本地状态
  mergeCommentLocalState(comments, postId) {
    const likedComments = wx.getStorageSync('likedComments') || {}
    const commentLikeCountChanges = wx.getStorageSync('commentLikeCountChanges') || {}
    
    return comments.map(comment => {
      const commentKey = `${postId}_comment_${comment.id}`
      const liked = likedComments[commentKey] === true || likedComments[commentKey] === 'true'
      const likeCountChange = Number(commentLikeCountChanges[commentKey]) || 0
      
      return {
        ...comment,
        liked: liked,
        likeCount: (comment.likeCount || 0) + likeCountChange
      }
    })
  },

  // 加载本地模拟评论
  loadMockComments(postId) {
    // 从本地存储读取用户发布的评论
    const postComments = wx.getStorageSync('postComments') || {}
    const savedComments = postComments[postId] || []
    
    // 从本地存储读取评论点赞状态
    const likedComments = wx.getStorageSync('likedComments') || {}
    const commentLikeCountChanges = wx.getStorageSync('commentLikeCountChanges') || {}
    
    // 只显示用户真实发布的评论，不再有示例评论
    const comments = savedComments.map(comment => {
      const commentKey = `${postId}_comment_${comment.id}`
      const liked = likedComments[commentKey] === true || likedComments[commentKey] === 'true'
      const likeCountChange = Number(commentLikeCountChanges[commentKey]) || 0
      const baseLikeCount = comment.baseLikeCount || 0
      
      return {
        ...comment,
        liked: liked,
        likeCount: baseLikeCount + likeCountChange,
        baseLikeCount: baseLikeCount
      }
    })
    
    this.setData({
      comments: comments,
      commentCount: comments.length
    })
    
    console.log('📝 本地评论数据:', comments.length, '条')
  },

  // 返回
  onBack() {
    // 强制关闭键盘
    wx.hideKeyboard()
    
    // 先失焦所有输入框
    this.setData({ 
      showCommentInput: false,
      replyingTo: null,
      replyingToUserName: '',
      commentText: '',
      bottomCommentText: ''
    })
    
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
    
    // 立即返回，跳过loading页面
    wx.navigateBack({
      delta: 2
    })
  },

  // 查看用户
  onViewUser() {
    wx.showToast({ title: '查看用户主页', icon: 'none' })
  },

  // 关注
  onFollow() {
    this.setData({ isFollowed: !this.data.isFollowed })
    wx.showToast({ 
      title: this.data.isFollowed ? '已关注' : '已取消关注',
      icon: 'none'
    })
  },

  // 分享
  onShare() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  // 预览图片
  onPreviewImage(e) {
    const url = e.currentTarget.dataset.url
    wx.previewImage({
      urls: this.data.post.images,
      current: url
    })
  },

  // 输入评论（评论区的输入框）
  onCommentInput(e) {
    this.setData({ commentText: e.detail.value })
  },

  // 输入评论（底部输入框）
  onBottomCommentInput(e) {
    this.setData({ bottomCommentText: e.detail.value })
  },

  // 提交评论
  onSubmitComment() {
    const { commentText, comments, replyingTo, replyingToUserName } = this.data
    if (!commentText.trim()) return

    if (replyingTo) {
      // 回复评论
      this.submitReply(replyingTo, commentText, replyingToUserName)
    } else {
      // 发布新评论
      this.submitNewComment(commentText)
    }
  },

  // 提交底部输入框的评论
  onSubmitBottomComment() {
    const { bottomCommentText, comments, replyingTo, replyingToUserName } = this.data
    if (!bottomCommentText.trim()) return

    if (replyingTo) {
      // 回复评论
      this.submitReply(replyingTo, bottomCommentText, replyingToUserName)
    } else {
      // 发布新评论
      this.submitNewComment(bottomCommentText)
    }
    
    // 清空底部输入框并失焦
    this.setData({ 
      bottomCommentText: '',
      replyingTo: null,
      replyingToUserName: ''
    })
    
    // 隐藏键盘
    wx.hideKeyboard()
  },

  // 提交新评论
  async submitNewComment(content) {
    const { comments } = this.data
    const postId = this.data.post.postId || String(this.data.post.id || this.postId)
    
    console.log('💬 提交新评论:', { postId, content, useCloudData: this.data.useCloudData })
    
    // 如果使用云端数据且不是模拟数据，尝试提交到云端
    if (this.data.useCloudData && !this.data.cloudError && postId && postId.length === 24 && !postId.startsWith('mock_')) {
      try {
        const result = await cloudApi.community.createComment(postId, {
          content: content.trim(),
          location: '北京'
        })
        
        if (result.success) {
          const cloudComment = result.data
          
          // 添加到评论列表顶部
          comments.unshift(cloudComment)
          
          this.setData({ 
            comments,
            commentText: '',
            commentCount: comments.length,
            showCommentInput: false
          })
          
          wx.showToast({ title: '评论成功', icon: 'success' })
          console.log('✅ 云端评论提交成功:', cloudComment.commentId)
          return
        } else {
          throw new Error(result.message || '评论提交失败')
        }
      } catch (error) {
        console.error('❌ 云端评论提交失败，使用本地存储:', error)
        wx.showToast({ title: '评论已保存到本地', icon: 'none' })
      }
    }
    
    // 云端提交失败或不使用云端数据时，使用本地存储
    const newComment = {
      id: Date.now(),
      userName: this.data.userName,
      avatar: this.data.userAvatar,
      content: content.trim(),
      time: '刚刚',
      location: '北京',
      likeCount: 0,
      liked: false,
      replies: []
    }

    comments.unshift(newComment)
    
    // 保存评论到本地存储
    const postComments = wx.getStorageSync('postComments') || {}
    if (!postComments[postId]) {
      postComments[postId] = []
    }
    postComments[postId].push(newComment)
    wx.setStorageSync('postComments', postComments)
    
    this.setData({ 
      comments,
      commentText: '',
      commentCount: comments.length,
      showCommentInput: false // 失焦输入框
    })
    wx.showToast({ title: '评论成功', icon: 'success' })
    console.log('📝 本地评论已保存:', { postId, commentId: newComment.id })
  },

  // 提交回复
  async submitReply(commentId, content, replyingToUserName) {
    const { comments } = this.data
    const postId = this.data.post.postId || String(this.data.post.id || this.postId)
    
    console.log('💬 提交回复:', { commentId, content, replyingToUserName, useCloudData: this.data.useCloudData })
    
    // 如果使用云端数据且评论ID是云端ID，尝试提交到云端
    if (this.data.useCloudData && !this.data.cloudError && typeof commentId === 'string' && commentId.length === 24) {
      try {
        const result = await cloudApi.community.replyComment(commentId, {
          content: replyingToUserName ? `回复 ${replyingToUserName}: ${content.trim()}` : content.trim(),
          replyToUserName: replyingToUserName
        })
        
        if (result.success) {
          const cloudReply = result.data
          
          // 更新评论列表
          const updatedComments = comments.map(comment => {
            if (comment.id === commentId) {
              if (!comment.replies) {
                comment.replies = []
              }
              comment.replies.push(cloudReply)
              if (comment.totalReplies) {
                comment.totalReplies += 1
              } else {
                comment.totalReplies = comment.replies.length
              }
            }
            return comment
          })
          
          this.setData({ 
            comments: updatedComments,
            commentText: '',
            replyingTo: null,
            replyingToUserName: '',
            showCommentInput: false
          })
          
          wx.showToast({ title: '回复成功', icon: 'success' })
          console.log('✅ 云端回复提交成功:', cloudReply.replyId)
          return
        } else {
          throw new Error(result.message || '回复提交失败')
        }
      } catch (error) {
        console.error('❌ 云端回复提交失败，使用本地存储:', error)
        wx.showToast({ title: '回复已保存到本地', icon: 'none' })
      }
    }
    
    // 云端提交失败或不使用云端数据时，使用本地存储
    const newReply = {
      id: Date.now(),
      userName: this.data.userName,
      avatar: this.data.userAvatar,
      content: replyingToUserName ? `回复 ${replyingToUserName}: ${content.trim()}` : content.trim(),
      time: '刚刚'
    }

    const updatedComments = comments.map(comment => {
      if (comment.id === commentId) {
        if (!comment.replies) {
          comment.replies = []
        }
        comment.replies.push(newReply)
        if (comment.totalReplies) {
          comment.totalReplies += 1
        } else {
          comment.totalReplies = comment.replies.length
        }
      }
      return comment
    })
    
    // 保存回复到本地存储
    const postComments = wx.getStorageSync('postComments') || {}
    if (!postComments[postId]) {
      postComments[postId] = []
    }
    // 找到对应的评论并更新
    const savedComment = postComments[postId].find(c => c.id === commentId)
    if (savedComment) {
      if (!savedComment.replies) {
        savedComment.replies = []
      }
      savedComment.replies.push(newReply)
      if (savedComment.totalReplies) {
        savedComment.totalReplies += 1
      } else {
        savedComment.totalReplies = savedComment.replies.length
      }
    } else {
      // 如果找不到，说明是新评论，需要保存整个评论
      const comment = updatedComments.find(c => c.id === commentId)
      if (comment) {
        postComments[postId].push(comment)
      }
    }
    wx.setStorageSync('postComments', postComments)

    this.setData({ 
      comments: updatedComments,
      commentText: '',
      replyingTo: null,
      replyingToUserName: '',
      showCommentInput: false // 失焦输入框
    })
    wx.showToast({ title: '回复成功', icon: 'success' })
    console.log('📝 本地回复已保存:', { postId, commentId, replyId: newReply.id })
  },

  // 回复评论
  onReply(e) {
    const id = e.currentTarget.dataset.id
    const userName = e.currentTarget.dataset.userName || ''
    const comment = this.data.comments.find(c => c.id === id)
    
    if (comment) {
      this.setData({ 
        replyingTo: id,
        replyingToUserName: userName || comment.userName,
        showCommentInput: true
      })
      
      // 滚动到评论输入框
      wx.pageScrollTo({
        selector: '.comment-input-box',
        duration: 300
      })
      
      // 聚焦输入框
      setTimeout(() => {
        this.setData({ showCommentInput: true })
      }, 350)
    }
  },

  // 点赞评论
  async onLikeComment(e) {
    const commentId = e.currentTarget.dataset.id
    // 使用帖子ID和评论ID组合作为唯一标识
    const postId = this.data.post.postId || String(this.data.post.id || this.postId)
    const commentKey = `${postId}_comment_${commentId}`
    
    console.log('👍 点赞评论:', { commentId, postId, useCloudData: this.data.useCloudData })
    
    // 先更新本地状态（立即响应）
    const comments = this.data.comments.map(c => {
      if (c.id === commentId) {
        const newLiked = !c.liked
        const newLikeCount = c.likeCount + (newLiked ? 1 : -1)
        
        // 保存到本地存储
        const likedComments = wx.getStorageSync('likedComments') || {}
        likedComments[commentKey] = newLiked
        wx.setStorageSync('likedComments', likedComments)
        
        // 保存点赞数变化
        const commentLikeCountChanges = wx.getStorageSync('commentLikeCountChanges') || {}
        const currentChange = Number(commentLikeCountChanges[commentKey]) || 0
        commentLikeCountChanges[commentKey] = currentChange + (newLiked ? 1 : -1)
        wx.setStorageSync('commentLikeCountChanges', commentLikeCountChanges)
        
        console.log('📝 评论点赞已保存到本地:', { 
          commentKey, 
          commentId,
          postId,
          liked: newLiked, 
          likeCount: newLikeCount
        })
        
        // 如果使用云端数据且评论ID是云端ID，尝试同步到云端
        if (this.data.useCloudData && !this.data.cloudError && typeof commentId === 'string' && commentId.length === 24) {
          this.syncCommentLikeToCloud(commentId, newLiked).catch(error => {
            console.error('❌ 同步评论点赞状态到云端失败:', error)
            // 云端同步失败不影响本地操作
          })
        }
        
        return Object.assign({}, c, {
          liked: newLiked,
          likeCount: newLikeCount
        })
      }
      return c
    })
    this.setData({ comments })
  },

  // 同步评论点赞状态到云端
  async syncCommentLikeToCloud(commentId, liked) {
    try {
      const result = await cloudApi.community.likeComment(commentId)
      if (result.success) {
        console.log('✅ 评论点赞状态同步到云端成功:', { commentId, liked })
      } else {
        console.error('❌ 评论点赞状态同步到云端失败:', result.message)
      }
    } catch (error) {
      console.error('❌ 评论点赞状态同步到云端异常:', error)
      throw error
    }
  },

  // 回复子评论
  onReplySubComment(e) {
    const commentId = e.currentTarget.dataset.commentId
    const userName = e.currentTarget.dataset.userName || ''
    
    this.setData({ 
      replyingTo: commentId,
      replyingToUserName: userName,
      showCommentInput: true
    })
    
    // 滚动到评论输入框
    wx.pageScrollTo({
      selector: '.comment-input-box',
      duration: 300
    })
    
    setTimeout(() => {
      this.setData({ showCommentInput: true })
    }, 350)
  },

  // 展开回复
  async onExpandReplies(e) {
    const commentId = e.currentTarget.dataset.id
    const expandedComments = this.data.expandedComments
    
    console.log('🔍 展开评论回复:', { commentId, isExpanded: expandedComments[commentId] })
    
    // 如果已经展开，则收起
    if (expandedComments[commentId]) {
      expandedComments[commentId] = false
      this.setData({ expandedComments })
      console.log('📁 收起评论回复:', commentId)
      return
    }
    
    // 展开评论，加载更多回复
    const comment = this.data.comments.find(c => c.id === commentId)
    if (!comment) {
      console.error('❌ 找不到评论:', commentId)
      return
    }
    
    // 如果是云端评论且有更多回复，从云端加载
    if (this.data.useCloudData && !this.data.cloudError && 
        typeof commentId === 'string' && commentId.length === 24 && 
        comment.totalReplies > (comment.replies ? comment.replies.length : 0)) {
      
      try {
        wx.showLoading({ title: '加载回复中...' })
        
        const result = await cloudApi.community.getCommentReplies(commentId, 1, 50)
        
        if (result.success) {
          // 更新评论的回复列表
          const updatedComments = this.data.comments.map(c => {
            if (c.id === commentId) {
              return {
                ...c,
                replies: result.data.replies,
                hasMoreReplies: result.data.hasMore
              }
            }
            return c
          })
          
          // 标记为展开状态
          expandedComments[commentId] = true
          
          this.setData({ 
            comments: updatedComments,
            expandedComments
          })
          
          console.log('✅ 云端回复加载成功:', result.data.replies.length, '条')
        } else {
          throw new Error(result.message || '加载回复失败')
        }
      } catch (error) {
        console.error('❌ 加载云端回复失败:', error)
        wx.showToast({ title: '加载回复失败', icon: 'none' })
      } finally {
        wx.hideLoading()
      }
    } else {
      // 本地评论或已有所有回复，直接展开
      expandedComments[commentId] = true
      this.setData({ expandedComments })
      console.log('📂 展开本地评论回复:', commentId)
    }
  },

  // 判断是否需要显示展开按钮
  shouldShowExpandButton(comment) {
    if (!comment.replies || !comment.totalReplies) return false
    
    // 如果总回复数大于3，或者已展开且回复数大于3，则显示按钮
    return comment.totalReplies > 3 || (this.data.expandedComments[comment.id] && comment.replies.length > 3)
  },

  // 聚焦底部输入框
  onFocusInput() {
    // 清空回复状态
    this.setData({ 
      replyingTo: null,
      replyingToUserName: ''
    })
    // 滚动到底部输入框位置
    wx.pageScrollTo({
      scrollTop: 9999,
      duration: 300
    })
  },

  // 切换点赞
  async onToggleLike() {
    const post = this.data.post
    const postId = post.postId || String(post.id || this.postId)
    console.log('切换点赞 - postId:', postId)
    
    // 更新点赞状态
    const newLiked = !post.liked
    
    // 获取当前点赞数变化
    const likeCountChanges = wx.getStorageSync('likeCountChanges') || {}
    const currentChange = Number(likeCountChanges[postId]) || 0
    
    // 使用保存的基础点赞数
    let baseLikeCount = this.baseLikeCount || post.likeCount - currentChange || 0
    
    // 计算新的点赞数变化
    const newChange = currentChange + (newLiked ? 1 : -1)
    likeCountChanges[postId] = newChange
    wx.setStorageSync('likeCountChanges', likeCountChanges)
    
    // 使用基础点赞数 + 新的变化量计算最终点赞数
    const newLikeCount = baseLikeCount + newChange
    
    // 保存到本地存储
    const likedPosts = wx.getStorageSync('likedPosts') || {}
    likedPosts[postId] = newLiked
    wx.setStorageSync('likedPosts', likedPosts)
    
    // 更新本地状态
    const updatedPost = Object.assign({}, post, {
      liked: newLiked,
      likeCount: newLikeCount
    })
    this.setData({ post: updatedPost })
    
    // 如果使用云端数据且不是模拟数据，同步到云端
    if (this.data.useCloudData && !this.data.cloudError && !postId.startsWith('mock_')) {
      try {
        const result = await cloudApi.community.likePost(postId)
        if (result.success) {
          console.log('✅ 点赞状态同步到云端成功')
        } else {
          console.error('❌ 点赞状态同步到云端失败:', result.message)
        }
      } catch (error) {
        console.error('❌ 点赞状态同步到云端异常:', error)
      }
    }
    
    // 同步更新社区页面
    this.syncToCommunityPage(postId, { liked: newLiked, likeCount: newLikeCount })
  },

  // 切换收藏
  async onToggleFavorite() {
    const post = this.data.post
    const postId = post.postId || String(post.id || this.postId)
    
    const newFavorited = !post.collected
    
    // 保存到本地存储
    const favoritedPosts = wx.getStorageSync('favoritedPosts') || {}
    favoritedPosts[postId] = newFavorited
    wx.setStorageSync('favoritedPosts', favoritedPosts)
    
    // 保存收藏数变化
    const favoriteCountChanges = wx.getStorageSync('favoriteCountChanges') || {}
    const currentChange = Number(favoriteCountChanges[postId]) || 0
    const newChange = currentChange + (newFavorited ? 1 : -1)
    favoriteCountChanges[postId] = newChange
    wx.setStorageSync('favoriteCountChanges', favoriteCountChanges)
    
    // 使用真实的基础收藏数
    let baseFavoriteCount = this.baseFavoriteCount
    if (baseFavoriteCount === undefined || baseFavoriteCount === null) {
      // 所有帖子的基础收藏数都应该是0
      baseFavoriteCount = 0
    }
    
    const newFavoriteCount = baseFavoriteCount + newChange
    
    // 更新本地状态
    const updatedPost = Object.assign({}, post, {
      collected: newFavorited,
      favoriteCount: newFavoriteCount,
      collectCount: newFavoriteCount
    })
    this.setData({ post: updatedPost })
    
    // 如果使用云端数据且不是模拟数据，同步到云端
    if (this.data.useCloudData && !this.data.cloudError && !postId.startsWith('mock_')) {
      try {
        const result = await cloudApi.community.favoritePost(postId)
        if (result.success) {
          console.log('✅ 收藏状态同步到云端成功')
        } else {
          console.error('❌ 收藏状态同步到云端失败:', result.message)
        }
      } catch (error) {
        console.error('❌ 收藏状态同步到云端异常:', error)
      }
    }
    
    // 同步更新社区页面
    this.syncToCommunityPage(postId, { collected: newFavorited, collectCount: newFavoriteCount })
    
    wx.showToast({
      title: newFavorited ? '已收藏' : '取消收藏',
      icon: 'none'
    })
  },

  // 同步数据到社区页面
  syncToCommunityPage(postId, updates) {
    const pages = getCurrentPages()
    const communityPage = pages.find(page => page.route === 'pages/community/index')
    if (communityPage) {
      const posts = communityPage.data.posts.map(p => {
        const pPostId = p.postId || String(p.id)
        if (pPostId === postId) {
          return Object.assign({}, p, updates)
        }
        return p
      })
      const allPosts = communityPage.data.allPosts.map(p => {
        const pPostId = p.postId || String(p.id)
        if (pPostId === postId) {
          return Object.assign({}, p, updates)
        }
        return p
      })
      communityPage.setData({ posts, allPosts })
      console.log('✅ 已同步更新社区页面数据')
    }
  },

  // 视频播放事件
  onVideoPlay(e) {
    console.log('视频开始播放', e)
  },

  // 视频错误处理
  onVideoError(e) {
    console.error('视频播放错误', e)
    // 如果视频加载失败，立即切换到显示图片
    const post = this.data.post
    if (post.type === 'video' && post.images && post.images.length > 0) {
      // 将类型改为image，这样会自动显示图片
      const updatedPost = Object.assign({}, post, {
        type: 'image',
        video: null
      })
      this.setData({ post: updatedPost })
      console.log('视频加载失败，已切换到图片显示', updatedPost)
    } else if (post.type === 'video') {
      // 如果没有图片，至少显示占位图
      const updatedPost = Object.assign({}, post, {
        type: 'image',
        video: null,
        images: [`/images/pokemon/${post.pokemonId || 1}.png`]
      })
      this.setData({ post: updatedPost })
      console.log('视频加载失败，使用默认图片', updatedPost)
    }
  },

  // 图片加载错误处理
  onImageError(e) {
    console.error('图片加载错误', e)
    
    // 为用户发布的帖子提供备用图片
    const post = this.data.post
    if (post && post.isUserPost) {
      // 使用用户帖子的备用图片
      const fallbackImage = imagePool.getImageById(post.postId || post.id, true)
      
      // 更新帖子图片
      const updatedPost = {
        ...post,
        images: [fallbackImage],
        image: fallbackImage
      }
      
      this.setData({ post: updatedPost })
      console.log('用户帖子图片加载失败，已替换为备用图片:', fallbackImage)
    } else {
      // 系统帖子使用Pokemon图片作为备用
      const fallbackImage = imagePool.getImageById(post.postId || post.id, false)
      
      // 更新帖子图片
      const updatedPost = {
        ...post,
        images: [fallbackImage],
        image: fallbackImage
      }
      
      this.setData({ post: updatedPost })
      console.log('系统帖子图片加载失败，已替换为备用图片:', fallbackImage)
    }
  },

  // 显示评论
  onShowComments() {
    // 滚动到评论区
    wx.pageScrollTo({
      selector: '.comment-section',
      duration: 300
    })
  },

  // 取消回复
  onCancelReply() {
    this.setData({ 
      replyingTo: null,
      replyingToUserName: '',
      commentText: ''
    })
    // 关闭键盘
    wx.hideKeyboard()
  },

  // 页面卸载时关闭键盘
  onUnload() {
    wx.hideKeyboard()
  },

  // 页面显示时，重新读取点赞状态（从其他页面返回时）
  onShow() {
    if (this.data.post) {
      // 优先使用postId（用于点赞状态匹配），如果没有则使用id
      const postId = this.data.post.postId || String(this.data.post.id || this.postId)
      console.log('onShow - 恢复点赞状态，postId:', postId, 'post.postId:', this.data.post.postId, 'post.id:', this.data.post.id)
      
      // 从本地存储重新读取帖子点赞状态
      const likedPosts = wx.getStorageSync('likedPosts') || {}
      const liked = likedPosts[postId] === true || likedPosts[postId] === 'true'
      
      // 从本地存储读取点赞数变化
      const likeCountChanges = wx.getStorageSync('likeCountChanges') || {}
      const likeCountChange = Number(likeCountChanges[postId]) || 0
      
      // 从本地存储重新读取收藏状态
      const favoritedPosts = wx.getStorageSync('favoritedPosts') || {}
      const favorited = favoritedPosts[postId] === true || favoritedPosts[postId] === 'true'
      
      // 从本地存储读取收藏数变化
      const favoriteCountChanges = wx.getStorageSync('favoriteCountChanges') || {}
      const favoriteCountChange = Number(favoriteCountChanges[postId]) || 0
      
      // 使用保存的基础点赞数，如果没有则使用默认值
      // 注意：不能使用 || 运算符，因为0是falsy值，会被替换为默认值
      let baseLikeCount = this.baseLikeCount
      if (baseLikeCount === undefined || baseLikeCount === null) {
        // 所有帖子的基础点赞数都从0开始
        baseLikeCount = 0
      }
      
      // 使用保存的基础收藏数，如果没有则使用默认值
      let baseFavoriteCount = this.baseFavoriteCount
      if (baseFavoriteCount === undefined || baseFavoriteCount === null) {
        // 所有帖子的基础收藏数都应该是0
        baseFavoriteCount = 0
      }
      
      // 更新post的点赞状态、点赞数、收藏状态和收藏数
      const updatedPost = Object.assign({}, this.data.post, {
        liked: liked, // 完全由本地存储控制，不自动点赞
        likeCount: baseLikeCount + likeCountChange,
        favorited: favorited, // 完全由本地存储控制
        collected: favorited, // 确保collected字段也更新
        favoriteCount: baseFavoriteCount + favoriteCountChange, // 基础收藏数 + 变化
        collectCount: baseFavoriteCount + favoriteCountChange // 确保collectCount字段也更新
      })
      
      // 恢复评论（包括用户发布的评论）
      const postComments = wx.getStorageSync('postComments') || {}
      const savedComments = postComments[postId] || []
      
      // 恢复评论点赞状态
      const likedComments = wx.getStorageSync('likedComments') || {}
      const commentLikeCountChanges = wx.getStorageSync('commentLikeCountChanges') || {}
      
      // 合并当前评论和保存的评论
      const commentIdSet = new Set()
      const allComments = []
      
      // 先添加保存的评论（用户发布的）
      savedComments.forEach(comment => {
        if (!commentIdSet.has(comment.id)) {
          commentIdSet.add(comment.id)
          allComments.push(comment)
        }
      })
      
      // 再添加当前评论（如果不存在）
      this.data.comments.forEach(comment => {
        if (!commentIdSet.has(comment.id)) {
          commentIdSet.add(comment.id)
          allComments.push(comment)
        }
      })
      
      const comments = allComments.map(comment => {
        const commentKey = `${postId}_comment_${comment.id}`
        const commentLiked = likedComments[commentKey] === true || likedComments[commentKey] === 'true'
        const commentLikeCountChange = Number(commentLikeCountChanges[commentKey]) || 0
        
        // 计算基础点赞数（从当前点赞数减去变化量）
        const baseCommentLikeCount = (comment.likeCount || 0) - commentLikeCountChange
        
        return Object.assign({}, comment, {
          liked: commentLiked,
          likeCount: baseCommentLikeCount + commentLikeCountChange
        })
      })
      
      this.setData({ 
        post: updatedPost,
        comments: comments,
        commentCount: comments.length
      })
      
      console.log('页面显示，恢复点赞状态:', { 
        postId, 
        liked, 
        likeCount: updatedPost.likeCount,
        comments: comments.map(c => ({ id: c.id, liked: c.liked, likeCount: c.likeCount }))
      })
    }
  },

  // 页面隐藏时关闭键盘
  onHide() {
    wx.hideKeyboard()
  }
})

