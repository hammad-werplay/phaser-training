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

		action.reset().play();
	}

	attachTo(cell, scene, animationName = "RobotArmature|Robot_Idle") {
		this.robot.position.copy(cell.visual.position);

		if (animationName) {
			this.playAnimation(animationName);
		}

		cell.robotObject = this;
		cell.robot = this.robot;

		if (cell.type === "seat") {
			this.playAnimation("RobotArmature|Robot_Sitting");
		}

		scene.add(this.robot);

		this.nameLabel = this.createNameLabel();
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
		context.fillStyle = "black";
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

		return sprite;
	}

	getModel() {
		return this.robot;
	}
}
