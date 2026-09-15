// ==========================
// 应用入口：全局 Provider + 屏幕路由
// ==========================

import { NavProvider, GameProvider, useNav } from './game/store'
import { ToastProvider } from './game/toast'
import Starfield from './components/Starfield'
import TitleScreen from './screens/TitleScreen'
import CharacterSelect from './screens/CharacterSelect'
import StoryScreen from './screens/StoryScreen'
import BattleScreen from './screens/BattleScreen'
import AffectionPanel from './screens/AffectionPanel'
import CodexScreen from './screens/CodexScreen'
import EndingScreen from './screens/EndingScreen'

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
        </ToastProvider>
      </GameProvider>
    </NavProvider>
  )
}
