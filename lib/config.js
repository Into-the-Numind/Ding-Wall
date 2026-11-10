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

/**
 * 默认团队墙地址与它对应的自签 CA（CA 是公开证书，可以随仓库分发；
 * 团队访问码绝不会写进仓库，首次连接时由用户在面板里输入并仅存在本机）。
 */
export const TEAM_SERVER_URL = 'https://139.155.129.13';
export const TEAM_SERVER_CA = `-----BEGIN CERTIFICATE-----
MIIDGTCCAgGgAwIBAgIURoIi/kk/bFTmTkQMuACrv17yEgAwDQYJKoZIhvcNAQEL
BQAwHDEaMBgGA1UEAwwRRGluZyBXYWxsIFRlYW0gQ0EwHhcNMjYxMTA3MTAyNDI2
WhcNMzYxMTA0MTAyNDI2WjAcMRowGAYDVQQDDBFEaW5nIFdhbGwgVGVhbSBDQTCC
ASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAMx8IWyb9bfuGeqPbiqMmiPJ
QoDmwPVXayMIFYyassA1Cr7RwP6R6M/LnthECLbiSXK6d8yxJ3NUKNahxfNR+W+1
ojVjyVWnx+jHKGIrJQMQAKXcYcPuDW4Eu15W2tH7YlNevVZC9pkLT9G8b++Qio8g
SlqyY8VXKKV5Rwa2vvckw3seIZjds+B+3gKtxm2jKj23hybOonGNdKMcu8IK1PC3
8jgQ8Yoyq1K1eecRJY4ZP1CzG9gAs5Zmggq18pWMy0+JU3Jh46NugpV1tWkxx1ry
Sldx1H3QL4QvV3nqV5ZU6Gl1IAPpOqPkrc6sM+PqXGtqXEAOAD29SSqAUuEPLr8C
AwEAAaNTMFEwHQYDVR0OBBYEFCPKp15exxFzfuZrZvQeQGHPM1qyMB8GA1UdIwQY
MBaAFCPKp15exxFzfuZrZvQeQGHPM1qyMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZI
hvcNAQELBQADggEBAEqkY94dMlExb8lDlpaDZFYA9TXpvUixwThMGV+48t9dEpnN
3+a/0Nw4j1lvc+csGQ5JfXkVDe8GGLZcfXq/CVi+W7hFQeipVHCTQbaRWNQPsvPF
ZaWCOr0m1fqrqEh0j84cLAFT5sQzu9QtFH8Y0G0ufrDVK8foCU0sSoN0thfNGV9U
mnJBn6YEkVMrHdqzOLZiK2OeMcu3kXnf3E59BMRLeWzlMreye3mcql1HEfKtAouI
Bp2wQZ4nVw4gQOCLQbF6y4SbINCrRHFKaqGfHHCPmaTLuHQ4zZUdwCuAWf5arOhj
qIjGpN0vXepSwstLlkmkytCsK6RP0MILRBFr51Q=
-----END CERTIFICATE-----`;
export const CONNECTION_FILE_NAME = 'connection.json';

export const DEFAULTS = {
  serverUrl: '',
  serverToken: '',
  serverCa: '',
  stateDir: '',
  timeoutMs: 15_000,
};

/** 共享模式的本地连接状态文件（访问码只存在这里，权限 600）。 */
export function connectionFile(stateDir) {
  return path.join(stateDir, CONNECTION_FILE_NAME);
}

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
  const configuredCa = typeof config?.serverCa === 'string' ? config.serverCa.trim() : '';
  // 只有指向官方团队墙时才使用随包内置的公开 CA；连接其它自建服务需显式配置 serverCa。
  const serverCa = configuredCa || (serverUrl === TEAM_SERVER_URL ? TEAM_SERVER_CA : '');
  return {
    serverUrl,
    serverToken,
    serverCa,
    stateDir,
    timeoutMs,
    mode: serverUrl === '' ? 'local' : 'shared',
  };
}
