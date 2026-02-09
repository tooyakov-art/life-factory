'use client'

import { useState, useEffect } from 'react'
import { useFactoryStore } from '@/store/useFactoryStore'

export function FiveWhysModal() {
  const fiveWhysNodeId = useFactoryStore((s) => s.fiveWhysNodeId)
  const setFiveWhysNodeId = useFactoryStore((s) => s.setFiveWhysNodeId)
  const nodes = useFactoryStore((s) => s.nodes)
  const edges = useFactoryStore((s) => s.edges)
  const convertNodeToSchema = useFactoryStore((s) => s.convertNodeToSchema)
  const updateNodeData = useFactoryStore((s) => s.updateNodeData)

  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<string[]>(['', '', '', '', ''])
  const [isConverting, setIsConverting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [previousStatus, setPreviousStatus] = useState<string | null>(null)

  const node = fiveWhysNodeId ? nodes.find((n) => n.id === fiveWhysNodeId) : null
  const nodeLabel = (node?.data?.label as string) || 'Блок'
  const nodeEmoji = (node?.data?.emoji as string) || '🔧'

  // Находим связанные блоки для контекста
  const connectedLabels = fiveWhysNodeId
    ? edges
        .filter((e) => e.source === fiveWhysNodeId || e.target === fiveWhysNodeId)
        .map((e) => {
          const otherId = e.source === fiveWhysNodeId ? e.target : e.source
          const otherNode = nodes.find((n) => n.id === otherId)
          return otherNode ? (otherNode.data.label as string) : null
        })
        .filter(Boolean)
    : []

  // Контекстные вопросы на основе имени блока
  function getWhyLabels(): string[] {
    return [
      `Почему "${nodeLabel}" не работает? Что конкретно сломалось?`,
      `Почему это произошло с "${nodeLabel}"?`,
      `Что стало первопричиной этой проблемы?`,
      `Почему это не было предотвращено раньше?`,
      `Какова корневая причина? Что нужно изменить в системе?`,
    ]
  }

  // Reset state when modal opens
  useEffect(() => {
    if (fiveWhysNodeId && node) {
      setStep(0)
      setAnswers(['', '', '', '', ''])
      setIsConverting(false)
      setCopied(false)
      // Сохраняем предыдущий статус для отмены
      const prevStatus = (node.data.status as string) || 'active'
      // Если уже bottleneck — значит его только что поставили, предыдущий был active
      setPreviousStatus(prevStatus === 'bottleneck' ? 'active' : prevStatus)
    }
  }, [fiveWhysNodeId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!fiveWhysNodeId || !node) return null

  const whyLabels = getWhyLabels()

  const handleAnswer = (value: string) => {
    const next = [...answers]
    next[step] = value
    setAnswers(next)
  }

  const canNext = answers[step].trim().length > 0
  const isLastStep = step === 4
  const filledAnswers = answers.filter((a) => a.trim().length > 0)

  const handleNext = () => {
    if (isLastStep) {
      setStep(5) // Result screen
      return
    }
    setStep(step + 1)
  }

  const handleSkipToResult = () => {
    setStep(5)
  }

  // Генерация промпта с результатами анализа
  const generatePrompt = (): string => {
    const connected = connectedLabels.length > 0
      ? `Связанные блоки: ${connectedLabels.join(', ')}`
      : ''

    const whysText = filledAnswers
      .map((a, i) => `${i + 1}. Почему? — ${a}`)
      .join('\n')

    return `Блок "${nodeLabel}" ${nodeEmoji} помечен как НЕ РАБОТАЕТ (bottleneck).
${connected}

Результат анализа "5 Почему":
${whysText}

Корневая причина (#${filledAnswers.length}): ${filledAnswers[filledAnswers.length - 1]}

Задача: Предложи конкретные шаги для исправления корневой причины блока "${nodeLabel}". Учитывай контекст — этот блок является частью жизненной системы Life Factory. Дай 3-5 конкретных действий с приоритетами.`
  }

  const handleCopyPrompt = async () => {
    const prompt = generatePrompt()
    try {
      await navigator.clipboard.writeText(prompt)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = prompt
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleConvert = async () => {
    setIsConverting(true)
    const tasks = filledAnswers.map((a) => `Исправить: ${a}`)
    await convertNodeToSchema(fiveWhysNodeId, tasks)
    setIsConverting(false)
    setFiveWhysNodeId(null)
  }

  // Отмена — возвращаем статус обратно
  const handleCancel = () => {
    if (previousStatus && fiveWhysNodeId) {
      updateNodeData(fiveWhysNodeId, { status: previousStatus as 'active' | 'warning' | 'inactive' })
    }
    setFiveWhysNodeId(null)
  }

  const handleClose = () => {
    setFiveWhysNodeId(null)
  }

  const progress = Math.min(step, 5)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔍</span>
              <div>
                <h2 className="text-base font-bold text-white">5 Почему</h2>
                <p className="text-xs text-slate-400">
                  {nodeEmoji} {nodeLabel}
                  {connectedLabels.length > 0 && (
                    <span className="text-slate-600"> → {connectedLabels.slice(0, 3).join(', ')}</span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Progress */}
          <div className="flex gap-1.5 mt-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  i < progress
                    ? 'bg-red-500'
                    : i === progress && step < 5
                      ? 'bg-red-500/50 animate-pulse'
                      : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-5 pb-5">
          {step < 5 ? (
            /* Question Step */
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <span className="w-7 h-7 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-xs font-bold text-red-400 shrink-0 mt-0.5">
                  {step + 1}
                </span>
                <p className="text-sm font-medium text-slate-200">
                  {whyLabels[step]}
                </p>
              </div>

              <textarea
                value={answers[step]}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder={step === 0
                  ? `Опиши что именно не так с "${nodeLabel}"...`
                  : 'Почему это произошло...'
                }
                className="w-full h-20 px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all"
                autoFocus
              />

              {/* Previous answers */}
              {step > 0 && (
                <div className="space-y-1.5 max-h-28 overflow-y-auto">
                  {answers.slice(0, step).map((a, i) => (
                    a.trim() && (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <span className="text-red-400/60 font-mono shrink-0">#{i + 1}</span>
                        <span className="text-slate-500">{a}</span>
                      </div>
                    )
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={step > 0 ? () => setStep(step - 1) : handleCancel}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  {step > 0 ? '← Назад' : 'Отмена'}
                </button>

                <div className="flex gap-2">
                  {step >= 2 && (
                    <button
                      onClick={handleSkipToResult}
                      className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      Достаточно →
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    disabled={!canNext}
                    className="px-4 py-1.5 text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    {isLastStep ? 'Результат →' : 'Далее →'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Result Step */
            <div className="space-y-4">
              <div className="text-center py-2">
                <span className="text-3xl">🎯</span>
                <p className="text-sm font-bold text-white mt-2">
                  Анализ &quot;{nodeLabel}&quot; завершён
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Найдено {filledAnswers.length} причин
                </p>
              </div>

              {/* Answers summary */}
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {filledAnswers.map((a, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 px-3 py-2 rounded-lg border ${
                      i === filledAnswers.length - 1
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'bg-slate-800/50 border-slate-700/50'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                      i === filledAnswers.length - 1
                        ? 'bg-red-500/30 text-red-300'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {i + 1}
                    </span>
                    <span className="text-xs text-slate-300">{a}</span>
                  </div>
                ))}
              </div>

              {/* Корневая причина */}
              <div className="px-3 py-2 bg-red-500/5 border border-red-500/20 rounded-lg">
                <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wider">Корневая причина</p>
                <p className="text-xs text-slate-300 mt-1">{filledAnswers[filledAnswers.length - 1]}</p>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-1">
                {/* Копировать промпт */}
                <button
                  onClick={handleCopyPrompt}
                  className={`w-full py-2.5 text-sm font-medium rounded-xl flex items-center justify-center gap-2 transition-all ${
                    copied
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30'
                  }`}
                >
                  {copied ? (
                    <>✅ Скопировано!</>
                  ) : (
                    <>📋 Копировать промпт для Claude</>
                  )}
                </button>

                {/* В контейнер */}
                <button
                  onClick={handleConvert}
                  disabled={isConverting}
                  className="w-full py-2.5 text-sm font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-xl hover:bg-purple-500/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isConverting ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Создание контейнера...
                    </>
                  ) : (
                    <>
                      <span>📂</span>
                      В контейнер — исправить причины
                    </>
                  )}
                </button>

                <button
                  onClick={handleClose}
                  className="w-full py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Закрыть (оставить как bottleneck)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
