import * as Phaser from "../phaser/phaser-3.87.0-core.js";
import * as THREE from "three";

import { Base64Manager } from "../utils/Base64Manager.js";
import { LoadBase64Audio } from "../utils/LoadBase64Audio.js";
import { LoadBase64BitmapFont } from "../utils/LoadBase64BitmapFont.js";
import { adReady } from "../networkPlugin";
import { soundFxMP3 } from "../../media/audio_sound_fx.mp3.js";
import { MADETommySoftBlackWOFF2 } from "../../media/fonts_MADE-Tommy-Soft-Black.woff2.js";
import { footerPNG } from "../../media/images_footer.png.js";
import { buttonPNG } from "../../media/images_button.png.js";
import { movesBoxPNG } from "../../media/images_movesBox.png.js";
import { BusWithTrackPNG } from "../../media/images_BusWithTrack.png.js";
import { smilePNG } from "../../media/images_smile.png.js";
import { angryPNG } from "../../media/images_angry.png.js";
import { happyCharacterPNG } from "../../media/images_happyCharacter.png.js";
import { FailedCharactersPNG } from "../../media/images_FailedCharacters.png.js";

// Models
import { FBXLoader } from "three/examples/jsm/Addons.js";
import { RobotFBX } from "../../media/models_Robot.fbx.js";

export class Preloader extends Phaser.Scene {
	constructor() {
		super("Preload");

		this.loadedModels = {};
		this.modelQueue = [
			{
				key: "Robot",
				url: RobotFBX,
				position: { x: -5, y: 15, z: 5 },
			},
		];
	}

	init() {
		console.log("%cSCENE::Preloader", "color: #fff; background: #f00;");
	}

	preload() {
		//  Invoke the Base64Manager - pass in the current scene reference and a callback to invoke when it's done
		Base64Manager(this, () => this.base64LoaderComplete());

		this.load.image("footer", footerPNG);
		this.load.image("button", buttonPNG);
		this.load.image("movesBox", movesBoxPNG);
		this.load.image("busWithTrack", BusWithTrackPNG);
		this.load.image("smile", smilePNG);
		this.load.image("angry", angryPNG);
		this.load.image("happyCharacter", happyCharacterPNG);
		this.load.image("failedCharacters", FailedCharactersPNG);

		LoadBase64Audio(this, [{ key: "sound_fx", data: soundFxMP3 }]);
	}

	create() {
		//  This may run before the Loader has completed, so don't use in-flight assets here
		if (!document.getElementById("made-tommy-style")) {
			const style = document.createElement("style");
			style.id = "made-tommy-style";
			style.innerHTML = `
		@font-face {
			font-family: 'MADE Tommy Soft';
			src: url(${MADETommySoftBlackWOFF2}) format('woff2');
			font-weight: 900;
			font-style: normal;
		}
	`;
			document.head.appendChild(style);
		}
	}

	loadModelsNormally() {
		if (!this.threeLoader) {
			this.threeLoader = new FBXLoader();
		}

		this.loadNextModelNormal();
	}

	loadNextModelNormal() {
		if (this.modelQueue.length === 0) {
			this.startGame();
			return;
		}

		const modelConfig = this.modelQueue.shift();

		// Convert data URL to blob
		const base64 = modelConfig.url.split(",")[1];
		const binary = atob(base64);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i);
		}

		const blob = new Blob([bytes.buffer], { type: "application/octet-stream" });
		const url = URL.createObjectURL(blob);

		const glowMaterial = new THREE.MeshStandardMaterial({
			color: 0xffffff,
			emissive: 0xffd700,
			emissiveIntensity: 1.5,
			roughness: 0.5,
			metalness: 0.8,
		});

		// Load model
		this.threeLoader.load(
			url,
			(object) => {
				// Store loaded model and config
				this.loadedModels[modelConfig.key] = {
					object: object,
					config: modelConfig,
				};

				// Apply color to the model
				const baseColor = 0xff0000; // Red
				const glowColor = 0xffd700;
				object.traverse((child) => {
					if (child.isMesh) {
						child.material = new THREE.MeshStandardMaterial({
							color: baseColor,
						});

						// Add glow layers
						for (let i = 1; i <= 3; i++) {
							const glowMaterial = new THREE.MeshBasicMaterial({
								color: glowColor,
								transparent: true,
								opacity: 0.25 / i,
								side: THREE.BackSide,
								blending: THREE.AdditiveBlending,
							});

							const glowModel = child.clone();
							glowModel.material = glowMaterial;
							glowModel.scale.multiplyScalar(1 + i * 0.08);
							object.add(glowModel);
						}
					}
				});

				// Cleanup
				URL.revokeObjectURL(url);

				// Load next model
				this.loadNextModelNormal();
			},
			(xhr) => {
				const percent = Math.round((xhr.loaded / xhr.total) * 100);
			},
			(error) => {
				console.error(`Error loading model ${modelConfig.key}:`, error);
				this.loadNextModelNormal();
			}
		);
	}

	startGame() {
		// Store models in registry to access from other scenes
		this.registry.set("loadedModels", this.loadedModels);

		// Start the game scene
		this.time.delayedCall(200, () => {
			this.scene.start("Game");
		});
	}
	base64LoaderComplete() {
		adReady();

		// Load the models
		this.loadModelsNormally();
	}
}
