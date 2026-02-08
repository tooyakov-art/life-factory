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
    return NextResponse.json(JSON.parse(content))
  } catch {
    return NextResponse.json({ error: 'Schema not found' }, { status: 404 })
  }
}

// PUT /api/schemas/[name] — пишет ТОЛЬКО в schema.json этой папки
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
