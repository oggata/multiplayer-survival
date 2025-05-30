class QuadrupedCharacter {
    constructor(scene, type, game) {
        this.scene = scene;
        this.type = type;
        this.game = game;
        this.character = new THREE.Group();
        this.scene.add(this.character);
        
        // キャラクターのパーツ
        this.head = null;
        this.body = null;
        this.frontLeftLeg = null;
        this.frontRightLeg = null;
        this.rearLeftLeg = null;
        this.rearRightLeg = null;
        
        // アニメーション用の変数
        this.animationTime = 0;
        this.isMoving = false;
        this.isRunning = false;
        this.animationSpeed = 2.0;
        this.walkAmplitude = 0.3;
        this.armSwingAmplitude = 1.2;
        
        // 移動関連の変数
        this.position = new THREE.Vector3();
        this.rotation = new THREE.Euler();
        this.velocity = new THREE.Vector3();
        
        // 攻撃アニメーション用の変数
        this.isAttacking = false;
        this.attackTime = 0;
        this.attackDuration = 0.4; // 攻撃モーションの持続時間（秒）

        // ダメージエフェクト用の変数
        this.isDamaged = false;
        this.damageTime = 0;
        this.damageDuration = 0.5;
        this.originalColors = new Map();

        // キャラクターの作成
        this.createCharacter();
    }
        // 攻撃モーションを開始
    startAttack() {
        this.isAttacking = true;
        this.attackTime = 0;
    }
    // 攻撃モーションをアップデート
    updateAttackAnimation(deltaTime) {
        if (!this.isAttacking) return;
        
        this.attackTime += deltaTime;
        
        // 攻撃モーションの進行度（0から1）
        const progress = Math.min(this.attackTime / this.attackDuration, 1);
        
        if (progress < 0.5) {
            // 攻撃モーションの前半：頭を上げ、前脚を上げる準備
            const upProgress = progress * 2;
            
            // 頭を上げる
            this.head.rotation.x = -upProgress * Math.PI / 4; // 最大45度上げる
            
            // 前脚を少し持ち上げる
            this.frontLeftLeg.rotation.x = -0.2 - upProgress * 0.4;
            this.frontRightLeg.rotation.x = -0.2 - upProgress * 0.4;
            
            // 身体を少し後ろに傾ける
            this.body.rotation.x = upProgress * 0.2;
        } else {
            // 攻撃モーションの後半：頭を下げ、前脚で地面を叩く
            const downProgress = (progress - 0.5) * 2;
            
            // 頭を下げる
            this.head.rotation.x = -(Math.PI / 4) + downProgress * Math.PI / 3;
            
            // 前脚を下げる（叩きつける）
            this.frontLeftLeg.rotation.x = -0.6 + downProgress * 0.8;
            this.frontRightLeg.rotation.x = -0.6 + downProgress * 0.8;
            
            // 身体を前に傾ける
            this.body.rotation.x = 0.2 - downProgress * 0.3;
        }
        
        // 攻撃モーションが完了したら終了
        if (progress >= 1) {
            this.isAttacking = false;
            // 位置をリセット
            this.head.rotation.x = 0;
            this.frontLeftLeg.rotation.x = -0.2;
            this.frontRightLeg.rotation.x = -0.2;
            this.body.rotation.x = 0;
        }
    }
    createCharacter() {
        // 頭部
        const headGeometry = new THREE.BoxGeometry(0.8, 0.6, 1.0);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x6a7a5d, 
            emissive: 0x6a7a5d, 
            emissiveIntensity: 0.5,
            roughness: 0.9
        });
        this.head = new THREE.Mesh(headGeometry, headMaterial);
        this.head.position.set(0, 1.0, 0.5);
        this.head.castShadow = true;
        this.character.add(this.head);
        
        // 目（赤く光る）
        const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff0000, 
            emissive: 0xff0000, 
            emissiveIntensity: 1.0 
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.2, 0.1, 0.4);
        this.head.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.2, 0.1, 0.4);
        this.head.add(rightEye);
        
        // 胴体
        const bodyGeometry = new THREE.BoxGeometry(1.0, 0.7, 1.5);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x6a7a5d, 
            emissive: 0x6a7a5d, 
            emissiveIntensity: 0.5,
            roughness: 0.8
        });
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.body.position.set(0, 0.9, -0.2);
        this.body.castShadow = true;
        this.character.add(this.body);
        
        // 脚の作成
        const legGeometry = new THREE.CylinderGeometry(0.15, 0.1, 0.8, 8);
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x5a6a4d, 
            emissive: 0x5a6a4d, 
            emissiveIntensity: 0.5,
            roughness: 1.0
        });
        
        // 前脚
        this.frontLeftLeg = new THREE.Mesh(legGeometry, legMaterial);
        this.frontLeftLeg.position.set(-0.4, 0.4, 0.4);
        this.frontLeftLeg.castShadow = true;
        this.character.add(this.frontLeftLeg);
        
        this.frontRightLeg = new THREE.Mesh(legGeometry, legMaterial);
        this.frontRightLeg.position.set(0.4, 0.4, 0.4);
        this.frontRightLeg.castShadow = true;
        this.character.add(this.frontRightLeg);
        
        // 後脚
        this.rearLeftLeg = new THREE.Mesh(legGeometry, legMaterial);
        this.rearLeftLeg.position.set(-0.4, 0.4, -0.6);
        this.rearLeftLeg.castShadow = true;
        this.character.add(this.rearLeftLeg);
        
        this.rearRightLeg = new THREE.Mesh(legGeometry, legMaterial);
        this.rearRightLeg.position.set(0.4, 0.4, -0.6);
        this.rearRightLeg.castShadow = true;
        this.character.add(this.rearRightLeg);
        
        // 脚の傾き設定
        this.frontLeftLeg.rotation.x = -0.2;
        this.frontRightLeg.rotation.x = -0.2;
        this.rearLeftLeg.rotation.x = 0.2;
        this.rearRightLeg.rotation.x = 0.2;
    }
    
    // キャラクターの色を設定するメソッド
    setEnemyColor(color) {
        const bodyParts = [
            this.head, this.body, this.frontLeftLeg, this.frontRightLeg, 
            this.rearLeftLeg, this.rearRightLeg
        ];
        
        bodyParts.forEach(part => {
            if (part && part.material) {
                part.material.color.setHex(color);
                part.material.emissive.setHex(color);
            }
        });
        
        // 目の色は変更しない（常に赤色）
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
            this.body,
            this.head,
            this.frontLeftLeg,
            this.frontRightLeg,
            this.rearLeftLeg,
            this.rearRightLeg
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
            this.body,
            this.head,
            this.frontLeftLeg,
            this.frontRightLeg,
            this.rearLeftLeg,
            this.rearRightLeg
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

    // 四足歩行の特徴的なアニメーション
    updateLimbAnimation(deltaTime) {
        // ダメージエフェクトの更新
        if (this.isDamaged) {
            this.damageTime += deltaTime;
            if (this.damageTime >= this.damageDuration) {
                this.isDamaged = false;
                this.restoreOriginalColors();
            }
        }

        // 既存のアニメーション処理
        this.animationTime += deltaTime * this.animationSpeed;
          // 攻撃中なら攻撃アニメーションを優先
        if (this.isAttacking) {
            this.updateAttackAnimation(deltaTime);
            return;
        }
        if (this.isMoving) {
            // 四足歩行のアニメーション（対角の足が同時に動く）
            const frontLeftAngle = Math.sin(this.animationTime * 10) * 0.4;
            const frontRightAngle = Math.sin(this.animationTime * 10 + Math.PI) * 0.4;
            const rearLeftAngle = Math.sin(this.animationTime * 10 + Math.PI) * 0.4;
            const rearRightAngle = Math.sin(this.animationTime * 10) * 0.4;
            
            // 各脚の回転を設定
            this.frontLeftLeg.rotation.x = -0.2 + frontLeftAngle;
            this.frontRightLeg.rotation.x = -0.2 + frontRightAngle;
            this.rearLeftLeg.rotation.x = 0.2 + rearLeftAngle;
            this.rearRightLeg.rotation.x = 0.2 + rearRightAngle;
            
            // 頭と胴体の揺れ
            this.body.rotation.z = Math.sin(this.animationTime * 10) * 0.05;
            this.head.rotation.z = Math.sin(this.animationTime * 10) * 0.1;
            
            // 上下の動き
            const verticalOffset = Math.abs(Math.sin(this.animationTime * 10)) * 0.1;
            this.character.position.y = this.position.y + verticalOffset;
        } else {
            // アイドル状態のアニメーション
            const idleAngle = Math.sin(this.animationTime * 3) * 0.05;
            
            this.frontLeftLeg.rotation.x = -0.2 + idleAngle;
            this.frontRightLeg.rotation.x = -0.2 - idleAngle;
            this.rearLeftLeg.rotation.x = 0.2 + idleAngle;
            this.rearRightLeg.rotation.x = 0.2 - idleAngle;
            
            // 微かな呼吸のような動き
            this.body.scale.y = 1 + Math.sin(this.animationTime * 2) * 0.02;
            this.head.rotation.y = Math.sin(this.animationTime) * 0.1;
            
            // アイドル時は元の位置に戻す
            this.character.position.y = this.position.y;
        }
    }
    
    // Character クラスと同様のインターフェースを維持
    move(direction, speed, deltaTime) {
        // 移動方向を正規化
        if (direction.length() > 0) {
            direction.normalize();
        }
        
        // 速度を設定
        const currentSpeed = speed * 1.2; // 四足歩行は少し速い
        
        // 移動ベクトルを計算
        this.velocity.copy(direction).multiplyScalar(currentSpeed * deltaTime);
        
        // 回転に基づいて移動方向を変換
        this.velocity.applyEuler(this.rotation);
        
        // 位置を更新
        this.position.add(this.velocity);
        
        // キャラクターの位置を更新
        this.character.position.copy(this.position);
        
        // 移動状態を更新
        this.isMoving = direction.length() > 0;
        
        // 高さを修正
        var height = this.game.fieldMap.getHeightAt(this.position.x, this.position.z);
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
        this.character.rotation.y = y;
    }
    
    getRotation() {
        return this.rotation;
    }
    
    setRunning(isRunning) {
        this.isRunning = isRunning;
        this.animationSpeed = isRunning ? 3.0 : 2.0;
    }

    dispose() {
        // キャラクターを削除
        this.scene.remove(this.character);
        
        // ジオメトリとマテリアルを解放
        const parts = [
            this.head, this.body, this.frontLeftLeg, this.frontRightLeg,
            this.rearLeftLeg, this.rearRightLeg
        ];
        
        parts.forEach(part => {
            if (part) {
                if (part.geometry) part.geometry.dispose();
                if (part.material) part.material.dispose();
            }
        });
    }
}