import { getRoosterPose } from "@/game/world.ts";
import { RIDING_ACTIONS } from "@/game/geometry.ts";
import type { MotionSegment, Round } from "@/game/types.ts";
export function getParkedBike(round: Round, time: number) {
  const currentSegment = getRoosterPose(round, time).segment;
  if (RIDING_ACTIONS.has(currentSegment.action)) return null;
  let lastRidingSegment: MotionSegment | null = null;
  for (const segment of round.segments) {
    if (segment === currentSegment) break;
    if (RIDING_ACTIONS.has(segment.action)) {
      lastRidingSegment = segment;
    }
  }
  return lastRidingSegment
    ? {
        position: lastRidingSegment.to,
        direction: lastRidingSegment.direction,
      }
    : null;
}
