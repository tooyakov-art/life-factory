import type { NodeTypes } from '@xyflow/react'
import { ProcessNode } from './ProcessNode'
import { SchemaNode } from './SchemaNode'
import { KanbanBoardNode } from './KanbanBoardNode'
import { KaizenNode } from './KaizenNode'

export const customNodeTypes: NodeTypes = {
  processNode: ProcessNode,
  schemaNode: SchemaNode,
  kanbanNode: KanbanBoardNode,
  kaizenNode: KaizenNode,
}
