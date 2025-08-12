class ItemEffectManager {
	constructor(game) {
		this.game = game;
		
		// アイテム効果表示用の要素
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

		// 初期表示を設定
		this.updateEffectsDisplay();
	}

	// アイテム効果の表示を更新
	updateEffectsDisplay() {
		if (!this.effectsContainer) return;

		const effects = this.game.playerStatus.getCurrentEffects();
		console.log('効果表示更新:', effects);
		// 効果がない場合はコンテナを非表示
		if (effects.size === 0) {
			this.effectsContainer.style.display = 'none';
			return;
		}

		// 効果がある場合はコンテナを表示
		this.effectsContainer.style.display = 'block';

		let html = '';

		for (const [effectId, effect] of effects.entries()) {
			const remainingTime = Math.ceil(effect.remainingTime / 1000); // ミリ秒を秒に変換
			const lang = localStorage.getItem('language') || 'ja';
			
			// 武器効果の場合は特別な処理
			if (effect.type === 'wepon') {
				html += `
                    <span style="margin: 0 8px 0 0; font-size: 10px; display: inline-block;">
                        <span style="color: #4CAF50; font-weight: bold; font-size: 10px;">[${effect.name}]</span>
                        <span style="color: #4CAF50; font-size: 9px;">武器効果</span>
                        <span style="color: #FFD700; margin-left: 3px; font-size: 9px;">${remainingTime}s</span>
                    </span>
                `;
			} else {
				// その他の効果はItemsConfigから取得
				const effectConfig = ItemsConfig.getItemConfig(effect.type, lang);
				if (effectConfig) {
					html += `
                        <span style="margin: 0 8px 0 0; font-size: 10px; display: inline-block;">
                            <span style="color: #4CAF50; font-weight: bold; font-size: 10px;">[${effectConfig.name}]</span>
                            <span style="color: #4CAF50; font-size: 9px;">${effectConfig.description}</span>
                            <span style="color: #FFD700; margin-left: 3px; font-size: 9px;">${remainingTime}s</span>
                        </span>
                    `;
				} else {
					// 効果設定が見つからない場合のフォールバック
					html += `
                        <span style="margin: 0 8px 0 0; font-size: 10px; display: inline-block;">
                            <span style="color: #4CAF50; font-weight: bold; font-size: 10px;">[${effect.type}]</span>
                            <span style="color: #4CAF50; font-size: 9px;">効果</span>
                            <span style="color: #FFD700; margin-left: 3px; font-size: 9px;">${remainingTime}s</span>
                        </span>
                    `;
				}
			}
		}

		this.effectsContainer.innerHTML = html;
	}

	useItem(itemType) {
		const lang = localStorage.getItem('language') || 'ja';
		const itemConfig = ItemsConfig.getItemConfig(itemType, lang);
		if (!itemConfig) {
			console.warn('アイテム設定が見つかりません:', itemType);
			return;
		}
		
		console.log('アイテム使用:', itemType, itemConfig);
		
		// アイテム名を取得
		const itemName = itemConfig.name || itemType;
		const isEnglish = lang === 'en';
		let effectMessage = isEnglish 
			? `✨ Used ${itemName}! ✨`
			: `✨ ${itemName}を使用しました！ ✨`;
		
		// 食べ物・飲み物サウンド
		if (itemConfig.category === 'food') {
			this.game.audioManager.play('eat');
		} else if (itemConfig.category === 'drink') {
			this.game.audioManager.play('drink');
		}
		
		// 即時効果の適用（instant形式とimmediate形式の両方に対応）
		if (itemConfig.effects) {
			const instantEffects = itemConfig.effects.instant || itemConfig.effects.immediate;
			if (instantEffects) {
				console.log('即時効果適用:', instantEffects);
				
				// instant形式（日本語設定）
				if (instantEffects.type) {
					if (instantEffects.type === 'health') {
						this.game.playerStatus.addHealth(instantEffects.value);
						effectMessage += isEnglish 
							? `\n💚 Health recovered by ${instantEffects.value}!`
							: `\n💚 体力が${instantEffects.value}回復しました！`;
					} else if (instantEffects.type === 'hunger') {
						this.game.playerStatus.addHunger(instantEffects.value);
						effectMessage += isEnglish 
							? `\n🍖 Hunger recovered by ${instantEffects.value}!`
							: `\n🍖 空腹が${instantEffects.value}回復しました！`;
					} else if (instantEffects.type === 'thirst') {
						this.game.playerStatus.addThirst(instantEffects.value);
						effectMessage += isEnglish 
							? `\n💧 Thirst recovered by ${instantEffects.value}!`
							: `\n💧 喉の渇きが${instantEffects.value}回復しました！`;
					} else if (instantEffects.type === 'stamina') {
						// スタミナ効果
						this.game.playerStatus.addStamina(instantEffects.value);
						effectMessage += isEnglish 
							? `\n⚡ Stamina recovered by ${instantEffects.value}!`
							: `\n⚡ スタミナが${instantEffects.value}回復しました！`;
					} else if (instantEffects.type === 'experience') {
						// 経験値効果
						this.game.playerStatus.addExperience(instantEffects.value);
						effectMessage += isEnglish 
							? `\n⭐ Experience gained: ${instantEffects.value}!`
							: `\n⭐ 経験値を${instantEffects.value}獲得しました！`;
					} else if (instantEffects.type === 'warp') {
						// ワープ効果
						this.game.warpToRandomPlayer();
						effectMessage += isEnglish 
							? `\n✨ Warped to another player!`
							: `\n✨ 他のプレイヤーの近くにワープしました！`;
					}
				}
				// immediate形式（英語設定）
				else {
					if (instantEffects.health) {
						this.game.playerStatus.addHealth(instantEffects.health);
						effectMessage += isEnglish 
							? `\n💚 Health recovered by ${instantEffects.health}!`
							: `\n💚 体力が${instantEffects.health}回復しました！`;
					}
					if (instantEffects.hunger) {
						this.game.playerStatus.addHunger(instantEffects.hunger);
						effectMessage += isEnglish 
							? `\n🍖 Hunger recovered by ${instantEffects.hunger}!`
							: `\n🍖 空腹が${instantEffects.hunger}回復しました！`;
					}
					if (instantEffects.thirst) {
						this.game.playerStatus.addThirst(instantEffects.thirst);
						effectMessage += isEnglish 
							? `\n💧 Thirst recovered by ${instantEffects.thirst}!`
							: `\n💧 喉の渇きが${instantEffects.thirst}回復しました！`;
					}
					if (instantEffects.experience) {
						this.game.playerStatus.addExperience(instantEffects.experience);
						effectMessage += isEnglish 
							? `\n⭐ Experience gained: ${instantEffects.experience}!`
							: `\n⭐ 経験値を${instantEffects.experience}獲得しました！`;
					}
					if (instantEffects.hygiene !== undefined) {
						this.game.playerStatus.hygiene = Math.max(0, Math.min(100, this.game.playerStatus.hygiene + instantEffects.hygiene));
						effectMessage += isEnglish 
							? `\n🧼 Hygiene ${instantEffects.hygiene > 0 ? '+' : ''}${instantEffects.hygiene}!`
							: `\n🧼 衛生が${instantEffects.hygiene > 0 ? '+' : ''}${instantEffects.hygiene}変化しました！`;
					}
					if (instantEffects.stamina !== undefined) {
						this.game.playerStatus.addStamina(instantEffects.stamina);
						effectMessage += isEnglish 
							? `\n⚡ Stamina recovered by ${instantEffects.stamina}!`
							: `\n⚡ スタミナが${instantEffects.stamina}回復しました！`;
					}
				}
			}
		}

		// 持続効果の適用
		if (itemConfig.effects && itemConfig.effects.duration) {
			const durationEffect = itemConfig.effects.duration;
			console.log('持続効果適用:', durationEffect);
			this.game.playerStatus.addDurationEffect(durationEffect);
			
			// 持続効果のメッセージを追加
			if (durationEffect.type === 'wepon') {
				effectMessage += isEnglish 
					? `\n⚔️ Equipped ${itemName}!`
					: `\n⚔️ ${itemName}を装備しました！`;
			} else if (durationEffect.type === 'temperature') {
				effectMessage += isEnglish 
					? `\n🔥 Temperature increased by ${durationEffect.value}!`
					: `\n🔥 体温が${durationEffect.value}上昇しました！`;
			} else {
				effectMessage += isEnglish 
					? `\n⏰ Effect lasts for ${Math.floor(durationEffect.duration / 1000)} seconds!`
					: `\n⏰ 効果が${Math.floor(durationEffect.duration / 1000)}秒間持続します！`;
			}
		}

		// アイテム効果メッセージを表示
		this.game.messageManager.showItemEffectMessage(effectMessage, itemType);

		// インベントリからアイテムを削除
		const index = this.game.inventory.findIndex(item => item.type === itemType);
		if (index !== -1) {
			this.game.inventory.splice(index, 1);
			
			// ワープ薬を使用した場合、インベントリにワープ薬が残っていない場合は自動的に1つ追加
			if (itemType === 'warpPotion') {
				const hasWarpPotion = this.game.inventory.some(item => item.type === 'warpPotion');
				if (!hasWarpPotion) {
					this.game.inventory.push({
						id: Date.now(),
						type: 'warpPotion'
					});
					console.log('ワープ薬を自動追加');
				}
			}
			
			this.game.updateBackpackUI();
		}
	}
}
