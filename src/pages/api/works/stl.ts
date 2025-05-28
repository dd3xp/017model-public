import type { NextApiRequest, NextApiResponse } from 'next';
import { getStlFile } from '@/utils/GenerateWorks';

interface FileSystemError extends Error {
  code?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'Missing id' });
    return;
  }
  try {
    const stlBuffer = await getStlFile(id);
    
    if (!stlBuffer) {
      res.status(404).json({ error: 'STL file not found' });
      return;
    }

    res.setHeader('Content-Type', 'model/stl');
    res.setHeader('Content-Disposition', `inline; filename="${id}.stl"`);
    res.end(stlBuffer);
  } catch (error: unknown) {
    console.error('Failed to get STL file:', error);
    if (error instanceof Error && (error as FileSystemError).code === 'ENOENT') {
      res.status(404).json({ error: 'STL file not found' });
    } else {
      res.status(500).json({ error: 'Failed to get STL file' });
    }
  }
} 