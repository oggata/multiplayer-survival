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

        // ハッキングエフェクトの制御（距離と時間に基づく）
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

        // ハッキングエフェクトのコンテナを作成
        this.hackingEffect = document.createElement('div');
        this.hackingEffect.id = 'hacking-effect';
        this.hackingEffect.style.position = 'fixed';
        this.hackingEffect.style.top = '0';
        this.hackingEffect.style.left = '0';
        this.hackingEffect.style.width = '100vw';
        this.hackingEffect.style.height = '100vh';
        this.hackingEffect.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
        this.hackingEffect.style.color = '#00ff00';
        this.hackingEffect.style.fontFamily = 'monospace';
        this.hackingEffect.style.fontSize = '12px';
        this.hackingEffect.style.lineHeight = '1.2';
        this.hackingEffect.style.overflow = 'hidden';
        this.hackingEffect.style.zIndex = '3000';
        this.hackingEffect.style.pointerEvents = 'none';
        this.hackingEffect.style.userSelect = 'none';

        // コードの流れを作成
        this.createCodeStream();

        document.body.appendChild(this.hackingEffect);
    }

    // コードの流れを作成
    createCodeStream() {
        const codeLines = [
            'ACCESSING MAINFRAME...',
            'BYPASSING SECURITY PROTOCOLS...',
            'DECRYPTING ENCRYPTION LAYERS...',
            'INITIALIZING QUANTUM DECODER...',
            'SCANNING FOR VULNERABILITIES...',
            'EXECUTING SQL INJECTION...',
            'CROSS-SITE SCRIPTING ATTEMPT...',
            'BUFFER OVERFLOW DETECTED...',
            'STACK SMASHING IN PROGRESS...',
            'HEAP SPRAYING TECHNIQUE...',
            'RETURN-ORIENTED PROGRAMMING...',
            'SHELLCODE EXECUTION...',
            'PRIVILEGE ESCALATION...',
            'ROOT ACCESS OBTAINED...',
            'DOWNLOADING CRITICAL DATA...',
            'ERASING DIGITAL FOOTPRINTS...',
            'COVERING TRACKS...',
            'MISSION ACCOMPLISHED...',
            '// HACKING SEQUENCE COMPLETE',
            '/* SECURITY BREACH SUCCESSFUL */',
            'function hackMainframe() {',
            '    const target = "keyItem";',
            '    const exploit = new Exploit();',
            '    exploit.execute();',
            '    return "SUCCESS";',
            '}',
            'class Exploit {',
            '    constructor() {',
            '        this.payload = "MALWARE";',
            '        this.vector = "ZERO_DAY";',
            '    }',
            '    execute() {',
            '        this.injectCode();',
            '        this.bypassFirewall();',
            '        this.extractData();',
            '    }',
            '}',
            'const malware = new Malware();',
            'malware.infect();',
            'malware.spread();',
            'malware.exfiltrate();',
            '// BACKDOOR INSTALLED',
            '// KEYLOGGER ACTIVE',
            '// DATA EXFILTRATION COMPLETE',
            'console.log("HACKING SUCCESSFUL");',
            'alert("SYSTEM COMPROMISED");',
            'document.cookie = "admin=true";',
            'localStorage.setItem("access", "granted");',
            'sessionStorage.setItem("privileges", "root");',
            'fetch("/api/admin", {method: "POST"});',
            'XMLHttpRequest.open("GET", "/secret");',
            'WebSocket.send("EXPLOIT");',
            'eval("malicious_code");',
            'setTimeout(() => hack(), 1000);',
            'setInterval(() => steal(), 500);',
            'requestAnimationFrame(() => attack());',
            'Promise.resolve().then(() => compromise());',
            'async function cyberAttack() {',
            '    await breach();',
            '    await infiltrate();',
            '    await extract();',
            '}',
            '// CYBER ATTACK IN PROGRESS',
            '// TARGET: KEY ITEM',
            '// STATUS: COMPROMISED',
            '// RESULT: SUCCESS'
        ];

        let currentLine = 0;
        const streamInterval = setInterval(() => {
            if (!this.hackingEffect || !this.hackingEffect.parentNode) {
                clearInterval(streamInterval);
                return;
            }

            // 最新の残り秒数を取得
            let timeLeftText = '';
            if (this.timeLeft !== null) {
                const sec = (this.timeLeft / 1000).toFixed(1);
                timeLeftText = `${sec}sec `;
            }

            // 新しいコード行を追加
            const codeLine = document.createElement('div');
            codeLine.style.padding = '2px 10px';
            codeLine.style.borderLeft = '2px solid #00ff00';
            codeLine.style.marginLeft = '10px';
            codeLine.style.opacity = '0';
            codeLine.style.transition = 'opacity 0.3s ease-in';
            codeLine.style.display = 'flex';
            codeLine.style.alignItems = 'center';
            
            // 残り秒数とコードを分けて表示
            const timeElement = document.createElement('span');
            timeElement.style.color = '#00ffff';
            timeElement.style.fontWeight = 'bold';
            timeElement.style.marginRight = '10px';
            timeElement.style.minWidth = '60px';
            timeElement.textContent = timeLeftText;
            
            const codeElement = document.createElement('span');
            codeElement.textContent = codeLines[currentLine % codeLines.length];
            
            codeLine.appendChild(timeElement);
            codeLine.appendChild(codeElement);

            this.hackingEffect.appendChild(codeLine);

            // フェードイン
            setTimeout(() => {
                codeLine.style.opacity = '1';
            }, 10);

            // 古い行を削除（画面が埋まらないように）
            if (this.hackingEffect.children.length > 30) {
                this.hackingEffect.removeChild(this.hackingEffect.firstChild);
            }

            currentLine++;

            // エフェクトの終了条件を削除して、ずっと流れ続けるようにする
            // if (currentLine >= 50) {
            //     clearInterval(streamInterval);
            //     setTimeout(() => {
            //         this.removeHackingEffect();
            //     }, 2000);
            // }
        }, 100);
    }

    // ハッキングエフェクトを削除
    removeHackingEffect() {
        if (this.hackingEffect) {
            this.hackingEffect.style.transition = 'opacity 0.5s ease-out';
            this.hackingEffect.style.opacity = '0';
            setTimeout(() => {
                if (this.hackingEffect && this.hackingEffect.parentNode) {
                    this.hackingEffect.remove();
                }
                this.hackingEffect = null;
            }, 500);
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
    }
} 