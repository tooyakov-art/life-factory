'use client'

import { useFactoryStore } from '@/store/useFactoryStore'

interface ToolbarProps {
  isKaizenOpen?: boolean
  onKaizenToggle?: () => void
}

export function Toolbar({ isKaizenOpen, onKaizenToggle }: ToolbarProps) {
  const { editorMode, setEditorMode, togglePalette, isPaletteOpen, saveCurrentSchema } =
    useFactoryStore()

  const buttons = [
    {
      id: 'pan' as const,
      icon: '👆',
      label: 'Двигать',
    },
    {
      id: 'addNode' as const,
      icon: '➕',
      label: 'Блок',
      action: () => togglePalette(),
    },
    {
      id: 'addEdge' as const,
      icon: '🔗',
      label: 'Связь',
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-slate-800/95 backdrop-blur-sm border-t border-slate-700 safe-area-bottom">
      <div className="flex items-center justify-center gap-1 px-2 py-2">
        {buttons.map((btn) => {
          const isActive =
            editorMode === btn.id || (btn.id === 'addNode' && isPaletteOpen)

          return (
            <button
              key={btn.id}
              onClick={() => {
                if (btn.action) {
                  btn.action()
                } else {
                  setEditorMode(btn.id)
                }
              }}
              className={`
                flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg
                transition-all touch-manipulation min-w-15
                ${
                  isActive
                    ? 'bg-blue-600/30 text-blue-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }
              `}
            >
              <span className="text-lg">{btn.icon}</span>
              <span className="text-[10px] font-medium">{btn.label}</span>
            </button>
          )
        })}

        {/* Разделитель */}
        <div className="w-px h-8 bg-slate-600/50 mx-1" />

        {/* Сохранить */}
        <button
          onClick={() => saveCurrentSchema()}
          className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-all touch-manipulation min-w-15 text-slate-400 hover:text-white hover:bg-slate-700/50"
        >
          <span className="text-lg">💾</span>
          <span className="text-[10px] font-medium">Сохранить</span>
        </button>

        {/* Кайдзен */}
        <button
          onClick={onKaizenToggle}
          className={`
            flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg
            transition-all touch-manipulation min-w-15
            ${
              isKaizenOpen
                ? 'bg-amber-600/30 text-amber-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }
          `}
        >
          <span className="text-lg">改</span>
          <span className="text-[10px] font-medium">Кайдзен</span>
        </button>
      </div>
    </div>
  )
}
