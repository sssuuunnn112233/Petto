// 通义千问 API 配置
// 请在阿里云控制台申请 API Key：https://dashscope.console.aliyun.com/

const QWEN_CONFIG = {
  // 请替换为你的 API Key
  API_KEY: 'sk-f9e633ead2424393b85ca87fdec41621',
  
  // API 端点
  API_URL: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
  
  // 模型配置
  MODEL: 'qwen-turbo', // 可选：qwen-turbo, qwen-plus, qwen-max
  
  // 生成参数
  PARAMETERS: {
    max_tokens: 100,      // 最大回复长度
    temperature: 0.8,     // 创造性 (0-1)
    top_p: 0.9,          // 多样性 (0-1)
    repetition_penalty: 1.1 // 重复惩罚
  }
};

module.exports = QWEN_CONFIG;