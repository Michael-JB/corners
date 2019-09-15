const boardSize = 8;
const board = Array(boardSize).fill(0).map(x => Array(boardSize).fill(0));

let canvas;

const draggingPiece = {
  type: 0,
  originRow: -1,
  originCol: -1,
};

function initBoard() {
  const rows = 3, cols = 4;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      board[i + boardSize - rows][j] = 1;
      board[i][j + boardSize - cols] = 2;
    }
  }
}

function drawCircle(x, y, r, fill, stroke) {
  const ctx = canvas.getContext('2d');
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI, false);
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();
}

function drawPiece(x, y, type) {
  const w = canvas.width / boardSize;
  if (type === 1) {
    drawCircle(x, y, w / 3, '#F0F0F0', '#1E1E1E');
  } else if (type === 2) {
    drawCircle(x, y, w / 3, '#3C3C3C', '#1E1E1E');
  }
}

function drawBoard() {
  const ctx = canvas.getContext('2d');

  board.forEach((row, r) => {
    row.forEach((tile, c) => {
      ctx.fillStyle = (r + c) % 2 ? '#5D737E' : '#CCDBDC';
      const w = canvas.width / row.length, h = canvas.height / board.length;
      const x = c * w, y = r * h;
      ctx.fillRect(x, y, w, h);

      drawPiece(x + w / 2, y + h / 2, tile);
    });
  });
}

function manhattenDistance(x1, y1, x2, y2) {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

function isCellFree(row, col) {
  return !board[row][col];
}

function isValidMove(srcRow, srcCol, destRow, destCol, type) {
  const dr = destRow - srcRow, dc = destCol - srcCol;
  const distance = manhattenDistance(srcRow, srcCol, destRow, destCol);
  let validHop = false;

  if (distance === 2) {
    if (dr === 0) validHop = !isCellFree(srcRow, srcCol + dc / 2);
    else if (dc === 0) validHop = !isCellFree(srcRow + dr / 2, srcCol);
  }

  return (distance === 1 || validHop) && isCellFree(destRow, destCol);
}

function getRowForY(y) {
  return Math.floor(y * boardSize / canvas.height);
}

function getColForX(x) {
  return Math.floor(x * boardSize / canvas.width);
}

function resetDraggingPiece() {
  draggingPiece.type = 0;
  draggingPiece.originRow = -1;
  draggingPiece.originCol = -1;
}

function onCanvasPress(event) {
  event.preventDefault();
  event.stopPropagation();

  const mx = parseInt(event.clientX - canvas.offsetLeft);
  const my = parseInt(event.clientY - canvas.offsetTop);

  const col = getColForX(mx), row = getRowForY(my);

  const selectedPiece = board[row][col];

  if (selectedPiece && !draggingPiece.type) {
    draggingPiece.type = selectedPiece;
    draggingPiece.originRow = row;
    draggingPiece.originCol = col;
    board[row][col] = 0;
  }

  drawBoard();
  if (draggingPiece.type) drawPiece(mx, my, draggingPiece.type);
}

function onCanvasRelease(event) {
  event.preventDefault();
  event.stopPropagation();

  const mx = parseInt(event.clientX - canvas.offsetLeft);
  const my = parseInt(event.clientY - canvas.offsetTop);

  const col = getColForX(mx), row = getRowForY(my);

  if (draggingPiece.type) {
    if (isValidMove(draggingPiece.originRow, draggingPiece.originCol, row, col, draggingPiece.type)) {
      board[row][col] = draggingPiece.type;
    } else {
      board[draggingPiece.originRow][draggingPiece.originCol] = draggingPiece.type
    }
    resetDraggingPiece();
  }

  drawBoard();
}

function onCanvasMouseMove(event) {
  event.preventDefault();
  event.stopPropagation();

  drawBoard();

  if (draggingPiece.type) {
    const mx = parseInt(event.clientX - canvas.offsetLeft);
    const my = parseInt(event.clientY - canvas.offsetTop);
    drawPiece(mx, my, draggingPiece.type);
  }
}

function attachEventListeners() {
  canvas.onmousedown = onCanvasPress;
  canvas.onmouseup = onCanvasRelease;
  canvas.onmousemove = onCanvasMouseMove;
}

function start() {
  canvas = document.getElementById('board');
  attachEventListeners();
  initBoard();
  drawBoard();
}

window.onload = start;