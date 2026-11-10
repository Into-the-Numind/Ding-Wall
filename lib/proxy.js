/**
 * 共享模式：把面板的同源请求转发给「墙服务」。
 *
 * 浏览器只和 DSH 的 Web 服务说话（同源、无 CORS、无需把地址写进页面），
 * 宿主半侧负责把 `/api/ding-wall/*` 映射到 `${serverUrl}/api/*`，
 * 并逐字转发 SSE 流，让多人实时同步和本地模式行为完全一致。
 */
import https from 'node:https';
import net from 'node:net';
import { sendError } from './http.js';

const MAX_BODY_BYTES = 64 * 1024;
const FORWARD_HEADERS = ['content-type', 'accept', 'x-member-id', 'x-client-id', 'last-event-id'];

/** 读取原始请求体（有上限，避免恶意 Content-Length 撑爆内存）。 */
function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const declared = Number(req.headers['content-length'] ?? Number.NaN);
    if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
      reject(Object.assign(new Error('body too large'), { status: 413 }));
      return;
    }
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        req.resume();
        reject(Object.assign(new Error('body too large'), { status: 413 }));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', (error) => reject(Object.assign(error, { status: 400 })));
  });
}

function upstreamError(res, serverUrl, error) {
  const timeout = error?.name === 'TimeoutError' || error?.name === 'AbortError';
  sendError(
    res,
    timeout ? 504 : 502,
    timeout ? 'upstream_timeout' : 'upstream_unavailable',
    timeout
      ? `共享墙服务响应超时：${serverUrl}`
      : `共享墙服务连不上（${serverUrl}），检查一下地址和网络`,
  );
}

async function proxyEvents(req, res, target, authHeaders) {
  const controller = new AbortController();
  const onClose = () => controller.abort();
  res.on('close', onClose);
  let upstream;
  try {
    upstream = await fetch(target, {
      method: 'GET',
      headers: { accept: 'text/event-stream', 'cache-control': 'no-cache', ...authHeaders },
      signal: controller.signal,
    });
  } catch (error) {
    res.off('close', onClose);
    upstreamError(res, target, error);
    return;
  }
  if (!upstream.ok || upstream.body === null) {
    res.off('close', onClose);
    sendError(res, 502, 'upstream_bad_response', `共享墙服务拒绝了实时连接（${upstream.status}）`);
    return;
  }
  res.writeHead(200, {
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',
    'x-accel-buffering': 'no',
    'x-content-type-options': 'nosniff',
  });
  if (typeof res.flushHeaders === 'function') res.flushHeaders();
  const reader = upstream.body.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!res.write(Buffer.from(value))) {
        await new Promise((resolve) => res.once('drain', resolve));
      }
    }
  } catch {
    /* 客户端断开或上游结束：都按正常收尾 */
  } finally {
    res.off('close', onClose);
    controller.abort();
    try {
      res.end();
    } catch {
      /* 已关闭 */
    }
  }
}

/**
 * 用 Node 的 https 模块请求上游，并显式信任部署时使用的自签 CA。
 * （公网只给 IP、没有备案域名时，80/443 上的 ACME 域名证书会被云厂商拦截，
 *   所以部署改用「IP + 自签 CA」；CA 只能由插件宿主侧配置，浏览器端仍会提示证书预警。）
 */
function requestUpstream(url, { method = 'GET', headers = {}, body, ca, timeoutMs }) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const request = https.request(
      {
        hostname: target.hostname,
        port: target.port || 443,
        path: `${target.pathname}${target.search}`,
        method,
        headers,
        ca,
        rejectUnauthorized: true,
        // SNI 只对域名有意义；对 IP 地址设置 servername 会被 Node 警告并忽略。
        ...(net.isIP(target.hostname) === 0 ? { servername: target.hostname } : {}),
      },
      (response) => resolve({ response, request }),
    );
    request.setTimeout(timeoutMs, () => {
      request.destroy(Object.assign(new Error('共享墙服务响应超时'), { code: 'ETIMEDOUT' }));
    });
    request.on('error', reject);
    if (body !== undefined) request.write(body);
    request.end();
  });
}

function upstreamFailure(res, serverUrl, error) {
  const code = error?.code;
  if (code === 'ETIMEDOUT') {
    sendError(res, 504, 'upstream_timeout', `共享墙服务响应超时：${serverUrl}`);
    return;
  }
  if (code === 'DEPTH_ZERO_SELF_SIGNED_CERT' || code === 'SELF_SIGNED_CERT_IN_CHAIN' || code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || code === 'ERR_TLS_CERT_ALTNAME_INVALID') {
    sendError(res, 502, 'upstream_tls_error', '共享墙的 HTTPS 证书校验失败：请检查插件配置里的 serverCa 是否是最新的 CA 证书');
    return;
  }
  sendError(res, 502, 'upstream_unavailable', `共享墙服务连不上（${serverUrl}），检查一下地址和网络`);
}

async function proxyEventsWithCa(req, res, target, { headers, ca, timeoutMs, serverUrl }) {
  let upstream;
  try {
    upstream = await requestUpstream(target, { method: 'GET', headers, ca, timeoutMs });
  } catch (error) {
    upstreamFailure(res, serverUrl, error);
    return;
  }
  const { response, request } = upstream;
  if (response.statusCode !== 200) {
    response.resume();
    sendError(res, 502, 'upstream_bad_response', `共享墙服务拒绝了实时连接（${response.statusCode}）`);
    return;
  }
  res.writeHead(200, {
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',
    'x-accel-buffering': 'no',
    'x-content-type-options': 'nosniff',
  });
  if (typeof res.flushHeaders === 'function') res.flushHeaders();
  const onClose = () => {
    request.destroy();
    response.destroy();
  };
  res.on('close', onClose);
  response.on('data', (chunk) => {
    if (!res.write(chunk)) {
      response.pause();
      res.once('drain', () => response.resume());
    }
  });
  response.on('end', () => {
    res.off('close', onClose);
    try {
      res.end();
    } catch {
      /* 已关闭 */
    }
  });
  response.on('error', () => {
    res.off('close', onClose);
    try {
      res.end();
    } catch {
      /* 已关闭 */
    }
  });
}

async function collectUpstream(response) {
  const chunks = [];
  for await (const chunk of response) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

/**
 * @param {{ serverUrl: string, timeoutMs: number, serverToken?: string, serverCa?: string }} options
 * @returns {(req,res,relativePath,search) => Promise<void>}
 */
export function createProxy({ serverUrl, timeoutMs, serverToken = '', serverCa = '' }) {
  // 访问码只存在宿主侧，由这里附加到上游请求；浏览器/客户端永远看不到它。
  const authHeaders = serverToken === '' ? {} : { authorization: `Bearer ${serverToken}` };
  const customCa = serverCa !== '' && serverUrl.startsWith('https:') ? serverCa : '';
  return async function proxy(req, res, relativePath, search) {
    const target = `${serverUrl}/api${relativePath}${search}`;
    if (relativePath === '/events') {
      if (customCa !== '') {
        await proxyEventsWithCa(req, res, target, {
          headers: { accept: 'text/event-stream', 'cache-control': 'no-cache', ...authHeaders },
          ca: customCa,
          // 心跳 25s；socket 超时必须明显大于心跳，否则长连接会被误判为空闲断开。
          timeoutMs: Math.max(timeoutMs, 90_000),
          serverUrl,
        });
        return;
      }
      await proxyEvents(req, res, target, authHeaders);
      return;
    }
    const headers = { ...authHeaders };
    for (const name of FORWARD_HEADERS) {
      const value = req.headers[name];
      if (typeof value === 'string' && value !== '') headers[name] = value;
    }
    let body;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      try {
        body = await readRawBody(req);
      } catch (error) {
        sendError(res, error?.status === 413 ? 413 : 400, 'bad_request', '请求体读取失败或超过 64KB');
        return;
      }
    }
    if (customCa !== '') {
      let result;
      try {
        result = await requestUpstream(target, {
          method: req.method,
          headers,
          body,
          ca: customCa,
          timeoutMs,
        });
      } catch (error) {
        upstreamFailure(res, serverUrl, error);
        return;
      }
      const { response } = result;
      const buffer = await collectUpstream(response);
      const responseHeaders = {
        'cache-control': 'no-store',
        'content-length': String(buffer.length),
      };
      const responseType = response.headers['content-type'];
      if (typeof responseType === 'string') responseHeaders['content-type'] = responseType;
      const allowHeader = response.headers.allow;
      if (typeof allowHeader === 'string') responseHeaders.allow = allowHeader;
      res.writeHead(response.statusCode || 502, responseHeaders);
      res.end(buffer);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let upstream;
    try {
      upstream = await fetch(target, {
        method: req.method,
        headers,
        body,
        signal: controller.signal,
      });
    } catch (error) {
      clearTimeout(timer);
      upstreamError(res, serverUrl, error);
      return;
    }
    clearTimeout(timer);
    const buffer = Buffer.from(await upstream.arrayBuffer());
    const responseHeaders = { 'cache-control': 'no-store', 'content-length': String(buffer.length) };
    const contentType = upstream.headers.get('content-type');
    if (contentType) responseHeaders['content-type'] = contentType;
    const allow = upstream.headers.get('allow');
    if (allow) responseHeaders.allow = allow;
    res.writeHead(upstream.status, responseHeaders);
    res.end(buffer);
  };
}
