/**
 * 静态文件服务：静态根 = public/。
 *
 * - 只支持 GET / HEAD，其他方法 405；
 * - `index.html` 兜底：目录 -> index.html；无扩展名且文件不存在 -> index.html（SPA 回退）；
 * - 防目录穿越：解码后含 `..` 段、或解析结果不在静态根内 -> 403；
 * - 正确 Content-Type，静态资源 `Cache-Control: no-cache`。
 */
import fs from 'node:fs';
import path from 'node:path';
import { sendError } from './http.js';

const MIME_TYPES = Object.freeze({
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.avif': 'image/avif',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
});

function contentTypeFor(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
}

function isInside(root, target) {
  return target === root || target.startsWith(root + path.sep);
}

async function statOrNull(filePath) {
  try {
    return await fs.promises.stat(filePath);
  } catch {
    return null;
  }
}

/**
 * @param {{ publicDir: string }} options
 * @returns {(req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse, url: URL) => Promise<void>}
 */
export function createStaticHandler({ publicDir }) {
  const root = path.resolve(publicDir);

  return async function handleStatic(req, res, url) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      sendError(res, 405, 'method_not_allowed', '静态资源只支持 GET / HEAD', { Allow: 'GET, HEAD' });
      return;
    }

    let pathname;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      sendError(res, 400, 'invalid_path', '请求路径不合法');
      return;
    }
    if (pathname.includes('\0')) {
      sendError(res, 400, 'invalid_path', '请求路径不合法');
      return;
    }
    if (pathname.split('/').some((segment) => segment === '..')) {
      sendError(res, 403, 'forbidden', '禁止访问该路径');
      return;
    }

    const relativePath = pathname.replace(/^\/+/, '');
    let filePath = path.resolve(root, relativePath);
    if (!isInside(root, filePath)) {
      sendError(res, 403, 'forbidden', '禁止访问该路径');
      return;
    }

    let stat = await statOrNull(filePath);
    if (stat && stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
      stat = await statOrNull(filePath);
    } else if (!stat && !path.extname(relativePath)) {
      // SPA 兜底：无扩展名的未知路径回退到 index.html。
      filePath = path.join(root, 'index.html');
      stat = await statOrNull(filePath);
    }

    if (!isInside(root, filePath) || !stat || !stat.isFile()) {
      sendError(res, 404, 'not_found', '页面不存在');
      return;
    }

    const headers = {
      'Content-Type': contentTypeFor(filePath),
      'Content-Length': String(stat.size),
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    };

    if (req.method === 'HEAD') {
      res.writeHead(200, headers);
      res.end();
      return;
    }

    const stream = fs.createReadStream(filePath);
    stream.once('error', () => {
      if (!res.headersSent) {
        sendError(res, 500, 'internal_error', '静态资源读取失败');
      } else {
        res.destroy();
      }
    });
    stream.once('open', () => {
      res.writeHead(200, headers);
      stream.pipe(res);
    });
  };
}
