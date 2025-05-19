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

// 敵情報を保存
const enemies = {};

// 敵の色
const enemyColor = 0x33aa33;

// 敵の生成間隔（ミリ秒）
const ENEMY_SPAWN_INTERVAL = 100;

// 時間帯ごとの敵の最大数

const MAX_ENEMIES = {
    MORNING:  300,   // 朝（6:00-12:00）0
    DAY: 300,      // 昼（12:00-18:00）0
    EVENING: 300,  // 夕方（18:00-24:00） 30
    NIGHT: 300     // 夜（0:00-6:00）70
};


// マップサイズ(クライアントと揃えてください)
const MAP_SIZE = 300;

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

// 現在の時間帯の最大敵数を取得する関数
function getMaxEnemies() {
    return MAX_ENEMIES[getCurrentTimeOfDay()];
}

// 時間帯が変わった時に敵の数を調整する関数
function adjustEnemyCount() {
    const currentMaxEnemies = getMaxEnemies();
    const currentEnemyCount = Object.keys(enemies).length;
    
    if (currentEnemyCount > currentMaxEnemies) {
        const enemiesToRemove = currentEnemyCount - currentMaxEnemies;
        const enemyIds = Object.keys(enemies);
        const removedEnemyIds = [];
        
        // ランダムに敵を選択して削除
        for (let i = 0; i < enemiesToRemove; i++) {
            const randomIndex = Math.floor(Math.random() * enemyIds.length);
            const enemyId = enemyIds[randomIndex];
            
            // 削除する敵のIDを記録
            removedEnemyIds.push(enemyId);
            
            // 敵を削除
            delete enemies[enemyId];
            
            // 削除したIDを配列から削除
            enemyIds.splice(randomIndex, 1);
        }
        
        // 削除した敵のIDを一度にクライアントに通知
        if (removedEnemyIds.length > 0) {
            io.emit('enemiesKilled', removedEnemyIds);
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
        //console.log(`時間帯が ${lastTimeOfDay} から ${currentTimeOfDay} に変わりました`);
        lastTimeOfDay = currentTimeOfDay;
        adjustEnemyCount();
    }
}, TIME_CHECK_INTERVAL);

// 敵の生成
// server.js の spawnEnemy 関数を修正

// server.js の spawnEnemy 関数を修正

function spawnEnemy() {
    const currentMaxEnemies = getMaxEnemies();
    
    if (Object.keys(enemies).length >= currentMaxEnemies) return;
    
    const enemyId = 'enemy_' + Date.now();

    // 安全なスポーン位置を見つける
    let position = findSafeEnemyPosition();
    
    // ランダムに敵のタイプを選択（基本タイプ）
    const enemyTypes = ['NORMAL', 'FAST', 'SHOOTER'];
    const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    
    // ランダムにキャラクターモデルタイプを選択
    const characterModels = ['humanoid', 'quadruped', 'hexapod'];
    const modelWeights = [0.6, 0.25, 0.15]; // 出現確率
    
    // 重み付き抽選
    let randomValue = Math.random();
    let cumulativeWeight = 0;
    let selectedModel = characterModels[0]; // デフォルト
    
    for (let i = 0; i < characterModels.length; i++) {
        cumulativeWeight += modelWeights[i];
        if (randomValue <= cumulativeWeight) {
            selectedModel = characterModels[i];
            break;
        }
    }
    
    // 異なる種類の敵ごとにHPを調整
    let enemyHealth = 20; // デフォルト
    
    if (selectedModel === 'quadruped') {
        enemyHealth = 30; // 四足歩行は強い
    } else if (selectedModel === 'hexapod') {
        enemyHealth = 25; // 六足歩行はやや強い
    }
    
    enemies[enemyId] = {
        id: enemyId,
        position: position,
        rotation: { y: Math.random() * Math.PI * 2 },
        health: enemyHealth,
        type: randomType,
        enemyType: selectedModel,
        target: null,
        state: 'wandering',
        lastAttack: 0
    };
    
    io.emit('enemySpawned', enemies[enemyId]);
}

// 安全なスポーン位置を見つける関数
function findSafeEnemyPosition() {
    const safeDistance = 5; // 他の敵やプレイヤーから最低限離れるべき距離
    const maxAttempts = 20; // 最大試行回数
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // マップサイズ内にスポーン（端から10単位の余白を設ける）
        const x = (Math.random() * (MAP_SIZE - 20)) - (MAP_SIZE / 2 - 10);
        const z = (Math.random() * (MAP_SIZE - 20)) - (MAP_SIZE / 2 - 10);
        
        // この位置が他の敵から十分離れているか確認
        let isSafe = true;
        
        // 他の敵との距離チェック
        Object.values(enemies).forEach(enemy => {
            const dx = enemy.position.x - x;
            const dz = enemy.position.z - z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance < safeDistance) {
                isSafe = false;
            }
        });
        
        // プレイヤーとの距離チェック
        Object.values(players).forEach(player => {
            if (player.health <= 0) return;
            
            const dx = player.position.x - x;
            const dz = player.position.z - z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            // プレイヤーの近くには出現させない（遠すぎても面白くない）
            if (distance < safeDistance * 3 || distance > 100) {
                isSafe = false;
            }
        });
        
        // 安全な場所が見つかった場合
        if (isSafe) {
            return { x, y: 0, z };
        }
    }
    
    // 安全な場所が見つからなかった場合はデフォルト値を返す
    return { x: Math.random() * 100 - 50, y: 0, z: Math.random() * 100 - 50 };
}
// 定期的に敵を生成
setInterval(spawnEnemy, ENEMY_SPAWN_INTERVAL);

// 敵の更新
// server.js の updateEnemies 関数内を修正

// server.js の updateEnemies 関数を修正

// server.js の updateEnemies 関数を修正

function updateEnemies() {
    const now = Date.now();
    
    // すべての敵のリスト
    const enemyList = Object.values(enemies);
    
    enemyList.forEach(enemy => {
        // 敵が死亡している場合はスキップ
        if (enemy.health <= 0) return;

        // プレイヤーとの距離を計算
        let closestPlayer = null;
        let minDistance = Infinity;
        
        Object.values(players).forEach(player => {
            // 死亡したプレイヤーは追跡対象から除外
            if (player.health <= 0) return;
            
            const dx = player.position.x - enemy.position.x;
            const dz = player.position.z - enemy.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance < minDistance) {
                minDistance = distance;
                closestPlayer = player;
            }
        });

        // 移動前の位置を保存
        const oldPosition = { ...enemy.position };
        
        // 最も近いプレイヤーが一定距離以上離れている場合、更新頻度を下げる
        const updateThreshold = 100; // この距離以上なら更新頻度を下げる
        const shouldUpdate = minDistance < updateThreshold || Math.random() < 0.2;
        
        if (!shouldUpdate) {
            return; // 遠くの敵の更新をスキップ
        }

        // プレイヤーが近くにいる場合、追いかける
        if (closestPlayer && minDistance < 50) {
            enemy.state = 'chasing';
            enemy.target = closestPlayer.id;
            
            // プレイヤーの方向に向かって移動
            const dx = closestPlayer.position.x - enemy.position.x;
            const dz = closestPlayer.position.z - enemy.position.z;
            const angle = Math.atan2(dx, dz);
            
            enemy.rotation.y = angle;
            
            // 移動速度を設定
            const speed = 0.15;
            
            // 移動方向と距離を計算
            const moveX = Math.sin(angle) * speed;
            const moveZ = Math.cos(angle) * speed;
            
            // 新しい位置を計算
            const newPosition = {
                x: enemy.position.x + moveX,
                y: enemy.position.y,
                z: enemy.position.z + moveZ
            };
            
            // 敵同士の衝突チェック
            let hasCollision = false;
            
            // すべての他の敵との衝突をチェック
            for (const otherEnemy of enemyList) {
                // 自分自身または死亡した敵はスキップ
                if (otherEnemy.id === enemy.id || otherEnemy.health <= 0) continue;
                
                // 2つの敵の間の距離を計算
                const dx = otherEnemy.position.x - newPosition.x;
                const dz = otherEnemy.position.z - newPosition.z;
                const distance = Math.sqrt(dx * dx + dz * dz);
                
                // 衝突判定の距離
                const collisionDistance = 1.6; // 敵のサイズに応じて調整
                
                if (distance < collisionDistance) {
                    hasCollision = true;
                    
                    // 衝突回避のロジック：障害物を迂回するような動き
                    // 衝突方向に対して垂直な方向に少し動かす
                    if (Math.random() < 0.5) {
                        // 左に曲がる
                        enemy.rotation.y += Math.PI / 8;
                    } else {
                        // 右に曲がる
                        enemy.rotation.y -= Math.PI / 8;
                    }
                    
                    break; // 衝突が見つかったらループを抜ける
                }
            }
            
            // プレイヤーとの衝突チェック
            Object.values(players).forEach(player => {
                if (player.health <= 0) return;
                
                const dx = player.position.x - newPosition.x;
                const dz = player.position.z - newPosition.z;
                const distance = Math.sqrt(dx * dx + dz * dz);
                
                // 攻撃距離より近づきすぎないようにする
                const minPlayerDistance = 1.6;
                
                if (distance < minPlayerDistance) {
                    hasCollision = true;
                    // プレイヤーに攻撃（クールダウンが経過していれば）
                    if (now - enemy.lastAttack > 1000) {
                        enemy.lastAttack = now;
                        enemy.state = 'attacking';
                        io.to(player.id).emit('enemyAttack', { damage: 10 });
                        
                        // 攻撃状態の送信
                        io.emit('enemyStateChanged', {
                            id: enemy.id,
                            state: 'attacking'
                        });
                        
                        // 0.5秒後に追跡状態に戻す
                        setTimeout(() => {
                            if (enemy && enemy.health > 0) {
                                enemy.state = 'chasing';
                                io.emit('enemyStateChanged', {
                                    id: enemy.id,
                                    state: 'chasing'
                                });
                            }
                        }, 500);
                    }
                }
            });
            
            // 衝突がなく、マップ内であれば位置を更新
            if (!hasCollision && 
                Math.abs(newPosition.x) <= MAP_SIZE / 2 && 
                Math.abs(newPosition.z) <= MAP_SIZE / 2) {
                enemy.position = newPosition;
            } else if (hasCollision) {
                // 衝突があった場合、少し後ろに下がる
                enemy.position.x -= moveX * 0.5;
                enemy.position.z -= moveZ * 0.5;
            }
            
        } else {
            // ランダムに徘徊
            enemy.state = 'wandering';
            enemy.target = null;
            
            if (Math.random() < 0.02) {
                enemy.rotation.y = Math.random() * Math.PI * 2;
            }
            
            // 徘徊時の速度
            const speed = 0.1;
            
            // 移動方向と距離を計算
            const moveX = Math.sin(enemy.rotation.y) * speed;
            const moveZ = Math.cos(enemy.rotation.y) * speed;
            
            // 新しい位置を計算
            const newPosition = {
                x: enemy.position.x + moveX,
                y: enemy.position.y,
                z: enemy.position.z + moveZ
            };
            
            // 敵同士の衝突チェック
            let hasCollision = false;
            
            // すべての他の敵との衝突をチェック
            for (const otherEnemy of enemyList) {
                // 自分自身または死亡した敵はスキップ
                if (otherEnemy.id === enemy.id || otherEnemy.health <= 0) continue;
                
                // 2つの敵の間の距離を計算
                const dx = otherEnemy.position.x - newPosition.x;
                const dz = otherEnemy.position.z - newPosition.z;
                const distance = Math.sqrt(dx * dx + dz * dz);
                
                // 衝突判定の距離
                const collisionDistance = 1.6; // 敵のサイズに応じて調整
                
                if (distance < collisionDistance) {
                    hasCollision = true;
                    
                    // 衝突回避：ランダムに方向を変える
                    enemy.rotation.y = Math.random() * Math.PI * 2;
                    
                    break; // 衝突が見つかったらループを抜ける
                }
            }
            
            // プレイヤーとの衝突チェック
            Object.values(players).forEach(player => {
                if (player.health <= 0) return;
                
                const dx = player.position.x - newPosition.x;
                const dz = player.position.z - newPosition.z;
                const distance = Math.sqrt(dx * dx + dz * dz);
                
                // 攻撃距離より近づきすぎないようにする
                const minPlayerDistance = 1.6;
                
                if (distance < minPlayerDistance) {
                    hasCollision = true;
                    
                    // プレイヤーを見つけたので追跡状態に変更
                    enemy.state = 'chasing';
                    enemy.target = player.id;
                    
                    // プレイヤーの方を向く
                    const angle = Math.atan2(dx, dz);
                    enemy.rotation.y = angle;
                }
            });
            
            // 衝突がなく、マップ内であれば位置を更新
            if (!hasCollision && 
                Math.abs(newPosition.x) <= MAP_SIZE / 2 && 
                Math.abs(newPosition.z) <= MAP_SIZE / 2) {
                enemy.position = newPosition;
            }
        }
        
        // 敵の位置と状態を更新
        io.emit('enemyMoved', {
            id: enemy.id,
            position: enemy.position,
            rotation: enemy.rotation,
            state: enemy.state
        });
    });
    
    // 敵の密集状態を解消するための追加処理
    resolveCrowding(enemyList);
}

// 敵の密集状態を解消する関数
function resolveCrowding(enemyList) {
    // 互いに近すぎる敵のペアを見つける
    const crowdingThreshold = 1.6; // 近すぎる距離の閾値
    
    for (let i = 0; i < enemyList.length; i++) {
        const enemy1 = enemyList[i];
        if (enemy1.health <= 0) continue;
        
        for (let j = i + 1; j < enemyList.length; j++) {
            const enemy2 = enemyList[j];
            if (enemy2.health <= 0) continue;
            
            // 2つの敵の間の距離を計算
            const dx = enemy2.position.x - enemy1.position.x;
            const dz = enemy2.position.z - enemy1.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            // 敵が近すぎる場合
            if (distance < crowdingThreshold) {
                // 反発力を計算（距離が短いほど強い）
                const force = (crowdingThreshold - distance) / crowdingThreshold;
                const angle = Math.atan2(dx, dz);
                
                // 敵1を反対方向に押す
                enemy1.position.x -= Math.sin(angle) * force * 0.1;
                enemy1.position.z -= Math.cos(angle) * force * 0.1;
                
                // 敵2を反対方向に押す
                enemy2.position.x += Math.sin(angle) * force * 0.1;
                enemy2.position.z += Math.cos(angle) * force * 0.1;
                
                // マップの境界チェック
                enemy1.position.x = Math.max(-MAP_SIZE/2, Math.min(MAP_SIZE/2, enemy1.position.x));
                enemy1.position.z = Math.max(-MAP_SIZE/2, Math.min(MAP_SIZE/2, enemy1.position.z));
                enemy2.position.x = Math.max(-MAP_SIZE/2, Math.min(MAP_SIZE/2, enemy2.position.x));
                enemy2.position.z = Math.max(-MAP_SIZE/2, Math.min(MAP_SIZE/2, enemy2.position.z));
                
                // 変更を通知
                io.emit('enemyMoved', {
                    id: enemy1.id,
                    position: enemy1.position,
                    rotation: enemy1.rotation,
                    state: enemy1.state
                });
                
                io.emit('enemyMoved', {
                    id: enemy2.id,
                    position: enemy2.position,
                    rotation: enemy2.rotation,
                    state: enemy2.state
                });
            }
        }
    }
}

// 敵の更新を定期的に実行
setInterval(updateEnemies, 100);

function getSpawnPosition() {
    // If no players are connected, return a safe default position
    // Using (0,0,0) can be risky if buildings are generated there
    if (Object.keys(players).length === 0) {
        // Use a position that's likely to be in an open area
        // Try several pre-defined safe areas
        const safeAreas = [
            { x: 100, y: 0, z: 100 },
            { x: -100, y: 0, z: 100 },
            { x: 100, y: 0, z: -100 },
            { x: -100, y: 0, z: -100 }
        ];
        return safeAreas[Math.floor(Math.random() * safeAreas.length)];
    }

    // Get a random player as reference
    const playerKeys = Object.keys(players);
    const randomPlayer = players[playerKeys[Math.floor(Math.random() * playerKeys.length)]];
    
    // Use much larger offsets to avoid building clusters
    const maxAttempts = 15; // Increase attempts
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        // Use larger offsets to find open areas
        const offset = {
            x: (Math.random() - 0.5) * 60, // Increased from 10 to 60
            y: 0,
            z: (Math.random() - 0.5) * 60  // Increased from 10 to 60
        };
        
        const newPosition = {
            x: randomPlayer.position.x + offset.x,
            y: 0,
            z: randomPlayer.position.z + offset.z
        };
        
        // Keep within map boundaries
        newPosition.x = Math.max(-450, Math.min(450, newPosition.x));
        newPosition.z = Math.max(-450, Math.min(450, newPosition.z));
        
        attempts++;
        
        // Return this position - client will check and correct if needed
        return newPosition;
    }
    
    // Return a fallback position away from the center
    return { x: 200, y: 0, z: 200 };
}


// プレイヤーのスポーン位置を取得する関数
function getSpawnPosition() {
    const players = Object.values(io.sockets.sockets).map(socket => socket.player);
    if (players.length === 0) {
        //console.log('他のプレイヤーがいないため、デフォルト位置を使用します');
        // 他のプレイヤーがいない場合はデフォルト位置
        return { x: 9, y: 0, z: 0 };
    }

    // ランダムに他のプレイヤーを選択
    const randomPlayer = players[Math.floor(Math.random() * players.length)];
    
    // 最大試行回数
    const maxAttempts = 10;
    let attempts = 0;
    
    /*
    while (attempts < maxAttempts) {
        // プレイヤーの周囲にランダムなオフセットを加える
        const offset = {
            x: (Math.random() - 0.5) * 10, // -5から5の範囲でランダム
            y: 0,
            z: (Math.random() - 0.5) * 10  // -5から5の範囲でランダム
        };
        
        // 新しい位置を計算
        const newPosition = {
            x: randomPlayer.position.x + offset.x,
            y: 0,
            z: randomPlayer.position.z + offset.z
        };
        
        // マップの境界内に収める
        newPosition.x = Math.max(-450, Math.min(450, newPosition.x));
        newPosition.z = Math.max(-450, Math.min(450, newPosition.z));
        
        // 建物との衝突チェック（必要に応じて実装）
        // if (!checkCollision(newPosition)) {
        //     return newPosition;
        // }
        
        attempts++;
    }
    */
    // 最大試行回数を超えた場合は、選択したプレイヤーの位置を返す
    return randomPlayer.position;
}

io.on('connection', (socket) => {
    console.log('プレイヤーが接続しました:', socket.id);
    
    // プレイヤーの色をランダムに生成
    const playerColor = Math.floor(Math.random() * 0xffffff);
    const playerHash = Math.random().toString(36).substring(2, 8);
    
    // スポーン位置を取得
    const spawnPosition = getSpawnPosition();
    
    players[socket.id] = {
        id: socket.id,
        position: spawnPosition,
        rotation: { y: 0 },
        health: 100,
        color: playerColor,
        hash: playerHash
    };
    
    // シード値とゲーム開始時間をクライアントに送信
    socket.emit('gameConfig', {
        seed: serverSeed,
        gameStartTime: gameStartTime,
        playerHash: playerHash
    });
    
    // 現在のプレイヤーと敵の情報を送信
    socket.emit('currentPlayers', Object.values(players));
    socket.emit('currentEnemies', Object.values(enemies));
    
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
            playerId: socket.id,
            weponId: data.weponId,
            bulletDamage:data.bulletDamage
        });
        
        // 敵との衝突判定
        Object.values(enemies).forEach(enemy => {
            const dx = enemy.position.x - data.position.x;
            const dy = enemy.position.y - data.position.y;
            const dz = enemy.position.z - data.position.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            const bulletDamage = data.bulletDamage;
            if (distance < 8) {
                // 敵にダメージを与える
                enemy.health -= bulletDamage;
                
                if (enemy.health <= 0) {
                    // 敵の死亡を通知
                    io.emit('enemyDied', enemy.id);
                    // 敵を倒したことを通知
                    io.emit('enemiesKilled', [enemy.id]);
                    // 即座に敵を削除
                    delete enemies[enemy.id];
                } else {
                    // 敵にダメージを与えた
                    io.emit('enemyHit', {
                        id: enemy.id,
                        health: enemy.health
                    });
                }
            }
        });
    });

    // 敵の死亡イベントを処理
    socket.on('enemyDied', (enemyId) => {
        if (enemies[enemyId]) {
            // 敵の死亡を通知
            io.emit('enemyDied', enemyId);
            // 敵を倒したことを通知
            io.emit('enemiesKilled', [enemyId]);
            // 即座に敵を削除
            delete enemies[enemyId];
        }
    });
    
    // プレイヤーがリスタートした時の処理
    socket.on('playerRestart', () => {
        if (players[socket.id]) {
            players[socket.id].health = 100;
            //players[socket.id].position = { x: 0, y: 0, z: 0 };
            //players[socket.id].rotation = { y: 0 };
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