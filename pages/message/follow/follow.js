// 关注页面
const { cloudApi } = require('../../../utils/cloudApi');
const loadingNavigator = require('../../../utils/loadingNavigator');

Page({
  data: {
    follows: [],
    loading: false,
    refreshing: false,
    loadingMore: false,
    noMore: false,
    page: 1,
    pageSize: 20
  },

  onLoad() {
    this.loadFollows();
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
      await this.loadFollows(true);
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
      await this.loadFollows(false);
    } finally {
      this.setData({ loadingMore: false });
    }
  },

  // 加载关注数据
  async loadFollows(refresh = false) {
    if (this.data.loading && !refresh) return;
    
    this.setData({ loading: !refresh });
    
    try {
      // TODO: 替换为真实的云端API调用
      // const result = await cloudApi.social.getFollows(this.data.page, this.data.pageSize);
      
      const mockResult = await this.getMockFollows();
      
      if (mockResult.success) {
        const newFollows = mockResult.data;
        const currentFollows = refresh ? [] : this.data.follows;
        
        this.setData({
          follows: [...currentFollows, ...newFollows],
          page: this.data.page + 1,
          noMore: newFollows.length < this.data.pageSize
        });
      }
    } catch (error) {
      console.error('加载关注数据失败:', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 模拟获取关注数据
  getMockFollows() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockFollows = [
          {
            id: Date.now() + Math.random(),
            user: '萌宠爱好者',
            avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=follower1&size=80',
            desc: '关注了你',
            time: this.formatTime(new Date(Date.now() - 24 * 60 * 60 * 1000)),
            followed: false,
            bio: '热爱小动物的铲屎官'
          },
          {
            id: Date.now() + Math.random() + 1,
            user: '宠物达人',
            avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=follower2&size=80',
            desc: '关注了你',
            time: this.formatTime(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)),
            followed: true,
            bio: '专业宠物训练师'
          },
          {
            id: Date.now() + Math.random() + 2,
            user: '猫咪控',
            avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=follower3&size=80',
            desc: '关注了你',
            time: this.formatTime(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
            followed: false,
            bio: '家有三只猫主子'
          }
        ];
        
        resolve({
          success: true,
          data: this.data.page === 1 ? mockFollows : mockFollows.slice(0, 1)
        });
      }, 800);
    });
  },

  // 关注回关
  async onFollowBack(e) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.follows.find(f => f.id === id);
    
    if (!item) return;
    
    try {
      // TODO: 调用真实的关注API
      // await cloudApi.social.followUser(item.userId, !item.followed);
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const follows = this.data.follows.map(f => 
        f.id === id ? { ...f, followed: !f.followed } : f
      );
      
      this.setData({ follows });
      
      wx.showToast({
        title: item.followed ? '已取消关注' : '关注成功',
        icon: 'success'
      });
      
    } catch (error) {
      console.error('关注操作失败:', error);
      wx.showToast({
        title: '操作失败，请重试',
        icon: 'none'
      });
    }
  },

  // 查看用户资料
  onViewProfile(e) {
    const item = e.currentTarget.dataset.item;
    wx.showModal({
      title: item.user,
      content: item.bio || '这个人很神秘，什么都没有留下',
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
  // 去发布内容
  onGoToPost() {
    loadingNavigator.switchTab('/pages/community/index');
  }
});