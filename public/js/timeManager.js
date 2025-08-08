class TimeManager {
	constructor(game) {
		this.game = game;
		this.clock = new THREE.Clock();
		this.gameTime = 0; // ゲーム内時間（秒）
		this.dayLength = GameConfig.TIME.DAY_LENGTH; // 1日の長さ（秒）
		this.timeOfDay = 0; // 0-1の値（0: 夜明け, 0.25: 朝, 0.5: 昼, 0.75: 夕方, 1: 夜）
		this.sunLight = null; // 太陽光
		this.ambientLight = null; // 環境光
		this.initializeLights();
	}

	initializeLights() {
		// 太陽光の初期化
		this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
		this.sunLight.position.set(0, 100, 0);
		this.sunLight.castShadow = true;
		this.sunLight.shadow.mapSize.width = 2048;
		this.sunLight.shadow.mapSize.height = 2048;
		this.sunLight.shadow.camera.near = 0.5;
		this.sunLight.shadow.camera.far = 500;
		this.sunLight.shadow.camera.left = -100;
		this.sunLight.shadow.camera.right = 100;
		this.sunLight.shadow.camera.top = 100;
		this.sunLight.shadow.camera.bottom = -100;
		this.game.scene.add(this.sunLight);

		// 環境光の初期化
		this.ambientLight = new THREE.AmbientLight(0x404040, 0.3);
		this.game.scene.add(this.ambientLight);
	}

	updateTimeOfDay() {
		// ゲーム時間を更新
		this.gameTime += this.clock.getDelta();
		this.timeOfDay = (this.gameTime % this.dayLength) / this.dayLength;

		// 太陽の位置を更新
		this.updateSunPosition();
		
		// 空の色を更新
		this.updateSkyColor();
		
		// 霧の色を更新
		this.updateFogColor();
		
		// 時間表示を更新
		this.updateTimeDisplay();
		
		// 霧の密度を更新
		this.updateFog();
		
		// プレイヤーのライト強度を更新
		this.updatePlayerLightIntensity();
	}

	updateSunPosition() {
		if (!this.sunLight) return;

		// 太陽の角度を計算（0-2π）
		const sunAngle = this.timeOfDay * Math.PI * 2;
		
		// 太陽の位置を設定
		const sunDistance = 100;
		this.sunLight.position.x = Math.sin(sunAngle) * sunDistance;
		this.sunLight.position.y = Math.cos(sunAngle) * sunDistance;
		this.sunLight.position.z = 0;

		// 太陽の強度を時間に応じて調整
		let intensity = 0;
		if (this.timeOfDay > 0.1 && this.timeOfDay < 0.9) {
			// 日中は強い光
			intensity = 1.0;
		} else if (this.timeOfDay > 0.05 && this.timeOfDay < 0.95) {
			// 朝暮れは中程度の光
			intensity = 0.5;
		} else {
			// 夜は弱い光
			intensity = 0.1;
		}
		this.sunLight.intensity = intensity;
	}

	updateSkyColor() {
		let skyColor;
		if (this.timeOfDay < 0.25) {
			// 夜明け
			skyColor = new THREE.Color(0x87CEEB);
		} else if (this.timeOfDay < 0.5) {
			// 朝
			skyColor = new THREE.Color(0x87CEEB);
		} else if (this.timeOfDay < 0.75) {
			// 昼
			skyColor = new THREE.Color(0x87CEEB);
		} else if (this.timeOfDay < 0.9) {
			// 夕方
			skyColor = new THREE.Color(0xFF7F50);
		} else {
			// 夜
			skyColor = new THREE.Color(0x191970);
		}
		this.game.scene.background = skyColor;
	}

	updateFogColor() {
		let fogColor;
		if (this.timeOfDay < 0.25) {
			// 夜明け
			fogColor = new THREE.Color(0x87CEEB);
		} else if (this.timeOfDay < 0.5) {
			// 朝
			fogColor = new THREE.Color(0x87CEEB);
		} else if (this.timeOfDay < 0.75) {
			// 昼
			fogColor = new THREE.Color(0x87CEEB);
		} else if (this.timeOfDay < 0.9) {
			// 夕方
			fogColor = new THREE.Color(0xFF7F50);
		} else {
			// 夜
			fogColor = new THREE.Color(0x191970);
		}
		this.game.scene.fog.color = fogColor;
	}

	updateTimeDisplay() {
		// 時間表示の更新（必要に応じて実装）
		const hours = Math.floor(this.timeOfDay * 24);
		const minutes = Math.floor((this.timeOfDay * 24 - hours) * 60);
		const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
		
		// 時間表示要素がある場合は更新
		const timeElement = document.getElementById('time');
		if (timeElement) {
			timeElement.textContent = timeString;
		}
	}

	updateFog() {
		// 霧の密度を時間に応じて調整
		let fogDensity;
		if (this.timeOfDay < 0.1 || this.timeOfDay > 0.9) {
			// 夜は霧が濃い
			fogDensity = 0.03;
		} else if (this.timeOfDay < 0.25 || this.timeOfDay > 0.75) {
			// 朝暮れは中程度
			fogDensity = 0.02;
		} else {
			// 昼は薄い
			fogDensity = 0.01;
		}
		
		if (this.game.scene.fog) {
			this.game.scene.fog.density = fogDensity;
		}
	}

	updatePlayerLightIntensity() {
		if (!this.game.player || !this.game.player.light) return;

		// プレイヤーのライト強度を時間に応じて調整
		let intensity = 0;
		if (this.timeOfDay < 0.1 || this.timeOfDay > 0.9) {
			// 夜は強い光
			intensity = 2.0;
		} else if (this.timeOfDay < 0.25 || this.timeOfDay > 0.75) {
			// 朝暮れは中程度
			intensity = 1.0;
		} else {
			// 昼は弱い光
			intensity = 0.5;
		}
		this.game.player.light.intensity = intensity;
	}

	updateLightDirection() {
		if (!this.sunLight) return;

		// 太陽の方向を更新
		const sunAngle = this.timeOfDay * Math.PI * 2;
		this.sunLight.position.x = Math.sin(sunAngle) * 100;
		this.sunLight.position.y = Math.cos(sunAngle) * 100;
		this.sunLight.position.z = 0;
	}

	getTimeOfDay() {
		return this.timeOfDay;
	}

	getGameTime() {
		return this.gameTime;
	}

	getDayLength() {
		return this.dayLength;
	}
} 