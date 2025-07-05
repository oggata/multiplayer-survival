class NeonAPI {
    constructor() {
        // APIエンドポイントの設定（同じサーバーのAPIを使用）
        this.apiEndpoint = '/api/game-results';
        
        // デフォルトのユーザー情報（後で設定可能）
        this.userId = this.generateUserId();
        this.userName = this.generateUserName();
    }

    // ユーザーIDを生成（ランダムな文字列）
    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }

    // ユーザー名を生成（ランダムな名前）
    generateUserName() {
        const names = [
            'Survivor', 'Warrior', 'Hunter', 'Explorer', 'Guardian',
            'Nomad', 'Ranger', 'Scout', 'Defender', 'Voyager',
            'Pioneer', 'Sentinel', 'Pathfinder', 'Wanderer', 'Protector'
        ];
        const randomName = names[Math.floor(Math.random() * names.length)];
        const randomNumber = Math.floor(Math.random() * 1000);
        return `${randomName}${randomNumber}`;
    }

    // ユーザー情報を設定
    setUserInfo(userId, userName) {
        if (userId) this.userId = userId;
        if (userName) this.userName = userName;
    }

    // ゲーム結果をNeonデータベースに送信
    async sendGameResult(gameData) {
        try {
            const payload = {
                userId: this.userId,
                userName: this.userName,
                survivalTime: gameData.survivalTime, // 生存時間（ミリ秒）
                survivalTimeFormatted: gameData.survivalTimeFormatted, // フォーマット済み生存時間
                killedEnemies: gameData.killedEnemies || 0, // 倒した敵数
                score: gameData.score || 0, // スコア
                insertTime: new Date().toISOString(),
                updateTime: new Date().toISOString()
            };

            console.log('Neon APIに送信するデータ:', payload);

            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Neon API送信成功:', result);
            return result;

        } catch (error) {
            console.error('Neon API送信エラー:', error);
            throw error;
        }
    }

    // ゲーム結果データを準備
    prepareGameResult(survivalTime, killedEnemies = 0, score = 0) {
        // 生存時間をフォーマット
        const survivalTimeFormatted = this.formatSurvivalTime(survivalTime);
        
        // スコアを計算（生存時間と倒した敵数から）
        const calculatedScore = this.calculateScore(survivalTime, killedEnemies);

        return {
            survivalTime: survivalTime,
            survivalTimeFormatted: survivalTimeFormatted,
            killedEnemies: killedEnemies,
            score: score || calculatedScore
        };
    }

    // 生存時間をフォーマット
    formatSurvivalTime(survivalTimeMs) {
        const seconds = Math.floor(survivalTimeMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days}日 ${hours % 24}時間 ${minutes % 60}分`;
        } else if (hours > 0) {
            return `${hours}時間 ${minutes % 60}分`;
        } else if (minutes > 0) {
            return `${minutes}分 ${seconds % 60}秒`;
        } else {
            return `${seconds}秒`;
        }
    }

    // スコアを計算
    calculateScore(survivalTime, killedEnemies) {
        // 生存時間スコア（1秒 = 1ポイント）
        const timeScore = Math.floor(survivalTime / 1000);
        
        // 敵撃破スコア（1体 = 100ポイント）
        const killScore = killedEnemies * 100;
        
        // 合計スコア
        return timeScore + killScore;
    }

    // ローカルストレージからユーザー情報を読み込み
    loadUserInfo() {
        try {
            const savedUserId = localStorage.getItem('neon_user_id');
            const savedUserName = localStorage.getItem('neon_user_name');
            
            if (savedUserId) this.userId = savedUserId;
            if (savedUserName) this.userName = savedUserName;
            
            console.log('ユーザー情報を読み込みました:', { userId: this.userId, userName: this.userName });
        } catch (error) {
            console.error('ユーザー情報の読み込みエラー:', error);
        }
    }

    // ユーザー情報をローカルストレージに保存
    saveUserInfo() {
        try {
            localStorage.setItem('neon_user_id', this.userId);
            localStorage.setItem('neon_user_name', this.userName);
            console.log('ユーザー情報を保存しました:', { userId: this.userId, userName: this.userName });
        } catch (error) {
            console.error('ユーザー情報の保存エラー:', error);
        }
    }

    // 初期化
    init() {
        this.loadUserInfo();
        this.saveUserInfo();
        console.log('Neon API初期化完了');
    }

    // ランキングを取得
    async getRanking() {
        try {
            const response = await fetch('/api/game-results?limit=10');
            const result = await response.json();
            
            if (result.success) {
                console.log('ランキングを正常に取得しました:', result.data);
                return result.data;
            } else {
                console.error('ランキングの取得に失敗しました:', result.message);
                return null;
            }
        } catch (error) {
            console.error('ランキング取得エラー:', error);
            return null;
        }
    }

    // プレイヤー名を変更
    async updatePlayerName(playerId, newName) {
        try {
            const payload = {
                playerId: playerId,
                newName: newName
            };
            
            console.log('プレイヤー名変更リクエスト:', payload);
            
            const response = await fetch('/api/update-player-name', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            console.log('プレイヤー名変更レスポンス:', response.status, response.statusText);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('プレイヤー名変更HTTPエラー:', response.status, errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log('プレイヤー名変更結果:', result);
            
            if (result.success) {
                console.log('プレイヤー名が正常に更新されました:', result);
                return result;
            } else {
                console.error('プレイヤー名の更新に失敗しました:', result.message);
                return null;
            }
        } catch (error) {
            console.error('プレイヤー名更新エラー:', error);
            console.error('エラー詳細:', error.message);
            return null;
        }
    }
}

// グローバルインスタンスを作成
window.neonAPI = new NeonAPI(); 