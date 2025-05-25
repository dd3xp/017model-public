import { NextApiRequest, NextApiResponse } from 'next';
import { initDatabase } from '@/lib/init';
import User from '@/models/User';
import VerificationCode from '@/models/VerificationCode';
import TempWork from '@/models/TempWork';

let dbInitialized = false;

export async function withDatabase(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => Promise<void>
) {
  if (!dbInitialized) {
    try {
      await initDatabase();
      await User.sync({ force: false });
      await VerificationCode.sync({ force: false });
      await TempWork.sync({ force: false });
      
      dbInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }
  await next();
} 