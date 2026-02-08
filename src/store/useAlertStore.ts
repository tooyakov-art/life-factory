import { create } from 'zustand'
import type { Alert } from '@/types/factory'

interface AlertState {
  alerts: Alert[]
  addAlert: (alert: Alert) => void
  resolveAlert: (id: string) => void
  clearAlerts: (schemaId: string) => void
  getUnresolved: () => Alert[]
  getBySchema: (schemaId: string) => Alert[]
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: [],

  addAlert: (alert) => {
    set((state) => ({
      alerts: [...state.alerts.filter((a) => a.id !== alert.id), alert],
    }))
  },

  resolveAlert: (id) => {
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, resolved: true } : a
      ),
    }))
  },

  clearAlerts: (schemaId) => {
    set((state) => ({
      alerts: state.alerts.filter((a) => a.schemaId !== schemaId),
    }))
  },

  getUnresolved: () => {
    return get().alerts.filter((a) => !a.resolved)
  },

  getBySchema: (schemaId) => {
    return get().alerts.filter((a) => a.schemaId === schemaId && !a.resolved)
  },
}))
