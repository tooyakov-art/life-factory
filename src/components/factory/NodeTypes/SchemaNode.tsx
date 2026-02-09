'use client'

import { memo, useState, useEffect } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useRouter } from 'next/navigation'
import type { FactoryNode, Schema } from '@/types/factory'
import { useFactoryStore } from '@/store/useFactoryStore'

// Статус дочерней схемы по её узлам
function getChildStatus(schema: Schema | null): 'green' | 'yellow' | 'red' | 'unknown' {
  if (!schema) return 'unknown'
  if (schema.nodes.length === 0) return 'green'
  const hasBottleneck = schema.nodes.some((n) => n.data.status === 'bottleneck')
  if (hasBottleneck) return 'red'
  const hasWarning = schema.nodes.some((n) => n.data.status === 'warning')
  if (hasWarning) return 'yellow'
  return 'green'
}

const STATUS_DOT: Record<string, string> = {
  green: 'bg-green-400 shadow-green-400/50',
  yellow: 'bg-yellow-400 shadow-yellow-400/50 animate-pulse',
  red: 'bg-red-500 shadow-red-500/50 animate-pulse',
  unknown: 'bg-slate-500',
}

function SchemaNodeComponent({ id, data, selected }: NodeProps<FactoryNode>) {
  const router = useRouter()
  const deleteNode = useFactoryStore((s) => s.deleteNode)
  const saveCurrentSchema = useFactoryStore((s) => s.saveCurrentSchema)
  const [childSchema, setChildSchema] = useState<Schema | null>(null)
  const [showMenu, setShowMenu] = useState(false)

  const schemaId = data.referencedSchemaId as string | undefined

  // Загружаем данные дочерней схемы для статуса
  useEffect(() => {
    if (!schemaId) return
    fetch(`/api/schemas/${encodeURIComponent(schemaId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => setChildSchema(s))
      .catch(() => setChildSchema(null))
  }, [schemaId])

  const childStatus = getChildStatus(childSchema)
  const nodeCount = childSchema?.nodes.length ?? 0
  const edgeCount = childSchema?.edges.length ?? 0

  const handleOpen = () => {
    if (!schemaId) return
    saveCurrentSchema()
    router.push(`/factory/${encodeURIComponent(schemaId)}`)
  }

  return (
    <div className="relative">
      {/* Красная пульсация если внутри bottleneck */}
      {childStatus === 'red' && (
        <div
          className="absolute -inset-3 rounded-xl animate-ping opacity-15"
          style={{ backgroundColor: '#ef4444' }}
        />
      )}

      {/* Основной блок — толстая рамка, стиль "папка" */}
      <div
        className={`
          relative min-w-28 rounded-lg border-3 px-4 py-3
          transition-all duration-200 touch-manipulation cursor-pointer
          ${selected ? 'ring-2 ring-white/40 scale-105' : ''}
        `}
        style={{
          borderColor: data.color as string,
          backgroundColor: `${data.color as string}15`,
          boxShadow: selected
            ? `0 0 20px ${data.color as string}40`
            : `0 0 12px ${data.color as string}15`,
        }}
        onDoubleClick={(e) => {
          e.stopPropagation()
          handleOpen()
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setShowMenu(!showMenu)
        }}
      >
        {/* Хэндлы — 4 стороны */}
        <Handle type="target" position={Position.Left} id="left-in"
          className="w-1! h-1! opacity-0! pointer-events-none!" />
        <Handle type="source" position={Position.Left} id="left-out"
          className="w-1! h-1! opacity-0! pointer-events-none!" />
        <Handle type="target" position={Position.Right} id="right-in"
          className="w-1! h-1! opacity-0! pointer-events-none!" />
        <Handle type="source" position={Position.Right} id="right-out"
          className="w-1! h-1! opacity-0! pointer-events-none!" />
        <Handle type="target" position={Position.Top} id="top-in"
          className="w-1! h-1! opacity-0! pointer-events-none!" />
        <Handle type="source" position={Position.Top} id="top-out"
          className="w-1! h-1! opacity-0! pointer-events-none!" />
        <Handle type="target" position={Position.Bottom} id="bottom-in"
          className="w-1! h-1! opacity-0! pointer-events-none!" />
        <Handle type="source" position={Position.Bottom} id="bottom-out"
          className="w-1! h-1! opacity-0! pointer-events-none!" />

        {/* Статус-точка */}
        <div className={`absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 shadow-md ${STATUS_DOT[childStatus]}`} />

        {/* Иконка + название */}
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none">📂</span>
          <span className="text-sm font-semibold text-slate-100 whitespace-nowrap">
            {data.label as string}
          </span>
        </div>

        {/* Мета: версия + кол-во блоков/связей внутри */}
        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400">
          <span className="font-mono text-slate-500">v{childSchema?.version || '0.1'}</span>
          <span>{nodeCount} блоков</span>
          <span>{edgeCount} связей</span>
        </div>

        {/* Кнопка "Открыть" */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleOpen()
          }}
          className="mt-2 w-full text-center text-[11px] font-medium py-1 rounded-md transition-colors"
          style={{
            backgroundColor: `${data.color as string}25`,
            color: data.color as string,
          }}
        >
          Открыть →
        </button>
      </div>

      {/* Контекстное меню */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute top-full left-0 mt-2 z-50 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl overflow-hidden min-w-36">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleOpen()
                setShowMenu(false)
              }}
              className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50 flex items-center gap-2 transition-colors"
            >
              <span>📂</span><span>Открыть</span>
            </button>
            <div className="border-t border-slate-700">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteNode(id)
                  setShowMenu(false)
                }}
                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
              >
                <span>🗑️</span><span>Удалить</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export const SchemaNode = memo(SchemaNodeComponent)
