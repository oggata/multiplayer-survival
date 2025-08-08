class SettingsManager {
	constructor(game) {
		this.game = game;
		this.setupSettingsButton();
		// 初期設定を適用
		this.applySettings();
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
		const cameraModeSelect = document.getElementById('cameraModeSelect');

		// モーダルを表示
		settingsModal.style.display = 'block';

		// 現在の設定を読み込み
		this.loadSettings();

		// 現在のプレイヤー名を表示
		if (playerNameInput && this.game.socket) {
			const currentPlayer = this.game.players.get(this.game.socket.id);
			if (currentPlayer && currentPlayer.name) {
				playerNameInput.value = currentPlayer.name;
			} else {
				playerNameInput.value = window.neonAPI.userName;
			}
		}

		// 現在のカメラモードを設定
		if (cameraModeSelect) {
			cameraModeSelect.value = this.game.cameraMode;
		}
	}

	async savePlayerName() {
		const playerNameInput = document.getElementById('playerNameInput');
		if (!playerNameInput || !this.game.socket) {
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

		console.log('プレイヤー名保存開始:', { socketId: this.game.socket.id, newName: newName });

		try {
			// サーバーに名前変更を送信
			const result = await window.neonAPI.updatePlayerName(this.game.socket.id, newName);
			
			if (result && result.success) {
				// ローカルのユーザー情報も更新
				window.neonAPI.setUserInfo(null, newName);
				window.neonAPI.saveUserInfo();
				
				// 成功メッセージ
				this.game.showMessage('プレイヤー名が更新されました');
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
		const cameraModeSelect = document.getElementById('cameraModeSelect');

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

		// カメラモード設定を保存
		if (cameraModeSelect) {
			localStorage.setItem('camera_mode', cameraModeSelect.value);
		}

		// 設定を適用
		this.applySettings();

		// 成功メッセージ
		this.game.showMessage('設定が保存されました');

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
		const cameraModeSelect = document.getElementById('cameraModeSelect');

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

		// カメラモード設定を読み込み
		if (cameraModeSelect) {
			const savedCameraMode = localStorage.getItem('camera_mode');
			cameraModeSelect.value = savedCameraMode || 'third';
		}
	}

	applySettings() {
		// BGM設定を適用
		const bgmEnabled = localStorage.getItem('bgm_enabled') || 'on';
		if (this.game.audioManager) {
			if (bgmEnabled === 'off') {
				this.game.audioManager.stopBGM();
			} else {
				this.game.audioManager.playBGM();
			}
		}

		// グラフィック設定を適用
		const graphicsQuality = localStorage.getItem('graphics_quality') || 'low';
		this.applyGraphicsSettings(graphicsQuality);

		// 言語設定を適用
		const language = localStorage.getItem('language') || 'ja';
		this.applyLanguageSettings(language);

		// カメラモード設定を適用
		const cameraMode = localStorage.getItem('camera_mode') || 'third';
		this.game.cameraMode = cameraMode;
		this.game.updateCameraPosition();
	}

	applyGraphicsSettings(quality) {
		switch (quality) {
			case 'low':
				// 低品質設定
				//this.game.renderer.setPixelRatio(1);
				//this.game.renderer.shadowMap.enabled = false;
				this.game.visibleDistance1 = 180;
				this.game.objectVisibleDistance1 = 180;
				break;
			case 'medium':
				// 中品質設定
				//this.game.renderer.setPixelRatio(1.5);
				//this.game.renderer.shadowMap.enabled = true;
				this.game.visibleDistance1 = 200;
				this.game.objectVisibleDistance1 = 200;
				break;
			case 'high':
				// 高品質設定
				//this.game.renderer.setPixelRatio(2);
				//this.game.renderer.shadowMap.enabled = true;
				this.game.visibleDistance1 = 250;
				this.game.objectVisibleDistance1 = 250;
				break;
		}
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

		// ゲームオーバー画面のランキングボタンのテキストを更新
		const gameOverRankingButton = document.getElementById('gameOverRankingButton');
		if (gameOverRankingButton) {
			gameOverRankingButton.textContent = texts.ranking;
		}

		// 設定画面のランキングボタンのテキストを更新
		const settingsRankingButton = document.getElementById('settingsRankingButton');
		if (settingsRankingButton) {
			settingsRankingButton.textContent = texts.ranking;
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
} 