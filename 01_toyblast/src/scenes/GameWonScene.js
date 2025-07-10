import * as Phaser from "../phaser/phaser-3.87.0-full.js";

export class GameWonScene extends Phaser.Scene {
	constructor() {
		super("GameWonScene");
	}

	create() {
		const { width, height } = this.scale;

		this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);

		const winText = this.add
			.text(width / 2, height / 2 - 60, "🏆 GAME WON 🏆", {
				fontSize: "48px",
				fontFamily: "Arial",
				color: "#00ff88",
			})
			.setOrigin(0.5)
			.setAlpha(0)
			.setScale(0);

		this.tweens.add({
			targets: winText,
			alpha: 1,
			scale: 1,
			duration: 500,
			ease: "Back.Out",
		});

		const restart = this.add
			.text(width / 2, height / 2 + 30, "Click to Restart", {
				fontSize: "24px",
				fontFamily: "Arial",
				color: "#ffffff",
			})
			.setOrigin(0.5)
			.setAlpha(0.8);

		this.tweens.add({
			targets: restart,
			alpha: { from: 0.3, to: 1 },
			duration: 800,
			yoyo: true,
			repeat: -1,
		});

		this.input.once("pointerdown", () => {
			this.scene.stop("GameWonScene");
			this.scene.start("Game");
		});
	}
}
