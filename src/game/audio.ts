/**
 * Web Audio API synthesizer for Optimum Hill Climb
 * Generates dynamic engine sound, coin chimes, fuel powerups, and crash effects
 * without relying on external audio assets.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  // Engine sound nodes
  private engineOsc: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private isEngineRunning: boolean = false;

  private lastLowFuelBeep: number = 0;

  constructor() {
    if (typeof localStorage !== 'undefined') {
      const savedMute = localStorage.getItem('optimum_muted');
      this.isMuted = savedMute === 'true';
    }
  }

  private initContext() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.isMuted ? 0 : 0.8;
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('optimum_muted', String(this.isMuted));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public startEngine() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isEngineRunning) return;

    try {
      const now = this.ctx.currentTime;
      // Main engine tone (sawtooth rich in harmonics)
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(55, now);

      // Low sub rumble (triangle)
      this.engineSubOsc = this.ctx.createOscillator();
      this.engineSubOsc.type = 'triangle';
      this.engineSubOsc.frequency.setValueAtTime(27.5, now);

      // Filter to dampen harsh buzz
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(350, now);

      // Engine volume gain
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.08, now);

      this.engineOsc.connect(this.engineFilter);
      this.engineSubOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);

      this.engineOsc.start(now);
      this.engineSubOsc.start(now);
      this.isEngineRunning = true;
    } catch {
      // Audio might be blocked until user interacts
    }
  }

  public updateEngine(speedNormalized: number, throttle: boolean, inAir: boolean) {
    if (!this.ctx || !this.isEngineRunning || !this.engineOsc || !this.engineSubOsc || !this.engineGain || !this.engineFilter) {
      return;
    }

    const now = this.ctx.currentTime;
    let targetFreq = 48 + speedNormalized * 90;
    if (throttle) {
      targetFreq += 45;
      if (inAir) targetFreq += 40; // Revs up wildly in air when holding gas
    }

    targetFreq = Math.min(260, Math.max(45, targetFreq));
    const targetFilter = 280 + (targetFreq - 45) * 3.5;
    const targetGain = throttle ? 0.16 : 0.08;

    this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.08);
    this.engineSubOsc.frequency.setTargetAtTime(targetFreq * 0.5, now, 0.08);
    this.engineFilter.frequency.setTargetAtTime(targetFilter, now, 0.08);
    this.engineGain.gain.setTargetAtTime(targetGain, now, 0.06);
  }

  public stopEngine() {
    if (!this.isEngineRunning || !this.ctx) return;
    try {
      if (this.engineGain) {
        this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      }
      setTimeout(() => {
        try {
          this.engineOsc?.stop();
          this.engineSubOsc?.stop();
          this.engineOsc?.disconnect();
          this.engineSubOsc?.disconnect();
        } catch {}
        this.isEngineRunning = false;
        this.engineOsc = null;
        this.engineSubOsc = null;
      }, 100);
    } catch {
      this.isEngineRunning = false;
    }
  }

  /**
   * Silver Optimum Coin pickup sound (bright sparkling two-tone harmonic ping)
   */
  public playCoin() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      // Chime note sequence E6 (1318 Hz) to B6 (1975 Hz)
      osc1.frequency.setValueAtTime(1318.5, now);
      osc1.frequency.exponentialRampToValueAtTime(1975.5, now + 0.07);

      osc2.frequency.setValueAtTime(2637, now);
      osc2.frequency.exponentialRampToValueAtTime(3951, now + 0.08);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.23);
      osc2.stop(now + 0.23);
    } catch {}
  }

  /**
   * Fuel refuel sound (energizing multi-note powerup sweep)
   */
  public playFuel() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [329.63, 440, 554.37, 659.25, 880]; // E major chord powerup
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const noteTime = now + idx * 0.05;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.2, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.15);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(noteTime);
        osc.stop(noteTime + 0.16);
      });
    } catch {}
  }

  /**
   * Stunt celebration fanfare (frontflip, backflip, big air)
   */
  public playStunt() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C major fanfare
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const noteTime = now + idx * 0.07;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.15, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + (idx === notes.length - 1 ? 0.35 : 0.12));

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(noteTime);
        osc.stop(noteTime + 0.4);
      });
    } catch {}
  }

  /**
   * Level Complete victorious brass fanfare & celebratory jingle
   */
  public playLevelComplete() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      // Triumphant 5-note victory sequence (G4, C5, E5, G5, C6)
      const notes = [392.0, 523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const noteTime = now + idx * 0.11;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = idx === notes.length - 1 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        const duration = idx === notes.length - 1 ? 0.7 : 0.2;
        gain.gain.setValueAtTime(0.28, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(noteTime);
        osc.stop(noteTime + duration + 0.05);
      });
    } catch {}
  }

  /**
   * Suspension landing impact
   */
  public playLand(intensity: number) {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.12);

      const vol = Math.min(0.3, Math.max(0.05, intensity * 0.25));
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch {}
  }

  /**
   * Crash sound (driver flipped or fatal hit)
   */
  public playCrash() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      // Low boom
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.45);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.5);

      // Noise burst for crunchy metal scrape
      const bufferSize = this.ctx.sampleRate * 0.3;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.25, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      noise.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noise.start(now);
      noise.stop(now + 0.35);
    } catch {}
  }

  /**
   * Low fuel warning beep (fires at most once per 1.5s)
   */
  public playLowFuel() {
    const nowMs = Date.now();
    if (nowMs - this.lastLowFuelBeep < 1400) return;
    this.lastLowFuelBeep = nowMs;

    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(660, now + 0.08);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch {}
  }
}

export const sound = new SoundEngine();
