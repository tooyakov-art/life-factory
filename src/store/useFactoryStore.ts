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
import type { Schema, FactoryNode, FactoryEdge, FactoryNodeData } from '@/types/factory'

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

  // Режим редактора
  editorMode: 'pan' | 'addNode' | 'addEdge'
  setEditorMode: (mode: 'pan' | 'addNode' | 'addEdge') => void
  isPaletteOpen: boolean
  togglePalette: () => void
  closePalette: () => void
}

export const useFactoryStore = create<FactoryState>()((set, get) => ({
  schemas: [],
  activeSchemaId: null,
  nodes: [],
  edges: [],
  isLoading: false,
  editorMode: 'pan',
  isPaletteOpen: false,

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
      set({ activeSchemaId: id, nodes: schema.nodes, edges: schema.edges })
    }
  },

  saveCurrentSchema: async () => {
    const { activeSchemaId, nodes, edges, schemas } = get()
    if (!activeSchemaId) return

    const schema = schemas.find((s) => s.id === activeSchemaId)
    if (!schema) return

    const updated = { ...schema, nodes, edges }

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

  // --- Режим редактора ---
  setEditorMode: (mode) => set({ editorMode: mode }),
  togglePalette: () => set((state) => ({ isPaletteOpen: !state.isPaletteOpen })),
  closePalette: () => set({ isPaletteOpen: false }),
}))
