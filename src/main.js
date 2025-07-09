import * as Phaser from "./phaser/phaser-3.87.0-full.js";

import { mraidAdNetworks, networkPlugin } from "./networkPlugin.js";

import { Game } from "./scenes/Game";
import { Preloader } from "./scenes/Preloader";
import { GameOverScene } from "./scenes/GameOverScene.js";
import { config } from "./config.js";

const gameConfig = {
	type: Phaser.AUTO,
	parent: "ad-container",
	width: window.innerWidth,
	height: window.innerHeight,
	gameTitle: "Playable Ad Template",
	physics: {
		default: "matter",
		matter: {
			gravity: { y: 1 },
			debug: true,
		},
	},
	scale: {
		mode: Phaser.Scale.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH,
	},
	scene: [Preloader, Game, GameOverScene],
};

function initializePhaserGame() {
	return new Phaser.Game(gameConfig);
}

function setupGameInitialization(adNetworkType) {
	const game = initializePhaserGame();

	if (mraidAdNetworks.has(adNetworkType)) {
		networkPlugin.initMraid(() => game);
	} else {
		// vungle, google ads, facebook, tiktok
		return game;
	}
}

setupGameInitialization(config.adNetworkType);
