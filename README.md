# Drishti AI — AI-Powered Parking Enforcement Intelligence (FastAPI Backend)

This is the FastAPI backend repository for **Drishti AI**, designed for the Flipkart Gridlock Hackathon 2.0. The system leverages 5 months of Bengaluru traffic violation data and a trained XGBoost model to provide predictive deployment calendar recommendations, hotspot maps, and event-based parking congestion simulators.

---

## Repository Structure

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

## Backend Setup (FastAPI)

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

## 🔌 API Endpoints Reference

### 1. GET `/`
* **Description**: Server health check.
* **Response**:
  ```json
  {
      "status": "Drishti AI API running",
      "version": "1.0",
      "description": "AI-Powered Parking Enforcement Intelligence API"
  }
  ```

### 2. GET `/hotspots`
* **Description**: Returns top hotspot junctions, optionally filtered by hour of day.
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

## Core ML & Deployment Logic
1. **Historical Profiling**: GPS-tagged parking violations are aggregated hourly to find peak traffic hours and identify patterns based on day-of-week and junction road profiles.
2. **AI Scoring**: The XGBoost regression model takes temporal variables, junction details, and road types to output a predicted parking congestion severity score.
3. **Police Staffing Allocation**: To help dispatch units efficiently, severity scores are mapped to recommended officer counts via:
   $$\text{Staffing} = \text{max}\left(1, \text{min}\left(5, \text{round}\left(\frac{\text{Severity}}{200}\right)\right)\right)$$
   This ensures optimal resource coverage, capping dispatch at 5 officers per hotspot.
