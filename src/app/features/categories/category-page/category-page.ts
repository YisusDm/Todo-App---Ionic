/**
 * CategoryPage Component
 * Location: src/app/features/categories/category-page/category-page.ts
 */
import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
} from '@angular/core';
import {
  ModalController,
  AlertController,
} from '@ionic/angular';
import { combineLatest, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

import { TaskService } from '../../../core/services/task.service';
import { CategoryService } from '../../../core/services/category.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { Category } from '../../../shared/models/category.model';
import { CategoryFormComponent } from '../category-form/category-form';

@Component({
  selector: 'app-category-page',
  templateUrl: './category-page.html',
  styleUrls: ['./category-page.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  categories$ = this.categoryService.getCategories();
  tasks$ = this.taskService.getTasks();

  taskStatsMap$ = combineLatest([this.tasks$, this.categories$]).pipe(
    map(([tasks, categories]) => {
      const stats: Record<string, { total: number; pending: number; completed: number; overdue: number }> = {};
      categories.forEach(cat => {
        const catTasks = tasks.filter(t => t.categoryId === cat.id);
        stats[cat.id] = {
          total: catTasks.length,
          pending: catTasks.filter(t => !t.completed).length,
          completed: catTasks.filter(t => t.completed).length,
          overdue: catTasks.filter(t => !t.completed && !!t.dueDate && new Date() > new Date(t.dueDate)).length,
        };
      });
      return stats;
    }),
    takeUntil(this.destroy$)
  );

  isLoading = true;

  constructor(
    private taskService: TaskService,
    private categoryService: CategoryService,
    private notificationService: NotificationService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
  ) {}

  ngOnInit() {
    this.categories$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.isLoading = false;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async openCategoryModal(category?: Category) {
    const modal = await this.modalCtrl.create({
      component: CategoryFormComponent,
      componentProps: { category },
    });

    await modal.present();
    const result = await modal.onDidDismiss();

    if (result.data?.action === 'save') {
      try {
        if (category) {
          await this.categoryService.updateCategory(result.data.category);
          this.notificationService.show('Categoría actualizada', 'success');
        } else {
          await this.categoryService.addCategory(result.data.category);
          this.notificationService.show('Categoría creada', 'success');
        }
      } catch (error) {
        this.notificationService.show('Error al guardar', 'danger');
      }
    }
  }

  async confirmDelete(id: string) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar categoría',
      message: '¿Estás seguro? Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.categoryService.deleteCategory(id);
              this.notificationService.show('Categoría eliminada', 'danger');
            } catch (error) {
              this.notificationService.show('Error al eliminar', 'danger');
            }
          },
        },
      ],
    });
    await alert.present();
  }

  trackByCategoryId(_index: number, category: Category): string {
    return category.id;
  }
}
