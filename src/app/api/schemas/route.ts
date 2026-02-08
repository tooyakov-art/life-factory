import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const SCHEMAS_DIR = path.join(process.cwd(), 'schemas')

// Убедиться что папка существует
async function ensureDir() {
  await fs.mkdir(SCHEMAS_DIR, { recursive: true })
}

// Проверить что это директория
async function isDirectory(p: string): Promise<boolean> {
  try {
    const stat = await fs.stat(p)
    return stat.isDirectory()
  } catch {
    return false
  }
}

// GET /api/schemas — список всех контейнеров-схем
export async function GET() {
  try {
    await ensureDir()
    const entries = await fs.readdir(SCHEMAS_DIR)
    const schemas = []

    for (const entry of entries) {
      const dirPath = path.join(SCHEMAS_DIR, entry)
      if (!(await isDirectory(dirPath))) continue

      const schemaFile = path.join(dirPath, 'schema.json')
      try {
        const content = await fs.readFile(schemaFile, 'utf-8')
        schemas.push(JSON.parse(content))
      } catch {
        // Пропускаем папки без schema.json
      }
    }

    // Сортировка по дате обновления (новые сверху)
    schemas.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    return NextResponse.json(schemas)
  } catch {
    return NextResponse.json({ error: 'Failed to read schemas' }, { status: 500 })
  }
}

// POST /api/schemas — создать новый контейнер-схему
export async function POST(request: Request) {
  try {
    await ensureDir()
    const schema = await request.json()

    // Генерируем slug из имени
    let slug = schema.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')

    // Проверяем уникальность папки
    let dirName = slug
    let dirPath = path.join(SCHEMAS_DIR, dirName)
    let counter = 2
    while (await isDirectory(dirPath)) {
      dirName = `${slug}-${counter}`
      dirPath = path.join(SCHEMAS_DIR, dirName)
      counter++
    }

    // Создаём папку-контейнер
    await fs.mkdir(dirPath, { recursive: true })

    // id = имя папки
    const now = new Date().toISOString()
    const fullSchema = {
      ...schema,
      id: dirName,
      createdAt: schema.createdAt || now,
      updatedAt: now,
    }

    // schema.json — данные схемы
    await fs.writeFile(
      path.join(dirPath, 'schema.json'),
      JSON.stringify(fullSchema, null, 2),
      'utf-8'
    )

    // CLAUDE.md — правила изоляции
    await fs.writeFile(
      path.join(dirPath, 'CLAUDE.md'),
      `# ${schema.name}\n\n` +
        `Ты работаешь ТОЛЬКО внутри этой папки: schemas/${dirName}/\n` +
        `НЕ трогай файлы за пределами schemas/${dirName}/.\n` +
        `НЕ изменяй другие схемы.\n`,
      'utf-8'
    )

    // README.md — описание
    await fs.writeFile(
      path.join(dirPath, 'README.md'),
      `# ${schema.name}\n\n` +
        `${schema.description || ''}\n\n` +
        `- Категория: ${schema.category || 'business'}\n` +
        `- Создано: ${now}\n`,
      'utf-8'
    )

    return NextResponse.json(fullSchema, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create schema' }, { status: 500 })
  }
}
