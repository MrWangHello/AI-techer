/**
 * Edge-TTS Cloudflare Worker
 * 
 * 功能：接收前端文本请求，通过 WebSocket 连接微软 Edge-TTS 服务，
 * 返回 MP3 音频数据。
 * 
 * 部署方法：
 * 1. 安装 wrangler: npm install -g wrangler
 * 2. 登录: wrangler login
 * 3. 部署: wrangler deploy workers/edge-tts.js --name edge-tts
 * 4. 获取 URL: https://edge-tts.你的用户名.workers.dev
 * 
 * 环境变量（可选）：
 * - TTS_TRUSTED_TOKEN: 微软的 TrustedClientToken（默认值通用）
 * - CORS_ORIGIN: 允许的跨域来源（默认 *）
 */

const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const WSS_URL = 'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1';
const VOICES_LIST_URL = 'https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list';

// 音频输出格式：24kHz 48kbps MP3（平衡质量与大小）
const OUTPUT_FORMAT = 'audio-24khz-48kbitrate-mono-mp3';

// 默认音色映射
const DEFAULT_VOICES = {
  'zh-CN': 'zh-CN-XiaoxiaoNeural',
  'en-US': 'en-US-AriaNeural',
};

export default {
  async fetch(request) {
    // CORS 处理
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const url = new URL(request.url);

    // GET /voices - 获取可用音色列表
    if (url.pathname === '/voices' && request.method === 'GET') {
      return handleVoices();
    }

    // POST /synthesize - 语音合成
    if (url.pathname === '/synthesize' && request.method === 'POST') {
      return handleSynthesize(request);
    }

    // GET / - 状态检查
    if (url.pathname === '/') {
      return new Response(JSON.stringify({ status: 'ok', service: 'edge-tts' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  },
};

// ============ 音色列表 ============

async function handleVoices() {
  try {
    const resp = await fetch(VOICES_LIST_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
      },
    });
    const voices = await resp.json();

    // 精简返回结构，只返回前端需要的字段
    const simplified = voices.map((v) => ({
      name: v.ShortName,
      locale: v.Locale,
      gender: v.Gender,
      friendlyName: v.FriendlyName || v.LocalName,
    }));

    return new Response(JSON.stringify(simplified), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message, fallback: getFallbackVoices() }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

// 兜底音色列表（当 API 请求失败时使用）
function getFallbackVoices() {
  return [
    { name: 'zh-CN-XiaoxiaoNeural', locale: 'zh-CN', gender: 'Female', friendlyName: '晓晓' },
    { name: 'zh-CN-XiaoyiNeural', locale: 'zh-CN', gender: 'Female', friendlyName: '晓伊' },
    { name: 'zh-CN-YunjianNeural', locale: 'zh-CN', gender: 'Male', friendlyName: '云健' },
    { name: 'zh-CN-XiaohanNeural', locale: 'zh-CN', gender: 'Female', friendlyName: '晓涵' },
    { name: 'zh-CN-XiaomengNeural', locale: 'zh-CN', gender: 'Female', friendlyName: '晓萌' },
    { name: 'en-US-AriaNeural', locale: 'en-US', gender: 'Female', friendlyName: 'Aria' },
    { name: 'en-US-JennyNeural', locale: 'en-US', gender: 'Female', friendlyName: 'Jenny' },
    { name: 'en-US-GuyNeural', locale: 'en-US', gender: 'Male', friendlyName: 'Guy' },
    { name: 'en-US-AnaNeural', locale: 'en-US', gender: 'Female', friendlyName: 'Ana' },
  ];
}

// ============ 语音合成 ============

async function handleSynthesize(request) {
  try {
    const body = await request.json();
    const { text, voice, rate = 0, pitch = 0, lang = 'zh-CN' } = body;

    if (!text || !text.trim()) {
      return new Response(JSON.stringify({ error: 'text is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // 选择音色
    const voiceName = voice || DEFAULT_VOICES[lang] || DEFAULT_VOICES['zh-CN'];

    // 生成 SSML
    const ssml = buildSSML(text.trim(), voiceName, rate, pitch);

    // 通过 WebSocket 获取音频
    const connectionId = crypto.randomUUID();
    const audioData = await synthesizeAudio(connectionId, ssml);

    // 返回 MP3 音频
    return new Response(audioData, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioData.byteLength.toString(),
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'Content-Length',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: `Synthesis failed: ${e.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

// 构建 SSML
function buildSSML(text, voice, rate, pitch) {
  const rateStr = rate >= 0 ? `+${rate}%` : `${rate}%`;
  const pitchStr = pitch >= 0 ? `+${pitch}Hz` : `${pitch}Hz`;

  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${voice.split('-').slice(0, 2).join('-')}">
    <voice name="${voice}">
      <prosody rate="${rateStr}" pitch="${pitchStr}">
        ${escapeXml(text)}
      </prosody>
    </voice>
  </speak>`;
}

function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ============ WebSocket 连接实现 ============

async function synthesizeAudio(connectionId, ssml) {
  const wsUrl = `${WSS_URL}?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&ConnectionId=${connectionId}`;
  console.log('WebSocket URL:', wsUrl);

  return new Promise((resolve, reject) => {
    let audioChunks = [];
    let turnEndReceived = false;
    let timeoutId = null;

    try {
      const ws = new WebSocket(wsUrl);
      console.log('WebSocket created');

      // 超时保护
      timeoutId = setTimeout(() => {
        try { ws.close(); } catch (_) {}
        reject(new Error('WebSocket timeout (30s)'));
      }, 30000);

      ws.onopen = () => {
        console.log('WebSocket opened');
        // 发送配置消息
        const configMsg = JSON.stringify({
          context: {
            synthesis: {
              audio: {
                metadataoptions: {
                  sentenceBoundaryEnabled: false,
                  wordBoundaryEnabled: false,
                },
                outputFormat: OUTPUT_FORMAT,
              },
            },
          },
        });
        ws.send(configMsg);
        console.log('Config message sent');

        // 发送 SSML
        ws.send(ssml);
        console.log('SSML sent');

      }; // 修复：添加分号

      ws.onmessage = (event) => {
        // 二进制消息 = 音频数据
        if (event.data instanceof ArrayBuffer) {
          const data = new Uint8Array(event.data);

          if (data.length > 0) {
            const headerByte = data[0];

            // 0x00 = 音频数据
            if (headerByte === 0x00 && data.length > 1) {
              audioChunks.push(data.slice(1));
            }
            // 0x02 = 元数据（忽略）
          }
        } else {
          // 文本消息
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'turn.end') {
              turnEndReceived = true;
              clearTimeout(timeoutId);
              try { ws.close(); } catch (_) {}

              // 合并所有音频块
              const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
              if (totalLength === 0) {
                reject(new Error('No audio data received'));
                return;
              }
              const result = new Uint8Array(totalLength);
              let offset = 0;
              for (const chunk of audioChunks) {
                result.set(chunk, offset);
                offset += chunk.length;
              }
              resolve(result.buffer);
            }
          } catch (_) {
            // 忽略非 JSON 消息
          }
        }
      };

      ws.onerror = (e) => {
        clearTimeout(timeoutId);
        reject(new Error(`WebSocket error: ${e.message || 'unknown'}`));
      };

      ws.onclose = () => {
        clearTimeout(timeoutId);
        // 如果已经收到 turn.end，正常关闭
        if (turnEndReceived) return;
        // 如果还没收到 turn.end 但有音频数据，也返回
        if (audioChunks.length > 0) {
          const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
          const result = new Uint8Array(totalLength);
          let offset = 0;
          for (const chunk of audioChunks) {
            result.set(chunk, offset);
            offset += chunk.length;
          }
          resolve(result.buffer);
        } else {
          reject(new Error('WebSocket closed unexpectedly'));
        }
      };
    } catch (e) {
      clearTimeout(timeoutId);
      reject(new Error(`WebSocket creation failed: ${e.message}`));
    }
  });
}