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
      const fileId = await handleGenerateWork(userId, description, controller.signal);
      clearTimeout(timeout);
      res.status(200).json({ id: fileId });
    } catch (e: any) {
      clearTimeout(timeout);
      if (e.message === 'Request cancelled') {
        return;
      }
      console.error('Generate Work failed', e);
      res.status(500).json({ error: (e as Error).message });
    }
  });
} 