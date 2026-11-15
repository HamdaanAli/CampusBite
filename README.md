# CampusBite – Restaurant Ordering & Delivery Platform

CampusBite is a full-stack restaurant ordering and delivery application. Customers can explore restaurants, browse menus, place orders, track order progress, submit reviews, request refunds, and access AI-powered order insights. Restaurant owners manage restaurants, menus, orders, delivery assignments, statistics, and refund requests. Delivery partners manage their assigned deliveries.

## Technologies Used

### Frontend
- React 19
- JavaScript (ES6+)
- React Router
- Axios
- Vite

### Backend
- Python
- FastAPI
- Pydantic
- SQLAlchemy
- Alembic
- JWT authentication
- bcrypt password hashing
- APScheduler
- Groq AI integration

### Database and Tools
- PostgreSQL 17
- Docker
- Docker Compose
- Git and GitHub

## Features

- Customer, restaurant owner, and delivery partner roles
- Registration, login, JWT authentication, and role-based access
- Restaurant and menu browsing and management
- Shopping cart and dummy payment checkout
- Order history, status tracking, and permitted cancellation
- Order preparation and delivery status management
- Delivery partner assignment
- Customer reviews and ratings
- Return and refund request management
- Payment ledger records
- Restaurant statistics and order reminders
- AI-powered customer order insights

## Project Structure

```text
CampusBite/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   ├── alembic/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   └── package.json
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

## Prerequisites

- Node.js and npm
- Python 3.12 or compatible Python environment for local backend development
- Docker Desktop with Docker Compose
- Git

## Environment Configuration

Create a local `.env` file in the project root using `.env.example` as a reference.

Required database and authentication variables:

| Variable | Description |
|---|---|
| POSTGRES_HOST | Database host; use `127.0.0.1` for local backend or `db` in Docker Compose |
| POSTGRES_DB | PostgreSQL database name |
| POSTGRES_USER | PostgreSQL username |
| POSTGRES_PASSWORD | PostgreSQL password |
| JWT_SECRET_KEY | Secret used to sign JWT tokens |
| JWT_ALGORITHM | JWT signing algorithm |
| ACCESS_TOKEN_EXPIRE_MINUTES | Access token lifetime in minutes |

AI integration:

| Variable | Description |
|---|---|
| GROQ_API_KEY | API key for Groq AI functionality |

Optional settings may include `OPENAI_API_KEY` and `GEMINI_API_KEY`.

Use strong private values in `.env`. Never commit `.env` or real API keys and passwords to GitHub.

## Run the Frontend Locally

Open a terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite development URL shown in the terminal, normally:

```text
http://localhost:5173
```

To create a production build:

```powershell
npm run build
```

## Run the Backend and Database Using Docker Compose

From the project root, first ensure `.env` exists and contains the required database and JWT values.

Start the database and backend:

```powershell
docker compose up --build -d
```

The backend container waits for PostgreSQL to become healthy, applies the existing Alembic migrations, and starts FastAPI.

View running containers:

```powershell
docker compose ps
```

View backend logs:

```powershell
docker compose logs -f backend
```

Stop the containers:

```powershell
docker compose down
```

To stop containers and also delete the persisted database volume, use:

```powershell
docker compose down -v
```

**Warning:** The `-v` option deletes the PostgreSQL data volume.

## Database Setup

PostgreSQL 17 runs as the `db` service in Docker Compose. The database name, username, and password are read from the root `.env` file.

The PostgreSQL data is stored in the named Docker volume `campusbite_postgres_data`, so it persists when containers are stopped and restarted.

Database schema migrations are managed with Alembic. The backend startup command runs:

```bash
alembic upgrade head
```

Existing migration scripts are located in `backend/alembic/versions/`.

## Backend API Documentation

Once the backend is running, open the interactive Swagger documentation:

```text
http://localhost:8000/docs
```

Alternative ReDoc documentation:

```text
http://localhost:8000/redoc
```

API routers use the `/api/v1` prefix.

Useful health endpoints:

- `GET /` – API welcome and status
- `GET /health` – application health
- `GET /health/database` – database connectivity check

## Security

- Keep `.env` out of version control.
- Use `.env.example` to document required environment variable names and placeholder values.
- Do not publish passwords, JWT secrets, or AI provider API keys.
- Use role-based access controls for protected operations.

## License

Academic capstone project – CampusBite.
