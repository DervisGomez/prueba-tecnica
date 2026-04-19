import { Category } from '../models/category.model';
import { Task } from '../models/task.model';

export type PerfScenario = 'S1' | 'S2' | 'S3';

const SCENARIO_SIZES: Record<PerfScenario, number> = {
  S1: 100,
  S2: 1000,
  S3: 5000,
};

const CATEGORY_NAMES = [
  'Trabajo',
  'Personal',
  'Salud',
  'Compras',
  'Estudio',
  'Finanzas',
  'Hogar',
  'Viajes',
];

const CATEGORY_COLORS = [
  '#3b82f6',
  '#10b981',
  '#8b5cf6',
  '#f59e0b',
  '#ef4444',
  '#14b8a6',
  '#6366f1',
  '#ec4899',
];

export function resolveScenarioSize(input: PerfScenario | number): number {
  if (typeof input === 'number') {
    return Math.max(1, Math.floor(input));
  }
  return SCENARIO_SIZES[input] ?? SCENARIO_SIZES.S1;
}

export function generatePerfDataset(input: PerfScenario | number): {
  tasks: Task[];
  categories: Category[];
  size: number;
} {
  const size = resolveScenarioSize(input);
  const categories = buildCategories(8);
  const now = Date.now();
  const tasks: Task[] = [];

  for (let i = 0; i < size; i += 1) {
    const idx = i + 1;
    const isCompleted = idx % 10 >= 7;
    const isUncategorized = idx % 5 === 0;
    tasks.push({
      id: `perf-task-${idx}`,
      title: `Tarea de rendimiento ${idx}`,
      completed: isCompleted,
      createdAt: new Date(now - i * 60_000).toISOString(),
      categoryId: isUncategorized ? null : categories[i % categories.length].id,
    });
  }

  return { tasks, categories, size };
}

function buildCategories(total: number): Category[] {
  const now = Date.now();
  return Array.from({ length: total }, (_, i) => {
    const idx = i + 1;
    return {
      id: `perf-cat-${idx}`,
      name: CATEGORY_NAMES[i] ?? `Categoria ${idx}`,
      color: CATEGORY_COLORS[i] ?? '#64748b',
      createdAt: new Date(now - i * 3_600_000).toISOString(),
    };
  });
}
