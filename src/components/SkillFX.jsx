// ==========================
// 战斗技能特效层（纯 CSS 粒子动效）
// 玩家：挥斩 / 白昼流星 / 月影千华斩 / 阳光爆裂 / 绯羽燎原 / 治愈 / 闪避
// 敌方：星屑弹 / 暗影触碰 / 影爪 / 虚空撕咬 / 星镰斩 / 虚空裂隙 /
//       灵魂收割 / 星渊爆发 / 碎星压制 / 暗星吞噬 / 次元裂隙
// 用法：<SkillFX fx={{ id, kind, color, target, big }} />，动画结束由父级清除
//
// 结构：每个技能 = 各自的「招式形」（弹道 / 弧光 / 射线…）+ 共用的 impactAt()
//       命中核心（白核 + 冲击环 + 放射光条 + 火花碎屑），保证每次攻击都"打得实"。
// 注意：粒子位置是随机生成的，必须用 useMemo 按 fx.id 缓存，否则父组件任何一次
//       重渲染（飘字 / 血条同步）都会重新抽随机数，让飞行中的粒子瞬移。
// ==========================

import { useMemo } from 'react'

const rand = (a, b) => a + Math.random() * (b - a)

/* 各招式的「命中时刻」（ms）——战斗界面据此对齐屏幕震动，
   保证震动与 impactAt 的白核同时发生，而不是提前抖一下 */
export const FX_IMPACT_DELAY = {
  slash: 150, scythe: 150,
  meteor: 620, shards: 620,
  moonslash: 280, sunburst: 90, feather: 200,
  burst: 60, impact: 40, claw: 190, orb: 620,
  harvest: 500, devour: 500,
}
export const impactDelayOf = (kind) => FX_IMPACT_DELAY[kind] ?? 60

export default function SkillFX({ fx }) {
  const parts = useMemo(() => {
    if (!fx) return null

    const { kind, color, target, big } = fx
    const S = big ? 1.5 : 1
    const atP = target === 'player'
    const anchorY = atP ? 66 : 40
    const out = []
    const add = (style, key) =>
      out.push(<span key={key} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', ...style }} />)

    /* 目标锚点：dx/dy 为相对偏移 */
    const at = (dx = 0, dy = 0) => ({
      left: `calc(50% + ${dx}px)`,
      top: `calc(${anchorY}% + ${dy}px)`,
    })

    /* ---------- 命中核心：所有攻击共用的"打中了"反馈 ---------- */
    const impactAt = (dx, dy, scale, delay, tint = color) => {
      const k = `${dx}_${dy}_${delay}_${scale}`
      // 白色核心闪光
      add(
        {
          ...at(dx, dy),
          width: 92 * scale,
          height: 92 * scale,
          marginLeft: -46 * scale,
          marginTop: -46 * scale,
          borderRadius: '50%',
          background: `radial-gradient(circle, #ffffff 0%, ${tint}cc 38%, transparent 72%)`,
          animation: `fxImpact 420ms ease-out ${delay}ms both`,
        },
        `core${k}`,
      )
      // 冲击环
      add(
        {
          ...at(dx, dy),
          width: 124 * scale,
          height: 124 * scale,
          marginLeft: -62 * scale,
          marginTop: -62 * scale,
          borderRadius: '50%',
          border: `${2.4 * scale}px solid ${tint}`,
          boxShadow: `0 0 22px ${tint}aa, inset 0 0 18px ${tint}66`,
          animation: `fxRing 580ms ease-out ${delay + 30}ms both`,
        },
        `ring${k}`,
      )
      // 放射光条
      for (let i = 0; i < 7; i++) {
        add(
          {
            ...at(dx, dy),
            width: 2.6 * scale,
            height: 62 * scale,
            marginLeft: -1.3 * scale,
            borderRadius: 2,
            transformOrigin: '50% 0%',
            background: `linear-gradient(180deg, #ffffff, ${tint}, transparent)`,
            '--sr': `${i * 51.4 + rand(-10, 10)}deg`,
            animation: `fxStreak ${520}ms ease-out ${delay + 40}ms both`,
          },
          `streak${k}${i}`,
        )
      }
      // 火花碎屑
      for (let i = 0; i < 9; i++) {
        const a = rand(0, Math.PI * 2)
        const d = rand(40, 98) * scale
        add(
          {
            ...at(dx, dy),
            width: rand(2.5, 5),
            height: rand(2.5, 5),
            borderRadius: '50%',
            background: i % 3 === 0 ? '#ffffff' : tint,
            boxShadow: `0 0 9px ${tint}`,
            '--sx': `${Math.cos(a) * d}px`,
            '--sy': `${Math.sin(a) * d}px`,
            animation: `fxSpark ${rand(430, 640)}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay + 50}ms both`,
          },
          `spark${k}${i}`,
        )
      }
    }

    /* 重击：全屏色调 + 暗角（仅 big 攻击） */
    if (big) {
      add(
        {
          inset: 0,
          background: `radial-gradient(circle at 50% ${anchorY}%, ${color}44 0%, transparent 68%)`,
          animation: 'fxFlash 540ms ease-out both',
        },
        'bigtint',
      )
    }

    switch (kind) {
      /* 玩家普攻 / 星镰斩 / 虚空裂隙·斩：挥斩弧光 */
      case 'slash':
      case 'scythe': {
        const w = kind === 'scythe' ? 200 : 120
        for (let i = 0; i < 3; i++) {
          add(
            {
              ...at(0, 0),
              width: w * S,
              height: 20 * S,
              marginLeft: (-w * S) / 2,
              marginTop: -10 * S,
              borderRadius: '50%',
              borderTop: `${4.5 - i * 0.8}px solid ${i === 0 ? '#ffffff' : color}`,
              borderLeft: '2px solid transparent',
              borderRight: '2px solid transparent',
              filter: `drop-shadow(0 0 ${9 - i * 2}px ${color})`,
              transform: `rotate(${kind === 'scythe' ? -26 : -14}deg)`,
              animation: `fxSweep ${620}ms ease-out ${i * 110}ms both`,
            },
            `s${i}`,
          )
        }
        impactAt(0, 0, kind === 'scythe' ? 1.2 : 0.95, 150)
        break
      }

      /* 星白·白昼流星 / 碎星压制：坠落星辉 */
      case 'meteor':
      case 'shards': {
        const n = kind === 'meteor' ? 7 : 8
        for (let i = 0; i < n; i++) {
          const x = rand(-118, 118)
          add(
            {
              ...at(x, -rand(20, 100)),
              width: 4,
              height: kind === 'meteor' ? 68 : 44,
              borderRadius: 4,
              background: `linear-gradient(180deg, transparent, ${color})`,
              boxShadow: `0 0 12px 2px ${color}88`,
              transform: 'rotate(24deg)',
              animation: `fxFall ${740}ms ease-in ${i * 88}ms both`,
            },
            `m${i}`,
          )
        }
        impactAt(0, 0, 1.2, 620)
        add(
          {
            ...at(0, 0),
            width: 300 * S,
            height: 300 * S,
            marginLeft: -150 * S,
            marginTop: -150 * S,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color}66, transparent 65%)`,
            animation: 'fxFlash 450ms ease-out 560ms both',
          },
          'fl',
        )
        break
      }

      /* 凛月·月影千华斩：旋转月牙 */
      case 'moonslash': {
        for (let i = 0; i < 4; i++) {
          const d = 72 + i * 34
          add(
            {
              ...at(0, 0),
              width: d * S,
              height: d * S,
              marginLeft: (-d * S) / 2,
              marginTop: (-d * S) / 2,
              borderRadius: '50%',
              border: '3px solid transparent',
              borderTopColor: i === 0 ? '#ffffff' : color,
              borderRightColor: color,
              filter: `drop-shadow(0 0 9px ${color})`,
              transform: `rotate(${40 + i * 48}deg)`,
              animation: `fxSpin 700ms ease-out ${i * 100}ms both`,
            },
            `ms${i}`,
          )
        }
        impactAt(0, 0, 1.25, 280)
        break
      }

      /* 瑶光·阳光爆裂：放射金芒 */
      case 'sunburst': {
        for (let i = 0; i < 12; i++) {
          add(
            {
              ...at(0, 0),
              width: 4,
              height: 66 * S,
              marginLeft: -2,
              borderRadius: 3,
              transformOrigin: '50% 0%',
              background: `linear-gradient(180deg, ${i % 2 ? '#ffffff' : color}, transparent)`,
              boxShadow: `0 0 9px ${color}77`,
              '--r': `${i * 30}deg`,
              animation: `fxRay 720ms ease-out ${i * 36}ms both`,
            },
            `r${i}`,
          )
        }
        impactAt(0, 0, 1.15, 90)
        add(
          {
            ...at(0, 0),
            width: 130 * S,
            height: 130 * S,
            marginLeft: -65 * S,
            marginTop: -65 * S,
            borderRadius: '50%',
            background: `radial-gradient(circle, #ffffff 0%, ${color}55 45%, transparent 70%)`,
            animation: 'fxImpact 620ms ease-out both',
          },
          'c',
        )
        break
      }

      /* 烬羽·绯色羽刃：赤羽横扫 */
      case 'feather': {
        for (let i = 0; i < 8; i++) {
          add(
            {
              ...at(rand(-140, 140), rand(-56, 56)),
              width: 32,
              height: 8,
              borderRadius: 4,
              background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
              boxShadow: `0 0 10px ${color}77`,
              transform: `rotate(${rand(-34, 34)}deg)`,
              animation: `fxClaw 660ms ease-out ${i * 72}ms both`,
            },
            `f${i}`,
          )
        }
        impactAt(0, 0, 1.1, 200)
        break
      }

      /* 治愈：星辉上升（不含命中核心） */
      case 'heal': {
        for (let i = 0; i < 12; i++) {
          add(
            {
              ...at(rand(-72, 72), rand(-4, 52)),
              width: 9,
              height: 9,
              borderRadius: '50%',
              background: i % 2 ? '#ffffff' : color,
              boxShadow: `0 0 11px 2px ${color}99`,
              animation: `fxRise 950ms ease-out ${i * 70}ms both`,
            },
            `h${i}`,
          )
        }
        add(
          {
            ...at(0, 6),
            width: 150,
            height: 150,
            marginLeft: -75,
            marginTop: -75,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color}44, transparent 68%)`,
            animation: 'fxFlash 900ms ease-out both',
          },
          'hg',
        )
        break
      }

      /* 闪避：扩散环 + 残影 */
      case 'dodgering': {
        for (let i = 0; i < 3; i++) {
          add(
            {
              ...at(0, 0),
              width: 100 * S,
              height: 100 * S,
              marginLeft: -50 * S,
              marginTop: -50 * S,
              borderRadius: '50%',
              border: `3px solid ${i === 1 ? '#ffffff' : color}`,
              boxShadow: `0 0 16px ${color}66, inset 0 0 16px ${color}44`,
              animation: `fxRing 720ms ease-out ${i * 150}ms both`,
            },
            `d${i}`,
          )
        }
        for (let i = 0; i < 6; i++) {
          const a = rand(0, Math.PI * 2)
          const d = rand(60, 110)
          add(
            {
              ...at(0, 0),
              width: rand(2, 4),
              height: rand(2, 4),
              borderRadius: '50%',
              background: color,
              boxShadow: `0 0 8px ${color}`,
              '--sx': `${Math.cos(a) * d}px`,
              '--sy': `${Math.sin(a) * d}px`,
              animation: `fxSpark 620ms ease-out both`,
            },
            `ds${i}`,
          )
        }
        break
      }

      /* 星渊爆发：扩散环（敌方大范围） */
      case 'burst': {
        for (let i = 0; i < 3; i++) {
          add(
            {
              ...at(0, 0),
              width: 100 * S,
              height: 100 * S,
              marginLeft: -50 * S,
              marginTop: -50 * S,
              borderRadius: '50%',
              border: `3px solid ${i === 0 ? '#ffffff' : color}`,
              boxShadow: `0 0 16px ${color}66, inset 0 0 16px ${color}44`,
              animation: `fxRing 720ms ease-out ${i * 150}ms both`,
            },
            `b${i}`,
          )
        }
        impactAt(0, 0, 1.3, 60)
        break
      }

      /* 星屑弹：从敌方飞向玩家的魔弹 + 拖尾 */
      case 'orb': {
        const from = -26 // 敌方一侧起飞
        for (let i = 0; i < 4; i++) {
          const x = rand(-78, 78)
          const delay = i * 120
          // 拖尾
          add(
            {
              ...at(x, from - 30),
              width: 3,
              height: 34,
              borderRadius: 3,
              background: `linear-gradient(180deg, transparent, ${color})`,
              animation: `fxDrop ${700}ms ease-in ${delay}ms both`,
            },
            `ot${i}`,
          )
          // 弹体
          add(
            {
              ...at(x, from),
              width: 15,
              height: 15,
              borderRadius: '50%',
              background: `radial-gradient(circle at 36% 34%, #ffffff, ${color} 62%)`,
              boxShadow: `0 0 14px 4px ${color}88`,
              animation: `fxDrop ${700}ms ease-in ${delay}ms both`,
            },
            `o${i}`,
          )
        }
        impactAt(0, 0, 1.05, 620)
        break
      }

      /* 暗影触碰 / 虚空撕咬：暗能冲击 */
      case 'impact': {
        add(
          {
            ...at(0, 0),
            width: 140,
            height: 140,
            marginLeft: -70,
            marginTop: -70,
            borderRadius: '50%',
            background: `radial-gradient(circle, transparent 52%, ${color}99 66%, transparent 80%)`,
            animation: 'fxRing 560ms ease-out both',
          },
          0,
        )
        impactAt(0, 0, 1.15, 40)
        break
      }

      /* 影爪 / 先手：爪痕 */
      case 'claw': {
        for (let i = 0; i < 4; i++) {
          add(
            {
              ...at(rand(-70, 70), rand(-34, 34)),
              width: 52,
              height: 5,
              borderRadius: 3,
              background: i === 0 ? '#ffffff' : color,
              boxShadow: `0 0 11px ${color}99`,
              transform: 'rotate(-24deg)',
              animation: `fxClaw 560ms ease-out ${i * 92}ms both`,
            },
            `cl${i}`,
          )
        }
        impactAt(0, 0, 1.05, 190)
        break
      }

      /* 虚空裂隙 / 次元裂隙（蓄力征兆）：撕开的裂口 + 电弧 */
      case 'rift': {
        for (let i = 0; i < 4; i++) {
          add(
            {
              ...at(rand(-72, 72), rand(-40, 8)),
              width: 5,
              height: 106,
              borderRadius: 3,
              background: `linear-gradient(180deg, ${color}, transparent)`,
              boxShadow: `0 0 16px 3px ${color}77`,
              animation: `fxRift 950ms ease-out ${i * 130}ms both`,
            },
            `rf${i}`,
          )
        }
        add(
          {
            ...at(0, -12),
            width: 230 * S,
            height: 230 * S,
            marginLeft: -115 * S,
            marginTop: -115 * S,
            borderRadius: '50%',
            background: `radial-gradient(circle, transparent 42%, ${color}55 62%, transparent 80%)`,
            animation: 'fxImpact 900ms ease-out both',
          },
          'rfg',
        )
        break
      }

      /* 灵魂收割 / 暗星吞噬：魂光汇聚 */
      case 'harvest':
      case 'devour': {
        for (let i = 0; i < 10; i++) {
          const dx = rand(-104, 104)
          const dy = rand(-88, 88)
          add(
            {
              ...at(dx, dy),
              width: 9,
              height: 9,
              borderRadius: '50%',
              background: i % 3 === 0 ? '#ffffff' : color,
              boxShadow: `0 0 11px 2px ${color}99`,
              animation: `fxGather 820ms ease-in ${i * 62}ms both`,
              '--gx': `${-dx}px`,
              '--gy': `${-dy}px`,
            },
            `hv${i}`,
          )
        }
        impactAt(0, 0, 1.25, 500)
        break
      }

      /* 兜底：冲击环 */
      default: {
        add(
          {
            ...at(0, 0),
            width: 120,
            height: 120,
            marginLeft: -60,
            marginTop: -60,
            borderRadius: '50%',
            background: `radial-gradient(circle, transparent 55%, ${color}88 68%, transparent 80%)`,
            animation: 'fxRing 560ms ease-out both',
          },
          0,
        )
        impactAt(0, 0, 1, 40)
      }
    }

    return out
    // 粒子位置含随机数：只在换了一个新特效（新 id）时重新生成
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fx && fx.id])

  if (!fx || !parts) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden" aria-hidden="true">
      {parts}
    </div>
  )
}
