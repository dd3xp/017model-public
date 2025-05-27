import type { NextApiRequest, NextApiResponse } from 'next';
import { withDatabase } from '@/middleware/db';
import TempWork from '@/models/TempWork';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  const { userId } = req.query;
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId is required' });
  }

  await withDatabase(req, res, async () => {
    try {
      const currentWork = await TempWork.findOne({
        where: { 
          userId,
          status: 'pending'
        },
        order: [['createdAt', 'DESC']],
      });

      if (!currentWork) {
        return res.status(200).json({ id: null, description: '', status: null });
      }

      res.status(200).json({
        id: currentWork.id,
        description: currentWork.description,
        status: currentWork.status,
      });
    } catch (e) {
      console.error('Get current work failed', e);
      res.status(500).json({ error: (e as Error).message });
    }
  });
} 