// 社区相关云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { action } = event

  console.log('🚀 community云函数被调用')
  console.log('📝 接收到的event:', JSON.stringify(event))
  console.log('📝 action参数:', action)
  console.log('📝 action类型:', typeof action)

  try {
    // 特殊处理deletePost
    if (action === 'deletePost') {
      console.log('✅ 匹配到deletePost，开始执行删除')
      return await deletePost(wxContext.OPENID, event.postId)
    }
    
    switch (action) {
      case 'getPosts':
        console.log('✅ 匹配到getPosts')
        return await getPosts(event.category, event.page, event.limit)
      case 'getPostDetail':
        console.log('✅ 匹配到getPostDetail')
        return await getPostDetail(event.postId)
      case 'createPost':
        console.log('✅ 匹配到createPost')
        return await createPost(wxContext.OPENID, event.postData)
      case 'likePost':
        console.log('✅ 匹配到likePost')
        return await likePost(wxContext.OPENID, event.postId)
      case 'favoritePost':
        console.log('✅ 匹配到favoritePost')
        return await favoritePost(wxContext.OPENID, event.postId)
      case 'searchPosts':
        console.log('✅ 匹配到searchPosts')
        return await searchPosts(event.keyword, event.page, event.limit)
      case 'getUserPosts':
        console.log('✅ 匹配到getUserPosts')
        return await getUserPosts(wxContext.OPENID, event.page, event.limit)
      // 评论相关操作
      case 'getComments':
        console.log('✅ 匹配到getComments')
        return await getComments(event.postId, event.page, event.limit)
      case 'createComment':
        console.log('✅ 匹配到createComment')
        return await createComment(wxContext.OPENID, event.postId, event.commentData)
      case 'likeComment':
        console.log('✅ 匹配到likeComment')
        return await likeComment(wxContext.OPENID, event.commentId)
      case 'replyComment':
        console.log('✅ 匹配到replyComment')
        return await replyComment(wxContext.OPENID, event.commentId, event.replyData)
      case 'getCommentReplies':
        console.log('✅ 匹配到getCommentReplies')
        return await getCommentReplies(event.commentId, event.page, event.limit)
      // 反馈相关操作
      case 'submitFeedback':
        console.log('✅ 匹配到submitFeedback')
        return await submitFeedback(wxContext.OPENID, event.feedbackData)
      case 'getFeedbacks':
        console.log('✅ 匹配到getFeedbacks')
        return await getFeedbacks(wxContext.OPENID, event.page, event.limit)
      // 用户统计数据
      case 'getUserStats':
        console.log('✅ 匹配到getUserStats')
        return await getUserStats(wxContext.OPENID)
      case 'followUser':
        console.log('✅ 匹配到followUser')
        return await followUser(wxContext.OPENID, event.targetUserId)
      case 'unfollowUser':
        console.log('✅ 匹配到unfollowUser')
        return await unfollowUser(wxContext.OPENID, event.targetUserId)
      default:
        console.log('❌ 未匹配到任何操作，进入default')
        console.log('📝 所有可用的case:', ['getPosts', 'getPostDetail', 'createPost', 'deletePost', 'likePost', 'favoritePost', 'searchPosts', 'getUserPosts', 'getComments', 'createComment', 'likeComment', 'replyComment', 'getCommentReplies', 'submitFeedback', 'getFeedbacks', 'getUserStats', 'followUser', 'unfollowUser'])
        return { success: false, message: '未知操作: ' + action }
    }
  } catch (error) {
    console.error('社区操作失败:', error)
    return {
      success: false,
      message: '操作失败',
      error: error.message
    }
  }
}

// 获取帖子详情
async function getPostDetail(postId) {
  try {
    console.log('📖 获取帖子详情:', postId)
    
    // 查询帖子
    const result = await db.collection('posts').doc(postId).get()
    
    if (!result.data) {
      console.log('❌ 帖子不存在:', postId)
      return { success: false, message: '帖子不存在' }
    }
    
    const post = result.data
    console.log('📄 原始帖子数据:', post)
    
    // 获取点赞数
    const likeCount = await db.collection('post_likes')
      .where({ postId: postId })
      .count()
    
    // 获取收藏数
    const favoriteCount = await db.collection('post_favorites')
      .where({ postId: postId })
      .count()
    
    // 获取评论数据
    const commentsResult = await db.collection('comments')
      .where({ postId: postId })
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get()
    
    // 确保数据格式正确，特别是中文内容
    const postDetail = {
      ...post,
      _id: post._id,
      title: post.title || '未命名帖子',
      content: post.content || '这是一个精彩的帖子内容...',
      author: post.author || { name: '匿名用户', avatar: '' },
      images: post.images || [],
      type: post.type || 'image',
      tags: post.tags || [],
      petType: post.petType || '🐾',
      likeCount: likeCount.total,
      favoriteCount: favoriteCount.total,
      collectCount: favoriteCount.total,
      comments: commentsResult.data || [],
      commentCount: commentsResult.data.length,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    }
    
    console.log('✅ 处理后的帖子详情:', {
      id: postDetail._id,
      title: postDetail.title,
      author: postDetail.author.name,
      likeCount: postDetail.likeCount,
      favoriteCount: postDetail.favoriteCount,
      commentCount: postDetail.commentCount
    })
    
    return {
      success: true,
      data: postDetail
    }
  } catch (error) {
    console.error('❌ 获取帖子详情失败:', error)
    return { success: false, message: '获取帖子详情失败', error: error.message }
  }
}

// 获取帖子列表
async function getPosts(category = 'recommend', page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit
    
    // 构建查询条件
    let query = {}
    if (category && category !== 'recommend') {
      query.category = category
    }
    
    // 查询帖子
    const result = await db.collection('posts')
      .where(query)
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(limit)
      .get()
    
    // 获取帖子的点赞和收藏统计
    const posts = await Promise.all(result.data.map(async (post) => {
      // 获取点赞数
      const likeCount = await db.collection('post_likes')
        .where({ postId: post._id })
        .count()
      
      // 获取收藏数
      const favoriteCount = await db.collection('post_favorites')
        .where({ postId: post._id })
        .count()
      
      return {
        ...post,
        likeCount: likeCount.total,
        favoriteCount: favoriteCount.total,
        collectCount: favoriteCount.total // 兼容前端字段名
      }
    }))
    
    console.log('✅ 获取帖子成功:', posts.length, '条')
    
    return {
      success: true,
      data: {
        posts: posts,
        hasMore: posts.length === limit
      }
    }
  } catch (error) {
    console.error('❌ 获取帖子失败:', error)
    return { success: false, message: '获取帖子失败', error: error.message }
  }
}

// 创建帖子
async function createPost(openid, postData) {
  try {
    // 先获取用户ID
    const userResult = await db.collection('users').where({ openid }).get()
    if (userResult.data.length === 0) {
      return { success: false, message: '用户不存在' }
    }
    
    const userId = userResult.data[0]._id
    const user = userResult.data[0]
    
    // 创建帖子
    const post = {
      userId: userId,
      author: {
        name: user.nickName || '匿名用户',
        avatar: user.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg?seed=default&size=50',
        openid: openid // 添加openid用于权限验证
      },
      title: postData.title,
      content: postData.content,
      images: postData.images || [],
      category: postData.category || 'daily',
      tags: postData.tags || [],
      petType: postData.petType || '🐾',
      type: postData.type || 'image',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const result = await db.collection('posts').add({
      data: post
    })
    
    return {
      success: true,
      data: {
        postId: result._id,
        ...post
      }
    }
  } catch (error) {
    console.error('创建帖子失败:', error)
    return { success: false, message: '创建帖子失败', error: error.message }
  }
}

// 删除帖子
async function deletePost(openid, postId) {
  try {
    console.log('🗑️ 删除帖子:', { openid, postId })
    
    // 先检查帖子是否存在
    const postResult = await db.collection('posts').doc(postId).get()
    if (!postResult.data) {
      console.log('❌ 帖子不存在:', postId)
      return { success: false, message: '帖子不存在' }
    }
    
    const post = postResult.data
    console.log('📝 帖子userId:', post.userId)
    console.log('📝 当前用户openid:', openid)
    console.log('📝 ID匹配检查:', post.userId === openid)
    
    // 验证权限：检查userId字段（这是帖子创建者的ID）
    if (post.userId !== openid) {
      console.log('❌ 权限验证失败: userId不匹配')
      console.log('📝 帖子userId类型:', typeof post.userId)
      console.log('📝 当前openid类型:', typeof openid)
      
      // 尝试其他可能的字段
      if (post._openid === openid) {
        console.log('✅ 通过_openid字段验证权限')
      } else if (post.author && post.author.openid === openid) {
        console.log('✅ 通过author.openid字段验证权限')
      } else {
        return { success: false, message: '无权限删除此帖子' }
      }
    } else {
      console.log('✅ 通过userId字段验证权限')
    }
    
    console.log('✅ 权限验证通过，开始删除')
    
    // 删除帖子本身
    const deleteResult = await db.collection('posts').doc(postId).remove()
    console.log('📝 删除结果:', deleteResult)
    
    // 尝试删除相关数据（如果失败也不影响主要删除操作）
    try {
      await Promise.all([
        // 删除帖子的所有点赞记录
        db.collection('post_likes').where({ postId }).remove(),
        
        // 删除帖子的所有收藏记录  
        db.collection('post_favorites').where({ postId }).remove(),
        
        // 删除帖子的所有评论
        db.collection('comments').where({ postId }).remove()
      ])
      console.log('✅ 相关数据删除成功')
    } catch (relatedError) {
      console.log('⚠️ 相关数据删除失败，但主帖子已删除:', relatedError)
    }
    
    console.log('✅ 帖子删除成功:', postId)
    return { success: true, message: '帖子删除成功' }
  } catch (error) {
    console.error('❌ 删除帖子失败:', error)
    return { success: false, message: '删除帖子失败', error: error.message }
  }
}

// 删除帖子相关的评论点赞记录
async function deletePostCommentLikes(postId) {
  try {
    // 获取帖子的所有评论ID
    const commentsResult = await db.collection('comments')
      .where({ postId })
      .field({ _id: true })
      .get()
    
    if (commentsResult.data.length > 0) {
      const commentIds = commentsResult.data.map(comment => comment._id)
      
      // 删除这些评论的点赞记录
      await db.collection('comment_likes')
        .where({ commentId: _.in(commentIds) })
        .remove()
    }
  } catch (error) {
    console.error('删除评论点赞记录失败:', error)
  }
}

// 点赞帖子
async function likePost(openid, postId) {
  try {
    // 先获取用户ID
    const userResult = await db.collection('users').where({ openid }).get()
    if (userResult.data.length === 0) {
      return { success: false, message: '用户不存在' }
    }
    
    const userId = userResult.data[0]._id
    
    // 检查是否已经点赞
    const existingLike = await db.collection('post_likes')
      .where({
        userId: userId,
        postId: postId
      })
      .get()
    
    let liked = false
    
    if (existingLike.data.length > 0) {
      // 已点赞，取消点赞
      await db.collection('post_likes').doc(existingLike.data[0]._id).remove()
      liked = false
    } else {
      // 未点赞，添加点赞
      await db.collection('post_likes').add({
        data: {
          userId: userId,
          postId: postId,
          createdAt: new Date()
        }
      })
      liked = true
    }
    
    // 获取最新点赞数
    const likeCount = await db.collection('post_likes')
      .where({ postId: postId })
      .count()
    
    return {
      success: true,
      data: {
        liked: liked,
        likeCount: likeCount.total
      }
    }
  } catch (error) {
    console.error('点赞操作失败:', error)
    return { success: false, message: '点赞操作失败', error: error.message }
  }
}

// 收藏帖子
async function favoritePost(openid, postId) {
  try {
    // 先获取用户ID
    const userResult = await db.collection('users').where({ openid }).get()
    if (userResult.data.length === 0) {
      return { success: false, message: '用户不存在' }
    }
    
    const userId = userResult.data[0]._id
    
    // 检查是否已经收藏
    const existingFavorite = await db.collection('post_favorites')
      .where({
        userId: userId,
        postId: postId
      })
      .get()
    
    let favorited = false
    
    if (existingFavorite.data.length > 0) {
      // 已收藏，取消收藏
      await db.collection('post_favorites').doc(existingFavorite.data[0]._id).remove()
      favorited = false
    } else {
      // 未收藏，添加收藏
      await db.collection('post_favorites').add({
        data: {
          userId: userId,
          postId: postId,
          createdAt: new Date()
        }
      })
      favorited = true
    }
    
    // 获取最新收藏数
    const favoriteCount = await db.collection('post_favorites')
      .where({ postId: postId })
      .count()
    
    return {
      success: true,
      data: {
        favorited: favorited,
        favoriteCount: favoriteCount.total,
        collectCount: favoriteCount.total // 兼容前端字段名
      }
    }
  } catch (error) {
    console.error('收藏操作失败:', error)
    return { success: false, message: '收藏操作失败', error: error.message }
  }
}

// 搜索帖子
async function searchPosts(keyword, page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit
    
    // 使用正则表达式进行模糊搜索
    const searchRegex = db.RegExp({
      regexp: keyword,
      options: 'i'
    })
    
    const result = await db.collection('posts')
      .where(_.or([
        { title: searchRegex },
        { content: searchRegex },
        { tags: _.elemMatch(searchRegex) }
      ]))
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(limit)
      .get()
    
    // 获取帖子的点赞和收藏统计
    const posts = await Promise.all(result.data.map(async (post) => {
      const likeCount = await db.collection('post_likes')
        .where({ postId: post._id })
        .count()
      
      const favoriteCount = await db.collection('post_favorites')
        .where({ postId: post._id })
        .count()
      
      return {
        ...post,
        likeCount: likeCount.total,
        favoriteCount: favoriteCount.total,
        collectCount: favoriteCount.total
      }
    }))
    
    return {
      success: true,
      data: {
        posts: posts,
        hasMore: posts.length === limit
      }
    }
  } catch (error) {
    console.error('搜索帖子失败:', error)
    return { success: false, message: '搜索帖子失败', error: error.message }
  }
}

// 获取用户发布的帖子
async function getUserPosts(openid, page = 1, limit = 10) {
  try {
    // 先获取用户ID
    const userResult = await db.collection('users').where({ openid }).get()
    if (userResult.data.length === 0) {
      return { success: false, message: '用户不存在' }
    }
    
    const userId = userResult.data[0]._id
    const skip = (page - 1) * limit
    
    const result = await db.collection('posts')
      .where({ userId: userId })
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(limit)
      .get()
    
    // 获取帖子的点赞和收藏统计
    const posts = await Promise.all(result.data.map(async (post) => {
      const likeCount = await db.collection('post_likes')
        .where({ postId: post._id })
        .count()
      
      const favoriteCount = await db.collection('post_favorites')
        .where({ postId: post._id })
        .count()
      
      return {
        ...post,
        likeCount: likeCount.total,
        favoriteCount: favoriteCount.total,
        collectCount: favoriteCount.total
      }
    }))
    
    return {
      success: true,
      data: {
        posts: posts,
        hasMore: posts.length === limit
      }
    }
  } catch (error) {
    console.error('获取用户帖子失败:', error)
    return { success: false, message: '获取用户帖子失败', error: error.message }
  }
}

// ==================== 评论相关功能 ====================

// 获取帖子评论
async function getComments(postId, page = 1, limit = 20) {
  try {
    console.log('📖 获取帖子评论:', { postId, page, limit })
    
    const skip = (page - 1) * limit
    
    // 查询评论
    const result = await db.collection('comments')
      .where({ postId: postId })
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(limit)
      .get()
    
    // 获取每个评论的点赞数和回复数
    const comments = await Promise.all(result.data.map(async (comment) => {
      // 获取评论点赞数
      const likeCount = await db.collection('comment_likes')
        .where({ commentId: comment._id })
        .count()
      
      // 获取回复数
      const replyCount = await db.collection('comment_replies')
        .where({ commentId: comment._id })
        .count()
      
      // 获取最新的几条回复（只显示前3条）
      const repliesResult = await db.collection('comment_replies')
        .where({ commentId: comment._id })
        .orderBy('createdAt', 'desc')
        .limit(3)
        .get()
      
      return {
        ...comment,
        likeCount: likeCount.total,
        replyCount: replyCount.total,
        totalReplies: replyCount.total,
        replies: repliesResult.data.map(reply => ({
          ...reply,
          id: reply._id,
          time: formatCommentTime(reply.createdAt)
        })) || [],
        // 格式化时间
        time: formatCommentTime(comment.createdAt)
      }
    }))
    
    console.log('✅ 获取评论成功:', comments.length, '条')
    
    return {
      success: true,
      data: {
        comments: comments,
        hasMore: comments.length === limit
      }
    }
  } catch (error) {
    console.error('❌ 获取评论失败:', error)
    return { success: false, message: '获取评论失败', error: error.message }
  }
}

// 创建评论
async function createComment(openid, postId, commentData) {
  try {
    console.log('💬 创建评论:', { openid, postId, commentData })
    
    // 先获取用户信息
    const userResult = await db.collection('users').where({ openid }).get()
    if (userResult.data.length === 0) {
      return { success: false, message: '用户不存在' }
    }
    
    const user = userResult.data[0]
    
    // 创建评论
    const comment = {
      postId: postId,
      userId: user._id,
      userName: user.nickName || '匿名用户',
      avatar: user.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg?seed=default&size=50',
      content: commentData.content,
      location: commentData.location || '北京',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const result = await db.collection('comments').add({
      data: comment
    })
    
    console.log('✅ 评论创建成功:', result._id)
    
    return {
      success: true,
      data: {
        commentId: result._id,
        ...comment,
        id: result._id,
        likeCount: 0,
        liked: false,
        replyCount: 0,
        totalReplies: 0,
        replies: [],
        time: '刚刚'
      }
    }
  } catch (error) {
    console.error('❌ 创建评论失败:', error)
    return { success: false, message: '创建评论失败', error: error.message }
  }
}

// 点赞评论
async function likeComment(openid, commentId) {
  try {
    console.log('👍 点赞评论:', { openid, commentId })
    
    // 先获取用户ID
    const userResult = await db.collection('users').where({ openid }).get()
    if (userResult.data.length === 0) {
      return { success: false, message: '用户不存在' }
    }
    
    const userId = userResult.data[0]._id
    
    // 检查是否已经点赞
    const existingLike = await db.collection('comment_likes')
      .where({
        userId: userId,
        commentId: commentId
      })
      .get()
    
    let liked = false
    
    if (existingLike.data.length > 0) {
      // 已点赞，取消点赞
      await db.collection('comment_likes').doc(existingLike.data[0]._id).remove()
      liked = false
    } else {
      // 未点赞，添加点赞
      await db.collection('comment_likes').add({
        data: {
          userId: userId,
          commentId: commentId,
          createdAt: new Date()
        }
      })
      liked = true
    }
    
    // 获取最新点赞数
    const likeCount = await db.collection('comment_likes')
      .where({ commentId: commentId })
      .count()
    
    console.log('✅ 评论点赞操作成功:', { liked, likeCount: likeCount.total })
    
    return {
      success: true,
      data: {
        liked: liked,
        likeCount: likeCount.total
      }
    }
  } catch (error) {
    console.error('❌ 评论点赞操作失败:', error)
    return { success: false, message: '评论点赞操作失败', error: error.message }
  }
}

// 回复评论
async function replyComment(openid, commentId, replyData) {
  try {
    console.log('💬 回复评论:', { openid, commentId, replyData })
    
    // 先获取用户信息
    const userResult = await db.collection('users').where({ openid }).get()
    if (userResult.data.length === 0) {
      return { success: false, message: '用户不存在' }
    }
    
    const user = userResult.data[0]
    
    // 创建回复
    const reply = {
      commentId: commentId,
      userId: user._id,
      userName: user.nickName || '匿名用户',
      avatar: user.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg?seed=default&size=30',
      content: replyData.content,
      replyToUserName: replyData.replyToUserName || '',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const result = await db.collection('comment_replies').add({
      data: reply
    })
    
    console.log('✅ 回复创建成功:', result._id)
    
    return {
      success: true,
      data: {
        replyId: result._id,
        ...reply,
        id: result._id,
        time: '刚刚'
      }
    }
  } catch (error) {
    console.error('❌ 创建回复失败:', error)
    return { success: false, message: '创建回复失败', error: error.message }
  }
}

// 获取评论回复
async function getCommentReplies(commentId, page = 1, limit = 10) {
  try {
    console.log('📖 获取评论回复:', { commentId, page, limit })
    
    const skip = (page - 1) * limit
    
    // 查询回复
    const result = await db.collection('comment_replies')
      .where({ commentId: commentId })
      .orderBy('createdAt', 'asc') // 回复按时间正序排列
      .skip(skip)
      .limit(limit)
      .get()
    
    // 格式化回复数据
    const replies = result.data.map(reply => ({
      ...reply,
      id: reply._id,
      time: formatCommentTime(reply.createdAt)
    }))
    
    console.log('✅ 获取评论回复成功:', replies.length, '条')
    
    return {
      success: true,
      data: {
        replies: replies,
        hasMore: replies.length === limit
      }
    }
  } catch (error) {
    console.error('❌ 获取评论回复失败:', error)
    return { success: false, message: '获取评论回复失败', error: error.message }
  }
}

// 格式化评论时间
function formatCommentTime(dateStr) {
  if (!dateStr) return '刚刚'
  
  const now = new Date()
  const commentTime = new Date(dateStr)
  const diff = now - commentTime
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  // 超过7天显示具体日期
  return `${commentTime.getMonth() + 1}-${commentTime.getDate()}`
}

// ==================== 反馈相关功能 ====================

// 提交反馈
async function submitFeedback(openid, feedbackData) {
  try {
    console.log('📝 提交反馈:', { openid, feedbackData })
    
    // 先获取用户信息
    const userResult = await db.collection('users').where({ openid }).get()
    if (userResult.data.length === 0) {
      return { success: false, message: '用户不存在' }
    }
    
    const user = userResult.data[0]
    
    // 创建反馈记录
    const feedback = {
      userId: user._id,
      openid: openid,
      userInfo: {
        name: user.nickName || '匿名用户',
        avatar: user.avatarUrl || ''
      },
      type: feedbackData.type || 'other',
      title: feedbackData.title,
      content: feedbackData.content,
      contact: feedbackData.contact || '',
      images: feedbackData.images || [],
      deviceInfo: feedbackData.deviceInfo || {},
      appVersion: feedbackData.appVersion || '1.0.0',
      status: 'pending', // pending, processing, resolved, closed
      priority: 'normal', // low, normal, high, urgent
      adminReply: '',
      adminReplyTime: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const result = await db.collection('feedbacks').add({
      data: feedback
    })
    
    console.log('✅ 反馈提交成功:', result._id)
    
    return {
      success: true,
      data: {
        feedbackId: result._id,
        ...feedback,
        id: result._id
      },
      message: '反馈提交成功，我们会尽快处理'
    }
  } catch (error) {
    console.error('❌ 提交反馈失败:', error)
    return { success: false, message: '提交反馈失败', error: error.message }
  }
}

// 获取用户反馈历史
async function getFeedbacks(openid, page = 1, limit = 20) {
  try {
    console.log('📖 获取用户反馈历史:', { openid, page, limit })
    
    // 先获取用户ID
    const userResult = await db.collection('users').where({ openid }).get()
    if (userResult.data.length === 0) {
      return { success: false, message: '用户不存在' }
    }
    
    const userId = userResult.data[0]._id
    const skip = (page - 1) * limit
    
    // 查询用户的反馈记录
    const result = await db.collection('feedbacks')
      .where({ userId: userId })
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(limit)
      .get()
    
    // 格式化反馈数据
    const feedbacks = result.data.map(feedback => ({
      ...feedback,
      id: feedback._id,
      statusText: getStatusText(feedback.status),
      typeText: getTypeText(feedback.type),
      timeText: formatFeedbackTime(feedback.createdAt),
      hasReply: !!feedback.adminReply
    }))
    
    console.log('✅ 获取反馈历史成功:', feedbacks.length, '条')
    
    return {
      success: true,
      data: {
        feedbacks: feedbacks,
        hasMore: feedbacks.length === limit
      }
    }
  } catch (error) {
    console.error('❌ 获取反馈历史失败:', error)
    return { success: false, message: '获取反馈历史失败', error: error.message }
  }
}

// 获取反馈状态文本
function getStatusText(status) {
  const statusMap = {
    'pending': '待处理',
    'processing': '处理中',
    'resolved': '已解决',
    'closed': '已关闭'
  }
  return statusMap[status] || '未知状态'
}

// 获取反馈类型文本
function getTypeText(type) {
  const typeMap = {
    'bug': 'Bug反馈',
    'suggestion': '功能建议',
    'other': '其他问题'
  }
  return typeMap[type] || '其他问题'
}

// 格式化反馈时间
function formatFeedbackTime(dateStr) {
  if (!dateStr) return '未知时间'
  
  const now = new Date()
  const feedbackTime = new Date(dateStr)
  const diff = now - feedbackTime
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  
  // 超过30天显示具体日期
  return `${feedbackTime.getFullYear()}-${(feedbackTime.getMonth() + 1).toString().padStart(2, '0')}-${feedbackTime.getDate().toString().padStart(2, '0')}`
}

// 获取用户统计数据
async function getUserStats(openid) {
  try {
    console.log('📊 获取用户统计数据:', openid)
    
    // 先获取用户ID
    const userResult = await db.collection('users').where({ openid }).get()
    if (userResult.data.length === 0) {
      return { success: false, message: '用户不存在' }
    }
    
    const userId = userResult.data[0]._id
    
    // 并行获取各种统计数据
    const [
      postsCount,
      likesCount,
      followersCount,
      followingCount
    ] = await Promise.all([
      // 获取用户发布的帖子数量 - 使用userId字段查询更可靠
      db.collection('posts').where({ userId: userId }).count(),
      
      // 获取用户帖子的总点赞数
      getUserTotalLikes(openid),
      
      // 获取粉丝数（关注该用户的人数）
      db.collection('user_follows').where({ followedUserId: userId }).count(),
      
      // 获取关注数（该用户关注的人数）
      db.collection('user_follows').where({ followerUserId: userId }).count()
    ])
    
    const stats = {
      dynamic: postsCount.total || 0,
      likes: likesCount || 0,
      followers: followersCount.total || 0,
      following: followingCount.total || 0
    }
    
    console.log('✅ 用户统计数据获取成功:', stats)
    
    return {
      success: true,
      data: stats
    }
  } catch (error) {
    console.error('❌ 获取用户统计数据失败:', error)
    return { success: false, message: '获取统计数据失败', error: error.message }
  }
}

// 获取用户帖子的总点赞数
async function getUserTotalLikes(openid) {
  try {
    // 先获取用户ID
    const userResult = await db.collection('users').where({ openid }).get()
    if (userResult.data.length === 0) {
      return 0
    }
    
    const userId = userResult.data[0]._id
    
    // 获取用户的所有帖子
    const postsResult = await db.collection('posts')
      .where({ userId: userId })
      .field({ _id: true })
      .get()
    
    if (postsResult.data.length === 0) {
      return 0
    }
    
    const postIds = postsResult.data.map(post => post._id)
    
    // 获取这些帖子的总点赞数
    const likesResult = await db.collection('post_likes')
      .where({ postId: _.in(postIds) })
      .count()
    
    return likesResult.total || 0
  } catch (error) {
    console.error('❌ 获取用户总点赞数失败:', error)
    return 0
  }
}

// 关注用户
async function followUser(followerOpenid, targetUserId) {
  try {
    console.log('👥 关注用户:', { followerOpenid, targetUserId })
    
    // 获取关注者用户ID
    const followerResult = await db.collection('users').where({ openid: followerOpenid }).get()
    if (followerResult.data.length === 0) {
      return { success: false, message: '用户不存在' }
    }
    
    const followerUserId = followerResult.data[0]._id
    
    // 检查是否已经关注
    const existingFollow = await db.collection('user_follows')
      .where({
        followerUserId: followerUserId,
        followedUserId: targetUserId
      })
      .get()
    
    if (existingFollow.data.length > 0) {
      return { success: false, message: '已经关注过了' }
    }
    
    // 创建关注记录
    await db.collection('user_follows').add({
      data: {
        followerUserId: followerUserId,
        followedUserId: targetUserId,
        createdAt: new Date()
      }
    })
    
    console.log('✅ 关注成功')
    return { success: true, message: '关注成功' }
  } catch (error) {
    console.error('❌ 关注用户失败:', error)
    return { success: false, message: '关注失败', error: error.message }
  }
}

// 取消关注用户
async function unfollowUser(followerOpenid, targetUserId) {
  try {
    console.log('👥 取消关注用户:', { followerOpenid, targetUserId })
    
    // 获取关注者用户ID
    const followerResult = await db.collection('users').where({ openid: followerOpenid }).get()
    if (followerResult.data.length === 0) {
      return { success: false, message: '用户不存在' }
    }
    
    const followerUserId = followerResult.data[0]._id
    
    // 删除关注记录
    await db.collection('user_follows')
      .where({
        followerUserId: followerUserId,
        followedUserId: targetUserId
      })
      .remove()
    
    console.log('✅ 取消关注成功')
    return { success: true, message: '取消关注成功' }
  } catch (error) {
    console.error('❌ 取消关注失败:', error)
    return { success: false, message: '取消关注失败', error: error.message }
  }
}