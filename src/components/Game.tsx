import type { Classroom } from "../lib/classroom.ts";
import type { VillageScene } from "../game/scene.ts";
export type GamePanel = "roster" | "attendance" | null;
interface GameProps {
  classroom: Classroom;
  onSave: (classroom: Classroom) => void;
  notice: string;
  onDismissNotice: () => void;
}
import { useEffect, useMemo, useRef, useState } from "react";
import { createVillage } from "../game/world.ts";
import { useVillageScene } from "../hooks/useVillageScene.ts";
import { useGame } from "../hooks/useGame.ts";
import RosterEditor from "./RosterEditor.tsx";
import Attendance from "./Attendance.tsx";
import Result from "./Result.tsx";
import GameHeader from "./GameHeader.tsx";
import Lobby from "./Lobby.tsx";
import { useGamePreferences } from "../hooks/useGamePreferences.ts";
import { useHousePicking } from "../hooks/useHousePicking.ts";
export default function Game({
  classroom,
  onSave,
  notice,
  onDismissNotice,
}: GameProps) {
  const [aspect] = useState(() =>
    Math.min(2.4, Math.max(1.2, window.innerWidth / window.innerHeight)),
  );
  const village = useMemo(
    () => createVillage(classroom.roster, classroom.genders, aspect),
    [classroom, aspect],
  );
  const sceneRef = useRef<VillageScene | null>(null);
  const game = useGame(village, sceneRef);
  const { canvasRef, speechRef, status } = useVillageScene(
    village,
    game.finish,
    game.paused,
    sceneRef,
  );
  const [panel, setPanel] = useState<GamePanel>(null);
  const playing = game.phase === "playing";
  const present = classroom.roster.length - game.absent.length;
  const ready = status === "ready";
  const { sound, setSound, fullscreen, message, setMessage, toggleFullscreen } =
    useGamePreferences(playing, game.paused);
  const houseHandlers = useHousePicking(canvasRef, sceneRef, game, ready);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        !ready ||
        panel ||
        (event.target instanceof HTMLElement &&
          event.target.closest("a, button, input, textarea, select, dialog")) ||
        event.ctrlKey ||
        event.altKey ||
        event.metaKey ||
        event.repeat
      )
        return;
      if (
        game.phase === "lobby" &&
        (event.code === "Space" || event.key === "Enter")
      ) {
        event.preventDefault();
        game.start();
      }
      if (
        playing &&
        (event.code === "Space" || event.key.toLowerCase() === "p")
      ) {
        event.preventDefault();
        game.setPaused((value) => !value);
      }
      if (playing && event.key === "Enter") {
        event.preventDefault();
        game.skip();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [game, panel, ready, playing]);
  return (
    <main className="xm-shell game-shell">
      <canvas
        ref={canvasRef}
        className={`village-canvas ${game.phase === "lobby" ? "xm-canvas--selectable" : ""}`}
        aria-label="Xóm của lớp. Bấm nhà để gọi học sinh; giữ lâu để đánh dấu vắng. Có thể dùng nút Điểm danh thay thế."
        {...houseHandlers}
        onContextMenu={(event) => event.preventDefault()}
      />
      <div className="xm-lop" ref={speechRef} aria-hidden="true" />
      <GameHeader
        classroom={classroom}
        game={game}
        ready={ready}
        onPanel={setPanel}
        sound={sound}
        setSound={setSound}
        fullscreen={fullscreen}
        onFullscreen={toggleFullscreen}
      />
      <div className="sr-only" role="status">
        {game.phase === "result"
          ? `Mời ${game.selected.join(", ")} lên bảng trả bài.`
          : playing
            ? "Gà đang đi gọi học sinh."
            : `Có ${present} em đi học, ${game.called.length} em đã được gọi.`}
      </div>
      {(notice || message) && (
        <div className="notice" role="status">
          {message || notice}
          <button
            aria-label="Đóng thông báo"
            onClick={() => {
              setMessage("");
              onDismissNotice();
            }}
          >
            ✕
          </button>
        </div>
      )}
      {status === "loading" && (
        <div className="xm-tai" role="status">
          <div className="xm-tai__vong" />
          <p>Gà đang dắt xe ra khỏi đồn…</p>
        </div>
      )}
      {status === "error" && (
        <div className="xm-tai" role="alert">
          <p>Chưa tải được ảnh hoạt cảnh.</p>
          <button className="xm-nut" onClick={() => window.location.reload()}>
            Thử lại
          </button>
        </div>
      )}
      {ready && game.phase === "lobby" && (
        <Lobby game={game} present={present} />
      )}
      {playing && !game.paused && (
        <button className="skip-button" onClick={game.skip}>
          Xem ngay kết quả <kbd>Enter</kbd>
        </button>
      )}
      {playing && game.paused && (
        <div className="pause-overlay">
          <div className="pause-board">
            <span aria-hidden="true">Ⅱ</span>
            <h2>Xóm đang nghỉ một chút</h2>
            <button className="xm-nut" onClick={() => game.setPaused(false)}>
              Tiếp tục
            </button>
            <button className="text-button" onClick={game.skip}>
              Xem kết quả
            </button>
          </div>
        </div>
      )}
      {game.phase === "result" && (
        <Result
          selected={game.selected}
          calledCount={game.called.length}
          onNext={game.next}
          onHome={game.home}
        />
      )}
      {game.phase === "empty" && (
        <div className="pause-overlay">
          <div className="pause-board">
            <h2>Xóm vắng tanh</h2>
            <p>Cả lớp đang được đánh dấu vắng.</p>
            <button
              className="xm-nut"
              onClick={() => {
                game.clearAbsent();
                game.home();
              }}
            >
              Về xóm
            </button>
          </div>
        </div>
      )}
      {panel === "roster" && (
        <RosterEditor
          classroom={classroom}
          onSave={onSave}
          onClose={() => setPanel(null)}
        />
      )}
      {panel === "attendance" && (
        <Attendance
          roster={classroom.roster}
          absent={game.absent}
          called={game.called}
          onToggle={game.toggleAbsent}
          onCall={(name) => {
            setPanel(null);
            game.start(undefined, name);
          }}
          onClose={() => setPanel(null)}
        />
      )}
    </main>
  );
}
