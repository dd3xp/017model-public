import { NextApiRequest, NextApiResponse } from 'next';
import { withDatabase } from '@/middleware/db';
import { clearWork } from '@/utils/ClearWorks';
import TempWork from '@/models/TempWork';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await withDatabase(req, res, async () => {
    try {
      const { workId } = req.body;

      if (!workId) {
        return res.status(400).json({ message: 'Missing workId' });
      }

      const work = await TempWork.findByPk(workId);
      if (!work) {
        return res.status(404).json({ message: 'Work not found' });
      }

      await clearWork(workId);

      return res.status(200).json({
        success: true
      });
    } catch (error: unknown) {
      console.error('Clear work failed:', error);
      return res.status(500).json({ message: error instanceof Error ? error.message : 'Internal server error' });
    }
  });
} 