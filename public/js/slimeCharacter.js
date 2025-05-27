class SlimeCharacter {
    constructor(scene, type, game) {
        this.scene = scene;
        this.type = type;
        this.game = game;
        this.character = new THREE.Group();
        this.scene.add(this.character);
        
        // キャラクターのパーツ
        this.body = null;
        this.eyes = [];
        this.blobs = [];
        
        // アニメーション用の変数
        this.animationTime = 0;
        this.isMoving = false;
        this.isRunning = false;
        this.animationSpeed = 1.0;
        
        // 移動関連の変数
        this.position = new THREE.Vector3();
        this.rotation = new THREE.Euler();
        this.velocity = new THREE.Vector3();
        
        // 攻撃アニメーション用の変数
        this.isAttacking = false;
        this.attackTime = 0;
        this.attackDuration = 1.0;
        
        // スライムの変形用変数
        this.squishFactor = 1.0;
        this.blobCount = 5;
        
        // キャラクターの作成
        this.createCharacter();
    }

    createCharacter() {
        // メインのスライム体
        const bodyGeometry = new THREE.SphereGeometry(0.8, 32, 32);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x33cc33, 
            emissive: 0x113311, 
            emissiveIntensity: 0.3,
            roughness: 0.3,
            transparent: true,
            opacity: 0.8
        });
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.body.position.set(0, 0.8, 0);
        this.body.castShadow = true;
        this.character.add(this.body);

        // 目（光る目）
        const eyeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff, 
            emissive: 0xffffff, 
            emissiveIntensity: 0.8,
            roughness: 0.3
        });

        // 左目
        const leftEye = new THREE.SphereGeometry(0.15, 16, 16);
        const leftEyeMesh = new THREE.Mesh(leftEye, eyeMaterial);
        leftEyeMesh.position.set(-0.3, 0.3, 0.6);
        this.body.add(leftEyeMesh);
        this.eyes.push(leftEyeMesh);

        // 右目
        const rightEye = new THREE.SphereGeometry(0.15, 16, 16);
        const rightEyeMesh = new THREE.Mesh(rightEye, eyeMaterial);
        rightEyeMesh.position.set(0.3, 0.3, 0.6);
        this.body.add(rightEyeMesh);
        this.eyes.push(rightEyeMesh);

        // 小さなスライムの塊
        const blobMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x33cc33, 
            emissive: 0x113311, 
            emissiveIntensity: 0.3,
            roughness: 0.3,
            transparent: true,
            opacity: 0.6
        });

        // 複数の小さなスライムを生成
        for (let i = 0; i < this.blobCount; i++) {
            const blob = this.createBlob(blobMaterial);
            const angle = (i / this.blobCount) * Math.PI * 2;
            const radius = 0.6;
            blob.position.set(
                Math.cos(angle) * radius,
                0.4,
                Math.sin(angle) * radius
            );
            this.body.add(blob);
            this.blobs.push(blob);
        }
    }

    createBlob(material) {
        const blobGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const blob = new THREE.Mesh(blobGeometry, material);
        blob.castShadow = true;
        return blob;
    }

    startAttack() {
        this.isAttacking = true;
        this.attackTime = 0;
    }

    updateAttackAnimation(deltaTime) {
        if (!this.isAttacking) return;
        
        this.attackTime += deltaTime;
        const progress = Math.min(this.attackTime / this.attackDuration, 1);
        
        if (progress < 0.3) {
            // 攻撃準備：スライムが伸びる
            const prepProgress = progress / 0.3;
            this.body.scale.y = 1.0 + prepProgress * 0.5;
            this.body.scale.x = 1.0 - prepProgress * 0.2;
            this.body.scale.z = 1.0 - prepProgress * 0.2;
            this.body.position.y = 0.8 + prepProgress * 0.4;
        } else if (progress < 0.6) {
            // 攻撃実行：スライムが跳ねる
            const attackProgress = (progress - 0.3) / 0.3;
            this.body.scale.y = 1.5 - attackProgress * 0.7;
            this.body.scale.x = 0.8 + attackProgress * 0.4;
            this.body.scale.z = 0.8 + attackProgress * 0.4;
            this.body.position.y = 1.2 - attackProgress * 0.8;
        } else {
            // 攻撃終了：元の形に戻る
            const resetProgress = (progress - 0.6) / 0.4;
            this.body.scale.y = 0.8 + resetProgress * 0.2;
            this.body.scale.x = 1.2 - resetProgress * 0.2;
            this.body.scale.z = 1.2 - resetProgress * 0.2;
            this.body.position.y = 0.4 + resetProgress * 0.4;
        }
        
        if (progress >= 1) {
            this.isAttacking = false;
            this.body.scale.set(1.0, 1.0, 1.0);
            this.body.position.y = 0.8;
        }
    }

    updateLimbAnimation(deltaTime) {
        if (!this.isMoving) return;
        
        this.animationTime += deltaTime * this.animationSpeed;
        
        // スライムの変形アニメーション
        this.squishFactor = 1.0 + Math.sin(this.animationTime * 2) * 0.1;
        this.body.scale.y = this.squishFactor;
        this.body.scale.x = 2.0 - this.squishFactor;
        this.body.scale.z = 2.0 - this.squishFactor;
        
        // 小さなスライムの塊の動き
        for (let i = 0; i < this.blobs.length; i++) {
            const blob = this.blobs[i];
            const phase = (i * Math.PI / 4) + this.animationTime * 2;
            blob.position.y = 0.4 + Math.sin(phase) * 0.1;
            blob.scale.set(
                1.0 + Math.sin(phase) * 0.2,
                1.0 + Math.sin(phase) * 0.2,
                1.0 + Math.sin(phase) * 0.2
            );
        }
        
        // 目の動き
        for (const eye of this.eyes) {
            eye.position.y = 0.3 + Math.sin(this.animationTime * 3) * 0.05;
        }
    }

    move(direction, speed, deltaTime) {
        // 移動方向を正規化
        if (direction.length() > 0) {
            direction.normalize();
        }
        
        // 速度を設定（六足歩行は非常に速い）
        const currentSpeed = speed * 1.4;
        
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
        this.animationSpeed = isRunning ? 1.5 : 1.0;
    }
    // キャラクターの色を設定するメソッド
    setEnemyColor(color) {
        // 頭と体の色を設定
        if (this.head && this.head.material) {
            this.head.material.color.setHex(color);
            this.head.material.emissive.setHex(color);
        }
        
        // 体節の色を設定
        if (this.body && this.body.material) {
            this.body.material.color.setHex(color);
            this.body.material.emissive.setHex(color);
        }
    }
    dispose() {
        this.scene.remove(this.character);
        this.character.traverse((object) => {
            if (object.geometry) {
                object.geometry.dispose();
            }
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
    }
} 