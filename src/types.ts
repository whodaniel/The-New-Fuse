export interface Todo {
  id: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  assignedTo?: string;
  dueDate?: Date;
  featureId?: string; // ID of related feature if this todo is part of a feature
  suggestionId?: string; // ID of related suggestion if this todo is part of suggestion review
}