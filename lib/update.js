/**
 * 插件内更新：对比 GitHub main 上的版本，并用 git 把本地 checkout 快进到最新。
 *
 * - 更新检查只读取公开的 package.json，不发送任何用户数据；
 * - 真正更新只接受当前插件的 GitHub 仓库，不允许任意 URL；
 * - 只在插件目录是干净 git 仓库且分支为 main 时自动更新；否则返回手动更新提示；
 * - 客户端 bundle 变更后刷新即可，宿主代码/清单变化则要求完整重启 Harness。
 */
import { execFile } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const CACHE_TTL_MS = 10 * 60 * 1000;
const FAILURE_CACHE_TTL_MS = 2 * 60 * 1000;

export const DEFAULT_UPDATE_FEED_URL = 'https://raw.githubusercontent.com/Into-the-Numind/Ding-Wall/main/package.json';
export const DEFAULT_REPO_URL = 'https://github.com/Into-the-Numind/Ding-Wall';

function versionParts(value) {
  return String(value || '')
    .trim()
    .replace(/^v/i, '')
    .split('-')[0]
    .split('.')
    .map((part) => Number.parseInt(part, 10) || 0);
}

/** 比较两个 semver 版本；仅用于判断“是否有更新”。 */
export function compareVersions(a, b) {
  const left = versionParts(a);
  const right = versionParts(b);
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const l = left[index] || 0;
    const r = right[index] || 0;
    if (l !== r) return l > r ? 1 : -1;
  }
  const leftPre = String(a).includes('-');
  const rightPre = String(b).includes('-');
  if (leftPre !== rightPre) return leftPre ? -1 : 1;
  return 0;
}

function readVersion(packageRoot, fallback) {
  try {
    const parsed = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
    return typeof parsed.version === 'string' && parsed.version.trim() !== '' ? parsed.version.trim() : fallback;
  } catch {
    return fallback;
  }
}

function runGit(packageRoot, args, timeoutMs) {
  return execFileAsync('git', ['-C', packageRoot, ...args], {
    timeout: timeoutMs,
    maxBuffer: 4 * 1024 * 1024,
    windowsHide: true,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  }).then((result) => String(result.stdout || '').trim());
}

function changedFilesRequireRestart(files, packageJsonDiff) {
  return files.some((file) => {
    if (file === 'client.js') return false;
    if (/^(screenshots|test|docs)\//.test(file)) return false;
    if (/^README(\.|$)/.test(file) || file === 'LICENSE') return false;
    if (file === 'package-lock.json') return false;
    if (/^locale\//.test(file)) return false;
    if (file === 'package.json') return packageJsonDiff.some((line) => !/^[+-]\s*"version"\s*:/.test(line));
    return true;
  });
}

/**
 * @param {{ packageRoot: string, fallbackVersion: string, feedUrl?: string, repoUrl?: string, timeoutMs?: number }} options
 */
export function createUpdater({ packageRoot, fallbackVersion, feedUrl = DEFAULT_UPDATE_FEED_URL, repoUrl = DEFAULT_REPO_URL, timeoutMs = 8000 }) {
  const feed = String(feedUrl || '').trim() || DEFAULT_UPDATE_FEED_URL;
  const repo = String(repoUrl || '').trim().replace(/\/+$/, '') || DEFAULT_REPO_URL;
  const releaseUrl = `${repo}/releases/latest`;
  let cached = null;
  let cachedAt = 0;
  let updating = false;

  async function check() {
    if (cached && Date.now() - cachedAt < (cached.error ? FAILURE_CACHE_TTL_MS : CACHE_TTL_MS)) return cached;
    const currentVersion = readVersion(packageRoot, fallbackVersion);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let result;
    try {
      const response = await fetch(feed, {
        headers: { accept: 'application/json' },
        signal: controller.signal,
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const remote = await response.json();
      const latestVersion = typeof remote?.version === 'string' ? remote.version.trim() : '';
      if (!latestVersion) throw new Error('missing version');
      result = {
        currentVersion,
        latestVersion,
        updateAvailable: compareVersions(latestVersion, currentVersion) > 0,
        releaseUrl,
        checkedAt: new Date().toISOString(),
      };
    } catch (error) {
      result = {
        currentVersion,
        latestVersion: '',
        updateAvailable: false,
        releaseUrl,
        error: error?.name === 'AbortError' ? 'timeout' : 'network',
        checkedAt: new Date().toISOString(),
      };
    } finally {
      clearTimeout(timer);
    }
    cached = result;
    cachedAt = Date.now();
    return result;
  }

  async function update() {
    if (updating) return { ok: false, code: 'busy', message: '正在更新中，请稍候', releaseUrl };
    updating = true;
    try {
      const info = await check();
      if (!info.updateAvailable) {
        return { ok: true, updated: false, ...info };
      }
      const gitDirectory = path.join(packageRoot, '.git');
      if (!fs.existsSync(gitDirectory)) {
        return {
          ok: false,
          code: 'manual_required',
          message: '当前插件不是 git 安装，无法自动更新；请到 GitHub Releases 下载最新版。',
          releaseUrl,
        };
      }
      let status;
      try {
        status = await runGit(packageRoot, ['status', '--porcelain'], 15000);
      } catch (error) {
        return { ok: false, code: 'git_unavailable', message: `本机无法运行 git：${error?.message || error}`, releaseUrl };
      }
      if (status !== '') {
        return { ok: false, code: 'dirty', message: '插件目录有本地修改，无法自动更新；请先还原改动。', releaseUrl };
      }
      const branch = await runGit(packageRoot, ['rev-parse', '--abbrev-ref', 'HEAD'], 10000);
      if (branch !== 'main') {
        return { ok: false, code: 'not_main', message: `当前分支是 ${branch || '未知'}，请切回 main 后再更新。`, releaseUrl };
      }
      const from = await runGit(packageRoot, ['rev-parse', 'HEAD'], 10000);
      try {
        await runGit(packageRoot, ['fetch', '--prune', 'origin', 'main'], 45000);
      } catch (error) {
        return { ok: false, code: 'network', message: `从 GitHub 拉取更新失败：${error?.message || error}`, releaseUrl };
      }
      const target = await runGit(packageRoot, ['rev-parse', 'FETCH_HEAD'], 10000);
      if (target === from) {
        return { ok: true, updated: false, ...info };
      }
      const files = (await runGit(packageRoot, ['diff', '--name-only', from, target], 10000)).split('\n').filter(Boolean);
      let packageJsonDiff = [];
      if (files.includes('package.json')) {
        const diff = await runGit(packageRoot, ['diff', '-U0', from, target, '--', 'package.json'], 10000);
        packageJsonDiff = diff.split('\n').filter((line) => /^[+-][^+-]/.test(line));
      }
      try {
        await runGit(packageRoot, ['merge', '--ff-only', 'FETCH_HEAD'], 30000);
      } catch (error) {
        return { ok: false, code: 'merge_failed', message: `合并更新失败：${error?.message || error}`, releaseUrl };
      }
      const toVersion = readVersion(packageRoot, fallbackVersion);
      const restartRequired = changedFilesRequireRestart(files, packageJsonDiff);
      cached = null;
      cachedAt = 0;
      return {
        ok: true,
        updated: true,
        from: info.currentVersion,
        to: toVersion,
        restartRequired,
        releaseUrl,
        filesChanged: files.slice(0, 30),
      };
    } finally {
      updating = false;
    }
  }

  return { check, update, currentVersion: () => readVersion(packageRoot, fallbackVersion) };
}
