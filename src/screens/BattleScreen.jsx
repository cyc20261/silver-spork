// ==========================
// 回合微战斗（v2 · 四大怪物技能体系）
// 普攻 / 星技 / 闪避 / 治愈
// 敌方技能AI（星屑弹/暗影触碰/影爪/虚空撕咬/星镰斩/虚空裂隙/灵魂收割/星渊爆发/碎星压制/暗星吞噬/次元裂隙）
// 虚空影犬：先手 + 闪避 | 星镰收割者：斩杀 | 星渊主君：第二形态觉醒
// ==========================

import { useEffect, useRef, useState } from 'react'
import { useGame, useNav, CHARACTERS, RELIC_EFFECTS } from '../game/store'
import { useToast } from '../game/toast'
import { sfx } from '../game/audio'
import { BATTLES } from '../data/battles'
import { RELICS, CODEX_MAP } from '../data/codex'
import { ITEM_IMAGES } from '../data/itemImages'
import Portrait from '../components/Portrait'
import SceneBG from '../components/SceneBG'
import EnemySprite from '../components/EnemySprite'
import SkillFX, { impactDelayOf } from '../components/SkillFX'

const BASE_MAX_HP = 100
const MAX_EN = 100
const SKILL_COST = 40
const HEAL_COST = 30
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a

/* 技能 → 特效映射 */
const PLAYER_SKILL_FX = {
  xingbai: ['meteor', '#7dd3fc'],
  linyue: ['moonslash', '#a5b4fc'],
  yaoguang: ['sunburst', '#fbbf24'],
  jinyu: ['feather', '#fb7185'],
  compass: ['meteor', '#a5b4fc'],
}
const ENEMY_SKILL_FX = {
  stardust: ['orb', '#a78bfa'],
  shadowtouch: ['impact', '#8b5cf6'],
  shadowclaw: ['claw', '#f43f5e'],
  voidbite: ['impact', '#6d28d9'],
  starscythe: ['scythe', '#818cf8'],
  'voidrift-x': ['scythe', '#a78bfa'],
  soulharvest: ['harvest', '#f43f5e'],
  abyssburst: ['burst', '#f43f5e'],
  shatteredpress: ['shards', '#c4b5fd'],
  darkstar: ['devour', '#7c3aed'],
  'dimrift-x': ['burst', '#8b5cf6'],
}

/* 技能 id → 专属音效（11 个敌方技能各有独立音色，与特效同步播放） */
const SKILL_SFX = {
  stardust: 'stardust',
  shadowtouch: 'shadowtouch',
  shadowclaw: 'shadowclaw',
  voidbite: 'voidbite',
  starscythe: 'starscythe',
  voidrift: 'voidrift',
  'voidrift-x': 'voidriftx',
  abyssburst: 'abyssburst',
  shatteredpress: 'shatteredpress',
  darkstar: 'darkstar',
  dimrift: 'dimrift',
  'dimrift-x': 'dimriftx',
  soulharvest: 'soulharvest',
}
/* 玩家星技 → 专属音效（跟随角色的星技形态） */
const PLAYER_SKILL_SFX = {
  meteor: 'meteor',
  moonslash: 'moonslash',
  sunburst: 'sunburst',
  feather: 'feather',
}

// 序章教学战：没有同行星灵，由溯星罗盘护航
const COMPASS = {
  id: 'compass',
  name: '溯星罗盘',
  colors: { primary: '#a5b4fc', deep: '#6366f1' },
  bgVariant: 'void',
  blessing: { name: '星辉护盾', desc: '罗盘的微光指引着你的第一次战斗' },
  skill: { name: '溯星一闪', desc: '造成 28–38 点星辉伤害' },
}

export default function BattleScreen() {
  const { state, winBattle } = useGame()
  const { nav, navigate } = useNav()
  const { pushToast } = useToast()

  const battleId = nav.param?.battleId
  const nextNodeId = nav.param?.next
  const cfg = battleId ? BATTLES[battleId] : null
  const routeChar = CHARACTERS[state.route] || null
  const companion = routeChar || COMPASS

  // 永久遗物效果
  const maxHp = BASE_MAX_HP + (state.relics.includes('it-r-charm') ? RELIC_EFFECTS.charmBonusHp : 0)
  const hasLens = state.relics.includes('it-r-lens')
  const hasCompass = state.relics.includes('it-r-compass')

  // 战斗逻辑放在 ref 中，避免闭包陈旧值
  const pRef = useRef({ hp: maxHp, en: 30, dodging: false })
  const eRef = useRef({ hp: cfg ? cfg.hp : 0, maxHp: cfg ? cfg.hp : 0, charging: false, chargeSkill: null, phase: 1, harvestCd: 0 })
  const turnRef = useRef(1)
  const phaseRef = useRef('intro')
  const busyRef = useRef(false)
  const [ui, setUi] = useState(null)
  const [log, setLog] = useState(cfg ? [cfg.desc] : [])
  const [floaters, setFloaters] = useState([])
  const [hurtFx, setHurtFx] = useState({ enemyHurt: false, playerHurt: false })
  const [shake, setShake] = useState(null) // null | 'sm' | 'lg'
  const shakeDelayRef = useRef(null)
  const shakeClearRef = useRef(null)
  const [skillFx, setSkillFx] = useState(null)
  const fidRef = useRef(0)

  /* 屏幕震动：delay 对齐该招式的命中时刻，重击更猛。
     命中间隔 ≥430ms，用完即摘，保证同类震动能重新触发 */
  const doShake = (kind = 'sm', delay = 0) => {
    clearTimeout(shakeDelayRef.current)
    clearTimeout(shakeClearRef.current)
    const show = () => {
      setShake(kind)
      shakeClearRef.current = setTimeout(() => setShake(null), kind === 'lg' ? 560 : 420)
    }
    if (delay > 0) shakeDelayRef.current = setTimeout(show, delay)
    else show()
  }

  const sync = () => setUi({
    p: { ...pRef.current },
    e: { ...eRef.current },
    turn: turnRef.current,
    phase: phaseRef.current,
  })

  const addLog = (line) => setLog((l) => [...l.slice(-4), line])

  const addFloater = (text, side, color, big = false) => {
    const id = ++fidRef.current
    setFloaters((f) => [...f, { id, text, side, color, big }])
    setTimeout(() => setFloaters((f) => f.filter((x) => x.id !== id)), 1000)
  }

  // 技能特效：1.1 秒后自动清除
  const playFX = (kind, color, target, big = false) => {
    const id = ++fidRef.current
    setSkillFx({ id, kind, color, target, big })
    setTimeout(() => setSkillFx((f) => (f && f.id === id ? null : f)), 1150)
  }

  const flashHurt = async (side) => {
    setHurtFx((s) => ({ ...s, [side === 'enemy' ? 'enemyHurt' : 'playerHurt']: true }))
    await sleep(430)
    setHurtFx((s) => ({ ...s, [side === 'enemy' ? 'enemyHurt' : 'playerHurt']: false }))
  }

  /* ---------- 开场（含虚空影犬先手） ----------
     注意：dev 模式 StrictMode 会双挂载副作用，用 cancelled 标记
     丢弃第一次执行，而不是用"只跑一次"守卫把第二次拦死，
     否则开场过渡永远无法完成（战斗卡在出场演出）。 */
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      sync()
      await sleep(1400)
      if (cancelled) return
      if (cfg?.firstStrike && !(hasCompass && Math.random() < RELIC_EFFECTS.compassVsFirstStrike)) {
        phaseRef.current = 'enemyAct'
        addLog(`⚡ ${cfg.name}率先扑来——「影爪」！`)
        // 走标准技能映射（id 决定特效与命中时刻），避免这里再单独播一次特效
        await resolveEnemySkill({ id: 'shadowclaw', name: '影爪', mult: 0.8 })
        if (cancelled) return
        if (pRef.current.hp <= 0) {
          phaseRef.current = 'lose'
          addLog('……星光即将熄灭。')
          sync()
          return
        }
        await sleep(400)
        if (cancelled) return
      } else if (hasCompass && Math.random() < RELIC_EFFECTS.compassFirstStrike) {
        // 星界罗盘：抢占先手，发动快攻
        addLog('✦ 星界罗盘共鸣——你抢占了先机，发动先手快攻！')
        playFX('slash', '#ffffff', 'enemy')
        const dmg = Math.round(rnd(8, 12))
        eRef.current.hp = Math.max(0, eRef.current.hp - dmg)
        addFloater(`-${dmg}`, 'enemy', '#fbbf24')
        doShake('sm', impactDelayOf('slash'))
        await flashHurt('enemy')
        if (cancelled) return
        if (eRef.current.hp <= 0) {
          await sleep(500)
          phaseRef.current = 'win'
          addLog(`🌟 ${cfg.name}被净化了！`)
          sync()
          return
        }
        await sleep(600)
        if (cancelled) return
      }
      phaseRef.current = 'player'
      sync()
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dodgeChance = () => 0.75 + (routeChar?.id === 'yaoguang' ? 0.15 : 0)

  /* ---------- 敌方技能结算 ---------- */
  async function resolveEnemySkill(skill) {
    const fxMap = ENEMY_SKILL_FX[skill.id] || null
    const fxKind = fxMap ? fxMap[0] : 'impact'
    if (fxMap) playFX(fxMap[0], fxMap[1], 'player', skill.mult >= 2)
    else playFX('impact', cfg.color, 'player')
    // 每个技能各自的音色，与特效同时起音
    sfx(SKILL_SFX[skill.id] || 'shadowtouch')
    const phaseMult = cfg.phases && eRef.current.phase === 2 ? 1.2 : 1
    const hits = skill.hits || 1
    for (let i = 0; i < hits; i++) {
      let dmg = Math.round(rnd(cfg.atkMin, cfg.atkMax) * (skill.mult || 1) * phaseMult)
      let crit = false
      if (skill.canCrit && Math.random() < skill.canCrit) {
        dmg = Math.round(dmg * 1.5)
        crit = true
      }
      const dodged = pRef.current.dodging && Math.random() < dodgeChance()
      if (dodged) {
        addLog('⚡ 你灵巧地闪过了攻击！')
        addFloater('闪避！', 'player', '#7dd3fc')
        sfx('dodge')
      } else {
        pRef.current.hp = Math.max(0, pRef.current.hp - dmg)
        addLog(`${crit ? '‼ 暴击！' : ''}${cfg.name}使出「${skill.name}」，造成 ${dmg} 点伤害${hits > 1 ? '（连击）' : ''}`)
        addFloater(`-${dmg}${crit ? '!' : ''}`, 'player', crit ? '#fb7185' : '#fda4af', crit)
        sfx(crit ? 'crit' : 'hit')
        doShake(crit || (skill.mult || 1) >= 2 ? 'lg' : 'sm', impactDelayOf(fxKind))
        await flashHurt('player')
        // 暗影触碰 / 暗星吞噬：吞噬星光回复自身
        if (skill.drain && eRef.current.hp > 0) {
          const heal = Math.min(Math.round(dmg * skill.drain), eRef.current.maxHp - eRef.current.hp)
          if (heal > 0) {
            eRef.current.hp += heal
            addFloater(`+${heal}`, 'enemy', '#86efac')
            addLog(`🌑 ${cfg.name}吞噬了你的星光，回复 ${heal} 点`)
          }
        }
      }
      if (pRef.current.hp <= 0) break
      if (hits > 1) await sleep(520)
    }
    sync()
  }

  /* ---------- 敌方回合（技能 AI） ---------- */
  async function enemyTurn() {
    const e = eRef.current

    // 兑现上一回合的蓄力
    if (e.charging) {
      e.charging = false
      const skill = e.chargeSkill || { name: '强化攻击', mult: 2 }
      e.chargeSkill = null
      addLog(`💥 蓄力完成——「${skill.name}」！`)
      await resolveEnemySkill(skill)
    } else {
      // 星渊主君：第二形态觉醒
      if (cfg.phases && e.phase === 1 && e.hp <= e.maxHp * cfg.phases.at) {
        e.phase = 2
        addLog(`༒ 星渊觉醒——${cfg.name}进入第二形态，全部能力提升！`)
        addFloater('第二形态！', 'enemy', '#f43f5e', true)
        sfx('dimrift')
        sync()
        await sleep(1000)
      }
      // 星镰收割者：灵魂收割（斩杀线）
      const ratio = pRef.current.hp / maxHp
      if (cfg.execute && ratio <= 0.35 && e.harvestCd <= 0) {
        e.harvestCd = 3
        addLog(`☠ ${cfg.name}盯上了你摇曳的灵魂——「${cfg.execute.name}」！`)
        await resolveEnemySkill(cfg.execute)
      } else {
        const skill = cfg.pick(turnRef.current, e)
        if (skill.type === 'charge') {
          e.charging = true
          e.chargeSkill = skill.next
          addLog(skill.telegraph)
          addFloater('蓄力中…', 'enemy', '#fda4af')
          playFX('rift', cfg.color, 'enemy')
          sfx(SKILL_SFX[skill.id] || 'voidrift')
        } else {
          await resolveEnemySkill(skill)
        }
      }
    }

    if (e.harvestCd > 0) e.harvestCd -= 1

    // 战败判定
    if (pRef.current.hp <= 0) {
      phaseRef.current = 'lose'
      addLog('……星光即将熄灭。')
      sfx('lose')
      sync()
      return
    }
    endOfTurn()
  }

  function endOfTurn() {
    // 回合结束被动
    if (routeChar?.id === 'xingbai' && pRef.current.hp > 0 && pRef.current.hp < maxHp) {
      const heal = Math.min(4, maxHp - pRef.current.hp)
      pRef.current.hp += heal
      addFloater(`+${heal}`, 'player', '#86efac')
      addLog(`✧ 星愈祷告回复了 ${heal} 点生命`)
    }
    if (routeChar?.id === 'yaoguang') {
      pRef.current.en = Math.min(MAX_EN, pRef.current.en + 5)
    }
    pRef.current.dodging = false
    turnRef.current += 1
    phaseRef.current = 'player'
    busyRef.current = false
    sync()
  }

  /* ---------- 玩家行动 ---------- */
  async function act(type) {
    if (phaseRef.current !== 'player' || busyRef.current) return
    busyRef.current = true
    sync()

    // 敌方闪避（虚空影犬）
    const enemyDodges = () => {
      if (cfg.dodge && Math.random() < cfg.dodge) {
        addLog(`💨 ${cfg.name}化作暗影，闪避了你的攻击！`)
        addFloater('被闪避', 'enemy', '#c4b5fd')
        return true
      }
      return false
    }

    const dealDamage = async (dmg, label, color = '#fbbf24', big = false, noDodge = false, fxKind = 'slash') => {
      if (!noDodge && enemyDodges()) {
        sfx('dodge')
        return
      }
      eRef.current.hp = Math.max(0, eRef.current.hp - dmg)
      addLog(`${label}，对${cfg.name}造成 ${dmg} 点伤害`)
      addFloater(`-${dmg}`, 'enemy', color, big)
      sfx('hit')
      doShake(big ? 'lg' : 'sm', impactDelayOf(fxKind))
      await flashHurt('enemy')
      if (routeChar?.id === 'jinyu' && dmg > 0 && eRef.current.hp > 0) {
        eRef.current.hp = Math.max(0, eRef.current.hp - 6)
        addFloater('-6 灼烧', 'enemy', '#fb923c')
        addLog('🔥 烬火余温：附加 6 点灼烧伤害')
      }
    }

    if (type === 'attack') {
      const dmg = rnd(12, 18)
      pRef.current.en = Math.min(MAX_EN, pRef.current.en + 6)
      playFX('slash', '#ffffff', 'enemy')
      sfx('slash')
      await dealDamage(dmg, '你挥出星辉普攻')
    } else if (type === 'skill') {
      if (pRef.current.en < SKILL_COST) { busyRef.current = false; sync(); return }
      pRef.current.en -= SKILL_COST
      let dmg = rnd(28, 38)
      if (routeChar?.id === 'linyue') dmg = Math.round(dmg * 1.3)
      const [fk, fc] = PLAYER_SKILL_FX[routeChar?.id || 'compass'] || ['meteor', '#a5b4fc']
      playFX(fk, fc, 'enemy')
      // 四位星灵的星技各有专属音色
      sfx(PLAYER_SKILL_SFX[fk] || 'meteor')
      await dealDamage(dmg, `✨ ${companion.skill.name}！`, '#a5b4fc', true, false, fk)
    } else if (type === 'dodge') {
      pRef.current.dodging = true
      pRef.current.en = Math.min(MAX_EN, pRef.current.en + 10)
      addLog('🌀 你进入闪避姿态（本回合大幅提升闪避）')
      addFloater('闪避姿态', 'player', '#7dd3fc')
      playFX('dodgering', '#7dd3fc', 'player')
      sfx('dodge')
    } else if (type === 'heal') {
      if (pRef.current.en < HEAL_COST) { busyRef.current = false; sync(); return }
      pRef.current.en -= HEAL_COST
      const heal = Math.min(rnd(28, 38), maxHp - pRef.current.hp)
      pRef.current.hp += heal
      addLog(`💚 星光治愈，回复 ${heal} 点生命`)
      addFloater(`+${heal}`, 'player', '#86efac', true)
      playFX('heal', '#86efac', 'player')
      sfx('heal')
    }
    sync()

    // 胜利判定
    if (eRef.current.hp <= 0) {
      await sleep(500)
      phaseRef.current = 'win'
      addLog(`🌟 ${cfg.name}被净化了！`)
      sfx('win')
      sync()
      return
    }

    // 敌方回合
    await sleep(750)
    await enemyTurn()
  }

  const retry = () => {
    pRef.current = { hp: maxHp, en: 30, dodging: false }
    eRef.current = { hp: cfg.hp, maxHp: cfg.hp, charging: false, chargeSkill: null, phase: 1, harvestCd: 0 }
    turnRef.current = 1
    phaseRef.current = 'intro'
    busyRef.current = false
    setLog([cfg.desc])
    setFloaters([])
    sync()
    setTimeout(() => {
      phaseRef.current = 'player'
      sync()
    }, 1100)
  }

  const onVictory = () => {
    if (routeChar && !state.battlesWon.includes(battleId)) {
      pushToast(`♥ ${routeChar.name}好感 +6`, '⚔', routeChar.colors.primary)
    }
    // 通关掉落提示
    ;(cfg.drops || []).forEach((d) => {
      if (d.startsWith('it-r-')) {
        if (!state.relics.includes(d)) {
          const r = RELICS.find((x) => x.id === d)
          if (r) pushToast(`◈ 获得永久遗物 · ${r.name}`, '◈', '#fbbf24')
        }
      } else if (!state.unlocked.includes(d)) {
        const item = CODEX_MAP[d]
        if (item) pushToast(`❋ 星藏收集 · ${item.name}`, '❋', '#7dd3fc')
      }
    })
    winBattle(battleId, nextNodeId)
    navigate('story')
  }

  if (!cfg) {
    return (
      <div className="flex h-full items-center justify-center">
        <button className="btn btn-ghost" onClick={() => navigate('story')}>返回剧情</button>
      </div>
    )
  }

  const p = ui ? ui.p : pRef.current
  const e = ui ? ui.e : eRef.current
  const phase = ui ? ui.phase : phaseRef.current
  const turn = ui ? ui.turn : turnRef.current
  const isPlayerTurn = phase === 'player' && !busyRef.current
  const hpPct = (p.hp / maxHp) * 100
  const enPct = (p.en / MAX_EN) * 100
  const eHpPct = (e.hp / e.maxHp) * 100
  const intent = e.charging
    ? '⚠ 正在凝聚暗蚀之力——下一击将被强化！'
    : cfg.phases && e.phase === 2
      ? '第二形态 · 星渊觉醒 · 全能力提升'
      : cfg.execute
        ? '敌意汹涌 · 谨防「灵魂收割」'
        : cfg.dodge
          ? '行动迅捷 · 会闪避与先手'
          : '敌意平稳 · 窥伺着你的破绽'

  return (
    <div className={`relative h-full overflow-hidden ${shake === 'lg' ? 'anim-shake-lg' : shake === 'sm' ? 'anim-shake-sm' : ''}`}>
      <SceneBG variant="battle" />

      <div className="relative z-10 flex h-full flex-col px-3 py-3 sm:px-6 sm:py-4">
        {/* 敌方状态 */}
        <div className="glass-deep mx-auto w-full max-w-xl rounded-3xl px-5 py-3.5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-white">{cfg.name}</span>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `${cfg.color}33`, color: cfg.color }}>
                  {cfg.tier}
                </span>
              </div>
              <div className="text-[11px] tracking-widest" style={{ color: cfg.color }}>{cfg.title}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/60">回合 {turn}</div>
              <div className="text-xs font-semibold" style={{ color: e.charging ? '#fda4af' : 'rgba(255,255,255,0.6)' }}>{intent}</div>
              <button className="mt-0.5 text-[10px] text-white/35 transition hover:text-white/80" onClick={() => navigate('title')}>
                ✕ 撤退
              </button>
            </div>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/15">
            <div className="aff-fill h-full rounded-full" style={{ width: `${eHpPct}%`, background: `linear-gradient(90deg, ${cfg.color}, #fda4af)` }} />
          </div>
          <div className="mt-1 text-right text-[10px] text-white/50">
            {hasLens ? `${e.hp} / ${e.maxHp}` : `血量 ${Math.round(eHpPct)}%${hasLens === false ? ' · 碎星透镜可解析' : ''}`}
          </div>
        </div>

        {/* 战场 */}
        <div className="relative flex flex-1 items-center justify-center">
          <EnemySprite cfg={cfg} charging={e.charging} hurt={hurtFx.enemyHurt} dead={e.hp <= 0} />
          {floaters.map((f) => (
            <span
              key={f.id}
              className={`dmg-float ${f.side === 'enemy' ? 'left-1/2 top-[16%]' : 'left-1/2 bottom-[34%]'} ${f.big ? 'text-4xl' : 'text-2xl'}`}
              style={{ color: f.color, transform: 'translateX(-50%)' }}
            >
              {f.text}
            </span>
          ))}
        </div>

        {/* 玩家面板 */}
        <div
          className={`glass-deep relative mx-auto w-full max-w-3xl rounded-3xl p-4 transition-all duration-200 sm:p-5 ${
            hurtFx.playerHurt ? 'player-hurt' : ''
          }`}
        >
          {hurtFx.playerHurt && (
            <span
              className="anim-vignette pointer-events-none absolute inset-0 rounded-3xl"
              style={{ background: 'radial-gradient(circle at 50% 50%, rgba(244,63,94,0.04) 32%, rgba(244,63,94,0.3) 100%)' }}
            />
          )}
          <div className="flex items-center gap-4">
            {/* 同行星灵 / 罗盘 */}
            <div className="hidden shrink-0 sm:block">
              <div className="h-24 w-20">
                <Portrait charId={routeChar ? companion.id : undefined} expression="serious" className="h-full w-full" glow={false} />
              </div>
              <div className="mt-1 text-center text-[10px] font-bold" style={{ color: companion.colors.primary }}>
                {companion.name} · {routeChar ? '同行' : '护航'}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex justify-between text-xs text-white/80">
                <span>❤ 生命</span>
                <span className={p.hp / maxHp <= 0.35 && cfg.execute ? 'font-bold text-rose-300' : ''}>{p.hp} / {maxHp}</span>
              </div>
              <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-white/15">
                <div
                  className="aff-fill h-full rounded-full"
                  style={{ width: `${hpPct}%`, background: p.hp / maxHp <= 0.35 && cfg.execute ? 'linear-gradient(90deg, #e11d48, #fb7185)' : 'linear-gradient(90deg, #34d399, #86efac)' }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-white/80">
                <span>✦ 星辉</span>
                <span>{p.en} / {MAX_EN}</span>
              </div>
              <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-white/15">
                <div className="aff-fill h-full rounded-full" style={{ width: `${enPct}%`, background: 'linear-gradient(90deg, #818cf8, #7dd3fc)' }} />
              </div>
              <div className="mt-2 truncate rounded-lg bg-black/25 px-2.5 py-1 text-[11px] text-indigo-100/80" title={log.join(' / ')}>
                {log[log.length - 1]}
              </div>
            </div>

            {/* 操作 */}
            <div className="grid shrink-0 grid-cols-2 gap-2">
              <button className="btn btn-ghost px-4 py-2 text-sm" disabled={!isPlayerTurn} onClick={() => act('attack')}>
                ⚔ 普攻
              </button>
              <button className="btn btn-primary px-4 py-2 text-sm" disabled={!isPlayerTurn || p.en < SKILL_COST} onClick={() => act('skill')}>
                ✨ 星技
              </button>
              <button className="btn btn-ghost px-4 py-2 text-sm" disabled={!isPlayerTurn} onClick={() => act('dodge')}>
                🌀 闪避
              </button>
              <button className="btn btn-ghost px-4 py-2 text-sm" disabled={!isPlayerTurn || p.en < HEAL_COST} onClick={() => act('heal')}>
                💚 治愈
              </button>
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-white/10 pt-2 text-[10px] text-white/45">
            <span className="truncate">✧ 星灵祝福：{companion.blessing.name} — {companion.blessing.desc}</span>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="hidden sm:inline">星技{SKILL_COST} · 治愈{HEAL_COST} · 普攻+6 · 闪避+10</span>
              <div className="flex items-center gap-1">
                {RELICS.map((r) => {
                  const owned = state.relics.includes(r.id)
                  return (
                    <img
                      key={r.id}
                      src={ITEM_IMAGES[r.imgKey]}
                      alt={r.name}
                      title={`${r.name}：${r.effect}${owned ? '' : '（未获得）'}`}
                      className="h-6 w-6 rounded-full object-cover"
                      style={{
                        filter: owned ? 'none' : 'grayscale(1) brightness(0.45)',
                        opacity: owned ? 1 : 0.4,
                        border: owned ? '1px solid rgba(253,230,138,0.8)' : '1px solid rgba(255,255,255,0.15)',
                      }}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 技能特效层 */}
      <SkillFX fx={skillFx} />

      {/* 受击红晕：玩家挨打时的全屏反馈 */}
      {hurtFx.playerHurt && (
        <div
          className="anim-vignette pointer-events-none fixed inset-0 z-40"
          style={{
            boxShadow: 'inset 0 0 130px 34px rgba(244,63,94,0.55), inset 0 0 320px 60px rgba(190,18,60,0.35)',
            background: 'radial-gradient(circle at 50% 70%, transparent 42%, rgba(244,63,94,0.16) 100%)',
          }}
        />
      )}

      {/* 开场提示 */}
      {phase === 'intro' && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-[#0b1026]/70 backdrop-blur-sm">
          <div className="anim-pop text-center">
            <div className="text-sm tracking-[0.5em] text-white/70">{cfg.tier} · 暗蚀出现</div>
            <div className="text-gradient mt-3 text-5xl font-black tracking-widest">{cfg.name}</div>
            <p className="mt-4 max-w-sm px-6 text-sm text-indigo-100/80">{cfg.tip}</p>
            {cfg.firstStrike && <p className="mt-2 text-xs text-rose-300/90">⚡ 警告：它速度极快，会先手攻击！</p>}
          </div>
        </div>
      )}

      {/* 胜利 / 战败 */}
      {(phase === 'win' || phase === 'lose') && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0b1026]/80 px-6 backdrop-blur-sm">
          <div className="glass-deep anim-pop w-full max-w-md rounded-3xl p-8 text-center">
            {phase === 'win' ? (
              <>
                <div className="text-4xl">🌟</div>
                <h3 className="text-gradient mt-2 text-3xl font-black tracking-widest">战斗胜利</h3>
                <p className="mt-3 text-sm leading-relaxed text-indigo-100/85">
                  {cfg.name}已被净化，星光重新流淌。
                  {routeChar && <><br />{routeChar.name}的好感度提升了。</>}
                </p>
                <button className="btn btn-primary mt-6 w-full" onClick={onVictory}>▶ 继续剧情</button>
              </>
            ) : (
              <>
                <div className="text-4xl">💫</div>
                <h3 className="mt-2 text-2xl font-black tracking-widest text-white/90">星光护佑了你</h3>
                <p className="mt-3 text-sm leading-relaxed text-indigo-100/80">
                  你在星光的包裹中重新睁开眼睛——<br />
                  {companion.name}把这次机会，悄悄折进了祝福里。
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  <button className="btn btn-primary w-full" onClick={retry}>⚔ 重新挑战</button>
                  <button className="btn btn-ghost w-full text-sm" onClick={() => navigate('title')}>返回标题</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
