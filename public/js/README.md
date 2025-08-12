# JavaScript ファイル構成

このディレクトリには、マルチプレイヤーサバイバルゲームのJavaScriptファイルが整理されて配置されています。

## ディレクトリ構成

### `/core/` - コアシステム
- **game.js** - メインゲームクラス（ゲームの中心的な制御）
- **config.js** - ゲーム設定ファイル（定数、パラメータ）
- **raycast.js** - レイキャスト機能（衝突判定、視線判定）

### `/characters/` - キャラクター関連
- **character.js** - 基本キャラクタークラス（共通機能）
- **player.js** - プレイヤークラス（プレイヤーの動作制御）
- **playerStatus.js** - プレイヤーステータス管理（HP、空腹、喉の渇きなど）

#### `/characters/enemies/` - 敵キャラクター
- **enemyCharacter.js** - 基本敵キャラクタークラス
- **bossCharacter.js** - ボスキャラクター
- **crabCharacter.js** - カニ型敵
- **fatCharacter.js** - 太った敵
- **flyingCharacter.js** - 飛行型敵
- **giantCharacter.js** - 巨大敵
- **hexapodCharacter.js** - 六脚型敵
- **quadrupedCharacter.js** - 四脚型敵
- **slimeCharacter.js** - スライム型敵
- **enhancedEnemy.js** - 強化された敵

### `/items/` - アイテム関連
- **items.js** - アイテム設定（アイテムの種類、効果）
- **item.js** - アイテムクラス（アイテムの基本機能）
- **itemManager.js** - アイテム管理（収集、インベントリ）
- **itemEffectManager.js** - アイテム効果管理（効果の適用、表示）

### `/weapons/` - 武器関連
- **weaponManager.js** - 武器管理（射撃、武器切り替え）
- **bullet.js** - 弾丸クラス（プレイヤーの弾）
- **enemyBullet.js** - 敵の弾丸クラス

### `/world/` - ワールド関連
- **fieldmap.js** - フィールドマップ（地形、マップ生成）
- **fieldobject.js** - フィールドオブジェクト（木、建物など）
- **terrainManager.js** - 地形管理（地形の生成、更新）
- **weather.js** - 天候システム（雨、雪、霧など）

### `/ui/` - UI関連
- **uiManager.js** - UI管理（全体的なUI制御）
- **uiSetup.js** - UI設定（ボタン、レイアウト）
- **messageManager.js** - メッセージ管理（通知、チャット）
- **rankingManager.js** - ランキング管理（スコア、順位）
- **settingsManager.js** - 設定管理（ゲーム設定、オプション）

### `/managers/` - 各種マネージャー
- **audioManager.js** - 音声管理（BGM、効果音）
- **effectManager.js** - エフェクト管理（視覚効果）
- **memoryManager.js** - メモリ管理（データ保存、読み込み）
- **mission.js** - ミッション管理（クエスト、目標）
- **timeManager.js** - 時間管理（ゲーム内時間、昼夜）

### `/effects/` - エフェクト関連
- **neon.js** - ネオンエフェクト（視覚効果）

## ファイル読み込み順序

index.htmlでの読み込み順序は以下の通りです：

1. **Core** - 基本システム
2. **Items** - アイテムシステム
3. **Managers** - 各種マネージャー
4. **Characters** - キャラクターシステム
5. **Enemy Characters** - 敵キャラクター
6. **Weapons** - 武器システム
7. **World** - ワールドシステム
8. **UI** - UIシステム
9. **Effects** - エフェクト
10. **Core Game** - メインゲーム（最後に読み込み）

## 開発ガイドライン

### 新しいファイルを追加する場合
1. 適切なディレクトリに配置する
2. index.htmlに読み込み順序を考慮して追加する
3. 依存関係を考慮する（依存するファイルより後に読み込む）

### ファイル名の命名規則
- クラス名はPascalCase（例：PlayerStatus）
- ファイル名はcamelCase（例：playerStatus.js）
- ディレクトリ名は小文字（例：characters）

### コードの整理
- 関連する機能は同じディレクトリに配置
- 大きなファイルは機能ごとに分割
- 共通機能は適切なマネージャークラスに移動
