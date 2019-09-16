import * as movement from "./movement.js";
import * as cpu from "./cpu.js";

interface CanvasPosition {
  x: number;
  y: number;
}

const boardSize = 8;
const board: movement.Board = {
  size: boardSize,
  cells: Array(boardSize).fill([]).map(_ => Array(boardSize).fill({ piece: movement.Piece.NONE })),
  turn: movement.Piece.WHITE,
  lastMove: undefined
}

let canvas: HTMLCanvasElement;
let endTurnButton: HTMLButtonElement;

const draggingPiece: {
  origin: movement.BoardPosition;
  piece: movement.Piece
} = {
  origin: { row: -1, col: -1 },
  piece: movement.Piece.NONE
};

function initBoard(): void {
  const rows = 3, cols = 4;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      board.cells[i + boardSize - rows][j] = { piece: movement.Piece.WHITE };
      board.cells[i][j + boardSize - cols] = { piece: movement.Piece.BLACK };
    }
  }
}

function drawCircle(cp: CanvasPosition, radius: number, fill: string, stroke: string): void {
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.beginPath();
    ctx.arc(cp.x, cp.y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
  }
}

function drawPiece(cp: CanvasPosition, piece: movement.Piece): void {
  const w = canvas.width / boardSize;
  if (piece === movement.Piece.WHITE) {
    drawCircle(cp, w / 3, '#F0F0F0', '#1E1E1E');
  } else if (piece === movement.Piece.BLACK) {
    drawCircle(cp, w / 3, '#3C3C3C', '#1E1E1E');
  }
}

function drawBoard(): void {
  const ctx = canvas.getContext('2d');

  if (ctx) {
    board.cells.forEach((row, r) => {
      row.forEach((cell, c) => {
        ctx.fillStyle = (r + c) % 2 ? '#5D737E' : '#CCDBDC';
        const w = canvas.width / row.length, h = canvas.height / board.cells.length;
        const x = c * w, y = r * h;
        ctx.fillRect(x, y, w, h);

        drawPiece({ x: x + w / 2, y: y + h / 2 }, cell.piece);
      });
    });
  }
}

function getBoardPositionForCanvasPosition(cp: CanvasPosition): movement.BoardPosition {
  return {
    row: Math.floor(cp.y * boardSize / canvas.height),
    col: Math.floor(cp.x * boardSize / canvas.width)
  };
}

function resetDraggingPiece(): void {
  draggingPiece.piece = movement.Piece.NONE;
  draggingPiece.origin = { row: -1, col: -1 };
}

function isDraggingPiece(): boolean {
  return draggingPiece.piece != movement.Piece.NONE;
}

function isCellEmpty(cell: movement.Cell): boolean {
  return cell.piece === movement.Piece.NONE;
}

function onCanvasPress(event: MouseEvent): void {
  event.preventDefault();
  event.stopPropagation();

  const mcp = {
    x: event.clientX - canvas.offsetLeft,
    y: event.clientY - canvas.offsetTop
  }

  const mbp = getBoardPositionForCanvasPosition(mcp);

  const selectedCell = board.cells[mbp.row][mbp.col];

  if (!isCellEmpty(selectedCell) && !isDraggingPiece()) {
    draggingPiece.piece = selectedCell.piece;
    draggingPiece.origin = { row: mbp.row, col: mbp.col };
    board.cells[mbp.row][mbp.col] = { piece: movement.Piece.NONE };
    drawBoard();
    drawPiece(mcp, draggingPiece.piece);
  }
}

function onCanvasRelease(event: MouseEvent): void {
  event.preventDefault();
  event.stopPropagation();

  const mcp = {
    x: event.clientX - canvas.offsetLeft,
    y: event.clientY - canvas.offsetTop
  }

  const mbp = getBoardPositionForCanvasPosition(mcp);

  if (isDraggingPiece()) {
    board.cells[draggingPiece.origin.row][draggingPiece.origin.col] = { piece: draggingPiece.piece };
    if (movement.isValidMove(board, draggingPiece.origin, mbp, draggingPiece.piece)) {
      movement.performMove(board, { src: draggingPiece.origin, dest: mbp });
    }
    resetDraggingPiece();
    drawBoard();
  }

  if (board.turn === movement.Piece.BLACK) {
    const nextMove = cpu.nextMove(board);
    if (nextMove) movement.performMove(board, nextMove);
    drawBoard();
  }
}

function onCanvasMouseMove(event: MouseEvent): void {
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

function onEndTurnButtonClick(event: Event) {
  movement.tryEndTurn(board);
}

function attachEventListeners(): void {
  endTurnButton.addEventListener('click', onEndTurnButtonClick);

  // Mouse events
  canvas.addEventListener('mousedown', onCanvasPress);
  canvas.addEventListener('mouseup', onCanvasRelease);
  canvas.addEventListener('mousemove', onCanvasMouseMove);


  // TODO: Touch events
}

function start(): void {
  canvas = <HTMLCanvasElement> document.getElementById('board');
  endTurnButton = <HTMLButtonElement> document.getElementById('btn-end-turn');
  attachEventListeners();
  initBoard();
  drawBoard();
}

window.onload = start;