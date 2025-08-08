class MemoryManager {
	constructor(game) {
		this.game = game;
	}

	// メモリクリーンアップを行うメソッド
	performMemoryCleanup() {
		// 弾丸
		const maxBullets = 150;
		if (this.game.bullets.length > maxBullets) {
			const bulletsToRemove = this.game.bullets.length - maxBullets;
			for (let i = 0; i < bulletsToRemove; i++) {
				const bullet = this.game.bullets.shift();
				if (bullet) this.game.cleanupQueue.bullets.push(bullet);
			}
		}
		// 敵弾
		const maxEnemyBullets = 80;
		if (this.game.enemyBullets.size > maxEnemyBullets) {
			const bulletsToRemove = this.game.enemyBullets.size - maxEnemyBullets;
			let removed = 0;
			for (const [bulletId, bullet] of this.game.enemyBullets) {
				if (removed >= bulletsToRemove) break;
				this.game.enemyBullets.delete(bulletId);
				if (bullet) this.game.cleanupQueue.enemyBullets.push(bullet);
				removed++;
			}
		}
		/*
		// アイテム
		const maxItems = GameConfig.ITEM.MAX_COUNT * 3;
		if (this.game.items.length > maxItems) {
			const itemsToRemove = this.game.items.length - maxItems;
			for (let i = 0; i < itemsToRemove; i++) {
				const item = this.game.items.shift();
				if (item) this.game.cleanupQueue.items.push(item);
			}
		}
		*/
		// ポップアップ
		if (this.game.messagePopups && this.game.messagePopups.size > 5) {
			const popupArray = Array.from(this.game.messagePopups.entries());
			const popupsToRemove = popupArray.slice(0, popupArray.length - 5);
			popupsToRemove.forEach(([playerId, popup]) => {
				this.game.messagePopups.delete(playerId);
				if (popup) this.game.cleanupQueue.popups.push(popup);
			});
		}
		// インジケーター
		if (this.game.messageIndicators && this.game.messageIndicators.size > 3) {
			const indicatorArray = Array.from(this.game.messageIndicators.entries());
			const indicatorsToRemove = indicatorArray.slice(0, indicatorArray.length - 3);
			indicatorsToRemove.forEach(([playerId, indicator]) => {
				this.game.messageIndicators.delete(playerId);
				if (indicator) this.game.cleanupQueue.indicators.push(indicator);
			});
		}
	}

	// クリーンアップキューを毎フレーム少しずつ処理する
	processCleanupQueue() {
		// 弾丸
		for (let i = 0; i < 2; i++) {
			const bullet = this.game.cleanupQueue.bullets.shift();
			if (bullet) {
				if (bullet.model) this.game.scene.remove(bullet.model);
				if (bullet.dispose) bullet.dispose();
			}
		}
		// 敵弾
		for (let i = 0; i < 2; i++) {
			const bullet = this.game.cleanupQueue.enemyBullets.shift();
			if (bullet) {
				if (bullet.model) this.game.scene.remove(bullet.model);
				if (bullet.dispose) bullet.dispose();
			}
		}
		// アイテム
		for (let i = 0; i < 2; i++) {
			const item = this.game.cleanupQueue.items.shift();
			if (item && item.mesh) {
				this.game.scene.remove(item.mesh);
				if (item.mesh.geometry) item.mesh.geometry.dispose();
				if (item.mesh.material) {
					if (Array.isArray(item.mesh.material)) {
						item.mesh.material.forEach(mat => mat.dispose());
					} else {
						item.mesh.material.dispose();
					}
				}
			}
		}
		// ポップアップ
		for (let i = 0; i < 2; i++) {
			const popup = this.game.cleanupQueue.popups.shift();
			if (popup && popup.parentNode) popup.remove();
		}
		// インジケーター
		for (let i = 0; i < 2; i++) {
			const indicator = this.game.cleanupQueue.indicators.shift();
			if (indicator && indicator.parentNode) indicator.remove();
		}
	}
} 