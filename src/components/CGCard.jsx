// ==========================
// 回忆片段 CG 卡：星云雾面 + 立绘 + 星尘 + 胶片内框 + 字幕板
//   compact  —— 图鉴网格用小卡（截断描述）
//   默认      —— 剧情 / 图鉴大图
// 保持向后兼容：<CGCard memId /> 的用法（StoryScreen）不受影响
// ==========================

import { useMemo } from 'react'
import { CHARACTERS } from '../data/characters'
import { CODEX_MAP } from '../data/codex'
import Portrait from './Portrait'

const FRAME = {
  white: { from: '#dbeafe', to: '#7dd3fc', deco: '✧' },
  moon: { from: '#c7d2fe', to: '#6366f1', deco: '☾' },
  sun: { from: '#fde68a', to: '#fb923c', deco: '☀' },
  ember: { from: '#fecdd3', to: '#be123c', deco: '❂' },
  void: { from: '#c7d2fe', to: '#818cf8', deco: '✦' },
}

const DEFAULT_COLORS = {
  primary: '#a5b4fc',
  deep: '#6366f1',
  hairA: '#c7d2fe',
  hairB: '#818cf8',
  eyeA: '#c4b5fd',
  eyeB: '#7c3aed',
  clothA: '#e0e7ff',
  clothB: '#818cf8',
}

/* #rrggbb → rgba(r,g,b,a)，用于把角色主色调成各种透明度的光晕 */
export function rgba(hex, a) {
  const h = String(hex).replace('#', '')
  const full = h.length === 3 ? h.split('').map((ch) => ch + ch).join('') : h
  const n = parseInt(full, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

/* 星尘分布：由 memId 决定，同一张卡每次渲染位置一致 */
function buildDust(key) {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 100003
  let s = (h * 9301 + 49297) % 233280
  const rand = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
  return Array.from({ length: 14 }, () => ({
    x: rand() * 100,
    y: rand() * 100,
    r: 1 + rand() * 2.2,
    o: 0.22 + rand() * 0.5,
    d: rand() * 5,
  }))
}

export default function CGCard({ memId, className = '', compact = false, index = null }) {
  const mem = CODEX_MAP[memId]
  const char = mem && mem.char ? CHARACTERS[mem.char] : null
  const key = char ? char.bgVariant : 'void'
  const f = FRAME[key] || FRAME.void
  const c = char ? char.colors : DEFAULT_COLORS
  const dust = useMemo(() => buildDust(String(memId || 'x')), [memId])
  const line = char ? `${char.name}线` : '序章'

  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border shadow-2xl shadow-black/40 ${className}`}
      style={{
        borderColor: rgba(f.to, 0.55),
        background: `linear-gradient(155deg, ${rgba(f.from, 0.3)} 0%, ${rgba(f.to, 0.36)} 55%, rgba(30,27,75,0.62) 100%)`,
      }}
    >
      {/* 星云雾面 */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(78% 58% at 72% 12%, ${rgba(c.primary, 0.42)}, transparent 62%),
                       radial-gradient(72% 54% at 16% 98%, ${rgba(f.from, 0.3)}, transparent 62%)`,
        }}
      />
      {/* 角色主色光晕（呼吸） */}
      <div
        className="anim-breathe-soft pointer-events-none absolute left-1/2 top-[42%] h-[76%] w-[76%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: `radial-gradient(circle, ${rgba(c.primary, 0.3)}, transparent 66%)` }}
      />
      {/* 星尘 */}
      {dust.map((d, i) => (
        <span
          key={i}
          className="anim-dust pointer-events-none absolute rounded-full bg-white"
          style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.r, height: d.r, opacity: d.o, animationDelay: `${d.d}s` }}
        />
      ))}
      {/* 场景符号 */}
      <div className="pointer-events-none absolute right-4 top-3 text-2xl opacity-45">{f.deco}</div>
      <div className="pointer-events-none absolute bottom-3.5 left-4 text-2xl opacity-25">{f.deco}</div>

      {/* 立绘 */}
      <div className={`relative flex items-end ${compact ? 'h-40' : 'h-64 sm:h-80'}`}>
        <Portrait
          charId={mem ? mem.char : null}
          expression="smile"
          className="absolute left-1/2 h-[118%] -translate-x-1/2 drop-shadow-[0_0_28px_rgba(255,255,255,0.28)] transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          glow={false}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5"
          style={{ background: 'linear-gradient(0deg, rgba(10,10,35,0.82), rgba(10,10,35,0.26) 55%, transparent)' }}
        />
      </div>

      {/* 字幕板 */}
      <div className={`relative px-4 ${compact ? 'pb-3.5 pt-2' : 'pb-4 pt-2.5'}`}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[9px] font-medium tracking-[0.32em] text-white/60">MEMORY</span>
          <span className="shrink-0 text-[9px] font-bold" style={{ color: c.primary }}>
            {index != null ? `No.${String(index + 1).padStart(2, '0')} · ` : ''}
            {line}
          </span>
        </div>
        <div className={`mt-1 font-bold text-white drop-shadow ${compact ? 'truncate text-base' : 'text-xl'}`}>
          {mem ? mem.name : '???'}
        </div>
        {mem && (
          <p className={`mt-1 leading-relaxed text-white/85 ${compact ? 'line-clamp-2 text-[11px]' : 'text-sm'}`}>
            {mem.desc}
          </p>
        )}
      </div>

      {/* 胶片内框 */}
      <div className="cg-inner-line" />
    </div>
  )
}
