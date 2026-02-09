'use client'

import { memo, useMemo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react'
import type { FactoryEdge } from '@/types/factory'
import { useFactoryStore } from '@/store/useFactoryStore'

function getBallCount(flowSpeed: number, isMobile: boolean): number {
  const count = Math.max(1, Math.min(6, Math.ceil(flowSpeed / 2)))
  return isMobile ? Math.min(count, 3) : count
}

function AnimatedEdgeComponent({
  id,
  source,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<FactoryEdge>) {
  // Check if this edge's source is blocked (bottleneck or downstream of one)
  const isBlocked = useFactoryStore((s) => {
    const bottleneckIds = new Set<string>()
    for (const n of s.nodes) {
      if (n.data.status === 'bottleneck' || n.data.status === 'inactive') {
        bottleneckIds.add(n.id)
      }
    }
    if (bottleneckIds.size === 0) return false
    if (bottleneckIds.has(source)) return true

    // BFS: find all nodes downstream of bottlenecks
    const blocked = new Set<string>(bottleneckIds)
    const queue = [...bottleneckIds]
    while (queue.length > 0) {
      const cur = queue.shift()!
      for (const e of s.edges) {
        if (e.source === cur && !blocked.has(e.target)) {
          blocked.add(e.target)
          queue.push(e.target)
        }
      }
    }
    return blocked.has(source)
  })

  const flowSpeed = (data?.flowSpeed as number) ?? 3
  const flowVolume = (data?.flowVolume as number) ?? 50
  const isAnimated = ((data?.animated as boolean) ?? true) && !isBlocked

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  const ballCount = useMemo(
    () => getBallCount(flowSpeed, isMobile),
    [flowSpeed, isMobile]
  )

  const ballColor = isBlocked ? '#475569' : flowVolume < 20 ? '#ef4444' : '#facc15'
  const duration = Math.max(1, 8 - flowSpeed)
  const ballRadius = Math.max(3, Math.min(6, flowVolume / 15))

  return (
    <>
      {/* Основная линия */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: isBlocked ? '#334155' : selected ? '#f8fafc' : '#475569',
          strokeWidth: selected ? 2.5 : 1.5,
          strokeDasharray: isAnimated ? undefined : '5 5',
          opacity: isBlocked ? 0.4 : 1,
          transition: 'stroke 0.5s, opacity 0.5s',
        }}
      />

      {/* Анимированные шарики — только если не заблокирован */}
      {isAnimated && (
        <g>
          {Array.from({ length: ballCount }).map((_, i) => (
            <circle
              key={`${id}-ball-${i}`}
              r={ballRadius}
              fill={ballColor}
              filter={`url(#glow-${id})`}
            >
              <animateMotion
                dur={`${duration}s`}
                repeatCount="indefinite"
                begin={`${(i * duration) / ballCount}s`}
                path={edgePath}
              />
            </circle>
          ))}
          <defs>
            <filter id={`glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </g>
      )}

      {/* Лейбл на связи */}
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            className="absolute pointer-events-none px-1.5 py-0.5 rounded text-[10px] text-slate-400 bg-slate-900/80"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY - 14}px)`,
            }}
          >
            {data.label as string}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export const AnimatedEdge = memo(AnimatedEdgeComponent)
