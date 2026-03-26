// pages/points-store/points-store.js
Page({
  data: {
    userPoints: 0,
    selectedCategory: 'food', // food, toys
    fromPage: '', // 记录来源页面
    pageTitle: '积分商店', // 页面标题
    categories: [
      { value: 'food', label: '食物', icon: '🍖' },
      { value: 'toys', label: '玩具', icon: '🎾' }
    ],
    storeItems: {
      food: [
        {
          id: 'food_free_1',
          name: '清水',
          description: '干净的清水，基础的生存需求',
          price: 0,
          effect: '饥饿 -5',
          hungerReduction: 5,
          moodIncrease: 1,
          icon: '💧',
          image: '/images/food/water.png',
          category: 'food'
        },
        {
          id: 'food_free_2',
          name: '小饼干',
          description: '简单的小饼干，聊胜于无',
          price: 0,
          effect: '饥饿 -8, 心情 +3',
          hungerReduction: 8,
          moodIncrease: 3,
          icon: '🍪',
          image: '/images/food/cookie.png',
          category: 'food'
        },
        {
          id: 'food_5',
          name: '胡萝卜',
          description: '新鲜的胡萝卜，补充维生素',
          price: 20,
          effect: '饥饿 -10, 心情 +5',
          hungerReduction: 10,
          moodIncrease: 5,
          icon: '🥕',
          image: '/images/food/carrot.png',
          category: 'food'
        },
        {
          id: 'food_6',
          name: '牛奶',
          description: '新鲜的牛奶，补充钙质',
          price: 25,
          effect: '饥饿 -12, 心情 +10',
          hungerReduction: 12,
          moodIncrease: 10,
          icon: '🥛',
          image: '/images/food/milk.png',
          category: 'food'
        },
        {
          id: 'food_2',
          name: '美味骨头',
          description: '宠物最爱的美味骨头，增加心情值',
          price: 30,
          effect: '饥饿 -15, 心情 +15',
          hungerReduction: 15,
          moodIncrease: 15,
          icon: '🦴',
          image: '/images/food/bone.png',
          category: 'food'
        },
        {
          id: 'food_3',
          name: '营养罐头',
          description: '精选食材制作的营养罐头',
          price: 40,
          effect: '饥饿 -25',
          hungerReduction: 25,
          moodIncrease: 3,
          icon: '🥫',
          image: '/images/food/canned-food.png',
          category: 'food'
        },
        {
          id: 'food_1',
          name: '高级猫粮',
          description: '营养丰富的高级猫粮，减少饥饿值',
          price: 50,
          effect: '饥饿 -30',
          hungerReduction: 30,
          moodIncrease: 5,
          icon: '🥩',
          image: '/images/food/premium-dog-food.png',
          category: 'food'
        },
        {
          id: 'food_4',
          name: '新鲜鱼肉',
          description: '新鲜的鱼肉，富含蛋白质',
          price: 60,
          effect: '饥饿 -35, 心情 +10',
          hungerReduction: 35,
          moodIncrease: 10,
          icon: '🐟',
          image: '/images/food/fish.png',
          category: 'food'
        }
      ],
      toys: [
        {
          id: 'toy_free_1',
          name: '纸团',
          description: '简单的纸团，免费的基础玩具',
          price: 0,
          effect: '心情 +5',
          moodIncrease: 5,
          icon: '📄',
          image: '/images/toys/paper-ball.png',
          category: 'toys'
        },
        {
          id: 'toy_free_2',
          name: '树枝',
          description: '天然的树枝，环保又有趣',
          price: 0,
          effect: '心情 +8',
          moodIncrease: 8,
          icon: '🌿',
          image: '/images/toys/stick.png',
          category: 'toys'
        },
        {
          id: 'toy_4',
          name: '逗猫棒',
          description: '互动性强的逗猫棒，增进感情',
          price: 40,
          effect: '心情 +20',
          moodIncrease: 20,
          icon: '🪶',
          image: '/images/toys/feather-wand.png',
          category: 'toys'
        },
        {
          id: 'toy_3',
          name: '毛绒玩具',
          description: '柔软舒适的毛绒玩具，让宠物感到安心',
          price: 60,
          effect: '心情 +25',
          moodIncrease: 25,
          icon: '🧸',
          image: '/images/toys/plush.png',
          category: 'toys'
        },
        {
          id: 'toy_1',
          name: '网球',
          description: '经典的宠物玩具，增加活力',
          price: 80,
          effect: '心情 +30',
          moodIncrease: 30,
          icon: '🎾',
          image: '/assets/icon/网球.png',
          category: 'toys'
        },
        {
          id: 'toy_2',
          name: '飞盘',
          description: '户外运动必备，提升宠物敏捷',
          price: 100,
          effect: '心情 +40',
          moodIncrease: 40,
          icon: '🥏',
          image: '/images/toys/frisbee.png',
          category: 'toys'
        },
        {
          id: 'toy_5',
          name: '智能球',
          description: '高科技智能玩具球，自动滚动',
          price: 120,
          effect: '心情 +50',
          moodIncrease: 50,
          icon: '⚽',
          image: '/images/toys/smart-ball.png',
          category: 'toys'
        }
      ]
    },
    loading: false,
    petStatus: null, // 宠物状态信息
    // 数量选择弹窗相关
    showQuantityModal: false,
    selectedItem: null,
    selectedQuantity: 1,
    maxQuantity: 1,
    previewHunger: 0, // 预览的饥饿值
    // 库存系统
    inventory: {}, // 用户库存 {itemId: quantity}
    showInventoryModal: false, // 显示库存选择弹窗
    inventoryItems: [], // 当前分类的库存物品
    previewTotalCost: 0 // 预览总费用
  },

  onLoad(options) {
    // 检查URL参数
    if (options) {
      if (options.category) {
        this.setData({ selectedCategory: options.category });
      }
      if (options.from) {
        this.setData({ fromPage: options.from });
        
        // 如果来自宠物页面，加载宠物状态
        if (options.from === 'pet') {
          this.loadPetStatus();
        }
      }
    }
    this.loadUserPoints();
    this.loadInventory(); // 加载库存
    this.updatePageTitle();
    this.updateInventoryItems(); // 更新库存物品列表
  },

  // 更新页面标题
  updatePageTitle() {
    if (this.data.fromPage === 'pet') {
      this.setData({ pageTitle: '宠物用品' });
    } else {
      this.setData({ pageTitle: '积分商店' });
    }
  },

  onShow() {
    this.loadUserPoints();
    this.loadInventory(); // 重新加载库存
    // 如果来自宠物页面，重新加载宠物状态
    if (this.data.fromPage === 'pet') {
      this.loadPetStatus();
    }
    this.updateInventoryItems(); // 更新库存物品列表
  },

  // 加载用户积分
  loadUserPoints() {
    try {
      const points = wx.getStorageSync('userPoints') || 1250;
      this.setData({ userPoints: points });
    } catch (error) {
      console.error('❌ 用户积分加载异常:', error);
      this.setData({ userPoints: 1250 });
    }
  },

  // 加载宠物状态
  loadPetStatus() {
    try {
      const petStatus = wx.getStorageSync('petStatus');
      console.log('📖 加载宠物状态:', petStatus);
      if (petStatus) {
        this.setData({ petStatus });
        console.log('✅ 宠物状态已设置:', this.data.petStatus);
      } else {
        console.log('⚠️ 没有找到宠物状态，使用默认值');
        // 设置默认状态
        const defaultStatus = { hunger: 50, mood: 80 };
        this.setData({ petStatus: defaultStatus });
      }
    } catch (error) {
      console.error('❌ 加载宠物状态失败:', error);
      // 设置默认状态
      const defaultStatus = { hunger: 50, mood: 80 };
      this.setData({ petStatus: defaultStatus });
    }
  },

  // 保存积分
  saveUserPoints() {
    try {
      wx.setStorageSync('userPoints', this.data.userPoints);
    } catch (error) {
      console.error('❌ 积分保存异常:', error);
    }
  },

  // 加载库存
  loadInventory() {
    try {
      const inventory = wx.getStorageSync('userInventory') || {};
      this.setData({ inventory });
      console.log('📦 加载库存:', inventory);
    } catch (error) {
      console.error('❌ 加载库存失败:', error);
      this.setData({ inventory: {} });
    }
  },

  // 保存库存
  saveInventory() {
    try {
      wx.setStorageSync('userInventory', this.data.inventory);
      console.log('💾 库存已保存:', this.data.inventory);
    } catch (error) {
      console.error('❌ 保存库存失败:', error);
    }
  },

  // 添加物品到库存
  addToInventory(itemId, quantity = 1) {
    const inventory = { ...this.data.inventory };
    inventory[itemId] = (inventory[itemId] || 0) + quantity;
    this.setData({ inventory });
    this.saveInventory();
    console.log(`📦 添加到库存: ${itemId} x${quantity}, 总数: ${inventory[itemId]}`);
  },

  // 从库存中移除物品
  removeFromInventory(itemId, quantity = 1) {
    const inventory = { ...this.data.inventory };
    if (inventory[itemId]) {
      inventory[itemId] = Math.max(0, inventory[itemId] - quantity);
      if (inventory[itemId] === 0) {
        delete inventory[itemId];
      }
      this.setData({ inventory });
      this.saveInventory();
      console.log(`📦 从库存移除: ${itemId} x${quantity}, 剩余: ${inventory[itemId] || 0}`);
    }
  },

  // 更新库存物品列表
  updateInventoryItems() {
    const category = this.data.selectedCategory;
    const inventory = this.data.inventory;
    const storeItems = this.data.storeItems[category] || [];
    
    const inventoryItems = storeItems.filter(item => inventory[item.id] > 0).map(item => ({
      ...item,
      inventoryCount: inventory[item.id]
    }));
    
    this.setData({ inventoryItems });
    console.log('📦 更新库存物品列表:', inventoryItems);
  },

  // 切换分类
  onCategoryChange(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({ selectedCategory: category });
    this.updatePageTitle();
    this.updateInventoryItems(); // 更新库存物品列表
  },

  // 购买物品
  onBuyItem(e) {
    const item = e.currentTarget.dataset.item;
    console.log('🛒 点击购买商品:', item);
    console.log('🐾 来源页面:', this.data.fromPage);
    
    // 如果来自宠物页面，显示库存选择或数量选择
    if (this.data.fromPage === 'pet') {
      if (item.category === 'food') {
        // 检查是否有库存
        const inventoryCount = this.data.inventory[item.id] || 0;
        if (inventoryCount > 0) {
          // 有库存，显示库存使用选择
          this.showInventorySelector(item);
        } else {
          // 没有库存，显示购买并使用选择
          this.showQuantitySelector(item);
        }
      } else {
        // 玩具类直接处理
        this.handleDirectPurchase(item);
      }
      return;
    }
    
    // 普通购买模式 - 也支持数量选择
    if (item.price > 0) {
      // 付费商品显示数量选择器
      this.showPurchaseQuantitySelector(item);
    } else {
      // 免费商品直接处理
      this.handleDirectPurchase(item);
    }
  },

  // 显示购买数量选择器（普通购买模式）
  showPurchaseQuantitySelector(item) {
    console.log('🔢 显示购买数量选择器:', item.name);
    
    const userPoints = this.data.userPoints;
    const itemPrice = item.price;
    
    console.log('📊 购买状态:', {
      itemName: item.name,
      itemPrice,
      userPoints
    });
    
    // 检查是否有足够的积分
    if (itemPrice > userPoints) {
      wx.showModal({
        title: '积分不足',
        content: `购买 ${item.name} 需要 ${itemPrice} 积分，但你只有 ${userPoints} 积分。\n\n建议：去玩游戏赚取更多积分。`,
        showCancel: false,
        confirmText: '知道了'
      });
      return;
    }
    
    // 计算最大可购买数量（基于积分）
    const maxQuantityByPoints = Math.floor(userPoints / itemPrice);
    
    // 最多购买10个
    const maxQuantity = Math.min(maxQuantityByPoints, 10);
    
    console.log('🔢 数量计算:', {
      userPoints,
      itemPrice,
      maxQuantityByPoints,
      maxQuantity
    });

    if (maxQuantity < 1) {
      console.log('❌ 没有可选数量');
      wx.showModal({
        title: '无法购买',
        content: `当前无法购买 ${item.name}：\n\n• 你的积分：${userPoints}\n• 商品价格：${itemPrice}\n\n建议：去玩游戏赚取更多积分。`,
        showCancel: false,
        confirmText: '知道了'
      });
      return;
    }

    console.log('📱 显示购买数量选择弹窗');

    // 显示数量选择弹窗
    this.setData({
      showQuantityModal: true,
      selectedItem: item,
      selectedQuantity: 1,
      maxQuantity: maxQuantity
    });
    
    // 更新预览值（普通购买模式不需要预览饥饿值）
    this.updatePurchasePreviewValues();
  },

  // 更新购买预览值
  updatePurchasePreviewValues() {
    if (!this.data.selectedItem) return;
    
    const totalCost = this.data.selectedItem.price * this.data.selectedQuantity;
    
    this.setData({
      previewTotalCost: totalCost
    });
  },

  // 显示库存选择器
  showInventorySelector(item) {
    const inventoryCount = this.data.inventory[item.id] || 0;
    const petStatus = this.data.petStatus || { hunger: 50 };
    const currentHunger = petStatus.hunger;
    const hungerReduction = item.hungerReduction || 0;
    
    console.log('📦 显示库存选择器:', {
      itemName: item.name,
      inventoryCount,
      currentHunger,
      hungerReduction
    });
    
    // 检查是否有足够的饥饿值
    if (hungerReduction > 0 && currentHunger < hungerReduction) {
      wx.showModal({
        title: '无法喂食',
        content: `宠物当前饥饿值为 ${currentHunger}，而 ${item.name} 需要至少 ${hungerReduction} 点饥饿值才能喂食。\n\n建议：等宠物更饿一些再来喂食。`,
        showCancel: false,
        confirmText: '知道了'
      });
      return;
    }
    
    // 计算最大可使用数量
    const maxUseQuantity = hungerReduction > 0 ? Math.floor(currentHunger / hungerReduction) : inventoryCount;
    const maxQuantity = Math.min(inventoryCount, maxUseQuantity, 6);
    
    if (maxQuantity < 1) {
      wx.showModal({
        title: '无法使用',
        content: `当前无法使用 ${item.name}：\n\n• 库存数量：${inventoryCount}\n• 宠物饥饿值：${currentHunger}\n• 需要饥饿值：${hungerReduction}`,
        showCancel: false,
        confirmText: '知道了'
      });
      return;
    }
    
    // 显示库存使用弹窗
    this.setData({
      showInventoryModal: true,
      selectedItem: item,
      selectedQuantity: 1,
      maxQuantity: maxQuantity
    });
    
    this.updatePreviewValues();
  },

  // 显示数量选择器
  showQuantitySelector(item) {
    console.log('🔢 开始显示数量选择器:', item.name);
    
    const petStatus = this.data.petStatus || { hunger: 50 };
    const currentHunger = petStatus.hunger;
    const hungerReduction = item.hungerReduction || 0;
    
    console.log('📊 当前状态:', {
      petStatus,
      currentHunger,
      hungerReduction,
      userPoints: this.data.userPoints
    });
    
    // 检查是否有足够的饥饿值
    if (hungerReduction > 0 && currentHunger < hungerReduction) {
      console.log('❌ 饥饿值不足');
      wx.showModal({
        title: '无法喂食',
        content: `宠物当前饥饿值为 ${currentHunger}，而 ${item.name} 需要至少 ${hungerReduction} 点饥饿值才能喂食。\n\n建议：等宠物更饿一些再来喂食，或者选择饥饿值需求更低的食物。`,
        showCancel: false,
        confirmText: '知道了'
      });
      return;
    }
    
    // 计算最大可喂食数量（基于饥饿值）
    const maxQuantityByHunger = hungerReduction > 0 ? Math.floor(currentHunger / hungerReduction) : 1;
    
    // 计算最大可购买数量（基于积分，免费商品不限制）
    const maxQuantityByPoints = item.price > 0 ? Math.floor(this.data.userPoints / item.price) : 99;
    
    // 取两者最小值，但至少为1，最多为6
    const maxQuantity = Math.max(1, Math.min(maxQuantityByHunger, maxQuantityByPoints, 6));
    
    console.log('🔢 数量计算:', {
      currentHunger,
      hungerReduction,
      maxQuantityByHunger,
      maxQuantityByPoints,
      maxQuantity
    });

    // 如果没有可选数量，显示提示
    if (maxQuantity < 1) {
      console.log('❌ 没有可选数量');
      wx.showModal({
        title: '无法喂食',
        content: `当前无法喂食 ${item.name}：\n\n• 宠物饥饿值：${currentHunger}\n• 需要饥饿值：${hungerReduction}\n• 你的积分：${this.data.userPoints}\n• 商品价格：${item.price}\n\n建议：等宠物更饿或获得更多积分。`,
        showCancel: false,
        confirmText: '知道了'
      });
      return;
    }

    console.log('📱 显示数量选择弹窗');

    // 显示数量选择弹窗
    this.setData({
      showQuantityModal: true,
      selectedItem: item,
      selectedQuantity: 1,
      maxQuantity: maxQuantity
    });
    
    // 更新预览值
    this.updatePreviewValues();
  },

  // 更新预览值
  updatePreviewValues() {
    if (!this.data.selectedItem || !this.data.petStatus) return;
    
    const hungerReduction = this.data.selectedItem.hungerReduction || 0;
    const totalReduction = hungerReduction * this.data.selectedQuantity;
    const newHunger = Math.max(0, this.data.petStatus.hunger - totalReduction);
    
    this.setData({
      previewHunger: newHunger
    });
  },

  // 隐藏库存选择弹窗
  hideInventoryModal() {
    this.setData({
      showInventoryModal: false,
      selectedItem: null,
      selectedQuantity: 1,
      maxQuantity: 1,
      previewHunger: 0
    });
  },

  // 确认库存使用
  confirmInventoryUse() {
    const item = this.data.selectedItem;
    const quantity = this.data.selectedQuantity;
    
    console.log('✅ 用户确认使用库存:', item.name, 'x', quantity);
    
    // 隐藏弹窗
    this.hideInventoryModal();
    
    // 执行库存使用
    this.useInventoryItem(item, quantity);
  },

  // 使用库存物品
  useInventoryItem(item, quantity) {
    console.log('📦 使用库存物品:', item.name, 'x', quantity);
    
    try {
      // 从库存中移除物品
      this.removeFromInventory(item.id, quantity);
      
      // 应用效果到宠物
      this.applyInventoryFeedingEffect(item, quantity);
      
      // 更新库存物品列表
      this.updateInventoryItems();
      
    } catch (error) {
      console.error('❌ 使用库存物品失败:', error);
      wx.showToast({
        title: '使用失败，请重试',
        icon: 'none'
      });
    }
  },

  // 应用库存喂食效果
  applyInventoryFeedingEffect(item, quantity) {
    console.log('🍖 开始应用库存喂食效果:', item.name, 'x', quantity);
    
    try {
      // 获取当前宠物状态
      const savedStatus = wx.getStorageSync('petStatus') || { mood: 80, hunger: 50 };
      console.log('📊 当前宠物状态:', savedStatus);
      
      // 计算总效果
      const totalHungerReduction = (item.hungerReduction || 0) * quantity;
      const totalMoodIncrease = (item.moodIncrease || 0) * quantity;
      
      // 计算新的状态值
      const newHunger = Math.max(0, savedStatus.hunger - totalHungerReduction);
      const newMood = Math.min(100, savedStatus.mood + totalMoodIncrease);
      
      console.log('📈 状态变化:', {
        quantity,
        hunger: `${savedStatus.hunger} → ${newHunger}`,
        mood: `${savedStatus.mood} → ${newMood}`,
        totalHungerReduction,
        totalMoodIncrease
      });
      
      // 保存新状态
      const newStatus = {
        mood: Math.round(newMood),
        hunger: Math.round(newHunger),
        lastUpdateTime: Date.now()
      };
      
      wx.setStorageSync('petStatus', newStatus);
      console.log('✅ 新状态已保存');
      
      // 设置喂食效果标记
      const feedingEffect = {
        foodName: item.name,
        quantity: quantity,
        timestamp: Date.now()
      };
      wx.setStorageSync('feedingEffect', feedingEffect);
      
      // 显示使用效果
      setTimeout(() => {
        wx.showModal({
          title: '喂食成功！',
          content: `已使用库存中的 ${quantity}个 ${item.name}！\n\n饥饿值：${savedStatus.hunger} → ${newHunger}\n心情值：${savedStatus.mood} → ${newMood}`,
          showCancel: false,
          confirmText: '返回宠物',
          success: (res) => {
            if (res.confirm) {
              // 直接跳转到宠物页面
              wx.switchTab({
                url: '/pages/pet/index'
              })
            }
          }
        });
      }, 1500);
      
    } catch (error) {
      console.error('❌ 应用库存喂食效果失败:', error);
      wx.showToast({
        title: '喂食失败，请重试',
        icon: 'none'
      });
    }
  },

  // 减少数量
  decreaseQuantity() {
    console.log('🔽 减少数量，当前:', this.data.selectedQuantity);
    if (this.data.selectedQuantity > 1) {
      this.setData({
        selectedQuantity: this.data.selectedQuantity - 1
      });
      console.log('✅ 数量已减少到:', this.data.selectedQuantity - 1);
      // 更新预览值
      this.updatePreviewValues();
      this.updatePurchasePreviewValues();
    } else {
      console.log('⚠️ 已达到最小数量');
    }
  },

  // 增加数量
  increaseQuantity() {
    console.log('🔼 增加数量，当前:', this.data.selectedQuantity, '最大:', this.data.maxQuantity);
    if (this.data.selectedQuantity < this.data.maxQuantity) {
      this.setData({
        selectedQuantity: this.data.selectedQuantity + 1
      });
      console.log('✅ 数量已增加到:', this.data.selectedQuantity + 1);
      // 更新预览值
      this.updatePreviewValues();
      this.updatePurchasePreviewValues();
    } else {
      console.log('⚠️ 已达到最大数量');
    }
  },

  // 确认数量选择
  confirmQuantitySelection() {
    const item = this.data.selectedItem;
    const quantity = this.data.selectedQuantity;
    
    console.log('✅ 用户确认选择数量:', item.name, 'x', quantity);
    console.log('🐾 来源页面:', this.data.fromPage);
    
    // 隐藏弹窗
    this.hideQuantityModal();
    
    // 根据来源页面执行不同逻辑
    if (this.data.fromPage === 'pet') {
      // 宠物页面：购买并使用
      const totalCost = item.price * quantity;
      const totalHungerReduction = item.hungerReduction * quantity;
      const newHunger = Math.max(0, this.data.petStatus.hunger - totalHungerReduction);

      const quantityOption = {
        quantity,
        totalCost,
        totalHungerReduction,
        newHunger
      };

      this.purchaseItemWithQuantity(item, quantityOption);
    } else {
      // 普通购买：购买并添加到库存
      this.purchaseMultipleItems(item, quantity);
    }
  },

  // 购买多个物品（普通购买模式）
  purchaseMultipleItems(item, quantity) {
    console.log('🛒 购买多个物品:', item.name, 'x', quantity);
    
    const totalCost = item.price * quantity;
    
    // 检查积分是否足够
    if (totalCost > this.data.userPoints) {
      wx.showToast({
        title: '积分不足',
        icon: 'none'
      });
      return;
    }
    
    try {
      // 扣除积分
      const newPoints = this.data.userPoints - totalCost;
      this.setData({ userPoints: newPoints });
      this.saveUserPoints();
      console.log('💰 扣除积分:', totalCost, '剩余:', newPoints);
      
      // 添加到库存
      this.addToInventory(item.id, quantity);
      
      // 显示购买成功
      wx.showToast({
        title: `购买成功！`,
        icon: 'success'
      });
      
      // 延迟显示详细信息
      setTimeout(() => {
        wx.showModal({
          title: '购买成功！',
          content: `已购买 ${quantity}个 ${item.name}！\n\n费用：${totalCost}积分\n剩余积分：${newPoints}\n\n物品已添加到库存中。`,
          showCancel: false,
          confirmText: '确定'
        });
      }, 1500);
      
    } catch (error) {
      console.error('❌ 购买多个物品失败:', error);
      wx.showToast({
        title: '购买失败，请重试',
        icon: 'none'
      });
    }
  },

  // 确认数量购买
  confirmQuantityPurchase(item, quantityOption) {
    const { quantity, totalCost, newHunger } = quantityOption;
    const actionText = item.price === 0 ? '获取并喂食' : '购买并喂食';
    const costText = item.price === 0 ? '免费' : `${totalCost}积分`;
    
    // 检查积分是否足够
    if (totalCost > this.data.userPoints) {
      wx.showToast({
        title: '积分不足',
        icon: 'none'
      });
      return;
    }
    
    wx.showModal({
      title: '确认喂食',
      content: `确定要${actionText} ${quantity}个 ${item.name} 吗？\n\n费用：${costText}\n效果：饥饿值 ${this.data.petStatus.hunger} → ${newHunger}`,
      confirmText: '喂食',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          console.log('✅ 用户确认数量购买');
          this.purchaseItemWithQuantity(item, quantityOption);
        } else {
          console.log('❌ 用户取消数量购买');
        }
      }
    });
  },

  // 处理直接购买（非数量选择）
  handleDirectPurchase(item) {
    // 如果是食物且来自宠物页面，检查饥饿值
    if (item.category === 'food' && this.data.fromPage === 'pet') {
      const petStatus = this.data.petStatus || { hunger: 50 };
      const hungerReduction = item.hungerReduction || 0;
      
      if (petStatus.hunger < hungerReduction) {
        wx.showModal({
          title: '无法喂食',
          content: `宠物当前饥饿值为 ${petStatus.hunger}，而 ${item.name} 需要至少 ${hungerReduction} 点饥饿值才能喂食。\n\n建议：等宠物更饿一些再来喂食，或者选择饥饿值需求更低的食物。`,
          showCancel: false,
          confirmText: '知道了'
        });
        return;
      }
    }
    
    // 保存 this 引用
    const self = this;
    
    // 免费商品直接确认使用
    if (item.price === 0) {
      const isFromPet = this.data.fromPage === 'pet';
      let actionText = '获取';
      let confirmText = '确认';
      
      if (isFromPet) {
        if (item.category === 'food') {
          actionText = '获取并喂食';
          confirmText = '喂食';
        } else if (item.category === 'toys') {
          actionText = '获取并陪玩';
          confirmText = '陪玩';
        }
      }
      
      console.log('💰 免费商品，动作文本:', actionText, '确认文本:', confirmText);
      
      wx.showModal({
        title: '确认获取',
        content: `确定要${actionText} ${item.name} 吗？\n\n效果：${item.effect}`,
        confirmText: confirmText,
        cancelText: '取消',
        success: function(res) {
          console.log('📱 弹窗回调结果:', res);
          if (res.confirm) {
            console.log('✅ 用户确认获取，准备调用 purchaseItem');
            try {
              self.purchaseItem(item);
            } catch (error) {
              console.error('❌ 调用 purchaseItem 出错:', error);
            }
          } else {
            console.log('❌ 用户取消了获取');
          }
        },
        fail: function(error) {
          console.error('❌ 弹窗显示失败:', error);
        }
      });
      return;
    }
    
    if (this.data.userPoints < item.price) {
      wx.showToast({
        title: '积分不足',
        icon: 'none'
      });
      return;
    }

    const isFromPet = this.data.fromPage === 'pet';
    let actionText = '购买';
    let confirmText = '购买';
    
    if (isFromPet) {
      if (item.category === 'food') {
        actionText = '购买并喂食';
        confirmText = '喂食';
      } else if (item.category === 'toys') {
        actionText = '购买并陪玩';
        confirmText = '陪玩';
      }
    }
    
    console.log('💳 付费商品，动作文本:', actionText, '确认文本:', confirmText);
    
    wx.showModal({
      title: '确认购买',
      content: `确定要花费 ${item.price} 积分${actionText} ${item.name} 吗？\n\n效果：${item.effect}`,
      confirmText: confirmText,
      cancelText: '取消',
      success: function(res) {
        console.log('📱 付费商品弹窗回调结果:', res);
        if (res.confirm) {
          console.log('✅ 用户确认购买，准备调用 purchaseItem');
          try {
            self.purchaseItem(item);
          } catch (error) {
            console.error('❌ 调用 purchaseItem 出错:', error);
          }
        } else {
          console.log('❌ 用户取消了购买');
        }
      },
      fail: function(error) {
        console.error('❌ 付费商品弹窗显示失败:', error);
      }
    });
  },

  // 执行数量购买
  purchaseItemWithQuantity(item, quantityOption) {
    console.log('🎯 执行数量购买 - 开始:', item, quantityOption);
    
    if (!item || !quantityOption) {
      console.error('❌ 商品数据或数量选项为空');
      return;
    }
    
    const { quantity, totalCost, totalHungerReduction, newHunger } = quantityOption;
    
    console.log('🎯 执行数量购买:', {
      itemName: item.name,
      quantity,
      totalCost,
      totalHungerReduction,
      newHunger
    });
    
    try {
      // 扣除积分（免费商品不扣除）
      if (totalCost > 0) {
        const newPoints = this.data.userPoints - totalCost;
        this.setData({ userPoints: newPoints });
        this.saveUserPoints();
        console.log('💰 扣除积分:', totalCost, '剩余:', newPoints);
      } else {
        console.log('💰 免费商品，不扣除积分');
      }

      // 显示购买成功
      const actionText = totalCost === 0 ? '获取成功！' : '购买成功！';
      console.log('📢 显示提示:', actionText);
      wx.showToast({
        title: actionText,
        icon: 'success'
      });

      // 应用喂食效果
      console.log('🍖 准备应用数量喂食效果');
      this.applyQuantityFeedingEffect(item, quantityOption);
      
    } catch (error) {
      console.error('❌ purchaseItemWithQuantity 执行出错:', error);
    }
  },

  // 应用数量喂食效果
  applyQuantityFeedingEffect(item, quantityOption) {
    console.log('🍖 开始应用数量喂食效果:', item.name, quantityOption);
    
    try {
      // 获取当前宠物状态
      console.log('📖 读取宠物状态...');
      const savedStatus = wx.getStorageSync('petStatus') || { mood: 80, hunger: 50 };
      console.log('📊 当前宠物状态:', savedStatus);
      
      const { quantity, totalHungerReduction, newHunger } = quantityOption;
      
      // 计算新的状态值
      const finalHunger = Math.max(0, newHunger);
      const moodIncrease = (item.moodIncrease || 0) * quantity;
      const newMood = Math.min(100, savedStatus.mood + moodIncrease);
      
      console.log('📈 状态变化:', {
        quantity,
        hunger: `${savedStatus.hunger} → ${finalHunger}`,
        mood: `${savedStatus.mood} → ${newMood}`,
        totalHungerReduction,
        moodIncrease
      });
      
      // 保存新状态
      const newStatus = {
        mood: Math.round(newMood),
        hunger: Math.round(finalHunger),
        lastUpdateTime: Date.now()
      };
      
      console.log('💾 准备保存新状态:', newStatus);
      wx.setStorageSync('petStatus', newStatus);
      console.log('✅ 新状态已保存');
      
      // 设置喂食效果标记，让宠物页面显示反馈
      const feedingEffect = {
        foodName: item.name,
        quantity: quantity,
        timestamp: Date.now()
      };
      console.log('🏷️ 准备设置喂食效果标记:', feedingEffect);
      wx.setStorageSync('feedingEffect', feedingEffect);
      console.log('✅ 喂食效果标记已设置');
      
      // 显示喂食效果
      console.log('📱 准备显示数量喂食成功弹窗...');
      setTimeout(() => {
        console.log('📱 显示数量喂食成功弹窗');
        wx.showModal({
          title: '喂食成功！',
          content: `已给宠物喂食 ${quantity}个 ${item.name}！\n\n饥饿值：${savedStatus.hunger} → ${finalHunger}\n心情值：${savedStatus.mood} → ${newMood}`,
          showCancel: false,
          confirmText: '返回宠物',
          success: (res) => {
            if (res.confirm) {
              console.log('🔙 用户选择返回宠物页面');
              // 直接跳转到宠物页面
              wx.switchTab({
                url: '/pages/pet/index'
              })
            }
          }
        });
      }, 1500);
      
    } catch (error) {
      console.error('❌ 应用数量喂食效果失败:', error);
      console.error('❌ 错误详情:', error.message);
      console.error('❌ 错误堆栈:', error.stack);
      wx.showToast({
        title: '喂食失败，请重试',
        icon: 'none'
      });
    }
  },
  purchaseItem(item) {
    console.log('🎯 执行购买/获取 - 开始:', item);
    
    if (!item) {
      console.error('❌ 商品数据为空');
      return;
    }
    
    console.log('🎯 执行购买/获取:', item.name);
    console.log('🐾 来源页面:', this.data.fromPage);
    console.log('🏷️ 商品分类:', item.category);
    console.log('💰 商品价格:', item.price);
    
    try {
      // 免费商品不扣除积分
      if (item.price > 0) {
        const newPoints = this.data.userPoints - item.price;
        this.setData({ userPoints: newPoints });
        this.saveUserPoints();
        console.log('💰 扣除积分:', item.price, '剩余:', newPoints);
      } else {
        console.log('💰 免费商品，不扣除积分');
      }

      // 显示获取成功
      const actionText = item.price === 0 ? '获取成功！' : '购买成功！';
      console.log('📢 显示提示:', actionText);
      wx.showToast({
        title: actionText,
        icon: 'success'
      });

      // 如果是从宠物页面来的，则应用效果到宠物
      console.log('🔍 检查来源页面:', this.data.fromPage);
      if (this.data.fromPage === 'pet') {
        console.log('🐾 从宠物页面来的，应用效果');
        console.log('🔍 检查商品分类:', item.category);
        if (item.category === 'food') {
          console.log('🍖 准备应用喂食效果');
          this.applyFeedingEffect(item);
        } else if (item.category === 'toys') {
          console.log('🎾 准备应用玩具效果');
          this.applyToyEffect(item);
        } else {
          console.log('❓ 未知商品分类:', item.category);
        }
      } else {
        console.log('🏪 普通购买，添加到库存');
        // 普通购买，添加到库存
        this.addToInventory(item.id, 1);
        setTimeout(() => {
          wx.showToast({
            title: `${item.name} 已添加到库存！`,
            icon: 'success'
          });
        }, 1500);
      }
    } catch (error) {
      console.error('❌ purchaseItem 执行出错:', error);
    }
  },

  // 应用喂食效果
  applyFeedingEffect(item) {
    console.log('🍖 开始应用喂食效果:', item.name);
    
    try {
      // 获取当前宠物状态
      console.log('📖 读取宠物状态...');
      const savedStatus = wx.getStorageSync('petStatus') || { mood: 80, hunger: 50 };
      console.log('📊 当前宠物状态:', savedStatus);
      
      // 检查商品属性
      console.log('🔍 商品属性:', {
        hungerReduction: item.hungerReduction,
        moodIncrease: item.moodIncrease
      });
      
      // 计算新的状态值
      let newHunger = Math.max(0, savedStatus.hunger - (item.hungerReduction || 0));
      let newMood = Math.min(100, savedStatus.mood + (item.moodIncrease || 0));
      
      console.log('📈 状态变化:', {
        hunger: `${savedStatus.hunger} → ${newHunger}`,
        mood: `${savedStatus.mood} → ${newMood}`,
        hungerReduction: item.hungerReduction,
        moodIncrease: item.moodIncrease
      });
      
      // 保存新状态
      const newStatus = {
        mood: Math.round(newMood),
        hunger: Math.round(newHunger),
        lastUpdateTime: Date.now()
      };
      
      console.log('💾 准备保存新状态:', newStatus);
      wx.setStorageSync('petStatus', newStatus);
      console.log('✅ 新状态已保存');
      
      // 设置喂食效果标记，让宠物页面显示反馈
      const feedingEffect = {
        foodName: item.name,
        timestamp: Date.now()
      };
      console.log('🏷️ 准备设置喂食效果标记:', feedingEffect);
      wx.setStorageSync('feedingEffect', feedingEffect);
      console.log('✅ 喂食效果标记已设置');
      
      // 显示喂食效果
      console.log('📱 准备显示喂食成功弹窗...');
      setTimeout(() => {
        console.log('📱 显示喂食成功弹窗');
        wx.showModal({
          title: '喂食成功！',
          content: `${item.name} 已喂给宠物！\n\n饥饿值：${savedStatus.hunger} → ${newHunger}\n心情值：${savedStatus.mood} → ${newMood}`,
          showCancel: false,
          confirmText: '返回宠物',
          success: (res) => {
            if (res.confirm) {
              console.log('🔙 用户选择返回宠物页面');
              // 直接跳转到宠物页面
              wx.switchTab({
                url: '/pages/pet/index'
              })
            }
          }
        });
      }, 1500);
      
    } catch (error) {
      console.error('❌ 应用喂食效果失败:', error);
      console.error('❌ 错误详情:', error.message);
      console.error('❌ 错误堆栈:', error.stack);
      wx.showToast({
        title: '喂食失败，请重试',
        icon: 'none'
      });
    }
  },

  // 应用玩具效果
  applyToyEffect(item) {
    try {
      // 获取当前宠物状态
      const savedStatus = wx.getStorageSync('petStatus') || { mood: 80, hunger: 50 };
      
      // 计算新的状态值
      let newMood = Math.min(100, savedStatus.mood + (item.moodIncrease || 0));
      let newHunger = Math.min(100, savedStatus.hunger + 2); // 玩耍会消耗一点体力，增加饥饿
      
      // 保存新状态
      const newStatus = {
        mood: Math.round(newMood),
        hunger: Math.round(newHunger),
        lastUpdateTime: Date.now()
      };
      
      wx.setStorageSync('petStatus', newStatus);
      
      // 设置玩具效果标记，让宠物页面显示反馈
      wx.setStorageSync('toyEffect', {
        toyName: item.name,
        timestamp: Date.now()
      });
      
      // 显示玩具效果
      setTimeout(() => {
        wx.showModal({
          title: '陪玩成功！',
          content: `和宠物一起玩${item.name}！\n\n心情值：${savedStatus.mood} → ${newMood}\n饥饿值：${savedStatus.hunger} → ${newHunger}`,
          showCancel: false,
          confirmText: '返回宠物',
          success: (res) => {
            if (res.confirm) {
              // 直接跳转到宠物页面
              wx.switchTab({
                url: '/pages/pet/index'
              })
            }
          }
        });
      }, 1500);
      
    } catch (error) {
      console.error('应用玩具效果失败:', error);
      wx.showToast({
        title: '陪玩失败，请重试',
        icon: 'none'
      });
    }
  },

  // 获取当前分类的物品
  getCurrentItems() {
    return this.data.storeItems[this.data.selectedCategory] || [];
  },

  // 隐藏数量选择弹窗
  hideQuantityModal() {
    this.setData({
      showQuantityModal: false,
      selectedItem: null,
      selectedQuantity: 1,
      maxQuantity: 1,
      previewHunger: 0,
      previewTotalCost: 0
    });
  },

  // 返回
  onBack() {
    // 检查页面栈，如果是从loading页面跳转来的，直接跳转到宠物页面
    const pages = getCurrentPages()
    if (pages.length >= 2) {
      const prevPage = pages[pages.length - 2]
      if (prevPage.route === 'pages/loading/index') {
        // 从loading页面跳转来的，直接跳转到宠物页面
        wx.switchTab({
          url: '/pages/pet/index'
        })
        return
      }
    }
    
    // 如果是从宠物页面来的，需要跳过loading页面
    if (this.data.fromPage === 'pet') {
      wx.navigateBack({ delta: 2 });
    } else {
      wx.navigateBack();
    }
  }
});