'use client'

import { memo, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { FactoryNode, FactoryNodeData } from '@/types/factory'
import { useFactoryStore } from '@/store/useFactoryStore'

// Стрелка тренда
function TrendArrow({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <span className="text-green-400">↑</span>
  if (trend === 'down') return <span className="text-red-400">↓</span>
  return <span className="text-slate-400">→</span>
}

// Индикатор интеграции
function IntegrationDot({ status }: { status: 'connected' | 'disconnected' | 'error' }) {
  const colors = {
    connected: 'bg-green-400',
    disconnected: 'bg-slate-500',
    error: 'bg-red-500 animate-pulse',
  }
  return (
    <div
      className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-800 ${colors[status]}`}
    />
  )
}

// Статусы для меню
const STATUS_OPTIONS: { value: FactoryNodeData['status']; label: string; icon: string }[] = [
  { value: 'active', label: 'Активен', icon: '🟢' },
  { value: 'warning', label: 'Высокий риск', icon: '🟡' },
  { value: 'bottleneck', label: 'Не работает', icon: '🔴' },
  { value: 'inactive', label: 'Выключен', icon: '⚫' },
]

function ProcessNodeComponent({ id, data, selected }: NodeProps<FactoryNode>) {
  const updateNodeData = useFactoryStore((s) => s.updateNodeData)
  const deleteNode = useFactoryStore((s) => s.deleteNode)
  const [showMenu, setShowMenu] = useState(false)

  const isBottleneck = data.status === 'bottleneck'
  const isWarning = data.status === 'warning'
  const isInactive = data.status === 'inactive'

  const handleStatusChange = (status: FactoryNodeData['status']) => {
    updateNodeData(id, { status })
    setShowMenu(false)
  }

  return (
    <div className="relative">
      {/* Красная пульсация фоном для bottleneck */}
      {isBottleneck && (
        <div
          className="absolute -inset-3 rounded-2xl animate-ping opacity-20"
          style={{ backgroundColor: '#ef4444' }}
        />
      )}

      {/* Жёлтая пульсация для warning */}
      {isWarning && (
        <div
          className="absolute -inset-2 rounded-2xl animate-pulse opacity-15"
          style={{ backgroundColor: '#f59e0b' }}
        />
      )}

      {/* Основной блок */}
      <div
        className={`
          relative min-w-20 rounded-xl border-2 px-3 py-2
          transition-all duration-200 touch-manipulation
          ${selected ? 'ring-2 ring-white/40 scale-105' : ''}
          ${isInactive ? 'opacity-40 grayscale' : ''}
        `}
        style={{
          borderColor: isBottleneck
            ? '#ef4444'
            : isWarning
              ? '#f59e0b'
              : (data.color as string),
          backgroundColor: isBottleneck
            ? 'rgba(239, 68, 68, 0.15)'
            : isWarning
              ? 'rgba(245, 158, 11, 0.1)'
              : `${data.color as string}20`,
          boxShadow: isBottleneck
            ? '0 0 30px rgba(239, 68, 68, 0.5), inset 0 0 15px rgba(239, 68, 68, 0.1)'
            : isWarning
              ? '0 0 20px rgba(245, 158, 11, 0.35), inset 0 0 10px rgba(245, 158, 11, 0.05)'
              : selected
                ? `0 0 15px ${data.color as string}30`
                : `0 0 8px ${data.color as string}10`,
        }}
        onDoubleClick={(e) => {
          e.stopPropagation()
          setShowMenu(!showMenu)
        }}
      >
        {/* Хэндлы */}
        <Handle
          type="target"
          position={Position.Left}
          className="w-3! h-3! bg-slate-600! border-2! border-slate-400! hover:bg-blue-500! hover:border-blue-400! transition-colors!"
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-3! h-3! bg-slate-600! border-2! border-slate-400! hover:bg-blue-500! hover:border-blue-400! transition-colors!"
        />

        {/* Индикатор интеграции */}
        {data.integration && (
          <IntegrationDot status={data.integration.status as 'connected' | 'disconnected' | 'error'} />
        )}

        {/* Красный восклицательный знак для bottleneck */}
        {isBottleneck && (
          <div className="absolute -top-2.5 -left-2.5 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-red-500/40 animate-bounce">
            !
          </div>
        )}

        {/* Жёлтый знак для warning */}
        {isWarning && (
          <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center text-black text-[10px] font-black shadow-lg shadow-yellow-500/30">
            ⚠
          </div>
        )}

        {/* Эмодзи + название */}
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none">{data.emoji as string}</span>
          <span className="text-sm font-medium text-slate-100 whitespace-nowrap">
            {data.label as string}
          </span>
        </div>

        {/* Метрики */}
        {data.metrics && (
          <div className="mt-1 flex items-center gap-1 text-xs">
            <span className="font-bold text-white">
              {(data.metrics as { current: number }).current}
            </span>
            <span className="text-slate-400">
              {(data.metrics as { unit: string }).unit}
            </span>
            <TrendArrow trend={(data.metrics as { trend: 'up' | 'down' | 'stable' }).trend} />
            {(data.metrics as { target?: number }).target && (
              <span className="text-slate-500 ml-1">
                / {(data.metrics as { target: number }).target}
              </span>
            )}
          </div>
        )}

        {/* Статус-бар внизу */}
        {(isBottleneck || isWarning) && (
          <div
            className={`mt-1.5 text-[10px] font-semibold text-center rounded px-1 py-0.5 ${
              isBottleneck
                ? 'bg-red-500/20 text-red-400'
                : 'bg-yellow-500/20 text-yellow-400'
            }`}
          >
            {isBottleneck ? 'СТОП' : 'РИСК'}
          </div>
        )}
      </div>

      {/* Контекстное меню (двойной тап) */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute top-full left-0 mt-2 z-50 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl overflow-hidden min-w-40">
            <div className="px-3 py-2 text-[10px] text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-700">
              Статус
            </div>
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={(e) => {
                  e.stopPropagation()
                  handleStatusChange(opt.value)
                }}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                  data.status === opt.value
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                <span>{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            ))}
            <div className="border-t border-slate-700">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteNode(id)
                  setShowMenu(false)
                }}
                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
              >
                <span>🗑️</span>
                <span>Удалить</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export const ProcessNode = memo(ProcessNodeComponent)
