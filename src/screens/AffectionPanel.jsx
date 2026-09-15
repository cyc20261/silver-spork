// ==========================
// 好感度面板：四位星灵羁绊一览
// ==========================

import { useGame, useNav, CHAR_IDS, CHARACTERS } from '../game/store'
import { affTier, TRUE_THRESHOLD } from '../data/characters'
import { CODEX } from '../data/codex'
import Portrait from '../components/Portrait'
import SceneBG from '../components/SceneBG'

const MARKS = [40, 80]

export default function AffectionPanel() {
  const { state } = useGame()
  const { navigate } = useNav()

  return (
    <div className="relative h-full overflow-y-auto">
      <SceneBG variant="void" />

      <div className="relative z-10 mx-auto min-h-full max-w-4xl px-5 py-8">
        <div className="flex items-center justify-between">
          <button className="btn btn-ghost text-sm" onClick={() => navigate(state.route ? 'story' : 'title')}>← 返回</button>
          <div className="text-right text-[11px] text-white/50">真结局条件：好感度 ≥ {TRUE_THRESHOLD}</div>
        </div>

        <div className="mt-4 text-center">
          <h2 className="text-gradient text-3xl font-black tracking-[0.2em]">羁绊星图</h2>
          <p className="mt-2 text-sm text-sky-100/70">选择 · 陪伴 · 并肩作战，都会让星光更近一点</p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {CHAR_IDS.map((id, i) => {
            const char = CHARACTERS[id]
            const aff = state.affection[id] || 0
            const tier = affTier(aff)
            const quotes = CODEX.filter((c) => c.cat === 'quote' && c.char === id)
            const unlockedQuotes = quotes.filter((c) => state.unlocked.includes(c.id)).length
            const inRoute = state.route === id
            return (
              <div
                key={id}
                className={`glass anim-rise relative overflow-hidden rounded-3xl p-5 ${inRoute ? 'ring-2' : ''}`}
                style={{ animationDelay: `${i * 0.08}s`, borderColor: inRoute ? char.colors.primary : undefined, boxShadow: inRoute ? `0 0 30px ${char.colors.primary}44` : undefined }}
              >
                <div
                  className="absolute -right-10 -top-12 h-40 w-40 rounded-full opacity-25 blur-3xl"
                  style={{ background: char.colors.primary }}
                />
                <div className="relative flex gap-4">
                  <div className="h-28 w-24 shrink-0">
                    <Portrait charId={id} expression={aff >= 70 ? 'smile' : 'normal'} className="h-full w-full" glow={false} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-black text-white">{char.name}</span>
                      <span className="text-2xl font-black" style={{ color: char.colors.primary }}>{aff}</span>
                    </div>
                    <div className="text-xs text-white/60">{tier.name} · {tier.desc}</div>

                    <div className="relative mt-3">
                      <div className="h-3 overflow-hidden rounded-full bg-white/15">
                        <div
                          className="aff-fill h-full rounded-full"
                          style={{ width: `${aff}%`, background: `linear-gradient(90deg, ${char.colors.deep}, ${char.colors.primary})` }}
                        />
                      </div>
                      {MARKS.map((m) => (
                        <div key={m} className="absolute top-0 h-3 w-px bg-white/60" style={{ left: `${m}%` }} title={`语录解锁点 ${m}`} />
                      ))}
                    </div>
                    <div className="mt-1.5 flex justify-between text-[10px] text-white/45">
                      <span>0</span>
                      <span className={aff >= 40 ? 'text-white/80' : ''}>40 语录Ⅲ</span>
                      <span className={aff >= 80 ? 'text-white/80' : ''}>80 语录Ⅳ</span>
                      <span>100</span>
                    </div>
                    <div className="mt-2 text-[11px] text-white/55">
                      ❝ 已解锁语录 {unlockedQuotes}/{quotes.length}
                      {inRoute && <span className="ml-2 font-bold" style={{ color: char.colors.primary }}>· 当前同行中</span>}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="glass mt-6 rounded-2xl px-5 py-4 text-center text-xs leading-relaxed text-indigo-100/70">
          好感度跨周目保留：重新选择同一位星灵，她会记得你。<br />
          想见到「普通结局」，可以从标题页「开始新的旅程」重新出发。
        </div>
      </div>
    </div>
  )
}
