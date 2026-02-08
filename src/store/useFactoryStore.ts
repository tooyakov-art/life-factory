import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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

// Снимок для системы бекапов
interface Snapshot {
  id: string
  label: string
  timestamp: string
  schemas: Schema[]
}

interface FactoryState {
  // Данные
  schemas: Schema[]
  activeSchemaId: string | null
  nodes: FactoryNode[]
  edges: FactoryEdge[]

  // Корзина (удалённые схемы)
  trash: Schema[]

  // Бекапы (снимки)
  snapshots: Snapshot[]

  // React Flow callbacks
  onNodesChange: OnNodesChange<FactoryNode>
  onEdgesChange: OnEdgesChange<FactoryEdge>
  onConnect: OnConnect

  // Действия со схемами
  addSchema: (schema: Schema) => void
  deleteSchema: (id: string) => void
  setActiveSchema: (id: string) => void
  saveCurrentSchema: () => void

  // Действия с узлами
  addNode: (node: FactoryNode) => void
  updateNodeData: (nodeId: string, data: Partial<FactoryNodeData>) => void
  deleteNode: (nodeId: string) => void
  deleteEdge: (edgeId: string) => void

  // Корзина
  restoreFromTrash: (id: string) => void
  clearTrash: () => void

  // Бекапы
  createSnapshot: (label: string) => void
  restoreSnapshot: (id: string) => void
  deleteSnapshot: (id: string) => void

  // Режим редактора
  editorMode: 'pan' | 'addNode' | 'addEdge'
  setEditorMode: (mode: 'pan' | 'addNode' | 'addEdge') => void
  isPaletteOpen: boolean
  togglePalette: () => void
  closePalette: () => void
}

export const useFactoryStore = create<FactoryState>()(
  persist(
    (set, get) => ({
      schemas: [],
      activeSchemaId: null,
      nodes: [],
      edges: [],
      trash: [],
      snapshots: [],
      editorMode: 'pan',
      isPaletteOpen: false,

      // React Flow callbacks
      onNodesChange: (changes) => {
        set({ nodes: applyNodeChanges(changes, get().nodes) })
      },
      onEdgesChange: (changes) => {
        set({ edges: applyEdgeChanges(changes, get().edges) })
      },
      onConnect: (connection: Connection) => {
        const newEdge: FactoryEdge = {
          ...connection,
          id: `e-${connection.source}-${connection.target}`,
          type: 'animatedEdge',
          data: { flowSpeed: 3, flowVolume: 50, animated: true },
        }
        set({ edges: addEdge(newEdge, get().edges) })
      },

      // Схемы
      addSchema: (schema) => {
        set((state) => ({ schemas: [...state.schemas, schema] }))
      },

      deleteSchema: (id) => {
        const schema = get().schemas.find((s) => s.id === id)
        set((state) => ({
          schemas: state.schemas.filter((s) => s.id !== id),
          activeSchemaId: state.activeSchemaId === id ? null : state.activeSchemaId,
          // Перемещаем в корзину
          trash: schema ? [...state.trash, schema] : state.trash,
        }))
      },

      setActiveSchema: (id) => {
        const schema = get().schemas.find((s) => s.id === id)
        if (schema) {
          set({ activeSchemaId: id, nodes: schema.nodes, edges: schema.edges })
        }
      },

      saveCurrentSchema: () => {
        const { activeSchemaId, nodes, edges, schemas } = get()
        if (!activeSchemaId) return
        set({
          schemas: schemas.map((s) =>
            s.id === activeSchemaId
              ? { ...s, nodes, edges, updatedAt: new Date().toISOString() }
              : s
          ),
        })
      },

      // Узлы
      addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),

      updateNodeData: (nodeId, data) => {
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
          ),
        }))
      },

      deleteNode: (nodeId) => {
        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== nodeId),
          edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
        }))
      },

      deleteEdge: (edgeId) => {
        set((state) => ({ edges: state.edges.filter((e) => e.id !== edgeId) }))
      },

      // Корзина
      restoreFromTrash: (id) => {
        const schema = get().trash.find((s) => s.id === id)
        if (!schema) return
        set((state) => ({
          schemas: [...state.schemas, schema],
          trash: state.trash.filter((s) => s.id !== id),
        }))
      },

      clearTrash: () => set({ trash: [] }),

      // Бекапы
      createSnapshot: (label) => {
        const { schemas, snapshots } = get()
        // Максимум 10 бекапов
        const trimmed = snapshots.length >= 10 ? snapshots.slice(1) : snapshots
        const snapshot: Snapshot = {
          id: `snap-${Date.now()}`,
          label,
          timestamp: new Date().toISOString(),
          schemas: JSON.parse(JSON.stringify(schemas)),
        }
        set({ snapshots: [...trimmed, snapshot] })
      },

      restoreSnapshot: (id) => {
        const snapshot = get().snapshots.find((s) => s.id === id)
        if (!snapshot) return
        set({
          schemas: JSON.parse(JSON.stringify(snapshot.schemas)),
          activeSchemaId: null,
          nodes: [],
          edges: [],
        })
      },

      deleteSnapshot: (id) => {
        set((state) => ({ snapshots: state.snapshots.filter((s) => s.id !== id) }))
      },

      // Режим редактора
      setEditorMode: (mode) => set({ editorMode: mode }),
      togglePalette: () => set((state) => ({ isPaletteOpen: !state.isPaletteOpen })),
      closePalette: () => set({ isPaletteOpen: false }),
    }),
    {
      name: 'life-factory-store',
      // Не сохраняем в localStorage эфемерные данные
      partialize: (state) => ({
        schemas: state.schemas,
        trash: state.trash,
        snapshots: state.snapshots,
      }),
    }
  )
)
