// Универсальные типы для всех интеграций (Steam, Telegram, банк и т.д.)

export type IntegrationType = 'steam' | 'whatsapp' | 'instagram' | 'telegram' | 'manual'

// Результат опроса интеграции — что записать в ноду
export interface IntegrationPollResult {
  nodeId: string
  metrics: {
    current: number
    target?: number
    trend: 'up' | 'down' | 'stable'
    unit: string
  }
  integration: {
    type: IntegrationType
    status: 'connected' | 'disconnected' | 'error'
    lastSync: string
  }
}

// Ответ Steam API proxy
export interface SteamResponse {
  isPlaying: boolean
  currentGame: string | null
  recentGames: {
    name: string
    appId: number
    playtime2Weeks: number   // минуты
    playtimeForever: number  // минуты
    category: string
  }[]
  totalPlaytime2Weeks: number   // минуты
  restPlaytime2Weeks: number    // минуты (только "rest" категория)
  lastSync: string
}
