class EnemyBullet {
    constructor(scene, position, direction, speed) {
        this.scene = scene;
        this.position = position;
        this.direction = direction;
        this.speed = speed;
        this.damage = 15; // デフォルトのダメージ値
        this.lifetime = 3.0; // 弾の寿命（秒）
        this.createdAt = Date.now();

        // 弾のモデルを作成
        this.model = this.createModel();
        this.model.position.copy(position);
        this.scene.add(this.model);
    }

    createModel() {
        // 弾のジオメトリを作成
        const geometry = new THREE.SphereGeometry(0.2, 8, 8);
        const material = new THREE.MeshPhongMaterial({
            color: 0xff0000, // 赤色
            emissive: 0xff0000,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });

        const model = new THREE.Mesh(geometry, material);
        model.castShadow = true;
        return model;
    }

    update(deltaTime) {
        // 弾の移動
        const moveX = this.direction.x * this.speed * deltaTime;
        const moveY = this.direction.y * this.speed * deltaTime;
        const moveZ = this.direction.z * this.speed * deltaTime;

        this.position.x += moveX;
        this.position.y += moveY;
        this.position.z += moveZ;

        this.model.position.copy(this.position);

        // 寿命チェック
        const age = (Date.now() - this.createdAt) / 1000;
        if (age > this.lifetime) {
            this.createBioSlimeEffect(this.model.position.clone()); // エフェクト発生
            return false; // 弾を削除
        }

        return true; // 弾を維持
    }

    checkCollision(playerPosition, playerRadius) {
        const distance = this.model.position.distanceTo(playerPosition);
        return distance < playerRadius + 0.2; // 弾の半径(0.2) + プレイヤーの半径
    }

    dispose() {
        // シーンから弾を削除
        if (this.model && this.scene) {
            //this.createBioSlimeEffect(this.model.position.clone()); // エフェクト発生
            this.scene.remove(this.model);
            this.model.geometry.dispose();
            this.model.material.dispose();
        }
    }

    createBioSlimeEffect(position) {
        const particleCount = 20;
        const particles = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.SphereGeometry(0.2, 8, 8);
            const material = new THREE.MeshPhongMaterial({
                color: 0x00ff00,
                transparent: true,
                opacity: 0.8
            });
            const particle = new THREE.Mesh(geometry, material);
            
            // ランダムな方向に飛散
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.1 + Math.random() * 0.2;
            particle.velocity = new THREE.Vector3(
                Math.cos(angle) * speed,
                Math.random() * speed,
                Math.sin(angle) * speed
            );
            
            particle.position.copy(position);
            particles.add(particle);
        }
        
        this.scene.add(particles);
        
        // アニメーション
        const duration = 1.0;
        const startTime = Date.now();
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            if (elapsed < duration) {
                particles.children.forEach(particle => {
                    particle.position.add(particle.velocity);
                    particle.velocity.y -= 0.01; // 重力効果
                    particle.material.opacity = 0.8 * (1 - elapsed / duration);
                });
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(particles);
            }
        };
        animate();
    }
} 