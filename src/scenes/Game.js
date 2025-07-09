import * as Phaser from "../phaser/phaser-3.87.0-full.js";

import { adStart, onCtaPressed, onAudioVolumeChange } from "../networkPlugin";

class LavaShaderPipeline extends Phaser.Renderer.WebGL.Pipelines
	.SinglePipeline {
	constructor(game) {
		super({
			game,
			renderer: game.renderer,
			fragShader: game.cache.shader.get("lava_shader").fragmentSrc,
		});
	}
	setTime(value) {
		this.set1f("time", value);
	}
}

export class Game extends Phaser.Scene {
	constructor() {
		super("Game");
	}

	init() {
		console.log("%cSCENE::Game", "color: #fff; background: #f0f;");
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

	createRoundedBoxWithText(boxX, boxY, textValue) {
		const fontSize = 48;
		const paddingX = 16;
		const paddingY = 10;

		// 1. Create off-screen text to measure size
		const tempText = this.make
			.text({
				x: 0,
				y: 0,
				text: textValue,
				style: {
					font: `bold ${fontSize}px Arial`,
					color: "#ffffff",
				},
				add: false,
			})
			.setOrigin(0.5);

		const bounds = tempText.getBounds();
		const boxWidth = bounds.width + paddingX * 4;
		const boxHeight = bounds.height + paddingY * 3;
		const cornerRadius = Math.min(boxWidth, boxHeight) / 2 - 15;

		// 2. Draw rounded box
		const box = this.add.graphics();
		box.fillStyle(0x8b4513, 1);
		box.fillRoundedRect(boxX, boxY, boxWidth, boxHeight, cornerRadius);

		box.lineStyle(4, 0xb8860b, 1);
		box.strokeRoundedRect(boxX, boxY, boxWidth, boxHeight, cornerRadius);

		// 3. Create final visible text
		const text = this.add
			.text(boxX + boxWidth / 2, boxY + boxHeight / 2, textValue, {
				font: `bold ${fontSize}px Arial`,
				color: "#ffffff",
			})
			.setOrigin(0.5);

		// 4. Clean up temp object
		tempText.destroy();

		return { box, text };
	}

	createScoreBox(x, y, value) {
		return this.createRoundedBoxWithText(x, y, value.toString());
	}

	collectConnectedBoxesBFS(startRow, startCol, targetKey) {
		// Safety checks
		if (
			!this.boxGrid ||
			!this.boxGrid[startRow] ||
			!this.boxGrid[startRow][startCol]
		) {
			return [];
		}

		const queue = [{ row: startRow, col: startCol }];
		const visited = {};
		const connected = [];

		while (queue.length > 0) {
			const { row, col } = queue.shift();
			const key = `${row},${col}`;

			// Bounds check
			if (
				row < 0 ||
				col < 0 ||
				row >= this.boxGrid.length ||
				col >= this.boxGrid[0].length
			)
				continue;

			// Already visited
			if (visited[key]) continue;
			visited[key] = true;

			const box = this.boxGrid[row]?.[col];
			if (!box || box.boxKey !== targetKey) continue;

			connected.push({ row, col, box });

			// Add neighbors
			queue.push({ row: row - 1, col });
			queue.push({ row: row + 1, col });
			queue.push({ row, col: col - 1 });
			queue.push({ row, col: col + 1 });
		}

		return connected;
	}

	placeStoolAboveBoxesOnLeft() {
		const stoolKey = "stool";
		const stoolXPosition = this.gridLeftX + 100;
		const stoolYPosition = this.gridTopY + 20;

		const stool = this.add
			.image(stoolXPosition, stoolYPosition, stoolKey)
			.setOrigin(0.5, 1)
			.setScale(1);

		this.container.add(stool);

		this.stoolX = stoolXPosition;
		this.stoolY = stoolYPosition;

		this.tweens.chain({
			targets: stool,
			loop: -1,
			repeatDelay: 1000,
			tweens: [
				{ angle: -6, duration: 80 },
				{ angle: 6, duration: 80 },
				{ angle: -4, duration: 60 },
				{ angle: 4, duration: 60 },
				{ angle: -2, duration: 40 },
				{ angle: 2, duration: 40 },
				{ angle: 0, duration: 30 },
			],
		});
	}

	placeGirlAboveStool() {
		const girlKey = "girl_jump";
		const girlXPosition = this.stoolX - 40;
		const girlYPosition = this.stoolY - 250;

		const jump = {
			key: "jump",
			frames: this.anims.generateFrameNumbers(girlKey, {
				start: 0,
				end: 23,
			}),
			frameRate: 25,
			repeat: -1,
		};

		this.anims.create(jump);

		const girl = this.add
			.sprite(girlXPosition, girlYPosition, girlKey)
			.setOrigin(0.5, 1)
			.setScale(0.4);

		girl.play("jump", true);
		this.girl = girl;
		this.container.add(girl);
	}

	placeTwoPipesAtTopRight() {
		const pipeKey = "pipe";

		// Pipe 1 position
		const pipe1X = this.container.width ? this.container.width / 2 : 300;
		const pipe1Y = this.container.height
			? -this.container.height / 2 - 100
			: -250;

		const pipeImage1 = this.add
			.image(pipe1X, pipe1Y, pipeKey)
			.setRotation(Phaser.Math.DegToRad(270))
			.setOrigin(0.5, 1)
			.setScale(1.5);
		this.container.add(pipeImage1);

		// Pipe 2 position (above pipe 1)
		const pipe2X = pipe1X;
		const pipe2Y = pipe1Y - 200; // adjust spacing between them

		const pipeImage2 = this.add
			.image(pipe2X, pipe2Y, pipeKey)
			.setRotation(Phaser.Math.DegToRad(270))
			.setOrigin(0.5, 1)
			.setScale(1.5);
		this.container.add(pipeImage2);

		// 💾 Store mouth coordinates of both pipes for later use
		this.pipeMouths = [
			{ x: pipe1X - 30, y: pipe1Y - pipeImage1.displayHeight + 15 }, // adjust offset to match the mouth
			{ x: pipe2X - 30, y: pipe2Y - pipeImage2.displayHeight + 15 },
		];
	}

	placeLavaCollectorAtCenterBottom() {
		const collectorKey = "lava_collector";
		const collectorXPosition = this.gridLeftX + this.gridRightX;
		const collectorYPosition = this.gridBottomY + 170;

		const collector = this.add
			.image(collectorXPosition, collectorYPosition, collectorKey)
			.setOrigin(0.5, 1)
			.setScale(1.3);
		this.container.add(collector);
	}

	flowLavaAboveBoxes() {
		const dropWidth = 16;
		const lavaY = this.gridTopY - 77;

		this.lavaDrops = [];
		const radius = 8;
		const dropSpacing = radius * 1.5;
		for (let x = this.gridLeftX; x < this.gridRightX; x += dropSpacing) {
			const body = this.matter.add.circle(
				x + dropWidth / 2,
				lavaY,
				radius,

				{
					isStatic: false,
					label: "water_drop",
					restitution: 0.3,
					friction: 0,
					frictionAir: 0.01,
					density: 0.0005,
				}
			);

			const sprite = this.add.image(body.position.x, body.position.y, "circle");
			sprite.setDisplaySize(radius * 2, radius * 2);
			sprite.setOrigin(0.5);

			this.container.add(sprite);
			this.tweens.add({
				targets: sprite,
				duration: 1000,
				yoyo: true,
				repeat: -1,
				ease: "Sine.easeInOut",
			});
			this.lavaDrops.push({ body, sprite });
		}

		this.events.on("update", () => {
			for (const drop of this.lavaDrops) {
				drop.sprite.x = drop.body.position.x;
				drop.sprite.y = drop.body.position.y;
			}
		});
	}

	generateBoxes() {
		const rows = 7;
		const cols = 8;
		const boxScale = 0.12;

		// ➕ Get box size using a temp hidden sprite
		const temp = this.add
			.image(0, 0, "box_green")
			.setScale(boxScale)
			.setVisible(false);
		const boxWidth = Math.round(temp.displayWidth);
		const boxHeight = Math.round(temp.displayHeight);
		temp.destroy();

		// Store positioning data for reuse in lava flow
		this.boxWidth = boxWidth;
		this.boxHeight = boxHeight;
		this.boxScale = boxScale;

		// Total width of all boxes
		const totalWidth = cols * boxWidth;

		// Starting position for bottom row
		const startX = -totalWidth / 2;
		const startY = this.container.height
			? this.container.height / 2 - 50
			: 640 - 200;

		// Store positioning data for reuse in lava flow
		this.gridLeftX = startX;
		this.gridRightX = startX + cols * boxWidth;
		this.gridTopY = startY - rows * boxHeight;
		this.gridBottomY = startY;

		const boxLayout = [
			["box_yellow", "box_yellow", "box_hexagon_blue"],
			["box_hexagon_blue", "box_green", "box_yellow"],
			["box_hexagon_blue", "box_yellow", "box_green"],
		];

		// Draw all box rows
		for (let row = 0; row < rows; row++) {
			const rowArray = [];

			for (let col = 0; col < cols; col++) {
				const x = startX + col * boxWidth;
				const y = startY - row * boxHeight;
				const boxKey =
					boxLayout[row % boxLayout.length]?.[col % boxLayout[0].length];

				const box = this.matter.add
					.image(x, y, boxKey, null, {
						isStatic: true,
						label: "grid_box",
					})
					.setOrigin(0, 1)
					.setScale(0.12);

				box.row = row;
				box.col = col;
				box.boxKey = boxKey;

				box.setInteractive();
				box.on("pointerdown", (pointer) => {
					if (this.wallTop) {
						this.matter.world.remove(this.wallTop);
						this.wallTop = null;
					}

					this.scoreText.setText(`${--this.scoreValue}`);
					const connected = this.collectConnectedBoxesBFS(row, col, box.boxKey);

					if (connected.length < 2) {
						// Do something with the box with tween
						this.tweens.add({
							targets: box,
							rotation: Phaser.Math.DegToRad(7),
							duration: 120,
							repeat: 2,
							yoyo: true,
							ease: "Sine.easeInOut",
							onComplete: () => {
								this.tweens.add({
									targets: box,
									scale: 0.12,
									rotation: 0,
									duration: 200,
									ease: "Sine.easeOut",
								});
							},
						});

						return;
					}

					for (const { row, col, box } of connected) {
						const gridRow = row;
						const gridCol = col;

						if (box.body?.label === "lava_drop") continue;

						this.container.remove(box);
						box.destroy();
						this.boxGrid[row][col] = null;
					}

					this.createParticleEffects(pointer);
				});

				rowArray.push(box);
				this.container.add(box);
			}
			this.boxGrid.push(rowArray);
		}
	}

	createParticleEffects(pointer) {
		// Convert world coordinates to container coordinates
		const containerPoint = this.container
			.getWorldTransformMatrix()
			.applyInverse(pointer.x, pointer.y);
		const containerX = containerPoint.x;
		const containerY = containerPoint.y;

		for (let i = 0; i < 14; i++) {
			const spark = this.add
				.image(containerX, containerY, "spark")
				.setScale(Phaser.Math.FloatBetween(0.08, 0.16))
				.setAlpha(Phaser.Math.FloatBetween(0.8, 1))
				.setDepth(10);

			// Add to container for proper positioning
			this.container.add(spark);

			const sparkColors = [0xffcc00, 0xff9900, 0xff6600, 0xff3300];
			const tint = Phaser.Utils.Array.GetRandom(sparkColors);
			spark.setTint(tint);

			const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
			const distance = Phaser.Math.Between(20, 70);

			const targetX = containerX + Math.cos(angle) * distance;
			const targetY = containerY + Math.sin(angle) * distance;

			this.tweens.add({
				targets: spark,
				x: targetX,
				y: targetY,
				alpha: 0,
				scale: 0,
				duration: Phaser.Math.Between(350, 600),
				delay: Phaser.Math.Between(0, 100),
				ease: "Cubic.easeOut",
				onComplete: () => {
					this.container.remove(spark);
					spark.destroy();
				},
			});
		}
	}

	createGameArea(width = 600, height = 1280) {
		const scaleFactor = this.scale.height / height;
		const centerX = this.scale.width / 2;
		const centerY = this.scale.height / 2;

		this.container = this.add.container(centerX, centerY);
		this.container.setScale(scaleFactor);

		const bg = this.add.graphics();

		bg.fillStyle(0xcccccc, 0.9);
		bg.fillRoundedRect(-width / 2, -height / 2, width, height);

		bg.setDepth(-1);
		bg.lineStyle(4, 0x8d6e63, 1);

		this.container.add(bg);
	}

	handleGameFunctionality() {
		this.generateBoxes();
		this.placeStoolAboveBoxesOnLeft();
		this.placeGirlAboveStool();
		this.flowLavaAboveBoxes();
		this.placeTwoPipesAtTopRight();
		this.placeLavaCollectorAtCenterBottom();
	}

	initalizeGame() {
		// Game state
		this.boxGrid = [];
		this.lavaTiles = [];
		this.lavaWave = null;
		this.lavaWaveBaseY = 0;
		this.lavaWaveTime = 0;
		this.scoreValue = 15;
		this.girlJumping = false;
		this.lavaDrops = [];

		// Game objects
		this.girl = null;
		this.scoreText = null;
		this.container = null;
		this.lavaParticleTimer = null;

		// Grid positioning
		this.gridLeftX = 0;
		this.gridRightX = 0;
		this.gridTopY = 0;
		this.gridBottomY = 0;
		this.boxWidth = 0;
		this.boxHeight = 0;
		this.boxScale = 0.12;

		const midX = this.scale.width / 2;
		const midY = this.scale.height / 2;

		this.add
			.image(0, 0, "bg")
			.setOrigin(0)
			.setDisplaySize(this.scale.width / 2, this.scale.height);

		this.add
			.image(this.scale.width / 2, 0, "bg")
			.setOrigin(0)
			.setDisplaySize(this.scale.width / 2, this.scale.height);

		this.add
			.image(this.scale.width - 30, 30, "toyblast_logo")
			.setOrigin(1, 0)
			.setScale(0.5);

		this.createGameArea(); // Create this.container for game area
		const { text: scoreText } = this.createScoreBox(100, 50, this.scoreValue);
		this.scoreText = scoreText;
		this.handleGameFunctionality();

		const debugGraphic = this.matter.world.createDebugGraphic();
		debugGraphic.setAlpha(0.5);
		debugGraphic.setPosition(this.container.x, this.container.y);

		this.input.on("pointerdown", () => {
			if (!this.girlJumping) {
				this.girlJumping = true;

				this.tweens.add({
					targets: this.girl,
					y: this.girl.y - 80,
					angle: -10,
					onYoyo: () => {
						this.girl.setAngle(0);
					},
					duration: 300,
					yoyo: true,
					ease: "Quad.easeOut",
					onComplete: () => {
						this.girlJumping = false;
					},
				});
			}
		});

		const mouth = Phaser.Utils.Array.GetRandom(this.pipeMouths);
		const radius = 8;
		const bodyX = mouth.x - 180;
		const bodyY = mouth.y + 180;

		this.renderer.pipelines.add(
			"LavaShader",
			new LavaShaderPipeline(this.game)
		);

		this.time.addEvent({
			delay: 100,
			loop: true,
			callback: () => {
				if (this.lavaDrops.length > 150) {
					const old = this.lavaDrops.shift();
					old.sprite.destroy();
					this.matter.world.remove(old.body);
				}

				const body = this.matter.add.circle(bodyX, bodyY, radius, {
					isStatic: false,
					label: "water_drop",
					restitution: 0,
					friction: 0.5,
					frictionAir: 0.01,
					density: 0.0005,
				});

				const sprite = this.add.image(bodyX, bodyY, "circle");
				sprite.setDisplaySize(radius * 9, radius * 9);
				sprite.setOrigin(0.5);
				sprite.setAlpha(0.7);
				sprite.setPipeline("LavaShader");
				this.container.add(sprite);

				this.lavaDrops.push({ body, sprite });
			},
		});

		this.matter.add.rectangle(this.gridLeftX, 400, 48, 1800, {
			isStatic: true,
			label: "wall_left",
		});

		this.matter.add.rectangle(this.gridRightX, 400, 48, 1800, {
			isStatic: true,
			label: "wall_right",
		});
		this.wallTop = this.matter.add.rectangle(this.gridTopY, 0, 700, 48, {
			isStatic: true,
			label: "wall_top",
		});

		this.matter.world.on("collisionstart", (event, bodyA, bodyB) => {
			if (
				(bodyA.label === "lava_drop" && bodyB.label === "grid_box") ||
				(bodyB.label === "lava_drop" && bodyA.label === "grid_box")
			) {
				// Optional: adjust Y or stop lava
				bodyA.position.y -= 2;
				console.log("Lava drop hit a box", bodyA, bodyB);
			}
		});
	}

	create() {
		this.adNetworkSetup();

		console.log("Game scene created", this.matter);

		this.initalizeGame();
	}

	update(time) {
		const lavaPipeline = this.renderer.pipelines.get("LavaShader");
		lavaPipeline?.setTime(time / 100);

		for (const drop of this.lavaDrops) {
			if (!drop.sprite || !drop.body) continue;

			drop.sprite.x = drop.body.position.x;
			drop.sprite.y = drop.body.position.y;
		}
		// Check for game over condition
		if (this.scoreValue <= 0 && !this.isGameOver) {
			this.isGameOver = true;
			this.scene.pause();
			this.scene.launch("GameOverScene");
		}
	}
}
