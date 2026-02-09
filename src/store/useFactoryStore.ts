import { create } from 'zustand'
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type Connection,
} from '@xyflow/react'
import type { Schema, FactoryNode, FactoryEdge, FactoryNodeData, KanbanTask, KanbanColumn } from '@/types/factory'
import { DEFAULT_KANBAN_COLUMNS } from '@/types/factory'

// --- Debounce для автосохранения ---
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function scheduleSave() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    const state = useFactoryStore.getState()
    state.saveCurrentSchema()
  }, 2000)
}

// --- Интерфейс стора ---
interface FactoryState {
  // Данные
  schemas: Schema[]
  activeSchemaId: string | null
  nodes: FactoryNode[]
  edges: FactoryEdge[]
  tasks: KanbanTask[]
  kanbanColumns: KanbanColumn[]
  isLoading: boolean

  // React Flow callbacks
  onNodesChange: OnNodesChange<FactoryNode>
  onEdgesChange: OnEdgesChange<FactoryEdge>
  onConnect: OnConnect

  // Загрузка из API
  loadSchemas: () => Promise<void>

  // Действия со схемами
  addSchema: (schema: Omit<Schema, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Schema>
  deleteSchema: (id: string) => Promise<void>
  setActiveSchema: (id: string) => void
  saveCurrentSchema: () => Promise<void>

  // Действия с узлами
  addNode: (node: FactoryNode) => void
  updateNodeData: (nodeId: string, data: Partial<FactoryNodeData>) => void
  deleteNode: (nodeId: string) => void
  deleteEdge: (edgeId: string) => void

  // Превращение узла в контейнер
  convertNodeToSchema: (nodeId: string, initialTasks?: string[]) => Promise<void>

  // 5 Почему (при bottleneck)
  fiveWhysNodeId: string | null
  setFiveWhysNodeId: (id: string | null) => void

  // Канбан задачи
  addTask: (title: string, columnId?: string) => void
  moveTask: (taskId: string, columnId: string) => void
  updateTaskTitle: (taskId: string, title: string) => void
  deleteTask: (taskId: string) => void

  // Канбан колонки
  addColumn: (label: string) => void
  renameColumn: (columnId: string, label: string) => void
  deleteColumn: (columnId: string) => void

  // Kanban node на канвасе
  ensureKanbanNode: () => void

  // Кайдзен-нода на канвасе
  ensureKaizenNode: () => void

}

export const useFactoryStore = create<FactoryState>()((set, get) => ({
  schemas: [],
  activeSchemaId: null,
  nodes: [],
  edges: [],
  tasks: [],
  kanbanColumns: DEFAULT_KANBAN_COLUMNS,
  isLoading: false,
  fiveWhysNodeId: null,

  // --- Загрузка всех схем из API ---
  loadSchemas: async () => {
    set({ isLoading: true })
    try {
      const res = await fetch('/api/schemas')
      if (res.ok) {
        const schemas: Schema[] = await res.json()
        set({ schemas })
      }
    } catch (err) {
      console.error('Ошибка загрузки схем:', err)
    } finally {
      set({ isLoading: false })
    }
  },

  // --- React Flow callbacks ---
  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) })
    scheduleSave()
  },
  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) })
    scheduleSave()
  },
  onConnect: (connection: Connection) => {
    const newEdge: FactoryEdge = {
      ...connection,
      id: `e-${connection.source}-${connection.target}-${Date.now()}`,
      type: 'animatedEdge',
      data: { flowSpeed: 3, flowVolume: 50, animated: true },
    }
    set({ edges: addEdge(newEdge, get().edges) })
    scheduleSave()
  },

  // --- Схемы ---
  addSchema: async (schemaData) => {
    const res = await fetch('/api/schemas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schemaData),
    })
    if (!res.ok) throw new Error('Failed to create schema')
    const schema: Schema = await res.json()
    set((state) => ({ schemas: [...state.schemas, schema] }))
    return schema
  },

  deleteSchema: async (id) => {
    const res = await fetch(`/api/schemas/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error('Failed to delete schema')
    set((state) => ({
      schemas: state.schemas.filter((s) => s.id !== id),
      activeSchemaId: state.activeSchemaId === id ? null : state.activeSchemaId,
    }))
  },

  setActiveSchema: (id) => {
    const schema = get().schemas.find((s) => s.id === id)
    if (schema) {
      const columns = schema.kanbanColumns?.length ? schema.kanbanColumns : DEFAULT_KANBAN_COLUMNS
      // Миграция: старые задачи с status → columnId
      const tasks = (schema.tasks || []).map((t) => {
        if ('columnId' in t && t.columnId) return t
        const oldStatus = (t as unknown as { status?: string }).status
        const columnId = oldStatus === 'doing' ? 'doing' : oldStatus === 'done' ? 'done' : columns[0]?.id || 'ideas'
        return { ...t, columnId }
      })
      set({ activeSchemaId: id, nodes: schema.nodes, edges: schema.edges, tasks, kanbanColumns: columns })
    }
  },

  saveCurrentSchema: async () => {
    const { activeSchemaId, nodes, edges, tasks, kanbanColumns, schemas } = get()
    if (!activeSchemaId) return

    const schema = schemas.find((s) => s.id === activeSchemaId)
    if (!schema) return

    const updated = { ...schema, nodes, edges, tasks, kanbanColumns }

    try {
      const res = await fetch(`/api/schemas/${encodeURIComponent(activeSchemaId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
      if (res.ok) {
        const saved: Schema = await res.json()
        set({
          schemas: schemas.map((s) => (s.id === activeSchemaId ? saved : s)),
        })
      }
    } catch (err) {
      console.error('Ошибка сохранения схемы:', err)
    }
  },

  // --- Узлы ---
  addNode: (node) => {
    set((state) => ({ nodes: [...state.nodes, node] }))
    scheduleSave()
  },

  updateNodeData: (nodeId, data) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ),
    }))
    scheduleSave()
  },

  deleteNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    }))
    scheduleSave()
  },

  deleteEdge: (edgeId) => {
    set((state) => ({ edges: state.edges.filter((e) => e.id !== edgeId) }))
    scheduleSave()
  },

  // --- Превращение узла в контейнер ---
  convertNodeToSchema: async (nodeId, initialTasks) => {
    const node = get().nodes.find((n) => n.id === nodeId)
    if (!node) return

    const d = node.data as FactoryNodeData
    // Создаём новую схему v0.2 (эволюция из простого блока)
    const tasks: KanbanTask[] = (initialTasks || []).map((title, i) => ({
      id: `task-${Date.now()}-${i}`,
      title,
      columnId: 'ideas',
      createdAt: new Date().toISOString(),
    }))

    const newSchema = await get().addSchema({
      name: d.label,
      description: `Контейнер для: ${d.label}`,
      category: 'business',
      version: '0.2',
      nodes: [],
      edges: [],
      tasks,
    })

    // Заменяем processNode на schemaNode
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              type: 'schemaNode' as const,
              data: {
                ...n.data,
                emoji: '📂',
                category: 'schema' as const,
                referencedSchemaId: newSchema.id,
              },
            }
          : n
      ),
    }))

    // Bump parent schema version
    const { activeSchemaId, schemas } = get()
    if (activeSchemaId) {
      const current = schemas.find((s) => s.id === activeSchemaId)
      if (current) {
        const v = parseFloat(current.version || '0.1')
        const newVersion = (v + 0.1).toFixed(1)
        set({
          schemas: get().schemas.map((s) =>
            s.id === activeSchemaId ? { ...s, version: newVersion } : s
          ),
        })
      }
    }
    scheduleSave()
  },

  // --- 5 Почему ---
  setFiveWhysNodeId: (id) => set({ fiveWhysNodeId: id }),

  // --- Канбан задачи ---
  addTask: (title, columnId) => {
    const columns = get().kanbanColumns
    const task: KanbanTask = {
      id: `task-${Date.now()}`,
      title,
      columnId: columnId || columns[0]?.id || 'ideas',
      createdAt: new Date().toISOString(),
    }
    set((state) => ({ tasks: [...state.tasks, task] }))
    scheduleSave()
  },

  moveTask: (taskId, columnId) => {
    const { schemas, activeSchemaId } = get()
    const schema = schemas.find((s) => s.id === activeSchemaId)
    const version = schema?.version || '0.1'

    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== taskId) return t
        // Если переносим в последнюю колонку (done) — запоминаем версию
        const columns = get().kanbanColumns
        const lastCol = columns[columns.length - 1]
        const isDone = lastCol && columnId === lastCol.id
        return {
          ...t,
          columnId,
          completedAt: isDone ? new Date().toISOString() : undefined,
          completedVersion: isDone ? `v${version}` : undefined,
        }
      }),
    }))
    scheduleSave()
  },

  updateTaskTitle: (taskId, title) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, title } : t)),
    }))
    scheduleSave()
  },

  deleteTask: (taskId) => {
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== taskId) }))
    scheduleSave()
  },

  // --- Канбан колонки ---
  addColumn: (label) => {
    const col: KanbanColumn = {
      id: `col-${Date.now()}`,
      label,
      emoji: '📂',
      color: '#64748b',
    }
    set((state) => ({ kanbanColumns: [...state.kanbanColumns, col] }))
    scheduleSave()
  },

  renameColumn: (columnId, label) => {
    set((state) => ({
      kanbanColumns: state.kanbanColumns.map((c) =>
        c.id === columnId ? { ...c, label } : c
      ),
    }))
    scheduleSave()
  },

  deleteColumn: (columnId) => {
    const columns = get().kanbanColumns
    if (columns.length <= 1) return
    const firstCol = columns.find((c) => c.id !== columnId)
    set((state) => ({
      kanbanColumns: state.kanbanColumns.filter((c) => c.id !== columnId),
      tasks: state.tasks.map((t) =>
        t.columnId === columnId ? { ...t, columnId: firstCol?.id || columns[0].id } : t
      ),
    }))
    scheduleSave()
  },

  // --- Kanban нода на канвасе ---
  ensureKanbanNode: () => {
    const { nodes } = get()
    const exists = nodes.some((n) => n.type === 'kanbanNode')
    if (exists) return

    // Find a good position (right of existing nodes)
    let maxX = 0
    let avgY = 200
    if (nodes.length > 0) {
      maxX = Math.max(...nodes.map((n) => (n.position?.x ?? 0) + 200))
      avgY = nodes.reduce((sum, n) => sum + (n.position?.y ?? 0), 0) / nodes.length
    }

    const kanbanNode: FactoryNode = {
      id: `kanban-${Date.now()}`,
      type: 'kanbanNode',
      position: { x: maxX + 50, y: avgY - 100 },
      data: {
        label: 'План',
        emoji: '📌',
        category: 'process',
        color: '#8b5cf6',
        status: 'active',
      },
    }
    set((state) => ({ nodes: [...state.nodes, kanbanNode] }))
    scheduleSave()
  },

  // --- Кайдзен-нода на канвасе ---
  ensureKaizenNode: () => {
    const { nodes } = get()
    const exists = nodes.some((n) => n.type === 'kaizenNode')
    if (exists) return

    let maxX = 0
    let avgY = 200
    if (nodes.length > 0) {
      maxX = Math.max(...nodes.map((n) => (n.position?.x ?? 0) + 200))
      avgY = nodes.reduce((sum, n) => sum + (n.position?.y ?? 0), 0) / nodes.length
    }

    const kaizenNode: FactoryNode = {
      id: `kaizen-${Date.now()}`,
      type: 'kaizenNode',
      position: { x: maxX + 50, y: avgY - 100 },
      data: {
        label: 'Кайдзен',
        emoji: '改',
        category: 'alert',
        color: '#f59e0b',
        status: 'active',
      },
    }
    set((state) => ({ nodes: [...state.nodes, kaizenNode] }))
    scheduleSave()
  },

}))
