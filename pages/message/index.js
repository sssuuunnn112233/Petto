// message/index.js
const { cloudApi, handleCloudError } = require('../../utils/cloudApi');
const loadingNav = require('../../utils/loadingNavigator');

Page({
  data: {
    refreshing: false,
    loadingMore: false,
    noMore: false,
    page: 1,
    pageSize: 10,
    
    // 云端数据
    systemMessages: [],     // 系统消息（从云端获取）
    chatHistory: [],        // 聊天历史（从云端获取）
    socialNotifications: [], // 社交通知（点赞、关注等）
    
    // 本地数据
    groupMessages: [],      // 群消息（模拟数据）
    recommendations: [],    // 推荐关注
    
    // 加载状态
    loading: false,
    user: null
  },

  async onLoad() {
    // 检查登录状态
    const app = getApp()
    if (!app.checkLoginStatus()) {
      console.log('❌ 用户未登录，跳转到登录页面')
      loadingNav.redirectTo('/pages/login/login?redirect=' + encodeURIComponent('/pages/message/index'));
      return
    }
    
    await this.initializePage();
  },

  async onShow() {
    // 页面显示时刷新数据
    await this.refreshAllData();
  },

  // 初始化页面
  async initializePage() {
    try {
      this.setData({ loading: true });
      
      // 加载用户信息
      await this.loadUserData();
      
      // 加载各种消息数据
      await Promise.all([
        this.loadSystemMessages(),
        this.loadChatHistory(),
        this.loadSocialNotifications(),
        this.loadGroupMessages(),
        this.loadRecommendations()
      ]);
      
    } catch (error) {
      console.error('Message页面初始化失败:', error);
      handleCloudError(error);
    } finally {
      this.setData({ loading: false });
    }
  },

  // 加载用户数据
  async loadUserData() {
    try {
      const result = await cloudApi.user.getProfile();
      if (result.success) {
        this.setData({ user: result.data });
      }
    } catch (error) {
      console.error('加载用户数据失败:', error);
    }
  },

  // 加载系统消息
  async loadSystemMessages() {
    try {
      // 这里可以调用专门的系统消息API，暂时使用聊天记录
      const result = await cloudApi.chat.getHistory(1, 5);
      
      if (result.success && result.data.chatLogs.length > 0) {
        // 转换聊天记录为系统消息格式
        const systemMessages = result.data.chatLogs.map((log, index) => ({
          id: `system_${log._id || index}`,
          icon: log.from === 'user' ? '👤' : '🐾',
          title: log.from === 'user' ? '你对宠物说' : '宠物回复',
          desc: log.message.length > 30 ? log.message.substring(0, 30) + '...' : log.message,
          action: '查看对话',
          time: this.formatTime(log.createdAt),
          unread: false,
          type: 'chat',
          originalData: log
        }));
        
        this.setData({ systemMessages });
      } else {
        // 如果没有聊天记录，显示默认系统消息
        this.setData({
          systemMessages: [{
            id: 'welcome',
            icon: '🎉',
            title: '欢迎使用虚拟宠物',
            desc: '开始与你的宠物互动吧！',
            action: '去看看',
            time: '刚刚',
            unread: true,
            type: 'welcome'
          }]
        });
      }
    } catch (error) {
      console.error('加载系统消息失败:', error);
      // 降级处理
      this.setData({
        systemMessages: [{
          id: 'error',
          icon: '⚠️',
          title: '消息加载失败',
          desc: '请检查网络连接后重试',
          action: '重试',
          time: '刚刚',
          unread: false,
          type: 'error'
        }]
      });
    }
  },

  // 加载聊天历史
  async loadChatHistory() {
    try {
      const result = await cloudApi.chat.getHistory(1, 10);
      
      if (result.success) {
        this.setData({ 
          chatHistory: result.data.chatLogs || []
        });
      }
    } catch (error) {
      console.error('加载聊天历史失败:', error);
    }
  },

  // 加载社交通知（从本地存储和云端获取）
  async loadSocialNotifications() {
    try {
      // 先从本地存储加载
      const localNotifications = wx.getStorageSync('socialNotifications') || [];
      
      // 如果本地没有数据，创建一些默认数据
      if (localNotifications.length === 0) {
        const defaultNotifications = [
          {
            id: 'social_1',
            icon: '❤️',
            title: '收到新的点赞',
            desc: '你的宠物照片获得了3个赞',
            action: '查看详情',
            time: '2小时前',
            unread: true,
            type: 'like',
            createdAt: new Date().toISOString()
          },
          {
            id: 'social_2', 
            icon: '👥',
            title: '新的关注者',
            desc: '萌宠爱好者 关注了你',
            action: '查看资料',
            time: '1天前',
            unread: false,
            type: 'follow',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          }
        ];
        
        // 保存到本地存储
        wx.setStorageSync('socialNotifications', defaultNotifications);
        this.setData({ socialNotifications: defaultNotifications });
      } else {
        this.setData({ socialNotifications: localNotifications });
      }
      
      // TODO: 这里可以添加从云端同步社交通知的逻辑
      // const cloudResult = await cloudApi.social.getNotifications();
      
    } catch (error) {
      console.error('加载社交通知失败:', error);
      this.setData({ socialNotifications: [] });
    }
  },

  // 加载群消息（从本地存储获取，保持持久化）
  loadGroupMessages() {
    try {
      // 先从本地存储加载
      const localGroupMessages = wx.getStorageSync('groupMessages') || [];
      
      // 如果本地没有数据，创建一些默认数据
      if (localGroupMessages.length === 0) {
        const defaultGroupMessages = [
          {
            id: 'group_1',
            icon: '👥',
            title: '虚拟宠物养成交流群',
            desc: '[有人@你] 快来看看我养的新宠物',
            action: '查看群聊',
            time: '刚刚',
            unread: true,
            type: 'group',
            createdAt: new Date().toISOString()
          },
          {
            id: 'group_2',
            icon: '💬',
            title: '电子宠物爱好者',
            desc: '[图片] 分享今天的养成日记',
            action: '查看群聊',
            time: '5分钟前',
            unread: false,
            type: 'group',
            createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
          },
          {
            id: 'group_3',
            icon: '🎮',
            title: '萌宠养成攻略群',
            desc: '[99+条] 群聊消息很活跃',
            action: '查看群聊',
            time: '1小时前',
            unread: true,
            type: 'group',
            createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
          }
        ];
        
        // 保存到本地存储
        wx.setStorageSync('groupMessages', defaultGroupMessages);
        this.setData({ groupMessages: defaultGroupMessages });
      } else {
        this.setData({ groupMessages: localGroupMessages });
      }
      
    } catch (error) {
      console.error('加载群消息失败:', error);
      this.setData({ groupMessages: [] });
    }
  },

  // 加载推荐关注（从本地存储获取，保持持久化）
  loadRecommendations() {
    try {
      // 先从本地存储加载
      const localRecommendations = wx.getStorageSync('recommendations') || [];
      
      // 如果本地没有数据，创建一些默认数据
      if (localRecommendations.length === 0) {
        const defaultRecommendations = [
          {
            id: 1,
            name: '虚拟宠物养成大师',
            desc: '电子宠物内容热门作者',
            avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=master1&size=50',
            followed: false
          },
          {
            id: 2,
            name: '萌宠饲养日记',
            desc: '分享养宠心得和技巧',
            avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=master2&size=50',
            followed: false
          },
          {
            id: 3,
            name: '电子宠物收藏家',
            desc: '拥有300+稀有电子宠物',
            avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=master3&size=50',
            followed: false
          }
        ];
        
        // 保存到本地存储
        wx.setStorageSync('recommendations', defaultRecommendations);
        this.setData({ recommendations: defaultRecommendations });
      } else {
        // 过滤掉已关注的用户
        const unFollowedRecommendations = localRecommendations.filter(r => !r.followed);
        this.setData({ recommendations: unFollowedRecommendations });
      }
      
    } catch (error) {
      console.error('加载推荐关注失败:', error);
      this.setData({ recommendations: [] });
    }
  },

  // 刷新所有数据
  async refreshAllData() {
    if (this.data.refreshing) return;
    
    this.setData({ refreshing: true });
    
    try {
      await Promise.all([
        this.loadSystemMessages(),
        this.loadChatHistory(),
        this.loadSocialNotifications()
      ]);
    } catch (error) {
      console.error('刷新数据失败:', error);
    } finally {
      this.setData({ refreshing: false });
    }
  },

  // 刷新
  async onRefresh() {
    await this.refreshAllData();
  },

  // 格式化时间
  formatTime(dateString) {
    if (!dateString) return '刚刚';
    
    const now = new Date();
    const date = new Date(dateString);
    const diff = now - date;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
    
    return date.toLocaleDateString();
  },

  // 打开系统消息
  onOpenSystemMessage(e) {
    const id = e.currentTarget.dataset.id;
    const type = e.currentTarget.dataset.type;
    
    // 标记为已读并保存到本地存储
    const systemMessages = this.data.systemMessages.map(m => 
      m.id === id ? { ...m, unread: false } : m
    );
    this.setData({ systemMessages });
    
    // 根据消息类型跳转到对应的具体页面
    switch(type) {
      case 'chat':
        // 聊天消息 - 直接跳转到聊天详情页面，避免loading卡顿
        wx.navigateTo({
          url: '/pages/message/chat/chat',
          success: () => {
            console.log('✅ 成功跳转到聊天页面');
          },
          fail: (err) => {
            console.error('❌ 跳转聊天页面失败:', err);
            wx.showToast({
              title: '打开聊天失败',
              icon: 'none'
            });
          }
        });
        break;
      case 'like':
        // 点赞消息 - 直接跳转到点赞页面，避免loading卡顿
        wx.navigateTo({
          url: '/pages/message/like/like',
          success: () => {
            console.log('✅ 成功跳转到点赞页面');
          },
          fail: (err) => {
            console.error('❌ 跳转点赞页面失败:', err);
            wx.showToast({
              title: '打开页面失败',
              icon: 'none'
            });
          }
        });
        break;
      case 'follow':
        // 关注消息 - 直接跳转到关注页面，避免loading卡顿
        wx.navigateTo({
          url: '/pages/message/follow/follow',
          success: () => {
            console.log('✅ 成功跳转到关注页面');
          },
          fail: (err) => {
            console.error('❌ 跳转关注页面失败:', err);
            wx.showToast({
              title: '打开页面失败',
              icon: 'none'
            });
          }
        });
        break;
      case 'comment':
        // 评论消息 - 直接跳转到评论页面，避免loading卡顿
        wx.navigateTo({
          url: '/pages/message/comment/comment',
          success: () => {
            console.log('✅ 成功跳转到评论页面');
          },
          fail: (err) => {
            console.error('❌ 跳转评论页面失败:', err);
            wx.showToast({
              title: '打开页面失败',
              icon: 'none'
            });
          }
        });
        break;
      case 'welcome':
        // 欢迎消息 - 不跳转，只标记已读
        break;
      case 'error':
        // 错误消息 - 重新加载数据
        this.refreshAllData();
        break;
      default:
        // 其他消息 - 不跳转，只标记已读
        break;
    }
  },

  // 打开群消息
  onOpenGroupMessage(e) {
    console.log('🔍 点击群消息，开始处理...');
    
    const id = e.currentTarget.dataset.id;
    console.log('📝 群消息ID:', id);
    
    // 标记为已读并保存到本地存储
    const groupMessages = this.data.groupMessages.map(m => 
      m.id === id ? { ...m, unread: false } : m
    );
    this.setData({ groupMessages });
    
    // 保存到本地存储
    try {
      wx.setStorageSync('groupMessages', groupMessages);
      console.log('✅ 群消息状态已保存到本地存储');
    } catch (error) {
      console.error('❌ 保存群消息状态失败:', error);
    }
    
    console.log('🚀 准备跳转到群聊设置页面...');
    
    // 跳转到群聊设置页面
    try {
      loadingNav.navigateTo('/pages/message/group-setting/group-setting');
      console.log('✅ 跳转命令已执行');
    } catch (error) {
      console.error('❌ 跳转失败:', error);
      // 备用跳转方案
      wx.navigateTo({
        url: '/pages/message/group-setting/group-setting',
        success: () => {
          console.log('✅ 备用跳转成功');
        },
        fail: (err) => {
          console.error('❌ 备用跳转也失败:', err);
          wx.showToast({
            title: '跳转失败，请重试',
            icon: 'none'
          });
        }
      });
    }
  },

  // 快捷入口 - 赞和收藏
  onAccessLike() {
    loadingNav.navigateTo('/pages/message/like/like');
  },

  // 快捷入口 - 新增关注
  onAccessFollow() {
    loadingNav.navigateTo('/pages/message/follow/follow');
  },

  // 快捷入口 - 评论和@
  onAccessComment() {
    loadingNav.navigateTo('/pages/message/comment/comment');
  },

  // 添加
  onAdd() {
    wx.showActionSheet({
      itemList: ['添加好友', '创建群聊', '模拟新消息'],
      success: (res) => {
        switch(res.tapIndex) {
          case 0:
            wx.showToast({ title: '添加好友功能开发中', icon: 'none' });
            break;
          case 1:
            wx.showToast({ title: '创建群聊功能开发中', icon: 'none' });
            break;
          case 2:
            this.simulateNewMessage();
            break;
        }
      }
    });
  },

  // 模拟新消息（用于测试）
  simulateNewMessage() {
    const messageTypes = ['group', 'social', 'system'];
    const randomType = messageTypes[Math.floor(Math.random() * messageTypes.length)];
    
    switch(randomType) {
      case 'group':
        this.addGroupMessage({
          id: `group_${Date.now()}`,
          icon: '💬',
          title: '萌宠交流群',
          desc: `[新消息] ${['分享了一张宠物照片', '发起了话题讨论', '上传了养成攻略'][Math.floor(Math.random() * 3)]}`,
          action: '查看群聊',
          time: '刚刚',
          unread: true,
          type: 'group',
          createdAt: new Date().toISOString()
        });
        break;
        
      case 'social':
        this.addSocialNotification({
          id: `social_${Date.now()}`,
          icon: ['❤️', '👥', '💬'][Math.floor(Math.random() * 3)],
          title: ['收到新的点赞', '新的关注者', '收到新评论'][Math.floor(Math.random() * 3)],
          desc: `${['你的宠物照片', '你的动态', '你的分享'][Math.floor(Math.random() * 3)]}获得了互动`,
          action: '查看详情',
          time: '刚刚',
          unread: true,
          type: ['like', 'follow', 'comment'][Math.floor(Math.random() * 3)],
          createdAt: new Date().toISOString()
        });
        break;
        
      case 'system':
        // 系统消息通过聊天记录生成，这里不处理
        wx.showToast({ title: '已生成新的群消息和社交通知', icon: 'success' });
        return;
    }
    
    wx.showToast({ title: '已生成新消息', icon: 'success' });
  },

  // 关注推荐用户
  onFollow(e) {
    const id = e.currentTarget.dataset.id;
    
    try {
      // 获取当前推荐列表
      const allRecommendations = wx.getStorageSync('recommendations') || [];
      
      // 标记为已关注
      const updatedRecommendations = allRecommendations.map(r => 
        r.id === id ? { ...r, followed: true, followedAt: new Date().toISOString() } : r
      );
      
      // 保存到本地存储
      wx.setStorageSync('recommendations', updatedRecommendations);
      
      // 从当前显示列表中移除
      const recommendations = this.data.recommendations.filter(r => r.id !== id);
      this.setData({ recommendations });
      
      wx.showToast({ title: '已关注', icon: 'success' });
      
      // 添加一条社交通知
      this.addSocialNotification({
        id: `follow_${Date.now()}`,
        icon: '✅',
        title: '关注成功',
        desc: `你关注了 ${updatedRecommendations.find(r => r.id === id)?.name || '用户'}`,
        action: '查看资料',
        time: '刚刚',
        unread: true,
        type: 'follow_success',
        createdAt: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('关注用户失败:', error);
      wx.showToast({ title: '关注失败', icon: 'none' });
    }
  },

  // 关闭推荐区域
  onCloseRecommend() {
    this.setData({ recommendations: [] });
  },

  // 添加社交通知的辅助方法
  addSocialNotification(notification) {
    try {
      const socialNotifications = wx.getStorageSync('socialNotifications') || [];
      socialNotifications.unshift(notification); // 添加到开头
      
      // 限制通知数量，最多保留50条
      if (socialNotifications.length > 50) {
        socialNotifications.splice(50);
      }
      
      wx.setStorageSync('socialNotifications', socialNotifications);
      
      // 更新页面显示
      this.setData({ 
        socialNotifications: socialNotifications 
      });
      
    } catch (error) {
      console.error('添加社交通知失败:', error);
    }
  },

  // 添加群消息的辅助方法
  addGroupMessage(message) {
    try {
      const groupMessages = wx.getStorageSync('groupMessages') || [];
      groupMessages.unshift(message); // 添加到开头
      
      // 限制消息数量，最多保留30条
      if (groupMessages.length > 30) {
        groupMessages.splice(30);
      }
      
      wx.setStorageSync('groupMessages', groupMessages);
      
      // 更新页面显示
      this.setData({ 
        groupMessages: groupMessages 
      });
      
    } catch (error) {
      console.error('添加群消息失败:', error);
    }
  }
});

