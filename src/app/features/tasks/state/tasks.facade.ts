import { Injectable } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ItemReorderEventDetail } from '@ionic/core';
import { combineLatest, Observable, Subject } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  startWith,
  take,
} from 'rxjs/operators';

import { TaskService } from '../../../core/services/task.service';
import { CategoryService } from '../../../core/services/category.service';
import { RemoteConfigService } from '../../../core/services/remote-config.service';
import { Task, TaskFilter } from '../../../shared/models/task.model';
import { Category } from '../../../shared/models/category.model';

function normalizeSearchTerm(raw: string | null | undefined): string {
  return (raw ?? '').trim().toLowerCase();
}

function filterTasks(
  tasks: Task[],
  filter: TaskFilter,
  categoryId: string | null,
  search: string
): Task[] {
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
      result = result.filter(
        t => !t.completed && !!t.dueDate && new Date() > new Date(t.dueDate)
      );
      break;
    default:
      break;
  }

  const q = normalizeSearchTerm(search);
  if (q) {
    result = result.filter(
      t =>
        t.title.toLowerCase().includes(q) ||
        (t.description?.toLowerCase().includes(q) ?? false)
    );
  }

  return result;
}

@Injectable({ providedIn: 'root' })
export class TasksFacade {
  readonly TaskFilter = TaskFilter;

  readonly searchControl = new FormControl<string>('', { nonNullable: true });

  readonly tasks$: Observable<Task[]> = this.taskService.getTasks();
  readonly categories$: Observable<Category[]> = this.categoryService.getCategories();
  readonly showTaskStats$: Observable<boolean> = this.remoteConfigService.showTaskStats$;
  readonly enableCategories$: Observable<boolean> =
    this.remoteConfigService.enableCategories$;

  private readonly filterSubject = new Subject<TaskFilter>();
  private readonly categorySubject = new Subject<string | null>();

  readonly stats$ = this.tasks$.pipe(
    map(tasks => ({
      total: tasks.length,
      completed: tasks.filter(t => t.completed).length,
      pending: tasks.filter(t => !t.completed).length,
      completionPercentage:
        tasks.length > 0
          ? Math.round(
              (tasks.filter(t => t.completed).length / tasks.length) * 100
            )
          : 0,
    }))
  );

  readonly filteredTasks$ = combineLatest([
    this.tasks$,
    this.filterSubject.pipe(startWith(TaskFilter.ALL)),
    this.categorySubject.pipe(startWith(null)),
    this.searchControl.valueChanges.pipe(
      startWith(this.searchControl.value),
      debounceTime(300),
      distinctUntilChanged()
    ),
  ]).pipe(
    map(([tasks, filter, categoryId, search]) =>
      filterTasks(tasks, filter, categoryId, search)
    )
  );

  constructor(
    private readonly taskService: TaskService,
    private readonly categoryService: CategoryService,
    private readonly remoteConfigService: RemoteConfigService
  ) {}

  getCategoriesForTaskForm(): Category[] {
    if (!this.remoteConfigService.areCategoriesEnabled()) {
      return [];
    }
    return this.categoryService.getAll();
  }

  setFilter(filter: TaskFilter): void {
    this.filterSubject.next(filter);
  }

  setCategoryFilter(categoryId: string | null): void {
    this.categorySubject.next(categoryId);
  }

  isReorderEnabled(filter: TaskFilter, selectedCategory: string | null): boolean {
    return filter === TaskFilter.ALL && !selectedCategory;
  }

  reorderFilteredTasks(event: CustomEvent<ItemReorderEventDetail>): void {
    this.filteredTasks$.pipe(take(1)).subscribe(tasks => {
      const reordered = event.detail.complete(tasks);
      void this.taskService.reorderTasks(reordered);
    });
  }

  async refreshTasks(): Promise<void> {
    await this.remoteConfigService.refresh();
    await this.taskService.init();
  }

  async addTask(
    data: Pick<Task, 'title' | 'description' | 'categoryId' | 'dueDate'>
  ): Promise<Task> {
    return this.taskService.addTask(data);
  }

  async updateTask(task: Task): Promise<void> {
    return this.taskService.updateTask(task);
  }

  async toggleTaskComplete(id: string): Promise<void> {
    return this.taskService.toggleComplete(id);
  }

  async deleteTask(id: string): Promise<void> {
    return this.taskService.deleteTask(id);
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
    return new Date(date).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
    });
  }

  getDaysOpen(task: Task): number {
    const created = new Date(task.createdAt);
    const today = new Date();
    return Math.max(
      0,
      Math.floor(
        (today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
      )
    );
  }

  getCategoryColor(
    categoryId: string | null,
    categories: Category[] | null
  ): string {
    if (!categoryId || !categories) return '#999999';
    return categories.find(c => c.id === categoryId)?.color ?? '#999999';
  }

  getCategoryName(
    categoryId: string | null,
    categories: Category[] | null
  ): string {
    if (!categoryId || !categories) return '';
    return categories.find(c => c.id === categoryId)?.name ?? '';
  }
}
