import result from './result.js';
import { getSecurityHeaders } from './utils/security.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const searchText = url.searchParams.get('q');

    // 获取 HTML 内容
    const html = result.fetch(searchText);

    // 生成安全响应头
    // 注意: allowInlineScripts 和 allowInlineStyles 必须为 true,
    // 因为所有 JS/CSS 都内联在 HTML 中(单一文件架构)
    // 生产环境建议考虑将 JS/CSS 分离到外部文件以提高安全性
    const securityHeaders = getSecurityHeaders({
      enableCSP: true,
      enableHSTS: true,
      enableXFrameOptions: true,
      enableXContentTypeOptions: true,
      enableReferrerPolicy: true,
      cspOptions: {
        allowInlineScripts: true,  // 必需: 单一文件架构,所有 JS 内联
        allowInlineStyles: true,   // 必需: 单一文件架构,所有 CSS 内联
        allowEval: false,          // 安全: 禁止 eval() 和相关函数
        imgSources: ["*", "data:"], // 允许所有图片来源(搜索引擎图标需要)
        scriptSources: ["'self'"],  // 只允许同源脚本
        styleSources: ["'self'", "'unsafe-inline'"], // 必需: 内联样式
        connectSources: ["'self'"], // 只允许同源连接
        fontSources: ["'self'"],    // 只允许同源字体
        objectSources: ["'none'"],  // 禁止插件
        mediaSources: ["'self'"],   // 只允许同源媒体
      },
    });

    // 合并基本响应头和安全响应头
    const headers = {
      'content-type': 'text/html;charset=UTF-8',
      ...securityHeaders,
    };

    return new Response(html, {
      headers,
    });
  },
};
