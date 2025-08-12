// UI関連のセットアップ関数群
class UISetup {
    constructor(game) {
        this.game = game;
    }

    setupJumpButton() {
        const jumpButton = document.getElementById('jumpButton');
        if (!jumpButton) return;

        jumpButton.addEventListener('click', () => {
            if (this.game.playerModel) {
                this.game.playerModel.startJump();
            }
        });
    }

    setupCameraButton() {
        // 設定画面のカメラモード選択を設定
        const cameraModeSelect = document.getElementById('cameraModeSelect');
        if (!cameraModeSelect) return;

        // 現在のカメラモードを選択状態に反映
        cameraModeSelect.value = this.game.cameraMode;

        cameraModeSelect.addEventListener('change', () => {
            // 視点モードを変更
            this.game.cameraMode = cameraModeSelect.value;
            // カメラ位置を更新
            this.game.updateCameraPosition();
        });
    }

    setupMapButton() {
        const mapButton = document.getElementById('mapButton');
        const mapModal = document.getElementById('mapModal');
        const closeMapModal = document.getElementById('closeMapModal');

        if (!mapButton || !mapModal || !closeMapModal) return;

        mapButton.addEventListener('click', () => {
            mapModal.style.display = 'block';
        });

        closeMapModal.addEventListener('click', () => {
            mapModal.style.display = 'none';
        });

        // モーダル外をクリックしても閉じる
        mapModal.addEventListener('click', (e) => {
            if (e.target === mapModal) {
                mapModal.style.display = 'none';
            }
        });
    }

    setupRankingButton() {
        // RankingManagerに委譲
        this.game.rankingManager = new RankingManager(this.game);
    }

    setupSettingsButton() {
        // SettingsManagerに委譲
        this.game.settingsManager = new SettingsManager(this.game);
    }

    // BGM開始のためのユーザーインタラクションUIを設定
    setupAudioInteractionUI() {
        // iOSデバイスかどうかを判定
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        
        // 音声開始ボタンを作成
        const audioButton = document.createElement('div');
        audioButton.id = 'audioStartButton';
        
        // iOS用の特別なメッセージ
        const iosMessage = isIOS ? 
            '<div style="font-size: 12px; margin-top: 5px; color: #ff6b6b;">iOS: Tap to start background music</div>' : 
            '<div style="font-size: 12px; margin-top: 5px; color: #ccc;">(due to the browsers autoplay policy)</div>';
        
        audioButton.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 25px;
                border-radius: 15px;
                text-align: center;
                z-index: 10000;
                cursor: pointer;
                font-size: 18px;
                border: 3px solid #4CAF50;
                box-shadow: 0 4px 20px rgba(0,0,0,0.5);
                min-width: 280px;
            ">
                <div style="margin-bottom: 15px;">
                    <i class="fas fa-volume-up" style="font-size: 32px; color: #4CAF50;"></i>
                </div>
                <div style="font-weight: bold; margin-bottom: 10px;">
                    ${isIOS ? '🎵 StartBGM' : 'Click to start BGM'}
                </div>
                ${iosMessage}
                ${isIOS ? '<div style="font-size: 11px; margin-top: 8px; color: #ffa500;">*Audio playback is limited on iOS.</div>' : ''}
            </div>
        `;
        
        document.body.appendChild(audioButton);
        
        // クリックイベントを設定
        const startBGMHandler = () => {
            console.log('音声開始ボタンがクリックされました');
            
            // iOS用の特別な処理
            if (isIOS) {
                this.startBGMForIOS();
            } else {
                // BGMを開始
                this.game.audioManager.playBGM();
            }
            
            // ボタンを非表示にする
            audioButton.style.display = 'none';
            
            // 成功メッセージを表示
            const successMessage = document.createElement('div');
            successMessage.innerHTML = `
                <div style="
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: rgba(76, 175, 80, 0.9);
                    color: white;
                    padding: 12px 18px;
                    border-radius: 8px;
                    z-index: 10001;
                    font-size: 14px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                ">
                    <i class="fas fa-check"></i> Start BGM
                </div>
            `;
            document.body.appendChild(successMessage);
            
            // 3秒後にメッセージを削除
            setTimeout(() => {
                if (successMessage.parentNode) {
                    successMessage.remove();
                }
            }, 3000);
        };
        
        // iOSではタッチイベントを優先
        if (isIOS) {
            audioButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                startBGMHandler();
            }, { passive: false });
        }
        
        audioButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            startBGMHandler();
        });
        
        // iOSではより長く表示する（15秒）
        const autoHideTime = isIOS ? 15000 : 5000;
        setTimeout(() => {
            if (audioButton.parentNode && !this.game.audioManager.bgmReady) {
                audioButton.style.display = 'none';
                console.log('音声開始ボタンを自動非表示にしました');
            }
        }, autoHideTime);
    }

    // iOS用のBGM開始処理
    startBGMForIOS() {
        console.log('iOS: 特別なBGM開始処理を実行');
        
        // AudioContextを確実に再開
        if (this.game.audioManager.audioContext && this.game.audioManager.audioContext.state === 'suspended') {
            this.game.audioManager.audioContext.resume().then(() => {
                console.log('iOS: AudioContext再開完了（UI経由）');
                this.game.audioManager.playBGM();
            }).catch(error => {
                console.error('iOS: AudioContext再開エラー（UI経由）:', error);
                // エラーが発生してもBGM再生を試行
                this.game.audioManager.playBGM();
            });
        } else {
            this.game.audioManager.playBGM();
        }
    }

    // iOSデバイス用の音声ハンドラーを設定
    setupIOSAudioHandlers() {
        console.log('iOSデバイス用の音声ハンドラーを設定中...');
        
        // ページの可視性変更時の処理
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // ページが非表示になった時にBGMを一時停止
                if (this.game.audioManager.bgm && !this.game.audioManager.bgm.paused) {
                    this.game.audioManager.bgm.pause();
                    console.log('iOS: ページ非表示でBGM一時停止');
                }
            } else {
                // ページが表示された時にBGMを再開
                if (this.game.audioManager.bgm && this.game.audioManager.bgmReady) {
                    this.game.audioManager.bgm.play().catch(error => {
                        console.log('iOS: ページ表示時のBGM再開エラー:', error);
                    });
                }
            }
        });
        
        // タッチイベントでAudioContextを再開
        const resumeAudioContext = () => {
            if (this.game.audioManager.audioContext && this.game.audioManager.audioContext.state === 'suspended') {
                this.game.audioManager.audioContext.resume().then(() => {
                    console.log('iOS: AudioContext再開完了');
                });
            }
        };
        
        // 最初のタッチでAudioContextを再開
        document.addEventListener('touchstart', resumeAudioContext, { once: true });
        document.addEventListener('touchend', resumeAudioContext, { once: true });
        
        // ゲームキャンバスでのタッチでも再開
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.addEventListener('touchstart', resumeAudioContext, { once: true });
            canvas.addEventListener('touchend', resumeAudioContext, { once: true });
        }
    }
}
