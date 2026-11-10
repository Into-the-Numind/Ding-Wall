/*
 * 钉一钉 · 三个人的墙 —— 浏览器半侧 bundle
 *
 * 形态：注册进 DSH 的 `main` 面板（key = ding-wall）与 `sidebar.panellist`
 * 图标（id = ding-wall），两者 id 相同即互相绑定。
 *
 * 约束：只向平台模块表要 `react`；不引 Node 模块。视觉层完整复原网页版
 * 「暖纸工作室」设计（纸感底、宋体标题、便签/图钉/胶带、牛皮纸信箱、
 * 方格纸心律、晨报排版），是一块自包含的纸面，不跟随 Harness 明暗主题。
 */
window.__ModuleLoader__.load({
  id: 'dsh-ding-wall',
  factory: (require) => {
    const React = require('react');
    const h = React.createElement;
    const { useCallback, useEffect, useMemo, useRef, useState } = React;

    const NAMESPACE = 'dsh-ding-wall';
    const PANEL_ID = 'ding-wall';
    const API = '/api/ding-wall';
    const MEMBER_KEY = 'ding-wall.member';
    const CLIENT_ID = `dw-${Math.random().toString(36).slice(2, 10)}`;
    const EMOJIS = ['🦊', '🐻', '🐼', '🐸', '🦉', '🐙', '🦁', '🐧', '🐳', '🦋', '🌻', '🍄'];

    /* ------------------------------------------------------------ 文案 */
    const ZH = {
      sidebarLabel: '钉一钉',
      brand: '钉一钉',
      subtitle: '三个人的墙',
      newPin: '钉一张',
      morning: '晨会',
      morningShort: '晨报',
      claim: '认领名片',
      editCard: '名片',
      ideas: '灵感便签',
      todos: '待办卡',
      echo: '匿名信箱',
      pulse: '团队心律',
      ideasHint: '随手一贴，先记下来。',
      todosHint: '拖到「推进中」，再拖到「已划掉」。',
      echoHint: '不方便当面说的，投进来。不记名字。',
      pulseHint: '墙上发生了什么，这里会知道。',
      drawIdea: '抽一张灵感',
      addIdea: '钉一张',
      addTodo: '加一张',
      drawLetter: '拆一封',
      writeLetter: '投一封信',
      thanks: '点亮',
      fire: '有戏',
      echoSecond: '附议',
      pinned: '已钉到最前',
      pin: '钉到最前',
      unpin: '取消置顶',
      edit: '编辑',
      delete: '删除',
      confirmDelete: '再点一次确认',
      save: '保存',
      cancel: '取消',
      open: '展开',
      close: '收起',
      fold: '合上',
      read: '拆开读',
      anonymous: '匿名',
      anonymousShort: '匿名',
      people: '人',
      online: '在线',
      today: '今天上墙',
      week: '近七日',
      weekTotal: '本周共',
      sheets: '张',
      completion: '待办完成率',
      doneOf: '已划掉',
      members: '成员活跃',
      nothing: '还没有数据',
      emptyIdeasTitle: '这面墙还在等第一张纸',
      emptyIdeasDesc: '想到什么先钉上来。半句话、一个名字、一张草图，都算数。',
      emptyTodosTitle: '待办卡还是空的',
      emptyTodosDesc: '一张卡一件事，拖来拖去就好。',
      emptyLettersTitle: '信箱还是空的',
      emptyLettersDesc: '那些不方便当面说的话，投进来。没有署名，也查不到是谁。',
      loadDemo: '贴几张示例',
      clearDemo: '一键撕掉示例',
      demoBanner: '正在展示示例素材',
      demoTag: '示例',
      composerIdeaTitle: '钉一张想法',
      composerTodoTitle: '加一张待办',
      composerOpinionTitle: '投一封匿名信',
      composerIdeaPlaceholder: '先写下来，再慢慢变好。',
      composerTodoPlaceholder: '这周要往前推的一件事。',
      composerOpinionPlaceholder: '不方便当面说的，写在这里。',
      idea: '想法',
      todo: '待办',
      opinion: '匿名意见',
      moodCasual: '随口一说',
      moodSuggest: '强烈建议',
      moodWorry: '有点在意',
      moodVent: '纯吐槽',
      submit: '钉上墙',
      submitting: '钉上墙…',
      composerHint: 'Ctrl/⌘ + Enter 提交 · Esc 关闭',
      anonymousNote: '这封信不会记录作者或任何身份信息。',
      identityTitle: '你是墙上哪位？',
      identityDesc: '留一个名字和头像，你的便签与事项卡会挂上它。匿名意见不会。',
      identityEditTitle: '改一张名片',
      nameLabel: '你的名字',
      namePlaceholder: '例如：大川',
      emojiLabel: '挑一个头像',
      identitySubmit: '钉上我的名片',
      identitySaving: '正在钉…',
      nameRequired: '先写一个名字吧。',
      nameTooLong: '名字最多 24 个字。',
      justNow: '刚刚',
      yesterday: '昨天',
      minutesAgo: '分钟前',
      hoursAgo: '小时前',
      daysAgo: '天前',
      statusTodo: '待办',
      statusDoing: '推进中',
      statusDone: '已划掉',
      cycleStatus: '切换状态',
      doneToast: '划掉一张，干得漂亮',
      undo: '撤销',
      moveDone: '这张卡已完成',
      undoDone: '已撤销',
      offRefresh: '刷新',
      sharedMode: '共享墙',
      localMode: '本机墙',
      sharedHint: '连着团队墙服务',
      localHint: '数据只存在这台设备',
      noMembers: '墙上只有你',
      identityHint: '点右上角改名片',
      morningTitle: '钉一钉 · 晨报',
      morningIssue: '第 {n} 期',
      morningEditor: '编辑部：全体成员',
      headline: '今日头条',
      ideasGlance: '灵感速览',
      todoBoard: '待办战况',
      echoLetter: '匿名来信',
      pulseLine: '团队心律',
      noTodo: '没有排队的待办，松一口气。',
      noEcho: '信箱里还没有信。',
      noIdea: '墙上还没有想法，钉第一张吧。',
      page: '页',
      prev: '上一页',
      next: '下一页',
      autoPlay: '自动播放',
      autoPlaying: '暂停播放',
      exit: '退出',
      footerHint: 'N 钉一张 · M 晨会 · Esc 关闭',
      offline: '连不上墙，正在重试…',
      errorPrefix: '出了点问题：',
      demoToast: '示例素材贴上墙了，随便点',
      demoCleared: '示例撕掉了',
      ideaAdded: '想法钉上墙了',
      todoAdded: '待办加上墙了',
      letterSent: '信投进信箱了',
      reactNeedIdentity: '先认领一张名片，才能盖章',
      morningRequires: '墙上还没有内容，先钉一张吧',
      loading: '正在打开这面墙…',
      retry: '重试',
      anonSeal: '没有署名',
    };
    const EN = {
      sidebarLabel: 'Ding Wall',
      brand: 'Ding Wall',
      subtitle: 'for three',
      newPin: 'New pin',
      morning: 'Morning',
      morningShort: 'Paper',
      claim: 'Claim card',
      editCard: 'My card',
      ideas: 'Ideas',
      todos: 'To-dos',
      echo: 'Anonymous box',
      pulse: 'Team pulse',
      ideasHint: 'Pin it first, polish later.',
      todosHint: 'Drag between lanes to move it forward.',
      echoHint: 'Say what is hard to say. No names.',
      pulseHint: 'What happened on the wall, at a glance.',
      drawIdea: 'Draw one',
      addIdea: 'Pin one',
      addTodo: 'Add card',
      drawLetter: 'Draw a letter',
      writeLetter: 'Write a letter',
      thanks: 'Light it',
      fire: 'Love it',
      echoSecond: 'Second',
      pinned: 'Pinned to top',
      pin: 'Pin to top',
      unpin: 'Unpin',
      edit: 'Edit',
      delete: 'Delete',
      confirmDelete: 'Click again',
      save: 'Save',
      cancel: 'Cancel',
      open: 'Open',
      close: 'Close',
      fold: 'Fold',
      read: 'Read',
      anonymous: 'Anonymous',
      anonymousShort: 'Anonymous',
      people: 'people',
      online: 'online',
      today: 'Pinned today',
      week: 'Last 7 days',
      weekTotal: 'This week',
      sheets: '',
      completion: 'Done rate',
      doneOf: 'done',
      members: 'Members',
      nothing: 'No data yet',
      emptyIdeasTitle: 'The wall is waiting for its first paper',
      emptyIdeasDesc: 'Half a sentence, a name, a sketch — everything counts.',
      emptyTodosTitle: 'No to-do cards yet',
      emptyTodosDesc: 'One card, one thing. Drag it along.',
      emptyLettersTitle: 'The box is empty',
      emptyLettersDesc: 'Say what is hard to say. No signature, no trace.',
      loadDemo: 'Load sample pins',
      clearDemo: 'Tear off samples',
      demoBanner: 'Showing sample pins',
      demoTag: 'Sample',
      composerIdeaTitle: 'Pin an idea',
      composerTodoTitle: 'Add a to-do',
      composerOpinionTitle: 'Write an anonymous letter',
      composerIdeaPlaceholder: 'Write it down first.',
      composerTodoPlaceholder: 'One thing to push forward this week.',
      composerOpinionPlaceholder: 'Say what you cannot say out loud.',
      idea: 'Idea',
      todo: 'To-do',
      opinion: 'Anonymous',
      moodCasual: 'Passing thought',
      moodSuggest: 'Strong suggestion',
      moodWorry: 'A bit worried',
      moodVent: 'Just venting',
      submit: 'Pin it',
      submitting: 'Pinning…',
      composerHint: 'Ctrl/⌘ + Enter to submit · Esc to close',
      anonymousNote: 'No author or identity is stored for this letter.',
      identityTitle: 'Who are you on the wall?',
      identityDesc: 'A name and a face for your notes and cards. Anonymous letters never use it.',
      identityEditTitle: 'Edit my card',
      nameLabel: 'Your name',
      namePlaceholder: 'e.g. River',
      emojiLabel: 'Pick a face',
      identitySubmit: 'Pin my card',
      identitySaving: 'Pinning…',
      nameRequired: 'Write a name first.',
      nameTooLong: 'At most 24 characters.',
      justNow: 'just now',
      yesterday: 'yesterday',
      minutesAgo: ' min ago',
      hoursAgo: ' h ago',
      daysAgo: ' d ago',
      statusTodo: 'To-do',
      statusDoing: 'Doing',
      statusDone: 'Done',
      cycleStatus: 'Change status',
      doneToast: 'One card done. Nice.',
      undo: 'Undo',
      moveDone: 'Card completed',
      undoDone: 'Undone',
      offRefresh: 'Refresh',
      sharedMode: 'Shared wall',
      localMode: 'Local wall',
      sharedHint: 'Connected to the team wall service',
      localHint: 'Stored on this device only',
      noMembers: 'Only you here',
      identityHint: 'Click your card to edit',
      morningTitle: 'Ding Wall · Morning Paper',
      morningIssue: 'Issue {n}',
      morningEditor: 'By the whole team',
      headline: 'Today\'s headline',
      ideasGlance: 'Ideas at a glance',
      todoBoard: 'To-do front',
      echoLetter: 'An anonymous letter',
      pulseLine: 'Team pulse',
      noTodo: 'Nothing queued. Breathe.',
      noEcho: 'No letters yet.',
      noIdea: 'The wall is empty. Pin the first note.',
      page: '/',
      prev: 'Prev',
      next: 'Next',
      autoPlay: 'Auto play',
      autoPlaying: 'Pause',
      exit: 'Exit',
      footerHint: 'N new pin · M morning · Esc close',
      offline: 'Cannot reach the wall, retrying…',
      errorPrefix: 'Something went wrong: ',
      demoToast: 'Sample pins loaded. Click around.',
      demoCleared: 'Samples torn off',
      ideaAdded: 'Idea pinned',
      todoAdded: 'To-do added',
      letterSent: 'Letter delivered',
      reactNeedIdentity: 'Claim a card first',
      morningRequires: 'Nothing on the wall yet.',
      loading: 'Opening the wall…',
      retry: 'Retry',
      anonSeal: 'No signature',
    };

    /* ------------------------------------------------------------ 工具 */
    function cx(...values) {
      return values.filter(Boolean).join(' ');
    }
    function loadSavedMember() {
      try {
        const raw = window.localStorage.getItem(MEMBER_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.id === 'string' && typeof parsed.name === 'string') return parsed;
      } catch {
        /* 忽略坏数据 */
      }
      return null;
    }
    function saveMember(member) {
      try {
        if (member) window.localStorage.setItem(MEMBER_KEY, JSON.stringify(member));
        else window.localStorage.removeItem(MEMBER_KEY);
      } catch {
        /* 隐私模式等：忽略 */
      }
    }
    function dayKey(date) {
      const d = date instanceof Date ? date : new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    function relTime(iso, lang) {
      const then = new Date(iso).getTime();
      if (!Number.isFinite(then)) return '';
      const diff = Math.max(0, Date.now() - then);
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) return lang === 'zh' ? '刚刚' : 'just now';
      if (minutes < 60) return lang === 'zh' ? `${minutes} 分钟前` : `${minutes} min ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return lang === 'zh' ? `${hours} 小时前` : `${hours} h ago`;
      const days = Math.floor(hours / 24);
      if (days === 1) return lang === 'zh' ? '昨天' : 'yesterday';
      const d = new Date(then);
      if (days < 7) return lang === 'zh' ? `${days} 天前` : `${days} d ago`;
      return lang === 'zh' ? `${d.getMonth() + 1}月${d.getDate()}日` : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    function fullTime(iso, lang) {
      const d = new Date(iso);
      if (!Number.isFinite(d.getTime())) return '';
      return d.toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    function todayLabel(lang) {
      return new Date().toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      });
    }
    function truncate(text, max) {
      return text.length > max ? `${text.slice(0, max)}…` : text;
    }
    function isTypingTarget(target) {
      if (!target) return false;
      const tag = String(target.tagName || '').toLowerCase();
      return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable === true;
    }
    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    /* -------------------------------------------------------------- API */
    async function request(path, { method = 'GET', body, memberId } = {}) {
      const headers = { accept: 'application/json', 'x-client-id': CLIENT_ID };
      if (body !== undefined) headers['content-type'] = 'application/json';
      if (memberId) headers['x-member-id'] = memberId;
      const response = await fetch(`${API}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = payload && payload.error && payload.error.message;
        const error = new Error(typeof message === 'string' ? message : `request failed (${response.status})`);
        error.code = payload && payload.error && payload.error.code;
        error.status = response.status;
        throw error;
      }
      return payload;
    }

    /* ---------------------------------------------------------- 样式表 */
    const CSS = String.raw`
/* ============================================================
   钉一钉 · 三个人的墙 —— 面板视觉层（复原网页版「暖纸工作室」）
   纸感底色 / 宋体标题 / 便签 / 图钉 / 胶带 / 牛皮纸信箱 / 方格纸
   ============================================================ */
.dw-root {
  --dw-paper: #f3ecdf;
  --dw-paper-deep: #e9dfcd;
  --dw-paper-warm: #f7f1e5;
  --dw-card: #faf6ec;
  --dw-ink: #22201c;
  --dw-ink-soft: #5c554a;
  --dw-ink-faint: #8a8175;
  --dw-rule: rgba(34, 32, 28, 0.16);
  --dw-rule-soft: rgba(34, 32, 28, 0.09);
  --dw-red: #c3472f;
  --dw-red-deep: #9e3524;
  --dw-red-wash: rgba(195, 71, 47, 0.1);
  --dw-amber: #d99a2b;
  --dw-amber-deep: #a9711a;
  --dw-amber-wash: rgba(217, 154, 43, 0.16);
  --dw-blue: #2f5375;
  --dw-blue-deep: #223e58;
  --dw-green: #57795f;
  --dw-green-deep: #405d47;
  --dw-kraft: #d8c3a1;
  --dw-kraft-deep: #c3a880;
  --dw-sticky-1: #f0d9a8;
  --dw-sticky-2: #e8c3b8;
  --dw-sticky-3: #c9d8dd;
  --dw-sticky-4: #d6dfc8;
  --dw-sticky-5: #efe3c2;
  --dw-font-display: "Songti SC", "Songti TC", "STSong", "Noto Serif SC",
    "Source Han Serif SC", "SimSun", serif;
  --dw-font-body: "PingFang SC", "Hiragino Sans GB", "Noto Sans SC",
    "Microsoft YaHei", system-ui, -apple-system, "Segoe UI", sans-serif;
  --dw-font-label: "Avenir Next Condensed", "Arial Narrow", "PingFang SC",
    "Hiragino Sans GB", sans-serif;
  --dw-ease: cubic-bezier(0.16, 1, 0.3, 1);
  --dw-shadow-note: 0 1px 0 rgba(34, 32, 28, 0.1),
    0 2px 3px -1px rgba(34, 32, 28, 0.16),
    0 14px 20px -16px rgba(34, 32, 28, 0.5);
  --dw-shadow-lift: 0 2px 0 rgba(34, 32, 28, 0.07),
    0 22px 30px -18px rgba(34, 32, 28, 0.5);
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color-scheme: light;
  color: var(--dw-ink);
  font-family: var(--dw-font-body);
  font-size: 13px;
  line-height: 1.65;
  background-color: var(--dw-paper);
  background-image:
    radial-gradient(120% 90% at 18% 0%, rgba(255, 249, 232, 0.9) 0%, rgba(255, 249, 232, 0) 55%),
    radial-gradient(80% 70% at 92% 12%, rgba(232, 205, 166, 0.28) 0%, rgba(232, 205, 166, 0) 60%),
    radial-gradient(120% 120% at 50% 105%, rgba(150, 126, 94, 0.18) 0%, rgba(150, 126, 94, 0) 55%),
    repeating-linear-gradient(92deg, rgba(124, 103, 76, 0.035) 0 1px, transparent 1px 4px),
    repeating-linear-gradient(2deg, rgba(255, 255, 255, 0.05) 0 1px, transparent 1px 5px);
  container-type: inline-size;
  -webkit-font-smoothing: antialiased;
}
.dw-root::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.5;
  mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.86' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.055'/%3E%3C/svg%3E");
}
.dw-root *,
.dw-root *::before,
.dw-root *::after {
  box-sizing: border-box;
}
.dw-root button,
.dw-root input,
.dw-root textarea,
.dw-root select {
  font: inherit;
}
.dw-root h1,
.dw-root h2,
.dw-root h3,
.dw-root p {
  margin: 0;
}
.dw-root :focus-visible {
  outline: 2px solid var(--dw-red);
  outline-offset: 2px;
}
.dw-root ::selection {
  background: var(--dw-amber-wash);
  color: var(--dw-ink);
}
.dw-spacer {
  flex: 1;
}

/* ------------------------------------------------------------- 顶栏 */
.dw-head {
  position: relative;
  z-index: 1;
  flex: none;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px 24px;
  flex-wrap: wrap;
  padding: 20px clamp(16px, 2.4cqw, 30px) 13px;
  border-bottom: 1px solid var(--dw-rule);
}
.dw-brand {
  display: flex;
  align-items: flex-start;
  gap: 13px;
  min-width: 0;
}
.dw-pin {
  flex: none;
  width: clamp(18px, 2.1cqw, 26px);
  height: clamp(18px, 2.1cqw, 26px);
  margin-top: 9px;
  border-radius: 50%;
  background: radial-gradient(circle at 34% 30%, #f4a08e 0%, #d35b41 34%, #a53a26 78%, #7d2a1a 100%);
  box-shadow:
    0 2px 2px rgba(34, 32, 28, 0.35),
    0 6px 8px -4px rgba(34, 32, 28, 0.45),
    inset 0 -1px 2px rgba(80, 20, 10, 0.5);
  transform: rotate(-9deg);
}
.dw-brand h1 {
  font-family: var(--dw-font-display);
  font-size: clamp(34px, 4.6cqw, 56px);
  font-weight: 700;
  line-height: 0.92;
  letter-spacing: 0.015em;
  color: var(--dw-ink);
}
.dw-brand .dw-sub {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 12px;
  margin-top: 8px;
  font-family: var(--dw-font-display);
  font-size: clamp(12px, 1.15cqw, 15px);
  letter-spacing: 0.18em;
  color: var(--dw-ink-soft);
}
.dw-brand .dw-sub::after {
  content: "PIN WALL · NO.001";
  font-family: var(--dw-font-label);
  font-size: 8.5px;
  letter-spacing: 0.24em;
  color: var(--dw-ink-faint);
  transform: translateY(-1px);
}
.dw-head-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 9px;
  min-width: 0;
}
.dw-date {
  display: flex;
  align-items: baseline;
  gap: 9px;
  font-family: var(--dw-font-display);
  font-size: 12.5px;
  letter-spacing: 0.04em;
  color: var(--dw-ink-soft);
  white-space: nowrap;
}
.dw-date::before {
  content: "TODAY";
  font-family: var(--dw-font-label);
  font-size: 8.5px;
  font-weight: 600;
  letter-spacing: 0.2em;
  color: var(--dw-ink-faint);
}
.dw-head-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}
.dw-presence {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-right: 2px;
}
.dw-face {
  position: relative;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1px solid rgba(34, 32, 28, 0.24);
  background: var(--dw-card);
  box-shadow: 0 1px 2px rgba(34, 32, 28, 0.16);
  font-size: 14px;
  line-height: 1;
}
.dw-face.is-online::after {
  content: "";
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--dw-green);
  border: 1.5px solid var(--dw-paper);
}
.dw-people-count {
  margin-left: 2px;
  font-size: 10.5px;
  letter-spacing: 0.04em;
  color: var(--dw-ink-faint);
  white-space: nowrap;
}

/* ------------------------------------------------------------- 按钮 */
.dw-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 34px;
  padding: 6px 13px;
  border: 1px solid var(--dw-ink);
  border-radius: 3px;
  background: transparent;
  color: var(--dw-ink);
  font-family: var(--dw-font-body);
  font-size: 12px;
  letter-spacing: 0.03em;
  cursor: pointer;
  white-space: nowrap;
  transition:
    transform 0.16s var(--dw-ease),
    background-color 0.16s var(--dw-ease),
    color 0.16s var(--dw-ease),
    border-color 0.16s var(--dw-ease),
    box-shadow 0.16s var(--dw-ease);
}
.dw-btn:hover {
  background: var(--dw-ink);
  color: var(--dw-paper-warm);
}
.dw-btn:active {
  transform: translate(1px, 1px);
}
.dw-btn--primary {
  background: var(--dw-red);
  border-color: var(--dw-red-deep);
  color: #fff7ec;
  box-shadow: 2px 2px 0 rgba(158, 53, 36, 0.35);
}
.dw-btn--primary:hover {
  background: var(--dw-red-deep);
  color: #fff7ec;
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 rgba(158, 53, 36, 0.32);
}
.dw-btn--ink {
  background: var(--dw-ink);
  border-color: var(--dw-ink);
  color: var(--dw-paper-warm);
  box-shadow: 2px 2px 0 rgba(34, 32, 28, 0.16);
}
.dw-btn--ink:hover {
  background: var(--dw-red-deep);
  border-color: var(--dw-red-deep);
  color: #fff7ec;
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 rgba(34, 32, 28, 0.2);
}
.dw-btn--quiet {
  border-color: transparent;
  color: var(--dw-ink-soft);
}
.dw-btn--quiet:hover {
  background: rgba(34, 32, 28, 0.06);
  color: var(--dw-ink);
  border-color: transparent;
}
.dw-btn--small {
  min-height: 29px;
  padding: 4px 10px;
  font-size: 11.5px;
}
.dw-btn--collapse:last-child {
  border-color: rgba(34, 32, 28, 0.22);
  background: rgba(255, 255, 255, 0.35);
}
.dw-btn--collapse:last-child:hover {
  background: var(--dw-ink);
  color: var(--dw-paper-warm);
}
.dw-kbd {
  font-family: var(--dw-font-label);
  font-size: 8.5px;
  letter-spacing: 0.1em;
  line-height: 1.4;
  padding: 0 3px;
  border: 1px solid currentColor;
  border-radius: 2px;
  opacity: 0.6;
}

/* ------------------------------------------------------------- 主体 */
.dw-scroll {
  position: relative;
  z-index: 1;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 18px clamp(14px, 2.2cqw, 28px) 96px;
  scrollbar-width: thin;
  scrollbar-color: rgba(34, 32, 28, 0.24) transparent;
}
.dw-scroll::-webkit-scrollbar {
  width: 10px;
}
.dw-scroll::-webkit-scrollbar-thumb {
  background: rgba(34, 32, 28, 0.22);
  border: 3px solid transparent;
  background-clip: content-box;
  border-radius: 99px;
}
.dw-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 22px;
  align-items: start;
}
.dw-rail {
  display: flex;
  flex-direction: column;
  gap: 26px;
  min-width: 0;
}
.dw-section {
  min-width: 0;
}

/* ------------------------------------------------------- 区块标题 */
.dw-section__head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    "label tools"
    "title tools"
    "hint tools";
  align-items: end;
  gap: 2px 16px;
  padding-bottom: 10px;
  margin-bottom: 14px;
  border-bottom: 1px dashed var(--dw-rule);
}
.dw-section__label {
  grid-area: label;
  display: flex;
  align-items: baseline;
  gap: 9px;
}
.dw-num {
  font-family: var(--dw-font-label);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: var(--dw-red);
}
.dw-tag {
  font-family: var(--dw-font-label);
  font-size: 8.5px;
  letter-spacing: 0.26em;
  color: var(--dw-ink-faint);
}
.dw-section__title {
  grid-area: title;
  display: block;
}
.dw-section__title h2 {
  font-family: var(--dw-font-display);
  font-size: clamp(20px, 2cqw, 26px);
  font-weight: 600;
  letter-spacing: 0.05em;
  line-height: 1.25;
}
.dw-section__hint {
  grid-area: hint;
  display: block;
  margin-top: 3px;
  font-size: 11.5px;
  color: var(--dw-ink-soft);
  line-height: 1.6;
}
.dw-tools {
  grid-area: tools;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
  align-self: end;
}
.dw-demo {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin: 0 0 14px;
  padding: 8px 12px;
  border: 1px dashed var(--dw-amber-deep);
  background: var(--dw-amber-wash);
  border-radius: 2px;
  font-size: 11.5px;
  color: var(--dw-ink-soft);
}
.dw-banner {
  margin-bottom: 12px;
  padding: 7px 12px;
  border: 1px solid rgba(195, 71, 47, 0.3);
  background: var(--dw-red-wash);
  border-radius: 2px;
  font-size: 11.5px;
  color: var(--dw-red-deep);
}
.dw-in {
  animation: dw-in 0.22s var(--dw-ease) both;
}
@keyframes dw-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* --------------------------------------------------------- 01 便签 */
.dw-notes {
  columns: 2;
  column-gap: 14px;
  padding-top: 14px;
}
.dw-note {
  --dw-tilt: 0deg;
  --dw-sticky: var(--dw-sticky-1);
  position: relative;
  break-inside: avoid;
  margin: 0 0 16px;
  padding: 20px 14px 12px;
  background-color: var(--dw-sticky);
  background-image:
    linear-gradient(158deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 46%),
    radial-gradient(125% 95% at 92% 102%, rgba(120, 96, 60, 0.18) 0%, rgba(120, 96, 60, 0) 56%),
    radial-gradient(90% 70% at 0% 0%, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 60%),
    repeating-linear-gradient(0deg, rgba(34, 32, 28, 0.02) 0 1px, transparent 1px 3px);
  border-radius: 1px 2px 3px 1px;
  box-shadow: var(--dw-shadow-note);
  transform: rotate(var(--dw-tilt));
  transform-origin: 50% 10%;
  transition:
    transform 0.24s var(--dw-ease),
    box-shadow 0.24s var(--dw-ease);
  cursor: pointer;
  overflow-wrap: anywhere;
}
.dw-note--tone-1 {
  --dw-sticky: var(--dw-sticky-1);
}
.dw-note--tone-2 {
  --dw-sticky: var(--dw-sticky-2);
}
.dw-note--tone-3 {
  --dw-sticky: var(--dw-sticky-3);
}
.dw-note--tone-4 {
  --dw-sticky: var(--dw-sticky-4);
}
.dw-note--tone-5 {
  --dw-sticky: var(--dw-sticky-5);
}
/* 右下角微翘 */
.dw-note::after {
  content: "";
  position: absolute;
  right: 0;
  bottom: 0;
  width: 24px;
  height: 24px;
  border-radius: 0 0 3px 0;
  background: linear-gradient(
    315deg,
    rgba(255, 255, 255, 0.62) 0%,
    rgba(255, 255, 255, 0.12) 42%,
    rgba(255, 255, 255, 0) 60%
  );
  box-shadow: -1px -1px 3px rgba(120, 96, 60, 0.16) inset;
  pointer-events: none;
}
/* 图钉 / 胶带 */
.dw-notes .dw-note:nth-child(3n + 1)::before {
  content: "";
  position: absolute;
  top: -6px;
  left: 50%;
  z-index: 3;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  transform: translateX(-50%) rotate(-8deg);
  background: radial-gradient(circle at 34% 30%, #f4a08e 0%, #d35b41 34%, #a53a26 78%, #7d2a1a 100%);
  box-shadow:
    0 2px 2px rgba(34, 32, 28, 0.35),
    0 6px 8px -4px rgba(34, 32, 28, 0.45),
    inset 0 -1px 2px rgba(80, 20, 10, 0.5);
}
.dw-notes .dw-note:nth-child(3n + 2)::before {
  content: "";
  position: absolute;
  top: -7px;
  left: 16px;
  z-index: 3;
  width: 66px;
  height: 20px;
  transform: rotate(-3deg);
  background:
    linear-gradient(180deg, rgba(255, 253, 240, 0.62), rgba(244, 235, 205, 0.5)),
    repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.16) 0 2px, rgba(0, 0, 0, 0.03) 2px 4px);
  border-left: 1px solid rgba(120, 100, 70, 0.14);
  border-right: 1px solid rgba(120, 100, 70, 0.14);
  box-shadow: 0 1px 2px rgba(34, 32, 28, 0.12);
  clip-path: polygon(2% 8%, 98% 0%, 100% 92%, 4% 100%);
}
.dw-note:hover {
  transform: rotate(calc(var(--dw-tilt) * 0.25)) translateY(-3px);
  box-shadow:
    0 1px 0 rgba(34, 32, 28, 0.1),
    0 4px 6px -2px rgba(34, 32, 28, 0.18),
    0 22px 28px -20px rgba(34, 32, 28, 0.55);
}
.dw-note.is-open {
  z-index: 5;
  transform: rotate(0deg) translateY(-1px);
  box-shadow: var(--dw-shadow-lift);
  cursor: default;
}
.dw-note.is-pinned {
  box-shadow:
    0 0 0 1px rgba(195, 71, 47, 0.18),
    0 2px 3px -1px rgba(34, 32, 28, 0.18),
    0 14px 20px -14px rgba(34, 32, 28, 0.48);
}
.dw-note__top {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
  font-size: 10.5px;
  color: var(--dw-ink-soft);
}
.dw-face-mini {
  font-size: 12px;
  line-height: 1;
}
.dw-note__time {
  font-size: 10px;
  color: var(--dw-ink-faint);
}
.dw-pin-note {
  font-size: 11px;
  line-height: 1;
}
.dw-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 6px;
  border-radius: 999px;
  border: 1px solid var(--dw-rule);
  font-size: 9.5px;
  letter-spacing: 0.03em;
  color: var(--dw-ink-soft);
  white-space: nowrap;
}
.dw-chip--demo {
  position: absolute;
  top: -1px;
  right: -1px;
  z-index: 6;
  padding: 2px 7px 2px 6px;
  border: 0;
  border-radius: 0 2px 0 7px;
  font-family: var(--dw-font-label);
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: var(--dw-ink);
  background: var(--dw-amber);
  box-shadow: 0 1px 2px rgba(34, 32, 28, 0.2);
  pointer-events: none;
}
.dw-note__text {
  margin: 8px 0 10px;
  font-size: 13.5px;
  line-height: 1.68;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: var(--dw-ink);
}
.dw-note__text.is-clamped {
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.dw-note__foot {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.dw-react {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 27px;
  padding: 2px 8px;
  border: 1px solid rgba(34, 32, 28, 0.22);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.34);
  font-size: 10.5px;
  line-height: 1;
  color: var(--dw-ink-soft);
  cursor: pointer;
  transition:
    transform 0.16s var(--dw-ease),
    background-color 0.16s var(--dw-ease),
    border-color 0.16s var(--dw-ease),
    color 0.16s var(--dw-ease);
}
.dw-react:hover {
  transform: translateY(-1px);
  border-color: var(--dw-ink-soft);
  background: rgba(255, 255, 255, 0.62);
  color: var(--dw-ink);
}
.dw-react.is-mine {
  border-color: var(--dw-red);
  color: var(--dw-red-deep);
  background: var(--dw-red-wash);
}
.dw-react.is-stamping {
  animation: dw-stamp 0.55s var(--dw-ease);
}
@keyframes dw-stamp {
  0% {
    transform: scale(1.28) rotate(-4deg);
  }
  45% {
    transform: scale(0.9) rotate(1deg);
  }
  100% {
    transform: scale(1) rotate(0);
  }
}
.dw-react__count {
  font-family: var(--dw-font-display);
  font-size: 10.5px;
  opacity: 0.82;
}
.dw-note__expand {
  margin-left: auto;
  padding: 3px 2px;
  border: 0;
  background: transparent;
  font-size: 10.5px;
  letter-spacing: 0.04em;
  color: var(--dw-ink-faint);
  text-decoration: underline;
  text-decoration-style: dotted;
  text-decoration-color: var(--dw-rule);
  text-underline-offset: 3px;
  cursor: pointer;
}
.dw-note__expand:hover {
  color: var(--dw-ink);
  text-decoration-color: currentColor;
}
.dw-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed rgba(34, 32, 28, 0.18);
}
.dw-linkbtn {
  padding: 2px 5px;
  border: 0;
  border-radius: 2px;
  background: transparent;
  font-size: 11px;
  color: var(--dw-ink-soft);
  cursor: pointer;
  text-decoration: underline;
  text-decoration-color: transparent;
  text-underline-offset: 3px;
}
.dw-linkbtn:hover {
  color: var(--dw-ink);
  text-decoration-color: var(--dw-rule);
}
.dw-linkbtn--danger:hover {
  color: var(--dw-red-deep);
}
.dw-linkbtn.is-armed {
  color: var(--dw-red);
  font-weight: 600;
}
.dw-editor {
  cursor: auto;
}
.dw-textarea {
  width: 100%;
  min-height: 84px;
  resize: vertical;
  padding: 9px 10px;
  border: 1px solid rgba(34, 32, 28, 0.28);
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.42);
  font-family: var(--dw-font-body);
  font-size: 13px;
  line-height: 1.65;
  color: var(--dw-ink);
}
.dw-textarea:focus {
  outline: none;
  border-color: var(--dw-ink);
  background: rgba(255, 255, 255, 0.68);
}
.dw-form-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed var(--dw-rule);
}

/* --------------------------------------------------------- 02 待办 */
.dw-lanes {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.dw-lane {
  border-top: 1px solid var(--dw-rule-soft);
  padding-top: 10px;
  border-radius: 2px;
}
.dw-lane:first-child {
  border-top: 0;
  padding-top: 0;
}
.dw-lane.is-over {
  background: var(--dw-amber-wash);
  outline: 1px dashed var(--dw-amber-deep);
  outline-offset: 6px;
}
.dw-lane__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.18em;
  color: var(--dw-ink-soft);
}
.dw-lane__count {
  font-family: var(--dw-font-display);
  font-size: 12px;
  letter-spacing: 0;
  color: var(--dw-ink-faint);
}
.dw-lane__empty {
  padding: 6px 2px;
  font-size: 10.5px;
  color: var(--dw-ink-faint);
}
.dw-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.dw-todo {
  position: relative;
  padding: 13px 13px 10px 30px;
  background-color: var(--dw-card);
  background-image:
    linear-gradient(
      90deg,
      transparent 0 27px,
      rgba(195, 71, 47, 0.26) 27px 28px,
      transparent 28px 100%
    ),
    repeating-linear-gradient(
      0deg,
      transparent 0 27px,
      rgba(47, 83, 117, 0.12) 27px 28px
    );
  border: 1px solid rgba(34, 32, 28, 0.16);
  border-radius: 2px;
  box-shadow:
    0 1px 0 rgba(34, 32, 28, 0.08),
    0 3px 5px -3px rgba(34, 32, 28, 0.28);
  cursor: grab;
  overflow-wrap: anywhere;
  transition:
    transform 0.2s var(--dw-ease),
    box-shadow 0.2s var(--dw-ease),
    opacity 0.2s var(--dw-ease);
}
.dw-todo::before {
  content: "";
  position: absolute;
  left: 8px;
  top: 14px;
  bottom: 14px;
  width: 10px;
  pointer-events: none;
  opacity: 0.55;
  background-image: radial-gradient(circle at 50% 50%, rgba(34, 32, 28, 0.2) 1.6px, transparent 2.2px);
  background-size: 10px 26px;
}
.dw-todo:hover {
  transform: translateY(-2px);
  box-shadow:
    0 2px 0 rgba(34, 32, 28, 0.08),
    0 16px 22px -16px rgba(34, 32, 28, 0.42);
}
.dw-todo.is-done {
  opacity: 0.8;
  padding-bottom: 30px;
}
.dw-todo.is-done .dw-todo__text {
  color: var(--dw-ink-soft);
  text-decoration: line-through;
  text-decoration-color: var(--dw-red);
  text-decoration-thickness: 2px;
  text-decoration-skip-ink: none;
}
.dw-todo__top {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
  font-size: 10.5px;
  color: var(--dw-ink-soft);
}
.dw-todo__text {
  margin: 6px 0 8px;
  font-size: 12.5px;
  line-height: 1.62;
  overflow-wrap: anywhere;
}
.dw-todo__foot {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 2px;
  padding-top: 7px;
  border-top: 1px dotted rgba(34, 32, 28, 0.13);
}
.dw-stamp {
  position: absolute;
  right: 9px;
  bottom: 8px;
  padding: 1px 5px;
  border: 1.5px solid var(--dw-red);
  border-radius: 2px;
  font-family: var(--dw-font-label);
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: var(--dw-red);
  transform: rotate(-6deg);
  opacity: 0.8;
  z-index: 2;
}

/* --------------------------------------------------------- 03 信箱 */
.dw-mailbox {
  position: relative;
  padding: 14px;
  background-color: var(--dw-kraft);
  background-image:
    radial-gradient(90% 120% at 0% 0%, rgba(255, 246, 226, 0.42) 0%, rgba(255, 246, 226, 0) 52%),
    radial-gradient(120% 100% at 100% 100%, rgba(107, 79, 45, 0.22) 0%, rgba(107, 79, 45, 0) 60%),
    repeating-linear-gradient(0deg, rgba(91, 66, 36, 0.06) 0 1px, transparent 1px 3px);
  border-radius: 2px;
  box-shadow:
    0 0 0 1px rgba(34, 32, 28, 0.12),
    0 14px 24px -22px rgba(34, 32, 28, 0.7);
}
.dw-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 26px;
  margin: 0 10px 12px;
  border: 1px solid rgba(34, 32, 28, 0.34);
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(34, 32, 28, 0.16), rgba(255, 255, 255, 0.18));
  box-shadow: inset 0 2px 4px rgba(34, 32, 28, 0.28);
}
.dw-slot::after {
  content: "LETTERS";
  font-family: var(--dw-font-label);
  font-size: 8px;
  letter-spacing: 0.34em;
  color: rgba(34, 32, 28, 0.5);
  transform: translateY(1px);
}
.dw-letters {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: clamp(280px, 44cqw, 560px);
  overflow-y: auto;
  padding-right: 2px;
  scrollbar-width: thin;
  scrollbar-color: rgba(34, 32, 28, 0.24) transparent;
}
.dw-letter {
  position: relative;
  padding: 12px 12px 9px;
  background-color: var(--dw-card);
  background-image:
    linear-gradient(164deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0) 52%),
    repeating-linear-gradient(0deg, rgba(34, 32, 28, 0.018) 0 1px, transparent 1px 3px);
  border: 1px solid rgba(34, 32, 28, 0.2);
  border-radius: 2px 2px 5px 2px;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.5) inset,
    0 2px 3px -2px rgba(34, 32, 28, 0.35),
    0 8px 12px -12px rgba(34, 32, 28, 0.5);
  cursor: pointer;
  overflow-wrap: anywhere;
  transition:
    transform 0.2s var(--dw-ease),
    box-shadow 0.2s var(--dw-ease);
}
.dw-letter::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 24px;
  pointer-events: none;
  opacity: 0.5;
  background:
    linear-gradient(150deg, transparent 49.5%, rgba(34, 32, 28, 0.08) 50%, transparent 50.5%),
    linear-gradient(30deg, transparent 49.5%, rgba(34, 32, 28, 0.08) 50%, transparent 50.5%);
}
.dw-letter:hover {
  transform: translateY(-2px);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.5) inset,
    0 14px 20px -16px rgba(34, 32, 28, 0.5);
}
.dw-letter.is-open {
  background-color: var(--dw-paper-warm);
  cursor: default;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.5) inset,
    var(--dw-shadow-lift);
}
.dw-letter__head {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
  font-size: 10px;
  color: var(--dw-ink-faint);
}
.dw-mood {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 6px;
  border: 1px solid var(--dw-rule);
  border-radius: 999px;
  font-size: 9.5px;
  color: var(--dw-ink-soft);
}
.dw-mood--suggest {
  color: var(--dw-red-deep);
  border-color: rgba(195, 71, 47, 0.3);
  background: var(--dw-red-wash);
}
.dw-mood--worry {
  color: var(--dw-amber-deep);
  border-color: rgba(217, 154, 43, 0.35);
  background: var(--dw-amber-wash);
}
.dw-mood--vent {
  color: var(--dw-ink-soft);
  border-color: rgba(34, 32, 28, 0.2);
  background: rgba(34, 32, 28, 0.04);
}
.dw-mood--casual {
  color: var(--dw-ink-soft);
}
.dw-letter__text {
  margin: 8px 0;
  font-size: 12.5px;
  line-height: 1.66;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.dw-letter__text.is-clamped {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.dw-letter__foot {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.dw-letter__seal {
  margin-left: auto;
  padding: 0 6px;
  border: 1px dashed var(--dw-rule);
  border-radius: 999px;
  font-size: 9.5px;
  color: var(--dw-ink-faint);
}
.dw-letter__stamp-line {
  margin-top: 8px;
  font-size: 10px;
  color: var(--dw-ink-faint);
}
.dw-mailbox .dw-empty {
  border-color: rgba(34, 32, 28, 0.28);
  background: rgba(255, 255, 255, 0.25);
}

/* --------------------------------------------------------- 04 心律 */
.dw-pulse {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(170px, 0.72fr) minmax(200px, 1fr);
  grid-template-areas:
    "charthead today members"
    "chart completion members"
    "chart completion members";
  gap: 4px 24px;
  align-items: start;
  padding: 16px 18px;
  background-color: #f6f0e3;
  background-image:
    linear-gradient(rgba(47, 83, 117, 0.13) 1px, transparent 1px),
    linear-gradient(90deg, rgba(47, 83, 117, 0.13) 1px, transparent 1px),
    linear-gradient(rgba(47, 83, 117, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(47, 83, 117, 0.05) 1px, transparent 1px);
  background-size:
    48px 48px,
    48px 48px,
    12px 12px,
    12px 12px;
  border-radius: 2px;
  box-shadow: 0 0 0 1px rgba(34, 32, 28, 0.1);
}
.dw-pulse__head {
  grid-area: charthead;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--dw-blue-deep);
}
.dw-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 9.5px;
  color: var(--dw-ink-soft);
}
.dw-legend span {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.dw-dot {
  display: inline-block;
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--dw-ink-faint);
}
.dw-dot--idea {
  background: var(--dw-amber);
}
.dw-dot--todo {
  background: var(--dw-blue);
}
.dw-dot--opinion {
  background: var(--dw-green);
}
.dw-dot--online {
  background: var(--dw-green);
}
.dw-week-wrap {
  grid-area: chart;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 132px;
  padding-top: 10px;
  padding-right: 18px;
  border-right: 1px solid rgba(47, 83, 117, 0.18);
}
.dw-week {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 118px;
  padding-bottom: 2px;
  border-bottom: 1px solid rgba(47, 83, 117, 0.28);
}
.dw-week__col {
  flex: 1;
  display: flex;
  flex-direction: column-reverse;
  gap: 1px;
  height: 100%;
}
.dw-week__bar {
  width: 100%;
  border-radius: 2px 3px 1px 2px;
  opacity: 0.88;
}
.dw-week__bar--ideas {
  background: var(--dw-amber);
}
.dw-week__bar--todos {
  background: var(--dw-blue);
}
.dw-week__bar--opinions {
  background: var(--dw-green);
}
.dw-week__labels {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}
.dw-week__label {
  flex: 1;
  text-align: center;
  font-size: 8.5px;
  color: var(--dw-ink-faint);
  white-space: nowrap;
}
.dw-stats {
  display: contents;
}
.dw-stats > div:nth-child(1) {
  grid-area: today;
  padding-top: 6px;
}
.dw-stats > div:nth-child(2) {
  grid-area: completion;
  margin-top: 4px;
  padding-top: 10px;
  border-top: 1px solid rgba(47, 83, 117, 0.18);
}
.dw-stat__label {
  font-size: 10px;
  letter-spacing: 0.06em;
  color: var(--dw-blue-deep);
}
.dw-stat__value {
  margin-top: 2px;
  font-family: var(--dw-font-display);
  font-size: clamp(26px, 3cqw, 36px);
  line-height: 1.1;
}
.dw-stat__unit {
  margin-left: 3px;
  font-family: var(--dw-font-body);
  font-size: 11px;
  color: var(--dw-ink-soft);
}
.dw-ring {
  position: relative;
  display: grid;
  place-items: center;
  width: 76px;
  height: 76px;
  margin: 8px 0 4px;
  border-radius: 50%;
  background: conic-gradient(var(--dw-red) var(--dw-ratio), rgba(34, 32, 28, 0.12) 0);
}
.dw-ring::before {
  content: "";
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  background: #f6f0e3;
}
.dw-ring__label {
  position: relative;
  z-index: 1;
  font-family: var(--dw-font-display);
  font-size: 16px;
  color: var(--dw-ink);
}
.dw-meter {
  font-size: 10.5px;
  color: var(--dw-ink-soft);
}
.dw-members-wrap {
  grid-area: members;
  align-self: stretch;
  padding-left: 18px;
  border-left: 1px solid rgba(47, 83, 117, 0.18);
}
.dw-members {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
}
.dw-member {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--dw-ink-soft);
}
.dw-member__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--dw-ink);
}
.dw-member__bar {
  flex: none;
  width: 64px;
  height: 4px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(34, 32, 28, 0.12);
}
.dw-member__bar i {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--dw-red);
  opacity: 0.8;
}
.dw-member__count {
  font-family: var(--dw-font-display);
  font-size: 11px;
  color: var(--dw-ink-faint);
}

/* ------------------------------------------------------- 空状态 */
.dw-empty {
  grid-column: 1 / -1;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin: 0 0 16px;
  padding: 26px 22px 20px;
  border: 1px dashed rgba(34, 32, 28, 0.28);
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.22);
  text-align: center;
}
.dw-empty::before {
  content: "";
  position: absolute;
  top: -7px;
  left: 50%;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  transform: translateX(-50%) rotate(-6deg);
  background: radial-gradient(circle at 34% 30%, #f4a08e 0%, #d35b41 34%, #a53a26 78%, #7d2a1a 100%);
  box-shadow:
    0 2px 2px rgba(34, 32, 28, 0.35),
    0 6px 8px -4px rgba(34, 32, 28, 0.45);
}
.dw-empty strong {
  font-family: var(--dw-font-display);
  font-size: 19px;
  font-weight: 600;
  letter-spacing: 0.04em;
}
.dw-empty p {
  max-width: 34em;
  font-size: 11.5px;
  line-height: 1.7;
  color: var(--dw-ink-soft);
}
.dw-empty__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
}

/* -------------------------------------------------- 合成器 / 名片 */
.dw-scrim {
  position: absolute;
  inset: 0;
  z-index: 4;
  background: rgba(34, 32, 28, 0.34);
  backdrop-filter: blur(1.5px);
}
.dw-card {
  position: absolute;
  z-index: 5;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: min(520px, calc(100% - 32px));
  max-height: calc(100% - 32px);
  overflow-y: auto;
  padding: 26px 28px 22px;
  background-color: var(--dw-paper-warm);
  border: 1px solid rgba(34, 32, 28, 0.2);
  border-radius: 3px;
  box-shadow:
    0 2px 0 rgba(34, 32, 28, 0.08),
    0 30px 60px -30px rgba(34, 32, 28, 0.55);
}
.dw-card::before {
  content: "";
  position: absolute;
  top: -8px;
  left: 50%;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  transform: translateX(-50%) rotate(-8deg);
  background: radial-gradient(circle at 34% 30%, #f4a08e 0%, #d35b41 34%, #a53a26 78%, #7d2a1a 100%);
  box-shadow:
    0 2px 2px rgba(34, 32, 28, 0.35),
    0 6px 8px -4px rgba(34, 32, 28, 0.45);
}
.dw-card--sheet {
  top: 50%;
  bottom: auto;
  transform: translate(-50%, -50%);
  width: min(620px, calc(100% - 32px));
  max-height: min(86%, 760px);
  border-radius: 4px;
}
.dw-card--sheet::before {
  left: 50%;
  top: -8px;
  width: 72px;
  height: 20px;
  border-radius: 0;
  transform: translateX(-50%) rotate(-2deg);
  background:
    linear-gradient(180deg, rgba(255, 253, 240, 0.62), rgba(244, 235, 205, 0.5)),
    repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.16) 0 2px, rgba(0, 0, 0, 0.03) 2px 4px);
  border-left: 1px solid rgba(120, 100, 70, 0.14);
  border-right: 1px solid rgba(120, 100, 70, 0.14);
  box-shadow: 0 1px 2px rgba(34, 32, 28, 0.12);
  clip-path: polygon(2% 8%, 98% 0%, 100% 92%, 4% 100%);
}
.dw-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.dw-card__kicker {
  font-family: var(--dw-font-label);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: var(--dw-red);
}
.dw-card__title {
  margin-top: 4px;
  font-family: var(--dw-font-display);
  font-size: 26px;
  font-weight: 600;
  letter-spacing: 0.04em;
  line-height: 1.2;
}
.dw-card__desc {
  margin-top: 8px;
  font-size: 11.5px;
  line-height: 1.7;
  color: var(--dw-ink-soft);
}
.dw-close {
  flex: none;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 0;
  border-radius: 2px;
  background: transparent;
  font-size: 20px;
  line-height: 1;
  color: var(--dw-ink-soft);
  cursor: pointer;
}
.dw-close:hover {
  background: rgba(34, 32, 28, 0.07);
  color: var(--dw-ink);
}
.dw-tabs {
  display: flex;
  gap: 2px;
  margin: 16px 0 12px;
  border-bottom: 1px solid var(--dw-rule);
}
.dw-tab {
  padding: 7px 10px 9px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  font-size: 12px;
  color: var(--dw-ink-soft);
  cursor: pointer;
}
.dw-tab:hover {
  color: var(--dw-ink);
}
.dw-tab.is-active {
  color: var(--dw-ink);
  border-bottom-color: var(--dw-red);
}
.dw-tab__num {
  margin-right: 4px;
  font-family: var(--dw-font-label);
  font-size: 9px;
  letter-spacing: 0.08em;
  color: var(--dw-ink-faint);
}
.dw-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 10px;
}
.dw-field__label {
  font-family: var(--dw-font-label);
  font-size: 9.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--dw-ink-faint);
}
.dw-input {
  height: 36px;
  padding: 0 10px;
  border: 1px solid rgba(34, 32, 28, 0.26);
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.45);
  font-family: var(--dw-font-body);
  font-size: 13px;
  color: var(--dw-ink);
}
.dw-input:focus {
  outline: none;
  border-color: var(--dw-ink);
  background: rgba(255, 255, 255, 0.7);
}
.dw-composer__text {
  min-height: 110px;
}
.dw-counter {
  margin-top: 3px;
  text-align: right;
  font-size: 10px;
  color: var(--dw-ink-faint);
  font-variant-numeric: tabular-nums;
}
.dw-moods {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.dw-mood-btn {
  padding: 4px 10px;
  border: 1px solid var(--dw-rule);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.3);
  font-size: 11px;
  color: var(--dw-ink-soft);
  cursor: pointer;
}
.dw-mood-btn.is-active {
  border-color: var(--dw-ink);
  background: var(--dw-ink);
  color: var(--dw-paper-warm);
}
.dw-anon-note {
  margin-top: 8px;
  font-size: 11px;
  color: var(--dw-green-deep);
}
.dw-anon-note::before {
  content: "✉ ";
}
.dw-error {
  margin-top: 8px;
  font-size: 11.5px;
  color: var(--dw-red-deep);
}
.dw-hint {
  font-size: 10.5px;
  color: var(--dw-ink-faint);
}
.dw-emoji-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.dw-emoji {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  padding: 0;
  border: 1px solid var(--dw-rule);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.35);
  font-size: 19px;
  cursor: pointer;
  transition:
    transform 0.16s var(--dw-ease),
    background-color 0.16s var(--dw-ease),
    border-color 0.16s var(--dw-ease);
}
.dw-emoji:hover {
  transform: translateY(-1px);
}
.dw-emoji.is-active {
  border-color: var(--dw-ink);
  background: var(--dw-amber-wash);
  box-shadow: 0 0 0 2px rgba(34, 32, 28, 0.06);
}
.dw-card .dw-form-foot {
  margin-top: 16px;
}

/* ------------------------------------------------------------- 晨报 */
.dw-morning {
  position: absolute;
  inset: 0;
  z-index: 6;
  display: flex;
  flex-direction: column;
  background: rgba(26, 23, 19, 0.78);
}
.dw-paper {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  width: min(820px, calc(100% - 34px));
  margin: 18px auto 8px;
  padding: 30px clamp(22px, 3.5cqw, 48px) 26px;
  background-color: #f7f0e1;
  background-image:
    radial-gradient(120% 80% at 50% 0%, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0) 60%),
    repeating-linear-gradient(0deg, rgba(34, 32, 28, 0.012) 0 1px, transparent 1px 3px);
  border-radius: 2px;
  box-shadow:
    0 0 0 1px rgba(34, 32, 28, 0.2),
    0 40px 80px -30px rgba(0, 0, 0, 0.65);
  color: var(--dw-ink);
}
.dw-paper__kicker {
  text-align: center;
  font-family: var(--dw-font-label);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.24em;
  color: var(--dw-red);
}
.dw-paper__title {
  margin-top: 8px;
  text-align: center;
  font-family: var(--dw-font-display);
  font-size: clamp(32px, 4.4cqw, 46px);
  font-weight: 700;
  letter-spacing: 0.05em;
  line-height: 1.15;
}
.dw-paper__meta {
  margin-top: 8px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--dw-ink);
  text-align: center;
  font-size: 10px;
  color: var(--dw-ink-soft);
}
.dw-paper__section {
  margin-top: 18px;
}
.dw-paper__label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--dw-font-label);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: var(--dw-red);
}
.dw-paper__label::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--dw-rule);
}
.dw-paper__headline {
  margin-top: 9px;
  font-family: var(--dw-font-display);
  font-size: clamp(20px, 2.6cqw, 26px);
  font-weight: 600;
  line-height: 1.45;
  overflow-wrap: anywhere;
}
.dw-paper__byline {
  margin-top: 6px;
  font-size: 10.5px;
  color: var(--dw-ink-soft);
}
.dw-paper__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}
.dw-paper__row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding-bottom: 5px;
  border-bottom: 1px dotted var(--dw-rule);
  font-size: 12px;
  line-height: 1.6;
}
.dw-paper__row .dw-index {
  font-family: var(--dw-font-label);
  font-size: 9px;
  color: var(--dw-ink-faint);
}
.dw-paper__row .dw-who {
  margin-left: auto;
  font-size: 10px;
  white-space: nowrap;
  color: var(--dw-ink-faint);
}
.dw-paper__cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.dw-paper__empty {
  margin-top: 6px;
  font-size: 11.5px;
  color: var(--dw-ink-faint);
}
.dw-paper__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 8px;
}
.dw-paper__stat b {
  display: block;
  font-family: var(--dw-font-display);
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
}
.dw-paper__stat span {
  font-size: 9.5px;
  letter-spacing: 0.04em;
  color: var(--dw-ink-soft);
}
.dw-morning__bar {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-wrap: wrap;
  padding: 10px 12px 16px;
}
.dw-morning__bar .dw-btn {
  border-color: rgba(34, 32, 28, 0.35);
  background: rgba(247, 240, 225, 0.92);
  color: var(--dw-ink);
}
.dw-morning__bar .dw-btn:hover {
  background: var(--dw-paper-warm);
}
.dw-morning__page {
  min-width: 54px;
  text-align: center;
  font-size: 11px;
  color: rgba(247, 240, 225, 0.72);
}

/* -------------------------------------------------- toast / FAB / 页脚 */
.dw-toast {
  position: absolute;
  right: 18px;
  bottom: 88px;
  z-index: 7;
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: min(360px, calc(100% - 36px));
  padding: 11px 15px;
  border-radius: 2px;
  background: var(--dw-ink);
  color: var(--dw-paper-warm);
  box-shadow: 0 14px 30px -16px rgba(34, 32, 28, 0.8);
  font-size: 12px;
}
.dw-toast__action {
  border: 0;
  background: transparent;
  font-size: 12px;
  font-weight: 600;
  color: var(--dw-amber);
  cursor: pointer;
}
.dw-fab {
  position: absolute;
  right: clamp(18px, 2.4cqw, 30px);
  bottom: 20px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 50px;
  padding: 11px 18px 11px 14px;
  border: 1px solid var(--dw-red-deep);
  border-radius: 999px;
  background: var(--dw-red);
  color: #fff7ec;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.05em;
  cursor: pointer;
  box-shadow:
    3px 3px 0 rgba(34, 32, 28, 0.22),
    0 20px 30px -18px rgba(158, 53, 36, 0.9);
  transition:
    transform 0.2s var(--dw-ease),
    background-color 0.2s var(--dw-ease),
    box-shadow 0.2s var(--dw-ease);
}
.dw-fab:hover {
  transform: translate(-1px, -2px) rotate(-1deg);
  background: var(--dw-red-deep);
  box-shadow:
    4px 5px 0 rgba(34, 32, 28, 0.22),
    0 24px 34px -18px rgba(158, 53, 36, 0.95);
}
.dw-fab__plus {
  font-size: 16px;
  line-height: 1;
  font-weight: 500;
}
.dw-fab__kbd {
  padding: 1px 4px;
  border: 1px solid rgba(255, 247, 236, 0.4);
  border-radius: 2px;
  font-family: var(--dw-font-label);
  font-size: 8px;
  letter-spacing: 0.1em;
  opacity: 0.72;
}
.dw-foot {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px 22px;
  flex-wrap: wrap;
  margin-top: 28px;
  padding-top: 14px;
  border-top: 1px solid var(--dw-rule);
  font-size: 10.5px;
  color: var(--dw-ink-faint);
}
.dw-foot__mode {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.dw-foot__mode .dw-dot {
  width: 5px;
  height: 5px;
}
.dw-loading {
  position: relative;
  z-index: 1;
  flex: 1;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 10px;
  font-size: 12px;
  color: var(--dw-ink-soft);
}
.dw-loading__dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: radial-gradient(circle at 34% 30%, #f4a08e 0%, #d35b41 34%, #a53a26 78%, #7d2a1a 100%);
  box-shadow: 0 2px 3px rgba(34, 32, 28, 0.3);
  animation: dw-breathe 1.5s ease-in-out infinite;
}
@keyframes dw-breathe {
  0%,
  100% {
    opacity: 0.45;
    transform: scale(0.86);
  }
  50% {
    opacity: 1;
    transform: scale(1.08);
  }
}
.dw-sidebar-icon {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
}

/* ------------------------------------------------------- 响应式 */
@container (min-width: 760px) {
  .dw-grid {
    grid-template-columns: minmax(0, 1.12fr) minmax(0, 0.95fr);
    grid-template-areas:
      "ideas todos"
      "echo echo"
      "pulse pulse";
    gap: 26px 24px;
  }
  .dw-rail {
    display: contents;
  }
  .dw-section--ideas {
    grid-area: ideas;
  }
  .dw-section--todos {
    grid-area: todos;
  }
  .dw-section--echo {
    grid-area: echo;
  }
  .dw-section--pulse {
    grid-area: pulse;
  }
  .dw-section--echo .dw-letters {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    max-height: none;
    overflow: visible;
  }
  .dw-mailbox {
    padding: 18px;
  }
}
@container (min-width: 1060px) {
  .dw-grid {
    grid-template-columns: minmax(0, 1.18fr) minmax(0, 1fr) minmax(240px, 0.85fr);
    grid-template-areas:
      "ideas todos echo"
      "pulse pulse pulse";
    gap: 26px;
  }
  .dw-section--echo {
    align-self: start;
  }
  .dw-section--echo .dw-letters {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .dw-section--ideas {
    min-height: 380px;
  }
  .dw-notes {
    columns: 2;
  }
  .dw-card--sheet {
    max-height: min(86%, 780px);
  }
}
@container (max-width: 759px) {
  .dw-notes {
    columns: 1;
  }
  .dw-head {
    align-items: flex-start;
    padding: 14px 16px 11px;
    gap: 10px;
  }
  .dw-head-right {
    align-items: flex-start;
    width: 100%;
  }
  .dw-date {
    display: none;
  }
  .dw-head-actions {
    justify-content: flex-start;
    width: 100%;
  }
  .dw-brand h1 {
    font-size: clamp(30px, 7cqw, 42px);
  }
  .dw-brand .dw-sub::after {
    display: none;
  }
  .dw-pulse {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .dw-stats {
    display: flex;
    gap: 22px;
    flex-wrap: wrap;
  }
  .dw-week-wrap {
    border-right: 0;
    padding-right: 0;
    min-height: 0;
  }
  .dw-members-wrap {
    padding-left: 0;
    padding-top: 10px;
    border-left: 0;
    border-top: 1px solid rgba(47, 83, 117, 0.18);
  }
  .dw-paper__cols {
    grid-template-columns: 1fr;
  }
  .dw-paper {
    width: calc(100% - 20px);
    padding: 20px 18px;
  }
  .dw-card--sheet {
    top: 50%;
    bottom: auto;
    transform: translate(-50%, -50%);
    width: calc(100% - 20px);
    max-height: calc(100% - 32px);
    border-radius: 4px;
  }
  .dw-card {
    width: calc(100% - 20px);
  }
  .dw-fab {
    right: 14px;
    bottom: 14px;
    min-height: 46px;
    padding: 9px 14px 9px 12px;
    font-size: 12px;
  }
  .dw-scroll {
    padding-bottom: 84px;
  }
}
/* 便签：图钉只保留装订视觉，不再显示 emoji 重复标记 */
.dw-pin-note {
  display: none;
}
.dw-notes .dw-note.is-pinned::before {
  content: "";
  position: absolute;
  top: -6px;
  left: 50%;
  z-index: 3;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  transform: translateX(-50%) rotate(-8deg);
  background: radial-gradient(circle at 34% 30%, #f4a08e 0%, #d35b41 34%, #a53a26 78%, #7d2a1a 100%);
  box-shadow:
    0 2px 2px rgba(34, 32, 28, 0.35),
    0 6px 8px -4px rgba(34, 32, 28, 0.45),
    inset 0 -1px 2px rgba(80, 20, 10, 0.5);
}

/* 反应文字标签：展开便签时出现 */
.dw-react__label {
  display: none;
  letter-spacing: 0.04em;
}
.dw-note.is-open .dw-react__label {
  display: inline;
}

/* 待办操作行：鼠标设备上悬停/聚焦才出现，触屏常显 */
@media (hover: hover) and (pointer: fine) {
  .dw-todo__foot {
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.16s var(--dw-ease);
  }
  .dw-todo:hover .dw-todo__foot,
  .dw-todo:focus-within .dw-todo__foot {
    opacity: 1;
    pointer-events: auto;
  }
  .dw-todo.is-done .dw-todo__foot {
    opacity: 0;
    pointer-events: none;
  }
  .dw-todo.is-done:hover .dw-todo__foot,
  .dw-todo.is-done:focus-within .dw-todo__foot {
    opacity: 1;
    pointer-events: auto;
  }
}

/* 晨报：纸张按内容高度居中悬浮 */
.dw-paper {
  flex: 0 1 auto;
  margin: auto;
  max-height: calc(100% - 96px);
}
.dw-paper__foot {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 22px;
  padding-top: 10px;
  border-top: 1px solid var(--dw-rule);
  font-size: 9.5px;
  color: var(--dw-ink-faint);
  letter-spacing: 0.03em;
}

@media (prefers-reduced-motion: reduce) {
  .dw-root *,
  .dw-root *::before,
  .dw-root *::after {
    animation: none !important;
    transition: none !important;
  }
}
`;


    /* ------------------------------------------------------------ 原子组件 */
    function SidebarIcon() {
      return h(
        'span',
        { className: 'dw-sidebar-icon', 'aria-hidden': 'true' },
        h(
          'svg',
          { viewBox: '0 0 24 24', width: 18, height: 18 },
          h('rect', { x: 4.5, y: 10, width: 15, height: 10, rx: 1.6, fill: 'currentColor', opacity: 0.16 }),
          h('circle', { cx: 12, cy: 7.2, r: 5.1, fill: '#c8402f' }),
          h('circle', { cx: 10.2, cy: 5.8, r: 1.5, fill: '#f4a08e', opacity: 0.9 }),
          h('path', { d: 'M12 12.2v5.4', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', opacity: 0.7 }),
        ),
      );
    }

    function Face({ member, online }) {
      if (!member) return null;
      return h(
        'span',
        {
          className: cx('dw-face', online && 'is-online'),
          title: `${member.name}${online ? ' · online' : ''}`,
          'aria-label': member.name,
        },
        member.emoji || '◌',
      );
    }

    function Presence({ members, online, t, lang }) {
      const onlineIds = new Set(online.map((member) => member.id));
      const people = members.filter((member) => member.demo !== true);
      const shown = people.length > 0 ? people.slice(0, 5) : members.slice(0, 5);
      const onlineCount = people.filter((member) => onlineIds.has(member.id)).length;
      return h(
        'div',
        { className: 'dw-presence', role: 'group', 'aria-label': t('online') },
        shown.map((member) => h(Face, { key: member.id, member, online: onlineIds.has(member.id) })),
        h('span', { className: 'dw-people-count' }, lang === 'zh' ? `${onlineCount} 人在墙上` : `${onlineCount} online`),
      );
    }

    function SectionHead({ num, tag, title, hint, tools }) {
      return h(
        'header',
        { className: 'dw-section__head' },
        h(
          'div',
          { className: 'dw-section__label' },
          h('span', { className: 'dw-num' }, num),
          tag ? h('span', { className: 'dw-tag' }, tag) : null,
        ),
        h(
          'div',
          { className: 'dw-section__title' },
          h('h2', null, title),
          h('span', { className: 'dw-section__hint' }, hint),
        ),
        tools && tools.length > 0 ? h('div', { className: 'dw-tools' }, tools) : null,
      );
    }

    function EmptyBox({ title, desc, actions }) {
      return h(
        'div',
        { className: 'dw-empty' },
        h('strong', null, title),
        h('p', null, desc),
        actions && actions.length > 0 ? h('div', { className: 'dw-empty__actions' }, actions) : null,
      );
    }

    function Strike({ label, onClick, disabled, primary }) {
      return h(
        'button',
        {
          type: 'button',
          className: cx('dw-btn', 'dw-btn--small', primary ? 'dw-btn--primary' : 'dw-btn--quiet'),
          onClick,
          disabled: Boolean(disabled),
        },
        label,
      );
    }

    function tiltOf(id) {
      let hash = 0;
      for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) | 0;
      const step = (Math.abs(hash) % 5) - 2;
      return `${(step * 0.35).toFixed(2)}deg`;
    }
    function toneOf(id) {
      let hash = 0;
      for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) | 0;
      return (Math.abs(hash) % 5) + 1;
    }

    function weekData(data, lang) {
      const days = [];
      const now = new Date();
      for (let offset = 6; offset >= 0; offset -= 1) {
        const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
        days.push({
          key: dayKey(day),
          label: lang === 'zh' ? `${day.getMonth() + 1}/${day.getDate()}` : day.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
          ideas: 0,
          todos: 0,
          opinions: 0,
        });
      }
      const index = new Map(days.map((day, position) => [day.key, position]));
      const put = (iso, field) => {
        const key = dayKey(new Date(iso));
        const position = index.get(key);
        if (position !== undefined) days[position][field] += 1;
      };
      for (const idea of data.ideas) put(idea.createdAt, 'ideas');
      for (const todo of data.todos) put(todo.createdAt, 'todos');
      for (const opinion of data.opinions) put(opinion.createdAt, 'opinions');
      const max = Math.max(1, ...days.map((day) => day.ideas + day.todos + day.opinions));
      return { days, max };
    }

    function memberActivity(data, online, me) {
      const onlineIds = new Set(online.map((member) => member.id));
      const counts = new Map();
      const bump = (memberId) => {
        if (!memberId) return;
        counts.set(memberId, (counts.get(memberId) || 0) + 1);
      };
      for (const idea of data.ideas) bump(idea.authorId);
      for (const todo of data.todos) bump(todo.authorId);
      const rows = data.members
        .map((member) => ({
          member,
          count: counts.get(member.id) || 0,
          online: onlineIds.has(member.id),
          isMe: Boolean(me && me.id === member.id),
        }))
        .filter((row) => row.count > 0 || row.member.demo !== true)
        .sort((a, b) => b.count - a.count);
      const max = Math.max(1, ...rows.map((row) => row.count));
      return { rows, max };
    }

    /* ------------------------------------------------------------ 便签 */
    function NoteCard({ idea, t, lang, me, open, actions }) {
      const [editing, setEditing] = useState(false);
      const [draft, setDraft] = useState(idea.text);
      const [armed, setArmed] = useState(false);
      const [stamp, setStamp] = useState(null);
      const tilt = tiltOf(idea.id);
      const tone = toneOf(idea.id);
      const mine = (kind) => Boolean(me && Array.isArray(idea.reactions?.[kind]?.by) && idea.reactions[kind].by.includes(me.id));

      useEffect(() => {
        if (!armed) return undefined;
        const timer = setTimeout(() => setArmed(false), 3200);
        return () => clearTimeout(timer);
      }, [armed]);

      function press(kind) {
        setStamp(kind);
        setTimeout(() => setStamp(null), 300);
        void actions.reactIdea(idea, kind);
      }

      function save() {
        const next = draft.trim();
        if (!next || next === idea.text) {
          setEditing(false);
          return;
        }
        actions.updateIdea(idea, { text: next }).then(() => setEditing(false)).catch(() => {});
      }

      const reactions = [
        { kind: 'spark', label: t('thanks'), icon: '✦' },
        { kind: 'fire', label: t('fire'), icon: '🔥' },
      ];

      return h(
        'article',
        {
          className: cx('dw-note', `dw-note--tone-${tone}`, open && 'is-open', idea.pinned && 'is-pinned'),
          style: { '--dw-tilt': tilt },
          onClick: (event) => {
            if (event.target.closest('button, textarea, input')) return;
            actions.toggleOpenIdea(idea.id);
          },
        },
        h(
          'div',
          { className: 'dw-note__top' },
          idea.pinned ? h('span', { className: 'dw-pin-note', title: t('pinned') }, '📌') : null,
          h('span', { className: 'dw-face-mini', 'aria-hidden': 'true' }, actions.emojiOf(idea.authorId)),
          h('span', null, actions.nameOf(idea.authorId)),
          idea.demo ? h('span', { className: 'dw-chip dw-chip--demo' }, t('demoTag')) : null,
          h('span', { className: 'dw-spacer' }),
          h('span', { className: 'dw-note__time' }, relTime(idea.createdAt, lang)),
        ),
        editing
          ? h(
              'div',
              { className: 'dw-editor' },
              h('textarea', {
                className: 'dw-textarea',
                value: draft,
                maxLength: 500,
                'aria-label': t('edit'),
                onChange: (event) => setDraft(event.target.value),
              }),
              h(
                'div',
                { className: 'dw-form-foot', style: { marginTop: 0, paddingTop: 0, borderTop: 0 } },
                h(Strike, { label: t('cancel'), onClick: () => setEditing(false) }),
                h(Strike, { label: t('save'), primary: true, onClick: save }),
              ),
            )
          : h(
              'p',
              { className: cx('dw-note__text', !open && 'is-clamped') },
              idea.text,
            ),
        h(
          'div',
          { className: 'dw-note__foot' },
          reactions.map((reaction) =>
            h(
              'button',
              {
                key: reaction.kind,
                type: 'button',
                className: cx('dw-react', mine(reaction.kind) && 'is-mine', stamp === reaction.kind && 'is-stamping'),
                'aria-pressed': mine(reaction.kind),
                onClick: () => press(reaction.kind),
                title: reaction.label,
              },
              h('span', { 'aria-hidden': 'true' }, reaction.icon),
              h('span', { className: 'dw-react__label' }, reaction.label),
              h('span', { className: 'dw-react__count' }, String(idea.reactions?.[reaction.kind]?.count ?? 0)),
            ),
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'dw-note__expand',
              onClick: (event) => {
                event.stopPropagation();
                actions.toggleOpenIdea(idea.id);
              },
            },
            open ? t('close') : t('open'),
          ),
        ),
        open
          ? h(
              'div',
              { className: 'dw-actions' },
              h(
                'button',
                { type: 'button', className: 'dw-linkbtn', onClick: () => actions.togglePin(idea) },
                idea.pinned ? t('unpin') : t('pin'),
              ),
              h(
                'button',
                { type: 'button', className: 'dw-linkbtn', onClick: () => { setDraft(idea.text); setEditing(true); } },
                t('edit'),
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: cx('dw-linkbtn', 'dw-linkbtn--danger', armed && 'is-armed'),
                  onClick: () => {
                    if (armed) void actions.deleteIdea(idea);
                    else setArmed(true);
                  },
                },
                armed ? t('confirmDelete') : t('delete'),
              ),
              h('span', { className: 'dw-spacer', style: { flex: 1 } }),
              h('span', { className: 'dw-note__time' }, fullTime(idea.createdAt, lang)),
            )
          : null,
      );

    }

    function IdeasSection({ data, t, lang, me, actions, openIdeaId, onCompose, onDemo, onClearDemo, hasDemo }) {
      function drawOne() {
        const pool = data.ideas;
        if (pool.length === 0) {
          actions.toast(t('emptyIdeasTitle'));
          return;
        }
        const pick = pool[Math.floor(Math.random() * pool.length)];
        actions.toggleOpenIdea(pick.id, true);
      }
      return h(
        'section',
        { className: 'dw-section dw-section--ideas dw-in' },
        h(SectionHead, {
          num: '01',
          tag: 'IDEAS',
          title: t('ideas'),
          hint: t('ideasHint'),
          tools: [
            h('button', { key: 'draw', type: 'button', className: 'dw-btn dw-btn--small dw-btn--quiet', onClick: drawOne }, t('drawIdea')),
            h('button', { key: 'add', type: 'button', className: 'dw-btn dw-btn--small', onClick: () => onCompose('idea') }, `＋ ${t('addIdea')}`),
          ],
        }),
        hasDemo && data.ideas.length > 0
          ? h('div', { className: 'dw-banner' }, t('demoBanner'), h('span', { style: { flex: 1 } }), h(Strike, { label: t('clearDemo'), onClick: onClearDemo }))
          : null,
        data.ideas.length === 0
          ? h(EmptyBox, {
              title: t('emptyIdeasTitle'),
              desc: t('emptyIdeasDesc'),
              actions: [
                h(Strike, { key: 'add', label: `＋ ${t('addIdea')}`, primary: true, onClick: () => onCompose('idea') }),
                h(Strike, { key: 'demo', label: t('loadDemo'), onClick: onDemo }),
              ],
            })
          : h(
              'div',
              { className: 'dw-notes' },
              data.ideas.map((idea) =>
                h(NoteCard, {
                  key: idea.id,
                  idea,
                  t,
                  lang,
                  me,
                  open: openIdeaId === idea.id,
                  actions,
                }),
              ),
            ),
      );
    }

    /* ------------------------------------------------------------ 待办 */
    function TodosSection({ data, t, lang, me, actions, onCompose }) {
      const [editingId, setEditingId] = useState(null);
      const [draft, setDraft] = useState('');
      const [armed, setArmed] = useState(null);
      const [over, setOver] = useState(null);
      const lanes = [
        { key: 'todo', label: t('statusTodo') },
        { key: 'doing', label: t('statusDoing') },
        { key: 'done', label: t('statusDone') },
      ];
      const laneOf = (status) => data.todos.filter((todo) => todo.status === status);

      function startEdit(todo) {
        setDraft(todo.text);
        setEditingId(todo.id);
        setArmed(null);
      }

      function saveEdit(todo) {
        const next = draft.trim();
        setEditingId(null);
        if (!next || next === todo.text) return;
        void actions.updateTodo(todo, { text: next });
      }

      function renderCard(todo) {
        const editing = editingId === todo.id;
        return h(
          'article',
          {
            key: todo.id,
            className: cx('dw-todo', todo.status === 'done' && 'is-done', over === null && null),
            draggable: !editing,
            onDragStart: (event) => {
              event.dataTransfer.setData('text/plain', todo.id);
              event.dataTransfer.effectAllowed = 'move';
            },
            onDragEnd: () => setOver(null),
          },
          h(
            'div',
            { className: 'dw-todo__top' },
            h('span', { className: 'dw-face-mini', 'aria-hidden': 'true' }, actions.emojiOf(todo.authorId)),
            h('span', null, actions.nameOf(todo.authorId)),
            todo.demo ? h('span', { className: 'dw-chip dw-chip--demo' }, t('demoTag')) : null,
            h('span', { className: 'dw-spacer' }),
            todo.status === 'done' ? h('span', { className: 'dw-stamp' }, 'DONE') : null,
            h('span', { className: 'dw-note__time' }, relTime(todo.createdAt, lang)),
          ),
          editing
            ? h(
                'div',
                { className: 'dw-editor' },
                h('textarea', {
                  className: 'dw-textarea',
                  value: draft,
                  maxLength: 240,
                  'aria-label': t('edit'),
                  onChange: (event) => setDraft(event.target.value),
                }),
                h(
                  'div',
                  { className: 'dw-form-foot', style: { marginTop: 0, paddingTop: 0, borderTop: 0 } },
                  h(Strike, { label: t('cancel'), onClick: () => setEditingId(null) }),
                  h(Strike, { label: t('save'), primary: true, onClick: () => saveEdit(todo) }),
                ),
              )
            : h('p', { className: 'dw-todo__text' }, todo.text),
          h(
            'div',
            { className: 'dw-todo__foot' },
            h(Strike, {
              label: `⇄ ${t('cycleStatus')}`,
              onClick: () => actions.moveTodo(todo, todo.status === 'todo' ? 'doing' : todo.status === 'doing' ? 'done' : 'todo'),
            }),
            h(Strike, { label: t('edit'), onClick: () => startEdit(todo) }),
            h(Strike, {
              label: armed === todo.id ? t('confirmDelete') : t('delete'),
              onClick: () => {
                if (armed === todo.id) {
                  setArmed(null);
                  void actions.deleteTodo(todo);
                } else {
                  setArmed(todo.id);
                }
              },
            }),
          ),
        );
      }

      return h(
        'section',
        { className: 'dw-section dw-section--todos dw-in' },
        h(SectionHead, {
          num: '02',
          tag: 'TODOS',
          title: t('todos'),
          hint: t('todosHint'),
          tools: [h('button', { key: 'add', type: 'button', className: 'dw-btn dw-btn--small', onClick: () => onCompose('todo') }, `＋ ${t('addTodo')}`)],
        }),
        h(
          'div',
          { className: 'dw-lanes' },
          lanes.map((lane) => {
            const cards = laneOf(lane.key);
            return h(
              'div',
              {
                key: lane.key,
                className: cx('dw-lane', over === lane.key && 'is-over'),
                onDragOver: (event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
                  if (over !== lane.key) setOver(lane.key);
                },
                onDragLeave: () => setOver((current) => (current === lane.key ? null : current)),
                onDrop: (event) => {
                  event.preventDefault();
                  setOver(null);
                  const id = event.dataTransfer.getData('text/plain');
                  const todo = data.todos.find((item) => item.id === id);
                  if (todo && todo.status !== lane.key) void actions.moveTodo(todo, lane.key);
                },
              },
              h(
                'div',
                { className: 'dw-lane__head' },
                h('span', null, lane.label),
                h('span', { className: 'dw-lane__count' }, String(cards.length)),
              ),
              cards.length === 0
                ? h('div', { className: 'dw-lane__empty' }, '—')
                : h('div', { className: 'dw-cards' }, cards.map(renderCard)),
            );
          }),
        ),
        data.todos.length === 0
          ? h(EmptyBox, {
              title: t('emptyTodosTitle'),
              desc: t('emptyTodosDesc'),
              actions: [h(Strike, { key: 'add', label: t('addTodo'), primary: true, onClick: () => onCompose('todo') })],
            })
          : null,
      );
    }

    /* ------------------------------------------------------------ 匿名信箱 */
    function EchoSection({ data, t, lang, actions, onCompose }) {
      const [openId, setOpenId] = useState(null);
      function drawLetter() {
        if (data.opinions.length === 0) {
          actions.toast(t('emptyLettersTitle'));
          return;
        }
        const pick = data.opinions[Math.floor(Math.random() * data.opinions.length)];
        setOpenId(pick.id);
      }
      const moods = {
        casual: t('moodCasual'),
        suggest: t('moodSuggest'),
        worry: t('moodWorry'),
        vent: t('moodVent'),
      };
      return h(
        'section',
        { className: 'dw-section dw-section--echo dw-in' },
        h(SectionHead, {
          num: '03',
          tag: 'ECHO',
          title: t('echo'),
          hint: t('echoHint'),
          tools: [
            h('button', { key: 'draw', type: 'button', className: 'dw-btn dw-btn--small dw-btn--quiet', onClick: drawLetter }, t('drawLetter')),
            h('button', { key: 'write', type: 'button', className: 'dw-btn dw-btn--small', onClick: () => onCompose('opinion') }, `＋ ${t('writeLetter')}`),
          ],
        }),
        h(
          'div',
          { className: 'dw-mailbox' },
          h('div', { className: 'dw-slot', 'aria-hidden': 'true' }),
          data.opinions.length === 0
            ? h(EmptyBox, {
                title: t('emptyLettersTitle'),
                desc: t('emptyLettersDesc'),
                actions: [h(Strike, { key: 'write', label: t('writeLetter'), primary: true, onClick: () => onCompose('opinion') })],
              })
            : h(
                'div',
                { className: 'dw-letters' },
                data.opinions.map((opinion) => {
                  const open = openId === opinion.id;
                  return h(
                    'article',
                    {
                      key: opinion.id,
                      className: cx('dw-letter', open && 'is-open'),
                      onClick: (event) => {
                        if (event.target.closest('button')) return;
                        setOpenId(open ? null : opinion.id);
                      },
                    },
                    h(
                      'div',
                      { className: 'dw-letter__head' },
                      h('span', { className: `dw-mood dw-mood--${opinion.mood || 'casual'}` }, moods[opinion.mood] || moods.casual),
                      opinion.demo ? h('span', { className: 'dw-chip dw-chip--demo' }, t('demoTag')) : null,
                      h('span', { className: 'dw-spacer' }),
                      h('span', null, relTime(opinion.createdAt, lang)),
                    ),
                    h('p', { className: cx('dw-letter__text', !open && 'is-clamped') }, opinion.text),
                    h(
                      'div',
                      { className: 'dw-letter__foot' },
                      h(
                        'button',
                        {
                          type: 'button',
                          className: cx('dw-react', Boolean(actions.hasEchoed(opinion)) && 'is-mine'),
                          'aria-pressed': Boolean(actions.hasEchoed(opinion)),
                          onClick: () => actions.reactOpinion(opinion),
                          title: t('echoSecond'),
                        },
                        h('span', { 'aria-hidden': 'true' }, '≈'),
                        h('span', { className: 'dw-react__count' }, String(opinion.reactions?.echo?.count ?? 0)),
                        h('span', null, t('echoSecond')),
                      ),
                      h('button', {
                        type: 'button',
                        className: 'dw-linkbtn',
                        onClick: () => setOpenId(open ? null : opinion.id),
                      }, open ? t('fold') : t('read')),
                      h('span', { className: 'dw-letter__seal' }, t('anonSeal')),
                    ),
                    open ? h('p', { className: 'dw-letter__stamp-line' }, `${fullTime(opinion.createdAt, lang)} · ${t('anonymous')}`) : null,
                  );
                }),
              ),
        ),
      );
    }

    /* ------------------------------------------------------------ 团队心律 */
    function PulseSection({ data, t, lang, me, online }) {
      const week = useMemo(() => weekData(data, lang), [data, lang]);
      const activity = useMemo(() => memberActivity(data, online, me), [data, online, me]);
      const totalTodos = data.todos.length;
      const doneTodos = data.todos.filter((todo) => todo.status === 'done').length;
      const ratio = totalTodos === 0 ? 0 : Math.round((doneTodos / totalTodos) * 100);
      const todayCount = week.days[6] ? week.days[6].ideas + week.days[6].todos + week.days[6].opinions : 0;
      const weekTotal = week.days.reduce((sum, day) => sum + day.ideas + day.todos + day.opinions, 0);
      return h(
        'section',
        { className: 'dw-section dw-section--pulse dw-in' },
        h(SectionHead, { num: '04', tag: 'PULSE', title: t('pulse'), hint: t('pulseHint') }),
        h(
          'div',
          { className: 'dw-pulse' },
          h(
            'div',
            { className: 'dw-pulse__head' },
            h('span', null, lang === 'zh' ? '近七日上墙' : 'Last 7 days'),
            h(
              'span',
              { className: 'dw-legend' },
              h('span', null, h('i', { className: 'dw-dot dw-dot--idea', style: { display: 'inline-block' } }), t('idea')),
              h('span', null, h('i', { className: 'dw-dot dw-dot--todo', style: { display: 'inline-block' } }), t('todo')),
              h('span', null, h('i', { className: 'dw-dot dw-dot--opinion', style: { display: 'inline-block' } }), t('opinion')),
            ),
          ),
          h(
            'div',
            { className: 'dw-week-wrap' },
            h(
              'div',
              { className: 'dw-week' },
              week.days.map((day) => {
                const total = day.ideas + day.todos + day.opinions;
                return h(
                  'div',
                  { className: 'dw-week__col', key: day.key, title: `${day.label}: ${total}` },
                  total === 0
                    ? null
                    : [
                        day.ideas ? h('div', { key: 'i', className: 'dw-week__bar dw-week__bar--ideas', style: { height: `${(day.ideas / week.max) * 100}%` } }) : null,
                        day.todos ? h('div', { key: 't', className: 'dw-week__bar dw-week__bar--todos', style: { height: `${(day.todos / week.max) * 100}%` } }) : null,
                        day.opinions ? h('div', { key: 'o', className: 'dw-week__bar dw-week__bar--opinions', style: { height: `${(day.opinions / week.max) * 100}%` } }) : null,
                      ],
                );
              }),
            ),
            h('div', { className: 'dw-week__labels' }, week.days.map((day) => h('span', { className: 'dw-week__label', key: day.key }, day.label))),
          ),
          h(
            'div',
            { className: 'dw-stats' },
            h(
              'div',
              null,
              h('div', { className: 'dw-stat__label' }, t('today')),
              h('div', { className: 'dw-stat__value' }, String(todayCount), h('span', { className: 'dw-stat__unit' }, t('sheets'))),
              h('div', { className: 'dw-stat__label', style: { marginTop: 2 } }, `${t('weekTotal')} ${weekTotal}`),
            ),
            h(
              'div',
              null,
              h('div', { className: 'dw-stat__label' }, t('completion')),
              h(
                'div',
                {
                  className: 'dw-ring',
                  style: { '--dw-ratio': `${ratio}%` },
                  role: 'progressbar',
                  'aria-valuemin': 0,
                  'aria-valuemax': 100,
                  'aria-valuenow': ratio,
                },
                h('span', { className: 'dw-ring__label' }, `${ratio}%`),
              ),
              h('div', { className: 'dw-meter' }, h('span', null, `${t('doneOf')} ${doneTodos} / ${totalTodos}`)),
            ),
          ),
          h(
            'div',
            { className: 'dw-members-wrap' },
            h('div', { className: 'dw-stat__label', style: { marginBottom: 5 } }, t('members')),
            h(
              'div',
              { className: 'dw-members' },
              activity.rows.length === 0
                ? h('div', { className: 'dw-week__label' }, t('nothing'))
                : activity.rows.slice(0, 5).map((row) =>
                    h(
                      'div',
                      { className: 'dw-member', key: row.member.id },
                      h('span', { className: 'dw-face-mini', 'aria-hidden': 'true' }, row.member.emoji || '◌'),
                      h('span', { className: 'dw-member__name' }, row.member.name + (row.isMe ? ` · ${t('online')}` : '')),
                      h('span', { className: 'dw-member__bar' }, h('i', { style: { width: `${Math.round((row.count / activity.max) * 100)}%` } })),
                      h('span', { className: 'dw-member__count' }, String(row.count)),
                      h('span', { className: cx('dw-dot', row.online ? 'dw-dot--online' : ''), title: row.online ? t('online') : '' }),
                    ),
                  ),
            ),
          ),
        ),
      );
    }

    /* ------------------------------------------------------------ 合成器 */
    function ComposerSheet({ t, lang, composer, error, busy, onClose, onChange, onSubmit }) {
      const textareaRef = useRef(null);
      const type = composer.type;
      const titles = { idea: t('composerIdeaTitle'), todo: t('composerTodoTitle'), opinion: t('composerOpinionTitle') };
      const placeholders = {
        idea: t('composerIdeaPlaceholder'),
        todo: t('composerTodoPlaceholder'),
        opinion: t('composerOpinionPlaceholder'),
      };
      const max = type === 'todo' ? 240 : 500;
      const moods = [
        { value: 'casual', label: t('moodCasual') },
        { value: 'suggest', label: t('moodSuggest') },
        { value: 'worry', label: t('moodWorry') },
        { value: 'vent', label: t('moodVent') },
      ];
      useEffect(() => {
        const timer = setTimeout(() => textareaRef.current?.focus(), 30);
        return () => clearTimeout(timer);
      }, [type]);
      return h(
        React.Fragment,
        null,
        h('div', { className: 'dw-scrim', onClick: onClose, 'aria-hidden': 'true' }),
        h(
          'div',
          { className: 'dw-card dw-card--sheet dw-in', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'dw-composer-title' },
          h(
            'div',
            { className: 'dw-card__head' },
            h(
              'div',
              null,
              h('p', { className: 'dw-card__kicker' }, `NEW PIN · ${lang === 'zh' ? '钉一钉' : 'DING'}`),
              h('h2', { className: 'dw-card__title', id: 'dw-composer-title' }, titles[type]),
            ),
            h('button', { type: 'button', className: 'dw-close', onClick: onClose, 'aria-label': t('close') }, '×'),
          ),
          h(
            'div',
            { className: 'dw-tabs', role: 'tablist', 'aria-label': t('newPin') },
            [
              { key: 'idea', label: t('idea'), num: '1' },
              { key: 'todo', label: t('todo'), num: '2' },
              { key: 'opinion', label: t('opinion'), num: '3' },
            ].map((tab) =>
              h(
                'button',
                {
                  key: tab.key,
                  type: 'button',
                  role: 'tab',
                  'aria-selected': type === tab.key,
                  className: cx('dw-tab', type === tab.key && 'is-active'),
                  onClick: () => onChange({ type: tab.key }),
                },
                h('span', { className: 'dw-tab__num' }, tab.num),
                tab.label,
              ),
            ),
          ),
          h(
            'div',
            { className: 'dw-field' },
            h(
              'label',
              { className: 'dw-field__label', htmlFor: 'dw-composer-text' },
              type === 'opinion' ? (lang === 'zh' ? '信的内容' : 'Letter') : (lang === 'zh' ? '写下内容' : 'Your note'),
            ),
            h('textarea', {
              id: 'dw-composer-text',
              ref: textareaRef,
              className: 'dw-textarea dw-composer__text',
              value: composer.text,
              maxLength: max,
              placeholder: placeholders[type],
              onChange: (event) => onChange({ text: event.target.value }),
            }),
            h('div', { className: 'dw-counter' }, `${composer.text.length} / ${max}`),
          ),
          type === 'opinion'
            ? h(
                'div',
                null,
                h(
                  'div',
                  { className: 'dw-field' },
                  h('span', { className: 'dw-field__label' }, lang === 'zh' ? '语气' : 'Tone'),
                  h(
                    'div',
                    { className: 'dw-moods' },
                    moods.map((mood) =>
                      h(
                        'button',
                        {
                          key: mood.value,
                          type: 'button',
                          className: cx('dw-mood-btn', composer.mood === mood.value && 'is-active'),
                          onClick: () => onChange({ mood: mood.value }),
                        },
                        mood.label,
                      ),
                    ),
                  ),
                ),
                h('p', { className: 'dw-anon-note' }, t('anonymousNote')),
              )
            : null,
          error ? h('p', { className: 'dw-error', style: { marginTop: 8 } }, error) : null,
          h(
            'div',
            { className: 'dw-form-foot' },
            h('span', { className: 'dw-hint' }, t('composerHint')),
            h(
              'button',
              { type: 'button', className: 'dw-btn dw-btn--primary', onClick: onSubmit, disabled: busy },
              busy ? t('submitting') : t('submit'),
            ),
          ),
        ),
      );
    }

    /* ------------------------------------------------------------ 名片 */
    function IdentitySheet({ t, lang, me, members, busy, error, onSave, onPick, onClose }) {
      const [name, setName] = useState(me ? me.name : '');
      const [emoji, setEmoji] = useState(me ? me.emoji : EMOJIS[0]);
      const canClose = Boolean(me);
      const quick = (members || []).filter((member) => member.demo !== true && (!me || member.id !== me.id));
      return h(
        React.Fragment,
        null,
        h('div', { className: 'dw-scrim', onClick: canClose ? onClose : undefined, 'aria-hidden': 'true' }),
        h(
          'div',
          { className: 'dw-card dw-in', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'dw-identity-title' },
          h(
            'div',
            { className: 'dw-card__head' },
            h(
              'div',
              null,
              h('p', { className: 'dw-card__kicker' }, `WALL ACCESS · ${lang === 'zh' ? '认领名片' : 'CLAIM A CARD'}`),
              h('h2', { className: 'dw-card__title', id: 'dw-identity-title' }, me ? t('identityEditTitle') : t('identityTitle')),
            ),
            canClose ? h('button', { type: 'button', className: 'dw-close', onClick: onClose, 'aria-label': t('close') }, '×') : null,
          ),
          h('p', { className: 'dw-card__desc' }, t('identityDesc')),
          quick.length > 0 && !me
            ? h(
                'div',
                { className: 'dw-field' },
                h('span', { className: 'dw-field__label' }, lang === 'zh' ? '墙上有这些名片，是你就点一下' : 'Existing cards — pick yours'),
                h(
                  'div',
                  { className: 'dw-moods' },
                  quick.map((member) =>
                    h(
                      'button',
                      { key: member.id, type: 'button', className: 'dw-mood-btn', onClick: () => onPick(member) },
                      `${member.emoji || '◌'} ${member.name}`,
                    ),
                  ),
                ),
              )
            : null,
          h(
            'div',
            { className: 'dw-field' },
            h('label', { className: 'dw-field__label', htmlFor: 'dw-identity-name' }, t('nameLabel')),
            h('input', {
              id: 'dw-identity-name',
              className: 'dw-input',
              value: name,
              maxLength: 24,
              placeholder: t('namePlaceholder'),
              onChange: (event) => setName(event.target.value),
            }),
          ),
          h(
            'div',
            { className: 'dw-field' },
            h('span', { className: 'dw-field__label' }, t('emojiLabel')),
            h(
              'div',
              { className: 'dw-emoji-grid', role: 'radiogroup', 'aria-label': t('emojiLabel') },
              EMOJIS.map((face) =>
                h(
                  'button',
                  {
                    key: face,
                    type: 'button',
                    role: 'radio',
                    'aria-checked': emoji === face,
                    className: cx('dw-emoji', emoji === face && 'is-active'),
                    onClick: () => setEmoji(face),
                  },
                  face,
                ),
              ),
            ),
          ),
          error ? h('p', { className: 'dw-error', style: { marginTop: 8 } }, error) : null,
          h(
            'div',
            { className: 'dw-form-foot' },
            h('span', { className: 'dw-hint' }, lang === 'zh' ? '可以随时改' : 'You can change it anytime'),
            h(
              'button',
              { type: 'button', className: 'dw-btn dw-btn--primary', disabled: busy, onClick: () => onSave({ name, emoji }) },
              busy ? t('identitySaving') : me ? t('save') : t('identitySubmit'),
            ),
          ),
        ),
      );
    }

    /* ------------------------------------------------------------ 晨报 */
    function MorningView({ t, lang, data, me, online, page, auto, onPage, onClose, onToggleAuto }) {
      const ideas = data.ideas;
      const todos = data.todos;
      const opinions = data.opinions;
      const week = weekData(data, lang);
      const doneTodos = todos.filter((todo) => todo.status === 'done').length;
      const ratio = todos.length === 0 ? 0 : Math.round((doneTodos / todos.length) * 100);
      const todayCount = week.days[6] ? week.days[6].ideas + week.days[6].todos + week.days[6].opinions : 0;
      const weekTotal = week.days.reduce((sum, day) => sum + day.ideas + day.todos + day.opinions, 0);
      const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
      const onlineCount = (online || []).filter((member) => membersHas(data.members, member.id)).length;
      const headline = ideas[0] || null;
      const moods = { casual: t('moodCasual'), suggest: t('moodSuggest'), worry: t('moodWorry'), vent: t('moodVent') };
      const labels = [t('headline'), t('todoBoard'), t('echoLetter')];

      function memberName(memberId) {
        const member = data.members.find((item) => item.id === memberId);
        return member ? member.name : t('anonymous');
      }
      function memberEmoji(memberId) {
        const member = data.members.find((item) => item.id === memberId);
        return member ? member.emoji || '◌' : '◌';
      }

      const headlineBlock = h(
        'div',
        { className: 'dw-paper__section' },
        h('div', { className: 'dw-paper__label' }, labels[0]),
        h('div', { className: 'dw-paper__headline' }, headline ? headline.text : t('noIdea')),
        headline ? h('p', { className: 'dw-paper__byline' }, `${memberEmoji(headline.authorId)} ${memberName(headline.authorId)} · ${relTime(headline.createdAt, lang)}`) : null,
      );

      const ideasBlock = h(
        'div',
        { className: 'dw-paper__section' },
        h('div', { className: 'dw-paper__label' }, t('ideasGlance')),
        ideas.length === 0
          ? h('p', { className: 'dw-paper__empty' }, t('noIdea'))
          : h(
              'div',
              { className: 'dw-paper__list' },
              ideas.slice(0, 5).map((idea, index) =>
                h(
                  'div',
                  { className: 'dw-paper__row', key: idea.id },
                  h('span', { className: 'dw-index' }, String(index + 1).padStart(2, '0')),
                  h('span', null, truncate(idea.text, 44)),
                  h('span', { className: 'dw-who' }, `${memberEmoji(idea.authorId)} ${memberName(idea.authorId)}`),
                ),
              ),
            ),
      );

      const todoGroups = ['todo', 'doing', 'done'].map((status) => ({
        status,
        label: status === 'todo' ? t('statusTodo') : status === 'doing' ? t('statusDoing') : t('statusDone'),
        items: todos.filter((todo) => todo.status === status),
      }));

      const todoBlock = h(
        'div',
        { className: 'dw-paper__section' },
        h('div', { className: 'dw-paper__label' }, labels[1]),
        todos.length === 0
          ? h('p', { className: 'dw-paper__empty' }, t('noTodo'))
          : h(
              'div',
              { className: 'dw-paper__cols' },
              h(
                'div',
                null,
                todoGroups.map((group) =>
                  h(
                    'div',
                    { key: group.status, style: { marginBottom: 8 } },
                    h('div', { className: 'dw-stat__label', style: { marginBottom: 3 } }, `${group.label} · ${group.items.length}`),
                    group.items.length === 0
                      ? h('p', { className: 'dw-paper__empty', style: { marginTop: 0 } }, '—')
                      : h(
                          'div',
                          { className: 'dw-paper__list' },
                          group.items.slice(0, 4).map((todo) =>
                            h(
                              'div',
                              { className: 'dw-paper__row', key: todo.id },
                              h('span', { className: 'dw-dot dw-dot--todo', style: { flex: 'none', marginTop: 6 } }),
                              h('span', null, truncate(todo.text, 30)),
                              h('span', { className: 'dw-who' }, `${memberEmoji(todo.authorId)} ${memberName(todo.authorId)}`),
                            ),
                          ),
                        ),
                  ),
                ),
              ),
              h(
                'div',
                null,
                h('div', { className: 'dw-stat__label', style: { marginBottom: 3 } }, t('members')),
                h(
                  'div',
                  { className: 'dw-members' },
                  memberActivity(data, online, me).rows.slice(0, 6).map((row) =>
                    h(
                      'div',
                      { className: 'dw-member', key: row.member.id },
                      h('span', { className: 'dw-face-mini' }, row.member.emoji || '◌'),
                      h('span', { className: 'dw-member__name' }, row.member.name),
                      h('span', { className: 'dw-member__count' }, String(row.count)),
                      h('span', { className: cx('dw-dot', row.online && 'dw-dot--online') }),
                    ),
                  ),
                ),
              ),
            ),
      );

      const opinion = opinions[0];
      const echoBlock = h(
        'div',
        { className: 'dw-paper__section' },
        h('div', { className: 'dw-paper__label' }, labels[2]),
        opinion
          ? h(
              'div',
              null,
              h('div', { className: 'dw-paper__headline', style: { fontSize: 16 } }, opinion.text),
              h(
                'p',
                { className: 'dw-paper__byline' },
                `${moods[opinion.mood] || moods.casual} · ${relTime(opinion.createdAt, lang)} · ${t('anonSeal')}`,
              ),
            )
          : h('p', { className: 'dw-paper__empty' }, t('noEcho')),
      );

      const pulseBlock = h(
        'div',
        { className: 'dw-paper__section' },
        h('div', { className: 'dw-paper__label' }, t('pulseLine')),
        h(
          'div',
          { className: 'dw-paper__stats' },
          h('div', { className: 'dw-paper__stat' }, h('b', null, String(todayCount)), h('span', null, t('today'))),
          h('div', { className: 'dw-paper__stat' }, h('b', null, String(weekTotal)), h('span', null, t('week'))),
          h('div', { className: 'dw-paper__stat' }, h('b', null, `${ratio}%`), h('span', null, t('completion'))),
          h('div', { className: 'dw-paper__stat' }, h('b', null, String(onlineCount)), h('span', null, t('online'))),
        ),
      );

      const pages = [
        h(React.Fragment, { key: 'p0' }, headlineBlock, h('div', { className: 'dw-paper__cols' }, ideasBlock, h('div', null, pulseBlock))),
        h(React.Fragment, { key: 'p1' }, todoBlock),
        h(React.Fragment, { key: 'p2' }, echoBlock, pulseBlock),
      ];
      const current = clamp(page, 0, pages.length - 1);

      return h(
        'div',
        { className: 'dw-morning', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('morningTitle') },
        h(
          'div',
          { className: 'dw-paper' },
          h('p', { className: 'dw-paper__kicker' }, t('morningTitle')),
          h('h2', { className: 'dw-paper__title' }, t('subtitle')),
          h(
            'p',
            { className: 'dw-paper__meta' },
            `${todayLabel(lang)} · ${lang === 'zh' ? `第 ${dayOfYear} 期` : `Issue ${dayOfYear}`} · ${t('morningEditor')}`,
          ),
          pages.map((content, index) => (index === current ? content : null)),
          h(
            'div',
            { className: 'dw-paper__foot' },
            h('span', null, lang === 'zh' ? '晨报由墙上的纸片自动生成' : 'Auto-composed from the wall'),
            h('span', null, '← / → 翻页 · Esc 退出'),
          ),
        ),
        h(
          'div',
          { className: 'dw-morning__bar' },
          h(Strike, { label: `← ${t('prev')}`, onClick: () => onPage((current + pages.length - 1) % pages.length) }),
          h('span', { className: 'dw-morning__page' }, `${current + 1} / ${pages.length}`),
          h(Strike, { label: `${t('next')} →`, onClick: () => onPage((current + 1) % pages.length) }),
          h(Strike, { label: auto ? t('autoPlaying') : t('autoPlay'), primary: auto, onClick: onToggleAuto }),
          h(Strike, { label: `${t('exit')} ⏎`, onClick: onClose }),
        ),
      );
    }

    function membersHas(members, id) {
      return members.some((member) => member.id === id);
    }

    function Toast({ message, action }) {
      return h(
        'div',
        { className: 'dw-toast dw-in', role: 'status', 'aria-live': 'polite' },
        h('span', null, message),
        action ? h('button', { type: 'button', className: 'dw-toast__action', onClick: action.onClick }, action.label) : null,
      );
    }

    /* ------------------------------------------------------------ 主面板 */
    function DingWallPanel({ t, lang }) {
      const savedMe = useMemo(() => loadSavedMember(), []);
      const [snapshot, setSnapshot] = useState(null);
      const [loadError, setLoadError] = useState('');
      const [me, setMe] = useState(savedMe);
      const meRef = useRef(savedMe);
      const [identityOpen, setIdentityOpen] = useState(!savedMe);
      const [identityBusy, setIdentityBusy] = useState(false);
      const [identityError, setIdentityError] = useState('');
      const [composer, setComposer] = useState(null);
      const [composerBusy, setComposerBusy] = useState(false);
      const [composerError, setComposerError] = useState('');
      const [connection, setConnection] = useState('connecting');
      const [online, setOnline] = useState([]);
      const [openIdeaId, setOpenIdeaId] = useState(null);
      const [morning, setMorning] = useState(null);
      const [config, setConfig] = useState(null);
      const [toastState, setToastState] = useState(null);
      const toastTimer = useRef(null);
      const refreshTimer = useRef(null);
      const submitRef = useRef(null);

      const applyMe = useCallback((member) => {
        meRef.current = member || null;
        setMe(member || null);
        saveMember(member || null);
      }, []);

      const showToast = useCallback((message, action) => {
        clearTimeout(toastTimer.current);
        setToastState({ message, action: action || null });
        toastTimer.current = setTimeout(() => setToastState(null), action ? 7000 : 3200);
      }, []);

      useEffect(
        () => () => {
          clearTimeout(toastTimer.current);
          clearTimeout(refreshTimer.current);
        },
        [],
      );

      const refresh = useCallback(async () => {
        const next = await request('/state');
        setSnapshot(next);
        setLoadError('');
        const saved = meRef.current;
        if (saved) {
          const found = next.members.find((member) => member.id === saved.id);
          if (found) {
            meRef.current = found;
            setMe(found);
            saveMember(found);
          } else {
            // 本机名片在服务端不存在：例如从「本机墙」切到「共享墙」、共享墙被重置、
            // 或换了一台墙服务。必须清掉旧身份并重新认领，否则所有写入都会 invalid_member。
            applyMe(null);
            setIdentityOpen(true);
            setComposer(null);
            showToast(lang === 'zh' ? '名片在共享墙上不存在，请重新认领一张' : 'Your card is not on this wall — claim a new one.');
          }
        } else if (next.members.length === 0) {
          setIdentityOpen(true);
        }
        return next;
      }, [applyMe, lang, showToast]);

      useEffect(() => {
        let alive = true;
        refresh().catch((error) => {
          if (alive) setLoadError(String(error && error.message ? error.message : error));
        });
        return () => {
          alive = false;
        };
      }, [refresh]);

      useEffect(() => {
        request('/config')
          .then((next) => setConfig(next))
          .catch(() => {});
      }, []);

      const meId = me ? me.id : '';
      useEffect(() => {
        if (typeof window.EventSource !== 'function') return undefined;
        const query = meId ? `?memberId=${encodeURIComponent(meId)}` : '';
        let source = null;
        try {
          source = new window.EventSource(`${API}/events${query}`);
        } catch {
          return undefined;
        }
        const onOpen = () => setConnection('online');
        const onPresence = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (Array.isArray(payload.online)) setOnline(payload.online);
          } catch {
            /* 忽略坏帧 */
          }
        };
        const onStateChanged = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload && payload.origin === CLIENT_ID) return;
          } catch {
            /* 忽略坏帧 */
          }
          clearTimeout(refreshTimer.current);
          refreshTimer.current = setTimeout(() => {
            refresh().catch(() => {});
          }, 120);
        };
        const onError = () => setConnection('reconnecting');
        source.addEventListener('open', onOpen);
        source.addEventListener('hello', onOpen);
        source.addEventListener('presence', onPresence);
        source.addEventListener('state-changed', onStateChanged);
        source.addEventListener('error', onError);
        return () => {
          try {
            source.close();
          } catch {
            /* 已关闭 */
          }
          clearTimeout(refreshTimer.current);
        };
      }, [meId, refresh]);

      // SSE 不可用（代理/中间层不支持长连接等）时：轮询兜底，保证多人墙仍能同步。
      const hasSnapshot = Boolean(snapshot);
      useEffect(() => {
        if (!hasSnapshot || connection === 'online') return undefined;
        const timer = setInterval(() => {
          refresh().catch(() => {});
        }, 5000);
        return () => clearInterval(timer);
      }, [hasSnapshot, connection, refresh]);

      useEffect(() => {
        if (!morning || !morning.auto) return undefined;
        const timer = setInterval(() => {
          setMorning((current) => (current ? { ...current, page: (current.page + 1) % 3 } : current));
        }, 6500);
        return () => clearInterval(timer);
      }, [morning]);

      function memberById(memberId) {
        if (!snapshot) return null;
        return snapshot.members.find((member) => member.id === memberId) || null;
      }

      function requireMe() {
        if (!meRef.current) {
          showToast(t('reactNeedIdentity'));
          return null;
        }
        return meRef.current;
      }

      function openComposer(type) {
        setComposer({ type, text: '', mood: 'casual' });
        setComposerError('');
        setComposerBusy(false);
      }

      function closeComposer() {
        if (!composerBusy) setComposer(null);
      }

      function openMorning() {
        const hasContent = Boolean(snapshot && (snapshot.ideas.length > 0 || snapshot.todos.length > 0 || snapshot.opinions.length > 0));
        if (!hasContent) {
          showToast(t('morningRequires'));
          return;
        }
        setMorning({ page: 0, auto: false });
      }

      async function submitComposer() {
        const current = composer;
        if (!current || composerBusy) return;
        const text = String(current.text || '').trim();
        if (!text) {
          setComposerError(lang === 'zh' ? '先写点内容吧。' : 'Write something first.');
          return;
        }
        setComposerBusy(true);
        setComposerError('');
        try {
          if (current.type === 'idea') {
            const member = requireMe();
            if (!member) {
              setComposerBusy(false);
              return;
            }
            await request('/ideas', { method: 'POST', body: { text }, memberId: member.id });
          } else if (current.type === 'todo') {
            const member = requireMe();
            if (!member) {
              setComposerBusy(false);
              return;
            }
            await request('/todos', { method: 'POST', body: { text }, memberId: member.id });
          } else {
            await request('/opinions', { method: 'POST', body: { text, mood: current.mood || 'casual' } });
          }
          setComposer(null);
          setComposerBusy(false);
          await refresh();
          showToast(current.type === 'idea' ? t('ideaAdded') : current.type === 'todo' ? t('todoAdded') : t('letterSent'));
        } catch (error) {
          setComposerBusy(false);
          if (error && error.code === 'invalid_member') {
            applyMe(null);
            setIdentityOpen(true);
            setComposer(null);
            showToast(lang === 'zh' ? '名片在共享墙上不存在，请重新认领一张' : 'Your card is not on this wall — claim a new one.');
            return;
          }
          setComposerError(String(error && error.message ? error.message : error));
        }
      }
      submitRef.current = submitComposer;

      function handleComposerChange(partial) {
        setComposer((current) => (current ? { ...current, ...partial } : current));
        setComposerError('');
      }

      async function saveIdentity({ name, emoji }) {
        const trimmed = String(name || '').trim();
        if (!trimmed) {
          setIdentityError(t('nameRequired'));
          return;
        }
        if (trimmed.length > 24) {
          setIdentityError(t('nameTooLong'));
          return;
        }
        setIdentityBusy(true);
        setIdentityError('');
        const current = meRef.current;
        try {
          const result = current
            ? await request(`/members/${current.id}`, { method: 'PATCH', body: { name: trimmed, emoji } })
            : await request('/members', { method: 'POST', body: { name: trimmed, emoji } });
          if (result && result.member) applyMe(result.member);
          setIdentityOpen(false);
          await refresh();
          showToast(lang === 'zh' ? '名片钉好了' : 'Card pinned');
        } catch (error) {
          setIdentityError(String(error && error.message ? error.message : error));
        } finally {
          setIdentityBusy(false);
        }
      }

      async function reactIdea(idea, kind) {
        const member = requireMe();
        if (!member) return;
        try {
          await request(`/ideas/${idea.id}/react`, { method: 'POST', body: { kind }, memberId: member.id });
          await refresh();
        } catch (error) {
          showToast(String(error && error.message ? error.message : error));
        }
      }

      async function updateIdea(idea, patch) {
        try {
          await request(`/ideas/${idea.id}`, { method: 'PATCH', body: patch });
          await refresh();
        } catch (error) {
          showToast(String(error && error.message ? error.message : error));
          throw error;
        }
      }

      async function togglePin(idea) {
        try {
          await request(`/ideas/${idea.id}`, { method: 'PATCH', body: { pinned: !idea.pinned } });
          await refresh();
          showToast(idea.pinned ? t('unpin') : t('pinned'));
        } catch (error) {
          showToast(String(error && error.message ? error.message : error));
        }
      }

      async function deleteIdea(idea) {
        try {
          await request(`/ideas/${idea.id}`, { method: 'DELETE' });
          setOpenIdeaId((current) => (current === idea.id ? null : current));
          await refresh();
        } catch (error) {
          showToast(String(error && error.message ? error.message : error));
        }
      }

      async function moveTodo(todo, status) {
        if (!todo || todo.status === status) return;
        try {
          await request(`/todos/${todo.id}`, { method: 'PATCH', body: { status } });
          await refresh();
          if (status === 'done') {
            showToast(t('doneToast'), {
              label: t('undo'),
              onClick: () => {
                void undoDone(todo);
              },
            });
          }
        } catch (error) {
          showToast(String(error && error.message ? error.message : error));
        }
      }

      async function undoDone(todo) {
        try {
          await request(`/todos/${todo.id}`, { method: 'PATCH', body: { status: 'doing' } });
          await refresh();
          showToast(t('undoDone'));
        } catch (error) {
          showToast(String(error && error.message ? error.message : error));
        }
      }

      async function updateTodo(todo, patch) {
        try {
          await request(`/todos/${todo.id}`, { method: 'PATCH', body: patch });
          await refresh();
        } catch (error) {
          showToast(String(error && error.message ? error.message : error));
          throw error;
        }
      }

      async function deleteTodo(todo) {
        try {
          await request(`/todos/${todo.id}`, { method: 'DELETE' });
          await refresh();
        } catch (error) {
          showToast(String(error && error.message ? error.message : error));
        }
      }

      async function reactOpinion(opinion) {
        const member = requireMe();
        if (!member) return;
        try {
          await request(`/opinions/${opinion.id}/react`, { method: 'POST', body: { kind: 'echo' }, memberId: member.id });
          await refresh();
        } catch (error) {
          showToast(String(error && error.message ? error.message : error));
        }
      }

      async function seedDemo() {
        try {
          await request('/demo/seed', { method: 'POST' });
          await refresh();
          showToast(t('demoToast'));
        } catch (error) {
          showToast(String(error && error.message ? error.message : error));
        }
      }

      async function clearDemo() {
        try {
          await request('/demo', { method: 'DELETE' });
          await refresh();
          showToast(t('demoCleared'));
        } catch (error) {
          showToast(String(error && error.message ? error.message : error));
        }
      }

      useEffect(() => {
        function onKeyDown(event) {
          if (event.defaultPrevented) return;
          if (event.key === 'Escape') {
            if (morning) {
              setMorning(null);
              return;
            }
            if (identityOpen && meRef.current) {
              setIdentityOpen(false);
              return;
            }
            if (composer) {
              setComposer(null);
              return;
            }
            return;
          }
          if (identityOpen) return;
          if (isTypingTarget(event.target)) {
            if (composer && (event.metaKey || event.ctrlKey) && event.key === 'Enter') {
              event.preventDefault();
              void submitRef.current?.();
            }
            // 输入框内不绑定任何普通字符快捷键（尤其数字 1/2/3），否则会吞掉输入。
            return;
          }
          if (event.key === 'n' || event.key === 'N') {
            event.preventDefault();
            openComposer('idea');
            return;
          }
          if (event.key === 'm' || event.key === 'M') {
            event.preventDefault();
            openMorning();
            return;
          }
          if (morning) {
            if (event.key === 'ArrowRight') {
              event.preventDefault();
              setMorning((current) => (current ? { ...current, page: (current.page + 1) % 3 } : current));
            } else if (event.key === 'ArrowLeft') {
              event.preventDefault();
              setMorning((current) => (current ? { ...current, page: (current.page + 2) % 3 } : current));
            }
          }
        }
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
      });

      const actions = {
        emojiOf: (memberId) => {
          const member = memberById(memberId);
          return member ? member.emoji || '◌' : '◌';
        },
        nameOf: (memberId) => {
          const member = memberById(memberId);
          return member ? member.name : t('anonymous');
        },
        toast: showToast,
        toggleOpenIdea: (id) => setOpenIdeaId((current) => (current === id ? null : id)),
        hasEchoed: (opinion) => Boolean(me && me.id && Array.isArray(opinion.reactions && opinion.reactions.echo && opinion.reactions.echo.by) && opinion.reactions.echo.by.includes(me.id)),
        reactIdea,
        updateIdea,
        togglePin,
        deleteIdea,
        moveTodo,
        updateTodo,
        deleteTodo,
        reactOpinion,
        seedDemo,
        clearDemo,
      };

      const hasDemo = Boolean(
        snapshot &&
          (snapshot.ideas.some((item) => item.demo) ||
            snapshot.todos.some((item) => item.demo) ||
            snapshot.opinions.some((item) => item.demo)),
      );

      return h(
        'div',
        { className: 'dw-root' },
        h('style', null, CSS),
        !snapshot
          ? h(
              'div',
              { className: 'dw-loading' },
              loadError
                ? h(
                    React.Fragment,
                    null,
                    h('p', null, `${t('errorPrefix')}${loadError}`),
                    h(Strike, {
                      label: t('retry'),
                      primary: true,
                      onClick: () => {
                        setLoadError('');
                        refresh().catch((error) => setLoadError(String(error && error.message ? error.message : error)));
                      },
                    }),
                  )
                : h(React.Fragment, null, h('span', { className: 'dw-loading__dot' }), h('p', null, t('loading'))),
            )
          : h(
              React.Fragment,
              null,
              h(
                'header',
                { className: 'dw-head' },
                h(
                  'div',
                  { className: 'dw-brand' },
                  h('span', { className: 'dw-pin', 'aria-hidden': 'true' }),
                  h('div', null, h('h1', null, t('brand')), h('span', { className: 'dw-sub' }, t('subtitle'))),
                ),
                h(
                  'div',
                  { className: 'dw-head-right' },
                  h('span', { className: 'dw-date' }, todayLabel(lang)),
                  h(
                    'div',
                    { className: 'dw-head-actions' },
                    h(Presence, { members: snapshot.members, online, me, t, lang }),
                    h(
                      'button',
                      { type: 'button', className: 'dw-btn dw-btn--ink', onClick: openMorning },
                      '☀ ',
                      h('span', { className: 'dw-btn__label' }, t('morning')),
                      h('span', { className: 'dw-kbd' }, 'M'),
                    ),
                    h(
                      'button',
                      { type: 'button', className: 'dw-btn', onClick: () => setIdentityOpen(true) },
                      me
                        ? h(React.Fragment, null, h('span', { 'aria-hidden': 'true' }, me.emoji || '◌'), ' ', h('span', { className: 'dw-btn__label' }, me.name))
                        : h('span', { className: 'dw-btn__label' }, t('claim')),
                    ),
                  ),
                ),
              ),
              h(
                'div',
                { className: 'dw-scroll' },
                connection === 'reconnecting' ? h('div', { className: 'dw-banner' }, t('offline')) : null,
                hasDemo ? h('div', { className: 'dw-demo' }, t('demoBanner'), h('span', { style: { flex: 1 } }), h(Strike, { label: t('clearDemo'), onClick: clearDemo })) : null,
                h(
                  'div',
                  { className: 'dw-grid' },
                  h(IdeasSection, {
                    data: snapshot,
                    t,
                    lang,
                    me,
                    actions,
                    openIdeaId,
                    onCompose: openComposer,
                    onDemo: seedDemo,
                    onClearDemo: clearDemo,
                    hasDemo: false,
                  }),
                  h(TodosSection, { data: snapshot, t, lang, me, actions, onCompose: openComposer }),
                  h(
                    'div',
                    { className: 'dw-rail' },
                    h(EchoSection, { data: snapshot, t, lang, actions, onCompose: openComposer }),
                    h(PulseSection, { data: snapshot, t, lang, me, online }),
                  ),
                ),
                h(
                  'footer',
                  { className: 'dw-foot' },
                  h(
                    'span',
                    { className: 'dw-foot__mode' },
                    h('span', { className: 'dw-dot dw-dot--online' }),
                    config ? (config.shared ? t('sharedMode') : t('localMode')) : t('localMode'),
                    config ? ` · ${config.shared ? t('sharedHint') : t('localHint')}` : '',
                  ),
                  h('span', null, t('footerHint')),
                ),
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'dw-fab',
                  onClick: () => openComposer('idea'),
                  'aria-label': t('newPin'),
                },
                h('span', { className: 'dw-fab__plus', 'aria-hidden': 'true' }, '＋'),
                h('span', null, t('newPin')),
                h('span', { className: 'dw-fab__kbd', 'aria-hidden': 'true' }, 'N'),
              ),
              composer
                ? h(ComposerSheet, {
                    t,
                    lang,
                    composer,
                    error: composerError,
                    busy: composerBusy,
                    onClose: closeComposer,
                    onChange: handleComposerChange,
                    onSubmit: submitComposer,
                  })
                : null,
              identityOpen
                ? h(IdentitySheet, {
                    t,
                    lang,
                    me,
                    members: snapshot.members,
                    busy: identityBusy,
                    error: identityError,
                    onSave: saveIdentity,
                    onPick: (member) => {
                      applyMe(member);
                      setIdentityOpen(false);
                      void refresh();
                    },
                    onClose: () => setIdentityOpen(false),
                  })
                : null,
              morning
                ? h(MorningView, {
                    t,
                    lang,
                    data: snapshot,
                    me,
                    online,
                    page: morning.page,
                    auto: morning.auto,
                    onPage: (page) => setMorning((current) => (current ? { ...current, page } : current)),
                    onToggleAuto: () => setMorning((current) => (current ? { ...current, auto: !current.auto } : current)),
                    onClose: () => setMorning(null),
                  })
                : null,
              toastState ? h(Toast, { message: toastState.message, action: toastState.action }) : null,
            ),
      );
    }

    /* ------------------------------------------------------------ 插件入口 */
    const plugin = {
      name: NAMESPACE,
      inject: ['slots', 'layout', 'locale'],
      apply(ctx) {
        let active = 'zh';
        try {
          const locale = ctx.locale && typeof ctx.locale.getLocale === 'function' ? ctx.locale.getLocale() : null;
          const code = locale ? locale.active || locale.locale || locale.current : null;
          if (typeof code === 'string') active = code.toLowerCase().startsWith('zh') ? 'zh' : 'en';
        } catch {
          active = 'zh';
        }
        let translate = null;
        try {
          translate = ctx.locale && typeof ctx.locale.bind === 'function' ? ctx.locale.bind(NAMESPACE) : null;
        } catch {
          translate = null;
        }
        const dict = active === 'zh' ? ZH : EN;
        const t = (key) => {
          if (typeof translate === 'function') {
            try {
              const value = translate(key);
              if (typeof value === 'string' && value.trim() !== '' && value !== key) return value;
            } catch {
              /* 回退到内置词典 */
            }
          }
          return dict[key] ?? ZH[key] ?? key;
        };
        try {
          ctx.effect(() => ctx.locale.register(NAMESPACE, { zh: ZH, en: EN }), 'ding-wall: ui dictionaries');
        } catch {
          /* 语言服务不可用时使用内置词典 */
        }
        const Panel = (props) => h(DingWallPanel, { ...props, t, lang: active });
        ctx.inject(['layout'], (pageCtx) => {
          const slots = pageCtx.slots;
          slots.inject('main', () => {
            const offPage = slots.register({ name: 'main', key: PANEL_ID, locale: NAMESPACE }, Panel);
            const offIcon = slots.inject('sidebar.panellist', () =>
              slots.register(
                {
                  name: 'sidebar.panellist',
                  id: PANEL_ID,
                  order: 33,
                  locale: NAMESPACE,
                  label: () => t('sidebarLabel'),
                },
                SidebarIcon,
              ),
            );
            return () => {
              try {
                offIcon();
              } catch {
                /* 已卸载 */
              }
              try {
                offPage();
              } catch {
                /* 已卸载 */
              }
            };
          });
        });
      },
    };

    return plugin;
  },
});
