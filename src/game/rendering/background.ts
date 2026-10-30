import * as world from "@/game/world.ts";
import { toWorldPixels } from "@/game/geometry.ts";
import type { Village } from "@/game/types.ts";
export function createVillageBackground(
  village: Village,
  worldWidth: number,
  worldHeight: number,
): HTMLCanvasElement {
  const scale = Math.min(2, 4096 / worldWidth, 4096 / worldHeight);
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(worldWidth * scale);
  canvas.height = Math.ceil(worldHeight * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable");
  context.scale(scale, scale);
  const drawRectangle = (
    left: number,
    top: number,
    right: number,
    bottom: number,
    fill: string,
    stroke?: string,
    lineWidth: number = 1,
  ) => {
    const start = toWorldPixels({
      x: left,
      y: top,
    });
    const end = toWorldPixels({
      x: right,
      y: bottom,
    });
    context.fillStyle = fill;
    context.fillRect(start.x, start.y, end.x - start.x, end.y - start.y);
    if (stroke) {
      context.strokeStyle = stroke;
      context.lineWidth = lineWidth;
      context.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
    }
  };
  context.fillStyle = "#93d07c";
  context.fillRect(0, 0, worldWidth, worldHeight);
  let seed = 7;
  const random = () => (seed = (16807 * seed) % 0x7fffffff) / 0x7fffffff;
  for (
    let patchIndex = 0;
    patchIndex < village.width * village.depth * 1.6;
    patchIndex++
  ) {
    const point = toWorldPixels({
      x: random() * village.width,
      y: random() * village.depth,
    });
    context.fillStyle =
      random() < 0.5 ? "rgba(60,140,60,0.18)" : "rgba(255,255,220,0.16)";
    context.beginPath();
    context.ellipse(
      point.x,
      point.y,
      3 + 4 * random(),
      1.5 + 2 * random(),
      0,
      0,
      2 * Math.PI,
    );
    context.fill();
  }
  const sidewalkColor = "#e4d8c6";
  const sidewalkBorder = "#c9b79c";
  const roadColor = "#6f7584";
  const stripeColor = "#f1ead2";
  const lastRoadY = village.streetYs[village.rows - 1] + world.ROAD_WIDTH / 2;
  for (const roadX of [village.westRoadX, village.eastRoadX])
    drawRectangle(
      roadX - world.ROAD_WIDTH / 2 - 0.28,
      roadX === village.westRoadX ? -1 : 0.4,
      roadX + world.ROAD_WIDTH / 2 + 0.28,
      lastRoadY + 0.28,
      sidewalkColor,
      sidewalkBorder,
    );
  for (const streetY of village.streetYs)
    drawRectangle(
      village.westRoadX - world.ROAD_WIDTH / 2 - 0.28,
      streetY - world.ROAD_WIDTH / 2 - 0.28,
      village.eastRoadX + world.ROAD_WIDTH / 2 + 0.28,
      streetY + world.ROAD_WIDTH / 2 + 0.28,
      sidewalkColor,
      sidewalkBorder,
    );
  for (const roadX of [village.westRoadX, village.eastRoadX])
    drawRectangle(
      roadX - world.ROAD_WIDTH / 2,
      roadX === village.westRoadX ? -1 : 0.68,
      roadX + world.ROAD_WIDTH / 2,
      lastRoadY,
      roadColor,
    );
  for (const streetY of village.streetYs)
    drawRectangle(
      village.westRoadX - world.ROAD_WIDTH / 2,
      streetY - world.ROAD_WIDTH / 2,
      village.eastRoadX + world.ROAD_WIDTH / 2,
      streetY + world.ROAD_WIDTH / 2,
      roadColor,
    );
  const isIntersection = (x: number, y: number) =>
    village.streetYs.some(
      (streetY) => Math.abs(y - streetY) < world.ROAD_WIDTH / 2 + 0.2,
    ) &&
    [village.westRoadX, village.eastRoadX].some(
      (roadX) => Math.abs(x - roadX) < world.ROAD_WIDTH / 2 + 0.2,
    );
  for (const streetY of village.streetYs)
    for (let x = village.westRoadX; x < village.eastRoadX; x += 1.1) {
      if (!(isIntersection(x, streetY) || isIntersection(x + 0.55, streetY))) {
        drawRectangle(x, streetY - 0.06, x + 0.55, streetY + 0.06, stripeColor);
      }
    }
  for (const roadX of [village.westRoadX, village.eastRoadX])
    for (let y = 0; y < lastRoadY; y += 1.1) {
      if (!(isIntersection(roadX, y) || isIntersection(roadX, y + 0.55))) {
        drawRectangle(roadX - 0.05, y, roadX + 0.05, y + 0.55, stripeColor);
      }
    }
  for (const house of village.houses) {
    const yardTop = house.gridY + world.HOUSE_SIZE - 0.3;
    const yardBottom = house.gridY + world.HOUSE_SIZE + village.yardDepth - 0.1;
    const pathCenterX = house.gridX + world.HOUSE_SIZE / 2;
    drawRectangle(
      house.gridX - 0.15,
      yardTop,
      house.gridX + world.HOUSE_SIZE + 0.15,
      yardBottom,
      "#a5db8c",
    );
    drawRectangle(
      house.gridX - 0.05,
      yardTop,
      house.gridX + world.HOUSE_SIZE + 0.05,
      house.gridY + world.HOUSE_SIZE + 0.75,
      "#efe4cf",
      "#d9c8a8",
    );
    drawRectangle(
      pathCenterX - 0.42,
      house.gridY + world.HOUSE_SIZE + 0.75,
      pathCenterX + 0.42,
      yardBottom,
      "#efe4cf",
      "#d9c8a8",
    );
    for (
      let pathY = house.gridY + world.HOUSE_SIZE + 1.05;
      pathY < yardBottom;
      pathY += 0.4
    )
      drawRectangle(
        pathCenterX - 0.42,
        pathY - 0.012,
        pathCenterX + 0.42,
        pathY + 0.012,
        "rgba(180,160,120,0.4)",
      );
    for (const flowerX of [
      house.gridX + 0.25,
      house.gridX + world.HOUSE_SIZE - 0.25,
    ])
      for (let flowerIndex = 0; flowerIndex < 5; flowerIndex++) {
        const point = toWorldPixels({
          x: flowerX + (random() - 0.5) * 0.5,
          y:
            house.gridY +
            world.HOUSE_SIZE +
            1 +
            random() * Math.max(0.2, village.yardDepth - 1.2),
        });
        context.fillStyle = [
          "#f472b6",
          "#fde047",
          "#fb923c",
          "#ffffff",
          "#c084fc",
        ][Math.floor(5 * random())];
        context.beginPath();
        context.arc(point.x, point.y, 2 + 1.5 * random(), 0, 2 * Math.PI);
        context.fill();
      }
  }
  return canvas;
}
