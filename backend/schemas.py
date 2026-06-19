from pydantic import BaseModel, Field

class PredictionRequest(BaseModel):
    junction: str = Field(..., description="Exact name of the junction")
    hour: int = Field(..., ge=0, le=23, description="Hour of the day (0-23)")
    day_of_week: int = Field(..., ge=0, le=6, description="Day of the week (0=Monday, 6=Sunday)")

class SimulationRequest(BaseModel):
    event_type: str = Field(..., description="Type of event (public_event, procession, vip_movement, protest, construction, none)")
    hour: int = Field(..., ge=0, le=23, description="Hour of the day (0-23)")
    day_of_week: int = Field(..., ge=0, le=6, description="Day of the week (0=Monday, 6=Sunday)")
    top_n: int = Field(10, ge=1, description="Number of top junctions to return in the simulation")
