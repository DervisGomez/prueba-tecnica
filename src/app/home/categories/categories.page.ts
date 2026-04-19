import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Observable } from 'rxjs';
import {
  CATEGORY_COLOR_PALETTE,
  DEFAULT_CATEGORY_COLOR,
} from '../../core/constants/category-palette';
import { Category } from '../../core/models/category.model';
import { CategoryService } from '../../core/services/category.service';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.page.html',
  styleUrls: ['./categories.page.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesPage {
  readonly categories$: Observable<Category[]>;
  readonly palette = CATEGORY_COLOR_PALETTE;

  /** Modal único: alta o edición */
  categoryModalOpen = false;
  modalMode: 'add' | 'edit' = 'add';
  /** Solo en modo `edit` */
  modalCategoryId: string | null = null;
  modalName = '';
  modalColor = DEFAULT_CATEGORY_COLOR;

  constructor(
    private readonly categoryService: CategoryService,
    private readonly alertController: AlertController,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.categories$ = this.categoryService.watchCategories();
  }

  get modalTitle(): string {
    return this.modalMode === 'add' ? 'Nueva categoría' : 'Editar categoría';
  }

  get modalSaveLabel(): string {
    return this.modalMode === 'add' ? 'Crear categoría' : 'Guardar cambios';
  }

  openAddModal(): void {
    this.modalMode = 'add';
    this.modalCategoryId = null;
    this.modalName = '';
    this.modalColor = DEFAULT_CATEGORY_COLOR;
    this.categoryModalOpen = true;
    this.cdr.markForCheck();
  }

  openEdit(category: Category): void {
    this.modalMode = 'edit';
    this.modalCategoryId = category.id;
    this.modalName = category.name;
    this.modalColor = category.color;
    this.categoryModalOpen = true;
    this.cdr.markForCheck();
  }

  closeCategoryModal(): void {
    this.categoryModalOpen = false;
    this.cdr.markForCheck();
  }

  pickModalColor(hex: string): void {
    this.modalColor = hex;
    this.cdr.markForCheck();
  }

  onModalNameInput(): void {
    this.cdr.markForCheck();
  }

  onModalColorChange(): void {
    this.cdr.markForCheck();
  }

  saveCategoryModal(): void {
    const name = this.modalName.trim();
    if (!name) {
      return;
    }
    if (this.modalMode === 'add') {
      this.categoryService.addCategory(name, this.modalColor);
    } else if (this.modalCategoryId) {
      this.categoryService.updateCategory(
        this.modalCategoryId,
        name,
        this.modalColor
      );
    }
    this.closeCategoryModal();
  }

  async confirmDelete(category: Category): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Eliminar categoría',
      message: `Se eliminará «${category.name}». Las tareas dejarán de tener esta categoría (pasan a «Sin categoría»).`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.categoryService.deleteCategory(category.id),
        },
      ],
    });
    await alert.present();
  }
}
