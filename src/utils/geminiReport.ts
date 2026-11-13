import { AppState, FoodItem } from '../types';
import { MEAL_WINDOWS } from '../data/initialData';

export function generateGeminiMarkdownReport(state: AppState): string {
  const {
    profile,
    selectedDate,
    foodsByDate,
    habitsByDate,
    activitiesByDate,
    workoutPlans,
    checkins,
  } = state;

  const todayFoods: FoodItem[] = foodsByDate[selectedDate] || [];
  const todayHabits = habitsByDate[selectedDate] || {
    date: selectedDate,
    waterCups250ml: 0,
    steps: 0,
    postWorkoutCardio: false,
    cardioMinutes: 20,
    machineAbs: false,
  };

  const todayActivities = activitiesByDate[selectedDate] || [];
  const todayActiveCalories = todayActivities.reduce((s, a) => s + a.caloriesBurned, 0);

  const todayTotals = todayFoods.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Défice Calórico Real: (BMR + Gasto Ativo de Atividades) - Calorias Ingeridas
  const totalExpenditure = profile.bmrKcal + todayActiveCalories;
  const netDeficit = totalExpenditure - todayTotals.calories;

  const loggedDates = Object.keys(foodsByDate).filter(
    (d) => (foodsByDate[d] || []).length > 0
  );
  const daysCount = Math.max(loggedDates.length, 1);

  const weeklyMacroSum = loggedDates.reduce(
    (acc, d) => {
      const items = foodsByDate[d] || [];
      items.forEach((it) => {
        acc.calories += it.calories;
        acc.protein += it.protein;
        acc.carbs += it.carbs;
        acc.fat += it.fat;
      });
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const avgCalories = Math.round(weeklyMacroSum.calories / daysCount);
  const avgProtein = Math.round((weeklyMacroSum.protein / daysCount) * 10) / 10;

  const todayWaterMl = todayHabits.waterCups250ml * 250;

  const activitiesLines =
    todayActivities.length > 0
      ? todayActivities
          .map(
            (a) =>
              `  - **${a.type}** (${a.timeMinutes} min${
                a.distanceKm ? ` | ${a.distanceKm.toFixed(1)} km` : ''
              }): **+${a.caloriesBurned} kcal**${a.notes ? ` — _${a.notes}_` : ''}`
          )
          .join('\n')
      : '  - _Nenhuma atividade gravada hoje._';

  const latestCheckin =
    checkins.length > 0 ? checkins[checkins.length - 1] : null;
  const firstCheckin = checkins.length > 0 ? checkins[0] : null;

  const weightDelta =
    latestCheckin && firstCheckin
      ? (latestCheckin.weightKg - firstCheckin.weightKg).toFixed(2)
      : '0.00';
  const bfDelta =
    latestCheckin && firstCheckin
      ? (latestCheckin.bodyFatPct - firstCheckin.bodyFatPct).toFixed(1)
      : '0.0';

  const workoutSummaryLines = workoutPlans.map((plan) => {
    const exSummaries = plan.exercises.map((ex) => {
      const maxWeight = ex.sets.reduce(
        (max, s) => (s.weightKg > max ? s.weightKg : max),
        0
      );
      const completedSets = ex.sets.filter((s) => s.completed).length;
      const topSet = ex.sets.reduce(
        (best, s) => (s.weightKg >= best.weightKg ? s : best),
        ex.sets[0] || { reps: 10, weightKg: 0 }
      );
      return `  - **${ex.name} (${ex.targetSets}x)**: Carga máx **${maxWeight} kg** (${topSet.reps} reps) | Séries concluídas: ${completedSets}/${ex.sets.length}`;
    });
    return `### ${plan.dayLabel} — ${plan.splitTitle}\n${exSummaries.join('\n')}`;
  });

  const windowsBreakdown = MEAL_WINDOWS.map((w) => {
    const items = todayFoods.filter((f) => f.mealWindow === w.id);
    if (items.length === 0) {
      return `- **${w.label} (${w.timeRange})**: _Sem registros até o momento_`;
    }
    const winKcal = items.reduce((s, i) => s + i.calories, 0);
    const winProt = items.reduce((s, i) => s + i.protein, 0).toFixed(1);
    const listStr = items
      .map((i) => `${i.name} (${i.calories} kcal, ${i.protein}g P)`)
      .join('; ');
    return `- **${w.label} (${w.timeRange})** [${winKcal} kcal | ${winProt}g P]: ${listStr}`;
  }).join('\n');

  const proteinStatus =
    todayTotals.protein >= profile.proteinTargetMinG &&
    todayTotals.protein <= profile.proteinTargetMaxG
      ? 'META BATIDA (Dentro da janela ideal 160g–180g)'
      : todayTotals.protein > profile.proteinTargetMaxG
      ? 'ACIMA DA FAIXA (>180g)'
      : `EM CONSTRUÇÃO (${todayTotals.protein.toFixed(1)}g de ${profile.proteinTargetMinG}g–${profile.proteinTargetMaxG}g)`;

  return `# Relatório Sincronizado FitPulse Pro -> Gemini
**Data de Referência:** ${selectedDate} | **Modo:** ${
    profile.observerMode
      ? 'Modo Observador Ativo (1º Mês - Linha de Base Sem Alertas Punitivos)'
      : 'Modo Meta Ativa'
  }

---

## 1. Histórico & Último Check-in de Bioimpedância (Zepp Life OCR)
- **Avaliações Históricas:** ${checkins
    .map((c) => `${c.weekLabel} (${c.weightKg.toFixed(2)}kg / ${c.bodyFatPct.toFixed(1)}% BF)`)
    .join(' -> ')}
${
  latestCheckin
    ? `- **Última Avaliação (${latestCheckin.date} - ${latestCheckin.weekLabel}):**
- **Peso Corporal:** ${latestCheckin.weightKg.toFixed(2)} kg (Variação desde 20/08/2026: ${weightDelta} kg)
- **Gordura Corporal (BF):** ${latestCheckin.bodyFatPct.toFixed(1)}% (Variação desde 20/08/2026: ${bfDelta}%)
- **Massa Muscular:** ${latestCheckin.muscleMassKg.toFixed(2)} kg | **Água Corporal:** ${latestCheckin.waterPct.toFixed(1)}%
- **Metabolismo Basal (BMR):** ${latestCheckin.bmrKcal} kcal | **IMC:** ${latestCheckin.bmi.toFixed(1)}
- **Gordura Visceral:** Nível ${latestCheckin.visceralFat} | **Proteína Corporal:** ${latestCheckin.proteinPct.toFixed(1)}% | **Massa Óssea:** ${latestCheckin.boneMassKg.toFixed(2)} kg`
    : '- Sem check-ins registrados.'
}

---

## 2. Balanço Energético & Défice Calórico Diário
- **Metabolismo Basal (BMR):** ${profile.bmrKcal} kcal
- **Gasto Calórico Ativo (Cardio & Desporto):** +${todayActiveCalories} kcal
- **Gasto Energético Total Estimado:** **${totalExpenditure} kcal**
- **Calorias Ingeridas:** **${todayTotals.calories} kcal**
- **Défice Calórico Diário Controlado:** **\`${netDeficit >= 0 ? `Défice de -${netDeficit} kcal` : `Superávit de +${Math.abs(netDeficit)} kcal`}\`**

### Registo de Atividade Cardiorrespiratória e Desportiva Hoje
${activitiesLines}

---

## 3. Balanço de Macronutrientes & Hidratação
- **Proteínas no Dia:** **${todayTotals.protein.toFixed(1)}g** (Meta: ${profile.proteinTargetMinG}g a ${profile.proteinTargetMaxG}g) — _${proteinStatus}_
- **Carboidratos no Dia:** ${todayTotals.carbs.toFixed(1)}g / ${profile.carbsBudgetG}g | **Gorduras no Dia:** ${todayTotals.fat.toFixed(1)}g / ${profile.fatBudgetG}g
- **Média Semanal (${daysCount} dia(s)):** ${avgCalories} kcal/dia | **${avgProtein}g Proteína/dia**
- **Água Consumida Hoje:** ${todayWaterMl} ml (${todayHabits.waterCups250ml} copos de 250ml) / Meta: ${profile.waterGoalMl} ml
- **Passos Diários Hoje:** ${todayHabits.steps.toLocaleString('pt-BR')} passos

### Distribuição nas Janelas da Rotina (${selectedDate})
${windowsBreakdown}

---

## 4. Divisão de Treino (Push / Pull / Legs - 5 Dias + Core Diário Fixo)
${workoutSummaryLines.join('\n\n')}
`;
}
