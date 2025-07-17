import * as Phaser from "../phaser/phaser-3.87.0-core.js";
import * as THREE from "three";

import { adStart, onCtaPressed, onAudioVolumeChange } from "../networkPlugin";
export class Game extends Phaser.Scene {
	constructor() {
		super("Game");

		this.totalRows = 6;
		this.totalCols = 4;
	}

	init() {
		console.log("%cSCENE::Game", "color: #fff; background: #f0f;");
		console.log("%cVerify Threen JS", "color: #fff; background: #f0f;", THREE);
	}

	/**
	 * This is required specially for Mintegral & MRAID networks.
	 * Do not remove if you are using those networks.
	 */
	adNetworkSetup() {
		adStart();

		// This is required for MRAID networks, you can remove if you are not using MRAID
		onAudioVolumeChange(this.scene);
	}

	createNavbar() {
		const barHeight = 50;

		// nav background
		this.navbarBg = this.add.graphics();

		// centered text
		this.navbarText = this.add.text(
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
			const canvasWidth = this.scale.width;

			// Calculate font size
			let fontSize = Math.max(16, Math.min(64, Math.floor(canvasWidth * 0.05)));
			this.navbarText.setStyle({ fontSize: `${fontSize}px` });
			while (this.navbarText.width > canvasWidth * 0.9 && fontSize > 10) {
				fontSize -= 1;
				this.navbarText.setStyle({ fontSize: `${fontSize}px` });
			}

			// Calculate nav height
			const dynamicBarHeight = Math.max(50, this.navbarText.height + 20);

			// Draw background bar
			this.navbarBg.clear();
			this.navbarBg.fillStyle(0x000000, 1);
			this.navbarBg.fillRect(0, 0, canvasWidth, dynamicBarHeight);

			// Center the text horizontally and vertically
			this.navbarText.x = canvasWidth / 2 - this.navbarText.width / 2;
			this.navbarText.y = dynamicBarHeight / 2 - this.navbarText.height / 2;

			// Store nav height
			this.navbarHeight = dynamicBarHeight;
		};

		drawNavbar();

		// Redraw on resize
		this.scale.on("resize", drawNavbar, this);
	}

	createFooter() {
		this.footerImage = this.add.image(0, 0, "footer").setOrigin(0.5, 1);
		this.downloadButton = this.add.image(0, 0, "button").setOrigin(0.5);
		this.downloadText = this.add
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
			const { width: canvasWidth, height: canvasHeight } = this.scale;

			// Footer scaling
			const scaleX = canvasWidth / this.footerImage.width;
			const scaleY = canvasWidth < 650 ? scaleX * 2.1 : scaleX;
			this.footerImage.setScale(scaleX, scaleY);
			this.footerImage.setPosition(canvasWidth / 2, canvasHeight);

			// Download Button scaling
			const footerWidth = this.footerImage.displayWidth;
			const footerHeight = this.footerImage.displayHeight;
			const buttonTargetHeight = footerHeight * 0.61;
			const buttonScale = buttonTargetHeight / this.downloadButton.height;

			const buttonPadding = 20 * buttonScale;
			this.downloadButton.setScale(buttonScale);
			this.downloadButton.setPosition(
				this.footerImage.x +
					footerWidth / 2 -
					this.downloadButton.displayWidth / 2 -
					5 * 20 * buttonScale,
				this.footerImage.y - footerHeight / 2 + 20 * buttonScale
			);

			// Text scaling
			const textScale = Math.max(buttonTargetHeight * 0.2, 12);
			this.downloadText.setFontSize(textScale);
			this.downloadText.setPosition(
				this.downloadButton.x,
				this.downloadButton.y
			);

			// Store base scale for tweening
			this.downloadButton.baseScale = buttonScale;
			this.downloadText.baseScale = textScale / 12;

			// Store footer height
			this.footerHeight = this.footerImage.displayHeight;
		};

		// Initial draw
		drawFooter();

		// Redraw on resize
		this.scale.on("resize", drawFooter, this);

		// Pulse animations
		this.startPulseTween(
			this.downloadButton,
			() => this.downloadButton.baseScale
		);
		this.startPulseTween(this.downloadText, () => this.downloadText.baseScale);
	}

	startPulseTween(target, getBaseScale) {
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

	createMovesBox() {
		// Moves box and text
		this.movesBox = this.add.image(0, 0, "movesBox").setOrigin(1, 0);
		this.moveCountText = this.add
			.text(0, 0, "7", {
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
			const canvasWidth = this.scale.width;
			const navBarHeight = this.navbarHeight || 50;

			// Moves box scaling
			const boxScale = canvasWidth < 450 ? 0.33 : 0.7;
			this.movesBox.setScale(boxScale);

			// Position: top-right under navbar
			this.movesBox.x = canvasWidth;
			this.movesBox.y = navBarHeight + padding;

			// Responsive font size
			const maxFontSize = this.movesBox.displayHeight * 0.5;
			const finalFontSize = Math.min(40, maxFontSize);

			this.moveCountText.setStyle({
				fontSize: `${Math.floor(finalFontSize)}px`,
			});

			// Center text inside box
			this.moveCountText.setPosition(
				this.movesBox.x - this.movesBox.displayWidth / 2 + 15,
				this.movesBox.y + this.movesBox.displayHeight / 2
			);
		};

		// Initial draw
		drawMovesBox();

		// Redraw on resize
		this.scale.on("resize", drawMovesBox, this);
	}

	createMainScene() {
		this.mainSceneBg = this.add.image(0, 0, "busWithTrack").setOrigin(0.5);
		this.mainSceneBg.setDepth(-1);

		const drawMainScene = () => {
			const { width: canvasWidth, height: canvasHeight } = this.scale;

			const navHeight = this.navbarHeight || 50;
			const footerHeight = this.footerImage?.displayHeight || 100;

			const availableHeight = canvasHeight - navHeight - footerHeight;

			const scaleX = canvasWidth / this.mainSceneBg.width;
			const scaleY = availableHeight / this.mainSceneBg.height;

			const minScale = 0.6;

			let scale = Math.min(scaleX, scaleY);
			scale = Math.max(scale, minScale);

			this.mainSceneBg.setScale(scale);

			this.mainSceneBg.x = canvasWidth / 2;
			this.mainSceneBg.y = navHeight + availableHeight / 2;
		};

		// Initial draw
		drawMainScene();

		// Redraw on resize
		this.scale.on("resize", drawMainScene, this);
	}

	createInvisibleGrid() {
		const cellWidth = 55;
		const cellHeight = 40;
		const gridCells = [];

		const drawGrid = () => {
			gridCells.forEach((cell) => cell.destroy());
			gridCells.length = 0;

			const imgWidth = this.mainSceneBg.displayWidth;
			const imgHeight = this.mainSceneBg.displayHeight;

			const rows = Math.floor(imgHeight / cellHeight);
			const cols = Math.floor(imgWidth / cellWidth);

			const startX = this.mainSceneBg.x - imgWidth / 2 + 105;
			const startY = this.mainSceneBg.y - imgHeight / 2 + 205;

			for (let row = 0; row < this.totalRows; row++) {
				for (let col = 0; col < this.totalCols; col++) {
					const x = startX + col * cellWidth + cellWidth / 2;
					const y = startY + row * cellHeight + cellHeight / 2;

					const cell = this.add.rectangle(
						x,
						y,
						cellWidth,
						cellHeight,
						0xff0000,
						0.2
					);
					cell.setStrokeStyle(1, 0xff0000);
					cell.setInteractive();

					gridCells.push(cell);
				}
			}
		};

		// Initial Draw
		drawGrid();

		// Redraw on resize
		this.scale.on("resize", drawGrid, this);
	}

	initializeScene() {
		this.createNavbar();
		this.createMovesBox();
		this.createMainScene();
		this.createInvisibleGrid();
		this.createFooter();
	}

	create() {
		this.adNetworkSetup();

		this.initializeScene();

		this.input.on("pointerdown", () => {
			this.sound.play("sound_fx");
			onCtaPressed();
		});
	}
}
