// ==========================
// 应用入口：全局 Provider + 屏幕路由 + 音频总控
// ==========================

import { useEffect, useState } from 'react'
import { NavProvider, GameProvider, useNav, useGame } from './game/store'
import { ToastProvider } from './game/toast'
import { BATTLES } from './data/battles'
import { unlock, playBgm, sfx } from './game/audio'
import Starfield from './components/Starfield'
import AudioControl from './components/AudioControl'
import TitleScreen from './screens/TitleScreen'
import CharacterSelect from './screens/CharacterSelect'
import StoryScreen from './screens/StoryScreen'
import BattleScreen from './screens/BattleScreen'
import AffectionPanel from './screens/AffectionPanel'
import CodexScreen from './screens/CodexScreen'
import EndingScreen from './screens/EndingScreen'

/* ---------- 音频总控：首手势解锁 + 按场景切换 BGM ---------- */
function AudioDirector() {
  const { nav } = useNav()
  const { state } = useGame()
  const [armed, setArmed] = useState(false)

  // 浏览器自动播放策略：AudioContext 必须在用户手势之后才能出声
  useEffect(() => {
    const onFirst = () => {
      if (unlock()) setArmed(true)
    }
    window.addEventListener('pointerdown', onFirst)
    window.addEventListener('keydown', onFirst)
    return () => {
      window.removeEventListener('pointerdown', onFirst)
      window.removeEventListener('keydown', onFirst)
    }
  }, [])

  // 全局按钮点击音（各界面无需逐个接线）
  useEffect(() => {
    const onClick = (e) => {
      const btn = e.target?.closest?.('button')
      if (btn && !btn.disabled) sfx('click')
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  useEffect(() => {
    if (!armed) return
    let theme = 'ui'
    switch (nav.screen) {
      case 'title':
        theme = 'title'
        break
      case 'battle': {
        const cfg = nav.param?.battleId ? BATTLES[nav.param.battleId] : null
        theme = cfg && cfg.tier === '最终Boss' ? 'boss' : 'battle'
        break
      }
      case 'story':
        // 序章用通用剧情曲；四条角色线各有专属主题
        theme = state.route && state.route !== 'prologue' ? state.route : 'story'
        break
      case 'ending':
        theme = 'ending'
        break
      default:
        theme = 'ui'
    }
    playBgm(theme)
  }, [armed, nav.screen, nav.param, state.route])

  return null
}

function Router() {
  const { nav } = useNav()
  return (
    <div key={nav.screen} className="anim-screen fixed inset-0 z-[2]">
      {(() => {
        switch (nav.screen) {
          case 'select':
            return <CharacterSelect />
          case 'story':
            return <StoryScreen />
          case 'battle':
            return <BattleScreen />
          case 'affection':
            return <AffectionPanel />
          case 'codex':
            return <CodexScreen />
          case 'ending':
            return <EndingScreen />
          case 'title':
          default:
            return <TitleScreen />
        }
      })()}
    </div>
  )
}

export default function App() {
  return (
    <NavProvider>
      <GameProvider>
        <ToastProvider>
          {/* 照片底图之上叠加低密度动态星点与流星 */}
          <Starfield density={0.5} />
          <Router />
          <AudioDirector />
          <AudioControl />
        </ToastProvider>
      </GameProvider>
    </NavProvider>
  )
}
