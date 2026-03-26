const loadingNav = require('../../utils/loadingNavigator');

Page({
  data: {
    games: [
      {
        id: 'match3',
        name: '萌宠·2048',
        desc: '滑动合并数字，挑战2048',
        icon: '🐱'
      },
      {
        id: 'flip',
        name: '翻牌消消乐',
        desc: '记忆翻牌配对挑战',
        icon: '🃏'
      }
    ]
  },

  onLoad() {
    // 检查登录状态
    const app = getApp()
    if (!app.checkLoginStatus()) {
      console.log('❌ 用户未登录，跳转到登录页面')
      const loadingNav = require('../../utils/loadingNavigator');
      loadingNav.redirectTo('/pages/login/login?redirect=' + encodeURIComponent('/pages/game/index'));
      return
    }
    
    console.log('游戏中心页面加载');
  },

  onPlayMatch3() {
    console.log('启动2048游戏');
    // 使用带随机loading页的导航
    loadingNav.navigateTo('/pages/match3-game/index');
  },

  onPlayFishing() {
    console.log('启动翻牌游戏');
    // 使用带随机loading页的导航
    loadingNav.navigateTo('/pages/flipcardgame/index');
  }
})

