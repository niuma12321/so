import config from './config.js';
import {
  escapeHtml,
  escapeHtmlAttribute,
  validateAndCleanKeyword,
  isValidUrl,
  encodeUrlParam,
  isValidIconUrl,
  XSS_PATTERN_STRINGS,
} from './utils/security.js';

/**
 * HTML 模板常量
 * 提取到模块级别避免每次请求重新创建字符串
 */
const INDEX_HTML = `<!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}}</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔍</text></svg>">
    <style>
      :root {
        --blue-50: #eef4fb;
        --blue-100: #dde9f8;
        --blue-200: #b8d8f5;
        --blue-300: #78bef0;
        --blue-400: #34a3e8;
        --blue-500: #0c87d6;
        --blue-600: #0069ad;
        --glass-bg: rgba(255, 255, 255, 0.55);
        --glass-bg-hover: rgba(255, 255, 255, 0.8);
        --glass-border: rgba(160, 200, 235, 0.7);
        --text-primary: #1a3550;
        --text-secondary: #466a88;
        --text-light: #89a5b8;
        --accent: #0c87d6;
        --accent-light: #34a3e8;
        --input-bg: rgba(255, 255, 255, 0.65);
        --input-focus-bg: rgba(255, 255, 255, 0.88);
        --shadow-soft: 0 2px 8px rgba(12, 100, 180, 0.07), 0 8px 24px rgba(12, 100, 180, 0.05);
        --shadow-medium: 0 4px 16px rgba(12, 100, 180, 0.10), 0 12px 36px rgba(12, 100, 180, 0.08);
        --radius-md: 14px;
        --radius-sm: 10px;
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
        color: var(--text-primary);
        min-height: 100vh;
        overflow-x: hidden;
        background: #ffffff;
        position: relative;
      }

      .container {
        position: relative;
        z-index: 1;
        max-width: 1100px;
        margin: 0 auto;
        padding: 60px 24px 40px;
      }

      h1 {
        font-size: 2.6rem;
        font-weight: 600;
        text-align: center;
        margin: 0 0 40px 0;
        color: var(--blue-500);
        letter-spacing: 0.25em;
        user-select: none;
        text-transform: lowercase;
      }

      .search-container {
        margin-bottom: 32px;
        position: relative;
        width: 100%;
      }

      #searchForm {
        display: flex;
        justify-content: center;
        align-items: stretch;
        position: relative;
        width: 100%;
      }

      .input-wrapper {
        position: relative;
        flex: 1;
        display: flex;
        align-items: center;
      }

      .form-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin: 0 auto;
      }

      input[type="text"] {
        width: 100%;
        height: 52px;
        padding: 0 48px 0 24px;
        border: 1.5px solid var(--glass-border);
        border-radius: 26px;
        font-size: 16px;
        font-family: inherit;
        background: var(--input-bg);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        box-shadow: var(--shadow-soft), inset 0 1px 0 rgba(255, 255, 255, 0.6);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        outline: none;
        color: var(--text-primary);
      }

      input[type="text"]:focus {
        background: var(--input-focus-bg);
        border-color: var(--accent-light);
        box-shadow:
          var(--shadow-medium),
          inset 0 1px 0 rgba(255, 255, 255, 0.6),
          0 0 0 4px rgba(12, 135, 214, 0.12),
          0 0 32px rgba(110, 168, 254, 0.15);
      }

      input[type="text"]::placeholder {
        color: var(--text-light);
      }

      .clear-button {
        position: absolute;
        right: 16px;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(255, 255, 255, 0.4);
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        font-size: 18px;
        width: 28px;
        height: 28px;
        display: none;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s ease;
      }

      .clear-button:hover {
        background: rgba(255, 255, 255, 0.7);
        color: var(--text-primary);
      }

      .clear-button:active {
        transform: translateY(-50%) scale(0.9);
      }

      .clear-button.show {
        display: flex;
      }

      #searchButton {
        height: 52px;
        padding: 0 24px;
        background: linear-gradient(135deg, var(--accent-light), var(--accent));
        color: white;
        border: none;
        border-radius: 26px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 600;
        font-family: inherit;
        margin-left: 10px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: var(--shadow-soft);
        display: flex;
        align-items: center;
        justify-content: center;
        white-space: nowrap;
        letter-spacing: 0.3px;
      }

      #searchButton:hover {
        transform: translateY(-1px);
        box-shadow: var(--shadow-medium), 0 0 20px rgba(12, 135, 214, 0.18);
      }

      #searchButton:active {
        transform: translateY(0);
        box-shadow: var(--shadow-soft);
      }

      .history-dropdown-btn {
        background: var(--glass-bg);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid var(--glass-border);
        border-radius: 26px;
        padding: 0 16px;
        height: 52px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: var(--shadow-soft);
        min-width: 44px;
        margin-left: 10px;
        color: var(--text-light);
        font-size: 16px;
        font-weight: 500;
        font-family: inherit;
      }

      .history-dropdown-btn:hover {
        background: var(--glass-bg-hover);
        transform: translateY(-1px);
        box-shadow: var(--shadow-medium);
        color: var(--text-secondary);
      }

      .history-dropdown-btn.active {
        opacity: 0.6;
      }

      .history-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        width: 100%;
        max-width: 480px;
        background: var(--glass-bg);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-medium);
        z-index: 1000;
        display: none;
        margin-top: 12px;
        overflow: hidden;
      }

      .history-dropdown.show {
        display: block;
        animation: dropdownIn 0.25s ease;
      }

      @keyframes dropdownIn {
        from {
          opacity: 0;
          transform: translateY(-8px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .history-list {
        max-height: 480px;
        overflow-y: auto;
      }

      .history-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 14px;
        border-bottom: 1px solid rgba(186, 224, 253, 0.3);
        transition: background-color 0.2s ease;
        cursor: pointer;
      }

      .history-item:last-child {
        border-bottom: none;
      }

      .history-item:hover {
        background-color: rgba(255, 255, 255, 0.25);
      }

      .history-item-text {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--text-primary);
        font-size: 14px;
      }

      .history-item-delete {
        background: none;
        border: none;
        color: var(--text-light);
        cursor: pointer;
        font-size: 18px;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s ease;
        opacity: 0.6;
        margin-left: 8px;
      }

      .history-item-delete:hover {
        background-color: rgba(255, 59, 48, 0.12);
        color: #ff3b30;
        opacity: 1;
      }

      .history-empty {
        padding: 24px;
        text-align: center;
        color: var(--text-light);
        font-size: 14px;
      }

      .current-search {
        padding: 12px 4px;
        border-bottom: 1px solid var(--glass-border);
        margin-bottom: 20px;
        font-weight: 600;
        font-size: 15px;
        color: var(--text-primary);
        text-align: left;
        display: none;
        animation: slideDown 0.3s ease;
      }

      .button-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 16px;
        margin-top: 8px;
      }

      .empty-hint {
        display: none;
        justify-content: center;
        align-items: center;
        min-height: 200px;
        color: var(--text-light);
        font-size: 15px;
        font-weight: 400;
        letter-spacing: 0.02em;
        opacity: 0.7;
        text-align: center;
        padding: 40px 24px;
        background: var(--glass-bg);
        border: 1px dashed var(--glass-border);
        border-radius: var(--radius-md);
        max-width: 480px;
        margin: 0 auto;
      }

      .button-container.empty + .empty-hint {
        display: flex;
      }

      .button {
        background: var(--glass-bg);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-md);
        overflow: hidden;
        box-shadow: var(--shadow-soft);
        transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
      }

      .button:hover {
        transform: translateY(-3px) scale(1.015);
        box-shadow: var(--shadow-medium), 0 0 20px rgba(110, 168, 254, 0.15);
        background: var(--glass-bg-hover);
        border-color: rgba(110, 168, 254, 0.35);
      }

      .button:active {
        transform: translateY(-1px) scale(1.005);
        transition-duration: 0.1s;
      }

      .button a {
        text-decoration: none;
        color: var(--text-primary);
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
        padding: 20px 16px;
        font-weight: 500;
        font-size: 15px;
        text-align: center;
        transition: color 0.2s ease;
        position: relative;
        gap: 10px;
      }

      .button-icon {
        width: 22px;
        height: 22px;
        flex-shrink: 0;
        object-fit: contain;
        transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        filter: drop-shadow(0 1px 2px rgba(0,0,0,0.08));
      }

      .button:hover .button-icon {
        transform: scale(1.2);
      }

      .button-icon.error {
        display: none;
      }

      .button-text {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .button:hover a {
        color: var(--accent);
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (max-width: 768px) {
        .container {
          padding: 28px 16px 24px;
        }

        h1 {
          font-size: 1.8rem;
          margin-bottom: 32px;
        }

        #searchForm {
          flex-direction: column;
          gap: 10px;
          align-items: stretch;
          width: 100%;
        }

        .input-wrapper {
          flex-direction: row;
          width: 100%;
        }

        input[type="text"] {
          width: 100%;
          margin-left: 0;
        }

        #searchButton {
          width: 100%;
          margin-left: 0;
          height: 52px;
        }

        .history-dropdown-btn {
          width: 100%;
          margin-left: 0;
          margin-top: 0;
          height: 52px;
        }

        .history-dropdown {
          max-width: 100%;
          left: 0;
          right: 0;
        }

        .button-container {
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
      }

      @media (max-width: 480px) {
        h1 {
          font-size: 1.5rem;
          margin-bottom: 24px;
        }

        .button-container {
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .button a {
          padding: 16px 12px;
          font-size: 13px;
          gap: 6px;
        }

        .button-icon {
          width: 18px;
          height: 18px;
        }
      }

      @media (prefers-color-scheme: dark) {
        :root {
          --blue-50: #0c1220;
          --blue-100: #141e30;
          --blue-200: #1a2740;
          --blue-300: #4a7aaa;
          --blue-400: #5a9ad0;
          --blue-500: #3a8ac0;
          --blue-600: #6ab0e0;
          --glass-bg: rgba(255, 255, 255, 0.06);
          --glass-bg-hover: rgba(255, 255, 255, 0.12);
          --glass-border: rgba(255, 255, 255, 0.14);
          --text-primary: #d0dcea;
          --text-secondary: #8aa0b8;
          --text-light: #5a7088;
          --accent: #5a9ad0;
          --accent-light: #6ab0e0;
          --input-bg: rgba(255, 255, 255, 0.08);
          --input-focus-bg: rgba(255, 255, 255, 0.12);
          --shadow-soft: 0 2px 8px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2);
          --shadow-medium: 0 4px 16px rgba(0, 0, 0, 0.4), 0 12px 36px rgba(0, 0, 0, 0.3);
        }

        body {
          background: #202124;
        }

        h1 {
          color: var(--blue-300);
        }

        input[type="text"] {
          color: var(--text-primary);
        }

        input[type="text"]::placeholder {
          color: var(--text-light);
        }

        .clear-button {
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-secondary);
        }

        .clear-button:hover {
          background: rgba(255, 255, 255, 0.15);
          color: var(--text-primary);
        }

        .history-item {
          border-bottom-color: rgba(255, 255, 255, 0.06);
        }

        .history-item:hover {
          background-color: rgba(255, 255, 255, 0.08);
        }

        .history-item-delete:hover {
          background-color: rgba(255, 80, 80, 0.15);
          color: #ff6b6b;
        }

        .empty-hint {
          color: var(--text-light);
          border-color: rgba(255, 255, 255, 0.06);
        }
      }
    </style>
    </head>
    <body>
    <div class="container">
        <h1>so</h1>
        <div class="search-container">
            <div class="form-wrapper">
              <form id="searchForm" action="/" method="GET">
                <div class="input-wrapper">
                  <input type="text" id="searchInput" name="query" placeholder="搜索..." value="{{keyword}}"/>
                  <button type="button" id="clearButton" class="clear-button">×</button>
                </div>
                <button type="button" id="searchButton">搜索 ↵</button>
                <button type="button" id="historyDropdownBtn" class="history-dropdown-btn" title="搜索历史"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></button>
                <div id="historyDropdown" class="history-dropdown">
                  <div id="historyList" class="history-list"></div>
                </div>
              </form>
            </div>
        </div>
        <div id="currentSearchDisplay" class="current-search" style="{{current_search_style}}">{{current_search}}</div>
        <div class="button-container{{empty_class}}">
            {{button_list}}
        </div>
        <div class="empty-hint">输入关键词，一次搜索多个引擎</div>
    </div>

    <script>
    // 从服务端注入的配置
    const CONFIG = {
      maxHistoryItems: ${config.validation.maxHistoryItems},
      maxQueryLength: ${config.validation.maxQueryLength},
      maxDataUriSize: ${config.validation.maxDataUriSize}
    };

    // 从服务端注入的 XSS 模式（与后端保持一致）
    const DANGEROUS_PATTERNS = ${JSON.stringify(XSS_PATTERN_STRINGS)}.map(p => new RegExp(p, 'gi'));

    // 搜索历史管理
    const SEARCH_HISTORY_KEY = 'search_history';
    const SEARCH_INPUT_ID = 'searchInput';
    const MOBILE_REGEX = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;

    function isMobileDevice() {
      return MOBILE_REGEX.test(navigator.userAgent);
    }

    // 验证和清理搜索关键词
    function validateAndCleanQuery(query) {
      if (!query || typeof query !== 'string') return '';

      let cleaned = query.trim();

      // 限制长度
      if (cleaned.length > CONFIG.maxQueryLength) {
        cleaned = cleaned.substring(0, CONFIG.maxQueryLength);
      }

      // 移除潜在的恶意字符
      for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.test(cleaned)) {
          console.warn('Potentially malicious query detected and rejected');
          return '';
        }
      }

      return cleaned;
    }

    // 获取搜索历史
    function getSearchHistory() {
      try {
        const history = localStorage.getItem(SEARCH_HISTORY_KEY);
        if (!history) return [];

        const parsed = JSON.parse(history);

        // 验证数据结构
        if (!Array.isArray(parsed)) return [];

        // 清理和验证每个历史记录
        return parsed
          .filter(item => typeof item === 'string')
          .map(item => validateAndCleanQuery(item))
          .filter(item => item.length > 0)
          .slice(0, CONFIG.maxHistoryItems);
      } catch (e) {
        console.error('Failed to parse search history:', e);
        // 清除损坏的数据
        try {
          localStorage.removeItem(SEARCH_HISTORY_KEY);
        } catch (cleanupError) {
          console.error('Failed to clear corrupted history:', cleanupError);
        }
        return [];
      }
    }

    // 保存搜索历史
    function saveSearchHistory(query) {
      if (!query || typeof query !== 'string') return;

      // 验证和清理查询
      const cleanedQuery = validateAndCleanQuery(query);
      if (!cleanedQuery) return;

      const history = getSearchHistory();

      // 移除重复项
      const filteredHistory = history.filter(item => item !== cleanedQuery);

      // 添加到开头
      filteredHistory.unshift(cleanedQuery);

      // 限制数量
      const limitedHistory = filteredHistory.slice(0, CONFIG.maxHistoryItems);

      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(limitedHistory));
      } catch (e) {
        console.error('Failed to save search history:', e);

        // 如果是配额超限错误,尝试删除最旧的记录后重试
        if (e.name === 'QuotaExceededError' && limitedHistory.length > 1) {
          try {
            const reducedHistory = limitedHistory.slice(0, Math.floor(CONFIG.maxHistoryItems / 2));
            localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(reducedHistory));
          } catch (retryError) {
            console.error('Failed to save reduced history:', retryError);
          }
        }
      }
    }

    // 删除搜索历史项
    function deleteSearchHistoryItem(query) {
      if (!query || typeof query !== 'string') return;

      const cleanedQuery = validateAndCleanQuery(query);
      if (!cleanedQuery) return;

      const history = getSearchHistory();
      const filteredHistory = history.filter(item => item !== cleanedQuery);

      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filteredHistory));
        renderHistoryDropdown();
      } catch (e) {
        console.error('Failed to delete search history item:', e);
      }
    }

    // 渲染搜索历史下拉框
    function renderHistoryDropdown() {
      const historyList = document.getElementById('historyList');
      if (!historyList) return;

      const history = getSearchHistory();

      if (history.length === 0) {
        historyList.innerHTML = '<div class="history-empty">暂无搜索历史</div>';
        return;
      }

      // 安全地创建 DOM 元素
      historyList.innerHTML = '';

      for (const query of history) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'history-item';
        itemDiv.dataset.query = encodeURIComponent(query);

        const textSpan = document.createElement('span');
        textSpan.className = 'history-item-text';
        textSpan.textContent = query;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'history-item-delete';
        deleteBtn.textContent = '×';
        deleteBtn.dataset.query = encodeURIComponent(query);
        deleteBtn.setAttribute('aria-label', '删除此历史记录');
        deleteBtn.title = '删除此历史记录';

        itemDiv.appendChild(textSpan);
        itemDiv.appendChild(deleteBtn);
        historyList.appendChild(itemDiv);
      }
      // 事件监听通过事件委托在 DOMContentLoaded 中统一设置
    }

    // 显示搜索历史下拉框
    function showHistoryDropdown() {
      const dropdown = document.getElementById('historyDropdown');
      const btn = document.getElementById('historyDropdownBtn');

      if (!dropdown || !btn) return;

      renderHistoryDropdown();
      dropdown.classList.add('show');
      btn.classList.add('active');
    }

    // 隐藏搜索历史下拉框
    function hideHistoryDropdown() {
      const dropdown = document.getElementById('historyDropdown');
      const btn = document.getElementById('historyDropdownBtn');

      if (!dropdown || !btn) return;

      dropdown.classList.remove('show');
      btn.classList.remove('active');
    }

    // 切换搜索历史下拉框显示状态
    function toggleHistoryDropdown() {
      const dropdown = document.getElementById('historyDropdown');
      if (!dropdown) return;

      if (dropdown.classList.contains('show')) {
        hideHistoryDropdown();
      } else {
        showHistoryDropdown();
      }
    }

    // 检测客户端类型并设置合适的placeholder
    function getClientSpecificPlaceholder() {
      if (isMobileDevice()) {
        return "搜索...";
      }
      return "输入搜索内容，按 / 聚焦";
    }

    // 设置合适的placeholder并聚焦搜索框
    document.addEventListener("DOMContentLoaded", function() {
      const searchInput = document.getElementById(SEARCH_INPUT_ID);
      if (searchInput) {
        searchInput.placeholder = getClientSpecificPlaceholder();

        // 非移动设备自动聚焦搜索框
        if (!isMobileDevice()) {
          // 页面加载时自动聚焦到搜索框（仅在桌面端）
          searchInput.focus();
          // 如果有内容，将光标移动到末尾
          if (searchInput.value) {
            searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
          }
        }

        // 初始化清空按钮状态
        toggleClearButton();

        // 监听输入框内容变化
        searchInput.addEventListener("input", toggleClearButton);

        // 历史下拉框按钮事件
        document.getElementById("historyDropdownBtn").addEventListener("click", function(e) {
          e.preventDefault();
          toggleHistoryDropdown();
        });

        // 点击页面其他地方关闭历史下拉框
        document.addEventListener("click", function(e) {
          const dropdown = document.getElementById("historyDropdown");
          const btn = document.getElementById("historyDropdownBtn");

          if (!dropdown.contains(e.target) && e.target !== btn) {
            hideHistoryDropdown();
          }
        });

        // 事件委托：历史列表点击事件（只设置一次）
        document.getElementById('historyList').addEventListener('click', function(e) {
          const deleteBtn = e.target.closest('.history-item-delete');
          const historyItem = e.target.closest('.history-item');

          if (deleteBtn) {
            e.stopPropagation();
            const query = decodeURIComponent(deleteBtn.dataset.query);
            deleteSearchHistoryItem(query);
          } else if (historyItem) {
            const query = decodeURIComponent(historyItem.dataset.query);
            const searchInputEl = document.getElementById(SEARCH_INPUT_ID);
            if (searchInputEl) {
              searchInputEl.value = query;
              toggleClearButton();
              hideHistoryDropdown();
              performSearch();
            }
          }
        });

        // 页面加载时，如果搜索框有内容，将其添加到搜索历史
        if (searchInput.value.trim() !== "") {
          saveSearchHistory(searchInput.value.trim());
        }
      }
    });

    // 全局快捷键监听器
    document.addEventListener("keydown", function(e) {
        // "/" 键且不在输入框中时，聚焦搜索框
        if (e.key === "/" && document.activeElement.id !== SEARCH_INPUT_ID) {
            e.preventDefault();
            document.getElementById(SEARCH_INPUT_ID).focus();
        }
    });

    // 搜索框的回车键监听器
    document.getElementById(SEARCH_INPUT_ID).addEventListener("keydown", function(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            performSearch();
        }
    });

    document.getElementById("searchButton").addEventListener("click", function() {
        performSearch();
    });

    document.getElementById("clearButton").addEventListener("click", function() {
        clearSearch();
    });

    function clearSearch() {
        const searchInput = document.getElementById(SEARCH_INPUT_ID);
        searchInput.value = "";
        searchInput.focus();
        updateCurrentSearchDisplay();
        toggleClearButton();
    }

    function toggleClearButton() {
        const searchInput = document.getElementById(SEARCH_INPUT_ID);
        const clearButton = document.getElementById("clearButton");

        if (!searchInput || !clearButton) return;

        if (searchInput.value.trim() === "") {
            clearButton.classList.remove("show");
            clearButton.style.display = "none";
        } else {
            clearButton.classList.add("show");
            clearButton.style.display = "flex";
        }
    }

    function performSearch() {
        const searchInput = document.getElementById(SEARCH_INPUT_ID);
        if (!searchInput) return;

        const rawQuery = searchInput.value;
        if (!rawQuery || typeof rawQuery !== 'string') return;

        // 验证和清理查询
        const query = validateAndCleanQuery(rawQuery);

        if (query && query.trim() !== "") {
          // 保存搜索历史
          saveSearchHistory(query);
        }

        // 构建安全的 URL
        const baseUrl = "{{base}}";
        const url = baseUrl + encodeURIComponent(query);
        window.location.href = url;
    }

    // 显示当前搜索内容
    function updateCurrentSearchDisplay() {
        const searchInput = document.getElementById(SEARCH_INPUT_ID);
        const currentSearchDiv = document.getElementById("currentSearchDisplay");

        if (!searchInput || !currentSearchDiv) return;

        const query = searchInput.value;
        if (query.trim() !== "") {
            // 使用 textContent 而不是 innerHTML 防止 XSS
            currentSearchDiv.textContent = "当前搜索：" + query;
            currentSearchDiv.style.display = "block";
        } else {
            currentSearchDiv.style.display = "none";
        }
    }

    // 页面加载完成后不再自动更新显示，保持与title一致的更新时机
    </` + `script>
    </body>
    </html>
    `;

export default {
  fetch(searchText) {
    // 验证和清理搜索关键词 - 使用配置中的参数
    const validationResult = validateAndCleanKeyword(searchText, {
      maxLength: config.validation.maxQueryLength,
      minLength: config.validation.minQueryLength,
      allowEmpty: true,
    });

    let title = config.title;
    // 使用相对路径，自动适配当前域名
    const base = '/?q=';
    const resourceList = config.urls;

    // 使用验证和清理后的关键词
    const keyword = validationResult.valid ? validationResult.cleaned : '';

    let html = INDEX_HTML.replace('{{base}}', base).replace('{{keyword}}', escapeHtmlAttribute(keyword));

    // 使用安全的 URL 编码
    const encodeSearchText = keyword ? encodeUrlParam(keyword) : '';

    // 处理图标的函数(增强安全性)
    function getIconHtml(icon) {
      if (!icon || icon.trim() === '') {
        return '';
      }

      // 验证图标 URL 是否安全 - 使用配置中的参数
      if (!isValidIconUrl(icon, { maxDataUriSize: config.validation.maxDataUriSize })) {
        return '';
      }

      // 检查是否是base64图片
      if (icon.startsWith('data:image/')) {
        return `<img src="${escapeHtmlAttribute(icon)}" alt="" class="button-icon" loading="lazy" onerror="this.classList.add('error')">`;
      }

      // 否则作为URL处理(添加 referrerpolicy 防止信息泄露)
      // 使用 CSS 类控制错误状态,而不是内联样式
      return `<img src="${escapeHtmlAttribute(icon)}" alt="" class="button-icon" loading="lazy" onerror="this.classList.add('error')" referrerpolicy="no-referrer">`;
    }

    const buttonList = [];
    let currentSearchDisplay = '';
    let currentSearchStyle = 'display: none;';

    // 只有在关键词有效时才生成搜索按钮
    if (keyword) {
      for (const resource of resourceList) {
        // 验证搜索引擎 URL 模板
        if (!resource.url || typeof resource.url !== 'string') {
          continue;
        }

        const finalUrl = resource.url.replace('%s', encodeSearchText);

        // 验证生成的 URL 是否安全
        if (!isValidUrl(finalUrl)) {
          console.warn(`Invalid URL generated for ${resource.name}: ${finalUrl}`);
          continue;
        }

        const iconHtml = getIconHtml(resource.icon || '');
        buttonList.push(
          `<div class="button"><a href="${escapeHtmlAttribute(finalUrl)}" target="_blank" rel="noopener noreferrer">${iconHtml}<span class="button-text">${escapeHtml(resource.name)}</span></a></div>`
        );
      }
      title += ' - ' + escapeHtml(keyword);
      currentSearchDisplay = '当前搜索: ' + escapeHtml(keyword);
      currentSearchStyle = 'display: block;';
    }

    return html
      .replace('{{title}}', title)
      .replace('{{button_list}}', buttonList.join('\n'))
      .replace('{{current_search}}', currentSearchDisplay)
      .replace('{{current_search_style}}', currentSearchStyle)
      .replace('{{empty_class}}', keyword ? '' : ' empty');
  },
};
