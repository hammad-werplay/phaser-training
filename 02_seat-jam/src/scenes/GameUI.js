export class GameUI {
	constructor(scene) {
		this.scene = scene;
	}

	createNavbar() {
		const barHeight = 50;

		// nav background
		this.scene.navbarBg = this.scene.add.graphics();

		// centered text
		this.scene.navbarText = this.scene.add.text(
			0,
			0,
			"Can You Pass This level in 7 Moves?",
			{
				fontFamily: "MADE Tommy Soft",
				fontSize: "20px",
				color: "#ffffff",
				fontStyle: "bold",
				align: "center",
			}
		);

		const drawNavbar = () => {
			const canvasWidth = this.scene.scale.width;

			// Calculate font size
			let fontSize = Math.max(16, Math.min(64, Math.floor(canvasWidth * 0.05)));
			this.scene.navbarText.setStyle({ fontSize: `${fontSize}px` });
			while (this.scene.navbarText.width > canvasWidth * 0.9 && fontSize > 10) {
				fontSize -= 1;
				this.scene.navbarText.setStyle({ fontSize: `${fontSize}px` });
			}

			// Calculate nav height
			const dynamicBarHeight = Math.max(50, this.scene.navbarText.height + 20);

			// Draw background bar
			this.scene.navbarBg.clear();
			this.scene.navbarBg.fillStyle(0x000000, 1);
			this.scene.navbarBg.fillRect(0, 0, canvasWidth, dynamicBarHeight);

			// Center the text horizontally and vertically
			this.scene.navbarText.x =
				canvasWidth / 2 - this.scene.navbarText.width / 2;
			this.scene.navbarText.y =
				dynamicBarHeight / 2 - this.scene.navbarText.height / 2;

			// Store nav height
			this.scene.navbarHeight = dynamicBarHeight;
		};

		drawNavbar();

		// Redraw on resize
		this.scene.scale.on("resize", drawNavbar, this);
	}
}
