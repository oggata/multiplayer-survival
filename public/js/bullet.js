class Bullet {
	constructor(scene, position, direction, playerId, bulletType) {
		this.scene=scene;
		this.playerId=playerId;

		this.speed=20;
		this.lifetime=3.0; // 5秒後に消える
		this.damage=10;

		this.color=0xfbff00;
		this.emissiveIntensity = 1.2;
		// エフェクト用の変数
		this.trailParticles = [];
		this.trailGeometry = new THREE.BufferGeometry();
		this.trailMaterial = new THREE.PointsMaterial({
			color: this.color,
			size: 0.01,
			transparent: true,
			opacity: 0.6,
			blending: THREE.AdditiveBlending,
			temissiveIntensity:1.5,
			depthWrite: false // 深度バッファへの書き込みを無効化
		});
		this.trailPoints = new THREE.Points(this.trailGeometry, this.trailMaterial);
		this.scene.add(this.trailPoints);

		// GameConfigから武器の設定を取得
		const config = GameConfig.WEAPON[bulletType.toUpperCase()] || GameConfig.WEAPON.BULLET001;
		this.speed = config.speed;
		this.lifetime = config.lifetime;
		this.damage = config.damage;
		this.color = config.color;

		// 弾丸のモデルを作成
		this.model=this.createModel(bulletType);
		this.model.position.copy(position);

		// 移動方向を設定
		this.direction=direction.clone().normalize();
		this.velocity=this.direction.clone().multiplyScalar(this.speed);

		// 重力の影響を受ける弾かどうかを設定
		this.isAffectedByGravity = bulletType === "grenadelauncher";
		this.gravity = 9.8; // 重力加速度

		// シリンダー形状の弾の場合、進行方向に合わせて回転を設定
		if (bulletType === "lasergun" || bulletType === "missilelauncher") {
			// 進行方向のベクトルから回転角を計算
			const angle = Math.atan2(this.direction.x, this.direction.z);
			// シリンダーを進行方向に向ける（底面が進行方向に向くように）
			this.model.rotation.set(Math.PI / 2, angle, 0);
		}

		// シーンに追加
		this.scene.add(this.model);

		// 作成時間を記録
		this.createdAt=Date.now();
	}

	createModel(bulletType) {
		if(bulletType=="bullet001") {
			// 弾丸のジオメトリとマテリアルを作成
			const geometry=new THREE.SphereGeometry(0.05, 3, 3);

			const material=new THREE.MeshPhongMaterial( {
					color:this.color, //yellow
					emissive:this.color,
					emissiveIntensity: 2
				}

			);
			// メッシュを作成
			const model=new THREE.Mesh(geometry, material);
			// 影を設定
			model.castShadow=true;
			return model;
		}
		if(bulletType=="shotgun") {
			// 弾丸のジオメトリとマテリアルを作成
			const geometry=new THREE.SphereGeometry(0.13, 12, 12);

			const material=new THREE.MeshPhongMaterial( {
					color: "0xfbff00", //yellow
					emissive: 0xfbff00,
					emissiveIntensity: 0.8
				}

			);
			// メッシュを作成
			const model=new THREE.Mesh(geometry, material);
			// 影を設定
			model.castShadow=true;
			return model;
		}

		if(bulletType=="machinegun") {
			// 弾丸のジオメトリとマテリアルを作成
			const geometry=new THREE.SphereGeometry(0.1, 12, 12);

			const material=new THREE.MeshPhongMaterial( {
					color:this.color, //yellow
					emissive:this.color,
					emissiveIntensity: 0.8
				}

			);
			// メッシュを作成
			const model=new THREE.Mesh(geometry, material);
			// 影を設定
			model.castShadow=true;
			return model;
		}

		if(bulletType=="magnum") {
			// 弾丸のジオメトリとマテリアルを作成
			const geometry=new THREE.SphereGeometry(0.16, 12, 12);

			const material=new THREE.MeshPhongMaterial( {
					color:this.color, //yellow
					emissive:this.color,
					emissiveIntensity: 0.8
				}

			);
			// メッシュを作成
			const model=new THREE.Mesh(geometry, material);
			// 影を設定
			model.castShadow=true;
			return model;
		}

		if(bulletType=="sniperrifle") {
			// 弾丸のジオメトリとマテリアルを作成
			const geometry=new THREE.SphereGeometry(0.18, 12, 12);

			const material=new THREE.MeshPhongMaterial( {
					color:this.color, //yellow
					emissive:this.color,
					emissiveIntensity: 0.8
				}

			);
			// メッシュを作成
			const model=new THREE.Mesh(geometry, material);
			// 影を設定
			model.castShadow=true;
			return model;
		}

		if(bulletType=="rocketlauncher") {
			// 弾丸のジオメトリとマテリアルを作成
			const geometry=new THREE.SphereGeometry(0.21, 12, 12);

			const material=new THREE.MeshPhongMaterial( {
					color:this.color, //yellow
					emissive:this.color,
					emissiveIntensity: 0.8
				}

			);
			// メッシュを作成
			const model=new THREE.Mesh(geometry, material);
			// 影を設定
			model.castShadow=true;
			return model;
		}

		if(bulletType=="lasergun") {
			const geometry = new THREE.CylinderGeometry(0.05, 0.05, 2.0, 8);
			const material = new THREE.MeshPhongMaterial({
				color: this.color,
				emissive: this.color,
				emissiveIntensity: 0.8,
				transparent: true,
				opacity: 0.8
			});
			const model = new THREE.Mesh(geometry, material);
			model.castShadow = true;
			return model;
		}

		if(bulletType=="grenadelauncher") {
			const geometry = new THREE.SphereGeometry(0.2, 16, 16);
			const material = new THREE.MeshPhongMaterial({
				color: this.color,
				emissive: this.color,
				emissiveIntensity: 0.5
			});
			const model = new THREE.Mesh(geometry, material);
			model.castShadow = true;
			return model;
		}

		if(bulletType=="flamethrower") {
			const geometry = new THREE.ConeGeometry(0.2, 1.0, 8);
			const material = new THREE.MeshPhongMaterial({
				color: this.color,
				emissive: this.color,
				emissiveIntensity: 0.8,
				transparent: true,
				opacity: 0.6
			});
			const model = new THREE.Mesh(geometry, material);
			model.castShadow = true;
			return model;
		}

		if(bulletType=="plasmacannon") {
			const geometry = new THREE.SphereGeometry(0.15, 16, 16);
			const material = new THREE.MeshPhongMaterial({
				color: this.color,
				emissive: this.color,
				emissiveIntensity: 0.8,
				transparent: true,
				opacity: 0.7
			});
			const model = new THREE.Mesh(geometry, material);
			model.castShadow = true;
			return model;
		}

		if(bulletType=="missilelauncher") {
			const geometry = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8);
			const material = new THREE.MeshPhongMaterial({
				color: this.color,
				emissive: this.color,
				emissiveIntensity: 0.5
			});
			const model = new THREE.Mesh(geometry, material);
			model.castShadow = true;
			return model;
		}

		return model;
	}

	update(deltaTime) {
		// 弾丸を移動
		if (this.isAffectedByGravity) {
			// 重力の影響を受ける場合
			this.velocity.y -= this.gravity * deltaTime; // Y軸方向に重力を適用
		}
		this.model.position.add(this.velocity.clone().multiplyScalar(deltaTime));

		// 軌跡エフェクトの更新
		this.updateTrailEffect();

		// 寿命をチェック
		const age=(Date.now() - this.createdAt) / 1000;

		if (age > this.lifetime) {
			this.dispose();
			return false;
		}

		return true;
	}

	updateTrailEffect() {
		// 新しいパーティクルを追加（より頻繁に生成）
		if (Math.random() < 0.5 && this.trailParticles.length < 50) {
			this.trailParticles.push({
				position: this.model.position.clone(),
				age: 0,
				velocity: this.direction.clone().multiplyScalar(-0.1) // 後方に少し流れる
			});
		}

		// パーティクルが存在しない場合は早期リターン
		if (this.trailParticles.length === 0) {
			return;
		}

		// 軌跡の位置を更新
		const positions = new Float32Array(this.trailParticles.length * 3);
		let validParticleCount = 0;

		// 古いパーティクルを削除しながら位置を更新
		for (let i = 0; i < this.trailParticles.length; i++) {
			const particle = this.trailParticles[i];
			particle.age += 0.016; // 約60FPSを想定

			if (particle.age < 0.2) { // 0.5秒で消える
				// パーティクルの位置を更新（少し後方に流れる）
				particle.position.add(particle.velocity);
				
				positions[validParticleCount * 3] = particle.position.x;
				positions[validParticleCount * 3 + 1] = particle.position.y;
				positions[validParticleCount * 3 + 2] = particle.position.z;
				validParticleCount++;
			}
		}

		// 有効なパーティクルのみを保持
		this.trailParticles = this.trailParticles.filter(particle => particle.age < 0.5);

		// バッファを更新
		if (validParticleCount > 0) {
			const validPositions = positions.slice(0, validParticleCount * 3);
			this.trailGeometry.setAttribute('position', new THREE.BufferAttribute(validPositions, 3));
			this.trailGeometry.attributes.position.needsUpdate = true;
		} else {
			// パーティクルがなくなった場合は空のバッファを設定
			this.trailGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(0), 3));
			this.trailGeometry.attributes.position.needsUpdate = true;
		}
	}

	createImpactEffect(position) {
		// 衝突エフェクトのジオメトリ
		const geometry = new THREE.SphereGeometry(0.2, 16, 16);
		const material = new THREE.MeshPhongMaterial({
			color: this.color,
			emissive: this.color,
			emissiveIntensity: 0.8,
			transparent: true,
			opacity: 0.8
		});

		const impact = new THREE.Mesh(geometry, material);
		impact.position.copy(position);
		this.scene.add(impact);

		// エフェクトのアニメーション
		const duration = 0.3;
		const startTime = Date.now();
		const animate = () => {
			const elapsed = (Date.now() - startTime) / 1000;
			if (elapsed < duration) {
				const scale = 1 + elapsed * 3;
				impact.scale.set(scale, scale, scale);
				impact.material.opacity = 0.8 * (1 - elapsed / duration);
				requestAnimationFrame(animate);
			} else {
				this.scene.remove(impact);
			}
		};
		animate();
	}

	getAge() {
		return (Date.now() - this.createdAt) / 1000;
	}

	getDamage() {
		return this.damage;
	}

	dispose() {
		// シーンから削除
		this.scene.remove(this.model);
		this.scene.remove(this.trailPoints);

		// パーティクルをクリア
		this.trailParticles = [];
		this.trailGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(0), 3));
		this.trailGeometry.attributes.position.needsUpdate = true;

		// ジオメトリとマテリアルを解放
		this.model.geometry.dispose();
		this.model.material.dispose();
		this.trailGeometry.dispose();
		this.trailMaterial.dispose();

		// 参照をクリア
		this.model = null;
		this.trailPoints = null;
		this.trailGeometry = null;
		this.trailMaterial = null;
	}

	
	// 衝突判定
	checkCollision(position, radius) {
		return this.model.position.distanceTo(position) < radius;
	}
}