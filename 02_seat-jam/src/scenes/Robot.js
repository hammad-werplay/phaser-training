import * as THREE from "three";

export class Robot {
	constructor(robotModelRef, positions) {
		this.robot = robotModelRef.clone();
		this.robot.scale.set(0.001, 0.001, 0.001);
		this.robot.position.copy(positions);

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

		console.log(`Playing animation: ${name}`);
		action.reset().play();
	}

	getModel() {
		return this.robot;
	}
}
