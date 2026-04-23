import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Task } from '../../shared/models/task.model';

export interface ITasksRepository {
  getTasks(): Observable<Task[]>;
  addTask(data: Pick<Task, 'title' | 'description' | 'categoryId' | 'dueDate'>): Promise<Task>;
  updateTask(task: Task): Promise<void>;
  toggleComplete(id: string): Promise<void>;
  deleteTask(id: string): Promise<void>;
  reorderTasks(tasks: Task[]): Promise<void>;
  init(): Promise<void>;
}

export const TASKS_REPOSITORY = new InjectionToken<ITasksRepository>('ITasksRepository');
