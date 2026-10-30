import * as world from "@/game/world.ts";
import { smoothstep, toWorldPixels } from "@/game/geometry.ts";
import type { Round, Village } from "@/game/types.ts";
import type { Camera } from "@/game/rendering/types.ts";
export function getSceneCamera(
  village: Village,
  round: Round | null,
  time: number,
  width: number,
  height: number,
  worldWidth: number,
  worldHeight: number,
): Camera {
  const overviewScale = Math.max(width / worldWidth, height / worldHeight);
  const overview = {
    centerX: worldWidth / 2,
    centerY: worldHeight / 2,
    scale: overviewScale,
  };
  if (!round) return overview;
  const followScale = Math.max(
    overviewScale,
    Math.min(2.1 * overviewScale, width / 832),
  );
  const closeupScale = Math.max(
    1.3 * followScale,
    Math.min(2.4 * followScale, width / 416),
  );
  const getPositionAt = (time: number) =>
    toWorldPixels(world.getRoosterPose(round, Math.max(0, time)).position);
  const current = getPositionAt(time);
  const recent = getPositionAt(time - 0.35);
  const earlier = getPositionAt(time - 0.7);
  const follow = {
    centerX: (current.x + recent.x + earlier.x) / 3,
    centerY: (current.y + recent.y + earlier.y) / 3 - 30,
    scale: followScale,
  };
  const interpolate = (from: Camera, to: Camera, progress: number) => {
    const eased = smoothstep(progress);
    return {
      centerX: from.centerX + (to.centerX - from.centerX) * eased,
      centerY: from.centerY + (to.centerY - from.centerY) * eased,
      scale: from.scale + (to.scale - from.scale) * eased,
    };
  };
  const finalHouse =
    village.houses[round.selectedHouseIds[round.selectedHouseIds.length - 1]];
  const door = toWorldPixels(world.getDoorPosition(finalHouse));
  const closeup = {
    centerX: door.x + 14,
    centerY: door.y - 46,
    scale: closeupScale,
  };
  return time < round.finalKnockTime - 0.9
    ? interpolate(overview, follow, (time - 1) / 1.4)
    : interpolate(follow, closeup, (time - round.finalKnockTime + 0.9) / 1.1);
}
