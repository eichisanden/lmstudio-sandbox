# AIプロンプトジェネレーター（LMStudio連携）

Next.jsとLMStudioを使用したAIプロンプトジェネレーターです。画像、PDF、テキストファイルをアップロードして、ローカルLLMで処理できます。

## 機能

- 🖼️ **画像アップロード**: Vision対応モデル（LLaVAなど）で画像を解析
- 📄 **PDFファイル処理**: PDFからテキストを抽出してプロンプトに含める
- 📝 **テキストファイル対応**: .txt、.mdファイルの内容を読み込み
- 💾 **システムプロンプト保存**: よく使うシステムプロンプトを保存・再利用
- 🔄 **ストリーミング応答**: リアルタイムでAIの応答を表示

## セットアップ

1. **LMStudioのインストールと起動**
   - [LMStudio](https://lmstudio.ai/)をダウンロードしてインストール
   - LMStudioを起動（WebSocketサーバーがws://localhost:1234で起動）

2. **モデルのロード**
   - LMStudioでモデルを事前にロードしてください
   - 推奨モデル:
     - テキスト処理: `google/gemma-3-12b` または類似の日本語対応モデル
     - 画像処理: `llava-v1.5-7b` などのVision対応モデル
   - **重要**: モデルのロードは事前に完了させてください（システムリソースの制約のため）

3. **プロジェクトのセットアップ**
   ```bash
   npm install
   ```

4. **開発サーバーの起動**
   ```bash
   npm run dev
   ```

## 使い方

1. ブラウザで http://localhost:3000 にアクセス
2. モデルを選択（LMStudioにロードされているモデルが表示されます）
3. システムプロンプト（任意）とユーザープロンプトを入力
4. 必要に応じてファイルをアップロード
   - 画像: PNG、JPG、GIFなど
   - PDF: テキスト抽出して処理
   - テキスト: .txt、.mdファイル
5. 「生成を実行」ボタンをクリック

## ファイルアップロード

### 対応ファイル形式
- **画像**: PNG、JPG、GIF、WebPなど（Vision対応モデル使用時）
- **PDF**: テキスト形式のPDF（スキャンPDFは非対応）
- **テキスト**: .txt、.md（UTF-8エンコード）

### ファイルサイズ制限
- 最大10MBまで
- 複数ファイルの同時アップロード可能

## トラブルシューティング

### "システムリソースが不足しています" エラー
- LMStudioでモデルを事前にロードしてください
- メモリ使用量を確認し、必要に応じて他のアプリケーションを終了してください
- より小さいモデルの使用を検討してください

### "LMStudioに接続できません" エラー
- LMStudioが起動していることを確認
- WebSocketサーバーがws://localhost:1234で稼働していることを確認
- ファイアウォールやセキュリティソフトが接続をブロックしていないか確認

### "The number of tokens to keep from the initial prompt is greater than the context length" エラー
- プロンプトやファイルの内容が長すぎます
- より短いプロンプトを使用するか、ファイルのサイズを小さくしてください
- コンテキスト長の大きいモデルの使用を検討してください

### PDFが読み込めない
- テキスト形式のPDFのみ対応（スキャンPDFは非対応）
- PDFが破損していないか確認してください
- より単純な構造のPDFで試してください

### 画像が処理されない
- Vision対応モデル（LLaVAなど）を使用していることを確認
- 画像サイズが大きすぎる場合は縮小してください
- サポートされている画像形式（PNG、JPG、GIFなど）を使用してください

## 技術スタック

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- LMStudio SDK v1.3.0
- React Hook Form + Zod
- pdf2json（PDF処理）

## 注意事項

- このアプリケーションはローカルLLMを使用するため、インターネット接続は不要です
- 処理速度はお使いのマシンスペックとモデルサイズに依存します
- 画像処理にはVision対応モデルが必要です