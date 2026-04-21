# aitpoludsky SaaS

Мультитенантна SaaS-платформа для українського e-commerce. Бекенд — Django + DRF, БД — PostgreSQL, фронт — Vite + React + TypeScript.

## Швидкий старт

```bash
cp .env.example .env
docker compose up --build
```

- Backend API: http://localhost:8000/api/
- Django admin: http://localhost:8000/admin/
- Frontend: http://localhost:5173/

Перший запуск виконує міграції автоматично. Для створення суперкористувача:

```bash
docker compose exec backend python manage.py createsuperuser
```

## Структура

```
aitpoludsky/
├── backend/          Django + DRF
│   ├── config/       settings (base/dev/prod), urls, wsgi
│   └── apps/
│       ├── accounts/ кастомний User (email-first)
│       └── shops/    Shop, ShopMembership, tenant middleware
├── frontend/         Vite + React + TS
│   └── src/
│       ├── api/      fetch-клієнт з CSRF
│       ├── components/
│       ├── pages/
│       └── styles/   OKLCH-токени з прототипу
├── docker-compose.yml
└── .env.example
```

## Архітектура

**Multi-tenant:** shared DB + `shop_id` FK на доменних моделях. Поточний магазин визначається middleware з HTTP-заголовка `X-Shop-Slug` або сесії.

**Автентифікація:** Django session + CSRF. Frontend звертається через Vite proxy (`/api` → `backend:8000`), cookies передаються автоматично.

**Стиль:** OKLCH-токени, шрифти Geist / Newsreader / JetBrains Mono, двотемність.

## Розробка без Docker

Backend:
```bash
cd backend
python -m venv .venv && source .venv/Scripts/activate  # Windows bash
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```
