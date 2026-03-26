// utils/systemMessage.js
// 系统消息管理工具

const SYSTEM_MESSAGE_KEY = 'petto_system_messages'
const MAX_MESSAGES = 50 // 最多保存50条消息

// 获取所有系统消息
function getSystemMessages() {
  try {
    const messages = wx.getStorageSync(SYSTEM_MESSAGE_KEY)
    return messages || []
  } catch (e) {
    console.error('获取系统消息失败:', e)
    return []
  }
}

// 保存系统消息
function saveSystemMessage(message) {
  try {
    const messages = getSystemMessages()
    // 添加时间戳
    message.id = message.id || `sys_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    message.time = message.time || getTimeText(new Date())
    message.timestamp = Date.now()
    
    // 如果已存在相同类型的消息，先删除旧的
    const existingIndex = messages.findIndex(m => m.type === message.type)
    if (existingIndex !== -1) {
      messages.splice(existingIndex, 1)
    }
    
    // 添加到开头
    messages.unshift(message)
    
    // 只保留最新的50条
    if (messages.length > MAX_MESSAGES) {
      messages.splice(MAX_MESSAGES)
    }
    
    wx.setStorageSync(SYSTEM_MESSAGE_KEY, messages)
    return true
  } catch (e) {
    console.error('保存系统消息失败:', e)
    return false
  }
}

// 标记消息为已读
function markMessageAsRead(messageId) {
  try {
    const messages = getSystemMessages()
    const updatedMessages = messages.map(msg => 
      msg.id === messageId ? Object.assign({}, msg, { unread: false }) : msg
    )
    wx.setStorageSync(SYSTEM_MESSAGE_KEY, updatedMessages)
    return true
  } catch (e) {
    console.error('标记消息已读失败:', e)
    return false
  }
}

// 清除所有系统消息
function clearSystemMessages() {
  try {
    wx.removeStorageSync(SYSTEM_MESSAGE_KEY)
    return true
  } catch (e) {
    console.error('清除系统消息失败:', e)
    return false
  }
}

// 清理不需要的系统消息（只保留喂食和互动相关，每种类型只保留最新一条）
function cleanUnwantedMessages() {
  try {
    const messages = getSystemMessages()
    // 只保留喂食和互动相关的消息类型
    const allowedTypes = [
      'pet_feed',           // 喂食记录
      'pet_hungry',         // 喂食提醒
      'pet_hungry_reminder', // 喂食提醒
      'pet_interaction',    // 互动记录（轻抚）
      'pet_play',           // 互动记录（玩耍）
      'pet_mood_low'        // 心情提醒（需要互动）
    ]
    
    // 先过滤允许的消息类型
    const filteredMessages = messages.filter(m => allowedTypes.includes(m.type))
    
    // 按类型分组，每种类型只保留最新的一条（按timestamp排序）
    const messagesByType = {}
    filteredMessages.forEach(msg => {
      const type = msg.type
      // 确保有timestamp
      let timestamp = msg.timestamp || 0
      if (!timestamp && msg.id) {
        const parsed = parseInt(msg.id.split('_')[1])
        timestamp = parsed || 0
      }
      
      if (!messagesByType[type] || timestamp > (messagesByType[type].timestamp || 0)) {
        messagesByType[type] = Object.assign({}, msg, { timestamp: timestamp })
      }
    })
    
    // 将每种类型的最新消息转换为数组，并按时间戳倒序排序
    const uniqueMessages = Object.values(messagesByType).sort((a, b) => {
      const timeA = a.timestamp || 0
      const timeB = b.timestamp || 0
      return timeB - timeA // 最新的在前
    })
    
    // 如果消息数量有变化，保存清理后的消息
    if (uniqueMessages.length !== messages.length) {
      wx.setStorageSync(SYSTEM_MESSAGE_KEY, uniqueMessages)
      console.log('已清理系统消息:', {
        原始数量: messages.length,
        保留数量: uniqueMessages.length,
        删除数量: messages.length - uniqueMessages.length,
        保留类型: Object.keys(messagesByType)
      })
    }
    
    return true
  } catch (e) {
    console.error('清理系统消息失败:', e)
    return false
  }
}

// 获取时间文本
function getTimeText(date) {
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}-${day < 10 ? '0' + day : day}`
}

// 获取宠物状态存储键
const PET_STATE_KEY = 'petto_pet_state'

// 保存宠物状态
function savePetState(state) {
  try {
    state.lastUpdateTime = Date.now()
    wx.setStorageSync(PET_STATE_KEY, state)
    return true
  } catch (e) {
    console.error('保存宠物状态失败:', e)
    return false
  }
}

// 获取宠物状态
function getPetState() {
  try {
    const state = wx.getStorageSync(PET_STATE_KEY)
    if (!state) {
      // 默认状态
      return {
        hunger: 50,
        mood: 80,
        lastFeedTime: null,
        lastPlayTime: null,
        lastTouchTime: null
      }
    }
    return state
  } catch (e) {
    console.error('获取宠物状态失败:', e)
    return {
      hunger: 50,
      mood: 80,
      lastFeedTime: null,
      lastPlayTime: null,
      lastTouchTime: null
    }
  }
}

// 检查宠物状态并生成提醒消息
function checkPetStateAndNotify() {
  const state = getPetState()
  const now = Date.now()
  
  // 检查饥饿值（每30分钟增加5点饥饿值）
  if (state.lastFeedTime) {
    const minutesSinceFeed = Math.floor((now - state.lastFeedTime) / 60000)
    const hungerIncrease = Math.floor(minutesSinceFeed / 30) * 5
    
    if (hungerIncrease > 0) {
      const newHunger = Math.min(state.hunger + hungerIncrease, 100)
      state.hunger = newHunger
      state.lastUpdateTime = now
      savePetState(state)
      
      // 如果饥饿值超过70，发送提醒
      if (newHunger >= 70 && newHunger < 75) {
        saveSystemMessage({
          type: 'pet_hungry',
          icon: '🍗',
          title: '喂食提醒',
          desc: `你的宠物"${state.petName || 'Petto'}"饿了，快去喂食吧！`,
          time: getTimeText(new Date(now)),
          unread: true,
          action: '去喂食'
        })
      }
    }
  } else if (state.hunger >= 70) {
    // 如果从未喂食过且饥饿值高
    saveSystemMessage({
      type: 'pet_hungry',
      icon: '🍗',
      title: '喂食提醒',
      desc: `你的宠物"${state.petName || 'Petto'}"饿了，快去喂食吧！`,
      time: getTimeText(new Date(now)),
      unread: true,
      action: '去喂食'
    })
  }
  
  // 检查心情值（长时间不互动，心情值会下降）
  if (state.lastPlayTime || state.lastTouchTime) {
    const lastInteractionTime = Math.max(
      state.lastPlayTime || 0,
      state.lastTouchTime || 0
    )
    const hoursSinceInteraction = Math.floor((now - lastInteractionTime) / 3600000)
    
    if (hoursSinceInteraction >= 6 && state.mood > 50) {
      // 6小时没互动，心情下降
      const newMood = Math.max(state.mood - 10, 0)
      state.mood = newMood
      state.lastUpdateTime = now
      savePetState(state)
      
      if (newMood < 60) {
        saveSystemMessage({
          type: 'pet_mood',
          icon: '💕',
          title: '心情提醒',
          desc: `你的宠物"${state.petName || 'Petto'}"心情有点低落，快去陪它玩吧！`,
          time: getTimeText(new Date(now)),
          unread: true,
          action: '去互动'
        })
      }
    }
  }
}

module.exports = {
  getSystemMessages,
  saveSystemMessage,
  markMessageAsRead,
  clearSystemMessages,
  cleanUnwantedMessages,
  savePetState,
  getPetState,
  checkPetStateAndNotify
}

