import type {
  Direction,
  House,
  Point,
  RandomSource,
  Village,
} from "./types.ts";
export const HOUSE_SIZE = 2;
export const ROAD_WIDTH = 2.4;
export const VERTICAL_SCALE = 0.75;
export const TILE_WIDTH = 64;
export const TILE_HEIGHT = TILE_WIDTH * VERTICAL_SCALE;
export const CHILD_SPRITE_VARIANTS = [
  "nam1",
  "nam2",
  "nam3",
  "nam4",
  "nam5",
  "nam6",
  "nu1",
  "nu2",
  "nu3",
  "nu4",
  "nu5",
  "nu6",
];
export const RIDING_ACTIONS = new Set([
  "ride",
  "brake",
  "turn",
  "look",
  "horn",
  "stall",
  "fall",
]);
export const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  right: "left",
  left: "right",
  down: "up",
  up: "down",
};
export function getDoorPosition(house: House): Point {
  return {
    x: house.gridX + 1,
    y: house.gridY + 2 + 0.2,
  };
}
export function getRoadStop(village: Village, house: House): Point {
  return {
    x: house.gridX + 1 + 0.2,
    y: village.streetYs[house.row] - 0.45,
  };
}
export function getSignPosition(house: House): Point {
  return {
    x: house.gridX + 0.15,
    y: house.gridY + 2 + 0.85,
  };
}
export function getChildPosition(house: House): Point {
  return {
    x: house.gridX + 1,
    y: house.gridY + 2 + 0.55,
  };
}
export function manhattanDistance(from: Point, to: Point): number {
  return Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
}
export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
export function smoothstep(value: number): number {
  const progress = clamp01(value);
  return progress * progress * (3 - 2 * progress);
}
export function randomItem<Value>(
  items: readonly Value[],
  random: RandomSource,
): Value {
  return items[Math.floor(random() * items.length) % items.length];
}
export function getDirection(
  from: Point,
  to: Point,
  fallback: Direction,
): Direction {
  const deltaX = to.x - from.x;
  const deltaY = to.y - from.y;
  if (Math.abs(deltaX) < 1e-6 && Math.abs(deltaY) < 1e-6) return fallback;
  if (Math.abs(deltaX) >= Math.abs(deltaY))
    return deltaX > 0 ? "right" : "left";
  return deltaY > 0 ? "down" : "up";
}
export function findRoadRoute(
  village: Village,
  from: Point,
  to: Point,
  random: RandomSource = Math.random,
): Point[] {
  const findStreetRow = (point: Point): number => {
    let closestRow = -1;
    let closestDistance = 0.5;
    village.streetYs.forEach((streetY, row) => {
      const distance = Math.abs(point.y - streetY);
      if (distance < closestDistance + 0.6) {
        closestDistance = distance;
        closestRow = row;
      }
    });
    return closestRow;
  };
  const startRow = findStreetRow(from);
  const endRow = findStreetRow(to);
  const startsOnSideRoad =
    Math.abs(from.x - village.westRoadX) < 0.3 ||
    Math.abs(from.x - village.eastRoadX) < 0.3;
  if (startRow >= 0 && startRow === endRow && !startsOnSideRoad)
    return [
      from,
      {
        x: to.x,
        y: from.y,
      },
      to,
    ];
  const distanceVia = (roadX: number) =>
    Math.abs(from.x - roadX) + Math.abs(to.x - roadX);
  const westDistance = distanceVia(village.westRoadX);
  const eastDistance = distanceVia(village.eastRoadX);
  let roadX: number;
  if (Math.abs(westDistance - eastDistance) < 0.5)
    roadX = random() < 0.5 ? village.westRoadX : village.eastRoadX;
  else
    roadX = westDistance < eastDistance ? village.westRoadX : village.eastRoadX;
  const startY = startRow >= 0 ? village.streetYs[startRow] : from.y;
  const endY = endRow >= 0 ? village.streetYs[endRow] : to.y;
  const waypoints = [
    from,
    {
      x: from.x,
      y: startY,
    },
    {
      x: roadX,
      y: startY,
    },
    {
      x: roadX,
      y: endY,
    },
    {
      x: to.x,
      y: endY,
    },
    to,
  ];
  return waypoints.filter(
    (point, index) =>
      index === 0 || manhattanDistance(point, waypoints[index - 1]) > 1e-6,
  );
}
export function toWorldPixels(point: Point): Point {
  return {
    x: TILE_WIDTH * point.x,
    y: TILE_HEIGHT * point.y,
  };
}
