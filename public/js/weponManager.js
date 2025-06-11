/**
 * 気象システムを管理するクラス
 */
class WeponManager {
    
    constructor(game) {
        this.game = game;
        this.bullets = game.bullets;
        this.scene = game.scene;
        this.socket = game.socket;
        this.enemies = game.enemies;
        this.items = game.items;
        this.raycast = game.raycast;
        //this.playerModel = game.playerModel;
        this.playerStatus = game.playerStatus;
        this.lastShootTime = 0;
        this.enemyBullets = new Map();  
    }
    shoot(playerModel) {
		// 発射間隔チェック
		const now = Date.now();
		let shootInterval = 800; // デフォルトの間隔
		var aa = this.game.playerStatus.getCurrentWeponType();
		//console.log('aa', aa[aa.length - 1]);	

		const weaponId = aa[aa.length - 1] || 'bullet001';
		const shootPosition = playerModel.getPosition().clone();

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
		if (!this.game.canShoot) {
			return;
		}




		// プレイヤーの向きを取得
		const direction = new THREE.Vector3(0, 0, -1);
		direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), playerModel.getRotation().y);

		// 武器タイプに応じた発射パターン
		switch (weaponId) {
			case 'lasergun':
				// レーザーガン：3発連続発射
				for (let i = 0; i < 3; i++) {
					const bullet = this.createBullet(shootPosition, direction, this.socket.id, weaponId);
					this.game.bullets.push(bullet);
				}
				break;

			case 'grenadelauncher':
				// グレネードランチャー：爆発性の弾
				const grenade = this.createBullet(shootPosition, direction, this.socket.id, weaponId);
				grenade.explosionRadius = 5;
				grenade.explosionDamage = 30;
				this.game.bullets.push(grenade);
				break;

			case 'flamethrower':
				// フレイムスローワー：広範囲に広がる炎
				for (let i = -2; i <= 2; i++) {
					const spreadDirection = direction.clone();
					spreadDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), i * 0.2);
					const bullet = this.createBullet(shootPosition, spreadDirection, this.socket.id, weaponId);
					this.game.bullets.push(bullet);
				}
				break;

			case 'plasmacannon':
				// プラズマキャノン：チェーンライトニング効果
				const plasma = this.game.createBullet(shootPosition, direction, this.socket.id, weaponId);
				plasma.chainLightning = true;
				plasma.chainRange = 5;
				plasma.chainDamage = 15;
				this.game.bullets.push(plasma);
				break;

			case 'missilelauncher':
				// ミサイルランチャー：追尾ミサイル
				const missile = this.game.createBullet(shootPosition, direction, this.socket.id, weaponId);
				missile.homing = true;
				missile.homingRange = 20;
				missile.homingSpeed = 0.1;
				this.game.bullets.push(missile);
				break;

			case 'shotgun':
				// ショットガン：広範囲に広がる弾
				for (let i = -1; i <= 1; i++) {
					const spreadDirection = direction.clone();
					spreadDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), i * 0.2);
					const bullet = this.createBullet(shootPosition, spreadDirection, this.socket.id, weaponId);
					this.game.bullets.push(bullet);
				}
				break;

			case 'machinegun':
				// マシンガン：5発連続発射
				for (let i = 0; i < 5; i++) {
					const bullet = this.createBullet(shootPosition, direction, this.socket.id, weaponId);
					this.  game.bullets.push(bullet);
				}
				break;

			default:
				// デフォルト武器：通常の弾
				const bullet = this.createBullet(shootPosition, direction, this.socket.id, weaponId);
				this.game.bullets.push(bullet);
				break;
		}
		// サーバーに発射情報を送信
		this.game.socket.emit('shoot', {
			position: shootPosition,
			direction: direction,
			weponId: weaponId,
			bulletDamage: this.bullets[this.bullets.length - 1].getDamage()
		});

		// 最後の発射時間を更新
		this.lastShootTime = Date.now();
	}

	createBullet(position, direction, playerId, weaponId) {
		const bullet = new Bullet(this.scene, position, direction, playerId, weaponId);
		return bullet;
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
							this.game.socket.emit('enemyDied', enemyId);
							this.game.handleEnemyDeath(enemyId);
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
} 