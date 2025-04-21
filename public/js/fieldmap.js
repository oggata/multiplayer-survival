class FieldMap {
    constructor(scene) {
        this.scene = scene;
        this.mapObjects = [];
        this.createMap();
    }

    createMap() {
        // 地面の上に配置するマップオブジェクトを作成
        this.createWalls();
        this.createObstacles();
        this.createPlatforms();
    }

    createWalls() {
        // 壁のマテリアル
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.7,
            metalness: 0.2
        });

        // 外壁を作成
        const wallHeight = 5;
        const wallThickness = 1;
        const mapSize = 100;

        // 北の壁
        const northWall = new THREE.Mesh(
            new THREE.BoxGeometry(mapSize, wallHeight, wallThickness),
            wallMaterial
        );
        northWall.position.set(0, wallHeight / 2, -mapSize / 2);
        northWall.castShadow = true;
        northWall.receiveShadow = true;
        this.scene.add(northWall);
        this.mapObjects.push(northWall);

        // 南の壁
        const southWall = new THREE.Mesh(
            new THREE.BoxGeometry(mapSize, wallHeight, wallThickness),
            wallMaterial
        );
        southWall.position.set(0, wallHeight / 2, mapSize / 2);
        southWall.castShadow = true;
        southWall.receiveShadow = true;
        this.scene.add(southWall);
        this.mapObjects.push(southWall);

        // 東の壁
        const eastWall = new THREE.Mesh(
            new THREE.BoxGeometry(wallThickness, wallHeight, mapSize),
            wallMaterial
        );
        eastWall.position.set(mapSize / 2, wallHeight / 2, 0);
        eastWall.castShadow = true;
        eastWall.receiveShadow = true;
        this.scene.add(eastWall);
        this.mapObjects.push(eastWall);

        // 西の壁
        const westWall = new THREE.Mesh(
            new THREE.BoxGeometry(wallThickness, wallHeight, mapSize),
            wallMaterial
        );
        westWall.position.set(-mapSize / 2, wallHeight / 2, 0);
        westWall.castShadow = true;
        westWall.receiveShadow = true;
        this.scene.add(westWall);
        this.mapObjects.push(westWall);
    }

    createObstacles() {
        // 障害物のマテリアル
        const obstacleMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.8,
            metalness: 0.1
        });

        // 中央の大きな障害物
        const centralObstacle = new THREE.Mesh(
            new THREE.BoxGeometry(10, 3, 10),
            obstacleMaterial
        );
        centralObstacle.position.set(0, 1.5, 0);
        centralObstacle.castShadow = true;
        centralObstacle.receiveShadow = true;
        this.scene.add(centralObstacle);
        this.mapObjects.push(centralObstacle);

        // 四隅の障害物
        const cornerPositions = [
            { x: 30, z: 30 },
            { x: 30, z: -30 },
            { x: -30, z: 30 },
            { x: -30, z: -30 }
        ];

        cornerPositions.forEach(pos => {
            const cornerObstacle = new THREE.Mesh(
                new THREE.BoxGeometry(5, 2, 5),
                obstacleMaterial
            );
            cornerObstacle.position.set(pos.x, 1, pos.z);
            cornerObstacle.castShadow = true;
            cornerObstacle.receiveShadow = true;
            this.scene.add(cornerObstacle);
            this.mapObjects.push(cornerObstacle);
        });

        // ランダムな障害物
        for (let i = 0; i < 10; i++) {
            const size = Math.random() * 3 + 1;
            const height = Math.random() * 2 + 1;
            const x = (Math.random() - 0.5) * 80;
            const z = (Math.random() - 0.5) * 80;
            
            // 中央の障害物との距離をチェック
            if (Math.sqrt(x * x + z * z) < 15) continue;
            
            const obstacle = new THREE.Mesh(
                new THREE.BoxGeometry(size, height, size),
                obstacleMaterial
            );
            obstacle.position.set(x, height / 2, z);
            obstacle.castShadow = true;
            obstacle.receiveShadow = true;
            this.scene.add(obstacle);
            this.mapObjects.push(obstacle);
        }
    }

    createPlatforms() {
        // プラットフォームのマテリアル
        const platformMaterial = new THREE.MeshStandardMaterial({
            color: 0x4B0082,
            roughness: 0.6,
            metalness: 0.3
        });

        // 浮遊プラットフォーム
        const platformPositions = [
            { x: 20, y: 3, z: 20 },
            { x: -20, y: 3, z: -20 },
            { x: 20, y: 3, z: -20 },
            { x: -20, y: 3, z: 20 }
        ];

        platformPositions.forEach(pos => {
            const platform = new THREE.Mesh(
                new THREE.BoxGeometry(8, 0.5, 8),
                platformMaterial
            );
            platform.position.set(pos.x, pos.y, pos.z);
            platform.castShadow = true;
            platform.receiveShadow = true;
            this.scene.add(platform);
            this.mapObjects.push(platform);
        });
    }

    // マップオブジェクトの位置を取得するメソッド
    getMapObjects() {
        return this.mapObjects;
    }

    // マップオブジェクトとの衝突判定
    checkCollision(position, radius) {
        for (const obj of this.mapObjects) {
            // 簡易的な衝突判定（AABB）
            const objBox = new THREE.Box3().setFromObject(obj);
            const playerBox = new THREE.Box3().setFromCenterAndSize(
                position,
                new THREE.Vector3(radius * 2, 2, radius * 2)
            );
            
            if (objBox.intersectsBox(playerBox)) {
                return true;
            }
        }
        return false;
    }
    
    // 安全なスポーン位置を取得するメソッド
    getSafeSpawnPosition() {
        const mapSize = 100;
        const playerRadius = 1;
        const maxAttempts = 50;
        
        // ランダムな位置を試す
        for (let i = 0; i < maxAttempts; i++) {
            // マップの端から少し内側の範囲でランダムな位置を生成
            const margin = 10;
            const x = (Math.random() - 0.5) * (mapSize - margin * 2);
            const z = (Math.random() - 0.5) * (mapSize - margin * 2);
            const position = new THREE.Vector3(x, 0, z);
            
            // 衝突判定
            if (!this.checkCollision(position, playerRadius)) {
                return position;
            }
        }
        
        // 安全な位置が見つからない場合はデフォルト位置を返す
        console.warn('安全なスポーン位置が見つかりませんでした。デフォルト位置を使用します。');
        return new THREE.Vector3(0, 0, 0);
    }
} 