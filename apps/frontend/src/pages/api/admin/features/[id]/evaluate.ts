import { NextApiRequest, NextApiResponse } from 'next';
import { FeatureFlagService } from '@the-new-fuse/core/services/FeatureFlagService';

const featureFlagService = new FeatureFlagService();

export default async function handler(req: NextApiRequest, res: NextApiResponse): any {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { id } = req.query;
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid feature ID' });
  }

  try {
    const { context } = req.body;
    const enabled = await featureFlagService.isEnabled(id, context);
    return res.status(200).json({ enabled });
  } catch (error) {
    console.error('Feature flag evaluation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}