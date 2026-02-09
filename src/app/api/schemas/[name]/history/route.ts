import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const SCHEMAS_DIR = path.join(process.cwd(), 'schemas')

type Params = { params: Promise<{ name: string }> }

// GET /api/schemas/[name]/history — список снапшотов с метаданными
export async function GET(_request: Request, { params }: Params) {
  const { name } = await params
  try {
    const histDir = path.join(SCHEMAS_DIR, name, 'history')
    const files = await fs.readdir(histDir)
    const jsonFiles = files
      .filter((f) => f.endsWith('.json'))
      .sort((a, b) => b.localeCompare(a)) // newest first

    const snapshots = await Promise.all(
      jsonFiles.map(async (f) => {
        try {
          const content = await fs.readFile(path.join(histDir, f), 'utf-8')
          const data = JSON.parse(content)
          const nodes = data.nodes || []
          const edges = data.edges || []
          const tasks = data.tasks || []

          // Читаемая дата из имени файла
          const raw = f.replace('.json', '')

          return {
            filename: f,
            date: raw,
            version: data.version || '0.1',
            nodesCount: nodes.length,
            edgesCount: edges.length,
            tasksCount: tasks.length,
            nodeLabels: nodes.slice(0, 5).map((n: { data?: { label?: string } }) => n.data?.label || '?'),
          }
        } catch {
          return { filename: f, date: f, version: '?', nodesCount: 0, edgesCount: 0, tasksCount: 0, nodeLabels: [] }
        }
      })
    )

    return NextResponse.json(snapshots)
  } catch {
    return NextResponse.json([])
  }
}

// POST /api/schemas/[name]/history — восстановить из снапшота
export async function POST(request: Request, { params }: Params) {
  const { name } = await params
  try {
    const { filename } = await request.json()
    const histDir = path.join(SCHEMAS_DIR, name, 'history')
    const snapPath = path.join(histDir, filename)
    const content = await fs.readFile(snapPath, 'utf-8')
    const schema = JSON.parse(content)

    // Сначала сохраняем текущую версию как снапшот (перед восстановлением)
    const currentPath = path.join(SCHEMAS_DIR, name, 'schema.json')
    try {
      const currentContent = await fs.readFile(currentPath, 'utf-8')
      const ts = new Date().toISOString().replace(/[:.]/g, '-')
      await fs.writeFile(
        path.join(histDir, `${ts}-before-restore.json`),
        currentContent,
        'utf-8'
      )
    } catch { /* current file may not exist */ }

    // Перезаписываем текущую схему
    schema.updatedAt = new Date().toISOString()
    await fs.writeFile(currentPath, JSON.stringify(schema, null, 2), 'utf-8')

    return NextResponse.json(schema)
  } catch {
    return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 })
  }
}
