import React, { useState } from 'react';
import {
  Scale,
  PlusCircle,
  Calendar,
  CheckCircle2,
  TrendingDown,
  Clock,
} from 'lucide-react';
import { AppState, WeightCheckin } from '../types';

interface CheckinTabProps {
  state: AppState;
  onAddCheckin: (checkin: Omit<WeightCheckin, 'id'>) => void;
}

export const CheckinTab: React.FC<CheckinTabProps> = ({ state, onAddCheckin }) => {
  const { checkins, profile, selectedDate } = state;

  const latestWeight = checkins.length > 0 ? checkins[checkins.length - 1].weightKg : profile.weightKg;
  const [weightInput, setWeightInput] = useState<string>(String(latestWeight));
  const [dateInput, setDateInput] = useState<string>(selectedDate);
  const [notesInput, setNotesInput] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(weightInput.replace(',', '.'));
    if (isNaN(val) || val <= 0) return;

    // Formata o rótulo: Ex: "13/Nov/2026"
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const parts = dateInput.split('-');
    let weekLabel = dateInput;
    if (parts.length === 3) {
      const day = parts[2];
      const monthIdx = Math.max(0, Math.min(11, parseInt(parts[1], 10) - 1));
      const year = parts[0];
      weekLabel = `${day}/${months[monthIdx]}/${year}`;
    }

    onAddCheckin({
      date: dateInput,
      weekLabel,
      weightKg: val,
      notes: notesInput.trim() || undefined,
    });

    setNotesInput('');
    setSuccessToast(`Peso de ${val.toFixed(2)} kg salvo com sucesso!`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Renderizador do gráfico de evolução do peso corporal
  const renderWeightChart = () => {
    if (checkins.length === 0) return null;
    const width = 340;
    const height = 150;
    const padX = 36;
    const padY = 26;

    const nums = checkins.map((c) => c.weightKg);
    const minVal = Math.min(...nums) - 0.5;
    const maxVal = Math.max(...nums) + 0.5;
    const range = Math.max(0.5, maxVal - minVal);

    const points = checkins.map((c, idx) => {
      const x =
        checkins.length === 1
          ? width / 2
          : padX + (idx / (checkins.length - 1)) * (width - padX * 2);
      const y =
        height - padY - ((c.weightKg - minVal) / range) * (height - padY * 2);
      return { x, y, ...c };
    });

    const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
    const areaPoints = `${points[0].x},${height - padY} ${polylinePoints} ${
      points[points.length - 1].x
    },${height - padY}`;

    const firstVal = checkins[0].weightKg;
    const lastVal = checkins[checkins.length - 1].weightKg;
    const diff = (lastVal - firstVal).toFixed(2);
    const isLoss = Number(diff) < 0;

    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <TrendingDown className="h-4 w-4 text-emerald-400" />
              <span>Evolução do Peso Corporal</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Histórico de pesagens na balança
            </p>
          </div>
          <span
            className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${
              isLoss
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                : 'border-slate-700 bg-slate-950 text-slate-300'
            }`}
          >
            {Number(diff) > 0 ? `+${diff}` : diff} kg
          </span>
        </div>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-36 overflow-visible"
          role="img"
          aria-label="Gráfico de evolução do peso corporal"
        >
          <defs>
            <linearGradient id="weightLineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Linhas guia horizontais */}
          <line
            x1={padX}
            y1={padY}
            x2={width - padX}
            y2={padY}
            stroke="#1e293b"
            strokeDasharray="3 3"
          />
          <line
            x1={padX}
            y1={height / 2}
            x2={width - padX}
            y2={height / 2}
            stroke="#1e293b"
            strokeDasharray="3 3"
          />
          <line
            x1={padX}
            y1={height - padY}
            x2={width - padX}
            y2={height - padY}
            stroke="#1e293b"
          />

          {/* Área sombreada */}
          {points.length > 1 && (
            <polygon points={areaPoints} fill="url(#weightLineGrad)" />
          )}

          {/* Linha principal */}
          {points.length > 1 && (
            <polyline
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polylinePoints}
            />
          )}

          {/* Pontos com rótulos numéricos */}
          {points.map((pt, idx) => (
            <g key={idx}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r="4.5"
                fill="#020617"
                stroke="#10b981"
                strokeWidth="2.5"
              />
              <text
                x={pt.x}
                y={pt.y - 9}
                textAnchor="middle"
                fill="#f8fafc"
                fontSize="10"
                fontWeight="700"
              >
                {pt.weightKg.toFixed(1)}kg
              </text>
              <text
                x={pt.x}
                y={height - 6}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="9"
              >
                {pt.weekLabel.split('/')[0] + '/' + pt.weekLabel.split('/')[1]}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-6">
      {/* 1. NOVO FORMULÁRIO SIMPLIFICADO: REGISTRO DE PESO (BALANÇA COMUM) */}
      <section
        aria-label="Registro de Peso Diário / Semanal"
        className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/25 via-slate-900 to-slate-900 p-5 shadow-lg shadow-emerald-950/20"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
            <Scale className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">
              Registro de Peso
            </h2>
            <p className="text-xs text-slate-300">
              Check-in rápido na balança para atualizar a linha de base e os gráficos
            </p>
          </div>
        </div>

        {successToast && (
          <div
            role="status"
            aria-live="polite"
            className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-3 text-xs font-bold text-emerald-200"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{successToast}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo Central de Grande Destaque: Peso (kg) */}
          <div className="rounded-2xl border-2 border-emerald-500/50 bg-slate-950/90 p-4 text-center shadow-inner">
            <label
              htmlFor="weight-input"
              className="block text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1"
            >
              Peso Corporal Atual (Balança) *
            </label>
            <div className="flex items-baseline justify-center gap-2 my-1">
              <input
                id="weight-input"
                name="weightKg"
                type="number"
                inputMode="decimal"
                step="0.1"
                required
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder="89.5"
                className="w-48 bg-transparent text-center text-4xl sm:text-5xl font-black text-white focus:outline-none placeholder:text-slate-700"
              />
              <span className="text-lg font-bold text-emerald-400">kg</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Último registo: {latestWeight.toFixed(2)} kg
            </p>
          </div>

          {/* Data da Pesagem e Observação */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="checkin-date"
                className="block text-xs font-semibold text-slate-300 mb-1"
              >
                Data da Pesagem
              </label>
              <div className="relative flex items-center rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
                <Calendar className="h-4 w-4 text-emerald-400 mr-2 shrink-0" />
                <input
                  id="checkin-date"
                  name="date"
                  type="date"
                  required
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="checkin-notes"
                className="block text-xs font-semibold text-slate-300 mb-1"
              >
                Observação (Opcional)
              </label>
              <input
                id="checkin-notes"
                name="notes"
                type="text"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="Ex: Em jejum, pós-treino..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60"
              />
            </div>
          </div>

          <button
            type="submit"
            className="touch-target flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-sm font-bold text-slate-950 hover:bg-emerald-400 active:scale-[0.99] transition cursor-pointer shadow-md shadow-emerald-500/20"
          >
            <PlusCircle className="h-4 w-4 stroke-[2.5]" />
            <span>Salvar Peso</span>
          </button>
        </form>
      </section>

      {/* 2. GRÁFICO DE EVOLUÇÃO DO PESO */}
      <section aria-label="Gráfico de Evolução">
        {renderWeightChart()}
      </section>

      {/* 3. LISTA DE HISTÓRICO DE PESAGENS */}
      <section
        aria-label="Histórico de Pesagens"
        className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-emerald-400" />
            Histórico de Pesagens ({checkins.length} registos)
          </h3>
          <span className="text-[11px] text-slate-500">Balança comum</span>
        </div>

        <div className="space-y-2">
          {[...checkins].reverse().map((item, idx) => (
            <div
              key={item.id || idx}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/80 p-3 hover:border-emerald-500/30 transition"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">
                    {item.weekLabel}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    ({item.date})
                  </span>
                </div>
                {item.notes && (
                  <p className="mt-1 text-[11px] text-slate-400 truncate">
                    “{item.notes}”
                  </p>
                )}
              </div>

              <div className="shrink-0 text-right">
                <span className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-sm font-extrabold text-emerald-300">
                  {item.weightKg.toFixed(2)} kg
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
