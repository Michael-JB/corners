import * as movement from "./movement.js";

let playerStartAverage: movement.BoardPosition;

export function onStart(board: movement.Board) {
  playerStartAverage = movement.getAveragePosition(board, movement.playerPiece);
}

export function nextMoves(board: movement.Board): movement.Move[] {
  return minimiseAvgDistMove(board);
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

function minimiseAvgDistMove(board: movement.Board): movement.Move[] {
  const bps = movement.getBoardPositionsForPiece(board, movement.cpuPiece);
  const validMoves = bps.map(bp => movement.getValidMovesFull(board, bp, movement.cpuPiece)).filter(mvs => mvs.length >= 1);
  if (validMoves.length > 0) {
    const bestPieceMoves = validMoves.map(moves => moves.map(m => ({ dist: Number.MAX_VALUE, moves: m })).reduce((acc, cur) => {
      const curBoard = movement.cloneBoard(board);
      for (const move of cur.moves) {
        movement.performMove(curBoard, move, false);
      }
      const avgPos = movement.getAveragePosition(curBoard, movement.cpuPiece);
      cur.dist = movement.euclideanDistance(avgPos, playerStartAverage);
      return cur.dist < acc.dist ? cur : acc;
    }));
    const bestMove = bestPieceMoves.reduce((acc, cur) => cur.dist < acc.dist ? cur : acc);
    return bestMove.moves;
  }
  return [];
}

function selectRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}