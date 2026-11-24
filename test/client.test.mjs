import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = fs.readFileSync(path.join(ROOT, 'client.js'), 'utf8');
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const PANEL_ID = 'ding-wall';
const ALLOWED_ART_COLORS = new Set(['#c8402f', '#f4a08e', '#d35b41', '#a53a26', '#7d2a1a']);

function loadClient() {
  let handoff = null;
  const windowStub = {
    __ModuleLoader__: {
      load(value) {
        handoff = value;
      },
    },
  };
  const reactStub = {
    createElement: (type, props, ...children) => ({ type, props, children }),
    useState: () => [undefined, () => {}],
    useEffect: () => {},
    useMemo: () => undefined,
    useRef: (initial) => ({ current: initial === undefined ? null : initial }),
    useCallback: (fn) => fn,
  };
  const run = new Function('window', 'document', 'localStorage', 'fetch', 'EventSource', 'navigator', SOURCE);
  run(windowStub, {}, { getItem: () => null, setItem() {}, removeItem() {} }, async () => ({}), undefined, {});
  assert.ok(handoff, 'client bundle 必须调用 window.__ModuleLoader__.load');
  const requested = [];
  const plugin = handoff.factory((specifier) => {
    requested.push(specifier);
    assert.equal(specifier, 'react', '浏览器 bundle 只能向平台模块表要 react');
    return reactStub;
  });
  return { handoff, plugin, requested };
}

function applyPlugin() {
  const { handoff, plugin, requested } = loadClient();
  const registrations = [];
  const dictionaries = {};
  const slots = {
    register(options, Component) {
      registrations.push({ options, Component });
      return () => {};
    },
    inject(_name, factory) {
      const disposer = factory();
      return typeof disposer === 'function' ? disposer : () => {};
    },
  };
  const locale = {
    getLocale: () => ({ active: 'zh' }),
    bind: () => (key) => key,
    register(namespace, dictionary) {
      dictionaries[namespace] = dictionary;
      return () => {};
    },
  };
  const ctx = {
    slots,
    layout: { selectPanel() {} },
    locale,
    effect(factory) {
      factory();
      return () => {};
    },
    inject(_services, callback) {
      callback(ctx);
    },
  };
  plugin.apply(ctx);
  return { handoff, plugin, requested, registrations, dictionaries };
}

test('bundle 契约：id 与包名一致，只依赖 react', () => {
  const { handoff, requested } = applyPlugin();
  assert.equal(handoff.id, PKG.name);
  assert.equal(handoff.id, 'dsh-ding-wall');
  assert.deepEqual(requested, ['react']);
});

test('插件对象：注入 slots/layout/locale，注册 main 面板与侧栏图标且 id 一致', () => {
  const { plugin, registrations } = applyPlugin();
  assert.equal(plugin.name, 'dsh-ding-wall');
  assert.equal(typeof plugin.apply, 'function');
  for (const service of ['slots', 'layout', 'locale']) assert.ok(plugin.inject.includes(service), service);
  const page = registrations.find((item) => item.options && item.options.name === 'main');
  const icon = registrations.find((item) => item.options && item.options.name === 'sidebar.panellist');
  assert.ok(page, '必须注册 main 面板');
  assert.ok(icon, '必须注册侧栏图标');
  assert.equal(page.options.key, PANEL_ID);
  assert.equal(icon.options.id, PANEL_ID, '侧栏 id 与 main key 相同才能互相绑定');
  assert.equal(typeof page.Component, 'function');
  assert.equal(typeof icon.Component, 'function');
  assert.equal(typeof icon.options.label(), 'string');
});

test('语言词典：中英词典齐备，覆盖主要界面文案', () => {
  const { dictionaries } = applyPlugin();
  const dict = dictionaries['dsh-ding-wall'];
  assert.ok(dict && dict.zh && dict.en);
  for (const key of ['brand', 'ideas', 'todos', 'echo', 'pulse', 'newPin', 'morning', 'identityTitle', 'emptyIdeasTitle', 'submit', 'anonymousNote', 'connectTitle', 'accessCodeLabel', 'connectAction', 'noAccessCode', 'updateAvailable', 'updateNow', 'updating', 'updateRestart']) {
    assert.equal(typeof dict.zh[key], 'string', `zh.${key}`);
    assert.equal(typeof dict.en[key], 'string', `en.${key}`);
  }
});

test('品牌版本号与待办：显示版本、无分类、可点状态图标', () => {
  assert.match(SOURCE, /dw-brand__ver/, '品牌旁必须有版本小字');
  assert.match(SOURCE, /statusTodo: '未开始'/, '状态文案：未开始');
  assert.match(SOURCE, /statusDoing: '推进中'/, '状态文案：推进中');
  assert.match(SOURCE, /statusDone: '已完成'/, '状态文案：已完成');
  assert.match(SOURCE, /dw-todo__status/, '每行待办必须有状态图标按钮');
  assert.match(SOURCE, /dw-todo__line/, '待办必须按行渲染状态');
  assert.match(SOURCE, /lineStatuses/, '待办必须使用逐行状态字段');
  assert.doesNotMatch(SOURCE, /dw-sub/, '品牌下的副标题区域必须删除');
  assert.doesNotMatch(SOURCE, /dw-lane__head/, '分类栏头必须删除');
  assert.doesNotMatch(SOURCE, /draggable:/, '不再使用拖拽分类');
});

test('样式：Dusk 暗色玻璃设计系统（石板 / 烟熏玻璃 / bone / 双信号）', () => {
  for (const token of ['#14141c', '#b9b8ff', '#ffd2a1', '#f3f0ea']) {
    assert.ok(SOURCE.includes(token), `缺少 Dusk 调色板 ${token}`);
  }
  assert.ok(SOURCE.includes('Wix Madefor'), '标题/正文必须使用 Dusk 的 Wix Madefor 字体栈');
  assert.ok(SOURCE.includes('backdrop-filter'), '必须使用烟熏玻璃材质');
  assert.ok(SOURCE.includes('--dw-well'), '必须包含 bone well 浅色表面');
  assert.ok(SOURCE.includes('.dw-note--tone-'), '便签必须有 tone 钩子（由 Dusk 层统一表面）');
  assert.ok(SOURCE.includes('.dw-fab'), '必须保留「钉一张」浮动按钮');
  assert.ok(SOURCE.includes('.dw-todo__status'), '待办必须有逐行状态控件');
  for (const name of ['dw-note__text', 'dw-todo__text', 'dw-letter__text']) {
    const rule = (SOURCE.match(new RegExp(`(?:^|\\n)\\.${name} \\{[\\s\\S]*?\\}`)) || [''])[0];
    assert.match(rule, /white-space:\s*pre-wrap/, `${name} 必须保留用户输入的换行`);
  }
});

test('产物纯净：无 import、无 Node/平台包、无外链请求', () => {
  assert.ok(!/^\s*import\s/m.test(SOURCE), '浏览器 bundle 不能有 import 语句');
  assert.ok(!/require\(['"](?!react['"])/.test(SOURCE), '不能 require 平台包之外的模块');
  assert.ok(!/node:/.test(SOURCE), '不能引用 Node 内置模块');
  assert.ok(!/@deepseek-ai\//.test(SOURCE), '不能引用 harness 包');
  assert.ok(!/https?:\/\/(?!www\.w3\.org)/.test(SOURCE), 'bundle 内不能写死任何外部地址（SVG 命名空间除外）');
  assert.ok(!/document\.body/.test(SOURCE), '不能在组件外挂 DOM 到 body');
});

test('键盘：输入框内不绑定数字 1/2/3 快捷键', () => {
  // 回归测试：弹层打开时曾把 1/2/3 绑成切换标签的快捷键，导致输入框里打不出数字。
  assert.doesNotMatch(SOURCE, /\[\s*['"]1['"]\s*,\s*['"]2['"]\s*,\s*['"]3['"]\s*\]/);
  assert.doesNotMatch(SOURCE, /event\.key\s*===\s*['"](?:1|2|3)['"]/);
  assert.doesNotMatch(SOURCE, /Digit[123]/);
  assert.match(SOURCE, /isTypingTarget\(event\.target\)/, '输入框判定仍要保留，避免其他单字母快捷键误触');
});

test('manifest 与展示资源：补丁、client 导出、双语 meta、图标齐备', () => {
  assert.equal(PKG.name, 'dsh-ding-wall');
  assert.equal(PKG.type, 'module');
  assert.equal(PKG.exports['./client'], './client.js');
  assert.equal(PKG.dsh.bundle.patch, './cordis.patch.yml');
  assert.equal(PKG.dsh.client.platform, 'web');
  assert.ok(Array.isArray(PKG.dsh.client.inject) && PKG.dsh.client.inject.length > 0);
  assert.ok(!PKG.peerDependencies, '不要声明 DSH peer 版本，避免被插件管理器的版本闸门误伤');
  assert.ok(Array.isArray(PKG.files) && PKG.files.includes('client.js') && PKG.files.includes('icon.svg'));

  const patch = fs.readFileSync(path.join(ROOT, 'cordis.patch.yml'), 'utf8');
  assert.match(patch, /id:\s*ding-wall/);
  assert.match(patch, /name:\s*dsh-ding-wall/);

  for (const language of ['zh', 'en']) {
    const locale = JSON.parse(fs.readFileSync(path.join(ROOT, 'locale', `${language}.json`), 'utf8'));
    assert.equal(typeof locale.meta.title, 'string');
    assert.ok(locale.meta.title.length > 0);
    assert.equal(typeof locale.meta.description, 'string');
  }
  const iconPath = path.join(ROOT, 'icon.svg');
  const icon = fs.readFileSync(iconPath);
  assert.ok(icon.length < 256 * 1024);
  assert.match(icon.toString('utf8').slice(0, 120), /<svg/);
});

/* ---------------------------------------------- 预订日历 */

const BOOK_BLOCK = (() => {
  const start = SOURCE.indexOf('/* @dw-bookings:start */');
  const end = SOURCE.indexOf('/* @dw-bookings:end */');
  assert.ok(start >= 0 && end > start, 'client.js 必须有 @dw-bookings 编解码块');
  return SOURCE.slice(start, end);
})();

function loadBookingsModule() {
  const factory = new Function(
    BOOK_BLOCK +
      'return { BOOK_TAG, encodeBooking, decodeBooking, splitBookings, monthGrid, conflictsOf, overlapsWith, hasConflict, bookingsOn, minutesOf, rangeLabel, isDateKey, keyOfDate, BOOK_START_TIMES, BOOK_END_TIMES, timeChoices };',
  );
  return factory();
}

test('预订编解码：进得去出得来，内容里的竖线也不会丢', () => {
  const api = loadBookingsModule();
  const text = api.encodeBooking({ date: '2026-11-24', start: '09:00', end: '10:30', text: '和客户对需求 | 带原型' });
  const booking = api.decodeBooking({ id: 'i1', authorId: 'm1', createdAt: '2026-11-24T01:00:00.000Z', text });
  assert.ok(booking);
  assert.equal(booking.date, '2026-11-24');
  assert.equal(booking.start, '09:00');
  assert.equal(booking.end, '10:30');
  assert.equal(booking.text, '和客户对需求 | 带原型');
  assert.equal(booking.authorId, 'm1');
  assert.equal(booking.id, 'i1');
});

test('预订解析：普通便签不被吞掉，坏记录退回便签', () => {
  const api = loadBookingsModule();
  assert.equal(api.decodeBooking({ id: 'a', text: '普通便签' }), null);
  assert.equal(api.decodeBooking({ id: 'b', text: api.BOOK_TAG + '2026-11-24|10:00|09:00|倒着的时间' }), null);
  assert.equal(api.decodeBooking({ id: 'c', text: api.BOOK_TAG + '2026-02-31|09:00|10:00|不存在的日期' }), null);
  const split = api.splitBookings([
    { id: 'a', text: '普通便签' },
    { id: 'b', text: api.encodeBooking({ date: '2026-11-25', start: '14:00', end: '15:00', text: '评审' }) },
  ]);
  assert.equal(split.ideas.length, 1);
  assert.equal(split.bookings.length, 1);
  assert.equal(split.ideas[0].id, 'a');
});

test('预订冲突：同日重叠才算冲突，首尾相接不算', () => {
  const api = loadBookingsModule();
  const a = { id: 'a', date: '2026-11-24', start: '09:00', end: '10:00' };
  assert.equal(api.overlapsWith(a, { id: 'b', date: '2026-11-24', start: '10:00', end: '11:00' }), false);
  assert.equal(api.overlapsWith(a, { id: 'b', date: '2026-11-24', start: '09:30', end: '10:30' }), true);
  assert.equal(api.overlapsWith(a, { id: 'b', date: '2026-11-25', start: '09:30', end: '10:30' }), false);
  assert.equal(api.overlapsWith(a, { ...a }), false, '自己不算和自己冲突');
  assert.equal(api.hasConflict([a, { id: 'b', date: '2026-11-24', start: '09:30', end: '10:30' }]), true);
  assert.equal(api.hasConflict([a, { id: 'b', date: '2026-11-24', start: '10:00', end: '11:00' }]), false);
});

test('月历排布：周一在左，42 格，跨月补齐', () => {
  const api = loadBookingsModule();
  for (const [year, month] of [[2026, 10], [2026, 1], [2024, 1]]) {
    const cells = api.monthGrid(year, month);
    assert.equal(cells.length, 42);
    assert.equal(new Date(cells[0].key + 'T00:00:00').getDay(), 1, '第一格必须是周一');
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    assert.equal(cells.filter((cell) => cell.inMonth).length, daysInMonth);
    const firstIndex = cells.findIndex((cell) => cell.inMonth && cell.day === 1);
    assert.ok(firstIndex >= 0 && firstIndex < 7, '每月 1 号必须落在第一行');
    for (const cell of cells) assert.equal(api.isDateKey(cell.key), true);
  }
});

test('日历界面：方块挂在信箱之后、心律之前，格子里只放时间段', () => {
  const echoAt = SOURCE.indexOf('function EchoSection');
  const calAt = SOURCE.indexOf('function CalendarSection');
  const pulseAt = SOURCE.indexOf('function PulseSection');
  assert.ok(echoAt > 0 && calAt > echoAt && pulseAt > calAt, '日历区块必须排在匿名信箱和团队心律之间');
  assert.ok(SOURCE.includes("className: 'dw-cal'"), '必须有日历方框');
  assert.ok(SOURCE.includes('dw-cal__chip'), '格子里必须显示时间段');
  assert.ok(SOURCE.includes('dw-cal__week'), '必须有星期行');
  assert.ok(SOURCE.includes('function CalendarSection'), '必须有日历组件');
  assert.ok(SOURCE.includes('calendarConflictWarn'), '预订冲突要有提示');
  assert.ok(SOURCE.includes('CalendarSection, { data: view'), '面板里必须挂上日历');
  assert.ok(SOURCE.includes("className: 'dw-input dw-select'"), '起止时间必须是下拉选择');
  assert.ok(!SOURCE.includes("type: 'time'"), '不要再用可手填的时间输入框');
  const dict = applyPlugin().dictionaries['dsh-ding-wall'];
  for (const key of ['calendar', 'calendarConflict', 'calendarConflictWarn', 'calendarWeekdays', 'calendarEmptyDay', 'calendarBookDay']) {
    assert.equal(typeof dict.zh[key], 'string', 'zh.' + key);
    assert.equal(typeof dict.en[key], 'string', 'en.' + key);
  }
});

test('时间下拉：30 分钟一档，开始到 23:00、结束到 23:30，怎么选都还有合法的结束时间', () => {
  const api = loadBookingsModule();
  const starts = api.BOOK_START_TIMES;
  const ends = api.BOOK_END_TIMES;
  assert.equal(starts[0], '00:00');
  assert.equal(starts[starts.length - 1], '23:00');
  assert.equal(ends[0], '00:30');
  assert.equal(ends[ends.length - 1], '23:30');
  assert.equal(starts.length, 47);
  assert.equal(ends.length, 47);
  for (const value of starts.concat(ends)) assert.ok(api.minutesOf(value) >= 0, value);
  assert.ok(api.minutesOf(ends[ends.length - 1]) > api.minutesOf(starts[starts.length - 1]), '最晚的开始时间之后仍然有结束时间');
  for (let index = 1; index < starts.length; index += 1) {
    assert.equal(api.minutesOf(starts[index]) - api.minutesOf(starts[index - 1]), 30, '节奏必须是 30 分钟');
  }
});

test('时间下拉：历史手填的 09:15 也补进选项里，且不重复插入', () => {
  const api = loadBookingsModule();
  const starts = api.BOOK_START_TIMES;
  const mixed = api.timeChoices(starts, '09:15');
  assert.ok(mixed.includes('09:15'));
  assert.equal(mixed[mixed.indexOf('09:15') - 1], '09:00');
  assert.equal(mixed[mixed.indexOf('09:15') + 1], '09:30');
  assert.equal(api.timeChoices(starts, '09:00'), starts, '已在列表里就原样返回');
  assert.equal(api.timeChoices(starts, ''), starts, '空值不插入');
});
