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
}
