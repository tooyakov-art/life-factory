'use client'

import { useCallback, useState, useEffect } from 'react'
import { useReactFlow } from '@xyflow/react'
import { useFactoryStore } from '@/store/useFactoryStore'
import { NODE_PRESETS, NODE_COLORS, type NodePreset, type FactoryNode, type Schema } from '@/types/factory'

const SCHEMA_CATEGORY = '📂 Мои схемы'

const SCHEMA_CATEGORY_COLORS: Record<string, string> = {
  business: NODE_COLORS.blue,
  finance: NODE_COLORS.emerald,
  skills: NODE_COLORS.purple,
  life: NODE_COLORS.yellow,
  master: NODE_COLORS.pink,
}

export function NodePalette() {
  const { isPaletteOpen, closePalette, addNode, activeSchemaId } = useFactoryStore()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [availableSchemas, setAvailableSchemas] = useState<Schema[]>([])
  const reactFlowInstance = useReactFlow()

  // Загружаем список схем для категории "Мои схемы"
  useEffect(() => {
    if (!isPaletteOpen) return
    fetch('/api/schemas')
      .then((r) => r.json())
      .then((schemas: Schema[]) => {
        // Убираем текущую схему из списка (нельзя ссылаться на себя)
        setAvailableSchemas(schemas.filter((s) => s.id !== activeSchemaId))
      })
      .catch(() => {})
  }, [isPaletteOpen, activeSchemaId])

  // Добавить обычный узел
  const handleAddNode = useCallback(
    (preset: NodePreset) => {
      const viewport = reactFlowInstance.getViewport()
      const centerX = (window.innerWidth / 2 - viewport.x) / viewport.zoom
      const centerY = (window.innerHeight / 2 - viewport.y) / viewport.zoom
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

  // Добавить SchemaNode — ссылка на другую схему
  const handleAddSchemaNode = useCallback(
    (schema: Schema) => {
      const viewport = reactFlowInstance.getViewport()
      const centerX = (window.innerWidth / 2 - viewport.x) / viewport.zoom
      const centerY = (window.innerHeight / 2 - viewport.y) / viewport.zoom
      const offsetX = (Math.random() - 0.5) * 100
      const offsetY = (Math.random() - 0.5) * 100

      const newNode: FactoryNode = {
        id: `schema-node-${Date.now()}`,
        type: 'schemaNode',
        position: { x: centerX + offsetX, y: centerY + offsetY },
        data: {
          label: schema.name,
          emoji: '📂',
          category: 'schema',
          color: SCHEMA_CATEGORY_COLORS[schema.category] || NODE_COLORS.blue,
          status: 'active',
          referencedSchemaId: schema.id,
        },
      }
      addNode(newNode)
      closePalette()
    },
    [reactFlowInstance, addNode, closePalette]
  )

  if (!isPaletteOpen) return null

  const categories = [...Object.keys(NODE_PRESETS), SCHEMA_CATEGORY]
  const displayCategory = activeCategory ?? categories[0]
  const isSchemaCategory = displayCategory === SCHEMA_CATEGORY

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
          {!isSchemaCategory &&
            NODE_PRESETS[displayCategory]?.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handleAddNode(preset)}
                className="flex flex-col items-center gap-1 p-3 rounded-xl border border-slate-700 bg-slate-900/50 hover:bg-slate-700/50 transition-colors touch-manipulation"
                style={{ borderColor: `${preset.color}40` }}
              >
                <span className="text-2xl">{preset.emoji}</span>
                <span className="text-xs text-slate-300 text-center leading-tight">
                  {preset.label}
                </span>
              </button>
            ))}

          {isSchemaCategory && availableSchemas.length === 0 && (
            <div className="col-span-full text-center py-4">
              <p className="text-slate-500 text-sm">Нет доступных схем</p>
              <p className="text-slate-600 text-xs mt-1">Создайте через /new-container</p>
            </div>
          )}

          {isSchemaCategory &&
            availableSchemas.map((schema) => (
              <button
                key={schema.id}
                onClick={() => handleAddSchemaNode(schema)}
                className="flex flex-col items-center gap-1 p-3 rounded-xl border-2 border-dashed bg-slate-900/50 hover:bg-slate-700/50 transition-colors touch-manipulation"
                style={{
                  borderColor: `${SCHEMA_CATEGORY_COLORS[schema.category] || NODE_COLORS.blue}50`,
                }}
              >
                <span className="text-2xl">📂</span>
                <span className="text-xs text-slate-300 text-center leading-tight truncate w-full">
                  {schema.name}
                </span>
              </button>
            ))}
        </div>
      </div>
    </>
  )
}
