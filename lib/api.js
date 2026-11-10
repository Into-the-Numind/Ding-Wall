/**
 * HTTP 路由：REST API（BRIEF §4.2）+ 静态文件兜底。
 *
 * 错误约定：
 * - 缺字段/类型错/超长/非法 JSON → 400
 * - :id 不存在 → 404，未知路由 → 404
 * - 方法不对 → 405（带 Allow 头）
 * - body 超过 64KB → 413
 * - 未预期异常 → 500
 *
 * 每次成功变更都会广播 SSE state-changed；匿名意见的事件恒定
 * `anonymous:true` 且 `actor:null`，绝不在任何响应/事件/文件里出现作者信息。
 */
import crypto from 'node:crypto';
import { ApiError, badRequest, methodNotAllowed, notFound } from './errors.js';
import { readJsonBody, sendApiError, sendError, sendJson } from './http.js';
import * as validate from './validate.js';
import { clearDemo, seedDemo } from './demo.js';
import { createStaticHandler } from './static.js';

/** 生成实体 id */
function newId() {
  return crypto.randomUUID();
}

/** 只暴露给前端的成员信息（不含 demo / joinedAt 之外的隐私字段）。 */
function publicMember(member) {
  if (!member) return null;
  return {
    id: member.id,
    name: member.name,
    emoji: member.emoji,
    color: member.color,
    joinedAt: member.joinedAt,
    ...(member.demo === true ? { demo: true } : {}),
  };
}

function publicActor(member) {
  if (!member) return null;
  return { id: member.id, name: member.name, emoji: member.emoji };
}

function headerValue(req, name) {
  const raw = req.headers[name];
  if (typeof raw === 'string') return raw.trim();
  if (Array.isArray(raw)) return typeof raw[0] === 'string' ? raw[0].trim() : '';
  return '';
}

/** 切换成员对某条内容的反应（已反应则取消）。 */
function toggleReaction(reaction, memberId) {
  const index = reaction.by.indexOf(memberId);
  if (index >= 0) reaction.by.splice(index, 1);
  else reaction.by.push(memberId);
  reaction.count = reaction.by.length;
  return reaction;
}

function byCreatedAtDesc(a, b) {
  const delta = Date.parse(b.createdAt) - Date.parse(a.createdAt);
  return Number.isFinite(delta) ? delta : 0;
}

function sortIdeas(ideas) {
  return [...ideas].sort((a, b) => Number(b.pinned) - Number(a.pinned) || byCreatedAtDesc(a, b));
}

function sortTodos(todos) {
  return [...todos].sort(byCreatedAtDesc);
}

function sortOpinions(opinions) {
  return [...opinions].sort(byCreatedAtDesc);
}

/**
 * @param {{ store: import('./store.js').Store, hub: import('./sse.js').SseHub, publicDir: string, startedAt: string }} options
 * @returns {(req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) => Promise<void>}
 */
export function createRequestHandler({ store, hub, publicDir, startedAt }) {
  const staticHandler = createStaticHandler({ publicDir });

  // ---------- 通用小工具 ----------

  function findMember(memberId) {
    return store.state.members.find((member) => member.id === memberId) ?? null;
  }

  function requireMember(req) {
    const memberId = headerValue(req, 'x-member-id');
    if (!memberId) throw badRequest('member_required', '请先认领一张名片再操作');
    const member = findMember(memberId);
    if (!member) throw badRequest('invalid_member', '找不到这位成员，请重新认领名片');
    return member;
  }

  function optionalActor(req) {
    const memberId = headerValue(req, 'x-member-id');
    return memberId ? findMember(memberId) : null;
  }

  function clientIdOf(req) {
    return validate.clientId(headerValue(req, 'x-client-id'));
  }

  function findIdea(id) {
    return store.state.ideas.find((idea) => idea.id === id) ?? null;
  }

  function findTodo(id) {
    return store.state.todos.find((todo) => todo.id === id) ?? null;
  }

  function findOpinion(id) {
    return store.state.opinions.find((opinion) => opinion.id === id) ?? null;
  }

  /** 广播一条变更事件。意见类内容恒定匿名（actor 恒为 null）。 */
  function emitChange(kind, action, req, actor = null) {
    const anonymous = kind === 'opinion';
    hub.broadcastChange({
      kind,
      action,
      origin: clientIdOf(req),
      actor: anonymous ? null : publicActor(actor),
      anonymous,
      at: store.nowIso(),
    });
  }

  function stateSnapshot() {
    const snapshot = store.snapshot();
    return {
      members: snapshot.members,
      ideas: sortIdeas(snapshot.ideas),
      todos: sortTodos(snapshot.todos),
      opinions: sortOpinions(snapshot.opinions),
      server: { now: store.nowIso(), startedAt },
    };
  }

  function nextMemberColor() {
    const usage = new Map(validate.MEMBER_COLORS.map((color) => [color, 0]));
    for (const member of store.state.members) {
      if (usage.has(member.color)) usage.set(member.color, usage.get(member.color) + 1);
    }
    let best = validate.MEMBER_COLORS[0];
    let bestCount = Number.POSITIVE_INFINITY;
    for (const color of validate.MEMBER_COLORS) {
      const count = usage.get(color) ?? 0;
      if (count < bestCount) {
        best = color;
        bestCount = count;
      }
    }
    return best;
  }

  // ---------- 各路由处理 ----------

  async function createMember(req, res) {
    const body = await readJsonBody(req);
    const name = validate.memberName(body.name);
    const emoji = validate.memberEmoji(body.emoji);
    const color = body.color === undefined ? nextMemberColor() : validate.memberColor(body.color);
    const member = {
      id: newId(),
      name,
      emoji,
      color: color ?? nextMemberColor(),
      joinedAt: store.nowIso(),
    };
    store.state.members.push(member);
    store.touch();
    emitChange('member', 'created', req, member);
    hub.refreshPresence();
    sendJson(res, 200, { member: publicMember(member) });
  }

  async function updateMember(req, res, memberId) {
    const member = findMember(memberId);
    if (!member) throw notFound('找不到这位成员');
    const body = await readJsonBody(req);
    const patch = {};
    if (body.name !== undefined) patch.name = validate.memberName(body.name);
    if (body.emoji !== undefined) patch.emoji = validate.memberEmoji(body.emoji);
    if (body.color !== undefined) {
      const color = validate.memberColor(body.color);
      if (color !== undefined) patch.color = color;
    }
    if (Object.keys(patch).length === 0) throw badRequest('no_fields', '没有可更新的字段');
    Object.assign(member, patch);
    store.touch();
    emitChange('member', 'updated', req, member);
    hub.refreshPresence();
    sendJson(res, 200, { member: publicMember(member) });
  }

  async function createIdea(req, res) {
    const actor = requireMember(req);
    const body = await readJsonBody(req);
    const text = validate.ideaText(body.text);
    const at = store.nowIso();
    const idea = {
      id: newId(),
      text,
      authorId: actor.id,
      createdAt: at,
      updatedAt: at,
      pinned: false,
      reactions: {
        spark: { count: 0, by: [] },
        fire: { count: 0, by: [] },
      },
    };
    store.state.ideas.push(idea);
    store.touch();
    emitChange('idea', 'created', req, actor);
    sendJson(res, 200, { idea });
  }

  async function updateIdea(req, res, ideaId) {
    const idea = findIdea(ideaId);
    if (!idea) throw notFound('没有找到这张便签');
    const body = await readJsonBody(req);
    const patch = {};
    if (body.text !== undefined) patch.text = validate.ideaText(body.text);
    if (body.pinned !== undefined) patch.pinned = validate.pinned(body.pinned);
    if (Object.keys(patch).length === 0) throw badRequest('no_fields', '没有可更新的字段');
    Object.assign(idea, patch);
    idea.updatedAt = store.nowIso();
    store.touch();
    emitChange('idea', 'updated', req, optionalActor(req));
    sendJson(res, 200, { idea });
  }

  async function deleteIdea(req, res, ideaId) {
    const index = store.state.ideas.findIndex((idea) => idea.id === ideaId);
    if (index < 0) throw notFound('没有找到这张便签');
    store.state.ideas.splice(index, 1);
    store.touch();
    emitChange('idea', 'deleted', req, optionalActor(req));
    sendJson(res, 200, { ok: true });
  }

  async function reactIdea(req, res, ideaId) {
    const actor = requireMember(req);
    const body = await readJsonBody(req);
    const kind = validate.reactionKind(body.kind, validate.IDEA_REACTIONS);
    const idea = findIdea(ideaId);
    if (!idea) throw notFound('没有找到这张便签');
    toggleReaction(idea.reactions[kind], actor.id);
    store.touch();
    emitChange('idea', 'reacted', req, actor);
    sendJson(res, 200, { idea });
  }

  async function createTodo(req, res) {
    const actor = requireMember(req);
    const body = await readJsonBody(req);
    const text = validate.todoText(body.text);
    const status = body.status === undefined ? 'todo' : validate.todoStatus(body.status);
    const at = store.nowIso();
    const todo = {
      id: newId(),
      text,
      authorId: actor.id,
      status: status ?? 'todo',
      createdAt: at,
      updatedAt: at,
      completedAt: (status ?? 'todo') === 'done' ? at : null,
      reactions: { fire: { count: 0, by: [] } },
    };
    store.state.todos.push(todo);
    store.touch();
    emitChange('todo', 'created', req, actor);
    sendJson(res, 200, { todo });
  }

  async function updateTodo(req, res, todoId) {
    const todo = findTodo(todoId);
    if (!todo) throw notFound('没有找到这条待办');
    const body = await readJsonBody(req);
    const patch = {};
    let completedAtExplicit = false;
    let explicitCompletedAt = null;
    if (body.text !== undefined) patch.text = validate.todoText(body.text);
    if (body.completedAt !== undefined) {
      explicitCompletedAt = validate.completedAt(body.completedAt);
      completedAtExplicit = true;
      patch.completedAt = explicitCompletedAt;
    }
    if (body.status !== undefined) {
      const status = validate.todoStatus(body.status);
      patch.status = status;
      if (status === 'done') {
        patch.completedAt = completedAtExplicit ? explicitCompletedAt : store.nowIso();
      } else {
        patch.completedAt = null;
      }
    }
    if (Object.keys(patch).length === 0) throw badRequest('no_fields', '没有可更新的字段');
    Object.assign(todo, patch);
    todo.updatedAt = store.nowIso();
    store.touch();
    emitChange('todo', 'updated', req, optionalActor(req));
    sendJson(res, 200, { todo });
  }

  async function deleteTodo(req, res, todoId) {
    const index = store.state.todos.findIndex((todo) => todo.id === todoId);
    if (index < 0) throw notFound('没有找到这条待办');
    store.state.todos.splice(index, 1);
    store.touch();
    emitChange('todo', 'deleted', req, optionalActor(req));
    sendJson(res, 200, { ok: true });
  }

  async function createOpinion(req, res) {
    const body = await readJsonBody(req);
    const text = validate.opinionText(body.text);
    const mood = validate.opinionMood(body.mood);
    // 注意：不读取 x-member-id，也不记录任何作者信息。
    const opinion = {
      id: newId(),
      text,
      mood,
      createdAt: store.nowIso(),
      reactions: { echo: { count: 0, by: [] } },
    };
    store.state.opinions.push(opinion);
    store.touch();
    emitChange('opinion', 'created', req, null);
    sendJson(res, 200, { opinion });
  }

  async function reactOpinion(req, res, opinionId) {
    const actor = requireMember(req);
    const body = await readJsonBody(req);
    const kind = validate.reactionKind(body.kind, validate.OPINION_REACTIONS);
    const opinion = findOpinion(opinionId);
    if (!opinion) throw notFound('没有找到这封匿名信');
    toggleReaction(opinion.reactions[kind], actor.id);
    store.touch();
    // 匿名内容的事件也不带 actor。
    emitChange('opinion', 'reacted', req, null);
    sendJson(res, 200, { opinion });
  }

  async function deleteOpinion(req, res, opinionId) {
    // 匿名信不记录作者，因此不存在「作者本人」校验；这是团队内的删除/清理动作，
    // 要求一个已有的成员身份，防止无身份的匿名请求直接删信。
    requireMember(req);
    const index = store.state.opinions.findIndex((opinion) => opinion.id === opinionId);
    if (index < 0) throw notFound('没有找到这封匿名信');
    store.state.opinions.splice(index, 1);
    store.touch();
    // 删除事件同样不带 actor，保持匿名。
    emitChange('opinion', 'deleted', req, null);
    sendJson(res, 200, { ok: true });
  }

  async function seedDemoRoute(req, res) {
    const { seeded } = seedDemo(store.state, store.now());
    if (seeded) {
      store.touch();
      emitChange('demo', 'seeded', req, null);
      hub.refreshPresence();
    }
    sendJson(res, 200, { ok: true, seeded });
  }

  async function clearDemoRoute(req, res) {
    const removed = clearDemo(store.state);
    if (removed.total > 0) {
      store.touch();
      emitChange('demo', 'cleared', req, null);
      hub.refreshPresence();
    }
    sendJson(res, 200, { ok: true });
  }

  // ---------- 路由分发 ----------

  async function handleApi(req, res, url, pathname) {
    const segments = pathname.split('/').filter(Boolean);
    const method = req.method ?? 'GET';
    const resource = segments[1];

    if (!resource) throw notFound('没有这个接口');

    if (segments.length === 2) {
      switch (resource) {
        case 'health':
          if (method !== 'GET') throw methodNotAllowed(['GET']);
          sendJson(res, 200, { ok: true, now: store.nowIso() });
          return;
        case 'state':
          if (method !== 'GET') throw methodNotAllowed(['GET']);
          sendJson(res, 200, stateSnapshot());
          return;
        case 'events':
          if (method !== 'GET') throw methodNotAllowed(['GET']);
          hub.add(req, res, { memberId: url.searchParams.get('memberId') || null });
          return;
        case 'members':
          if (method !== 'POST') throw methodNotAllowed(['POST']);
          await createMember(req, res);
          return;
        case 'ideas':
          if (method !== 'POST') throw methodNotAllowed(['POST']);
          await createIdea(req, res);
          return;
        case 'todos':
          if (method !== 'POST') throw methodNotAllowed(['POST']);
          await createTodo(req, res);
          return;
        case 'opinions':
          if (method !== 'POST') throw methodNotAllowed(['POST']);
          await createOpinion(req, res);
          return;
        case 'demo':
          if (method !== 'DELETE') throw methodNotAllowed(['DELETE']);
          await clearDemoRoute(req, res);
          return;
        default:
          throw notFound('没有这个接口');
      }
    }

    if (segments.length === 3) {
      const id = segments[2];
      switch (resource) {
        case 'members':
          if (method !== 'PATCH') throw methodNotAllowed(['PATCH']);
          await updateMember(req, res, id);
          return;
        case 'ideas':
          if (method === 'PATCH') {
            await updateIdea(req, res, id);
            return;
          }
          if (method === 'DELETE') {
            await deleteIdea(req, res, id);
            return;
          }
          throw methodNotAllowed(['PATCH', 'DELETE']);
        case 'todos':
          if (method === 'PATCH') {
            await updateTodo(req, res, id);
            return;
          }
          if (method === 'DELETE') {
            await deleteTodo(req, res, id);
            return;
          }
          throw methodNotAllowed(['PATCH', 'DELETE']);
        case 'opinions':
          if (method === 'DELETE') {
            await deleteOpinion(req, res, id);
            return;
          }
          throw methodNotAllowed(['DELETE']);
        case 'demo':
          if (id === 'seed') {
            if (method !== 'POST') throw methodNotAllowed(['POST']);
            await seedDemoRoute(req, res);
            return;
          }
          throw notFound('没有这个接口');
        default:
          throw notFound('没有这个接口');
      }
    }

    if (segments.length === 4 && segments[3] === 'react') {
      const id = segments[2];
      if (resource === 'ideas') {
        if (method !== 'POST') throw methodNotAllowed(['POST']);
        await reactIdea(req, res, id);
        return;
      }
      if (resource === 'opinions') {
        if (method !== 'POST') throw methodNotAllowed(['POST']);
        await reactOpinion(req, res, id);
        return;
      }
    }

    throw notFound('没有这个接口');
  }

  function respondWithError(res, error) {
    if (error instanceof ApiError) {
      sendApiError(res, error);
      return;
    }
    console.error('[ding-wall] 处理请求时出错：', error);
    if (!res.headersSent && !res.writableEnded) {
      sendError(res, 500, 'internal_error', '服务器内部错误');
    } else {
      try {
        res.destroy();
      } catch {
        /* 忽略 */
      }
    }
  }

  return async function handleRequest(req, res) {
    try {
      const url = new URL(req.url ?? '/', 'http://localhost');
      const pathname = url.pathname;
      if (pathname === '/api' || pathname.startsWith('/api/')) {
        const trimmed = pathname.replace(/\/+$/, '');
        await handleApi(req, res, url, trimmed === '' ? '/api' : trimmed);
        return;
      }
      await staticHandler(req, res, url);
    } catch (error) {
      respondWithError(res, error);
    }
  };
}
