'use client'

import { memo, useState, useRef } from 'react'
import { type NodeProps } from '@xyflow/react'
import type { FactoryNode } from '@/types/factory'
import { useFactoryStore } from '@/store/useFactoryStore'

// SVG Progress Ring
function ProgressRing({ progress, size = 48, stroke = 4 }: { progress: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference
  const color = progress === 100 ? '#22c55e' : progress >= 60 ? '#3b82f6' : progress >= 30 ? '#f59e0b' : '#ef4444'

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1e293b" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        className="transition-all duration-700 ease-out"
      />
    </svg>
  )
}

function KanbanBoardNodeComponent({ selected }: NodeProps<FactoryNode>) {
  const {
    tasks, kanbanColumns,
    addTask, moveTask, updateTaskTitle, deleteTask,
    addColumn, renameColumn, deleteColumn,
  } = useFactoryStore()

  const [newTitle, setNewTitle] = useState('')
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTaskTitle, setEditingTaskTitle] = useState('')
  const [editingColId, setEditingColId] = useState<string | null>(null)
  const [editingColLabel, setEditingColLabel] = useState('')
  const [addingColumn, setAddingColumn] = useState(false)
  const [newColName, setNewColName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleAdd = () => {
    const t = newTitle.trim()
    if (!t) return
    addTask(t)
    setNewTitle('')
    inputRef.current?.focus()
  }

  // --- Drag & Drop ---
  const handleDragStart = (taskId: string) => setDraggedId(taskId)
  const handleDragEnd = () => { setDraggedId(null); setDropTarget(null) }
  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dropTarget !== colId) setDropTarget(colId)
  }
  const handleDragLeave = () => setDropTarget(null)
  const handleDrop = (colId: string) => {
    if (draggedId) moveTask(draggedId, colId)
    setDraggedId(null)
    setDropTarget(null)
  }

  // --- Edit task title ---
  const startEditTask = (taskId: string, currentTitle: string) => {
    setEditingTaskId(taskId)
    setEditingTaskTitle(currentTitle)
  }
  const saveEditTask = () => {
    if (editingTaskId && editingTaskTitle.trim()) {
      updateTaskTitle(editingTaskId, editingTaskTitle.trim())
    }
    setEditingTaskId(null)
    setEditingTaskTitle('')
  }

  // --- Edit column name ---
  const startEditCol = (colId: string, currentLabel: string) => {
    setEditingColId(colId)
    setEditingColLabel(currentLabel)
  }
  const saveEditCol = () => {
    if (editingColId && editingColLabel.trim()) {
      renameColumn(editingColId, editingColLabel.trim())
    }
    setEditingColId(null)
    setEditingColLabel('')
  }

  // --- Add column ---
  const handleAddColumn = () => {
    const name = newColName.trim()
    if (!name) return
    addColumn(name)
    setNewColName('')
    setAddingColumn(false)
  }

  // Stats
  const lastCol = kanbanColumns[kanbanColumns.length - 1]
  const done = lastCol ? tasks.filter((t) => t.columnId === lastCol.id).length : 0
  const total = tasks.length
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  const xp = done * 10 + (total - done) * 3
  const level = Math.floor(xp / 50) + 1
  const xpInLevel = xp % 50
  const ranks = ['Новичок', 'Ученик', 'Работник', 'Мастер', 'Сенсей', 'Легенда']
  const rank = ranks[Math.min(level - 1, ranks.length - 1)]

  // Dynamic width based on columns
  const colCount = kanbanColumns.length + (addingColumn ? 1 : 0)
  const widthClass = colCount <= 3 ? 'w-130' : colCount <= 4 ? 'w-160' : colCount <= 5 ? 'w-200' : 'w-260'

  return (
    <div
      className={`
        rounded-xl border-2 bg-slate-900/95 backdrop-blur-sm
        transition-all duration-200 ${widthClass}
        ${selected ? 'ring-2 ring-purple-400/40 border-purple-500/50' : 'border-slate-700/60'}
      `}
      style={{
        boxShadow: selected
          ? '0 0 30px rgba(168,85,247,0.15)'
          : '0 4px 20px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800/60">
        <div className="relative shrink-0">
          <ProgressRing progress={progress} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-black text-white leading-none">{progress}</span>
            <span className="text-[7px] text-slate-500">%</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">📌 Трелло</span>
            <span className="text-[10px] text-slate-500">Ур.{level} {rank}</span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-linear-to-r from-purple-500 to-blue-400 rounded-full transition-all duration-500"
              style={{ width: `${(xpInLevel / 50) * 100}%` }}
            />
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[9px] text-slate-600">{xpInLevel}/50 XP</span>
            <div className="flex gap-2 ml-auto">
              <span className="text-[9px] text-green-400">{done}/{total} ✅</span>
            </div>
          </div>
        </div>
      </div>

      {total > 0 && done === total && (
        <div className="mx-3 mt-2 text-center py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg">
          <span className="text-xs">🎉</span>
          <span className="text-[10px] text-green-400 font-medium ml-1">Всё выполнено!</span>
        </div>
      )}

      {/* Add task */}
      <div className="px-3 pt-2 pb-1 nodrag">
        <div className="flex gap-1.5">
          <input
            ref={inputRef}
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="+ Новая задача..."
            className="flex-1 bg-slate-800/60 border border-slate-700/50 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500/40 transition-colors"
          />
          <button
            onClick={handleAdd}
            className="px-2.5 py-1.5 bg-blue-600/20 text-blue-400 rounded-lg text-[11px] font-medium hover:bg-blue-600/30 transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Columns — drag & drop */}
      <div className="flex gap-2 p-3 min-h-32 nodrag nowheel">
        {kanbanColumns.map((col) => {
          const colTasks = tasks.filter((t) => t.columnId === col.id)
          const isOver = dropTarget === col.id && draggedId !== null
          const isLastCol = col.id === lastCol?.id

          return (
            <div
              key={col.id}
              className="flex-1 min-w-0 rounded-lg p-1.5 transition-all duration-200"
              style={{
                backgroundColor: isOver ? `${col.color}18` : `${col.color}08`,
                outline: isOver ? `2px solid ${col.color}60` : 'none',
                outlineOffset: '-1px',
              }}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(col.id)}
            >
              {/* Column header */}
              <div className="flex items-center gap-1 px-1.5 mb-1.5">
                <span className="text-[10px]">{col.emoji}</span>
                {editingColId === col.id ? (
                  <input
                    autoFocus
                    value={editingColLabel}
                    onChange={(e) => setEditingColLabel(e.target.value)}
                    onBlur={saveEditCol}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEditCol()
                      if (e.key === 'Escape') { setEditingColId(null); setEditingColLabel('') }
                    }}
                    className="text-[9px] font-bold uppercase tracking-wider bg-slate-800 border border-slate-600 rounded px-1 py-0.5 outline-none text-white w-full"
                  />
                ) : (
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider truncate cursor-pointer hover:opacity-70"
                    style={{ color: col.color }}
                    onDoubleClick={() => startEditCol(col.id, col.label)}
                  >
                    {col.label}
                  </span>
                )}
                {colTasks.length > 0 && (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto shrink-0"
                    style={{ backgroundColor: `${col.color}20`, color: col.color }}
                  >
                    {colTasks.length}
                  </span>
                )}
                {kanbanColumns.length > 1 && (
                  <button
                    onClick={() => deleteColumn(col.id)}
                    className="text-slate-700 hover:text-red-400 transition-colors shrink-0 ml-0.5"
                  >
                    <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                      <path d="M1 1L7 7M7 1L1 7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Cards */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto scrollbar-hide">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                    onDragEnd={handleDragEnd}
                    className={`
                      group relative px-2.5 py-2 rounded-lg border cursor-grab active:cursor-grabbing
                      transition-all duration-150 select-none touch-manipulation
                      ${draggedId === task.id ? 'opacity-30 scale-95' : 'opacity-100'}
                      bg-slate-800/50 border-slate-700/30 hover:border-slate-600/50 hover:shadow-lg
                    `}
                    style={{
                      borderLeftColor: `${col.color}60`,
                      borderLeftWidth: '3px',
                    }}
                  >
                    <div className="flex items-start gap-2">
                      {isLastCol ? (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0 mt-0.5">
                          <path d="M2.5 5L4.5 7L7.5 3" stroke="#22c55e" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <div className="w-2 h-2 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: `${col.color}60` }} />
                      )}

                      {editingTaskId === task.id ? (
                        <input
                          autoFocus
                          value={editingTaskTitle}
                          onChange={(e) => setEditingTaskTitle(e.target.value)}
                          onBlur={saveEditTask}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditTask()
                            if (e.key === 'Escape') { setEditingTaskId(null); setEditingTaskTitle('') }
                          }}
                          className="flex-1 text-[11px] bg-slate-700 border border-slate-500 rounded px-1 py-0.5 outline-none text-white"
                        />
                      ) : (
                        <span
                          className={`text-[11px] leading-snug flex-1 cursor-text ${
                            isLastCol ? 'text-slate-500 line-through' : 'text-slate-300'
                          }`}
                          onDoubleClick={() => startEditTask(task.id, task.title)}
                        >
                          {task.title}
                        </span>
                      )}
                    </div>

                    {/* Version badge for done tasks */}
                    {isLastCol && task.completedVersion && (
                      <div className="mt-1 flex items-center gap-1">
                        <span className="text-[8px] px-1 py-0.5 rounded bg-green-500/10 text-green-500/60 font-mono border border-green-500/15">
                          {task.completedVersion}
                        </span>
                        {task.completedAt && (
                          <span className="text-[8px] text-slate-700">
                            {new Date(task.completedAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Drag hint + delete */}
                    <div className="flex items-center justify-between mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[8px] text-slate-700">⠿ перетащи</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteTask(task.id) }}
                        className="text-slate-700 hover:text-red-400 transition-colors"
                      >
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M1 1L7 7M7 1L1 7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Empty drop zone */}
                {colTasks.length === 0 && (
                  <div
                    className="text-center py-4 border border-dashed rounded-lg transition-all"
                    style={{
                      borderColor: isOver ? `${col.color}60` : '#1e293b80',
                      backgroundColor: isOver ? `${col.color}10` : 'transparent',
                    }}
                  >
                    <span className="text-[9px] text-slate-700">
                      {isOver ? '↓ Отпусти' : 'Перетащи сюда'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Add column */}
        {addingColumn ? (
          <div className="min-w-24 rounded-lg p-1.5 bg-slate-800/30">
            <input
              autoFocus
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddColumn()
                if (e.key === 'Escape') { setAddingColumn(false); setNewColName('') }
              }}
              onBlur={() => {
                if (newColName.trim()) handleAddColumn()
                else { setAddingColumn(false); setNewColName('') }
              }}
              placeholder="Название..."
              className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-[10px] text-white placeholder-slate-600 outline-none"
            />
          </div>
        ) : (
          <button
            onClick={() => setAddingColumn(true)}
            className="min-w-8 rounded-lg border-2 border-dashed border-slate-700/40 flex items-center justify-center text-slate-600 hover:text-white hover:border-slate-500/60 transition-all"
          >
            <span className="text-lg">+</span>
          </button>
        )}
      </div>
    </div>
  )
}

export const KanbanBoardNode = memo(KanbanBoardNodeComponent)
