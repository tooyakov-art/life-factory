'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ReactFlowProvider } from '@xyflow/react'
import { useFactoryStore } from '@/store/useFactoryStore'
import { FactoryCanvas } from '@/components/factory/FactoryCanvas'
import { FiveWhysModal } from '@/components/factory/FiveWhysModal'

function FactoryEditorContent() {
  const params = useParams()
  const router = useRouter()
  const id = decodeURIComponent(params.id as string)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isMaster = id === '_master'

  const { schemas, activeSchemaId, setActiveSchema, saveCurrentSchema, loadSchemas, nodes, ensureKanbanNode, ensureKaizenNode } =
    useFactoryStore()
  const hasEnsuredRef = useRef(false)
  const [showHistory, setShowHistory] = useState(false)
  const [snapshots, setSnapshots] = useState<{
    filename: string; date: string; version: string
    nodesCount: number; edgesCount: number; tasksCount: number; nodeLabels: string[]
  }[]>([])
  const [restoring, setRestoring] = useState(false)

  const schema = schemas.find((s) => s.id === id)

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/schemas/${encodeURIComponent(id)}/history`)
      if (res.ok) {
        const data = await res.json()
        setSnapshots(data)
      }
    } catch { /* ignore */ }
  }, [id])

  const restoreSnapshot = async (filename: string) => {
    setRestoring(true)
    try {
      const res = await fetch(`/api/schemas/${encodeURIComponent(id)}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      })
      if (res.ok) {
        await loadSchemas()
        setActiveSchema(id)
        setShowHistory(false)
      }
    } catch { /* ignore */ }
    setRestoring(false)
  }

  useEffect(() => {
    if (schemas.length === 0) {
      loadSchemas()
    }
  }, [schemas.length, loadSchemas])

  useEffect(() => {
    if (id && schemas.length > 0 && activeSchemaId !== id) {
      const exists = schemas.find((s) => s.id === id)
      if (exists) {
        setActiveSchema(id)
        hasEnsuredRef.current = false
      } else {
        router.push('/')
      }
    }
  }, [id, schemas, activeSchemaId, setActiveSchema, router])

  // Канбан только на _master, Кайдзен везде
  useEffect(() => {
    if (activeSchemaId === id && !hasEnsuredRef.current) {
      hasEnsuredRef.current = true
      if (isMaster) ensureKanbanNode()
      ensureKaizenNode()
    }
  }, [activeSchemaId, id, isMaster, ensureKanbanNode, ensureKaizenNode])

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      saveCurrentSchema()
    }, 30000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
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
            <div className="flex items-center gap-1.5 min-w-0">
              <button
                onClick={() => {
                  saveCurrentSchema()
                  router.push('/factory/_master')
                }}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors touch-manipulation shrink-0"
              >
                <div className="w-6 h-6 rounded bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs">
                  🏭
                </div>
                <span className="text-sm font-medium hidden sm:inline">Life Factory</span>
              </button>
              <span className="text-slate-600 shrink-0">/</span>
              <h1 className="text-sm font-semibold truncate text-slate-200">
                {schema.name}
              </h1>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          {isMaster && (
            <button
              onClick={() => router.push('/daily')}
              className="px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white transition-all text-xs font-medium touch-manipulation"
            >
              Daily
            </button>
          )}
          <span className="text-xs font-mono text-slate-500">v{schema.version || '0.1'}</span>
          <span className="text-xs text-slate-600">
            {schema.updatedAt ? new Date(schema.updatedAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
          <span>{nodes.length} блоков</span>

          {/* Кнопка сохранений */}
          <div className="relative">
            <button
              onClick={() => { setShowHistory(!showHistory); if (!showHistory) loadHistory() }}
              className="px-2.5 py-1 rounded-md bg-slate-800/60 hover:bg-purple-500/20 text-slate-400 hover:text-purple-300 text-[10px] font-medium transition-all border border-transparent hover:border-purple-500/30"
            >
              💾 Сохранения
            </button>

            {showHistory && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowHistory(false)} />
                <div className="absolute right-0 top-9 w-80 bg-slate-900/98 border border-purple-500/20 rounded-xl shadow-2xl z-50 backdrop-blur-md overflow-hidden">
                  <div className="px-3 py-2.5 border-b border-slate-700/50 bg-purple-500/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">💾</span>
                        <span className="text-xs font-bold text-white">Слоты сохранений</span>
                      </div>
                      <span className="text-[9px] text-slate-500">авто каждые 5 мин</span>
                    </div>
                  </div>

                  <div className="px-3 py-2 border-b border-slate-700/30 bg-green-500/5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] font-semibold text-green-400">ТЕКУЩАЯ</span>
                      <span className="text-[10px] text-slate-500">v{schema.version || '0.1'}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 ml-4">
                      {nodes.length} блоков · {useFactoryStore.getState().edges.length} связей
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto">
                    {snapshots.length === 0 ? (
                      <div className="p-4 text-center">
                        <span className="text-xl">🎮</span>
                        <p className="text-[10px] text-slate-500 mt-1">Пустые слоты</p>
                        <p className="text-[9px] text-slate-600 mt-0.5">Первое сохранение через 5 мин</p>
                      </div>
                    ) : (
                      snapshots.map((s, i) => {
                        const isRestore = s.filename.includes('before-restore')
                        return (
                          <div
                            key={s.filename}
                            className="px-3 py-2 border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors group"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-mono text-slate-600">#{snapshots.length - i}</span>
                                  <span className="text-[10px] font-semibold text-slate-300">v{s.version}</span>
                                  {isRestore && (
                                    <span className="text-[8px] px-1 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">до отката</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  {s.nodesCount} блоков · {s.edgesCount} связей · {s.tasksCount} задач
                                </div>
                                {s.nodeLabels.length > 0 && (
                                  <div className="text-[9px] text-slate-600 mt-0.5 truncate">
                                    {s.nodeLabels.join(', ')}
                                  </div>
                                )}
                                <div className="text-[9px] text-slate-700 mt-0.5">{s.date}</div>
                              </div>
                              <button
                                onClick={() => restoreSnapshot(s.filename)}
                                disabled={restoring}
                                className="shrink-0 px-2 py-1 text-[9px] font-medium rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50 ml-2"
                              >
                                {restoring ? '...' : 'Загрузить'}
                              </button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Канвас */}
      <div className="flex-1">
        <FactoryCanvas />
      </div>

      {/* 5 Почему модалка */}
      <FiveWhysModal />
    </div>
  )
}

export default function FactoryEditorPage() {
  return (
    <ReactFlowProvider>
      <FactoryEditorContent />
    </ReactFlowProvider>
  )
}
