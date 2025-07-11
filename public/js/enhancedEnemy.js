class EnhancedEnemy {
    constructor(scene, enemyData, game) {
        this.scene = scene;
        this.game = game;
        this.id = enemyData.id;
        
        // エネミータイプに基づいてキャラクターモデルを作成
        this.enemyType = enemyData.enemyType || 'humanoid'; // デフォルトは人型
        //console.log(this.enemyType);
        switch (this.enemyType) {
            case 'quadruped': // 四足歩行
                this.model = new QuadrupedCharacter(this.scene, "enemy", game);
                break;
            case 'hexapod': // 六足歩行
                this.model = new HexapodCharacter(this.scene, "enemy", game);
                break;
            case 'giant': // 巨大
                this.model = new GiantCharacter(this.scene, "enemy", game);
                break;
            case 'crab': // カニ
                this.model = new CrabCharacter(this.scene, "enemy", game);
                break;
            case 'flying': // 飛行
                this.model = new FlyingCharacter(this.scene, "enemy", game);
                break;
            case 'slime': // スライム
                this.model = new FatCharacter(this.scene, "enemy", game);
                break;
            case 'boss': // ボス
                this.model = new BossCharacter(this.scene, "enemy", game);
                break;
            default: // 人型（デフォルト）
                this.model = new EnemyCharacter(this.scene, "enemy", game);
                break;
        }
        
        // 位置と回転を設定
        this.model.setPosition(
            enemyData.position.x,
            enemyData.position.y,
            enemyData.position.z
        );
        this.model.setRotation(enemyData.rotation.y);
        
        // エネミータイプに応じた設定
        const enemyTypeConfig = this.getEnemyConfig(enemyData.type, this.enemyType);
        
        
        // 敵の色を設定
        if(this.enemyType == "humanoid"){
            if (enemyTypeConfig) {
               // this.model.setEnemyColor(enemyTypeConfig.color);
                //this.color = enemyTypeConfig.color; // 色を保存
                this.moveSpeed = enemyTypeConfig.moveSpeed;
                this.damage = enemyTypeConfig.damage;
            }
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
        
        // 衝突判定用の半径を設定（キャラクタータイプに応じて調整）
        this.collisionRadius = this.getCollisionRadius();
    }

    // エネミータイプに応じた設定を取得
    getEnemyConfig(type, enemyModelType) {
        // 基本的な敵タイプの設定
        const baseConfig = GameConfig.ENEMY.TYPES[type] || GameConfig.ENEMY.TYPES.NORMAL;
        
        // キャラクターモデルタイプに応じた設定の変更
        let config = { ...baseConfig };
        
        // 敵の種類に応じた設定を取得
        const enemyTypeConfig = GameConfig.ENEMY.TYPES[enemyModelType.toUpperCase()];
        if (enemyTypeConfig) {
            config = { ...config, ...enemyTypeConfig };
        }
        
        return config;
    }
    
    // キャラクタータイプに応じた衝突半径を取得
    getCollisionRadius() {
        switch (this.enemyType) {
            case 'quadruped':
                return 3.6; // 四足歩行は少し大きめ
            case 'hexapod':
                return 3.6; // 六足歩行も少し大きめ
            case 'giant':
                return 3.5; // 巨大はかなり大きめ
            case 'crab':
                return 3.8; // カニは少し大きめ
            case 'flying':
                return 3.4; // 飛行は少し小さめ
            case 'slime':
                return 3.7; // スライムは少し大きめ
            case 'boss':
                return 3.0; // ボスは最大
            default:
                return 3.6; // 人型はデフォルト
        }
    }

    checkBulletCollision(bulletPosition) {
        if (this.isDead) return false;
        const distance = this.model.getPosition().distanceTo(bulletPosition);
        return distance < this.collisionRadius;
    }

    takeDamage(damage) {
        if (this.isDead) return;
        
        this.health -= damage;
        
        // ダメージエフェクトを適用
        if (this.model && this.model.takeDamage) {
            this.model.takeDamage();
        }
        
        if (this.health <= 0) {
            this.die();
        }
    }

    flashEffect() {
        // 元の色を保存
        const originalColor = this.color;
        
        // 白く光らせる
        this.model.setEnemyColor(0xffffff);
        
        // 0.1秒後に元の色に戻す
        setTimeout(() => {
            if (this.model) {
                //this.model.setEnemyColor(originalColor);
            }
        }, 100);
    }

    die() {
        if (this.isDead) return;
        
        this.isDead = true;
        
        // 死亡音を再生
        //this.game.audioManager.play('enemyDeath');
        
        // 死亡エフェクトを生成
        this.createDeathEffect();

        // サーバーに敵の死亡を通知
        this.game.socket.emit('enemyDied', this.id);

        // 敵を削除
        setTimeout(() => {
            this.dispose();
        }, 100); // 0.1秒後に削除
    }

    forceDie() {
        if (this.isDead) return;
        
        this.isDead = true;
        
        // 死亡音を再生
        //this.game.audioManager.play('enemyDeath');
        
        // 死亡エフェクトを生成
        this.createDeathEffect();

        // サーバーに敵の死亡を通知
        this.game.socket.emit('enemyDied', this.id);

        // 敵を削除
        setTimeout(() => {
            this.dispose();
        }, 100); // 0.1秒後に削除
    }


    forcedDieByServer() {
        if (this.isDead) return;
        
        this.isDead = true;
        
        // 死亡エフェクトを生成
        this.createDeathEffect();
        
        // 敵を削除
        setTimeout(() => {
            this.dispose();
        }, 100); // 0.1秒後に削除
    }
/*
    spawnItem(itemType, position) {
        const item = new Item(itemType, position);
        this.scene.add(item.mesh);
        this.game.items.push(item);
    }
*/
    createDeathEffect() {
        // パーティクルエフェクトの作成
        const particleCount = 50;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        const enemyPosition = this.model.getPosition();
        const gravity = -9.8; // m/s^2

        // 赤色で固定
        const color = new THREE.Color(0xff0000);
    
        for (let i = 0; i < particleCount; i++) {
            // ランダムな方向にパーティクルを配置
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 2;
            positions[i * 3] = enemyPosition.x + Math.cos(angle) * radius;
            positions[i * 3 + 1] = enemyPosition.y + Math.random() * 2;
            positions[i * 3 + 2] = enemyPosition.z + Math.sin(angle) * radius;
    
            // ランダムな初速度を設定
            velocities[i * 3] = (Math.random() - 0.5) * 5;
            velocities[i * 3 + 1] = Math.random() * 5;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 5;
    
            // 赤色で固定
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }
    
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 1
        });
    
        const particleSystem = new THREE.Points(particles, particleMaterial);
        this.scene.add(particleSystem);
    
        // パーティクルのアニメーション
        const startTime = Date.now();
        const initialVelocities = velocities.slice(); // 初期速度を保存
        const initialPositions = positions.slice(); // 初期位置を保存
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000; // 経過秒数
            const positions = particleSystem.geometry.attributes.position.array;
            const velocities = particleSystem.geometry.attributes.velocity.array;
    
            for (let i = 0; i < particleCount; i++) {
                // 重力加速度で落下（v = v0 + a*t, y = y0 + v0*t + 0.5*a*t^2）
                // x, zは等速直線運動
                positions[i * 3] = initialPositions[i * 3] + initialVelocities[i * 3] * elapsed;
                positions[i * 3 + 1] = initialPositions[i * 3 + 1] + initialVelocities[i * 3 + 1] * elapsed + 0.5 * gravity * elapsed * elapsed;
                positions[i * 3 + 2] = initialPositions[i * 3 + 2] + initialVelocities[i * 3 + 2] * elapsed;

                // 地面に到達したら停止
                if (positions[i * 3 + 1] < 0) {
                    positions[i * 3 + 1] = 0;
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

    update(data) {
        if (this.isDead) return;
        
        if (data.state) {
            console.log(data.state);
        }

        if (data.position) {
            // 前回の位置を保存
            this.lastPosition.copy(this.model.getPosition());
            
            // 地形の高さを取得（fieldMapが存在する場合のみ）
            let posy = 0.5; // デフォルトの高さ
            if (this.game && this.game.fieldMap) {
                const height = this.game.fieldMap.getHeightAt(data.position.x, data.position.z);
                if (height != null) {
                    posy = height + 0.5;
                }
            }

            // 新しい位置を設定
            this.model.setPosition(
                data.position.x,
                posy,
                data.position.z
            );
            
            // 移動方向を計算
            const direction = new THREE.Vector3().subVectors(
                this.model.getPosition(),
                this.lastPosition
            );
            
            // 移動しているかどうかを判定
            this.isMoving = direction.length() > 0.01;
            
            if (data.state) {
                this.state = data.state;
                // 攻撃状態に入った場合
                if (this.state == 'attacking' && this.model.startAttack) {
                    this.model.startAttack();
                }
            } else if (this.isMoving) {
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
    }

    dispose() {
        this.model.dispose();
    }
}