/**
 * 钉一钉 · 三个人的墙 —— 宿主半侧。
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
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Store } from './store.js';
import { SseHub } from './sse.js';
import { createRequestHandler } from './api.js';
import { evaluateGate } from './gate.js';
import { createProxy, probeAccessToken } from './proxy.js';
import { API_SEGMENTS, ROUTE_PREFIX, WEB_SERVER_KEYS, connectionFile, resolveConfig } from './config.js';
import { readJsonBody, sendError, sendJson } from './http.js';

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = path.join(PACKAGE_ROOT, 'public');

/** 插件身份：与 package.json 的 name 保持一致（client bundle 也用它）。 */
export const PLUGIN_ID = 'ding-wall';
export const PLUGIN_VERSION = '0.2.0';

export const name = PLUGIN_ID;
/** 不强制依赖任何服务：Web 服务可能晚于本插件激活。 */
export const inject = [];

/** 读取上次「连接团队墙」保存的访问码（仅本机，权限 600）。 */
function readSavedToken(cfg) {
  try {
    const raw = fs.readFileSync(connectionFile(cfg.stateDir), 'utf8');
    const parsed = JSON.parse(raw);
    return typeof parsed?.serverToken === 'string' ? parsed.serverToken.trim() : '';
  } catch {
    return '';
  }
}

/** 把访问码写入本机连接状态文件；不放进 profile、不出现在浏览器里。 */
function saveToken(cfg, token) {
  fs.mkdirSync(cfg.stateDir, { recursive: true });
  const file = connectionFile(cfg.stateDir);
  const temporary = `${file}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify({ serverToken: token }, null, 2), { mode: 0o600 });
  try {
    fs.chmodSync(temporary, 0o600);
  } catch {
    /* Windows 等平台可能忽略 */
  }
  fs.renameSync(temporary, file);
}

function clearToken(cfg) {
  try {
    fs.unlinkSync(connectionFile(cfg.stateDir));
  } catch {
    /* 本来就没有 */
  }
}

function hostOf(serverUrl) {
  try {
    return new URL(serverUrl).host;
  } catch {
    return '';
  }
}

/** 建立请求依赖（本地 store/SSE hub，或共享模式代理）。 */
function createDeps(ctx, cfg) {
  const runtime = { token: cfg.serverToken || (cfg.mode === 'shared' ? readSavedToken(cfg) : '') };
  if (cfg.mode === 'shared') {
    return {
      ctx,
      cfg,
      runtime,
      // 每次请求时读取 runtime.token，连接/断开后无需重建插件。
      proxyFor: () =>
        createProxy({
          serverUrl: cfg.serverUrl,
          timeoutMs: cfg.timeoutMs,
          serverToken: runtime.token,
          serverCa: cfg.serverCa,
        }),
    };
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
  return { ctx, cfg, runtime, store, hub, handler };
}

/** 面板需要的运行信息（不含本机路径和访问码）。 */
function configView(deps) {
  const shared = deps.cfg.mode === 'shared';
  const connected = shared && deps.runtime.token !== '';
  return {
    id: PLUGIN_ID,
    version: PLUGIN_VERSION,
    mode: deps.cfg.mode,
    shared,
    secured: connected,
    connected,
    needsConnect: shared && !connected,
    serverHost: shared ? hostOf(deps.cfg.serverUrl) : '',
    tlsPinned: deps.cfg.serverCa !== '',
    apiPrefix: ROUTE_PREFIX,
  };
}

/** 处理首次连接/断开团队墙。 */
async function handleConnection(req, res, deps, action) {
  if (deps.cfg.mode !== 'shared') {
    sendError(res, 400, 'shared_only', '本机墙模式不需要连接团队服务');
    return;
  }
  if (req.method !== 'POST') {
    sendError(res, 405, 'method_not_allowed', '请使用 POST');
    return;
  }
  if (action === 'disconnect') {
    deps.runtime.token = '';
    clearToken(deps.cfg);
    sendJson(res, 200, configView(deps));
    return;
  }
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendError(res, 400, 'invalid_json', '请求格式不正确');
    return;
  }
  const code = typeof body?.code === 'string' ? body.code.trim() : '';
  if (code === '') {
    sendError(res, 400, 'invalid_access_code', '请输入团队访问码');
    return;
  }
  let probe;
  try {
    probe = await probeAccessToken({
      serverUrl: deps.cfg.serverUrl,
      serverToken: code,
      serverCa: deps.cfg.serverCa,
      timeoutMs: deps.cfg.timeoutMs,
    });
  } catch (error) {
    const codeName = error?.code ?? '';
    if (codeName === 'ETIMEDOUT') {
      sendError(res, 504, 'upstream_timeout', `共享墙服务响应超时：${hostOf(deps.cfg.serverUrl)}`);
    } else if (['DEPTH_ZERO_SELF_SIGNED_CERT', 'SELF_SIGNED_CERT_IN_CHAIN', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'ERR_TLS_CERT_ALTNAME_INVALID'].includes(codeName)) {
      sendError(res, 502, 'upstream_tls_error', '共享墙的 HTTPS 证书校验失败，请更新插件或检查 serverCa');
    } else {
      sendError(res, 502, 'upstream_unavailable', `连不上共享墙服务（${hostOf(deps.cfg.serverUrl)}），检查网络后再试`);
    }
    return;
  }
  if (probe.status === 401 || probe.status === 403) {
    sendError(res, 401, 'invalid_access_code', '访问码不对，请向团队管理员确认');
    return;
  }
  if (probe.status !== 200) {
    sendError(res, 502, 'upstream_bad_response', `共享墙服务暂时不可用（HTTP ${probe.status}）`);
    return;
  }
  try {
    saveToken(deps.cfg, code);
  } catch (error) {
    deps.ctx.logger?.warn?.(`ding-wall: failed to save connection token: ${String(error?.message ?? error)}`);
    sendError(res, 500, 'connection_save_failed', '访问码校验通过，但本机保存失败');
    return;
  }
  deps.runtime.token = code;
  sendJson(res, 200, configView(deps));
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
    if (relative === '/connect') {
      await handleConnection(req, res, deps, 'connect');
      return;
    }
    if (relative === '/disconnect') {
      await handleConnection(req, res, deps, 'disconnect');
      return;
    }

    const first = relative.split('/').filter(Boolean)[0];
    if (!first || !API_SEGMENTS.has(first)) {
      sendError(res, 404, 'not_found', `unknown route: ${url.pathname}`);
      return;
    }

    if (deps.cfg.mode === 'shared') {
      if (deps.runtime.token === '') {
        sendError(res, 401, 'connect_required', '先连接团队墙：请输入团队访问码');
        return;
      }
      await deps.proxyFor()(req, res, relative, url.search);
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
 * @param {{ serverUrl?: string, serverToken?: string, serverCa?: string, stateDir?: string, timeoutMs?: number }} [config]
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
