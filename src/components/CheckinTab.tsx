import React, { useState, useRef } from 'react';
import {
  Scale,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  Calendar,
  Loader2,
  Image as ImageIcon,
  Cpu,
} from 'lucide-react';
import { AppState, BioimpedanceCheckin } from '../types';
import { extractZeppLifeFromImageWithGemini } from '../services/geminiVisionOcr';

interface CheckinTabProps {
  state: AppState;
  onAddCheckin: (checkin: Omit<BioimpedanceCheckin, 'id'>) => void;
}

export const CheckinTab: React.FC<CheckinTabProps> = ({ state, onAddCheckin }) => {
  const { checkins, syncConfig, selectedDate } = state;

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [ocrStatusMessage, setOcrStatusMessage] = useState<string | null>(null);
  const [lastExtracted, setLastExtracted] = useState<Omit<
    BioimpedanceCheckin,
    'id'
  > | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const processSelectedFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setOcrStatusMessage('Por favor, envie uma imagem válida (PNG, JPG ou WEBP) do app Zepp Life.');
      return;
    }

    setUploadedFileName(file.name);
    const objectUrl = URL.createObjectURL(file);
    setPreviewImageUrl(objectUrl);
    setIsProcessingOcr(true);
    setOcrStatusMessage(null);

    try {
      const result = await extractZeppLifeFromImageWithGemini(
        file,
        syncConfig.geminiApiKey,
        selectedDate
      );

      const newCheckin: Omit<BioimpedanceCheckin, 'id'> = {
        ...result.metrics,
        source: 'gemini_ocr',
      };

      onAddCheckin(newCheckin);
      setLastExtracted(newCheckin);
      setOcrStatusMessage(result.providerMessage);
    } catch (err: any) {
      setOcrStatusMessage(
        `Falha ao processar print: ${err?.message || 'Erro inesperado no OCR'}`
      );
    } finally {
      setIsProcessingOcr(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Simulador de Print Oficial Zepp Life em 1 clique para demonstração imediata
  const handleSimulateSampleZeppPrint = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 480, 300);
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('Zepp Life • Relatório de Composição Corporal', 24, 42);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '16px monospace';
      ctx.fillText('Peso: 89.20 kg | IMC: 28.1 | Gordura: 25.7%', 24, 95);
      ctx.fillText('Água: 51.0% | Músculo: 62.95 kg | BMR: 1895 kcal', 24, 140);
      ctx.fillText('Gordura Visceral: 10 | Proteína: 16.5% | Óssea: 3.31 kg', 24, 185);
    }
    canvas.toBlob((blob) => {
      if (blob) {
        const sampleFile = new File([blob], 'zepp_life_print_checkin.png', {
          type: 'image/png',
        });
        processSelectedFile(sampleFile);
      }
    }, 'image/png');
  };

  const renderLineChart = (
    title: string,
    subtitle: string,
    unit: string,
    values: { label: string; value: number }[],
    strokeColor: string,
    fillGradientId: string
  ) => {
    if (values.length === 0) return null;
    const width = 340;
    const height = 140;
    const padX = 34;
    const padY = 26;

    const nums = values.map((v) => v.value);
    const minVal = Math.min(...nums) - 0.4;
    const maxVal = Math.max(...nums) + 0.4;
    const range = Math.max(0.5, maxVal - minVal);

    const points = values.map((v, idx) => {
      const x =
        values.length === 1
          ? width / 2
          : padX + (idx / (values.length - 1)) * (width - padX * 2);
      const y =
        height - padY - ((v.value - minVal) / range) * (height - padY * 2);
      return { x, y, ...v };
    });

    const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
    const areaPoints = `${points[0].x},${height - padY} ${polylinePoints} ${
      points[points.length - 1].x
    },${height - padY}`;

    const firstVal = values[0].value;
    const lastVal = values[values.length - 1].value;
    const diff = (lastVal - firstVal).toFixed(2);

    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-bold text-white">{title}</h3>
            <p className="text-[11px] text-slate-400">{subtitle}</p>
          </div>
          <span className="rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1 text-xs font-bold text-emerald-400">
            {Number(diff) > 0 ? `+${diff}` : diff} {unit}
          </span>
        </div>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-36 overflow-visible"
          role="img"
          aria-label={title}
        >
          <defs>
            <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.32" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

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

          {points.length > 1 && (
            <polygon points={areaPoints} fill={`url(#${fillGradientId})`} />
          )}

          {points.length > 1 && (
            <polyline
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polylinePoints}
            />
          )}

          {points.map((pt, idx) => (
            <g key={idx}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r="4.5"
                fill="#020617"
                stroke={strokeColor}
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
                {pt.value}
                {unit}
              </text>
              <text
                x={pt.x}
                y={height - 6}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="9"
              >
                {pt.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-6">
      {/* 1. GRÁFICOS DE EVOLUÇÃO COM AS DATAS REAIS CORRIGIDAS (20/AGO, 28/AGO, 17/SET/2026) */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {renderLineChart(
          'Evolução do Peso Corporal (kg)',
          'Avaliações reais: 20/Ago, 28/Ago e 17/Set/2026',
          'kg',
          checkins.map((c) => ({ label: c.weekLabel, value: c.weightKg })),
          '#10b981',
          'weightGrad'
        )}

        {renderLineChart(
          'Evolução da Gordura Corporal (%)',
          'Percentual de BF registrado na balança Zepp Life',
          '%',
          checkins.map((c) => ({ label: c.weekLabel, value: c.bodyFatPct })),
          '#f59e0b',
          'bfGrad'
        )}
      </section>

      {/* 2. AUTOMAÇÃO DE CHECK-IN: ZEPP LIFE OCR COM GEMINI VISION API (SEM DIGITAÇÃO MANUAL) */}
      <section
        aria-label="Upload de Print Zepp Life OCR com Gemini Vision"
        className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/35 via-slate-900 to-slate-900 p-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">
                  Automação de Check-in — Zepp Life OCR (Gemini Vision)
                </h2>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  JSON Schema
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Arraste ou selecione o print do app Zepp Life. O Gemini Vision extrai automaticamente as 9 métricas e salva no banco.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSimulateSampleZeppPrint}
            disabled={isProcessingOcr}
            className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 cursor-pointer"
          >
            <Sparkles className="inline h-3.5 w-3.5 mr-1" />
            Testar com Print Exemplo
          </button>
        </div>

        {/* Zona Drag-and-Drop Limpa */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          aria-label="Área de upload drag-and-drop para print do aplicativo Zepp Life"
          className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition cursor-pointer ${
            isDragging
              ? 'border-emerald-400 bg-emerald-500/15'
              : 'border-slate-700 bg-slate-950/80 hover:border-emerald-500/60 hover:bg-slate-950'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="sr-only"
          />

          {isProcessingOcr ? (
            <div className="flex flex-col items-center py-3">
              <Loader2 className="h-9 w-9 animate-spin text-emerald-400" />
              <span className="mt-2.5 text-sm font-bold text-white">
                Processando print no Gemini Vision (gemini-3.8-flash)...
              </span>
              <span className="mt-1 text-xs text-slate-400">
                Extraindo Peso, IMC, BF%, Água, BMR, Gordura Visceral, Músculo, Proteína e Massa Óssea via JSON estruturado
              </span>
            </div>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 group-hover:scale-105 transition">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-bold text-white">
                Arraste e solte o print do Zepp Life aqui ou toque para escolher
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Suporta capturas de tela PNG, JPG ou WEBP diretamente da galeria do celular
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-1.5 text-[10px] text-slate-400">
                {[
                  'Peso',
                  'IMC',
                  'Gordura Corporal',
                  'Água',
                  'Metabolismo Basal',
                  'Gordura Visceral',
                  'Músculo',
                  'Proteína',
                  'Massa Óssea',
                ].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-slate-800 bg-slate-900 px-2 py-0.5 text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Resultado Extraído do Print via JSON Estruturado */}
        {ocrStatusMessage && (
          <div
            role="status"
            aria-live="polite"
            className="mt-3 rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-3 text-xs text-emerald-200"
          >
            <div className="flex items-center gap-2 font-bold text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{ocrStatusMessage}</span>
            </div>
          </div>
        )}

        {lastExtracted && (
          <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" />
                JSON Estruturado Extraído & Persistido ({uploadedFileName})
              </span>
              {previewImageUrl && (
                <img
                  src={previewImageUrl}
                  alt="Preview do print enviado"
                  className="h-8 w-14 rounded object-cover border border-slate-700"
                />
              )}
            </div>
            <pre className="custom-scroller max-h-40 overflow-y-auto rounded-lg bg-slate-900/90 p-2.5 text-[11px] text-emerald-300 font-mono">
              {JSON.stringify(
                {
                  weightKg: lastExtracted.weightKg,
                  bmi: lastExtracted.bmi,
                  bodyFatPct: lastExtracted.bodyFatPct,
                  waterPct: lastExtracted.waterPct,
                  bmrKcal: lastExtracted.bmrKcal,
                  visceralFat: lastExtracted.visceralFat,
                  muscleMassKg: lastExtracted.muscleMassKg,
                  proteinPct: lastExtracted.proteinPct,
                  boneMassKg: lastExtracted.boneMassKg,
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </section>

      {/* 3. HISTÓRICO COMPLETO DE CHECK-INS (20/AGO, 28/AGO, 17/SET/2026) */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-emerald-400" />
          Histórico de Bioimpedância ({checkins.length} avaliações registradas)
        </h3>

        <div className="space-y-2.5">
          {[...checkins].reverse().map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-800 bg-slate-950/80 p-3"
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">
                    {item.weekLabel}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    ({item.date})
                  </span>
                  {item.source === 'gemini_ocr' && (
                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-300">
                      Gemini OCR
                    </span>
                  )}
                </div>
                <span className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-xs font-bold text-emerald-300">
                  {item.weightKg.toFixed(2)} kg • {item.bodyFatPct.toFixed(1)}% BF
                </span>
              </div>

              <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-slate-300 sm:grid-cols-7">
                <div>
                  <span className="text-slate-500 block text-[10px]">Músculo</span>
                  <strong className="text-emerald-400">{item.muscleMassKg} kg</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Água</span>
                  <strong className="text-sky-400">{item.waterPct}%</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">BMR</span>
                  <strong>{item.bmrKcal} kcal</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">IMC</span>
                  <strong>{item.bmi}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Visceral</span>
                  <strong>Nível {item.visceralFat}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Proteína</span>
                  <strong>{item.proteinPct}%</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Óssea</span>
                  <strong>{item.boneMassKg} kg</strong>
                </div>
              </div>
              {item.notes && (
                <p className="mt-2 text-[11px] text-slate-400 italic">
                  “{item.notes}”
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
