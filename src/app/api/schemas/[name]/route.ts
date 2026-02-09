import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const SCHEMAS_DIR = path.join(process.cwd(), 'schemas')

type Params = { params: Promise<{ name: string }> }

// GET /api/schemas/[name] — читает schema.json из папки-контейнера
export async function GET(_request: Request, { params }: Params) {
  const { name } = await params
  try {
    const filepath = path.join(SCHEMAS_DIR, name, 'schema.json')
    const content = await fs.readFile(filepath, 'utf-8')
    const data = JSON.parse(content)
    // Ensure version exists for older schemas
    if (!data.version) data.version = '0.1'
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Schema not found' }, { status: 404 })
  }
}

// Трекер последних снапшотов (не чаще 5 минут на схему)
const lastSnapshotTime = new Map<string, number>()
const SNAPSHOT_INTERVAL = 5 * 60 * 1000 // 5 минут

// PUT /api/schemas/[name] — пишет в schema.json + снапшот в history/
export async function PUT(request: Request, { params }: Params) {
  const { name } = await params
  try {
    const schema = await request.json()
    const dirPath = path.join(SCHEMAS_DIR, name)
    const filepath = path.join(dirPath, 'schema.json')

    // Убеждаемся что папка существует
    await fs.mkdir(dirPath, { recursive: true })

    schema.updatedAt = new Date().toISOString()
    await fs.writeFile(filepath, JSON.stringify(schema, null, 2), 'utf-8')

    // Снапшот в history (не чаще 5 минут)
    const now = Date.now()
    const last = lastSnapshotTime.get(name) || 0
    if (now - last >= SNAPSHOT_INTERVAL) {
      lastSnapshotTime.set(name, now)
      const histDir = path.join(dirPath, 'history')
      await fs.mkdir(histDir, { recursive: true })
      const ts = new Date().toISOString().replace(/[:.]/g, '-')
      await fs.writeFile(
        path.join(histDir, `${ts}.json`),
        JSON.stringify(schema, null, 2),
        'utf-8'
      )
    }

    return NextResponse.json(schema)
  } catch {
    return NextResponse.json({ error: 'Failed to save schema' }, { status: 500 })
  }
}

// DELETE /api/schemas/[name] — удаляет всю папку-контейнер
export async function DELETE(_request: Request, { params }: Params) {
  const { name } = await params
  try {
    const dirPath = path.join(SCHEMAS_DIR, name)
    await fs.rm(dirPath, { recursive: true, force: true })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Schema not found' }, { status: 404 })
  }
}
