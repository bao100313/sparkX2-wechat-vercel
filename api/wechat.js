/**
 * Vercel Serverless Function - 微信公众号接入入口
 *
 * 路由：GET  /api/wechat  → 验证微信服务器（仅首次配置）
 *       POST /api/wechat  → 接收并处理用户消息
 *
 * 所需环境变量（在 Vercel Dashboard → Settings → Environment Variables 中配置）：
 *   WECHAT_TOKEN         微信公众号后台配置的 Token
 *   SPARK_API_PASSWORD   讯飞控制台 APIpassword（Bearer Token）
 *   ENABLE_WEB_SEARCH    是否开启联网搜索，填 "true" 开启（可选，默认 false）
 */

import { verifySignature, parseXML, buildTextReply, readBody } from '../lib/wechat.js';
import { callSparkX2 } from '../lib/spark.js';

export default async function handler(req, res) {
  const { signature, timestamp, nonce, echostr } = req.query;
  const token = process.env.WECHAT_TOKEN || '';

  // ── GET：微信服务器验证 ──────────────────────────────────────────────────────
  if (req.method === 'GET') {
    if (!token) {
      return res.status(500).send('WECHAT_TOKEN is not set');
    }

    if (verifySignature(token, timestamp, nonce, signature)) {
      return res.status(200).send(echostr);
    } else {
      return res.status(403).send('Invalid signature');
    }
  }

  // ── POST：处理用户消息 ──────────────────────────────────────────────────────
  if (req.method === 'POST') {
    // 1. 签名验证（安全校验，防止伪造请求）
    if (token && !verifySignature(token, timestamp, nonce, signature)) {
      return res.status(403).send('Invalid signature');
    }

    let rawBody;
    try {
      rawBody = await readBody(req);
    } catch (e) {
      return res.status(400).send('Cannot read request body');
    }

    let msgObj;
    try {
      msgObj = await parseXML(rawBody);
    } catch (e) {
      return res.status(400).send('Invalid XML');
    }

    const msgType = msgObj.MsgType;
    const toUser = msgObj.FromUserName;   // 发给谁（用户 OpenID）
    const fromUser = msgObj.ToUserName;   // 来自谁（公众号原始 ID）

    // 只处理文本消息，其余消息类型直接回复"暂不支持"
    if (msgType !== 'text') {
      const reply = buildTextReply(toUser, fromUser, '暂时只支持文字消息，请发送文字提问 😊');
      res.setHeader('Content-Type', 'application/xml');
      return res.status(200).send(reply);
    }

    const userContent = msgObj.Content?.trim() || '';
    const openid = msgObj.FromUserName || '';

    // 2. 调用星火 X2
    const apiPassword = process.env.SPARK_API_PASSWORD || '';
    const enableWebSearch = process.env.ENABLE_WEB_SEARCH === 'true';

    if (!apiPassword) {
      const reply = buildTextReply(toUser, fromUser, '服务配置错误：SPARK_API_PASSWORD 未设置，请联系管理员。');
      res.setHeader('Content-Type', 'application/xml');
      return res.status(200).send(reply);
    }

    let replyContent;
    try {
      replyContent = await callSparkX2(apiPassword, userContent, openid, enableWebSearch);
    } catch (err) {
      console.error('[Spark Error]', err.message);

      // 微信服务器要求 5s 内响应，超时需回复空串让微信重试或给友好提示
      if (err.name === 'TimeoutError' || err.message?.includes('timeout')) {
        replyContent = '您的问题正在思考中，请稍后再次发送同一问题获取结果 ⏳';
      } else {
        replyContent = `抱歉，AI 服务暂时出现问题，请稍后重试。\n错误信息：${err.message}`;
      }
    }

    const reply = buildTextReply(toUser, fromUser, replyContent);
    res.setHeader('Content-Type', 'application/xml');
    return res.status(200).send(reply);
  }

  // 其他 HTTP 方法
  return res.status(405).send('Method Not Allowed');
}
