import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Category } from '../../shared/models/category.model';

export interface ICategoriesRepository {
  getCategories(): Observable<Category[]>;
  getAll(): Category[];
  addCategory(data: Pick<Category, 'name' | 'color'>): Promise<Category>;
  updateCategory(category: Category): Promise<void>;
  deleteCategory(id: string): Promise<void>;
  init(): Promise<void>;
}

export const CATEGORIES_REPOSITORY = new InjectionToken<ICategoriesRepository>('ICategoriesRepository');
