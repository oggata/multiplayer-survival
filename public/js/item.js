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
        
        if (itemType === 'experienceCrystal') {
            // 経験値クリスタルはボックスで作成
            this.createExperienceCrystal(position);
        } else if (glbFile) {
            // GLBファイルを使用する前に、一時的なメッシュを作成
            this.createTemporaryMesh(position);
            this.loadGlbModel(glbFile, position);
        } else {
            // デフォルトのSphereGeometryを使用
            this.createSphereMesh(position);
        }
        
        // メッシュが設定されているかチェック
        if (!this.mesh) {
            console.warn("アイテムメッシュが初期化されていません:", itemType);
        } else {
            console.log("アイテム初期化完了:", itemType, "メッシュ:", this.mesh);
        }
        
        // 回転アニメーション用の変数
        this.rotationSpeed = 0.1;
        this.floatSpeed = 1.5;
        this.floatHeight = 0.7;
        this.initialY = position.y + 0.5;
        this.time = 0;
        
        // 経験値クリスタルの自動消去タイマー
        if (itemType === 'experienceCrystal') {
            this.lifeTime = 10.0; // 10秒
            this.currentLifeTime = 0.0;
        }
        
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
        
        // 経験値クリスタル
        const experienceItems = ['experienceCrystal'];

        if (foodItems.includes(itemType)) {
            return '/gltf/item-food.glb';
        } else if (waterItems.includes(itemType)) {
            return '/gltf/item-water.glb';
        } else if (medItems.includes(itemType)) {
            return '/gltf/item-med.glb';
        } else if (weaponItems.includes(itemType)) {
            return '/gltf/item-wepon.glb';
        } else if (experienceItems.includes(itemType)) {
            return null; // 経験値クリスタルはボックスで作成するのでnullを返す
        }
        
        return null; // デフォルトのSphereGeometryを使用
    }

    // GLBモデルを読み込む
    loadGlbModel(glbFile, position) {
        this.gltfLoader.load(glbFile, (gltf) => {
            const model = gltf.scene;
            
            // アイテムタイプに基づいてスケールを調整
            let scale = 3; // デフォルトスケール
            
            // ドリンク系アイテムと武器系アイテムは半分のスケール
            const waterItems = ['water', 'dirtyWater', 'purifiedWater', 'soda', 'tea', 'juice', 'energyDrink', 'beer', 'spoiledWater'];
            const weaponItems = ['shotgun', 'plasmacannon', 'machinegun', 'magnum', 'grenadelauncher', 'flamethrower'];
            
            if (waterItems.includes(this.type) || weaponItems.includes(this.type)) {
                scale = 1.5; // 半分のスケール
            }
            
            model.scale.set(scale, scale, scale);
            
            // モデルの位置を設定
            model.position.copy(position);
            model.position.y += 0.5; // 少し浮かせる
            
            // ユーザーデータを設定（モデル全体と各メッシュに設定）
            model.userData = { 
                itemType: this.type
            };
            
            // マテリアルの調整
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // 各メッシュにもユーザーデータを設定
                    child.userData = { 
                        itemType: this.type
                    };
                    
                    // マテリアルが存在する場合、発光効果を追加
                    if (child.material) {
                        const material = child.material.clone();
                        // 発光色を設定（アイテム設定の色がある場合はそれを使用、ない場合は白）
                        const emissiveColor = this.itemConfig.color ? 
                            new THREE.Color(this.itemConfig.color) : 
                            new THREE.Color(0xffffff);
                        material.emissive = emissiveColor;
                        material.emissiveIntensity = 1.5; // 発光強度をさらに向上
                        
                        // マテリアルの基本色も明るくする
                        if (this.itemConfig.color) {
                            material.color = new THREE.Color(this.itemConfig.color);
                        }
                        
                        // マテリアルをより明るく見せるための設定
                        material.toneMapped = false;
                        material.needsUpdate = true;
                        
                        // 追加の明度向上設定
                        material.transparent = true;
                        material.opacity = 0.9;
                        
                        child.material = material;
                    }
                }
            });
            
            // モデル全体にPointLightを追加してさらに明るくする
            const pointLight = new THREE.PointLight(
                this.itemConfig.color ? new THREE.Color(this.itemConfig.color) : new THREE.Color(0xffffff),
                2.0, // 強度
                5.0  // 距離
            );
            pointLight.position.set(0, 0, 0);
            model.add(pointLight);
            
            // 既存の一時的なメッシュを削除
            if (this.mesh && this.mesh.parent) {
                this.mesh.parent.remove(this.mesh);
            }
            
            this.mesh = model;
            this.scene.add(this.mesh);
            console.log("GLBアイテムメッシュをシーンに追加完了:", this.type);
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
            emissiveIntensity: 3.0, // 発光強度を向上
            toneMapped: false,
            transparent: true,
            opacity: 0.9
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

    // 経験値クリスタル用のボックスを作成
    createExperienceCrystal(position) {
        // クリスタル形状のボックスを作成
        const geometry = new THREE.BoxGeometry(0.4, 0.6, 0.4);
        const material = new THREE.MeshStandardMaterial({
            color: 0xffd700, // 金色
            emissive: 0xffd700, // 発光色も金色
            emissiveIntensity: 2.0, // 発光強度
            toneMapped: false,
            transparent: true,
            opacity: 0.9
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        this.mesh.position.y += 0.5; // 少し浮かせる
        
        // ユーザーデータを設定
        this.mesh.userData = { 
            itemType: this.type
        };
        
        this.scene.add(this.mesh);
        console.log("経験値クリスタルメッシュをシーンに追加完了");
    }

    // GLBアイテム用の一時的なメッシュを作成
    createTemporaryMesh(position) {
        // 一時的な球体メッシュを作成
        const geometry = new THREE.SphereGeometry(0.3, 8, 6);
        const material = new THREE.MeshBasicMaterial({
            color: this.itemConfig.color || 0xffffff,
            transparent: true,
            opacity: 0.8
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        this.mesh.position.y += 0.5; // 少し浮かせる
        
        // ユーザーデータを設定
        this.mesh.userData = { 
            itemType: this.type
        };
        
        this.scene.add(this.mesh);
        console.log("一時的メッシュをシーンに追加完了:", this.type);
    }
    
    // アイテムのアニメーションを更新
    update(deltaTime) {
        if (!this.mesh) return;
        
        this.time += deltaTime;
        
        // 経験値クリスタルのライフタイム更新
        if (this.type === 'experienceCrystal' && this.lifeTime !== undefined) {
            this.currentLifeTime += deltaTime;
            
            // ライフタイムが終了したら消去
            if (this.currentLifeTime >= this.lifeTime) {
                this.dispose();
                return;
            }
            
            // 残り時間に応じて透明度を変更（フェードアウト効果）
            const remainingTime = this.lifeTime - this.currentLifeTime;
            if (remainingTime < 2.0) { // 最後の2秒でフェードアウト
                const fadeAlpha = remainingTime / 2.0;
                if (this.mesh.material) {
                    this.mesh.material.opacity = fadeAlpha;
                }
            }
        }
        
        // 回転
        this.mesh.rotation.y += this.rotationSpeed;
        //console.log(this.mesh.rotation.y);
        
        // 上下の浮遊
        this.mesh.position.y = this.initialY + Math.sin(this.time * this.floatSpeed) * this.floatHeight;
    }
    
    // アイテムを取得した時の処理
    collect() {
        console.log("アイテム収集処理開始:", this.type, "メッシュ:", this.mesh);
        
        // メッシュが存在しない場合は収集できない
        if (!this.mesh) {
            console.log("メッシュが存在しません:", this.type);
            return null;
        }
        
        // シーンから削除
        if (this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
        }
        
        console.log("アイテム収集完了:", this.type);
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