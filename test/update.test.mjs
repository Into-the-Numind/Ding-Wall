import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { compareVersions, createUpdater } from '../lib/update.js';

const execFileAsync = promisify(execFile);

async function git(cwd, args) {
  return (await execFileAsync('git', ['-C', cwd, ...args], { env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } })).stdout.trim();
}

async function writeFiles(root, files) {
  for (const [name, content] of Object.entries(files)) {
    const file = path.join(root, name);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, content, 'utf8');
  }
}

async function commitAll(root, message) {
  await git(root, ['add', '-A']);
  await git(root, ['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-m', message]);
}

function listen(handler) {
  return new Promise((resolve) => {
    const server = http.createServer(handler);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

test('compareVersions：语义化比较与预发布排序', () => {
  assert.equal(compareVersions('0.2.4', '0.2.3'), 1);
  assert.equal(compareVersions('0.2.3', '0.2.3'), 0);
  assert.equal(compareVersions('0.2.3', '0.2.4'), -1);
  assert.equal(compareVersions('v1.0.0', '0.9.9'), 1);
  assert.equal(compareVersions('0.3.0-beta.1', '0.3.0'), -1);
});

test('更新检查：读取 feed 中的新版本，非 git 安装拒绝自动更新', async () => {
  const feed = await listen((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ version: '9.9.9' }));
  });
  const port = feed.address().port;
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ding-wall-update-'));
  await fs.writeFile(path.join(dataDir, 'package.json'), JSON.stringify({ name: 'dsh-ding-wall', version: '0.2.3' }), 'utf8');
  const updater = createUpdater({
    packageRoot: dataDir,
    fallbackVersion: '0.0.0',
    feedUrl: `http://127.0.0.1:${port}/package.json`,
    repoUrl: 'https://example.invalid/repo',
    timeoutMs: 2000,
  });
  try {
    const info = await updater.check();
    assert.equal(info.currentVersion, '0.2.3');
    assert.equal(info.latestVersion, '9.9.9');
    assert.equal(info.updateAvailable, true);

    const result = await updater.update();
    assert.equal(result.ok, false);
    assert.equal(result.code, 'manual_required');
    assert.match(result.releaseUrl, /releases\/latest$/);
  } finally {
    await new Promise((resolve) => feed.close(resolve));
    await fs.rm(dataDir, { recursive: true, force: true });
  }
});

test('更新执行：git 安装可以快进到新版本，client-only 变更无需重启', async (t) => {
  try {
    await execFileAsync('git', ['--version']);
  } catch {
    t.skip('本机没有 git');
    return;
  }
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'ding-wall-git-update-'));
  const origin = path.join(tmp, 'origin.git');
  const work = path.join(tmp, 'work');
  const publisher = path.join(tmp, 'publisher');
  const feed = await listen((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ version: '0.2.4' }));
  });
  try {
    await execFileAsync('git', ['init', '--bare', origin]);
    await execFileAsync('git', ['clone', origin, work]);
    await git(work, ['checkout', '-b', 'main']);
    await writeFiles(work, {
      'package.json': JSON.stringify({ name: 'dsh-ding-wall', version: '0.2.3' }, null, 2),
      'client.js': '// old client\n',
      'README.md': '# old\n',
    });
    await commitAll(work, 'v0.2.3');
    await git(work, ['push', '-u', 'origin', 'main']);

    await execFileAsync('git', ['clone', origin, publisher]);
    await git(publisher, ['checkout', 'main']);
    await writeFiles(publisher, {
      'package.json': JSON.stringify({ name: 'dsh-ding-wall', version: '0.2.4' }, null, 2),
      'client.js': '// new client\n',
      'README.md': '# new\n',
    });
    await commitAll(publisher, 'v0.2.4');
    await git(publisher, ['push', 'origin', 'main']);

    const updater = createUpdater({
      packageRoot: work,
      fallbackVersion: '0.0.0',
      feedUrl: `http://127.0.0.1:${feed.address().port}/package.json`,
      repoUrl: 'https://example.invalid/repo',
      timeoutMs: 2000,
    });
    const result = await updater.update();
    assert.equal(result.ok, true);
    assert.equal(result.updated, true);
    assert.equal(result.to, '0.2.4');
    assert.equal(result.restartRequired, false);
    assert.equal(await fs.readFile(path.join(work, 'client.js'), 'utf8'), '// new client\n');
    assert.equal(JSON.parse(await fs.readFile(path.join(work, 'package.json'), 'utf8')).version, '0.2.4');

    // 已经是最新时不再产生提交
    const second = await updater.update();
    assert.equal(second.ok, true);
    assert.equal(second.updated, false);
  } finally {
    await new Promise((resolve) => feed.close(resolve));
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('更新检查：feed 不可达时静默返回无更新', async () => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ding-wall-update-'));
  await fs.writeFile(path.join(dataDir, 'package.json'), JSON.stringify({ version: '0.2.3' }), 'utf8');
  const updater = createUpdater({
    packageRoot: dataDir,
    fallbackVersion: '0.2.3',
    feedUrl: 'http://127.0.0.1:1/package.json',
    timeoutMs: 500,
  });
  try {
    const info = await updater.check();
    assert.equal(info.updateAvailable, false);
    assert.equal(info.error, 'network');
  } finally {
    await fs.rm(dataDir, { recursive: true, force: true });
  }
});
