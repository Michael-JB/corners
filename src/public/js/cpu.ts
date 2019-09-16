import * as movement from "./movement.js";

export function nextMove(board: movement.Board): movement.Move | undefined {

  const bps = movement.getBoardPositionsForPiece(board, movement.Piece.BLACK)

  const validMoves = bps.map(bp => movement.getValidMoves(board, bp)).filter(mvs => mvs.length >= 1);

  if (validMoves.length > 0) return selectRandom(selectRandom(validMoves));

  return undefined;
}

function selectRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}