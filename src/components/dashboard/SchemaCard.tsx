'use client'

import Link from 'next/link'
import type { Schema } from '@/types/factory'

const CATEGORY_LABELS: Record<Schema['category'], string> = {
  business: 'Бизнес',
  finance: 'Финансы',
  skills: 'Навыки',
  life: 'Жизнь',
  master: 'Мастер',
}

const CATEGORY_EMOJI: Record<Schema['category'], string> = {
  business: '💼',
  finance: '💰',
  skills: '🧠',
  life: '🌱',
  master: '🌐',
}

const CATEGORY_COLORS: Record<Schema['category'], string> = {
  business: '#3b82f6',
  finance: '#10b981',
  skills: '#8b5cf6',
  life: '#f59e0b',
  master: '#ec4899',
}

const CATEGORY_GLOW: Record<Schema['category'], string> = {
  business: 'glow-business',
  finance: 'glow-finance',
  skills: 'glow-skills',
  life: 'glow-life',
  master: 'glow-master',
}

interface SchemaCardProps {
  schema: Schema
  alertCount?: number
}

export function SchemaCard({ schema, alertCount = 0 }: SchemaCardProps) {
  const categoryColor = CATEGORY_COLORS[schema.category]

  return (
    <Link
      href={`/factory/${schema.id}`}
      className={`
        block p-5 rounded-2xl border border-slate-700/50 bg-slate-800/40
        card-glow card-stripe ${CATEGORY_GLOW[schema.category]}
        touch-manipulation
      `}
      style={{ '--stripe-color': categoryColor } as React.CSSProperties}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{CATEGORY_EMOJI[schema.category]}</span>
          <div className="min-w-0">
            <h2 className="font-bold text-slate-100 truncate">
              {schema.name}
            </h2>
            {schema.description && (
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                {schema.description}
              </p>
            )}
          </div>
        </div>
        {alertCount > 0 && (
          <span className="ml-2 flex-shrink-0 bg-red-500/20 text-red-400 text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full animate-pulse">
            {alertCount}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 mt-3 ml-11">
        <span
          className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
          style={{
            backgroundColor: `${categoryColor}15`,
            color: categoryColor,
          }}
        >
          {CATEGORY_LABELS[schema.category]}
        </span>
        <span className="text-[11px] text-slate-500 bg-slate-700/40 px-1.5 py-0.5 rounded">
          {schema.nodes.length} блоков
        </span>
        <span className="text-[11px] text-slate-500 bg-slate-700/40 px-1.5 py-0.5 rounded">
          {schema.edges.length} связей
        </span>
      </div>
    </Link>
  )
}
