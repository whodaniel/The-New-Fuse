import { NextApiRequest, NextApiResponse } from 'next';
import { MongoFeatureFlagService } from '@the-new-fuse/core/services/MongoFeatureFlagService';

const featureFlagService = new MongoFeatureFlagService();

export default async function handler(req: NextApiRequest, res: NextApiResponse): any {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid feature ID' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const feature = await featureFlagService.getFeature(id);
        if (!feature) {
          return res.status(404).json({ error: 'Feature not found' });
        }
        return res.status(200).json(feature);
      } catch (error) {
        console.error('Error fetching feature:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

    case 'PATCH':
      try {
        const feature = await featureFlagService.updateFeature(id, req.body);
        if (!feature) {
          return res.status(404).json({ error: 'Feature not found' });
        }
        return res.status(200).json(feature);
      } catch (error) {
        console.error('Error updating feature:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

    case 'DELETE':
      try {
        const success = await featureFlagService.deleteFeature(id);
        if (!success) {
          return res.status(404).json({ error: 'Feature not found' });
        }
        return res.status(204).end();
      } catch (error) {
        console.error('Error deleting feature:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

    default:
      res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}