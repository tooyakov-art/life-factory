import type { NodeTypes } from '@xyflow/react'
import { ProcessNode } from './ProcessNode'
import { SchemaNode } from './SchemaNode'

export const customNodeTypes: NodeTypes = {
  processNode: ProcessNode,
  schemaNode: SchemaNode,
}
