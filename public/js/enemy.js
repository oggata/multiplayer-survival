class Enemy {
    constructor(scene, position, type = 'normal') {
        this.scene = scene;
        this.type = type;
        this.enemyType = GameConfig.ENEMY.TYPES[type.toUpperCase()];
        this.model = this.createModel();
        this.model.position.copy(position);
        this.scene.add(this.model);
        this.animationMixer = new THREE.AnimationMixer(this.model);
        this.animations = this.createAnimations();
        this.currentAnimation = this.animations.idle;
        this.currentAnimation.play();
        
        // 敵のステータス
        this.health = 18;
        this.maxHealth = 18;
        this.isDead = false;
        
        // 弾丸発射用の変数
        this.lastShootTime = 0;
        this.shootInterval = this.enemyType.shootInterval || 3000;
        this.bulletSpeed = this.enemyType.bulletSpeed || 15;
        this.bulletDamage = this.enemyType.bulletDamage || 15;
    }
    
    createModel() {
        const group = new THREE.Group();
        
        // 体の作成
        const bodyGeometry = new THREE.BoxGeometry(1, 1.5, 0.5);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: this.enemyType.color });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
     
        group.add(body);
        
        // 頭の作成
        const headGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const headMaterial = new THREE.MeshPhongMaterial({ color: this.enemyType.color });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 2.0;
        group.add(head);
        
        // 腕の作成
        const armGeometry = new THREE.BoxGeometry(0.3, 1.2, 0.3);
        const armMaterial = new THREE.MeshPhongMaterial({ color: this.enemyType.color });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.65, 0.75, 0);
        group.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.65, 0.75, 0);
        group.add(rightArm);
        
        // 脚の作成
        const legGeometry = new THREE.BoxGeometry(0.3, 1.2, 0.3);
        const legMaterial = new THREE.MeshPhongMaterial({ color: this.enemyType.color });
        
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.3, -0.6, 0);
        group.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.3, -0.6, 0);
        group.add(rightLeg);
        
        // メッシュの参照を保存
        this.parts = {
            leftArm,
            rightArm,
            leftLeg,
            rightLeg
        };
        
        return group;
    }
    
    createAnimations() {
        const animations = {};
        animations.idle = this.animationMixer.clipAction(new THREE.AnimationClip('idle', 1, []));
        animations.walk = this.animationMixer.clipAction(new THREE.AnimationClip('walk', 1, []));
        return animations;
    }
    
    updateAnimation(deltaTime) {
        this.animationMixer.update(deltaTime);
        
        // 腕と脚のアニメーション
        const armAngle = Math.sin(Date.now() * 0.005) * 0.5;
        const legAngle = Math.sin(Date.now() * 0.005) * 0.5;
        
        this.parts.leftArm.rotation.x = armAngle;
        this.parts.rightArm.rotation.x = -armAngle;
        this.parts.leftLeg.rotation.x = -legAngle;
        this.parts.rightLeg.rotation.x = legAngle;
    }
    
    // ダメージを受ける処理
    takeDamage(damage) {
        if (this.isDead) return;
        
        this.health -= damage;
        
        // ダメージを受けた時のエフェクト
        this.flashRed();
        
        // HPが0以下になったら死亡
        if (this.health <= 0) {
            this.isDead = true;
            // 敵が死んだ場所にアイテムを落とす
            if (window.game && window.game.spawnItem) {
                const items = ['dirtyWater', 'dirtyFood'];
                const randomItem = items[Math.floor(Math.random() * items.length)];
                window.game.spawnItem(randomItem, this.model.position.x, this.model.position.y);
            }
        }
    }
    
    // ダメージを受けた時のエフェクト
    flashRed() {
        // 一時的に赤く光らせる
        const originalColor = this.enemyType.color;
        const flashColor = 0xffffff;
        
        // すべてのパーツを一時的に白くする
        this.model.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                const originalMaterial = object.material;
                object.material = new THREE.MeshPhongMaterial({ 
                    color: flashColor,
                    emissive: flashColor,
                    emissiveIntensity: 0.5
                });
                
                // 0.1秒後に元の色に戻す
                setTimeout(() => {
                    object.material = originalMaterial;
                }, 100);
            }
        });
    }
    
    // 死亡処理
    die() {
        this.isDead = true;
        
        // 死亡アニメーション
        this.model.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                // 下に倒れる
                object.rotation.x = Math.PI / 2;
            }
        });
        
        // アイテム生成のイベントを発火
        const event = new CustomEvent('enemyDied', { 
            detail: { position: this.model.position.clone() }
        });
        document.dispatchEvent(event);
        
        // 3秒後に消える
        setTimeout(() => {
            this.dispose();
        }, 3000);
    }
    
    dispose() {
        this.scene.remove(this.model);
        this.model.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                object.geometry.dispose();
                object.material.dispose();
            }
        });
    }
    
    // 弾丸を発射するメソッド
    shoot(playerPosition) {
        if (!this.enemyType.shootBullets) return;
        
        const currentTime = Date.now();
        if (currentTime - this.lastShootTime < this.shootInterval) return;
        
        this.lastShootTime = currentTime;
        
        // プレイヤーの方向を計算
        const direction = new THREE.Vector3().subVectors(playerPosition, this.model.position).normalize();
        
        // 弾丸の位置（敵の頭の位置から発射）
        const bulletPosition = this.model.position.clone();
        bulletPosition.y += 1; // 頭の高さ
        
        // 弾丸を作成
        const bullet = new EnemyBullet(this.scene, bulletPosition, direction, this.bulletSpeed, this.bulletDamage);
        
        // 弾丸をゲームの弾丸リストに追加するためのイベントを発火
        const event = new CustomEvent('enemyBulletCreated', { 
            detail: { bullet: bullet }
        });
        document.dispatchEvent(event);
    }
    
    // 移動速度を取得
    getMoveSpeed() {
        return this.enemyType.moveSpeed;
    }
    
    // ダメージ量を取得
    getDamage() {
        return this.enemyType.damage;
    }
}

// 敵の弾丸クラス
class EnemyBullet {
    constructor(scene, position, direction, speed, damage) {
        this.scene = scene;
        this.speed = speed;
        this.lifetime = 3.0; // 3秒後に消える
        this.damage = damage;
        
        // 弾丸のモデルを作成
        this.model = this.createModel();
        this.model.position.copy(position);
        
        // 移動方向を設定
        this.direction = direction.clone().normalize();
        this.velocity = this.direction.clone().multiplyScalar(this.speed);
        
        // シーンに追加
        this.scene.add(this.model);
        
        // 作成時間を記録
        this.createdAt = Date.now();
    }
    
    createModel() {
        // 弾丸のジオメトリとマテリアルを作成
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x800080, // 紫色
            emissive: 0x800080,
            emissiveIntensity: 0.5
        });
        
        // メッシュを作成
        const model = new THREE.Mesh(geometry, material);
        
        // 影を設定
        model.castShadow = true;
        
        return model;
    }
    
    update(deltaTime) {
        // 弾丸を移動
        this.model.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // 寿命をチェック
        const age = (Date.now() - this.createdAt) / 1000;
        if (age > this.lifetime) {
            this.dispose();
            return false;
        }
        
        return true;
    }
    
    dispose() {
        // シーンから削除
        this.scene.remove(this.model);
        
        // ジオメトリとマテリアルを解放
        this.model.geometry.dispose();
        this.model.material.dispose();
    }
    
    // 衝突判定
    checkCollision(position, radius) {
        return this.model.position.distanceTo(position) < radius;
    }
} 