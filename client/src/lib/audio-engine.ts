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
}

export const audioEngine = new AudioEngine();
