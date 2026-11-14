import { useState } from "react";
import { LearnPage } from "./Home";

type Cell = "X" | "O" | null;
const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

function winner(board: Cell[]) {
  return lines.find(([a, b, c]) => board[a] && board[a] === board[b] && board[a] === board[c]);
}

function computerMove(board: Cell[]) {
  const free = board.flatMap((cell, index) => cell ? [] : [index]);
  const winningMove = (mark: "X" | "O") => free.find((index) => {
    const trial = [...board];
    trial[index] = mark;
    return winner(trial) !== undefined;
  });
  return winningMove("O") ?? (Math.random() < .55 ? winningMove("X") : undefined)
    ?? free[Math.floor(Math.random() * free.length)];
}

export function TicTacToe({ onBack, onComplete }: { onBack: () => void; onComplete: (won: boolean) => void }) {
  const [board, setBoard] = useState<Cell[]>(() => Array<Cell>(9).fill(null));
  const winningLine = winner(board);
  const win = winningLine && board[winningLine[0]];
  const done = Boolean(win) || board.every(Boolean);

  function play(index: number) {
    setBoard((current) => {
      if (current[index] || winner(current) || current.every(Boolean)) return current;
      const next = [...current];
      next[index] = "X";
      if (!winner(next) && next.some((cell) => cell === null)) next[computerMove(next)] = "O";
      return next;
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
