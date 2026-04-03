/**

* 接口文档：https://www.xfyun.cn/doc/spark/X1http.html
输入：  *
* 接口地址：https://spark-api-open.xf-yun.com/x2/chat/completions
* 模型参数：火花-x

* /

常量 SPARK_API_URL = 'https://spark-api-open.xf-yun.com/v1/chat/completions';

/**
* 调用星火 Lite 大模型（非流式）- 响应更快
* @param {string} apiPassword - 从控制台获取的 API 密码（Bearer Token）
* @param {string} userMessage - 用户消息
* @param {string} [userId]    - 用户唯一标识（可选，用于区分会话）
* @param {boolean} [enableWebSearch=false] - 是否启用联网搜索
* @returns {Promise<string>} 模型回复内容
* /
导出 异步 函数 调用SparkX2(api密码, 用户消息, 用户ID = '', 启用网页搜索 =  false) {
  const body = {
    模型：'lite'

      {
        角色：'用户'
        内容：用户消息，
      },
    ]，
    流: false,
    // 限制输出长度，加快响应速度
    max_tokens: 500,


  if (userId) {
    body.user = userId;
  }

  // 可选：开启联网搜索
  if (启用网页搜索) {

      {
        类型: '网页搜索'
        网页搜索：{
          启用：真
          搜索模式: '正常',
        },
      },
    ];
  }

  const response = await fetch(SPARK_API_URL, {
    方法: 'POST'
    标题: {
      'Authorization': `Bearer ${apiPassword}`,
      'Content-Type': 'application/json'
    }
    body: JSON.stringify(body),
    // 微信要求 5s 内响应，设置 4.5s 超时以便返回友好提示



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
