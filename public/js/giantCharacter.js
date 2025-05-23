class GiantCharacter {
    constructor(scene, type, game) {
        this.scene = scene;
        this.type = type;
        this.game = game;
        this.character = new THREE.Group();
        this.scene.add(this.character);
        
        // キャラクターのパーツ
        this.head = null;
        this.body = null;
        this.arms = [];
        this.legs = [];
        
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
        this.attackDuration = 1.0; // 攻撃モーションの持続時間（秒）
        
        // キャラクターの作成
        this.createCharacter();
    }

    createCharacter() {
        // 頭部（大きな四角い頭）
        const headGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4a4a4a, 
            emissive: 0x2a2a2a, 
            emissiveIntensity: 0.3,
            roughness: 0.8
        });
        this.head = new THREE.Mesh(headGeometry, headMaterial);
        this.head.position.set(0, 3.5, 0);
        this.head.castShadow = true;
        this.character.add(this.head);

        // 目（赤く光る）
        const eyeGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const eyeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff0000, 
            emissive: 0xff0000, 
            emissiveIntensity: 0.8,
            roughness: 0.3
        });

        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.4, 0.2, 0.7);
        this.head.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.4, 0.2, 0.7);
        this.head.add(rightEye);

        // 胴体（大きな四角い体）
        const bodyGeometry = new THREE.BoxGeometry(2.5, 2.5, 2.5);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4a4a4a, 
            emissive: 0x2a2a2a, 
            emissiveIntensity: 0.3,
            roughness: 0.8
        });
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.body.position.set(0, 1.5, 0);
        this.body.castShadow = true;
        this.character.add(this.body);

        // 腕（太い腕）
        const armMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4a4a4a, 
            emissive: 0x2a2a2a, 
            emissiveIntensity: 0.3,
            roughness: 0.8
        });

        // 左腕
        const leftArm = this.createArm(armMaterial);
        leftArm.position.set(-1.5, 0.5, 0);
        this.body.add(leftArm);
        this.arms.push(leftArm);

        // 右腕
        const rightArm = this.createArm(armMaterial);
        rightArm.position.set(1.5, 0.5, 0);
        this.body.add(rightArm);
        this.arms.push(rightArm);

        // 脚（太い脚）
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4a4a4a, 
            emissive: 0x2a2a2a, 
            emissiveIntensity: 0.3,
            roughness: 0.8
        });

        // 左脚
        const leftLeg = this.createLeg(legMaterial);
        leftLeg.position.set(-0.6, -1.5, 0);
        this.body.add(leftLeg);
        this.legs.push(leftLeg);

        // 右脚
        const rightLeg = this.createLeg(legMaterial);
        rightLeg.position.set(0.6, -1.5, 0);
        this.body.add(rightLeg);
        this.legs.push(rightLeg);
    }

    createArm(material) {
        const armGroup = new THREE.Group();
        
        // 上腕
        const upperArmGeometry = new THREE.CylinderGeometry(0.4, 0.3, 1.5, 8);
        const upperArm = new THREE.Mesh(upperArmGeometry, material);
        upperArm.position.set(0, -0.75, 0);
        upperArm.rotation.x = Math.PI / 2;
        upperArm.castShadow = true;
        armGroup.add(upperArm);

        // 肘関節
        const elbowGroup = new THREE.Group();
        elbowGroup.position.set(0, -1.5, 0);
        armGroup.add(elbowGroup);

        // 前腕
        const forearmGeometry = new THREE.CylinderGeometry(0.3, 0.2, 1.5, 8);
        const forearm = new THREE.Mesh(forearmGeometry, material);
        forearm.position.set(0, -0.75, 0);
        forearm.castShadow = true;
        elbowGroup.add(forearm);

        // 関節情報を保存
        armGroup.userData = {
            elbow: elbowGroup
        };

        return armGroup;
    }

    createLeg(material) {
        const legGroup = new THREE.Group();
        
        // 大腿部
        const thighGeometry = new THREE.CylinderGeometry(0.5, 0.4, 1.5, 8);
        const thigh = new THREE.Mesh(thighGeometry, material);
        thigh.position.set(0, -0.75, 0);
        thigh.rotation.x = Math.PI / 2;
        thigh.castShadow = true;
        legGroup.add(thigh);

        // 膝関節
        const kneeGroup = new THREE.Group();
        kneeGroup.position.set(0, -1.5, 0);
        legGroup.add(kneeGroup);

        // 下腿部
        const calfGeometry = new THREE.CylinderGeometry(0.4, 0.3, 1.5, 8);
        const calf = new THREE.Mesh(calfGeometry, material);
        calf.position.set(0, -0.75, 0);
        calf.castShadow = true;
        kneeGroup.add(calf);

        // 関節情報を保存
        legGroup.userData = {
            knee: kneeGroup
        };

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
            // 攻撃準備：腕を後ろに引く
            const prepProgress = progress / 0.3;
            this.arms[0].rotation.x = -prepProgress * Math.PI / 2;
            this.arms[1].rotation.x = -prepProgress * Math.PI / 2;
        } else if (progress < 0.6) {
            // 攻撃実行：腕を前に振り下ろす
            const attackProgress = (progress - 0.3) / 0.3;
            this.arms[0].rotation.x = -Math.PI / 2 + attackProgress * Math.PI;
            this.arms[1].rotation.x = -Math.PI / 2 + attackProgress * Math.PI;
        } else {
            // 攻撃終了：腕を元の位置に戻す
            const resetProgress = (progress - 0.6) / 0.4;
            this.arms[0].rotation.x = Math.PI / 2 - resetProgress * Math.PI / 2;
            this.arms[1].rotation.x = Math.PI / 2 - resetProgress * Math.PI / 2;
        }
        
        if (progress >= 1) {
            this.isAttacking = false;
            this.arms[0].rotation.x = 0;
            this.arms[1].rotation.x = 0;
        }
    }

    updateLimbAnimation(deltaTime) {
        if (!this.isMoving) return;
        
        this.animationTime += deltaTime * this.animationSpeed;
        
        // 腕の振り
        this.arms[0].rotation.x = Math.sin(this.animationTime * 2) * 0.3;
        this.arms[1].rotation.x = Math.sin(this.animationTime * 2 + Math.PI) * 0.3;
        
        // 脚の動き
        this.legs[0].rotation.x = Math.sin(this.animationTime * 2) * 0.5;
        this.legs[1].rotation.x = Math.sin(this.animationTime * 2 + Math.PI) * 0.5;
    }

    move(direction, speed, deltaTime) {
        this.isMoving = true;
        this.updateLimbAnimation(deltaTime);
        
        // 移動方向に応じて回転
        if (direction.x !== 0 || direction.z !== 0) {
            const angle = Math.atan2(direction.x, direction.z);
            this.character.rotation.y = angle;
        }
        
        // 位置を更新
        this.character.position.x += direction.x * speed * deltaTime;
        this.character.position.z += direction.z * speed * deltaTime;
    }

    setPosition(x, y, z) {
        this.character.position.set(x, y, z);
    }

    getPosition() {
        return this.character.position;
    }

    setRotation(y) {
        this.character.rotation.y = y;
    }

    getRotation() {
        return this.character.rotation;
    }

    setRunning(isRunning) {
        this.isRunning = isRunning;
        this.animationSpeed = isRunning ? 2.0 : 1.0;
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