import * as Phaser from "../phaser/phaser-3.87.0-core.js";
import * as THREE from "three";
import GUI from "lil-gui";

import { adStart, onCtaPressed, onAudioVolumeChange } from "../networkPlugin";
import { Grid, PathFinder } from "./Mechanics.js";
import { Robot } from "./Robot.js";
import { Utils } from "./Utils.js";
import { GameUI } from "./GameUI.js";
import { GameLogic } from "./GameLogic.js";
export class Game extends Phaser.Scene {
	constructor() {
		super("Game");

		this.movesLeft = 7;
		this.startCell;
		this.isRobotMoving = false;
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

	setupThreeJS() {
		// Canvas for ThreeJS
		this.threeCanvas = document.createElement("canvas");
		this.threeCanvas.style.position = "absolute";
		this.threeCanvas.style.top = "0";
		this.threeCanvas.style.left = "0";
		this.threeCanvas.style.zIndex = "1";
		this.threeCanvas.style.pointerEvents = "none";
		this.threeCanvas.style.backgroundColor = "rgba(0,255,0,0.1)";
		document.body.appendChild(this.threeCanvas);

		// Camera Setup
		const setupCamera = () => {
			const aspect = window.innerWidth / window.innerHeight;
			const frustumHeight = 5;
			const frustumWidth = frustumHeight * aspect;
			this.frustumWidth = frustumWidth;
			this.frustumHeight = frustumHeight;
			this.camera = new THREE.OrthographicCamera(
				-frustumWidth / 2,
				frustumWidth / 2,
				frustumHeight / 2,
				-frustumHeight / 2,
				0.1,
				1000
			);
			this.camera.position.set(0, 19, 5);
			this.camera.lookAt(0, 0.5, 0);
			this.camera.updateProjectionMatrix();

			if (this.threeRenderer) {
				this.threeRenderer.setSize(window.innerWidth, window.innerHeight);
			}
		};

		setupCamera();

		// ThreeJS Scene
		this.threeScene = new THREE.Scene();

		// Setup Lights
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
		const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
		directionalLight.position.set(3, 10, 5);

		this.threeScene.add(ambientLight, directionalLight);

		// Setup Raycaster for Click Detection
		this.raycaster = new THREE.Raycaster();
		this.pointer = new THREE.Vector2();

		// Remove old debug box if exists
		if (this.boundingBoxHelper) {
			this.threeScene.remove(this.boundingBoxHelper);
		}

		// ThreeJS Renderer
		this.threeRenderer = new THREE.WebGLRenderer({
			canvas: this.threeCanvas,
			alpha: true,
		});
		this.threeRenderer.setSize(window.innerWidth, window.innerHeight);
		this.threeRenderer.setPixelRatio(window.devicePixelRatio);
		this.isRenderingThree = true;

		window.addEventListener("resize", setupCamera);
	}

	ResizeHandler(orientation, config, scene) {
		this.onResize = function (orientation) {
			console.groupCollapsed("Resize Handler");
			const bw = window.innerWidth;
			const bh = window.innerHeight;

			console.log("Resize Handler:", orientation, bw, bh);

			if (this.isRenderingThree) {
				// Update Three.js renderer size to match browser window
				console.log("Updating Three.js renderer size:", bw, bh);
				this.threeRenderer.setSize(bw, bh);
			}

			// Update camera aspect ratio
			this.camera.aspect = bw / bh;
			this.camera.updateProjectionMatrix();
			console.log("Camera aspect ratio updated:", this.camera.aspect);

			// Adjust Three.js canvas position to match Phaser canvas
			const phaserCanvas = this.scale.canvas;
			const phaserRect = phaserCanvas.getBoundingClientRect();

			this.threeCanvas.style.top = phaserRect.top + "px";
			this.threeCanvas.style.left = phaserRect.left + "px";
			this.threeCanvas.style.width = phaserRect.width + "px";
			this.threeCanvas.style.height = phaserRect.height + "px";

			console.log(
				"Three.js canvas adjusted to Phaser canvas dimensions:",
				phaserRect
			);

			// Adjust based on orientation
			if (orientation === "landscape") {
				console.log(this.gameLogic.gameUI);
				this.gameLogic.gameUI.ResizeLandscape(config);
			} else {
				this.gameLogic.gameUI.ResizePortrait(config);
			}
			console.groupEnd();
		};
	}

	create() {
		this.adNetworkSetup();

		let config = this.sys.game.config;
		console.log("Game Config:", config);

		this.loadedModels = this.registry.get("loadedModels");
		this.setupThreeJS();

		this.gameLogic = new GameLogic(this);

		this.gameLogic.startGame();
		this.game.onResize();

		this.ResizeHandler(config.orientation, config, this);

		this.input.on("pointerdown", () => {
			this.sound.play("sound_fx");
			onCtaPressed();
		});
	}

	update() {
		if (this.threeRenderer) {
			this.threeRenderer.render(this.threeScene, this.camera);

			this.gameLogic.checkWin();
			this.gameLogic.checkLoss();

			this.robots.forEach((robot) => {
				if (robot.mixer) {
					robot.mixer.update(this.game.loop.delta / 1000);
				}

				robot.updateLabelPosition(this.camera);
			});
		}
	}
}
