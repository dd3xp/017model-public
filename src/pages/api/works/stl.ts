import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { initDatabase } from '@/lib/init';
import TempWork from '@/models/TempWork';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await initDatabase();
    const { id, path: filePath } = req.query;

    let finalPath: string;
    if (id) {
      const work = await TempWork.findByPk(id as string);
      if (!work) {
        return res.status(404).json({ message: 'Work not found' });
      }
      finalPath = work.stlPath;
    } else if (filePath) {
      finalPath = decodeURIComponent(filePath as string);
    } else {
      return res.status(400).json({ message: 'Either id or path is required' });
    }

    const stlBuffer = fs.readFileSync(finalPath);
    const filename = path.basename(finalPath);
    const encodedFilename = encodeURIComponent(filename);

    res.setHeader('Content-Type', 'model/stl');
    res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodedFilename}`);
    res.end(stlBuffer);
  } catch (error: unknown) {
    console.error('Failed to get STL file:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 