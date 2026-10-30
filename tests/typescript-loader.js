import { readFile } from "node:fs/promises";
import { transformWithOxc } from "vite";

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const target = new URL("../src/" + specifier.slice(2), import.meta.url)
      .href;
    return nextResolve(target, context);
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (!/\.tsx?$/.test(url)) return nextLoad(url, context);
  const source = await readFile(new URL(url), "utf8");
  const result = await transformWithOxc(source, new URL(url).pathname);
  return { format: "module", source: result.code, shortCircuit: true };
}
