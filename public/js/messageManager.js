class MessageManager {
	constructor(game) {
		this.game = game;
		this.messagePopups = new Map();
		this.messageIndicators = new Map();
		this.init();
	}

	init() {
		this.createMessageIndicatorContainer();
		this.setupMessageSocketEvents();
		this.initMessagePopup();
	}

	createMessageIndicatorContainer() {
		const container = document.createElement('div');
		container.id = 'messageIndicators';
		
		container.style.position = 'fixed';
		container.style.top = '0';
		container.style.left = '0';
		container.style.width = '100%';
		container.style.height = '100%';
		container.style.pointerEvents = 'none';
		container.style.zIndex = '1000';
		document.body.appendChild(container);
	}

	setupMessageSocketEvents() {
		// メッセージを受信したときの処理
		this.game.socket.on('showMessage', (data) => {
			//console.log('メッセージを受信:', data);
			this.showMessagePopupForPlayer(data.playerId, data.position);
		});
	}

	initMessagePopup() {
		/*
		const messageButton = document.getElementById('messageButton');
		messageButton.addEventListener('click', () => {
			// サーバーにメッセージを送信
			this.game.socket.emit('playerMessage', {
				position: this.game.playerModel.getPosition()
			});
			// 自分の画面にも表示
			this.showMessagePopup();
		});
		*/
	}

	showMessagePopup() {
		this.showMessagePopupForPlayer(this.game.socket.id, this.game.playerModel.getPosition());
	}

	showMessagePopupForPlayer(playerId, position) {
		// プレイヤーの位置を取得
		const playerPosition = this.game.players.get(playerId)?.getPosition();
		if (!playerPosition) return;

		// 画面内かどうかをチェック
		const screenPosition = this.game.getScreenPosition(playerPosition);
		const isOnScreen = screenPosition.x >= 0 && screenPosition.x <= window.innerWidth &&
			screenPosition.y >= 0 && screenPosition.y <= window.innerHeight;

		if (isOnScreen) {
			// 画面内の場合は通常のポップアップを表示
			if (this.messagePopups.has(playerId)) {
				this.messagePopups.get(playerId).remove();
				this.messagePopups.delete(playerId);
			}

			const popup = document.createElement('div');
			popup.className = 'message-popup';
			popup.textContent = 'help';
			document.body.appendChild(popup);

			this.messagePopups.set(playerId, popup);

			popup.style.left = `${screenPosition.x}px`;
			popup.style.top = `${screenPosition.y}px`;

			setTimeout(() => {
				if (this.messagePopups && this.messagePopups.has(playerId)) {
					this.messagePopups.get(playerId).remove();
					this.messagePopups.delete(playerId);
				}
			}, 3000);
		} else {
			// 画面外の場合は方向インジケーターを表示
			this.showMessageIndicator(playerId, screenPosition);
		}
	}

	showMessageIndicator(playerId, screenPosition) {
		// 既存のインジケーターを削除
		if (this.messageIndicators.has(playerId)) {
			this.messageIndicators.get(playerId).remove();
			this.messageIndicators.delete(playerId);
		}

		// 新しいインジケーターを作成
		const indicator = document.createElement('div');
		indicator.className = 'message-indicator';
		indicator.innerHTML = '<i class="fas fa-exclamation-circle"></i> help';
		indicator.style.position = 'fixed';
		indicator.style.color = 'red';
		indicator.style.fontSize = '20px';
		indicator.style.pointerEvents = 'none';
		indicator.style.zIndex = '1000';

		// 画面の端に配置
		const edgeMargin = 20;
		let left = screenPosition.x;
		let top = screenPosition.y;

		// 画面外の位置を調整
		if (left < 0) left = edgeMargin;
		if (left > window.innerWidth) left = window.innerWidth - edgeMargin;
		if (top < 0) top = edgeMargin;
		if (top > window.innerHeight) top = window.innerHeight - edgeMargin;

		indicator.style.left = `${left}px`;
		indicator.style.top = `${top}px`;

		// インジケーターを追加
		document.getElementById('messageIndicators').appendChild(indicator);
		this.messageIndicators.set(playerId, indicator);

		// 3秒後に削除
		setTimeout(() => {
			if (this.messageIndicators.has(playerId)) {
				this.messageIndicators.get(playerId).remove();
				this.messageIndicators.delete(playerId);
			}
		}, 3000);
	}
	
	updateMessageIndicators() {
		if (!this.messageIndicators || this.messageIndicators.size === 0) return;

		this.messageIndicators.forEach((indicator, playerId) => {
			const player = this.game.players.get(playerId);
			if (!player) return;

			const screenPosition = this.game.getScreenPosition(player.getPosition());
			const edgeMargin = 20;
			let left = screenPosition.x;
			let top = screenPosition.y;

			// 画面外の位置を調整
			if (left < 0) left = edgeMargin;
			if (left > window.innerWidth) left = window.innerWidth - edgeMargin;
			if (top < 0) top = edgeMargin;
			if (top > window.innerHeight) top = window.innerHeight - edgeMargin;

			indicator.style.left = `${left}px`;
			indicator.style.top = `${top}px`;
		});
	}

	// アニメーションループ内でポップアップの位置を更新
	updateMessagePopups() {
		// messagePopupsが存在しない場合は初期化
		if (!this.messagePopups) {
			this.messagePopups = new Map();
			return;
		}

		this.messagePopups.forEach((popup, playerId) => {
			// プレイヤーの位置を取得
			let position;
			if (playerId === this.game.socket.id) {
				position = this.game.playerModel.getPosition();
			} else {
				const player = this.game.players.get(playerId);
				if (player) {
					position = player.getPosition();
				}
			}

			if (position) {
				const screenPosition = this.game.getScreenPosition(position);
				const isOnScreen = screenPosition.x >= 0 && screenPosition.x <= window.innerWidth &&
					screenPosition.y >= 0 && screenPosition.y <= window.innerHeight;

				if (isOnScreen) {
					// 画面内の場合は通常のポップアップを表示
					popup.style.left = `${screenPosition.x}px`;
					popup.style.top = `${screenPosition.y}px`;
					popup.style.display = 'block';
				} else {
					// 画面外の場合はポップアップを非表示にしてインジケーターを表示
					popup.style.display = 'none';
					this.showMessageIndicator(playerId, screenPosition);
				}
			}
		});
	}

	showMessage(message) {
		// 画面上に一時的なメッセージを表示
		let msgDiv = document.getElementById('game-message-popup');
		if (!msgDiv) {
			msgDiv = document.createElement('div');
			msgDiv.id = 'game-message-popup';
			msgDiv.style.position = 'fixed';
			msgDiv.style.top = '20%';
			msgDiv.style.left = '50%';
			msgDiv.style.transform = 'translate(-50%, -50%)';
			msgDiv.style.background = 'rgba(0,0,0,0.8)';
			msgDiv.style.color = '#fff';
			msgDiv.style.padding = '16px 32px';
			msgDiv.style.borderRadius = '10px';
			msgDiv.style.fontSize = '18px';
			msgDiv.style.zIndex = '3000';
			document.body.appendChild(msgDiv);
		}
		msgDiv.textContent = message;
		msgDiv.style.display = 'block';
		// 3秒後に自動で消す
		clearTimeout(window._gameMsgTimeout);
		window._gameMsgTimeout = setTimeout(() => {
			msgDiv.style.display = 'none';
		}, 3000);
		console.log(message);
	}

	showItemEffectMessage(message, itemType = null) {
		// アイテム効果専用のメッセージ表示
		let itemMsgDiv = document.getElementById('item-effect-message');
		if (!itemMsgDiv) {
			itemMsgDiv = document.createElement('div');
			itemMsgDiv.id = 'item-effect-message';
			itemMsgDiv.style.position = 'fixed';
			itemMsgDiv.style.top = '10%';
			itemMsgDiv.style.left = '50%';
			itemMsgDiv.style.transform = 'translate(-50%, -50%)';
			itemMsgDiv.style.background = 'linear-gradient(135deg, rgba(0,255,0,0.8), rgba(0,200,0,0.8))';
			itemMsgDiv.style.color = '#fff';
			itemMsgDiv.style.padding = '12px 24px';
			itemMsgDiv.style.borderRadius = '10px';
			itemMsgDiv.style.fontSize = '14px';
			itemMsgDiv.style.fontWeight = 'bold';
			itemMsgDiv.style.zIndex = '3001';
			itemMsgDiv.style.boxShadow = '0 2px 10px rgba(0,255,0,0.3)';
			itemMsgDiv.style.border = '1px solid rgba(255,255,255,0.3)';
			itemMsgDiv.style.textAlign = 'center';
			itemMsgDiv.style.minWidth = '200px';
			itemMsgDiv.style.maxWidth = '400px';
			itemMsgDiv.style.opacity = '0';
			itemMsgDiv.style.transition = 'all 0.3s ease-in-out';
			itemMsgDiv.style.lineHeight = '1.4';
			document.body.appendChild(itemMsgDiv);
		}

		// アイテムタイプに応じて色を変更
		if (itemType) {
			const itemConfig = getItemsConfig('ja')[itemType];
			if (itemConfig && itemConfig.color) {
				const color = '#' + itemConfig.color.toString(16).padStart(6, '0');
				itemMsgDiv.style.background = `linear-gradient(135deg, ${color}80, ${color}60)`;
				itemMsgDiv.style.boxShadow = `0 4px 20px ${color}40`;
			}
		}

		itemMsgDiv.textContent = message;
		itemMsgDiv.style.display = 'block';
		
		// フェードインアニメーション
		setTimeout(() => {
			itemMsgDiv.style.opacity = '1';
			itemMsgDiv.style.transform = 'translate(-50%, -50%) scale(1.1)';
		}, 10);

		// 3秒後にフェードアウト
		clearTimeout(window._itemEffectTimeout);
		window._itemEffectTimeout = setTimeout(() => {
			itemMsgDiv.style.opacity = '0';
			itemMsgDiv.style.transform = 'translate(-50%, -50%) scale(0.9)';
			setTimeout(() => {
				itemMsgDiv.style.display = 'none';
			}, 300);
		}, 3000);

		console.log('アイテム効果メッセージ:', message);
	}
} 