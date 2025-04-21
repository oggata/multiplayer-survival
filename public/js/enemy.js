class Enemy {
    constructor(scene, position) {
        this.scene = scene;
        this.model = this.createModel();
        this.model.position.copy(position);
        this.scene.add(this.model);
        this.animationMixer = new THREE.AnimationMixer(this.model);
        this.animations = this.createAnimations();
        this.currentAnimation = this.animations.idle;
        this.currentAnimation.play();
        
        // 敵のステータス
        this.health = 100;
        this.maxHealth = 100;
        this.isDead = false;
    }
    
    createModel() {
        const group = new THREE.Group();
        
        // 体の作成
        const bodyGeometry = new THREE.BoxGeometry(1, 1.5, 0.5);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.75;
        group.add(body);
        
        // 頭の作成
        const headGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const headMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 2.0;
        group.add(head);
        
        // 腕の作成
        const armGeometry = new THREE.BoxGeometry(0.3, 1.2, 0.3);
        const armMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.65, 0.75, 0);
        group.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.65, 0.75, 0);
        group.add(rightArm);
        
        // 脚の作成
        const legGeometry = new THREE.BoxGeometry(0.3, 1.2, 0.3);
        const legMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        
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
            this.die();
        }
    }
    
    // ダメージを受けた時のエフェクト
    flashRed() {
        // 一時的に赤く光らせる
        const originalColor = 0xff0000;
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
} 