/**
 * 示例数据（demo seed）：示例·阿星 / 示例·阿岸 / 示例·阿岚 三人的真实感创业团队内容。
 * 名字统一带「示例·」前缀，避免用户认领名片时起同名，导致成员活跃列表/晨报出现两个同名成员。
 *
 * 约定（BRIEF §2、§4.2）：
 * - 所有示例内容与示例成员都带 `demo: true`，前端据此展示「示例」角标；
 * - `POST /api/demo/seed` 幂等：已有任何 demo 内容时返回 seeded:false；
 * - `DELETE /api/demo` 删除全部 demo 内容与 demo 成员，保留真实内容；
 * - 示例匿名意见同样不带任何作者信息（reactions.by 里只放 demo 成员 id，用于展示附议数）。
 */
import crypto from 'node:crypto';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const DEMO_MEMBERS = [
  { name: '示例·阿星', emoji: '⭐', color: '#c3472f' },
  { name: '示例·阿岸', emoji: '🌊', color: '#2f5375' },
  { name: '示例·阿岚', emoji: '🌿', color: '#57795f' },
];

function iso(baseMs, offsetMs) {
  return new Date(baseMs + offsetMs).toISOString();
}

function reactions(kinds, by) {
  const output = {};
  for (const kind of kinds) output[kind] = { count: by.length, by: [...by] };
  return output;
}

/** 是否已经贴过示例数据。 */
export function hasDemoContent(state) {
  return (
    state.members.some((member) => member.demo === true) ||
    state.ideas.some((idea) => idea.demo === true) ||
    state.todos.some((todo) => todo.demo === true) ||
    state.opinions.some((opinion) => opinion.demo === true)
  );
}

/**
 * 贴示例数据（原地修改 state）。
 * @param {{ members: object[], ideas: object[], todos: object[], opinions: object[] }} state
 * @param {Date} nowDate
 * @returns {{ seeded: boolean }}
 */
export function seedDemo(state, nowDate = new Date()) {
  if (hasDemoContent(state)) return { seeded: false };

  const baseMs = (nowDate instanceof Date ? nowDate : new Date(nowDate)).getTime();
  const members = DEMO_MEMBERS.map((preset, index) => ({
    id: crypto.randomUUID(),
    name: preset.name,
    emoji: preset.emoji,
    color: preset.color,
    joinedAt: iso(baseMs, -(9 - index) * DAY),
    demo: true,
  }));
  const [xing, an, lan] = members;
  state.members.push(...members);

  const ideas = [
    {
      id: crypto.randomUUID(),
      text: '把「今天谁在推进什么」做成一排小旗子插在墙上，晨会扫一眼就知道谁在忙什么。',
      authorId: xing.id,
      createdAt: iso(baseMs, -2 * HOUR),
      updatedAt: iso(baseMs, -2 * HOUR),
      pinned: true,
      reactions: reactions(['spark', 'fire'], [an.id, lan.id]),
      demo: true,
    },
    {
      id: crypto.randomUUID(),
      text: '用户访谈的录音转成一句话摘要再贴到墙上，长录音就不怕没人听了。',
      authorId: an.id,
      createdAt: iso(baseMs, -26 * HOUR),
      updatedAt: iso(baseMs, -26 * HOUR),
      pinned: false,
      reactions: reactions(['spark', 'fire'], [xing.id]),
      demo: true,
    },
    {
      id: crypto.randomUUID(),
      text: '每周留半天「无会日」，专门做那些总被消息切碎的事。',
      authorId: lan.id,
      createdAt: iso(baseMs, -2 * DAY - 3 * HOUR),
      updatedAt: iso(baseMs, -2 * DAY - 3 * HOUR),
      pinned: false,
      reactions: reactions(['spark', 'fire'], [xing.id, an.id]),
      demo: true,
    },
    {
      id: crypto.randomUUID(),
      text: '给匿名信箱配一个「回声」：信投进去的时候，信箱轻轻亮一下，像有人应了一声。',
      authorId: xing.id,
      createdAt: iso(baseMs, -4 * DAY),
      updatedAt: iso(baseMs, -4 * DAY),
      pinned: false,
      reactions: reactions(['spark', 'fire'], [an.id]),
      demo: true,
    },
    {
      id: crypto.randomUUID(),
      text: '面试时问每个候选人同一个问题：过去一年你主动放弃过什么？答案往往比简历有意思。',
      authorId: an.id,
      createdAt: iso(baseMs, -6 * HOUR),
      updatedAt: iso(baseMs, -6 * HOUR),
      pinned: false,
      reactions: reactions(['spark', 'fire'], [xing.id, lan.id]),
      demo: true,
    },
    {
      id: crypto.randomUUID(),
      text: '每周五把「这周卡住的事」写成一张小便签贴到墙上，下次晨会一起看哪些卡点是重复的。',
      authorId: lan.id,
      createdAt: iso(baseMs, -3 * DAY),
      updatedAt: iso(baseMs, -3 * DAY),
      pinned: false,
      reactions: reactions(['spark', 'fire'], [xing.id]),
      demo: true,
    },
  ];

  const todos = [
    {
      id: crypto.randomUUID(),
      text: '把用户访谈里 12 条原话整理成 3 个主题，晨会前发到群里。',
      authorId: lan.id,
      status: 'todo',
      createdAt: iso(baseMs, -3 * HOUR),
      updatedAt: iso(baseMs, -3 * HOUR),
      completedAt: null,
      reactions: reactions(['fire'], [xing.id]),
      demo: true,
    },
    {
      id: crypto.randomUUID(),
      text: '补上注册转化的埋点，先把「卡在哪一步」看清楚。',
      authorId: an.id,
      status: 'doing',
      createdAt: iso(baseMs, -26 * HOUR),
      updatedAt: iso(baseMs, -5 * HOUR),
      completedAt: null,
      reactions: reactions(['fire'], [xing.id, lan.id]),
      demo: true,
    },
    {
      id: crypto.randomUUID(),
      text: '内测邀请邮件发出去，附上三个开放问题收集反馈。',
      authorId: xing.id,
      status: 'done',
      createdAt: iso(baseMs, -2 * DAY),
      updatedAt: iso(baseMs, -5 * HOUR),
      completedAt: iso(baseMs, -5 * HOUR),
      reactions: reactions(['fire'], [lan.id]),
      demo: true,
    },
    {
      id: crypto.randomUUID(),
      text: '匿名信箱入口在手机端的触控区域加大到 44px。',
      authorId: xing.id,
      status: 'todo',
      createdAt: iso(baseMs, -7 * HOUR),
      updatedAt: iso(baseMs, -7 * HOUR),
      completedAt: null,
      reactions: reactions(['fire'], []),
      demo: true,
    },
    {
      id: crypto.randomUUID(),
      text: '晨会模式的小报版式先按印刷品排一版，别做成仪表盘。',
      authorId: an.id,
      status: 'done',
      createdAt: iso(baseMs, -3 * DAY),
      updatedAt: iso(baseMs, -1 * DAY),
      completedAt: iso(baseMs, -1 * DAY),
      reactions: reactions(['fire'], [xing.id]),
      demo: true,
    },
  ];

  // 匿名意见：绝不存作者信息；echo.by 只是 demo 成员 id（展示附议数用）。
  const opinions = [
    {
      id: crypto.randomUUID(),
      text: '其实每周三下午不开会的默契挺好，希望一直留着，别被排期表吃掉。',
      mood: 'casual',
      createdAt: iso(baseMs, -5 * HOUR),
      reactions: reactions(['echo'], [an.id, lan.id]),
      demo: true,
    },
    {
      id: crypto.randomUUID(),
      text: '有点担心三条线同时往前推，每条都停在 60%，要不要先砍掉一条？',
      mood: 'worry',
      createdAt: iso(baseMs, -29 * HOUR),
      reactions: reactions(['echo'], [xing.id]),
      demo: true,
    },
    {
      id: crypto.randomUUID(),
      text: '建议每次上线后留十分钟一起看真实用户怎么说，比事后写复盘有用。',
      mood: 'suggest',
      createdAt: iso(baseMs, -2 * DAY - 6 * HOUR),
      reactions: reactions(['echo'], [xing.id, an.id, lan.id]),
      demo: true,
    },
    {
      id: crypto.randomUUID(),
      text: '需求变得有点快，刚做完的页面又推倒重来，会有点沮丧，但不想当面扫兴。',
      mood: 'vent',
      createdAt: iso(baseMs, -4 * DAY - 2 * HOUR),
      reactions: reactions(['echo'], [an.id]),
      demo: true,
    },
  ];

  state.ideas.push(...ideas);
  state.todos.push(...todos);
  state.opinions.push(...opinions);
  return { seeded: true };
}

/**
 * 撕掉示例数据（原地修改 state），并清理真实内容里残留的 demo 成员反应。
 * @returns {{ members: number, ideas: number, todos: number, opinions: number, total: number }}
 */
export function clearDemo(state) {
  const demoMemberIds = new Set(
    state.members.filter((member) => member.demo === true).map((member) => member.id),
  );
  const counts = {
    members: state.members.length,
    ideas: state.ideas.length,
    todos: state.todos.length,
    opinions: state.opinions.length,
  };
  state.members = state.members.filter((member) => member.demo !== true);
  state.ideas = state.ideas.filter((idea) => idea.demo !== true);
  state.todos = state.todos.filter((todo) => todo.demo !== true);
  state.opinions = state.opinions.filter((opinion) => opinion.demo !== true);

  if (demoMemberIds.size) {
    for (const item of [...state.ideas, ...state.todos, ...state.opinions]) {
      for (const reaction of Object.values(item.reactions ?? {})) {
        if (!Array.isArray(reaction.by)) continue;
        reaction.by = reaction.by.filter((id) => !demoMemberIds.has(id));
        reaction.count = reaction.by.length;
      }
    }
  }

  return {
    members: counts.members - state.members.length,
    ideas: counts.ideas - state.ideas.length,
    todos: counts.todos - state.todos.length,
    opinions: counts.opinions - state.opinions.length,
    total:
      counts.members - state.members.length +
      (counts.ideas - state.ideas.length) +
      (counts.todos - state.todos.length) +
      (counts.opinions - state.opinions.length),
  };
}
