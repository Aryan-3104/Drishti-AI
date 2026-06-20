# ParkGuard — AI-Powered Parking Enforcement Command Center

**ParkGuard** is an advanced operational intelligence platform designed for the Flipkart Gridlock Hackathon 2.0. By profiling 5 months of Bengaluru traffic violation data (~300,000 GPS-tagged records), ParkGuard uses an **XGBoost machine learning model** to predict parking-induced congestion severity and recommend police officer deployment schedules across 168 junctions.

The system features:
1. **Interactive Spatial Heatmaps**: Zero-latency, client-side linear interpolation of violation counts across a 24-hour continuous time slider.
2. **Predictive Enforcement Calendars**: Daily ranked lists of active hotspots with recommended officer counts.
3. **What-If Scenario Simulators**: Projections of public rallies, VIP transits, or road works to dynamically pre-position resources.

---

## 📁 Repository Structure

```
Flipkart/
├── backend/                       # FastAPI Backend Service
│   ├── artifacts/                 # Localized ML models & pre-computed datasets
│   │   ├── model.pkl              # Trained XGBoost regression model
│   │   ├── junction_encoder.pkl   # LabelEncoder mapping junctions
│   │   ├── hourly_junction_stats.csv
│   │   ├── junction_metadata.csv
│   │   └── enforcement_predictions.csv
│   ├── routers/                   # Endpoint routers (hotspots, plan, predict, simulate)
│   ├── main.py                    # Lifespan handlers and App entry point
│   ├── requirements.txt           # Python packages list
│   └── schemas.py                 # Pydantic schemas
├── frontend/                      # Next.js 15 Client (Turbopack, TypeScript, Tailwind)
│   ├── app/                       # Page layouts, sub-views, and App router
│   ├── components/                # Interactive charts, Leaflet maps, and forms
│   ├── lib/                       # Types and fetch API client wrapper
│   └── public/                    # Assets and static icons
├── gridlock_ml_pipeline_v2.ipynb  # Jupyter notebook for XGBoost training
└── gridlock_solution_doc.md       # Solution and architecture reference doc
```

---

## ⚙️ Backend Setup (FastAPI)

### Prerequisites
* **Python 3.11** (recommended to ensure pre-compiled packages install correctly on Windows).

### Setup Instructions
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1

   # macOS/Linux
   python3 -m venv .venv
   source .venv/bin/activate
   ```
3. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI development server:
   ```bash
   uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```
   The backend API docs will be available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

---

## 💻 Frontend Setup (Next.js)

### Prerequisites
* **Node.js** (v18.0.0 or higher)
* **npm** (v9.0.0 or higher)

### Setup Instructions
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Set up environment configuration:
   Verify or create a `.env.local` file in the `frontend/` directory with the backend endpoint:
   ```env
   NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
   ```
3. Install frontend dependencies (bypassing React 19 warnings):
   ```bash
   npm install --legacy-peer-deps
   ```
4. Spin up the development server:
   ```bash
   npm run dev
   ```
5. Open **[http://localhost:3000](http://localhost:3000)** in your browser to interact with the command center.

---

## 🔌 API Reference Guide

### 1. GET `/hotspots`
* **Description**: Returns the top hotspot junctions, optionally filtered by hour.
* **Query Parameters**:
  * `hour` (integer: 0–23, optional)
  * `top_n` (integer, default: 20)

### 2. GET `/hotspots/all-hours`
* **Description**: Fetches all 2,106 records of hourly stats for all junctions to enable client-side map rendering.

### 3. GET `/plan`
* **Description**: Outputs weekday deployment rosters and recommended officer deployment counts.
* **Query Parameters**:
  * `day_of_week` (integer: 0–6, optional)
  * `top_n` (integer, default: 10)

### 4. POST `/predict`
* **Description**: Queries the XGBoost model dynamically to fetch predictions for any junction at a given hour.
* **Request Body**:
  ```json
  { "junction": "BTP051 - Safina Plaza Junction", "hour": 5, "day_of_week": 0 }
  ```

### 5. POST `/simulate`
* **Description**: Evaluates dynamic event scenarios (rallies, VIP transits) and projects adjusted staffing requirements.
* **Request Body**:
  ```json
  { "event_type": "public_event", "hour": 21, "day_of_week": 6, "top_n": 5 }
  ```

### 6. GET `/hourly-stats`
* **Description**: Returns 24-hour historical records for a selected junction to render graphs.

---

## 🔬 Core ML & Deployment Logic
1. **Historical Profiling**: GPS-tagged parking violations are aggregated hourly to find peak traffic hours and identify patterns based on day-of-week and junction road profiles.
2. **AI Scoring**: The XGBoost regression model takes temporal variables, junction details, and road types to output a predicted parking congestion severity score.
3. **Police Staffing Allocation**: To help dispatch units efficiently, severity scores are mapped to recommended officer counts via:
   $$\text{Staffing} = \text{max}\left(1, \text{min}\left(5, \text{round}\left(\frac{\text{Severity}}{200}\right)\right)\right)$$
   This ensures optimal resource coverage, capping dispatch at 5 officers per hotspot.
