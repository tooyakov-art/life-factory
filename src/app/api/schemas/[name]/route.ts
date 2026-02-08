import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const SCHEMAS_DIR = path.join(process.cwd(), 'schemas')

type Params = { params: Promise<{ name: string }> }

// GET /api/schemas/[name] — читает конкретную схему
export async function GET(_request: Request, { params }: Params) {
  const { name } = await params
  try {
    const filepath = path.join(SCHEMAS_DIR, `${name}.json`)
    const content = await fs.readFile(filepath, 'utf-8')
    return NextResponse.json(JSON.parse(content))
  } catch {
    return NextResponse.json({ error: 'Schema not found' }, { status: 404 })
  }
}

// PUT /api/schemas/[name] — сохраняет схему
export async function PUT(request: Request, { params }: Params) {
  const { name } = await params
  try {
    const schema = await request.json()
    const filepath = path.join(SCHEMAS_DIR, `${name}.json`)
    schema.updatedAt = new Date().toISOString()
    await fs.writeFile(filepath, JSON.stringify(schema, null, 2), 'utf-8')
    return NextResponse.json(schema)
  } catch {
    return NextResponse.json({ error: 'Failed to save schema' }, { status: 500 })
  }
}

// DELETE /api/schemas/[name] — удаляет схему
export async function DELETE(_request: Request, { params }: Params) {
  const { name } = await params
  try {
    const filepath = path.join(SCHEMAS_DIR, `${name}.json`)
    await fs.unlink(filepath)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Schema not found' }, { status: 404 })
  }
}
