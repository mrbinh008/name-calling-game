import type { GameDefinition } from "../catalog.ts";
import type { Classroom } from "../../lib/classroom.ts";

interface PickerHeaderProps {
  definition: GameDefinition;
  classroom: Classroom;
  playing: boolean;
  paused: boolean;
  ready: boolean;
  sound: boolean;
  fullscreen: boolean;
  onRoster: () => void;
  onAttendance: () => void;
  onPause: () => void;
  onSound: () => void;
  onFullscreen: () => void;
}

export default function PickerHeader({
  definition,
  classroom,
  playing,
  paused,
  ready,
  sound,
  fullscreen,
  onRoster,
  onAttendance,
  onPause,
  onSound,
  onFullscreen,
}: PickerHeaderProps) {
  return (
    <header className="picker-header">
      <div className="picker-heading">
        <a
          href="#/"
          className="picker-library-link"
          aria-label="Về danh sách trò chơi"
        >
          ←
        </a>
        <div>
          <h1>{definition.title}</h1>
          <p>
            {classroom.title} · {classroom.roster.length} học sinh
            {classroom.isDemo ? " · Lớp minh họa" : ""}
          </p>
        </div>
      </div>
      <nav aria-label="Điều khiển trò chơi" className="header-actions">
        <button
          className="header-button"
          onClick={onAttendance}
          disabled={playing || !ready}
        >
          Điểm danh
        </button>
        <button
          className="icon-button"
          aria-label={sound ? "Tắt âm thanh" : "Bật âm thanh"}
          aria-pressed={sound}
          onClick={onSound}
        >
          {sound ? "🔊" : "🔇"}
        </button>
        <button
          className="icon-button"
          aria-label={fullscreen ? "Thu nhỏ" : "Toàn màn hình"}
          aria-pressed={fullscreen}
          onClick={onFullscreen}
        >
          <svg
            width="19"
            height="19"
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
        {playing && (
          <button className="header-button" onClick={onPause}>
            {paused ? "Tiếp tục" : "Tạm dừng"}
          </button>
        )}
        <button
          className="header-button header-button--dark"
          onClick={onRoster}
          disabled={playing}
        >
          Danh sách lớp
        </button>
      </nav>
    </header>
  );
}
