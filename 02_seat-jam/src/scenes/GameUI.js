import { Robot } from "./Robot";

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
		this.scene.scale.on("resize", drawNavbar, this.scene);
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
		this.scene.scale.on("resize", drawMovesBox, this.scene);
	}

	createFooter() {
		this.scene.footerImage = this.scene.add
			.image(0, 0, "footer")
			.setOrigin(0.5, 1);
		this.scene.downloadButton = this.scene.add
			.image(0, 0, "button")
			.setOrigin(0.5);
		this.scene.downloadText = this.scene.add
			.text(0, 0, "DOWNLOAD", {
				fontFamily: "MADE Tommy Soft",
				fontSize: "24px",
				color: "#ffffff",
				fontFamily: "Arial",
				fontStyle: "bold",
				align: "center",
				stroke: "#000000",
				strokeThickness: 2,
			})
			.setOrigin(0.5);

		const drawFooter = () => {
			const { width: canvasWidth, height: canvasHeight } = this.scene.scale;

			// Footer scaling
			const scaleX = canvasWidth / this.scene.footerImage.width;
			const scaleY = scaleX;
			this.scene.footerImage.setScale(scaleX, scaleY);
			this.scene.footerImage.setPosition(canvasWidth / 2, canvasHeight);

			// Download Button scaling
			const footerWidth = this.scene.footerImage.displayWidth;
			const footerHeight = this.scene.footerImage.displayHeight;
			const buttonTargetHeight = footerHeight * 0.61;
			const buttonScale = buttonTargetHeight / this.scene.downloadButton.height;

			const buttonPadding = 20 * buttonScale;
			this.scene.downloadButton.setScale(buttonScale);
			this.scene.downloadButton.setPosition(
				this.scene.footerImage.x +
					footerWidth / 2 -
					this.scene.downloadButton.displayWidth / 2 -
					5 * 20 * buttonScale,
				this.scene.footerImage.y - footerHeight / 2 + 20 * buttonScale
			);

			// Text scaling
			const textScale = Math.max(buttonTargetHeight * 0.2, 12);
			this.scene.downloadText.setFontSize(textScale);
			this.scene.downloadText.setPosition(
				this.scene.downloadButton.x,
				this.scene.downloadButton.y
			);

			// Store base scale for tweening
			this.scene.downloadButton.baseScale = buttonScale;
			this.scene.downloadText.baseScale = textScale / 12;

			// Store footer height
			this.scene.footerHeight = this.scene.footerImage.displayHeight;
		};

		// Initial draw
		drawFooter();

		// Redraw on resize
		this.scene.scale.on("resize", drawFooter, this);

		// Pulse animations
		this.startPulseTween(
			this.scene.downloadButton,
			() => this.scene.downloadButton.baseScale
		);
		this.startPulseTween(
			this.scene.downloadText,
			() => this.scene.downloadText.baseScale
		);
	}

	startPulseTween(target, getBaseScale) {
		if (target.pulseTween) return;

		target.pulseTween = this.scene.tweens.add({
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

	createMainScene() {
		this.scene.mainSceneBg = this.scene.add
			.image(0, 0, "busWithTrack")
			.setOrigin(0.5);
		this.scene.mainSceneBg.setDepth(-1);

		const drawMainScene = () => {
			const { width: canvasWidth, height: canvasHeight } = this.scene.scale;

			const navHeight = this.scene.navbarHeight || 50;
			const footerHeight = this.scene.footerImage?.displayHeight || 100;

			const availableHeight = canvasHeight - navHeight - footerHeight;

			const scaleX = canvasWidth / this.scene.mainSceneBg.width;
			const scaleY = availableHeight / this.scene.mainSceneBg.height;

			const minScale = 0.6;

			let scale = Math.min(scaleX, scaleY);
			scale = Math.max(scale, minScale);

			this.scene.mainSceneBg.setScale(scale);

			this.scene.mainSceneBg.x = canvasWidth / 2;
			this.scene.mainSceneBg.y = navHeight + availableHeight / 2;
		};

		// Initial draw
		drawMainScene();

		// Redraw on resize
		this.scene.scale.on("resize", drawMainScene, this.scene);
	}

	createDownloadBtn() {
		const { width, height } = this.scene.sys.game.canvas;

		const downloadBtn = this.scene.add
			.image(width / 2, height - this.scene.footerHeight / 2 - 80, "button")
			.setOrigin(0.5)
			.setScale(0.7)
			.setDepth(10001)
			.setInteractive();

		const downloadText = this.scene.add
			.text(width / 2, height - this.scene.footerHeight / 2 - 80, "DOWNLOAD", {
				fontFamily: "MADE Tommy Soft",
				fontSize: "24px",
				color: "#ffffff",
				fontStyle: "bold",
				align: "center",
				stroke: "#000000",
				strokeThickness: 2,
			})
			.setOrigin(0.5)
			.setDepth(10002)
			.setOrigin(0.5);

		this.scene.tweens.add({
			targets: [downloadBtn, downloadText],
			scaleX: { from: 0.7, to: 0.78 },
			scaleY: { from: 0.7, to: 0.78 },
			yoyo: true,
			repeat: -1,
			duration: 1200,
			ease: "Sine.easeInOut",
		});

		this.scene.tweens.add({
			targets: [downloadBtn, downloadText],
			y: "+=8",
			yoyo: true,
			repeat: -1,
			duration: 1800,
			ease: "Sine.easeInOut",
		});

		// Add a glow effect to the button text for a modern look
		downloadText.setShadow(0, 0, "#00ffff", 16, true, true);
	}

	loadModels() {
		const robotModelRef = this.scene.loadedModels.Robot.object;
		if (!robotModelRef) {
			console.error("Robot model not loaded or missing object");
			return;
		}

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

		this.scene.robots = robotPositions.map(({ seat, position }) => {
			const cell = this.scene.grid.getCell(position[0], position[1]);
			const robotModel = new Robot(robotModelRef);
			robotModel.attachTo(cell, this.scene.threeScene, undefined, seat);
			return robotModel;
		});
	}
}
