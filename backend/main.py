from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import joblib
import pandas as pd
import json
import os

# Import routers from the local package
from routers import hotspots, predict, plan, simulate, stats

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Use absolute paths relative to main.py to find artifacts
    base_dir = os.path.dirname(os.path.abspath(__file__))
    artifacts_dir = os.path.join(base_dir, "artifacts")
    
    print(f"Loading model and data artifacts from {artifacts_dir}...")
    
    # Load all models and datasets during startup
    app.state.model = joblib.load(os.path.join(artifacts_dir, "model.pkl"))
    app.state.encoder = joblib.load(os.path.join(artifacts_dir, "junction_encoder.pkl"))
    app.state.grid_df = pd.read_csv(os.path.join(artifacts_dir, "enforcement_predictions.csv"))
    app.state.meta_df = pd.read_csv(os.path.join(artifacts_dir, "junction_metadata.csv"))
    app.state.hourly = pd.read_csv(os.path.join(artifacts_dir, "hourly_junction_stats.csv"))
    
    with open(os.path.join(artifacts_dir, "features.json"), "r") as f:
        app.state.features = json.load(f)
        
    with open(os.path.join(artifacts_dir, "event_multipliers.json"), "r") as f:
        app.state.event_multipliers = json.load(f)
        
    print("All artifacts loaded successfully.")
    yield
    # Cleanup on shutdown (if any)
    pass

app = FastAPI(
    title="ParkGuard API",
    description="FastAPI Backend for ParkGuard — AI-Powered Parking Enforcement Intelligence",
    version="1.0",
    lifespan=lifespan
)

# Enable CORS for Next.js frontend calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(hotspots.router)
app.include_router(predict.router)
app.include_router(plan.router)
app.include_router(simulate.router)
app.include_router(stats.router)

@app.get("/")
def root():
    return {
        "status": "ParkGuard API running",
        "version": "1.0",
        "description": "AI-Powered Parking Enforcement Intelligence API"
    }
