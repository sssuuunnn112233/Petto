// 兼容版百度语音识别
const BAIDU_VOICE_CONFIG = require('./baiduConfig.js');

/**
 * 兼容版语音识别 - 针对小文件优化
 */
async function compatibleASR(tempFilePath) {
  console.log('=== 兼容版语音识别开始 ===');
  
  try {
    // 1. 检查文件大小
    const fileInfo = await getFileInfo(tempFilePath);
    console.log('📁 文件大小:', fileInfo.size, '字节', '=', Math.round(fileInfo.size/1024), 'KB');
    
    // 检查文件大小限制（百度API限制2MB）
    if (fileInfo.size > 2 * 1024 * 1024) {
      throw new Error(`文件过大: ${Math.round(fileInfo.size/1024/1024)}MB，超过2MB限制`);
    }
    
    // 2. 获取Access Token
    const token = await getAccessToken();
    console.log('✅ Token获取成功');
    
    // 3. 尝试不同的音频格式参数（针对小程序录音优化）
    const formats = [
      { format: 'mp3', rate: 8000 },   // 低采样率MP3
      { format: 'mp3', rate: 16000 },  // 标准MP3
      { format: 'wav', rate: 8000 },   // 低采样率WAV
      { format: 'pcm', rate: 8000 }    // PCM格式
    ];
    
    for (let i = 0; i < formats.length; i++) {
      const formatConfig = formats[i];
      console.log(`🔄 尝试格式 ${i + 1}/${formats.length}:`, formatConfig);
      
      try {
        const result = await tryASRWithFormat(tempFilePath, token, formatConfig, fileInfo.size);
        console.log('✅ 识别成功，格式:', formatConfig, '结果:', result);
        return result;
      } catch (error) {
        console.log(`❌ 格式 ${formatConfig.format}/${formatConfig.rate} 失败:`, error.message);
        if (i === formats.length - 1) {
          throw error; // 最后一个格式也失败了
        }
      }
    }
    
  } catch (error) {
    console.error('❌ 兼容版识别失败:', error);
    throw error;
  }
}

// 尝试特定格式的识别
async function tryASRWithFormat(tempFilePath, token, formatConfig, fileSize) {
  // 读取音频文件
  const audioBase64 = await readAudioFile(tempFilePath);
  
  // 构建请求参数
  const requestData = {
    format: formatConfig.format,
    rate: formatConfig.rate,
    channel: 1,
    cuid: 'petto_' + Date.now(),
    token: token,
    speech: audioBase64,
    len: fileSize
  };
  
  console.log('📤 ASR请求参数:', {
    format: requestData.format,
    rate: requestData.rate,
    channel: requestData.channel,
    fileSize: fileSize,
    fileSizeKB: Math.round(fileSize/1024),
    speechLength: audioBase64.length,
    base64SizeKB: Math.round(audioBase64.length * 0.75 / 1024) // base64大约比原文件大33%
  });
  
  return new Promise((resolve, reject) => {
    wx.request({
      url: 'https://vop.baidu.com/server_api',
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: requestData,
      success: (response) => {
        console.log(`📥 ${formatConfig.format}/${formatConfig.rate} 响应:`, response.data);
        
        if (response.data.err_no === 0 && response.data.result && response.data.result.length > 0) {
          resolve(response.data.result[0]);
        } else {
          const error = `${formatConfig.format}/${formatConfig.rate} 错误${response.data.err_no}: ${response.data.err_msg}`;
          reject(new Error(error));
        }
      },
      fail: (err) => {
        reject(new Error(`${formatConfig.format}/${formatConfig.rate} 请求失败: ${err.errMsg}`));
      }
    });
  });
}

// 获取Access Token
function getAccessToken() {
  return new Promise((resolve, reject) => {
    const params = {
      grant_type: 'client_credentials',
      client_id: BAIDU_VOICE_CONFIG.API_KEY,
      client_secret: BAIDU_VOICE_CONFIG.SECRET_KEY
    };
    
    const queryString = Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');
    
    wx.request({
      url: `https://aip.baidubce.com/oauth/2.0/token?${queryString}`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data.access_token) {
          resolve(res.data.access_token);
        } else {
          reject(new Error('Token获取失败'));
        }
      },
      fail: reject
    });
  });
}

// 获取文件信息
function getFileInfo(filePath) {
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().getFileInfo({
      filePath: filePath,
      success: resolve,
      fail: reject
    });
  });
}

// 读取音频文件
function readAudioFile(filePath) {
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().readFile({
      filePath: filePath,
      encoding: 'base64',
      success: (res) => resolve(res.data),
      fail: reject
    });
  });
}

module.exports = {
  compatibleASR
};