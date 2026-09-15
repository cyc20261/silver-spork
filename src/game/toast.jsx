// ==========================
// 轻量 Toast 通知（好感变化 / 图鉴解锁提示）
// ==========================

import React, { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const pushToast = useCallback((text, icon = '✦', color = '#a5b4fc') => {
    const id = ++idRef.current
    setToasts((t) => [...t, { id, text, icon, color }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800)
  }, [])

  return (
    <ToastContext.Provider value={{ pushToast }}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 z-[90] flex w-72 flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="anim-toast glass flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-sm text-white/95 shadow-lg shadow-black/30"
          >
            <span className="text-base" style={{ color: t.color }}>{t.icon}</span>
            <span className="leading-snug">{t.text}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
