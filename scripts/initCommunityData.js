// 初始化社区数据脚本
// 在微信开发者工具的云开发控制台中运行此脚本

const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-5g8m4npnaa8acd18' // 替换为你的云环境ID
})

const db = cloud.database()

// 初始化帖子数据
async function initPosts() {
  console.log('开始初始化帖子数据...')
  
  const posts = [
    {
      title: '我的小柯基今天学会了新技能！',
      content: '今天带着我的小柯基去公园玩，它竟然学会了接飞盘！太聪明了～分享给大家看看我家小宝贝的进步。',
      author: {
        name: '柯基爱好者',
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=corgi&size=50'
      },
      images: ['/assets/pet_idle.png'],
      category: 'play',
      tags: ['柯基', '训练', '技能'],
      petType: '🐕',
      type: 'image',
      userId: 'system_user_1',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      title: '宠物喂食小贴士分享',
      content: '分享一些宠物喂食的经验，希望对大家有帮助！定时定量很重要，还要注意营养搭配。',
      author: {
        name: '宠物达人',
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=expert&size=50'
      },
      images: ['/assets/pet_body.png'],
      category: 'feeding',
      tags: ['喂食', '营养', '健康'],
      petType: '🐾',
      type: 'image',
      userId: 'system_user_2',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
    },
    {
      title: '今天的宠物互动时光',
      content: '和我的小宠物一起度过了愉快的下午时光，它今天特别活泼！我们一起玩了很多游戏。',
      author: {
        name: 'Petto用户',
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=user&size=50'
      },
      images: ['/assets/pet.gif'],
      category: 'play',
      tags: ['互动', '游戏', '快乐'],
      petType: '🐱',
      type: 'image',
      userId: 'system_user_3',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
    },
    {
      title: '宠物成长记录',
      content: '记录我家小宠物的成长历程，从小小的一只到现在这么可爱！每天都有新的变化。',
      author: {
        name: '成长记录员',
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=growth&size=50'
      },
      images: ['/assets/pet_idle.png'],
      category: 'growth',
      tags: ['成长', '记录', '可爱'],
      petType: '🐹',
      type: 'image',
      userId: 'system_user_4',
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 8 * 60 * 60 * 1000)
    },
    {
      title: '宠物日常护理心得',
      content: '分享一些宠物日常护理的小技巧，让我们的小伙伴更健康快乐！定期洗澡、梳毛很重要。',
      author: {
        name: '护理专家',
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=care&size=50'
      },
      images: ['/assets/pet_body.png'],
      category: 'care',
      tags: ['护理', '健康', '日常'],
      petType: '🐰',
      type: 'image',
      userId: 'system_user_5',
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
    },
    {
      title: '宠物训练成果展示',
      content: '经过几周的训练，我的小宠物终于学会了坐下和握手！分享一下训练心得。',
      author: {
        name: '训练师',
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=trainer&size=50'
      },
      images: ['/assets/pet.gif'],
      category: 'play',
      tags: ['训练', '技能', '成果'],
      petType: '🐕',
      type: 'image',
      userId: 'system_user_6',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    }
  ]

  try {
    // 检查是否已有数据
    const existingPosts = await db.collection('posts').count()
    console.log('现有帖子数量:', existingPosts.total)

    if (existingPosts.total === 0) {
      // 批量添加帖子
      for (const post of posts) {
        await db.collection('posts').add({
          data: post
        })
        console.log('添加帖子:', post.title)
      }
      console.log('✅ 帖子数据初始化完成')
    } else {
      console.log('📊 数据库中已有帖子，跳过初始化')
    }

    return { success: true, message: '数据初始化完成' }
  } catch (error) {
    console.error('❌ 初始化帖子数据失败:', error)
    return { success: false, error: error.message }
  }
}

// 初始化用户数据
async function initUsers() {
  console.log('开始初始化用户数据...')
  
  const users = [
    {
      openid: 'system_user_1',
      nickName: '柯基爱好者',
      avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=corgi&size=50',
      gender: 1,
      bio: '热爱柯基的宠物爱好者',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      openid: 'system_user_2',
      nickName: '宠物达人',
      avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=expert&size=50',
      gender: 2,
      bio: '专业的宠物护理专家',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      openid: 'system_user_3',
      nickName: 'Petto用户',
      avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=user&size=50',
      gender: 1,
      bio: 'Petto的忠实用户',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]

  try {
    // 检查是否已有用户数据
    const existingUsers = await db.collection('users').count()
    console.log('现有用户数量:', existingUsers.total)

    if (existingUsers.total === 0) {
      // 批量添加用户
      for (const user of users) {
        await db.collection('users').add({
          data: user
        })
        console.log('添加用户:', user.nickName)
      }
      console.log('✅ 用户数据初始化完成')
    } else {
      console.log('📊 数据库中已有用户，跳过初始化')
    }

    return { success: true, message: '用户数据初始化完成' }
  } catch (error) {
    console.error('❌ 初始化用户数据失败:', error)
    return { success: false, error: error.message }
  }
}

// 主函数
exports.main = async (event, context) => {
  console.log('🚀 开始初始化社区数据')
  
  try {
    const userResult = await initUsers()
    const postResult = await initPosts()
    
    return {
      success: true,
      message: '社区数据初始化完成',
      details: {
        users: userResult,
        posts: postResult
      }
    }
  } catch (error) {
    console.error('❌ 初始化失败:', error)
    return {
      success: false,
      message: '初始化失败',
      error: error.message
    }
  }
}

// 如果直接运行此文件（在云开发控制台中）
if (require.main === module) {
  exports.main({}, {}).then(result => {
    console.log('初始化结果:', result)
  })
}