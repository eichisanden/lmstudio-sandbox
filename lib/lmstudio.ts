import { LMStudioClient } from '@lmstudio/sdk';

export interface GeneratePrompt {
  model: string;
  systemPrompt?: string;
  userPrompt: string;
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
    
    const messages = [];
    if (prompt.systemPrompt && prompt.systemPrompt.trim()) {
      messages.push({ role: 'system', content: prompt.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt.userPrompt });
    
    const prediction = model.respond(messages);

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