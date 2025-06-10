class MissionManager {
    constructor(game) {
        this.game = game;
        this.keyItem = null;
        this.keyItemIndicator = null;
        this.keyItemModel = null;
        console.log('MissionManager initialized');
        this.setupSocketEvents();
        this.updateCount = 0;
    }

    setupSocketEvents() {
        // キーアイテムの位置情報を受信
        this.game.socket.on('keyItemPosition', (data) => {
            this.updateKeyItemPosition(data);
        });

        // キーアイテムの収集通知を受信
        this.game.socket.on('keyItemCollected', (data) => {
            this.handleKeyItemCollected(data);
        });
    }

    updateKeyItemPosition(position) {
        console.log('キーアイテムの位置を更新:', position);
        this.keyItem = position;
        this.updateKeyItemModel();
        this.updateKeyItemIndicator();
    }

    updateKeyItemModel() {
        // 既存のモデルを削除
        if (this.keyItemModel) {
            this.game.scene.remove(this.keyItemModel);
            this.keyItemModel = null;
        }

        if (!this.keyItem) return;

        // キーアイテムの3Dモデルを作成
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhongMaterial({
            color: 0xFFD700,
            emissive: 0xFFD700,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });
        this.keyItemModel = new THREE.Mesh(geometry, material);
        
        // 位置を設定
        this.keyItemModel.position.set(this.keyItem.x, 0.5, this.keyItem.z);
        
        // シーンに追加
        this.game.scene.add(this.keyItemModel);

        // アニメーション用の変数
        this.keyItemModel.userData = {
            rotationSpeed: 0.02,
            floatSpeed: 0.001,
            floatHeight: 0.2,
            initialY: 0.5,
            time: 0
        };
    }

    updateKeyItemIndicator() {
        if (!this.keyItem || !this.game.playerModel) {
            console.log('キーアイテムまたはプレイヤーが存在しません');
            return;
        }

        // 既存のインジケーターを削除
        if (this.keyItemIndicator) {
            this.keyItemIndicator.remove();
            this.keyItemIndicator = null;
        }

        // プレイヤーの位置と向きを取得
        const playerPosition = this.game.playerModel.getPosition();
        const playerRotation = this.game.playerModel.rotation.y;
        
        // キーアイテムへの距離を計算
        const distance = Math.sqrt(
            Math.pow(this.keyItem.x - playerPosition.x, 2) +
            Math.pow(this.keyItem.z - playerPosition.z, 2)
        );

        // キーアイテムの位置をスクリーン座標に変換
        const keyItemPosition = new THREE.Vector3(this.keyItem.x, 0, this.keyItem.z);
        const screenPosition = this.game.getScreenPosition(keyItemPosition);

        // 画面内か画面外かを判定
        const isOnScreen = screenPosition.x >= 0 && screenPosition.x <= window.innerWidth &&
                          screenPosition.y >= 0 && screenPosition.y <= window.innerHeight;

        // 画面外の場合はインジケーターを表示しない
        if (!isOnScreen) {
            return;
        }

        // プレイヤーからキーアイテムへの方向ベクトルを計算
        const directionToKeyItem = new THREE.Vector3(
            this.keyItem.x - playerPosition.x,
            0,
            this.keyItem.z - playerPosition.z
        ).normalize();

        // プレイヤーの向きベクトルを計算
        const playerDirection = new THREE.Vector3(
            Math.sin(playerRotation),
            0,
            Math.cos(playerRotation)
        );

        // 2つのベクトルの内積を計算（-1から1の値）
        const dotProduct = directionToKeyItem.dot(playerDirection);

        // 内積が-0.5以下の場合（約120度以上）のみインジケーターを表示
        if (dotProduct > -0.5) {
            return;
        }

        // インジケーターを作成
        this.keyItemIndicator = document.createElement('div');
        this.keyItemIndicator.className = 'key-item-indicator';
        this.keyItemIndicator.innerHTML = `
            <i class="fas fa-vial"></i>
            <span>: ${Math.floor(distance)}m</span>
        `;
        this.keyItemIndicator.style.position = 'fixed';
        this.keyItemIndicator.style.color = '#FFD700';
        this.keyItemIndicator.style.fontSize = '10px';
        this.keyItemIndicator.style.pointerEvents = 'none';
        this.keyItemIndicator.style.zIndex = '1500';
        this.keyItemIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.keyItemIndicator.style.padding = '3px 8px';
        this.keyItemIndicator.style.borderRadius = '4px';
        this.keyItemIndicator.style.whiteSpace = 'nowrap';

        // キーアイテムの位置より少し上に表示
        this.keyItemIndicator.style.left = `${screenPosition.x}px`;
        this.keyItemIndicator.style.top = `${screenPosition.y - 150}px`;

        document.body.appendChild(this.keyItemIndicator);
    }

    handleKeyItemCollected(data) {
        console.log('キーアイテム収集:', data);
        // キーアイテム収集の通知を表示
        const notification = document.createElement('div');
        notification.className = 'mission-notification';
        notification.innerHTML = `${data.playerName}がキーアイテムを収集しました！`;
        notification.style.position = 'fixed';
        notification.style.top = '20%';
        notification.style.left = '50%';
        notification.style.transform = 'translate(-50%, -50%)';
        notification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        notification.style.color = '#FFD700';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '5px';
        notification.style.zIndex = '2000';

        document.body.appendChild(notification);

        // 3秒後に通知を消去
        setTimeout(() => {
            notification.remove();
        }, 3000);

        // キーアイテムの状態をリセット
        this.keyItem = null;
        if (this.keyItemIndicator) {
            this.keyItemIndicator.remove();
            this.keyItemIndicator = null;
        }
        if (this.keyItemModel) {
            this.game.scene.remove(this.keyItemModel);
            this.keyItemModel = null;
        }
    }

    update() {
        this.updateCount++;
        if(this.updateCount > 60){
            this.updateCount = 0;
            this.updateKeyItemIndicator();
        }
        if (this.keyItem && this.game.playerModel) {
            this.updateKeyItemIndicator();
            
            // キーアイテムのアニメーション
            if (this.keyItemModel) {
                // 回転
                this.keyItemModel.rotation.y += this.keyItemModel.userData.rotationSpeed;
                
                // 上下の浮遊
                this.keyItemModel.userData.time += this.keyItemModel.userData.floatSpeed;
                this.keyItemModel.position.y = this.keyItemModel.userData.initialY + 
                    Math.sin(this.keyItemModel.userData.time) * this.keyItemModel.userData.floatHeight;
            }
        }
    }
} 