import * as movement from "./movement.js";
import * as cpu from "./cpu.js";

interface CanvasPosition {
  readonly x: number;
  readonly y: number;
}

const lightSquareColour = '#CCDBDC';
const lightSquareHighlightColour = '#D1D9B0';
const darkSquareColour = '#5D737E';
const darkSquareHighlightColour = '#B5BD89';
const whitePieceColour = '#F0F0F0';
const blackPieceColour = '#3C3C3C';
const pieceBorderColour = '#1E1E1E';

const boardSize = 8;
const board: movement.Board = {
  size: boardSize,
  cells: Array(boardSize).fill([]).map(_ => Array(boardSize).fill(undefined).map(_ => ({ piece: movement.Piece.NONE }))),
  turn: movement.Piece.WHITE,
  moveStack: []
}
const draggingPiece: {
  origin: movement.BoardPosition | null;
  piece: movement.Piece
} = {
  origin: null,
  piece: movement.Piece.NONE
};

let canvas: HTMLCanvasElement;
let endTurnButton: HTMLButtonElement;
let newGameButton: HTMLButtonElement;
let questionButton: HTMLButtonElement;

function drawCircle(cp: CanvasPosition, radius: number, fill: string, stroke: string): void {
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.beginPath();
    ctx.arc(cp.x, cp.y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = radius / 15;
    ctx.fill();
    ctx.stroke();
  }
}

function drawPiece(cp: CanvasPosition, piece: movement.Piece): void {
  const w = canvas.width / boardSize;
  if (piece === movement.Piece.WHITE) {
    drawCircle(cp, w / 3, whitePieceColour, pieceBorderColour);
  } else if (piece === movement.Piece.BLACK) {
    drawCircle(cp, w / 3, blackPieceColour, pieceBorderColour);
  }
}

function drawBoard(): void {
  const ctx = canvas.getContext('2d');
  const lastMove = movement.peek(board.moveStack);
  const canvasWidth = Math.min(window.innerWidth, window.innerHeight) * 0.8;

  if (ctx) {
    ctx.canvas.width = canvasWidth;
    ctx.canvas.height = canvasWidth;
    board.cells.forEach((row, r) => {
      row.forEach((cell, c) => {
        const isCellLastSrc = lastMove && movement.isBoardPositionEqual(lastMove.src, { row: r, col: c });
        const isCellLastDest = lastMove && movement.isBoardPositionEqual(lastMove.dest, { row: r, col: c });

        if (isCellLastSrc || isCellLastDest) {
          ctx.fillStyle = (r + c) % 2 ? darkSquareHighlightColour : lightSquareHighlightColour;
        } else {
          ctx.fillStyle = (r + c) % 2 ? darkSquareColour : lightSquareColour;
        }

        const w = canvas.width / row.length, h = canvas.height / board.cells.length;
        const x = c * w, y = r * h;
        ctx.fillRect(x, y, w, h);

        ctx.font = `${ctx.canvas.width / 50}px Courier New`;
        ctx.fillStyle = (r + c) % 2 ? lightSquareColour : darkSquareColour;
        ctx.fillText(`${board.size - r}${String.fromCharCode(65 + c)}`, x + 4, y + h - 4);

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
    enableEndTurnButton(true);
    drawBoard();
    checkForWinner();
    if (board.turn != movement.playerPiece) {
      onPlayerPieceTurnEnd();
    }
  } else {
    drawBoard();
  }
}

function onCanvasPointerPress(event: PointerEvent): void {
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

function onCanvasPointerRelease(event: PointerEvent): void {
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

function onCanvasPointerMove(event: PointerEvent): void {
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

function enableNewGameButton(enable: boolean): void {
  newGameButton.disabled = !enable;
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

function onNewGameButtonClick(event: Event) {
  newGame();
}

function onQuestionButtonClick(event: Event) {
  alert(movement.gameRules);
}

async function onPlayerPieceTurnEnd() {
  await cpuMove();
}

function checkForWinner() {
  const winner = movement.getGameWinner(board);
  if (winner != null) {
    let message;
    switch (winner) {
      case movement.playerPiece:
        message = "Player wins";
        break;
      case movement.cpuPiece:
        message = "CPU wins";
        break;
    }
    drawBoard();
    alert(message);
    newGame();
  }
}

async function cpuMove() {
  enableEndTurnButton(false);
  enableNewGameButton(false);
  enableBoardInteraction(false);
  const nextMoves = cpu.nextMoves(board);
  if (nextMoves.length > 0) {
    for (const move of nextMoves) {
      await sleep(400);
      movement.performMove(board, move);
      drawBoard();
    }
    movement.tryEndTurn(board);
  } else {
    // End game...
    console.log('End game...');
  }
  drawBoard();
  checkForWinner();
  enableBoardInteraction(true);
  enableNewGameButton(true);
}

function sleep(duration: number) {
  return new Promise(resolve => setTimeout(resolve, duration));
}

function attachEventListeners(): void {
  endTurnButton.addEventListener('click', onEndTurnButtonClick);
  newGameButton.addEventListener('click', onNewGameButtonClick);
  questionButton.addEventListener('click', onQuestionButtonClick);

  canvas.addEventListener('pointerdown', onCanvasPointerPress);
  canvas.addEventListener('pointerup', onCanvasPointerRelease);
  canvas.addEventListener('pointermove', onCanvasPointerMove);
}

function newGame(): void {
  enableEndTurnButton(false);
  movement.initBoard(board);
  cpu.onStart(board);
  drawBoard();
  if (board.turn === movement.cpuPiece) {
    cpuMove();
  }
}

function start(): void {
  canvas = <HTMLCanvasElement> document.getElementById('board');
  endTurnButton = <HTMLButtonElement> document.getElementById('btn-end-turn');
  newGameButton = <HTMLButtonElement> document.getElementById('btn-new-game');
  questionButton = <HTMLButtonElement> document.getElementById('btn-question');
  attachEventListeners();
  newGame();
}

window.onload = start;
window.onresize = drawBoard;