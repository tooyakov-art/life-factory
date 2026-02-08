'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFactoryStore } from '@/store/useFactoryStore'
import { useAlertStore } from '@/store/useAlertStore'
import { SchemaCard } from '@/components/dashboard/SchemaCard'
import { OverviewStats } from '@/components/dashboard/OverviewStats'
import { AlertsList } from '@/components/dashboard/AlertsList'
import { SCHEMA_TEMPLATES, createSchemaFromTemplate } from '@/utils/templates'
import type { Schema } from '@/types/factory'

const CATEGORY_OPTIONS: { value: Schema['category']; label: string; emoji: string }[] = [
  { value: 'business', label: 'Бизнес', emoji: '💼' },
  { value: 'finance', label: 'Финансы', emoji: '💰' },
  { value: 'skills', label: 'Навыки', emoji: '🧠' },
  { value: 'life', label: 'Жизнь', emoji: '🌱' },
  { value: 'master', label: 'Мастер', emoji: '🌐' },
]

const TEMPLATE_GLOW: Record<string, string> = {
  business: 'glow-business',
  finance: 'glow-finance',
  skills: 'glow-skills',
  life: 'glow-life',
  master: 'glow-master',
}

const TEMPLATE_STRIPE: Record<string, string> = {
  business: '#3b82f6',
  finance: '#10b981',
  skills: '#8b5cf6',
  life: '#f59e0b',
  master: '#ec4899',
}

export default function Home() {
  const router = useRouter()
  const { schemas, addSchema, loadSchemas, isLoading } = useFactoryStore()
  const { getBySchema } = useAlertStore()
  const [showNewForm, setShowNewForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState<Schema['category']>('business')

  // Загружаем схемы из файлов при открытии
  useEffect(() => {
    loadSchemas()
  }, [loadSchemas])

  const handleCreate = async () => {
    if (!newName.trim()) return
    try {
      const schema = await addSchema({
        name: newName.trim(),
        category: newCategory,
        nodes: [],
        edges: [],
      })
      setNewName('')
      setShowNewForm(false)
      router.push(`/factory/${encodeURIComponent(schema.id)}`)
    } catch (err) {
      console.error('Ошибка создания схемы:', err)
    }
  }

  const handleTemplateClick = async (tpl: (typeof SCHEMA_TEMPLATES)[number]) => {
    try {
      const data = createSchemaFromTemplate(tpl)
      const schema = await addSchema(data)
      router.push(`/factory/${encodeURIComponent(schema.id)}`)
    } catch (err) {
      console.error('Ошибка создания из шаблона:', err)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 factory-grid">
      {/* Хедер с градиентом */}
      <header className="relative overflow-hidden border-b border-slate-800/80">
        <div className="absolute inset-0 bg-linear-to-r from-blue-600/10 via-purple-600/5 to-emerald-600/10" />
        <div className="absolute inset-0 bg-linear-to-b from-transparent to-slate-900" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-8 pt-8 pb-6">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl shadow-lg shadow-blue-500/20">
                  🏭
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-linear-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  Life Factory
                </h1>
              </div>
              <p className="text-slate-400 text-sm sm:text-base ml-13">
                Операционная система жизни и бизнеса
              </p>
            </div>
            <button
              onClick={() => setShowNewForm(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium text-sm transition-all pulse-glow touch-manipulation flex items-center gap-2"
            >
              <span className="text-lg leading-none">+</span>
              <span className="hidden sm:inline">Новая схема</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
        {/* Загрузка */}
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-slate-400 text-sm animate-pulse">Загрузка схем...</p>
          </div>
        )}

        {/* Статистика */}
        {!isLoading && schemas.length > 0 && <OverviewStats />}

        {/* Алерты */}
        {!isLoading && <AlertsList />}

        {/* Форма создания */}
        {showNewForm && (
          <div className="mb-8 p-5 rounded-2xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-sm shadow-xl">
            <h3 className="font-bold text-lg mb-4">Новая схема</h3>
            <input
              type="text"
              placeholder="Например: Воронка для YouTube..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-600/50 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 mb-4 text-base"
            />
            <div className="flex flex-wrap gap-2 mb-4">
              {CATEGORY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setNewCategory(opt.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    newCategory === opt.value
                      ? 'bg-blue-600/20 text-blue-400 border-2 border-blue-500/50 shadow-sm shadow-blue-500/10'
                      : 'bg-slate-700/30 text-slate-400 border-2 border-transparent hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {opt.emoji} {opt.label}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:hover:bg-blue-600 rounded-xl text-sm font-semibold transition-all"
              >
                Создать
              </button>
              <button
                onClick={() => { setShowNewForm(false); setNewName('') }}
                className="px-6 py-2.5 text-slate-400 hover:text-white rounded-xl text-sm font-medium transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        )}

        {/* Шаблоны (если нет схем) */}
        {!isLoading && schemas.length === 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-6 bg-linear-to-b from-blue-500 to-purple-500 rounded-full" />
              <h2 className="text-xl font-bold">Начните с шаблона</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SCHEMA_TEMPLATES.map((tpl, i) => (
                <button
                  key={tpl.name}
                  onClick={() => handleTemplateClick(tpl)}
                  className={`
                    text-left p-5 rounded-2xl border border-slate-700/50 bg-slate-800/40
                    card-glow card-stripe ${TEMPLATE_GLOW[tpl.category]}
                    touch-manipulation cursor-pointer
                    animate-fade-in-up
                  `}
                  style={{
                    '--stripe-color': TEMPLATE_STRIPE[tpl.category],
                    animationDelay: `${i * 80}ms`,
                  } as React.CSSProperties}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl drop-shadow-lg">{tpl.emoji}</span>
                    <div>
                      <span className="font-bold text-base text-slate-100">{tpl.name}</span>
                      <div className="flex gap-2 mt-0.5">
                        <span className="text-[11px] text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded">
                          {tpl.nodes.length} блоков
                        </span>
                        <span className="text-[11px] text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded">
                          {tpl.edges.length} связей
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mt-2">
                    {tpl.description}
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Список схем / пустое состояние */}
        {!isLoading && schemas.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-px h-12 bg-linear-to-b from-slate-700 to-transparent mx-auto mb-4" />
            <p className="text-slate-500 text-sm mb-4">
              или начните с чистого листа
            </p>
            <button
              onClick={() => setShowNewForm(true)}
              className="px-6 py-3 rounded-xl font-medium text-sm transition-all border border-slate-600/50 bg-slate-800/30 hover:bg-slate-700/50 hover:border-slate-500/50 text-slate-300"
            >
              + Пустая схема
            </button>
          </div>
        ) : !isLoading && schemas.length > 0 ? (
          <>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-6 bg-linear-to-b from-emerald-500 to-blue-500 rounded-full" />
              <h2 className="text-xl font-bold">Мои схемы</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {schemas.map((schema, i) => (
                <div
                  key={schema.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <SchemaCard
                    schema={schema}
                    alertCount={getBySchema(schema.id).length}
                  />
                </div>
              ))}
            </div>
          </>
        ) : null}
      </main>
    </div>
  )
}
