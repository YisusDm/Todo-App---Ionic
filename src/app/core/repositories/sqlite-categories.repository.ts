import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Category } from '../../shared/models/category.model';
import { ICategoriesRepository } from './categories.repository';
import { DatabaseService } from '../database/database.service';

@Injectable({ providedIn: 'root' })
export class SqliteCategoriesRepository implements ICategoriesRepository {
  private readonly subject = new BehaviorSubject<Category[]>([]);

  constructor(private readonly db: DatabaseService) {}

  getCategories(): Observable<Category[]> {
    return this.subject.asObservable();
  }

  getAll(): Category[] {
    return this.subject.getValue();
  }

  async init(): Promise<void> {
    await this.db.initialize();
    this.reload();
  }

  async addCategory(data: Pick<Category, 'name' | 'color'>): Promise<Category> {
    const category: Category = {
      id: crypto.randomUUID(),
      name: data.name,
      color: data.color,
      createdAt: new Date(),
    };
    this.db.run(
      `INSERT INTO categories (id, name, color, createdAt) VALUES (?, ?, ?, ?)`,
      [category.id, category.name, category.color, category.createdAt.toISOString()]
    );
    this.reload();
    return category;
  }

  async updateCategory(updated: Category): Promise<void> {
    this.db.run(
      `UPDATE categories SET name = ?, color = ? WHERE id = ?`,
      [updated.name, updated.color, updated.id]
    );
    this.reload();
  }

  async deleteCategory(id: string): Promise<void> {
    this.db.run(`DELETE FROM categories WHERE id = ?`, [id]);
    this.reload();
  }

  private reload(): void {
    const rows = this.db.query<Record<string, unknown>>(
      `SELECT * FROM categories ORDER BY createdAt ASC`
    );
    this.subject.next(rows.map(r => this.rowToCategory(r)));
  }

  private rowToCategory(row: Record<string, unknown>): Category {
    return {
      id: row['id'] as string,
      name: row['name'] as string,
      color: row['color'] as string,
      createdAt: new Date(row['createdAt'] as string),
    };
  }
}
