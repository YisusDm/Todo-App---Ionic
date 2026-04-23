/**
 * TaskPage Component
 * Location: src/app/features/tasks/task-page/task-page.ts
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
  RefresherCustomEvent,
  IonItemSliding,
} from '@ionic/angular';
import { ItemReorderEventDetail } from '@ionic/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { TasksFacade } from '../state/tasks.facade';
import { NotificationService } from '../../../shared/services/notification.service';
import { Task, TaskFilter } from '../../../shared/models/task.model';
import { Category } from '../../../shared/models/category.model';
import { TaskFormComponent } from '../task-form/task-form';

@Component({
  selector: 'app-task-page',
  templateUrl: './task-page.html',
  styleUrls: ['./task-page.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskPageComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  readonly TaskFilter = TaskFilter;

  constructor(
    readonly tasksFacade: TasksFacade,
    private readonly notificationService: NotificationService,
    private readonly modalCtrl: ModalController,
    private readonly alertCtrl: AlertController
  ) {}

  isLoading = true;
  currentFilter = TaskFilter.ALL;
  selectedCategory: string | null = null;
  reorderEnabled = false;

  ngOnInit(): void {
    this.tasksFacade.tasks$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.isLoading = false;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  filterByState(filter: TaskFilter): void {
    this.currentFilter = filter;
    this.tasksFacade.setFilter(filter);
    this.reorderEnabled = this.tasksFacade.isReorderEnabled(
      filter,
      this.selectedCategory
    );
  }

  filterByCategory(categoryId: string | null): void {
    this.selectedCategory = categoryId;
    this.tasksFacade.setCategoryFilter(categoryId);
    this.reorderEnabled = this.tasksFacade.isReorderEnabled(
      this.currentFilter,
      categoryId
    );
  }

  async openTaskModal(task?: Task): Promise<void> {
    const categories = this.tasksFacade.getCategoriesForTaskForm();
    const modal = await this.modalCtrl.create({
      component: TaskFormComponent,
      componentProps: {
        task,
        categories,
      },
    });

    await modal.present();
    const result = await modal.onDidDismiss();

    if (result.data?.action === 'save') {
      try {
        if (task) {
          await this.tasksFacade.updateTask(result.data.task);
          this.notificationService.show('Tarea actualizada', 'success');
        } else {
          await this.tasksFacade.addTask(result.data.task);
          this.notificationService.show('Tarea creada', 'success');
        }
      } catch {
        this.notificationService.show('Error al guardar', 'danger');
      }
    }
  }

  async toggleComplete(task: Task, slidingItem: IonItemSliding): Promise<void> {
    try {
      await this.tasksFacade.toggleTaskComplete(task.id);
      await slidingItem.close();
      const isNowComplete = !task.completed;
      this.notificationService.show(
        isNowComplete ? 'Marcada como completada' : 'Marcada como pendiente',
        isNowComplete ? 'success' : 'info'
      );
    } catch {
      this.notificationService.show('Error al actualizar', 'danger');
    }
  }

  async confirmDelete(id: string, slidingItem: IonItemSliding): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar tarea',
      message: '¿Estás seguro? Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.tasksFacade.deleteTask(id);
              await slidingItem.close();
              this.notificationService.show('Tarea eliminada', 'danger');
            } catch {
              this.notificationService.show('Error al eliminar', 'danger');
            }
          },
        },
      ],
    });
    await alert.present();
  }

  async handleRefresh(event: RefresherCustomEvent): Promise<void> {
    await this.tasksFacade.refreshTasks();
    event.detail.complete();
    this.notificationService.show('Actualizado', 'success');
  }

  handleReorder(event: CustomEvent<ItemReorderEventDetail>): void {
    this.tasksFacade.reorderFilteredTasks(event);
    this.notificationService.show('Orden actualizado', 'success');
  }

  trackByTaskId(_index: number, task: Task): string {
    return task.id;
  }

  trackByCategoryId(_index: number, category: Category): string {
    return category.id;
  }
}
