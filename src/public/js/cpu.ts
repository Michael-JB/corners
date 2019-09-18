import * as movement from "./movement.js";

export function nextMoves(board: movement.Board): movement.Move[] {
  return longestMove(board);
}

function randomMove(board: movement.Board): movement.Move[] {
  const bps = movement.getBoardPositionsForPiece(board, movement.cpuPiece);
  const validMoves = bps.map(bp => movement.getValidMovesFull(board, bp, movement.cpuPiece)).filter(mvs => mvs.length >= 1);
  if (validMoves.length > 0) return selectRandom(selectRandom(validMoves));
  return [];
}

function longestMove(board: movement.Board): movement.Move[] {
  const bps = movement.getBoardPositionsForPiece(board, movement.cpuPiece);
  const validMoves = bps.map(bp => movement.getValidMovesFull(board, bp, movement.cpuPiece)).filter(mvs => mvs.length >= 1);
  if (validMoves.length > 0) {
    const longestMoves = validMoves.map(moves => moves.reduce((acc, cur) => cur.length > acc.length ? cur : acc, []));
    const longestLongestMove = longestMoves.reduce((acc, cur) => cur.length > acc.length ? cur : acc, []);
    return longestLongestMove;
  }
  return [];
}

function selectRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}