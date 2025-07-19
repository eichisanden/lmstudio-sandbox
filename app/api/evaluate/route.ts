import { NextRequest, NextResponse } from 'next/server';
import { evaluateInterview } from '@/lib/lmstudio';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript } = body;

    if (!transcript || typeof transcript !== 'string' || transcript.length < 100) {
      return NextResponse.json(
        { error: '面談内容は100文字以上入力してください' },
        { status: 400 }
      );
    }

    const result = await evaluateInterview({ transcript });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Evaluation error:', error);
    
    return NextResponse.json(
      { error: '評価の生成中にエラーが発生しました。LMStudioが起動していることを確認してください。' },
      { status: 500 }
    );
  }
}