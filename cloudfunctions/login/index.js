// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    // 查询用户是否已存在
    const userResult = await db.collection('users').where({
      openid: wxContext.OPENID
    }).get()

    let user
    if (userResult.data.length === 0) {
      // 新用户，创建用户记录
      const createResult = await db.collection('users').add({
        data: {
          openid: wxContext.OPENID,
          unionid: wxContext.UNIONID,
          nickname: event.userInfo?.nickName || '宠物主人',
          avatar: event.userInfo?.avatarUrl || '',
          gender: event.userInfo?.gender || 0,
          level: 1,
          experience: 0,
          totalLogins: 1,
          totalGameTime: 0,
          createdAt: new Date(),
          lastLoginAt: new Date()
        }
      })

      // 为新用户创建默认宠物
      await db.collection('pets').add({
        data: {
          userId: createResult._id,
          name: 'Petto',
          age: 1,
          mood: 80,
          hunger: 50,
          health: 100,
          energy: 80,
          gender: 'male',
          level: 1,
          experience: 0,
          customization: {
            bodyType: 'normal',
            pattern: 'none',
            socks: 'none',
            eye: 'normal',
            nose: 'normal',
            noseMouthPattern: 'none'
          },
          stats: {
            totalFeedTimes: 0,
            totalPlayTimes: 0,
            totalChatMessages: 0,
            daysSinceCreated: 0
          },
          lastInteractionTime: new Date(),
          createdAt: new Date()
        }
      })

      user = {
        _id: createResult._id,
        openid: wxContext.OPENID,
        nickname: event.userInfo?.nickName || '宠物主人',
        avatar: event.userInfo?.avatarUrl || '',
        level: 1,
        experience: 0,
        isNewUser: true
      }
    } else {
      // 老用户，更新登录信息
      user = userResult.data[0]
      await db.collection('users').doc(user._id).update({
        data: {
          totalLogins: db.command.inc(1),
          lastLoginAt: new Date(),
          ...(event.userInfo && {
            nickname: event.userInfo.nickName,
            avatar: event.userInfo.avatarUrl,
            gender: event.userInfo.gender
          })
        }
      })
      user.isNewUser = false
    }

    return {
      success: true,
      data: {
        user,
        openid: wxContext.OPENID,
        unionid: wxContext.UNIONID
      }
    }
  } catch (error) {
    console.error('登录失败:', error)
    return {
      success: false,
      message: '登录失败',
      error: error.message
    }
  }
}