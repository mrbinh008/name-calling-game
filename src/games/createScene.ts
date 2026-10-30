import type { AnimatedGameId } from "@/games/catalog.ts";
import type {
  AnimatedScene,
  SceneOptions,
} from "@/games/shared/AnimatedScene.ts";

export async function createAnimatedScene(
  id: AnimatedGameId,
  canvas: HTMLCanvasElement,
  options: SceneOptions,
): Promise<AnimatedScene> {
  switch (id) {
    case "dog-chase":
      return (
        await import("@/games/scenes/DogChaseScene.ts")
      ).DogChaseScene.create(canvas, options);
    case "mango-poke":
      return (
        await import("@/games/scenes/MangoPokeScene.ts")
      ).MangoPokeScene.create(canvas, options);
    case "jiangshi":
      return (
        await import("@/games/scenes/JiangshiScene.ts")
      ).JiangshiScene.create(canvas, options);
    case "parent-call":
      return (
        await import("@/games/scenes/ParentCallScene.ts")
      ).ParentCallScene.create(canvas, options);
    case "meteor":
      return (await import("@/games/scenes/MeteorScene.ts")).MeteorScene.create(
        canvas,
        options,
      );
  }
}
