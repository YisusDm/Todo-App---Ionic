/**
 * TaskPage Component
 * Location: src/app/features/tasks/task-page/task-page.ts
 */
import { Component, ChangeDetectionStrategy, OnInit, OnDestroy,} from '@angular/core';
import { FormControl } from '@angular/forms';
import {ModalController, AlertController, RefresherCustomEvent,} from '@ionic/angular';
import { combineLatest, Subject } from 'rxjs';
import {map,takeUntil,debounceTime,distinctUntilChanged,startWith,} from 'rxjs/operators';

import { TaskService } from '../../../core/services/task.service';
import { CategoryService } from '../../../core/services/category.service';
import { NotificationService } from '../../../shared/services/notification.service';
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

  // Expose TaskFilter to template
  readonly TaskFilter = TaskFilter;

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
        case TaskFilter.OVERDUE:
          result = result.filter(t => !t.completed && !!t.dueDate && new Date() > new Date(t.dueDate));
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
    private notificationService: NotificationService,
    private remoteConfigService: RemoteConfigService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
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
          this.notificationService.show('Tarea actualizada', 'success');
        } else {
          await this.taskService.addTask(result.data.task);
          this.notificationService.show('Tarea creada', 'success');
        }
      } catch (error) {
        this.notificationService.show('Error al guardar', 'danger');
      }
    }
  }

  async toggleComplete(task: Task, slidingItem: any) {
    try {
      await this.taskService.toggleComplete(task.id);
      slidingItem.close();
      const isNowComplete = !task.completed;
      this.notificationService.show(
        isNowComplete ? 'Marcada como completada' : 'Marcada como pendiente',
        isNowComplete ? 'success' : 'info'
      );
    } catch (error) {
      this.notificationService.show('Error al actualizar', 'danger');
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
              this.notificationService.show('Tarea eliminada', 'danger');
            } catch (error) {
              this.notificationService.show('Error al eliminar', 'danger');
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
    this.notificationService.show('Actualizado', 'success');
  }

  handleReorder(event: any) {
    const reordered = event.detail.complete(
      (this.filteredTasks$ as any).value
    );
    this.taskService.reorderTasks(reordered);
    this.notificationService.show('Orden actualizado', 'success');
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

  getDaysRemaining(task: Task): number | null {
    if (!task.dueDate || task.completed) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  isUpcomingDue(task: Task): boolean {
    const days = this.getDaysRemaining(task);
    return days !== null && days >= 0 && days <= 3;
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
  }

  getDaysOpen(task: Task): number {
    const created = new Date(task.createdAt);
    const today = new Date();
    return Math.max(0, Math.floor((today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)));
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
}
