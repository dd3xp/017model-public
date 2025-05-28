import { NextApiRequest, NextApiResponse } from 'next';
import { withDatabase } from '@/middleware/db';
import { saveWork } from '@/utils/SaveWorks';
import TempWork from '@/models/TempWork';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await withDatabase(req, res, async () => {
    try {
      const { workId, name } = req.body;

      if (!workId || !name) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const work = await TempWork.findByPk(workId);
      if (!work) {
        return res.status(404).json({ message: 'Work not found' });
      }

      await saveWork(workId, name);

      return res.status(200).json({
        success: true
      });
    } catch (error: unknown) {
      console.error('Save work failed:', error);
      if (error instanceof Error && error.message === 'nameExists') {
        return res.status(409).json({ message: 'nameExists' });
      }
      return res.status(500).json({ message: error instanceof Error ? error.message : 'Internal server error' });
    }
  });
} 