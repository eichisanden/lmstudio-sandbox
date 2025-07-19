# CLAUDE.md

## プロジェクト概要
カジュアル面談の評価を行うWebアプリケーション。LMStudioのローカルLLMを使用して面談内容を分析し、評価を生成する。

## 技術スタック
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- LMStudio SDK
- React Hook Form + Zod

## LMStudio設定
- WebSocket接続: ws://localhost:1234
- lib/lmstudio.ts の77行目のモデル名を実際にLMStudioにロードされているモデル名に変更する必要がある
  - 例: 'lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF'
  - LMStudioで使用可能なモデル一覧から選択してください

## 開発時の注意点
- LMStudioサーバーが起動していることを確認
- 面談内容は100文字以上必要
- 評価結果はJSON形式で返される

## ディレクトリ構造
```
app/
├── page.tsx           # メインページ
├── api/
│   └── evaluate/      # 評価APIエンドポイント
components/
├── InterviewForm.tsx  # 面談入力フォーム
├── EvaluationResult.tsx # 評価結果表示
└── LoadingSpinner.tsx # ローディング表示
lib/
└── lmstudio.ts       # LMStudio連携設定
```