class MissionManager {
    constructor(game) {
        this.game = game;
        this.keyItems = new Map(); // 複数のキーアイテムを管理
        this.keyItemIndicators = new Map(); // 各キーアイテムのインジケーター
        this.keyItemModels = new Map(); // 各キーアイテムの3Dモデル
        this.timeLeft = null;
        this.hackingEffect = null; // ハッキングエフェクト用
        this.lastTimeLeftReceived = 0; // 追加: 最後にtimeLeftを受信した時刻
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

        // 残り時間を受信
        this.game.socket.on('keyItemCollectTimeLeft', (data) => {
            this.timeLeft = data.timeLeft;
            this.lastTimeLeftReceived = Date.now(); // 追加
        });
    }

    updateKeyItemPosition(position) {
        console.log('キーアイテムの位置を更新:', position);
        this.keyItems.set(position.id, position);
        this.updateKeyItemModel(position.id);
        this.updateKeyItemIndicator(position.id);
    }

    updateKeyItemModel(keyItemId) {
        const keyItem = this.keyItems.get(keyItemId);
        if (!keyItem) return;

        // 既存のモデルを削除
        if (this.keyItemModels.has(keyItemId)) {
            this.game.scene.remove(this.keyItemModels.get(keyItemId));
            this.keyItemModels.delete(keyItemId);
        }

        // キーアイテムの3Dモデルを作成
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhongMaterial({
            color: 0xFFD700,
            emissive: 0xFFD700,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });
        const keyItemModel = new THREE.Mesh(geometry, material);
        
        // 位置を設定
        keyItemModel.position.set(keyItem.x, 0.5, keyItem.z);
        
        // シーンに追加
        this.game.scene.add(keyItemModel);

        // アニメーション用の変数
        keyItemModel.userData = {
            rotationSpeed: 0.02,
            floatSpeed: 0.001,
            floatHeight: 0.2,
            initialY: 0.5,
            time: 0
        };

        // モデルを保存
        this.keyItemModels.set(keyItemId, keyItemModel);
    }

    updateKeyItemIndicator(keyItemId) {
        const keyItem = this.keyItems.get(keyItemId);
        if (!keyItem || !this.game.playerModel) {
            console.log('キーアイテムまたはプレイヤーが存在しません');
            return;
        }

        // 既存のインジケーターを削除
        if (this.keyItemIndicators.has(keyItemId)) {
            this.keyItemIndicators.get(keyItemId).remove();
            this.keyItemIndicators.delete(keyItemId);
        }

        // インジケーターを作成
        const keyItemIndicator = document.createElement('div');
        keyItemIndicator.className = 'key-item-indicator';
        keyItemIndicator.innerHTML = `
            <i class="fas fa-vial"></i>
            <span>: 0m</span>
        `;
        keyItemIndicator.style.position = 'fixed';
        keyItemIndicator.style.color = '#FFD700';
        keyItemIndicator.style.fontSize = '10px';
        keyItemIndicator.style.pointerEvents = 'none';
        keyItemIndicator.style.zIndex = '1500';
        keyItemIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        keyItemIndicator.style.padding = '3px 8px';
        keyItemIndicator.style.borderRadius = '4px';
        keyItemIndicator.style.whiteSpace = 'nowrap';
        keyItemIndicator.style.display = 'none'; // 初期状態では非表示

        document.body.appendChild(keyItemIndicator);
        
        // インジケーターを保存
        this.keyItemIndicators.set(keyItemId, keyItemIndicator);
    }

    // インジケーターの位置と内容を更新するメソッド
    updateKeyItemIndicatorPosition(keyItemId) {
        const keyItem = this.keyItems.get(keyItemId);
        const keyItemIndicator = this.keyItemIndicators.get(keyItemId);
        
        if (!keyItem || !keyItemIndicator || !this.game.playerModel) {
            return;
        }

        // プレイヤーの位置と向きを取得
        const playerPosition = this.game.playerModel.getPosition();
        const playerRotation = this.game.playerModel.rotation.y;
        
        // キーアイテムへの距離を計算
        const distance = Math.sqrt(
            Math.pow(keyItem.x - playerPosition.x, 2) +
            Math.pow(keyItem.z - playerPosition.z, 2)
        );

        // キーアイテムの位置をスクリーン座標に変換
        const keyItemPosition = new THREE.Vector3(keyItem.x, 0, keyItem.z);
        const screenPosition = this.game.getScreenPosition(keyItemPosition);

        // 画面内か画面外かを判定
        const isOnScreen = screenPosition.x >= 0 && screenPosition.x <= window.innerWidth &&
                          screenPosition.y >= 0 && screenPosition.y <= window.innerHeight;

        // 画面外の場合はインジケーターを非表示
        if (!isOnScreen) {
            keyItemIndicator.style.display = 'none';
            return;
        }

        // プレイヤーからキーアイテムへの方向ベクトルを計算
        const directionToKeyItem = new THREE.Vector3(
            keyItem.x - playerPosition.x,
            0,
            keyItem.z - playerPosition.z
        ).normalize();

        // プレイヤーの向きベクトルを計算
        const playerDirection = new THREE.Vector3(
            Math.sin(playerRotation),
            0,
            Math.cos(playerRotation)
        );

        // 2つのベクトルの内積を計算（-1から1の値）
        const dotProduct = directionToKeyItem.dot(playerDirection);

        // 残り時間の表示（ハッキングエフェクトの判定は別メソッドで行う）
        let timeLeftText = '';
        if (this.timeLeft !== null && distance <= 30) {
            const sec = Math.ceil(this.timeLeft / 1000);
            timeLeftText = `<span style='color:#0ff'>(${sec}sec)</span>`;
        }

        // 内積が-0.5以下の場合（約120度以上）のみインジケーターを表示
        if (dotProduct > -0.5) {
            keyItemIndicator.style.display = 'none';
        } else {
            // インジケーターを表示
            keyItemIndicator.style.display = 'block';
        }

        // インジケーターの内容を更新
        keyItemIndicator.innerHTML = `
            <i class="fas fa-vial"></i>
            <span>: ${Math.floor(distance)}m</span> ${timeLeftText}
        `;

        // インジケーターの位置を更新
        keyItemIndicator.style.left = `${screenPosition.x}px`;
        keyItemIndicator.style.top = `${screenPosition.y - 150}px`;
    }

    // ハッキングエフェクトの状態を更新するメソッド（新規追加）
    updateHackingEffect() {
        if (!this.game.playerModel || this.keyItems.size === 0) {
            return;
        }

        // プレイヤーの位置を取得
        const playerPosition = this.game.playerModel.getPosition();
        
        // 最も近いキーアイテムへの距離を計算
        let minDistance = Infinity;
        this.keyItems.forEach((keyItem) => {
            const distance = Math.sqrt(
                Math.pow(keyItem.x - playerPosition.x, 2) +
                Math.pow(keyItem.z - playerPosition.z, 2)
            );
            if (distance < minDistance) {
                minDistance = distance;
            }
        });

        // ハッキングゲージの制御（距離と時間に基づく）
        const now = Date.now();
        const timeLeftValid = (this.timeLeft !== null && (now - this.lastTimeLeftReceived) < 2000);
        
        if (timeLeftValid && minDistance <= 30) {
            if (!this.hackingEffect) {
                this.createHackingEffect();
            }
        } else {
            if (this.hackingEffect) {
                this.removeHackingEffect();
            }
        }
    }

    // ハッキングエフェクトを作成
    createHackingEffect() {
        // 既存のエフェクトを削除
        if (this.hackingEffect) {
            this.hackingEffect.remove();
        }

        // ハッキングゲージのコンテナを作成
        this.hackingEffect = document.createElement('div');
        this.hackingEffect.id = 'hacking-gauge';
        this.hackingEffect.style.position = 'fixed';
        this.hackingEffect.style.top = '20px';
        this.hackingEffect.style.right = '20px';
        this.hackingEffect.style.width = '300px';
        this.hackingEffect.style.height = '60px';
        this.hackingEffect.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.hackingEffect.style.border = '2px solid #00ff00';
        this.hackingEffect.style.borderRadius = '10px';
        this.hackingEffect.style.padding = '10px';
        this.hackingEffect.style.zIndex = '3000';
        this.hackingEffect.style.pointerEvents = 'none';
        this.hackingEffect.style.userSelect = 'none';
        this.hackingEffect.style.fontFamily = 'monospace';
        this.hackingEffect.style.color = '#00ff00';

        // タイトル
        const title = document.createElement('div');
        title.textContent = 'HACKING PROGRESS';
        title.style.fontSize = '12px';
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '5px';
        title.style.textAlign = 'center';

        // ゲージコンテナ
        const gaugeContainer = document.createElement('div');
        gaugeContainer.style.width = '100%';
        gaugeContainer.style.height = '20px';
        gaugeContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        gaugeContainer.style.border = '1px solid #00ff00';
        gaugeContainer.style.borderRadius = '5px';
        gaugeContainer.style.overflow = 'hidden';
        gaugeContainer.style.position = 'relative';

        // ゲージバー
        const gaugeBar = document.createElement('div');
        gaugeBar.id = 'hacking-gauge-bar';
        gaugeBar.style.height = '100%';
        gaugeBar.style.backgroundColor = '#00ff00';
        gaugeBar.style.width = '0%';
        gaugeBar.style.transition = 'width 0.3s ease';
        gaugeBar.style.position = 'relative';

        // ゲージ内のアニメーション効果
        const gaugeEffect = document.createElement('div');
        gaugeEffect.style.position = 'absolute';
        gaugeEffect.style.top = '0';
        gaugeEffect.style.left = '0';
        gaugeEffect.style.width = '100%';
        gaugeEffect.style.height = '100%';
        gaugeEffect.style.background = 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)';
        gaugeEffect.style.animation = 'gaugeShine 2s infinite';

        // 残り時間表示
        const timeDisplay = document.createElement('div');
        timeDisplay.id = 'hacking-time-display';
        timeDisplay.style.fontSize = '10px';
        timeDisplay.style.textAlign = 'center';
        timeDisplay.style.marginTop = '5px';
        timeDisplay.style.color = '#00ffff';

        // 要素を組み立て
        gaugeBar.appendChild(gaugeEffect);
        gaugeContainer.appendChild(gaugeBar);
        this.hackingEffect.appendChild(title);
        this.hackingEffect.appendChild(gaugeContainer);
        this.hackingEffect.appendChild(timeDisplay);

        // CSSアニメーションを追加
        if (!document.getElementById('gauge-animation-style')) {
            const style = document.createElement('style');
            style.id = 'gauge-animation-style';
            style.textContent = `
                @keyframes gaugeShine {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(this.hackingEffect);
    }

    // ゲージの更新
    updateHackingGauge() {
        if (!this.hackingEffect || !this.timeLeft) return;

        const gaugeBar = this.hackingEffect.querySelector('#hacking-gauge-bar');
        const timeDisplay = this.hackingEffect.querySelector('#hacking-time-display');
        
        if (gaugeBar && timeDisplay) {
            // 残り時間を秒に変換
            const timeLeftSeconds = this.timeLeft / 1000;
            
            // ゲージの進行度を計算（初期値を30秒と仮定）
            const initialTime = 30; // 初期時間（秒）
            const progress = Math.max(0, Math.min(100, ((initialTime - timeLeftSeconds) / initialTime) * 100));
            
            // ゲージバーの幅を更新
            gaugeBar.style.width = `${progress}%`;
            
            // 残り時間を表示
            timeDisplay.textContent = `残り時間: ${timeLeftSeconds.toFixed(1)}秒`;
            
            // ゲージの色を進行度に応じて変更
            if (progress < 30) {
                gaugeBar.style.backgroundColor = '#ff0000'; // 赤
            } else if (progress < 70) {
                gaugeBar.style.backgroundColor = '#ffff00'; // 黄
            } else {
                gaugeBar.style.backgroundColor = '#00ff00'; // 緑
            }
        }
    }

    // ハッキングゲージを削除
    removeHackingEffect() {
        if (this.hackingEffect) {
            this.hackingEffect.style.transition = 'opacity 0.3s ease-out';
            this.hackingEffect.style.opacity = '0';
            setTimeout(() => {
                if (this.hackingEffect && this.hackingEffect.parentNode) {
                    this.hackingEffect.remove();
                }
                this.hackingEffect = null;
            }, 300);
        }
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

        // ハッキングエフェクトを削除
        this.removeHackingEffect();

        // 収集されたキーアイテムを削除
        if (data.keyItemId) {
            this.keyItems.delete(data.keyItemId);
            
            // インジケーターを削除
            if (this.keyItemIndicators.has(data.keyItemId)) {
                this.keyItemIndicators.get(data.keyItemId).remove();
                this.keyItemIndicators.delete(data.keyItemId);
            }
            
            // 3Dモデルを削除
            if (this.keyItemModels.has(data.keyItemId)) {
                this.game.scene.remove(this.keyItemModels.get(data.keyItemId));
                this.keyItemModels.delete(data.keyItemId);
            }
        }

        // 追加: 安全ゾーン円柱を配置
        if (data.position) {
            const safeZoneRadius = this.game.fieldMap.SAFE_SPOT_DISTANCE || 20;
            const safeZoneHeight = 50;
            const safeZoneSegments = 32;
            const safeZoneGeometry = new THREE.CylinderGeometry(
                safeZoneRadius,
                safeZoneRadius,
                safeZoneHeight,
                safeZoneSegments
            );
            const safeZoneMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                transparent: true,
                opacity: 0.2,
                side: THREE.DoubleSide
            });
            const safeZoneMesh = new THREE.Mesh(safeZoneGeometry, safeZoneMaterial);
            // 地形の高さを取得
            let y = -5;
            if (this.game.getHeightAt) {
                y = this.game.getHeightAt(data.position.x, data.position.z);
            }
            safeZoneMesh.position.set(
                data.position.x,
                y,
                data.position.z
            );
            this.game.scene.add(safeZoneMesh);
        }
    }

    update() {
        this.updateCount++;
        if(this.updateCount > 60){
            this.updateCount = 0;
            // 全てのキーアイテムのインジケーターを更新
            this.keyItems.forEach((keyItem, keyItemId) => {
                this.updateKeyItemIndicator(keyItemId);
            });
        }
        
        // 全てのキーアイテムのアニメーションを更新
        this.keyItems.forEach((keyItem, keyItemId) => {
            const keyItemModel = this.keyItemModels.get(keyItemId);
            if (keyItemModel) {
                // 回転
                keyItemModel.rotation.y += keyItemModel.userData.rotationSpeed;
                
                // 上下の浮遊
                keyItemModel.userData.time += keyItemModel.userData.floatSpeed;
                keyItemModel.position.y = keyItemModel.userData.initialY + 
                    Math.sin(keyItemModel.userData.time) * keyItemModel.userData.floatHeight;
            }
        });
        
        // 毎フレームインジケーターの位置を更新（距離と方向の表示を正確にするため）
        if (this.game.playerModel) {
            this.keyItems.forEach((keyItem, keyItemId) => {
                this.updateKeyItemIndicatorPosition(keyItemId);
            });
        }

        // ハッキングエフェクトの状態を更新（プレイヤーの向きに関係なく）
        this.updateHackingEffect();
        this.updateHackingGauge(); // ゲージの更新を追加
    }
} 