import { Annotation, CollaborationState, Comment, User } from './types';

export class CollaborationManager {
  private state: CollaborationState;
  private listeners: Map<string, Set<(state: CollaborationState) => void>>;

  constructor(initialState: CollaborationState) {
    this.state = initialState;
    this.listeners = new Map();
  }

  public updatePresence(userId: string, status: User['presence']['status']): void {
    console.log(`Updating presence for ${userId} to ${status}`);
    // Mock update
    const users = [...this.state.users];
    const index = users.findIndex((u) => u.id === userId);
    if (index !== -1) {
      users[index] = {
        ...users[index],
        presence: { ...users[index].presence, status, lastSeen: new Date() },
      };
      this.updateState({ users });
    }
  }

  public addComment(comment: Omit<Comment, 'id' | 'createdAt'>): void {
    const newComment: Comment = {
      ...comment,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    this.updateState({ comments: [...this.state.comments, newComment] });
  }

  public addAnnotation(annotation: Omit<Annotation, 'id' | 'createdAt'>): void {
    const newAnnotation: Annotation = {
      ...annotation,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    this.updateState({ annotations: [...this.state.annotations, newAnnotation] });
  }

  private updateState(updates: Partial<CollaborationState>): void {
    this.state = {
      ...this.state,
      ...updates,
    };
    this.notifyListeners();
  }

  public subscribe(id: string, callback: (state: CollaborationState) => void): () => void {
    if (!this.listeners.has(id)) {
      this.listeners.set(id, new Set());
    }
    this.listeners.get(id)?.add(callback);
    return () => {
      this.listeners.get(id)?.delete(callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((callbacks) => {
      callbacks.forEach((cb) => cb(this.state));
    });
  }
}
