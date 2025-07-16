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

		const drawFooter = () => {
			const canvasWidth = this.scale.width;
			const canvasHeight = this.scale.height;

			const scaleX = canvasWidth / this.footerImage.width;
			let scaleY;

			if (canvasWidth < 600) {
				scaleY = scaleX * 2.2;
			} else {
				scaleY = scaleX;
			}

			this.footerImage.setScale(scaleX, scaleY);

			this.footerImage.x = canvasWidth / 2;
			this.footerImage.y = canvasHeight;
		};

		drawFooter();

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
