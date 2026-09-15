// ==========================
// 结局结算界面：八结局之一
// 真结局：金色星光绽放
// ==========================

import { useEffect, useState } from 'react'
import { useGame, useNav, CHARACTERS } from '../game/store'
import { ENDINGS } from '../data/endings'
import { affTier } from '../data/characters'
import Portrait from '../components/Portrait'
import SceneBG from '../components/SceneBG'

function StarRain({ color }) {
  const bits = Array.from({ length: 18 }, (_, i) => i)
  return (
    <>
      {bits.map((i) => (
        <span
          key={i}
          className="anim-star-burst absolute text-lg"
          style={{
            left: `${(i * 53 + 7) % 96}%`,
            top: `${(i * 37 + 11) % 80}%`,
            color,
            animationDelay: `${(i * 0.35) % 2.8}s`,
          }}
        >
          ✦
        </span>
      ))}
    </>
  )
}

export default function EndingScreen() {
  const { state, startRoute } = useGame()
  const { nav, navigate } = useNav()
  const endingId = nav.param?.endingId
  const ending = endingId ? ENDINGS[endingId] : null

  // 无效访问 → 回标题
  useEffect(() => {
    if (!ending) navigate('title')
  }, [ending, navigate])

  // 结局文案逐行浮现
  const [shownLines, setShownLines] = useState(0)
  useEffect(() => {
    if (!ending) return
    setShownLines(0)
    const timers = ending.lines.map((_, i) => setTimeout(() => setShownLines(i + 1), 900 + i * 1500))
    return () => timers.forEach(clearTimeout)
  }, [ending])

  if (!ending) return null

  const char = CHARACTERS[ending.char]
  const aff = state.affection[ending.char] || 0
  const tier = affTier(aff)
  const isTrue = ending.type === 'true'
  const allShown = shownLines >= ending.lines.length

  const replay = () => {
    startRoute(ending.char)
    navigate('story')
  }

  return (
    <div className="relative h-full overflow-y-auto">
      <SceneBG variant="ending" accent={char.colors.primary} />
      {isTrue && <div className="pointer-events-none fixed inset-0 z-[1]"><StarRain color={char.colors.primary} /></div>}
      {isTrue && (
        <div
          className="pointer-events-none fixed inset-0 z-[1]"
          style={{ background: `radial-gradient(circle at 50% 30%, ${char.colors.primary}22, transparent 60%)` }}
        />
      )}

      <div className="relative z-10 mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center px-5 py-12 text-center">
        {/* 结局徽标 */}
        <div className="anim-rise">
          <span
            className={`rounded-full px-4 py-1.5 text-xs font-bold tracking-[0.3em] ${isTrue ? 'bg-amber-300/20 text-amber-200' : 'glass text-white/80'}`}
          >
            {ending.subtitle}
          </span>
        </div>

        {/* 标题 */}
        <h1 className={`anim-ending-title mt-5 text-4xl font-black sm:text-5xl ${isTrue ? 'text-gold text-glow' : 'text-gradient'}`}>
          {ending.title}
        </h1>

        {/* 立绘 */}
        <div className="anim-fade-in mt-6 h-52" style={{ animationDelay: '0.4s' }}>
          <Portrait charId={ending.char} expression={isTrue ? 'smile' : 'sad'} mode="scene" className="h-full w-auto drop-shadow-[0_0_36px_rgba(255,255,255,0.3)]" />
        </div>

        {/* 结局文案 */}
        <div className="mt-6 w-full space-y-3">
          {ending.lines.slice(0, shownLines).map((line, i) => (
            <p key={i} className="anim-rise text-[15px] leading-[1.9] text-white/90">{line}</p>
          ))}
        </div>

        {allShown && (
          <div className="anim-rise w-full" style={{ animationDelay: '0.3s' }}>
            <div className="mx-auto mt-4 h-px w-44 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            <p className="mt-4 text-sm italic tracking-wider text-indigo-100/75">{ending.closing}</p>

            {/* 结算数据 */}
            <div className="glass mt-6 flex flex-wrap items-center justify-center gap-3 rounded-2xl px-5 py-3 text-xs text-white/80">
              <span>{char.name} 好感 <b style={{ color: char.colors.primary }}>{aff}</b>（{tier.name}）</span>
              <span className="text-white/30">|</span>
              <span>结局收集 {state.endings.length}/8</span>
            </div>
            {!isTrue && (
              <p className="mt-3 text-[11px] text-white/50">
                好感度达到 70 可见证「真结局」——每一条选择，她都记得。
              </p>
            )}

            {/* 行动 */}
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button className="btn btn-ghost" onClick={() => navigate('codex')}>✦ 星辰图鉴</button>
              <button className="btn btn-ghost" onClick={replay}>♥ 再遇{char.name}</button>
              <button className="btn btn-primary" onClick={() => navigate('title')}>✧ 返回星空</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
