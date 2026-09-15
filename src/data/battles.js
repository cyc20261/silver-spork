// ==========================
// 敌人图鉴 & 回合战斗配置（v2 · 按设定四大怪物体系）
//   星屑精灵   —— 普通小怪（序章教学）：星屑弹 / 暗影触碰
//   虚空影犬   —— 速度型小怪（第三章）：影爪 / 虚空撕咬 / 闪避 + 先手
//   星镰收割者 —— 精英守关（第五章）：星镰斩 / 虚空裂隙 / 灵魂收割(斩杀)
//   星渊主君   —— 最终Boss（终章）：星渊爆发 / 碎星压制 / 暗星吞噬 / 次元裂隙 + 双形态
// ==========================

const SK = {
  stardust: { id: 'stardust', name: '星屑弹', type: 'attack', mult: 1 },
  shadowtouch: { id: 'shadowtouch', name: '暗影触碰', type: 'attack', mult: 1.05, drain: 0.6 },
  shadowclaw: { id: 'shadowclaw', name: '影爪', type: 'attack', mult: 1 },
  voidbite: { id: 'voidbite', name: '虚空撕咬', type: 'attack', mult: 1.5 },
  starscythe: { id: 'starscythe', name: '星镰斩', type: 'attack', mult: 1, canCrit: 0.2 },
  voidrift: { id: 'voidrift', name: '虚空裂隙', type: 'charge', telegraph: '⚠ 虚空裂隙撕开空间——下一击将被强化！', next: { id: 'voidrift-x', name: '虚空裂隙·斩', type: 'attack', mult: 2.1 } },
  abyssburst: { id: 'abyssburst', name: '星渊爆发', type: 'attack', mult: 1.2 },
  shatteredpress: { id: 'shatteredpress', name: '碎星压制', type: 'attack', mult: 0.75, hits: 2 },
  darkstar: { id: 'darkstar', name: '暗星吞噬', type: 'attack', mult: 1.05, drain: 0.5 },
  dimrift: { id: 'dimrift', name: '次元裂隙', type: 'charge', telegraph: '⚠ 次元裂隙张开——毁灭的一击正在凝聚！', next: { id: 'dimrift-x', name: '次元裂隙·灭', type: 'attack', mult: 2.3 } },
}

const SOUL_HARVEST = { id: 'soulharvest', name: '灵魂收割', type: 'attack', mult: 2.6 }

export const BATTLES = {
  // ---------- 序章 · 新手教学（星屑精灵） ----------
  'tuto-1': {
    id: 'tuto-1', route: 'prologue',
    drops: ["it-r-compass"], sprite: 'sprite',
    name: '星屑精灵', title: '暗蚀 · 初试锋芒', tier: '普通小怪',
    hp: 45, atkMin: 6, atkMax: 10,
    color: '#a78bfa',
    desc: '半透明星尘小幽灵，紫色水晶身体，单颗幽蓝晶眼——正在啃食罗盘的星辉。',
    tip: '教学战：「普攻」积攒星辉，40 点后释放「星技」；血量危险时用「治愈」。',
    pick: (t) => (t % 3 === 0 ? SK.shadowtouch : SK.stardust),
  },

  // ---------- 第三章 · 虚空影犬（速度型，先手 + 闪避） ----------
  'xb-1': {
    id: 'xb-1', route: 'xingbai',
    drops: ["it-r-badge","tr-meteor"], sprite: 'hound',
    name: '虚空影犬', title: '暗蚀 · 梦之茧的猎影', tier: '速度型',
    hp: 76, atkMin: 9, atkMax: 13,
    dodge: 0.2, firstStrike: true,
    color: '#8b5cf6',
    desc: '黑紫色暗影猎犬，背部有星纹印记，尾部拖着暗能量——它盯上了星鲸幼崽的梦。',
    tip: '它会先手偷袭、还会闪避你的攻击——积攒星辉用「星技」重创它！',
    pick: (t) => (t % 3 === 0 ? SK.voidbite : SK.shadowclaw),
  },
  'ly-1': {
    id: 'ly-1', route: 'linyue',
    drops: ["it-r-badge","tr-meteor"], sprite: 'hound',
    name: '虚空影犬', title: '暗蚀 · 月轨猎影', tier: '速度型',
    hp: 80, atkMin: 10, atkMax: 14,
    dodge: 0.2, firstStrike: true,
    color: '#8b5cf6',
    desc: '循着守望台灯火而来的暗影猎群，爪下月尘纷飞，赤瞳在黑暗中燃烧。',
    tip: '它先手极快——「月之凝视」会让你的星技伤害提升 30%，攒够 40 星辉再放。',
    pick: (t) => (t % 3 === 0 ? SK.voidbite : SK.shadowclaw),
  },
  'yg-1': {
    id: 'yg-1', route: 'yaoguang',
    drops: ["it-r-badge","tr-meteor"], sprite: 'hound',
    name: '虚空影犬', title: '暗蚀 · 偷星的贼', tier: '速度型',
    hp: 78, atkMin: 9, atkMax: 14,
    dodge: 0.2, firstStrike: true,
    color: '#8b5cf6',
    desc: '潜入葵阳星田的暗影猎犬，正在偷啃向日葵里的星光，花田忽明忽暗。',
    tip: '「向阳祝福」提升你的闪避——它的先手扑击可以用「闪避」姿态化解！',
    pick: (t) => (t % 3 === 0 ? SK.voidbite : SK.shadowclaw),
  },
  'jy-1': {
    id: 'jy-1', route: 'jinyu',
    drops: ["it-r-badge","tr-meteor"], sprite: 'hound',
    name: '虚空影犬', title: '暗蚀 · 禁域猎犬', tier: '速度型',
    hp: 84, atkMin: 10, atkMax: 15,
    dodge: 0.2, firstStrike: true,
    color: '#8b5cf6',
    desc: '游荡在红月禁域的暗影猎犬，被暗蚀侵蚀的通缉獠牙，只认得「焚烧」二字。',
    tip: '「烬火余温」的灼烧会持续削减它——稳住节奏，别被先手打乱阵脚。',
    pick: (t) => (t % 3 === 0 ? SK.voidbite : SK.shadowclaw),
  },

  // ---------- 第五章 · 星镰收割者（精英守关，斩杀技能） ----------
  'xb-2': {
    id: 'xb-2', route: 'xingbai',
    drops: ["it-r-charm"], sprite: 'reaper',
    name: '星镰收割者', title: '暗蚀 · 圣所之门', tier: '精英怪',
    hp: 116, atkMin: 12, atkMax: 16,
    color: '#818cf8',
    execute: SOUL_HARVEST,
    desc: '披星尘斗篷的高大魔物，发光的面具凝视圣所，手中的星镰收割梦境与光。',
    tip: '血量过低时它会释放「灵魂收割」——保持血线，蓄力征兆出现就用「闪避」！',
    pick: (t) => (t % 4 === 0 ? SK.voidrift : SK.starscythe),
  },
  'ly-2': {
    id: 'ly-2', route: 'linyue',
    drops: ["it-r-charm"], sprite: 'reaper',
    name: '星镰收割者', title: '暗蚀 · 守望台之殇', tier: '精英怪',
    hp: 120, atkMin: 12, atkMax: 17,
    color: '#6d28d9',
    execute: SOUL_HARVEST,
    desc: '破碎的光环绕顶旋转，星尘斗篷扫过月面——它要收割守望台三百年的光。',
    tip: '「灵魂收割」会在你血量低于 35% 时降临——提前「治愈」，别给它机会。',
    pick: (t) => (t % 4 === 0 ? SK.voidrift : SK.starscythe),
  },
  'yg-2': {
    id: 'yg-2', route: 'yaoguang',
    drops: ["it-r-charm"], sprite: 'reaper',
    name: '星镰收割者', title: '暗蚀 · 花田的黄昏', tier: '精英怪',
    hp: 118, atkMin: 12, atkMax: 17,
    color: '#ea580c',
    execute: SOUL_HARVEST,
    desc: '自云层降落的收割者，星镰映着落日的余晖——它要收割整片葵阳星田的光。',
    tip: '「闪避」回星辉最快——快速转出「阳光爆裂」终结它，别拖进收割线！',
    pick: (t) => (t % 4 === 0 ? SK.voidrift : SK.starscythe),
  },
  'jy-2': {
    id: 'jy-2', route: 'jinyu',
    drops: ["it-r-charm"], sprite: 'reaper',
    name: '星镰收割者', title: '暗蚀 · 七年之火', tier: '精英怪',
    hp: 126, atkMin: 13, atkMax: 18,
    color: '#be123c',
    execute: SOUL_HARVEST,
    desc: '从灰烬中站起的收割者——七年前那场大火的执行者，回来收割最后的火种。',
    tip: '它的「星镰斩」会暴击——血量过半前留一次「治愈」，火种不容有失。',
    pick: (t) => (t % 4 === 0 ? SK.voidrift : SK.starscythe),
  },

  // ---------- 终章 · 星渊主君（最终Boss，双形态） ----------
  'xb-3': {
    id: 'xb-3', route: 'xingbai',
    drops: ["it-r-lens","tr-relief"], sprite: 'abyss',
    name: '星渊主君', title: '暗蚀本源 · 门前的深渊', tier: '最终Boss',
    hp: 112, atkMin: 13, atkMax: 17,
    color: '#f43f5e',
    phases: { at: 0.5 },
    desc: '半人形的星渊能量体，破碎星冠下是赤红眼核——暗蚀的本源，拦在归途之前。',
    tip: '半血后它将「星渊觉醒」进入第二形态——留好「治愈」，蓄力必闪！',
    pick: (t) => (t % 4 === 0 ? SK.dimrift : t % 3 === 0 ? SK.shatteredpress : t % 2 === 0 ? SK.darkstar : SK.abyssburst),
  },
  'ly-3': {
    id: 'ly-3', route: 'linyue',
    drops: ["it-r-lens","tr-relief"], sprite: 'abyss',
    name: '星渊主君', title: '暗蚀本源 · 归途的星渊', tier: '最终Boss',
    hp: 116, atkMin: 13, atkMax: 18,
    color: '#f43f5e',
    phases: { at: 0.5 },
    desc: '守望台三百年的记录里从未有过它的名字——今夜，星渊主君亲临月轨。',
    tip: '第二形态的伤害会全面提升——「月之凝视」的星技是你最快的斩杀手段。',
    pick: (t) => (t % 4 === 0 ? SK.dimrift : t % 3 === 0 ? SK.shatteredpress : t % 2 === 0 ? SK.darkstar : SK.abyssburst),
  },
  'yg-3': {
    id: 'yg-3', route: 'yaoguang',
    drops: ["it-r-lens","tr-relief"], sprite: 'abyss',
    name: '星渊主君', title: '暗蚀本源 · 朝阳前的深渊', tier: '最终Boss',
    hp: 116, atkMin: 13, atkMax: 18,
    color: '#f43f5e',
    phases: { at: 0.5 },
    desc: '它张开的星渊漩涡要吞掉明天的太阳——护卫队的最终一战，就在此刻。',
    tip: '「碎星压制」是两连击——「向阳祝福」的闪避会帮你挡下致命一击。',
    pick: (t) => (t % 4 === 0 ? SK.dimrift : t % 3 === 0 ? SK.shatteredpress : t % 2 === 0 ? SK.darkstar : SK.abyssburst),
  },
  'jy-3': {
    id: 'jy-3', route: 'jinyu',
    drops: ["it-r-lens","tr-relief"], sprite: 'abyss',
    name: '星渊主君', title: '暗蚀本源 · 红月之巅', tier: '最终Boss',
    hp: 120, atkMin: 14, atkMax: 18,
    color: '#f43f5e',
    phases: { at: 0.5 },
    desc: '七年前烧毁故乡星的正是它的本源——红月之下，旧账该清算了。',
    tip: '终局之战：「烬火余温」的灼烧每刀都算——把它拖进持久战，燃尽它。',
    pick: (t) => (t % 4 === 0 ? SK.dimrift : t % 3 === 0 ? SK.shatteredpress : t % 2 === 0 ? SK.darkstar : SK.abyssburst),
  },
}
