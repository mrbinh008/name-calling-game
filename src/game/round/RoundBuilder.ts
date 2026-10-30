import {
  findRoadRoute,
  getDirection,
  getDoorPosition,
  getRoadStop,
  manhattanDistance,
  OPPOSITE_DIRECTION,
} from "@/game/geometry.ts";
import type {
  Action,
  CueName,
  DecoyType,
  Dialogue,
  Direction,
  DoorEvent,
  House,
  IncidentType,
  MotionSegment,
  Obstacle,
  Point,
  RandomSource,
  TimelineCue,
  Village,
} from "@/game/types.ts";
interface SpeechOptions {
  speaker?: number | "rooster";
  isShout?: boolean;
  delay?: number;
}
type VisitPurpose = "decoy" | "target" | "intermediateTarget";

/** Builds a timeline without running timers or drawing to the screen. */
export class RoundBuilder {
  time = 0;
  direction: Direction = "down";
  segments: MotionSegment[] = [];
  dialogues: Dialogue[] = [];
  obstacles: Obstacle[] = [];
  cues: TimelineCue[] = [];
  doorEvents: DoorEvent[] = [];
  walkingSpeed = 1.7;
  position: Point;
  readonly village: Village;
  readonly random: RandomSource;
  readonly ridingSpeed: number;
  constructor(
    position: Point,
    village: Village,
    random: RandomSource,
    ridingSpeed: number,
  ) {
    this.position = position;
    this.village = village;
    this.random = random;
    this.ridingSpeed = ridingSpeed;
  }
  addSegment(
    action: Action,
    duration: number,
    destination = this.position,
    direction?: Direction,
  ): void {
    const facing =
      direction ?? getDirection(this.position, destination, this.direction);
    this.segments.push({
      startTime: this.time,
      endTime: this.time + duration,
      action,
      from: this.position,
      to: destination,
      direction: facing,
    });
    this.time += duration;
    this.position = destination;
    if (action === "ride" || action === "stall") this.direction = facing;
  }
  say(text: string, duration: number, options: SpeechOptions = {}): void {
    const { speaker = "rooster", isShout = false, delay = 0 } = options;
    this.dialogues.push({
      startTime: this.time + delay,
      endTime: this.time + delay + duration,
      speaker,
      text,
      isShout,
    });
  }
  addCue(name: CueName, delay = 0): void {
    this.cues.push({
      time: this.time + delay,
      name,
    });
  }
  rideTo(
    destination: Point,
    incident: IncidentType | null = null,
    slowApproachDistance = 0,
  ): void {
    const route = findRoadRoute(
      this.village,
      this.position,
      destination,
      this.random,
    );
    let longestDistance = -1;
    let incidentLeg = -1;
    for (let index = 1; index < route.length; index++) {
      const distance = manhattanDistance(route[index - 1], route[index]);
      if (distance > longestDistance) {
        longestDistance = distance;
        incidentLeg = index;
      }
    }
    if (incident && route.length < 2) this.addIncident(incident, this.position);
    for (let index = 1; index < route.length; index++) {
      const from = route[index - 1];
      const to = route[index];
      const isFinalLeg = index === route.length - 1;
      if (incident && index === incidentLeg) {
        const midpoint = {
          x: from.x + (to.x - from.x) * 0.5,
          y: from.y + (to.y - from.y) * 0.5,
        };
        this.rideStraight(midpoint, this.ridingSpeed);
        this.addIncident(incident, to);
      }
      if (
        isFinalLeg &&
        slowApproachDistance > 0 &&
        manhattanDistance(this.position, to) > slowApproachDistance
      ) {
        const direction = getDirection(this.position, to, this.direction);
        const distance = manhattanDistance(this.position, to);
        const approachStart = {
          x:
            this.position.x +
            (to.x - this.position.x) * (1 - slowApproachDistance / distance),
          y:
            this.position.y +
            (to.y - this.position.y) * (1 - slowApproachDistance / distance),
        };
        this.rideStraight(approachStart, this.ridingSpeed);
        this.addSegment("ride", slowApproachDistance / 2.2, to, direction);
      } else this.rideStraight(to, this.ridingSpeed);
    }
  }
  rideStraight(destination: Point, speed: number): void {
    const distance = manhattanDistance(this.position, destination);
    if (distance > 1e-6) this.addSegment("ride", distance / speed, destination);
  }
  private addIncident(incident: IncidentType, destination: Point): void {
    const direction = getDirection(this.position, destination, this.direction);
    const advance = (distance: number): Point => {
      const remaining = manhattanDistance(this.position, destination);
      const progress =
        Math.min(distance, Math.max(0, remaining - 0.2)) / (remaining || 1);
      return {
        x: this.position.x + (destination.x - this.position.x) * progress,
        y: this.position.y + (destination.y - this.position.y) * progress,
      };
    };
    if (incident === "trashCan") {
      this.obstacles.push({
        type: incident,
        position: advance(0.3),
        impactTime: this.time + 0.06,
        endTime: Infinity,
      });
      this.addCue("crash", 0.06);
      this.say("RẦM!", 1.1, {
        isShout: true,
        delay: 0.06,
      });
      this.addSegment("fall", 1.7, this.position, direction);
      this.say("Không sao! Không sao!", 1.4);
      this.addSegment("look", 0.6, this.position, direction);
      return;
    }
    if (incident === "stall") {
      this.addCue("stall");
      this.say("Ơ ơ… hết xăng!", 1.9);
      this.addSegment("stall", 2.3, advance(1.1), direction);
      this.say("Nổ rồi! Đi tiếp!", 1.1, {
        delay: 0.1,
      });
      this.addSegment("look", 0.5, this.position, direction);
      return;
    }
    const isHorizontal = direction === "right" || direction === "left";
    const dogPosition = {
      x: this.position.x + 1.3 * Number(!isHorizontal),
      y: this.position.y + (isHorizontal ? -1.3 : 0),
    };
    this.obstacles.push({
      type: incident,
      position: dogPosition,
      impactTime: this.time,
      endTime: this.time + 3.2,
    });
    this.addCue("bark", 0.1);
    this.say("GÂU GÂU!", 1.2, {
      isShout: true,
      delay: 0.1,
    });
    this.say("Á á! Cứu!", 1.6, {
      delay: 0.6,
    });
  }
  visitHouse(
    house: House,
    purpose: VisitPurpose,
    decoyType: DecoyType | null,
    excuse: string,
  ): void {
    const roadStop = getRoadStop(this.village, house);
    if (purpose === "decoy" && decoyType === "brakeAndTurn") {
      const overshoot = {
        x: roadStop.x + (this.position.x <= roadStop.x ? 2.2 : -2.2),
        y: roadStop.y,
      };
      this.rideTo(roadStop);
      this.rideStraight(overshoot, this.ridingSpeed);
      this.addCue("brake");
      this.say("Khoan đã…", 1.4);
      this.addSegment("brake", 0.55, overshoot);
      this.addSegment(
        "turn",
        0.5,
        overshoot,
        OPPOSITE_DIRECTION[this.direction],
      );
      this.direction = OPPOSITE_DIRECTION[this.direction];
      this.addSegment(
        "ride",
        manhattanDistance(overshoot, roadStop) / 2.2,
        roadStop,
      );
      this.say(excuse, 1.6, {
        speaker: house.id,
      });
      this.addSegment("look", 1.3, roadStop);
      this.say("À… không phải.", 1.2);
      this.addSegment(
        "turn",
        0.45,
        roadStop,
        OPPOSITE_DIRECTION[this.direction],
      );
      this.direction = OPPOSITE_DIRECTION[this.direction];
      return;
    }
    this.rideTo(roadStop, null, purpose === "decoy" ? 1.4 : 1.8);
    if (purpose !== "decoy") {
      this.addCue("brake");
      this.addSegment("brake", 0.6);
      this.walkToDoor(house);
      return;
    }
    switch (decoyType) {
      case "wrongDoor": {
        this.addSegment("brake", 0.45);
        const door = getDoorPosition(house);
        const position = {
          x: door.x + 0.7,
          y: door.y,
        };
        this.addSegment(
          "walk",
          manhattanDistance(roadStop, position) / this.walkingSpeed,
          position,
          "up",
        );
        this.addCue("knock");
        this.say("CỐC CỐC!", 1, {
          isShout: true,
        });
        this.say(excuse, 1.2, {
          speaker: house.id,
          delay: 0.4,
        });
        this.doorEvents.push({
          houseId: house.id,
          startTime: this.time + 0.3,
          endTime: this.time + 2.1,
          exitsHouse: false,
        });
        this.addSegment("knock", 1.2, position, "up");
        this.say("Ơ… nhầm nhà rồi!", 1.6, {
          delay: 0.4,
        });
        this.addSegment("readNotice", 1.5, position, "down");
        this.addSegment(
          "walk",
          manhattanDistance(roadStop, position) / this.walkingSpeed,
          roadStop,
          "down",
        );
        break;
      }
      case "duckHorn":
        this.addCue("horn");
        this.say("CẠC CẠC CẠC!", 1.4, {
          isShout: true,
        });
        this.say(excuse, 1.5, {
          speaker: house.id,
          delay: 0.5,
        });
        this.addSegment("horn", 1.6);
        this.say("Ơ kìa… cái loa này!", 1.4);
        this.addSegment("look", 1.3);
        break;
      case "lookAround":
        this.say("Nhà này… hay nhà kia?", 1.8);
        this.say(excuse, 1.5, {
          speaker: house.id,
          delay: 0.6,
        });
        this.addSegment("look", 2);
        break;
      default:
        this.say(excuse, 1.4, {
          speaker: house.id,
        });
        this.addSegment("look", 0.9);
    }
  }
  private walkToDoor(house: House): void {
    const door = getDoorPosition(house);
    this.addSegment(
      "walk",
      manhattanDistance(this.position, door) / this.walkingSpeed,
      door,
      "up",
    );
  }
  hesitateAtNeighbor(neighbor: House, target: House): Point {
    const roadStop = getRoadStop(this.village, neighbor);
    this.rideTo(roadStop, null, 1.8);
    this.addCue("brake");
    this.addSegment("brake", 0.6);
    const neighborDoor = getDoorPosition(neighbor);
    const targetDoor = getDoorPosition(target);
    this.addSegment(
      "walk",
      manhattanDistance(roadStop, neighborDoor) / this.walkingSpeed,
      neighborDoor,
      "up",
    );
    this.say("Hừm… nhà này à?", 1.6);
    this.addSegment("readNotice", 1.4, neighborDoor, "down");
    this.say("À… hình như nhà bên kia.", 1.4, {
      delay: 0.3,
    });
    const pathY = neighborDoor.y + Math.min(0.8, 0.55 * this.village.yardDepth);
    this.addSegment(
      "walk",
      (pathY - neighborDoor.y) / this.walkingSpeed,
      {
        x: neighborDoor.x,
        y: pathY,
      },
      "down",
    );
    this.addSegment(
      "walk",
      Math.abs(targetDoor.x - neighborDoor.x) / this.walkingSpeed,
      {
        x: targetDoor.x,
        y: pathY,
      },
      targetDoor.x > neighborDoor.x ? "right" : "left",
    );
    this.addSegment(
      "walk",
      (pathY - targetDoor.y) / this.walkingSpeed,
      targetDoor,
      "up",
    );
    return roadStop;
  }
}
