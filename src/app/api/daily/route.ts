import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const DAILY_DIR = path.join(process.cwd(), 'schemas', '_daily')

async function ensureDir() {
  await fs.mkdir(DAILY_DIR, { recursive: true })
}

// GET /api/daily — последние 7 дней check-in
export async function GET() {
  try {
    await ensureDir()
    const files = await fs.readdir(DAILY_DIR)
    const jsonFiles = files
      .filter((f) => f.endsWith('.json'))
      .sort()
      .slice(-7) // последние 7

    const checkins = []
    for (const file of jsonFiles) {
      try {
        const content = await fs.readFile(path.join(DAILY_DIR, file), 'utf-8')
        checkins.push(JSON.parse(content))
      } catch {
        // пропускаем битые файлы
      }
    }

    return NextResponse.json(checkins)
  } catch {
    return NextResponse.json({ error: 'Failed to read daily' }, { status: 500 })
  }
}

// POST /api/daily — сохранить check-in за сегодня
export async function POST(request: Request) {
  try {
    await ensureDir()
    const body = await request.json()
    const now = new Date()
    const date = now.toISOString().slice(0, 10) // YYYY-MM-DD

    const checkin = {
      date,
      entries: body.entries || [],
      createdAt: now.toISOString(),
    }

    await fs.writeFile(
      path.join(DAILY_DIR, `${date}.json`),
      JSON.stringify(checkin, null, 2),
      'utf-8'
    )

    return NextResponse.json(checkin, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to save daily' }, { status: 500 })
  }
}
