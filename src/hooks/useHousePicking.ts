import type { PointerEvent, RefObject } from "react";
import type { VillageScene } from "@/game/scene.ts";
import type { GameController } from "@/hooks/useGame.ts";
interface HousePress {
  name: string;
  held: boolean;
  x: number;
  y: number;
  timer: ReturnType<typeof setTimeout> | null;
}
import { useEffect, useRef } from "react";
export function useHousePicking(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  sceneRef: RefObject<VillageScene | null>,
  game: GameController,
  ready: boolean,
) {
  const pointer = useRef<HousePress | null>(null);
  useEffect(
    () => () => {
      if (pointer.current?.timer) clearTimeout(pointer.current.timer);
    },
    [],
  );
  const cancelPointer = () => {
    if (pointer.current?.timer) clearTimeout(pointer.current.timer);
    pointer.current = null;
  };
  const pointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (event.button !== 0 || !ready || game.phase !== "lobby") return;
    cancelPointer();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const name = sceneRef.current?.getHouseAt(
      event.clientX - rect.left,
      event.clientY - rect.top,
    );
    if (!name) return;
    const hold: HousePress = {
      name,
      held: false,
      x: event.clientX,
      y: event.clientY,
      timer: null,
    };
    hold.timer = setTimeout(() => {
      hold.held = true;
      game.toggleAbsent(name);
    }, 650);
    pointer.current = hold;
  };
  const pointerUp = () => {
    const hold = pointer.current;
    cancelPointer();
    if (hold && !hold.held) game.start(undefined, hold.name);
  };
  return {
    onPointerDown: pointerDown,
    onPointerUp: pointerUp,
    onPointerLeave: cancelPointer,
    onPointerCancel: cancelPointer,
    onPointerMove: (event: PointerEvent<HTMLCanvasElement>) => {
      if (
        pointer.current &&
        Math.hypot(
          event.clientX - pointer.current.x,
          event.clientY - pointer.current.y,
        ) > 12
      )
        cancelPointer();
    },
  };
}
