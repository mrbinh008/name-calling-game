import type { CueName, MusicMood } from "@/game/types.ts";
import { gameAudio } from "@/game/sound.ts";
import {
  midiToFrequency,
  CHORDS,
  CALM_MELODY,
  CHASE_BASS,
  CHASE_MELODY,
  SUSPENSE_MELODY,
  ARRIVAL_MELODY,
} from "@/game/audio/score.ts";
export class VillageAudio {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private background: {
    music: GainNode;
    engine: GainNode;
  } | null = null;
  private musicTimer: number | null = null;
  private nextBeatTime = 0;
  private step = 0;
  private mood: MusicMood = "calm";
  private engineRunning = false;
  private requireContext(): AudioContext {
    if (!this.audioContext) throw new Error("Audio context is not initialized");
    return this.audioContext;
  }
  private requireMasterGain(): GainNode {
    if (!this.masterGain) throw new Error("Audio output is not initialized");
    return this.masterGain;
  }
  private getContext(): AudioContext | null {
    if (!gameAudio.isEnabled()) return null;
    try {
      if (!this.audioContext) {
        const AudioContextConstructor =
          window.AudioContext || window.webkitAudioContext;
        if (!AudioContextConstructor) return null;
        this.audioContext = new AudioContextConstructor();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.8;
        this.masterGain.connect(this.audioContext.destination);
      }
      if (this.audioContext.state === "suspended") {
        this.audioContext.resume().catch(() => {});
      }
      return this.audioContext;
    } catch {
      return null;
    }
  }
  private createNoiseSource(context: AudioContext, loop: boolean = false) {
    if (!this.noiseBuffer) {
      const buffer = context.createBuffer(
        1,
        2 * context.sampleRate,
        context.sampleRate,
      );
      const samples = buffer.getChannelData(0);
      for (let index = 0; index < samples.length; index++)
        samples[index] = 2 * Math.random() - 1;
      this.noiseBuffer = buffer;
    }
    const source = context.createBufferSource();
    source.buffer = this.noiseBuffer;
    source.loop = loop;
    return source;
  }
  startBackground() {
    const context = this.getContext();
    if (!context || this.background) return;
    const time = context.currentTime;
    const musicGain = context.createGain();
    musicGain.gain.setValueAtTime(0, time);
    musicGain.gain.linearRampToValueAtTime(0.4, time + 1);
    musicGain.connect(this.requireMasterGain());
    const engineGain = context.createGain();
    engineGain.gain.value = 0;
    engineGain.connect(this.requireMasterGain());
    const engineOscillator = context.createOscillator();
    engineOscillator.type = "sawtooth";
    engineOscillator.frequency.value = 58;
    const engineFilter = context.createBiquadFilter();
    engineFilter.type = "lowpass";
    engineFilter.frequency.value = 420;
    const engineEnvelope = context.createGain();
    engineEnvelope.gain.value = 0.5;
    const enginePulse = context.createOscillator();
    enginePulse.type = "square";
    enginePulse.frequency.value = 13;
    const pulseDepth = context.createGain();
    pulseDepth.gain.value = 0.45;
    enginePulse.connect(pulseDepth).connect(engineEnvelope.gain);
    engineOscillator
      .connect(engineFilter)
      .connect(engineEnvelope)
      .connect(engineGain);
    engineOscillator.start();
    enginePulse.start();
    this.background = {
      music: musicGain,
      engine: engineGain,
    };
    this.engineRunning = false;
    this.nextBeatTime = context.currentTime + 0.15;
    this.musicTimer = window.setInterval(() => this.scheduleMusic(), 100);
  }
  stopBackground() {
    if (null !== this.musicTimer) {
      window.clearInterval(this.musicTimer);
    }
    this.musicTimer = null;
    const context = this.audioContext;
    if (context && this.background) {
      const time = context.currentTime;
      for (const gain of Object.values(this.background)) {
        gain.gain.cancelScheduledValues(time);
        gain.gain.setTargetAtTime(0, time, 0.12);
      }
      const background = this.background;
      window.setTimeout(
        () => Object.values(background).forEach((gain) => gain.disconnect()),
        900,
      );
    }
    this.background = null;
  }
  update(mood: MusicMood, engineRunning: boolean) {
    const context = this.audioContext;
    if (context && this.background) {
      if (mood !== this.mood) {
        const time = context.currentTime;
        this.background.music.gain.cancelScheduledValues(time);
        this.background.music.gain.setTargetAtTime(
          {
            calm: 0.4,
            chase: 0.38,
            arrival: 0.5,
            suspense: 0.42,
            silent: 0,
          }[mood],
          time,
          mood === "silent" ? 0.04 : 0.15,
        );
        const isMovementMood = (mood: MusicMood) =>
          mood === "chase" || mood === "arrival";
        if (!(
          mood === "silent" ||
          (isMovementMood(mood) && isMovementMood(this.mood))
        )) {
          this.step = 0;
          this.nextBeatTime = time + 0.05;
        }
        this.mood = mood;
      }
      if (engineRunning !== this.engineRunning) {
        this.background.engine.gain.setTargetAtTime(
          0.1 * Number(engineRunning),
          context.currentTime,
          0.12,
        );
        this.engineRunning = engineRunning;
      }
    }
  }
  private scheduleMusic() {
    const context = this.audioContext;
    if (!context || !this.background) return;
    if (this.mood === "silent") {
      this.nextBeatTime = context.currentTime + 0.1;
      return;
    }
    const mood = this.mood;
    const stepDuration = 60 / (mood === "calm" ? 116 : 136) / 4;
    for (; this.nextBeatTime < context.currentTime + 0.35;) {
      const time = this.nextBeatTime;
      const step = this.step;
      if (mood === "calm") {
        this.playCalmMusic(time, step);
      } else {
        if (mood === "chase") {
          this.playChaseMusic(time, step);
        } else {
          if (mood === "arrival") {
            this.playArrivalMusic(time, step);
          } else {
            this.playSuspenseMusic(time, step, stepDuration);
          }
        }
      }
      this.nextBeatTime += stepDuration;
      this.step++;
    }
  }
  private playCalmMusic(time: number, step: number) {
    const bar = Math.floor(step / 16) % 8;
    const beat = step % 16;
    const chord = CHORDS[bar];
    const bassNote = bar === 6 && beat >= 8 ? 43 : chord[0];
    if (beat === 0 || beat === 8 || (beat === 10 && bar % 2 == 1)) {
      this.playKick(time, 0.75);
    }
    if (beat === 4 || beat === 12) {
      this.playClap(time, 0.32);
    }
    if (beat % 2 == 0) {
      this.playHiHat(time, beat % 4 == 2 ? 0.07 : 0.035);
    }
    const bassOffsets: Partial<Record<number, number>> = {
      0: 0,
      3: 0,
      6: 12,
      8: 7,
      11: 0,
      14: 12,
    };
    if (undefined !== bassOffsets[beat]) {
      this.playNote(
        midiToFrequency(bassNote - 12 + bassOffsets[beat]),
        time,
        0.2,
        0.34,
        "triangle",
        900,
      );
    }
    if (beat % 4 == 2)
      for (const note of bar === 6 && beat >= 8 ? [43, 47, 50] : chord)
        this.playNote(
          midiToFrequency(note + 12),
          time,
          0.16,
          0.07,
          "triangle",
          2400,
        );
    const melodyNote = CALM_MELODY[bar][beat];
    if (melodyNote > 0) {
      this.playWoodblock(midiToFrequency(melodyNote), time, 0.17);
    }
    if (bar === 7 && beat === 12) {
      [84, 88, 91].forEach((note, index) =>
        this.playWoodblock(midiToFrequency(note), time + 0.05 * index, 0.08),
      );
    }
  }
  private playChaseMusic(time: number, step: number) {
    const bar = Math.floor(step / 16) % 8;
    const beat = step % 16;
    const bassNote = CHASE_BASS[bar % 4];
    if (beat % 4 == 0) {
      this.playKick(time, 0.8);
    }
    if (beat === 4 || beat === 12) {
      this.playSnare(time, 0.42);
    }
    if (bar % 4 == 3 && beat >= 12) {
      this.playSnare(time, 0.18 + (beat - 12) * 0.06);
    }
    this.playHiHat(time, beat % 4 == 2 ? 0.09 : 0.035);
    if (beat % 2 == 0) {
      this.playNote(
        midiToFrequency(bassNote - 12 + 12 * Number(beat % 4 == 2)),
        time,
        0.13,
        0.36,
        "sawtooth",
        800,
      );
    }
    if (beat === 0 || beat === 6 || beat === 10)
      for (const note of bassNote === 40
        ? [56, 59, 64]
        : bassNote === 45
          ? [57, 60, 64]
          : bassNote === 41
            ? [57, 60, 65]
            : [55, 59, 62])
        this.playBrass(
          midiToFrequency(note),
          time,
          beat === 0 ? 0.2 : 0.11,
          0.06,
        );
    if (bar >= 4) {
      if (bar === 7) {
        const melodyNote = SUSPENSE_MELODY[beat];
        if (melodyNote > 0) {
          this.playLead(midiToFrequency(melodyNote), time, 0.1, 0.11);
        }
      } else {
        if (beat === 0 || beat === 8) {
          this.playWhistle(
            midiToFrequency(beat === 0 ? 81 : 76),
            time,
            0.838235294117647,
            0.09,
          );
        }
      }
    } else {
      const melodyNote = CHASE_MELODY[bar % 4][beat];
      if (melodyNote > 0) {
        this.playLead(midiToFrequency(melodyNote), time, 0.13, 0.12);
      }
    }
  }
  private playArrivalMusic(time: number, step: number) {
    const bar = Math.floor(step / 16) % 2;
    const beat = step % 16;
    if (beat % 2 == 0) {
      const note = ARRIVAL_MELODY[bar][beat / 2];
      if (note > 0) {
        this.playNote(
          midiToFrequency(note - 12),
          time,
          0.12,
          0.42,
          "triangle",
          1100,
        );
      }
    }
    if (beat === 0 || beat === 6 || beat === 12) {
      this.playRimshot(time, beat === 0 ? 0.22 : 0.14);
    }
    if (beat === 8) {
      this.playKick(time, 0.4);
    }
    if (beat % 4 == 2) {
      this.playHiHat(time, 0.03);
    }
    if (beat === 14 && bar === 1) {
      this.playWoodblock(midiToFrequency(88), time, 0.07);
    }
  }
  private playSuspenseMusic(time: number, step: number, stepDuration: number) {
    const intensity = Math.min(1, step / 32);
    this.playSnare(time, 0.12 + 0.3 * intensity);
    if (step >= 16) {
      this.playSnare(time + stepDuration / 2, 0.1 + 0.28 * intensity);
    }
    if (step % 4 == 0) {
      this.playNote(
        midiToFrequency(33),
        time,
        0.5,
        0.35 + 0.25 * intensity,
        "sine",
        400,
      );
    }
  }
  private connectToMusic(node: AudioNode) {
    if (!this.background) throw new Error("Music output is not initialized");
    return node.connect(this.background.music);
  }
  private playNote(
    frequency: number,
    time: number,
    duration: number,
    volume: number,
    waveform: OscillatorType,
    cutoff: number,
  ) {
    const context = this.requireContext();
    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    oscillator.type = waveform;
    oscillator.frequency.value = frequency;
    filter.type = "lowpass";
    filter.frequency.value = cutoff;
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(volume, time + 0.006);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + duration);
    this.connectToMusic(oscillator.connect(filter).connect(envelope));
    oscillator.start(time);
    oscillator.stop(time + duration + 0.02);
  }
  private playWoodblock(frequency: number, time: number, volume: number) {
    const context = this.requireContext();
    for (const [frequencyRatio, amplitudeRatio, duration] of [
      [1, 1, 0.32],
      [4, 0.35, 0.06],
    ]) {
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency * frequencyRatio;
      envelope.gain.setValueAtTime(0, time);
      envelope.gain.linearRampToValueAtTime(
        volume * amplitudeRatio,
        time + 0.004,
      );
      envelope.gain.exponentialRampToValueAtTime(0.001, time + duration);
      this.connectToMusic(oscillator.connect(envelope));
      oscillator.start(time);
      oscillator.stop(time + duration + 0.02);
    }
  }
  private playLead(
    frequency: number,
    time: number,
    duration: number,
    volume: number,
  ) {
    const context = this.requireContext();
    const fundamental = context.createOscillator();
    const harmonic = context.createOscillator();
    const envelope = context.createGain();
    fundamental.type = "square";
    fundamental.frequency.value = frequency;
    harmonic.type = "triangle";
    harmonic.frequency.value = 2 * frequency;
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 2600;
    const harmonicGain = context.createGain();
    harmonicGain.gain.value = 0.4;
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(volume, time + 0.01);
    envelope.gain.setValueAtTime(volume, time + 0.6 * duration);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + duration);
    fundamental.connect(filter);
    harmonic.connect(harmonicGain).connect(filter);
    this.connectToMusic(filter.connect(envelope));
    fundamental.start(time);
    harmonic.start(time);
    fundamental.stop(time + duration + 0.02);
    harmonic.stop(time + duration + 0.02);
  }
  private playWhistle(
    frequency: number,
    time: number,
    duration: number,
    volume: number,
  ) {
    const context = this.requireContext();
    const oscillator = context.createOscillator();
    const vibrato = context.createOscillator();
    const vibratoDepth = context.createGain();
    const envelope = context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(0.97 * frequency, time);
    oscillator.frequency.linearRampToValueAtTime(frequency, time + 0.08);
    vibrato.frequency.value = 6;
    vibratoDepth.gain.value = 0.012 * frequency;
    vibrato.connect(vibratoDepth).connect(oscillator.frequency);
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(volume, time + 0.05);
    envelope.gain.setValueAtTime(volume, time + 0.8 * duration);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + duration);
    this.connectToMusic(oscillator.connect(envelope));
    oscillator.start(time);
    vibrato.start(time);
    oscillator.stop(time + duration + 0.02);
    vibrato.stop(time + duration + 0.02);
  }
  private playBrass(
    frequency: number,
    time: number,
    duration: number,
    volume: number,
  ) {
    const context = this.requireContext();
    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    oscillator.type = "sawtooth";
    oscillator.frequency.value = frequency;
    filter.type = "lowpass";
    filter.Q.value = 2;
    filter.frequency.setValueAtTime(600, time);
    filter.frequency.linearRampToValueAtTime(3e3, time + 0.03);
    filter.frequency.exponentialRampToValueAtTime(900, time + duration);
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(volume, time + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + duration);
    this.connectToMusic(oscillator.connect(filter).connect(envelope));
    oscillator.start(time);
    oscillator.stop(time + duration + 0.02);
  }
  private playKick(time: number, volume: number) {
    const context = this.requireContext();
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(150, time);
    oscillator.frequency.exponentialRampToValueAtTime(45, time + 0.12);
    envelope.gain.setValueAtTime(volume, time);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.26);
    this.connectToMusic(oscillator.connect(envelope));
    oscillator.start(time);
    oscillator.stop(time + 0.28);
  }
  private playClap(time: number, volume: number) {
    const context = this.requireContext();
    for (const delay of [0, 0.011, 0.022]) {
      const source = this.createNoiseSource(context);
      const filter = context.createBiquadFilter();
      const envelope = context.createGain();
      filter.type = "bandpass";
      filter.frequency.value = 1400;
      filter.Q.value = 1.2;
      envelope.gain.setValueAtTime(volume, time + delay);
      envelope.gain.exponentialRampToValueAtTime(
        0.001,
        time + delay + (delay === 0.022 ? 0.13 : 0.02),
      );
      this.connectToMusic(source.connect(filter).connect(envelope));
      source.start(time + delay);
      source.stop(time + delay + 0.15);
    }
  }
  private playRimshot(time: number, volume: number) {
    const context = this.requireContext();
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(1250, time);
    oscillator.frequency.exponentialRampToValueAtTime(900, time + 0.05);
    envelope.gain.setValueAtTime(volume, time);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.07);
    this.connectToMusic(oscillator.connect(envelope));
    oscillator.start(time);
    oscillator.stop(time + 0.08);
  }
  private playHiHat(time: number, volume: number) {
    const context = this.requireContext();
    const source = this.createNoiseSource(context);
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    filter.type = "highpass";
    filter.frequency.value = 7e3;
    envelope.gain.setValueAtTime(volume, time);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    this.connectToMusic(source.connect(filter).connect(envelope));
    source.start(time);
    source.stop(time + 0.06);
  }
  private playSnare(time: number, volume: number = 0.35) {
    const context = this.requireContext();
    const source = this.createNoiseSource(context);
    const filter = context.createBiquadFilter();
    const noiseEnvelope = context.createGain();
    filter.type = "bandpass";
    filter.frequency.value = 1800;
    noiseEnvelope.gain.setValueAtTime(volume, time);
    noiseEnvelope.gain.exponentialRampToValueAtTime(0.001, time + 0.14);
    this.connectToMusic(source.connect(filter).connect(noiseEnvelope));
    source.start(time);
    source.stop(time + 0.15);
    const oscillator = context.createOscillator();
    const toneEnvelope = context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(220, time);
    oscillator.frequency.exponentialRampToValueAtTime(160, time + 0.08);
    toneEnvelope.gain.setValueAtTime(0.6 * volume, time);
    toneEnvelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    this.connectToMusic(oscillator.connect(toneEnvelope));
    oscillator.start(time);
    oscillator.stop(time + 0.12);
  }
  private playNoiseSweep(
    context: AudioContext,
    time: number,
    duration: number,
    filterType: BiquadFilterType,
    startFrequency: number,
    endFrequency: number,
    volume: number,
    resonance: number = 1,
  ) {
    const source = this.createNoiseSource(context);
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    filter.type = filterType;
    filter.Q.value = resonance;
    filter.frequency.setValueAtTime(startFrequency, time);
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(20, endFrequency),
      time + duration,
    );
    envelope.gain.setValueAtTime(volume, time);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + duration);
    source.connect(filter).connect(envelope).connect(this.requireMasterGain());
    source.start(time);
    source.stop(time + duration + 0.05);
  }
  private playFrequencySweep(
    context: AudioContext,
    time: number,
    waveform: OscillatorType,
    startFrequency: number,
    endFrequency: number,
    duration: number,
    volume: number,
  ) {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(startFrequency, time);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(20, endFrequency),
      time + duration,
    );
    envelope.gain.setValueAtTime(volume, time);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + duration);
    oscillator.connect(envelope).connect(this.requireMasterGain());
    oscillator.start(time);
    oscillator.stop(time + duration + 0.05);
  }
  private playDuckQuack(context: AudioContext, time: number) {
    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(520, time);
    oscillator.frequency.exponentialRampToValueAtTime(330, time + 0.16);
    filter.type = "bandpass";
    filter.frequency.value = 1300;
    filter.Q.value = 4;
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(0.5, time + 0.015);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    oscillator
      .connect(filter)
      .connect(envelope)
      .connect(this.requireMasterGain());
    oscillator.start(time);
    oscillator.stop(time + 0.22);
  }
  playCue(cue: CueName) {
    const context = this.getContext();
    if (!context || !this.masterGain) return;
    const time = context.currentTime;
    switch (cue) {
      case "whistle":
        for (const [delay, duration] of [
          [0, 0.16],
          [0.24, 0.32],
        ]) {
          const oscillator = context.createOscillator();
          const modulator = context.createOscillator();
          const modulationDepth = context.createGain();
          const envelope = context.createGain();
          oscillator.type = "square";
          oscillator.frequency.value = 2600;
          modulator.frequency.value = 38;
          modulationDepth.gain.value = 140;
          modulator.connect(modulationDepth).connect(oscillator.frequency);
          envelope.gain.setValueAtTime(0.09, time + delay);
          envelope.gain.setValueAtTime(0.09, time + delay + duration);
          envelope.gain.exponentialRampToValueAtTime(
            0.001,
            time + delay + duration + 0.04,
          );
          oscillator.connect(envelope).connect(this.requireMasterGain());
          oscillator.start(time + delay);
          modulator.start(time + delay);
          oscillator.stop(time + delay + duration + 0.06);
          modulator.stop(time + delay + duration + 0.06);
        }
        this.playFrequencySweep(
          context,
          time + 0.7,
          "triangle",
          600,
          1100,
          0.6,
          0.14,
        );
        this.playFrequencySweep(
          context,
          time + 1.3,
          "triangle",
          1100,
          600,
          0.6,
          0.14,
        );
        break;
      case "brake":
        this.playNoiseSweep(
          context,
          time,
          0.55,
          "bandpass",
          3800,
          2200,
          0.5,
          8,
        );
        this.playFrequencySweep(
          context,
          time,
          "sawtooth",
          1900,
          1500,
          0.5,
          0.05,
        );
        break;
      case "knock":
        for (let index = 0; index < 3; index++) {
          this.playFrequencySweep(
            context,
            time + 0.24 * index,
            "sine",
            190,
            90,
            0.12,
            0.8,
          );
          this.playNoiseSweep(
            context,
            time + 0.24 * index,
            0.06,
            "lowpass",
            1400,
            300,
            0.5,
          );
        }
        break;
      case "horn":
        for (let index = 0; index < 3; index++)
          this.playDuckQuack(context, time + 0.3 * index);
        break;
      case "crash":
        this.playNoiseSweep(context, time, 0.5, "lowpass", 2400, 120, 1);
        this.playFrequencySweep(
          context,
          time + 0.02,
          "square",
          330,
          180,
          0.35,
          0.15,
        );
        this.playFrequencySweep(
          context,
          time + 0.05,
          "triangle",
          1200,
          1150,
          0.5,
          0.08,
        );
        break;
      case "stall":
        for (let index = 0; index < 5; index++)
          this.playNoiseSweep(
            context,
            time + 0.32 * index + 0.05 * Math.random(),
            0.12,
            "lowpass",
            400,
            80,
            0.7,
          );
        this.playNoiseSweep(context, time + 1.9, 0.25, "lowpass", 900, 60, 1);
        break;
      case "bark":
        for (const delay of [0, 0.28]) {
          this.playFrequencySweep(
            context,
            time + delay,
            "square",
            520,
            240,
            0.14,
            0.18,
          );
          this.playNoiseSweep(
            context,
            time + delay,
            0.12,
            "bandpass",
            1100,
            600,
            0.4,
            2,
          );
        }
        break;
      case "summon":
        [67, 67, 72, 76].forEach((note, index) => {
          this.playFrequencySweep(
            context,
            time + [0, 0.12, 0.26, 0.42][index],
            "sawtooth",
            midiToFrequency(note),
            midiToFrequency(note),
            index === 3 ? 0.6 : 0.1,
            0.11,
          );
          this.playFrequencySweep(
            context,
            time + [0, 0.12, 0.26, 0.42][index],
            "triangle",
            midiToFrequency(note + 12),
            midiToFrequency(note + 12),
            index === 3 ? 0.6 : 0.1,
            0.06,
          );
        });
        break;
      case "result":
        [72, 76, 79, 84].forEach((note, index) =>
          this.playFrequencySweep(
            context,
            time + 0.08 * index,
            "triangle",
            midiToFrequency(note),
            midiToFrequency(note),
            0.35,
            0.2,
          ),
        );
    }
  }
}
export const villageAudio = new VillageAudio();
