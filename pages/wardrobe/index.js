Page({
  data: {
    petName: 'Petto',
    petAge: 1,
    // 宠物自定义配置
    petCustomization: null,
    useCustomPet: false,
    categories: [
      { key: 'hat', name: '帽子' },
      { key: 'tie', name: '领结' },
      { key: 'eyeglass', name: '眼镜' },
      { key: 'accessory', name: '配饰' }
    ],
    selectedCategory: 'hat',
    outfits: [
      { id: 1,  name: '小黄帽', category: 'hat', thumb: '/assets/wardrobe/1.png', src: '/assets/wardrobe/1.png' },
      { id: 2,  name: '草帽', category: 'hat', thumb: '/assets/wardrobe/2.png', src: '/assets/wardrobe/2.png' },
      { id: 3,  name: '黑色领结', category: 'tie', thumb: '/assets/wardrobe/3.png', src: '/assets/wardrobe/3.png' },
      { id: 4,  name: '红色领结', category: 'tie', thumb: '/assets/wardrobe/4.png', src: '/assets/wardrobe/4.png' },
      { id: 5,  name: '书呆子眼镜', category: 'eyeglass', thumb: '/assets/wardrobe/5.png', src: '/assets/wardrobe/5.png' },
      { id: 6,  name: '墨镜', category: 'eyeglass', thumb: '/assets/wardrobe/6.png', src: '/assets/wardrobe/6.png' },
      { id: 7,  name: '搞怪眼镜', category: 'eyeglass', thumb: '/assets/wardrobe/7.png', src: '/assets/wardrobe/7.png' },
      { id: 8,  name: '方框眼镜', category: 'eyeglass', thumb: '/assets/wardrobe/8.png', src: '/assets/wardrobe/8.png' },
      { id: 9,  name: '围巾', category: 'accessory', thumb: '/assets/wardrobe/9.png', src: '/assets/wardrobe/9.png' },
      { id: 10, name: '小尾巴', category: 'accessory', thumb: '/assets/wardrobe/10.png', src: '/assets/wardrobe/10.png' },
      { id: 11,  name: '毛线帽子', category: 'hat', thumb: '/assets/wardrobe/11.png', src: '/assets/wardrobe/11.png' },
      { id: 12,  name: '生日帽', category: 'hat', thumb: '/assets/wardrobe/12.png', src: '/assets/wardrobe/12.png' },
      { id: 13,  name: '领带', category: 'tie', thumb: '/assets/wardrobe/13.png', src: '/assets/wardrobe/13.png' },
      { id: 14,  name: '项链', category: 'tie', thumb: '/assets/wardrobe/14.png', src: '/assets/wardrobe/14.png' },
      { id: 15, name: '气球', category: 'accessory', thumb: '/assets/wardrobe/15.png', src: '/assets/wardrobe/15.png' },
      { id: 16, name: '小花', category: 'accessory', thumb: '/assets/wardrobe/16.png', src: '/assets/wardrobe/16.png' }
    ],
    filteredOutfits: [],
    wornOutfits: [], // 已穿戴的装备列表，格式：{ ...outfit, x: 250, y: 250 }
    isDragging: false,
    isDraggingOutfit: false,
    outfitWasDragged: false,
    dragItemId: null,
    draggingItem: null,
    draggingOutfitIndex: null,
    dragX: 0,
    dragY: 0,
    dragStartX: 0,
    dragStartY: 0,
    outfitDragStartX: 0,
    outfitDragStartY: 0,
    outfitOriginalX: 0,
    outfitOriginalY: 0,
    previewAreaTop: 0,
    previewAreaBottom: 0,
    previewAreaLeft: 0,
    previewAreaRight: 0,
    previewAreaWidth: 0,
    previewAreaHeight: 0
  },

  onLoad() {
    this.loadPetCustomization();
    this.loadSavedOutfits();
    this.updateFiltered();
    // 延迟计算预览区域位置，确保页面已渲染
    setTimeout(() => {
      this.calculatePreviewArea();
    }, 500);
  },

  onShow() {
    // 每次显示页面时重新加载配置
    this.loadPetCustomization();
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
        console.log('衣橱：加载自定义宠物配置:', customization);
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

  // 加载已保存的装扮
  loadSavedOutfits() {
    try {
      const savedOutfits = wx.getStorageSync('savedOutfit');
      if (savedOutfits && Array.isArray(savedOutfits) && savedOutfits.length > 0) {
        this.setData({
          wornOutfits: savedOutfits
        });
        console.log('衣橱：加载已保存的装扮:', savedOutfits);
        wx.showToast({ 
          title: `已加载 ${savedOutfits.length} 件装扮`, 
          icon: 'success', 
          duration: 1500 
        });
      }
    } catch (error) {
      console.error('加载装扮失败:', error);
    }
  },

  // 计算预览区域的位置
  calculatePreviewArea() {
    const query = wx.createSelectorQuery();
    query.select('.preview-area').boundingClientRect();
    query.exec((res) => {
      if (res[0]) {
        console.log('预览区域位置:', res[0]);
        this.setData({
          previewAreaTop: res[0].top,
          previewAreaBottom: res[0].bottom,
          previewAreaLeft: res[0].left,
          previewAreaRight: res[0].right,
          previewAreaWidth: res[0].width,
          previewAreaHeight: res[0].height
        });
      }
    });
  },

  // 判断某个类别是否已穿戴
  isWorn(category) {
    return this.data.wornOutfits.some(item => item.category === category);
  },

  // 开始拖拽
  onDragStart(e) {
    const { id } = e.currentTarget.dataset;
    const outfit = this.data.outfits.find(function(o) { return o.id === id; });
    
    console.log('开始拖拽配件 ID:', id);
    
    // 重新计算预览区域位置（确保最新）
    this.calculatePreviewArea();
    
    const touchX = e.touches[0].pageX;
    const touchY = e.touches[0].pageY;
    
    this.setData({
      isDragging: true,
      dragItemId: id,
      draggingItem: outfit,
      dragX: touchX * 2, // px 转 rpx，用于 fixed 定位
      dragY: touchY * 2,
      dragStartX: touchX,
      dragStartY: touchY
    });
    
    wx.showToast({ title: '拖动到宠物身上', icon: 'none', duration: 1000 });
  },

  // 拖拽中
  onDragMove(e) {
    if (!this.data.isDragging) return;
    
    const touchX = e.touches[0].pageX;
    const touchY = e.touches[0].pageY;
    
    // 更新拖拽物品的位置（fixed 定位，相对于页面）
    this.setData({
      dragX: touchX * 2, // px 转 rpx
      dragY: touchY * 2
    });
  },

  // 结束拖拽
  onDragEnd(e) {
    const touchX = e.changedTouches[0].pageX;
    const touchY = e.changedTouches[0].pageY;
    const { dragItemId, dragX, dragY, previewAreaTop, previewAreaBottom, previewAreaLeft, previewAreaRight } = this.data;
    
    console.log('=== 拖拽结束调试信息 ===');
    console.log('触摸位置 (px):', touchX, touchY);
    console.log('拖拽预览位置 (rpx):', dragX, dragY);
    console.log('预览区域 (px):', { left: previewAreaLeft, top: previewAreaTop, right: previewAreaRight, bottom: previewAreaBottom });
    
    // 判断是否拖到预览区域
    if (previewAreaLeft && touchX >= previewAreaLeft && touchX <= previewAreaRight &&
        touchY >= previewAreaTop && touchY <= previewAreaBottom) {
      const outfit = this.data.outfits.find(o => o.id === dragItemId);
      if (outfit) {
        // 计算相对于预览区域的位置
        // 拖拽预览是 fixed 定位，配件是 absolute 定位（相对于预览区域）
        // 两者都使用 transform: translate(-50%, -50%)，所以中心点对齐
        const relativeX = (touchX - previewAreaLeft) * 2; // px 转 rpx
        const relativeY = (touchY - previewAreaTop) * 2;
        
        console.log('相对位置 (rpx):', relativeX, relativeY);
        console.log('预览层显示位置 (rpx):', dragX, dragY);
        console.log('预览区域偏移 (rpx):', previewAreaLeft * 2, previewAreaTop * 2);
        console.log('计算验证: dragY - previewTop*2 =', dragY - previewAreaTop * 2);
        
        // 使用拖拽预览的实际位置来计算，确保完全一致
        // dragX/dragY 是 fixed 定位的位置，需要减去预览区域的偏移
        const finalX = dragX - previewAreaLeft * 2;
        const finalY = dragY - previewAreaTop * 2;
        
        console.log('使用预览位置计算的最终位置:', finalX, finalY);
        
        this.wearOutfit(outfit, finalX, finalY);
      }
    } else {
      wx.showToast({ title: '请拖到宠物预览区域', icon: 'none', duration: 1500 });
    }

    this.setData({
      isDragging: false,
      dragItemId: null,
      draggingItem: null,
      dragX: 0,
      dragY: 0
    });
  },

  // 穿上装备（带位置信息）
  wearOutfit: function(outfit, x, y) {
    const wornOutfits = this.data.wornOutfits.slice();
    // 移除同类别的装备
    const filteredOutfits = wornOutfits.filter(function(item) {
      return item.category !== outfit.category;
    });
    // 添加新装备，包含位置信息
    filteredOutfits.push(Object.assign({}, outfit, {
      x: x || 250, // 默认居中
      y: y || 250
    }));
    
    this.setData({ wornOutfits: filteredOutfits });
    wx.showToast({ title: '已穿上' + outfit.name, icon: 'success', duration: 1000 });
  },

  // 拖动已穿戴的配件
  onOutfitDragStart: function(e) {
    const index = e.currentTarget.dataset.index;
    const outfit = this.data.wornOutfits[index];
    
    if (!outfit) return;
    
    console.log('开始拖动配件:', outfit.name);
    
    this.setData({
      isDraggingOutfit: true,
      draggingOutfitIndex: index,
      outfitDragStartX: e.touches[0].pageX,
      outfitDragStartY: e.touches[0].pageY,
      outfitOriginalX: outfit.x,
      outfitOriginalY: outfit.y
    });
  },

  onOutfitDragMove: function(e) {
    if (!this.data.isDraggingOutfit) return;
    
    const draggingOutfitIndex = this.data.draggingOutfitIndex;
    const outfitDragStartX = this.data.outfitDragStartX;
    const outfitDragStartY = this.data.outfitDragStartY;
    const outfitOriginalX = this.data.outfitOriginalX;
    const outfitOriginalY = this.data.outfitOriginalY;
    
    const touchX = e.touches[0].pageX;
    const touchY = e.touches[0].pageY;
    
    // 计算移动距离（px 转 rpx）
    const deltaX = (touchX - outfitDragStartX) * 2;
    const deltaY = (touchY - outfitDragStartY) * 2;
    
    // 计算新位置
    const newX = outfitOriginalX + deltaX;
    const newY = outfitOriginalY + deltaY;
    
    // 更新配件位置
    const wornOutfits = this.data.wornOutfits.slice();
    wornOutfits[draggingOutfitIndex] = Object.assign({}, wornOutfits[draggingOutfitIndex], {
      x: newX,
      y: newY
    });
    
    this.setData({ wornOutfits: wornOutfits });
  },

  onOutfitDragEnd: function(e) {
    const wasDragging = this.data.isDraggingOutfit;
    const startX = this.data.outfitDragStartX;
    const startY = this.data.outfitDragStartY;
    const endX = e.changedTouches[0].pageX;
    const endY = e.changedTouches[0].pageY;
    
    // 计算移动距离
    const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    
    console.log('配件拖动结束，移动距离:', distance);
    
    this.setData({
      isDraggingOutfit: false,
      draggingOutfitIndex: null,
      outfitWasDragged: distance > 10 // 移动超过10px算拖动
    });
    
    if (distance > 10) {
      wx.showToast({ title: '位置已调整', icon: 'success', duration: 1000 });
    }
  },

  // 双击配件移除
  onOutfitTap: function(e) {
    // 如果刚刚拖动过，不触发点击
    if (this.data.outfitWasDragged) {
      this.setData({ outfitWasDragged: false });
      return;
    }
    
    const index = e.currentTarget.dataset.index;
    const outfit = this.data.wornOutfits[index];
    
    if (!outfit) return;
    
    const now = Date.now();
    const lastTapTime = this.lastOutfitTapTime || 0;
    const lastTapIndex = this.lastOutfitTapIndex;
    
    // 判断是否为双击（500ms内，同一个配件）
    if (now - lastTapTime < 500 && lastTapIndex === index) {
      // 双击，移除配件
      this.removeOutfit(index);
      this.lastOutfitTapTime = 0; // 重置
      this.lastOutfitTapIndex = null;
    } else {
      // 单击，记录时间和索引
      this.lastOutfitTapTime = now;
      this.lastOutfitTapIndex = index;
      // 显示提示
      wx.showToast({ 
        title: '双击可脱下', 
        icon: 'none', 
        duration: 800 
      });
    }
  },

  // 移除指定配件
  removeOutfit: function(index) {
    const wornOutfits = this.data.wornOutfits.slice();
    const removedOutfit = wornOutfits[index];
    wornOutfits.splice(index, 1);
    
    this.setData({ wornOutfits: wornOutfits });
    wx.showToast({ 
      title: '已脱下 ' + removedOutfit.name, 
      icon: 'success', 
      duration: 1000 
    });
  },

  // 点击预览区域
  onDropZoneTouchStart(e) {
    // 可以用于点击脱下装备
  },

  onSelect(e) {
    const id = e.currentTarget.dataset.id;
    const found = this.data.outfits.find(o => o.id === id);
    if (found) {
      this.setData({ currentOutfit: found });
      wx.showToast({ title: '已穿上', icon: 'success', duration: 800 });
    }
  },

  onSelectCategory(e) {
    const key = e.currentTarget.dataset.key;
    if (!key || key === this.data.selectedCategory) return;
    this.setData({ selectedCategory: key }, () => {
      this.updateFiltered();
    });
  },

  updateFiltered() {
    const list = this.data.outfits.filter(o => o.category === this.data.selectedCategory);
    this.setData({ filteredOutfits: list });
  },

  // 清空所有装扮
  onClearAll() {
    wx.showModal({
      title: '提示',
      content: '确定要清空所有装扮吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ wornOutfits: [] });
          // 同时清空存储
          wx.removeStorageSync('savedOutfit');
          wx.showToast({ title: '已清空', icon: 'success', duration: 1000 });
        }
      }
    });
  },

  // 保存装扮
  onSave() {
    const { wornOutfits } = this.data;
    if (wornOutfits.length === 0) {
      wx.showToast({ title: '还没有装扮哦', icon: 'none', duration: 1500 });
      return;
    }

    // 这里可以保存到本地存储或服务器
    wx.setStorageSync('savedOutfit', wornOutfits);
    wx.showToast({ title: '保存成功', icon: 'success', duration: 1500 });
  },

  // 导航栏返回：优先后退，否则切到宠物页 Tab
  onNavBack() {
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
    
    if (pages.length > 2) {
      // 如果页面栈中有超过2个页面，说明是从其他页面跳转来的，跳过loading页面
      wx.navigateBack({ delta: 2 });
    } else {
      // 否则直接跳转到宠物页面
      const loadingNav = require('../../utils/loadingNavigator');
      loadingNav.switchTab('/pages/pet/index', null, true); // 启用快速模式
    }
  },

  // 处理衣橱图片加载错误
  onWardrobeImageError(e) {
    console.warn('衣橱渲染图片加载失败:', e.detail);
  }
});

