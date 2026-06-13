import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface nowTypes {
  board: number[][];
  score: number;
  isGameOver: boolean;
  resetGame: () => void;
  move: (direction: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN') => void;
}

// 1. Dastlabki 4 ta tasodifiy sonli taxtani yaratish (Siz yozgan pishiq mantiq)
const generateRandomBoard = (): number[][] => {
  const board = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ];
  let w1 = 0, w2 = 0, w3 = 0;
  for (let w = 0; w < 4; w++) {
    w1 = Math.floor(Math.random() * 4);
    w2 = Math.floor(Math.random() * 4);
    w3 = Math.random() < 0.9 ? 2 : 4;
    if (board[w1][w2] === 0) {      
      board[w1][w2] = w3;
    } else {
      w--;
    }
  }
  return board;
};

// 2. Taxtaga faqat bitta random son qo'shish (Har muvaffaqiyatli yurishdan keyin)
const addOneRandomTile = (board: number[][]): number[][] => {
  const newBoard = board.map(row => [...row]);
  const emptyCells: { r: number; c: number }[] = [];

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (newBoard[r][c] === 0) emptyCells.push({ r, c });
    }
  }

  if (emptyCells.length > 0) {
    const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    newBoard[r][c] = Math.random() < 0.9 ? 2 : 4;
  }
  return newBoard;
};

// 3. GAME OVER Tekshiruvi: Biror tomonga yurish imkoniyati qolganmi?
const checkGameOver = (board: number[][]): boolean => {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (board[r][c] === 0) return false; // Bo'sh joy bo'lsa, o'yin tugamagan
      if (c < 3 && board[r][c] === board[r][c + 1]) return false; // Yonma-yon bir xil bo'lsa
      if (r < 3 && board[r][c] === board[r + 3 === r + 1 ? r : r + 1][c]) return false; // Tepma-teng bir xil bo'lsa
    }
  }
  return true; // Hech qanday yurish iloji yo'q -> Game Over
};

// 4. Bitta qator/ustunni siqish va birlashtirishning eng mukammal matematik funksiyasi
const processLine = (line: number[]): { newLine: number[]; scoreGain: number; moved: boolean } => {
  // Nollarni chiqarib tashlaymiz
  const filtered = line.filter(num => num !== 0);
  const newLine = [0, 0, 0, 0];
  let scoreGain = 0;
  let targetIndex = 0;

  for (let i = 0; i < filtered.length; i++) {
    if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
      // Bir xil sonlarni birlashtiramiz
      newLine[targetIndex] = filtered[i] * 2;
      scoreGain += filtered[i] * 2;
      i++; // Keyingi sonni o'tkazib yuboramiz (birlashib ketgani uchun)
    } else {
      newLine[targetIndex] = filtered[i];
    }
    targetIndex++;
  }

  // Chindan ham qatorda biror son o'rnidan jildimi yoki yo'qmi tekshiramiz
  const moved = JSON.stringify(line) !== JSON.stringify(newLine);

  return { newLine, scoreGain, moved };
};

export const useNowStore = create<nowTypes>()(
  persist(
    (set, get) => ({
      board: generateRandomBoard(),
      score: 0,
      isGameOver: false,

      resetGame: () => set({
        board: generateRandomBoard(),
        score: 0,
        isGameOver: false
      }),

      move: (direction) => {
        const { board, score, isGameOver } = get();
        if (isGameOver) return;

        const newBoard = [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0]
        ];
        let totalScoreGain = 0;
        let anyMoved = false;

        // Har bir yo'nalish uchun koordinatalarni to'g'ridan-to'g'ri chiziqli o'qiymiz
        if (direction === 'LEFT' || direction === 'RIGHT') {
          for (let r = 0; r < 4; r++) {
            const currentLine = board[r];
            const lineToProcess = direction === 'LEFT' ? currentLine : [...currentLine].reverse();
            
            const { newLine, scoreGain, moved } = processLine(lineToProcess);
            
            newBoard[r] = direction === 'LEFT' ? newLine : newLine.reverse();
            totalScoreGain += scoreGain;
            if (moved) anyMoved = true;
          }
        } else {
          // UP yoki DOWN (Ustunlar bo'yicha chiziqli mantiq)
          for (let c = 0; c < 4; c++) {
            const currentLine = [board[0][c], board[1][c], board[2][c], board[3][c]];
            const lineToProcess = direction === 'UP' ? currentLine : [...currentLine].reverse();
            
            const { newLine, scoreGain, moved } = processLine(lineToProcess);
            const finalLine = direction === 'UP' ? newLine : newLine.reverse();
            
            for (let r = 0; r < 4; r++) {
              newBoard[r][c] = finalLine[r];
            }
            totalScoreGain += scoreGain;
            if (moved) anyMoved = true;
          }
        }

        // Agar kamida bitta blok siljigan bo'lsa, o'yin holatini yangilaymiz
        if (anyMoved) {
          let updatedBoard = addOneRandomTile(newBoard);
          const gameOverStatus = checkGameOver(updatedBoard);

          set({
            board: updatedBoard,
            score: score + totalScoreGain,
            isGameOver: gameOverStatus
          });
        }
      }
    }),
    {
      name: '2048-now'
    }
  )
);