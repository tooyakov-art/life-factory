'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ReactFlowProvider } from '@xyflow/react'
import { useFactoryStore } from '@/store/useFactoryStore'
import { FactoryCanvas } from '@/components/factory/FactoryCanvas'
import { Toolbar } from '@/components/factory/Toolbar'
import { NodePalette } from '@/components/factory/NodePalette'
import { KaizenPanel } from '@/components/factory/KaizenPanel'

function FactoryEditorContent() {
  const params = useParams()
  const router = useRouter()
  const id = decodeURIComponent(params.id as string)
  const [isKaizenOpen, setIsKaizenOpen] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { schemas, activeSchemaId, setActiveSchema, saveCurrentSchema, loadSchemas, nodes } =
    useFactoryStore()

  const schema = schemas.find((s) => s.id === id)

  // Загружаем схемы если ещё не загружены (прямой заход по URL)
  useEffect(() => {
    if (schemas.length === 0) {
      loadSchemas()
    }
  }, [schemas.length, loadSchemas])

  // Активируем схему когда данные загрузились
  useEffect(() => {
    if (id && schemas.length > 0 && activeSchemaId !== id) {
      const exists = schemas.find((s) => s.id === id)
      if (exists) {
        setActiveSchema(id)
      } else {
        router.push('/')
      }
    }
  }, [id, schemas, activeSchemaId, setActiveSchema, router])

  // Интервал автосохранения каждые 30 секунд
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      saveCurrentSchema()
    }, 30000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      // Сохраняем при уходе со страницы
      saveCurrentSchema()
    }
  }, [saveCurrentSchema])

  if (!schema) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <p className="text-slate-400 animate-pulse">Загрузка схемы...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900">
      {/* Хедер */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              saveCurrentSchema()
              router.push('/')
            }}
            className="text-slate-400 hover:text-white transition-colors p-2 touch-manipulation"
          >
            ←
          </button>
          <h1 className="text-lg font-semibold truncate max-w-[200px] sm:max-w-none">
            {schema.name}
          </h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span>{nodes.length} блоков</span>
        </div>
      </header>

      {/* Канвас */}
      <div className="flex-1 relative pb-14">
        <FactoryCanvas />
        <NodePalette />
        <KaizenPanel isOpen={isKaizenOpen} onClose={() => setIsKaizenOpen(false)} />
      </div>

      {/* Тулбар внизу */}
      <Toolbar
        isKaizenOpen={isKaizenOpen}
        onKaizenToggle={() => setIsKaizenOpen(!isKaizenOpen)}
      />
    </div>
  )
}

// ReactFlowProvider должен оборачивать всё, где используются хуки React Flow
export default function FactoryEditorPage() {
  return (
    <ReactFlowProvider>
      <FactoryEditorContent />
    </ReactFlowProvider>
  )
}
