/**
 * 钉一钉 · 三个人的墙 —— 插件配置。
 *
 * - serverUrl 为空：本地模式，数据存在本机 `$DSH_HOME/ding-wall/wall.json`；
 * - serverUrl 有值：共享模式，面板通过宿主代理请求该「墙服务」（团队墙），
 *   三个人各自安装插件、填同一个地址，就连到同一面墙。
 */
import * as os from 'node:os';
import * as path from 'node:path';

/** 插件 HTTP 前缀（宿主 Web 服务上的挂载点）。 */
export const ROUTE_PREFIX = '/api/ding-wall';
/** Web 服务器服务键，新的在前（与 harness 其它插件保持一致）。 */
export const WEB_SERVER_KEYS = ['webServer', 'httpServer'];
/** 支持的 API 一级路径，避免把任意路径转发进内部路由。 */
export const API_SEGMENTS = new Set([
  'health',
  'state',
  'members',
  'ideas',
  'todos',
  'opinions',
  'demo',
  'events',
]);

export const DEFAULTS = {
  serverUrl: '',
  serverToken: '',
  serverCa: '',
  stateDir: '',
  timeoutMs: 15_000,
};

/** `$DSH_HOME`，回退 `~/.dsh`（与 Desktop 的行为一致）。 */
export function dshHome() {
  const fromEnv = process.env.DSH_HOME;
  if (typeof fromEnv === 'string' && fromEnv.trim() !== '') return fromEnv;
  return path.join(os.homedir(), '.dsh');
}

/** 把 profile 行的 config 补全成运行时配置。 */
export function resolveConfig(config) {
  const rawUrl = typeof config?.serverUrl === 'string' ? config.serverUrl.trim() : '';
  const serverUrl = rawUrl.replace(/\/+$/, '');
  const stateDir =
    typeof config?.stateDir === 'string' && config.stateDir.trim() !== ''
      ? config.stateDir.trim()
      : path.join(dshHome(), 'ding-wall');
  const timeoutMs =
    Number.isFinite(config?.timeoutMs) && config.timeoutMs >= 500 ? config.timeoutMs : DEFAULTS.timeoutMs;
  const serverToken = typeof config?.serverToken === 'string' ? config.serverToken.trim() : '';
  const serverCa = typeof config?.serverCa === 'string' ? config.serverCa.trim() : '';
  return {
    serverUrl,
    serverToken,
    serverCa,
    stateDir,
    timeoutMs,
    mode: serverUrl === '' ? 'local' : 'shared',
  };
}
