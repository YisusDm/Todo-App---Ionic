import { Inject, Injectable } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ItemReorderEventDetail } from '@ionic/core';
import { BehaviorSubject, combineLatest, merge, Observable, Subject } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  startWith,
  take,
} from 'rxjs/operators';

import { ITasksRepository, TASKS_REPOSITORY } from '../../../core/repositories/tasks.repository';
import { ICategoriesRepository, CATEGORIES_REPOSITORY } from '../../../core/repositories/categories.repository';
import { RemoteConfigService } from '../../../core/services/remote-config.service';
import { Task, TaskFilter } from '../../../shared/models/task.model';
import { Category } from '../../../shared/models/category.model';
import { buildTaskViewModel, TaskViewModel } from './tasks.selectors';

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

  private readonly filterSubject = new Subject<TaskFilter>();
  private readonly categorySubject = new Subject<string | null>();
  private readonly pageSubject = new BehaviorSubject<number>(1);
  private readonly PAGE_SIZE = 20;

  readonly tasks$: Observable<Task[]>;
  readonly categories$: Observable<Category[]>;
  readonly showTaskStats$: Observable<boolean>;
  readonly enableCategories$: Observable<boolean>;
  readonly stats$: Observable<{ total: number; completed: number; pending: number; completionPercentage: number }>;
  readonly filteredTasks$: Observable<Task[]>;
  readonly filteredTasksVm$: Observable<TaskViewModel[]>;
  readonly displayedTasksVm$: Observable<TaskViewModel[]>;
  readonly hasMore$: Observable<boolean>;

  constructor(
    @Inject(TASKS_REPOSITORY) private readonly tasksRepo: ITasksRepository,
    @Inject(CATEGORIES_REPOSITORY) private readonly categoriesRepo: ICategoriesRepository,
    private readonly remoteConfigService: RemoteConfigService
  ) {
    this.tasks$ = this.tasksRepo.getTasks();
    this.categories$ = this.categoriesRepo.getCategories();
    this.showTaskStats$ = this.remoteConfigService.showTaskStats$;
    this.enableCategories$ = this.remoteConfigService.enableCategories$;

    this.stats$ = this.tasks$.pipe(
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

    this.filteredTasks$ = combineLatest([
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

    this.filteredTasksVm$ = combineLatest([
      this.filteredTasks$,
      this.categories$,
    ]).pipe(
      map(([tasks, categories]) =>
        tasks.map(task => buildTaskViewModel(task, categories))
      )
    );

    // Reset to page 1 whenever any filter/search input changes
    merge(
      this.filterSubject,
      this.categorySubject,
      this.searchControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged())
    ).subscribe(() => this.pageSubject.next(1));

    this.displayedTasksVm$ = combineLatest([
      this.filteredTasksVm$,
      this.pageSubject.asObservable(),
    ]).pipe(
      map(([vms, page]) => vms.slice(0, page * this.PAGE_SIZE))
    );

    this.hasMore$ = combineLatest([
      this.filteredTasksVm$,
      this.pageSubject.asObservable(),
    ]).pipe(
      map(([vms, page]) => vms.length > page * this.PAGE_SIZE),
      distinctUntilChanged()
    );
  }

  loadNextPage(): void {
    this.pageSubject.next(this.pageSubject.getValue() + 1);
  }

  getCategoriesForTaskForm(): Category[] {
    if (!this.remoteConfigService.areCategoriesEnabled()) {
      return [];
    }
    return this.categoriesRepo.getAll();
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
      void this.tasksRepo.reorderTasks(reordered);
    });
  }

  async refreshTasks(): Promise<void> {
    await this.remoteConfigService.refresh();
    await this.tasksRepo.init();
  }

  async addTask(data: Pick<Task, 'title' | 'description' | 'categoryId' | 'dueDate'>): Promise<Task> {
    return this.tasksRepo.addTask(data);
  }

  async updateTask(task: Task): Promise<void> {
    return this.tasksRepo.updateTask(task);
  }

  async toggleTaskComplete(id: string): Promise<void> {
    return this.tasksRepo.toggleComplete(id);
  }

  async deleteTask(id: string): Promise<void> {
    return this.tasksRepo.deleteTask(id);
  }
}
