import SavedWork from '@/models/SavedWork';
import fs from 'fs';
import path from 'path';

export async function deleteWork(workId: number): Promise<boolean> {
  try {
    const work = await SavedWork.findByPk(workId);
    if (!work) {
      return false;
    }

    const stlPath = work.stlPath.replace(/\\/g, '/');
    if (fs.existsSync(stlPath)) {
      fs.unlinkSync(stlPath);
    }
    
    await work.destroy();
    return true;
  } catch (error) {
    console.error('Error deleting work:', error);
    return false;
  }
}
