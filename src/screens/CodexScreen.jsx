// ==========================
// 图鉴收集界面：星空图鉴 / 角色语录 / 回忆片段 / 星辰结局
// ==========================

import { useEffect, useMemo, useState } from 'react'
import { useGame, useNav, CHARACTERS } from '../game/store'
import { CODEX, CODEX_CATS, codexByCat } from '../data/codex'
import { ENDINGS, ENDING_ORDER } from '../data/endings'
import { ITEM_IMAGES } from '../data/itemImages'
import Portrait from '../components/Portrait'
import SceneBG from '../components/SceneBG'
import CGCard, { rgba } from '../components/CGCard'

/* ---------- 确定性伪随机（同一 id 每次渲染的星图完全一致） ---------- */
function buildChart(seed, starCount) {
  let s = (seed * 9301 + 49297) % 233280
  const rand = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
  const pts = Array.from({ length: starCount }, (_, i) => ({
    x: 9 + rand() * 82,
    y: 15 + rand() * 62,
    r: 1.3 + rand() * 2,
    delay: rand(),
    i,
  }))
  // 每颗星连向最近的 2 颗，形成有机的星座轮廓（而不是固定折线）
  const edges = []
  const seen = new Set()
  pts.forEach((a, i) => {
    pts
      .map((b, j) => ({ j, d: (a.x - b.x) ** 2 + (a.y - b.y) ** 2 }))
      .filter((o) => o.j !== i)
      .sort((p, q) => p.d - q.d)
      .slice(0, 2)
      .forEach(({ j }) => {
        const k = i < j ? `${i}-${j}` : `${j}-${i}`
        if (!seen.has(k)) {
          seen.add(k)
          edges.push([i, j])
        }
      })
  })
  const dust = Array.from({ length: 22 }, () => ({
    x: rand() * 100,
    y: rand() * 92,
    r: 0.3 + rand() * 0.75,
    o: 0.2 + rand() * 0.6,
    delay: rand(),
  }))
  return { pts, edges, dust, hero: Math.floor(rand() * pts.length) }
}

const TWINKLE = { transformBox: 'fill-box', transformOrigin: 'center' }

/* 星图：星云 + 星尘 + 主星四芒 + 闪烁 */
function Constellation({ seed, color, starCount = 8, dim = false, className = '' }) {
  const { pts, edges, dust, hero } = useMemo(() => buildChart(seed, starCount), [seed, starCount])
  const uid = `cg${seed}x${starCount}`
  const op = dim ? 0.3 : 1
  const h = pts[hero]
  const R = h.r * 7
  const r = h.r * 1.7
  return (
    <svg viewBox="0 0 100 92" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`neb-${uid}`} cx="0.5" cy="0.55" r="0.62">
          <stop offset="0%" stopColor={color} stopOpacity={dim ? 0.34 : 0.6} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`ln-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.32" />
        </linearGradient>
      </defs>

      <ellipse cx="50" cy="52" rx="47" ry="41" fill={`url(#neb-${uid})`} opacity={op} />

      {dust.map((d, i) => (
        <circle
          key={`d${i}`}
          cx={d.x}
          cy={d.y}
          r={d.r}
          fill="#ffffff"
          opacity={d.o * op}
          className={dim ? undefined : 'anim-twinkle'}
          style={dim ? undefined : { ...TWINKLE, animationDelay: `${(d.delay * 3).toFixed(2)}s` }}
        />
      ))}

      {edges.map(([a, b], i) => (
        <line
          key={`e${i}`}
          x1={pts[a].x}
          y1={pts[a].y}
          x2={pts[b].x}
          y2={pts[b].y}
          stroke={`url(#ln-${uid})`}
          strokeWidth="0.55"
          strokeLinecap="round"
          opacity={0.85 * op}
        />
      ))}

      {/* 主星四芒 */}
      <path
        d={`M${h.x} ${h.y - R} L${h.x + r} ${h.y - r} L${h.x + R} ${h.y} L${h.x + r} ${h.y + r} L${h.x} ${h.y + R} L${h.x - r} ${h.y + r} L${h.x - R} ${h.y} L${h.x - r} ${h.y - r} Z`}
        fill="#ffffff"
        opacity={0.5 * op}
        className={dim ? undefined : 'anim-twinkle'}
        style={dim ? undefined : { ...TWINKLE, animationDelay: '0.6s' }}
      />

      {pts.map((p) => (
        <g key={`p${p.i}`}>
          <circle cx={p.x} cy={p.y} r={p.r * (p.i === hero ? 3.8 : 2.4)} fill={color} opacity={(p.i === hero ? 0.42 : 0.22) * op} />
          <circle
            cx={p.x}
            cy={p.y}
            r={p.r}
            fill="#ffffff"
            opacity={0.95 * op}
            className={dim ? undefined : 'anim-twinkle'}
            style={dim ? undefined : { ...TWINKLE, animationDelay: `${(p.delay * 2.4).toFixed(2)}s` }}
          />
        </g>
      ))}
    </svg>
  )
}

const SEEDS = {
  'cp-compass': 7,
  'st-xb-1': 11,
  'st-xb-2': 23,
  'st-ly-1': 31,
  'st-ly-2': 43,
  'st-yg-1': 57,
  'st-yg-2': 67,
  'st-jy-1': 79,
  'st-jy-2': 97,
  'st-abyss': 137,
}

/* 星空图鉴的额外标识：星域配色 / 符号（不影响数据层） */
const STAR_ACCENT = { 'cp-compass': '#a5b4fc', 'st-abyss': '#f43f5e' }
const STAR_GLYPH = { 'cp-compass': '✧', 'st-abyss': '༒' }

const TAB_ICON = { star: '✦', quote: '❝', memory: '❖', relic: '◈', treasure: '❋', ending: '★' }

const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0)

function UnlockedBadge({ count, total }) {
  return (
    <span className="glass rounded-full px-4 py-1.5 text-xs text-white/85">
      {count} / {total}
    </span>
  )
}

/* ---------- 星空图鉴卡 ---------- */
function StarCard({ item, index, ok, char }) {
  const accent = STAR_ACCENT[item.id] || (char ? char.colors.primary : '#a5b4fc')
  const glyph = STAR_GLYPH[item.id] || (char ? char.elementIcon : '✦')
  const sub = char
    ? `${char.name}线 · ${char.element}`
    : item.id === 'st-abyss'
      ? '暗蚀本源 · 终章'
      : '序章 · 旅途的起点'

  return (
    <div
      className={`glass codex-sweep anim-rise group relative overflow-hidden rounded-3xl ${ok ? 'card-hover' : ''}`}
      style={{ animationDelay: `${index * 0.05}s`, borderColor: ok ? rgba(accent, 0.48) : undefined }}
    >
      {/* 星图区 */}
      <div className="relative h-28 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(140% 130% at 50% 120%, ${rgba(accent, ok ? 0.36 : 0.15)} 0%, transparent 72%)` }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(10,14,40,0.52) 0%, rgba(10,14,40,0.02) 55%, rgba(10,14,40,0.5) 100%)' }}
        />
        <Constellation
          seed={SEEDS[item.id] || 13}
          color={accent}
          dim={!ok}
          starCount={ok ? 8 : 7}
          className="absolute inset-0 h-full w-full"
        />
        {/* 缓慢自转的轨道环 */}
        <div
          className="anim-spin-slow pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full border border-dashed"
          style={{ borderColor: rgba(accent, ok ? 0.3 : 0.12) }}
        />
        <div className="pointer-events-none absolute left-3.5 top-2.5 text-[10px] font-bold tracking-[0.2em] text-white/45">
          NO.{String(index + 1).padStart(2, '0')}
        </div>
        <div
          className="pointer-events-none absolute right-3 top-2.5 rounded-full px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm"
          style={{
            background: ok ? rgba(accent, 0.22) : 'rgba(255,255,255,0.08)',
            color: ok ? accent : 'rgba(255,255,255,0.5)',
          }}
        >
          {ok ? '✦ 已记录' : '未记录'}
        </div>
      </div>

      {/* 文字区 */}
      <div className="relative px-4 pb-4 pt-2">
        {ok ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-base leading-none" style={{ color: accent }}>{glyph}</span>
              <span className="text-base font-black tracking-wide text-white">{item.name}</span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-white/70">{item.desc}</p>
            <div className="mt-2.5 flex items-center gap-2 text-[10px] font-bold" style={{ color: rgba(accent, 0.95) }}>
              <span className="h-px w-4 shrink-0" style={{ background: rgba(accent, 0.7) }} />
              <span className="truncate">{sub}</span>
            </div>
          </>
        ) : (
          <>
            <div className="text-base font-black tracking-wide text-white/45">未记录的星域</div>
            <p className="mt-1.5 text-xs leading-relaxed text-white/35">{item.hint}</p>
            <div className="mt-2.5 text-[10px] text-white/25">抵达该星域后自动记录</div>
          </>
        )}
      </div>
    </div>
  )
}

/* ---------- 回忆片段：未解锁瓦片 ---------- */
function MemoryLocked({ item, index, accent }) {
  return (
    <div className="glass anim-rise relative flex h-full min-h-[15.5rem] flex-col items-center justify-center overflow-hidden rounded-3xl px-3 text-center" style={{ animationDelay: `${index * 0.04}s` }}>
      <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(130% 110% at 50% 118%, ${rgba(accent, 0.16)}, transparent 72%)` }} />
      <Constellation seed={(index + 3) * 29} color={accent} dim starCount={6} className="absolute inset-0 h-full w-full opacity-50" />
      <div className="relative">
        <div className="text-2xl text-white/30">❖</div>
        <div className="mt-2 text-xs font-bold text-white/45">{item.hint}</div>
        <div className="mt-1 text-[10px] text-white/30">推进剧情以解锁</div>
      </div>
    </div>
  )
}

export default function CodexScreen() {
  const { state } = useGame()
  const { navigate } = useNav()
  const [tab, setTab] = useState('star')
  const [openMem, setOpenMem] = useState(null)

  // 收集数据是静态的，只取一次
  const lists = useMemo(
    () => ({
      star: codexByCat('star'),
      quote: codexByCat('quote'),
      memory: codexByCat('memory'),
      relic: codexByCat('relic'),
      treasure: codexByCat('treasure'),
    }),
    [],
  )

  const unlockedSet = useMemo(() => new Set(state.unlocked), [state.unlocked])
  const endingSet = useMemo(() => new Set(state.endings), [state.endings])
  const unlocked = (id) => unlockedSet.has(id)

  const tabs = useMemo(
    () => [
      { id: 'star', name: '星空图鉴', items: lists.star },
      { id: 'quote', name: '角色语录', items: lists.quote },
      { id: 'memory', name: '回忆片段', items: lists.memory },
      { id: 'relic', name: '永久遗物', items: lists.relic },
      { id: 'treasure', name: '星藏收集', items: lists.treasure },
      { id: 'ending', name: '星辰结局', items: ENDING_ORDER.map((id) => ({ id, name: ENDINGS[id].title })) },
    ],
    [lists],
  )

  const countOf = (t, items) => items.filter((it) => (t.id === 'ending' ? endingSet.has(it.id) : unlockedSet.has(it.id))).length

  const current = tabs.find((t) => t.id === tab)
  const count = countOf(current, current.items)

  // 已解锁的回忆（用于大图翻页）
  const unlockedMemories = useMemo(() => lists.memory.filter((m) => unlockedSet.has(m.id)), [lists, unlockedSet])
  // 翻页序号用「已解锁列表」里的位置；卡面编号用图鉴全集里的位置，两者各司其职
  const memIndex = openMem ? unlockedMemories.findIndex((m) => m.id === openMem) : -1
  const memCatalogIndex = openMem ? lists.memory.findIndex((m) => m.id === openMem) : -1

  const step = (d) => {
    if (memIndex < 0 || unlockedMemories.length < 2) return
    const n = (memIndex + d + unlockedMemories.length) % unlockedMemories.length
    setOpenMem(unlockedMemories[n].id)
  }

  // 键盘：← → 翻页，Esc 关闭
  useEffect(() => {
    if (!openMem) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') return setOpenMem(null)
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      if (unlockedMemories.length < 2) return
      const i = unlockedMemories.findIndex((m) => m.id === openMem)
      if (i < 0) return
      const d = e.key === 'ArrowRight' ? 1 : -1
      setOpenMem(unlockedMemories[(i + d + unlockedMemories.length) % unlockedMemories.length].id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openMem, unlockedMemories])

  return (
    <div className="relative h-full overflow-y-auto">
      <SceneBG variant="void" />

      <div className="relative z-10 mx-auto min-h-full max-w-4xl px-5 py-8">
        <div className="flex items-center justify-between">
          <button className="btn btn-ghost text-sm" onClick={() => navigate(state.route ? 'story' : 'title')}>← 返回</button>
          <UnlockedBadge count={state.unlocked.length} total={CODEX.length} />
        </div>

        <div className="mt-5 text-center">
          <div className="text-[10px] font-bold tracking-[0.5em] text-white/35">STAR TRACE · ARCHIVE</div>
          <h2 className="text-gradient mt-1.5 text-3xl font-black tracking-[0.2em]">星辰图鉴</h2>
          <p className="mt-2 text-sm text-sky-100/70">把走过的星域、听过的话、共同的回忆——都收进这里</p>
        </div>

        {/* 标签页 */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {tabs.map((t) => {
            const active = tab === t.id
            const c = countOf(t, t.items)
            return (
              <button
                key={t.id}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm transition-all duration-300 ${
                  active ? 'btn-primary font-bold' : 'glass font-medium text-white/75 hover:text-white'
                }`}
                onClick={() => setTab(t.id)}
              >
                <span className="text-xs opacity-80">{TAB_ICON[t.id]}</span>
                <span>{t.name}</span>
                <span
                  className={`rounded-full px-1.5 text-[10px] font-bold tabular-nums ${
                    active ? 'bg-white/25 text-white' : c > 0 ? 'bg-white/15 text-white/70' : 'bg-white/10 text-white/35'
                  }`}
                >
                  {c}/{t.items.length}
                </span>
              </button>
            )
          })}
        </div>

        {/* 当前分类进度 */}
        <div className="mx-auto mt-5 max-w-md">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="aff-fill h-full rounded-full"
              style={{
                width: `${pct(count, current.items.length)}%`,
                background: 'linear-gradient(90deg, #818cf8, #7dd3fc, #f0abfc)',
                boxShadow: '0 0 14px rgba(125,211,252,0.55)',
              }}
            />
          </div>
          <div className="mt-2 text-center text-[11px] text-white/45">
            {tab === 'relic'
              ? '获得即永久生效的星界宝物——无需使用，随身庇佑'
              : tab === 'treasure'
                ? '散落星域的收集品，集齐残页与乐谱有惊喜'
                : CODEX_CATS[tab]?.desc || '八种结局 · 每位星灵都有普通与真结局两条归途'}
          </div>
        </div>

        {/* 永久遗物 */}
        {tab === 'relic' && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {lists.relic.map((item, i) => {
              const ok = unlocked(item.id)
              return (
                <div
                  key={item.id}
                  className={`glass anim-rise relative overflow-hidden rounded-3xl p-4 ${ok ? '' : 'opacity-60'}`}
                  style={{ animationDelay: `${i * 0.06}s`, borderColor: ok ? 'rgba(253,230,138,0.45)' : undefined }}
                >
                  {ok ? (
                    <div className="flex gap-4">
                      <img
                        src={ITEM_IMAGES[item.imgKey]}
                        alt={item.name}
                        className="h-24 w-24 shrink-0 rounded-2xl object-cover"
                        style={{ filter: item.hue ? `hue-rotate(${item.hue}deg)` : undefined }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <div className="text-base font-black text-white">{item.name}</div>
                          <span className="rounded-full bg-amber-300/20 px-2 py-0.5 text-[10px] font-bold text-amber-200">◈ 已生效</span>
                        </div>
                        <div className="mt-1 text-xs font-bold leading-snug text-amber-200/90">◈ {item.effect}</div>
                        <div className="mt-1.5 text-xs leading-relaxed text-white/65">{item.desc}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-[104px] flex-col items-center justify-center text-center">
                      <div className="text-2xl text-white/25">◈</div>
                      <div className="mt-1 text-sm font-bold text-white/40">{item.name}</div>
                      <div className="mt-0.5 text-[11px] text-white/35">战斗通关获得 · 获得即永久生效</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* 星藏收集 */}
        {tab === 'treasure' && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lists.treasure.map((item, i) => {
              const ok = unlocked(item.id)
              return (
                <div key={item.id} className={`glass anim-rise card-hover relative overflow-hidden rounded-3xl p-4 ${ok ? '' : 'opacity-60'}`} style={{ animationDelay: `${i * 0.05}s` }}>
                  {ok ? (
                    <>
                      <div className="flex items-center gap-3">
                        <img
                          src={ITEM_IMAGES[item.imgKey]}
                          alt={item.name}
                          className="h-16 w-16 shrink-0 rounded-2xl object-cover"
                          style={{ filter: item.hue ? `hue-rotate(${item.hue}deg)` : undefined }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-black text-white">{item.name}</div>
                          <div className="mt-0.5 text-[10px] text-white/45">{item.hint}</div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs leading-relaxed text-white/70">{item.desc}</div>
                    </>
                  ) : (
                    <div className="flex min-h-[104px] flex-col items-center justify-center text-center">
                      <div className="text-2xl text-white/25">❋</div>
                      <div className="mt-1 text-sm font-bold text-white/40">未知收藏</div>
                      <div className="mt-0.5 px-2 text-[11px] text-white/35">{item.hint}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* 星空图鉴 */}
        {tab === 'star' && (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {lists.star.map((item, i) => (
              <StarCard
                key={item.id}
                item={item}
                index={i}
                ok={unlocked(item.id)}
                char={item.char ? CHARACTERS[item.char] : null}
              />
            ))}
          </div>
        )}

        {/* 角色语录 */}
        {tab === 'quote' && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {lists.quote.map((item, i) => {
              const char = CHARACTERS[item.char]
              const ok = unlocked(item.id)
              return (
                <div
                  key={item.id}
                  className={`glass anim-rise card-hover relative overflow-hidden rounded-3xl p-4 pl-5 ${ok ? '' : 'opacity-55'}`}
                  style={{ animationDelay: `${i * 0.04}s`, borderLeft: `3px solid ${ok ? char.colors.primary : 'rgba(255,255,255,0.2)'}` }}
                >
                  {ok ? (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-9"><Portrait charId={item.char} expression="normal" className="h-full w-full" glow={false} /></div>
                        <div>
                          <div className="text-sm font-bold text-white">{item.name}</div>
                          <div className="text-[10px]" style={{ color: char.colors.primary }}>{char.name} · {item.hint}</div>
                        </div>
                      </div>
                      <p className="mt-2.5 text-sm leading-relaxed text-indigo-50/90">{item.desc}</p>
                    </>
                  ) : (
                    <div className="flex min-h-[96px] flex-col items-center justify-center text-center">
                      <div className="text-2xl text-white/25">❝</div>
                      <div className="mt-1 text-sm font-bold text-white/40">{char.name}的某句话</div>
                      <div className="mt-0.5 text-[11px] text-white/35">{item.hint}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* 回忆片段 */}
        {tab === 'memory' && (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5">
            {lists.memory.map((item, i) => {
              const ok = unlocked(item.id)
              const char = item.char ? CHARACTERS[item.char] : null
              const accent = char ? char.colors.primary : '#a5b4fc'
              return (
                <button
                  key={item.id}
                  className={`anim-rise text-left ${ok ? 'card-hover' : ''}`}
                  style={{ animationDelay: `${i * 0.04}s` }}
                  onClick={() => ok && setOpenMem(item.id)}
                  disabled={!ok}
                >
                  {ok ? (
                    <CGCard memId={item.id} compact index={i} className="h-full" />
                  ) : (
                    <MemoryLocked item={item} index={i} accent={accent} />
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* 星辰结局 */}
        {tab === 'ending' && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {ENDING_ORDER.map((id, i) => {
              const e = ENDINGS[id]
              const char = CHARACTERS[e.char]
              const ok = endingSet.has(id)
              return (
                <div
                  key={id}
                  className={`glass anim-rise relative overflow-hidden rounded-3xl p-5 ${ok ? '' : 'opacity-60'}`}
                  style={{ animationDelay: `${i * 0.05}s`, borderColor: ok ? `${char.colors.primary}88` : undefined }}
                >
                  {ok ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold tracking-widest" style={{ color: char.colors.primary }}>{e.subtitle}</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${e.type === 'true' ? 'bg-amber-300/20 text-amber-200' : 'bg-white/15 text-white/70'}`}>
                          {e.type === 'true' ? '★ 真结局' : '普通结局'}
                        </span>
                      </div>
                      <div className={`mt-2 text-xl font-black ${e.type === 'true' ? 'text-gold' : 'text-white'}`}>{e.title}</div>
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/65">{e.lines[e.lines.length - 1]}</p>
                      <div className="mt-2 text-[10px] text-white/40">✦ {char.name}线 · 好感度决定归途</div>
                    </>
                  ) : (
                    <div className="flex min-h-[110px] flex-col items-center justify-center text-center">
                      <div className="text-2xl text-white/25">❋</div>
                      <div className="mt-1 text-base font-bold text-white/40">未见证的结局</div>
                      <div className="mt-0.5 text-[11px] text-white/35">{char.name}线 · 推进至终章</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-8 text-center text-xs text-white/40">
          已收集 {count} / {current.items.length} 件（{current.name}）
        </div>
      </div>

      {/* 回忆大图 */}
      {openMem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1026]/88 px-4 backdrop-blur-md" onClick={() => setOpenMem(null)}>
          <div className="anim-pop w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <CGCard memId={openMem} index={memCatalogIndex >= 0 ? memCatalogIndex : null} />

            <div className="mt-4 flex items-center justify-between gap-3">
              <button className="btn btn-ghost px-3 py-2 text-sm" onClick={() => step(-1)} disabled={unlockedMemories.length < 2}>
                ← 上一段
              </button>
              <span className="text-xs tabular-nums text-white/55">
                {memIndex >= 0 ? memIndex + 1 : 1} / {unlockedMemories.length || 1}
              </span>
              <button className="btn btn-ghost px-3 py-2 text-sm" onClick={() => step(1)} disabled={unlockedMemories.length < 2}>
                下一段 →
              </button>
            </div>

            <div className="mt-3 text-center">
              <button className="btn btn-primary" onClick={() => setOpenMem(null)}>✦ 收进回忆</button>
            </div>
            <div className="mt-2 text-center text-[10px] text-white/35">← → 切换回忆 · Esc 关闭</div>
          </div>
        </div>
      )}
    </div>
  )
}
