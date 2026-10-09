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
        audio.src = this.customAudioSrc || '/warning.mp3?v=executive-alert-v3';
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
      this.mismatchAudio.src = src || '/warning.mp3?v=executive-alert-v3';
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

  // Urgent, loud warning alarm on mismatch (menggunakan suara warning terlampir)
  playMismatchAlert() {
    if (this.mismatchAudio) {
      try {
        this.mismatchAudio.loop = false;
        this.mismatchAudio.currentTime = 0;
        const playPromise = this.mismatchAudio.play();
        if (playPromise) {
          playPromise.catch(() => {
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

  // Synthesized warning sound cadangan: Pola Executive Industrial Error Chime (Dual-Pulse Harminized Alert)
  playSynthesizedMismatchAlert() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Pulse 1: Urgent Warning Note (F5 + C6 + G#5) - t=0s
      // Pulse 2: Authoritative Deep Error Body (C#5 + G#4 + F4) - t=0.28s
      const strikes = [
        {
          time: 0,
          partials: [
            { freq: 698.46, gain: 0.35, decay: 0.28, type: 'sine' as OscillatorType },
            { freq: 1046.50, gain: 0.18, decay: 0.22, type: 'sine' as OscillatorType },
            { freq: 830.61, gain: 0.22, decay: 0.25, type: 'sine' as OscillatorType },
            { freq: 349.23, gain: 0.20, decay: 0.32, type: 'triangle' as OscillatorType },
          ],
        },
        {
          time: 0.28,
          partials: [
            { freq: 554.37, gain: 0.38, decay: 0.42, type: 'sine' as OscillatorType },
            { freq: 415.30, gain: 0.28, decay: 0.45, type: 'sine' as OscillatorType },
            { freq: 277.18, gain: 0.25, decay: 0.50, type: 'triangle' as OscillatorType },
            { freq: 830.61, gain: 0.12, decay: 0.25, type: 'sine' as OscillatorType },
          ],
        },
      ];

      strikes.forEach(({ time, partials }) => {
        if (!this.ctx) return;
        const t0 = now + time;

        partials.forEach((p) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = p.type;
          osc.frequency.setValueAtTime(p.freq, t0);

          gain.gain.setValueAtTime(0.001, t0);
          gain.gain.exponentialRampToValueAtTime(p.gain, t0 + 0.008);
          gain.gain.exponentialRampToValueAtTime(0.001, t0 + p.decay);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(t0);
          osc.stop(t0 + p.decay);
        });
      });
    } catch {
      // Ignore
    }
  }

  // Continuously play mismatch alarm in loop until supervisor unlocks
  startContinuousMismatchAlert() {
    this.stopContinuousMismatchAlert();
    if (this.mismatchAudio) {
      try {
        this.mismatchAudio.loop = true;
        this.mismatchAudio.currentTime = 0;
        const p = this.mismatchAudio.play();
        if (p) {
          p.catch(() => {
            this.playSynthesizedMismatchAlert();
            this.mismatchTimer = setInterval(() => {
              this.playSynthesizedMismatchAlert();
            }, 1400);
          });
        }
        return;
      } catch {
        // Fallback
      }
    }
    this.playSynthesizedMismatchAlert();
    this.mismatchTimer = setInterval(() => {
      this.playSynthesizedMismatchAlert();
    }, 1400);
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
        this.mismatchAudio.loop = false;
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
