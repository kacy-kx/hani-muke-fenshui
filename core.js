/* ============================================================
   core.js —— 与本作品共用的纯函数内核（浏览器 + Node 双用）
   所有可被断言的计算都放这里；sim.js 只做绘图与交互。
   导出：window.Core（浏览器） / module.exports（Node 测试）
   ============================================================ */
(function (root) {
  'use strict';

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const inv = (a, b, v) => (b === a ? 0 : clamp((v - a) / (b - a), 0, 1));

  /* 确定性伪随机：同一 seed 必然同一序列（可复现断言的基础） */
  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return function () {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* 平滑值噪声（用于纹理/场） */
  function noise2(seed) {
    const r = rng(seed), N = 256, g = new Float32Array(N * N);
    for (let i = 0; i < N * N; i++) g[i] = r();
    const at = (x, y) => g[(((y % N) + N) % N) * N + (((x % N) + N) % N)];
    const sm = (t) => t * t * (3 - 2 * t);
    return function (x, y) {
      const x0 = Math.floor(x), y0 = Math.floor(y);
      const fx = sm(x - x0), fy = sm(y - y0);
      return lerp(lerp(at(x0, y0), at(x0 + 1, y0), fx), lerp(at(x0, y0 + 1), at(x0 + 1, y0 + 1), fx), fy);
    };
  }

  const mean = (a) => a.reduce((s, v) => s + v, 0) / (a.length || 1);
  const stdev = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((v) => (v - m) * (v - m)))); };
  function pearson(a, b) {
    const n = Math.min(a.length, b.length); if (!n) return 0;
    const ma = mean(a.slice(0, n)), mb = mean(b.slice(0, n));
    let sa = 0, sb = 0, sab = 0;
    for (let i = 0; i < n; i++) { const da = a[i] - ma, db = b[i] - mb; sa += da * da; sb += db * db; sab += da * db; }
    const d = Math.sqrt(sa * sb); return d === 0 ? 0 : sab / d;
  }

  /* 离散傅里叶（幅度谱）——小规模够用，用于声音/声纹特征 */
  function dft(signal) {
    const n = signal.length, out = [];
    for (let k = 0; k < Math.floor(n / 2); k++) {
      let re = 0, im = 0;
      for (let t = 0; t < n; t++) {
        const ph = (2 * Math.PI * k * t) / n;
        re += signal[t] * Math.cos(ph); im -= signal[t] * Math.sin(ph);
      }
      out.push(Math.sqrt(re * re + im * im) / n);
    }
    return out;
  }
  function hann(n) { return Array.from({ length: n }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1))); }

  /* 音高与音分 */
  const hzToMidi = (hz) => 69 + 12 * Math.log2(hz / 440);
  const midiToHz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const cents = (a, b) => 1200 * Math.log2(a / b);

  /* 常用律制：五度相生（三分损益）与十二平均律 */
  function generateScale(rootHz, steps, mode) {
    // steps 为音级半音数数组；mode='et' 平均律 / 'pyth' 三分损益（五度 3:2 递推后折回八度）
    const out = [];
    for (const s of steps) {
      if (mode === 'pyth') {
        const fifth = 3 / 2;
        // 以 root 为基准，按五度链调整到最近八度
        let f = rootHz * Math.pow(fifth, s / 12 * 12 / 12); // 占位，真实律制在项目 core 中重算
        out.push(f);
      } else {
        out.push(rootHz * Math.pow(2, s / 12));
      }
    }
    return out;
  }

  /* 简易包络（ADSR），返回逐样本增益数组 */
  function adsr(n, a, d, s, r, sr) {
    const A = Math.max(1, a * sr), D = Math.max(1, d * sr), R = Math.max(1, r * sr);
    const sus = Math.max(0, n - A - D - R);
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      let v;
      if (i < A) v = i / A;
      else if (i < A + D) v = 1 - (1 - s) * ((i - A) / D);
      else if (i < A + D + sus) v = s;
      else v = s * Math.max(0, 1 - (i - A - D - sus) / R);
      out[i] = v;
    }
    return out;
  }

  /* 字符串 → 稳定哈希（用于把名称映射到视觉参数） */
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0);
  }

  const fmt = {
    num(v, d) { const p = Math.pow(10, d == null ? 2 : d); return (Math.round(v * p) / p).toFixed(d == null ? 2 : d); },
    pct(v, d) { return (v * 100).toFixed(d == null ? 0 : d) + '%'; },
    sign(v, d) { const s = fmt.num(v, d); return (v > 0 ? '+' : '') + s; },
    int(v) { return Math.round(v).toLocaleString('en-US'); }
  };

  const Core = {
    clamp, lerp, inv, rng, noise2, mean, stdev, pearson, dft, hann,
    hzToMidi, midiToHz, cents, generateScale, adsr, hash, fmt,
    VERSION: '1.0.0'
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Core;
  else root.Core = Core;
})(typeof globalThis !== 'undefined' ? globalThis : this);
