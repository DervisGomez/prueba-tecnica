import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlertController, IonicModule } from '@ionic/angular';
import { of } from 'rxjs';

import { HomePage } from './home.page';
import { TaskService } from '../core/services/task.service';
import { CategoryService } from '../core/services/category.service';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HomePage],
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

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
