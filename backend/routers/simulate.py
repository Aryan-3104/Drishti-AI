from fastapi import APIRouter, Request, HTTPException

# Import validation schema
from schemas import SimulationRequest

router = APIRouter()

@router.post("/simulate")
async def simulate(
    request: Request,
    payload: SimulationRequest
):
    """
    Simulate enforcement needs for a given event type, hour, and day of week.
    Multipliers are dynamically applied to baseline predicted severities.
    """
    grid_df = request.app.state.grid_df
    meta_df = request.app.state.meta_df
    event_multipliers = request.app.state.event_multipliers

    event_type = payload.event_type
    hour = payload.hour
    day_of_week = payload.day_of_week
    top_n = payload.top_n

    # Retrieve multiplier based on event type
    multiplier = event_multipliers.get(event_type)
    if multiplier is None:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid event_type '{event_type}'. Valid options are: {list(event_multipliers.keys())}"
        )

    # Filter precomputed grid to the specified slot
    subset = grid_df[
        (grid_df["hour"] == hour) &
        (grid_df["day_of_week"] == day_of_week)
    ].copy()

    if subset.empty:
        return {
            "event_type": event_type,
            "multiplier": multiplier,
            "hour": hour,
            "day_of_week": day_of_week,
            "results": []
        }

    # Compute adjusted severity and recommended officer count
    subset["adjusted_severity"] = (subset["predicted_severity"] * multiplier).round(2)
    subset["recommended_officers"] = (subset["adjusted_severity"] / 14).apply(
        lambda x: max(1, min(5, round(x)))
    )

    # Sort and pick top N
    top_subset = subset.nlargest(top_n, "adjusted_severity")

    # Merge with coordinate data
    result = (
        top_subset.merge(meta_df[["junction_name", "lat", "lon"]], on="junction_name", how="left")
        [["junction_name", "adjusted_severity", "recommended_officers", "lat", "lon"]]
        .to_dict(orient="records")
    )

    return {
        "event_type": event_type,
        "multiplier": multiplier,
        "hour": hour,
        "day_of_week": day_of_week,
        "results": result
    }
