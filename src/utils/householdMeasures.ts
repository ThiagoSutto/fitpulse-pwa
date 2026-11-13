export type HouseholdMeasureId =
  | 'escumadeira'
  | 'colher_sopa'
  | 'concha'
  | 'file_medio'
  | 'unidade'
  | 'fatia'
  | 'colher_cha'
  | 'gramas';

export interface HouseholdMeasure {
  id: HouseholdMeasureId;
  name: string; // Ex: "Escumadeira"
  label: string; // Ex: "Escumadeira (Arroz • ~60g)"
  shortLabel: string; // Ex: "escumadeira(s)"
  grams: number; // Equivalente em gramas por 1 unidade da medida
  referenceFood: string; // Ex: "Arroz cozido"
  defaultQuantity: number; // Ex: 1 ou 100 para gramas
  step: number; // Ex: 1 ou 10 para gramas
  min: number; // Ex: 0.5 ou 1 para gramas
}

/**
 * Dicionário Oficial de Conversão de Medidas Caseiras para Gramas (g)
 * Baseado nas referências da Tabela TACO / Padrão Nutricional Brasileiro
 */
export const HOUSEHOLD_MEASURES: Record<HouseholdMeasureId, HouseholdMeasure> = {
  escumadeira: {
    id: 'escumadeira',
    name: 'Escumadeira',
    label: 'Escumadeira (~60g • Arroz)',
    shortLabel: 'escumadeira(s)',
    grams: 60,
    referenceFood: '1 Escumadeira (Arroz) = 60g',
    defaultQuantity: 1,
    step: 1,
    min: 0.5,
  },
  colher_sopa: {
    id: 'colher_sopa',
    name: 'Colher de Sopa',
    label: 'Colher de Sopa cheia (~20g)',
    shortLabel: 'colher(es) de sopa',
    grams: 20,
    referenceFood: '1 Colher de Sopa cheia = 20g',
    defaultQuantity: 1,
    step: 1,
    min: 0.5,
  },
  concha: {
    id: 'concha',
    name: 'Concha',
    label: 'Concha (~140g • Feijão)',
    shortLabel: 'concha(s)',
    grams: 140,
    referenceFood: '1 Concha (Feijão) = 140g',
    defaultQuantity: 1,
    step: 1,
    min: 0.5,
  },
  file_medio: {
    id: 'file_medio',
    name: 'Filé de Frango (Médio)',
    label: 'Filé de Frango Médio (~100g)',
    shortLabel: 'filé(s)',
    grams: 100,
    referenceFood: '1 Filé de Frango (Médio) = 100g',
    defaultQuantity: 1,
    step: 1,
    min: 0.5,
  },
  unidade: {
    id: 'unidade',
    name: 'Unidade (Ovo)',
    label: 'Unidade (~50g • Ovo)',
    shortLabel: 'unidade(s)',
    grams: 50,
    referenceFood: '1 Ovo (Unidade) = 50g',
    defaultQuantity: 1,
    step: 1,
    min: 0.5,
  },
  fatia: {
    id: 'fatia',
    name: 'Fatia',
    label: 'Fatia (~25g • Pão Integral)',
    shortLabel: 'fatia(s)',
    grams: 25,
    referenceFood: '1 Fatia (Pão de Forma Integral) = 25g',
    defaultQuantity: 1,
    step: 1,
    min: 0.5,
  },
  colher_cha: {
    id: 'colher_cha',
    name: 'Colher de Chá',
    label: 'Colher de Chá (~5g • Creatina)',
    shortLabel: 'colher(es) de chá',
    grams: 5,
    referenceFood: '1 Colher de Chá (Creatina) = 3g a 5g',
    defaultQuantity: 1,
    step: 1,
    min: 0.5,
  },
  gramas: {
    id: 'gramas',
    name: 'Gramas (g)',
    label: 'Gramas (g) • Balança de Cozinha',
    shortLabel: 'g',
    grams: 1,
    referenceFood: 'Precisão máxima via balança de cozinha',
    defaultQuantity: 100,
    step: 10,
    min: 1,
  },
};

/**
 * Lista ordenada para renderização no dropdown de seleção (select)
 */
export const HOUSEHOLD_MEASURES_LIST: HouseholdMeasure[] = [
  HOUSEHOLD_MEASURES.escumadeira,
  HOUSEHOLD_MEASURES.colher_sopa,
  HOUSEHOLD_MEASURES.concha,
  HOUSEHOLD_MEASURES.file_medio,
  HOUSEHOLD_MEASURES.unidade,
  HOUSEHOLD_MEASURES.fatia,
  HOUSEHOLD_MEASURES.colher_cha,
  HOUSEHOLD_MEASURES.gramas,
];

/**
 * Calcula o peso total em gramas baseado na medida e quantidade
 */
export function calculateTotalGrams(
  measureId: HouseholdMeasureId,
  quantity: number
): number {
  const measure = HOUSEHOLD_MEASURES[measureId] || HOUSEHOLD_MEASURES.gramas;
  const qty = Math.max(measure.min, Number(quantity) || 0);
  return Math.round(qty * measure.grams);
}

/**
 * Formata o rótulo da porção para exibição no diário
 * Ex: "2 Escumadeiras (120g)" ou "150g"
 */
export function formatPortionDescription(
  measureId: HouseholdMeasureId,
  quantity: number,
  totalGrams: number
): string {
  if (measureId === 'gramas') {
    return `${totalGrams}g`;
  }
  const measure = HOUSEHOLD_MEASURES[measureId] || HOUSEHOLD_MEASURES.gramas;
  return `${quantity} ${measure.name}${quantity > 1 && !measure.name.endsWith('s') ? 's' : ''} (~${totalGrams}g)`;
}

/**
 * Regra de três simples para cálculo de macronutrientes por gramas totais
 * a partir da tabela nutricional baseada em 100g.
 */
export function calculateMacrosFromGrams(
  totalGrams: number,
  caloriesPer100g: number,
  proteinPer100g: number,
  carbsPer100g: number,
  fatPer100g: number
): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  const factor = totalGrams / 100;
  return {
    calories: Math.round(caloriesPer100g * factor),
    protein: Math.round(proteinPer100g * factor * 10) / 10,
    carbs: Math.round(carbsPer100g * factor * 10) / 10,
    fat: Math.round(fatPer100g * factor * 10) / 10,
  };
}
