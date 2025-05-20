import { UUID } from '../core.js';
import { Task } from './model.js';
import { TaskCreateDTO, TaskUpdateDTO } from './dto.js';

/**
 * Interface for Task service operations
 */
export interface TaskService {
  /**
   * Creates a new task
   * @param taskData Task creation data
   */
  create(taskData: TaskCreateDTO): Promise<Task>;
  
  /**
   * Retrieves a task by ID
   * @param id Task ID
   */
  getById(id: UUID): Promise<Task>;
  
  /**
   * Updates an existing task
   * @param id Task ID
   * @param taskData Task update data
   */
  update(id: UUID, taskData: TaskUpdateDTO): Promise<Task>;
  
  /**
   * Deletes a task
   * @param id Task ID
   */
  delete(id: UUID): Promise<void>;
  
  /**
   * Lists all tasks
   */
  list(): Promise<Task[]>;
}
