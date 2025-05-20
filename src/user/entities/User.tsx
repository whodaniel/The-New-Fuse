// filepath: src/user/entities/User.ts
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

export class UserEntity implements User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: Partial<User>) {
    this.id = data.id || "";
    this.email = data.email || "";
    this.name = data.name;
    this.role = data.role || "user";
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();

    // Copy any additional properties
    Object.entries(data).forEach(([key, value]) => {
      if (
        !["id", "email", "name", "role", "createdAt", "updatedAt"].includes(key)
      ) {
        this[key] = value;
      }
    });
  }
}

export default UserEntity;
