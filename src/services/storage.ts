import { AppState } from '../types';
import {
  INITIAL_USER_PROFILE,
  INITIAL_WORKOUT_PLANS,
  INITIAL_CHECKINS,
  INITIAL_CARDIO_ACTIVITIES,
} from '../data/initialData';

export const STORAGE_KEY = 'fitpulse_pro_state_v3';

export function getTodayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function loadInitialState(): AppState {
  const today = getTodayIso();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      return {
        profile: { ...INITIAL_USER_PROFILE, ...(parsed.profile || {}) },
        selectedDate: parsed.selectedDate || today,
        foodsByDate: parsed.foodsByDate || {},
        habitsByDate: parsed.habitsByDate || {},
        activitiesByDate: parsed.activitiesByDate || {
          [today]: INITIAL_CARDIO_ACTIVITIES.slice(0, 1).map((a) => ({ ...a, date: today })),
        },
        workoutPlans:
          Array.isArray(parsed.workoutPlans) && parsed.workoutPlans.length > 0
            ? parsed.workoutPlans
            : INITIAL_WORKOUT_PLANS,
        checkins:
          Array.isArray(parsed.checkins) && parsed.checkins.length > 0
            ? parsed.checkins
            : INITIAL_CHECKINS,
        syncConfig: parsed.syncConfig || {
          provider: 'local',
          supabaseUrl: '',
          supabaseAnonKey: '',
          fastApiUrl: 'http://localhost:8000/api/v1/sync',
          geminiApiKey: '',
          lastSyncedAt: null,
        },
      };
    }
  } catch (err) {
    console.warn('Falha ao carregar estado salvo localmente, usando dados iniciais:', err);
  }

  return {
    profile: INITIAL_USER_PROFILE,
    selectedDate: today,
    foodsByDate: {
      [today]: [
        {
          id: 'seed_breakfast_1',
          name: 'Pão Integral (2 fatias)',
          portionLabel: '50g (2 fatias)',
          grams: 50,
          calories: 126,
          protein: 6.4,
          carbs: 21.0,
          fat: 1.8,
          source: 'quick',
          timestamp: '09:05',
          mealWindow: 'breakfast',
        },
        {
          id: 'seed_breakfast_2',
          name: 'Ovos Mexidos (3 unid.)',
          portionLabel: '150g (3 ovos)',
          grams: 150,
          calories: 235,
          protein: 19.5,
          carbs: 1.8,
          fat: 16.5,
          source: 'quick',
          timestamp: '09:05',
          mealWindow: 'breakfast',
        },
        {
          id: 'seed_breakfast_3',
          name: 'Dose de Creatina com Suco',
          portionLabel: '5g Creatina + 200ml Suco',
          grams: 205,
          calories: 92,
          protein: 0.5,
          carbs: 22.0,
          fat: 0.0,
          source: 'quick',
          timestamp: '09:10',
          mealWindow: 'breakfast',
        },
      ],
    },
    habitsByDate: {
      [today]: {
        date: today,
        waterCups250ml: 6,
        steps: 5400,
        postWorkoutCardio: true,
        cardioMinutes: 25,
        machineAbs: true,
        activeWorkoutDayId: 'monday_push_a',
      },
    },
    activitiesByDate: {
      [today]: [
        {
          id: 'act_seed_today',
          type: 'Esteira',
          date: today,
          timeMinutes: 25,
          distanceKm: 3.5,
          caloriesBurned: 270,
          timestamp: '18:40',
          notes: 'Corrida pós-treino na esteira com inclinação leve',
        },
      ],
      '2026-09-17': [
        {
          id: 'act_seed_17',
          type: 'Esteira',
          date: '2026-09-17',
          timeMinutes: 25,
          distanceKm: 3.4,
          caloriesBurned: 270,
          timestamp: '18:45',
          notes: 'Corrida pós-treino na esteira',
        },
      ],
      '2026-09-16': [
        {
          id: 'act_seed_16',
          type: 'Handebol',
          date: '2026-09-16',
          timeMinutes: 50,
          caloriesBurned: 520,
          timestamp: '20:10',
          notes: 'Treino tático e coletivo de handebol',
        },
      ],
      '2026-09-14': [
        {
          id: 'act_seed_14',
          type: 'Corrida no Parque',
          date: '2026-09-14',
          timeMinutes: 32,
          distanceKm: 5.1,
          caloriesBurned: 395,
          timestamp: '07:30',
          notes: 'Corrida matinal contínua no parque',
        },
      ],
    },
    workoutPlans: INITIAL_WORKOUT_PLANS,
    checkins: INITIAL_CHECKINS,
    syncConfig: {
      provider: 'local',
      supabaseUrl: '',
      supabaseAnonKey: '',
      fastApiUrl: 'http://localhost:8000/api/v1/sync',
      geminiApiKey: '',
      lastSyncedAt: null,
    },
  };
}

export function saveStateToLocal(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Erro ao salvar estado no localStorage:', err);
  }
}

export async function syncWithRemoteBackend(
  state: AppState
): Promise<{ ok: boolean; message: string; timestamp?: string }> {
  const { syncConfig } = state;
  const nowIso = new Date().toLocaleString('pt-BR');

  if (syncConfig.provider === 'supabase') {
    if (!syncConfig.supabaseUrl || !syncConfig.supabaseAnonKey) {
      return {
        ok: false,
        message: 'Informe a URL e a Anon Key do projeto Supabase para sincronizar na nuvem.',
      };
    }
    try {
      const url = `${syncConfig.supabaseUrl.replace(/\/$/, '')}/rest/v1/fitpulse_snapshots`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: syncConfig.supabaseAnonKey,
          Authorization: `Bearer ${syncConfig.supabaseAnonKey}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          recorded_date: state.selectedDate,
          payload: state,
          updated_at: new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        throw new Error(`Status HTTP ${res.status}`);
      }
      return {
        ok: true,
        message: 'Dados sincronizados com sucesso no Supabase!',
        timestamp: nowIso,
      };
    } catch (err: any) {
      return {
        ok: false,
        message: `Falha ao conectar ao Supabase (${err?.message || 'Verifique a tabela fitpulse_snapshots'}). Os dados seguem seguros no dispositivo.`,
      };
    }
  }

  if (syncConfig.provider === 'fastapi') {
    if (!syncConfig.fastApiUrl) {
      return {
        ok: false,
        message: 'Informe o endpoint do backend Python/FastAPI.',
      };
    }
    try {
      const res = await fetch(syncConfig.fastApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      });
      if (!res.ok) {
        throw new Error(`Status HTTP ${res.status}`);
      }
      return {
        ok: true,
        message: 'Snapshot enviado com sucesso para a API Python/FastAPI!',
        timestamp: nowIso,
      };
    } catch (err: any) {
      return {
        ok: false,
        message: `Servidor FastAPI offline (${err?.message || 'Conexão recusada'}). Persistência local ativa.`,
      };
    }
  }

  return {
    ok: true,
    message: 'Estado salvo localmente (Local PWA Storage pronto para migração).',
    timestamp: nowIso,
  };
}

export const SUPABASE_AND_FASTAPI_BLUEPRINT = `-- ==========================================================
-- 1. SCHEMA SQL PARA SUPABASE (PostgreSQL + RLS)
-- ==========================================================
create table if not exists public.fitpulse_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid(),
  recorded_date date not null,
  payload jsonb not null,
  updated_at timestamptz default now()
);

-- ==========================================================
-- 2. ENDPOINT PYTHON / FASTAPI PRONTO PARA MIGRAÇÃO
-- ==========================================================
# main.py (FastAPI + Pydantic v2)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List

app = FastAPI(title="FitPulse Pro API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class SyncPayload(BaseModel):
    selectedDate: str
    profile: Dict[str, Any]
    foodsByDate: Dict[str, List[Dict[str, Any]]]
    habitsByDate: Dict[str, Dict[str, Any]]
    activitiesByDate: Dict[str, List[Dict[str, Any]]]
    workoutPlans: List[Dict[str, Any]]
    checkins: List[Dict[str, Any]]

@app.post("/api/v1/sync")
async def sync_state(data: SyncPayload):
    return {"status": "synced", "date": data.selectedDate}
`;
