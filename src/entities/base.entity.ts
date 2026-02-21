// filepath: src/entities/base.entity.ts
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDeleteEntity extends BaseEntity {
  deletedAt: Date | null;
}

export interface AuditableEntity extends BaseEntity {
  createdBy: string;
  updatedBy: string;
}
