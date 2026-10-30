import type { RefObject } from "react";
import type { Village } from "@/game/types.ts";
type SceneStatus = "loading" | "ready" | "error";
import { useEffect, useRef, useState } from "react";
import { VillageScene } from "@/game/scene.ts";
import { villageAudio } from "@/game/audio.ts";
import { gameAudio } from "@/game/sound.ts";
import { drawSpeech } from "@/game/speech.ts";
export function useVillageScene(
  village: Village,
  onResult: () => void,
  paused: boolean,
  sceneRef: RefObject<VillageScene | null>,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const speechRef = useRef<HTMLDivElement>(null);
  const onResultRef = useRef(onResult);
  const [status, setStatus] = useState<SceneStatus>("loading");
  onResultRef.current = onResult;
  useEffect(() => {
    let cancelled = false;
    let animationFrameId = 0;
    let scene: VillageScene | undefined;
    const canvas = canvasRef.current;
    const speech = speechRef.current;
    if (!canvas || !speech) return;
    const resize = () =>
      scene?.resize(
        canvas.clientWidth,
        canvas.clientHeight,
        Math.min(window.devicePixelRatio || 1, 1.5),
      );
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    setStatus("loading");
    speech.replaceChildren();
    (async () => {
      try {
        await document.fonts.ready;
        if (cancelled) return;
        scene = await VillageScene.create(canvas, village);
        if (cancelled) {
          scene.destroy();
          return;
        }
        sceneRef.current = scene;
        scene.onCue = (cue) => {
          if (cue === "result") onResultRef.current();
          villageAudio.playCue(cue);
        };
        resize();
        setStatus("ready");
        let previousFrameTime = performance.now();
        const activeScene = scene;
        const draw = (time: number) => {
          const deltaTime = (time - previousFrameTime) / 1000;
          previousFrameTime = time;
          const frame = activeScene.renderFrame(
            deltaTime,
            canvas.clientWidth,
            canvas.clientHeight,
          );
          drawSpeech(speech, frame, canvas.clientWidth, canvas.clientHeight);
          const sound = activeScene.getSoundState();
          villageAudio.update(sound.musicMood, sound.engineRunning);
          animationFrameId = requestAnimationFrame(draw);
        };
        animationFrameId = requestAnimationFrame(draw);
      } catch (error) {
        if (!cancelled) {
          console.error("Không tải được hoạt cảnh:", error);
          setStatus("error");
        }
      }
    })();
    return () => {
      cancelled = true;
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      scene?.destroy();
      sceneRef.current = null;
      speech.replaceChildren();
      villageAudio.stopBackground();
    };
  }, [village]);
  useEffect(() => {
    sceneRef.current?.setPaused(paused);
    if (paused) villageAudio.stopBackground();
    else if (gameAudio.isEnabled() && sceneRef.current?.isPlaying)
      villageAudio.startBackground();
  }, [paused]);
  return {
    canvasRef,
    speechRef,
    sceneRef,
    status,
  };
}
