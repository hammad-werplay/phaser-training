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
	projectWidth: 1136,
	projectHeight: 640,
	orientation: "portrait",
	backgroundColor: 0x87ceeb,
	scene: [Preloader, Game],
};

function initializePhaserGame() {
	return new Phaser.Game(gameConfig);
}

function setupGameInitialization(adNetworkType) {
	const game = initializePhaserGame();

	game.onResize = function () {
		const bw = window.innerWidth;
		const bh = window.innerHeight;

		const room_width = gameConfig.projectWidth;
		const room_height = gameConfig.projectHeight;

		let new_width, new_height;

		// Detect orientation
		gameConfig.orientation = bw > bh ? "landscape" : "portrait";

		// Adjust canvas size based on orientation
		if (bw / bh > room_width / room_height) {
			new_width = (room_height * bw) / bh;
			new_height = room_height;
		} else {
			new_width = room_width;
			new_height = (room_width * bh) / bw;
		}

		this.config.width = Math.max(new_width, room_width);
		this.config.height = Math.max(new_height, room_height);

		this.scale.setZoom(bh / this.config.height);
		this.scale.resize(this.config.width, this.config.height);
		this.scale.refresh();

		// Notify all active scenes about the resize
		this.scene.scenes.forEach((scene) => {
			if (scene.onResize) {
				scene.onResize(gameConfig.orientation, gameConfig);
			}
		});

		// Resize objects in all active scenes
		this.scene.scenes.forEach(function (scene) {
			scene.children.list.forEach(function (child) {
				if (child.onResize) {
					child.onResize(gameConfig.orientation);
				}
			});
		});
	};

	window.addEventListener("resize", () => {
		game.onResize();
	});

	if (mraidAdNetworks.has(adNetworkType)) {
		networkPlugin.initMraid(() => game);
	} else {
		// vungle, google ads, facebook, tiktok
		return game;
	}
}

setupGameInitialization(config.adNetworkType);
