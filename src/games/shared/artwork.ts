export interface ArtworkFrame {
  x: number;
  y: number;
  width: number;
  height: number;
  bounds: [number, number, number, number];
  offsetX?: number;
  offsetY?: number;
  sourceWidth?: number;
  sourceHeight?: number;
}
export interface ArtworkDefinition {
  url: string;
  frames: ArtworkFrame[];
  animations?: Record<string, number[]>;
}
export interface LoadedArtwork {
  image: HTMLImageElement;
  definition: ArtworkDefinition;
}
export type ArtworkBank = Map<string, LoadedArtwork>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function readNumber(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value))
    throw new Error("Invalid artwork coordinate");
  return value;
}
function readFrame(value: unknown): ArtworkFrame {
  if (
    !isRecord(value) ||
    !Array.isArray(value.bounds) ||
    value.bounds.length !== 4
  )
    throw new Error("Invalid sprite frame");
  const bounds = value.bounds.map(readNumber);
  const frame: ArtworkFrame = {
    x: readNumber(value.x),
    y: readNumber(value.y),
    width: readNumber(value.width),
    height: readNumber(value.height),
    bounds: [bounds[0], bounds[1], bounds[2], bounds[3]],
  };
  if (value.sourceWidth !== undefined) {
    frame.sourceWidth = readNumber(value.sourceWidth);
    frame.sourceHeight = readNumber(value.sourceHeight);
    frame.offsetX = readNumber(value.offsetX);
    frame.offsetY = readNumber(value.offsetY);
  }
  return frame;
}

export function readArtworkDefinitions(
  source: unknown,
): Record<string, ArtworkDefinition> {
  if (!isRecord(source)) throw new Error("Invalid artwork manifest");
  const definitions: Record<string, ArtworkDefinition> = {};
  for (const [key, value] of Object.entries(source)) {
    if (
      !isRecord(value) ||
      typeof value.url !== "string" ||
      !value.url.startsWith("/") ||
      !Array.isArray(value.frames)
    )
      throw new Error(`Invalid artwork: ${key}`);
    const definition: ArtworkDefinition = {
      url: value.url,
      frames: value.frames.map(readFrame),
    };
    if (isRecord(value.animations)) {
      const animations: Record<string, number[]> = {};
      for (const [name, indices] of Object.entries(value.animations)) {
        if (
          !Array.isArray(indices) ||
          !indices.every(
            (index: unknown) =>
              typeof index === "number" &&
              Number.isInteger(index) &&
              index >= 0 &&
              index < definition.frames.length,
          )
        )
          throw new Error(`Invalid animation: ${key}/${name}`);
        animations[name] = indices.map(readNumber);
      }
      definition.animations = animations;
    }
    definitions[key] = definition;
  }
  return definitions;
}

export async function loadArtwork(source: unknown): Promise<ArtworkBank> {
  const definitions = readArtworkDefinitions(source);
  const entries = await Promise.all(
    Object.entries(definitions).map(
      async ([key, definition]): Promise<[string, LoadedArtwork]> => {
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          image.decoding = "async";
          image.onload = () => resolve(image);
          image.onerror = () =>
            reject(new Error(`Unable to load ${definition.url}`));
          image.src = definition.url;
        });
        return [key, { image, definition }];
      },
    ),
  );
  return new Map(entries);
}
