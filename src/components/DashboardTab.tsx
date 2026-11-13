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
  PlusCircle,
  TrendingDown,
  Calculator,
} from 'lucide-react';
import { AppState, MealWindowId, CardiorespiratoryActivity } from '../types';
import { QUICK_FOOD_PRESETS, MEAL_WINDOWS } from '../data/initialData';
import { generateGeminiMarkdownReport } from '../utils/geminiReport';
import { ActivityTracker } from './ActivityTracker';

interface DashboardTabProps {
  state: AppState;
  onToggleObserverMode: () => void;
  onQuickAddFood: (presetId: string, windowId?: MealWindowId) => void;
  onUpdateWater: (deltaCups: number) => void;
  onUpdateSteps: (steps: number) => void;
  onAddActivity: (activity: Omit<CardiorespiratoryActivity, 'id' | 'timestamp'>) => void;
  onRemoveActivity: (id: string) => void;
  onNavigateTab: (tab: 'dashboard' | 'nutrition' | 'workout' | 'checkin' | 'sync') => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  state,
  onToggleObserverMode,
  onQuickAddFood,
  onUpdateWater,
  onUpdateSteps,
  onAddActivity,
  onRemoveActivity,
  onNavigateTab,
}) => {
  const [copiedReport, setCopiedReport] = useState(false);
  const [previewMarkdown, setPreviewMarkdown] = useState<string | null>(null);
  const [quickMealTarget, setQuickMealTarget] = useState<MealWindowId>('lunch');
  const [lastAddedToast, setLastAddedToast] = useState<string | null>(null);

  const {
    profile,
    selectedDate,
    foodsByDate,
    habitsByDate,
    activitiesByDate,
    checkins,
    workoutPlans,
  } = state;

  const todayFoods = foodsByDate[selectedDate] || [];
  const todayHabits = habitsByDate[selectedDate] || {
    date: selectedDate,
    waterCups250ml: 0,
    steps: 0,
    postWorkoutCardio: false,
    cardioMinutes: 20,
    machineAbs: false,
  };

  const todayActivities = activitiesByDate[selectedDate] || [];

  // 1. Calorias Consumidas através da alimentação
  const foodTotals = todayFoods.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // 2. Gasto Calórico Ativo Somado (Cardio, Handebol, Esteira, etc.)
  const totalActiveCalories = todayActivities.reduce(
    (sum, act) => sum + act.caloriesBurned,
    0
  );

  // 3. Regra de Negócio: Gasto Total = BMR + Gasto Ativo
  // Défice Calórico = Gasto Total - Calorias Ingeridas
  const totalExpenditure = profile.bmrKcal + totalActiveCalories;
  const netDeficitKcal = totalExpenditure - foodTotals.calories;

  // Orçamento Dinâmico: Orçamento Base + Gasto Ativo de Atividades
  const dynamicBudgetKcal = profile.caloriesBudgetKcal + totalActiveCalories;
  const remainingBudgetKcal = dynamicBudgetKcal - foodTotals.calories;

  const proteinGoalMet =
    foodTotals.protein >= profile.proteinTargetMinG &&
    foodTotals.protein <= profile.proteinTargetMaxG + 15;
  const proteinProgressPct = Math.min(
    100,
    Math.round((foodTotals.protein / profile.proteinTargetMinG) * 100)
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
                Compila calorias vs. BMR ({profile.bmrKcal} kcal), gasto ativo (+{totalActiveCalories} kcal), proteínas, cargas máximas PPL e último check-in Zepp Life (17/Set/2026) em Markdown.
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

      {/* 3. CALCULADORA DE BALANÇO & DÉFICE CALÓRICO INTEGRADO */}
      <section
        aria-label="Calculadora de Défice Calórico"
        className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Controlo Exato de Défice Calórico
              </h3>
              <p className="text-[11px] text-slate-400">
                (Metabolismo Basal + Gasto Ativo de Atividades) − Calorias da Alimentação
              </p>
            </div>
          </div>

          <div
            className={`rounded-xl border px-3 py-1.5 text-right ${
              netDeficitKcal >= 0
                ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                : 'border-amber-500/50 bg-amber-500/15 text-amber-300'
            }`}
          >
            <div className="text-[10px] uppercase text-slate-400">Estado Diário</div>
            <div className="text-sm font-extrabold">
              {netDeficitKcal >= 0
                ? `Défice de -${netDeficitKcal} kcal`
                : `Superávit de +${Math.abs(netDeficitKcal)} kcal`}
            </div>
          </div>
        </div>

        {/* 4 Cards de Resumo Energético */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {/* Basal BMR */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
            <div className="text-[10px] uppercase text-slate-400">1. Basal (BMR)</div>
            <div className="mt-0.5 text-sm font-extrabold text-slate-200">
              {profile.bmrKcal} <span className="text-[10px] text-slate-400">kcal</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Balança Zepp Life</div>
          </div>

          {/* Gasto Ativo Somado */}
          <div className="rounded-xl border border-orange-500/40 bg-orange-950/20 p-2.5">
            <div className="text-[10px] uppercase text-orange-400">2. Gasto Ativo (+)</div>
            <div className="mt-0.5 text-sm font-extrabold text-orange-400 flex items-center gap-1">
              <Flame className="h-3.5 w-3.5" />
              <span>+{totalActiveCalories} kcal</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {todayActivities.length} atividade(s) hoje
            </div>
          </div>

          {/* Ingestão Alimentar */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
            <div className="text-[10px] uppercase text-slate-400">3. Alimentação (−)</div>
            <div className="mt-0.5 text-sm font-extrabold text-white">
              {foodTotals.calories} <span className="text-[10px] text-slate-400">kcal</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {todayFoods.length} itens no diário
            </div>
          </div>

          {/* Saldo do Orçamento com Abatimento */}
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-2.5">
            <div className="text-[10px] uppercase text-emerald-400">Saldo Orçamento</div>
            <div className="mt-0.5 text-sm font-extrabold text-emerald-300">
              {remainingBudgetKcal >= 0 ? `${remainingBudgetKcal} kcal` : `${remainingBudgetKcal} kcal`}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Teto ajustado: {dynamicBudgetKcal} kcal
            </div>
          </div>
        </div>
      </section>

      {/* 4. NOVO COMPONENTE: REGISTO DE ATIVIDADE RÁPIDO (CARDIO & DESPORTO) */}
      <ActivityTracker
        selectedDate={selectedDate}
        activities={todayActivities}
        onAddActivity={onAddActivity}
        onRemoveActivity={onRemoveActivity}
      />

      {/* 5. PAINEL DE META PROTEICA (160g–180g) E MACROS */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                {foodTotals.protein.toFixed(1)}
              </span>
              <span className="ml-1 text-sm font-semibold text-emerald-400">g</span>
            </div>
            <span className="text-xs text-slate-400">
              {foodTotals.protein < profile.proteinTargetMinG
                ? `Faltam ${(profile.proteinTargetMinG - foodTotals.protein).toFixed(1)}g p/ piso`
                : 'Janela anabólica atingida'}
            </span>
          </div>

          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
              style={{ width: `${proteinProgressPct}%` }}
            />
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
            <span>Consumido: {foodTotals.protein.toFixed(0)}g</span>
            <span className="font-semibold text-emerald-400">
              Teto (180g): {Math.max(0, profile.proteinTargetMaxG - foodTotals.protein).toFixed(0)}g
            </span>
          </div>
        </div>

        {/* Card de Macronutrientes da Alimentação */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Macros da Dieta
            </span>
            <span className="text-xs text-slate-400">
              Alimentos de {selectedDate}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-slate-950 p-2 border border-slate-800">
              <div className="text-[10px] uppercase text-slate-400">Proteínas</div>
              <div className="text-sm font-extrabold text-emerald-400 mt-0.5">
                {foodTotals.protein.toFixed(0)}g
              </div>
              <div className="text-[9px] text-slate-500">160–180g</div>
            </div>
            <div className="rounded-xl bg-slate-950 p-2 border border-slate-800">
              <div className="text-[10px] uppercase text-slate-400">Carbos</div>
              <div className="text-sm font-extrabold text-sky-400 mt-0.5">
                {foodTotals.carbs.toFixed(0)}g
              </div>
              <div className="text-[9px] text-slate-500">/ {profile.carbsBudgetG}g</div>
            </div>
            <div className="rounded-xl bg-slate-950 p-2 border border-slate-800">
              <div className="text-[10px] uppercase text-slate-400">Gorduras</div>
              <div className="text-sm font-extrabold text-amber-400 mt-0.5">
                {foodTotals.fat.toFixed(0)}g
              </div>
              <div className="text-[9px] text-slate-500">/ {profile.fatBudgetG}g</div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. ADIÇÃO RÁPIDA 1-CLICK (ALIMENTOS BASE DA ROTINA) */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Adição Rápida de Alimentos (1-Click)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Toque com o polegar para lançar direto na janela escolhida
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

      {/* 7. CONTADOR RÁPIDO DE ÁGUA E PASSOS DIÁRIOS */}
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

      {/* 8. CARTÃO DE MÉTRICAS BASE DA BALANÇA (ZEPP LIFE OCR) */}
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
