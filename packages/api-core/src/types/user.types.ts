/**
 * User Types
 * Type definitions for user-related interfaces
 */

export interface User {
  id: string;
  email: string;
  name?: string;
  [key: string]: any;
}
