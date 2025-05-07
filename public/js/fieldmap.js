class FieldMap {
    constructor(scene, seed) {
        this.scene = scene;
        this.seed = seed || Math.random();
        Math.seedrandom(this.seed.toString());
        this.rng = Math.random;
        this.mapSize = GameConfig.MAP.SIZE;
        this.biomes = [];
        this.objects = [];
        
        // ビルタイプの定義
        this.buildingTypes = [
            { name: 'skyscraper', minHeight: 30, maxHeight: 100, color: 0x555555 },
            { name: 'office', minHeight: 15, maxHeight: 40, color: 0x666666 },
            { name: 'residential', minHeight: 5, maxHeight: 15, color: 0x777777 },
            { name: 'industrial', minHeight: 8, maxHeight: 20, color: 0x444444 },
            { name: 'mall', minHeight: 10, maxHeight: 25, color: 0x888888 },
            { name: 'hospital', minHeight: 12, maxHeight: 35, color: 0xFFFFFF },
            { name: 'school', minHeight: 8, maxHeight: 20, color: 0xCCCCCC },
            { name: 'apartment', minHeight: 15, maxHeight: 45, color: 0x999999 },
            { name: 'hotel', minHeight: 20, maxHeight: 60, color: 0xAAAAAA }
        ];
        
        // がれきタイプの定義
        this.debrisTypes = [
            { name: 'concrete', size: 3, color: 0x888888 },
            { name: 'metal', size: 2, color: 0x777777 },
            { name: 'glass', size: 1, color: 0xCCFFFF },
            { name: 'wood', size: 2, color: 0x8B4513 },
            { name: 'brick', size: 1.5, color: 0xB22222 },
            { name: 'plastic', size: 1, color: 0xE6E6FA },
            { name: 'rubber', size: 1.5, color: 0x2F4F4F },
            { name: 'ceramic', size: 1, color: 0xF5F5F5 }
        ];
        
        // 木の種類の定義
        this.treeTypes = [
            { name: 'pine', trunkColor: 0x8B4513, leavesColor: 0x228B22, trunkWidth: 0.2, trunkHeight: 1.0, leavesSize: 1.2 },
            { name: 'oak', trunkColor: 0x654321, leavesColor: 0x2E8B57, trunkWidth: 0.3, trunkHeight: 0.8, leavesSize: 1.5 },
            { name: 'birch', trunkColor: 0xF5F5DC, leavesColor: 0x90EE90, trunkWidth: 0.15, trunkHeight: 0.9, leavesSize: 1.0 },
            { name: 'maple', trunkColor: 0x8B4513, leavesColor: 0xFF4500, trunkWidth: 0.25, trunkHeight: 0.7, leavesSize: 1.3 },
            { name: 'willow', trunkColor: 0x8B4513, leavesColor: 0x32CD32, trunkWidth: 0.2, trunkHeight: 0.6, leavesSize: 1.8 },
            { name: 'palm', trunkColor: 0x8B4513, leavesColor: 0x228B22, trunkWidth: 0.3, trunkHeight: 1.2, leavesSize: 2.0 },
            { name: 'cherry', trunkColor: 0x8B4513, leavesColor: 0xFFB6C1, trunkWidth: 0.2, trunkHeight: 0.8, leavesSize: 1.4 },
            { name: 'cypress', trunkColor: 0x8B4513, leavesColor: 0x006400, trunkWidth: 0.15, trunkHeight: 1.1, leavesSize: 0.8 },
            { name: 'redwood', trunkColor: 0x8B4513, leavesColor: 0x228B22, trunkWidth: 0.4, trunkHeight: 1.5, leavesSize: 1.6 }
        ];

        // 岩の種類の定義
        this.rockTypes = [
            { name: 'granite', color: 0x808080, size: 1.0, roughness: 0.9 },
            { name: 'limestone', color: 0xD3D3D3, size: 0.8, roughness: 0.8 },
            { name: 'basalt', color: 0x2F4F4F, size: 1.2, roughness: 0.95 },
            { name: 'sandstone', color: 0xD2B48C, size: 0.9, roughness: 0.7 },
            { name: 'marble', color: 0xFFFFFF, size: 0.7, roughness: 0.6 },
            { name: 'obsidian', color: 0x000000, size: 1.1, roughness: 0.85 },
            { name: 'quartz', color: 0xE6E6FA, size: 0.6, roughness: 0.5 },
            { name: 'slate', color: 0x708090, size: 0.8, roughness: 0.75 },
            { name: 'shale', color: 0x556B2F, size: 0.7, roughness: 0.8 }
        ];
        
        this.createMap();
    }
    
    createMap() {
        // バイオームの生成
        this.generateBiomes();
        
        // 地形の生成
        this.generateTerrain();
        
        // オブジェクトの生成
        this.generateObjects();
        
        // 境界壁の作成
        this.createBoundaryWalls();
    }
    
    generateBiomes() {
        // バイオームの種類を定義
        const biomeTypes = ['urban', 'forest', 'ruins', 'industrial'];
        
        // マップの端から砂浜の幅を定義
        const beachWidth = 30; // 砂浜の幅
        
        // バイオームの配置を決定
        for (let x = -this.mapSize/2; x < this.mapSize/2; x += 100) {
            for (let z = -this.mapSize/2; z < this.mapSize/2; z += 100) {
                // マップの端からbeachWidth以内の距離かどうかをチェック
                const distanceFromEdge = Math.min(
                    Math.abs(x + this.mapSize/2),
                    Math.abs(x - this.mapSize/2),
                    Math.abs(z + this.mapSize/2),
                    Math.abs(z - this.mapSize/2)
                );
                
                let biomeType;
                if (distanceFromEdge < beachWidth) {
                    // マップの端は砂浜
                    biomeType = 'beach';
                } else {
                    // それ以外は通常のバイオーム
                    const noise = this.rng();
                    biomeType = biomeTypes[Math.floor(noise * biomeTypes.length)];
                }
                
                this.biomes.push({
                    type: biomeType,
                    x: x,
                    z: z,
                    size: 50
                });
            }
        }
    }
    
    generateTerrain() {
        // 地形の生成（高さマップ）
        const terrainGeometry = new THREE.BoxGeometry(
            GameConfig.MAP.SIZE, 
            GameConfig.MAP.FLOOR.THICKNESS, 
            GameConfig.MAP.SIZE, 
            100, 1, 100
        );
        const terrainMaterial = new THREE.MeshStandardMaterial({
            color: GameConfig.MAP.FLOOR.COLOR,
            roughness: 0.8,
            metalness: 0.2,
            vertexColors: true
        });
        
        const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
        terrain.position.y = -GameConfig.MAP.FLOOR.THICKNESS / 2; // 床の位置を調整（高さの半分を下げる）
        terrain.receiveShadow = true;
        
        // 頂点の色を設定
        const vertices = terrainGeometry.attributes.position.array;
        const colors = new Float32Array(vertices.length);
        
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 2];
            
            // バイオームに基づいて色を設定
            const biome = this.getBiomeAt(x, z);
            const color = new THREE.Color();
            
            switch (biome.type) {
                case 'urban':
                    color.setHex(0x808080);
                    break;
                case 'forest':
                    color.setHex(0x556B2F);
                    break;
                case 'ruins':
                    color.setHex(0xA0522D);
                    break;
                case 'industrial':
                    color.setHex(0x696969);
                    break;
            }
            
            colors[i] = color.r;
            colors[i + 1] = color.g;
            colors[i + 2] = color.b;
        }
        
        terrainGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.scene.add(terrain);
        
        // 床のグリッドを追加（視覚的な補助）
        const gridHelper = new THREE.GridHelper(
            GameConfig.MAP.SIZE, 
            GameConfig.MAP.FLOOR.GRID_SIZE, 
            GameConfig.MAP.FLOOR.GRID_COLOR, 
            GameConfig.MAP.FLOOR.GRID_SECONDARY_COLOR
        );
        gridHelper.position.y = 0.01; // 床の上に少し浮かせる
        this.scene.add(gridHelper);
    }
    
    generateObjects() {
        // バイオームごとのオブジェクト生成
        for (const biome of this.biomes) {
            // がれきの生成確率を増加
            const debrisChance = 0.5; // 50%の確率でがれきを生成
            
            // がれきを生成（複数個）
            if (this.rng() < debrisChance) {
                const debrisCount = Math.floor(this.rng() * 3) + 1; // 1-3個のがれきを生成
                for (let i = 0; i < debrisCount; i++) {
                    const x = biome.x + (this.rng() - 0.5) * biome.size;
                    const z = biome.z + (this.rng() - 0.5) * biome.size;
                    this.createDebris(x, z);
                }
            }
            
            // バイオームタイプに応じたオブジェクト生成
            switch (biome.type) {
                case 'urban':
                    this.generateUrbanObjects(biome);
                    break;
                case 'forest':
                    this.generateForestObjects(biome);
                    break;
                case 'ruins':
                    this.generateRuinsObjects(biome);
                    break;
                case 'industrial':
                    this.generateIndustrialObjects(biome);
                    break;
                case 'beach':
                    this.generateBeachObjects(biome);
                    break;
            }
        }

        // グリッドベースの追加オブジェクト生成
        const gridSize = 20; // グリッドのサイズ
        const gridCount = Math.floor(this.mapSize / gridSize);
        
        for (let x = -gridCount/2; x < gridCount/2; x++) {
            for (let z = -gridCount/2; z < gridCount/2; z++) {
                // グリッドの中心位置を計算
                const centerX = x * gridSize + (this.rng() - 0.5) * gridSize * 0.5;
                const centerZ = z * gridSize + (this.rng() - 0.5) * gridSize * 0.5;
                
                // グリッド内に複数のオブジェクトを配置
                const objectCount = Math.floor(this.rng() * 3) + 1; // 1-3個のオブジェクト
                
                for (let i = 0; i < objectCount; i++) {
                    // グリッド内のランダムな位置を計算
                    const offsetX = (this.rng() - 0.5) * gridSize * 0.8;
                    const offsetZ = (this.rng() - 0.5) * gridSize * 0.8;
                    const posX = centerX + offsetX;
                    const posZ = centerZ + offsetZ;
                    
                    // 他のオブジェクトとの距離をチェック
                    let isSafe = true;
                    for (const object of this.objects) {
                        const dx = posX - object.position.x;
                        const dz = posZ - object.position.z;
                        const distance = Math.sqrt(dx * dx + dz * dz);
                        if (distance < 8) { // 最小距離を8に設定
                            isSafe = false;
                            break;
                        }
                    }
                    
                    if (isSafe) {
                        // ランダムにオブジェクトタイプを選択
                        const objectType = Math.floor(this.rng() * 6); // 6種類のオブジェクト
                        switch (objectType) {
                            case 0: // がれき
                                this.createDebris(posX, posZ);
                                break;
                            case 1: // 岩
                                const rockSize = this.rng() * 2 + 1;
                                this.createRock(posX, posZ, rockSize);
                                break;
                            case 2: // 木
                                const treeHeight = Math.floor(this.rng() * 5) + 3;
                                const treeType = this.treeTypes[Math.floor(this.rng() * this.treeTypes.length)].name;
                                this.createTree(posX, posZ, treeHeight, treeType);
                                break;
                            case 3: // 車
                                this.createCar(posX, posZ, this.rng() * Math.PI * 2);
                                break;
                            case 4: // 廃墟
                                const ruinHeight = Math.floor(this.rng() * 5) + 2;
                                this.createRuins(posX, posZ, ruinHeight);
                                break;
                            case 5: // 小さな岩の群れ
                                const smallRockCount = Math.floor(this.rng() * 3) + 2;
                                for (let j = 0; j < smallRockCount; j++) {
                                    const smallRockX = posX + (this.rng() - 0.5) * 3;
                                    const smallRockZ = posZ + (this.rng() - 0.5) * 3;
                                    const smallRockSize = this.rng() * 1.5 + 0.5;
                                    this.createRock(smallRockX, smallRockZ, smallRockSize);
                                }
                                break;
                        }
                    }
                }
            }
        }
    }
    
    generateUrbanObjects(biome) {
        const mapSize = GameConfig.MAP.SIZE;
        const halfSize = mapSize / 2;
        const minDistance = GameConfig.MAP.BUILDINGS.MIN_DISTANCE;
        
        // ビルの生成確率を設定から取得
        const buildingChance = GameConfig.MAP.BUILDINGS.DENSITY;
        
for(var i=0;i< GameConfig.MAP.BUILDINGS.COUNT;i++){
        // ビルを生成
        if (this.rng() < buildingChance) {
            let position;
            let isSafe = false;
            let attempts = 0;
            const maxAttempts = GameConfig.MAP.BUILDINGS.MAX_ATTEMPTS;
            
            while (!isSafe && attempts < maxAttempts) {
                // マップの範囲内でランダムな位置を生成
                position = new THREE.Vector3(
                    (Math.random() - 0.5) * (mapSize - minDistance * 2),
                    0,
                    (Math.random() - 0.5) * (mapSize - minDistance * 2)
                );
                
                // マップの境界からminDistance以上離れていることを確認
                if (Math.abs(position.x) > halfSize - minDistance || 
                    Math.abs(position.z) > halfSize - minDistance) {
                    attempts++;
                    continue;
                }
                
                // 他のオブジェクトとの距離をチェック
                isSafe = true;
                for (const object of this.objects) {
                    if (object.position.distanceTo(position) < minDistance) {
                        isSafe = false;
                        break;
                    }
                }
                
                attempts++;
            }
            
            if (isSafe) {
                const buildingType = this.buildingTypes[Math.floor(Math.random() * this.buildingTypes.length)];
                const height = buildingType.minHeight + this.rng() * (buildingType.maxHeight - buildingType.minHeight);
                const width = 15 + this.rng() * 25;
                this.createBuilding(position, buildingType, height, width);
            }
        }
        for(var i=0;i<GameConfig.MAP.BUILDINGS.CAR_COUNT;i++){        
        // 車の生成
        const carChance = 0.3; // 30%の確率で車を生成
        if (this.rng() < carChance) {
            const x = biome.x + (this.rng() - 0.5) * biome.size;
            const z = biome.z + (this.rng() - 0.5) * biome.size;
            this.createCar(x, z, this.rng() * Math.PI * 2);
        }
    }
    }
    }
    
    generateForestObjects(biome) {
        // バイオームの種類に応じて木の種類を決定
        let treeType;
        switch (biome.type) {
            case 'urban':
                // 都市部は桜とメープル
                treeType = Math.random() < 0.5 ? 'cherry' : 'maple';
                break;
            case 'forest':
                // 森は松、オーク、シラカバ
                const forestTypes = ['pine', 'oak', 'birch'];
                treeType = forestTypes[Math.floor(Math.random() * forestTypes.length)];
                break;
            case 'ruins':
                // 廃墟は松と糸杉
                treeType = Math.random() < 0.5 ? 'pine' : 'cypress';
                break;
            case 'industrial':
                // 工業地帯は松とレッドウッド
                treeType = Math.random() < 0.5 ? 'pine' : 'redwood';
                break;
            default:
                treeType = 'pine';

                const mapSize = GameConfig.MAP.SIZE;
                const halfSize = mapSize / 2;
                const minDistance = GameConfig.MAP.BUILDINGS.MIN_DISTANCE;
                
                // ビルの生成確率を設定から取得
                const buildingChance = GameConfig.MAP.BUILDINGS.DENSITY;
                
                for(var i=0;i<GameConfig.MAP.BUILDINGS.COUNT;i++){               // ビルを生成
                if (this.rng() < buildingChance) {
                    let position;
                    let isSafe = false;
                    let attempts = 0;
                    const maxAttempts = GameConfig.MAP.BUILDINGS.MAX_ATTEMPTS;
                    
                    while (!isSafe && attempts < maxAttempts) {
                        // マップの範囲内でランダムな位置を生成
                        position = new THREE.Vector3(
                            (Math.random() - 0.5) * (mapSize - minDistance * 2),
                            0,
                            (Math.random() - 0.5) * (mapSize - minDistance * 2)
                        );
                        
                        // マップの境界からminDistance以上離れていることを確認
                        if (Math.abs(position.x) > halfSize - minDistance || 
                            Math.abs(position.z) > halfSize - minDistance) {
                            attempts++;
                            continue;
                        }
                        
                        // 他のオブジェクトとの距離をチェック
                        isSafe = true;
                        for (const object of this.objects) {
                            if (object.position.distanceTo(position) < minDistance) {
                                isSafe = false;
                                break;
                            }
                        }
                        
                        attempts++;
                    }
                    
                    if (isSafe) {
                        const buildingType = this.buildingTypes[Math.floor(Math.random() * this.buildingTypes.length)];
                        const height = buildingType.minHeight + this.rng() * (buildingType.maxHeight - buildingType.minHeight);
                        const width = 15 + this.rng() * 25;
                        this.createBuilding(position, buildingType, height, width);
                    }
                }
                for(var i=0;i<GameConfig.MAP.BUILDINGS.CAR_COUNT;i++){
                // 車の生成
                const carChance = 0.3; // 30%の確率で車を生成
                if (this.rng() < carChance) {
                    const x = biome.x + (this.rng() - 0.5) * biome.size;
                    const z = biome.z + (this.rng() - 0.5) * biome.size;
                    this.createCar(x, z, this.rng() * Math.PI * 2);
                }}
            }

        }

        // 木の生成
        const treeCount = Math.floor(this.rng() * 10) + 5;
        for (let i = 0; i < treeCount; i++) {
            const x = biome.x + (this.rng() - 0.5) * biome.size;
            const z = biome.z + (this.rng() - 0.5) * biome.size;
            const height = Math.floor(this.rng() * 5) + 3;
            this.createTree(x, z, height, treeType);
        }
        
        // 岩の生成
        const rockCount = Math.floor(this.rng() * 5) + 2;
        for (let i = 0; i < rockCount; i++) {
            const x = biome.x + (this.rng() - 0.5) * biome.size;
            const z = biome.z + (this.rng() - 0.5) * biome.size;
            const size = this.rng() * 2 + 1;
            this.createRock(x, z, size);
        }
    }
    
    generateRuinsObjects(biome) {
        // 廃墟の生成
        const ruinCount = Math.floor(this.rng() * 4) + 2;
        for (let i = 0; i < ruinCount; i++) {
            const x = biome.x + (this.rng() - 0.5) * biome.size;
            const z = biome.z + (this.rng() - 0.5) * biome.size;
            const height = Math.floor(this.rng() * 5) + 2;
            this.createRuins(x, z, height);
        }

        const mapSize = GameConfig.MAP.SIZE;
        const halfSize = mapSize / 2;
        const minDistance = GameConfig.MAP.BUILDINGS.MIN_DISTANCE;
        
        // ビルの生成確率を設定から取得
        const buildingChance = GameConfig.MAP.BUILDINGS.DENSITY;
        for(var i=0;i<GameConfig.MAP.BUILDINGS.COUNT;i++){
        // ビルを生成
        if (this.rng() < buildingChance) {
            let position;
            let isSafe = false;
            let attempts = 0;
            const maxAttempts = GameConfig.MAP.BUILDINGS.MAX_ATTEMPTS;
            
            while (!isSafe && attempts < maxAttempts) {
                // マップの範囲内でランダムな位置を生成
                position = new THREE.Vector3(
                    (Math.random() - 0.5) * (mapSize - minDistance * 2),
                    0,
                    (Math.random() - 0.5) * (mapSize - minDistance * 2)
                );
                
                // マップの境界からminDistance以上離れていることを確認
                if (Math.abs(position.x) > halfSize - minDistance || 
                    Math.abs(position.z) > halfSize - minDistance) {
                    attempts++;
                    continue;
                }
                
                // 他のオブジェクトとの距離をチェック
                isSafe = true;
                for (const object of this.objects) {
                    if (object.position.distanceTo(position) < minDistance) {
                        isSafe = false;
                        break;
                    }
                }
                
                attempts++;
            }
            
            if (isSafe) {
                const buildingType = this.buildingTypes[Math.floor(Math.random() * this.buildingTypes.length)];
                const height = buildingType.minHeight + this.rng() * (buildingType.maxHeight - buildingType.minHeight);
                const width = 15 + this.rng() * 25;
                this.createBuilding(position, buildingType, height, width);
            }
        }
    }
        // 車の生成
        const carChance = 0.5; // 30%の確率で車を生成
        for(var i=0;i<GameConfig.MAP.BUILDINGS.CAR_COUNT;i++){
        if (this.rng() < carChance) {
            const x = biome.x + (this.rng() - 0.5) * biome.size;
            const z = biome.z + (this.rng() - 0.5) * biome.size;
            this.createCar(x, z, this.rng() * Math.PI * 2);
        }}

    }
    
    generateIndustrialObjects(biome) {
        // 工場の生成
        const factoryCount = Math.floor(this.rng() * 3) + 1;
        for (let i = 0; i < factoryCount; i++) {
            const x = biome.x + (this.rng() - 0.5) * biome.size;
            const z = biome.z + (this.rng() - 0.5) * biome.size;
            const height = Math.floor(this.rng() * 15) + 8;
            this.createFactory(x, z, height);
        }
        
        // タンクの生成
        const tankCount = Math.floor(this.rng() * 5) + 3;
        for (let i = 0; i < tankCount; i++) {
            const x = biome.x + (this.rng() - 0.5) * biome.size;
            const z = biome.z + (this.rng() - 0.5) * biome.size;
            this.createTank(x, z);
        }
        const mapSize = GameConfig.MAP.SIZE;
        const halfSize = mapSize / 2;
        const minDistance = GameConfig.MAP.BUILDINGS.MIN_DISTANCE;
        
        // ビルの生成確率を設定から取得
        const buildingChance = GameConfig.MAP.BUILDINGS.DENSITY;
        
        // ビルを生成
        if (this.rng() < buildingChance) {
            let position;
            let isSafe = false;
            let attempts = 0;
            const maxAttempts = GameConfig.MAP.BUILDINGS.MAX_ATTEMPTS;
            
            while (!isSafe && attempts < maxAttempts) {
                // マップの範囲内でランダムな位置を生成
                position = new THREE.Vector3(
                    (Math.random() - 0.5) * (mapSize - minDistance * 2),
                    0,
                    (Math.random() - 0.5) * (mapSize - minDistance * 2)
                );
                
                // マップの境界からminDistance以上離れていることを確認
                if (Math.abs(position.x) > halfSize - minDistance || 
                    Math.abs(position.z) > halfSize - minDistance) {
                    attempts++;
                    continue;
                }
                
                // 他のオブジェクトとの距離をチェック
                isSafe = true;
                for (const object of this.objects) {
                    if (object.position.distanceTo(position) < minDistance) {
                        isSafe = false;
                        break;
                    }
                }
                
                attempts++;
            }
            
            if (isSafe) {
                const buildingType = this.buildingTypes[Math.floor(Math.random() * this.buildingTypes.length)];
                const height = buildingType.minHeight + this.rng() * (buildingType.maxHeight - buildingType.minHeight);
                const width = 15 + this.rng() * 25;
                this.createBuilding(position, buildingType, height, width);
            }
        }
        
        // 車の生成
        const carChance = 0.3; // 30%の確率で車を生成
        if (this.rng() < carChance) {
            const x = biome.x + (this.rng() - 0.5) * biome.size;
            const z = biome.z + (this.rng() - 0.5) * biome.size;
            this.createCar(x, z, this.rng() * Math.PI * 2);
        }
        
    }
    
    generateBeachObjects(biome) {
        // 砂浜のマテリアルを作成
        const sandMaterial = new THREE.MeshStandardMaterial({
            color: 0xF4A460, // 砂の色
            roughness: 0.9,
            metalness: 0.1
        });

        // 砂浜の平面を作成
        const sandGeometry = new THREE.PlaneGeometry(biome.size, biome.size);
        const sand = new THREE.Mesh(sandGeometry, sandMaterial);
        sand.rotation.x = -Math.PI / 2;
        sand.position.set(biome.x, -0.05, biome.z);
        this.scene.add(sand);
        this.objects.push(sand);

        // ヤシの木を生成
        const palmCount = Math.floor(this.rng() * 3) + 1;
        for (let i = 0; i < palmCount; i++) {
            const x = biome.x + (this.rng() - 0.5) * biome.size;
            const z = biome.z + (this.rng() - 0.5) * biome.size;
            const height = Math.floor(this.rng() * 3) + 5;
            this.createTree(x, z, height, 'palm');
        }

        // 岩を生成
        const rockCount = Math.floor(this.rng() * 4) + 2;
        for (let i = 0; i < rockCount; i++) {
            const x = biome.x + (this.rng() - 0.5) * biome.size;
            const z = biome.z + (this.rng() - 0.5) * biome.size;
            const size = this.rng() * 1.5 + 0.5;
            this.createRock(x, z, size);
        }
    }
    
    createBuilding(position, buildingType, height, width) {
        // 破壊レベルを計算（0-1）
        const destructionLevel = 0.3 + this.rng() * 0.7;
        
        // ビルの基本パラメータ
        const buildingWidth = width || (15 + this.rng() * 25);  // 幅を15-40の範囲に拡大
        const buildingDepth = width || (15 + this.rng() * 25);  // 奥行きも15-40の範囲に拡大
        const buildingHeight = height || (buildingType.minHeight + this.rng() * (buildingType.maxHeight - buildingType.minHeight));
        
        // ビルのジオメトリを作成
        const buildingGeometry = new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth);
        
        // 頂点を変形させて破壊された外観を作成
        const vertices = buildingGeometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            // 底面の頂点は変形させない
            if (vertices[i + 1] > 0.1) {
                vertices[i] += (this.rng() - 0.5) * destructionLevel * 3;  // 変形量を増加
                vertices[i + 1] += (this.rng() - 0.5) * destructionLevel * 3;
                vertices[i + 2] += (this.rng() - 0.5) * destructionLevel * 3;
            }
        }
        
        // 色のバリエーション
        const colorVariation = (this.rng() - 0.5) * 0.2;
        const color = new THREE.Color(buildingType.color);
        color.r += colorVariation;
        color.g += colorVariation;
        color.b += colorVariation;
        
        const buildingMaterial = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.7 + this.rng() * 0.3,
            metalness: 0.1,
            flatShading: true
        });
        
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        
        // ビルの位置を設定
        building.position.set(position.x, buildingHeight / 2, position.z);
        
        // 破壊レベルが高い場合はランダムな回転と傾きを適用
        if (destructionLevel > 0.6) {
            building.rotation.y = this.rng() * Math.PI / 4;
            
            // ビルを傾かせる
            if (this.rng() > 0.5) {
                building.rotation.x = this.rng() * destructionLevel * 0.5;
            } else {
                building.rotation.z = this.rng() * destructionLevel * 0.5;
            }
            
            // 傾いたビルの位置を調整
            building.position.y -= buildingHeight * destructionLevel * 0.3;
        }
        
        // ビルをシーンに追加
        building.userData = { type: 'building', buildingType: buildingType.name };
        building.castShadow = true;
        building.receiveShadow = true;
        this.scene.add(building);
        this.objects.push(building);
        
        // 壊れた窓を追加
        this.createBrokenWindows(building, buildingWidth, buildingHeight, buildingDepth);
        
        // 破壊レベルが高い場合は周囲にがれきを追加
        if (destructionLevel > 0.5) {
            for (let i = 0; i < destructionLevel * 15; i++) {  // がれきの数を増加
                const debrisX = position.x + (this.rng() - 0.5) * buildingWidth * 3;  // がれきの範囲を拡大
                const debrisZ = position.z + (this.rng() - 0.5) * buildingDepth * 3;
                this.createDebris(debrisX, debrisZ);
            }
        }

        // 建物の上部に破壊された部分を追加
        if (destructionLevel > 0.4) {
            this.createDestroyedTop(building, buildingWidth, buildingHeight, buildingDepth, destructionLevel);
        }

        // 建物の壁に亀裂を追加
        if (destructionLevel > 0.3) {
            this.createCracks(building, buildingWidth, buildingHeight, buildingDepth, destructionLevel);
        }

        // 建物の周りに崩れた壁の破片を追加
        if (destructionLevel > 0.6) {
            this.createCollapsedWalls(building, buildingWidth, buildingHeight, buildingDepth, destructionLevel);
        }
    }
    
    createBrokenWindows(building, width, height, depth) {
        // ビルに窓のパターンを作成
        const windowSize = 1;
        const windowSpacing = 3;
        
        // 各面の窓の数を計算
        const widthCount = Math.floor(width / windowSpacing);
        const heightCount = Math.floor(height / windowSpacing);
        const depthCount = Math.floor(depth / windowSpacing);
        
        const windowGeometry = new THREE.PlaneGeometry(windowSize, windowSize);
        
        // 前面と背面の窓を作成
        for (let y = 1; y < heightCount; y++) {
            for (let x = 0; x < widthCount; x++) {
                if (this.rng() > 0.3) { // 70%の確率で窓を作成
                    const windowMaterial = new THREE.MeshStandardMaterial({
                        color: this.rng() > 0.5 ? 0x000000 : 0xCCCCFF, // 壊れた窓または無傷の窓
                        roughness: 0.3,
                        metalness: 0.8,
                        transparent: true,
                        opacity: 0.7
                    });
                    
                    // 前面の窓
                    const frontWindow = new THREE.Mesh(windowGeometry, windowMaterial);
                    frontWindow.position.set(
                        (x * windowSpacing) - (width / 2) + (windowSpacing / 2),
                        (y * windowSpacing) - (height / 2) + (windowSpacing / 2),
                        depth / 2 + 0.1
                    );
                    building.add(frontWindow);
                    
                    // 背面の窓
                    const backWindow = new THREE.Mesh(windowGeometry, windowMaterial);
                    backWindow.position.set(
                        (x * windowSpacing) - (width / 2) + (windowSpacing / 2),
                        (y * windowSpacing) - (height / 2) + (windowSpacing / 2),
                        -depth / 2 - 0.1
                    );
                    backWindow.rotation.y = Math.PI;
                    building.add(backWindow);
                }
            }
        }
        
        // 側面の窓を作成
        for (let y = 1; y < heightCount; y++) {
            for (let z = 0; z < depthCount; z++) {
                if (this.rng() > 0.3) { // 70%の確率で窓を作成
                    const windowMaterial = new THREE.MeshStandardMaterial({
                        color: this.rng() > 0.5 ? 0x000000 : 0xCCCCFF, // 壊れた窓または無傷の窓
                        roughness: 0.3,
                        metalness: 0.8,
                        transparent: true,
                        opacity: 0.7
                    });
                    
                    // 左側の窓
                    const leftWindow = new THREE.Mesh(windowGeometry, windowMaterial);
                    leftWindow.position.set(
                        -width / 2 - 0.1,
                        (y * windowSpacing) - (height / 2) + (windowSpacing / 2),
                        (z * windowSpacing) - (depth / 2) + (windowSpacing / 2)
                    );
                    leftWindow.rotation.y = -Math.PI / 2;
                    building.add(leftWindow);
                    
                    // 右側の窓
                    const rightWindow = new THREE.Mesh(windowGeometry, windowMaterial);
                    rightWindow.position.set(
                        width / 2 + 0.1,
                        (y * windowSpacing) - (height / 2) + (windowSpacing / 2),
                        (z * windowSpacing) - (depth / 2) + (windowSpacing / 2)
                    );
                    rightWindow.rotation.y = Math.PI / 2;
                    building.add(rightWindow);
                }
            }
        }
    }
    
    createCar(x, z, rotation) {
        const carGroup = new THREE.Group();
        carGroup.position.set(x, 0, z);
        carGroup.rotation.y = rotation;

        // 車体の色をランダムに設定
        const carColors = [
            0x000000, // 黒
            0xFFFFFF, // 白
            0xFF0000, // 赤
            0x0000FF, // 青
            0x808080  // グレー
        ];
        const carColor = carColors[Math.floor(Math.random() * carColors.length)];

        // 車体の基本形状
        const bodyGeometry = new THREE.BoxGeometry(4, 1.5, 2);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: carColor,
            metalness: 0.8,
            roughness: 0.2
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.75;
        carGroup.add(body);

        // フロントガラス
        const windshieldGeometry = new THREE.BoxGeometry(1.2, 1, 2.1);
        const glassMaterial = new THREE.MeshStandardMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.6,
            metalness: 0.9,
            roughness: 0.1
        });
        const windshield = new THREE.Mesh(windshieldGeometry, glassMaterial);
        windshield.position.set(1.2, 1.5, 0);
        windshield.rotation.x = Math.PI / 6;
        carGroup.add(windshield);

        // リアガラス
        const rearWindowGeometry = new THREE.BoxGeometry(1.2, 1, 2.1);
        const rearWindow = new THREE.Mesh(rearWindowGeometry, glassMaterial);
        rearWindow.position.set(-1.2, 1.5, 0);
        rearWindow.rotation.x = -Math.PI / 6;
        carGroup.add(rearWindow);

        // タイヤ
        const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
        const wheelMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            metalness: 0.5,
            roughness: 0.7
        });

        // フロントタイヤ
        const frontLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        frontLeftWheel.rotation.z = Math.PI / 2;
        frontLeftWheel.position.set(1.2, 0.4, 1.1);
        carGroup.add(frontLeftWheel);

        const frontRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        frontRightWheel.rotation.z = Math.PI / 2;
        frontRightWheel.position.set(1.2, 0.4, -1.1);
        carGroup.add(frontRightWheel);

        // リアタイヤ
        const rearLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        rearLeftWheel.rotation.z = Math.PI / 2;
        rearLeftWheel.position.set(-1.2, 0.4, 1.1);
        carGroup.add(rearLeftWheel);

        const rearRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        rearRightWheel.rotation.z = Math.PI / 2;
        rearRightWheel.position.set(-1.2, 0.4, -1.1);
        carGroup.add(rearRightWheel);

        // ヘッドライト
        const headlightGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const headlightMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffcc,
            emissive: 0xffffcc,
            emissiveIntensity: 0.5
        });

        const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        leftHeadlight.position.set(2, 0.8, 0.6);
        carGroup.add(leftHeadlight);

        const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        rightHeadlight.position.set(2, 0.8, -0.6);
        carGroup.add(rightHeadlight);

        // テールライト
        const taillightGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const taillightMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.5
        });

        const leftTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
        leftTaillight.position.set(-2, 0.8, 0.6);
        carGroup.add(leftTaillight);

        const rightTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
        rightTaillight.position.set(-2, 0.8, -0.6);
        carGroup.add(rightTaillight);

        // バンパー
        const bumperGeometry = new THREE.BoxGeometry(0.3, 0.4, 2.2);
        const bumperMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            metalness: 0.5,
            roughness: 0.7
        });

        const frontBumper = new THREE.Mesh(bumperGeometry, bumperMaterial);
        frontBumper.position.set(2.15, 0.2, 0);
        carGroup.add(frontBumper);

        const rearBumper = new THREE.Mesh(bumperGeometry, bumperMaterial);
        rearBumper.position.set(-2.15, 0.2, 0);
        carGroup.add(rearBumper);

        // ドアハンドル
        const handleGeometry = new THREE.BoxGeometry(0.1, 0.2, 0.4);
        const handleMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x888888,
            metalness: 0.9,
            roughness: 0.1
        });

        const leftHandle = new THREE.Mesh(handleGeometry, handleMaterial);
        leftHandle.position.set(0, 1, 1.05);
        carGroup.add(leftHandle);

        const rightHandle = new THREE.Mesh(handleGeometry, handleMaterial);
        rightHandle.position.set(0, 1, -1.05);
        carGroup.add(rightHandle);

        // ミラー
        const mirrorGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.5);
        const mirrorMaterial = new THREE.MeshStandardMaterial({ 
            color: carColor,
            metalness: 0.8,
            roughness: 0.2
        });

        const leftMirror = new THREE.Mesh(mirrorGeometry, mirrorMaterial);
        leftMirror.position.set(1.8, 1.2, 1.1);
        carGroup.add(leftMirror);

        const rightMirror = new THREE.Mesh(mirrorGeometry, mirrorMaterial);
        rightMirror.position.set(1.8, 1.2, -1.1);
        carGroup.add(rightMirror);

        // アンテナ
        const antennaGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8);
        const antennaMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            metalness: 0.8,
            roughness: 0.2
        });
        const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
        antenna.position.set(-1, 2, 0);
        carGroup.add(antenna);

        // 車の下に影を追加
        const shadowGeometry = new THREE.PlaneGeometry(4.5, 2.5);
        const shadowMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.3
        });
        const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.y = 0.01;
        carGroup.add(shadow);

        return carGroup;
    }
    
    createTree(x, z, height, specifiedType = null) {
        const treeGroup = new THREE.Group();
        treeGroup.position.set(x, 0, z);

        // 指定された木の種類を使用するか、ランダムに選択
        const treeType = specifiedType ? 
            this.treeTypes.find(type => type.name === specifiedType) : 
            this.treeTypes[Math.floor(this.rng() * this.treeTypes.length)];
        
        const trunkHeight = height * treeType.trunkHeight;
        const leavesHeight = height * (1 - treeType.trunkHeight);
        
        // 幹の作成（より自然な形状）
        const trunkGeometry = new THREE.CylinderGeometry(
            treeType.trunkWidth * 0.3, 
            treeType.trunkWidth, 
            trunkHeight, 
            8
        );
        
        // 幹を不規則に変形
        const vertices = trunkGeometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            if (vertices[i + 1] > 0.1) { // 幹の上部のみ変形
                vertices[i] += (this.rng() - 0.5) * 0.2;
                vertices[i + 2] += (this.rng() - 0.5) * 0.2;
            }
        }
        
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: treeType.trunkColor,
            roughness: 0.9,
            metalness: 0.1
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = trunkHeight/2;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        treeGroup.add(trunk);
        
        // 木の種類に応じた葉の作成
        switch(treeType.name) {
            case 'pine':
                // 松の木は複数の円錐を重ねる
                for (let i = 0; i < 3; i++) {
                    const coneGeometry = new THREE.ConeGeometry(
                        treeType.leavesSize * (1 - i * 0.2),
                        leavesHeight * 0.4,
                        8
                    );
                    const leavesMaterial = new THREE.MeshStandardMaterial({
                        color: treeType.leavesColor,
                        roughness: 0.8,
                        metalness: 0.1
                    });
                    const leaves = new THREE.Mesh(coneGeometry, leavesMaterial);
                    leaves.position.y = trunkHeight + leavesHeight * 0.3 * i;
                    leaves.castShadow = true;
                    leaves.receiveShadow = true;
                    treeGroup.add(leaves);
                }
                break;
                
            case 'oak':
                // オークは複数の球体を組み合わせる
                const mainLeavesGeometry = new THREE.SphereGeometry(treeType.leavesSize, 8, 8);
                const leavesMaterial = new THREE.MeshStandardMaterial({
                    color: treeType.leavesColor,
                    roughness: 0.8,
                    metalness: 0.1
                });
                const mainLeaves = new THREE.Mesh(mainLeavesGeometry, leavesMaterial);
                mainLeaves.position.y = trunkHeight + leavesHeight * 0.6;
                mainLeaves.castShadow = true;
                mainLeaves.receiveShadow = true;
                treeGroup.add(mainLeaves);
                
                // 追加の葉の塊
                for (let i = 0; i < 3; i++) {
                    const subLeavesGeometry = new THREE.SphereGeometry(
                        treeType.leavesSize * 0.7,
                        8,
                        8
                    );
                    const subLeaves = new THREE.Mesh(subLeavesGeometry, leavesMaterial);
                    const angle = (i * Math.PI * 2) / 3;
                    subLeaves.position.set(
                        Math.cos(angle) * treeType.leavesSize * 0.5,
                        trunkHeight + leavesHeight * 0.4,
                        Math.sin(angle) * treeType.leavesSize * 0.5
                    );
                    subLeaves.castShadow = true;
                    subLeaves.receiveShadow = true;
                    treeGroup.add(subLeaves);
                }
                break;
                
            case 'palm':
                // ヤシの木は葉を放射状に配置
                const trunkTop = trunkHeight + 0.5;
                for (let i = 0; i < 8; i++) {
                    const leafGeometry = new THREE.PlaneGeometry(2, 4);
                    const leafMaterial = new THREE.MeshStandardMaterial({
                        color: treeType.leavesColor,
                        roughness: 0.8,
                        metalness: 0.1,
                        side: THREE.DoubleSide
                    });
                    const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
                    const angle = (i * Math.PI * 2) / 8;
                    leaf.position.set(
                        Math.cos(angle) * 1,
                        trunkTop,
                        Math.sin(angle) * 1
                    );
                    leaf.rotation.y = angle;
                    leaf.rotation.x = Math.PI / 4;
                    leaf.castShadow = true;
                    leaf.receiveShadow = true;
                    treeGroup.add(leaf);
                }
                break;
                
            default:
                // その他の木は基本的な形状
                const defaultLeavesGeometry = new THREE.SphereGeometry(treeType.leavesSize, 8, 8);
                const defaultLeavesMaterial = new THREE.MeshStandardMaterial({
                    color: treeType.leavesColor,
                    roughness: 0.8,
                    metalness: 0.1
                });
                const defaultLeaves = new THREE.Mesh(defaultLeavesGeometry, defaultLeavesMaterial);
                defaultLeaves.position.y = trunkHeight + leavesHeight * 0.6;
                defaultLeaves.castShadow = true;
                defaultLeaves.receiveShadow = true;
                treeGroup.add(defaultLeaves);
        }
        
        // 木の下に影を追加
        const shadowGeometry = new THREE.PlaneGeometry(treeType.leavesSize * 2, treeType.leavesSize * 2);
        const shadowMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.3
        });
        const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.y = 0.01;
        treeGroup.add(shadow);
        
        this.scene.add(treeGroup);
        this.objects.push(treeGroup);
    }
    
    createRock(x, z, size) {
        const rockGroup = new THREE.Group();
        rockGroup.position.set(x, 0, z);

        const rockType = this.rockTypes[Math.floor(this.rng() * this.rockTypes.length)];
        const rockSize = size * rockType.size;
        
        // メインの岩の形状をランダムに選択
        let mainRockGeometry;
        const geometryType = Math.floor(this.rng() * 3);
        switch(geometryType) {
            case 0:
                mainRockGeometry = new THREE.DodecahedronGeometry(rockSize, 1);
                break;
            case 1:
                mainRockGeometry = new THREE.IcosahedronGeometry(rockSize, 1);
                break;
            case 2:
                mainRockGeometry = new THREE.OctahedronGeometry(rockSize, 1);
                break;
        }
        
        // 頂点を変形させて自然な形状を作成
        const vertices = mainRockGeometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            vertices[i] += (this.rng() - 0.5) * 0.3;
            vertices[i + 1] += (this.rng() - 0.5) * 0.3;
            vertices[i + 2] += (this.rng() - 0.5) * 0.3;
        }
        
        // 岩のマテリアルを作成
        const rockMaterial = new THREE.MeshStandardMaterial({
            color: rockType.color,
            roughness: rockType.roughness,
            metalness: 0.1,
            flatShading: true
        });
        
        // メインの岩を作成
        const mainRock = new THREE.Mesh(mainRockGeometry, rockMaterial);
        mainRock.position.y = rockSize/2;
        mainRock.castShadow = true;
        mainRock.receiveShadow = true;
        rockGroup.add(mainRock);
        
        // 小さな岩を追加して自然な見た目に
        const smallRockCount = Math.floor(this.rng() * 3) + 2;
        for (let i = 0; i < smallRockCount; i++) {
            const smallRockSize = rockSize * (0.2 + this.rng() * 0.3);
            const smallRockGeometry = new THREE.DodecahedronGeometry(smallRockSize, 0);
            
            // 小さな岩の頂点を変形
            const smallVertices = smallRockGeometry.attributes.position.array;
            for (let j = 0; j < smallVertices.length; j += 3) {
                smallVertices[j] += (this.rng() - 0.5) * 0.2;
                smallVertices[j + 1] += (this.rng() - 0.5) * 0.2;
                smallVertices[j + 2] += (this.rng() - 0.5) * 0.2;
            }
            
            const smallRock = new THREE.Mesh(smallRockGeometry, rockMaterial);
            
            // 小さな岩の位置をランダムに設定
            const angle = this.rng() * Math.PI * 2;
            const distance = rockSize * (0.5 + this.rng() * 0.5);
            smallRock.position.set(
                Math.cos(angle) * distance,
                smallRockSize/2,
                Math.sin(angle) * distance
            );
            
            // ランダムな回転
            smallRock.rotation.set(
                this.rng() * Math.PI,
                this.rng() * Math.PI,
                this.rng() * Math.PI
            );
            
            smallRock.castShadow = true;
            smallRock.receiveShadow = true;
            rockGroup.add(smallRock);
        }
        
        // 岩の下に影を追加
        const shadowGeometry = new THREE.PlaneGeometry(rockSize * 2, rockSize * 2);
        const shadowMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.3
        });
        const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.y = 0.01;
        rockGroup.add(shadow);
        
        // 岩のグループ全体をランダムに回転
        rockGroup.rotation.y = this.rng() * Math.PI * 2;
        
        this.scene.add(rockGroup);
        this.objects.push(rockGroup);
    }
    
    createRuins(x, z, height) {
        const geometry = new THREE.BoxGeometry(5, height, 5);
        const material = new THREE.MeshStandardMaterial({
            color: 0xA0522D,
            roughness: 0.8,
            metalness: 0.2
        });
        const ruins = new THREE.Mesh(geometry, material);
        ruins.position.set(x, height/2, z);
        ruins.rotation.y = this.rng() * Math.PI * 2;
        ruins.castShadow = true;
        ruins.receiveShadow = true;
        this.scene.add(ruins);
        this.objects.push(ruins);
    }
    
    createDebris(x, z) {
        const debrisGroup = new THREE.Group();
        debrisGroup.position.set(x, 0, z);

        const debrisType = this.debrisTypes[Math.floor(this.rng() * this.debrisTypes.length)];
        
        // メインのがれきのサイズ
        const mainSize = debrisType.size * (0.5 + this.rng());
        
        // がれきの種類に応じた形状とマテリアルを設定
        let mainDebrisGeometry;
        let mainDebrisMaterial;
        
        switch (debrisType.name) {
            case 'concrete':
                // コンクリートは不規則な塊
                mainDebrisGeometry = new THREE.DodecahedronGeometry(mainSize, 1);
                mainDebrisMaterial = new THREE.MeshStandardMaterial({
                    color: debrisType.color,
                    roughness: 0.9,
                    metalness: 0.1,
                    flatShading: true
                });
                break;
                
            case 'metal':
                // 金属は板状またはパイプ状
                if (this.rng() > 0.5) {
                    mainDebrisGeometry = new THREE.BoxGeometry(mainSize, mainSize * 0.1, mainSize * 0.8);
                } else {
                    mainDebrisGeometry = new THREE.CylinderGeometry(mainSize * 0.2, mainSize * 0.2, mainSize * 2, 8);
                }
                mainDebrisMaterial = new THREE.MeshStandardMaterial({
                    color: debrisType.color,
                    roughness: 0.5,
                    metalness: 0.8
                });
                break;
                
            case 'glass':
                // ガラスは鋭い破片
                mainDebrisGeometry = new THREE.TetrahedronGeometry(mainSize);
                mainDebrisMaterial = new THREE.MeshStandardMaterial({
                    color: debrisType.color,
                    roughness: 0.1,
                    metalness: 0.9,
                    transparent: true,
                    opacity: 0.7
                });
                break;
                
            case 'wood':
                // 木材は細長い形状
                mainDebrisGeometry = new THREE.BoxGeometry(mainSize * 0.2, mainSize * 0.2, mainSize * 2);
                mainDebrisMaterial = new THREE.MeshStandardMaterial({
                    color: debrisType.color,
                    roughness: 0.8,
                    metalness: 0.1
                });
                break;
                
            default:
                // その他は不規則な形状
                mainDebrisGeometry = new THREE.DodecahedronGeometry(mainSize, 0);
                mainDebrisMaterial = new THREE.MeshStandardMaterial({
                    color: debrisType.color,
                    roughness: 0.7,
                    metalness: 0.2
                });
        }
        
        // メインのがれきを作成
        const mainDebris = new THREE.Mesh(mainDebrisGeometry, mainDebrisMaterial);
        
        // 頂点を変形させて不規則な形状に
        const vertices = mainDebrisGeometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            vertices[i] += (this.rng() - 0.5) * 0.3;
            vertices[i + 1] += (this.rng() - 0.5) * 0.3;
            vertices[i + 2] += (this.rng() - 0.5) * 0.3;
        }
        
        // メインのがれきを配置
        mainDebris.position.y = mainSize / 2;
        mainDebris.rotation.set(
            this.rng() * Math.PI,
            this.rng() * Math.PI,
            this.rng() * Math.PI
        );
        mainDebris.castShadow = true;
        mainDebris.receiveShadow = true;
        debrisGroup.add(mainDebris);
        
        // 小さな破片を追加
        const smallDebrisCount = Math.floor(this.rng() * 5) + 3; // 3-7個の小さな破片
        for (let i = 0; i < smallDebrisCount; i++) {
            const smallSize = mainSize * (0.1 + this.rng() * 0.3);
            let smallDebrisGeometry;
            
            // 小さな破片の形状をランダムに選択
            const geometryType = Math.floor(this.rng() * 3);
            switch (geometryType) {
                case 0:
                    smallDebrisGeometry = new THREE.TetrahedronGeometry(smallSize);
                    break;
                case 1:
                    smallDebrisGeometry = new THREE.BoxGeometry(smallSize, smallSize * 0.1, smallSize);
                    break;
                case 2:
                    smallDebrisGeometry = new THREE.SphereGeometry(smallSize, 4, 4);
                    break;
            }
            
            const smallDebris = new THREE.Mesh(smallDebrisGeometry, mainDebrisMaterial);
            
            // 小さな破片の位置をランダムに設定
            const angle = this.rng() * Math.PI * 2;
            const distance = mainSize * (0.5 + this.rng() * 0.5);
            smallDebris.position.set(
                Math.cos(angle) * distance,
                smallSize / 2,
                Math.sin(angle) * distance
            );
            
            // ランダムな回転
            smallDebris.rotation.set(
                this.rng() * Math.PI,
                this.rng() * Math.PI,
                this.rng() * Math.PI
            );
            
            smallDebris.castShadow = true;
            smallDebris.receiveShadow = true;
            debrisGroup.add(smallDebris);
        }
        
        // がれきの下に影を追加
        const shadowGeometry = new THREE.PlaneGeometry(mainSize * 2, mainSize * 2);
        const shadowMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.3
        });
        const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.y = 0.01;
        debrisGroup.add(shadow);
        
        // がれきのグループ全体をランダムに回転
        debrisGroup.rotation.y = this.rng() * Math.PI * 2;
        
        this.scene.add(debrisGroup);
        this.objects.push(debrisGroup);
    }
    
    createFactory(x, z, height) {
        const geometry = new THREE.BoxGeometry(10, height, 15);
        const material = new THREE.MeshStandardMaterial({
            color: 0x696969,
            roughness: 0.6,
            metalness: 0.4
        });
        const factory = new THREE.Mesh(geometry, material);
        factory.position.set(x, height/2, z);
        factory.castShadow = true;
        factory.receiveShadow = true;
        this.scene.add(factory);
        this.objects.push(factory);
    }
    
    createTank(x, z) {
        const geometry = new THREE.CylinderGeometry(1, 1, 3, 8);
        const material = new THREE.MeshStandardMaterial({
            color: 0x556B2F,
            roughness: 0.5,
            metalness: 0.5
        });
        const tank = new THREE.Mesh(geometry, material);
        tank.position.set(x, 1.5, z);
        tank.rotation.x = Math.PI / 2;
        tank.castShadow = true;
        tank.receiveShadow = true;
        this.scene.add(tank);
        this.objects.push(tank);
    }
    
    createBoundaryWalls() {
        const wallHeight = 0;
        const wallThickness = 1;
        
        // 北の壁
        this.createWall(0, wallHeight/2, -this.mapSize/2, this.mapSize, wallThickness, wallHeight);
        // 南の壁
        this.createWall(0, wallHeight/2, this.mapSize/2, this.mapSize, wallThickness, wallHeight);
        // 東の壁
        this.createWall(this.mapSize/2, wallHeight/2, 0, wallThickness, this.mapSize, wallHeight);
        // 西の壁
        this.createWall(-this.mapSize/2, wallHeight/2, 0, wallThickness, this.mapSize, wallHeight);

        // 海の作成
        this.createOcean();
    }
    
    createWall(x, y, z, width, depth, height) {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.8,
            metalness: 0.2
        });
        const wall = new THREE.Mesh(geometry, material);
        wall.position.set(x, y, z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        this.scene.add(wall);
        this.objects.push(wall);
    }
    
    createOcean() {
        // 海の平面を作成（マップの2倍の大きさ）
        const oceanSize = this.mapSize * 2;
        const oceanGeometry = new THREE.PlaneGeometry(oceanSize, oceanSize, 100, 100);
        
        // 海のマテリアルを作成
        const oceanMaterial = new THREE.MeshStandardMaterial({
            color: 0x0077be, // 海の色
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide // 両面を表示
        });
        
        // 海のメッシュを作成
        const ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
        ocean.rotation.x = -Math.PI / 2; // 平面を水平に
        ocean.position.y = -0.1; // 地面より少し下に配置
        
        // 波のアニメーション用の頂点を取得
        const positions = oceanGeometry.attributes.position.array;
        const originalPositions = new Float32Array(positions);
        
        // アニメーション関数を定義
        const animateOcean = () => {
            const time = Date.now() * 0.001; // 秒単位の時間
            
            for (let i = 0; i < positions.length; i += 3) {
                const x = originalPositions[i];
                const z = originalPositions[i + 2];
                
                // 複雑な波のパターンを計算
                const distance = Math.sqrt(x * x + z * z);
                const angle = Math.atan2(z, x);
                
                // 主な波の動き
                const mainWave = Math.sin(distance * 0.1 - time * 2) * 0.3;
                
                // 二次的な波の動き
                const secondaryWave = Math.sin(distance * 0.2 + time) * 0.15;
                
                // 方向性のある波
                const directionalWave = Math.sin(angle * 3 + time * 1.5) * 0.2;
                
                // 小さな波紋
                const ripple = Math.sin(distance * 0.5 - time * 3) * 0.1;
                
                // すべての波を組み合わせる
                const waveHeight = mainWave + secondaryWave + directionalWave + ripple;
                
                // 波の高さを適用
                positions[i + 1] = waveHeight;
            }
            
            oceanGeometry.attributes.position.needsUpdate = true;
            oceanGeometry.computeVertexNormals();
            requestAnimationFrame(animateOcean);
        };
        
        // アニメーションを開始
        //animateOcean();
        
        // 海をシーンに追加
        this.scene.add(ocean);
        this.objects.push(ocean);
    }
    
    getBiomeAt(x, z) {
        // 最も近いバイオームを返す
        let closestBiome = null;
        let minDistance = Infinity;
        
        this.biomes.forEach(biome => {
            const dx = x - biome.x;
            const dz = z - biome.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance < minDistance) {
                minDistance = distance;
                closestBiome = biome;
            }
        });
        
        return closestBiome;
    }
    
    getSafeSpawnPosition() {
        const mapSize = GameConfig.MAP.SIZE;
        const halfSize = mapSize / 2;
        const minDistance = 20; // 他のオブジェクトからの最小距離
        
        let position;
        let isSafe = false;
        let attempts = 0;
        const maxAttempts = 100;
        
        while (!isSafe && attempts < maxAttempts) {
            // マップの範囲内でランダムな位置を生成
            position = new THREE.Vector3(
                (Math.random() - 0.5) * (mapSize - minDistance * 2),
                0,
                (Math.random() - 0.5) * (mapSize - minDistance * 2)
            );
            
            // マップの境界からminDistance以上離れていることを確認
            if (Math.abs(position.x) > halfSize - minDistance || 
                Math.abs(position.z) > halfSize - minDistance) {
                attempts++;
                continue;
            }
            
            // 他のオブジェクトとの距離をチェック
            isSafe = true;
            for (const object of this.objects) {
                if (object.position.distanceTo(position) < minDistance) {
                    isSafe = false;
                    break;
                }
            }
            
            attempts++;
        }
        
        return position;
    }
    
    checkCollision(position, radius) {
        // 境界壁との衝突判定
        if (Math.abs(position.x) > this.mapSize/2 - radius ||
            Math.abs(position.z) > this.mapSize/2 - radius) {
            return true;
        }
        
        // オブジェクトとの衝突判定
        for (const object of this.objects) {
            const dx = position.x - object.position.x;
            const dz = position.z - object.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance < radius + 1) {
                return true;
            }
        }
        
        return false;
    }

    createDestroyedTop(building, width, height, depth, destructionLevel) {
        const topGeometry = new THREE.BoxGeometry(width * 0.8, height * 0.2, depth * 0.8);
        const topMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            roughness: 0.9,
            metalness: 0.1,
            flatShading: true
        });

        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.y = height * 0.4;
        
        // 上部を不規則に変形
        const vertices = topGeometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            vertices[i] += (this.rng() - 0.5) * destructionLevel * 3;
            vertices[i + 1] += (this.rng() - 0.5) * destructionLevel * 3;
            vertices[i + 2] += (this.rng() - 0.5) * destructionLevel * 3;
        }

        building.add(top);
    }

    createCracks(building, width, height, depth, destructionLevel) {
        const crackCount = Math.floor(destructionLevel * 10);
        
        for (let i = 0; i < crackCount; i++) {
            const crackGeometry = new THREE.PlaneGeometry(2, height * 0.3);
            const crackMaterial = new THREE.MeshStandardMaterial({
                color: 0x333333,
                roughness: 0.8,
                metalness: 0.2,
                side: THREE.DoubleSide
            });

            const crack = new THREE.Mesh(crackGeometry, crackMaterial);
            
            // ランダムな位置に亀裂を配置
            const side = Math.floor(this.rng() * 4);
            const offset = (this.rng() - 0.5) * (width * 0.8);
            
            switch(side) {
                case 0: // 前面
                    crack.position.set(offset, height * 0.3, depth/2 + 0.1);
                    break;
                case 1: // 背面
                    crack.position.set(offset, height * 0.3, -depth/2 - 0.1);
                    crack.rotation.y = Math.PI;
                    break;
                case 2: // 左面
                    crack.position.set(-width/2 - 0.1, height * 0.3, offset);
                    crack.rotation.y = -Math.PI/2;
                    break;
                case 3: // 右面
                    crack.position.set(width/2 + 0.1, height * 0.3, offset);
                    crack.rotation.y = Math.PI/2;
                    break;
            }

            // 亀裂を不規則に変形
            const vertices = crackGeometry.attributes.position.array;
            for (let j = 0; j < vertices.length; j += 3) {
                vertices[j] += (this.rng() - 0.5) * 0.5;
                vertices[j + 1] += (this.rng() - 0.5) * 0.5;
            }

            building.add(crack);
        }
    }

    createCollapsedWalls(building, width, height, depth, destructionLevel) {
        const wallCount = Math.floor(destructionLevel * 5);
        
        for (let i = 0; i < wallCount; i++) {
            const wallGeometry = new THREE.BoxGeometry(width * 0.3, height * 0.2, 0.5);
            const wallMaterial = new THREE.MeshStandardMaterial({
                color: 0x888888,
                roughness: 0.8,
                metalness: 0.2
            });

            const wall = new THREE.Mesh(wallGeometry, wallMaterial);
            
            // ランダムな位置に崩れた壁を配置
            const angle = this.rng() * Math.PI * 2;
            const distance = (this.rng() * 0.5 + 0.5) * width;
            
            wall.position.set(
                Math.cos(angle) * distance,
                height * 0.1,
                Math.sin(angle) * distance
            );
            
            // ランダムな回転
            wall.rotation.x = this.rng() * Math.PI * 0.5;
            wall.rotation.y = angle;
            wall.rotation.z = this.rng() * Math.PI * 0.5;

            building.add(wall);
        }
    }
} 