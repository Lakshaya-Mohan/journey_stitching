# JourneyIQ — AI-Powered Cross-Channel Customer Journey Intelligence Platform

JourneyIQ stitches together customer touchpoints across channels (Mobile App, Website, Call Center, Branch, ATM, Payment Gateway) into a single AI-powered intelligence platform that reconstructs business journeys, surfaces broken flows, and generates actionable insights.

---

## Project Structure

```
journey_stitching/
├── backend/               # FastAPI + SQLite REST API
│   ├── main.py            # API routes and WebSocket
│   ├── models.py          # SQLAlchemy models
│   ├── schemas.py         # Pydantic schemas
│   ├── crud.py            # Database operations
│   ├── journey_stitcher.py# Journey reconstruction + AI insight engine
│   ├── seed.py            # Database seeding script
│   ├── database.py        # DB connection
│   └── requirements.txt   # Python dependencies
└── frontend/              # Next.js (React) web app
    └── src/app/           # Pages: dashboard, customers, timeline, incidents, alerts
```

---

## Prerequisites

- **Python 3.10+**
- **Node.js 18+** and **npm**

---

## Backend Setup

### 1. Create a virtual environment

```bash
cd backend
python -m venv venv
```

### 2. Activate the virtual environment

**Windows (CMD):**
```cmd
venv\Scripts\activate
```

**Windows (PowerShell):**
```powershell
venv\Scripts\Activate.ps1
```

> If you get an execution policy error in PowerShell, run:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```
> Then retry the activate command.

**macOS / Linux:**
```bash
source venv/bin/activate
```

You'll see `(venv)` prepended to your shell prompt when active.

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Seed the database

Populates `journeyiq.db` with 100 sample customers, journey events, and incidents.

```bash
python seed.py
```

### 5. Start the API server

```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

### Deactivate the virtual environment

When you're done:
```bash
deactivate
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/customers` | List all customers |
| GET | `/api/customers/{id}` | Get a single customer with events |
| GET | `/api/events` | List journey events |
| GET | `/api/incidents` | List incidents |
| PUT | `/api/incidents/{id}/status` | Update incident status |
| GET | `/api/journey/{id}/stitched` | Reconstructed business journey with AI insights |
| GET | `/api/dashboard/kpis` | Dashboard KPI summary |
| WS  | `/ws/alerts` | Real-time live alert stream (WebSocket) |

---

## Frontend Setup

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Start the development server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

> The frontend expects the backend running at `http://localhost:8000`.

### Other commands

```bash
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # Run ESLint
```

---

## Running Everything Together

Open two terminals:

**Terminal 1 — Backend:**
```cmd
cd backend
venv\Scripts\activate
uvicorn main:app --reload
```

**Terminal 2 — Frontend:**
```cmd
cd frontend
npm run dev
```

Open `http://localhost:3000` in your browser.

> **Important:** If you update `main.py`, uvicorn will hot-reload automatically when `--reload` is set. If you add a new route and still see 404s, stop uvicorn and restart it.

---

## Resetting the Database

To wipe and re-seed all data:

```bash
cd backend
venv\Scripts\activate      # or source venv/bin/activate on macOS/Linux
python seed.py
```

The SQLite database file (`journeyiq.db`) is excluded from version control via `.gitignore`. Every developer seeds their own local copy.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Charts | Recharts |
| Animations | Framer Motion |
| Data fetching | TanStack React Query + Axios |
| Backend | FastAPI (Python) |
| Database | SQLite via SQLAlchemy |
| Real-time | WebSocket |
| Theme | next-themes (light/dark) |
