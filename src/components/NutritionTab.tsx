import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Clock,
  Droplets,
  Footprints,
  Loader2,
  Sparkles,
  Utensils,
  Globe,
  CheckCircle2,
  Calculator,
  Flame,
  ChevronDown,
  Scale,
} from 'lucide-react';
import { AppState, FoodItem, MealWindowId } from '../types';
import { MEAL_WINDOWS, QUICK_FOOD_PRESETS } from '../data/initialData';
import {
  searchFoodDatabase,
  OpenFoodFactsProduct,
  TACO_BRAZIL_DATABASE,
} from '../services/openFoodFacts';
import {
  HouseholdMeasureId,
  HOUSEHOLD_MEASURES,
  HOUSEHOLD_MEASURES_LIST,
  calculateTotalGrams,
  formatPortionDescription,
  calculateMacrosFromGrams,
} from '../utils/householdMeasures';

interface NutritionTabProps {
  state: AppState;
  onAddFoodItem: (item: Omit<FoodItem, 'id' | 'timestamp'>) => void;
  onQuickAddPreset: (presetId: string, windowId?: MealWindowId) => void;
  onRemoveFoodItem: (id: string) => void;
  onUpdateWater: (deltaCups: number) => void;
  onUpdateSteps: (steps: number) => void;
}

export const NutritionTab: React.FC<NutritionTabProps> = ({
  state,
  onAddFoodItem,
  onQuickAddPreset,
  onRemoveFoodItem,
  onUpdateWater,
  onUpdateSteps,
}) => {
  const [selectedWindow, setSelectedWindow] = useState<MealWindowId>('breakfast');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<OpenFoodFactsProduct[]>(
    () => TACO_BRAZIL_DATABASE.slice(0, 8)
  );
  const [isOnlineOff, setIsOnlineOff] = useState(false);
  const [selectedMeasure, setSelectedMeasure] = useState<HouseholdMeasureId>('escumadeira');
  const [measureQuantity, setMeasureQuantity] = useState<number>(1);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const { profile, selectedDate, foodsByDate, habitsByDate, activitiesByDate } = state;
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
  const totalBurnedToday = todayActivities.reduce((sum, act) => sum + act.caloriesBurned, 0);

  const totals = todayFoods.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Orçamento Diário Ajustado: Calorias Base + Calorias Queimadas em Atividades
  const dynamicCaloriesBudget = profile.caloriesBudgetKcal + totalBurnedToday;
  const remainingKcal = dynamicCaloriesBudget - totals.calories;

  const remainingProteinMin = Math.max(0, profile.proteinTargetMinG - totals.protein);
  const remainingProteinMax = profile.proteinTargetMaxG - totals.protein;
  const remainingCarbs = profile.carbsBudgetG - totals.carbs;
  const remainingFat = profile.fatBudgetG - totals.fat;

  const showToast = (msg: string) => {
    setFeedbackBanner(msg);
    setTimeout(() => setFeedbackBanner(null), 2800);
  };

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      const { results, isOnlineOpenFoodFacts } = await searchFoodDatabase(searchQuery);
      if (active) {
        setSearchResults(results);
        setIsOnlineOff(isOnlineOpenFoodFacts);
        setIsSearching(false);
      }
    }, 240);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    const { results, isOnlineOpenFoodFacts } = await searchFoodDatabase(searchQuery);
    setSearchResults(results);
    setIsOnlineOff(isOnlineOpenFoodFacts);
    setIsSearching(false);
  };

  const currentMeasure = HOUSEHOLD_MEASURES[selectedMeasure] || HOUSEHOLD_MEASURES.gramas;
  const totalCalculatedGrams = calculateTotalGrams(selectedMeasure, measureQuantity);

  const handleDecrementQuantity = () => {
    if (selectedMeasure === 'gramas') {
      setMeasureQuantity((prev) => Math.max(5, prev - 10));
    } else {
      setMeasureQuantity((prev) => {
        if (prev <= 1) return Math.max(0.5, prev - 0.5);
        return Math.max(0.5, prev - 1);
      });
    }
  };

  const handleIncrementQuantity = () => {
    if (selectedMeasure === 'gramas') {
      setMeasureQuantity((prev) => prev + 10);
    } else {
      setMeasureQuantity((prev) => prev + 1);
    }
  };

  const handleMeasureChange = (newMeasureId: HouseholdMeasureId) => {
    const prevMeasure = selectedMeasure;
    setSelectedMeasure(newMeasureId);

    if (newMeasureId === 'gramas') {
      const equiv = calculateTotalGrams(prevMeasure, measureQuantity);
      setMeasureQuantity(equiv > 0 ? equiv : 100);
    } else if (prevMeasure === 'gramas') {
      const targetDef = HOUSEHOLD_MEASURES[newMeasureId];
      const approxUnits = Math.max(1, Math.round(measureQuantity / targetDef.grams));
      setMeasureQuantity(approxUnits);
    } else {
      if (measureQuantity <= 0) setMeasureQuantity(1);
    }
  };

  const getSuggestedMeasure = (prodName: string): HouseholdMeasureId | null => {
    const lower = prodName.toLowerCase();
    if (lower.includes('arroz')) return 'escumadeira';
    if (lower.includes('feijão') || lower.includes('feijao') || lower.includes('sopa') || lower.includes('caldo')) return 'concha';
    if (lower.includes('frango') || lower.includes('carne') || lower.includes('bife') || lower.includes('peixe') || lower.includes('patinho') || lower.includes('alcatra')) return 'file_medio';
    if (lower.includes('ovo')) return 'unidade';
    if (lower.includes('pão') || lower.includes('pao') || lower.includes('torrada') || lower.includes('queijo')) return 'fatia';
    if (lower.includes('creatina') || lower.includes('canela') || lower.includes('açúcar') || lower.includes('acucar')) return 'colher_cha';
    if (lower.includes('azeite') || lower.includes('óleo') || lower.includes('manteiga') || lower.includes('pasta de amendoim') || lower.includes('aveia') || lower.includes('whey')) return 'colher_sopa';
    return null;
  };

  const handleSelectFoodProduct = (
    prod: OpenFoodFactsProduct,
    customGrams?: number,
    customPortionLabel?: string
  ) => {
    const gramsToUse = customGrams ?? Math.max(1, totalCalculatedGrams);
    const portionLabelToUse =
      customPortionLabel ??
      formatPortionDescription(selectedMeasure, measureQuantity, gramsToUse);

    const macros = calculateMacrosFromGrams(
      gramsToUse,
      prod.caloriesPer100g,
      prod.proteinPer100g,
      prod.carbsPer100g,
      prod.fatPer100g
    );

    onAddFoodItem({
      name: prod.name,
      portionLabel: portionLabelToUse,
      grams: gramsToUse,
      calories: macros.calories,
      protein: macros.protein,
      carbs: macros.carbs,
      fat: macros.fat,
      source: prod.sourceType,
      mealWindow: selectedWindow,
    });
    showToast(
      `${prod.name} (${portionLabelToUse}) lançado! Abatido: ${macros.calories} kcal e ${macros.protein}g P do orçamento.`
    );
  };

  const proteinInTarget =
    totals.protein >= profile.proteinTargetMinG &&
    totals.protein <= profile.proteinTargetMaxG + 15;

  return (
    <div className="space-y-4 pb-6">
      {/* 1. PAINEL DE ORÇAMENTO DIÁRIO COM ABATIMENTO AUTOMÁTICO DE MACROS */}
      <section
        aria-label="Orçamento Diário de Macronutrientes"
        className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              <Calculator className="h-3.5 w-3.5" />
              Orçamento Diário & Abatimento Automático • {selectedDate}
            </span>
            <h2 className="text-base font-extrabold text-white mt-0.5">
              Consumido: {totals.calories} kcal{' '}
              <span className="text-xs font-normal text-slate-400">
                (Orçamento: {dynamicCaloriesBudget} kcal
                {totalBurnedToday > 0 && ` [${profile.caloriesBudgetKcal} base + ${totalBurnedToday} atividade]`})
              </span>
            </h2>
          </div>

          <div
            className={`rounded-xl border px-3 py-1.5 text-right ${
              proteinInTarget
                ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                : 'border-slate-700 bg-slate-950 text-slate-200'
            }`}
          >
            <div className="text-[10px] uppercase text-slate-400">Saldo Calórico</div>
            <div className="text-sm font-extrabold text-emerald-400">
              {remainingKcal >= 0 ? `${remainingKcal} kcal livres` : `${Math.abs(remainingKcal)} kcal acima`}
            </div>
          </div>
        </div>

        {totalBurnedToday > 0 && (
          <div className="mb-3 flex items-center justify-between rounded-xl border border-orange-500/30 bg-orange-950/20 px-3 py-2 text-xs text-orange-300">
            <span className="flex items-center gap-1.5 font-bold">
              <Flame className="h-3.5 w-3.5" />
              Gasto Ativo Somado ao Orçamento: +{totalBurnedToday} kcal queimadas
            </span>
            <span className="text-[11px] text-slate-400">
              {todayActivities.length} atividade(s)
            </span>
          </div>
        )}

        {/* Barras de Abatimento por Macro */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-2.5">
            <div className="flex items-center justify-between text-[10px] uppercase text-slate-400">
              <span>Proteína</span>
              <span className="font-bold text-emerald-400">160–180g</span>
            </div>
            <div className="mt-1 text-sm font-extrabold text-white">
              {totals.protein.toFixed(1)}g
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((totals.protein / profile.proteinTargetMaxG) * 100)
                  )}%`,
                }}
              />
            </div>
            <div className="mt-1 text-[10px] text-slate-400">
              {remainingProteinMin > 0
                ? `Faltam ${remainingProteinMin.toFixed(1)}g p/ 160g`
                : `Restam ${Math.max(0, remainingProteinMax).toFixed(1)}g p/ 180g`}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-2.5">
            <div className="flex items-center justify-between text-[10px] uppercase text-slate-400">
              <span>Carboidrato</span>
              <span className="font-bold text-sky-400">{profile.carbsBudgetG}g</span>
            </div>
            <div className="mt-1 text-sm font-extrabold text-white">
              {totals.carbs.toFixed(1)}g
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-sky-400 transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((totals.carbs / profile.carbsBudgetG) * 100)
                  )}%`,
                }}
              />
            </div>
            <div className="mt-1 text-[10px] text-slate-400">
              Saldo: {Math.max(0, remainingCarbs).toFixed(1)}g restantes
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-2.5">
            <div className="flex items-center justify-between text-[10px] uppercase text-slate-400">
              <span>Gorduras</span>
              <span className="font-bold text-amber-400">{profile.fatBudgetG}g</span>
            </div>
            <div className="mt-1 text-sm font-extrabold text-white">
              {totals.fat.toFixed(1)}g
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-amber-400 transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((totals.fat / profile.fatBudgetG) * 100)
                  )}%`,
                }}
              />
            </div>
            <div className="mt-1 text-[10px] text-slate-400">
              Saldo: {Math.max(0, remainingFat).toFixed(1)}g restantes
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-2.5">
            <div className="flex items-center justify-between text-[10px] uppercase text-slate-400">
              <span>Calorias</span>
              <span className="font-bold text-slate-200">
                {dynamicCaloriesBudget}
              </span>
            </div>
            <div className="mt-1 text-sm font-extrabold text-white">
              {totals.calories} kcal
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-teal-400 transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((totals.calories / dynamicCaloriesBudget) * 100)
                  )}%`,
                }}
              />
            </div>
            <div className="mt-1 text-[10px] text-slate-400">
              Saldo: {Math.max(0, remainingKcal)} kcal livres
            </div>
          </div>
        </div>

        {feedbackBanner && (
          <div
            role="status"
            aria-live="polite"
            className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-300"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{feedbackBanner}</span>
          </div>
        )}
      </section>

      {/* 2. SELETOR DE JANELA DE DESTINO + 1-CLICK */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
          1. Escolha a Janela da Rotina para Lançar
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {MEAL_WINDOWS.map((win) => {
            const active = selectedWindow === win.id;
            return (
              <button
                key={win.id}
                type="button"
                onClick={() => setSelectedWindow(win.id)}
                className={`touch-target flex flex-col items-start justify-between rounded-xl border p-2.5 text-left transition cursor-pointer ${
                  active
                    ? 'border-emerald-500 bg-emerald-500/15 text-white shadow-sm'
                    : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-xs font-bold">{win.label}</span>
                <span
                  className={`mt-1 inline-flex items-center gap-1 text-[10px] font-medium ${
                    active ? 'text-emerald-300' : 'text-slate-400'
                  }`}
                >
                  <Clock className="h-3 w-3" /> {win.timeRange}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Adição Rápida (1-Click) — Alimentos Base
            </span>
            <span className="text-[11px] text-slate-400">
              Destino: {MEAL_WINDOWS.find((w) => w.id === selectedWindow)?.label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {QUICK_FOOD_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  onQuickAddPreset(preset.id, selectedWindow);
                  showToast(
                    `${preset.name} adicionado! Abatido ${preset.calories} kcal e ${preset.protein}g P.`
                  );
                }}
                className="touch-target flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-left hover:border-emerald-500/50 active:scale-[0.98] transition cursor-pointer"
              >
                <div className="text-xs font-bold text-slate-100 leading-tight">
                  {preset.name}
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{preset.calories} kcal</span>
                  <span className="font-bold text-emerald-400">+{preset.protein}g P</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. BUSCA INTEGRADA: TABELA TACO + API OPEN FOOD FACTS */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Pesquisa de Alimentos (Tabela TACO + Open Food Facts API)
              </h3>
              <p className="text-[11px] text-slate-400">
                Selecione a medida caseira ou gramas e clique em Abater para deduzir automaticamente do orçamento diário
              </p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
            {isOnlineOff ? 'TACO + OpenFoodFacts Live' : 'Base TACO + OFF Ativa'}
          </span>
        </div>

        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <label htmlFor="off-search-input" className="sr-only">
                Buscar alimento na Tabela TACO ou Open Food Facts
              </label>
              <input
                id="off-search-input"
                name="query"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Digite o alimento: frango, patinho, arroz, feijão, whey, aveia, banana..."
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                enterKeyHint="search"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3 py-2.5 text-base text-white placeholder:text-slate-500"
              />
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="touch-target flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 cursor-pointer"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span>Pesquisar API</span>
            </button>
          </div>

          {/* GRUPO DE MEDIDAS CASEIRAS & QUANTIDADE */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Scale className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Quantidade & Medida Caseira
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Total Calculado:</span>
                <span className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-extrabold text-emerald-300">
                  ~{totalCalculatedGrams}g
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
              {/* Stepper [ - ] [ Qtd ] [ + ] */}
              <div className="sm:col-span-5 flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1">
                <button
                  type="button"
                  onClick={handleDecrementQuantity}
                  aria-label="Diminuir quantidade"
                  className="touch-target flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 border border-slate-800 text-slate-200 hover:text-white hover:bg-slate-800 active:scale-95 transition text-lg font-black cursor-pointer"
                >
                  -
                </button>

                <div className="flex-1 flex flex-col items-center justify-center px-1">
                  <label htmlFor="measure-quantity-input" className="sr-only">
                    Quantidade da porção
                  </label>
                  <input
                    id="measure-quantity-input"
                    name="measureQuantity"
                    type="number"
                    inputMode={selectedMeasure === 'gramas' ? 'numeric' : 'decimal'}
                    step={selectedMeasure === 'gramas' ? '5' : '0.5'}
                    min={currentMeasure.min}
                    value={measureQuantity}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setMeasureQuantity(isNaN(v) ? 0 : v);
                    }}
                    className="w-full bg-transparent text-center text-lg font-black text-emerald-400 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[120px]">
                    {selectedMeasure === 'gramas' ? 'gramas' : currentMeasure.shortLabel}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleIncrementQuantity}
                  aria-label="Aumentar quantidade"
                  className="touch-target flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 active:scale-95 transition text-lg font-black cursor-pointer"
                >
                  +
                </button>
              </div>

              {/* Dropdown Select com Hitbox Grande e Dark Mode iOS */}
              <div className="sm:col-span-7 relative">
                <label htmlFor="measure-select" className="sr-only">
                  Selecione a medida caseira ou gramas
                </label>
                <select
                  id="measure-select"
                  name="householdMeasure"
                  value={selectedMeasure}
                  onChange={(e) => handleMeasureChange(e.target.value as HouseholdMeasureId)}
                  className="touch-target w-full appearance-none rounded-xl border border-slate-700/80 bg-slate-900 px-3.5 py-3 pr-10 text-xs sm:text-sm font-bold text-white shadow-sm hover:border-emerald-500/50 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  {HOUSEHOLD_MEASURES_LIST.map((m) => (
                    <option key={m.id} value={m.id} className="bg-slate-950 text-white py-1">
                      {m.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* Chips de Acesso Rápido para Medidas Mais Comuns */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                Atalhos:
              </span>
              {HOUSEHOLD_MEASURES_LIST.map((m) => {
                const active = selectedMeasure === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleMeasureChange(m.id)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                      active
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {m.name} ({m.grams}g)
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        <div className="mt-3 space-y-2">
          <div className="custom-scroller max-h-72 space-y-2 overflow-y-auto pr-1">
            {searchResults.map((prod) => {
              const activeGrams = Math.max(1, totalCalculatedGrams);
              const macros = calculateMacrosFromGrams(
                activeGrams,
                prod.caloriesPer100g,
                prod.proteinPer100g,
                prod.carbsPer100g,
                prod.fatPer100g
              );
              const portionDesc = formatPortionDescription(
                selectedMeasure,
                measureQuantity,
                activeGrams
              );
              const suggested = getSuggestedMeasure(prod.name);

              return (
                <div
                  key={prod.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-slate-800 bg-slate-950/90 p-3 hover:border-emerald-500/40 transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                          prod.sourceType === 'taco'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                        }`}
                      >
                        {prod.sourceType === 'taco' ? 'TACO' : 'OFF API'}
                      </span>
                      <span className="truncate text-xs font-bold text-white">
                        {prod.name}
                      </span>
                      {suggested && suggested !== selectedMeasure && (
                        <button
                          type="button"
                          onClick={() => {
                            handleMeasureChange(suggested);
                            setMeasureQuantity(1);
                          }}
                          className="rounded bg-slate-800/80 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] text-emerald-300 hover:bg-emerald-500/15 cursor-pointer"
                          title={`Usar ${HOUSEHOLD_MEASURES[suggested].name} (~${HOUSEHOLD_MEASURES[suggested].grams}g)`}
                        >
                          Usar {HOUSEHOLD_MEASURES[suggested].name}
                        </button>
                      )}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-400">
                      Porção ({portionDesc}):{' '}
                      <strong className="text-white">{macros.calories} kcal</strong> •{' '}
                      <strong className="text-emerald-400">{macros.protein}g Proteína</strong> •{' '}
                      <span className="text-sky-300">{macros.carbs}g Carbo</span> •{' '}
                      <span className="text-amber-300">{macros.fat}g Gordura</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSelectFoodProduct(prod)}
                      className="touch-target flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 active:scale-95 transition cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                      <span>Abater {portionDesc}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. DIÁRIO DIVIDIDO NAS 4 JANELAS REAIS DA ROTINA */}
      <section className="space-y-3">
        {MEAL_WINDOWS.map((win) => {
          const items = todayFoods.filter((f) => f.mealWindow === win.id);
          const winKcal = items.reduce((s, i) => s + i.calories, 0);
          const winProt = items.reduce((s, i) => s + i.protein, 0);

          return (
            <div
              key={win.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <Utensils className="h-4 w-4 text-emerald-400" />
                    <h4 className="text-sm font-bold text-white">{win.label}</h4>
                    <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                      {win.timeRange}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{win.description}</p>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-white">{winKcal} kcal</div>
                  <div className="text-xs font-bold text-emerald-400">
                    {winProt.toFixed(1)}g P
                  </div>
                </div>
              </div>

              {items.length === 0 ? (
                <div className="py-3 text-center text-xs text-slate-500">
                  Nenhum alimento registrado nesta janela.
                </div>
              ) : (
                <ul className="mt-2.5 divide-y divide-slate-800/70">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-2 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-xs font-semibold text-slate-100">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({item.portionLabel})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.calories} kcal •{' '}
                          <span className="text-emerald-400 font-semibold">
                            {item.protein}g P
                          </span>{' '}
                          • {item.carbs}g C • {item.fat}g G
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveFoodItem(item.id)}
                        aria-label={`Remover ${item.name}`}
                        className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/15 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </section>

      {/* 5. CONTADOR RÁPIDO DE ÁGUA E PASSOS */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Hidratação & Movimento do Dia
        </h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3">
            <div className="flex items-center gap-2.5">
              <Droplets className="h-5 w-5 text-sky-400" />
              <div>
                <div className="text-xs font-bold text-white">
                  {todayHabits.waterCups250ml * 250} ml ({todayHabits.waterCups250ml} copos)
                </div>
                <div className="text-[10px] text-slate-400">
                  Meta: {profile.waterGoalMl} ml
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onUpdateWater(1)}
                className="rounded-lg bg-sky-500/20 border border-sky-500/40 px-2.5 py-1.5 text-xs font-bold text-sky-300 cursor-pointer"
              >
                +250ml
              </button>
              <button
                type="button"
                onClick={() => onUpdateWater(2)}
                className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1.5 text-xs font-bold text-emerald-300 cursor-pointer"
              >
                +500ml
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3">
            <div className="flex items-center gap-2.5">
              <Footprints className="h-5 w-5 text-emerald-400" />
              <div>
                <div className="text-xs font-bold text-white">
                  {todayHabits.steps.toLocaleString('pt-BR')} passos
                </div>
                <div className="text-[10px] text-slate-400">
                  Meta: {profile.stepsGoal.toLocaleString('pt-BR')} passos
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onUpdateSteps(todayHabits.steps + 1000)}
                className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1.5 text-xs font-bold text-emerald-300 cursor-pointer"
              >
                +1k
              </button>
              <button
                type="button"
                onClick={() => onUpdateSteps(todayHabits.steps + 2500)}
                className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1.5 text-xs font-bold text-emerald-300 cursor-pointer"
              >
                +2.5k
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
