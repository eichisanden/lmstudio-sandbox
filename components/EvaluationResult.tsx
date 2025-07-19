'use client';

import { EvaluationResult as EvaluationResultType } from '@/lib/lmstudio';

interface EvaluationResultProps {
  result: EvaluationResultType;
}

export default function EvaluationResult({ result }: EvaluationResultProps) {
  const getCategoryLabel = (key: string): string => {
    const labels: Record<string, string> = {
      technicalSkills: '技術スキル',
      communication: 'コミュニケーション能力',
      culturalFit: '文化的適合性',
      experience: '経験の関連性',
    };
    return labels[key] || key;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 8) return 'bg-green-100';
    if (score >= 6) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* 総合スコア */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">評価結果</h2>
        <div className="text-center">
          <div className="text-5xl font-bold mb-2">
            <span className={getScoreColor(result.overallScore)}>
              {result.overallScore.toFixed(1)}
            </span>
            <span className="text-2xl text-gray-500">/10</span>
          </div>
          <p className="text-gray-600">総合スコア</p>
        </div>
      </div>

      {/* カテゴリ別評価 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">カテゴリ別評価</h3>
        <div className="space-y-4">
          {Object.entries(result.categories).map(([key, category]) => (
            <div key={key} className="border-b pb-4 last:border-b-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{getCategoryLabel(key)}</h4>
                <span className={`font-bold ${getScoreColor(category.score)}`}>
                  {category.score.toFixed(1)}/10
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full ${
                    category.score >= 8 ? 'bg-green-500' :
                    category.score >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${category.score * 10}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">{category.feedback}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 強みと改善点 */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-green-600">強み</h3>
          <ul className="space-y-2">
            {result.strengths.map((strength, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-gray-700">{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-yellow-600">改善点</h3>
          <ul className="space-y-2">
            {result.areasForImprovement.map((area, index) => (
              <li key={index} className="flex items-start">
                <span className="text-yellow-500 mr-2">!</span>
                <span className="text-gray-700">{area}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 推奨事項 */}
      <div className={`p-6 rounded-lg shadow-md ${getScoreBgColor(result.overallScore)}`}>
        <h3 className="text-xl font-semibold mb-3">採用推奨事項</h3>
        <p className="text-gray-700">{result.recommendation}</p>
      </div>
    </div>
  );
}