// 消息页面通用头部组件
Component({
  properties: {
    title: {
      type: String,
      value: '消息'
    },
    showBack: {
      type: Boolean,
      value: true
    },
    backgroundColor: {
      type: String,
      value: 'white'
    }
  },

  methods: {
    onBack() {
      this.triggerEvent('back');
    }
  }
})