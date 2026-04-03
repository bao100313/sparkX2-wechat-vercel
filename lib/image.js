/**
 * 图片生成模块 - 使用 AI 生成图片
 */

/**
 * 生成图片
 * @param {string} prompt - 图片描述
 * @returns {Promise<string>} 图片 URL
 */
export async function generateImage(prompt) {
  // 使用 pollinations.ai 免费图片生成 API
  const encodedPrompt = encodeURIComponent(prompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;
  
  // 由于 pollinations 是实时生成，我们返回 URL 即可
  // 实际图片会在用户点击链接时生成
  return imageUrl;
}
