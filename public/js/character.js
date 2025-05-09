// キャラクター作成用のクラス
class Character {
    constructor(scene,type) {
        this.scene = scene;
        this.type = type;
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
        this.moveSpeed = 5.0;
        this.runSpeed = 10.0;
        this.rotationSpeed = 0.1;
        
        // 衝突判定用の変数
        this.radius = 0.5;
        this.height = 2.0;
        
        // キャラクターの作成
        this.createCharacter();
    }
    
    createCharacter() {
        // 頭
        const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });
        this.head = new THREE.Mesh(headGeometry, headMaterial);
        this.head.position.y = 1.75;
        this.head.castShadow = true;
        this.character.add(this.head);
        
        // 体
        const bodyGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.4);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x3366ff });
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.body.position.y = 1.0;
        this.body.castShadow = true;
        this.character.add(this.body);
        
        // 左腕
        const armGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.2);
        const armMaterial = new THREE.MeshStandardMaterial({ color: 0x3366ff });
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
        const legMaterial = new THREE.MeshStandardMaterial({ color: 0x000066 });
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
        const shoeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
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
        // 服の色（上半身）
        if (this.body) {
            this.body.material.color.setHex(color);
        }
        if (this.leftArm) {
            this.leftArm.material.color.setHex(color);
        }
        if (this.rightArm) {
            this.rightArm.material.color.setHex(color);
        }
        
        // ズボンの色（下半身）- 少し暗めの色を使用
        const darkerColor = color * 0.7;
        if (this.leftLeg) {
            this.leftLeg.material.color.setHex(darkerColor);
        }
        if (this.rightLeg) {
            this.rightLeg.material.color.setHex(darkerColor);
        }
        //this.head.material.color.setHex(color);
        if(this.type == "enemy"){
            this.head.material.color.setHex(color);
            this.leftLeg.material.color.setHex(color);
            this.rightLeg.material.color.setHex(color);
        }
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
            
            // 上下の動きを追加（振幅を0.15に増加）
            const verticalOffset = Math.sin(this.animationTime * 15) * 0.15;
            this.character.position.y = this.position.y + verticalOffset;
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
        const currentSpeed = this.isRunning ? this.runSpeed : this.moveSpeed;
        
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