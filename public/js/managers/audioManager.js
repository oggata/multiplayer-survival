class AudioManager {
	constructor() {
		this.sounds = {};
		this.bgm = null;
		this.bgmLoaded = false;
		this.bgmReady = false;
		this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
		this.audioContext = null;
		this.userInteracted = false;
		this.loadSounds();
		this.setupIOSAudio();
		this.loadBGM();
	}

	loadSounds() {
		// 敵を倒した時の音
		this.sounds.enemyDeath = new Audio('se/maou_se_system06.mp3');
		// 銃を発射した時の音
		this.sounds.gunShot = new Audio('se/maou_se_system45.mp3');
		// リスタート時の音
		this.sounds.restart = new Audio('se/maou_se_system13.mp3');
		// 歩行音
		this.sounds.walk = new Audio('se/walk.mp3');
		this.sounds.walk.loop = true;
		this.sounds.walk.volume = 0.5;
		// 銃声
		this.sounds.shoot = new Audio('se/shoot.mp3');
		this.sounds.shoot.volume = 0.5;
		// 敵死亡音
		this.sounds.dead = new Audio('se/dead.mp3');
		this.sounds.dead.volume = 0.2;
		// アイテム取得音
		this.sounds.item = new Audio('se/item.mp3');
		this.sounds.item.volume = 0.5;
		// 食べ物
		this.sounds.eat = new Audio('se/eat.mp3');
		this.sounds.eat.volume = 0.5;
		// 飲み物
		this.sounds.drink = new Audio('se/drink.mp3');
		this.sounds.drink.volume = 0.5;
	}

	loadBGM() {
		// iOS用の特別な処理
		if (this.isIOS) {
			this.loadBGMForIOS();
		} else {
			this.loadBGMForDesktop();
		}
	}

	loadBGMForIOS() {
		console.log('iOS: BGM読み込み開始');
		
		// iOSでは新しいAudioオブジェクトを作成
		this.bgm = new Audio();
		this.bgm.src = 'se/main.mp3';
		this.bgm.loop = true;
		this.bgm.volume = 0.5;
		this.bgm.preload = 'auto';
		this.bgm.autoplay = false;
		this.bgm.muted = false;
		
		// iOS用のイベントリスナー
		this.bgm.addEventListener('loadstart', () => {
			console.log('iOS: BGM loadstart');
		});
		
		this.bgm.addEventListener('loadedmetadata', () => {
			console.log('iOS: BGM loadedmetadata');
		});
		
		this.bgm.addEventListener('loadeddata', () => {
			console.log('iOS: BGM loadeddata');
		});
		
		this.bgm.addEventListener('canplay', () => {
			console.log('iOS: BGM canplay');
		});
		
		this.bgm.addEventListener('canplaythrough', () => {
			console.log('iOS: BGM canplaythrough - 読み込み完了');
			this.bgmLoaded = true;
		});
		
		this.bgm.addEventListener('error', (error) => {
			console.error('iOS: BGM読み込みエラー:', error);
			console.error('Error details:', this.bgm.error);
		});
		
		// 音声の読み込みを開始
		this.bgm.load();
	}

	loadBGMForDesktop() {
		// デスクトップ用の通常の処理
		this.bgm = new Audio('se/main.mp3');
		this.bgm.loop = true;
		this.bgm.volume = 0.5;
		
		this.bgm.addEventListener('canplaythrough', () => {
			console.log('Desktop: BGM読み込み完了');
			this.bgmLoaded = true;
		});
		
		this.bgm.addEventListener('error', (error) => {
			console.error('Desktop: BGM読み込みエラー:', error);
		});
	}

	setupIOSAudio() {
		// iOS用の音声コンテキスト設定
		if (this.isIOS) {
			// Web Audio APIを使用してiOSでの音声再生を改善
			try {
				this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
				console.log('iOS: AudioContext初期化完了');
			} catch (error) {
				console.error('iOS: AudioContext初期化エラー:', error);
			}
		}
	}

	play(soundName) {
		if (this.sounds[soundName]) {
			// 音声を最初から再生
			this.sounds[soundName].currentTime = 0;
			this.sounds[soundName].play();
		}
	}

	playBGM() {
		if (!this.bgm) {
			console.log('BGMが初期化されていません');
			return;
		}

		if (this.isIOS) {
			this.playBGMForIOS();
		} else {
			this.playBGMForDesktop();
		}
	}

	playBGMForIOS() {
		console.log('iOS: BGM再生を試行');
		console.log('BGM loaded:', this.bgmLoaded);
		console.log('User interacted:', this.userInteracted);
		console.log('AudioContext state:', this.audioContext ? this.audioContext.state : 'null');
		
		if (!this.bgmLoaded) {
			console.log('iOS: BGMがまだ読み込まれていません');
			return;
		}

		// AudioContextが一時停止状態の場合は再開
		if (this.audioContext && this.audioContext.state === 'suspended') {
			console.log('iOS: AudioContextを再開中...');
			this.audioContext.resume().then(() => {
				console.log('iOS: AudioContext再開完了');
				this.attemptIOSBGMPlay();
			}).catch(error => {
				console.error('iOS: AudioContext再開エラー:', error);
			});
		} else {
			this.attemptIOSBGMPlay();
		}
	}

	attemptIOSBGMPlay() {
		console.log('iOS: BGM再生を試行中...');
		
		// 音声を一時停止してから再生（iOSの制限回避）
		this.bgm.pause();
		this.bgm.currentTime = 0;
		
		// 少し遅延してから再生
		setTimeout(() => {
			const playPromise = this.bgm.play();
			
			if (playPromise !== undefined) {
				playPromise.then(() => {
					console.log('iOS: BGM再生開始成功！');
					this.bgmReady = true;
					this.userInteracted = true;
				}).catch(error => {
					console.error('iOS: BGM再生エラー:', error);
					console.error('Error name:', error.name);
					console.error('Error message:', error.message);
					
					// ユーザーインタラクションが必要な場合
					if (error.name === 'NotAllowedError') {
						console.log('iOS: ユーザーインタラクションが必要です');
						this.setupIOSUserInteraction();
					}
				});
			}
		}, 100);
	}

	playBGMForDesktop() {
		if (this.bgm && this.bgmLoaded) {
			const playPromise = this.bgm.play();
			
			if (playPromise !== undefined) {
				playPromise.then(() => {
					console.log('Desktop: BGM再生開始');
					this.bgmReady = true;
				}).catch(error => {
					console.log('Desktop: BGM再生エラー:', error);
					this.setupUserInteractionForAudio();
				});
			}
		} else {
			console.log('Desktop: BGMがまだ読み込まれていません');
		}
	}

	setupIOSUserInteraction() {
		// iOS用のユーザーインタラクション設定
		const startBGM = () => {
			if (this.bgm && this.bgmLoaded && !this.bgmReady) {
				// iOSではAudioContextの再開も必要
				if (this.audioContext && this.audioContext.state === 'suspended') {
					this.audioContext.resume().then(() => {
						this.bgm.play().then(() => {
							console.log('iOS: ユーザーインタラクション後にBGM再生開始');
							this.bgmReady = true;
						}).catch(error => {
							console.error('iOS: BGM再生エラー:', error);
						});
					});
				} else {
					this.bgm.play().then(() => {
						console.log('iOS: ユーザーインタラクション後にBGM再生開始');
						this.bgmReady = true;
					}).catch(error => {
						console.error('iOS: BGM再生エラー:', error);
					});
				}
			}
		};

		// iOSではより多くのイベントを監視
		if (!this.iosInteractionListenerAdded) {
			this.iosInteractionListenerAdded = true;
			
			// タッチイベントを優先
			document.addEventListener('touchstart', startBGM, { once: true, passive: false });
			document.addEventListener('touchend', startBGM, { once: true, passive: false });
			document.addEventListener('click', startBGM, { once: true });
			document.addEventListener('keydown', startBGM, { once: true });
			
			// ゲームキャンバスでのインタラクション
			const canvas = document.getElementById('gameCanvas');
			if (canvas) {
				canvas.addEventListener('touchstart', startBGM, { once: true, passive: false });
				canvas.addEventListener('touchend', startBGM, { once: true, passive: false });
				canvas.addEventListener('click', startBGM, { once: true });
			}
		}
	}

	setupUserInteractionForAudio() {
		// ユーザーインタラクション後にBGMを再生するための設定
		const startBGM = () => {
			if (this.bgm && this.bgmLoaded && !this.bgmReady) {
				this.bgm.play().then(() => {
					console.log('ユーザーインタラクション後にBGM再生開始');
					this.bgmReady = true;
				}).catch(error => {
					console.error('BGM再生エラー:', error);
				});
			}
		};

		// 一度だけ実行されるようにフラグを設定
		if (!this.interactionListenerAdded) {
			this.interactionListenerAdded = true;
			
			// クリック、タッチ、キー入力でBGMを開始
			document.addEventListener('click', startBGM, { once: true });
			document.addEventListener('touchstart', startBGM, { once: true });
			document.addEventListener('keydown', startBGM, { once: true });
			
			// ゲームキャンバスでのインタラクションも監視
			const canvas = document.getElementById('gameCanvas');
			if (canvas) {
				canvas.addEventListener('click', startBGM, { once: true });
				canvas.addEventListener('touchstart', startBGM, { once: true });
			}
		}
	}

	stopBGM() {
		if (this.bgm) {
			this.bgm.pause();
			this.bgm.currentTime = 0;
			this.bgmReady = false;
		}
	}

	setBGMVolume(volume) {
		if (this.bgm) {
			this.bgm.volume = Math.max(0, Math.min(1, volume));
		}
	}

	// 歩行音を再生
	playWalk() {
		if (this.sounds.walk) {
			if (this.sounds.walk.paused) {
				this.sounds.walk.currentTime = 0;
				this.sounds.walk.play();
			}
		}
	}

	// 歩行音を停止
	stopWalk() {
		if (this.sounds.walk) {
			this.sounds.walk.pause();
			this.sounds.walk.currentTime = 0;
		}
	}
}