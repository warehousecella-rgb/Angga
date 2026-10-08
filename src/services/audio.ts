// Web Audio API Synthesizer for reliable, zero-latency device sounds

class SoundManager {
  private ctx: AudioContext | null = null;
  private mismatchAudio: HTMLAudioElement | null = null;
  private customAudioSrc: string | null = null;
  private mismatchTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.initMismatchAudio();
  }

  private initMismatchAudio() {
    try {
      if (typeof window !== 'undefined') {
        const audio = new Audio();
        audio.src = this.customAudioSrc || '/tithuh-warning-545568.mp3';
        audio.preload = 'auto';
        this.mismatchAudio = audio;
      }
    } catch {
      // Audio element not supported
    }
  }

  setCustomMismatchAudio(src: string | null) {
    this.customAudioSrc = src;
    if (this.mismatchAudio) {
      this.mismatchAudio.src = src || '/tithuh-warning-545568.mp3';
      this.mismatchAudio.load();
    } else {
      this.initMismatchAudio();
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Beep when an individual barcode is scanned
  playScanBeep() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {
      // Audio context might be restricted before interaction
    }
  }

  // Pleasant chime when HU1 and HU2 match perfectly
  playMatchSuccess() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Two-tone rising harmonic chime
      const frequencies = [587.33, 880, 1174.66]; // D5, A5, D6
      frequencies.forEach((freq, index) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + index * 0.09);

        gain.gain.setValueAtTime(0.2, now + index * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.09 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + index * 0.09);
        osc.stop(now + index * 0.09 + 0.35);
      });
    } catch {
      // Ignore audio failure
    }
  }

  // Urgent, loud warning alarm on mismatch (menggunakan suara tithuh warning)
  playMismatchAlert() {
    // 1. Coba putar audio elemen (tithuh-warning-545568.mp3 atau audio kustom)
    if (this.mismatchAudio) {
      try {
        this.mismatchAudio.currentTime = 0;
        const playPromise = this.mismatchAudio.play();
        if (playPromise) {
          playPromise.catch(() => {
            // Jika autoplay audio element dibatasi browser, putar versi synthesizer Web Audio API
            this.playSynthesizedMismatchAlert();
          });
          return;
        }
      } catch {
        // Fallback ke synthesizer
      }
    }
    this.playSynthesizedMismatchAlert();
  }

  // Synthesized warning sound cadangan (pola 2-pulse alert frekuensi tinggi-rendah 980Hz/680Hz)
  playSynthesizedMismatchAlert() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Pola alarm warning tithuh: 2 pulsa nada tinggi diikuti nada rendah
      const bursts = [
        { start: 0, highFreq: 980, lowFreq: 680, highDur: 0.12, lowDur: 0.15 },
        { start: 0.35, highFreq: 980, lowFreq: 680, highDur: 0.12, lowDur: 0.20 },
      ];

      bursts.forEach((b) => {
        if (!this.ctx) return;
        // Tone 1: High alert tone
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(b.highFreq, now + b.start);
        gain1.gain.setValueAtTime(0.3, now + b.start);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + b.start + b.highDur);
        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        osc1.start(now + b.start);
        osc1.stop(now + b.start + b.highDur);

        // Tone 2: Low alert tone
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(b.lowFreq, now + b.start + b.highDur);
        gain2.gain.setValueAtTime(0.32, now + b.start + b.highDur);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + b.start + b.highDur + b.lowDur);
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(now + b.start + b.highDur);
        osc2.stop(now + b.start + b.highDur + b.lowDur);
      });
    } catch {
      // Ignore
    }
  }

  // Continuously play mismatch alarm in loop until supervisor unlocks
  startContinuousMismatchAlert() {
    this.stopContinuousMismatchAlert();
    this.playMismatchAlert();
    this.mismatchTimer = setInterval(() => {
      this.playMismatchAlert();
    }, 900);
  }

  // Stop continuous mismatch alarm
  stopContinuousMismatchAlert() {
    if (this.mismatchTimer) {
      clearInterval(this.mismatchTimer);
      this.mismatchTimer = null;
    }
    if (this.mismatchAudio) {
      try {
        this.mismatchAudio.pause();
        this.mismatchAudio.currentTime = 0;
      } catch {
        // Ignore
      }
    }
  }

  // Unlock success sound
  playUnlockTone() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // Ignore
    }
  }
}

export const sounds = new SoundManager();
