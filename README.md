# spark-wechat-vercel

> 🤖 基于 **Vercel Serverless** 将**讯飞星火 X2** 接入**微信公众号**，无需服务器、无需备案，零成本部署。

---

## 项目结构

```
spark-wechat-vercel/
├── api/
│   └── wechat.js        # Vercel Serverless 入口（微信消息路由）
├── lib/
│   ├── wechat.js        # 微信签名验证、XML 解析、消息回复
│   └── spark.js         # 星火 X2 API 调用封装
├── vercel.json          # Vercel 部署配置
├── package.json
└── README.md
```

---

## 准备工作

### 1. 讯飞星火 X2 API

1. 前往 [讯飞开放平台](https://xinghuo.xfyun.cn/) 注册/登录
2. 控制台创建应用，开通**星火深度推理 X2** 服务
3. 进入 [星火 X2 控制台](https://console.xfyun.cn/services/bmx1) 获取 **APIpassword**
   - 格式形如：`xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - 调用时作为 Bearer Token 使用

### 2. 微信公众号

- 登录 [微信公众平台](https://mp.weixin.qq.com/)，进入「开发 → 基本配置」
- 自定义一个 **Token**（字母+数字，长度 3~32 位，例如 `MySparkBot2026`）
- **URL** 先留空，部署 Vercel 后再填入

### 3. 安装 Vercel CLI（可选，用于本地调试）

```bash
npm install -g vercel
vercel login
```

---

## 一键部署到 Vercel

### 方法一：GitHub + Vercel 自动部署（推荐）

1. **Fork 或 Push** 本项目到你的 GitHub 仓库
2. 打开 [https://vercel.com/new](https://vercel.com/new)
3. 导入对应 GitHub 仓库
4. 点击 **Deploy**，等待部署完成
5. 在 Vercel 项目页面 → **Settings → Environment Variables**，添加以下变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `WECHAT_TOKEN` | `MySparkBot2026` | 与公众号后台配置保持一致 |
| `SPARK_API_PASSWORD` | `你的 APIpassword` | 讯飞控制台获取 |
| `ENABLE_WEB_SEARCH` | `true` 或 `false` | 是否开启联网搜索（可选） |

6. 重新部署一次使环境变量生效（Deployments → Redeploy）

### 方法二：Vercel CLI 本地部署

```bash
# 克隆项目
git clone <你的仓库地址>
cd spark-wechat-vercel

# 安装依赖
npm install

# 本地测试
vercel dev

# 生产部署
vercel --prod
```

---

## 配置微信公众号

部署成功后，Vercel 会给你一个域名，例如：
```
https://spark-wechat.vercel.app
```

1. 回到微信公众平台「开发 → 基本配置 → 服务器配置」
2. 填入以下信息：

| 字段 | 值 |
|------|----|
| **URL** | `https://spark-wechat.vercel.app/wechat` |
| **Token** | 与 `WECHAT_TOKEN` 环境变量相同 |
| **EncodingAESKey** | 随机生成即可（当前版本使用明文模式）|
| **消息加解密方式** | 明文模式 |

3. 点击「提交」验证通过后，启用服务器配置

---

## 使用效果

配置完成后，在微信公众号聊天窗口直接发送文字，AI 助手将调用星火 X2 回复。

```
用户：你好，介绍一下你自己
AI：您好！我是科大讯飞推出的星火认知大模型 X2 ...
```

---

## 关于超时问题

微信服务器要求接口在 **5 秒内**响应，Vercel 免费版 Function 最长 10 秒。
对于复杂问题，星火 X2 可能超过 5 秒，此时系统会自动回复：

> 您的问题正在思考中，请稍后再次发送同一问题获取结果 ⏳

**解决方案（可选）**：
- 升级 Vercel Pro（Function 最长可达 300s）
- 接入消息队列（如 Redis）实现异步回复
- 缩短问题长度，减少模型思考时间

---

## 费用说明

| 服务 | 费用 |
|------|------|
| Vercel Serverless（免费版） | **免费**（每月 100GB 流量，100 小时执行时间）|
| 讯飞星火 X2 | 新用户赠 100 万 Tokens，后续按量计费 |
| 域名（Vercel 默认域名） | **免费** |

---

## 常见问题

**Q: 公众号认证提示 "Invalid signature"？**
A: 检查 `WECHAT_TOKEN` 与公众号后台填写的 Token 是否完全一致（大小写敏感）。

**Q: 消息没有回复？**
A: 前往 Vercel Dashboard → Functions Logs 查看错误日志，确认 `SPARK_API_PASSWORD` 是否正确。

**Q: 如何支持多轮对话？**
A: 目前为单轮对话，若需多轮，可接入 Vercel KV 或 Redis 存储会话历史。

**Q: 订阅号可以用吗？**
A: 订阅号主动发消息需认证，但**被动回复消息**（用户发消息后回复）无需认证即可使用。

---

## 相关资源

- [讯飞星火 X2 HTTP 接口文档](https://www.xfyun.cn/doc/spark/X1http.html)
- [微信公众平台接入指南](https://developers.weixin.qq.com/doc/offiaccount/Getting_Started/Overview.html)
- [Vercel Serverless Functions 文档](https://vercel.com/docs/functions)
