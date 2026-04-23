import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Task } from '../../shared/models/task.model';
import { ITasksRepository } from './tasks.repository';
import { DatabaseService } from '../database/database.service';

@Injectable({ providedIn: 'root' })
export class SqliteTasksRepository implements ITasksRepository {
  private readonly subject = new BehaviorSubject<Task[]>([]);

  constructor(private readonly db: DatabaseService) {}

  getTasks(): Observable<Task[]> {
    return this.subject.asObservable();
  }

  async init(): Promise<void> {
    await this.db.initialize();
    this.reload();
  }

  async addTask(
    data: Pick<Task, 'title' | 'description' | 'categoryId' | 'dueDate'>
  ): Promise<Task> {
    const task: Task = {
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description,
      completed: false,
      categoryId: data.categoryId,
      dueDate: data.dueDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const sortOrder = this.subject.getValue().length;
    this.db.run(
      `INSERT INTO tasks
         (id, title, description, completed, categoryId, dueDate, sortOrder, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        task.id,
        task.title,
        task.description ?? null,
        0,
        task.categoryId ?? null,
        task.dueDate ? task.dueDate.toISOString() : null,
        sortOrder,
        task.createdAt.toISOString(),
        task.updatedAt.toISOString(),
      ]
    );
    this.reload();
    return task;
  }

  async updateTask(updated: Task): Promise<void> {
    this.db.run(
      `UPDATE tasks
       SET title=?, description=?, completed=?, categoryId=?, dueDate=?, updatedAt=?
       WHERE id=?`,
      [
        updated.title,
        updated.description ?? null,
        updated.completed ? 1 : 0,
        updated.categoryId ?? null,
        updated.dueDate ? updated.dueDate.toISOString() : null,
        new Date().toISOString(),
        updated.id,
      ]
    );
    this.reload();
  }

  async toggleComplete(id: string): Promise<void> {
    this.db.run(
      `UPDATE tasks
       SET completed = CASE WHEN completed = 1 THEN 0 ELSE 1 END,
           updatedAt = ?
       WHERE id = ?`,
      [new Date().toISOString(), id]
    );
    this.reload();
  }

  async deleteTask(id: string): Promise<void> {
    this.db.run(`DELETE FROM tasks WHERE id = ?`, [id]);
    this.reload();
  }

  async reorderTasks(tasks: Task[]): Promise<void> {
    this.db.runBatch(
      tasks.map((t, i) => ({
        sql: `UPDATE tasks SET sortOrder = ? WHERE id = ?`,
        params: [i, t.id] as [number, string],
      }))
    );
    this.reload();
  }

  private reload(): void {
    const rows = this.db.query<Record<string, unknown>>(
      `SELECT * FROM tasks ORDER BY sortOrder ASC, createdAt DESC`
    );
    this.subject.next(rows.map(r => this.rowToTask(r)));
  }

  private rowToTask(row: Record<string, unknown>): Task {
    return {
      id: row['id'] as string,
      title: row['title'] as string,
      description: (row['description'] as string | null) ?? undefined,
      completed: row['completed'] === 1,
      categoryId: (row['categoryId'] as string | null) ?? null,
      dueDate: row['dueDate'] ? new Date(row['dueDate'] as string) : undefined,
      createdAt: new Date(row['createdAt'] as string),
      updatedAt: new Date(row['updatedAt'] as string),
    };
  }
}
