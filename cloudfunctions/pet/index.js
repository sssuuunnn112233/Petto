// 宠物相关云函数
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
      case 'get':
        return await getPet(wxContext.OPENID)
      case 'feed':
        return await feedPet(wxContext.OPENID)
      case 'play':
        return await playWithPet(wxContext.OPENID)
      case 'customize':
        return await customizePet(wxContext.OPENID, event.customization)
      case 'update':
        return await updatePet(wxContext.OPENID, event.data)
      default:
        return { success: false, message: '未知操作' }
    }
  } catch (error) {
    console.error('宠物操作失败:', error)
    return {
      success: false,
      message: '操作失败',
      error: error.message
    }
  }
}

// 获取宠物信息
async function getPet(openid) {
  // 先获取用户ID
  const userResult = await db.collection('users').where({ openid }).get()
  if (userResult.data.length === 0) {
    return { success: false, message: '用户不存在' }
  }

  const userId = userResult.data[0]._id
  const petResult = await db.collection('pets').where({ userId }).get()
  
  if (petResult.data.length === 0) {
    return { success: false, message: '宠物不存在' }
  }

  let pet = petResult.data[0]
  
  // 应用自动衰减
  pet = applyAutoDecay(pet)
  
  // 更新数据库中的宠物状态
  await db.collection('pets').doc(pet._id).update({
    data: {
      mood: pet.mood,
      hunger: pet.hunger,
      energy: pet.energy,
      lastInteractionTime: pet.lastInteractionTime
    }
  })

  return {
    success: true,
    data: pet
  }
}

// 喂食宠物
async function feedPet(openid) {
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
  const now = new Date()

  // 执行喂食（移除频率限制）
  const newHunger = Math.max(0, pet.hunger - 20)  // 饥饿值减少更多
  const newMood = Math.min(100, pet.mood + 8)     // 心情增加更多
  const newHealth = Math.min(100, pet.health + 3) // 健康增加
  const newEnergy = Math.min(100, pet.energy + 5) // 喂食后精力也会恢复一些
  const newExp = pet.experience + 5
  const newLevel = Math.floor(newExp / 50) + 1

  // 更新宠物数据
  await db.collection('pets').doc(pet._id).update({
    data: {
      hunger: newHunger,
      mood: newMood,
      health: newHealth,
      energy: newEnergy,  // 添加精力更新
      experience: newExp,
      level: newLevel,
      'stats.totalFeedTimes': _.inc(1),
      lastFeedTime: now,
      lastInteractionTime: now
    }
  })

  // 更新用户经验
  await db.collection('users').doc(userId).update({
    data: {
      experience: _.inc(3)
    }
  })

  return {
    success: true,
    message: '喂食成功',
    data: {
      pet: {
        mood: newMood,
        hunger: newHunger,
        health: newHealth,
        energy: newEnergy,  // 返回精力值
        level: newLevel,
        experience: newExp
      }
    }
  }
}

// 陪宠物玩耍
async function playWithPet(openid) {
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
  const now = new Date()

  // 执行玩耍（移除精力和频率限制）
  const newMood = Math.min(100, pet.mood + 15)    // 玩耍让心情增加更多
  const newEnergy = Math.max(0, pet.energy - 8)   // 精力消耗减少一些
  const newHunger = Math.min(100, pet.hunger + 8) // 玩耍后会更饿
  const newExp = pet.experience + 8
  const newLevel = Math.floor(newExp / 50) + 1

  // 更新宠物数据
  await db.collection('pets').doc(pet._id).update({
    data: {
      mood: newMood,
      energy: newEnergy,
      hunger: newHunger,
      experience: newExp,
      level: newLevel,
      'stats.totalPlayTimes': _.inc(1),
      lastPlayTime: now,
      lastInteractionTime: now
    }
  })

  // 更新用户经验
  await db.collection('users').doc(userId).update({
    data: {
      experience: _.inc(5)
    }
  })

  return {
    success: true,
    message: '玩耍成功',
    data: {
      pet: {
        mood: newMood,
        energy: newEnergy,
        hunger: newHunger,
        level: newLevel,
        experience: newExp
      }
    }
  }
}

// 自定义宠物外观
async function customizePet(openid, customization) {
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

  // 更新自定义外观
  await db.collection('pets').doc(pet._id).update({
    data: {
      customization: {
        ...pet.customization,
        ...customization
      }
    }
  })

  return {
    success: true,
    message: '宠物外观更新成功',
    data: {
      customization: {
        ...pet.customization,
        ...customization
      }
    }
  }
}

// 更新宠物基本信息
async function updatePet(openid, data) {
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

  // 更新宠物信息
  await db.collection('pets').doc(pet._id).update({
    data: {
      ...data,
      updatedAt: new Date()
    }
  })

  return {
    success: true,
    message: '宠物信息更新成功'
  }
}

// 自动衰减状态值
function applyAutoDecay(pet) {
  const now = new Date()
  const lastInteraction = new Date(pet.lastInteractionTime)
  const hoursSinceLastInteraction = (now - lastInteraction) / (1000 * 60 * 60)
  
  if (hoursSinceLastInteraction >= 1) {
    pet.hunger = Math.min(100, pet.hunger + Math.floor(hoursSinceLastInteraction * 2))
    pet.mood = Math.max(0, pet.mood - Math.floor(hoursSinceLastInteraction * 1))
    pet.energy = Math.min(100, pet.energy + Math.floor(hoursSinceLastInteraction * 3))
    pet.lastInteractionTime = now
  }
  
  return pet
}