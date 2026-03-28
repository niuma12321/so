# so

基于 Cloudflare Workers 实现自己的搜索网站。

## 功能亮点

- 自定义搜索结果
- 搜索历史管理
- 免服务器部署
- 所有搜索数据均在浏览器本地存储
- 玻璃拟态视觉风格
- 跟随系统的暗色模式
- **全面的安全防护** (XSS 防护、CSP、输入验证等)

## 网站使用说明

- 输入搜索内容，点击搜索按钮或按下 Enter 键即可搜索
- 按下 / 键快速聚焦搜索框
- 点击搜索历史项快速搜索
- 自动跟随系统主题
- 作为浏览器搜索引擎，如 <https://so.wangze.tech?q=%s>，并设置关键字为 so

## 自部署说明

- 打开：<https://dash.cloudflare.com>
- 部署到 Cloudflare Workers 拿到访问地址（src 里的文件都要添加到 Worker 里）
- 修改 config.js 再部署一次

![image.png](./images/1.png)

![image.png](./images/2.png)

![image.png](./images/3.png)

![image.png](./images/4.png)

## 安全性

项目实施了全面的安全措施,包括:

### 输入验证与清理
- 所有搜索关键词都经过验证和清理
- 自动检测和拒绝 XSS 攻击尝试
- 输入长度限制(最大 500 字符)
- URL 验证(只允许 HTTP/HTTPS)

### 输出转义
- HTML 内容自动转义
- HTML 属性值转义
- 使用安全的 DOM API(如 textContent)

### 安全响应头
- Content Security Policy (CSP)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Strict-Transport-Security (HSTS)
- Referrer-Policy
- Permissions-Policy

### 数据安全
- localStorage 数据验证
- 损坏数据自动清理
- 优雅的错误处理

详细的安全策略请参考 [SECURITY.md](SECURITY.md)

## 开发

### 项目结构

```
so/
├── src/
│   ├── worker.js           # Cloudflare Worker 入口
│   ├── result.js           # 页面渲染逻辑
│   ├── config.js           # 搜索引擎配置
│   └── utils/
│       ├── security.js     # 安全工具模块
│       └── security.test.js # 安全测试
├── images/                 # 项目截图
├── docs/                   # 文档目录
├── SECURITY.md            # 安全策略文档
├── HOW_TO_TEST.md         # 测试说明
├── wrangler.toml          # Wrangler 配置
└── package.json           # 项目配置
```

### 安全测试

运行安全测试(需要支持 ES modules 的环境):

```bash
node src/utils/security.test.js
```

### 自定义搜索引擎

编辑 `src/config.js` 文件,添加或修改搜索引擎配置:

```javascript
{
  name: '搜索引擎名称',
  url: 'https://example.com/search?q=%s',
  icon: 'https://example.com/favicon.ico' // 可选
}
```

## 技术栈

- Cloudflare Workers (Serverless)
- 原生 JavaScript (无框架依赖)
- LocalStorage API
- 现代浏览器 API

## 许可证

MIT License

