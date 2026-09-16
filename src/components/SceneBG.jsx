// ==========================
// 场景背景层 v3（GAL 标准：全屏场景图 + 轻微暗化 + 场景切换淡入淡出）
//   star   静谧银河 —— 首页 / 序章与剧情对话
//   void   UI 底图   —— 图鉴 / 好感度 / 选人等面板页（星点克制）
//   white  静谧银河 · 白之圣所  |  moon 星渊暗空 · 月夜
//   sun    璀璨星海 · 晨曦      |  ember 星渊暗空 · 红月
//   battle 星渊暗空 · 中心亮边缘压暗（战斗 UI 专用）
//   ending 璀璨星海 · 浪漫治愈（结局专用）
// 切换 variant 时新场景淡入覆盖旧场景（交叉淡化），动画结束后卸载旧层
// ==========================

import { useEffect, useRef, useState } from 'react'
import galaxy from '../assets/bg/galaxy.webp'
import abyssBg from '../assets/bg/abyss.webp'
import pastel from '../assets/bg/pastel.webp'
import ui from '../assets/bg/ui.webp'

const LAYERS = {
  star: { src: galaxy, top: 'rgba(11,16,38,0.28)', bottom: 'rgba(13,18,44,0.58)', decor: 'aurora' },
  void: { src: ui, top: 'rgba(11,16,38,0.5)', bottom: 'rgba(9,13,32,0.74)', decor: null },
  white: { src: galaxy, top: 'rgba(186,230,253,0.14)', bottom: 'rgba(15,23,42,0.52)', decor: 'white' },
  moon: { src: abyssBg, top: 'rgba(30,27,75,0.42)', bottom: 'rgba(8,8,26,0.68)', decor: 'moon' },
  sun: { src: pastel, top: 'rgba(255,240,205,0.12)', bottom: 'rgba(96,48,12,0.52)', decor: 'sun' },
  ember: { src: abyssBg, top: 'rgba(64,5,22,0.64)', bottom: 'rgba(6,2,10,0.82)', decor: 'ember' },
  battle: { src: abyssBg, vignette: true, decor: null },
  ending: { src: pastel, top: 'rgba(84,66,150,0.30)', bottom: 'rgba(26,21,64,0.66)', decor: 'petals' },
}

function Moon({ color = '#e0e7ff', glow = '#a5b4fc', x = '78%', y = '16%', size = 130, opacity = 0.9 }) {
  return (
    <div
      className="anim-drift absolute rounded-full"
      style={{
        left: x, top: y, width: size, height: size,
        background: `radial-gradient(circle at 38% 35%, ${color} 0%, ${color}cc 55%, ${glow}55 72%, transparent 78%)`,
        boxShadow: `0 0 60px 22px ${glow}44`,
        opacity,
      }}
    />
  )
}

function Embers() {
  const bits = Array.from({ length: 14 }, (_, i) => i)
  return (
    <>
      {bits.map((i) => (
        <span
          key={i}
          className="anim-ember absolute rounded-full"
          style={{
            left: `${(i * 71 + 13) % 96}%`,
            bottom: '-12px',
            width: i % 3 === 0 ? 5 : 3,
            height: i % 3 === 0 ? 5 : 3,
            background: i % 2 ? '#fda4af' : '#fbbf24',
            boxShadow: '0 0 10px 3px rgba(251,113,133,0.45)',
            animationDelay: `${(i * 0.9) % 9}s`,
            animationDuration: `${7 + (i % 5)}s`,
          }}
        />
      ))}
    </>
  )
}

function Petals({ count = 10 }) {
  const bits = Array.from({ length: count }, (_, i) => i)
  return (
    <>
      {bits.map((i) => (
        <span
          key={i}
          className="anim-petal absolute"
          style={{
            left: `${(i * 83 + 21) % 94}%`,
            top: '-16px',
            width: 9,
            height: 12,
            borderRadius: '60% 40% 60% 40%',
            background: i % 2 ? 'rgba(255,255,255,0.8)' : 'rgba(253,230,138,0.75)',
            animationDelay: `${(i * 1.3) % 8}s`,
            animationDuration: `${8 + (i % 4)}s`,
          }}
        />
      ))}
    </>
  )
}

function Cloud({ x, y, w, o = 0.14, dur = 60, delay = 0 }) {
  return (
    <span
      className="anim-cloud absolute rounded-full"
      style={{
        left: `${x}%`, top: `${y}%`, width: w, height: w * 0.22,
        background: 'linear-gradient(90deg, transparent, rgba(199,210,254,0.9), transparent)',
        opacity: o,
        animationDuration: `${dur}s`,
        animationDelay: `${delay}s`,
      }}
    />
  )
}

function Aurora() {
  return (
    <svg className="anim-aurora absolute inset-x-0 top-[6%] h-[55%] w-full" viewBox="0 0 1000 400" preserveAspectRatio="none" style={{ opacity: 0.18 }}>
      <defs>
        <linearGradient id="au" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#67e8f9" stopOpacity="0" />
          <stop offset="35%" stopColor="#a5b4fc" />
          <stop offset="65%" stopColor="#f0abfc" />
          <stop offset="100%" stopColor="#67e8f9" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 220 C180 120 320 300 500 180 C680 60 820 260 1000 150 L1000 260 C820 370 680 170 500 290 C320 410 180 230 0 330 Z" fill="url(#au)" opacity="0.55" />
      <path d="M0 120 C200 40 360 210 520 110 C700 0 840 180 1000 70 L1000 130 C840 240 700 60 520 170 C360 270 200 100 0 180 Z" fill="url(#au)" opacity="0.35" />
    </svg>
  )
}

function Decor({ kind }) {
  if (!kind) return null
  if (kind === 'aurora') return <Aurora />
  if (kind === 'white')
    return (
      <>
        <Moon x="74%" y="12%" size={92} color="#f8fafc" glow="#bae6fd" opacity={0.8} />
        <Cloud x={-10} y={26} w={420} o={0.15} dur={70} />
        <Cloud x={30} y={64} w={520} o={0.1} dur={90} delay={-30} />
      </>
    )
  if (kind === 'moon')
    return (
      <>
        <Moon x="70%" y="10%" size={148} color="#e0e7ff" glow="#818cf8" />
        <Cloud x={-16} y={40} w={560} o={0.18} dur={75} />
        <Cloud x={36} y={78} w={460} o={0.12} dur={95} delay={-40} />
      </>
    )
  if (kind === 'sun')
    return (
      <>
        <div className="absolute inset-x-0 bottom-0 h-[38%]" style={{ background: 'linear-gradient(0deg, rgba(251,191,36,0.15), transparent)' }} />
        <Petals />
      </>
    )
  if (kind === 'ember')
    return (
      <>
        <Moon x="64%" y="12%" size={136} color="#fecdd3" glow="#f43f5e" opacity={0.88} />
        <div className="absolute inset-x-0 bottom-0 h-[45%]" style={{ background: 'linear-gradient(0deg, rgba(190,18,60,0.14), transparent)' }} />
        <Embers />
      </>
    )
  if (kind === 'petals') return <Petals count={8} />
  return null
}

/* 单个场景层：底图 + 氛围染色 + 装饰 */
function SceneLayer({ id, variant, accent, animate }) {
  const layer = LAYERS[variant] || LAYERS.void
  const overlayStyle = layer.vignette
    ? { background: 'radial-gradient(ellipse at 50% 42%, rgba(8,6,20,0.08) 0%, rgba(8,6,20,0.5) 68%, rgba(4,3,12,0.9) 100%)' }
    : { background: `linear-gradient(180deg, ${layer.top} 0%, ${layer.top} 30%, ${layer.bottom} 100%)` }

  return (
    <div key={id} className={`absolute inset-0 ${animate ? 'gal-scene-in' : ''}`}>
      {/* 照片底图（缓慢呼吸式缩放） */}
      <img src={layer.src} alt="" className="anim-kenburns absolute inset-0 h-full w-full object-cover" />
      {/* 氛围染色 */}
      <div className="absolute inset-0" style={overlayStyle} />
      {/* 角色色氛围光（结局页等） */}
      {accent && (
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(circle at 50% 30%, ${accent}26 0%, transparent 55%)` }}
        />
      )}
      <Decor kind={layer.decor} />
    </div>
  )
}

export default function SceneBG({ variant = 'void', accent = null }) {
  // 场景层叠栈：variant 变化时旧层保留在下方，新层淡入覆盖
  const [stack, setStack] = useState([{ v: variant, id: 0 }])
  const idRef = useRef(0)

  useEffect(() => {
    setStack((prev) => {
      if (prev[prev.length - 1].v === variant) return prev
      idRef.current += 1
      return [...prev, { v: variant, id: idRef.current }].slice(-2)
    })
  }, [variant])

  // 淡入完成后卸载被覆盖的旧场景
  useEffect(() => {
    if (stack.length < 2) return
    const t = setTimeout(() => setStack((s) => (s.length > 1 ? s.slice(-1) : s)), 1100)
    return () => clearTimeout(t)
  }, [stack])

  const under = stack.length > 1 ? stack[0] : null
  const top = stack[stack.length - 1]

  return (
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden="true">
      {under && (
        <SceneLayer id={`u${under.id}`} variant={under.v} accent={null} animate={false} />
      )}
      <SceneLayer id={`t${top.id}`} variant={top.v} accent={accent} animate={stack.length > 1} />
    </div>
  )
}
