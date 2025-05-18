/**
 * 时间服务实用工具
 * 提供获取当前时间和时区转换功能
 */

// 获取当前时间
export const getCurrentTime = (timezone?: string): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: timezone || 'UTC'
  };
  
  return new Date().toLocaleString('zh-CN', options);
};

// 时区转换
export const convertTimezone = (
  datetime: string = new Date().toISOString(),
  sourceTimezone: string = 'UTC',
  targetTimezone: string = 'UTC'
): string => {
  try {
    // 解析输入日期字符串
    const date = new Date(datetime);
    
    if (isNaN(date.getTime())) {
      throw new Error('无效的日期格式');
    }

    // 转换到目标时区
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: targetTimezone
    };
    
    return date.toLocaleString('zh-CN', options);
  } catch (error) {
    if (error instanceof Error) {
      return `时区转换错误: ${error.message}`;
    }
    return '未知错误';
  }
}; 