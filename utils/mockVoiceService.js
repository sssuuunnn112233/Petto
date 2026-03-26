// 模拟语音服务 - 用于开发环境测试
const BAIDU_VOICE_CONFIG = require('./baiduConfig.js');

/**
 * 检测是否为开发环境
 */
function isDevelopmentMode() {
  return typeof __wxConfig !== 'undefined' && __wxConfig.platform === 'devtools';
}

/**
 * 模拟录音管理器
 */
class MockRecorderManager {
  constructor() {
    this.isRecording = false;
    this.listeners = {};
  }
  
  start(options) {
    console.log('🎤 [模拟] 录音开始:', options);
    this.isRecording = true;
    
    // 模拟录音开始事件
    setTimeout(() => {
      if (this.listeners.onStart) {
        this.listeners.onStart();
      }
    }, 100);
    
    // 模拟录音结束（3秒后自动停止）
    setTimeout(() => {
      this.stop();
    }, 3000);
  }
  
  stop() {
    if (!this.isRecording) return;
    
    console.log('🎤 [模拟] 录音结束');
    this.isRecording = false;
    
    // 模拟录音结果
    const mockResult = {
      tempFilePath: '/mock/audio/test_' + Date.now() + '.mp3',
      fileSize: 45678,
      duration: 3000
    };
    
    if (this.listeners.onStop) {
      this.listeners.onStop(mockResult);
    }
  }
  
  onStart(callback) { this.listeners.onStart = callback; }
  onStop(callback) { this.listeners.onStop = callback; }
  onError(callback) { this.listeners.onError = callback; }
}

/**
 * 模拟语音识别结果
 */
const MOCK_RECOGNITION_RESULTS = [
  '你好呀',
  '我想和你聊天',
  '今天天气真好',
  '我今天心情不太好',
  '你可以安慰一下我吗',
  '你真可爱',
  '我很开心',
  '谢谢你',
  '再见',
  '晚安'
];

/**
 * 模拟语音识别
 */
async function mockSpeechToText(tempFilePath) {
  console.log('🔍 [模拟] 语音识别开始:', tempFilePath);
  
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
  
  // 随机选择识别结果
  const result = MOCK_RECOGNITION_RESULTS[Math.floor(Math.random() * MOCK_RECOGNITION_RESULTS.length)];
  
  // 10%的概率模拟识别失败
  if (Math.random() < 0.1) {
    console.log('❌ [模拟] 识别失败');
    throw new Error('模拟识别失败：音频质量过差');
  }
  
  console.log('✅ [模拟] 识别成功:', result);
  return result;
}

/**
 * 模拟语音合成
 */
async function mockTextToSpeech(text) {
  console.log('🔊 [模拟] 语音合成开始:', text);
  
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
  
  // 5%的概率模拟合成失败
  if (Math.random() < 0.05) {
    console.log('❌ [模拟] 合成失败');
    throw new Error('模拟合成失败：服务器繁忙');
  }
  
  // 返回模拟音频路径
  const mockAudioPath = 'mock_audio_path_' + Date.now();
  console.log('✅ [模拟] 合成成功:', mockAudioPath);
  return mockAudioPath;
}

/**
 * 模拟获取百度Access Token
 */
async function mockGetBaiduAccessToken() {
  console.log('🔑 [模拟] 获取百度Token');
  
  // 检查配置
  if (!BAIDU_VOICE_CONFIG.API_KEY || !BAIDU_VOICE_CONFIG.SECRET_KEY) {
    throw new Error('百度API配置不完整');
  }
  
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 返回模拟Token
  const mockToken = 'mock_token_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
  console.log('✅ [模拟] Token获取成功:', mockToken.substring(0, 20) + '...');
  return mockToken;
}

/**
 * 创建模拟录音管理器
 */
function createMockRecorderManager() {
  if (isDevelopmentMode()) {
    console.log('🔧 [模拟] 使用模拟录音管理器');
    return new MockRecorderManager();
  } else {
    return wx.getRecorderManager();
  }
}

/**
 * 测试模式配置
 */
const TEST_CONFIG = {
  // 识别成功率（0-1）
  recognitionSuccessRate: 0.9,
  
  // 合成成功率（0-1）
  synthesisSuccessRate: 0.95,
  
  // 网络延迟范围（毫秒）
  networkDelayRange: [500, 2000],
  
  // 是否显示详细日志
  verboseLogging: true
};

module.exports = {
  isDevelopmentMode,
  MockRecorderManager,
  mockSpeechToText,
  mockTextToSpeech,
  mockGetBaiduAccessToken,
  createMockRecorderManager,
  TEST_CONFIG,
  MOCK_RECOGNITION_RESULTS
};