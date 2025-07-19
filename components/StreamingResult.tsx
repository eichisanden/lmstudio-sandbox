'use client';

interface StreamingResultProps {
  text: string;
  firstTokenTime?: number | null;
}

export default function StreamingResult({ text, firstTokenTime }: StreamingResultProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-700">AIが評価を生成中...</h3>
      <div className="prose max-w-none">
        <pre className="whitespace-pre-wrap text-sm text-gray-600 font-mono bg-gray-50 p-4 rounded overflow-auto max-h-96">
          {text}
        </pre>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="animate-pulse flex space-x-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animation-delay-200"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animation-delay-400"></div>
          </div>
          <span className="text-sm text-gray-500">生成中...</span>
        </div>
        {firstTokenTime && (
          <span className="text-sm text-gray-500">
            最初のトークンまで: {(firstTokenTime / 1000).toFixed(2)}秒
          </span>
        )}
      </div>
    </div>
  );
}