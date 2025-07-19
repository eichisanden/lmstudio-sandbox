'use client';

import { useState } from 'react';
import InterviewForm from '@/components/InterviewForm';
import EvaluationResult from '@/components/EvaluationResult';
import LoadingSpinner from '@/components/LoadingSpinner';
import { EvaluationResult as EvaluationResultType } from '@/lib/lmstudio';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EvaluationResultType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: { transcript: string }) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '評価の生成に失敗しました');
      }

      const evaluationResult = await response.json();
      setResult(evaluationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            カジュアル面談評価システム
          </h1>
          <p className="text-gray-600">
            面談の文字起こしを入力して、AIによる評価を取得しましょう
          </p>
        </header>

        {!result && !isLoading && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <InterviewForm onSubmit={handleSubmit} isLoading={isLoading} />
          </div>
        )}

        {isLoading && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <LoadingSpinner />
            <p className="text-center text-gray-600 mt-4">
              評価を生成中です...
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-4">
            <p className="text-red-700">{error}</p>
            <button
              onClick={handleReset}
              className="mt-2 text-red-600 underline hover:text-red-800"
            >
              もう一度試す
            </button>
          </div>
        )}

        {result && (
          <>
            <EvaluationResult result={result} />
            <div className="mt-6 text-center">
              <button
                onClick={handleReset}
                className="bg-gray-600 text-white py-2 px-6 rounded-md hover:bg-gray-700 transition-colors"
              >
                新しい評価を作成
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}