class Item {
    constructor(scene, position, type) {
        this.scene = scene;
        this.position = position;
        this.type = type;
        this.isActive = false;
        this.model = null;
        this.spawnDistance = 20; // プレイヤーがこの距離以内に入るとアイテムが表示される
        this.despawnDistance = 30; // プレイヤーがこの距離以上離れるとアイテムが消える
    }
    
    // アイテムの種類に応じたモデルを作成
    createModel() {
        let geometry, material, scale = 1.0;
        
        switch (this.type) {
            case 'canned_food':
                geometry = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 16);
                material = new THREE.MeshPhongMaterial({ color: 0xffcc00 });
                break;
            case 'blueberry':
                geometry = new THREE.SphereGeometry(0.2, 8, 8);
                material = new THREE.MeshPhongMaterial({ color: 0x0000ff });
                break;
            case 'jerky':
                geometry = new THREE.BoxGeometry(0.4, 0.2, 0.2);
                material = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
                break;
            case 'water_bottle':
                geometry = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 16);
                material = new THREE.MeshPhongMaterial({ color: 0x00ffff, transparent: true, opacity: 0.7 });
                break;
            case 'soda':
                geometry = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 16);
                material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
                break;
            case 'tshirt':
                geometry = new THREE.BoxGeometry(0.5, 0.3, 0.1);
                material = new THREE.MeshPhongMaterial({ color: 0xffffff });
                break;
            case 'jacket':
                geometry = new THREE.BoxGeometry(0.6, 0.4, 0.2);
                material = new THREE.MeshPhongMaterial({ color: 0x0000ff });
                break;
            case 'hat':
                geometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
                material = new THREE.MeshPhongMaterial({ color: 0x808080 });
                break;
            case 'bandage':
                geometry = new THREE.BoxGeometry(0.4, 0.1, 0.1);
                material = new THREE.MeshPhongMaterial({ color: 0xffffff });
                break;
            case 'towel':
                geometry = new THREE.BoxGeometry(0.5, 0.1, 0.3);
                material = new THREE.MeshPhongMaterial({ color: 0xffffff });
                break;
            default:
                geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
                material = new THREE.MeshPhongMaterial({ color: 0xffffff });
        }
        
        const model = new THREE.Mesh(geometry, material);
        model.position.copy(this.position);
        model.castShadow = true;
        model.receiveShadow = true;
        
        // アイテムを少し浮かせる
        model.position.y += 0.2;
        
        // アイテムを少し回転させる
        model.rotation.y = Math.random() * Math.PI * 2;
        
        return model;
    }
    
    // アイテムを表示する
    show() {
        if (!this.isActive) {
            this.model = this.createModel();
            this.scene.add(this.model);
            this.isActive = true;
            
            // アイテムを上下に揺らすアニメーション
            this.animationOffset = Math.random() * Math.PI * 10;
        }
    }
    
    // アイテムを非表示にする
    hide() {
        if (this.isActive && this.model) {
            this.scene.remove(this.model);
            this.model.geometry.dispose();
            this.model.material.dispose();
            this.model = null;
            this.isActive = false;
        }
    }
    
    // アイテムを更新する
    update(deltaTime, playerPosition) {
        // プレイヤーとの距離を計算
        const distance = this.position.distanceTo(playerPosition);
        
        // プレイヤーが近くにいる場合は表示、遠くにいる場合は非表示
        if (distance < this.spawnDistance) {
            this.show();
            
            // アイテムを上下に揺らす
            if (this.model) {
                this.model.position.y = this.position.y + 0.2 + Math.sin(Date.now() * 0.002 + this.animationOffset) * 0.1;
                this.model.rotation.y += deltaTime * 0.5;
            }
        } else if (distance > this.despawnDistance) {
            this.hide();
        }
    }
    
    // アイテムを取得した時の効果
    getEffect() {
        switch (this.type) {
            case 'canned_food':
            case 'blueberry':
            case 'jerky':
                return { hunger: 30 };
            case 'water_bottle':
            case 'soda':
                return { thirst: 30 };
            case 'tshirt':
            case 'jacket':
            case 'hat':
                return { temperature: 10 };
            case 'bandage':
                return { bleeding: -20 };
            case 'towel':
                return { hygiene: 20 };
            default:
                return {};
        }
    }
    
    // アイテムを破棄する
    dispose() {
        this.hide();
    }
} 