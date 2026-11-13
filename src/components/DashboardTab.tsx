import React, { useState } from 'react';
import {
  Activity,
  Droplets,
  Flame,
  Footprints,
  Sparkles,
  Check,
  Eye,
  ShieldCheck,
  Scale,
  Dumbbell,
  Copy,
  ChevronRight,
  SlidersHorizontal,
  RefreshCw,
  ExternalLink,
  Timer,
  MapPin,
  Heart,
  Link2,
} from 'lucide-react';
import { AppState, MealWindowId, StravaConfig } from '../types';
import { QUICK_FOOD_PRESETS, MEAL_WINDOWS } from '../data/initialData';
import { generateGeminiMarkdownReport } from '../utils/geminiReport';
import {
  buildStravaOAuthAuthorizeUrl,
  fetchStravaRunningActivities,
} from '../services/stravaService';

interface DashboardTabProps {
  state: AppState;
  onToggleObserverMode: () => void;
  onQuickAddFood: (presetId: string, windowId?: MealWindowId) => void;
  onUpdateWater: (deltaCups: number) => void;
  onUpdateSteps: (steps: number) => void;
  onUpdateStrava: (changes: Partial<StravaConfig>) => void;
  onNavigateTab: (tab: 'dashboard' | 'nutrition' | 'workout' | 'checkin' | 'sync') => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  state,
  onToggleObserverMode,
  onQuickAddFood,
  onUpdateWater,
  onUpdateSteps,
  onUpdateStrava,
  onNavigateTab,
}) => {
  const [copiedReport, setCopiedReport] = useState(false);
  const [previewMarkdown, setPreviewMarkdown] = useState<string | null>(null);
  const [quickMealTarget, setQuickMealTarget] = useState<MealWindowId>('lunch');
  const [lastAddedToast, setLastAddedToast] = useState<string | null>(null);

  // Estado do painel Strava OAuth2
  const [isSyncingStrava, setIsSyncingStrava] = useState(false);
  const [showStravaOAuthModal, setShowStravaOAuthModal] = useState(false);
  const [stravaFeedback, setStravaFeedback] = useState<string | null>(null);

  const { profile, selectedDate, foodsByDate, habitsByDate, checkins, workoutPlans, strava } =
    state;
  const todayFoods = foodsByDate[selectedDate] || [];
  const todayHabits = habitsByDate[selectedDate] || {
    date: selectedDate,
    waterCups250ml: 0,
    steps: 0,
    postWorkoutCardio: false,
    cardioMinutes: 20,
    machineAbs: false,
  };

  const totals = todayFoods.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Soma automática do gasto calórico ativo (Active Calories) das corridas sincronizadas do Strava
  const stravaActivities = strava?.activities || [];
  const totalStravaActiveCalories = stravaActivities.reduce(
    (sum, act) => sum + act.activeCalories,
    0
  );
  const totalStravaDistanceKm = stravaActivities.reduce(
    (sum, act) => sum + act.distanceKm,
    0
  );

  const proteinGoalMet =
    totals.protein >= profile.proteinTargetMinG &&
    totals.protein <= profile.proteinTargetMaxG + 15;
  const proteinProgressPct = Math.min(
    100,
    Math.round((totals.protein / profile.proteinTargetMinG) * 100)
  );

  const waterMl = todayHabits.waterCups250ml * 250;
  const waterGoalMet = waterMl >= profile.waterGoalMl;
  const waterProgressPct = Math.min(100, Math.round((waterMl / profile.waterGoalMl) * 100));

  const stepsGoalMet = todayHabits.steps >= profile.stepsGoal;
  const latestCheckin = checkins[checkins.length - 1] || null;

  const handleCopyGeminiReport = async () => {
    const md = generateGeminiMarkdownReport(state);
    setPreviewMarkdown(md);
    try {
      await navigator.clipboard.writeText(md);
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 3500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = md;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 3500);
    }
  };

  const handleOneClickPreset = (presetId: string, name: string) => {
    onQuickAddFood(presetId, quickMealTarget);
    setLastAddedToast(`${name} adicionado!`);
    setTimeout(() => setLastAddedToast(null), 2200);
  };

  const handleSyncStravaActivities = async () => {
    setIsSyncingStrava(true);
    const res = await fetchStravaRunningActivities(strava);
    const nowFormatted = new Date().toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    onUpdateStrava({
      connected: true,
      activities: res.activities,
      lastSyncAt: nowFormatted,
    });
    setStravaFeedback(res.message);
    setIsSyncingStrava(false);
    setTimeout(() => setStravaFeedback(null), 3500);
  };

  const handleStartStravaOAuthRedirect = () => {
    const authUrl = buildStravaOAuthAuthorizeUrl(strava.clientId);
    window.open(authUrl, '_blank', 'noopener,noreferrer');
  };

  const totalCompletedSets = workoutPlans.reduce(
    (sum, plan) =>
      sum +
      plan.exercises.reduce(
        (exSum, ex) => exSum + ex.sets.filter((s) => s.completed).length,
        0
      ),
    0
  );

  return (
    <div className="space-y-4 pb-6">
      {/* 1. HERO CTA: GERAR RELATÓRIO PARA O GEMINI */}
      <section
        aria-label="Sincronização com Gemini"
        className="relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-900 p-4 shadow-lg shadow-emerald-950/30"
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
                <Sparkles className="h-3.5 w-3.5" />
                IA Coach Bridge
              </span>
              <h2 className="mt-1.5 text-base font-bold text-white">
                Sincronizar Semana & Dia com o Gemini
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Compila calorias vs. BMR ({profile.bmrKcal} kcal), proteínas, gasto ativo Strava, cargas máximas PPL e último check-in Zepp Life (17/Set/2026) em Markdown.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyGeminiReport}
              className={`touch-target flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all active:scale-[0.98] cursor-pointer ${
                copiedReport
                  ? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/30'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
              }`}
            >
              {copiedReport ? (
                <>
                  <Check className="h-4 w-4 stroke-[2.5]" />
                  <span>Copiado para o Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Gerar Relatório para o Gemini</span>
                </>
              )}
            </button>

            {previewMarkdown && (
              <button
                type="button"
                onClick={() =>
                  setPreviewMarkdown((prev) => (prev ? null : generateGeminiMarkdownReport(state)))
                }
                className="touch-target rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-3 text-xs font-semibold text-slate-200 hover:bg-slate-800 cursor-pointer"
              >
                Fechar Preview
              </button>
            )}
          </div>

          {previewMarkdown && (
            <div className="mt-2 rounded-xl border border-slate-700/80 bg-slate-950/90 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                  Markdown Copiado (Pronto para colar no Gemini)
                </span>
                <span className="text-[11px] text-slate-400">UTF-8 • Clipboard</span>
              </div>
              <pre className="custom-scroller max-h-48 overflow-y-auto whitespace-pre-wrap text-[11px] text-slate-300 font-mono leading-relaxed">
                {previewMarkdown}
              </pre>
            </div>
          )}
        </div>
      </section>

      {/* 2. BANNER MODO OBSERVADOR (LINHA DE BASE - 1º MÊS) */}
      <section
        aria-label="Modo Observador Linha de Base"
        className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                profile.observerMode
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                  : 'border-slate-700 bg-slate-800 text-slate-400'
              }`}
            >
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">
                  Modo Observador (Linha de Base)
                </h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    profile.observerMode
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {profile.observerMode ? 'Mês 1 Ativo' : 'Desativado'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {profile.observerMode
                  ? 'Mapeando consumo real sem alertas punitivos. Foco em atingir 160g–180g de proteína.'
                  : 'Modo de metas estritas ativado.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={profile.observerMode}
            onClick={onToggleObserverMode}
            className={`touch-target shrink-0 rounded-xl px-3 py-2 text-xs font-semibold border transition cursor-pointer ${
              profile.observerMode
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {profile.observerMode ? 'Ativo' : 'Ativar'}
          </button>
        </div>
      </section>

      {/* 3. PAINEL DE META PROTEICA (160g–180g) E ORÇAMENTO DE MACROS */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Card Proteína Diária */}
        <div
          className={`rounded-2xl border p-4 transition-colors ${
            proteinGoalMet
              ? 'border-emerald-500/60 bg-emerald-950/25'
              : 'border-slate-800 bg-slate-900/90'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Meta Proteica Diária
            </span>
            {proteinGoalMet ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-500/40">
                <ShieldCheck className="h-3.5 w-3.5" /> Meta Batida!
              </span>
            ) : (
              <span className="text-xs font-medium text-emerald-400">
                Alvo: {profile.proteinTargetMinG}g – {profile.proteinTargetMaxG}g
              </span>
            )}
          </div>

          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-extrabold text-white">
                {totals.protein.toFixed(1)}
              </span>
              <span className="ml-1 text-sm font-semibold text-emerald-400">g</span>
            </div>
            <span className="text-xs text-slate-400">
              {totals.protein < profile.proteinTargetMinG
                ? `Restam ${(profile.proteinTargetMinG - totals.protein).toFixed(1)}g p/ piso`
                : 'Janela proteica atingida'}
            </span>
          </div>

          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
              style={{ width: `${proteinProgressPct}%` }}
            />
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
            <span>Consumido: {totals.protein.toFixed(0)}g</span>
            <span className="font-semibold text-emerald-400">
              Saldo teto (180g): {Math.max(0, profile.proteinTargetMaxG - totals.protein).toFixed(0)}g
            </span>
          </div>
        </div>

        {/* Card Calorias vs BMR + Abatimento do Orçamento */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Orçamento Diário & BMR
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-300">
              <Flame className="h-3.5 w-3.5 text-emerald-400" />
              BMR: {profile.bmrKcal} kcal
            </span>
          </div>

          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-extrabold text-white">
                {totals.calories}
              </span>
              <span className="ml-1 text-xs font-semibold text-slate-400">
                / {profile.caloriesBudgetKcal} kcal
              </span>
            </div>
            <span className="rounded-lg bg-slate-800 px-2 py-1 text-xs font-medium text-emerald-300">
              Saldo: {Math.max(0, profile.caloriesBudgetKcal - totals.calories)} kcal
            </span>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/80 text-center">
            <div className="rounded-lg bg-slate-950/60 px-2 py-1.5">
              <div className="text-[10px] uppercase text-slate-400">Proteínas</div>
              <div className="text-xs font-bold text-emerald-400">
                {totals.protein.toFixed(0)}/{profile.proteinTargetMaxG}g
              </div>
            </div>
            <div className="rounded-lg bg-slate-950/60 px-2 py-1.5">
              <div className="text-[10px] uppercase text-slate-400">Carbos</div>
              <div className="text-xs font-bold text-sky-400">
                {totals.carbs.toFixed(0)}/{profile.carbsBudgetG}g
              </div>
            </div>
            <div className="rounded-lg bg-slate-950/60 px-2 py-1.5">
              <div className="text-[10px] uppercase text-slate-400">Gorduras</div>
              <div className="text-xs font-bold text-amber-400">
                {totals.fat.toFixed(0)}/{profile.fatBudgetG}g
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. INTEGRAÇÃO DE CARDIO COM API DO STRAVA (OAUTH2 + CORRIDAS ESTEIRA E PARQUE) */}
      <section
        aria-label="Integração Strava Cardio"
        className="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-950/25 via-slate-900 to-slate-900 p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400 font-extrabold text-xs">
              STV
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  Cardio Automatizado — Strava API (OAuth2)
                </h3>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  {strava.connected ? 'OAuth2 Conectado' : 'Aguardando Auth'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Corridas de esteira e parque sincronizadas automaticamente (sem preenchimento manual)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSyncStravaActivities}
              disabled={isSyncingStrava}
              className="touch-target flex items-center gap-1.5 rounded-xl bg-orange-500/20 border border-orange-500/40 px-3 py-2 text-xs font-bold text-orange-300 hover:bg-orange-500/30 cursor-pointer"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isSyncingStrava ? 'animate-spin' : ''}`}
              />
              <span>Sincronizar Strava</span>
            </button>
            <button
              type="button"
              onClick={() => setShowStravaOAuthModal((v) => !v)}
              className="touch-target flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800/90 px-2.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 cursor-pointer"
              title="Configurar credenciais OAuth2 do Strava"
            >
              <Link2 className="h-3.5 w-3.5 text-orange-400" />
              <span>OAuth2</span>
            </button>
          </div>
        </div>

        {stravaFeedback && (
          <div
            role="status"
            className="mb-3 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-300"
          >
            ✓ {stravaFeedback}
          </div>
        )}

        {/* Modal/Drawer de Configuração OAuth2 Strava */}
        {showStravaOAuthModal && (
          <div className="mb-3 space-y-2.5 rounded-xl border border-orange-500/40 bg-slate-950 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-orange-400">
                Fluxo de Autorização OAuth2 — Strava API v3
              </span>
              <span className="text-[10px] text-slate-400">
                Scope: read,activity:read_all
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="strava-client-id"
                  className="block text-[10px] font-semibold uppercase text-slate-400 mb-1"
                >
                  Strava Client ID
                </label>
                <input
                  id="strava-client-id"
                  type="text"
                  value={strava.clientId}
                  onChange={(e) => onUpdateStrava({ clientId: e.target.value })}
                  placeholder="Ex: 128492"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-sm text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="strava-token"
                  className="block text-[10px] font-semibold uppercase text-slate-400 mb-1"
                >
                  Access Token (Bearer OAuth2)
                </label>
                <input
                  id="strava-token"
                  type="password"
                  value={strava.accessToken}
                  onChange={(e) => onUpdateStrava({ accessToken: e.target.value })}
                  placeholder="Token OAuth2 ou vazio p/ feed sincronizado"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-sm text-white"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handleStartStravaOAuthRedirect}
                className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-orange-400 cursor-pointer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Autorizar no Strava (OAuth2 Redirect)</span>
              </button>
              <span className="text-[11px] text-slate-400">
                Última sincronização: {strava.lastSyncAt || 'Agora'}
              </span>
            </div>
          </div>
        )}

        {/* Resumo de Gasto Calórico Ativo Somado Automaticamente */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2.5">
            <div className="text-[10px] uppercase text-slate-400">
              Active Calories (Soma)
            </div>
            <div className="mt-0.5 text-base font-extrabold text-orange-400 flex items-center gap-1">
              <Flame className="h-4 w-4" />
              <span>{totalStravaActiveCalories} kcal</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2.5">
            <div className="text-[10px] uppercase text-slate-400">
              Distância Acumulada
            </div>
            <div className="mt-0.5 text-base font-extrabold text-white">
              {totalStravaDistanceKm.toFixed(2)}{' '}
              <span className="text-xs font-normal text-slate-400">km</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2.5">
            <div className="text-[10px] uppercase text-slate-400">
              Corridas Mapeadas
            </div>
            <div className="mt-0.5 text-base font-extrabold text-emerald-400">
              {stravaActivities.length}{' '}
              <span className="text-xs font-normal text-slate-400">sessões</span>
            </div>
          </div>
        </div>

        {/* Lista de Atividades de Corrida (Esteira e Parque) */}
        <div className="space-y-2">
          {stravaActivities.map((act) => (
            <div
              key={act.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-slate-800/90 bg-slate-950/90 p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      act.environmentType.includes('Esteira')
                        ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                        : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    <MapPin className="inline h-2.5 w-2.5 mr-0.5" />
                    {act.environmentType}
                  </span>
                  <span className="truncate text-xs font-bold text-white">
                    {act.name}
                  </span>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                  <span>Data: {act.date}</span>
                  <span className="font-semibold text-slate-200">
                    Distância: {act.distanceKm.toFixed(2)} km
                  </span>
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                    <Timer className="h-3 w-3" />
                    Pace: {act.paceFormatted}
                  </span>
                  {act.averageHeartrate && (
                    <span className="inline-flex items-center gap-1 text-rose-400">
                      <Heart className="h-3 w-3" /> {act.averageHeartrate} bpm
                    </span>
                  )}
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div className="rounded-lg bg-orange-500/15 border border-orange-500/30 px-2.5 py-1 text-xs font-extrabold text-orange-300">
                  +{act.activeCalories} kcal
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {act.movingTimeMinutes} min ativos
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. ADIÇÃO RÁPIDA 1-CLICK (ALIMENTOS BASE DA ROTINA) */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Adição Rápida (1-Click)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Abate automaticamente os macros do seu orçamento diário
            </p>
          </div>

          {lastAddedToast && (
            <span
              role="status"
              aria-live="polite"
              className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-xs font-bold text-emerald-300"
            >
              ✓ {lastAddedToast}
            </span>
          )}
        </div>

        <div className="grid grid-cols-4 gap-1.5 mb-3 rounded-xl bg-slate-950 p-1 border border-slate-800">
          {MEAL_WINDOWS.map((win) => {
            const active = quickMealTarget === win.id;
            return (
              <button
                key={win.id}
                type="button"
                onClick={() => setQuickMealTarget(win.id)}
                className={`rounded-lg py-2 px-1 text-center text-[11px] font-semibold transition cursor-pointer ${
                  active
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="truncate">{win.label.split(' ')[0]}</div>
                <div className="text-[9px] opacity-80">{win.timeRange.split(' ')[0]}</div>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {QUICK_FOOD_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleOneClickPreset(preset.id, preset.name)}
              className="touch-target group flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-left transition hover:border-emerald-500/50 hover:bg-slate-900 active:scale-[0.98] cursor-pointer"
            >
              <div className="flex items-start justify-between gap-1 w-full">
                <span className="text-xs font-bold text-slate-100 group-hover:text-emerald-300 leading-snug">
                  {preset.name}
                </span>
                <span className="shrink-0 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                  +1
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between w-full text-[11px] text-slate-400">
                <span>{preset.calories} kcal</span>
                <span className="font-semibold text-emerald-400">
                  {preset.protein}g P
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 6. CONTADOR RÁPIDO DE ÁGUA E PASSOS DIÁRIOS */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div
          className={`rounded-2xl border p-4 ${
            waterGoalMet
              ? 'border-emerald-500/60 bg-emerald-950/20'
              : 'border-slate-800 bg-slate-900/90'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">Água Diária</h3>
            </div>
            <span className="text-xs font-semibold text-sky-300">
              {waterMl} / {profile.waterGoalMl} ml ({todayHabits.waterCups250ml} copos)
            </span>
          </div>

          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all"
              style={{ width: `${waterProgressPct}%` }}
            />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onUpdateWater(-1)}
              className="touch-target rounded-xl border border-slate-700 bg-slate-800/80 py-2.5 text-xs font-bold text-slate-300 active:scale-95 cursor-pointer"
            >
              -250ml
            </button>
            <button
              type="button"
              onClick={() => onUpdateWater(1)}
              className="touch-target rounded-xl border border-sky-500/40 bg-sky-500/15 py-2.5 text-xs font-bold text-sky-300 hover:bg-sky-500/25 active:scale-95 cursor-pointer"
            >
              +1 Copo (250ml)
            </button>
            <button
              type="button"
              onClick={() => onUpdateWater(2)}
              className="touch-target rounded-xl border border-emerald-500/40 bg-emerald-500/15 py-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 active:scale-95 cursor-pointer"
            >
              +Garrafa (500ml)
            </button>
          </div>
        </div>

        <div
          className={`rounded-2xl border p-4 ${
            stepsGoalMet
              ? 'border-emerald-500/60 bg-emerald-950/20'
              : 'border-slate-800 bg-slate-900/90'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Footprints className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Passos Diários</h3>
            </div>
            <span className="text-xs font-semibold text-emerald-300">
              {todayHabits.steps.toLocaleString('pt-BR')} /{' '}
              {profile.stepsGoal.toLocaleString('pt-BR')}
            </span>
          </div>

          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{
                width: `${Math.min(
                  100,
                  Math.round((todayHabits.steps / profile.stepsGoal) * 100)
                )}%`,
              }}
            />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onUpdateSteps(Math.max(0, todayHabits.steps - 500))}
              className="touch-target rounded-xl border border-slate-700 bg-slate-800/80 py-2.5 text-xs font-bold text-slate-300 active:scale-95 cursor-pointer"
            >
              -500
            </button>
            <button
              type="button"
              onClick={() => onUpdateSteps(todayHabits.steps + 1000)}
              className="touch-target rounded-xl border border-emerald-500/40 bg-emerald-500/15 py-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 active:scale-95 cursor-pointer"
            >
              +1.000 Passos
            </button>
            <button
              type="button"
              onClick={() => onUpdateSteps(todayHabits.steps + 2500)}
              className="touch-target rounded-xl border border-emerald-500/40 bg-emerald-500/15 py-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 active:scale-95 cursor-pointer"
            >
              +2.500 Passos
            </button>
          </div>
        </div>
      </section>

      {/* 7. CARTÃO DE MÉTRICAS BASE DA BALANÇA (ZEPP LIFE OCR) */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              Última Avaliação Zepp Life ({latestCheckin?.weekLabel || '17/Set/2026'})
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('checkin')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer"
          >
            <span>Enviar Print OCR</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5">
            <div className="text-[10px] uppercase text-slate-400">Peso Atual</div>
            <div className="mt-0.5 text-base font-extrabold text-white">
              {(latestCheckin?.weightKg ?? profile.weightKg).toFixed(2)}{' '}
              <span className="text-[11px] font-normal text-slate-400">kg</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5">
            <div className="text-[10px] uppercase text-slate-400">Gordura (BF)</div>
            <div className="mt-0.5 text-base font-extrabold text-amber-400">
              {(latestCheckin?.bodyFatPct ?? profile.bodyFatPct).toFixed(1)}%
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5">
            <div className="text-[10px] uppercase text-slate-400">Massa Muscular</div>
            <div className="mt-0.5 text-base font-extrabold text-emerald-400">
              {(latestCheckin?.muscleMassKg ?? profile.muscleMassKg).toFixed(2)}{' '}
              <span className="text-[11px] font-normal text-slate-400">kg</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5">
            <div className="text-[10px] uppercase text-slate-400">Água Corporal</div>
            <div className="mt-0.5 text-base font-extrabold text-sky-400">
              {(latestCheckin?.waterPct ?? profile.bodyWaterPct).toFixed(1)}%
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 col-span-2 sm:col-span-1">
            <div className="text-[10px] uppercase text-slate-400">Metab. Basal</div>
            <div className="mt-0.5 text-base font-extrabold text-slate-100">
              {latestCheckin?.bmrKcal ?? profile.bmrKcal}{' '}
              <span className="text-[11px] font-normal text-slate-400">kcal</span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 pt-3 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => onNavigateTab('workout')}
            className="touch-target flex-1 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs font-semibold text-slate-200 hover:border-emerald-500/40 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-emerald-400" />
              <span>Ir para Ficha PPL ({totalCompletedSets} séries feitas)</span>
            </span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('sync')}
            className="touch-target flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:border-emerald-500/40 cursor-pointer"
          >
            <SlidersHorizontal className="h-4 w-4 text-emerald-400" />
            <span>Cloud / API</span>
          </button>
        </div>
      </section>
    </div>
  );
};
