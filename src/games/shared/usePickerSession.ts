import { useCallback, useEffect, useState, type RefObject } from "react";
import type { AnimatedScene } from "@/games/shared/AnimatedScene.ts";
import {
  selectPickerRound,
  type PickerRound,
} from "@/games/shared/selection.ts";
import type { PickerAudio } from "@/games/shared/PickerAudio.ts";

export type PickerPhase = "lobby" | "playing" | "result";
export type PickerSession = ReturnType<typeof usePickerSession>;

export function usePickerSession(
  roster: string[],
  sceneRef: RefObject<AnimatedScene | null>,
  audio: PickerAudio,
) {
  const [phase, setPhase] = useState<PickerPhase>("lobby");
  const [count, setCount] = useState(1);
  const [called, setCalled] = useState<string[]>([]);
  const [absent, setAbsent] = useState<string[]>([]);
  const [round, setRound] = useState<PickerRound | null>(null);
  const [paused, setPaused] = useState(false);
  const start = useCallback(
    (previous = called, target?: string) => {
      const scene = sceneRef.current;
      if (!scene) return;
      const nextRound = selectPickerRound(
        roster,
        new Set(previous),
        new Set(absent),
        count,
        Math.random,
        target,
      );
      if (!nextRound) return;
      setCalled(nextRound.startsNewCycle ? [] : previous);
      setRound(nextRound);
      setPaused(false);
      setPhase("playing");
      scene.startRound(nextRound);
      audio.startBackground();
    },
    [called, absent, count, roster, sceneRef, audio],
  );
  const finish = useCallback(() => {
    setPaused(false);
    setPhase("result");
    audio.stopBackground();
    audio.play("tone:result");
  }, [audio]);
  const skip = () => {
    sceneRef.current?.skipToResult();
    setPaused(false);
  };
  const completedNames = () => [
    ...new Set([...called, ...(round?.selectedNames ?? [])]),
  ];
  const next = () => start(completedNames());
  const home = () => {
    setCalled(completedNames());
    setPhase("lobby");
    setPaused(false);
    sceneRef.current?.showLobby();
    audio.stopBackground();
  };
  const toggleAbsent = (name: string) =>
    setAbsent((names) =>
      names.includes(name)
        ? names.filter((value) => value !== name)
        : [...names, name],
    );

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && phase === "playing") setPaused(true);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [phase]);
  return {
    phase,
    count,
    setCount,
    called,
    absent,
    round,
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
