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
		//console.log(aa);	

		const weaponId = aa[aa.length - 1] || 'bullet001';
		const shootPosition = playerModel.getPosition().clone();

		shootPosition.y += 1.1; // 発射位置を少し上げる
		
		// 武器の設定を定義
		const weaponConfigs = {
			lasergun: GameConfig.WEAPON.LASERGUN,
			grenadelauncher: GameConfig.WEAPON.GRENADELAUNCHER,
			flamethrower: GameConfig.WEAPON.FLAMETHROWER,
			plasmacannon: GameConfig.WEAPON.PLASMACANNON,
			missilelauncher: GameConfig.WEAPON.MISSILELAUNCHER,
			shotgun: GameConfig.WEAPON.SHOTGUN,
			magnum: GameConfig.WEAPON.MAGNUM,
			sniperrifle: GameConfig.WEAPON.SNIPERRIFLE,
			rocketlauncher: GameConfig.WEAPON.ROCKETLAUNCHER,
			machinegun: GameConfig.WEAPON.MACHINEGUN,
			bullet001: GameConfig.WEAPON.BULLET001
		};

		// 武器の設定からreload値を取得
		const weaponConfig = weaponConfigs[weaponId];
		shootInterval = (weaponConfig?.reload || 0.8) * 1000; // デフォルトは0.8秒

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
				missile.homingRange = 30;
				missile.homingSpeed = 1;
				this.game.bullets.push(missile);
				break;

			case 'shotgun':
				// ショットガン：広範囲に広がる弾
				for (let i = -1; i <= 1; i++) {
					const spreadDirection = direction.clone();
					spreadDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), i * 0.2);
					const bullet = this.createBullet(shootPosition, spreadDirection, this.socket.id, weaponId);
					bullet.fireLauncher = true;
					this.game.bullets.push(bullet);
				}
				break;

			case 'machinegun':
				// マシンガン：5発連続発射
				for (let i = 0; i < 5; i++) {
					const bullet = this.createBullet(shootPosition, direction, this.socket.id, weaponId);
					this.game.bullets.push(bullet);
				}
				break;

			default:
				// デフォルト武器：通常の弾
				const bullet = this.createBullet(shootPosition, direction, this.socket.id, weaponId);
				//bullet.bioWeapon = true;
				//bullet.nanoSwarm = true;
				//bullet.fireLauncher = true;
				//bullet.freezeRay = true;
				//bullet.soundCannon = true;
				//bullet.nanoSwarmLauncher = true;
				//bullet.bubbleGun = true;	
				//bullet.homing = true;	
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

						if (bullet.explosionRadius){

						}else{
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
			}

			// 爆発性の弾の処理
			if (bullet.explosionRadius && bullet.getAge() >= bullet.lifetime) {
				this.createExplosion(bullet.model.position, bullet.explosionRadius, bullet.explosionDamage);
				this.game.scene.remove(bullet.model);
				this.bullets.splice(i, 1);
				continue;
			}

			// チェーンライトニングの処理
			if (bullet.chainLightning) {
				const nearbyEnemies = this.getNearbyEnemies(bullet.model.position,35);
				for (const enemy of nearbyEnemies) {
					enemy.takeDamage(bullet.chainDamage);
					this.createLightningEffect(bullet.model.position, enemy.model.position);
				}
			}

			// バイオウェポンの処理
			if (bullet.bioWeapon) {
				this.createBioSlimeEffect(bullet.model.position);
			}

			// ナノスウォームの処理
			if (bullet.nanoSwarm) {
				this.createNanoSwarmEffect(bullet.model.position);
			}

			// ファイアランチャーの処理
			if (bullet.fireLauncher) {
				this.createFireEffect(bullet.model.position, bullet.direction);
			}

			// フリーズレイの処理
			if (bullet.freezeRay) {
				this.createFreezeRayEffect(bullet.model.position, bullet.direction);
			}

			// サウンドキャノンの処理
			if (bullet.soundCannon) {
				this.createSoundWaveEffect(bullet.model.position);
			}

			// ナノスウォームランチャーの処理
			if (bullet.nanoSwarmLauncher) {
				this.createNanoSwarmLauncherEffect(bullet.model.position, bullet.direction);
			}

			// バブルガンの処理
			if (bullet.bubbleGun) {
				this.createBubbleEffect(bullet.model.position);
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
    
	getNearbyEnemies(position, range) {
		const nearbyEnemies = [];
		this.game.enemies.forEach((enemy, enemyId) => {
			if (!enemy || enemy.isDead) return;
			const distance = enemy.model.position.distanceTo(position);
			if (distance <= range) {
				nearbyEnemies.push(enemy);
			}
		});
		return nearbyEnemies;
	}

	findNearestEnemy(position, range) {
		let nearestEnemy = null;
		let minDistance = range;

		this.game.enemies.forEach((enemy, enemyId) => {
			if (!enemy || enemy.isDead) return;
			const distance = enemy.model.position.distanceTo(position);
			if (distance < minDistance) {
				minDistance = distance;
				nearestEnemy = enemy;
			}
		});

		return nearestEnemy;
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
			this.game.scene.add(explosion);
	
			// 爆発のアニメーション
			const duration = 0.5;
			const startTime = Date.now();
			const animate = () => {
				const elapsed = (Date.now() - startTime) / 1000;
				if (elapsed < duration) {
					//console.log(elapsed);
					const scale = 1 + elapsed * 2;
					explosion.scale.set(scale, scale, scale);
					explosion.material.opacity = 0.8 * (1 - elapsed / duration);
					requestAnimationFrame(animate);
				} else {
					//console.log('remove');
					this.game.scene.remove(explosion);
				}
			};
			animate();
	
			// 範囲内の敵にダメージを与える
			this.game.enemies.forEach((enemy, enemyId) => {
				if (!enemy || enemy.isDead) return;
				const distance = enemy.model.position.distanceTo(position);
				if (distance <= radius) {
					const damageRatio = 1 - (distance / radius);
					const actualDamage = Math.floor(damage * damageRatio);
					enemy.takeDamage(actualDamage);
					this.game.socket.emit('enemyHit', {
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
	
		createBioSlimeEffect(position) {
			const particleCount = 20;
			const particles = new THREE.Group();
			
			for (let i = 0; i < particleCount; i++) {
				const geometry = new THREE.SphereGeometry(0.2, 8, 8);
				const material = new THREE.MeshPhongMaterial({
					color: 0x00ff00,
					transparent: true,
					opacity: 0.8
				});
				const particle = new THREE.Mesh(geometry, material);
				
				// ランダムな方向に飛散
				const angle = Math.random() * Math.PI * 2;
				const speed = 0.1 + Math.random() * 0.2;
				particle.velocity = new THREE.Vector3(
					Math.cos(angle) * speed,
					Math.random() * speed,
					Math.sin(angle) * speed
				);
				
				particle.position.copy(position);
				particles.add(particle);
			}
			
			this.scene.add(particles);
			
			// アニメーション
			const duration = 1.0;
			const startTime = Date.now();
			const animate = () => {
				const elapsed = (Date.now() - startTime) / 1000;
				if (elapsed < duration) {
					particles.children.forEach(particle => {
						particle.position.add(particle.velocity);
						particle.velocity.y -= 0.01; // 重力効果
						particle.material.opacity = 0.8 * (1 - elapsed / duration);
					});
					requestAnimationFrame(animate);
				} else {
					this.scene.remove(particles);
				}
			};
			animate();
		}

		createNanoSwarmEffect(position) {
			const particleCount = 50;
			const particles = new THREE.Group();
			
			for (let i = 0; i < particleCount; i++) {
				const geometry = new THREE.SphereGeometry(0.05, 8, 8);
				const material = new THREE.MeshPhongMaterial({
					color: 0x00ffff,
					emissive: 0x00ffff,
					emissiveIntensity: 0.5
				});
				const particle = new THREE.Mesh(geometry, material);
				
				// 群れをなす動きのための初期位置
				particle.position.copy(position);
				particle.position.x += (Math.random() - 0.5) * 0.5;
				particle.position.y += (Math.random() - 0.5) * 0.5;
				particle.position.z += (Math.random() - 0.5) * 0.5;
				
				particles.add(particle);
			}
			
			this.scene.add(particles);
			
			// アニメーション
			const duration = 2.0;
			const startTime = Date.now();
			const animate = () => {
				const elapsed = (Date.now() - startTime) / 1000;
				if (elapsed < duration) {
					particles.children.forEach(particle => {
						// 群れをなす動き
						particle.position.x += Math.sin(elapsed * 5 + particle.position.x) * 0.01;
						particle.position.y += Math.cos(elapsed * 5 + particle.position.y) * 0.01;
						particle.position.z += Math.sin(elapsed * 3 + particle.position.z) * 0.01;
					});
					requestAnimationFrame(animate);
				} else {
					this.scene.remove(particles);
				}
			};
			animate();
		}

		createFireEffect(position, direction) {
			const particleCount = 2;
			const particles = new THREE.Group();
			
			for (let i = 0; i < particleCount; i++) {
				const geometry = new THREE.SphereGeometry(0.1, 8, 8);
				const material = new THREE.MeshPhongMaterial({
					color: 0xff3300,
					emissive: 0xff6600,
					emissiveIntensity: 0.8
				});
				const particle = new THREE.Mesh(geometry, material);
				
				particle.position.copy(position);
				particle.velocity = direction.clone().multiplyScalar(0.2 + Math.random() * 0.3);
				particle.velocity.x += Math.random() * 0.1;
				particle.velocity.z += Math.random() * 0.1;
				particle.velocity.y += Math.random() * 0.1;
				
				particles.add(particle);
			}
			
			this.scene.add(particles);
			
			// アニメーション
			const duration = 0.5;
			const startTime = Date.now();
			const animate = () => {
				const elapsed = (Date.now() - startTime) / 1000;
				if (elapsed < duration) {
					particles.children.forEach(particle => {
						particle.position.add(particle.velocity);
						particle.velocity.y -= 0.01; // 重力効果
						particle.material.opacity = 0.8 * (1 - elapsed / duration);
					});
					requestAnimationFrame(animate);
				} else {
					this.scene.remove(particles);
				}
			};
			animate();
		}

		createFreezeRayEffect(position, direction) {
			const geometry = new THREE.CylinderGeometry(0.1, 0.1, 2, 8);
			const material = new THREE.MeshPhongMaterial({
				color: 0x00ffff,
				transparent: true,
				opacity: 0.8
			});
			const iceBeam = new THREE.Mesh(geometry, material);
			
			iceBeam.position.copy(position);
			iceBeam.lookAt(position.clone().add(direction));
			
			this.scene.add(iceBeam);
			
			// アニメーション
			const duration = 0.3;
			const startTime = Date.now();
			const animate = () => {
				const elapsed = (Date.now() - startTime) / 1000;
				if (elapsed < duration) {
					iceBeam.rotation.z += 0.2; // 螺旋回転
					iceBeam.position.add(direction.clone().multiplyScalar(0.1));
					iceBeam.material.opacity = 0.8 * (1 - elapsed / duration);
					requestAnimationFrame(animate);
				} else {
					this.scene.remove(iceBeam);
				}
			};
			animate();
		}

		createSoundWaveEffect(position) {
			const waveCount = 5;
			const waves = new THREE.Group();
			
			for (let i = 0; i < waveCount; i++) {
				const geometry = new THREE.RingGeometry(0.5 + i * 0.5, 0.7 + i * 0.5, 32);
				const material = new THREE.MeshPhongMaterial({
					color: 0x00ffff,
					transparent: true,
					opacity: 0.5,
					side: THREE.DoubleSide
				});
				const wave = new THREE.Mesh(geometry, material);
				wave.position.copy(position);
				wave.rotation.x = Math.PI / 2;
				waves.add(wave);
			}
			
			this.scene.add(waves);
			
			// アニメーション
			const duration = 1.0;
			const startTime = Date.now();
			const animate = () => {
				const elapsed = (Date.now() - startTime) / 1000;
				if (elapsed < duration) {
					waves.children.forEach((wave, index) => {
						const scale = 1 + elapsed * 2 + index * 0.2;
						wave.scale.set(scale, scale, scale);
						wave.material.opacity = 0.5 * (1 - elapsed / duration);
					});
					requestAnimationFrame(animate);
				} else {
					this.scene.remove(waves);
				}
			};
			animate();
		}

		createNanoSwarmLauncherEffect(position, direction) {
			const particleCount = 100;
			const particles = new THREE.Group();
			
			for (let i = 0; i < particleCount; i++) {
				const geometry = new THREE.SphereGeometry(0.03, 8, 8);
				const material = new THREE.MeshPhongMaterial({
					color: 0x00ffff,
					emissive: 0x00ffff,
					emissiveIntensity: 0.8
				});
				const particle = new THREE.Mesh(geometry, material);
				
				// 初期位置を銃口付近に設定
				particle.position.copy(position);
				particle.position.x += (Math.random() - 0.5) * 0.2;
				particle.position.y += (Math.random() - 0.5) * 0.2;
				particle.position.z += (Math.random() - 0.5) * 0.2;
				
				// 発射方向に沿った速度
				particle.velocity = direction.clone().multiplyScalar(0.3 + Math.random() * 0.2);
				
				particles.add(particle);
			}
			
			this.scene.add(particles);
			
			// アニメーション
			const duration = 1.5;
			const startTime = Date.now();
			const animate = () => {
				const elapsed = (Date.now() - startTime) / 1000;
				if (elapsed < duration) {
					particles.children.forEach(particle => {
						// 群れをなす動き
						particle.position.add(particle.velocity);
						particle.velocity.x += Math.sin(elapsed * 10) * 0.01;
						particle.velocity.y += Math.cos(elapsed * 10) * 0.01;
						particle.velocity.z += Math.sin(elapsed * 8) * 0.01;
						
						// 徐々に透明化
						particle.material.opacity = 0.8 * (1 - elapsed / duration);
					});
					requestAnimationFrame(animate);
				} else {
					this.scene.remove(particles);
				}
			};
			animate();
		}

		createBubbleEffect(position) {
			const bubbleCount = 30;
			const bubbles = new THREE.Group();
			
			for (let i = 0; i < bubbleCount; i++) {
				const geometry = new THREE.SphereGeometry(0.1 + Math.random() * 0.1, 16, 16);
				const material = new THREE.MeshPhongMaterial({
					color: 0x88ccff,
					transparent: true,
					opacity: 0.6,
					envMap: this.scene.environment
				});
				const bubble = new THREE.Mesh(geometry, material);
				
				// ランダムな方向に飛散
				const angle = Math.random() * Math.PI * 2;
				const speed = 0.1 + Math.random() * 0.2;
				bubble.velocity = new THREE.Vector3(
					Math.cos(angle) * speed,
					Math.random() * speed,
					Math.sin(angle) * speed
				);
				
				bubble.position.copy(position);
				bubbles.add(bubble);
			}
			
			this.scene.add(bubbles);
			
			// アニメーション
			const duration = 2.0;
			const startTime = Date.now();
			const animate = () => {
				const elapsed = (Date.now() - startTime) / 1000;
				if (elapsed < duration) {
					bubbles.children.forEach(bubble => {
						// 上昇する動き
						bubble.position.add(bubble.velocity);
						bubble.velocity.y += 0.01; // 上昇効果
						
						// ゆらゆらと揺れる動き
						bubble.position.x += Math.sin(elapsed * 5) * 0.01;
						bubble.position.z += Math.cos(elapsed * 5) * 0.01;
						
						// 徐々に透明化
						bubble.material.opacity = 0.6 * (1 - elapsed / duration);
					});
					requestAnimationFrame(animate);
				} else {
					this.scene.remove(bubbles);
				}
			};
			animate();
		}
	
} 