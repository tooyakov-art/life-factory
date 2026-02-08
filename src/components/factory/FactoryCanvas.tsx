'use client'

import { useCallback } from 'react'
import {
  ReactFlow,
  Background,
  MiniMap,
  ConnectionMode,
  type NodeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { useFactoryStore } from '@/store/useFactoryStore'
import { customNodeTypes } from './NodeTypes'
import { customEdgeTypes } from './EdgeTypes'
import type { FactoryNode, FactoryNodeData, NodePreset } from '@/types/factory'

export function FactoryCanvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    editorMode,
    addNode,
    closePalette,
  } = useFactoryStore()

  // Клик по канвасу — добавить узел если режим addNode
  const handlePaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (editorMode !== 'addNode') return
      // Координаты берём из React Flow через screenToFlowPosition в будущем
      // Пока просто закрываем палитру
      closePalette()
    },
    [editorMode, closePalette]
  )

  // Клик по узлу
  const handleNodeClick: NodeMouseHandler<FactoryNode> = useCallback(
    (_event, node) => {
      // Будущая логика: открытие деталей узла
    },
    []
  )

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        connectionMode={ConnectionMode.Loose}
        onPaneClick={handlePaneClick}
        onNodeClick={handleNodeClick}
        nodeTypes={customNodeTypes}
        edgeTypes={customEdgeTypes}
        fitView
        minZoom={0.3}
        maxZoom={2}
        panOnScroll={false}
        panOnDrag={true}
        zoomOnPinch={true}
        deleteKeyCode="Delete"
        style={{ background: '#0f172a' }}
        defaultEdgeOptions={{
          type: 'animatedEdge',
          data: { flowSpeed: 3, flowVolume: 50, animated: true },
        }}
      >
        <MiniMap
          style={{ background: '#1e293b' }}
          nodeColor={(n) => {
            const data = n.data as FactoryNodeData | undefined
            return (data?.color as string) ?? '#334155'
          }}
          maskColor="rgba(15, 23, 42, 0.7)"
          className="!rounded-lg !border !border-slate-700"
        />
        <Background color="#1e293b" gap={20} />
      </ReactFlow>
    </div>
  )
}
