# AI TryOn Platform

Virtual try-on platform powered by FASHN.ai, built with Next.js 15 + FastAPI + PostgreSQL + Redis/Celery + Cloudinary.

## Features

- **AI-Powered Try-On**: Upload garment + select model → photorealistic output via FASHN.ai
- **Batch Processing**: Try one garment on multiple models simultaneously (Celery workers)
- **Model Gallery**: Filterable gallery of AI models (gender, body type, skin tone)
- **Credit System**: Transaction log, per-generation deduction, admin credit management
- **Auth**: JWT access/refresh tokens with bcrypt passwords
- **Admin Panel**: Stats, user management, model gallery CRUD
- **History**: View, download, delete past generations

## Quick Start

### 1. Configure Environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Edit `backend/.env` and fill in:
- `FASHN_API_KEY` — from [fashn.ai](https://fashn.ai)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — from [cloudinary.com](https://cloudinary.com)
- `SECRET_KEY` — a random secret string

### 2. Start with Docker Compose

```bash
docker-compose up --build
```

Services start at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs (debug mode)

### 3. Local Development

Start just the infrastructure:
```bash
docker-compose -f docker-compose.dev.yml up -d
```

Backend:
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # fill in values
uvicorn app.main:app --reload --port 8000
```

Celery worker (for batch jobs):
```bash
cd backend
celery -A app.tasks.batch_tasks.celery_app worker --loglevel=info
```

Frontend:
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

## Project Structure

```
ai-tryon/
├── backend/                    # FastAPI
│   ├── app/
│   │   ├── api/v1/            # Endpoints: auth, tryon, models, generations, admin
│   │   ├── core/              # config, security, database
│   │   ├── models/            # SQLAlchemy ORM models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # fashn, cloudinary, credit services
│   │   ├── tasks/             # Celery batch tasks
│   │   └── main.py
│   └── requirements.txt
│
├── frontend/                   # Next.js 15
│   └── src/
│       ├── app/               # Pages (landing, auth, studio, dashboard, history, admin)
│       ├── components/        # Studio & admin components
│       ├── lib/               # API client, auth utils, Zustand store
│       └── types/             # TypeScript types
│
└── docker-compose.yml
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Register + get tokens |
| POST | `/api/v1/auth/login` | Login + get tokens |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/auth/me` | Current user |
| POST | `/api/v1/tryon/upload-garment` | Upload garment to Cloudinary |
| POST | `/api/v1/tryon/run` | Start single try-on |
| GET | `/api/v1/tryon/{id}/status` | Poll generation status |
| POST | `/api/v1/tryon/batch` | Start batch try-on |
| GET | `/api/v1/tryon/batch/{id}` | Poll batch status |
| GET | `/api/v1/models` | List models (filterable) |
| GET | `/api/v1/generations` | User's generation history |
| DELETE | `/api/v1/generations/{id}` | Delete generation |
| GET | `/api/v1/admin/stats` | Platform statistics |
| GET | `/api/v1/admin/users` | All users |
| POST | `/api/v1/admin/users/{id}/credits` | Adjust credits |
| GET/POST/PUT/DELETE | `/api/v1/admin/models` | Model gallery CRUD |

## FASHN.ai Integration Flow

1. Garment uploaded → Cloudinary URL
2. Model selected from gallery → `model.image_url`
3. `POST /api/v1/run` → FASHN prediction starts → `prediction_id`
4. Background task polls FASHN every 2s → on complete, saves outputs to Cloudinary
5. Frontend polls `/tryon/{id}/status` every 3s → shows results

## Batch Processing

```
POST /tryon/batch
  → Creates BatchJob record
  → Dispatches N Celery tasks (one per model)
  → Each task: calls FASHN → polls → saves to Cloudinary → updates BatchJob.completed
  → Frontend polls /tryon/batch/{id} every 3s → progress bar updates
```

## Database Schema

| Table | Key Fields |
|-------|-----------|
| `users` | id, email, password_hash, full_name, role, credits_remaining |
| `model_assets` | id, name, gender, body_type, skin_tone, image_url |
| `generations` | id, user_id, garment_url, model_asset_id, output_urls[], status |
| `batch_jobs` | id, user_id, garment_url, model_ids[], status, total, completed |
| `credit_transactions` | id, user_id, amount, type (use/purchase/admin) |

## Environment Variables

### Backend (.env)

```env
DATABASE_URL=postgresql+asyncpg://tryon:tryon123@localhost:5432/tryon_db
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-super-secret-key
FASHN_API_KEY=your-fashn-api-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CREDITS_PER_GENERATION=1
INITIAL_CREDITS=10
DEBUG=true
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Creating Admin User

After registering, update the user role in the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

Or via Python:
```python
# In backend shell
from app.core.database import AsyncSessionLocal
from app.models.user import User, UserRole
from sqlalchemy import update
# ... update user role
```
