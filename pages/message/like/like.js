// 点赞页面
const { cloudApi } = require('../../../utils/cloudApi');
const loadingNavigator = require('../../../utils/loadingNavigator');

Page({
  data: {
    likes: [],
    loading: false,
    refreshing: false,
    loadingMore: false,
    noMore: false,
    page: 1,
    pageSize: 20
  },

  onLoad() {
    this.loadLikes();
  },

  onShow() {
    // 页面显示时刷新数据
    this.refreshData();
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.refreshData();
  },

  // 上拉加载更多
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
      await this.loadLikes(true);
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
      await this.loadLikes(false);
    } finally {
      this.setData({ loadingMore: false });
    }
  },

  // 加载点赞数据
  async loadLikes(refresh = false) {
    if (this.data.loading && !refresh) return;
    
    this.setData({ loading: !refresh });
    
    try {
      // TODO: 替换为真实的云端API调用
      // const result = await cloudApi.social.getLikes(this.data.page, this.data.pageSize);
      
      // 模拟API调用
      const mockResult = await this.getMockLikes();
      
      if (mockResult.success) {
        const newLikes = mockResult.data;
        const currentLikes = refresh ? [] : this.data.likes;
        
        this.setData({
          likes: [...currentLikes, ...newLikes],
          page: this.data.page + 1,
          noMore: newLikes.length < this.data.pageSize
        });
      }
    } catch (error) {
      console.error('加载点赞数据失败:', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 模拟获取点赞数据
  getMockLikes() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockLikes = [
          {
            id: Date.now() + Math.random(),
            user: '萌宠爱好者',
            avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=user1&size=80',
            content: '宠物照片',
            time: this.formatTime(new Date(Date.now() - 2 * 60 * 60 * 1000)),
            type: 'photo'
          },
          {
            id: Date.now() + Math.random() + 1,
            user: '宠物达人',
            avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=user2&size=80',
            content: '动态分享',
            time: this.formatTime(new Date(Date.now() - 24 * 60 * 60 * 1000)),
            type: 'post'
          },
          {
            id: Date.now() + Math.random() + 2,
            user: '猫咪控',
            avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=user3&size=80',
            content: '宠物视频',
            time: this.formatTime(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)),
            type: 'video'
          }
        ];
        
        resolve({
          success: true,
          data: this.data.page === 1 ? mockLikes : mockLikes.slice(0, 1)
        });
      }, 800);
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

  // 查看点赞详情
  onViewDetail(e) {
    const item = e.currentTarget.dataset.item;
    wx.showModal({
      title: '点赞详情',
      content: `${item.user} 赞了你的${item.content}`,
      showCancel: false
    });
  },

  // 去发布内容
  onGoToPost() {
    loadingNavigator.switchTab('/pages/community/index');
  }
});