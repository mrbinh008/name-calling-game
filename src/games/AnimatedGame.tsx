import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type { Classroom } from "../lib/classroom.ts";
import type { AnimatedGameId } from "./catalog.ts";
import { getGameDefinition } from "./catalog.ts";
import type { AnimatedScene } from "./shared/AnimatedScene.ts";
import { PickerAudio } from "./shared/PickerAudio.ts";
import { usePickerSession } from "./shared/usePickerSession.ts";
import { useAnimatedScene } from "./shared/useAnimatedScene.ts";
import { useGamePreferences } from "../hooks/useGamePreferences.ts";
import PickerHeader from "./shared/PickerHeader.tsx";
import PickerResult from "./shared/PickerResult.tsx";
import RosterEditor from "../components/RosterEditor.tsx";
import Attendance from "../components/Attendance.tsx";
import Modal from "../components/Modal.tsx";
import MangoCanopy from "./mango/MangoCanopy.tsx";

interface AnimatedGameProps {
  id: AnimatedGameId;
  classroom: Classroom;
  onSave: (classroom: Classroom) => void;
  notice: string;
  onDismissNotice: () => void;
}

export default function AnimatedGame({
  id,
  classroom,
  onSave,
  notice,
  onDismissNotice,
}: AnimatedGameProps) {
  const definition = getGameDefinition(id);
  const audio = useMemo(
    () => new PickerAudio(definition.backgroundTrack),
    [definition],
  );
  const sceneRef = useRef<AnimatedScene | null>(null);
  const session = usePickerSession(classroom.roster, sceneRef, audio);
  const scene = useAnimatedScene(
    id,
    definition,
    classroom,
    sceneRef,
    session.finish,
    session.paused,
    audio,
  );
  const playing = session.phase === "playing";
  const ready = scene.status === "ready";
  const present = classroom.roster.length - session.absent.length;
  const [panel, setPanel] = useState<"roster" | "attendance" | null>(null);
  const preferences = useGamePreferences(playing, session.paused, audio);
  useEffect(() => () => audio.dispose(), [audio]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        !ready ||
        panel ||
        event.repeat ||
        event.ctrlKey ||
        event.altKey ||
        event.metaKey ||
        (event.target instanceof HTMLElement &&
          event.target.closest("a, button, input, textarea, select, dialog"))
      )
        return;
      if (
        session.phase === "lobby" &&
        (event.key === "Enter" || event.code === "Space")
      ) {
        event.preventDefault();
        session.start();
      } else if (playing && event.key === "Enter") {
        event.preventDefault();
        session.skip();
      } else if (
        playing &&
        (event.code === "Space" || event.key.toLowerCase() === "p")
      ) {
        event.preventDefault();
        session.setPaused((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [session, ready, panel, playing]);

  return (
    <main
      className={`picker-shell picker-shell--${id}${playing ? " is-playing" : ""}${preferences.fullscreen ? " is-fullscreen" : ""}`}
      style={{ "--game-accent": definition.accent } as CSSProperties}
    >
      <canvas
        className="picker-canvas"
        ref={scene.canvasRef}
        aria-label={`Hoạt cảnh ${definition.title}`}
      />
      <PickerHeader
        definition={definition}
        classroom={classroom}
        playing={playing}
        paused={session.paused}
        ready={ready}
        sound={preferences.sound}
        fullscreen={preferences.fullscreen}
        onRoster={() => setPanel("roster")}
        onAttendance={() => setPanel("attendance")}
        onPause={() => session.setPaused((value) => !value)}
        onSound={() => preferences.setSound((value) => !value)}
        onFullscreen={() => void preferences.toggleFullscreen()}
      />
      {id === "mango-poke" && ready && (
        <MangoCanopy
          roster={classroom.roster}
          absent={session.absent}
          called={session.called}
          selectedNames={
            session.phase === "result"
              ? (session.round?.selectedNames ?? [])
              : playing
                ? scene.revealedNames.filter((name) =>
                    session.round?.selectedNames.includes(name),
                  )
                : []
          }
        />
      )}
      {scene.status === "loading" && (
        <div className="picker-loading" role="status">
          <div className="xm-tai__vong" />
          <p>Đang chuẩn bị {definition.title}…</p>
        </div>
      )}
      {scene.status === "error" && (
        <div className="picker-loading" role="alert">
          <p>Chưa tải được hình ảnh của trò chơi.</p>
          <button className="xm-nut" onClick={scene.retry}>
            Thử lại
          </button>
          <a href="#/">Về danh sách trò chơi</a>
        </div>
      )}
      {(notice || preferences.message) && (
        <div className="notice" role="status">
          {preferences.message || notice}
          <button
            aria-label="Đóng thông báo"
            onClick={() => {
              preferences.setMessage("");
              onDismissNotice();
            }}
          >
            ✕
          </button>
        </div>
      )}
      {ready && (
        <div
          className={`picker-caption ${playing ? "is-playing" : ""}`}
          role="status"
        >
          {session.phase === "result"
            ? `Mời ${session.round?.selectedNames.join(", ")} lên bảng.`
            : scene.caption}
        </div>
      )}
      {ready && session.phase === "lobby" && (
        <section className="picker-lobby" aria-label="Bắt đầu gọi tên">
          <div className="picker-controls">
            {definition.maxSelection > 1 && (
              <div className="xm-bang__dong">
                <span>Số em</span>
                {Array.from(
                  { length: definition.maxSelection },
                  (_unused, index) => index + 1,
                ).map((count) => (
                  <button
                    key={count}
                    className={`xm-chip ${session.count === count ? "is-selected" : ""}`}
                    aria-label={`Gọi ${count} em`}
                    aria-pressed={session.count === count}
                    disabled={count > Math.max(1, present)}
                    onClick={() => session.setCount(count)}
                  >
                    {count}
                  </button>
                ))}
              </div>
            )}
            <button
              className="xm-nut xm-nut--lon"
              onClick={() => session.start()}
              disabled={present === 0}
            >
              Bắt đầu
            </button>
            <p>
              {present} em có mặt · {session.called.length} đã gọi
              {session.called.length > 0 && (
                <>
                  {" "}
                  ·{" "}
                  <button className="xm-lien-ket" onClick={session.reset}>
                    Bắt đầu vòng mới
                  </button>
                </>
              )}
              {present === 0 && (
                <>
                  {" "}
                  ·{" "}
                  <button className="xm-lien-ket" onClick={session.clearAbsent}>
                    Bỏ đánh dấu vắng
                  </button>
                </>
              )}
            </p>
          </div>
        </section>
      )}
      {playing && (
        <div className="picker-progress">
          <progress
            ref={scene.progressRef}
            max={definition.duration}
            aria-label="Tiến trình lượt chơi"
          />
          <button onClick={session.skip}>
            Xem ngay kết quả <kbd>Enter</kbd>
          </button>
        </div>
      )}
      {playing && session.paused && (
        <Modal
          className="picker-pause"
          labelledBy="picker-pause-title"
          onClose={() => session.setPaused(false)}
        >
          <h2 id="picker-pause-title">Tạm dừng một chút</h2>
          <button
            className="xm-nut"
            autoFocus
            onClick={() => session.setPaused(false)}
          >
            Tiếp tục
          </button>
          <button className="text-button" onClick={session.skip}>
            Xem kết quả
          </button>
        </Modal>
      )}
      {session.phase === "result" && session.round && (
        <PickerResult
          definition={definition}
          names={session.round.selectedNames}
          onNext={session.next}
          onHome={session.home}
        />
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
          absent={session.absent}
          called={session.called}
          onToggle={session.toggleAbsent}
          onCall={(name) => {
            setPanel(null);
            session.start(undefined, name);
          }}
          onClose={() => setPanel(null)}
        />
      )}
    </main>
  );
}
