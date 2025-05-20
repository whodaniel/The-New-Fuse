import { NextApiRequest, NextApiResponse } from 'next';
import { MongoFeatureFlagService } from '@the-new-fuse/core/services/MongoFeatureFlagService';

const featureFlagService = new MongoFeatureFlagService();

export default async function handler(req: NextApiRequest, res: NextApiResponse): any {
  switch (req.method) {
    case 'GET':
      try {
        const features = await featureFlagService.getAllFeatures();
        return res.status(200).json(features);
      } catch (error) {
        console.error('Error fetching features:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

    case 'POST':
      try {
        const feature = await featureFlagService.createFeature(req.body);
        return res.status(201).json(feature);
      } catch (error) {
        console.error('Error creating feature:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}