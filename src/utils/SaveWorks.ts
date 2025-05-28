/*
    点击保存后，弹出一个组件让我填写保存的文件的名字，然后有一个确认按钮和取消按钮，
    点击确认后，将stl文件存储到user_files/saved_works/userId/name.stl，
    数据库里面需要一个Savedworks的表和user关联，然后把刚刚保存的文件路径存到这个表里，
    不要删掉临时工作，
    然后返回成功提示
*/

import fs from 'fs/promises';
import path from 'path';
import TempWork from '@/models/TempWork';
import SavedWork from '@/models/SavedWork';

export async function saveWork(workId: string, name: string): Promise<void> {
  const tempWork = await TempWork.findByPk(workId);
  if (!tempWork) {
    throw new Error('Work not found');
  }

  const existingWork = await SavedWork.findOne({
    where: {
      userId: tempWork.userId,
      name: name
    }
  });

  if (existingWork) {
    throw new Error('nameExists');
  }

  const savedDir = path.join(process.cwd(), 'user_files', 'saved_works', String(tempWork.userId));
  await fs.mkdir(savedDir, { recursive: true });

  const savedStlPath = path.join(savedDir, `${name}.stl`);
  const tempStlPath = path.join(process.cwd(), tempWork.stlPath);
  await fs.copyFile(tempStlPath, savedStlPath);

  await SavedWork.create({
    userId: tempWork.userId,
    name,
    description: tempWork.description,
    stlPath: path.relative(process.cwd(), savedStlPath),
  });
}

