'use client'

import { useState, useRef } from 'react'
import { useFactoryStore } from '@/store/useFactoryStore'
import type { KanbanTask } from '@/types/factory'

const COLUMNS: { id: KanbanTask['status']; label: string; color: string; emoji: string }[] = [
  { id: 'todo', label: 'Сделать', color: '#3b82f6', emoji: '📋' },
  { id: 'doing', label: 'В работе', color: '#f59e0b', emoji: '⚡' },
  { id: 'done', label: 'Готово', color: '#22c55e', emoji: '✅' },
]

interface KanbanPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function KanbanPanel({ isOpen, onClose }: KanbanPanelProps) {
  const { tasks, addTask, updateTaskStatus, deleteTask } = useFactoryStore()
  const [newTitle, setNewTitle] = useState('')
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleAdd = () => {
    const title = newTitle.trim()
    if (!title) return
    addTask(title)
    setNewTitle('')
    inputRef.current?.focus()
  }

  const handleDragStart = (taskId: string) => {
    setDraggedId(taskId)
  }

  const handleDrop = (status: KanbanTask['status']) => {
    if (draggedId) {
      updateTaskStatus(draggedId, status)
      setDraggedId(null)
    }
  }

  // Swipe-переход: тап по задаче → следующий статус
  const cycleStatus = (task: KanbanTask) => {
    const next: Record<KanbanTask['status'], KanbanTask['status']> = {
      todo: 'doing',
      doing: 'done',
      done: 'todo',
    }
    updateTaskStatus(task.id, next[task.status])
  }

  if (!isOpen) return null

  const tasksByStatus = (status: KanbanTask['status']) =>
    tasks.filter((t) => t.status === status)

  const totalDone = tasksByStatus('done').length
  const totalAll = tasks.length
  const progress = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0

  return (
    <div className="absolute top-0 left-0 h-full w-80 bg-slate-900/95 backdrop-blur-md border-r border-slate-700/50 z-20 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📌</span>
            <h2 className="font-bold text-sm">План</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white p-1 transition-colors"
          >
            x
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500 font-medium">{progress}%</span>
        </div>

        {/* Add task */}
        <div className="flex gap-1.5 mt-3">
          <input
            ref={inputRef}
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Новая задача..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500/50"
          />
          <button
            onClick={handleAdd}
            className="px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-600/30 transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Columns */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-hide">
        {COLUMNS.map((col) => {
          const colTasks = tasksByStatus(col.id)
          return (
            <div
              key={col.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(col.id)}
            >
              {/* Column header */}
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-xs">{col.emoji}</span>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {col.label}
                </span>
                <span className="text-[10px] text-slate-600 ml-auto">{colTasks.length}</span>
              </div>

              {/* Tasks */}
              <div className="space-y-1.5 min-h-8">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                    onClick={() => cycleStatus(task)}
                    className={`
                      group flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer
                      transition-all touch-manipulation select-none
                      ${col.id === 'done'
                        ? 'bg-green-500/5 border-green-500/20 text-slate-500 line-through'
                        : col.id === 'doing'
                          ? 'bg-amber-500/5 border-amber-500/20 text-slate-200'
                          : 'bg-slate-800/50 border-slate-700/50 text-slate-300'
                      }
                      hover:border-slate-500/50 active:scale-[0.98]
                    `}
                  >
                    {/* Status dot */}
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: col.color }}
                    />
                    <span className="flex-1 text-xs leading-tight">{task.title}</span>
                    {/* Delete */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteTask(task.id)
                      }}
                      className="text-slate-600 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      x
                    </button>
                  </div>
                ))}

                {colTasks.length === 0 && (
                  <div className="text-[10px] text-slate-600 text-center py-2 border border-dashed border-slate-800 rounded-lg">
                    {col.id === 'todo' ? 'Добавь задачу' : 'Перетащи сюда'}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
