// ==========================
// 八大结局：4 角色 × (普通结局 + 真结局)
// 真结局条件：好感度 ≥ 70
// ==========================

import { CHAR_SHORT, TRUE_THRESHOLD } from './characters.js'

export const ENDING_ORDER = [
  'xb-true', 'xb-normal',
  'ly-true', 'ly-normal',
  'yg-true', 'yg-normal',
  'jy-true', 'jy-normal',
]

export const ENDINGS = {
  // ---------- 星白 ----------
  'xb-true': {
    id: 'xb-true', char: 'xingbai', type: 'true',
    title: '永恒的星光之约',
    subtitle: 'TRUE END · 星白',
    bg: 'white',
    lines: [
      '溯星之门的光芒落下的瞬间，门后不是归途——而是亮满星灯的白之圣所。',
      '星白站在光的中央，红着脸，却第一次没有移开眼睛。',
      '「傻瓜……我早就在门上系了星星。你要去的任何地方，我都想一起去。」',
      '从此，平行次元的观测记录里多了一行小字：观测者与治愈星灵，永不失联。',
    ],
    closing: '——那晚之后，白之圣所的摇篮曲，有了两个声部。',
  },
  'xb-normal': {
    id: 'xb-normal', char: 'xingbai', type: 'normal',
    title: '白色的道别',
    subtitle: 'NORMAL END · 星白',
    bg: 'white',
    lines: [
      '你穿过门，回到了深夜的天文台。掌心的罗盘化作一枚白色星坠。',
      '窗外的流星雨如约而至。你轻轻哼起那首摇篮曲，唱到一半有些哽咽。',
      '——很高的地方，好像有人跟着和了一声。',
    ],
    closing: '——治愈星灵还在等一个说好明年再来的旅人。',
  },

  // ---------- 凛月 ----------
  'ly-true': {
    id: 'ly-true', char: 'linyue', type: 'true',
    title: '月与观测者的私语',
    subtitle: 'TRUE END · 凛月',
    bg: 'moon',
    lines: [
      '门亮起的那一刻，有人第一次主动拉住了你的袖口。',
      '力道轻得像月光，却再没有松开。',
      '「……守望台的夜晚很长。」凛月望着别处，耳尖泛红，「长到，刚好够说一辈子的话。」',
      '那一夜，月之守望台的记录板写满了三百年来的第一句闲话。',
    ],
    closing: '——「同行者」一栏，从此再也没有空白过。',
  },
  'ly-normal': {
    id: 'ly-normal', char: 'linyue', type: 'normal',
    title: '月背的沉默',
    subtitle: 'NORMAL END · 凛月',
    bg: 'moon',
    lines: [
      '门关上的瞬间，你听见极远处传来一声几不可闻的「……一路顺风」。',
      '后来你才知道，月之守望台的记录板上，「同行者」一栏并没有清除。',
      '那一页，被折了一个小小的角。',
    ],
    closing: '——守望者不说想念，守望者只是守望。',
  },

  // ---------- 瑶光 ----------
  'yg-true': {
    id: 'yg-true', char: 'yaoguang', type: 'true',
    title: '永昼之约',
    subtitle: 'TRUE END · 瑶光',
    bg: 'sun',
    lines: [
      '门熄灭了。瑶光愣在原地三秒，随即哭着哭着重重抱住你。',
      '「哈——哈哈！赖皮！副队长擅离职守，要受罚的！」',
      '「罚你——罚你每天都要陪我叫醒太阳，罚一辈子！」',
      '葵阳星田的向日葵，从此再没有一朵，是背对着你们的。',
    ],
    closing: '——全星域最响亮的笑声，从此有了回音。',
  },
  'yg-normal': {
    id: 'yg-normal', char: 'yaoguang', type: 'normal',
    title: '太阳雨的假期',
    subtitle: 'NORMAL END · 瑶光',
    bg: 'sun',
    lines: [
      '回到天文台的那个清晨，下了一场太阳雨。',
      '雨滴敲着窗，节奏欢快得像谁在云端荡秋千。',
      '你拉开窗喊了声「早上好」——雨幕深处，好像真的有人回了一声。',
    ],
    closing: '——护卫队队规第一条：不许落单。',
  },

  // ---------- 烬羽 ----------
  'jy-true': {
    id: 'jy-true', char: 'jinyu', type: 'true',
    title: '燃尽千星只为与你同行',
    subtitle: 'TRUE END · 烬羽',
    bg: 'ember',
    lines: [
      '火种点燃的瞬间，溯星之门碎了。',
      '烬羽回头，红瞳里倒映着重生的故乡星：「……谁准你留下来的。」',
      '话是这么说，她却把外套罩在你头上，挡住漫天火星。',
      '「看好了。这颗星从今天起——烧给两个人看。」',
    ],
    closing: '——七年的火种终于落地，落进了另一个人的眼睛里。',
  },
  'jy-normal': {
    id: 'jy-normal', char: 'jinyu', type: 'normal',
    title: '灰烬的余温',
    subtitle: 'NORMAL END · 烬羽',
    bg: 'ember',
    lines: [
      '你没有等到火种点燃，就穿过了门。',
      '天文台的抽屉里，多了一枚边缘烧焦的红色羽毛。',
      '每逢起风，它就微微发烫——像有人在很远的地方，把火守到了天亮。',
    ],
    closing: '——偷火者没有偷火。她只是把火，分给了你一半。',
  },
}

export function resolveEndingId(charId, affection) {
  const short = CHAR_SHORT[charId]
  return affection >= TRUE_THRESHOLD ? `${short}-true` : `${short}-normal`
}
