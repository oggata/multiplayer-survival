/**
 * ゲーム設定値
 */
const GameConfig = {
    // プレイヤー設定
    PLAYER: {
        MOVE_SPEED: 5.0,
        ROTATION_SPEED: 0.08,
        MAX_HEALTH: 100,
        COLLISION_RADIUS: 1.0
    },
    
    // 敵設定
    ENEMY: {
        MAX_COUNT:  20,
        SPAWN_INTERVAL: 5000, // ミリ秒
        SPAWN_RADIUS: 80, // プレイヤーからの距離
        DESPAWN_RADIUS: 100, // プレイヤーからの距離
        CHASE_DISTANCE: 10, // プレイヤーを追跡する距離
        DAMAGE: 5, // プレイヤーに与えるダメージ
        MOVE_SPEED: 1.0
    },
    
    // アイテム設定
    ITEM: {
        MAX_COUNT:  400,
        COLLECTION_RADIUS: 1.0
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
        DAY_LENGTH: 600, // 秒
        TIME_SPEED: 0.1 // 1フレームあたりの時間進行
    },
    
    // 霧設定
    FOG: {
        DENSITY: 0.01
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
        SIZE: 1000,
        BOUNDARY_WALL_HEIGHT: 20,
        FLOOR: {
            THICKNESS: 1,
            COLOR: 0x808080,
            GRID_SIZE: 50,
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
            DROP_COUNT: 2000,  // 雨滴の数を増やす
            DROP_SIZE: 0.15,   // 雨滴のサイズを少し大きく
            DROP_SPEED: 20,    // 落下速度を上げる
            DROP_COLOR: 0x88ccff
        },
        SNOW: {
            FLAKE_COUNT: 500,
            FLAKE_SIZE: 0.2,
            FLAKE_SPEED: 5,
            FLAKE_COLOR: 0xffffff
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
        FOV: 60,
        MAX_DISTANCE: 100,  // 最大表示距離を50に増加
        FADE_START: 80,    // フェード開始距離を40に増加
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
}; 