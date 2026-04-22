export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  categoryId: string | null;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum TaskFilter {
  ALL = 'all',
  PENDING = 'pending',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
}