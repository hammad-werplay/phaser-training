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

	playAnimation(name) {
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

		cell.robot = this.robot;
		cell.robotObject = this;

		scene.add(this.robot);

		if (animationName) {
			this.playAnimation(animationName);
		}
	}

	getModel() {
		return this.robot;
	}
}
