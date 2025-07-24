export class Utils {
	/**
	 * Creates a label for the robot with the given text.
	 * @param {string} text - The text to display on the label.
	 * @returns {THREE.Sprite} - The created label sprite.
	 */
	static createNameLabel(text) {
		const canvas = document.createElement("canvas");
		canvas.width = 512;
		canvas.height = 256;

		const context = canvas.getContext("2d");
		context.fillStyle = "rgba(0, 0, 0, 0.5)";
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.font = "24px Arial";
		context.fillStyle = "#ffffff";
		context.textAlign = "center";
		context.fillText(text, canvas.width / 2, canvas.height / 2);

		const texture = new THREE.CanvasTexture(canvas);
		const material = new THREE.SpriteMaterial({ map: texture });
		const sprite = new THREE.Sprite(material);
		sprite.scale.set(1.5, 0.75, 1);

		return sprite;
	}

	/**
	 * Converts a 3D world position to a 2D screen position.
	 * @param {THREE.Vector3} position - The 3D world position to convert.
	 * @param {THREE.Camera} camera - The camera used for the conversion.
	 * @param {HTMLElement} rendererDom - The DOM element of the renderer.
	 * @returns {Object} - An object containing the x and y screen coordinates.
	 */

	static worldToScreen(position, camera, rendererDom) {
		const projected = position.clone().project(camera);

		const width = rendererDom.clientWidth;
		const height = rendererDom.clientHeight;

		const x = ((projected.x + 1) / 2) * width;
		const y = ((-projected.y + 1) / 2) * height;

		return { x, y };
	}

	/**
	 * Starts a pulse tween on the target object.
	 * @param {Object} target - The target object to apply the pulse effect.
	 * @param {Function} getBaseScale - A function that returns the base scale of the target.
	 */

	static startPulseTween(target, getBaseScale) {
		if (target.pulseTween) return;

		target.pulseTween = this.tweens.add({
			targets: target,
			scaleX: {
				getStart: getBaseScale,
				getEnd: () => getBaseScale() * 1.12,
			},
			scaleY: {
				getStart: getBaseScale,
				getEnd: () => getBaseScale() * 1.12,
			},
			yoyo: true,
			repeat: -1,
			duration: 500,
			ease: "Sine.easeInOut",
		});
	}
}
