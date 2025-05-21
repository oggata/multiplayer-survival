class RadioTower {
    constructor(scene, position) {
        this.scene = scene;
        this.position = position;
        this.repairProgress = 0;
        this.isRepaired = false;
        this.repairRadius = 10;
        this.repairRate = 0.5; // 1秒あたりの回復量（%）
        this.createTower();
        this.createRepairEffect();
        this.createProgressBar();
    }

    createTower() {
        // 電波塔のベース
        const baseGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
        const baseMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x888888,
            metalness: 0.8,
            roughness: 0.2
        });
        this.base = new THREE.Mesh(baseGeometry, baseMaterial);
        this.base.position.copy(this.position);
        this.base.position.y = 1;
        this.scene.add(this.base);

        // 電波塔の本体
        const towerGeometry = new THREE.CylinderGeometry(0.2, 0.2, 8, 8);
        const towerMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x666666,
            metalness: 0.9,
            roughness: 0.1
        });
        this.tower = new THREE.Mesh(towerGeometry, towerMaterial);
        this.tower.position.copy(this.position);
        this.tower.position.y = 6;
        this.scene.add(this.tower);

        // アンテナ
        const antennaGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 8);
        const antennaMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x444444,
            metalness: 1.0,
            roughness: 0.0
        });
        this.antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
        this.antenna.position.copy(this.position);
        this.antenna.position.y = 11;
        this.scene.add(this.antenna);

        // 破損状態の表現
        this.tower.rotation.x = Math.PI / 6;
        this.antenna.rotation.x = Math.PI / 4;
    }

    createRepairEffect() {
        // 修復エフェクト用のパーティクル
        const particleCount = 50;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        const particleMaterial = new THREE.PointsMaterial({
            color: 0x00ff00,
            size: 0.2,
            transparent: true,
            opacity: 0.6
        });

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            particlePositions[i3] = this.position.x;
            particlePositions[i3 + 1] = this.position.y + 5;
            particlePositions[i3 + 2] = this.position.z;
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        this.repairEffect = new THREE.Points(particleGeometry, particleMaterial);
        this.repairEffect.visible = false;
        this.scene.add(this.repairEffect);
    }

    createProgressBar() {
        // 進捗バーのコンテナ
        const container = document.createElement('div');
        container.className = 'radio-tower-progress';
        container.style.position = 'absolute';
        container.style.width = '100px';
        container.style.height = '10px';
        container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        container.style.borderRadius = '5px';
        container.style.overflow = 'hidden';
        document.body.appendChild(container);

        // 進捗バーの本体
        const progressBar = document.createElement('div');
        progressBar.style.width = '0%';
        progressBar.style.height = '100%';
        progressBar.style.backgroundColor = '#00ff00';
        progressBar.style.transition = 'width 0.3s';
        container.appendChild(progressBar);

        this.progressBar = {
            container: container,
            bar: progressBar
        };
    }

    update(playerPosition) {
        if (this.isRepaired) return;

        const distance = this.position.distanceTo(playerPosition);
        const isInRange = distance <= this.repairRadius;

        // 修復エフェクトの表示/非表示
        this.repairEffect.visible = isInRange;

        if (isInRange) {
            // 修復進捗の更新
            this.repairProgress = Math.min(100, this.repairProgress + this.repairRate);
            this.updateTowerState();
            this.updateProgressBar();
            this.updateRepairEffect();

            if (this.repairProgress >= 100) {
                this.completeRepair();
            }
        }

        // 進捗バーの位置更新
        this.updateProgressBarPosition();
    }

    updateTowerState() {
        // 修復進捗に応じて電波塔の傾きを調整
        const progress = this.repairProgress / 100;
        this.tower.rotation.x = Math.PI / 6 * (1 - progress);
        this.antenna.rotation.x = Math.PI / 4 * (1 - progress);
    }

    updateProgressBar() {
        this.progressBar.bar.style.width = `${this.repairProgress}%`;
    }

    updateProgressBarPosition() {
        const screenPosition = this.getScreenPosition();
        if (screenPosition) {
            this.progressBar.container.style.left = `${screenPosition.x - 50}px`;
            this.progressBar.container.style.top = `${screenPosition.y - 20}px`;
        }
    }

    updateRepairEffect() {
        const positions = this.repairEffect.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 1] += Math.random() * 0.1;
            if (positions[i + 1] > this.position.y + 8) {
                positions[i + 1] = this.position.y + 5;
            }
        }
        this.repairEffect.geometry.attributes.position.needsUpdate = true;
    }

    completeRepair() {
        this.isRepaired = true;
        this.repairEffect.visible = false;
        this.progressBar.container.style.display = 'none';
        this.tower.rotation.x = 0;
        this.antenna.rotation.x = 0;
    }

    getScreenPosition() {
        // シーンからカメラを取得
        const camera = this.scene.getObjectByProperty('type', 'PerspectiveCamera');
        if (!camera) return null;

        const vector = this.position.clone();
        vector.project(camera);
        return {
            x: (vector.x * 0.5 + 0.5) * window.innerWidth,
            y: (-vector.y * 0.5 + 0.5) * window.innerHeight
        };
    }

    getPosition() {
        return this.position;
    }

    isPlayerInRange(playerPosition) {
        return this.position.distanceTo(playerPosition) <= this.repairRadius;
    }
}

class RadioTowerManager {
    constructor(scene) {
        this.scene = scene;
        this.towers = [];
        this.nearestTowerIndicator = null;
        this.camera = scene.getObjectByProperty('type', 'PerspectiveCamera');
        this.createNearestTowerIndicator();
        this.initializeTowers();
    }

    createNearestTowerIndicator() {
        const container = document.createElement('div');
        container.id = 'nearestTowerIndicator';
        container.style.position = 'fixed';
        container.style.top = '100px';
        container.style.left = '50%';
        container.style.transform = 'translateX(-50%)';
        container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        container.style.color = 'white';
        container.style.padding = '10px';
        container.style.borderRadius = '5px';
        container.style.fontFamily = 'Arial, sans-serif';
        container.style.fontSize = '14px';
        container.style.zIndex = '1000';
        //document.body.appendChild(container);

        this.nearestTowerIndicator = container;
    }

    initializeTowers() {
        const mapSize = 100; // マップのサイズ
        const minDistance = 30; // 電波塔間の最小距離

        for (let i = 0; i < 4; i++) {
            let position;
            let attempts = 0;
            const maxAttempts = 100;

            do {
                position = new THREE.Vector3(
                    (Math.random() - 0.5) * mapSize,
                    0,
                    (Math.random() - 0.5) * mapSize
                );
                attempts++;
            } while (
                attempts < maxAttempts &&
                this.towers.some(tower => tower.getPosition().distanceTo(position) < minDistance)
            );

            if (attempts < maxAttempts) {
                const tower = new RadioTower(this.scene, position);
                this.towers.push(tower);
            }
        }
    }

    update(playerPosition) {
        // 各電波塔の更新
        this.towers.forEach(tower => tower.update(playerPosition));

        // 最も近い電波塔の情報を更新
        this.updateNearestTowerIndicator(playerPosition);
    }

    updateNearestTowerIndicator(playerPosition) {
        let nearestTower = null;
        let minDistance = Infinity;

        this.towers.forEach(tower => {
            const distance = tower.getPosition().distanceTo(playerPosition);
            if (distance < minDistance) {
                minDistance = distance;
                nearestTower = tower;
            }
        });

        if (nearestTower && this.camera) {
            const direction = new THREE.Vector3()
                .subVectors(nearestTower.getPosition(), playerPosition)
                .normalize();
            
            // カメラの向きを考慮して角度を計算
            const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
            const angle = Math.atan2(direction.x, direction.z) - Math.atan2(cameraDirection.x, cameraDirection.z);
            const degrees = THREE.MathUtils.radToDeg(angle);
            
            this.nearestTowerIndicator.textContent = 
                `最も近い電波塔: ${Math.round(minDistance)}m 方向: ${Math.round(degrees)}°`;
        }
    }

    getTowers() {
        return this.towers;
    }
}
