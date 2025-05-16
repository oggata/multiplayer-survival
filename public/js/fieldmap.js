class FieldMap {
    constructor(scene, seed) {
        this.scene = scene;
        this.seed = seed || Math.random();
        Math.seedrandom(this.seed.toString());
        this.rng = Math.random;
        this.mapSize = GameConfig.MAP.SIZE;
        this.biomes = [];
        this.objects = [];

this.fieldObject = new FieldObject(scene,seed,this);


        this.terrainGeometry = null;
        /*
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
        */
        this.buildingTypes = [
            { name: 'skyscraper', minHeight: 30, maxHeight: 100, color: 0x555555 },
            { name: 'office', minHeight: 15, maxHeight: 40, color: 0x666666 },
            { name: 'residential', minHeight: 5, maxHeight: 15, color: 0x777777 },
            { name: 'industrial', minHeight: 8, maxHeight: 20, color: 0x444444 },
            { name: 'mall', minHeight: 10, maxHeight: 25, color: 0x888888 },

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
        const beachWidth = 15; // 砂浜の幅
        
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
    getTerrain() {
        return this.terrainGeometry;
    }
generateTerrain() {
    // 地面の作成（起伏を追加）
    const size = GameConfig.MAP.SIZE; // マップのサイズ
    const segments = 32; // より高精細な地形
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);

    // テクスチャローダー
    const textureLoader = new THREE.TextureLoader();

    // 地形の高さによって色を変える
    const vertexShader = `
        varying vec3 vPosition;
        varying vec3 vNormal;

        void main() {
            vPosition = position;
            vNormal = normal; // 法線をフラグメントシェーダーに渡す
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

 const fragmentShader = `
    varying vec3 vPosition;
    varying vec3 vNormal;
    uniform vec3 lightDirection;
    uniform float lightIntensity;
    uniform float ambientIntensity;
    uniform vec3 lightColor;
    uniform vec3 ambientColor;
    
    // スポットライト用の新しいuniform変数
    uniform vec3 spotLightPosition;
    uniform vec3 spotLightDirection;
    uniform vec3 spotLightColor;
    uniform float spotLightIntensity;
    uniform float spotLightDistance;
    uniform float spotLightAngle;
    uniform float spotLightPenumbra;
    uniform bool spotLightEnabled;

    void main() {
        // 既存の高さベースの色計算
        float height = vPosition.z;
        vec3 waterColor = vec3(0.0, 0.3, 0.7);
        vec3 sandColor = vec3(0.76, 0.7, 0.5);
        vec3 grassColor = vec3(0.0, 0.5, 0.0);
        vec3 rockColor = vec3(0.5, 0.5, 0.5);
        vec3 snowColor = vec3(1.0, 1.0, 1.0);

        vec3 baseColor;
        if (height < 0.5) {
            baseColor = sandColor;
        } else if (height < 1.0) {
            float t = (height - 0.5) / 0.5;
            baseColor = mix(sandColor, sandColor, t);
        } else if (height < 4.0) {
            float t = (height - 1.0) / 3.0;
            baseColor = mix(sandColor, grassColor, t);
        } else if (height < 8.0) {
            float t = (height - 4.0) / 4.0;
            baseColor = mix(grassColor, rockColor, t);
        } else {
            float t = min((height - 8.0) / 4.0, 1.0);
            baseColor = mix(rockColor, snowColor, t);
        }

        // 既存の太陽光（ディレクショナルライト）計算
        vec3 normalizedNormal = normalize(vNormal);
        vec3 normalizedLightDirection = normalize(lightDirection);
        float directionalFactor = max(dot(normalizedNormal, normalizedLightDirection), 0.0) * lightIntensity;
        
        // 最小照明レベルを設定（これは既存のコードに基づいています）
        directionalFactor = max(directionalFactor, 0.24);
        
        // 太陽光と環境光
        vec3 directionalContribution = lightColor * directionalFactor;
        vec3 ambientContribution = ambientColor * ambientIntensity;
        
        
        // スポットライトの計算（新しいコード）
        vec3 spotContribution = vec3(0.0);

        /*
        if (spotLightEnabled) {
            // 現在の頂点からスポットライトへのベクトル
            vec3 surfaceToLight = spotLightPosition - vPosition;
            float distanceToLight = length(surfaceToLight);
            
            // スポットライトの影響範囲内にある場合
            if (distanceToLight < spotLightDistance) {
                // ライトの方向に正規化
                vec3 lightDir = normalize(surfaceToLight);
                
                // ライトの中心軸との角度を計算
                float angleCos = dot(lightDir, normalize(-spotLightDirection));
                
                // スポットライトの円錐内にある場合
                float spotEffect = 0.0;
                float spotAngleCos = cos(spotLightAngle);
                if (angleCos > spotAngleCos) {
                    // アングルに応じた減衰を計算
                    float spotFalloff = smoothstep(spotAngleCos, spotAngleCos + spotLightPenumbra, angleCos);
                    
                    // 距離に応じた減衰を計算
                    float attenuation = 1.0 - smoothstep(0.0, spotLightDistance, distanceToLight);
                    
                    // 法線とライト方向の内積で照明強度を計算
                    float NdotL = max(dot(normalizedNormal, lightDir), 0.0);
                    
                    // すべての要素を組み合わせる
                    spotEffect = NdotL * attenuation * spotFalloff;
                }
                
                // スポットライトの寄与を追加
                spotContribution = spotLightColor * spotEffect * spotLightIntensity;
            }
        }
            */
        
        // すべての光源からの寄与を組み合わせる
        vec3 finalColor = baseColor * (directionalContribution + ambientContribution + spotContribution);

        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

    // デフォルトのライト方向を定義
    const defaultLightDirection = new THREE.Vector3(1, 1, 1).normalize();

    // ライトの方向を uniform に渡す
// ライトの方向を uniform に渡す
const material = new THREE.ShaderMaterial({
    uniforms: {
        lightDirection: { value: defaultLightDirection },
        lightIntensity: { value: 1.5 },
        ambientIntensity: { value: 0.4 },
        lightColor: { value: new THREE.Color(0xffffff) },
        ambientColor: { value: new THREE.Color(0xffffff) },
        
        // スポットライト用の新しいuniform変数
        spotLightPosition: { value: new THREE.Vector3(0, 0, 0) },
        spotLightDirection: { value: new THREE.Vector3(0, -1, 0) },
        spotLightColor: { value: new THREE.Color(0xffffcc) }, // 暖色系のライト色
        spotLightIntensity: { value: 0.0 }, // 初期値は0（オフ）
        spotLightDistance: { value: 50.0 },
        spotLightAngle: { value: Math.PI / 4 }, // 45度
        spotLightPenumbra: { value: 0.2 },
        spotLightEnabled: { value: false }
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    side: THREE.DoubleSide
});

    const terrainGeometry = new THREE.Mesh(geometry, material);
    terrainGeometry.rotation.x = -Math.PI / 2;
    terrainGeometry.receiveShadow = true;
    this.terrainGeometry = terrainGeometry;

    // 頂点の色を設定
    const vertices = terrainGeometry.geometry.attributes.position.array;
    
    // マップのサイズの半分（中心からの最大距離）
    const halfSize = size / 2;
    // 端からどれくらい内側でフェードアウトを始めるか（例：20%のマージン）
    const borderMargin = halfSize * 0.1;
    // 実際の使用可能なサイズ（フェードアウトを考慮）
    const usableSize = halfSize - borderMargin;
    
    for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const y = vertices[i + 1];
        
        // 基本的な地形の起伏を計算
        const baseHeight = 
            Math.sin(x * 0.1) * Math.cos(y * 0.1) * 3 + 
            Math.sin(x * 0.3 + 0.5) * Math.cos(y * 0.3 + 0.5) * 2 +
            Math.sin(x * 0.03) * Math.cos(y * 0.03) * 5;
        
        // 中心からの距離を計算
        const distanceFromCenter = Math.sqrt(x * x + y * y);
        
        // フェードアウト係数を計算（中心に近いほど1、端に近いほど0）
        let fadeOutFactor = 1.0;
        
        if (distanceFromCenter > usableSize) {
            // usableSizeを超えた場合、端に向かって徐々にフェードアウト
            fadeOutFactor = Math.max(0, 1.0 - (distanceFromCenter - usableSize) / borderMargin);
            
            // スムーズなフェードアウトのために、fadeOutFactorをイージング関数で調整
            // 例: 二次関数で滑らかに減少（オプション）
            fadeOutFactor = fadeOutFactor * fadeOutFactor;
        }
        
        // 最終的な高さを計算（端に近づくにつれて0に近づく）
        const finalHeight = Math.max(0, baseHeight * fadeOutFactor);
        
        vertices[i + 2] = finalHeight;
    }

    terrainGeometry.geometry.attributes.position.needsUpdate = true;
    terrainGeometry.geometry.computeVertexNormals();
    
    this.scene.add(terrainGeometry);
}
    

    getHeightAt(x, z) {
        const raycaster = new THREE.Raycaster();
        const down = new THREE.Vector3(0, -1, 0); // Ray direction (downward)
        raycaster.set(new THREE.Vector3(x, 100, z), down); // Start ray above the terrain

        const intersects = raycaster.intersectObject(this.terrainGeometry);
        if (intersects.length > 0) {
            return intersects[0].point.y; // Return the height of the terrain
        }
        return 0; // Default to ground level if no intersection
    }



    generateObjects() {
        // バイオームごとのオブジェクト生成
        for (const biome of this.biomes) {
            // がれきの生成確率を増加
            const debrisChance = 0.5; // 50%の確率でがれきを生成
            
            /*
            // がれきを生成（複数個）
            if (this.rng() < debrisChance) {
                const debrisCount = Math.floor(this.rng() * 3) + 1; // 1-3個のがれきを生成
                for (let i = 0; i < debrisCount; i++) {
                    const x = biome.x + (this.rng() - 0.5) * biome.size;
                    const z = biome.z + (this.rng() - 0.5) * biome.size;
                    this.fieldObject.createDebris(x, z);
                }
            }
            */
            /*
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
                    */
                this.generateUrbanObjects(biome);
                
        }

        // グリッドベースの追加オブジェクト生成
        const gridSize = 20; // グリッドのサイズ
        const gridCount = Math.floor(this.mapSize / gridSize);
        /*
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
                                this.fieldObject.createDebris(posX, posZ);
                                break;
                            case 1: // 岩
                                const rockSize = this.rng() * 2 + 1;
                                this.fieldObject.createRock(posX, posZ, rockSize);
                                break;
                            case 2: // 木
                                const treeHeight = Math.floor(this.rng() * 5) + 3;
                                const treeType = this.treeTypes[Math.floor(this.rng() * this.treeTypes.length)].name;
                                this.fieldObject.createTree(posX, posZ, treeHeight, treeType);
                                break;
                            case 3: // 車
                                this.fieldObject.createCar(posX, posZ, this.rng() * Math.PI * 2);
                                break;
                            case 4: // 廃墟
                                const ruinHeight = Math.floor(this.rng() * 5) + 2;
                                this.fieldObject.createRuins(posX, posZ, ruinHeight);
                                break;
                            case 5: // 小さな岩の群れ
                                const smallRockCount = Math.floor(this.rng() * 3) + 2;
                                for (let j = 0; j < smallRockCount; j++) {
                                    const smallRockX = posX + (this.rng() - 0.5) * 3;
                                    const smallRockZ = posZ + (this.rng() - 0.5) * 3;
                                    const smallRockSize = this.rng() * 1.5 + 0.5;
                                    this.fieldObject.createRock(smallRockX, smallRockZ, smallRockSize);
                                }
                                break;
                        }
                    }
                }
            }
        }*/
    }
    
    generateUrbanObjects(biome) {
        const mapSize = GameConfig.MAP.SIZE;
        const halfSize = mapSize / 2;
        const minDistance = 50;
        
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
                    //this.createBuilding(position, buildingType, height, width);
                    this.fieldObject.createBuilding(position, buildingType, height, width);
                }
            }
        }

        // 都市部は桜とメープル
        var treeType = Math.random() < 0.5 ? 'oak' : 'pine';

        const treeCount = Math.floor(this.rng() * 20) + 5;
        for (let i = 0; i < treeCount; i++) {
            const x = biome.x + (this.rng() - 0.5) * biome.size;
            const z = biome.z + (this.rng() - 0.5) * biome.size;
            const height = Math.floor(this.rng() * 5) + 3;
            this.fieldObject.createTree(x, z, height, treeType);
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
                    this.fieldObject.createCar(x, z, this.rng() * Math.PI * 2);
                }}
            }

        }

        // 木の生成
        const treeCount = Math.floor(this.rng() * 10) + 5;
        for (let i = 0; i < treeCount; i++) {
            const x = biome.x + (this.rng() - 0.5) * biome.size;
            const z = biome.z + (this.rng() - 0.5) * biome.size;
            const height = Math.floor(this.rng() * 5) + 3;
            this.fieldObject.createTree(x, z, height, treeType);
        }
        
        // 岩の生成
        const rockCount = Math.floor(this.rng() * 5) + 2;
        for (let i = 0; i < rockCount; i++) {
            const x = biome.x + (this.rng() - 0.5) * biome.size;
            const z = biome.z + (this.rng() - 0.5) * biome.size;
            const size = this.rng() * 2 + 1;
            this.fieldObject.createRock(x, z, size);
        }
    }
    
    generateRuinsObjects(biome) {
        // 廃墟の生成
        const ruinCount = Math.floor(this.rng() * 4) + 2;
        for (let i = 0; i < ruinCount; i++) {
            const x = biome.x + (this.rng() - 0.5) * biome.size;
            const z = biome.z + (this.rng() - 0.5) * biome.size;
            const height = Math.floor(this.rng() * 5) + 2;
            this.fieldObject.createRuins(x, z, height);
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
                this.fieldObject.createBuilding(position, buildingType, height, width);
            }
        }
    }
        // 車の生成
        const carChance = 1; // 30%の確率で車を生成
        for(var i=0;i<GameConfig.MAP.BUILDINGS.CAR_COUNT;i++){
        if (this.rng() < carChance) {
            const x = biome.x + (this.rng() - 0.5) * biome.size;
            const z = biome.z + (this.rng() - 0.5) * biome.size;
            this.fieldObject.createCar(x, z, this.rng() * Math.PI * 2);
        }}

    }
    
    generateIndustrialObjects(biome) {
        // 工場の生成
        const factoryCount = Math.floor(this.rng() * 3) + 1;
        for (let i = 0; i < factoryCount; i++) {
            const x = biome.x + (this.rng() - 0.5) * biome.size;
            const z = biome.z + (this.rng() - 0.5) * biome.size;
            const height = Math.floor(this.rng() * 15) + 8;
            this.fieldObject.createFactory(x, z, height);
        }
        
        // タンクの生成
        const tankCount = Math.floor(this.rng() * 5) + 3;
        for (let i = 0; i < tankCount; i++) {
            const x = biome.x + (this.rng() - 0.5) * biome.size;
            const z = biome.z + (this.rng() - 0.5) * biome.size;
            this.fieldObject.createTank(x, z);
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
                this.fieldObject.createBuilding(position, buildingType, height, width);
            }
        }
        
        // 車の生成
        const carChance = 0.3; // 30%の確率で車を生成
        if (this.rng() < carChance) {
            const x = biome.x + (this.rng() - 0.5) * biome.size;
            const z = biome.z + (this.rng() - 0.5) * biome.size;
            this.fieldObject.createCar(x, z, this.rng() * Math.PI * 2);
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
        //this.scene.add(sand);
        this.objects.push(sand);

        // ヤシの木を生成
        const palmCount = Math.floor(this.rng() * 3) + 1;
        for (let i = 0; i < palmCount; i++) {
            const x = biome.x + (this.rng() - 0.5) * biome.size;
            const z = biome.z + (this.rng() - 0.5) * biome.size;
            const height = Math.floor(this.rng() * 3) + 5;
            this.fieldObject.createTree(x, z, height, 'palm');
        }

        // 岩を生成
        const rockCount = Math.floor(this.rng() * 4) + 2;
        for (let i = 0; i < rockCount; i++) {
            const x = biome.x + (this.rng() - 0.5) * biome.size;
            const z = biome.z + (this.rng() - 0.5) * biome.size;
            const size = this.rng() * 1.5 + 0.5;
            this.fieldObject.createRock(x, z, size);
        }
    }
    

    
    createBoundaryWalls() {
        const wallHeight = 0;
        const wallThickness = 0;
        
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
        const oceanSize = this.mapSize * 2
        const oceanGeometry = new THREE.PlaneGeometry(oceanSize, oceanSize, 100, 100);
        
        // 海のマテリアルを作成
        const oceanMaterial = new THREE.MeshStandardMaterial({
            color: 0x004DB3, 
            transparent: true,
            //opacity: 1,
            side: THREE.DoubleSide // 両面を表示
        });
        
        // 海のメッシュを作成
        const ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
        ocean.rotation.x = -Math.PI / 2; // 平面を水平に
        ocean.position.y = 0.1; // 地面より少し下に配置
        
        // 波のアニメーション用の頂点を取得
        //const positions = oceanGeometry.attributes.position.array;
        //const originalPositions = new Float32Array(positions);
        /*
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
        */
        
        // アニメーションを開始
        //animateOcean();
        
        // 海をシーンに追加
        this.scene.add(ocean);
        //this.objects.push(ocean);
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