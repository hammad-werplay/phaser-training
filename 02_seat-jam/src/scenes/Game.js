import * as Phaser from "../phaser/phaser-3.87.0-core.js";
import * as THREE from "three";
import GUI from "lil-gui";

import { adStart, onCtaPressed, onAudioVolumeChange } from "../networkPlugin";
import { Grid, PathFinder } from "./Mechanics.js";
import { Robot } from "./Robot.js";
import { Utils } from "./Utils.js";
import { GameUI } from "./GameUI.js";
import { GameLogic } from "./GameLogic.js";
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
					Robot.transformRobotHead(clickedBox.robotObject, true);
					return;
				}

				const endCell = clickedBox;

				if (this.startCell && endCell.robot && endCell.robotObject) {
					Robot.transformRobotHead(this.startCell.robotObject, false);
					this.startCell.robotObject.playAnimation();
					this.startCell = endCell;
					Robot.transformRobotHead(endCell.robotObject, true);
					return;
				}

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
					const screen = Utils.worldToScreen(
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

					Robot.transformRobotHead(this.startCell.robotObject, false);

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
					Robot.transformRobotHead(end.robotObject, false);

					if (end.type === "seat") {
						const cellToLookDown = this.grid.getCell(end.row + 1, end.col);
						end.robotObject.lookDown(cellToLookDown);
						end.robotObject.playAnimation("RobotArmature|Robot_Sitting");
						const isSeatCorrect = end.verifyCorrectSeatLabel();

						if (isSeatCorrect) {
							end.visual.material.color.set(0x00ff00);
							end.visual.material.opacity = 0.5;

							// Add a smile image above the robot
							const worldPos = end.robotObject.robot.position.clone();
							worldPos.x += end.col === 2 ? 0.2 : -0.2;
							worldPos.y += 1.3;

							const screen = Utils.worldToScreen(
								worldPos,
								this.camera,
								this.threeRenderer.domElement
							);

							console.log("screen", screen);

							const smileImage = this.add.image(screen.x, screen.y, "smile");
							smileImage.setOrigin(0.5);
							smileImage.setScale(0.12);
							smileImage.setDepth(1000);

							this.tweens.add({
								targets: smileImage,
								alpha: { from: 0, to: 1 },
								scale: { from: 0, to: 0.13 },
								duration: 300,
								yoyo: true,
								hold: 400,
								ease: "Back.Out",
								onYoyo: () => {
									this.tweens.add({
										targets: smileImage,
										alpha: 0,
										scale: 0.1,
										duration: 800,
										ease: "Expo.easeIn",
										onComplete: () => smileImage.destroy(),
									});
								},
							});
						} else {
							end.visual.material.color.set(0xff0000);
							end.visual.material.opacity = 0.5;

							// Add a sad image above the robot
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

		this.gameLogic = new GameLogic(this);

		this.gameLogic.startGame();

		this.input.on("pointerdown", () => {
			this.sound.play("sound_fx");
			onCtaPressed();
		});
	}

	update() {
		if (this.threeRenderer) {
			this.threeRenderer.render(this.threeScene, this.camera);

			this.gameLogic.checkWin();
			this.gameLogic.checkLoss();

			this.robots.forEach((robot) => {
				if (robot.mixer) {
					robot.mixer.update(this.game.loop.delta / 1000);
				}

				robot.updateLabelPosition(this.camera);
			});
		}
	}
}
