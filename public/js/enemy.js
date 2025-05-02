class Enemy {
    constructor(scene, enemyData, game) {
        this.scene = scene;
        this.game = game;
        this.id = enemyData.id;
        this.model = new Character(this.scene,"enemy");
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
        



            // GameConfig.ITEMSからランダムにアイテムタイプを選択
            const itemTypes = Object.entries(GameConfig.ITEMS)
                .filter(([_, item]) => item.dropChance !== undefined)
                .map(([type]) => type);
            
            //if (itemTypes.length === 0) continue;
            
            const selectedType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
            //if (!selectedType || !GameConfig.ITEMS[selectedType]) continue;

            // アイテムを生成
            const position = new THREE.Vector3(this.model.position.x, 0.5, this.model.position.z);
            this.spawnItem(selectedType, position);


        // 敵を削除
        setTimeout(() => {
            this.dispose();
        }, 100); // 1秒後に削除
    }

    spawnItem(itemType, position) {
        const item = new Item(itemType, position);
        this.scene.add(item.mesh);
        this.game.items.push(item);
    }


    createDeathEffect() {
        // パーティクルエフェクトの作成
        const particleCount = 50;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3); // 各パーティクルの速度
        const colors = new Float32Array(particleCount * 3);
        
        const enemyPosition = this.model.getPosition();
        const gravity = -9.8; // 重力加速度
    
        for (let i = 0; i < particleCount; i++) {
            // ランダムな方向にパーティクルを配置
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 2;
            positions[i * 3] = enemyPosition.x + Math.cos(angle) * radius;
            positions[i * 3 + 1] = enemyPosition.y + Math.random() * 2;
            positions[i * 3 + 2] = enemyPosition.z + Math.sin(angle) * radius;
    
            // ランダムな速度を設定
            velocities[i * 3] = (Math.random() - 0.5) * 5; // x方向の速度
            velocities[i * 3 + 1] = Math.random() * 5; // y方向の速度（上方向）
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 5; // z方向の速度
    
            // 敵の色に基づいてパーティクルの色を設定
            const color = new THREE.Color(this.color);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }
    
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3)); // 速度を属性として追加
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.5, // パーティクルを大きめに設定
            vertexColors: true,
            transparent: true,
            opacity: 1
        });
    
        const particleSystem = new THREE.Points(particles, particleMaterial);
        this.scene.add(particleSystem);
    
        // パーティクルのアニメーション
        const startTime = Date.now();
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000; // 経過時間（秒）
            const positions = particleSystem.geometry.attributes.position.array;
            const velocities = particleSystem.geometry.attributes.velocity.array;
    
            for (let i = 0; i < particleCount; i++) {
                // 重力を適用して速度を更新
                velocities[i * 3 + 1] += gravity * 0.016; // y方向に重力を適用（フレーム間隔を約16msと仮定）
    
                // 位置を更新
                positions[i * 3] += velocities[i * 3] * 0.016; // x方向
                positions[i * 3 + 1] += velocities[i * 3 + 1] * 0.016; // y方向
                positions[i * 3 + 2] += velocities[i * 3 + 2] * 0.016; // z方向
    
                // 地面に到達したら停止
                if (positions[i * 3 + 1] < 0) {
                    positions[i * 3 + 1] = 0;
                    velocities[i * 3] = 0;
                    velocities[i * 3 + 1] = 0;
                    velocities[i * 3 + 2] = 0;
                }
            }
    
            particleSystem.geometry.attributes.position.needsUpdate = true;
    
            // フェードアウト
            particleMaterial.opacity = Math.max(1 - elapsed, 0);
    
            if (elapsed < 2) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(particleSystem);
                particleSystem.geometry.dispose();
                particleSystem.material.dispose();
            }
        };
    
        animate();
    }
    
    createDeathEffect2() {
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