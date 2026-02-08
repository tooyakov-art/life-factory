import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const SCHEMAS_DIR = path.join(process.cwd(), 'schemas')

// Убедиться что папка существует
async function ensureDir() {
  await fs.mkdir(SCHEMAS_DIR, { recursive: true })
}

// GET /api/schemas — список всех схем
export async function GET() {
  try {
    await ensureDir()
    const files = await fs.readdir(SCHEMAS_DIR)
    const schemas = await Promise.all(
      files
        .filter((f) => f.endsWith('.json'))
        .map(async (f) => {
          const content = await fs.readFile(path.join(SCHEMAS_DIR, f), 'utf-8')
          return JSON.parse(content)
        })
    )
    // Сортировка по дате обновления (новые сверху)
    schemas.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    return NextResponse.json(schemas)
  } catch {
    return NextResponse.json({ error: 'Failed to read schemas' }, { status: 500 })
  }
}

// POST /api/schemas — создать новую схему
export async function POST(request: Request) {
  try {
    await ensureDir()
    const schema = await request.json()

    // Генерируем slug из имени
    let slug = schema.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')

    // Проверяем уникальность, добавляем суффикс если нужно
    let filename = `${slug}.json`
    let filepath = path.join(SCHEMAS_DIR, filename)
    let counter = 2
    while (true) {
      try {
        await fs.access(filepath)
        // Файл существует — добавляем суффикс
        filename = `${slug}-${counter}.json`
        filepath = path.join(SCHEMAS_DIR, filename)
        counter++
      } catch {
        // Файл не существует — можно создавать
        break
      }
    }

    // id = имя файла без .json
    const id = filename.replace('.json', '')
    const now = new Date().toISOString()
    const fullSchema = {
      ...schema,
      id,
      createdAt: schema.createdAt || now,
      updatedAt: now,
    }

    await fs.writeFile(filepath, JSON.stringify(fullSchema, null, 2), 'utf-8')
    return NextResponse.json(fullSchema, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create schema' }, { status: 500 })
  }
}
