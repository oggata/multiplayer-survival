// キャラクター作成用のクラス
class Character {
    constructor(scene,type,game) {


console.log("キャラクター作成");

        this.scene = scene;
        this.type = type;
        this.game = game;
        this.character = new THREE.Group();
        this.scene.add(this.character);

        
        // キャラクターのパーツ
        this.head = null;
        this.body = null;
        this.leftArm = null;
        this.rightArm = null;
        this.leftLeg = null;
        this.rightLeg = null;
        this.leftShoe = null;
        this.rightShoe = null;
        
        // アニメーション用の変数
        this.animationTime = 0;
        this.isMoving = false;
        this.isRunning = false;
        this.animationSpeed = 2.0;
        
        // 移動関連の変数
        this.position = new THREE.Vector3();
        this.rotation = new THREE.Euler();
        this.velocity = new THREE.Vector3();
        // キャラクターの作成
        this.createCharacter();
    }
    
    createCharacter() {


        // 頭
        const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac , emissive: 0xffdbac, emissiveIntensity: 0.5});
        this.head = new THREE.Mesh(headGeometry, headMaterial);
        this.head.position.y = 1.75;
        this.head.castShadow = true;
        this.character.add(this.head);
        
        // 体
        const bodyGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.4);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x3366ff , emissive: 0x3366ff, emissiveIntensity: 0.5});
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.body.position.y = 1.0;
        this.body.castShadow = true;
        this.character.add(this.body);
        
        // 左腕
        const armGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.2);
        const armMaterial = new THREE.MeshStandardMaterial({ color: 0x3366ff , emissive: 0x3366ff, emissiveIntensity: 0.5});
        this.leftArm = new THREE.Mesh(armGeometry, armMaterial);
        this.leftArm.position.set(-0.4, 1.0, 0);
        this.leftArm.castShadow = true;
        this.character.add(this.leftArm);
        
        // 右腕
        this.rightArm = new THREE.Mesh(armGeometry, armMaterial);
        this.rightArm.position.set(0.4, 1.0, 0);
        this.rightArm.castShadow = true;
        this.character.add(this.rightArm);
        
        // 左足
        const legGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.2);
        const legMaterial = new THREE.MeshStandardMaterial({ color: 0x000066 , emissive: 0x000066, emissiveIntensity: 0.5});
        this.leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        this.leftLeg.position.set(-0.2, 0.3, 0);
        this.leftLeg.castShadow = true;
        this.character.add(this.leftLeg);
        
        // 右足
        this.rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        this.rightLeg.position.set(0.2, 0.3, 0);
        this.rightLeg.castShadow = true;
        this.character.add(this.rightLeg);
        
        // 左靴
        const shoeGeometry = new THREE.BoxGeometry(0.25, 0.1, 0.3);
        const shoeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 , emissive: 0x000000, emissiveIntensity: 0.5});
        this.leftShoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
        this.leftShoe.position.set(-0.2, 0.0, 0);
        this.leftShoe.castShadow = true;
        this.character.add(this.leftShoe);
        
        // 右靴
        this.rightShoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
        this.rightShoe.position.set(0.2, 0.0, 0);
        this.rightShoe.castShadow = true;
        this.character.add(this.rightShoe);
    }
    
  // キャラクターの色を設定するメソッド
    setColor(color) {
        const bodyParts = [
             this.body, this.rightArm, this.leftArm
        ];
        const bodyParts2 = [
             this.rightLeg, this.leftLeg
        ]; 
        bodyParts.forEach(part => {
            if (part && part.material) {
                part.material.color.setHex(color);
                part.material.emissive.setHex(color);
            }
        });
        bodyParts2.forEach(part2 => {
            const darkerColor = color * 0.7;
            if (part2 && part2.material) {
                part2.material.color.setHex(darkerColor);
                part2.material.emissive.setHex(darkerColor);
            }
        });
    }

    setEnemyColor(color) {
        const bodyParts = [
            this.head, this.body, this.rightArm, this.leftArm,this.rightLeg, this.leftLeg
        ];
        bodyParts.forEach(part => {
            if (part && part.material) {
                part.material.color.setHex(color);
                part.material.emissive.setHex(color);
            }
        });
    }

    updateLimbAnimation(deltaTime) {
        this.animationTime += deltaTime * this.animationSpeed;
        
        if (this.isMoving) {
            // 腕のアニメーション（速度を3倍に）
            const armAngle = Math.sin(this.animationTime * 15) * 0.5;
            this.leftArm.rotation.x = armAngle;
            this.rightArm.rotation.x = -armAngle;
            
            // 足のアニメーション（速度を3倍に）
            const legAngle = Math.sin(this.animationTime * 15) * 0.5;
            this.leftLeg.rotation.x = legAngle;
            this.rightLeg.rotation.x = -legAngle;
            
            // 靴のアニメーション
            this.leftShoe.rotation.x = legAngle;
            this.rightShoe.rotation.x = -legAngle;
            
            if(this.type == "player"){
                // 上下の動きを追加（振幅を0.15に増加）
                const verticalOffset = Math.sin(this.animationTime * 15) * 0.15;
                this.character.position.y = this.position.y + verticalOffset;
            }
        } else {
            // アイドルアニメーション（速度を調整）
            const idleAngle = Math.sin(this.animationTime * 3) * 0.1;
            this.leftArm.rotation.x = idleAngle;
            this.rightArm.rotation.x = idleAngle;
            this.leftLeg.rotation.x = idleAngle;
            this.rightLeg.rotation.x = idleAngle;
            this.leftShoe.rotation.x = idleAngle;
            this.rightShoe.rotation.x = idleAngle;
            
            // アイドル時は元の位置に戻す
            this.character.position.y = this.position.y;
        }
    }
    

    updateLimbAnimation2(deltaTime) {
        this.animationTime += deltaTime * this.animationSpeed;
        
        if (this.isMoving) {
            // 腕のアニメーション（速度を3倍に）
            const armAngle = Math.sin(this.animationTime * 15) * 0.5;
            this.leftArm.rotation.x = armAngle;
            this.rightArm.rotation.x = -armAngle;
            
            // 足のアニメーション（速度を3倍に）
            const legAngle = Math.sin(this.animationTime * 15) * 0.5;
            this.leftLeg.rotation.x = legAngle;
            this.rightLeg.rotation.x = -legAngle;
            
            // 靴のアニメーション
            this.leftShoe.rotation.x = legAngle;
            this.rightShoe.rotation.x = -legAngle;
            
            // 上下の動きを追加（振幅を0.15に増加）
            //const verticalOffset = Math.sin(this.animationTime * 15) * 0.15;
            //this.character.position.y = this.position.y + verticalOffset;
        } else {
            // アイドルアニメーション（速度を調整）
            const idleAngle = Math.sin(this.animationTime * 3) * 0.1;
            this.leftArm.rotation.x = idleAngle;
            this.rightArm.rotation.x = idleAngle;
            this.leftLeg.rotation.x = idleAngle;
            this.rightLeg.rotation.x = idleAngle;
            this.leftShoe.rotation.x = idleAngle;
            this.rightShoe.rotation.x = idleAngle;
            
            // アイドル時は元の位置に戻す
            this.character.position.y = this.position.y;
        }
    }

    move(direction, speed, deltaTime) {
        // 移動方向を正規化
        if (direction.length() > 0) {
            direction.normalize();
        }
        
        // 速度を設定
        const currentSpeed = speed;
        
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

        //高さを修正
        var height = this.game.fieldMap.getHeightAt(this.position.x, this.position.z);
        if (height != null) {
            this.position.y = height + 0.5; // キャラクターの高さを考慮して位置を調整
        }   
        //this.character.position.y = this.position.y;
        
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
        this.character.rotation.copy(this.rotation);
    }
    
    getRotation() {
        return this.rotation;
    }
    
    setRunning(isRunning) {
        this.isRunning = isRunning;
        this.animationSpeed = isRunning ? 2.0 : 1.0;
    }
    
    dispose() {
        // キャラクターを削除
        this.scene.remove(this.character);
        
        // ジオメトリとマテリアルを解放
        [
            this.head, this.body, this.leftArm, this.rightArm,
            this.leftLeg, this.rightLeg, this.leftShoe, this.rightShoe
        ].forEach(part => {
            if (part) {
                part.geometry.dispose();
                part.material.dispose();
            }
        });
    }
} 