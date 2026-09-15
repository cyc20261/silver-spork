// ==========================
// 收集系统：星空图鉴 / 角色语录 / 回忆片段 / 永久遗物 / 星藏收集
// ==========================

export const CODEX_CATS = {
  star: { name: '星空图鉴', icon: '✦', desc: '散落在星溯领域各处的星域坐标' },
  quote: { name: '角色语录', icon: '❝', desc: '想被记住的话，就写进语录里' },
  memory: { name: '回忆片段', icon: '📷', desc: '与她们共同刻下的、不会褪色的瞬间' },
  relic: { name: '永久遗物', icon: '◈', desc: '获得即永久生效的星界宝物，无需使用' },
  treasure: { name: '星藏收集', icon: '❋', desc: '散落各处的收集品，集齐有惊喜' },
}

/* 永久遗物（获得即生效） */
export const RELICS = [
  {
    id: 'it-r-compass', cat: 'relic', name: '星界罗盘', imgKey: 'compass', hue: 0,
    hint: '序章教学战通关掉落',
    effect: '全队速度永久提升，战斗开始时有较高概率抢占先手',
    desc: '银炼星盘内封存着一缕次元之风。获得后，你在战斗开始时更容易抢占先机。',
  },
  {
    id: 'it-r-badge', cat: 'relic', name: '观测者徽章', imgKey: 'badge', hue: 0,
    hint: '第三章战斗通关掉落',
    effect: '剧情选项的好感度提升幅度永久 +10%',
    desc: '以星鲸之羽制成的观测者徽记。获得后，你说出的每一句话都更容易被她们记住。',
  },
  {
    id: 'it-r-charm', cat: 'relic', name: '星之护符', imgKey: 'charm', hue: 0,
    hint: '第五章战斗通关掉落',
    effect: '全队最大生命值永久 +15',
    desc: '凝着月光的水滴形护符。获得后，星光将一直守护你的生命。',
  },
  {
    id: 'it-r-lens', cat: 'relic', name: '碎星透镜', imgKey: 'lens', hue: 0,
    hint: '终章Boss战通关掉落',
    effect: '战斗中可以查看怪物的完整血量',
    desc: '碎裂的星镜残片，仍能映照真实。获得后，敌方血量将完全解析。',
  },
]

/* 星藏收集 */
export const TREASURES = [
  ...[1, 2, 3, 4, 5].map((n) => ({
    id: `tr-page-${n}`, cat: 'treasure', name: `褪色星图残页 · ${{ 1: '壹', 2: '贰', 3: '叁', 4: '肆', 5: '伍' }[n]}`,
    imgKey: 'page', hue: (n - 1) * 42,
    desc: `褪色的星图残页（第 ${n} 张）。上面仍能辨认出几道星轨的墨线。`,
    hint: '星溯领域各处 · 剧情解锁',
  })),
  ...[1, 2, 3, 4].map((n) => ({
    id: `tr-score-${n}`, cat: 'treasure', name: `星域歌谣乐谱 · 之${{ 1: '一', 2: '二', 3: '三', 4: '四' }[n]}`,
    imgKey: 'score', hue: (n - 1) * 60,
    desc: `以星羽笔写就的歌谣乐谱（第 ${n} 份），音符间夹着轻轻的哼唱。`,
    hint: '星灵的二三事 · 剧情解锁',
  })),
  {
    id: 'tr-meteor', cat: 'treasure', name: '陨落流星碎片', imgKey: 'meteor', hue: 0,
    desc: '普通怪物身上掉落的流星残刃，触手微温——那是它坠落时燃烧过的证明。',
    hint: '普通怪物战斗掉落',
  },
  {
    id: 'tr-relief', cat: 'treasure', name: '远古星灵浮雕', imgKey: 'relief', hue: 0,
    desc: 'BOSS身上剥落的远古浮雕，玫瑰与星纹的雕工来自失落的时代。',
    hint: 'BOSS战斗掉落',
  },
  {
    id: 'tr-lore', cat: 'treasure', name: '世界观档案 · 星溯领域', imgKey: 'page', hue: 200,
    desc: '集齐五张星图残页后复原的档案：星溯领域是万千次元的观测夹层，星灵是它仅存的守望者——而暗蚀，是观测被遗忘后滋生的影子。',
    hint: '集齐 5 张褪色星图残页',
  },
  {
    id: 'tr-voice', cat: 'treasure', name: '角色语音集 · 四重奏', imgKey: 'score', hue: 200,
    desc: '集齐四份乐谱后解锁的语音片段：「要记得大声笑哦」「……别死在别处」「一起看日出吧」「火种烧完了就再捡柴」。',
    hint: '集齐 4 份星域歌谣乐谱',
  },
]

export const PAGE_IDS = [1, 2, 3, 4, 5].map((n) => `tr-page-${n}`)
export const SCORE_IDS = [1, 2, 3, 4].map((n) => `tr-score-${n}`)

const BASE_CODEX = [
  // ---------- 星空图鉴（9） ----------
  {
    id: 'cp-compass', cat: 'star', char: null,
    name: '溯星罗盘',
    desc: '误入星溯领域时出现在掌心的白银罗盘。它的指针不指北，只指向「与你羁绊最深的人」。',
    hint: '序章 · 自动解锁',
  },
  {
    id: 'st-xb-1', cat: 'star', char: 'xingbai',
    name: '白鲸座',
    desc: '每年一度游过白之圣所上空的星鲸群。传说对着领头的那头许愿，梦会变得很轻很轻。',
    hint: '星白线 第一章 · 解锁',
  },
  {
    id: 'st-xb-2', cat: 'star', char: 'xingbai',
    name: '竖琴星环',
    desc: '围绕圣所尖顶旋转的七枚光弦。星白弹琴时，它们会跟着一起共鸣。',
    hint: '星白线 第二章 · 解锁',
  },
  {
    id: 'st-ly-1', cat: 'star', char: 'linyue',
    name: '月轮座',
    desc: '守望台三千夜记录里最亮的一组星轨，形状像一枚拉满的弓月。',
    hint: '凛月线 第一章 · 解锁',
  },
  {
    id: 'st-ly-2', cat: 'star', char: 'linyue',
    name: '环月轨道',
    desc: '环绕月球背面的寂静之路。行走其上，连心跳都会被月光调成同频。',
    hint: '凛月线 第二章 · 解锁',
  },
  {
    id: 'st-yg-1', cat: 'star', char: 'yaoguang',
    name: '葵阳星田',
    desc: '一望无际的金色花海，每一株向日葵都追着同一颗太阳。',
    hint: '瑶光线 第一章 · 解锁',
  },
  {
    id: 'st-yg-2', cat: 'star', char: 'yaoguang',
    name: '流星花园',
    desc: '云端秋千能荡到的最高处。据说从这里喊出的「早上好」，太阳都听得见。',
    hint: '瑶光线 第二章 · 解锁',
  },
  {
    id: 'st-jy-1', cat: 'star', char: 'jinyu',
    name: '红月残环',
    desc: '红月周围破碎的光环，是七年前那场大火烧剩的遗产。',
    hint: '烬羽线 第一章 · 解锁',
  },
  {
    id: 'st-jy-2', cat: 'star', char: 'jinyu',
    name: '烬星带',
    desc: '禁域深处漂浮的余烬星屑。风起时，它们会发出炉火一样的暖光。',
    hint: '烬羽线 第二章 · 解锁',
  },
  {
    id: 'st-abyss', cat: 'star', char: null,
    name: '星渊主君',
    desc: '暗蚀的本源。破碎星冠之下只有一枚赤红眼核——它曾在星渊里沉默了亿万年，直到学会饥饿。',
    hint: '任意线 终章 · 击败星渊主君',
  },

  // ---------- 角色语录 · 星白（4） ----------
  {
    id: 'qt-xb-1', cat: 'quote', char: 'xingbai',
    name: '星白 · 语录 Ⅰ',
    desc: '「只要还有人愿意听，星星就不会熄灭。」',
    hint: '星白线 第一章 · 达成',
  },
  {
    id: 'qt-xb-2', cat: 'quote', char: 'xingbai',
    name: '星白 · 语录 Ⅱ',
    desc: '「原来并肩作战，是这样的感觉。谢谢你，我的观测者。」',
    hint: '星白线 第三章 · 战斗胜利后',
  },
  {
    id: 'qt-xb-40', cat: 'quote', char: 'xingbai',
    name: '星白 · 语录 Ⅲ',
    desc: '「你来的日子，圣所的星灯都会提前亮一盏。」',
    hint: '星白好感度达到 40',
  },
  {
    id: 'qt-xb-80', cat: 'quote', char: 'xingbai',
    name: '星白 · 语录 Ⅳ',
    desc: '「如果治愈有形状，那大概就是——你转头看我的样子。」',
    hint: '星白好感度达到 80',
  },

  // ---------- 角色语录 · 凛月（4） ----------
  {
    id: 'qt-ly-1', cat: 'quote', char: 'linyue',
    name: '凛月 · 语录 Ⅰ',
    desc: '「守望台禁止入内。……现在，破例。」',
    hint: '凛月线 第一章 · 达成',
  },
  {
    id: 'qt-ly-2', cat: 'quote', char: 'linyue',
    name: '凛月 · 语录 Ⅱ',
    desc: '「站在我剑光照得到的地方。别死在别处，麻烦。」',
    hint: '凛月线 第三章 · 战斗胜利后',
  },
  {
    id: 'qt-ly-40', cat: 'quote', char: 'linyue',
    name: '凛月 · 语录 Ⅲ',
    desc: '「你的名字，我写了三遍才没写歪。别问为什么。」',
    hint: '凛月好感度达到 40',
  },
  {
    id: 'qt-ly-80', cat: 'quote', char: 'linyue',
    name: '凛月 · 语录 Ⅳ',
    desc: '「月轨很长，长到我开始害怕终点。有你之后——不怕了。」',
    hint: '凛月好感度达到 80',
  },

  // ---------- 角色语录 · 瑶光（4） ----------
  {
    id: 'qt-yg-1', cat: 'quote', char: 'yaoguang',
    name: '瑶光 · 语录 Ⅰ',
    desc: '「我叫瑶光！葵阳星田的管理员兼第一护卫兼……总之超厉害的！」',
    hint: '瑶光线 第一章 · 达成',
  },
  {
    id: 'qt-yg-2', cat: 'quote', char: 'yaoguang',
    name: '瑶光 · 语录 Ⅱ',
    desc: '「副队长第一战完美！奖励是——明天的日出，分你一半！」',
    hint: '瑶光线 第三章 · 战斗胜利后',
  },
  {
    id: 'qt-yg-40', cat: 'quote', char: 'yaoguang',
    name: '瑶光 · 语录 Ⅲ',
    desc: '「你笑的时候，田里的向日葵全都转向你哦。我数过了，一朵都没跑偏。」',
    hint: '瑶光好感度达到 40',
  },
  {
    id: 'qt-yg-80', cat: 'quote', char: 'yaoguang',
    name: '瑶光 · 语录 Ⅳ',
    desc: '「星星落单会变暗——所以我把所有的光，都调成了你的频道。」',
    hint: '瑶光好感度达到 80',
  },

  // ---------- 角色语录 · 烬羽（4） ----------
  {
    id: 'qt-jy-1', cat: 'quote', char: 'jinyu',
    name: '烬羽 · 语录 Ⅰ',
    desc: '「想死吗？……不，我是说，站到我身后来。」',
    hint: '烬羽线 第一章 · 达成',
  },
  {
    id: 'qt-jy-2', cat: 'quote', char: 'jinyu',
    name: '烬羽 · 语录 Ⅱ',
    desc: '「别站在我前面。我不习惯——有人挡在我和危险之间。」',
    hint: '烬羽线 第三章 · 战斗胜利后',
  },
  {
    id: 'qt-jy-40', cat: 'quote', char: 'jinyu',
    name: '烬羽 · 语录 Ⅲ',
    desc: '「灰烬的栏杆上有一颗五角星。看到也不许说出去。」',
    hint: '烬羽好感度达到 40',
  },
  {
    id: 'qt-jy-80', cat: 'quote', char: 'jinyu',
    name: '烬羽 · 语录 Ⅳ',
    desc: '「火种烧完了怎么办？那就再捡柴。反正这次，火边有两个人。」',
    hint: '烬羽好感度达到 80',
  },

  // ---------- 回忆片段 · 序章 ----------
  {
    id: 'mem-p-1', cat: 'memory', char: null,
    name: '星海初醒',
    desc: '倒悬的星海之上，掌心的罗盘第一次轻轻震动——故事的开始，总是这样毫无预兆。',
    hint: '序章 · 自动解锁',
  },

  // ---------- 回忆片段 · 星白（3） ----------
  {
    id: 'mem-xb-1', cat: 'memory', char: 'xingbai',
    name: '星鲸的摇篮曲',
    desc: '光鲸跃出云海，星光如雨。她哼着母亲教的歌，星鲸幼崽在她怀中睡熟了。',
    hint: '星白线 第二章',
  },
  {
    id: 'mem-xb-2', cat: 'memory', char: 'xingbai',
    name: '月白色茶会',
    desc: '星轨茶在杯中转出小小的银河。那晚之后，圣所的星灯似乎比以往更亮了一些。',
    hint: '星白线 第四章',
  },
  {
    id: 'mem-xb-3', cat: 'memory', char: 'xingbai',
    name: '并肩之夜',
    desc: '巨蟒化作漫天萤火。她的手还微微发抖，却笑得像卸下了千斤重担。',
    hint: '星白线 第五章 · 战斗胜利后',
  },

  // ---------- 回忆片段 · 凛月（3） ----------
  {
    id: 'mem-ly-1', cat: 'memory', char: 'linyue',
    name: '月背剪影',
    desc: '月背的阴影里，她说完了那个三百年前的约定。回程的路上，她近了半步。',
    hint: '凛月线 第二章',
  },
  {
    id: 'mem-ly-2', cat: 'memory', char: 'linyue',
    name: '同行者名册',
    desc: '记录板「同行者」一栏多了一个歪歪扭扭的新名字——某位守望者深夜偷偷描上去的。',
    hint: '凛月线 第四章',
  },
  {
    id: 'mem-ly-3', cat: 'memory', char: 'linyue',
    name: '月升时刻',
    desc: '坠月之影崩解成星尘。她抬头时月光正好落在脸上：「原来有同伴的战场，是这么亮的。」',
    hint: '凛月线 第五章 · 战斗胜利后',
  },

  // ---------- 回忆片段 · 瑶光（3） ----------
  {
    id: 'mem-yg-1', cat: 'memory', char: 'yaoguang',
    name: '云端秋千',
    desc: '荡到最高点时，整片云海被朝阳点燃。这是她的秘密基地，你是第一个被带来的人。',
    hint: '瑶光线 第二章',
  },
  {
    id: 'mem-yg-2', cat: 'memory', char: 'yaoguang',
    name: '太阳雨的木屋',
    desc: '雨滴裹着夕阳，像流动的琥珀。小声说完的心事，比大声的笑更重。',
    hint: '瑶光线 第四章',
  },
  {
    id: 'mem-yg-3', cat: 'memory', char: 'yaoguang',
    name: '夺回的太阳',
    desc: '太阳重新升起。她浑身是土，却笑得比朝阳还亮：「下次，换我保护你哦。」',
    hint: '瑶光线 第五章 · 战斗胜利后',
  },

  // ---------- 回忆片段 · 烬羽（3） ----------
  {
    id: 'mem-jy-1', cat: 'memory', char: 'jinyu',
    name: '红月之下',
    desc: '废墟天台上，她摊开七年攒下的火种。那晚她分了你半块烤星薯，金色的甜。',
    hint: '烬羽线 第二章',
  },
  {
    id: 'mem-jy-2', cat: 'memory', char: 'jinyu',
    name: '灰烬雨的屋檐',
    desc: '灰白的雨丝在红月里明明灭灭。她在积灰的栏杆上画了颗五角星，又飞快抹掉。',
    hint: '烬羽线 第四章',
  },
  {
    id: 'mem-jy-3', cat: 'memory', char: 'jinyu',
    name: '迟到的烟火',
    desc: '本源之影崩解成漫天红烬，像一场迟到了七年的烟火。「比我想象中好看。」',
    hint: '烬羽线 第五章 · 战斗胜利后',
  },
]

export const CODEX = [...BASE_CODEX, ...RELICS, ...TREASURES]

export const CODEX_MAP = Object.fromEntries(CODEX.map((c) => [c.id, c]))

export function codexByCat(cat) {
  return CODEX.filter((c) => c.cat === cat)
}
