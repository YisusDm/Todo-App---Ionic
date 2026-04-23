import { Inject, Injectable } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ITasksRepository, TASKS_REPOSITORY } from '../../../core/repositories/tasks.repository';
import { ICategoriesRepository, CATEGORIES_REPOSITORY } from '../../../core/repositories/categories.repository';
import { Category } from '../../../shared/models/category.model';
import { Task } from '../../../shared/models/task.model';

export type CategoryTaskStats = {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
};

@Injectable({ providedIn: 'root' })
export class CategoriesFacade {
  readonly categories$: Observable<Category[]>;
  private readonly tasks$: Observable<Task[]>;
  readonly taskStatsMap$: Observable<Record<string, CategoryTaskStats>>;

  constructor(
    @Inject(TASKS_REPOSITORY) private readonly tasksRepo: ITasksRepository,
    @Inject(CATEGORIES_REPOSITORY) private readonly categoriesRepo: ICategoriesRepository
  ) {
    this.tasks$ = this.tasksRepo.getTasks();
    this.categories$ = this.categoriesRepo.getCategories();

    this.taskStatsMap$ = combineLatest([this.tasks$, this.categories$]).pipe(
      map(([tasks, categories]) => {
        const stats: Record<string, CategoryTaskStats> = {};
        categories.forEach(cat => {
          const catTasks = tasks.filter(t => t.categoryId === cat.id);
          stats[cat.id] = {
            total: catTasks.length,
            pending: catTasks.filter(t => !t.completed).length,
            completed: catTasks.filter(t => t.completed).length,
            overdue: catTasks.filter(
              t => !t.completed && !!t.dueDate && new Date() > new Date(t.dueDate)
            ).length,
          };
        });
        return stats;
      })
    );
  }

  async addCategory(data: Pick<Category, 'name' | 'color'>): Promise<Category> {
    return this.categoriesRepo.addCategory(data);
  }

  async updateCategory(category: Category): Promise<void> {
    return this.categoriesRepo.updateCategory(category);
  }

  async deleteCategory(id: string): Promise<void> {
    return this.categoriesRepo.deleteCategory(id);
  }
}
