const canvas = document.getElementById("mazeCanvas");
const ctx = canvas.getContext("2d");

const statusEl = document.getElementById("status");
const resetBtn = document.getElementById("resetBtn");
const solutionBtn = document.getElementById("solutionBtn");

// Nastavitve velikosti labirinta in animacije
const ROWS = 25;      // Število vrstic
const COLS = 25;      // Število stolpcev
const CELL = 24;      // Velikost ene celice v px
const WALL = 2;       // Debelina stene
const PAD = 12;       // Odmik od roba
const MOVE_MS = 120;  // Čas trajanja enega premika (ms)

const BLOCK_COLORS = [
  "#20e2ff",
  "#ffe35b",
  "#9f64ff",
  "#68ef7b",
  "#ff5e84",
  "#4f8dff",
  "#ff9f43"
];
// Nastavimo dejansko resolucijo canvas elementa
canvas.width = COLS * CELL + PAD * 2;
canvas.height = ROWS * CELL + PAD * 2;

// Tabele za shranjevanje sten
let horizontalWalls = [];
let verticalWalls = [];

// Stanje igralca in igre
let player = { row: 0, col: 0 }; // Trenutna pozicija igralca
let moveState = null;            // Podatki o trenutni animaciji premika
let hasWon = false;              // Ali je igralec že zmagal
let showSolution = false;        // Ali se prikazuje rešitev
let trailBlocks = new Map();     // Mapa blokov sledi

// Objekt za sledenje pritisnjenih tipk
const keys = {};
// Ob pritisku tipke
window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  keys[key] = true;
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
    e.preventDefault();
  }
});
// Ob spustu tipke
window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});
// Ustvari 2D tabelo z začetno vrednostjo
function create2D(rows, cols, value) {
  return Array.from({ length: rows }, () => Array(cols).fill(value));
}
// Preveri, ali je celica znotraj meja labirinta
function inBounds(r, c) {
  return r >= 0 && r < ROWS && c >= 0 && c < COLS;
}
// Naključno premeša elemente v tabeli
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
// Odstrani steno med dvema sosednjima celicama
function removeWall(r, c, nr, nc) {
  if (nr === r - 1) horizontalWalls[r][c] = false;
  if (nr === r + 1) horizontalWalls[r + 1][c] = false;
  if (nc === c - 1) verticalWalls[r][c] = false;
  if (nc === c + 1) verticalWalls[r][c + 1] = false;
}

function generateMaze() {
  horizontalWalls = create2D(ROWS + 1, COLS, true);
  verticalWalls = create2D(ROWS, COLS + 1, true);

  const visited = create2D(ROWS, COLS, false);// Sledi obiskanim celicam

  function carve(r, c) {
    visited[r][c] = true;
// Naključno premešamo smeri
    const dirs = shuffle([
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1]
    ]);

    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      // Če je izven meja ali že obiskana, preskočimo
      if (!inBounds(nr, nc) || visited[nr][nc]) {
        continue;
      }
      removeWall(r, c, nr, nc);// Odstranimo steno
      carve(nr, nc);// Rekurzivno nadaljujemo
    }
  }

  carve(0, 0);

  horizontalWalls[0][0] = false;
  horizontalWalls[ROWS][COLS - 1] = false;
}
// Preveri, ali je med celicama stena
function wallBetween(r, c, dr, dc) {
  if (dr === -1) return horizontalWalls[r][c];
  if (dr === 1) return horizontalWalls[r + 1][c];
  if (dc === -1) return verticalWalls[r][c];
  return verticalWalls[r][c + 1];
}

function tryStartMove(dr, dc) {
  if (moveState || hasWon) {
    return;
  }

  const nr = player.row + dr;
  const nc = player.col + dc;
// Če je izven meja ali je stena, se ne premaknemo
  if (!inBounds(nr, nc) || wallBetween(player.row, player.col, dr, dc)) {
    return;
  }
// Nastavimo podatke za animacijo premika
  moveState = {
    from: { row: player.row, col: player.col },
    to: { row: nr, col: nc },
    start: performance.now()
  };
}
// Obdelava tipk
function handleInput() {
  if (keys.w || keys.arrowup) tryStartMove(-1, 0);
  else if (keys.s || keys.arrowdown) tryStartMove(1, 0);
  else if (keys.a || keys.arrowleft) tryStartMove(0, -1);
  else if (keys.d || keys.arrowright) tryStartMove(0, 1);
}
// Ustvari unikaten ključ za celico
function keyForCell(row, col) {
  return `${row},${col}`;
}
// Doda barvni blok na prehojeno celico
function addTrailBlock(row, col) {
  const key = keyForCell(row, col);
  // Če že obstaja, ne dodamo ponovno
  if (trailBlocks.has(key)) {
    return;
  }
// Izbere barvo glede na indeks
  const color = BLOCK_COLORS[(trailBlocks.size + row + col) % BLOCK_COLORS.length];
  trailBlocks.set(key, {
    row,
    col,
    color,
    placedAt: performance.now()
  });
}
// Posodobi stanje premika
function updateMovement(now) {
  if (!moveState) {
    return;
  }

  const t = Math.min(1, (now - moveState.start) / MOVE_MS);

  if (t >= 1) {
    addTrailBlock(player.row, player.col);// Doda sled
// Posodobimo pozicijo igralca
    player.row = moveState.to.row;
    player.col = moveState.to.col;
    moveState = null;
// Preverimo zmago
    if (player.row === ROWS - 1 && player.col === COLS - 1) {
      hasWon = true;
      statusEl.textContent = "ZMAGA! Block blast run uspešeno rešen.";
      statusEl.style.color = "#ffe45e";
    }
  }
}

function playerPixelPosition(now) {
  const centerFromCell = (r, c) => ({
    x: PAD + c * CELL + CELL / 2,
    y: PAD + r * CELL + CELL / 2
  });

  if (!moveState) {
    return centerFromCell(player.row, player.col);
  }

  const t = Math.min(1, (now - moveState.start) / MOVE_MS);
  const a = centerFromCell(moveState.from.row, moveState.from.col);
  const b = centerFromCell(moveState.to.row, moveState.to.col);

  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t
  };
}

function shortestPath(from, to) {
  const queue = [from];
  const prev = create2D(ROWS, COLS, null);
  prev[from.row][from.col] = { row: from.row, col: from.col };

  while (queue.length) {
    const cur = queue.shift();
    if (cur.row === to.row && cur.col === to.col) {
      break;
    }

    const dirs = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1]
    ];

    for (const [dr, dc] of dirs) {
      const nr = cur.row + dr;
      const nc = cur.col + dc;
      if (!inBounds(nr, nc) || wallBetween(cur.row, cur.col, dr, dc) || prev[nr][nc]) {
        continue;
      }
      prev[nr][nc] = { row: cur.row, col: cur.col };
      queue.push({ row: nr, col: nc });
    }
  }

  const path = [];
  let cur = to;
  if (!prev[to.row][to.col]) {
    return path;
  }

  while (!(cur.row === from.row && cur.col === from.col)) {
    path.push(cur);
    cur = prev[cur.row][cur.col];
  }
  path.push(from);
  path.reverse();
  return path;
}

function drawBoardGrid() {
  ctx.strokeStyle = "rgba(142, 175, 255, 0.16)";
  ctx.lineWidth = 1;

  for (let r = 0; r <= ROWS; r += 1) {
    const y = PAD + r * CELL;
    ctx.beginPath();
    ctx.moveTo(PAD, y);
    ctx.lineTo(PAD + COLS * CELL, y);
    ctx.stroke();
  }

  for (let c = 0; c <= COLS; c += 1) {
    const x = PAD + c * CELL;
    ctx.beginPath();
    ctx.moveTo(x, PAD);
    ctx.lineTo(x, PAD + ROWS * CELL);
    ctx.stroke();
  }
}

function drawTrailBlocks(now) {
  trailBlocks.forEach((block) => {
    const age = now - block.placedAt;
    const appear = Math.min(1, age / 140);
    const inset = (CELL * (1 - appear)) / 2 + 3;
    const x = PAD + block.col * CELL + inset;
    const y = PAD + block.row * CELL + inset;
    const size = CELL - inset * 2;

    ctx.fillStyle = block.color;
    ctx.fillRect(x, y, size, size);

    ctx.fillStyle = "rgba(255,255,255,0.34)";
    ctx.fillRect(x + 2, y + 2, size * 0.62, size * 0.26);

    ctx.strokeStyle = "rgba(9, 21, 54, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 0.7, y + 0.7, size - 1.4, size - 1.4);
  });
}

function drawMazeWalls() {
  ctx.strokeStyle = "#aee8ff";
  ctx.lineWidth = WALL;
  ctx.lineCap = "square";

  for (let r = 0; r <= ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      if (!horizontalWalls[r][c]) continue;
      const x1 = PAD + c * CELL;
      const y = PAD + r * CELL;
      const x2 = x1 + CELL;
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.stroke();
    }
  }

  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c <= COLS; c += 1) {
      if (!verticalWalls[r][c]) continue;
      const x = PAD + c * CELL;
      const y1 = PAD + r * CELL;
      const y2 = y1 + CELL;
      ctx.beginPath();
      ctx.moveTo(x, y1);
      ctx.lineTo(x, y2);
      ctx.stroke();
    }
  }
}

function drawStartAndGoal() {
  const startX = PAD + 3;
  const startY = PAD + 3;
  const goalX = PAD + (COLS - 1) * CELL + 3;
  const goalY = PAD + (ROWS - 1) * CELL + 3;
  const size = CELL - 6;

  ctx.fillStyle = "#22d77a";
  ctx.fillRect(startX, startY, size, size);
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.fillRect(startX + 2, startY + 2, size * 0.62, size * 0.25);

  ctx.fillStyle = "#ffd54a";
  ctx.fillRect(goalX, goalY, size, size);
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.fillRect(goalX + 2, goalY + 2, size * 0.62, size * 0.25);
}

function drawSolutionLine() {
  if (!showSolution) {
    return;
  }

  const from = moveState ? moveState.to : { row: player.row, col: player.col };
  const to = { row: ROWS - 1, col: COLS - 1 };
  const path = shortestPath(from, to);

  if (path.length < 2) {
    return;
  }

  ctx.strokeStyle = "rgba(122, 245, 255, 0.65)";
  ctx.lineWidth = Math.max(2, CELL * 0.2);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();

  path.forEach((cell, i) => {
    const x = PAD + cell.col * CELL + CELL / 2;
    const y = PAD + cell.row * CELL + CELL / 2;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();
}

function drawPlayer(now) {
  const pos = playerPixelPosition(now);
  const size = CELL * 0.56;
  const x = pos.x - size / 2;
  const y = pos.y - size / 2;

  ctx.fillStyle = "#ff4a78";
  ctx.fillRect(x, y, size, size);

  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillRect(x + 2, y + 2, size * 0.6, size * 0.24);

  ctx.strokeStyle = "rgba(53, 9, 26, 0.6)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 0.7, y + 0.7, size - 1.4, size - 1.4);
}

function draw(now) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBoardGrid();
  drawTrailBlocks(now);
  drawSolutionLine();
  drawMazeWalls();
  drawStartAndGoal();
  drawPlayer(now);
}

function resetGame(newMaze) {
  if (newMaze) {
    generateMaze();
  }
  player = { row: 0, col: 0 };
  moveState = null;
  hasWon = false;
  trailBlocks = new Map();
  statusEl.textContent = "";
  statusEl.style.color = "#79ff95";
}

resetBtn.addEventListener("click", () => {
  resetGame(true);
});

solutionBtn.addEventListener("click", () => {
  showSolution = !showSolution;
  solutionBtn.textContent = showSolution ? "Skrij rešitev" : "Prikaži rešitev";
});

function gameLoop(now) {
  handleInput();
  updateMovement(now);
  draw(now);
  requestAnimationFrame(gameLoop);
}

generateMaze();
resetGame(false);
requestAnimationFrame(gameLoop);
