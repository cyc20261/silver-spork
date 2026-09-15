// ==========================
// 启动首页：动态星空 + 渐变标题
// ==========================

import { useState } from 'react'
import { useGame, useNav } from '../game/store'
import { CODEX } from '../data/codex'
import { ENDINGS } from '../data/endings'
import SceneBG from '../components/SceneBG'

export default function TitleScreen() {
  const { state, hasProgress, resetAll, startPrologue } = useGame()
  const { navigate } = useNav()
  const [confirmReset, setConfirmReset] = useState(false)

  const startNew = () => {
    if (hasProgress) {
      setConfirmReset(true)
      return
    }
    startPrologue()
    navigate('story')
  }

  const onConfirmReset = () => {
    resetAll()
    setConfirmReset(false)
    startPrologue()
    navigate('story')
  }

  return (
    <div className="relative h-full overflow-hidden">
      <SceneBG variant="star" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6">
        {/* 标题 */}
        <div className="anim-rise text-center">
          <div className="mb-3 flex items-center justify-center gap-3 text-sm tracking-[0.5em] text-indigo-200/80">
            <span className="anim-breathe-soft">✦</span> STAR TRACE VOYAGER <span className="anim-breathe-soft">✦</span>
          </div>
          <h1 className="text-gradient text-glow text-6xl font-black tracking-[0.18em] sm:text-7xl md:text-8xl">
            星溯旅者
          </h1>
          <p className="mt-5 text-base text-sky-100/85 sm:text-lg">
            ——误入平行次元的你，与四位星灵少女的羁绊物语
          </p>
          <p className="mt-2 text-sm text-indigo-200/60">
            分支剧情 · 好感度养成 · 回合微战斗 · 八种结局
          </p>
        </div>

        {/* 按钮组 */}
        <div className="anim-rise mt-12 flex w-full max-w-xs flex-col gap-3.5" style={{ animationDelay: '0.15s' }}>
          {hasProgress && (
            <button className="btn btn-primary text-lg" onClick={() => navigate('story')}>
              ▶ 继续旅程
            </button>
          )}
          <button
            className={`btn ${hasProgress ? 'btn-ghost' : 'btn-primary'} text-lg`}
            onClick={startNew}
          >
            ✦ 开始新的旅程
          </button>
          <div className="grid grid-cols-2 gap-3.5">
            <button className="btn btn-ghost" onClick={() => navigate('codex')}>✧ 星辰图鉴</button>
            <button className="btn btn-ghost" onClick={() => navigate('affection')}>♥ 好感度</button>
          </div>
        </div>

        {/* 进度徽章 */}
        <div className="anim-rise mt-10 flex flex-wrap items-center justify-center gap-3 text-xs text-indigo-200/70" style={{ animationDelay: '0.3s' }}>
          <span className="glass rounded-full px-4 py-1.5">✦ 图鉴 {state.unlocked.length}/{CODEX.length}</span>
          <span className="glass rounded-full px-4 py-1.5">❋ 结局 {state.endings.length}/{Object.keys(ENDINGS).length}</span>
          <span className="glass rounded-full px-4 py-1.5">♥ 好感总计 {Object.values(state.affection).reduce((a, b) => a + b, 0)}</span>
        </div>
      </div>

      {/* 重新开局确认 */}
      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-6 backdrop-blur-sm" onClick={() => setConfirmReset(false)}>
          <div className="glass-deep anim-pop w-full max-w-md rounded-3xl p-7 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-3xl">✦</div>
            <h3 className="mt-2 text-xl font-bold text-white">开始新的旅程？</h3>
            <p className="mt-3 text-sm leading-relaxed text-indigo-100/80">
              这将清空当前的好感度、图鉴与结局收集，<br />从序章重新出发。
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button className="btn btn-ghost" onClick={() => setConfirmReset(false)}>再想想</button>
              <button className="btn btn-danger" onClick={onConfirmReset}>重新开始</button>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 inset-x-0 z-10 text-center text-[11px] tracking-widest text-indigo-200/40">
        星溯领域观测记录 · 纯前端本地存档 · React 19 + TailwindCSS
      </div>
    </div>
  )
}
