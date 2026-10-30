export { createVillage } from "./layout.ts";
export { createRound } from "./round/createRound.ts";
export { createDisplayNames } from "./names.ts";
export {
  CHILD_SPRITE_VARIANTS,
  getChildPosition,
  getDoorPosition,
  getSignPosition,
  HOUSE_SIZE,
  ROAD_WIDTH,
  VERTICAL_SCALE,
} from "./geometry.ts";
import { clamp01 } from "./geometry.ts";
import type { RoosterPose, Round } from "./types.ts";
export function getRoosterPose(round: Round, time: number): RoosterPose {
  const segment =
    round.segments.find((candidate) => time < candidate.endTime) ??
    round.segments[round.segments.length - 1];
  const progress =
    segment.endTime > segment.startTime
      ? clamp01(
          (time - segment.startTime) / (segment.endTime - segment.startTime),
        )
      : 1;
  return {
    segment,
    position: {
      x: segment.from.x + (segment.to.x - segment.from.x) * progress,
      y: segment.from.y + (segment.to.y - segment.from.y) * progress,
    },
    progress,
  };
}
