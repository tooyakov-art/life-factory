import type { IntegrationPollResult, SteamResponse } from './types'

// Привязка Steam данных к нодам (для MVP — хардкод, потом → настройки в JSON)
const STEAM_BINDINGS = [
  {
    nodeId: 'node-hobby',
    sourceField: 'restPlaytime2Weeks' as const,
    unit: 'часов/2нед',
    target: 3,
  },
]

export async function pollSteam(): Promise<IntegrationPollResult[]> {
  try {
    const res = await fetch('/api/integrations/steam')

    if (!res.ok) {
      return STEAM_BINDINGS.map((b) => ({
        nodeId: b.nodeId,
        metrics: { current: 0, trend: 'stable' as const, unit: b.unit },
        integration: {
          type: 'steam' as const,
          status: 'error' as const,
          lastSync: new Date().toISOString(),
        },
      }))
    }

    const data: SteamResponse = await res.json()

    return STEAM_BINDINGS.map((binding) => {
      const rawMinutes = data[binding.sourceField] ?? 0
      const hours = Math.round((rawMinutes / 60) * 10) / 10

      return {
        nodeId: binding.nodeId,
        metrics: {
          current: hours,
          target: binding.target,
          trend: (hours > 0 ? 'up' : 'stable') as 'up' | 'down' | 'stable',
          unit: binding.unit,
        },
        integration: {
          type: 'steam' as const,
          status: 'connected' as const,
          lastSync: data.lastSync,
        },
      }
    })
  } catch {
    return STEAM_BINDINGS.map((b) => ({
      nodeId: b.nodeId,
      metrics: { current: 0, trend: 'stable' as const, unit: b.unit },
      integration: {
        type: 'steam' as const,
        status: 'error' as const,
        lastSync: new Date().toISOString(),
      },
    }))
  }
}
