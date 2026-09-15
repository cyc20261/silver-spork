// ==========================
// 音频控制条（左下角悬浮）
//   静音 / 音量 / 独白朗读（浏览器 TTS）
// 设置写入 localStorage，跨会话保留
// ==========================

import { useEffect, useState } from 'react'
import { getSettings, setMuted, setVolume, setVoice, unlock, ttsAvailable, stopSpeak, sfx } from '../game/audio'

export default function AudioControl() {
  const [s, setS] = useState(() => getSettings())
  const [open, setOpen] = useState(false)
  const voiceOk = ttsAvailable()

  useEffect(() => {
    setS(getSettings())
  }, [])

  const sync = () => setS(getSettings())

  const onMute = () => {
    unlock() // 首次交互时初始化 AudioContext
    setMuted(!s.muted)
    if (!getSettings().muted) sfx('click')
    sync()
  }

  const onVol = (v) => {
    unlock()
    setVolume(v)
    sync()
  }

  const onVoice = () => {
    unlock()
    const next = !s.voice
    setVoice(next)
    if (!next) stopSpeak()
    sync()
  }

  return (
    <div
      className="fixed bottom-3 left-3 z-[60] flex items-center gap-2"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div
        className="glass flex items-center gap-2 rounded-full px-2.5 py-1.5 transition-all duration-300"
        style={{ opacity: open ? 1 : 0.55 }}
      >
        <button
          onClick={onMute}
          title={s.muted ? '取消静音' : '静音'}
          className="text-base leading-none transition hover:scale-110"
        >
          {s.muted ? '🔇' : '🔊'}
        </button>

        {open && (
          <>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={s.volume}
              onChange={(e) => onVol(Number(e.target.value))}
              title={`音量 ${Math.round(s.volume * 100)}%`}
              className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-white/25 accent-sky-300"
            />
            {voiceOk && (
              <button
                onClick={onVoice}
                title={s.voice ? '关闭段落独白朗读' : '开启段落独白朗读（浏览器合成语音）'}
                className="rounded-full px-2 py-0.5 text-[11px] font-bold transition"
                style={{
                  background: s.voice ? 'rgba(125,211,252,0.28)' : 'rgba(255,255,255,0.08)',
                  color: s.voice ? '#bae6fd' : 'rgba(255,255,255,0.55)',
                }}
              >
                🗣 独白
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
