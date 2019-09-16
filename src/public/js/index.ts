enum Piece {
  NONE,
  WHITE,
  BLACK,
}

interface Cell {
  piece: Piece;
}

interface CanvasPosition {
  x: number;
  y: number;
}

interface BoardPosition {
  row: number;
  col: number;
}

const boardSize = 8;
const board: Cell[][] = Array(boardSize).fill([]).map(_ => Array(boardSize).fill({ piece: Piece.NONE }));

let canvas: HTMLCanvasElement;

const draggingPiece: {
  origin: BoardPosition;
  piece: Piece
} = {
  origin: { row: -1, col: -1 },
  piece: Piece.NONE
};

function initBoard() {
  const rows = 3, cols = 4;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      board[i + boardSize - rows][j] = { piece: Piece.WHITE };
      board[i][j + boardSize - cols] = { piece: Piece.BLACK };
    }
  }
}

function drawCircle(cp: CanvasPosition, radius: number, fill: string, stroke: string) {
  const ctx = canvas.getContext('2d');
  ctx.beginPath();
  ctx.arc(cp.x, cp.y, radius, 0, 2 * Math.PI, false);
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();
}

function drawPiece(cp: CanvasPosition, piece: Piece) {
  const w = canvas.width / boardSize;
  if (piece === Piece.WHITE) {
    drawCircle(cp, w / 3, '#F0F0F0', '#1E1E1E');
  } else if (piece === Piece.BLACK) {
    drawCircle(cp, w / 3, '#3C3C3C', '#1E1E1E');
  }
}

function drawBoard() {
  const ctx = canvas.getContext('2d');

  board.forEach((row, r) => {
    row.forEach((cell, c) => {
      ctx.fillStyle = (r + c) % 2 ? '#5D737E' : '#CCDBDC';
      const w = canvas.width / row.length, h = canvas.height / board.length;
      const x = c * w, y = r * h;
      ctx.fillRect(x, y, w, h);

      drawPiece({ x: x + w / 2, y: y + h / 2 }, cell.piece);
    });
  });
}

function manhattenDistance(src: BoardPosition, dest: BoardPosition) {
  return Math.abs(src.col - dest.col) + Math.abs(src.row - dest.row);
}

function isBoardPositionEmpty(bp: BoardPosition) {
  return board[bp.row][bp.col].piece === Piece.NONE;
}

function isCellEmpty(cell: Cell) {
  return cell.piece === Piece.NONE;
}

function isValidMove(src: BoardPosition, dest: BoardPosition, piece: Piece) {
  const dr = dest.row - src.row, dc = dest.col - src.col;
  const distance = manhattenDistance(src, dest);
  let validHop = false;

  if (distance === 2) {
    if (dr === 0) validHop = !isBoardPositionEmpty({ row: src.row, col: src.col + dc / 2 });
    else if (dc === 0) validHop = !isBoardPositionEmpty({ row: src.row + dr / 2, col: src.col });
  }

  return (distance === 1 || validHop) && isBoardPositionEmpty(dest);
}

function getBoardPositionForCanvasPosition(cp: CanvasPosition): BoardPosition {
  return {
    row: Math.floor(cp.y * boardSize / canvas.height),
    col: Math.floor(cp.x * boardSize / canvas.width)
  };
}

function resetDraggingPiece() {
  draggingPiece.piece = Piece.NONE;
  draggingPiece.origin = { row: -1, col: -1 };
}

function isDraggingPiece() {
  return draggingPiece.piece != Piece.NONE;
}

function onCanvasPress(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();

  const mcp = {
    x: event.clientX - canvas.offsetLeft,
    y: event.clientY - canvas.offsetTop
  }

  const mbp = getBoardPositionForCanvasPosition(mcp);

  const selectedCell = board[mbp.row][mbp.col];

  if (!isCellEmpty(selectedCell) && !isDraggingPiece()) {
    draggingPiece.piece = selectedCell.piece;
    draggingPiece.origin = { row: mbp.row, col: mbp.col };
    board[mbp.row][mbp.col] = { piece: Piece.NONE };
    drawBoard();
    drawPiece(mcp, draggingPiece.piece);
  }
}

function onCanvasRelease(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();

  const mcp = {
    x: event.clientX - canvas.offsetLeft,
    y: event.clientY - canvas.offsetTop
  }

  const mbp = getBoardPositionForCanvasPosition(mcp);

  if (isDraggingPiece()) {
    if (isValidMove(draggingPiece.origin, mbp, draggingPiece.piece)) {
      board[mbp.row][mbp.col] = { piece: draggingPiece.piece };
    } else {
      board[draggingPiece.origin.row][draggingPiece.origin.col] = { piece: draggingPiece.piece };
    }
    resetDraggingPiece();
    drawBoard();
  }
}

function onCanvasMouseMove(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();

  drawBoard();

  if (isDraggingPiece()) {
    const mcp = {
      x: event.clientX - canvas.offsetLeft,
      y: event.clientY - canvas.offsetTop
    }

    drawPiece(mcp, draggingPiece.piece);
  }
}

function attachEventListeners() {
  // Mouse events
  canvas.addEventListener('mousedown', onCanvasPress);
  canvas.addEventListener('mouseup', onCanvasRelease);
  canvas.addEventListener('mousemove', onCanvasMouseMove);
}

function start() {
  canvas = <HTMLCanvasElement> document.getElementById('board');
  attachEventListeners();
  initBoard();
  drawBoard();
}

window.onload = start;