// 聊天详情页面

Page({
  data: {
    messages: [],
    inputValue: '',
    loading: false
  },

  onLoad(options) {
    // 可以根据 options 参数加载不同的聊天内容
    this.loadChatMessages();
  },

  // 导航栏返回按钮处理
  onNavBack() {
    console.log('🔙 聊天页面 - 导航栏返回');
    
    // 直接跳转到消息页面，避免loading页面问题
    wx.switchTab({
      url: '/pages/message/index',
      success: () => {
        console.log('✅ 成功返回消息页面');
      },
      fail: (err) => {
        console.error('❌ 返回消息页面失败:', err);
        // 如果switchTab失败，尝试navigateBack
        wx.navigateBack({
          fail: (err2) => {
            console.error('❌ navigateBack也失败:', err2);
            // 最后的备选方案：reLaunch到消息页面
            wx.reLaunch({
              url: '/pages/message/index'
            });
          }
        });
      }
    });
  },

  // 返回上一页
  goBack() {
    // 直接跳转到消息页面，避免loading页面问题
    wx.switchTab({
      url: '/pages/message/index',
      success: () => {
        console.log('✅ 成功返回消息页面');
      },
      fail: (err) => {
        console.error('❌ 返回消息页面失败:', err);
        // 如果switchTab失败，尝试navigateBack
        wx.navigateBack({
          delta: 1,
          fail: (err2) => {
            console.error('❌ navigateBack也失败:', err2);
            // 最后的备选方案：reLaunch到消息页面
            wx.reLaunch({
              url: '/pages/message/index'
            });
          }
        });
      }
    });
  },

  loadChatMessages() {
    // 模拟聊天消息
    const mockMessages = [
      {
        id: 1,
        type: 'system',
        content: '欢迎来到聊天页面',
        time: '刚刚'
      },
      {
        id: 2,
        type: 'user',
        content: '你好！',
        time: '1分钟前'
      },
      {
        id: 3,
        type: 'other',
        content: '你好，很高兴认识你！',
        time: '2分钟前'
      }
    ];
    
    this.setData({ messages: mockMessages });
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
      time: '刚刚'
    };

    this.setData({
      messages: [...this.data.messages, newMessage],
      inputValue: ''
    });

    // 模拟回复
    setTimeout(() => {
      const replyMessage = {
        id: Date.now() + 1,
        type: 'other',
        content: '收到你的消息了！',
        time: '刚刚'
      };
      
      this.setData({
        messages: [...this.data.messages, replyMessage]
      });
    }, 1000);
  }
});