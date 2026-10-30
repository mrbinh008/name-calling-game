/** Record Web Audio scheduling without requiring a browser or sound device. */
export function createAudioHarness() {
  const trace = [];
  const intervals = new Map();
  const delayed = [];
  let nextId = 0;
  const parameter = (name) => {
    const target = { name };
    for (const method of [
      "setValueAtTime",
      "linearRampToValueAtTime",
      "exponentialRampToValueAtTime",
      "setTargetAtTime",
      "cancelScheduledValues",
    ]) {
      target[method] = (...args) => trace.push([name, method, ...args]);
    }
    Object.defineProperty(target, "value", {
      set(value) {
        trace.push([name, "value", value]);
      },
    });
    return target;
  };
  const node = (kind) => {
    const name = `${kind}-${nextId++}`;
    const target = {
      name,
      connect(destination) {
        trace.push([name, "connect", destination.name]);
        return destination;
      },
      disconnect() {
        trace.push([name, "disconnect"]);
      },
    };
    for (const key of ["gain", "frequency", "Q"])
      target[key] = parameter(`${name}.${key}`);
    for (const key of ["type", "loop"])
      Object.defineProperty(target, key, {
        set(value) {
          trace.push([name, key, value]);
        },
      });
    for (const method of ["start", "stop"])
      target[method] = (...args) => trace.push([name, method, ...args]);
    return target;
  };
  class AudioContextMock {
    state = "running";
    currentTime = 10;
    sampleRate = 16;
    destination = { name: "destination" };
    createGain() {
      return node("gain");
    }
    createOscillator() {
      return node("oscillator");
    }
    createBiquadFilter() {
      return node("filter");
    }
    createBufferSource() {
      return node("bufferSource");
    }
    createBuffer(_channels, length) {
      const samples = new Float32Array(length);
      return { getChannelData: () => samples };
    }
  }
  const window = {
    AudioContext: AudioContextMock,
    setInterval(callback) {
      const id = nextId++;
      intervals.set(id, callback);
      return id;
    },
    clearInterval(id) {
      intervals.delete(id);
    },
    setTimeout(callback) {
      delayed.push(callback);
      return nextId++;
    },
  };
  return {
    window,
    trace,
    tick: () => {
      for (const callback of intervals.values()) callback();
    },
    flush: () => {
      for (const callback of delayed.splice(0)) callback();
    },
    intervals,
  };
}

export function runAudioScenario(audio, harness, legacy = false) {
  const names = legacy
    ? { start: "batNen", stop: "tatNen", update: "capNhat", cue: "phat" }
    : {
        start: "startBackground",
        stop: "stopBackground",
        update: "update",
        cue: "playCue",
      };
  audio[names.start]();
  harness.tick();
  for (const [oldMood, newMood] of [
    ["em", "calm"],
    ["duoi", "chase"],
    ["doBo", "arrival"],
    ["hoi", "suspense"],
    ["lang", "silent"],
  ]) {
    audio[names.update](legacy ? oldMood : newMood, true);
    harness.tick();
  }
  for (const [oldCue, newCue] of [
    ["coi", "whistle"],
    ["phanh", "brake"],
    ["go", "knock"],
    ["loa", "horn"],
    ["ram", "crash"],
    ["hetXang", "stall"],
    ["gau", "bark"],
    ["trieuTap", "summon"],
    ["the", "result"],
  ])
    audio[names.cue](legacy ? oldCue : newCue);
  audio[names.stop]();
  harness.flush();
}
