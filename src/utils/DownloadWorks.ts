import fs from 'fs';
import path from 'path';

export const downloadWork = async (stlPath: string): Promise<Buffer> => {
  try {
    const fullPath = path.join(process.cwd(), stlPath);
    const fileBuffer = await fs.promises.readFile(fullPath);
    return fileBuffer;
  } catch (error) {
    console.error('Error downloading work:', error);
    throw error;
  }
};
