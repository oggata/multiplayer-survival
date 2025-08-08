class UIManager {
	constructor(game) {
		this.game = game;
		this.initializeUIElements();
		this.setupUIEventListeners();
	}

	initializeUIElements() {
		// 座標表示用の要素
		this.positionElement = document.getElementById('position');
		
		// プレイヤー数表示用の要素
		this.playerCountElement = document.getElementById('playerCount');
		
		// 敵の数表示用の要素
		this.enemyCountElement = document.getElementById('enemyCount');
		
		// HP関連の要素
		this.healthFillElement = document.getElementById('healthFill');
		this.healthTextElement = document.getElementById('healthText');
		this.gameOverElement = document.getElementById('gameOver');
		this.restartButtonElement = document.getElementById('restartButton');
		
		// アイテム関連の要素
		this.itemCountElement = document.getElementById('itemCount');
		
		// バックパックUI要素
		this.backpackElement = document.getElementById('backpack');
		this.backpackItemsBody = document.getElementById('backpackItemsBody');
		this.emptyBackpackMessage = document.getElementById('emptyBackpack');
		this.backpackButton = document.getElementById('backpackButton');
		this.backpackCloseButton = document.getElementById('backpackClose');
		
		// エフェクト表示用の要素
		this.effectsContainer = document.createElement('div');
		this.effectsContainer.id = 'effectsContainer';
		this.effectsContainer.style.cssText = `
			position: fixed;
			top: 30px;
			right: 20px;
			background: rgba(0, 0, 0, 0.7);
			padding: 8px;
			border-radius: 5px;
			color: white;
			font-size: 11px;
			z-index: 1000;
			min-width: 250px;
		`;
		document.body.appendChild(this.effectsContainer);
	}

	setupUIEventListeners() {
		// リスタートボタンのイベントリスナー
		this.restartButtonElement.addEventListener('click', () => this.game.restartGame());
		
		// バックパックボタンのイベントリスナー
		this.backpackButton.addEventListener('click', () => this.game.toggleBackpack());
		this.backpackCloseButton.addEventListener('click', () => this.game.toggleBackpack());
	}

	updateCoordinatesDisplay() {
		if (this.positionElement && this.game.player) {
			const position = this.game.player.position;
			this.positionElement.textContent = `X: ${Math.round(position.x)}, Z: ${Math.round(position.z)}`;
		}
	}

	updatePlayerCount() {
		if (this.playerCountElement) {
			this.playerCountElement.textContent = this.game.players.size;
		}
	}

	updateEnemyCount() {
		if (this.enemyCountElement) {
			this.enemyCountElement.textContent = this.game.enemies.size;
		}
	}

	updateHealthDisplay() {
		if (this.healthFillElement && this.healthTextElement) {
			const health = this.game.playerStatus.getHealth();
			const maxHealth = this.game.playerStatus.getMaxHealth();
			const healthPercentage = (health / maxHealth) * 100;
			
			this.healthFillElement.style.width = `${healthPercentage}%`;
			this.healthTextElement.textContent = `${Math.round(health)}/${maxHealth}`;
			
			// HPに応じて色を変更
			if (healthPercentage > 60) {
				this.healthFillElement.style.backgroundColor = '#4CAF50';
			} else if (healthPercentage > 30) {
				this.healthFillElement.style.backgroundColor = '#FF9800';
			} else {
				this.healthFillElement.style.backgroundColor = '#F44336';
			}
		}
	}

	updateItemCount() {
		if (this.itemCountElement) {
			this.itemCountElement.textContent = this.game.itemManager.items.length;
		}
	}

	updateStatusDisplay() {
		this.updateHealthDisplay();
		this.updateItemCount();
	}

	updateBackpackUI() {
		if (!this.backpackElement || !this.backpackItemsBody) return;

		if (this.game.itemManager.inventory.length === 0) {
			this.backpackItemsBody.innerHTML = '';
			this.emptyBackpackMessage.style.display = 'block';
		} else {
			this.emptyBackpackMessage.style.display = 'none';
			this.backpackItemsBody.innerHTML = '';

			this.game.itemManager.inventory.forEach((item, index) => {
				const itemElement = document.createElement('div');
				itemElement.className = 'backpack-item';
				itemElement.style.cssText = `
					display: flex;
					justify-content: space-between;
					align-items: center;
					padding: 8px;
					margin: 4px 0;
					background: rgba(255, 255, 255, 0.1);
					border-radius: 4px;
					border-left: 4px solid ${this.game.itemManager.getItemColor(item.type)};
				`;

				const itemName = this.game.itemManager.getItemName(item.type);
				const itemDescription = this.game.itemManager.getItemDescription(item.type);

				itemElement.innerHTML = `
					<div>
						<div style="font-weight: bold; color: ${this.game.itemManager.getItemColor(item.type)};">${itemName}</div>
						<div style="font-size: 12px; color: #ccc;">${itemDescription}</div>
					</div>
					<div style="display: flex; gap: 4px;">
						<button onclick="game.itemManager.useItem('${item.type}')" style="
							background: #4CAF50;
							color: white;
							border: none;
							padding: 4px 8px;
							border-radius: 3px;
							cursor: pointer;
							font-size: 12px;
						">使用</button>
						<button onclick="game.itemManager.dropItem(${item.id})" style="
							background: #f44336;
							color: white;
							border: none;
							padding: 4px 8px;
							border-radius: 3px;
							cursor: pointer;
							font-size: 12px;
						">捨てる</button>
					</div>
				`;
				this.backpackItemsBody.appendChild(itemElement);
			});
		}
	}

	updateInventoryDisplay() {
		if (this.backpackButton) {
			this.backpackButton.textContent = `バックパック (${this.game.itemManager.inventory.length})`;
		}
	}

	updateEffectsDisplay() {
		if (!this.effectsContainer) return;

		const effects = this.game.playerStatus.getActiveEffects();
		if (effects.length === 0) {
			this.effectsContainer.style.display = 'none';
			return;
		}

		this.effectsContainer.style.display = 'block';
		this.effectsContainer.innerHTML = effects.map(effect => {
			const timeLeft = Math.ceil(effect.duration);
			return `<div style="color: ${effect.color || '#fff'};">${effect.name}: ${timeLeft}秒</div>`;
		}).join('');
	}

	showGameOver() {
		if (this.gameOverElement) {
			this.gameOverElement.style.display = 'block';
		}
	}

	hideGameOver() {
		if (this.gameOverElement) {
			this.gameOverElement.style.display = 'none';
		}
	}

	toggleBackpack() {
		if (this.backpackElement) {
			const isVisible = this.backpackElement.style.display === 'block';
			this.backpackElement.style.display = isVisible ? 'none' : 'block';
		}
	}
} 