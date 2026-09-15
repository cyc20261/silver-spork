// ==========================
// 敌方「暗蚀」立绘（v3 · 官方图 + Canvas 色键抠白底）
// 运行时把图片中接近白色的像素转为透明（亮度渐变平滑过渡），
// 立绘以透明 PNG 形态浮现在星空场景中，无白底矩形。
// sprite  星屑精灵   —— 三视图取左侧主形态
// hound   虚空影犬   —— 银河影犬
// reaper  星镰收割者 —— 兜帽镰刀
// abyss   星渊主君   —— 破碎星冠
// ==========================

import { useEffect, useState } from 'react'
import spriteImg from '../assets/enemies/sprite.webp'
import houndImg from '../assets/enemies/hound.webp'
import reaperImg from '../assets/enemies/reaper.webp'
import abyssImg from '../assets/enemies/abyss.webp'

const ENEMY_IMG = {
  sprite: { src: spriteImg, cut: 250, soft: 238, mode: 'chroma', frame: { width: '300%', left: '3%', top: '-34%' } },
  hound: { src: houndImg, mode: 'mask', pos: '50% 48%' },
  reaper: { src: reaperImg, cut: 243, soft: 220, mode: 'chroma' },
  abyss: { src: abyssImg, pos: '50% 42%', cut: 243, soft: 220, mode: 'chroma' },
}

/* 色键处理缓存：src → 透明 dataURL */
const keyedCache = new Map()

function chromaKey(src, cut, soft) {
  if (!keyedCache.has(src)) {
    keyedCache.set(
      src,
      new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
          try {
            const cv = document.createElement('canvas')
            cv.width = img.naturalWidth
            cv.height = img.naturalHeight
            const ctx = cv.getContext('2d', { willReadFrequently: true })
            ctx.drawImage(img, 0, 0)
            const d = ctx.getImageData(0, 0, cv.width, cv.height)
            const p = d.data
            for (let i = 0; i < p.length; i += 4) {
              const lum = (p[i] + p[i + 1] + p[i + 2]) / 3
              if (lum >= cut) p[i + 3] = 0
              else if (lum > soft) p[i + 3] = Math.round(255 * ((cut - lum) / (cut - soft)))
            }
            ctx.putImageData(d, 0, 0)
            resolve(cv.toDataURL('image/png'))
          } catch {
            resolve(src) // 处理失败则退回原图
          }
        }
        img.onerror = () => resolve(src)
        img.src = src
      }),
    )
  }
  return keyedCache.get(src)
}

function useKeyedImage(src, cut, soft) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    let alive = true
    chromaKey(src, cut, soft).then((u) => {
      if (alive) setUrl(u)
    })
    return () => {
      alive = false
    }
  }, [src, cut, soft])
  return url
}

export default function EnemySprite({ cfg, charging = false, hurt = false, dead = false }) {
  const info = ENEMY_IMG[cfg.sprite] || ENEMY_IMG.sprite
  const keyed = useKeyedImage(info.src, info.cut, info.soft)
  const useChroma = info.mode === 'chroma'

  return (
    <div
      className={`relative ${charging ? 'anim-charge' : 'anim-float-slow'} ${hurt ? 'anim-hurt' : ''}`}
      style={{ width: 260, height: 260 }}
    >
      {/* 暗蚀能量底晕 */}
      <div
        className="absolute inset-2 rounded-full"
        style={{ background: `radial-gradient(circle at 50% 48%, ${cfg.color}30 0%, transparent 60%)` }}
      />
      {(useChroma ? keyed : true) ? (
        useChroma ? (
          /* 色键抠白底后的透明立绘（sprite 为三视图，用放大窗口取主形态） */
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: '26px' }}>
            <img
              src={keyed}
              alt={cfg.name}
              style={{
                position: 'absolute',
                maxWidth: 'none', maxHeight: 'none',
                ...(info.frame || { inset: '-6%', width: '112%', height: '112%', objectFit: 'contain', objectPosition: info.pos }),
                filter: dead ? 'grayscale(1) brightness(0.55)' : `drop-shadow(0 0 16px ${cfg.color}45)`,
                transition: 'filter 0.7s',
              }}
              draggable={false}
            />
          </div>
        ) : (
          /* 暗底图：径向遮罩渐隐融入场景 */
          <img
            src={info.src}
            alt={cfg.name}
            style={{
              position: 'absolute', inset: '-4%', width: '108%', height: '108%',
              maxWidth: 'none', maxHeight: 'none',
              objectFit: 'cover', objectPosition: info.pos, transform: 'scale(1.16)',
              filter: dead ? 'grayscale(1) brightness(0.55)' : 'none',
              transition: 'filter 0.7s',
              maskImage: 'radial-gradient(ellipse 46% 46% at 50% 50%, black 48%, rgba(0,0,0,0.75) 66%, transparent 84%)',
              WebkitMaskImage: 'radial-gradient(ellipse 46% 46% at 50% 50%, black 48%, rgba(0,0,0,0.75) 66%, transparent 84%)',
            }}
            draggable={false}
          />
        )
      ) : (
        /* 色键处理中：星屑光点占位 */
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="anim-breathe h-16 w-16 rounded-full" style={{ background: `radial-gradient(circle, ${cfg.color}66, transparent 70%)` }} />
        </div>
      )}
      {/* 受击白闪 */}
      {hurt && (
        <div
          className="pointer-events-none absolute inset-0 rounded-[26px]"
          style={{
            background: `radial-gradient(circle at 50% 46%, #ffffff99 0%, ${cfg.color}55 46%, transparent 74%)`,
            animation: 'fxFlash 380ms ease-out both',
          }}
        />
      )}
      {charging && (
        <div
          className="absolute inset-0 rounded-full"
          style={{ boxShadow: `0 0 70px 26px ${cfg.color}55`, animation: 'pulseGlow 1s ease-in-out infinite' }}
        />
      )}
    </div>
  )
}
