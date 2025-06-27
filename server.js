const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const crypto = require('crypto');
const { createNoise2D } = require('simplex-noise');

app.use(express.static('public'));

// 安全なスポーン位置を取得するAPIエンドポイント
app.get('/api/safe-spawn-positions', (req, res) => {
    res.json({
        safeSpawnPositions: safeSpawnPositions,
        safeSpotDistance: SAFE_SPOT_DISTANCE
    });
});

// サーバー起動時にシード値を生成
const serverSeed = Math.random();
//console.log(`Server seed: ${serverSeed}`);
// サーバー起動時のゲーム開始時間を記録
const gameStartTime = Date.now();

const keyItemStayTime = 30000;

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

// 敵の生成間隔（ミリ秒）
const ENEMY_SPAWN_INTERVAL = 500; // 5秒ごとに敵を生成

// プレイヤーの視界範囲（単位）
const PLAYER_VISION_RANGE = 100;

// 敵のスポーン範囲（プレイヤーからの距離）
const SPAWN_RANGE = {
    MIN: 30,  // 最小距離を短縮
    MAX: 80   // 最大距離を短縮
};

// プレイヤーの移動先予測範囲
const PLAYER_PREDICTION_RANGE = 50; // 予測範囲を短縮

// 時間帯ごとの敵の最大数
const MAX_ENEMIES = {
    MORNING:  30,   // 朝（6:00-12:00）0
    DAY: 50,      // 昼（12:00-18:00）0
    EVENING: 100,  // 夕方（18:00-24:00） 30
    NIGHT: 300     // 夜（0:00-6:00）70
};

const SPAWN_DISTANCE_TO_PLAYER = 1000;

// マップサイズ(クライアントと揃えてください)
const MAP_SIZE = 6000;

// 時間設定
const TIME = {
    DAY_LENGTH: 180, // 秒
    TIME_SPEED: 0.1 // 1フレームあたりの時間進行
};

// 敵の設定
const ENEMY_CONFIG = {
    NORMAL: {
        model: 'humanoid',
        visionRange: 30,
        speed:  0.2,
        health: 40,
        weight: 0.6
    },
    SLIME: {
        model: 'slime',
        visionRange: 10,
        speed: 0.2,
        health: 40,
        weight: 0.3
    },
    FAST: {
        model: 'quadruped',
        visionRange: 40,
        speed: 0.5,
        health: 40,
        weight: 0.25
    },
    SHOOTER: {
        model: 'hexapod',
        visionRange: 40,
        speed: 0.2,
        health: 40,
        weight: 0.15,
        shootInterval: 6000, // 3秒ごとに弾を発射
        bulletSpeed: 15,
        bulletDamage: 15
    },
    GIANT: {
        model: 'giant',
        visionRange: 40,
        speed: 0.1,
        health: 70,
        weight: 0.1
    },
    CRAB: {
        model: 'crab',
        visionRange: 20,
        speed: 0.3,
        health: 50,
        weight: 0.2
    },
    FLYING: {
        model: 'flying',
        visionRange: 30,
        speed: 0.7,
        health: 15,
        weight: 0.15
    },
    BOSS: {
        model: 'boss',
        visionRange: 40,
        speed: 0.2,
        health: 300,
        weight: 0.05
    }
};

// 夜間の倍率
const NIGHT_MULTIPLIER = 1.2;

// バイオームの設定
const BIOME_CONFIG = {
    TYPES: ['urban', 'forest', 'ruins', 'industrial'],
    RADIUS: 500,  // バイオームの半径
    BEACH_WIDTH: 15,  // 砂浜の幅
    BIOMES: {
        urban: {
            name: 'urban',
            color: 0x2C2C2C,
            enemyWeights: {
                NORMAL: 1,
                FAST: 0,
                SHOOTER: 0,
                GIANT: 0,
                CRAB: 0,
                FLYING: 0,
                SLIME: 0,
                BOSS: 0
            }
        },
        forest: {
            name: 'forest',
            color: 0x1B3D1B,
            enemyWeights: {
                NORMAL: 0,
                FAST: 1,
                SHOOTER: 0,
                GIANT: 0.05,
                CRAB: 0.1,
                FLYING: 0.2,
                SLIME: 0.3,
                BOSS: 0.02
            }
        },
        ruins: {
            name: 'ruins',
            color: 0x4A3A2A,
            enemyWeights: {
                NORMAL: 0,
                FAST: 0,
                SHOOTER: 1,
                GIANT: 0.2,
                CRAB: 0.1,
                FLYING: 0.1,
                SLIME: 0.2,
                BOSS: 0.1
            }
        },
        industrial: {
            name: 'industrial',
            color: 0x2A2A2A,
            enemyWeights: {
                NORMAL: 0.6,
                FAST: 0.2,
                SHOOTER: 0.2,
                GIANT: 0.15,
                CRAB: 0.1,
                FLYING: 0.1,
                SLIME: 0.1,
                BOSS: 0.08
            }
        },
        beach: {
            name: 'beach',
            color: 0x3A3A2A,
            enemyWeights: {
                NORMAL: 0.3,
                FAST: 0.6,
                SHOOTER: 0.1,
                GIANT: 0.05,
                CRAB: 0.4,
                FLYING: 0.1,
                SLIME: 0.1,
                BOSS: 0.02
            }
        }
    }
};

// バイオームの生成
function generateBiomes() {
    const biomes = [];  // ローカルな配列を作成
    const mapSize = MAP_SIZE;
    const biomeRadius = BIOME_CONFIG.RADIUS;
    const beachWidth = BIOME_CONFIG.BEACH_WIDTH;
    
    // バイオームの配置を決定
    for (let x = -mapSize/2; x < mapSize/2; x += 100) {
        for (let z = -mapSize/2; z < mapSize/2; z += 100) {
            // マップの端からbeachWidth以内の距離かどうかをチェック
            const distanceFromEdge = Math.min(
                Math.abs(x + mapSize/2),
                Math.abs(x - mapSize/2),
                Math.abs(z + mapSize/2),
                Math.abs(z - mapSize/2)
            );
            
            let biomeType;
            if (distanceFromEdge < beachWidth) {
                // マップの端は砂浜
                biomeType = 'beach';
            } else {
                // 中心からの距離を計算
                const distanceFromCenter = Math.sqrt(x * x + z * z);
                
                // バイオームの種類を決定（距離に基づいて）
                const biomeIndex = Math.floor(distanceFromCenter / biomeRadius) % BIOME_CONFIG.TYPES.length;
                biomeType = BIOME_CONFIG.TYPES[biomeIndex];
            }
            
            biomes.push({
                type: biomeType,
                x: x,
                z: z,
                size: 50
            });
        }
    }
    
    return biomes;  // 生成したバイオーム配列を返す
}

// 座標からバイオームを取得
function getBiomeAt(x, z, biomes) {
    const gridX = Math.floor(x / 100) * 100;
    const gridZ = Math.floor(z / 100) * 100;
    
    const biome = biomes.find(b => b.x === gridX && b.z === gridZ);
    return biome ? BIOME_CONFIG.BIOMES[biome.type] : BIOME_CONFIG.BIOMES.urban;
}

// サーバー起動時にバイオームを生成
const biomes = generateBiomes();

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
        const count = Object.keys(enemies).length;
        adjustEnemyCount();
    }
}, TIME_CHECK_INTERVAL);

// 敵の生成
function spawnEnemy() {
    const currentMaxEnemies = getMaxEnemies();
    
    if (Object.keys(enemies).length >= currentMaxEnemies) return;
    
    const enemyId = 'enemy_' + Date.now();

    // 安全なスポーン位置を見つける
    let position = findSafeEnemyPosition();
    
    // スポーン位置のバイオームを取得
    const biome = getBiomeAt(position.x, position.z, biomes);
    
    // バイオームに応じた敵の出現確率を取得
    const enemyTypes = Object.keys(ENEMY_CONFIG);
    const weights = enemyTypes.map(type => biome.enemyWeights[type]);
    
    // 重み付き抽選
    let randomValue = Math.random();
    let cumulativeWeight = 0;
    let selectedType = enemyTypes[0]; // デフォルト
    
    for (let i = 0; i < enemyTypes.length; i++) {
        cumulativeWeight += weights[i];
        if (randomValue <= cumulativeWeight) {
            selectedType = enemyTypes[i];
            break;
        }
    }
    
    const enemyConfig = ENEMY_CONFIG[selectedType];
    
    enemies[enemyId] = {
        id: enemyId,
        position: position,
        rotation: { y: Math.random() * Math.PI * 2 },
        health: enemyConfig.health,
        type: selectedType,
        enemyType: enemyConfig.model,
        target: null,
        state: 'wandering',
        lastAttack: 0,
        lastShootTime: 0,
        config: {
            visionRange: enemyConfig.visionRange,
            speed: enemyConfig.speed,
            shootInterval: enemyConfig.shootInterval,
            bulletSpeed: enemyConfig.bulletSpeed,
            bulletDamage: enemyConfig.bulletDamage
        }
    };
    
    io.emit('enemySpawned', enemies[enemyId]);
}

const randRange = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

// 安全なスポーン位置のリスト（座標間の距離が300以上）
const safeSpawnPositions = [
    // 中心エリア
    { x: 0, y: 0, z: -200 },
    { x: 400, y: 0, z: -200 },
    { x: -400, y: 0, z: -200 },
    { x: 0, y: 0, z: 200 },
    { x: 400, y: 0, z: 200 },
    { x: -400, y: 0, z: 200 }
    
    /*
    // 北エリア
    { x: 200, y: 0, z: -600 },
    { x: -200, y: 0, z: -600 },
    { x: 600, y: 0, z: -600 },
    { x: -600, y: 0, z: -600 },
    
    // 南エリア
    { x: 200, y: 0, z: 600 },
    { x: -200, y: 0, z: 600 },
    { x: 600, y: 0, z: 600 },
    { x: -600, y: 0, z: 600 },
    
    // 東エリア
    { x: 800, y: 0, z: 0 },
    { x: 800, y: 0, z: 400 },
    { x: 800, y: 0, z: -400 },
    
    // 西エリア
    { x: -800, y: 0, z: 0 },
    { x: -800, y: 0, z: 400 },
    { x: -800, y: 0, z: -400 },
    
    // 対角線エリア
    { x: 1000, y: 0, z: 1000 },
    { x: -1000, y: 0, z: 1000 },
    { x: 1000, y: 0, z: -1000 },
    { x: -1000, y: 0, z: -1000 }
     */
];

// 安全なスポーン位置からの最小距離
const SAFE_SPOT_DISTANCE = 20;

// 安全なスポーン位置かどうかをチェックする関数
function isSafeSpot(x, z) {
    return safeSpawnPositions.some(pos => {
        const dx = x - pos.x;
        const dz = z - pos.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        return distance < SAFE_SPOT_DISTANCE;
    });
}

// 安全なスポーン位置を見つける関数
function findSafeEnemyPosition() {
    const safeDistance = 5;
    const spawnSafeDistance = 20;
    const maxAttempts = 20;

    const activePlayers = Object.values(players).filter(player => player.health > 0);
    if (activePlayers.length === 0) {
        return { x: 0, y: 0, z: 0 };
    }

    // ランダムにプレイヤーを選択
    const targetPlayer = activePlayers[Math.floor(Math.random() * activePlayers.length)];
    const playerPosition = { ...targetPlayer.position };

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // プレイヤーの現在位置の周囲にランダムな角度でスポーン
        const angle = Math.random() * Math.PI * 2;
        const distance = SPAWN_RANGE.MIN + Math.random() * (SPAWN_RANGE.MAX - SPAWN_RANGE.MIN);
        
        const x = playerPosition.x + Math.cos(angle) * distance;
        const z = playerPosition.z + Math.sin(angle) * distance;
        
        // 安全なスポーン位置との距離をチェック
        if (isSafeSpot(x, z)) {
            continue;
        }
        
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
            
            if (distance < safeDistance * 3) {
                isSafe = false;
            }
        });
        
        // 安全な場所が見つかった場合
        if (isSafe) {
            return { x, y: 0, z };
        }
    }

    // 安全な場所が見つからなかった場合は、プレイヤーの位置の近くにスポーン
    const angle = Math.random() * Math.PI * 2;
    const distance = SPAWN_RANGE.MIN;
    const x = playerPosition.x + Math.cos(angle) * distance;
    const z = playerPosition.z + Math.sin(angle) * distance;
    
    return { x, y: 0, z };
}

// 定期的に敵を生成
setInterval(spawnEnemy, ENEMY_SPAWN_INTERVAL);

// 敵の更新
function updateEnemies() {
    const now = Date.now();
    const isNight = getCurrentTimeOfDay() === 'NIGHT';
    const speedMultiplier = isNight ? NIGHT_MULTIPLIER : 1.0;
    const visionMultiplier = isNight ? NIGHT_MULTIPLIER : 1.0;
    
    // すべての敵のリスト
    const enemyList = Object.values(enemies);
    
    // プレイヤーの視界外の敵を削除
    Object.values(enemies).forEach(enemy => {
        let isInAnyPlayerVision = false;
        
        Object.values(players).forEach(player => {
            if (player.health <= 0) return;
            
            const dx = player.position.x - enemy.position.x;
            const dz = player.position.z - enemy.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance <= PLAYER_VISION_RANGE) {
                isInAnyPlayerVision = true;
            }
        });
        
        if (!isInAnyPlayerVision) {
            // 視界外の敵を削除
            io.emit('enemyDied', enemy.id);
            io.emit('enemiesKilled', [enemy.id]);
            delete enemies[enemy.id];
        }
    });
    
    enemyList.forEach(enemy => {
        // 敵が死亡している場合はスキップ
        if (enemy.health <= 0) return;
        //console.log("enemy.type" + enemy.type);
        // SHOOTERタイプの敵の弾丸発射処理
        if (enemy.type === 'SHOOTER') {
            //console.log("now" + now);
            //console.log("enemy.shootInterval" +  enemy.config.shootInterval);
            // 最後の発射から一定時間経過しているかチェック
            if (now - (enemy.lastShootTime || 0) >= enemy.config.shootInterval) {

                //console.log("enemy.config.shootInterval" + enemy.config.shootInterval);
                // 最も近いプレイヤーを探す
                let closestPlayer = null;
                let minDistance = Infinity;

                Object.values(players).forEach(player => {
                    if (player.health <= 0) return;
                    const dx = player.position.x - enemy.position.x;
                    const dz = player.position.z - enemy.position.z;
                    const distance = Math.sqrt(dx * dx + dz * dz);

                    if (distance < minDistance) {
                        minDistance = distance;
                        closestPlayer = player;
                    }
                });

                // プレイヤーが射程範囲内にいる場合、弾を発射
                if (closestPlayer && minDistance < enemy.config.visionRange) {
                    // プレイヤーの方向を計算
                    const dx = closestPlayer.position.x - enemy.position.x;
                    const dz = closestPlayer.position.z - enemy.position.z;
                    const direction = {
                        x: dx / minDistance,
                        y: 0,
                        z: dz / minDistance
                    };

                    // 弾丸データを作成
                    const bulletData = {
                        id: `enemy_bullet_${Date.now()}_${enemy.id}`,
                        position: {
                            x: enemy.position.x,
                            y: enemy.position.y + 1, // 敵の高さの半分くらいの位置から発射
                            z: enemy.position.z
                        },
                        direction: direction,
                        speed: enemy.config.bulletSpeed,
                        damage: enemy.config.bulletDamage
                    };
                    //console.log("enemyBulletSpawn" + bulletData);
                    // 弾丸発射を通知
                    io.emit('enemyBulletSpawn', bulletData);

                    // 最後の発射時間を更新
                    enemy.lastShootTime = now;
                }
            }
        }

        // プレイヤーとの距離を計算
        let closestPlayer = null;
        let minDistance = Infinity;
        
        Object.values(players).forEach(player => {
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
        const updateThreshold = 100;
        const shouldUpdate = minDistance < updateThreshold || Math.random() < 0.2;
        
        if (!shouldUpdate) {
            return;
        }

        // 視野範囲を取得（夜間は2倍）
        const visionRange = enemy.config.visionRange * visionMultiplier;

        // プレイヤーが近くにいる場合、追いかける
        if (closestPlayer && minDistance < visionRange) {
            enemy.state = 'chasing';
            enemy.target = closestPlayer.id;
            
            // プレイヤーの方向に向かって移動
            const dx = closestPlayer.position.x - enemy.position.x;
            const dz = closestPlayer.position.z - enemy.position.z;
            const angle = Math.atan2(dx, dz);
            
            enemy.rotation.y = angle;
            
            // 移動速度を設定（夜間は2倍）
            const speed = enemy.config.speed * speedMultiplier;
            
            // 移動方向と距離を計算
            const moveX = Math.sin(angle) * speed;
            const moveZ = Math.cos(angle) * speed;
            
            // 新しい位置を計算
            const newPosition = {
                x: enemy.position.x + moveX,
                y: enemy.position.y,
                z: enemy.position.z + moveZ
            };
            
            // 安全なスポーン位置との距離をチェック
            if (isSafeSpot(newPosition.x, newPosition.z)) {
                return; // 安全なスポーン位置の近くには移動しない
            }
            
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
            
            // 安全なスポーン位置との距離をチェック
            if (isSafeSpot(newPosition.x, newPosition.z)) {
                return; // 安全なスポーン位置の近くには移動しない
            }
            
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

// プレイヤーのスポーン位置を取得する関数
function getSpawnPosition() {
    // 他のプレイヤーがいない場合は、安全なスポーン位置からランダムに選択
    if (Object.keys(players).length === 0) {
        //console.log('他のプレイヤーがいないため、安全なスポーン位置を選択します');
        const randomPosition = safeSpawnPositions[Math.floor(Math.random() * safeSpawnPositions.length)];
        return {
            x: randomPosition.x,
            y: 0,
            z: randomPosition.z
        };
    }

    // 他のプレイヤーがいる場合は、最も近い安全なスポーン位置を選択
    const randomPlayer = Object.values(players)[Math.floor(Math.random() * Object.values(players).length)];
    let closestSafePosition = safeSpawnPositions[0];
    let minDistance = Infinity;

    safeSpawnPositions.forEach(position => {
        const dx = position.x - randomPlayer.position.x;
        const dz = position.z - randomPlayer.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance < minDistance) {
            minDistance = distance;
            closestSafePosition = position;
        }
    });

    // 選択した安全な位置の周囲に少しランダムなオフセットを加える
    const offset = {
        x: (Math.random() - 0.5) * 10, // -5から5の範囲でランダム
        y: 0,
        z: (Math.random() - 0.5) * 10  // -5から5の範囲でランダム
    };

    //console.log('選択した安全なスポーン位置:', closestSafePosition, 'オフセット:', offset);

    return {
        x: randomPlayer.position.x,
        y: 0,
        z: randomPlayer.position.z
    };
}

// 時間の更新処理
function updateTimeOfDay() {
    const gameTime = (Date.now() - gameStartTime) * TIME.TIME_SPEED;
    const dayLength = TIME.DAY_LENGTH;
    const timeOfDay = (gameTime % dayLength) / dayLength;

    // 夜の時間帯を判定（0.7から0.3の間を夜とする）
    const isNight = timeOfDay > 0.7 || timeOfDay < 0.3;

    /*
    // 夜になった時にボスを生成
    if (isNight && !bossesSpawned) {
        spawnBosses();
    } */
    
    //else if (!isNight) {
    //    resetBossState();
    //}

    return timeOfDay;
}

// キーアイテム関連のグローバル変数
let keyItem = null;
let lastKeyItemBiome = null;
let totalKeyItemsCollected = 0;
let keyItemEnemies = []; // キーアイテム周囲の敵を管理

// キーアイテムの滞在開始時刻を記録するマップ
const keyItemStayStartTimes = {};

// キーアイテム周囲の敵を生成する関数
function spawnKeyItemEnemies(keyItemPosition) {
    const enemyCount = 8; // キーアイテム周囲に配置する敵の数
    const spawnRadius = 15; // キーアイテムからの距離
    
    // 既存のキーアイテム敵を削除
    keyItemEnemies.forEach(enemyId => {
        if (enemies[enemyId]) {
            delete enemies[enemyId];
            io.emit('enemyDied', enemyId);
            io.emit('enemiesKilled', [enemyId]);
        }
    });
    keyItemEnemies = [];
    
    // 新しい敵を生成
    for (let i = 0; i < enemyCount; i++) {
        const angle = (Math.PI * 2 * i) / enemyCount; // 円形に配置
        const distance = spawnRadius + Math.random() * 5; // 15-20の範囲でランダム
        
        const enemyX = keyItemPosition.x + Math.cos(angle) * distance;
        const enemyZ = keyItemPosition.z + Math.sin(angle) * distance;
        
        // マップ境界チェック
        if (Math.abs(enemyX) > MAP_SIZE / 2 || Math.abs(enemyZ) > MAP_SIZE / 2) {
            continue;
        }
        
        const enemyId = 'keyitem_enemy_' + Date.now() + '_' + i;
        
        // 敵の種類をランダムに選択（通常の敵より強め）
        const enemyTypes = ['NORMAL', 'FAST', 'SHOOTER', 'GIANT'];
        const selectedType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        const enemyConfig = ENEMY_CONFIG[selectedType];
        
        enemies[enemyId] = {
            id: enemyId,
            position: { x: enemyX, y: 0, z: enemyZ },
            rotation: { y: Math.random() * Math.PI * 2 },
            health: enemyConfig.health * 1.5, // 通常より1.5倍の体力
            type: selectedType,
            enemyType: enemyConfig.model,
            target: null,
            state: 'wandering',
            lastAttack: 0,
            lastShootTime: 0,
            isKeyItemGuard: true, // キーアイテム守衛フラグ
            config: {
                visionRange: enemyConfig.visionRange * 1.2, // 視界範囲も少し広く
                speed: enemyConfig.speed,
                shootInterval: enemyConfig.shootInterval,
                bulletSpeed: enemyConfig.bulletSpeed,
                bulletDamage: enemyConfig.bulletDamage
            }
        };
        
        keyItemEnemies.push(enemyId);
        io.emit('enemySpawned', enemies[enemyId]);
    }
    
    console.log(`キーアイテム周囲に${keyItemEnemies.length}体の敵を配置しました`);
}

// キーアイテムを生成する関数
function spawnKeyItem() {
    // 前回と異なるバイオームを選択
    let biome;
    do {
        biome = Math.floor(Math.random() * 4); // 0: 砂漠, 1: 雪, 2: 草原, 3: 火山
    } while (biome === lastKeyItemBiome);

    lastKeyItemBiome = biome;


    // バイオームに応じた位置範囲を設定
    let minX, maxX, minZ, maxZ;
    switch (biome) {
        case 0: // 砂漠
            minX = -1000; maxX = -500;
            minZ = -1000; maxZ = -500;
            break;
        case 1: // 雪
            minX = 500; maxX = 1000;
            minZ = -1000; maxZ = -500;
            break;
        case 2: // 草原
            minX = -1000; maxX = -500;
            minZ = 500; maxZ = 1000;
            break;
        case 3: // 火山
            minX = 500; maxX = 1000;
            minZ = 500; maxZ = 1000;
            break;
    }


    minX = -500; maxX = 1000;
    minZ = -500; maxZ = 1000;

    // ランダムな位置を生成
    const x = Math.random() * (maxX - minX) + minX;
    const z = Math.random() * (maxZ - minZ) + minZ;

    // キーアイテムの位置を設定
    keyItem = { x, z, biome };

    // キーアイテム周囲に敵を配置
    spawnKeyItemEnemies(keyItem);

    // 全クライアントにキーアイテムの位置を通知
    io.emit('keyItemPosition', keyItem);
    console.log(`キーアイテムを生成: バイオーム${biome} (${x}, ${z})`);
}

// キーアイテムの収集を処理する関数
function handleKeyItemCollection(playerId) {
    if (!keyItem) return;

    const player = players[playerId];
    if (!player) return;

    // プレイヤーとキーアイテムの距離を計算
    const distance = Math.sqrt(
        Math.pow(player.position.x - keyItem.x, 2) +
        Math.pow(player.position.z - keyItem.z, 2)
    );

    // 半径10以内に入った場合
    if (distance <= 10) {
        // まだ記録がなければ現在時刻を記録
        if (!keyItemStayStartTimes[playerId]) {
            keyItemStayStartTimes[playerId] = Date.now();
        }
        // 10秒間滞在していれば収集可能
        const stayTime = Date.now() - keyItemStayStartTimes[playerId];
        if (stayTime >= keyItemStayTime) {
            // 収集数を増加
            totalKeyItemsCollected++;
            
            // 収集通知を送信
            io.emit('keyItemCollected', {
                playerId,
                playerName: player.name || 'Player ' + playerId.substring(0, 4),
                totalCollected: totalKeyItemsCollected,
                position: { x: keyItem.x, y: 0, z: keyItem.z }
            });

            safeSpawnPositions.push({ x: keyItem.x, y: 0, z: keyItem.z });

            // キーアイテム周囲の敵を削除
            keyItemEnemies.forEach(enemyId => {
                if (enemies[enemyId]) {
                    delete enemies[enemyId];
                    io.emit('enemyDied', enemyId);
                    io.emit('enemiesKilled', [enemyId]);
                }
            });
            keyItemEnemies = [];

            // キーアイテムを削除
            keyItem = null;
            // 記録も削除
            delete keyItemStayStartTimes[playerId];

            // 5秒後に新しいキーアイテムを生成
            setTimeout(spawnKeyItem, 5000);
        }
    } else {
        // 範囲外に出たら記録をリセット
        if (keyItemStayStartTimes[playerId]) {
            delete keyItemStayStartTimes[playerId];
        }
    }
}

// サーバー起動時にキーアイテムを生成
spawnKeyItem();

// --- 追加: 残り時間を定期送信する関数 ---
function emitKeyItemCollectTimeLeft() {
    if (!keyItem) return;
    Object.keys(players).forEach(playerId => {
        const player = players[playerId];
        if (!player) return;
        const distance = Math.sqrt(
            Math.pow(player.position.x - keyItem.x, 2) +
            Math.pow(player.position.z - keyItem.z, 2)
        );
        let timeLeft = null;
        if (distance <= 10 && keyItemStayStartTimes[playerId]) {
            const stayTime = Date.now() - keyItemStayStartTimes[playerId];
            timeLeft = Math.max(0, keyItemStayTime - stayTime);
        } else if (distance <= 10 && !keyItemStayStartTimes[playerId]) {
            timeLeft = keyItemStayTime;
        }
        // 残り時間がnullでなければ送信
        if (timeLeft !== null) {
            io.to(playerId).emit('keyItemCollectTimeLeft', { timeLeft });
        }
    });
}
setInterval(emitKeyItemCollectTimeLeft, 200); // 0.2秒ごとに送信

io.on('connection', (socket) => {
    console.log('プレイヤーが接続しました:', socket.id);
    
    // 使用可能な色からランダムに選択
    const availableColors = playerColors.filter(color => !usedColors.has(color));
    let playerColor;
    
    if (availableColors.length > 0) {
        // 使用可能な色がある場合は、その中からランダムに選択
        playerColor = availableColors[Math.floor(Math.random() * availableColors.length)];
    } else {
        // 使用可能な色がない場合は、最初の色を使用
        playerColor = playerColors[0];
    }
    
    // 選択した色を使用済みとしてマーク
    usedColors.add(playerColor);
    
    // プレイヤーのハッシュを生成
    // この値からクライアント側でも同じ色を生成できるようにする
    const playerHash = generatePlayerHash();
    
    // スポーン位置を取得
    const spawnPosition = getSpawnPosition();
    
    players[socket.id] = {
        id: socket.id,
        position: spawnPosition,
        rotation: { y: 0 },
        health: 100,
        color: playerColor,
        hash: playerHash,
        spawnTime: Date.now() // スポーン時間を記録
    };
    
    // シード値とゲーム開始時間をクライアントに送信
    socket.emit('gameConfig', {
        seed: serverSeed,
        gameStartTime: gameStartTime,
        playerHash: playerHash
    });
    
 // 少し遅らせてプレイヤー情報を送信（確実にgameConfigが処理された後）
    setTimeout(() => {
        // 現在のプレイヤーと敵の情報を送信
        socket.emit('currentPlayers', Object.values(players));
        socket.emit('currentEnemies', Object.values(enemies));
        
        // 新しいプレイヤーの情報を他のプレイヤーに送信
        socket.broadcast.emit('newPlayer', players[socket.id]);
    }, 100); // 100ms遅延
    
    // プレイヤーの移動を処理
    socket.on('playerMove', (data) => {
        if (players[socket.id]) {
            players[socket.id].position = data.position;
            players[socket.id].rotation = data.rotation;
            players[socket.id].isMoving = data.isMoving || false;
            players[socket.id].isRunning = data.isRunning || false;
            socket.broadcast.emit('playerMoved', players[socket.id]);

            // キーアイテムの収集チェック
            handleKeyItemCollection(socket.id);
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
        
        // 現在のプレイヤーリストを全員に送信
        io.emit('currentPlayers', Object.values(players));
    });
    
    // プレイヤーがメッセージを送信した時の処理
    socket.on('playerMessage', (data) => {
        // 全プレイヤーにメッセージを送信
        io.emit('showMessage', {
            playerId: socket.id,
            position: data.position
        });
    });
/*
    // ボス生成リクエストの処理
    socket.on('requestBossSpawn', () => {
        const timeOfDay = updateTimeOfDay();
        const isNight = timeOfDay > 0.7 || timeOfDay < 0.3;
        
        if (isNight && !bossesSpawned) {
            spawnBosses();
        }
    });
*/
    // 新規プレイヤーに現在のキーアイテムの位置を通知
    if (keyItem) {
        socket.emit('keyItemPosition', keyItem);
    }

    // 新規プレイヤーに現在の収集数を通知
    socket.emit('totalKeyItemsCollected', totalKeyItemsCollected);
});

const PORT = process.env.PORT || 3000;

// autoPlayersの設定
const AUTO_PLAYERS_COUNT = 0; // 自動プレイヤーの数
const AUTO_PLAYER_UPDATE_INTERVAL = 100; // 自動プレイヤーの更新間隔（ミリ秒）
const AUTO_PLAYER_MOVE_RANGE = 400; // 自動プレイヤーの移動範囲を広げる

// autoPlayersの状態を管理
const autoPlayers = {};

// autoPlayerを生成する関数
function createAutoPlayer() {
    const autoPlayerId = 'auto_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const spawnPosition = getSpawnPosition();
    
    // 使用可能な色からランダムに選択
    const availableColors = playerColors.filter(color => !usedColors.has(color));
    let playerColor;
    
    if (availableColors.length > 0) {
        playerColor = availableColors[Math.floor(Math.random() * availableColors.length)];
    } else {
        playerColor = playerColors[0];
    }
    
    usedColors.add(playerColor);
    
    const autoPlayer = {
        id: autoPlayerId,
        position: spawnPosition,
        rotation: { y: Math.random() * Math.PI * 2 },
        health: 100,
        color: playerColor,
        hash: generatePlayerHash(),
        spawnTime: Date.now(),
        isAutoPlayer: true,
        targetPosition: null,
        lastUpdate: Date.now()
    };
    
    return autoPlayer;
}

// autoPlayerの移動を更新する関数
function updateAutoPlayers() {
    const now = Date.now();
    const SHOOT_COOLDOWN = 800; // ms
    const SHOOT_RANGE = 30; // 射撃範囲
    const BULLET_SPEED = 30; // 弾速
    const BULLET_DAMAGE = 15; // ダメージ
    const WEAPON_ID = 'bullet001';

    Object.values(autoPlayers).forEach(autoPlayer => {
        if (autoPlayer.health <= 0) return;

        // --- 目標位置の再設定 ---
        if (!autoPlayer.targetPosition || now - autoPlayer.lastUpdate > 6000) {
            // マップ全体からランダムな座標をターゲットに
            autoPlayer.targetPosition = {
                x: (Math.random() - 0.5) * MAP_SIZE,
                y: 0,
                z: (Math.random() - 0.5) * MAP_SIZE
            };
            autoPlayer.lastUpdate = now;
        }

        // --- 移動処理 ---
        const dx = autoPlayer.targetPosition.x - autoPlayer.position.x;
        const dz = autoPlayer.targetPosition.z - autoPlayer.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        let moved = false;
        if (distance > 0.1) {
            const moveSpeed = 0.1;
            const moveX = (dx / distance) * moveSpeed;
            const moveZ = (dz / distance) * moveSpeed;
            // 進行方向と向きを一致させる
            const moveAngle = Math.atan2(moveZ, moveX); // Zが前方向
            autoPlayer.rotation.y = moveAngle;
            // 位置を更新
            autoPlayer.position.x += moveX;
            autoPlayer.position.z += moveZ;
            // マップの境界チェック
            autoPlayer.position.x = Math.max(-MAP_SIZE/2, Math.min(MAP_SIZE/2, autoPlayer.position.x));
            autoPlayer.position.z = Math.max(-MAP_SIZE/2, Math.min(MAP_SIZE/2, autoPlayer.position.z));
            autoPlayer.isMoving = true;
            moved = true;
        } else {
            autoPlayer.isMoving = false;
        }

        // --- 歩くモーションを送信 ---
        if (moved || autoPlayer._lastIsMoving !== autoPlayer.isMoving) {
            io.emit('playerMoved', autoPlayer);
            autoPlayer._lastIsMoving = autoPlayer.isMoving;
        }

        // --- 敵が近くにいれば自動射撃 ---
        if (!autoPlayer._lastShootTime) autoPlayer._lastShootTime = 0;
        let nearestEnemy = null;
        let minDist = Infinity;
        Object.values(enemies).forEach(enemy => {
            if (enemy.health > 0) {
                const ex = enemy.position.x - autoPlayer.position.x;
                const ez = enemy.position.z - autoPlayer.position.z;
                const d = Math.sqrt(ex * ex + ez * ez);
                if (d < minDist) {
                    minDist = d;
                    nearestEnemy = enemy;
                }
            }
        });
        if (nearestEnemy && minDist < SHOOT_RANGE && (now - autoPlayer._lastShootTime > SHOOT_COOLDOWN)) {
            // 発射方向
            const dx = nearestEnemy.position.x - autoPlayer.position.x;
            const dz = nearestEnemy.position.z - autoPlayer.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            const direction = { x: dx / dist, y: 0, z: dz / dist };
            // 弾発射イベント
            io.emit('bulletFired', {
                position: { x: autoPlayer.position.x, y: 1.1, z: autoPlayer.position.z },
                direction: direction,
                playerId: autoPlayer.id,
                weponId: WEAPON_ID,
                bulletDamage: BULLET_DAMAGE
            });
            autoPlayer._lastShootTime = now;
        }
    });
}

// 定期的にautoPlayersを更新
setInterval(updateAutoPlayers, AUTO_PLAYER_UPDATE_INTERVAL);

// サーバー起動時にautoPlayersを生成
for (let i = 0; i < AUTO_PLAYERS_COUNT; i++) {
    const autoPlayer = createAutoPlayer();
    autoPlayers[autoPlayer.id] = autoPlayer;
    players[autoPlayer.id] = autoPlayer;
}

http.listen(PORT, () => {
    console.log(`サーバーが起動しました: http://localhost:${PORT}`);
}); 