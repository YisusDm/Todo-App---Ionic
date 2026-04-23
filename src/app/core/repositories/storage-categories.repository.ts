import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Storage } from '@ionic/storage-angular';
import { Category } from '../../shared/models/category.model';
import { ICategoriesRepository } from './categories.repository';

const STORAGE_KEY = 'categories';

@Injectable({ providedIn: 'root' })
export class StorageCategoriesRepository implements ICategoriesRepository {
  private readonly categoriesSubject = new BehaviorSubject<Category[]>([]);
  private storageReady = false;

  constructor(private readonly storage: Storage) {}

  getCategories(): Observable<Category[]> {
    return this.categoriesSubject.asObservable();
  }

  getAll(): Category[] {
    return this.categoriesSubject.getValue();
  }

  async init(): Promise<void> {
    if (this.storageReady) return;
    await this.storage.create();
    this.storageReady = true;
    const stored = await this.storage.get(STORAGE_KEY);
    this.categoriesSubject.next(stored ?? []);
  }

  async addCategory(data: Pick<Category, 'name' | 'color'>): Promise<Category> {
    const category: Category = {
      id: crypto.randomUUID(),
      name: data.name,
      color: data.color,
      createdAt: new Date(),
    };
    await this.persist([...this.categoriesSubject.getValue(), category]);
    return category;
  }

  async updateCategory(updated: Category): Promise<void> {
    const categories = this.categoriesSubject.getValue().map(c =>
      c.id === updated.id ? updated : c
    );
    await this.persist(categories);
  }

  async deleteCategory(id: string): Promise<void> {
    await this.persist(this.categoriesSubject.getValue().filter(c => c.id !== id));
  }

  private async persist(categories: Category[]): Promise<void> {
    this.categoriesSubject.next(categories);
    await this.storage.set(STORAGE_KEY, categories);
  }
}
