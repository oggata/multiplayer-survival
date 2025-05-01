class Enemy {
    constructor(scene, enemyData) {
        this.scene = scene;
        this.id = enemyData.id;
        this.model = new Character(this.scene);
        this.model.setPosition(
            enemyData.position.x,
            enemyData.position.y,
            enemyData.position.z
        );
        this.model.setRotation(enemyData.rotation.y);
        
        // 敵の色を設定
        const enemyType = enemyData.type || 'NORMAL';
        const enemyConfig = GameConfig.ENEMY.TYPES[enemyType];
        if (enemyConfig) {
            this.model.setColor(enemyConfig.color);
            this.color = enemyConfig.color; // 色を保存
        }
        
        this.health = enemyData.health;
        this.isDead = false;
        this.state = enemyData.state;
        this.lastPosition = new THREE.Vector3(
            enemyData.position.x,
            enemyData.position.y,
            enemyData.position.z
        );
        this.isMoving = false;
        
        // 衝突判定用の半径を設定
        this.collisionRadius = 1.0;
    }

    checkBulletCollision(bulletPosition) {
        if (this.isDead) return false;
        
        const distance = this.model.getPosition().distanceTo(bulletPosition);
        return distance < this.collisionRadius;
    }

    takeDamage(damage) {
        if (this.isDead) return;
        
        this.health -= damage;
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        if (this.isDead) return;
        
        this.isDead = true;
        
        // 死亡エフェクトを生成
        this.createDeathEffect();
        
        // 敵を削除
        setTimeout(() => {
            this.dispose();
        }, 1000); // 1秒後に削除
    }

    createDeathEffect() {
        // パーティクルエフェクトの作成
        const particleCount = 50;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        const enemyPosition = this.model.getPosition();
        
        for (let i = 0; i < particleCount; i++) {
            // ランダムな方向にパーティクルを配置
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 2;
            positions[i * 3] = enemyPosition.x + Math.cos(angle) * radius;
            positions[i * 3 + 1] = enemyPosition.y + Math.random() * 2;
            positions[i * 3 + 2] = enemyPosition.z + Math.sin(angle) * radius;
            
            // 敵の色に基づいてパーティクルの色を設定
            const color = new THREE.Color(this.color);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.2,
            vertexColors: true,
            transparent: true,
            opacity: 1
        });
        
        const particleSystem = new THREE.Points(particles, particleMaterial);
        this.scene.add(particleSystem);
        
        // パーティクルのアニメーション
        const startTime = Date.now();
        const animate = () => {
            if (this.isDead) {
                const elapsed = Date.now() - startTime;
                const progress = elapsed / 1000; // 1秒で消える
                
                if (progress >= 1) {
                    this.scene.remove(particleSystem);
                    return;
                }
                
                // パーティクルを上に移動させながらフェードアウト
                const positions = particleSystem.geometry.attributes.position.array;
                for (let i = 0; i < positions.length; i += 3) {
                    positions[i + 1] += 0.1; // 上に移動
                }
                particleSystem.geometry.attributes.position.needsUpdate = true;
                particleMaterial.opacity = 1 - progress;
                
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    update(data) {
        if (this.isDead) return;
        
        if (data.position) {
            // 前回の位置を保存
            this.lastPosition.copy(this.model.getPosition());
            
            // 新しい位置を設定
            this.model.setPosition(
                data.position.x,
                data.position.y,
                data.position.z
            );
            
            // 移動方向を計算
            const direction = new THREE.Vector3().subVectors(
                this.model.getPosition(),
                this.lastPosition
            );
            
            // 移動しているかどうかを判定
            this.isMoving = direction.length() > 0.01;
            
            // 移動している場合は歩行アニメーションを再生
            if (this.isMoving) {
                this.model.isMoving = true;
                
                // 移動方向に体を向ける
                if (direction.length() > 0) {
                    direction.normalize();
                    const targetRotation = Math.atan2(direction.x, direction.z);
                    this.model.setRotation(targetRotation);
                }
            } else {
                // 停止時は待機アニメーションを再生
                this.model.isMoving = false;
            }
        }
        
        if (data.rotation) {
            this.model.setRotation(data.rotation.y);
        }
        
        if (data.state) {
            this.state = data.state;
        }
    }

    dispose() {
        this.model.dispose();
    }
}

class EnemyBullet {
    constructor(scene, position, direction, speed) {
        this.scene = scene;
        this.model = this.createModel();
        this.model.position.copy(position);
        this.scene.add(this.model);
        this.direction = direction;
        this.speed = speed;
    }

    createModel() {
        const geometry = new THREE.SphereGeometry(0.2, 8, 8);
        const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        const model = new THREE.Mesh(geometry, material);
        model.castShadow = true;
        return model;
    }

    update(deltaTime) {
        this.model.position.add(this.direction.clone().multiplyScalar(this.speed * deltaTime));
    }

    dispose() {
        this.scene.remove(this.model);
        this.model.geometry.dispose();
        this.model.material.dispose();
    }
} 