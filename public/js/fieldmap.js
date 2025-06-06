class FieldMap {
    constructor(scene, seed) {
        // smoothstep関数の定義
        this.smoothstep = function(x) {
            return x * x * (3 - 2 * x);
        };

        // 決定論的ノイズ関数の追加
        const grad3 = [
            [1,1,0], [-1,1,0], [1,-1,0], [-1,-1,0],
            [1,0,1], [-1,0,1], [1,0,-1], [-1,0,-1],
            [0,1,1], [0,-1,1], [0,1,-1], [0,-1,-1]
        ];

        this.noise = {
            p: new Array(256),
            perm: new Array(512),
            gradP: new Array(512),

            // シード値に基づいてパーミュテーションテーブルを初期化
            seed: function(seed) {
                if(seed > 0 && seed < 1) {
                    seed *= 65536;
                }
                seed = Math.floor(seed);
                if(seed < 256) {
                    seed |= seed << 8;
                }

                for(let i = 0; i < 256; i++) {
                    let v;
                    if (i & 1) {
                        v = this.p[i] ^ (seed & 255);
                    } else {
                        v = this.p[i] ^ ((seed>>8) & 255);
                    }
                    this.perm[i] = this.perm[i + 256] = v;
                    this.gradP[i] = this.gradP[i + 256] = grad3[v % 12];
                }
            },

            // 2Dノイズ関数
            simplex2: function(xin, yin) {
                let n0, n1, n2;
                const F2 = 0.5*(Math.sqrt(3)-1);
                const s = (xin+yin)*F2;
                const i = Math.floor(xin+s);
                const j = Math.floor(yin+s);
                const G2 = (3-Math.sqrt(3))/6;
                const t = (i+j)*G2;
                const X0 = i-t;
                const Y0 = j-t;
                const x0 = xin-X0;
                const y0 = yin-Y0;

                let i1, j1;
                if(x0>y0) { i1=1; j1=0; }
                else { i1=0; j1=1; }

                const x1 = x0 - i1 + G2;
                const y1 = y0 - j1 + G2;
                const x2 = x0 - 1.0 + 2.0 * G2;
                const y2 = y0 - 1.0 + 2.0 * G2;

                const ii = i & 255;
                const jj = j & 255;

                const t0 = 0.5 - x0*x0-y0*y0;
                if(t0 < 0) n0 = 0.0;
                else {
                    const gi0 = this.perm[ii+this.perm[jj]] % 12;
                    n0 = t0 * t0 * t0 * t0 * (grad3[gi0][0]*x0 + grad3[gi0][1]*y0);
                }

                const t1 = 0.5 - x1*x1-y1*y1;
                if(t1 < 0) n1 = 0.0;
                else {
                    const gi1 = this.perm[ii+i1+this.perm[jj+j1]] % 12;
                    n1 = t1 * t1 * t1 * t1 * (grad3[gi1][0]*x1 + grad3[gi1][1]*y1);
                }

                const t2 = 0.5 - x2*x2-y2*y2;
                if(t2 < 0) n2 = 0.0;
                else {
                    const gi2 = this.perm[ii+1+this.perm[jj+1]] % 12;
                    n2 = t2 * t2 * t2 * t2 * (grad3[gi2][0]*x2 + grad3[gi2][1]*y2);
                }

                return 70.0 * (n0 + n1 + n2);
            }
        };

        // パーミュテーションテーブルの初期化
        for(let i = 0; i < 256; i++) {
            this.noise.p[i] = Math.floor(Math.random() * 256);
        }

        this.scene = scene;
        this.seed = seed || Math.random();
        console.log("seed: " + this.seed);

        this.rng = new Math.seedrandom(this.seed.toString());
        // ノイズ関数のシードを設定
        this.noise.seed(this.seed);
        this.mapSize = GameConfig.MAP.SIZE;
        this.biomes = [];
        this.objects = [];
        this.terrainChunks = []; // 地形チャンクを管理する配列
        this.chunkSize = GameConfig.MAP.CHUNK_SIZE; // チャンクのサイズ
        this.visibleDistance = GameConfig.MAP.VISLBLE_DISTANCE; // 視界距離
        this.lodDistances = GameConfig.MAP.LOD.DISTANCES; // LODの距離閾値
        this.lodSegments = GameConfig.MAP.LOD.SEGMENTS; // 各LODレベルのセグメント数
        this.objectChunks = new Map(); // チャンクごとのオブジェクトを管理
        this.isLoading = true; // ローディング状態を管理

        // 安全なスポーン位置のリスト
        this.safeSpawnPositions = GameConfig.MAP.SPAWN.SAFE_POSITIONS;

        // 安全なスポーン位置からの最小距離
        this.SAFE_SPOT_DISTANCE = GameConfig.MAP.SPAWN.SAFE_SPOT_DISTANCE;

        // バイオームごとの色を定義
        this.biomeColors = {};
        Object.entries(GameConfig.MAP.BIOME.COLORS).forEach(([type, colors]) => {
            this.biomeColors[type] = {
                base: new THREE.Color(colors.base),
                highlight: new THREE.Color(colors.highlight),
                mid: new THREE.Color(colors.mid),
                top: new THREE.Color(colors.top),
                // 12色のマスターパレットを追加
                palette: {
                    color1: new THREE.Color(colors.palette?.color1 || 0x2C3E50),  // 深い青
                    color2: new THREE.Color(colors.palette?.color2 || 0x34495E),  // 濃い青
                    color3: new THREE.Color(colors.palette?.color3 || 0x7F8C8D),  // グレー
                    color4: new THREE.Color(colors.palette?.color4 || 0x95A5A6),  // 明るいグレー
                    color5: new THREE.Color(colors.palette?.color5 || 0xBDC3C7),  // 薄いグレー
                    color6: new THREE.Color(colors.palette?.color6 || 0xECF0F1),  // ほぼ白
                    color7: new THREE.Color(colors.palette?.color7 || 0xE74C3C),  // 赤
                    color8: new THREE.Color(colors.palette?.color8 || 0xC0392B),  // 濃い赤
                    color9: new THREE.Color(colors.palette?.color9 || 0x8E44AD),  // 紫
                    color10: new THREE.Color(colors.palette?.color10 || 0x9B59B6), // 明るい紫
                    color11: new THREE.Color(colors.palette?.color11 || 0x3498DB), // 青
                    color12: new THREE.Color(colors.palette?.color12 || 0x2980B9)  // 濃い青
                }
            };
        });

        // バイオームごとのオブジェクト生成設定を定義
        this.biomeSettings = GameConfig.MAP.BIOME.SETTINGS;

        this.fieldObject = new FieldObject(scene, seed, this);

        // ローディング画面の作成
        this.createLoadingScreen();

        // ビルタイプの定義
        this.buildingTypes = GameConfig.MAP.OBJECT_TYPES.BUILDINGS;

        // がれきタイプの定義
        this.debrisTypes = GameConfig.MAP.OBJECT_TYPES.DEBRIS;
        
        // 木の種類の定義
        this.treeTypes = GameConfig.MAP.OBJECT_TYPES.TREES;

        // 岩の種類の定義
        this.rockTypes = GameConfig.MAP.OBJECT_TYPES.ROCKS;
        
        // マップの初期化を即時実行
        this.createMap();

        this.isInitialized = false;

        // 高さ計算のキャッシュを追加
        this.heightCache = new Map();
        this.cacheSize = 1000; // キャッシュの最大サイズ
        this.cacheTimeout = 1000; // キャッシュの有効期限（ミリ秒）
        this.lastCacheCleanup = Date.now();
    }
    
    async initialize() {
        // 地形の生成
        await this.generateTerrain();
        
        // 建物の生成
        this.generateBuildings();
        
        // 木の生成
        this.generateTrees();
        
        // 瓦礫の生成
        this.generateDebris();
        
        this.isInitialized = true;
        return this;
    }

    createMap() {
        // バイオームの生成
        this.generateBiomes();
        
        // 地形の生成
        this.generateTerrain();
    
    }
    
    generateBiomes() {
        // バイオームの種類を定義
        const biomeTypes = GameConfig.MAP.BIOME.TYPES;
        const biomeRadius = GameConfig.MAP.BIOME.RADIUS;
        
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
                    // 中心からの距離を計算
                    const distanceFromCenter = Math.sqrt(x * x + z * z);
                    
                    // バイオームの種類を決定（距離に基づいて）
                    const biomeIndex = Math.floor(distanceFromCenter / biomeRadius) % biomeTypes.length;
                    biomeType = biomeTypes[biomeIndex];
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
        const chunksPerFrame = 4; // 1フレームあたりの生成チャンク数
        
        // プレイヤーの位置を取得 (プレイヤーがまだ存在しない場合は中央を使用)
        let playerPosition = new THREE.Vector3(0, 0, 0);
        if (this.game && this.game.playerModel) {
            playerPosition = this.game.playerModel.getPosition();
        }
        
        // プレイヤーの位置から最も近いチャンク座標を計算
        const playerChunkX = Math.floor(playerPosition.x / this.chunkSize);
        const playerChunkZ = Math.floor(playerPosition.z / this.chunkSize);
        
        // 生成するチャンクの範囲を制限（プレイヤーの周囲のみ）
        const generationRadius = Math.ceil(this.visibleDistance / this.chunkSize);
        
        // チャンクの生成順序をプレイヤーからの距離でソート
        const chunkCoords = [];
        for (let x = playerChunkX - generationRadius; x <= playerChunkX + generationRadius; x++) {
            for (let z = playerChunkZ - generationRadius; z <= playerChunkZ + generationRadius; z++) {
                // プレイヤーから各チャンクまでの距離を計算
                const distToPlayer = Math.sqrt(
                    Math.pow(x - playerChunkX, 2) + 
                    Math.pow(z - playerChunkZ, 2)
                );
                
                // 生成半径内のチャンクのみを追加
                if (distToPlayer <= generationRadius) {
                    chunkCoords.push({
                        x: x,
                        z: z,
                        distance: distToPlayer
                    });
                }
            }
        }
        
        // プレイヤーからの距離でソート（近い順）
        chunkCoords.sort((a, b) => a.distance - b.distance);
        
        let currentChunk = 0;
        const totalChunks = chunkCoords.length;
        
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

        // 頂点データを生成
        const segments = this.lodSegments[0];
        const vertices = [];
        const indices = [];
        const uvs = [];

        // 草のジオメトリを作成
        const grassGeometry = new THREE.BufferGeometry();
        const grassVertices = [];
        const grassIndices = [];
        const grassUvs = [];
        const grassColors = [];
        const grassCount = 5000; // 草の本数を5000に増やす

        // 頂点の生成（より細かいメッシュ）
        for (let z = 0; z <= segments; z++) {
            for (let x = 0; x <= segments; x++) {
                // グリッド上の位置を計算
                const gridX = x / segments;
                const gridZ = z / segments;

                // ワールド座標を計算
                const worldX = position.x + gridX * this.chunkSize;
                const worldZ = position.z + gridZ * this.chunkSize;

                // 高さを計算（より細かいノイズ）
                const height = this.calculateHeightAt(worldX, worldZ);

                // 頂点を追加
                vertices.push(
                    gridX * this.chunkSize,  // x
                    height,                  // y (height)
                    gridZ * this.chunkSize   // z
                );

                // UV座標を追加
                uvs.push(gridX, gridZ);

                // 草を生成（高さが0.8から2.5の範囲の場合のみ）
                if (height >= 0.8 && height <= 2.5) {
                    // 各グリッドセルあたりの草の本数を増やす
                    const grassPerCell = Math.floor(grassCount / (segments * segments)) * 5;
                    for (let i = 0; i < grassPerCell; i++) {
                        const offsetX = (Math.random() - 0.5) * (this.chunkSize / segments);
                        const offsetZ = (Math.random() - 0.5) * (this.chunkSize / segments);
                        const grassHeight = 0.3 + Math.random() * 0.7;
                        const grassWidth = 0.08 + Math.random() * 0.12;

                        // 草の頂点を追加
                        const baseX = worldX + offsetX;
                        const baseZ = worldZ + offsetZ;
                        const baseY = height;

                        // 草の色をランダムに設定
                        const color = new THREE.Color();
                        const hue = 0.25 + Math.random() * 0.15;
                        const saturation = 0.7 + Math.random() * 0.3;
                        const lightness = 0.3 + Math.random() * 0.3;
                        color.setHSL(hue, saturation, lightness);

                        // 草の頂点を追加
                        const vertexCount = grassVertices.length / 3;
                        grassVertices.push(
                            baseX - grassWidth/2, baseY, baseZ,
                            baseX + grassWidth/2, baseY, baseZ,
                            baseX, baseY + grassHeight, baseZ
                        );

                        // インデックスを追加
                        grassIndices.push(
                            vertexCount, vertexCount + 1, vertexCount + 2
                        );

                        // UV座標を追加
                        grassUvs.push(0, 0, 1, 0, 0.5, 1);

                        // 色を追加
                        for (let j = 0; j < 3; j++) {
                            grassColors.push(color.r, color.g, color.b);
                        }
                    }
                }
            }
        }

        // インデックスの生成（より細かいメッシュ用に最適化）
        for (let z = 0; z < segments; z++) {
            for (let x = 0; x < segments; x++) {
                const a = x + z * (segments + 1);
                const b = x + 1 + z * (segments + 1);
                const c = x + (z + 1) * (segments + 1);
                const d = x + 1 + (z + 1) * (segments + 1);

                // 最初の三角形
                indices.push(a, b, c);
                // 2番目の三角形
                indices.push(b, d, c);
            }
        }

        // 地形のジオメトリを作成
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        // 草のジオメトリを設定
        grassGeometry.setAttribute('position', new THREE.Float32BufferAttribute(grassVertices, 3));
        grassGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(grassUvs, 2));
        grassGeometry.setAttribute('color', new THREE.Float32BufferAttribute(grassColors, 3));
        grassGeometry.setIndex(grassIndices);
        grassGeometry.computeVertexNormals();

        // バイオームを取得
        const biome = this.getBiomeAt(position.x, position.z);
        const biomeColor = this.biomeColors[biome.type] || this.biomeColors['urban'];

        // 地形のマテリアル
        const material = new THREE.ShaderMaterial({
            uniforms: {
                lightDirection: { value: new THREE.Vector3(0.5, 1, 0.5).normalize() },
                lightIntensity: { value: 0.8 },
                ambientIntensity: { value: 0.5 },
                lightColor: { value: new THREE.Color(0xFFFFFF) },
                ambientColor: { value: new THREE.Color(0xCCCCCC) },
                baseColor: { value: biomeColor.base },
                highlightColor: { value: biomeColor.highlight },
                midColor: { value: biomeColor.mid },
                topColor: { value: biomeColor.top },
                color1: { value: biomeColor.palette.color1 },
                color2: { value: biomeColor.palette.color2 },
                color3: { value: biomeColor.palette.color3 },
                color4: { value: biomeColor.palette.color4 },
                color5: { value: biomeColor.palette.color5 },
                color6: { value: biomeColor.palette.color6 },
                color7: { value: biomeColor.palette.color7 },
                color8: { value: biomeColor.palette.color8 },
                color9: { value: biomeColor.palette.color9 },
                color10: { value: biomeColor.palette.color10 },
                color11: { value: biomeColor.palette.color11 },
                color12: { value: biomeColor.palette.color12 }
            },
            vertexShader: `
                varying vec3 vPosition;
                varying vec3 vNormal;
                varying float vHeight;
                varying vec2 vUv;

                void main() {
                    vPosition = position;
                    vNormal = normal;
                    vHeight = position.y;
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vPosition;
                varying vec3 vNormal;
                varying float vHeight;
                varying vec2 vUv;
                uniform vec3 lightDirection;
                uniform float lightIntensity;
                uniform float ambientIntensity;
                uniform vec3 lightColor;
                uniform vec3 ambientColor;
                uniform vec3 baseColor;
                uniform vec3 highlightColor;
                uniform vec3 midColor;
                uniform vec3 topColor;
                uniform vec3 color1;
                uniform vec3 color2;
                uniform vec3 color3;
                uniform vec3 color4;
                uniform vec3 color5;
                uniform vec3 color6;
                uniform vec3 color7;
                uniform vec3 color8;
                uniform vec3 color9;
                uniform vec3 color10;
                uniform vec3 color11;
                uniform vec3 color12;

                void main() {
                    float height = vHeight;
                    vec3 finalColor;

                    // 高さに基づいて12色をブレンド
                    float heightFactor1 = smoothstep(0.0, 1.0, height);
                    float heightFactor2 = smoothstep(1.0, 2.0, height);
                    float heightFactor3 = smoothstep(2.0, 3.0, height);
                    float heightFactor4 = smoothstep(3.0, 4.0, height);
                    float heightFactor5 = smoothstep(4.0, 5.0, height);
                    float heightFactor6 = smoothstep(5.0, 6.0, height);
                    float heightFactor7 = smoothstep(6.0, 7.0, height);
                    float heightFactor8 = smoothstep(7.0, 8.0, height);
                    float heightFactor9 = smoothstep(8.0, 9.0, height);
                    float heightFactor10 = smoothstep(9.0, 10.0, height);
                    float heightFactor11 = smoothstep(10.0, 11.0, height);

                    vec3 terrainColor;
                    if (height < 1.0) {
                        terrainColor = mix(color1, color2, heightFactor1);
                    } else if (height < 2.0) {
                        terrainColor = mix(color2, color3, heightFactor2);
                    } else if (height < 3.0) {
                        terrainColor = mix(color3, color4, heightFactor3);
                    } else if (height < 4.0) {
                        terrainColor = mix(color4, color5, heightFactor4);
                    } else if (height < 5.0) {
                        terrainColor = mix(color5, color6, heightFactor5);
                    } else if (height < 6.0) {
                        terrainColor = mix(color6, color7, heightFactor6);
                    } else if (height < 7.0) {
                        terrainColor = mix(color7, color8, heightFactor7);
                    } else if (height < 8.0) {
                        terrainColor = mix(color8, color9, heightFactor8);
                    } else if (height < 9.0) {
                        terrainColor = mix(color9, color10, heightFactor9);
                    } else if (height < 10.0) {
                        terrainColor = mix(color10, color11, heightFactor10);
                    } else {
                        terrainColor = mix(color11, color12, heightFactor11);
                    }

                    // ノイズを追加して荒廃感を出す（強度を下げる）
                    float noise = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
                    terrainColor = mix(terrainColor, terrainColor * 0.9, noise * 0.1);

                    // ライティング計算
                    vec3 normalizedNormal = normalize(vNormal);
                    vec3 normalizedLightDirection = normalize(lightDirection);
                    
                    // 直接光の計算
                    float directionalFactor = max(dot(normalizedNormal, normalizedLightDirection), 0.0) * lightIntensity;
                    
                    // 最低限の明るさを保証
                    directionalFactor = max(directionalFactor, 0.1);
                    
                    // 環境光の計算（より明るく）
                    vec3 ambientContribution = ambientColor * ambientIntensity;
                    
                    // 最終的な色の計算
                    vec3 directionalContribution = lightColor * directionalFactor;
                    finalColor = terrainColor * (directionalContribution + ambientContribution);
                    
                    // 最低限の明るさを保証
                    finalColor = max(finalColor, vec3(0.1));
                    
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `,
            side: THREE.DoubleSide
        });

        // 草のマテリアル
        const grassMaterial = new THREE.MeshStandardMaterial({
            vertexColors: true,
            side: THREE.DoubleSide,
            transparent: true,
            alphaTest: 0.5
        });

        const terrainChunk = new THREE.Mesh(geometry, material);
        const grassMesh = new THREE.Mesh(grassGeometry, grassMaterial);
        terrainChunk.position.copy(position);
        grassMesh.position.copy(position);

        // デバッグモードが有効な場合、ワイヤーフレームを追加
        if (GameConfig.MAP.DEBUG.SHOW_WIREFRAME) {
            const wireframe = new THREE.LineSegments(
                new THREE.WireframeGeometry(geometry),
                new THREE.LineBasicMaterial({
                    color: GameConfig.MAP.DEBUG.WIREFRAME_COLOR,
                    transparent: true,
                    opacity: 0.5
                })
            );
            wireframe.position.copy(position);
            this.scene.add(wireframe);
        }

        // チャンクを管理配列に追加
        this.terrainChunks.push({
            mesh: terrainChunk,
            grassMesh: grassMesh,
            chunkX: chunkX,
            chunkZ: chunkZ,
            geometry: geometry,
            material: material,
            biome: biome.type
        });

        this.scene.add(terrainChunk);
        this.scene.add(grassMesh);
    }

    // 指定された座標での高さを計算
    calculateHeightAt(x, z) {
        // バイオームを取得
        const biome = this.getBiomeAt(x, z);
        
        // 基本的な地形の高さを計算
        const baseHeight = this.generateBaseTerrain(x, z);
        
        // 安全なスポーン位置との距離をチェック
        const isNearSafeSpot = this.safeSpawnPositions.some(pos => {
            const dx = x - pos.x;
            const dz = z - pos.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            return distance < this.SAFE_SPOT_DISTANCE;
        });

        // 安全なスポーン位置の近くの場合は、メサを生成しない
        if (isNearSafeSpot) {
            return baseHeight;
        }
        
        // メサが生成される確率を計算（キャニオン以外のバイオームで低確率）
        let mesaChance = 0.015;

        if(biome.type === 'canyon'){
            mesaChance = 1.0;
        }else if(biome.type === 'forest'){
            mesaChance = 0.1;
        }else if(biome.type === 'ruins'){
            mesaChance = 0.1;
        }else if(biome.type === 'urban'){
            mesaChance = 0.01;
        }else if(biome.type === 'industrial'){
            mesaChance = 0.0;   
        }else{
            mesaChance = 0.1;
        }

        // メサの生成判定
        if (this.getDeterministicRandom(x, z, 'mesa') < mesaChance) {
            // メサの中心からの距離を計算
            const centerX = Math.floor(x / 100) * 100 + 50;
            const centerZ = Math.floor(z / 100) * 100 + 50;
            const distanceFromCenter = Math.sqrt(
                Math.pow(x - centerX, 2) + 
                Math.pow(z - centerZ, 2)
            );
            
            // メサの高さと幅をバイオームごとに調整
            let mesaHeight, mesaWidth;
            switch (biome.type) {
                case 'canyon':
                    mesaHeight = 150;
                    mesaWidth = 80;
                    break;
                case 'urban':
                    mesaHeight = 100;
                    mesaWidth = 60;
                    break;
                case 'forest':
                    mesaHeight = 80;
                    mesaWidth = 70;
                    break;
                case 'ruins':
                    mesaHeight = 90;
                    mesaWidth = 65;
                    break;
                case 'industrial':
                    mesaHeight = 70;
                    mesaWidth = 55;
                    break;
                default:
                    mesaHeight = 60;
                    mesaWidth = 50;
            }

            // メサの長さを制限するための追加の計算
            const mesaLength = Math.sqrt(
                Math.pow(x - centerX, 2) + 
                Math.pow(z - centerZ, 2)
            );
            const maxMesaLength = mesaWidth * 1.5; // メサの最大長さを設定

            // メサの長さが制限を超えた場合、高さを徐々に減少させる
            if (mesaLength > maxMesaLength) {
                const reductionFactor = Math.max(0, 1 - (mesaLength - maxMesaLength) / (mesaWidth * 0.5));
                mesaHeight *= reductionFactor;
            }
            
            // メサの形状を生成
            const mesaFactor = Math.max(0, 1 - distanceFromCenter / mesaWidth);
            const mesaHeightContribution = mesaHeight * Math.pow(mesaFactor, 2);
            
            // メサの周辺に崖を生成
            const cliffHeight = mesaHeight * 0.6;
            const cliffWidth = mesaWidth * 0.3;
            const cliffFactor = Math.max(0, 1 - Math.abs(distanceFromCenter - mesaWidth) / cliffWidth);
            const cliffHeightContribution = cliffHeight * cliffFactor;
            
            // 基本地形とメサの高さを組み合わせ
            return baseHeight + mesaHeightContribution + cliffHeightContribution;
        }
        
        return baseHeight;
    }

    generateBaseTerrain(x, z) {
        const scale1 = 0.02;
        const scale2 = 0.05;
        const scale3 = 0.1;
        
        const noise1 = this.noise.simplex2(x * scale1, z * scale1) * 2.0;
        const noise2 = this.noise.simplex2(x * scale2, z * scale2) * 1.5;
        const noise3 = this.noise.simplex2(x * scale3, z * scale3) * 0.5;
        
        const baseHeight = noise1 + noise2 + noise3;
        const normalizedHeight = Math.max(0, Math.min(baseHeight, 5));
        
        return Math.pow(normalizedHeight, 0.8);
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
                    if (chunk.grassMesh) chunk.grassMesh.visible = false;
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
                if (chunk.grassMesh) chunk.grassMesh.visible = true;
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
                const newGeometry = new THREE.BufferGeometry();
                newGeometry.setAttribute('position', chunk.geometry.getAttribute('position'));
                newGeometry.setAttribute('uv', chunk.geometry.getAttribute('uv'));
                newGeometry.setIndex(chunk.geometry.index);
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
        
        // プレイヤーの位置から最も近いチャンク座標を計算
        const playerChunkX = Math.floor(cameraPosition.x / this.chunkSize);
        const playerChunkZ = Math.floor(cameraPosition.z / this.chunkSize);
        
        // 生成するチャンクの範囲を制限（プレイヤーの周囲のみ）
        const generationRadius = Math.ceil(this.visibleDistance / this.chunkSize);
        
        // 新しいチャンクを生成
        for (let x = playerChunkX - generationRadius; x <= playerChunkX + generationRadius; x++) {
            for (let z = playerChunkZ - generationRadius; z <= playerChunkZ + generationRadius; z++) {
                // プレイヤーから各チャンクまでの距離を計算
                const distToPlayer = Math.sqrt(
                    Math.pow(x - playerChunkX, 2) + 
                    Math.pow(z - playerChunkZ, 2)
                );
                
                // 生成半径内のチャンクのみを生成
                if (distToPlayer <= generationRadius) {
                    // チャンクが既に存在するかチェック（より厳密なチェック）
                    const chunkKey = `${x},${z}`;
                    const existingChunk = this.terrainChunks.find(
                        chunk => chunk.chunkX === x && chunk.chunkZ === z && chunk.mesh
                    );
                    
                    if (!existingChunk) {
                        this.createTerrainChunk(x, z);
                    }
                }
            }
        }
        
        // 遠くのチャンクを削除
        this.terrainChunks = this.terrainChunks.filter(chunk => {
            const distance = Math.sqrt(
                Math.pow(cameraPosition.x - chunk.mesh.position.x, 2) +
                Math.pow(cameraPosition.z - chunk.mesh.position.z, 2)
            );
            
            if (distance > this.visibleDistance * 1.5) { // 視界距離の1.5倍以上離れたチャンクを削除
                // チャンクに関連するオブジェクトも削除
                const chunkKey = `${chunk.chunkX},${chunk.chunkZ}`;
                const chunkObjects = this.objectChunks.get(chunkKey);
                if (chunkObjects) {
                    chunkObjects.forEach(obj => {
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
                        }
                    });
                    this.objectChunks.delete(chunkKey);
                }
                
                // チャンクのメッシュと草のメッシュを削除
                this.scene.remove(chunk.mesh);
                if (chunk.grassMesh) {
                    this.scene.remove(chunk.grassMesh);
                    chunk.grassMesh.geometry.dispose();
                    chunk.grassMesh.material.dispose();
                }
                chunk.geometry.dispose();
                chunk.material.dispose();
                return false;
            }
            return true;
        });
    }

    getHeightAt(x, z) {
        // キャッシュのクリーンアップ（1秒ごと）
        const now = Date.now();
        if (now - this.lastCacheCleanup > this.cacheTimeout) {
            this.heightCache.clear();
            this.lastCacheCleanup = now;
        }

        // キャッシュキーの生成（座標を丸めてキャッシュの精度を調整）
        const cacheKey = `${Math.round(x * 10) / 10},${Math.round(z * 10) / 10}`;
        
        // キャッシュをチェック
        if (this.heightCache.has(cacheKey)) {
            return this.heightCache.get(cacheKey);
        }

        // 最も近いチャンクを探す
        let closestChunk = null;
        let minDistance = Infinity;

        for (const chunk of this.terrainChunks) {
            if (!chunk || !chunk.mesh) continue;

            const dx = x - chunk.mesh.position.x;
            const dz = z - chunk.mesh.position.z;
            const distance = dx * dx + dz * dz; // 平方根を避けてパフォーマンスを改善
            
            if (distance < minDistance) {
                minDistance = distance;
                closestChunk = chunk;
            }
        }

        let height;
        if (closestChunk) {
            // チャンクのローカル座標に変換
            const localX = x - closestChunk.mesh.position.x;
            const localZ = z - closestChunk.mesh.position.z;

            // ジオメトリから頂点データを取得
            const positions = closestChunk.geometry.attributes.position.array;
            const segments = this.lodSegments[0];

            // グリッド上の位置を計算（より粗いグリッドを使用）
            const gridX = Math.floor((localX / this.chunkSize) * segments);
            const gridZ = Math.floor((localZ / this.chunkSize) * segments);

            // グリッドの範囲をチェック
            if (gridX >= 0 && gridX < segments && gridZ >= 0 && gridZ < segments) {
                // 4つの頂点のインデックスを計算
                const v1 = gridX + gridZ * (segments + 1);
                const v2 = v1 + 1;
                const v3 = v1 + (segments + 1);
                const v4 = v2 + (segments + 1);

                // 頂点の高さを取得
                const h1 = positions[v1 * 3 + 1];
                const h2 = positions[v2 * 3 + 1];
                const h3 = positions[v3 * 3 + 1];
                const h4 = positions[v4 * 3 + 1];

                // グリッド内の相対位置を計算
                const fracX = (localX / this.chunkSize) * segments - gridX;
                const fracZ = (localZ / this.chunkSize) * segments - gridZ;

                // 双線形補間で高さを計算
                height = h1 * (1 - fracX) * (1 - fracZ) +
                        h2 * fracX * (1 - fracZ) +
                        h3 * (1 - fracX) * fracZ +
                        h4 * fracX * fracZ;
            } else {
                height = this.calculateHeightAt(x, z);
            }
        } else {
            height = this.calculateHeightAt(x, z);
        }

        // キャッシュに保存
        if (this.heightCache.size >= this.cacheSize) {
            // キャッシュが一杯になったら古いエントリを削除
            const firstKey = this.heightCache.keys().next().value;
            this.heightCache.delete(firstKey);
        }
        this.heightCache.set(cacheKey, height);

        return height;
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

    // 安全なスポーン位置かどうかをチェックする関数
    isSafeSpot(x, z) {
        return this.safeSpawnPositions.some(pos => {
            const dx = x - pos.x;
            const dz = z - pos.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            return distance < this.SAFE_SPOT_DISTANCE;
        });
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
        const buildingCount = Math.floor(this.getDeterministicRandom(chunkX, chunkZ, 'building') * 50 * biomeSetting.buildingDensity);
        for (let i = 0; i < buildingCount; i++) {
            if (this.getDeterministicRandom(chunkX, chunkZ, 'building' + i) < biomeSetting.buildingDensity) {
                let position;
                let isSafe = false;
                let attempts = 0;
                const maxAttempts = GameConfig.MAP.BUILDINGS.MAX_ATTEMPTS;
                
                while (!isSafe && attempts < maxAttempts) {
                    // 決定論的な位置生成
                    const offsetX = (this.getDeterministicRandom(chunkX, chunkZ, 'buildingX' + i) - 0.5) * this.chunkSize;
                    const offsetZ = (this.getDeterministicRandom(chunkX, chunkZ, 'buildingZ' + i) - 0.5) * this.chunkSize;
                    
                    position = new THREE.Vector3(
                        chunkPosition.x + offsetX,
                        0,
                        chunkPosition.z + offsetZ
                    );

                    // 安全なスポーン位置との距離をチェック
                    if (this.isSafeSpot(position.x, position.z)) {
                        attempts++;
                        continue;
                    }

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
                    
                    // 建物の幅を考慮した距離チェックを追加
                    if (isSafe) {
                        const buildingWidth = 15 + this.getDeterministicRandom(chunkX, chunkZ, 'buildingWidth' + i) * 25;
                        const minDistance = Math.max(GameConfig.MAP.BUILDINGS.MIN_DISTANCE, buildingWidth * 2);
                        
                        for (const obj of chunkObjects) {
                            const distance = obj.position.distanceTo(position);
                            if (distance < minDistance) {
                                isSafe = false;
                                break;
                            }
                        }
                    }
                    
                    attempts++;
                }
                
                if (isSafe) {
                    // 決定論的な建物タイプの選択
                    const buildingTypeIndex = Math.floor(this.getDeterministicRandom(chunkX, chunkZ, 'buildingType' + i) * biomeSetting.buildingTypes.length);
                    const buildingTypeName = biomeSetting.buildingTypes[buildingTypeIndex];
                    const buildingType = this.buildingTypes.find(type => type.name === buildingTypeName);
                    
                    if (buildingType) {
                        // 決定論的な高さと幅の生成
                        const height = buildingType.minHeight + this.getDeterministicRandom(chunkX, chunkZ, 'buildingHeight' + i) * (buildingType.maxHeight - buildingType.minHeight);
                        const width = 15 + this.getDeterministicRandom(chunkX, chunkZ, 'buildingWidth' + i) * 25;
                        
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
        let treeCount;
        if (biome.type === 'forest') {
            treeCount = Math.floor(this.getDeterministicRandom(chunkX, chunkZ, 'treeCount') * 100 * biomeSetting.treeDensity);
        } else {
            treeCount = Math.floor(this.getDeterministicRandom(chunkX, chunkZ, 'treeCount') * 50 * biomeSetting.treeDensity);
        }

        for (let i = 0; i < treeCount; i++) {
            const x = chunkPosition.x + (this.getDeterministicRandom(chunkX, chunkZ, 'treeX' + i) - 0.5) * this.chunkSize;
            const z = chunkPosition.z + (this.getDeterministicRandom(chunkX, chunkZ, 'treeZ' + i) - 0.5) * this.chunkSize;
            
            // 決定論的な木のタイプ選択
            const treeTypeName = biomeSetting.treeTypes[
                Math.floor(this.getDeterministicRandom(chunkX, chunkZ, 'treeType' + i) * biomeSetting.treeTypes.length)
            ];
            const treeType = this.treeTypes.find(type => type.name === treeTypeName);
            
            if (treeType) {
                const height = Math.floor(this.getDeterministicRandom(chunkX, chunkZ, 'treeHeight' + i) * 5) + 3;
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
        const debrisCount = Math.floor(this.getDeterministicRandom(chunkX, chunkZ, 'debrisCount') * 35 * biomeSetting.debrisDensity);
        for (let i = 0; i < debrisCount; i++) {
            const x = chunkPosition.x + (this.getDeterministicRandom(chunkX, chunkZ, 'debrisX' + i) - 0.5) * this.chunkSize;
            const z = chunkPosition.z + (this.getDeterministicRandom(chunkX, chunkZ, 'debrisZ' + i) - 0.5) * this.chunkSize;
            
            // 決定論的ながれきのタイプ選択
            const debrisTypeName = biomeSetting.debrisTypes[
                Math.floor(this.getDeterministicRandom(chunkX, chunkZ, 'debrisType' + i) * biomeSetting.debrisTypes.length)
            ];
            const debrisType = this.debrisTypes.find(type => type.name === debrisTypeName);
            
            if (debrisType) {
                const scale = 0.5 + this.getDeterministicRandom(chunkX, chunkZ, 'debrisScale' + i) * 1.5;
                const debris = this.fieldObject.createDebris(x, z, debrisType);
                if (debris && debris.mesh) {
                    debris.mesh.position.set(x, this.getHeightAt(x, z), z);
                    debris.mesh.scale.set(scale, scale, scale);
                    // 決定論的な回転
                    debris.mesh.rotation.y = this.getDeterministicRandom(chunkX, chunkZ, 'debrisRotY' + i) * Math.PI * 2;
                    debris.mesh.rotation.x = (this.getDeterministicRandom(chunkX, chunkZ, 'debrisRotX' + i) - 0.5) * 0.2;
                    debris.mesh.rotation.z = (this.getDeterministicRandom(chunkX, chunkZ, 'debrisRotZ' + i) - 0.5) * 0.2;
                    this.scene.add(debris.mesh);
                    chunkObjects.push(debris);
                    this.objects.push(debris);
                }
            }
        }

        // チャンクのオブジェクトを保存
        this.objectChunks.set(chunkKey, chunkObjects);
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

        // プレイヤーの位置とバイオーム情報を表示
        if (this.game && this.game.playerModel) {
            const playerPos = this.game.playerModel.getPosition();
            if (Math.abs(playerPos.x - x) < 1 && Math.abs(playerPos.z - z) < 1) {
                //console.log('現在のバイオーム:', closestBiome.type, '位置:', {x: x, z: z});
            }
        }
        
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
        
        /*
        // オブジェクトとの衝突判定
        for (const object of this.objects) {
            const dx = position.x - object.position.x;
            const dz = position.z - object.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance < radius + 1) {
                return true;
            }
        }
        */

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

    generateBuildings() {
        const buildingCount = Math.floor(this.random() * (GameConfig.MAP.BUILDINGS.MAX_COUNT - GameConfig.MAP.BUILDINGS.MIN_COUNT + 1)) + GameConfig.MAP.BUILDINGS.MIN_COUNT;
        
        for (let i = 0; i < buildingCount; i++) {
            let attempts = 0;
            let placed = false;
            
            while (!placed && attempts < 100) {
                // シード値に基づいてランダムな位置を生成
                const x = (this.random() - 0.5) * this.mapSize;
                const z = (this.random() - 0.5) * this.mapSize;
                
                // 建物のサイズを決定
                const width = Math.floor(this.random() * (GameConfig.MAP.BUILDINGS.MAX_WIDTH - GameConfig.MAP.BUILDINGS.MIN_WIDTH + 1)) + GameConfig.MAP.BUILDINGS.MIN_WIDTH;
                const height = Math.floor(this.random() * (GameConfig.MAP.BUILDINGS.MAX_HEIGHT - GameConfig.MAP.BUILDINGS.MIN_HEIGHT + 1)) + GameConfig.MAP.BUILDINGS.MIN_HEIGHT;
                
                // 建物の位置を計算
                const position = new THREE.Vector3(x, 0, z);
                
                // 他の建物との衝突チェック
                if (!this.checkBuildingCollision(position, width)) {
                    // 建物を作成
                    const building = this.createBuilding(position, width, height);
                    this.objects.push(building);
                    placed = true;
                }
                
                attempts++;
            }
        }
    }

    checkBuildingCollision(position, width) {
        const minDistance = GameConfig.MAP.BUILDINGS.MIN_DISTANCE;
        
        for (const object of this.objects) {
            if (object.userData && object.userData.type === 'building') {
                const distance = position.distanceTo(object.position);
                if (distance < minDistance) {
                    return true;
                }
            }
        }
        
        return false;
    }

    createBuilding(position, width, height) {
        // Implementation of createBuilding method
    }

    generateTrees() {
        // Implementation of generateTrees method
    }

    generateDebris() {
        // Implementation of generateDebris method
    }

    // 決定論的な乱数生成関数をクラスメソッドとして定義
    getDeterministicRandom(x, z, type) {
        // シード値の生成を複雑化
        const seed1 = this.seed + x * 1000 + z * 1000;
        const seed2 = type.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const combinedSeed = seed1 * seed2;

        // 複数の乱数生成器を組み合わせる
        const rng1 = new Math.seedrandom(combinedSeed.toString());
        const rng2 = new Math.seedrandom((combinedSeed * 1.618033988749895).toString()); // 黄金比を使用
        const rng3 = new Math.seedrandom((combinedSeed * 2.718281828459045).toString()); // 自然対数の底を使用

        // 複数の乱数を組み合わせて最終的な乱数を生成
        const random1 = rng1();
        const random2 = rng2();
        const random3 = rng3();

        // 異なる分布の乱数を組み合わせる
        const combinedRandom = (
            random1 * 0.5 + // 一様分布
            Math.sin(random2 * Math.PI * 2) * 0.25 + // 正弦波
            (random3 - 0.5) * 0.25 // 中心化された一様分布
        );

        // 結果を0-1の範囲に正規化
        return (combinedRandom + 0.5) % 1;
    }
} 