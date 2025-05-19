//const { deltaTime } = require("three/tsl");

class AudioManager {
    constructor() {
        this.sounds = {};
        this.loadSounds();
    }

    loadSounds() {
        // 敵を倒した時の音
        this.sounds.enemyDeath = new Audio('se/maou_se_system06.mp3');
        // 銃を発射した時の音
        this.sounds.gunShot = new Audio('se/maou_se_system45.mp3');
        // リスタート時の音
        this.sounds.restart = new Audio('se/maou_se_system13.mp3');
    }

    play(soundName) {
        if (this.sounds[soundName]) {
            // 音声を最初から再生
            this.sounds[soundName].currentTime = 0;
            this.sounds[soundName].play();
        }
    }
}

class Game {
    constructor() {

this.devMode = true;

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
        
        // モノクロ効果用のシェーダーを追加
        this.monochromeShader = {
            uniforms: {
                tDiffuse: { value: null },
                intensity: { value: 0.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float intensity;
                varying vec2 vUv;
                void main() {
                    vec4 color = texture2D(tDiffuse, vUv);
                    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
                    gl_FragColor = vec4(mix(color.rgb, vec3(gray), intensity), color.a);
                }
            `
        };
// leftJoystick をクラスのプロパティとして初期化
    this.leftJoystick = {
        element: null,
        active: false,
        x: 0,
        y: 0,
        isRunning: false
    };
        this.composer = new THREE.EffectComposer(this.renderer);
        this.renderPass = new THREE.RenderPass(this.scene, this.camera);
        this.composer.addPass(this.renderPass);
        
        this.monochromePass = new THREE.ShaderPass(this.monochromeShader);
        this.composer.addPass(this.monochromePass);
        
        this.socket = io();
        this.players = new Map();
        this.enemies = new Map();  // 敵を管理するMapを追加
        this.bullets = [];
        this.moveSpeed = GameConfig.PLAYER.MOVE_SPEED;
        this.rotationSpeed = GameConfig.PLAYER.ROTATION_SPEED;
        this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        // プレイヤーモデル用の変数を追加
        //this.playerModel = new Character(this.scene,"player",this);
        //this.playerModel.setPosition(0, 0, 0);
        this.playerModel = null; // プレイヤーモデルの初期化を遅延させる
        
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

        // 自動射撃の設定
        this.autoShootEnabled = true; // 自動射撃の有効/無効
        this.autoShootRadius = 30; // 自動射撃の検出半径

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
        
        // 射撃関連の変数を追加
        this.shootCooldown = 3; // クールダウン時間（秒）
        this.shootTimer = 0; // 現在のクールダウンタイマー
        this.canShoot = true; // 射撃可能かどうか
        
        // メッセージ表示用の要素を追加
        this.messageIndicators = new Map(); // メッセージインジケーターを管理
        this.createMessageIndicatorContainer();
        
        // WebSocketのメッセージハンドラを追加
        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
                case 'enemySpawn':
                    this.spawnEnemy(data.enemy);
                    break;
                case 'enemyUpdate':
                    this.updateEnemy(data.enemyId, data.position);
                    break;
                case 'enemyBulletSpawn':
                    this.spawnEnemyBullet(data.bullet);
                    break;
                case 'enemyBulletRemove':
                    this.removeEnemyBullet(data.bulletId);
                    break;
                case 'itemSpawn':
                    this.spawnItem(data.item.type, data.item.position.x, data.item.position.z);
                    break;
            }
        };
        
        // アイテム効果表示用の要素
        this.effectsContainer = document.createElement('div');
        this.effectsContainer.id = 'effectsContainer';
        this.effectsContainer.style.cssText = `
            position: fixed;
            top: 30px;
            right: 20px;
            background: rgba(0, 0, 0, 0.7);
            padding: 10px;
            border-radius: 5px;
            color: white;
            font-size: 14px;
            z-index: 1000;
            min-width: 300px;
        `;
        document.body.appendChild(this.effectsContainer);
        
        // 初期表示を設定
        this.updateEffectsDisplay();

        this.audioManager = new AudioManager();

        // ゲーム開始時にランダムなアイテムを3つバックパックに入れる
        const itemTypes = Object.entries(GameConfig.ITEMS)
            .filter(([_, item]) => item.dropChance !== undefined)
            .map(([type]) => type);
        
        for (let i = 0; i < 1; i++) {
            const randomIndex = Math.floor(Math.random() * itemTypes.length);
            const selectedType = itemTypes[randomIndex];
            //const selectedType = itemTypes[0];
            if (selectedType) {
                this.inventory.push({
                    id: Date.now() + i,
                    type: selectedType
                });
            }
        }
        this.updateBackpackUI();
    }

    createMessageIndicatorContainer() {
        const container = document.createElement('div');
        container.id = 'messageIndicators';
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.pointerEvents = 'none';
        container.style.zIndex = '1000';
        document.body.appendChild(container);
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
        
        // プレイヤーの位置を取得
        const playerPosition = this.players.get(playerId)?.getPosition();
        if (!playerPosition) return;

        // 画面内かどうかをチェック
        const screenPosition = this.getScreenPosition(playerPosition);
        const isOnScreen = screenPosition.x >= 0 && screenPosition.x <= window.innerWidth &&
                          screenPosition.y >= 0 && screenPosition.y <= window.innerHeight;

        if (isOnScreen) {
            // 画面内の場合は通常のポップアップを表示
            if (!this.messagePopups) {
                this.messagePopups = new Map();
            }
            
            if (this.messagePopups.has(playerId)) {
                this.messagePopups.get(playerId).remove();
                this.messagePopups.delete(playerId);
            }
            
            const popup = document.createElement('div');
            popup.className = 'message-popup';
            popup.textContent = 'help';
            document.body.appendChild(popup);
            
            this.messagePopups.set(playerId, popup);
            
            popup.style.left = `${screenPosition.x}px`;
            popup.style.top = `${screenPosition.y}px`;
            
            setTimeout(() => {
                if (this.messagePopups && this.messagePopups.has(playerId)) {
                    this.messagePopups.get(playerId).remove();
                    this.messagePopups.delete(playerId);
                }
            }, 3000);
        } else {
            // 画面外の場合は方向インジケーターを表示
            this.showMessageIndicator(playerId, screenPosition);
        }
    }

    showMessageIndicator(playerId, screenPosition) {
        // 既存のインジケーターを削除
        if (this.messageIndicators.has(playerId)) {
            this.messageIndicators.get(playerId).remove();
            this.messageIndicators.delete(playerId);
        }

        // 新しいインジケーターを作成
        const indicator = document.createElement('div');
        indicator.className = 'message-indicator';
        indicator.innerHTML = '<i class="fas fa-exclamation-circle"></i> help';
        indicator.style.position = 'fixed';
        indicator.style.color = 'red';
        indicator.style.fontSize = '20px';
        indicator.style.pointerEvents = 'none';
        indicator.style.zIndex = '1000';
        
        // 画面の端に配置
        const edgeMargin = 20;
        let left = screenPosition.x;
        let top = screenPosition.y;

        // 画面外の位置を調整
        if (left < 0) left = edgeMargin;
        if (left > window.innerWidth) left = window.innerWidth - edgeMargin;
        if (top < 0) top = edgeMargin;
        if (top > window.innerHeight) top = window.innerHeight - edgeMargin;

        indicator.style.left = `${left}px`;
        indicator.style.top = `${top}px`;

        // インジケーターを追加
        document.getElementById('messageIndicators').appendChild(indicator);
        this.messageIndicators.set(playerId, indicator);

        // 3秒後に削除
        setTimeout(() => {
            if (this.messageIndicators.has(playerId)) {
                this.messageIndicators.get(playerId).remove();
                this.messageIndicators.delete(playerId);
            }
        }, 3000);
    }

    updateMessageIndicators() {
        if (!this.messageIndicators || this.messageIndicators.size === 0) return;

        this.messageIndicators.forEach((indicator, playerId) => {
            const player = this.players.get(playerId);
            if (!player) return;

            const screenPosition = this.getScreenPosition(player.getPosition());
            const edgeMargin = 20;
            let left = screenPosition.x;
            let top = screenPosition.y;

            // 画面外の位置を調整
            if (left < 0) left = edgeMargin;
            if (left > window.innerWidth) left = window.innerWidth - edgeMargin;
            if (top < 0) top = edgeMargin;
            if (top > window.innerHeight) top = window.innerHeight - edgeMargin;

            indicator.style.left = `${left}px`;
            indicator.style.top = `${top}px`;
        });
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
        // プレイヤーモデルの作成
        this.createPlayerModel();
        // プレイヤー用のスポットライトを作成
        this.playerLight = new THREE.SpotLight(0xffffff, 2.0); // 色と強度
        this.playerLight.distance = 50; // 光の届く距離
        this.playerLight.angle = Math.PI / 4; // 光の広がり角度（45度）
        this.playerLight.penumbra = 0.2; // エッジの柔らかさ
        this.playerLight.decay = 1.5; // 距離による減衰
        
        // 影の設定
        this.playerLight.castShadow = true;
        this.playerLight.shadow.mapSize.width = 512;
        this.playerLight.shadow.mapSize.height = 512;
        this.playerLight.shadow.camera.near = 0.5;
        this.playerLight.shadow.camera.far = 50;
        
        // ライトのターゲットを作成（これがライトの向きを決める）
        this.playerLightTarget = new THREE.Object3D();
        this.scene.add(this.playerLightTarget);
        this.playerLight.target = this.playerLightTarget;
        
        // シーンにライトを追加
        //this.scene.add(this.playerLight);

 
        // 霧の追加
        this.scene.fog = new THREE.FogExp2(0xcccccc, GameConfig.FOG.DENSITY);

        // フィールドマップの作成（シード値を渡す）
        this.fieldMap = new FieldMap(this.scene, seed);

        this.updateLightDirection();

        
        // カメラの初期位置（プレイヤーの背後）
        this.updateCameraPosition();
        
        // アイテムの生成
        this.spawnItems();
                
        // 時間の初期化
        this.updateTimeOfDay();

        this.weather = new Weather(this.scene, this.camera);

    }

    updateLightDirection() {
        if (!this.fieldMap || !this.fieldMap.terrainGeometry) {
            console.warn('FieldMap または terrainGeometry が初期化されていません');
            return;
        }
        
    // directionalLight が存在するか確認
        const directionalLight = this.sunLight || this.scene.children.find(obj => obj.isDirectionalLight);
        if (!directionalLight) {
            console.warn('DirectionalLight が見つかりません');
            return;
        }


        // テレインのマテリアルを取得
        const material = this.fieldMap.terrainGeometry.material;
        if (!material || !material.uniforms) return;
        
        // ディレクショナルライトのプロパティを更新
        if (this.sunLight) {
            material.uniforms.lightDirection.value.copy(this.sunLight.position).normalize();
            material.uniforms.lightIntensity.value = this.sunLight.intensity;
            material.uniforms.lightColor.value.copy(this.sunLight.color);
        }
        
        // アンビエントライトのプロパティを更新
        if (this.ambientLight) {
            material.uniforms.ambientIntensity.value = this.ambientLight.intensity;
            material.uniforms.ambientColor.value.copy(this.ambientLight.color);
        }
        
        // 強制更新
        material.needsUpdate = true;
    }
        
    createPlayerModel() {

        if(this.playerModel){
            this.scene.remove(this.playerModel.getMesh());
            this.playerModel.dispose();
        }


        // Create new character using the Character class
        this.playerModel = new Character(this.scene, "player", this);
        
        // Set player color if available
        if (this.playerHash) {
            const color = this.generateColorFromHash(this.playerHash);
            this.playerModel.setColor(color);
        }
        
        // Get initial position from server
        const serverPosition = this.playerModel.getPosition();
        
        // Check if this position is safe (not colliding with buildings)
        if (this.fieldMap && this.fieldMap.checkCollision(new THREE.Vector3(
            serverPosition.x, serverPosition.y, serverPosition.z), 2)) {
            
            console.log("Initial position unsafe, finding safe spawn position...");
            
            // Find a safe spawn position
            const safePosition = this.getSafeSpawnPosition();
            this.playerModel.setPosition(safePosition.x, safePosition.y, safePosition.z);
            
            // Immediately notify server of the corrected position
            this.socket.emit('playerMove', {
                position: this.playerModel.getPosition(),
                rotation: { y: this.playerModel.getRotation().y },
                isMoving: false,
                isRunning: false
            });
        }
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

        this.setupMobileControls();
    }

setupMobileControls() {
    // DOM要素の取得を確実にする
    const leftJoystickElement = document.getElementById('leftJoystick');
    const joystickKnob = document.getElementById('joystickKnob');
    const shootButton = document.getElementById('shootButton');
    const messageButton = document.getElementById('messageButton');
    const backpackButton = document.getElementById('backpackButton');

    if (!leftJoystickElement) {
        console.error('左ジョイスティック要素が見つかりません');
        return;
    }

    // leftJoystick を初期化
    this.leftJoystick = {
        element: leftJoystickElement,
        knob: joystickKnob,
        active: false,
        x: 0,
        y: 0,
        isRunning: false
    };

    console.log('ジョイスティックを初期化しました:', this.leftJoystick);

    // 走り状態のインジケーターを追加
    const runIndicator = document.createElement('div');
    runIndicator.id = 'runIndicator';
    runIndicator.style.cssText = `
        position: fixed;
        bottom: 120px;
        left: 20px;
        background-color: rgba(255, 165, 0, 0.7);
        color: white;
        padding: 5px 10px;
        border-radius: 5px;
        font-size: 12px;
        display: none;
    `;
    runIndicator.textContent = 'RUNNING';
    document.body.appendChild(runIndicator);

    // 以下、this のバインディングに注意
    const self = this; // this を保持
    
    // タッチイベントの設定
    this.leftJoystick.element.addEventListener('touchstart', function(e) {
        e.preventDefault();
        self.leftJoystick.active = true;
        const touch = e.touches[0];
        const rect = self.leftJoystick.element.getBoundingClientRect();
        
        // ジョイスティックの中心からの相対位置を計算
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
        
        // -1から1の範囲に正規化
        self.leftJoystick.x = (touchX - centerX) / centerX;
        self.leftJoystick.y = (touchY - centerY) / centerY;
        
        // ジョイスティックの傾き具合を計算
        const magnitude = Math.sqrt(
            self.leftJoystick.x * self.leftJoystick.x + 
            self.leftJoystick.y * self.leftJoystick.y
        );
        
        // 走り状態の判定（magnitude > 0.7 で走る）
        self.leftJoystick.isRunning = magnitude > 0.7;
        runIndicator.style.display = self.leftJoystick.isRunning ? 'block' : 'none';
        
        // ノブの位置を更新
        self.updateJoystickKnob();
    }, { passive: false });

    this.leftJoystick.element.addEventListener('touchmove', function(e) {
        e.preventDefault();
        if (self.leftJoystick.active) {
            const touch = e.touches[0];
            const rect = self.leftJoystick.element.getBoundingClientRect();
            
            // 中心からの相対位置を計算
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const touchX = touch.clientX - rect.left;
            const touchY = touch.clientY - rect.top;
            
            // -1から1の範囲に正規化
            self.leftJoystick.x = (touchX - centerX) / centerX;
            self.leftJoystick.y = (touchY - centerY) / centerY;
            
            // 傾き具合を計算
            const magnitude = Math.sqrt(
                self.leftJoystick.x * self.leftJoystick.x + 
                self.leftJoystick.y * self.leftJoystick.y
            );
            
            // 走り状態の判定
            self.leftJoystick.isRunning = magnitude > 0.7;
            runIndicator.style.display = self.leftJoystick.isRunning ? 'block' : 'none';
            
            // ノブの位置を更新
            self.updateJoystickKnob();
        }
    }, { passive: false });

    document.addEventListener('touchend', function(e) {
        if (!self.leftJoystick.active) return;
        
        self.leftJoystick.active = false;
        self.leftJoystick.x = 0;
        self.leftJoystick.y = 0;
        self.leftJoystick.isRunning = false;
        runIndicator.style.display = 'none';
        
        // ノブを中央に戻す
        if (self.leftJoystick.knob) {
            self.leftJoystick.knob.style.transform = 'translate(0, 0)';
        }
    }, { passive: false });

    // 既存の他のモバイルコントロール設定...
}

// ジョイスティックのノブ位置を更新するヘルパーメソッド
updateJoystickKnob() {
    if (!this.leftJoystick || !this.leftJoystick.knob) {
        console.error('ジョイスティックまたはノブが初期化されていません');
        return;
    }
    
    // ジョイスティックのサイズを取得
    const joystickRect = this.leftJoystick.element.getBoundingClientRect();
    const radius = Math.min(joystickRect.width, joystickRect.height) / 2;
    
    // 入力値からノブの位置を計算
    let knobX = this.leftJoystick.x * radius;
    let knobY = this.leftJoystick.y * radius;
    
    // 距離を制限（円の範囲内に収める）
    const distance = Math.sqrt(knobX * knobX + knobY * knobY);
    if (distance > radius) {
        const scale = radius / distance;
        knobX *= scale;
        knobY *= scale;
    }
    
    // ノブの位置を更新
    this.leftJoystick.knob.style.transform = `translate(${knobX}px, ${knobY}px)`;
    
    // 走り状態に応じてノブの色を変更
    if (this.leftJoystick.isRunning) {
        this.leftJoystick.knob.style.backgroundColor = 'rgba(255, 165, 0, 0.8)'; // オレンジ色
    } else {
        this.leftJoystick.knob.style.backgroundColor = 'rgba(255, 255, 255, 0.5)'; // 通常の白色
    }
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
            //console.log('現在のプレイヤー:', players);
            players.forEach(player => this.addPlayer(player));
            this.updatePlayerCount();
        });

        this.socket.on('newPlayer', (player) => {
            //console.log('新規のプレイヤー:', player);
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
            // 方向ベクトルを正しく再構築
            const direction = new THREE.Vector3(
                data.direction.x,
                data.direction.y,
                data.direction.z
            );
            
            // 位置ベクトルを正しく再構築
            const position = new THREE.Vector3(
                data.position.x,
                data.position.y ,
                data.position.z  //前方に少しずらす
            );

            this.createBullet(position, direction, data.playerId,data.weponId);
        });
        /*
        // ダメージを受けた時のイベント
        this.socket.on('playerHit', (data) => {
            if (data.targetId === this.socket.id) {
                this.takeDamage(data.damage);
            }
        });
        */
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

        // 現在の敵の情報を受信
        this.socket.on('currentEnemies', (enemies) => {
            enemies.forEach(enemy => this.spawnEnemy(enemy));
        });

        this.socket.on('enemySpawned', (enemy) => {
            this.spawnEnemy(enemy);
        });

        this.socket.on('enemiesKilled', (enemyIds) => {
            enemyIds.forEach(enemyId => {
                const enemy = this.enemies.get(enemyId);
                if (enemy) {
                    // 敵のモデルをシーンから削除
                    enemy.die2();
                    // 敵をMapから削除
                    this.enemies.delete(enemyId);
                }
            });
        });

        // 敵の移動
        this.socket.on('enemyMoved', (data) => {
            this.updateEnemy(data.id, data.position);
        });

        // 敵の状態変更イベントを処理
        this.socket.on('enemyStateChanged', (data) => {
            //console.log('Enemy state changed:', data.id, data.state); // デバッグ用
            const enemy = this.enemies.get(data.id);
            if (enemy) {
                // 敵の状態を更新
                enemy.state = data.state;
                // 攻撃状態になった場合に攻撃モーションを開始
                if (data.state === 'attacking' && enemy.model && enemy.model.startAttack) {
                    //console.log('Starting attack animation for enemy:', data.id);
                    enemy.model.startAttack();
                }
            }
        });

        // 敵の攻撃
        this.socket.on('enemyAttack', (data) => {
            this.takeDamage(data.damage);
        });
    }

    addPlayer(playerData) {
        //console.log('プレイヤーを追加:', playerData);
        // プレイヤーがすでに存在する場合は何もしない
        if (this.players.has(playerData.id)) {
            //console.log('プレイヤーはすでに存在します:', playerData.id);
            return;
        }


        // 他のプレイヤーを 追加
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
        this.updatePlayerCount();
    }

    removePlayer(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            player.dispose();
            this.players.delete(playerId);
        }
        this.updatePlayerCount();
    }

    shoot() {
    if (this.isGameOver || !this.canShoot) return;
    
    // 音を再生
    //this.audioManager.play('gunShot');
    
    // 現在の武器タイプを取得
    const currentWeponTypes = this.playerStatus.getCurrentWeponType();
    const weponId = currentWeponTypes.length > 0 ? currentWeponTypes[0] : "wepon001";
    
    // プレイヤーの向きに基づいて弾を発射
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.playerModel.getRotation().y);
    
    // プレイヤーの位置から少し前方に弾を発射
    const bulletPosition = this.playerModel.getPosition().clone();
    bulletPosition.y += 0.5; // プレイヤーの目の高さ
    
    // プレイヤーの前方に弾丸の位置をずらす（方向に基づいて計算）
    const offset = 1.5; // 前方へのオフセット距離
    bulletPosition.add(direction.clone().multiplyScalar(offset));
    
    //console.log(weponId);
    this.socket.emit('shoot', {
        weponId: weponId,
        position: bulletPosition,
        direction: direction,
        bulletDamage:10
    });
    
    this.createBullet(bulletPosition, direction, this.socket.id, weponId);
    
    // 射撃後はクールダウンを開始
    this.canShoot = false;
    this.shootTimer = 0;
}
    createBullet(position, direction, playerId, weponId) {

        if(weponId=="wepon001"){
            const bullet = new Bullet(this.scene, position, direction, playerId,"bullet001");
            this.bullets.push(bullet);
        }
        if (weponId == "shotgun") {
            const spreadAngle = Math.PI / 8; // 放射の角度（ラジアン単位、ここでは22.5度）
            const bulletCount = 4; // 弾丸の数
        
            for (let i = 0; i < bulletCount; i++) {
                // 放射状に広がる方向を計算
                const angleOffset = spreadAngle * (i - (bulletCount - 1) / 2); // 中心から左右に広がる
                const spreadDirection = direction.clone().applyAxisAngle(new THREE.Vector3(0, 0.5, 0), angleOffset);
                // 弾丸を生成
                const bullet = new Bullet(this.scene, position, spreadDirection, playerId,"shotgun");
                this.bullets.push(bullet);
            }
        }
        if(weponId=="magnum"){
            const bullet = new Bullet(this.scene, position, direction, playerId,"magnum");
            this.bullets.push(bullet);
        }
        if (weponId == "machinegun") {
            const bulletCount = 5; // 弾丸の数
            const delay = 200; // 各弾丸の発射間隔（ミリ秒）
        
            for (let i = 0; i < bulletCount; i++) {
                setTimeout(() => {
                    // 弾丸を生成
                    const bullet = new Bullet(this.scene, position.clone(), direction.clone(), playerId,"machinegun");
                    this.bullets.push(bullet);
                }, i * delay); // 時間差を設定
            }
        }
        if (weponId == "sniperrifle") {
            const bulletCount = 2; // 弾丸の数
            const delay = 200; // 各弾丸の発射間隔（ミリ秒）
        
            for (let i = 0; i < bulletCount; i++) {
                setTimeout(() => {
                    // 弾丸を生成
                    const bullet = new Bullet(this.scene, position.clone(), direction.clone(), playerId,"machinegun");
                    this.bullets.push(bullet);
                }, i * delay); // 時間差を設定
            }
        }
        if (weponId == "rocketlauncher") {
            const spreadAngle = Math.PI / 12; // 放射の角度（ラジアン単位、ここでは22.5度）
            const bulletCount = 12; // 弾丸の数
        
            for (let i = 0; i < bulletCount; i++) {
                // 放射状に広がる方向を計算
                const angleOffset = spreadAngle * (i - (bulletCount - 1) / 2); // 中心から左右に広がる
                const spreadDirection = direction.clone().applyAxisAngle(new THREE.Vector3(0, 0.5, 0), angleOffset);
                // 弾丸を生成
                const bullet = new Bullet(this.scene, position, spreadDirection, playerId,"rocketlauncher");
                this.bullets.push(bullet);
            }
        }

        
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

            // 敵との衝突判定
            this.enemies.forEach((enemy, enemyId) => {
                // 敵が死亡している場合はスキップ
                if (!enemy || enemy.isDead) return;
                
                if (enemy.checkBulletCollision(bullet.model.position)) {
                    var age = bullet.getAge();
                    if(age>0.2){
                        // ダメージを送信
                        this.socket.emit('enemyHit', { 
                            targetId: enemyId,
                            damage: bullet.damage
                        });
                    }
                    // 敵にダメージを与える
                    enemy.takeDamage(bullet.damage);
                    bullet.dispose();
                    this.bullets.splice(i, 1);
                }
            });

            // プレイヤーとの衝突判定
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
            
            // 走り状態の設定
            isRunning = this.leftJoystick.isRunning;
            
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
    const moveSpeed2 = this.moveSpeed + this.playerStatus.moveSpeedMultiplier;
    this.playerModel.move(moveDirection, isRunning ? moveSpeed2 * 3 : moveSpeed2, deltaTime);
    this.playerModel.setRunning(isRunning);
    
    // 移動後の位置を取得
    const newPosition = this.playerModel.getPosition();
    
    // マップオブジェクトとの衝突判定
    let hasCollision = false;
    
    // 建物との衝突判定
    if (this.fieldMap && this.fieldMap.checkCollision(newPosition, 1)) {
        hasCollision = true;
    }
    
    // 敵との衝突判定を追加
    const playerCollisionRadius = 0.8; // プレイヤーの衝突半径
    const enemyCollisionRadius = 0.8; // 敵の衝突半径
    const minDistance = playerCollisionRadius + enemyCollisionRadius;
    
    this.enemies.forEach(enemy => {
        if (enemy.isDead) return; // 死亡している敵はスキップ
        
        const enemyPosition = enemy.model.getPosition();
        const distance = newPosition.distanceTo(enemyPosition);
        
        if (distance < minDistance) {
            hasCollision = true;
        }
    });
    
    // 衝突が発生した場合は元の位置に戻す
    if (hasCollision) {
        this.playerModel.setPosition(currentPosition.x, currentPosition.y, currentPosition.z);
    } else {
        // 移動した場合、空腹と喉の渇きを減少させる
        if (isMoving) {
            // 走っている場合はより早く減少
            const decreaseRate = isRunning ? GameConfig.STATUS.MOVEMENT.RUNNING_MULTIPLIER : 1.0;
            // 移動時の減少率を適用
            this.playerStatus.decreaseHunger(GameConfig.STATUS.MOVEMENT.HUNGER * decreaseRate * deltaTime);
            this.playerStatus.decreaseThirst(GameConfig.STATUS.MOVEMENT.THIRST * decreaseRate * deltaTime);
        }
    }
        
        // カメラの位置を更新（プレイヤーの背後に配置）
        this.updateCameraPosition();
        
        // 座標表示を更新
        this.updateCoordinatesDisplay();

        this.updatePlayerLight();
        // サーバーに位置情報を送信
        this.socket.emit('playerMove', {
            position: this.playerModel.getPosition(),
            rotation: { y: this.playerModel.getRotation().y },
            isMoving: this.playerModel.isMoving,
            isRunning: this.playerModel.isRunning
        });
    }

    // プレイヤーライトを更新するための新しいメソッド
    updatePlayerLight() {
        if (!this.playerLight || !this.playerLightTarget || !this.playerModel) return;
        
        // プレイヤーの位置を取得
        const playerPosition = this.playerModel.getPosition();
        
        // プレイヤーライトの位置を設定（プレイヤーの肩の高さくらいに配置）
        this.playerLight.position.set(
            playerPosition.x,
            playerPosition.y + 1.2, // プレイヤーより少し上に配置
            playerPosition.z
        );
        
        // プレイヤーの向きを取得
        const rotation = this.playerModel.getRotation();
        
        // プレイヤーの向きに基づいて前方向を計算
        const forwardDirection = new THREE.Vector3(0, 0, -1);
        forwardDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation.y);
        
        // ライトのターゲットをプレイヤーの前方に配置
        this.playerLightTarget.position.copy(playerPosition);
        this.playerLightTarget.position.add(forwardDirection.multiplyScalar(10)); // 10単位前方
        this.playerLightTarget.position.y = playerPosition.y; // 同じ高さにする
        
        // 地形シェーダーのuniformsを更新
        if (this.fieldMap && this.fieldMap.terrainGeometry && 
            this.fieldMap.terrainGeometry.material && 
            this.fieldMap.terrainGeometry.material.uniforms) {
            
            const uniforms = this.fieldMap.terrainGeometry.material.uniforms;
            
            // ライトが有効かどうか
            uniforms.spotLightEnabled.value = this.playerLight.intensity > 0.1;
            
            // ライトが有効な場合、他のパラメータを更新
            if (uniforms.spotLightEnabled.value) {
                // ライトの位置
                uniforms.spotLightPosition.value.copy(this.playerLight.position);
                
                // ライトの方向（ターゲットへのベクトル）
                const direction = new THREE.Vector3().subVectors(
                    this.playerLightTarget.position,
                    this.playerLight.position
                ).normalize();
                uniforms.spotLightDirection.value.copy(direction);
                
                // ライトの色と強度
                uniforms.spotLightColor.value.copy(this.playerLight.color);
                uniforms.spotLightIntensity.value = this.playerLight.intensity;
                
                // その他のパラメータ
                uniforms.spotLightDistance.value = this.playerLight.distance;
                uniforms.spotLightAngle.value = this.playerLight.angle;
                uniforms.spotLightPenumbra.value = this.playerLight.penumbra;
            }
            
            // マテリアルの更新フラグをセット
            this.fieldMap.terrainGeometry.material.needsUpdate = true;
        }
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
       //console.log(damage);
       this.currentHealth -= damage;
        this.playerStatus.health = this.currentHealth; // HPを同期
        
        // 出血を増加させる
        this.playerStatus.increaseBleeding(damage);
        
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


        this.playerSpawnTime = Date.now();
        
        // 生存時間をゲーム内の日数、時間、分に変換
        const survivalDays = Math.floor(survivalTime / (gameDayLength * 1000));
        const survivalHours = Math.floor((survivalTime % (gameDayLength * 1000)) / (gameDayLength * 1000 / 24));
        const survivalMinutes = Math.floor((survivalTime % (gameDayLength * 1000 / 24)) / (gameDayLength * 1000 / 24 / 60));
        
        // ゲームオーバー画面を表示
        const gameOverElement = document.getElementById('gameOver');
        gameOverElement.innerHTML = `
            <div>Game Over!!</div>
            <div>[ survival time ${survivalDays} day ${survivalHours} hour ${survivalMinutes} min ]</div>
            <div class="share-buttons">
                <button id="restartButton">Restart</button>
                <button id="twitterShareButton" onclick="game.shareToTwitter()">
                    <i class="fab fa-twitter"></i> Share on X
                </button>
                <button id="copyShareButton" onclick="game.copyShareText()">
                    <i class="fas fa-copy"></i> Copy Text
                </button>
            </div>
            <div id="copyMessage" style="display: none; color: #4CAF50; margin-top: 10px;">
                Copied!
            </div>
        `;
        gameOverElement.style.display = 'block';
        
        // リスタートボタンのイベントリスナーを設定
        document.getElementById('restartButton').addEventListener('click', () => {
            this.restartGame();
        });
    }
    
    // プレイヤー数を更新するメソッド
    updatePlayerCount() {
        const playerCountElement = document.getElementById('player-count-number');
        if (playerCountElement) {
            //playerCountElement.textContent = this.players.size;
        }
    }

    // 他のプレイヤーの近くにリスポーンするメソッド
    getNearbyPlayerPosition() {
        if (this.players.size === 0) {
            // 他のプレイヤーがいない場合は安全なスポーン位置を返す
            return this.getSafeSpawnPosition();
        }

        // ランダムに他のプレイヤーを選択
        const playerArray = Array.from(this.players.values());
        const randomPlayer = playerArray[Math.floor(Math.random() * playerArray.length)];
        
        // 選択したプレイヤーの位置を取得
        const playerPosition = randomPlayer.getPosition();
        
        // 最大試行回数
        const maxAttempts = 10;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            // プレイヤーの周囲にランダムなオフセットを加える
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * 10, // -5から5の範囲でランダム
                0,
                (Math.random() - 0.5) * 10  // -5から5の範囲でランダム
            );
            
            // 新しい位置を計算
            const newPosition = playerPosition.clone().add(offset);
            
            // マップの境界内に収める
            newPosition.x = Math.max(-450, Math.min(450, newPosition.x));
            newPosition.z = Math.max(-450, Math.min(450, newPosition.z));
            
            // 建物との衝突チェック
            if (!this.fieldMap.checkCollision(newPosition, 1)) {
                return newPosition;
            }
            
            attempts++;
        }
        
        // 最大試行回数を超えた場合は、マップの安全な位置を返す
        return this.getSafeSpawnPosition();
    }

getSafeSpawnPosition() {
    const maxAttempts = 50; // Increase the number of attempts
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        // Try larger areas of the map but avoid the center
        // (buildings are often more concentrated in the center)
        const section = Math.floor(Math.random() * 4); // 0-3 for four quadrants
        let x, z;
        
        switch(section) {
            case 0: // Northeast
                x = Math.random() * 400 + 50;
                z = Math.random() * 400 + 50;
                break;
            case 1: // Northwest
                x = Math.random() * -400 - 50;
                z = Math.random() * 400 + 50;
                break;
            case 2: // Southeast
                x = Math.random() * 400 + 50;
                z = Math.random() * -400 - 50;
                break;
            case 3: // Southwest
                x = Math.random() * -400 - 50;
                z = Math.random() * -400 - 50;
                break;
        }
        
        const position = new THREE.Vector3(x, 0, z);
        
        // Use a larger radius for collision check
        if (!this.fieldMap.checkCollision(position, 3)) {
            // Confirm there's no building nearby by checking a few points around
            let isSafe = true;
            for (let dx = -5; dx <= 5; dx += 5) {
                for (let dz = -5; dz <= 5; dz += 5) {
                    const checkPos = new THREE.Vector3(x + dx, 0, z + dz);
                    if (this.fieldMap.checkCollision(checkPos, 1)) {
                        isSafe = false;
                        break;
                    }
                }
                if (!isSafe) break;
            }
            
            if (isSafe) {
                // We found a position that's safe and away from buildings
                return position;
            }
        }
        
        attempts++;
    }
    
    // If all else fails, try some known likely-safe coordinates
    const safeSpots = [
        new THREE.Vector3(200, 0, 200),
        new THREE.Vector3(-200, 0, 200),
        new THREE.Vector3(200, 0, -200),
        new THREE.Vector3(-200, 0, -200)
    ];
    
    for (const spot of safeSpots) {
        if (!this.fieldMap.checkCollision(spot, 3)) {
            return spot;
        }
    }
    
    // Absolute fallback
    return new THREE.Vector3(0, 5, 0); // Slightly elevated for safety
}

    // ゲームをリスタートする処理
    restartGame() {
        // 音を再生
        this.audioManager.play('restart');
        
        this.currentHealth = this.maxHealth;
        this.playerStatus.reset(); // プレイヤーステータスを完全にリセット
        this.isGameOver = false;
        this.gameOverElement.style.display = 'none';
        

        this.playerSpawnTime = Date.now();
        /*
        // 古いキャラクターを確実に削除
        if (this.playerModel) {
            this.scene.remove(this.playerModel.character);
            this.playerModel.dispose();
            this.playerModel = null;
        }
        */
        // ランダムなリスポーンポイントを探す
   // const safePosition = this.findSafeRespawnPosition();
    
    // プレイヤーの位置を更新
   // this.playerModel.setPosition(safePosition.x, safePosition.y, safePosition.z);
    
        // 新しいキャラクターを作成（他のプレイヤーの近くにスポーン）
        this.createPlayerModel();
        
        // サーバーにリスタートを通知
        this.socket.emit('playerRestart');
    }
// 安全なリスポーンポイントを探す新しいメソッドを追加
findSafeRespawnPosition() {
    const maxAttempts = 20; // 最大試行回数
    const safeDistance = 10; // 敵から最低限離れるべき距離
    
    // 現在のプレイヤー位置
    const currentPosition = this.playerModel.getPosition().clone();
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // ランダムな方向と距離を生成
        const angle = Math.random() * Math.PI * 2;
        const distance = 10 + Math.random() * 20; // 10-30ユニットの距離
        
        // 新しい候補位置を計算
        const newPosition = new THREE.Vector3(
            currentPosition.x + Math.cos(angle) * distance,
            currentPosition.y,
            currentPosition.z + Math.sin(angle) * distance
        );
        
        // マップの境界内に収める
        newPosition.x = Math.max(-450, Math.min(450, newPosition.x));
        newPosition.z = Math.max(-450, Math.min(450, newPosition.z));
        
        // 地形の高さを取得
        const terrainHeight = this.fieldMap.getHeightAt(newPosition.x, newPosition.z);
        if (terrainHeight !== null) {
            newPosition.y = terrainHeight + 0.5;
        }
        
        // 建物との衝突チェック
        if (this.fieldMap.checkCollision(newPosition, 2)) {
            continue; // 衝突する場合は次の候補へ
        }
        
        // 敵との距離をチェック
        let isSafe = true;
        this.enemies.forEach(enemy => {
            if (enemy.isDead) return;
            
            const enemyPosition = enemy.model.getPosition();
            const distance = newPosition.distanceTo(enemyPosition);
            
            if (distance < safeDistance) {
                isSafe = false;
            }
        });
        
        // 安全な位置が見つかった場合
        if (isSafe) {
            return newPosition;
        }
    }
    
    // 安全な位置が見つからなかった場合、マップ上の別のランダムな位置を使用
    return this.getSafeMapPosition();
}

// マップ上の安全な位置を取得するバックアップメソッド
getSafeMapPosition() {
    // マップの四隅から一つをランダムに選択
    const safeLocations = [
        new THREE.Vector3(200, 0, 200),
        new THREE.Vector3(-200, 0, 200),
        new THREE.Vector3(200, 0, -200),
        new THREE.Vector3(-200, 0, -200)
    ];
    
    const selectedLocation = safeLocations[Math.floor(Math.random() * safeLocations.length)];
    
    // 地形の高さを取得
    const terrainHeight = this.fieldMap.getHeightAt(selectedLocation.x, selectedLocation.z);
    if (terrainHeight !== null) {
        selectedLocation.y = terrainHeight + 0.5;
    }
    
    return selectedLocation;
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
        //this.updateEnemyBullets(deltaTime); // 敵の弾丸を更新
//this.updateEnemies(deltaTime);
        //this.spawnEnemies();
        
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
        
        this.updateLightDirection();


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
        if (this.currentHealth <= this.maxHealth * 0.2) {
            this.monochromePass.uniforms.intensity.value = 1.0;
            this.composer.render();
        } else {
            this.monochromePass.uniforms.intensity.value = 0.0;
        this.renderer.render(this.scene, this.camera);
        }
        
        // メッセージインジケーターの位置を更新
        this.updateMessageIndicators();
    }

    update(deltaTime) {
        if (this.isGameOver) return;
        


        // プレイヤーの位置に基づいてバイオーム名を表示
        const biome = this.fieldMap.getBiomeAt(this.playerModel.position.x, this.playerModel.position.z);
        //console.log('現在のバイオーム:', biome.type);
        
    // 敵の表示/非表示を更新
    this.enemies.forEach(enemy => {
        // スキップフラグがある場合は更新しない
        if (enemy.skipUpdate) return;
        
        // 更新優先度が低い敵は3フレームに1回だけ更新
        if (enemy.updatePriority === 'low' && this.frameCount % 3 !== 0) return;
        
        // アニメーションの更新
        enemy.model.updateLimbAnimation(deltaTime);
    });

this.updateLightDirection();

        // 射撃のクールダウンを更新
        if (!this.canShoot) {
            this.shootTimer += deltaTime;       
            if (this.shootTimer >= this.shootCooldown) {
                this.canShoot = true;
                this.shootTimer = 0;
            }
        }

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

        /*
        // 敵の弾丸の更新
        this.enemyBullets.forEach(bullet => {
            bullet.update(deltaTime);3
        });
*/
        // 敵の表示/非表示を更新


        //itemの更新
        this.items.forEach(item => {
            item.update(deltaTime);
        });
        
        // アイテム効果の表示を更新
        this.updateEffectsDisplay();

    // 自動射撃の処理
    if (this.autoShootEnabled && !this.isGameOver && this.canShoot) {
        const playerPosition = this.playerModel.getPosition();
        let nearestEnemy = null;
        let minDistance = Infinity;
        
        // 最も近い敵を探す
        this.enemies.forEach((enemy) => {
            if (!enemy.isDead) {
                const enemyPosition = enemy.model.getPosition();
                const distance = playerPosition.distanceTo(enemyPosition);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestEnemy = {
                        enemy: enemy,
                        distance: distance,
                        position: enemyPosition
                    };
                }
            }
        });
        
        // 最も近い敵が検出半径内にいれば自動射撃
        if (nearestEnemy && nearestEnemy.distance < this.autoShootRadius) {
            // 自動射撃
            this.shoot();
        }
    }



    }

    updateStatusDisplay() {
        // プレイヤーステータスのUIを更新
        this.playerStatus.updateUI();
    }
    
    spawnItems() {
        // 建物の位置を取得
        const buildings = this.fieldMap.objects.filter(obj => obj.userData && obj.userData.type === 'building');
        
        // アイテムを生成
        for (let i = 0; i < this.maxItems; i++) {
            // GameConfig.ITEMSからランダムにアイテムタイプを選択
            const itemTypes = Object.entries(GameConfig.ITEMS)
                .filter(([_, item]) => item.dropChance !== undefined)
                .map(([type]) => type);
            
            if (itemTypes.length === 0) continue;
            
            const selectedType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
            if (!selectedType || !GameConfig.ITEMS[selectedType]) continue;

            let x, z;
            const spawnRandom = Math.random();
            if (spawnRandom < GameConfig.ITEM.SPAWN.BUILDING_CHANCE && buildings.length > 0) {
                // 建物の近くにスポーン
                const randomBuilding = buildings[Math.floor(Math.random() * buildings.length)];
                const angle = Math.random() * Math.PI * 2;
                const distance = GameConfig.ITEM.SPAWN.MIN_DISTANCE + 
                    Math.random() * (GameConfig.ITEM.SPAWN.MAX_DISTANCE - GameConfig.ITEM.SPAWN.MIN_DISTANCE);
                
                x = randomBuilding.position.x + Math.cos(angle) * distance;
                z = randomBuilding.position.z + Math.sin(angle) * distance;
            } else {
                // 空き地にスポーン
                x = (Math.random() - 0.5) * this.fieldMap.mapSize;
                z = (Math.random() - 0.5) * this.fieldMap.mapSize;
            }

            // アイテムを生成
            const position = new THREE.Vector3(x, 0.5, z);
            this.spawnItem(selectedType, position);
        }
    }
    
    checkItemCollisions() {
        //console.log("aa");
        if (!this.playerModel) return;
        
        const playerPosition = this.playerModel.getPosition();
        const COLLECTION_DISTANCE = 2.0;

        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            if (!item || !item.mesh) continue;
            
            const distance = playerPosition.distanceTo(item.mesh.position);
            if (distance < COLLECTION_DISTANCE) {
                // アイテムを収集
                const itemData = item.collect();
                if (itemData) {
                    this.collectItem(itemData);
                    this.scene.remove(item.mesh);
                    this.items.splice(i, 1);
                }
            }
        }
    }
    
    collectItem(item) {
        //console.log(item)
        if (!item || !item.type) {
            console.error('無効なアイテムです:', item);
            return;
        }

        // アイテムをインベントリに追加
        this.inventory.push({
            id: Date.now() + Math.random(), // ユニークID
            type: item.type
        });
        
        // バックパックUIを更新
        this.updateBackpackUI();
        
        // アイテム数を更新
        this.updateItemCount();
    }
    
    useItem(itemType) {
        //console.log(itemType);
        const itemConfig = GameConfig.ITEMS[itemType];
        if (!itemConfig) return;
        // 即時効果の適用
        if (itemConfig.effects?.immediate) {
            const effects = itemConfig.effects.immediate;
            if (effects.health) {
                this.playerStatus.addHealth(effects.health);
            }
            if (effects.hunger) {
                this.playerStatus.addHunger(effects.hunger);
            }
            if (effects.thirst) {
                this.playerStatus.addThirst(effects.thirst);
            }
        }

        // 持続効果の適用
        if (itemConfig.effects?.duration) {
            const durationEffect = itemConfig.effects.duration;
            //console.log(durationEffect);
            this.playerStatus.addDurationEffect(durationEffect);
        }

        // インベントリからアイテムを削除
        const index = this.inventory.findIndex(item => item.type === itemType);
        if (index !== -1) {
            this.inventory.splice(index, 1);
            this.updateBackpackUI();
        }
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
        return GameConfig.ITEMS[type]?.color || 0xffffff;
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
        // バックパックが空の場合のメッセージ表示
        if (this.inventory.length === 0) {
            this.emptyBackpackMessage.style.display = 'block';
            this.backpackItemsBody.innerHTML = '';
            return;
        }

        // バックパックにアイテムがある場合
        this.emptyBackpackMessage.style.display = 'none';
        this.backpackItemsBody.innerHTML = '';

        this.inventory.forEach(item => {
            const itemConfig = GameConfig.ITEMS[item.type];
            if (!itemConfig) return;

            const itemElement = document.createElement('div');
            itemElement.className = 'backpack-item';
            itemElement.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 5px 10px;
                margin: 2px 0;
                background: rgba(0, 0, 0, 0.5);
                border-radius: 4px;
                font-size: 14px;
            `;
            
            const useButton = document.createElement('button');
            useButton.textContent = 'use';
            useButton.style.cssText = `
                padding: 2px 8px;
                margin: 0 4px;
                font-size: 14px;
                background: #4CAF50;
                border: none;
                border-radius: 3px;
                color: white;
                cursor: pointer;
            `;
            useButton.addEventListener('click', () => this.useItem(item.type));
            
            const dropButton = document.createElement('button');
            dropButton.textContent = 'drop';
            dropButton.style.cssText = `
                padding: 2px 8px;
                margin: 0 4px;
                font-size: 14px;
                background: #f44336;
                border: none;
                border-radius: 3px;
                color: white;
                cursor: pointer;
            `;
            dropButton.addEventListener('click', () => this.dropItem(item.id));
            
            const itemInfo = document.createElement('div');
            itemInfo.style.cssText = `
                flex: 1;
                margin-right: 10px;
            `;
            itemInfo.innerHTML = `
                <span style="font-weight: bold; margin-right: 8px;">${itemConfig.name}</span>

                <span style="color: #8ff; font-size: 11px; margin-left: 8px;">${itemConfig.description}</span>
            `;
            
            const actionDiv = document.createElement('div');
            actionDiv.style.cssText = `
                display: flex;
                align-items: center;
            `;
            actionDiv.appendChild(useButton);
            actionDiv.appendChild(dropButton);
            
            itemElement.appendChild(itemInfo);
            itemElement.appendChild(actionDiv);
            
            this.backpackItemsBody.appendChild(itemElement);
        });
    }

    // アイテム効果を整形するヘルパーメソッド
    formatItemEffects(effects) {
        const formattedEffects = [];
        
        if (effects.immediate) {
            if (effects.immediate.health) {
                formattedEffects.push(`HP ${effects.immediate.health > 0 ? '+' : ''}${effects.immediate.health}`);
            }
            if (effects.immediate.hunger) {
                formattedEffects.push(`Hunger ${effects.immediate.hunger > 0 ? '+' : ''}${effects.immediate.hunger}`);
            }
            if (effects.immediate.thirst) {
                formattedEffects.push(`Thirst ${effects.immediate.thirst > 0 ? '+' : ''}${effects.immediate.thirst}`);
            }
        }
        
        if (effects.duration) {
            if (effects.duration.health) {
                formattedEffects.push(`HP ${effects.duration.health > 0 ? '+' : ''}${effects.duration.health}/秒 (${effects.duration.duration}秒)`);
            }
            if (effects.duration.hunger) {
                formattedEffects.push(`Hunger ${effects.duration.hunger > 0 ? '+' : ''}${effects.duration.hunger}/秒 (${effects.duration.duration}秒)`);
            }
            if (effects.duration.thirst) {
                formattedEffects.push(`Thirst ${effects.duration.thirst > 0 ? '+' : ''}${effects.duration.thirst}/秒 (${effects.duration.duration}秒)`);
            }
        }
        
        return formattedEffects.join(', ');
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

        this.updatePlayerLightIntensity();
    }


    // プレイヤーライトの強度を調整するメソッド
    updatePlayerLightIntensity() {
        if (!this.playerLight) return;
        
        // 時間帯に応じて強度を調整
        let newIntensity = 0.1; // デフォルトは低強度
        
        // 夜間（timeOfDay が 0.8-0.2 の間）は最大強度
        if (this.timeOfDay > 0.8 || this.timeOfDay < 0.2) {
            newIntensity = 2.5;
        } 
        // 夕方と朝方（0.2-0.25 と 0.75-0.8）は中程度の強度
        else if (this.timeOfDay > 0.75 || this.timeOfDay < 0.25) {
            newIntensity = 1.5;
        }
        
        // 変更があった場合のみ更新
        if (this.playerLight.intensity !== newIntensity) {
            this.playerLight.intensity = newIntensity;
            
            // プレイヤーライトの更新を呼び出して地形シェーダーのuniformsも更新
            this.updatePlayerLight();
        }
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
    
        // 太陽が変化したときにシェーダーの照明を更新するためにこの行を追加
        this.updateLightDirection();
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
                   // 昼間 (7:00-16:59)
            //skyColor = new THREE.Color(GameConfig.COLORS.SKY_DAY); 
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
        this.updateLightDirection(); // この行を追加
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
    


        const playerCountElement = document.getElementById('player-count-number');
        if (playerCountElement) {
            //playerCountElement.textContent = this.players.size;
        }


        
        // 時間表示を更新
        const timeDisplay = document.getElementById('timeDisplay');
        if (timeDisplay) {
            timeDisplay.innerHTML = `<i class="fas fa-user-alt"></i> ${this.players.size} <br><i class="fas fa-stopwatch"></i> ${survivalDays}D ${survivalHours.toString().padStart(2, '0')}H ${survivalMinutes.toString().padStart(2, '0')}M<br><i class="fas fa-clock"></i> ${worldHours.toString().padStart(2, '0')}:${worldMinutes.toString().padStart(2, '0')}`;
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

    // ハッシュから色を生成する関数
    generateColorFromHash(hash) {
        // ハッシュの最初の6文字を使用して16進数の色を生成
        const colorHex = '0x' + hash.substring(0, 6);
        return parseInt(colorHex, 16);
    }

    // 敵が倒された時の処理を更新
    handleEnemyDeath(position) {
        // アイテムの種類を確率に基づいて選択
        const items = Object.entries(GameConfig.ITEMS);
        const totalWeight = items.reduce((sum, [_, item]) => sum + item.dropChance, 0);
        let random = Math.random() * totalWeight;
        
        let selectedItem = null;
        for (const [type, item] of items) {
            random -= item.dropChance;
            if (random <= 0) {
                selectedItem = type;
                break;
            }
        }

        if (selectedItem) {
            this.spawnItem(selectedItem, position);
        }
    }

    spawnItem(itemType, position) {
        if (!itemType || !GameConfig.ITEMS[itemType]) {
            console.error('無効なアイテムタイプです:', itemType);
            return;
        }

        const item = new Item(itemType, position);
        this.scene.add(item.mesh);
        this.items.push(item);
    }

    getItemName(type) {
        return GameConfig.ITEMS[type]?.name || type;
    }

    getItemDescription(type) {
        return GameConfig.ITEMS[type]?.description || '';
    }

    updateInventoryDisplay() {
        const inventoryDiv = document.getElementById('inventory');
        inventoryDiv.innerHTML = '';
        
        this.inventory.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'inventory-item';
            
            const itemName = this.getItemName(item.type);
            const itemDesc = this.getItemDescription(item.type);
            
            itemDiv.innerHTML = `
                <div class="item-info">
                    <span class="item-name">${itemName}</span>
                    <span class="item-description">${itemDesc}</span>
                </div>
                <button onclick="game.useItem('${item.type}')">使用</button>
            `;
            
            inventoryDiv.appendChild(itemDiv);
        });
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
    this.enemies.forEach((enemy, enemyId) => {
        if (!enemy || !enemy.model) return;
        
        const distance = playerPosition.distanceTo(enemy.model.getPosition());
        
        // 視界内かどうかをチェック（カメラの視錐台内にいるか）
        const isInViewFrustum = this.isInViewFrustum(enemy.model.getPosition());
        
        if (distance > maxDistance || !isInViewFrustum) {
            // 最大距離を超えているか視界外の場合は非表示
            if (enemy.model.character) {
                enemy.model.character.visible = false;
            }
            
            // アニメーション更新もスキップするフラグを設定
            enemy.skipUpdate = true;
            
        } else if (distance > fadeStart) {
            // フェード開始距離を超えている場合は透明度を調整
            if (enemy.model.character) {
                enemy.model.character.visible = true;
                
                // キャラクター内の全てのメッシュの透明度を調整
                const opacity = 1 - ((distance - fadeStart) / (maxDistance - fadeStart));
                enemy.model.character.traverse(child => {
                    if (child.isMesh && child.material) {
                        child.material.transparent = true;
                        child.material.opacity = opacity;
                    }
                });
            }
            
            // 更新頻度を下げるフラグを設定（遠くの敵は毎フレーム更新しない）
            enemy.updatePriority = 'low';
            
        } else {
            // 通常表示（近い敵）
            if (enemy.model.character) {
                enemy.model.character.visible = true;
                
                // 透明度をリセット
                enemy.model.character.traverse(child => {
                    if (child.isMesh && child.material) {
                        if (child.material.opacity !== 1) {
                            child.material.opacity = 1;
                            child.material.transparent = false;
                        }
                    }
                });
            }
            
            // 通常更新
            enemy.skipUpdate = false;
            enemy.updatePriority = 'high';
        }
    });
}

// 視錐台判定を行うヘルパーメソッド
isInViewFrustum(position) {
    // 簡易的な視錐台判定（カメラの向きと位置からオブジェクトが視界内かを判定）
    const cameraDirection = new THREE.Vector3(0, 0, -1);
    cameraDirection.applyQuaternion(this.camera.quaternion);
    
    const toObject = new THREE.Vector3().subVectors(position, this.camera.position).normalize();
    const dot = toObject.dot(cameraDirection);
    
    // dot > 0.5 は約60度の視野角に相当
    return dot > 0.5;

        
        // アイテムの表示/非表示を更新
        this.items.forEach(item => {
            if (!item || !item.mesh) return;
            
            //item.update(deltaTime);
            const distance = playerPosition.distanceTo(item.mesh.position);
            
            if (distance > maxDistance) {
                // 最大距離を超えている場合は非表示
                item.mesh.visible = false;
                if (this.visibleObjects && this.visibleObjects.has(item.mesh)) {
                    this.visibleObjects.delete(item.mesh);
                }
            } else if (distance > fadeStart) {
                // フェード開始距離を超えている場合は透明度を調整
                const opacity = 1 - ((distance - fadeStart) / (maxDistance - fadeStart));
                if (item.mesh.material) {
                    item.mesh.material.opacity = opacity;
                    item.mesh.material.transparent = true;
                }
                item.mesh.visible = true;
                if (this.visibleObjects) {
                    this.visibleObjects.add(item.mesh);
                }
            } else {
                // 通常表示
                item.mesh.visible = true;
                if (item.mesh.material && item.mesh.material.opacity !== 1) {
                    item.mesh.material.opacity = 1;
                    item.mesh.material.transparent = false;
                }
                if (this.visibleObjects) {
                    this.visibleObjects.add(item.mesh);
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

    collectItem(itemType) {
        if (!itemType) {
            console.error('無効なアイテムタイプです:', itemType);
            return;
        }

        // アイテムをインベントリに追加
        this.inventory.push({
            id: Date.now() + Math.random(), // ユニークID
            type: itemType
        });
        
        // バックパックUIを更新
        this.updateBackpackUI();
        
        // アイテム数を更新
        this.updateItemCount();
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
                const isOnScreen = screenPosition.x >= 0 && screenPosition.x <= window.innerWidth &&
                                 screenPosition.y >= 0 && screenPosition.y <= window.innerHeight;

                if (isOnScreen) {
                    // 画面内の場合は通常のポップアップを表示
                    popup.style.left = `${screenPosition.x}px`;
                    popup.style.top = `${screenPosition.y}px`;
                    popup.style.display = 'block';
                } else {
                    // 画面外の場合はポップアップを非表示にしてインジケーターを表示
                    popup.style.display = 'none';
                    this.showMessageIndicator(playerId, screenPosition);
                }
            }
        });
    }

    
spawnEnemy(enemyData) {
    // EnhancedEnemy が定義されていない場合は従来の Enemy クラスを使用
    try {
        // 新しいクラスが利用可能ならそれを使用
        if (typeof EnhancedEnemy === 'function') {
            const enemy = new EnhancedEnemy(this.scene, enemyData, this);
            this.enemies.set(enemyData.id, enemy);
        } else {
            // 従来のクラスにフォールバック
            const enemy = new Enemy(this.scene, enemyData, this);
            this.enemies.set(enemyData.id, enemy);
        }
    } catch (e) {
        console.error("Error spawning enemy:", e);
        // エラーが発生した場合は従来のクラスを使用
        const enemy = new Enemy(this.scene, enemyData, this);
        this.enemies.set(enemyData.id, enemy);
    }
    
    this.updateEnemyCount();
}

    updateEnemy(enemyId, position) {
        const enemy = this.enemies.get(enemyId);
        if (enemy) {
            enemy.update({ position });
        }
    }

    spawnEnemyBullet(bulletData) {
        const bullet = new EnemyBullet(
            this.scene,
            new THREE.Vector3(bulletData.position.x, bulletData.position.y, bulletData.position.z),
            new THREE.Vector3(bulletData.direction.x, bulletData.direction.y, bulletData.direction.z),
            bulletData.speed
        );
        bullet.id = bulletData.id;
        this.enemyBullets.set(bulletData.id, bullet);
    }

    removeEnemyBullet(bulletId) {
        const bullet = this.enemyBullets.get(bulletId);
        if (bullet) {
            bullet.dispose();
            this.enemyBullets.delete(bulletId);
        }
    }

    // アイテム効果の表示を更新
    updateEffectsDisplay() {
        if (!this.effectsContainer) return;
        
        const effects = this.playerStatus.getCurrentEffects();
        //console.log(effects);
        // 効果がない場合はコンテナを非表示
        if (Object.keys(effects).length === 0) {
            this.effectsContainer.style.display = 'none';
            return;
        }
        
        // 効果がある場合はコンテナを表示
        this.effectsContainer.style.display = 'block';
        
        let html = '';
        
        for (const [effectId, effect] of Object.entries(effects)) {
            const remainingTime = Math.ceil(effect.remainingTime);
            const effectConfig = GameConfig.ITEMS[effect.type];
            if (effectConfig) {
                // 効果の詳細を取得
                const effectDetails = [];
                html += `
                    <div style="margin: 5px 0;">
                        <div style="color: #4CAF50; font-weight: bold;">[${effectConfig.name}]</div>
                        <div style="color: #4CAF50; font-weight: bold;">${effectConfig.description}</div>
                        <div style="color: #FFD700; margin-left: 5px;">${remainingTime}sec</div>
                    </div>
                `;
            }
        }
        
        this.effectsContainer.innerHTML = html;
    }

    handleEnemyKilled(enemyIds) {
        enemyIds.forEach(enemyId => {
            const enemy = this.enemies.get(enemyId);
            if (enemy) {
                // 音を再生
                this.audioManager.play('enemyDeath');
                enemy.die();
                this.enemies.delete(enemyId);
            }
        });
    }

    restart() {
        // 古いキャラクターを確実に削除
        //if (this.character) {
        //    this.scene.remove(this.character.mesh);
        //    this.character = null;
        //}

        // プレイヤーリストをクリア
        this.players.forEach(player => {
            if (player.mesh) {
                this.scene.remove(player.mesh);
            }
        });
        this.players.clear();

        // 敵リストをクリア
        this.enemies.forEach(enemy => {
            if (enemy.mesh) {
                this.scene.remove(enemy.mesh);
            }
        });
        this.enemies.clear();
/*
        // 弾丸リストをクリア
        this.bullets.forEach(bullet => {
            if (bullet.mesh) {
                this.scene.remove(bullet.mesh);
            }
        });
        this.bullets.clear();

        // アイテムリストをクリア
        this.items.forEach(item => {
            if (item.mesh) {
                this.scene.remove(item.mesh);
            }
        });
        this.items.clear();
*/
        // ゲームオーバー表示を非表示
        document.getElementById('gameOver').style.display = 'none';

        // 新しいキャラクターを作成
        //this.character = new Character(this.scene, this.fieldMap);
        //this.character.setPosition(0, 0, 0);

        // プレイヤーステータスをリセット
        this.playerStatus = new PlayerStatus();
        this.playerStatus.reset();

        // 敵を再生成
        this.spawnEnemies();

        // アイテムを再生成
        this.spawnItems();

        // ゲームループを再開
        this.isGameOver = false;
        this.animate();
    }

    // Twitterでシェアするメソッド
    shareToTwitter() {
        const survivalTime = Date.now() - this.playerSpawnTime;
        const gameDayLength = GameConfig.TIME.DAY_LENGTH;
        const survivalDays = Math.floor(survivalTime / (gameDayLength * 1000));
        const survivalHours = Math.floor((survivalTime % (gameDayLength * 1000)) / (gameDayLength * 1000 / 24));
        const survivalMinutes = Math.floor((survivalTime % (gameDayLength * 1000 / 24)) / (gameDayLength * 1000 / 24 / 60));
        
        const text = `I survived ${survivalDays}days,${survivalHours}hours,${survivalMinutes}minutes.\n #bivouac #survivalgame \n https://bivouac.onrender.com \n`;
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    }

    // シェアテキストをコピーするメソッド
    copyShareText() {
        const survivalTime = Date.now() - this.playerSpawnTime;
        const gameDayLength = GameConfig.TIME.DAY_LENGTH;
        const survivalDays = Math.floor(survivalTime / (gameDayLength * 1000));
        const survivalHours = Math.floor((survivalTime % (gameDayLength * 1000)) / (gameDayLength * 1000 / 24));
        const survivalMinutes = Math.floor((survivalTime % (gameDayLength * 1000 / 24)) / (gameDayLength * 1000 / 24 / 60));
        
        const text = `Bivouacで${survivalDays}日${survivalHours}時間${survivalMinutes}分生存しました！\nhttps://bivouac.onrender.com`;
        
        navigator.clipboard.writeText(text).then(() => {
            const copyMessage = document.getElementById('copyMessage');
            copyMessage.style.display = 'block';
            setTimeout(() => {
                copyMessage.style.display = 'none';
            }, 2000);
        });
    }

    getHeightAt(x, z) {
        const raycaster = new THREE.Raycaster();
        const down = new THREE.Vector3(0, -1, 0); // Ray direction (downward)
        raycaster.set(new THREE.Vector3(x, 100, z), down); // Start ray above the terrain

        //const intersects = raycaster.intersectObject(this.terrain);
        const intersects = this.fieldMap.getTerrain().intersectObject(this.terrain, true);
        if (intersects.length > 0) {
            return intersects[0].point.y; // Return the height of the terrain
        }
        return 0; // Default to ground level if no intersection
    }

    updatePlayerHeight(player) {
        const position = player.getPosition();
        const terrainHeight = this.getHeightAt(position.x, position.z);
        console.log('Terrain height:', terrainHeight);
        //const terrainHeight = this.fieldMap.getHeightAt(position.x, position.z);
        player.setPosition(position.x, terrainHeight, position.z);
    }

    updateItemHeight(item) {
        const position = item.position;
        const terrainHeight = this.getHeightAt(position.x, position.z);
        item.position.y = terrainHeight;
    }
}

// ゲームの開始
window.addEventListener('load', () => {
    window.game = new Game();
});