/**
 * 百度语音服务配置
 * 
 * 获取步骤：
 * 1. 访问 https://console.bce.baidu.com/ai/#/ai/speech/overview/index
 * 2. 创建应用
 * 3. 获取 API Key 和 Secret Key
 * 4. 填入下方配置
 * 
 * 注意：请确保API Key和Secret Key来自同一个应用
 */

const BAIDU_VOICE_CONFIG = {
  // 替换为你的百度 API Key（通常24位字符）
  API_KEY: 'k71M0RA7WIaDFNlnpvWF7jJ7',
  
  // 替换为你的百度 Secret Key（通常32位字符）
  SECRET_KEY: '6CPIKjBRXY7UlIhbHb5xecXYCNYdyPC7',
  
  // 以下字段会自动管理，无需修改
  ACCESS_TOKEN: '',
  TOKEN_EXPIRES_AT: 0
};

// 配置验证
function validateConfig() {
  const issues = [];
  
  if (!BAIDU_VOICE_CONFIG.API_KEY || BAIDU_VOICE_CONFIG.API_KEY === 'YOUR_API_KEY_HERE') {
    issues.push('API_KEY 未配置');
  } else if (BAIDU_VOICE_CONFIG.API_KEY.length !== 24) {
    issues.push('API_KEY 长度不正确（应为24位）');
  }
  
  if (!BAIDU_VOICE_CONFIG.SECRET_KEY || BAIDU_VOICE_CONFIG.SECRET_KEY === 'YOUR_SECRET_KEY_HERE') {
    issues.push('SECRET_KEY 未配置');
  } else if (BAIDU_VOICE_CONFIG.SECRET_KEY.length !== 32) {
    issues.push('SECRET_KEY 长度不正确（应为32位）');
  }
  
  if (issues.length > 0) {
    console.warn('⚠️ 百度语音配置问题:', issues);
    return false;
  }
  
  console.log('✅ 百度语音配置验证通过');
  return true;
}

// 导出时验证配置
validateConfig();

module.exports = BAIDU_VOICE_CONFIG;
