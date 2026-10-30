import type { Point, Round, SpriteSheet } from "@/game/types.ts";
export interface Camera {
  centerX: number;
  centerY: number;
  scale: number;
}
export interface DoorProjection {
  x: number;
  top: number;
  bottom: number;
  width: number;
}
export interface DrawLayer {
  depth: number;
  draw: () => void;
}
export interface HouseHitbox {
  name: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
  depth: number;
}
export type ScreenProjector = (point: Point) => Point;
export interface SpriteDrawBounds {
  top: number;
  width: number;
  height: number;
}
export interface SpriteDrawOptions {
  opacity?: number;
  filter?: string;
  flipX?: boolean;
  centerByBounds?: boolean;
}
export interface SceneAssets {
  houses: SpriteSheet;
  doors: SpriteSheet | null;
  effects: SpriteSheet;
  extraEffects: SpriteSheet | null;
  environment: SpriteSheet;
  riding: SpriteSheet;
  walking: SpriteSheet;
  children: (SpriteSheet | null)[];
}
export interface RenderFrameState {
  width: number;
  height: number;
  time: number;
  round: Round | null;
  scale: number;
  toScreen: ScreenProjector;
  recentPositions: Point[];
  layers: DrawLayer[];
  overlays: (() => void)[];
  speechAnchors: Record<number, Point>;
}
