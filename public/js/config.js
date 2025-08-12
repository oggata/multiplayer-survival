/**
 * ゲーム設定値
 */
const GameConfig = {
	// プレイヤー設定
	PLAYER: {
		MOVE_SPEED: 5.5,
		ROTATION_SPEED: 0.05,
		MAX_HEALTH: 100,
		COLLISION_RADIUS: 1.0,
		hungerDecreaseRate: 0.006,
		thirstDecreaseRate: 0.01,
		hygieneDecreaseRate: 0.1,
		healthDecreaseRate: 0.001
	},

	// ライティング設定
	LIGHTING: {
		AMBIENT_INTENSITY: 0.03,
		SUN_INTENSITY: 0.1,
		SUN_INTENSITY_NIGHT: 0.1,
		SUN_INTENSITY_DAWN_DUSK: 1
	},

	// 時間設定
	TIME: {
		DAY_LENGTH: 180, // 秒
		TIME_SPEED: 0.1 // 1フレームあたりの時間進行
	},

	// 霧設定
	FOG: {
		DENSITY: 0.009
	},

	// カメラ設定
	CAMERA: {
		OFFSET_Y: 4.5,
		OFFSET_Z: 15
	},

	// アイテム設定
	ITEM: {
		MAX_COUNT: 5,
		COLLECTION_RADIUS: 1.0,
		SPAWN: {
			BUILDING_RADIUS: 15, // 建物からのスポーン半径
			BUILDING_CHANCE: 0.8, // 建物近くでのスポーン確率
			EMPTY_CHANCE: 0.2, // 空き地でのスポーン確率
			MIN_DISTANCE: 400, // 建物からの最小距離
			MAX_DISTANCE: 500 // 建物からの最大距離
		}
	},

	// マップ設定
	MAP: {
		SIZE: 6000,
		CHUNK_SIZE: 50,
		VISLBLE_DISTANCE: 60, // 視認距離を80から60に短縮
		OBJECT_VISIBLE_DISTANCE: 45, // オブジェクト視認距離も短縮
		BOUNDARY_WALL_HEIGHT: 0,
		BIOME: {
			RADIUS: 500, // バイオームの半径
			TYPES: ['urban', 'forest', 'ruins', 'industrial', 'canyon'], // バイオームの種類
			COLORS: {
				canyon: {
					base: '#8B4513',
					highlight: '#A0522D',
					mid: '#CD853F',
					top: '#DEB887',
					palette: {
						color1: '#2C3E50', // 深い青
						color2: '#34495E', // 濃い青
						color3: '#7F8C8D', // グレー
						color4: '#95A5A6', // 明るいグレー
						color5: '#BDC3C7', // 薄いグレー
						color6: '#ECF0F1', // ほぼ白
						color7: '#E74C3C', // 赤
						color8: '#C0392B', // 濃い赤
						color9: '#8E44AD', // 紫
						color10: '#9B59B6', // 明るい紫
						color11: '#3498DB', // 青
						color12: '#2980B9' // 濃い青
					}
				},
				forest: {
					base: '#228B22',
					highlight: '#32CD32',
					mid: '#90EE90',
					top: '#98FB98',
					palette: {
						color1: '#1B4D3E', // 深い緑
						color2: '#2E7D32', // 濃い緑
						color3: '#388E3C', // 緑
						color4: '#43A047', // 明るい緑
						color5: '#66BB6A', // 薄い緑
						color6: '#81C784', // ほぼ白緑
						color7: '#A5D6A7', // 薄い緑
						color8: '#C8E6C9', // 明るい緑
						color9: '#E8F5E9', // 白緑
						color10: '#F1F8E9', // 明るい白緑
						color11: '#DCEDC8', // 薄い黄緑
						color12: '#F9FBE7' // 明るい黄緑
					}
				},
				ruins: {
					base: '#696969',
					highlight: '#808080',
					mid: '#A9A9A9',
					top: '#D3D3D3',
					palette: {
						color1: '#263238', // 深いグレー
						color2: '#37474F', // 濃いグレー
						color3: '#455A64', // グレー
						color4: '#546E7A', // 明るいグレー
						color5: '#607D8B', // 薄いグレー
						color6: '#78909C', // ほぼ白グレー
						color7: '#90A4AE', // 薄いグレー
						color8: '#B0BEC5', // 明るいグレー
						color9: '#CFD8DC', // 白グレー
						color10: '#ECEFF1', // 明るい白グレー
						color11: '#F5F5F5', // 薄い白
						color12: '#FAFAFA' // 明るい白
					}
				},
				urban: {
					base: '#4A4A4A',
					highlight: '#696969',
					mid: '#808080',
					top: '#A9A9A9',
					palette: {
						color1: '#212121', // 深いグレー
						color2: '#424242', // 濃いグレー
						color3: '#616161', // グレー
						color4: '#757575', // 明るいグレー
						color5: '#9E9E9E', // 薄いグレー
						color6: '#BDBDBD', // ほぼ白グレー
						color7: '#E0E0E0', // 薄いグレー
						color8: '#EEEEEE', // 明るいグレー
						color9: '#F5F5F5', // 白グレー
						color10: '#FAFAFA', // 明るい白グレー
						color11: '#FFFFFF', // 白
						color12: '#F8F9FA' // 明るい白
					}
				},
				industrial: {
					base: '#2F4F4F',
					highlight: '#3F5F5F',
					mid: '#4F6F6F',
					top: '#5F7F7F',
					palette: {
						color1: '#4A148C', // 深い紫
						color2: '#6A1B9A', // 濃い紫
						color3: '#7B1FA2', // 紫
						color4: '#8E24AA', // 明るい紫
						color5: '#9C27B0', // 薄い紫
						color6: '#AB47BC', // ほぼ白紫
						color7: '#BA68C8', // 薄い紫
						color8: '#CE93D8', // 明るい紫
						color9: '#E1BEE7', // 白紫
						color10: '#F3E5F5', // 明るい白紫
						color11: '#F5F5F5', // 薄い白
						color12: '#FAFAFA' // 明るい白
					}
				}
			},
			SETTINGS: {
				'urban': {
					buildingDensity: 0.8,
					buildingTypes: ['skyscraper', 'office', 'apartment', 'mall', 'hotel'],
					treeDensity: 0.1,
					treeTypes: ['oak', 'maple'],
					debrisDensity: 0.3,
					debrisTypes: ['concrete', 'metal', 'glass', 'brick']
				},
				'forest': {
					buildingDensity: 0.05,
					buildingTypes: ['residential', 'school'],
					treeDensity: 0.95,
					treeTypes: ['pine', 'oak', 'birch', 'maple', 'redwood', 'willow'],
					debrisDensity: 0.1,
					debrisTypes: ['wood', 'rock']
				},
				'ruins': {
					buildingDensity: 0.4,
					buildingTypes: ['residential', 'industrial', 'school'],
					treeDensity: 0.3,
					treeTypes: ['oak', 'maple', 'willow'],
					debrisDensity: 0.7,
					debrisTypes: ['concrete', 'metal', 'glass', 'brick', 'wood', 'rock']
				},
				'industrial': {
					buildingDensity: 0.6,
					buildingTypes: ['industrial', 'office', 'warehouse'],
					treeDensity: 0.05,
					treeTypes: ['oak', 'maple'],
					debrisDensity: 0.5,
					debrisTypes: ['metal', 'concrete', 'plastic', 'rubber']
				},
				'beach': {
					buildingDensity: 0.2,
					buildingTypes: ['residential', 'hotel'],
					treeDensity: 0.2,
					treeTypes: ['palm', 'cypress'],
					debrisDensity: 0.2,
					debrisTypes: ['wood', 'plastic', 'ceramic']
				},
				'canyon': {
					buildingDensity: 0.1,
					buildingTypes: ['ruins', 'industrial'],
					treeDensity: 0.05,
					treeTypes: ['cactus', 'dead_tree'],
					debrisDensity: 0.3,
					debrisTypes: ['rock', 'sand', 'clay']
				}
			}
		},
		FLOOR: {
			THICKNESS: 1,
			COLOR: 0x808080,
			GRID_SIZE: 1,
			GRID_COLOR: 0x000000,
			GRID_SECONDARY_COLOR: 0x444444
		},
		BUILDINGS: {
			DENSITY: 1, // 建物の生成確率（0-1）
			MIN_DISTANCE: 250, // 建物間の最小距離（建物の最大幅40の2倍）
			MAX_ATTEMPTS: 20 // 建物配置の最大試行回数
		},
		LOD: {
			DISTANCES: [100, 200, 300], // LODの距離閾値
			SEGMENTS: [5, 5, 5] // 各LODレベルのセグメント数
		},
		DEBUG: {
			SHOW_WIREFRAME: false, // メッシュのワイヤーフレームを表示するかどうか
			WIREFRAME_COLOR: 0x000000 // ワイヤーフレームの色
		},
		SPAWN: {
			SAFE_SPOT_DISTANCE: 20, // 安全なスポーン位置からの最小距離
			SAFE_POSITIONS: [
				{
					x: 0,
					y: 0,
					z: -200
				}
			]
		},
		OBJECT_TYPES: {
			BUILDINGS: [{
					name: 'skyscraper',
					minHeight: 30,
					maxHeight: 100,
					color: 0x555555
				},
				{
					name: 'office',
					minHeight: 15,
					maxHeight: 40,
					color: 0x666666
				},
				{
					name: 'residential',
					minHeight: 5,
					maxHeight: 15,
					color: 0x777777
				},
				{
					name: 'industrial',
					minHeight: 8,
					maxHeight: 20,
					color: 0x444444
				},
				{
					name: 'mall',
					minHeight: 10,
					maxHeight: 25,
					color: 0x888888
				},
				{
					name: 'hospital',
					minHeight: 12,
					maxHeight: 35,
					color: 0xFFFFFF
				},
				{
					name: 'school',
					minHeight: 8,
					maxHeight: 20,
					color: 0xCCCCCC
				},
				{
					name: 'apartment',
					minHeight: 15,
					maxHeight: 45,
					color: 0x999999
				},
				{
					name: 'hotel',
					minHeight: 20,
					maxHeight: 60,
					color: 0xAAAAAA
				}
			],
			DEBRIS: [{
					name: 'concrete',
					size: 3,
					color: 0x888888
				},
				{
					name: 'metal',
					size: 2,
					color: 0x777777
				},
				{
					name: 'glass',
					size: 1,
					color: 0xCCFFFF
				},
				{
					name: 'wood',
					size: 2,
					color: 0x8B4513
				},
				{
					name: 'brick',
					size: 1.5,
					color: 0xB22222
				},
				{
					name: 'plastic',
					size: 1,
					color: 0xE6E6FA
				},
				{
					name: 'rubber',
					size: 1.5,
					color: 0x2F4F4F
				},
				{
					name: 'ceramic',
					size: 1,
					color: 0xF5F5F5
				}
			],
			TREES: [{
					name: 'pine',
					trunkColor: 0x8B4513,
					leavesColor: 0x228B22,
					trunkWidth: 0.2,
					trunkHeight: 1.0,
					leavesSize: 1.2
				},
				{
					name: 'oak',
					trunkColor: 0x654321,
					leavesColor: 0x2E8B57,
					trunkWidth: 0.3,
					trunkHeight: 0.8,
					leavesSize: 1.5
				},
				{
					name: 'birch',
					trunkColor: 0xF5F5DC,
					leavesColor: 0x90EE90,
					trunkWidth: 0.15,
					trunkHeight: 0.9,
					leavesSize: 1.0
				},
				{
					name: 'maple',
					trunkColor: 0x8B4513,
					leavesColor: 0xFF4500,
					trunkWidth: 0.25,
					trunkHeight: 0.7,
					leavesSize: 1.3
				},
				{
					name: 'willow',
					trunkColor: 0x8B4513,
					leavesColor: 0x32CD32,
					trunkWidth: 0.2,
					trunkHeight: 0.6,
					leavesSize: 1.8
				},
				{
					name: 'palm',
					trunkColor: 0x8B4513,
					leavesColor: 0x228B22,
					trunkWidth: 0.3,
					trunkHeight: 1.2,
					leavesSize: 2.0
				},
				{
					name: 'cherry',
					trunkColor: 0x8B4513,
					leavesColor: 0xFFB6C1,
					trunkWidth: 0.2,
					trunkHeight: 0.8,
					leavesSize: 1.4
				},
				{
					name: 'cypress',
					trunkColor: 0x8B4513,
					leavesColor: 0x006400,
					trunkWidth: 0.15,
					trunkHeight: 1.1,
					leavesSize: 0.8
				},
				{
					name: 'redwood',
					trunkColor: 0x8B4513,
					leavesColor: 0x228B22,
					trunkWidth: 0.4,
					trunkHeight: 1.5,
					leavesSize: 1.6
				}
			],
			ROCKS: [{
					name: 'granite',
					color: 0x808080,
					size: 1.0,
					roughness: 0.9
				},
				{
					name: 'limestone',
					color: 0xD3D3D3,
					size: 0.8,
					roughness: 0.8
				},
				{
					name: 'basalt',
					color: 0x2F4F4F,
					size: 1.2,
					roughness: 0.95
				},
				{
					name: 'sandstone',
					color: 0xD2B48C,
					size: 0.9,
					roughness: 0.7
				},
				{
					name: 'marble',
					color: 0xFFFFFF,
					size: 0.7,
					roughness: 0.6
				},
				{
					name: 'obsidian',
					color: 0x000000,
					size: 1.1,
					roughness: 0.85
				},
				{
					name: 'quartz',
					color: 0xE6E6FA,
					size: 0.6,
					roughness: 0.5
				},
				{
					name: 'slate',
					color: 0x708090,
					size: 0.8,
					roughness: 0.75
				},
				{
					name: 'shale',
					color: 0x556B2F,
					size: 0.7,
					roughness: 0.8
				}
			],
			CANYON: {
				CLIFF: {
					minHeight: 50,
					maxHeight: 200,
					width: 100,
					color: 0x8B4513,
					layers: 5,
					layerHeight: 20,
					layerColor: 0xA0522D
				},
				PLATEAU: {
					minHeight: 100,
					maxHeight: 300,
					width: 200,
					color: 0xCD853F,
					slope: 0.3
				},
				RAVINE: {
					minWidth: 20,
					maxWidth: 50,
					depth: 100,
					color: 0x6B3E2E,
					slope: 0.8
				},
				MESA: {
					minHeight: 80,
					maxHeight: 150,
					width: 150,
					color: 0x8B4513,
					topColor: 0xCD853F
				}
			}
		}
	},

	// 色設定
	COLORS: {
		SKY_DAY: 0x4A6FA5,
		SKY_NIGHT: 0x000022,
		SKY_DAWN: 0xFF7F50,
		SKY_DUSK: 0xFF4500,
		FOG_DAY: 0x999999,
		FOG_NIGHT: 0x222244,
		FOG_DAWN_DUSK: 0xffccaa
	},

	// 敵設定
	ENEMY: {
		TYPES: {
			NORMAL: {
				name: 'normal',
				color: 0x00ff00, // 緑色
				moveSpeed: 2,
				damage: 2,
				shootBullets: false
			},
			FAST: {
				name: 'fast',
				color: 0xff0000, // 赤色
				moveSpeed: 3, // 2倍の速度
				damage: 1, // 半分のダメージ
				shootBullets: false
			},
			SHOOTER: {
				name: 'shooter',
				color: 0x800080, // 紫色
				moveSpeed: 2,
				damage: 1,
				shootBullets: true,
				shootInterval: 3000, // 3秒ごとに弾を発射
				bulletSpeed: 15,
				bulletDamage: 15
			},
			QUADRUPED: {
				name: 'quadruped',
				color: 0x6a7a5d, // 暗い緑色
				moveSpeed: 2.2, // 20%増加
				damage: 3, // 50%増加
				shootBullets: false
			},
			HEXAPOD: {
				name: 'hexapod',
				color: 0x331122, // 暗い赤紫色
				moveSpeed: 2.2, // 40%増加
				damage: 2.4, // 20%増加
				shootBullets: false
			},
			GIANT: {
				name: 'giant',
				color: 0x8B4513, // 茶色
				moveSpeed: 1.6, // 20%減少
				damage: 4, // 2倍
				shootBullets: false
			},
			CRAB: {
				name: 'crab',
				color: 0xFF4500, // オレンジレッド
				moveSpeed: 2.2, // 10%増加
				damage: 2.6, // 30%増加
				shootBullets: false
			},
			FLYING: {
				name: 'flying',
				color: 0x4B0082, // インディゴ
				moveSpeed: 3.2, // 60%増加
				damage: 2.2, // 10%増加
				shootBullets: false
			},
			SLIME: {
				name: 'slime',
				color: 0x00ff00, // 春緑
				moveSpeed: 1.8, // 10%減少
				damage: 2.8, // 40%増加
				shootBullets: false
			},
			BOSS: {
				name: 'boss',
				color: 0xFF0000, // 赤
				moveSpeed: 1.4, // 30%減少
				damage: 6, // 3倍
				shootBullets: true,
				shootInterval: 2000, // 2秒ごとに弾を発射
				bulletSpeed: 20,
				bulletDamage: 20
			}
		}
	},
	
	// 武器設定
	WEAPON: {
		BULLET001: {
			reload: 0.8,
			damage: 15,
			speed: 30,
			lifetime: 1.5,
			color: 0xfbff00
		},
		GRENADELAUNCHER: {
			reload: 3.0,
			damage: 100,
			speed: 10,
			explosionRadius: 6,
			lifetime: 5.2,
			color: 0x666666
		},
		FLAMETHROWER: {
			reload: 0.1,
			damage: 2,
			speed: 20,
			lifetime: 0.3,
			color: 0xff6600
		},
		PLASMACANNON: {
			reload: 2.5,
			damage: 10,
			speed: 5,
			lifetime: 1.0,
			color: 0x00ffff
		},
		MISSILELAUNCHER: {
			reload: 2.5,
			damage: 40,
			speed: 10,
			lifetime: 4.0,
			color: 0x666666
		},
		SHOTGUN: {
			reload: 1.8,
			damage: 20,
			speed: 25,
			lifetime: 1.5,
			color: 0xff0000
		},
		MAGNUM: {
			reload: 3,
			damage: 50,
			speed: 30,
			lifetime: 1.5,
			color: 0xfbff00
		},
		ROCKETLAUNCHER: {
			reload: 1.8,
			damage: 60,
			speed: 15,
			lifetime: 1.5,
			color: 0xfbff00
		},
		MACHINEGUN: {
			reload: 0.1,
			damage: 2,
			speed: 35,
			lifetime: 1.3,
			color: 0x85d098
		}
	},

	// 気象設定
	WEATHER: {
		TYPES: ['rain'],
		CHANGE_INTERVAL: 300, // 気象変化の間隔（秒）
		// 時間帯ごとの天候確率（0-1の値）
		TIME_BASED_PROBABILITIES: {
			// 朝 (0.2-0.25)
			DAWN: {
				clear: 0.6,
				cloudy: 0.3,
				rain: 0.1,
				snow: 0.0,
				storm: 0.0
			},
			// 昼 (0.25-0.75)
			DAY: {
				clear: 0.7,
				cloudy: 0.2,
				rain: 0.05,
				snow: 0.0,
				storm: 0.05
			},
			// 夕方 (0.75-0.8)
			DUSK: {
				clear: 0.5,
				cloudy: 0.3,
				rain: 0.15,
				snow: 0.0,
				storm: 0.05
			},
			// 夜 (0.8-0.2)
			NIGHT: {
				clear: 0.4,
				cloudy: 0.4,
				rain: 0.1,
				snow: 0.05,
				storm: 0.05
			}
		},
		RAIN: {
			DROP_COUNT: 3000, // 雨滴の数を増やす
			DROP_SIZE: 0.15, // 雨滴のサイズを少し大きく
			DROP_SPEED: 20, // 落下速度を上げる
			DROP_COLOR: 0x88ccff,
			COVERAGE_RADIUS: 5000 // 雨の範囲を広げる
		},
		SNOW: {
			FLAKE_COUNT: 2000, // 雪片の数を増やす
			FLAKE_SIZE: 0.2,
			FLAKE_SPEED: 5,
			FLAKE_COLOR: 0xffffff,
			COVERAGE_RADIUS: 1000 // 雪の範囲を広げる
		},
		CLOUD: {
			COUNT: 20,
			MIN_SIZE: 10,
			MAX_SIZE: 30,
			SPEED: 0.5,
			COLOR: 0xffffff
		},
		STORM: {
			LIGHTNING_INTERVAL: 5, // 稲妻の間隔（秒）
			LIGHTNING_DURATION: 0.1, // 稲妻の持続時間（秒）
			LIGHTNING_COLOR: 0xffffcc
		}
	},

	// 視覚設定
	VISION: {
		FOV: 75, // FOVを少し狭めてパフォーマンス向上
		MAX_DISTANCE: 80, // 最大表示距離を短縮
		FADE_START: 100, // フェード開始距離を短縮
		UPDATE_INTERVAL: 1000 // 更新間隔を長くしてパフォーマンス向上
	},

	// ステータス設定
	STATUS: {
		// 移動時の消費値
		MOVEMENT: {
			HUNGER: 0.5, // 通常移動時の空腹減少率
			THIRST: 0.8, // 通常移動時の喉の渇き減少率
			RUNNING_MULTIPLIER: 2.0 // 走る時の消費倍率
		},
		// 停止時の消費値
		IDLE: {
			HUNGER: 0.4, // 停止時の空腹減少率
			THIRST: 0.4 // 停止時の喉の渇き減少率
		}
	}
};