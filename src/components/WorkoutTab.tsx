import React, { useState } from 'react';
import {
  Check,
  Flame,
  RotateCcw,
  Plus,
  Minus,
  Trophy,
  ShieldCheck,
} from 'lucide-react';
import { AppState, WorkoutDayId } from '../types';

interface WorkoutTabProps {
  state: AppState;
  onUpdateSet: (
    dayId: WorkoutDayId,
    exerciseId: string,
    setNumber: number,
    changes: { reps?: number; weightKg?: number; completed?: boolean }
  ) => void;
  onResetWorkoutDay: (dayId: WorkoutDayId) => void;
}

export const WorkoutTab: React.FC<WorkoutTabProps> = ({
  state,
  onUpdateSet,
  onResetWorkoutDay,
}) => {
  const { workoutPlans, habitsByDate, selectedDate } = state;
  const todayHabits = habitsByDate[selectedDate] || {
    date: selectedDate,
    waterCups250ml: 0,
    steps: 0,
    postWorkoutCardio: false,
    cardioMinutes: 20,
    machineAbs: false,
    activeWorkoutDayId: 'monday_push_a',
  };

  const [selectedDayId, setSelectedDayId] = useState<WorkoutDayId>(
    todayHabits.activeWorkoutDayId || 'monday_push_a'
  );

  const activePlan =
    workoutPlans.find((p) => p.id === selectedDayId) || workoutPlans[0];

  const totalSetsInDay = activePlan.exercises.reduce(
    (acc, ex) => acc + ex.sets.length,
    0
  );
  const completedSetsInDay = activePlan.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  );
  const dayProgressPct = Math.round(
    (completedSetsInDay / Math.max(1, totalSetsInDay)) * 100
  );

  return (
    <div className="space-y-4 pb-6">
      {/* 1. SELETOR DE DIVISÃO PPL - 5 DIAS */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-3">
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Divisão Push / Pull / Legs (5 Dias)
          </span>
          <span className="text-xs font-semibold text-emerald-400">
            Meta: 8 a 12 reps
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {workoutPlans.map((plan) => {
            const isSelected = plan.id === selectedDayId;
            const [dayShort, splitShort] = plan.shortLabel.split(' • ');
            const doneCount = plan.exercises.reduce(
              (s, e) => s + e.sets.filter((st) => st.completed).length,
              0
            );
            const totalCount = plan.exercises.reduce(
              (s, e) => s + e.sets.length,
              0
            );
            const isAllDone = doneCount === totalCount && totalCount > 0;

            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedDayId(plan.id)}
                className={`touch-target flex flex-col items-center justify-center rounded-xl border py-2.5 px-1 text-center transition cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-500 text-slate-950 font-extrabold shadow-md shadow-emerald-500/20'
                    : isAllDone
                    ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                    : 'border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="text-[10px] uppercase tracking-tight opacity-85">
                  {dayShort}
                </span>
                <span className="text-xs font-extrabold mt-0.5">{splitShort}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. BANNER DA REGRA GLOBAL DIÁRIA DE CORE (2X ABD INFRA + 2X ABD MÁQUINA) */}
      <section className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
            <Flame className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-white">
                Regra Global Diária Ativa em Todos os Treinos
              </h3>
              <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                Fixo
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Inclui obrigatoriamente <strong>2 séries de Abdominal Infra</strong> +{' '}
              <strong>2 séries de Abdominal na Máquina</strong> ao final da sessão.
            </p>
          </div>
        </div>
        <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" />
      </section>

      {/* 3. CABEÇALHO DO TREINO ATIVO E PROGRESSO */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase text-emerald-400">
              {activePlan.dayLabel}
            </span>
            <h2 className="text-base font-extrabold text-white mt-0.5">
              {activePlan.splitTitle}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {activePlan.focusDescription}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onResetWorkoutDay(activePlan.id)}
            title="Desmarcar séries concluídas deste treino"
            className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-2 text-[11px] font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Resetar Check</span>
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Séries Concluídas:{' '}
            <strong className="text-white">
              {completedSetsInDay} / {totalSetsInDay}
            </strong>
          </span>
          <span className="font-bold text-emerald-400">{dayProgressPct}%</span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${dayProgressPct}%` }}
          />
        </div>
      </section>

      {/* 4. LISTA DE EXERCÍCIOS OTIMIZADA PARA USO COM UMA MÃO */}
      <section className="space-y-3">
        {activePlan.exercises.map((exercise, exIndex) => {
          const maxWeight = exercise.sets.reduce(
            (m, s) => (s.weightKg > m ? s.weightKg : m),
            0
          );
          const allSetsCompleted = exercise.sets.every((s) => s.completed);

          return (
            <div
              key={exercise.id}
              className={`rounded-2xl border p-4 transition ${
                allSetsCompleted
                  ? 'border-emerald-500/50 bg-emerald-950/15'
                  : exercise.isDailyCoreRule
                  ? 'border-emerald-500/30 bg-slate-900/95'
                  : 'border-slate-800 bg-slate-900/90'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-800 text-xs font-extrabold text-emerald-400">
                      {exIndex + 1}
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      {exercise.name}
                    </h3>
                    <span className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      {exercise.targetSets} séries
                    </span>
                    {exercise.isDailyCoreRule && (
                      <span className="rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                        Regra Global Diária
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">
                      {exercise.muscleGroup}
                    </span>
                    <span>• Meta: {exercise.targetReps}</span>
                    {exercise.notes && <span>• {exercise.notes}</span>}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="inline-flex items-center gap-1 rounded-lg bg-slate-950 border border-slate-800 px-2 py-1 text-[11px] font-bold text-emerald-400">
                    <Trophy className="h-3 w-3" />
                    <span>Máx: {maxWeight}kg</span>
                  </div>
                </div>
              </div>

              {/* Linhas de Séries */}
              <div className="space-y-2">
                {exercise.sets.map((set) => (
                  <div
                    key={set.setNumber}
                    className={`grid grid-cols-12 items-center gap-2 rounded-xl border p-2 transition ${
                      set.completed
                        ? 'border-emerald-500/40 bg-emerald-500/10'
                        : 'border-slate-800/90 bg-slate-950/70'
                    }`}
                  >
                    <div className="col-span-2 flex items-center gap-1 pl-1">
                      <span className="text-xs font-bold text-slate-400">
                        #{set.setNumber}
                      </span>
                    </div>

                    <div className="col-span-5 flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-1.5 py-1">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateSet(activePlan.id, exercise.id, set.setNumber, {
                            weightKg: Math.max(0, set.weightKg - 2),
                          })
                        }
                        aria-label={`Diminuir carga da série ${set.setNumber}`}
                        className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-800 text-slate-300 active:scale-95 cursor-pointer"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>

                      <div className="text-center">
                        <input
                          type="text"
                          inputMode="decimal"
                          aria-label={`Carga em kg série ${set.setNumber}`}
                          value={set.weightKg}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value.replace(',', '.'));
                            onUpdateSet(activePlan.id, exercise.id, set.setNumber, {
                              weightKg: isNaN(val) ? 0 : val,
                            });
                          }}
                          className="w-11 bg-transparent text-center text-xs font-extrabold text-white focus:outline-none"
                        />
                        <span className="block text-[9px] uppercase text-slate-400 -mt-1">
                          kg
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          onUpdateSet(activePlan.id, exercise.id, set.setNumber, {
                            weightKg: set.weightKg + 2,
                          })
                        }
                        aria-label={`Aumentar carga da série ${set.setNumber}`}
                        className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-800 text-emerald-400 active:scale-95 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="col-span-3 flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-1 py-1">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateSet(activePlan.id, exercise.id, set.setNumber, {
                            reps: Math.max(1, set.reps - 1),
                          })
                        }
                        aria-label={`Diminuir repetições da série ${set.setNumber}`}
                        className="flex h-7 w-6 items-center justify-center rounded bg-slate-800 text-slate-300 active:scale-95 cursor-pointer"
                      >
                        -
                      </button>
                      <div className="text-center">
                        <span
                          className={`text-xs font-extrabold ${
                            set.reps >= 8 && set.reps <= 15
                              ? 'text-emerald-400'
                              : 'text-amber-300'
                          }`}
                        >
                          {set.reps}
                        </span>
                        <span className="block text-[9px] text-slate-400 -mt-1">
                          reps
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateSet(activePlan.id, exercise.id, set.setNumber, {
                            reps: set.reps + 1,
                          })
                        }
                        aria-label={`Aumentar repetições da série ${set.setNumber}`}
                        className="flex h-7 w-6 items-center justify-center rounded bg-slate-800 text-emerald-400 active:scale-95 cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    <div className="col-span-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateSet(activePlan.id, exercise.id, set.setNumber, {
                            completed: !set.completed,
                          })
                        }
                        aria-label={`Marcar série ${set.setNumber} como concluída`}
                        className={`flex h-9 w-full items-center justify-center rounded-lg border font-bold transition active:scale-95 cursor-pointer ${
                          set.completed
                            ? 'border-emerald-400 bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                            : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Check className="h-4 w-4 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};
