import type { SpeechFrame } from "./types.ts";

/** Synchronize only speech elements each frame; React owns the rest of the UI. */
export function drawSpeech(
  layer: HTMLDivElement,
  frame: SpeechFrame,
  width: number,
  height: number,
): void {
  const entries = [
    ...frame.shouts.map((shout) => ({
      ...shout,
      kind: "shout" as const,
    })),
    ...frame.bubbles.map((bubble) => ({
      ...bubble,
      kind: "speech" as const,
    })),
  ];
  const elements = new Map(
    Array.from(
      layer.querySelectorAll<HTMLDivElement>("[data-id]"),
      (element) => [element.dataset.id, element],
    ),
  );
  const activeIds = new Set<string>();
  for (const entry of entries) {
    const id = `${entry.kind}-${entry.id}`;
    activeIds.add(id);
    let element = elements.get(id);
    if (!element) {
      element = document.createElement("div");
      element.dataset.id = id;
      element.className =
        entry.kind === "speech"
          ? "xm-thoai"
          : `xm-chu ${entry.isLarge ? "xm-chu--lon" : ""}`;
      element.textContent = entry.text;
      layer.appendChild(element);
    }
    const halfWidth = Math.min(width / 2 - 10, element.offsetWidth / 2 || 80);
    const x = Math.max(halfWidth + 8, Math.min(width - halfWidth - 8, entry.x));
    if (entry.kind === "speech") {
      const y = Math.min(
        height - 12,
        Math.max(element.offsetHeight + 76, entry.y),
      );
      element.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
      element.style.setProperty("--tail-offset", `${entry.x - x}px`);
    } else {
      const progress = entry.progress;
      const scale =
        progress < 0.15
          ? 0.4 + (progress / 0.15) * 0.8
          : 1.2 - Math.min(0.2, (progress - 0.15) * 0.4);
      element.style.opacity = String(progress > 0.8 ? (1 - progress) / 0.2 : 1);
      element.style.transform = `translate(${x}px, ${entry.y - 30 * progress}px) translate(-50%, -50%) scale(${scale}) rotate(-6deg)`;
    }
  }
  for (const [id, element] of elements)
    if (!id || !activeIds.has(id)) element.remove();
}
