class PlayerStatus {
    constructor() {
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.maxHunger = 100;
        this.hunger = this.maxHunger;
        this.maxThirst = 100;
        this.thirst = this.maxThirst;
        this.maxBleeding = 100;
        this.bleeding = 0;
        this.maxTemperature = 100;
        this.temperature = 50;
        this.maxHygiene = 100;
        this.hygiene = this.maxHygiene;
        this.infection = 0;
        this.pain = 0;
        this.staminaRegenMultiplier = 1.0;
        this.moveSpeedMultiplier = 1.0;
        this.effects = new Map(); // アクティブなエフェクトを管理

        this.healthDecreaseRate = 0.1;
        this.hungerDecreaseRate = GameConfig.STATUS.IDLE.HUNGER;
        this.thirstDecreaseRate = GameConfig.STATUS.IDLE.THIRST;
        this.bleedingIncreaseRate = 0.1;
        this.temperatureChangeRate = 0.1;
        this.hygieneDecreaseRate = 0.05;

        this.isGameOver = false;

        this.healthBar = document.querySelector('#health .status-fill');
        this.healthText = document.getElementById('healthValue');
        this.hungerBar = document.querySelector('#hunger .status-fill');
        this.hungerText = document.getElementById('hungerValue');
        this.thirstBar = document.querySelector('#thirst .status-fill');
        this.thirstText = document.getElementById('thirstValue');
        this.bleedingBar = document.querySelector('#bleeding .status-fill');
        this.bleedingText = document.getElementById('bleedingValue');
        this.temperatureBar = document.querySelector('#temperature .status-fill');
        this.temperatureText = document.getElementById('temperatureValue');
        this.hygieneBar = document.querySelector('#hygiene .status-fill');
        this.hygieneText = document.getElementById('hygieneValue');

        this.updateUI();
    }

    update(deltaTime) {
        if (this.isGameOver) return;

        // 時間経過で空腹と喉の渇きが減少
        this.decreaseHunger(this.hungerDecreaseRate * deltaTime);
        this.decreaseThirst(this.thirstDecreaseRate * deltaTime);
        
        /*
        // 出血の増加
        if (this.bleeding > 0) {
            this.increaseBleeding(this.bleedingIncreaseRate * deltaTime);
        }
        */
        // 体温の変化（環境に応じて）
        this.adjustTemperature(this.temperatureChangeRate * deltaTime);
        
        // 衛生の減少
        this.decreaseHygiene(this.hygieneDecreaseRate * deltaTime);
        
        // ステータスによるHP減少
        this.updateHealthFromStatus(deltaTime);
        
        // エフェクトの更新
        this.updateEffects(deltaTime);
        
        // UIの更新
        this.updateUI();
    }

    takeDamage(damage) {
        if (this.isGameOver) return;
        this.health = Math.max(0, this.health - damage);
        if (this.health <= 0) {
            this.isGameOver = true;
            document.getElementById('gameOver').style.display = 'block';
        }
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

    stopBleeding(amount) {
        this.bleeding = Math.max(0, this.bleeding - amount);
        this.updateUI();
    }

    adjustTemperature(amount) {
        this.temperature = Math.max(35, Math.min(42, this.temperature + amount));
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
        this.bleeding = 0;
        this.temperature = 37;
        this.hygiene = 100;
        this.isGameOver = false;
        document.getElementById('gameOver').style.display = 'none';
        this.updateUI();
    }

    updateUI() {
        // 体力
        const healthBar = document.querySelector('#health .status-fill');
        if (healthBar) healthBar.style.width = `${(this.health / this.maxHealth) * 100}%`;
        const healthText = document.getElementById('healthValue');
        if (healthText) healthText.textContent = Math.round(this.health);
        
        // 空腹度
        const hungerBar = document.querySelector('#hunger .status-fill');
        if (hungerBar) hungerBar.style.width = `${(this.hunger / this.maxHunger) * 100}%`;
        const hungerText = document.getElementById('hungerValue');
        if (hungerText) hungerText.textContent = Math.round(this.hunger);
        
        // 喉の渇き
        const thirstBar = document.querySelector('#thirst .status-fill');
        if (thirstBar) thirstBar.style.width = `${(this.thirst / this.maxThirst) * 100}%`;
        const thirstText = document.getElementById('thirstValue');
        if (thirstText) thirstText.textContent = Math.round(this.thirst);
        
        // 出血
        const bleedingBar = document.querySelector('#bleeding .status-fill');
        if (bleedingBar) bleedingBar.style.width = `${(this.bleeding / this.maxBleeding) * 100}%`;
        const bleedingText = document.getElementById('bleedingValue');
        if (bleedingText) bleedingText.textContent = Math.round(this.bleeding);
        
        // 体温
        const temperatureBar = document.querySelector('#temperature .status-fill');
        if (temperatureBar) temperatureBar.style.width = `${((this.temperature - 35) / 7) * 100}%`;
        const temperatureText = document.getElementById('temperatureValue');
        if (temperatureText) temperatureText.textContent = Math.round(this.temperature * 10) / 10;
        
        // 衛生
        const hygieneBar = document.querySelector('#hygiene .status-fill');
        if (hygieneBar) hygieneBar.style.width = `${(this.hygiene / this.maxHygiene) * 100}%`;
        const hygieneText = document.getElementById('hygieneValue');
        if (hygieneText) hygieneText.textContent = Math.round(this.hygiene);
    }

    getHealthColor() {
        const percentage = this.health / this.maxHealth;
        return percentage > 0.6 ? '#00ff00' : percentage > 0.3 ? '#ffff00' : '#ff0000';
    }

    getHungerColor() {
        const percentage = this.hunger / this.maxHunger;
        return percentage > 0.6 ? '#00ff00' : percentage > 0.3 ? '#ffff00' : '#ff0000';
    }

    getThirstColor() {
        const percentage = this.thirst / this.maxThirst;
        return percentage > 0.6 ? '#00ff00' : percentage > 0.3 ? '#ffff00' : '#ff0000';
    }

    getBleedingColor() {
        return '#ff0000';
    }

    getTemperatureColor() {
        if (this.temperature < 36) return '#0000ff';
        if (this.temperature > 41) return '#ff0000';
        return '#00ff00';
    }

    getHygieneColor() {
        const percentage = this.hygiene / this.maxHygiene;
        return percentage > 0.6 ? '#00ff00' : percentage > 0.3 ? '#ffff00' : '#ff0000';
    }

    isGameOver() {
        return this.isGameOver;
    }

    increaseBleeding(amount) {
        this.bleeding = Math.min(this.maxBleeding, this.bleeding + amount);
        this.updateUI();
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

    updateHealthFromStatus(deltaTime) {
        let damage = 0;
        
        // 空腹が20%を切った場合
        if (this.hunger < 20) {
            damage += (20 - this.hunger) * 0.05 * deltaTime;
        }
        
        // 喉の渇きが20%を切った場合
        if (this.thirst < 20) {
            damage += (20 - this.thirst) * 0.08 * deltaTime;
        }
        
        // 出血が70%を超えた場合
        if (this.bleeding > 70) {
            damage += (this.bleeding - 70) * 0.1 * deltaTime;
        }
        
        // ダメージを適用
        if (damage > 0) {
            this.takeDamage(damage);
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
        // 既存のエフェクトを更新または新規追加
        this.effects.set(itemType, {
            ...effect,
            startTime: Date.now()
        });

        // エフェクトの適用
        if (effect.staminaRegen) {
            this.staminaRegenMultiplier = effect.staminaRegen;
        }
        if (effect.moveSpeed) {
            this.moveSpeedMultiplier = effect.moveSpeed;
        }
        if (effect.maxHealthBonus) {
            this.maxHealth += effect.maxHealthBonus;
        }

        // エフェクトの表示を更新
        this.updateEffectsDisplay();
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
        switch (effect.type) {
            case 'bandage':
                // 出血を減少
                this.stopBleeding(effect.value * deltaTime);
                break;
            case 'regeneration':
                // HPを回復
                this.heal(effect.value * deltaTime);
                break;
            case 'painkiller':
                // 痛みを減少
                this.pain = Math.max(0, this.pain - effect.value * deltaTime);
                break;
            case 'antibiotic':
                // 感染を減少
                this.infection = Math.max(0, this.infection - effect.value * deltaTime);
                break;
            case 'energyDrink':
                // スタミナ回復速度を上昇
                this.staminaRegenMultiplier = effect.value;
                break;
            case 'adrenaline':
                // 移動速度を上昇
                this.moveSpeedMultiplier = effect.value;
                break;
            default:
                console.warn(`未知の効果タイプ: ${effect.type}`);
        }
    }

    updateEffectsDisplay() {
        const effectsDiv = document.getElementById('activeEffects');
        if (!effectsDiv) return; // effectsDivが存在しない場合は処理をスキップ
        
        effectsDiv.innerHTML = '';

        for (const [itemType, effect] of this.effects) {
            const itemConfig = GameConfig.ITEMS[itemType];
            if (!itemConfig) continue;

            const remainingTime = Math.ceil((effect.duration * 1000 - (Date.now() - effect.startTime)) / 1000);
            const effectDiv = document.createElement('div');
            effectDiv.className = 'effect-item';
            effectDiv.innerHTML = `
                <span class="effect-name">${itemConfig.name}</span>
                <span class="effect-time">${remainingTime}秒</span>
            `;
            effectsDiv.appendChild(effectDiv);
        }
    }

    updateStatusDisplay() {
        // このメソッドは既存のものを使用
        this.updateUI();
    }

    addDurationEffect(effect) {
        // 効果のIDを生成
        const effectId = Date.now() + Math.random();
        
        // 効果の開始時間を記録
        const startTime = Date.now();
        
        // 効果をMapに追加
        this.effects.set(effectId, {
            ...effect,
            startTime,
            endTime: startTime + (effect.duration * 1000) // 秒をミリ秒に変換
        });
        
        console.log(`持続効果を追加: ${effect.type}, 持続時間: ${effect.duration}秒`);
    }
} 