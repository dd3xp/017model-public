import type { NextApiRequest, NextApiResponse } from 'next';
import { handleGenerateWork } from '@/utils/GenerateWorks';
import { withDatabase } from '@/middleware/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }
  const { userId, description } = req.body;
  if (!userId || !description) {
    return res.status(400).json({ error: 'userId and description required' });
  }
  
  await withDatabase(req, res, async () => {
    try {
      const fileId = await handleGenerateWork(userId, description);
      res.status(200).json({ id: fileId });
    } catch (e) {
      console.error('Generate Work failed', e);
      res.status(500).json({ error: (e as Error).message });
    }
  });
} 