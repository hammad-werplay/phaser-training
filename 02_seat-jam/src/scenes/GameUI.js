import * as THREE from "three";
import { Robot } from "./Robot";
import { Utils } from "./Utils";

let mainSceneBgScaleX;
let mainSceneBgScaleY;
let mainSceneBgX;
let mainSceneBgY;

export class GameUI {
	constructor(scene) {
		this.scene = scene;
		this.scene.navHeight = 100;
		this.totalRows = 6;
		this.totalCols = 4;
	}

	createNavbar() {
		const config = this.scene.sys.game.config;
		const width = config.width;
		const height = 50;

		// Create a semi-transparent rectangle for the navbar
		this.scene.navbar = this.scene.add.rectangle(
			0,
			0,
			width,
			height,
			0x000000,
			1
		);
		this.scene.navbar.setOrigin(0, 0);

		// Add a text label to the navbar
		const textStyle = {
			font: "16px sans-serif",
			fill: "#fff",
			align: "center",
			fontStyle: "bold",
		};
		const text = "Can You Pass This level in 7 Moves?";
		this.scene.navText = this.scene.add.text(
			width / 2,
			height / 2,
			text,
			textStyle
		);
		this.scene.navText.setOrigin(0.5, 0.5);
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
		// this.scene.scale.on("resize", drawMainScene, this.scene);
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

		const robotPositions = Utils.createGameScenario();

		if (this.scene.robots) {
			// Clean up existing robots
			this.scene.robots.forEach((robot) => {
				if (robot && robot.robot) {
					this.scene.threeScene.remove(robot.robot);
				}
				if (robot && robot.nameLabel) {
					this.scene.threeScene.remove(robot.nameLabel);
				}
				if (robot && robot.robotLabel) {
					robot.robotLabel = null;
				}
			});
			this.scene.robots = [];
		}

		this.scene.robots = robotPositions.map(({ seat, position }) => {
			const [row, col] = position;
			const cell = this.scene.grid.getCell(row, col);
			const robotModel = new Robot(robotModelRef);
			robotModel.attachTo(cell, this.scene.threeScene, undefined, seat);
			return robotModel;
		});
	}

	showCorrectSeatLabelImage(
		image,
		startScaleFactor = 0.7,
		endScaleFactor = 1.4
	) {
		const config = this.scene.sys.game.config;
		const aspectRatio = config.width / config.height;
		if (aspectRatio > 0.6) {
			startScaleFactor = startScaleFactor * 1.7;
			endScaleFactor = endScaleFactor * 1.7;
		}

		let imageTexture;

		if (this.scene.textures.exists(image)) {
			const src = this.scene.textures.get(image).getSourceImage().src;
			imageTexture = new THREE.TextureLoader().load(src);
		} else {
			console.error(`${image} texture not found in Phaser cache`);
			return;
		}

		// Color space conversion rgb
		imageTexture.colorSpace = THREE.SRGBColorSpace;

		const imageMaterial = new THREE.SpriteMaterial({
			map: imageTexture,
			transparent: true,
			depthTest: false,
			depthWrite: false,
			opacity: 1,
		});

		const imageSprite = new THREE.Sprite(imageMaterial);

		// Make the image big and centered above the boxes at the top
		// We'll estimate the grid center and place the image above it, high up
		const boxes = this.scene.invisibleBoxes;
		if (!boxes || boxes.length === 0) {
			console.error(
				"No invisible boxes found for positioning the label image."
			);
			return;
		}

		// Find grid bounds
		let minX = Infinity,
			maxX = -Infinity,
			minZ = Infinity,
			maxZ = -Infinity;
		for (const box of boxes) {
			const pos = box.position;
			if (pos.x < minX) minX = pos.x;
			if (pos.x > maxX) maxX = pos.x;
			if (pos.z < minZ) minZ = pos.z;
			if (pos.z > maxZ) maxZ = pos.z;
		}
		const centerX = (minX + maxX) / 2;
		const centerZ = (minZ + maxZ) / 2;

		// Place the image above the grid, at the center, and high up
		imageSprite.position.set(centerX, 0, centerZ - 1.1);

		// Make the image big
		const bigScale = 2.8;
		imageSprite.scale.set(bigScale * 3.8, bigScale * 0.4, bigScale * 0.8);

		// Always face the camera
		imageSprite.onBeforeRender = (renderer, scene, camera) => {
			imageSprite.quaternion.copy(camera.quaternion);
		};

		this.scene.threeScene.add(imageSprite);

		// Animate: fade in, hold, fade out, then remove
		let elapsed = 0;
		let phase = 0; // 0: fade in, 1: hold, 2: fade out
		const fadeInDuration = 300;
		const holdDuration = 700;
		const fadeOutDuration = 800;
		const startScale = startScaleFactor;
		const endScale = endScaleFactor;

		imageSprite.scale.set(startScale, startScale * 0.5, startScale);

		const animateImage = (time, delta) => {
			// delta is in ms
			elapsed += delta;
			if (phase === 0) {
				// Fade in
				const t = Math.min(elapsed / fadeInDuration, 1);
				imageSprite.material.opacity = t;
				const scale = startScale + (endScale - startScale) * t;
				const xScale = scale * 1.6;
				const yScale = scale * 0.4;
				const zScale = scale * 0.8;
				imageSprite.scale.set(xScale, yScale, zScale);
				if (t >= 1) {
					phase = 1;
					elapsed = 0;
				}
			} else if (phase === 1) {
				// Hold
				imageSprite.material.opacity = 1;
				const scale = endScale;
				const xScale = scale * 1.6;
				const yScale = scale * 0.4;
				const zScale = scale * 0.8;
				imageSprite.scale.set(xScale, yScale, zScale);
				if (elapsed >= holdDuration) {
					phase = 2;
					elapsed = 0;
				}
			} else if (phase === 2) {
				// Fade out
				const t = Math.min(elapsed / fadeOutDuration, 1);
				imageSprite.material.opacity = 1 - t;
				const scale = endScale - (endScale - startScale) * t;
				const xScale = scale * 1.6;
				const yScale = scale * 0.4;
				const zScale = scale * 0.8;
				imageSprite.scale.set(xScale, yScale, zScale);
				if (t >= 1) {
					this.scene.threeScene.remove(imageSprite);
					imageSprite.material.dispose();
					imageTexture.dispose();
					this.scene.events.off("update", animateImage);
				}
			}
		};

		// Listen to the scene's update event (Phaser's event emitter)
		this.scene.events.on("update", animateImage);
	}

	ResizeLandscape(config) {
		console.log("Resize Landscape", config);

		// Main Scene
		if (this.scene.mainSceneBg) {
			// Scale
			mainSceneBgScaleX = config.width / this.scene.mainSceneBg.width;
			mainSceneBgScaleY = config.height / this.scene.mainSceneBg.height;
			const minScale = 0.6;
			let scale = Math.min(mainSceneBgScaleX, mainSceneBgScaleY);
			scale = Math.max(scale, minScale);
			this.scene.mainSceneBg.setScale(scale);

			// Position
			const navHeight = this.scene.navbarHeight || 50;
			const footerHeight = this.scene.footerImage?.displayHeight || 100;
			const availableHeight = config.height - navHeight - footerHeight;
			mainSceneBgX = config.width / 2;
			mainSceneBgY = navHeight + availableHeight / 2;
			this.scene.mainSceneBg.setPosition(mainSceneBgX, mainSceneBgY);
		}

		// Navbar
		if (this.scene.navbarBg) {
			const canvasWidth = config.width;
			const dynamicBarHeight = Math.max(50, this.scene.navbarText.height + 20);

			// Fix at the top
			const navBarX = 0;
			const navBarY = 0;
			// this.scene.navbarBg.setPosition(navBarX, navBarY);
			this.scene.navbarBg.setSize(canvasWidth, dynamicBarHeight);

			console.log("Navbar resized:", this.scene.navbarBg);

			// Font size
			let fontSize = Math.max(16, Math.min(64, Math.floor(canvasWidth * 0.05)));
			this.scene.navbarText.setStyle({ fontSize: `${fontSize}px` });
			while (this.scene.navbarText.width > canvasWidth * 0.9 && fontSize > 10) {
				fontSize -= 1;
				this.scene.navbarText.setStyle({ fontSize: `${fontSize}px` });
			}
		}

		if (this.scene.navbar) {
			const width = config.width;
			const height = 50;
			this.scene.navbar.setSize(width, height);
			this.scene.navbar.setPosition(0, 0);
		}

		if (this.scene.navText) {
			const width = config.width;
			this.scene.navText.setPosition(width / 2, 25);
			this.scene.navText.setStyle({ fontSize: "24px" });
		}

		if (this.scene.movesBox) {
			const padding = 10;
			const navbarHeight = this.scene.navHeight;
			const canvasWidth = config.width;

			this.scene.movesBox.x = canvasWidth;
			this.scene.movesBox.y = navbarHeight + padding;

			this.scene.moveCountText.setPosition(
				this.scene.movesBox.x - this.scene.movesBox.displayWidth / 2 + 15,
				this.scene.movesBox.y + this.scene.movesBox.displayHeight / 2
			);
		}
	}

	ResizePortrait(config) {
		console.log("Resize Portrait", config);

		let aspectRatio = config.width / config.height;

		// Main Scene
		if (this.scene.mainSceneBg) {
			if (aspectRatio < 0.6) {
				// Scale
				mainSceneBgScaleX = 2.2;
				mainSceneBgScaleY = 2.2;
				const minScale = 0.6;
				let scale = Math.min(mainSceneBgScaleX, mainSceneBgScaleY);
				scale = Math.max(scale, minScale);
				this.scene.mainSceneBg.setScale(scale);

				// Position
				const navHeight = this.scene.navbarHeight || 50;
				const footerHeight = this.scene.footerImage?.displayHeight || 100;
				const availableHeight = config.height - navHeight - footerHeight;
				mainSceneBgX = config.width / 2;
				mainSceneBgY = navHeight + availableHeight / 2;
				this.scene.mainSceneBg.setPosition(mainSceneBgX, mainSceneBgY);
			} else {
				// Scale
				mainSceneBgScaleX = config.width / this.scene.mainSceneBg.width;
				mainSceneBgScaleY = config.height / this.scene.mainSceneBg.height;
				const minScale = 0.6;
				let scale = Math.min(mainSceneBgScaleX, mainSceneBgScaleY);
				scale = Math.max(scale, minScale);
				this.scene.mainSceneBg.setScale(scale);

				// Position
				const navHeight = this.scene.navbarHeight || 50;
				const footerHeight = this.scene.footerImage?.displayHeight || 100;
				const availableHeight = config.height - navHeight - footerHeight;
				mainSceneBgX = config.width / 2;
				mainSceneBgY = navHeight + availableHeight / 2;
				this.scene.mainSceneBg.setPosition(mainSceneBgX, mainSceneBgY);
			}
		}

		// Navbar
		if (this.scene.navbarBg) {
			const canvasWidth = config.width;
			const dynamicBarHeight = Math.max(50, this.scene.navbarText.height + 20);

			// Fix at the top
			const navBarX = 0;
			const navBarY = 0;
			// this.scene.navbarBg.setPosition(navBarX, navBarY);
			this.scene.navbarBg.setSize(canvasWidth, dynamicBarHeight);

			console.log("Navbar resized:", this.scene.navbarBg);

			// Font size
			let fontSize = Math.max(16, Math.min(64, Math.floor(canvasWidth * 0.05)));
			this.scene.navbarText.setStyle({ fontSize: `${fontSize}px` });
			while (this.scene.navbarText.width > canvasWidth * 0.9 && fontSize > 10) {
				fontSize -= 1;
				this.scene.navbarText.setStyle({ fontSize: `${fontSize}px` });
			}
		}

		if (this.scene.navbar) {
			const width = config.width;
			let height = 100;

			this.scene.navHeight = height;
			this.scene.navbar.setSize(width, height);
			this.scene.navbar.setPosition(0, 0);
		}

		if (this.scene.navText) {
			const width = config.width;
			this.scene.navText.setPosition(width / 2, this.scene.navHeight / 2);
			this.scene.navText.setStyle({ fontSize: "64px" });
		}

		if (this.scene.movesBox) {
			const padding = 30;
			const navbarHeight = this.scene.navHeight;
			const canvasWidth = config.width;

			this.scene.movesBox.x = canvasWidth;
			this.scene.movesBox.y = navbarHeight + padding;

			this.scene.moveCountText.setPosition(
				this.scene.movesBox.x - this.scene.movesBox.displayWidth / 2 + 15,
				this.scene.movesBox.y + this.scene.movesBox.displayHeight / 2
			);
		}
	}
}
