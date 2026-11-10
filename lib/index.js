/**
 * 钉一下 · 三个人的墙 —— 宿主半侧。
 *
 * 职责：
 *  1. 在 DSH 的 Web 服务上挂载 `/api/ding-wall/*` 前缀路由（面板同源调用）；
 *  2. 本地模式：内嵌「墙」的存储与 REST/SSE（复用团队墙的 store/api/sse）；
 *  3. 共享模式：把同一组请求原样代理到配置里的墙服务，让三位队友连同一面墙；
 *  4. 每个请求都过一遍浏览器信任闸门（裸路由不会自动继承）。
 *
 * 模块本身不依赖 harness 私有的运行时模块，除了配置 schema 用到的
 * `@deepseek-ai/schemastery`；其余只用 Node 内置模块，方便 `node --test`。
 */
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Store } from './store.js';
import { SseHub } from './sse.js';
import { createRequestHandler } from './api.js';
import { evaluateGate } from './gate.js';
import { createProxy } from './proxy.js';
import { API_SEGMENTS, ROUTE_PREFIX, WEB_SERVER_KEYS, resolveConfig } from './config.js';
import { sendError, sendJson } from './http.js';

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = path.join(PACKAGE_ROOT, 'public');

/** 插件身份：与 package.json 的 name 保持一致（client bundle 也用它）。 */
export const PLUGIN_ID = 'ding-wall';
export const PLUGIN_VERSION = '0.1.3';

export const name = PLUGIN_ID;
/** 不强制依赖任何服务：Web 服务可能晚于本插件激活。 */
export const inject = [];

/** 建立请求依赖（本地 store/SSE hub，或共享模式代理）。 */
function createDeps(ctx, cfg) {
  if (cfg.mode === 'shared') {
    return { ctx, cfg, proxy: createProxy({ serverUrl: cfg.serverUrl, timeoutMs: cfg.timeoutMs, serverToken: cfg.serverToken, serverCa: cfg.serverCa }) };
  }
  const store = new Store({ dataDir: cfg.stateDir });
  store.load();
  const hub = new SseHub({
    resolveMember: (memberId) => store.state.members.find((member) => member.id === memberId) ?? null,
  });
  const handler = createRequestHandler({
    store,
    hub,
    publicDir: PUBLIC_DIR,
    startedAt: store.nowIso(),
  });
  return { ctx, cfg, store, hub, handler };
}

/** 面板需要的运行信息（不含本机路径）。 */
function configView(deps) {
  return {
    id: PLUGIN_ID,
    version: PLUGIN_VERSION,
    mode: deps.cfg.mode,
    shared: deps.cfg.mode === 'shared',
    secured: deps.cfg.serverToken !== '',
    tlsPinned: deps.cfg.serverCa !== '',
    apiPrefix: ROUTE_PREFIX,
  };
}

async function handleRequest(req, res, deps) {
  try {
    const rejection = evaluateGate(deps.ctx.get?.('connection'), req, res);
    if (rejection !== undefined) {
      sendError(res, rejection, rejection === 401 ? 'unauthorized' : 'forbidden', 'request rejected by the browser-trust fence');
      return;
    }
    const url = new URL(req.url ?? '/', 'http://localhost');
    const relative = (url.pathname.slice(ROUTE_PREFIX.length).replace(/\/+$/, '') || '/') ?? '/';

    if (relative === '/config') {
      sendJson(res, 200, configView(deps));
      return;
    }

    const first = relative.split('/').filter(Boolean)[0];
    if (!first || !API_SEGMENTS.has(first)) {
      sendError(res, 404, 'not_found', `unknown route: ${url.pathname}`);
      return;
    }

    if (deps.cfg.mode === 'shared') {
      await deps.proxy(req, res, relative, url.search);
      return;
    }

    // 本地模式下把前缀剥掉，复用团队墙既有的 /api/* 路由实现。
    req.url = `/api${relative}${url.search}`;
    await deps.handler(req, res);
  } catch (error) {
    deps.ctx.logger?.warn?.(`ding-wall: ${String(error?.message ?? error)}`);
    if (!res.headersSent) {
      sendError(res, 500, 'internal_error', '墙服务内部错误');
    } else {
      try {
        res.destroy();
      } catch {
        /* 已关闭 */
      }
    }
  }
}

/**
 * 插件入口。
 * @param {import('@deepseek-ai/cordis').Context} ctx
 * @param {{ serverUrl?: string, stateDir?: string, timeoutMs?: number }} [config]
 */
export function apply(ctx, config = {}) {
  const cfg = resolveConfig(config);
  const deps = createDeps(ctx, cfg);
  let routeDisposer = null;
  let registered = false;

  const mount = () => {
    if (registered) return;
    const webServer = ctx.get?.(WEB_SERVER_KEYS[0]) ?? ctx.get?.(WEB_SERVER_KEYS[1]);
    if (webServer === undefined || webServer === null) return;
    try {
      routeDisposer = ctx.effect(
        () =>
          webServer.register({
            kind: 'prefix',
            path: ROUTE_PREFIX,
            handler: (req, res) => handleRequest(req, res, deps),
          }),
        'ding-wall: HTTP API',
      );
      registered = true;
      ctx.logger?.info?.(`ding-wall: API mounted at ${ROUTE_PREFIX} (${cfg.mode} mode)`);
    } catch (error) {
      ctx.logger?.warn?.(`ding-wall: failed to mount HTTP API: ${String(error?.message ?? error)}`);
    }
  };

  mount();
  if (!registered) {
    ctx.on?.('internal/service', (serviceName) => {
      if (WEB_SERVER_KEYS.includes(serviceName)) mount();
    });
  }

  if (cfg.mode === 'local') {
    ctx.effect?.(
      () => () => {
        try {
          deps.hub.close();
        } catch {
          /* 已关闭 */
        }
        return deps.store.close?.();
      },
      'ding-wall: local store flush',
    );
  }

  return { config: cfg, mounted: () => registered, dispose: () => routeDisposer?.() };
}
