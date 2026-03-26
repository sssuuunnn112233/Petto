// 群聊聊天页面
const loadingNavigator = require('../../../utils/loadingNavigator');

Page({
  data: {
    groupName: '',
    messages: [],
    inputValue: '',
    loading: false,
    members: []
  },

  onLoad(options) {
    const groupName = options.groupId || '虚拟宠物养成交流群';
    this.setData({ groupName });
    this.loadChatMessages();
    this.loadMembers();
  },

  // 返回上一页
  goBack() {
    console.log('🔙 群聊页面 - 返回上一页');
    
    // 检查页面栈，如果是从loading页面跳转来的，直接跳转到消息页面
    const pages = getCurrentPages()
    console.log('📚 当前页面栈:', pages.map(p => p.route));
    
    if (pages.length >= 2) {
      const prevPage = pages[pages.length - 2]
      console.log('📄 上一页面:', prevPage.route);
      
      if (prevPage.route === 'pages/loading/index') {
        console.log('✅ 检测到从loading页面跳转来，直接跳转到消息页面');
        // 从loading页面跳转来的，直接跳转到消息页面
        loadingNavigator.switchTab('/pages/message/index');
        return
      }
    }
    
    console.log('🔄 使用正常返回逻辑');
    // 正常返回
    wx.navigateBack({
      delta: 1,
      success: () => {
        console.log('✅ 正常返回成功');
      },
      fail: () => {
        console.log('❌ 正常返回失败，使用备用方案');
        // 如果返回失败，跳转到消息页面
        loadingNavigator.switchTab('/pages/message/index');
      }
    });
  },

  // 进入群设置
  onGroupSetting() {
    loadingNavigator.navigateTo('/pages/message/group-setting/group-setting');
  },

  loadChatMessages() {
    // 模拟群聊消息
    const mockMessages = [
      {
        id: 1,
        type: 'system',
        content: '欢迎来到虚拟宠物养成交流群',
        time: '今天 14:30'
      },
      {
        id: 2,
        type: 'other',
        content: '大家好！我刚养了一只新宠物，好可爱～',
        time: '今天 14:32',
        user: {
          name: '萌宠爱好者',
          avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=user1&size=50'
        }
      },
      {
        id: 3,
        type: 'other',
        content: '哇，快分享照片看看！',
        time: '今天 14:33',
        user: {
          name: '宠物达人',
          avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=user2&size=50'
        }
      },
      {
        id: 4,
        type: 'other',
        content: '[图片] 看看我的小猫咪～',
        time: '今天 14:35',
        user: {
          name: '萌宠爱好者',
          avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=user1&size=50'
        }
      },
      {
        id: 5,
        type: 'other',
        content: '太可爱了！请问是什么品种呀？',
        time: '今天 14:36',
        user: {
          name: '猫咪收藏家',
          avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=user3&size=50'
        }
      }
    ];
    
    this.setData({ messages: mockMessages });
  },

  loadMembers() {
    // 模拟群成员
    const mockMembers = [
      { id: 1, name: '萌宠爱好者', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=user1&size=50' },
      { id: 2, name: '宠物达人', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=user2&size=50' },
      { id: 3, name: '猫咪收藏家', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=user3&size=50' }
    ];
    
    this.setData({ members: mockMembers });
  },

  onInputChange(e) {
    this.setData({ inputValue: e.detail.value });
  },

  sendMessage() {
    const message = this.data.inputValue.trim();
    if (!message) return;

    const newMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      time: '刚刚',
      user: {
        name: '我',
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=me&size=50'
      }
    };

    this.setData({
      messages: [...this.data.messages, newMessage],
      inputValue: ''
    });

    // 模拟其他人回复
    setTimeout(() => {
      const replies = [
        '说得对！',
        '我也这么觉得',
        '有道理呢～',
        '学到了！',
        '谢谢分享',
        '好棒！'
      ];
      
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      const randomMember = this.data.members[Math.floor(Math.random() * this.data.members.length)];
      
      const replyMessage = {
        id: Date.now() + 1,
        type: 'other',
        content: randomReply,
        time: '刚刚',
        user: randomMember
      };
      
      this.setData({
        messages: [...this.data.messages, replyMessage]
      });
    }, 1000 + Math.random() * 2000);
  },

  // 长按消息
  onLongPressMessage(e) {
    const messageId = e.currentTarget.dataset.id;
    wx.showActionSheet({
      itemList: ['复制', '转发', '收藏', '删除'],
      success: (res) => {
        switch(res.tapIndex) {
          case 0:
            wx.showToast({ title: '已复制', icon: 'success' });
            break;
          case 1:
            wx.showToast({ title: '转发功能开发中', icon: 'none' });
            break;
          case 2:
            wx.showToast({ title: '已收藏', icon: 'success' });
            break;
          case 3:
            wx.showModal({
              title: '删除消息',
              content: '确定要删除这条消息吗？',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  const messages = this.data.messages.filter(m => m.id !== messageId);
                  this.setData({ messages });
                  wx.showToast({ title: '已删除', icon: 'success' });
                }
              }
            });
            break;
        }
      }
    });
  }
});