class CrabCharacter {
    constructor(scene, type, game) {
        this.scene = scene;
        this.type = type;
        this.game = game;
        this.character = new THREE.Group();
        this.scene.add(this.character);
        
        // キャラクターのパーツ
        this.body = null;
        this.claws = [];
        this.legs = [];
        this.eyes = [];
        
        // アニメーション用の変数
        this.animationTime = 0;
        this.isMoving = false;
        this.isRunning = false;
        this.animationSpeed = 1.5;
        
        // 移動関連の変数
        this.position = new THREE.Vector3();
        this.rotation = new THREE.Euler();
        this.velocity = new THREE.Vector3();
        
        // 攻撃アニメーション用の変数
        this.isAttacking = false;
        this.attackTime = 0;
        this.attackDuration = 0.8;
        
        // キャラクターの作成
        this.createCharacter();
    }

    createCharacter() {
        // 胴体（丸みを帯びた甲羅）
        const bodyGeometry = new THREE.SphereGeometry(1.0, 32, 32);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xcc3333, 
            emissive: 0x662222, 
            emissiveIntensity: 0.3,
            roughness: 0.7
        });
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.body.scale.set(1.5, 0.8, 1.2);
        this.body.position.set(0, 0.8, 0);
        this.body.castShadow = true;
        this.character.add(this.body);

        // 目（長い眼柄付き）
        const eyeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x000000, 
            emissive: 0x000000, 
            emissiveIntensity: 0.5,
            roughness: 0.3
        });

        // 左目
        const leftEyeStalk = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8);
        const leftEyeStalkMesh = new THREE.Mesh(leftEyeStalk, eyeMaterial);
        leftEyeStalkMesh.position.set(-0.4, 0.4, 0.6);
        leftEyeStalkMesh.rotation.x = -Math.PI / 4;
        this.body.add(leftEyeStalkMesh);

        const leftEye = new THREE.SphereGeometry(0.1, 16, 16);
        const leftEyeMesh = new THREE.Mesh(leftEye, eyeMaterial);
        leftEyeMesh.position.set(0, 0.2, 0);
        leftEyeStalkMesh.add(leftEyeMesh);
        this.eyes.push(leftEyeStalkMesh);

        // 右目
        const rightEyeStalk = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8);
        const rightEyeStalkMesh = new THREE.Mesh(rightEyeStalk, eyeMaterial);
        rightEyeStalkMesh.position.set(0.4, 0.4, 0.6);
        rightEyeStalkMesh.rotation.x = -Math.PI / 4;
        this.body.add(rightEyeStalkMesh);

        const rightEye = new THREE.SphereGeometry(0.1, 16, 16);
        const rightEyeMesh = new THREE.Mesh(rightEye, eyeMaterial);
        rightEyeMesh.position.set(0, 0.2, 0);
        rightEyeStalkMesh.add(rightEyeMesh);
        this.eyes.push(rightEyeStalkMesh);

        // ハサミ（左右）
        const clawMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xcc3333, 
            emissive: 0x662222, 
            emissiveIntensity: 0.3,
            roughness: 0.7
        });

        // 左ハサミ
        const leftClaw = this.createClaw(clawMaterial);
        leftClaw.position.set(-1.2, 0.5, 0);
        leftClaw.rotation.y = Math.PI / 4;
        this.body.add(leftClaw);
        this.claws.push(leftClaw);

        // 右ハサミ
        const rightClaw = this.createClaw(clawMaterial);
        rightClaw.position.set(1.2, 0.5, 0);
        rightClaw.rotation.y = -Math.PI / 4;
        this.body.add(rightClaw);
        this.claws.push(rightClaw);

        // 脚（8本）
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xcc3333, 
            emissive: 0x662222, 
            emissiveIntensity: 0.3,
            roughness: 0.7
        });

        // 左側の脚
        for (let i = 0; i < 4; i++) {
            const leg = this.createLeg(legMaterial);
            const angle = (i * Math.PI / 6) - Math.PI / 3;
            leg.position.set(
                -0.8 * Math.cos(angle),
                0.3,
                -0.8 * Math.sin(angle)
            );
            leg.rotation.y = angle;
            this.body.add(leg);
            this.legs.push(leg);
        }

        // 右側の脚
        for (let i = 0; i < 4; i++) {
            const leg = this.createLeg(legMaterial);
            const angle = (i * Math.PI / 6) - Math.PI / 3;
            leg.position.set(
                0.8 * Math.cos(angle),
                0.3,
                -0.8 * Math.sin(angle)
            );
            leg.rotation.y = -angle;
            this.body.add(leg);
            this.legs.push(leg);
        }
    }

    createClaw(material) {
        const clawGroup = new THREE.Group();
        
        // ハサミの基部
        const baseGeometry = new THREE.CylinderGeometry(0.15, 0.1, 0.4, 8);
        const base = new THREE.Mesh(baseGeometry, material);
        base.rotation.x = Math.PI / 2;
        base.castShadow = true;
        clawGroup.add(base);

        // ハサミの可動部分
        const pincerGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.4);
        const pincer = new THREE.Mesh(pincerGeometry, material);
        pincer.position.set(0.2, 0, 0);
        pincer.castShadow = true;
        clawGroup.add(pincer);

        // ハサミの先端
        const tipGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
        const tip = new THREE.Mesh(tipGeometry, material);
        tip.position.set(0.35, 0, 0);
        tip.rotation.z = -Math.PI / 2;
        tip.castShadow = true;
        clawGroup.add(tip);

        return clawGroup;
    }

    createLeg(material) {
        const legGroup = new THREE.Group();
        
        // 脚の基部
        const baseGeometry = new THREE.CylinderGeometry(0.08, 0.05, 0.3, 8);
        const base = new THREE.Mesh(baseGeometry, material);
        base.rotation.x = Math.PI / 2;
        base.castShadow = true;
        legGroup.add(base);

        // 脚の関節
        const jointGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const joint = new THREE.Mesh(jointGeometry, material);
        joint.position.set(0.15, 0, 0);
        joint.castShadow = true;
        legGroup.add(joint);

        // 脚の先端
        const tipGeometry = new THREE.CylinderGeometry(0.03, 0.01, 0.4, 8);
        const tip = new THREE.Mesh(tipGeometry, material);
        tip.position.set(0.4, 0, 0);
        tip.rotation.x = Math.PI / 2;
        tip.castShadow = true;
        legGroup.add(tip);

        return legGroup;
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
            // ハサミを開く
            const openProgress = progress / 0.3;
            this.claws[0].rotation.z = openProgress * Math.PI / 3;
            this.claws[1].rotation.z = -openProgress * Math.PI / 3;
        } else if (progress < 0.6) {
            // ハサミを閉じる
            const closeProgress = (progress - 0.3) / 0.3;
            this.claws[0].rotation.z = Math.PI / 3 - closeProgress * Math.PI / 3;
            this.claws[1].rotation.z = -Math.PI / 3 + closeProgress * Math.PI / 3;
        } else {
            // 元の位置に戻す
            const resetProgress = (progress - 0.6) / 0.4;
            this.claws[0].rotation.z = 0;
            this.claws[1].rotation.z = 0;
        }
        
        if (progress >= 1) {
            this.isAttacking = false;
        }
    }

    updateLimbAnimation(deltaTime) {
        if (!this.isMoving) return;
        
        this.animationTime += deltaTime * this.animationSpeed;
        
        // 脚の動き
        for (let i = 0; i < this.legs.length; i++) {
            const leg = this.legs[i];
            const phase = (i * Math.PI / 4) + this.animationTime * 2;
            leg.rotation.x = Math.sin(phase) * 0.3;
        }
        
        // 目の動き
        for (const eye of this.eyes) {
            eye.rotation.x = -Math.PI / 4 + Math.sin(this.animationTime) * 0.1;
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
        this.animationSpeed = isRunning ? 2.0 : 1.5;
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