import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { apply } from '../lib/index.js';
import { TEAM_SERVER_CA, TEAM_SERVER_URL, resolveConfig } from '../lib/config.js';

const PREFIX = '/api/ding-wall';

/** 收集插件注册的 webServer 路由，并用真实 http.Server 驱动它。 */
function mountPlugin(config, { connection } = {}) {
  const routes = [];
  const effects = [];
  const webServer = {
    register(route) {
      routes.push(route);
      return () => {
        route.disposed = true;
      };
    },
  };
  const registry = new Map([['webServer', webServer]]);
  if (connection !== undefined) registry.set('connection', connection);
  const ctx = {
    logger: { info() {}, warn() {}, error() {} },
    get(name) {
      return registry.get(name);
    },
    effect(factory) {
      const disposer = factory();
      effects.push(disposer);
      return typeof disposer === 'function' ? disposer : () => {};
    },
    on() {
      return () => {};
    },
    inject(_services, callback) {
      callback(ctx);
    },
  };
  const dispose = apply(ctx, config);
  const route = routes[0];
  return {
    route,
    routes,
    async close() {
      for (const effect of effects.reverse()) {
        if (typeof effect === 'function') await effect();
      }
      dispose.dispose?.();
    },
  };
}

async function listen(handler) {
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return { server, base: `http://127.0.0.1:${port}` };
}

async function closeServer(server) {
  await new Promise((resolve) => {
    server.close(() => resolve());
    if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
  });
}

async function withLocalPlugin(name, run) {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ding-wall-plugin-'));
  const plugin = mountPlugin({ stateDir: dataDir });
  const { server, base } = await listen((req, res) => plugin.route.handler(req, res));
  try {
    await run({ base, dataDir });
  } finally {
    await closeServer(server);
    await plugin.close();
    await fs.rm(dataDir, { recursive: true, force: true });
  }
}

function json(base, pathname, { method = 'GET', body, headers } = {}) {
  return fetch(`${base}${pathname}`, {
    method,
    headers: { accept: 'application/json', ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

test('config：默认团队墙自动使用随包内置的公开 CA', () => {
  const cfg = resolveConfig({ serverUrl: TEAM_SERVER_URL });
  assert.equal(cfg.mode, 'shared');
  assert.equal(cfg.serverCa, TEAM_SERVER_CA);
  assert.match(cfg.serverCa, /BEGIN CERTIFICATE/);

  const local = resolveConfig({ serverUrl: '' });
  assert.equal(local.mode, 'local');
  assert.equal(local.serverCa, '');
});

test('config：本地模式声明、不暴露本机路径', async () => {
  await withLocalPlugin('config', async ({ base }) => {
    const response = await json(base, `${PREFIX}/config`);
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.mode, 'local');
    assert.equal(payload.shared, false);
    assert.equal(payload.apiPrefix, PREFIX);
    assert.equal(typeof payload.version, 'string');
  });
});

test('state：空墙结构完整、禁止缓存', async () => {
  await withLocalPlugin('state', async ({ base }) => {
    const response = await json(base, `${PREFIX}/state`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const state = await response.json();
    assert.deepEqual(state.members, []);
    assert.deepEqual(state.ideas, []);
    assert.deepEqual(state.todos, []);
    assert.deepEqual(state.opinions, []);
    assert.ok(state.server && typeof state.server.now === 'string');
  });
});

test('本地模式：成员、想法、待办、匿名意见完整走一遍', async () => {
  await withLocalPlugin('flow', async ({ base }) => {
    const membersResponse = await json(base, `${PREFIX}/members`, { method: 'POST', body: { name: '大川', emoji: '🦊' } });
    assert.equal(membersResponse.status, 200);
    const { member } = await membersResponse.json();
    assert.equal(member.name, '大川');
    assert.equal(typeof member.color, 'string');

    const headers = { 'x-member-id': member.id, 'x-client-id': 'test-client' };
    const ideaResponse = await json(base, `${PREFIX}/ideas`, { method: 'POST', body: { text: '做成一面墙' }, headers });
    assert.equal(ideaResponse.status, 200);
    const { idea } = await ideaResponse.json();
    assert.equal(idea.text, '做成一面墙');

    const todoResponse = await json(base, `${PREFIX}/todos`, { method: 'POST', body: { text: '验证插件面板' }, headers });
    const { todo } = await todoResponse.json();
    const doneResponse = await json(base, `${PREFIX}/todos/${todo.id}`, { method: 'PATCH', body: { status: 'done' }, headers });
    const donePayload = await doneResponse.json();
    assert.equal(donePayload.todo.status, 'done');
    assert.ok(donePayload.todo.completedAt);

    const opinionResponse = await json(base, `${PREFIX}/opinions`, { method: 'POST', body: { text: '匿名测试', mood: 'suggest' } });
    assert.equal(opinionResponse.status, 200);
    const { opinion } = await opinionResponse.json();
    assert.deepEqual(Object.keys(opinion).sort(), ['createdAt', 'id', 'mood', 'reactions', 'text']);
    assert.equal(opinion.authorId, undefined);

    const stateResponse = await json(base, `${PREFIX}/state`);
    const state = await stateResponse.json();
    assert.equal(state.members.length, 1);
    assert.equal(state.ideas.length, 1);
    assert.equal(state.todos.length, 1);
    assert.equal(state.opinions.length, 1);
    assert.equal(state.opinions[0].authorId, undefined);

    const reactionResponse = await json(base, `${PREFIX}/ideas/${idea.id}/react`, { method: 'POST', body: { kind: 'spark' }, headers });
    const reactionPayload = await reactionResponse.json();
    assert.equal(reactionPayload.idea.reactions.spark.count, 1);

    // 匿名信删除：不需要作者信息，但需要成员身份
    const noMemberDelete = await json(base, `${PREFIX}/opinions/${opinion.id}`, { method: 'DELETE' });
    assert.equal(noMemberDelete.status, 400);
    const deleteResponse = await json(base, `${PREFIX}/opinions/${opinion.id}`, { method: 'DELETE', headers });
    assert.equal(deleteResponse.status, 200);
    assert.equal((await deleteResponse.json()).ok, true);
    const afterDelete = await (await json(base, `${PREFIX}/state`)).json();
    assert.equal(afterDelete.opinions.length, 0);
  });
});

test('本地模式：SSE 首帧 hello + presence', async () => {
  await withLocalPlugin('sse', async ({ base }) => {
    const membersResponse = await json(base, `${PREFIX}/members`, { method: 'POST', body: { name: '阿岚', emoji: '🦉' } });
    const { member } = await membersResponse.json();
    const controller = new AbortController();
    const response = await fetch(`${base}${PREFIX}/events?memberId=${member.id}`, { signal: controller.signal, headers: { accept: 'text/event-stream' } });
    assert.equal(response.status, 200);
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let text = '';
    const deadline = Date.now() + 3000;
    while (!text.includes('event: hello') && Date.now() < deadline) {
      const { value, done } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
    }
    controller.abort();
    assert.match(text, /event: hello/);
    assert.match(text, /"online"/);
  });
});

test('本地模式：示例数据可贴可撕，写完落盘', async () => {
  await withLocalPlugin('demo', async ({ base, dataDir }) => {
    const seeded = await json(base, `${PREFIX}/demo/seed`, { method: 'POST' });
    assert.equal(seeded.status, 200);
    const seededPayload = await seeded.json();
    assert.equal(seededPayload.seeded, true);

    const state = await (await json(base, `${PREFIX}/state`)).json();
    assert.ok(state.ideas.length >= 4);
    assert.ok(state.ideas.every((item) => item.demo === true));
    const file = path.join(dataDir, 'wall.json');
    await new Promise((resolve) => setTimeout(resolve, 350));
    const raw = await fs.readFile(file, 'utf8');
    const persisted = JSON.parse(raw);
    assert.ok(persisted.opinions.every((item) => item.authorId === undefined));
    assert.ok(persisted.ideas.length >= 4);

    const cleared = await json(base, `${PREFIX}/demo`, { method: 'DELETE' });
    assert.equal(cleared.status, 200);
    const after = await (await json(base, `${PREFIX}/state`)).json();
    assert.equal(after.ideas.filter((item) => item.demo).length, 0);
  });
});

test('未知路由 404，信任闸门拒绝时 403', async () => {
  await withLocalPlugin('gate', async ({ base }) => {
    const missing = await json(base, `${PREFIX}/nope`);
    assert.equal(missing.status, 404);
    const payload = await missing.json();
    assert.equal(payload.error.code, 'not_found');
  });

  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ding-wall-gate-'));
  const plugin = mountPlugin(
    { stateDir: dataDir },
    {
      connection: {
        requestRejection() {
          return 403;
        },
      },
    },
  );
  const { server, base } = await listen((req, res) => plugin.route.handler(req, res));
  try {
    const response = await json(base, `${PREFIX}/state`);
    assert.equal(response.status, 403);
    const payload = await response.json();
    assert.equal(payload.error.code, 'forbidden');
  } finally {
    await closeServer(server);
    await plugin.close();
    await fs.rm(dataDir, { recursive: true, force: true });
  }
});

test('共享模式：把请求与方法/请求体/SSE 原样代理到墙服务', async () => {
  const hits = [];
  const upstream = http.createServer((req, res) => {
    hits.push({ method: req.method, url: req.url, member: req.headers['x-member-id'], auth: req.headers.authorization });
    if (req.url.startsWith('/api/events')) {
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' });
      res.write('event: hello\ndata: {"ok":true,"online":[]}\n\n');
      return;
    }
    if (req.url === '/api/members' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ member: { id: 'm-1', name: JSON.parse(body).name, emoji: '🦊', color: '#fff' } }));
      });
      return;
    }
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, url: req.url, method: req.method }));
  });
  await new Promise((resolve) => upstream.listen(0, '127.0.0.1', resolve));
  const upstreamBase = `http://127.0.0.1:${upstream.address().port}`;

  const plugin = mountPlugin({ serverUrl: upstreamBase, serverToken: 'team-code-123' });
  const { server, base } = await listen((req, res) => plugin.route.handler(req, res));
  try {
    const config = await (await json(base, `${PREFIX}/config`)).json();
    assert.equal(config.mode, 'shared');
    assert.equal(config.shared, true);
    assert.equal(config.secured, true);

    const state = await (await json(base, `${PREFIX}/state`)).json();
    assert.equal(state.ok, true);
    assert.equal(state.url, '/api/state');
    assert.equal(state.method, 'GET');

    const member = await json(base, `${PREFIX}/members`, { method: 'POST', body: { name: '阿岸' } });
    assert.equal(member.status, 200);
    const memberPayload = await member.json();
    assert.equal(memberPayload.member.name, '阿岸');
    assert.ok(hits.some((hit) => hit.method === 'POST' && hit.url === '/api/members'));
    assert.ok(hits.every((hit) => hit.auth === 'Bearer team-code-123'), '已连接时应携带宿主侧访问码');

    const controller = new AbortController();
    const sse = await fetch(`${base}${PREFIX}/events`, { signal: controller.signal, headers: { accept: 'text/event-stream' } });
    assert.equal(sse.status, 200);
    assert.equal(sse.headers.get('content-type'), 'text/event-stream; charset=utf-8');
    const reader = sse.body.getReader();
    const chunk = await reader.read();
    controller.abort();
    assert.match(new TextDecoder().decode(chunk.value), /event: hello/);
  } finally {
    await closeServer(server);
    await plugin.close();
    await closeServer(upstream);
  }
});

test('共享模式：serverToken 由宿主附加到上游（含 SSE），且不从 /config 泄露', async () => {
  const hits = [];
  const upstream = http.createServer((req, res) => {
    hits.push({ url: req.url, auth: req.headers.authorization });
    if (req.url.startsWith('/api/events')) {
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' });
      res.write('event: hello\ndata: {"ok":true,"online":[]}\n\n');
      return;
    }
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  });
  await new Promise((resolve) => upstream.listen(0, '127.0.0.1', resolve));
  const upstreamBase = `http://127.0.0.1:${upstream.address().port}`;

  const plugin = mountPlugin({ serverUrl: upstreamBase, serverToken: 'team-code-123' });
  const { server, base } = await listen((req, res) => plugin.route.handler(req, res));
  try {
    const config = await (await json(base, `${PREFIX}/config`)).json();
    assert.equal(config.mode, 'shared');
    assert.equal(config.secured, true);
    assert.ok(!JSON.stringify(config).includes('team-code-123'), '/config 绝不能返回访问码');

    await json(base, `${PREFIX}/state`);
    assert.ok(hits.some((hit) => hit.url === '/api/state' && hit.auth === 'Bearer team-code-123'));

    const controller = new AbortController();
    const sse = await fetch(`${base}${PREFIX}/events`, { signal: controller.signal, headers: { accept: 'text/event-stream' } });
    assert.equal(sse.status, 200);
    const reader = sse.body.getReader();
    await reader.read();
    controller.abort();
    assert.ok(hits.some((hit) => hit.url.startsWith('/api/events') && hit.auth === 'Bearer team-code-123'));
  } finally {
    await closeServer(server);
    await plugin.close();
    await closeServer(upstream);
  }
});

test('共享模式：未连接时提示输入访问码，校验通过后保存到本机并自动恢复', async () => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ding-wall-connect-'));
  const hits = [];
  const upstream = http.createServer((req, res) => {
    hits.push({ url: req.url, auth: req.headers.authorization });
    const allowed = req.headers.authorization === 'Bearer good-code';
    res.writeHead(allowed ? 200 : 401, { 'content-type': 'application/json' });
    res.end(JSON.stringify(allowed ? { ok: true } : { error: { code: 'unauthorized' } }));
  });
  await new Promise((resolve) => upstream.listen(0, '127.0.0.1', resolve));
  const upstreamBase = `http://127.0.0.1:${upstream.address().port}`;

  const plugin = mountPlugin({ serverUrl: upstreamBase, stateDir: dataDir });
  const { server, base } = await listen((req, res) => plugin.route.handler(req, res));
  const connectionPath = path.join(dataDir, 'connection.json');
  try {
    const before = await (await json(base, `${PREFIX}/config`)).json();
    assert.equal(before.shared, true);
    assert.equal(before.secured, false);
    assert.equal(before.needsConnect, true);
    assert.equal(before.serverHost, new URL(upstreamBase).host);

    const blocked = await json(base, `${PREFIX}/state`);
    assert.equal(blocked.status, 401);
    assert.equal((await blocked.json()).error.code, 'connect_required');

    const wrong = await json(base, `${PREFIX}/connect`, { method: 'POST', body: { code: 'bad-code' } });
    assert.equal(wrong.status, 401);
    assert.equal((await wrong.json()).error.code, 'invalid_access_code');
    await assert.rejects(fs.stat(connectionPath));

    const connected = await json(base, `${PREFIX}/connect`, { method: 'POST', body: { code: 'good-code' } });
    assert.equal(connected.status, 200);
    const connectedConfig = await connected.json();
    assert.equal(connectedConfig.secured, true);
    assert.equal(connectedConfig.needsConnect, false);
    assert.ok(!JSON.stringify(connectedConfig).includes('good-code'), '/config 不能泄露访问码');

    const file = await fs.stat(connectionPath);
    assert.equal(file.mode & 0o777, 0o600, '连接状态文件必须仅本机用户可读');
    assert.equal(JSON.parse(await fs.readFile(connectionPath, 'utf8')).serverToken, 'good-code');

    const state = await json(base, `${PREFIX}/state`);
    assert.equal(state.status, 200);
    assert.ok(hits.some((hit) => hit.url === '/api/state' && hit.auth === 'Bearer good-code'));
  } finally {
    await closeServer(server);
    await plugin.close();
  }

  // 模拟重启：同一台机器、没有 profile 里的 token，也能从连接文件恢复
  const restarted = mountPlugin({ serverUrl: upstreamBase, stateDir: dataDir });
  const second = await listen((req, res) => restarted.route.handler(req, res));
  try {
    const config = await (await json(second.base, `${PREFIX}/config`)).json();
    assert.equal(config.secured, true);
    assert.equal(config.needsConnect, false);
    const state = await json(second.base, `${PREFIX}/state`);
    assert.equal(state.status, 200);

    const disconnected = await json(second.base, `${PREFIX}/disconnect`, { method: 'POST' });
    assert.equal(disconnected.status, 200);
    assert.equal((await disconnected.json()).needsConnect, true);
    await assert.rejects(fs.stat(connectionPath));
    const after = await json(second.base, `${PREFIX}/state`);
    assert.equal(after.status, 401);
    assert.equal((await after.json()).error.code, 'connect_required');
  } finally {
    await closeServer(second.server);
    await restarted.close();
    await closeServer(upstream);
    await fs.rm(dataDir, { recursive: true, force: true });
  }
});

test('共享模式：墙服务不可达时返回 502 中文提示', async () => {
  const plugin = mountPlugin({ serverUrl: 'http://127.0.0.1:9', serverToken: 'team-code-123', timeoutMs: 800 });
  const { server, base } = await listen((req, res) => plugin.route.handler(req, res));
  try {
    const response = await json(base, `${PREFIX}/state`);
    assert.equal(response.status, 502);
    const payload = await response.json();
    assert.equal(payload.error.code, 'upstream_unavailable');
    assert.match(payload.error.message, /共享墙服务/);
  } finally {
    await closeServer(server);
    await plugin.close();
  }
});
