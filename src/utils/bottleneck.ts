import type { FactoryNode, FactoryEdge, FactoryNodeData, Alert } from '@/types/factory'

interface BottleneckResult {
  nodeId: string
  type: Alert['type']
  message: string
  severity: Alert['severity']
}

// Анализ узлов на узкие горлышки и проблемы
export function detectBottlenecks(
  nodes: FactoryNode[],
  edges: FactoryEdge[]
): BottleneckResult[] {
  const results: BottleneckResult[] = []

  for (const node of nodes) {
    const data = node.data as FactoryNodeData

    // 1. Метрики значительно ниже цели → bottleneck
    if (data.metrics && data.metrics.target) {
      if (data.metrics.current < data.metrics.target * 0.5) {
        results.push({
          nodeId: node.id,
          type: 'bottleneck',
          message: `«${data.label}»: ${data.metrics.current} из ${data.metrics.target} ${data.metrics.unit}`,
          severity: 'critical',
        })
      } else if (data.metrics.current < data.metrics.target * 0.75) {
        results.push({
          nodeId: node.id,
          type: 'warning',
          message: `«${data.label}» отстаёт: ${data.metrics.current}/${data.metrics.target} ${data.metrics.unit}`,
          severity: 'warning',
        })
      }
    }

    // 2. Входящий поток >> исходящий → плохая конверсия
    const incomingEdges = edges.filter((e) => e.target === node.id)
    const outgoingEdges = edges.filter((e) => e.source === node.id)

    if (incomingEdges.length > 0 && outgoingEdges.length > 0) {
      const inVolume = incomingEdges.reduce(
        (sum, e) => sum + ((e.data?.flowVolume as number) ?? 0),
        0
      )
      const outVolume = outgoingEdges.reduce(
        (sum, e) => sum + ((e.data?.flowVolume as number) ?? 0),
        0
      )

      if (outVolume > 0 && inVolume > outVolume * 2) {
        results.push({
          nodeId: node.id,
          type: 'bottleneck',
          message: `«${data.label}»: входящий поток (${inVolume}) в ${Math.round(inVolume / outVolume)}x больше исходящего (${outVolume})`,
          severity: 'warning',
        })
      }
    }

    // 3. Интеграция с ошибкой → bottleneck
    if (data.integration && data.integration.status === 'error') {
      results.push({
        nodeId: node.id,
        type: 'down',
        message: `«${data.label}»: интеграция ${data.integration.type} не работает`,
        severity: 'critical',
      })
    }

    // 4. Нет исходящих связей у процесса → тупик
    if (
      data.category === 'process' &&
      outgoingEdges.length === 0
    ) {
      results.push({
        nodeId: node.id,
        type: 'warning',
        message: `«${data.label}»: процесс без выхода (тупик)`,
        severity: 'info',
      })
    }

    // 5. Нет входящих связей у процесса → не подключён
    if (
      data.category === 'process' &&
      incomingEdges.length === 0
    ) {
      results.push({
        nodeId: node.id,
        type: 'warning',
        message: `«${data.label}»: процесс без входа`,
        severity: 'info',
      })
    }
  }

  return results
}

// Конвертировать результаты в алерты
export function bottlenecksToAlerts(
  schemaId: string,
  results: BottleneckResult[]
): Alert[] {
  return results.map((r) => ({
    id: `alert-${schemaId}-${r.nodeId}-${r.type}`,
    schemaId,
    nodeId: r.nodeId,
    type: r.type,
    message: r.message,
    severity: r.severity,
    createdAt: new Date().toISOString(),
    resolved: false,
  }))
}

// Обновить статус узлов на основе анализа
export function applyBottleneckStatus(
  nodes: FactoryNode[],
  results: BottleneckResult[]
): FactoryNode[] {
  const bottleneckNodeIds = new Set(
    results.filter((r) => r.severity === 'critical').map((r) => r.nodeId)
  )
  const warningNodeIds = new Set(
    results
      .filter((r) => r.severity === 'warning')
      .map((r) => r.nodeId)
  )

  return nodes.map((node) => {
    let newStatus: FactoryNodeData['status'] = 'active'
    if (bottleneckNodeIds.has(node.id)) {
      newStatus = 'bottleneck'
    } else if (warningNodeIds.has(node.id)) {
      newStatus = 'warning'
    }

    if (node.data.status !== newStatus) {
      return { ...node, data: { ...node.data, status: newStatus } }
    }
    return node
  })
}
