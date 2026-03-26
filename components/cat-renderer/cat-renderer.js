// 猫咪渲染组件
const { getCatTemplate, calculateTransform, getRenderOrder } = require('../../utils/catTemplate');

Component({
  properties: {
    // 猫咪配置
    catConfig: {
      type: Object,
      value: {
        bodyType: 'cobby',
        pattern: 'none',
        eye: 'eye_1',
        nose: 'black',
        noseMouthPattern: 'none'
      }
    },
    
    // 容器尺寸
    size: {
      type: String,
      value: 'normal' // small, normal, pet, large
    },
    
    // 是否显示调试信息
    debug: {
      type: Boolean,
      value: false
    }
  },

  data: {
    template: null,
    renderLayers: []
  },

  observers: {
    'catConfig.**': function(catConfig) {
      this.updateRender();
    }
  },

  lifetimes: {
    attached() {
      this.updateRender();
    }
  },

  methods: {
    /**
     * 更新渲染配置
     */
    updateRender() {
      const { catConfig } = this.properties;
      const template = getCatTemplate(catConfig.bodyType);
      const renderOrder = getRenderOrder(catConfig.bodyType);
      
      // 构建渲染层级
      const renderLayers = renderOrder.map(layerType => {
        return this.buildLayer(layerType, catConfig, template);
      }).filter(layer => layer !== null);
      
      this.setData({
        template,
        renderLayers
      });
      
      if (this.properties.debug) {
        console.log('Cat Renderer Updated:', {
          bodyType: catConfig.bodyType,
          template,
          renderLayers
        });
      }
    },

    /**
     * 构建单个渲染层
     */
    buildLayer(layerType, catConfig, template) {
      // 身体层特殊处理，直接使用 bodyType
      if (layerType === 'body') {
        const imagePath = this.buildImagePath(layerType, catConfig.bodyType, catConfig.bodyType);
        const styles = calculateTransform(catConfig.bodyType, layerType);
        
        return {
          type: layerType,
          imagePath,
          transform: styles.transform,
          left: styles.left,
          top: styles.top,
          zIndex: this.getZIndex(layerType),
          isCustomizePage: this.isCustomizePage()
        };
      }
      
      const config = catConfig[layerType];
      
      // 跳过未配置或为 'none' 的层
      if (!config || config === 'none') {
        return null;
      }
      
      // 构建图片路径
      const imagePath = this.buildImagePath(layerType, config, catConfig.bodyType);
      if (!imagePath) return null;
      
      // 添加调试日志
      if (layerType === 'pattern') {
        console.log('花纹渲染调试:', {
          layerType,
          config,
          bodyType: catConfig.bodyType,
          imagePath,
          isCustomizePage: this.isCustomizePage()
        });
      }
      
      // 计算变换样式和位置
      const styles = calculateTransform(catConfig.bodyType, layerType);
      
      return {
        type: layerType,
        imagePath,
        transform: styles.transform,
        left: styles.left,
        top: styles.top,
        zIndex: this.getZIndex(layerType),
        isCustomizePage: this.isCustomizePage()
      };
    },

    /**
     * 构建图片路径
     */
    buildImagePath(layerType, config, bodyType) {
      const pathMappings = {
        body: `/assets/customize/cat/bodyType/${config}.svg`,
        
        pattern: `/assets/customize/cat/pattern/${bodyType}/${config}.svg`,
        
        eye: `/assets/customize/cat/eye/${config}.svg`,
        
        nose: bodyType === 'cobby' 
          ? `/assets/customize/cat/nose/cobby/${config}.svg`
          : `/assets/customize/cat/nose/${config}.svg`,
          
        noseMouthPattern: bodyType === 'cobby'
          ? `/assets/customize/cat/noseMouthPattern/cobby/${config}.svg`
          : `/assets/customize/cat/noseMouthPattern/${config}.svg`
      };
      
      return pathMappings[layerType];
    },

    /**
     * 检查是否在customize页面
     */
    isCustomizePage() {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      return currentPage && currentPage.route === 'pages/customize/index';
    },

    /**
     * 获取层级z-index
     */
    getZIndex(layerType) {
      const zIndexMap = {
        body: 1,
        pattern: 2,
        accessories: 4,
        eye: 6,
        nose: 7,
        noseMouthPattern: 8
      };
      
      return zIndexMap[layerType] || 0;
    },

    /**
     * 处理图片加载错误
     */
    onImageError(e) {
      const { layerType } = e.currentTarget.dataset;
      console.warn(`Cat renderer: Failed to load ${layerType} image`, e.detail);
      
      // 特别记录花纹加载错误
      if (layerType === 'pattern') {
        console.error('花纹图片加载失败:', {
          layerType,
          src: e.currentTarget.src,
          error: e.detail
        });
      }
      
      // 触发错误事件
      this.triggerEvent('imageerror', {
        layerType,
        error: e.detail
      });
    },

    /**
     * 处理图片加载成功
     */
    onImageLoad(e) {
      const { layerType } = e.currentTarget.dataset;
      
      if (this.properties.debug) {
        console.log(`Cat renderer: Loaded ${layerType} image`);
      }
    }
  }
});