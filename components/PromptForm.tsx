'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';

const promptSchema = z.object({
  model: z.string().min(1, 'モデルを選択してください'),
  systemPrompt: z.string().optional(),
  userPrompt: z.string().min(1, 'ユーザープロンプトを入力してください'),
  images: z.array(z.string()).optional(),
  files: z.array(z.string()).optional(),
});

type PromptFormData = z.infer<typeof promptSchema>;

interface Model {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

interface UploadedFile {
  file: File;
  preview?: string;
  base64: string;
  type: 'image' | 'pdf' | 'text';
}

interface PromptFormProps {
  onSubmit: (data: PromptFormData & { images?: string[]; files?: string[] }) => void;
  isLoading?: boolean;
}

export default function PromptForm({ onSubmit, isLoading = false }: PromptFormProps) {
  
  const handleFormSubmit = (data: PromptFormData) => {
    // 使用したモデルを保存
    localStorage.setItem('lastUsedModel', data.model);
    
    // ファイルのbase64データを分類して追加
    const images = uploadedFiles.filter(f => f.type === 'image').map(f => f.base64);
    const files = uploadedFiles.filter(f => f.type !== 'image').map(f => f.base64);
    onSubmit({ 
      ...data, 
      images: images.length > 0 ? images : undefined,
      files: files.length > 0 ? files : undefined
    });
  };
  const [savedSystemPrompts, setSavedSystemPrompts] = useState<string[]>([]);
  const [selectedPromptIndex, setSelectedPromptIndex] = useState<number>(-1);
  const [models, setModels] = useState<Model[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PromptFormData>({
    resolver: zodResolver(promptSchema),
  });
  
  const systemPrompt = watch('systemPrompt');
  
  useEffect(() => {
    const saved = localStorage.getItem('savedSystemPrompts');
    if (saved) {
      setSavedSystemPrompts(JSON.parse(saved));
    }
    
    fetchModels();
  }, []);
  
  useEffect(() => {
    // モデルがロードされた後、最後に使用したモデルを設定
    if (models.length > 0) {
      const lastUsedModel = localStorage.getItem('lastUsedModel');
      if (lastUsedModel && models.some(m => m.id === lastUsedModel)) {
        setValue('model', lastUsedModel);
      }
    }
  }, [models, setValue]);
  
  const fetchModels = async () => {
    try {
      const response = await fetch('/api/models');
      if (response.ok) {
        const data = await response.json();
        setModels(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
    } finally {
      setModelsLoading(false);
    }
  };
  
  const handleSaveSystemPrompt = () => {
    if (systemPrompt && systemPrompt.trim()) {
      const updated = [...savedSystemPrompts];
      if (!updated.includes(systemPrompt)) {
        updated.push(systemPrompt);
        setSavedSystemPrompts(updated);
        localStorage.setItem('savedSystemPrompts', JSON.stringify(updated));
      }
    }
  };
  
  const handleSelectPrompt = (index: number) => {
    if (index >= 0 && index < savedSystemPrompts.length) {
      setValue('systemPrompt', savedSystemPrompts[index]);
      setSelectedPromptIndex(index);
    }
  };
  
  const handleDeletePrompt = (index: number) => {
    const updated = savedSystemPrompts.filter((_, i) => i !== index);
    setSavedSystemPrompts(updated);
    localStorage.setItem('savedSystemPrompts', JSON.stringify(updated));
    if (selectedPromptIndex === index) {
      setSelectedPromptIndex(-1);
    }
  };
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    
    const newFiles: UploadedFile[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // ファイルタイプを判定
      let fileType: 'image' | 'pdf' | 'text';
      if (file.type.startsWith('image/')) {
        fileType = 'image';
      } else if (file.type === 'application/pdf') {
        fileType = 'pdf';
      } else if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        fileType = 'text';
      } else {
        alert(`${file.name} はサポートされていないファイルタイプです。`);
        continue;
      }
      
      // ファイルサイズをチェック (10MBまで)
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} のサイズが大きすぎます。10MB以下のファイルを選択してください。`);
        continue;
      }
      
      try {
        const base64 = await fileToBase64(file);
        const uploadedFile: UploadedFile = {
          file,
          base64,
          type: fileType
        };
        
        // 画像の場合はプレビューを作成
        if (fileType === 'image') {
          uploadedFile.preview = URL.createObjectURL(file);
        }
        
        newFiles.push(uploadedFile);
      } catch (error) {
        console.error('Failed to process file:', error);
        alert(`${file.name} の処理に失敗しました。`);
      }
    }
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };
  
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file as base64'));
        }
      };
      reader.onerror = reject;
    });
  };
  
  const removeFile = (index: number) => {
    setUploadedFiles(prev => {
      const updated = [...prev];
      // メモリリークを防ぐためpreview URLをリボーク（画像の場合）
      if (updated[index].preview) {
        URL.revokeObjectURL(updated[index].preview);
      }
      updated.splice(index, 1);
      return updated;
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div>
        <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
          モデル
        </label>
        <select
          id="model"
          {...register('model')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading || modelsLoading}
        >
          <option value="">モデルを選択してください...</option>
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.id}
            </option>
          ))}
        </select>
        {errors.model && (
          <p className="mt-1 text-sm text-red-600">{errors.model.message}</p>
        )}
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="systemPrompt" className="block text-sm font-medium text-gray-700">
            システムプロンプト（任意）
          </label>
          <button
            type="button"
            onClick={handleSaveSystemPrompt}
            className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
          >
            保存
          </button>
        </div>
        
        {savedSystemPrompts.length > 0 && (
          <div className="mb-2">
            <select
              onChange={(e) => handleSelectPrompt(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={selectedPromptIndex}
            >
              <option value="-1">保存されたプロンプトから選択...</option>
              {savedSystemPrompts.map((prompt, index) => (
                <option key={index} value={index}>
                  {prompt.substring(0, 50)}{prompt.length > 50 ? '...' : ''}
                </option>
              ))}
            </select>
            {selectedPromptIndex >= 0 && (
              <button
                type="button"
                onClick={() => handleDeletePrompt(selectedPromptIndex)}
                className="mt-1 text-sm text-red-600 hover:text-red-800"
              >
                削除
              </button>
            )}
          </div>
        )}
        
        <textarea
          id="systemPrompt"
          {...register('systemPrompt')}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="システムプロンプトを入力してください（任意）..."
          disabled={isLoading}
        />
        {errors.systemPrompt && (
          <p className="mt-1 text-sm text-red-600">{errors.systemPrompt.message}</p>
        )}
      </div>
      
      <div>
        <label htmlFor="userPrompt" className="block text-sm font-medium text-gray-700 mb-2">
          ユーザープロンプト
        </label>
        <textarea
          id="userPrompt"
          {...register('userPrompt')}
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="ユーザープロンプトを入力してください..."
          disabled={isLoading}
        />
        {errors.userPrompt && (
          <p className="mt-1 text-sm text-red-600">{errors.userPrompt.message}</p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ファイルアップロード（任意）
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <input
            type="file"
            id="images"
            multiple
            accept="image/*,.pdf,.txt,.md"
            onChange={handleFileUpload}
            disabled={isLoading}
            className="hidden"
          />
          <label
            htmlFor="images"
            className="cursor-pointer flex flex-col items-center justify-center space-y-2"
          >
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-sm text-gray-500">
              クリックしてファイルを選択またはドラッグ&ドロップ
            </span>
            <span className="text-xs text-gray-400">
              画像、PDF、テキストファイル（最大10MBまで）
            </span>
          </label>
        </div>
        
        {uploadedFiles.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              アップロードされたファイル ({uploadedFiles.length}件)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {uploadedFiles.map((uploadedFile, index) => (
                <div key={index} className="relative group">
                  {uploadedFile.type === 'image' && uploadedFile.preview ? (
                    <img
                      src={uploadedFile.preview}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                  ) : (
                    <div className="w-full h-24 rounded-lg border flex items-center justify-center bg-gray-100">
                      {uploadedFile.type === 'pdf' ? (
                        <svg className="w-12 h-12 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 18h12a2 2 0 002-2V6.414A2 2 0 0017.414 5L14 1.586A2 2 0 0012.586 1H4a2 2 0 00-2 2v13a2 2 0 002 2z"/>
                          <path d="M14 2v4a1 1 0 001 1h4"/>
                        </svg>
                      ) : (
                        <svg className="w-12 h-12 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H4v10h12V5h-2a1 1 0 100-2 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z"/>
                        </svg>
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    disabled={isLoading}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg truncate">
                    {uploadedFile.file.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? '生成中...' : '生成を実行'}
      </button>
    </form>
  );
}