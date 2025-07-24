import { GameUI } from "./GameUI";

export class GameLogic {
	constructor(scene) {
		this.scene = scene;
		this.gameUI = new GameUI(scene);
	}

	init() {
		console.log("%cSCENE::GameLogic", "color: #fff; background: #00f;");
	}

	startGame() {
		this.gameUI.createNavbar();
		this.gameUI.createMovesBox();
		this.gameUI.createMainScene();
		this.gameUI.createFooter();
		this.scene.createInvisibleGrid();
		this.gameUI.loadModels();
	}

	checkWin() {
		// If all robots are in their correct seats, show the success image
		// Check if all seat cells have the correct robot label
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
