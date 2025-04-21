class Bullet {
    constructor(scene, position, direction, playerId) {
        this.scene = scene;
        this.playerId = playerId;
        this.speed =    8.0;
        this.lifetime = 5.0; // 5秒後に消える
        this.damage = 10;
        
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
            color: 0xffff00,
            emissive: 0xffff00,
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