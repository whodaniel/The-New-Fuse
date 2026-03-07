import { NextFunction, Request, Response } from 'express';

// Mock Feature Flags
let FEATURE_FLAGS = [
  {
    id: 'new-ui',
    name: 'New UI Layout',
    description: 'Enable the redesigned user interface',
    enabled: true,
    rolloutPercentage: 100,
  },
  {
    id: 'beta-workflows',
    name: 'Beta Workflow Engine',
    description: 'Access to experimental workflow features',
    enabled: false,
    rolloutPercentage: 0,
  },
  {
    id: 'agent-marketplace',
    name: 'Agent Marketplace',
    description: 'Browsable marketplace for agent skills',
    enabled: true,
    rolloutPercentage: 50,
  },
];

export const getFeatureFlags = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.status(200).json(FEATURE_FLAGS);
  } catch (error) {
    next(error);
  }
};

export const updateFeatureFlag = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;

    const index = FEATURE_FLAGS.findIndex((f) => f.id === id);
    if (index === -1) {
      res.status(404).json({ message: 'Feature flag not found' });
      return;
    }

    FEATURE_FLAGS[index] = { ...FEATURE_FLAGS[index], enabled };
    res.status(200).json(FEATURE_FLAGS[index]);
  } catch (error) {
    next(error);
  }
};
