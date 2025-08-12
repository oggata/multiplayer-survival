// アイテム設定ファイル
const ITEMS_CONFIG = {
    // 日本語設定
    ja: {
        shotgun: {
            name: 'ショットガン',
            description: '4方向に弾を発射する武器',
            color: 0x666666,
            dropChance: 0.05,
            effects: {
                duration: {
                    type: 'wepon',
                    duration: 60,
                    name: 'shotgun'
                }
            }
        },
        plasmacannon: {
            name: 'プラズマキャノン',
            description: '電気を帯びた弾を発射する武器',
            color: 0x00ffff,
            dropChance: 0.05,
            effects: {
                duration: {
                    type: 'wepon',
                    duration: 60,
                    name: 'plasmacannon'
                }
            }
        },
        // 他のアイテムも同様に追加
        healthPotion: {
            name: '体力ポーション',
            description: '体力を回復する',
            color: 0xff0000,
            dropChance: 0.1,
            category: 'medicine',
            effects: {
                instant: {
                    type: 'health',
                    value: 50
                }
            }
        },
        food: {
            name: '食料',
            description: '空腹を満たす',
            color: 0x8B4513,
            dropChance: 0.15,
            category: 'food',
            effects: {
                instant: {
                    type: 'hunger',
                    value: 30
                }
            }
        },
        water: {
            name: '水',
            description: '喉の渇きを癒す',
            color: 0x0000ff,
            dropChance: 0.15,
            category: 'drink',
            effects: {
                instant: {
                    type: 'thirst',
                    value: 30
                }
            }
        },
        experienceCrystal: {
            name: '経験値クリスタル',
            description: '経験値を得られるクリスタル',
            color: 0xffd700,
            dropChance: 0.0, // 敵が倒された時に必ずドロップするので0
            category: 'experience',
            effects: {
                instant: {
                    type: 'experience',
                    value: 15
                }
            }
        },
        medicine: {
            name: '薬',
            description: '体力全回復',
            color: 0x00ff00,
            dropChance: 0.08,
            category: 'medicine',
            effects: {
                immediate: {
                    health: 100
                }
            }
        },
        // 武器アイテム
        machinegun: {
            name: 'マシンガン',
            description: '5発連続で弾を発射する',
            color: 0x666666,
            dropChance: 0.05,
            effects: {
                duration: {
                    type: 'wepon',
                    duration: 60,
                    name: 'machinegun'
                }
            }
        },
        magnum: {
            name: 'マグナム',
            description: '強力な弾を発射する',
            color: 0x666666,
            dropChance: 0.05,
            effects: {
                duration: {
                    type: 'wepon',
                    duration: 60,
                    name: 'magnum'
                }
            }
        },
        grenadelauncher: {
            name: 'グレネードランチャー',
            description: '爆発する弾を発射する',
            color: 0x666666,
            dropChance: 0.05,
            effects: {
                duration: {
                    type: 'wepon',
                    duration: 60,
                    name: 'grenadelauncher'
                }
            }
        },
        flamethrower: {
            name: '火炎放射器',
            description: '広範囲に炎を放射する',
            color: 0xff6600,
            dropChance: 0.05,
            effects: {
                duration: {
                    type: 'wepon',
                    duration: 60,
                    name: 'flamethrower'
                }
            }
        },
        
        // 防具アイテム
        jacket: {
            name: 'ジャケット',
            description: 'HPが回復し続ける',
            color: 0x808080,
            dropChance: 0.08,
            effects: {
                duration: {
                    type: 'healthRegen',
                    duration: 60,
                    value: 5
                }
            }
        },
        boonieHat: {
            name: 'ブーニーハット',
            description: 'HPが回復し続ける',
            color: 0x808080,
            dropChance: 0.08,
            effects: {
                duration: {
                    type: 'healthRegen',
                    duration: 60,
                    value: 5
                }
            }
        },
        tacticalVest: {
            name: 'タクティカルベスト',
            description: 'HPが回復し続ける、スタミナがずっと最大',
            color: 0x808080,
            dropChance: 0.08,
            effects: {
                duration: {
                    type: 'healthRegenStaminaLock',
                    duration: 60,
                    value: 5
                }
            }
        },
        warpPotion: {
            name: 'ワープ薬',
            description: '他のプレイヤーの近くに瞬間移動する',
            color: 0x9932CC,
            dropChance: 0.03,
            category: 'medicine',
            effects: {
                instant: {
                    type: 'warp',
                    value: 1
                }
            }
        },
        
        // 医療アイテム
        adrenaline: {
            name: 'アドレナリン',
            description: 'スタミナを全回復し、走ってもスタミナが減らない（30秒）',
            color: 0x808080,
            dropChance: 0.08,
            effects: {
                immediate: {
                    stamina: 100
                },
                duration: {
                    type: 'adrenaline',
                    value: 5,
                    duration: 30
                }
            }
        },
        bandage: {
            name: '包帯',
            description: 'HPが回復し続ける',
            color: 0xffffff,
            dropChance: 0.1,
            effects: {
                duration: {
                    type: 'healthRegen',
                    duration: 60,
                    value: 5
                }
            }
        },
        chocolateBar: {
            name: 'チョコレートバー',
            description: '空腹回復率を上げる（60秒）',
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
        healthKit: {
            name: '救急キット',
            description: '体力を75回復する',
            color: 0xff0000,
            dropChance: 0.05,
            effects: {
                immediate: {
                    health: 75
                }
            }
        },
        firstAidKit: {
            name: 'ファーストエイドキット',
            description: '体力を75回復し出血を完全に止める',
            color: 0xff0000,
            dropChance: 0.03,
            effects: {
                immediate: {
                    health: 75,
                    bleeding: 0
                }
            }
        },
        morphine: {
            name: 'モルヒネ',
            description: 'スタミナが減らない（ずっと最大値）',
            color: 0xff00ff,
            dropChance: 0.04,
            effects: {
                duration: {
                    type: 'staminaLock',
                    duration: 60,
                    value: 1
                }
            }
        },
        
        // 食料アイテム
        dirtyFood: {
            name: '汚れた食料',
            description: '空腹を30回復するが体力を減少させる',
            color: 0x8b4513,
            dropChance: 0.2,
            effects: {
                immediate: {
                    hunger: 30,
                    health: -15
                }
            }
        },
        cannedSardines: {
            name: '缶詰サバ',
            description: '空腹を37回復し体力を7回復する',
            color: 0x8b4513,
            dropChance: 0.12,
            effects: {
                immediate: {
                    hunger: 37,
                    health: 7
                }
            }
        },
        cannedBeans: {
            name: '缶詰豆',
            description: '空腹を30回復する',
            color: 0x8b4513,
            dropChance: 0.12,
            effects: {
                immediate: {
                    hunger: 30
                }
            }
        },
        cannedCorn: {
            name: '缶詰コーン',
            description: '空腹を22回復する',
            color: 0x8b4513,
            dropChance: 0.12,
            effects: {
                immediate: {
                    hunger: 22
                }
            }
        },
        cannedTuna: {
            name: '缶詰ツナ',
            description: '空腹を45回復し体力を4回復する',
            color: 0x8b4513,
            dropChance: 0.12,
            effects: {
                immediate: {
                    hunger: 45,
                    health: 4
                }
            }
        },
        cannedSoup: {
            name: '缶詰スープ',
            description: '空腹を22回復し喉の渇きを15回復する',
            color: 0x8b4513,
            dropChance: 0.12,
            effects: {
                immediate: {
                    hunger: 22,
                    thirst: 15
                }
            }
        },
        bread: {
            name: 'パン',
            description: '空腹を37回復する',
            color: 0xdeb887,
            dropChance: 0.15,
            effects: {
                immediate: {
                    hunger: 37
                }
            }
        },
        crackers: {
            name: 'クラッカー',
            description: '空腹を15回復する',
            color: 0xdeb887,
            dropChance: 0.15,
            effects: {
                immediate: {
                    hunger: 15
                }
            }
        },
        apple: {
            name: 'リンゴ',
            description: '空腹を15回復し喉の渇きを7回復する',
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
            name: 'オレンジ',
            description: '空腹を7回復し喉の渇きを22回復する',
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
            name: 'ブルーベリー',
            description: '空腹を7回復し体力を4回復する',
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
            name: 'キノコ',
            description: '空腹を15回復する',
            color: 0x8b4513,
            dropChance: 0.15,
            effects: {
                immediate: {
                    hunger: 15
                }
            }
        },
        wildBerries: {
            name: '野生のベリー',
            description: '空腹を12回復するが感染のリスクがある',
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
            name: '生肉',
            description: '空腹を60回復する',
            color: 0x8b0000,
            dropChance: 0.1,
            effects: {
                immediate: {
                    hunger: 60
                }
            }
        },
        cookedMeat: {
            name: '調理された肉',
            description: '空腹を75回復し体力を15回復する',
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
            name: '魚',
            description: '空腹を30回復する',
            color: 0x4682b4,
            dropChance: 0.1,
            effects: {
                immediate: {
                    hunger: 30
                }
            }
        },
        cookedFish: {
            name: '調理された魚',
            description: '空腹を45回復し体力を7回復する',
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
            name: 'ニンジン',
            description: '空腹を15回復し体力を3回復する',
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
        dirtyWater: {
            name: '汚れた水',
            description: '喉の渇きを37回復するが体力を減少させる',
            color: 0x8b4513,
            dropChance: 0.2,
            effects: {
                immediate: {
                    thirst: 37,
                    health: -20
                }
            }
        },
        purifiedWater: {
            name: '浄水',
            description: '喉の渇きを75回復し体力を7回復する',
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
            name: 'ソーダ',
            description: '喉の渇きを45回復しスタミナを30回復する',
            color: 0xff0000,
            dropChance: 0.1,
            effects: {
                immediate: {
                    thirst: 45,
                    stamina: 30
                }
            }
        },
        tea: {
            name: 'お茶',
            description: '喉の渇きを30回復し体力を3回復する',
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
            name: 'ジュース',
            description: '喉の渇きを37回復し空腹を7回復しスタミナを20回復する',
            color: 0xffa500,
            dropChance: 0.1,
            effects: {
                immediate: {
                    thirst: 37,
                    hunger: 7,
                    stamina: 20
                }
            }
        },
        energyDrink: {
            name: 'エナジードリンク',
            description: 'スタミナを全回復し、走ってもスタミナが減らない（15秒）',
            color: 0x00ff00,
            dropChance: 0.1,
            effects: {
                immediate: {
                    stamina: 100
                },
                duration: {
                    type: 'energyDrink',
                    value: 3.0,
                    duration: 15
                }
            }
        },
        beer: {
            name: 'ビール',
            description: '喉の渇きを30回復するが視界がぼやける（30秒）',
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
            name: '腐った水',
            description: '喉の渇きを22回復するが体力を大幅に減少させる',
            color: 0x8b4513,
            dropChance: 0.2,
            effects: {
                immediate: {
                    thirst: 22,
                    health: -30
                }
            }
        }
    },
    
    // 英語設定
    en: {
        shotgun: {
            name: 'Shotgun',
            description: 'Fires bullets in 4 directions',
            color: 0x666666,
            dropChance: 0.05,
            effects: {
                duration: {
                    type: 'wepon',
                    duration: 60,
                    name: 'shotgun'
                }
            }
        },
        plasmacannon: {
            name: 'Plasma Cannon',
            description: 'Fires an electrifying bullet',
            color: 0x00ffff,
            dropChance: 0.05,
            effects: {
                duration: {
                    type: 'wepon',
                    duration: 60,
                    name: 'plasmacannon'
                }
            }
        },
        // 他のアイテムも同様に追加
        healthPotion: {
            name: 'Health Potion',
            description: 'Restores health',
            color: 0xff0000,
            dropChance: 0.1,
            category: 'medicine',
            effects: {
                instant: {
                    type: 'health',
                    value: 50
                }
            }
        },
        food: {
            name: 'Food',
            description: 'Satisfies hunger',
            color: 0x8B4513,
            dropChance: 0.15,
            category: 'food',
            effects: {
                instant: {
                    type: 'hunger',
                    value: 30
                }
            }
        },
        water: {
            name: 'Water',
            description: 'Quenches thirst',
            color: 0x0000ff,
            dropChance: 0.15,
            category: 'drink',
            effects: {
                instant: {
                    type: 'thirst',
                    value: 30
                }
            }
        },
        experienceCrystal: {
            name: 'Experience Crystal',
            description: 'Crystal that provides experience points',
            color: 0xffd700,
            dropChance: 0.0, // Always dropped when enemy is killed
            category: 'experience',
            effects: {
                instant: {
                    type: 'experience',
                    value: 15
                }
            }
        },
        medicine: {
            name: 'Medicine',
            description: 'Cures illness',
            color: 0x00ff00,
            dropChance: 0.08,
            category: 'medicine',
            effects: {
                instant: {
                    type: 'virus',
                    value: -20
                }
            }
        },
        warmClothes: {
            name: 'Warm Clothes',
            description: 'Increases body temperature',
            color: 0xffa500,
            dropChance: 0.1,
            effects: {
                duration: {
                    type: 'temperature',
                    duration: 60,
                    value: 20
                }
            }
        },
        
        // 武器アイテム
        machinegun: {
            name: 'Machine Gun',
            description: 'Fired 5 consecutive bullets',
            color: 0x666666,
            dropChance: 0.05,
            effects: {
                duration: {
                    type: 'wepon',
                    duration: 60,
                    name: 'machinegun'
                }
            }
        },
        magnum: {
            name: 'Magnum',
            description: 'Fires a powerful bullet',
            color: 0x666666,
            dropChance: 0.05,
            effects: {
                duration: {
                    type: 'wepon',
                    duration: 60,
                    name: 'magnum'
                }
            }
        },
        grenadelauncher: {
            name: 'Grenade Launcher',
            description: 'Firing Exploding Bullets',
            color: 0x666666,
            dropChance: 0.05,
            effects: {
                duration: {
                    type: 'wepon',
                    duration: 60,
                    name: 'grenadelauncher'
                }
            }
        },
        flamethrower: {
            name: 'Flamethrower',
            description: 'Emits a wide range of flame',
            color: 0xff6600,
            dropChance: 0.05,
            effects: {
                duration: {
                    type: 'wepon',
                    duration: 60,
                    name: 'flamethrower'
                }
            }
        },
        
        // 防具アイテム
        jacket: {
            name: 'Jacket',
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
            name: 'Boonie Hat',
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
        warpPotion: {
            name: 'Warp Potion',
            description: 'Instantly teleport near another player',
            color: 0x9932CC,
            dropChance: 0.03,
            category: 'medicine',
            effects: {
                instant: {
                    type: 'warp',
                    value: 1
                }
            }
        },
        
        // 医療アイテム
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
            description: 'Increases hunger recovery rate (60 seconds)',
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
        
        // 食料アイテム
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
        }
    }
};

// アイテム設定を取得する関数
function getItemsConfig(language = 'ja') {
    return ITEMS_CONFIG[language] || ITEMS_CONFIG.ja;
}

// 特定のアイテム設定を取得する関数
function getItemConfig(itemType, language = 'ja') {
    const items = getItemsConfig(language);
    return items[itemType] || null;
}

// アイテム名を取得する関数
function getItemName(itemType, language = 'ja') {
    const item = getItemConfig(itemType, language);
    return item ? item.name : itemType;
}

// アイテム説明を取得する関数
function getItemDescription(itemType, language = 'ja') {
    const item = getItemConfig(itemType, language);
    return item ? item.description : '';
}

// アイテム色を取得する関数
function getItemColor(itemType, language = 'ja') {
    const item = getItemConfig(itemType, language);
    return item ? item.color : 0xffffff;
}

// アイテムドロップ確率を取得する関数
function getItemDropChance(itemType, language = 'ja') {
    const item = getItemConfig(itemType, language);
    return item ? item.dropChance : 0;
}

// アイテム効果を取得する関数
function getItemEffects(itemType, language = 'ja') {
    const item = getItemConfig(itemType, language);
    return item ? item.effects : {};
}

// グローバルに公開
window.ItemsConfig = {
    getItemsConfig,
    getItemConfig,
    getItemName,
    getItemDescription,
    getItemColor,
    getItemDropChance,
    getItemEffects
}; 