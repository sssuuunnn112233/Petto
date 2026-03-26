// 猫咪体型模板配置系统 - 简化版
// 只使�?position 百分比定位，去掉复杂�?offset

const CAT_TEMPLATES = {
  // Cobby（短胖型�?
  cobby: {
    name: 'Cobby',
    
    anchors: {
      body: {
        scale: 1.0,
        position: { x: 50, y: 50 }
      },
      eye: {
        scale: 0.35,
        position: { x: 26.5, y: 37 }
      },
      nose: {
        scale: 0.2,
        position: { x: 26.5, y: 40 }
      },
      noseMouthPattern: {
        scale: 0.2,
        position: { x: 26.5, y: 40 }
      }
    },
    
    regions: {
      pattern: {
        scale: 1.0,
        position: { x: 50, y: 50 }
      },
      accessories: {
        scale: 1.0,
        position: { x: 50, y: 40 }
      }
    },
    
    renderOrder: ['body', 'pattern', 'eye', 'nose', 'noseMouthPattern', 'accessories']
  },

  // Foreign（外国型�?
  foreign: {
    name: 'Foreign',
    
    anchors: {
      body: {
        scale: 1.0,
        position: { x: 50, y: 50 }
      },
      eye: {
        scale: 0.32,
        position: { x: 32, y: 24 }
      },
      nose: {
        scale: 0.23,
        position: { x: 32, y: 28 }
      },
      noseMouthPattern: {
        scale: 0.23,
        position: { x: 32, y: 28 }
      }
    },
    
    regions: {
      pattern: {
        scale: 1.0,
        position: { x: 50, y: 50 }
      },
      accessories: {
        scale: 1.0,
        position: { x: 50, y: 35 }
      }
    },
    
    renderOrder: ['body', 'pattern', 'eye', 'nose', 'noseMouthPattern', 'accessories']
  },

  // Oriental（东方型�?
  oriental: {
    name: 'Oriental',
    
    anchors: {
      body: {
        scale: 1.0,
        position: { x: 50, y: 50 }
      },
      eye: {
        scale: 0.3,
        position: { x: 34, y: 23 }
      },
      nose: {
        scale: 0.22,
        position: { x: 34.3, y: 26 }
      },
      noseMouthPattern: {
        scale: 0.22,
        position: { x: 34.3, y: 26 }
      }
    },
    
    regions: {
      pattern: {
        scale: 1.0,
        position: { x: 50, y: 50 }
      },
      accessories: {
        scale: 0.9,
        position: { x: 50, y: 30 }
      }
    },
    
    renderOrder: ['body', 'pattern', 'eye', 'nose', 'noseMouthPattern', 'accessories']
  },

  // Semi-Cobby（半短胖型）
  'semi-cobby': {
    name: 'Semi-Cobby',
    
    anchors: {
      body: {
        scale: 1.0,
        position: { x: 50, y: 50 }
      },
      eye: {
        scale: 0.35,
        position: { x: 30, y: 31 }
      },
      nose: {
        scale: 0.25,
        position: { x: 30, y: 35 }
      },
      noseMouthPattern: {
        scale: 0.25,
        position: { x: 30, y: 35 }
      }
    },
    
    regions: {
      pattern: {
        scale: 1.0,
        position: { x: 50, y: 50 }
      },
      accessories: {
        scale: 0.95,
        position: { x: 50, y: 37 }
      }
    },
    
    renderOrder: ['body', 'pattern', 'eye', 'nose', 'noseMouthPattern', 'accessories']
  },

  // Semi-Foreign（半外国型）
  'semi-foreign': {
    name: 'Semi-Foreign',
    description: '半外国型 - 中等偏修长的体型',
    
    anchors: {
      body: {
        scale: 1.0,
        position: { x: 50, y: 50 }
      },
      eye: {
        scale: 0.34,
        position: { x: 27, y: 37 }
      },
      nose: {
        scale: 0.24,
        position: { x: 27, y: 41 }
      },
      noseMouthPattern: {
        scale: 0.24,
        position: { x: 27, y: 41 }
      }
    },
    
    regions: {
      pattern: {
        scale: 1.0,
        position: { x: 50, y: 50 }
      },
      accessories: {
        scale: 0.92,
        position: { x: 50, y: 33 }
      }
    },
    
    renderOrder: ['body', 'pattern', 'eye', 'nose', 'noseMouthPattern', 'accessories']
  },

  // Substantial（结实型�?
  substantial: {
    name: 'Substantial',
    
    anchors: {
      body: {
        scale: 1.0,
        position: { x: 50, y: 50 }
      },
      eye: {
        scale: 0.3,
        position: { x: 32.5, y: 33 }
      },
      nose: {
        scale: 0.23,
        position: { x: 32.5, y: 37 }
      },
      noseMouthPattern: {
        scale: 0.23,
        position: { x: 32.5, y: 37 }
      }
    },
    
    regions: {
      pattern: {
        scale: 1.0,
        position: { x: 50, y: 50 }
      },
      accessories: {
        scale: 1.1,
        position: { x: 50, y: 42 }
      }
    },
    
    renderOrder: ['body', 'pattern', 'eye', 'nose', 'noseMouthPattern', 'accessories']
  }
};

/**
 * 获取体型模板
 */
function getCatTemplate(bodyType) {
  return CAT_TEMPLATES[bodyType] || CAT_TEMPLATES.cobby;
}

/**
 * 获取所有可用的体型
 */
function getAllBodyTypes() {
  return Object.keys(CAT_TEMPLATES).map(key => ({
    id: key,
    name: CAT_TEMPLATES[key].name,
    description: CAT_TEMPLATES[key].description
  }));
}

/**
 * 计算元素的变换样�?- 简化版
 */
function calculateTransform(bodyType, elementType) {
  const template = getCatTemplate(bodyType);
  
  const config = template.anchors[elementType] || template.regions[elementType];
  if (!config) return { transform: '', left: '50%', top: '50%' };
  
  const { scale, position } = config;
  
  // 只处理缩�?
  let transform = '';
  if (scale !== 1.0) {
    transform = `scale(${scale})`;
  }
  
  return {
    transform: transform.trim(),
    left: `${position.x}%`,
    top: `${position.y}%`
  };
}

/**
 * 获取渲染顺序
 */
function getRenderOrder(bodyType) {
  const template = getCatTemplate(bodyType);
  return template.renderOrder;
}

module.exports = {
  CAT_TEMPLATES,
  getCatTemplate,
  getAllBodyTypes,
  calculateTransform,
  getRenderOrder
};
