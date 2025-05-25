import type { NextApiRequest, NextApiResponse } from 'next';
import { sign } from 'jsonwebtoken';
import VerificationCode from '@/models/VerificationCode';
import User from '@/models/User';
import sequelize from '@/lib/db';
import { withDatabase } from '@/middleware/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: 'Email and code are required' });
  }

  await withDatabase(req, res, async () => {
    try {
      if (!sequelize) {
        throw new Error('Database connection not initialized');
      }

      const verificationCode = await VerificationCode.findOne({
        where: { email }
      });

      if (!verificationCode) {
        return res.status(400).json({ message: 'No verification code found' });
      }

      if (new Date() > verificationCode.expires) {
        await verificationCode.destroy();
        return res.status(400).json({ message: 'Verification code expired' });
      }

      if (code !== verificationCode.code) {
        return res.status(400).json({ message: 'Invalid verification code' });
      }

      const [user] = await User.findOrCreate({
        where: { email },
        defaults: { email }
      });

      const token = sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      await verificationCode.destroy();

      res.setHeader('Set-Cookie', `token=${token}; Path=/; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`);
      res.status(200).json({ message: 'Login successful' });
    } catch (error) {
      console.error('Failed to verify code:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
} 