import { NextFunction, Request, Response } from 'express';

// Mock Data for User Management
let MOCK_USERS = [
  {
    id: '1',
    email: 'admin@example.com',
    username: 'admin',
    name: 'Admin User',
    displayName: 'Administrator',
    role: 'admin',
    status: 'active',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'user@example.com',
    username: 'user',
    name: 'Regular User',
    displayName: 'User',
    role: 'user',
    status: 'active',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(200).json(MOCK_USERS);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    MOCK_USERS = MOCK_USERS.filter((u) => u.id !== id);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // In a real app, userId would come from an authenticated session
    const userId = '1';
    const user = MOCK_USERS.find((u) => u.id === userId);

    if (!user) {
      res.status(404).json({ message: 'User profile not found' });
      return;
    }
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const updateUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = '1';
    const profileData = req.body;

    const index = MOCK_USERS.findIndex((u) => u.id === userId);
    if (index === -1) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    MOCK_USERS[index] = { ...MOCK_USERS[index], ...profileData };
    res.status(200).json(MOCK_USERS[index]);
  } catch (error) {
    next(error);
  }
};
