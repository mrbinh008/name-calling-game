import type { RandomSource } from "@/game/types.ts";

export interface PickerRound {
  selectedNames: string[];
  participants: string[];
  startsNewCycle: boolean;
  seed: number;
  scenarioIndex: number;
}

export function shuffleNames(
  names: readonly string[],
  random: RandomSource,
): string[] {
  const shuffled = [...names];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }
  return shuffled;
}

export function selectPickerRound(
  roster: readonly string[],
  calledNames: ReadonlySet<string>,
  absentNames: ReadonlySet<string>,
  count = 1,
  random: RandomSource = Math.random,
  target?: string,
): PickerRound | null {
  const presentNames = roster.filter((name) => !absentNames.has(name));
  if (!presentNames.length || (target && !presentNames.includes(target)))
    return null;
  const uncalledNames = presentNames.filter((name) => !calledNames.has(name));
  const startsNewCycle = uncalledNames.length === 0;
  const candidates = startsNewCycle ? presentNames : uncalledNames;
  const selectedNames = target
    ? [target]
    : shuffleNames(candidates, random).slice(
        0,
        Math.max(1, Math.min(5, count)),
      );
  return {
    selectedNames,
    participants: shuffleNames(presentNames, random),
    startsNewCycle,
    seed: Math.floor(random() * 1_000_000),
    scenarioIndex: Math.floor(random() * 3),
  };
}
