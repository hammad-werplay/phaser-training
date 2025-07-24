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

	static transformRobotHead = (robotObject, toSelected = true) => {
		const head = robotObject.robot.getObjectByName("Head");
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
