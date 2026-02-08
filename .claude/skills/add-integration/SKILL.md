---
name: add-integration
description: Подключает внешний API (WhatsApp, Instagram, Telegram и др.) к узлу схемы
---

# Подключение интеграции

Пользователь хочет подключить: $ARGUMENTS

## Инструкции

1. Определи тип интеграции (whatsapp, instagram, telegram, или кастомный API)
2. Создай или обнови файл в `src/lib/integrations/`:
   - Тип данных в `src/types/integrations.ts`
   - Клиент API в `src/lib/integrations/{name}.ts`
3. Создай API роут в `src/app/api/integrations/` для получения данных
4. Обнови тип `FactoryNodeData.integration` если нужен новый тип
5. API ключи должны читаться из переменных окружения (NEXT_PUBLIC_ для клиентских, без префикса для серверных)
6. Добавь пример `.env.local` переменных в CLAUDE.md
7. Запусти `npm run build` для проверки
