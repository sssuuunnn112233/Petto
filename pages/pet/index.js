const aiService = require('../../utils/aiService');
const compatibleBaiduASR = require('../../utils/compatibleBaiduASR');
const mockVoiceService = require('../../utils/mockVoiceService');

Page({
  data: {
    mood: 80,
    hunger: 50,
    inputValue: "",
    petName: "Petto",
    petAge: 1,
    chatLogs: [
      { from: "pet", text: "你好呀，我是Petto~" }
    ],
    // 临时气泡
    showPetBubble: false,
    petBubbleText: "",
    showUserBubble: false,
    userBubbleText: "",
    // 设置悬浮窗
    showPetSettingsModal: false,
    tempPetName: "",
    tempPetGender: "male",
    petGender: "male",
    // AI 对话状态
    isAIThinking: false,
    // 语音相关
    isRecording: false,
    isPlaying: false,
    recorderManager: null,
    innerAudioContext: null,
    // 宠物自定义配置
    petCustomization: null,
    useCustomPet: false,
    // 装扮配置
    wornOutfits: [],
    // 开发测试模式
    isDevelopmentMode: false,
    showTestPanel: false,
    // 语音回应设置
    enableVoiceResponse: true, // 默认启用语音回应
    tempEnableVoiceResponse: true,
    // 时间系统配置
    lastUpdateTime: Date.now(), // 上次更新时间
    statusTimer: null, // 状态更新定时器
    // 背景选择功能
    backgroundImages: [
      { id: 1, name: '阳光小屋', path: '/assets/pet-backgrounds/bg1.jpg' },
      { id: 2, name: '森林雪屋', path: '/assets/pet-backgrounds/bg2.jpg' },
      { id: 3, name: '复古小屋', path: '/assets/pet-backgrounds/bg3.jpg' },
      { id: 4, name: '雪中公寓', path: '/assets/pet-backgrounds/bg4.jpg' },
      { id: 5, name: '秋叶小屋', path: '/assets/pet-backgrounds/bg5.jpg' },
      { id: 6, name: '可爱小屋', path: '/assets/pet-backgrounds/bg6.jpg' }
    ],
    currentBackground: '/assets/pet-backgrounds/bg1.jpg', // 默认第一张
    showBackgroundSelector: false,
    // 状态条样式
    moodBarStyle: '',
    hungerBarStyle: ''
  },

  // 检查存储使用情况
  checkStorageUsage() {
    try {
      wx.getStorageInfo({
        success: (res) => {
          const usedSize = res.currentSize;
          const totalSize = res.limitSize;
          const usagePercent = (usedSize / totalSize * 100).toFixed(1);
          
          console.log('📊 存储使用情况:', {
            used: usedSize + 'KB',
            total: totalSize + 'KB', 
            usage: usagePercent + '%'
          });
          
          // 如果存储使用超过80%，进行清理
          if (usedSize / totalSize > 0.8) {
            console.log('⚠️ 存储使用率过高，开始清理...');
            this.cleanupStorage();
          }
        },
        fail: (err) => {
          console.error('❌ 获取存储信息失败:', err);
        }
      });
    } catch (error) {
      console.error('❌ 检查存储使用情况失败:', error);
    }
  },

  // 清理存储
  cleanupStorage() {
    try {
      console.log('🧹 开始清理存储...');
      
      // 清理聊天记录，只保留最近10条
      const recentChats = this.data.chatLogs.slice(-10);
      this.setData({ chatLogs: recentChats });
      console.log('✅ 聊天记录已清理，保留', recentChats.length, '条');
      
      // 清理可能的临时数据
      const keysToClean = [
        'tempChatData',
        'oldGameRecords', 
        'cachedImages',
        'tempUserData'
      ];
      
      keysToClean.forEach(key => {
        try {
          wx.removeStorageSync(key);
          console.log('🗑️ 已清理:', key);
        } catch (e) {
          // 忽略不存在的key
        }
      });
      
      // 重新检查存储使用情况
      setTimeout(() => {
        this.checkStorageUsage();
      }, 1000);
      
      wx.showToast({
        title: '存储已优化',
        icon: 'success',
        duration: 2000
      });
      
    } catch (error) {
      console.error('❌ 清理存储失败:', error);
    }
  },

  // 更新状态条样式
  updateStatusBarStyles() {
    const { mood, hunger } = this.data;
    
    // 心情值颜色：高(绿) > 中(橙) > 低(红)
    const moodColor = mood > 60 ? '#4CAF50' : mood > 30 ? '#FF9800' : '#F44336';
    const moodBarStyle = `width: ${mood}%; background-color: ${moodColor};`;
    
    // 饥饿值颜色：低(绿) > 中(橙) > 高(红)
    const hungerColor = hunger < 40 ? '#4CAF50' : hunger < 70 ? '#FF9800' : '#F44336';
    const hungerBarStyle = `width: ${hunger}%; background-color: ${hungerColor};`;
    
    this.setData({
      moodBarStyle,
      hungerBarStyle
    });
  },

  onLoad() {
    // 检查存储使用情况
    this.checkStorageUsage();
    
    this.loadPetCustomization();
    this.loadWornOutfits();
    this.loadPetSettings();
    this.loadPetStatus(); // 加载宠物状态
    this.updateStatusBarStyles(); // 更新状态条样式
    this.startStatusTimer(); // 启动状态更新定时器
    
    // 检测开发环境
    const isDev = mockVoiceService.isDevelopmentMode();
    this.setData({ 
      isDevelopmentMode: isDev,
      showTestPanel: false  // 默认不展开测试面板
    });
    
    if (isDev) {
      console.log('🔧 开发环境检测到，启用测试功能');
    }
  },

  onShow() {
    // 每次显示页面时重新加载配置（从捏脸页面或衣橱页面返回时会更新）
    this.loadPetCustomization();
    this.loadWornOutfits();
    this.loadPetStatus(); // 重新加载状态，计算离线时间
    this.updateStatusBarStyles(); // 更新状态条样式
    this.startStatusTimer(); // 重新启动定时器
    
    // 检查是否有喂食效果需要显示
    this.checkFeedingEffect();
  },

  onHide() {
    // 页面隐藏时停止定时器并保存状态
    this.stopStatusTimer();
    this.savePetStatus();
  },

  onUnload() {
    // 页面卸载时清理资源
    this.stopStatusTimer();
    this.savePetStatus();
    
    if (this.data.innerAudioContext) {
      this.data.innerAudioContext.destroy();
    }
    if (this.data.recorderManager) {
      this.data.recorderManager.stop();
    }
  },

  // 检查喂食效果
  checkFeedingEffect() {
    try {
      // 检查喂食效果
      const feedingEffect = wx.getStorageSync('feedingEffect');
      if (feedingEffect) {
        // 清除标记
        wx.removeStorageSync('feedingEffect');
        
        // 显示喂食成功消息
        setTimeout(() => {
          const quantity = feedingEffect.quantity || 1;
          const quantityText = quantity > 1 ? `${quantity}个` : '';
          this.addChat("pet", `谢谢你给我${quantityText}${feedingEffect.foodName}！好好吃呀～`);
        }, 500);
      }
      
      // 检查玩具效果
      const toyEffect = wx.getStorageSync('toyEffect');
      if (toyEffect) {
        // 清除标记
        wx.removeStorageSync('toyEffect');
        
        // 显示陪玩成功消息
        setTimeout(() => {
          this.addChat("pet", `和你一起玩${toyEffect.toyName}真开心！我们是最好的朋友～`);
        }, 500);
      }
    } catch (error) {
      console.error('检查效果失败:', error);
    }
  },

  // 加载宠物自定义配置
  loadPetCustomization() {
    try {
      const customization = wx.getStorageSync('catCustomization');
      if (customization) {
        this.setData({
          petCustomization: customization,
          useCustomPet: true
        });
        console.log('加载自定义宠物配置:', customization);
      } else {
        this.setData({
          useCustomPet: false
        });
      }
    } catch (error) {
      console.error('加载宠物配置失败:', error);
      this.setData({
        useCustomPet: false
      });
    }
  },

  // 加载装扮配置
  loadWornOutfits() {
    try {
      const wornOutfits = wx.getStorageSync('savedOutfit');
      if (wornOutfits && Array.isArray(wornOutfits)) {
        this.setData({
          wornOutfits: wornOutfits
        });
        console.log('加载装扮配置:', wornOutfits);
      } else {
        this.setData({
          wornOutfits: []
        });
      }
    } catch (error) {
      console.error('加载装扮配置失败:', error);
      this.setData({
        wornOutfits: []
      });
    }
  },

  // 加载宠物设置
  loadPetSettings() {
    try {
      const settings = wx.getStorageSync('petSettings');
      if (settings) {
        this.setData({
          petName: settings.name || 'Petto',
          petGender: settings.gender || 'male',
          enableVoiceResponse: settings.enableVoiceResponse !== undefined ? settings.enableVoiceResponse : true,
          currentBackground: settings.background || '/assets/pet-backgrounds/bg1.jpg'
        });
        console.log('加载宠物设置:', settings);
      }
    } catch (error) {
      console.error('加载宠物设置失败:', error);
    }
  },

  // === 宠物状态管理系统 ===
  
  // 加载宠物状态
  loadPetStatus() {
    try {
      const savedStatus = wx.getStorageSync('petStatus');
      const currentTime = Date.now();
      
      if (savedStatus) {
        const { mood, hunger, lastUpdateTime } = savedStatus;
        const timeDiff = currentTime - (lastUpdateTime || currentTime);
        
        // 计算离线时间的状态变化（每5分钟饥饿值+1，心情值-0.2）
        const minutesOffline = Math.floor(timeDiff / (1000 * 60));
        const hungerIncrease = Math.min(minutesOffline * 0.2, 50); // 最多增加50点饥饿
        const moodDecrease = Math.min(minutesOffline * 0.2, 30); // 最多减少30点心情
        
        const newHunger = Math.min(Math.max(hunger + hungerIncrease, 0), 100);
        const newMood = Math.min(Math.max(mood - moodDecrease, 0), 100);
        
        this.setData({
          mood: Math.round(newMood),
          hunger: Math.round(newHunger),
          lastUpdateTime: currentTime
        });
        
        // 更新状态条样式
        this.updateStatusBarStyles();
        
        if (minutesOffline > 0) {
          console.log(`离线 ${minutesOffline} 分钟，饥饿值: ${hunger} → ${newHunger}，心情值: ${mood} → ${newMood}`);
        }
      } else {
        // 首次加载，设置初始状态
        this.setData({
          mood: 80,
          hunger: 50,
          lastUpdateTime: currentTime
        });
      }
    } catch (error) {
      console.error('加载宠物状态失败:', error);
      this.setData({
        mood: 80,
        hunger: 50,
        lastUpdateTime: Date.now()
      });
    }
  },

  // 保存宠物状态
  savePetStatus() {
    try {
      const status = {
        mood: this.data.mood,
        hunger: this.data.hunger,
        lastUpdateTime: Date.now()
      };
      wx.setStorageSync('petStatus', status);
      console.log('宠物状态已保存:', status);
    } catch (error) {
      console.error('保存宠物状态失败:', error);
    }
  },

  // 启动状态更新定时器
  startStatusTimer() {
    // 先清除现有定时器
    this.stopStatusTimer();
    
    // 每2分钟更新一次状态
    const timer = setInterval(() => {
      this.updatePetStatus();
    }, 120000); // 2分钟
    
    this.setData({ statusTimer: timer });
    console.log('状态更新定时器已启动');
  },

  // 停止状态更新定时器
  stopStatusTimer() {
    if (this.data.statusTimer) {
      clearInterval(this.data.statusTimer);
      this.setData({ statusTimer: null });
      console.log('状态更新定时器已停止');
    }
  },

  // 更新宠物状态
  updatePetStatus() {
    const currentTime = Date.now();
    const timeDiff = currentTime - this.data.lastUpdateTime;
    const minutesPassed = timeDiff / (1000 * 60);
    
    // 只有超过1分钟才更新状态
    if (minutesPassed >= 1) {
      let { mood, hunger } = this.data;
      
      // 饥饿值每5分钟增加1点
      hunger = Math.min(hunger + minutesPassed * 0.2, 100);
      
      // 心情值变化规则：
      // - 饥饿值高时心情下降更快
      // - 饥饿值低时心情缓慢恢复
      if (hunger > 70) {
        // 很饿时心情下降
        mood = Math.max(mood - minutesPassed * 0.3, 0);
      } else if (hunger > 40) {
        // 有点饿时心情缓慢下降
        mood = Math.max(mood - minutesPassed * 0.1, 0);
      } else {
        // 不饿时心情缓慢恢复
        mood = Math.min(mood + minutesPassed * 0.1, 100);
      }
      
      this.setData({
        mood: Math.round(mood),
        hunger: Math.round(hunger),
        lastUpdateTime: currentTime
      });
      
      // 更新状态条样式
      this.updateStatusBarStyles();
      
      // 定期保存状态
      this.savePetStatus();
      
      // 状态提醒
      this.checkStatusAlerts();
    }
  },

  // 检查状态提醒
  checkStatusAlerts() {
    const { mood, hunger } = this.data;
    
    // 饥饿提醒
    if (hunger >= 90) {
      this.addChat("pet", "我好饿好饿，快给我吃点东西吧！");
    } else if (hunger >= 70) {
      this.addChat("pet", "肚子有点饿了呢～");
    }
    
    // 心情提醒
    if (mood <= 20) {
      this.addChat("pet", "我心情不太好，需要你的陪伴...");
    } else if (mood <= 40) {
      this.addChat("pet", "感觉有点无聊，陪我玩玩吧～");
    }
  },

  // 点击宠物互动
  onPetTouch() {
    let mood = this.data.mood + 3; // 触摸增加少量心情
    if (mood > 100) mood = 100;
    
    this.setData({
      mood: Math.round(mood),
      lastUpdateTime: Date.now()
    });
    
    // 更新状态条样式
    this.updateStatusBarStyles();
    
    // 根据当前状态给出不同回应
    const { hunger } = this.data;
    if (hunger > 80) {
      this.addChat("pet", "好饿呀，先给我点吃的吧～");
    } else if (mood >= 90) {
      this.addChat("pet", "嘿嘿，好开心呀～");
    } else {
      this.addChat("pet", "嘿嘿，好痒呀～");
    }
    
    // 保存状态
    this.savePetStatus();
  },

  // 免费喂食
  feedPetFree() {
    let hunger = this.data.hunger - 15; // 减少饥饿值
    let mood = this.data.mood + 5; // 喂食也能增加一点心情
    
    if (hunger < 0) hunger = 0;
    if (mood > 100) mood = 100;
    
    this.setData({ 
      hunger: Math.round(hunger),
      mood: Math.round(mood),
      lastUpdateTime: Date.now()
    });
    
    // 更新状态条样式
    this.updateStatusBarStyles();
    
    // 保存状态
    this.savePetStatus();
    
    // 根据饥饿程度给出不同回应
    if (this.data.hunger <= 30) {
      this.addChat("pet", "谢谢你！好好吃，我饱了～");
    } else {
      this.addChat("pet", "谢谢你！还想要更多～");
    }
  },

  // 免费陪玩
  playWithPetFree() {
    let mood = this.data.mood + 15; // 增加陪玩效果
    let hunger = this.data.hunger + 2; // 玩耍会消耗一点体力，增加饥饿
    
    if (mood > 100) mood = 100;
    if (hunger > 100) hunger = 100;
    
    this.setData({
      mood: Math.round(mood),
      hunger: Math.round(hunger),
      lastUpdateTime: Date.now()
    });
    
    // 更新状态条样式
    this.updateStatusBarStyles();
    
    // 保存状态
    this.savePetStatus();
    
    // 根据心情给出不同回应
    if (this.data.mood >= 90) {
      this.addChat("pet", "太开心了！我们是最好的朋友～");
    } else if (this.data.mood >= 70) {
      this.addChat("pet", "玩得真开心！再来一次吧～");
    } else {
      this.addChat("pet", "谢谢你陪我玩，心情好多了！");
    }
  },

  // 喂食
  feedPet() {
    // 跳转到积分商店的食物分类
    const loadingNav = require('../../utils/loadingNavigator');
    loadingNav.navigateTo('/pages/points-store/points-store?category=food&from=pet');
  },

  // 陪玩
  playWithPet() {
    // 跳转到积分商店的玩具分类
    const loadingNav = require('../../utils/loadingNavigator');
    loadingNav.navigateTo('/pages/points-store/points-store?category=toys&from=pet');
  },

  // 记录输入
  onInputChange(e) {
    this.setData({ inputValue: e.detail.value });
  },

  // 发送消息
  async sendMessage() {
    const msg = this.data.inputValue.trim();
    if (!msg) return;
    
    if (this.data.isAIThinking) {
      wx.showToast({ title: '请等待回复...', icon: 'none' });
      return;
    }
    
    this.addChat("user", msg);
    this.showUserTempBubble(msg);
    this.setData({ inputValue: "", isAIThinking: true });

    try {
      if (this.data.enableVoiceResponse) {
        // 启用语音回应：使用语音回复
        console.log('📝 文字输入 → 🔊 语音回应');
        await this.getAIVoiceResponse(msg);
      } else {
        // 禁用语音回应：仅文字回复
        console.log('📝 文字输入 → 📝 文字回应');
        const response = await aiService.getAIResponse(msg, this.data.chatLogs);
        this.addChat("pet", response, false); // 不保持气泡显示
        this.updateMoodByResponse(response);
      }
    } catch (error) {
      console.error('AI 回复失败:', error);
      this.addChat("pet", "汪～我好像有点累了，稍后再聊吧！");
    } finally {
      this.setData({ isAIThinking: false });
    }
  },
  
  // 根据 AI 回复更新心情值
  updateMoodByResponse(response) {
    // 积极回复增加心情值
    const positiveWords = ['开心', '高兴', '喜欢', '好呀', '太好了'];
    const hasPositive = positiveWords.some(word => response.includes(word));
    
    if (hasPositive) {
      this.setData({
        mood: Math.min(this.data.mood + 3, 100)
      });
    }
  },

  // 聊天记录添加
  addChat(from, text, isVoiceMessage = false) {
    const newChatLogs = [...this.data.chatLogs, { from, text }];
    
    // 限制聊天记录数量，避免存储溢出
    const MAX_CHAT_LOGS = 50; // 最多保留50条记录
    if (newChatLogs.length > MAX_CHAT_LOGS) {
      // 保留最近的记录，删除最旧的记录
      newChatLogs.splice(0, newChatLogs.length - MAX_CHAT_LOGS);
      console.log('🧹 聊天记录已清理，保留最近', MAX_CHAT_LOGS, '条');
    }
    
    this.setData({
      chatLogs: newChatLogs
    });
    
    if (from === 'pet') {
      // 如果是语音消息，气泡在语音播放期间保持显示
      this.showPetTempBubble(text, isVoiceMessage);
    }
  },

  // 展示宠物临时气泡，支持语音播放期间保持显示
  showPetTempBubble(text, keepDuringVoice = false) {
    if (this._petBubbleTimer) clearTimeout(this._petBubbleTimer);
    this.setData({ showPetBubble: true, petBubbleText: text });
    
    if (!keepDuringVoice) {
      // 普通模式：3秒后消失
      this._petBubbleTimer = setTimeout(() => {
        this.setData({ showPetBubble: false, petBubbleText: '' });
      }, 3000);
    }
    // 如果keepDuringVoice为true，则不设置定时器，需要手动隐藏
  },

  // 隐藏宠物气泡
  hidePetBubble() {
    if (this._petBubbleTimer) {
      clearTimeout(this._petBubbleTimer);
      this._petBubbleTimer = null;
    }
    this.setData({ showPetBubble: false, petBubbleText: '' });
  },

  // 展示用户临时气泡，3秒后消失
  showUserTempBubble(text) {
    if (this._userBubbleTimer) clearTimeout(this._userBubbleTimer);
    this.setData({ showUserBubble: true, userBubbleText: text });
    this._userBubbleTimer = setTimeout(() => {
      this.setData({ showUserBubble: false, userBubbleText: '' });
    }, 3000);
  },

  onWardrobeClick() {
    const loadingNav = require('../../utils/loadingNavigator');
    loadingNav.navigateTo('/pages/wardrobe/index', null, true); // 启用快速模式
  },

  onCustomizeClick() {
    const loadingNav = require('../../utils/loadingNavigator');
    loadingNav.navigateTo('/pages/customize/index', null, true); // 启用快速模式
  },

  // 初始化录音管理器
  initRecorder() {
    if (this.data.recorderManager) return;
    
    // 使用模拟或真实录音管理器
    const recorderManager = mockVoiceService.createMockRecorderManager();
    
    recorderManager.onStart(() => {
      console.log('开始录音');
      this.setData({ isRecording: true });
    });
    
    recorderManager.onStop((res) => {
      console.log('录音结束', res);
      this.setData({ isRecording: false });
      this.handleVoiceInput(res.tempFilePath);
    });
    
    recorderManager.onError((err) => {
      console.error('录音错误', err);
      this.setData({ isRecording: false });
      wx.showToast({ title: '录音失败', icon: 'none' });
    });
    
    this.setData({ recorderManager });
  },
  
  // 初始化音频播放器
  initAudioPlayer() {
    if (this.data.innerAudioContext) return;
    
    const innerAudioContext = wx.createInnerAudioContext();
    
    innerAudioContext.onPlay(() => {
      console.log('🔊 音频播放开始');
      this.setData({ isPlaying: true });
    });
    
    // 注意：播放结束和错误事件会在playVoice中重新设置
    // 这里只设置基本的播放开始事件
    
    this.setData({ innerAudioContext });
  },
  
  // 语音按钮点击 - 开始语音通话
  onVoiceTap() {
    if (!this.data.recorderManager) {
      this.initRecorder();
    }
    
    if (!this.data.innerAudioContext) {
      this.initAudioPlayer();
    }
    
    // 如果正在播放，先停止
    if (this.data.isPlaying) {
      this.data.innerAudioContext.stop();
      this.setData({ isPlaying: false });
      return;
    }
    
    if (this.data.isRecording) {
      // 停止录音
      this.data.recorderManager.stop();
    } else {
      // 开始录音
      this.startVoiceCall();
    }
  },
  
  // 开始语音通话
  startVoiceCall() {
    wx.authorize({
      scope: 'scope.record',
      success: () => {
        // 使用压缩格式，控制文件大小在2MB以内
        this.data.recorderManager.start({
          duration: 5000,       // 5秒录音（减少时长）
          format: 'mp3',        // 改回MP3格式（压缩率高）
          sampleRate: 8000,     // 降低采样率到8kHz
          numberOfChannels: 1,  // 单声道
          encodeBitRate: 24000  // 降低码率到24kbps
        });
        wx.showToast({ title: '开始说话...', icon: 'none', duration: 1000 });
      },
      fail: () => {
        wx.showModal({
          title: '需要录音权限',
          content: '语音通话需要录音权限，请在设置中开启',
          success: (res) => {
            if (res.confirm) {
              wx.openSetting();
            }
          }
        });
      }
    });
  },
  
  // 处理语音输入
  async handleVoiceInput(tempFilePath) {
    wx.showLoading({ title: '识别中...', mask: true });
    
    try {
      console.log('🎤 开始处理语音输入:', tempFilePath);
      
      let text;
      
      // 根据环境选择识别方式
      if (this.data.isDevelopmentMode) {
        // 开发环境使用模拟识别
        text = await mockVoiceService.mockSpeechToText(tempFilePath);
      } else {
        // 真机环境使用真实API
        text = await compatibleBaiduASR.compatibleASR(tempFilePath);
      }
      
      wx.hideLoading();
      
      if (!text || text.trim() === '') {
        wx.showToast({ title: '没有识别到内容', icon: 'none' });
        return;
      }
      
      console.log('✅ 语音识别成功:', text);
      
      // 显示识别的文字
      this.addChat("user", text);
      this.showUserTempBubble(text);
      
      // 获取 AI 回复并播放语音
      await this.getAIVoiceResponse(text);
      
    } catch (error) {
      wx.hideLoading();
      console.error('❌ 语音识别失败:', error);
      
      // 显示具体错误信息
      let errorMsg = '识别失败，请重试';
      if (error.message) {
        if (error.message.includes('3300')) {
          errorMsg = '音频参数错误';
        } else if (error.message.includes('3301')) {
          errorMsg = '音频质量过差，请在安静环境录音';
        } else if (error.message.includes('3302')) {
          errorMsg = 'API配置错误';
        } else if (error.message.includes('3312')) {
          errorMsg = '音频格式不支持，请重新录音';
        }
      }
      
      // 降级处理：使用模拟输入
      console.log('🔄 降级处理：使用模拟输入');
      this.addChat("user", "你好");
      await this.getAIVoiceResponse("你好");
      
      wx.showToast({ title: errorMsg + '，已使用模拟输入', icon: 'none', duration: 3000 });
    }
  },
  
  // 获取 AI 回复并播放语音
  async getAIVoiceResponse(userMessage) {
    this.setData({ isAIThinking: true });
    
    try {
      // 获取 AI 文字回复
      wx.showLoading({ title: 'Petto思考中...', mask: true });
      const response = await aiService.getAIResponse(userMessage, this.data.chatLogs);
      
      // 显示文字回复（标记为语音消息，气泡保持显示）
      this.addChat("pet", response, true);
      
      // 文字转语音
      wx.showLoading({ title: '生成语音...', mask: true });
      const audioPath = await aiService.textToSpeech(response);
      
      wx.hideLoading();
      
      // 播放语音
      this.playVoice(audioPath, response);
      
      // 更新心情值
      this.updateMoodByResponse(response);
      
    } catch (error) {
      wx.hideLoading();
      console.error('AI 回复失败:', error);
      
      // 降级处理：只显示文字
      const fallbackResponse = "汪～我好像有点累了，稍后再聊吧！";
      this.addChat("pet", fallbackResponse);
      
      wx.showToast({ title: '语音生成失败', icon: 'none' });
    } finally {
      this.setData({ isAIThinking: false });
    }
  },
  
  // 播放语音
  playVoice(audioPath) {
    // 如果是模拟模式，跳过播放
    if (audioPath === 'mock_audio_path' || audioPath.startsWith('mock_audio_path')) {
      console.log('🔊 [模拟] 开始播放语音');
      this.setData({ isPlaying: true });
      
      // 模拟播放 2-4 秒
      const playDuration = 2000 + Math.random() * 2000;
      setTimeout(() => {
        console.log('🔊 [模拟] 播放结束');
        this.setData({ isPlaying: false });
        // 播放结束后隐藏气泡
        this.hidePetBubble();
      }, playDuration);
      return;
    }
    
    if (!this.data.innerAudioContext) {
      this.initAudioPlayer();
    }
    
    const audio = this.data.innerAudioContext;
    
    // 设置播放结束回调
    audio.onEnded(() => {
      console.log('🔊 语音播放结束');
      this.setData({ isPlaying: false });
      // 播放结束后隐藏气泡
      this.hidePetBubble();
    });
    
    // 设置播放错误回调
    audio.onError((err) => {
      console.error('🔊 语音播放错误:', err);
      this.setData({ isPlaying: false });
      // 播放错误时也隐藏气泡
      this.hidePetBubble();
    });
    
    audio.src = audioPath;
    audio.play();
    
    console.log('🔊 开始播放语音');
    this.setData({ isPlaying: true });
  },

  // 打开设置悬浮窗
  onPetInfoTap() {
    this.setData({
      showPetSettingsModal: true,
      tempPetName: this.data.petName || '',
      tempPetGender: this.data.petGender || 'male',
      tempEnableVoiceResponse: this.data.enableVoiceResponse
    });
  },

  // 输入名称
  onPetNameInput(e) {
    this.setData({ tempPetName: e.detail.value });
  },

  // 选择性别
  onGenderSelect(e) {
    const gender = e.currentTarget.dataset.gender;
    if (!gender) return;
    this.setData({ tempPetGender: gender });
  },

  // 切换语音回应设置
  onVoiceResponseToggle() {
    this.setData({
      tempEnableVoiceResponse: !this.data.tempEnableVoiceResponse
    });
  },

  // 取消与保存
  onSettingsCancel() {
    this.setData({ showPetSettingsModal: false });
  },

  onSettingsConfirm() {
    const name = (this.data.tempPetName || '').trim();
    if (!name) {
      wx.showToast({ title: '请输入名称', icon: 'none' });
      return;
    }
    this.setData({
      petName: name,
      petGender: this.data.tempPetGender,
      enableVoiceResponse: this.data.tempEnableVoiceResponse,
      showPetSettingsModal: false
    });
    
    // 保存设置到本地存储
    try {
      wx.setStorageSync('petSettings', {
        name: name,
        gender: this.data.tempPetGender,
        enableVoiceResponse: this.data.tempEnableVoiceResponse,
        background: this.data.currentBackground
      });
    } catch (error) {
      console.error('保存设置失败:', error);
    }
    
    wx.showToast({ title: '已更新', icon: 'success' });
  },

  // 处理宠物图片加载错误
  onPetImageError(e) {
    console.warn('宠物渲染图片加载失败:', e.detail);
  },
  
  // === 开发测试功能 ===
  
  // 切换测试面板显示
  toggleTestPanel() {
    this.setData({
      showTestPanel: !this.data.showTestPanel
    });
  },
  
  // 测试模拟语音识别
  async testMockVoiceRecognition() {
    console.log('🧪 测试模拟语音识别');
    wx.showLoading({ title: '测试中...', mask: true });
    
    try {
      const result = await mockVoiceService.mockSpeechToText('/mock/test.mp3');
      wx.hideLoading();
      
      this.addChat("user", result);
      this.showUserTempBubble(result);
      await this.getAIVoiceResponse(result);
      
      wx.showToast({ title: '测试成功', icon: 'success' });
    } catch (error) {
      wx.hideLoading();
      console.error('测试失败:', error);
      wx.showToast({ title: '测试失败', icon: 'error' });
    }
  },
  
  // 测试模拟语音合成
  async testMockVoiceSynthesis() {
    console.log('🧪 测试模拟语音合成');
    wx.showLoading({ title: '测试中...', mask: true });
    
    try {
      const audioPath = await mockVoiceService.mockTextToSpeech('这是一个测试语音合成');
      wx.hideLoading();
      
      console.log('合成结果:', audioPath);
      wx.showToast({ title: '合成成功', icon: 'success' });
    } catch (error) {
      wx.hideLoading();
      console.error('合成失败:', error);
      wx.showToast({ title: '合成失败', icon: 'error' });
    }
  },
  
  // 测试完整语音对话流程
  async testFullVoiceFlow() {
    console.log('🧪 测试完整语音对话流程');
    
    // 模拟录音开始
    this.setData({ isRecording: true });
    wx.showToast({ title: '模拟录音中...', icon: 'none' });
    
    // 2秒后模拟录音结束
    setTimeout(async () => {
      this.setData({ isRecording: false });
      
      try {
        // 模拟语音识别
        const text = await mockVoiceService.mockSpeechToText('/mock/full_test.mp3');
        
        // 显示识别结果
        this.addChat("user", text);
        this.showUserTempBubble(text);
        
        // 获取AI回复并播放语音
        await this.getAIVoiceResponse(text);
        
        wx.showToast({ title: '完整流程测试成功', icon: 'success' });
      } catch (error) {
        console.error('流程测试失败:', error);
        wx.showToast({ title: '流程测试失败', icon: 'error' });
      }
    }, 2000);
  },
  
  // 测试随机对话
  testRandomChat() {
    const randomTexts = mockVoiceService.MOCK_RECOGNITION_RESULTS;
    const randomText = randomTexts[Math.floor(Math.random() * randomTexts.length)];
    
    console.log('🧪 测试随机对话:', randomText);
    this.addChat("user", randomText);
    this.showUserTempBubble(randomText);
    this.getAIVoiceResponse(randomText);
  },

  // 测试状态变化
  testStatusChange() {
    console.log('🧪 测试状态变化');
    
    // 随机改变状态值
    const moodChange = Math.floor(Math.random() * 40) - 20; // -20 到 +20
    const hungerChange = Math.floor(Math.random() * 30) - 10; // -10 到 +20
    
    let newMood = Math.max(0, Math.min(100, this.data.mood + moodChange));
    let newHunger = Math.max(0, Math.min(100, this.data.hunger + hungerChange));
    
    this.setData({
      mood: newMood,
      hunger: newHunger,
      lastUpdateTime: Date.now()
    });
    
    // 更新状态条样式
    this.updateStatusBarStyles();
    
    this.savePetStatus();
    
    wx.showToast({
      title: `心情${moodChange > 0 ? '+' : ''}${moodChange} 饥饿${hungerChange > 0 ? '+' : ''}${hungerChange}`,
      icon: 'none',
      duration: 2000
    });
  },

  // 重置状态值
  resetStatus() {
    console.log('🧪 重置状态值');
    
    this.setData({
      mood: 80,
      hunger: 50,
      lastUpdateTime: Date.now()
    });
    
    // 更新状态条样式
    this.updateStatusBarStyles();
    
    this.savePetStatus();
    
    wx.showToast({
      title: '状态已重置',
      icon: 'success',
      duration: 1500
    });
  },

  // 快速切换语音回应
  toggleVoiceResponse() {
    const newValue = !this.data.enableVoiceResponse;
    this.setData({ enableVoiceResponse: newValue });
    
    // 保存到本地存储
    try {
      const settings = wx.getStorageSync('petSettings') || {};
      settings.enableVoiceResponse = newValue;
      wx.setStorageSync('petSettings', settings);
    } catch (error) {
      console.error('保存设置失败:', error);
    }
    
    const status = newValue ? '已启用' : '已禁用';
    wx.showToast({ 
      title: `语音回应${status}`, 
      icon: newValue ? 'success' : 'none',
      duration: 1500
    });
    console.log('🔊 语音回应状态:', status);
  },

  // 手动清理存储
  manualCleanupStorage() {
    wx.showModal({
      title: '清理存储',
      content: '是否清理应用存储以释放空间？这将删除旧的聊天记录和语音文件。',
      confirmText: '清理',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.cleanupStorage();
        }
      }
    });
  },

  // === 背景选择功能 ===
  
  // 显示背景选择器
  showBackgroundSelector() {
    this.setData({
      showBackgroundSelector: true
    });
  },

  // 隐藏背景选择器
  hideBackgroundSelector() {
    this.setData({
      showBackgroundSelector: false
    });
  },

  // 选择背景
  onBackgroundSelect(e) {
    const backgroundPath = e.currentTarget.dataset.path;
    const backgroundName = e.currentTarget.dataset.name;
    
    this.setData({
      currentBackground: backgroundPath,
      showBackgroundSelector: false
    });

    // 保存背景设置
    try {
      const settings = wx.getStorageSync('petSettings') || {};
      settings.background = backgroundPath;
      wx.setStorageSync('petSettings', settings);
      
      wx.showToast({
        title: `切换到${backgroundName}`,
        icon: 'success',
        duration: 1500
      });
      console.log('🖼️ 背景已切换:', backgroundName, backgroundPath);
    } catch (error) {
      console.error('保存背景设置失败:', error);
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      });
    }
  }
})
