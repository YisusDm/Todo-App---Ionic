import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Storage } from '@ionic/storage-angular';
import { Task, TaskFilter } from '../../shared/models/task.model';

const STORAGE_KEY = 'tasks';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  tasks$: Observable<Task[]> = this.tasksSubject.asObservable();

  private _storageReady = false;

  constructor(private storage: Storage) {}

  async init(): Promise<void> {
    if (this._storageReady) return;
    await this.storage.create();
    this._storageReady = true;
    const stored = await this.storage.get(STORAGE_KEY);
    this.tasksSubject.next(stored ?? []);
  }

  getTasks(): Observable<Task[]> {
    return this.tasks$;
  }

  getFilteredTasks(filter: TaskFilter, categoryId: string | null = null): Task[] {
    let tasks = this.tasksSubject.getValue();

    if (categoryId) {
      tasks = tasks.filter(t => t.categoryId === categoryId);
    }

    switch (filter) {
      case TaskFilter.PENDING:   return tasks.filter(t => !t.completed);
      case TaskFilter.COMPLETED: return tasks.filter(t => t.completed);
      default:                   return tasks;
    }
  }

  async addTask(data: Pick<Task, 'title' | 'description' | 'categoryId' | 'dueDate'>): Promise<Task> {
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
    const updated = [...this.tasksSubject.getValue(), task];
    await this.persist(updated);
    return task;
  }

  async updateTask(updated: Task): Promise<void> {
    const tasks = this.tasksSubject.getValue().map(t =>
      t.id === updated.id ? { ...updated, updatedAt: new Date() } : t
    );
    await this.persist(tasks);
  }

  async toggleComplete(id: string): Promise<void> {
    const tasks = this.tasksSubject.getValue().map(t =>
      t.id === id ? { ...t, completed: !t.completed, updatedAt: new Date() } : t
    );
    await this.persist(tasks);
  }

  async deleteTask(id: string): Promise<void> {
    const tasks = this.tasksSubject.getValue().filter(t => t.id !== id);
    await this.persist(tasks);
  }

  async reorderTasks(tasks: Task[]): Promise<void> {
    await this.persist(tasks);
  }

  private async persist(tasks: Task[]): Promise<void> {
    this.tasksSubject.next(tasks);
    await this.storage.set(STORAGE_KEY, tasks);
  }
}
