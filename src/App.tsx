import React, { useEffect, useState } from 'react';
import {
  Activity,
  Utensils,
  Dumbbell,
  Scale,
  Cloud,
  Calendar,
  Sparkles,
  Check,
} from 'lucide-react';
import {
  AppState,
  WeightCheckin,
  CardiorespiratoryActivity,
  FoodItem,
  MealWindowId,
  SyncConfiguration,
  WorkoutDayId,
} from './types';
import {
  INITIAL_CHECKINS,
  INITIAL_USER_PROFILE,
  INITIAL_WORKOUT_PLANS,
  QUICK_FOOD_PRESETS,
} from './data/initialData';
import {
  getTodayIso,
  loadInitialState,
  saveStateToLocal,
  STORAGE_KEY,
} from './services/storage';
import { generateGeminiMarkdownReport } from './utils/geminiReport';
import { DashboardTab } from './components/DashboardTab';
import { NutritionTab } from './components/NutritionTab';
import { WorkoutTab } from './components/WorkoutTab';
import { CheckinTab } from './components/CheckinTab';
import { SyncTab } from './components/SyncTab';

type ActiveTab = 'dashboard' | 'nutrition' | 'workout' | 'checkin' | 'sync';

export function App() {
  const [state, setState] = useState<AppState>(() => loadInitialState());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [headerCopied, setHeaderCopied] = useState(false);

  useEffect(() => {
    saveStateToLocal(state);
  }, [state]);

  const ensureDateHabit = (dateStr: string) => {
    return (
      state.habitsByDate[dateStr] || {
        date: dateStr,
        waterCups250ml: 0,
        steps: 0,
        postWorkoutCardio: true,
        cardioMinutes: 25,
        machineAbs: true,
        activeWorkoutDayId: 'monday_push_a',
      }
    );
  };

  const handleToggleObserverMode = () => {
    setState((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        observerMode: !prev.profile.observerMode,
      },
    }));
  };

  const handleAddFoodItem = (item: Omit<FoodItem, 'id' | 'timestamp'>) => {
    const nowTime = new Date().toTimeString().slice(0, 5);
    const newFood: FoodItem = {
      ...item,
      id: `food_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: nowTime,
    };

    setState((prev) => {
      const existing = prev.foodsByDate[prev.selectedDate] || [];
      return {
        ...prev,
        foodsByDate: {
          ...prev.foodsByDate,
          [prev.selectedDate]: [...existing, newFood],
        },
      };
    });
  };

  const handleQuickAddPreset = (presetId: string, overrideWindow?: MealWindowId) => {
    const preset = QUICK_FOOD_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    handleAddFoodItem({
      name: preset.name,
      portionLabel: preset.portionLabel,
      grams: preset.grams,
      calories: preset.calories,
      protein: preset.protein,
      carbs: preset.carbs,
      fat: preset.fat,
      source: 'quick',
      mealWindow: overrideWindow || preset.defaultWindow,
    });
  };

  const handleRemoveFoodItem = (id: string) => {
    setState((prev) => {
      const existing = prev.foodsByDate[prev.selectedDate] || [];
      return {
        ...prev,
        foodsByDate: {
          ...prev.foodsByDate,
          [prev.selectedDate]: existing.filter((i) => i.id !== id),
        },
      };
    });
  };

  const handleAddActivity = (
    activity: Omit<CardiorespiratoryActivity, 'id' | 'timestamp'>
  ) => {
    const nowTime = new Date().toTimeString().slice(0, 5);
    const newActivity: CardiorespiratoryActivity = {
      ...activity,
      id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: nowTime,
    };

    setState((prev) => {
      const existing = prev.activitiesByDate[activity.date] || [];
      return {
        ...prev,
        activitiesByDate: {
          ...prev.activitiesByDate,
          [activity.date]: [newActivity, ...existing],
        },
      };
    });
  };

  const handleRemoveActivity = (id: string) => {
    setState((prev) => {
      const existing = prev.activitiesByDate[prev.selectedDate] || [];
      return {
        ...prev,
        activitiesByDate: {
          ...prev.activitiesByDate,
          [prev.selectedDate]: existing.filter((a) => a.id !== id),
        },
      };
    });
  };

  const handleUpdateWater = (deltaCups: number) => {
    setState((prev) => {
      const current = ensureDateHabit(prev.selectedDate);
      const nextCups = Math.max(0, current.waterCups250ml + deltaCups);
      return {
        ...prev,
        habitsByDate: {
          ...prev.habitsByDate,
          [prev.selectedDate]: {
            ...current,
            waterCups250ml: nextCups,
          },
        },
      };
    });
  };

  const handleUpdateSteps = (steps: number) => {
    setState((prev) => {
      const current = ensureDateHabit(prev.selectedDate);
      return {
        ...prev,
        habitsByDate: {
          ...prev.habitsByDate,
          [prev.selectedDate]: {
            ...current,
            steps: Math.max(0, steps),
          },
        },
      };
    });
  };

  const handleUpdateSet = (
    dayId: WorkoutDayId,
    exerciseId: string,
    setNumber: number,
    changes: { reps?: number; weightKg?: number; completed?: boolean }
  ) => {
    setState((prev) => ({
      ...prev,
      workoutPlans: prev.workoutPlans.map((plan) => {
        if (plan.id !== dayId) return plan;
        return {
          ...plan,
          exercises: plan.exercises.map((ex) => {
            if (ex.id !== exerciseId) return ex;
            return {
              ...ex,
              sets: ex.sets.map((s) =>
                s.setNumber === setNumber ? { ...s, ...changes } : s
              ),
            };
          }),
        };
      }),
    }));
  };

  const handleResetWorkoutDay = (dayId: WorkoutDayId) => {
    setState((prev) => ({
      ...prev,
      workoutPlans: prev.workoutPlans.map((plan) =>
        plan.id !== dayId
          ? plan
          : {
              ...plan,
              exercises: plan.exercises.map((ex) => ({
                ...ex,
                sets: ex.sets.map((s) => ({ ...s, completed: false })),
              })),
            }
      ),
    }));
  };

  const handleAddCheckin = (checkin: Omit<WeightCheckin, 'id'>) => {
    const newEntry: WeightCheckin = {
      ...checkin,
      id: `checkin_${Date.now()}`,
    };
    setState((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        weightKg: checkin.weightKg,
      },
      checkins: [...prev.checkins, newEntry],
    }));
  };

  const handleUpdateSyncConfig = (cfg: Partial<SyncConfiguration>) => {
    setState((prev) => ({
      ...prev,
      syncConfig: {
        ...prev.syncConfig,
        ...cfg,
      },
    }));
  };

  const handleResetAllData = () => {
    localStorage.removeItem(STORAGE_KEY);
    const today = getTodayIso();
    setState({
      profile: INITIAL_USER_PROFILE,
      selectedDate: today,
      foodsByDate: {},
      habitsByDate: {},
      activitiesByDate: {},
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
    });
  };

  const handleQuickHeaderGeminiCopy = async () => {
    const md = generateGeminiMarkdownReport(state);
    try {
      await navigator.clipboard.writeText(md);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = md;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setHeaderCopied(true);
    setTimeout(() => setHeaderCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* HEADER FIXO MOBILE-FIRST COM SAFE AREA (NOTCH / DYNAMIC ISLAND) */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md pt-[max(env(safe-area-inset-top),1rem)]">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-extrabold tracking-tight text-white">
                  FitPulse Pro
                </h1>
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-300">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {state.profile.weightKg.toFixed(2)}kg • BMR {state.profile.bmrKcal} kcal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex items-center rounded-xl border border-slate-800 bg-slate-900 px-2.5 py-1.5">
              <Calendar className="h-3.5 w-3.5 text-emerald-400 mr-1.5" />
              <label htmlFor="header-date" className="sr-only">
                Selecionar data do diário
              </label>
              <input
                id="header-date"
                type="date"
                value={state.selectedDate}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    selectedDate: e.target.value || getTodayIso(),
                  }))
                }
                className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none"
              />
            </div>

            {activeTab !== 'dashboard' && (
              <button
                type="button"
                onClick={handleQuickHeaderGeminiCopy}
                title="Gerar Relatório para o Gemini"
                className="flex items-center gap-1 rounded-xl bg-emerald-500 px-2.5 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 cursor-pointer"
              >
                {headerCopied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">Gemini</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pt-4 pb-24">
        {activeTab === 'dashboard' && (
          <DashboardTab
            state={state}
            onToggleObserverMode={handleToggleObserverMode}
            onQuickAddFood={handleQuickAddPreset}
            onUpdateWater={handleUpdateWater}
            onUpdateSteps={handleUpdateSteps}
            onAddActivity={handleAddActivity}
            onRemoveActivity={handleRemoveActivity}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'nutrition' && (
          <NutritionTab
            state={state}
            onAddFoodItem={handleAddFoodItem}
            onQuickAddPreset={handleQuickAddPreset}
            onRemoveFoodItem={handleRemoveFoodItem}
            onUpdateWater={handleUpdateWater}
            onUpdateSteps={handleUpdateSteps}
          />
        )}

        {activeTab === 'workout' && (
          <WorkoutTab
            state={state}
            onUpdateSet={handleUpdateSet}
            onResetWorkoutDay={handleResetWorkoutDay}
          />
        )}

        {activeTab === 'checkin' && (
          <CheckinTab state={state} onAddCheckin={handleAddCheckin} />
        )}

        {activeTab === 'sync' && (
          <SyncTab
            state={state}
            onUpdateSyncConfig={handleUpdateSyncConfig}
            onResetAllData={handleResetAllData}
          />
        )}
      </main>

      {/* BOTTOM NAVIGATION BAR COM SAFE AREA (HOME INDICATOR) */}
      <nav
        aria-label="Navegação Principal"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800/90 bg-slate-950/95 backdrop-blur-lg pb-[max(env(safe-area-inset-bottom),1rem)]"
      >
        <div className="mx-auto grid max-w-xl grid-cols-5 gap-1 px-2 py-1.5">
          {(
            [
              { id: 'dashboard', label: 'Início', icon: Activity },
              { id: 'nutrition', label: 'Nutrição', icon: Utensils },
              { id: 'workout', label: 'Treino PPL', icon: Dumbbell },
              { id: 'checkin', label: 'Check-in', icon: Scale },
              { id: 'sync', label: 'Cloud/API', icon: Cloud },
            ] as const
          ).map((nav) => {
            const Icon = nav.icon;
            const isActive = activeTab === nav.id;
            return (
              <button
                key={nav.id}
                type="button"
                onClick={() => setActiveTab(nav.id)}
                className={`touch-target flex flex-col items-center justify-center rounded-xl py-2 transition cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="mt-0.5 text-[10px] tracking-tight">
                  {nav.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
export default App;
