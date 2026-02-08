---
name: new-container
description: Создаёт новый контейнер-схему в папке schemas/
disable-model-invocation: true
---

Создай новый контейнер: $ARGUMENTS

1. Создай папку schemas/[имя]/ (slug из названия — lowercase, пробелы → дефисы)
2. Создай schema.json с базовой структурой:
   ```json
   {
     "id": "[slug]",
     "name": "[название]",
     "description": "",
     "category": "business",
     "nodes": [],
     "edges": [],
     "createdAt": "[ISO дата]",
     "updatedAt": "[ISO дата]"
   }
   ```
3. Создай CLAUDE.md с правилом изоляции:
   ```
   # [Название]

   Ты работаешь ТОЛЬКО внутри этой папки: schemas/[slug]/
   НЕ трогай файлы за пределами schemas/[slug]/.
   НЕ изменяй другие схемы.
   ```
4. Создай README.md с описанием:
   ```
   # [Название]

   [Описание если есть]

   - Категория: [категория]
   - Создано: [дата]
   ```
5. НЕ трогай другие папки в schemas/
