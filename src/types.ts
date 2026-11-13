export type MealWindowId = 'breakfast' | 'lunch' | 'snack' | 'dinner';

export interface MealWindowInfo {
  id: MealWindowId;
  label: string;
  timeRange: string;
  description: string;
}

export interface FoodItem {
  id: string;
  name: string;
  portionLabel: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source?: 'quick' | 'openfoodfacts' | 'taco' | 'manual';
  timestamp: string;
  mealWindow: MealWindowId;
}

export interface QuickFoodPreset {
  id: string;
  name: string;
  portionLabel: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  defaultWindow: MealWindowId;
  category: 'carb' | 'protein' | 'veggie' | 'supplement';
}

export interface UserProfile {
  name: string;
  heightCm: number;
  weightKg: number;
  bodyFatPct: number;
  bodyWaterPct: number;
  muscleMassKg: number;
  bmrKcal: number;
  visceralFat: number;
  proteinPct: number;
  boneMassKg: number;
  bmi: number;
  proteinTargetMinG: number;
  proteinTargetMaxG: number;
  carbsBudgetG: number;
  fatBudgetG: number;
  caloriesBudgetKcal: number;
  waterGoalMl: number;
  stepsGoal: number;
  observerMode: boolean;
  observerStartDate: string;
}

export interface SetEntry {
  setNumber: number;
  reps: number;
  weightKg: number;
  completed: boolean;
}

export interface ExerciseTemplate {
  id: string;
  name: string;
  muscleGroup: string;
  targetSets: number;
  targetReps: string;
  notes?: string;
  isDailyCoreRule?: boolean;
  sets: SetEntry[];
}

export type WorkoutDayId =
  | 'monday_push_a'
  | 'tuesday_pull_a'
  | 'wednesday_legs'
  | 'thursday_push_b'
  | 'saturday_pull_b';

export interface WorkoutDayPlan {
  id: WorkoutDayId;
  dayLabel: string;
  shortLabel: string;
  splitTitle: string;
  focusDescription: string;
  exercises: ExerciseTemplate[];
}

export interface DailyHabitsLog {
  date: string;
  waterCups250ml: number;
  steps: number;
  postWorkoutCardio: boolean;
  cardioMinutes: number;
  machineAbs: boolean;
  activeWorkoutDayId?: WorkoutDayId;
}

export interface BioimpedanceCheckin {
  id: string;
  date: string;
  weekLabel: string;
  weightKg: number;
  bmi: number;
  bodyFatPct: number;
  waterPct: number;
  bmrKcal: number;
  visceralFat: number;
  muscleMassKg: number;
  proteinPct: number;
  boneMassKg: number;
  source?: 'zepp_seed' | 'gemini_ocr';
  notes?: string;
}

export type ActivityType = 'Esteira' | 'Corrida no Parque' | 'Handebol' | 'Outros';

export interface CardiorespiratoryActivity {
  id: string;
  type: ActivityType;
  date: string; // YYYY-MM-DD
  timeMinutes: number;
  distanceKm?: number;
  caloriesBurned: number; // kcal principal
  timestamp: string;
  notes?: string;
}

export interface SyncConfiguration {
  provider: 'local' | 'supabase' | 'fastapi';
  supabaseUrl: string;
  supabaseAnonKey: string;
  fastApiUrl: string;
  geminiApiKey: string;
  lastSyncedAt: string | null;
}

export interface AppState {
  profile: UserProfile;
  selectedDate: string;
  foodsByDate: Record<string, FoodItem[]>;
  habitsByDate: Record<string, DailyHabitsLog>;
  activitiesByDate: Record<string, CardiorespiratoryActivity[]>;
  workoutPlans: WorkoutDayPlan[];
  checkins: BioimpedanceCheckin[];
  syncConfig: SyncConfiguration;
}
