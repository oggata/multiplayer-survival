class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            GameConfig.VISION.FOV, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        this.renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas'), antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        
        this.socket = io();
        this.players = new Map();
        this.bullets = [];
        this.moveSpeed = GameConfig.PLAYER.MOVE_SPEED;
        this.rotationSpeed = GameConfig.PLAYER.ROTATION_SPEED;
        this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        // プレイヤーモデル用の変数を追加
        this.playerModel = new Character(this.scene);
        this.playerModel.setPosition(0, 0, 0);
        
        // 座標表示用の要素
        this.coordinatesElement = document.getElementById('coordinates');
        
        // プレイヤー数表示用の要素
        this.playerCountElement = document.getElementById('playerCount');
        
        // 敵の数表示用の要素
        this.enemyCountElement = document.getElementById('enemyCount');
        
        // HP関連の要素
        this.healthFillElement = document.getElementById('healthFill');
        this.healthTextElement = document.getElementById('healthText');
        this.gameOverElement = document.getElementById('gameOver');
        this.restartButtonElement = document.getElementById('restartButton');
        
        // HP関連の変数
        this.maxHealth = GameConfig.PLAYER.MAX_HEALTH;
        this.currentHealth = this.maxHealth;
        this.isGameOver = false;
        
        // リスタートボタンのイベントリスナー
        this.restartButtonElement.addEventListener('click', () => this.restartGame());
        
        // 時計
        this.clock = new THREE.Clock();
        
        // 時間関連の変数
        this.gameTime = 0; // ゲーム内時間（秒）
        this.dayLength = GameConfig.TIME.DAY_LENGTH; // 1日の長さ（秒）
        this.timeOfDay = 0; // 0-1の値（0: 夜明け, 0.25: 朝, 0.5: 昼, 0.75: 夕方, 1: 夜）
        this.sunLight = null; // 太陽光
        this.ambientLight = null; // 環境光
        
        // シード値とゲーム開始時間の初期化
        this.seed = null;
        this.gameStartTime = null;
        
        this.enemies = [];
        this.enemyBullets = []; // 敵の弾丸を格納する配列
        this.maxEnemies = GameConfig.ENEMY.MAX_COUNT;
        this.enemySpawnInterval = GameConfig.ENEMY.SPAWN_INTERVAL;
        this.lastEnemySpawnTime = 0;
        this.enemySpawnRadius = GameConfig.ENEMY.SPAWN_RADIUS;
        this.enemyDespawnRadius = GameConfig.ENEMY.DESPAWN_RADIUS;
        this.killedEnemies = 0; // 倒した敵の数を追加
        
        this.playerStatus = new PlayerStatus();
        this.playerStatus.health = this.currentHealth; // 初期HPを同期
        
        // アイテム管理
        this.items = [];
        this.maxItems = GameConfig.ITEM.MAX_COUNT;
        this.inventory = []; // プレイヤーのインベントリ
        
        // UI要素の取得
        this.positionElement = document.getElementById('position');
        this.itemCountElement = document.getElementById('itemCount');
        
        // バックパックUI要素
        this.backpackElement = document.getElementById('backpack');
        this.backpackItemsBody = document.getElementById('backpackItemsBody');
        this.emptyBackpackMessage = document.getElementById('emptyBackpack');
        this.backpackButton = document.getElementById('backpackButton');
        this.backpackCloseButton = document.getElementById('backpackClose');
        
        // バックパックボタンのイベントリスナー
        this.backpackButton.addEventListener('click', () => this.toggleBackpack());
        this.backpackCloseButton.addEventListener('click', () => this.toggleBackpack());
        
        // ステータス表示の更新
        this.updateStatusDisplay();
        
        this.setupControls();
        this.setupSocketEvents();
        
        // シーンとアニメーションの初期化
        this.setupScene(Math.random()); // 一時的なシード値を使用
        this.animate();
        
        // プレイヤーのハッシュ
        this.playerHash = null;
        
        // プレイヤー生成時間を記録
        this.playerSpawnTime = Date.now();
        
        // メッセージポップアップを管理するMap
        this.messagePopups = new Map();
        
        this.initMessagePopup();
        this.setupMessageSocketEvents();
        
        // URLパラメータをチェックしてstatsウィンドウの表示/非表示を設定
        this.checkDevMode();
        
        // 視覚更新用の変数
        this.lastVisionUpdate = 0;
        this.visibleObjects = new Set();
        
        // 敵の弾丸イベントリスナーを追加
        document.addEventListener('enemyBulletCreated', (event) => {
            this.enemyBullets.push(event.detail.bullet);
        });

        // 敵が倒された時のイベントリスナーを追加
        document.addEventListener('enemyDied', this.handleEnemyDeath.bind(this));
    }

    setupMessageSocketEvents() {
        // メッセージを受信したときの処理
        this.socket.on('showMessage', (data) => {
            console.log('メッセージを受信:', data);
            this.showMessagePopupForPlayer(data.playerId, data.position);
        });
    }

    initMessagePopup() {
        const messageButton = document.getElementById('messageButton');
        messageButton.addEventListener('click', () => {
            // サーバーにメッセージを送信
            this.socket.emit('playerMessage', {
                position: this.playerModel.getPosition()
            });
            // 自分の画面にも表示
            this.showMessagePopup();
        });
    }

    showMessagePopup() {
        this.showMessagePopupForPlayer(this.socket.id, this.playerModel.getPosition());
    }

    showMessagePopupForPlayer(playerId, position) {
        console.log('メッセージを表示:', playerId, position);
        
        // messagePopupsが存在しない場合は初期化
        if (!this.messagePopups) {
            this.messagePopups = new Map();
        }
        
        // 既存のポップアップがあれば削除
        if (this.messagePopups.has(playerId)) {
            this.messagePopups.get(playerId).remove();
            this.messagePopups.delete(playerId);
        }
        
        // メッセージポップアップの作成
        const popup = document.createElement('div');
        popup.className = 'message-popup';
        popup.textContent = 'help';
        document.body.appendChild(popup);
        
        // ポップアップをMapに保存
        this.messagePopups.set(playerId, popup);

        // プレイヤーの位置を取得
        const screenPosition = this.getScreenPosition(position);

        // ポップアップの位置を設定
        popup.style.left = `${screenPosition.x}px`;
        popup.style.top = `${screenPosition.y}px`;

        // 3秒後にポップアップを削除
        setTimeout(() => {
            if (this.messagePopups && this.messagePopups.has(playerId)) {
                this.messagePopups.get(playerId).remove();
                this.messagePopups.delete(playerId);
            }
        }, 3000);
    }
    
    // アニメーションループ内でポップアップの位置を更新
    updateMessagePopups() {
        // messagePopupsが存在しない場合は初期化
        if (!this.messagePopups) {
            this.messagePopups = new Map();
            return;
        }
        
        this.messagePopups.forEach((popup, playerId) => {
            // プレイヤーの位置を取得
            let position;
            if (playerId === this.socket.id) {
                position = this.playerModel.getPosition();
            } else {
                const player = this.players.get(playerId);
                if (player) {
                    position = player.getPosition();
                }
            }
            
            if (position) {
                const screenPosition = this.getScreenPosition(position);
                popup.style.left = `${screenPosition.x}px`;
                popup.style.top = `${screenPosition.y}px`;
            }
        });
    }

    getScreenPosition(worldPosition) {
        // worldPositionがTHREE.Vector3でない場合は変換
        let vector;
        if (worldPosition instanceof THREE.Vector3) {
            vector = worldPosition.clone();
        } else {
            // 通常のオブジェクトの場合はTHREE.Vector3に変換
            vector = new THREE.Vector3(
                worldPosition.x || 0,
                worldPosition.y || 0,
                worldPosition.z || 0
            );
        }
        
        // 3D座標を2D画面座標に変換
        vector.project(this.camera);

        return {
            x: (vector.x * 0.5 + 0.5) * window.innerWidth,
            y: -(vector.y * 0.5 - 0.5) * window.innerHeight
        };
    }

    setupScene(seed) {
        // ライティング
        this.ambientLight = new THREE.AmbientLight(0xffffff, GameConfig.LIGHTING.AMBIENT_INTENSITY);
        this.scene.add(this.ambientLight);
        
        this.sunLight = new THREE.DirectionalLight(0xffffff, GameConfig.LIGHTING.SUN_INTENSITY);
        this.sunLight.position.set(-3, 10, -10);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.camera.top = 100;
        this.sunLight.shadow.camera.bottom = -100;
        this.sunLight.shadow.camera.left = -100;
        this.sunLight.shadow.camera.right = 100;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.scene.add(this.sunLight);

        // 霧の追加
        this.scene.fog = new THREE.FogExp2(0xcccccc, GameConfig.FOG.DENSITY);

        // フィールドマップの作成（シード値を渡す）
        this.fieldMap = new FieldMap(this.scene, seed);

        // プレイヤーモデルの作成
        this.createPlayerModel();
        
        // カメラの初期位置（プレイヤーの背後）
        this.updateCameraPosition();
        
        // アイテムの生成
        this.spawnItems();
        
        this.spawnEnemies();
        
        // 時間の初期化
        this.updateTimeOfDay();
        
        this.weather = new Weather(this.scene, this.camera);
    }
    
    createPlayerModel() {
        // 新しいキャラクタークラスを使用してプレイヤーモデルを作成
        this.playerModel = new Character(this.scene);
        
        // プレイヤーの色を設定
        if (this.playerHash) {
            const color = this.generateColorFromHash(this.playerHash);
            this.playerModel.setColor(color);
        }
        
        // 安全なスポーン位置を取得
        const spawnPosition = this.fieldMap.getSafeSpawnPosition();
        this.playerModel.setPosition(spawnPosition.x, spawnPosition.y, spawnPosition.z);
    }

    setupControls() {
        // キーボードコントロール
        this.keys = {};
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            // バックパックを開く/閉じる（Bキー）
            if (e.key.toLowerCase() === 'b') {
                this.toggleBackpack();
            }
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // マウスコントロール
        document.addEventListener('mousemove', (e) => {
            if (this.isMobile) return;
            
            const movementX = e.movementX || 0;
            // CharacterクラスのsetRotationメソッドを使用
            const currentRotation = this.playerModel.getRotation().y;
            this.playerModel.setRotation(currentRotation - movementX * this.rotationSpeed);
        });

        // 発射ボタン
        const shootButton = document.getElementById('shootButton');
        shootButton.addEventListener('click', () => this.shoot());

        // モバイルコントロール
        if (this.isMobile) {
            this.setupMobileControls();
        }
    }

    setupMobileControls() {
        const leftJoystick = document.getElementById('leftJoystick');
        
        // 左ジョイスティック（移動と回転用）
        this.leftJoystick = {
            element: leftJoystick,
            active: false,
            x: 0,
            y: 0
        };

        // タッチイベントの設定
        this.leftJoystick.element.addEventListener('touchstart', (e) => {
            this.leftJoystick.active = true;
                const touch = e.touches[0];
            const rect = this.leftJoystick.element.getBoundingClientRect();
            this.leftJoystick.x = (touch.clientX - rect.left - rect.width/2) / (rect.width/2);
            this.leftJoystick.y = (touch.clientY - rect.top - rect.height/2) / (rect.height/2);
        });

        this.leftJoystick.element.addEventListener('touchmove', (e) => {
            if (this.leftJoystick.active) {
                    const touch = e.touches[0];
                const rect = this.leftJoystick.element.getBoundingClientRect();
                this.leftJoystick.x = (touch.clientX - rect.left - rect.width/2) / (rect.width/2);
                this.leftJoystick.y = (touch.clientY - rect.top - rect.height/2) / (rect.height/2);
            }
        });

        this.leftJoystick.element.addEventListener('touchend', () => {
            this.leftJoystick.active = false;
            this.leftJoystick.x = 0;
            this.leftJoystick.y = 0;
        });
    }

    setupSocketEvents() {
        // ゲーム設定の受信
        this.socket.on('gameConfig', (config) => {
            this.seed = config.seed;
            this.gameStartTime = config.gameStartTime;
            this.playerHash = config.playerHash;
            this.setupScene(this.seed);
        });

        this.socket.on('currentPlayers', (players) => {
            players.forEach(player => this.addPlayer(player));
            this.updatePlayerCount();
        });

        this.socket.on('newPlayer', (player) => {
            this.addPlayer(player);
            this.updatePlayerCount();
        });

        this.socket.on('playerMoved', (player) => {
            const existingPlayer = this.players.get(player.id);
            if (existingPlayer) {
                // Characterクラスのインスタンスの位置と回転を更新
                existingPlayer.setPosition(
                    player.position.x,
                    player.position.y,
                    player.position.z
                );
                existingPlayer.setRotation(player.rotation.y);
                
                // 移動状態を更新
                existingPlayer.isMoving = player.isMoving || false;
                existingPlayer.isRunning = player.isRunning || false;
            }
        });

        this.socket.on('playerDisconnected', (playerId) => {
            this.removePlayer(playerId);
            this.updatePlayerCount();
        });

        this.socket.on('bulletFired', (data) => {
            // console.log('弾が発射されました:', data);
            
            // 方向ベクトルを正しく再構築
            const direction = new THREE.Vector3(
                data.direction.x,
                data.direction.y,
                data.direction.z
            );
            
            // 位置ベクトルを正しく再構築
            const position = new THREE.Vector3(
                data.position.x,
                data.position.y,
                data.position.z
            );
            
            this.createBullet(position, direction, data.playerId);
        });
        
        // ダメージを受けた時のイベント
        this.socket.on('playerHit', (data) => {
            if (data.targetId === this.socket.id) {
                this.takeDamage(data.damage);
            }
        });
        
        // プレイヤーがリスタートした時のイベント
        this.socket.on('playerRestarted', (data) => {
            if (data.id === this.socket.id) {
                // 自分のリスタート
                this.currentHealth = data.health;
                this.playerStatus.health = this.currentHealth;
                this.updateHealthDisplay();
            } else {
                // 他のプレイヤーのリスタート
                const player = this.players.get(data.id);
                if (player) {
                    player.setPosition(data.position.x, data.position.y, data.position.z);
                    player.setRotation(data.rotation.y);
                }
            }
        });
        
        // プレイヤーのHPが更新された時のイベント
        this.socket.on('playerHealthUpdate', (data) => {
            if (data.id === this.socket.id) {
                // 自分のHPが更新された
                this.currentHealth = data.health;
                this.playerStatus.health = this.currentHealth;
                this.updateHealthDisplay();
            }
        });
        
        // プレイヤーが死亡した時のイベント
        this.socket.on('playerDied', (playerId) => {
            if (playerId === this.socket.id) {
                // 自分が死亡した
                this.gameOver();
            } else {
                // 他のプレイヤーが死亡した
                this.removePlayer(playerId);
            }
        });
    }

    addPlayer(playerData) {
        // 他のプレイヤーを追加
        const character = new Character(this.scene);
        character.setPosition(
            playerData.position.x,
            playerData.position.y,
            playerData.position.z
        );
        character.setRotation(playerData.rotation.y);
        
        // プレイヤーの色を設定
        if (playerData.hash) {
            const color = this.generateColorFromHash(playerData.hash);
            character.setColor(color);
        }
        
        this.scene.add(character.character);
        this.players.set(playerData.id, character);
    }

    removePlayer(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            player.dispose();
            this.players.delete(playerId);
        }
    }

    shoot() {
        if (this.isGameOver) return;
        
        // プレイヤーの向きに基づいて弾を発射
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.playerModel.getRotation().y);
        
        // プレイヤーの位置から少し上に弾を発射
        const bulletPosition = this.playerModel.getPosition().clone();
        bulletPosition.y += 0.5; // プレイヤーの目の高さ
        
        this.socket.emit('shoot', {
            position: bulletPosition,
            direction: direction
        });
        
        this.createBullet(bulletPosition, direction, this.socket.id);
    }

    createBullet(position, direction, playerId) {
        const bullet = new Bullet(this.scene, position, direction, playerId);
        this.bullets.push(bullet);
    }

    updateBullets(deltaTime) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            // 弾丸を更新
            const isAlive = bullet.update(deltaTime);
            
            // 弾丸が寿命を迎えた場合は削除
            if (!isAlive) {
                this.bullets.splice(i, 1);
                continue;
            }

            // 弾の衝突判定
            this.players.forEach((player, playerId) => {
                if (playerId !== bullet.playerId) {
                    const distance = bullet.checkCollision(player.getPosition(), 1);
                    if (distance) {
                        // ダメージを送信
                        this.socket.emit('playerHit', { 
                            targetId: playerId,
                            damage: bullet.damage
                        });
                        bullet.dispose();
                        this.bullets.splice(i, 1);
                    }
                }
            });

            // 敵との衝突判定
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                const distance = bullet.checkCollision(enemy.model.position, 1);
                if (distance) {
                    // 敵にダメージを与える
                    enemy.takeDamage(bullet.damage);
                    bullet.dispose();
                this.bullets.splice(i, 1);
                    break;
                }
            }
        }
    }

    updatePlayer(deltaTime) {
        if (this.isGameOver) return;
        
        let moveX = 0;
        let moveZ = 0;
        let rotateY = 0;
        let isRunning = false;
        let isMoving = false;

        if (this.isMobile) {
            if (this.leftJoystick.active) {
                // 上下で前後移動（方向を反転）
                moveZ = this.leftJoystick.y * this.moveSpeed;
                // 左右で回転
                rotateY = -this.leftJoystick.x * this.rotationSpeed;
                
                // 移動中かどうかを判定
                if (Math.abs(this.leftJoystick.y) > 0.1) {
                    isMoving = true;
                }
            }
        } else {
            // キーボードコントロール（AとDの方向を反転）
            if (this.keys['w']) moveZ = -this.moveSpeed;
            if (this.keys['s']) moveZ = this.moveSpeed;
            if (this.keys['a']) rotateY = this.rotationSpeed; // 方向を反転
            if (this.keys['d']) rotateY = -this.rotationSpeed; // 方向を反転
            if (this.keys[' ']) this.shoot(); // スペースキーで発射
            if (this.keys['shift']) isRunning = true;
            
            // 移動中かどうかを判定
            if (this.keys['w'] || this.keys['s']) {
                isMoving = true;
            }
        }
        
        // 移動方向ベクトルを作成
        const moveDirection = new THREE.Vector3(moveX, 0, moveZ);
        
        // キャラクターの回転を更新
        if (rotateY !== 0) {
            this.playerModel.setRotation(this.playerModel.getRotation().y + rotateY);
        }
        
        // 現在の位置を保存
        const currentPosition = this.playerModel.getPosition().clone();
        
        // プレイヤーモデルの移動
        this.playerModel.move(moveDirection, isRunning ? this.moveSpeed * 3 : this.moveSpeed, deltaTime);
        this.playerModel.setRunning(isRunning);
        
        // 移動後の位置を取得
        const newPosition = this.playerModel.getPosition();
        
        // マップオブジェクトとの衝突判定
        if (this.fieldMap && this.fieldMap.checkCollision(newPosition, 1)) {
            // 衝突した場合は元の位置に戻す
            this.playerModel.setPosition(currentPosition.x, currentPosition.y, currentPosition.z);
        } else {
            // 移動した場合、空腹と喉の渇きを減少させる
            if (isMoving) {
                // 走っている場合はより早く減少
                const decreaseRate = isRunning ? GameConfig.STATUS.MOVEMENT.RUNNING_MULTIPLIER : 1.0;
                // 移動時の減少率を適用（停止時の減少はplayerStatus.jsのupdateメソッドで処理）
                this.playerStatus.decreaseHunger(GameConfig.STATUS.MOVEMENT.HUNGER * decreaseRate * deltaTime);
                this.playerStatus.decreaseThirst(GameConfig.STATUS.MOVEMENT.THIRST * decreaseRate * deltaTime);
            }
        }
        
        // カメラの位置を更新（プレイヤーの背後に配置）
        this.updateCameraPosition();
        
        // 座標表示を更新
        this.updateCoordinatesDisplay();

        // サーバーに位置情報を送信
        this.socket.emit('playerMove', {
            position: this.playerModel.getPosition(),
            rotation: { y: this.playerModel.getRotation().y },
            isMoving: this.playerModel.isMoving,
            isRunning: this.playerModel.isRunning
        });
    }
    
    // 座標表示を更新するメソッド
    updateCoordinatesDisplay() {
        if (this.coordinatesElement && this.playerModel) {
            const position = this.playerModel.getPosition();
            const x = position.x.toFixed(2);
            const y = position.y.toFixed(2);
            const z = position.z.toFixed(2);
            this.coordinatesElement.textContent = `座標: X: ${x} Y: ${y} Z: ${z}`;
        }
    }
    
    updateCameraPosition() {
        // プレイヤーの背後にカメラを配置
        const cameraPosition = new THREE.Vector3();
        cameraPosition.copy(this.playerModel.getPosition());
        
        // プレイヤーの回転に基づいてカメラのオフセットを計算
        const offset = new THREE.Vector3(0, GameConfig.CAMERA.OFFSET_Y, GameConfig.CAMERA.OFFSET_Z);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.playerModel.getRotation().y);
        
        cameraPosition.add(offset);
        this.camera.position.copy(cameraPosition);
        
        // カメラがプレイヤーを見るようにする
        this.camera.lookAt(this.playerModel.getPosition());
    }

    // ダメージを受ける処理
    takeDamage(damage) {
        if (this.isGameOver) return;
        
        this.currentHealth -= damage;
        this.playerStatus.health = this.currentHealth; // HPを同期
        
        // 出血を増加させる
        //this.playerStatus.increaseBleeding(10);
        
        if (this.currentHealth < 0) {
            this.currentHealth = 0;
            this.playerStatus.health = 0;
        }
        
        // HPゲージを更新
        this.updateHealthDisplay();
        
        // HPが0になったらゲームオーバー
        if (this.currentHealth <= 0) {
            this.gameOver();
        }
    }
    
    // HPゲージを更新する処理
    updateHealthDisplay() {
        const healthPercentage = (this.currentHealth / this.maxHealth) * 100;
        
        if (this.healthFillElement) {
            this.healthFillElement.style.width = `${healthPercentage}%`;
            
            // HPの値に応じて色を変更
            if (healthPercentage > 60) {
                this.healthFillElement.style.backgroundColor = '#00ff00'; // 緑
            } else if (healthPercentage > 30) {
                this.healthFillElement.style.backgroundColor = '#ffff00'; // 黄
            } else {
                this.healthFillElement.style.backgroundColor = '#ff0000'; // 赤
            }
        }
        
        if (this.healthTextElement) {
            this.healthTextElement.textContent = `HP: ${this.currentHealth}/${this.maxHealth}`;
        }
        
        // ステータス表示も更新
        const healthValueElement = document.getElementById('healthValue');
        const healthFillElement = document.querySelector('#health .status-fill');
        
        if (healthValueElement) {
            healthValueElement.textContent = Math.round(this.currentHealth);
        }
        
        if (healthFillElement) {
            healthFillElement.style.width = `${healthPercentage}%`;
        }
    }
    
    // ゲームオーバー処理
    gameOver() {
        this.isGameOver = true;
        
        // 生存時間を計算
        const survivalTime = Date.now() - this.playerSpawnTime;
        const gameDayLength = GameConfig.TIME.DAY_LENGTH;
        
        // 生存時間をゲーム内の日数、時間、分に変換
        const survivalDays = Math.floor(survivalTime / (gameDayLength * 1000));
        const survivalHours = Math.floor((survivalTime % (gameDayLength * 1000)) / (gameDayLength * 1000 / 24));
        const survivalMinutes = Math.floor((survivalTime % (gameDayLength * 1000 / 24)) / (gameDayLength * 1000 / 24 / 60));
        
        // ゲームオーバー画面を表示
        const gameOverElement = document.getElementById('gameOver');
        gameOverElement.innerHTML = `
            <div>Game Over!!</div>
            <div>[ survival time ${survivalDays} day ${survivalHours} hour ${survivalMinutes} min ]</div>
            <button id="restartButton">Restart</button>
        `;
        gameOverElement.style.display = 'block';
        
        // リスタートボタンのイベントリスナーを設定
        document.getElementById('restartButton').addEventListener('click', () => {
            this.restartGame();
        });
    }
    
    // プレイヤー数を更新するメソッド
    updatePlayerCount() {
        if (this.playerCountElement) {
            const count = this.players.size + 1; // 自分を含めた総数
            //this.playerCountElement.textContent = `プレイヤー数: ${count}`;
        }
    }

    // 他のプレイヤーの近くにリスポーンするメソッド
    getNearbyPlayerPosition() {
        if (this.players.size === 0) {
            // 他のプレイヤーがいない場合は安全なスポーン位置を返す
            return this.fieldMap.getSafeSpawnPosition();
        }

        // ランダムに他のプレイヤーを選択
        const playerArray = Array.from(this.players.values());
        const randomPlayer = playerArray[Math.floor(Math.random() * playerArray.length)];
        
        // 選択したプレイヤーの位置を取得
        const playerPosition = randomPlayer.getPosition();
        
        // プレイヤーの周囲にランダムなオフセットを加える
        const offset = new THREE.Vector3(
            (Math.random() - 0.5) * 10,
            0,
            (Math.random() - 0.5) * 10
        );
        
        // 新しい位置を計算
        const newPosition = playerPosition.clone().add(offset);
        
        // マップの境界内に収める
        newPosition.x = Math.max(-450, Math.min(450, newPosition.x));
        newPosition.z = Math.max(-450, Math.min(450, newPosition.z));
        
        return newPosition;
    }

    // ゲームをリスタートする処理
    restartGame() {
        this.currentHealth = this.maxHealth;
        this.playerStatus.reset(); // プレイヤーステータスを完全にリセット
        this.isGameOver = false;
        this.gameOverElement.style.display = 'none';
        
        // プレイヤーの位置をリセット（他のプレイヤーの近くにリスポーン）
        if (this.playerModel) {
            const spawnPosition = this.getNearbyPlayerPosition();
            this.playerModel.setPosition(spawnPosition.x, spawnPosition.y, spawnPosition.z);
            this.playerModel.setRotation(0);
            this.updateCameraPosition();
        }
        
        // サーバーにリスタートを通知
        this.socket.emit('playerRestart');
    }

    // 敵のスポーン処理を修正
    spawnEnemies() {
        if (!this.playerModel || !this.playerModel.getPosition) return;
        
        const playerPosition = this.playerModel.getPosition();
        if (!playerPosition) return;
        
        const currentTime = Date.now();
        if (currentTime - this.lastEnemySpawnTime > this.enemySpawnInterval && this.enemies.length < this.maxEnemies) {
            // プレイヤーから一定距離以上離れた場所にスポーンさせる
            const minSpawnDistance = 50; // 最小スポーン距離
            const maxSpawnDistance = this.enemySpawnRadius; // 最大スポーン距離
            
            // ランダムな距離を選択（最小距離以上）
            const distance = minSpawnDistance + Math.random() * (maxSpawnDistance - minSpawnDistance);
            
            // ランダムな角度を選択
            const angle = Math.random() * Math.PI * 2;
            
            // スポーン位置を計算
            const spawnX = playerPosition.x + Math.cos(angle) * distance;
            const spawnZ = playerPosition.z + Math.sin(angle) * distance;
            
            // スポーン位置がマップの境界内かチェック
            if (Math.abs(spawnX) > 450 || Math.abs(spawnZ) > 450) {
                return; // マップ外ならスポーンしない
            }
            
            // 安全なスポーン位置を取得
            const spawnPosition = new THREE.Vector3(spawnX, 0, spawnZ);
            
            // 他の敵との距離をチェック
            let isSafePosition = true;
            for (const enemy of this.enemies) {
                const distanceToEnemy = spawnPosition.distanceTo(enemy.model.position);
                if (distanceToEnemy < 10) { // 他の敵から10単位以上離れているか
                    isSafePosition = false;
                    break;
                }
            }
            
            // 安全な位置なら敵をスポーン
            if (isSafePosition) {
                // ランダムに敵の種類を選択
                const enemyTypes = ['NORMAL', 'FAST', 'SHOOTER'];
                //const enemyTypes = ['SHOOTER'];
                const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
                
                const enemy = new Enemy(this.scene, spawnPosition, randomType);
                this.enemies.push(enemy);
                this.lastEnemySpawnTime = currentTime;
                this.updateEnemyCount();
            }
        }
    }
    
    // 敵の更新処理を修正
    updateEnemies(deltaTime) {
        if (!this.playerModel || !this.playerModel.getPosition) return;
        
        const playerPosition = this.playerModel.getPosition();
        if (!playerPosition) return;
        
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // 敵が死亡している場合は削除
            if (enemy.isDead) {
                this.enemies.splice(i, 1);
                this.updateEnemyCount();
                continue;
            }
            
            // プレイヤーとの距離を計算
            const distanceToPlayer = enemy.model.position.distanceTo(playerPosition);
            
            // プレイヤーから一定距離以上離れた敵をデスポーン
            if (distanceToPlayer > this.enemyDespawnRadius) {
                this.scene.remove(enemy.model);
                this.enemies.splice(i, 1);
                this.updateEnemyCount();
                continue;
            }
            
            enemy.updateAnimation(deltaTime);
            
            // プレイヤーが近くにいる場合、追跡する
            if (distanceToPlayer < GameConfig.ENEMY.CHASE_DISTANCE) {
                const direction = new THREE.Vector3().subVectors(playerPosition, enemy.model.position).normalize();
                enemy.model.position.add(direction.multiplyScalar(enemy.getMoveSpeed() * deltaTime));
                enemy.model.lookAt(playerPosition);
                
                // 弾丸を発射する敵の場合、一定距離を保ちながら弾丸を発射
                if (enemy.enemyType.shootBullets && distanceToPlayer > 10) {
                    enemy.shoot(playerPosition);
                }
            }
            
            // プレイヤーとの衝突判定
            if (distanceToPlayer < GameConfig.PLAYER.COLLISION_RADIUS) {
                this.takeDamage(enemy.getDamage());
            }
        }
    }

    // 敵の数を更新するメソッド
    updateEnemyCount() {
        if (this.enemyCountElement) {
            this.enemyCountElement.textContent = this.enemies.length;
        }
        // 倒した敵の数を表示する要素を更新
        const killedEnemyCountElement = document.getElementById('killedEnemyCount');
        if (killedEnemyCountElement) {
            killedEnemyCountElement.textContent = this.killedEnemies;
        }
    }

    animate() {
        // 30FPSに制限するためにsetTimeoutを使用
        setTimeout(() => {
            this.animate();
        }, 1000 / 30); // 約33.33ミリ秒（30FPS）
        
        const deltaTime = Math.min(this.clock.getDelta(), 0.1);
        
        this.updatePlayer(deltaTime);
        this.updateBullets(deltaTime);
        this.updateEnemyBullets(deltaTime); // 敵の弾丸を更新
        this.updateEnemies(deltaTime);
        this.spawnEnemies();
        
        // オブジェクトの表示/非表示を更新
        this.updateObjectVisibility();
        
        // メッセージポップアップの位置を更新
        this.updateMessagePopups();
        
        // アイテムとの衝突判定
        this.checkItemCollisions();
        
        // ステータス表示の更新
        this.updateStatusDisplay();
        
        // 時間の更新
        this.updateTimeOfDay();
        
        // 霧の更新
        this.updateFog();
        
        // プレイヤーモデルのアニメーション更新
        if (this.playerModel) {
            this.playerModel.updateLimbAnimation(deltaTime);
        }
        
        // 他のプレイヤーのアニメーション更新
        this.players.forEach(player => {
            player.updateLimbAnimation(deltaTime);
        });
        
        // プレイヤーステータスの更新（空腹と喉の渇きの減少など）
        this.update(deltaTime);
        
        // レンダリング
        this.renderer.render(this.scene, this.camera);
    }

    update(deltaTime) {
        if (this.isGameOver) return;
        
        // ゲーム時間の更新（サーバーからの開始時間を考慮）
        if (this.gameStartTime) {
            this.gameTime = (Date.now() - this.gameStartTime) / 1000;
        }
        
        this.playerStatus.update(deltaTime);
        
        // ステータス表示の更新
        this.updateStatusDisplay();
        
        // アイテムとの衝突判定
        this.checkItemCollisions();
        
        // 天気の更新
        this.weather.update(deltaTime, this.gameTime, this.timeOfDay);
        
        // ステータスによるHP減少の処理
        this.updateHealthFromStatus(deltaTime);
    }

    updateStatusDisplay() {
        // 座標の更新
        this.updateCoordinatesDisplay();
        
        // プレイヤー数の更新
        this.playerCountElement.textContent = Object.keys(this.players).length;
        
        // 敵の数の更新
        this.enemyCountElement.textContent = this.enemies.length;
        
        // ワールドに存在するアイテム数の更新
        document.getElementById('worldItemCount').textContent = this.items.length;
        
        // インベントリのアイテム数を表示
        document.getElementById('inventoryItemCount').textContent = this.inventory.length;
        
        // ステータスバーの更新
        document.getElementById('healthValue').textContent = Math.round(this.playerStatus.health);
        document.getElementById('health').querySelector('.status-fill').style.width = `${this.playerStatus.health}%`;
        
        document.getElementById('hungerValue').textContent = Math.round(this.playerStatus.hunger);
        document.getElementById('hunger').querySelector('.status-fill').style.width = `${this.playerStatus.hunger}%`;
        
        document.getElementById('thirstValue').textContent = Math.round(this.playerStatus.thirst);
        document.getElementById('thirst').querySelector('.status-fill').style.width = `${this.playerStatus.thirst}%`;
        
        document.getElementById('bleedingValue').textContent = Math.round(this.playerStatus.bleeding);
        document.getElementById('bleeding').querySelector('.status-fill').style.width = `${this.playerStatus.bleeding}%`;
        
        document.getElementById('temperatureValue').textContent = Math.round(this.playerStatus.temperature * 10) / 10;
        document.getElementById('temperature').querySelector('.status-fill').style.width = `${(this.playerStatus.temperature - 35) * 20}%`;
        
        document.getElementById('hygieneValue').textContent = Math.round(this.playerStatus.hygiene);
        document.getElementById('hygiene').querySelector('.status-fill').style.width = `${this.playerStatus.hygiene}%`;
    }
    
    spawnItems() {
        // アイテムの種類を定義
        const itemTypes = [
            { name: 'health', color: 0xff4444, size: 0.5 },
            { name: 'food', color: 0xffaa44, size: 0.5 },
            { name: 'water', color: 0x44aaff, size: 0.5 },
            { name: 'bandage', color: 0xff44ff, size: 0.5 },
            { name: 'medicine', color: 0x44ff44, size: 0.5 }
        ];
        
        // アイテムを生成
        for (let i = 0; i < this.maxItems; i++) {
            const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
            const x = (Math.random() - 0.5) * this.fieldMap.mapSize;
            const z = (Math.random() - 0.5) * this.fieldMap.mapSize;
            
            const geometry = new THREE.SphereGeometry(itemType.size, 8, 8);
            const material = new THREE.MeshStandardMaterial({
                color: itemType.color,
                emissive: itemType.color,
                emissiveIntensity: 0.5
            });
            
            const item = new THREE.Mesh(geometry, material);
            item.position.set(x, itemType.size, z);
            item.userData = { type: 'item', itemType: itemType.name };
            
            this.scene.add(item);
            this.items.push(item);
        }
    }
    
    checkItemCollisions() {
        const playerPosition = this.playerModel.getPosition();
        const COLLECTION_DISTANCE = 2.0;

        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            const distance = playerPosition.distanceTo(item.position);

            if (distance < COLLECTION_DISTANCE) {
                this.collectItem(item);
                this.items.splice(i, 1);
            }
        }
    }
    
    collectItem(item) {
        // アイテムの検証を改善
        if (!item || !item.userData) {
            console.error('無効なアイテムです:', item);
            return;
        }

        const itemType = item.userData.itemType;
        if (!itemType) {
            console.error('アイテムタイプが設定されていません:', item);
            return;
        }
        
        // アイテムをインベントリに追加
        this.inventory.push({
            id: Date.now() + Math.random(), // ユニークID
            type: itemType,
            name: this.getItemName(itemType),
            position: item.position.clone() // アイテムの位置を保存
        });
        
        // アイテムをシーンから削除
        this.scene.remove(item);
        
        // バックパックが開いている場合は更新
        if (this.backpackElement.style.display === 'block') {
            this.updateBackpackUI();
        }
        
        // アイテム数を更新
        this.updateItemCount();
    }
    
    getItemName(type) {
        const itemNames = {
            'health': 'Recovery Medicine',
            'food': 'Food',
            'water': 'Water',
            'bandage': 'Bandage',
            'medicine': 'Medicine'
        };
        return itemNames[type] || type;
    }
    
    useItem(itemId) {
        // インベントリからアイテムを探す
        const itemIndex = this.inventory.findIndex(item => item.id === itemId);
        if (itemIndex === -1) return;
        
        const item = this.inventory[itemIndex];
        
        // アイテムの効果を適用
        switch (item.type) {
            case 'health':
                this.playerStatus.heal(20);
                break;
            case 'food':
                this.playerStatus.eat(30);
                break;
            case 'water':
                this.playerStatus.drink(30);
                break;
            case 'bandage':
                this.playerStatus.stopBleeding(50);
                break;
            case 'medicine':
                this.playerStatus.heal(10);
                this.playerStatus.stopBleeding(30);
                break;
        }
        
        // アイテムをインベントリから削除
        this.inventory.splice(itemIndex, 1);
        
        // バックパックUIを更新
        this.updateBackpackUI();
    }
    
    dropItem(itemId) {
        // インベントリからアイテムを探す
        const itemIndex = this.inventory.findIndex(item => item.id === itemId);
        if (itemIndex === -1) return;
        
        const item = this.inventory[itemIndex];
        
        // プレイヤーの位置を取得
        const playerPosition = this.playerModel.getPosition();
        
        // プレイヤーの前方にアイテムを配置
        const dropPosition = new THREE.Vector3();
        dropPosition.copy(playerPosition);
        
        // プレイヤーの向きに基づいて前方に配置
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.playerModel.getRotation().y);
        dropPosition.add(direction.multiplyScalar(2));
        
        // アイテムをシーンに追加
        const geometry = new THREE.SphereGeometry(0.5, 8, 8);
        const material = new THREE.MeshStandardMaterial({
            color: this.getItemColor(item.type),
            emissive: this.getItemColor(item.type),
            emissiveIntensity: 0.5
        });
        
        const droppedItem = new THREE.Mesh(geometry, material);
        droppedItem.position.copy(dropPosition);
        droppedItem.userData = { type: 'item', itemType: item.type };
        
        this.scene.add(droppedItem);
        this.items.push(droppedItem);
        
        // アイテムをインベントリから削除
        this.inventory.splice(itemIndex, 1);
        
        // バックパックUIを更新
        this.updateBackpackUI();
    }
    
    getItemColor(type) {
        const itemColors = {
            'health': 0xff4444,
            'food': 0xffaa44,
            'water': 0x44aaff,
            'bandage': 0xff44ff,
            'medicine': 0x44ff44
        };
        return itemColors[type] || 0xffffff;
    }
    
    toggleBackpack() {
        if (this.backpackElement.style.display === 'block') {
            this.backpackElement.style.display = 'none';
        } else {
            this.backpackElement.style.display = 'block';
            this.updateBackpackUI();
        }
    }
    
    updateBackpackUI() {
        // バックパックの内容をクリア
        this.backpackItemsBody.innerHTML = '';
        
        // アイテムがない場合はメッセージを表示
        if (this.inventory.length === 0) {
            this.emptyBackpackMessage.style.display = 'block';
            return;
        }
        
        // アイテムがある場合はメッセージを非表示
        this.emptyBackpackMessage.style.display = 'none';
        
        // アイテムを追加
        this.inventory.forEach(item => {
            const row = document.createElement('tr');
            
            // アイテム名
            const nameCell = document.createElement('td');
            nameCell.textContent = item.name;
            row.appendChild(nameCell);
            
            // 使用ボタン
            const useCell = document.createElement('td');
            const useButton = document.createElement('button');
            useButton.textContent = 'use';
            useButton.className = 'item-button use-button';
            useButton.addEventListener('click', () => this.useItem(item.id));
            useCell.appendChild(useButton);
            row.appendChild(useCell);
            
            // 捨てるボタン
            const dropCell = document.createElement('td');
            const dropButton = document.createElement('button');
            dropButton.textContent = 'drop';
            dropButton.className = 'item-button drop-button';
            dropButton.addEventListener('click', () => this.dropItem(item.id));
            dropCell.appendChild(dropButton);
            row.appendChild(dropCell);
            
            this.backpackItemsBody.appendChild(row);
        });
    }

    // 時間の更新
    updateTimeOfDay() {
        // ゲーム内時間を更新（1秒あたりの進行速度を調整可能）
        this.gameTime += GameConfig.TIME.TIME_SPEED;
        if (this.gameTime > this.dayLength) {
            this.gameTime = 0;
        }
        
        // 時間帯を計算（0-1の値）
        this.timeOfDay = this.gameTime / this.dayLength;
        
        // 太陽の位置を更新
        this.updateSunPosition();
        
        // 空の色を更新
        this.updateSkyColor();
        
        // 霧の色を更新
        this.updateFogColor();
        
        // 時間表示を更新
        this.updateTimeDisplay();
    }
    
    // 太陽の位置を更新
    updateSunPosition() {
        if (!this.sunLight) return;
        
        // 太陽の角度を計算（0-360度）
        const sunAngle = this.timeOfDay * Math.PI * 2;
        
        // 太陽の位置を設定
        const sunRadius = 1000;
        this.sunLight.position.x = Math.cos(sunAngle) * sunRadius;
        this.sunLight.position.y = Math.sin(sunAngle) * sunRadius;
        this.sunLight.position.z = 0;
        
        // 太陽の強度を時間帯に応じて調整
        let sunIntensity = 0;
        
        if (this.timeOfDay > 0.25 && this.timeOfDay < 0.75) {
            // 昼間
            sunIntensity = GameConfig.LIGHTING.SUN_INTENSITY;
        } else if (this.timeOfDay > 0.2 && this.timeOfDay <= 0.25) {
            // 日の出
            sunIntensity = (this.timeOfDay - 0.2) * GameConfig.LIGHTING.SUN_INTENSITY_DAWN_DUSK;
        } else if (this.timeOfDay >= 0.75 && this.timeOfDay < 0.8) {
            // 日没
            sunIntensity = (0.8 - this.timeOfDay) * GameConfig.LIGHTING.SUN_INTENSITY_DAWN_DUSK;
        } else {
            // 夜間
            sunIntensity = GameConfig.LIGHTING.SUN_INTENSITY_NIGHT;
        }
        
        this.sunLight.intensity = sunIntensity;
    }
    
    // 空の色を更新
    updateSkyColor() {
        // 世界時間を取得
        const gameDayLengthMs = GameConfig.TIME.DAY_LENGTH * 1000; // 1時間（ミリ秒）
        const worldTime = (Date.now() - this.gameStartTime) % gameDayLengthMs;
        const worldHours = Math.floor(worldTime / (gameDayLengthMs / 24));
        const worldMinutes = Math.floor((worldTime % (gameDayLengthMs / 24)) / (gameDayLengthMs / 24 / 60));
        
        // 時間帯に応じて空の色を設定
        let skyColor;
        
        if (worldHours >= 7 && worldHours < 17) {
            // 昼間 (7:00-16:59)
            skyColor = new THREE.Color(GameConfig.COLORS.SKY_DAY);
        } else if (worldHours >= 5 && worldHours < 7) {
            // 日の出 (5:00-6:59)
            const t = (worldHours - 5 + worldMinutes / 60) / 2; // 0-1の値に変換
            skyColor = new THREE.Color(GameConfig.COLORS.SKY_DAWN).lerp(new THREE.Color(GameConfig.COLORS.SKY_DAY), t);
        } else if (worldHours >= 17 && worldHours < 18) {
            // 日没 (17:00-17:59)
            const t = (worldHours - 17 + worldMinutes / 60); // 0-1の値に変換
            skyColor = new THREE.Color(GameConfig.COLORS.SKY_DAY).lerp(new THREE.Color(GameConfig.COLORS.SKY_DUSK), t);
        } else {
            // 夜間 (18:00-4:59)
            skyColor = new THREE.Color(GameConfig.COLORS.SKY_NIGHT);
        }
        
        this.scene.background = skyColor;
    }
    
    // 霧の色を更新
    updateFogColor() {
        if (!this.scene.fog) return;
        
        // 世界時間を取得
        const gameDayLengthMs = GameConfig.TIME.DAY_LENGTH * 1000; // 1時間（ミリ秒）
        const worldTime = (Date.now() - this.gameStartTime) % gameDayLengthMs;
        const worldHours = Math.floor(worldTime / (gameDayLengthMs / 24));
        
        // 時間帯に応じて霧の色を設定
        let fogColor;
        
        if (worldHours >= 7 && worldHours < 17) {
            // 昼間 (7:00-16:59)
            fogColor = GameConfig.COLORS.FOG_DAY;
        } else if (worldHours >= 5 && worldHours < 7) {
            // 日の出 (5:00-6:59)
            fogColor = GameConfig.COLORS.FOG_DAWN_DUSK;
        } else if (worldHours >= 17 && worldHours < 18) {
            // 日没 (17:00-17:59)
            fogColor = GameConfig.COLORS.FOG_DAWN_DUSK;
        } else {
            // 夜間 (18:00-4:59)
            fogColor = GameConfig.COLORS.FOG_NIGHT;
        }
        
        this.scene.fog.color.setHex(fogColor);
    }
    
    // 時間表示を更新
    updateTimeDisplay() {
        // プレイヤー生存時間を計算（ミリ秒）
        const survivalTime = Date.now() - this.playerSpawnTime;
        
        // ゲーム内の1日の長さ（秒）
        const gameDayLength = GameConfig.TIME.DAY_LENGTH;
        
        // 生存時間をゲーム内の日数、時間、分に変換
        const survivalDays = Math.floor(survivalTime / (gameDayLength * 1000));
        const survivalHours = Math.floor((survivalTime % (gameDayLength * 1000)) / (gameDayLength * 1000 / 24));
        const survivalMinutes = Math.floor((survivalTime % (gameDayLength * 1000 / 24)) / (gameDayLength * 1000 / 24 / 60));
        
        // 世界の時間を計算（24時間表記）
        // ゲーム内の1日は現実の1時間とする
        const gameDayLengthMs = GameConfig.TIME.DAY_LENGTH * 1000; // 1時間（ミリ秒）
        
        // 世界の経過時間を計算
        const worldTime = (Date.now() - this.gameStartTime) % gameDayLengthMs;
        
        // 世界の時間を24時間表記に変換（0-23時）
        const worldHours = Math.floor(worldTime / (gameDayLengthMs / 24));
        const worldMinutes = Math.floor((worldTime % (gameDayLengthMs / 24)) / (gameDayLengthMs / 24 / 60));
        
        // 時間表示を更新
        const timeDisplay = document.getElementById('timeDisplay');
        if (timeDisplay) {
            timeDisplay.innerHTML = `生存時間: ${survivalDays}日 ${survivalHours.toString().padStart(2, '0')}時間 ${survivalMinutes.toString().padStart(2, '0')}分<br>世界時間: ${worldHours.toString().padStart(2, '0')}:${worldMinutes.toString().padStart(2, '0')}`;
        }
    }

    // 霧の設定を更新するメソッド
    updateFog() {
        if (!this.playerModel) return;
        
        // プレイヤーの位置を取得
        const playerPosition = this.playerModel.getPosition();
        
        // 霧の密度を設定（値が小さいほど霧が濃くなる）
        const fogDensity = GameConfig.FOG.DENSITY;
        
        // 霧を更新（色は時間帯に応じて更新される）
        this.scene.fog = new THREE.FogExp2(this.scene.fog.color.getHex(), fogDensity);
    }

    // アイテム数を更新するメソッド
    updateItemCount() {
        if (this.itemCountElement) {
            this.itemCountElement.textContent = this.inventory.length;
        }
    }

    // ステータスによるHP減少の処理
    updateHealthFromStatus(deltaTime) {
        let damage = 0;
        
        // 空腹が低い場合
        if (this.playerStatus.hunger < 20) {
            damage += (20 - this.playerStatus.hunger) * 0.05 * deltaTime;
        }
        
        // 喉の渇きが低い場合
        if (this.playerStatus.thirst < 20) {
            damage += (20 - this.playerStatus.thirst) * 0.08 * deltaTime;
        }
        
        // 出血が多い場合
        if (this.playerStatus.bleeding > 50) {
            damage += (this.playerStatus.bleeding - 50) * 0.1 * deltaTime;
        }
        
        // 体温が低い場合
        if (this.playerStatus.temperature < 35) {
            damage += (35 - this.playerStatus.temperature) * 0.5 * deltaTime;
        }
        
        // 衛生が低い場合
        if (this.playerStatus.hygiene < 20) {
            damage += (20 - this.playerStatus.hygiene) * 0.03 * deltaTime;
        }
        
        // ダメージを適用
        if (damage > 0) {
            this.takeDamage(damage);
        }
    }

    // ハッシュから色を生成する関数
    generateColorFromHash(hash) {
        // ハッシュの最初の6文字を使用して16進数の色を生成
        const colorHex = '0x' + hash.substring(0, 6);
        return parseInt(colorHex, 16);
    }

    // 敵が倒された時の処理を更新
    handleEnemyDeath(event) {
        this.killedEnemies++; // 倒した敵の数を増やす
        this.updateEnemyCount(); // 表示を更新
        
        // 敵の位置にアイテムを生成
        if (event && event.detail && event.detail.position) {
            this.spawnItem(event.detail.position);
        }
    }

    // アイテムを生成するメソッド
    spawnItem(position) {
        // ランダムなアイテムタイプを選択
        const itemTypes = ['health', 'food', 'water', 'bandage', 'medicine'];
        const randomType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
        
        // アイテムのメッシュを作成
        const geometry = new THREE.SphereGeometry(0.5, 8, 8);
        const material = new THREE.MeshStandardMaterial({
            color: this.getItemColor(randomType),
            emissive: this.getItemColor(randomType),
            emissiveIntensity: 0.5
        });
        
        const itemMesh = new THREE.Mesh(geometry, material);
        itemMesh.position.copy(position);
        itemMesh.userData = { itemType: randomType };
        
        // アイテムをシーンに追加
        this.scene.add(itemMesh);
        this.items.push(itemMesh);
        
        // アイテム数を更新
        this.updateItemCount();
    }

    // URLパラメータをチェックしてdevモードを設定
    checkDevMode() {
        // URLパラメータを取得
        const urlParams = new URLSearchParams(window.location.search);
        const isDevMode = urlParams.get('dev') === '1';
        
        // statsウィンドウを取得
        const statsElement = document.getElementById('stats');
        
        // devモードに応じて表示/非表示を設定
        if (statsElement) {
            statsElement.style.display = isDevMode ? 'block' : 'none';
        }
        
        // devモードの状態を保存
        this.isDevMode = isDevMode;
    }

    // オブジェクトの表示/非表示を更新
    updateObjectVisibility() {
        if (!this.playerModel) return;
        
        const currentTime = Date.now();
        if (currentTime - this.lastVisionUpdate < GameConfig.VISION.UPDATE_INTERVAL) {
            return; // 更新間隔が経過していない場合はスキップ
        }
        
        this.lastVisionUpdate = currentTime;
        
        const playerPosition = this.playerModel.getPosition();
        const maxDistance = GameConfig.VISION.MAX_DISTANCE;
        const fadeStart = GameConfig.VISION.FADE_START;
        
        // 敵の表示/非表示を更新
        this.enemies.forEach(enemy => {
            if (!enemy || !enemy.model) return;
            
            const distance = enemy.model.position.distanceTo(playerPosition);
            
            if (distance > maxDistance) {
                // 最大距離を超えている場合は非表示
                enemy.model.visible = false;
                if (this.visibleObjects && this.visibleObjects.has(enemy.model)) {
                    this.visibleObjects.delete(enemy.model);
                }
            } else if (distance > fadeStart) {
                // フェード開始距離を超えている場合は透明度を調整
                const opacity = 1 - ((distance - fadeStart) / (maxDistance - fadeStart));
                if (enemy.model.material) {
                    enemy.model.material.opacity = opacity;
                    enemy.model.material.transparent = true;
                }
                enemy.model.visible = true;
                if (this.visibleObjects) {
                    this.visibleObjects.add(enemy.model);
                }
            } else {
                // 通常表示
                enemy.model.visible = true;
                if (enemy.model.material && enemy.model.material.opacity !== 1) {
                    enemy.model.material.opacity = 1;
                    enemy.model.material.transparent = false;
                }
                if (this.visibleObjects) {
                    this.visibleObjects.add(enemy.model);
                }
            }
        });
        
        // アイテムの表示/非表示を更新
        this.items.forEach(item => {
            if (!item) return;
            
            const distance = item.position.distanceTo(playerPosition);
            
            if (distance > maxDistance) {
                // 最大距離を超えている場合は非表示
                item.visible = false;
                if (this.visibleObjects && this.visibleObjects.has(item)) {
                    this.visibleObjects.delete(item);
                }
            } else if (distance > fadeStart) {
                // フェード開始距離を超えている場合は透明度を調整
                const opacity = 1 - ((distance - fadeStart) / (maxDistance - fadeStart));
                if (item.material) {
                    item.material.opacity = opacity;
                    item.material.transparent = true;
                }
                item.visible = true;
                if (this.visibleObjects) {
                    this.visibleObjects.add(item);
                }
            } else {
                // 通常表示
                item.visible = true;
                if (item.material && item.material.opacity !== 1) {
                    item.material.opacity = 1;
                    item.material.transparent = false;
                }
                if (this.visibleObjects) {
                    this.visibleObjects.add(item);
                }
            }
        });
        
        // 他のプレイヤーの表示/非表示を更新
        this.players.forEach((player, id) => {
            if (!player || !player.character) return;
            
            const playerPos = player.getPosition();
            const distance = playerPos.distanceTo(playerPosition);
            
            if (distance > maxDistance) {
                // 最大距離を超えている場合は非表示
                player.character.visible = false;
                if (this.visibleObjects && this.visibleObjects.has(player.character)) {
                    this.visibleObjects.delete(player.character);
                }
            } else if (distance > fadeStart) {
                // フェード開始距離を超えている場合は透明度を調整
                const opacity = 1 - ((distance - fadeStart) / (maxDistance - fadeStart));
                player.character.traverse(child => {
                    if (child.isMesh && child.material) {
                        child.material.opacity = opacity;
                        child.material.transparent = true;
                    }
                });
                player.character.visible = true;
                if (this.visibleObjects) {
                    this.visibleObjects.add(player.character);
                }
            } else {
                // 通常表示
                player.character.visible = true;
                player.character.traverse(child => {
                    if (child.isMesh && child.material) {
                        child.material.opacity = 1;
                        child.material.transparent = false;
                    }
                });
                if (this.visibleObjects) {
                    this.visibleObjects.add(player.character);
                }
            }
        });
        
        // 建物の表示/非表示を更新
        if (this.fieldMap && this.fieldMap.objects) {
            this.fieldMap.objects.forEach(object => {
                if (!object) return;
                
                // フィールドオブジェクトの表示/非表示を更新
                const distance = object.position.distanceTo(playerPosition);
                
                if (distance > maxDistance) {
                    // 最大距離を超えている場合は非表示
                    object.visible = false;
                    if (this.visibleObjects && this.visibleObjects.has(object)) {
                        this.visibleObjects.delete(object);
                    }
                } else if (distance > fadeStart) {
                    // フェード開始距離を超えている場合は透明度を調整
                    const opacity = 1 - ((distance - fadeStart) / (maxDistance - fadeStart));
                    object.traverse(child => {
                        if (child.isMesh && child.material) {
                            child.material.opacity = opacity;
                            child.material.transparent = true;
                        }
                    });
                    object.visible = true;
                    if (this.visibleObjects) {
                        this.visibleObjects.add(object);
                    }
                } else {
                    // 通常表示
                    object.visible = true;
                    object.traverse(child => {
                        if (child.isMesh && child.material) {
                            child.material.opacity = 1;
                            child.material.transparent = false;
                        }
                    });
                    if (this.visibleObjects) {
                        this.visibleObjects.add(object);
                    }
                }
            });
        }
    }

    // 敵の弾丸を更新するメソッド
    updateEnemyBullets(deltaTime) {
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            
            // 弾丸を更新
            const isAlive = bullet.update(deltaTime);
            
            // 弾丸が寿命を迎えた場合は削除
            if (!isAlive) {
                this.enemyBullets.splice(i, 1);
                continue;
            }
            
            // プレイヤーとの衝突判定
            const playerPosition = this.playerModel.getPosition();
            const distance = bullet.checkCollision(playerPosition, GameConfig.PLAYER.COLLISION_RADIUS);
            
            // デバッグ用のログ
            //console.log('弾の位置:', bullet.model.position);
            //console.log('プレイヤーの位置:', playerPosition);
            //console.log('距離:', distance);
            
            if (distance) {
                //console.log('プレイヤーにダメージ:', bullet.damage);
                // プレイヤーにダメージを与える
                this.takeDamage(bullet.damage);
                bullet.dispose();
                this.enemyBullets.splice(i, 1);
            }
        }
    }
}

// ゲームの開始
window.addEventListener('load', () => {
    new Game();
}); 