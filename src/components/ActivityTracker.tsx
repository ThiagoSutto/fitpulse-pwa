import React, { useState } from 'react';
import {
  Flame,
  Timer,
  Activity,
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { ActivityType, CardiorespiratoryActivity } from '../types';

interface ActivityTrackerProps {
  selectedDate: string;
  activities: CardiorespiratoryActivity[];
  onAddActivity: (activity: Omit<CardiorespiratoryActivity, 'id' | 'timestamp'>) => void;
  onRemoveActivity: (id: string) => void;
}

const ACTIVITY_TYPES: { id: ActivityType; label: string; icon: string; defaultKcalPerMin: number }[] = [
  { id: 'Esteira', label: 'Esteira', icon: '🏃‍♂️', defaultKcalPerMin: 10.5 },
  { id: 'Corrida no Parque', label: 'Corrida no Parque', icon: '🌳', defaultKcalPerMin: 12.0 },
  { id: 'Handebol', label: 'Handebol', icon: '🤾‍♂️', defaultKcalPerMin: 11.0 },
  { id: 'Outros', label: 'Outros', icon: '⚡', defaultKcalPerMin: 8.5 },
];

export const ActivityTracker: React.FC<ActivityTrackerProps> = ({
  selectedDate,
  activities,
  onAddActivity,
  onRemoveActivity,
}) => {
  const [selectedType, setSelectedType] = useState<ActivityType>('Esteira');
  const [timeMinutes, setTimeMinutes] = useState<string>('25');
  const [distanceKm, setDistanceKm] = useState<string>('3.5');
  const [caloriesBurned, setCaloriesBurned] = useState<string>('265');
  const [notes, setNotes] = useState<string>('');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Filtra atividades do dia selecionado
  const todayActivities = activities.filter((act) => act.date === selectedDate);
  const totalBurnedToday = todayActivities.reduce((sum, act) => sum + act.caloriesBurned, 0);
  const totalMinutesToday = todayActivities.reduce((sum, act) => sum + act.timeMinutes, 0);

  // Sugere calorias automaticamente ao mudar o tempo ou o tipo, mas deixa 100% editável
  const handleTypeChange = (type: ActivityType) => {
    setSelectedType(type);
    const def = ACTIVITY_TYPES.find((t) => t.id === type);
    const mins = Number(timeMinutes) || 20;
    if (def) {
      setCaloriesBurned(String(Math.round(mins * def.defaultKcalPerMin)));
    }
  };

  const handleTimeChange = (val: string) => {
    setTimeMinutes(val);
    const mins = Number(val) || 0;
    const def = ACTIVITY_TYPES.find((t) => t.id === selectedType);
    if (mins > 0 && def) {
      setCaloriesBurned(String(Math.round(mins * def.defaultKcalPerMin)));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = Number(timeMinutes) || 1;
    const kcal = Number(caloriesBurned) || 0;
    const dist = distanceKm.trim() ? parseFloat(distanceKm.replace(',', '.')) : undefined;

    onAddActivity({
      type: selectedType,
      date: selectedDate,
      timeMinutes: mins,
      distanceKm: isNaN(dist as number) ? undefined : dist,
      caloriesBurned: kcal,
      notes: notes.trim() || undefined,
    });

    setNotes('');
    setFeedbackToast(`+${kcal} kcal de ${selectedType} gravadas no gasto ativo!`);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  return (
    <section
      aria-label="Registo de Atividade Rápido"
      className="rounded-2xl border border-orange-500/35 bg-gradient-to-br from-orange-950/20 via-slate-900 to-slate-900 p-4 shadow-lg shadow-orange-950/15"
    >
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Registo de Atividade Rápido</h3>
              <span className="rounded-full bg-orange-500/20 border border-orange-500/40 px-2 py-0.5 text-[10px] font-bold text-orange-300">
                Gasto Ativo
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Cardio e desporto para somar ao gasto calórico e abater do consumo diário
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-orange-500/30 bg-slate-950 px-3 py-1.5 text-right">
          <div className="text-[10px] uppercase text-slate-400">Gasto Ativo Hoje</div>
          <div className="text-sm font-extrabold text-orange-400 flex items-center justify-end gap-1">
            <Flame className="h-3.5 w-3.5" />
            <span>+{totalBurnedToday} kcal</span>
          </div>
        </div>
      </div>

      {feedbackToast && (
        <div
          role="status"
          aria-live="polite"
          className="mb-3 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-300"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Formulário Mobile-First de Inserção Manual */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* 1. Tipo de Atividade (Botões Rápidos 1-Toque) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
            Tipo de Atividade
          </label>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {ACTIVITY_TYPES.map((t) => {
              const active = selectedType === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTypeChange(t.id)}
                  className={`touch-target flex items-center justify-center gap-1.5 rounded-xl border py-2.5 px-2 text-xs font-bold transition cursor-pointer ${
                    active
                      ? 'border-orange-500 bg-orange-500/20 text-orange-300 shadow-sm shadow-orange-500/20'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span>{t.icon}</span>
                  <span className="truncate">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Inputs Numéricos: Tempo, Distância e Calorias Queimadas (Destaque Visual) */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {/* Calorias Queimadas (Principal Destaque Visual) */}
          <div className="rounded-xl border border-orange-500/50 bg-orange-950/30 p-2.5 sm:order-last">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-orange-300 mb-1">
              <span className="flex items-center gap-1">
                <Flame className="h-3.5 w-3.5" />
                Calorias (kcal) *
              </span>
              <span className="text-[10px] text-orange-400/80">Principal</span>
            </div>
            <input
              id="act-calories"
              name="caloriesBurned"
              type="text"
              inputMode="numeric"
              required
              value={caloriesBurned}
              onChange={(e) => setCaloriesBurned(e.target.value.replace(/\D/g, ''))}
              placeholder="Ex: 300"
              className="w-full bg-transparent text-xl font-black text-orange-400 placeholder:text-orange-900 focus:outline-none"
            />
          </div>

          {/* Tempo em Minutos */}
          <div className="rounded-xl border border-slate-700 bg-slate-950 p-2.5">
            <label
              htmlFor="act-time"
              className="flex items-center gap-1 text-xs font-bold uppercase text-slate-300 mb-1"
            >
              <Timer className="h-3.5 w-3.5 text-emerald-400" />
              <span>Tempo (minutos) *</span>
            </label>
            <input
              id="act-time"
              name="timeMinutes"
              type="text"
              inputMode="numeric"
              required
              value={timeMinutes}
              onChange={(e) => handleTimeChange(e.target.value.replace(/\D/g, ''))}
              placeholder="Ex: 30"
              className="w-full bg-transparent text-base font-bold text-white focus:outline-none"
            />
          </div>

          {/* Distância em km (Opcional) */}
          <div className="rounded-xl border border-slate-700 bg-slate-950 p-2.5">
            <label
              htmlFor="act-distance"
              className="flex items-center gap-1 text-xs font-bold uppercase text-slate-300 mb-1"
            >
              <MapPin className="h-3.5 w-3.5 text-sky-400" />
              <span>Distância (km)</span>
              <span className="text-[10px] text-slate-500 font-normal">Opcional</span>
            </label>
            <input
              id="act-distance"
              name="distanceKm"
              type="text"
              inputMode="decimal"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              placeholder="Ex: 4.2"
              className="w-full bg-transparent text-base font-bold text-white focus:outline-none"
            />
          </div>
        </div>

        {/* Observação Opcional */}
        <div>
          <label htmlFor="act-notes" className="sr-only">
            Observações da atividade
          </label>
          <input
            id="act-notes"
            name="notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observação opcional (ex: esteira inclinação 2%, parque 5km, jogo de handebol...)"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-orange-500/50"
          />
        </div>

        <button
          type="submit"
          className="touch-target flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-bold text-slate-950 hover:bg-orange-400 active:scale-[0.99] transition cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Gravar Atividade</span>
        </button>
      </form>

      {/* Histórico das Atividades Registadas no Dia */}
      <div className="mt-4 pt-3 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-orange-400" />
            Atividades de Hoje ({selectedDate})
          </span>
          <span className="text-[11px] text-slate-400">
            {todayActivities.length} registo(s) • {totalMinutesToday} min
          </span>
        </div>

        {todayActivities.length === 0 ? (
          <div className="py-3 text-center text-xs text-slate-500 rounded-xl bg-slate-950/50 border border-slate-800/60">
            Nenhuma atividade física registada para hoje. Registe acima para somar o gasto calórico!
          </div>
        ) : (
          <div className="space-y-2">
            {todayActivities.map((act) => (
              <div
                key={act.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/90 p-2.5 hover:border-orange-500/30 transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-orange-500/15 border border-orange-500/30 px-2 py-0.5 text-[10px] font-bold text-orange-300">
                      {act.type}
                    </span>
                    <span className="text-xs font-bold text-white">
                      {act.timeMinutes} min
                    </span>
                    {act.distanceKm && (
                      <span className="text-[11px] text-sky-400 font-semibold">
                        • {act.distanceKm.toFixed(1)} km
                      </span>
                    )}
                  </div>
                  {act.notes && (
                    <p className="mt-1 text-[11px] text-slate-400 truncate">
                      “{act.notes}”
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="rounded-lg bg-orange-500/20 border border-orange-500/30 px-2.5 py-1 text-xs font-extrabold text-orange-300">
                    +{act.caloriesBurned} kcal
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveActivity(act.id)}
                    aria-label={`Remover atividade ${act.type}`}
                    className="rounded-lg p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
