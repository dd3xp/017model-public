/*
    点击生成后，将输入框内的内容通过一个叫编码的函数获得一个结构化编码，
    暂时不要实现这个函数，这个函数目前只会原封不动的返回参数。
    然后将上述函数返回的内容通过一个函数生成scad文件，这个函数会
    通过deepseek请求sk-b6cbf0b9533d48a2b0e5594385a45aa7生成一个scad文件，
    请求的内容是：please generate a scad file with the following description:
    然后将这个函数的返回值转换成stl文件。然后将这个文件存储到一个对应这个用户的表里
    然后返回这个文件的id，然后前端进行展示。
*/
import axios from 'axios';
import { writeFile, readFile } from 'fs/promises';
import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import TempWork from '@/models/TempWork';

export function encodeDescription(description: string): string {
  return description;
}

export async function generateScadFile(description: string): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const prompt = `You are an expert in OpenSCAD. When given a brief description of a 3D part, you must output clear, well-structured, and directly runnable OpenSCAD code that accurately represents the described part. The code must:

                  1. Use module definitions (module) when appropriate.
                  2. Use basic OpenSCAD primitives (such as cube, cylinder, sphere, etc.) and transformation operations.
                  3. Add meaningful comments explaining each part and operation.
                  4. Set reasonable default dimensions and parameters based on the description.
                  5. Be well-formatted and easy to read.

                  Assume the coordinate origin is (0,0,0) by default, and the part should be centered or reasonably positioned.

                  For example, if the input is 'a box', the output should be OpenSCAD code with comments that creates a box.

                  Do not output any non-code content.

                  Description: ${description}`;

  const response = await axios.post(
    'https://api.deepseek.com/v1/chat/completions',
    {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are an expert in OpenSCAD programming. You only return valid OpenSCAD code without any explanation or markdown formatting.' },
        { role: 'user', content: prompt }
      ],
      stream: false
    },
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );
  let scad = response.data.choices[0].message.content as string;
  scad = scad.replace(/```scad\s*([\s\S]*?)```/i, '$1').replace(/```([\s\S]*?)```/i, '$1').trim();
  scad = scad.replace(/^openscad\s*/i, '').trim();
  
  if (!scad.includes('cube') && !scad.includes('sphere') && !scad.includes('cylinder')) {
    scad = `cube([10, 10, 10]); // Default cube as fallback\n${scad}`;
  }
  
  return scad;
}

export async function convertScadToStl(scadContent: string, userId: string): Promise<{ scadPath: string; stlPath: string; stlBuffer: Buffer }> {
  const tempDir = path.join(process.cwd(), 'user_files', 'temp_models', String(userId));
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const scadPath = path.join(tempDir, 'temp.scad');
  const stlPath = path.join(tempDir, 'temp.stl');

  await writeFile(scadPath, scadContent, 'utf-8');
  console.log('SCAD content:', scadContent);

  try {
    await new Promise<void>((resolve, reject) => {
      execFile(
        'openscad',
        ['-o', stlPath, scadPath],
        (error, stdout, stderr) => {
          if (error) {
            console.error('OpenSCAD stderr:', stderr);
            return reject(new Error(stderr || error.message));
          }
          resolve();
        }
      );
    });
  } catch {
    const fallbackScad = 'cube([10, 10, 10]);';
    await writeFile(scadPath, fallbackScad, 'utf-8');
    await new Promise<void>((resolve, reject) => {
      execFile(
        'openscad',
        ['-o', stlPath, scadPath],
        (error, stdout, stderr) => {
          if (error) {
            console.error('OpenSCAD fallback stderr:', stderr);
            return reject(new Error('Failed to generate STL file'));
          }
          resolve();
        }
      );
    });
  }

  const stlBuffer = await readFile(stlPath);
  return { scadPath, stlPath, stlBuffer };
}

export async function saveWorkToDB(userId: string, scadPath: string, stlPath: string, description: string): Promise<string> {
  const work = await TempWork.create({
    userId: userId,
    scadPath,
    stlPath,
    description,
    status: 'pending',
  });
  return work.id.toString();
}

export async function handleGenerateWork(userId: string, description: string): Promise<string> {
  const encoded = encodeDescription(description);
  const scad = await generateScadFile(encoded);
  const { scadPath, stlPath } = await convertScadToStl(scad, userId);
  const fileId = await saveWorkToDB(userId, scadPath, stlPath, description);
  return fileId;
}

export async function getStlFile(fileId: string): Promise<Buffer | null> {
  const work = await TempWork.findByPk(fileId);
  if (!work) return null;
  return readFile(work.stlPath);
}