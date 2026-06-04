# V2Box Subscription Merger — Vercel

Объединяет несколько V2Ray/V2Box подписок в одну через Vercel Serverless.

## Быстрый старт

### 1. Деплой на Vercel

```bash
# Вариант A — через Vercel CLI
npm i -g vercel
cd v2box-merger
vercel --prod
```

Или просто перетащите папку на [vercel.com/new](https://vercel.com/new).

### 2. Добавить переменную окружения

В Vercel Dashboard → Settings → Environment Variables:

```
Name:  SUB_URLS
Value: https://sub1.example.com/sub,https://sub2.example.com/sub,https://sub3.example.com/sub
```

Перечислите все ваши подписки через запятую.

### 3. Использование в V2Box

Итоговая ссылка подписки:

```
https://your-project.vercel.app/sub
```

Добавьте её в V2Box: **+** → **Добавить подписку** → вставьте URL.

---

## Как работает

- Запрашивает все `SUB_URLS` параллельно
- Декодирует Base64 или читает plain-text
- Объединяет ноды, удаляет дубликаты
- Отдаёт обратно в Base64 (стандарт v2ray)

## Форматы подписок

Поддерживаются: `vmess://`, `vless://`, `ss://`, `trojan://`, `hysteria2://`, `hy2://` — любой v2ray-совместимый формат.

## Переменные окружения

| Переменная | Описание |
|---|---|
| `SUB_URLS` | Список URL подписок через запятую |
