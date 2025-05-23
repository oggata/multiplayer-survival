class BossCharacter {
    constructor(scene, type, game) {
        this.scene = scene;
        this.type = type;
        this.game = game;
        this.character = new THREE.Group();
        this.scene.add(this.character);
        
        // キャラクターのパーツ
        this.body = null;
        this.head = null;
        this.arms = [];
        this.legs = [];
        this.spikes = [];
        this.eyes = [];
        
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
        this.attackDuration = 1.5;
        this.attackType = 'normal'; // normal, ground, special
        
        // ボスの特殊効果用変数
        this.isEnraged = false;
        this.enrageTime = 0;
        this.enrageDuration = 10.0;
        
        // キャラクターの作成
        this.createCharacter();
    }

    createCharacter() {
        // 体
        const bodyGeometry = new THREE.CapsuleGeometry(1.2, 2.0, 8, 16);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B0000, 
            emissive: 0x4B0000, 
            emissiveIntensity: 0.3,
            roughness: 0.7,
            metalness: 0.3
        });
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.body.position.set(0, 2.0, 0);
        this.body.castShadow = true;
        this.character.add(this.body);

        // 頭
        const headGeometry = new THREE.SphereGeometry(1.0, 32, 32);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B0000, 
            emissive: 0x4B0000, 
            emissiveIntensity: 0.3,
            roughness: 0.7,
            metalness: 0.3
        });
        this.head = new THREE.Mesh(headGeometry, headMaterial);
        this.head.position.set(0, 3.5, 0);
        this.head.castShadow = true;
        this.body.add(this.head);

        // 目（光る目）
        const eyeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff0000, 
            emissive: 0xff0000, 
            emissiveIntensity: 0.8,
            roughness: 0.3
        });

        // 左目
        const leftEye = new THREE.SphereGeometry(0.2, 16, 16);
        const leftEyeMesh = new THREE.Mesh(leftEye, eyeMaterial);
        leftEyeMesh.position.set(-0.4, 0.2, 0.8);
        this.head.add(leftEyeMesh);
        this.eyes.push(leftEyeMesh);

        // 右目
        const rightEye = new THREE.SphereGeometry(0.2, 16, 16);
        const rightEyeMesh = new THREE.Mesh(rightEye, eyeMaterial);
        rightEyeMesh.position.set(0.4, 0.2, 0.8);
        this.head.add(rightEyeMesh);
        this.eyes.push(rightEyeMesh);

        // 腕
        for (let i = 0; i < 2; i++) {
            const arm = this.createArm();
            arm.position.set(i === 0 ? -1.5 : 1.5, 2.0, 0);
            this.body.add(arm);
            this.arms.push(arm);
        }

        // 脚
        for (let i = 0; i < 2; i++) {
            const leg = this.createLeg();
            leg.position.set(i === 0 ? -0.8 : 0.8, 0, 0);
            this.body.add(leg);
            this.legs.push(leg);
        }

        // 棘
        const spikeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4B0000, 
            emissive: 0x2B0000, 
            emissiveIntensity: 0.3,
            roughness: 0.7,
            metalness: 0.5
        });

        // 背中の棘
        for (let i = 0; i < 5; i++) {
            const spike = this.createSpike(spikeMaterial);
            spike.position.set(0, 2.5 - i * 0.5, 1.2);
            spike.rotation.x = -Math.PI / 6;
            this.body.add(spike);
            this.spikes.push(spike);
        }
    }

    createArm() {
        const armGroup = new THREE.Group();
        
        // 上腕
        const upperArmGeometry = new THREE.CapsuleGeometry(0.4, 1.2, 8, 16);
        const armMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B0000, 
            emissive: 0x4B0000, 
            emissiveIntensity: 0.3,
            roughness: 0.7,
            metalness: 0.3
        });
        const upperArm = new THREE.Mesh(upperArmGeometry, armMaterial);
        upperArm.position.set(0, -0.8, 0);
        upperArm.rotation.z = Math.PI / 4;
        armGroup.add(upperArm);

        // 前腕
        const forearmGeometry = new THREE.CapsuleGeometry(0.3, 1.0, 8, 16);
        const forearm = new THREE.Mesh(forearmGeometry, armMaterial);
        forearm.position.set(0.8, -1.6, 0);
        forearm.rotation.z = -Math.PI / 6;
        armGroup.add(forearm);

        // 手
        const handGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const hand = new THREE.Mesh(handGeometry, armMaterial);
        hand.position.set(1.4, -1.8, 0);
        armGroup.add(hand);

        return armGroup;
    }

    createLeg() {
        const legGroup = new THREE.Group();
        
        // 太もも
        const thighGeometry = new THREE.CapsuleGeometry(0.5, 1.4, 8, 16);
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B0000, 
            emissive: 0x4B0000, 
            emissiveIntensity: 0.3,
            roughness: 0.7,
            metalness: 0.3
        });
        const thigh = new THREE.Mesh(thighGeometry, legMaterial);
        thigh.position.set(0, -1.2, 0);
        legGroup.add(thigh);

        // すね
        const shinGeometry = new THREE.CapsuleGeometry(0.4, 1.2, 8, 16);
        const shin = new THREE.Mesh(shinGeometry, legMaterial);
        shin.position.set(0, -2.6, 0);
        legGroup.add(shin);

        // 足
        const footGeometry = new THREE.BoxGeometry(0.8, 0.4, 1.2);
        const foot = new THREE.Mesh(footGeometry, legMaterial);
        foot.position.set(0.4, -3.2, 0);
        legGroup.add(foot);

        return legGroup;
    }

    createSpike(material) {
        const spikeGeometry = new THREE.ConeGeometry(0.3, 0.8, 8);
        const spike = new THREE.Mesh(spikeGeometry, material);
        spike.castShadow = true;
        return spike;
    }

    startAttack(type = 'normal') {
        this.isAttacking = true;
        this.attackTime = 0;
        this.attackType = type;
    }

    updateAttackAnimation(deltaTime) {
        if (!this.isAttacking) return;
        
        this.attackTime += deltaTime;
        const progress = Math.min(this.attackTime / this.attackDuration, 1);
        
        switch (this.attackType) {
            case 'normal':
                this.updateNormalAttack(progress);
                break;
            case 'ground':
                this.updateGroundAttack(progress);
                break;
            case 'special':
                this.updateSpecialAttack(progress);
                break;
        }
        
        if (progress >= 1) {
            this.isAttacking = false;
            this.resetAttackAnimation();
        }
    }

    updateNormalAttack(progress) {
        if (progress < 0.3) {
            // 攻撃準備：腕を後ろに引く
            const prepProgress = progress / 0.3;
            for (const arm of this.arms) {
                arm.rotation.z = Math.PI / 4 + prepProgress * Math.PI / 2;
            }
        } else if (progress < 0.6) {
            // 攻撃実行：腕を前に振る
            const attackProgress = (progress - 0.3) / 0.3;
            for (const arm of this.arms) {
                arm.rotation.z = Math.PI * 3/4 - attackProgress * Math.PI;
            }
        } else {
            // 攻撃終了：元の位置に戻る
            const resetProgress = (progress - 0.6) / 0.4;
            for (const arm of this.arms) {
                arm.rotation.z = -Math.PI / 4 + resetProgress * Math.PI / 2;
            }
        }
    }

    updateGroundAttack(progress) {
        if (progress < 0.3) {
            // 攻撃準備：体を下げる
            const prepProgress = progress / 0.3;
            this.body.position.y = 2.0 - prepProgress * 0.5;
            for (const leg of this.legs) {
                leg.rotation.x = prepProgress * Math.PI / 4;
            }
        } else if (progress < 0.6) {
            // 攻撃実行：地面を叩く
            const attackProgress = (progress - 0.3) / 0.3;
            this.body.position.y = 1.5 + attackProgress * 0.5;
            for (const leg of this.legs) {
                leg.rotation.x = Math.PI / 4 - attackProgress * Math.PI / 2;
            }
        } else {
            // 攻撃終了：元の位置に戻る
            const resetProgress = (progress - 0.6) / 0.4;
            this.body.position.y = 2.0;
            for (const leg of this.legs) {
                leg.rotation.x = -Math.PI / 4 + resetProgress * Math.PI / 4;
            }
        }
    }

    updateSpecialAttack(progress) {
        if (progress < 0.3) {
            // 攻撃準備：体を回転
            const prepProgress = progress / 0.3;
            this.body.rotation.y = prepProgress * Math.PI * 2;
            for (const spike of this.spikes) {
                spike.rotation.x = -Math.PI / 6 + prepProgress * Math.PI / 3;
            }
        } else if (progress < 0.6) {
            // 攻撃実行：棘を展開
            const attackProgress = (progress - 0.3) / 0.3;
            for (const spike of this.spikes) {
                spike.rotation.x = Math.PI / 6 + attackProgress * Math.PI / 3;
                spike.scale.set(1 + attackProgress, 1 + attackProgress, 1 + attackProgress);
            }
        } else {
            // 攻撃終了：元の位置に戻る
            const resetProgress = (progress - 0.6) / 0.4;
            for (const spike of this.spikes) {
                spike.rotation.x = Math.PI / 3 - resetProgress * Math.PI / 2;
                spike.scale.set(2 - resetProgress, 2 - resetProgress, 2 - resetProgress);
            }
        }
    }

    resetAttackAnimation() {
        for (const arm of this.arms) {
            arm.rotation.z = Math.PI / 4;
        }
        for (const leg of this.legs) {
            leg.rotation.x = 0;
        }
        for (const spike of this.spikes) {
            spike.rotation.x = -Math.PI / 6;
            spike.scale.set(1, 1, 1);
        }
        this.body.position.y = 2.0;
        this.body.rotation.y = 0;
    }

    updateLimbAnimation(deltaTime) {
        if (!this.isMoving) return;
        
        this.animationTime += deltaTime * this.animationSpeed;
        
        // 腕の動き
        for (let i = 0; i < this.arms.length; i++) {
            const arm = this.arms[i];
            const phase = i * Math.PI + this.animationTime * 2;
            arm.rotation.z = Math.PI / 4 + Math.sin(phase) * 0.2;
        }
        
        // 脚の動き
        for (let i = 0; i < this.legs.length; i++) {
            const leg = this.legs[i];
            const phase = i * Math.PI + this.animationTime * 2;
            leg.rotation.x = Math.sin(phase) * 0.3;
        }
        
        // 棘の動き
        for (let i = 0; i < this.spikes.length; i++) {
            const spike = this.spikes[i];
            const phase = i * Math.PI / 4 + this.animationTime;
            spike.rotation.x = -Math.PI / 6 + Math.sin(phase) * 0.1;
        }
        
        // 目の動き
        for (const eye of this.eyes) {
            eye.position.y = 0.2 + Math.sin(this.animationTime * 3) * 0.05;
        }
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
        this.animationSpeed = isRunning ? 1.5 : 1.0;
    }

    setEnraged(isEnraged) {
        this.isEnraged = isEnraged;
        if (isEnraged) {
            this.enrageTime = 0;
            // 怒り状態の見た目を変更
            for (const eye of this.eyes) {
                eye.material.emissiveIntensity = 1.0;
                eye.material.color.set(0xff0000);
            }
            for (const spike of this.spikes) {
                spike.material.emissiveIntensity = 0.5;
            }
        } else {
            // 通常状態に戻す
            for (const eye of this.eyes) {
                eye.material.emissiveIntensity = 0.8;
                eye.material.color.set(0xff0000);
            }
            for (const spike of this.spikes) {
                spike.material.emissiveIntensity = 0.3;
            }
        }
    }

    updateEnrage(deltaTime) {
        if (!this.isEnraged) return;
        
        this.enrageTime += deltaTime;
        if (this.enrageTime >= this.enrageDuration) {
            this.setEnraged(false);
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