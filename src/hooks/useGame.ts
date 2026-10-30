import type { RefObject } from "react";
import type { Village } from "@/game/types.ts";
import type { VillageScene } from "@/game/scene.ts";
export type GamePhase = "lobby" | "playing" | "result" | "empty";
export type GameController = ReturnType<typeof useGame>;
import { useCallback, useEffect, useState } from "react";
import { createRound } from "@/game/world.ts";
import { villageAudio } from "@/game/audio.ts";
export function useGame(
  village: Village,
  sceneRef: RefObject<VillageScene | null>,
) {
  const [phase, setPhase] = useState<GamePhase>("lobby");
  const [count, setCount] = useState(1);
  const [called, setCalled] = useState<string[]>([]);
  const [absent, setAbsent] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [paused, setPaused] = useState(false);
  const start = useCallback(
    (previous: string[] = called, target?: string) => {
      if (!sceneRef.current || (target && absent.includes(target))) return;
      const round = createRound(
        village,
        new Set(previous),
        new Set(absent),
        count,
        Math.random,
        target
          ? {
              selectedNames: [target],
            }
          : {},
      );
      if (!round) {
        setPhase("empty");
        return;
      }
      setCalled(round.startsNewCycle ? [] : previous);
      setSelected(round.selectedNames);
      setPaused(false);
      sceneRef.current.startRound(round);
      setPhase("playing");
      villageAudio.startBackground();
    },
    [village, sceneRef, called, absent, count],
  );
  const finish = useCallback(() => {
    setPaused(false);
    setPhase("result");
  }, []);
  const skip = useCallback(() => {
    if (!sceneRef.current) return;
    // Move the scene to the final pose as well as displaying the result.
    sceneRef.current.skipToResult();
    sceneRef.current.setPaused(false);
    setPaused(false);
  }, [sceneRef]);
  const commit = () => [...new Set([...called, ...selected])];
  const next = () => start(commit());
  const home = () => {
    setCalled(commit());
    sceneRef.current?.showLobby();
    setPhase("lobby");
    setPaused(false);
    villageAudio.stopBackground();
  };
  const toggleAbsent = (name: string) =>
    setAbsent((list) =>
      list.includes(name)
        ? list.filter((item) => item !== name)
        : [...list, name],
    );
  useEffect(() => {
    sceneRef.current?.setAttendance(called, absent);
  }, [called, absent, sceneRef]);
  useEffect(() => {
    const onHidden = () => {
      if (document.hidden && phase === "playing") setPaused(true);
    };
    document.addEventListener("visibilitychange", onHidden);
    return () => document.removeEventListener("visibilitychange", onHidden);
  }, [phase]);
  return {
    phase,
    count,
    setCount,
    called,
    absent,
    selected,
    paused,
    setPaused,
    start,
    finish,
    skip,
    next,
    home,
    toggleAbsent,
    reset: () => setCalled([]),
    clearAbsent: () => setAbsent([]),
  };
}
