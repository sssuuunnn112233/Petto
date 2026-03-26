// message/group-setting/group-setting.js
const loadingNavigator = require('../../../utils/loadingNavigator');

Page({
  data: {
    groupInfo: {
      name: '虚拟宠物养成交流群',
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=group1&size=100',
      desc: '一起分享电子宠物养成心得...',
      memberCount: 253
    },
    members: [],
    announcement: '未设置',
    myNickname: 'Nefelibat...',
    groupRemark: '',
    isTop: false
  },

  onLoad() {
    this.loadMembers()
  },

  // 进入群聊
  onEnterChat() {
    loadingNavigator.navigateTo('/pages/message/group-chat/group-chat?groupId=' + this.data.groupInfo.name);
  },

  // 返回
  onBack() {
    // 检查页面栈，如果是从loading页面跳转来的，直接跳转到消息页面
    const pages = getCurrentPages()
    if (pages.length >= 2) {
      const prevPage = pages[pages.length - 2]
      if (prevPage.route === 'pages/loading/index') {
        // 从loading页面跳转来的，直接跳转到消息页面
        wx.switchTab({
          url: '/pages/message/index'
        })
        return
      }
    }
    
    // 正常返回
    wx.navigateBack()
  },

  // 加载成员
  loadMembers() {
    const members = [
      { id: 1, name: '活柔', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=m1&size=50' },
      { id: 2, name: '活柔甄选', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=m2&size=50' },
      { id: 3, name: '月儿（在...', avatar: 'https://api.dicebear.com/7.x/lorelei/svg?seed=m3&size=50' },
      { id: 4, name: '片娘交女士', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=m4&size=50' },
      { id: 5, name: '陈风微晚', avatar: 'https://api.dicebear.com/7.x/big-smile/svg?seed=m5&size=50' },
      { id: 6, name: '逆雪的雨晴', avatar: 'https://api.dicebear.com/7.x/lorelei/svg?seed=m6&size=50' },
      { id: 7, name: '眦世里', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=m7&size=50' },
      { id: 8, name: '喵茶世里', avatar: 'https://api.dicebear.com/7.x/big-smile/svg?seed=m8&size=50' }
    ]
    this.setData({ members })
  },

  // 查看所有成员
  onViewAllMembers() {
    wx.showToast({ title: '查看全部成员', icon: 'none' })
  },

  // 查看成员
  onViewMember(e) {
    const id = e.currentTarget.dataset.id
    wx.showToast({ title: `查看成员 ${id}`, icon: 'none' })
  },

  // 添加成员
  onAddMember() {
    wx.showToast({ title: '邀请好友', icon: 'none' })
  },

  // 分享群邀请
  onShare() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  // 生成链接
  onGenerateLink() {
    wx.showToast({ title: '生成评论区群链接', icon: 'none' })
  },

  // 群二维码
  onQRCode() {
    wx.showToast({ title: '查看群二维码', icon: 'none' })
  },

  // 群公告
  onAnnouncement() {
    wx.showToast({ title: '查看群公告', icon: 'none' })
  },

  // 修改昵称
  onNickname() {
    wx.showModal({
      title: '修改群昵称',
      editable: true,
      placeholderText: '请输入群昵称',
      success: (res) => {
        if (res.confirm && res.content) {
          this.setData({ myNickname: res.content })
        }
      }
    })
  },

  // 群备注
  onRemark() {
    wx.showModal({
      title: '设置群备注',
      editable: true,
      placeholderText: '请输入群备注',
      success: (res) => {
        if (res.confirm && res.content) {
          this.setData({ groupRemark: res.content })
        }
      }
    })
  },

  // 查找聊天记录
  onSearchHistory() {
    wx.showToast({ title: '查找聊天记录', icon: 'none' })
  },

  // 免打扰设置
  onNotDisturb() {
    wx.showActionSheet({
      itemList: ['接收消息但不提醒', '接收消息并提醒', '不接收消息'],
      success: (res) => {
        console.log(res.tapIndex)
      }
    })
  },

  // 置顶聊天
  onToggleTop(e) {
    this.setData({ isTop: e.detail.value })
    wx.showToast({ 
      title: e.detail.value ? '已置顶' : '已取消置顶',
      icon: 'none'
    })
  },

  // 举报
  onReport() {
    wx.showToast({ title: '举报群聊', icon: 'none' })
  },

  // 群聊公约
  onGroupContract() {
    wx.showToast({ title: '查看群聊公约', icon: 'none' })
  },

  // 清空聊天记录
  onClearHistory() {
    wx.showModal({
      title: '提示',
      content: '确定要清空聊天记录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '已清空', icon: 'success' })
        }
      }
    })
  },

  // 退出群聊
  onQuit() {
    wx.showModal({
      title: '退出群聊',
      content: '确定要退出该群聊吗？',
      confirmText: '退出',
      confirmColor: '#ff2442',
      success: (res) => {
        if (res.confirm) {
          console.log('🚪 用户确认退出群聊');
          
          // 检查页面栈，智能选择返回方式
          const pages = getCurrentPages()
          console.log('📚 当前页面栈:', pages.map(p => p.route));
          
          if (pages.length >= 3) {
            const prevPage = pages[pages.length - 2] // 上一页（群聊页面）
            const prevPrevPage = pages[pages.length - 3] // 上上页
            
            console.log('📄 上一页面:', prevPage.route);
            console.log('📄 上上页面:', prevPrevPage.route);
            
            if (prevPage.route === 'pages/loading/index' || prevPrevPage.route === 'pages/loading/index') {
              console.log('✅ 检测到loading页面，直接跳转到消息页面');
              // 如果页面栈中有loading页面，直接跳转到消息页面
              loadingNavigator.switchTab('/pages/message/index');
              return
            }
          }
          
          console.log('🔄 使用正常返回逻辑，跳过2个页面');
          // 正常情况下跳过群设置和群聊页面，回到消息页面
          wx.navigateBack({ 
            delta: 2,
            fail: () => {
              console.log('❌ 返回失败，使用备用方案');
              // 如果返回失败，直接跳转到消息页面
              loadingNavigator.switchTab('/pages/message/index');
            }
          })
        }
      }
    })
  }
})

