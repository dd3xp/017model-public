/*
    点击生成后，将输入框内的内容通过一个叫编码的函数获得一个结构化编码。
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
import { updatePreview } from './PreviewWorks';

export async function encodeDescription(description: string): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const prompt = `
    Please convert the following description into a structured encoding format. The encoding format should be:
    {
      "item": "item name",
      "parts": {
        "part1": {
          "shape": "shape description",
          "size": "size description",
          "relative_position": "position relative to other parts"
        },
        "part2": {
          "shape": "shape description",
          "size": "size description",
          "relative_position": "position relative to other parts"
        },
        // ... more parts as needed, not only two parts
      }
    }
    
    Requirements:
    1. Output must be valid JSON format as shown
    2. Relative position should describe:
       - Which parts are connected to each other and how (e.g., "connected to part1's top surface", "attached to part2's left side at 45 degrees")
       - Which parts are not connected but have spatial relationships (e.g., "floating above part2")
       - The angle between parts
    3. Size information should include specific dimensions
    4. Support any number of parts based on the description
    5. Describe the part as detailed as possible
    6. All data must be exact and specific - avoid using vague terms like "large", "small", or "some". Use precise measurements and angles.+
    7. Do not describing as same as the previous chat.
    
    User description: ${description}`;

  const controller = new AbortController();
  const response = await axios.post(
    'https://api.deepseek.com/v1/chat/completions',
    {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are an expert in converting natural language descriptions into structured JSON format. You only return valid JSON without any explanation or markdown formatting.' },
        { role: 'user', content: prompt }
      ],
      stream: false
    },
    { 
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal
    }
  );

  let result = response.data.choices[0].message.content as string;
  result = result.replace(/```json\s*([\s\S]*?)```/i, '$1').replace(/```([\s\S]*?)```/i, '$1').trim();
  
  console.log('Encoded content:', result);
  return result;
}

export async function generateScadFile(description: string): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const prompt = `
    You are an expert in OpenSCAD. When given a brief description of a 3D part, you must output clear, well-structured, and directly runnable OpenSCAD code that accurately represents the described part. The code must:

    1. Use module definitions (module) when appropriate.
    2. Use basic OpenSCAD primitives (such as cube, cylinder, sphere, etc.) and transformation operations.
    3. Add meaningful comments explaining each part and operation.
    4. Set reasonable default dimensions and parameters based on the description.
    5. Be well-formatted and easy to read.
    6. Ensure all parts are correctly connected where specified in the description.

    Assume the coordinate origin is (0,0,0) by default, and the part should be centered or reasonably positioned.

    Do not output any non-code content.

    Description: ${description}`;

  const controller = new AbortController();
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
    { 
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal
    }
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
      const childProcess = execFile(
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

      childProcess.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`OpenSCAD process exited with code ${code}`));
        }
      });
    });
  } catch {
    const fallbackScad = 'cube([10, 10, 10]);';
    await writeFile(scadPath, fallbackScad, 'utf-8');
    await new Promise<void>((resolve, reject) => {
      const childProcess = execFile(
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

      childProcess.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`OpenSCAD process exited with code ${code}`));
        }
      });
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

export async function handleGenerateWork(userId: string, description: string, signal?: AbortSignal): Promise<string> {
  let encoded: string;
  let scad: string;
  let scadPath: string | undefined;
  let stlPath: string | undefined;

  try {
    encoded = await encodeDescription(description);
    if (signal?.aborted) throw new Error('Request cancelled');

    scad = await generateScadFile(encoded);
    if (signal?.aborted) throw new Error('Request cancelled');

    const result = await convertScadToStl(scad, userId);
    if (signal?.aborted) throw new Error('Request cancelled');

    scadPath = result.scadPath;
    stlPath = result.stlPath;
    
    const fileId = await saveWorkToDB(userId, scadPath, stlPath, description);
    return fileId;
  } catch (error) {
    if (scadPath) {
      try {
        await fs.promises.unlink(scadPath);
      } catch (e) {
        console.error('Failed to delete SCAD file:', e);
      }
    }
    if (stlPath) {
      try {
        await fs.promises.unlink(stlPath);
      } catch (e) {
        console.error('Failed to delete STL file:', e);
      }
    }
    throw error;
  }
}

export async function getStlFile(fileId: string): Promise<Buffer | null> {
  const work = await TempWork.findByPk(fileId);
  if (!work) return null;
  return readFile(work.stlPath);
}

export async function generateWork(userId: string, description: string): Promise<TempWork> {
  console.log('Generating work for user:', userId);
  console.log('Description:', description);

  const work = await TempWork.create({
    userId,
    description,
    status: 'pending'
  });
  console.log('Created work record:', { id: work.id });

  try {
    const scadContent = await generateScad(description);
    console.log('Generated SCAD content length:', scadContent.length);

    const stlBase64 = await updatePreview(work, scadContent);
    console.log('Preview updated successfully');

    return work;
  } catch (error) {
    console.error('Error during work generation:', error);
    await work.update({ status: 'failed' });
    throw error;
  }
}

async function generateScad(description: string): Promise<string> {
  console.log('Generating SCAD for description:', description);
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const prompt = `
    You are an expert in OpenSCAD. Please create an OpenSCAD model based on the following description.
    The model should be simple and easy to understand.

    Description:
    ${description}

    Requirements:
    1. Use basic OpenSCAD primitives (cube, sphere, cylinder, etc.)
    2. Keep the code clean and well-commented
    3. Return only the OpenSCAD code without any explanation
  `;

  console.log('Sending request to DeepSeek API...');
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

  console.log('Received response from DeepSeek API');
  let scadContent = response.data.choices[0].message.content as string;
  scadContent = scadContent.replace(/```scad\s*([\s\S]*?)```/i, '$1').replace(/```([\s\S]*?)```/i, '$1').trim();
  scadContent = scadContent.replace(/^openscad\s*/i, '').trim();
  console.log('Processed SCAD content length:', scadContent.length);

  return scadContent;
}