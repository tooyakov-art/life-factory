'use client'

import { useState, useMemo } from 'react'
import { useReactFlow } from '@xyflow/react'
import { useFactoryStore } from '@/store/useFactoryStore'
import {
  analyzeKaizen,
  getKaizenScore,
  KAIZEN_CATEGORIES,
  type KaizenCategory,
  type KaizenSeverity,
  type KaizenResult,
} from '@/utils/kaizen'

const SEVERITY_CONFIG: Record<KaizenSeverity, { icon: string; color: string; bg: string; label: string }> = {
  critical: { icon: '🔴', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', label: 'Критично' },
  warning:  { icon: '🟡', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', label: 'Внимание' },
  suggestion: { icon: '🔵', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', label: 'Совет' },
  pass:     { icon: '🟢', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30', label: 'Ок' },
}

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'
  const circumference = 2 * Math.PI * 36
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="36" fill="none" stroke="#1e293b" strokeWidth="6" />
        <circle
          cx="40" cy="40" r="36" fill="none"
          stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black" style={{ color }}>{score}</span>
        <span className="text-[9px] text-slate-500">改善</span>
      </div>
    </div>
  )
}

function KaizenItem({ result, onHighlight }: { result: KaizenResult; onHighlight: (ids: string[]) => void }) {
  const [expanded, setExpanded] = useState(false)
  const config = SEVERITY_CONFIG[result.severity]

  return (
    <div
      className={`border rounded-lg p-3 transition-all cursor-pointer ${config.bg}`}
      onClick={() => {
        setExpanded(!expanded)
        if (result.nodeIds?.length) onHighlight(result.nodeIds)
      }}
    >
      <div className="flex items-start gap-2">
        <span className="text-sm mt-0.5">{config.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${config.color}`}>{result.ruleName}</span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">{result.message}</p>
        </div>
      </div>

      {expanded && (
        <div className="mt-2 ml-6 space-y-2">
          {result.suggestion && (
            <div className="text-xs bg-slate-800/50 rounded-md p-2">
              <span className="text-slate-500 font-semibold">Как исправить: </span>
              <span className="text-slate-300">{result.suggestion}</span>
            </div>
          )}
          <div className="text-[10px] text-slate-500 italic leading-relaxed border-l-2 border-slate-700 pl-2">
            {result.principle}
          </div>
        </div>
      )}
    </div>
  )
}

interface KaizenPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function KaizenPanel({ isOpen, onClose }: KaizenPanelProps) {
  const { nodes, edges } = useFactoryStore()
  const reactFlow = useReactFlow()
  const [activeFilter, setActiveFilter] = useState<KaizenCategory | 'all'>('all')
  const [showPassed, setShowPassed] = useState(false)

  const results = useMemo(() => analyzeKaizen(nodes, edges), [nodes, edges])
  const stats = useMemo(() => getKaizenScore(results), [results])

  const filtered = useMemo(() => {
    let items = results
    if (activeFilter !== 'all') {
      items = items.filter((r) => r.category === activeFilter)
    }
    if (!showPassed) {
      items = items.filter((r) => r.severity !== 'pass')
    }
    return items.sort((a, b) => {
      const order: Record<KaizenSeverity, number> = { critical: 0, warning: 1, suggestion: 2, pass: 3 }
      return order[a.severity] - order[b.severity]
    })
  }, [results, activeFilter, showPassed])

  // Подсветить узлы на канвасе
  const handleHighlight = (nodeIds: string[]) => {
    if (nodeIds.length === 0) return
    const targetNode = nodes.find((n) => n.id === nodeIds[0])
    if (targetNode) {
      reactFlow.setCenter(targetNode.position.x + 60, targetNode.position.y + 20, {
        duration: 500,
        zoom: 1.2,
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-slate-900/95 backdrop-blur-md border-l border-slate-700/50 z-20 flex flex-col shadow-2xl">
      {/* Хедер */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">改</span>
            <h2 className="font-bold text-sm">Кайдзен-анализ</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white p-1 transition-colors"
          >
            x
          </button>
        </div>

        {/* Скор */}
        <ScoreGauge score={stats.score} />
        <div className="flex justify-center gap-4 mt-2 text-[10px]">
          <span className="text-red-400">{stats.criticals} крит.</span>
          <span className="text-yellow-400">{stats.warnings} вним.</span>
          <span className="text-blue-400">{stats.suggestions} совет.</span>
          <span className="text-green-400">{stats.passed} ок</span>
        </div>
      </div>

      {/* Фильтры категорий */}
      <div className="p-3 border-b border-slate-700/50">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
              activeFilter === 'all'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Все
          </button>
          {KAIZEN_CATEGORIES.map((cat) => {
            const count = results.filter(
              (r) => r.category === cat.id && r.severity !== 'pass'
            ).length
            return (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.id)}
                className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors flex items-center gap-1 ${
                  activeFilter === cat.id
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.jp}</span>
                {count > 0 && (
                  <span className="bg-red-500/20 text-red-400 px-1 rounded text-[9px]">
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <label className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-500 cursor-pointer">
          <input
            type="checkbox"
            checked={showPassed}
            onChange={(e) => setShowPassed(e.target.checked)}
            className="rounded border-slate-600 bg-slate-800 w-3 h-3"
          />
          Показать пройденные
        </label>
      </div>

      {/* Результаты */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-hide">
        {filtered.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">🎌</p>
            <p className="text-slate-400 text-sm font-medium">Всё по Кайдзен!</p>
            <p className="text-slate-500 text-xs mt-1">Нет проблем в этой категории</p>
          </div>
        ) : (
          filtered.map((result, i) => (
            <KaizenItem
              key={`${result.ruleId}-${i}`}
              result={result}
              onHighlight={handleHighlight}
            />
          ))
        )}
      </div>
    </div>
  )
}
