'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ReactFlowProvider } from '@xyflow/react'
import { useFactoryStore } from '@/store/useFactoryStore'
import { FactoryCanvas } from '@/components/factory/FactoryCanvas'
import { Toolbar } from '@/components/factory/Toolbar'
import { NodePalette } from '@/components/factory/NodePalette'
import { KaizenPanel } from '@/components/factory/KaizenPanel'
import { ContainersPanel } from '@/components/factory/ContainersPanel'

function FactoryEditorContent() {
  const params = useParams()
  const router = useRouter()
  const id = decodeURIComponent(params.id as string)
  const [isKaizenOpen, setIsKaizenOpen] = useState(false)
  const [isContainersOpen, setIsContainersOpen] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isMaster = id === '_master'

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
          {isMaster ? (
            <>
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm shadow-md">
                🏭
              </div>
              <h1 className="text-lg font-bold bg-linear-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Life Factory
              </h1>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  saveCurrentSchema()
                  router.push('/factory/_master')
                }}
                className="text-slate-400 hover:text-white transition-colors p-2 touch-manipulation"
              >
                ←
              </button>
              <h1 className="text-lg font-semibold truncate max-w-[200px] sm:max-w-none">
                {schema.name}
              </h1>
            </>
          )}
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
        <ContainersPanel
          isOpen={isContainersOpen}
          onClose={() => setIsContainersOpen(false)}
          currentSchemaId={id}
        />
      </div>

      {/* Тулбар внизу */}
      <Toolbar
        isKaizenOpen={isKaizenOpen}
        onKaizenToggle={() => setIsKaizenOpen(!isKaizenOpen)}
        isContainersOpen={isContainersOpen}
        onContainersToggle={() => setIsContainersOpen(!isContainersOpen)}
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
