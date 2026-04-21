# 🛒 aitpoludsky SaaS

> Мультитенантна e-commerce SaaS-платформа з мультимовною вітриною, складом, замовленнями, знижками та публічним storefront-ом. Українська мова UI з коробки + англійська / польська / німецька.

![stack](https://img.shields.io/badge/backend-Django%205-092e20) ![stack](https://img.shields.io/badge/frontend-Vite%206-646cff) ![stack](https://img.shields.io/badge/db-PostgreSQL%2016-336791) ![stack](https://img.shields.io/badge/lang-TypeScript%20%2B%20Python%203.13-3178c6)

---

## 📑 Зміст

- [✨ Можливості](#-можливості)
- [🧱 Стек](#-стек)
- [📁 Структура проекту](#-структура-проекту)
- [🚀 Швидкий старт (Docker)](#-швидкий-старт-docker)
- [👤 Створення користувача](#-створення-користувача)
- [🗄️ Міграції](#️-міграції)
- [🧪 Тести](#-тести)
- [🔧 Локальна розробка без Docker](#-локальна-розробка-без-docker)
- [🌐 Доступні URL](#-доступні-url)
- [🔌 API довідник](#-api-довідник)
- [⚙️ Змінні середовища](#️-змінні-середовища)
- [🏭 Production-запуск](#-production-запуск)
- [🛠️ CI / лінтери / pre-commit](#️-ci--лінтери--pre-commit)
- [🐛 Траблшутінг](#-траблшутінг)

---

## ✨ Можливості

| | Модуль | Опис |
|---|---|---|
| 🏪 | **Multi-tenant** | Один акаунт → кілька магазинів. Ізоляція даних через `X-Shop-Slug` header + `TenantMiddleware`. |
| 📦 | **Каталог** | Товари з `sku`, ціною, складом, перекладами на мови магазину (`translations` JSONB). |
| 🛍️ | **Замовлення** | Nested items, автонумерація `AP-00001`, snapshot товарів, 6 статусів, 3 канали. |
| 👥 | **Клієнти** | Рівні (Bronze → Platinum), агреговані LTV і кількість замовлень. |
| 📚 | **Склад** | `StockMovement` з атомарним `F()`-оновленням, append-only історія. |
| 🎟️ | **Знижки** | Відсоткові / фіксовані, вікна дат, ліміти використань, преглядний `validate/` endpoint. |
| 💬 | **Inbox** | Mock-модель Thread + Message (готова під Instagram/Telegram/Viber). |
| 🌐 | **Storefront** | Публічна сторінка `/s/<shop>`, без auth, з перемикачем мов. |
| 📊 | **Dashboard** | KPI, sparkline за 14 днів, низький запас, останні замовлення. |
| 🌍 | **i18n** | 4 мови UI (uk/en/pl/de), мова юзера синхронізується між сесіями. |

---

## 🧱 Стек

| Шар | Технології |
|---|---|
| 🖥️ **Frontend** | Vite 6 · React 18 · TypeScript (strict) · react-router v7 · react-i18next |
| ⚙️ **Backend** | Django 5 · DRF 3.15 · psycopg 3 (async-ready) |
| 🗃️ **База** | PostgreSQL 16 |
| 🧪 **Тести** | pytest · pytest-django · factory-boy |
| 🎨 **Дизайн** | OKLCH-токени · Geist · Newsreader (serif) · JetBrains Mono |
| 📦 **Контейнери** | Docker Compose · gunicorn · nginx (у prod) |
| 🧹 **Якість** | ruff · black · pre-commit · GitHub Actions CI |

---

## 📁 Структура проекту

```
aitpoludsky/
├── 📄 docker-compose.yml          # dev-стек (postgres + backend + frontend)
├── 📄 docker-compose.prod.yml     # prod-стек (nginx + gunicorn)
├── 📄 .env.example                # шаблон змінних середовища
│
├── 📂 backend/                    # 🐍 Django API
│   ├── manage.py
│   ├── requirements.txt
│   ├── pytest.ini
│   ├── pyproject.toml             # ruff + black
│   ├── Dockerfile / Dockerfile.prod
│   ├── entrypoint.sh
│   ├── 📂 config/
│   │   ├── settings/{base,dev,prod}.py
│   │   └── urls.py
│   ├── 📂 apps/
│   │   ├── accounts/              # 👤 User (email-first)
│   │   ├── shops/                 # 🏪 Shop, ShopMembership, TenantMiddleware
│   │   ├── catalog/               # 📦 Product + translations
│   │   ├── customers/             # 👥 Customer + tiers + LTV
│   │   ├── orders/                # 🛍️ Order + OrderItem + discount
│   │   ├── discounts/             # 🎟️ Discount + validate/
│   │   ├── inventory/             # 📚 StockMovement (атомарно)
│   │   ├── inbox/                 # 💬 Thread + Message (mock)
│   │   ├── dashboard/             # 📊 summary endpoint
│   │   └── storefront/            # 🌐 публічний /api/public/...
│   └── 📂 tests/                  # pytest
│
└── 📂 frontend/                   # ⚛️ Vite + React + TS
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── Dockerfile / Dockerfile.prod
    ├── nginx.conf                 # proxy на backend у prod
    ├── index.html
    └── 📂 src/
        ├── main.tsx
        ├── App.tsx                # роутинг
        ├── types.ts
        ├── 📂 api/                # fetch-клієнт з CSRF + всі endpoint-и
        ├── 📂 components/         # Shell, Icon, Sparkline, StatCard…
        ├── 📂 context/            # AuthContext, ShopContext
        ├── 📂 pages/              # LandingPage, DashboardPage, OrdersPage…
        ├── 📂 i18n/               # react-i18next + 4 локалі
        ├── 📂 styles/             # base.css + components.css + landing.css
        └── 📂 utils/              # format.ts
```

---

## 🚀 Швидкий старт (Docker)

### 1️⃣ Попередні умови

- 🐳 **Docker Desktop** запущений
- 🖥️ Порти `5173`, `8000`, `5432` вільні

### 2️⃣ Клонування + налаштування

```bash
git clone <repo-url> aitpoludsky
cd aitpoludsky
cp .env.example .env          # 🔐 налаштуй, якщо треба
```

### 3️⃣ Побудова і запуск

```bash
docker compose up --build -d
```

Стек підніметься:
- ⏳ postgres пройде healthcheck
- 🔄 backend застосує міграції автоматично (через entrypoint)
- 🌐 frontend розгорне Vite dev-сервер на `0.0.0.0:5173`

### 4️⃣ Перша міграція (лише при повній ініціалізації)

Якщо підіймаєш вперше і міграційні файли ще не створено:

```bash
docker compose exec backend python manage.py makemigrations \
  accounts shops catalog customers discounts orders inventory inbox
docker compose exec backend python manage.py migrate
```

### 5️⃣ Готово

- 🌟 Лендинг: http://localhost:5173/
- ⚙️ Django admin: http://localhost:8000/admin/
- 📡 API: http://localhost:8000/api/

---

## 👤 Створення користувача

### Варіант A — суперюзер (для admin-панелі)

```bash
docker compose exec backend python manage.py createsuperuser
```

Email + пароль інтерактивно.

### Варіант B — звичайний користувач через UI

🌐 Відкрий http://localhost:5173/signup і зареєструйся як звичайний магазин.

### Варіант C — non-interactive (для seed-ів)

```bash
docker compose exec -T backend python manage.py shell -c "
from apps.accounts.models import User
User.objects.create_superuser(
    email='admin@aitpoludsky.local',
    password='change-me-now',
    full_name='Admin',
)
"
```

---

## 🗄️ Міграції

| Команда | Коли використовувати |
|---|---|
| `makemigrations` | Після зміни моделей — генерує файл міграції |
| `migrate` | Застосовує всі невиконані міграції в БД |
| `showmigrations` | Показує статус усіх міграцій |

```bash
# Згенерувати міграції для одного app
docker compose exec backend python manage.py makemigrations orders

# Застосувати
docker compose exec backend python manage.py migrate

# Переглянути статус
docker compose exec backend python manage.py showmigrations
```

### ⚠️ Після зміни моделей

1. Зміни файл `apps/<name>/models.py`
2. `makemigrations <name>` → перевіряй створений файл
3. `migrate` → застосувати
4. Commit і модель, і міграцію

---

## 🧪 Тести

### Запуск повного набору

```bash
docker compose exec backend pytest -q
```

Очікуваний результат: **19 passed**.

### Окремий файл / тест

```bash
docker compose exec backend pytest tests/test_orders.py -v
docker compose exec backend pytest tests/test_orders.py::test_create_order_with_items -v
```

### Що покрито

| Файл | Що перевіряє |
|---|---|
| `test_tenant_isolation.py` | Tenant не бачить чужі дані, без `X-Shop-Slug` → 403 |
| `test_orders.py` | Nested serializer, автонумерація, snapshot, знижки |
| `test_inventory.py` | `F()`-атомарність, заборона від'ємного stock |
| `test_translations.py` | Переклад у дозволених мовах магазину |
| `test_storefront.py` | Публічний endpoint без auth, фільтр `stock > 0` |

### TypeScript typecheck (фронт)

```bash
docker compose exec frontend npm run typecheck
```

---

## 🔧 Локальна розробка без Docker

### 🐍 Backend

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate       # Windows bash
# source .venv/bin/activate         # macOS / Linux
pip install -r requirements.txt

# Налаштуй POSTGRES_HOST=localhost у .env (якщо БД локально)
# Або підніми тільки postgres у Docker:
# docker compose up -d postgres

python manage.py migrate
python manage.py runserver 8000
```

### ⚛️ Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite dev-сервер проксіює `/api` на backend — за замовчуванням на `http://localhost:8000` (див. `VITE_API_PROXY_TARGET` у `.env`).

---

## 🌐 Доступні URL

### Фронт (http://localhost:5173)

| Роут | Доступ | Опис |
|---|---|---|
| `/` | 🌍 публічний | Лендинг |
| `/login` | 🌍 гість | Форма входу |
| `/signup` | 🌍 гість | Реєстрація |
| `/s/:shopSlug` | 🌍 публічний | Публічна вітрина магазину |
| `/dashboard` | 🔒 auth | KPI, sparkline, останні замовлення |
| `/orders` | 🔒 auth | Замовлення + drawer з items + знижка |
| `/catalog` | 🔒 auth | Товари з табами мов для перекладів |
| `/customers` | 🔒 auth | Клієнти + LTV + tiers |
| `/inventory` | 🔒 auth | Журнал рухів складу |
| `/discounts` | 🔒 auth | Промокоди, правила |
| `/inbox` | 🔒 auth | Потоки повідомлень |
| `/storefront` | 🔒 auth | Налаштування публічної вітрини |
| `/shops` | 🔒 auth | Магазини + мови |

### Backend (http://localhost:8000)

- `/admin/` — Django admin
- `/api/` — REST API (див. наступний розділ)

---

## 🔌 API довідник

Усі приватні endpoint-и вимагають **`X-Shop-Slug` header** (крім `/api/auth/*` і `/api/shops/`).

### 🔐 Auth

| Метод | URL | Опис |
|---|---|---|
| `GET` | `/api/auth/csrf/` | Видати CSRF cookie |
| `POST` | `/api/auth/signup/` | Реєстрація |
| `POST` | `/api/auth/login/` | Логін (session) |
| `POST` | `/api/auth/logout/` | Логаут |
| `GET` | `/api/auth/me/` | Профіль |
| `PATCH` | `/api/auth/me/` | Оновити `full_name`, `language` |

### 🏪 Shops

| Метод | URL | Опис |
|---|---|---|
| `GET` / `POST` | `/api/shops/` | Мої магазини / створити |
| `GET` / `PATCH` / `DELETE` | `/api/shops/<slug>/` | Деталі |

### 📦 Catalog · 👥 Customers · 🎟️ Discounts · 🛍️ Orders

Стандартний REST (list/create/retrieve/update/delete):

| Ресурс | URL |
|---|---|
| Products | `/api/catalog/products/` + `/<id>/` |
| Customers | `/api/customers/` + `/<id>/` |
| Discounts | `/api/discounts/` + `/<id>/` + `POST /api/discounts/validate/` |
| Orders | `/api/orders/` + `/<id>/` |

### 📚 Inventory

| Метод | URL |
|---|---|
| `GET` / `POST` | `/api/inventory/movements/` |
| `GET` | `/api/inventory/movements/<id>/` |

*Update/Delete заборонено — append-only журнал.*

### 💬 Inbox

| Метод | URL |
|---|---|
| `GET` / `POST` | `/api/inbox/threads/` |
| `GET` / `PATCH` / `DELETE` | `/api/inbox/threads/<id>/` |
| `POST` | `/api/inbox/threads/<id>/reply/` |

### 📊 Dashboard

| Метод | URL |
|---|---|
| `GET` | `/api/dashboard/summary/` |

### 🌐 Публічні (без auth)

| Метод | URL |
|---|---|
| `GET` | `/api/public/<shop_slug>/` |
| `GET` | `/api/public/<shop_slug>/products/` |

---

## ⚙️ Змінні середовища

Файл: [.env](.env.example)

### 🐍 Django

| Змінна | Default | Що це |
|---|---|---|
| `DJANGO_SETTINGS_MODULE` | `config.settings.dev` | dev / prod |
| `DJANGO_SECRET_KEY` | ⚠️ **обовʼязково** | SECRET_KEY |
| `DJANGO_DEBUG` | `1` | Debug-режим |
| `DJANGO_ALLOWED_HOSTS` | `localhost,127.0.0.1,backend` | CSV |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | `http://localhost:5173` | CSV |

### 🗃️ Postgres

| Змінна | Default |
|---|---|
| `POSTGRES_DB` | `aitpoludsky` |
| `POSTGRES_USER` | `aitpoludsky` |
| `POSTGRES_PASSWORD` | `aitpoludsky_dev` |
| `POSTGRES_HOST` | `postgres` (у Docker) / `localhost` (без) |
| `POSTGRES_PORT` | `5432` |

### ⚛️ Frontend

| Змінна | Default |
|---|---|
| `VITE_API_BASE_URL` | `/api` |
| `VITE_API_PROXY_TARGET` | `http://backend:8000` (Docker) / `http://localhost:8000` (локально) |

---

## 🏭 Production-запуск

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

- ⚙️ **backend**: gunicorn + `entrypoint.sh` (автомігрує + collectstatic)
- 🌐 **frontend**: Vite build → nginx (SPA fallback + proxy на backend + gzip)
- 🔒 Одразу port `80` назовні

### Що зробити перед prod

- [ ] Згенерувати новий `DJANGO_SECRET_KEY`
- [ ] `DJANGO_DEBUG=0`
- [ ] Налаштувати `DJANGO_ALLOWED_HOSTS` / `DJANGO_CSRF_TRUSTED_ORIGINS`
- [ ] Надійний `POSTGRES_PASSWORD`
- [ ] HTTPS-termination (nginx reverse proxy або cloud LB)
- [ ] Backup postgres_data volume

---

## 🛠️ CI / лінтери / pre-commit

### Pre-commit (локально)

```bash
pip install pre-commit
pre-commit install
```

Хуки: `trailing-whitespace`, `ruff`, `ruff-format`, `prettier` (frontend).

### Ручний запуск лінтерів

```bash
# Backend
docker compose exec backend ruff check .
docker compose exec backend black --check .

# Frontend
docker compose exec frontend npm run typecheck
docker compose exec frontend npm run build
```

### GitHub Actions

Два job-и у [.github/workflows/ci.yml](.github/workflows/ci.yml):
- **backend**: postgres service, ruff, black, django check, pytest
- **frontend**: npm install, typecheck, build

---

## 🐛 Траблшутінг

### ❌ `backend` рестартується з `Dependency on app with no migrations`

Міграції для custom-додатків ще не створено. Виправ:

```bash
docker compose run --rm backend python manage.py makemigrations \
  accounts shops catalog customers discounts orders inventory inbox
docker compose restart backend
```

### ❌ `connect ECONNREFUSED 172.x.x.x:8000` у frontend log

Backend у рестарт-лупі. Перевір:

```bash
docker compose logs backend --tail 30
```

### ❌ `Port 5173 already in use`

Щось уже висить на цьому порту:

```bash
# Windows
netstat -ano | findstr :5173
# Linux / macOS
lsof -i :5173
```

Зупини процес або змінь порт у `docker-compose.yml`.

### ❌ `django.db.utils.OperationalError: could not connect to server`

Postgres ще не пройшов healthcheck:

```bash
docker compose ps        # перевір статус
docker compose logs postgres --tail 20
```

### ❌ `403 Forbidden` на приватному API

Забув передати `X-Shop-Slug` header або користувач не є членом магазину. Фронт додає header автоматично з активного магазину; для ручного curl:

```bash
curl -H "X-Shop-Slug: your-shop-slug" \
     --cookie "sessionid=...; csrftoken=..." \
     http://localhost:8000/api/catalog/products/
```

### 🔄 Повний рестарт (чистий)

```bash
docker compose down              # контейнери, volumes вціліють
docker compose build             # перебудувати образи
docker compose up -d             # підняти
```

### 💣 Скинути БД (УВАГА: втратиш усі дані)

```bash
docker compose down -v           # -v видаляє volumes
docker compose up -d
docker compose exec backend python manage.py migrate
```

---

## 📝 Ліцензія

Власний проект. Усі права застережено.

## 👤 Автор

**aitpoludsky** — український e-commerce SaaS.

---

<p align="center">🇺🇦 Made in Ukraine</p>
