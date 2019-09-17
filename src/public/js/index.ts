import * as movement from "./movement.js";
import * as cpu from "./cpu.js";

interface CanvasPosition {
  readonly x: number;
  readonly y: number;
}

const boardSize = 8;
const board: movement.Board = {
  size: boardSize,
  cells: Array(boardSize).fill([]).map(_ => Array(boardSize).fill(undefined).map(_ => ({ piece: movement.Piece.NONE }))),
  turn: movement.playerPiece,
  moveStack: []
}

let canvas: HTMLCanvasElement;
let endTurnButton: HTMLButtonElement;

const draggingPiece: {
  origin: movement.BoardPosition | null;
  piece: movement.Piece
} = {
  origin: null,
  piece: movement.Piece.NONE
};

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
  const lastMove = movement.peek(board.moveStack);

  if (ctx) {
    board.cells.forEach((row, r) => {
      row.forEach((cell, c) => {
        const isCellLastSrc = lastMove && movement.isBoardPositionEqual(lastMove.src, { row: r, col: c });
        const isCellLastDest = lastMove && movement.isBoardPositionEqual(lastMove.dest, { row: r, col: c });

        if (isCellLastSrc || isCellLastDest) {
          ctx.fillStyle = (r + c) % 2 ? '#B5BD89' : '#D1D9B0';
        } else {
          ctx.fillStyle = (r + c) % 2 ? '#5D737E' : '#CCDBDC';
        }

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

function returnDraggingPiece(): void {
  if (draggingPiece.origin) {
    board.cells[draggingPiece.origin.row][draggingPiece.origin.col].piece = draggingPiece.piece;
  }
}

function resetDraggingPiece(): void {
  draggingPiece.piece = movement.Piece.NONE;
  draggingPiece.origin = { row: -1, col: -1 };
}

function isDraggingPiece(): boolean {
  return draggingPiece.origin != null && draggingPiece.piece != movement.Piece.NONE;
}

function isCellEmpty(cell: movement.Cell): boolean {
  return cell.piece === movement.Piece.NONE;
}

function onPlayerPieceMove(move: movement.Move): void {
  if (movement.isValidMove(board, move, movement.playerPiece)) {
    movement.performMove(board, move);
    drawBoard();
    if (board.turn != movement.playerPiece) {
      onPlayerPieceTurnEnd();
    }
  } else {
    drawBoard();
  }
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
    const moveSrc = draggingPiece.origin, movePiece = draggingPiece.piece;
    if (moveSrc != null) {
      returnDraggingPiece();
      resetDraggingPiece();
      if (movePiece === movement.playerPiece && !movement.isBoardPositionEqual(moveSrc, mbp)) {
        onPlayerPieceMove({ src: moveSrc, dest: mbp, piece: movePiece });
      } else {
        drawBoard();
      }
    }
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

function enableEndTurnButton(enable: boolean): void {
  endTurnButton.disabled = !enable;
}

function enableBoardInteraction(enable: boolean): void {
  canvas.style.pointerEvents = enable ? 'auto' : 'none';
}

async function onEndTurnButtonClick(event: Event) {
  if (board.turn === movement.playerPiece) {
    if (movement.tryEndTurn(board)) {
      await onPlayerPieceTurnEnd();
    }
  }
}

async function onPlayerPieceTurnEnd() {
  await cpuMove();
}

async function cpuMove() {
  enableEndTurnButton(false);
  enableBoardInteraction(false);
  await sleep(400);
  const nextMove = cpu.nextMove(board);
  if (nextMove != null) {
    movement.performMove(board, nextMove); // TODO handle no next move
    movement.tryEndTurn(board);
  } else {
    // End game...
  }
  drawBoard();
  enableBoardInteraction(true);
  enableEndTurnButton(true);
}

function sleep(duration: number) {
  return new Promise(resolve => setTimeout(resolve, duration));
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
  movement.initBoard(board);
  drawBoard();
}

window.onload = start;