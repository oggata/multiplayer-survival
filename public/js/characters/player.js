class Player {
    constructor(game) {
        this.game = game;
        this.model = null;
        this.status = new PlayerStatus();
        this.position = new THREE.Vector3();
        this.rotation = new THREE.Euler();
        this.velocity = new THREE.Vector3();
        this.isMoving = false;
        this.isJumping = false;
        this.canShoot = true;
        this.lastShootTime = 0;
        this.shootCooldown = 500; // ミリ秒
    }

    // プレイヤーモデルを作成
    createModel() {
        // プレイヤーモデルの作成ロジック
        // この部分は既存のgame.jsのcreatePlayerModelメソッドから移植
    }

    // 位置を設定
    setPosition(x, y, z) {
        this.position.set(x, y, z);
        if (this.model) {
            this.model.position.copy(this.position);
        }
    }

    // 位置を取得
    getPosition() {
        return this.position.clone();
    }

    // 回転を設定
    setRotation(x, y, z) {
        this.rotation.set(x, y, z);
        if (this.model) {
            this.model.rotation.copy(this.rotation);
        }
    }

    // 回転を取得
    getRotation() {
        return this.rotation.clone();
    }

    // 移動
    move(direction, speed) {
        this.isMoving = true;
        this.velocity.copy(direction).multiplyScalar(speed);
    }

    // 停止
    stop() {
        this.isMoving = false;
        this.velocity.set(0, 0, 0);
    }

    // ジャンプ
    jump() {
        if (!this.isJumping) {
            this.isJumping = true;
            this.velocity.y = 10;
        }
    }

    // 射撃
    shoot() {
        const now = Date.now();
        if (this.canShoot && now - this.lastShootTime >= this.shootCooldown) {
            this.lastShootTime = now;
            this.canShoot = false;
            
            // 射撃ロジック
            if (this.game.weponManager) {
                this.game.weponManager.shoot(this);
            }
            
            setTimeout(() => {
                this.canShoot = true;
            }, this.shootCooldown);
        }
    }

    // 射撃開始
    startShooting() {
        this.shoot();
    }

    // 射撃停止
    stopShooting() {
        // 射撃停止のロジック
    }

    // ダメージを受ける
    takeDamage(damage) {
        this.status.health = Math.max(0, this.status.health - damage);
        this.status.updateGauges();
        
        if (this.status.health <= 0) {
            this.die();
        }
    }

    // 死亡
    die() {
        // 死亡処理
        this.game.isGameOver = true;
        this.game.gameOverElement.style.display = 'block';
    }

    // 更新
    update(deltaTime) {
        // 重力の適用
        this.velocity.y -= 9.8 * deltaTime;
        
        // 位置の更新
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // 地面との衝突判定
        if (this.position.y <= 0) {
            this.position.y = 0;
            this.velocity.y = 0;
            this.isJumping = false;
        }
        
        // モデルの位置を更新
        if (this.model) {
            this.model.position.copy(this.position);
        }
        
        // ステータスの更新
        this.status.update(deltaTime);
    }

    // リセット
    reset() {
        this.status.reset();
        this.isGameOver = false;
        this.velocity.set(0, 0, 0);
        this.isMoving = false;
        this.isJumping = false;
    }
} 