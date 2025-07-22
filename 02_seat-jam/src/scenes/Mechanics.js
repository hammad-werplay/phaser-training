class Cell {
	constructor(row, col, type = "nonSeat", seatLabel) {
		this.row = row;
		this.col = col;
		this.type = type;
		this.isBlocked = false;
		this.visual = null;
		this._robot = null;
		this.seatLabel = seatLabel;
	}

	get robot() {
		return this._robot;
	}

	set robot(value) {
		this._robot = value;
		this.isBlocked = !!value;
	}

	/**
	 * Return neighbor cells based on movement rules:
	 * - seats: left/right only
	 * - nonSeats: up/down/left/right
	 */
	getNeighbors(grid) {
		const deltas =
			this.type === "seat"
				? [
						[0, 1],
						[0, -1],
				  ]
				: [
						[0, 1],
						[0, -1],
						[1, 0],
						[-1, 0],
				  ];

		const neighbors = [];
		for (const [dRow, dCol] of deltas) {
			const newRow = this.row + dRow;
			const newCol = this.col + dCol;
			const cell = grid.getCell(newRow, newCol);

			if (cell && !cell.isBlocked) {
				if (dRow !== 0 && cell.type === "seat") continue;
				neighbors.push(cell);
			}
		}

		return neighbors;
	}

	key() {
		return `${this.row},${this.col}`;
	}
}

export class Grid {
	constructor(rows = 6, cols = 4, seats) {
		this.rows = rows;
		this.cols = cols;

		const seatPositions = Object.values(seats);
		const seatLabels = Object.keys(seats);

		// initialize a 2D array of Cells
		this.cells = Array.from({ length: rows }, (_, row) => {
			return Array.from({ length: cols }, (_, col) => {
				const type = seatPositions.some(([seatRow, seatCol]) => {
					return seatRow === row && seatCol === col;
				})
					? "seat"
					: "nonSeat";

				const seatLabel = seatLabels.find((label) => {
					const [seatRow, seatCol] = seats[label];
					return seatRow === row && seatCol === col;
				});

				return new Cell(row, col, type, seatLabel);
			});
		});
	}

	/**
	 * Get the Cell at (row, col) if in-bounds, else null
	 */
	getCell(row, col) {
		if (row < 0 || row > this.rows - 1 || col < 0 || col > this.cols - 1) {
			return null;
		}
		return this.cells[row][col];
	}

	/**
	 * Mark a blocker on the cell at (r, c)
	 */
	setBlocker(row, col) {
		const cell = this.getCell(row, col);
		if (cell) {
			cell.isBlocked = true;
		}
	}

	/**
	 * Utility: return all seat Cells
	 */
	getSeats() {
		const seats = [];
		for (let row = 0; row < this.rows - 1; row++) {
			for (let col = 0; col < this.cols - 1; col++) {
				const cell = this.getCell(row, col);
				if (cell && cell.type === "seat") {
					seats.push(cell);
				}
			}
		}
		return seats;
	}
}

export class PathFinder {
	constructor(grid) {
		this.grid = grid;
	}

	/**
	 * Find shortest path from startCell to endCell using BFS.
	 * Returns an array of Cells or null if unreachable.
	 */
	findShortestPath(startCell, endCell) {
		const queue = [[startCell]];

		const visited = new Set([startCell.key()]);

		while (queue.length > 0) {
			const path = queue.shift();
			const cell = path[path.length - 1];

			// reached destination
			if (cell.key() === endCell.key()) {
				return path;
			}

			// explore neighbors
			for (const neighbor of cell.getNeighbors(this.grid)) {
				const key = neighbor.key();
				if (!visited.has(key)) {
					visited.add(key);
					const newPath = [...path, neighbor];
					queue.push(newPath);
				}
			}
		}

		// no path found
		return null;
	}
}

function movePlayerAlongPath(path) {
	if (!path || path.length === 0) {
		console.error("No path found");
		return;
	}

	let index = 0;
	let previousCell = null;
	const interval = setInterval(() => {
		if (index >= path.length) {
			clearInterval(interval);
			return;
		}

		const cell = path[index];

		if (previousCell && previousCell.element) {
			previousCell.element.classList.remove("player");
		}

		if (cell.element) {
			cell.element.classList.add("player");
			cell.element.style.transition = "all 0.3s ease";
		}

		if (index === path.length - 1) {
			clearInterval(interval);

			setTimeout(() => {
				cell.element.classList.remove("player");
				cell.element.classList.remove("end");
				cell.element.classList.add("blocked");
				cell.isBlocked = true;
			}, 500);
		}

		previousCell = cell;
		index++;
	}, 500);
}

function init() {
	const seats = [
		[1, 1],
		[1, 2],
		[2, 1],
		[2, 2],
		[3, 1],
		[3, 2],
		[4, 1],
		[4, 2],
	];
	const grid = new Grid(6, 4, seats);
	const pathFinder = new PathFinder(grid);

	grid.setBlocker(0, 1);
	grid.setBlocker(1, 1);
	grid.setBlocker(3, 3);
	grid.setBlocker(3, 0);

	const cells = grid.cells;

	let selectedCell = null;
	for (const row of cells) {
		for (const cell of row) {
			cell.element.addEventListener("click", () => {
				if (!selectedCell) {
					selectedCell = cell;
					cell.element.classList.add("selected");
					return;
				}

				const start = selectedCell;
				const end = cell;

				const path = pathFinder.findShortestPath(start, end);

				if (!path) {
					console.error("No path found");
					selectedCell = null;
					return;
				}

				movePlayerAlongPath(path);

				selectedCell = null;
			});
		}
	}
}
