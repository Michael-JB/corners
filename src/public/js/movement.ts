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

export function manhattenDistance(board: Board, src: BoardPosition, dest: BoardPosition): number {
  return Math.abs(src.col - dest.col) + Math.abs(src.row - dest.row);
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
      if (r >= (board.size - rows) && c < cols) cell.piece = playerPiece;
      else if (c >= (board.size - cols) && r < rows) cell.piece = cpuPiece;
      board.cells[r][c] = cell;
    }
  }
  board.moveStack = [];
  board.turn = playerPiece;
}

export function performMove(board: Board, move: Move): void {
  board.cells[move.src.row][move.src.col].piece = Piece.NONE;
  board.cells[move.dest.row][move.dest.col].piece = move.piece;
  board.moveStack.push(move);
  if (getValidMoves(board, move.dest, move.piece).length === 0) {
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
  const distance = manhattenDistance(board, move.src, move.dest);
  const validHop = isValidHop(board, move, piece);
  const isFirstMove = !lastMove || lastMove.piece != piece;

  return board.turn === piece && ((isFirstMove && distance === 1) || validHop) && isBoardPositionEmpty(board, move.dest);
}

export function isValidHop(board: Board, move: Move, piece: Piece): boolean {
  const lastMove = peek(board.moveStack);
  const dr = move.dest.row - move.src.row, dc = move.dest.col - move.src.col;
  const distance = manhattenDistance(board, move.src, move.dest);
  let legalHop = false;
  let canHop = false;

  if (lastMove) {
    const lastMoveDistance = manhattenDistance(board, lastMove.src, lastMove.dest);
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