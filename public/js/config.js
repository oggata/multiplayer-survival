/**
 * ゲーム設定値
 */
const GameConfig = {
    // プレイヤー設定
    PLAYER: {
        MOVE_SPEED: 4.5,
        ROTATION_SPEED: 0.05,
        MAX_HEALTH: 100,
        COLLISION_RADIUS: 1.0,
        hungerDecreaseRate:0.006,
        thirstDecreaseRate:0.01,
        hygieneDecreaseRate:0.1,
        healthDecreaseRate:0.001
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
                moveSpeed: 2.4, // 20%増加
                damage: 3, // 50%増加
                shootBullets: false
            },
            HEXAPOD: {
                name: 'hexapod',
                color: 0x331122, // 暗い赤紫色
                moveSpeed: 2.8, // 40%増加
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
    
    // アイテム設定
    ITEM: {
        MAX_COUNT:      5,
        COLLECTION_RADIUS: 1.0,
        SPAWN: {
            BUILDING_RADIUS: 15, // 建物からのスポーン半径
            BUILDING_CHANCE: 0.8, // 建物近くでのスポーン確率
            EMPTY_CHANCE: 0.2, // 空き地でのスポーン確率
            MIN_DISTANCE: 400, // 建物からの最小距離
            MAX_DISTANCE: 500 // 建物からの最大距離
        }
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
        DENSITY: 0.007
    },
    
    // カメラ設定
    CAMERA: {
        OFFSET_Y: 4.5,
        OFFSET_Z: 15
    },
    
    // マップ設定
    MAP: {
        SIZE:   6000,
        CHUNK_SIZE:     120,
        VISLBLE_DISTANCE:   300,
        BOUNDARY_WALL_HEIGHT:  0,
        BIOME: {
            RADIUS: 500, // バイオームの半径
            TYPES: ['urban', 'forest', 'ruins', 'industrial', 'canyon'], // バイオームの種類
            COLORS: {
                'urban': {
                    base: 0x2C2C2C,      // 暗いグレー
                    highlight: 0x404040,  // やや明るいグレー
                    mid: 0x1A1A1A,       // 非常に暗いグレー
                    top: 0x333333        // 中間のグレー
                },
                'forest': {
                    base: 0x1B3D1B,      // 暗い緑
                    highlight: 0x2D4D2D,  // やや明るい緑
                    mid: 0x0F2F0F,       // 非常に暗い緑
                    top: 0x3D5D3D        // 中間の緑
                },
                'ruins': {
                    base: 0x4A3A2A,      // 暗い茶色
                    highlight: 0x5A4A3A,  // やや明るい茶色
                    mid: 0x3A2A1A,       // 非常に暗い茶色
                    top: 0x6A5A4A        // 中間の茶色
                },
                'industrial': {
                    base: 0x2A2A2A,      // 暗いグレー
                    highlight: 0x3A3A3A,  // やや明るいグレー
                    mid: 0x1A1A1A,       // 非常に暗いグレー
                    top: 0x4A4A4A        // 中間のグレー
                },
                'beach': {
                    base: 0x3A3A2A,      // 暗い砂色
                    highlight: 0x4A4A3A,  // やや明るい砂色
                    mid: 0x2A2A1A,       // 非常に暗い砂色
                    top: 0x5A5A4A        // 中間の砂色
                },
                'canyon': {
                    base: 0x8B4513,      // 暗い茶色
                    highlight: 0xA0522D,  // やや明るい茶色
                    mid: 0x6B3E2E,       // 非常に暗い茶色
                    top: 0xCD853F        // 中間の茶色
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
            DENSITY: 1,  // 建物の生成確率（0-1）
            MIN_DISTANCE: 80,  // 建物間の最小距離（建物の最大幅40の2倍）
            MAX_ATTEMPTS: 100  // 建物配置の最大試行回数
        },
        LOD: {
            DISTANCES: [100, 200, 300], // LODの距離閾値
            SEGMENTS: [8, 4, 2] // 各LODレベルのセグメント数
        },
        SPAWN: {
            SAFE_SPOT_DISTANCE: 50, // 安全なスポーン位置からの最小距離
            SAFE_POSITIONS: [
                { x: 100, y: 0, z: 100 },
                { x: -100, y: 0, z: 100 },
                { x: 100, y: 0, z: -100 },
                { x: -100, y: 0, z: -100 },
                { x: 200, y: 0, z: 0 },
                { x: -200, y: 0, z: 0 },
                { x: 0, y: 0, z: 200 },
                { x: 0, y: 0, z: -200 }
            ]
        },
        OBJECT_TYPES: {
            BUILDINGS: [
                { name: 'skyscraper', minHeight: 30, maxHeight: 100, color: 0x555555 },
                { name: 'office', minHeight: 15, maxHeight: 40, color: 0x666666 },
                { name: 'residential', minHeight: 5, maxHeight: 15, color: 0x777777 },
                { name: 'industrial', minHeight: 8, maxHeight: 20, color: 0x444444 },
                { name: 'mall', minHeight: 10, maxHeight: 25, color: 0x888888 },
                { name: 'hospital', minHeight: 12, maxHeight: 35, color: 0xFFFFFF },
                { name: 'school', minHeight: 8, maxHeight: 20, color: 0xCCCCCC },
                { name: 'apartment', minHeight: 15, maxHeight: 45, color: 0x999999 },
                { name: 'hotel', minHeight: 20, maxHeight: 60, color: 0xAAAAAA }
            ],
            DEBRIS: [
                { name: 'concrete', size: 3, color: 0x888888 },
                { name: 'metal', size: 2, color: 0x777777 },
                { name: 'glass', size: 1, color: 0xCCFFFF },
                { name: 'wood', size: 2, color: 0x8B4513 },
                { name: 'brick', size: 1.5, color: 0xB22222 },
                { name: 'plastic', size: 1, color: 0xE6E6FA },
                { name: 'rubber', size: 1.5, color: 0x2F4F4F },
                { name: 'ceramic', size: 1, color: 0xF5F5F5 }
            ],
            TREES: [
                { name: 'pine', trunkColor: 0x8B4513, leavesColor: 0x228B22, trunkWidth: 0.2, trunkHeight: 1.0, leavesSize: 1.2 },
                { name: 'oak', trunkColor: 0x654321, leavesColor: 0x2E8B57, trunkWidth: 0.3, trunkHeight: 0.8, leavesSize: 1.5 },
                { name: 'birch', trunkColor: 0xF5F5DC, leavesColor: 0x90EE90, trunkWidth: 0.15, trunkHeight: 0.9, leavesSize: 1.0 },
                { name: 'maple', trunkColor: 0x8B4513, leavesColor: 0xFF4500, trunkWidth: 0.25, trunkHeight: 0.7, leavesSize: 1.3 },
                { name: 'willow', trunkColor: 0x8B4513, leavesColor: 0x32CD32, trunkWidth: 0.2, trunkHeight: 0.6, leavesSize: 1.8 },
                { name: 'palm', trunkColor: 0x8B4513, leavesColor: 0x228B22, trunkWidth: 0.3, trunkHeight: 1.2, leavesSize: 2.0 },
                { name: 'cherry', trunkColor: 0x8B4513, leavesColor: 0xFFB6C1, trunkWidth: 0.2, trunkHeight: 0.8, leavesSize: 1.4 },
                { name: 'cypress', trunkColor: 0x8B4513, leavesColor: 0x006400, trunkWidth: 0.15, trunkHeight: 1.1, leavesSize: 0.8 },
                { name: 'redwood', trunkColor: 0x8B4513, leavesColor: 0x228B22, trunkWidth: 0.4, trunkHeight: 1.5, leavesSize: 1.6 }
            ],
            ROCKS: [
                { name: 'granite', color: 0x808080, size: 1.0, roughness: 0.9 },
                { name: 'limestone', color: 0xD3D3D3, size: 0.8, roughness: 0.8 },
                { name: 'basalt', color: 0x2F4F4F, size: 1.2, roughness: 0.95 },
                { name: 'sandstone', color: 0xD2B48C, size: 0.9, roughness: 0.7 },
                { name: 'marble', color: 0xFFFFFF, size: 0.7, roughness: 0.6 },
                { name: 'obsidian', color: 0x000000, size: 1.1, roughness: 0.85 },
                { name: 'quartz', color: 0xE6E6FA, size: 0.6, roughness: 0.5 },
                { name: 'slate', color: 0x708090, size: 0.8, roughness: 0.75 },
                { name: 'shale', color: 0x556B2F, size: 0.7, roughness: 0.8 }
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
    
    // 気象設定
    WEATHER: {
        TYPES: ['clear', 'cloudy', 'rain', 'snow', 'storm'],
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
            DROP_COUNT: 5000,  // 雨滴の数を増やす
            DROP_SIZE: 0.15,   // 雨滴のサイズを少し大きく
            DROP_SPEED: 20,    // 落下速度を上げる
            DROP_COLOR: 0x88ccff,
            COVERAGE_RADIUS: 1000  // 雨の範囲を広げる
        },
        SNOW: {
            FLAKE_COUNT: 2000,  // 雪片の数を増やす
            FLAKE_SIZE: 0.2,
            FLAKE_SPEED: 5,
            FLAKE_COLOR: 0xffffff,
            COVERAGE_RADIUS: 1000  // 雪の範囲を広げる
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
        FOV: 80,
        MAX_DISTANCE: 120,  // 最大表示距離を50に増加
        FADE_START: 125,    // フェード開始距離を40に増加
        UPDATE_INTERVAL: 500
    },
    
    // ステータス設定
    STATUS: {
        // 移動時の消費値
        MOVEMENT: {
            HUNGER: 0.5,      // 通常移動時の空腹減少率
            THIRST: 0.8,      // 通常移動時の喉の渇き減少率
            RUNNING_MULTIPLIER: 2.0  // 走る時の消費倍率
        },
        // 停止時の消費値
        IDLE: {
            HUNGER: 0.4,     // 停止時の空腹減少率
            THIRST: 0.4       // 停止時の喉の渇き減少率
        }
    },

    ITEM_EFFECTS: {
        //0
        healthKit: {
            name: 'Health Kit',
            description: 'Restores 75 HP',
            color: 0xff0000,
            dropChance: 0.05,
        }

    },
    
    ITEMS: {
// 攻撃武器
shotgun: {
    name: 'shotgun',
    description: '４方向に弾丸を発射',
    color: 0x666666,
    dropChance: 0.05,
    effects: {                
        duration: {
            type: 'wepon',
            value: 0.6,
            duration: 99999,
            attack: {
                type: 'shotgun',
                damage: 10,
                speed: 0.1,
                diameter:1,
                reload:1
            }
        }
    }
},
machinegun: {
    name: 'machinegun',
    description: '５連続で弾丸を発射',
    color: 0x666666,
    dropChance: 0.05,
    effects: {                
        duration: {
            type: 'wepon',
            value: 0.6,
            duration: 99999,
            attack: {
                type: 'machinegun',
                damage: 10,
                speed: 0.1,
                diameter:1,
                reload:1
            }
        }
    }
},
magnum: {
    name: 'magnum',
    description: '威力のある弾丸を発射',
    color: 0x666666,
    dropChance: 0.05,
    effects: {                
        duration: {
            type: 'wepon',
            value: 0.6,
            duration: 99999,
            attack: {
                type: 'magnum',
                damage: 50,
                speed: 0.1,
                diameter:1,
                reload:5
            }
        }
    }
},
sniperrifle: {
    name: 'sniperrifle',
    description: '威力のある弾丸を発射',
    color: 0x666666,
    dropChance: 0.05,
    effects: {                
        duration: {
            type: 'wepon',
            value: 0.6,
            duration: 99999,
            attack: {
                type: 'sniperrifle',
                damage: 20,
                speed: 0.1,
                diameter:1,
                reload:1
            }
        }
    }
},
rocketlauncher: {
    name: 'rocketlauncher',
    description: '威力のある弾丸を発射',
    color: 0x666666,
    dropChance: 0.05,
    effects: {                
        duration: {
            type: 'wepon',
            value: 0.6,
            duration: 99999,
            attack: {
                type: 'rocketlauncher',
                damage: 60,
                speed: 0.01,
                diameter:1,
                reload:8
            }
        }
    }
},
lasergun: {
            name: 'lasergun',
            description: '連続的なレーザーを発射',
            color: 0xff0000,
            dropChance: 0.05,
            effects: {                
                duration: {
                    type: 'wepon',
                    value: 0.6,
                    duration: 40,
                    attack: {
                        type: 'lasergun',
                        damage: 15,
                        speed: 0.1,
                        diameter: 1,
                        reload: 1
                    }
                }
            }
        },
        grenadelauncher: {
            name: 'grenadelauncher',
            description: '爆発する弾を発射',
            color: 0x666666,
            dropChance: 0.05,
            effects: {                
                duration: {
                    type: 'wepon',
                    value: 0.6,
                    duration: 40,
                    attack: {
                        type: 'grenadelauncher',
                        damage: 30,
                        speed: 0.1,
                        diameter: 1,
                        reload: 1
                    }
                }
            }
        },
        flamethrower: {
            name: 'flamethrower',
            description: '広範囲の火炎を放射',
            color: 0xff6600,
            dropChance: 0.05,
            effects: {                
                duration: {
                    type: 'wepon',
                    value: 0.6,
                    duration: 40,
                    attack: {
                        type: 'flamethrower',
                        damage: 8,
                        speed: 0.1,
                        diameter: 1,
                        reload: 1
                    }
                }
            }
        },
        plasmacannon: {
            name: 'plasmacannon',
            description: '電撃的な弾を発射',
            color: 0x00ffff,
            dropChance: 0.05,
            effects: {                
                duration: {
                    type: 'wepon',
                    value: 0.6,
                    duration: 40,
                    attack: {
                        type: 'plasmacannon',
                        damage: 25,
                        speed: 0.1,
                        diameter: 1,
                        reload: 1
                    }
                }
            }
        },
        missilelauncher: {
            name: 'missilelauncher',
            description: '追尾型のミサイルを発射',
            color: 0x666666,
            dropChance: 0.05,
            effects: {                
                duration: {
                    type: 'wepon',
                    value: 0.6,
                    duration: 40,
                    attack: {
                        type: 'missilelauncher',
                        damage: 40,
                        speed: 0.1,
                        diameter: 1,
                        reload: 1
                    }
                }
            }
        },

        jacket: {
            name: 'jacket',
            description: 'The perceived temperature increases by 10 degrees',
            color: 0x808080,
            dropChance: 0.08,
            effects: {
                duration: {
                    type: 'jacket',
                    value: 10,
                    duration: 60
                }
            }
        },

        boonieHat: {
            name: 'BoonieHat',
            description: 'The perceived temperature increases by 10 degrees',
            color: 0x808080,
            dropChance: 0.08,
            effects: {
                duration: {
                    type: 'boonieHat',
                    value: 10,
                    duration: 60
                }
            }
        },

        tacticalVest: {
            name: 'Tactical Vest',
            description: 'The perceived temperature increases by 10 degrees',
            color: 0x808080,
            dropChance: 0.08,
            effects: {
                duration: {
                    type: 'tacticalVest',
                    value: 10,
                    duration: 60
                }
            }
        },

        balaclava: {
            name: 'Balaclava',
            description: 'The perceived temperature increases by 10 degrees',
            color: 0x808080,
            dropChance: 0.08,
            effects: {
                duration: {
                    type: 'balaclava',
                    value: 10,
                    duration: 60
                }
            }
        },

        adrenaline: {
            name: 'Adrenaline',
            description: 'Treats fracture and restores movement speed',
            color: 0x808080,
            dropChance: 0.08,
            effects: {
                duration: {
                    type: 'adrenaline',
                    value: 5,
                    duration: 30
                }
            }
        },
        bandage: {
            name: 'Bandage',
            description: 'Recovers bleeding (30 seconds)',
            color: 0xffffff,
            dropChance: 0.1,
            effects: {
                duration: {
                    type: 'bandage',
                    value: 0.45,
                    duration: 30
                }
            }
        },
        chocolateBar: {
            name: 'Chocolate Bar',
            description: 'Increases hunger recovery rate (60 seconds..)',
            color: 0x8b4513,
            dropChance: 0.1,
            effects: {
                duration: {
                    type: 'chocolateBar',
                    value: 0.1,
                    duration: 60
                }
            }
        },
        //1
        healthKit: {
            name: 'Health Kit',
            description: 'Restores 75 HP',
            color: 0xff0000,
            dropChance: 0.05,
            effects: {
                immediate: {
                    health: 75
                }
            }
        },
        medicine: {
            name: 'Medicine',
            description: 'Restores 30 HP',
            color: 0x00ff00,
            dropChance: 0.06,
            effects: {
                immediate: {
                    health: 30
                }
            }
        },
        //6
        firstAidKit: {
            name: 'First Aid Kit',
            description: 'Restores 75 HP and completely stops bleeding',
            color: 0xff0000,
            dropChance: 0.03,
            effects: {
                immediate: {
                    health: 75,
                    bleeding: 0
                }
            }
        },


        //9
        morphine: {
            name: 'Morphine',
            description: 'Completely eliminates pain and restores 15 HP',
            color: 0xff00ff,
            dropChance: 0.04,
            effects: {
                immediate: {
                    health: 15,
                    pain: 0
                }
            }
        },
        //10

        //11 食料アイテム
        food: {
            name: 'Food',
            description: 'Restores 45 hunger',
            color: 0xffa500,
            dropChance: 0.15,
            effects: {
                immediate: {
                    hunger: 45
                }
            }
        },
        //12
        dirtyFood: {
            name: 'Dirty Food',
            description: 'Restores 30 hunger but worsens hygiene',
            color: 0x8b4513,
            dropChance: 0.2,
            effects: {
                immediate: {
                    hunger: 30,
                    hygiene: -15
                }
            }
        },
        //13
        cannedSardines: {
            name: 'Canned Sardines',
            description: 'Restores 37 hunger and 7 HP',
            color: 0x8b4513,
            dropChance: 0.12,
            effects: {
                immediate: {
                    hunger: 37,
                    health: 7
                }
            }
        },
        //14
        cannedBeans: {
            name: 'Canned Beans',
            description: 'Restores 30 hunger',
            color: 0x8b4513,
            dropChance: 0.12,
            effects: {
                immediate: {
                    hunger: 30
                }
            }
        },
        //15
        cannedCorn: {
            name: 'Canned Corn',
            description: 'Restores 22 hunger',
            color: 0x8b4513,
            dropChance: 0.12,
            effects: {
                immediate: {
                    hunger: 22
                }
            }
        },
        //16
        cannedTuna: {
            name: 'Canned Tuna',
            description: 'Restores 45 hunger and 4 HP',
            color: 0x8b4513,
            dropChance: 0.12,
            effects: {
                immediate: {
                    hunger: 45,
                    health: 4
                }
            }
        },
        //17
        cannedSoup: {
            name: 'Canned Soup',
            description: 'Restores 22 hunger and 15 thirst',
            color: 0x8b4513,
            dropChance: 0.12,
            effects: {
                immediate: {
                    hunger: 22,
                    thirst: 15
                }
            }
        },
        //18
        bread: {
            name: 'Bread',
            description: 'Restores 37 hunger',
            color: 0xdeb887,
            dropChance: 0.15,
            effects: {
                immediate: {
                    hunger: 37
                }
            }
        },
        //19
        crackers: {
            name: 'Crackers',
            description: 'Restores 15 hunger',
            color: 0xdeb887,
            dropChance: 0.15,
            effects: {
                immediate: {
                    hunger: 15
                }
            }
        },


        apple: {
            name: 'Apple',
            description: 'Restores 15 hunger and 7 thirst',
            color: 0xff0000,
            dropChance: 0.15,
            effects: {
                immediate: {
                    hunger: 15,
                    thirst: 7
                }
            }
        },
        orange: {
            name: 'Orange',
            description: 'Restores 7 hunger and 22 thirst',
            color: 0xffa500,
            dropChance: 0.15,
            effects: {
                immediate: {
                    hunger: 7,
                    thirst: 22
                }
            }
        },

        blueberry: {
            name: 'Blueberry',
            description: 'Restores 7 hunger and 4 HP',
            color: 0x0000ff,
            dropChance: 0.15,
            effects: {
                immediate: {
                    hunger: 7,
                    health: 4
                }
            }
        },

        mushroom: {
            name: 'Mushroom',
            description: 'Restores 15 hunger',
            color: 0x8b4513,
            dropChance: 0.15,
            effects: {
                immediate: {
                    hunger: 15
                }
            }
        },
        wildBerries: {
            name: 'Wild Berries',
            description: 'Restores 12 hunger but has infection risk',
            color: 0x800080,
            dropChance: 0.15,
            effects: {
                immediate: {
                    hunger: 12,
                    infection: 5
                }
            }
        },
        meat: {
            name: 'Meat',
            description: 'Restores 60 hunger',
            color: 0x8b0000,
            dropChance: 0.1,
            effects: {
                immediate: {
                    hunger: 60
                }
            }
        },
        cookedMeat: {
            name: 'Cooked Meat',
            description: 'Restores 75 hunger and 15 HP',
            color: 0x8b0000,
            dropChance: 0.1,
            effects: {
                immediate: {
                    hunger: 75,
                    health: 15
                }
            }
        },
        fish: {
            name: 'Fish',
            description: 'Restores 30 hunger',
            color: 0x4682b4,
            dropChance: 0.1,
            effects: {
                immediate: {
                    hunger: 30
                }
            }
        },
        cookedFish: {
            name: 'Cooked Fish',
            description: 'Restores 45 hunger and 7 HP',
            color: 0x4682b4,
            dropChance: 0.1,
            effects: {
                immediate: {
                    hunger: 45,
                    health: 7
                }
            }
        },


        carrot: {
            name: 'Carrot',
            description: 'Restores 15 hunger and 3 HP',
            color: 0xffa500,
            dropChance: 0.15,
            effects: {
                immediate: {
                    hunger: 15,
                    health: 3
                }
            }
        },

        // 飲料アイテム
        water: {
            name: 'Water',
            description: 'Restores 60 thirst',
            color: 0x00ffff,
            dropChance: 0.15,
            effects: {
                immediate: {
                    thirst: 60
                }
            }
        },
        dirtyWater: {
            name: 'Dirty Water',
            description: 'Restores 37 thirst but worsens hygiene',
            color: 0x8b4513,
            dropChance: 0.2,
            effects: {
                immediate: {
                    thirst: 37,
                    hygiene: -20
                }
            }
        },
        purifiedWater: {
            name: 'Purified Water',
            description: 'Restores 75 thirst and 7 HP',
            color: 0x00ffff,
            dropChance: 0.1,
            effects: {
                immediate: {
                    thirst: 75,
                    health: 7
                }
            }
        },
        soda: {
            name: 'Soda',
            description: 'Restores 45 thirst',
            color: 0xff0000,
            dropChance: 0.1,
            effects: {
                immediate: {
                    thirst: 45
                }
            }
        },

        tea: {
            name: 'Tea',
            description: 'Restores 30 thirst and 3 HP',
            color: 0x00ff00,
            dropChance: 0.1,
            effects: {
                immediate: {
                    thirst: 30,
                    health: 3
                }
            }
        },
        juice: {
            name: 'Juice',
            description: 'Restores 37 thirst and 7 hunger',
            color: 0xffa500,
            dropChance: 0.1,
            effects: {
                immediate: {
                    thirst: 37,
                    hunger: 7
                }
            }
        },

        energyDrink: {
            name: 'Energy Drink',
            description: 'Doubles stamina recovery rate (15 seconds)',
            color: 0x00ff00,
            dropChance: 0.1,
            effects: {
                duration: {
                    type: 'energyDrink',
                    value: 3.0,
                    duration: 15
                }
            }
        },

        beer: {
            name: 'Beer',
            description: 'Restores 30 thirst but causes blurred vision (30 seconds)',
            color: 0xffd700,
            dropChance: 0.1,
            effects: {
                immediate: {
                    thirst: 30
                },
                duration: {
                    type: 'blurredVision',
                    value: 0.7,
                    duration: 30
                }
            }
        },
        
        spoiledWater: {
            name: 'Spoiled Water',
            description: 'Restores 22 thirst but has high infection risk and worsens hygiene',
            color: 0x8b4513,
            dropChance: 0.2,
            effects: {
                immediate: {
                    thirst: 22,
                    hygiene: -30,
                    infection: 20
                }
            }
        },
    },
}; 