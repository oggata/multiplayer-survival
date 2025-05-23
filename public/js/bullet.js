class Bullet {
	constructor(scene, position, direction, playerId, bulletType) {
		this.scene=scene;
		this.playerId=playerId;

		this.speed=20;
		this.lifetime=3.0; // 5秒後に消える
		this.damage=10;

		this.color=0xfbff00;

		if(bulletType=="bullet001") {
			//normal
			this.speed=15;
			this.lifetime=1.5; // 5秒後に消える
			this.damage=10;
		}

		if(bulletType=="shotgun") {
			//normal
			this.speed=20;
			this.lifetime=1.5; // 5秒後に消える
			this.damage=10;
		}

		if(bulletType=="machinegun") {
			//normal
			this.speed=20;
			this.lifetime=1.5; // 5秒後に消える
			this.damage=10;
		}

		if(bulletType=="magnum") {
			//normal
			this.speed=20;
			this.lifetime=3; // 5秒後に消える
			this.damage=20;
		}

		if(bulletType=="sniperrifle") {
			//normal
			this.speed=25;
			this.lifetime=6; // 5秒後に消える
			this.damage=10;
		}

		if(bulletType=="rocketlauncher") {
			//normal
			this.speed=15;
			this.lifetime=1.5; // 5秒後に消える
			this.damage=10;
		}

		if(bulletType=="lasergun") {
			this.speed=30;
			this.lifetime=0.5;
			this.damage=15;
			this.color=0xff0000;
		}

		if(bulletType=="grenadelauncher") {
			this.speed=12;
			this.lifetime=2.0;
			this.damage=30;
			this.color=0x666666;
		}

		if(bulletType=="flamethrower") {
			this.speed=10;
			this.lifetime=0.3;
			this.damage=8;
			this.color=0xff6600;
		}

		if(bulletType=="plasmacannon") {
			this.speed=25;
			this.lifetime=1.0;
			this.damage=25;
			this.color=0x00ffff;
		}

		if(bulletType=="missilelauncher") {
			this.speed=20;
			this.lifetime=3.0;
			this.damage=40;
			this.color=0x666666;
		}

		// 弾丸のモデルを作成
		this.model=this.createModel(bulletType);
		this.model.position.copy(position);

		// 移動方向を設定
		this.direction=direction.clone().normalize();
		this.velocity=this.direction.clone().multiplyScalar(this.speed);

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
			const geometry=new THREE.SphereGeometry(0.1, 8, 8);

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
		this.model.position.add(this.velocity.clone().multiplyScalar(deltaTime));
		// 寿命をチェック
		const age=(Date.now() - this.createdAt) / 1000;

		if (age > this.lifetime) {
			this.dispose();
			return false;
		}

		return true;
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

		// ジオメトリとマテリアルを解放
		this.model.geometry.dispose();
		this.model.material.dispose();
	}

	// 衝突判定
	checkCollision(position, radius) {
		return this.model.position.distanceTo(position) < radius;
	}
}