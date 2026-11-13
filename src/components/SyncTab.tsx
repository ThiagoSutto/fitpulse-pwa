import React, { useState } from 'react';
import {
  Cloud,
  Database,
  Server,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Code2,
} from 'lucide-react';
import { AppState, SyncConfiguration } from '../types';
import {
  syncWithRemoteBackend,
  SUPABASE_AND_FASTAPI_BLUEPRINT,
} from '../services/storage';

interface SyncTabProps {
  state: AppState;
  onUpdateSyncConfig: (cfg: Partial<SyncConfiguration>) => void;
  onResetAllData: () => void;
}

export const SyncTab: React.FC<SyncTabProps> = ({
  state,
  onUpdateSyncConfig,
  onResetAllData,
}) => {
  const { syncConfig } = state;
  const [syncStatus, setSyncStatus] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showBlueprint, setShowBlueprint] = useState(false);

  const handleRunSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    const res = await syncWithRemoteBackend(state);
    setSyncStatus(res);
    if (res.timestamp) {
      onUpdateSyncConfig({ lastSyncedAt: res.timestamp });
    }
    setIsSyncing(false);
  };

  const handleDownloadJsonBackup = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitpulse-backup-${state.selectedDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 pb-6">
      {/* 1. PROVEDOR DE PERSISTÊNCIA */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
        <div className="flex items-center gap-2.5 mb-2">
          <Cloud className="h-5 w-5 text-emerald-400" />
          <div>
            <h2 className="text-sm font-bold text-white">
              Arquitetura Híbrida: LocalFirst + Supabase / Python FastAPI
            </h2>
            <p className="text-xs text-slate-400">
              Seus dados ficam salvos offline instantaneamente no PWA e podem sincronizar com Supabase ou FastAPI.
            </p>
          </div>
        </div>

        <form onSubmit={handleRunSync} className="mt-4 space-y-3">
          <fieldset>
            <legend className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Provedor de Persistência Ativo
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'local', label: 'Local PWA', icon: Database },
                  { id: 'supabase', label: 'Supabase Cloud', icon: Cloud },
                  { id: 'fastapi', label: 'Python FastAPI', icon: Server },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                const active = syncConfig.provider === item.id;
                return (
                  <label
                    key={item.id}
                    className={`touch-target flex flex-col items-center justify-center gap-1 rounded-xl border p-3 text-center text-xs font-bold transition cursor-pointer ${
                      active
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="provider"
                      value={item.id}
                      checked={active}
                      onChange={() => onUpdateSyncConfig({ provider: item.id })}
                      className="sr-only"
                    />
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {syncConfig.provider === 'supabase' && (
            <div className="space-y-2.5 rounded-xl border border-slate-800 bg-slate-950 p-3">
              <div>
                <label
                  htmlFor="supa-url"
                  className="block text-[11px] font-semibold text-slate-300 mb-1"
                >
                  Supabase Project URL
                </label>
                <input
                  id="supa-url"
                  name="supabaseUrl"
                  type="url"
                  value={syncConfig.supabaseUrl}
                  onChange={(e) =>
                    onUpdateSyncConfig({ supabaseUrl: e.target.value })
                  }
                  placeholder="https://xyzcompany.supabase.co"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-base text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="supa-key"
                  className="block text-[11px] font-semibold text-slate-300 mb-1"
                >
                  Supabase Anon / Public Key
                </label>
                <input
                  id="supa-key"
                  name="supabaseAnonKey"
                  type="password"
                  value={syncConfig.supabaseAnonKey}
                  onChange={(e) =>
                    onUpdateSyncConfig({ supabaseAnonKey: e.target.value })
                  }
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..."
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-base text-white"
                />
              </div>
            </div>
          )}

          {syncConfig.provider === 'fastapi' && (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
              <label
                htmlFor="fastapi-url"
                className="block text-[11px] font-semibold text-slate-300 mb-1"
              >
                Endpoint Backend Python / FastAPI
              </label>
              <input
                id="fastapi-url"
                name="fastApiUrl"
                type="url"
                value={syncConfig.fastApiUrl}
                onChange={(e) =>
                  onUpdateSyncConfig({ fastApiUrl: e.target.value })
                }
                placeholder="http://localhost:8000/api/v1/sync"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-base text-white"
              />
            </div>
          )}

          {syncStatus && (
            <div
              role="status"
              className={`flex items-start gap-2 rounded-xl border p-3 text-xs ${
                syncStatus.ok
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
                  : 'border-amber-500/40 bg-amber-500/15 text-amber-200'
              }`}
            >
              {syncStatus.ok ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
              )}
              <span>{syncStatus.message}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={isSyncing}
              className="touch-target flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 cursor-pointer"
            >
              <RefreshCw
                className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`}
              />
              <span>Sincronizar Agora</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadJsonBackup}
              className="touch-target flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 cursor-pointer"
            >
              <Download className="h-4 w-4 text-emerald-400" />
              <span>Exportar JSON</span>
            </button>
          </div>
        </form>
      </section>

      {/* BLUEPRINT SQL SUPABASE & FASTAPI */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Schema SQL Supabase & Rotas Python/FastAPI
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowBlueprint((v) => !v)}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer"
          >
            {showBlueprint ? 'Ocultar Código' : 'Ver Blueprint'}
          </button>
        </div>

        {showBlueprint && (
          <pre className="custom-scroller mt-3 max-h-64 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-3 text-[11px] text-slate-300 font-mono">
            {SUPABASE_AND_FASTAPI_BLUEPRINT}
          </pre>
        )}
      </section>

      {/* RESTAURAR LINHA DE BASE */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-200">
            Restaurar Dados de Fábrica (20/Ago, 28/Ago e 17/Set/2026)
          </h4>
          <p className="text-[11px] text-slate-400">
            Recarrega os 89,50 kg, 25,9% BF, 1898 kcal BMR e ficha PPL atualizada.
          </p>
        </div>
        <button
          type="button"
          onClick={onResetAllData}
          className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20 cursor-pointer"
        >
          Restaurar Base
        </button>
      </section>
    </div>
  );
};
