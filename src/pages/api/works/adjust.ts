import { NextApiRequest, NextApiResponse } from 'next';
import { withDatabase } from '@/middleware/db';
import { adjustModel } from '@/utils/AdjustWorks';
import TempWork from '@/models/TempWork';
import { Op } from 'sequelize';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
    res.status(408).json({ error: 'Request timeout' });
  }, 600000);

  req.on('close', () => {
    controller.abort();
    clearTimeout(timeout);
  });

  await withDatabase(req, res, async () => {
    try {
      const { workId, description } = req.body;

      if (!workId || !description) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const work = await TempWork.findByPk(workId);
      if (!work) {
        return res.status(404).json({ message: 'Work not found' });
      }

      await TempWork.destroy({
        where: {
          userId: work.userId,
          id: { [Op.ne]: workId }
        }
      });

      await adjustModel(workId, description, controller.signal);

      await work.update({
        description,
        status: 'completed'
      });

      clearTimeout(timeout);
      return res.status(200).json({
        success: true
      });
    } catch (error: unknown) {
      clearTimeout(timeout);
      if (error instanceof Error && 
          (error.message === 'Request cancelled' || 
           error.name === 'AbortError' || 
           (error as { __CANCEL__?: boolean }).__CANCEL__)) {
        console.log('Request was cancelled');
        return res.status(499).json({ message: 'Request cancelled' });
      }
      console.error('Adjust work failed:', error);
      return res.status(500).json({ message: error instanceof Error ? error.message : 'Internal server error' });
    }
  });
} 