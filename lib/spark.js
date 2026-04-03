/**
 * 讯飞星火 X2 API 调用模块
 * 接口文档：https://www.xfyun.cn/doc/spark/X1http.html
 *
 * 接口地址：https://spark-api-open.xf-yun.com/x2/chat/completions
 * model 参数：spark-x
 * 认证方式：Bearer Token（APIpassword）
 */

const SPARK_API_URL = 'https://spark-api-open.xf-yun.com/v1/chat/completions';

/**
 * 调用星火 Lite 大模型（非流式）- 响应更快
 * @param {string} apiPassword - 控制台获取的 APIpassword（Bearer Token）
 * @param {string} userMessage - 用户消息
 * @param {string} [userId]    - 用户唯一标识（可选，用于区分会话）
 * @param {boolean} [enableWebSearch=false] - 是否启用联网搜索
 * @returns {Promise<string>} 模型回复内容
 */
export async function callSparkX2(apiPassword, userMessage, userId = '', enableWebSearch = false) {
  // 构建消息，联网搜索时添加系统提示
  const messages = [];
  if (enableWebSearch) {
    messages.push({
      role: 'system',
      content: '请使用联网搜索功能获取最新信息来回答用户问题。回答要简洁，控制在200字以内。',
    });
  }
  messages.push({
    role: 'user',
    content: userMessage,
  });

  const body = {
    model: enableWebSearch ? 'generalv3.5' : 'lite',
    messages: messages,
    stream: false,
    // 限制输出长度，加快响应速度（微信5秒限制）
    max_tokens: 250,
  };

  if (userId) {
    body.user = userId;
  }

  // 可选：开启联网搜索（Lite 支持且响应快）
  if (enableWebSearch) {
    body.tools = [
      {
        type: 'web_search',
        web_search: {
          enable: true,
          search_mode: 'normal',
        },
      },
    ];
  }

  console.log('[Debug] 调用Spark API, 模型:', body.model, '联网搜索:', enableWebSearch);
  
  const response = await fetch(SPARK_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiPassword}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    // 微信要求 5s 内响应，设置超时以便返回友好提示
    // 普通查询4.5s，联网搜索给5.5s（Max模型稍慢但联网效果更好）
    signal: AbortSignal.timeout(enableWebSearch ? 5500 : 4500),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Spark API error ${response.status}: ${errText}`);
  }

  const data = await response.json();

  // 解析返回内容
  if (data.code !== 0) {
    throw new Error(`Spark API returned error: code=${data.code}, message=${data.message}`);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Spark API returned empty content');
  }

  return content.trim();
}
