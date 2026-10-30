import type { Dispatch, SetStateAction } from "react";
import type { Classroom } from "../lib/classroom.ts";
import type { GameController } from "../hooks/useGame.ts";
import type { GamePanel } from "./Game.tsx";
interface GameHeaderProps {
  classroom: Classroom;
  game: GameController;
  ready: boolean;
  onPanel: Dispatch<SetStateAction<GamePanel>>;
  sound: boolean;
  setSound: Dispatch<SetStateAction<boolean>>;
  fullscreen: boolean;
  onFullscreen: () => Promise<void>;
}
export default function GameHeader({
  classroom,
  game,
  ready,
  onPanel,
  sound,
  setSound,
  fullscreen,
  onFullscreen,
}: GameHeaderProps) {
  const playing = game.phase === "playing";
  return (
    <header className="game-header">
      <div className="game-title">
        <a
          className="game-library-back"
          href="#/"
          aria-label="Về danh sách trò chơi"
        >
          ←
        </a>
        <span className="rooster-icon" aria-hidden="true">
          🐓
        </span>
        <div>
          <h1>Cả Xóm Trốn Trả Bài</h1>
          <p>
            {classroom.title} · {classroom.roster.length} em
            {classroom.isDemo && (
              <span className="demo-label">Lớp minh họa</span>
            )}
          </p>
        </div>
      </div>
      <nav className="header-actions" aria-label="Điều khiển trò chơi">
        <button
          className="header-button"
          onClick={() => onPanel("attendance")}
          disabled={playing || !ready}
        >
          Điểm danh{" "}
          <span className="absent-count">
            {game.absent.length > 0 ? `${game.absent.length} vắng` : ""}
          </span>
        </button>
        <button
          className="icon-button"
          aria-label={fullscreen ? "Thu nhỏ" : "Toàn màn hình"}
          aria-pressed={fullscreen}
          onClick={onFullscreen}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              d={
                fullscreen
                  ? "M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6"
                  : "M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6"
              }
            />
          </svg>
        </button>
        <button
          className="icon-button"
          aria-label={sound ? "Tắt âm thanh" : "Bật âm thanh"}
          aria-pressed={sound}
          onClick={() => setSound((value) => !value)}
        >
          {sound ? "🔊" : "🔇"}
        </button>
        {playing && (
          <button
            className="header-button"
            onClick={() => game.setPaused((value) => !value)}
          >
            {game.paused ? "Tiếp tục" : "Tạm dừng"}
          </button>
        )}
        <button
          className="header-button header-button--dark"
          disabled={playing}
          onClick={() => onPanel("roster")}
        >
          Danh sách lớp
        </button>
      </nav>
    </header>
  );
}
