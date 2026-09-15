// ==========================
// 星空粒子动态背景（Canvas）
// 闪烁星点 + 缓慢漂移 + 流星 + 上升光尘
// ==========================

import { useEffect, useRef } from 'react'

const STAR_COLORS = ['#ffffff', '#c7d2fe', '#bfdbfe', '#e0e7ff', '#fbcfe8', '#fecdd3']

export default function Starfield({ density = 1 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let raf = 0
    let w = 0
    let h = 0
    let dpr = 1
    let stars = []
    let motes = []
    let meteors = []
    let nextMeteor = 2.5
    let last = performance.now()

    const rand = (a, b) => a + Math.random() * (b - a)

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.round(((w * h) / 9000) * density)
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: rand(0.4, 1.7),
        base: rand(0.35, 0.9),
        phase: Math.random() * Math.PI * 2,
        speed: rand(0.5, 1.6),
        vx: rand(-3, -0.6),
        vy: rand(1.5, 5),
        c: STAR_COLORS[(Math.random() * STAR_COLORS.length) | 0],
      }))
      motes = Array.from({ length: Math.round(count / 7) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: rand(1.6, 3.6),
        vy: rand(-9, -3),
        phase: Math.random() * Math.PI * 2,
        alpha: rand(0.08, 0.28),
        c: Math.random() < 0.5 ? '#a5b4fc' : '#f0abfc',
      }))
    }

    function spawnMeteor() {
      const fromLeft = Math.random() < 0.5
      meteors.push({
        x: fromLeft ? rand(-40, w * 0.4) : rand(w * 0.5, w + 40),
        y: rand(-30, h * 0.35),
        vx: fromLeft ? rand(360, 560) : rand(-560, -360),
        vy: rand(160, 260),
        life: 0,
        maxLife: rand(0.9, 1.5),
      })
    }

    function frame(now) {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      ctx.clearRect(0, 0, w, h)

      // 星点
      for (const s of stars) {
        s.phase += s.speed * dt
        s.x += s.vx * dt
        s.y += s.vy * dt
        if (s.x < -5) s.x = w + 5
        if (s.y > h + 5) s.y = -5
        const tw = 0.55 + 0.45 * Math.sin(s.phase)
        const a = s.base * tw
        ctx.globalAlpha = a
        ctx.fillStyle = s.c
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
        // 亮星十字光芒
        if (s.r > 1.3) {
          ctx.globalAlpha = a * 0.5
          ctx.strokeStyle = s.c
          ctx.lineWidth = 0.6
          const len = s.r * 4 * tw
          ctx.beginPath()
          ctx.moveTo(s.x - len, s.y)
          ctx.lineTo(s.x + len, s.y)
          ctx.moveTo(s.x, s.y - len)
          ctx.lineTo(s.x, s.y + len)
          ctx.stroke()
        }
      }

      // 上升光尘
      for (const m of motes) {
        m.phase += dt
        m.y += m.vy * dt
        m.x += Math.sin(m.phase * 0.8) * 6 * dt
        if (m.y < -8) {
          m.y = h + 8
          m.x = Math.random() * w
        }
        const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 3)
        g.addColorStop(0, m.c)
        g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.globalAlpha = m.alpha * (0.7 + 0.3 * Math.sin(m.phase))
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(m.x, m.y, m.r * 3, 0, Math.PI * 2)
        ctx.fill()
      }

      // 流星
      nextMeteor -= dt
      if (nextMeteor <= 0) {
        spawnMeteor()
        nextMeteor = rand(3.5, 8)
      }
      meteors = meteors.filter((mt) => mt.life < mt.maxLife)
      for (const mt of meteors) {
        mt.life += dt
        mt.x += mt.vx * dt
        mt.y += mt.vy * dt
        const p = mt.life / mt.maxLife
        const a = p < 0.15 ? p / 0.15 : 1 - (p - 0.15) / 0.85
        const tail = 90 + 60 * Math.random()
        const dx = mt.vx
        const dy = mt.vy
        const n = Math.hypot(dx, dy)
        const ux = dx / n
        const uy = dy / n
        const grad = ctx.createLinearGradient(mt.x, mt.y, mt.x - ux * tail, mt.y - uy * tail)
        grad.addColorStop(0, `rgba(255,255,255,${0.9 * a})`)
        grad.addColorStop(0.3, `rgba(165,180,252,${0.5 * a})`)
        grad.addColorStop(1, 'rgba(165,180,252,0)')
        ctx.globalAlpha = 1
        ctx.strokeStyle = grad
        ctx.lineWidth = 1.6
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(mt.x, mt.y)
        ctx.lineTo(mt.x - ux * tail, mt.y - uy * tail)
        ctx.stroke()
        ctx.fillStyle = `rgba(255,255,255,${a})`
        ctx.beginPath()
        ctx.arc(mt.x, mt.y, 1.8, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.globalAlpha = 1
      raf = requestAnimationFrame(frame)
    }

    resize()
    window.addEventListener('resize', resize)
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [density])

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" aria-hidden="true" />
}
