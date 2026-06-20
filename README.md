# Drishti AI — AI-Powered Parking Enforcement Intelligence

**Drishti AI** (दृष्टि — *vision*) is an AI-powered decision support system built for the Bengaluru Traffic Police, developed for the **Flipkart Gridlock Hackathon 2.0**. It transforms 5 months of GPS-tagged parking violation data into a live, predictive intelligence layer — telling commanders exactly where to send officers, when, and how many, before violations happen.

---

## Repository Structure

```
Flipkart-gridLock/
├── backend/
│   ├── artifacts/                  # ML models & precomputed data
│   │   ├── model.pkl               # Trained XGBoost model
│   │   ├── junction_encoder.pkl    # LabelEncoder for junctions
│   │   ├── enforcement_predictions.csv
│   │   ├── junction_metadata.csv
│   │   ├── hourly_junction_stats.csv
│   │   ├── features.json
│   │   └── event_multipliers.json
│   ├── routers/                    # FastAPI route handlers
│   │   ├── hotspots.py             # GET /hotspots
│   │   ├── plan.py                 # GET /plan
│   │   ├── predict.py              # POST /predict
│   │   ├── simulate.py             # POST /simulate
│   │   └── stats.py                # GET /hourly-stats
│   ├── main.py                     # Entry point & lifespan config
│   ├── schemas.py                  # Pydantic request models
│   └── requirements.txt
├── frontend/                       # Next.js 16 Dashboard
│   ├── app/                        # App Router pages
│   ├── components/                 # UI components (maps, charts, forms)
│   └── lib/                        # API helpers & types
└── gridlock_solution_doc.md        # Full solution documentation
```

---

## Backend Setup (FastAPI)

### Prerequisites
- **Python 3.11** (recommended — 3.12+ may fail to install `xgboost`/`scikit-learn` on Windows)

### Steps

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment:**
   ```bash
   # Windows
   py -3.11 -m venv .venv

   # macOS/Linux
   python3.11 -m venv .venv
   ```

3. **Activate it:**
   ```bash
   # Windows PowerShell
   .\.venv\Scripts\Activate.ps1

   # Windows CMD
   .\.venv\Scripts\activate.bat

   # macOS/Linux
   source .venv/bin/activate
   ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Start the server:**
   ```bash
   uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```

---

## Frontend Setup (Next.js)

### Prerequisites
- **Node.js** v18+
- **npm** v9+

### Steps

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Create a `.env.local` file:**
   ```bash
   NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
   ```

3. **Install packages:**
   ```bash
   npm install --legacy-peer-deps
   ```

4. **Start the dev server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build for production:**
   ```bash
   npm run build
   ```

---

## API Endpoints

### GET `/`
Health check.
```json
{
  "status": "Drishti AI API running",
  "version": "1.0"
}
```

### GET `/hotspots`
Returns top violation junctions, optionally filtered by hour.
- `hour` (optional, 0–23)
- `top_n` (optional, default: 20)

### GET `/plan`
Weekly enforcement calendar with officer count recommendations.
- `day_of_week` (optional, 0=Monday … 6=Sunday)
- `top_n` (optional, default: 10)

### POST `/predict`
XGBoost severity prediction for a junction and time slot.
```json
{ "junction": "BTP051 - Safina Plaza Junction", "hour": 5, "day_of_week": 0 }
```

### POST `/simulate`
Event impact simulation — adjusts severity based on event type multiplier.
```json
{ "event_type": "public_event", "hour": 21, "day_of_week": 6, "top_n": 3 }
```
Supported event types: `public_event` (1.35×), `procession` (1.28×), `vip_movement` (1.20×), `protest` (1.15×), `construction` (1.10×)

### GET `/hourly-stats`
24-hour historical violation counts for a junction (used by the chart).
- `junction` (required, exact name)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI, Python 3.11, Uvicorn |
| ML Model | XGBoost, scikit-learn, joblib |
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Maps | Leaflet + React Leaflet |
| Charts | Recharts |
| Icons | Lucide React |

---

## Data Facts

- **298,450** GPS-tagged violations across **168 junctions** over 5 months
- Peak hours: **02:00–06:00** (night commercial) · secondary: **19:00–23:00**
- Top hotspot: **Safina Plaza Junction** — 8,785 violations (5.2% citywide)
- Officer formula: `max(1, min(5, round(severity / 200)))`
