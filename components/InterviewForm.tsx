'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const interviewSchema = z.object({
  transcript: z.string().min(100, '面談内容は100文字以上入力してください'),
});

type InterviewFormData = z.infer<typeof interviewSchema>;

interface InterviewFormProps {
  onSubmit: (data: InterviewFormData) => void;
  isLoading?: boolean;
}

export default function InterviewForm({ onSubmit, isLoading = false }: InterviewFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InterviewFormData>({
    resolver: zodResolver(interviewSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="transcript" className="block text-sm font-medium text-gray-700 mb-2">
          面談内容の文字起こし
        </label>
        <textarea
          id="transcript"
          {...register('transcript')}
          rows={12}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="面談の内容を文字起こしで入力してください..."
          disabled={isLoading}
        />
        {errors.transcript && (
          <p className="mt-1 text-sm text-red-600">{errors.transcript.message}</p>
        )}
      </div>
      
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? '評価中...' : '評価を実行'}
      </button>
    </form>
  );
}