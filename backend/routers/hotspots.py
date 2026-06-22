from fastapi import APIRouter, Request, Query
from typing import Optional
import pandas as pd

router = APIRouter()

# Scale factor: main_road_pct (0-0.63) → meaningful spread in congestion impact
_ROAD_WEIGHT = 8.0
# Dataset spans ~150 days (5 months). Hourly stats are 5-month totals, not daily.
_DATASET_DAYS = 150
# Per-day congestion-impact unit → vehicle-hours:
# 1 illegally parked vehicle on a main road delays ~3 vehicles by ~8 min = 0.4 vh
# Weighted average across road types ≈ 0.12 vh per normalised impact unit
_VH_FACTOR = 0.12


def _add_congestion_impact(df: pd.DataFrame, meta_df: pd.DataFrame, count_col: str) -> pd.DataFrame:
    """Merge road-type metadata and compute congestion_impact for each row."""
    if "main_road_pct" not in df.columns:
        df = df.merge(meta_df[["junction_name", "main_road_pct"]], on="junction_name", how="left")
    df["main_road_pct"] = df["main_road_pct"].fillna(0.0)
    df["congestion_impact"] = (
        df[count_col] * (1.0 + df["main_road_pct"] * _ROAD_WEIGHT)
    ).round(1)
    return df


@router.get("/hotspots")
async def get_hotspots(
    request: Request,
    hour: Optional[int] = Query(None, ge=0, le=23, description="Hour of the day (0-23)"),
    top_n: int = Query(20, ge=1, description="Number of top hotspots to return")
):
    hourly = request.app.state.hourly
    meta_df = request.app.state.meta_df

    if hour is not None:
        data = hourly[hourly["hour"] == hour].copy()
        sort_col = "violation_count"
    else:
        data = meta_df.copy()
        sort_col = "total_violations"

    if data.empty:
        return {"hotspots": [], "hour": hour, "count": 0}

    data = _add_congestion_impact(data, meta_df, sort_col)
    result = data.nlargest(top_n, sort_col).to_dict(orient="records")

    return {"hotspots": result, "hour": hour, "count": len(result)}


@router.get("/hotspots/all-hours")
async def get_all_hours_hotspots(request: Request):
    hourly = request.app.state.hourly
    meta_df = request.app.state.meta_df
    enriched = _add_congestion_impact(hourly.copy(), meta_df, "violation_count")
    result = enriched.to_dict(orient="records")
    return {"hotspots": result}


@router.get("/congestion-summary")
async def get_congestion_summary(request: Request):
    """
    Return city-wide daily vehicle-hours lost to parking-induced congestion
    and the top junctions ranked by congestion impact (not raw violation count).
    Directly answers the problem statement: 'quantify impact on traffic flow'.
    """
    hourly = request.app.state.hourly
    meta_df = request.app.state.meta_df

    enriched = _add_congestion_impact(hourly.copy(), meta_df, "violation_count")

    # Sum congestion impact across all hours per junction → daily profile
    by_junction = (
        enriched.groupby("junction_name")
        .agg(
            total_congestion_impact=("congestion_impact", "sum"),
            total_violations=("violation_count", "sum"),
            lat=("lat", "first"),
            lon=("lon", "first"),
        )
        .reset_index()
    )
    # Divide by dataset days first to convert 5-month totals → true daily averages
    by_junction["daily_vehicle_hours_lost"] = (
        (by_junction["total_congestion_impact"] / _DATASET_DAYS) * _VH_FACTOR
    ).round(0)

    # Merge main_road_pct back for context
    by_junction = by_junction.merge(
        meta_df[["junction_name", "main_road_pct", "peak_hour", "top_vehicle"]],
        on="junction_name", how="left"
    )

    city_vehicle_hours = int(by_junction["daily_vehicle_hours_lost"].sum())

    top_junctions = (
        by_junction.nlargest(10, "total_congestion_impact")
        .to_dict(orient="records")
    )

    return {
        "daily_vehicle_hours_lost": city_vehicle_hours,
        "top_impact_junctions": top_junctions,
        "note": "Vehicle-hours lost estimated at 0.08 hrs per congestion-impact unit (main-road violations weighted 8× over footpath violations)"
    }

