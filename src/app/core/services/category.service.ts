import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject, Observable } from 'rxjs';
import { DEFAULT_CATEGORY_COLOR, isValidHexColor } from '../constants/category-palette';
import { Category } from '../models/category.model';
import { TaskService } from './task.service';

const STORAGE_KEY = 'prueba-tecnica.categories.v1';

function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function sortCategories(categories: Category[]): Category[] {
  return [...categories].sort((a, b) =>
    a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
  );
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly categories$ = new BehaviorSubject<Category[]>([]);
  private readonly appReady: Promise<void>;

  constructor(
    private readonly storage: Storage,
    private readonly taskService: TaskService
  ) {
    this.appReady = this.initApp();
  }

  watchCategories(): Observable<Category[]> {
    return this.categories$.asObservable();
  }

  getSnapshot(): Category[] {
    return this.categories$.value;
  }

  getById(id: string): Category | undefined {
    return this.categories$.value.find((c) => c.id === id);
  }

  addCategory(name: string, color: string): void {
    void this.addCategoryAsync(name, color);
  }

  updateCategory(id: string, name: string, color: string): void {
    void this.updateCategoryAsync(id, name, color);
  }

  deleteCategory(id: string): void {
    void this.deleteCategoryAsync(id);
  }

  private async initApp(): Promise<void> {
    await this.storage.create();
    const list = sortCategories(await this.readStored());
    this.categories$.next(list);
    await this.storage.set(STORAGE_KEY, list);
  }

  private async ensureReady(): Promise<void> {
    await this.appReady;
  }

  private async readStored(): Promise<Category[]> {
    const raw = await this.storage.get(STORAGE_KEY);
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw.map(parseCategory).filter((c): c is Category => c !== null);
  }

  private async persist(list: Category[]): Promise<void> {
    await this.ensureReady();
    const ordered = sortCategories(list);
    await this.storage.set(STORAGE_KEY, ordered);
    this.categories$.next(ordered);
  }

  private async addCategoryAsync(name: string, color: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    const safeColor = isValidHexColor(color) ? color : DEFAULT_CATEGORY_COLOR;
    await this.ensureReady();
    const next: Category[] = [
      ...this.categories$.value,
      {
        id: newId(),
        name: trimmed,
        color: safeColor,
        createdAt: new Date().toISOString(),
      },
    ];
    await this.persist(next);
  }

  private async updateCategoryAsync(
    id: string,
    name: string,
    color: string
  ): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    const safeColor = isValidHexColor(color) ? color : DEFAULT_CATEGORY_COLOR;
    await this.ensureReady();
    const next = this.categories$.value.map((c) =>
      c.id === id ? { ...c, name: trimmed, color: safeColor } : c
    );
    await this.persist(next);
  }

  private async deleteCategoryAsync(id: string): Promise<void> {
    await this.ensureReady();
    await this.taskService.clearCategoryFromTasksWhenReady(id);
    const next = this.categories$.value.filter((c) => c.id !== id);
    await this.persist(next);
  }
}

function parseCategory(value: unknown): Category | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const o = value as Record<string, unknown>;
  if (
    typeof o['id'] !== 'string' ||
    typeof o['name'] !== 'string' ||
    typeof o['createdAt'] !== 'string'
  ) {
    return null;
  }
  const col = o['color'];
  const color =
    typeof col === 'string' && isValidHexColor(col)
      ? col
      : DEFAULT_CATEGORY_COLOR;
  return {
    id: o['id'],
    name: o['name'],
    createdAt: o['createdAt'],
    color,
  };
}
