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

	createMovesBox() {
		// Moves box and text
		this.scene.movesBox = this.scene.add
			.image(0, 0, "movesBox")
			.setOrigin(1, 0);
		this.scene.moveCountText = this.scene.add
			.text(0, 0, this.scene.movesLeft, {
				fontFamily: "MADE Tommy Soft",
				fontSize: "64px",
				color: "#ffffff",
				fontStyle: "bold",
				align: "center",
				stroke: "#000000",
				strokeThickness: 2,
			})
			.setOrigin(0.5);

		const drawMovesBox = () => {
			const padding = 10;
			const canvasWidth = this.scene.scale.width;
			const navBarHeight = this.scene.navbarHeight || 50;

			// Moves box scaling
			const boxScale = canvasWidth < 450 ? 0.33 : 0.7;
			this.scene.movesBox.setScale(boxScale);

			// Position: top-right under navbar
			this.scene.movesBox.x = canvasWidth;
			this.scene.movesBox.y = navBarHeight + padding;

			// Responsive font size
			const maxFontSize = this.scene.movesBox.displayHeight * 0.5;
			const finalFontSize = Math.min(40, maxFontSize);

			this.scene.moveCountText.setStyle({
				fontSize: `${Math.floor(finalFontSize)}px`,
			});

			// Center text inside box
			this.scene.moveCountText.setPosition(
				this.scene.movesBox.x - this.scene.movesBox.displayWidth / 2 + 15,
				this.scene.movesBox.y + this.scene.movesBox.displayHeight / 2
			);
		};

		// Initial draw
		drawMovesBox();

		// Redraw on resize
		this.scene.scale.on("resize", drawMovesBox, this);
	}
}
