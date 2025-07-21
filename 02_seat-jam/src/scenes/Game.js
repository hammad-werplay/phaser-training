import * as Phaser from "../phaser/phaser-3.87.0-core.js";
import * as THREE from "three";
import GUI from "lil-gui";

import { adStart, onCtaPressed, onAudioVolumeChange } from "../networkPlugin";
import { Grid, PathFinder } from "./Mechanics.js";
export class Game extends Phaser.Scene {
	constructor() {
		super("Game");

		this.totalRows = 6;
		this.totalCols = 4;
		this.seats = [
			[1, 1],
			[1, 2],
			[2, 1],
			[2, 2],
			[3, 1],
			[3, 2],
			[4, 1],
			[4, 2],
		];
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
		const CELL_WIDTH = 55;
		const CELL_HEIGHT = 40;
		const OFFSET_X = 105;
		const OFFSET_Y = 205;
		const gridCells = [];

		this.grid = new Grid(this.totalRows, this.totalCols, this.seats);
		this.pathFinder = new PathFinder(this.grid);
		this.selectedCell = null;

		const drawGrid = () => {
			gridCells.forEach((cell) => cell.destroy());
			gridCells.length = 0;

			const imgWidth = this.mainSceneBg.displayWidth;
			const imgHeight = this.mainSceneBg.displayHeight;

			const rows = Math.floor(imgHeight / CELL_HEIGHT);
			const cols = Math.floor(imgWidth / CELL_WIDTH);

			const startX = this.mainSceneBg.x - imgWidth / 2 + OFFSET_X;
			const startY = this.mainSceneBg.y - imgHeight / 2 + OFFSET_Y;

			for (let row = 0; row < this.totalRows; row++) {
				for (let col = 0; col < this.totalCols; col++) {
					const logicCell = this.grid.getCell(row, col);

					const x = startX + col * CELL_WIDTH + CELL_WIDTH / 2;
					const y = startY + row * CELL_HEIGHT + CELL_HEIGHT / 2;

					const cellRect = this.add.rectangle(x, y, CELL_WIDTH, CELL_HEIGHT);
					cellRect.setInteractive();
					cellRect.setStrokeStyle(1, 0xff0000);
					cellRect.setFillStyle(
						logicCell.type === "seat" ? 0x00ff00 : 0x000000,
						0.2
					);

					logicCell.visual = cellRect;

					cellRect.on("pointerdown", () => {
						if (!this.selectedCell) {
							this.selectedCell = logicCell;
							this.selectedCell.visual.setFillStyle(0x00ff00, 0.5);
							return;
						}

						if (this.selectedCell.key() === logicCell.key()) {
							this.selectedCell.visual.setFillStyle(0x000000, 0.2);
							this.selectedCell = null;
							return;
						}

						const start = this.selectedCell;
						const end = logicCell;

						const path = this.pathFinder.findShortestPath(start, end);

						if (!path) {
							console.error("No path found");
							this.selectedCell = null;
							return;
						}

						this.movePlayerAlongPath(path);

						this.selectedCell = null;
					});

					gridCells.push(cellRect);
				}
			}
		};

		// Initial Draw
		drawGrid();

		// Redraw on resize
		this.scale.on("resize", drawGrid, this);
	}

	movePlayerAlongPath(path) {
		if (!path || path.length === 0) {
			console.error("No path found");
			return;
		}

		console.log("Path:", path);

		let index = 0;
		let previousCell = null;

		const interval = setInterval(() => {
			if (index >= path.length) {
				clearInterval(interval);
				return;
			}

			const cell = path[index];

			if (previousCell && previousCell.visual) {
				console.log("Prev Cell:", previousCell);
				previousCell.visual.setFillStyle(0x000000, 0.2);
			}

			if (cell.visual) {
				console.log("Curr Cell:", cell);
				cell.visual.setFillStyle(0x00ff00, 0.5);
			}

			if (index === path.length - 1) {
				clearInterval(interval);

				setTimeout(() => {
					cell.isBlocked = true;
				}, 500);
			}

			previousCell = cell;
			index++;
		}, 500);
	}

	initializeScene() {
		this.createNavbar();
		this.createMovesBox();
		this.createMainScene();
		this.createInvisibleGrid();
		this.createFooter();
	}

	loadModels() {
		const robotModel = this.loadedModels.Robot.object;
		if (!robotModel) {
			console.error("Robot model not loaded or missing object");
			return;
		}

		robotModel.scale.set(0.001, 0.001, 0.001);
		robotModel.position.set(-0.6, 3, 0);
		this.threeScene.add(robotModel);
	}

	setupThreeJS() {
		// Canvas for ThreeJS
		this.threeCanvas = document.createElement("canvas");
		this.threeCanvas.style.position = "absolute";
		this.threeCanvas.style.top = "0";
		this.threeCanvas.style.left = "0";
		this.threeCanvas.style.zIndex = "1";
		this.threeCanvas.style.pointerEvents = "none";
		this.threeCanvas.style.backgroundColor = "rgba(0,255,0,0.1)";
		document.body.appendChild(this.threeCanvas);

		// Camera Setup
		const setupCamera = () => {
			const aspect = window.innerWidth / window.innerHeight;
			const frustumHeight = 5;
			const frustumWidth = frustumHeight * aspect;
			this.camera = new THREE.OrthographicCamera(
				-frustumWidth / 2,
				frustumWidth / 2,
				frustumHeight / 2,
				-frustumHeight / 2,
				0.1,
				1000
			);
			this.camera.position.set(0, 19, 5);
			this.camera.lookAt(0, 0.5, 0);
			this.camera.updateProjectionMatrix();

			if (this.threeRenderer) {
				this.threeRenderer.setSize(window.innerWidth, window.innerHeight);
			}
		};

		setupCamera();

		// ThreeJS Scene
		this.threeScene = new THREE.Scene();

		// Setup Lights
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
		const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
		directionalLight.position.set(3, 10, 5);

		this.threeScene.add(ambientLight, directionalLight);

		// Setup Raycaster for Click Detection
		this.raycaster = new THREE.Raycaster();
		this.pointer = new THREE.Vector2();

		// Remove old debug box if exists
		if (this.boundingBoxHelper) {
			this.threeScene.remove(this.boundingBoxHelper);
		}

		// ThreeJS Renderer
		this.threeRenderer = new THREE.WebGLRenderer({
			canvas: this.threeCanvas,
			alpha: true,
		});
		this.threeRenderer.setSize(window.innerWidth, window.innerHeight);
		this.threeRenderer.setPixelRatio(window.devicePixelRatio);
		this.isRenderingThree = true;

		window.addEventListener("resize", setupCamera, false);
	}

	setupAnimations() {
		const robot = this.loadedModels.Robot.object;
		if (!robot) {
			console.error("Robot model not loaded");
			return;
		}

		// Animation setup
		this.mixer = new THREE.AnimationMixer(robot);
		this.animationsByName = {};

		robot.animations.forEach((clip) => {
			const action = this.mixer.clipAction(clip);
			this.animationsByName[clip.name] = action;
		});
	}

	playAnimation(name) {
		const action = this.animationsByName[name];
		if (!action) {
			console.warn("Animation not found:", name);
			return;
		}

		// Stop all others
		Object.values(this.animationsByName).forEach((a) => {
			if (a !== action) a.stop();
		});

		action.reset().play();
	}

	create() {
		this.adNetworkSetup();

		this.loadedModels = this.registry.get("loadedModels");

		this.initializeScene();
		this.setupThreeJS();
		this.loadModels();
		this.setupAnimations();
		this.playAnimation("RobotArmature|Robot_Dance");

		// Debug
		const gui = new GUI();
		const robotModel = this.loadedModels.Robot.object;

		const robotFolder = gui.addFolder("Robot Position");
		robotFolder.add(robotModel.position, "x").listen();
		robotFolder.add(robotModel.position, "y").listen();
		robotFolder.add(robotModel.position, "z").listen();
		robotFolder.open();
		const cameraFolder = gui.addFolder("Camera");
		cameraFolder.add(this.camera.position, "x").listen();
		cameraFolder.add(this.camera.position, "y").listen();
		cameraFolder.add(this.camera.position, "z").listen();
		cameraFolder.open();

		this.input.on("pointerdown", () => {
			this.sound.play("sound_fx");
			onCtaPressed();
		});
	}

	update() {
		if (this.threeRenderer) {
			this.threeRenderer.render(this.threeScene, this.camera);
			if (this.mixer) {
				this.mixer.update(this.game.loop.delta / 1000);
			}
		}
	}
}
