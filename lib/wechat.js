/**
 * 微信公众号核心工具库
 * 包括：签名验证、消息解析、消息回复
 */

import crypto from 'crypto';
import { parseStringPromise } from 'xml2js';

/**
 * 验证微信服务器签名
 * @param {string} token - 公众号后台配置的Token
 * @param {string} timestamp
 * @param {string} nonce
 * @param {string} signature - 微信传来的签名
 * @returns {boolean}
 */
export function verifySignature(token, timestamp, nonce, signature) {
  const arr = [token, timestamp, nonce].sort();
  const str = arr.join('');
  const hash = crypto.createHash('sha1').update(str).digest('hex');
  return hash === signature;
}

/**
 * 解析微信发来的 XML 消息体
 * @param {string} xmlStr
 * @returns {Promise<Object>} 解析后的消息对象
 */
export async function parseXML(xmlStr) {
  const result = await parseStringPromise(xmlStr, { explicitArray: false });
  return result.xml;
}

/**
 * 构造微信文本回复 XML
 * @param {string} toUser   - 接收方（用户 OpenID）
 * @param {string} fromUser - 发送方（公众号原始 ID）
 * @param {string} content  - 回复内容
 * @returns {string} XML 字符串
 */
export function buildTextReply(toUser, fromUser, content) {
  const timestamp = Math.floor(Date.now() / 1000);
  return `<xml>
  <ToUserName><![CDATA[${toUser}]]></ToUserName>
  <FromUserName><![CDATA[${fromUser}]]></FromUserName>
  <CreateTime>${timestamp}</CreateTime>
  <MsgType><![CDATA[text]]></MsgType>
  <Content><![CDATA[${content}]]></Content>
</xml>`;
}

/**
 * 读取 Request body（Vercel Serverless 环境）
 * @param {import('http').IncomingMessage} req
 * @returns {Promise<string>}
 */
export function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk.toString()));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}
