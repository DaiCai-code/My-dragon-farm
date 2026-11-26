/* 赛博贪吃蛇：音频层——全部用 WebAudio 实时合成，不依赖任何音频文件 */
(function (W) {
  'use strict';

  function AudioManager() {
    this.ctx = null; // AudioContext，首次用户手势后才创建
    this.master = null; // 总线
    this.volume = 0.6; // 总音量
    this.drone = null; // 背景持续音
    this.muted = W.store.get(W.MUTE_KEY, '0') === '1';
  }

  // 初始化音频上下文。
  // 浏览器要求用户先有交互，否则音频不会响，所以这里延迟到第一次点击/按键时才建。
  AudioManager.prototype.init = function () {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }

    var Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;

    try {
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : this.volume;
      this.master.connect(this.ctx.destination);
    } catch (e) {
      this.ctx = null; // 环境不支持就静音运行，不影响游戏
    }
  };

  // ===== 静音 =====

  AudioManager.prototype.setMuted = function (muted) {
    this.muted = muted;
    W.store.set(W.MUTE_KEY, muted ? '1' : '0');
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : this.volume, this.ctx.currentTime, 0.02);
    }
    if (muted) this.stopDrone();
  };

  AudioManager.prototype.toggleMute = function () {
    this.setMuted(!this.muted);
    return this.muted;
  };

  // ===== 基础音源 =====

  // 带频率滑动的短音
  AudioManager.prototype.tone = function (opts) {
    if (!this.ctx || this.muted) return;

    var ctx = this.ctx;
    var start = ctx.currentTime + (opts.delay || 0);
    var duration = opts.duration || 0.1;

    var osc = ctx.createOscillator();
    var gain = ctx.createGain();

    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(opts.freq, start);
    if (opts.freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.freqEnd), start + duration);
    }

    // 快速起音，指数衰减到接近 0
    var vol = opts.volume || 0.08;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(vol, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(gain).connect(this.master);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  };

  // 噪声爆裂（死亡、故障用）
  AudioManager.prototype.noise = function (opts) {
    if (!this.ctx || this.muted) return;

    var ctx = this.ctx;
    var duration = opts.duration || 0.3;
    var start = ctx.currentTime + (opts.delay || 0);

    var frames = Math.max(1, Math.floor(ctx.sampleRate * duration));
    var buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < frames; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / frames); // 噪声 + 线性衰减
    }

    var src = ctx.createBufferSource();
    src.buffer = buffer;

    var filter = ctx.createBiquadFilter();
    filter.type = opts.filter || 'lowpass';
    filter.frequency.setValueAtTime(opts.freq || 1200, start);
    if (opts.freqEnd) {
      filter.frequency.exponentialRampToValueAtTime(Math.max(40, opts.freqEnd), start + duration);
    }

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(opts.volume || 0.1, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    src.connect(filter).connect(gain).connect(this.master);
    src.start(start);
    src.stop(start + duration + 0.02);
  };

  // 琶音：几个音依次响起
  AudioManager.prototype.arp = function (opts) {
    var freqs = opts.freqs || [];
    var step = opts.step || 0.09;
    for (var i = 0; i < freqs.length; i++) {
      this.tone({
        freq: freqs[i],
        duration: opts.duration || 0.12,
        type: opts.type || 'triangle',
        volume: opts.volume || 0.06,
        delay: i * step
      });
    }
  };

  // ===== 背景持续音 =====

  // 两个失谐锯齿波过一个低通，再让截止频率被慢 LFO 推着走
  AudioManager.prototype.startDrone = function () {
    if (!this.ctx || this.muted || this.drone) return;

    var ctx = this.ctx;
    var gain = ctx.createGain();
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(0.035, ctx.currentTime, 1.5); // 慢慢淡入

    var filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;
    filter.Q.value = 6;

    var oscA = ctx.createOscillator();
    oscA.type = 'sawtooth';
    oscA.frequency.value = 55;

    var oscB = ctx.createOscillator();
    oscB.type = 'sawtooth';
    oscB.frequency.value = 55.6; // 轻微失谐，产生缓慢的拍频

    var lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    var lfoGain = ctx.createGain();
    lfoGain.gain.value = 180;
    lfo.connect(lfoGain).connect(filter.frequency);

    oscA.connect(filter);
    oscB.connect(filter);
    filter.connect(gain).connect(this.master);
    oscA.start();
    oscB.start();
    lfo.start();

    this.drone = { oscA: oscA, oscB: oscB, lfo: lfo, gain: gain };
  };

  AudioManager.prototype.stopDrone = function () {
    if (!this.drone || !this.ctx) return;

    var drone = this.drone;
    this.drone = null;

    try {
      drone.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
      var stopAt = this.ctx.currentTime + 1;
      drone.oscA.stop(stopAt);
      drone.oscB.stop(stopAt);
      drone.lfo.stop(stopAt);
    } catch (e) {
      // 已经停过了，忽略
    }
  };

  // ===== 游戏音效 =====

  // 吃数据点：连击越高音调越高（每级升半音）
  AudioManager.prototype.eat = function (combo) {
    var shift = Math.pow(2, (combo - 1) / 12);
    this.tone({
      freq: 440 * shift,
      freqEnd: 880 * shift,
      duration: 0.08,
      type: 'square',
      volume: 0.05
    });
  };

  AudioManager.prototype.levelUp = function () {
    this.arp({ freqs: [523, 659, 784], step: 0.07, duration: 0.12, type: 'triangle', volume: 0.05 });
  };

  AudioManager.prototype.die = function () {
    this.tone({ freq: 180, freqEnd: 40, duration: 0.5, type: 'sawtooth', volume: 0.12 });
    this.noise({ duration: 0.45, volume: 0.13, freq: 2400, freqEnd: 120 });
  };

  AudioManager.prototype.start = function () {
    this.arp({ freqs: [392, 523], step: 0.08, duration: 0.14, type: 'square', volume: 0.05 });
  };

  AudioManager.prototype.pause = function () {
    this.tone({ freq: 660, duration: 0.09, type: 'sine', volume: 0.05 });
  };

  AudioManager.prototype.resume = function () {
    this.tone({ freq: 880, duration: 0.09, type: 'sine', volume: 0.05 });
  };

  AudioManager.prototype.click = function () {
    this.tone({ freq: 1200, freqEnd: 1600, duration: 0.05, type: 'square', volume: 0.035 });
  };

  AudioManager.prototype.newRecord = function () {
    this.arp({ freqs: [523, 659, 784, 1046], step: 0.1, duration: 0.16, type: 'triangle', volume: 0.06 });
  };

  W.AudioManager = AudioManager;
})(globalThis.SNAKE = globalThis.SNAKE || {});
