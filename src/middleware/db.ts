import { NextApiRequest, NextApiResponse } from 'next';
import { initDatabase } from '@/lib/init';

let dbInitialized = false;

export async function withDatabase(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => Promise<void>
) {
  if (!dbInitialized) {
    try {
      await initDatabase();
      dbInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }
  await next();
} 