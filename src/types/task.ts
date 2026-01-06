export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export type RecurrenceType = 'daily' | 'weekly' | 'monthly';

export interface Task {
  id: string;
  title: string;
  notes?: string;
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
  dueDate?: Date;
  area?: string;
  project?: string;
  tags?: Tag[];
  when?: 'today' | 'evening' | 'someday';
  subtasks?: Subtask[];
  recurrenceType?: RecurrenceType;
  recurrenceInterval?: number;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  areaId?: string;
}

export interface Area {
  id: string;
  name: string;
  color: string;
}

export type ViewType = 'inbox' | 'today' | 'upcoming' | 'someday' | 'logbook';
