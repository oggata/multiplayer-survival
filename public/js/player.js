class PlayerStatus {
    constructor() {
        // ステータスの初期値
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.hunger = 100;
        this.thirst = 100;
        this.bleeding = 0;
        this.temperature = 37; // 体温（摂氏）
        this.hygiene = 100;
        
        // ステータスの減少率（1秒あたり）
        this.hungerDecreaseRate = GameConfig.PLAYER.hungerDecreaseRate;
        this.thirstDecreaseRate = GameConfig.PLAYER.thirstDecreaseRate;
        this.hygieneDecreaseRate = GameConfig.PLAYER.hygieneDecreaseRate;
        
        // ステータスが低い場合の体力減少率
        this.healthDecreaseRate = GameConfig.PLAYER.healthDecreaseRate;
        
        // ステータスの更新間隔（ミリ秒）
        this.updateInterval = 1000;
        this.lastUpdateTime = 0;
        
        // ステータスゲージの要素
        this.healthBar = document.getElementById('healthBar');
        this.healthFill = document.getElementById('healthFill');
        this.healthText = document.getElementById('healthText');
        this.hungerBar = document.getElementById('hungerBar');
        this.hungerFill = document.getElementById('hungerFill');
        this.hungerText = document.getElementById('hungerText');
        this.thirstBar = document.getElementById('thirstBar');
        this.thirstFill = document.getElementById('thirstFill');
        this.thirstText = document.getElementById('thirstText');
        this.bleedingBar = document.getElementById('bleedingBar');
        this.bleedingFill = document.getElementById('bleedingFill');
        this.bleedingText = document.getElementById('bleedingText');
        this.temperatureBar = document.getElementById('temperatureBar');
        this.temperatureFill = document.getElementById('temperatureFill');
        this.temperatureText = document.getElementById('temperatureText');
        this.hygieneBar = document.getElementById('hygieneBar');
        this.hygieneFill = document.getElementById('hygieneFill');
        this.hygieneText = document.getElementById('hygieneText');
    }
    
    // ステータスを更新する
    update(deltaTime) {
        const currentTime = Date.now();
        
        // 一定間隔でステータスを更新
        if (currentTime - this.lastUpdateTime > this.updateInterval) {
            // 飢えと喉の渇きを減少
            this.hunger = Math.max(0, this.hunger - this.hungerDecreaseRate);
            this.thirst = Math.max(0, this.thirst - this.thirstDecreaseRate);
            
            // 衛生状態を減少
            this.hygiene = Math.max(0, this.hygiene - this.hygieneDecreaseRate);
            
            // ステータスが低い場合、体力を減少
            if (this.hunger < 20 || this.thirst < 20 || this.bleeding > 80 || this.hygiene < 20) {
                this.health = Math.max(0, this.health - this.healthDecreaseRate);
            }

            // ゲージを更新
            this.updateGauges();
            
            this.lastUpdateTime = currentTime;
        }
    }
    
    // アイテムの効果を適用する
    applyItemEffect(effect) {
        if (effect.hunger) {
            this.hunger = Math.min(100, this.hunger + effect.hunger);
        }
        if (effect.thirst) {
            this.thirst = Math.min(100, this.thirst + effect.thirst);
        }
        if (effect.bleeding) {
            this.bleeding = Math.max(0, this.bleeding + effect.bleeding);
        }
        if (effect.temperature) {
            this.temperature = Math.min(39, this.temperature + effect.temperature);
        }
        if (effect.hygiene) {
            this.hygiene = Math.min(100, this.hygiene + effect.hygiene);
        }
        
        // ゲージを更新
        this.updateGauges();
    }
    /*
    // ダメージを受ける
    takeDamage(damage) {
        console.log(damage);
        this.health = Math.max(0, this.health - damage);
        //this.updateGauges();
        
        // 出血を増加
        this.bleeding = Math.min(100, this.bleeding + damage);
        this.updateGauges();
        return this.health <= 0;
    }*/
    
    // ゲージを更新する
    updateGauges() {
        // 体力ゲージ
        const healthPercentage = (this.health / this.maxHealth) * 100;
        this.healthFill.style.width = `${healthPercentage}%`;
        this.healthText.textContent = `HP: ${Math.floor(this.health)}/${this.maxHealth}`;
        
        // 飢えゲージ
        const hungerPercentage = this.hunger;
        this.hungerFill.style.width = `${hungerPercentage}%`;
        this.hungerText.textContent = `飢え: ${Math.floor(this.hunger)}%`;
        
        // 喉の渇きゲージ
        const thirstPercentage = this.thirst;
        this.thirstFill.style.width = `${thirstPercentage}%`;
        this.thirstText.textContent = `喉の渇き: ${Math.floor(this.thirst)}%`;
        
        // 出血ゲージ
        const bleedingPercentage = this.bleeding;
        this.bleedingFill.style.width = `${bleedingPercentage}%`;
        this.bleedingText.textContent = `出血: ${Math.floor(this.bleeding)}%`;
        
        // 体温ゲージ
        const temperaturePercentage = ((this.temperature - 35) / 4) * 100;
        this.temperatureFill.style.width = `${temperaturePercentage}%`;
        this.temperatureText.textContent = `体温: ${this.temperature.toFixed(1)}°C`;
        
        // 衛生状態ゲージ
        const hygienePercentage = this.hygiene;
        this.hygieneFill.style.width = `${hygienePercentage}%`;
        this.hygieneText.textContent = `衛生: ${Math.floor(this.hygiene)}%`;
        
    }

    
    // ゲームオーバーかどうかを返す
    isGameOver() {
        return this.health <= 0;
    }
    
    // ステータスをリセットする
    reset() {
        this.health = this.maxHealth;
        this.hunger = 100;
        this.thirst = 100;
        this.bleeding = 0;
        this.temperature = 37;
        this.hygiene = 100;
        this.updateGauges();
    }
} 