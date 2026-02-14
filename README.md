# Interview Timer Cards

面接練習をサポートするタイマーアプリ（PWA対応）

## 特徴

- 📱 **PWA対応**: スマホのホーム画面に追加してアプリとして使用可能
- 🎲 **ランダムモード**: ランダムに質問を出題
- 📝 **本番モード**: デッキの全質問を順番に練習
- 🎤 **録音機能**: 回答を録音して後から聞き返せる
- 📊 **履歴管理**: 練習記録を保存・分析
- 💾 **オフライン対応**: LocalStorageで完全にローカル保存

## 起動方法

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開く

### 3. ビルド（本番用）

```bash
npm run build
npm start
```

## ファイル構成

```
interview-timer-cards/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # ルートレイアウト
│   ├── page.tsx             # ホーム画面
│   ├── practice/
│   │   └── page.tsx         # 練習画面
│   ├── decks/
│   │   └── page.tsx         # 質問管理画面
│   ├── settings/
│   │   └── page.tsx         # 設定画面
│   ├── history/
│   │   └── page.tsx         # 履歴画面
│   └── globals.css          # グローバルスタイル
├── lib/
│   └── storage.ts           # LocalStorageユーティリティ
├── types/
│   └── index.ts             # TypeScript型定義
├── public/
│   ├── manifest.json        # PWA Manifest
│   ├── sw.js                # Service Worker
│   └── icon.svg             # アイコン
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
└── .eslintrc.json
```

## 主要機能

### ホーム画面 (/)
- 今日の練習回数・累計回数の表示
- 各モードへのナビゲーション

### 練習画面 (/practice)
- タイマー表示（カウントアップ）
- 質問カード表示
- 録音機能（トグル）
- 準備時間（設定で有効化）
- タイムオーバー警告（画面色変化・振動）
- 振り返りメモ機能

### 質問管理 (/decks)
- デッキの作成・編集・削除
- 質問の追加・編集・削除
- CSV インポート/エクスポート
- デフォルトで30問の面接質問を同梱

### 設定 (/settings)
- 準備時間の有効化・秒数設定
- 本番モードの並び順（固定/シャッフル）
- デフォルト回答時間
- 録音の保存上限

### 履歴 (/history)
- 日付ごとの練習ログ
- モード・デッキでフィルタリング
- 苦手質問ランキング（タイムオーバー回数順）
- 録音の再生

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **状態管理**: React Hooks
- **データ保存**: LocalStorage
- **録音**: Web Audio API (MediaRecorder)
- **PWA**: Service Worker + Manifest

## データ型定義

### Deck
```typescript
interface Deck {
  id: string;
  name: string;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}
```

### Question
```typescript
interface Question {
  id: string;
  text: string;
  recommendedSeconds: number;
  createdAt: string;
}
```

### SessionLog
```typescript
interface SessionLog {
  id: string;
  deckId: string;
  deckName: string;
  questionId: string;
  questionText: string;
  mode: 'random' | 'real';
  startedAt: string;
  endedAt: string;
  elapsedSeconds: number;
  recommendedSeconds: number;
  isOvertime: boolean;
  memo?: string;
  hasRecording: boolean;
  recordingData?: string; // base64
}
```

## 追加実装した改善点

1. **苦手質問ランキング**: タイムオーバーが多い質問をランキング表示
2. **準備時間カウントダウン**: 準備時間は減算形式で直感的に
3. **デッキごとのフィルタリング**: 履歴をデッキで絞り込み可能
4. **録音データの自動削除**: 設定した上限を超えると古い録音から自動削除
5. **タイムオーバー時の視覚フィードバック**: 背景色が赤に変化
6. **本番モードの進捗表示**: 全N問中の現在位置を表示
7. **CSV エクスポート機能**: デッキをCSV形式で書き出し
8. **レスポンシブデザイン**: モバイル・デスクトップ両対応
9. **日本語UI**: すべての文言を日本語化
10. **統計データ**: 今日の練習回数と累計回数を自動集計

## PWA対応

### ホーム画面への追加方法

**iOS (Safari)**
1. Safariでアプリを開く
2. 共有ボタンをタップ
3. 「ホーム画面に追加」を選択

**Android (Chrome)**
1. Chromeでアプリを開く
2. メニューから「ホーム画面に追加」を選択

## ライセンス

MIT

## 開発者向けメモ

- LocalStorageの容量制限に注意（録音データはbase64で保存されるため大きくなりがち）
- Service Workerはlocalhostとhttpsでのみ動作
- 録音機能はブラウザのマイク許可が必要
