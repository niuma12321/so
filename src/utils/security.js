/**
 * 安全工具模块
 * 提供 XSS 防护、HTML 转义、URL 验证等安全功能
 */

/**
 * HTML 实体编码表
 */
const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * 预编译的 XSS 攻击模式正则表达式
 * 避免在每次函数调用时重复创建,提升性能
 */
const XSS_PATTERNS = [
  /<script/i,
  /javascript:/i,
  /on\w+\s*=/i, // onclick=, onload= 等
  /<iframe/i,
  /<embed/i,
  /<object/i,
  /<link/i,
  /<meta/i,
  /<style/i,
  /expression\s*\(/i,
];

/**
 * XSS 模式字符串数组
 * 用于注入到前端，保持前后端模式一致性
 */
export const XSS_PATTERN_STRINGS = [
  '<script',
  'javascript:',
  'on\\w+\\s*=',
  '<iframe',
  '<embed',
  '<object',
  '<link',
  '<meta',
  '<style',
  'expression\\s*\\(',
];

/**
 * 转义 HTML 特殊字符,防止 XSS 攻击
 * @param {string} str - 需要转义的字符串
 * @returns {string} 转义后的字符串
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') {
    return '';
  }

  return String(str).replace(/[&<>"'`=\/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * 转义 HTML 属性值
 * @param {string} str - 需要转义的属性值
 * @returns {string} 转义后的字符串
 */
export function escapeHtmlAttribute(str) {
  if (typeof str !== 'string') {
    return '';
  }

  // 属性值需要转义引号和其他特殊字符
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * 验证并清理搜索关键词
 * @param {string} keyword - 搜索关键词
 * @param {Object} options - 配置选项
 * @returns {Object} { valid: boolean, cleaned: string, error?: string }
 */
export function validateAndCleanKeyword(keyword, options = {}) {
  const {
    maxLength = 500, // 最大长度限制(默认 500)
    minLength = 0,   // 最小长度限制(默认 0)
    allowEmpty = false, // 是否允许空字符串(默认 false)
  } = options;

  // 如果为 null 或 undefined
  if (keyword == null) {
    return {
      valid: allowEmpty,
      cleaned: '',
      error: allowEmpty ? undefined : '搜索关键词不能为空',
    };
  }

  // 转换为字符串
  const str = String(keyword);

  // 检查长度
  if (str.length > maxLength) {
    return {
      valid: false,
      cleaned: '',
      error: `搜索关键词长度不能超过 ${maxLength} 个字符`,
    };
  }

  if (str.length < minLength) {
    return {
      valid: false,
      cleaned: '',
      error: `搜索关键词长度不能少于 ${minLength} 个字符`,
    };
  }

  // 去除首尾空白
  const trimmed = str.trim();

  if (!allowEmpty && trimmed.length === 0) {
    return {
      valid: false,
      cleaned: '',
      error: '搜索关键词不能为空',
    };
  }

  // 检测潜在的 XSS 攻击模式
  // 使用预编译的正则表达式常量,避免重复创建,提升性能
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        valid: false,
        cleaned: '',
        error: '搜索关键词包含非法字符',
      };
    }
  }

  return {
    valid: true,
    cleaned: trimmed,
  };
}

/**
 * 验证 URL 是否安全
 * @param {string} url - 需要验证的 URL
 * @returns {boolean} 是否安全
 */
export function isValidUrl(url) {
  if (typeof url !== 'string') {
    return false;
  }

  try {
    const parsed = new URL(url);

    // 只允许 http 和 https 协议
    // 这已经涵盖了所有危险协议(javascript:, data:, vbscript:, file:, ftp: 等)
    // 因为它们无法被 URL 构造函数解析为合法的 URL
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch (e) {
    // URL 解析失败,包括:
    // - 伪协议(javascript:, data:, vbscript: 等)
    // - 格式错误的 URL
    return false;
  }
}

/**
 * 安全地编码 URL 参数
 * @param {string} str - 需要编码的字符串
 * @returns {string} 编码后的字符串
 */
export function encodeUrlParam(str) {
  if (typeof str !== 'string') {
    return '';
  }

  // 使用 encodeURIComponent 进行 URL 编码
  return encodeURIComponent(str);
}

/**
 * 生成 CSP (Content Security Policy) 头部值
 * @param {Object} options - 配置选项
 * @returns {string} CSP 头部值
 */
export function generateCSP(options = {}) {
  const {
    allowInlineScripts = false, // 是否允许内联脚本
    allowInlineStyles = true,   // 是否允许内联样式
    allowEval = false,         // 是否允许 eval()
    imgSources = ["*"],        // 图片来源
    scriptSources = ["'self'"], // 脚本来源
    styleSources = ["'self'", "'unsafe-inline'"], // 样式来源
    connectSources = ["'self'"], // 连接来源
    fontSources = ["'self'"],    // 字体来源
    objectSources = ["'none'"],  // 对象来源
    mediaSources = ["'self'"],   // 媒体来源
    frameSources = ["'self'"],   // 框架来源
  } = options;

  const directives = [];

  // 默认策略
  directives.push("default-src 'self'");

  // 脚本策略
  if (allowInlineScripts) {
    scriptSources.push("'unsafe-inline'");
  }
  if (allowEval) {
    scriptSources.push("'unsafe-eval'");
  }
  directives.push(`script-src ${scriptSources.join(' ')}`);

  // 样式策略
  if (!allowInlineStyles && !styleSources.includes("'unsafe-inline'")) {
    // 如果不允许内联样式,移除 unsafe-inline
    const index = styleSources.indexOf("'unsafe-inline'");
    if (index > -1) {
      styleSources.splice(index, 1);
    }
  }
  directives.push(`style-src ${styleSources.join(' ')}`);

  // 其他策略
  directives.push(`img-src ${imgSources.join(' ')}`);
  directives.push(`connect-src ${connectSources.join(' ')}`);
  directives.push(`font-src ${fontSources.join(' ')}`);
  directives.push(`object-src ${objectSources.join(' ')}`);
  directives.push(`media-src ${mediaSources.join(' ')}`);
  directives.push(`frame-src ${frameSources.join(' ')}`);

  // 添加其他安全策略
  directives.push("base-uri 'self'");
  directives.push("form-action 'self'");
  directives.push("frame-ancestors 'none'"); // 防止被嵌入 iframe
  directives.push("upgrade-insecure-requests"); // 升级不安全的请求

  return directives.join('; ');
}

/**
 * 生成推荐的安全响应头
 * @param {Object} options - 配置选项
 * @returns {Object} 安全头部对象
 */
export function getSecurityHeaders(options = {}) {
  const {
    enableCSP = true,
    enableHSTS = true,
    enableXFrameOptions = true,
    enableXContentTypeOptions = true,
    enableReferrerPolicy = true,
    cspOptions = {},
  } = options;

  const headers = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  };

  if (enableCSP) {
    headers['Content-Security-Policy'] = generateCSP(cspOptions);
  }

  if (enableHSTS) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
  }

  if (!enableXFrameOptions) {
    delete headers['X-Frame-Options'];
  }

  if (!enableXContentTypeOptions) {
    delete headers['X-Content-Type-Options'];
  }

  if (!enableReferrerPolicy) {
    delete headers['Referrer-Policy'];
  }

  return headers;
}

/**
 * 清理用户输入,移除潜在的恶意代码
 * @param {string} input - 用户输入
 * @returns {string} 清理后的字符串
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return '';
  }

  // 移除控制字符(除了换行、制表符等常用字符)
  let cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // 移除零宽字符
  cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, '');

  // 限制连续空白字符
  cleaned = cleaned.replace(/\s{20,}/g, ' '.repeat(5));

  return cleaned;
}

/**
 * 验证图标 URL 是否安全
 * @param {string} iconUrl - 图标 URL
 * @param {Object} [options={}] - 配置选项(可选)
 * @param {number} [options.maxDataUriSize=102400] - data URI 最大大小(字节),默认 100KB
 * @returns {boolean} 是否安全
 */
export function isValidIconUrl(iconUrl, options = {}) {
  const {
    maxDataUriSize = 100 * 1024, // 默认 100KB
  } = options || {};

  if (!iconUrl || typeof iconUrl !== 'string') {
    return false;
  }

  const trimmed = iconUrl.trim();

  // 允许 data:image (base64 图片)
  if (trimmed.startsWith('data:image/')) {
    // 限制 data URI 大小(防止 DOS 攻击)
    if (trimmed.length > maxDataUriSize) {
      return false;
    }

    // 验证 data URI 格式
    return /^data:image\/(png|jpg|jpeg|gif|svg\+xml|ico|webp);base64,[a-zA-Z0-9+/=]+$/i.test(trimmed);
  }

  // 其他 URL 需要通过标准 URL 验证
  return isValidUrl(trimmed);
}
