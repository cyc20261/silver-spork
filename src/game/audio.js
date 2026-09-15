// ==========================
// 程序化音频引擎（Web Audio API）
//
// 设计取舍：全部音乐与音效都由代码实时合成，不加载任何音频文件。
//   · 零下载体积 —— 符合本项目「图片都要压到 0.8MB」的带宽现状
//   · 零版权风险 —— 不存在任何采样素材
//   · 代价：音色是合成器风格（氛围 Pad + 正弦铃音 + 噪声打击），不是真实乐器
//
// 组成：
//   1. 总线：master → bgmBus / sfxBus，独立增益便于 BGM 淡入淡出
//   2. SFX：每个技能/动作一个独立音色，用「音高走向 + 波形 + 噪声 + 滤波器包络」区分
//   3. BGM：8 分音符步进音序器，每条线有各自的调式与织体
//   4. TTS：用浏览器内置语音朗读剧情独白（不是真人配音）
//
// 浏览器自动播放策略：AudioContext 必须在用户手势后才能真正出声，
// 因此由 App 层在首次点击/按键时调用 unlock()。
// ==========================

const STORE_KEY = 'startrace_audio_v1'

const settings = { muted: false, volume: 0.7, voice: false, voiceRate: 1.0 }
let loaded = false

function loadSettings() {
  if (loaded || typeof localStorage === 'undefined') return
  loaded = true
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) Object.assign(settings, JSON.parse(raw))
  } catch {
    /* 存储不可用时用默认值 */
  }
}

function saveSettings() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(settings))
  } catch {
    /* ignore */
  }
}

/* ---------- 音频上下文与总线 ---------- */
let ctx = null
let master = null
let bgmBus = null
let sfxBus = null

export function isReady() {
  return !!ctx
}

export function unlock() {
  loadSettings()
  const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)
  if (!AC) return false
  if (!ctx) {
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = settings.muted ? 0 : settings.volume
    master.connect(ctx.destination)

    bgmBus = ctx.createGain()
    bgmBus.gain.value = 0.5
    bgmBus.connect(master)

    sfxBus = ctx.createGain()
    sfxBus.gain.value = 1
    sfxBus.connect(master)
  }
  if (ctx.state === 'suspended') ctx.resume()
  return true
}

/* ---------- 设置 ---------- */
export function getSettings() {
  loadSettings()
  return { ...settings }
}

function applyVolume() {
  if (master) master.gain.setTargetAtTime(settings.muted ? 0 : settings.volume, ctx.currentTime, 0.05)
}

export function setMuted(v) {
  loadSettings()
  settings.muted = !!v
  applyVolume()
  saveSettings()
}

export function toggleMuted() {
  setMuted(!getSettings().muted)
  return getSettings().muted
}

export function setVolume(v) {
  loadSettings()
  settings.volume = Math.max(0, Math.min(1, v))
  applyVolume()
  saveSettings()
}

export function setVoice(on) {
  loadSettings()
  settings.voice = !!on
  if (!settings.voice) stopSpeak()
  saveSettings()
}

/* ---------- 合成基元 ---------- */
const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12)

/** 单音：波形 + 滤波 + 音量包络，可做滑音 */
function tone({
  at = 0, freq = 440, to = null, type = 'sine', dur = 0.25, gain = 0.25,
  attack = 0.006, curve = 'exp', detune = 0, cutoff = 6000, q = 1, bus = null,
}) {
  if (!ctx) return
  const t = ctx.currentTime + at
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  const f = ctx.createBiquadFilter()

  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur)
  if (detune) osc.detune.value = detune

  f.type = 'lowpass'
  f.frequency.setValueAtTime(cutoff, t)
  f.Q.value = q

  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + attack)
  if (curve === 'exp') g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  else g.gain.linearRampToValueAtTime(0.0001, t + dur)

  osc.connect(f)
  f.connect(g)
  g.connect(bus || sfxBus)
  osc.start(t)
  osc.stop(t + dur + 0.05)
}

/** 噪声：用于打击、撕裂、爆发等质感 */
function noise({ at = 0, dur = 0.2, gain = 0.2, from = 4000, to = 400, type = 'lowpass', q = 1, bus = null }) {
  if (!ctx) return
  const t = ctx.currentTime + at
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur))
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1

  const src = ctx.createBufferSource()
  src.buffer = buf
  const f = ctx.createBiquadFilter()
  f.type = type
  f.Q.value = q
  f.frequency.setValueAtTime(from, t)
  f.frequency.exponentialRampToValueAtTime(Math.max(40, to), t + dur)

  const g = ctx.createGain()
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)

  src.connect(f)
  f.connect(g)
  g.connect(bus || sfxBus)
  src.start(t)
  src.stop(t + dur)
}

/* ==========================================================
   音效库：每个技能一个独立音色
   区分手段：音高走向（上/下/平）、波形、噪声成分、时长、和声
   ========================================================== */
const SFX = {
  /* ---- UI ---- */
  click: () => {
    tone({ freq: 880, type: 'triangle', dur: 0.07, gain: 0.16, cutoff: 5000 })
    tone({ at: 0.03, freq: 1320, type: 'sine', dur: 0.09, gain: 0.1 })
  },
  hover: () => tone({ freq: 1500, type: 'sine', dur: 0.05, gain: 0.05 }),
  confirm: () => {
    ;[659, 880, 1175].forEach((f, i) => tone({ at: i * 0.06, freq: f, type: 'triangle', dur: 0.22, gain: 0.14 }))
  },
  cancel: () => {
    tone({ freq: 440, to: 260, type: 'triangle', dur: 0.18, gain: 0.14 })
  },
  unlock: () => {
    ;[784, 988, 1319, 1568].forEach((f, i) => tone({ at: i * 0.075, freq: f, type: 'sine', dur: 0.5, gain: 0.13 }))
    noise({ at: 0.28, dur: 0.5, gain: 0.05, from: 6000, to: 2000, type: 'highpass' })
  },
  toast: () => {
    tone({ freq: 1046, type: 'sine', dur: 0.16, gain: 0.12 })
    tone({ at: 0.07, freq: 1568, type: 'sine', dur: 0.2, gain: 0.08 })
  },
  type: () => tone({ freq: 1800 + Math.random() * 500, type: 'square', dur: 0.022, gain: 0.028, cutoff: 3000 }),
  page: () => noise({ dur: 0.18, gain: 0.07, from: 3000, to: 900, type: 'bandpass', q: 0.8 }),

  /* ---- 玩家动作 ---- */
  slash: () => {
    noise({ dur: 0.16, gain: 0.3, from: 7000, to: 900, type: 'bandpass', q: 1.2 })
    tone({ freq: 1400, to: 500, type: 'sawtooth', dur: 0.14, gain: 0.14, cutoff: 4000 })
  },
  hit: () => {
    tone({ freq: 180, to: 60, type: 'square', dur: 0.16, gain: 0.3, cutoff: 1200 })
    noise({ dur: 0.12, gain: 0.22, from: 3000, to: 400 })
  },
  crit: () => {
    tone({ freq: 320, to: 80, type: 'sawtooth', dur: 0.28, gain: 0.34, cutoff: 2600 })
    noise({ dur: 0.22, gain: 0.3, from: 8000, to: 600 })
    tone({ at: 0.02, freq: 1760, type: 'square', dur: 0.12, gain: 0.12 })
  },
  dodge: () => {
    noise({ dur: 0.3, gain: 0.14, from: 500, to: 5000, type: 'bandpass', q: 1.5 })
    tone({ freq: 300, to: 1800, type: 'sine', dur: 0.26, gain: 0.1 })
  },
  heal: () => {
    ;[523, 659, 784, 1046].forEach((f, i) =>
      tone({ at: i * 0.08, freq: f, type: 'sine', dur: 0.7, gain: 0.13, attack: 0.05 }),
    )
    noise({ at: 0.1, dur: 0.7, gain: 0.04, from: 2000, to: 7000, type: 'highpass' })
  },
  guard: () => {
    tone({ freq: 220, type: 'triangle', dur: 0.3, gain: 0.2, cutoff: 900 })
    noise({ dur: 0.14, gain: 0.14, from: 1200, to: 300 })
  },
  lose: () => {
    ;[392, 349, 294, 233].forEach((f, i) => tone({ at: i * 0.28, freq: f, type: 'triangle', dur: 0.7, gain: 0.16, attack: 0.03 }))
    noise({ at: 0.9, dur: 1.2, gain: 0.06, from: 900, to: 120 })
  },
  win: () => {
    ;[523, 659, 784, 1046, 1319].forEach((f, i) => tone({ at: i * 0.13, freq: f, type: 'triangle', dur: 0.75, gain: 0.17 }))
    noise({ at: 0.5, dur: 1.1, gain: 0.05, from: 5000, to: 1500, type: 'highpass' })
  },

  /* ---- 玩家星技（四种角色各不相同） ---- */
  meteor: () => {
    // 白昼流星：坠落 + 撞击
    for (let i = 0; i < 5; i++) noise({ at: i * 0.07, dur: 0.34, gain: 0.16, from: 2200, to: 400, type: 'bandpass', q: 2 })
    tone({ at: 0.3, freq: 120, to: 40, type: 'sine', dur: 0.5, gain: 0.34 })
    ;[784, 988, 1319].forEach((f, i) => tone({ at: 0.32 + i * 0.05, freq: f, type: 'triangle', dur: 0.6, gain: 0.14 }))
  },
  moonslash: () => {
    // 月影千华斩：多层金属切割
    for (let i = 0; i < 4; i++) {
      tone({ at: i * 0.09, freq: 2200 - i * 260, to: 700, type: 'sawtooth', dur: 0.3, gain: 0.15, cutoff: 6000, q: 3 })
      noise({ at: i * 0.09, dur: 0.2, gain: 0.14, from: 9000, to: 2200, type: 'bandpass', q: 2.4 })
    }
    tone({ at: 0.34, freq: 1568, type: 'sine', dur: 0.8, gain: 0.12 })
  },
  sunburst: () => {
    // 阳光爆裂：明亮上行 + 强冲击
    for (let i = 0; i < 12; i++) tone({ at: i * 0.028, freq: 523 * Math.pow(2, i / 12), type: 'square', dur: 0.14, gain: 0.07, cutoff: 5000 })
    noise({ at: 0.32, dur: 0.4, gain: 0.26, from: 9000, to: 800 })
    tone({ at: 0.32, freq: 180, to: 55, type: 'sine', dur: 0.5, gain: 0.32 })
  },
  feather: () => {
    // 绯色羽刃：灼热横扫
    for (let i = 0; i < 7; i++)
      noise({ at: i * 0.055, dur: 0.26, gain: 0.15, from: 5200 - i * 300, to: 700, type: 'bandpass', q: 1.4 })
    tone({ freq: 260, to: 90, type: 'sawtooth', dur: 0.5, gain: 0.22, cutoff: 2400 })
    tone({ at: 0.2, freq: 1175, to: 880, type: 'triangle', dur: 0.4, gain: 0.1 })
  },

  /* ---- 敌方技能（11 个各不相同） ---- */
  stardust: () => {
    // 星屑弹：短促高频弹丸
    ;[1319, 1046].forEach((f, i) => tone({ at: i * 0.08, freq: f, to: f * 0.6, type: 'sine', dur: 0.18, gain: 0.16 }))
    noise({ dur: 0.1, gain: 0.1, from: 6000, to: 2500, type: 'highpass' })
  },
  shadowtouch: () => {
    // 暗影触碰：低频黏滞下滑
    tone({ freq: 220, to: 70, type: 'sine', dur: 0.42, gain: 0.26, cutoff: 700 })
    noise({ dur: 0.36, gain: 0.14, from: 900, to: 200 })
  },
  shadowclaw: () => {
    // 影爪：三道撕裂噪声
    for (let i = 0; i < 3; i++) noise({ at: i * 0.075, dur: 0.13, gain: 0.26, from: 7500, to: 1200, type: 'bandpass', q: 2.6 })
  },
  voidbite: () => {
    // 虚空撕咬：沉重咬合 + 低频
    tone({ freq: 150, to: 45, type: 'square', dur: 0.32, gain: 0.32, cutoff: 900 })
    noise({ dur: 0.26, gain: 0.3, from: 2600, to: 260 })
    noise({ at: 0.1, dur: 0.2, gain: 0.18, from: 1800, to: 300 })
  },
  starscythe: () => {
    // 星镰斩：金属长刃
    tone({ freq: 3200, to: 900, type: 'sawtooth', dur: 0.4, gain: 0.16, cutoff: 8000, q: 4 })
    noise({ dur: 0.34, gain: 0.2, from: 10000, to: 2600, type: 'bandpass', q: 2.2 })
    tone({ at: 0.14, freq: 1319, type: 'sine', dur: 0.5, gain: 0.1 })
  },
  voidrift: () => {
    // 虚空裂隙（蓄力）：空间被撕开的上行嘶鸣
    tone({ freq: 90, to: 620, type: 'sawtooth', dur: 0.85, gain: 0.2, cutoff: 2600, q: 3 })
    noise({ dur: 0.9, gain: 0.16, from: 300, to: 6500, type: 'bandpass', q: 2 })
    tone({ at: 0.5, freq: 1760, type: 'sine', dur: 0.4, gain: 0.07 })
  },
  voidriftx: () => {
    // 虚空裂隙·斩：裂隙闭合的毁灭一击
    noise({ dur: 0.5, gain: 0.36, from: 9000, to: 300 })
    tone({ freq: 260, to: 45, type: 'sawtooth', dur: 0.6, gain: 0.34, cutoff: 2000 })
    tone({ at: 0.02, freq: 1568, to: 392, type: 'square', dur: 0.4, gain: 0.14 })
  },
  abyssburst: () => {
    // 星渊爆发：短暂的爆发低音
    tone({ freq: 120, to: 38, type: 'sine', dur: 0.6, gain: 0.38 })
    noise({ dur: 0.4, gain: 0.26, from: 4000, to: 300 })
  },
  shatteredpress: () => {
    // 碎星压制：两连击，第二下更重
    noise({ at: 0.0, dur: 0.16, gain: 0.24, from: 5000, to: 700 })
    tone({ at: 0.0, freq: 200, to: 80, type: 'square', dur: 0.18, gain: 0.22, cutoff: 1400 })
    noise({ at: 0.17, dur: 0.24, gain: 0.32, from: 4000, to: 300 })
    tone({ at: 0.17, freq: 140, to: 45, type: 'square', dur: 0.3, gain: 0.3, cutoff: 1100 })
  },
  darkstar: () => {
    // 暗星吞噬：向下吞噬的漩涡
    tone({ freq: 520, to: 60, type: 'sine', dur: 0.75, gain: 0.26 })
    tone({ at: 0.05, freq: 780, to: 90, type: 'triangle', dur: 0.7, gain: 0.14 })
    noise({ at: 0.1, dur: 0.6, gain: 0.12, from: 2200, to: 200, type: 'bandpass', q: 3 })
  },
  dimrift: () => {
    // 次元裂隙（蓄力）：更深、更长的空间裂响
    tone({ freq: 55, to: 380, type: 'sawtooth', dur: 1.0, gain: 0.24, cutoff: 1800, q: 4 })
    noise({ dur: 1.0, gain: 0.18, from: 200, to: 4200, type: 'bandpass', q: 2.4 })
    tone({ at: 0.6, freq: 220, to: 660, type: 'square', dur: 0.35, gain: 0.1 })
  },
  dimriftx: () => {
    // 次元裂隙·灭：全曲最重的一击
    tone({ freq: 90, to: 28, type: 'sawtooth', dur: 0.9, gain: 0.42, cutoff: 2400 })
    noise({ dur: 0.7, gain: 0.4, from: 11000, to: 200 })
    tone({ at: 0.03, freq: 196, to: 49, type: 'square', dur: 0.6, gain: 0.18 })
    noise({ at: 0.25, dur: 0.6, gain: 0.16, from: 900, to: 120 })
  },
  soulharvest: () => {
    // 灵魂收割：诡异的下行鬼气
    ;[1046, 880, 740, 622, 523].forEach((f, i) =>
      tone({ at: i * 0.1, freq: f, to: f * 0.94, type: 'sine', dur: 0.5, gain: 0.14, detune: i * 12 }),
    )
    noise({ at: 0.1, dur: 0.7, gain: 0.12, from: 3400, to: 400, type: 'bandpass', q: 4 })
  },

  /* ---- 剧情/图鉴 ---- */
  memory: () => {
    ;[659, 784, 988, 1319].forEach((f, i) => tone({ at: i * 0.16, freq: f, type: 'sine', dur: 1.1, gain: 0.12, attack: 0.08 }))
    noise({ at: 0.4, dur: 1.2, gain: 0.04, from: 6000, to: 2000, type: 'highpass' })
  },
  chapter: () => {
    tone({ freq: 130, type: 'sine', dur: 1.6, gain: 0.24, attack: 0.3 })
    ;[392, 523, 659].forEach((f, i) => tone({ at: 0.1 + i * 0.2, freq: f, type: 'triangle', dur: 1.2, gain: 0.1, attack: 0.15 }))
  },
}

/** 播放一个音效（名称不存在时静默忽略） */
export function sfx(name, opts = {}) {
  if (!ctx || settings.muted) return
  const fn = SFX[name]
  if (!fn) return
  try {
    fn(opts)
  } catch {
    /* 单个音效失败不应影响游戏 */
  }
}

/* ==========================================================
   背景音乐：8 分音符步进音序器
   主题用「调式 + 织体 + 是否有打击」区分情绪
   ========================================================== */
const minor = (root, shape) => shape.map((s) => root + s)

const THEMES = {
  // 标题：静谧星空，稀疏铃音
  title: {
    bpm: 58, root: 57, scale: [0, 2, 3, 7, 8, 12, 14, 15],
    arp: [0, 4, 2, 5, 3, 7, 5, 2], bass: [-12, -12, -14, -14],
    padWave: 'sine', arpWave: 'triangle', drums: false, padGain: 0.09, arpGain: 0.075,
  },
  // 序章 / 通用剧情：温柔
  story: {
    bpm: 62, root: 55, scale: [0, 2, 4, 7, 9, 12, 14, 16],
    arp: [0, 3, 5, 4, 2, 5, 7, 5], bass: [-12, -12, -10, -10],
    padWave: 'sine', arpWave: 'sine', drums: false, padGain: 0.085, arpGain: 0.07,
  },
  // 星白：明亮大调
  xingbai: {
    bpm: 68, root: 60, scale: [0, 2, 4, 7, 9, 12, 14, 16],
    arp: [0, 4, 2, 4, 5, 4, 2, 0], bass: [-12, -12, -7, -7],
    padWave: 'sine', arpWave: 'triangle', drums: false, padGain: 0.09, arpGain: 0.08,
  },
  // 凛月：冷冽小调，稀疏
  linyue: {
    bpm: 54, root: 57, scale: [0, 2, 3, 7, 8, 12, 15, 14],
    arp: [0, 3, 2, 5, 3, 1, 0, 3], bass: [-12, -14, -12, -16],
    padWave: 'triangle', arpWave: 'sine', drums: false, padGain: 0.095, arpGain: 0.065,
  },
  // 瑶光：活泼
  yaoguang: {
    bpm: 92, root: 62, scale: [0, 2, 4, 7, 9, 12, 14, 16],
    arp: [0, 4, 7, 4, 2, 5, 9, 5], bass: [-12, -5, -7, -5],
    padWave: 'triangle', arpWave: 'square', drums: true, padGain: 0.07, arpGain: 0.06,
  },
  // 烬羽：沉重压抑
  jinyu: {
    bpm: 66, root: 53, scale: [0, 1, 3, 5, 7, 8, 10, 12],
    arp: [0, 2, 4, 3, 1, 4, 6, 4], bass: [-12, -12, -13, -15],
    padWave: 'sawtooth', arpWave: 'triangle', drums: false, padGain: 0.055, arpGain: 0.07,
  },
  // 战斗：节奏驱动
  battle: {
    bpm: 116, root: 50, scale: [0, 3, 5, 7, 10, 12, 15, 10],
    arp: [0, 3, 5, 3, 7, 5, 3, 0], bass: [-12, -12, -10, -12],
    padWave: 'sawtooth', arpWave: 'square', drums: true, padGain: 0.05, arpGain: 0.06,
  },
  // 最终 Boss：压迫、低沉、半音
  boss: {
    bpm: 100, root: 45, scale: [0, 1, 3, 6, 8, 11, 12, 13],
    arp: [0, 1, 4, 3, 0, 6, 4, 1], bass: [-12, -11, -12, -13],
    padWave: 'sawtooth', arpWave: 'sawtooth', drums: true, padGain: 0.07, arpGain: 0.055,
  },
  // 图鉴 / 好感度：安静
  ui: {
    bpm: 60, root: 58, scale: [0, 2, 4, 7, 9, 12, 14, 16],
    arp: [0, 4, 2, 7, 5, 4, 2, 0], bass: [-12, -12, -7, -12],
    padWave: 'sine', arpWave: 'sine', drums: false, padGain: 0.07, arpGain: 0.055,
  },
  // 结局：温暖的收束
  ending: {
    bpm: 64, root: 60, scale: [0, 2, 4, 7, 9, 12, 14, 16],
    arp: [0, 2, 4, 7, 9, 7, 4, 2], bass: [-12, -7, -5, -7],
    padWave: 'sine', arpWave: 'triangle', drums: false, padGain: 0.1, arpGain: 0.075,
  },
}

const bgm = { name: null, timer: null, step: 0, nextAt: 0, gain: null, theme: null }

function padChord(theme, t) {
  const { scale, root } = theme
  const deg = [0, 2, 7] // 主、三、五
  deg.forEach((d, i) => {
    const m = root + scale[d % scale.length] - 12
    tone({
      at: t - ctx.currentTime, freq: midiToFreq(m), type: theme.padWave, dur: 2.6,
      gain: theme.padGain * (i === 0 ? 1 : 0.7), attack: 0.5, cutoff: 1800, bus: bgm.gain,
    })
  })
}

function drumStep(t, step) {
  const rel = t - ctx.currentTime
  if (step % 8 === 0) {
    tone({ at: rel, freq: 150, to: 45, type: 'sine', dur: 0.16, gain: 0.3, bus: bgm.gain })
  }
  if (step % 8 === 4) {
    noise({ at: rel, dur: 0.13, gain: 0.16, from: 6500, to: 2200, type: 'highpass', bus: bgm.gain })
  }
  if (step % 2 === 0) {
    noise({ at: rel, dur: 0.045, gain: 0.055, from: 9000, to: 5000, type: 'highpass', bus: bgm.gain })
  }
}

function scheduleStep(theme, step, t) {
  const rel = t - ctx.currentTime
  const { scale, root, arp, bass } = theme

  // 贝斯：每 2 步
  if (step % 2 === 0) {
    const b = bass[(step / 2) % bass.length]
    tone({ at: rel, freq: midiToFreq(root + b), type: 'triangle', dur: 0.42, gain: 0.13, cutoff: 600, bus: bgm.gain })
  }
  // 琶音：每步
  const a = arp[step % arp.length]
  tone({
    at: rel, freq: midiToFreq(root + 12 + scale[a % scale.length]), type: theme.arpWave,
    dur: 0.3, gain: theme.arpGain, cutoff: 4200, bus: bgm.gain,
  })
  // Pad：每 8 步换和弦
  if (step % 8 === 0) padChord(theme, t)
  // 打击
  if (theme.drums) drumStep(t, step)
}

function tick() {
  if (!ctx || !bgm.theme || !bgm.gain) return
  const theme = bgm.theme
  const stepDur = 60 / theme.bpm / 2
  const now = ctx.currentTime
  // 提前 0.15s 排程，避免定时器抖动
  while (bgm.nextAt < now + 0.15) {
    scheduleStep(theme, bgm.step, bgm.nextAt)
    bgm.step = (bgm.step + 1) % 64
    bgm.nextAt += stepDur
  }
}

/** 切换背景音乐（同主题重复调用不会重启） */
export function playBgm(name, { fade = 1.2 } = {}) {
  if (!ctx) return
  const theme = THEMES[name]
  if (!theme) return
  if (bgm.name === name) return
  loadSettings()

  // 旧 BGM 淡出
  if (bgm.gain) {
    const old = bgm.gain
    old.gain.setTargetAtTime(0, ctx.currentTime, fade / 3)
    setTimeout(() => { try { old.disconnect() } catch { /* ignore */ } }, fade * 1000 + 400)
  }
  clearInterval(bgm.timer)

  bgm.gain = ctx.createGain()
  bgm.gain.gain.setValueAtTime(0.0001, ctx.currentTime)
  bgm.gain.gain.setTargetAtTime(0.34, ctx.currentTime, fade / 3)
  bgm.gain.connect(bgmBus)

  bgm.name = name
  bgm.theme = theme
  bgm.step = 0
  bgm.nextAt = ctx.currentTime + 0.08
  tick()
  bgm.timer = setInterval(tick, 40)
}

export function stopBgm({ fade = 0.8 } = {}) {
  clearInterval(bgm.timer)
  bgm.timer = null
  if (bgm.gain) {
    const g = bgm.gain
    g.gain.setTargetAtTime(0, ctx.currentTime, fade / 3)
    setTimeout(() => { try { g.disconnect() } catch { /* ignore */ } }, fade * 1000 + 400)
  }
  bgm.gain = null
  bgm.theme = null
  bgm.name = null
}

export function currentBgm() {
  return bgm.name
}

/* ==========================================================
   段落独白朗读（浏览器内置 TTS）
   注意：这是系统合成语音，不是真人配音
   ========================================================== */
let speaking = false

export function ttsAvailable() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function pickZhVoice() {
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find((v) => /zh[-_]CN/i.test(v.lang)) ||
    voices.find((v) => /^zh/i.test(v.lang)) ||
    null
  )
}

export function speak(text) {
  if (!ttsAvailable()) return false
  const s = getSettings()
  if (!s.voice || s.muted || !text) return false
  try {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(String(text).replace(/[「」【】]/g, ''))
    const v = pickZhVoice()
    if (v) u.voice = v
    u.lang = 'zh-CN'
    u.rate = s.voiceRate
    u.pitch = 1.06
    u.volume = 0.9
    u.onend = () => { speaking = false }
    u.onerror = () => { speaking = false }
    speaking = true
    window.speechSynthesis.speak(u)
    return true
  } catch {
    return false
  }
}

export function stopSpeak() {
  if (!ttsAvailable()) return
  try { window.speechSynthesis.cancel() } catch { /* ignore */ }
  speaking = false
}

export function isSpeaking() {
  return speaking
}
