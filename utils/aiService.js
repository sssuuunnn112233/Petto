// AI 对话和语音服务

// 导入百度语音配置
const BAIDU_VOICE_CONFIG = require('./baiduConfig.js');
// 导入通义千问配置
const QWEN_CONFIG = require('./qwenConfig.js');

// 宠物人设
const PET_PERSONA = `你是一只可爱的小猫咪，名字叫 Petto。你的性格特点：
- 活泼开朗，喜欢和主人互动
- 说话时会用"喵～"、"嘿嘿"等可爱的语气词
- 回答简短有趣，不超过50字
- 偶尔会撒娇、卖萌
- 关心主人的心情和生活
请用第一人称回复，保持可爱的宠物口吻。`;

/**
 * 获取 AI 回复（通义千问）
 * @param {string} userMessage - 用户消息
 * @param {Array} chatHistory - 聊天历史（可选）
 * @returns {Promise<string>} AI 回复
 */
async function getAIResponse(userMessage, chatHistory = []) {
  // 检查 API Key 是否配置
  if (!QWEN_CONFIG.API_KEY || QWEN_CONFIG.API_KEY === 'YOUR_QWEN_API_KEY_HERE') {
    console.warn('通义千问 API Key 未配置，使用模拟模式');
    return getSimulatedResponse(userMessage);
  }

  console.log('尝试调用通义千问 API...');

  try {
    // 构建对话历史
    const messages = [
      { role: 'system', content: PET_PERSONA }
    ];
    
    // 添加最近的聊天记录（最多保留5轮对话）
    if (chatHistory && chatHistory.length > 0) {
      const recentHistory = chatHistory.slice(-10); // 最近10条消息
      recentHistory.forEach(chat => {
        if (chat.from === 'user') {
          messages.push({ role: 'user', content: chat.text });
        } else if (chat.from === 'pet') {
          messages.push({ role: 'assistant', content: chat.text });
        }
      });
    }
    
    // 添加当前用户消息
    messages.push({ role: 'user', content: userMessage });

    return new Promise((resolve) => {
      wx.request({
        url: QWEN_CONFIG.API_URL,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${QWEN_CONFIG.API_KEY}`
        },
        data: {
          model: QWEN_CONFIG.MODEL,
          input: {
            messages: messages
          },
          parameters: QWEN_CONFIG.PARAMETERS
        },
        timeout: 10000, // 10秒超时
        success: (res) => {
          console.log('✅ 通义千问 API 调用成功:', res.data);
          
          if (res.data && res.data.output && res.data.output.text) {
            let response = res.data.output.text.trim();
            
            // 确保回复不超过100字
            if (response.length > 100) {
              response = response.substring(0, 97) + '...';
            }
            
            console.log('🤖 AI回复:', response);
            resolve(response);
          } else if (res.data && res.data.code) {
            // API 错误
            console.error('❌ 通义千问 API 错误:', res.data.message);
            console.log('⚠️ API错误，降级到模拟模式');
            resolve(getSimulatedResponse(userMessage));
          } else {
            console.log('⚠️ 响应格式错误，降级到模拟模式');
            resolve(getSimulatedResponse(userMessage));
          }
        },
        fail: (err) => {
          console.error('❌ 请求通义千问失败:', err);
          
          // 检查具体的错误类型
          if (err.errMsg && err.errMsg.includes('url not in domain list')) {
            console.log('⚠️ 域名未配置，降级到模拟模式。请在微信公众平台配置合法域名：https://dashscope.aliyuncs.com');
          } else if (err.errMsg && err.errMsg.includes('timeout')) {
            console.log('⚠️ 请求超时，降级到模拟模式');
          } else {
            console.log('⚠️ 网络错误，降级到模拟模式');
          }
          
          resolve(getSimulatedResponse(userMessage));
        }
      });
    });
  } catch (error) {
    console.error('❌ 通义千问调用异常:', error);
    console.log('⚠️ 异常处理，降级到模拟模式');
    return getSimulatedResponse(userMessage);
  }
}

/**
 * 模拟 AI 回复（备用方案）
 * @param {string} userMessage - 用户消息
 * @returns {string} 模拟回复
 */
function getSimulatedResponse(userMessage) {
  const responses = [
    '汪～我听到啦！你说得真有趣呢！',
    '嘿嘿，我也这么觉得！',
    '汪汪～陪我玩一会儿吧！',
    '你今天心情好像不错呀～',
    '我好喜欢你呀，主人！',
    '汪～肚子有点饿了呢...',
    '嘿嘿，你真好！',
    '我想出去散步啦～',
    '汪汪！我在认真听你说话哦！',
    '你说的话我都记在心里啦～'
  ];
  
  // 根据关键词智能回复
  const msg = userMessage.toLowerCase();
  if (msg.includes('饿') || msg.includes('吃')) {
    return '汪～我也饿了！给我点好吃的吧！';
  } else if (msg.includes('玩') || msg.includes('陪')) {
    return '嘿嘿，好呀！我最喜欢和你玩啦～';
  } else if (msg.includes('累') || msg.includes('困')) {
    return '汪～那你要好好休息哦，我陪着你！';
  } else if (msg.includes('开心') || msg.includes('高兴')) {
    return '嘿嘿，看到你开心我也开心！';
  } else if (msg.includes('难过') || msg.includes('伤心')) {
    return '汪～别难过啦，我会一直陪着你的！';
  } else {
    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex];
  }
}

/**
 * 获取百度 Access Token
 * Token 有效期 30 天，会自动缓存和刷新
 */
async function getBaiduAccessToken() {
  // 检查是否有缓存的 token 且未过期
  const now = Date.now();
  if (BAIDU_VOICE_CONFIG.ACCESS_TOKEN && BAIDU_VOICE_CONFIG.TOKEN_EXPIRES_AT > now) {
    return BAIDU_VOICE_CONFIG.ACCESS_TOKEN;
  }
  
  console.log('获取百度 Access Token...');
  
  // 获取新的 token
  return new Promise((resolve, reject) => {
    // 构建URL参数
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
      header: {
        'Content-Type': 'application/json'
      },
      success: (res) => {
        console.log('百度 Token API 响应:', res);
        
        if (res.statusCode === 200 && res.data.access_token) {
          // 缓存 token，提前 1 天过期以确保安全
          BAIDU_VOICE_CONFIG.ACCESS_TOKEN = res.data.access_token;
          BAIDU_VOICE_CONFIG.TOKEN_EXPIRES_AT = now + (res.data.expires_in - 86400) * 1000;
          
          console.log('✅ 百度 Access Token 获取成功');
          resolve(res.data.access_token);
        } else {
          console.error('❌ 获取 Access Token 失败:', res.data);
          reject(new Error('获取 Access Token 失败: ' + JSON.stringify(res.data)));
        }
      },
      fail: (err) => {
        console.error('❌ 获取 Access Token 请求失败:', err);
        reject(err);
      }
    });
  });
}

/**
 * 语音转文字
 * 使用百度语音识别（每天 5000 次免费）
 * 
 * @param {string} tempFilePath - 录音文件路径
 * @returns {Promise<string>} 识别的文字
 */
async function speechToText(tempFilePath) {
  try {
    const token = await getBaiduAccessToken();
    return await callBaiduASR(tempFilePath, token);
  } catch (error) {
    console.error('语音识别失败:', error);
    throw error;
  }
}

/**
 * 调用百度语音识别
 */
async function callBaiduASR(tempFilePath, token) {
  return new Promise((resolve, reject) => {
    // 先获取文件信息
    wx.getFileSystemManager().getFileInfo({
      filePath: tempFilePath,
      success: (fileInfo) => {
        console.log('音频文件信息:', fileInfo);
        
        // 读取文件为base64
        wx.getFileSystemManager().readFile({
          filePath: tempFilePath,
          encoding: 'base64',
          success: (res) => {
            const audioData = res.data;
            console.log('音频数据长度:', audioData.length, '字符');
            console.log('文件大小:', fileInfo.size, '字节');
            
            const requestData = {
              format: 'mp3',
              rate: 16000,
              channel: 1,
              cuid: 'petto_miniapp_' + Date.now(),
              token: token,
              speech: audioData,
              len: fileInfo.size  // 使用实际文件大小（字节）
            };
            
            console.log('发送语音识别请求:', {
              ...requestData,
              speech: audioData.substring(0, 50) + '...',  // 只显示前50个字符
              token: token.substring(0, 20) + '...'
            });
            
            wx.request({
              url: 'https://vop.baidu.com/server_api',
              method: 'POST',
              header: {
                'Content-Type': 'application/json'
              },
              data: requestData,
              success: (response) => {
                console.log('🎤 百度语音识别响应:', response.data);
                
                if (response.data.err_no === 0 && response.data.result && response.data.result.length > 0) {
                  const recognizedText = response.data.result[0];
                  console.log('✅ 识别成功:', recognizedText);
                  resolve(recognizedText);
                } else {
                  const errorMsg = response.data.err_msg || '识别失败';
                  const errorCode = response.data.err_no || 'unknown';
                  console.error('❌ 识别失败:', `错误码${errorCode}: ${errorMsg}`);
                  reject(new Error(`识别失败(${errorCode}): ${errorMsg}`));
                }
              },
              fail: (err) => {
                console.error('❌ 语音识别请求失败:', err);
                reject(err);
              }
            });
          },
          fail: (err) => {
            console.error('❌ 读取音频文件失败:', err);
            reject(err);
          }
        });
      },
      fail: (err) => {
        console.error('❌ 获取文件信息失败:', err);
        reject(err);
      }
    });
  });
}

/**
 * 文字转语音
 * 使用百度语音合成（每天 5000 次免费）
 * 
 * @param {string} text - 要转换的文字
 * @returns {Promise<string>} 音频文件路径
 */
async function textToSpeech(text) {
  try {
    // 清理旧的语音文件
    await cleanupOldAudioFiles();
    
    const token = await getBaiduAccessToken();
    return await callBaiduTTS(text, token);
  } catch (error) {
    console.error('语音合成失败:', error);
    throw error;
  }
}

/**
 * 调用百度语音合成
 */
async function callBaiduTTS(text, token) {
  return new Promise((resolve, reject) => {
    const params = {
      tex: text,
      tok: token,
      cuid: 'petto_miniapp',
      ctp: 1,
      lan: 'zh',
      spd: 5,  // 语速：0-15
      pit: 6,  // 音调：0-15（稍高一点更可爱）
      vol: 8,  // 音量：0-15
      per: 4,  // 发音人：4=度丫丫（可爱女声）
      aue: 3   // 3=mp3格式
    };
    
    const queryString = Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');
    
    wx.request({
      url: `https://tsn.baidu.com/text2audio?${queryString}`,
      method: 'GET',
      responseType: 'arraybuffer',
      success: (response) => {
        console.log('百度语音合成响应状态:', response.statusCode);
        
        if (response.statusCode === 200 && response.data) {
          const fs = wx.getFileSystemManager();
          const filePath = `${wx.env.USER_DATA_PATH}/tts_${Date.now()}.mp3`;
          
          fs.writeFile({
            filePath: filePath,
            data: response.data,
            success: () => {
              console.log('语音文件保存成功:', filePath);
              resolve(filePath);
            },
            fail: (err) => {
              console.error('保存文件失败:', err);
              reject(err);
            }
          });
        } else {
          try {
            const decoder = new TextDecoder('utf-8');
            const errorText = decoder.decode(new Uint8Array(response.data));
            console.error('语音合成失败:', errorText);
            reject(new Error(errorText));
          } catch (e) {
            reject(new Error('语音合成失败'));
          }
        }
      },
      fail: (err) => {
        console.error('请求失败:', err);
        reject(err);
      }
    });
  });
}

/**
 * 清理旧的语音文件
 */
async function cleanupOldAudioFiles() {
  try {
    const fs = wx.getFileSystemManager();
    const userDataPath = wx.env.USER_DATA_PATH;
    
    // 读取用户数据目录
    fs.readdir({
      dirPath: userDataPath,
      success: (res) => {
        const audioFiles = res.files.filter(file => file.startsWith('tts_') && file.endsWith('.mp3'));
        
        // 如果语音文件超过5个，删除最旧的文件
        if (audioFiles.length > 5) {
          // 按文件名排序（包含时间戳）
          audioFiles.sort();
          const filesToDelete = audioFiles.slice(0, audioFiles.length - 5);
          
          filesToDelete.forEach(file => {
            const filePath = `${userDataPath}/${file}`;
            fs.unlink({
              filePath: filePath,
              success: () => {
                console.log('🗑️ 已清理旧语音文件:', file);
              },
              fail: (err) => {
                console.warn('清理语音文件失败:', file, err);
              }
            });
          });
          
          console.log('🧹 语音文件清理完成，删除了', filesToDelete.length, '个旧文件');
        }
      },
      fail: (err) => {
        console.warn('读取用户数据目录失败:', err);
      }
    });
  } catch (error) {
    console.warn('清理语音文件时出错:', error);
  }
}

module.exports = {
  getAIResponse,
  speechToText,
  textToSpeech
};
