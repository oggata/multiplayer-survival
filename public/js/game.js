class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas'), antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        this.socket = io();
        this.players = new Map();
        this.bullets = [];
        this.moveSpeed = 0.5;
        this.rotationSpeed = 0.03;
        this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        this.setupScene();
        this.setupControls();
        this.setupSocketEvents();
        this.animate();
    }

    setupScene() {
        // ライティング
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(0, 1, 0);
        this.scene.add(directionalLight);

        // 地面
        const groundGeometry = new THREE.PlaneGeometry(5000, 5000);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x808080,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        this.scene.add(ground);

        // カメラの初期位置
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
    }

    setupControls() {
        // キーボードコントロール
        this.keys = {};
        window.addEventListener('keydown', (e) => this.keys[e.key] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key] = false);

        // マウスコントロール
        if (!this.isMobile) {
            document.addEventListener('mousemove', (e) => {
                if (document.pointerLockElement === document.body) {
                    this.camera.rotation.y -= e.movementX * 0.002;
                    this.camera.rotation.x -= e.movementY * 0.002;
                    this.camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.camera.rotation.x));
                }
            });

            document.addEventListener('click', () => {
                document.body.requestPointerLock();
            });
        }

        // モバイルコントロール
        if (this.isMobile) {
            this.setupMobileControls();
        }

        // 発射ボタン
        const shootButton = document.getElementById('shootButton');
        shootButton.addEventListener('click', () => this.shoot());
    }

    setupMobileControls() {
        const leftJoystick = document.getElementById('leftJoystick');
        const rightJoystick = document.getElementById('rightJoystick');
        
        // 左ジョイスティック（移動用）
        this.leftJoystick = {
            element: leftJoystick,
            active: false,
            x: 0,
            y: 0
        };

        // 右ジョイスティック（視点用）
        this.rightJoystick = {
            element: rightJoystick,
            active: false,
            x: 0,
            y: 0
        };

        // タッチイベントの設定
        [this.leftJoystick, this.rightJoystick].forEach(joystick => {
            joystick.element.addEventListener('touchstart', (e) => {
                joystick.active = true;
                const touch = e.touches[0];
                const rect = joystick.element.getBoundingClientRect();
                joystick.x = (touch.clientX - rect.left - rect.width/2) / (rect.width/2);
                joystick.y = (touch.clientY - rect.top - rect.height/2) / (rect.height/2);
            });

            joystick.element.addEventListener('touchmove', (e) => {
                if (joystick.active) {
                    const touch = e.touches[0];
                    const rect = joystick.element.getBoundingClientRect();
                    joystick.x = (touch.clientX - rect.left - rect.width/2) / (rect.width/2);
                    joystick.y = (touch.clientY - rect.top - rect.height/2) / (rect.height/2);
                }
            });

            joystick.element.addEventListener('touchend', () => {
                joystick.active = false;
                joystick.x = 0;
                joystick.y = 0;
            });
        });
    }

    setupSocketEvents() {
        this.socket.on('currentPlayers', (players) => {
            players.forEach(player => this.addPlayer(player));
        });

        this.socket.on('newPlayer', (player) => {
            this.addPlayer(player);
        });

        this.socket.on('playerMoved', (player) => {
            const existingPlayer = this.players.get(player.id);
            if (existingPlayer) {
                existingPlayer.position.copy(player.position);
                existingPlayer.rotation.y = player.rotation.y;
            }
        });

        this.socket.on('playerDisconnected', (playerId) => {
            this.removePlayer(playerId);
        });

        this.socket.on('bulletFired', (data) => {
            this.createBullet(data.position, data.direction, data.playerId);
        });
    }

    addPlayer(playerData) {
        const geometry = new THREE.BoxGeometry(1, 2, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        const playerMesh = new THREE.Mesh(geometry, material);
        
        playerMesh.position.set(
            playerData.position.x,
            playerData.position.y + 1,
            playerData.position.z
        );
        
        this.scene.add(playerMesh);
        this.players.set(playerData.id, playerMesh);
    }

    removePlayer(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            this.scene.remove(player);
            this.players.delete(playerId);
        }
    }

    shoot() {
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        
        this.socket.emit('shoot', {
            position: this.camera.position.clone(),
            direction: direction
        });
        
        this.createBullet(this.camera.position.clone(), direction, this.socket.id);
    }

    createBullet(position, direction, playerId) {
        const geometry = new THREE.SphereGeometry(0.1);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const bullet = new THREE.Mesh(geometry, material);
        
        bullet.position.copy(position);
        bullet.velocity = direction.multiplyScalar(2);
        bullet.playerId = playerId;
        
        this.scene.add(bullet);
        this.bullets.push(bullet);
    }

    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.position.add(bullet.velocity);

            // 弾の衝突判定
            this.players.forEach((player, playerId) => {
                if (playerId !== bullet.playerId) {
                    const distance = bullet.position.distanceTo(player.position);
                    if (distance < 1) {
                        this.socket.emit('playerHit', { targetId: playerId });
                        this.scene.remove(bullet);
                        this.bullets.splice(i, 1);
                    }
                }
            });

            // 弾の寿命管理
            if (bullet.position.length() > 1000) {
                this.scene.remove(bullet);
                this.bullets.splice(i, 1);
            }
        }
    }

    updatePlayer() {
        let moveX = 0;
        let moveZ = 0;
        let rotateY = 0;

        if (this.isMobile) {
            if (this.leftJoystick.active) {
                moveX = this.leftJoystick.x * this.moveSpeed;
                moveZ = -this.leftJoystick.y * this.moveSpeed;
            }
            if (this.rightJoystick.active) {
                rotateY = this.rightJoystick.x * this.rotationSpeed;
            }
        } else {
            // キーボードコントロール
            if (this.keys['w']) moveZ = -this.moveSpeed;
            if (this.keys['s']) moveZ = this.moveSpeed;
            if (this.keys['a']) moveX = -this.moveSpeed;
            if (this.keys['d']) moveX = this.moveSpeed;
            if (this.keys['ArrowLeft']) rotateY = -this.rotationSpeed;
            if (this.keys['ArrowRight']) rotateY = this.rotationSpeed;
            if (this.keys[' ']) this.shoot();
        }

        // プレイヤーの移動と回転
        this.camera.position.x += moveX * Math.cos(this.camera.rotation.y) + moveZ * Math.sin(this.camera.rotation.y);
        this.camera.position.z += moveZ * Math.cos(this.camera.rotation.y) - moveX * Math.sin(this.camera.rotation.y);
        this.camera.rotation.y += rotateY;

        // サーバーに位置情報を送信
        this.socket.emit('playerMove', {
            position: this.camera.position,
            rotation: { y: this.camera.rotation.y }
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.updatePlayer();
        this.updateBullets();
        this.renderer.render(this.scene, this.camera);
    }
}

// ゲームの開始
window.addEventListener('load', () => {
    new Game();
}); 