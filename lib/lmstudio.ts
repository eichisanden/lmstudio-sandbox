import { LMStudioClient, FileHandle, ChatMessageInput } from '@lmstudio/sdk';
import { extractTextFromPDF } from './pdf-utils';

export interface GeneratePrompt {
  model: string;
  systemPrompt?: string;
  userPrompt: string;
  images?: string[];
  files?: string[];
}

export async function generateResponseStream(
  prompt: GeneratePrompt,
  onChunk: (chunk: string) => Promise<void>
): Promise<void> {
  try {
    const lmstudio = new LMStudioClient();
    
    console.log('Getting loaded models...');
    const loadedModels = await lmstudio.llm.listLoaded();
    console.log('Loaded models:', loadedModels);
    
    let model = null;
    
    // 指定されたモデルを探す
    for (const loadedModel of loadedModels) {
      if (loadedModel.identifier === prompt.model) {
        model = loadedModel;
        console.log('Found requested model:', model.identifier);
        break;
      }
    }
    
    if (!model) {
      // モデルがロードされていない場合はロードを試みる
      console.log('Model not loaded, attempting to load:', prompt.model);
      model = await lmstudio.llm.load(prompt.model);
    }
    
    const messages: ChatMessageInput[] = [];
    if (prompt.systemPrompt && prompt.systemPrompt.trim()) {
      messages.push({ role: 'system', content: prompt.systemPrompt });
    }
    
    // ファイル処理
    const allFileHandles: FileHandle[] = [];
    
    // 画像の処理
    if (prompt.images && prompt.images.length > 0) {
      console.log(`Processing ${prompt.images.length} images`);
      
      for (let i = 0; i < prompt.images.length; i++) {
        const image = prompt.images[i];
        if (image.startsWith('data:')) {
          // Base64データからFileHandleを作成
          const base64Match = image.match(/^data:image\/(\w+);base64,(.+)$/);
          if (base64Match) {
            const extension = base64Match[1];
            const base64Data = base64Match[2];
            const fileName = `image_${i + 1}.${extension}`;
            const handle = await lmstudio.files.prepareImageBase64(fileName, base64Data);
            allFileHandles.push(handle);
            console.log(`Prepared image ${fileName}`);
          }
        }
      }
    }
    
    // その他のファイル（PDF、テキストなど）の処理
    let fileContents: string[] = [];
    if (prompt.files && prompt.files.length > 0) {
      console.log(`Processing ${prompt.files.length} files`);
      
      for (let i = 0; i < prompt.files.length; i++) {
        const file = prompt.files[i];
        console.log(`File ${i + 1} starts with:`, file.substring(0, 50));
        
        if (file.startsWith('data:')) {
          // Base64データからファイルを判定
          const base64Match = file.match(/^data:([^;]+);base64,(.+)$/);
          if (base64Match) {
            const mimeType = base64Match[1];
            const base64Data = base64Match[2];
            console.log(`File ${i + 1} MIME type:`, mimeType);
            
            // MIMEタイプに応じて処理
            if (mimeType === 'application/pdf') {
              try {
                // PDFからテキストを抽出
                const pdfText = await extractTextFromPDF(file);
                fileContents.push(`\n[PDFファイル ${i + 1} の内容]:\n${pdfText}\n`);
                console.log(`Extracted text from PDF file ${i + 1}`);
              } catch (error) {
                console.error(`Failed to extract text from PDF ${i + 1}:`, error);
                fileContents.push(`\n[PDFファイル ${i + 1}: 読み取りエラー]\n`);
              }
            } else if (mimeType.startsWith('text/')) {
              // テキストファイルをデコード
              try {
                const textContent = Buffer.from(base64Data, 'base64').toString('utf-8');
                fileContents.push(`\n[テキストファイル ${i + 1} の内容]:\n${textContent}\n`);
                console.log(`Decoded text file ${i + 1}`);
              } catch (error) {
                console.error(`Failed to decode text file ${i + 1}:`, error);
                fileContents.push(`\n[テキストファイル ${i + 1}: 読み取りエラー]\n`);
              }
            }
          }
        }
      }
    }
    
    // メッセージを作成
    let finalContent = prompt.userPrompt;
    
    // ファイルコンテンツがある場合は追加
    if (fileContents.length > 0) {
      finalContent += '\n\n--- 添付ファイル ---' + fileContents.join('');
    }
    
    if (allFileHandles.length > 0) {
      messages.push({ 
        role: 'user', 
        content: finalContent,
        images: allFileHandles
      });
    } else {
      messages.push({ role: 'user', content: finalContent });
    }
    
    console.log('Final messages array:', JSON.stringify(messages, null, 2));
    
    const prediction = model.respond(messages, {
      contextOverflowPolicy: 'truncateMiddle'
    });

    // ストリーミングでレスポンスを送信
    for await (const fragment of prediction) {
      if (fragment.content) {
        await onChunk(fragment.content);
      }
    }
  } catch (error: any) {
    console.error('LMStudio Error:', error);
    
    if (error.message?.includes('insufficient system resources')) {
      throw new Error('システムリソースが不足しています。LMStudioで事前にモデルをロードしてから再度お試しください。');
    } else if (error.message?.includes('connection')) {
      throw new Error('LMStudioに接続できません。LMStudioが起動していることを確認してください。');
    } else {
      throw new Error(`生成に失敗しました: ${error.message || '不明なエラー'}`);
    }
  }
}