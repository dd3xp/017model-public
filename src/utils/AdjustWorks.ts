/* 
    需要一个修改按钮，点击之后会将tempwork里面的scad文件和输入框内的描述作为
    参数传入一个修改函数，这个函数会组合scad文件和修改的描述，传入deepseek的接口
    然后确保deepseek的接口返回的是一个没有任何错误格式的scad文件
    然后调用convertScadToStl函数，将返回的scad文件转换为stl文件
    然后调用saveWorkToDB函数，将stl文件保存到数据库中
    然后返回stl文件的id
*/

import axios from 'axios';
import { readFile } from 'fs/promises';
import path from 'path';
import TempWork from '@/models/TempWork';
import { updatePreview } from './PreviewWorks';

export async function adjustModel(workId: string, description: string, signal?: AbortSignal): Promise<string> {
  console.log('Starting model adjustment for workId:', workId);
  console.log('New description:', description);

  const work = await TempWork.findByPk(workId);
  if (!work) {
    console.error('Work not found:', workId);
    throw new Error('Work not found');
  }
  console.log('Found work:', { id: work.id, userId: work.userId });

  const tempDir = path.join(process.cwd(), 'user_files', 'temp_models', String(work.userId));
  const scadPath = path.join(tempDir, 'temp.scad');
  console.log('Reading SCAD file from:', scadPath);

  try {
    console.log('Reading SCAD file...');
    const scadContent = await readFile(scadPath, 'utf-8');
    console.log('Original SCAD content length:', scadContent.length);
    if (signal?.aborted) throw new Error('Request cancelled');

    console.log('Generating adjusted SCAD...');
    const adjustedScad = await generateAdjustedScad(scadContent, description, signal);
    console.log('Adjusted SCAD content length:', adjustedScad.length);
    if (signal?.aborted) throw new Error('Request cancelled');

    return updatePreview(work, adjustedScad);
  } catch (error: any) {
    if (error.message === 'Request cancelled' || error.code === 'ERR_CANCELED' || error.__CANCEL__) {
      throw new Error('Request cancelled');
    }
    throw error;
  }
}

async function generateAdjustedScad(scadContent: string, description: string, signal?: AbortSignal): Promise<string> {
  console.log('Generating adjusted SCAD with description:', description);
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const prompt = `
    You are an expert in OpenSCAD. Please modify the following OpenSCAD code based on the new description.
    The modifications should maintain the model's structure while incorporating the new requirements.

    Original SCAD code:
    ${scadContent}

    New description:
    ${description}

    Requirements:
    1. Keep the existing module definitions and structure
    2. Modify the parameters and transformations to match the new description
    3. Keep the code clean and well-commented
    4. Return only the modified OpenSCAD code without any explanation
  `;

  try {
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
      { 
        headers: { Authorization: `Bearer ${apiKey}` },
        signal
      }
    );

    console.log('Received response from DeepSeek API');
    let adjustedScad = response.data.choices[0].message.content as string;
    adjustedScad = adjustedScad.replace(/```scad\s*([\s\S]*?)```/i, '$1').replace(/```([\s\S]*?)```/i, '$1').trim();
    adjustedScad = adjustedScad.replace(/^openscad\s*/i, '').trim();
    console.log('Processed adjusted SCAD content length:', adjustedScad.length);

    return adjustedScad;
  } catch (error: any) {
    if (error.message === 'Request cancelled' || error.code === 'ERR_CANCELED' || error.__CANCEL__) {
      throw new Error('Request cancelled');
    }
    throw error;
  }
}



