import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
} from '@angular/core';
import { AlertController, InfiniteScrollCustomEvent } from '@ionic/angular';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import {
  FILTER_SEGMENT_ALL_COLOR,
  FILTER_SEGMENT_UNCATEGORIZED_COLOR,
} from '../../core/constants/filter-segment-colors';
import { Category } from '../../core/models/category.model';
import { Task } from '../../core/models/task.model';
import { CategoryService } from '../../core/services/category.service';
import { FeatureFlagsService } from '../../core/services/feature-flags.service';
import { TaskService } from '../../core/services/task.service';

export interface TaskListViewModel {
  visibleTasks: TaskListItemViewModel[];
  totalTasks: number;
  pendingCount: number;
  completedCount: number;
  hasMoreTasks: boolean;
  categories: Category[];
  categoriesById: Record<string, Category>;
  filter: string;
  categoriesEnabled: boolean;
}

export interface TaskListItemViewModel {
  task: Task;
  categoryName: string;
  categoryDotColor: string;
}

@Component({
  selector: 'app-task-list',
  templateUrl: 'task-list.page.html',
  styleUrls: ['task-list.page.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListPage {
  readonly vm$: Observable<TaskListViewModel>;
  /** Color del punto «Todas» (no coincide con la paleta de categorías). */
  readonly filterAllDotColor = FILTER_SEGMENT_ALL_COLOR;
  /** Color del punto «Sin categoría». */
  readonly filterUncategorizedDotColor = FILTER_SEGMENT_UNCATEGORIZED_COLOR;

  draftTitle = '';
  /** Vacío = sin categoría */
  draftCategoryId = '';
  /** Si no es `null`, el modal está editando esa tarea; si es `null`, modo alta. */
  editingTaskId: string | null = null;
  /** Modal único: crear o editar tarea (mismo formulario). */
  taskFormModalOpen = false;

  private readonly pageSize = 50;
  private readonly filter$ = new BehaviorSubject<string>('all');
  private readonly renderLimit$ = new BehaviorSubject<number>(this.pageSize);

  constructor(
    private readonly taskService: TaskService,
    private readonly categoryService: CategoryService,
    private readonly featureFlagsService: FeatureFlagsService,
    private readonly alertController: AlertController,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.vm$ = combineLatest([
      this.taskService.watchTasks(),
      this.categoryService.watchCategories(),
      this.filter$,
      this.featureFlagsService.watchCategoriesEnabled(),
      this.renderLimit$,
    ]).pipe(
      map(([tasks, categories, filter, categoriesEnabled, renderLimit]) => {
        const effective = categoriesEnabled
          ? resolveFilter(filter, categories)
          : 'all';
        if (effective !== filter) {
          queueMicrotask(() => {
            if (this.filter$.value === filter) {
              this.filter$.next(effective);
            }
          });
        }
        const categoriesById = toCategoryDictionary(categories);
        const projection = projectVisibleTasks(
          tasks,
          categoriesEnabled,
          categoriesById,
          effective,
          renderLimit
        );
        return {
          visibleTasks: projection.visibleTasks,
          totalTasks: projection.totalTasks,
          pendingCount: projection.pendingCount,
          completedCount: projection.completedCount,
          hasMoreTasks: projection.hasMoreTasks,
          categories: categoriesEnabled ? categories : [],
          categoriesById: categoriesEnabled ? categoriesById : {},
          filter: effective,
          categoriesEnabled,
        };
      })
    );
  }

  setFilter(value: string): void {
    this.filter$.next(value ?? 'all');
    this.renderLimit$.next(this.pageSize);
  }

  /** Color del indicador según la categoría elegida en el modal (borrador). */
  draftCategoryDotColor(categoriesById: Record<string, Category>): string {
    const id = this.draftCategoryId;
    if (!id) {
      return this.filterUncategorizedDotColor;
    }
    return categoriesById[id]?.color ?? this.filterUncategorizedDotColor;
  }

  tasksMetaAria(pendingCount: number, completedCount: number): string {
    return `${pendingCount} pendientes, ${completedCount} completadas`;
  }

  loadMoreTasks(ev: Event): void {
    this.renderLimit$.next(this.renderLimit$.value + this.pageSize);
    (ev as InfiniteScrollCustomEvent).target.complete();
  }

  get taskFormModalTitle(): string {
    return this.editingTaskId ? 'Editar tarea' : 'Nueva tarea';
  }

  get taskFormSubmitLabel(): string {
    return this.editingTaskId ? 'Guardar cambios' : 'Crear tarea';
  }

  openAddTaskModal(): void {
    this.editingTaskId = null;
    this.draftTitle = '';
    this.draftCategoryId = '';
    this.taskFormModalOpen = true;
    this.cdr.markForCheck();
  }

  /** Abre el mismo modal del alta con los datos de la tarea. */
  beginEditTask(task: Task): void {
    this.editingTaskId = task.id;
    this.draftTitle = task.title;
    this.draftCategoryId = this.featureFlagsService.categoriesEnabled
      ? (task.categoryId ?? '')
      : '';
    this.taskFormModalOpen = true;
    this.cdr.markForCheck();
  }

  closeTaskFormModal(): void {
    this.taskFormModalOpen = false;
    this.cdr.markForCheck();
  }

  /** Tras cerrar el modal (gesto, botón o guardar): limpiar borrador y modo. */
  onTaskFormModalDismissed(): void {
    this.taskFormModalOpen = false;
    this.clearTaskFormDraft();
    this.cdr.markForCheck();
  }

  onTaskFormCategoryChange(): void {
    this.cdr.markForCheck();
  }

  submitTaskForm(): void {
    const title = this.draftTitle.trim();
    if (!title) {
      return;
    }
    const categoryId = this.featureFlagsService.categoriesEnabled
      ? (this.draftCategoryId === '' ? null : this.draftCategoryId)
      : null;
    if (this.editingTaskId) {
      this.taskService.updateTaskDetails(
        this.editingTaskId,
        title,
        categoryId
      );
    } else {
      this.taskService.addTask(title, categoryId);
    }
    this.taskFormModalOpen = false;
    this.cdr.markForCheck();
  }

  private clearTaskFormDraft(): void {
    this.editingTaskId = null;
    this.draftTitle = '';
    this.draftCategoryId = '';
  }

  onToggleCompleted(task: Task, ev: Event): void {
    const custom = ev as CustomEvent<{ checked: boolean }>;
    const checked = custom.detail?.checked ?? !task.completed;
    this.taskService.setCompleted(task.id, checked);
  }

  async confirmDelete(task: Task): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Eliminar tarea',
      message: `¿Eliminar «${task.title}»? Esta acción no se puede deshacer.`,
      cssClass: 'task-delete-alert',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            if (this.editingTaskId === task.id) {
              this.taskFormModalOpen = false;
              this.clearTaskFormDraft();
            }
            this.taskService.removeTask(task.id);
            this.cdr.markForCheck();
          },
        },
      ],
    });
    await alert.present();
  }
}

/** Si el filtro apunta a una categoría que ya no existe, se usa «todas». */
function resolveFilter(filter: string, categories: Category[]): string {
  if (filter === 'all' || filter === 'uncategorized') {
    return filter;
  }
  return categories.some((c) => c.id === filter) ? filter : 'all';
}

function toCategoryDictionary(categories: Category[]): Record<string, Category> {
  const byId: Record<string, Category> = {};
  for (const category of categories) {
    byId[category.id] = category;
  }
  return byId;
}

function projectVisibleTasks(
  tasks: Task[],
  categoriesEnabled: boolean,
  categoriesById: Record<string, Category>,
  filter: string,
  renderLimit: number
): {
  visibleTasks: TaskListItemViewModel[];
  totalTasks: number;
  pendingCount: number;
  completedCount: number;
  hasMoreTasks: boolean;
} {
  const visibleTasks: TaskListItemViewModel[] = [];
  let totalTasks = 0;
  let pendingCount = 0;

  for (const task of tasks) {
    if (!matchesTaskFilter(task, categoriesEnabled, filter)) {
      continue;
    }
    totalTasks += 1;
    if (!task.completed) {
      pendingCount += 1;
    }
    if (visibleTasks.length < renderLimit) {
      const category = task.categoryId ? categoriesById[task.categoryId] : undefined;
      visibleTasks.push({
        task,
        categoryName: category?.name ?? 'Sin categoría',
        categoryDotColor: category?.color ?? FILTER_SEGMENT_UNCATEGORIZED_COLOR,
      });
    }
  }

  const completedCount = totalTasks - pendingCount;
  return {
    visibleTasks,
    totalTasks,
    pendingCount,
    completedCount,
    hasMoreTasks: totalTasks > renderLimit,
  };
}

function matchesTaskFilter(
  task: Task,
  categoriesEnabled: boolean,
  filter: string
): boolean {
  if (!categoriesEnabled || filter === 'all') {
    return true;
  }
  if (filter === 'uncategorized') {
    return !task.categoryId;
  }
  return task.categoryId === filter;
}
