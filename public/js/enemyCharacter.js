// デブなキャラクター作成用のクラス
class EnemyCharacter {
	constructor(scene, type, game) {
		this.scene = scene;
		this.type = type;
		this.game = game;
		this.character = new THREE.Group();
		this.scene.add(this.character);

		// アニメーション用の変数
		this.animationTime = 0;
		this.isMoving = false;
		this.isRunning = false;
		this.animationSpeed = 9.0;
		this.walkAmplitude = 0.3; // 歩行アニメーションの振幅を小さく
		this.armSwingAmplitude = 1.2; // 腕の振りを小さく

		// 移動関連の変数
		this.position = new THREE.Vector3();
		this.rotation = new THREE.Euler();
		this.velocity = new THREE.Vector3();

		// 攻撃アニメーション用の変数
		this.isAttacking = false;
		this.attackTime = 0;
		this.attackDuration = 0.5;

		// ダメージエフェクト用の変数
		this.isDamaged = false;
		this.damageTime = 0;
		this.damageDuration = 0.5;
		this.originalColors = new Map();

		// キャラクターの作成
		this.createCharacter();
	}

	createCharacter() {
		// 上半身用のマテリアル
		const upperBodyMaterial = new THREE.MeshPhongMaterial({ 
			color: 0x4488ff,
			side: THREE.DoubleSide,
			emissive: 0x000000,
			emissiveIntensity: 0.0
		});
		
		// 下半身用のマテリアル
		const lowerBodyMaterial = new THREE.MeshPhongMaterial({ 
			color: 0x4488ff,
			side: THREE.DoubleSide,
			emissive: 0x000000,
			emissiveIntensity: 0.0
		});
		
		const headMaterial = new THREE.MeshPhongMaterial({ 
			color: 0xffaa88,
			side: THREE.DoubleSide,
			emissive: 0x000000,
			emissiveIntensity: 0.0
		});
		
		const handMaterial = new THREE.MeshPhongMaterial({ 
			color: 0xffaa88,
			side: THREE.DoubleSide,
			emissive: 0x000000,
			emissiveIntensity: 0.0
		});

		// ゾンビの皮膚色を生成（緑がかった色）
		const skinColor = this.generateZombieSkinColor();
		headMaterial.color.setHex(skinColor);
		handMaterial.color.setHex(skinColor);
		headMaterial.emissive.setHex(skinColor);
		handMaterial.emissive.setHex(skinColor);

		// 洋服の色を生成（くすんだ色）
		const [upperBodyColor, lowerBodyColor] = this.generateTwoDistinctMutedColors();
		upperBodyMaterial.color.setHex(upperBodyColor);
		lowerBodyMaterial.color.setHex(lowerBodyColor);

		// ルートボーン（腰）
		this.rootBone = new THREE.Bone();
		this.rootBone.position.y = 3;
		
		// 腰のメッシュ（細く）
		const hipGeometry = new THREE.BoxGeometry(2.5, 1.0, 1.2);
		this.hipMesh = new THREE.Mesh(hipGeometry, upperBodyMaterial);
		this.hipMesh.castShadow = true;
		this.hipMesh.receiveShadow = true;
		this.rootBone.add(this.hipMesh);
		
		// 胴体ボーン
		this.spineBone = new THREE.Bone();
		this.spineBone.position.y = 1;
		this.rootBone.add(this.spineBone);
		
		// 胴体メッシュ（細く）
		const torsoGeometry = new THREE.BoxGeometry(2.5, 2.2, 1.8);
		this.torsoMesh = new THREE.Mesh(torsoGeometry, upperBodyMaterial);
		this.torsoMesh.position.y = 0.5;
		this.torsoMesh.castShadow = true;
		this.torsoMesh.receiveShadow = true;
		this.spineBone.add(this.torsoMesh);
		
		// 首ボーン
		this.neckBone = new THREE.Bone();
		this.neckBone.position.y = 1.5;
		this.spineBone.add(this.neckBone);
		
		// 首メッシュ（細く）
		const neckGeometry = new THREE.BoxGeometry(0.7, 0.7, 0.7);
		this.neckMesh = new THREE.Mesh(neckGeometry, upperBodyMaterial);
		this.neckMesh.castShadow = true;
		this.neckBone.add(this.neckMesh);
		
		// 頭ボーン
		this.headBone = new THREE.Bone();
		this.headBone.position.y = 0.5;
		this.neckBone.add(this.headBone);
		
		// 頭メッシュ（細く）
		const headGeometry = new THREE.BoxGeometry(1.0, 1.0, 1.0);
		this.headMesh = new THREE.Mesh(headGeometry, headMaterial);
		this.headMesh.position.y = 0.5;
		this.headMesh.castShadow = true;
		this.headBone.add(this.headMesh);

		// 左腕の作成（細く）
		this.leftShoulderBone = new THREE.Bone();
		this.leftShoulderBone.position.set(1.8, 1, 0);
		this.spineBone.add(this.leftShoulderBone);
		
		const leftUpperArmGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.6);
		this.leftUpperArmMesh = new THREE.Mesh(leftUpperArmGeometry, upperBodyMaterial);
		this.leftUpperArmMesh.position.y = -0.6;
		this.leftUpperArmMesh.castShadow = true;
		this.leftShoulderBone.add(this.leftUpperArmMesh);
		
		this.leftElbowBone = new THREE.Bone();
		this.leftElbowBone.position.y = -1.2;
		this.leftShoulderBone.add(this.leftElbowBone);
		
		const leftLowerArmGeometry = new THREE.BoxGeometry(0.5, 1.0, 0.5);
		this.leftLowerArmMesh = new THREE.Mesh(leftLowerArmGeometry, upperBodyMaterial);
		this.leftLowerArmMesh.position.y = -0.5;
		this.leftLowerArmMesh.castShadow = true;
		this.leftElbowBone.add(this.leftLowerArmMesh);
		
		this.leftHandBone = new THREE.Bone();
		this.leftHandBone.position.y = -1.0;
		this.leftElbowBone.add(this.leftHandBone);
		
		const leftHandGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.3);
		this.leftHandMesh = new THREE.Mesh(leftHandGeometry, handMaterial);
		this.leftHandMesh.position.y = -0.2;
		this.leftHandMesh.castShadow = true;
		this.leftHandBone.add(this.leftHandMesh);

		// 右腕の作成（細く）
		this.rightShoulderBone = new THREE.Bone();
		this.rightShoulderBone.position.set(-1.8, 1, 0);
		this.spineBone.add(this.rightShoulderBone);
		
		const rightUpperArmGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.6);
		this.rightUpperArmMesh = new THREE.Mesh(rightUpperArmGeometry, upperBodyMaterial);
		this.rightUpperArmMesh.position.y = -0.6;
		this.rightUpperArmMesh.castShadow = true;
		this.rightShoulderBone.add(this.rightUpperArmMesh);
		
		this.rightElbowBone = new THREE.Bone();
		this.rightElbowBone.position.y = -1.2;
		this.rightShoulderBone.add(this.rightElbowBone);
		
		const rightLowerArmGeometry = new THREE.BoxGeometry(0.5, 1.0, 0.5);
		this.rightLowerArmMesh = new THREE.Mesh(rightLowerArmGeometry, upperBodyMaterial);
		this.rightLowerArmMesh.position.y = -0.5;
		this.rightLowerArmMesh.castShadow = true;
		this.rightElbowBone.add(this.rightLowerArmMesh);
		
		this.rightHandBone = new THREE.Bone();
		this.rightHandBone.position.y = -1.0;
		this.rightElbowBone.add(this.rightHandBone);
		
		const rightHandGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.3);
		this.rightHandMesh = new THREE.Mesh(rightHandGeometry, handMaterial);
		this.rightHandMesh.position.y = -0.2;
		this.rightHandMesh.castShadow = true;
		this.rightHandBone.add(this.rightHandMesh);

		// 左脚の作成（細く）
		this.leftHipBone = new THREE.Bone();
		this.leftHipBone.position.set(0.8, -0.5, 0);
		this.rootBone.add(this.leftHipBone);
		
		const leftThighGeometry = new THREE.BoxGeometry(0.8, 1.5, 0.8);
		this.leftThighMesh = new THREE.Mesh(leftThighGeometry, lowerBodyMaterial);
		this.leftThighMesh.position.y = -0.75;
		this.leftThighMesh.castShadow = true;
		this.leftHipBone.add(this.leftThighMesh);
		
		this.leftKneeBone = new THREE.Bone();
		this.leftKneeBone.position.y = -1.5;
		this.leftHipBone.add(this.leftKneeBone);
		
		const leftShinGeometry = new THREE.BoxGeometry(0.7, 1.5, 0.7);
		this.leftShinMesh = new THREE.Mesh(leftShinGeometry, lowerBodyMaterial);
		this.leftShinMesh.position.y = -0.75;
		this.leftShinMesh.castShadow = true;
		this.leftKneeBone.add(this.leftShinMesh);
		
		this.leftFootBone = new THREE.Bone();
		this.leftFootBone.position.y = -1.5;
		this.leftKneeBone.add(this.leftFootBone);
		
		const leftFootGeometry = new THREE.BoxGeometry(0.7, 0.3, 1.1);
		this.leftFootMesh = new THREE.Mesh(leftFootGeometry, lowerBodyMaterial);
		this.leftFootMesh.position.set(0, -0.1, 0.2);
		this.leftFootMesh.castShadow = true;
		this.leftFootBone.add(this.leftFootMesh);

		// 右脚の作成（細く）
		this.rightHipBone = new THREE.Bone();
		this.rightHipBone.position.set(-0.8, -0.5, 0);
		this.rootBone.add(this.rightHipBone);
		
		const rightThighGeometry = new THREE.BoxGeometry(0.8, 1.5, 0.8);
		this.rightThighMesh = new THREE.Mesh(rightThighGeometry, lowerBodyMaterial);
		this.rightThighMesh.position.y = -0.75;
		this.rightThighMesh.castShadow = true;
		this.rightHipBone.add(this.rightThighMesh);
		
		this.rightKneeBone = new THREE.Bone();
		this.rightKneeBone.position.y = -1.5;
		this.rightHipBone.add(this.rightKneeBone);
		
		const rightShinGeometry = new THREE.BoxGeometry(0.7, 1.5, 0.7);
		this.rightShinMesh = new THREE.Mesh(rightShinGeometry, lowerBodyMaterial);
		this.rightShinMesh.position.y = -0.75;
		this.rightShinMesh.castShadow = true;
		this.rightKneeBone.add(this.rightShinMesh);
		
		this.rightFootBone = new THREE.Bone();
		this.rightFootBone.position.y = -1.5;
		this.rightKneeBone.add(this.rightFootBone);
		
		const rightFootGeometry = new THREE.BoxGeometry(0.7, 0.3, 1.1);
		this.rightFootMesh = new THREE.Mesh(rightFootGeometry, lowerBodyMaterial);
		this.rightFootMesh.position.set(0, -0.1, 0.2);
		this.rightFootMesh.castShadow = true;
		this.rightFootBone.add(this.rightFootMesh);

		// ボーンシステムをキャラクターに追加
		this.character.add(this.rootBone);

		// キャラクター全体のスケールを1/3に設定
		this.character.scale.set(1/4, 1/4, 1/4);

		// 上半身のパーツに色を設定
		const upperBodyParts = [
			this.torsoMesh,
			this.leftUpperArmMesh,
			this.leftLowerArmMesh,
			this.rightUpperArmMesh,
			this.rightLowerArmMesh
		];

		upperBodyParts.forEach(part => {
			if (part && part.material) {
				part.material.color.setHex(upperBodyColor);
				part.material.emissive.setHex(upperBodyColor);
				part.material.emissiveIntensity = 0.8;
			}
		});

		// 下半身のパーツに色を設定
		const lowerBodyParts = [
			this.leftThighMesh,
			this.leftShinMesh,
			this.rightThighMesh,
			this.rightShinMesh
		];

		lowerBodyParts.forEach(part => {
			if (part && part.material) {
				part.material.color.setHex(lowerBodyColor);
				part.material.emissive.setHex(lowerBodyColor);
				part.material.emissiveIntensity = 0.8;
			}
		});

		// 頭と手のパーツに色を設定
		const skinParts = [
			this.headMesh,
			this.leftHandMesh,
			this.rightHandMesh
		];

		skinParts.forEach(part => {
			if (part && part.material) {
				part.material.emissiveIntensity = 0.2;
			}
		});
	}

	// くすんだ色を2つランダムに、かつ必ず異なる色で返す関数
	generateTwoDistinctMutedColors() {
		const mutedColors = [
			0x4a4a4a, 0x2c3e50, 0x34495e, 0x7f8c8d, 0x6c7a89, 0x8d6748, 0x7b8d8e, 0x5d6d7e,
			0x566573, 0x626567, 0x839192, 0x616a6b, 0x7d6608, 0x784212, 0x4e342e, 0x273746,
			0x212f3c, 0x424949, 0x196f3d, 0x7b7d7d, 0x4a235a, 0x512e5f, 0x154360
		];
		const idx1 = Math.floor(Math.random() * mutedColors.length);
		let idx2;
		// idx1と異なるインデックスが出るまで再抽選
		do {
			idx2 = Math.floor(Math.random() * mutedColors.length);
		} while (idx2 === idx1);
		return [mutedColors[idx1], mutedColors[idx2]];
	}

	// ゾンビの皮膚色を生成する関数
	generateZombieSkinColor() {
		// ゾンビの皮膚色の範囲を定義（明るめの色に変更）
		const skinColors = [
			0x9aad6e, // 明るい緑がかった灰色
			0xa8b88d, // さらに明るい緑がかった灰色
			0xb5c4a3, // 薄い緑がかった灰色
			0xc4d4b1, // 非常に明るい緑がかった灰色
			0xd4e4c1, // 最も明るい緑がかった灰色
			0x8b9e63, // 中程度の緑がかった灰色
			0x7d8b5d, // やや暗めの緑がかった灰色
			0x9eb5a3, // 青みがかった灰色
			0xb5c4a3, // 薄い緑がかった灰色
			0xc4d4b1  // 非常に明るい緑がかった灰色
		];
		return skinColors[Math.floor(Math.random() * skinColors.length)];
	}

	// ダメージを受けた時の処理
	takeDamage() {
		this.isDamaged = true;
		this.damageTime = 0;

		// 現在の色を保存
		this.saveOriginalColors();

		// 赤色に変更
		const damageColor = 0xff0000;
		const allParts = [
			this.torsoMesh,
			this.leftUpperArmMesh,
			this.leftLowerArmMesh,
			this.rightUpperArmMesh,
			this.rightLowerArmMesh,
			this.leftThighMesh,
			this.leftShinMesh,
			this.rightThighMesh,
			this.rightShinMesh,
			this.headMesh,
			this.leftHandMesh,
			this.rightHandMesh
		];

		allParts.forEach(part => {
			if (part && part.material) {
				part.material.color.setHex(damageColor);
				part.material.emissive.setHex(damageColor);
				part.material.emissiveIntensity = 1.0;
			}
		});
	}

	// 現在の色を保存
	saveOriginalColors() {
		const allParts = [
			this.torsoMesh,
			this.leftUpperArmMesh,
			this.leftLowerArmMesh,
			this.rightUpperArmMesh,
			this.rightLowerArmMesh,
			this.leftThighMesh,
			this.leftShinMesh,
			this.rightThighMesh,
			this.rightShinMesh,
			this.headMesh,
			this.leftHandMesh,
			this.rightHandMesh
		];

		allParts.forEach(part => {
			if (part && part.material) {
				this.originalColors.set(part, {
					color: part.material.color.getHex(),
					emissive: part.material.emissive.getHex(),
					emissiveIntensity: part.material.emissiveIntensity
				});
			}
		});
	}

	// 元の色に戻す
	restoreOriginalColors() {
		this.originalColors.forEach((colors, part) => {
			if (part && part.material) {
				part.material.color.setHex(colors.color);
				part.material.emissive.setHex(colors.emissive);
				part.material.emissiveIntensity = colors.emissiveIntensity;
			}
		});
		this.originalColors.clear();
	}

	updateLimbAnimation(deltaTime) {
		// ダメージエフェクトの更新
		if (this.isDamaged) {
			this.damageTime += deltaTime;
			if (this.damageTime >= this.damageDuration) {
				this.isDamaged = false;
				this.restoreOriginalColors();
			}
		}

		this.animationTime += deltaTime * this.animationSpeed;

		if (this.isAttacking) {
			this.updateAttackAnimation(deltaTime);
			return;
		}

		if (this.isMoving) {
			// 腰の上下動と前後の傾き（より大きく）
			this.rootBone.position.y = 3 + Math.sin(this.animationTime * 2) * 0.15;
			this.rootBone.rotation.x = Math.sin(this.animationTime * 2) * 0.03;
			
			// 胴体の微妙な揺れ（より大きく）
			this.spineBone.rotation.z = Math.sin(this.animationTime) * 0.08;
			this.spineBone.rotation.x = Math.sin(this.animationTime * 2) * 0.03;
			
			// 左脚の動き（より大きく）
			this.leftHipBone.rotation.x = Math.sin(this.animationTime) * this.walkAmplitude;
			this.leftKneeBone.rotation.x = Math.max(0, Math.sin(this.animationTime - 0.5) * this.walkAmplitude * 1.2);
			this.leftFootBone.rotation.x = Math.sin(this.animationTime - 1) * 0.3;
			
			// 右脚の動き（左脚と逆位相）
			this.rightHipBone.rotation.x = Math.sin(this.animationTime + Math.PI) * this.walkAmplitude;
			this.rightKneeBone.rotation.x = Math.max(0, Math.sin(this.animationTime + Math.PI - 0.5) * this.walkAmplitude * 1.2);
			this.rightFootBone.rotation.x = Math.sin(this.animationTime + Math.PI - 1) * 0.3;
			
			// 左腕を前に突き出した状態で歩く
			this.leftShoulderBone.rotation.z = -0.15;
			this.leftShoulderBone.rotation.x = -0.5; // 前に突き出す
			this.leftElbowBone.rotation.x = -0.8; // 肘を少し曲げる
			
			// 右腕を前に突き出した状態で歩く
			this.rightShoulderBone.rotation.z = 0.15;
			this.rightShoulderBone.rotation.x = -0.5; // 前に突き出す
			this.rightElbowBone.rotation.x = -0.8; // 肘を少し曲げる
			
			// 頭の自然な動き
			this.headBone.rotation.y = Math.sin(this.animationTime * 0.5) * 0.1;
			this.headBone.rotation.x = Math.sin(this.animationTime * 2) * 0.05;
		} else {
			// アイドルアニメーション
			this.rootBone.position.y = 3;
			this.rootBone.rotation.x = 0;
			this.spineBone.rotation.set(0, 0, 0);
			this.leftHipBone.rotation.set(0, 0, 0);
			this.rightHipBone.rotation.set(0, 0, 0);
			this.leftKneeBone.rotation.set(0, 0, 0);
			this.rightKneeBone.rotation.set(0, 0, 0);
			this.leftFootBone.rotation.set(0, 0, 0);
			this.rightFootBone.rotation.set(0, 0, 0);
			this.leftShoulderBone.rotation.set(0, 0, -0.15);
			this.rightShoulderBone.rotation.set(0, 0, 0.15);
			this.leftElbowBone.rotation.set(-1.2, 0, 0);
			this.rightElbowBone.rotation.set(-1.2, 0, 0);
			this.headBone.rotation.set(0, 0, 0);
		}
	}

	updateAttackAnimation(deltaTime) {
		this.attackTime += deltaTime;
		const progress = Math.min(this.attackTime / this.attackDuration, 1);
		
		if (progress < 0.5) {
			const upProgress = progress * 2;
			const armAngle = upProgress * Math.PI / 2;
			this.leftShoulderBone.rotation.x = -armAngle;
			this.rightShoulderBone.rotation.x = -armAngle;
		} else {
			const downProgress = (progress - 0.5) * 2;
			const armAngle = Math.PI / 2 - (downProgress * Math.PI / 2);
			this.leftShoulderBone.rotation.x = -armAngle;
			this.rightShoulderBone.rotation.x = -armAngle;
		}
		
		if (progress >= 1) {
			this.isAttacking = false;
			this.leftShoulderBone.rotation.x = 0;
			this.rightShoulderBone.rotation.x = 0;
		}
	}

	move(direction, speed, deltaTime) {
		if (direction.length() > 0) {
			direction.normalize();
		}

		const currentSpeed = speed;
		this.velocity.copy(direction).multiplyScalar(currentSpeed * deltaTime);
		this.velocity.applyEuler(this.rotation);
		this.position.add(this.velocity);
		this.character.position.copy(this.position);
		this.isMoving = direction.length() > 0;

		const height = this.game.fieldMap.getHeightAt(this.position.x, this.position.z);
		if (height != null) {
			this.position.y = height + 0.5;
		}
	}

	setPosition(x, y, z) {
		this.position.set(x, y, z);
		this.character.position.copy(this.position);
	}

	getPosition() {
		return this.position;
	}

	setRotation(y) {
		this.rotation.y = y;
		if (this.type === "player") {
			this.character.rotation.y = y + Math.PI;
		} else {
			this.character.rotation.y = y;
		}
	}

	getRotation() {
		return this.rotation;
	}

	setRunning(isRunning) {
		this.isRunning = isRunning;
		this.animationSpeed = isRunning ? 2.0 : 1.0;
	}

	startAttack() {
		this.isAttacking = true;
		this.attackTime = 0;
	}

	dispose() {
		this.scene.remove(this.character);
		
		const meshes = [
			this.hipMesh, this.torsoMesh, this.neckMesh, this.headMesh,
			this.leftUpperArmMesh, this.leftLowerArmMesh, this.leftHandMesh,
			this.rightUpperArmMesh, this.rightLowerArmMesh, this.rightHandMesh,
			this.leftThighMesh, this.leftShinMesh, this.leftFootMesh,
			this.rightThighMesh, this.rightShinMesh, this.rightFootMesh
		];
		
		meshes.forEach(mesh => {
			if (mesh) {
				mesh.geometry.dispose();
				mesh.material.dispose();
			}
		});
	}
} 