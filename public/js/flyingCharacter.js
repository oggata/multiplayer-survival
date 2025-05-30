class FlyingCharacter {
    constructor(scene, type, game) {
        this.scene = scene;
        this.type = type;
        this.game = game;
        this.character = new THREE.Group();
        this.scene.add(this.character);
        
        // キャラクターのパーツ
        this.body = null;
        this.wings = [];
        this.eyes = [];
        this.tail = null;
        
        // アニメーション用の変数
        this.animationTime = 0;
        this.isMoving = false;
        this.isRunning = false;
        this.animationSpeed = 2.0;
        
        // 移動関連の変数
        this.position = new THREE.Vector3();
        this.rotation = new THREE.Euler();
        this.velocity = new THREE.Vector3();
        
        // 攻撃アニメーション用の変数
        this.isAttacking = false;
        this.attackTime = 0;
        this.attackDuration = 0.6;
        
        // ダメージエフェクト用の変数
        this.isDamaged = false;
        this.damageTime = 0;
        this.damageDuration = 0.5;
        this.originalColors = new Map();
        
        // 飛行高度
        this.flyingHeight = 3.0;
        
        // キャラクターの作成
        this.createCharacter();
    }

    createCharacter() {
        // 胴体（細長い流線型）
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8, 16);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3366cc, 
            emissive: 0x112244, 
            emissiveIntensity: 0.3,
            roughness: 0.6
        });
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.body.rotation.x = Math.PI / 2;
        this.body.position.set(0, this.flyingHeight, 0);
        this.body.castShadow = true;
        this.character.add(this.body);

        // 目（光る目）
        const eyeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffff00, 
            emissive: 0xffff00, 
            emissiveIntensity: 0.8,
            roughness: 0.3
        });

        // 左目
        const leftEye = new THREE.SphereGeometry(0.1, 16, 16);
        const leftEyeMesh = new THREE.Mesh(leftEye, eyeMaterial);
        leftEyeMesh.position.set(-0.2, 0.1, 0.3);
        this.body.add(leftEyeMesh);
        this.eyes.push(leftEyeMesh);

        // 右目
        const rightEye = new THREE.SphereGeometry(0.1, 16, 16);
        const rightEyeMesh = new THREE.Mesh(rightEye, eyeMaterial);
        rightEyeMesh.position.set(0.2, 0.1, 0.3);
        this.body.add(rightEyeMesh);
        this.eyes.push(rightEyeMesh);

        // 翼（左右）
        const wingMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3366cc, 
            emissive: 0x112244, 
            emissiveIntensity: 0.3,
            roughness: 0.6,
            transparent: true,
            opacity: 0.8
        });

        // 左翼
        const leftWing = this.createWing(wingMaterial);
        leftWing.position.set(-0.4, 0, 0);
        this.body.add(leftWing);
        this.wings.push(leftWing);

        // 右翼
        const rightWing = this.createWing(wingMaterial);
        rightWing.position.set(0.4, 0, 0);
        rightWing.scale.x = -1; // 右翼を反転
        this.body.add(rightWing);
        this.wings.push(rightWing);

        // 尾
        const tailMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3366cc, 
            emissive: 0x112244, 
            emissiveIntensity: 0.3,
            roughness: 0.6
        });
        this.tail = this.createTail(tailMaterial);
        this.tail.position.set(0, 0, -0.8);
        this.body.add(this.tail);
    }

    createWing(material) {
        const wingGroup = new THREE.Group();
        
        // 翼の基部
        const baseGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8);
        const base = new THREE.Mesh(baseGeometry, material);
        base.rotation.x = Math.PI / 2;
        base.castShadow = true;
        wingGroup.add(base);

        // 翼の膜
        const membraneGeometry = new THREE.PlaneGeometry(1.2, 0.6);
        const membrane = new THREE.Mesh(membraneGeometry, material);
        membrane.position.set(0.6, 0, 0);
        membrane.rotation.y = Math.PI / 2;
        membrane.castShadow = true;
        wingGroup.add(membrane);

        return wingGroup;
    }

    createTail(material) {
        const tailGroup = new THREE.Group();
        
        // 尾の基部
        const baseGeometry = new THREE.CylinderGeometry(0.1, 0.05, 0.4, 8);
        const base = new THREE.Mesh(baseGeometry, material);
        base.rotation.x = Math.PI / 2;
        base.castShadow = true;
        tailGroup.add(base);

        // 尾の先端
        const tipGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
        const tip = new THREE.Mesh(tipGeometry, material);
        tip.position.set(0.35, 0, 0);
        tip.rotation.z = -Math.PI / 2;
        tip.castShadow = true;
        tailGroup.add(tip);

        return tailGroup;
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
            // 急降下の準備
            const prepProgress = progress / 0.3;
            this.body.rotation.x = Math.PI / 2 + prepProgress * Math.PI / 4;
            this.flyingHeight = 3.0 - prepProgress * 2.0;
        } else if (progress < 0.6) {
            // 急降下
            const diveProgress = (progress - 0.3) / 0.3;
            this.body.rotation.x = Math.PI / 2 + Math.PI / 4 - diveProgress * Math.PI / 2;
            this.flyingHeight = 1.0 + diveProgress * 2.0;
        } else {
            // 元の位置に戻る
            const resetProgress = (progress - 0.6) / 0.4;
            this.body.rotation.x = Math.PI / 2 - resetProgress * Math.PI / 4;
            this.flyingHeight = 3.0;
        }
        
        if (progress >= 1) {
            this.isAttacking = false;
            this.body.rotation.x = Math.PI / 2;
            this.flyingHeight = 3.0;
        }
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

        if (!this.isMoving) return;
        
        this.animationTime += deltaTime * this.animationSpeed;
        
        // 翼の動き
        for (let i = 0; i < this.wings.length; i++) {
            const wing = this.wings[i];
            const phase = i * Math.PI + this.animationTime * 4;
            wing.rotation.z = Math.sin(phase) * 0.5;
        }
        
        // 尾の動き
        if (this.tail) {
            this.tail.rotation.y = Math.sin(this.animationTime * 2) * 0.2;
        }
        
        // 目の点滅
        for (const eye of this.eyes) {
            eye.material.emissiveIntensity = 0.8 + Math.sin(this.animationTime * 3) * 0.2;
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
        if (this.body) {
            this.body.children.forEach(segment => {
                if (segment.material) {
                    segment.material.color.setHex(color);
                    segment.material.emissive.setHex(color);
                }
            });
        }
        

    }

    setRunning(isRunning) {
        this.isRunning = isRunning;
        this.animationSpeed = isRunning ? 3.0 : 2.0;
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
            ...this.wings,
            ...this.eyes,
            this.tail
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
            ...this.wings,
            ...this.eyes,
            this.tail
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
} 