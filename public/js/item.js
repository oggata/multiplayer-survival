class Item {
    constructor(type, position) {
        this.type = type;
        this.position = position;
        
        // アイテムの見た目を設定
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhongMaterial({
            color: this.getItemColor(type),
            transparent: true,
            opacity: 0.8
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // アイテムを少し浮かせる
        this.mesh.position.y += 0.5;
        
        // 回転アニメーション用の変数
        this.rotationSpeed = 0.01;
        this.floatSpeed = 0.002;
        this.floatHeight = 0.2;
        this.initialY = this.mesh.position.y;
        this.time = 0;
    }
    
    // アイテムの種類に応じた色を返す
    getItemColor(type) {
        switch(type) {
            case 'health':
                return 0xff0000; // 赤
            case 'food':
                return 0x00ff00; // 緑
            case 'water':
                return 0x0000ff; // 青
            case 'bandage':
                return 0xffffff; // 白
            case 'medicine':
                return 0xffff00; // 黄
            default:
                return 0x808080; // グレー
        }
    }
    
    // アイテムのアニメーションを更新
    update(deltaTime) {
        this.time += deltaTime;
        
        // 回転
        this.mesh.rotation.y += this.rotationSpeed;
        
        // 上下の浮遊
        this.mesh.position.y = this.initialY + Math.sin(this.time * this.floatSpeed) * this.floatHeight;
    }
    
    // アイテムを取得した時の処理
    collect() {
        // シーンから削除
        this.mesh.parent.remove(this.mesh);
        return this.type;
    }
} 