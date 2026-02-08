'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Главная → сразу открывает мастер-схему
export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/factory/_master')
  }, [router])

  return (
    <div className="flex h-screen items-center justify-center bg-slate-900">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl shadow-lg shadow-blue-500/20">
          🏭
        </div>
        <span className="text-xl font-bold text-slate-300 animate-pulse">Life Factory</span>
      </div>
    </div>
  )
}
