import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, systemPrompt, userPrompt } = body;

    if (!model || typeof model !== 'string') {
      return NextResponse.json(
        { error: 'モデルを選択してください' },
        { status: 400 }
      );
    }

    // systemPromptは任意項目

    if (!userPrompt || typeof userPrompt !== 'string') {
      return NextResponse.json(
        { error: 'ユーザープロンプトを入力してください' },
        { status: 400 }
      );
    }

    // ストリーミングレスポンスのためのエンコーダー
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // 非同期でストリーミング処理を実行
    (async () => {
      try {
        const { generateResponseStream } = await import('@/lib/lmstudio');
        
        await generateResponseStream({ model, systemPrompt, userPrompt }, async (chunk: string) => {
          // チャンクをSSE形式で送信
          await writer.write(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
        });
        
        // 完了シグナルを送信
        await writer.write(encoder.encode(`data: [DONE]\n\n`));
      } catch (error: any) {
        console.error('Streaming error:', error);
        await writer.write(encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`));
      } finally {
        await writer.close();
      }
    })();

    // Server-Sent Eventsとしてレスポンスを返す
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Evaluation error:', error);
    
    return NextResponse.json(
      { error: '生成中にエラーが発生しました。LMStudioが起動していることを確認してください。' },
      { status: 500 }
    );
  }
}