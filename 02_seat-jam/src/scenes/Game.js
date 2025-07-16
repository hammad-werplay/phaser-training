import * as Phaser from "../phaser/phaser-3.87.0-core.js";
import * as THREE from "three";

import { adStart, onCtaPressed, onAudioVolumeChange } from "../networkPlugin";
export class Game extends Phaser.Scene {
	constructor() {
		super("Game");
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
			const canvasWidth = this.scale.width;
			const canvasHeight = this.scale.height;

			const scaleX = canvasWidth / this.footerImage.width;
			let scaleY;

			if (canvasWidth < 650) {
				scaleY = scaleX * 2.1;
			} else {
				scaleY = scaleX;
			}

			this.footerImage.setScale(scaleX, scaleY);

			this.footerImage.x = canvasWidth / 2;
			this.footerImage.y = canvasHeight;

			// Download Button
			const footerWidth = this.footerImage.displayWidth;
			const footerHeight = this.footerImage.displayHeight;
			const buttonTargetHeight = footerHeight * 0.61;
			const buttonScale = buttonTargetHeight / this.downloadButton.height;
			this.downloadButton.setScale(buttonScale);

			// Position the download button at right side of the footer
			const buttonPadding = 20 * buttonScale;
			this.downloadButton.x =
				this.footerImage.x +
				footerWidth / 2 -
				this.downloadButton.displayWidth / 2 -
				buttonPadding * 5;
			this.downloadButton.y =
				this.footerImage.y - footerHeight / 2 + buttonPadding;

			// 🔠 Responsive text sizing
			const textScale = Math.max(buttonTargetHeight * 0.2, 12);
			this.downloadText.setFontSize(textScale);
			this.downloadText.setPosition(
				this.downloadButton.x,
				this.downloadButton.y
			);

			this.downloadButton.baseScale = buttonScale;
			this.downloadText.baseScale = textScale / 12;
		};

		drawFooter();

		// 🟡 BUTTON PULSE
		if (!this.downloadButton.pulseTween) {
			this.downloadButton.pulseTween = this.tweens.add({
				targets: this.downloadButton,
				scaleX: {
					getStart: () => this.downloadButton.baseScale,
					getEnd: () => this.downloadButton.baseScale * 1.12,
				},
				scaleY: {
					getStart: () => this.downloadButton.baseScale,
					getEnd: () => this.downloadButton.baseScale * 1.12,
				},
				yoyo: true,
				repeat: -1,
				duration: 500,
				ease: "Sine.easeInOut",
			});
		}

		// 🟣 TEXT PULSE
		if (!this.downloadText.pulseTween) {
			this.downloadText.pulseTween = this.tweens.add({
				targets: this.downloadText,
				scaleX: {
					getStart: () => this.downloadText.baseScale,
					getEnd: () => this.downloadText.baseScale * 1.12,
				},
				scaleY: {
					getStart: () => this.downloadText.baseScale,
					getEnd: () => this.downloadText.baseScale * 1.12,
				},
				yoyo: true,
				repeat: -1,
				duration: 500,
				ease: "Sine.easeInOut",
			});
		}

		// Redraw on resize
		this.scale.on("resize", drawFooter, this);
	}

	initializeScene() {
		this.createNavbar();

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
