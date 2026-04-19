import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject, Observable } from 'rxjs';
import { Task } from '../models/task.model';

const STORAGE_KEY = 'prueba-tecnica.tasks.v1';

function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Pendientes arriba; completadas abajo. Dentro de cada grupo, más recientes primero. */
function orderTasksForUi(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly tasks$ = new BehaviorSubject<Task[]>([]);
  private readonly appReady: Promise<void>;

  constructor(private readonly storage: Storage) {
    this.appReady = this.initApp();
  }

  watchTasks(): Observable<Task[]> {
    return this.tasks$.asObservable();
  }

  getSnapshot(): Task[] {
    return this.tasks$.value;
  }

  addTask(title: string, categoryId: string | null = null): void {
    void this.addTaskAsync(title, categoryId);
  }

  setCompleted(id: string, completed: boolean): void {
    void this.setCompletedAsync(id, completed);
  }

  setTaskCategory(taskId: string, categoryId: string | null): void {
    void this.setTaskCategoryAsync(taskId, categoryId);
  }

  setTaskTitle(taskId: string, title: string): void {
    void this.setTaskTitleAsync(taskId, title);
  }

  /** Actualiza título y categoría en una sola persistencia. */
  updateTaskDetails(
    taskId: string,
    title: string,
    categoryId: string | null
  ): void {
    void this.updateTaskDetailsAsync(taskId, title, categoryId);
  }

  removeTask(id: string): void {
    void this.removeTaskAsync(id);
  }

  async replaceAllForTesting(tasks: Task[]): Promise<void> {
    await this.persist(tasks);
  }

  /** Quitar la categoría de todas las tareas (p. ej. al borrar la categoría). */
  async clearCategoryFromTasksWhenReady(categoryId: string): Promise<void> {
    await this.ensureReady();
    const next = this.tasks$.value.map((t) =>
      t.categoryId === categoryId ? { ...t, categoryId: null } : t
    );
    await this.persist(next);
  }

  private async initApp(): Promise<void> {
    await this.storage.create();
    const tasks = orderTasksForUi(await this.readStoredTasks());
    this.tasks$.next(tasks);
    await this.storage.set(STORAGE_KEY, tasks);
  }

  private async ensureReady(): Promise<void> {
    await this.appReady;
  }

  private async readStoredTasks(): Promise<Task[]> {
    const raw = await this.storage.get(STORAGE_KEY);
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw.map(parseStoredTask).filter((t): t is Task => t !== null);
  }

  private async persist(tasks: Task[]): Promise<void> {
    await this.ensureReady();
    const ordered = orderTasksForUi(tasks);
    await this.storage.set(STORAGE_KEY, ordered);
    this.tasks$.next(ordered);
  }

  private async addTaskAsync(
    title: string,
    categoryId: string | null
  ): Promise<void> {
    const trimmed = title.trim();
    if (!trimmed) {
      return;
    }
    await this.ensureReady();
    const next: Task[] = [
      {
        id: newId(),
        title: trimmed,
        completed: false,
        createdAt: new Date().toISOString(),
        categoryId,
      },
      ...this.tasks$.value,
    ];
    await this.persist(next);
  }

  private async setCompletedAsync(id: string, completed: boolean): Promise<void> {
    await this.ensureReady();
    const next = this.tasks$.value.map((t) =>
      t.id === id ? { ...t, completed } : t
    );
    await this.persist(next);
  }

  private async setTaskCategoryAsync(
    taskId: string,
    categoryId: string | null
  ): Promise<void> {
    await this.ensureReady();
    const next = this.tasks$.value.map((t) =>
      t.id === taskId ? { ...t, categoryId } : t
    );
    await this.persist(next);
  }

  private async setTaskTitleAsync(taskId: string, title: string): Promise<void> {
    const trimmed = title.trim();
    if (!trimmed) {
      return;
    }
    await this.ensureReady();
    const next = this.tasks$.value.map((t) =>
      t.id === taskId ? { ...t, title: trimmed } : t
    );
    await this.persist(next);
  }

  private async updateTaskDetailsAsync(
    taskId: string,
    title: string,
    categoryId: string | null
  ): Promise<void> {
    const trimmed = title.trim();
    if (!trimmed) {
      return;
    }
    await this.ensureReady();
    const next = this.tasks$.value.map((t) =>
      t.id === taskId ? { ...t, title: trimmed, categoryId } : t
    );
    await this.persist(next);
  }

  private async removeTaskAsync(id: string): Promise<void> {
    await this.ensureReady();
    const next = this.tasks$.value.filter((t) => t.id !== id);
    await this.persist(next);
  }
}

function parseStoredTask(value: unknown): Task | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const o = value as Record<string, unknown>;
  if (
    typeof o['id'] !== 'string' ||
    typeof o['title'] !== 'string' ||
    typeof o['completed'] !== 'boolean' ||
    typeof o['createdAt'] !== 'string'
  ) {
    return null;
  }
  const cid = o['categoryId'];
  return {
    id: o['id'],
    title: o['title'],
    completed: o['completed'],
    createdAt: o['createdAt'],
    categoryId: typeof cid === 'string' ? cid : null,
  };
}
