/**
 * 天气查询模块 - 使用免费天气 API
 */

/**
 * 查询城市天气
 * @param {string} city - 城市名称
 * @returns {Promise<string>} 天气信息
 */
export async function getWeather(city) {
  try {
    // 使用 wttr.in 免费天气 API
    const encodedCity = encodeURIComponent(city);
    const url = `https://wttr.in/${encodedCity}?format=%C+%t+%w+%h&lang=zh`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'curl/7.68.0',
      },
    });
    
    if (!response.ok) {
      throw new Error('天气查询失败');
    }
    
    const weatherText = await response.text();
    return `${city}今日天气：${weatherText}`;
  } catch (error) {
    console.error('[Weather Error]', error.message);
    return null;
  }
}

/**
 * 检测是否是天气查询
 * @param {string} message - 用户消息
 * @returns {string|null} 城市名称或null
 */
export function detectWeatherQuery(message) {
  const weatherKeywords = ['天气', '气温', '温度', '下雨', '晴天'];
  const isWeatherQuery = weatherKeywords.some(keyword => message.includes(keyword));
  
  if (!isWeatherQuery) return null;
  
  // 简单提取城市名（这里简化处理，实际可以用NLP）
  // 移除天气相关词汇，剩下的可能是城市名
  let city = message;
  weatherKeywords.forEach(keyword => {
    city = city.replace(keyword, '');
  });
  city = city.replace(/[怎么怎么样如何查查询]/g, '');
  city = city.trim();
  
  return city || null;
}
