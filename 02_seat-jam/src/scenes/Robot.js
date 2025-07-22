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
	}

	lookDown(cell) {
		if (!cell || !cell.visual) {
			console.warn("Cannot look down, invalid cell or visual");
			return;
		}

		const targetPosition = cell.visual.position.clone();
		this.robot.lookAt(targetPosition);
	}

	getModel() {
		return this.robot;
	}
}
