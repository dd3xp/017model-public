import type { NextApiRequest, NextApiResponse } from 'next';
import SavedWork from '@/models/SavedWork';
import { initDatabase } from '@/lib/init';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    await initDatabase();
    
    const works = await SavedWork.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json(works);
  } catch (error) {
    console.error('Failed to fetch saved works:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 