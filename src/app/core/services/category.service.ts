import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Storage } from '@ionic/storage-angular';
import { Category } from '../../shared/models/category.model';

const STORAGE_KEY = 'categories';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  categories$: Observable<Category[]> = this.categoriesSubject.asObservable();

  private _storageReady = false;

  constructor(private storage: Storage) {}

  async init(): Promise<void> {
    if (this._storageReady) return;
    await this.storage.create();
    this._storageReady = true;
    const stored = await this.storage.get(STORAGE_KEY);
    this.categoriesSubject.next(stored ?? []);
  }

  getCategories(): Observable<Category[]> {
    return this.categories$;
  }

  getCategoryById(id: string): Category | undefined {
    return this.categoriesSubject.getValue().find(c => c.id === id);
  }

  async addCategory(data: Pick<Category, 'name' | 'color'>): Promise<Category> {
    const category: Category = {
      id: crypto.randomUUID(),
      name: data.name,
      color: data.color,
      createdAt: new Date(),
    };
    const updated = [...this.categoriesSubject.getValue(), category];
    await this.persist(updated);
    return category;
  }

  async updateCategory(updated: Category): Promise<void> {
    const categories = this.categoriesSubject.getValue().map(c =>
      c.id === updated.id ? updated : c
    );
    await this.persist(categories);
  }

  async deleteCategory(id: string): Promise<void> {
    const categories = this.categoriesSubject.getValue().filter(c => c.id !== id);
    await this.persist(categories);
  }

  private async persist(categories: Category[]): Promise<void> {
    this.categoriesSubject.next(categories);
    await this.storage.set(STORAGE_KEY, categories);
  }
}
