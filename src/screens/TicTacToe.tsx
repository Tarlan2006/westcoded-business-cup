import { useState } from "react";
import { LearnPage } from "./Home";

type Mark = "X" | "O";
type Cell = Mark | null;
const lines: readonly (readonly [number, number, number])[] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6],
];
const preferredCells = [4, 0, 2, 6, 8, 1, 3, 5, 7];

function place(board: Cell[], index: number, mark: Mark): Cell[] {
  return board.map((cell, position) => position === index ? mark : cell);
}

function winner(board: Cell[]) {
  return lines.find(([a, b, c]) => board[a] && board[a] === board[b] && board[a] === board[c]);
}

function winningMove(board: Cell[], mark: Mark, free: number[]) {
  return free.find((index) => winner(place(board, index, mark)) !== undefined);
}

function easyMove(board: Cell[], chance: number, pick: number) {
  const free = preferredCells.filter((index) => board[index] === null);
  const randomMove = free[Math.floor(pick * free.length)];
  if (chance < .65) return randomMove;
  return winningMove(board, "O", free) ?? winningMove(board, "X", free) ?? randomMove;
}

function scoreMove(board: Cell[], mark: Mark, depth: number): number {
  const line = winner(board);
  if (line) return board[line[0]] === "O" ? 10 - depth : depth - 10;
  const free = preferredCells.filter((index) => board[index] === null);
  if (!free.length) return 0;
  const next = mark === "X" ? "O" : "X";
  const scores = free.map((index) => scoreMove(place(board, index, mark), next, depth + 1));
  return mark === "O" ? Math.max(...scores) : Math.min(...scores);
}

function cleverMove(board: Cell[]) {
  const free = preferredCells.filter((index) => board[index] === null);
  const immediateWin = winningMove(board, "O", free);
  if (immediateWin !== undefined) return immediateWin;
  const block = winningMove(board, "X", free);
  if (block !== undefined) return block;

  let bestMove: number | undefined;
  let bestScore = -Infinity;
  for (const index of free) {
    const score = scoreMove(place(board, index, "O"), "X", 1);
    if (score > bestScore) {
      bestMove = index;
      bestScore = score;
    }
  }
  return bestMove;
}

export function TicTacToe({ onBack, onComplete }: { onBack: () => void; onComplete: (won: boolean) => void }) {
  const [board, setBoard] = useState<Cell[]>(() => Array<Cell>(9).fill(null));
  const winningLine = winner(board);
  const win = winningLine && board[winningLine[0]];
  const done = Boolean(win) || board.every(Boolean);

  function play(index: number) {
    setBoard((current) => {
      if (current[index] || winner(current) || current.every(Boolean)) return current;
      const next = place(current, index, "X");
      if (winner(next)) return next;
      const move = easyMove(next, Math.random(), Math.random());
      return move === undefined ? next : place(next, move, "O");
    });
  }

  return (
    <LearnPage title="Tic-tac-toe" onBack={onBack}>
      <p role="status">{win === "X" ? "You win! +20 XP" : win === "O" ? "Good game! The computer wins." : done
        ? "It’s a tie!" : "You’re X. Tap an open square."}</p>
      <div className="tic-grid" aria-label="Tic-tac-toe board">
        {board.map((cell, index) => (
          <button key={index} type="button" className="memory-card" disabled={done || Boolean(cell)}
            aria-label={`Square ${index + 1}${cell ? `, ${cell}` : ""}`}
            data-mark={cell ?? undefined} data-winning={winningLine?.includes(index) || undefined}
            onClick={() => play(index)}>{cell ?? ""}</button>
        ))}
      </div>
      {done && <button type="button" className="primary-button" onClick={() => onComplete(win === "X")}>
        {win === "X" ? "Collect XP" : "Finish game"}
      </button>}
    </LearnPage>
  );
}
