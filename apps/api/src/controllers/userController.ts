import { NextFunction, Request, Response } from 'express';

const DEPRECATION_MESSAGE =
  'Legacy userController is deprecated. Use /api/users routes from user-management.controller.ts instead.';

export const getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(410).json({ message: DEPRECATION_MESSAGE });
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
    res.status(410).json({ message: DEPRECATION_MESSAGE });
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
    res.status(410).json({ message: DEPRECATION_MESSAGE });
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
    res.status(410).json({ message: DEPRECATION_MESSAGE });
  } catch (error) {
    next(error);
  }
};
