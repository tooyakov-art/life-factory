'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Schema } from '@/types/factory'

const CATEGORY_EMOJI: Record<string, string> = {
  business: '💼',
  finance: '💰',
  skills: '🧠',
  life: '🌱',
  master: '🌐',
}

const CATEGORY_COLORS: Record<string, string> = {
  business: '#3b82f6',
  finance: '#10b981',
  skills: '#8b5cf6',
  life: '#f59e0b',
  master: '#ec4899',
}

interface ContainersPanelProps {
  isOpen: boolean
  onClose: () => void
  currentSchemaId: string
}

export function ContainersPanel({ isOpen, onClose, currentSchemaId }: ContainersPanelProps) {
  const router = useRouter()
  const [containers, setContainers] = useState<Schema[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Загружаем список контейнеров при открытии
  useEffect(() => {
    if (!isOpen) return
    setIsLoading(true)
    fetch('/api/schemas')
      .then((res) => res.json())
      .then((data) => setContainers(data))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [isOpen])

  const handleNavigate = (id: string) => {
    onClose()
    router.push(`/factory/${encodeURIComponent(id)}`)
  }

  // Разделяем: _master отдельно, остальные — контейнеры
  const master = containers.find((c) => c.id === '_master')
  const others = containers.filter((c) => c.id !== '_master')

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Панель */}
      <div
        className={`
          fixed top-0 left-0 h-full w-80 z-50
          bg-slate-900 border-r border-slate-700
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Хедер панели */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-lg">📦</span>
            <h2 className="font-bold text-sm">Контейнеры</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Контент */}
        <div className="overflow-y-auto h-[calc(100%-52px)] scrollbar-hide">
          {isLoading && (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm animate-pulse">Загрузка...</p>
            </div>
          )}

          {/* Мастер-схема */}
          {master && (
            <div className="p-3 border-b border-slate-800">
              <button
                onClick={() => handleNavigate('_master')}
                className={`
                  w-full text-left p-3 rounded-xl transition-all
                  ${currentSchemaId === '_master'
                    ? 'bg-purple-600/15 border border-purple-500/30'
                    : 'hover:bg-slate-800/60 border border-transparent'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-base shadow-md">
                    🏭
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-slate-100">Life Factory</div>
                    <div className="text-[11px] text-slate-400">Мастер-схема</div>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Остальные контейнеры */}
          {others.length > 0 && (
            <div className="p-3">
              <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-2 px-1">
                Схемы
              </p>
              <div className="flex flex-col gap-1">
                {others.map((c) => {
                  const color = CATEGORY_COLORS[c.category] || '#64748b'
                  const emoji = CATEGORY_EMOJI[c.category] || '📄'
                  const isCurrent = currentSchemaId === c.id

                  return (
                    <button
                      key={c.id}
                      onClick={() => handleNavigate(c.id)}
                      className={`
                        w-full text-left p-3 rounded-xl transition-all
                        ${isCurrent
                          ? 'bg-slate-700/50 border border-slate-600/50'
                          : 'hover:bg-slate-800/60 border border-transparent'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                          style={{ backgroundColor: `${color}20`, boxShadow: `0 0 8px ${color}15` }}
                        >
                          {emoji}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-sm text-slate-200 truncate">
                            {c.name}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-500">
                              {c.nodes.length} блоков
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {c.edges.length} связей
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Пустое состояние */}
          {!isLoading && others.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-slate-500 text-sm mb-2">Нет контейнеров</p>
              <p className="text-slate-600 text-xs leading-relaxed">
                Попросите AI создать контейнер через<br />
                <code className="text-purple-400">/new-container</code>
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
