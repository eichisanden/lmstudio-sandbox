import { LMStudioClient } from '@lmstudio/sdk';

export interface EvaluationPrompt {
  transcript: string;
}

export interface EvaluationResult {
  overallScore: number;
  categories: {
    technicalSkills: {
      score: number;
      feedback: string;
    };
    communication: {
      score: number;
      feedback: string;
    };
    culturalFit: {
      score: number;
      feedback: string;
    };
    experience: {
      score: number;
      feedback: string;
    };
  };
  strengths: string[];
  areasForImprovement: string[];
  recommendation: string;
}

export async function evaluateInterview(prompt: EvaluationPrompt): Promise<EvaluationResult> {
  const systemPrompt = `あなたはカジュアル面談の評価を行うAIアシスタントです。
面談の文字起こしを分析して、以下の観点から評価を行ってください：

1. 技術スキル（技術的な知識や経験）
2. コミュニケーション能力（説明の明確さ、対話の円滑さ）
3. 文化的適合性（チームワークや価値観の一致）
4. 経験の関連性（求められる役割への適合度）

各項目を10点満点で評価し、強みと改善点を具体的に挙げてください。
最後に、採用に関する推奨事項を述べてください。

必ずJSON形式で以下の構造で回答してください：
{
  "overallScore": [総合スコア(0-10)],
  "categories": {
    "technicalSkills": {
      "score": [スコア(0-10)],
      "feedback": "[フィードバック]"
    },
    "communication": {
      "score": [スコア(0-10)],
      "feedback": "[フィードバック]"
    },
    "culturalFit": {
      "score": [スコア(0-10)],
      "feedback": "[フィードバック]"
    },
    "experience": {
      "score": [スコア(0-10)],
      "feedback": "[フィードバック]"
    }
  },
  "strengths": ["強み1", "強み2", ...],
  "areasForImprovement": ["改善点1", "改善点2", ...],
  "recommendation": "[採用に関する推奨事項]"
}`;

  const userPrompt = `以下のカジュアル面談の文字起こしを評価してください：\n\n${prompt.transcript}`;

  try {
    // クライアントを関数内で初期化
    const lmstudio = new LMStudioClient();
    
    // 既にロードされているモデルを使用するように変更
    console.log('Getting loaded models...');
    const loadedModels = await lmstudio.llm.listLoaded();
    console.log('Loaded models:', loadedModels);
    
    let model;
    if (loadedModels && loadedModels.length > 0) {
      // 既にロードされているモデルを使用
      model = loadedModels[0];
      console.log('Using already loaded model:', model.identifier);
    } else {
      // モデルがロードされていない場合のみロード
      console.log('No models loaded, attempting to load...');
      model = await lmstudio.llm.load('google/gemma-3-12b');
    }
    
    const prediction = model.respond([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);

    let response = '';
    console.log('Starting to collect response...');
    
    // ストリーミングでレスポンスを収集
    for await (const fragment of prediction) {
      //console.log('Received fragment:', fragment);
      if (fragment.content) {
        response += fragment.content;
      }
    }

    console.log('Full LMStudio Response:', response);
    console.log('Response type:', typeof response);

    // レスポンスがJSON文字列かチェック
    if (!response) {
      throw new Error('LMStudioからの応答が空です');
    }

    // JSON内のコードブロックを削除（もしマークダウン形式で返ってきた場合）
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    const cleanResponse = jsonMatch ? jsonMatch[1] : response;

    try {
      const result = JSON.parse(cleanResponse.trim()) as EvaluationResult;
      return result;
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Response was:', cleanResponse);
      throw new Error('評価結果のパースに失敗しました');
    }
  } catch (error: any) {
    console.error('LMStudio Error:', error);
    
    if (error.message?.includes('insufficient system resources')) {
      throw new Error('システムリソースが不足しています。LMStudioで事前にモデルをロードしてから再度お試しください。');
    } else if (error.message?.includes('connection')) {
      throw new Error('LMStudioに接続できません。LMStudioが起動していることを確認してください。');
    } else {
      throw new Error(`評価の生成に失敗しました: ${error.message || '不明なエラー'}`);
    }
  }
}