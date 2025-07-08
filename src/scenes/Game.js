import * as Phaser from "../phaser/phaser-3.87.0-core.js";

import { adStart, onCtaPressed, onAudioVolumeChange } from "../networkPlugin";
export class Game extends Phaser.Scene {
	constructor() {
		super("Game");

		// Game state
		this.boxGrid = [];
		this.lavaTiles = [];
		this.lavaWave = null; // Separate reference for the flowing lava wave
		this.lavaWaveBaseY = 0; // Original Y position for wave motion
		this.lavaWaveTime = 0; // Animation timer
		this.scoreValue = 15;
		this.girlJumping = false;

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

	flowLavaAboveBoxes() {
		const lavaXPosition = this.gridLeftX;
		const lavaYPosition = this.gridTopY - 5;
		const lavaWidth = this.gridRightX - this.gridLeftX;
		const lavaHeight = 80;

		const lavaWave = this.createAnimatedLavaWave(
			lavaXPosition,
			lavaYPosition,
			lavaWidth,
			lavaHeight
		);

		this.container.add(lavaWave);
		console.log(
			"Lava wave created at:",
			lavaXPosition,
			lavaYPosition,
			"size:",
			lavaWidth,
			lavaHeight
		);

		this.createLavaParticleSystem(lavaXPosition, lavaYPosition, lavaWidth);
	}

	createAnimatedLavaWave(x, y, width, height) {
		const tile = this.add.tileSprite(x, y, width, height, "lava_tile");
		tile.setOrigin(0, 1);
		this.lavaWave = tile;
		this.lavaWaveBaseY = y;
		this.lavaWaveTime = 0;

		this.tweens.add({
			targets: tile,
			tilePositionX: 64,
			duration: 150,
			repeat: -1,
			yoyo: false,
			ease: "Linear",
		});

		this.tweens.add({
			targets: tile,
			duration: 150,
			yoyo: true,
			repeat: -1,
			ease: "Sine.easeInOut",
		});

		this.tweens.add({
			targets: tile,
			scaleY: 1.1,
			duration: 200,
			yoyo: true,
			repeat: -1,
			ease: "Sine.easeInOut",
		});

		return tile;
	}

	createLavaParticleSystem(x, y, width) {
		this.lavaParticleTimer = this.time.addEvent({
			delay: 200,
			loop: true,
			callback: () => {
				if (this.lavaWave) {
					const particleX = x + Math.random() * width;
					const particleY = y - 10;

					const particle = this.add
						.image(particleX, particleY, "spark")
						.setScale(Phaser.Math.FloatBetween(0.05, 0.12))
						.setDepth(2);

					const particleColors = [0xff3300, 0xff6600, 0xff9900, 0xffaa00];
					const tint = Phaser.Utils.Array.GetRandom(particleColors);
					particle.setTint(tint);

					this.container.add(particle);

					this.tweens.add({
						targets: particle,
						y: particleY - Phaser.Math.Between(80, 150),
						x: particleX + Phaser.Math.Between(-30, 30),
						alpha: 0,
						scale: 0.02,
						duration: Phaser.Math.Between(2000, 3500),
						ease: "Cubic.easeOut",
						onUpdate: (tween) => {
							const progress = tween.progress;
							const waveOffset = Math.sin(progress * Math.PI * 4) * 15;
							particle.x =
								particleX +
								waveOffset +
								progress * Phaser.Math.Between(-30, 30);
						},
						onComplete: () => {
							this.container.remove(particle);
							particle.destroy();
						},
					});
				}
			},
		});
	}

	placeTwoPipesAtTopRight() {
		const pipeKey = "pipe";

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

		const pipe2X = this.container.width ? this.container.width / 2 : 300;
		const pipe2Y = this.container.height
			? -this.container.height / 2 - 100
			: -450;

		const pipeImage2 = this.add
			.image(pipe2X, pipe2Y, pipeKey)
			.setRotation(Phaser.Math.DegToRad(270))
			.setOrigin(0.5, 1)
			.setScale(1.5);
		this.container.add(pipeImage2);
	}

	placeLavaCollectorAtCenterBottom() {
		const collectorKey = "lava_collector";
		const collectorXPosition = this.gridLeftX + this.gridRightX;
		const collectorYPosition = this.gridBottomY + 150;

		const collector = this.add
			.image(collectorXPosition, collectorYPosition, collectorKey)
			.setOrigin(0.5, 1);
		this.container.add(collector);
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

				const box = this.add.image(x, y, boxKey).setOrigin(0, 1).setScale(0.12);

				box.row = row;
				box.col = col;
				box.boxKey = boxKey;

				box.setInteractive();
				box.on("pointerdown", (pointer) => {
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
						// Store the exact grid position before destroying the box
						const gridRow = row;
						const gridCol = col;

						this.container.remove(box);
						box.destroy();
						this.boxGrid[row][col] = null;

						const lavaX = this.gridLeftX + gridCol * this.boxWidth;
						const lavaY = this.gridBottomY - gridRow * this.boxHeight;
						const lavaStartY = lavaY - 100;
						const lavaDrop = this.add
							.image(lavaX, lavaStartY, "lava_tile")
							.setOrigin(0, 1)
							.setScale(0.03)
							.setDepth(-1)
							.setAlpha(0.8);

						this.container.add(lavaDrop);
						this.lavaTiles.push(lavaDrop);

						// Update grid to track lava
						this.boxGrid[gridRow][gridCol] = lavaDrop;

						this.tweens.add({
							targets: lavaDrop,
							y: lavaY, // Move to exact grid position
							duration: 300 + gridRow * 50,
							alpha: 1,
							ease: "Sine.easeInOut",
							onComplete: () => {
								// Add wavy flowing animation to match main lava wave
								this.tweens.add({
									targets: lavaDrop,
									y: lavaY + 3,
									duration: 1500 + Math.random() * 1000, // Vary duration for organic feel
									yoyo: true,
									repeat: -1,
									ease: "Sine.easeInOut",
								});

								// Add subtle horizontal sway
								this.tweens.add({
									targets: lavaDrop,
									x: lavaX + Math.sin(Math.random() * Math.PI) * 2,
									duration: 2500 + Math.random() * 1000,
									yoyo: true,
									repeat: -1,
									ease: "Sine.easeInOut",
								});

								// Add subtle alpha pulsing for heat effect
								this.tweens.add({
									targets: lavaDrop,
									alpha: 0.6,
									duration: 800 + Math.random() * 400,
									yoyo: true,
									repeat: -1,
									ease: "Sine.easeInOut",
								});
							},
						});
					}

					this.createParticleEffects(pointer);
				});

				rowArray.push(box);
				this.container.add(box);
			}
			this.boxGrid.push(rowArray);
		}
	}

	handleLavaFlowAfterDestruction(connected, container) {
		console.log("handleLavaFlowAfterDestruction called with:", connected);

		// Add a delay before starting lava flow
		this.time.delayedCall(300, () => {
			console.log("Starting lava flow after delay");
			this.simulateGravityLavaFlow(container);
		});
	}

	simulateGravityLavaFlow(container) {
		console.log("simulateGravityLavaFlow started");
		let anyChanges = false;

		// Start from the top and work our way down, row by row
		for (let row = 0; row < this.boxGrid.length - 1; row++) {
			for (let col = 0; col < this.boxGrid[0].length; col++) {
				const currentCell = this.boxGrid[row][col];
				const belowCell = this.boxGrid[row + 1][col];

				// If current position has lava and the space below is empty
				if (
					currentCell &&
					this.lavaTiles.includes(currentCell) &&
					belowCell === null
				) {
					console.log(
						`Lava can flow from (${row}, ${col}) to (${row + 1}, ${col})`
					);
					this.createLavaAt(row + 1, col, container);
					anyChanges = true;
				}
			}
		}

		// Also check if lava can flow from the animated lava wave at the top
		// to any empty spaces in the top row
		for (let col = 0; col < this.boxGrid[0].length; col++) {
			if (this.boxGrid[0][col] === null) {
				console.log(`Lava can flow from top to (0, ${col})`);
				this.createLavaAt(0, col, container);
				anyChanges = true;
			}
		}

		// If we made any changes, check again after a short delay for cascading effects
		if (anyChanges) {
			this.time.delayedCall(200, () => {
				this.simulateGravityLavaFlow(container);
			});
		}

		console.log("simulateGravityLavaFlow finished, anyChanges:", anyChanges);
	}

	createLavaAt(row, col, container) {
		console.log(`Creating lava at (${row}, ${col})`);

		// Calculate world position using same logic as boxes
		const boxX = this.gridLeftX + col * this.boxWidth;
		const boxY = this.gridBottomY - row * this.boxHeight;

		// Convert to center position for lava tile
		const lavaX = boxX + this.boxWidth / 2;
		const lavaY = boxY - this.boxHeight / 2;

		// Create the lava tile
		const lava = this.add
			.image(lavaX, lavaY, "lava_tile")
			.setScale(this.boxScale * 0.8)
			.setAlpha(0);

		container.add(lava);

		// Animate the lava appearing
		this.tweens.add({
			targets: lava,
			alpha: 1,
			scale: this.boxScale * 0.8,
			duration: 300,
			ease: "Sine.easeOut",
			onComplete: () => {
				// Add subtle flowing animation
				this.tweens.add({
					targets: lava,
					y: lavaY + 2,
					duration: 2000,
					yoyo: true,
					repeat: -1,
					ease: "Sine.easeInOut",
				});
			},
		});

		// Update grid and lava tiles array
		this.boxGrid[row][col] = lava;
		this.lavaTiles.push(lava);
	}

	findLavaFlowPositions() {
		console.log("findLavaFlowPositions");
		const flowable = new Set();
		const queue = [];

		// Find all starting points for lava flow
		// 1. From top row (empty spaces)
		for (let col = 0; col < this.boxGrid[0].length; col++) {
			if (this.boxGrid[0][col] === null) {
				queue.push({ row: 0, col, depth: 0 });
			}
		}

		// 2. From existing lava tiles in the grid
		for (let row = 0; row < this.boxGrid.length; row++) {
			for (let col = 0; col < this.boxGrid[0].length; col++) {
				const cell = this.boxGrid[row][col];
				if (cell && this.lavaTiles.includes(cell)) {
					// Add adjacent empty spaces to queue
					const directions = [
						{ row: row - 1, col }, // up
						{ row: row + 1, col }, // down
						{ row, col: col - 1 }, // left
						{ row, col: col + 1 }, // right
					];

					for (const dir of directions) {
						if (
							this.isValidPosition(dir.row, dir.col) &&
							this.boxGrid[dir.row][dir.col] === null
						) {
							queue.push({ row: dir.row, col: dir.col, depth: 0 });
						}
					}
				}
			}
		}

		// BFS to find all reachable positions with depth for animation timing
		while (queue.length > 0) {
			const { row, col, depth } = queue.shift();
			const key = `${row},${col}`;

			if (
				!this.isValidPosition(row, col) ||
				this.boxGrid[row][col] !== null ||
				flowable.has(key)
			) {
				continue;
			}

			flowable.add(key);

			// Add adjacent empty spaces to queue with increased depth
			const directions = [
				{ row: row + 1, col }, // down (priority for gravity)
				{ row, col: col - 1 }, // left
				{ row, col: col + 1 }, // right
				{ row: row - 1, col }, // up (lowest priority)
			];

			for (const dir of directions) {
				const neighborKey = `${dir.row},${dir.col}`;
				if (
					this.isValidPosition(dir.row, dir.col) &&
					this.boxGrid[dir.row][dir.col] === null &&
					!flowable.has(neighborKey)
				) {
					queue.push({ row: dir.row, col: dir.col, depth: depth + 1 });
				}
			}
		}

		console.log("Flowable positions:", flowable);
		return flowable;
	}

	isValidPosition(row, col) {
		return (
			row >= 0 &&
			row < this.boxGrid.length &&
			col >= 0 &&
			col < this.boxGrid[0].length
		);
	}

	animateLavaFlowTo(flowPositions, container) {
		console.log("animateLavaFlowTo", flowPositions);
		if (!this.lavaTiles) this.lavaTiles = [];

		// Convert Set to Array and sort by row (top to bottom) for natural flow animation
		const sortedPositions = Array.from(flowPositions)
			.map((key) => {
				const [row, col] = key.split(",").map(Number);
				return { row, col, key };
			})
			.sort((a, b) => {
				// Sort by row first (top to bottom), then by column
				if (a.row !== b.row) return a.row - b.row;
				return a.col - b.col;
			});

		// Animate lava flow with staggered delays
		sortedPositions.forEach((pos, index) => {
			const { row, col } = pos;

			// Calculate world position using same logic as boxes
			// Boxes use origin (0,1) so position is bottom-left corner
			const boxX = this.gridLeftX + col * this.boxWidth;
			const boxY = this.gridBottomY - row * this.boxHeight;

			// Convert to center position for lava tile (default origin 0.5, 0.5)
			const lavaX = boxX + this.boxWidth / 2;
			const lavaY = boxY - this.boxHeight / 2;

			// Find nearest existing lava tile as source
			let sourceLava = null;
			let minDistance = Infinity;

			for (const existingLava of this.lavaTiles) {
				const distance = Phaser.Math.Distance.Between(
					existingLava.x,
					existingLava.y,
					lavaX,
					lavaY
				);
				if (distance < minDistance) {
					minDistance = distance;
					sourceLava = existingLava;
				}
			}

			// If no existing lava, create from top of the grid
			if (!sourceLava) {
				sourceLava = {
					x: lavaX,
					y: this.gridTopY,
				};
			}

			// Create new lava tile
			const lava = this.add
				.image(sourceLava.x, sourceLava.y, "lava_tile")
				.setScale(this.boxScale * 0.8) // Slightly smaller than boxes
				.setAlpha(0.8);

			container.add(lava);

			// Animate lava flowing to position
			this.tweens.add({
				targets: lava,
				x: lavaX,
				y: lavaY,
				alpha: 1,
				duration: 400,
				delay: index * 100, // Staggered animation
				ease: "Sine.easeOut",
				onComplete: () => {
					// Add flowing animation
					this.tweens.add({
						targets: lava,
						y: lavaY + 2,
						duration: 2000,
						yoyo: true,
						repeat: -1,
						ease: "Sine.easeInOut",
					});
				},
			});

			// Update grid and lava tiles array
			this.boxGrid[row][col] = lava;
			this.lavaTiles.push(lava);
		});

		console.log("==== After animateLavaFlowTo ====");
	}

	isOpenFromTop(row, col) {
		for (let r = 0; r < row; r++) {
			if (this.boxGrid[r][col] !== null) return false;
		}
		return true;
	}

	findReachableNullsFromTop() {
		console.log("findReachableNullsFromTop");
		const reachable = new Set();
		const stack = [];

		for (let row = 0; row < this.boxGrid.length; row++) {
			for (let col = 0; col < this.boxGrid[0].length; col++) {
				if (this.boxGrid[row][col] === null) {
					stack.push({ row, col });
				}
			}
		}
		console.log("Starting stack:", stack);

		while (stack.length > 0) {
			const { row, col } = stack.pop();
			const key = `${row},${col}`;

			if (
				row < 0 ||
				row >= this.boxGrid.length ||
				col < 0 ||
				col >= this.boxGrid[0].length ||
				this.boxGrid[row][col] !== null ||
				reachable.has(key)
			) {
				continue;
			}

			reachable.add(key);

			stack.push({ row: row - 1, col });
			stack.push({ row: row + 1, col });
			stack.push({ row, col: col - 1 });
			stack.push({ row, col: col + 1 });
		}

		console.log("==== After findReachableNullsFromTop ====");

		return reachable;
	}

	getBoxY(row) {
		const y = this.gridBottomY - row * this.boxHeight;
		console.log(`getBoxY(${row}) = ${y}`);
		return y;
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
	}

	create() {
		this.adNetworkSetup();

		this.initalizeGame();

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
	}

	update() {
		// Check for game over condition
		if (this.scoreValue <= 0) {
			// TODO: Implement game restart functionality
			console.log("Game Over - Score reached 0");
		}
	}
}
