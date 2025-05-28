import { NextApiRequest, NextApiResponse } from 'next';
import { downloadWork } from '@/utils/DownloadWorks';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { path: stlPath } = req.query;

  if (!stlPath || typeof stlPath !== 'string') {
    return res.status(400).json({ message: 'Path is required' });
  }

  try {
    const fileBuffer = await downloadWork(stlPath);
    const fileName = stlPath.split('/').pop() || 'model.stl';

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.send(fileBuffer);
  } catch (error) {
    console.error('Error in download API:', error);
    res.status(500).json({ message: 'Failed to download file' });
  }
} 