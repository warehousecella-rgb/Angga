// Web Audio API Synthesizer for reliable, zero-latency device sounds

class SoundManager {
  private ctx: AudioContext | null = null;

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

  private mismatchTimer: ReturnType<typeof setInterval> | null = null;

  // Urgent, loud warning alarm on mismatch
  playMismatchAlert() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // 3 rapid pulsing harsh sawtooth wave alerts
      for (let i = 0; i < 3; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now + i * 0.16);
        osc.frequency.linearRampToValueAtTime(220, now + i * 0.16 + 0.12);

        gain.gain.setValueAtTime(0.35, now + i * 0.16);
        gain.gain.linearRampToValueAtTime(0.01, now + i * 0.16 + 0.13);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.16);
        osc.stop(now + i * 0.16 + 0.14);
      }
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
    }, 650);
  }

  // Stop continuous mismatch alarm
  stopContinuousMismatchAlert() {
    if (this.mismatchTimer) {
      clearInterval(this.mismatchTimer);
      this.mismatchTimer = null;
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
