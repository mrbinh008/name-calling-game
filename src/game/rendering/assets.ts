import spriteAtlas from "@/game/atlas.ts";
import type { SpriteSheet } from "@/game/types.ts";
export async function loadSprite(
  spriteId: string,
): Promise<SpriteSheet | null> {
  const definition = spriteAtlas[spriteId];
  if (!definition) return null;
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("Unable to load sprite: " + definition.url));
    image.src = definition.url;
  });
  return {
    image,
    frames: definition.frames,
  };
}
