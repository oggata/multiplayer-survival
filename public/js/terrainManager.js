class TerrainManager {
	constructor(game) {
		this.game = game;
		this.seed = null;
		this.noise = null;
		this.initializeNoise();
	}

	initializeNoise() {
		// シード値が設定されている場合は使用
		if (this.seed) {
			this.noise = new SimplexNoise(this.seed);
		} else {
			this.noise = new SimplexNoise();
		}
	}

	setSeed(seed) {
		this.seed = seed;
		this.initializeNoise();
	}

	getHeightAt(x, z) {
		if (!this.noise) return 0;

		// ノイズ関数を使用して高さを計算
		const scale = 0.01;
		const height = this.noise.noise2D(x * scale, z * scale);
		
		// 高さを正規化（-1から1の範囲を0から10の範囲に変換）
		const normalizedHeight = (height + 1) * 5;
		
		// 追加の地形変形
		const detailScale = 0.05;
		const detailHeight = this.noise.noise2D(x * detailScale, z * detailScale) * 2;
		
		return normalizedHeight + detailHeight;
	}

	updatePlayerHeight(player) {
		if (!player || !player.position) return;
		
		const targetHeight = this.getHeightAt(player.position.x, player.position.z);
		const currentHeight = player.position.y;
		
		// 滑らかな高さ補間
		const lerpFactor = 0.1;
		player.position.y = currentHeight + (targetHeight - currentHeight) * lerpFactor;
	}

	updateItemHeight(item) {
		if (!item || !item.position) return;
		
		const targetHeight = this.getHeightAt(item.position.x, item.position.z);
		const currentHeight = item.position.y;
		
		// 滑らかな高さ補間
		const lerpFactor = 0.1;
		item.position.y = currentHeight + (targetHeight - currentHeight) * lerpFactor;
	}

	updateAllCharactersHeight() {
		// プレイヤーの高さを更新
		if (this.game.player) {
			this.updatePlayerHeight(this.game.player);
		}

		// 他のプレイヤーの高さを更新
		this.game.players.forEach(player => {
			this.updatePlayerHeight(player);
		});

		// 敵の高さを更新
		this.game.enemies.forEach(enemy => {
			this.updatePlayerHeight(enemy);
		});

		// アイテムの高さを更新
		this.game.itemManager.items.forEach(item => {
			this.updateItemHeight(item);
		});
	}

	getSafeMapPosition() {
		// 安全なマップ位置を取得
		const maxAttempts = 100;
		let attempts = 0;
		
		while (attempts < maxAttempts) {
			const x = (Math.random() - 0.5) * GameConfig.MAP.SIZE;
			const z = (Math.random() - 0.5) * GameConfig.MAP.SIZE;
			const y = this.getHeightAt(x, z);
			
			// 高さが適切な範囲内かチェック
			if (y >= 0 && y <= 20) {
				return new THREE.Vector3(x, y, z);
			}
			
			attempts++;
		}
		
		// フォールバック: 中心位置
		return new THREE.Vector3(0, this.getHeightAt(0, 0), 0);
	}

	findSafeRespawnPosition() {
		// 安全なリスポーン位置を探す
		const maxAttempts = 50;
		let attempts = 0;
		
		while (attempts < maxAttempts) {
			const position = this.getSafeMapPosition();
			
			// 他のプレイヤーから十分な距離があるかチェック
			let isSafe = true;
			this.game.players.forEach(player => {
				if (player.position.distanceTo(position) < 10) {
					isSafe = false;
				}
			});
			
			// 敵から十分な距離があるかチェック
			this.game.enemies.forEach(enemy => {
				if (enemy.position.distanceTo(position) < 15) {
					isSafe = false;
				}
			});
			
			if (isSafe) {
				return position;
			}
			
			attempts++;
		}
		
		// フォールバック: ランダムな位置
		return this.getSafeMapPosition();
	}

	getNearbyPlayerPosition() {
		// 近くのプレイヤーの位置を取得
		if (this.game.players.size === 0) return null;
		
		const playerArray = Array.from(this.game.players.values());
		const randomPlayer = playerArray[Math.floor(Math.random() * playerArray.length)];
		
		if (randomPlayer && randomPlayer.position) {
			// プレイヤーの周辺のランダムな位置を返す
			const offset = new THREE.Vector3(
				(Math.random() - 0.5) * 20,
				0,
				(Math.random() - 0.5) * 20
			);
			const position = randomPlayer.position.clone().add(offset);
			position.y = this.getHeightAt(position.x, position.z);
			return position;
		}
		
		return null;
	}

	getSafeSpawnPosition() {
		// 安全なスポーン位置を取得
		const maxAttempts = 100;
		let attempts = 0;
		
		while (attempts < maxAttempts) {
			const position = this.getSafeMapPosition();
			
			// 他のプレイヤーから十分な距離があるかチェック
			let isSafe = true;
			this.game.players.forEach(player => {
				if (player.position.distanceTo(position) < 20) {
					isSafe = false;
				}
			});
			
			if (isSafe) {
				return position;
			}
			
			attempts++;
		}
		
		// フォールバック: ランダムな位置
		return this.getSafeMapPosition();
	}

	isInViewFrustum(position) {
		// ビューフラスタム内かチェック
		if (!this.game.camera) return true;
		
		const screenPosition = this.game.getScreenPosition(position);
		return screenPosition.x >= -100 && screenPosition.x <= window.innerWidth + 100 &&
			   screenPosition.y >= -100 && screenPosition.y <= window.innerHeight + 100;
	}

	updateObjectVisibility() {
		// オブジェクトの可視性を更新
		const playerPosition = this.game.player ? this.game.player.position : new THREE.Vector3();
		
		// プレイヤーの可視性を更新
		this.game.players.forEach(player => {
			const distance = playerPosition.distanceTo(player.position);
			const isVisible = distance < this.game.visibleDistance1 && this.isInViewFrustum(player.position);
			
			if (player.mesh) {
				player.mesh.visible = isVisible;
			}
		});
		
		// 敵の可視性を更新
		this.game.enemies.forEach(enemy => {
			const distance = playerPosition.distanceTo(enemy.position);
			const isVisible = distance < this.game.visibleDistance1 && this.isInViewFrustum(enemy.position);
			
			if (enemy.mesh) {
				enemy.mesh.visible = isVisible;
			}
		});
		
		// アイテムの可視性を更新
		this.game.itemManager.items.forEach(item => {
			const distance = playerPosition.distanceTo(item.position);
			const isVisible = distance < this.game.objectVisibleDistance1 && this.isInViewFrustum(item.position);
			
			if (item.mesh) {
				item.mesh.visible = isVisible;
			}
		});
	}

	generateTerrainMesh() {
		// 地形メッシュを生成（必要に応じて実装）
		const geometry = new THREE.PlaneGeometry(GameConfig.MAP.SIZE, GameConfig.MAP.SIZE, 100, 100);
		const material = new THREE.MeshLambertMaterial({ 
			color: 0x3a5f3a,
			side: THREE.DoubleSide 
		});
		
		// 頂点の高さを設定
		const vertices = geometry.attributes.position.array;
		for (let i = 0; i < vertices.length; i += 3) {
			const x = vertices[i];
			const z = vertices[i + 2];
			vertices[i + 1] = this.getHeightAt(x, z);
		}
		
		geometry.attributes.position.needsUpdate = true;
		geometry.computeVertexNormals();
		
		const terrainMesh = new THREE.Mesh(geometry, material);
		terrainMesh.rotation.x = -Math.PI / 2;
		terrainMesh.receiveShadow = true;
		
		return terrainMesh;
	}
} 