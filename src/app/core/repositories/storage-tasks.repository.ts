import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Storage } from '@ionic/storage-angular';
import { Task } from '../../shared/models/task.model';
import { ITasksRepository } from './tasks.repository';

const STORAGE_KEY = 'tasks';

@Injectable({ providedIn: 'root' })
export class StorageTasksRepository implements ITasksRepository {
  private readonly tasksSubject = new BehaviorSubject<Task[]>([]);
  private storageReady = false;

  constructor(private readonly storage: Storage) {}

  getTasks(): Observable<Task[]> {
    return this.tasksSubject.asObservable();
  }

  async init(): Promise<void> {
    if (this.storageReady) return;
    await this.storage.create();
    this.storageReady = true;
    const stored = await this.storage.get(STORAGE_KEY);
    this.tasksSubject.next(stored ?? []);
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
    await this.persist([...this.tasksSubject.getValue(), task]);
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
    await this.persist(this.tasksSubject.getValue().filter(t => t.id !== id));
  }

  async reorderTasks(tasks: Task[]): Promise<void> {
    await this.persist(tasks);
  }

  private async persist(tasks: Task[]): Promise<void> {
    this.tasksSubject.next(tasks);
    await this.storage.set(STORAGE_KEY, tasks);
  }
}
