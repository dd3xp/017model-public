import { NextApiRequest, NextApiResponse } from 'next';
import { deleteWork } from '@/utils/DeleteWorks';
import { initDatabase } from '@/lib/init';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await initDatabase();
    const { workId } = req.body;

    if (!workId) {
      return res.status(400).json({ message: 'Work ID is required' });
    }

    const success = await deleteWork(workId);
    if (success) {
      res.status(200).json({ message: 'Work deleted successfully' });
    } else {
      res.status(404).json({ message: 'Work not found' });
    }
  } catch (error) {
    console.error('Error in delete work API:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 