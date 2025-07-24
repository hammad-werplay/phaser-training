import * as THREE from "three";

export class Robot {
	constructor(robotModelRef) {
		this.robot = robotModelRef.clone();
		this.robot.scale.set(0.001, 0.001, 0.001);

		this.mixer = new THREE.AnimationMixer(this.robot);
		this.animationsByName = {};

		this.robot.animations.forEach((clip) => {
			const action = this.mixer.clipAction(clip);
			this.animationsByName[clip.name] = action;
		});
		this.nameLabel;
		this.robotLabel;
		this.isSeatedCorrectly = false;
	}

	playAnimation(name = "RobotArmature|Robot_Idle") {
		const action = this.animationsByName[name];
		if (!action) {
			console.warn(`Animation "${name}" not found`);
			return;
		}

		// Stop all other animations on this robot
		Object.values(this.animationsByName).forEach((a) => {
			if (a !== action) a.stop();
		});

		action.reset();
		if (name.includes("Sitting")) {
			action.setLoop(THREE.LoopOnce, 1);
			action.clampWhenFinished = true;
			action.paused = false;
			action.reset();
			action.play();
			action.onFinished = () => {
				action.stop();
				action.enabled = true;
				action.time = action.getClip().duration;
				action.setEffectiveWeight(1);
			};
			this.mixer.addEventListener("finished", (e) => {
				if (e.action === action) {
					action.stop();
					action.enabled = true;
					action.time = action.getClip().duration;
					action.setEffectiveWeight(1);
				}
			});
		} else {
			action.setLoop(THREE.LoopRepeat);
		}
		action.clampWhenFinished = true;
		action.play();
	}

	attachTo(cell, scene, animationName = "RobotArmature|Robot_Idle", labelText) {
		this.robot.position.copy(cell.visual.position);

		if (animationName && cell.type !== "seat") {
			this.playAnimation(animationName);
		} else {
			this.playAnimation("RobotArmature|Robot_Sitting");
		}

		cell.robotObject = this;
		cell.robot = this.robot;
		cell.isBlocked = true;

		scene.add(this.robot);
		this.nameLabel = this.createNameLabel(labelText);
		this.isSeatedCorrectly = this.isInCorrectSeat(cell.seatLabel);
		scene.add(this.nameLabel);
	}

	lookDown(cell) {
		if (!cell || !cell.visual) {
			console.warn("Cannot look down, invalid cell or visual");
			return;
		}

		const targetPosition = cell.visual.position.clone();
		this.robot.lookAt(targetPosition);
	}

	updateLabelPosition(camera) {
		if (!this.nameLabel) return;

		const head = this.robot.getObjectByName("Head");

		if (head && this.nameLabel) {
			const headWorldPos = new THREE.Vector3();
			head.getWorldPosition(headWorldPos);

			this.nameLabel.position
				.copy(headWorldPos)
				.add(new THREE.Vector3(0, 0.1, 0.05));

			const cameraDirection = new THREE.Vector3();
			camera.getWorldDirection(cameraDirection);

			this.nameLabel.position.add(cameraDirection.multiplyScalar(-0.05));
		}
	}

	createNameLabel(text = "A1") {
		const canvas = document.createElement("canvas");
		const context = canvas.getContext("2d");
		canvas.width = 256;
		canvas.height = 128;

		context.font = "24px Arial";
		context.fillStyle = "#fff";
		context.textAlign = "center";
		context.fillText(text, canvas.width / 2, canvas.height / 2);

		const texture = new THREE.CanvasTexture(canvas);

		const material = new THREE.SpriteMaterial({
			map: texture,
			transparent: true,
		});

		const sprite = new THREE.Sprite(material);
		sprite.scale.set(1, 0.5, 1);

		this.nameLabel = sprite;
		this.robotLabel = text;

		return sprite;
	}

	isInCorrectSeat(correctSeat) {
		return this.robotLabel === correctSeat;
	}

	get isSeatedCorrectly() {
		return this.isSeatedCorrectly;
	}

	set isSeatedCorrectly(value) {
		this._isSeatedCorrectly = value;

		if (value) {
			this.playAnimation("RobotArmature|Robot_Sitting");
			this.changeRobotColor(value);
		} else {
			this.playAnimation("RobotArmature|Robot_Idle");
			this.changeRobotColor(false);
		}
	}

	changeRobotColor(isSeated) {
		this.robot.traverse((child) => {
			if (child.isMesh && child.material && child.material.color) {
				if (!child.userData._clonedMaterial) {
					const cloned = child.material.clone();
					child.userData._clonedMaterial = true;
					child.userData._originalColor = cloned.color.clone(); 
					child.material = cloned;
				}
	
				if (isSeated) {
					child.material.color.set(0x00ff00); 
				} else {
					if (child.userData._originalColor) {
						child.material.color.copy(child.userData._originalColor);
					}
				}
			}
		});
	}
	

	getModel() {
		return this.robot;
	}

	showEmotionSpriteAboveRobot(emotion, scene) {
		let emotionTexture;

		if (scene.textures.exists(emotion)) {
			const src = scene.textures.get(emotion).getSourceImage().src;
			emotionTexture = new THREE.TextureLoader().load(src);
		} else {
			console.error(`${emotion} texture not found in Phaser cache`);
			return;
		}

		const emotionMaterial = new THREE.SpriteMaterial({
			map: emotionTexture,
			transparent: true,
			depthTest: false,
			depthWrite: false,
			opacity: 0
		});

		const emotionSprite = new THREE.Sprite(emotionMaterial);
		emotionSprite.scale.set(0.13, 0.13, 0.13);

		// Position above the robot's head
		const robotObj = this;
		const robotPos = robotObj.robot.position.clone();

		emotionSprite.position.copy(robotPos);
		emotionSprite.position.y += 0.5;
		// Always face the camera
		emotionSprite.onBeforeRender = (renderer, scene, camera) => {
			emotionSprite.quaternion.copy(camera.quaternion);
		};
		
		scene.threeScene.add(emotionSprite);

		// Animate: fade in, hold, fade out, then remove
		let elapsed = 0;
		let phase = 0; // 0: fade in, 1: hold, 2: fade out
		const fadeInDuration = 300;
		const holdDuration = 400;
		const fadeOutDuration = 800;
		const startScale = 0.1;
		const endScale = 0.4;

		emotionSprite.scale.set(startScale, startScale, startScale);

		const animateAngry = (time, delta) => {
			// delta is in ms
			elapsed += delta;
			if (phase === 0) {
				// Fade in
				const t = Math.min(elapsed / fadeInDuration, 1);
				emotionSprite.material.opacity = t;
				const scale = startScale + (endScale - startScale) * t;
				emotionSprite.scale.set(scale, scale, scale);
				if (t >= 1) {
					phase = 1;
					elapsed = 0;
				}
			} else if (phase === 1) {
				// Hold
				emotionSprite.material.opacity = 1;
				emotionSprite.scale.set(endScale, endScale, endScale);
				if (elapsed >= holdDuration) {
					phase = 2;
					elapsed = 0;
				}
			} else if (phase === 2) {
				// Fade out
				const t = Math.min(elapsed / fadeOutDuration, 1);
				emotionSprite.material.opacity = 1 - t;
				const scale = endScale - (endScale - startScale) * t;
				emotionSprite.scale.set(scale, scale, scale);
				if (t >= 1) {
					scene.threeScene.remove(emotionSprite);
					emotionSprite.material.dispose();
					emotionTexture.dispose();
					scene.events.off('update', animateAngry);
				}
			}
		};

		// Listen to the scene's update event (Phaser's event emitter)
		scene.events.on('update', animateAngry);
		
	}

	transformRobotHead(toSelected = true) {
		const head = this.robot.getObjectByName("Head");
		if (head) {
			head.traverse((child) => {
				if (child.isMesh) {
					// Clone the material if it hasn't been cloned yet, to avoid affecting other robots
					if (!child.material._isClonedForSelection) {
						child.material = child.material.clone();
						child.material._isClonedForSelection = true;
						// Store original color, scale, and position for restoration
						child.material._originalColor = child.material.color.clone();
						child._originalScale = child.scale.clone();
						child._originalPosition = child.position.clone();
					}
					if (toSelected) {
						child.scale.set(1, 1, 1);
						child.position.set(0, 0.1, 0);
						child.material.color.set(0x00ffff);
					} else {
						// Restore original state
						if (child.material._originalColor) {
							child.material.color.copy(child.material._originalColor);
						}
						if (child._originalScale) {
							child.scale.copy(child._originalScale);
						}
						if (child._originalPosition) {
							child.position.copy(child._originalPosition);
						}
					}
				}
			});
		}
	};
}
