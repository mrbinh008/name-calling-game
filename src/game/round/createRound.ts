import {
  findRoadRoute,
  getRoadStop,
  manhattanDistance,
  randomItem,
} from "@/game/geometry.ts";
import type {
  DecoyType,
  House,
  NarrativePlan,
  RandomSource,
  Round,
  RoundOptions,
  Village,
} from "@/game/types.ts";
import { RoundBuilder } from "@/game/round/RoundBuilder.ts";
const CHILD_REACTIONS = [5, 6, 7, 9, 10];
const EXCUSES = [
  "Không có ai ở nhà đâu!",
  "Con đang ốm ạ…",
  "Đừng gọi con…",
  "Mình là người lạ!",
  "Bài này con chưa học…",
  "Suỵt… im lặng nào.",
];
const MIN_RIDING_SPEED = 2.6;
const MAX_RIDING_SPEED = 2.6 * 2.8;
interface StreetTour {
  rows: number[];
  decoysByVisit: Map<number, House[]>;
}
interface BuiltTimeline {
  builder: RoundBuilder;
  decoyHouseIds: number[];
  knockTimes: number[];
  plan: NarrativePlan;
}
function chooseTargets(
  village: Village,
  candidates: House[],
  count: number,
  random: RandomSource,
): House[] {
  const shuffled = [...candidates];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }
  const selected = shuffled.slice(
    0,
    Math.max(1, Math.min(5, count, shuffled.length)),
  );
  let bestOrder = selected;
  let bestDistance = Infinity;
  const visit = (
    ordered: House[],
    remaining: House[],
    totalDistance: number,
  ): void => {
    if (totalDistance >= bestDistance) return;
    if (!remaining.length) {
      bestDistance = totalDistance;
      bestOrder = ordered;
      return;
    }
    remaining.forEach((house, index) => {
      let legDistance = 0;
      if (ordered.length) {
        const previous = ordered[ordered.length - 1];
        const route = findRoadRoute(
          village,
          getRoadStop(village, previous),
          getRoadStop(village, house),
          () => 0,
        );
        legDistance = route.reduce(
          (distance, point, pointIndex) =>
            pointIndex
              ? distance + manhattanDistance(route[pointIndex - 1], point)
              : 0,
          0,
        );
      }
      visit(
        [...ordered, house],
        remaining.filter((_unused, candidateIndex) => candidateIndex !== index),
        totalDistance + legDistance,
      );
    });
  };
  visit([], selected, 0);
  return bestOrder;
}
function planStreetTour(
  laps: number,
  plan: NarrativePlan,
  targets: House[],
  decoyCandidates: House[],
  otherRows: number[],
  random: RandomSource,
): StreetTour {
  const firstTarget = targets[0];
  const candidateRows = plan.skipSelectedStreets
    ? otherRows.filter((row) => !targets.some((house) => house.row === row))
    : otherRows;
  const tourRows = candidateRows.length
    ? candidateRows
    : plan.skipSelectedStreets
      ? []
      : [firstTarget.row];
  const rows =
    plan.returnsToFirstHouse && otherRows.length ? [firstTarget.row] : [];
  for (let lap = 0; lap < laps; lap++)
    rows.push(...(lap % 2 ? [...tourRows].reverse() : tourRows));
  const decoysByVisit = new Map<number, House[]>();
  if (plan.returnsToFirstHouse) decoysByVisit.set(0, [firstTarget]);
  const usedHouseIds = new Set(
    plan.returnsToFirstHouse ? [firstTarget.id] : [],
  );
  const remainingDecoys = plan.decoyCount - Number(plan.returnsToFirstHouse);
  const hasAvailableHouse = (visitIndex: number) =>
    decoyCandidates.some(
      (house) => house.row === rows[visitIndex] && !usedHouseIds.has(house.id),
    );
  const visitIndices = rows
    .map((_unused, index) => index)
    .filter((index) => !(plan.returnsToFirstHouse && index === 0));
  for (let index = 0; index < remainingDecoys; index++) {
    let availableVisits = visitIndices.filter(
      (visitIndex) =>
        hasAvailableHouse(visitIndex) && !decoysByVisit.has(visitIndex),
    );
    if (!availableVisits.length)
      availableVisits = visitIndices.filter(hasAvailableHouse);
    const visitIndex = availableVisits.length
      ? availableVisits[Math.floor(random() * availableVisits.length)]
      : -1;
    const houses = decoyCandidates.filter(
      (house) =>
        !usedHouseIds.has(house.id) &&
        (visitIndex < 0 || house.row === rows[visitIndex]),
    );
    if (!houses.length) break;
    const house = randomItem(houses, random);
    usedHouseIds.add(house.id);
    decoysByVisit.set(visitIndex, [
      ...(decoysByVisit.get(visitIndex) ?? []),
      house,
    ]);
  }
  return {
    rows,
    decoysByVisit,
  };
}
function createFallbackPlans(
  initial: NarrativePlan,
  targetCount: number,
  hasDecoyCandidates: boolean,
  fixedNarrative: boolean,
) {
  let plan = initial;
  const candidates = [
    {
      plan,
      speedThreshold: 0,
    },
  ];
  if (fixedNarrative) return candidates;
  while (true) {
    let speedThreshold = 2.6 * 4.4;
    if (plan.decoyCount > 1) {
      plan = {
        ...plan,
        decoyCount: plan.decoyCount - 1,
      };
      speedThreshold = MAX_RIDING_SPEED;
    } else if (plan.returnsToFirstHouse)
      plan = {
        ...plan,
        returnsToFirstHouse: false,
        decoyCount: Number(hasDecoyCandidates),
      };
    else if (!plan.skipSelectedStreets && targetCount > 1) {
      plan = {
        ...plan,
        skipSelectedStreets: true,
      };
      speedThreshold = MAX_RIDING_SPEED;
    } else if (plan.walkingSpeed === 1.7 && targetCount > 1) {
      plan = {
        ...plan,
        walkingSpeed: 2.55,
      };
      speedThreshold = MAX_RIDING_SPEED;
    } else if (plan.hesitationHouse && targetCount > 1) {
      plan = {
        ...plan,
        hesitationHouse: null,
      };
      speedThreshold = MAX_RIDING_SPEED;
    } else break;
    candidates.push({
      plan,
      speedThreshold,
    });
  }
  return candidates;
}
export function createRound(
  village: Village,
  calledNames: ReadonlySet<string>,
  absentNames: ReadonlySet<string>,
  count = 1,
  random: RandomSource = Math.random,
  options: RoundOptions = {},
): Round | null {
  const presentHouses = village.houses.filter(
    (house) => house.name && !absentNames.has(house.name),
  );
  if (!presentHouses.length) return null;
  let candidates = presentHouses.filter(
    (house) => !calledNames.has(house.name),
  );
  const startsNewCycle = candidates.length === 0;
  if (startsNewCycle) candidates = presentHouses;
  const targets = options.selectedNames?.length
    ? options.selectedNames
        .map((name) => village.houses.find((house) => house.name === name))
        .filter((house): house is House => Boolean(house))
    : chooseTargets(village, candidates, count, random);
  if (!targets.length) return null;
  const targetIds = new Set(targets.map((house) => house.id));
  const previousNames = startsNewCycle ? new Set<string>() : calledNames;
  const decoyCandidates = presentHouses.filter(
    (house) => !targetIds.has(house.id) && !previousNames.has(house.name),
  );
  const hasSpecialDecoy =
    options.decoyType !== undefined && options.decoyType !== "wrongDoor";
  const returnsToFirstHouse =
    !hasSpecialDecoy && (options.returnsToFirstHouse ?? random() < 0.4);
  const decoyType: DecoyType | null =
    options.decoyType !== undefined
      ? options.decoyType
      : decoyCandidates.length || returnsToFirstHouse
        ? "wrongDoor"
        : null;
  const incidentType =
    options.incidentType !== undefined ? options.incidentType : null;
  const decoyCount = decoyType
    ? hasSpecialDecoy
      ? 1
      : Math.max(
          1,
          Math.min(3, options.decoyCount ?? 1 + Math.floor(3 * random())),
        )
    : 0;
  const firstTarget = targets[0];
  const neighbors = presentHouses.filter(
    (house) =>
      house.row === firstTarget.row &&
      Math.abs(house.column - firstTarget.column) === 1 &&
      !targetIds.has(house.id),
  );
  const hesitationHouse =
    neighbors.length && (options.hesitates ?? random() < 0.8)
      ? randomItem(neighbors, random)
      : null;
  const reactions: Record<number, number> = {};
  for (const house of village.houses)
    reactions[house.id] = randomItem(CHILD_REACTIONS, random);
  const targetRow = firstTarget.row;
  const otherRows = Array.from(
    {
      length: village.rows,
    },
    (_unused, row) => row,
  ).filter((row) => row !== targetRow);
  const excusesByHouse = new Map<number, string>();
  const tourCache = new Map<string, StreetTour>();

  // Cache randomized tour choices so speed fitting never changes the story.
  const buildTimeline = (
    ridingSpeed: number,
    laps: number,
    plan: NarrativePlan,
  ): BuiltTimeline => {
    const cacheKey = [
      laps,
      plan.decoyCount,
      plan.returnsToFirstHouse,
      plan.skipSelectedStreets,
    ].join("|");
    let tour = tourCache.get(cacheKey);
    if (!tour) {
      tour = planStreetTour(
        laps,
        plan,
        targets,
        decoyCandidates,
        otherRows,
        random,
      );
      const usedHouseIds = new Set(
        Array.from(tour.decoysByVisit.values())
          .flat()
          .map((house) => house.id),
      );
      for (const id of usedHouseIds)
        if (!excusesByHouse.has(id))
          excusesByHouse.set(id, randomItem(EXCUSES, random));
      tourCache.set(cacheKey, tour);
    }
    const builder = new RoundBuilder(
      {
        x: village.westRoadX,
        y: -7,
      },
      village,
      random,
      ridingSpeed,
    );
    builder.walkingSpeed = plan.walkingSpeed;
    builder.addCue("whistle");
    builder.say("Tuýt tuýt! Kiểm tra bài cũ đây!", 2.2, {
      delay: 0.2,
    });
    const decoyHouseIds: number[] = [];
    const knockTimes: number[] = [];
    const visitDecoy = (house: House) => {
      if (house.id !== firstTarget.id) decoyHouseIds.push(house.id);
      builder.visitHouse(
        house,
        "decoy",
        decoyType,
        excusesByHouse.get(house.id) ?? randomItem(EXCUSES, random),
      );
    };
    const streetEndpoints = (row: number) => {
      const streetY = village.streetYs[row];
      const enterFromWest =
        Math.abs(builder.position.x - village.westRoadX) <=
        Math.abs(builder.position.x - village.eastRoadX);
      return {
        entry: {
          x: enterFromWest ? village.westRoadX : village.eastRoadX,
          y: streetY,
        },
        exit: {
          x: enterFromWest ? village.eastRoadX : village.westRoadX,
          y: streetY,
        },
      };
    };
    builder.rideStraight(
      {
        x: village.westRoadX,
        y: village.streetYs[tour.rows[0] ?? targetRow],
      },
      ridingSpeed,
    );
    tour.rows.forEach((row, visitIndex) => {
      const { entry, exit } = streetEndpoints(row);
      builder.rideTo(entry);
      const decoys = [...(tour.decoysByVisit.get(visitIndex) ?? [])].sort(
        (left, right) =>
          Math.abs(left.gridX - entry.x) - Math.abs(right.gridX - entry.x),
      );
      for (const house of decoys) visitDecoy(house);
      builder.rideTo(exit, visitIndex === 0 ? incidentType : null);
    });
    for (const house of tour.decoysByVisit.get(-1) ?? []) visitDecoy(house);
    const { entry } = streetEndpoints(targetRow);
    builder.rideTo(entry, tour.rows.length ? null : incidentType);
    targets.forEach((house, index) => {
      const isFinalTarget = index === targets.length - 1;
      let roadStop = getRoadStop(village, house);
      if (index === 0 && plan.hesitationHouse)
        roadStop = builder.hesitateAtNeighbor(plan.hesitationHouse, house);
      else
        builder.visitHouse(
          house,
          isFinalTarget ? "target" : "intermediateTarget",
          null,
          "",
        );
      if (plan.returnsToFirstHouse && index === 0) {
        builder.say("Khoan! Lúc nãy ai bảo không có ai ở nhà?", 2);
        builder.addSegment("waitForDoor", 1.8, builder.position, "up");
      }
      knockTimes.push(builder.time);
      builder.addCue("knock");
      builder.say("CỐC CỐC CỐC!", 1.3, {
        isShout: true,
      });
      builder.addSegment(
        "knock",
        isFinalTarget ? 1.6 : 1,
        builder.position,
        "up",
      );
      builder.doorEvents.push({
        houseId: house.id,
        startTime: builder.time,
        endTime: Infinity,
        exitsHouse: true,
      });
      builder.addSegment(
        "walk",
        0.45,
        {
          x: house.gridX + 1 + 0.9,
          y: house.gridY + 2 + 0.35,
        },
        "right",
      );
      builder.say("Dạ… em đây ạ…", isFinalTarget ? 1.1 : 0.8, {
        speaker: house.id,
        delay: 0.35,
      });
      builder.addSegment(
        "waitForDoor",
        isFinalTarget ? 1.5 : 1.2,
        builder.position,
        "down",
      );
      builder.addCue("summon");
      builder.say(
        isFinalTarget ? "Có giấy triệu tập!" : "Giấy của em đây!",
        isFinalTarget ? 1.8 : 1.2,
      );
      builder.addSegment(
        "summon",
        isFinalTarget ? 1.6 : 1,
        builder.position,
        "down",
      );
      if (!isFinalTarget)
        builder.addSegment(
          "walk",
          manhattanDistance(builder.position, roadStop) / builder.walkingSpeed,
          roadStop,
          "down",
        );
    });
    return {
      builder,
      decoyHouseIds,
      knockTimes,
      plan,
    };
  };
  const targetDuration = 33 + 5 * (targets.length - 1);
  const fitSpeed = (laps: number, plan: NarrativePlan) => {
    let timeline = buildTimeline(3.6, laps, plan);
    let requiredSpeed = 3.6;
    for (let attempt = 0; attempt < 6; attempt++) {
      const duration = timeline.builder.time + 0.3;
      const ridingDuration = timeline.builder.segments
        .filter((segment) => segment.action === "ride")
        .reduce(
          (total, segment) => total + segment.endTime - segment.startTime,
          0,
        );
      requiredSpeed =
        (timeline.builder.ridingSpeed * ridingDuration) /
        Math.max(1, targetDuration - (duration - ridingDuration));
      const fittedSpeed = Math.max(
        MIN_RIDING_SPEED,
        Math.min(MAX_RIDING_SPEED, requiredSpeed),
      );
      if (
        Math.abs(duration - targetDuration) <= 0.8 ||
        Math.abs(fittedSpeed - timeline.builder.ridingSpeed) < 0.001
      )
        break;
      timeline = buildTimeline(fittedSpeed, laps, plan);
    }
    return {
      timeline,
      requiredSpeed,
    };
  };
  const plans = createFallbackPlans(
    {
      decoyCount,
      returnsToFirstHouse,
      hesitationHouse,
      skipSelectedStreets: false,
      walkingSpeed: 1.7,
    },
    targets.length,
    decoyCandidates.length > 0,
    options.decoyCount !== undefined ||
      options.returnsToFirstHouse !== undefined ||
      hasSpecialDecoy,
  );
  let laps = 1;
  let { timeline, requiredSpeed } = fitSpeed(1, plans[0].plan);
  for (
    let index = 1;
    index < plans.length && requiredSpeed > plans[index].speedThreshold;
    index++
  )
    ({ timeline, requiredSpeed } = fitSpeed(laps, plans[index].plan));
  while (requiredSpeed < MIN_RIDING_SPEED && laps < 4)
    ({ timeline, requiredSpeed } = fitSpeed(++laps, timeline.plan));
  if (requiredSpeed > MAX_RIDING_SPEED)
    timeline = buildTimeline(Math.min(requiredSpeed, 13), laps, timeline.plan);
  const { builder, knockTimes, plan } = timeline;
  const resultTime = builder.time + 0.3;
  builder.cues.push({
    time: resultTime,
    name: "result",
  });
  builder.cues.sort((left, right) => left.time - right.time);
  return {
    selectedNames: targets.map((house) => house.name),
    selectedHouseIds: targets.map((house) => house.id),
    decoyHouseIds: timeline.decoyHouseIds,
    segments: builder.segments,
    dialogues: builder.dialogues,
    obstacles: builder.obstacles,
    cues: builder.cues,
    knockTimes,
    finalKnockTime: knockTimes[knockTimes.length - 1],
    resultTime,
    decoyType:
      plan.decoyCount || options.decoyType !== undefined ? decoyType : null,
    incidentType,
    reactions,
    doorEvents: builder.doorEvents,
    startsNewCycle,
    returnsToFirstHouse: plan.returnsToFirstHouse,
    hesitationHouseId: plan.hesitationHouse?.id ?? null,
  };
}
