'use client';

import { useState } from 'react';
import PromptForm from '@/components/PromptForm';
import ResponseDisplay from '@/components/ResponseDisplay';
import LoadingSpinner from '@/components/LoadingSpinner';
import StreamingResult from '@/components/StreamingResult';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [streamingText, setStreamingText] = useState<string>('');
  const [firstTokenTime, setFirstTokenTime] = useState<number | null>(null);
  const [totalTime, setTotalTime] = useState<number | null>(null);

  const handleSubmit = async (data: { model: string; systemPrompt?: string; userPrompt: string; images?: string[] }) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setStreamingText('');
    setFirstTokenTime(null);
    setTotalTime(null);
    
    const startTime = Date.now();

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      // Content-Typeをチェック
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        // 通常のJSONレスポンス（エラーの場合）
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '生成に失敗しました');
        }
      } else if (contentType?.includes('text/event-stream')) {
        // Server-Sent Eventsのストリームを読み取る
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = '';
        let buffer = '';
        let isFirstToken = true;

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            
            // 最後の不完全な行を保持
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.trim() === '') continue;
              
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                
                if (data === '[DONE]') {
                  // 完了時、蓄積されたテキストを結果として設定
                  const totalElapsed = Date.now() - startTime;
                  setTotalTime(totalElapsed);
                  setResult(accumulatedText);
                  setStreamingText('');
                } else {
                  try {
                    const parsedData = JSON.parse(data);
                    if (parsedData.chunk) {
                      if (isFirstToken) {
                        const firstTokenElapsed = Date.now() - startTime;
                        setFirstTokenTime(firstTokenElapsed);
                        isFirstToken = false;
                      }
                      accumulatedText += parsedData.chunk;
                      setStreamingText(accumulatedText);
                    } else if (parsedData.error) {
                      throw new Error(parsedData.error);
                    }
                  } catch (e) {
                    console.error('Failed to parse SSE data:', data);
                    console.error('Parse error:', e);
                  }
                }
              }
            }
          }
          
          // 残りのバッファを処理
          if (buffer.trim() && buffer.startsWith('data: ')) {
            const data = buffer.slice(6).trim();
            if (data !== '[DONE]') {
              try {
                const parsedData = JSON.parse(data);
                if (parsedData.chunk) {
                  accumulatedText += parsedData.chunk;
                  setStreamingText(accumulatedText);
                }
              } catch (e) {
                console.error('Failed to parse final buffer:', e);
              }
            }
          }
        }
      } else {
        throw new Error('予期しないレスポンス形式です');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setStreamingText('');
    setFirstTokenTime(null);
    setTotalTime(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            AIプロンプトジェネレーター
          </h1>
          <p className="text-gray-600">
            システムプロンプトとユーザープロンプトを入力して、AIによるレスポンスを生成しましょう
          </p>
        </header>

        {!result && !isLoading && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <PromptForm onSubmit={handleSubmit} isLoading={isLoading} />
          </div>
        )}

        {isLoading && streamingText && (
          <StreamingResult text={streamingText} firstTokenTime={firstTokenTime} />
        )}

        {isLoading && !streamingText && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <LoadingSpinner />
            <p className="text-center text-gray-600 mt-4">
              LMStudioに接続中...
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
            <ResponseDisplay 
              result={result} 
              firstTokenTime={firstTokenTime}
              totalTime={totalTime}
            />
            <div className="mt-6 text-center">
              <button
                onClick={handleReset}
                className="bg-gray-600 text-white py-2 px-6 rounded-md hover:bg-gray-700 transition-colors"
              >
新しいレスポンスを生成
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}