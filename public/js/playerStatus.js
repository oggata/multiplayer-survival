class PlayerStatus {
    constructor() {
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.maxHunger = 100;
        this.hunger = 100;
        this.maxThirst = 100;
        this.thirst = this.maxThirst;
        this.maxBleeding = 100;
        this.bleeding = 0;
        this.maxTemperature = 100;
        this.temperature = 50;
        this.moveSpeedMultiplier = 0;
        this.effects = new Map(); // アクティブなエフェクトを管理

        this.healthDecreaseRate = 0.1;
        this.hungerDecreaseRate = GameConfig.STATUS.IDLE.HUNGER;
        this.thirstDecreaseRate = GameConfig.STATUS.IDLE.THIRST;
        this.bleedingIncreaseRate = 0.1;
        this.temperatureChangeRate = 0.1;

        this.isGameOver = false;

        this.healthBar = document.querySelector('.status-bar.health .status-fill');
        this.healthText = document.getElementById('healthValue');
        this.hungerBar = document.querySelector('.status-bar.hunger .status-fill');
        this.hungerText = document.getElementById('hungerValue');
        this.thirstBar = document.querySelector('.status-bar.thirst .status-fill');
        this.thirstText = document.getElementById('thirstValue');
        this.bleedingBar = document.querySelector('.status-bar.bleeding .status-fill');
        this.bleedingText = document.getElementById('bleedingValue');
        this.temperatureBar = document.querySelector('.status-bar.temperature .status-fill');
        this.temperatureText = document.getElementById('temperatureValue');
        this.hygieneBar = document.querySelector('.status-bar.hygiene .status-fill');
        this.hygieneText = document.getElementById('hygieneValue');

        // 気温関連のパラメータ
        this.baseTemperature = 20; // 基準気温
        this.clothingBonus = 0; // 服による気温補正
        this.minTemperature = -10; // 最低気温
        this.maxTemperature = 40; // 最高気温
        this.temperatureDamageThreshold = 10; // ダメージを受ける気温閾値
        this.temperatureDamageRate = 0.1; // ダメージを受ける速度
        
        // 天気と時間による気温変化
        this.weather = 'sunny'; // 'sunny', 'rainy', 'snowy'
        this.isDaytime = true;

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
        
        // 気温の更新
        this.updateTemperature();
        
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
        if (this.healthBar) this.healthBar.style.width = `${this.health}%`;
        if (this.hungerBar) this.hungerBar.style.width = `${this.hunger}%`;
        if (this.thirstBar) this.thirstBar.style.width = `${this.thirst}%`;
        
        // 出血ゲージの更新
        if (this.bleedingBar) {
            const bleedingPercentage = (this.bleeding / this.maxBleeding) * 100;
            this.bleedingBar.style.width = `${bleedingPercentage}%`;
        }
        
        if (this.temperatureBar) this.temperatureBar.style.width = `${Math.min(100, Math.max(0, ((this.temperature - 35) / 3) * 100))}%`;
        
        // 気温バーの更新
        if (this.temperatureBar) {
            // 0-40度を0-100%に変換
            const temperaturePercentage = (this.temperature / this.maxTemperature) * 100;
            this.temperatureBar.style.width = `${temperaturePercentage}%`;
        }

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
        if (this.bleeding > 80) {
            damage += 1;
        }


        // 空腹が20%を切った場合
        if (this.hunger > 80) {
            this.health += (this.hunger-80) * 0.05 * deltaTime;
        }
        
        // 喉の渇きが20%を切った場合
        if (this.thirst > 80) {
            this.health += (this.thirs-80) * 0.05 * deltaTime;
        }
        
        // ダメージを適用
        if (damage > 0) {
            this.health = this.health - damage;
            this.updateStatusDisplay();
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

        /* 
            HPを回復し続ける
            Foodを回復し続ける
            Thirstを回復し続ける
            出血を減少し続ける
            防御力が上昇する
            体温が下がらない
            移動速度を上昇させる        
        */

        switch (effect.type) {
            case 'bandage':
                // 出血を減少
                this.stopBleeding(effect.value * deltaTime);
                break;
            case 'regeneration':
                // HPを回復
                this.heal(effect.value * deltaTime);
                break;
            case 'adrenaline':
                // 移動速度を上昇
                this.moveSpeedMultiplier = effect.value;
                break;
            case 'wepon':
                // 武器を強化
                //console.log(effect.attack);
                //effect.attack.type
            case 'chocolateBar':
                // 空腹を回復し続ける
                this.hunger += effect.value;
                break;
            case 'energyDrink':
                // HPを回復し続ける
                this.heal(effect.value * deltaTime);
                break;

            case 'jacket':
                // 体温を上げる
                this.clothingBonus = effect.value;
                break;

            case 'boonieHat':
                // 体温を上げる
                this.clothingBonus = effect.value;
                break;
            default:
                //console.warn(`未知の効果タイプ: ${effect.type}`);
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
        

        console.log(effect);
        // 効果をMapに追加
        this.effects.set(effectId, {
            ...effect,
            startTime,
            endTime: startTime + (effect.duration * 1000) // 秒をミリ秒に変換
        });
    }

    // 天気と時間を設定するメソッド
    setWeather(weather) {
        this.weather = weather;
        this.updateTemperature();
    }

    setDaytime(isDaytime) {
        this.isDaytime = isDaytime;
        this.updateTemperature();
    }

    // 気温を更新するメソッド
    updateTemperature() {
        // 天気と時間に基づいて基準気温を設定
        if (this.weather === 'sunny') {
            this.baseTemperature = this.isDaytime ? 30 : 20;
        } else if (this.weather === 'rainy') {
            this.baseTemperature = this.isDaytime ? 10 : 0;
        } else if (this.weather === 'snowy') {
            this.baseTemperature = this.isDaytime ? 0 : -10;
        }

        // 体感気温を計算（基準気温 + 服による補正）
        const feltTemperature = this.baseTemperature + this.clothingBonus;
        
        // 気温を0-40度の範囲に制限
        this.temperature = Math.max(this.minTemperature, Math.min(this.maxTemperature, feltTemperature));
        
        // UIを更新
        this.updateUI();
        
        // 低温ダメージをチェック
        this.checkTemperatureDamage();
    }

    // 服による気温補正を設定
    setClothingBonus(bonus) {
        this.clothingBonus = bonus;
        this.updateTemperature();
    }

    // 低温ダメージをチェック
    checkTemperatureDamage() {
        
        if (this.temperature <= this.temperatureDamageThreshold) {
            // 気温が閾値以下の場合、HPを徐々に減少
            const damage = this.temperatureDamageRate * (this.temperatureDamageThreshold - this.temperature);
            this.health = Math.max(0, this.health - damage);
            this.updateUI();
        }
    }


} 