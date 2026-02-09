'use client'

import { memo, useState, useMemo } from 'react'
import { type NodeProps } from '@xyflow/react'
import type { FactoryNode } from '@/types/factory'
import { useFactoryStore } from '@/store/useFactoryStore'
import {
  analyzeKaizen,
  getKaizenScore,
  KAIZEN_CATEGORIES,
  type KaizenCategory,
  type KaizenSeverity,
  type KaizenResult,
} from '@/utils/kaizen'

// --- Промпт-преамбула для обучения ---
const PROMPT_PREAMBLE = `Ты работаешь с проектом "Life Factory" — визуальная операционная система жизни в стиле Factorio.

Стек: Next.js 16 + TypeScript + Tailwind v4 + @xyflow/react + Zustand

Ключевые файлы:
- Типы: src/types/factory.ts (FactoryNodeData, Schema, KanbanTask)
- Store: src/store/useFactoryStore.ts (Zustand — nodes, edges, tasks, schemas)
- Узлы: src/components/factory/NodeTypes/ (ProcessNode, SchemaNode, KanbanBoardNode, KaizenNode)
- API: src/app/api/schemas/ (CRUD для схем)
- Кайдзен: src/utils/kaizen.ts (правила + анализатор)

Схемы хранятся как JSON: schemas/{name}/schema.json
Чтобы изменить схему — редактируй JSON файл напрямую.

Структура ноды в JSON:
{ "id": "node-1", "type": "processNode", "position": { "x": 200, "y": 100 },
  "data": { "label": "Название", "emoji": "🎯", "category": "process",
            "color": "#3b82f6", "status": "active",
            "description": "Зачем этот процесс",
            "metrics": { "current": 10, "target": 50, "trend": "up", "unit": "лидов/день" }}}

Структура связи:
{ "id": "e-node1-node2-123", "source": "node-1", "target": "node-2",
  "sourceHandle": "right-out", "targetHandle": "left-in",
  "type": "animatedEdge", "data": { "flowSpeed": 3, "flowVolume": 50, "animated": true }}

Хэндлы (точки подключения): left-in, left-out, right-in, right-out, top-in, top-out, bottom-in, bottom-out
Для связи: sourceHandle = "*-out", targetHandle = "*-in"

Контейнер (SchemaNode) — ссылка на дочернюю схему:
{ "type": "schemaNode", "data": { "label": "Здоровье", "emoji": "📂", "category": "schema", "color": "#22c55e", "status": "active", "referencedSchemaId": "zdorovie-sport" }}

Для нового контейнера: создай папку schemas/{slug}/ с schema.json внутри.

ВАЖНО — автосейв:
- Приложение автосохраняет каждые 30 сек из памяти браузера в JSON файлы
- ПЕРЕД редактированием JSON файлов — попроси пользователя ЗАКРЫТЬ вкладку браузера
- Иначе автосейв перезапишет твои изменения старыми данными из памяти
- После редактирования — пользователь открывает вкладку заново

Правила:
- НЕ трогай код компонентов — меняй ТОЛЬКО JSON файлы схем
- category нод: input, process, output, amplifier, alert, schema
- status: active, warning, bottleneck, inactive
- Канбан и Кайдзен ноды (kanbanNode, kaizenNode) НЕ трогай

`

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
    <div className="relative w-20 h-20 mx-auto">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
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
        <span className="text-xl font-black" style={{ color }}>{score}</span>
        <span className="text-[8px] text-slate-500">改善</span>
      </div>
    </div>
  )
}

function KaizenItem({ result, onHighlight }: { result: KaizenResult; onHighlight: (ids: string[]) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const config = SEVERITY_CONFIG[result.severity]

  const handleCopyPrompt = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!result.prompt) return
    const text = PROMPT_PREAMBLE + result.prompt
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={`border rounded-lg p-2.5 transition-all cursor-pointer ${config.bg}`}
      onClick={() => {
        setExpanded(!expanded)
        if (result.nodeIds?.length) onHighlight(result.nodeIds)
      }}
    >
      <div className="flex items-start gap-2">
        <span className="text-xs mt-0.5">{config.icon}</span>
        <div className="flex-1 min-w-0">
          <span className={`text-[10px] font-bold ${config.color}`}>{result.ruleName}</span>
          <p className="text-[10px] text-slate-300 mt-0.5 leading-snug">{result.message}</p>
        </div>
      </div>

      {expanded && (
        <div className="mt-2 ml-5 space-y-1.5">
          {result.suggestion && (
            <div className="text-[10px] bg-slate-800/50 rounded-md p-1.5">
              <span className="text-slate-500 font-semibold">Как: </span>
              <span className="text-slate-300">{result.suggestion}</span>
            </div>
          )}
          <div className="text-[9px] text-slate-600 italic leading-relaxed border-l-2 border-slate-700 pl-2">
            {result.principle}
          </div>
          {result.prompt && (
            <button
              onClick={handleCopyPrompt}
              className={`w-full py-1 rounded-lg text-[10px] font-medium transition-all ${
                copied
                  ? 'bg-green-500/15 text-green-400 border border-green-500/25'
                  : 'bg-purple-500/15 text-purple-300 border border-purple-500/25 hover:bg-purple-500/30'
              }`}
            >
              {copied ? '✅ Скопировано!' : '📋 Копировать промпт'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function KaizenNodeComponent({ id, selected }: NodeProps<FactoryNode>) {
  const { nodes, edges, deleteNode } = useFactoryStore()
  const [activeFilter, setActiveFilter] = useState<KaizenCategory | 'all'>('all')
  const [showPassed, setShowPassed] = useState(false)
  const [allCopied, setAllCopied] = useState(false)

  // Исключаем саму кайдзен-ноду из анализа
  const analysisNodes = useMemo(() => nodes.filter((n) => n.type !== 'kaizenNode'), [nodes])
  const results = useMemo(() => analyzeKaizen(analysisNodes, edges), [analysisNodes, edges])
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

  const handleHighlight = (_nodeIds: string[]) => {
    // Можно добавить подсветку позже
  }

  const handleCopyAll = async () => {
    const allPrompts = results
      .filter((r) => r.severity !== 'pass' && r.prompt)
      .map((r, i) => `--- Проблема #${i + 1}: ${r.ruleName} (${r.severity}) ---\n${r.prompt}`)
      .join('\n\n')

    const header = `Кайдзен-анализ Life Factory нашёл ${stats.criticals + stats.warnings + stats.suggestions} проблем.\nИсправь все проблемы ниже в моей схеме:\n\n`
    const text = PROMPT_PREAMBLE + header + allPrompts

    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setAllCopied(true)
    setTimeout(() => setAllCopied(false), 2500)
  }

  const issueCount = stats.criticals + stats.warnings + stats.suggestions

  return (
    <div
      className={`
        rounded-xl border-2 bg-slate-900/95 backdrop-blur-sm
        transition-all duration-200 w-80
        ${selected ? 'ring-2 ring-amber-400/40 border-amber-500/50' : 'border-slate-700/60'}
      `}
      style={{
        boxShadow: selected
          ? '0 0 30px rgba(245,158,11,0.15)'
          : '0 4px 20px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-800/60">
        <ScoreGauge score={stats.score} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">改 Кайдзен</span>
            <button
              onClick={(e) => { e.stopPropagation(); deleteNode(id) }}
              className="ml-auto text-slate-600 hover:text-red-400 transition-colors p-1"
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M1 1L7 7M7 1L1 7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="flex gap-3 mt-1 text-[9px]">
            <span className="text-red-400">{stats.criticals} крит.</span>
            <span className="text-yellow-400">{stats.warnings} вним.</span>
            <span className="text-blue-400">{stats.suggestions} совет.</span>
            <span className="text-green-400">{stats.passed} ок</span>
          </div>
        </div>
      </div>

      {/* Скопировать все промпты */}
      {issueCount > 0 && (
        <div className="px-3 pt-2 nodrag">
          <button
            onClick={handleCopyAll}
            className={`w-full py-1.5 rounded-lg text-[10px] font-medium transition-all ${
              allCopied
                ? 'bg-green-500/15 text-green-400 border border-green-500/25'
                : 'bg-purple-500/15 text-purple-300 border border-purple-500/25 hover:bg-purple-500/25'
            }`}
          >
            {allCopied ? '✅ Все промпты скопированы!' : `📋 Скопировать все промпты (${issueCount})`}
          </button>
        </div>
      )}

      {/* Фильтры */}
      <div className="px-3 py-2 border-b border-slate-800/40 nodrag">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition-colors ${
              activeFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white hover:bg-slate-800'
            }`}
          >
            Все
          </button>
          {KAIZEN_CATEGORIES.map((cat) => {
            const count = results.filter((r) => r.category === cat.id && r.severity !== 'pass').length
            return (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.id)}
                className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition-colors flex items-center gap-0.5 ${
                  activeFilter === cat.id ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span className="text-[8px]">{cat.emoji}</span>
                <span>{cat.jp}</span>
                {count > 0 && (
                  <span className="bg-red-500/20 text-red-400 px-1 rounded text-[8px]">{count}</span>
                )}
              </button>
            )
          })}
        </div>
        <label className="flex items-center gap-1 mt-1.5 text-[9px] text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showPassed}
            onChange={(e) => setShowPassed(e.target.checked)}
            className="rounded border-slate-600 bg-slate-800 w-2.5 h-2.5"
          />
          Пройденные
        </label>
      </div>

      {/* Результаты */}
      <div className="max-h-80 overflow-y-auto p-2.5 space-y-1.5 nodrag nowheel scrollbar-hide">
        {filtered.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-2xl mb-1">🎌</p>
            <p className="text-slate-400 text-xs font-medium">Всё по Кайдзен!</p>
            <p className="text-slate-600 text-[10px] mt-0.5">Нет проблем</p>
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

export const KaizenNode = memo(KaizenNodeComponent)
