// ==========================
// 四位星灵角色设定（固定人设 · 统一画风参数）
// ==========================

export const CHAR_IDS = ['xingbai', 'linyue', 'yaoguang', 'jinyu']

export const CHAR_SHORT = { xingbai: 'xb', linyue: 'ly', yaoguang: 'yg', jinyu: 'jy' }

// 真结局所需好感度
export const TRUE_THRESHOLD = 70

export const CHARACTERS = {
  xingbai: {
    id: 'xingbai',
    name: '星白',
    en: 'XINGBAI',
    title: '温柔治愈系 · 白昼星光',
    element: '纯白星光',
    elementIcon: '✧',
    weapon: '星辉竖琴',
    intro: '在白色圣所长大的治愈星灵，声音很轻，心的温度却很高。她会记住每一个旅人做过的梦。',
    tags: ['温柔', '治愈', '星鲸', '竖琴'],
    colors: {
      primary: '#7dd3fc',
      deep: '#38bdf8',
      soft: '#e0f2fe',
      aura: 'rgba(147,197,253,0.35)',
      hairA: '#fdfdff',
      hairB: '#ccd4f2',
      eyeA: '#8dd6fd',
      eyeB: '#2f7fd0',
      clothA: '#ffffff',
      clothB: '#bcd8ff',
    },
    bgVariant: 'white',
    blessing: { name: '星愈祷告', desc: '每回合结束，为你恢复 4 点生命' },
    skill: { name: '白昼流星', desc: '造成 28–38 点星辉伤害' },
    battleLine: '我把星光借给你——一定要平安回来哦。',
    voice: '轻声细语，习惯把「没关系」挂在嘴边。',
  },
  linyue: {
    id: 'linyue',
    name: '凛月',
    en: 'LINYUE',
    title: '高冷清冷系 · 月背守望',
    element: '月夜霜辉',
    elementIcon: '☾',
    weapon: '月刃 · 眠霜',
    intro: '守望月之守望台三百年的孤高星灵。毒舌、怕麻烦，却会默默把你的名字描了很多遍。',
    tags: ['高冷', '傲娇', '月刃', '守望'],
    colors: {
      primary: '#a5b4fc',
      deep: '#6366f1',
      soft: '#e0e7ff',
      aura: 'rgba(165,180,252,0.35)',
      hairA: '#57496f',
      hairB: '#241d38',
      eyeA: '#cfc8e2',
      eyeB: '#8b7fa8',
      clothA: '#3b3480',
      clothB: '#191642',
    },
    bgVariant: 'moon',
    blessing: { name: '月之凝视', desc: '「星技」伤害提升 30%' },
    skill: { name: '月影千华斩', desc: '造成 28–38 点星辉伤害（月之凝视加成）' },
    battleLine: '站在我剑光照得到的地方。',
    voice: '话少而冷，关心人的方式是「多管闲事」。',
  },
  yaoguang: {
    id: 'yaoguang',
    name: '瑶光',
    en: 'YAOGUANG',
    title: '活泼元气系 · 向阳少女',
    element: '晨曦阳焰',
    elementIcon: '☀',
    weapon: '流星拳套',
    intro: '葵阳星田的守护者兼第一护卫兼……总之超厉害！全星域最响亮的笑声的主人。',
    tags: ['元气', '笑容', '星田', '秋千'],
    colors: {
      primary: '#fbbf24',
      deep: '#f59e0b',
      soft: '#fef3c7',
      aura: 'rgba(251,191,36,0.32)',
      hairA: '#ffe9a8',
      hairB: '#f5a93c',
      eyeA: '#ffd76e',
      eyeB: '#e08a12',
      clothA: '#fff7df',
      clothB: '#ffd98a',
    },
    bgVariant: 'sun',
    blessing: { name: '向阳祝福', desc: '闪避率 +15%，每回合额外 +5 星辉' },
    skill: { name: '阳光爆裂 · 流星拳', desc: '造成 28–38 点星辉伤害' },
    battleLine: '副队长！作战会议三十秒开完——上！',
    voice: '音量很大，心事很小，藏在一个人的时候。',
  },
  jinyu: {
    id: 'jinyu',
    name: '烬羽',
    en: 'JINYU',
    title: '飒酷叛逆系 · 红月余烬',
    element: '绯红烬火',
    elementIcon: '❂',
    weapon: '绯羽长刀',
    intro: '被全星域通缉的偷火者。七年来只做一件事：收集火种，把烧毁的故乡重新点燃。',
    tags: ['飒酷', '神秘', '长刀', '红月'],
    colors: {
      primary: '#fb7185',
      deep: '#e11d48',
      soft: '#ffe4e6',
      aura: 'rgba(244,63,94,0.30)',
      hairA: '#2a2333',
      hairB: '#8e2447',
      eyeA: '#fb8f8f',
      eyeB: '#c22430',
      clothA: '#221f30',
      clothB: '#3a3348',
    },
    bgVariant: 'ember',
    blessing: { name: '烬火余温', desc: '你的攻击附带 6 点灼烧伤害' },
    skill: { name: '绯色羽刃 · 燎原', desc: '造成 28–38 点星辉伤害（附带灼烧）' },
    battleLine: '想死吗？……不，我是说，站到我身后来。',
    voice: '嘴上全是刺，袖子里全是糖。',
  },
}

// 好感度阶段
export const AFF_TIERS = [
  { min: 0, name: '陌生', desc: '星海中刚刚交汇的两粒光尘' },
  { min: 20, name: '相识', desc: '她开始记得你说过的话' },
  { min: 40, name: '信赖', desc: '愿意把心事说给你听' },
  { min: 70, name: '心动', desc: '星辰为你们的光芒让路' },
  { min: 90, name: '永恒羁绊', desc: '跨越次元也想再见的人' },
]

export function affTier(aff) {
  let t = AFF_TIERS[0]
  for (const tier of AFF_TIERS) if (aff >= tier.min) t = tier
  return t
}

export function charOf(id) {
  return CHARACTERS[id]
}
