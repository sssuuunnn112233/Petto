// 社区功能调试工具
const { cloudApi } = require('./cloudApi')

class CommunityDebugger {
  // 诊断社区功能
  static async diagnose() {
    console.log('🔍 开始诊断社区功能...')
    
    const results = {
      cloudInit: false,
      cloudFunction: false,
      database: false,
      posts: false,
      errors: []
    }

    try {
      // 1. 检查云开发初始化
      console.log('📡 检查云开发初始化...')
      if (wx.cloud) {
        results.cloudInit = true
        console.log('✅ 云开发已初始化')
      } else {
        results.errors.push('云开发未初始化')
        console.log('❌ 云开发未初始化')
      }

      // 2. 测试云函数调用
      console.log('☁️ 测试云函数调用...')
      try {
        const testResult = await wx.cloud.callFunction({
          name: 'community',
          data: { action: 'getPosts', category: 'recommend', page: 1, limit: 1 }
        })
        
        if (testResult.result) {
          results.cloudFunction = true
          console.log('✅ 云函数调用成功')
          
          if (testResult.result.success) {
            results.database = true
            console.log('✅ 数据库连接正常')
            
            if (testResult.result.data && testResult.result.data.posts) {
              results.posts = testResult.result.data.posts.length > 0
              console.log(`📊 数据库中有 ${testResult.result.data.posts.length} 条帖子`)
            }
          } else {
            results.errors.push(`数据库查询失败: ${testResult.result.message}`)
            console.log('❌ 数据库查询失败:', testResult.result.message)
          }
        } else {
          results.errors.push('云函数返回结果为空')
          console.log('❌ 云函数返回结果为空')
        }
      } catch (cloudError) {
        results.errors.push(`云函数调用失败: ${cloudError.message}`)
        console.log('❌ 云函数调用失败:', cloudError)
      }

      // 3. 检查本地存储
      console.log('💾 检查本地存储...')
      const userInfo = wx.getStorageSync('userInfo')
      const openid = wx.getStorageSync('openid')
      
      if (userInfo && openid) {
        console.log('✅ 用户登录状态正常')
      } else {
        results.errors.push('用户未登录或登录状态异常')
        console.log('❌ 用户未登录或登录状态异常')
      }

    } catch (error) {
      results.errors.push(`诊断过程异常: ${error.message}`)
      console.log('❌ 诊断过程异常:', error)
    }

    // 输出诊断结果
    console.log('📋 诊断结果:')
    console.log('- 云开发初始化:', results.cloudInit ? '✅' : '❌')
    console.log('- 云函数调用:', results.cloudFunction ? '✅' : '❌')
    console.log('- 数据库连接:', results.database ? '✅' : '❌')
    console.log('- 帖子数据:', results.posts ? '✅' : '❌')
    
    if (results.errors.length > 0) {
      console.log('❌ 发现问题:')
      results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`)
      })
    }

    return results
  }

  // 显示诊断结果
  static showDiagnoseResult(results) {
    let message = '诊断结果:\n'
    message += `云开发: ${results.cloudInit ? '✅' : '❌'}\n`
    message += `云函数: ${results.cloudFunction ? '✅' : '❌'}\n`
    message += `数据库: ${results.database ? '✅' : '❌'}\n`
    message += `帖子数据: ${results.posts ? '✅' : '❌'}\n`
    
    if (results.errors.length > 0) {
      message += '\n问题:\n'
      results.errors.forEach((error, index) => {
        message += `${index + 1}. ${error}\n`
      })
    }

    wx.showModal({
      title: '社区功能诊断',
      content: message,
      showCancel: false,
      confirmText: '知道了'
    })
  }

  // 快速修复建议
  static getFixSuggestions(results) {
    const suggestions = []

    if (!results.cloudInit) {
      suggestions.push('请检查 app.js 中的云开发初始化配置')
    }

    if (!results.cloudFunction) {
      suggestions.push('请检查云函数是否正确部署')
      suggestions.push('请确认云函数名称为 "community"')
    }

    if (!results.database) {
      suggestions.push('请检查数据库权限设置')
      suggestions.push('请确认数据库集合 "posts" 是否存在')
    }

    if (!results.posts) {
      suggestions.push('数据库中暂无帖子数据，将使用模拟数据')
    }

    return suggestions
  }
}

module.exports = CommunityDebugger