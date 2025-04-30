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
        
        // バイオームの配置を決定
        for (let x = -this.mapSize/2; x < this.mapSize/2; x += 50) {
            for (let z = -this.mapSize/2; z < this.mapSize/2; z += 50) {
                const noise = this.rng();
                const biomeType = biomeTypes[Math.floor(noise * biomeTypes.length)];
                
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
        for (const biome of this.biomes) {
            // がれきの生成確率を増加
            const debrisChance = 0.3; // 30%の確率でがれきを生成
            
            // がれきを生成
            if (this.rng() < debrisChance) {
                const x = biome.x + (this.rng() - 0.5) * biome.size;
                const z = biome.z + (this.rng() - 0.5) * biome.size;
                this.createDebris(x, z);
            }
            
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
            }
        }
    }
    
    generateUrbanObjects(biome) {
        // ビルの生成確率を増加
        const buildingChance = 0.7; // 70%の確率でビルを生成
        
        // ビルを生成
        if (this.rng() < buildingChance) {
            const x = biome.x + (this.rng() - 0.5) * biome.size;
            const z = biome.z + (this.rng() - 0.5) * biome.size;
            const buildingType = this.buildingTypes[Math.floor(this.rng() * this.buildingTypes.length)];
            const height = buildingType.minHeight + this.rng() * (buildingType.maxHeight - buildingType.minHeight);
            const width = 5 + this.rng() * 15;
            this.createBuilding(x, z, width, height);
        }
        
        // 車の生成
        const carChance = 0.3; // 30%の確率で車を生成
        if (this.rng() < carChance) {
            const x = biome.x + (this.rng() - 0.5) * biome.size;
            const z = biome.z + (this.rng() - 0.5) * biome.size;
            this.createCar(x, z);
        }
    }
    
    generateForestObjects(biome) {
        // 木の生成
        const treeCount = Math.floor(this.rng() * 10) + 5;
        for (let i = 0; i < treeCount; i++) {
            const x = biome.x + (this.rng() - 0.5) * biome.size;
            const z = biome.z + (this.rng() - 0.5) * biome.size;
            const height = Math.floor(this.rng() * 5) + 3;
            this.createTree(x, z, height);
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
    }
    
    createBuilding(x, z, width, height) {
        // ビルタイプをランダムに選択
        const buildingType = this.buildingTypes[Math.floor(this.rng() * this.buildingTypes.length)];
        
        // ビルの基本パラメータ
        const buildingWidth = width || (5 + this.rng() * 15);
        const buildingDepth = width || (5 + this.rng() * 15);
        const buildingHeight = height || (buildingType.minHeight + this.rng() * (buildingType.maxHeight - buildingType.minHeight));
        
        // 破壊レベルを計算（0-1）
        const destructionLevel = 0.3 + this.rng() * 0.7;
        
        // ビルのジオメトリを作成
        const buildingGeometry = new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth);
        
        // 頂点を変形させて破壊された外観を作成
        const vertices = buildingGeometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            // 底面の頂点は変形させない
            if (vertices[i + 1] > 0.1) {
                vertices[i] += (this.rng() - 0.5) * destructionLevel * 2;
                vertices[i + 1] += (this.rng() - 0.5) * destructionLevel * 2;
                vertices[i + 2] += (this.rng() - 0.5) * destructionLevel * 2;
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
        building.position.set(x, buildingHeight / 2, z);
        
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
            for (let i = 0; i < destructionLevel * 10; i++) {
                const debrisX = x + (this.rng() - 0.5) * buildingWidth * 2;
                const debrisZ = z + (this.rng() - 0.5) * buildingDepth * 2;
                this.createDebris(debrisX, debrisZ);
            }
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
    
    createCar(x, z) {
        const geometry = new THREE.BoxGeometry(2, 1, 4);
        const material = new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.5,
            metalness: 0.7
        });
        const car = new THREE.Mesh(geometry, material);
        car.position.set(x, 0.5, z);
        car.rotation.y = this.rng() * Math.PI * 2;
        car.castShadow = true;
        car.receiveShadow = true;
        this.scene.add(car);
        this.objects.push(car);
    }
    
    createTree(x, z, height) {
        const treeType = this.treeTypes[Math.floor(this.rng() * this.treeTypes.length)];
        const trunkHeight = height * treeType.trunkHeight;
        const leavesHeight = height * (1 - treeType.trunkHeight);
        
        // 幹の作成
        const trunkGeometry = new THREE.CylinderGeometry(
            treeType.trunkWidth * 0.3, 
            treeType.trunkWidth, 
            trunkHeight, 
            8
        );
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: treeType.trunkColor,
            roughness: 0.9,
            metalness: 0.1
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, trunkHeight/2, z);
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        
        // 葉の作成（木の種類に応じて異なる形状）
        let leavesGeometry;
        switch(treeType.name) {
            case 'pine':
                leavesGeometry = new THREE.ConeGeometry(treeType.leavesSize, leavesHeight, 8);
                break;
            case 'oak':
                leavesGeometry = new THREE.SphereGeometry(treeType.leavesSize, 8, 8);
                break;
            case 'birch':
                leavesGeometry = new THREE.ConeGeometry(treeType.leavesSize, leavesHeight, 8);
                break;
            case 'maple':
                leavesGeometry = new THREE.SphereGeometry(treeType.leavesSize, 8, 8);
                break;
            case 'willow':
                leavesGeometry = new THREE.ConeGeometry(treeType.leavesSize, leavesHeight, 8);
                break;
            case 'palm':
                leavesGeometry = new THREE.ConeGeometry(treeType.leavesSize, leavesHeight, 8);
                break;
            case 'cherry':
                leavesGeometry = new THREE.SphereGeometry(treeType.leavesSize, 8, 8);
                break;
            case 'cypress':
                leavesGeometry = new THREE.ConeGeometry(treeType.leavesSize, leavesHeight, 8);
                break;
            case 'redwood':
                leavesGeometry = new THREE.ConeGeometry(treeType.leavesSize, leavesHeight, 8);
                break;
        }
        
        const leavesMaterial = new THREE.MeshStandardMaterial({
            color: treeType.leavesColor,
            roughness: 0.8,
            metalness: 0.1
        });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.set(x, trunkHeight + leavesHeight/2, z);
        leaves.castShadow = true;
        leaves.receiveShadow = true;
        
        this.scene.add(trunk);
        this.scene.add(leaves);
        this.objects.push(trunk, leaves);
    }
    
    createRock(x, z, size) {
        const rockType = this.rockTypes[Math.floor(this.rng() * this.rockTypes.length)];
        const rockSize = size * rockType.size;
        
        // 岩の形状をランダムに選択
        let rockGeometry;
        const geometryType = Math.floor(this.rng() * 3);
        switch(geometryType) {
            case 0:
                rockGeometry = new THREE.DodecahedronGeometry(rockSize, 0);
                break;
            case 1:
                rockGeometry = new THREE.IcosahedronGeometry(rockSize, 0);
                break;
            case 2:
                rockGeometry = new THREE.OctahedronGeometry(rockSize, 0);
                break;
        }
        
        // 頂点を変形させて自然な形状を作成
        const vertices = rockGeometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            vertices[i] += (this.rng() - 0.5) * 0.2;
            vertices[i + 1] += (this.rng() - 0.5) * 0.2;
            vertices[i + 2] += (this.rng() - 0.5) * 0.2;
        }
        
        const rockMaterial = new THREE.MeshStandardMaterial({
            color: rockType.color,
            roughness: rockType.roughness,
            metalness: 0.1
        });
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.position.set(x, rockSize/2, z);
        rock.rotation.set(this.rng() * Math.PI, this.rng() * Math.PI, this.rng() * Math.PI);
        rock.castShadow = true;
        rock.receiveShadow = true;
        this.scene.add(rock);
        this.objects.push(rock);
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
        const debrisType = this.debrisTypes[Math.floor(this.rng() * this.debrisTypes.length)];
        
        // 可変サイズのがれき
        const size = debrisType.size * (0.5 + this.rng());
        
        let debrisGeometry;
        const geometryType = Math.floor(this.rng() * 3);
        
        // 異なるジオメトリタイプを作成
        switch (geometryType) {
            case 0: // 立方体（コンクリートの塊）
                debrisGeometry = new THREE.BoxGeometry(size, size, size);
                break;
            case 1: // 四面体（ガラスの破片）
                debrisGeometry = new THREE.TetrahedronGeometry(size);
                break;
            case 2: // 円柱（パイプ/柱）
                debrisGeometry = new THREE.CylinderGeometry(size/3, size/3, size*2, 8);
                break;
        }
        
        // ジオメトリを変形させて壊れた外観を作成
        const vertices = debrisGeometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            vertices[i] += (this.rng() - 0.5) * 0.4;
            vertices[i + 1] += (this.rng() - 0.5) * 0.4;
            vertices[i + 2] += (this.rng() - 0.5) * 0.4;
        }
        
        // 色のバリエーション
        const colorVariation = (this.rng() - 0.5) * 0.2;
        const color = new THREE.Color(debrisType.color);
        color.r += colorVariation;
        color.g += colorVariation;
        color.b += colorVariation;
        
        const debrisMaterial = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.7 + this.rng() * 0.3,
            metalness: debrisType.name === 'metal' ? 0.7 : 0.1,
            flatShading: true
        });
        
        const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
        
        // がれきの位置を設定
        debris.position.set(x, size / 2, z);
        
        // ランダムな回転
        debris.rotation.x = this.rng() * Math.PI;
        debris.rotation.y = this.rng() * Math.PI;
        debris.rotation.z = this.rng() * Math.PI;
        
        // がれきをシーンに追加
        debris.userData = { type: 'debris', debrisType: debrisType.name };
        debris.castShadow = true;
        debris.receiveShadow = true;
        this.scene.add(debris);
        this.objects.push(debris);
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
        const wallHeight = 1;
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
        // 海の平面を作成
        const oceanSize = this.mapSize * 2; // マップの2倍の大きさ
        const oceanGeometry = new THREE.PlaneGeometry(oceanSize, oceanSize, 100, 100);
        
        // 海のマテリアルを作成
        const oceanMaterial = new THREE.MeshStandardMaterial({
            color: 0x0077be, // 海の色
            roughness: 0.1,
            metalness: 0.3,
            transparent: true,
            opacity: 0.8
        });
        
        // 海のメッシュを作成
        const ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
        ocean.rotation.x = -Math.PI / 2; // 平面を水平に
        ocean.position.y = -1; // 地面より少し下に配置
        
        // 波のアニメーション用の頂点を取得
        const vertices = oceanGeometry.attributes.position.array;
        
        // アニメーション関数を定義
        const animateOcean = () => {
            const time = Date.now() * 0.001; // 秒単位の時間
            
            for (let i = 0; i < vertices.length; i += 3) {
                const x = vertices[i];
                const z = vertices[i + 2];
                
                // 波の高さを計算（複数の波を重ね合わせる）
                const wave1 = Math.sin(x * 0.1 + time) * 0.2;
                const wave2 = Math.sin(z * 0.1 + time * 0.7) * 0.2;
                const wave3 = Math.sin((x + z) * 0.05 + time * 0.5) * 0.1;
                
                vertices[i + 1] = wave1 + wave2 + wave3;
            }
            
            oceanGeometry.attributes.position.needsUpdate = true;
            requestAnimationFrame(animateOcean);
        };
        
        // アニメーションを開始
        animateOcean();
        
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
        // 安全なスポーン位置を返す（オブジェクトがない場所）
        let x, z;
        let isSafe = false;
        
        while (!isSafe) {
            x = (this.rng() - 0.5) * (this.mapSize - 20);
            z = (this.rng() - 0.5) * (this.mapSize - 20);
            
            // オブジェクトとの距離をチェック
            isSafe = true;
            for (const obj of this.objects) {
                const dx = x - obj.position.x;
                const dz = z - obj.position.z;
                const distance = Math.sqrt(dx * dx + dz * dz);
                
                if (distance < 5) {
                    isSafe = false;
                    break;
                }
            }
        }
        
        return { x, y: 0, z };
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
} 