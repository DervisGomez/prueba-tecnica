import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
} from '@angular/core';
import { AlertController } from '@ionic/angular';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import {
  FILTER_SEGMENT_ALL_COLOR,
  FILTER_SEGMENT_UNCATEGORIZED_COLOR,
} from '../core/constants/filter-segment-colors';
import { Category } from '../core/models/category.model';
import { Task } from '../core/models/task.model';
import { CategoryService } from '../core/services/category.service';
import { TaskService } from '../core/services/task.service';

export interface HomeViewModel {
  tasks: Task[];
  categories: Category[];
  filter: string;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  readonly vm$: Observable<HomeViewModel>;
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

  private readonly filter$ = new BehaviorSubject<string>('all');

  constructor(
    private readonly taskService: TaskService,
    private readonly categoryService: CategoryService,
    private readonly alertController: AlertController,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.vm$ = combineLatest([
      this.taskService.watchTasks(),
      this.categoryService.watchCategories(),
      this.filter$,
    ]).pipe(
      map(([tasks, categories, filter]) => {
        const effective = resolveFilter(filter, categories);
        if (effective !== filter) {
          queueMicrotask(() => {
            if (this.filter$.value === filter) {
              this.filter$.next(effective);
            }
          });
        }
        return {
          tasks: filterTasks(tasks, effective),
          categories,
          filter: effective,
        };
      })
    );
  }

  setFilter(value: string): void {
    this.filter$.next(value ?? 'all');
  }

  categoryNameForTask(task: Task, categories: Category[]): string {
    if (!task.categoryId) {
      return 'Sin categoría';
    }
    return categories.find((c) => c.id === task.categoryId)?.name ?? 'Categoría';
  }

  /** Color del punto junto al nombre de categoría (incluye «Sin categoría» del segmento). */
  taskCategoryDotColor(task: Task, categories: Category[]): string {
    if (!task.categoryId) {
      return this.filterUncategorizedDotColor;
    }
    const cat = categories.find((c) => c.id === task.categoryId);
    return cat?.color ?? this.filterUncategorizedDotColor;
  }

  /** Color del indicador según la categoría elegida en el modal (borrador). */
  draftCategoryDotColor(categories: Category[]): string {
    const id = this.draftCategoryId;
    if (!id) {
      return this.filterUncategorizedDotColor;
    }
    return (
      categories.find((c) => c.id === id)?.color ?? this.filterUncategorizedDotColor
    );
  }

  countPending(tasks: Task[]): number {
    return tasks.filter((t) => !t.completed).length;
  }

  countCompleted(tasks: Task[]): number {
    return tasks.filter((t) => t.completed).length;
  }

  tasksMetaAria(tasks: Task[]): string {
    const p = this.countPending(tasks);
    const c = this.countCompleted(tasks);
    return `${p} pendientes, ${c} completadas`;
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
    this.draftCategoryId = task.categoryId ?? '';
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
    const categoryId =
      this.draftCategoryId === '' ? null : this.draftCategoryId;
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

function filterTasks(tasks: Task[], filter: string): Task[] {
  if (filter === 'all') {
    return tasks;
  }
  if (filter === 'uncategorized') {
    return tasks.filter((t) => !t.categoryId);
  }
  return tasks.filter((t) => t.categoryId === filter);
}

/** Si el filtro apunta a una categoría que ya no existe, se usa «todas». */
function resolveFilter(filter: string, categories: Category[]): string {
  if (filter === 'all' || filter === 'uncategorized') {
    return filter;
  }
  return categories.some((c) => c.id === filter) ? filter : 'all';
}
