'use client'

import { useAlertStore } from '@/store/useAlertStore'
import { useFactoryStore } from '@/store/useFactoryStore'

const SEVERITY_STYLES = {
  critical: 'border-red-500/40 bg-red-500/10 text-red-400',
  warning: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400',
  info: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
}

const SEVERITY_ICONS = {
  critical: '🔴',
  warning: '🟡',
  info: '🔵',
}

export function AlertsList() {
  const { getUnresolved, resolveAlert } = useAlertStore()
  const { schemas } = useFactoryStore()
  const alerts = getUnresolved()

  if (alerts.length === 0) return null

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        Требует внимания
        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
          {alerts.length}
        </span>
      </h2>
      <div className="space-y-2">
        {alerts.slice(0, 5).map((alert) => {
          const schema = schemas.find((s) => s.id === alert.schemaId)
          return (
            <div
              key={alert.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${SEVERITY_STYLES[alert.severity]}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span>{SEVERITY_ICONS[alert.severity]}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {alert.message}
                  </p>
                  {schema && (
                    <p className="text-xs opacity-70">{schema.name}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => resolveAlert(alert.id)}
                className="text-xs opacity-50 hover:opacity-100 transition-opacity ml-2 flex-shrink-0"
              >
                Закрыть
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
