// 图片池 - 管理帖子封面图片
class ImagePool {
  constructor() {
    // 指定的5张图片，按顺序循环使用
    this.pokemonImages = [
      '/images/pokemon/1.png',
      '/images/pokemon/2.png',
      '/images/pokemon/3.png',
      '/images/pokemon/4.png',
      '/images/pokemon/5.png'
    ]
    
    // 用于用户发布的帖子的图片（保持原有的猫狗图片）
    this.userPostImages = [
      '/assets/pet_idle.png',
      '/assets/icon/橘猫.png',
      '/assets/icon/白猫.png',
      '/assets/icon/黑猫.png',
      '/assets/icon/奶牛猫.png',
      '/assets/icon/暹罗猫.png',
      '/assets/icon/更多猫宠.png',
      '/assets/customize/cat/bodyType/cobby.svg',
      '/assets/customize/cat/bodyType/foreign.svg',
      '/assets/customize/cat/bodyType/oriental.svg',
      '/assets/icon/哈士奇.png',
      '/assets/icon/金毛.png',
      '/assets/icon/法斗.png',
      '/assets/icon/腊肠犬.png',
      '/assets/pet_background.jpg',
      '/assets/pet_background2.jpg',
      '/assets/pet_background3.jpg',
      '/assets/icon/荷兰猪.png',
      '/assets/icon/可达鸭.png'
    ]
    
    // 备用外部链接（如果本地图片也失败的话）
    this.fallbackImages = [
      'https://youke2.picui.cn/s1/2025/12/27/694f9a76213d6.png',
      'https://youke2.picui.cn/s1/2025/12/27/694f9a767aa2a.png',
      'https://youke2.picui.cn/s1/2025/12/27/694f9a767d361.png',
      'https://youke2.picui.cn/s1/2025/12/27/694f9a766a3a0.png',
      'https://youke2.picui.cn/s1/2025/12/27/694f9a7613c3c.png',
      'https://youke2.picui.cn/s1/2025/12/27/694f9a8011c9d.png'
    ]
  }

  // 获取随机图片（用于用户帖子）
  getRandomImage() {
    const randomIndex = Math.floor(Math.random() * this.userPostImages.length)
    return this.userPostImages[randomIndex]
  }

  // 根据索引获取图片（用于确保同一个帖子总是使用相同的图片）
  getImageByIndex(index) {
    const imageIndex = index % this.userPostImages.length
    return this.userPostImages[imageIndex]
  }

  // 根据ID获取图片 - 区分用户帖子和系统帖子
  getImageById(id, isUserPost = false) {
    if (!id) return this.getRandomImage()
    
    // 如果是用户发布的帖子，使用猫狗图片
    if (isUserPost) {
      let numericId = 0
      if (typeof id === 'string') {
        for (let i = 0; i < id.length; i++) {
          numericId += id.charCodeAt(i)
        }
      } else {
        numericId = id
      }
      
      const imageIndex = numericId % this.userPostImages.length
      return this.userPostImages[imageIndex]
    }
    
    // 系统帖子使用指定的5张图片，确保不重复
    // 使用更简单的方法：直接基于帖子在列表中的位置
    return this.getPokemonImageBySequence(id)
  }

  // 根据序列获取Pokemon图片，确保不重复
  getPokemonImageBySequence(id) {
    // 创建一个简单的计数器来确保顺序分配
    if (!this.pokemonImageCounter) {
      this.pokemonImageCounter = 0
    }
    
    // 为每个唯一ID分配一个固定的图片
    if (!this.idToImageMap) {
      this.idToImageMap = new Map()
    }
    
    const idStr = String(id)
    if (this.idToImageMap.has(idStr)) {
      return this.idToImageMap.get(idStr)
    }
    
    // 分配新图片
    const imageIndex = this.pokemonImageCounter % this.pokemonImages.length
    const selectedImage = this.pokemonImages[imageIndex]
    
    this.idToImageMap.set(idStr, selectedImage)
    this.pokemonImageCounter++
    
    console.log(`🖼️ 为帖子 ${idStr} 分配图片: ${selectedImage} (序号: ${imageIndex})`)
    
    return selectedImage
  }

  // 获取指定序号的Pokemon图片（0-4）
  getPokemonImageByIndex(index) {
    const imageIndex = index % this.pokemonImages.length
    return this.pokemonImages[imageIndex]
  }

  // 获取备用图片（当本地图片也失败时）
  getFallbackImageById(id) {
    if (!id) return this.fallbackImages[0]
    
    let numericId = 0
    if (typeof id === 'string') {
      for (let i = 0; i < id.length; i++) {
        numericId += id.charCodeAt(i)
      }
    } else {
      numericId = id
    }
    
    const imageIndex = numericId % this.fallbackImages.length
    return this.fallbackImages[imageIndex]
  }

  // 获取默认图片（第一张Pokemon图片）
  getDefaultImage() {
    return this.pokemonImages[0]
  }

  // 获取所有Pokemon图片
  getAllPokemonImages() {
    return [...this.pokemonImages]
  }

  // 获取所有用户帖子图片
  getAllUserPostImages() {
    return [...this.userPostImages]
  }

  // 获取所有备用图片
  getAllFallbackImages() {
    return [...this.fallbackImages]
  }

  // 重置图片分配计数器（用于页面刷新时）
  resetImageCounter() {
    this.pokemonImageCounter = 0
    this.idToImageMap = new Map()
    console.log('🔄 重置图片分配计数器')
  }

  // 获取当前分配状态（用于调试）
  getAssignmentStatus() {
    return {
      counter: this.pokemonImageCounter || 0,
      assignments: this.idToImageMap ? Array.from(this.idToImageMap.entries()) : []
    }
  }
}

// 创建单例实例
const imagePool = new ImagePool()

module.exports = imagePool