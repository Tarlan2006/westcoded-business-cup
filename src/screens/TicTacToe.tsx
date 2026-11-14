import { useEffect, useReducer, useState } from "react";
import { ActivityHeader } from "../components/ActivityHeader";
import { Mascot } from "../components/Mascot";
import { Confetti, TieHearts } from "./ttt/Celebration";
import { Piece } from "./ttt/Piece";
import "./tictactoe.css";

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

type Difficulty = "Easy" | "Clever";
type Result = Mark | "tie";
type Match = {
  board: Cell[];
  starter: Mark;
  turn: Mark;
  result: Result | null;
  scores: Record<Result, number>;
};
type Move = { mark: Mark; index: number; board: Cell[] };

function startRound(starter: Mark, scores: Match["scores"]): Match {
  return { board: Array<Cell>(9).fill(null), starter, turn: starter, result: null, scores };
}

function playRound(match: Match, move: Move | "rematch"): Match {
  if (move === "rematch") {
    return match.result ? startRound(match.starter === "X" ? "O" : "X", match.scores) : match;
  }
  if (match.result || match.board !== move.board || match.turn !== move.mark || match.board[move.index] !== null) return match;

  const board = place(match.board, move.index, move.mark);
  const result = winner(board) ? move.mark : board.every(Boolean) ? "tie" : null;
  const scores = result ? { ...match.scores, [result]: match.scores[result] + 1 } : match.scores;
  return { ...match, board, result, scores, turn: move.mark === "X" ? "O" : "X" };
}

export function TicTacToe({ onBack, onComplete }: { onBack: () => void; onComplete: (won: boolean) => void }) {
  const [difficulty, setDifficulty] = useState<Difficulty>("Easy");
  const [{ board, turn, scores, result }, dispatch] = useReducer(playRound, undefined,
    () => startRound("X", { X: 0, O: 0, tie: 0 }));
  const winningLine = winner(board);
  const thinking = !result && turn === "O";
  const canPlay = !result && !thinking;
  const message = result === "X" ? "Oh no, you got me! You win!" : result === "O" ? "Good game! Want a rematch?"
    : result === "tie" ? "It's a tie, great game!" : thinking ? "Hmm, let me think..."
      : board.includes("X") ? "Nice move! Your turn." : "Your turn!";

  useEffect(() => {
    if (!thinking) return;
    const timer = window.setTimeout(() => {
      const index = difficulty === "Clever" ? cleverMove(board) : easyMove(board, Math.random(), Math.random());
      if (index !== undefined) dispatch({ mark: "O", index, board });
    }, 420);
    return () => window.clearTimeout(timer);
  }, [board, difficulty, thinking]);

  return (
    <main className="shell ttt-shell">
      <ActivityHeader title="Tic-tac-toe" onBack={scores.X === 0 && scores.O + scores.tie > 0 ? () => onComplete(false) : onBack} />
      <section className="ttt-room" aria-labelledby="ttt-title" data-result={result ?? undefined}>
        <header className="ttt-title">
          <h1 id="ttt-title">Stars vs. Clouds</h1>
          <p>You're the star. Make a row of three!</p>
        </header>
        <div className="ttt-controls">
          <div className="ttt-levels" role="group" aria-label="Difficulty">
            {(["Easy", "Clever"] as const).map((level) => (
              <button key={level} type="button" className="ttt-level" aria-pressed={difficulty === level}
                onClick={() => setDifficulty(level)}>{level}</button>
            ))}
          </div>
          <p className="ttt-score">You {scores.X} <span aria-hidden="true">·</span> Computer {scores.O} <span aria-hidden="true">·</span> Ties {scores.tie}</p>
        </div>
        <div className="ttt-host">
          <div className="ttt-mascot"><Mascot mood={thinking ? "thinking" : result ? "happy" : "idle"} /></div>
          <p className="ttt-bubble" aria-live="polite" aria-atomic="true">
            {message}{result === "tie" && <TieHearts />}
          </p>
        </div>
        <div className="ttt-board" role="group" aria-label="Tic-tac-toe board">
          {board.map((cell, index) => (
            <button key={index} type="button" className="ttt-cell" aria-disabled={!canPlay || Boolean(cell)}
              aria-label={`Row ${Math.floor(index / 3) + 1}, column ${index % 3 + 1}, ${cell === "X" ? "star" : cell === "O" ? "cloud" : "empty"}`}
              data-winning={winningLine?.includes(index) || undefined}
              onClick={() => dispatch({ mark: "X", index, board })}>{cell && <Piece kind={cell === "X" ? "star" : "cloud"} />}</button>
          ))}
          {winningLine && <svg className="ttt-win-line" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
            <line x1={18 + (winningLine[0] % 3) * 32} y1={18 + Math.floor(winningLine[0] / 3) * 32}
              x2={18 + (winningLine[2] % 3) * 32} y2={18 + Math.floor(winningLine[2] / 3) * 32} />
          </svg>}
          {result === "X" && <Confetti />}
        </div>
        <div className="ttt-actions">
          <button type="button" className="primary-button" disabled={!result} onClick={() => dispatch("rematch")}>
            <span aria-hidden="true">↻</span> Play again
          </button>
          {scores.X > 0 && <button type="button" className="secondary-button" onClick={() => onComplete(true)}>Collect XP</button>}
        </div>
      </section>
    </main>
  );
}
