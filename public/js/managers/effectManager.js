class EffectManager {
	constructor(game) {
		this.game = game;
		this.bloodEffects = [];
		this.bloodstains = [];
		this.cleanupQueue = [];
	}

	createBloodEffect(position) {
		// 血しぶきエフェクトを作成
		const particleCount = 20;
		const particles = new THREE.Group();
		
		for (let i = 0; i < particleCount; i++) {
			const geometry = new THREE.SphereGeometry(0.1, 8, 8);
			const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
			const particle = new THREE.Mesh(geometry, material);
			
			// ランダムな方向に飛び散る
			const velocity = new THREE.Vector3(
				(Math.random() - 0.5) * 2,
				Math.random() * 3,
				(Math.random() - 0.5) * 2
			);
			
			particle.position.copy(position);
			particle.userData = { velocity, life: 1.0 };
			particles.add(particle);
		}
		
		this.game.scene.add(particles);
		this.bloodEffects.push(particles);
		
		// アニメーション
		const animate = () => {
			let allDead = true;
			particles.children.forEach(particle => {
				if (particle.userData.life > 0) {
					particle.position.add(particle.userData.velocity.clone().multiplyScalar(0.016));
					particle.userData.velocity.y -= 0.1; // 重力
					particle.userData.life -= 0.016;
					particle.material.opacity = particle.userData.life;
					allDead = false;
				}
			});
			
			if (!allDead) {
				requestAnimationFrame(animate);
			} else {
				this.game.scene.remove(particles);
				const index = this.bloodEffects.indexOf(particles);
				if (index > -1) {
					this.bloodEffects.splice(index, 1);
				}
			}
		};
		animate();
	}

	createBloodstain(position) {
		// 血痕エフェクトを作成
		const geometry = new THREE.CircleGeometry(0.5, 8);
		const material = new THREE.MeshBasicMaterial({ 
			color: 0x8B0000, 
			transparent: true, 
			opacity: 0.7 
		});
		const bloodstain = new THREE.Mesh(geometry, material);
		
		bloodstain.position.copy(position);
		bloodstain.position.y = 0.01; // 地面の少し上
		bloodstain.rotation.x = -Math.PI / 2; // 地面に平行
		
		this.game.scene.add(bloodstain);
		this.bloodstains.push(bloodstain);
		
		// 徐々に透明になるアニメーション
		const fadeOut = () => {
			if (material.opacity > 0) {
				material.opacity -= 0.001;
				requestAnimationFrame(fadeOut);
			} else {
				this.game.scene.remove(bloodstain);
				const index = this.bloodstains.indexOf(bloodstain);
				if (index > -1) {
					this.bloodstains.splice(index, 1);
				}
			}
		};
		fadeOut();
	}

	createNeonEffect(position, color = 0x00ff00) {
		// ネオンエフェクトを作成
		const geometry = new THREE.SphereGeometry(1, 16, 16);
		const material = new THREE.MeshBasicMaterial({ 
			color: color, 
			transparent: true, 
			opacity: 0.8 
		});
		const neon = new THREE.Mesh(geometry, material);
		
		neon.position.copy(position);
		this.game.scene.add(neon);
		
		// パルスアニメーション
		let scale = 1;
		const pulse = () => {
			scale = 1 + Math.sin(Date.now() * 0.01) * 0.2;
			neon.scale.setScalar(scale);
			requestAnimationFrame(pulse);
		};
		pulse();
		
		// 5秒後に削除
		setTimeout(() => {
			this.game.scene.remove(neon);
		}, 5000);
	}

	createExplosionEffect(position, intensity = 1) {
		// 爆発エフェクトを作成
		const particleCount = 30 * intensity;
		const particles = new THREE.Group();
		
		for (let i = 0; i < particleCount; i++) {
			const geometry = new THREE.SphereGeometry(0.05, 4, 4);
			const material = new THREE.MeshBasicMaterial({ 
				color: Math.random() > 0.5 ? 0xff6600 : 0xffff00 
			});
			const particle = new THREE.Mesh(geometry, material);
			
			// 球状に飛び散る
			const angle = Math.random() * Math.PI * 2;
			const phi = Math.acos(Math.random() * 2 - 1);
			const velocity = new THREE.Vector3(
				Math.sin(phi) * Math.cos(angle) * 3,
				Math.cos(phi) * 3,
				Math.sin(phi) * Math.sin(angle) * 3
			);
			
			particle.position.copy(position);
			particle.userData = { velocity, life: 1.0 };
			particles.add(particle);
		}
		
		this.game.scene.add(particles);
		
		// アニメーション
		const animate = () => {
			let allDead = true;
			particles.children.forEach(particle => {
				if (particle.userData.life > 0) {
					particle.position.add(particle.userData.velocity.clone().multiplyScalar(0.016));
					particle.userData.velocity.multiplyScalar(0.98); // 空気抵抗
					particle.userData.life -= 0.016;
					particle.material.opacity = particle.userData.life;
					allDead = false;
				}
			});
			
			if (!allDead) {
				requestAnimationFrame(animate);
			} else {
				this.game.scene.remove(particles);
			}
		};
		animate();
	}

	createHealEffect(position) {
		// 回復エフェクトを作成
		const geometry = new THREE.SphereGeometry(0.3, 8, 8);
		const material = new THREE.MeshBasicMaterial({ 
			color: 0x00ff00, 
			transparent: true, 
			opacity: 0.8 
		});
		const healEffect = new THREE.Mesh(geometry, material);
		
		healEffect.position.copy(position);
		this.game.scene.add(healEffect);
		
		// 上昇アニメーション
		let time = 0;
		const animate = () => {
			time += 0.016;
			healEffect.position.y += 0.05;
			healEffect.material.opacity = Math.max(0, 0.8 - time * 2);
			
			if (healEffect.material.opacity > 0) {
				requestAnimationFrame(animate);
			} else {
				this.game.scene.remove(healEffect);
			}
		};
		animate();
	}

	createDamageEffect(position, damage) {
		// ダメージエフェクトを作成
		const canvas = document.createElement('canvas');
		const context = canvas.getContext('2d');
		canvas.width = 128;
		canvas.height = 64;
		
		context.fillStyle = '#ff0000';
		context.font = 'bold 24px Arial';
		context.textAlign = 'center';
		context.fillText(`-${damage}`, 64, 32);
		
		const texture = new THREE.CanvasTexture(canvas);
		const geometry = new THREE.PlaneGeometry(2, 1);
		const material = new THREE.MeshBasicMaterial({ 
			map: texture, 
			transparent: true, 
			opacity: 1 
		});
		const damageText = new THREE.Mesh(geometry, material);
		
		damageText.position.copy(position);
		damageText.position.y += 2;
		this.game.scene.add(damageText);
		
		// 上昇・フェードアニメーション
		let time = 0;
		const animate = () => {
			time += 0.016;
			damageText.position.y += 0.03;
			damageText.material.opacity = Math.max(0, 1 - time * 2);
			
			if (damageText.material.opacity > 0) {
				requestAnimationFrame(animate);
			} else {
				this.game.scene.remove(damageText);
			}
		};
		animate();
	}

	performMemoryCleanup() {
		// メモリクリーンアップを実行
		this.cleanupQueue.forEach(item => {
			if (item.mesh && item.mesh.geometry) {
				item.mesh.geometry.dispose();
			}
			if (item.mesh && item.mesh.material) {
				if (Array.isArray(item.mesh.material)) {
					item.mesh.material.forEach(material => material.dispose());
				} else {
					item.mesh.material.dispose();
				}
			}
		});
		this.cleanupQueue = [];
	}

	processCleanupQueue() {
		// クリーンアップキューを処理
		this.cleanupQueue = this.cleanupQueue.filter(item => {
			if (item.life <= 0) {
				if (item.mesh) {
					this.game.scene.remove(item.mesh);
				}
				return false;
			}
			item.life -= 0.016;
			return true;
		});
	}

	clearAllEffects() {
		// すべてのエフェクトをクリア
		this.bloodEffects.forEach(effect => {
			this.game.scene.remove(effect);
		});
		this.bloodEffects = [];
		
		this.bloodstains.forEach(stain => {
			this.game.scene.remove(stain);
		});
		this.bloodstains = [];
		
		this.cleanupQueue.forEach(item => {
			if (item.mesh) {
				this.game.scene.remove(item.mesh);
			}
		});
		this.cleanupQueue = [];
	}
} 