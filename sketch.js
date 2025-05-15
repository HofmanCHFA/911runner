// --- Game Configuration ---
const GRAVITY = 0.6;
const JUMP_FORCE = -13;
const GROUND_LEVEL_PERCENT = 0.85;
const START_SPEED = 6;
const MAX_SPEED = 18;
const SPEED_INCREMENT = 0.005;
const MIN_SPAWN_INTERVAL = 50;
const MAX_SPAWN_INTERVAL = 150;

// --- Global Variables ---
let porsche;
let obstacles = [];
let bgLayers = [];
let score = 0;
let gameState = 'start';
let gameSpeed;
let groundY;
let spawnTimer = 0;
let nextSpawnInterval;

// --- p5.js Core Functions ---

function preload() {
  console.log("Preload complete.");
}

function setup() {
  let canvasWidth = min(windowWidth * 0.9, 1000);
  let canvasHeight = windowHeight * 0.7;
  createCanvas(canvasWidth, canvasHeight);

  console.log(`Canvas created: ${width}x${height}`);

  groundY = height * GROUND_LEVEL_PERCENT;
  gameSpeed = START_SPEED;
  nextSpawnInterval = floor(random(MIN_SPAWN_INTERVAL, MAX_SPAWN_INTERVAL));

  porsche = new Porsche();

  bgLayers.push(new BackgroundLayer(color(200, 230, 255), 0.1));
  bgLayers.push(new BackgroundLayer(color(160, 210, 250), 0.3));
  bgLayers.push(new BackgroundLayer(color(100, 150, 100), 0.6, true));

  textAlign(CENTER, CENTER);
  textSize(24);
  noSmooth(); // For pixelated look
  console.log("Setup complete. Initializing game state: " + gameState);
}

function draw() {
  background(135, 206, 250); // Sky blue

  for (let layer of bgLayers) {
    layer.update();
    layer.show();
  }

  fill(188, 143, 143); // Ground color
  noStroke();
  rect(0, groundY, width, height - groundY);

  switch (gameState) {
    case 'start':
      displayStartScreen();
      porsche.show();
      break;
    case 'playing':
      runGame();
      break;
    case 'gameOver':
      runGameOver();
      break;
  }
}

// --- Game State Functions ---

function runGame() {
  porsche.update();
  handleObstacles();
  updateGameSpeedAndDifficulty();
  score++;

  porsche.show();
  drawObstacles();
  displayHUD();
}

function runGameOver() {
  porsche.show();
  drawObstacles();
  displayGameOverScreen();
}

function displayStartScreen() {
  fill(0, 0, 0, 180);
  rect(0, height / 4, width, height / 2);

  fill(255, 255, 0);
  textSize(32);
  textFont('monospace');
  text('PORSCHE 911 DASH', width / 2, height / 3);

  fill(255);
  textSize(20);
  text('Press SPACE or Click to Start', width / 2, height / 2);
}

function displayGameOverScreen() {
  fill(0, 0, 0, 150);
  rect(0, 0, width, height);

  fill(255, 0, 0);
  textSize(48);
  textFont('monospace');
  text('GAME OVER', width / 2, height / 3);

  fill(255);
  textSize(24);
  text(`Score: ${floor(score / 10)}`, width / 2, height / 2);
  textSize(20);
  text('Press SPACE or Click to Restart', width / 2, height / 2 + 60);
}

function displayHUD() {
  fill(255);
  stroke(0);
  strokeWeight(2);
  textSize(24);
  textAlign(LEFT, TOP);
  textFont('monospace');
  text(`Score: ${floor(score / 10)}`, 20, 20);

  fill(0, 0, 0, 180);
  noStroke();
  rect(width / 2 - 150, height - 50, 300, 35, 5);
  fill(255);
  textSize(18);
  textAlign(CENTER, CENTER);
  text('SPACEBAR / CLICK to JUMP', width / 2, height - 32);
  noStroke();
}

// --- Game Mechanics ---

function handleObstacles() {
  spawnTimer++;
  if (spawnTimer >= nextSpawnInterval) {
    obstacles.push(new Obstacle());
    spawnTimer = 0;
    let adjustedMin = max(30, MIN_SPAWN_INTERVAL - floor(gameSpeed * 1.5));
    let adjustedMax = max(60, MAX_SPAWN_INTERVAL - floor(gameSpeed * 2));
    nextSpawnInterval = floor(random(adjustedMin, adjustedMax));
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].update();
    if (obstacles[i].isOffscreen()) {
      obstacles.splice(i, 1);
    } else if (obstacles[i].hits(porsche)) {
      if (gameState === 'playing') {
        gameOver();
      }
    }
  }
}

function drawObstacles() {
  for (let obs of obstacles) {
    obs.show();
  }
}

function updateGameSpeedAndDifficulty() {
  if (gameSpeed < MAX_SPEED) {
    gameSpeed += SPEED_INCREMENT;
  }
}

function gameOver() {
  console.log("Game Over! Final Score:", floor(score / 10));
  gameState = 'gameOver';
}

function resetGame() {
  console.log("Resetting game...");
  porsche = new Porsche();
  obstacles = [];
  score = 0;
  gameSpeed = START_SPEED;
  spawnTimer = 0;
  nextSpawnInterval = floor(random(MIN_SPAWN_INTERVAL, MAX_SPAWN_INTERVAL));
  gameState = 'playing';
  console.log("Game reset. State: " + gameState);
}

// --- Input Handling ---

function keyPressed() {
  if (key === ' ') {
    handleGameInput();
    return false; // Prevent browser default space bar scroll
  }
}

function mousePressed() {
  handleGameInput();
}

function handleGameInput() {
  console.log("Input detected. Game state:", gameState);
  switch (gameState) {
    case 'start':
      gameState = 'playing';
      console.log("Game starting...");
      break;
    case 'playing':
      porsche.jump();
      break;
    case 'gameOver':
      resetGame();
      break;
  }
}

// --- Utility Functions ---

function windowResized() {
  let canvasWidth = min(windowWidth * 0.9, 1000);
  let canvasHeight = windowHeight * 0.7;
  resizeCanvas(canvasWidth, canvasHeight);
  groundY = height * GROUND_LEVEL_PERCENT;
  if (porsche) {
    porsche.baseY = groundY - porsche.h;
    if (porsche.y < porsche.baseY && porsche.vy === 0) {
      porsche.y = porsche.baseY;
    } else if (porsche.y > porsche.baseY) {
      porsche.y = porsche.baseY;
      porsche.vy = 0;
    }
  }
  console.log(`Window resized. New canvas: ${width}x${height}. New groundY: ${groundY}`);
}


// --- Classes ---

class Porsche {
  constructor() {
    this.w = 100;
    this.h = 40;
    this.x = 100;
    this.baseY = groundY - this.h;
    this.y = this.baseY;
    this.vy = 0;
    this.isJumping = false;

    this.bodyColor = color(200, 0, 0);
    this.windowColor = color(100, 150, 200, 200);
    this.wheelColor = color(30, 30, 30);
    this.wheelRimColor = color(80, 80, 80); // Lighter color for rim
    this.spoilerColor = color(40, 40, 40);
    this.headlightColor = color(255, 255, 220);
  }

  jump() {
    if (!this.isJumping) {
      this.vy = JUMP_FORCE;
      this.isJumping = true;
    }
  }

  update() {
    this.vy += GRAVITY;
    this.y += this.vy;

    if (this.y >= this.baseY) {
      this.y = this.baseY;
      this.vy = 0;
      if (this.isJumping) {
        this.isJumping = false;
      }
    }
  }

  show() {
    push();
    translate(this.x, this.y);

    // --- Wheels (drawn first, now with rim detail) ---
    let wheelRadius = this.h * 0.38;
    let wheelYOffset = this.h - wheelRadius * 0.95;
    noStroke();

    // New Front Wheel (previously rear)
    fill(this.wheelColor);
    ellipse(this.w * (1 - 0.22), wheelYOffset, wheelRadius * 2, wheelRadius * 2); // Flipped X
    fill(this.wheelRimColor);
    ellipse(this.w * (1 - 0.22), wheelYOffset, wheelRadius * 1.2, wheelRadius * 1.2); // Flipped X, smaller rim

    // New Rear Wheel (previously front)
    fill(this.wheelColor);
    ellipse(this.w * (1 - 0.78), wheelYOffset, wheelRadius * 2, wheelRadius * 2); // Flipped X
    fill(this.wheelRimColor);
    ellipse(this.w * (1 - 0.78), wheelYOffset, wheelRadius * 1.2, wheelRadius * 1.2); // Flipped X, smaller rim


    // --- Main Body (All X-coordinates are flipped) ---
    fill(this.bodyColor);
    beginShape();
    vertex(this.w * 1, this.h * 0.55);                 // Was 0 -> Front lip, bottom point (now rightmost)
    vertex(this.w * (1 - 0.05), this.h * 0.4);         // Was 0.05 -> Mid front bumper
    vertex(this.w * (1 - 0.18), this.h * 0.25);        // Was 0.18 -> Top of front fender arch start
    vertex(this.w * (1 - 0.35), this.h * 0.2);         // Was 0.35 -> Hood line
    vertex(this.w * (1 - 0.4), this.h * 0.05);         // Was 0.4 -> Base of windshield
    vertex(this.w * (1 - 0.45), 0);                    // Was 0.45 -> Top of windshield
    vertex(this.w * (1 - 0.65), 0);                    // Was 0.65 -> Apex of roof curve
    vertex(this.w * (1 - 0.8), this.h * 0.1);          // Was 0.8 -> Rear roofline slope
    vertex(this.w * (1 - 0.9), this.h * 0.35);         // Was 0.9 -> Top of rear deck
    vertex(this.w * (1 - 0.98), this.h * 0.45);        // Was 0.98 -> Rear end, top of bumper
    vertex(this.w * (1 - 1), this.h * 0.7);            // Was 1 (this.w) -> Rear bumper bottom point (now leftmost)
    vertex(this.w * (1 - 0.85), this.h);               // Was 0.85 -> Underside, by new rear wheel
    vertex(this.w * (1 - 0.15), this.h);               // Was 0.15 -> Underside, by new front wheel
    vertex(this.w * 1, this.h * 0.75);                 // Was 0 -> Bottom of front lip
    endShape(CLOSE);

    // --- Windows (All X-coordinates are flipped) ---
    fill(this.windowColor);
    beginShape();
    vertex(this.w * (1 - 0.41), this.h * 0.08);   // Windshield top-front
    vertex(this.w * (1 - 0.63), this.h * 0.08);   // Windshield top-rear
    vertex(this.w * (1 - 0.75), this.h * 0.18);   // Side window rear top
    vertex(this.w * (1 - 0.72), this.h * 0.38);   // Side window rear bottom
    vertex(this.w * (1 - 0.45), this.h * 0.38);   // Side window front bottom
    vertex(this.w * (1 - 0.42), this.h * 0.2);    // Windshield front-bottom
    endShape(CLOSE);

    // --- Spoiler (All X-coordinates are flipped) ---
    fill(this.spoilerColor);
    // Spoiler uprights/supports
    // Original right support (this.w * 0.90) becomes new left support
    rect(this.w * (1 - (0.90 + 0.03)), this.h * 0.2, this.w * 0.03, this.h * 0.15);
    // Original left support (this.w * 0.82) becomes new right support
    rect(this.w * (1 - (0.82 + 0.03)), this.h * 0.2, this.w * 0.03, this.h * 0.15);

    // Spoiler wing element
    beginShape();
    vertex(this.w * (1 - 0.8), this.h * 0.15);    // Wing front-left (now right)
    vertex(this.w * (1 - 0.95), this.h * 0.15);   // Wing front-right (now left)
    vertex(this.w * (1 - 0.96), this.h * 0.22);   // Wing rear-right (now left)
    vertex(this.w * (1 - 0.79), this.h * 0.22);   // Wing rear-left (now right)
    endShape(CLOSE);
    
    // --- Headlight (X-coordinate is flipped) ---
    fill(this.headlightColor);
    noStroke();
    // Original: ellipse(this.w * 0.1, this.h * 0.45, this.w * 0.15, this.h * 0.25);
    ellipse(this.w * (1 - 0.1), this.h * 0.45, this.w * 0.15, this.h * 0.25); // Now at the new front

    pop();
  }

  get left() { return this.x; }
  get right() { return this.x + this.w; }
  get top() { return this.y; }
  get bottom() { return this.y + this.h; }
}

class Obstacle { // Tyres
  constructor() {
    let isStack = random(1) < 0.2;
    this.tyreRadius = random(12, 20);

    if (isStack) {
      this.numTyres = floor(random(2, 4));
      this.h = this.tyreRadius * 2 * this.numTyres * 0.8;
      this.w = this.tyreRadius * 2;
    } else {
      this.numTyres = 1;
      this.h = this.tyreRadius * 2;
      this.w = this.tyreRadius * 2;
    }

    this.x = width;
    this.y = groundY - this.h;
    this.color = color(40, 40, 40);
    this.innerColor = color(70, 70, 70);
  }

  update() {
    this.x -= gameSpeed;
  }

  show() {
    push();
    translate(this.x, this.y);

    for (let i = 0; i < this.numTyres; i++) {
      let currentTyreVisualRadius = this.tyreRadius * (this.numTyres > 1 ? 0.95 : 1);
      let yPos = this.h - (currentTyreVisualRadius * 2 * i) - currentTyreVisualRadius;
      if (this.numTyres > 1) {
         yPos -= (this.tyreRadius * 0.15 * i);
      }

      fill(this.color);
      noStroke();
      ellipse(this.w / 2, yPos, currentTyreVisualRadius * 2, currentTyreVisualRadius * 2);
      fill(this.innerColor);
      ellipse(this.w / 2, yPos, currentTyreVisualRadius * 0.8, currentTyreVisualRadius * 0.8);
    }
    pop();
  }

  isOffscreen() {
    return this.x + this.w < 0;
  }

  hits(player) {
    return (
      player.right > this.x &&
      player.left < this.x + this.w &&
      player.bottom > this.y &&
      player.top < this.y + this.h
    );
  }
}

// --- Simple Parallax Background Class (Unchanged) ---
class BackgroundLayer {
  constructor(col, speedFactor, isShape = false, shapeHeight = 20) {
    this.color = col;
    this.speedFactor = speedFactor;
    this.offsetX = 0;
    this.isShape = isShape;
    this.shapeHeight = shapeHeight;
  }

  update() {
    this.offsetX -= gameSpeed * this.speedFactor;
    if (this.offsetX <= -width) {
      this.offsetX += width;
    }
  }

  show() {
    push();
    fill(this.color);
    noStroke();
    if (this.isShape) {
      let yPos = groundY - this.shapeHeight;
      this.drawShapePattern(this.offsetX, yPos);
      this.drawShapePattern(this.offsetX + width, yPos);
    } else {
      rect(this.offsetX, 0, width, groundY);
      rect(this.offsetX + width, 0, width, groundY);
    }
    pop();
  }

  drawShapePattern(startX, startY) {
    beginShape();
    vertex(startX, startY);
    for (let x_coord = 0; x_coord <= width; x_coord += 50) { // Renamed x to x_coord to avoid conflict with Porsche's this.x
      let bumpHeight = sin(x_coord * 0.05 + frameCount * 0.01 + this.offsetX * 0.001) * (this.shapeHeight * 0.3);
      vertex(startX + x_coord, startY - bumpHeight);
    }
    vertex(startX + width, startY);
    vertex(startX + width, groundY);
    vertex(startX, groundY);
    endShape(CLOSE);
  }
}