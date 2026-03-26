const loadingNav = require('../../utils/loadingNavigator');
const { cloudApi } = require('../../utils/cloudApi');
const PointsSync = require('../../utils/pointsSync');

Page({
  data: {
    score: 0,
    bestScore: 0,
    gameBoard: [],
    boardSize: 4,
    gameOver: false,
    gameWon: false,
    showModal: false,
    modalTitle: '',
    modalMessage: '',
    touchStartX: 0,
    touchStartY: 0,
    gameId: null,
    gameStartTime: null,
    cloudConnected: false,
    slidingDirection: null
  },

  onLoad() {
    // 从本地存储读取最高分
    const bestScore = wx.getStorageSync('bestScore_2048') || 0;
    this.setData({ bestScore });
    this.initGame();
  },

  onUnload() {
    console.log('🔄 2048游戏页面卸载');
    
    // 页面卸载时，如果游戏未结束，异步标记为退出（不阻塞页面卸载）
    if (this.data.gameId && !this.data.gameOver) {
      console.log('🎮 页面卸载时游戏未结束，异步标记为退出');
      // 使用setTimeout确保不阻塞页面卸载
      setTimeout(() => {
        this.endGameSession('quit').catch(error => {
          console.error('❌ 页面卸载时结束游戏会话失败:', error);
        });
      }, 0);
    }
  },

  initGame() {
    const board = Array(this.data.boardSize).fill(null).map(() => 
      Array(this.data.boardSize).fill(0)
    );
    
    // 初始生成两个数字
    this.addRandomTile(board);
    this.addRandomTile(board);
    
    // 转换数字为带图片路径的对象
    const boardWithImages = board.map(row => 
      row.map(value => ({
        value: value,
        image: value > 0 ? this.getTileImage(value) : '',
        isNew: false,
        isMerged: false
      }))
    );
    
    this.setData({
      gameBoard: boardWithImages,
      score: 0,
      gameOver: false,
      gameWon: false,
      showModal: false,
      gameId: null,
      gameStartTime: null,
      cloudConnected: false,
      slidingDirection: null
    });

    // 初始化新方块位置记录
    this.newTilePosition = null;

    // 开始新游戏时调用云函数
    this.startGameSession();
  },

  // 开始游戏会话
  async startGameSession() {
    try {
      console.log('🎮 开始2048游戏会话...');
      const result = await cloudApi.game.start('2048');
      
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
      console.log('🎮 结束2048游戏会话...', {
        gameId: this.data.gameId,
        score: this.data.score,
        duration,
        result
      });

      // 显示保存中提示
      wx.showLoading({
        title: '保存游戏数据...',
        mask: true
      });

      const endResult = await cloudApi.game.end(
        this.data.gameId,
        this.data.score,
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

  // 在空位置随机添加2或4
  addRandomTile(board) {
    const emptyCells = [];
    for (let row = 0; row < this.data.boardSize; row++) {
      for (let col = 0; col < this.data.boardSize; col++) {
        const value = typeof board[row][col] === 'object' ? board[row][col].value : board[row][col];
        if (value === 0) {
          emptyCells.push({ row, col });
        }
      }
    }
    
    if (emptyCells.length > 0) {
      const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      const newValue = Math.random() < 0.9 ? 2 : 4;
      
      // 记录新生成的方块位置
      this.newTilePosition = { row: randomCell.row, col: randomCell.col };
      
      if (typeof board[randomCell.row][randomCell.col] === 'object') {
        board[randomCell.row][randomCell.col].value = newValue;
        board[randomCell.row][randomCell.col].image = this.getTileImage(newValue);
      } else {
        board[randomCell.row][randomCell.col] = newValue;
      }
    }
  },

  // 获取数字对应的图片路径
  getTileImage(value) {
    if (value === 0) return '';
    return `/assets/2048game/2048game_${value}.${value === 2048 ? 'png' : 'jpg'}`;
  },

  // 滑动处理 - 上
  onSwipeUp() {
    if (this.data.gameOver) return;
    this.move('up');
  },

  // 滑动处理 - 下
  onSwipeDown() {
    if (this.data.gameOver) return;
    this.move('down');
  },

  // 滑动处理 - 左
  onSwipeLeft() {
    if (this.data.gameOver) return;
    this.move('left');
  },

  // 滑动处理 - 右
  onSwipeRight() {
    if (this.data.gameOver) return;
    this.move('right');
  },

  // 移动逻辑
  move(direction) {
    const board = JSON.parse(JSON.stringify(this.data.gameBoard));
    // 提取数字值
    const values = board.map(row => row.map(cell => typeof cell === 'object' ? cell.value : cell));
    let moved = false;
    let scoreIncrease = 0;

    // 设置滑动方向动画
    this.setData({ slidingDirection: direction });

    if (direction === 'left') {
      for (let row = 0; row < this.data.boardSize; row++) {
        const result = this.moveRowLeft(values[row]);
        values[row] = result.row;
        if (result.moved) moved = true;
        scoreIncrease += result.score;
      }
    } else if (direction === 'right') {
      for (let row = 0; row < this.data.boardSize; row++) {
        const result = this.moveRowRight(values[row]);
        values[row] = result.row;
        if (result.moved) moved = true;
        scoreIncrease += result.score;
      }
    } else if (direction === 'up') {
      for (let col = 0; col < this.data.boardSize; col++) {
        const column = [];
        for (let row = 0; row < this.data.boardSize; row++) {
          column.push(values[row][col]);
        }
        const result = this.moveRowLeft(column);
        if (result.moved) moved = true;
        scoreIncrease += result.score;
        for (let row = 0; row < this.data.boardSize; row++) {
          values[row][col] = result.row[row];
        }
      }
    } else if (direction === 'down') {
      for (let col = 0; col < this.data.boardSize; col++) {
        const column = [];
        for (let row = 0; row < this.data.boardSize; row++) {
          column.push(values[row][col]);
        }
        const result = this.moveRowRight(column);
        if (result.moved) moved = true;
        scoreIncrease += result.score;
        for (let row = 0; row < this.data.boardSize; row++) {
          values[row][col] = result.row[row];
        }
      }
    }

    if (moved) {
      this.addRandomTile(values);
      const newScore = this.data.score + scoreIncrease;
      const bestScore = Math.max(this.data.bestScore, newScore);
      
      // 检查是否获胜
      let hasWon = false;
      if (!this.data.gameWon) {
        for (let row = 0; row < this.data.boardSize; row++) {
          for (let col = 0; col < this.data.boardSize; col++) {
            if (values[row][col] === 2048) {
              hasWon = true;
            }
          }
        }
      }

      // 检查是否游戏结束
      const gameOver = this.checkGameOver(values);

      // 转换数字为带图片路径的对象，并标记新生成的方块
      const boardWithImages = values.map((row, rowIndex) => 
        row.map((value, colIndex) => {
          // 检查是否是新生成的方块
          const isNew = this.newTilePosition && 
                       this.newTilePosition.row === rowIndex && 
                       this.newTilePosition.col === colIndex && 
                       value > 0;
          
          // 检查是否是合并后的方块（值比之前大）
          const oldValue = this.data.gameBoard[rowIndex] && this.data.gameBoard[rowIndex][colIndex] 
                          ? this.data.gameBoard[rowIndex][colIndex].value : 0;
          const isMerged = value > 0 && oldValue > 0 && value > oldValue;
          
          return {
            value: value,
            image: value > 0 ? this.getTileImage(value) : '',
            isNew: isNew,
            isMerged: isMerged
          };
        })
      );

      this.setData({
        gameBoard: boardWithImages,
        score: newScore,
        bestScore: bestScore,
        gameWon: hasWon || this.data.gameWon,
        gameOver: gameOver
      });

      // 保存最高分
      wx.setStorageSync('bestScore_2048', bestScore);

      // 清除动画状态
      setTimeout(() => {
        this.newTilePosition = null; // 清除新方块位置记录
        this.setData({ 
          slidingDirection: null,
          gameBoard: this.data.gameBoard.map(row => 
            row.map(cell => ({
              ...cell,
              isNew: false,
              isMerged: false
            }))
          )
        });
      }, 200);

      // 显示获胜或失败提示
      if (hasWon && !this.data.gameWon) {
        setTimeout(() => {
          this.setData({
            showModal: true,
            modalTitle: '恭喜！',
            modalMessage: '你达到了2048！继续游戏创造更高分数吧！'
          });
        }, 300);
      } else if (gameOver) {
        // 游戏结束时保存数据到云端
        this.endGameSession('completed');
        setTimeout(() => {
          this.setData({
            showModal: true,
            modalTitle: '游戏结束',
            modalMessage: `游戏结束！你的得分：${newScore}`
          });
        }, 300);
      }
    } else {
      // 如果没有移动，立即清除滑动方向
      setTimeout(() => {
        this.setData({ slidingDirection: null });
      }, 100);
    }
  },

  // 向左移动一行
  moveRowLeft(row) {
    const filtered = row.filter(val => val !== 0);
    const merged = [];
    let moved = false;
    let score = 0;

    for (let i = 0; i < filtered.length; i++) {
      if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
        const mergedValue = filtered[i] * 2;
        merged.push(mergedValue);
        score += mergedValue;
        i++; // 跳过下一个元素
        moved = true;
      } else {
        merged.push(filtered[i]);
      }
    }

    while (merged.length < this.data.boardSize) {
      merged.push(0);
    }

    // 检查是否有移动
    for (let i = 0; i < row.length; i++) {
      if (row[i] !== merged[i]) {
        moved = true;
        break;
      }
    }

    return { row: merged, moved, score };
  },

  // 向右移动一行（翻转后向左移动，再翻转回来）
  moveRowRight(row) {
    const reversed = [...row].reverse();
    const result = this.moveRowLeft(reversed);
    return {
      row: result.row.reverse(),
      moved: result.moved,
      score: result.score
    };
  },

  // 检查游戏是否结束
  checkGameOver(board) {
    // 检查是否有空格
    for (let row = 0; row < this.data.boardSize; row++) {
      for (let col = 0; col < this.data.boardSize; col++) {
        if (board[row][col] === 0) {
          return false;
        }
      }
    }

    // 检查是否有可合并的相邻格子
    for (let row = 0; row < this.data.boardSize; row++) {
      for (let col = 0; col < this.data.boardSize; col++) {
        const current = board[row][col];
        // 检查右边
        if (col < this.data.boardSize - 1 && board[row][col + 1] === current) {
          return false;
        }
        // 检查下边
        if (row < this.data.boardSize - 1 && board[row + 1][col] === current) {
          return false;
        }
      }
    }

    return true;
  },

  // 重新开始游戏
  onRestart() {
    // 如果当前游戏未结束，标记为退出
    if (this.data.gameId && !this.data.gameOver) {
      this.endGameSession('quit');
    }
    this.setData({ showModal: false });
    this.initGame();
  },

  // 继续游戏（获胜后）
  onContinue() {
    this.setData({ 
      showModal: false,
      gameWon: true // 标记已经显示过获胜提示
    });
  },

  // 返回游戏中心
  onBackToGameCenter() {
    console.log('🔙 2048游戏 - 返回游戏中心');
    
    // 如果游戏未结束，异步标记为退出（不阻塞返回操作）
    if (this.data.gameId && !this.data.gameOver) {
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

  // 触摸开始
  onTouchStart(e) {
    if (this.data.gameOver) return;
    if (!e.touches || e.touches.length === 0) return;
    
    const touch = e.touches[0];
    this.setData({
      touchStartX: touch.clientX || touch.x || 0,
      touchStartY: touch.clientY || touch.y || 0
    });
  },

  // 触摸移动
  onTouchMove(e) {
    // 防止页面滚动
    // 不需要做其他处理，坐标在 touchend 时计算
  },

  // 触摸结束
  onTouchEnd(e) {
    if (this.data.gameOver) {
      this.setData({
        touchStartX: 0,
        touchStartY: 0
      });
      return;
    }
    
    if (!this.data.touchStartX || !this.data.touchStartY) {
      this.setData({
        touchStartX: 0,
        touchStartY: 0
      });
      return;
    }
    
    if (!e.changedTouches || e.changedTouches.length === 0) {
      this.setData({
        touchStartX: 0,
        touchStartY: 0
      });
      return;
    }
    
    const touch = e.changedTouches[0];
    const endX = touch.clientX || touch.x || 0;
    const endY = touch.clientY || touch.y || 0;
    const deltaX = endX - this.data.touchStartX;
    const deltaY = endY - this.data.touchStartY;
    const minSwipeDistance = 30; // 最小滑动距离

    // 判断滑动方向
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // 水平滑动
      if (Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0) {
          this.onSwipeRight();
        } else {
          this.onSwipeLeft();
        }
      }
    } else {
      // 垂直滑动
      if (Math.abs(deltaY) > minSwipeDistance) {
        if (deltaY > 0) {
          this.onSwipeDown();
        } else {
          this.onSwipeUp();
        }
      }
    }

    this.setData({
      touchStartX: 0,
      touchStartY: 0
    });
  }
})