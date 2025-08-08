class ItemManager {
	constructor(game) {
		this.game = game;
		this.items = []; // Mapから配列に戻す
		this.maxItems = GameConfig.ITEM.MAX_COUNT;
		this.inventory = []; // プレイヤーのインベントリ
		this.initializeStartingItems();
	}

	initializeStartingItems() {
		// ゲーム開始時にランダムなアイテムを3つバックパックに入れる
		const lang = localStorage.getItem('language') || 'ja';
		const items = ItemsConfig.getItemsConfig(lang) || {};
		console.log('lang:', lang);
		console.log('items:', items);
		const itemTypes = Object.entries(items)
			.filter(([_, item]) => item.dropChance !== undefined)
			.map(([type]) => type);

		if (this.game.devMode) {
			for (let i = 0; i < 10; i++) {
				const randomIndex = Math.floor(Math.random() * itemTypes.length);
				const selectedType = itemTypes[i];
				if (selectedType) {
					this.inventory.push({
						id: Date.now() + i,
						type: selectedType
					});
				}
			}
		} else {
			for (let i = 0; i < 3; i++) {
				const randomIndex = Math.floor(Math.random() * itemTypes.length);
				const selectedType = itemTypes[randomIndex];
				if (selectedType) {
					this.inventory.push({
						id: Date.now() + i,
						type: selectedType
					});
				}
			}
		}

		this.updateBackpackUI();
	}

	checkItemCollisions() {
		if (!this.game.player) return;

		const playerPosition = this.game.player.position;
		const collisionDistance = 2;

		this.items = this.items.filter(item => {
			const distance = playerPosition.distanceTo(item.position);
			if (distance < collisionDistance) {
				this.collectItem(item);
				return false; // アイテムを削除
			}
			return true; // アイテムを保持
		});
	}

	collectItem(item) {
		if (this.inventory.length >= 20) {
			this.game.showMessage('バックパックがいっぱいです！');
			return;
		}

		const itemName = this.getItemName(item.type);
		this.game.showItemEffectMessage(`${itemName}を拾いました！`, item.type);

		// インベントリに追加
		this.inventory.push({
			id: Date.now() + Math.random(),
			type: item.type
		});

		// アイテム効果を適用
		this.applyItemEffects(item.type);

		// UI更新
		this.updateBackpackUI();
		this.game.uiManager.updateInventoryDisplay();
		this.game.uiManager.updateItemCount();

		// 音効果
		this.game.audioManager.playSound('item');
	}

	useItem(itemType) {
		const itemIndex = this.inventory.findIndex(item => item.type === itemType);
		if (itemIndex === -1) {
			this.game.showMessage('そのアイテムは持っていません');
			return;
		}

		const item = this.inventory[itemIndex];
		const itemName = this.getItemName(itemType);

		// アイテム効果を適用
		this.applyItemEffects(itemType);

		// インベントリから削除
		this.inventory.splice(itemIndex, 1);

		// UI更新
		this.updateBackpackUI();
		this.game.uiManager.updateInventoryDisplay();

		this.game.showItemEffectMessage(`${itemName}を使用しました！`, itemType);
		this.game.audioManager.playSound('eat');
	}

	applyItemEffects(itemType) {
		const lang = localStorage.getItem('language') || 'ja';
		const items = ItemsConfig.getItemsConfig(lang) || {};
		const itemConfig = items[itemType];

		if (!itemConfig || !itemConfig.effects) return;

		itemConfig.effects.forEach(effect => {
			switch (effect.type) {
				case 'health':
					this.game.playerStatus.heal(effect.value);
					break;
				case 'speed':
					this.game.playerStatus.addEffect('speed', effect.value, effect.duration || 30);
					break;
				case 'damage':
					this.game.playerStatus.addEffect('damage', effect.value, effect.duration || 30);
					break;
				case 'defense':
					this.game.playerStatus.addEffect('defense', effect.value, effect.duration || 30);
					break;
			}
		});
	}

	dropItem(itemId) {
		const itemIndex = this.inventory.findIndex(item => item.id === itemId);
		if (itemIndex === -1) return;

		const item = this.inventory[itemIndex];
		const itemName = this.getItemName(item.type);

		// プレイヤーの位置にアイテムを生成
		if (this.game.player) {
			const dropPosition = this.game.player.position.clone();
			dropPosition.y = 0; // 地面の高さに設定
			this.spawnItem(item.type, dropPosition);
		}

		// インベントリから削除
		this.inventory.splice(itemIndex, 1);

		// UI更新
		this.updateBackpackUI();
		this.game.uiManager.updateInventoryDisplay();

		this.game.showMessage(`${itemName}を捨てました`);
	}

	spawnItem(itemType, position) {
		const item = new Item(itemType, position);
		this.items.push(item);
		this.game.scene.add(item.mesh);
	}

	getItemColor(type) {
		const lang = localStorage.getItem('language') || 'ja';
		const items = ItemsConfig.getItemsConfig(lang) || {};
		const itemConfig = items[type];
		return itemConfig ? itemConfig.color || '#ffffff' : '#ffffff';
	}

	getItemName(type) {
		const lang = localStorage.getItem('language') || 'ja';
		const items = ItemsConfig.getItemsConfig(lang) || {};
		const itemConfig = items[type];
		return itemConfig ? itemConfig.name || type : type;
	}

	getItemDescription(type) {
		const lang = localStorage.getItem('language') || 'ja';
		const items = ItemsConfig.getItemsConfig(lang) || {};
		const itemConfig = items[type];
		return itemConfig ? itemConfig.description || '' : '';
	}

	formatItemEffects(effects) {
		if (!effects || effects.length === 0) return '';
		
		return effects.map(effect => {
			const sign = effect.value > 0 ? '+' : '';
			return `${effect.name}: ${sign}${effect.value}`;
		}).join(', ');
	}

	updateBackpackUI() {
		this.game.uiManager.updateBackpackUI();
	}

	updateItemCount() {
		this.game.uiManager.updateItemCount();
	}

	updateInventoryDisplay() {
		this.game.uiManager.updateInventoryDisplay();
	}
} 