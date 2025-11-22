// ===================================
// 全域變數定義
// ===================================
let ball;
let bricks = [];
let score = 0;
let level = 1;
let playerName = "";
let nameInput;
let gameState = 'start_screen';
let leaderboard = [];
let lives = 5;
let maxLives = 5;

let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let launchAngle = 0;
let fixedLaunchPower = 30;

const BG_COLOR = '#FFDAB9';
const BRICK_COLORS = [
  '#FF0000', // 紅色
  '#FF7F00', // 橙色
  '#FFFF00', // 黃色
  '#00FF00', // 綠色
  '#00FFFF', // 青色
  '#0000FF', // 藍色
  '#8B00FF', // 紫色
  '#FF1493'  // 粉紅色
];

// ===================================
// P5.js 核心函式
// ===================================
function setup() {
  createCanvas(windowWidth, windowHeight);
  
  ball = new Ball(width / 2, height - 100);
  ball.launched = false;
  
  loadLeaderboard();
  
  nameInput = createInput('');
  nameInput.position(width / 2 - 150, height / 2 + 50);
  nameInput.size(300, 30);
  nameInput.attribute('placeholder', '請輸入你的名字');
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (nameInput) {
    nameInput.position(width / 2 - 150, height / 2 + 50);
  }
}

function draw() {
  background(BG_COLOR);

  if (gameState === 'start_screen') {
    drawStartScreen();
  } else if (gameState === 'playing') {
    drawPlayingState();
  } else if (gameState === 'game_over') {
    drawGameOverState();
  } else if (gameState === 'leaderboard') {
    drawLeaderboard();
  }
  
  if (gameState === 'playing') {
    drawUI();
  }
}

// ===================================
// 狀態繪製函式
// ===================================
function drawStartScreen() {
  nameInput.show();
  
  fill(0);
  textAlign(CENTER);
  
  textSize(60);
  text('🎯 彈珠打磚塊', width / 2, height / 2 - 100);
  
  textSize(24);
  text('請輸入玩家名稱：', width / 2, height / 2 + 20);
  
  textSize(24);
  fill(255, 0, 0);
  text('輸入完畢後，按 [Enter] 開始遊戲', width / 2, height / 2 + 150);
  
  fill(0, 100, 255);
  textSize(20);
  text('按 [L] 查看排行榜', width / 2, height / 2 + 200);
}

function drawPlayingState() {
  if (!ball.launched) {
    ball.x = width / 2;
    ball.y = height - 80;
    
    if (isDragging) {
      let dx = mouseX - ball.x;
      let dy = mouseY - ball.y;
      let distance = sqrt(dx * dx + dy * dy);
      
      if (distance > 5) {
        launchAngle = atan2(-dy, -dx);
      }
      
      // 繪製發射箭頭
      push();
      stroke(255, 0, 0);
      strokeWeight(5);
      
      let arrowLength = 100;
      let endX = ball.x + cos(launchAngle) * arrowLength;
      let endY = ball.y + sin(launchAngle) * arrowLength;
      line(ball.x, ball.y, endX, endY);
      
      let arrowSize = 20;
      let angle1 = launchAngle - PI / 6;
      let angle2 = launchAngle + PI / 6;
      line(endX, endY, endX + cos(angle1) * arrowSize, endY + sin(angle1) * arrowSize);
      line(endX, endY, endX + cos(angle2) * arrowSize, endY + sin(angle2) * arrowSize);
      
      pop();
      
      // 繪製輔助虛線
      push();
      stroke(100, 200, 255);
      strokeWeight(2);
      setLineDash([5, 5]);
      
      let trajectoryLength = 500;
      let trajectoryX = ball.x + cos(launchAngle) * trajectoryLength;
      let trajectoryY = ball.y + sin(launchAngle) * trajectoryLength;
      line(ball.x, ball.y, trajectoryX, trajectoryY);
      
      pop();
      
      // 顯示角度
      fill(255, 0, 0);
      textAlign(CENTER);
      textSize(20);
      let angleDeg = floor(((launchAngle * 180 / PI) + 360) % 360);
      text(`發射角度: ${angleDeg}°`, width / 2, height - 30);
    } else {
      fill(0);
      textAlign(CENTER);
      textSize(18);
      text('點擊球並拖曳調整方向！', width / 2, height - 150);
      textSize(16);
      fill(100);
      text('往下拉 = 往上飛 | 往左拉 = 往右飛', width / 2, height - 120);
    }
  } else {
    ball.update();
  }
  
  ball.show();
  
  for (let i = bricks.length - 1; i >= 0; i--) {
    bricks[i].show();
    let collision = ball.collidesWith(bricks[i]);
    if (collision) {
      score += 10;
      if (collision.side === 'top' || collision.side === 'bottom') {
        ball.reverseY();
      } else {
        ball.reverseX();
      }
      bricks.splice(i, 1);
    }
  }
  
  if (ball.isMiss() && ball.launched) {
    lives--;
    if (lives <= 0) {
      saveScore();
      gameState = 'game_over';
    } else {
      resetBall();
    }
  }
  
  if (bricks.length === 0) {
    saveScore();
    gameState = 'game_over';
  }
}

function drawGameOverState() {
  fill(0, 200, 0);
  textSize(48);
  textAlign(CENTER);
  text('🎉 遊戲結束！🎉', width / 2, height / 2 - 150);
  
  fill(0);
  textSize(28);
  text(`玩家: ${playerName}`, width / 2, height / 2 - 80);
  textSize(24);
  text(`最終分數: ${score}`, width / 2, height / 2 - 40);
  
  if (bricks.length === 0) {
    text(`消除了所有磚塊！`, width / 2, height / 2);
  } else {
    fill(200, 0, 0);
    text(`生命已耗盡！`, width / 2, height / 2);
  }
  
  // 按鈕區域
  fill(0, 150, 255);
  rect(width / 2 - 150, height / 2 + 60, 300, 50, 10);
  fill(255);
  textSize(22);
  text('重新遊戲 [Enter]', width / 2, height / 2 + 90);
  
  fill(100, 200, 100);
  rect(width / 2 - 150, height / 2 + 130, 300, 50, 10);
  fill(255);
  text('查看排行榜 [L]', width / 2, height / 2 + 160);
}

function drawLeaderboard() {
  fill(0);
  textAlign(CENTER);
  textSize(48);
  text('🏆 排行榜 🏆', width / 2, 80);
  
  textSize(20);
  textAlign(LEFT);
  
  let startY = 150;
  let lineHeight = 40;
  
  if (leaderboard.length === 0) {
    textAlign(CENTER);
    fill(150);
    text('還沒有任何紀錄', width / 2, startY + 50);
  } else {
    fill(100);
    text('排名', width / 2 - 200, startY);
    text('玩家', width / 2 - 50, startY);
    text('分數', width / 2 + 150, startY);
    
    for (let i = 0; i < Math.min(8, leaderboard.length); i++) {
      let y = startY + (i + 1) * lineHeight + 20;
      let entry = leaderboard[i];
      
      if (i === 0) fill(255, 215, 0);
      else if (i === 1) fill(192, 192, 192);
      else if (i === 2) fill(205, 127, 50);
      else fill(0);
      
      text(`${i + 1}.`, width / 2 - 200, y);
      
      fill(0);
      text(entry.name, width / 2 - 50, y);
      text(entry.score, width / 2 + 150, y);
    }
  }
  
  fill(0, 150, 255);
  rect(width / 2 - 150, height - 100, 300, 50, 10);
  fill(255);
  textAlign(CENTER);
  textSize(22);
  text('返回 [Enter]', width / 2, height - 70);
}

// ===================================
// 輔助函式
// ===================================
function createBricks() {
  bricks = [];
  let cols = 8;
  let rows = 8;
  let brickW = width / cols;
  let brickH = 65;
  let startY = 80;
  let gap = 15;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      bricks.push(new Brick(
        j * brickW + gap, 
        i * brickH + startY + gap, 
        brickW - gap * 2, 
        brickH - gap * 2, 
        BRICK_COLORS[i % BRICK_COLORS.length]
      ));
    }
  }
}

function resetBall() {
  ball = new Ball(width / 2, height - 100);
  ball.launched = false;
  isDragging = false;
}

function drawUI() {
  fill(0);
  textSize(18);
  textAlign(LEFT);
  text(`玩家: ${playerName} | 分數: ${score} | 剩餘磚塊: ${bricks.length}`, 10, 25);
  
  // 繪製紅心（生命值）
  drawHearts();
}

function drawHearts() {
  let heartSize = 30;
  let heartX = width - heartSize - 20;
  let heartY = 20;
  
  for (let i = 0; i < maxLives; i++) {
    fill(i < lives ? 255 : 200);
    textSize(heartSize);
    text('❤', heartX - i * (heartSize + 10), heartY);
  }
}

function setLineDash(segments) {
  drawingContext.setLineDash(segments);
}

function loadLeaderboard() {
  const saved = localStorage.getItem('pinballLeaderboard');
  if (saved) {
    leaderboard = JSON.parse(saved);
  }
}

function saveScore() {
  // 檢查是否已有相同名字的玩家
  let existingIndex = leaderboard.findIndex(entry => entry.name === playerName);
  
  if (existingIndex !== -1) {
    // 如果新分數更高，就更新
    if (score > leaderboard[existingIndex].score) {
      leaderboard[existingIndex].score = score;
      leaderboard[existingIndex].date = new Date().toLocaleDateString();
    }
  } else {
    // 新玩家，添加到排行榜
    leaderboard.push({
      name: playerName,
      score: score,
      date: new Date().toLocaleDateString()
    });
  }
  
  // 按分數排序
  leaderboard.sort((a, b) => b.score - a.score);
  
  // 只保留前8名
  leaderboard = leaderboard.slice(0, 8);
  
  localStorage.setItem('pinballLeaderboard', JSON.stringify(leaderboard));
}

// ===================================
// 滑鼠事件
// ===================================
function mousePressed() {
  if (gameState === 'playing' && !ball.launched) {
    let d = dist(mouseX, mouseY, ball.x, ball.y);
    if (d < ball.r * 3) {
      isDragging = true;
      dragStartX = mouseX;
      dragStartY = mouseY;
    }
  }
}

function mouseDragged() {
  if (isDragging && gameState === 'playing') {
    let dx = mouseX - ball.x;
    let dy = mouseY - ball.y;
    let distance = sqrt(dx * dx + dy * dy);
    
    if (distance > 5) {
      launchAngle = atan2(-dy, -dx);
    }
  }
}

function mouseReleased() {
  if (isDragging && gameState === 'playing') {
    ball.launch(fixedLaunchPower, launchAngle);
    isDragging = false;
  }
}

function keyPressed() {
  if (keyCode === ENTER) {
    if (gameState === 'start_screen') {
      playerName = nameInput.value();
      if (playerName.trim() === '') {
        playerName = '匿名玩家';
      }
      nameInput.hide();
      
      score = 0;
      level = 1;
      lives = maxLives;
      createBricks();
      resetBall();
      
      gameState = 'playing';
      
    } else if (gameState === 'game_over') {
      score = 0;
      level = 1;
      lives = maxLives;
      
      createBricks();
      resetBall();
      
      gameState = 'playing';
    } else if (gameState === 'leaderboard') {
      gameState = 'start_screen';
      nameInput.show();
    }
  } else if (key === 'l' || key === 'L') {
    if (gameState === 'start_screen' || gameState === 'game_over') {
      nameInput.hide();
      gameState = 'leaderboard';
    }
  }
}

// ===================================
// 類別定義
// ===================================
class Ball {
  constructor(x, y) {
    this.r = 8;
    this.x = x;
    this.y = y;
    this.xSpeed = 0;
    this.ySpeed = 0;
    this.launched = false;
  }
  
  launch(power, angle) {
    this.launched = true;
    this.xSpeed = cos(angle) * power * 0.8;
    this.ySpeed = sin(angle) * power * 0.8;
  }
  
  update() {
    if (!this.launched) return;
    
    this.x += this.xSpeed;
    this.y += this.ySpeed;
    
    this.ySpeed += 0.1;
    
    if (this.x + this.r > width || this.x - this.r < 0) {
      this.xSpeed *= -1;
    }
    if (this.y - this.r < 0) {
      this.ySpeed *= -1;
    }
  }
  
  show() {
    fill(255, 100, 100);
    stroke(200, 50, 50);
    strokeWeight(2);
    ellipse(this.x, this.y, this.r * 2);
    noStroke();
  }
  
  isMiss() {
    return this.y + this.r > height;
  }
  
  reverseY() {
    this.ySpeed *= -1;
  }
  
  reverseX() {
    this.xSpeed *= -1;
  }
  
  collidesWith(brick) {
    if (
      this.x + this.r > brick.x &&
      this.x - this.r < brick.x + brick.w &&
      this.y + this.r > brick.y &&
      this.y - this.r < brick.y + brick.h
    ) {
      let distTop = abs(this.y - (brick.y - this.r));
      let distBottom = abs(this.y - (brick.y + brick.h + this.r));
      let distLeft = abs(this.x - (brick.x - this.r));
      let distRight = abs(this.x - (brick.x + brick.w + this.r));
      
      let minDist = Math.min(distTop, distBottom, distLeft, distRight);
      
      if (minDist === distTop || minDist === distBottom) {
        return { side: distTop < distBottom ? 'top' : 'bottom' };
      } else {
        return { side: distLeft < distRight ? 'left' : 'right' };
      }
    }
    return null;
  }
}

class Brick {
  constructor(x, y, w, h, color) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.color = color;
  }
  
  show() {
    fill(this.color);
    stroke(0);
    strokeWeight(2);
    rect(this.x, this.y, this.w, this.h);
    noStroke();
  }
}