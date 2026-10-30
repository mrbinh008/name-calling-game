import type { Classroom } from "@/lib/classroom.ts";
import {
  lazy,
  Suspense,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { loadClassroom, saveClassroom } from "@/lib/classroom.ts";
import GameLibrary from "@/components/GameLibrary.tsx";
import RosterEditor from "@/components/RosterEditor.tsx";
import { getGameDefinition, parseGameRoute } from "@/games/catalog.ts";

const VillageGame = lazy(() => import("@/components/Game.tsx"));
const AnimatedGame = lazy(() => import("@/games/AnimatedGame.tsx"));

function subscribeToRoute(onChange: () => void): () => void {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

export default function App() {
  const hash = useSyncExternalStore(
    subscribeToRoute,
    () => window.location.hash,
  );
  const activeGameId = parseGameRoute(hash);
  const [classroom, setClassroom] = useState(() => loadClassroom());
  const [revision, setRevision] = useState(0);
  const [notice, setNotice] = useState("");
  const [isEditingRoster, setIsEditingRoster] = useState(false);
  useEffect(() => {
    document.title = activeGameId
      ? `${getGameDefinition(activeGameId).title} · Lớp mình chơi`
      : "Lớp mình chơi · Kho trò chơi lớp học";
    setIsEditingRoster(false);
  }, [activeGameId]);
  function save(value: Classroom) {
    setNotice(
      saveClassroom(value)
        ? ""
        : "Trình duyệt chưa cho lưu. Bạn vẫn có thể chơi trong phiên này.",
    );
    setClassroom(value);
    setRevision((number) => number + 1);
    setIsEditingRoster(false);
  }
  if (!activeGameId)
    return (
      <>
        <GameLibrary
          classroom={classroom}
          onEditRoster={() => setIsEditingRoster(true)}
        />
        {isEditingRoster && (
          <RosterEditor
            classroom={classroom}
            onSave={save}
            onClose={() => setIsEditingRoster(false)}
          />
        )}
        {notice && (
          <p className="library-save-notice" role="status">
            {notice}
          </p>
        )}
      </>
    );
  const sharedProps = {
    classroom,
    onSave: save,
    notice,
    onDismissNotice: () => setNotice(""),
  };
  return (
    <Suspense
      fallback={
        <main className="picker-loading" role="status">
          <p>Đang mở trò chơi…</p>
          <a href="#/">Về danh sách trò chơi</a>
        </main>
      }
    >
      {activeGameId === "village-summon" ? (
        <VillageGame key={`${activeGameId}-${revision}`} {...sharedProps} />
      ) : (
        <AnimatedGame
          key={`${activeGameId}-${revision}`}
          id={activeGameId}
          {...sharedProps}
        />
      )}
    </Suspense>
  );
}
