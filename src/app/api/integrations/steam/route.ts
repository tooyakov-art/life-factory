import { NextResponse } from 'next/server'

const STEAM_API_KEY = process.env.STEAM_API_KEY
const STEAM_ID = process.env.STEAM_ID

// Маппинг игр → категории (rest = отдых, всё остальное = other)
const GAME_CATEGORIES: Record<string, string> = {
  'Factorio': 'rest',
  'Dota 2': 'rest',
  'Counter-Strike 2': 'rest',
  'Stardew Valley': 'rest',
  'Minecraft': 'rest',
  'Terraria': 'rest',
  "Cities: Skylines": 'rest',
  "Cities: Skylines II": 'rest',
  'PUBG: BATTLEGROUNDS': 'rest',
}

// Кеш на 60 секунд чтобы не спамить Steam API
let cache: { data: unknown; fetchedAt: number } | null = null
const CACHE_TTL = 60_000

export async function GET() {
  if (!STEAM_API_KEY || !STEAM_ID) {
    return NextResponse.json(
      { error: 'Steam credentials not configured. Set STEAM_API_KEY and STEAM_ID in .env.local' },
      { status: 503 }
    )
  }

  // Вернуть из кеша если свежий
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return NextResponse.json(cache.data)
  }

  try {
    // Параллельно: текущая игра + недавние игры
    const [summaryRes, recentRes] = await Promise.all([
      fetch(
        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${STEAM_ID}`,
        { next: { revalidate: 0 } }
      ),
      fetch(
        `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/?key=${STEAM_API_KEY}&steamid=${STEAM_ID}&format=json`,
        { next: { revalidate: 0 } }
      ),
    ])

    if (!summaryRes.ok || !recentRes.ok) {
      return NextResponse.json(
        { error: 'Steam API returned error', status: 'error' },
        { status: 502 }
      )
    }

    const summaryData = await summaryRes.json()
    const recentData = await recentRes.json()

    const player = summaryData?.response?.players?.[0]
    const games = recentData?.response?.games || []

    // Текущая игра
    const isPlaying = !!player?.gameextrainfo
    const currentGame = player?.gameextrainfo || null

    // Обработка недавних игр
    let totalPlaytime2Weeks = 0
    let restPlaytime2Weeks = 0

    const recentGames = games.map((g: { name: string; appid: number; playtime_2weeks: number; playtime_forever: number }) => {
      const category = GAME_CATEGORIES[g.name] || 'other'
      const playtime2Weeks = g.playtime_2weeks || 0
      const playtimeForever = g.playtime_forever || 0

      totalPlaytime2Weeks += playtime2Weeks
      if (category === 'rest') {
        restPlaytime2Weeks += playtime2Weeks
      }

      return {
        name: g.name,
        appId: g.appid,
        playtime2Weeks,
        playtimeForever,
        category,
      }
    })

    const response = {
      isPlaying,
      currentGame,
      recentGames,
      totalPlaytime2Weeks,
      restPlaytime2Weeks,
      lastSync: new Date().toISOString(),
    }

    // Кешируем
    cache = { data: response, fetchedAt: Date.now() }

    return NextResponse.json(response)
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch Steam data', status: 'error' },
      { status: 502 }
    )
  }
}
