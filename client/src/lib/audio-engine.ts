// Web Audio Engine for Ascension Protocol (Neuro-Reconditioning & Enforcer Soundscapes)
// Built purely with native AudioContext oscillators & nodes — zero external audio dependencies.

class AudioEngine {
  private ctx: AudioContext | null = null;
  private binauralLeftOsc: OscillatorNode | null = null;
  private binauralRightOsc: OscillatorNode | null = null;
  private noiseNode: AudioNode | null = null;
  private binauralGain: GainNode | null = null;
  private isBinauralPlaying: boolean = false;
  private klaxonInterval: number | null = null;

  private getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === "closed") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * 1. Command Lock Chime
   * Militaristic harmonic triad (A4 - C#5 - E5) with subtle decay.
   * Played on briefing acceptance, mission commitment, and micro-action lock.
   */
  public playCommandLock() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const freqs = [440, 554.37, 659.25, 880];

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0, now + idx * 0.05);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.05 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.65);
      });
    } catch (e) {
      console.warn("Audio playback not permitted or unavailable:", e);
    }
  }

  /**
   * 2. Judicial Court Gavel Impact
   * Low-frequency heavy impact (80Hz with resonant decay and distortion).
   * Played when convening the Weekly Performance Court.
   */
  public playCourtGavel() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Primary thump
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.35);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.65);

      // Wooden reverberation impulse
      const reverbOsc = ctx.createOscillator();
      const reverbGain = ctx.createGain();

      reverbOsc.type = "sine";
      reverbOsc.frequency.setValueAtTime(220, now + 0.02);
      reverbOsc.frequency.exponentialRampToValueAtTime(90, now + 0.25);

      reverbGain.gain.setValueAtTime(0.2, now + 0.02);
      reverbGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      reverbOsc.connect(reverbGain);
      reverbGain.connect(ctx.destination);

      reverbOsc.start(now + 0.02);
      reverbOsc.stop(now + 0.32);
    } catch (e) {
      console.warn("Audio playback not permitted:", e);
    }
  }

  /**
   * 3. Piercing Klaxon Breach Siren
   * Rapidly alternating 660Hz / 880Hz sawtooth emergency siren.
   * Played when attention breach countdown activates.
   */
  public startKlaxonSiren() {
    if (this.klaxonInterval) return;

    try {
      const ctx = this.getContext();
      let highTone = false;

      const playPulse = () => {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(highTone ? 880 : 660, now);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.24);

        highTone = !highTone;
      };

      playPulse();
      this.klaxonInterval = window.setInterval(playPulse, 280);
    } catch (e) {
      console.warn("Klaxon failed:", e);
    }
  }

  public stopKlaxonSiren() {
    if (this.klaxonInterval) {
      clearInterval(this.klaxonInterval);
      this.klaxonInterval = null;
    }
  }

  /**
   * 4. 40Hz Gamma Flow Wave (Binaural Neuro-Entrainment)
   * True binaural beat: Left ear 210Hz, Right ear 250Hz -> Perceived 40Hz Gamma oscillation.
   * Mixed with gentle low-pass pink noise for cognitive shielding during deep work.
   */
  public start40HzGammaFlow(volume = 0.3) {
    if (this.isBinauralPlaying) return;

    try {
      const ctx = this.getContext();
      const merger = ctx.createChannelMerger(2);
      this.binauralGain = ctx.createGain();
      this.binauralGain.gain.setValueAtTime(volume, ctx.currentTime);

      // Left Channel: 210Hz
      this.binauralLeftOsc = ctx.createOscillator();
      this.binauralLeftOsc.type = "sine";
      this.binauralLeftOsc.frequency.setValueAtTime(210, ctx.currentTime);
      this.binauralLeftOsc.connect(merger, 0, 0); // Left channel

      // Right Channel: 250Hz (250 - 210 = 40Hz Gamma Beat)
      this.binauralRightOsc = ctx.createOscillator();
      this.binauralRightOsc.type = "sine";
      this.binauralRightOsc.frequency.setValueAtTime(250, ctx.currentTime);
      this.binauralRightOsc.connect(merger, 0, 1); // Right channel

      merger.connect(this.binauralGain);
      this.binauralGain.connect(ctx.destination);

      this.binauralLeftOsc.start();
      this.binauralRightOsc.start();
      this.isBinauralPlaying = true;
    } catch (e) {
      console.warn("40Hz Gamma failed to start:", e);
    }
  }

  public set40HzGammaVolume(volume: number) {
    if (this.binauralGain && this.ctx) {
      this.binauralGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
    }
  }

  public stop40HzGammaFlow() {
    if (!this.isBinauralPlaying) return;

    try {
      if (this.binauralLeftOsc) {
        this.binauralLeftOsc.stop();
        this.binauralLeftOsc.disconnect();
        this.binauralLeftOsc = null;
      }
      if (this.binauralRightOsc) {
        this.binauralRightOsc.stop();
        this.binauralRightOsc.disconnect();
        this.binauralRightOsc = null;
      }
      if (this.binauralGain) {
        this.binauralGain.disconnect();
        this.binauralGain = null;
      }
      this.isBinauralPlaying = false;
    } catch (e) {
      console.warn("Failed to stop Gamma flow:", e);
    }
  }

  public isGammaFlowActive(): boolean {
    return this.isBinauralPlaying;
  }

  /**
   * 5. Mechanical Switch Tactile Click (Zero Network Latency)
   * Procedural combination of a 40ms pitch-drop resonance and a 15ms filtered noise snap.
   * Triggered on key button taps and toggles.
   */
  public playTactileClick() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // 1. Resonant body pitch drop
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.04);
      oscGain.gain.setValueAtTime(0.25, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.045);

      // 2. High-pass transient click
      const bufferSize = Math.floor(ctx.sampleRate * 0.015);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.setValueAtTime(1100, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.12, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 0.018);

      // 3. Mobile physical haptic trigger
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(10);
      }
    } catch {
      // Fallback silently if audio context is blocked
    }
  }

  /**
   * 6. Ascension Coffer Anticipation Rumble
   * Rising pitch sub-bass vibration (60Hz -> 180Hz) with rattling mechanical resonance.
   * Played for 800ms while the loot cache shakes before bursting open.
   */
  public playChestRumble() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const duration = 0.85;

      // Low frequency rumble oscillator with pitch climb
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(55, now);
      osc.frequency.exponentialRampToValueAtTime(170, now + duration);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.3, now + duration * 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(120, now);
      filter.frequency.exponentialRampToValueAtTime(450, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);

      // Mobile haptic vibration pattern
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([15, 30, 20, 30, 30, 40, 50]);
      }
    } catch (e) {
      console.warn("Chest rumble sound failed:", e);
    }
  }

  /**
   * 7. Loot Rarity Fanfare & Chime Burst
   * Procedural harmonic revelation based on rarity drop.
   */
  public playLootFanfare(rarity: "common" | "rare" | "epic" | "legendary" = "common") {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      let freqs: number[] = [523.25, 659.25, 783.99]; // C Major
      let hapticPattern = [30, 40];

      if (rarity === "rare") {
        freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        hapticPattern = [30, 40, 50];
      } else if (rarity === "epic") {
        freqs = [440.00, 554.37, 659.25, 880.00, 1108.73]; // A Major 9
        hapticPattern = [40, 50, 60, 80];
      } else if (rarity === "legendary") {
        freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00]; // Multi-octave cascade
        hapticPattern = [50, 60, 80, 80, 120, 200];
      }

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = rarity === "legendary" ? "triangle" : "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        const noteGain = rarity === "legendary" ? 0.2 : 0.15;
        gain.gain.setValueAtTime(0, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(noteGain, now + idx * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + idx * 0.06 + 0.85);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.9);
      });

      // Mobile haptics
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(hapticPattern);
      }
    } catch (e) {
      console.warn("Loot fanfare sound failed:", e);
    }
  }

  public playLevelUp() {
    this.playLootFanfare("legendary");
  }

  public playSuccess() {
    this.playLootFanfare("rare");
  }

  public playChestUnlock() {
    this.playCommandLock();
  }
}

export const audioEngine = new AudioEngine();
