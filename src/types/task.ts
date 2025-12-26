export type TaskStatus = 'pending' | 'progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string;
  created_at: string;
  updated_at?: string | null;
  status_changed_at?: string | null;
  user_id: string;
}

export interface TaskToAdd {
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string;
}
