# Bivouac - マルチプレイヤーサバイバルゲーム

## 概要
オンラインで他のプレイヤーと協力しながら、敵と戦い、アイテムを収集し、生存を目指すサバイバルゲームです。

## セットアップ

### 1. 依存関係のインストール
```bash
npm install
```

### 2. Neonデータベースの設定

#### 2.1 Neonデータベースの作成
1. [Neon](https://neon.tech)でアカウントを作成
2. 新しいプロジェクトを作成
3. 接続URLをコピー

#### 2.2 環境変数の設定
`env.example`を参考に`.env`ファイルを作成し、Neonの接続URLを設定：
```bash
cp env.example .env
# .envファイルを編集してDATABASE_URLを設定
```

#### 2.3 データベーステーブルの作成
NeonのSQLエディタで`database-setup.sql`の内容を実行してください。

### 3. サーバーの起動
```bash
npm start
```

## 機能

### ゲーム機能
- マルチプレイヤー対応
- リアルタイム戦闘
- アイテム収集システム
- サバイバル要素（空腹、喉の渇き、体温など）
- 天候システム
- 昼夜サイクル

### データベース機能
- ゲーム結果の自動保存
- ユーザー別スコア管理
- 統計情報の取得

## API エンドポイント

### POST /api/game-results
ゲーム結果をデータベースに保存
```json
{
  "userId": "user_abc123",
  "userName": "Survivor456",
  "survivalTime": 3600000,
  "survivalTimeFormatted": "1時間 0分",
  "killedEnemies": 15,
  "score": 361500,
  "insertTime": "2024-01-01T12:00:00.000Z",
  "updateTime": "2024-01-01T12:00:00.000Z"
}
```

### GET /api/game-results
ゲーム結果の一覧を取得（スコア順）
- `limit`: 取得件数（デフォルト: 10）
- `offset`: オフセット（デフォルト: 0）

### GET /api/game-results/user/:userId
特定ユーザーの最高スコアを取得

## 技術スタック
- **フロントエンド**: HTML5, CSS3, JavaScript, Three.js
- **バックエンド**: Node.js, Express.js, Socket.IO
- **データベース**: Neon (PostgreSQL)
- **音声**: Web Audio API

## 音声素材
https://soundeffect-lab.info/sound/various/