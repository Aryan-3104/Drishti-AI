from fastapi import APIRouter, Request, Query
from typing import Optional

router = APIRouter()

def get_plan_for_day(grid_df, meta_df, day_of_week: int, top_n: int = 10):
    # Filter precomputed grid by day of week
    day_grid = grid_df[grid_df["day_of_week"] == day_of_week]
    if day_grid.empty:
        return []

    # Group by junction, find the max severity across hours, and select top N
    best = (
        day_grid.groupby("junction_name")["predicted_severity"]
        .max()
        .nlargest(top_n)
        .reset_index()
    )

    # Merge with junction metadata coordinates and stats
    best = best.merge(
        meta_df[["junction_name", "lat", "lon", "peak_hour", "top_vehicle"]],
        on="junction_name",
        how="left"
    )

    # Calculate officer count recommendation
    best["recommended_officers"] = (best["predicted_severity"] / 14).apply(
        lambda x: max(1, min(5, round(x)))
    )

    # Convert peak_hour to integer if not null
    if "peak_hour" in best.columns:
        best["peak_hour"] = best["peak_hour"].fillna(0).astype(int)

    return best.to_dict(orient="records")

@router.get("/plan")
async def get_plan(
    request: Request,
    day_of_week: Optional[int] = Query(None, ge=0, le=6, description="Day of week (0=Monday, 6=Sunday). If not specified, returns plans for all days."),
    top_n: int = Query(10, ge=1, description="Number of top junctions to return per plan")
):
    """
    Return ranked enforcement deployment plans.
    If day_of_week is specified, returns a single day's plan.
    If day_of_week is not specified, returns plans for all 7 days of the week.
    """
    grid_df = request.app.state.grid_df
    meta_df = request.app.state.meta_df

    if day_of_week is not None:
        plan_data = get_plan_for_day(grid_df, meta_df, day_of_week, top_n)
        return {
            "day_of_week": day_of_week,
            "plan": plan_data
        }
    else:
        # Generate plans for all 7 days
        weekly_plan = {}
        for d in range(7):
            weekly_plan[d] = get_plan_for_day(grid_df, meta_df, d, top_n)
        return {
            "weekly_plan": weekly_plan
        }
