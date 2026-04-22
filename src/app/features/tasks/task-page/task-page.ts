/**
 * TaskPage Component
 * Location: src/app/features/tasks/task-page/task-page.ts
 */
import { Component, ChangeDetectionStrategy, OnInit, OnDestroy,} from '@angular/core';
import { FormControl } from '@angular/forms';
import {ModalController, AlertController, ToastController, RefresherCustomEvent,} from '@ionic/angular';
import { combineLatest, Subject } from 'rxjs';
import {map,takeUntil,debounceTime,distinctUntilChanged,startWith,} from 'rxjs/operators';

import { TaskService } from '../../../core/services/task.service';
import { CategoryService } from '../../../core/services/category.service';
import { Task, TaskFilter } from '../../../shared/models/task.model';
import { Category } from '../../../shared/models/category.model';
import { RemoteConfigService } from '../../../core/services/remote-config.service';
import { TaskFormComponent } from '../task-form/task-form';

@Component({
  selector: 'app-task-page',
  templateUrl: './task-page.html',
  styleUrls: ['./task-page.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  tasks$ = this.taskService.getTasks();
  categories$ = this.categoryService.getCategories();
  showTaskStats$ = this.remoteConfigService.showTaskStats$;

  // Statistics (calculated from tasks$)
  stats$ = this.tasks$.pipe(
    map(tasks => ({
      total: tasks.length,
      completed: tasks.filter(t => t.completed).length,
      pending: tasks.filter(t => !t.completed).length,
      completionPercentage:
        tasks.length > 0
          ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)
          : 0,
    }))
  );

  filterSubject = new Subject<TaskFilter>();
  categorySubject = new Subject<string | null>();
  searchSubject = new FormControl('');

  filteredTasks$ = combineLatest([
    this.tasks$,
    this.filterSubject.pipe(startWith(TaskFilter.ALL)),
    this.categorySubject.pipe(startWith(null)),
    this.searchSubject.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged()
    ),
  ]).pipe(
    map(([tasks, filter, categoryId, search]) => {
      let result = tasks;

      if (categoryId) {
        result = result.filter(t => t.categoryId === categoryId);
      }

      switch (filter) {
        case TaskFilter.PENDING:
          result = result.filter(t => !t.completed);
          break;
        case TaskFilter.COMPLETED:
          result = result.filter(t => t.completed);
          break;
      }

      if (search?.trim()) {
        const searchLower = search.toLowerCase();
        result = result.filter(
          t =>
            t.title.toLowerCase().includes(searchLower) ||
            (t.description?.toLowerCase().includes(searchLower) ?? false)
        );
      }

      return result;
    }),
    takeUntil(this.destroy$)
  );

  isLoading = true;
  currentFilter = TaskFilter.ALL;
  selectedCategory: string | null = null;
  reorderEnabled = false;

  constructor(
    private taskService: TaskService,
    private categoryService: CategoryService,
    private remoteConfigService: RemoteConfigService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.tasks$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.isLoading = false;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async openTaskModal(task?: Task) {
    const categories = this.categoryService.getAll();
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
          await this.taskService.updateTask(result.data.task);
          await this.showToast('Tarea actualizada ✓', 'success');
        } else {
          await this.taskService.addTask(result.data.task);
          await this.showToast('Tarea creada ✓', 'success');
        }
      } catch (error) {
        await this.showToast('Error al guardar', 'danger');
      }
    }
  }

  async toggleComplete(task: Task, slidingItem: any) {
    try {
      await this.taskService.toggleComplete(task.id);
      slidingItem.close();
      const msg = task.completed ? 'Marcada como pendiente' : 'Marcada como completada';
      await this.showToast(msg + ' ✓', 'success');
    } catch (error) {
      await this.showToast('Error al actualizar', 'danger');
    }
  }

  async confirmDelete(id: string, slidingItem: any) {
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
              await this.taskService.deleteTask(id);
              slidingItem.close();
              await this.showToast('Tarea eliminada ✓', 'danger');
            } catch (error) {
              await this.showToast('Error al eliminar', 'danger');
            }
          },
        },
      ],
    });
    await alert.present();
  }

  async handleRefresh(event: RefresherCustomEvent) {
    await this.taskService.init();
    event.detail.complete();
    await this.showToast('Actualizado', 'success');
  }

  handleReorder(event: any) {
    const reordered = event.detail.complete(
      (this.filteredTasks$ as any).value
    );
    this.taskService.reorderTasks(reordered);
    this.showToast('Orden actualizado', 'success');
  }

  trackByTaskId(_index: number, task: Task): string {
    return task.id;
  }

  trackByCategoryId(_index: number, category: Category): string {
    return category.id;
  }

  isOverdue(task: Task): boolean {
    if (!task.dueDate || task.completed) return false;
    return new Date() > new Date(task.dueDate);
  }

  getCategoryColor(categoryId: string | null, categories: Category[] | null): string {
    if (!categoryId || !categories) return '#999999';
    return categories.find(c => c.id === categoryId)?.color ?? '#999999';
  }

  getCategoryName(categoryId: string | null, categories: Category[] | null): string {
    if (!categoryId || !categories) return '';
    return categories.find(c => c.id === categoryId)?.name ?? '';
  }

  filterByState(filter: TaskFilter) {
    this.currentFilter = filter;
    this.filterSubject.next(filter);
    this.reorderEnabled = filter === TaskFilter.ALL && !this.selectedCategory;
  }

  filterByCategory(categoryId: string | null) {
    this.selectedCategory = categoryId;
    this.categorySubject.next(categoryId);
    this.reorderEnabled = this.currentFilter === TaskFilter.ALL && !categoryId;
  }

  private async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom',
      color,
    });
    await toast.present();
  }
}
