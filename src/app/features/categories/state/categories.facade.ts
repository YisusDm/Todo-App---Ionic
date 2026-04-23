import { Injectable } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { TaskService } from '../../../core/services/task.service';
import { CategoryService } from '../../../core/services/category.service';
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
  readonly categories$: Observable<Category[]> = this.categoryService.getCategories();
  private readonly tasks$: Observable<Task[]> = this.taskService.getTasks();

  readonly taskStatsMap$: Observable<Record<string, CategoryTaskStats>> =
    combineLatest([this.tasks$, this.categories$]).pipe(
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

  constructor(
    private readonly taskService: TaskService,
    private readonly categoryService: CategoryService
  ) {}

  async addCategory(data: Pick<Category, 'name' | 'color'>): Promise<Category> {
    return this.categoryService.addCategory(data);
  }

  async updateCategory(category: Category): Promise<void> {
    return this.categoryService.updateCategory(category);
  }

  async deleteCategory(id: string): Promise<void> {
    return this.categoryService.deleteCategory(id);
  }
}
