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
			//this.sounds[soundName].currentTime = 0;
			//this.sounds[soundName].play();
		}
	}
}

class Game {
	constructor() {
		this.bosses = [];
		this.bossesSpawned = false;
		this.devMode = true;

		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera(
			GameConfig.VISION.FOV,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		);
		// 視点モードを追加
		this.cameraMode = 'third'; // 'third', 'first', 'far' の3つのモード
		this.cameraOffsets = {
			third: { y: GameConfig.CAMERA.OFFSET_Y, z: GameConfig.CAMERA.OFFSET_Z },
			first: { y: 1.6, z: -0.5 }, // 一人称視点のオフセットを前方に調整
			far: { y: 15, z: 25 } // 遠距離視点のオフセット
		};

		// 視点切り替えボタンを追加
		this.setupCameraButton();
		this.renderer = new THREE.WebGLRenderer({
			canvas: document.getElementById('gameCanvas'),
			antialias: true
		});
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.shadowMap.enabled = true;
		console.log('GameConfig.ITEMS', GameConfig.ITEMS);


		this.setupJumpButton();
		this.setupMapButton();


		// モノクロ効果用のシェーダーを追加
		this.monochromeShader = {
			uniforms: {
				tDiffuse: {
					value: null
				},
				intensity: {
					value: 0.0
				}
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
		this.enemies = new Map(); // 敵を管理するMapを追加
		this.enemyBullets = new Map(); // 敵の弾丸を管理するマップを追加
		this.bullets = [];
		this.moveSpeed = GameConfig.PLAYER.MOVE_SPEED;
		this.rotationSpeed = GameConfig.PLAYER.ROTATION_SPEED;
		this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

		// プレイヤーモデル用の変数を追加
		this.playerModel = null; // プレイヤーモデルの初期化を遅延させる

		// 座標表示用の要素
		//this.coordinatesElement = document.getElementById('coordinates');

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
		// プレイヤー生成時間を記録
		this.playerSpawnTime = Date.now();
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
		this.items = []; // Mapから配列に戻す
		this.maxItems = GameConfig.ITEM.MAX_COUNT;
		this.inventory = []; // プレイヤーのインベントリ

		// UI要素の取得
		this.positionElement = document.getElementById('position');
		this.itemCountElement = document.getElementById('itemCount');
		this.warpButton = document.getElementById('warpButton');

		// バックパックUI要素
		this.backpackElement = document.getElementById('backpack');
		this.backpackItemsBody = document.getElementById('backpackItemsBody');
		this.emptyBackpackMessage = document.getElementById('emptyBackpack');
		this.backpackButton = document.getElementById('backpackButton');
		this.backpackCloseButton = document.getElementById('backpackClose');

		// バックパックボタンのイベントリスナー
		this.backpackButton.addEventListener('click', () => this.toggleBackpack());
		this.backpackCloseButton.addEventListener('click', () => this.toggleBackpack());
		this.warpButton.addEventListener('click', () => this.warpToRandomPlayer());

		// ステータス表示の更新
		this.updateStatusDisplay();

		this.setupControls();
		this.setupSocketEvents();

		// 電波塔の管理を追加（シーン初期化後に配置）
		//this.radioTowerManager = new RadioTowerManager(this.scene);



		// プレイヤーのハッシュ
		this.playerHash = null;

		console.log('GameConfig.ITEMS', GameConfig.ITEMS);

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

		// メッセージ表示用の要素を追加
		this.messageIndicators = new Map(); // メッセージインジケーターを管理
		this.createMessageIndicatorContainer();

		this.testCount = 0;
/*
		// WebSocketのメッセージハンドラを追加
		this.socket.onmessage = (event) => {
			const data = JSON.parse(event.data);
			console.log("data" + data);
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
*/
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


		// ゲーム開始時にランダムなアイテムを3つバックパックに入れる
		const itemTypes = Object.entries(GameConfig.ITEMS)
			.filter(([_, item]) => item.dropChance !== undefined)
			.map(([type]) => type);

			
		for (let i = 0; i < 2; i++) {
			const randomIndex = Math.floor(Math.random() * itemTypes.length);
			const selectedType = itemTypes[randomIndex];
			//console.log('selectedType', selectedType);
			if (selectedType) {
				this.inventory.push({
					id: Date.now() + i,
					type: selectedType
				});
			}
		}

		this.updateBackpackUI();
			
		// 電波塔の管理を追加
		//this.radioTowerManager = new RadioTowerManager(this.scene);

		// ページがアンロードされる時の処理
		window.addEventListener('beforeunload', () => {
			// サーバーに切断を通知
			if (this.socket) {
				this.socket.disconnect();
			}
		});
		this.animate();
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
			//console.log('メッセージを受信:', data);
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

	showBossEnemyPopup(bossId) {
		const boss = this.enemies.get(bossId);
		if (!boss) return;
		
		const bossPosition = boss.getPosition();
		this.showBossEnemyPopupForPlayer(bossId, bossPosition);
	}

	showBossEnemyPopupForPlayer(enemyId, position) {
		// 画面内かどうかをチェック
		const screenPosition = this.getScreenPosition(position);
		const isOnScreen = screenPosition.x >= 0 && screenPosition.x <= window.innerWidth &&
			screenPosition.y >= 0 && screenPosition.y <= window.innerHeight;

		if (isOnScreen) {
			// 画面内の場合は通常のポップアップを表示
			if (!this.messagePopups) {
				this.messagePopups = new Map();
			}

			if (this.messagePopups.has(enemyId)) {
				this.messagePopups.get(enemyId).remove();
				this.messagePopups.delete(enemyId);
			}

			const popup = document.createElement('div');
			popup.className = 'message-popup';
			popup.textContent = 'boss';
			document.body.appendChild(popup);

			this.messagePopups.set(enemyId, popup);

			popup.style.left = `${screenPosition.x}px`;
			popup.style.top = `${screenPosition.y}px`;


		} else {
			// 画面外の場合は方向インジケーターを表示
			this.showBossEnemyIndicator(enemyId, screenPosition);
		}
	}

	showBossEnemyIndicator(enemyId, screenPosition) {
		// 既存のインジケーターを削除
		if (this.messageIndicators.has(enemyId)) {
			this.messageIndicators.get(enemyId).remove();
			this.messageIndicators.delete(enemyId);
		}

		// 新しいインジケーターを作成
		const indicator = document.createElement('div');
		indicator.className = 'message-indicator';
		indicator.innerHTML = '<i class="fas fa-exclamation-circle"></i> boss';
		indicator.style.position = 'fixed';
		indicator.style.color = 'yellow';
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

		/*
		// 3秒後に削除
		setTimeout(() => {
			if (this.messageIndicators.has(enemyId)) {
				this.messageIndicators.get(enemyId).remove();
				this.messageIndicators.delete(enemyId);
			}
		}, 3000);
		*/
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
		//console.log('シード値:', seed);

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
		this.playerLight = new THREE.SpotLight(0xffffff, 2.0);
		this.playerLight.distance = 50;
		this.playerLight.angle = Math.PI / 4;
		this.playerLight.penumbra = 0.2;
		this.playerLight.decay = 1.5;

		this.playerLight.castShadow = true;
		this.playerLight.shadow.mapSize.width = 512;
		this.playerLight.shadow.mapSize.height = 512;
		this.playerLight.shadow.camera.near = 0.5;
		this.playerLight.shadow.camera.far = 50;

		this.playerLightTarget = new THREE.Object3D();
		this.scene.add(this.playerLightTarget);
		this.playerLight.target = this.playerLightTarget;

		// 霧の追加
		this.scene.fog = new THREE.FogExp2(0xcccccc, GameConfig.FOG.DENSITY);

		// シード値を使用してフィールドマップを作成
		if (!seed) {
			console.error('シード値が設定されていません');
			return;
		}

		// シード値を使用してフィールドマップを初期化
		this.fieldMap = new FieldMap(this.scene, seed);
		
		// フィールドマップの初期化が完了するまで待機
		this.fieldMap.initialize().then(() => {
			// フィールドマップの初期化が完了した後にアイテムを生成
			this.spawnItems();
		});

		this.updateLightDirection();

		// カメラの初期位置（プレイヤーの背後）
		this.updateCameraPosition();

		// 時間の初期化
		this.updateTimeOfDay();

		this.weather = new Weather(this.scene, this.camera);
	}

	updateLightDirection() {

		if (!this.fieldMap || !this.fieldMap.terrainGeometry) {
			//console.warn('FieldMap または terrainGeometry が初期化されていません');
			return;
		}

		// directionalLight が存在するか確認
		const directionalLight = this.sunLight || this.scene.children.find(obj => obj.isDirectionalLight);
		if (!directionalLight) {
			//console.warn('DirectionalLight が見つかりません');
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
		if (this.playerModel) {
			this.scene.remove(this.playerModel.character);
			this.playerModel.dispose();
		}

		// Create new character using the Character class
		this.playerModel = new Character(this.scene, "player", this);

		// Set player color if available from hash
		if (this.playerHash) {
			const color = this.generateColorFromHash(this.playerHash);
			this.playerModel.setColor(color);
			console.log("color" + color);
		}

		// 初期位置は(0,0,0)に設定し、後でcurrentPlayersイベントで正しい位置に設定される
		this.playerModel.setPosition(100, 0, 100);

		// Get initial position from server
		const serverPosition = this.playerModel.getPosition();

		// Check if this position is safe (not colliding with buildings)
		if (this.fieldMap && this.fieldMap.checkCollision(new THREE.Vector3(
				serverPosition.x, serverPosition.y, serverPosition.z), 2)) {

			// Find a safe spawn position
			const safePosition2 = this.getNearbyPlayerPosition();
			this.playerModel.setPosition(safePosition2.x, safePosition2.y, safePosition2.z);

			// Immediately notify server of the corrected position
			this.socket.emit('playerMove', {
				position: this.playerModel.getPosition(),
				rotation: {
					y: this.playerModel.getRotation().y
				},
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
		}, {
			passive: false
		});

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
		}, {
			passive: false
		});

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
		}, {
			passive: false
		});

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

			// If player model already exists, update its color based on hash
			if (this.playerModel && this.playerHash) {
				const color = this.generateColorFromHash(this.playerHash);
				this.playerModel.setColor(color);
			}
		});

		this.socket.on('currentPlayers', (players) => {
			//console.log('現在のプレイヤー:', players);

			// 自分の初期位置を設定
			const myPlayerData = players.find(player => player.id === this.socket.id);
			if (myPlayerData && this.playerModel) {
				// サーバーから送られてきた位置を設定
				this.playerModel.setPosition(
					myPlayerData.position.x,
					myPlayerData.position.y,
					myPlayerData.position.z
				);
				this.playerModel.setRotation(myPlayerData.rotation.y);

				// カメラ位置も更新
				this.updateCameraPosition();
			}

			// 既存のプレイヤーをすべて削除（自分自身を除く）
			this.players.forEach((player, playerId) => {
				if (playerId !== this.socket.id) {
					if (player.character) {
						this.scene.remove(player.character);
						player.dispose();
					}
				}
			});
			this.players.clear();

			// 新しいプレイヤーリストを追加（自分自身を除く）
			players.forEach(player => {
				if (player.id !== this.socket.id) {
					this.addPlayer(player);
				}
			});
			this.updatePlayerCount();
		});

		this.socket.on('newPlayer', (player) => {
			//console.log('新規のプレイヤー:', player);
			this.addPlayer(player);
			this.updatePlayerCount();
		});

		this.socket.on('playerDisconnected', (playerId) => {
			//console.log('プレイヤーが切断しました:', playerId);
			this.removePlayer(playerId);
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
				data.position.y,
				data.position.z //前方に少しずらす
			);

			const bullet = this.createBullet(position, direction, data.playerId, data.weponId);
			this.bullets.push(bullet);
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

		// 現在の敵の情報を受信
		this.socket.on('currentEnemies', (enemies) => {
			enemies.forEach(enemy => this.spawnEnemy(enemy));
		});

		this.socket.on('enemySpawned', (enemy) => {
			//console.log("enemySpawned" + enemy);
			this.spawnEnemy(enemy);
		});


		this.socket.on('enemyBulletSpawn', (bullet) => {
			
			this.spawnEnemyBullet(bullet);
		});




		this.socket.on('enemiesKilled', (enemyIds) => {
			enemyIds.forEach(enemyId => {
				const enemy = this.enemies.get(enemyId);
				if (enemy) {
					// 音を再生
					//this.audioManager.play('enemyDeath');
					enemy.forceDie();
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
		// プレイヤーがすでに存在する場合は何もしない
		if (this.players.has(playerData.id)) {
			console.log('プレイヤーはすでに存在します:', playerData.id);
			return;
		}

		// 他のプレイヤーを追加
		const character = new Character(this.scene, "player", this);
		character.setPosition(
			playerData.position.x,
			playerData.position.y,
			playerData.position.z
		);
		character.setRotation(playerData.rotation.y);

		// プレイヤーの色を設定 - ハッシュがあればハッシュから生成、なければサーバーから直接colorを使用
		if (playerData.hash) {
			const color = this.generateColorFromHash(playerData.hash);
			character.setColor(color);
		} else if (playerData.color) {
			// サーバーから送られてきた色をそのまま使用
			character.setColor(playerData.color);
		}

		this.scene.add(character.character);
		this.players.set(playerData.id, character);
		this.updatePlayerCount();
	}

	removePlayer(playerId) {
		const player = this.players.get(playerId);
		if (player) {
			if (player.character) {
				this.scene.remove(player.character);
			}
			player.dispose();
			this.players.delete(playerId);
			this.updatePlayerCount();
		}
	}

	shoot() {
		// 発射間隔チェック
		const now = Date.now();
		let shootInterval = 800; // デフォルトの間隔
		var aa = this.playerStatus.getCurrentWeponType();
		//console.log('aa', aa[aa.length - 1]);	

		const weaponId = aa[aa.length - 1] || 'bullet001';
		const shootPosition = this.playerModel.getPosition().clone();
		shootPosition.y += 1.1; // 発射位置を少し上げる
		// 武器タイプに応じた発射間隔を設定
		switch (weaponId) {
			case 'lasergun':
				shootInterval = 500; // 0.5秒
				break;
			case 'grenadelauncher':
				shootInterval = 2000; // 2秒
				break;
			case 'flamethrower':
				shootInterval = 100; // 0.1秒
				break;
			case 'plasmacannon':
				shootInterval = 1500; // 1.5秒
				break;
			case 'missilelauncher':
				shootInterval = 2500; // 2.5秒
				break;
			case 'shotgun':
				shootInterval = 1800; // 1.8秒
				break;
			case 'magnum':
				shootInterval = 1800; // 1.8秒
				break;
			case 'sniperrifle':
				shootInterval = 1800; // 1.8秒
				break;
			case 'rocketlauncher':
				shootInterval = 1800; // 1.8秒
				break;
			case 'machinegun':
				shootInterval = 100; // 0.1秒
				break;
			default:
				shootInterval = 800; // デフォルトは0.8秒
				break;
		}

		if (now - this.lastShootTime < shootInterval) {
			return;
		}

		// クールダウン中は発射できない
		if (!this.canShoot) {
			return;
		}




		// プレイヤーの向きを取得
		const direction = new THREE.Vector3(0, 0, -1);
		direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.playerModel.getRotation().y);

		// 武器タイプに応じた発射パターン
		switch (weaponId) {
			case 'lasergun':
				// レーザーガン：3発連続発射
				for (let i = 0; i < 3; i++) {
					const bullet = this.createBullet(shootPosition, direction, this.socket.id, weaponId);
					this.bullets.push(bullet);
				}
				break;

			case 'grenadelauncher':
				// グレネードランチャー：爆発性の弾
				const grenade = this.createBullet(shootPosition, direction, this.socket.id, weaponId);
				grenade.explosionRadius = 5;
				grenade.explosionDamage = 30;
				this.bullets.push(grenade);
				break;

			case 'flamethrower':
				// フレイムスローワー：広範囲に広がる炎
				for (let i = -2; i <= 2; i++) {
					const spreadDirection = direction.clone();
					spreadDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), i * 0.2);
					const bullet = this.createBullet(shootPosition, spreadDirection, this.socket.id, weaponId);
					this.bullets.push(bullet);
				}
				break;

			case 'plasmacannon':
				// プラズマキャノン：チェーンライトニング効果
				const plasma = this.createBullet(shootPosition, direction, this.socket.id, weaponId);
				plasma.chainLightning = true;
				plasma.chainRange = 5;
				plasma.chainDamage = 15;
				this.bullets.push(plasma);
				break;

			case 'missilelauncher':
				// ミサイルランチャー：追尾ミサイル
				const missile = this.createBullet(shootPosition, direction, this.socket.id, weaponId);
				missile.homing = true;
				missile.homingRange = 20;
				missile.homingSpeed = 0.1;
				this.bullets.push(missile);
				break;

			case 'shotgun':
				// ショットガン：広範囲に広がる弾
				for (let i = -1; i <= 1; i++) {
					const spreadDirection = direction.clone();
					spreadDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), i * 0.2);
					const bullet = this.createBullet(shootPosition, spreadDirection, this.socket.id, weaponId);
					this.bullets.push(bullet);
				}
				break;

			case 'machinegun':
				// マシンガン：5発連続発射
				for (let i = 0; i < 5; i++) {
					const bullet = this.createBullet(shootPosition, direction, this.socket.id, weaponId);
					this.bullets.push(bullet);
				}
				break;

			default:
				// デフォルト武器：通常の弾
				const bullet = this.createBullet(shootPosition, direction, this.socket.id, weaponId);
				this.bullets.push(bullet);
				break;
		}
		// サーバーに発射情報を送信
		this.socket.emit('shoot', {
			position: shootPosition,
			direction: direction,
			weponId: weaponId,
			bulletDamage: this.bullets[this.bullets.length - 1].getDamage()
		});

		// 最後の発射時間を更新
		this.lastShootTime = Date.now();
	}

	updateBullets(deltaTime) {
		for (let i = this.bullets.length - 1; i >= 0; i--) {
			const bullet = this.bullets[i];
			if (!bullet.update(deltaTime)) {
				// 弾が寿命を迎えた場合
				this.scene.remove(bullet.model);
				this.bullets.splice(i, 1);
				continue;
			}

			// 敵との当たり判定
			for (const [enemyId, enemy] of this.enemies) {
				if (enemy && enemy.health > 0) {
					const distance = bullet.model.position.distanceTo(enemy.model.position);
					if (distance < 2) { // 当たり判定の距離
						// 衝突エフェクトを表示
						bullet.createImpactEffect(bullet.model.position);
						
						// 敵にダメージを与える
						enemy.takeDamage(bullet.getDamage());
						// 弾を削除
						this.scene.remove(bullet.model);
						this.bullets.splice(i, 1);
						// 敵が死亡した場合の処理
						if (enemy.health <= 0) {
							this.socket.emit('enemyDied', enemyId);
							this.handleEnemyDeath(enemyId);
						}
						break;
					}
				}
			}

			// 爆発性の弾の処理
			if (bullet.explosionRadius && bullet.getAge() >= bullet.lifetime) {
				this.createExplosion(bullet.model.position, bullet.explosionRadius, bullet.explosionDamage);
				this.scene.remove(bullet.model);
				this.bullets.splice(i, 1);
				continue;
			}

			// チェーンライトニングの処理
			if (bullet.chainLightning) {
				const nearbyEnemies = this.getNearbyEnemies(bullet.model.position, bullet.chainRange);
				for (const enemy of nearbyEnemies) {
					enemy.takeDamage(bullet.chainDamage);
					this.createLightningEffect(bullet.model.position, enemy.model.position);
				}
			}

			// 追尾ミサイルの処理
			if (bullet.homing) {
				const target = this.findNearestEnemy(bullet.model.position, bullet.homingRange);
				if (target) {
					const targetDirection = target.model.position.clone().sub(bullet.model.position).normalize();
					bullet.direction.lerp(targetDirection, bullet.homingSpeed);
				}
			}
		}
	}

	createBullet(position, direction, playerId, weaponId) {
		const bullet = new Bullet(this.scene, position, direction, playerId, weaponId);
		return bullet;
	}

	updatePlayer(deltaTime) {
		// playerModelが存在しない場合は処理をスキップ
		if (!this.playerModel) return;

		if (this.isGameOver) return;

		let moveX = 0;
		let moveZ = 0;
		let rotateY = 0;
		let isRunning = false;
		let isMoving = false;

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

		if (this.keys['w']) moveZ = -this.moveSpeed;
		if (this.keys['s']) moveZ = this.moveSpeed;
		if (this.keys['a']) rotateY = this.rotationSpeed; // 方向を反転
		if (this.keys['d']) rotateY = -this.rotationSpeed; // 方向を反転
		//if (this.keys[' ']) this.shoot(); // スペースキーで発射
		if (this.keys['shift']) isRunning = true;


		// 移動中かどうかを判定
		if (this.keys['w'] || this.keys['s']) {
			isMoving = true;
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
		this.playerModel.move(moveDirection, isRunning ? moveSpeed2 * 2 : moveSpeed2, deltaTime);
		this.playerModel.setRunning(isRunning);

		// 移動後の位置を取得
		const newPosition = this.playerModel.getPosition();

		/*
		// レイキャストを使用して地面の高さを取得
		const raycaster = new THREE.Raycaster();
		const down = new THREE.Vector3(0, -1, 0);
		raycaster.set(new THREE.Vector3(newPosition.x, 100, newPosition.z), down);
*/
		// フィールドマップの地形ジオメトリを取得
		let terrainObject = null;
		if (this.fieldMap && this.fieldMap.terrainGeometry) {
			terrainObject = this.fieldMap.terrainGeometry;
		} else {
			// フィールドマップが初期化されていない場合は、シーン内の地形オブジェクトを探す
			this.scene.traverse((object) => {
				if (object.userData && object.userData.type === 'terrain') {
					terrainObject = object;
				}
			});
		}

		if (terrainObject) {
			const intersects = raycaster.intersectObject(terrainObject, true);
			if (intersects.length > 0) {
				// 地面の高さを取得し、プレイヤーの高さを調整
				const groundHeight = intersects[0].point.y;
				newPosition.y = groundHeight + 1.0; // 地面から1.0ユニット上に配置
			}
		}

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
			// 新しい位置を設定（地面の高さを含む）
			this.playerModel.setPosition(newPosition.x, newPosition.y, newPosition.z);

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

		//this.updatePlayerLight();
		// サーバーに位置情報を送信
		this.socket.emit('playerMove', {
			position: this.playerModel.getPosition(),
			rotation: {
				y: this.playerModel.getRotation().y
			},
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
			//this.coordinatesElement.textContent = `座標: X: ${x} Y: ${y} Z: ${z}`;
		}
	}

	updateCameraPosition() {
		if (!this.playerModel) return;

		// プレイヤーの位置を取得
		const playerPosition = this.playerModel.getPosition();
		const playerRotation = this.playerModel.getRotation().y;

		// 現在の視点モードに応じたオフセットを取得
		const offset = this.cameraOffsets[this.cameraMode];

		// カメラの位置を計算
		const cameraPosition = new THREE.Vector3();
		cameraPosition.copy(playerPosition);

		// 視点モードに応じてカメラの位置と向きを調整
		switch (this.cameraMode) {
			case 'first':
				// 一人称視点
				const firstPersonOffset = new THREE.Vector3(0, offset.y, offset.z);
				firstPersonOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), playerRotation);
				cameraPosition.add(firstPersonOffset);
				this.camera.position.copy(cameraPosition);
				// プレイヤーの向きに合わせてカメラを回転（水平回転のみ）
				this.camera.rotation.set(0, playerRotation, 0);
				break;

			case 'far':
				// 遠距離視点
				const farOffset = new THREE.Vector3(0, offset.y, offset.z);
				farOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), playerRotation);
				cameraPosition.add(farOffset);
				this.camera.position.copy(cameraPosition);
				// プレイヤーを見る
				this.camera.lookAt(playerPosition);
				break;

			default:
				// 通常の三人称視点
				const thirdPersonOffset = new THREE.Vector3(0, offset.y, offset.z);
				thirdPersonOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), playerRotation);
				cameraPosition.add(thirdPersonOffset);
				this.camera.position.copy(cameraPosition);
				this.camera.lookAt(playerPosition);
				break;
		}
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
		//console.log("enemy count = " + this.enemies.length);
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
				(Math.random() - 0.5) * 5, // -5から5の範囲でランダム
				0,
				(Math.random() - 0.5) * 5 // -5から5の範囲でランダム
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

			switch (section) {
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
		//this.audioManager.play('restart');
		this.currentHealth = this.maxHealth;
		this.playerStatus.reset(); // プレイヤーステータスを完全にリセット
		this.isGameOver = false;
		this.gameOverElement.style.display = 'none';
		this.playerSpawnTime = Date.now();
		// ランダムなリスポーンポイントを探す
		const safePosition = this.findSafeRespawnPosition();
		this.playerModel.setPosition(safePosition.x, safePosition.y, safePosition.z);
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
			const terrainHeight = this.getHeightAt(newPosition.x, newPosition.z);
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
		const terrainHeight = this.getHeightAt(selectedLocation.x, selectedLocation.z);
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
		// アニメーションループを継続
		requestAnimationFrame(() => this.animate());

		// ゲームオーバーの場合は更新をスキップ
		if (this.isGameOver) {
			return;
		}

		const currentTime = performance.now();
		const deltaTime = (currentTime - this.lastTime) / 1000;
		this.lastTime = currentTime;

		// すべてのキャラクターの高さを更新
		this.updateAllCharactersHeight();

		// プレイヤーの更新
		this.updatePlayer(deltaTime);
		// オブジェクトの表示/非表示を更新
		this.updateObjectVisibility();

		// 地形チャンクの表示/非表示を更新
		if (this.fieldMap && this.playerModel) {
			this.fieldMap.updateTerrainVisibility(this.playerModel.getPosition());
			this.fieldMap.updateObjectsVisibility(this.playerModel.getPosition());
		}

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

		// ボスの位置表示を更新
		this.updateBossIndicators();

		// プレイヤーモデルのアニメーション更新
		if (this.playerModel) {
			this.playerModel.updateLimbAnimation(deltaTime);
			this.playerModel.updateLimbAnimation(deltaTime);
			this.playerModel.updateLimbAnimation(deltaTime);
			this.playerModel.updateLimbAnimation(deltaTime);
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
		if (this.isGameOver) {
			console.log('Game is over, skipping update');
			return;
		}
		this.canShoot = true;
		// プレイヤーの位置に基づいてバイオーム名を表示
		const biome = this.fieldMap.getBiomeAt(this.playerModel.position.x, this.playerModel.position.z);

		// 敵の表示/非表示を更新
		var a = 0;
		this.enemies.forEach(enemy => {
			// スキップフラグがある場合は更新しない
			if (enemy.skipUpdate) return;

			// プレイヤーとの距離を計算
			const playerPosition = this.playerModel.getPosition();
			const enemyPosition = enemy.model.getPosition();
			const distance = playerPosition.distanceTo(enemyPosition);

			// 視認距離を超えている場合は非表示にする
			if (distance > GameConfig.MAP.VISIBLE_DISTANCE) {
				enemy.model.character.visible = false;
				return;
			} else {
				enemy.model.character.visible = true;
			}

			// 更新優先度が低い敵は3フレームに1回だけ更新
			if (enemy.updatePriority === 'low' && this.frameCount % 3 !== 0) return;

			// アニメーションの更新
			enemy.model.updateLimbAnimation(deltaTime);
			a++;
		});
		//console.log(`Updated ${a} enemies, frameCount: ${this.frameCount}, deltaTime: ${deltaTime}`);

		this.updateLightDirection();

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

		// 弾丸の更新を追加
		this.updateBullets(deltaTime);
		this.updateEnemyBullets(deltaTime); // 敵の弾丸の更新を追加

		// 敵の表示/非表示を更新
		//itemの更新
		this.items.forEach(item => {
			item.update(deltaTime);
		});

		// アイテム効果の表示を更新
		this.updateEffectsDisplay();

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
				//console.log("自動射撃");
				if (this.playerModel) {
					this.playerModel.startShooting();
				}
				this.shoot();
			}
		}

		/*
		    // 電波塔の更新
		    if (this.playerModel) {
		        this.radioTowerManager.update(this.playerModel.getPosition());
		    }*/

	}

	updateStatusDisplay() {
		// プレイヤーステータスのUIを更新
		this.playerStatus.updateUI();
	}

	spawnItems() {
		// フィールドマップが初期化されていない場合は処理をスキップ
		if (!this.fieldMap || !this.fieldMap.isInitialized) {
			console.warn('フィールドマップが初期化されていません');
			return;
		}

		// 建物の位置を取得
		const buildings = this.fieldMap.objects.filter(obj => obj.userData && obj.userData.type === 'building');

		// アイテムを生成
		for (let i = 0; i < this.maxItems; i++) {
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
		const COLLECTION_DISTANCE = 3.0;

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
		if (itemConfig.effects ?.immediate) {
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
		if (itemConfig.effects ?.duration) {
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

		// Itemクラスのインスタンスを作成
		const droppedItem = new Item(item.type, dropPosition);
		this.scene.add(droppedItem.mesh);
		this.items.push(droppedItem);

		// アイテムをインベントリから削除
		this.inventory.splice(itemIndex, 1);

		// バックパックUIを更新
		this.updateBackpackUI();
	}

	getItemColor(type) {
		return GameConfig.ITEMS[type] ?.color || 0xffffff;
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
		const gameTime = this.gameTime;
		const dayLength = GameConfig.TIME.DAY_LENGTH;
		const timeOfDay = (gameTime % dayLength) / dayLength;

		// 夜の時間帯を判定（0.7から0.3の間を夜とする）
		const isNight = timeOfDay > 0.7 || timeOfDay < 0.3;

		// 夜になった時にサーバーに通知
		if (isNight && !this.bossesSpawned) {
			this.socket.emit('requestBossSpawn');
			this.bossesSpawned = true;
		} else if (!isNight) {
			this.bossesSpawned = false;
		}

		// ボスの位置表示を更新
		if (isNight) {
			this.updateBossIndicators();
		}

		// 既存の時間更新処理
		this.updateSunPosition();
		this.updateSkyColor();
		this.updateFogColor();
		this.updateTimeDisplay();
	}

	updateBossIndicators() {
		if (!this.playerModel) return;

		const playerPosition = this.playerModel.getPosition();
		let nearestBoss = null;
		let minDistance = Infinity;

		// 最も近いボスを探す（サーバーから受け取った位置情報を使用）
		this.enemies.forEach((enemy, id) => {
			if (enemy.type === 'boss') {
				// サーバーから受け取った位置情報を使用
				const bossPosition = new THREE.Vector3(
					enemy.position.x,
					enemy.position.y,
					enemy.position.z
				);
				const distance = playerPosition.distanceTo(bossPosition);
				if (distance < minDistance) {
					minDistance = distance;
					nearestBoss = {
						position: bossPosition,
						distance: distance
					};
				}
			}
		});

		// 最も近いボスの方向と距離を表示
		if (nearestBoss) {
			const distance = Math.floor(nearestBoss.distance);
			const direction = new THREE.Vector3()
				.subVectors(nearestBoss.position, playerPosition)
				.normalize();

			// プレイヤーの向きを考慮した角度を計算
			const playerAngle = this.playerModel.rotation.y;
			const bossAngle = Math.atan2(direction.x, direction.z);
			const relativeAngle = bossAngle - playerAngle;

			// 画面の中心からの相対位置を計算
			const screenCenterX = window.innerWidth / 2;
			const screenCenterY = window.innerHeight / 2;
			const indicatorDistance = Math.min(window.innerWidth, window.innerHeight) * 0.4;
			
			// 角度に基づいて画面端の位置を計算
			const screenX = screenCenterX + Math.sin(relativeAngle) * indicatorDistance;
			const screenY = screenCenterY - Math.cos(relativeAngle) * indicatorDistance;

			// 画面の端に配置
			const edgeMargin = 20;
			let left = screenX;
			let top = screenY;

			// 画面外の位置を調整
			if (left < 0) left = edgeMargin;
			if (left > window.innerWidth) left = window.innerWidth - edgeMargin;
			if (top < 0) top = edgeMargin;
			if (top > window.innerHeight) top = window.innerHeight - edgeMargin;

			// インジケーターを作成または更新
			if (!this.messageIndicators) {
				this.messageIndicators = new Map();
			}

			// 既存のインジケーターを削除
			if (this.messageIndicators.has('boss')) {
				this.messageIndicators.get('boss').remove();
				this.messageIndicators.delete('boss');
			}

			// 新しいインジケーターを作成
			const indicator = document.createElement('div');
			indicator.className = 'message-indicator';
			indicator.innerHTML = `<i class="fas fa-crown"></i> ボスまでの距離: ${distance}m`;
			indicator.style.position = 'fixed';
			indicator.style.color = 'red';
			indicator.style.fontSize = '20px';
			indicator.style.pointerEvents = 'none';
			indicator.style.zIndex = '1000';
			indicator.style.left = `${left}px`;
			indicator.style.top = `${top}px`;

			// インジケーターを追加
			if (!document.getElementById('messageIndicators')) {
				const container = document.createElement('div');
				container.id = 'messageIndicators';
				document.body.appendChild(container);
			}
			document.getElementById('messageIndicators').appendChild(indicator);
			this.messageIndicators.set('boss', indicator);

			// 3秒後に削除
			setTimeout(() => {
				if (this.messageIndicators.has('boss')) {
					this.messageIndicators.get('boss').remove();
					this.messageIndicators.delete('boss');
				}
			}, 3000);
		}
	}

	spawnBosses() {
		// 既存のボスを削除
		this.bosses.forEach(boss => {
			if (boss.mesh) {
				this.scene.remove(boss.mesh);
			}
		});
		this.bosses = [];

		// 3体のボスを生成
		for (let i = 0; i < 3; i++) {
			const position = this.getRandomBossSpawnPosition();
			const bossData = {
				type: 'boss',
				position: position,
				rotation: { x: 0, y: Math.random() * Math.PI * 2, z: 0 }, // ランダムな回転を追加
				id: `boss_${Date.now()}_${i}`
			};
			this.spawnEnemy(bossData);
			this.bosses.push(bossData);
		}
	}

	getRandomBossSpawnPosition() {
		const mapSize = GameConfig.MAP.SIZE;
		const halfSize = mapSize / 2;
		const minDistance = 100; // プレイヤーからの最小距離

		let position;
		let attempts = 0;
		const maxAttempts = 50;

		do {
			position = new THREE.Vector3(
				(Math.random() - 0.5) * (mapSize - minDistance * 2),
				0,
				(Math.random() - 0.5) * (mapSize - minDistance * 2)
			);

			// マップの境界からminDistance以上離れていることを確認
			if (Math.abs(position.x) > halfSize - minDistance || 
				Math.abs(position.z) > halfSize - minDistance) {
				attempts++;
				continue;
			}

			// プレイヤーからの距離をチェック
			const distanceToPlayer = position.distanceTo(this.playerModel.getPosition());
			if (distanceToPlayer < minDistance) {
				attempts++;
				continue;
			}

			// 高さを設定
			position.y = this.getHeightAt(position.x, position.z);
			return position;

		} while (attempts < maxAttempts);

		// デフォルトの位置を返す
		return new THREE.Vector3(0, 0, 0);
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
			//this.updatePlayerLight();
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
	handleEnemyDeath(enemyId) {
		const enemy = this.enemies.get(enemyId);
		if (!enemy || !enemy.model) return;

		const position = enemy.model.getPosition();
		if (!position) return;
		
		// 10%の確率でアイテムをスポーン
		if (Math.random() < 0.2) {
			// GameConfig.ITEMSからランダムにアイテムタイプを選択
			const itemTypes = Object.entries(GameConfig.ITEMS)
				.filter(([_, item]) => item.dropChance !== undefined)
				.map(([type]) => type);
			
			const selectedType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
			
			// アイテムを生成（地面の高さを考慮）
			const terrainHeight = this.getHeightAt(position.x, position.z);
			const itemPosition = new THREE.Vector3(
				position.x,
				terrainHeight + 0.5,
				position.z
			);
			this.spawnItem(selectedType, itemPosition);
		}
	}

	spawnItem(itemType, position) {
		if (this.items.length >= this.maxItems) return;

		const item = new Item(this.scene, itemType, position);
		this.items.push(item);
	}

	getItemName(type) {
		return GameConfig.ITEMS[type] ?.name || type;
	}

	getItemDescription(type) {
		return GameConfig.ITEMS[type] ?.description || '';
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
		const maxDistance = GameConfig.MAP.VISLBLE_DISTANCE; // 変更：VISION.MAX_DISTANCEからMAP.VISLBLE_DISTANCEに
		const fadeStart = maxDistance * 0.8; // 変更：フェード開始距離をmaxDistanceの80%に設定

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
					if (object instanceof THREE.Object3D) {
						object.traverse(child => {
							if (child.isMesh && child.material) {
								child.material.opacity = opacity;
								child.material.transparent = true;
							}
						});
					}
					object.visible = true;
					if (this.visibleObjects) {
						this.visibleObjects.add(object);
					}
				} else {
					// 通常表示
					object.visible = true;
					if (object instanceof THREE.Object3D) {
						object.traverse(child => {
							if (child.isMesh && child.material) {
								child.material.opacity = 1;
								child.material.transparent = false;
							}
						});
					}
					if (this.visibleObjects) {
						this.visibleObjects.add(object);
					}
				}
			});
		}
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
					if (object instanceof THREE.Object3D) {
						object.traverse(child => {
							if (child.isMesh && child.material) {
								child.material.opacity = opacity;
								child.material.transparent = true;
							}
						});
					}
					object.visible = true;
					if (this.visibleObjects) {
						this.visibleObjects.add(object);
					}
				} else {
					// 通常表示
					object.visible = true;
					if (object instanceof THREE.Object3D) {
						object.traverse(child => {
							if (child.isMesh && child.material) {
								child.material.opacity = 1;
								child.material.transparent = false;
							}
						});
					}
					if (this.visibleObjects) {
						this.visibleObjects.add(object);
					}
				}
			});
		}
	}
	
	    // 敵の弾丸を更新するメソッド
	    updateEnemyBullets(deltaTime) {
	        // 敵の弾丸の更新
	        for (const [bulletId, bullet] of this.enemyBullets) {
	            // 弾丸の位置を更新
	            const result = bullet.update(deltaTime);
	            
	            // 弾丸が寿命を迎えた場合
	            if (!result) {
	                this.removeEnemyBullet(bulletId);
	                continue;
	            }

	            // プレイヤーとの衝突判定
	            const playerPosition = this.playerModel.getPosition();
	            if (bullet.checkCollision(playerPosition, GameConfig.PLAYER.COLLISION_RADIUS)) {
	                this.takeDamage(bullet.damage);
	                this.removeEnemyBullet(bulletId);
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
		const enemy = new EnhancedEnemy(this.scene, enemyData, this);
		this.enemies.set(enemyData.id, enemy);

		this.updateEnemyCount();
	}

	updateEnemy(enemyId, position) {
		const enemy = this.enemies.get(enemyId);
		if (enemy) {
			enemy.update({
				position
			});
		}
	}

	spawnEnemyBullet(bulletData) {

		//console.log("spawnEnemyBullet");

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
		if (this.playerModel) {
			this.scene.remove(this.playerModel.mesh);
			this.playerModel = null;
		}

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

		// アイテムリストをクリア
		this.items.forEach(item => {
			if (item.mesh) {
				this.scene.remove(item.mesh);
			}
		});
		this.items = [];

		// ゲーム状態をリセット
		this.currentHealth = this.maxHealth;
		this.playerStatus.reset();
		this.isGameOver = false;
		this.gameOverElement.style.display = 'none';
		this.playerSpawnTime = Date.now();
		this.lastTime = performance.now();
		this.frameCount = 0;

		// モノクロ効果をリセット
		if (this.monochromePass) {
			this.monochromePass.uniforms.intensity.value = 0.0;
		}

		// ランダムなリスポーンポイントを探す
		const safePosition = this.findSafeRespawnPosition();
		
		// 新しいプレイヤーモデルを作成
		this.createPlayerModel();
		if (this.playerModel) {
			this.playerModel.setPosition(safePosition.x, safePosition.y, safePosition.z);
		}

		// サーバーにリスタートを通知
		this.socket.emit('playerRestart');

		// アニメーションループを再開
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
		this.testCount++;
		// レイキャストを使用して高さを取得
		const raycaster = new THREE.Raycaster();
		const down = new THREE.Vector3(0, -1, 0);
		// 開始位置をより高く設定
		raycaster.set(new THREE.Vector3(x, 200, z), down);

		// フィールドマップの地形チャンクを取得
		let terrainObject = null;
		if (this.fieldMap && this.fieldMap.terrainChunks && this.fieldMap.terrainChunks.length > 0) {
			//console.log('Terrain chunks available:', this.fieldMap.terrainChunks.length);
			// 最も近いチャンクを探す
			let closestChunk = null;
			let minDistance = Infinity;

			for (const chunk of this.fieldMap.terrainChunks) {
				if (!chunk || !chunk.mesh) {
					//console.log('Invalid chunk found');
					continue;
				}

				const dx = x - chunk.mesh.position.x;
				const dz = z - chunk.mesh.position.z;
				const distance = Math.sqrt(dx * dx + dz * dz);
				
				if (distance < minDistance) {
					minDistance = distance;
					closestChunk = chunk;
				}
			}

			if (closestChunk) {
				//console.log('Found closest chunk at distance:', minDistance);
				terrainObject = closestChunk.mesh;
			} else {
				//console.log('No closest chunk found');
			}
		} else {
			//console.log('No terrain chunks available');
		}

		if (terrainObject) {
			//console.log('Attempting raycast on terrain object');
			// レイキャストの設定を調整
			raycaster.firstHitOnly = true;
			raycaster.far = 300; // レイキャストの最大距離を設定
			raycaster.near = 0; // 近接面の距離を0に設定

			// デバッグ情報を追加
			//console.log('Ray origin:', raycaster.ray.origin);
			//console.log('Ray direction:', raycaster.ray.direction);
			//console.log('Chunk position:', terrainObject.position);
			//console.log('Chunk rotation:', terrainObject.rotation);

			// チャンクのジオメトリを取得
			const geometry = terrainObject.geometry;
			if (geometry && geometry.attributes && geometry.attributes.position) {
				// ジオメトリの頂点データを取得
				const positions = geometry.attributes.position.array;
				const segments = this.fieldMap.lodSegments[0];
				const vertexCount = (segments + 1) * (segments + 1);

				// チャンクのローカル座標に変換
				const localX = x - terrainObject.position.x;
				const localZ = z - terrainObject.position.z;

				// グリッドセルのインデックスを計算
				const cellSize = this.fieldMap.chunkSize / segments;
				const cellX = Math.floor(localX / cellSize);
				const cellZ = Math.floor(localZ / cellSize);

				// デバッグ情報を追加
				//console.log('Local coordinates:', { localX, localZ });
				//console.log('Cell indices:', { cellX, cellZ });
				//console.log('Cell size:', cellSize);

				// 4つの頂点のインデックスを計算
				const v1 = cellZ * (segments + 1) + cellX;
				const v2 = v1 + 1;
				const v3 = v1 + (segments + 1);
				const v4 = v3 + 1;

				// 頂点が有効な範囲内かチェック
				if (v1 >= 0 && v4 < vertexCount) {
					// セル内の相対位置を計算
					const relX = (localX % cellSize) / cellSize;
					const relZ = (localZ % cellSize) / cellSize;

					// 4つの頂点の高さを取得
					const h1 = positions[v1 * 3 + 1];
					const h2 = positions[v2 * 3 + 1];
					const h3 = positions[v3 * 3 + 1];
					const h4 = positions[v4 * 3 + 1];

					// デバッグ情報を追加
					//console.log('Vertex heights:', { h1, h2, h3, h4 });
					//console.log('Relative position:', { relX, relZ });

					// バイリニア補間で高さを計算
					const height = (1 - relX) * (1 - relZ) * h1 +
						relX * (1 - relZ) * h2 +
						(1 - relX) * relZ * h3 +
						relX * relZ * h4;
					//console.log('Final calculated height:', height);
					return height;
				} else {
					//console.warn('Vertex indices out of range:', { v1, v2, v3, v4, vertexCount });
				}
			} else {
				//console.warn('Invalid geometry or missing position attribute');
			}
		}

		// フォールバック: フィールドマップのgetHeightAtメソッドを使用
		if (this.fieldMap) {
			const height = this.fieldMap.getHeightAt(x, z);
			//console.log('Using fallback height:', height);
			return height;
		}

		if (this.testCount > 100) {
			//console.log("getHeightPlayer");
			//console.log("x:", x, "z:", z, "height:", height);
			this.testCount = 0;
		}

		return 0;
	}

	updatePlayerHeight(player) {
		const position = player.getPosition();
		const terrainHeight = this.getHeightAt(position.x, position.z);
		//console.log('Terrain height:', terrainHeight);
		//const terrainHeight = this.fieldMap.getHeightAt(position.x, position.z);
		player.setPosition(position.x, terrainHeight, position.z);
	}

	updateItemHeight(item) {
		if (!item || !item.mesh || !item.mesh.position) return;
		
		const position = item.mesh.position;
		const terrainHeight = this.getHeightAt(position.x, position.z);
		item.mesh.position.y = terrainHeight;
	}

	warpToRandomPlayer() {

		//console.log(this.players.size);

		if (this.players.size === 0) {
			console.log('他のプレイヤーがいません');
			return;
		}

		// ランダムに他のプレイヤーを選択
		const playerArray = Array.from(this.players.values());
		const randomPlayer = playerArray[Math.floor(Math.random() * playerArray.length)];

		// 選択したプレイヤーの位置を取得
		const targetPosition = randomPlayer.getPosition();

		// プレイヤーの周囲にランダムなオフセットを加える
		const offset = new THREE.Vector3(
			(Math.random() - 0.5) * 5, // -2.5から2.5の範囲でランダム
			0,
			(Math.random() - 0.5) * 5 // -2.5から2.5の範囲でランダム
		);

		// 新しい位置を計算
		const newPosition = targetPosition.clone().add(offset);

		// マップの境界内に収める
		newPosition.x = Math.max(-450, Math.min(450, newPosition.x));
		newPosition.z = Math.max(-450, Math.min(450, newPosition.z));

		// 建物との衝突チェック
		if (!this.fieldMap.checkCollision(newPosition, 1)) {
			// プレイヤーの位置を更新
			this.playerModel.setPosition(newPosition.x, newPosition.y, newPosition.z);

			// サーバーに位置情報を送信
			this.socket.emit('playerMove', {
				position: this.playerModel.getPosition(),
				rotation: {
					y: this.playerModel.getRotation().y
				},
				isMoving: false,
				isRunning: false
			});
		} else {
			// 衝突する場合は、もう一度試行
			this.warpToRandomPlayer();
		}
	}

	createExplosion(position, radius, damage) {
		// 爆発エフェクトのジオメトリを作成
		const geometry = new THREE.SphereGeometry(radius, 32, 32);
		const material = new THREE.MeshPhongMaterial({
			color: 0xff6600,
			emissive: 0xff3300,
			emissiveIntensity: 0.8,
			transparent: true,
			opacity: 0.8
		});
		const explosion = new THREE.Mesh(geometry, material);
		explosion.position.copy(position);
		this.scene.add(explosion);

		// 爆発のアニメーション
		const duration = 0.5;
		const startTime = Date.now();
		const animate = () => {
			const elapsed = (Date.now() - startTime) / 1000;
			if (elapsed < duration) {
				const scale = 1 + elapsed * 2;
				explosion.scale.set(scale, scale, scale);
				explosion.material.opacity = 0.8 * (1 - elapsed / duration);
				requestAnimationFrame(animate);
			} else {
				this.scene.remove(explosion);
			}
		};
		animate();

		// 範囲内の敵にダメージを与える
		this.enemies.forEach((enemy, enemyId) => {
			if (!enemy || enemy.isDead) return;
			const distance = enemy.model.position.distanceTo(position);
			if (distance <= radius) {
				const damageRatio = 1 - (distance / radius);
				const actualDamage = Math.floor(damage * damageRatio);
				enemy.takeDamage(actualDamage);
				this.socket.emit('enemyHit', {
					targetId: enemyId,
					damage: actualDamage
				});
			}
		});
	}

	createLightningEffect(startPosition, endPosition) {
		// 稲妻のジオメトリを作成
		const points = [];
		const segments = 10;
		for (let i = 0; i <= segments; i++) {
			const t = i / segments;
			const point = new THREE.Vector3().lerpVectors(startPosition, endPosition, t);
			if (i > 0 && i < segments) {
				point.x += (Math.random() - 0.5) * 0.5;
				point.y += (Math.random() - 0.5) * 0.5;
				point.z += (Math.random() - 0.5) * 0.5;
			}
			points.push(point);
		}

		const geometry = new THREE.BufferGeometry().setFromPoints(points);
		const material = new THREE.LineBasicMaterial({
			color: 0x00ffff,
			transparent: true,
			opacity: 0.8
		});
		const lightning = new THREE.Line(geometry, material);
		this.scene.add(lightning);

		// 稲妻のアニメーション
		const duration = 0.2;
		const startTime = Date.now();
		const animate = () => {
			const elapsed = (Date.now() - startTime) / 1000;
			if (elapsed < duration) {
				lightning.material.opacity = 0.8 * (1 - elapsed / duration);
				requestAnimationFrame(animate);
			} else {
				this.scene.remove(lightning);
			}
		};
		animate();
	}

	findNearestEnemy(position, range) {
		let nearestEnemy = null;
		let minDistance = range;

		this.enemies.forEach((enemy, enemyId) => {
			if (!enemy || enemy.isDead) return;
			const distance = enemy.model.position.distanceTo(position);
			if (distance < minDistance) {
				minDistance = distance;
				nearestEnemy = enemy;
			}
		});

		return nearestEnemy;
	}

	getNearbyEnemies(position, range) {
		const nearbyEnemies = [];
		this.enemies.forEach((enemy, enemyId) => {
			if (!enemy || enemy.isDead) return;
			const distance = enemy.model.position.distanceTo(position);
			if (distance <= range) {
				nearbyEnemies.push(enemy);
			}
		});
		return nearbyEnemies;
	}

	setupJumpButton() {
		const jumpButton = document.getElementById('jumpButton');
		if (!jumpButton) return;

			jumpButton.addEventListener('click', () => {
				if (this.playerModel) {
					this.playerModel.startJump();
				}
			});
	}

	setupCameraButton() {
		const cameraButton = document.getElementById('cameraButton');
		if (!cameraButton) return;

		cameraButton.addEventListener('click', () => {
			// 視点モードを切り替え
			switch (this.cameraMode) {
				case 'third':
					this.cameraMode = 'first';
					break;
				case 'first':
					this.cameraMode = 'far';
					break;
				case 'far':
					this.cameraMode = 'third';
					break;
			}
			// カメラ位置を更新
			this.updateCameraPosition();
		});
	}

	setupMapButton() {
		const mapButton = document.getElementById('mapButton');
		const mapModal = document.getElementById('mapModal');
		const closeMapModal = document.getElementById('closeMapModal');

		if (!mapButton || !mapModal || !closeMapModal) return;

		mapButton.addEventListener('click', () => {
			mapModal.style.display = 'block';
		});

		closeMapModal.addEventListener('click', () => {
			mapModal.style.display = 'none';
		});

		// モーダル外をクリックしても閉じる
		mapModal.addEventListener('click', (e) => {
			if (e.target === mapModal) {
				mapModal.style.display = 'none';
			}
		});
	}

	updateAllCharactersHeight() {
		// プレイヤーの高さを更新
		if (this.playerModel) {
			const position = this.playerModel.getPosition();
			const terrainHeight = this.getHeightAt(position.x, position.z);
			//console.log('Terrain height:', terrainHeight);
			//const terrainHeight = this.fieldMap.getHeightAt(position.x, position.z);
			this.playerModel.setPosition(position.x, terrainHeight, position.z);
		}

		// 敵の高さを更新
		this.enemies.forEach(enemy => {
			if (enemy && !enemy.isDead) {
				const position = enemy.model.getPosition();
				const terrainHeight = this.getHeightAt(position.x, position.z);
				//console.log('Terrain height:', terrainHeight);
				enemy.model.setPosition(position.x, terrainHeight + 0.5, position.z);
			}
		});

		// アイテムの高さを更新
		this.items.forEach(item => {
			if (item) {
				this.updateItemHeight(item);
			}
		});
	}
}

// ゲームの開始
window.addEventListener('load', () => {
	window.game = new Game();
});