// Recover the supplied build's pure game modules as standalone ES modules.
// This script is a development tool; the app never loads the Next.js chunks.
import { readFile, writeFile, cp, mkdir } from "node:fs/promises";
import vm from "node:vm";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";
import generateModule from "@babel/generator";
import * as t from "@babel/types";
import { format } from "prettier";
const traverse = traverseModule.default;
const generate = generateModule.default;
const factories = new Map();
// Reference recovery is separate from the maintained TypeScript application.
const referenceDirectory = "reference/recovered-build";
await mkdir(`${referenceDirectory}/public/games`, { recursive: true });
for (const file of ["1_9ctx7fr7c1r.js", "137ipox2hif_g.js"]) {
  const context = vm.createContext({
    TURBOPACK: {
      push(chunk) {
        for (let i = 1; i < chunk.length; i += 2)
          factories.set(chunk[i], chunk[i + 1]);
      },
    },
  });
  vm.runInContext(
    await readFile(`_next/static/chunks/${file}`, "utf8"),
    context,
  );
}
async function recover(id, file, imports, renames = {}, prefixOnly = false) {
  const fn = parse(`(${factories.get(id).toString()})`).program.body[0]
    .expression;
  const runtime = fn.params[0].name;
  const body = [];
  for (const statement of fn.body.body) {
    if (t.isVariableDeclaration(statement)) {
      let stop = false;
      const declarations = [];
      for (const decl of statement.declarations) {
        const defaultImport =
          t.isMemberExpression(decl.init) &&
          decl.init.property.name === "default";
        const call = defaultImport ? decl.init.object : decl.init;
        if (
          t.isCallExpression(call) &&
          t.isMemberExpression(call.callee) &&
          call.callee.object.name === runtime &&
          call.callee.property.name === "i"
        ) {
          const moduleId = call.arguments[0].value;
          if (prefixOnly && moduleId === 54407) {
            stop = true;
            break;
          }
          if (imports[moduleId])
            body.push(
              t.importDeclaration(
                [
                  defaultImport
                    ? t.importDefaultSpecifier(decl.id)
                    : t.importNamespaceSpecifier(decl.id),
                ],
                t.stringLiteral(imports[moduleId]),
              ),
            );
        } else declarations.push(decl);
      }
      if (declarations.length)
        body.push(t.variableDeclaration(statement.kind, declarations));
      if (stop) break;
    } else if (
      t.isExpressionStatement(statement) &&
      t.isCallExpression(statement.expression) &&
      t.isMemberExpression(statement.expression.callee) &&
      statement.expression.callee.object.name === runtime &&
      statement.expression.callee.property.name === "s"
    ) {
      if (prefixOnly) break;
      const exports = statement.expression.arguments[0].elements;
      for (let i = 0; i < exports.length; i += 3) {
        const name = exports[i].value;
        const value = exports[i + 2];
        if (t.isIdentifier(value))
          body.push(
            t.exportNamedDeclaration(null, [
              t.exportSpecifier(value, t.identifier(name)),
            ]),
          );
        else
          body.push(
            t.exportNamedDeclaration(
              t.variableDeclaration("const", [
                t.variableDeclarator(t.identifier(name), value),
              ]),
            ),
          );
      }
    } else body.push(statement);
  }
  if (prefixOnly)
    body.push(
      t.exportNamedDeclaration(null, [
        t.exportSpecifier(t.identifier("m"), t.identifier("villageAudio")),
      ]),
    );
  const ast = t.file(t.program(body));
  traverse(ast, {
    VariableDeclarator(path) {
      if (id === 54407 && t.isObjectExpression(path.node.init))
        path.node.init = t.callExpression(
          t.memberExpression(t.identifier("Object"), t.identifier("create")),
          [t.nullLiteral()],
        );
    },
    Program(path) {
      for (const [before, after] of Object.entries(renames))
        path.scope.rename(before, after);
    },
  });
  const source =
    "// Recovered from the supplied build; bundler runtime removed.\n" +
    generate(ast, { comments: true }).code;
  await writeFile(
    `${referenceDirectory}/${file}`,
    await format(source, { parser: "babel" }),
  );
}
await recover(54407, "names.js", {}, { t: "bangTenGoi" });
await recover(
  66320,
  "world.js",
  { 54407: "./names.js" },
  {
    t: "nameHelpers",
    a: "doorPosition",
    n: "roadStop",
    i: "worldSize",
    r: "CHILD_REACTIONS",
    s: "EXCUSES",
    o: "randomItem",
    l: "directionBetween",
    u: "OPPOSITE",
    h: "distance",
    c: "routeBetween",
    d: "RoundBuilder",
  },
);
await recover(
  2083,
  "scene.js",
  { 66320: "./world.js", 20239: "./atlas.js" },
  {
    t: "world",
    e: "atlasModule",
    a: "TILE_HEIGHT",
    b: "HOUSE_WIDTH",
    i: "loadSprite",
    n: "clamp01",
    x: "smoothstep",
    s: "hashName",
    y: "RIDING_ACTIONS",
  },
);
await recover(
  98011,
  "audio.js",
  { 87572: "./sound.js" },
  {
    s: "sound",
    u: "midiFrequency",
    h: "CHORDS",
    c: "CALM_MELODY",
    d: "CHASE_BASS",
    g: "CHASE_MELODY",
    p: "SUSPENSE_MELODY",
    f: "ARRIVAL_MELODY",
    m: "villageAudio",
  },
  true,
);
const atlasExports = {};
factories.get(20239)(
  null,
  {
    get exports() {
      return atlasExports;
    },
    set exports(value) {
      Object.assign(atlasExports, value);
    },
  },
  {},
);
for (const sheet of Object.values(atlasExports))
  sheet.url = sheet.url.split("?")[0];
await writeFile(
  `${referenceDirectory}/atlas.js`,
  "// Sprite frame coordinates recovered from the supplied build.\nexport default " +
    JSON.stringify(atlasExports, null, 2) +
    ";\n",
);
await cp(
  "game/village-summon",
  `${referenceDirectory}/public/games/village-summon`,
  {
    recursive: true,
  },
);
await cp("_next/static/media", `${referenceDirectory}/public/fonts`, {
  recursive: true,
});
console.log("Recovered world, renderer, sound, name helpers and sprite atlas.");
