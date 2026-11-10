/**
 * 墙的状态存储：内存 state + data/wall.json 持久化。
 *
 * 持久化约定（BRIEF §4.1）：
 * - 原子写：先写同目录临时文件，再 rename 覆盖，避免半截文件；
 * - 防抖：每次变更后 200ms 内合并写盘，`flush()` / `close()` 可立即落盘；
 * - 启动加载：文件存在则读入；文件损坏则备份为 wall.json.corrupt-<时间> 并以空墙启动；
 * - 匿名保证：opinions 序列化时只保留白名单字段，永不写入任何作者信息。
 */
import fs from 'node:fs';
import path from 'node:path';

export const SAVE_DEBOUNCE_MS = 200;
export const WALL_VERSION = 1;

const MOODS = ['casual', 'worry', 'suggest', 'vent'];
const STATUSES = ['todo', 'doing', 'done'];

/** 空墙。 */
export function emptyState() {
  return { version: WALL_VERSION, members: [], ideas: [], todos: [], opinions: [] };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function str(value, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function optionalIso(value) {
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeReactions(raw, kinds) {
  const source = isPlainObject(raw) ? raw : {};
  const reactions = {};
  for (const kind of kinds) {
    const entry = isPlainObject(source[kind]) ? source[kind] : {};
    const by = Array.isArray(entry.by)
      ? [...new Set(entry.by.filter((id) => typeof id === 'string' && id))]
      : [];
    // count 永远由 by 推导，避免文件里 count/by 不一致。
    reactions[kind] = { count: by.length, by };
  }
  return reactions;
}

function normalizeMember(raw) {
  if (!isPlainObject(raw) || typeof raw.id !== 'string' || !raw.id) return null;
  return {
    id: raw.id,
    name: str(raw.name),
    emoji: str(raw.emoji),
    color: str(raw.color),
    joinedAt: optionalIso(raw.joinedAt) ?? new Date(0).toISOString(),
    ...(raw.demo === true ? { demo: true } : {}),
  };
}

function normalizeIdea(raw) {
  if (!isPlainObject(raw) || typeof raw.id !== 'string' || !raw.id) return null;
  return {
    id: raw.id,
    text: str(raw.text),
    authorId: str(raw.authorId),
    createdAt: optionalIso(raw.createdAt) ?? new Date(0).toISOString(),
    updatedAt: optionalIso(raw.updatedAt) ?? optionalIso(raw.createdAt) ?? new Date(0).toISOString(),
    pinned: raw.pinned === true,
    reactions: normalizeReactions(raw.reactions, ['spark', 'fire']),
    ...(raw.demo === true ? { demo: true } : {}),
  };
}

function normalizeTodo(raw) {
  if (!isPlainObject(raw) || typeof raw.id !== 'string' || !raw.id) return null;
  const status = STATUSES.includes(raw.status) ? raw.status : 'todo';
  return {
    id: raw.id,
    text: str(raw.text),
    authorId: str(raw.authorId),
    status,
    createdAt: optionalIso(raw.createdAt) ?? new Date(0).toISOString(),
    updatedAt: optionalIso(raw.updatedAt) ?? optionalIso(raw.createdAt) ?? new Date(0).toISOString(),
    completedAt: optionalIso(raw.completedAt),
    reactions: normalizeReactions(raw.reactions, ['fire']),
    ...(raw.demo === true ? { demo: true } : {}),
  };
}

/** 匿名意见：只保留白名单字段，任何作者相关字段都被丢弃。 */
function normalizeOpinion(raw) {
  if (!isPlainObject(raw) || typeof raw.id !== 'string' || !raw.id) return null;
  return {
    id: raw.id,
    text: str(raw.text),
    mood: MOODS.includes(raw.mood) ? raw.mood : 'casual',
    createdAt: optionalIso(raw.createdAt) ?? new Date(0).toISOString(),
    reactions: normalizeReactions(raw.reactions, ['echo']),
    ...(raw.demo === true ? { demo: true } : {}),
  };
}

function normalizeState(parsed) {
  if (!isPlainObject(parsed)) throw new Error('顶层不是对象');
  if (parsed.version !== WALL_VERSION) throw new Error(`不支持的数据版本：${parsed.version}`);
  for (const key of ['members', 'ideas', 'todos', 'opinions']) {
    if (!Array.isArray(parsed[key])) throw new Error(`缺少 ${key} 数组`);
  }
  return {
    version: WALL_VERSION,
    members: parsed.members.map(normalizeMember).filter(Boolean),
    ideas: parsed.ideas.map(normalizeIdea).filter(Boolean),
    todos: parsed.todos.map(normalizeTodo).filter(Boolean),
    opinions: parsed.opinions.map(normalizeOpinion).filter(Boolean),
  };
}

/**
 * 生成干净、可序列化的状态快照（用于 HTTP 响应与写盘）。
 * 只输出数据模型白名单字段，匿名意见绝不带作者信息。
 */
export function snapshotState(state) {
  return {
    version: WALL_VERSION,
    members: state.members.map(normalizeMember).filter(Boolean),
    ideas: state.ideas.map(normalizeIdea).filter(Boolean),
    todos: state.todos.map(normalizeTodo).filter(Boolean),
    opinions: state.opinions.map(normalizeOpinion).filter(Boolean),
  };
}

export class Store {
  /**
   * @param {{ dataDir: string, now?: () => Date | string | number }} options
   */
  constructor({ dataDir, now = () => new Date() } = {}) {
    if (typeof dataDir !== 'string' || !dataDir) throw new TypeError('Store 需要 dataDir');
    this.dataDir = path.resolve(dataDir);
    this.filePath = path.join(this.dataDir, 'wall.json');
    this.tmpPath = path.join(this.dataDir, `wall.json.tmp-${process.pid}`);
    this._now = now;
    this.state = emptyState();
    this.loadedFromFile = false;
    this._dirty = false;
    this._saveTimer = null;
    this._writeChain = Promise.resolve();
    this._closePromise = null;
    this._closed = false;
  }

  /** 当前时间（由 createWallServer 注入，便于测试固定时钟）。 */
  now() {
    const value = this._now();
    return value instanceof Date ? value : new Date(value);
  }

  nowIso() {
    return this.now().toISOString();
  }

  /**
   * 同步加载 data/wall.json；损坏时备份并空墙启动。
   * 由 createWallServer 在 listen 之前调用，保证首个请求就能看到历史数据。
   */
  load() {
    fs.mkdirSync(this.dataDir, { recursive: true });
    let raw;
    try {
      raw = fs.readFileSync(this.filePath, 'utf8');
    } catch (error) {
      if (error && error.code === 'ENOENT') return this.state;
      throw error;
    }
    try {
      this.state = normalizeState(JSON.parse(raw));
      this.loadedFromFile = true;
    } catch (error) {
      this._quarantineCorruptFile(error);
      this.state = emptyState();
    }
    return this.state;
  }

  _quarantineCorruptFile(error) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.dataDir, `wall.json.corrupt-${stamp}`);
    try {
      fs.renameSync(this.filePath, backupPath);
      console.error(
        `[ding-wall] data/wall.json 无法解析（${error.message}），已备份为 ${path.basename(backupPath)}，将以空墙启动。`,
      );
    } catch (renameError) {
      console.error('[ding-wall] data/wall.json 损坏，且备份失败：', renameError);
    }
  }

  /** 深拷贝的干净状态快照。 */
  snapshot() {
    return snapshotState(this.state);
  }

  /** 标记变更并按 200ms 防抖排一次写盘。 */
  touch() {
    this._dirty = true;
    if (this._closed) return;
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => {
      this._saveTimer = null;
      void this.flush();
    }, SAVE_DEBOUNCE_MS);
  }

  /** 立即写盘（有未落盘变更时）；返回写盘 Promise，永不 reject。 */
  flush() {
    if (this._saveTimer) {
      clearTimeout(this._saveTimer);
      this._saveTimer = null;
    }
    if (!this._dirty) return this._writeChain;
    this._dirty = false;
    const payload = JSON.stringify(snapshotState(this.state), null, 2) + '\n';
    this._writeChain = this._writeChain
      .then(() => this._atomicWrite(payload))
      .catch((error) => {
        console.error('[ding-wall] 写入 data/wall.json 失败：', error);
      });
    return this._writeChain;
  }

  async _atomicWrite(payload) {
    await fs.promises.mkdir(this.dataDir, { recursive: true });
    await fs.promises.writeFile(this.tmpPath, payload, 'utf8');
    await fs.promises.rename(this.tmpPath, this.filePath);
  }

  /** 关闭：取消防抖计时器并刷盘（幂等）。 */
  close() {
    if (!this._closePromise) {
      this._closed = true;
      if (this._saveTimer) {
        clearTimeout(this._saveTimer);
        this._saveTimer = null;
      }
      this._closePromise = this.flush();
    }
    return this._closePromise;
  }
}
