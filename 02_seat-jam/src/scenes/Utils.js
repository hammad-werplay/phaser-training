export class Utils {
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
	 * Creates a game scenario with the robots in the seats.
	 * @returns {Array} - An array of objects with the seat and position of the robots.
	 */

	static createGameScenario() {
		const scenarios = [
			[
				{ seat: "A1", position: [4, 1] },
				{ seat: "A2", position: [2, 2] },
				{ seat: "A3", position: [0, 3] },
				{ seat: "A4", position: [5, 0] },
				{ seat: "B1", position: [1, 1] },
				{ seat: "B2", position: [3, 3] },
				{ seat: "B3", position: [4, 0] },
				{ seat: "B4", position: [2, 0] },
			],
			[
				{ seat: "A1", position: [0, 0] },
				{ seat: "A2", position: [3, 0] },
				{ seat: "A3", position: [4, 0] },
				{ seat: "A4", position: [2, 3] },
				{ seat: "B1", position: [5, 1] },
				{ seat: "B2", position: [3, 2] },
				{ seat: "B3", position: [3, 3] },
				{ seat: "B4", position: [1, 2] },
			],
		];

		const robotPositions = [
			{ seat: "A3", position: [0, 0] },
			{ seat: "B1", position: [2, 0] },
			{ seat: "A1", position: [3, 0] },
			{ seat: "A2", position: [5, 0] },
			{ seat: "A4", position: [4, 1] },
			{ seat: "B2", position: [4, 2] },
			{ seat: "B3", position: [3, 3] },
			{ seat: "B4", position: [1, 2] },
		];

		// Step 1: Decide the seats location (No random)
		// Step 2: Decide the robots location (Random)
		// Step 2.1: Test whether robots can go to the seats
		// Step 3: Return the robotPositions with the seats and positions

		return robotPositions;
	}
}
