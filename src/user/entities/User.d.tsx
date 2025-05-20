export interface User {
  token?: string;
  id: string;
  email: string;
  name?: string;
  role?: string;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: unknown;
}
export declare class UserEntity implements User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  createdAt?: Date;
  updatedAt?: Date;
  constructor(data: Partial<User>);
}
export default UserEntity;
