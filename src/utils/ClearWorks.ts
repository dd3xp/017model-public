/*
    需要一个删除按钮，点击之后会删除tempwork里面的scad文件和stl文件
    然后删除tempwork里面的记录，再删除预览状态和输入框里面的内容，最后返回成功提示
*/

import fs from 'fs/promises';
import TempWork from '@/models/TempWork';

export async function clearWork(workId: string): Promise<void> {
  const work = await TempWork.findByPk(workId);
  if (!work) {
    throw new Error('Work not found');
  }

  const scadPath = work.scadPath;
  const stlPath = work.stlPath;

  if (scadPath) {
    try {
      await fs.unlink(scadPath);
    } catch (error) {
      console.error('Failed to delete SCAD file:', error);
    }
  }

  if (stlPath) {
    try {
      await fs.unlink(stlPath);
    } catch (error) {
      console.error('Failed to delete STL file:', error);
    }
  }

  await work.destroy();
}