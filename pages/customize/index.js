// 猫咪捏脸页面
Page({
  data: {
    // 当前选择的分类
    selectedCategory: 'bodyType',
    
    // 分类列表
    categories: [
      { key: 'bodyType', name: '身体', icon: '/assets/customize/cat/icon/bodyType.svg' },
      { key: 'pattern', name: '花纹', icon: '/assets/customize/cat/icon/pattern.svg' },
      { key: 'eye', name: '眼睛', icon: '/assets/customize/cat/icon/eye.svg' },
      { key: 'nose', name: '鼻子', icon: '/assets/customize/cat/icon/nose.svg' },
      { key: 'noseMouthPattern', name: '嘴型', icon: '/assets/customize/cat/icon/noseMouthPattern.svg' },
    ],
    
    // 身体类型选项
    bodyTypeOptions: [
      { id: 'cobby', name: 'Cobby', path: '/assets/customize/cat/bodyType/cobby.svg' },
      { id: 'foreign', name: 'Foreign', path: '/assets/customize/cat/bodyType/foreign.svg' },
      { id: 'oriental', name: 'Oriental', path: '/assets/customize/cat/bodyType/oriental.svg' },
      { id: 'semi-cobby', name: 'Semi-Cobby', path: '/assets/customize/cat/bodyType/semi-cobby.svg' },
      { id: 'semi-foreign', name: 'Semi-Foreign', path: '/assets/customize/cat/bodyType/semi-foreign.svg' },
      { id: 'substantial', name: 'Substantial', path: '/assets/customize/cat/bodyType/substantial.svg' }
    ],

     // 花纹选项（动态生成，基于选中的 bodyType）
    patternOptions: [],
        
    // 眼睛选项
    eyeOptions: [
      { id: 'eye_1', path: '/assets/customize/cat/eye/eye_1.svg' },
      { id: 'eye_2', path: '/assets/customize/cat/eye/eye_2.svg' },
      { id: 'eye_3', path: '/assets/customize/cat/eye/eye_3.svg' },
      { id: 'eye_4', path: '/assets/customize/cat/eye/eye_4.svg' },
      { id: 'eye_5', path: '/assets/customize/cat/eye/eye_5.svg' },
      { id: 'eye_6', path: '/assets/customize/cat/eye/eye_6.svg' },
      { id: 'eye_7', path: '/assets/customize/cat/eye/eye_7.svg' },
      { id: 'eye_8', path: '/assets/customize/cat/eye/eye_8.svg' },
      { id: 'eye_9', path: '/assets/customize/cat/eye/eye_9.svg' },
      { id: 'eye_10', path: '/assets/customize/cat/eye/eye_10.svg' },
      { id: 'eye_11', path: '/assets/customize/cat/eye/eye_11.svg' },
      { id: 'eye_12', path: '/assets/customize/cat/eye/eye_12.svg' },
      { id: 'eye_13', path: '/assets/customize/cat/eye/eye_13.svg' },
      { id: 'eye_14', path: '/assets/customize/cat/eye/eye_14.svg' },
      { id: 'eye_15', path: '/assets/customize/cat/eye/eye_15.svg' },
      { id: 'eye_16', path: '/assets/customize/cat/eye/eye_16.svg' },
      { id: 'eye_17', path: '/assets/customize/cat/eye/eye_17.svg' },
      { id: 'eye_18', path: '/assets/customize/cat/eye/eye_18.svg' },
      { id: 'eye_19', path: '/assets/customize/cat/eye/eye_19.svg' },
      { id: 'eye_20', path: '/assets/customize/cat/eye/eye_20.svg' },
    ],

    // 鼻子选项（动态生成，基于选中的 bodyType）
    noseOptions: [],
    
    // 嘴型选项（动态生成，基于选中的 bodyType）
    noseMouthPatternOptions: [],

    // 当前选择
    selected: {
      bodyType: 'cobby',
      eye: 'eye_1',
      nose: 'black',
      noseMouthPattern: 'none',
      pattern: 'none'
    }
  },

  onLoad() {
    console.log('=== 捏脸页面加载 ===');
    console.log('选中的配置:', this.data.selected);
    console.log('身体类型选项数量:', this.data.bodyTypeOptions.length);
    console.log('当前分类:', this.data.selectedCategory);
    console.log('bodyType === selectedCategory?', 'bodyType' === this.data.selectedCategory);
    this.loadCustomization();
    this.updatePatternOptions();
    this.updateNoseOptions();
    this.updateNoseMouthPatternOptions();
    
    // 强制刷新一次
    setTimeout(() => {
      this.setData({
        selectedCategory: this.data.selectedCategory
      });
    }, 100);
  },

  // 加载配置
  loadCustomization() {
    try {
      const saved = wx.getStorageSync('catCustomization');
      if (saved) {
        this.setData({ selected: saved });
      }
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  },

  // 切换分类
  onSelectCategory(e) {
    const key = e.currentTarget.dataset.key;
    console.log('切换到分类:', key);
    this.setData({ selectedCategory: key });
  },

  // 选择选项
  onSelectOption(e) {
    const { category, id } = e.currentTarget.dataset;
    
    // 如果是切换身体类型，先确认是否清空装饰品
    if (category === 'bodyType' && id !== this.data.selected.bodyType) {
      // 检查是否有装饰品
      const savedOutfits = wx.getStorageSync('savedOutfit');
      if (savedOutfits && Array.isArray(savedOutfits) && savedOutfits.length > 0) {
        // 有装饰品，显示确认对话框
        wx.showModal({
          title: '提示',
          content: '更换身体类型会清空所有装饰品，确定要继续吗？',
          success: (res) => {
            if (res.confirm) {
              this.changeBodyType(id);
            }
            // 如果取消，不做任何操作
          }
        });
        return;
      } else {
        // 没有装饰品，直接切换
        this.changeBodyType(id);
        return;
      }
    }
    
    // 其他选项的正常处理
    this.setData({
      [`selected.${category}`]: id
    });
  },

  // 更换身体类型
  changeBodyType(newBodyType) {
    this.setData({
      'selected.bodyType': newBodyType
    });
    
    this.updatePatternOptions();
    this.updateNoseOptions();
    this.updateNoseMouthPatternOptions();
    // 重置相关选择，因为不同 bodyType 的选项不同
    this.setData({
      'selected.pattern': 'none',
      'selected.nose': 'black',
      'selected.noseMouthPattern': 'none'
    });
    
    // 清空装饰品
    this.clearOutfits();
  },

  // 更新花纹选项（基于当前选中的 bodyType）
  updatePatternOptions() {
    const bodyType = this.data.selected.bodyType;
    
    // 定义每个 bodyType 的花纹文件列表
    const patternFiles = {
      'cobby': [
        'bengal__pattern_1', 'black__basic', 'black__bicolor_1', 'black__bicolor_2', 'black__bicolor_3',
        'black__bicolor_4', 'black__bicolor_5', 'black__bicolor_6', 'black__bicolor_7', 'black__bicolor_8',
        'black__bicolor_9', 'brown__basic', 'brown__bicolor_1', 'brown__bicolor_2', 'brown__bicolor_3',
        'brown__bicolor_4', 'brown__bicolor_5', 'brown__bicolor_6', 'brown__bicolor_7', 'brown__bicolor_8',
        'brown__bicolor_9', 'brown-american-shorthair__pattern_1', 'brown-tabby__basic', 'brown-tabby__bicolor_1',
        'brown-tabby__bicolor_2', 'brown-tabby__bicolor_3', 'brown-tabby__bicolor_4', 'brown-tabby__bicolor_5',
        'brown-tabby__bicolor_6', 'brown-tabby__bicolor_7', 'brown-tabby__bicolor_8', 'brown-tabby__bicolor_9',
        'calico__pattern_1', 'calico__pattern_2', 'calico__pattern_3', 'calico-tabby__pattern_4',
        'cream-softlight-american-shorthair__pattern_1', 'cream-tabby__basic', 'cream-tabby__bicolor_1',
        'cream-tabby__bicolor_2', 'cream-tabby__bicolor_3', 'cream-tabby__bicolor_4', 'cream-tabby__bicolor_5',
        'cream-tabby__bicolor_6', 'cream-tabby__bicolor_7', 'cream-tabby__bicolor_8', 'cream-tabby__bicolor_9',
        'gray__basic', 'gray__bicolor_1', 'gray__bicolor_2', 'gray__bicolor_3', 'gray__bicolor_4',
        'gray__bicolor_5', 'gray__bicolor_6', 'gray__bicolor_7', 'gray__bicolor_8', 'gray__bicolor_9',
        'pointed__pattern_1', 'red-softlight-american-shorthair__pattern_1', 'red-tabby__basic',
        'red-tabby__bicolor_1', 'red-tabby__bicolor_2', 'red-tabby__bicolor_3', 'red-tabby__bicolor_4',
        'red-tabby__bicolor_5', 'red-tabby__bicolor_6', 'red-tabby__bicolor_7', 'red-tabby__bicolor_8',
        'red-tabby__bicolor_9', 'silver-american-shorthair__pattern_1', 'silver-softlight-american-shorthair__pattern_1',
        'silver-tabby__basic', 'silver-tabby__bicolor_1', 'silver-tabby__bicolor_2', 'silver-tabby__bicolor_3',
        'silver-tabby__bicolor_4', 'silver-tabby__bicolor_5', 'silver-tabby__bicolor_6', 'silver-tabby__bicolor_7',
        'silver-tabby__bicolor_8', 'silver-tabby__bicolor_9', 'tortoiseshell__pattern_1', 'white__basic',
        'yellow-tabby__basic', 'yellow-tabby__bicolor_1', 'yellow-tabby__bicolor_2', 'yellow-tabby__bicolor_3',
        'yellow-tabby__bicolor_4', 'yellow-tabby__bicolor_5', 'yellow-tabby__bicolor_6', 'yellow-tabby__bicolor_7',
        'yellow-tabby__bicolor_8', 'yellow-tabby__bicolor_9'
      ],
      'foreign': [
        'bengal__pattern_1', 'black__basic', 'black__bicolor_1', 'black__bicolor_2', 'black__bicolor_3',
        'brown__basic', 'brown__bicolor_1', 'brown__bicolor_2', 'brown__bicolor_3', 'brown-tabby__basic',
        'brown-tabby__bicolor_1', 'brown-tabby__bicolor_2', 'brown-tabby__bicolor_3', 'calico__pattern_1',
        'calico__pattern_2', 'calico__pattern_3', 'cream-tabby__basic', 'cream-tabby__bicolor_1',
        'cream-tabby__bicolor_2', 'cream-tabby__bicolor_3', 'gray__basic', 'gray__bicolor_1',
        'gray__bicolor_2', 'gray__bicolor_3', 'pointed__pattern_1', 'red-tabby__basic',
        'red-tabby__bicolor_1', 'red-tabby__bicolor_2', 'red-tabby__bicolor_3', 'silver-tabby__basic',
        'silver-tabby__bicolor_1', 'silver-tabby__bicolor_2', 'silver-tabby__bicolor_3',
        'tortoiseshell__pattern_1', 'white__basic', 'yellow-tabby__basic', 'yellow-tabby__bicolor_1',
        'yellow-tabby__bicolor_2', 'yellow-tabby__bicolor_3'
      ],
      'oriental': [
        'bengal__pattern_1', 'black__basic', 'black__bicolor_1', 'black__bicolor_2', 'black__bicolor_3',
        'brown__basic', 'brown__bicolor_1', 'brown__bicolor_2', 'brown__bicolor_3', 'brown-tabby__basic',
        'brown-tabby__bicolor_1', 'brown-tabby__bicolor_2', 'brown-tabby__bicolor_3', 'calico__pattern_1',
        'calico__pattern_2', 'calico__pattern_3', 'cream-tabby__basic', 'cream-tabby__bicolor_1',
        'cream-tabby__bicolor_2', 'cream-tabby__bicolor_3', 'gray__basic', 'gray__bicolor_1',
        'gray__bicolor_2', 'gray__bicolor_3', 'pointed__pattern_1', 'red-tabby__basic',
        'red-tabby__bicolor_1', 'red-tabby__bicolor_2', 'red-tabby__bicolor_3', 'silver-tabby__basic',
        'silver-tabby__bicolor_1', 'silver-tabby__bicolor_2', 'silver-tabby__bicolor_3',
        'tortoiseshell__pattern_1', 'white__basic', 'yellow-tabby__basic', 'yellow-tabby__bicolor_1',
        'yellow-tabby__bicolor_2', 'yellow-tabby__bicolor_3'
      ],
      'semi-cobby': [
        'bengal__pattern_1', 'black__basic', 'black__bicolor_1', 'black__bicolor_2', 'black__bicolor_3',
        'brown__basic', 'brown__bicolor_1', 'brown__bicolor_2', 'brown__bicolor_3', 'brown-tabby__basic',
        'brown-tabby__bicolor_1', 'brown-tabby__bicolor_2', 'brown-tabby__bicolor_3', 'calico__pattern_1',
        'calico__pattern_2', 'calico__pattern_3', 'cream-tabby__basic', 'cream-tabby__bicolor_1',
        'cream-tabby__bicolor_2', 'cream-tabby__bicolor_3', 'gray__basic', 'gray__bicolor_1',
        'gray__bicolor_2', 'gray__bicolor_3', 'pointed__pattern_1', 'red-tabby__basic',
        'red-tabby__bicolor_1', 'red-tabby__bicolor_2', 'red-tabby__bicolor_3', 'silver-tabby__basic',
        'silver-tabby__bicolor_1', 'silver-tabby__bicolor_2', 'silver-tabby__bicolor_3',
        'tortoiseshell__pattern_1', 'white__basic', 'yellow-tabby__basic', 'yellow-tabby__bicolor_1',
        'yellow-tabby__bicolor_2', 'yellow-tabby__bicolor_3'
      ],
      'semi-foreign': [
        'bengal__pattern_1', 'black__basic', 'black__bicolor_1', 'black__bicolor_2', 'black__bicolor_3',
        'brown__basic', 'brown__bicolor_1', 'brown__bicolor_2', 'brown__bicolor_3', 'brown-tabby__basic',
        'brown-tabby__bicolor_1', 'brown-tabby__bicolor_2', 'brown-tabby__bicolor_3', 'calico__pattern_1',
        'calico__pattern_2', 'calico__pattern_3', 'cream-tabby__basic', 'cream-tabby__bicolor_1',
        'cream-tabby__bicolor_2', 'cream-tabby__bicolor_3', 'gray__basic', 'gray__bicolor_1',
        'gray__bicolor_2', 'gray__bicolor_3', 'pointed__pattern_1', 'red-tabby__basic',
        'red-tabby__bicolor_1', 'red-tabby__bicolor_2', 'red-tabby__bicolor_3', 'silver-tabby__basic',
        'silver-tabby__bicolor_1', 'silver-tabby__bicolor_2', 'silver-tabby__bicolor_3',
        'tortoiseshell__pattern_1', 'white__basic', 'yellow-tabby__basic', 'yellow-tabby__bicolor_1',
        'yellow-tabby__bicolor_2', 'yellow-tabby__bicolor_3'
      ],
      'substantial': [
        'bengal__pattern_1', 'black__basic', 'black__bicolor_1', 'black__bicolor_2', 'black__bicolor_3',
        'brown__basic', 'brown__bicolor_1', 'brown__bicolor_2', 'brown__bicolor_3', 'brown-tabby__basic',
        'brown-tabby__bicolor_1', 'brown-tabby__bicolor_2', 'brown-tabby__bicolor_3', 'calico__pattern_1',
        'calico__pattern_2', 'calico__pattern_3', 'cream-tabby__basic', 'cream-tabby__bicolor_1',
        'cream-tabby__bicolor_2', 'cream-tabby__bicolor_3', 'gray__basic', 'gray__bicolor_1',
        'gray__bicolor_2', 'gray__bicolor_3', 'pointed__pattern_1', 'red-tabby__basic',
        'red-tabby__bicolor_1', 'red-tabby__bicolor_2', 'red-tabby__bicolor_3', 'silver-tabby__basic',
        'silver-tabby__bicolor_1', 'silver-tabby__bicolor_2', 'silver-tabby__bicolor_3',
        'tortoiseshell__pattern_1', 'white__basic', 'yellow-tabby__basic', 'yellow-tabby__bicolor_1',
        'yellow-tabby__bicolor_2', 'yellow-tabby__bicolor_3'
      ]
    };
    
    const files = patternFiles[bodyType] || patternFiles['cobby'];
    const options = [{ id: 'none', name: '无', path: '/assets/customize/cat/bodyType/cobby.svg' }];
    
    files.forEach(file => {
      options.push({
        id: file,
        name: file.replace(/__/g, ' ').replace(/_/g, ' '),
        path: `/assets/customize/cat/pattern/${bodyType}/${file}.svg`
      });
    });
    
    this.setData({ patternOptions: options });
  },

  // 更新鼻子选项（基于当前选中的 bodyType）
  updateNoseOptions() {
    const bodyType = this.data.selected.bodyType;
    
    // 鼻子颜色列表
    const noseColors = ['black', 'brown', 'dark-brown', 'gray', 'pink', 'red', 'pale-red'];
    
    const options = [];
    
    // 如果是 cobby，使用 cobby 子文件夹的鼻子
    // 其他 bodyType 使用根目录的鼻子
    const basePath = bodyType === 'cobby' 
      ? `/assets/customize/cat/nose/cobby/` 
      : `/assets/customize/cat/nose/`;
    
    noseColors.forEach(color => {
      options.push({
        id: color,
        name: color,
        path: `${basePath}${color}.svg`
      });
    });
    
    this.setData({ noseOptions: options });
  },

  // 更新嘴型选项（基于当前选中的 bodyType）
  updateNoseMouthPatternOptions() {
    const bodyType = this.data.selected.bodyType;
    
    // 嘴型列表
    const patterns = ['pattern_2', 'pattern_3', 'pattern_4', 'pattern_5', 'pattern_6', 
                     'pattern_7', 'pattern_8', 'pattern_9', 'pattern_10', 'pattern_11',
                     'pattern_12', 'pattern_13', 'pattern_14', 'pattern_15', 'pattern_16'];
    
    const options = [{ id: 'none', name: '无', path: '/assets/customize/cat/noseMouthPattern/none.svg' }];
    
    // 如果是 cobby，使用 cobby 子文件夹的嘴型
    // 其他 bodyType 使用根目录的嘴型
    const basePath = bodyType === 'cobby' 
      ? `/assets/customize/cat/noseMouthPattern/cobby/` 
      : `/assets/customize/cat/noseMouthPattern/`;
    
    patterns.forEach(pattern => {
      options.push({
        id: pattern,
        name: pattern.replace('pattern_', '样式 '),
        path: `${basePath}${pattern}.svg`
      });
    });
    
    this.setData({ noseMouthPatternOptions: options });
  },

  // 清空装饰品
  clearOutfits() {
    try {
      // 获取当前装饰品数量用于提示
      const savedOutfits = wx.getStorageSync('savedOutfit');
      const outfitCount = (savedOutfits && Array.isArray(savedOutfits)) ? savedOutfits.length : 0;
      
      // 清空本地存储中的装饰品数据
      wx.removeStorageSync('savedOutfit');
      console.log('已清空装饰品：身体类型已更改');
      
      // 显示提示信息
      if (outfitCount > 0) {
        wx.showToast({
          title: `已清空 ${outfitCount} 件装饰品`,
          icon: 'none',
          duration: 2500
        });
      }
    } catch (error) {
      console.error('清空装饰品失败:', error);
      wx.showToast({
        title: '清空装饰品失败',
        icon: 'none',
        duration: 1500
      });
    }
  },

  // 保存
  onSave() {
    try {
      wx.setStorageSync('catCustomization', this.data.selected);
      wx.showToast({
        title: '保存成功',
        icon: 'success',
        duration: 1500
      });
    } catch (error) {
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
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
    
    // 正常返回
    wx.navigateBack()
  },

  // 处理图片加载错误
  onImageError(e) {
    console.warn('猫咪渲染图片加载失败:', e.detail);
  }
});
