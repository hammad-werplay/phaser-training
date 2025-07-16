import * as Phaser from "./phaser/phaser-3.87.0-core.js";

import { mraidAdNetworks, networkPlugin } from "./networkPlugin.js";

import { Game } from "./scenes/Game";
import { Preloader } from "./scenes/Preloader";
import { config } from "./config.js";

const gameConfig = {
	type: Phaser.AUTO,
	parent: "ad-container",
	width: window.innerWidth,
	height: window.innerHeight,
	backgroundColor: 0x87ceeb,
	scale: {
		mode: Phaser.Scale.RESIZE,
		autoCenter: Phaser.Scale.CENTER_BOTH,
	},
	scene: [Preloader, Game],
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
