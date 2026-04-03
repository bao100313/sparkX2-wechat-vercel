/**
 * 天气查询模块 - 使用免费天气 API
 */

/**
 * 华氏度转摄氏度
 * @param {number} fahrenheit - 华氏度
 * @returns {number} 摄氏度
 */
function fToC(fahrenheit) {
  return Math.round((fahrenheit - 32) * 5 / 9);
}

/**
 * 查询城市天气
 * @param {string} city - 城市名称
 * @returns {Promise<string>} 天气信息
 */
export async function getWeather(city) {
  try {
    // 使用 wttr.in 免费天气 API，获取详细格式
    const encodedCity = encodeURIComponent(city);
    // 使用 JSON 格式获取详细数据
    const url = `https://wttr.in/${encodedCity}?format=j1&lang=zh`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'curl/7.68.0',
      },
    });
    
    if (!response.ok) {
      throw new Error('天气查询失败');
    }
    
    const data = await response.json();
    const current = data.current_condition[0];
    
    // 提取温度（API返回的是摄氏度）
    const tempC = parseInt(current.temp_C);
    const tempF = parseInt(current.temp_F);
    const feelsLikeC = parseInt(current.FeelsLikeC);
    const feelsLikeF = parseInt(current.FeelsLikeF);
    
    // 提取其他信息
    const weatherDesc = current.lang_zh[0]?.value || current.weatherDesc[0].value;
    const humidity = current.humidity;
    const windSpeed = current.windspeedKmph;
    const windDir = current.winddir16Point;
    const visibility = current.visibility;
    const pressure = current.pressure;
    const uvIndex = current.uvIndex;
    
    // 获取今日最高最低温度
    const today = data.weather[0];
    const maxTempC = today.maxtempC;
    const minTempC = today.mintempC;
    const maxTempF = today.maxtempF;
    const minTempF = today.mintempF;
    
    // 格式化输出
    let result = `🌤️ ${city}今日天气\n`;
    result += `━━━━━━━━━━━━━━\n`;
    result += `📍 天气状况：${weatherDesc}\n`;
    result += `🌡️ 当前温度：${tempC}°C / ${tempF}°F\n`;
    result += `🌡️ 体感温度：${feelsLikeC}°C / ${feelsLikeF}°F\n`;
    result += `📈 最高温度：${maxTempC}°C / ${maxTempF}°F\n`;
    result += `📉 最低温度：${minTempC}°C / ${minTempF}°F\n`;
    result += `💧 相对湿度：${humidity}%\n`;
    result += `💨 风速风向：${windSpeed} km/h ${windDir}\n`;
    result += `👁️ 能见度：${visibility} km\n`;
    result += `🔽 气压：${pressure} hPa\n`;
    result += `☀️ 紫外线指数：${uvIndex}\n`;
    result += `━━━━━━━━━━━━━━`;
    
    return result;
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
