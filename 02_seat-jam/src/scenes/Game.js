import * as Phaser from "../phaser/phaser-3.87.0-core.js";
import * as THREE from "three";

import { adStart, onCtaPressed, onAudioVolumeChange } from "../networkPlugin";
export class Game extends Phaser.Scene {
	constructor() {
		super("Game");
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

	create() {
		this.adNetworkSetup();

		this.input.on("pointerdown", () => {
			this.sound.play("sound_fx");
			onCtaPressed();
		});
	}
}
