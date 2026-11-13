"""
FitPulse Pro — Backend Python / FastAPI Pronto para Migração & Integração Supabase
Execute localmente com:
  pip install fastapi uvicorn pydantic
  uvicorn backend_fastapi_app:app --reload --port 8000
"""

from datetime import datetime
from pathlib import Path
import json
from typing import Any, Dict, List, Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="FitPulse Pro API (Python/FastAPI)",
    description="Backend para persistência e migração dos dados de Nutrição, Treino PPL e Bioimpedância Zepp Life.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_FILE = Path(__file__).parent / "fitpulse_local_db.json"


class SyncPayload(BaseModel):
    selectedDate: str
    profile: Dict[str, Any]
    foodsByDate: Dict[str, List[Dict[str, Any]]]
    habitsByDate: Dict[str, Dict[str, Any]]
    workoutPlans: List[Dict[str, Any]]
    checkins: List[Dict[str, Any]]
    syncConfig: Optional[Dict[str, Any]] = None


@app.get("/api/v1/health")
async def health_check():
    return {"status": "online", "timestamp": datetime.utcnow().isoformat()}


@app.post("/api/v1/sync")
async def sync_fitpulse_state(payload: SyncPayload):
    data = payload.model_dump()
    data["server_synced_at"] = datetime.utcnow().isoformat()
    DB_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return {
        "status": "synced",
        "selectedDate": payload.selectedDate,
        "server_synced_at": data["server_synced_at"],
    }


@app.get("/api/v1/state")
async def get_fitpulse_state():
    if DB_FILE.exists():
        return json.loads(DB_FILE.read_text(encoding="utf-8"))
    return {"status": "empty"}
