// 积分同步工具
const { cloudApi } = require('./cloudApi')

class PointsSync {
  // 更新本地积分
  static updateLocalPoints(points) {
    try {
      const currentPoints = wx.getStorageSync('userPoints') || 0
      const newPoints = currentPoints + points
      wx.setStorageSync('userPoints', newPoints)
      
      console.log('💰 本地积分更新:', currentPoints, '->', newPoints)
      
      // 设置刷新标记
      wx.setStorageSync('needRefreshProfile', true)
      wx.setStorageSync('needRefreshGameRecords', true)
      
      return newPoints
    } catch (error) {
      console.error('❌ 本地积分更新失败:', error)
      return 0
    }
  }

  // 获取当前积分
  static getCurrentPoints() {
    try {
      return wx.getStorageSync('userPoints') || 0
    } catch (error) {
      console.error('❌ 获取当前积分失败:', error)
      return 0
    }
  }

  // 同步云端积分到本地
  static async syncPointsFromCloud() {
    try {
      console.log('☁️ 从云端同步积分...')
      
      const result = await cloudApi.game.getStats()
      
      if (result.success && result.data.totalPoints !== undefined) {
        const cloudPoints = result.data.totalPoints
        wx.setStorageSync('userPoints', cloudPoints)
        
        console.log('✅ 云端积分同步成功:', cloudPoints)
        return cloudPoints
      } else {
        console.log('❌ 云端积分同步失败:', result.message)
        return this.getCurrentPoints()
      }
    } catch (error) {
      console.error('❌ 云端积分同步异常:', error)
      return this.getCurrentPoints()
    }
  }

  // 显示积分变化提示
  static showPointsChange(oldPoints, newPoints, reason = '游戏奖励') {
    const change = newPoints - oldPoints
    
    if (change > 0) {
      wx.showToast({
        title: `${reason} +${change} 积分`,
        icon: 'success',
        duration: 2000
      })
    } else if (change < 0) {
      wx.showToast({
        title: `消费 ${Math.abs(change)} 积分`,
        icon: 'none',
        duration: 2000
      })
    }
  }

  // 检查积分是否足够
  static checkPointsEnough(requiredPoints) {
    const currentPoints = this.getCurrentPoints()
    return currentPoints >= requiredPoints
  }

  // 消费积分
  static consumePoints(points, reason = '商品购买') {
    try {
      const currentPoints = this.getCurrentPoints()
      
      if (currentPoints < points) {
        wx.showToast({
          title: '积分不足',
          icon: 'none',
          duration: 2000
        })
        return false
      }
      
      const newPoints = currentPoints - points
      wx.setStorageSync('userPoints', newPoints)
      
      console.log('💸 积分消费:', currentPoints, '->', newPoints, '原因:', reason)
      
      this.showPointsChange(currentPoints, newPoints, reason)
      
      // 设置刷新标记
      wx.setStorageSync('needRefreshProfile', true)
      wx.setStorageSync('needRefreshGameRecords', true)
      
      return true
    } catch (error) {
      console.error('❌ 积分消费失败:', error)
      return false
    }
  }
}

module.exports = PointsSync