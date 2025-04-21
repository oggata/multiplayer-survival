class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas'), antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        
        this.socket = io();
        this.players = new Map();
        this.bullets = [];
        this.moveSpeed = 2.5;
        this.rotationSpeed = 0.03;
        this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        // プレイヤーモデル用の変数を追加
        this.playerModel = null;
        this.cameraOffset = new THREE.Vector3(0, 3, 7); // カメラのオフセット（プレイヤーからの相対位置）
        
        // 座標表示用の要素
        this.coordinatesElement = document.getElementById('coordinates');
        
        // HP関連の要素
        this.healthFillElement = document.getElementById('healthFill');
        this.healthTextElement = document.getElementById('healthText');
        this.gameOverElement = document.getElementById('gameOver');
        this.restartButtonElement = document.getElementById('restartButton');
        
        // HP関連の変数
        this.maxHealth = 100;
        this.currentHealth = this.maxHealth;
        this.isGameOver = false;
        
        // リスタートボタンのイベントリスナー
        this.restartButtonElement.addEventListener('click', () => this.restartGame());
        
        // 時計
        this.clock = new THREE.Clock();
        
        this.setupScene();
        this.setupControls();
        this.setupSocketEvents();
        this.animate();
    }

    setupScene() {
        // ライティング
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(-3, 10, -10);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.top = 10;
        directionalLight.shadow.camera.bottom = -10;
        directionalLight.shadow.camera.left = -10;
        directionalLight.shadow.camera.right = 10;
        this.scene.add(directionalLight);

        // 地面
        const groundGeometry = new THREE.PlaneGeometry(5000, 5000);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x808080,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // グリッド
        const grid = new THREE.GridHelper(5000, 1000, 0x000000, 0x000000);
        grid.material.opacity = 0.2;
        grid.material.transparent = true;
        this.scene.add(grid);

        // プレイヤーモデルの作成
        this.createPlayerModel();
        
        // カメラの初期位置（プレイヤーの背後）
        this.updateCameraPosition();
    }
    
    createPlayerModel() {
        // 新しいキャラクタークラスを使用してプレイヤーモデルを作成
        this.playerModel = new Character(this.scene);
        this.playerModel.setPosition(0, 0, 0);
    }

    setupControls() {
        // キーボードコントロール
        this.keys = {};
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            console.log('Key pressed:', e.key.toLowerCase());
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // マウスコントロールを削除し、キーボードのみの操作に変更

        // モバイルコントロール
        if (this.isMobile) {
            this.setupMobileControls();
        }

        // 発射ボタン
        const shootButton = document.getElementById('shootButton');
        shootButton.addEventListener('click', () => this.shoot());
    }

    setupMobileControls() {
        const leftJoystick = document.getElementById('leftJoystick');
        const rightJoystick = document.getElementById('rightJoystick');
        
        // 左ジョイスティック（移動用）
        this.leftJoystick = {
            element: leftJoystick,
            active: false,
            x: 0,
            y: 0
        };

        // 右ジョイスティック（視点用）
        this.rightJoystick = {
            element: rightJoystick,
            active: false,
            x: 0,
            y: 0
        };

        // タッチイベントの設定
        [this.leftJoystick, this.rightJoystick].forEach(joystick => {
            joystick.element.addEventListener('touchstart', (e) => {
                joystick.active = true;
                const touch = e.touches[0];
                const rect = joystick.element.getBoundingClientRect();
                joystick.x = (touch.clientX - rect.left - rect.width/2) / (rect.width/2);
                joystick.y = (touch.clientY - rect.top - rect.height/2) / (rect.height/2);
            });

            joystick.element.addEventListener('touchmove', (e) => {
                if (joystick.active) {
                    const touch = e.touches[0];
                    const rect = joystick.element.getBoundingClientRect();
                    joystick.x = (touch.clientX - rect.left - rect.width/2) / (rect.width/2);
                    joystick.y = (touch.clientY - rect.top - rect.height/2) / (rect.height/2);
                }
            });

            joystick.element.addEventListener('touchend', () => {
                joystick.active = false;
                joystick.x = 0;
                joystick.y = 0;
            });
        });
    }

    setupSocketEvents() {
        this.socket.on('currentPlayers', (players) => {
            players.forEach(player => this.addPlayer(player));
        });

        this.socket.on('newPlayer', (player) => {
            this.addPlayer(player);
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
            }
        });

        this.socket.on('playerDisconnected', (playerId) => {
            this.removePlayer(playerId);
        });

        this.socket.on('bulletFired', (data) => {
            console.log('弾が発射されました:', data);
            
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
        const geometry = new THREE.SphereGeometry(0.1);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const bullet = new THREE.Mesh(geometry, material);
        
        bullet.position.copy(position);
        bullet.velocity = direction.clone().multiplyScalar(2);
        bullet.playerId = playerId;
        
        this.scene.add(bullet);
        this.bullets.push(bullet);
    }

    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.position.add(bullet.velocity);

            // 弾の衝突判定
            this.players.forEach((player, playerId) => {
                if (playerId !== bullet.playerId) {
                    const distance = bullet.position.distanceTo(player.getPosition());
                    if (distance < 1) {
                        // ダメージを送信
                        this.socket.emit('playerHit', { 
                            targetId: playerId,
                            damage: 10 // 弾のダメージ量
                        });
                        this.scene.remove(bullet);
                        this.bullets.splice(i, 1);
                    }
                }
            });

            // 弾の寿命管理
            if (bullet.position.length() > 1000) {
                this.scene.remove(bullet);
                this.bullets.splice(i, 1);
            }
        }
    }

    updatePlayer() {
        if (this.isGameOver) return;
        
        let moveX = 0;
        let moveZ = 0;
        let rotateY = 0;
        let isRunning = false;

        if (this.isMobile) {
            if (this.leftJoystick.active) {
                moveX = this.leftJoystick.x * this.moveSpeed;
                moveZ = -this.leftJoystick.y * this.moveSpeed;
            }
            if (this.rightJoystick.active) {
                rotateY = this.rightJoystick.x * this.rotationSpeed;
            }
        } else {
            // キーボードコントロール
            if (this.keys['w']) moveZ = -this.moveSpeed;
            if (this.keys['s']) moveZ = this.moveSpeed;
            if (this.keys['a']) moveX = -this.moveSpeed;
            if (this.keys['d']) moveX = this.moveSpeed;
            if (this.keys['arrowleft']) rotateY = -this.rotationSpeed;
            if (this.keys['arrowright']) rotateY = this.rotationSpeed;
            if (this.keys['p']) this.shoot();
            if (this.keys['shift']) isRunning = true;
            
            // デバッグ用：キーの状態をコンソールに出力
            if (moveX !== 0 || moveZ !== 0 || rotateY !== 0) {
                console.log('Movement:', { moveX, moveZ, rotateY, keys: this.keys });
            }
        }
        
        // 移動方向ベクトルを作成
        const moveDirection = new THREE.Vector3(moveX, 0, moveZ);
        
        // キャラクターの回転を更新
        if (rotateY !== 0) {
            this.playerModel.setRotation(this.playerModel.getRotation().y + rotateY);
        }
        
        // プレイヤーモデルの移動
        this.playerModel.move(moveDirection, isRunning ? this.moveSpeed * 3 : this.moveSpeed, 0.016);
        this.playerModel.setRunning(isRunning);
        
        // カメラの位置を更新（プレイヤーの背後に配置）
        this.updateCameraPosition();
        
        // 座標表示を更新
        this.updateCoordinatesDisplay();

        // サーバーに位置情報を送信
        this.socket.emit('playerMove', {
            position: this.playerModel.getPosition(),
            rotation: { y: this.playerModel.getRotation().y }
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
        const offset = this.cameraOffset.clone();
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
        if (this.currentHealth < 0) {
            this.currentHealth = 0;
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
        this.healthFillElement.style.width = `${healthPercentage}%`;
        
        // HPの値に応じて色を変更
        if (healthPercentage > 60) {
            this.healthFillElement.style.backgroundColor = '#00ff00'; // 緑
        } else if (healthPercentage > 30) {
            this.healthFillElement.style.backgroundColor = '#ffff00'; // 黄
        } else {
            this.healthFillElement.style.backgroundColor = '#ff0000'; // 赤
        }
        
        this.healthTextElement.textContent = `HP: ${this.currentHealth}/${this.maxHealth}`;
    }
    
    // ゲームオーバー処理
    gameOver() {
        this.isGameOver = true;
        this.gameOverElement.style.display = 'block';
        
        // 操作を無効化
        this.keys = {};
    }
    
    // ゲームをリスタートする処理
    restartGame() {
        this.currentHealth = this.maxHealth;
        this.isGameOver = false;
        this.gameOverElement.style.display = 'none';
        
        // プレイヤーの位置をリセット
        if (this.playerModel) {
            this.playerModel.setPosition(0, 0, 0);
            this.playerModel.setRotation(0);
            this.updateCameraPosition();
        }
        
        // サーバーにリスタートを通知
        this.socket.emit('playerRestart');
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // プレイヤーの更新
        this.updatePlayer();
        
        // 弾の更新
        this.updateBullets();
        
        // プレイヤーモデルのアニメーション更新
        if (this.playerModel) {
            this.playerModel.updateLimbAnimation(0.016); // 固定値を使用（約60FPS相当）
        }
        
        // 他のプレイヤーのアニメーション更新
        this.players.forEach(player => {
            player.updateLimbAnimation(0.016); // 固定値を使用（約60FPS相当）
        });
        
        // レンダリング
        this.renderer.render(this.scene, this.camera);
    }
}

// ゲームの開始
window.addEventListener('load', () => {
    new Game();
}); 