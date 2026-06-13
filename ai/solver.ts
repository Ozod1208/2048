export interface AiDecision {
  bestMove: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | null;
  scores: Record<'LEFT' | 'RIGHT' | 'UP' | 'DOWN', number | string>;
  reason: string;
}

// Mukammal vazn matritsasi (Gradient burchak tizimi)
const SCORE_MATRIX = [
  [10000, 5000, 2500, 1250],
  [100,   200,  400,  800],
  [50,    25,   12,   6],
  [0,     1,    2,    4]
];

const simulateLine = (line: number[]): number[] => {
  const filtered = line.filter(num => num !== 0);
  const newLine = [0, 0, 0, 0];
  let targetIndex = 0;
  for (let i = 0; i < filtered.length; i++) {
    if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
      newLine[targetIndex] = filtered[i] * 2;
      i++;
    } else {
      newLine[targetIndex] = filtered[i];
    }
    targetIndex++;
  }
  return newLine;
};

const simulateMove = (board: number[][], direction: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN'): number[][] => {
  const newBoard = Array(4).fill(null).map(() => Array(4).fill(0));
  if (direction === 'LEFT' || direction === 'RIGHT') {
    for (let r = 0; r < 4; r++) {
      const line = direction === 'LEFT' ? board[r] : [...board[r]].reverse();
      const processed = simulateLine(line);
      newBoard[r] = direction === 'LEFT' ? processed : processed.reverse();
    }
  } else {
    for (let c = 0; c < 4; c++) {
      const line = [board[0][c], board[1][c], board[2][c], board[3][c]];
      const processed = direction === 'UP' ? simulateLine(line) : simulateLine([...line].reverse());
      const finalLine = direction === 'UP' ? processed : processed.reverse();
      for (let r = 0; r < 4; r++) {
        newBoard[r][c] = finalLine[r];
      }
    }
  }
  return newBoard;
};

// TAHTANI ULTRA-PROFESSINAL BAHOLASH (Monotonlik + Silliqlik + Bo'sh joy)
const evaluateBoard = (board: number[][]): number => {
  let matrixScore = 0;
  let emptyCells = 0;
  let smoothness = 0;

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const val = board[r][c];
      if (val === 0) {
        emptyCells++;
      } else {
        // 1. Matritsa bo'yicha burchak qiymati
        matrixScore += val * SCORE_MATRIX[r][c];

        // 2. Silliqlikni hisoblash (O'ng va Pastdagi qo'shnilar bilan farq)
        if (c < 3 && board[r][c + 1] !== 0) {
          smoothness -= Math.abs(Math.log2(val) - Math.log2(board[r][c + 1]));
        }
        if (r < 3 && board[r + 1][c] !== 0) {
          smoothness -= Math.abs(Math.log2(val) - Math.log2(board[r + 1][c]));
        }
      }
    }
  }

  // Bo'sh joylar soniga geometrik ko'paytma bonus
  const emptyBonus = emptyCells * emptyCells * 500;
  // Silliqlik mukofoti (farq qanchalik kam bo'lsa, smoothness shunchalik 0 ga yaqin bo'ladi)
  const smoothnessBonus = smoothness * 200;

  return matrixScore + emptyBonus + smoothnessBonus;
};

// Advanced Expectimax
const expectimax = (board: number[][], depth: number, isPlayerTurn: boolean): number => {
  if (depth === 0) {
    return evaluateBoard(board);
  }

  if (isPlayerTurn) {
    let maxEval = -Infinity;
    const directions: ('LEFT' | 'RIGHT' | 'UP' | 'DOWN')[] = ['LEFT', 'RIGHT', 'UP', 'DOWN'];
    let moved = false;

    for (const dir of directions) {
      const nextBoard = simulateMove(board, dir);
      if (JSON.stringify(board) === JSON.stringify(nextBoard)) continue;
      
      moved = true;
      const currentEval = expectimax(nextBoard, depth - 1, false);
      if (currentEval > maxEval) maxEval = currentEval;
    }
    return moved ? maxEval : evaluateBoard(board);
  } else {
    let totalEval = 0;
    let emptyCount = 0;

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (board[r][c] === 0) {
          emptyCount++;
          
          const b2 = board.map(row => [...row]); b2[r][c] = 2;
          totalEval += expectimax(b2, depth - 1, true) * 0.9;

          const b4 = board.map(row => [...row]); b4[r][c] = 4;
          totalEval += expectimax(b4, depth - 1, true) * 0.1;
        }
      }
    }
    return emptyCount === 0 ? evaluateBoard(board) : totalEval / emptyCount;
  }
};

export const getBestMove = (board: number[][]): AiDecision => {
  const directions: ('LEFT' | 'RIGHT' | 'UP' | 'DOWN')[] = ['LEFT', 'RIGHT', 'UP', 'DOWN'];
  let bestMove: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | null = null;
  let maxScore = -Infinity;

  const scores: Record<'LEFT' | 'RIGHT' | 'UP' | 'DOWN', number | string> = {
    LEFT: 'Yura olmaydi', RIGHT: 'Yura olmaydi', UP: 'Yura olmaydi', DOWN: 'Yura olmaydi'
  };

  // CHUQLIK 5 QADAMGA OSHIRILDI! (Haqiqiy superkompyuter darajasi)
  // Agar o'yin oxirida telefon sal sekinlashsa, buni 4 qilsangiz ham juda kuchli o'ynaydi.
  const SEARCH_DEPTH = 5;

  for (const dir of directions) {
    const nextBoard = simulateMove(board, dir);
    if (JSON.stringify(board) === JSON.stringify(nextBoard)) continue;

    const currentEval = expectimax(nextBoard, SEARCH_DEPTH - 1, false);
    scores[dir] = Math.round(currentEval);

    if (currentEval > maxScore) {
      maxScore = currentEval;
      bestMove = dir;
    }
  }

  return { 
    bestMove, 
    scores, 
    reason: `Zevs algoritmi 5 qadam kelajakdagi silliqlik zanjirini tahlil qildi.` 
  };
};