from fastapi import APIRouter, Request, Query, HTTPException

router = APIRouter()

@router.get("/hourly-stats")
async def hourly_stats(
    request: Request,
    junction: str = Query(..., description="Junction name (exact string match)")
):
    """
    Return hour-by-hour historical violation counts for a specific junction.
    """
    hourly = request.app.state.hourly

    # Filter hourly stats for the specified junction
    data = hourly[hourly["junction_name"] == junction]
    if data.empty:
        raise HTTPException(status_code=404, detail=f"Junction '{junction}' not found")

    # Sort stats chronologically by hour
    sorted_data = data.sort_values("hour")

    # Select only the relevant fields
    stats_list = sorted_data[["hour", "violation_count"]].to_dict(orient="records")

    return {
        "junction": junction,
        "stats": stats_list
    }
