// ==========================
// GAL 站位立绘（标准视觉小说式）
// 透明底立绘贴于画面下半侧，支持左右站位、说话高亮/旁白压暗、
// 表情切换（滤镜 + 姿态 + 害羞腮红）
// ==========================

import xingbaiImg from '../assets/chars/trans/xingbai.webp'
import linyueImg from '../assets/chars/trans/linyue.webp'
import yaoguangImg from '../assets/chars/trans/yaoguang.webp'
import jinyuImg from '../assets/chars/trans/jinyu.webp'

const SPRITES = {
  xingbai: xingbaiImg,
  linyue: linyueImg,
  yaoguang: yaoguangImg,
  jinyu: jinyuImg,
}

/* 表情 → 滤镜 + 姿态微调 + 是否腮红 */
const EXPRESSIONS = {
  normal:    { filter: '',                                                          pose: '' },
  smile:     { filter: 'brightness(1.04) saturate(1.08)',                           pose: 'translateY(-4px)' },
  happy:     { filter: 'brightness(1.08) saturate(1.16)',                           pose: 'translateY(-9px) scale(1.012)' },
  shy:       { filter: 'brightness(1.03) saturate(1.14) hue-rotate(-5deg)', blush: true, pose: 'translateX(5px) translateY(-2px)' },
  sad:       { filter: 'saturate(0.68) brightness(0.9)',                           pose: 'translateY(7px) rotate(1.3deg)' },
  serious:   { filter: 'contrast(1.06) saturate(0.9) brightness(0.97)',             pose: '' },
  angry:     { filter: 'sepia(0.16) saturate(1.38) hue-rotate(-18deg) contrast(1.06)', pose: 'translateY(-3px)' },
  surprised: { filter: 'brightness(1.08) contrast(1.07)',                           pose: 'translateY(-11px)' },
}

export default function GalPortrait({ charId, expression = 'normal', side = 'right', speaking = true, className = '' }) {
  const src = SPRITES[charId]
  if (!src) return null

  const ex = EXPRESSIONS[expression] || EXPRESSIONS.normal
  const dim = !speaking

  return (
    <div
      className={`pointer-events-none absolute bottom-0 z-10 ${className}`}
      style={{
        [side]: '5%',
        height: 'min(80vh, 720px)',
        filter: dim
          ? 'brightness(0.52) saturate(0.62)'
          : 'brightness(1) saturate(1)',
        transform: dim ? 'scale(0.972)' : 'scale(1)',
        transition: 'filter 0.45s ease, transform 0.45s ease',
      }}
    >
      {/* 呼吸漂浮 */}
      <div className="anim-float h-full">
        <div
          key={`${charId}-${expression}`}
          className="gal-sprite-in relative h-full"
        >
          <img
            src={src}
            alt=""
            draggable={false}
            className="h-full w-auto select-none"
            style={{
              filter: ex.filter || undefined,
              transform: ex.pose || undefined,
              transition: 'filter 0.4s ease, transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
              // 立绘底部融入对话框的渐隐（视觉上“站在”对话区后）
              maskImage: 'linear-gradient(180deg, black 82%, rgba(0,0,0,0.55) 96%, rgba(0,0,0,0.25) 100%)',
              WebkitMaskImage: 'linear-gradient(180deg, black 82%, rgba(0,0,0,0.55) 96%, rgba(0,0,0,0.25) 100%)',
            }}
          />
          {/* 害羞腮红：脸部位于画面上部 ~20%，水平居中 */}
          {ex.blush && (
            <>
              <span className="gal-blush" style={{ left: '34%', top: '23%' }} />
              <span className="gal-blush" style={{ right: '34%', top: '23%' }} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
