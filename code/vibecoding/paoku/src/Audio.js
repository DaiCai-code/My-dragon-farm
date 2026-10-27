// 极简音效：用 WebAudio 现场合成，不需要任何音频文件
export class AudioManager {
  constructor() {
    this.ctx = null;
  }

  // 首次用户操作时初始化（浏览器要求用户手势后才能播放声音）
  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }

    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      this.ctx = new AudioContextClass();
    } catch {
      this.ctx = null;
    }
  }

  // 播放一个带频率滑动的短音
  tone({ freq, freqEnd, duration, type = 'sine', volume = 0.08 }) {
    if (!this.ctx) return;

    const ctx = this.ctx;
    const start = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(1, freqEnd),
        start + duration
      );
    }

    // 音量包络：快速起音，缓慢衰减到接近 0
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  coin() {
    this.tone({ freq: 1050, freqEnd: 1500, duration: 0.08, volume: 0.05 });
  }

  jump() {
    this.tone({
      freq: 300,
      freqEnd: 640,
      duration: 0.15,
      type: 'triangle',
      volume: 0.06,
    });
  }

  slide() {
    this.tone({
      freq: 260,
      freqEnd: 90,
      duration: 0.18,
      type: 'triangle',
      volume: 0.05,
    });
  }

  crash() {
    this.tone({
      freq: 160,
      freqEnd: 40,
      duration: 0.45,
      type: 'sawtooth',
      volume: 0.12,
    });
  }
}
