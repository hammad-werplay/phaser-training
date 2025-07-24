import * as THREE from "three";

import { GameUI } from "./GameUI";
import { Grid, PathFinder } from "./Mechanics.js";
import { Robot } from "./Robot.js";
import { Utils } from "./Utils";

export class GameLogic {
	constructor(scene) {
		this.scene = scene;
		this.gameUI = new GameUI(scene);

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
		console.log("%cSCENE::GameLogic", "color: #fff; background: #00f;");
	}

	startGame() {
		this.createInvisibleGrid();

		this.gameUI.createNavbar();
		this.gameUI.createMovesBox();
		this.gameUI.createMainScene();
		this.gameUI.createFooter();
		this.gameUI.loadModels();
	}

	createInvisibleGrid() {
		this.scene.grid = new Grid(this.totalRows, this.totalCols, this.seats);
		this.scene.pathFinder = new PathFinder(this.scene.grid);
		this.scene.invisibleBoxes = [];
		const boxSize = 1;
		const bg = this.scene.mainSceneBg;

		const drawGrid = () => {
			this.scene.invisibleBoxes.forEach((box) => {
				this.scene.threeScene.remove(box);
				box.geometry.dispose();
				box.material.dispose();
			});
			this.scene.invisibleBoxes = [];

			const cellWidth = 0.41;
			const cellHeight = 0.31;

			const gridWidth = this.totalCols * cellWidth - 0.43;
			const gridHeight =
				this.totalRows * cellHeight -
				(this.scene.scale.width < 500
					? 0.4
					: this.scene.scale.width > 1000
					? 0.14
					: 0.28);

			const startingPositions = {
				x: -gridWidth / 2,
				y: 0,
				z: -gridHeight / 2,
			};

			for (let row = 0; row < this.totalRows; row++) {
				for (let col = 0; col < this.totalCols; col++) {
					const logicBox = this.scene.grid.getCell(row, col);

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

					this.scene.threeScene.add(box);
					this.scene.invisibleBoxes.push(box);
				}
			}
		};

		// Initial Draw
		drawGrid();

		// Redraw on resize
		this.scene.scale.on("resize", drawGrid, this);

		// Click on invisible boxes
		this.scene.mouse = new THREE.Vector2();
		window.addEventListener("pointerdown", (event) => {
			const rect = this.scene.threeCanvas.getBoundingClientRect();

			this.scene.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
			this.scene.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

			this.scene.raycaster.setFromCamera(this.scene.mouse, this.scene.camera);

			const intersects = this.scene.raycaster.intersectObjects(
				this.scene.invisibleBoxes
			);

			if (intersects.length > 0) {
				const { row, col } = intersects[0].object.userData;
				const clickedBox = this.scene.grid.getCell(row, col);

				if (!clickedBox.robot && !this.scene.startCell) {
					return;
				}

				if (!this.scene.startCell) {
					this.scene.startCell = clickedBox;
					clickedBox.robotObject.playAnimation("RobotArmature|Robot_Yes");
					clickedBox.robotObject.transformRobotHead(true);
					return;
				}

				const endCell = clickedBox;

				if (this.scene.startCell && endCell.robot && endCell.robotObject) {
					this.scene.startCell.robotObject.transformRobotHead(false);
					this.scene.startCell.robotObject.playAnimation();
					this.scene.startCell = endCell;
					endCell.robotObject.transformRobotHead(true);
					return;
				}

				if (this.scene.startCell.key() === endCell.key()) {
					this.scene.startCell = null;
					return;
				}

				const start = this.scene.startCell;
				const end = endCell;

				const path = this.scene.pathFinder.findShortestPath(start, end);

				if (!path) {
					console.error("No path found");
					const robotObject = this.scene.startCell.robotObject;
					robotObject.playAnimation();
					robotObject.transformRobotHead(false);
					robotObject.showEmotionSpriteAboveRobot("angry", this.scene);
					this.scene.startCell = null;
					return;
				}

				this.movePlayerAlongPath(path, () => {
					this.scene.startCell = null;
					end.robot = start.robot;
					end.robotObject = start.robotObject;
					start.robotObject.playAnimation();
					const cellToLookDown = this.scene.grid.getCell(end.row + 1, end.col);
					end.robotObject.lookDown(cellToLookDown);
					end.robotObject.transformRobotHead(false);

					let isSeatCorrect = false;
					if (end.type === "seat") {
						const cellToLookDown = this.scene.grid.getCell(
							end.row + 1,
							end.col
						);
						end.robotObject.lookDown(cellToLookDown);
						isSeatCorrect = end.verifyCorrectSeatLabel();

						end.robotObject.isSeatedCorrectly = isSeatCorrect;
						end.robotObject.showEmotionSpriteAboveRobot(
							isSeatCorrect
								? Math.random() > 0.5
									? "smile"
									: "swag"
								: "angry",
							this.scene
						);
						this.gameUI.showCorrectSeatLabelImage(
							isSeatCorrect ? "correctMoveLabel" : "incorrectMoveLabel"
						);
					}

					if (!isSeatCorrect) {
						end.robotObject.isSeatedCorrectly = false;
					}

					start.robot = null;
					start.robotObject = null;

					this.scene.movesLeft--;
					this.scene.moveCountText.setText(this.scene.movesLeft.toString());
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
			const startQuat = robotModel.quaternion.clone();
			const up = new THREE.Vector3(0, 1, 0);
			const targetQuat = new THREE.Quaternion();

			let targetLookPos;
			if (nextCell) {
				targetLookPos = getCellPosition(nextCell);
				const lookDir = targetLookPos.clone().sub(endPos).normalize();

				if (lookDir.lengthSq() > 0.0001) {
					const lookAtMatrix = new THREE.Matrix4();
					lookAtMatrix.lookAt(targetLookPos, endPos, up);
					targetQuat.setFromRotationMatrix(lookAtMatrix);
				} else {
					targetQuat.copy(startQuat);
				}
			} else {
				const lookDir = new THREE.Vector3(0, 0, -1);
				const from = endPos.clone();
				const to = from.clone().add(lookDir);
				const lookAtMatrix = new THREE.Matrix4();

				targetQuat.setFromRotationMatrix(lookAtMatrix);
			}

			const startTime = performance.now();
			const cubicEaseInOut = (t) =>
				t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

			const animate = (now) => {
				const elapsed = now - startTime;
				const t = Math.min(elapsed / MOVE_DURATION, 1);
				const ease = cubicEaseInOut(t);

				robotModel.position.lerpVectors(startPos, endPos, ease);
				robotModel.quaternion.copy(startQuat.clone().slerp(targetQuat, ease));

				const bobAmplitude = 0.07;
				const bobFrequency = 2.5; // Hz
				const bobOffset =
					Math.sin(ease * Math.PI * bobFrequency) *
					bobAmplitude *
					(1 - Math.abs(2 * ease - 1));
				robotModel.position.y = endPos.y + bobOffset;

				if (t < 1) {
					requestAnimationFrame(animate);
				} else {
					robotModel.position.copy(endPos);
					robotModel.quaternion.copy(targetQuat);
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
				step();
			});
		};

		step();
	}

	checkWin() {
		if (
			!this.scene.gameWon &&
			this.scene.grid &&
			this.scene.grid.cells &&
			this.scene.grid.cells
				.flat()
				.filter((cell) => cell.type === "seat")
				.every(
					(cell) =>
						cell.robotObject &&
						typeof cell.verifyCorrectSeatLabel === "function" &&
						cell.verifyCorrectSeatLabel()
				)
		) {
			const { width, height } = this.scene.sys.game.canvas;

			// Create a semi-transparent overlay
			this.scene.successOverlay = this.scene.add
				.rectangle(0, 0, width, height, 0x000000, 0.7)
				.setOrigin(0)
				.setDepth(10000);

			// Center the happy character image
			this.scene.successCharacterImage = this.scene.add
				.image(width / 2, height / 2 - 50, "happyCharacter")
				.setOrigin(0.5)
				.setDepth(10001)
				.setScale(0.7);

			const centerX = width / 2 - 100;
			const baseY = height / 2 - 280;

			const word1 = this.scene.add
				.text(0, 0, "EVERYONE ", {
					fontSize: "36px",
					color: "#fff",
					fontStyle: "bold",
					stroke: "#000",
					strokeThickness: 6,
				})
				.setOrigin(0, 0.5);

			const word2 = this.scene.add
				.text(word1.width, 0, "SEATED!", {
					fontSize: "36px",
					color: "#00ff00", // green
					fontStyle: "bold",
					stroke: "#000",
					strokeThickness: 6,
				})
				.setOrigin(0, 0.5);

			word1.setPosition(0, 0);
			word2.setPosition(20, word1.height);

			this.scene.gameOverText = this.scene.add
				.container(centerX, baseY, [word1, word2])
				.setDepth(10002)
				.setSize(
					Math.max(word1.width, word2.width),
					word1.height + word2.height
				);

			this.gameUI.createDownloadBtn();

			// Stop all input and update logic
			this.scene.gameWon = true;
			this.scene.threeCanvas.style.zIndex = "-1";
			return;
		}
	}

	checkLoss() {
		if (
			this.scene.movesLeft <= 0 &&
			!this.scene.gameOverShown &&
			!this.scene.gameWon
		) {
			this.scene.gameOverShown = true;

			// Create overlay
			const { width, height } = this.scene.sys.game.canvas;
			this.scene.gameOverOverlay = this.scene.add
				.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
				.setOrigin(0.5)
				.setDepth(10000);

			this.scene.failedCharactersImage = this.scene.add
				.image(width / 2, height / 2, "failedCharacters")
				.setOrigin(0.5)
				.setScale(0.7)
				.setDepth(10001);

			const centerX = width / 2 - 100;
			const baseY = height / 2 - 280;

			const word1 = this.scene.add
				.text(0, 0, "EVERYONE ", {
					fontSize: "36px",
					color: "#fff",
					fontStyle: "bold",
					stroke: "#000",
					strokeThickness: 6,
				})
				.setOrigin(0, 0.5);

			const word2 = this.scene.add
				.text(word1.width, 0, "NOT", {
					fontSize: "36px",
					color: "#ff0000", // red
					fontStyle: "bold",
					stroke: "#000",
					strokeThickness: 6,
				})
				.setOrigin(0, 0.5);

			const word3 = this.scene.add
				.text(word1.width + word2.width, 0, " SEATED", {
					fontSize: "36px",
					color: "#fff",
					fontStyle: "bold",
					stroke: "#000",
					strokeThickness: 6,
				})
				.setOrigin(0, 0.5);

			word1.setPosition(0, 0);
			word2.setPosition(50, word1.height);
			word3.setPosition(0, word1.height + word2.height);

			this.scene.gameOverText = this.scene.add
				.container(centerX, baseY, [word1, word2, word3])
				.setDepth(10002)
				.setSize(
					Math.max(word1.width, word2.width, word3.width),
					word1.height + word2.height + word3.height
				);

			this.gameUI.createDownloadBtn();

			this.scene.threeCanvas.style.zIndex = "-1";
		}
	}
}
