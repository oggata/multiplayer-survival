class PlayerStatus {
    constructor(game) {
        this.game = game;
        // ステータスの初期値
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.hunger = 100;
        this.thirst = 100;
        this.bleeding = 0;
        this.temperature = 37; // 体温（摂氏）
        this.hygiene = 100;
        this.stamina = 100;
        this.maxStamina = 100;
        this.experience = 0;
        this.level = 1;
        
        // ステータスの減少率（1秒あたり）
        this.hungerDecreaseRate = GameConfig.PLAYER.hungerDecreaseRate;
        this.thirstDecreaseRate = GameConfig.PLAYER.thirstDecreaseRate;
        this.hygieneDecreaseRate = GameConfig.PLAYER.hygieneDecreaseRate;
        this.staminaDecreaseRate = GameConfig.PLAYER.staminaDecreaseRate || 10;
        
        // ステータスが低い場合の体力減少率
        this.healthDecreaseRate = GameConfig.PLAYER.healthDecreaseRate;
        
        // 移動速度倍率
        this.moveSpeedMultiplier = 1.0;
        
        // スタミナ消費無効化フラグ
        this.staminaConsumptionDisabled = false;
        
        // 持続効果
        this.durationEffects = new Map();
        
        // ステータスの更新間隔（ミリ秒）
        this.updateInterval = 1000;
        this.lastUpdateTime = 0;
        
        // ステータスゲージの要素（遅延初期化）
        this.healthBar = null;
        this.healthFill = null;
        this.healthText = null;
        this.hungerBar = null;
        this.hungerFill = null;
        this.hungerText = null;
        this.thirstBar = null;
        this.thirstFill = null;
        this.thirstText = null;
        this.staminaBar = null;
        this.staminaFill = null;
        this.staminaText = null;
        this.experienceBar = null;
        this.experienceFill = null;
        this.experienceText = null;
        
        // UI要素を初期化
        this.initializeUI();
    }
    
    // UI要素を初期化
    initializeUI() {
        // DOMが読み込まれた後にUI要素を取得
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupUIElements();
            });
        } else {
            this.setupUIElements();
        }
    }
    
    // UI要素を設定
    setupUIElements() {
        this.healthBar = document.querySelector('.status-bar.health');
        this.healthFill = document.querySelector('.status-bar.health .status-fill');
        this.healthText = document.querySelector('.status-bar.health .status-text');
        this.hungerBar = document.querySelector('.status-bar.hunger');
        this.hungerFill = document.querySelector('.status-bar.hunger .status-fill');
        this.hungerText = document.querySelector('.status-bar.hunger .status-text');
        this.thirstBar = document.querySelector('.status-bar.thirst');
        this.thirstFill = document.querySelector('.status-bar.thirst .status-fill');
        this.thirstText = document.querySelector('.status-bar.thirst .status-text');
        this.staminaBar = document.querySelector('.status-bar.stamina');
        this.staminaFill = document.querySelector('.status-bar.stamina .status-fill');
        this.staminaText = document.querySelector('.status-bar.stamina .status-text');
        this.experienceBar = document.querySelector('.status-bar.experience');
        this.experienceFill = document.querySelector('.status-bar.experience .status-fill');
        this.experienceText = document.getElementById('experienceText');
        
        // 初期ゲージを更新
        this.updateGauges();
    }
    
    // ステータスを更新する
    update(deltaTime) {
        // 持続効果の更新
        this.updateDurationEffects(deltaTime);
        
        // スタミナの自然回復
        if (this.stamina < this.maxStamina) {
            this.stamina = Math.min(this.maxStamina, this.stamina + 5 * deltaTime);
        }
        
        // 定期的に持続効果の状態をログ出力（デバッグ用）
        if (this.durationEffects.size > 0 && Math.random() < 0.01) { // 1%の確率でログ出力
            console.log(`持続効果の状態: ${this.durationEffects.size}個の効果がアクティブ`);
            for (const [effectId, effect] of this.durationEffects.entries()) {
                console.log(`  - ${effect.type} (${effect.name || 'unnamed'}): ${effect.remainingTime}ms 残り`);
            }
        }
        
        // ゲージを更新
        this.updateGauges();
        
        // 効果表示も更新
        if (this.game && this.game.itemEffectManager) {
            this.game.itemEffectManager.updateEffectsDisplay();
        }
    }
    
    // 持続効果を更新
    updateDurationEffects(deltaTime) {
        const currentTime = Date.now();
        
        for (const [effectId, effect] of this.durationEffects.entries()) {
            // deltaTimeは秒単位なので、ミリ秒に変換
            effect.remainingTime -= deltaTime * 1000;
            
            // 持続効果の適用
            this.applyDurationEffect(effect, deltaTime);
            
            if (effect.remainingTime <= 0) {
                // 効果が終了
                console.log(`効果が終了: ${effect.type} (${effect.name || 'unnamed'})`);
                this.removeDurationEffect(effectId);
            }
        }
    }
    
    // 持続効果を適用
    applyDurationEffect(effect, deltaTime) {
        switch (effect.type) {
            case 'healthRegen':
                // HP回復効果
                this.health = Math.min(this.maxHealth, this.health + effect.value * deltaTime);
                break;
            case 'staminaLock':
                // スタミナ固定効果
                this.stamina = this.maxStamina;
                break;
            case 'healthRegenStaminaLock':
                // HP回復 + スタミナ固定効果
                this.health = Math.min(this.maxHealth, this.health + effect.value * deltaTime);
                this.stamina = this.maxStamina;
                break;
        }
    }
    
    // 持続効果を追加
    addDurationEffect(effect) {
        const effectId = Date.now() + Math.random();
        
        // 武器効果の場合は既存の武器効果を削除
        if (effect.type === 'wepon') {
            this.removeAllWeaponEffects();
        }
        
        // durationが秒単位の場合はミリ秒に変換
        if (effect.duration < 1000) {
            effect.duration = effect.duration * 1000;
        }
        
        effect.remainingTime = effect.duration;
        effect.startTime = Date.now();
        this.durationEffects.set(effectId, effect);
        
        console.log(`持続効果を追加: ${effect.type} (${effect.name || 'unnamed'}), 残り時間: ${effect.duration}ms`);
        console.log(`現在の効果数: ${this.durationEffects.size}`);
        
        // 効果表示を更新
        if (this.game && this.game.itemEffectManager) {
            this.game.itemEffectManager.updateEffectsDisplay();
        }
        
        return effectId;
    }
    
    // 全ての武器効果を削除
    removeAllWeaponEffects() {
        const weaponEffectIds = [];
        
        // 武器効果のIDを収集
        for (const [effectId, effect] of this.durationEffects.entries()) {
            if (effect.type === 'wepon') {
                weaponEffectIds.push(effectId);
            }
        }
        
        // 武器効果を削除
        for (const effectId of weaponEffectIds) {
            const effect = this.durationEffects.get(effectId);
            if (effect) {
                console.log(`既存の武器効果を削除: ${effect.name}`);
            }
            this.durationEffects.delete(effectId);
        }
        
        if (weaponEffectIds.length > 0) {
            console.log(`${weaponEffectIds.length}個の武器効果を削除しました`);
        }
    }
    
    // 持続効果を削除
    removeDurationEffect(effectId) {
        const effect = this.durationEffects.get(effectId);
        if (effect) {
            console.log(`持続効果を削除: ${effect.type} (${effect.name || 'unnamed'})`);
        }
        this.durationEffects.delete(effectId);
        console.log(`現在の効果数: ${this.durationEffects.size}`);
        
        // 効果表示を更新
        if (this.game && this.game.itemEffectManager) {
            this.game.itemEffectManager.updateEffectsDisplay();
        }
    }
    
    // 現在の効果を取得
    getCurrentEffects() {
        return this.durationEffects;
    }
    
    // 現在の武器タイプを取得
    getCurrentWeponType() {
        console.log(`武器タイプ取得: 現在の効果数 ${this.durationEffects.size}`);
        
        // 持続効果から武器タイプを取得
        for (const [effectId, effect] of this.durationEffects.entries()) {
            console.log(`効果確認: ${effect.type} (${effect.name || 'unnamed'}), 残り時間: ${effect.remainingTime}ms`);
            if (effect.type === 'wepon') {
                console.log(`現在の武器: ${effect.name}, 残り時間: ${effect.remainingTime}ms`);
                return [effect.name]; // 配列形式で返す（既存コードとの互換性のため）
            }
        }
        
        // 武器効果がない場合はデフォルトの武器を返す
        console.log('武器効果なし、デフォルト武器を使用');
        return ['bullet001'];
    }
    
    // 体力を取得
    getHealth() {
        return this.health;
    }
    
    // 最大体力を取得
    getMaxHealth() {
        return this.maxHealth;
    }
    
    // アクティブな効果を取得
    getActiveEffects() {
        return this.durationEffects;
    }
    
    // 体力を回復
    heal(value) {
        this.addHealth(value);
    }
    
    // 効果を追加（汎用メソッド）
    addEffect(type, value, duration) {
        const effect = {
            type: type,
            value: value,
            duration: duration * 1000, // 秒をミリ秒に変換
            remainingTime: duration * 1000,
            startTime: Date.now()
        };
        
        this.addDurationEffect(effect);
    }
    
    // 体力を追加
    addHealth(value) {
        this.health = Math.min(this.maxHealth, this.health + value);
        this.updateGauges();
    }
    
    // 空腹を追加
    addHunger(value) {
        this.hunger = Math.min(100, this.hunger + value);
        this.updateGauges();
    }
    
    // 喉の渇きを追加
    addThirst(value) {
        this.thirst = Math.min(100, this.thirst + value);
        this.updateGauges();
    }
    
    // スタミナを追加
    addStamina(value) {
        this.stamina = Math.min(this.maxStamina, this.stamina + value);
        this.updateGauges();
    }
    
    // 経験値を追加
    addExperience(value) {
        this.experience += value;
        
        // レベルアップ処理
        this.checkLevelUp();
        
        // ゲージを更新
        this.updateGauges();
    }
    
    // レベルアップチェック
    checkLevelUp() {
        let experienceForNextLevel = this.getExperienceForNextLevel();
        
        // 複数レベルアップに対応
        while (this.experience >= experienceForNextLevel) {
            this.levelUp();
            experienceForNextLevel = this.getExperienceForNextLevel();
        }
    }
    
    // 次のレベルに必要な経験値を計算
    getExperienceForNextLevel() {
        // レベルが上がるにつれて必要な経験値が増加
        // レベル1→2: 100, レベル2→3: 200, レベル3→4: 350, レベル4→5: 550, ...
        let totalExperience = 0;
        for (let i = 1; i <= this.level; i++) {
            totalExperience += this.getExperienceForLevel(i);
        }
        return totalExperience;
    }
    
    // 特定のレベルに必要な経験値を計算
    getExperienceForLevel(level) {
        if (level === 1) return 0;
        if (level === 2) return 100;
        if (level === 3) return 200;
        if (level === 4) return 350;
        if (level === 5) return 550;
        if (level === 6) return 800;
        if (level === 7) return 1100;
        if (level === 8) return 1450;
        if (level === 9) return 1850;
        if (level === 10) return 2300;
        
        // レベル10以降は指数関数的に増加
        const baseExperience = 2300;
        const multiplier = 1.5;
        return Math.floor(baseExperience * Math.pow(multiplier, level - 10));
    }
    
    // 特定のレベルまでに必要な総経験値を計算
    getTotalExperienceForLevel(level) {
        let totalExperience = 0;
        for (let i = 1; i < level; i++) {
            totalExperience += this.getExperienceForLevel(i);
        }
        return totalExperience;
    }
    
    // レベルアップ処理
    levelUp() {
        this.level++;
        
        // 現在の持続効果を保存
        const currentEffects = new Map(this.durationEffects);
        console.log(`レベルアップ前の持続効果数: ${currentEffects.size}`);
        
        // レベルアップ時のボーナス
        this.maxHealth += 10;
        this.health = this.maxHealth; // 体力を全回復
        this.maxStamina += 5;
        this.stamina = this.maxStamina; // スタミナを全回復
        
        // 空腹と喉の渇きも回復
        this.hunger = 100;
        this.thirst = 100;
        
        // 持続効果を復元
        this.durationEffects = currentEffects;
        console.log(`レベルアップ後の持続効果数: ${this.durationEffects.size}`);
        
        // ゲージを更新
        this.updateGauges();
        
        // レベルアップメッセージを表示しない
        // if (this.game && this.game.messageManager) {
        //     this.game.messageManager.showMessage(`🎉 レベルアップ！ Lv.${this.level} になりました！`);
        // }
        
        console.log(`レベルアップ！ Lv.${this.level} になりました！`);
        console.log(`体力: ${this.health}/${this.maxHealth}, スタミナ: ${this.stamina}/${this.maxStamina}`);
        console.log(`空腹: ${this.hunger}, 喉の渇き: ${this.thirst}`);
        console.log(`次のレベルまで: ${this.getExperienceForLevel(this.level + 1)} 経験値必要`);
    }
    
    // 空腹を減少
    decreaseHunger(value) {
        this.hunger = Math.max(0, this.hunger - value);
        this.updateGauges();
    }
    
    // 喉の渇きを減少
    decreaseThirst(value) {
        this.thirst = Math.max(0, this.thirst - value);
        this.updateGauges();
    }
    
    // スタミナを減少
    decreaseStamina(value) {
        this.stamina = Math.max(0, this.stamina - value);
        this.updateGauges();
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
    
    // ゲージを更新する
    updateGauges() {
        // 体力ゲージ
        const healthPercentage = (this.health / this.maxHealth) * 100;
        if (this.healthFill) {
            this.healthFill.style.width = `${healthPercentage}%`;
        }
        if (this.healthText) {
            this.healthText.textContent = `${Math.round(this.health)}/${this.maxHealth}`;
        }
        
        // 飢えゲージ
        const hungerPercentage = this.hunger;
        if (this.hungerFill) {
            this.hungerFill.style.width = `${hungerPercentage}%`;
        }
        if (this.hungerText) {
            this.hungerText.textContent = `${Math.round(this.hunger)}%`;
        }
        
        // 喉の渇きゲージ
        const thirstPercentage = this.thirst;
        if (this.thirstFill) {
            this.thirstFill.style.width = `${thirstPercentage}%`;
        }
        if (this.thirstText) {
            this.thirstText.textContent = `${Math.round(this.thirst)}%`;
        }
        
        // スタミナゲージ
        const staminaPercentage = (this.stamina / this.maxStamina) * 100;
        if (this.staminaFill) {
            this.staminaFill.style.width = `${staminaPercentage}%`;
        }
        if (this.staminaText) {
            this.staminaText.textContent = `${Math.round(this.stamina)}/${this.maxStamina}`;
        }
        
        // 経験値ゲージ
        const experienceForCurrentLevel = this.getTotalExperienceForLevel(this.level);
        const experienceInCurrentLevel = this.experience - experienceForCurrentLevel;
        const experienceForNextLevel = this.getExperienceForLevel(this.level + 1);
        const experiencePercentage = (experienceInCurrentLevel / experienceForNextLevel) * 100;
        
        if (this.experienceFill) {
            this.experienceFill.style.width = `${experiencePercentage}%`;
        }
        if (this.experienceText) {
            this.experienceText.textContent = `Lv.${this.level} (${experienceInCurrentLevel}/${experienceForNextLevel})`;
        }
    }
    
    // UIを更新
    updateUI() {
        this.updateGauges();
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
        this.stamina = this.maxStamina;
        this.experience = 0;
        this.level = 1;
        this.moveSpeedMultiplier = 1.0;
        this.staminaConsumptionDisabled = false;
        this.durationEffects.clear();
        
        // UI要素が初期化されていない場合は初期化
        if (!this.healthFill) {
            this.setupUIElements();
        }
        this.updateGauges();
    }
}
