class Game {
	constructor() {




		this.bosses = [];
		this.bossesSpawned = false;
		this.devMode = false; // 初期値をfalseに変更
		this.killedEnemies = 0; // 倒した敵数を追跡


				// URLパラメータをチェックしてdevModeを設定
				this.checkDevMode();
				//this.devMode = false;

		// AudioManagerの初期化
		this.audioManager = new AudioManager();

		// Stats.jsの初期化（devModeがtrueの時のみ）
		this.stats = null;



		this.visibleDistance1 = GameConfig.MAP.VISLBLE_DISTANCE;
		this.objectVisibleDistance1 = GameConfig.MAP.OBJECT_VISIBLE_DISTANCE;

		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera(
			GameConfig.VISION.FOV,
			window.innerWidth / window.innerHeight, // アスペクト比を正しく設定
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
		
		// WebGLレンダラーを使用（Three.js r128ではWebGPUがサポートされていないため）
		this.renderer = new THREE.WebGLRenderer({
			canvas: document.getElementById('gameCanvas'),
			antialias: true
		});
		
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setPixelRatio(1);
		this.renderer.shadowMap.enabled = true;
		console.log('GameConfig.ITEMS', GameConfig.ITEMS);


		this.setupJumpButton();
		this.setupRankingButton();
		this.setupSettingsButton();
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

		// Socket.IOの初期化はsetupSocketEventsで行う
		this.socket = null;
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
		// FPS制限用の時間管理
		this.lastFrameTime = null;

		this.sunLight = null; // 太陽光
		this.ambientLight = null; // 環境光

		// シード値とゲーム開始時間の初期化
		this.seed = null;
		this.gameStartTime = null;

		// 自動射撃の設定
		this.autoShootEnabled = true; // 自動射撃の有効/無効
		this.autoShootRadius = 30; // 自動射撃の検出半径

		this.playerStatus = new PlayerStatus(this);

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
		
		// 初期設定を適用
		this.applySettings();

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
		//this.checkDevMode();

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
            padding: 8px;
            border-radius: 5px;
            color: white;
            font-size: 11px;
            z-index: 1000;
            min-width: 250px;
        `;
		document.body.appendChild(this.effectsContainer);

		// 初期表示を設定
		this.updateEffectsDisplay();

		// ゲーム開始時にランダムなアイテムを3つバックパックに入れる
		const lang = localStorage.getItem('language') || 'ja';
		const items = ItemsConfig.getItemsConfig(lang) || {};
		console.log('lang:', lang);
		console.log('items:', items);
		const itemTypes = Object.entries(items)
			.filter(([_, item]) => item.dropChance !== undefined)
			.map(([type]) => type);



if(this.devMode){

		for (let i = 0; i < 10; i++) {
			const randomIndex = Math.floor(Math.random() * itemTypes.length);
			const selectedType = itemTypes[i];
			//console.log('selectedType', selectedType);
			if (selectedType) {
				this.inventory.push({
					id: Date.now() + i,
					type: selectedType
				});
			}
		}

}else{



			
		for (let i = 0; i < 3; i++) {
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



}



		this.updateBackpackUI();
			
		// 電波塔の管理を追加
		//this.radioTowerManager = new RadioTowerManager(this.scene);

		// ページがアンロードされる時の処理
		window.addEventListener('beforeunload', () => {
			// BGMを停止
			this.audioManager.stopBGM();
			
			// サーバーに切断を通知
			if (this.socket) {
				this.socket.disconnect();
			}
		});

		// ウィンドウリサイズ時の処理を追加
		window.addEventListener('resize', () => {
			// カメラのアスペクト比を更新
			this.camera.aspect = window.innerWidth / window.innerHeight;
			this.camera.updateProjectionMatrix();
			
			// レンダラーのサイズを更新
			this.renderer.setSize(window.innerWidth, window.innerHeight);
		});

		this.raycast = new Raycast(this);
		this.weponManager = new WeponManager(this);

		this.missionManager = new MissionManager(this);
		

		
		this.animate();

		this.cleanupQueue = {
			bullets: [],
			enemyBullets: [],
			items: [],
			popups: [],
			indicators: []
		};

		// BGM開始のためのユーザーインタラクションUIを追加
		this.setupAudioInteractionUI();
		
		// iOSデバイス用の追加設定
		if (this.audioManager.isIOS) {
			this.setupIOSAudioHandlers();
		}

		// 歩行状態の直前値を記録
		this.prevIsMoving = false;

		// Neon APIを初期化
		if (typeof window.neonAPI !== 'undefined') {
			window.neonAPI.init();
		}
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
		/*
		const messageButton = document.getElementById('messageButton');
		messageButton.addEventListener('click', () => {
			// サーバーにメッセージを送信
			this.socket.emit('playerMessage', {
				position: this.playerModel.getPosition()
			});
			// 自分の画面にも表示
			this.showMessagePopup();
		});
		*/
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
			//this.showBossEnemyIndicator(enemyId, screenPosition);
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
		this.fieldMap = new FieldMap(this.scene, this,seed);
		
		// フィールドマップの初期化が完了するまで待機
		this.fieldMap.initialize().then(() => {
			// フィールドマップの初期化が完了した後にアイテムを生成
			//this.spawnItems();
			console.log("FieldMap初期化完了 - プレイヤー作成準備完了");
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

		console.log("createPlayerModel");
		//console.log(player.id + ">>>>> " + this.socket.id);

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
		console.log("プレイヤー初期スポーン座標:", { x: 100, y: 0, z: 100 });

		// Get initial position from server
		const serverPosition = this.playerModel.getPosition();

		// Check if this position is safe (not colliding with buildings)
		if (this.fieldMap && this.fieldMap.checkCollision(new THREE.Vector3(
				serverPosition.x, serverPosition.y, serverPosition.z), 2)) {

			// Find a safe spawn position
			const safePosition2 = this.getNearbyPlayerPosition();
			this.playerModel.setPosition(safePosition2.x, safePosition2.y, safePosition2.z);
			console.log("プレイヤー安全スポーン座標:", safePosition2);

			// Immediately notify server of the corrected position
			this.socket.emit('playerMove', {
				position: this.playerModel.getPosition(),
				rotation: {
					y: this.playerModel.getRotation().y
				},
				isMoving: false,
				isRunning: false
			});
		} else {
			console.log("プレイヤーファイナルスポーン座標:", serverPosition);
		}
	}

	createPlayerModelWithServerPosition(serverPlayerData) {
		console.log("createPlayerModelWithServerPosition - サーバー位置:", serverPlayerData.position);
		if (this.fieldMap) {
			console.log("FieldMap中心座標: (0, 0, 0) mapSize:", this.fieldMap.mapSize);
			console.log("FieldMap.safeSpawnPositions:", this.fieldMap.safeSpawnPositions);
		}
		// ...（既存処理）
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

		// サーバーから送られてきた位置を直接設定
		this.playerModel.setPosition(
			serverPlayerData.position.x,
			serverPlayerData.position.y,
			serverPlayerData.position.z
		);
		this.playerModel.setRotation(serverPlayerData.rotation.y);
		console.log("プレイヤーサーバー位置でスポーン完了:", serverPlayerData.position);

		// カメラ位置も更新
		this.updateCameraPosition();
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
			if (!this.playerModel) return; // プレイヤーモデルが存在しない場合は処理をスキップ

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
		this.socket = io();

		this.socket.on('connect', () => {
			console.log('Connected to server');
			this.playerId = this.socket.id;
			console.log("this.playerId" + this.playerId);
			
			// ゲーム開始時にBGMを再生（自動再生ポリシーに対応）
			this.audioManager.playBGM();
		});

		this.socket.on('totalKeyItemsCollected', (total) => {
			this.totalKeyItemsCollected = total;
		});

		// ゲーム設定の受信
		this.socket.on('gameConfig', (config) => {
			console.log("gameConfig");
			this.seed = config.seed;
			this.gameStartTime = config.gameStartTime;
			this.playerHash = config.playerHash;
			
			// If player model already exists, update its color based on hash
			if (this.playerModel && this.playerHash) {
				const color = this.generateColorFromHash(this.playerHash);
				this.playerModel.setColor(color);
			}
		});

		this.socket.on('currentPlayers', (players) => {
			//console.log('現在のプレイヤー:', players);

			// シーンの初期化（初回のみ）
			if (!this.fieldMap) {
				console.log("FieldMap初期化開始...");
				this.setupScene(this.seed);
				// setupSceneは非同期なので、初期化完了まで待機
				const waitForInitialization = () => {
					if (this.fieldMap && this.fieldMap.isInitialized) {
						console.log("FieldMap初期化完了 - プレイヤー処理開始");
						this.processCurrentPlayers(players);
					} else {
						setTimeout(waitForInitialization, 100);
					}
				};
				waitForInitialization();
			} else {
				// FieldMapが既に存在する場合は直接処理
				this.processCurrentPlayers(players);
			}
		});

		this.socket.on('newPlayer', (player) => {
			if(player.id !== this.socket.id){
				console.log('新規のプレイヤー:', player);
				this.addPlayer(player);
				this.updatePlayerCount();
			}
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
				this.playerStatus.health = data.health;
				this.updateHealthDisplay();
				console.log("プレイヤーリスタート位置:", data.position);
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
				this.playerStatus.health = data.health;
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

		this.socket.on('keyItemPosition', (data) => {
			if (this.missionManager) {
				this.missionManager.updateKeyItemPosition(data);
			}
		});

		this.socket.on('keyItemCollected', (data) => {
			if (this.missionManager) {
				this.missionManager.handleKeyItemCollected(data);
			}
		});

		// プレイヤー名変更の処理
		this.socket.on('playerNameChanged', (data) => {
			const player = this.players.get(data.playerId);
			if (player) {
				player.name = data.newName;
				console.log(`プレイヤー ${data.playerId} の名前が "${data.newName}" に変更されました`);
			}
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

	createBullet(position, direction, playerId, weaponId) {
		const bullet = new Bullet(this, position, direction, playerId, weaponId);
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

		// 歩行音制御
		if (this.playerModel.isMoving && !this.prevIsMoving) {
			this.audioManager.playWalk();
		} else if (!this.playerModel.isMoving && this.prevIsMoving) {
			this.audioManager.stopWalk();
		}
		this.prevIsMoving = this.playerModel.isMoving;

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
			}else{
				this.playerStatus.decreaseHunger(GameConfig.STATUS.IDLE.HUNGER * deltaTime);
				this.playerStatus.decreaseThirst(GameConfig.STATUS.IDLE.THIRST * deltaTime);
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
		this.playerStatus.health -= damage;
		// 出血を増加させる
		this.playerStatus.increaseBleeding(damage);

		if (this.playerStatus.health < 0) {
			this.playerStatus.health = 0;
		}

		// HPゲージを更新
		this.updateHealthDisplay();

		// HPが0になったらゲームオーバー
		if (this.playerStatus.health <= 0) {
			this.gameOver();
		}
	}

	// HPゲージを更新する処理
	updateHealthDisplay() {
		const healthPercentage = (this.playerStatus.health / this.playerStatus.maxHealth) * 100;

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
			this.healthTextElement.textContent = `HP: ${this.playerStatus.health}/${this.playerStatus.maxHealth}`;
		}

		// ステータス表示も更新
		const healthValueElement = document.getElementById('healthValue');
		const healthFillElement = document.querySelector('#health .status-fill');

		if (healthValueElement) {
			healthValueElement.textContent = Math.round(this.playerStatus.health);
		}

		if (healthFillElement) {
			healthFillElement.style.width = `${healthPercentage}%`;
		}
	}

	// ゲームオーバー処理
	gameOver() {
		this.isGameOver = true;

		// BGMを停止
		this.audioManager.stopBGM();

		// 生存時間を計算
		const survivalTime = Date.now() - this.playerSpawnTime;
		const gameDayLength = GameConfig.TIME.DAY_LENGTH;

		this.playerSpawnTime = Date.now();

		// 生存時間をゲーム内の日数、時間、分に変換
		const survivalDays = Math.floor(survivalTime / (gameDayLength * 1000));
		const survivalHours = Math.floor((survivalTime % (gameDayLength * 1000)) / (gameDayLength * 1000 / 24));
		const survivalMinutes = Math.floor((survivalTime % (gameDayLength * 1000 / 24)) / (gameDayLength * 1000 / 24 / 60));

		// 倒した敵数を取得（仮の値、後で実装）
		const killedEnemies = this.killedEnemies || 0;

		// Neon APIにゲーム結果を送信
		this.sendGameResultToNeon(survivalTime, killedEnemies);

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

	// Neon APIにゲーム結果を送信するメソッド
	async sendGameResultToNeon(survivalTime, killedEnemies) {
		try {
			// neonAPIが利用可能かチェック
			if (typeof window.neonAPI === 'undefined') {
				console.warn('Neon APIが利用できません');
				return;
			}

			// ゲーム結果データを準備
			const gameData = window.neonAPI.prepareGameResult(survivalTime, killedEnemies);

			// Neon APIに送信
			await window.neonAPI.sendGameResult(gameData);
			
			console.log('ゲーム結果をNeon APIに送信しました');

		} catch (error) {
			console.error('Neon API送信エラー:', error);
			// エラーが発生してもゲームは続行
		}
	}

	// ゲームをリスタートする処理
	restartGame() {
		// 音を再生
		//this.audioManager.play('restart');
		
		// BGMを再開
		this.audioManager.playBGM();
		
		this.playerStatus.reset(); // プレイヤーステータスを完全にリセット
		this.isGameOver = false;
		this.gameOverElement.style.display = 'none';
		this.playerSpawnTime = Date.now();
		this.killedEnemies = 0; // 倒した敵数をリセット
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
		// Statsの更新（devModeがtrueの時のみ）
		if (this.stats) {
			this.stats.begin();
		}

		// requestAnimationFrameを使用してアニメーションループを継続
		requestAnimationFrame(() => this.animate());

		// FPS制限（30FPS）
		const targetFPS = 30;
		const targetFrameTime = 1000 / targetFPS;
		
		const currentTime = performance.now();
		if (!this.lastFrameTime) {
			this.lastFrameTime = currentTime;
		}
		
		const deltaTime = currentTime - this.lastFrameTime;
		if (deltaTime < targetFrameTime) {
			// まだ次のフレームの時間になっていない場合はスキップ
			return;
		}
		
		this.lastFrameTime = currentTime;

		// ゲームオーバーの場合は更新をスキップ
		if (this.isGameOver) {
			return;
		}

		const gameDeltaTime = deltaTime / 1000; // 秒単位に変換

		// フレームカウントを更新
		this.frameCount = (this.frameCount || 0) + 1;

		// 60秒ごとにメモリクリーンアップを実行（頻度を下げる）
		if (this.frameCount % 1800 === 0) { // 30fps * 60秒 = 1800フレーム
			this.performMemoryCleanup();
		}

		// すべてのキャラクターの高さを更新
		this.updateAllCharactersHeight();

		// プレイヤーの更新
		this.updatePlayer(gameDeltaTime);
		
		// カメラの位置を更新（プレイヤーが存在する場合のみ）
		if (this.playerModel) {
			this.updateCameraPosition();
		}
		
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
		//this.updateBossIndicators();

		// プレイヤーモデルのアニメーション更新
		if (this.playerModel) {
			this.playerModel.updateLimbAnimation(gameDeltaTime);
		}

		// 他のプレイヤーのアニメーション更新
		this.players.forEach(player => {
			player.updateLimbAnimation(gameDeltaTime);
		});

		// プレイヤーステータスの更新（空腹と喉の渇きの減少など）
		this.update(gameDeltaTime);

		// レンダリング
		if (this.playerStatus.health <= this.playerStatus.maxHealth * 0.2) {
			this.monochromePass.uniforms.intensity.value = 1.0;
			this.composer.render();
		} else {
			this.monochromePass.uniforms.intensity.value = 0.0;
			this.renderer.render(this.scene, this.camera);
		}

		// メッセージインジケーターの位置を更新
		this.updateMessageIndicators();
		this.processCleanupQueue();

		// Statsの更新終了（devModeがtrueの時のみ）
		if (this.stats) {
			this.stats.end();
		}
	}

	update(deltaTime) {
		if (this.isGameOver) {
			console.log('Game is over, skipping update');
			return;
		}
		
		// playerModelがnullの場合は処理をスキップ
		if (!this.playerModel || !this.playerModel.getPosition) {
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
		this.weponManager.updateBullets(deltaTime);
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
						};
					}
				}
			});

			// 最も近い敵が検出半径内にいれば自動射撃
			if (nearestEnemy && nearestEnemy.distance < this.autoShootRadius) {
				// 安全スポット内にいるかチェック
				if (this.fieldMap && this.fieldMap.isSafeSpot(playerPosition.x, playerPosition.z)) {
					// 安全スポット内の場合は射撃しない
					return;
				}
				
				// 自動射撃
				//console.log("自動射撃");
				if (this.playerModel) {
					this.playerModel.startShooting();
				}
				this.weponManager.shoot(this.playerModel);
			}
		}

		/*
		    // 電波塔の更新
		    if (this.playerModel) {
		        this.radioTowerManager.update(this.playerModel.getPosition());
		    }*/

		if (this.missionManager) {
			this.missionManager.update();
		}
	}

	updateStatusDisplay() {
		// プレイヤーステータスのUIを更新
		this.playerStatus.updateUI();
	}

	/*
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
	*/

	checkItemCollisions() {
		//console.log("aa");
		if (!this.playerModel || !this.playerModel.getPosition) return;

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
		this.audioManager.play('item');
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
		const lang = localStorage.getItem('language') || 'ja';
		const itemConfig = ItemsConfig.getItemConfig(itemType, lang);
		if (!itemConfig) {
			console.warn('アイテム設定が見つかりません:', itemType);
			return;
		}
		
		console.log('アイテム使用:', itemType, itemConfig);
		
		// 食べ物・飲み物サウンド
		if (itemConfig.category === 'food') {
			this.audioManager.play('eat');
		} else if (itemConfig.category === 'drink') {
			this.audioManager.play('drink');
		}
		
		// 即時効果の適用
		if (itemConfig.effects && itemConfig.effects.instant) {
			const effects = itemConfig.effects.instant;
			console.log('即時効果適用:', effects);
			
			if (effects.type === 'health') {
				this.playerStatus.addHealth(effects.value);
			} else if (effects.type === 'hunger') {
				this.playerStatus.addHunger(effects.value);
			} else if (effects.type === 'thirst') {
				this.playerStatus.addThirst(effects.value);
			} else if (effects.type === 'virus') {
				// ウイルス効果（負の値で減少）
				this.playerStatus.bleeding = Math.max(0, this.playerStatus.bleeding + effects.value);
			}
		}

		// 持続効果の適用
		if (itemConfig.effects && itemConfig.effects.duration) {
			const durationEffect = itemConfig.effects.duration;
			console.log('持続効果適用:', durationEffect);
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
		const lang = localStorage.getItem('language') || 'ja';
		const itemConfig = ItemsConfig.getItemConfig(type, lang);
		return itemConfig ? itemConfig.color : 0xffffff;
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
			const lang = localStorage.getItem('language') || 'ja';
			const itemConfig = ItemsConfig.getItemConfig(item.type, lang);
			if (!itemConfig) return;
			const itemElement = document.createElement('div');
			itemElement.className = 'backpack-item';
			itemElement.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 5px 10px;
                margin: 2px 0;
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

		/*
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
			*/

		// 既存の時間更新処理
		this.updateSunPosition();
		this.updateSkyColor();
		this.updateFogColor();
		this.updateTimeDisplay();
	}

	/*
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
	}*/
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
			timeDisplay.innerHTML = `<i class="fas fa-vial"></i> ${this.totalKeyItemsCollected || 0} <i class="fas fa-user-alt"></i> ${this.players.size + 1} <br><i class="fas fa-stopwatch"></i> ${survivalDays}D ${survivalHours.toString().padStart(2, '0')}H ${survivalMinutes.toString().padStart(2, '0')}M<br><i class="fas fa-clock"></i> ${worldHours.toString().padStart(2, '0')}:${worldMinutes.toString().padStart(2, '0')}`;
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
		this.audioManager.play('dead');
		const enemy = this.enemies.get(enemyId);
		if (!enemy || !enemy.model) return;

		// 倒した敵数をカウントアップ
		this.killedEnemies++;

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
		const lang = localStorage.getItem('language') || 'ja';
		return ItemsConfig.getItemName(type, lang) || type;
	}

	getItemDescription(type) {
		const lang = localStorage.getItem('language') || 'ja';
		return ItemsConfig.getItemDescription(type, lang) || '';
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

	// http://localhost:3000/?dev=1
	// URLパラメータをチェックしてdevモードを設定
	checkDevMode() {
		// URLパラメータを取得
		const urlParams = new URLSearchParams(window.location.search);
		const isDevMode = urlParams.get('dev') === '1';
		
		console.log('URLパラメータ dev:', urlParams.get('dev'));
		console.log('isDevMode:', isDevMode);

		// statsウィンドウを取得
		const statsElement = document.getElementById('stats');

		// devモードに応じて表示/非表示を設定
		if (statsElement) {
			statsElement.style.display = isDevMode ? 'block' : 'none';
		}

		// devモードの状態を保存
		this.devMode = isDevMode;
		console.log('this.devMode:', this.devMode);

		// devModeがtrueの時にStats.jsを初期化
		if (this.devMode && !this.stats) {
			console.log('Stats.jsの初期化を開始します');
			
			// HTMLで読み込まれたStats.jsを使用（少し遅延させて確実に読み込まれるようにする）
			setTimeout(() => {
				if (typeof Stats !== 'undefined') {
					this.stats = new Stats();
					this.stats.showPanel(0);
					document.body.appendChild(this.stats.dom);
					console.log('Stats.jsが正常に初期化されました');
				} else {
					console.error('Statsクラスが見つかりません。HTMLでStats.jsが読み込まれているか確認してください。');
					// フォールバック: 手動でStats.jsを読み込み
					console.log('フォールバック: Stats.jsを手動で読み込みます');
					const script = document.createElement('script');
					script.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/stats.min.js';
					script.onload = () => {
						if (typeof Stats !== 'undefined') {
							this.stats = new Stats();
							this.stats.showPanel(0);
							document.body.appendChild(this.stats.dom);
							console.log('フォールバック: Stats.jsが正常に初期化されました');
						}
					};
					document.head.appendChild(script);
				}
			}, 100);
		} else {
			console.log('Stats.jsの初期化をスキップします (devMode:', this.devMode, ', stats:', this.stats, ')');
		}
	}

	// オブジェクトの表示/非表示を更新
	updateObjectVisibility() {
		if (!this.playerModel || !this.playerModel.getPosition) return;

		const currentTime = Date.now();
		if (currentTime - this.lastVisionUpdate < GameConfig.VISION.UPDATE_INTERVAL) {
			return; // 更新間隔が経過していない場合はスキップ
		}

		this.lastVisionUpdate = currentTime;

		const playerPosition = this.playerModel.getPosition();
		const maxDistance = GameConfig.MAP.VISLBLE_DISTANCE; // 変更：VISION.MAX_DISTANCEからMAP.VISLBLE_DISTANCEに
		

		
		
		const fadeStart = maxDistance * 0.8; // 変更：フェード開始距離をmaxDistanceの80%に設定
		const disposeDistance = maxDistance * 1.5; // 完全に削除する距離

		// 敵の表示/非表示を更新
		this.enemies.forEach((enemy, enemyId) => {
			if (!enemy || !enemy.model) return;

			const distance = playerPosition.distanceTo(enemy.model.getPosition());

			if (distance > disposeDistance) {
				// 完全に削除する距離を超えている場合は削除
				if (enemy.model.character) {
					this.scene.remove(enemy.model.character);
					enemy.model.character.traverse(child => {
						if (child.isMesh) {
							if (child.geometry) child.geometry.dispose();
							if (child.material) {
								if (Array.isArray(child.material)) {
									child.material.forEach(mat => mat.dispose());
								} else {
									child.material.dispose();
								}
							}
						}
					});
				}
				// 敵をMapから削除
				this.enemies.delete(enemyId);
				return;
			} else if (distance > maxDistance) {
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

		// アイテムの表示/非表示を更新
		for (let i = this.items.length - 1; i >= 0; i--) {
			const item = this.items[i];
			if (!item || !item.mesh) continue;

			const distance = playerPosition.distanceTo(item.mesh.position);

			if (distance > disposeDistance) {
				// 完全に削除する距離を超えている場合は削除
				this.scene.remove(item.mesh);
				if (item.mesh.geometry) item.mesh.geometry.dispose();
				if (item.mesh.material) {
					if (Array.isArray(item.mesh.material)) {
						item.mesh.material.forEach(mat => mat.dispose());
					} else {
						item.mesh.material.dispose();
					}
				}
				this.items.splice(i, 1);
				continue;
			} else if (distance > maxDistance) {
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
		}

		// 他のプレイヤーの表示/非表示を更新
		this.players.forEach((player, id) => {
			if (!player || !player.character) return;

			const playerPos = player.getPosition();
			const distance = playerPos.distanceTo(playerPosition);

			if (distance > disposeDistance) {
				// 完全に削除する距離を超えている場合は削除
				this.scene.remove(player.character);
				player.character.traverse(child => {
					if (child.isMesh) {
						if (child.geometry) child.geometry.dispose();
						if (child.material) {
							if (Array.isArray(child.material)) {
								child.material.forEach(mat => mat.dispose());
							} else {
								child.material.dispose();
							}
						}
					}
				});
				// プレイヤーをMapから削除
				this.players.delete(id);
				return;
			} else if (distance > maxDistance) {
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

		// 建物の表示/非表示を更新（fieldMapで管理されているため、ここでは表示/非表示のみ）
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

		// 安全ゾーン円柱の表示/非表示を更新
		if (this.fieldMap && this.fieldMap.safeZoneMeshes) {
			this.fieldMap.safeZoneMeshes.forEach(safeZoneMesh => {
				if (!safeZoneMesh || !safeZoneMesh.position) return;
				const distance = playerPosition.distanceTo(safeZoneMesh.position);
				if (distance > maxDistance) {
					safeZoneMesh.visible = false;
				} else if (distance > fadeStart) {
					safeZoneMesh.visible = true;
					// 透明度を調整
					if (safeZoneMesh.material) {
						safeZoneMesh.material.opacity = 1 - ((distance - fadeStart) / (maxDistance - fadeStart));
						safeZoneMesh.material.transparent = true;
					}
				} else {
					safeZoneMesh.visible = true;
					if (safeZoneMesh.material) {
						safeZoneMesh.material.opacity = 0.2;
						safeZoneMesh.material.transparent = true;
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
	}
	
	    // 敵の弾丸を更新するメソッド
	    updateEnemyBullets(deltaTime) {
	        // 敵の弾丸の更新
	        for (const [bulletId, bullet] of this.enemyBullets) {
	            // bulletがnullの場合はスキップ
	            if (!bullet) {
	                this.enemyBullets.delete(bulletId);
	                continue;
	            }

	            // 弾丸の位置を更新
	            const result = bullet.update(deltaTime);
	            
	            // 弾丸が寿命を迎えた場合
	            if (!result) {
	                this.removeEnemyBullet(bulletId);
	                continue;
	            }

	            // プレイヤーとの距離をチェック
	            if (this.playerModel && this.playerModel.getPosition) {
	                const playerPosition = this.playerModel.getPosition();
	                const distance = playerPosition.distanceTo(bullet.position);
	                
	                // 遠すぎる弾丸を削除（メモリリーク防止）
	                if (distance > GameConfig.MAP.VISLBLE_DISTANCE * 2) {
	                    this.removeEnemyBullet(bulletId);
	                    continue;
	                }

	                // プレイヤーとの衝突判定
	                if (bullet.checkCollision(playerPosition, GameConfig.PLAYER.COLLISION_RADIUS)) {
	                    this.takeDamage(bullet.damage);
	                    this.removeEnemyBullet(bulletId);
	                }
	            }
	        }
	    }
	
	collectItem(itemType) {
		this.audioManager.play('item');
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
			const lang = localStorage.getItem('language') || 'ja';
			
			// 武器効果の場合は特別な処理
			if (effect.type === 'wepon') {
				html += `
                    <span style="margin: 0 8px 0 0; font-size: 10px; display: inline-block;">
                        <span style="color: #4CAF50; font-weight: bold; font-size: 10px;">[${effect.name}]</span>
                        <span style="color: #4CAF50; font-size: 9px;">武器効果</span>
                        <span style="color: #FFD700; margin-left: 3px; font-size: 9px;">${remainingTime}s</span>
                    </span>
                `;
			} else {
				// その他の効果はItemsConfigから取得
				const effectConfig = ItemsConfig.getItemConfig(effect.type, lang);
				if (effectConfig) {
					html += `
                        <span style="margin: 0 8px 0 0; font-size: 10px; display: inline-block;">
                            <span style="color: #4CAF50; font-weight: bold; font-size: 10px;">[${effectConfig.name}]</span>
                            <span style="color: #4CAF50; font-size: 9px;">${effectConfig.description}</span>
                            <span style="color: #FFD700; margin-left: 3px; font-size: 9px;">${remainingTime}s</span>
                        </span>
                    `;
				} else {
					// 効果設定が見つからない場合のフォールバック
					html += `
                        <span style="margin: 0 8px 0 0; font-size: 10px; display: inline-block;">
                            <span style="color: #4CAF50; font-weight: bold; font-size: 10px;">[${effect.type}]</span>
                            <span style="color: #4CAF50; font-size: 9px;">効果</span>
                            <span style="color: #FFD700; margin-left: 3px; font-size: 9px;">${remainingTime}s</span>
                        </span>
                    `;
				}
			}
		}

		this.effectsContainer.innerHTML = html;
	}

	handleEnemyKilled(enemyIds) {
		enemyIds.forEach(enemyId => {
			const enemy = this.enemies.get(enemyId);
			if (enemy) {
				// 音を再生
				//this.audioManager.play('enemyDeath');
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
		this.playerStatus.reset();
		this.isGameOver = false;
		this.gameOverElement.style.display = 'none';
		this.playerSpawnTime = Date.now();
		this.lastTime = performance.now();
		this.lastFrameTime = null; // FPS制限用の時間管理をリセット
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

	setupRankingButton() {
		const rankingButton = document.getElementById('rankingButton');
		const rankingModal = document.getElementById('rankingModal');
		const closeRankingModal = document.getElementById('closeRankingModal');

		if (!rankingButton || !rankingModal || !closeRankingModal) return;

		rankingButton.addEventListener('click', () => {
			this.showRankingModal();
		});

		closeRankingModal.addEventListener('click', () => {
			rankingModal.style.display = 'none';
		});

		// モーダル外をクリックしても閉じる
		rankingModal.addEventListener('click', (e) => {
			if (e.target === rankingModal) {
				rankingModal.style.display = 'none';
			}
		});
	}

	async showRankingModal() {
		const rankingModal = document.getElementById('rankingModal');
		const rankingLoading = document.getElementById('rankingLoading');
		const rankingError = document.getElementById('rankingError');
		const rankingContent = document.getElementById('rankingContent');
		const rankingTableBody = document.getElementById('rankingTableBody');

		// モーダルを表示
		rankingModal.style.display = 'block';
		
		// ローディング状態を表示
		rankingLoading.style.display = 'block';
		rankingError.style.display = 'none';
		rankingContent.style.display = 'none';

		try {
			// ランキングデータを取得
			const rankingData = await window.neonAPI.getRanking();
			
			if (rankingData && rankingData.length > 0) {
				// ランキングテーブルを更新
				this.updateRankingTable(rankingData);
				
				// コンテンツを表示
				rankingLoading.style.display = 'none';
				rankingContent.style.display = 'block';
			} else {
				// データがない場合
				rankingLoading.style.display = 'none';
				rankingError.style.display = 'block';
				rankingError.innerHTML = '<i class="fas fa-exclamation-triangle"></i> ランキングデータがありません';
			}
		} catch (error) {
			console.error('ランキング取得エラー:', error);
			rankingLoading.style.display = 'none';
			rankingError.style.display = 'block';
			rankingError.innerHTML = '<i class="fas fa-exclamation-triangle"></i> ランキングの読み込みに失敗しました';
		}
	}

	updateRankingTable(rankingData) {
		const rankingTableBody = document.getElementById('rankingTableBody');
		
		// テーブルをクリア
		rankingTableBody.innerHTML = '';
		
		// 現在のプレイヤーIDを取得
		const currentPlayerId = this.socket ? this.socket.id : null;
		
		rankingData.forEach((player, index) => {
			const row = document.createElement('tr');
			
			// 順位に応じたクラスを追加
			if (index === 0) row.classList.add('rank-1');
			else if (index === 1) row.classList.add('rank-2');
			else if (index === 2) row.classList.add('rank-3');
			
			// 現在のプレイヤーの場合はハイライト
			if (player.user_id === currentPlayerId) {
				row.classList.add('current-player');
			}
			
			// 生存時間をフォーマット
			const survivalTime = this.formatSurvivalTime(player.survival_time);
			
			row.innerHTML = `
				<td>${index + 1}</td>
				<td>${player.user_name || 'Unknown Player'}</td>
				<td>${player.score.toLocaleString()}</td>
				<td>${survivalTime}</td>
				<td>${player.killed_enemies}</td>
			`;
			
			rankingTableBody.appendChild(row);
		});
	}

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

	setupSettingsButton() {
		const settingsButton = document.getElementById('settingsButton');
		const settingsModal = document.getElementById('settingsModal');
		const closeSettingsModal = document.getElementById('closeSettingsModal');
		const playerNameInput = document.getElementById('playerNameInput');
		const savePlayerNameBtn = document.getElementById('savePlayerNameBtn');
		const bgmToggle = document.getElementById('bgmToggle');
		const graphicsQuality = document.getElementById('graphicsQuality');
		const languageSelect = document.getElementById('languageSelect');
		const saveSettingsBtn = document.getElementById('saveSettingsBtn');

		if (!settingsButton || !settingsModal || !closeSettingsModal) return;

		// セッティングボタンクリック時の処理
		settingsButton.addEventListener('click', () => {
			this.showSettingsModal();
		});

		// モーダルを閉じる
		closeSettingsModal.addEventListener('click', () => {
			settingsModal.style.display = 'none';
		});

		// モーダル外をクリックしても閉じる
		settingsModal.addEventListener('click', (e) => {
			if (e.target === settingsModal) {
				settingsModal.style.display = 'none';
			}
		});

		// プレイヤー名保存ボタン
		if (savePlayerNameBtn) {
			savePlayerNameBtn.addEventListener('click', () => {
				this.savePlayerName();
			});
		}

		// 設定保存ボタン
		if (saveSettingsBtn) {
			saveSettingsBtn.addEventListener('click', () => {
				this.saveSettings();
			});
		}

		// Enterキーでプレイヤー名を保存
		if (playerNameInput) {
			playerNameInput.addEventListener('keypress', (e) => {
				if (e.key === 'Enter') {
					this.savePlayerName();
				}
			});
		}
	}

	showSettingsModal() {
		const settingsModal = document.getElementById('settingsModal');
		const playerNameInput = document.getElementById('playerNameInput');
		const bgmToggle = document.getElementById('bgmToggle');
		const graphicsQuality = document.getElementById('graphicsQuality');
		const languageSelect = document.getElementById('languageSelect');

		// モーダルを表示
		settingsModal.style.display = 'block';

		// 現在の設定を読み込み
		this.loadSettings();

		// 現在のプレイヤー名を表示
		if (playerNameInput && this.socket) {
			const currentPlayer = this.players.get(this.socket.id);
			if (currentPlayer && currentPlayer.name) {
				playerNameInput.value = currentPlayer.name;
			} else {
				playerNameInput.value = window.neonAPI.userName;
			}
		}
	}

	async savePlayerName() {
		const playerNameInput = document.getElementById('playerNameInput');
		if (!playerNameInput || !this.socket) {
			console.error('プレイヤー名保存: 必要な要素が見つかりません');
			return;
		}

		const newName = playerNameInput.value.trim();
		if (!newName) {
			alert('プレイヤー名を入力してください');
			return;
		}

		if (newName.length > 20) {
			alert('プレイヤー名は20文字以内で入力してください');
			return;
		}

		console.log('プレイヤー名保存開始:', { socketId: this.socket.id, newName: newName });

		try {
			// サーバーに名前変更を送信
			const result = await window.neonAPI.updatePlayerName(this.socket.id, newName);
			
			if (result && result.success) {
				// ローカルのユーザー情報も更新
				window.neonAPI.setUserInfo(null, newName);
				window.neonAPI.saveUserInfo();
				
				// 成功メッセージ
				this.showMessage('プレイヤー名が更新されました');
				console.log('プレイヤー名保存成功');
			} else {
				console.error('プレイヤー名保存失敗:', result);
				alert('プレイヤー名の更新に失敗しました');
			}
		} catch (error) {
			console.error('プレイヤー名保存エラー:', error);
			console.error('エラー詳細:', error.message);
			alert('プレイヤー名の更新に失敗しました: ' + error.message);
		}
	}

	saveSettings() {
		const bgmToggle = document.getElementById('bgmToggle');
		const graphicsQuality = document.getElementById('graphicsQuality');
		const languageSelect = document.getElementById('languageSelect');

		// BGM設定を保存
		if (bgmToggle) {
			localStorage.setItem('bgm_enabled', bgmToggle.value);
		}

		// グラフィック設定を保存
		if (graphicsQuality) {
			localStorage.setItem('graphics_quality', graphicsQuality.value);
		}

		// 言語設定を保存
		if (languageSelect) {
			localStorage.setItem('language', languageSelect.value);
		}

		// 設定を適用
		this.applySettings();

		// 成功メッセージ
		this.showMessage('設定が保存されました');

		// モーダルを閉じる
		const settingsModal = document.getElementById('settingsModal');
		if (settingsModal) {
			settingsModal.style.display = 'none';
		}
	}

	loadSettings() {
		const bgmToggle = document.getElementById('bgmToggle');
		const graphicsQuality = document.getElementById('graphicsQuality');
		const languageSelect = document.getElementById('languageSelect');

		// BGM設定を読み込み
		if (bgmToggle) {
			const savedBGM = localStorage.getItem('bgm_enabled');
			bgmToggle.value = savedBGM || 'on';
		}

		// グラフィック設定を読み込み
		if (graphicsQuality) {
			const savedGraphics = localStorage.getItem('graphics_quality');
			graphicsQuality.value = savedGraphics || 'low';
		}

		// 言語設定を読み込み
		if (languageSelect) {
			const savedLanguage = localStorage.getItem('language');
			languageSelect.value = savedLanguage || 'ja';
		}
	}

	applySettings() {
		// BGM設定を適用
		const bgmEnabled = localStorage.getItem('bgm_enabled') || 'on';
		if (this.audioManager) {
			if (bgmEnabled === 'off') {
				this.audioManager.stopBGM();
			} else {
				this.audioManager.playBGM();
			}
		}

		// グラフィック設定を適用
		const graphicsQuality = localStorage.getItem('graphics_quality') || 'low';
		this.applyGraphicsSettings(graphicsQuality);

		// 言語設定を適用
		const language = localStorage.getItem('language') || 'ja';
		this.applyLanguageSettings(language);
	}

	applyGraphicsSettings(quality) {
		switch (quality) {
			case 'low':
				// 低品質設定
				//this.renderer.setPixelRatio(1);
				//this.renderer.shadowMap.enabled = false;


				this.visibleDistance1 = GameConfig.MAP.VISLBLE_DISTANCE;
				this.objectVisibleDistance1 = GameConfig.MAP.OBJECT_VISIBLE_DISTANCE;


				break;
			case 'medium':
				// 中品質設定
				//this.renderer.setPixelRatio(1.5);
				//this.renderer.shadowMap.enabled = true;

				this.visibleDistance1 = 100;
				this.objectVisibleDistance1 = 120;


				break;
			case 'high':
				// 高品質設定
				//this.renderer.setPixelRatio(2);
				//this.renderer.shadowMap.enabled = true;

				this.visibleDistance1 = 150;
				this.objectVisibleDistance1 = 200;


				break;
		}
	}

	showMessage(message) {
		// 簡単なメッセージ表示（既存のメッセージシステムがあればそれを使用）
		console.log(message);
		// 必要に応じてUIにメッセージを表示
	}

	applyLanguageSettings(language) {
		// 言語設定を適用
		console.log('言語設定を適用:', language);
		
		// 現在の言語をグローバル変数に保存
		window.currentLanguage = language;
		
		// 必要に応じてUI要素の言語を変更
		this.updateUILanguage(language);
	}

	updateUILanguage(language) {
		// UI要素の言語を更新
		const texts = this.getLanguageTexts(language);
		
		// 設定ボタンのツールチップを更新
		const settingsButton = document.getElementById('settingsButton');
		if (settingsButton) {
			settingsButton.title = texts.settings;
		}

		// ランキングボタンのツールチップを更新
		const rankingButton = document.getElementById('rankingButton');
		if (rankingButton) {
			rankingButton.title = texts.ranking;
		}

		// その他のUI要素も必要に応じて更新
		console.log('UI言語を更新:', language);
	}

	getLanguageTexts(language) {
		const texts = {
			ja: {
				settings: '設定',
				ranking: 'ランキング',
				playerName: 'プレイヤー名',
				bgm: 'BGM',
				graphics: 'グラフィック',
				language: '言語',
				quality: '品質',
				low: '低',
				medium: '中',
				high: '高',
				on: 'ON',
				off: 'OFF',
				japanese: '日本語',
				english: 'English',
				save: '保存',
				saveSettings: '設定を保存'
			},
			en: {
				settings: 'Settings',
				ranking: 'Ranking',
				playerName: 'Player Name',
				bgm: 'BGM',
				graphics: 'Graphics',
				language: 'Language',
				quality: 'Quality',
				low: 'Low',
				medium: 'Medium',
				high: 'High',
				on: 'ON',
				off: 'OFF',
				japanese: '日本語',
				english: 'English',
				save: 'Save',
				saveSettings: 'Save Settings'
			}
		};
		
		return texts[language] || texts.ja;
	}

	updateAllCharactersHeight() {
		// プレイヤーの高さを更新
		if (this.playerModel && this.playerModel.getPosition) {
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

	// メモリクリーンアップを行うメソッド
	performMemoryCleanup() {
		// 弾丸
		const maxBullets = 150;
		if (this.bullets.length > maxBullets) {
			const bulletsToRemove = this.bullets.length - maxBullets;
			for (let i = 0; i < bulletsToRemove; i++) {
				const bullet = this.bullets.shift();
				if (bullet) this.cleanupQueue.bullets.push(bullet);
			}
		}
		// 敵弾
		const maxEnemyBullets = 80;
		if (this.enemyBullets.size > maxEnemyBullets) {
			const bulletsToRemove = this.enemyBullets.size - maxEnemyBullets;
			let removed = 0;
			for (const [bulletId, bullet] of this.enemyBullets) {
				if (removed >= bulletsToRemove) break;
				this.enemyBullets.delete(bulletId);
				if (bullet) this.cleanupQueue.enemyBullets.push(bullet);
				removed++;
			}
		}
		/*
		// アイテム
		const maxItems = GameConfig.ITEM.MAX_COUNT * 3;
		if (this.items.length > maxItems) {
			const itemsToRemove = this.items.length - maxItems;
			for (let i = 0; i < itemsToRemove; i++) {
				const item = this.items.shift();
				if (item) this.cleanupQueue.items.push(item);
			}
		}
			*/
		// ポップアップ
		if (this.messagePopups && this.messagePopups.size > 5) {
			const popupArray = Array.from(this.messagePopups.entries());
			const popupsToRemove = popupArray.slice(0, popupArray.length - 5);
			popupsToRemove.forEach(([playerId, popup]) => {
				this.messagePopups.delete(playerId);
				if (popup) this.cleanupQueue.popups.push(popup);
			});
		}
		// インジケーター
		if (this.messageIndicators && this.messageIndicators.size > 3) {
			const indicatorArray = Array.from(this.messageIndicators.entries());
			const indicatorsToRemove = indicatorArray.slice(0, indicatorArray.length - 3);
			indicatorsToRemove.forEach(([playerId, indicator]) => {
				this.messageIndicators.delete(playerId);
				if (indicator) this.cleanupQueue.indicators.push(indicator);
			});
		}
	}

	// クリーンアップキューを毎フレーム少しずつ処理する
	processCleanupQueue() {
		// 弾丸
		for (let i = 0; i < 2; i++) {
			const bullet = this.cleanupQueue.bullets.shift();
			if (bullet) {
				if (bullet.model) this.scene.remove(bullet.model);
				if (bullet.dispose) bullet.dispose();
			}
		}
		// 敵弾
		for (let i = 0; i < 2; i++) {
			const bullet = this.cleanupQueue.enemyBullets.shift();
			if (bullet) {
				if (bullet.model) this.scene.remove(bullet.model);
				if (bullet.dispose) bullet.dispose();
			}
		}
		// アイテム
		for (let i = 0; i < 2; i++) {
			const item = this.cleanupQueue.items.shift();
			if (item && item.mesh) {
				this.scene.remove(item.mesh);
				if (item.mesh.geometry) item.mesh.geometry.dispose();
				if (item.mesh.material) {
					if (Array.isArray(item.mesh.material)) {
						item.mesh.material.forEach(mat => mat.dispose());
					} else {
						item.mesh.material.dispose();
					}
				}
			}
		}
		// ポップアップ
		for (let i = 0; i < 2; i++) {
			const popup = this.cleanupQueue.popups.shift();
			if (popup && popup.parentNode) popup.remove();
		}
		// インジケーター
		for (let i = 0; i < 2; i++) {
			const indicator = this.cleanupQueue.indicators.shift();
			if (indicator && indicator.parentNode) indicator.remove();
		}
	}

	// BGM開始のためのユーザーインタラクションUIを設定
	setupAudioInteractionUI() {
		// iOSデバイスかどうかを判定
		const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
		
		// 音声開始ボタンを作成
		const audioButton = document.createElement('div');
		audioButton.id = 'audioStartButton';
		
		// iOS用の特別なメッセージ
		const iosMessage = isIOS ? 
			'<div style="font-size: 12px; margin-top: 5px; color: #ff6b6b;">iOS: Tap to start background music</div>' : 
			'<div style="font-size: 12px; margin-top: 5px; color: #ccc;">(due to the browsers autoplay policy)</div>';
		
		audioButton.innerHTML = `
			<div style="
				position: fixed;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				background: rgba(0, 0, 0, 0.9);
				color: white;
				padding: 25px;
				border-radius: 15px;
				text-align: center;
				z-index: 10000;
				cursor: pointer;
				font-size: 18px;
				border: 3px solid #4CAF50;
				box-shadow: 0 4px 20px rgba(0,0,0,0.5);
				min-width: 280px;
			">
				<div style="margin-bottom: 15px;">
					<i class="fas fa-volume-up" style="font-size: 32px; color: #4CAF50;"></i>
				</div>
				<div style="font-weight: bold; margin-bottom: 10px;">
					${isIOS ? '🎵 StartBGM' : 'Click to start BGM'}
				</div>
				${iosMessage}
				${isIOS ? '<div style="font-size: 11px; margin-top: 8px; color: #ffa500;">*Audio playback is limited on iOS.</div>' : ''}
			</div>
		`;
		
		document.body.appendChild(audioButton);
		
		// クリックイベントを設定
		const startBGMHandler = () => {
			console.log('音声開始ボタンがクリックされました');
			
			// iOS用の特別な処理
			if (isIOS) {
				this.startBGMForIOS();
			} else {
				// BGMを開始
				this.audioManager.playBGM();
			}
			
			// ボタンを非表示にする
			audioButton.style.display = 'none';
			
			// 成功メッセージを表示
			const successMessage = document.createElement('div');
			successMessage.innerHTML = `
				<div style="
					position: fixed;
					top: 20px;
					right: 20px;
					background: rgba(76, 175, 80, 0.9);
					color: white;
					padding: 12px 18px;
					border-radius: 8px;
					z-index: 10001;
					font-size: 14px;
					box-shadow: 0 2px 10px rgba(0,0,0,0.3);
				">
					<i class="fas fa-check"></i> Start BGM
				</div>
			`;
			document.body.appendChild(successMessage);
			
			// 3秒後にメッセージを削除
			setTimeout(() => {
				if (successMessage.parentNode) {
					successMessage.remove();
				}
			}, 3000);
		};
		
		// iOSではタッチイベントを優先
		if (isIOS) {
			audioButton.addEventListener('touchstart', (e) => {
				e.preventDefault();
				e.stopPropagation();
				startBGMHandler();
			}, { passive: false });
		}
		
		audioButton.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			startBGMHandler();
		});
		
		// iOSではより長く表示する（15秒）
		const autoHideTime = isIOS ? 15000 : 5000;
		setTimeout(() => {
			if (audioButton.parentNode && !this.audioManager.bgmReady) {
				audioButton.style.display = 'none';
				console.log('音声開始ボタンを自動非表示にしました');
			}
		}, autoHideTime);
	}

	// iOS用のBGM開始処理
	startBGMForIOS() {
		console.log('iOS: 特別なBGM開始処理を実行');
		
		// AudioContextを確実に再開
		if (this.audioManager.audioContext && this.audioManager.audioContext.state === 'suspended') {
			this.audioManager.audioContext.resume().then(() => {
				console.log('iOS: AudioContext再開完了（UI経由）');
				this.audioManager.playBGM();
			}).catch(error => {
				console.error('iOS: AudioContext再開エラー（UI経由）:', error);
				// エラーが発生してもBGM再生を試行
				this.audioManager.playBGM();
			});
		} else {
			this.audioManager.playBGM();
		}
	}

	// iOSデバイス用の音声ハンドラーを設定
	setupIOSAudioHandlers() {
		console.log('iOSデバイス用の音声ハンドラーを設定中...');
		
		// ページの可視性変更時の処理
		document.addEventListener('visibilitychange', () => {
			if (document.hidden) {
				// ページが非表示になった時にBGMを一時停止
				if (this.audioManager.bgm && !this.audioManager.bgm.paused) {
					this.audioManager.bgm.pause();
					console.log('iOS: ページ非表示でBGM一時停止');
				}
			} else {
				// ページが表示された時にBGMを再開
				if (this.audioManager.bgm && this.audioManager.bgmReady) {
					this.audioManager.bgm.play().catch(error => {
						console.log('iOS: ページ表示時のBGM再開エラー:', error);
					});
				}
			}
		});
		
		// タッチイベントでAudioContextを再開
		const resumeAudioContext = () => {
			if (this.audioManager.audioContext && this.audioManager.audioContext.state === 'suspended') {
				this.audioManager.audioContext.resume().then(() => {
					console.log('iOS: AudioContext再開完了');
				});
			}
		};
		
		// 最初のタッチでAudioContextを再開
		document.addEventListener('touchstart', resumeAudioContext, { once: true });
		document.addEventListener('touchend', resumeAudioContext, { once: true });
		
		// ゲームキャンバスでのタッチでも再開
		const canvas = document.getElementById('gameCanvas');
		if (canvas) {
			canvas.addEventListener('touchstart', resumeAudioContext, { once: true });
			canvas.addEventListener('touchend', resumeAudioContext, { once: true });
		}
	}

	processCurrentPlayers(players) {
		console.log("processCurrentPlayers開始 - プレイヤー数:", players.length);
		console.log("自分のsocket.id:", this.socket.id);
		console.log("全プレイヤーデータ:", players);
		
		// 自分の初期位置を設定
		const myPlayerData = players.find(player => player.id === this.socket.id);
		if (myPlayerData) {
			console.log("自分のプレイヤーデータ発見:", myPlayerData.position);
			this.createPlayerModelWithServerPosition(myPlayerData);
		} else {
			console.log("自分のプレイヤーデータが見つかりません");
			console.log("利用可能なプレイヤーID:", players.map(p => p.id));
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
			if (player.id !== this.socket.id && !this.players.has(player.id)) {
				this.addPlayer(player);
			}
		});
		this.updatePlayerCount();
	}

	createPlayerModelWithServerPosition(serverPlayerData) {
		console.log("createPlayerModelWithServerPosition - サーバー位置:", serverPlayerData.position);
		if (this.fieldMap) {
			console.log("FieldMap中心座標: (0, 0, 0) mapSize:", this.fieldMap.mapSize);
			console.log("FieldMap.safeSpawnPositions:", this.fieldMap.safeSpawnPositions);
		}
		// ...（既存処理）
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

		// サーバーから送られてきた位置を直接設定
		this.playerModel.setPosition(
			serverPlayerData.position.x,
			serverPlayerData.position.y,
			serverPlayerData.position.z
		);
		this.playerModel.setRotation(serverPlayerData.rotation.y);
		console.log("プレイヤーサーバー位置でスポーン完了:", serverPlayerData.position);

		// カメラ位置も更新
		this.updateCameraPosition();
	}
}

// ゲームの開始
window.addEventListener('load', () => {
	window.game = new Game();
});