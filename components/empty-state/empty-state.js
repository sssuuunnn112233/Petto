// 空状态组件
Component({
  properties: {
    icon: {
      type: String,
      value: '📭'
    },
    title: {
      type: String,
      value: '暂无数据'
    },
    description: {
      type: String,
      value: '暂时没有相关内容'
    },
    actionText: {
      type: String,
      value: ''
    },
    showAction: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    onAction() {
      this.triggerEvent('action');
    }
  }
})