class FieldMap {
    constructor(scene, seed) {
        this.scene = scene;
        this.seed = seed || Math.random();
        Math.seedrandom(this.seed.toString());
        this.rng = Math.random;
        this.mapSize = GameConfig.MAP.SIZE;
        this.biomes = [];
        this.objects = [];
        this.terrainChunks = []; // 地形チャンクを管理する配列
        this.chunkSize = 100; // チャンクのサイズ
        this.visibleDistance = 100; // 視界距離
        this.lodDistances = [100, 200, 300]; // LODの距離閾値
        this.lodSegments = [64, 32, 16]; // 各LODレベルのセグメント数
        this.objectChunks = new Map(); // チャンクごとのオブジェクトを管理
        this.isLoading = true; // ローディング状態を管理

        // バイオームごとの色を定義
        this.biomeColors = {
            'urban': {
                base: new THREE.Color(0x2C2C2C),      // 暗いグレー
                highlight: new THREE.Color(0x404040),  // やや明るいグレー
                mid: new THREE.Color(0x1A1A1A),       // 非常に暗いグレー
                top: new THREE.Color(0x333333)        // 中間のグレー
            },
            'forest': {
                base: new THREE.Color(0x1B3D1B),      // 暗い緑
                highlight: new THREE.Color(0x2D4D2D),  // やや明るい緑
                mid: new THREE.Color(0x0F2F0F),       // 非常に暗い緑
                top: new THREE.Color(0x3D5D3D)        // 中間の緑
            },
            'ruins': {
                base: new THREE.Color(0x4A3A2A),      // 暗い茶色
                highlight: new THREE.Color(0x5A4A3A),  // やや明るい茶色
                mid: new THREE.Color(0x3A2A1A),       // 非常に暗い茶色
                top: new THREE.Color(0x6A5A4A)        // 中間の茶色
            },
            'industrial': {
                base: new THREE.Color(0x2A2A2A),      // 暗いグレー
                highlight: new THREE.Color(0x3A3A3A),  // やや明るいグレー
                mid: new THREE.Color(0x1A1A1A),       // 非常に暗いグレー
                top: new THREE.Color(0x4A4A4A)        // 中間のグレー
            },
            'beach': {
                base: new THREE.Color(0x3A3A2A),      // 暗い砂色
                highlight: new THREE.Color(0x4A4A3A),  // やや明るい砂色
                mid: new THREE.Color(0x2A2A1A),       // 非常に暗い砂色
                top: new THREE.Color(0x5A5A4A)        // 中間の砂色
            }
        };

        // バイオームごとのオブジェクト生成設定を定義
        this.biomeSettings = {
            'urban': {
                buildingDensity: 0.8,
                buildingTypes: ['skyscraper', 'office', 'apartment', 'mall', 'hotel'],
                treeDensity: 0.1,
                treeTypes: ['oak', 'maple'],
                debrisDensity: 0.3,
                debrisTypes: ['concrete', 'metal', 'glass', 'brick']
            },
            'forest': {
                buildingDensity: 0.1,
                buildingTypes: ['residential', 'school'],
                treeDensity: 0.8,
                treeTypes: ['pine', 'oak', 'birch', 'maple', 'redwood'],
                debrisDensity: 0.1,
                debrisTypes: ['wood', 'rock']
            },
            'ruins': {
                buildingDensity: 0.4,
                buildingTypes: ['residential', 'industrial', 'school'],
                treeDensity: 0.3,
                treeTypes: ['oak', 'maple', 'willow'],
                debrisDensity: 0.7,
                debrisTypes: ['concrete', 'metal', 'glass', 'brick', 'wood', 'rock']
            },
            'industrial': {
                buildingDensity: 0.6,
                buildingTypes: ['industrial', 'office', 'warehouse'],
                treeDensity: 0.05,
                treeTypes: ['oak', 'maple'],
                debrisDensity: 0.5,
                debrisTypes: ['metal', 'concrete', 'plastic', 'rubber']
            },
            'beach': {
                buildingDensity: 0.2,
                buildingTypes: ['residential', 'hotel'],
                treeDensity: 0.2,
                treeTypes: ['palm', 'cypress'],
                debrisDensity: 0.2,
                debrisTypes: ['wood', 'plastic', 'ceramic']
            }
        };

        this.fieldObject = new FieldObject(scene, seed, this);

        // ローディング画面の作成
        this.createLoadingScreen();

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
        
        // マップの初期化を即時実行
        this.createMap();
    }
    
    createMap() {
        // バイオームの生成
        this.generateBiomes();
        
        // 地形の生成
        this.generateTerrain();
        
        // オブジェクトの生成
        //this.generateObjects();
        
        // 境界壁の作成
        //this.createBoundaryWalls();
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
        // 現在のカメラ位置に最も近いチャンクを返す
        if (this.terrainChunks.length === 0) {
            return null;
        }
        return this.terrainChunks[0].mesh;
    }
    createLoadingScreen() {
        // ローディング画面のコンテナ
        const loadingContainer = document.createElement('div');
        loadingContainer.id = 'loading-screen';
        loadingContainer.style.position = 'fixed';
        loadingContainer.style.top = '0';
        loadingContainer.style.left = '0';
        loadingContainer.style.width = '100%';
        loadingContainer.style.height = '100%';
        loadingContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        loadingContainer.style.display = 'flex';
        loadingContainer.style.flexDirection = 'column';
        loadingContainer.style.justifyContent = 'center';
        loadingContainer.style.alignItems = 'center';
        loadingContainer.style.zIndex = '1000';
        loadingContainer.style.color = 'white';
        loadingContainer.style.fontFamily = 'Arial, sans-serif';

        // ローディングテキスト
        const loadingText = document.createElement('div');
        loadingText.textContent = '地形を生成中...';
        loadingText.style.fontSize = '24px';
        loadingText.style.marginBottom = '20px';

        // プログレスバー
        const progressBar = document.createElement('div');
        progressBar.style.width = '300px';
        progressBar.style.height = '20px';
        progressBar.style.backgroundColor = '#333';
        progressBar.style.borderRadius = '10px';
        progressBar.style.overflow = 'hidden';

        const progressFill = document.createElement('div');
        progressFill.style.width = '0%';
        progressFill.style.height = '100%';
        progressFill.style.backgroundColor = '#4CAF50';
        progressFill.style.transition = 'width 0.3s ease-in-out';

        progressBar.appendChild(progressFill);
        loadingContainer.appendChild(loadingText);
        loadingContainer.appendChild(progressBar);
        document.body.appendChild(loadingContainer);

        this.loadingScreen = loadingContainer;
        this.progressFill = progressFill;
    }

    hideLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.style.opacity = '0';
            this.loadingScreen.style.transition = 'opacity 0.5s ease-out';
            setTimeout(() => {
                this.loadingScreen.remove();
            }, 500);
        }
        this.isLoading = false;
    }

    updateLoadingProgress(progress) {
        if (this.progressFill) {
            this.progressFill.style.width = `${progress}%`;
        }
    }

    generateTerrain() {
    const size = GameConfig.MAP.SIZE;
    const chunkCount = Math.ceil(size / this.chunkSize);
    const totalChunks = chunkCount * chunkCount;
    const chunksPerFrame = 4; // 1フレームあたりの生成チャンク数
    
    // プレイヤーの位置を取得 (プレイヤーがまだ存在しない場合は中央を使用)
    let playerPosition = new THREE.Vector3(0, 0, 0);
    if (this.game && this.game.playerModel) {
        playerPosition = this.game.playerModel.getPosition();
    }
    
    // プレイヤーの位置から最も近いチャンク座標を計算
    const playerChunkX = Math.floor(playerPosition.x / this.chunkSize);
    const playerChunkZ = Math.floor(playerPosition.z / this.chunkSize);
    
    // チャンクの生成順序をプレイヤーからの距離でソート
    const chunkCoords = [];
    for (let x = -Math.floor(chunkCount/2); x < Math.ceil(chunkCount/2); x++) {
        for (let z = -Math.floor(chunkCount/2); z < Math.ceil(chunkCount/2); z++) {
            // プレイヤーから各チャンクまでの距離を計算
            const distToPlayer = Math.sqrt(
                Math.pow(x - playerChunkX, 2) + 
                Math.pow(z - playerChunkZ, 2)
            );
            
            chunkCoords.push({
                x: x,
                z: z,
                distance: distToPlayer
            });
        }
    }
    
    // プレイヤーからの距離でソート（近い順）
    chunkCoords.sort((a, b) => a.distance - b.distance);
    
    let currentChunk = 0;
    
    const generateNextChunks = () => {
        const startTime = performance.now();
        let chunksGenerated = 0;

        while (chunksGenerated < chunksPerFrame && currentChunk < totalChunks) {
            const chunkData = chunkCoords[currentChunk];
            
            this.createTerrainChunk(chunkData.x, chunkData.z);
            
            currentChunk++;
            chunksGenerated++;

            // 進捗状況を更新
            const progress = Math.floor((currentChunk / totalChunks) * 100);
            this.updateLoadingProgress(progress);
        }

        if (currentChunk < totalChunks) {
            // 次のフレームで続行
            requestAnimationFrame(generateNextChunks);
        } else {
            // 地形生成完了後、オブジェクトを生成
            this.generateObjects();
            this.hideLoadingScreen();
        }
        
        // 最初のチャンク (プレイヤー周辺) が読み込まれたらローディング画面を隠す
        if (currentChunk >= 9 && this.isLoading) { // 3x3 の周辺チャンクが読み込まれたら
            this.hideLoadingScreen();
        }
    };

    generateNextChunks();
}

    createTerrainChunk(chunkX, chunkZ) {
        // チャンクの位置を計算
        const position = new THREE.Vector3(
            chunkX * this.chunkSize,
            0,
            chunkZ * this.chunkSize
        );

        // チャンクが既に存在するかチェック
        const existingChunk = this.terrainChunks.find(
            chunk => chunk.chunkX === chunkX && chunk.chunkZ === chunkZ
        );
        if (existingChunk) return;

        // 高解像度のジオメトリを作成
        const geometry = new THREE.PlaneGeometry(
            this.chunkSize,
            this.chunkSize,
            this.lodSegments[0],
            this.lodSegments[0]
        );

        // バイオームを取得
        const biome = this.getBiomeAt(position.x, position.z);
        const biomeColor = this.biomeColors[biome.type] || this.biomeColors['urban'];

        // マテリアルの設定
        const material = new THREE.ShaderMaterial({
            uniforms: {
                lightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
                lightIntensity: { value: 0.7 },  // 光の強さを弱める
                ambientIntensity: { value: 0.3 }, // 環境光も弱める
                lightColor: { value: new THREE.Color(0xCCCCCC) }, // 光の色を少し暗く
                ambientColor: { value: new THREE.Color(0x999999) }, // 環境光の色も暗く
                baseColor: { value: biomeColor.base },
                highlightColor: { value: biomeColor.highlight },
                midColor: { value: biomeColor.mid },
                topColor: { value: biomeColor.top }
            },
            vertexShader: `
                varying vec3 vPosition;
                varying vec3 vNormal;
                varying float vHeight;

                void main() {
                    vPosition = position;
                    vNormal = normal;
                    vHeight = position.z;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vPosition;
                varying vec3 vNormal;
                varying float vHeight;
                uniform vec3 lightDirection;
                uniform float lightIntensity;
                uniform float ambientIntensity;
                uniform vec3 lightColor;
                uniform vec3 ambientColor;
                uniform vec3 baseColor;
                uniform vec3 highlightColor;
                uniform vec3 midColor;
                uniform vec3 topColor;

                void main() {
                    float height = vHeight;
                    vec3 finalColor;

                    // 高さに基づいて4つの色をブレンド
                    float heightFactor1 = smoothstep(0.0, 2.0, height);
                    float heightFactor2 = smoothstep(2.0, 4.0, height);
                    float heightFactor3 = smoothstep(4.0, 8.0, height);

                    vec3 color1 = mix(baseColor, midColor, heightFactor1);
                    vec3 color2 = mix(midColor, highlightColor, heightFactor2);
                    vec3 color3 = mix(highlightColor, topColor, heightFactor3);

                    vec3 terrainColor;
                    if (height < 2.0) {
                        terrainColor = color1;
                    } else if (height < 4.0) {
                        terrainColor = color2;
                    } else {
                        terrainColor = color3;
                    }

                    // ノイズを追加して荒廃感を出す
                    float noise = fract(sin(dot(vPosition.xy, vec2(12.9898, 78.233))) * 43758.5453);
                    terrainColor = mix(terrainColor, terrainColor * 0.8, noise * 0.2);

                    // ライティング計算
                    vec3 normalizedNormal = normalize(vNormal);
                    vec3 normalizedLightDirection = normalize(lightDirection);
                    float directionalFactor = max(dot(normalizedNormal, normalizedLightDirection), 0.0) * lightIntensity;
                    directionalFactor = max(directionalFactor, 0.1);
                    
                    vec3 directionalContribution = lightColor * directionalFactor;
                    vec3 ambientContribution = ambientColor * ambientIntensity;
                    
                    finalColor = terrainColor * (directionalContribution + ambientContribution);
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `,
            side: THREE.DoubleSide
        });

        const terrainChunk = new THREE.Mesh(geometry, material);
        terrainChunk.rotation.x = -Math.PI / 2;
        terrainChunk.receiveShadow = true;
        terrainChunk.position.copy(position);

        // 頂点の高さを設定
        const vertices = terrainChunk.geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i] + position.x;
            const y = vertices[i + 1] + position.z;
        
            var baseHeight = 
            Math.sin(x * 0.1) * Math.cos(y * 0.1) * 3 + 
            Math.sin(x * 0.3 + 0.5) * Math.cos(y * 0.3 + 0.5) * 2 +
            Math.sin(x * 0.03) * Math.cos(y * 0.03) * 5;
        
            if(baseHeight < 0) {
                baseHeight = 0;
            }

            vertices[i + 2] = baseHeight;
        }

        terrainChunk.geometry.attributes.position.needsUpdate = true;
        terrainChunk.geometry.computeVertexNormals();

        // チャンクを管理配列に追加
        this.terrainChunks.push({
            mesh: terrainChunk,
            chunkX: chunkX,
            chunkZ: chunkZ,
            geometry: geometry,
            material: material,
            biome: biome.type
        });

        this.scene.add(terrainChunk);
    }

    updateTerrainVisibility(cameraPosition) {
        const updateChunk = (chunk) => {
            const distance = Math.sqrt(
                Math.pow(cameraPosition.x - chunk.mesh.position.x, 2) +
                Math.pow(cameraPosition.z - chunk.mesh.position.z, 2)
            );

            // 視界距離より遠いチャンクは非表示
            if (distance > this.visibleDistance) {
                if (chunk.mesh.visible) {
                    chunk.mesh.visible = false;
                    // チャンクに関連するオブジェクトも非表示にする
                    const chunkKey = `${chunk.chunkX},${chunk.chunkZ}`;
                    const chunkObjects = this.objectChunks.get(chunkKey);
                    if (chunkObjects) {
                        chunkObjects.forEach(obj => {
                            if (obj && obj.mesh) {
                                obj.mesh.visible = false;
                            }
                        });
                    }
                }
                return;
            }

            // 視界内のチャンクを表示
            if (!chunk.mesh.visible) {
                chunk.mesh.visible = true;
                // チャンクに関連するオブジェクトも表示する
                const chunkKey = `${chunk.chunkX},${chunk.chunkZ}`;
                const chunkObjects = this.objectChunks.get(chunkKey);
                if (chunkObjects) {
                    chunkObjects.forEach(obj => {
                        if (obj && obj.mesh) {
                            obj.mesh.visible = true;
                        }
                    });
                }
            }

            // LODの適用
            let lodLevel = 0;
            for (let i = 0; i < this.lodDistances.length; i++) {
                if (distance > this.lodDistances[i]) {
                    lodLevel = i + 1;
                }
            }

            // 現在のLODレベルに応じてジオメトリを更新
            if (chunk.currentLodLevel !== lodLevel) {
                const newGeometry = new THREE.PlaneGeometry(
                    this.chunkSize,
                    this.chunkSize,
                    this.lodSegments[lodLevel],
                    this.lodSegments[lodLevel]
                );

                // 頂点の高さを設定
                const vertices = newGeometry.attributes.position.array;
                for (let i = 0; i < vertices.length; i += 3) {
                    const x = vertices[i] + chunk.mesh.position.x;
                    const y = vertices[i + 1] + chunk.mesh.position.z;
                    
                    var baseHeight = 
                        Math.sin(x * 0.1) * Math.cos(y * 0.1) * 3 + 
                        Math.sin(x * 0.3 + 0.5) * Math.cos(y * 0.3 + 0.5) * 2 +
                        Math.sin(x * 0.03) * Math.cos(y * 0.03) * 5;
                    
                    if(baseHeight < 0) {
                        baseHeight = 0;
                    }

                    vertices[i + 2] = baseHeight;
                }

                newGeometry.attributes.position.needsUpdate = true;
                newGeometry.computeVertexNormals();

                // 古いジオメトリを破棄
                chunk.geometry.dispose();
                chunk.geometry = newGeometry;
                chunk.mesh.geometry = newGeometry;
                chunk.currentLodLevel = lodLevel;
            }
        };

        // すべてのチャンクを更新
        this.terrainChunks.forEach(updateChunk);
        
    }

    getHeightAt(x, z) {
        // 最も近いチャンクを探す
        let closestChunk = null;
        let minDistance = Infinity;

        for (const chunk of this.terrainChunks) {
            const dx = x - chunk.mesh.position.x;
            const dz = z - chunk.mesh.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance < minDistance) {
                minDistance = distance;
                closestChunk = chunk;
            }
        }

        if (closestChunk) {
            const raycaster = new THREE.Raycaster();
            const down = new THREE.Vector3(0, -1, 0);
            raycaster.set(new THREE.Vector3(x, 100, z), down);

            const intersects = raycaster.intersectObject(closestChunk.mesh);
            if (intersects.length > 0) {
                return intersects[0].point.y;
            }
        }
        return 0;
    }

    generateObjects() {
        // オブジェクトの生成をチャンクごとに管理
        this.objectChunks = new Map(); // チャンクごとのオブジェクトを管理
        this.objects = []; // 既存のオブジェクト配列も維持

        // 初期のチャンクにオブジェクトを生成
        for (const chunk of this.terrainChunks) {
            //this.generateObjectsForChunk(chunk.chunkX, chunk.chunkZ);
        }
    }

    updateObjectsVisibility(cameraPosition) {
        if (!this.terrainChunks || this.terrainChunks.length === 0) {
            //console.log('terrainChunks is empty or undefined');
            return;
        }

        // 現在の視界内のチャンクを特定
        const visibleChunks = new Set();
      //  console.log('terrainChunks length:', this.terrainChunks.length);
        
        // カメラ位置からの距離に基づいて可視チャンクを決定
        for (const chunk of this.terrainChunks) {
            if (!chunk || !chunk.mesh) {
                //console.log('Invalid chunk found');
                continue;
            }

            const distance = Math.sqrt(
                Math.pow(cameraPosition.x - chunk.mesh.position.x, 2) +
                Math.pow(cameraPosition.z - chunk.mesh.position.z, 2)
            );
            
            if (distance <= this.visibleDistance) {
                const key = `${chunk.chunkX},${chunk.chunkZ}`;
                visibleChunks.add(key);
            }
        }

      // console.log('Visible chunks count:', visibleChunks.size);
       //console.log('Visible chunks count:', visibleChunks);
        // 視界外のチャンクのオブジェクトを削除
        if (this.objectChunks) {
            for (const [key, objects] of this.objectChunks) {
                if (!visibleChunks.has(key)) {
                    // オブジェクトをシーンから削除
                    objects.forEach(obj => {
                        if (obj && obj.mesh) {
                            this.scene.remove(obj.mesh);
                            if (obj.mesh.geometry) obj.mesh.geometry.dispose();
                            if (obj.mesh.material) {
                                if (Array.isArray(obj.mesh.material)) {
                                    obj.mesh.material.forEach(mat => mat.dispose());
                                } else {
                                    obj.mesh.material.dispose();
                                }
                            }
                            // グローバルなオブジェクト配列からも削除
                            const index = this.objects.indexOf(obj);
                            if (index !== -1) {
                                this.objects.splice(index, 1);
                            }
                        }
                    });
                    this.objectChunks.delete(key);
                }
            }
        }

        // 視界内のチャンクにオブジェクトを生成
        if (visibleChunks.size > 0) {
            for (const key of visibleChunks) {
                //console.log(key);
                if (!this.objectChunks.has(key)) {
                    const [chunkX, chunkZ] = key.split(',').map(Number);
                    //console.log("xxx")
                    this.generateObjectsForChunk(chunkX, chunkZ);
                }
            }
        }
    }

    generateObjectsForChunk(chunkX, chunkZ) {
        const chunkKey = `${chunkX},${chunkZ}`;
        if (this.objectChunks.has(chunkKey)) {
            return;
        }

        const chunkObjects = [];
        const chunkPosition = new THREE.Vector3(
            chunkX * this.chunkSize,
            0,
            chunkZ * this.chunkSize
        );

        // バイオームの取得
        const biome = this.getBiomeAt(chunkPosition.x, chunkPosition.z);
        if (!biome) return;

        // バイオームの設定を取得
        const biomeSetting = this.biomeSettings[biome.type];
        if (!biomeSetting) return;

        // 建物の生成
        const buildingCount = Math.floor(this.rng() * 5 * biomeSetting.buildingDensity);
        for (let i = 0; i < 10; i++) {
            if (this.rng() < biomeSetting.buildingDensity) {
                let position;
                let isSafe = false;
                let attempts = 0;
                const maxAttempts = GameConfig.MAP.BUILDINGS.MAX_ATTEMPTS;
                
                while (!isSafe && attempts < maxAttempts) {
                    position = new THREE.Vector3(
                        chunkPosition.x + (this.rng() - 0.5) * this.chunkSize,
                        0,
                        chunkPosition.z + (this.rng() - 0.5) * this.chunkSize
                    );

                    if (Math.abs(position.x - chunkPosition.x) > this.chunkSize/2 ||
                        Math.abs(position.z - chunkPosition.z) > this.chunkSize/2) {
                        attempts++;
                        continue;
                    }
                    
                    isSafe = true;
                    for (const obj of chunkObjects) {
                        if (obj.position.distanceTo(position) < GameConfig.MAP.BUILDINGS.MIN_DISTANCE) {
                            isSafe = false;
                            break;
                        }
                    }
                    
                    attempts++;
                }
                
                if (isSafe) {
                    // バイオームに応じた建物タイプを選択
                    const buildingTypeName = biomeSetting.buildingTypes[
                        Math.floor(this.rng() * biomeSetting.buildingTypes.length)
                    ];
                    const buildingType = this.buildingTypes.find(type => type.name === buildingTypeName);
                    
                    if (buildingType) {
                        const height = buildingType.minHeight + this.rng() * (buildingType.maxHeight - buildingType.minHeight);
                        const width = 15 + this.rng() * 25;
                        
                        const building = this.fieldObject.createBuilding(position, buildingType, height, width);
                        if (building && building.mesh) {
                            building.mesh.position.copy(position);
                            building.mesh.position.y = this.getHeightAt(position.x, position.z);
                            this.scene.add(building.mesh);
                            chunkObjects.push(building);
                            this.objects.push(building);
                        }
                    }
                }
            }
        }

        // 木の生成
        const treeCount = Math.floor(this.rng() * 20 * biomeSetting.treeDensity);
        for (let i = 0; i < treeCount; i++) {
            const x = chunkPosition.x + (this.rng() - 0.5) * this.chunkSize;
            const z = chunkPosition.z + (this.rng() - 0.5) * this.chunkSize;
            
            // バイオームに応じた木のタイプを選択
            const treeTypeName = biomeSetting.treeTypes[
                Math.floor(this.rng() * biomeSetting.treeTypes.length)
            ];
            const treeType = this.treeTypes.find(type => type.name === treeTypeName);
            
            if (treeType) {
                const height = Math.floor(this.rng() * 5) + 3;
                const tree = this.fieldObject.createTree(x, z, height, treeTypeName);
                if (tree && tree.mesh) {
                    tree.mesh.position.set(x, this.getHeightAt(x, z), z);
                    this.scene.add(tree.mesh);
                    chunkObjects.push(tree);
                    this.objects.push(tree);
                }
            }
        }

        // がれきの生成
        const debrisCount = Math.floor(this.rng() * 10 * biomeSetting.debrisDensity);
        for (let i = 0; i < debrisCount; i++) {
            const x = chunkPosition.x + (this.rng() - 0.5) * this.chunkSize;
            const z = chunkPosition.z + (this.rng() - 0.5) * this.chunkSize;
            
            // バイオームに応じたがれきのタイプを選択
            const debrisTypeName = biomeSetting.debrisTypes[
                Math.floor(this.rng() * biomeSetting.debrisTypes.length)
            ];
            const debrisType = this.debrisTypes.find(type => type.name === debrisTypeName);
            
            if (debrisType) {
                const debris = this.fieldObject.createDebris(x, z, debrisType);
                if (debris && debris.mesh) {
                    debris.mesh.position.set(x, this.getHeightAt(x, z), z);
                    this.scene.add(debris.mesh);
                    chunkObjects.push(debris);
                    this.objects.push(debris);
                }
            }
        }

        // チャンクのオブジェクトを保存
        this.objectChunks.set(chunkKey, chunkObjects);
    }
    
    createBoundaryWalls() {
        const wallHeight = 0;
        const wallThickness = 0;
        
        // 北の壁
       // this.createWall(0, wallHeight/2, -this.mapSize/2, this.mapSize, wallThickness, wallHeight);
        // 南の壁
       // this.createWall(0, wallHeight/2, this.mapSize/2, this.mapSize, wallThickness, wallHeight);
        // 東の壁
       // this.createWall(this.mapSize/2, wallHeight/2, 0, wallThickness, this.mapSize, wallHeight);
        // 西の壁
       // this.createWall(-this.mapSize/2, wallHeight/2, 0, wallThickness, this.mapSize, wallHeight);

        // 海の作成
        //this.createOcean();
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
        //const ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
        //ocean.rotation.x = -Math.PI / 2; // 平面を水平に
        //ocean.position.y = 0.1; // 地面より少し下に配置
        
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
        //this.scene.add(ocean);
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