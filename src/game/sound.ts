// Sound preference shared with the recovered Web Audio soundtrack.
let enabled = true;
export const gameAudio = {
  isEnabled: () => enabled,
  setEnabled(value: boolean) {
    enabled = Boolean(value);
  },
};
