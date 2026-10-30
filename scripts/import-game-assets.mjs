// Normalize the supplied offline artwork into the application's sprite format.
import { readFile, writeFile, mkdir, cp, access } from "node:fs/promises";
import { dirname } from "node:path";
import vm from "node:vm";
const sourceRoot = "game2/pomyai.com";
const assetsRoot = "src/games/assets";
await mkdir(assetsRoot, { recursive: true });
async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
async function save(id, definitions) {
  await writeFile(
    `${assetsRoot}/${id}.json`,
    JSON.stringify(definitions, null, 2) + "\n",
  );
  for (const definition of Object.values(definitions)) {
    const destination = `public${definition.url}`;
    await mkdir(dirname(destination), { recursive: true });
    await cp(`${sourceRoot}${definition.url}`, destination);
  }
}
function frame(record) {
  return {
    x: record.x,
    y: record.y,
    width: record.w,
    height: record.h,
    bounds: record.bb ?? [0, 0, 1, 1],
  };
}
const dogMetadata = JSON.parse(
  await readFile(`${sourceRoot}/games/dog-chase/bo-anh.json`, "utf8"),
);
const dog = {};
const studentActions = {
  ronren: "sneak",
  sohai: "scared",
  chay: "run",
  dongtay: "dance",
  nhay: "jump",
  baucay: "cling",
};
for (const [variant, animations] of Object.entries(dogMetadata.hs))
  for (const [oldAction, action] of Object.entries(studentActions)) {
    const record = animations[oldAction];
    if (
      !record ||
      !(await exists(`${sourceRoot}/games/dog-chase/${record.tep}`))
    )
      continue;
    const character = variant.replace("nam", "male").replace("nu", "female");
    dog[`student.${character}.${action}`] = {
      url: `/games/dog-chase/${record.tep}`,
      frames: Array.from({ length: record.so }, (_unused, index) => ({
        x: index * record.w,
        y: 0,
        width: record.w,
        height: record.h,
        bounds: [0, 0, 1, 1],
      })),
    };
  }
for (const [original, action] of Object.entries({
  ngu: "sleep",
  gamgu: "growl",
  sua: "bark",
  chay: "run",
  phanh: "brake",
  dongtay: "dance",
  nhay: "jump",
})) {
  const record = dogMetadata.cho[original];
  dog[`dog.${action}`] = {
    url: `/games/dog-chase/${record.tep}`,
    frames: Array.from({ length: record.so }, (_unused, index) => ({
      x: index * record.w,
      y: 0,
      width: record.w,
      height: record.h,
      bounds: [0, 0, 1, 1],
    })),
  };
}
for (const [key, path] of Object.entries({
  background: "nen_hem.webp",
  foreground: "tiencanh.webp",
  shelter: "nen_hem_noi.webp",
  slipper: "do/dep.webp",
  chicken: "do/ga.webp",
  stars: "do/sao.webp",
  sleepBubble: "do/bongNgu.webp",
}))
  dog[key] = { url: `/games/dog-chase/${path}`, frames: [] };
await save("dog-chase", dog);

const mango = {};
for (const [key, original] of Object.entries({
  shortChild: "thap",
  shortChildAlt: "thap2",
  tallChild: "cao",
  tallChildAlt: "cao2",
  girl: "gai",
  mango: "xoai",
  props: "do",
})) {
  const record = JSON.parse(
    await readFile(`${sourceRoot}/games/mango-poke/${original}.json`, "utf8"),
  );
  mango[key] = {
    url: `/games/mango-poke/${original}.webp`,
    frames: Object.values(record.frames).map(frame),
  };
}
for (const [key, name] of Object.entries({ background: "nen", pole: "sao" }))
  mango[key] = { url: `/games/mango-poke/${name}.webp`, frames: [] };
await save("mango-poke", mango);

const captured = new Map();
vm.runInNewContext(
  await readFile(`${sourceRoot}/_next/static/chunks/2m30rtz1gzj0f.js`, "utf8"),
  {
    TURBOPACK: {
      push(values) {
        for (let index = 1; index < values.length; index += 2)
          captured.set(values[index], values[index + 1]);
      },
    },
  },
);
const metadataModule = { exports: {} };
captured.get(32986)(null, metadataModule, {});
const meteor = {};
for (const [name, record] of Object.entries(metadataModule.exports)) {
  if (
    !/^hs-(nam|nu)/.test(name) &&
    ![
      "thien-thach2",
      "thien-thach3",
      "va-cham2",
      "va-cham3",
      "may",
      "nen-pho3",
      "npc-xeom",
      "npc-banhmi",
      "npc-kem",
      "npc-khac",
    ].includes(name)
  )
    continue;
  const url = record.url.split("?")[0];
  if (!(await exists(`${sourceRoot}${url}`))) continue;
  const key = name
    .replace("hs-nam", "student.male")
    .replace("hs-nu", "student.female")
    .replace("thien-thach2", "meteor")
    .replace("thien-thach3", "meteorAlt")
    .replace("va-cham2", "impact")
    .replace("va-cham3", "impactAlt")
    .replace("nen-pho3", "background")
    .replace("may", "clouds");
  meteor[key] = { url, frames: record.frames.map(frame) };
}
await save("meteor", meteor);

const jiangshi = {};
const animationNames = {
  dung: "idle",
  nhay: "hop",
  hoang: "panic",
  "trung-bua": "tagged",
  "bi-hut": "float",
  "go-bua": "remove",
  cuu: "rescue",
  "di-vao": "enter",
  "la-bua": "fly",
  "toe-bua": "burst",
  doi: "fly",
};
for (const name of [
  "nv/ct-01",
  "nv/ct-02",
  "nv/ct-03",
  "nv/ct-04",
  "nv/ct-05",
  "nv/ct-06",
  "nv/ct-07",
  "nv/ct-08",
  "nv/ct-09",
  "nv/ct-10",
  "phap-su",
  "fx/la-bua",
  "fx/toe-bua",
  "fx/doi",
]) {
  const record = JSON.parse(
    await readFile(`${sourceRoot}/cuong-thi/v2/${name}.json`, "utf8"),
  );
  const animations = {};
  const frames = Object.entries(record.frames).map(
    ([frameName, entry], index) => {
      const originalAction = frameName.replace(/-\d+$/, "");
      const action = animationNames[originalAction] ?? originalAction;
      (animations[action] ??= []).push(index);
      return {
        ...frame(entry.frame),
        offsetX: entry.spriteSourceSize.x,
        offsetY: entry.spriteSourceSize.y,
        sourceWidth: entry.sourceSize.w,
        sourceHeight: entry.sourceSize.h,
      };
    },
  );
  const key = name.startsWith("nv/")
    ? `student.${name.slice(3)}`
    : {
        "phap-su": "wizard",
        "fx/la-bua": "talisman",
        "fx/toe-bua": "burst",
        "fx/doi": "bat",
      }[name];
  jiangshi[key] = { url: `/cuong-thi/v2/${name}.webp`, frames, animations };
}
for (const [key, path] of Object.entries({
  sky: "bc/troi",
  middle: "bc/giua",
  ground: "bc/san",
  foreground: "bc/truoc",
  lantern: "bc/den-long-1",
  seal: "fx/bat-quai-ranh",
  paper: "fx/bua-phang",
}))
  jiangshi[key] = { url: `/cuong-thi/v2/${path}.webp`, frames: [] };
await save("jiangshi", jiangshi);

const desktop = {};
for (const [key, name] of Object.entries({
  background: "hinh-nen",
  computer: "ic-may-tinh",
  folder: "ic-thu-muc",
  browser: "ic-trinh-duyet",
  word: "ic-word",
  excel: "ic-excel",
  zalo: "ic-zalo",
  trash: "ic-thung-rac",
}))
  desktop[key] = { url: `/games/parent-call/${name}.webp`, frames: [] };
await save("parent-call", desktop);
for (const name of ["dog-chase", "mango-poke"])
  await cp(`${sourceRoot}/games/${name}/am`, `public/games/${name}/am`, {
    recursive: true,
  });
await cp(`${sourceRoot}/cuong-thi/v2/am`, "public/cuong-thi/v2/am", {
  recursive: true,
});
await mkdir("public/images/games", { recursive: true });
for (const [id, name] of Object.entries({
  "village-summon": "village-summon-avatar-v1",
  "dog-chase": "dog-chase-avatar-v1",
  "mango-poke": "mango-poke-avatar-v1",
  jiangshi: "linh-phu-avatar-v1",
  "parent-call": "parent-call-avatar-v3",
  meteor: "meteor-avatar-v1",
}))
  await cp(
    `${sourceRoot}/modules/${name}.webp`,
    `public/images/games/${id}.webp`,
  );
console.log("Imported artwork and sound for 5 games and 6 library thumbnails.");
