class RankingManager {
	constructor(game) {
		this.game = game;
		this.setupRankingButton();
	}

	setupRankingButton() {
		const gameOverRankingButton = document.getElementById('gameOverRankingButton');
		const settingsRankingButton = document.getElementById('settingsRankingButton');
		const rankingModal = document.getElementById('rankingModal');
		const closeRankingModal = document.getElementById('closeRankingModal');

		if (!rankingModal || !closeRankingModal) return;

		// ゲームオーバー画面のランキングボタン
		if (gameOverRankingButton) {
			gameOverRankingButton.addEventListener('click', () => {
				this.showRankingModal();
			});
		}

		// 設定画面のランキングボタン
		if (settingsRankingButton) {
			settingsRankingButton.addEventListener('click', () => {
				this.showRankingModal();
			});
		}

		closeRankingModal.addEventListener('click', () => {
			rankingModal.style.display = 'none';
		});

		// モーダル外をクリックしても閉じる
		rankingModal.addEventListener('click', (e) => {
			if (e.target === rankingModal) {
				rankingModal.style.display = 'none';
			}
		});
	}

	async showRankingModal() {
		const rankingModal = document.getElementById('rankingModal');
		const rankingLoading = document.getElementById('rankingLoading');
		const rankingError = document.getElementById('rankingError');
		const rankingContent = document.getElementById('rankingContent');
		const rankingTableBody = document.getElementById('rankingTableBody');

		// モーダルを表示
		rankingModal.style.display = 'block';
		
		// ローディング状態を表示
		rankingLoading.style.display = 'block';
		rankingError.style.display = 'none';
		rankingContent.style.display = 'none';

		try {
			// ランキングデータを取得
			const rankingData = await window.neonAPI.getRanking();
			
			if (rankingData && rankingData.length > 0) {
				// ランキングテーブルを更新
				this.updateRankingTable(rankingData);
				
				// コンテンツを表示
				rankingLoading.style.display = 'none';
				rankingContent.style.display = 'block';
			} else {
				// データがない場合
				rankingLoading.style.display = 'none';
				rankingError.style.display = 'block';
				rankingError.innerHTML = '<i class="fas fa-exclamation-triangle"></i> ランキングデータがありません';
			}
		} catch (error) {
			console.error('ランキング取得エラー:', error);
			rankingLoading.style.display = 'none';
			rankingError.style.display = 'block';
			rankingError.innerHTML = '<i class="fas fa-exclamation-triangle"></i> ランキングの読み込みに失敗しました';
		}
	}

	updateRankingTable(rankingData) {
		const rankingTableBody = document.getElementById('rankingTableBody');
		
		// テーブルをクリア
		rankingTableBody.innerHTML = '';
		
		// 現在のプレイヤーIDを取得
		const currentPlayerId = this.game.socket ? this.game.socket.id : null;
		
		rankingData.slice(0, 20).forEach((player, index) => {
			const row = document.createElement('tr');
			
			// 順位に応じたクラスを追加
			if (index === 0) row.classList.add('rank-1');
			else if (index === 1) row.classList.add('rank-2');
			else if (index === 2) row.classList.add('rank-3');
			
			// 現在のプレイヤーの場合はハイライト
			if (player.user_id === currentPlayerId) {
				row.classList.add('current-player');
			}
			
			// 生存時間をゲーム内時間でフォーマット
			const survivalTime = this.formatGameTimeSurvivalTime(player.survival_time);
			
			row.innerHTML = `
				<td>${index + 1}</td>
				<td>${player.user_name || 'Unknown Player'}</td>
				<td>${player.score.toLocaleString()}</td>
				<td>${survivalTime}</td>
				<td>${player.killed_enemies}</td>
			`;
			
			rankingTableBody.appendChild(row);
		});
	}

	formatSurvivalTime(survivalTimeMs) {
		const seconds = Math.floor(survivalTimeMs / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (days > 0) {
			return `${days}日 ${hours % 24}時間 ${minutes % 60}分`;
		} else if (hours > 0) {
			return `${hours}時間 ${minutes % 60}分`;
		} else if (minutes > 0) {
			return `${minutes}分 ${seconds % 60}秒`;
		} else {
			return `${seconds}秒`;
		}
	}

	// ゲーム内時間で生存時間をフォーマット
	formatGameTimeSurvivalTime(survivalTimeMs) {
		const gameDayLength = GameConfig.TIME.DAY_LENGTH;
		
		// 生存時間をゲーム内の日数、時間、分に変換
		const survivalDays = Math.floor(survivalTimeMs / (gameDayLength * 1000));
		const survivalHours = Math.floor((survivalTimeMs % (gameDayLength * 1000)) / (gameDayLength * 1000 / 24));
		const survivalMinutes = Math.floor((survivalTimeMs % (gameDayLength * 1000 / 24)) / (gameDayLength * 1000 / 24 / 60));

		if (survivalDays > 0) {
			return `${survivalDays}日 ${survivalHours}時間 ${survivalMinutes}分`;
		} else if (survivalHours > 0) {
			return `${survivalHours}時間 ${survivalMinutes}分`;
		} else if (survivalMinutes > 0) {
			return `${survivalMinutes}分`;
		} else {
			return `0分`;
		}
	}
} 