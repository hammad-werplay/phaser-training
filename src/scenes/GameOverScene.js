import * as Phaser from "../phaser/phaser-3.87.0-full.js";

export class GameOverScene extends Phaser.Scene {
	constructor() {
		super("GameOverScene");
	}

	create() {
		this.add.rectangle(
			this.scale.width / 2,
			this.scale.height / 2,
			this.scale.width,
			this.scale.height,
			0x000000,
			0.6
		);

		const title = this.add
			.text(this.scale.width / 2, this.scale.height / 2 - 60, "GAME OVER", {
				fontSize: "48px",
				color: "#FF4444",
			})
			.setOrigin(0.5)
			.setAlpha(0)
			.setScale(0);

		this.tweens.add({
			targets: title,
			alpha: 1,
			scale: 1,
			duration: 500,
			ease: "Back.Out",
		});

		const restartText = this.add
			.text(
				this.scale.width / 2,
				this.scale.height / 2 + 20,
				"Click to restart",
				{
					fontSize: "24px",
					color: "#FFFFFF",
				}
			)
			.setOrigin(0.5);

		this.tweens.add({
			targets: restartText,
			alpha: { from: 0.2, to: 1 },
			duration: 800,
			yoyo: true,
			repeat: -1,
		});

		this.input.once("pointerdown", () => {
			this.scene.stop("GameOverScene");
			this.scene.stop("Game");
			this.scene.start("Game");
		});
	}
}
