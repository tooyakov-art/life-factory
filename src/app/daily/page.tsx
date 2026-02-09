'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Schema, DailyCheckIn, DailyStatus } from '@/types/factory'

const STATUS_OPTIONS = [
  { value: 'green' as const, emoji: '🟢', label: 'Ок' },
  { value: 'yellow' as const, emoji: '🟡', label: 'Так себе' },
  { value: 'red' as const, emoji: '🔴', label: 'Проблема' },
]

const CATEGORY_EMOJI: Record<string, string> = {
  business: '💼',
  finance: '💰',
  skills: '🧠',
  life: '🌱',
  master: '🌐',
}

export default function DailyPage() {
  const router = useRouter()
  const [schemas, setSchemas] = useState<Schema[]>([])
  const [history, setHistory] = useState<DailyCheckIn[]>([])
  const [entries, setEntries] = useState<Record<string, DailyStatus>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Загрузка схем и истории
  useEffect(() => {
    Promise.all([
      fetch('/api/schemas').then((r) => r.json()),
      fetch('/api/daily').then((r) => r.json()),
    ])
      .then(([schemasData, historyData]) => {
        // Фильтруем _master — он мета-схема
        const filtered = (schemasData as Schema[]).filter((s) => s.id !== '_master')
        setSchemas(filtered)
        setHistory(historyData)

        // Проверяем: есть ли уже check-in за сегодня?
        const today = new Date().toISOString().slice(0, 10)
        const todayCheckin = (historyData as DailyCheckIn[]).find((h) => h.date === today)

        if (todayCheckin) {
          // Восстанавливаем из сохранённого
          const restored: Record<string, DailyStatus> = {}
          for (const e of todayCheckin.entries) {
            restored[e.schemaId] = e
          }
          setEntries(restored)
          setSaved(true)
        } else {
          // Инициализируем пустые записи
          const init: Record<string, DailyStatus> = {}
          for (const s of filtered) {
            init[s.id] = { schemaId: s.id, schemaName: s.name, status: 'green' }
          }
          setEntries(init)
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const setStatus = useCallback((schemaId: string, status: 'green' | 'yellow' | 'red') => {
    setEntries((prev) => ({
      ...prev,
      [schemaId]: { ...prev[schemaId], status, note: status === 'red' ? prev[schemaId]?.note : undefined },
    }))
    setSaved(false)
  }, [])

  const setNote = useCallback((schemaId: string, note: string) => {
    setEntries((prev) => ({
      ...prev,
      [schemaId]: { ...prev[schemaId], note },
    }))
    setSaved(false)
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: Object.values(entries) }),
      })
      if (res.ok) {
        setSaved(true)
        // Обновляем историю
        const updated = await fetch('/api/daily').then((r) => r.json())
        setHistory(updated)
      }
    } catch {
      // тихий провал
    } finally {
      setIsSaving(false)
    }
  }

  // Получить точки истории для схемы за последние 7 дней
  const getHistoryDots = (schemaId: string) => {
    const dots: { date: string; status: 'green' | 'yellow' | 'red' | 'none' }[] = []
    const today = new Date()

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const checkin = history.find((h) => h.date === dateStr)
      const entry = checkin?.entries.find((e) => e.schemaId === schemaId)
      dots.push({ date: dateStr, status: entry?.status || 'none' })
    }

    return dots
  }

  const DOT_COLORS = {
    green: 'bg-emerald-400',
    yellow: 'bg-yellow-400',
    red: 'bg-red-400',
    none: 'bg-slate-700',
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <p className="text-slate-400 animate-pulse">Загрузка...</p>
      </div>
    )
  }

  const today = new Date()
  const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
  const todayStr = today.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Хедер */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/factory/_master')}
            className="text-slate-400 hover:text-white transition-colors p-2 touch-manipulation"
          >
            ←
          </button>
          <div>
            <h1 className="text-lg font-bold">Daily Check-in</h1>
            <p className="text-xs text-slate-500">{todayStr}, {dayNames[today.getDay()]}</p>
          </div>
        </div>
      </header>

      {/* Список схем */}
      <div className="max-w-lg mx-auto px-4 py-4 flex flex-col gap-3">
        {schemas.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">Нет схем для check-in</p>
            <p className="text-slate-600 text-sm mt-1">Создайте схему через мастер-вид</p>
          </div>
        )}

        {schemas.map((schema) => {
          const entry = entries[schema.id]
          const dots = getHistoryDots(schema.id)
          const emoji = CATEGORY_EMOJI[schema.category] || '📄'

          return (
            <div
              key={schema.id}
              className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 transition-all"
            >
              {/* Название + категория */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">{emoji}</span>
                <span className="font-medium text-sm text-slate-200 truncate">{schema.name}</span>
              </div>

              {/* Кнопки статуса */}
              <div className="flex gap-2 mb-3">
                {STATUS_OPTIONS.map((opt) => {
                  const isSelected = entry?.status === opt.value
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setStatus(schema.id, opt.value)}
                      className={`
                        flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg
                        text-sm font-medium transition-all touch-manipulation
                        ${isSelected
                          ? opt.value === 'green'
                            ? 'bg-emerald-600/25 text-emerald-300 border border-emerald-500/40'
                            : opt.value === 'yellow'
                              ? 'bg-yellow-600/25 text-yellow-300 border border-yellow-500/40'
                              : 'bg-red-600/25 text-red-300 border border-red-500/40'
                          : 'bg-slate-700/40 text-slate-400 border border-transparent hover:bg-slate-700/60'
                        }
                      `}
                    >
                      <span>{opt.emoji}</span>
                      <span className="hidden sm:inline">{opt.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Поле заметки при red */}
              {entry?.status === 'red' && (
                <input
                  type="text"
                  value={entry.note || ''}
                  onChange={(e) => setNote(schema.id, e.target.value)}
                  placeholder="Что не так? (одно предложение)"
                  className="w-full bg-slate-900/60 border border-red-500/30 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-400/50 mb-3"
                  maxLength={100}
                />
              )}

              {/* 7-дневная история точками */}
              <div className="flex items-center gap-1">
                {dots.map((dot, i) => {
                  const d = new Date(dot.date)
                  const dayLabel = dayNames[d.getDay()]
                  const isToday = i === dots.length - 1
                  return (
                    <div key={dot.date} className="flex flex-col items-center gap-1 flex-1">
                      <div
                        className={`
                          w-3 h-3 rounded-full ${DOT_COLORS[dot.status]}
                          ${isToday ? 'ring-2 ring-slate-500/50 ring-offset-1 ring-offset-slate-800' : ''}
                        `}
                        title={`${dot.date}: ${dot.status}`}
                      />
                      <span className={`text-[9px] ${isToday ? 'text-slate-300 font-bold' : 'text-slate-600'}`}>
                        {dayLabel}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Кнопка сохранения */}
        {schemas.length > 0 && (
          <button
            onClick={handleSave}
            disabled={isSaving || saved}
            className={`
              w-full py-3.5 rounded-xl font-semibold text-sm transition-all touch-manipulation mt-2
              ${saved
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-[0.98]'
              }
              disabled:opacity-60
            `}
          >
            {isSaving ? 'Сохраняю...' : saved ? 'Сохранено' : 'Сохранить день'}
          </button>
        )}
      </div>

      {/* Нижний отступ для safe area */}
      <div className="h-8 safe-area-bottom" />
    </div>
  )
}
