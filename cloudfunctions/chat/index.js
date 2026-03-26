// 聊天相关云函数
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

  try {
    switch (action) {
      case 'sendMessage':
        return await sendMessage(wxContext.OPENID, event.message, event.messageType)
      case 'getHistory':
        return await getChatHistory(wxContext.OPENID, event.page, event.limit)
      case 'getStats':
        return await getChatStats(wxContext.OPENID)
      case 'clearHistory':
        return await clearChatHistory(wxContext.OPENID)
      default:
        return { success: false, message: '未知操作' }
    }
  } catch (error) {
    console.error('聊天操作失败:', error)
    return {
      success: false,
      message: '操作失败',
      error: error.message
    }
  }
}

// 发送消息
async function sendMessage(openid, message, messageType = 'text') {
  // 获取用户和宠物信息
  const userResult = await db.collection('users').where({ openid }).get()
  if (userResult.data.length === 0) {
    return { success: false, message: '用户不存在' }
  }

  const userId = userResult.data[0]._id
  const petResult = await db.collection('pets').where({ userId }).get()
  
  if (petResult.data.length === 0) {
    return { success: false, message: '宠物不存在' }
  }

  const pet = petResult.data[0]

  // 保存用户消息
  const userMessageResult = await db.collection('chatlogs').add({
    data: {
      userId,
      petId: pet._id,
      from: 'user',
      message,
      messageType,
      timestamp: new Date()
    }
  })

  // 生成AI回复
  const aiReply = generateAIReply(message, pet)
  
  // 保存AI回复
  const petMessageResult = await db.collection('chatlogs').add({
    data: {
      userId,
      petId: pet._id,
      from: 'pet',
      message: aiReply.message,
      messageType: 'text',
      aiModel: aiReply.model,
      sentiment: aiReply.sentiment,
      timestamp: new Date()
    }
  })

  // 更新宠物统计和状态
  let moodChange = 0
  if (aiReply.sentiment === 'positive') {
    moodChange = 2
  } else if (aiReply.sentiment === 'negative') {
    moodChange = -1
  }

  await db.collection('pets').doc(pet._id).update({
    data: {
      'stats.totalChatMessages': _.inc(1),
      mood: Math.max(0, Math.min(100, pet.mood + moodChange)),
      lastInteractionTime: new Date()
    }
  })

  return {
    success: true,
    message: '消息发送成功',
    data: {
      userMessage: {
        _id: userMessageResult._id,
        from: 'user',
        message,
        messageType,
        timestamp: new Date()
      },
      petReply: {
        _id: petMessageResult._id,
        from: 'pet',
        message: aiReply.message,
        messageType: 'text',
        timestamp: new Date()
      },
      petStatus: {
        mood: Math.max(0, Math.min(100, pet.mood + moodChange))
      }
    }
  }
}

// 获取聊天历史
async function getChatHistory(openid, page = 1, limit = 50) {
  const userResult = await db.collection('users').where({ openid }).get()
  if (userResult.data.length === 0) {
    return { success: false, message: '用户不存在' }
  }

  const userId = userResult.data[0]._id
  
  const chatLogs = await db.collection('chatlogs')
    .where({ userId })
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .skip((page - 1) * limit)
    .get()

  // 反转数组以获得正确的时间顺序
  chatLogs.data.reverse()

  const total = await db.collection('chatlogs').where({ userId }).count()

  return {
    success: true,
    data: {
      chatLogs: chatLogs.data,
      pagination: {
        page,
        limit,
        total: total.total,
        pages: Math.ceil(total.total / limit)
      }
    }
  }
}

// 获取聊天统计
async function getChatStats(openid) {
  const userResult = await db.collection('users').where({ openid }).get()
  if (userResult.data.length === 0) {
    return { success: false, message: '用户不存在' }
  }

  const userId = userResult.data[0]._id
  
  // 获取总消息数
  const totalMessages = await db.collection('chatlogs').where({ userId }).count()
  
  // 获取用户消息数
  const userMessages = await db.collection('chatlogs').where({
    userId,
    from: 'user'
  }).count()
  
  // 获取宠物消息数
  const petMessages = await db.collection('chatlogs').where({
    userId,
    from: 'pet'
  }).count()

  // 获取最近7天的聊天数量
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  const recentChats = await db.collection('chatlogs').where({
    userId,
    timestamp: _.gte(sevenDaysAgo)
  }).count()

  return {
    success: true,
    data: {
      totalMessages: totalMessages.total,
      userMessages: userMessages.total,
      petMessages: petMessages.total,
      recentChats: recentChats.total
    }
  }
}

// 清空聊天记录
async function clearChatHistory(openid) {
  const userResult = await db.collection('users').where({ openid }).get()
  if (userResult.data.length === 0) {
    return { success: false, message: '用户不存在' }
  }

  const userId = userResult.data[0]._id
  
  // 删除所有聊天记录
  const result = await db.collection('chatlogs').where({ userId }).remove()

  return {
    success: true,
    message: '聊天记录清空成功',
    data: {
      deletedCount: result.stats.removed
    }
  }
}

// 生成AI回复（简化版本）
function generateAIReply(userMessage, pet) {
  const lowerMessage = userMessage.toLowerCase()
  
  // 根据宠物状态调整回复
  const moodReplies = {
    happy: ['我今天心情超好的！', '和你聊天真开心～', '你总是能让我开心！'],
    sad: ['我有点不开心...', '需要你的安慰', '抱抱我好吗？'],
    normal: ['你好呀！', '今天过得怎么样？', '我在这里陪着你～']
  }

  const hungerReplies = {
    hungry: ['我好饿呀，有好吃的吗？', '肚子咕咕叫了～', '想吃小鱼干！'],
    full: ['刚吃饱，好满足～', '谢谢你的美食！', '现在不饿呢']
  }

  // 关键词回复
  if (lowerMessage.includes('你好') || lowerMessage.includes('hi')) {
    return {
      message: `你好呀！我是${pet.name}`,
      model: 'simple-ai',
      sentiment: 'positive'
    }
  }
  
  if (lowerMessage.includes('名字') || lowerMessage.includes('叫什么')) {
    return {
      message: `我叫${pet.name}，很高兴认识你！`,
      model: 'simple-ai',
      sentiment: 'positive'
    }
  }
  
  if (lowerMessage.includes('饿') || lowerMessage.includes('吃')) {
    const replies = pet.hunger > 70 ? hungerReplies.hungry : hungerReplies.full
    return {
      message: replies[Math.floor(Math.random() * replies.length)],
      model: 'simple-ai',
      sentiment: 'neutral'
    }
  }
  
  if (lowerMessage.includes('玩') || lowerMessage.includes('游戏')) {
    return {
      message: '好呀！我们来玩游戏吧！',
      model: 'simple-ai',
      sentiment: 'positive'
    }
  }

  // 根据心情返回默认回复
  let replies
  if (pet.mood > 80) {
    replies = moodReplies.happy
  } else if (pet.mood < 40) {
    replies = moodReplies.sad
  } else {
    replies = moodReplies.normal
  }

  // 简单的情感分析
  const positiveWords = ['开心', '高兴', '喜欢', '爱', '好', '棒', '赞', '谢谢', '可爱']
  const negativeWords = ['难过', '伤心', '生气', '讨厌', '不好', '坏', '累', '痛']
  
  const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length
  const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length
  
  let sentiment = 'neutral'
  if (positiveCount > negativeCount) {
    sentiment = 'positive'
  } else if (negativeCount > positiveCount) {
    sentiment = 'negative'
  }

  return {
    message: replies[Math.floor(Math.random() * replies.length)],
    model: 'simple-ai',
    sentiment
  }
}