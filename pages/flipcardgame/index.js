const loadingNav = require('../../utils/loadingNavigator');
const { cloudApi } = require('../../utils/cloudApi');
const PointsSync = require('../../utils/pointsSync');

Page({
  data: {
    level: 1, // 当前关卡 1, 2, 3
    cards: [], // 卡片数组
    flippedCards: [], // 已翻开的卡片索引
    matchedPairs: 0, // 已匹配的对数
    moves: 0, // 移动次数
    time: 0, // 游戏时间（秒）
    timeFormatted: '00:00', // 格式化后的时间
    timer: null, // 计时器
    isFlipping: false, // 是否正在翻牌（防止快速点击）
    gameWon: false, // 游戏是否胜利
    showLevelSelect: false, // 显示关卡选择
    showWinPanel: false, // 通关面板
    totalPairs: 0, // 总对数
    gridCols: 4, // 网格列数
    winTime: '00:00', // 通关耗时
    winMoves: 0, // 通关步数
    gameId: null,
    gameStartTime: null,
    cloudConnected: false
  },

  onLoad(options) {
    const level = options.level ? parseInt(options.level) : 1;
    this.setData({ level });
    this.initGame(level);
  },

  onUnload() {
    console.log('🔄 翻牌游戏页面卸载');
    this.clearTimer();
    
    // 页面卸载时，如果游戏未结束，异步标记为退出（不阻塞页面卸载）
    if (this.data.gameId && !this.data.gameWon) {
      console.log('🎮 页面卸载时游戏未结束，异步标记为退出');
      // 使用setTimeout确保不阻塞页面卸载
      setTimeout(() => {
        this.endGameSession('quit').catch(error => {
          console.error('❌ 页面卸载时结束游戏会话失败:', error);
        });
      }, 0);
    }
  },

  // 初始化游戏
  initGame(level = this.data.level) {
    this.clearTimer();
    const numericLevel = Number(level) || 1;

    // 根据关卡确定卡片数量
    // 关卡1: 4x4 = 16张 (8对)
    // 关卡2: 5x5 = 25张，但25是奇数，所以用24张 (12对)，网格仍为5x5
    // 关卡3: 6x6 = 36张 (18对)
    const cardCounts = { 1: 16, 2: 24, 3: 36 };
    const totalCards = cardCounts[numericLevel] || cardCounts[1];
    const totalPairs = Math.floor(totalCards / 2);
    
    // 生成卡片图片路径
    const imagePaths = [];
    for (let i = 1; i <= totalPairs; i++) {
      let imagePath = '';
      if (numericLevel === 1) {
        imagePath = `/assets/flipcards1/1/flipcards${i}.png`;
      } else if (numericLevel === 2) {
        // 关卡2：第1张是.jpg，其他是.png
        const ext = i === 1 ? '.jpg' : '.png';
        imagePath = `/assets/flipcards1/2/2_flipcards${i}${ext}`;
      } else if (numericLevel === 3) {
        imagePath = `/assets/flipcards1/3/3_flipcards${i}.jpg`;
      }
      // 每张图片出现两次（配对）
      imagePaths.push(imagePath, imagePath);
    }
    
    // 打乱顺序
    this.shuffleArray(imagePaths);
    
    // 创建卡片对象
    const cards = imagePaths.map((image, index) => ({
      id: index,
      image: image,
      isFlipped: false,
      isMatched: false
    }));
    
    // 计算网格列数
    // 关卡1: 4x4 (16张)
    // 关卡2: 4x6 (24张)
    // 关卡3: 6x6 (36张)
    const gridCols = numericLevel === 1 ? 4 : numericLevel === 2 ? 4 : 6;
    
    this.setData({
      level: numericLevel,
      cards,
      flippedCards: [],
      matchedPairs: 0,
      moves: 0,
      time: 0,
      timeFormatted: '00:00',
      gameWon: false,
      showWinPanel: false,
      totalPairs,
      isFlipping: false,
      gridCols,
      winTime: '00:00',
      winMoves: 0,
      gameId: null,
      gameStartTime: null,
      cloudConnected: false
    });
    
    this.startTimer();
    
    // 开始新游戏时调用云函数
    this.startGameSession();
  },

  // 开始游戏会话
  async startGameSession() {
    try {
      console.log('🎮 开始翻牌游戏会话...');
      const result = await cloudApi.game.start('flipcard');
      
      if (result.success) {
        console.log('✅ 游戏会话创建成功:', result.data);
        this.setData({
          gameId: result.data.gameId,
          gameStartTime: new Date(),
          cloudConnected: true
        });
      } else {
        console.log('❌ 游戏会话创建失败:', result.message);
        // 即使云端失败，游戏仍可继续
        this.setData({
          gameStartTime: new Date(),
          cloudConnected: false
        });
      }
    } catch (error) {
      console.error('❌ 开始游戏会话异常:', error);
      this.setData({
        gameStartTime: new Date(),
        cloudConnected: false
      });
    }
  },

  // 结束游戏会话
  async endGameSession(result = 'completed') {
    if (!this.data.gameId || !this.data.gameStartTime) {
      console.log('⚠️ 没有有效的游戏会话，跳过云端保存');
      return;
    }

    try {
      const duration = Math.floor((new Date() - this.data.gameStartTime) / 1000);
      // 翻牌游戏的分数计算：基础分数 + 时间奖励 + 关卡奖励
      const baseScore = this.data.totalPairs * 10;
      const timeBonus = Math.max(0, 300 - this.data.time); // 5分钟内完成有时间奖励
      const levelBonus = this.data.level * 50;
      const movesPenalty = Math.max(0, this.data.moves - this.data.totalPairs * 2) * 2; // 超过最少步数的惩罚
      const finalScore = Math.max(0, baseScore + timeBonus + levelBonus - movesPenalty);
      
      console.log('🎮 结束翻牌游戏会话...', {
        gameId: this.data.gameId,
        score: finalScore,
        duration,
        result,
        level: this.data.level,
        moves: this.data.moves
      });

      // 显示保存中提示
      wx.showLoading({
        title: '保存游戏数据...',
        mask: true
      });

      const endResult = await cloudApi.game.end(
        this.data.gameId,
        finalScore,
        duration,
        result
      );
      
      wx.hideLoading();
      
      if (endResult.success) {
        console.log('✅ 游戏数据保存成功:', endResult.data);
        
        // 显示奖励信息（如果有）
        if (endResult.data.rewards) {
          const rewards = endResult.data.rewards;
          console.log('🎁 获得奖励:', rewards);
          
          // 使用积分同步工具更新积分
          if (rewards.userExp) {
            const oldPoints = PointsSync.getCurrentPoints()
            const newPoints = PointsSync.updateLocalPoints(rewards.userExp)
            PointsSync.showPointsChange(oldPoints, newPoints, '游戏奖励')
          }
        }
        
      } else {
        console.log('❌ 游戏数据保存失败:', endResult.message);
        wx.showToast({
          title: '数据保存失败',
          icon: 'none',
          duration: 2000
        });
      }
    } catch (error) {
      console.error('❌ 结束游戏会话异常:', error);
      wx.hideLoading();
      wx.showToast({
        title: '网络异常，数据未保存',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 打乱数组
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  },

  // 开始计时
  startTimer() {
    this.data.timer = setInterval(() => {
      const newTime = this.data.time + 1;
      this.setData({
        time: newTime,
        timeFormatted: this.formatTime(newTime)
      });
    }, 1000);
  },

  // 清除计时器
  clearTimer() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
      this.data.timer = null;
    }
  },

  // 点击卡片
  onCardTap(e) {
    if (this.data.isFlipping || this.data.gameWon) return;
    
    const index = e.currentTarget.dataset.index;
    const card = this.data.cards[index];
    
    // 如果卡片已翻开或已匹配，忽略
    if (card.isFlipped || card.isMatched) return;
    
    // 如果已经翻开了两张，忽略
    if (this.data.flippedCards.length >= 2) return;
    
    // 翻开卡片
    const cards = this.data.cards;
    cards[index].isFlipped = true;
    const flippedCards = [...this.data.flippedCards, index];
    
    this.setData({
      cards,
      flippedCards
    });
    
    // 如果翻开了两张，检查是否匹配
    if (flippedCards.length === 2) {
      this.setData({ isFlipping: true, moves: this.data.moves + 1 });
      this.checkMatch(flippedCards);
    }
  },

  // 检查匹配
  checkMatch(flippedCards) {
    const [index1, index2] = flippedCards;
    const card1 = this.data.cards[index1];
    const card2 = this.data.cards[index2];
    
    setTimeout(() => {
      if (card1.image === card2.image) {
        // 匹配成功
        const cards = this.data.cards;
        cards[index1].isMatched = true;
        cards[index2].isMatched = true;
        
        const matchedPairs = this.data.matchedPairs + 1;
        
        this.setData({
          cards,
          flippedCards: [],
          matchedPairs,
          isFlipping: false
        });
        
        // 检查是否完成游戏
        if (matchedPairs === this.data.totalPairs) {
          this.winGame();
        }
      } else {
        // 匹配失败，翻回去
        const cards = this.data.cards;
        cards[index1].isFlipped = false;
        cards[index2].isFlipped = false;
        
        this.setData({
          cards,
          flippedCards: [],
          isFlipping: false
        });
      }
    }, 1000);
  },

  // 游戏胜利
  winGame() {
    this.clearTimer();
    const winTime = this.formatTime(this.data.time);
    this.setData({
      gameWon: true,
      showWinPanel: true,
      winTime,
      winMoves: this.data.moves
    });
    
    // 游戏胜利时保存数据到云端
    this.endGameSession('completed');
  },

  // 格式化时间
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  // 重新开始
  onRestart() {
    // 如果当前游戏未结束，标记为退出
    if (this.data.gameId && !this.data.gameWon) {
      this.endGameSession('quit');
    }
    this.initGame(this.data.level);
  },

  // 下一关
  onNextLevel() {
    // 当前游戏已完成，开始下一关
    if (this.data.level >= 3) {
      this.onRestart();
      return;
    }
    const nextLevel = this.data.level + 1;
    this.initGame(nextLevel);
  },

  // 返回游戏列表 / 游戏中心
  onBackToMenu() {
    console.log('🔙 翻牌游戏 - 返回游戏中心');
    
    // 如果游戏未结束，异步标记为退出（不阻塞返回操作）
    if (this.data.gameId && !this.data.gameWon) {
      console.log('🎮 游戏未结束，异步标记为退出');
      // 异步执行，不等待结果
      this.endGameSession('quit').catch(error => {
        console.error('❌ 结束游戏会话失败:', error);
      });
    }
    
    // 检查页面栈，如果是从loading页面跳转来的，直接跳转到游戏页面
    const pages = getCurrentPages()
    console.log('📚 当前页面栈:', pages.map(p => p.route));
    
    if (pages.length >= 2) {
      const prevPage = pages[pages.length - 2]
      console.log('📄 上一页面:', prevPage.route);
      
      if (prevPage.route === 'pages/loading/index') {
        console.log('✅ 检测到从loading页面跳转来，直接跳转到游戏页面');
        // 从loading页面跳转来的，直接跳转到游戏页面
        wx.switchTab({
          url: '/pages/game/index',
          success: () => {
            console.log('✅ 成功跳转到游戏页面');
          },
          fail: (err) => {
            console.error('❌ 跳转到游戏页面失败:', err);
          }
        })
        return
      }
    }
    
    console.log('🔄 使用正常返回逻辑');
    // 正常返回
    wx.navigateBack({
      success: () => {
        console.log('✅ 正常返回成功');
      },
      fail: (err) => {
        console.error('❌ 正常返回失败:', err);
      }
    })
  },

  // 选择关卡
  onSelectLevel(e) {
    const level = Number(e.currentTarget.dataset.level);
    if (!level) return;
    
    // 如果当前游戏未结束，标记为退出
    if (this.data.gameId && !this.data.gameWon) {
      this.endGameSession('quit');
    }
    
    this.setData({ showLevelSelect: false });
    this.initGame(level);
  },

  // 显示关卡选择
  onShowLevelSelect() {
    this.setData({ showLevelSelect: true });
  },

  // 关闭关卡选择
  onCloseLevelSelect() {
    this.setData({ showLevelSelect: false });
  },

  // 快速切换到上一关
  onPrevLevel() {
    if (this.data.level <= 1) {
      wx.showToast({
        title: '已经是第一关了',
        icon: 'none',
        duration: 1500
      });
      return;
    }
    
    // 如果当前游戏未结束，标记为退出
    if (this.data.gameId && !this.data.gameWon) {
      this.endGameSession('quit');
    }
    
    const prevLevel = this.data.level - 1;
    this.initGame(prevLevel);
  },

  // 快速切换到下一关
  onNextLevelQuick() {
    if (this.data.level >= 3) {
      wx.showToast({
        title: '已经是最后一关了',
        icon: 'none',
        duration: 1500
      });
      return;
    }
    
    // 如果当前游戏未结束，标记为退出
    if (this.data.gameId && !this.data.gameWon) {
      this.endGameSession('quit');
    }
    
    const nextLevel = this.data.level + 1;
    this.initGame(nextLevel);
  }
});
