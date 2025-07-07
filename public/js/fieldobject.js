class FieldObject {
    constructor(scene,seed,fieldmap) {
        this.scene = scene;
        this.fieldmap = fieldmap;
        this.seed = seed || Math.random();
        Math.seedrandom(this.seed.toString());
        this.rng = Math.random;
        
        // GLTFLoaderのインスタンスを作成
        this.gltfLoader = new THREE.GLTFLoader();
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
        this.fieldmap.scene.add(building);
        this.fieldmap.objects.push(building);
        
        // 壊れた窓を追加
        this.createBrokenWindows(building, buildingWidth, buildingHeight, buildingDepth);
        
        // 破壊レベルが高い場合は周囲にがれきを追加
        if (destructionLevel > 0.5) {
            for (let i = 0; i < destructionLevel * 15; i++) {  // がれきの数を増加
                const debrisX = position.x + (this.rng() - 0.5) * buildingWidth * 3;  // がれきの範囲を拡大
                const debrisZ = position.z + (this.rng() - 0.5) * buildingDepth * 3;
               // this.createDebris(debrisX, debrisZ);
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
            //this.createCollapsedWalls(building, buildingWidth, buildingHeight, buildingDepth, destructionLevel);
        }
        return { mesh: building, position: building.position };
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
    
    
     createCar2(x, z, rotation) {
        const carGroup = new THREE.Group();
        carGroup.position.set(x, 0, z);


        const modelPaths = [
            '/gltf/car.glb'
        ];
        const modelPath = modelPaths[Math.floor(this.rng() * modelPaths.length)];

        // GLTFモデルをロード
        this.gltfLoader.load(modelPath, (gltf) => {
            const model = gltf.scene;
            
            // モデルのスケールを調整
            var scale = 1;
            model.scale.set(scale, scale, scale);
            
            // モデルの位置を調整
            model.position.y = 0;
            // 車の回転を設定
            if (rotation !== undefined) {
                model.rotation.y = rotation;
            }
                        
            // モデルをグループに追加
            carGroup.add(model);
            
            // マテリアルの調整と影の設定
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // マテリアルが存在する場合、明度を調整
                    if (child.material) {
                        // 既存のマテリアルをコピーして調整
                        const originalMaterial = child.material;
                        const adjustedMaterial = originalMaterial.clone();
                        
                        // 色を明るくする
                        if (adjustedMaterial.color) {
                            const color = adjustedMaterial.color.clone();
                            color.multiplyScalar(1.5); // 明度を1.5倍に
                            adjustedMaterial.color = color;
                        }
                        
                        // emissiveを追加して明るさを向上
                        adjustedMaterial.emissive = new THREE.Color(0x222222);
                        adjustedMaterial.emissiveIntensity = 0.1;
                        
                        // roughnessを下げて反射を増加
                        if (adjustedMaterial.roughness !== undefined) {
                            adjustedMaterial.roughness = Math.max(0.1, adjustedMaterial.roughness * 0.8);
                        }
                        
                        child.material = adjustedMaterial;
                    }
                }
            });
        });

        return { mesh: carGroup, position: carGroup.position };
    }
    




    createTree(x, z, height, specifiedType = null) {
        const treeGroup = new THREE.Group();
        treeGroup.position.set(x, 0, z);

        // 指定された木の種類を使用するか、ランダムに選択
        const treeType = specifiedType ? 
            this.fieldmap.treeTypes.find(type => type.name === specifiedType) : 
            this.fieldmap.treeTypes[Math.floor(this.rng() * this.fieldmap.treeTypes.length)];
        
        // GLTFモデルのパスを選択
        const modelPaths = [
            '/gltf/tree001.glb'
        ];
        const modelPath = modelPaths[Math.floor(this.rng() * modelPaths.length)];

        // GLTFモデルをロード
        this.gltfLoader.load(modelPath, (gltf) => {
            const model = gltf.scene;
            
            // モデルのスケールを調整
            //var scale = height / 10; // 高さに応じてスケールを調整
            var scale = 0.5;
            model.scale.set(scale, scale, scale);
            
            // モデルの位置を調整
            model.position.y = 0;
            
            // モデルをグループに追加
            treeGroup.add(model);
            
            // マテリアルの調整と影の設定
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // マテリアルが存在する場合、明度を調整
                    if (child.material) {
                        // 既存のマテリアルをコピーして調整
                        const originalMaterial = child.material;
                        const adjustedMaterial = originalMaterial.clone();
                        
                        // 色を明るくする
                        if (adjustedMaterial.color) {
                            const color = adjustedMaterial.color.clone();
                            color.multiplyScalar(1.3); // 明度を1.3倍に
                            adjustedMaterial.color = color;
                        }
                        
                        // emissiveを追加して明るさを向上
                        adjustedMaterial.emissive = new THREE.Color(0x111111);
                        adjustedMaterial.emissiveIntensity = 0.05;
                        
                        // roughnessを下げて反射を増加
                        if (adjustedMaterial.roughness !== undefined) {
                            adjustedMaterial.roughness = Math.max(0.2, adjustedMaterial.roughness * 0.9);
                        }
                        
                        child.material = adjustedMaterial;
                    }
                }
            });
        });

        return { mesh: treeGroup, position: treeGroup.position };
    }
    
    createRock(x, z, size) {
        const rockGroup = new THREE.Group();
        rockGroup.position.set(x, 0, z);

        const rockType = this.fieldmap.rockTypes[Math.floor(this.rng() * this.fieldmap.rockTypes.length)];
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
        this.fieldmap.objects.push(ruins);
    }
    
    createDebris(x, z) {
        const debrisGroup = new THREE.Group();
        debrisGroup.position.set(x, 0, z);

        const debrisType = this.fieldmap.debrisTypes[Math.floor(this.rng() * this.fieldmap.debrisTypes.length)];
        
        // メインのがれきのサイズ
        const mainSize = debrisType.size * (0.5 + this.rng());
        
        // がれきの種類に応じた形状とマテリアルを設定
        let mainDebrisGeometry;
        let mainDebrisMaterial;
        
        switch (debrisType.name) {
            case 'concrete':
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
        // がれきのグループ全体をランダムに回転
        debrisGroup.rotation.y = this.rng() * Math.PI * 2;
        this.fieldmap.scene.add(debrisGroup);
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
        this.fieldmap.scene.add(factory);
        this.fieldmap.objects.push(factory);
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
        this.fieldmap.scene.add(tank);
        this.fieldmap.objects.push(tank);
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