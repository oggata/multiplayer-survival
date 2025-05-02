class Bullet {
    constructor(scene, position, direction, playerId, bulletType) {
        this.scene = scene;
        this.playerId = playerId;

        this.speed =    20;
        this.lifetime = 3.0; // 5秒後に消える
        this.damage = 10;
        if(bulletType == "bullet001"){
            //normal
            this.speed =    15;
            this.lifetime = 1.5; // 5秒後に消える
            this.damage = 10;
        }
        if(bulletType == "bullet002"){
            //big
            this.speed =    15;
            this.lifetime = 1.5; // 5秒後に消える
            this.damage = 20;
        }
        if(bulletType == "bullet003"){
            //fast long
            this.speed =    20;
            this.lifetime = 3; // 5秒後に消える
            this.damage = 10;
        }
        if(bulletType == "bullet004"){
            //slow big damage
            this.speed =    10;
            this.lifetime = 3; // 5秒後に消える
            this.damage = 10;
        }
        if(bulletType == "bullet005"){
            //slow long
            this.speed =    10;
            this.lifetime = 5; // 5秒後に消える
            this.damage = 10;
        }
        if(bulletType == "bullet006"){
            this.speed =    10;
            this.lifetime = 1; // 5秒後に消える
            this.damage = 10;
        }
        
        // 弾丸のモデルを作成
        this.model = this.createModel("bullet004");
        this.model.position.copy(position);
        
        // 移動方向を設定
        this.direction = direction.clone().normalize();
        this.velocity = this.direction.clone().multiplyScalar(this.speed);
        
        // シーンに追加
        this.scene.add(this.model);
        
        // 作成時間を記録
        this.createdAt = Date.now();
    }
    
    createModel(bulletType) {




if(bulletType == "bullet001"){
        // 弾丸のジオメトリとマテリアルを作成
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshPhongMaterial({ 
            color: "0xffff00",//yellow
            emissive: 0xffff00,
            emissiveIntensity: 0.5
        });
        // メッシュを作成
        const model = new THREE.Mesh(geometry, material);
        // 影を設定
        model.castShadow = true;
        return model;
}



if(bulletType == "bullet002"){
    // 弾丸のジオメトリとマテリアルを作成
    const geometry = new THREE.SphereGeometry(0.3, 8, 8);
    const material = new THREE.MeshPhongMaterial({ 
        color: 0xff2b00, //red
        emissive: 0xffff00,
        emissiveIntensity: 0.5
    });
    // メッシュを作成
    const model = new THREE.Mesh(geometry, material);
    // 影を設定
    model.castShadow = true;
    return model;
}


if(bulletType == "bullet003"){
    // 弾丸のジオメトリとマテリアルを作成
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshPhongMaterial({ 
        color: 0xff00ff, //purple
        emissive: 0xffff00,
        emissiveIntensity: 0.5
    });
    // メッシュを作成
    const model = new THREE.Mesh(geometry, material);
    // 影を設定
    model.castShadow = true;
    return model;
}


if(bulletType == "bullet004"){
    // 弾丸のジオメトリとマテリアルを作成
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshPhongMaterial({ 
        color: 0x00aaff
    });
    // メッシュを作成
    const model = new THREE.Mesh(geometry, material);
    // 影を設定
    model.castShadow = true;
    return model;
}


if(bulletType == "bullet005"){
    // 弾丸のジオメトリとマテリアルを作成
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshPhongMaterial({ 
        color: 0xe6e6e6
    });
    // メッシュを作成
    const model = new THREE.Mesh(geometry, material);
    // 影を設定
    model.castShadow = true;
    return model;
}



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