/**
 * 浏览器信任闸门。
 *
 * `webServer.register` 注册的裸路由不会自动继承 Connection 服务的
 * 「Host/Origin 围栏」，所以每个请求都要主动问一次；undefined 表示放行。
 */
export function evaluateGate(connection, req, res) {
  if (connection === undefined || connection === null) return undefined;
  if (typeof connection.requestRejection !== 'function') return undefined;
  const outcome = connection.requestRejection(req, res);
  if (outcome === undefined || outcome === null || outcome === false) return undefined;
  return typeof outcome === 'number' ? outcome : 403;
}
