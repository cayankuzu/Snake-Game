const canvas = document.querySelector("#gameCanvas");
const context = canvas.getContext("2d");
const overlay = document.querySelector("#gameOverlay");
const overlayTitle = document.querySelector("#overlayTitle");
const overlayText = document.querySelector("#overlayText");
const startButton = document.querySelector("#startButton");
const helpButton = document.querySelector("#helpButton");
const soundButton = document.querySelector("#soundButton");
const directionButtons = [...document.querySelectorAll("[data-direction]")];

const SIZE = 600;
const CELL = 20;
const GRID = SIZE / CELL;
const TICK_MS = 50;
const pickupSound = new Audio("pick_up_sound.wav");
const helpTitle = overlayTitle.textContent;
const helpMarkup = overlayText.innerHTML;

let snake = [];
let apple = { x: 25, y: 25 };
let direction = { x: 0, y: 0 };
let nextDirection = { x: 0, y: 0 };
let score = 0;
let running = false;
let hasStarted = false;
let finished = false;
let soundEnabled = true;
let overlayMode = "start";
let accumulator = 0;
let lastTime = 0;
let touchStart = null;

function resetGame() {
  snake = [{ x: 15, y: 20 }];
  direction = { x: 0, y: 0 };
  nextDirection = { x: 0, y: 0 };
  score = 0;
  finished = false;
  placeApple();
}

function placeApple() {
  const emptyCells = [];
  for (let y = 0; y < GRID; y += 1) {
    for (let x = 0; x < GRID; x += 1) {
      if (!snake.some((segment) => segment.x === x && segment.y === y)) {
        emptyCells.push({ x, y });
      }
    }
  }
  apple = emptyCells[Math.floor(Math.random() * emptyCells.length)] ?? { x: 25, y: 25 };
}

function startGame() {
  resetGame();
  overlay.classList.remove("is-visible");
  startButton.textContent = "Tekrar oyna";
  running = true;
  hasStarted = true;
  overlayMode = "resume";
  accumulator = 0;
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function finishGame() {
  running = false;
  hasStarted = false;
  finished = true;
  overlayMode = "restart";
  overlayTitle.textContent = `Final skor: ${score}`;
  overlayText.innerHTML =
    `<p>Yılanın ${snake.length} kare uzunluğa ulaştı. Yeni bir rota için tekrar başlayabilirsin.</p>`;
  startButton.textContent = "Tekrar oyna";
  overlay.classList.add("is-visible");
}

function showHelp() {
  const canResume = hasStarted && !finished;
  running = false;
  overlayMode = canResume ? "resume" : "start";
  overlayTitle.textContent = helpTitle;
  overlayText.innerHTML = helpMarkup;
  startButton.textContent = canResume ? "Oyuna dön" : "Oyuna başla";
  overlay.classList.add("is-visible");
}

function handleOverlayAction() {
  if (overlayMode === "resume") {
    overlay.classList.remove("is-visible");
    running = true;
    accumulator = 0;
    lastTime = performance.now();
    requestAnimationFrame(loop);
    return;
  }
  startGame();
}

function setDirection(name) {
  const candidate = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  }[name];
  if (!candidate) return;

  const reversing =
    snake.length > 1 &&
    candidate.x === -direction.x &&
    candidate.y === -direction.y;
  if (!reversing) nextDirection = candidate;
}

function step() {
  direction = nextDirection;
  if (direction.x === 0 && direction.y === 0) return;

  const head = snake[0];
  const nextHead = {
    x: head.x + direction.x,
    y: head.y + direction.y,
  };
  const outside =
    nextHead.x < 0 ||
    nextHead.x >= GRID ||
    nextHead.y < 0 ||
    nextHead.y >= GRID;
  const hitsBody = snake.some(
    (segment) => segment.x === nextHead.x && segment.y === nextHead.y,
  );

  if (outside || hitsBody) {
    finishGame();
    return;
  }

  snake.unshift(nextHead);
  if (nextHead.x === apple.x && nextHead.y === apple.y) {
    score += 1;
    if (soundEnabled) {
      pickupSound.currentTime = 0;
      pickupSound.play().catch(() => {});
    }
    placeApple();
  } else {
    snake.pop();
  }
}

function draw() {
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, SIZE, SIZE);

  context.strokeStyle = "rgba(10, 50, 10, .055)";
  context.lineWidth = 1;
  for (let index = 0; index <= GRID; index += 1) {
    context.beginPath();
    context.moveTo(index * CELL, 0);
    context.lineTo(index * CELL, SIZE);
    context.stroke();
    context.beginPath();
    context.moveTo(0, index * CELL);
    context.lineTo(SIZE, index * CELL);
    context.stroke();
  }

  context.fillStyle = "#0a320a";
  context.font = "700 40px Georgia, serif";
  context.textBaseline = "top";
  context.fillText(`Score: ${score}`, 12, 10);

  context.textAlign = "center";
  context.fillStyle = "rgba(114, 13, 13, .1)";
  context.font = "800 68px Georgia, serif";
  context.fillText("SNAKE", SIZE / 2, SIZE / 2 - 42);
  context.textAlign = "left";

  context.fillStyle = "#dc2424";
  context.fillRect(apple.x * CELL + 2, apple.y * CELL + 2, CELL - 4, CELL - 4);

  snake.forEach((segment, index) => {
    context.fillStyle = index === 0 ? "#00e83b" : "#0a320a";
    context.fillRect(segment.x * CELL + 1, segment.y * CELL + 1, CELL - 2, CELL - 2);
  });
}

function loop(now) {
  if (!running) return;
  accumulator += Math.min(now - lastTime, 100);
  lastTime = now;
  while (accumulator >= TICK_MS && running) {
    step();
    accumulator -= TICK_MS;
  }
  draw();
  if (running) requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  const directionName = {
    ArrowUp: "up",
    KeyW: "up",
    ArrowDown: "down",
    KeyS: "down",
    ArrowLeft: "left",
    KeyA: "left",
    ArrowRight: "right",
    KeyD: "right",
  }[event.code];
  if (!directionName) return;
  event.preventDefault();
  setDirection(directionName);
});

directionButtons.forEach((button) => {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    setDirection(button.dataset.direction);
    button.classList.add("is-active");
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach((eventName) => {
    button.addEventListener(eventName, () => button.classList.remove("is-active"));
  });
});

canvas.addEventListener("pointerdown", (event) => {
  touchStart = { x: event.clientX, y: event.clientY };
  canvas.setPointerCapture?.(event.pointerId);
});

canvas.addEventListener("pointerup", (event) => {
  if (!touchStart) return;
  const deltaX = event.clientX - touchStart.x;
  const deltaY = event.clientY - touchStart.y;
  touchStart = null;
  if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 18) return;
  setDirection(
    Math.abs(deltaX) > Math.abs(deltaY)
      ? deltaX > 0 ? "right" : "left"
      : deltaY > 0 ? "down" : "up",
  );
});

canvas.addEventListener("pointercancel", () => {
  touchStart = null;
});

startButton.addEventListener("click", handleOverlayAction);
helpButton.addEventListener("click", showHelp);
soundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  pickupSound.muted = !soundEnabled;
  soundButton.textContent = soundEnabled ? "Ses açık" : "Ses kapalı";
  soundButton.setAttribute("aria-pressed", String(soundEnabled));
});

window.addEventListener("blur", () => {
  if (running) showHelp();
});

resetGame();
draw();
