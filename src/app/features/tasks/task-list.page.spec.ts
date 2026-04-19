import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlertController, IonicModule } from '@ionic/angular';
import { of } from 'rxjs';

import { TaskListPage } from './task-list.page';
import { TaskService } from '../../core/services/task.service';
import { CategoryService } from '../../core/services/category.service';

describe('TaskListPage', () => {
  let component: TaskListPage;
  let fixture: ComponentFixture<TaskListPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TaskListPage],
      imports: [IonicModule.forRoot()],
      providers: [
        {
          provide: TaskService,
          useValue: {
            watchTasks: () => of([]),
          },
        },
        {
          provide: CategoryService,
          useValue: {
            watchCategories: () => of([]),
          },
        },
        {
          provide: AlertController,
          useValue: {
            create: () =>
              Promise.resolve({
                present: () => Promise.resolve(),
              }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
