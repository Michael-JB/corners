export enum Piece {
  NONE,
  WHITE,
  BLACK,
}

export interface Cell {
  piece: Piece;
}

export interface BoardPosition {
  readonly row: number;
  readonly col: number;
}

export interface Board {
  readonly size: number;
  cells: Cell[][];
  turn: Piece;
  moveStack: Move[];
}

export interface Move {
  readonly src: BoardPosition;
  readonly dest: BoardPosition;
  readonly piece: Piece;
}

export const playerPiece = Piece.WHITE;
export const cpuPiece = Piece.BLACK;

export const gameRules = `The goal of the game is to recreate your opponents starting position. On your turn, you can only move a single piece. This piece can either move to an adjacent square, after which your turn ends, or it can hop over an individual adjacent piece. You can perform as many hops as you like on your turn.`;

export function manhattenDistance(src: BoardPosition, dest: BoardPosition): number {
  return Math.abs(src.col - dest.col) + Math.abs(src.row - dest.row);
}

export function euclideanDistance(src: BoardPosition, dest: BoardPosition): number {
  return Math.hypot(src.col - dest.col, src.row - dest.row);
}

export function isBoardPositionEmpty(board: Board, bp: BoardPosition): boolean {
  return board.cells[bp.row][bp.col].piece === Piece.NONE;
}

export function isBoardPositionInBoard(board: Board, bp: BoardPosition): boolean {
  return bp.row >= 0 && bp.row < board.size && bp.col >= 0 && bp.col < board.size;
}

export function isBoardPositionEqual(bp1: BoardPosition, bp2: BoardPosition): boolean {
  return bp1.row === bp2.row && bp1.col === bp2.col;
}

export function isMoveEqual(m1: Move, m2: Move): boolean {
  return isBoardPositionEqual(m1.src, m2.src) && isBoardPositionEqual(m1.dest, m2.dest) && m1.piece === m2.piece;
}

export function getPieceForBoardPosition(board: Board, bp: BoardPosition): Piece {
  return board.cells[bp.row][bp.col].piece;
}

export function peek<T>(array: T[]): T {
  return array[array.length - 1];
}

export function getNeighbours(board: Board, bp: BoardPosition): BoardPosition[] {
  const neighbours = [
    { row: bp.row - 1, col: bp.col }, // North
    { row: bp.row, col: bp.col + 1 }, // East
    { row: bp.row + 1, col: bp.col }, // South
    { row: bp.row, col: bp.col - 1 }, // West
  ];

  return neighbours.filter(neighbour => isBoardPositionInBoard(board, neighbour));
}

export function getExtendedNeighbours(board: Board, bp: BoardPosition): BoardPosition[] {
  const neighbours = [
    { row: bp.row - 2, col: bp.col }, // North
    { row: bp.row, col: bp.col + 2 }, // East
    { row: bp.row + 2, col: bp.col }, // South
    { row: bp.row, col: bp.col - 2 }, // West
  ];

  return neighbours.filter(neighbour => isBoardPositionInBoard(board, neighbour));
}

export function getCandidateMoves(board: Board, src: BoardPosition, piece: Piece): Move[] {
  const neighbours = getNeighbours(board, src);
  const extendedNeighbours = getExtendedNeighbours(board, src);
  return neighbours.concat(extendedNeighbours).map(bp => ({ src, dest: bp, piece }));
}

export function getMoveStackChain(board: Board): Move[] {
  const chain = [];
  for (let i = board.moveStack.length - 1; i >= 0; i--) {
    const move = board.moveStack[i];
    if (move.piece === board.turn) {
      chain.push(move);
    } else {
      break;
    }
  }
  return chain;
}

export function initBoard(board: Board): void {
  const rows = 3, cols = 4;
  for (let r = 0; r < board.size; r++) {
    for (let c = 0; c < board.size; c++) {
      let cell = { piece: Piece.NONE };
      if (r >= (board.size - rows) && c < cols) cell.piece = Piece.WHITE;
      else if (c >= (board.size - cols) && r < rows) cell.piece = Piece.BLACK;
      board.cells[r][c] = cell;
    }
  }
  board.moveStack = [];
  board.turn = Piece.WHITE;
}

export function getAveragePosition(board: Board, piece: Piece): BoardPosition {
  const bps = getBoardPositionsForPiece(board, piece);
  const total = bps.reduce((acc, cur) => ({ row: acc.row + cur.row, col: acc.col + cur.col }));
  const average = { row: total.row / bps.length, col: total.col / bps.length };
  return average;
}

export function performMove(board: Board, move: Move, autoEnd: boolean = true): void {
  board.cells[move.src.row][move.src.col].piece = Piece.NONE;
  board.cells[move.dest.row][move.dest.col].piece = move.piece;
  board.moveStack.push(move);
  if (autoEnd && getValidMoves(board, move.dest, move.piece).length === 0) {
    tryEndTurn(board);
  }
}

export function tryEndTurn(board: Board): boolean {
  const initialTurn = board.turn;
  const lastMove = peek(board.moveStack);
  if (lastMove && getPieceForBoardPosition(board, lastMove.dest) === board.turn) {
    board.turn = board.turn === Piece.WHITE ? Piece.BLACK : Piece.WHITE;
  }
  return initialTurn != board.turn;
}

export function getGameWinner(board: Board): Piece | null {
  const whiteBps = getBoardPositionsForPiece(board, Piece.WHITE);
  const blackBps = getBoardPositionsForPiece(board, Piece.BLACK);

  if (blackBps.every(bp => bp.row >= 5 && bp.col <= 3)) return Piece.BLACK;
  if (whiteBps.every(bp => bp.row <= 2 && bp.col >= 4)) return Piece.WHITE;

  return null;
}


export function getBoardPositionsForPiece(board: Board, piece: Piece): BoardPosition[] {
  const bps: BoardPosition[] = [];
  board.cells.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell.piece === piece) bps.push({ row: r, col: c });
    });
  });
  return bps;
}

export function isValidMove(board: Board, move: Move, piece: Piece): boolean {
  const lastMove = peek(board.moveStack);
  const distance = manhattenDistance(move.src, move.dest);
  const validHop = isValidHop(board, move, piece);
  const isFirstMove = !lastMove || lastMove.piece != piece;

  return board.turn === piece && ((isFirstMove && distance === 1) || validHop) && isBoardPositionEmpty(board, move.dest);
}

export function isValidHop(board: Board, move: Move, piece: Piece): boolean {
  const lastMove = peek(board.moveStack);
  const dr = move.dest.row - move.src.row, dc = move.dest.col - move.src.col;
  const distance = manhattenDistance(move.src, move.dest);
  let legalHop = false;
  let canHop = false;

  if (lastMove) {
    const lastMoveDistance = manhattenDistance(lastMove.src, lastMove.dest);
    const isFirstMove = getPieceForBoardPosition(board, lastMove.dest) != piece;
    const isChain = lastMoveDistance === 2 && isBoardPositionEqual(lastMove.dest, move.src);
    const createsCycle = getMoveStackChain(board).some(mv => isBoardPositionEqual(mv.src, move.dest));
    canHop = !createsCycle && (isFirstMove || isChain);
  } else {
    canHop = true;
  }

  if (distance === 2) {
    if (dr === 0) legalHop = !isBoardPositionEmpty(board, { row: move.src.row, col: move.src.col + dc / 2 });
    else if (dc === 0) legalHop = !isBoardPositionEmpty(board, { row: move.src.row + dr / 2, col: move.src.col });
  }

  return canHop && legalHop && isBoardPositionEmpty(board, move.dest);
}

export function getValidMoves(board: Board, src: BoardPosition, piece: Piece): Move[] {
  if (!isBoardPositionEmpty(board, src)) {
    const candidateMoves = getCandidateMoves(board, src, piece);
    const validMoves = candidateMoves.filter(mv => isValidMove(board, mv, getPieceForBoardPosition(board, src)));
    return validMoves;
  } else return [];
}

export function getValidMovesFull(board: Board, src: BoardPosition, piece: Piece): Move[][] {
  let validChains: Move[][] = [];
  const validMoves = getValidMoves(board, src, piece);

  validMoves.forEach(move => {
    validChains.push([move]);

    const newBoard = cloneBoard(board);
    performMove(newBoard, move, false);

    const nextMoves = getValidMovesFull(newBoard, move.dest, move.piece);
    const prepended = nextMoves.map(nextMove => {
      nextMove.unshift(move);
      return nextMove;
    });
    validChains = validChains.concat(prepended);
  });

  return validChains;
}

export function cloneBoard(board: Board): Board {
  let newBoard: Board = {
    ...board,
    cells: Array(board.size).fill([]).map(_ => Array(board.size).fill(undefined).map(_ => ({ piece: Piece.NONE }))),
    moveStack: []
  }

  // Populate cells
  for (let r = 0; r < board.size; r++) {
    for (let c = 0; c < board.size; c++) {
      newBoard.cells[r][c] = { piece: board.cells[r][c].piece };
    }
  }

  board.moveStack.forEach(move => newBoard.moveStack.push(move))

  return newBoard;
}