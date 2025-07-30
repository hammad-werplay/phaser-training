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
		this.gameUI.createMainScene();
		this.createInvisibleGrid();

		this.gameUI.createNavbar();
		this.gameUI.createMovesBox();
		this.gameUI.createFooter();
		// this.gameUI.loadModels();
	}

	getClickedCell(event) {
		const rect = this.scene.threeCanvas.getBoundingClientRect();

		this.scene.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
		this.scene.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

		this.scene.raycaster.setFromCamera(this.scene.mouse, this.scene.camera);

		const intersects = this.scene.raycaster.intersectObjects(
			this.scene.invisibleBoxes
		);

		if (intersects.length === 0) return null;

		const { row, col } = intersects[0].object.userData;
		return this.scene.grid.getCell(row, col);
	}

	selectStartCell(cell) {
		this.scene.startCell = cell;
		cell.robotObject.transformRobotHead(true);
	}

	trySwitchSelection(cell) {
		if (this.scene.startCell && cell.robot && cell.robotObject) {
			this.scene.startCell.robotObject.transformRobotHead(false);
			this.scene.startCell.robotObject.playAnimation();
			this.scene.startCell = cell;
			cell.robotObject.transformRobotHead(true);
			return true;
		}
		return false;
	}

	isSameCellClicked(cell) {
		if (this.scene.startCell.key() === cell.key()) {
			this.scene.startCell = null;
			return true;
		}
		return false;
	}

	tryMoveRobot(endCell) {
		const start = this.scene.startCell;
		const path = this.scene.pathFinder.findShortestPath(start, endCell);

		if (!path) {
			this.handleNoPathFound(start);
			return;
		}

		this.scene.isRobotMoving = true;

		this.movePlayerAlongPath(path, () => {
			this.afterMoveComplete(start, endCell);
		});
	}

	handleNoPathFound(start) {
		const robotObject = start.robotObject;
		robotObject.playAnimation();
		robotObject.transformRobotHead(false);
		robotObject.showEmotionSpriteAboveRobot("angry", this.scene);
		this.scene.startCell = null;
	}

	afterMoveComplete(start, end) {
		this.scene.startCell = null;
		this.scene.isRobotMoving = false;

		end.robot = start.robot;
		end.robotObject = start.robotObject;

		start.robot = null;
		start.robotObject = null;

		end.robotObject.playAnimation();
		const cellBelow = this.scene.grid.getCell(end.row + 1, end.col);
		end.robotObject.lookDown(cellBelow);
		end.robotObject.transformRobotHead(false);

		if (end.type === "seat") {
			const isSeatCorrect = this.handleSeatingLogic(end);
			end.robotObject.isSeatedCorrectly = isSeatCorrect;
		}

		this.scene.movesLeft--;
		this.scene.moveCountText.setText(this.scene.movesLeft.toString());
	}

	handleSeatingLogic(end) {
		const cellBelow = this.scene.grid.getCell(end.row + 1, end.col);
		end.robotObject.lookDown(cellBelow);

		const isCorrect = end.verifyCorrectSeatLabel();
		end.robotObject.playAnimation("RobotArmature|Robot_Sitting");
		end.robotObject.showEmotionSpriteAboveRobot(
			isCorrect ? (Math.random() > 0.5 ? "smile" : "swag") : "angry",
			this.scene
		);
		this.gameUI.showCorrectSeatLabelImage(
			isCorrect ? "correctMoveLabel" : "incorrectMoveLabel"
		);
		return isCorrect;
	}

	handlePointerClick(event) {
		const cell = this.getClickedCell(event);
		if (!cell || this.scene.isRobotMoving) return;

		if (!this.scene.startCell && !cell.robot) return;

		if (!this.scene.startCell) {
			this.selectStartCell(cell);
			return;
		}

		if (this.trySwitchSelection(cell)) return;
		if (this.isSameCellClicked(cell)) return;

		this.tryMoveRobot(cell);
	}

	createInvisibleGrid() {
		this.scene.grid = new Grid(this.totalRows, this.totalCols, this.seats);
		this.scene.pathFinder = new PathFinder(this.scene.grid);
		this.scene.invisibleBoxes = [];

		// Initial Draw
		this.gameUI.drawInvisibleGrid();

		// Click on invisible boxes
		this.scene.mouse = new THREE.Vector2();
		window.addEventListener("pointerdown", this.handlePointerClick.bind(this));
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
				cell.visual.position.y,
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

			this.scene.isRobotMoving = true;
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
