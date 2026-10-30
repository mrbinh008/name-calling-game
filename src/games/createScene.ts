import type { AnimatedGameId } from "./catalog.ts";
import type { AnimatedScene, SceneOptions } from "./shared/AnimatedScene.ts";

export async function createAnimatedScene(
  id: AnimatedGameId,
  canvas: HTMLCanvasElement,
  options: SceneOptions,
): Promise<AnimatedScene> {
  switch (id) {
    case "dog-chase":
      return (await import("./scenes/DogChaseScene.ts")).DogChaseScene.create(
        canvas,
        options,
      );
    case "mango-poke":
      return (await import("./scenes/MangoPokeScene.ts")).MangoPokeScene.create(
        canvas,
        options,
      );
    case "jiangshi":
      return (await import("./scenes/JiangshiScene.ts")).JiangshiScene.create(
        canvas,
        options,
      );
    case "parent-call":
      return (
        await import("./scenes/ParentCallScene.ts")
      ).ParentCallScene.create(canvas, options);
    case "meteor":
      return (await import("./scenes/MeteorScene.ts")).MeteorScene.create(
        canvas,
        options,
      );
  }
}
