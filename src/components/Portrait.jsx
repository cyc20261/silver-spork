// ==========================
// 角色立绘组件（v4 · 官方立绘图片版）
// 直接采用 AI 生成成品立绘；表情通过滤镜做情绪渲染
//   mode="card"  卡片构图（取脸部，椭圆渐隐融入底色）—— 默认
//   mode="scene" 剧情构图（全身渐隐浮现于星空）
// 注意：渐变 id 必须按角色唯一，否则多实例同页会互相污染
// ==========================

import { CHARACTERS } from '../data/characters'
import xingbaiImg from '../assets/chars/xingbai.jpg'
import linyueImg from '../assets/chars/linyue.jpg'
import yaoguangImg from '../assets/chars/yaoguang.jpg'
import jinyuImg from '../assets/chars/jinyu.jpg'

const CHAR_IMAGES = {
  xingbai: xingbaiImg,
  linyue: linyueImg,
  yaoguang: yaoguangImg,
  jinyu: jinyuImg,
}

/* 表情 → 情绪滤镜（喜怒哀乐） */
const EXPRESSION_FILTERS = {
  normal: '',
  smile: 'brightness(1.04) saturate(1.07)',
  happy: 'brightness(1.08) saturate(1.14)',
  shy: 'brightness(1.03) saturate(1.16) hue-rotate(-6deg)',
  sad: 'saturate(0.68) brightness(0.9) hue-rotate(6deg)',
  serious: 'contrast(1.06) saturate(0.9) brightness(0.97)',
  angry: 'sepia(0.18) saturate(1.4) hue-rotate(-20deg) brightness(0.95) contrast(1.06)',
  surprised: 'brightness(1.08) contrast(1.07)',
}

export default function Portrait({ charId, expression = 'normal', className = '', glow = true, mode = 'card' }) {
  const c = CHARACTERS[charId]

  if (!c || !CHAR_IMAGES[c.id]) {
    // 未指定角色：星灵之核剪影
    return (
      <svg viewBox="0 0 240 280" className={className} aria-hidden="true">
        <defs>
          <radialGradient id="core-g" cx="0.5" cy="0.42" r="0.65">
            <stop offset="0%" stopColor="#e0e7ff" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#6366f1" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#312e81" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="120" cy="130" r="92" fill="url(#core-g)" />
        <path d="M120 58 C86 70 72 96 74 126 C76 158 94 186 120 198 C146 186 164 158 166 126 C168 96 154 70 120 58 Z" fill="#c7d2fe" opacity="0.35" />
        <path d="M120 100 L126 120 L146 126 L126 132 L120 152 L114 132 L94 126 L114 120 Z" fill="#ffffff" opacity="0.9" />
      </svg>
    )
  }

  const expr = EXPRESSION_FILTERS[expression] || EXPRESSION_FILTERS.normal

  /* 剧情/结局模式：星光圣框 —— 立绘嵌入圆角发光画框，白底成为卡面柔光 */
  if (mode === 'scene') {
    return (
      <div
        className={className}
        style={{
          position: 'relative',
          aspectRatio: '3 / 4.35',
          borderRadius: '26px',
          overflow: 'hidden',
          border: '1.5px solid rgba(255,255,255,0.75)',
          boxShadow: '0 0 66px rgba(255,255,255,0.30), 0 0 26px rgba(255,255,255,0.35), 0 18px 50px rgba(2,6,23,0.5)',
          userSelect: 'none',
        }}
      >
        <img
          src={CHAR_IMAGES[c.id]}
          alt={c.name}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: '50% 6%',
            filter: expr || undefined,
          }}
          draggable={false}
          loading="eager"
        />
        {/* 底部渐隐入对话框 */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 66%, rgba(10,12,34,0.34) 88%, rgba(10,12,34,0.6) 100%)', pointerEvents: 'none' }} />
        {/* 内侧柔光描边 */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: '26px', boxShadow: 'inset 0 0 22px rgba(255,255,255,0.55)', pointerEvents: 'none' }} />
      </div>
    )
  }

  const style = {
    filter: expr || undefined,
    userSelect: 'none',
  }

  // 卡片：脸部构图 + 椭圆渐隐
  style.objectFit = 'cover'
  style.objectPosition = '50% 9%'
  style.maskImage = 'radial-gradient(ellipse 78% 70% at 50% 32%, black 56%, rgba(0,0,0,0.88) 74%, transparent 94%)'
  style.WebkitMaskImage = style.maskImage

  return (
    <img
      src={CHAR_IMAGES[c.id]}
      alt={c.name}
      className={className}
      style={style}
      draggable={false}
      loading="eager"
    />
  )
}
