'use client';

import ReactMarkdown from 'react-markdown';

interface ResponseDisplayProps {
  result: string;
  firstTokenTime?: number | null;
  totalTime?: number | null;
}

export default function ResponseDisplay({ result, firstTokenTime, totalTime }: ResponseDisplayProps) {
  return (
    <div className="space-y-6">
      {/* レスポンス内容 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">生成結果</h2>
        <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none">
          <ReactMarkdown
            components={{
              code: ({ inline, className, children, ...props }) => {
                if (inline) {
                  return (
                    <code className="bg-gray-200 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                      {children}
                    </code>
                  );
                }
                return (
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                );
              },
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 italic">
                  {children}
                </blockquote>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse border border-gray-300">
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th className="border border-gray-300 bg-gray-100 px-4 py-2 text-left font-semibold">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border border-gray-300 px-4 py-2">
                  {children}
                </td>
              ),
              h1: ({ children }) => (
                <h1 className="text-3xl font-bold mb-4 text-gray-800 border-b-2 border-gray-200 pb-2">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-2xl font-bold mb-3 text-gray-800 mt-6">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xl font-bold mb-2 text-gray-800 mt-4">
                  {children}
                </h3>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside mb-4 space-y-1">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside mb-4 space-y-1">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="text-gray-700">
                  {children}
                </li>
              ),
              p: ({ children }) => (
                <p className="mb-4 text-gray-700 leading-relaxed">
                  {children}
                </p>
              ),
              strong: ({ children }) => (
                <strong className="font-bold text-gray-900">
                  {children}
                </strong>
              ),
              em: ({ children }) => (
                <em className="italic text-gray-700">
                  {children}
                </em>
              ),
            }}
          >
            {result}
          </ReactMarkdown>
        </div>
      </div>

      {/* パフォーマンス情報 */}
      {(firstTokenTime || totalTime) && (
        <div className="bg-gray-100 p-4 rounded-lg text-sm text-gray-600">
          <div className="flex justify-center space-x-6">
            {firstTokenTime && (
              <div>
                <span className="font-medium">最初のトークンまで:</span>{' '}
                <span className="text-blue-600">{(firstTokenTime / 1000).toFixed(2)}秒</span>
              </div>
            )}
            {totalTime && (
              <div>
                <span className="font-medium">合計生成時間:</span>{' '}
                <span className="text-blue-600">{(totalTime / 1000).toFixed(2)}秒</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}