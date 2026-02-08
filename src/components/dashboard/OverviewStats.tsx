'use client'

import { useFactoryStore } from '@/store/useFactoryStore'
import { useAlertStore } from '@/store/useAlertStore'

export function OverviewStats() {
  const { schemas } = useFactoryStore()
  const { getUnresolved } = useAlertStore()

  const totalNodes = schemas.reduce((acc, s) => acc + s.nodes.length, 0)
  const totalEdges = schemas.reduce((acc, s) => acc + s.edges.length, 0)
  const alertCount = getUnresolved().length

  const stats = [
    { label: 'Схемы', value: schemas.length, icon: '🏭', color: '#3b82f6' },
    { label: 'Блоки', value: totalNodes, icon: '🔲', color: '#8b5cf6' },
    { label: 'Связи', value: totalEdges, icon: '🔗', color: '#10b981' },
    { label: 'Проблемы', value: alertCount, icon: '⚠️', color: '#ef4444', alert: alertCount > 0 },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`
            relative p-4 rounded-2xl border overflow-hidden
            ${stat.alert
              ? 'border-red-500/30 bg-red-500/5'
              : 'border-slate-700/50 bg-slate-800/30'
            }
          `}
        >
          {/* Фоновый градиент */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              background: `radial-gradient(circle at top right, ${stat.color}, transparent 70%)`,
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{stat.icon}</span>
              <span className="text-3xl font-bold tracking-tight">{stat.value}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
