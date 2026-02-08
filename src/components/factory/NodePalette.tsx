'use client'

import { useCallback, useState } from 'react'
import { useReactFlow } from '@xyflow/react'
import { useFactoryStore } from '@/store/useFactoryStore'
import { NODE_PRESETS, type NodePreset, type FactoryNode } from '@/types/factory'

export function NodePalette() {
  const { isPaletteOpen, closePalette, addNode } = useFactoryStore()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const reactFlowInstance = useReactFlow()

  // Добавить узел в центр видимой области
  const handleAddNode = useCallback(
    (preset: NodePreset) => {
      const viewport = reactFlowInstance.getViewport()
      // Центр экрана в координатах flow
      const centerX =
        (window.innerWidth / 2 - viewport.x) / viewport.zoom
      const centerY =
        (window.innerHeight / 2 - viewport.y) / viewport.zoom

      // Небольшой случайный сдвиг чтобы узлы не стакались
      const offsetX = (Math.random() - 0.5) * 100
      const offsetY = (Math.random() - 0.5) * 100

      const newNode: FactoryNode = {
        id: `node-${Date.now()}`,
        type: 'processNode',
        position: { x: centerX + offsetX, y: centerY + offsetY },
        data: {
          label: preset.label,
          emoji: preset.emoji,
          category: preset.category,
          color: preset.color,
          status: 'active',
        },
      }

      addNode(newNode)
      closePalette()
    },
    [reactFlowInstance, addNode, closePalette]
  )

  if (!isPaletteOpen) return null

  const categories = Object.keys(NODE_PRESETS)
  const displayCategory = activeCategory ?? categories[0]

  return (
    <>
      {/* Оверлей */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={closePalette}
      />

      {/* Палитра снизу */}
      <div className="fixed bottom-[56px] left-0 right-0 z-50 bg-slate-800 border-t border-slate-700 rounded-t-2xl max-h-[60vh] overflow-hidden animate-slide-up">
        {/* Хэндл для свайпа */}
        <div className="flex justify-center py-2">
          <div className="w-10 h-1 bg-slate-600 rounded-full" />
        </div>

        {/* Табы категорий */}
        <div className="flex overflow-x-auto gap-1 px-3 pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`
                whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium
                transition-colors touch-manipulation
                ${
                  displayCategory === cat
                    ? 'bg-blue-600/30 text-blue-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }
              `}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Блоки */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-3 overflow-y-auto max-h-[40vh]">
          {NODE_PRESETS[displayCategory]?.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handleAddNode(preset)}
              className="flex flex-col items-center gap-1 p-3 rounded-xl border border-slate-700 bg-slate-900/50 hover:bg-slate-700/50 transition-colors touch-manipulation"
              style={{
                borderColor: `${preset.color}40`,
              }}
            >
              <span className="text-2xl">{preset.emoji}</span>
              <span className="text-xs text-slate-300 text-center leading-tight">
                {preset.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
