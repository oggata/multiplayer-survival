const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const crypto = require('crypto');

app.use(express.static('public'));

// サーバー起動時にシード値を生成
const serverSeed = Math.random();
// サーバー起動時のゲーム開始時間を記録
const gameStartTime = Date.now();

// プレイヤーの色リスト
const playerColors = [
    0x3366ff, // 青
    0xff3366, // ピンク
    0x33ff66, // 緑
    0xff6633, // オレンジ
    0x6633ff, // 紫
    0x33ffff, // シアン
    0xffff33, // 黄
    0xff3333  // 赤
];

// 使用済みの色を追跡
const usedColors = new Set();

// プレイヤー情報を保存
const players = {};

// ゾンビ情報を保存
const zombies = {};

// ゾンビの色
const zombieColor = 0x33aa33;

// ゾンビの生成間隔（ミリ秒）
const ZOMBIE_SPAWN_INTERVAL = 100;

// 時間帯ごとのゾンビの最大数
const MAX_ZOMBIES = {
    MORNING: 50,   // 朝（6:00-12:00）
    DAY: 60,      // 昼（12:00-18:00）
    EVENING: 200,  // 夕方（18:00-24:00）
    NIGHT: 300     // 夜（0:00-6:00）
};

// マップサイズ
const MAP_SIZE = 400;

// 時間設定
const TIME = {
    DAY_LENGTH: 180, // 秒
    TIME_SPEED: 0.1 // 1フレームあたりの時間進行
};

// プレイヤーのハッシュを生成する関数
function generatePlayerHash() {
    return crypto.randomBytes(16).toString('hex');
}

// プレイヤーの色をハッシュから生成する関数
function generateColorFromHash(hash) {
    // ハッシュの最初の6文字を使用して16進数の色を生成
    const colorHex = '0x' + hash.substring(0, 6);
    return parseInt(colorHex, 16);
}

// 現在の時間帯を取得する関数
function getCurrentTimeOfDay() {
    const gameDayLengthMs = TIME.DAY_LENGTH * 1000; // 1時間（ミリ秒）
    const worldTime = (Date.now() - gameStartTime) % gameDayLengthMs;
    const worldHours = Math.floor(worldTime / (gameDayLengthMs / 24));
    
    if (worldHours >= 6 && worldHours < 12) return 'MORNING';
    if (worldHours >= 12 && worldHours < 18) return 'DAY';
    if (worldHours >= 18 && worldHours < 24) return 'EVENING';
    return 'NIGHT';
}

// 現在の時間帯の最大ゾンビ数を取得する関数
function getMaxZombies() {
    return MAX_ZOMBIES[getCurrentTimeOfDay()];
}

// 時間帯が変わった時に敵の数を調整する関数
function adjustZombieCount() {
    const currentMaxZombies = getMaxZombies();
    const currentZombieCount = Object.keys(zombies).length;
    
    if (currentZombieCount > currentMaxZombies) {
        const zombiesToRemove = currentZombieCount - currentMaxZombies;
        const zombieIds = Object.keys(zombies);
        const removedZombieIds = [];
        
        // ランダムに敵を選択して削除
        for (let i = 0; i < zombiesToRemove; i++) {
            const randomIndex = Math.floor(Math.random() * zombieIds.length);
            const zombieId = zombieIds[randomIndex];
            
            // 削除する敵のIDを記録
            removedZombieIds.push(zombieId);
            
            // 敵を削除
            delete zombies[zombieId];
            
            // 削除したIDを配列から削除
            zombieIds.splice(randomIndex, 1);
        }
        
        // 削除した敵のIDを一度にクライアントに通知
        if (removedZombieIds.length > 0) {
            io.emit('zombiesKilled', removedZombieIds);
        }
    }
}

// 時間帯チェックの間隔（1分）
const TIME_CHECK_INTERVAL = 1000;
let lastTimeOfDay = getCurrentTimeOfDay();

// 定期的に時間帯をチェック
setInterval(() => {
    const currentTimeOfDay = getCurrentTimeOfDay();
    if (currentTimeOfDay !== lastTimeOfDay) {
        console.log(`時間帯が ${lastTimeOfDay} から ${currentTimeOfDay} に変わりました`);
        lastTimeOfDay = currentTimeOfDay;
        adjustZombieCount();
    }
}, TIME_CHECK_INTERVAL);

// ゾンビの生成
function spawnZombie() {
    const currentMaxZombies = getMaxZombies();
    //console.log("z=" + Object.keys(zombies).length + "/" + currentMaxZombies);

    if (Object.keys(zombies).length >= currentMaxZombies) return;
    
    const zombieId = 'zombie_' + Date.now();

    // マップサイズ内にスポーン（端から10単位の余白を設ける）
    const x = (Math.random() * (MAP_SIZE - 20)) - (MAP_SIZE / 2 - 10);
    const z = (Math.random() * (MAP_SIZE - 20)) - (MAP_SIZE / 2 - 10);
    
    zombies[zombieId] = {
        id: zombieId,
        position: { x, y: 0, z },
        rotation: { y: Math.random() * Math.PI * 2 },
        health: 100,
        target: null,
        state: 'wandering', // wandering, chasing
        lastAttack: 0
    };
    
    io.emit('zombieSpawned', zombies[zombieId]);
}

// 定期的にゾンビを生成
setInterval(spawnZombie, ZOMBIE_SPAWN_INTERVAL);

// ゾンビの更新
function updateZombies() {
    const now = Date.now();
    
    Object.values(zombies).forEach(zombie => {
        // プレイヤーとの距離を計算
        let closestPlayer = null;
        let minDistance = Infinity;
        
        Object.values(players).forEach(player => {
            // 死亡したプレイヤーは追跡対象から除外
            if (player.health <= 0) return;
            
            const dx = player.position.x - zombie.position.x;
            const dz = player.position.z - zombie.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance < minDistance) {
                minDistance = distance;
                closestPlayer = player;
            }
        });
        
        // プレイヤーが近くにいる場合、追いかける
        if (closestPlayer && minDistance < 50) {
            zombie.state = 'chasing';
            zombie.target = closestPlayer.id;
            
            // プレイヤーの方向に向かって移動
            const dx = closestPlayer.position.x - zombie.position.x;
            const dz = closestPlayer.position.z - zombie.position.z;
            const angle = Math.atan2(dx, dz);
            
            zombie.rotation.y = angle;
            
            // 移動速度を遅くする（0.5 → 0.2）
            const speed = 0.15;
            zombie.position.x += Math.sin(angle) * speed;
            zombie.position.z += Math.cos(angle) * speed;
            
            // プレイヤーに攻撃
            if (minDistance < 2 && now - zombie.lastAttack > 1000) {
                zombie.lastAttack = now;
                io.to(closestPlayer.id).emit('zombieAttack', { damage: 10 });
            }
        } else {
            // ランダムに徘徊
            zombie.state = 'wandering';
            zombie.target = null;
            
            if (Math.random() < 0.02) {
                zombie.rotation.y = Math.random() * Math.PI * 2;
            }
            
            // 徘徊時の速度を遅くする（0.2 → 0.1）
            const speed = 0.1;
            zombie.position.x += Math.sin(zombie.rotation.y) * speed;
            zombie.position.z += Math.cos(zombie.rotation.y) * speed;
        }
        
        // ゾンビの位置を更新
        io.emit('zombieMoved', {
            id: zombie.id,
            position: zombie.position,
            rotation: zombie.rotation,
            state: zombie.state
        });
    });
}

// ゾンビの更新を定期的に実行
setInterval(updateZombies, 100);

io.on('connection', (socket) => {
    console.log('プレイヤーが接続しました:', socket.id);
    
    // プレイヤーのハッシュを生成
    const playerHash = generatePlayerHash();
    
    // シード値とゲーム開始時間をクライアントに送信
    socket.emit('gameConfig', {
        seed: serverSeed,
        gameStartTime: gameStartTime,
        playerHash: playerHash
    });
    
    // 使用されていない色を探す
    let playerColor = null;
    for (const color of playerColors) {
        if (!usedColors.has(color)) {
            playerColor = color;
            usedColors.add(color);
            break;
        }
    }
    
    // すべての色が使用されている場合はランダムに選択
    if (!playerColor) {
        playerColor = playerColors[Math.floor(Math.random() * playerColors.length)];
    }
    
    // プレイヤー情報を初期化
    players[socket.id] = {
        id: socket.id,
        position: { x: 0, y: 0, z: 0 },
        rotation: { y: 0 },
        health: 100,
        color: playerColor,
        hash: playerHash
    };
    
    // 現在のプレイヤーとゾンビの情報を送信
    socket.emit('currentPlayers', Object.values(players));
    socket.emit('currentZombies', Object.values(zombies));
    
    // 新しいプレイヤーの情報を他のプレイヤーに送信
    socket.broadcast.emit('newPlayer', players[socket.id]);
    
    // プレイヤーの移動を処理
    socket.on('playerMove', (data) => {
        if (players[socket.id]) {
            players[socket.id].position = data.position;
            players[socket.id].rotation = data.rotation;
            players[socket.id].isMoving = data.isMoving || false;
            players[socket.id].isRunning = data.isRunning || false;
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });
    
    // 弾の発射を処理
    socket.on('shoot', (data) => {
        socket.broadcast.emit('bulletFired', {
            position: data.position,
            direction: data.direction,
            playerId: socket.id
        });
        
        // ゾンビとの衝突判定
        Object.values(zombies).forEach(zombie => {
            const dx = zombie.position.x - data.position.x;
            const dy = zombie.position.y - data.position.y;
            const dz = zombie.position.z - data.position.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            if (distance < 8) {
                // ゾンビにダメージを与える
                zombie.health -= 50;
                
                if (zombie.health <= 0) {
                    // ゾンビを倒した
                    io.emit('zombieKilled', zombie.id);
                    delete zombies[zombie.id];
                } else {
                    // ゾンビにダメージを与えた
                    io.emit('zombieHit', {
                        id: zombie.id,
                        health: zombie.health
                    });
                }
            }
        });
    });
    
    // プレイヤーがダメージを受けた時の処理
    socket.on('playerHit', (data) => {
        if (players[data.targetId]) {
            players[data.targetId].health -= data.damage;
            
            if (players[data.targetId].health <= 0) {
                players[data.targetId].health = 0;
                io.to(data.targetId).emit('playerDied');
            } else {
                io.to(data.targetId).emit('playerHealthUpdate', {
                    id: data.targetId,
                    health: players[data.targetId].health
                });
            }
        }
    });
    
    // プレイヤーがリスタートした時の処理
    socket.on('playerRestart', () => {
        if (players[socket.id]) {
            players[socket.id].health = 100;
            players[socket.id].position = { x: 0, y: 0, z: 0 };
            players[socket.id].rotation = { y: 0 };
            
            io.emit('playerRestarted', players[socket.id]);
        }
    });
    
    // 切断時の処理
    socket.on('disconnect', () => {
        console.log('プレイヤーが切断しました:', socket.id);
        
        // 使用していた色を解放
        if (players[socket.id]) {
            usedColors.delete(players[socket.id].color);
        }
        
        // プレイヤー情報を削除
        delete players[socket.id];
        
        // 他のプレイヤーに通知
        io.emit('playerDisconnected', socket.id);
    });
    
    // プレイヤーがメッセージを送信した時の処理
    socket.on('playerMessage', (data) => {
        // 全プレイヤーにメッセージを送信
        io.emit('showMessage', {
            playerId: socket.id,
            position: data.position
        });
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`サーバーが起動しました: http://localhost:${PORT}`);
}); 