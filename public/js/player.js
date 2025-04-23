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
        this.hungerDecreaseRate = 0.5;
        this.thirstDecreaseRate = 0.8;
        this.bleedingIncreaseRate = 0.01;
        this.temperatureDecreaseRate = 0.1;
        this.hygieneDecreaseRate = 0.3;
        
        // ステータスが低い場合の体力減少率
        this.healthDecreaseRate = 0.2;
        
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
            
            // 出血を増加
            //this.bleeding = Math.min(100, this.bleeding + this.bleedingIncreaseRate);
            
            // 体温を減少（環境によって変動する可能性がある）
            this.temperature = Math.max(35, this.temperature - this.temperatureDecreaseRate);
            
            // 衛生状態を減少
            this.hygiene = Math.max(0, this.hygiene - this.hygieneDecreaseRate);
            
            // ステータスが低い場合、体力を減少
            if (this.hunger < 20 || this.thirst < 20 || this.bleeding > 80 || 
                this.temperature < 36 || this.hygiene < 20) {
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
    
    // ダメージを受ける
    takeDamage(damage) {
        this.health = Math.max(0, this.health - damage);
        this.updateGauges();
        
        // 出血を増加
        //this.bleeding = Math.min(100, this.bleeding + damage * 0.5);
        
        return this.health <= 0;
    }
    
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
        
        // ステータスに応じてゲージの色を変更
        this.updateGaugeColors();
    }
    
    // ゲージの色を更新する
    updateGaugeColors() {
        // 体力ゲージ
        if (this.health > 60) {
            this.healthFill.style.backgroundColor = '#00ff00'; // 緑
        } else if (this.health > 30) {
            this.healthFill.style.backgroundColor = '#ffff00'; // 黄
        } else {
            this.healthFill.style.backgroundColor = '#ff0000'; // 赤
        }
        
        // 飢えゲージ
        if (this.hunger > 60) {
            this.hungerFill.style.backgroundColor = '#00ff00'; // 緑
        } else if (this.hunger > 30) {
            this.hungerFill.style.backgroundColor = '#ffff00'; // 黄
        } else {
            this.hungerFill.style.backgroundColor = '#ff0000'; // 赤
        }
        
        // 喉の渇きゲージ
        if (this.thirst > 60) {
            this.thirstFill.style.backgroundColor = '#00ff00'; // 緑
        } else if (this.thirst > 30) {
            this.thirstFill.style.backgroundColor = '#ffff00'; // 黄
        } else {
            this.thirstFill.style.backgroundColor = '#ff0000'; // 赤
        }
        
        // 出血ゲージ
        if (this.bleeding < 30) {
            this.bleedingFill.style.backgroundColor = '#00ff00'; // 緑
        } else if (this.bleeding < 70) {
            this.bleedingFill.style.backgroundColor = '#ffff00'; // 黄
        } else {
            this.bleedingFill.style.backgroundColor = '#ff0000'; // 赤
        }
        
        // 体温ゲージ
        if (this.temperature > 36.5) {
            this.temperatureFill.style.backgroundColor = '#00ff00'; // 緑
        } else if (this.temperature > 36) {
            this.temperatureFill.style.backgroundColor = '#ffff00'; // 黄
        } else {
            this.temperatureFill.style.backgroundColor = '#ff0000'; // 赤
        }
        
        // 衛生状態ゲージ
        if (this.hygiene > 60) {
            this.hygieneFill.style.backgroundColor = '#00ff00'; // 緑
        } else if (this.hygiene > 30) {
            this.hygieneFill.style.backgroundColor = '#ffff00'; // 黄
        } else {
            this.hygieneFill.style.backgroundColor = '#ff0000'; // 赤
        }
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