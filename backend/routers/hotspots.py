from fastapi import APIRouter, Request, Query
from typing import Optional

router = APIRouter()

@router.get("/hotspots")
async def get_hotspots(
    request: Request,
    hour: Optional[int] = Query(None, ge=0, le=23, description="Hour of the day (0-23)"),
    top_n: int = Query(20, ge=1, description="Number of top hotspots to return")
):
    """
    Return top hotspot junctions, optionally filtered by hour.
    """
    hourly = request.app.state.hourly
    meta_df = request.app.state.meta_df

    if hour is not None:
        data = hourly[hourly["hour"] == hour]
        sort_col = "violation_count"
    else:
        data = meta_df
        sort_col = "total_violations"

    if data.empty:
        return {"hotspots": [], "hour": hour, "count": 0}

    # Use nlargest to get top N hotspots based on the appropriate count column
    result = (
        data.nlargest(top_n, sort_col)
        .to_dict(orient="records")
    )
    
    return {
        "hotspots": result,
        "hour": hour,
        "count": len(result)
    }

@router.get("/hotspots/all-hours")
async def get_all_hours_hotspots(request: Request):
    """
    Return all hourly hotspots data from hourly_junction_stats.csv.
    """
    hourly = request.app.state.hourly
    result = hourly.to_dict(orient="records")
    return {"hotspots": result}

