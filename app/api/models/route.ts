import { NextResponse } from 'next/server';
import { LMStudioClient } from '@lmstudio/sdk';

// Function to extract a user-friendly name from the model ID
function getModelName(path: string): string {
  // e.g. "C:\\Users\\...\\ggml-model-q4_0.gguf" -> "ggml-model-q4_0"
  const parts = path.split(/[\\/]/);
  const fileName = parts.pop() || '';
  const nameParts = fileName.split('.');
  if (nameParts.length > 1) {
    nameParts.pop(); // remove extension
  }
  return nameParts.join('.');
}

export async function GET() {
  try {
    // Connect to LMStudio via SDK to get loaded models
    const client = new LMStudioClient();
    const loadedModels = await client.llm.listLoaded();
    const loadedModelIds = new Set(loadedModels.map(m => m.identifier));

    // Fetch all available models via REST API
    const response = await fetch('http://localhost:1234/v1/models');
    if (!response.ok) {
      // If the REST API fails, it's a good sign LM Studio is not running
      // or not accessible.
      throw new Error(`Failed to fetch models from LMStudio REST API: ${response.statusText}`);
    }
    
    const allModelsData = await response.json();

    // Process the model list
    const models = allModelsData.data.map((model: { id: string; }) => {
      const isLoaded = loadedModelIds.has(model.id);
      return {
        id: model.id,
        name: getModelName(model.id), // Add a user-friendly name
        loaded: isLoaded, // Add loaded status
      };
    });

    // Sort models to show loaded ones first
    models.sort((a: { loaded: boolean; name: string; }, b: { loaded: boolean; name: string; }) => {
      if (a.loaded && !b.loaded) return -1;
      if (!a.loaded && b.loaded) return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ data: models });

  } catch (error) {
    console.error('Error fetching models:', error);
    // Provide a more specific error message if connection is refused
    if (error instanceof Error && (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed'))) {
      return NextResponse.json(
        { error: 'LMStudioに接続できません。LMStudioが起動していることを確認してください。' },
        { status: 503 } // Service Unavailable
      );
    }
    return NextResponse.json(
      { error: 'LMStudioからのモデルの取得に失敗しました。' },
      { status: 500 }
    );
  }
}