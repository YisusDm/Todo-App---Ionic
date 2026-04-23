import { Task } from '../../../shared/models/task.model';
import { Category } from '../../../shared/models/category.model';

export interface TaskViewModel {
  task: Task;
  isOverdue: boolean;
  isUpcomingDue: boolean;
  daysRemaining: number | null;
  daysOpen: number;
  categoryColor: string;
  categoryName: string;
  formattedCreatedAt: string;
  formattedDueDate: string;
}

const DATE_FORMAT: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };

function formatDate(date: Date | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('es-CO', DATE_FORMAT);
}

function getDaysRemaining(task: Task): number | null {
  if (!task.dueDate || task.completed) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(task.dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getDaysOpen(task: Task): number {
  const created = new Date(task.createdAt);
  const today = new Date();
  return Math.max(
    0,
    Math.floor((today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
  );
}

export function buildTaskViewModel(task: Task, categories: Category[]): TaskViewModel {
  const daysRemaining = getDaysRemaining(task);
  const isOverdue = !task.completed && !!task.dueDate && new Date() > new Date(task.dueDate);
  const isUpcomingDue = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 3;
  const category = categories.find(c => c.id === task.categoryId);

  return {
    task,
    isOverdue,
    isUpcomingDue,
    daysRemaining,
    daysOpen: getDaysOpen(task),
    categoryColor: category?.color ?? '#999999',
    categoryName: category?.name ?? '',
    formattedCreatedAt: formatDate(task.createdAt),
    formattedDueDate: formatDate(task.dueDate),
  };
}
