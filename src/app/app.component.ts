import { Component } from '@angular/core';
import { environment } from '../environments/environment';
import { CategoryService } from './core/services/category.service';
import { TaskService } from './core/services/task.service';
import {
  generatePerfDataset,
  PerfScenario,
} from './core/utils/perf-seed.util';

type PerfSeedWindow = Window & {
  seedPerfScenario?: (scenario: PerfScenario | number) => Promise<void>;
  clearPerfScenario?: () => Promise<void>;
};

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(
    private readonly taskService: TaskService,
    private readonly categoryService: CategoryService
  ) {
    this.registerPerfSeedHelpers();
  }

  private registerPerfSeedHelpers(): void {
    if (environment.production || typeof window === 'undefined') {
      return;
    }
    const win = window as PerfSeedWindow;
    win.seedPerfScenario = async (scenario: PerfScenario | number) => {
      const dataset = generatePerfDataset(scenario);
      await this.categoryService.replaceAllForTesting(dataset.categories);
      await this.taskService.replaceAllForTesting(dataset.tasks);
      console.info(
        `[perf-seed] Escenario cargado: ${dataset.size} tareas y ${dataset.categories.length} categorias.`
      );
    };
    win.clearPerfScenario = async () => {
      await this.categoryService.replaceAllForTesting([]);
      await this.taskService.replaceAllForTesting([]);
      console.info('[perf-seed] Datos de prueba limpiados.');
    };
  }
}
