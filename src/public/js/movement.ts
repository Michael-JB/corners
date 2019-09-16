export enum Piece {
  NONE,
  WHITE,
  BLACK,
}

export interface Cell {
  piece: Piece;
}

export interface BoardPosition {
  row: number;
  col: number;
}

export interface Board {
  size: number;
  cells: Cell[][];
  turn: Piece;
  lastMove: Move | undefined;
}

export interface Move {
  src: BoardPosition;
  dest: BoardPosition;
}

export function manhattenDistance(board: Board, src: BoardPosition, dest: BoardPosition): number {
  return Math.abs(src.col - dest.col) + Math.abs(src.row - dest.row);
}

export function isBoardPositionEmpty(board: Board, bp: BoardPosition): boolean {
  return board.cells[bp.row][bp.col].piece === Piece.NONE;
}

export function isBoardPositionInBoard(board: Board, bp: BoardPosition): boolean {
  return bp.row >= 0 && bp.row < board.size && bp.col >= 0 && bp.col < board.size;
}

export function getNeighbouringBoardPositions(board: Board, bp: BoardPosition): BoardPosition[] {
  const neighbours = [];

  const north = { row: bp.row - 1, col: bp.col };
  const east = { row: bp.row, col: bp.col + 1 };
  const south = { row: bp.row + 1, col: bp.col };
  const west = { row: bp.row, col: bp.col - 1 };

  if (isBoardPositionInBoard(board, north)) neighbours.push(north);
  if (isBoardPositionInBoard(board, east)) neighbours.push(east);
  if (isBoardPositionInBoard(board, south)) neighbours.push(south);
  if (isBoardPositionInBoard(board, west)) neighbours.push(west);

  return neighbours;
}

export function performMove(board: Board, move: Move): void {
  const piece = board.cells[move.src.row][move.src.col].piece;
  board.cells[move.src.row][move.src.col] = { piece: Piece.NONE };
  board.cells[move.dest.row][move.dest.col] = { piece };
  board.turn = board.turn === Piece.WHITE ? Piece.BLACK : Piece.WHITE;
  board.lastMove = move;
}

export function tryEndTurn(board: Board): void {
  if (board.lastMove && board.cells[board.lastMove.dest.row][board.lastMove.dest.col].piece === board.turn) {
    board.turn = board.turn === Piece.WHITE ? Piece.BLACK : Piece.WHITE;
  }
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

export function isValidMove(board: Board, src: BoardPosition, dest: BoardPosition, piece: Piece): boolean {
  const dr = dest.row - src.row, dc = dest.col - src.col;
  const distance = manhattenDistance(board, src, dest);
  let validHop = false;

  if (distance === 2) {
    if (dr === 0) validHop = !isBoardPositionEmpty(board, { row: src.row, col: src.col + dc / 2 });
    else if (dc === 0) validHop = !isBoardPositionEmpty(board, { row: src.row + dr / 2, col: src.col });
  }

  return board.turn === piece && (distance === 1 || validHop) && isBoardPositionEmpty(board, dest);
}

export function getValidMoves(board: Board, src: BoardPosition): Move[] {
  if (!isBoardPositionEmpty(board, src)) {
    let validMoves: Move[] = [];
    const neighbours = getNeighbouringBoardPositions(board, src);

    neighbours.forEach(neighbour => {
      if (isBoardPositionEmpty(board, neighbour)) {
        validMoves.push({ src, dest: neighbour });
      }
    });

    const immediateHops = getHopMoves(board, src);
    if (immediateHops.length > 0) {
      validMoves = validMoves.concat(immediateHops);
    }

    return validMoves;
  } else return [];
}

export function getHopMoves(board: Board, src: BoardPosition): Move[] {
  if (!isBoardPositionEmpty(board, src)) {
    const validHops: Move[] = [];
    const neighbours = getNeighbouringBoardPositions(board, src);

    neighbours.forEach(neighbour => {
      if (!isBoardPositionEmpty(board, neighbour)) {
        const hopbp = getNeighbouringBoardPositions(board, neighbour).filter(bp => (bp.col === src.col) != (bp.row === src.row));
        if (hopbp.length > 0) {
          if (isBoardPositionEmpty(board, hopbp[0])) {
            validHops.push({ src, dest: hopbp[0] });
          }
        }
      }
    });
    return validHops;
  } else return [];
}