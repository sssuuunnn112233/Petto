// 云开发API调用工具类
class CloudAPI {
  constructor() {
    this.db = wx.cloud.database()
  }

  // 用户相关API
  user = {
    // 登录
    login: async (userInfo = {}) => {
      try {
        const result = await wx.cloud.callFunction({
          name: 'login',
          data: { userInfo }
        })
        return result.result
      } catch (error) {
        console.error('登录失败:', error)
        return { success: false, message: '登录失败', error: error.message }
      }
    },

    // 获取用户信息
    getProfile: async () => {
      try {
        const result = await wx.cloud.callFunction({
          name: 'login',
          data: {}
        })
        
        if (result.result && result.result.success) {
          return { success: true, data: result.result.data.user }
        } else {
          return { success: false, message: result.result?.message || '获取用户信息失败' }
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        return { success: false, message: '获取用户信息失败', error: error.message }
      }
    },

    // 更新用户信息
    updateProfile: async (data) => {
      try {
        // 获取当前用户的openid
        const wxContext = await wx.cloud.callFunction({
          name: 'login',
          data: {}
        })
        
        if (!wxContext.result.success) {
          throw new Error('获取用户信息失败')
        }
        
        const openid = wxContext.result.data.openid
        
        // 更新用户信息
        const result = await wx.cloud.database().collection('users').where({
          openid: openid
        }).update({
          data: {
            nickname: data.nickName || data.nickname,
            avatar: data.avatarUrl || data.avatar,
            gender: data.gender,
            bio: data.bio,
            updatedAt: new Date()
          }
        })
        
        if (result.stats.updated > 0) {
          return { success: true, message: '用户信息更新成功' }
        } else {
          return { success: false, message: '未找到用户记录' }
        }
      } catch (error) {
        console.error('更新用户信息失败:', error)
        return { success: false, message: '更新用户信息失败', error: error.message }
      }
    }
  }

  // 宠物相关API
  pet = {
    // 获取宠物信息
    get: async () => {
      try {
        const result = await wx.cloud.callFunction({
          name: 'pet',
          data: { action: 'get' }
        })
        return result.result
      } catch (error) {
        console.error('获取宠物信息失败:', error)
        return { success: false, message: '获取宠物信息失败', error: error.message }
      }
    },

    // 喂食宠物
    feed: async () => {
      try {
        const result = await wx.cloud.callFunction({
          name: 'pet',
          data: { action: 'feed' }
        })
        return result.result
      } catch (error) {
        console.error('喂食失败:', error)
        return { success: false, message: '喂食失败', error: error.message }
      }
    },

    // 陪宠物玩耍
    play: async () => {
      try {
        const result = await wx.cloud.callFunction({
          name: 'pet',
          data: { action: 'play' }
        })
        return result.result
      } catch (error) {
        console.error('玩耍失败:', error)
        return { success: false, message: '玩耍失败', error: error.message }
      }
    },

    // 自定义宠物外观
    customize: async (customization) => {
      try {
        const result = await wx.cloud.callFunction({
          name: 'pet',
          data: { 
            action: 'customize',
            customization
          }
        })
        return result.result
      } catch (error) {
        console.error('自定义外观失败:', error)
        return { success: false, message: '自定义外观失败', error: error.message }
      }
    },

    // 更新宠物信息
    update: async (data) => {
      try {
        const result = await wx.cloud.callFunction({
          name: 'pet',
          data: { 
            action: 'update',
            data
          }
        })
        return result.result
      } catch (error) {
        console.error('更新宠物信息失败:', error)
        return { success: false, message: '更新宠物信息失败', error: error.message }
      }
    }
  }

  // 聊天相关API
  chat = {
    // 发送消息
    sendMessage: async (message, messageType = 'text') => {
      try {
        const result = await wx.cloud.callFunction({
          name: 'chat',
          data: { 
            action: 'sendMessage',
            message,
            messageType
          }
        })
        return result.result
      } catch (error) {
        console.error('发送消息失败:', error)
        return { success: false, message: '发送消息失败', error: error.message }
      }
    },

    // 获取聊天历史
    getHistory: async (page = 1, limit = 50) => {
      try {
        const result = await wx.cloud.callFunction({
          name: 'chat',
          data: { 
            action: 'getHistory',
            page,
            limit
          }
        })
        return result.result
      } catch (error) {
        console.error('获取聊天历史失败:', error)
        return { success: false, message: '获取聊天历史失败', error: error.message }
      }
    },

    // 获取聊天统计
    getStats: async () => {
      try {
        const result = await wx.cloud.callFunction({
          name: 'chat',
          data: { action: 'getStats' }
        })
        return result.result
      } catch (error) {
        console.error('获取聊天统计失败:', error)
        return { success: false, message: '获取聊天统计失败', error: error.message }
      }
    },

    // 清空聊天记录
    clearHistory: async () => {
      try {
        const result = await wx.cloud.callFunction({
          name: 'chat',
          data: { action: 'clearHistory' }
        })
        return result.result
      } catch (error) {
        console.error('清空聊天记录失败:', error)
        return { success: false, message: '清空聊天记录失败', error: error.message }
      }
    }
  }

  // 游戏相关API
  game = {
    // 开始游戏
    start: async (gameType) => {
      try {
        const result = await wx.cloud.callFunction({
          name: 'game',
          data: { 
            action: 'start',
            gameType
          }
        })
        return result.result
      } catch (error) {
        console.error('开始游戏失败:', error)
        return { success: false, message: '开始游戏失败', error: error.message }
      }
    },

    // 结束游戏
    end: async (gameId, score, duration, result = 'completed') => {
      try {
        const gameResult = await wx.cloud.callFunction({
          name: 'game',
          data: { 
            action: 'end',
            gameId,
            score,
            duration,
            result
          }
        })
        return gameResult.result
      } catch (error) {
        console.error('结束游戏失败:', error)
        return { success: false, message: '结束游戏失败', error: error.message }
      }
    },

    // 获取游戏记录
    getRecords: async (page = 1, limit = 20, gameType) => {
      try {
        const result = await wx.cloud.callFunction({
          name: 'game',
          data: { 
            action: 'getRecords',
            page,
            limit,
            gameType
          }
        })
        return result.result
      } catch (error) {
        console.error('获取游戏记录失败:', error)
        return { success: false, message: '获取游戏记录失败', error: error.message }
      }
    },

    // 获取游戏统计
    getStats: async () => {
      try {
        const result = await wx.cloud.callFunction({
          name: 'game',
          data: { action: 'getStats' }
        })
        return result.result
      } catch (error) {
        console.error('获取游戏统计失败:', error)
        return { success: false, message: '获取游戏统计失败', error: error.message }
      }
    },

    // 获取排行榜
    getLeaderboard: async (gameType, period = 'all') => {
      try {
        const result = await wx.cloud.callFunction({
          name: 'game',
          data: { 
            action: 'getLeaderboard',
            gameType,
            period
          }
        })
        return result.result
      } catch (error) {
        console.error('获取排行榜失败:', error)
        return { success: false, message: '获取排行榜失败', error: error.message }
      }
    }
  }

  // 社区相关API
  community = {
    // 获取帖子列表
    getPosts: async (category = 'recommend', page = 1, limit = 10) => {
      try {
        const result = await wx.cloud.callFunction({
          name: 'community',
          data: { 
            action: 'getPosts',
            category,
            page,
            limit
          }
        })
        return result.result
      } catch (error) {
        console.error('获取帖子失败:', error)
        return { success: false, message: '获取帖子失败', error: error.message }
      }
    },

    // 创建帖子
    createPost: async (postData) => {
      try {
        const result = await wx.cloud.callFunction({
          name: 'community',
          data: { 
            action: 'createPost',
            postData
          }
        })
        return result.result
      } catch (error) {
        console.error('创建帖子失败:', error)
        return { success: false, message: '创建帖子失败', error: error.message }
      }
    },

    // 删除帖子
    deletePost: async (postId) => {
      try {
        const result = await wx.cloud.callFunction({
          name: 'community',
          data: { 
            action: 'deletePost',
            postId
          }
        })
        return result.result
      } catch (error) {
        console.error('删除帖子失败:', error)
        return { success: false, message: '删除帖子失败', error: error.message }
      }
    },

    // 点赞帖子
    likePost: async (postId) => {
      try {
        const result = await wx.cloud.callFunction({
          name: 'community',
          data: { 
            action: 'likePost',
            postId
          }
        })
        return result.result
      } catch (error) {
        console.error('点赞失败:', error)
        return { success: false, message: '点赞失败', error: error.message }
      }
    },

    // 收藏帖子
    favoritePost: async (postId) => {
      try {
        const result = await wx.cloud.callFunction({
          name: 'community',
          data: { 
            action: 'favoritePost',
            postId
          }
        })
        return result.result
      } catch (error) {
        console.error('收藏失败:', error)
        return { success: false, message: '收藏失败', error: error.message }
      }
    },

    // 搜索帖子
    searchPosts: async (keyword, page = 1, limit = 10) => {
      try {
        const result = await wx.cloud.callFunction({
          name: 'community',
          data: { 
            action: 'searchPosts',
            keyword,
            page,
            limit
          }
        })
        return result.result
      } catch (error) {
        console.error('搜索帖子失败:', error)
        return { success: false, message: '搜索帖子失败', error: error.message }
      }
    },

    // 获取用户发布的帖子
    getUserPosts: async (page = 1, limit = 10) => {
      try {
        const result = await wx.cloud.callFunction({
          name: 'community',
          data: { 
            action: 'getUserPosts',
            page,
            limit
          }
        })
        return result.result
      } catch (error) {
        console.error('获取用户帖子失败:', error)
        return { success: false, message: '获取用户帖子失败', error: error.message }
      }
    },

    // ==================== 评论相关API ====================
    
    // 获取帖子评论
    getComments: async (postId, page = 1, limit = 20) => {
      try {
        const result = await wx.cloud.callFunction({
          name: 'community',
          data: { 
            action: 'getComments',
            postId,
            page,
            limit
          }
        })
        return result.result
      } catch (error) {
        console.error('获取评论失败:', error)
        return { success: false, message: '获取评论失败', error: error.message }
      }
    },

    // 创建评论
    createComment: async (postId, commentData) => {
      try {
        const result = await wx.cloud.callFunction({
          name: 'community',
          data: { 
            action: 'createComment',
            postId,
            commentData
          }
        })
        return result.result
      } catch (error) {
        console.error('创建评论失败:', error)
        return { success: false, message: '创建评论失败', error: error.message }
      }
    },

    // 点赞评论
    likeComment: async (commentId) => {
      try {
        const result = await wx.cloud.callFunction({
          name: 'community',
          data: { 
            action: 'likeComment',
            commentId
          }
        })
        return result.result
      } catch (error) {
        console.error('评论点赞失败:', error)
        return { success: false, message: '评论点赞失败', error: error.message }
      }
    },

    // 回复评论
    replyComment: async (commentId, replyData) => {
      try {
        const result = await wx.cloud.callFunction({
          name: 'community',
          data: { 
            action: 'replyComment',
            commentId,
            replyData
          }
        })
        return result.result
      } catch (error) {
        console.error('回复评论失败:', error)
        return { success: false, message: '回复评论失败', error: error.message }
      }
    },

    // 获取评论回复
    getCommentReplies: async (commentId, page = 1, limit = 10) => {
      try {
        const result = await wx.cloud.callFunction({
          name: 'community',
          data: { 
            action: 'getCommentReplies',
            commentId,
            page,
            limit
          }
        })
        return result.result
      } catch (error) {
        console.error('获取评论回复失败:', error)
        return { success: false, message: '获取评论回复失败', error: error.message }
      }
    },

    // ==================== 用户统计相关API ====================
    
    // 获取用户统计数据
    getUserStats: async () => {
      try {
        const result = await wx.cloud.callFunction({
          name: 'community',
          data: { action: 'getUserStats' }
        })
        return result.result
      } catch (error) {
        console.error('获取用户统计数据失败:', error)
        return { success: false, message: '获取用户统计数据失败', error: error.message }
      }
    },

    // 关注用户
    followUser: async (targetUserId) => {
      try {
        const result = await wx.cloud.callFunction({
          name: 'community',
          data: { 
            action: 'followUser',
            targetUserId
          }
        })
        return result.result
      } catch (error) {
        console.error('关注用户失败:', error)
        return { success: false, message: '关注用户失败', error: error.message }
      }
    },

    // 取消关注用户
    unfollowUser: async (targetUserId) => {
      try {
        const result = await wx.cloud.callFunction({
          name: 'community',
          data: { 
            action: 'unfollowUser',
            targetUserId
          }
        })
        return result.result
      } catch (error) {
        console.error('取消关注用户失败:', error)
        return { success: false, message: '取消关注用户失败', error: error.message }
      }
    }
  }
}

// 错误处理工具
const handleCloudError = (error, showToast = true) => {
  console.error('Cloud API Error:', error)
  
  let message = '操作失败'
  
  if (error.message) {
    message = error.message
  } else if (error.errMsg) {
    message = error.errMsg
  }

  if (showToast) {
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    })
  }

  return message
}

// 创建API实例
const cloudApi = new CloudAPI()

// 导出API实例和工具函数
module.exports = {
  cloudApi,
  handleCloudError
}

// 使用示例：
/*
// 在页面中使用
const { cloudApi, handleCloudError } = require('../../utils/cloudApi')

Page({
  data: {
    pet: null,
    loading: false
  },

  async onLoad() {
    await this.loadPetData()
  },

  // 加载宠物数据
  async loadPetData() {
    try {
      this.setData({ loading: true })
      const result = await cloudApi.pet.get()
      
      if (result.success) {
        this.setData({ pet: result.data })
      } else {
        handleCloudError(new Error(result.message))
      }
    } catch (error) {
      handleCloudError(error)
    } finally {
      this.setData({ loading: false })
    }
  },

  // 喂食宠物
  async feedPet() {
    try {
      const result = await cloudApi.pet.feed()
      
      if (result.success) {
        wx.showToast({ title: '喂食成功!' })
        this.setData({ 
          pet: {
            ...this.data.pet,
            ...result.data.pet
          }
        })
      } else {
        handleCloudError(new Error(result.message))
      }
    } catch (error) {
      handleCloudError(error)
    }
  },

  // 发送聊天消息
  async sendMessage(message) {
    try {
      const result = await cloudApi.chat.sendMessage(message)
      
      if (result.success) {
        // 更新聊天界面
        this.addMessageToChat(result.data.userMessage)
        this.addMessageToChat(result.data.petReply)
      } else {
        handleCloudError(new Error(result.message))
      }
    } catch (error) {
      handleCloudError(error)
    }
  }
})
*/