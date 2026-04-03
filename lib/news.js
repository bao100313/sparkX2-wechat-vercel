/**
 * 热点新闻查询模块
 * 使用 orz.ai 免费 API
 * 文档：https://github.com/orz-ai/hot_news
 */

const NEWS_API_URL = 'https://orz.ai/api/v1/dailynews';

// 支持的平台映射
const PLATFORM_MAP = {
  '百度': 'baidu',
  '微博': 'weibo',
  '知乎': 'zhihu',
  '哔哩哔哩': 'bilibili',
  'B站': 'bilibili',
  'github': 'github',
  '少数派': 'sspai',
  '微信': 'weixin',
  '今日头条': 'toutiao',
  '网易': '163',
  '腾讯': 'tencent',
  '新浪': 'sina',
};

/**
 * 检测是否是热搜榜单查询（不是普通新闻查询）
 * @param {string} message - 用户消息
 * @returns {string|null} - 返回平台名称或 null
 */
export function detectNewsQuery(message) {
  const lowerMsg = message.toLowerCase();
  
  // 热搜/榜单类关键词（明确要查榜单）
  const hotSearchKeywords = ['热搜', '热榜', '热门', '头条', '榜单'];
  const hasHotSearchKeyword = hotSearchKeywords.some(kw => lowerMsg.includes(kw));
  
  // 如果没有热搜类关键词，只是普通"新闻"查询，返回null让AI处理
  if (!hasHotSearchKeyword) return null;
  
  // 检测指定平台
  for (const [cnName, enCode] of Object.entries(PLATFORM_MAP)) {
    if (lowerMsg.includes(cnName.toLowerCase())) {
      return enCode;
    }
  }
  
  // 默认返回百度热搜
  return 'baidu';
}

/**
 * 获取热点新闻
 * @param {string} platform - 平台代码
 * @returns {Promise<string>} - 格式化的新闻内容
 */
export async function getHotNews(platform = 'baidu') {
  try {
    const response = await fetch(`${NEWS_API_URL}/?platform=${platform}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`News API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== '200' || !data.data || data.data.length === 0) {
      return null;
    }

    // 格式化新闻内容
    const platformNames = {
      'baidu': '百度热搜',
      'weibo': '微博热搜',
      'zhihu': '知乎热榜',
      'bilibili': 'B站热门',
      'github': 'GitHub Trending',
      'sspai': '少数派热门',
      'weixin': '微信热门',
      'toutiao': '今日头条',
      '163': '网易新闻',
      'tencent': '腾讯新闻',
      'sina': '新浪新闻',
    };

    const platformName = platformNames[platform] || '热点新闻';
    let result = `📰 ${platformName} Top 10：\n\n`;
    
    // 取前10条
    const newsList = data.data.slice(0, 10);
    newsList.forEach((item, index) => {
      result += `${index + 1}. ${item.title}\n`;
      if (item.desc && item.desc.trim()) {
        result += `   ${item.desc.slice(0, 50)}${item.desc.length > 50 ? '...' : ''}\n`;
      }
    });

    result += '\n💡 发送"微博热搜"、"知乎热榜"等查看其他平台';
    
    return result;
  } catch (error) {
    console.error('[News Error]', error.message);
    return null;
  }
}
