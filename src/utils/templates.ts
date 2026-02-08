import type { Schema, FactoryNode, FactoryEdge } from '@/types/factory'
import { NODE_COLORS } from '@/types/factory'

// Хелпер для создания узла
function node(
  id: string,
  label: string,
  emoji: string,
  category: FactoryNode['data']['category'],
  color: string,
  x: number,
  y: number,
  status: FactoryNode['data']['status'] = 'active'
): FactoryNode {
  return {
    id,
    type: 'processNode',
    position: { x, y },
    data: { label, emoji, category, color, status },
  }
}

// Хелпер для создания связи
function edge(
  source: string,
  target: string,
  speed = 3,
  volume = 50
): FactoryEdge {
  return {
    id: `e-${source}-${target}`,
    source,
    target,
    type: 'animatedEdge',
    data: { flowSpeed: speed, flowVolume: volume, animated: true },
  }
}

// ===== 1. Воронка продаж =====
const salesFunnelNodes: FactoryNode[] = [
  node('sf-1', 'Instagram', '📸', 'input', NODE_COLORS.purple, 0, 0),
  node('sf-2', 'Лид', '📩', 'input', NODE_COLORS.green, 200, 0),
  node('sf-3', 'WhatsApp', '💬', 'process', NODE_COLORS.green, 400, 0),
  node('sf-4', 'Звонок', '📞', 'process', NODE_COLORS.yellow, 600, 0),
  node('sf-5', 'Продажа', '🤝', 'process', NODE_COLORS.yellow, 800, 0),
  node('sf-6', 'Деньги', '💰', 'output', NODE_COLORS.emerald, 1000, 0),
  node('sf-7', 'Кейс', '📋', 'output', NODE_COLORS.purple, 1000, 150),
  node('sf-8', 'Instagram', '🔄', 'amplifier', NODE_COLORS.orange, 600, 150),
]

const salesFunnelEdges: FactoryEdge[] = [
  edge('sf-1', 'sf-2', 5, 70),
  edge('sf-2', 'sf-3', 4, 60),
  edge('sf-3', 'sf-4', 3, 40),
  edge('sf-4', 'sf-5', 2, 30),
  edge('sf-5', 'sf-6', 2, 80),
  edge('sf-5', 'sf-7', 1, 20),
  edge('sf-7', 'sf-8', 1, 15),
  edge('sf-8', 'sf-1', 2, 25),
]

// ===== 2. Клиентский проект =====
const clientProjectNodes: FactoryNode[] = [
  node('cp-1', 'Клиент', '👤', 'input', NODE_COLORS.green, 0, 0),
  node('cp-2', 'ТЗ', '📝', 'process', NODE_COLORS.blue, 200, 0),
  node('cp-3', 'AI Код', '🤖', 'process', NODE_COLORS.blue, 400, 0),
  node('cp-4', 'Тест', '🧪', 'process', NODE_COLORS.blue, 600, 0),
  node('cp-5', 'Демо', '🖥️', 'process', NODE_COLORS.yellow, 800, 0),
  node('cp-6', 'Правки', '✏️', 'process', NODE_COLORS.yellow, 800, 150),
  node('cp-7', 'Сдача', '✅', 'output', NODE_COLORS.emerald, 1000, 0),
  node('cp-8', 'Деньги', '💰', 'output', NODE_COLORS.emerald, 1200, 0),
  node('cp-9', 'Кейс', '📋', 'output', NODE_COLORS.purple, 1200, 150),
  node('cp-10', 'Реферал', '🔗', 'amplifier', NODE_COLORS.orange, 1200, 300),
]

const clientProjectEdges: FactoryEdge[] = [
  edge('cp-1', 'cp-2', 3, 50),
  edge('cp-2', 'cp-3', 4, 50),
  edge('cp-3', 'cp-4', 5, 50),
  edge('cp-4', 'cp-5', 3, 50),
  edge('cp-5', 'cp-6', 2, 30),
  edge('cp-6', 'cp-3', 2, 20),
  edge('cp-5', 'cp-7', 3, 70),
  edge('cp-7', 'cp-8', 3, 80),
  edge('cp-7', 'cp-9', 2, 30),
  edge('cp-9', 'cp-10', 1, 15),
]

// ===== 3. Контент-машина =====
const contentMachineNodes: FactoryNode[] = [
  node('cm-1', 'Идея', '💡', 'input', NODE_COLORS.yellow, 0, 0),
  node('cm-2', 'Запись', '🎥', 'process', NODE_COLORS.blue, 200, 0),
  node('cm-3', 'Монтаж', '✂️', 'process', NODE_COLORS.blue, 400, 0),
  node('cm-4', 'Публикация', '📤', 'process', NODE_COLORS.purple, 600, 0),
  node('cm-5', 'Охваты', '👀', 'output', NODE_COLORS.purple, 800, 0),
  node('cm-6', 'Лиды', '📩', 'output', NODE_COLORS.green, 1000, 0),
  node('cm-7', 'Клиенты', '👤', 'output', NODE_COLORS.emerald, 1200, 0),
]

const contentMachineEdges: FactoryEdge[] = [
  edge('cm-1', 'cm-2', 2, 40),
  edge('cm-2', 'cm-3', 3, 40),
  edge('cm-3', 'cm-4', 3, 40),
  edge('cm-4', 'cm-5', 5, 70),
  edge('cm-5', 'cm-6', 3, 30),
  edge('cm-6', 'cm-7', 2, 15),
]

// ===== 4. Финансы =====
const financeNodes: FactoryNode[] = [
  node('fn-1', 'Фриланс', '💻', 'input', NODE_COLORS.green, 0, 0),
  node('fn-2', 'Проекты', '📁', 'input', NODE_COLORS.green, 0, 150),
  node('fn-3', 'Пассивный доход', '📈', 'input', NODE_COLORS.green, 0, 300),
  node('fn-4', 'Основной счёт', '🏦', 'process', NODE_COLORS.blue, 300, 100),
  node('fn-5', 'Жильё', '🏠', 'output', NODE_COLORS.red, 600, 0),
  node('fn-6', 'Еда', '🍕', 'output', NODE_COLORS.red, 600, 100),
  node('fn-7', 'Подписки', '📱', 'output', NODE_COLORS.red, 600, 200),
  node('fn-8', 'Инвестиции', '📊', 'amplifier', NODE_COLORS.emerald, 600, 350),
  node('fn-9', 'Рост капитала', '🚀', 'output', NODE_COLORS.emerald, 900, 350),
]

const financeEdges: FactoryEdge[] = [
  edge('fn-1', 'fn-4', 4, 60),
  edge('fn-2', 'fn-4', 3, 40),
  edge('fn-3', 'fn-4', 2, 20),
  edge('fn-4', 'fn-5', 3, 35),
  edge('fn-4', 'fn-6', 3, 20),
  edge('fn-4', 'fn-7', 2, 10),
  edge('fn-4', 'fn-8', 3, 30),
  edge('fn-8', 'fn-9', 2, 30),
  edge('fn-9', 'fn-3', 1, 10),
]

// ===== 5. Мастер-схема жизни =====
const masterLifeNodes: FactoryNode[] = [
  node('ml-1', 'Бизнес', '💼', 'process', NODE_COLORS.blue, 0, 0),
  node('ml-2', 'Финансы', '💰', 'process', NODE_COLORS.emerald, 300, 0),
  node('ml-3', 'Навыки', '🧠', 'process', NODE_COLORS.purple, 0, 200),
  node('ml-4', 'Контент', '📸', 'process', NODE_COLORS.purple, 300, 200),
  node('ml-5', 'Здоровье', '❤️', 'input', NODE_COLORS.green, 600, 100),
  node('ml-6', 'Отношения', '👥', 'input', NODE_COLORS.yellow, 150, 400),
  node('ml-7', 'Цели', '🎯', 'output', NODE_COLORS.orange, 600, 300),
]

const masterLifeEdges: FactoryEdge[] = [
  edge('ml-1', 'ml-2', 4, 60),
  edge('ml-3', 'ml-1', 3, 40),
  edge('ml-3', 'ml-4', 3, 40),
  edge('ml-4', 'ml-1', 2, 30),
  edge('ml-5', 'ml-1', 2, 50),
  edge('ml-5', 'ml-3', 2, 50),
  edge('ml-6', 'ml-7', 2, 30),
  edge('ml-2', 'ml-7', 3, 50),
  edge('ml-1', 'ml-7', 3, 50),
]

// Экспорт всех шаблонов
export interface SchemaTemplate {
  name: string
  description: string
  category: Schema['category']
  emoji: string
  nodes: FactoryNode[]
  edges: FactoryEdge[]
}

export const SCHEMA_TEMPLATES: SchemaTemplate[] = [
  {
    name: 'Воронка продаж',
    description: 'Instagram → Лид → WhatsApp → Звонок → Продажа → Деньги → Кейс',
    category: 'business',
    emoji: '🔻',
    nodes: salesFunnelNodes,
    edges: salesFunnelEdges,
  },
  {
    name: 'Клиентский проект',
    description: 'Клиент → ТЗ → AI Код → Тест → Демо → Правки → Сдача → Деньги',
    category: 'business',
    emoji: '📁',
    nodes: clientProjectNodes,
    edges: clientProjectEdges,
  },
  {
    name: 'Контент-машина',
    description: 'Идея → Запись → Монтаж → Публикация → Охваты → Лиды → Клиенты',
    category: 'business',
    emoji: '🎬',
    nodes: contentMachineNodes,
    edges: contentMachineEdges,
  },
  {
    name: 'Финансы',
    description: 'Потоки доходов → Счёт → Расходы + Инвестиции → Рост',
    category: 'finance',
    emoji: '💰',
    nodes: financeNodes,
    edges: financeEdges,
  },
  {
    name: 'Мастер-схема жизни',
    description: 'Все сферы жизни как блоки: бизнес, финансы, навыки, здоровье, отношения',
    category: 'master',
    emoji: '🌐',
    nodes: masterLifeNodes,
    edges: masterLifeEdges,
  },
]

// Создать данные для Schema из шаблона (без id/дат — API сгенерирует)
export function createSchemaFromTemplate(
  template: SchemaTemplate
): Omit<Schema, 'id' | 'createdAt' | 'updatedAt'> {
  const ts = Date.now()
  return {
    name: template.name,
    description: template.description,
    category: template.category,
    nodes: template.nodes.map((n) => ({ ...n, id: `${n.id}-${ts}` })),
    edges: template.edges.map((e) => ({
      ...e,
      id: `${e.id}-${ts}`,
      source: `${e.source}-${ts}`,
      target: `${e.target}-${ts}`,
    })),
  }
}
