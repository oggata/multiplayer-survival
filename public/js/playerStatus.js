class PlayerStatus {
    constructor(game) {
        this.game = game;
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.maxHunger = 100;
        this.hunger = 100;
        this.maxThirst = 100;
        this.thirst = this.maxThirst;
        this.maxStamina = 100;
        this.stamina = this.maxStamina;
        this.moveSpeedMultiplier = 0;
        this.effects = new Map(); // アクティブなエフェクトを管理

        this.healthDecreaseRate = 0.1;
        this.hungerDecreaseRate = GameConfig.STATUS.IDLE.HUNGER;
        this.thirstDecreaseRate = GameConfig.STATUS.IDLE.THIRST;
        this.staminaDecreaseRate = 20; // 走り時のスタミナ減少率（1秒あたり）
        this.staminaRecoveryRate = 10; // スタミナ回復率（1秒あたり）

        this.isGameOver = false;

        this.healthBar = document.querySelector('.status-bar.health .status-fill');
        this.healthText = document.getElementById('healthValue');
        this.hungerBar = document.querySelector('.status-bar.hunger .status-fill');
        this.hungerText = document.getElementById('hungerValue');
        this.thirstBar = document.querySelector('.status-bar.thirst .status-fill');
        this.thirstText = document.getElementById('thirstValue');
        this.staminaBar = document.querySelector('.status-bar.stamina .status-fill');
        this.staminaText = document.getElementById('staminaValue');
        this.hygieneBar = document.querySelector('.status-bar.hygiene .status-fill');
        this.hygieneText = document.getElementById('hygieneValue');

        // ステータスの減少率（1秒あたり）
        this.hungerDecreaseRate = GameConfig.PLAYER.hungerDecreaseRate;
        this.thirstDecreaseRate = GameConfig.PLAYER.thirstDecreaseRate;
        this.hygieneDecreaseRate = GameConfig.PLAYER.hygieneDecreaseRate;

        this.updateUI();
    }

    update(deltaTime) {
        if (this.isGameOver) return;
 
        // 飢えと喉の渇きを減少
        this.hunger = Math.max(0, this.hunger - this.hungerDecreaseRate);
        this.thirst = Math.max(0, this.thirst - this.thirstDecreaseRate);

        // エフェクトの更新
        this.updateEffects(deltaTime);
        
        // スタミナの更新
        this.updateStamina(deltaTime);
        
        this.updateHealthFromStatus(deltaTime);

        // UIの更新
        this.updateUI();
    }



    takeBulletDamage(damage) {
        // 弾に当たった場合、衛生状態が悪化
        this.hygiene = Math.max(0, this.hygiene - damage);
        this.updateUI();
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        this.updateUI();
    }

    eat(amount) {
        this.hunger = Math.min(this.maxHunger, this.hunger + amount);
        this.updateUI();
    }

    drink(amount) {
        this.thirst = Math.min(this.maxThirst, this.thirst + amount);
        this.updateUI();
    }



    clean(amount) {
        this.hygiene = Math.min(this.maxHygiene, this.hygiene + amount);
        this.updateUI();
    }

    reset() {
        this.health = GameConfig.PLAYER.MAX_HEALTH;
        this.hunger = 100;
        this.thirst = 100;
        this.stamina = this.maxStamina;
        this.hygiene = 100;
        this.isGameOver = false;
        document.getElementById('gameOver').style.display = 'none';
        this.updateUI();
    }

    updateUI() {
        if (this.healthBar) this.healthBar.style.width = `${this.health}%`;
        if (this.hungerBar) this.hungerBar.style.width = `${this.hunger}%`;
        if (this.thirstBar) this.thirstBar.style.width = `${this.thirst}%`;
        
        // スタミナゲージの更新
        if (this.staminaBar) {
            const staminaPercentage = (this.stamina / this.maxStamina) * 100;
            this.staminaBar.style.width = `${staminaPercentage}%`;
        }
    }

    
    isGameOver() {
        return this.isGameOver;
    }



    decreaseHunger(amount) {
        this.hunger = Math.max(0, this.hunger - amount);
        this.updateUI();
    }

    decreaseThirst(amount) {
        this.thirst = Math.max(0, this.thirst - amount);
        this.updateUI();
    }

    decreaseHygiene(amount) {
        this.hygiene = Math.max(0, this.hygiene - amount);
        this.updateUI();
    }

    // スタミナを減少させる（走り時）
    decreaseStamina(amount) {
        this.stamina = Math.max(0, this.stamina - amount);
        this.updateUI();
    }

    // スタミナを回復させる
    addStamina(amount) {
        this.stamina = Math.min(this.maxStamina, this.stamina + amount);
        this.updateUI();
    }

    // スタミナの更新処理
    updateStamina(deltaTime) {
        // 時間と共にスタミナを回復
        this.addStamina(this.staminaRecoveryRate * deltaTime);
    }

    updateHealthFromStatus(deltaTime) {
        
        // 空腹が30%以下になった場合、HPを徐々に減少
        if (this.hunger < 30) {
            const hungerDamage = (30 - this.hunger) * 0.01 * deltaTime;
            this.health = Math.max(0, this.health - hungerDamage);
        }
        // 空腹が70%以上ある場合、HPを徐々に回復
        else if (this.hunger > 70) {
            const hungerHeal = (this.hunger - 70) * 0.005 * deltaTime;
            this.health = Math.min(this.maxHealth, this.health + hungerHeal);
        }
        
        // 喉の渇きが30%以下になった場合、HPを徐々に減少
        if (this.thirst < 30) {
            const thirstDamage = (30 - this.thirst) * 0.01 * deltaTime;
            this.health = Math.max(0, this.health - thirstDamage);
        }
        // 喉の渇きが70%以上ある場合、HPを徐々に回復
        else if (this.thirst > 70) {
            const thirstHeal = (this.thirst - 70) * 0.005 * deltaTime;
            this.health = Math.min(this.maxHealth, this.health + thirstHeal);
        }
        
        if(this.health <= 0 && !this.isGameOver) {
            this.isGameOver = true;
            this.game.gameOver();
        }   
    }

    addHealth(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        this.updateStatusDisplay();
    }

    addHunger(amount) {
        this.hunger = Math.min(100, this.hunger + amount);
        this.updateStatusDisplay();
    }

    addThirst(amount) {
        this.thirst = Math.min(100, this.thirst + amount);
        this.updateStatusDisplay();
    }

    addEffect(itemType, effect) {

        console.log(effect);
        // 既存のエフェクトを更新または新規追加
        this.effects.set(itemType, {
            ...effect,
            startTime: Date.now()
        });
    }

    updateEffects(deltaTime) {
        const currentTime = Date.now();
        
        // 期限切れの効果を削除し、アクティブな効果を適用
        for (const [id, effect] of this.effects.entries()) {
            // 効果が期限切れかチェック
            if (currentTime >= effect.endTime) {
                console.log(`効果が期限切れ: ${effect.type}`);
                this.effects.delete(id);
                continue;
            }
            
            // 効果を適用
            this.applyEffect(effect, deltaTime);
        }
    }

    
    applyEffect(effect, deltaTime) {
        console.log('効果適用:', effect.type, effect);

        switch (effect.type) {
            case 'regeneration':
                // HPを回復
                this.heal(effect.value * deltaTime);
                break;
            case 'adrenaline':
                // 移動速度を上昇
                this.moveSpeedMultiplier = effect.value;
                break;
            case 'wepon':
                // 武器を強化（何もしない、武器マネージャーで処理）
                break;
            case 'chocolateBar':
                // 空腹を回復し続ける
                this.addHunger(effect.value * deltaTime);
                break;
            case 'energyDrink':
                // HPを回復し続ける
                this.heal(effect.value * deltaTime);
                break;
            case 'stamina':
                // スタミナを回復
                this.addStamina(effect.value * deltaTime);
                break;
            default:
                console.warn(`未知の効果タイプ: ${effect.type}`);
        }
    }

    getCurrentEffects() {
        const currentTime = Date.now();
        const activeEffects = {};

        // 各効果をチェック
        this.effects.forEach((effect, effectId) => {
            if (currentTime < effect.endTime) {
                // 効果がまだ有効な場合
                const remainingTime = (effect.endTime - currentTime) / 1000; // ミリ秒を秒に変換
                activeEffects[effectId] = {
                    ...effect,
                    remainingTime
                };
                //console.log(effectId);
            } else {
                // 効果が期限切れの場合、Mapから削除
                this.effects.delete(effectId);
            }
        });

        return activeEffects;
    }

    getCurrentWeponType() {
        const currentWeponTypes = [];
        const currentTime = Date.now();
        // 持続効果を確認
        this.effects.forEach(effect => {
            if (effect.type === 'wepon' && effect.endTime > currentTime) {
                currentWeponTypes.push(effect.name);
            }
        });
        return currentWeponTypes;
    }

    getWeaponConfig(weaponId) {
        // GameConfigから武器の設定を取得
        return GameConfig.WEAPONS[weaponId];
    }

    updateStatusDisplay() {
        // このメソッドは既存のものを使用
        this.updateUI();
    }

    addDurationEffect(effect) {
        const effectId = Date.now().toString();
        const startTime = Date.now();
        
        console.log('持続効果追加:', effect);
        
        // 効果をMapに追加
        this.effects.set(effectId, {
            ...effect,
            startTime,
            endTime: startTime + (effect.duration * 1000) // 秒をミリ秒に変換
        });
        
        console.log('現在の効果:', this.effects);
    }




} 