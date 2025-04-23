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
        if (this.healthBar) this.healthBar.style.width = `${(this.health / this.maxHealth) * 100}%`;
        if (this.healthText) this.healthText.textContent = Math.round(this.health);
        
        if (this.hungerBar) this.hungerBar.style.width = `${(this.hunger / this.maxHunger) * 100}%`;
        if (this.hungerText) this.hungerText.textContent = Math.round(this.hunger);
        
        if (this.thirstBar) this.thirstBar.style.width = `${(this.thirst / this.maxThirst) * 100}%`;
        if (this.thirstText) this.thirstText.textContent = Math.round(this.thirst);
        
        if (this.bleedingBar) this.bleedingBar.style.width = `${(this.bleeding / this.maxBleeding) * 100}%`;
        if (this.bleedingText) this.bleedingText.textContent = Math.round(this.bleeding);
        
        if (this.temperatureBar) this.temperatureBar.style.width = `${((this.temperature - 35) / 7) * 100}%`;
        if (this.temperatureText) this.temperatureText.textContent = Math.round(this.temperature * 10) / 10;
        
        if (this.hygieneBar) this.hygieneBar.style.width = `${(this.hygiene / this.maxHygiene) * 100}%`;
        if (this.hygieneText) this.hygieneText.textContent = Math.round(this.hygiene);
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
} 