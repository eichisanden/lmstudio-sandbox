import { LMStudioClient } from '@lmstudio/sdk';

export const lmstudio = new LMStudioClient({
  baseUrl: 'http://localhost:1234/v1',
});

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
    const model = await lmstudio.model.load('google/gemma-3-12b'); // モデル名は実際のものに置き換える必要があります
    const prediction = model.respond([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);

    let response = '';
    for await (const text of prediction) {
      response += text;
    }

    const result = JSON.parse(response) as EvaluationResult;
    return result;
  } catch (error) {
    console.error('LMStudio Error:', error);
    throw new Error('評価の生成に失敗しました');
  }
}