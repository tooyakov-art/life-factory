'use client'

import { useEffect, useRef } from 'react'
import { useFactoryStore } from '@/store/useFactoryStore'
import { pollSteam } from '@/lib/integrations/steam'

const POLL_INTERVAL = 120_000 // 2 минуты

export function useIntegrationPolling(schemaId: string | null) {
  const updateNodeData = useFactoryStore((s) => s.updateNodeData)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!schemaId) return

    // Проверяем есть ли ноды с Steam интеграцией в текущей схеме
    const nodes = useFactoryStore.getState().nodes
    const hasSteamNodes = nodes.some(
      (n) =>
        n.id === 'node-hobby' ||
        (n.data.integration && (n.data.integration as { type: string }).type === 'steam')
    )

    if (!hasSteamNodes) return

    async function poll() {
      const results = await pollSteam()
      const currentNodes = useFactoryStore.getState().nodes

      for (const result of results) {
        const nodeExists = currentNodes.some((n) => n.id === result.nodeId)
        if (nodeExists) {
          updateNodeData(result.nodeId, {
            metrics: result.metrics,
            integration: result.integration,
          })
        }
      }
    }

    // Первый опрос сразу
    poll()

    // Далее каждые 2 минуты
    intervalRef.current = setInterval(poll, POLL_INTERVAL)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [schemaId, updateNodeData])
}
