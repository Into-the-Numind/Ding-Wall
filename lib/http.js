/**
 * HTTP 小工具：JSON 响应、错误响应、64KB 上限的 JSON body 读取。
 * 所有接口响应统一 `Cache-Control: no-store`，错误统一 `{"error":{"code","message"}}`。
 */
import { badRequest, payloadTooLarge } from './errors.js';

/** body 上限 64KB（BRIEF §4.2）。 */
export const MAX_BODY_BYTES = 64 * 1024;

/**
 * 发送 JSON 响应。已在写响应（如 SSE）时安全跳过。
 * @param {import('node:http').ServerResponse} res
 * @param {number} status
 * @param {unknown} payload
 * @param {Record<string, string>} [headers]
 */
export function sendJson(res, status, payload, headers = {}) {
  if (res.headersSent || res.writableEnded) return;
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  res.end(body);
}

/**
 * 发送统一错误结构。
 * @param {import('node:http').ServerResponse} res
 * @param {number} status
 * @param {string} code
 * @param {string} message
 * @param {Record<string, string>} [headers]
 */
export function sendError(res, status, code, message, headers = {}) {
  sendJson(res, status, { error: { code, message } }, headers);
}

/** 把 ApiError 转成响应；非 ApiError 由调用方兜底成 500。 */
export function sendApiError(res, error) {
  const headers = error.allow ? { Allow: error.allow.join(', ') } : {};
  sendError(res, error.status, error.code, error.message, headers);
}

/**
 * 读取并解析 JSON 请求体。
 * - 非法 JSON / 空 body / 非对象 → 400 invalid_json
 * - 超过 64KB → 413 payload_too_large
 * - 请求中断 → 400 request_aborted
 * @param {import('node:http').IncomingMessage} req
 * @returns {Promise<Record<string, unknown>>}
 */
export function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let settled = false;

    const cleanup = () => {
      req.removeListener('data', onData);
      req.removeListener('end', onEnd);
      req.removeListener('error', onError);
      req.removeListener('aborted', onAborted);
    };
    const fail = (error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };
    const succeed = (value) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(value);
    };

    function onData(chunk) {
      if (settled) return;
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        fail(payloadTooLarge());
        // 继续把剩余数据排掉，保证 413 响应能发出去；已解绑 data 监听，数据会被丢弃。
        req.resume();
        return;
      }
      chunks.push(chunk);
    }

    function onEnd() {
      if (settled) return;
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) {
        fail(badRequest('invalid_json', '请求体不是合法的 JSON'));
        return;
      }
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        fail(badRequest('invalid_json', '请求体不是合法的 JSON'));
        return;
      }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        fail(badRequest('invalid_json', '请求体必须是 JSON 对象'));
        return;
      }
      succeed(parsed);
    }

    function onError() {
      fail(badRequest('request_aborted', '请求体读取失败'));
    }

    function onAborted() {
      fail(badRequest('request_aborted', '请求被中断'));
    }

    req.on('data', onData);
    req.on('end', onEnd);
    req.on('error', onError);
    req.on('aborted', onAborted);
  });
}
