import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { categoriesFeatureGuard } from '../../core/guards/categories-feature.guard';
import { TaskListPage } from './task-list.page';

const routes: Routes = [
  {
    path: '',
    component: TaskListPage,
  },
  {
    path: 'categorias',
    canMatch: [categoriesFeatureGuard],
    loadChildren: () =>
      import('../categories/categories.module').then(
        (m) => m.CategoriesPageModule
      ),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TasksRoutingModule {}
