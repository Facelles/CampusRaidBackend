# 🚀 CampusRaid — Backend

**CampusRaid** — гейміфікована освітня платформа для студентів та викладачів, де вивчення програмування перетворюється на битви з IT-монстрами (босами).

Архітектура побудована за принципом **«швидко в розробці, легко деплоїться, безпечно типізується»**. Замість класичного стеку Node.js використовується **Bun** — неймовірно швидкий рантайм з вбудованим TypeScript.

---

## 🛠️ Технологічний Стек

| Технологія | Роль |
|---|---|
| **Bun** | JavaScript runtime (швидша альтернатива Node.js) |
| **Express.js** | HTTP-фреймворк для побудови REST API |
| **Prisma ORM** | Типобезпечна робота з базою даних |
| **PostgreSQL** | Основна база даних (NeonDB / Supabase / Railway) |
| **Zod** | Runtime-валідація тіл запитів |
| **JWT (jsonwebtoken)** | Аутентифікація через Bearer-токени |
| **bcryptjs** | Хешування паролів |
| **CORS** | Дозвіл запитів з PWA-фронтенду |
| **Render.com** | Хостинг сервера (автоматичний деплой) |

---

## 🏗️ Архітектура проєкту

```
backend/
├── prisma/
│   ├── schema.prisma        # Схема бази даних (всі моделі)
│   └── seed.ts              # Наповнення БД початковими даними
├── src/
│   ├── controllers/
│   │   ├── auth.ts          # Реєстрація, логін, вибір університету
│   │   ├── forum.ts         # Пости, коментарі, голосування
│   │   ├── game.ts          # Боси, атаки, пазли
│   │   ├── leaderboard.ts   # Рейтинги студентів та університетів
│   │   ├── chat.ts          # Приватні повідомлення між друзями
│   │   ├── friends.ts       # Запити дружби та список друзів
│   │   ├── shop.ts          # Магазин VIP-титулів
│   │   └── teacher.ts       # Дашборд та кастомні боси для викладача
│   ├── middleware/
│   │   └── auth.ts          # JWT-middleware (authenticateToken)
│   ├── routes/
│   │   └── api.ts           # Центральний роутер всіх ендпоінтів
│   ├── lib/
│   │   └── prisma.ts        # Singleton-інстанція Prisma Client
│   └── server.ts            # Точка входу, Express app, CORS, порт
└── .env                     # Секрети (DATABASE_URL, JWT_SECRET)
```

---

## 🏗️ Швидкий Старт

**1. Клонуй репозиторій та встановлюй залежності:**
```bash
bun install
```

**2. Налаштуй середовище:**
Створи файл `.env`:
```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
JWT_SECRET="your-super-secret-key-change-in-production"
PORT=3000
```

**3. Синхронізуй схему БД:**
```bash
bun run db:push
```

**4. Заповни БД початковими даними:**
```bash
bun run prisma/seed.ts
```
> Seed створить: базовий університет, 5 VIP-предметів у магазині, та 3 унікальних босів (кожен з 4 рівнями пазлів різної складності).

**5. Запуск сервера (dev-режим з автоперезавантаженням):**
```bash
bun run dev
```

---

## 🔐 Система Аутентифікації

Після успішного логіну або реєстрації сервер повертає `{ token, user }`:

```json
{
  "token": "eyJhbGci...",
  "user": { "id": "...", "name": "Влад", "email": "...", "xp": 150, "coins": 20 }
}
```

Всі захищені маршрути потребують заголовка:
```
Authorization: Bearer <token>
```

JWT-middleware (`src/middleware/auth.ts`) верифікує токен та підставляє `req.user` з даними авторизованого користувача.

---

## 🛣️ Специфікація API

Базовий URL: `/api`. Всі тіла запитів — `application/json`.

---

### 🔑 Блок 1: Авторизація (Публічні ендпоінти)

#### `POST /api/auth/register`
Реєстрація нового користувача.

| Поле | Тип | Опис |
|---|---|---|
| `email` | string | Email користувача |
| `password` | string | Пароль (мін. 6 символів) |
| `name` | string | Ім'я/нікнейм |

**Відповідь:** `{ token, user }`

#### `POST /api/auth/login`
Вхід в акаунт.

| Поле | Тип | Опис |
|---|---|---|
| `email` | string | Email користувача |
| `password` | string | Пароль |

**Відповідь:** `{ token, user }`

#### `GET /api/universities`
Список усіх університетів для вибору при реєстрації.

#### `PUT /api/user/university` 🔒
Оновлення університету після реєстрації.

| Поле | Тип |
|---|---|
| `universityId` | string |

---

### 📰 Блок 2: Форум (Reddit-style) 🔒

#### `GET /api/posts?universityId=...`
Список постів. Сортуються за рейтингом (upvotes − downvotes). Якщо `universityId` не вказано — повертає всі пости.

#### `POST /api/posts`
Створити новий пост.

| Поле | Тип |
|---|---|
| `title` | string |
| `content` | string |
| `universityId` | string |

#### `GET /api/posts/:id`
Деталі поста з усіма коментарями та відповідями (nested).

#### `POST /api/posts/:id/vote`
Проголосувати за пост.

| Поле | Тип | Значення |
|---|---|---|
| `type` | string | `"UP"` або `"DOWN"` |

**Логіка:** Якщо вже голосував — змінює голос. Якщо голосував тим самим — скасовує голос.

#### `POST /api/posts/:id/comments`
Додати коментар або відповідь.

| Поле | Тип | Опис |
|---|---|---|
| `content` | string | Текст коментаря |
| `parentId` | string? | ID батьківського коментаря (якщо відповідь) |

---

### 👾 Блок 3: Ігрова Логіка (Бос-Рейд) 🔒

#### `GET /api/boss/active?universityId=...`
Отримати поточного активного боса університету з **перемішаними** блоками коду для пазлу.

**Відповідь включає:**
- Дані боса (ім'я, HP, фото)
- Поточний пазл (`title`, `description`, `type`)
- Масив перемішаних блоків коду

#### `POST /api/boss/attack` 🔒
Спроба вирішити пазл.

| Поле | Тип | Опис |
|---|---|---|
| `puzzleId` | string | ID пазлу |
| `blockIds` | string[] | Масив ID блоків у вибраному порядку |

**Відповідь при успіху:**
```json
{ "success": true, "damage": 50, "message": "Критичний удар! +50 XP, +10 монет" }
```

**Логіка:**
- Порівнює порядок `blockIds` з правильним порядком у БД
- При успіху: знімає HP боса, нараховує XP та монети, перемикає пазл на наступний
- При смерті боса (HP ≤ 0): автоматично активує наступного боса

#### `GET /api/boss/join?inviteCode=...`
Приєднатися до приватного боса викладача за кодом запрошення (формат: `HACK-XXX`).

---

### 🏆 Блок 4: Лідерборд 🔒

#### `GET /api/leaderboard/users`
Топ-10 студентів за XP. Включає ім'я, XP, університет.

#### `GET /api/leaderboard/universities`
Рейтинг університетів за сумарним XP всіх студентів.

#### `GET /api/leaderboard/boss/:bossId`
Топ гравців, що завдали найбільше шкоди конкретному босу.

---

### 💬 Блок 5: Приватний Чат 🔒

#### `POST /api/chat`
Надіслати повідомлення. Дозволено тільки між друзями.

| Поле | Тип |
|---|---|
| `receiverId` | string |
| `content` | string |

#### `GET /api/chat/history?user2Id=...`
Отримати повну історію переписки між авторизованим користувачем та `user2Id`.

#### `GET /api/chat/my`
Список усіх діалогів авторизованого користувача з останніми повідомленнями та кількістю непрочитаних.

#### `POST /api/chat/read`
Позначити всі повідомлення від партнера як прочитані.

| Поле | Тип |
|---|---|
| `partnerId` | string |

---

### 🤝 Блок 6: Друзі 🔒

#### `POST /api/friends/request`
Надіслати запит у друзі.

| Поле | Тип |
|---|---|
| `user2Id` | string |

#### `POST /api/friends/respond`
Прийняти або відхилити запит.

| Поле | Тип | Значення |
|---|---|---|
| `friendshipId` | string | ID заявки |
| `action` | string | `"accept"` або `"reject"` |

#### `GET /api/friends/:userId`
Список підтверджених друзів користувача.

---

### 🛒 Блок 7: Магазин 🔒

#### `GET /api/shop/items`
Список усіх доступних VIP-титулів (назва, опис, ціна в монетах).

#### `POST /api/shop/buy`
Купити предмет.

| Поле | Тип |
|---|---|
| `itemId` | string |

**Логіка:** Перевіряє баланс монет, унікальність покупки, списує монети, додає титул.

#### `POST /api/shop/equip`
Екіпірувати титул (зробити активним, відображатиметься на форумі).

| Поле | Тип |
|---|---|
| `itemId` | string |

---

### 🎓 Блок 8: Панель Викладача 🔒

#### `GET /api/teacher/stats`
Аналітичний дашборд: кількість створених босів, відсоток успіху студентів, кількість унікальних учасників.

#### `POST /api/teacher/boss`
Створити кастомного боса з власними завданнями.

```json
{
  "name": "Тест з ООП",
  "maxHp": 1000,
  "universityId": "...",
  "puzzles": [
    {
      "title": "Пазл 1",
      "description": "Опис завдання",
      "type": "ORDERING",
      "blocks": [
        { "text": "class Animal {", "order": 1 },
        { "text": "  speak() {}", "order": 2 }
      ]
    }
  ]
}
```

**Відповідь включає** `inviteCode` (формат `HACK-XXX`) для розповсюдження студентам.

---

## 📊 Схема Бази Даних

```
User ─────────────────────────────────────────
  id, name, email, password (bcrypt)
  role: STUDENT | TEACHER | ADMIN
  xp, coins
  titles: string[]  ← масив придбаних/екіпірованих VIP-титулів
  universityId → University

University ───────────────────────────────────
  id, name

Boss ─────────────────────────────────────────
  id, name, imageUrl
  maxHp, currentHp
  status: ACTIVE | DEFEATED
  universityId → University
  inviteCode (для кастомних босів викладача)
  creatorId → User (nullable)

Puzzle ────────────────────────────────────────
  id, title, description
  type: MULTIPLE_CHOICE | ORDERING
  isActive, order
  bossId → Boss

Block ─────────────────────────────────────────
  id, text, order
  puzzleId → Puzzle

BossAttempt ──────────────────────────────────
  userId, puzzleId
  success: boolean
  damage: int

Post ──────────────────────────────────────────
  id, title, content
  userId → User
  universityId → University
  upvotes, downvotes

PostVote ─────────────────────────────────────
  userId, postId
  type: UP | DOWN

Comment ──────────────────────────────────────
  id, content
  userId → User
  postId → Post
  parentId → Comment (nullable, для відповідей)

Message ──────────────────────────────────────
  id, content, isRead
  senderId → User
  receiverId → User

Friendship ────────────────────────────────────
  id, status: PENDING | ACCEPTED | REJECTED
  user1Id → User
  user2Id → User

ShopItem ──────────────────────────────────────
  id, name, description
  price (монети)
  type: TITLE

UserShopItem ─────────────────────────────────
  userId → User
  itemId → ShopItem
```

---

## 🚀 Деплой на Render.com

1. Підключіть GitHub-репозиторій до [render.com](https://render.com).
2. Створіть **Web Service** з параметрами:
   - **Build Command:** `bun install && bunx prisma generate && bun run db:push`
   - **Start Command:** `bun src/server.ts`
3. Додайте змінні середовища:
   - `DATABASE_URL` = рядок підключення PostgreSQL
   - `JWT_SECRET` = довгий випадковий рядок
4. **Deploy**.

> 💡 Після першого деплою виконайте seed через Render Shell: `bun run prisma/seed.ts`

---

## 🔒 Безпека

- Паролі хешуються через **bcryptjs** (cost factor 10)
- JWT-токени живуть **30 днів**
- Всі маршрути (крім `/auth/login`, `/auth/register`, `/universities`) захищені middleware
- `req.user.id` береться виключно з JWT-токену — підробити не можна
- Паролі ніколи не повертаються в API-відповідях (деструктуризація з видаленням поля)
- Zod-валідація на всіх вхідних даних — SQL injection неможливий через Prisma
