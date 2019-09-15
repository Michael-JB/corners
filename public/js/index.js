const board = Array(8).fill(0).map(x => Array(8).fill(0));
initBoard();

function initBoard() {
  for (let r = 5; r < 8; r++) {
    for (let c = 0; c < 4; c++) {
      board[r][c] = 1;
    }
  }

  for (let r = 0; r < 3; r++) {
    for (let c = 4; c < 8; c++) {
      board[r][c] = 2;
    }
  }
}

function drawBoard() {
  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d');

  board.forEach((row, r) => {
    row.forEach((tile, c) => {
      ctx.fillStyle = (r + c) % 2 ? '#5D737E' : '#CCDBDC';
      const w = canvas.width / row.length, h = canvas.height / board.length;
      const x = c * w, y = r * h;
      ctx.fillRect(x, y, w, h);

      if (tile === 1) {
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, w / 3, 0, 2 * Math.PI, false);
        ctx.fillStyle = '#F0F0F0';
        ctx.strokeStyle = '#1E1E1E';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
      } else if (tile === 2) {
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, w / 3, 0, 2 * Math.PI, false);
        ctx.fillStyle = '#3C3C3C';
        ctx.strokeStyle = '#1E1E1E';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
      }
    });
  });
}

window.onload = drawBoard;