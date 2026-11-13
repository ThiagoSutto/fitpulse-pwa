export interface OpenFoodFactsProduct {
  id: string;
  name: string;
  brand: string;
  servingSizeLabel: string;
  defaultPortionGrams: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  sourceType: 'taco' | 'openfoodfacts';
}

export const TACO_BRAZIL_DATABASE: OpenFoodFactsProduct[] = [
  {
    id: 'taco_frango_grelhado',
    name: 'Peito de Frango Grelhado (Sem Pele)',
    brand: 'Tabela TACO • UNICAMP',
    servingSizeLabel: '100g (Porção padrão: 150g)',
    defaultPortionGrams: 150,
    caloriesPer100g: 159,
    proteinPer100g: 32.0,
    carbsPer100g: 0.0,
    fatPer100g: 2.5,
    sourceType: 'taco',
  },
  {
    id: 'taco_patinho_grelhado',
    name: 'Carne Bovina Patinho Grelhado',
    brand: 'Tabela TACO • UNICAMP',
    servingSizeLabel: '100g (Porção padrão: 150g)',
    defaultPortionGrams: 150,
    caloriesPer100g: 219,
    proteinPer100g: 35.9,
    carbsPer100g: 0.0,
    fatPer100g: 7.3,
    sourceType: 'taco',
  },
  {
    id: 'taco_alcatra_grelhada',
    name: 'Carne Bovina Alcatra Grelhada (Sem Gordura)',
    brand: 'Tabela TACO • UNICAMP',
    servingSizeLabel: '100g (Porção padrão: 150g)',
    defaultPortionGrams: 150,
    caloriesPer100g: 241,
    proteinPer100g: 31.9,
    carbsPer100g: 0.0,
    fatPer100g: 11.6,
    sourceType: 'taco',
  },
  {
    id: 'taco_arroz_branco',
    name: 'Arroz Tipo 1 Cozido',
    brand: 'Tabela TACO • UNICAMP',
    servingSizeLabel: '100g (Porção padrão: 150g)',
    defaultPortionGrams: 150,
    caloriesPer100g: 128,
    proteinPer100g: 2.5,
    carbsPer100g: 28.1,
    fatPer100g: 0.2,
    sourceType: 'taco',
  },
  {
    id: 'taco_arroz_integral',
    name: 'Arroz Integral Cozido',
    brand: 'Tabela TACO • UNICAMP',
    servingSizeLabel: '100g (Porção padrão: 150g)',
    defaultPortionGrams: 150,
    caloriesPer100g: 124,
    proteinPer100g: 2.6,
    carbsPer100g: 25.8,
    fatPer100g: 1.0,
    sourceType: 'taco',
  },
  {
    id: 'taco_feijao_carioca',
    name: 'Feijão Carioca Cozido (50% Grão / 50% Caldo)',
    brand: 'Tabela TACO • UNICAMP',
    servingSizeLabel: '100g (1 concha média)',
    defaultPortionGrams: 100,
    caloriesPer100g: 76,
    proteinPer100g: 4.8,
    carbsPer100g: 13.6,
    fatPer100g: 0.5,
    sourceType: 'taco',
  },
  {
    id: 'taco_feijao_preto',
    name: 'Feijão Preto Cozido',
    brand: 'Tabela TACO • UNICAMP',
    servingSizeLabel: '100g (1 concha média)',
    defaultPortionGrams: 100,
    caloriesPer100g: 77,
    proteinPer100g: 4.5,
    carbsPer100g: 14.0,
    fatPer100g: 0.5,
    sourceType: 'taco',
  },
  {
    id: 'taco_ovo_inteiro',
    name: 'Ovo de Galinha Inteiro Cozido / Mexido',
    brand: 'Tabela TACO • UNICAMP',
    servingSizeLabel: '100g (2 ovos grandes)',
    defaultPortionGrams: 150,
    caloriesPer100g: 146,
    proteinPer100g: 13.3,
    carbsPer100g: 0.6,
    fatPer100g: 9.5,
    sourceType: 'taco',
  },
  {
    id: 'taco_pao_forma_integral',
    name: 'Pão de Forma Integral',
    brand: 'Tabela TACO • UNICAMP',
    servingSizeLabel: '50g (2 fatias)',
    defaultPortionGrams: 50,
    caloriesPer100g: 253,
    proteinPer100g: 9.4,
    carbsPer100g: 49.9,
    fatPer100g: 3.7,
    sourceType: 'taco',
  },
  {
    id: 'taco_pao_frances',
    name: 'Pão Francês (1 unidade = 50g)',
    brand: 'Tabela TACO • UNICAMP',
    servingSizeLabel: '50g (1 unidade)',
    defaultPortionGrams: 50,
    caloriesPer100g: 300,
    proteinPer100g: 8.0,
    carbsPer100g: 58.6,
    fatPer100g: 3.1,
    sourceType: 'taco',
  },
  {
    id: 'taco_macarrao_trigo',
    name: 'Macarrão de Trigo Cozido',
    brand: 'Tabela TACO • UNICAMP',
    servingSizeLabel: '150g (1 prato raso)',
    defaultPortionGrams: 150,
    caloriesPer100g: 158,
    proteinPer100g: 5.8,
    carbsPer100g: 30.9,
    fatPer100g: 0.9,
    sourceType: 'taco',
  },
  {
    id: 'taco_batata_doce',
    name: 'Batata-Doce Cozida',
    brand: 'Tabela TACO • UNICAMP',
    servingSizeLabel: '150g',
    defaultPortionGrams: 150,
    caloriesPer100g: 77,
    proteinPer100g: 0.6,
    carbsPer100g: 18.4,
    fatPer100g: 0.1,
    sourceType: 'taco',
  },
  {
    id: 'taco_batata_inglesa',
    name: 'Batata Inglesa Cozida / Airfryer',
    brand: 'Tabela TACO • UNICAMP',
    servingSizeLabel: '150g',
    defaultPortionGrams: 150,
    caloriesPer100g: 52,
    proteinPer100g: 1.2,
    carbsPer100g: 11.9,
    fatPer100g: 0.0,
    sourceType: 'taco',
  },
  {
    id: 'taco_mandioca_cozida',
    name: 'Mandioca (Aipim) Cozida',
    brand: 'Tabela TACO • UNICAMP',
    servingSizeLabel: '100g',
    defaultPortionGrams: 100,
    caloriesPer100g: 125,
    proteinPer100g: 0.6,
    carbsPer100g: 30.1,
    fatPer100g: 0.3,
    sourceType: 'taco',
  },
  {
    id: 'taco_aveia_flocos',
    name: 'Aveia em Flocos Crua',
    brand: 'Tabela TACO • UNICAMP',
    servingSizeLabel: '30g (2 colheres sopa)',
    defaultPortionGrams: 30,
    caloriesPer100g: 394,
    proteinPer100g: 13.9,
    carbsPer100g: 66.6,
    fatPer100g: 8.5,
    sourceType: 'taco',
  },
  {
    id: 'taco_banana_prata',
    name: 'Banana Prata / Nanica In Natura',
    brand: 'Tabela TACO • UNICAMP',
    servingSizeLabel: '90g (1 unidade grande)',
    defaultPortionGrams: 90,
    caloriesPer100g: 98,
    proteinPer100g: 1.3,
    carbsPer100g: 26.0,
    fatPer100g: 0.1,
    sourceType: 'taco',
  },
  {
    id: 'taco_maca_fuji',
    name: 'Maçã Fuji com Casca',
    brand: 'Tabela TACO • UNICAMP',
    servingSizeLabel: '130g (1 unidade média)',
    defaultPortionGrams: 130,
    caloriesPer100g: 56,
    proteinPer100g: 0.3,
    carbsPer100g: 15.2,
    fatPer100g: 0.0,
    sourceType: 'taco',
  },
  {
    id: 'taco_whey_concentrado',
    name: 'Whey Protein Concentrado 80%',
    brand: 'Suplemento Padrão / Growth',
    servingSizeLabel: '30g (1 scoop)',
    defaultPortionGrams: 30,
    caloriesPer100g: 400,
    proteinPer100g: 80.0,
    carbsPer100g: 7.5,
    fatPer100g: 5.5,
    sourceType: 'taco',
  },
  {
    id: 'taco_iogurte_natural_desnatado',
    name: 'Iogurte Natural Desnatado',
    brand: 'Tabela TACO • UNICAMP',
    servingSizeLabel: '160g (1 copo)',
    defaultPortionGrams: 160,
    caloriesPer100g: 41,
    proteinPer100g: 5.8,
    carbsPer100g: 4.3,
    fatPer100g: 0.3,
    sourceType: 'taco',
  },
  {
    id: 'taco_queijo_minas_frescal',
    name: 'Queijo Minas Frescal',
    brand: 'Tabela TACO • UNICAMP',
    servingSizeLabel: '30g (1 fatia média)',
    defaultPortionGrams: 30,
    caloriesPer100g: 264,
    proteinPer100g: 17.4,
    carbsPer100g: 3.2,
    fatPer100g: 20.2,
    sourceType: 'taco',
  },
  {
    id: 'taco_queijo_mussarela',
    name: 'Queijo Mussarela Fatiado',
    brand: 'Tabela TACO • UNICAMP',
    servingSizeLabel: '30g (2 fatias)',
    defaultPortionGrams: 30,
    caloriesPer100g: 330,
    proteinPer100g: 22.6,
    carbsPer100g: 3.0,
    fatPer100g: 25.2,
    sourceType: 'taco',
  },
  {
    id: 'taco_tilapia_grelhada',
    name: 'Filé de Tilápia / Merluza Grelhada',
    brand: 'Tabela TACO • UNICAMP',
    servingSizeLabel: '150g',
    defaultPortionGrams: 150,
    caloriesPer100g: 128,
    proteinPer100g: 26.2,
    carbsPer100g: 0.0,
    fatPer100g: 2.7,
    sourceType: 'taco',
  },
  {
    id: 'taco_pasta_amendoim',
    name: 'Pasta de Amendoim Integral Torrado',
    brand: 'Tabela TACO • UNICAMP',
    servingSizeLabel: '20g (1 colher de sopa)',
    defaultPortionGrams: 20,
    caloriesPer100g: 595,
    proteinPer100g: 28.0,
    carbsPer100g: 18.0,
    fatPer100g: 46.0,
    sourceType: 'taco',
  },
  {
    id: 'taco_leite_desnatado',
    name: 'Leite de Vaca Desnatado UHT',
    brand: 'Tabela TACO • UNICAMP',
    servingSizeLabel: '200ml (1 copo)',
    defaultPortionGrams: 200,
    caloriesPer100g: 34,
    proteinPer100g: 3.3,
    carbsPer100g: 4.9,
    fatPer100g: 0.2,
    sourceType: 'taco',
  },
  {
    id: 'taco_tapioca_goma',
    name: 'Goma de Tapioca Hidratada',
    brand: 'Tabela TACO • UNICAMP',
    servingSizeLabel: '60g (3 colheres de sopa)',
    defaultPortionGrams: 60,
    caloriesPer100g: 240,
    proteinPer100g: 0.1,
    carbsPer100g: 59.8,
    fatPer100g: 0.0,
    sourceType: 'taco',
  },
];

function normalizeText(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export async function searchFoodDatabase(
  query: string
): Promise<{ results: OpenFoodFactsProduct[]; isOnlineOpenFoodFacts: boolean }> {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return { results: TACO_BRAZIL_DATABASE.slice(0, 8), isOnlineOpenFoodFacts: false };
  }

  const normalizedQuery = normalizeText(cleanQuery);
  const localTacoMatches = TACO_BRAZIL_DATABASE.filter(
    (item) =>
      normalizeText(item.name).includes(normalizedQuery) ||
      normalizeText(item.brand).includes(normalizedQuery)
  );

  // Consulta também a API pública e gratuita do Open Food Facts em paralelo
  const endpoint = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
    cleanQuery
  )}&search_simple=1&action=process&json=1&page_size=10`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(endpoint, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const rawProducts = Array.isArray(data?.products) ? data.products : [];

      const offProducts: OpenFoodFactsProduct[] = rawProducts
        .map((p: Record<string, any>, idx: number) => {
          const nutriments = p.nutriments || {};
          const kcal100 =
            Number(nutriments['energy-kcal_100g']) ||
            Number(nutriments['energy-kcal_serving']) ||
            (Number(nutriments['energy_100g'])
              ? Math.round(Number(nutriments['energy_100g']) / 4.184)
              : 0);

          const protein100 = Number(
            nutriments['proteins_100g'] ?? nutriments['proteins_serving'] ?? 0
          );
          const carbs100 = Number(
            nutriments['carbohydrates_100g'] ?? nutriments['carbohydrates_serving'] ?? 0
          );
          const fat100 = Number(
            nutriments['fat_100g'] ?? nutriments['fat_serving'] ?? 0
          );

          const productName =
            p.product_name_pt || p.product_name || p.generic_name_pt || p.generic_name || '';

          return {
            id: String(p.code || `off_${idx}_${Date.now()}`),
            name: String(productName).trim(),
            brand: `${String(p.brands || 'Open Food Facts').split(',')[0].trim()} • OFF API`,
            servingSizeLabel: String(p.serving_size || '100g'),
            defaultPortionGrams: 100,
            caloriesPer100g: Math.round(kcal100),
            proteinPer100g: Math.round(protein100 * 10) / 10,
            carbsPer100g: Math.round(carbs100 * 10) / 10,
            fatPer100g: Math.round(fat100 * 10) / 10,
            sourceType: 'openfoodfacts' as const,
          };
        })
        .filter(
          (item: OpenFoodFactsProduct) =>
            item.name.length > 1 &&
            (item.caloriesPer100g > 0 || item.proteinPer100g > 0 || item.carbsPer100g > 0)
        );

      const combined = [...localTacoMatches, ...offProducts].slice(0, 12);
      if (combined.length > 0) {
        return {
          results: combined,
          isOnlineOpenFoodFacts: offProducts.length > 0,
        };
      }
    }
  } catch {
    // Segue com os resultados da Tabela TACO local caso sem conexão externa
  }

  return {
    results:
      localTacoMatches.length > 0
        ? localTacoMatches
        : TACO_BRAZIL_DATABASE.slice(0, 8),
    isOnlineOpenFoodFacts: false,
  };
}
