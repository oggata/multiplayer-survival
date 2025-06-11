/**
 * 気象システムを管理するクラス
 */
class Raycast {
    
    constructor(game) {
        this.game = game;
        this.fieldMap = game.fieldMap;
        this.testCount = 0;
        this.playerModel = game.playerModel;
        this.enemies = game.enemies;
        this.items = game.items;
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