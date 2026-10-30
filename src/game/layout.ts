import type { GenderByName, House, Point, Village } from "./types.ts";
function measureVillage(
  rows: number,
  columns: number,
  houseGap: number,
  yardDepth: number,
) {
  return {
    width: 10 + columns * (2 + houseGap) - houseGap,
    depth: 2.2 + 1.2 + rows * (2 + yardDepth + 2.4) + 2.2,
  };
}
function createLayoutRandom(names: readonly string[]) {
  const text = names.join("|");
  let seed = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) {
    seed ^= text.charCodeAt(index);
    seed = Math.imul(seed, 0x1000193);
  }
  seed = seed >>> 0 || 1;
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let mixed = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 0x100000000;
  };
}
export function createVillage(
  roster: readonly string[],
  genders?: GenderByName,
  aspectRatio = 16 / 9,
): Village {
  const names = roster.slice(0, 60);
  const studentCount = Math.max(1, names.length);
  const measureAspect = (
    rows: number,
    columns: number,
    gap: number,
    yard: number,
  ) => {
    const size = measureVillage(rows, columns, gap, yard);
    return size.width / (0.75 * size.depth);
  };
  let rows = 1;
  let bestAspectError = Infinity;
  for (let candidateRows = 1; candidateRows <= 6; candidateRows++) {
    const candidateColumns = Math.max(
      3,
      Math.ceil(studentCount / candidateRows),
    );
    if (
      candidateRows > 1 &&
      candidateColumns * (candidateRows - 1) >= studentCount
    )
      break;
    const error = Math.abs(
      Math.log(
        measureAspect(candidateRows, candidateColumns, 0.6, 1.3) / aspectRatio,
      ),
    );
    if (error < bestAspectError) {
      bestAspectError = error;
      rows = candidateRows;
    }
  }
  const columns = Math.max(3, Math.ceil(studentCount / rows));
  let houseGap = 0.6;
  let yardDepth = 1.3;
  if (measureAspect(rows, columns, 0.6, 1.3) < aspectRatio) {
    houseGap = Math.min(
      2.4,
      Math.max(
        0.6,
        (0.75 * measureVillage(rows, columns, 0, 1.3).depth * aspectRatio -
          (10 + 2 * columns)) /
          Math.max(1, columns - 1),
      ),
    );
  } else {
    yardDepth = Math.min(
      2.6,
      Math.max(
        1.3,
        (measureVillage(rows, columns, 0.6, 0).width / (0.75 * aspectRatio) -
          (4.4 + 1.2 + 4.4 * rows)) /
          rows,
      ),
    );
  }
  const measured = measureVillage(rows, columns, houseGap, yardDepth);
  const width = Math.max(measured.width, 0.75 * measured.depth * aspectRatio);
  const depth = Math.max(measured.depth, measured.width / (0.75 * aspectRatio));
  const columnSpacing = 2 + houseGap;
  const rowSpacing = 2 + yardDepth + 2.4;
  const marginX = 2.2 + (width - measured.width) / 2;
  const marginY = 2.2 + (depth - measured.depth) / 2;
  const firstHouseX = marginX + 2.4 + 0.4;
  const firstHouseY = marginY + 1.2;
  const westRoadX = marginX + 1.2;
  const eastRoadX =
    firstHouseX + columns * columnSpacing - houseGap + 0.4 + 1.2;
  const streetYs = Array.from(
    {
      length: rows,
    },
    (_unused, row) => firstHouseY + row * rowSpacing + 2 + yardDepth + 1.2,
  );
  const random = createLayoutRandom(names);
  const houses: House[] = [];
  const trees: Point[] = [];
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const id = row * columns + column;
      const gridX = firstHouseX + column * columnSpacing;
      const gridY = firstHouseY + row * rowSpacing;
      if (id >= names.length) {
        trees.push({
          x: gridX + 1,
          y: gridY + 1.2,
        });
        continue;
      }
      const previousHouse = houses.find(
        (house) => house.row === row && house.column === column - 1,
      );
      const houseAbove = houses.find(
        (house) => house.row === row - 1 && house.column === column,
      );
      let styleIndex = Math.floor(12 * random());
      for (
        let attempt = 0;
        attempt < 12 &&
        (styleIndex === previousHouse?.styleIndex ||
          styleIndex === houseAbove?.styleIndex);
        attempt++
      )
        styleIndex = (styleIndex + 1) % 12;
      const name = names[id];
      const gender = genders?.[name];
      const characterOffset = 6 * Number(gender === "nu");
      const availableCharacters = gender ? 6 : 12;
      let characterIndex =
        characterOffset + Math.floor(random() * availableCharacters);
      for (
        let attempt = 0;
        attempt < availableCharacters &&
        characterIndex === previousHouse?.characterIndex;
        attempt++
      )
        characterIndex =
          characterOffset +
          ((characterIndex - characterOffset + 1) % availableCharacters);
      houses.push({
        id,
        name,
        row,
        column,
        gridX,
        gridY,
        styleIndex,
        characterIndex,
      });
    }
  }
  const isAwayFromRoad = (x: number) =>
    Math.abs(x - westRoadX) > 2.4 && Math.abs(x - eastRoadX) > 2.4;
  for (let x = 0.8; x < width - 0.5; x += 2.6) {
    const treeX = x + 0.6 * random();
    if (isAwayFromRoad(treeX))
      trees.push({
        x: treeX,
        y: marginY - 0.5 + 0.3 * random(),
      });
  }
  for (let y = marginY + 1.6; y < depth - 1; y += 2.8) {
    trees.push({
      x: marginX - 1.35 - 0.25 * random(),
      y: y + 0.6 * random(),
    });
    trees.push({
      x: width - marginX + 1.35 + 0.25 * random(),
      y: y + 0.6 * random(),
    });
  }
  for (let x = 1.2; x < width - 1; x += 3) {
    const treeX = x + 0.8 * random();
    if (isAwayFromRoad(treeX))
      trees.push({
        x: treeX,
        y: depth - 0.5 + 0.2 * random(),
      });
  }
  return {
    rows,
    columns,
    houseGap,
    yardDepth,
    houses,
    width,
    depth,
    westRoadX,
    eastRoadX,
    streetYs,
    trees,
  };
}
