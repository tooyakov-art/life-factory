import type { FactoryNode, FactoryEdge, FactoryNodeData } from '@/types/factory'

// Подсчёт метрик конвейера
export interface SchemaMetrics {
  totalNodes: number
  totalEdges: number
  activeNodes: number
  bottleneckNodes: number
  warningNodes: number
  avgFlowSpeed: number
  avgFlowVolume: number
}

export function calculateSchemaMetrics(
  nodes: FactoryNode[],
  edges: FactoryEdge[]
): SchemaMetrics {
  const activeNodes = nodes.filter(
    (n) => (n.data as FactoryNodeData).status === 'active'
  ).length
  const bottleneckNodes = nodes.filter(
    (n) => (n.data as FactoryNodeData).status === 'bottleneck'
  ).length
  const warningNodes = nodes.filter(
    (n) => (n.data as FactoryNodeData).status === 'warning'
  ).length

  const speeds = edges.map((e) => (e.data?.flowSpeed as number) ?? 0)
  const volumes = edges.map((e) => (e.data?.flowVolume as number) ?? 0)

  const avgFlowSpeed =
    speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0
  const avgFlowVolume =
    volumes.length > 0
      ? volumes.reduce((a, b) => a + b, 0) / volumes.length
      : 0

  return {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    activeNodes,
    bottleneckNodes,
    warningNodes,
    avgFlowSpeed: Math.round(avgFlowSpeed * 10) / 10,
    avgFlowVolume: Math.round(avgFlowVolume),
  }
}
