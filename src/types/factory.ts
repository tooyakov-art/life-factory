import type { Node, Edge } from '@xyflow/react'

// Категории узлов на схеме
export type NodeCategory =
  | 'input'       // Входящий поток: клиенты, лиды, трафик
  | 'process'     // Процесс: AI код, работа, производство
  | 'output'      // Выход: деньги, результат, продукт
  | 'amplifier'   // Усилитель: шаблон, автоматизация, реферал
  | 'alert'       // Проблема: узкое горлышко, затык
  | 'schema'      // Ссылка на вложенную схему

// Данные кастомного узла
export interface FactoryNodeData {
  [key: string]: unknown
  label: string
  emoji: string
  category: NodeCategory
  color: string
  description?: string
  // Реальные метрики (когда подключена интеграция)
  metrics?: {
    current: number       // Текущее значение (лиды/день, деньги/мес)
    target?: number       // Целевое значение
    trend: 'up' | 'down' | 'stable'
    unit: string          // "лидов/день", "₸/мес", "%"
  }
  // Интеграция с внешним сервисом
  integration?: {
    type: 'whatsapp' | 'instagram' | 'telegram' | 'manual'
    status: 'connected' | 'disconnected' | 'error'
    lastSync?: string
  }
  // Статус узла
  status: 'active' | 'bottleneck' | 'inactive' | 'warning'
  // Ссылка на вложенную схему (для SchemaNode)
  referencedSchemaId?: string
}

// Данные кастомной связи
export interface FactoryEdgeData {
  [key: string]: unknown
  flowSpeed: number       // 0-10, скорость шариков
  flowVolume: number      // 0-100, размер потока
  animated: boolean
  label?: string          // "30 лидов/день"
}

// Типизированные React Flow узлы и связи
export type FactoryNode = Node<FactoryNodeData, 'processNode' | 'schemaNode'>
export type FactoryEdge = Edge<FactoryEdgeData>

// Схема — одна "фабрика"
export interface Schema {
  id: string
  name: string
  description?: string
  category: 'business' | 'finance' | 'skills' | 'life' | 'master'
  nodes: FactoryNode[]
  edges: FactoryEdge[]
  createdAt: string
  updatedAt: string
}

// Алерт — проблема на схеме
export interface Alert {
  id: string
  schemaId: string
  nodeId: string
  type: 'bottleneck' | 'down' | 'warning' | 'opportunity'
  message: string
  severity: 'critical' | 'warning' | 'info'
  createdAt: string
  resolved: boolean
}

// Daily Check-in — утренний статус схем
export interface DailyStatus {
  schemaId: string
  schemaName: string
  status: 'green' | 'yellow' | 'red'
  note?: string  // При red — "что не так?"
}

export interface DailyCheckIn {
  date: string        // YYYY-MM-DD
  entries: DailyStatus[]
  createdAt: string   // ISO
}

// Категории цветов узлов
export const NODE_COLORS: Record<string, string> = {
  green: '#22c55e',     // Входящий поток
  blue: '#3b82f6',      // Процессы
  yellow: '#f59e0b',    // Продажи
  emerald: '#10b981',   // Деньги
  red: '#ef4444',       // Проблемы
  purple: '#8b5cf6',    // Контент
  pink: '#ec4899',      // Автоматизация
  orange: '#f97316',    // Рефералы
}

// Пресеты узлов для палитры
export interface NodePreset {
  label: string
  emoji: string
  category: NodeCategory
  color: string
}

export const NODE_PRESETS: Record<string, NodePreset[]> = {
  '📥 Входы': [
    { label: 'Клиент', emoji: '👤', category: 'input', color: NODE_COLORS.green },
    { label: 'Лид', emoji: '📩', category: 'input', color: NODE_COLORS.green },
    { label: 'Трафик', emoji: '🌐', category: 'input', color: NODE_COLORS.green },
    { label: 'Реклама', emoji: '📢', category: 'input', color: NODE_COLORS.green },
  ],
  '⚙️ Процессы': [
    { label: 'AI Код', emoji: '🤖', category: 'process', color: NODE_COLORS.blue },
    { label: 'Работа', emoji: '💼', category: 'process', color: NODE_COLORS.blue },
    { label: 'Продажа', emoji: '🤝', category: 'process', color: NODE_COLORS.yellow },
    { label: 'Переговоры', emoji: '📞', category: 'process', color: NODE_COLORS.yellow },
  ],
  '📤 Выходы': [
    { label: 'Деньги', emoji: '💰', category: 'output', color: NODE_COLORS.emerald },
    { label: 'Продукт', emoji: '📦', category: 'output', color: NODE_COLORS.emerald },
    { label: 'Кейс', emoji: '📋', category: 'output', color: NODE_COLORS.purple },
    { label: 'Результат', emoji: '✅', category: 'output', color: NODE_COLORS.emerald },
  ],
  '🔄 Усилители': [
    { label: 'Шаблон', emoji: '📝', category: 'amplifier', color: NODE_COLORS.pink },
    { label: 'Бот', emoji: '🤖', category: 'amplifier', color: NODE_COLORS.pink },
    { label: 'Воронка', emoji: '🔻', category: 'amplifier', color: NODE_COLORS.pink },
    { label: 'Реферал', emoji: '🔗', category: 'amplifier', color: NODE_COLORS.orange },
    { label: 'Автоматизация', emoji: '⚡', category: 'amplifier', color: NODE_COLORS.pink },
  ],
  '⚠️ Маркеры': [
    { label: 'Узкое горлышко', emoji: '🔴', category: 'alert', color: NODE_COLORS.red },
    { label: 'Проблема', emoji: '⚠️', category: 'alert', color: NODE_COLORS.red },
    { label: 'Вопрос', emoji: '❓', category: 'alert', color: NODE_COLORS.yellow },
  ],
}
