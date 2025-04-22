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
const ZOMBIE_SPAWN_INTERVAL = 10000;

// ゾンビの最大数
const MAX_ZOMBIES = 20;

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

// ゾンビの生成
function spawnZombie() {
    if (Object.keys(zombies).length >= MAX_ZOMBIES) return;
    
    const zombieId = 'zombie_' + Date.now();
    const x = Math.random() * 900 - 450;
    const z = Math.random() * 900 - 450;
    
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
            
            // 移動速度
            const speed = 0.5;
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
            
            const speed = 0.2;
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
            
            if (distance < 5) {
                // ゾンビにダメージを与える
                zombie.health -= 25;
                
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