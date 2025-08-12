class HexapodCharacter {
    constructor(scene, type, game) {
        this.scene = scene;
        this.type = type;
        this.game = game;
        this.character = new THREE.Group();
        this.scene.add(this.character);
        
        // キャラクターのパーツ
        this.head = null;
        this.body = null;
        this.legs = []; // 6本の足を配列で管理
        
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
        this.attackDuration = 0.5; // 攻撃モーションの持続時間（秒）
        
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
    }  // 攻撃モーションをアップデート
    updateAttackAnimation(deltaTime) {
        if (!this.isAttacking) return;
        
        this.attackTime += deltaTime;
        
        // 攻撃モーションの進行度（0から1）
        const progress = Math.min(this.attackTime / this.attackDuration, 1);
        
        if (progress < 0.4) {
            // 攻撃モーションの前半：身体を後ろに傾け、前脚を上げる
            const prepProgress = progress / 0.4;
            
            // 頭を上げる
            this.head.rotation.x = -prepProgress * Math.PI / 3;
            
            // 前方の脚を上げる（六足の前方2対の脚）
            this.legs[0].userData.knee.rotation.x = prepProgress * Math.PI / 2;
            this.legs[1].userData.knee.rotation.x = prepProgress * Math.PI / 2;
            this.legs[2].userData.knee.rotation.x = prepProgress * Math.PI / 3;
            this.legs[3].userData.knee.rotation.x = prepProgress * Math.PI / 3;
            
            // 身体を少し後ろに傾ける
            this.body.rotation.x = prepProgress * 0.3;
            
        } else if (progress < 0.7) {
            // 攻撃モーションの中盤：前脚を前方に伸ばす
            const stretchProgress = (progress - 0.4) / 0.3;
            
            // 頭を素早く前に出す
            this.head.rotation.x = -Math.PI / 3 + stretchProgress * Math.PI / 2;
            
            // 前方の脚を前に伸ばす
            this.legs[0].rotation.z = Math.PI / 4 - stretchProgress * Math.PI / 3;
            this.legs[1].rotation.z = -Math.PI / 4 + stretchProgress * Math.PI / 3;
            this.legs[0].userData.knee.rotation.x = Math.PI / 2 - stretchProgress * Math.PI / 4;
            this.legs[1].userData.knee.rotation.x = Math.PI / 2 - stretchProgress * Math.PI / 4;
            
            // 2番目の脚も少し動かす
            this.legs[2].userData.knee.rotation.x = Math.PI / 3;
            this.legs[3].userData.knee.rotation.x = Math.PI / 3;
            
            // 身体を前に傾ける
            this.body.rotation.x = 0.3 - stretchProgress * 0.4;
            
        } else {
            // 攻撃モーションの終盤：元の位置に戻す
            const resetProgress = (progress - 0.7) / 0.3;
            
            // 頭を通常位置に戻す
            this.head.rotation.x = Math.PI / 6 - resetProgress * Math.PI / 6;
            
            // 脚を通常位置に戻す
            this.legs[0].rotation.z = Math.PI / 4 * (1 - resetProgress);
            this.legs[1].rotation.z = -Math.PI / 4 * (1 - resetProgress);
            this.legs[0].userData.knee.rotation.x = Math.PI / 4 * (1 - resetProgress);
            this.legs[1].userData.knee.rotation.x = Math.PI / 4 * (1 - resetProgress);
            this.legs[2].userData.knee.rotation.x = Math.PI / 3 * (1 - resetProgress);
            this.legs[3].userData.knee.rotation.x = Math.PI / 3 * (1 - resetProgress);
            
            // 身体を通常位置に戻す
            this.body.rotation.x = -0.1 * (1 - resetProgress);
        }
        
        // 攻撃モーションが完了したら終了
        if (progress >= 1) {
            this.isAttacking = false;
            // 位置をリセット
            this.head.rotation.x = 0;
            this.body.rotation.x = 0;
            
            // 脚の位置をリセット
            for (let i = 0; i < this.legs.length; i++) {
                const leg = this.legs[i];
                leg.rotation.z = (i % 2 === 0) ? Math.PI / 4 : -Math.PI / 4;
                leg.userData.knee.rotation.x = 0;
            }
        }
    }
    
    createCharacter() {
        // 頭部（大きな複眼を持つ虫型）
        const headGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x331122, 
            emissive: 0x331122, 
            emissiveIntensity: 0.5,
            roughness: 0.7
        });
        this.head = new THREE.Mesh(headGeometry, headMaterial);
        this.head.position.set(0, 0.8, 0.7);
        this.head.castShadow = true;
        this.character.add(this.head);
        
        // 複眼（大きく分割された目）
        const eyeGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const eyeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff0000, 
            emissive: 0xff0000, 
            emissiveIntensity: 0.8,
            roughness: 0.3
        });
        
        // 左右の複眼
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.3, 0.1, 0.3);
        this.head.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.3, 0.1, 0.3);
        this.head.add(rightEye);
        
        // 胴体（節分けされた昆虫のような形状）
        const bodySegments = 3;
        const bodySegmentSize = [
            { width: 0.8, height: 0.5, depth: 0.8 },
            { width: 1.0, height: 0.6, depth: 1.0 },
            { width: 1.2, height: 0.5, depth: 1.3 }
        ];
        
        this.body = new THREE.Group();
        this.body.position.set(0, 0.7, 0);
        this.character.add(this.body);
        
        // 体節を作成
        for (let i = 0; i < bodySegments; i++) {
            const size = bodySegmentSize[i];
            const segmentGeometry = new THREE.BoxGeometry(
                size.width, size.height, size.depth
            );
            const segmentMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x331122, 
                emissive: 0x331122, 
                emissiveIntensity: 0.5,
                roughness: 0.8
            });
            const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
            segment.position.z = -i * 0.9;
            segment.castShadow = true;
            this.body.add(segment);
        }
        
        // 6本の足を作成
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x221111, 
            emissive: 0x221111, 
            emissiveIntensity: 0.5,
            roughness: 1.0
        });
        
        // 各体節に2本ずつ脚を配置
        for (let i = 0; i < 3; i++) {
            // 各体節の位置を計算
            const segmentZ = -i * 0.9;
            
            // 左脚
            const leftLeg = this.createLeg(legMaterial);
            leftLeg.position.set(-0.6, 0, segmentZ);
            leftLeg.rotation.z = Math.PI / 4; // 外側に傾ける
            this.body.add(leftLeg);
            this.legs.push(leftLeg);
            
            // 右脚
            const rightLeg = this.createLeg(legMaterial);
            rightLeg.position.set(0.6, 0, segmentZ);
            rightLeg.rotation.z = -Math.PI / 4; // 外側に傾ける
            this.body.add(rightLeg);
            this.legs.push(rightLeg);
        }
    }
    
    // 関節のある脚を作成するヘルパーメソッド
    createLeg(material) {
        const legGroup = new THREE.Group();
        
        // 大腿部
        const femurGeometry = new THREE.CylinderGeometry(0.08, 0.06, 0.5, 8);
        const femur = new THREE.Mesh(femurGeometry, material);
        femur.position.set(0, -0.25, 0);
        femur.rotation.x = Math.PI / 2;
        femur.castShadow = true;
        legGroup.add(femur);
        
        // 膝関節
        const kneeGroup = new THREE.Group();
        kneeGroup.position.set(0, -0.5, 0);
        legGroup.add(kneeGroup);
        
        // 下腿部
        const tibiaGeometry = new THREE.CylinderGeometry(0.05, 0.03, 0.6, 8);
        const tibia = new THREE.Mesh(tibiaGeometry, material);
        tibia.position.set(0, -0.3, 0);
        tibia.castShadow = true;
        kneeGroup.add(tibia);
        
        // 関節情報を保存（アニメーション用）
        legGroup.userData = {
            knee: kneeGroup
        };
        
        return legGroup;
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
        
        // 脚の色を設定（少し暗めに）
        const legColor = (color & 0xfefefe) >> 1; // 色を半分の明るさに
        this.legs.forEach(leg => {
            leg.traverse(child => {
                if (child.isMesh && child.material) {
                    child.material.color.setHex(legColor);
                    child.material.emissive.setHex(legColor);
                }
            });
        });
    }
    
    // 六足歩行のアニメーション
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
        // 攻撃中なら攻撃アニメーションを優先
        if (this.isAttacking) {
            this.updateAttackAnimation(deltaTime);
            return;
        }
        
        if (this.isMoving) {
            // 三歩行のパターン（三角歩行：対角の3本の足が同時に動く）
            for (let i = 0; i < this.legs.length; i++) {
                const leg = this.legs[i];
                const knee = leg.userData.knee;
                
                // 交互のセットの脚を動かす（0,2,4と1,3,5）
                const phase = (i % 2 === 0) ? 0 : Math.PI;
                const legAngle = Math.sin(this.animationTime * 15 + phase) * 0.4;
                
                // 脚全体の上下運動
                leg.rotation.z = (i < 3 ? 1 : -1) * (Math.PI / 4 + legAngle * 0.3);
                
                // 膝の曲げ伸ばし
                knee.rotation.x = Math.sin(this.animationTime * 15 + phase + Math.PI / 2) * 0.6;
            }
            
            // 体の揺れ
            this.body.rotation.z = Math.sin(this.animationTime * 15) * 0.05;
            this.head.rotation.z = Math.sin(this.animationTime * 15) * 0.1;
            
            // 上下の動き
            const verticalOffset = Math.abs(Math.sin(this.animationTime * 15)) * 0.1;
            this.character.position.y = this.position.y + verticalOffset;
        } else {
            // アイドル状態のアニメーション
            const idleAngle = Math.sin(this.animationTime * 3) * 0.05;
            
            // 脚のわずかな動き
            for (let i = 0; i < this.legs.length; i++) {
                const leg = this.legs[i];
                const knee = leg.userData.knee;
                
                leg.rotation.z = (i < 3 ? 1 : -1) * (Math.PI / 4 + idleAngle * 0.2);
                knee.rotation.x = Math.sin(this.animationTime * 3 + i * 0.5) * 0.1;
            }
            
            // 触覚の動き
            this.head.rotation.y = Math.sin(this.animationTime * 2) * 0.1;
            
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
        this.animationSpeed = isRunning ? 3.5 : 2.0; // 六足歩行は走る時かなり速い
    }

    dispose() {
        // キャラクターを削除
        this.scene.remove(this.character);
        
        // ジオメトリとマテリアルを解放
        if (this.head) {
            if (this.head.geometry) this.head.geometry.dispose();
            if (this.head.material) this.head.material.dispose();
        }
        
        if (this.body) {
            this.body.children.forEach(segment => {
                if (segment.geometry) segment.geometry.dispose();
                if (segment.material) segment.material.dispose();
            });
        }
        
        this.legs.forEach(leg => {
            leg.traverse(child => {
                if (child.isMesh) {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                }
            });
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
            this.head,
            this.legs[0],
            this.legs[1],
            this.legs[2],
            this.legs[3],
            this.legs[4],
            this.legs[5]
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
            this.legs[0],
            this.legs[1],
            this.legs[2],
            this.legs[3],
            this.legs[4],
            this.legs[5]
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