import type { FactoryNode, FactoryEdge, FactoryNodeData } from '@/types/factory'

// ===================================================================
// КАЙДЗЕН (改善) — философия непрерывного совершенствования
//
// 7 ключевых принципов:
// 1. MUDA (無駄) — Устранение потерь (7 видов)
// 2. 5S — Сортировка, Систематизация, Содержание, Стандартизация, Совершенствование
// 3. PDCA — Plan, Do, Check, Act (цикл Деминга)
// 4. GEMBA (現場) — Иди и смотри (проверяй на месте)
// 5. JIDOKA (自働化) — Автономизация (остановись при проблеме)
// 6. JIT (Just-in-Time) — Точно вовремя (без лишних запасов)
// 7. KAIZEN EVENT — Сфокусированные улучшения
// ===================================================================

export type KaizenCategory =
  | 'muda'      // Потери
  | '5s'        // Организация
  | 'pdca'      // Цикл улучшений
  | 'gemba'     // Проверка на месте
  | 'jidoka'    // Автоматическая остановка
  | 'jit'       // Точно вовремя
  | 'flow'      // Поток создания ценности
  | 'life'      // Жизненная система (целостность жизни)

export type KaizenSeverity = 'critical' | 'warning' | 'suggestion' | 'pass'

export interface KaizenRule {
  id: string
  name: string
  description: string
  category: KaizenCategory
  principle: string // Краткое описание принципа
}

export interface KaizenResult {
  ruleId: string
  ruleName: string
  category: KaizenCategory
  severity: KaizenSeverity
  message: string
  nodeIds?: string[]    // Какие узлы затронуты
  suggestion?: string   // Как исправить
  principle: string
  prompt?: string       // Готовый промпт для Claude чтобы исправить
}

// ===== Все правила Кайдзен =====

const KAIZEN_RULES: KaizenRule[] = [
  // --- MUDA: 7 видов потерь ---
  {
    id: 'muda-waiting',
    name: 'Потери ожидания',
    description: 'Процесс без входящих связей — простаивает, ждёт данные',
    category: 'muda',
    principle: '無駄 Muda — устранение 7 видов потерь. Ожидание = время когда ресурс не создаёт ценность.',
  },
  {
    id: 'muda-overprocessing',
    name: 'Потери излишней обработки',
    description: 'Цепочка из 5+ процессов подряд без выхода — слишком много шагов',
    category: 'muda',
    principle: '無駄 Muda — избыточная обработка. Каждый шаг должен добавлять ценность, иначе это потеря.',
  },
  {
    id: 'muda-defects',
    name: 'Потери от дефектов',
    description: 'Узлы в статусе bottleneck — дефектный процесс тормозит всю систему',
    category: 'muda',
    principle: '無駄 Muda — дефекты. Исправление ошибок стоит в 10x дороже предотвращения.',
  },
  {
    id: 'muda-inventory',
    name: 'Потери от запасов',
    description: 'Узел с большим входящим потоком и маленьким исходящим — копятся "запасы"',
    category: 'muda',
    principle: '無駄 Muda — избыточные запасы. Накопление = замороженные ресурсы.',
  },
  {
    id: 'muda-motion',
    name: 'Потери от лишних движений',
    description: 'Один узел связан с 5+ другими — слишком много переключений',
    category: 'muda',
    principle: '無駄 Muda — лишние движения. Каждое переключение контекста = потеря фокуса.',
  },
  {
    id: 'muda-transport',
    name: 'Потери транспортировки',
    description: 'Связь между узлами очень далёкими на схеме — длинный путь передачи',
    category: 'muda',
    principle: '無駄 Muda — транспортировка. Длинные пути передачи = задержки и потери информации.',
  },
  {
    id: 'muda-deadend',
    name: 'Тупик (потери)',
    description: 'Процесс без выхода — работа делается, но результат никуда не идёт',
    category: 'muda',
    principle: '無駄 Muda — перепроизводство/тупик. Если результат никому не нужен — это потеря.',
  },

  // --- 5S ---
  {
    id: '5s-sort',
    name: '整理 Seiri — Сортировка',
    description: 'Неактивные узлы занимают место на схеме — убери лишнее',
    category: '5s',
    principle: '5S Seiri — убери всё лишнее. Оставь только то, что нужно для работы.',
  },
  {
    id: '5s-order',
    name: '整頓 Seiton — Систематизация',
    description: 'Узлы расположены хаотично, нет логичного потока слева направо',
    category: '5s',
    principle: '5S Seiton — определи место для каждого элемента. Входы слева, выходы справа.',
  },
  {
    id: '5s-standardize',
    name: '清潔 Seiketsu — Стандартизация',
    description: 'Есть дублирующиеся узлы с одинаковым названием',
    category: '5s',
    principle: '5S Seiketsu — создай стандарт. Каждый элемент должен быть уникальным.',
  },

  // --- PDCA ---
  {
    id: 'pdca-no-metrics',
    name: 'Нет метрик (Check)',
    description: 'Узлы без метрик — невозможно проверить результат',
    category: 'pdca',
    principle: 'PDCA Check — нельзя улучшить то, что не измеряешь. Добавь метрики.',
  },
  {
    id: 'pdca-no-feedback',
    name: 'Нет обратной связи (Act)',
    description: 'Линейная цепочка без обратных связей — нет цикла улучшений',
    category: 'pdca',
    principle: 'PDCA Act — после проверки действуй. Обратная связь замыкает цикл улучшений.',
  },

  // --- JIDOKA ---
  {
    id: 'jidoka-no-stop',
    name: 'Нет автоматической остановки',
    description: 'Есть bottleneck, но процессы после него продолжают работать',
    category: 'jidoka',
    principle: '自働化 Jidoka — остановись при обнаружении проблемы. Не передавай дефект дальше.',
  },

  // --- JIT ---
  {
    id: 'jit-overload',
    name: 'Перегрузка входа',
    description: 'Слишком много входных потоков для одного процесса',
    category: 'jit',
    principle: 'JIT — точно вовремя. Не перегружай процесс — подавай ровно столько, сколько может обработать.',
  },

  // --- FLOW ---
  {
    id: 'flow-isolated',
    name: 'Изолированный узел',
    description: 'Узел без связей — не участвует в потоке создания ценности',
    category: 'flow',
    principle: 'Поток ценности — каждый элемент должен быть частью потока. Изолированный элемент = потеря.',
  },
  {
    id: 'flow-balance',
    name: 'Дисбаланс потока',
    description: 'Все связи идут через один узел — единая точка отказа',
    category: 'flow',
    principle: 'Поток должен быть сбалансирован. Единая точка отказа = высокий риск остановки.',
  },

  // --- LIFE: Жизненная система ---
  {
    id: 'life-no-health',
    name: 'Нет здоровья',
    description: 'В системе нет блока про здоровье/спорт/тело',
    category: 'life',
    principle: '生活 Жизнь — здоровье = фундамент. Без энергии ни один процесс не работает на максимум.',
  },
  {
    id: 'life-no-relationships',
    name: 'Нет личной жизни',
    description: 'В системе нет блока про отношения/семью/друзей',
    category: 'life',
    principle: '生活 Жизнь — человек без связей = изолированный узел. Отношения дают энергию и смысл.',
  },
  {
    id: 'life-no-finance',
    name: 'Нет финансов',
    description: 'В системе нет блока про финансы/бюджет/инвестиции',
    category: 'life',
    principle: '生活 Жизнь — деньги = ресурс. Без контроля финансов система нестабильна.',
  },
  {
    id: 'life-no-skills',
    name: 'Нет навыков/обучения',
    description: 'В системе нет блока про обучение/развитие/навыки',
    category: 'life',
    principle: '生活 Жизнь — без развития = деградация. Навыки = усилитель всех процессов.',
  },
  {
    id: 'life-no-goals',
    name: 'Нет целей в блоках',
    description: 'Блоки без описания/целей — непонятно зачем они существуют',
    category: 'life',
    principle: '生活 Жизнь — процесс без цели = бессмысленное движение. Определи зачем.',
  },
  {
    id: 'life-no-rest',
    name: 'Нет отдыха/восстановления',
    description: 'В системе нет блока про отдых, сон, восстановление',
    category: 'life',
    principle: '生活 Жизнь — система без отдыха = выгорание. Восстановление это не потеря, а инвестиция.',
  },
  {
    id: 'life-no-routine',
    name: 'Нет рутины/привычек',
    description: 'Нет алгоритмизированного распорядка дня',
    category: 'life',
    principle: '生活 Жизнь — без привычек = хаос. Рутина = автоматизация жизненных процессов.',
  },
  {
    id: 'life-unbalanced',
    name: 'Дисбаланс жизни',
    description: 'Слишком много блоков в одной сфере, ноль в другой',
    category: 'life',
    principle: '生活 Жизнь — перекос = хрупкость. Сбалансированная система устойчивее.',
  },
]

// ===== Генерация промпта из результата =====

function generatePromptForResult(r: KaizenResult, nodes: FactoryNode[]): string {
  const nodeNames = r.nodeIds
    ?.map((id) => {
      const n = nodes.find((nd) => nd.id === id)
      return n ? `"${(n.data as FactoryNodeData).label}"` : id
    })
    .join(', ')

  const base = `Кайдзен-анализ нашёл проблему в моей Life Factory схеме.`
  const problem = `\nПроблема: ${r.ruleName} — ${r.message}`
  const affected = nodeNames ? `\nЗатронутые блоки: ${nodeNames}` : ''
  const fix = r.suggestion ? `\nРекомендация: ${r.suggestion}` : ''

  return `${base}${problem}${affected}${fix}\n\nИсправь эту проблему в моей схеме.`
}

// ===== Анализатор =====

export function analyzeKaizen(
  nodes: FactoryNode[],
  edges: FactoryEdge[]
): KaizenResult[] {
  const results: KaizenResult[] = []

  // === Пустая схема = нет прогресса = критически плохо ===
  if (nodes.length === 0) {
    results.push({
      ruleId: 'gemba-empty',
      ruleName: 'Схема пустая',
      category: 'gemba',
      severity: 'critical',
      message: 'Нет ни одного блока — нет прогресса, нет развития',
      suggestion: 'Добавь цели, процессы и потоки. Без них нечего улучшать.',
      principle: '現場 Gemba — иди и смотри. Если нечего смотреть — работа не началась.',
    })
    results.push({
      ruleId: 'flow-no-value',
      ruleName: 'Нет потока ценности',
      category: 'flow',
      severity: 'critical',
      message: 'Поток создания ценности отсутствует — система не работает',
      suggestion: 'Создай цепочку: Вход → Процесс → Выход. Это основа любой системы.',
      principle: 'Поток ценности — без потока нет создания ценности. Нулевой прогресс.',
    })
    results.push({
      ruleId: 'pdca-no-plan',
      ruleName: 'Нет плана (Plan)',
      category: 'pdca',
      severity: 'critical',
      message: 'Первый шаг PDCA — планирование — не выполнен',
      suggestion: 'Определи цели и процессы. Plan → Do → Check → Act.',
      principle: 'PDCA Plan — без плана нет действий. Начни с определения целей.',
    })
    return results
  }

  // === Мало блоков — схема недоразвита ===
  if (nodes.length <= 2) {
    results.push({
      ruleId: 'gemba-underdeveloped',
      ruleName: 'Схема недоразвита',
      category: 'gemba',
      severity: 'warning',
      message: `Всего ${nodes.length} блоков — система слишком простая`,
      suggestion: 'Добавь больше процессов: откуда приходят ресурсы? Куда идёт результат?',
      principle: '現場 Gemba — реальная картина неполная. Добавь деталей.',
    })
  }

  // === Нет связей при наличии блоков ===
  if (edges.length === 0) {
    results.push({
      ruleId: 'flow-no-connections',
      ruleName: 'Нет связей',
      category: 'flow',
      severity: 'critical',
      message: 'Блоки есть, но ни один не связан — процессы не работают вместе',
      suggestion: 'Соедини блоки: кто кому передаёт данные/ресурсы?',
      principle: 'Поток ценности — изолированные элементы не создают систему.',
    })
  }

  // Хелперы
  const incoming = (nodeId: string) => edges.filter((e) => e.target === nodeId)
  const outgoing = (nodeId: string) => edges.filter((e) => e.source === nodeId)
  const getData = (n: FactoryNode) => n.data as FactoryNodeData

  // --- MUDA: Ожидание (процесс без входов) ---
  for (const node of nodes) {
    const d = getData(node)
    if (d.category === 'process' && incoming(node.id).length === 0) {
      results.push({
        ruleId: 'muda-waiting',
        ruleName: 'Потери ожидания',
        category: 'muda',
        severity: 'warning',
        message: `«${d.label}» — процесс без входящих данных, простаивает`,
        nodeIds: [node.id],
        suggestion: 'Подключи вход: откуда приходят данные/клиенты для этого процесса?',
        principle: KAIZEN_RULES.find((r) => r.id === 'muda-waiting')!.principle,
      })
    }
  }

  // --- MUDA: Тупик (процесс без выходов) ---
  for (const node of nodes) {
    const d = getData(node)
    if (d.category === 'process' && outgoing(node.id).length === 0) {
      results.push({
        ruleId: 'muda-deadend',
        ruleName: 'Тупик',
        category: 'muda',
        severity: 'warning',
        message: `«${d.label}» — результат никуда не идёт`,
        nodeIds: [node.id],
        suggestion: 'Добавь выход: куда идёт результат этого процесса?',
        principle: KAIZEN_RULES.find((r) => r.id === 'muda-deadend')!.principle,
      })
    }
  }

  // --- MUDA: Дефекты (bottleneck узлы) ---
  const bottleneckNodes = nodes.filter((n) => getData(n).status === 'bottleneck')
  if (bottleneckNodes.length > 0) {
    results.push({
      ruleId: 'muda-defects',
      ruleName: 'Дефекты в системе',
      category: 'muda',
      severity: 'critical',
      message: `${bottleneckNodes.length} процессов сломано: ${bottleneckNodes.map((n) => getData(n).label).join(', ')}`,
      nodeIds: bottleneckNodes.map((n) => n.id),
      suggestion: 'Исправь сначала критические проблемы — они тормозят всю систему',
      principle: KAIZEN_RULES.find((r) => r.id === 'muda-defects')!.principle,
    })
  }

  // --- MUDA: Запасы (большой вход, маленький выход) ---
  for (const node of nodes) {
    const d = getData(node)
    const inVol = incoming(node.id).reduce((s, e) => s + ((e.data?.flowVolume as number) ?? 0), 0)
    const outVol = outgoing(node.id).reduce((s, e) => s + ((e.data?.flowVolume as number) ?? 0), 0)
    if (inVol > 0 && outVol > 0 && inVol > outVol * 2.5) {
      results.push({
        ruleId: 'muda-inventory',
        ruleName: 'Копятся запасы',
        category: 'muda',
        severity: 'warning',
        message: `«${d.label}» — вход ${inVol} vs выход ${outVol}, копятся необработанные запасы`,
        nodeIds: [node.id],
        suggestion: 'Увеличь пропускную способность или уменьши входящий поток',
        principle: KAIZEN_RULES.find((r) => r.id === 'muda-inventory')!.principle,
      })
    }
  }

  // --- MUDA: Лишние движения (узел с 5+ связями) ---
  for (const node of nodes) {
    const d = getData(node)
    const totalConnections = incoming(node.id).length + outgoing(node.id).length
    if (totalConnections >= 5) {
      results.push({
        ruleId: 'muda-motion',
        ruleName: 'Слишком много связей',
        category: 'muda',
        severity: 'suggestion',
        message: `«${d.label}» — ${totalConnections} связей, много переключений контекста`,
        nodeIds: [node.id],
        suggestion: 'Раздели на несколько специализированных процессов',
        principle: KAIZEN_RULES.find((r) => r.id === 'muda-motion')!.principle,
      })
    }
  }

  // --- 5S: Сортировка (неактивные узлы) ---
  const inactiveNodes = nodes.filter((n) => getData(n).status === 'inactive')
  if (inactiveNodes.length > 0) {
    results.push({
      ruleId: '5s-sort',
      ruleName: '整理 Убери лишнее',
      category: '5s',
      severity: 'suggestion',
      message: `${inactiveNodes.length} выключенных блоков занимают место`,
      nodeIds: inactiveNodes.map((n) => n.id),
      suggestion: 'Удали неактивные блоки или активируй их',
      principle: KAIZEN_RULES.find((r) => r.id === '5s-sort')!.principle,
    })
  }

  // --- 5S: Стандартизация (дубли) ---
  const labelCount = new Map<string, string[]>()
  for (const node of nodes) {
    const label = (getData(node).label as string).toLowerCase()
    if (!labelCount.has(label)) labelCount.set(label, [])
    labelCount.get(label)!.push(node.id)
  }
  for (const [label, ids] of labelCount) {
    if (ids.length > 1) {
      results.push({
        ruleId: '5s-standardize',
        ruleName: '清潔 Дубли',
        category: '5s',
        severity: 'suggestion',
        message: `«${label}» встречается ${ids.length} раз — возможно дублирование`,
        nodeIds: ids,
        suggestion: 'Объедини дубли или дай уникальные имена',
        principle: KAIZEN_RULES.find((r) => r.id === '5s-standardize')!.principle,
      })
    }
  }

  // --- PDCA: Нет метрик ---
  const noMetrics = nodes.filter(
    (n) => getData(n).category === 'process' && !getData(n).metrics
  )
  if (noMetrics.length > 0 && nodes.length > 3) {
    results.push({
      ruleId: 'pdca-no-metrics',
      ruleName: 'Нет метрик',
      category: 'pdca',
      severity: 'suggestion',
      message: `${noMetrics.length} процессов без метрик — нечего измерять`,
      nodeIds: noMetrics.map((n) => n.id),
      suggestion: 'Добавь KPI: лиды/день, конверсию, время обработки',
      principle: KAIZEN_RULES.find((r) => r.id === 'pdca-no-metrics')!.principle,
    })
  }

  // --- PDCA: Нет обратной связи ---
  const hasBackEdge = edges.some((e) => {
    const si = nodes.findIndex((n) => n.id === e.source)
    const ti = nodes.findIndex((n) => n.id === e.target)
    return si > ti // Связь идёт "назад"
  })
  if (!hasBackEdge && nodes.length > 3) {
    results.push({
      ruleId: 'pdca-no-feedback',
      ruleName: 'Нет обратной связи',
      category: 'pdca',
      severity: 'warning',
      message: 'Линейная цепочка без обратных связей — нет цикла улучшений',
      suggestion: 'Добавь обратную связь: кейс → маркетинг, отзыв → улучшение',
      principle: KAIZEN_RULES.find((r) => r.id === 'pdca-no-feedback')!.principle,
    })
  }

  // --- JIDOKA: Bottleneck но поток продолжается ---
  for (const bn of bottleneckNodes) {
    const downstream = outgoing(bn.id)
    if (downstream.length > 0) {
      const downstreamActive = downstream.some((e) => {
        const target = nodes.find((n) => n.id === e.target)
        return target && getData(target).status === 'active'
      })
      if (downstreamActive) {
        results.push({
          ruleId: 'jidoka-no-stop',
          ruleName: 'Нет остановки при дефекте',
          category: 'jidoka',
          severity: 'critical',
          message: `«${getData(bn).label}» сломан, но процессы после него работают — дефект передаётся дальше`,
          nodeIds: [bn.id],
          suggestion: 'Останови зависимые процессы или исправь проблему',
          principle: KAIZEN_RULES.find((r) => r.id === 'jidoka-no-stop')!.principle,
        })
      }
    }
  }

  // --- JIT: Перегрузка входа ---
  for (const node of nodes) {
    const d = getData(node)
    if (incoming(node.id).length >= 4) {
      results.push({
        ruleId: 'jit-overload',
        ruleName: 'Перегрузка входа',
        category: 'jit',
        severity: 'warning',
        message: `«${d.label}» — ${incoming(node.id).length} входящих потоков, перегрузка`,
        nodeIds: [node.id],
        suggestion: 'Добавь промежуточный буфер или раздели процесс',
        principle: KAIZEN_RULES.find((r) => r.id === 'jit-overload')!.principle,
      })
    }
  }

  // --- FLOW: Изолированные узлы ---
  const isolated = nodes.filter(
    (n) => incoming(n.id).length === 0 && outgoing(n.id).length === 0
  )
  if (isolated.length > 0) {
    results.push({
      ruleId: 'flow-isolated',
      ruleName: 'Изолированные узлы',
      category: 'flow',
      severity: 'warning',
      message: `${isolated.length} узлов не подключены: ${isolated.map((n) => getData(n).label).join(', ')}`,
      nodeIds: isolated.map((n) => n.id),
      suggestion: 'Подключи к потоку или удали если не нужны',
      principle: KAIZEN_RULES.find((r) => r.id === 'flow-isolated')!.principle,
    })
  }

  // --- FLOW: Единая точка отказа ---
  for (const node of nodes) {
    const d = getData(node)
    const throughput = Math.min(incoming(node.id).length, outgoing(node.id).length)
    if (throughput >= 3 && incoming(node.id).length >= 3 && outgoing(node.id).length >= 3) {
      results.push({
        ruleId: 'flow-balance',
        ruleName: 'Точка отказа',
        category: 'flow',
        severity: 'warning',
        message: `«${d.label}» — всё проходит через один узел. Если сломается — встанет вся система`,
        nodeIds: [node.id],
        suggestion: 'Распредели нагрузку — создай параллельные пути',
        principle: KAIZEN_RULES.find((r) => r.id === 'flow-balance')!.principle,
      })
    }
  }

  // --- LIFE: Жизненная система ---
  // Собираем все лейблы (lowercase) для поиска сфер
  const allLabels = nodes.map((n) => (getData(n).label as string).toLowerCase())
  const allDescs = nodes.map((n) => ((getData(n).description as string) || '').toLowerCase())
  const allText = [...allLabels, ...allDescs].join(' ')

  const LIFE_AREAS: { id: string; keywords: string[]; name: string; ruleId: string; emoji: string }[] = [
    { id: 'health', keywords: ['здоровь', 'спорт', 'фитнес', 'тренировк', 'тело', 'зож', 'питани', 'сон', 'health', 'gym'], name: 'Здоровье/Спорт', ruleId: 'life-no-health', emoji: '💪' },
    { id: 'relationships', keywords: ['отношени', 'семь', 'личн', 'друз', 'любовь', 'девушк', 'парен', 'жен', 'муж', 'relationship', 'family'], name: 'Личная жизнь/Отношения', ruleId: 'life-no-relationships', emoji: '❤️' },
    { id: 'finance', keywords: ['финанс', 'деньг', 'бюджет', 'инвестиц', 'доход', 'расход', 'накоплен', 'finance', 'money', 'invest'], name: 'Финансы', ruleId: 'life-no-finance', emoji: '💰' },
    { id: 'skills', keywords: ['навык', 'обучен', 'курс', 'книг', 'развити', 'учёб', 'учеб', 'образован', 'skill', 'learn', 'study'], name: 'Навыки/Обучение', ruleId: 'life-no-skills', emoji: '📚' },
    { id: 'rest', keywords: ['отдых', 'восстановлен', 'медитац', 'хобби', 'развлечен', 'отпуск', 'релакс', 'rest', 'hobby'], name: 'Отдых/Восстановление', ruleId: 'life-no-rest', emoji: '🧘' },
    { id: 'routine', keywords: ['рутин', 'привычк', 'распорядок', 'расписани', 'утро', 'вечер', 'daily', 'routine', 'habit'], name: 'Рутина/Привычки', ruleId: 'life-no-routine', emoji: '⏰' },
  ]

  const foundAreas: string[] = []
  const missingAreas: typeof LIFE_AREAS = []

  for (const area of LIFE_AREAS) {
    const found = area.keywords.some((kw) => allText.includes(kw))
    if (found) {
      foundAreas.push(area.id)
    } else {
      missingAreas.push(area)
    }
  }

  for (const area of missingAreas) {
    const rule = KAIZEN_RULES.find((r) => r.id === area.ruleId)
    results.push({
      ruleId: area.ruleId,
      ruleName: `Нет: ${area.name}`,
      category: 'life',
      severity: area.id === 'health' || area.id === 'relationships' ? 'critical' : 'warning',
      message: `${area.emoji} В твоей системе нет ничего про ${area.name.toLowerCase()}. Жизнь не алгоритмизирована полностью.`,
      suggestion: `Создай контейнер «${area.name}» и опиши процессы внутри`,
      principle: rule?.principle || '生活 — вся жизнь должна быть системой.',
      prompt: `Добавь в мою мастер-схему Life Factory новый контейнер "${area.name}". Создай внутри него базовые процессы и связи. Это сфера жизни которая сейчас не алгоритмизирована — нужно добавить блоки, описать потоки и связать с остальной системой.`,
    })
  }

  // Все сферы есть — pass
  if (missingAreas.length === 0 && nodes.length > 0) {
    results.push({
      ruleId: 'life-complete',
      ruleName: 'Жизнь алгоритмизирована',
      category: 'life',
      severity: 'pass',
      message: 'Все ключевые сферы жизни представлены в системе',
      principle: '生活 — полная жизненная система.',
    })
  }

  // Дисбаланс: если бизнес-блоков > 5, а остальных сфер нет
  const businessKeywords = ['бизнес', 'продаж', 'клиент', 'лид', 'маркетинг', 'выручк', 'mvp', 'продукт']
  const businessCount = nodes.filter((n) => {
    const label = (getData(n).label as string).toLowerCase()
    return businessKeywords.some((kw) => label.includes(kw))
  }).length
  if (businessCount >= 3 && missingAreas.length >= 3) {
    results.push({
      ruleId: 'life-unbalanced',
      ruleName: 'Дисбаланс жизни',
      category: 'life',
      severity: 'critical',
      message: `${businessCount} блоков про бизнес, но ${missingAreas.length} сфер жизни отсутствуют. Перекос = выгорание.`,
      suggestion: 'Добавь блоки для здоровья, отношений, навыков, отдыха',
      principle: '生活 — перекос в одну сферу разрушает остальные. Баланс = устойчивость.',
      prompt: `Моя Life Factory перекошена в бизнес (${businessCount} блоков), но отсутствуют: ${missingAreas.map(a => a.name).join(', ')}. Сбалансируй мою жизненную систему — добавь контейнеры для недостающих сфер жизни и свяжи их с бизнесом.`,
    })
  }

  // Нет целей / описаний в блоках
  const noDescription = nodes.filter(
    (n) => getData(n).category !== 'schema' && n.type !== 'kanbanNode' && !getData(n).description
  )
  if (noDescription.length >= 2) {
    results.push({
      ruleId: 'life-no-goals',
      ruleName: 'Нет целей в блоках',
      category: 'life',
      severity: 'warning',
      message: `${noDescription.length} блоков без описания/целей: ${noDescription.slice(0, 3).map(n => getData(n).label).join(', ')}${noDescription.length > 3 ? '...' : ''}`,
      nodeIds: noDescription.map((n) => n.id),
      suggestion: 'Добавь описание и цель каждому блоку — зачем он существует?',
      principle: '生活 — процесс без цели = бессмысленное движение.',
      prompt: `В моей схеме ${noDescription.length} блоков без описания и целей: ${noDescription.map(n => getData(n).label).join(', ')}. Добавь каждому блоку осмысленное описание и конкретную цель — зачем этот процесс существует и что должен давать.`,
    })
  }

  // --- Генерация промптов для всех результатов без prompt ---
  for (const r of results) {
    if (!r.prompt && r.severity !== 'pass') {
      r.prompt = generatePromptForResult(r, nodes)
    }
  }

  // --- Пройденные проверки (pass) ---
  const failedIds = new Set(results.map((r) => r.ruleId))
  if (!failedIds.has('muda-defects') && nodes.length > 0) {
    results.push({
      ruleId: 'muda-defects',
      ruleName: 'Нет дефектов',
      category: 'muda',
      severity: 'pass',
      message: 'Все процессы работают без ошибок',
      principle: '無駄 Muda — ноль дефектов в системе.',
    })
  }
  if (hasBackEdge) {
    results.push({
      ruleId: 'pdca-no-feedback',
      ruleName: 'Есть обратная связь',
      category: 'pdca',
      severity: 'pass',
      message: 'Цикл обратной связи присутствует',
      principle: 'PDCA — цикл замкнут, есть механизм улучшений.',
    })
  }
  if (isolated.length === 0 && nodes.length > 0) {
    results.push({
      ruleId: 'flow-isolated',
      ruleName: 'Все узлы подключены',
      category: 'flow',
      severity: 'pass',
      message: 'Все элементы являются частью потока ценности',
      principle: 'Поток ценности — каждый элемент вносит вклад.',
    })
  }

  return results
}

// Статистика по результатам
export function getKaizenScore(results: KaizenResult[]): {
  score: number
  total: number
  passed: number
  criticals: number
  warnings: number
  suggestions: number
} {
  const passed = results.filter((r) => r.severity === 'pass').length
  const criticals = results.filter((r) => r.severity === 'critical').length
  const warnings = results.filter((r) => r.severity === 'warning').length
  const suggestions = results.filter((r) => r.severity === 'suggestion').length
  const total = results.length
  // Скор: 100 если нет проблем, минус за каждую
  const score = Math.max(0, Math.round(
    100 - criticals * 25 - warnings * 10 - suggestions * 3
  ))

  return { score, total, passed, criticals, warnings, suggestions }
}

// Категории для фильтра
export const KAIZEN_CATEGORIES: { id: KaizenCategory; label: string; emoji: string; jp: string }[] = [
  { id: 'life', label: 'Жизнь', emoji: '🧬', jp: '生活' },
  { id: 'muda', label: 'Потери', emoji: '🗑️', jp: '無駄' },
  { id: '5s', label: 'Организация', emoji: '🧹', jp: '5S' },
  { id: 'pdca', label: 'Цикл улучшений', emoji: '🔄', jp: 'PDCA' },
  { id: 'gemba', label: 'Проверка', emoji: '👀', jp: '現場' },
  { id: 'jidoka', label: 'Автоостановка', emoji: '🛑', jp: '自働化' },
  { id: 'jit', label: 'Точно вовремя', emoji: '⏱️', jp: 'JIT' },
  { id: 'flow', label: 'Поток', emoji: '🌊', jp: 'Flow' },
]
