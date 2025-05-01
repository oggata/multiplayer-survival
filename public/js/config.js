/**
 * ゲーム設定値
 */
const GameConfig = {
    // プレイヤー設定
    PLAYER: {
        MOVE_SPEED: 5.0,
        ROTATION_SPEED: 0.05,
        MAX_HEALTH: 100,
        COLLISION_RADIUS: 2.0
    },
    
    // 敵設定
    ENEMY: {
        MAX_COUNT:  10,
        SPAWN_INTERVAL: 5000, // ミリ秒
        SPAWN_RADIUS: 100, // プレイヤーからの距離
        DESPAWN_RADIUS: 200, // プレイヤーからの距離
        CHASE_DISTANCE: 50, // プレイヤーを追跡する距離
        DAMAGE: 10, // プレイヤーに与えるダメージ
        MOVE_SPEED: 5,
        VISION: {
            DAY: {
                CHASE_DISTANCE: 5, // 昼間の追跡距離
                DETECTION_RADIUS: 5, // 昼間の検知範囲
                MOVE_SPEED_MULTIPLIER: 0.2 // 昼間の移動速度倍率
            },
            NIGHT: {
                CHASE_DISTANCE: 50, // 夜間の追跡距離
                DETECTION_RADIUS: 50, // 夜間の検知範囲
                MOVE_SPEED_MULTIPLIER: 1.1 // 夜間の移動速度倍率
            }
        },
        SPAWN: {
            BUILDING_RADIUS: 20, // 建物からのスポーン半径
            BUILDING_CHANCE: 0.7, // 建物近くでのスポーン確率
            EMPTY_CHANCE: 0.22 // 空き地でのスポーン確率
        },
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
            }
        }
    },
    
    // アイテム設定
    ITEM: {
        MAX_COUNT:      50,
        COLLECTION_RADIUS: 1.0,
        SPAWN: {
            BUILDING_RADIUS: 15, // 建物からのスポーン半径
            BUILDING_CHANCE: 0.8, // 建物近くでのスポーン確率
            EMPTY_CHANCE: 0.2, // 空き地でのスポーン確率
            MIN_DISTANCE: 5, // 建物からの最小距離
            MAX_DISTANCE: 30 // 建物からの最大距離
        }
    },
    
    // ライティング設定
    LIGHTING: {
        AMBIENT_INTENSITY: 0.3,
        SUN_INTENSITY: 0.6,
        SUN_INTENSITY_NIGHT: 0.05,
        SUN_INTENSITY_DAWN_DUSK: 10
    },
    
    // 時間設定
    TIME: {
        DAY_LENGTH: 300, // 秒
        TIME_SPEED: 0.1 // 1フレームあたりの時間進行
    },
    
    // 霧設定
    FOG: {
        DENSITY: 0.013
    },
    
    // カメラ設定
    CAMERA: {
        FOV: 75,
        NEAR: 0.1,
        FAR: 10000,
        OFFSET_Y: 5,
        OFFSET_Z: 10
    },
    
    // マップ設定
    MAP: {
        SIZE:   600,
        BOUNDARY_WALL_HEIGHT:  0,
        FLOOR: {
            THICKNESS: 1,
            COLOR: 0x808080,
            GRID_SIZE: 1,
            GRID_COLOR: 0x000000,
            GRID_SECONDARY_COLOR: 0x444444
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
            COVERAGE_RADIUS: 500  // 雨の範囲を広げる
        },
        SNOW: {
            FLAKE_COUNT: 2000,  // 雪片の数を増やす
            FLAKE_SIZE: 0.2,
            FLAKE_SPEED: 5,
            FLAKE_COLOR: 0xffffff,
            COVERAGE_RADIUS: 500  // 雪の範囲を広げる
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
        FOV: 70,
        MAX_DISTANCE: 150,  // 最大表示距離を50に増加
        FADE_START: 140,    // フェード開始距離を40に増加
        UPDATE_INTERVAL: 500
    },
    
    // ステータス設定
    STATUS: {
        // 移動時の消費値
        MOVEMENT: {
            HUNGER: 1.2,      // 通常移動時の空腹減少率
            THIRST: 1.5,      // 通常移動時の喉の渇き減少率
            RUNNING_MULTIPLIER: 2.0  // 走る時の消費倍率
        },
        // 停止時の消費値
        IDLE: {
            HUNGER: 0.3,     // 停止時の空腹減少率
            THIRST: 0.5       // 停止時の喉の渇き減少率
        }
    },
    
    ITEMS: {
        // 医療アイテム
        healthKit: {
            name: 'First Aid Kit',
            description: 'Restores 30 HP',
            color: 0xff0000,
            dropChance: 0.05,
            effects: {
                immediate: {
                    health: 30
                }
            }
        },
        bandage: {
            name: 'Bandage',
            description: 'Gradually stops bleeding (30 seconds)',
            color: 0xffffff,
            dropChance: 0.1,
            effects: {
                duration: {
                    type: 'bandage',
                    value: 0.5,
                    duration: 30
                }
            }
        },
        painkiller: {
            name: 'Painkiller',
            description: 'Gradually reduces pain (20 seconds)',
            color: 0xff00ff,
            dropChance: 0.08,
            effects: {
                duration: {
                    type: 'painkiller',
                    value: 0.3,
                    duration: 20
                }
            }
        },
        antibiotic: {
            name: 'Antibiotic',
            description: 'Gradually treats infection (40 seconds)',
            color: 0x00ffff,
            dropChance: 0.07,
            effects: {
                duration: {
                    type: 'antibiotic',
                    value: 0.2,
                    duration: 40
                }
            }
        },
        medicine: {
            name: 'Medicine',
            description: 'Restores 20 HP and stops bleeding',
            color: 0x00ff00,
            dropChance: 0.06,
            effects: {
                immediate: {
                    health: 20
                },
                duration: {
                    type: 'bandage',
                    value: 0.3,
                    duration: 15
                }
            }
        },
        firstAidKit: {
            name: 'First Aid Kit',
            description: 'Restores 50 HP and completely stops bleeding',
            color: 0xff0000,
            dropChance: 0.03,
            effects: {
                immediate: {
                    health: 50,
                    bleeding: 0
                }
            }
        },
        vitaminPills: {
            name: 'Vitamin Pills',
            description: 'Increases natural HP regeneration rate (5 minutes)',
            color: 0xffff00,
            dropChance: 0.05,
            effects: {
                duration: {
                    type: 'regeneration',
                    value: 0.5,
                    duration: 300
                }
            }
        },
        disinfectant: {
            name: 'Disinfectant',
            description: 'Reduces infection risk (1 minute)',
            color: 0x00ffff,
            dropChance: 0.07,
            effects: {
                duration: {
                    type: 'antibiotic',
                    value: 0.4,
                    duration: 60
                }
            }
        },
        morphine: {
            name: 'Morphine',
            description: 'Completely eliminates pain and restores 10 HP',
            color: 0xff00ff,
            dropChance: 0.04,
            effects: {
                immediate: {
                    health: 10,
                    pain: 0
                }
            }
        },
        splint: {
            name: 'Splint',
            description: 'Treats fracture and restores movement speed',
            color: 0x808080,
            dropChance: 0.08,
            effects: {
                immediate: {
                    moveSpeedMultiplier: 1.0
                }
            }
        },

        // 食料アイテム
        food: {
            name: 'Food',
            description: 'Restores 30 hunger',
            color: 0xffa500,
            dropChance: 0.15,
            effects: {
                immediate: {
                    hunger: 30
                }
            }
        },
        dirtyFood: {
            name: 'Dirty Food',
            description: 'Restores 20 hunger but worsens hygiene',
            color: 0x8b4513,
            dropChance: 0.2,
            effects: {
                immediate: {
                    hunger: 20,
                    hygiene: -15
                }
            }
        },
        cannedSardines: {
            name: 'Canned Sardines',
            description: 'Restores 25 hunger and 5 HP',
            color: 0x8b4513,
            dropChance: 0.12,
            effects: {
                immediate: {
                    hunger: 25,
                    health: 5
                }
            }
        },
        cannedBeans: {
            name: 'Canned Beans',
            description: 'Restores 20 hunger',
            color: 0x8b4513,
            dropChance: 0.12,
            effects: {
                immediate: {
                    hunger: 20
                }
            }
        },
        cannedCorn: {
            name: 'Canned Corn',
            description: 'Restores 15 hunger',
            color: 0x8b4513,
            dropChance: 0.12,
            effects: {
                immediate: {
                    hunger: 15
                }
            }
        },
        cannedTuna: {
            name: 'Canned Tuna',
            description: 'Restores 30 hunger and 3 HP',
            color: 0x8b4513,
            dropChance: 0.12,
            effects: {
                immediate: {
                    hunger: 30,
                    health: 3
                }
            }
        },
        cannedSoup: {
            name: 'Canned Soup',
            description: 'Restores 15 hunger and 10 thirst',
            color: 0x8b4513,
            dropChance: 0.12,
            effects: {
                immediate: {
                    hunger: 15,
                    thirst: 10
                }
            }
        },
        bread: {
            name: 'Bread',
            description: 'Restores 25 hunger',
            color: 0xdeb887,
            dropChance: 0.15,
            effects: {
                immediate: {
                    hunger: 25
                }
            }
        },
        crackers: {
            name: 'Crackers',
            description: 'Restores 10 hunger',
            color: 0xdeb887,
            dropChance: 0.15,
            effects: {
                immediate: {
                    hunger: 10
                }
            }
        },
        chocolateBar: {
            name: 'Chocolate Bar',
            description: 'Restores 15 hunger and increases stamina recovery rate (30 seconds)',
            color: 0x8b4513,
            dropChance: 0.1,
            effects: {
                immediate: {
                    hunger: 15
                },
                duration: {
                    type: 'energyDrink',
                    value: 1.3,
                    duration: 30
                }
            }
        },
        proteinBar: {
            name: 'Protein Bar',
            description: 'Restores 20 hunger and increases max HP by 10 (3 minutes)',
            color: 0x8b4513,
            dropChance: 0.1,
            effects: {
                immediate: {
                    hunger: 20
                },
                duration: {
                    type: 'maxHealthBoost',
                    value: 10,
                    duration: 180
                }
            }
        },
        apple: {
            name: 'Apple',
            description: 'Restores 10 hunger and 5 thirst',
            color: 0xff0000,
            dropChance: 0.15,
            effects: {
                immediate: {
                    hunger: 10,
                    thirst: 5
                }
            }
        },
        orange: {
            name: 'Orange',
            description: 'Restores 5 hunger and 15 thirst',
            color: 0xffa500,
            dropChance: 0.15,
            effects: {
                immediate: {
                    hunger: 5,
                    thirst: 15
                }
            }
        },
        banana: {
            name: 'Banana',
            description: 'Restores 15 hunger and increases stamina recovery rate (20 seconds)',
            color: 0xffff00,
            dropChance: 0.15,
            effects: {
                immediate: {
                    hunger: 15
                },
                duration: {
                    type: 'energyDrink',
                    value: 1.2,
                    duration: 20
                }
            }
        },
        blueberry: {
            name: 'Blueberry',
            description: 'Restores 5 hunger and 3 HP',
            color: 0x0000ff,
            dropChance: 0.15,
            effects: {
                immediate: {
                    hunger: 5,
                    health: 3
                }
            }
        },
        strawberry: {
            name: 'Strawberry',
            description: 'Restores 5 hunger and 5 thirst',
            color: 0xff0000,
            dropChance: 0.15,
            effects: {
                immediate: {
                    hunger: 5,
                    thirst: 5
                }
            }
        },
        mushroom: {
            name: 'Mushroom',
            description: 'Restores 10 hunger',
            color: 0x8b4513,
            dropChance: 0.15,
            effects: {
                immediate: {
                    hunger: 10
                }
            }
        },
        wildBerries: {
            name: 'Wild Berries',
            description: 'Restores 8 hunger but has infection risk',
            color: 0x800080,
            dropChance: 0.15,
            effects: {
                immediate: {
                    hunger: 8,
                    infection: 5
                }
            }
        },
        meat: {
            name: 'Meat',
            description: 'Restores 40 hunger',
            color: 0x8b0000,
            dropChance: 0.1,
            effects: {
                immediate: {
                    hunger: 40
                }
            }
        },
        cookedMeat: {
            name: 'Cooked Meat',
            description: 'Restores 50 hunger and 10 HP',
            color: 0x8b0000,
            dropChance: 0.1,
            effects: {
                immediate: {
                    hunger: 50,
                    health: 10
                }
            }
        },
        fish: {
            name: 'Fish',
            description: 'Restores 20 hunger',
            color: 0x4682b4,
            dropChance: 0.1,
            effects: {
                immediate: {
                    hunger: 20
                }
            }
        },
        cookedFish: {
            name: 'Cooked Fish',
            description: 'Restores 30 hunger and 5 HP',
            color: 0x4682b4,
            dropChance: 0.1,
            effects: {
                immediate: {
                    hunger: 30,
                    health: 5
                }
            }
        },
        rice: {
            name: 'Rice',
            description: 'Restores 25 hunger',
            color: 0xffffff,
            dropChance: 0.15,
            effects: {
                immediate: {
                    hunger: 25
                }
            }
        },
        cookedRice: {
            name: 'Cooked Rice',
            description: 'Restores 35 hunger',
            color: 0xffffff,
            dropChance: 0.15,
            effects: {
                immediate: {
                    hunger: 35
                }
            }
        },
        potato: {
            name: 'Potato',
            description: 'Restores 15 hunger',
            color: 0x8b4513,
            dropChance: 0.15,
            effects: {
                immediate: {
                    hunger: 15
                }
            }
        },
        cookedPotato: {
            name: 'Baked Potato',
            description: 'Restores 25 hunger',
            color: 0x8b4513,
            dropChance: 0.15,
            effects: {
                immediate: {
                    hunger: 25
                }
            }
        },
        carrot: {
            name: 'Carrot',
            description: 'Restores 10 hunger and 2 HP',
            color: 0xffa500,
            dropChance: 0.15,
            effects: {
                immediate: {
                    hunger: 10,
                    health: 2
                }
            }
        },
        cookedCarrot: {
            name: 'Cooked Carrot',
            description: 'Restores 15 hunger and 5 HP',
            color: 0xffa500,
            dropChance: 0.15,
            effects: {
                immediate: {
                    hunger: 15,
                    health: 5
                }
            }
        },
        spoiledFood: {
            name: 'Spoiled Food',
            description: 'Restores 10 hunger but has high infection risk and worsens hygiene',
            color: 0x8b4513,
            dropChance: 0.2,
            effects: {
                immediate: {
                    hunger: 10,
                    hygiene: -25,
                    infection: 15
                }
            }
        },
        
        // 飲料アイテム
        water: {
            name: 'Water',
            description: 'Restores 40 thirst',
            color: 0x00ffff,
            dropChance: 0.15,
            effects: {
                immediate: {
                    thirst: 40
                }
            }
        },
        dirtyWater: {
            name: 'Dirty Water',
            description: 'Restores 25 thirst but worsens hygiene',
            color: 0x8b4513,
            dropChance: 0.2,
            effects: {
                immediate: {
                    thirst: 25,
                    hygiene: -20
                }
            }
        },
        purifiedWater: {
            name: 'Purified Water',
            description: 'Restores 50 thirst and 5 HP',
            color: 0x00ffff,
            dropChance: 0.1,
            effects: {
                immediate: {
                    thirst: 50,
                    health: 5
                }
            }
        },
        soda: {
            name: 'Soda',
            description: 'Restores 30 thirst and increases stamina recovery rate (20 seconds)',
            color: 0xff0000,
            dropChance: 0.1,
            effects: {
                immediate: {
                    thirst: 30
                },
                duration: {
                    type: 'energyDrink',
                    value: 1.3,
                    duration: 20
                }
            }
        },
        coffee: {
            name: 'Coffee',
            description: 'Restores 15 thirst and increases stamina recovery rate (1 minute)',
            color: 0x8b4513,
            dropChance: 0.1,
            effects: {
                immediate: {
                    thirst: 15
                },
                duration: {
                    type: 'energyDrink',
                    value: 1.5,
                    duration: 60
                }
            }
        },
        tea: {
            name: 'Tea',
            description: 'Restores 20 thirst and 2 HP',
            color: 0x00ff00,
            dropChance: 0.1,
            effects: {
                immediate: {
                    thirst: 20,
                    health: 2
                }
            }
        },
        juice: {
            name: 'Juice',
            description: 'Restores 25 thirst and 5 hunger',
            color: 0xffa500,
            dropChance: 0.1,
            effects: {
                immediate: {
                    thirst: 25,
                    hunger: 5
                }
            }
        },
        milk: {
            name: 'Milk',
            description: 'Restores 20 thirst and 3 HP',
            color: 0xffffff,
            dropChance: 0.1,
            effects: {
                immediate: {
                    thirst: 20,
                    health: 3
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
                    value: 2.0,
                    duration: 15
                }
            }
        },
        sportsDrink: {
            name: 'Sports Drink',
            description: 'Restores 30 thirst and increases stamina recovery rate (30 seconds)',
            color: 0xffa500,
            dropChance: 0.1,
            effects: {
                immediate: {
                    thirst: 30
                },
                duration: {
                    type: 'energyDrink',
                    value: 1.4,
                    duration: 30
                }
            }
        },
        beer: {
            name: 'Beer',
            description: 'Restores 20 thirst but causes blurred vision (30 seconds)',
            color: 0xffd700,
            dropChance: 0.1,
            effects: {
                immediate: {
                    thirst: 20
                },
                duration: {
                    type: 'blurredVision',
                    value: 0.7,
                    duration: 30
                }
            }
        },
        wine: {
            name: 'Wine',
            description: 'Restores 15 thirst and 5 HP but causes blurred vision (20 seconds)',
            color: 0x800000,
            dropChance: 0.1,
            effects: {
                immediate: {
                    thirst: 15,
                    health: 5
                },
                duration: {
                    type: 'blurredVision',
                    value: 0.8,
                    duration: 20
                }
            }
        },
        whiskey: {
            name: 'Whiskey',
            description: 'Restores 10 thirst and reduces pain but causes blurred vision (40 seconds)',
            color: 0x8b4513,
            dropChance: 0.1,
            effects: {
                immediate: {
                    thirst: 10,
                    pain: -10
                },
                duration: {
                    type: 'blurredVision',
                    value: 0.6,
                    duration: 40
                }
            }
        },
        spoiledWater: {
            name: 'Spoiled Water',
            description: 'Restores 15 thirst but has high infection risk and worsens hygiene',
            color: 0x8b4513,
            dropChance: 0.2,
            effects: {
                immediate: {
                    thirst: 15,
                    hygiene: -30,
                    infection: 20
                }
            }
        }
    },
}; 