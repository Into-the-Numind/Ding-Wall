/**
 * 输入校验（纯函数，失败时抛 ApiError，由 api.js 统一转成 400）。
 * 所有用户文本都按纯文本处理：服务端只做长度/类型校验，绝不拼 HTML。
 */
import { badRequest } from './errors.js';

/** 文本长度上限（按 Unicode 码点计数，一个汉字/emoji 记 1）。 */
export const LIMITS = Object.freeze({
  ideaText: 500,
  todoText: 240,
  opinionText: 500,
  name: 24,
  emoji: 16,
  clientId: 200,
});

/** 成员色板：朱红 / 墨蓝 / 苔绿 / 赭黄 / 墨紫 / 墨青，由服务端按使用次数自动分配。 */
export const MEMBER_COLORS = Object.freeze([
  '#c3472f',
  '#2f5375',
  '#57795f',
  '#d99a2b',
  '#6b4f6e',
  '#3f6363',
]);

export const MOODS = Object.freeze(['casual', 'worry', 'suggest', 'vent']);
export const TODO_STATUSES = Object.freeze(['todo', 'doing', 'done']);
export const IDEA_REACTIONS = Object.freeze(['spark', 'fire']);
export const OPINION_REACTIONS = Object.freeze(['echo']);

const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

export function charLength(text) {
  return Array.from(text).length;
}

function requireText(value, { field, max, code = 'invalid_text' }) {
  if (typeof value !== 'string') throw badRequest(code, `${field}必须是文本`);
  // 去掉首尾空白；内部换行/空格保留（便签可以多行）。
  const text = value.trim();
  if (!text) throw badRequest(code, `${field}不能为空`);
  if (charLength(text) > max) throw badRequest('text_too_long', `${field}不能超过 ${max} 个字`);
  return text;
}

/** 想法正文：≤500 字。 */
export function ideaText(value) {
  return requireText(value, { field: '想法内容', max: LIMITS.ideaText });
}

/** 待办正文：≤240 字。 */
export function todoText(value) {
  return requireText(value, { field: '待办内容', max: LIMITS.todoText });
}

/** 匿名意见正文：≤500 字。 */
export function opinionText(value) {
  return requireText(value, { field: '意见内容', max: LIMITS.opinionText });
}

/** 成员名字：≤24 字。 */
export function memberName(value) {
  return requireText(value, { field: '名字', max: LIMITS.name, code: 'invalid_name' });
}

/** 成员 emoji：必填，1–16 个码点，不允许控制字符。 */
export function memberEmoji(value) {
  if (typeof value !== 'string') throw badRequest('invalid_emoji', 'emoji 必须是文本');
  const emoji = value.trim();
  if (!emoji) throw badRequest('invalid_emoji', '请挑一个 emoji 当作头像');
  if (CONTROL_CHARS.test(emoji)) throw badRequest('invalid_emoji', 'emoji 里不能有控制字符');
  if (charLength(emoji) > LIMITS.emoji) throw badRequest('invalid_emoji', `emoji 不能超过 ${LIMITS.emoji} 个字符`);
  return emoji;
}

/** 成员颜色：色板内的值或 #rgb/#rrggbb；未传返回 undefined（由服务端分配）。 */
export function memberColor(value) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') throw badRequest('invalid_color', '颜色必须是文本');
  const color = value.trim().toLowerCase();
  if (MEMBER_COLORS.includes(color)) return color;
  if (/^#[0-9a-f]{3}$/.test(color) || /^#[0-9a-f]{6}$/.test(color)) return color;
  throw badRequest('invalid_color', '颜色只能使用色板里的颜色或 #rrggbb 格式');
}

/** 匿名意见心情：缺省 casual。 */
export function opinionMood(value) {
  if (value === undefined || value === null || value === '') return 'casual';
  if (typeof value !== 'string' || !MOODS.includes(value)) {
    throw badRequest('invalid_mood', `心情只能是 ${MOODS.join(' / ')}`);
  }
  return value;
}

/** 待办状态：缺省 undefined（由调用方决定默认值）。 */
export function todoStatus(value) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !TODO_STATUSES.includes(value)) {
    throw badRequest('invalid_status', `状态只能是 ${TODO_STATUSES.join(' / ')}`);
  }
  return value;
}

/** pinned 字段：必须是布尔值。 */
export function pinned(value) {
  if (typeof value !== 'boolean') throw badRequest('invalid_pinned', 'pinned 必须是布尔值');
  return value;
}

/** 反应类型：必须在允许的集合内。 */
export function reactionKind(value, allowed) {
  if (typeof value !== 'string' || !allowed.includes(value)) {
    throw badRequest('invalid_kind', `反应类型只能是 ${allowed.join(' / ')}`);
  }
  return value;
}

/** completedAt：null 或合法时间串；返回 ISO 字符串或 null。 */
export function completedAt(value) {
  if (value === null) return null;
  if (typeof value !== 'string') throw badRequest('invalid_completed_at', 'completedAt 必须是 ISO 时间字符串或 null');
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw badRequest('invalid_completed_at', 'completedAt 不是合法的时间');
  return date.toISOString();
}

/** 客户端 id（header 可选项）：清洗成安全的短字符串，缺省 null。 */
export function clientId(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return Array.from(trimmed).slice(0, LIMITS.clientId).join('');
}
