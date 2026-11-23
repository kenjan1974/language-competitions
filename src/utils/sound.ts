// Web Audio API 合成音效工具（零外部音檔依賴，支援 iPad Safari 自動解鎖）

class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  /** 清脆答對音 + 依 Combo 升調 */
  public playCorrect(combo: number = 1) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // 依連擊數微幅升調 (最高到 5x)
    const clampedCombo = Math.min(Math.max(combo, 1), 6);
    const pitchMultiplier = 1 + (clampedCombo - 1) * 0.08;

    const notes = [523.25 * pitchMultiplier, 659.25 * pitchMultiplier, 783.99 * pitchMultiplier];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.065);

      gain.gain.setValueAtTime(0.001, now + idx * 0.065);
      gain.gain.exponentialRampToValueAtTime(0.22, now + idx * 0.065 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.065 + 0.24);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.065);
      osc.stop(now + idx * 0.065 + 0.25);
    });
  }

  /** 答錯提示音（柔和低音提示，不刺耳） */
  public playWrong() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [300, 220];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);

      gain.gain.setValueAtTime(0.001, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.15, now + idx * 0.14 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.24);
    });
  }

  /** 輕快點擊音 */
  public playClick() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.04);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.055);
  }

  /** 孵蛋破殼 / 進化 / 過關慶祝音效 */
  public playFanfare() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // C5 - E5 - G5 - C6 琶音
    const notes = [
      { freq: 523.25, delay: 0, duration: 0.14 },
      { freq: 659.25, delay: 0.11, duration: 0.14 },
      { freq: 783.99, delay: 0.22, duration: 0.14 },
      { freq: 1046.5, delay: 0.33, duration: 0.45 }
    ];

    notes.forEach(({ freq, delay, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0.001, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.25, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + duration + 0.02);
    });
  }

  /** 餵食神獸或神獸撒嬌音效 */
  public playCuteChirp() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.22);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  /** 撫摸神獸撒嬌（溫柔雙連啾啾聲） */
  public playPetPurr() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const chirps = [
      { start: 0, f1: 620, f2: 920 },
      { start: 0.13, f1: 740, f2: 1120 }
    ];
    chirps.forEach(({ start, f1, f2 }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f1, now + start);
      osc.frequency.exponentialRampToValueAtTime(f2, now + start + 0.09);

      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.18, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + 0.15);
    });
  }

  /** 餵食靈氣牧草（可愛咬嚼 + 吸收光點音效） */
  public playFeedCrunch() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const pops = [
      { delay: 0, freq: 380, endFreq: 520, dur: 0.07 },
      { delay: 0.09, freq: 440, endFreq: 620, dur: 0.07 },
      { delay: 0.19, freq: 660, endFreq: 990, dur: 0.16 }
    ];
    pops.forEach(({ delay, freq, endFreq, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + delay);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + delay + dur);

      gain.gain.setValueAtTime(0.001, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.2, now + delay + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + dur + 0.02);
    });
  }

  /** 奇獸升級成功（RPG 經典上升星光音效） */
  public playLevelUp() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 523.25, delay: 0, dur: 0.11 },
      { freq: 587.33, delay: 0.09, dur: 0.11 },
      { freq: 659.25, delay: 0.18, dur: 0.11 },
      { freq: 783.99, delay: 0.27, dur: 0.13 },
      { freq: 1046.5, delay: 0.39, dur: 0.45 },
      { freq: 1318.51, delay: 0.48, dur: 0.5 }
    ];

    notes.forEach(({ freq, delay, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0.001, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.22, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + dur + 0.02);
    });
  }

  /** 挑戰通關成功凱旋號角 */
  public playVictoryFanfare() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 523.25, delay: 0, dur: 0.12 },
      { freq: 659.25, delay: 0.1, dur: 0.12 },
      { freq: 783.99, delay: 0.2, dur: 0.12 },
      { freq: 1046.5, delay: 0.32, dur: 0.22 },
      { freq: 783.99, delay: 0.52, dur: 0.12 },
      { freq: 1046.5, delay: 0.64, dur: 0.55 }
    ];

    notes.forEach(({ freq, delay, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0.001, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.24, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + dur + 0.03);
    });
  }

  /** 挑戰失敗柔和下行音效（明確辨識但不刺耳） */
  public playDefeat() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 392.0, delay: 0, dur: 0.2 },     // G4
      { freq: 369.99, delay: 0.2, dur: 0.2 },  // F#4
      { freq: 349.23, delay: 0.4, dur: 0.2 },  // F4
      { freq: 311.13, delay: 0.6, dur: 0.55 }  // Eb4
    ];

    notes.forEach(({ freq, delay, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);
      if (delay === 0.6) {
        osc.frequency.exponentialRampToValueAtTime(280, now + delay + dur);
      }

      gain.gain.setValueAtTime(0.001, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.2, now + delay + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + dur + 0.03);
    });
  }

  /** 出戰夥伴發動連擊護盾阻擋音效 */
  public playShieldBlock() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [587.33, 880, 1174.66];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.045);

      gain.gain.setValueAtTime(0.001, now + idx * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.2, now + idx * 0.045 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.045);
      osc.stop(now + idx * 0.045 + 0.3);
    });
  }

  /** 戰損降級警告音效（重擊 + 階梯滑落音） */
  public playBeastLevelDown() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 330, delay: 0, dur: 0.14, type: 'sawtooth' as OscillatorType },
      { freq: 277.18, delay: 0.13, dur: 0.14, type: 'sawtooth' as OscillatorType },
      { freq: 220, delay: 0.26, dur: 0.18, type: 'sawtooth' as OscillatorType },
      { freq: 164.81, delay: 0.42, dur: 0.45, type: 'triangle' as OscillatorType }
    ];

    notes.forEach(({ freq, delay, dur, type }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + delay);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.88, now + delay + dur);

      gain.gain.setValueAtTime(0.001, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.22, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + dur + 0.03);
    });
  }

  /** 奇獸陣亡消滅震撼音效（低頻碎裂雷鳴 + 消散音） */
  public playBeastDestroyed() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 246.94, delay: 0, dur: 0.16, type: 'sawtooth' as OscillatorType },
      { freq: 185.0, delay: 0.15, dur: 0.18, type: 'sawtooth' as OscillatorType },
      { freq: 138.59, delay: 0.32, dur: 0.22, type: 'sawtooth' as OscillatorType },
      { freq: 98.0, delay: 0.52, dur: 0.65, type: 'sawtooth' as OscillatorType }
    ];

    notes.forEach(({ freq, delay, dur, type }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + delay);
      osc.frequency.exponentialRampToValueAtTime(Math.max(45, freq * 0.72), now + delay + dur);

      gain.gain.setValueAtTime(0.001, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.25, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + dur + 0.03);
    });
  }
}

export const sound = new SoundManager();
