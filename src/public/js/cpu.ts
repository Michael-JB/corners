import * as movement from "./movement.js";

export function nextMove(board: movement.Board): movement.Move | null {
  const bps = movement.getBoardPositionsForPiece(board, movement.cpuPiece);
  const validMoves = bps.map(bp => movement.getValidMoves(board, bp, movement.cpuPiece)).filter(mvs => mvs.length >= 1);
  if (validMoves.length > 0) return selectRandom(selectRandom(validMoves));
  return null;
}

function selectRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}