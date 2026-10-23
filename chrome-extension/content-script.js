/**
 * Promptly — Chrome Extension Content Script (Manifest V3)
 * --------------------------------------------------------
 * Precision prompt optimization assistant for:
 *   - ChatGPT (chatgpt.com, chat.openai.com)
 *   - Claude (claude.ai)
 *   - Google Gemini (gemini.google.com)
 *
 * Architecture:
 * 1. Safe Modern DOM Insertion for contenteditable (Lexical, ProseMirror, Quill)
 * 2. 100% Style Isolation via Shadow DOM (supports Dark & Light host themes)
 * 3. Dynamic Non-Intrusive Floating Button & Cmd/Ctrl+Shift+P Shortcut
 * 4. Privacy-First: Zero keystroke logging, on-demand activation only
 */

(function () {
  'use strict';

  // Prevent duplicate injection
  if (window.__PROMPTLY_INJECTED__) return;
  window.__PROMPTLY_INJECTED__ = true;

  /* ================================================================== */
  /* 1. Host Target Selectors & Element Detection                       */
  /* ================================================================== */

  const TARGET_SELECTORS = [
    // ChatGPT (ProseMirror & Lexical contenteditable or fallback textarea)
    '#prompt-textarea',
    'div[contenteditable="true"][id="prompt-textarea"]',
    'textarea[data-id="root"]',
    'div[contenteditable="true"][data-placeholder]',
    // Claude (ProseMirror contenteditable)
    'div[contenteditable="true"].ProseMirror',
    'fieldset div[contenteditable="true"]',
    'div[contenteditable="true"][aria-label*="prompt" i]',
    'div[contenteditable="true"][aria-label*="message" i]',
    // Google Gemini (rich-textarea / Quill contenteditable)
    'rich-textarea div[contenteditable="true"]',
    'div.ql-editor[contenteditable="true"]',
    'textarea[aria-label*="prompt" i]',
    'textarea[aria-label*="Enter a prompt" i]',
    'div[contenteditable="true"][role="textbox"]',
  ];

  function findTargetInput() {
    for (const selector of TARGET_SELECTORS) {
      const el = document.querySelector(selector);
      if (el && isElementVisible(el)) {
        return el;
      }
    }
    return null;
  }

  function isElementVisible(el) {
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden';
  }

  function isDarkMode() {
    if (
      document.documentElement.classList.contains('dark') ||
      document.body.classList.contains('dark') ||
      document.documentElement.getAttribute('data-theme') === 'dark' ||
      document.body.getAttribute('data-theme') === 'dark'
    ) {
      return true;
    }
    try {
      const bg = window.getComputedStyle(document.body).backgroundColor;
      const rgb = bg.match(/\d+/g);
      if (rgb && rgb.length >= 3) {
        const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
        return brightness < 128;
      }
    } catch (_) {}
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /* ================================================================== */
  /* 2. Safe DOM Text Read & Replacement Engine                         */
  /* ================================================================== */

  /**
   * Reads current text from contenteditable or textarea without destroying formatting
   */
  function readFieldText(field) {
    if (!field) return '';
    if (field.tagName === 'TEXTAREA' || field.tagName === 'INPUT') {
      return field.value || '';
    }
    // For contenteditable, innerText faithfully captures user newlines in Chromium
    return (field.innerText || field.textContent || '').replace(/\r\n/g, '\n').trim();
  }

  /**
   * Safely replaces text in Lexical, ProseMirror, Quill, and native textareas.
   * Preserves framework virtual state and ensures Send button is enabled.
   */
  function writeFieldText(field, newText) {
    if (!field) return false;
    field.focus();

    const isInputOrTextarea = field.tagName === 'TEXTAREA' || field.tagName === 'INPUT';

    if (isInputOrTextarea) {
      // Use prototype setter for React-controlled textareas
      const prototypeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      )?.set;
      if (prototypeSetter) {
        prototypeSetter.call(field, newText);
      } else {
        field.value = newText;
      }

      field.dispatchEvent(
        new InputEvent('input', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertText',
          data: newText,
        })
      );
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }

    // Modern rich text editors: contenteditable (ChatGPT, Claude, Gemini)
    // 1. Select all contents in the editable container
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(field);
    selection.removeAllRanges();
    selection.addRange(range);

    // 2. Execute standard insertText (native browser command that rich editors intercept)
    let success = false;
    try {
      success = document.execCommand('insertText', false, newText);
    } catch (e) {
      success = false;
    }

    // 3. Fallback if execCommand was prevented
    if (!success) {
      field.innerHTML = '';
      const lines = newText.split('\n');
      lines.forEach((line) => {
        const p = document.createElement('p');
        p.textContent = line || '\u200B';
        field.appendChild(p);
      });

      field.dispatchEvent(
        new InputEvent('input', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertFromPaste',
          data: newText,
        })
      );
    }

    // Move caret to end
    try {
      const endRange = document.createRange();
      endRange.selectNodeContents(field);
      endRange.collapse(false);
      selection.removeAllRanges();
      selection.addRange(endRange);
    } catch (_) {}

    // Dispatch synthetic events for React state synchronizers
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  /* ================================================================== */
  /* 3. Fast In-Browser Heuristics Engine (Zero Network Dependency)     */
  /* ================================================================== */

  function analyzeTextLocally(text) {
    const raw = text.trim();
    const lower = raw.toLowerCase();
    const words = raw.split(/\s+/).filter(Boolean);
    const count = words.length;

    const hasAudience = /\b(developer|student|teacher|child|beginner|designer|manager|executive|user|client|audience)\b/.test(lower);
    const hasOutput = /\b(list|bullet|table|json|markdown|code|summary|email|steps|guide|essay)\b/.test(lower);
    const hasTech = /\b(react|next\.?js|vue|node|python|typescript|javascript|tailwind|sql|postgres|docker)\b/.test(lower);
    const hasConstraints = /\b(must|should|avoid|don't|do not|limit|concise|detailed|formal|friendly)\b/.test(lower);

    let score = 40;
    if (count > 5) score += 15;
    if (count > 15) score += 15;
    if (hasAudience) score += 10;
    if (hasOutput) score += 10;
    if (hasTech) score += 10;
    if (hasConstraints) score += 10;
    score = Math.min(95, Math.max(25, score));

    // Dynamic questions
    const questions = [];
    if (!hasOutput && questions.length < 3) {
      questions.push({
        id: 'output',
        dimension: 'Format',
        prompt: 'What format do you want?',
        options: ['Step-by-step list', 'Full working code', 'Summary table', 'Short 3-bullet answer'],
      });
    }
    if (!hasAudience && questions.length < 3) {
      questions.push({
        id: 'audience',
        dimension: 'Audience',
        prompt: 'Who is this output for?',
        options: ['Developers', 'Complete beginners', 'Executive team', 'General audience'],
      });
    }
    if (!hasTech && /\b(code|app|website|page|component|script)\b/.test(lower) && questions.length < 3) {
      questions.push({
        id: 'tech',
        dimension: 'Tech Stack',
        prompt: 'Which framework or stack?',
        options: ['Next.js & TypeScript', 'React & Tailwind', 'Python 3', 'Plain HTML/CSS'],
      });
    }

    return { score, questions };
  }

  function synthesizeImprovedPrompt(originalText, answers = {}) {
    const lines = [];
    const lower = originalText.toLowerCase();

    // Role assignment
    if (/\b(code|app|component|bug|website|function)\b/.test(lower)) {
      lines.push('You are a senior software engineer.');
    } else if (/\b(write|essay|article|email|post)\b/.test(lower)) {
      lines.push('You are an expert copywriter and editor.');
    } else {
      lines.push('You are a senior subject-matter expert.');
    }

    lines.push('', `Objective: ${originalText.trim().replace(/[.!]?$/, '.')}`);

    if (answers['audience']) {
      lines.push(`Target Audience: ${answers['audience']}.`);
    }
    if (answers['tech']) {
      lines.push(`Technology Stack: ${answers['tech']}.`);
    }
    if (answers['output']) {
      lines.push(`Output Format: ${answers['output']}.`);
    } else {
      lines.push('Output Format: Clean, structured format with clear headings.');
    }

    lines.push(
      '',
      'Requirements:',
      '- Be concise, clear, and actionable.',
      '- Provide direct solutions without unnecessary filler.',
      '',
      'If anything is ambiguous, ask me one focused question before proceeding.'
    );

    return lines.join('\n');
  }

  /* ================================================================== */
  /* 4. Shadow DOM Isolation & UI Component                             */
  /* ================================================================== */

  let shadowRoot = null;
  let rootContainer = null;
  let activeTargetField = null;
  let currentAnswers = {};
  let currentImprovedText = '';

  function getOrCreateShadowRoot() {
    if (shadowRoot) return shadowRoot;

    rootContainer = document.createElement('div');
    rootContainer.id = 'promptly-extension-root';
    rootContainer.style.all = 'initial';
    rootContainer.style.position = 'absolute';
    rootContainer.style.top = '0';
    rootContainer.style.left = '0';
    rootContainer.style.zIndex = '2147483647';
    document.body.appendChild(rootContainer);

    shadowRoot = rootContainer.attachShadow({ mode: 'open' });
    injectShadowStyles(shadowRoot);
    return shadowRoot;
  }

  function injectShadowStyles(root) {
    const style = document.createElement('style');
    style.textContent = `
      *, *::before, *::after {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Inter, sans-serif;
      }

      :host {
        --p-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        --p-primary: #1f4ae6;
        --p-primary-hover: #173dbd;
        --p-emerald: #10b981;
        --p-amber: #f59e0b;
        --p-rose: #f43f5e;
      }

      .promptly-theme-light {
        --p-bg: #ffffff;
        --p-surface: #f8fafc;
        --p-border: #e2e8f0;
        --p-text: #0f172a;
        --p-text-muted: #64748b;
        --p-pill-bg: #f1f5f9;
        --p-pill-hover: #e2e8f0;
        --p-shadow: 0 10px 30px -4px rgba(15, 23, 42, 0.15), 0 4px 12px -2px rgba(15, 23, 42, 0.08);
      }

      .promptly-theme-dark {
        --p-bg: #18181b;
        --p-surface: #27272a;
        --p-border: #3f3f46;
        --p-text: #fafafa;
        --p-text-muted: #a1a1aa;
        --p-pill-bg: #27272a;
        --p-pill-hover: #3f3f46;
        --p-shadow: 0 10px 30px -4px rgba(0, 0, 0, 0.5), 0 4px 12px -2px rgba(0, 0, 0, 0.3);
      }

      /* Floating Sparkle Trigger Button */
      .promptly-trigger-btn {
        position: fixed;
        width: 30px;
        height: 30px;
        border-radius: 8px;
        background: var(--p-bg);
        border: 1px solid var(--p-border);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        z-index: 2147483646;
      }
      .promptly-trigger-btn:hover {
        transform: scale(1.08);
        border-color: var(--p-primary);
        box-shadow: 0 0 0 2px rgba(31, 74, 230, 0.2);
      }
      .promptly-trigger-btn svg {
        width: 16px;
        height: 16px;
        fill: none;
        stroke: var(--p-primary);
        stroke-width: 2.2;
      }

      /* Floating Popover Container */
      .promptly-popover {
        position: fixed;
        width: 360px;
        max-width: calc(100vw - 32px);
        background: var(--p-bg);
        border: 1px solid var(--p-border);
        border-radius: 14px;
        box-shadow: var(--p-shadow);
        color: var(--p-text);
        padding: 16px;
        font-size: 13px;
        line-height: 1.5;
        z-index: 2147483647;
        animation: promptlyFadeUp 0.18s cubic-bezier(0.16, 1, 0.3, 1);
      }

      @keyframes promptlyFadeUp {
        from { opacity: 0; transform: translateY(6px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      /* Header */
      .promptly-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--p-border);
      }
      .promptly-title-area {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .promptly-logo-badge {
        width: 22px;
        height: 22px;
        border-radius: 6px;
        background: var(--p-primary);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
      }
      .promptly-title {
        font-weight: 600;
        font-size: 13px;
        color: var(--p-text);
      }
      .promptly-close-btn {
        background: transparent;
        border: none;
        color: var(--p-text-muted);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        font-size: 16px;
        line-height: 1;
      }
      .promptly-close-btn:hover {
        color: var(--p-text);
      }

      /* Quality Score Gauge */
      .promptly-score-banner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: var(--p-surface);
        border: 1px solid var(--p-border);
        border-radius: 10px;
        padding: 8px 12px;
        margin-bottom: 12px;
      }
      .promptly-score-badge {
        font-size: 11px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 20px;
      }
      .score-emerald { background: rgba(16, 185, 129, 0.15); color: var(--p-emerald); }
      .score-amber { background: rgba(245, 158, 11, 0.15); color: var(--p-amber); }
      .score-rose { background: rgba(244, 63, 94, 0.15); color: var(--p-rose); }

      /* Questions & Quick Select Pills */
      .promptly-section-title {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--p-text-muted);
        margin-bottom: 6px;
      }
      .promptly-question-group {
        margin-bottom: 10px;
      }
      .promptly-question-text {
        font-size: 12px;
        font-weight: 500;
        color: var(--p-text);
        margin-bottom: 6px;
      }
      .promptly-pills-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .promptly-pill {
        background: var(--p-pill-bg);
        border: 1px solid var(--p-border);
        border-radius: 6px;
        color: var(--p-text);
        font-size: 11px;
        font-weight: 500;
        padding: 4px 8px;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .promptly-pill:hover {
        background: var(--p-pill-hover);
        border-color: var(--p-primary);
      }
      .promptly-pill.selected {
        background: rgba(31, 74, 230, 0.15);
        border-color: var(--p-primary);
        color: var(--p-primary);
        font-weight: 600;
      }

      /* Preview Box */
      .promptly-preview-box {
        background: var(--p-surface);
        border: 1px solid var(--p-border);
        border-radius: 8px;
        padding: 10px;
        font-size: 12px;
        color: var(--p-text);
        max-height: 120px;
        overflow-y: auto;
        white-space: pre-wrap;
        word-break: break-word;
        margin-top: 10px;
        margin-bottom: 12px;
      }

      /* Buttons */
      .promptly-footer {
        display: flex;
        gap: 8px;
        margin-top: 12px;
      }
      .promptly-btn-primary {
        flex: 1;
        background: var(--p-primary);
        color: #fff;
        border: none;
        border-radius: 8px;
        padding: 8px 12px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        transition: background 0.15s ease;
      }
      .promptly-btn-primary:hover {
        background: var(--p-primary-hover);
      }
      .promptly-btn-secondary {
        background: var(--p-surface);
        border: 1px solid var(--p-border);
        color: var(--p-text);
        border-radius: 8px;
        padding: 8px 12px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
      }
      .promptly-btn-secondary:hover {
        background: var(--p-pill-hover);
      }
    `;
    root.appendChild(style);
  }

  /* ================================================================== */
  /* 5. Floating Button & Popover Positioning Logic                     */
  /* ================================================================== */

  function renderFloatingButton(field) {
    activeTargetField = field;
    const shadow = getOrCreateShadowRoot();

    let trigger = shadow.querySelector('.promptly-trigger-btn');
    if (!trigger) {
      trigger = document.createElement('button');
      trigger.className = 'promptly-trigger-btn';
      trigger.title = 'Enhance prompt with Promptly (Ctrl/Cmd + Shift + P)';
      trigger.setAttribute('aria-label', 'Enhance prompt with Promptly');
      trigger.innerHTML = `
        <svg viewBox="0 0 24 24">
          <path d="M12 2l2.4 6.8L21 11.2l-6.6 2.4L12 20.4l-2.4-6.8L3 11.2l6.6-2.4L12 2z"/>
        </svg>
      `;
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        togglePopover();
      });
      shadow.appendChild(trigger);
    }

    positionTriggerButton(trigger, field);
  }

  function positionTriggerButton(trigger, field) {
    if (!trigger || !field) return;
    const rect = field.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      trigger.style.display = 'none';
      return;
    }

    trigger.style.display = 'flex';
    // Position inside bottom right of input box with safe offset
    const top = Math.max(10, rect.bottom - 38);
    const left = Math.max(10, rect.right - 38);
    trigger.style.top = `${top}px`;
    trigger.style.left = `${left}px`;

    // Apply theme
    const themeClass = isDarkMode() ? 'promptly-theme-dark' : 'promptly-theme-light';
    trigger.className = `promptly-trigger-btn ${themeClass}`;
  }

  function togglePopover() {
    const shadow = getOrCreateShadowRoot();
    const existing = shadow.querySelector('.promptly-popover');
    if (existing) {
      existing.remove();
      return;
    }
    openPopover();
  }

  function openPopover() {
    if (!activeTargetField) return;
    const shadow = getOrCreateShadowRoot();
    closePopover(); // remove any existing

    const rawText = readFieldText(activeTargetField);
    const themeClass = isDarkMode() ? 'promptly-theme-dark' : 'promptly-theme-light';

    const popover = document.createElement('div');
    popover.className = `promptly-popover ${themeClass}`;

    if (!rawText.trim()) {
      popover.innerHTML = `
        <div class="promptly-header">
          <div class="promptly-title-area">
            <span class="promptly-logo-badge">✦</span>
            <span class="promptly-title">Promptly</span>
          </div>
          <button class="promptly-close-btn" data-action="close">×</button>
        </div>
        <div style="padding: 10px 0; text-align: center; color: var(--p-text-muted);">
          Write your request in the chat first, then click Promptly to optimize it.
        </div>
      `;
    } else {
      const { score, questions } = analyzeTextLocally(rawText);
      currentAnswers = {};
      currentImprovedText = synthesizeImprovedPrompt(rawText, currentAnswers);

      const scoreClass = score > 80 ? 'score-emerald' : score >= 50 ? 'score-amber' : 'score-rose';
      const scoreLabel = score > 80 ? 'High Quality' : score >= 50 ? 'Could Improve' : 'Needs Detail';

      let questionsHtml = '';
      if (questions.length > 0) {
        questionsHtml = `
          <div class="promptly-section-title">Quick Clarifications</div>
          ${questions
            .map(
              (q) => `
            <div class="promptly-question-group" data-q-id="${q.id}">
              <div class="promptly-question-text">${q.prompt}</div>
              <div class="promptly-pills-row">
                ${q.options
                  .map(
                    (opt) => `
                  <button type="button" class="promptly-pill" data-q-id="${q.id}" data-val="${opt}">${opt}</button>
                `
                  )
                  .join('')}
              </div>
            </div>
          `
            )
            .join('')}
        `;
      }

      popover.innerHTML = `
        <div class="promptly-header">
          <div class="promptly-title-area">
            <span class="promptly-logo-badge">✦</span>
            <span class="promptly-title">Promptly Assistant</span>
          </div>
          <button class="promptly-close-btn" data-action="close">×</button>
        </div>

        <div class="promptly-score-banner">
          <span style="font-size: 12px; font-weight: 500;">Prompt Score</span>
          <span class="promptly-score-badge ${scoreClass}">${score}% • ${scoreLabel}</span>
        </div>

        ${questionsHtml}

        <div class="promptly-section-title">Optimized Preview</div>
        <div class="promptly-preview-box" id="promptly-preview">${escapeHtml(currentImprovedText)}</div>

        <div class="promptly-footer">
          <button type="button" class="promptly-btn-primary" data-action="replace">
            <span>Enhance & Replace</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
          <button type="button" class="promptly-btn-secondary" data-action="copy">Copy</button>
        </div>
      `;
    }

    // Attach event handlers inside popover
    popover.addEventListener('click', (e) => {
      const target = e.target.closest('button');
      if (!target) return;

      const action = target.dataset.action;
      if (action === 'close') {
        closePopover();
      } else if (action === 'replace') {
        if (activeTargetField && currentImprovedText) {
          writeFieldText(activeTargetField, currentImprovedText);
          closePopover();
        }
      } else if (action === 'copy') {
        navigator.clipboard.writeText(currentImprovedText);
        target.textContent = 'Copied!';
        setTimeout(() => (target.textContent = 'Copy'), 1500);
      } else if (target.classList.contains('promptly-pill')) {
        const qId = target.dataset.qId;
        const val = target.dataset.val;

        // Toggle selected pill
        const parent = target.closest('.promptly-pills-row');
        parent.querySelectorAll('.promptly-pill').forEach((p) => p.classList.remove('selected'));
        target.classList.add('selected');

        currentAnswers[qId] = val;
        currentImprovedText = synthesizeImprovedPrompt(rawText, currentAnswers);

        const previewEl = popover.querySelector('#promptly-preview');
        if (previewEl) previewEl.textContent = currentImprovedText;
      }
    });

    shadow.appendChild(popover);

    // Position popover safely relative to field
    const rect = activeTargetField.getBoundingClientRect();
    const popoverHeight = 360;
    const top = Math.max(16, rect.top - popoverHeight - 8);
    const left = Math.max(16, Math.min(window.innerWidth - 380, rect.right - 360));

    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
  }

  function closePopover() {
    if (!shadowRoot) return;
    const existing = shadowRoot.querySelector('.promptly-popover');
    if (existing) existing.remove();
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /* ================================================================== */
  /* 6. Keyboard Shortcut: Cmd/Ctrl + Shift + P                         */
  /* ================================================================== */

  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
      e.preventDefault();
      const target = findTargetInput();
      if (target) {
        target.focus();
        renderFloatingButton(target);
        openPopover();
      }
    } else if (e.key === 'Escape') {
      closePopover();
    }
  });

  // Close popover when clicking anywhere outside
  window.addEventListener('mousedown', (e) => {
    if (rootContainer && !e.composedPath().includes(rootContainer)) {
      closePopover();
    }
  });

  /* ================================================================== */
  /* 7. Observer & Focus Listeners (Debounced & Privacy-First)           */
  /* ================================================================== */

  let scanTimer = null;
  function scheduleScan() {
    if (scanTimer) clearTimeout(scanTimer);
    scanTimer = setTimeout(() => {
      const field = findTargetInput();
      if (field) {
        renderFloatingButton(field);
      }
    }, 300);
  }

  // Observe page mutations (route changes in ChatGPT/Claude/Gemini)
  const observer = new MutationObserver(() => {
    scheduleScan();
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Update button coordinates on scroll and resize
  window.addEventListener('resize', scheduleScan, { passive: true });
  window.addEventListener('scroll', scheduleScan, { passive: true });

  // Reposition on focus
  document.addEventListener(
    'focusin',
    (e) => {
      const target = e.target;
      if (target && target.matches && TARGET_SELECTORS.some((sel) => target.matches(sel))) {
        renderFloatingButton(target);
      }
    },
    true
  );

  // Initial trigger
  scheduleScan();
})();
