from fastapi import APIRouter, Request, HTTPException
import pandas as pd
import numpy as np

# Import validation schema
from schemas import PredictionRequest

router = APIRouter()

@router.post("/predict")
async def predict(
    request: Request,
    payload: PredictionRequest
):
    """
    Predict severity score and recommend officer count for a specific junction, hour, and day.
    """
    model = request.app.state.model
    encoder = request.app.state.encoder
    meta_df = request.app.state.meta_df
    features = request.app.state.features

    junction = payload.junction
    hour = payload.hour
    day_of_week = payload.day_of_week

    # Find label encoding for junction name
    try:
        j_enc = int(encoder.transform([junction])[0])
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Junction '{junction}' not found in encoder classes")

    # Retrieve metadata for junction
    j_meta = meta_df[meta_df["junction_name"] == junction]
    if j_meta.empty:
        raise HTTPException(status_code=404, detail=f"No metadata found for junction '{junction}'")

    # Prepare features in the exact same format and order as the XGBoost model training
    feats = {
        "junction_encoded":  j_enc,
        "hour":              hour,
        "day_of_week":       day_of_week,
        "is_weekend":        int(day_of_week >= 5),
        "peak_bucket":       2 if hour <= 6 else (1 if hour >= 19 else 0),
        "main_road_pct":     float(j_meta["main_road_pct"].iloc[0]),
        "footpath_pct":      0.02, # Baseline average
        "near_junction_pct": 0.01, # Baseline average
        "two_wheeler_pct":   0.45, # Baseline average
        "four_wheeler_pct":  0.30, # Baseline average
        "commercial_pct":    0.18, # Baseline average
        "avg_viol_count":    1.2,  # Baseline average
        "is_historic_peak":  0     # Baseline default
    }

    # Create DataFrame and ensure the columns are in the exact order of features
    X = pd.DataFrame([feats])
    X = X[features]

    # Predict severity (model yields log-transformed value log1p)
    try:
        pred_log = model.predict(X)[0]
        severity = float(np.expm1(pred_log))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model inference failed: {str(e)}")

    # Recommended officers: max(1, min(5, round(predicted_severity / 200)))
    recommended_officers = max(1, min(5, round(severity / 200)))

    return {
        "junction": junction,
        "hour": hour,
        "day_of_week": day_of_week,
        "predicted_severity": round(severity, 2),
        "recommended_officers": recommended_officers
    }
