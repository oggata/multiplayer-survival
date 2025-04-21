// キャラクター作成用のクラス
class Character {
    constructor(scene) {
        this.scene = scene;
        this.character = null;
        this.head = null;
        this.body = null;
        this.leftArm = null;
        this.rightArm = null;
        this.leftLeg = null;
        this.rightLeg = null;
        this.walkCycle = 0;
        this.isMoving = false;
        this.isRunning = false;
        this.animationTime = 0;
        
        // 色の定義
        this.SKIN_COLOR = 0xf5d0a9;
        this.HAIR_COLOR = 0x4f3222;
        this.SHIRT_COLOR = 0x3498db;
        this.PANTS_COLOR = 0x2c3e50;
        this.SHOES_COLOR = 0x34495e;
        
        // キャラクターを作成
        this.createBoxCharacter();
    }
    
    // ボックスを使用したキャラクターの作成
    createBoxCharacter() {
        // キャラクターのグループを作成
        this.character = new THREE.Group();
        this.character.position.y = 0;
        this.scene.add(this.character);
        
        // 体の部分のマテリアルを作成
        const headMaterial = new THREE.MeshStandardMaterial({ color: this.SKIN_COLOR });
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: this.SHIRT_COLOR });
        const armMaterial = new THREE.MeshStandardMaterial({ color: this.SHIRT_COLOR });
        const legMaterial = new THREE.MeshStandardMaterial({ color: this.PANTS_COLOR });
        const shoeMaterial = new THREE.MeshStandardMaterial({ color: this.SHOES_COLOR });
        const hairMaterial = new THREE.MeshStandardMaterial({ color: this.HAIR_COLOR });

        // 頭の作成
        const headGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        this.head = new THREE.Mesh(headGeometry, headMaterial);
        this.head.position.y = 1.7;
        this.head.castShadow = true;
        this.character.add(this.head);

        // 髪の毛（頭の上部）
        const hairGeometry = new THREE.BoxGeometry(0.35, 0.1, 0.35);
        const hair = new THREE.Mesh(hairGeometry, hairMaterial);
        hair.position.y = 0.2;
        this.head.add(hair);

        // 目
        const eyeGeometry = new THREE.BoxGeometry(0.04, 0.04, 0.04);
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(0.08, 0.03, 0.16);
        this.head.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(-0.08, 0.03, 0.16);
        this.head.add(rightEye);

        // 口
        const mouthGeometry = new THREE.BoxGeometry(0.12, 0.02, 0.04);
        const mouthMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
        mouth.position.set(0, -0.08, 0.16);
        this.head.add(mouth);

        // 胴体の作成
        const bodyGeometry = new THREE.BoxGeometry(0.5, 0.6, 0.3);
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.body.position.y = 1.2;
        this.body.castShadow = true;
        this.character.add(this.body);

        // 左腕の作成
        const leftArmGroup = new THREE.Group();
        leftArmGroup.position.set(0.3, 1.4, 0);
        this.character.add(leftArmGroup);

        const leftArmGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.1);
        const leftArmMesh = new THREE.Mesh(leftArmGeometry, armMaterial);
        leftArmMesh.position.y = -0.25;
        leftArmMesh.castShadow = true;
        leftArmGroup.add(leftArmMesh);

        // 右腕の作成
        const rightArmGroup = new THREE.Group();
        rightArmGroup.position.set(-0.3, 1.4, 0);
        this.character.add(rightArmGroup);

        const rightArmGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.1);
        const rightArmMesh = new THREE.Mesh(rightArmGeometry, armMaterial);
        rightArmMesh.position.y = -0.25;
        rightArmMesh.castShadow = true;
        rightArmGroup.add(rightArmMesh);

        // 左脚の作成
        const leftLegGroup = new THREE.Group();
        leftLegGroup.position.set(0.15, 0.9, 0);
        this.character.add(leftLegGroup);

        const leftLegGeometry = new THREE.BoxGeometry(0.15, 0.5, 0.15);
        const leftLegMesh = new THREE.Mesh(leftLegGeometry, legMaterial);
        leftLegMesh.position.y = -0.25;
        leftLegMesh.castShadow = true;
        leftLegGroup.add(leftLegMesh);

        // 左靴の作成
        const leftShoeGeometry = new THREE.BoxGeometry(0.18, 0.1, 0.25);
        const leftShoe = new THREE.Mesh(leftShoeGeometry, shoeMaterial);
        leftShoe.position.set(0, -0.5, 0.05);
        leftShoe.castShadow = true;
        leftLegGroup.add(leftShoe);

        // 右脚の作成
        const rightLegGroup = new THREE.Group();
        rightLegGroup.position.set(-0.15, 0.9, 0);
        this.character.add(rightLegGroup);

        const rightLegGeometry = new THREE.BoxGeometry(0.15, 0.5, 0.15);
        const rightLegMesh = new THREE.Mesh(rightLegGeometry, legMaterial);
        rightLegMesh.position.y = -0.25;
        rightLegMesh.castShadow = true;
        rightLegGroup.add(rightLegMesh);

        // 右靴の作成
        const rightShoeGeometry = new THREE.BoxGeometry(0.18, 0.1, 0.25);
        const rightShoe = new THREE.Mesh(rightShoeGeometry, shoeMaterial);
        rightShoe.position.set(0, -0.5, 0.05);
        rightShoe.castShadow = true;
        rightLegGroup.add(rightShoe);

        // アニメーション用の参照を保存
        this.leftArm = leftArmGroup;
        this.rightArm = rightArmGroup;
        this.leftLeg = leftLegGroup;
        this.rightLeg = rightLegGroup;
    }
    
    // 手足のアニメーション更新
    updateLimbAnimation(deltaTime) {
        // 移動中かどうかでアニメーションを切り替え
        const isMoving = this.isMoving;
        
        // アニメーションの進行度を更新
        this.animationTime += deltaTime * 20; // アニメーション速度を調整
        
        // 腕のアニメーション
        if (isMoving) {
            this.leftArm.rotation.x = Math.sin(this.animationTime) * 0.5;
            this.rightArm.rotation.x = Math.sin(this.animationTime + Math.PI) * 0.5;
        } else {
            this.leftArm.rotation.x = Math.sin(this.animationTime * 0.5) * 0.1;
            this.rightArm.rotation.x = Math.sin(this.animationTime * 0.5 + Math.PI) * 0.1;
        }
        
        // 足のアニメーション
        if (isMoving) {
            this.leftLeg.rotation.x = Math.sin(this.animationTime) * 0.5;
            this.rightLeg.rotation.x = Math.sin(this.animationTime + Math.PI) * 0.5;
        } else {
            this.leftLeg.rotation.x = Math.sin(this.animationTime * 0.5) * 0.1;
            this.rightLeg.rotation.x = Math.sin(this.animationTime * 0.5 + Math.PI) * 0.1;
        }
    }
    
    // キャラクターの位置を取得
    getPosition() {
        return this.character.position;
    }
    
    // キャラクターの回転を取得
    getRotation() {
        return this.character.rotation;
    }
    
    // キャラクターの位置を設定
    setPosition(x, y, z) {
        this.character.position.set(x, y, z);
    }
    
    // キャラクターの回転を設定
    setRotation(y) {
        this.character.rotation.y = y;
    }
    
    // キャラクターを移動
    move(direction, speed, deltaTime) {
        this.isMoving = direction.length() > 0;
        
        if (this.isMoving) {
            // キャラクターの現在の向きに基づいて移動方向を回転
            const rotatedDirection = direction.clone();
            rotatedDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.character.rotation.y);
            
            // 移動量を計算
            const moveAmount = speed * deltaTime;
            
            // キャラクターを移動方向に動かす
            this.character.position.x += rotatedDirection.x * moveAmount;
            this.character.position.z += rotatedDirection.z * moveAmount;
            
            // デバッグ用：移動情報をコンソールに出力
            console.log('Character moved:', {
                position: this.character.position,
                direction: direction,
                rotatedDirection: rotatedDirection,
                speed: speed,
                deltaTime: deltaTime,
                moveAmount: moveAmount
            });
        }
    }
    
    // 走るかどうかを設定
    setRunning(isRunning) {
        this.isRunning = isRunning;
    }
    
    // キャラクターを削除
    dispose() {
        if (this.character) {
            this.scene.remove(this.character);
        }
    }
} 