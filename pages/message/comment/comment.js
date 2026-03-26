// 评论页面
const { cloudApi } = require('../../../utils/cloudApi');
const loadingNavigator = require('../../../utils/loadingNavigator');

Page({
  data: {
    comments: [],
    loading: false,
    refreshing: false,
    loadingMore: false,
    noMore: false,
    page: 1,
    pageSize: 20
  },

  onLoad() {
    this.loadComments();
  },

  onShow() {
    this.refreshData();
  },

  onPullDownRefresh() {
    this.refreshData();
  },

  onReachBottom() {
    this.loadMore();
  },

  // 返回上一页
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

  // 刷新数据
  async refreshData() {
    this.setData({ 
      refreshing: true, 
      page: 1, 
      noMore: false 
    });
    
    try {
      await this.loadComments(true);
    } finally {
      this.setData({ refreshing: false });
      wx.stopPullDownRefresh();
    }
  },

  // 加载更多
  async loadMore() {
    if (this.data.loadingMore || this.data.noMore) return;
    
    this.setData({ loadingMore: true });
    try {
      await this.loadComments(false);
    } finally {
      this.setData({ loadingMore: false });
    }
  },

  // 加载评论数据
  async loadComments(refresh = false) {
    if (this.data.loading && !refresh) return;
    
    this.setData({ loading: !refresh });
    
    try {
      // TODO: 替换为真实的云端API调用
      // const result = await cloudApi.social.getComments(this.data.page, this.data.pageSize);
      
      const mockResult = await this.getMockComments();
      
      if (mockResult.success) {
        const newComments = mockResult.data;
        const currentComments = refresh ? [] : this.data.comments;
        
        this.setData({
          comments: [...currentComments, ...newComments],
          page: this.data.page + 1,
          noMore: newComments.length < this.data.pageSize
        });
      }
    } catch (error) {
      console.error('加载评论数据失败:', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 模拟获取评论数据
  getMockComments() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockComments = [
          {
            id: Date.now() + Math.random(),
            user: '萌宠爱好者',
            avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=commenter1&size=80',
            content: '你的宠物好可爱！这是什么品种的猫咪呀？',
            post: '宠物照片分享',
            time: this.formatTime(new Date(Date.now() - 60 * 60 * 1000)),
            replied: false,
            type: 'comment'
          },
          {
            id: Date.now() + Math.random() + 1,
            user: '宠物达人',
            avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=commenter2&size=80',
            content: '@你 请问这是什么品种的猫咪？平时怎么护理的？',
            post: '宠物日记',
            time: this.formatTime(new Date(Date.now() - 2 * 60 * 60 * 1000)),
            replied: true,
            type: 'mention'
          },
          {
            id: Date.now() + Math.random() + 2,
            user: '猫咪控',
            avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=commenter3&size=80',
            content: '太萌了！我家的猫咪也是这个样子，特别粘人',
            post: '宠物视频',
            time: this.formatTime(new Date(Date.now() - 24 * 60 * 60 * 1000)),
            replied: false,
            type: 'comment'
          }
        ];
        
        resolve({
          success: true,
          data: this.data.page === 1 ? mockComments : mockComments.slice(0, 1)
        });
      }, 800);
    });
  },

  // 回复评论
  async onReply(e) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.comments.find(c => c.id === id);
    
    if (!item) return;
    
    wx.showModal({
      title: '回复评论',
      editable: true,
      placeholderText: `回复 ${item.user}...`,
      success: async (res) => {
        if (res.confirm && res.content) {
          try {
            // TODO: 调用真实的回复API
            // await cloudApi.social.replyComment(item.id, res.content);
            
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const comments = this.data.comments.map(c => 
              c.id === id ? { ...c, replied: true } : c
            );
            
            this.setData({ comments });
            
            wx.showToast({ 
              title: '回复成功', 
              icon: 'success' 
            });
            
          } catch (error) {
            console.error('回复失败:', error);
            wx.showToast({
              title: '回复失败，请重试',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 查看评论详情
  onViewDetail(e) {
    const item = e.currentTarget.dataset.item;
    wx.showModal({
      title: '评论详情',
      content: `${item.user} 在《${item.post}》中评论：\n\n${item.content}`,
      showCancel: false
    });
  },

  // 格式化时间
  formatTime(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    
    return date.toLocaleDateString();
  },

  // 去发布内容
  onGoToPost() {
    loadingNavigator.switchTab('/pages/community/index');
  }
});