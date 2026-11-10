/**
 * SSE Hub：连接管理 + presence 在线状态 + 25s 心跳 + 变更事件广播。
 *
 * 帧格式（BRIEF §4.2）：
 * - 首帧 `event: hello`，data 含 now / heartbeatMs / online
 * - 变更 `event: state-changed`，data = {kind, action, origin, actor, anonymous, at}
 * - 在线变化 `event: presence`，data = {online:[{id,name,emoji,color}]}
 * - 心跳为 SSE 注释帧 `: ping <ISO>`
 */
export const DEFAULT_HEARTBEAT_MS = 25_000;

function formatEvent(event, data) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * SSE Hub。
 */
export class SseHub {
  /**
   * @param {{ heartbeatMs?: number, now?: () => Date, resolveMember?: (id: string) => object | null }} [options]
   */
  constructor({ heartbeatMs = DEFAULT_HEARTBEAT_MS, now = () => new Date(), resolveMember = () => null } = {}) {
    this.heartbeatMs = Math.max(1, Number.isFinite(heartbeatMs) ? Math.floor(heartbeatMs) : DEFAULT_HEARTBEAT_MS);
    this._now = now;
    this._resolveMember = resolveMember;
    /** @type {Set<{res: import('node:http').ServerResponse, memberId: string | null}>} */
    this.clients = new Set();
    /** memberId -> 连接数，用于多标签页去重 */
    this._memberConnections = new Map();
    this._heartbeatTimer = null;
    this._closed = false;
  }

  nowIso() {
    const value = this._now();
    const date = value instanceof Date ? value : new Date(value);
    return date.toISOString();
  }

  get size() {
    return this.clients.size;
  }

  /** 当前在线成员（按首次上线顺序去重，解析不到成员则忽略）。 */
  onlineMembers() {
    const online = [];
    for (const memberId of this._memberConnections.keys()) {
      const member = this._resolveMember(memberId);
      if (!member) continue;
      online.push({
        id: member.id,
        name: member.name,
        emoji: member.emoji,
        color: member.color,
      });
    }
    return online;
  }

  /**
   * 建立一条 SSE 连接：写响应头 → 登记 → 首帧 hello →（新成员上线时）广播 presence。
   * @param {import('node:http').IncomingMessage} req
   * @param {import('node:http').ServerResponse} res
   * @param {{ memberId?: string | null }} [options]
   */
  add(req, res, { memberId = null } = {}) {
    if (this._closed) {
      res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ error: { code: 'server_closing', message: '服务器正在关闭' } }));
      return null;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'X-Content-Type-Options': 'nosniff',
    });
    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    const client = { res, memberId: null };
    this.clients.add(client);
    this._attachMember(client, memberId);

    res.on('close', () => this.remove(client));
    res.on('error', () => this.remove(client));

    // 首帧必须是 hello。
    this._write(
      res,
      formatEvent('hello', {
        ok: true,
        now: this.nowIso(),
        heartbeatMs: this.heartbeatMs,
        online: this.onlineMembers(),
      }),
    );

    this._ensureHeartbeat();

    // hello 之后向所有端（含新连接自己）广播一次完整在线列表：
    // 前端 EventSource 通常只监听 presence 事件，这样新开的页面能立刻看到「谁在墙上」。
    this._broadcast('presence', { online: this.onlineMembers() });
    return client;
  }

  _attachMember(client, memberId) {
    if (typeof memberId !== 'string' || !memberId) return false;
    if (!this._resolveMember(memberId)) return false;
    client.memberId = memberId;
    const previous = this._memberConnections.get(memberId) ?? 0;
    this._memberConnections.set(memberId, previous + 1);
    return previous === 0;
  }

  _detachMember(client) {
    const memberId = client.memberId;
    if (!memberId) return false;
    client.memberId = null;
    const previous = this._memberConnections.get(memberId) ?? 0;
    if (previous <= 1) {
      this._memberConnections.delete(memberId);
      return previous === 1;
    }
    this._memberConnections.set(memberId, previous - 1);
    return false;
  }

  /** 连接关闭（或写失败）时清理。 */
  remove(client) {
    if (!this.clients.has(client)) return;
    this.clients.delete(client);
    const becameOffline = this._detachMember(client);
    this._maybeStopHeartbeat();
    if (becameOffline) this._broadcast('presence', { online: this.onlineMembers() });
  }

  /** 广播变更事件（BRIEF §4.2 state-changed 结构）。 */
  broadcastChange(change) {
    this._broadcast('state-changed', change);
  }

  /** 成员改名/换头像/下线后刷新 presence（对所有端）。 */
  refreshPresence() {
    if (!this.clients.size) return;
    this._broadcast('presence', { online: this.onlineMembers() });
  }

  _broadcast(event, data) {
    if (!this.clients.size) return;
    const frame = formatEvent(event, data);
    for (const client of [...this.clients]) this._write(client.res, frame, client);
  }

  _write(res, frame, client = null) {
    if (res.writableEnded || res.destroyed) {
      if (client) this.remove(client);
      return;
    }
    try {
      res.write(frame);
    } catch {
      if (client) this.remove(client);
    }
  }

  _ensureHeartbeat() {
    if (this._heartbeatTimer || this._closed) return;
    this._heartbeatTimer = setInterval(() => {
      if (!this.clients.size) {
        this._maybeStopHeartbeat();
        return;
      }
      const frame = `: ping ${this.nowIso()}\n\n`;
      for (const client of [...this.clients]) this._write(client.res, frame, client);
    }, this.heartbeatMs);
    // 心跳不应阻止进程退出（服务器自身会保持进程存活）。
    if (typeof this._heartbeatTimer.unref === 'function') this._heartbeatTimer.unref();
  }

  _maybeStopHeartbeat() {
    if (this.clients.size > 0) return;
    if (this._heartbeatTimer) {
      clearInterval(this._heartbeatTimer);
      this._heartbeatTimer = null;
    }
  }

  /** 关闭所有连接（服务器退出时调用）。 */
  close() {
    if (this._closed) return;
    this._closed = true;
    if (this._heartbeatTimer) {
      clearInterval(this._heartbeatTimer);
      this._heartbeatTimer = null;
    }
    for (const client of [...this.clients]) {
      try {
        if (!client.res.writableEnded) client.res.end();
      } catch {
        /* 忽略关闭时的写错误 */
      }
    }
    this.clients.clear();
    this._memberConnections.clear();
  }
}
