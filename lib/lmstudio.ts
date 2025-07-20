import { LMStudioClient, FileHandle, ChatMessageInput } from '@lmstudio/sdk';

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
    if (prompt.files && prompt.files.length > 0) {
      console.log(`Processing ${prompt.files.length} files`);
      
      for (let i = 0; i < prompt.files.length; i++) {
        const file = prompt.files[i];
        if (file.startsWith('data:')) {
          // Base64データからファイルを判定
          const base64Match = file.match(/^data:([^;]+);base64,(.+)$/);
          if (base64Match) {
            const mimeType = base64Match[1];
            const base64Data = base64Match[2];
            let extension = 'txt';
            
            // MIMEタイプから拡張子を判定
            if (mimeType === 'application/pdf') {
              extension = 'pdf';
            } else if (mimeType.startsWith('text/')) {
              extension = 'txt';
            }
            
            const fileName = `file_${i + 1}.${extension}`;
            const handle = await lmstudio.files.prepareFileBase64(fileName, base64Data);
            allFileHandles.push(handle);
            console.log(`Prepared file ${fileName}`);
          }
        }
      }
    }
    
    // メッセージを作成
    if (allFileHandles.length > 0) {
      messages.push({ 
        role: 'user', 
        content: prompt.userPrompt,
        images: allFileHandles
      });
    } else {
      messages.push({ role: 'user', content: prompt.userPrompt });
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