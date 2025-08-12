// デブなキャラクター作成用のクラス
class SlimeCharacter {
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

		// キャラクターの作成
		this.createCharacter();
	}

	createCharacter() {
		// マテリアルの定義
		const bodyMaterial = new THREE.MeshPhongMaterial({ 
			color: 0x4488ff,
			side: THREE.DoubleSide
		});
		
		const headMaterial = new THREE.MeshPhongMaterial({ 
			color: 0xffaa88,
			side: THREE.DoubleSide
		});
		
		const handMaterial = new THREE.MeshPhongMaterial({ 
			color: 0xffaa88,
			side: THREE.DoubleSide
		});

		// ルートボーン（腰）
		this.rootBone = new THREE.Bone();
		this.rootBone.position.y = 3;
		
		// 腰のメッシュ（太く）
		const hipGeometry = new THREE.BoxGeometry(3, 1.2, 1.5);
		this.hipMesh = new THREE.Mesh(hipGeometry, bodyMaterial);
		this.hipMesh.castShadow = true;
		this.hipMesh.receiveShadow = true;
		this.rootBone.add(this.hipMesh);
		
		// 胴体ボーン
		this.spineBone = new THREE.Bone();
		this.spineBone.position.y = 1;
		this.rootBone.add(this.spineBone);
		
		// 胴体メッシュ（太く）
		const torsoGeometry = new THREE.BoxGeometry(3, 2.5, 2);
		this.torsoMesh = new THREE.Mesh(torsoGeometry, bodyMaterial);
		this.torsoMesh.position.y = 0.5;
		this.torsoMesh.castShadow = true;
		this.torsoMesh.receiveShadow = true;
		this.spineBone.add(this.torsoMesh);
		
		// 首ボーン
		this.neckBone = new THREE.Bone();
		this.neckBone.position.y = 1.5;
		this.spineBone.add(this.neckBone);
		
		// 首メッシュ（太く）
		const neckGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
		this.neckMesh = new THREE.Mesh(neckGeometry, bodyMaterial);
		this.neckMesh.castShadow = true;
		this.neckBone.add(this.neckMesh);
		
		// 頭ボーン
		this.headBone = new THREE.Bone();
		this.headBone.position.y = 0.5;
		this.neckBone.add(this.headBone);
		
		// 頭メッシュ（太く）
		const headGeometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
		this.headMesh = new THREE.Mesh(headGeometry, headMaterial);
		this.headMesh.position.y = 0.5;
		this.headMesh.castShadow = true;
		this.headBone.add(this.headMesh);

		// 左腕の作成（太く）
		this.leftShoulderBone = new THREE.Bone();
		this.leftShoulderBone.position.set(1.8, 1, 0);
		this.spineBone.add(this.leftShoulderBone);
		
		const leftUpperArmGeometry = new THREE.BoxGeometry(0.7, 1.2, 0.7);
		this.leftUpperArmMesh = new THREE.Mesh(leftUpperArmGeometry, bodyMaterial);
		this.leftUpperArmMesh.position.y = -0.6;
		this.leftUpperArmMesh.castShadow = true;
		this.leftShoulderBone.add(this.leftUpperArmMesh);
		
		this.leftElbowBone = new THREE.Bone();
		this.leftElbowBone.position.y = -1.2;
		this.leftShoulderBone.add(this.leftElbowBone);
		
		const leftLowerArmGeometry = new THREE.BoxGeometry(0.6, 1.0, 0.6);
		this.leftLowerArmMesh = new THREE.Mesh(leftLowerArmGeometry, bodyMaterial);
		this.leftLowerArmMesh.position.y = -0.5;
		this.leftLowerArmMesh.castShadow = true;
		this.leftElbowBone.add(this.leftLowerArmMesh);
		
		this.leftHandBone = new THREE.Bone();
		this.leftHandBone.position.y = -1.0;
		this.leftElbowBone.add(this.leftHandBone);
		
		const leftHandGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.4);
		this.leftHandMesh = new THREE.Mesh(leftHandGeometry, handMaterial);
		this.leftHandMesh.position.y = -0.2;
		this.leftHandMesh.castShadow = true;
		this.leftHandBone.add(this.leftHandMesh);

		// 右腕の作成（太く）
		this.rightShoulderBone = new THREE.Bone();
		this.rightShoulderBone.position.set(-1.8, 1, 0);
		this.spineBone.add(this.rightShoulderBone);
		
		const rightUpperArmGeometry = new THREE.BoxGeometry(0.7, 1.2, 0.7);
		this.rightUpperArmMesh = new THREE.Mesh(rightUpperArmGeometry, bodyMaterial);
		this.rightUpperArmMesh.position.y = -0.6;
		this.rightUpperArmMesh.castShadow = true;
		this.rightShoulderBone.add(this.rightUpperArmMesh);
		
		this.rightElbowBone = new THREE.Bone();
		this.rightElbowBone.position.y = -1.2;
		this.rightShoulderBone.add(this.rightElbowBone);
		
		const rightLowerArmGeometry = new THREE.BoxGeometry(0.6, 1.0, 0.6);
		this.rightLowerArmMesh = new THREE.Mesh(rightLowerArmGeometry, bodyMaterial);
		this.rightLowerArmMesh.position.y = -0.5;
		this.rightLowerArmMesh.castShadow = true;
		this.rightElbowBone.add(this.rightLowerArmMesh);
		
		this.rightHandBone = new THREE.Bone();
		this.rightHandBone.position.y = -1.0;
		this.rightElbowBone.add(this.rightHandBone);
		
		const rightHandGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.4);
		this.rightHandMesh = new THREE.Mesh(rightHandGeometry, handMaterial);
		this.rightHandMesh.position.y = -0.2;
		this.rightHandMesh.castShadow = true;
		this.rightHandBone.add(this.rightHandMesh);

		// 左脚の作成（太く）
		this.leftHipBone = new THREE.Bone();
		this.leftHipBone.position.set(0.8, -0.5, 0);
		this.rootBone.add(this.leftHipBone);
		
		const leftThighGeometry = new THREE.BoxGeometry(0.9, 1.5, 0.9);
		this.leftThighMesh = new THREE.Mesh(leftThighGeometry, bodyMaterial);
		this.leftThighMesh.position.y = -0.75;
		this.leftThighMesh.castShadow = true;
		this.leftHipBone.add(this.leftThighMesh);
		
		this.leftKneeBone = new THREE.Bone();
		this.leftKneeBone.position.y = -1.5;
		this.leftHipBone.add(this.leftKneeBone);
		
		const leftShinGeometry = new THREE.BoxGeometry(0.8, 1.5, 0.8);
		this.leftShinMesh = new THREE.Mesh(leftShinGeometry, bodyMaterial);
		this.leftShinMesh.position.y = -0.75;
		this.leftShinMesh.castShadow = true;
		this.leftKneeBone.add(this.leftShinMesh);
		
		this.leftFootBone = new THREE.Bone();
		this.leftFootBone.position.y = -1.5;
		this.leftKneeBone.add(this.leftFootBone);
		
		const leftFootGeometry = new THREE.BoxGeometry(0.8, 0.3, 1.2);
		this.leftFootMesh = new THREE.Mesh(leftFootGeometry, bodyMaterial);
		this.leftFootMesh.position.set(0, -0.1, 0.2);
		this.leftFootMesh.castShadow = true;
		this.leftFootBone.add(this.leftFootMesh);

		// 右脚の作成（太く）
		this.rightHipBone = new THREE.Bone();
		this.rightHipBone.position.set(-0.8, -0.5, 0);
		this.rootBone.add(this.rightHipBone);
		
		const rightThighGeometry = new THREE.BoxGeometry(0.9, 1.5, 0.9);
		this.rightThighMesh = new THREE.Mesh(rightThighGeometry, bodyMaterial);
		this.rightThighMesh.position.y = -0.75;
		this.rightThighMesh.castShadow = true;
		this.rightHipBone.add(this.rightThighMesh);
		
		this.rightKneeBone = new THREE.Bone();
		this.rightKneeBone.position.y = -1.5;
		this.rightHipBone.add(this.rightKneeBone);
		
		const rightShinGeometry = new THREE.BoxGeometry(0.8, 1.5, 0.8);
		this.rightShinMesh = new THREE.Mesh(rightShinGeometry, bodyMaterial);
		this.rightShinMesh.position.y = -0.75;
		this.rightShinMesh.castShadow = true;
		this.rightKneeBone.add(this.rightShinMesh);
		
		this.rightFootBone = new THREE.Bone();
		this.rightFootBone.position.y = -1.5;
		this.rightKneeBone.add(this.rightFootBone);
		
		const rightFootGeometry = new THREE.BoxGeometry(0.8, 0.3, 1.2);
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

	setColor(color) {
		const hexColor = (typeof color === 'string') ? parseInt(color, 16) : color;
		
		console.log('Setting character color:', hexColor.toString(16));
		
		const bodyParts = [
			this.torsoMesh,
			this.leftUpperArmMesh,
			this.leftLowerArmMesh,
			this.rightUpperArmMesh,
			this.rightLowerArmMesh
		];
		
		const legParts = [
			this.leftThighMesh,
			this.leftShinMesh,
			this.rightThighMesh,
			this.rightShinMesh
		];

		bodyParts.forEach(part => {
			if (part && part.material) {
				part.material.color.setHex(hexColor);
				part.material.emissive.setHex(hexColor);
				part.material.needsUpdate = true;
			}
		});

		const darkerColor = Math.floor(hexColor * 0.7);
		legParts.forEach(part => {
			if (part && part.material) {
				part.material.color.setHex(darkerColor);
				part.material.emissive.setHex(darkerColor);
				part.material.needsUpdate = true;
			}
		});
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