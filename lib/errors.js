/**
 * 统一的 API 错误类型。
 * HTTP 层把所有 ApiError 转成 `{"error":{"code","message"}}`，其余抛出 500。
 */
export class ApiError extends Error {
  /**
   * @param {number} status HTTP 状态码
   * @param {string} code 机器可读的错误码
   * @param {string} message 面向用户的中文错误信息
   * @param {{ allow?: string[] }} [meta]
   */
  constructor(status, code, message, meta = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    if (meta.allow) this.allow = meta.allow;
  }
}

/** 400：参数缺失 / 类型错误 / 超长 / 非法 JSON。 */
export function badRequest(code, message) {
  return new ApiError(400, code, message);
}

/** 404：资源不存在。 */
export function notFound(message = '没有找到这条内容') {
  return new ApiError(404, 'not_found', message);
}

/** 405：路径存在但方法不对。 */
export function methodNotAllowed(allow = []) {
  return new ApiError(405, 'method_not_allowed', '这个地址不支持该请求方法', { allow });
}

/** 413：请求体超过上限。 */
export function payloadTooLarge(message = '请求体超过 64KB 上限') {
  return new ApiError(413, 'payload_too_large', message);
}
