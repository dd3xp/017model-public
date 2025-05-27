import { writeFile, readFile } from 'fs/promises';
import { execFile } from 'child_process';
import path from 'path';
import TempWork from '@/models/TempWork';

export async function updatePreview(work: TempWork, scadContent: string): Promise<string> {
  console.log('Updating preview for work:', { id: work.id, userId: work.userId });

  const tempDir = path.join(process.cwd(), 'user_files', 'temp_models', String(work.userId));
  const scadPath = path.join(tempDir, 'temp.scad');
  const stlPath = path.join(tempDir, 'temp.stl');
  console.log('Preview file paths:', { scadPath, stlPath });

  console.log('Writing SCAD file...');
  await writeFile(scadPath, scadContent, 'utf-8');

  try {
    console.log('Converting SCAD to STL...');
    await new Promise<void>((resolve, reject) => {
      execFile(
        'openscad',
        ['-o', stlPath, scadPath],
        (error, stdout, stderr) => {
          if (error) {
            console.error('OpenSCAD stderr:', stderr);
            return reject(new Error(stderr || error.message));
          }
          console.log('OpenSCAD conversion successful');
          resolve();
        }
      );
    });

    console.log('Reading STL file...');
    const stlBuffer = await readFile(stlPath);
    console.log('STL file size:', stlBuffer.length);

    console.log('Updating work record...');
    await work.update({
      scadPath: path.join('user_files', 'temp_models', String(work.userId), 'temp.scad'),
      stlPath: path.join('user_files', 'temp_models', String(work.userId), 'temp.stl'),
      status: 'completed'
    });
    console.log('Work record updated successfully');

    return stlBuffer.toString('base64');
  } catch (error) {
    console.error('Error during preview update:', error);
    await work.update({ status: 'failed' });
    throw error;
  }
} 