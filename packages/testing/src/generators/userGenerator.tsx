import {
  generateId,
  generateTimestamp,
  generateEnum,
  generateBoolean,
  generateEmail,
  type TimestampOptions
} from './utils.js';

export type UserRole = 'admin' | 'user' | 'viewer' | 'manager';
export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';

export interface GenerateUserOptions {
  role?: UserRole;
  status?: UserStatus;
  timestamps?: TimestampOptions;
  withPreferences?: boolean;
  withMetadata?: boolean;
}

export interface GeneratedUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  preferences?: UserPreferences;
  metadata?: Record<string, any>;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  language: string;
}

const FIRST_NAMES = ['Alice', 'Bob', 'Charlie', 'David', 'Emma', 'Frank', 'Grace', 'Henry'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
const ROLES: UserRole[] = ['admin', 'user', 'viewer', 'manager'];
const STATUSES: UserStatus[] = ['active', 'inactive', 'pending', 'suspended'];
const LANGUAGES = ['en', 'es', 'fr', 'de', 'it'];

export const generateUserPreferences = (): UserPreferences => ({
  theme: generateEnum(['light', 'dark', 'system']),
  notifications: generateBoolean(),
  language: generateEnum(LANGUAGES)
});

export const generateUser = (options: GenerateUserOptions = {}): GeneratedUser => {
  const firstName = generateEnum(FIRST_NAMES);
  const lastName = generateEnum(LAST_NAMES);
  const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;

  const timestamps = {
    createdAt: generateTimestamp({ past: true, daysRange: 365 }),
    updatedAt: generateTimestamp({ past: true, daysRange: 30 }),
    ...(generateBoolean(0.8) && {
      lastLoginAt: generateTimestamp({ past: true, daysRange: 7 })
    })
  };

  return {
    id: generateId('user_'),
    username,
    email: generateEmail(username),
    role: options.role || generateEnum(ROLES),
    status: options.status || generateEnum(STATUSES),
    firstName,
    lastName,
    ...timestamps,
    ...(options.withPreferences && { preferences: generateUserPreferences() }),
    ...(options.withMetadata && {
      metadata: {
        loginCount: Math.floor(Math.random() * 100),
        verified: generateBoolean(),
        lastIp: '192.168.1.' + Math.floor(Math.random() * 255)
      }
    })
  };
};

export const generateUsers = (count: number, options: GenerateUserOptions = {}): GeneratedUser[] => {
  return Array.from({ length: count }, () => generateUser(options));
};