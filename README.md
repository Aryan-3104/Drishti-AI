# ParkGuard — AI-Powered Parking Enforcement Intelligence (FastAPI Backend)

This is the FastAPI backend repository for **ParkGuard**, designed for the Flipkart Gridlock Hackathon 2.0. The system leverages 5 months of Bengaluru traffic violation data and a trained XGBoost model to provide predictive deployment calendar recommendations, hotspot maps, and event-based parking congestion simulators.

---

## 📁 Repository Structure

```
Flipkart/
├── backend/
│   ├── .venv/                      # Python 3.11 Virtual Environment
│   ├── artifacts/                  # Localized ML & Data files
│   │   ├── model.pkl               # Trained XGBoost v3
│   │   ├── junction_encoder.pkl    # LabelEncoder for junctions
│   │   ├── enforcement_predictions.csv
│   │   ├── junction_metadata.csv
│   │   ├── hourly_junction_stats.csv
│   │   ├── features.json
│   │   └── event_multipliers.json
│   ├── routers/                    # FastAPI Endpoints
│   │   ├── hotspots.py             # GET /hotspots
│   │   ├── plan.py                 # GET /plan (Weekly calendar planner)
│   │   ├── predict.py              # POST /predict (XGBoost prediction)
│   │   ├── simulate.py             # POST /simulate (Event simulator)
│   │   └── stats.py                # GET /hourly-stats (UI Chart statistics)
│   ├── main.py                     # Entry point & lifespan configuration
│   ├── schemas.py                  # Pydantic request models
│   └── requirements.txt            # Python dependencies
├── frontend/                       # Next.js 15 Dashboard Frontend Client
│   ├── README.md                   # Frontend setup & guide
│   ├── app/                        # App Router Screens (dashboard, heatmap, plan, simulate)
│   ├── components/                 # UI Components (maps, charts, forms)
│   └── lib/                        # API helpers and types
├── gridlock_hackathon/             # Shared raw ML artifacts folder
├── gridlock_ml_pipeline_v2.ipynb   # Google Colab ML Training Notebook
└── gridlock_solution_doc.md        # Solution & build documentation
```

---

## ⚙️ Setup & Installation

### Prerequisites
* **Python 3.11** (Highly recommended. Python 3.12+ or 3.14+ might fail to download pre-compiled packages like `xgboost` or `scikit-learn` on Windows, causing compile errors).

### Steps

1. **Navigate to the Backend Directory**:
   ```bash
   cd backend
   ```

2. **Create a Virtual Environment**:
   ```bash
   # Windows (using Python launcher)
   py -3.11 -m venv .venv
   
   # macOS/Linux
   python3.11 -m venv .venv
   ```

3. **Activate the Virtual Environment**:
   ```bash
   # Windows PowerShell
   .\.venv\Scripts\Activate.ps1
   
   # Windows Command Prompt
   .\.venv\Scripts\activate.bat
   
   # macOS/Linux
   source .venv/bin/activate
   ```

4. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Run the FastAPI server**:
   ```bash
   uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```

---

## 🔌 API Endpoints Reference

### 1. GET `/`
* **Description**: Server health check.
* **Response**:
  ```json
  {
      "status": "ParkGuard API running",
      "version": "1.0",
      "description": "AI-Powered Parking Enforcement Intelligence API"
  }
  ```

### 2. GET `/hotspots`
* **Description**: Returns top hotspot junctions, optionally filtered by hour of day.
* **Query Parameters**:
  * `hour` (optional, integer: 0-23)
  * `top_n` (optional, integer, default: 20)
* **Response Example**:
  ```json
  {
      "hotspots": [
          {
              "junction_name": "BTP051 - Safina Plaza Junction",
              "total_violations": 8785,
              "lat": 12.98122,
              "lon": 77.60871,
              "peak_hour": 5,
              "top_vehicle": "SCOOTER",
              "main_road_pct": 0.0202
          }
      ],
      "hour": null,
      "count": 1
  }
  ```

### 3. GET `/plan`
* **Description**: Returns weekly calendar data with officer count recommendations.
* **Query Parameters**:
  * `day_of_week` (optional, integer: 0-6, where 0=Monday, 6=Sunday). If omitted, returns plans for all 7 days of the week.
  * `top_n` (optional, integer, default: 10)
* **Response Example (with `day_of_week=6`)**:
  ```json
  {
      "day_of_week": 6,
      "plan": [
          {
              "junction_name": "BTP189 - New Diagonal Road, Jayanagar",
              "predicted_severity": 64.34,
              "lat": 12.92813,
              "lon": 77.58067,
              "peak_hour": 3,
              "top_vehicle": "SCOOTER",
              "recommended_officers": 1
          }
      ]
  }
  ```

### 4. POST `/predict`
* **Description**: Dynamically calculates violation severity and recommended officer count for a specific junction and time slot using the loaded XGBoost model.
* **Request Body**:
  ```json
  {
      "junction": "BTP051 - Safina Plaza Junction",
      "hour": 5,
      "day_of_week": 0
  }
  ```
* **Response Example**:
  ```json
  {
      "junction": "BTP051 - Safina Plaza Junction",
      "hour": 5,
      "day_of_week": 0,
      "predicted_severity": 1.87,
      "recommended_officers": 1
  }
  ```

### 5. POST `/simulate`
* **Description**: Simulates the effect of an event ( VIP movement, procession, public rally) on parking violations and suggests preemptive deployment.
* **Request Body**:
  ```json
  {
      "event_type": "public_event",
      "hour": 21,
      "day_of_week": 6,
      "top_n": 3
  }
  ```
* **Response Example**:
  ```json
  {
      "event_type": "public_event",
      "multiplier": 1.35,
      "hour": 21,
      "day_of_week": 6,
      "results": [
          {
              "junction_name": "BTP189 - New Diagonal Road, Jayanagar",
              "adjusted_severity": 72.58,
              "recommended_officers": 1,
              "lat": 12.92813,
              "lon": 77.58067
          }
      ]
  }
  ```

### 6. GET `/hourly-stats`
* **Description**: Returns 24-hour historical statistics for visual charts.
* **Query Parameters**:
  * `junction` (required, string, exact match)
* **Response Example**:
  ```json
  {
      "junction": "BTP051 - Safina Plaza Junction",
      "stats": [
          {
              "hour": 0.0,
              "violation_count": 416
          },
          {
              "hour": 1.0,
              "violation_count": 401
          }
      ]
  }
  ```
