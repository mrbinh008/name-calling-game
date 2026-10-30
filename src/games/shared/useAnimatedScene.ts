import { useEffect, useRef, useState, type RefObject } from "react";
import type { Classroom } from "../../lib/classroom.ts";
import type { AnimatedGameId, GameDefinition } from "../catalog.ts";
import { createAnimatedScene } from "../createScene.ts";
import type { AnimatedScene } from "./AnimatedScene.ts";
import type { PickerAudio } from "./PickerAudio.ts";

export function useAnimatedScene(
  id: AnimatedGameId,
  definition: GameDefinition,
  classroom: Classroom,
  sceneRef: RefObject<AnimatedScene | null>,
  onComplete: () => void,
  paused: boolean,
  audio: PickerAudio,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef<HTMLProgressElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [caption, setCaption] = useState("");
  const [revealedNames, setRevealedNames] = useState<readonly string[]>([]);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let frameId = 0;
    let scene: AnimatedScene | null = null;
    const resize = () =>
      scene?.resize(
        canvas.clientWidth,
        canvas.clientHeight,
        Math.min(window.devicePixelRatio || 1, 1.5),
      );
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    setStatus("loading");
    void (async () => {
      try {
        await document.fonts.ready;
        if (cancelled) return;
        scene = await createAnimatedScene(id, canvas, {
          roster: classroom.roster,
          genders: classroom.genders,
          duration: definition.duration,
        });
        if (cancelled) {
          scene.destroy();
          return;
        }
        const activeScene = scene;
        activeScene.onComplete = () => onCompleteRef.current();
        activeScene.onSound = (url) => audio.play(url);
        sceneRef.current = activeScene;
        resize();
        setStatus("ready");
        let previousTime = performance.now();
        let previousCaption = "";
        let previousRevealedNames = "";
        const draw = (time: number) => {
          if (cancelled) return;
          activeScene.renderFrame(
            (time - previousTime) / 1000,
            canvas.clientWidth,
            canvas.clientHeight,
          );
          previousTime = time;
          if (progressRef.current)
            progressRef.current.value = activeScene.elapsed;
          const nextCaption = activeScene.getStatus();
          if (nextCaption !== previousCaption) {
            setCaption(nextCaption);
            previousCaption = nextCaption;
          }
          const names = activeScene.revealedNames;
          const nextRevealedNames = JSON.stringify(names);
          if (nextRevealedNames !== previousRevealedNames) {
            setRevealedNames(names);
            previousRevealedNames = nextRevealedNames;
          }
          frameId = requestAnimationFrame(draw);
        };
        frameId = requestAnimationFrame(draw);
      } catch (error) {
        if (!cancelled) {
          console.error("Unable to load game artwork:", error);
          setStatus("error");
        }
      }
    })();
    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      observer.disconnect();
      scene?.destroy();
      sceneRef.current = null;
      audio.stopBackground();
    };
  }, [id, definition.duration, classroom, sceneRef, audio, attempt]);
  useEffect(() => {
    sceneRef.current?.setPaused(paused);
  }, [paused, sceneRef]);
  return {
    canvasRef,
    progressRef,
    status,
    caption,
    revealedNames,
    retry: () => setAttempt((value) => value + 1),
  };
}
