class Item {
    constructor(itemType, position) {
        this.type = itemType;
        this.itemConfig = GameConfig.ITEMS[itemType];
        if (!this.itemConfig) {
            console.error('無効なアイテムタイプです:', itemType);
            return;
        }

        // アイテムのメッシュを作成
        const geometry = new THREE.SphereGeometry(0.5, 3, 3);
        const material = new THREE.MeshStandardMaterial({
            color: this.itemConfig.color,
            emissive: this.itemConfig.color,
            emissiveIntensity: 2.5
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        this.mesh.userData = { 
            itemType: this.type
        };
        
        // アイテムを少し浮かせる
        this.mesh.position.y += 0.5;
        
        // 回転アニメーション用の変数
        this.rotationSpeed = 0.1;
        this.floatSpeed = 1.5;
        this.floatHeight = 0.7;
        this.initialY = this.mesh.position.y;
        this.time = 0;
    }
    
    // アイテムのアニメーションを更新
    update(deltaTime) {
        this.time += deltaTime;
        
        // 回転
        this.mesh.rotation.y += this.rotationSpeed;
        //console.log(this.mesh.rotation.y);
        
        // 上下の浮遊
        this.mesh.position.y = this.initialY + Math.sin(this.time * this.floatSpeed) * this.floatHeight;
    }
    
    // アイテムを取得した時の処理
    collect() {
        // シーンから削除
        if (this.mesh && this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
        }
        return this.type;
    }
} 