/**
 * 気象システムを管理するクラス
 */
class Weather {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.currentWeather = 'clear';
        this.weatherObjects = {
            rain: null,
            snow: null,
            clouds: [],
            lightning: null
        };
        this.lastWeatherChange = 0;
        this.lastLightningTime = 0;
        this.isLightningActive = false;
        
        // 気象オブジェクトの初期化
        this.initWeatherObjects();
    }
    
    /**
     * 気象オブジェクトを初期化
     */
    initWeatherObjects() {
        // 雨の初期化
        this.initRain();
        
        // 雪の初期化
        this.initSnow();
        
        // 雲の初期化
        this.initClouds();
        
        // 稲妻の初期化
        this.initLightning();
    }
    
    /**
     * 雨を初期化
     */
    initRain() {
        const rainGeometry = new THREE.BufferGeometry();
        const rainPositions = [];
        const rainVelocities = [];
        
        // 雨滴の数を増やし、より広い範囲に分布させる
        for (let i = 0; i < GameConfig.WEATHER.RAIN.DROP_COUNT; i++) {
            // より広い範囲に雨滴を配置
            const x = (Math.random() - 0.5) * GameConfig.WEATHER.RAIN.COVERAGE_RADIUS;
            const y = Math.random() * 100;
            const z = (Math.random() - 0.5) * GameConfig.WEATHER.RAIN.COVERAGE_RADIUS;
            
            rainPositions.push(x, y, z);
            
            // より自然な落下速度を設定
            const vx = (Math.random() - 0.5) * 2;
            const vy = -GameConfig.WEATHER.RAIN.DROP_SPEED * (0.8 + Math.random() * 0.4);
            const vz = (Math.random() - 0.5) * 2;
            
            rainVelocities.push(vx, vy, vz);
        }
        
        rainGeometry.setAttribute('position', new THREE.Float32BufferAttribute(rainPositions, 3));
        rainGeometry.setAttribute('velocity', new THREE.Float32BufferAttribute(rainVelocities, 3));
        
        const rainMaterial = new THREE.PointsMaterial({
            color: GameConfig.WEATHER.RAIN.DROP_COLOR,
            size: GameConfig.WEATHER.RAIN.DROP_SIZE * 1.5,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        this.weatherObjects.rain = new THREE.Points(rainGeometry, rainMaterial);
        this.weatherObjects.rain.visible = false;
        this.scene.add(this.weatherObjects.rain);
    }
    
    /**
     * 雪を初期化
     */
    initSnow() {
        const snowGeometry = new THREE.BufferGeometry();
        const snowPositions = [];
        const snowVelocities = [];
        
        for (let i = 0; i < GameConfig.WEATHER.SNOW.FLAKE_COUNT; i++) {
            // ランダムな位置を設定
            const x = (Math.random() - 0.5) * GameConfig.WEATHER.SNOW.COVERAGE_RADIUS;
            const y = Math.random() * 50;
            const z = (Math.random() - 0.5) * GameConfig.WEATHER.SNOW.COVERAGE_RADIUS;
            
            snowPositions.push(x, y, z);
            
            // 落下速度を設定（雪はゆっくりと落ちる）
            const vx = (Math.random() - 0.5) * 0.5;
            const vy = -GameConfig.WEATHER.SNOW.FLAKE_SPEED;
            const vz = (Math.random() - 0.5) * 0.5;
            
            snowVelocities.push(vx, vy, vz);
        }
        
        snowGeometry.setAttribute('position', new THREE.Float32BufferAttribute(snowPositions, 3));
        snowGeometry.setAttribute('velocity', new THREE.Float32BufferAttribute(snowVelocities, 3));
        
        const snowMaterial = new THREE.PointsMaterial({
            color: GameConfig.WEATHER.SNOW.FLAKE_COLOR,
            size: GameConfig.WEATHER.SNOW.FLAKE_SIZE,
            transparent: true,
            opacity: 0.8
        });
        
        this.weatherObjects.snow = new THREE.Points(snowGeometry, snowMaterial);
        this.weatherObjects.snow.visible = false;
        this.scene.add(this.weatherObjects.snow);
    }
    
    /**
     * 雲を初期化
     */
    initClouds() {
        for (let i = 0; i < GameConfig.WEATHER.CLOUD.COUNT; i++) {
            const size = GameConfig.WEATHER.CLOUD.MIN_SIZE + 
                        Math.random() * (GameConfig.WEATHER.CLOUD.MAX_SIZE - GameConfig.WEATHER.CLOUD.MIN_SIZE);
            
            const cloudGeometry = new THREE.SphereGeometry(size, 8, 8);
            const cloudMaterial = new THREE.MeshStandardMaterial({
                color: GameConfig.WEATHER.CLOUD.COLOR,
                transparent: true,
                opacity: 0.8,
                roughness: 0.5,
                metalness: 0.1
            });
            
            const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
            
            // ランダムな位置を設定
            cloud.position.set(
                (Math.random() - 0.5) * 200,
                50 + Math.random() * 30,
                (Math.random() - 0.5) * 200
            );
            
            // ランダムな速度を設定
            cloud.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * GameConfig.WEATHER.CLOUD.SPEED,
                    0,
                    (Math.random() - 0.5) * GameConfig.WEATHER.CLOUD.SPEED
                )
            };
            
            this.weatherObjects.clouds.push(cloud);
            cloud.visible = false;
            this.scene.add(cloud);
        }
    }
    
    /**
     * 稲妻を初期化
     */
    initLightning() {
        const lightningGeometry = new THREE.PlaneGeometry(200, 200);
        const lightningMaterial = new THREE.MeshBasicMaterial({
            color: GameConfig.WEATHER.STORM.LIGHTNING_COLOR,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide
        });
        
        this.weatherObjects.lightning = new THREE.Mesh(lightningGeometry, lightningMaterial);
        this.weatherObjects.lightning.position.set(0, 50, -100);
        this.weatherObjects.lightning.rotation.x = Math.PI / 2;
        this.weatherObjects.lightning.visible = false;
        this.scene.add(this.weatherObjects.lightning);
    }
    
    /**
     * 気象を更新
     * @param {number} deltaTime - 前回の更新からの経過時間（秒）
     * @param {number} currentTime - 現在のゲーム時間（秒）
     * @param {number} timeOfDay - 時間帯（0-1の値）
     */
    update(deltaTime, currentTime, timeOfDay) {
        // 気象の変更をチェック
        if (currentTime - this.lastWeatherChange > GameConfig.WEATHER.CHANGE_INTERVAL) {
            this.changeWeather(timeOfDay);
            this.lastWeatherChange = currentTime;
        }
        
        // 現在の気象に応じて更新
        switch (this.currentWeather) {
            case 'clear':
                this.updateClear();
                break;
            case 'cloudy':
                this.updateCloudy(deltaTime);
                break;
            case 'rain':
                this.updateRain(deltaTime);
                break;
            case 'snow':
                this.updateSnow(deltaTime);
                break;
            case 'storm':
                this.updateStorm(deltaTime, currentTime);
                break;
        }
    }
    
    /**
     * 気象を変更
     * @param {number} timeOfDay - 時間帯（0-1の値）
     */
    changeWeather(timeOfDay) {
        // 現在の気象を非表示
        this.hideAllWeather();
        
        // 時間帯に基づいて天候確率を取得
        let weatherProbabilities;
        
        if (timeOfDay >= 0.2 && timeOfDay < 0.25) {
            // 朝
            weatherProbabilities = GameConfig.WEATHER.TIME_BASED_PROBABILITIES.DAWN;
        } else if (timeOfDay >= 0.25 && timeOfDay < 0.75) {
            // 昼
            weatherProbabilities = GameConfig.WEATHER.TIME_BASED_PROBABILITIES.DAY;
        } else if (timeOfDay >= 0.75 && timeOfDay < 0.8) {
            // 夕方
            weatherProbabilities = GameConfig.WEATHER.TIME_BASED_PROBABILITIES.DUSK;
        } else {
            // 夜
            weatherProbabilities = GameConfig.WEATHER.TIME_BASED_PROBABILITIES.NIGHT;
        }
        
        // 確率に基づいて天候を選択
        const random = Math.random();
        let cumulativeProbability = 0;
        
        for (const weatherType of GameConfig.WEATHER.TYPES) {
            cumulativeProbability += weatherProbabilities[weatherType];
            if (random <= cumulativeProbability) {
                this.currentWeather = weatherType;
                break;
            }
        }
        
        // 新しい気象を表示
        this.showCurrentWeather();
        
        console.log('気象が変更されました:', this.currentWeather, '時間帯:', timeOfDay);
    }
    
    /**
     * すべての気象オブジェクトを非表示
     */
    hideAllWeather() {
        // 雨を非表示
        if (this.weatherObjects.rain) {
            this.weatherObjects.rain.visible = false;
        }
        
        // 雪を非表示
        if (this.weatherObjects.snow) {
            this.weatherObjects.snow.visible = false;
        }
        
        // 雲を非表示
        this.weatherObjects.clouds.forEach(cloud => {
            cloud.visible = false;
        });
        
        // 稲妻を非表示
        if (this.weatherObjects.lightning) {
            this.weatherObjects.lightning.visible = false;
            this.weatherObjects.lightning.material.opacity = 0;
        }
    }
    
    /**
     * 現在の気象を表示
     */
    showCurrentWeather() {
        switch (this.currentWeather) {
            case 'clear':
                // 晴れの場合は何も表示しない
                break;
            case 'cloudy':
                // 雲を表示
                this.weatherObjects.clouds.forEach(cloud => {
                    cloud.visible = true;
                });
                break;
            case 'rain':
                // 雨と雲を表示
                this.weatherObjects.rain.visible = true;
                this.weatherObjects.clouds.forEach(cloud => {
                    cloud.visible = true;
                });
                break;
            case 'snow':
                // 雪と雲を表示
                this.weatherObjects.snow.visible = true;
                this.weatherObjects.clouds.forEach(cloud => {
                    cloud.visible = true;
                });
                break;
            case 'storm':
                // 雨、雲、稲妻を表示
                this.weatherObjects.rain.visible = true;
                this.weatherObjects.clouds.forEach(cloud => {
                    cloud.visible = true;
                });
                this.weatherObjects.lightning.visible = true;
                break;
        }
    }
    
    /**
     * 晴れの更新
     */
    updateClear() {
        // 晴れの場合は何もしない
    }
    
    /**
     * 曇りの更新
     * @param {number} deltaTime - 前回の更新からの経過時間（秒）
     */
    updateCloudy(deltaTime) {
        // 雲の移動
        this.weatherObjects.clouds.forEach(cloud => {
            cloud.position.add(cloud.userData.velocity.clone().multiplyScalar(deltaTime));
            
            // 雲が画面外に出たら反対側から再出現
            if (cloud.position.x > 100) cloud.position.x = -100;
            if (cloud.position.x < -100) cloud.position.x = 100;
            if (cloud.position.z > 100) cloud.position.z = -100;
            if (cloud.position.z < -100) cloud.position.z = 100;
        });
    }
    
    /**
     * 雨の更新
     * @param {number} deltaTime - 前回の更新からの経過時間（秒）
     */
    updateRain(deltaTime) {
        // 雲の移動
        this.updateCloudy(deltaTime);
        
        // 雨の更新
        const positions = this.weatherObjects.rain.geometry.attributes.position.array;
        const velocities = this.weatherObjects.rain.geometry.attributes.velocity.array;
        
        for (let i = 0; i < positions.length; i += 3) {
            // 位置を更新
            positions[i] += velocities[i] * deltaTime;
            positions[i + 1] += velocities[i + 1] * deltaTime;
            positions[i + 2] += velocities[i + 2] * deltaTime;
            
            // 雨滴が地面に達したら上に戻す
            if (positions[i + 1] < 0) {
                positions[i + 1] = 100;
                positions[i] = (Math.random() - 0.5) * 200;
                positions[i + 2] = (Math.random() - 0.5) * 200;
                
                // 新しい落下速度を設定
                velocities[i] = (Math.random() - 0.5) * 2;
                velocities[i + 1] = -GameConfig.WEATHER.RAIN.DROP_SPEED * (0.8 + Math.random() * 0.4);
                velocities[i + 2] = (Math.random() - 0.5) * 2;
            }
        }
        
        this.weatherObjects.rain.geometry.attributes.position.needsUpdate = true;
        this.weatherObjects.rain.geometry.attributes.velocity.needsUpdate = true;
    }
    
    /**
     * 雪の更新
     * @param {number} deltaTime - 前回の更新からの経過時間（秒）
     */
    updateSnow(deltaTime) {
        // 雲の移動
        this.updateCloudy(deltaTime);
        
        // 雪の更新
        const positions = this.weatherObjects.snow.geometry.attributes.position.array;
        const velocities = this.weatherObjects.snow.geometry.attributes.velocity.array;
        
        for (let i = 0; i < positions.length; i += 3) {
            // 位置を更新
            positions[i] += velocities[i] * deltaTime;
            positions[i + 1] += velocities[i + 1] * deltaTime;
            positions[i + 2] += velocities[i + 2] * deltaTime;
            
            // 雪が地面に達したら上に戻す
            if (positions[i + 1] < 0) {
                positions[i + 1] = 50;
                positions[i] = (Math.random() - 0.5) * 100;
                positions[i + 2] = (Math.random() - 0.5) * 100;
            }
        }
        
        this.weatherObjects.snow.geometry.attributes.position.needsUpdate = true;
    }
    
    /**
     * 嵐の更新
     * @param {number} deltaTime - 前回の更新からの経過時間（秒）
     * @param {number} currentTime - 現在のゲーム時間（秒）
     */
    updateStorm(deltaTime, currentTime) {
        // 雨と雲の更新
        this.updateRain(deltaTime);
        
        // 稲妻の更新
        if (currentTime - this.lastLightningTime > GameConfig.WEATHER.STORM.LIGHTNING_INTERVAL) {
            this.createLightning();
            this.lastLightningTime = currentTime;
        }
        
        // 稲妻のフェードアウト
        if (this.isLightningActive) {
            this.weatherObjects.lightning.material.opacity -= deltaTime / GameConfig.WEATHER.STORM.LIGHTNING_DURATION;
            
            if (this.weatherObjects.lightning.material.opacity <= 0) {
                this.weatherObjects.lightning.material.opacity = 0;
                this.isLightningActive = false;
            }
        }
    }
    
    /**
     * 稲妻を作成
     */
    createLightning() {
        this.weatherObjects.lightning.material.opacity = 0.8;
        this.isLightningActive = true;
        
        // 稲妻の位置をランダムに設定
        this.weatherObjects.lightning.position.x = (Math.random() - 0.5) * 100;
        this.weatherObjects.lightning.position.z = (Math.random() - 0.5) * 100;
        
        // 稲妻の回転をランダムに設定
        this.weatherObjects.lightning.rotation.z = Math.random() * Math.PI * 2;
    }
    
    /**
     * 現在の気象を取得
     * @returns {string} 現在の気象
     */
    getCurrentWeather() {
        return this.currentWeather;
    }
} 