// ==========================
// 角色选择界面：星灵之庭
// ==========================

import { useState } from 'react'
import { useGame, useNav, CHAR_IDS, CHARACTERS } from '../game/store'
import { affTier } from '../data/characters'
import Portrait from '../components/Portrait'
import SceneBG from '../components/SceneBG'

function CharCard({ char, affection, active, onClick }) {
  const c = char.colors
  const tier = affTier(affection)
  return (
    <button
      onClick={onClick}
      className={`glass card-hover group relative w-full overflow-hidden rounded-3xl p-4 text-left ${active ? 'ring-2' : ''}`}
      style={{
        borderColor: active ? c.primary : undefined,
        boxShadow: active ? `0 0 34px ${c.primary}55` : undefined,
      }}
    >
      {/* 光环 */}
      <div
        className="absolute -right-8 -top-10 h-36 w-36 rounded-full opacity-40 blur-2xl transition-opacity group-hover:opacity-70"
        style={{ background: c.primary }}
      />
      <div className="relative flex items-center gap-3">
        <div className="anim-float h-24 w-24 shrink-0 sm:h-28 sm:w-28">
          <Portrait charId={char.id} expression="smile" className="h-full w-full" glow={false} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-wider text-white">{char.name}</span>
            <span className="text-[10px] tracking-[0.25em] text-white/50">{char.en}</span>
          </div>
          <div className="mt-0.5 text-xs font-medium" style={{ color: c.primary }}>{char.title}</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full border border-white/25 bg-white/10 px-2 py-0.5 text-[11px] text-white/85">
              {char.elementIcon} {char.element}
            </span>
            {char.tags.slice(0, 2).map((t) => (
              <span key={t} className="rounded-full border border-white/20 px-2 py-0.5 text-[11px] text-white/70">{t}</span>
            ))}
          </div>
          {affection > 0 && (
            <div className="mt-2.5">
              <div className="flex justify-between text-[10px] text-white/60">
                <span>好感 {tier.name}</span>
                <span>{affection}/100</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/15">
                <div className="aff-fill h-full rounded-full" style={{ width: `${affection}%`, background: `linear-gradient(90deg, ${c.deep}, ${c.primary})` }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

export default function CharacterSelect() {
  const { state, startRoute } = useGame()
  const { navigate } = useNav()
  const [selected, setSelected] = useState(null)

  const char = selected ? CHARACTERS[selected] : null

  const onConfirm = () => {
    startRoute(selected)
    navigate('story')
  }

  return (
    <div className="relative h-full overflow-y-auto">
      <SceneBG variant="void" />

      <div className="relative z-10 mx-auto flex min-h-full max-w-5xl flex-col px-5 py-8">
        <div className="text-center">
          <div className="text-xs tracking-[0.5em] text-indigo-200/70">CHAPTER 0 · 星灵之庭</div>
          <h2 className="text-gradient mt-2 text-3xl font-black tracking-[0.2em] sm:text-4xl">选择与你同行之人</h2>
          <p className="mt-2 text-sm text-sky-100/70">你的选择将决定剧情走向与结局分支</p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {CHAR_IDS.map((id, i) => (
            <div key={id} className="anim-rise" style={{ animationDelay: `${i * 0.08}s` }}>
              <CharCard
                char={CHARACTERS[id]}
                affection={state.affection[id] || 0}
                active={selected === id}
                onClick={() => setSelected(id === selected ? null : id)}
              />
            </div>
          ))}
        </div>

        {/* 详情确认 */}
        {char && (
          <div className="anim-rise glass-deep mt-6 rounded-3xl p-5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row">
              <div className="mx-auto h-44 w-40 shrink-0 sm:mx-0">
                <Portrait charId={char.id} expression="happy" className="h-full w-full" />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-black text-white">{char.name}</h3>
                  <span className="text-xs tracking-[0.3em] text-white/50">{char.en}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-indigo-100/85">{char.intro}</p>
                <p className="mt-1.5 text-xs text-white/55">「{char.voice}」</p>
                <div className="mt-4 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                  <div className="rounded-xl border border-white/20 bg-white/8 px-3 py-2">
                    <span className="font-bold" style={{ color: char.colors.primary }}>✧ 星灵祝福 · {char.blessing.name}</span>
                    <div className="mt-0.5 text-white/75">{char.blessing.desc}</div>
                  </div>
                  <div className="rounded-xl border border-white/20 bg-white/8 px-3 py-2">
                    <span className="font-bold" style={{ color: char.colors.primary }}>⚔ 星技 · {char.skill.name}</span>
                    <div className="mt-0.5 text-white/75">{char.skill.desc}</div>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button className="btn btn-primary flex-1 sm:flex-none" onClick={onConfirm}>
                    ♥ 与{name}同行
                  </button>
                  <button className="btn btn-ghost" onClick={() => setSelected(null)}>返回</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <button className="btn btn-ghost text-sm" onClick={() => navigate('title')}>← 返回星空</button>
        </div>
      </div>
    </div>
  )
}
