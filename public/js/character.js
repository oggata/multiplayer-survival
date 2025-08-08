// キャラクター作成用のクラス
class Character {
	constructor(scene, type, game) {
		//console.log("キャラクター作成");
		this.scene=scene;
		this.type=type;
		this.game=game;
		this.character=new THREE.Group();
		this.scene.add(this.character);

		// アニメーション用の変数
		this.animationTime=0;
		this.isMoving=false;
		this.isRunning=false;
		// キャラクタータイプに応じて初期アニメーション速度を設定
		this.animationSpeed = 8.0; // プレイヤーモデルを半分に調整
		this.walkAmplitude = 0.4;
		this.armSwingAmplitude = 1.8;

		// 移動関連の変数
		this.position=new THREE.Vector3();
		this.rotation=new THREE.Euler();
		this.velocity=new THREE.Vector3();

		// 攻撃アニメーション用の変数
		this.isAttacking = false;
		this.attackTime = 0;
		this.attackDuration = 0.5;

		// 射撃アニメーション用の変数
		this.isShooting = false;
		this.shootTime = 0;
		this.shootDuration = 0.3;

		// ジャンプアニメーション用の変数
		this.isJumping = false;
		this.jumpTime = 0;
		this.jumpDuration = 0.8;
		this.jumpHeight = 1.0;

		// 仰向けアニメーション用の変数
		this.isFallingBack = false;
		this.fallBackTime = 0;
		this.fallBackDuration = 1.0;

		// 上半身と下半身の独立したアニメーション用変数
		this.upperBodyAnimationTime = 0;
		this.lowerBodyAnimationTime = 0;

		// キャラクターの作成
		this.createCharacter();
	}

	createCharacter() {
		// マテリアルの定義
		const bodyMaterial = new THREE.MeshPhongMaterial({ 
			color: 0x4488ff,
			side: THREE.DoubleSide,
			shininess: 30,
			specular: 0x444444,
			emissive: 0x000000,
			emissiveIntensity: 0
		});
		
		const headMaterial = new THREE.MeshPhongMaterial({ 
			color: 0xffe0bd,
			emissive: 0xffe0bd,
			emissiveIntensity: 0.5,
			shininess: 30,
			specular: 0x444444,
			side: THREE.DoubleSide
		});
		
		const handMaterial = new THREE.MeshPhongMaterial({ 
			color: 0xffe0bd,
			emissive: 0xffe0bd,
			emissiveIntensity: 0.5,
			shininess: 30,
			specular: 0x444444,
			side: THREE.DoubleSide
		});

		//part.material.emissiveIntensity = 1.0;

		// ルートボーン（腰）
		this.rootBone = new THREE.Bone();
		this.rootBone.position.y = 3;
		
		// 腰のメッシュ
		const hipGeometry = new THREE.BoxGeometry(2, 1, 1);
		this.hipMesh = new THREE.Mesh(hipGeometry, bodyMaterial);
		this.hipMesh.castShadow = true;
		this.hipMesh.receiveShadow = true;
		this.rootBone.add(this.hipMesh);
		
		// 胴体ボーン
		this.spineBone = new THREE.Bone();
		this.spineBone.position.y = 1;
		this.rootBone.add(this.spineBone);
		
		// 胴体メッシュ
		const torsoGeometry = new THREE.BoxGeometry(2, 2, 1);
		this.torsoMesh = new THREE.Mesh(torsoGeometry, bodyMaterial);
		this.torsoMesh.position.y = 0.5;
		this.torsoMesh.castShadow = true;
		this.torsoMesh.receiveShadow = true;
		this.spineBone.add(this.torsoMesh);
		
		// 首ボーン
		this.neckBone = new THREE.Bone();
		this.neckBone.position.y = 1.5;
		this.spineBone.add(this.neckBone);
		
		// 首メッシュ
		const neckGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
		this.neckMesh = new THREE.Mesh(neckGeometry, bodyMaterial);
		this.neckMesh.castShadow = true;
		this.neckBone.add(this.neckMesh);
		
		// 頭ボーン
		this.headBone = new THREE.Bone();
		this.headBone.position.y = 0.5;
		this.neckBone.add(this.headBone);
		
		// 頭メッシュ
		const headGeometry = new THREE.BoxGeometry(1, 1, 1);
		this.headMesh = new THREE.Mesh(headGeometry, headMaterial);
		this.headMesh.position.y = 0.5;
		//this.headMesh.castShadow = true;
		this.headBone.add(this.headMesh);

		// 左腕の作成
		this.leftShoulderBone = new THREE.Bone();
		this.leftShoulderBone.position.set(1.2, 1, 0);
		this.spineBone.add(this.leftShoulderBone);
		
		const leftUpperArmGeometry = new THREE.BoxGeometry(0.4, 1.2, 0.4);
		this.leftUpperArmMesh = new THREE.Mesh(leftUpperArmGeometry, bodyMaterial);
		this.leftUpperArmMesh.position.y = -0.6;
		this.leftUpperArmMesh.castShadow = true;
		this.leftShoulderBone.add(this.leftUpperArmMesh);
		
		this.leftElbowBone = new THREE.Bone();
		this.leftElbowBone.position.y = -1.2;
		this.leftShoulderBone.add(this.leftElbowBone);
		
		const leftLowerArmGeometry = new THREE.BoxGeometry(0.3, 1.0, 0.3);
		this.leftLowerArmMesh = new THREE.Mesh(leftLowerArmGeometry, bodyMaterial);
		this.leftLowerArmMesh.position.y = -0.5;
		this.leftLowerArmMesh.castShadow = true;
		this.leftElbowBone.add(this.leftLowerArmMesh);
		
		this.leftHandBone = new THREE.Bone();
		this.leftHandBone.position.y = -1.0;
		this.leftElbowBone.add(this.leftHandBone);
		
		const leftHandGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.2);
		this.leftHandMesh = new THREE.Mesh(leftHandGeometry, handMaterial);
		this.leftHandMesh.position.y = -0.2;
		this.leftHandMesh.castShadow = true;
		this.leftHandBone.add(this.leftHandMesh);

		// 右腕の作成
		this.rightShoulderBone = new THREE.Bone();
		this.rightShoulderBone.position.set(-1.2, 1, 0);
		this.spineBone.add(this.rightShoulderBone);
		
		const rightUpperArmGeometry = new THREE.BoxGeometry(0.4, 1.2, 0.4);
		this.rightUpperArmMesh = new THREE.Mesh(rightUpperArmGeometry, bodyMaterial);
		this.rightUpperArmMesh.position.y = -0.6;
		this.rightUpperArmMesh.castShadow = true;
		this.rightShoulderBone.add(this.rightUpperArmMesh);
		
		this.rightElbowBone = new THREE.Bone();
		this.rightElbowBone.position.y = -1.2;
		this.rightShoulderBone.add(this.rightElbowBone);
		
		const rightLowerArmGeometry = new THREE.BoxGeometry(0.3, 1.0, 0.3);
		this.rightLowerArmMesh = new THREE.Mesh(rightLowerArmGeometry, bodyMaterial);
		this.rightLowerArmMesh.position.y = -0.5;
		this.rightLowerArmMesh.castShadow = true;
		this.rightElbowBone.add(this.rightLowerArmMesh);
		
		this.rightHandBone = new THREE.Bone();
		this.rightHandBone.position.y = -1.0;
		this.rightElbowBone.add(this.rightHandBone);
		
		const rightHandGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.2);
		this.rightHandMesh = new THREE.Mesh(rightHandGeometry, handMaterial);
		this.rightHandMesh.position.y = -0.2;
		this.rightHandMesh.castShadow = true;
		this.rightHandBone.add(this.rightHandMesh);

		// 左脚の作成
		this.leftHipBone = new THREE.Bone();
		this.leftHipBone.position.set(0.5, -0.5, 0);
		this.rootBone.add(this.leftHipBone);
		
		const leftThighGeometry = new THREE.BoxGeometry(0.6, 1.5, 0.6);
		this.leftThighMesh = new THREE.Mesh(leftThighGeometry, bodyMaterial);
		this.leftThighMesh.position.y = -0.75;
		this.leftThighMesh.castShadow = true;
		this.leftHipBone.add(this.leftThighMesh);
		
		this.leftKneeBone = new THREE.Bone();
		this.leftKneeBone.position.y = -1.5;
		this.leftHipBone.add(this.leftKneeBone);
		
		const leftShinGeometry = new THREE.BoxGeometry(0.5, 1.5, 0.5);
		this.leftShinMesh = new THREE.Mesh(leftShinGeometry, bodyMaterial);
		this.leftShinMesh.position.y = -0.75;
		this.leftShinMesh.castShadow = true;
		this.leftKneeBone.add(this.leftShinMesh);
		
		this.leftFootBone = new THREE.Bone();
		this.leftFootBone.position.y = -1.5;
		this.leftKneeBone.add(this.leftFootBone);
		
		const leftFootGeometry = new THREE.BoxGeometry(0.5, 0.2, 0.8);
		this.leftFootMesh = new THREE.Mesh(leftFootGeometry, bodyMaterial);
		this.leftFootMesh.position.set(0, -0.1, 0.2);
		this.leftFootMesh.castShadow = true;
		this.leftFootBone.add(this.leftFootMesh);

		// 右脚の作成
		this.rightHipBone = new THREE.Bone();
		this.rightHipBone.position.set(-0.5, -0.5, 0);
		this.rootBone.add(this.rightHipBone);
		
		const rightThighGeometry = new THREE.BoxGeometry(0.6, 1.5, 0.6);
		this.rightThighMesh = new THREE.Mesh(rightThighGeometry, bodyMaterial);
		this.rightThighMesh.position.y = -0.75;
		this.rightThighMesh.castShadow = true;
		this.rightHipBone.add(this.rightThighMesh);
		
		this.rightKneeBone = new THREE.Bone();
		this.rightKneeBone.position.y = -1.5;
		this.rightHipBone.add(this.rightKneeBone);
		
		const rightShinGeometry = new THREE.BoxGeometry(0.5, 1.5, 0.5);
		this.rightShinMesh = new THREE.Mesh(rightShinGeometry, bodyMaterial);
		this.rightShinMesh.position.y = -0.75;
		this.rightShinMesh.castShadow = true;
		this.rightKneeBone.add(this.rightShinMesh);
		
		this.rightFootBone = new THREE.Bone();
		this.rightFootBone.position.y = -1.5;
		this.rightKneeBone.add(this.rightFootBone);
		
		const rightFootGeometry = new THREE.BoxGeometry(0.5, 0.2, 0.8);
		this.rightFootMesh = new THREE.Mesh(rightFootGeometry, bodyMaterial);
		this.rightFootMesh.position.set(0, -0.1, 0.2);
		this.rightFootMesh.castShadow = true;
		this.rightFootBone.add(this.rightFootMesh);

		// ボーンシステムをキャラクターに追加
		this.character.add(this.rootBone);

		// キャラクター全体のスケールを1/3に設定
		this.character.scale.set(1/4, 1/4, 1/4);
	}

	updateLimbAnimation(deltaTime) {
		this.animationTime += deltaTime * this.animationSpeed;
		this.upperBodyAnimationTime += deltaTime * this.animationSpeed;
		this.lowerBodyAnimationTime += deltaTime * this.animationSpeed;

		if (this.isFallingBack) {
			this.updateFallBackAnimation(deltaTime);
			return;
		}

		if (this.isJumping) {
			this.updateJumpAnimation(deltaTime);
			return;
		}

		// 下半身のアニメーション（常に歩行状態に応じて）
		this.updateLowerBodyAnimation(deltaTime);
		
		// 上半身のアニメーション（状況に応じて）
		this.updateUpperBodyAnimation(deltaTime);
	}

	updateLowerBodyAnimation(deltaTime) {
		if (this.isMoving) {
			// 腰の上下動と前後の傾き
			this.rootBone.position.y = 3 + Math.sin(this.lowerBodyAnimationTime * 2) * 0.1;
			this.rootBone.rotation.x = Math.sin(this.lowerBodyAnimationTime * 2) * 0.02;
			
			// 左脚の動き
			this.leftHipBone.rotation.x = Math.sin(this.lowerBodyAnimationTime) * this.walkAmplitude;
			this.leftKneeBone.rotation.x = Math.max(0, Math.sin(this.lowerBodyAnimationTime - 0.5) * this.walkAmplitude * 1.2);
			this.leftFootBone.rotation.x = Math.sin(this.lowerBodyAnimationTime - 1) * 0.3;
			
			// 右脚の動き（左脚と逆位相）
			this.rightHipBone.rotation.x = Math.sin(this.lowerBodyAnimationTime + Math.PI) * this.walkAmplitude;
			this.rightKneeBone.rotation.x = Math.max(0, Math.sin(this.lowerBodyAnimationTime + Math.PI - 0.5) * this.walkAmplitude * 1.2);
			this.rightFootBone.rotation.x = Math.sin(this.lowerBodyAnimationTime + Math.PI - 1) * 0.3;
		} else {
			// アイドル状態の下半身
			this.rootBone.position.y = 3;
			this.rootBone.rotation.x = 0;
			this.leftHipBone.rotation.set(0, 0, 0);
			this.rightHipBone.rotation.set(0, 0, 0);
			this.leftKneeBone.rotation.set(0, 0, 0);
			this.rightKneeBone.rotation.set(0, 0, 0);
			this.leftFootBone.rotation.set(0, 0, 0);
			this.rightFootBone.rotation.set(0, 0, 0);
		}
	}

	updateUpperBodyAnimation(deltaTime) {
		if (this.isAttacking) {
			this.updateAttackAnimation(deltaTime);
			return;
		}

		if (this.isShooting) {
			this.updateShootingAnimation(deltaTime);
			return;
		}

		// 通常の上半身アニメーション
		if (this.isMoving) {
			// 胴体の微妙な揺れ
			this.spineBone.rotation.z = Math.sin(this.upperBodyAnimationTime) * 0.05;
			this.spineBone.rotation.x = Math.sin(this.upperBodyAnimationTime * 2) * 0.02;
			
			// 左腕の振り（右脚と同位相）
			this.leftShoulderBone.rotation.z = -0.15;
			this.leftShoulderBone.rotation.x = Math.sin(this.upperBodyAnimationTime + Math.PI) * this.armSwingAmplitude * 0.4;
			this.leftElbowBone.rotation.x = -1.2 + Math.sin(this.upperBodyAnimationTime + Math.PI - 0.5) * 0.1;
			
			// 右腕の振り（左脚と同位相）
			this.rightShoulderBone.rotation.z = 0.15;
			this.rightShoulderBone.rotation.x = Math.sin(this.upperBodyAnimationTime) * this.armSwingAmplitude * 0.4;
			this.rightElbowBone.rotation.x = -1.2 + Math.sin(this.upperBodyAnimationTime - 0.5) * 0.1;
			
			// 頭の自然な動き
			this.headBone.rotation.y = Math.sin(this.upperBodyAnimationTime * 0.5) * 0.1;
			this.headBone.rotation.x = Math.sin(this.upperBodyAnimationTime * 2) * 0.05;
		} else {
			// アイドル状態の上半身
			this.spineBone.rotation.set(0, 0, 0);
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
		
		// 胴体の微妙な揺れ（歩行中の場合）
		if (this.isMoving) {
			this.spineBone.rotation.z = Math.sin(this.upperBodyAnimationTime) * 0.05;
			this.spineBone.rotation.x = Math.sin(this.upperBodyAnimationTime * 2) * 0.02;
		} else {
			this.spineBone.rotation.set(0, 0, 0);
		}
		
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
		
		// 頭の自然な動き
		this.headBone.rotation.y = Math.sin(this.upperBodyAnimationTime * 0.5) * 0.1;
		this.headBone.rotation.x = Math.sin(this.upperBodyAnimationTime * 2) * 0.05;
		
		if (progress >= 1) {
			this.isAttacking = false;
			this.leftShoulderBone.rotation.x = 0;
			this.rightShoulderBone.rotation.x = 0;
		}
	}

	updateShootingAnimation(deltaTime) {
		this.shootTime += deltaTime;
		const progress = Math.min(this.shootTime / this.shootDuration, 1);
		
		// 胴体の微妙な揺れ（歩行中の場合）
		if (this.isMoving) {
			this.spineBone.rotation.z = Math.sin(this.upperBodyAnimationTime) * 0.05;
			this.spineBone.rotation.x = Math.sin(this.upperBodyAnimationTime * 2) * 0.02;
		} else {
			this.spineBone.rotation.set(0, 0, 0);
		}
		
		// 射撃姿勢：右腕を前方に出す
		const shootAngle = Math.PI / 3; // 60度前方
		this.rightShoulderBone.rotation.x = -shootAngle;
		this.rightElbowBone.rotation.x = -0.5; // 肘を少し曲げる
		
		// 左腕は自然な位置
		this.leftShoulderBone.rotation.x = 0;
		this.leftElbowBone.rotation.x = -1.2;
		
		// 頭の自然な動き
		this.headBone.rotation.y = Math.sin(this.upperBodyAnimationTime * 0.5) * 0.1;
		this.headBone.rotation.x = Math.sin(this.upperBodyAnimationTime * 2) * 0.05;
		
		if (progress >= 1) {
			this.isShooting = false;
			this.shootTime = 0;
			// 元の姿勢に戻す
			this.rightShoulderBone.rotation.x = 0;
			this.rightElbowBone.rotation.x = -1.2;
		}
	}

	updateJumpAnimation(deltaTime) {
		this.jumpTime += deltaTime;
		const progress = Math.min(this.jumpTime / this.jumpDuration, 1);
		
		// ジャンプの高さ計算（放物線）
		const jumpProgress = Math.sin(progress * Math.PI);
		this.rootBone.position.y = 3 + jumpProgress * this.jumpHeight;
		
		// 膝の曲げ具合
		const kneeBend = Math.sin(progress * Math.PI * 2) * 0.5;
		this.leftKneeBone.rotation.x = kneeBend;
		this.rightKneeBone.rotation.x = kneeBend;
		
		// 腕の水平挙上
		const armRaise = Math.min(progress * 2, 1) * Math.PI / 2;
		this.leftShoulderBone.rotation.x = -armRaise;
		this.rightShoulderBone.rotation.x = -armRaise;
		
		// ジャンプ終了時の処理
		if (progress >= 1) {
			this.isJumping = false;
			this.jumpTime = 0;
			// 元の姿勢に戻す
			this.leftKneeBone.rotation.x = 0;
			this.rightKneeBone.rotation.x = 0;
			this.leftShoulderBone.rotation.x = 0;
			this.rightShoulderBone.rotation.x = 0;
		}
	}

	updateFallBackAnimation(deltaTime) {
		this.fallBackTime += deltaTime;
		const progress = Math.min(this.fallBackTime / this.fallBackDuration, 1);
		
		// 胴体を後ろに倒す
		this.spineBone.rotation.x = progress * Math.PI / 2;
		
		// 腕を広げる
		const armSpread = progress * Math.PI / 2;
		this.leftShoulderBone.rotation.z = -armSpread;
		this.rightShoulderBone.rotation.z = armSpread;
		
		// 膝を曲げる
		const kneeBend = progress * Math.PI / 4;
		this.leftKneeBone.rotation.x = kneeBend;
		this.rightKneeBone.rotation.x = kneeBend;
		
		// 頭を後ろに倒す
		this.headBone.rotation.x = progress * Math.PI / 4;
		
		// 全体を少し下げる
		this.rootBone.position.y = 3 - progress * 0.5;
	}

	startFallBack() {
		if (!this.isFallingBack && !this.isJumping && !this.isAttacking && !this.isShooting) {
			this.isFallingBack = true;
			this.fallBackTime = 0;
		}
	}

	stopFallBack() {
		this.isFallingBack = false;
		this.fallBackTime = 0;
		// 元の姿勢に戻す
		this.spineBone.rotation.x = 0;
		this.leftShoulderBone.rotation.z = -0.15;
		this.rightShoulderBone.rotation.z = 0.15;
		this.leftKneeBone.rotation.x = 0;
		this.rightKneeBone.rotation.x = 0;
		this.headBone.rotation.x = 0;
		this.rootBone.position.y = 3;
	}

	startJump() {
		if (!this.isJumping && !this.isAttacking && !this.isShooting) {
			this.isJumping = true;
			this.jumpTime = 0;
		}
	}

	move(direction, speed, deltaTime) {
		if (direction.length() > 0) {
			direction.normalize();
		}

		const currentSpeed = speed;
		this.velocity.copy(direction).multiplyScalar(currentSpeed * deltaTime);
		this.velocity.applyEuler(this.rotation);
		
		// 移動前の位置を保存
		const originalPosition = this.position.clone();
		
		// 新しい位置を計算
		const newPosition = this.position.clone().add(this.velocity);
		
		// 建物とのコリジョンチェック
		if (this.game && this.game.fieldMap) {
			const collisionRadius = 1.0; // キャラクターの衝突半径
			if (this.game.fieldMap.checkBuildingCollisionForCharacter(newPosition, collisionRadius)) {
				// 衝突した場合、移動をキャンセル
				this.isMoving = false;
				return;
			}
		}
		
		// 衝突がない場合、位置を更新
		this.position.copy(newPosition);
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
			this.character.rotation.y = y + Math.PI; // プレイヤーの場合は180度回転を加える
		} else {
			this.character.rotation.y = y;
		}
	}

	getRotation() {
		return this.rotation;
	}

	setRunning(isRunning) {
		this.isRunning=isRunning;
		// 走り状態に応じてアニメーション速度を調整（元の速度を維持）
		if (this.type === "player") {
			// プレイヤーモデル（自分）は高速
			this.animationSpeed = isRunning ? 16.0 : 8.0; // 半分に調整
		} else {
			// 他のプレイヤーは通常速度
			this.animationSpeed = isRunning ? 16.0 : 8.0;
		}
	}

	setAnimationSpeed(speed) {
		this.animationSpeed = speed;
	}

	startAttack() {
		this.isAttacking = true;
		this.attackTime = 0;
	}

	startShooting() {
		this.isShooting = true;
		this.shootTime = 0;
	}

	stopShooting() {
		this.isShooting = false;
	}

	setColor(color) {

		//console.log("color-" + color);

		// 色を16進数に変換
		const hexColor = (typeof color === 'string') ? parseInt(color, 16) : color;
		
		// デバッグログ
		//console.log('Setting character color:', hexColor.toString(16));
		
		// 上半身のパーツ（胴体、腕）
		const upperBodyParts = [
			this.headMesh,
			this.torsoMesh,
			this.leftUpperArmMesh,
			this.leftLowerArmMesh,
			this.rightUpperArmMesh,
			this.rightLowerArmMesh,
			this.hipMesh
		];
		
		// 下半身のパーツ
		const lowerBodyParts = [
			this.leftThighMesh,
			this.leftShinMesh,
			this.rightThighMesh,
			this.rightShinMesh,
			this.leftFootMesh,
			this.rightFootMesh
		];

		// 色をRGBに分解
		const r = (hexColor >> 16) & 255;
		const g = (hexColor >> 8) & 255;
		const b = hexColor & 255;

		// 上半身用の色を作成（より明るく）
		const upperR = Math.min(255, Math.floor(r * 1.6));
		const upperG = Math.min(255, Math.floor(g * 1.6));
		const upperB = Math.min(255, Math.floor(b * 1.6));
		const upperColor = (upperR << 16) | (upperG << 8) | upperB;

		// 下半身用の色を作成（上半身より暗め）
		const lowerR = Math.min(255, Math.floor(r * 0.8));
		const lowerG = Math.min(255, Math.floor(g * 0.8));
		const lowerB = Math.min(255, Math.floor(b * 0.8));
		const lowerColor = (lowerR << 16) | (lowerG << 8) | lowerB;

		// 上半身のパーツに色を設定
		upperBodyParts.forEach(part => {
			if (part && part.material) {
				part.material = new THREE.MeshPhongMaterial({
					color: upperColor,
					shininess: 5,
					specular: upperColor,
					emissive: upperColor,
					emissiveIntensity: 0.6,
					side: THREE.DoubleSide
				});
				part.material.needsUpdate = true;
			}
		});

		// 下半身のパーツに色を設定
		lowerBodyParts.forEach(part => {
			if (part && part.material) {
				part.material = new THREE.MeshPhongMaterial({
					color: lowerColor,
					shininess: 5,
					specular: lowerColor,
					emissive: lowerColor,
					emissiveIntensity: 0.6,
					side: THREE.DoubleSide
				});
				part.material.needsUpdate = true;
			}
		});
	}


	dispose() {
		this.scene.remove(this.character);
		
		// メッシュとマテリアルの解放
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