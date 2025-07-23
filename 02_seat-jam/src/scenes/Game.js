import * as Phaser from "../phaser/phaser-3.87.0-core.js";
import * as THREE from "three";
import GUI from "lil-gui";

import { adStart, onCtaPressed, onAudioVolumeChange } from "../networkPlugin";
import { Grid, PathFinder } from "./Mechanics.js";
import { Robot } from "./Robot.js";
export class Game extends Phaser.Scene {
	constructor() {
		super("Game");

		this.movesLeft = 7;
		this.startCell;
		this.totalRows = 6;
		this.totalCols = 4;
		this.seats = {
			A1: [4, 1],
			A2: [3, 1],
			A3: [2, 1],
			A4: [1, 1],
			B1: [4, 2],
			B2: [3, 2],
			B3: [2, 2],
			B4: [1, 2],
		};
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
			const scaleY = scaleX;
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
			.text(0, 0, this.movesLeft, {
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
		this.grid = new Grid(this.totalRows, this.totalCols, this.seats);
		this.pathFinder = new PathFinder(this.grid);
		this.invisibleBoxes = [];
		const boxSize = 1;
		const bg = this.mainSceneBg;

		const drawGrid = () => {
			this.invisibleBoxes.forEach((box) => {
				this.threeScene.remove(box);
				box.geometry.dispose();
				box.material.dispose();
			});
			this.invisibleBoxes = [];

			const cellWidth = 0.41;
			const cellHeight = 0.31;

			const gridWidth = this.totalCols * cellWidth - 0.43;
			const gridHeight =
				this.totalRows * cellHeight -
				(this.scale.width < 500 ? 0.4 : this.scale.width > 1000 ? 0.14 : 0.28);

			const startingPositions = {
				x: -gridWidth / 2,
				y: 0,
				z: -gridHeight / 2,
			};

			for (let row = 0; row < this.totalRows; row++) {
				for (let col = 0; col < this.totalCols; col++) {
					const logicBox = this.grid.getCell(row, col);

					// Create a transparent box (Mesh)
					const geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
					const material = new THREE.MeshBasicMaterial({
						color: 0xff0000,
						transparent: true,
						opacity: 0,
					});

					const box = new THREE.Mesh(geometry, material);
					box.position.set(
						startingPositions.x + col * cellWidth,
						0,
						startingPositions.z + row * cellHeight
					);
					box.scale.set(0.39, 0.025, 0.29);
					box.userData = { row, col };

					logicBox.visual = box;
					logicBox.isBlocked = false;

					this.threeScene.add(box);
					this.invisibleBoxes.push(box);
				}
			}
		};

		// Initial Draw
		drawGrid();

		// Redraw on resize
		this.scale.on("resize", drawGrid, this);

		// Click on invisible boxes
		this.mouse = new THREE.Vector2();
		window.addEventListener("pointerdown", (event) => {
			const rect = this.threeCanvas.getBoundingClientRect();

			this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
			this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

			this.raycaster.setFromCamera(this.mouse, this.camera);

			const intersects = this.raycaster.intersectObjects(this.invisibleBoxes);

			if (intersects.length > 0) {
				const { row, col } = intersects[0].object.userData;
				const clickedBox = this.grid.getCell(row, col);

				if (!clickedBox.robot && !this.startCell) {
					return;
				}

				if (!this.startCell) {
					this.startCell = clickedBox;
					clickedBox.robotObject.playAnimation("RobotArmature|Robot_Yes");
					return;
				}

				const endCell = clickedBox;

				if (this.startCell.key() === endCell.key()) {
					this.startCell = null;
					return;
				}

				const start = this.startCell;
				const end = endCell;

				const path = this.pathFinder.findShortestPath(start, end);

				if (!path) {
					console.error("No path found");
					this.startCell.robotObject.playAnimation();

					// Add angry emotion from robot position
					const worldPos = this.startCell.robotObject.robot.position.clone();
					worldPos.y += 1.3;
					const screen = this.worldToScreen(
						worldPos,
						this.camera,
						this.threeRenderer.domElement
					);

					const angryImage = this.add.image(screen.x, screen.y, "angry");
					angryImage.setOrigin(0.5);
					angryImage.setScale(0.12);
					angryImage.setDepth(1000);
					this.tweens.add({
						targets: angryImage,
						alpha: { from: 0, to: 1 },
						scale: { from: 0, to: 0.13 },
						duration: 300,
						yoyo: true,
						hold: 400,
						ease: "Back.Out",
						onYoyo: () => {
							this.tweens.add({
								targets: angryImage,
								alpha: 0,
								scale: 0.1,
								duration: 800,
								ease: "Expo.easeIn",
								onComplete: () => angryImage.destroy(),
							});
						},
					});

					this.startCell = null;
					return;
				}

				this.movePlayerAlongPath(path, () => {
					this.startCell = null;
					end.robot = start.robot;
					end.robotObject = start.robotObject;
					start.robotObject.playAnimation();
					const cellToLookDown = this.grid.getCell(end.row + 1, end.col);
					end.robotObject.lookDown(cellToLookDown);

					if (end.type === "seat") {
						const cellToLookDown = this.grid.getCell(end.row + 1, end.col);
						end.robotObject.lookDown(cellToLookDown);
						end.robotObject.playAnimation("RobotArmature|Robot_Sitting");
						const isSeatCorrect = end.verifyCorrectSeatLabel();
						console.log("Seat verification:", isSeatCorrect);
						if (isSeatCorrect) {
							end.visual.material.color.set(0x00ff00);
							end.visual.material.opacity = 0.5;
						} else {
							end.visual.material.color.set(0xff0000);
							end.visual.material.opacity = 0.5;
						}
					}

					start.robot = null;
					start.robotObject = null;

					this.movesLeft--;
					this.moveCountText.setText(this.movesLeft.toString());
				});
			}
		});
	}

	worldToScreen(position, camera, rendererDom) {
		const projected = position.clone().project(camera);

		const width = rendererDom.clientWidth;
		const height = rendererDom.clientHeight;

		const x = ((projected.x + 1) / 2) * width;
		const y = ((-projected.y + 1) / 2) * height;

		return { x, y };
	}
	movePlayerAlongPath(path, onComplete) {
		if (!path || path.length === 0) {
			console.error("No path found");
			return;
		}

		const robotModel = path[0].robot;
		if (!robotModel) {
			console.error("Robot model not loaded or missing object");
			return;
		}

		let index = 0;
		let previousCell = null;
		const MOVE_DURATION = 350; // ms

		const getCellPosition = (cell) => {
			return new THREE.Vector3(
				cell.visual.position.x,
				cell.visual.position.y + 0.1,
				cell.visual.position.z
			);
		};

		const moveToCell = (fromCell, toCell, nextCell, onArrive) => {
			const startPos = getCellPosition(fromCell);
			const endPos = getCellPosition(toCell);
			const startTime = performance.now();

			const animate = (now) => {
				const elapsed = now - startTime;
				const t = Math.min(elapsed / MOVE_DURATION, 1);
				const ease = -(Math.cos(Math.PI * t) - 1) / 2; // easeInOutSine

				robotModel.position.lerpVectors(startPos, endPos, ease);

				// Smoothly rotate towards next cell if available
				if (nextCell) {
					const nextPos = getCellPosition(nextCell);
					const direction = nextPos
						.clone()
						.sub(robotModel.position)
						.normalize();
					const currentDir = robotModel.getWorldDirection(new THREE.Vector3());
					const lerpedDir = currentDir.lerp(direction, 0.15 * ease).normalize();
					const lookTarget = robotModel.position.clone().add(lerpedDir);
					robotModel.lookAt(lookTarget);
				}

				if (t < 1) {
					requestAnimationFrame(animate);
				} else {
					robotModel.position.copy(endPos);
					if (onArrive) onArrive();
				}
			};

			requestAnimationFrame(animate);
		};

		const step = () => {
			if (index >= path.length) {
				if (onComplete) onComplete();
				return;
			}

			const cell = path[index];
			const nextCell = path[index + 1];

			// Play walking animation
			if (cell.robotObject) {
				cell.robotObject.playAnimation("RobotArmature|Robot_Walking");
			}

			moveToCell(previousCell || cell, cell, nextCell, () => {
				previousCell = cell;
				index++;
				setTimeout(step, 30);
			});
		};

		step();
	}

	initializeScene() {
		this.createNavbar();
		this.createMovesBox();
		this.createMainScene();
		this.createInvisibleGrid();
		this.createFooter();
	}

	loadModels() {
		const robotModelRef = this.loadedModels.Robot.object;
		if (!robotModelRef) {
			console.error("Robot model not loaded or missing object");
			return;
		}

		const robotPositions = [
			[0, 0],
			[2, 0],
			[3, 0],
			[5, 0],
			[4, 1],
			[4, 2],
			[3, 3],
			[1, 2],
		];

		const availableSeats = Object.keys(this.seats);
		const shuffledSeats = availableSeats.sort(() => Math.random() - 0.5);

		this.robots = robotPositions.map(([row, col]) => {
			const cell = this.grid.getCell(row, col);
			const robotModel = new Robot(robotModelRef);

			const seatName = shuffledSeats.pop() || "A1";

			robotModel.attachTo(cell, this.threeScene, undefined, seatName);
			return robotModel;
		});
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
			this.frustumWidth = frustumWidth;
			this.frustumHeight = frustumHeight;
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

		window.addEventListener("resize", setupCamera);
	}

	create() {
		this.adNetworkSetup();

		this.loadedModels = this.registry.get("loadedModels");

		this.setupThreeJS();
		this.initializeScene();
		this.loadModels();

		console.log("Grid: ", this.grid);
		console.log("Main Scene Background: ", this.mainSceneBg);

		this.input.on("pointerdown", () => {
			this.sound.play("sound_fx");
			onCtaPressed();
		});
	}

	update() {
		if (this.threeRenderer) {
			this.threeRenderer.render(this.threeScene, this.camera);

			this.robots.forEach((robot) => {
				if (robot.mixer) {
					robot.mixer.update(this.game.loop.delta / 1000);
				}

				robot.updateLabelPosition(this.camera);
			});

			if (this.movesLeft <= 0) {
				// Game Over Logic
				alert("Game Over! No moves left.");
			}
		}
	}
}
