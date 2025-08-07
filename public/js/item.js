class Item {
    constructor(scene, itemType, position) {
        console.log("=== Itemクラスコンストラクタ開始 ===");
        console.log("アイテムタイプ:", itemType, "位置:", position);
        this.scene = scene;
        this.type = itemType;
        const lang = localStorage.getItem('language') || 'ja';
        this.itemConfig = ItemsConfig.getItemConfig(itemType, lang);
        console.log("アイテム設定:", this.itemConfig);
        if (!this.itemConfig) {
            console.error('無効なアイテムタイプです:', itemType);
            return;
        }

        // GLTFLoaderのインスタンスを作成
        this.gltfLoader = new THREE.GLTFLoader();

        // アイテムタイプに基づいてGLBファイルを選択
        const glbFile = this.getGlbFileForItemType(itemType);
        
        if (glbFile) {
            // GLBファイルを使用
            this.loadGlbModel(glbFile, position);
        } else {
            // デフォルトのSphereGeometryを使用
            this.createSphereMesh(position);
        }
        
        // 回転アニメーション用の変数
        this.rotationSpeed = 0.1;
        this.floatSpeed = 1.5;
        this.floatHeight = 0.7;
        this.initialY = position.y + 0.5;
        this.time = 0;
        console.log("=== Itemクラスコンストラクタ完了 ===");
    }

    // アイテムタイプに基づいてGLBファイルを取得
    getGlbFileForItemType(itemType) {
        // 食料系アイテム
        const foodItems = ['food', 'bread', 'crackers', 'apple', 'orange', 'blueberry', 'mushroom', 
                          'wildBerries', 'meat', 'cookedMeat', 'fish', 'cookedFish', 'carrot',
                          'dirtyFood', 'cannedSardines', 'cannedBeans', 'cannedCorn', 'cannedTuna', 'cannedSoup'];
        
        // 飲料系アイテム
        const waterItems = ['water', 'dirtyWater', 'purifiedWater', 'soda', 'tea', 'juice', 'energyDrink', 'beer', 'spoiledWater'];
        
        // 医療系アイテム
        const medItems = ['healthPotion', 'medicine', 'healthKit', 'firstAidKit', 'morphine', 'adrenaline', 'bandage', 'warpPotion'];
        
        // 武器系アイテム
        const weaponItems = ['shotgun', 'plasmacannon', 'machinegun', 'magnum', 'grenadelauncher', 'flamethrower'];

        if (foodItems.includes(itemType)) {
            return '/gltf/item-food.glb';
        } else if (waterItems.includes(itemType)) {
            return '/gltf/item-water.glb';
        } else if (medItems.includes(itemType)) {
            return '/gltf/item-med.glb';
        } else if (weaponItems.includes(itemType)) {
            return '/gltf/item-wepon.glb';
        }
        
        return null; // デフォルトのSphereGeometryを使用
    }

    // GLBモデルを読み込む
    loadGlbModel(glbFile, position) {
        this.gltfLoader.load(glbFile, (gltf) => {
            const model = gltf.scene;
            
            // モデルのスケールを調整
            const scale = 3;
            model.scale.set(scale, scale, scale);
            
            // モデルの位置を設定
            model.position.copy(position);
            model.position.y += 0.5; // 少し浮かせる
            
            // ユーザーデータを設定
            model.userData = { 
                itemType: this.type
            };
            
            // マテリアルの調整
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // マテリアルが存在する場合、発光効果を追加
                    if (child.material) {
                        const material = child.material.clone();
                        if (this.itemConfig.color) {
                            material.emissive = new THREE.Color(this.itemConfig.color);
                            material.emissiveIntensity = 0.3;
                        }
                        child.material = material;
                    }
                }
            });
            
            this.mesh = model;
            this.scene.add(this.mesh);
            console.log("GLBアイテムメッシュをシーンに追加完了");
        }, undefined, (error) => {
            console.error('GLBファイルの読み込みに失敗しました:', error);
            // 読み込みに失敗した場合はデフォルトのSphereGeometryを使用
            this.createSphereMesh(position);
        });
    }

    // デフォルトのSphereGeometryメッシュを作成
    createSphereMesh(position) {
        const geometry = new THREE.SphereGeometry(0.5, 3, 3);
        const material = new THREE.MeshStandardMaterial({
            color: this.itemConfig.color,
            emissive: this.itemConfig.color,
            emissiveIntensity: 2.5
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        this.mesh.position.y += 0.5;
        this.mesh.userData = { 
            itemType: this.type
        };
        
        this.scene.add(this.mesh);
        console.log("デフォルトアイテムメッシュをシーンに追加完了");
    }
    
    // アイテムのアニメーションを更新
    update(deltaTime) {
        if (!this.mesh) return;
        
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

    // リソースの解放
    dispose() {
        if (this.mesh) {
            if (this.mesh.parent) {
                this.mesh.parent.remove(this.mesh);
            }
            if (this.mesh.geometry) {
                this.mesh.geometry.dispose();
            }
            if (this.mesh.material) {
                this.mesh.material.dispose();
            }
            // GLBモデルの場合、子要素も解放
            if (this.mesh.children) {
                this.mesh.children.forEach(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
            }
        }
    }
} 