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
  for (const key of ['brand', 'ideas', 'todos', 'echo', 'pulse', 'newPin', 'morning', 'identityTitle', 'emptyIdeasTitle', 'submit', 'anonymousNote']) {
    assert.equal(typeof dict.zh[key], 'string', `zh.${key}`);
    assert.equal(typeof dict.en[key], 'string', `en.${key}`);
  }
});

test('样式：复原网页版的暖纸设计系统（纸感调色板 / 宋体 / 纸纹）', () => {
  for (const token of ['#f3ecdf', '#22201c', '#c3472f', '#d99a2b', '#2f5375', '#57795f', '#d8c3a1']) {
    assert.ok(SOURCE.includes(token), `缺少纸感调色板 ${token}`);
  }
  assert.ok(SOURCE.includes('Songti SC'), '标题必须使用宋体展示字体');
  assert.ok(SOURCE.includes('feTurbulence'), '必须带纸张颗粒纹理（SVG 噪点）');
  assert.ok(SOURCE.includes('repeating-linear-gradient'), '必须带纸纤维/格线纹理');
  assert.ok(SOURCE.includes('.dw-note--tone-'), '便签必须有多种纸色');
  assert.ok(SOURCE.includes('.dw-fab'), '必须保留原版红色浮动「钉一张」按钮');
  assert.ok(SOURCE.includes('linear-gradient(rgba(47, 83, 117, 0.13) 1px'), '团队心律必须是方格纸底');
  assert.ok(SOURCE.includes('data:image/svg+xml'), '纸纹必须是本地内联资源，不能外链');
});

test('产物纯净：无 import、无 Node/平台包、无外链请求', () => {
  assert.ok(!/^\s*import\s/m.test(SOURCE), '浏览器 bundle 不能有 import 语句');
  assert.ok(!/require\(['"](?!react['"])/.test(SOURCE), '不能 require 平台包之外的模块');
  assert.ok(!/node:/.test(SOURCE), '不能引用 Node 内置模块');
  assert.ok(!/@deepseek-ai\//.test(SOURCE), '不能引用 harness 包');
  assert.ok(!/https?:\/\/(?!www\.w3\.org)/.test(SOURCE), 'bundle 内不能写死任何外部地址（SVG 命名空间除外）');
  assert.ok(!/document\.body/.test(SOURCE), '不能在组件外挂 DOM 到 body');
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
