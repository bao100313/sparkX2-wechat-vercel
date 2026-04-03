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

import { verifySignature, parseXML, buildTextReply, buildImageReply, readBody } from '../lib/wechat.js';
import { callSparkX2 } from '../lib/spark.js';
import { generateImage } from '../lib/image.js';
import { getWeather, detectWeatherQuery } from '../lib/weather.js';
import { getHotNews, detectNewsQuery } from '../lib/news.js';

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

    // 处理事件消息（关注/取消关注等）
    if (msgType === 'event') {
      const eventType = msgObj.Event;
      
      // 用户关注公众号
      if (eventType === 'subscribe') {
        const welcomeMsg = '🎉 欢迎光临！\n\n我是你的AI小助手，已接入讯飞星火大模型+联网搜索✨\n\n我可以帮你：\n🔍 解答问题 — 知识问答、学习辅导\n🎨 生成图片 — 发送"画一张"即可创作\n📰 实时资讯 — 联网获取最新信息\n\n直接发送消息开始体验吧~';
        const reply = buildTextReply(toUser, fromUser, welcomeMsg);
        res.setHeader('Content-Type', 'application/xml');
        return res.status(200).send(reply);
      }
      
      // 其他事件暂不处理
      return res.status(200).send('success');
    }

    // 只处理文本消息，其余消息类型直接回复"暂不支持"
    if (msgType !== 'text') {
      const reply = buildTextReply(toUser, fromUser, '暂时只支持文字消息，请发送文字提问 😊');
      res.setHeader('Content-Type', 'application/xml');
      return res.status(200).send(reply);
    }

    const userContent = msgObj.Content?.trim() || '';
    const openid = msgObj.FromUserName || '';

    // 2. 检测是否是天气查询
    const weatherCity = detectWeatherQuery(userContent);
    if (weatherCity) {
      try {
        const weatherInfo = await getWeather(weatherCity);
        if (weatherInfo) {
          const reply = buildTextReply(toUser, fromUser, weatherInfo);
          res.setHeader('Content-Type', 'application/xml');
          return res.status(200).send(reply);
        }
      } catch (err) {
        console.error('[Weather Error]', err.message);
      }
    }

    // 3. 检测是否是新闻查询
    const newsPlatform = detectNewsQuery(userContent);
    if (newsPlatform) {
      try {
        const newsInfo = await getHotNews(newsPlatform);
        if (newsInfo) {
          const reply = buildTextReply(toUser, fromUser, newsInfo);
          res.setHeader('Content-Type', 'application/xml');
          return res.status(200).send(reply);
        }
      } catch (err) {
        console.error('[News Error]', err.message);
      }
    }

    // 4. 检测是否是图片生成请求
    const imageKeywords = ['生成图片', '画一张', '画一幅', '生成图像', '画个', '画一'];
    const isImageRequest = imageKeywords.some(keyword => userContent.includes(keyword));

    if (isImageRequest) {
      // 提取图片描述（去掉关键词）
      let imagePrompt = userContent;
      imageKeywords.forEach(keyword => {
        imagePrompt = imagePrompt.replace(keyword, '');
      });
      imagePrompt = imagePrompt.trim();

      if (!imagePrompt) {
        const reply = buildTextReply(toUser, fromUser, '请描述您想生成的图片内容，例如：\n生成图片 一片向日葵花田');
        res.setHeader('Content-Type', 'application/xml');
        return res.status(200).send(reply);
      }

      try {
        const imageUrl = await generateImage(imagePrompt);
        // 由于微信图片消息需要 media_id，这里先返回图片链接
        const reply = buildTextReply(toUser, fromUser, `图片已生成！\n\n${imageUrl}\n\n点击图片查看，长按可保存。`);
        res.setHeader('Content-Type', 'application/xml');
        return res.status(200).send(reply);
      } catch (err) {
        console.error('[Image Error]', err.message);
        const reply = buildTextReply(toUser, fromUser, `图片生成失败：${err.message}`);
        res.setHeader('Content-Type', 'application/xml');
        return res.status(200).send(reply);
      }
    }

    // 5. 调用星火 X2 进行文字回复
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
