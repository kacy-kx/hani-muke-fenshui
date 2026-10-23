/* ============================================================
   bench.js —— 《木刻分水》推演台：把名义分配推向真实到田
   依赖：core.js / algo.js / engine.js；UI 由 app.js 的 renderers.sim 挂载。
   五个页面共用一块画布与一块控制面板：
     到田 Get        名义分配 → 距离衰减 + 渗漏回归 → 真实到田
     稳健 Robust     Monte Carlo：结论是站得住还是凑出来的
     私刻口 Tamper   把刻口凿宽，这笔账怎么算
     推荐 Advice     多准则 TOPSIS：给什么权重就有什么答案
     灌溉期 Season   雨季有雨、旱季要轮的 120 天
   ============================================================ */
(function () {
  'use strict';
  const L = window.LEDGER;
  const E = window.MUKE;
  const K = window.Core;
  const SIM = window.SIM = window.SIM || {};

  const RULES = [
    { id: 'area', zh: '按亩分配', en: 'By area', c: 'a1' },
    { id: 'household', zh: '按户均分', en: 'By household', c: 'a2' },
    { id: 'rotation', zh: '按时段轮灌', en: 'By rotation', c: 'a3' }
  ];
  const LIN = ['earth', 'stone', 'wood'];
  const B = {
    zh: {
      chain: '到田', robust: '稳健', tamper: '私刻口', advice: '推荐', season: '灌溉期',
      rule: '分水规则', scen: '村寨与来水', chainOpt: '输水链参数',
      lining: '沟渠衬砌', reach: '相邻户渠长', reuse: '渗漏回归率', order: '取水次序',
      up: '上游先取', down: '下游先取', fieldEff: '田间水利用系数',
      nom: '名义', got: '到田', exportCsv: '导出本页 CSV', copyLink: '复制参数链接',
      metric: '观察指标', draws: '抽样次数', jitter: '扰动幅度', winrate: '各规则胜出率',
      target: '谁动了手', amount: '凿宽幅度', adviceW: '准则权重',
      fair: '亩均公平', met: '需求满足', gap: '缺口少', loss: '渗漏少',
      days: '灌溉期天数', peak: '雨季峰位', floor: '旱季下限', peakGain: '雨季峰值'
    },
    en: {
      chain: 'Delivery', robust: 'Robust', tamper: 'Tamper', advice: 'Advice', season: 'Season',
      rule: 'Rule', scen: 'Village & supply', chainOpt: 'Conveyance',
      lining: 'Lining', reach: 'Reach between plots', reuse: 'Reuse of seepage', order: 'Draw order',
      up: 'Upstream first', down: 'Downstream first', fieldEff: 'Field efficiency',
      nom: 'Nominal', got: 'Delivered', exportCsv: 'Export CSV', copyLink: 'Copy link',
      metric: 'Metric', draws: 'Draws', jitter: 'Jitter', winrate: 'Win rate',
      target: 'Who widened', amount: 'Widened by', adviceW: 'Weights',
      fair: 'Per-mu equity', met: 'Demand met', gap: 'Low gap', loss: 'Low loss',
      days: 'Season days', peak: 'Rainy peak', floor: 'Dry floor', peakGain: 'Rainy gain'
    }
  };

  /* ---------- 通用小工具 ---------- */
  function rowsToCsv(head, rows) {
    return '\ufeff' + [head.join(',')].concat(rows.map((r) => r.map((c) => (typeof c === 'number' ? c : '"' + String(c).replace(/"/g, '""') + '"')).join(','))).join('\r\n');
  }
  function download(name, text) {
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  /* ============================================================
     画布绘制：每页一个 painter(ctx, w, h, st, lift)
     ============================================================ */
  function bg(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0a0c10'); g.addColorStop(1, '#101318');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }
  function title(ctx, x, y, s) {
    ctx.fillStyle = 'rgba(255,255,255,.42)';
    ctx.font = '10px system-ui,sans-serif';
    ctx.fillText(s, x, y);
  }
  function lab(ctx, x, y, s, col, size) {
    ctx.fillStyle = col || 'rgba(255,255,255,.5)';
    ctx.font = (size || 8.5) + 'px ui-monospace,monospace';
    ctx.fillText(s, x, y);
  }

  /* ---------- 页 1：到田 ---------- */
  function drawChain(ctx, w, h, st, P, T) {
    const scene = st.scene;
    const c = st.model.chain;
    const rows = c.rows;
    const col = P[RULES.find((r) => r.id === st.rule).c];

    title(ctx, 26, 20, T.chain + ' · 名义 ' + T.nom + ' → 到田 ' + T.got);

    /* 上：输水链剖面 —— 横轴为里程，每户一个田块 */
    const px = 34, pw = w - 68, py = 34, ph = Math.max(70, h * 0.30);
    const maxDist = rows.length ? rows[rows.length - 1].dist : 1;
    const X = (d) => px + (d / maxDist) * pw;
    /* 渠道基线（自左向右略微下沉，示意高程差） */
    ctx.strokeStyle = 'rgba(160,200,220,.35)'; ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let x = 0; x <= pw; x += 6) {
      const y = py + ph - 6 - (x / pw) * ph * 0.16;
      x === 0 ? ctx.moveTo(px + x, y) : ctx.lineTo(px + x, y);
    }
    ctx.stroke();
    const maxArea = Math.max.apply(null, rows.map((r) => r.area)) || 1;
    rows.forEach((r) => {
      const x = X(r.dist);
      const bh = (r.area / maxArea) * ph * 0.5;
      const y0 = py + ph - 8 - (r.dist / maxDist) * ph * 0.16;
      /* 田块 */
      ctx.fillStyle = 'rgba(120,170,150,.20)';
      ctx.fillRect(x - 9, y0 - bh, 18, bh);
      ctx.strokeStyle = 'rgba(160,200,180,.5)'; ctx.lineWidth = 1;
      ctx.strokeRect(x - 9, y0 - bh, 18, bh);
      /* 到田率柱：delivered / alloc */
      const ratio = r.alloc > 0 ? r.delivered / r.alloc : 0;
      ctx.fillStyle = col; ctx.globalAlpha = 0.85;
      ctx.fillRect(x - 6, y0 + 2, 12, Math.max(1, (1 - ratio) * -14));
      ctx.globalAlpha = 1;
      lab(ctx, x - 8, y0 + 16, r.id.slice(1), 'rgba(255,255,255,.45)');
      lab(ctx, x - 9, y0 - bh - 4, r.area.toFixed(1), 'rgba(255,255,255,.3)');
    });
    lab(ctx, px, py + ph + 30, '水源 →', 'rgba(160,200,220,.5)');
    lab(ctx, px + pw - 30, py + ph + 30, '→ 沟尾', 'rgba(255,255,255,.35)');

    /* 下：每户 名义 vs 到田 双条 */
    const by = py + ph + 46;
    const bh2 = Math.max(60, h - by - 30);
    const bw = (w - 68) / rows.length;
    const maxV = Math.max.apply(null, rows.map((r) => Math.max(r.alloc, r.delivered, r.demand))) * 1.1 || 1;
    title(ctx, 26, by - 6, '每户：浅色 = 名义份额，实色 = 到田水量，虚框 = 需水');
    rows.forEach((r, i) => {
      const x = px + i * bw + bw * 0.18, ww = bw * 0.64;
      const base = by + bh2;
      const hN = (r.alloc / maxV) * bh2, hD = (r.delivered / maxV) * bh2, hM = (r.demand / maxV) * bh2;
      /* 名义 */
      ctx.fillStyle = 'rgba(255,255,255,.22)';
      ctx.fillRect(x, base - hN, ww, hN);
      /* 到田 */
      ctx.fillStyle = col;
      ctx.fillRect(x, base - hD, ww, hD);
      /* 名义与到田的差额（渗漏与短缺） */
      if (hN - hD > 0.5) {
        ctx.fillStyle = '#c2564a'; ctx.globalAlpha = 0.75;
        ctx.fillRect(x, base - hN, ww, hN - hD); ctx.globalAlpha = 1;
      }
      /* 需求虚框 */
      ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(x, base - hM, ww, hM);
      ctx.setLineDash([]);
      lab(ctx, x + ww / 2 - 8, base + 12, r.id.slice(1));
      lab(ctx, x + ww / 2 - 14, base + 23, r.perMu.toFixed(0), 'rgba(255,255,255,.4)');
    });
    lab(ctx, px, by + bh2 + 38, '户号 / 到田亩均 m³', 'rgba(255,255,255,.3)');
  }

  /* ---------- 页 2：稳健 ---------- */
  function drawRobust(ctx, w, h, st, P, T) {
    const mc = st.model.mc;
    const keys = RULES.map((r) => r.id);
    title(ctx, 26, 20, T.robust + ' · Monte Carlo N=' + mc.N + ' · ' + T.metric);

    const px = 60, pw = w - 100, py = 46, ph = Math.max(90, h * 0.52);
    const metric = st.mcMetric;
    const all = [];
    keys.forEach((k) => { const s = mc.stats[k][metric]; [s.p5, s.p95].forEach((v) => all.push(v)); });
    const lo = Math.max(0, Math.min.apply(null, all) * 0.94);
    const hi = Math.max.apply(null, all) * 1.06 || 1;
    const Y = (v) => py + ph - ((v - lo) / (hi - lo || 1)) * ph;

    /* 网格 */
    ctx.strokeStyle = 'rgba(255,255,255,.08)';
    for (let i = 0; i <= 4; i++) {
      const y = py + (i / 4) * ph;
      ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px + pw, y); ctx.stroke();
      lab(ctx, 10, y + 3, (lo + (hi - lo) * (1 - i / 4)).toFixed(metric === 'gapTotal' ? 0 : 3), 'rgba(255,255,255,.35)');
    }
    /* 三个规则的箱 */
    const slot = pw / keys.length;
    keys.forEach((k, i) => {
      const s = mc.stats[k][metric];
      const cx = px + slot * i + slot * 0.5;
      const col = P[RULES[i].c];
      const bwd = slot * 0.34;
      /* p5-p95 细线 */
      ctx.strokeStyle = col; ctx.globalAlpha = 0.4; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx, Y(s.p5)); ctx.lineTo(cx, Y(s.p95)); ctx.stroke();
      /* p25-p75 箱 */
      ctx.globalAlpha = 0.30;
      ctx.fillStyle = col;
      ctx.fillRect(cx - bwd / 2, Y(s.p75), bwd, Math.max(1, Y(s.p25) - Y(s.p75)));
      /* 中位数 */
      ctx.globalAlpha = 1; ctx.strokeStyle = col; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(cx - bwd / 2, Y(s.p50)); ctx.lineTo(cx + bwd / 2, Y(s.p50)); ctx.stroke();
      lab(ctx, cx - 16, py + ph + 16, RULES[i].zh, 'rgba(255,255,255,.55)', 9.5);
      lab(ctx, cx - 20, py + ph + 29, s.p50.toFixed(metric === 'gapTotal' ? 0 : 3), col, 9.5);
    });

    /* 下：胜出率条 */
    const by = py + ph + 52;
    title(ctx, 26, by, T.winrate);
    const sets = [['giniPerMu', '亩均最公平 most equitable'], ['demandMet', '满足率最高 best served']];
    const barH = 14, gapPd = 12;
    const maxW = w - 190;
    sets.forEach(([key, name], gi) => {
      const yy = by + 14 + gi * (barH * keys.length + gapPd * 2);
      lab(ctx, 26, yy + 2, name, 'rgba(255,255,255,.45)');
      keys.forEach((k, i) => {
        const v = mc.winRate[key][k] || 0;
        const y2 = yy + 12 + i * (barH + 5);
        ctx.fillStyle = 'rgba(255,255,255,.10)';
        ctx.fillRect(150, y2, maxW, barH - 4);
        ctx.fillStyle = P[RULES[i].c]; ctx.globalAlpha = 0.85;
        ctx.fillRect(150, y2, maxW * v, barH - 4);
        ctx.globalAlpha = 1;
        lab(ctx, 26, y2 + 10, RULES[i].zh, 'rgba(255,255,255,.5)');
        lab(ctx, 150 + maxW + 6, y2 + 10, (v * 100).toFixed(0) + '%', P[RULES[i].c]);
      });
    });
  }

  /* ---------- 页 3：私刻口 ---------- */
  function drawTamper(ctx, w, h, st, P, T) {
    const tp = st.model.tamper;
    const rows = tp.rows;
    title(ctx, 26, 20, T.tamper + ' · ' + tp.targetId + ' 凿宽 ' + (tp.delta * 100).toFixed(0) + '%');

    const px = 34, pw = w - 68, py = 40, ph = Math.max(70, h * 0.46);
    const bw = pw / rows.length;
    const mv = Math.max.apply(null, rows.map((r) => Math.max(r.before, r.after))) * 1.12 || 1;
    const base = py + ph;
    title(ctx, 26, py - 6, '浅色 = 原份额，实色 = 被侵占后的份额');
    rows.forEach((r, i) => {
      const x = px + i * bw + bw * 0.2, ww = bw * 0.6;
      const isT = r.id === tp.targetId;
      const hB = (r.before / mv) * ph, hA = (r.after / mv) * ph;
      ctx.fillStyle = 'rgba(255,255,255,.20)';
      ctx.fillRect(x, base - hB, ww, hB);
      ctx.fillStyle = isT ? '#c2564a' : P.a2;
      if (isT) ctx.globalAlpha = 0.92;
      ctx.fillRect(x, base - hA, ww, hA);
      ctx.globalAlpha = 1;
      /* 增减箭头 */
      const dy = base - hA - 6;
      if (r.diff >= 0) {
        ctx.fillStyle = '#c2564a';
        ctx.beginPath(); ctx.moveTo(x + ww / 2 - 4, dy); ctx.lineTo(x + ww / 2 + 4, dy); ctx.lineTo(x + ww / 2, dy - 6); ctx.closePath(); ctx.fill();
      } else {
        ctx.fillStyle = P.a2;
        ctx.beginPath(); ctx.moveTo(x + ww / 2 - 4, dy - 6); ctx.lineTo(x + ww / 2 + 4, dy - 6); ctx.lineTo(x + ww / 2, dy); ctx.closePath(); ctx.fill();
      }
      lab(ctx, x + ww / 2 - 9, base + 13, r.id.slice(1), isT ? '#e2796d' : 'rgba(255,255,255,.5)');
      lab(ctx, x + ww / 2 - 16, base + 24, (r.diffPct * 100).toFixed(1) + '%', isT ? '#e2796d' : 'rgba(255,255,255,.38)');
    });

    /* 下：木刻板，被凿宽的口高亮 */
    const by = py + ph + 46;
    const bh = Math.max(40, Math.min(84, h - by - 26));
    const gw = ctx.createLinearGradient(0, by, 0, by + bh);
    gw.addColorStop(0, '#4a3a2a'); gw.addColorStop(0.5, '#6b5237'); gw.addColorStop(1, '#372b1f');
    ctx.fillStyle = gw; ctx.fillRect(px, by, pw, bh);
    let cx = px + 2;
    tp.plan.forEach((p) => {
      const nw = Math.max(4, (p.now / tp.boardWidthAfter) * (pw - 4) - 2);
      ctx.fillStyle = '#0b1a24';
      ctx.fillRect(cx, by, nw, bh);
      if (p.widened) {
        const extra = Math.max(1, nw * (tp.delta / (1 + tp.delta)));
        ctx.fillStyle = 'rgba(194,86,74,.55)';
        ctx.fillRect(cx + nw - extra, by, extra, bh);
        ctx.strokeStyle = '#c2564a'; ctx.lineWidth = 1.4;
        ctx.strokeRect(cx, by, nw, bh);
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 1;
        ctx.strokeRect(cx, by, nw, bh);
      }
      lab(ctx, cx + 2, by + bh + 12, (p.now * 1000).toFixed(1), p.widened ? '#e2796d' : 'rgba(240,236,228,.5)');
      cx += nw + 2;
    });
    lab(ctx, px + pw - 18, by + bh + 12, 'mm', 'rgba(255,255,255,.35)');
    title(ctx, 26, by - 6, '刻口宽度（红 = 被凿宽的部分，' + tp.detect.note + '）');
  }

  /* ---------- 页 4：推荐 ---------- */
  function drawAdvice(ctx, w, h, st, P, T) {
    const rc = st.model.advice;
    title(ctx, 26, 20, T.advice + ' · TOPSIS');

    /* 左：雷达 */
    const cx = w * 0.30, cy = h * 0.50, rad = Math.min(w * 0.22, h * 0.34);
    const keys = ['fair', 'met', 'gap', 'loss'];
    const names = [T.fair, T.met, T.gap, T.loss];
    /* 每个判据在三个规则中的最优/最差，用于归一 */
    const norm = {};
    keys.forEach((k) => {
      const vals = rc.raw.map((r) => r[k]);
      const mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);
      const better = k === 'met' ? 'max' : 'min';
      norm[k] = vals.map((v) => {
        if (mx - mn < 1e-9) return 1;
        return better === 'max' ? (v - mn) / (mx - mn) : (mx - v) / (mx - mn);
      });
    });
    ctx.strokeStyle = 'rgba(255,255,255,.10)';
    for (let ring = 1; ring <= 4; ring++) {
      ctx.beginPath();
      keys.forEach((k, i) => {
        const a = -Math.PI / 2 + (i / keys.length) * Math.PI * 2;
        const rr = rad * (ring / 4);
        const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.closePath(); ctx.stroke();
    }
    keys.forEach((k, i) => {
      const a = -Math.PI / 2 + (i / keys.length) * Math.PI * 2;
      ctx.strokeStyle = 'rgba(255,255,255,.12)';
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); ctx.stroke();
      lab(ctx, cx + Math.cos(a) * (rad + 12) - 14, cy + Math.sin(a) * (rad + 12) + 3, names[i], 'rgba(255,255,255,.5)', 9.5);
    });
    RULES.forEach((R, ri) => {
      ctx.beginPath();
      keys.forEach((k, i) => {
        const a = -Math.PI / 2 + (i / keys.length) * Math.PI * 2;
        const v = Math.max(0.05, norm[k][ri]);
        const rr = rad * v;
        const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = P[R.c]; ctx.globalAlpha = 0.14; ctx.fill();
      ctx.strokeStyle = P[R.c]; ctx.lineWidth = 2; ctx.globalAlpha = ri === 0 ? 1 : 0.7; ctx.stroke();
      ctx.globalAlpha = 1;
    });

    /* 右：得分条 */
    const bx = w * 0.56, bwMax = w - bx - 40;
    title(ctx, bx, 40, '综合得分 / score');
    rc.rank.forEach((r, i) => {
      const R = RULES.find((x) => x.id === r.rule);
      const y = 66 + i * 30;
      ctx.fillStyle = 'rgba(255,255,255,.10)';
      ctx.fillRect(bx, y, bwMax, 16);
      ctx.fillStyle = P[R.c]; ctx.globalAlpha = 0.9;
      ctx.fillRect(bx, y, bwMax * r.score, 16);
      ctx.globalAlpha = 1;
      lab(ctx, bx, y - 5, (i + 1) + '. ' + R.zh, 'rgba(255,255,255,.65)', 10.5);
      lab(ctx, bx + 2, y + 12, r.score.toFixed(3), 'rgba(255,255,255,.85)', 10);
    });
    title(ctx, bx, 66 + rc.rank.length * 30 + 20, '结论 / verdict');
    lab(ctx, bx, 66 + rc.rank.length * 30 + 38, rc.swingNote, 'rgba(217,176,97,.85)', 10.5);
    lab(ctx, bx, 66 + rc.rank.length * 30 + 55, '当前权重下最优：' + (RULES.find((x) => x.id === rc.best) || {}).zh, P.a3, 11);
  }

  /* ---------- 页 5：灌溉期 ---------- */
  function drawSeason(ctx, w, h, st, P, T) {
    const ss = st.model.season;
    const ser = ss.series;
    title(ctx, 26, 20, T.season + ' · ' + ser.length + ' 天 · 逐日需求满足率');
    const px = 44, pw = w - 78, py = 46, ph = Math.max(90, h * 0.62);
    const X = (i) => px + (i / (ser.length - 1)) * pw;
    const Y = (v) => py + ph - v * ph;
    ctx.strokeStyle = 'rgba(255,255,255,.08)';
    for (let i = 0; i <= 4; i++) {
      const y = py + (i / 4) * ph;
      ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px + pw, y); ctx.stroke();
      lab(ctx, 12, y + 3, (1 - i / 4).toFixed(2), 'rgba(255,255,255,.35)');
    }
    /* 来水因子（背景面积） */
    ctx.beginPath();
    ctx.moveTo(px, py + ph);
    ser.forEach((s, i) => ctx.lineTo(X(i), Y(Math.min(1, s.factor))));
    ctx.lineTo(px + pw, py + ph); ctx.closePath();
    ctx.fillStyle = 'rgba(140,190,210,.16)'; ctx.fill();
    /* 满足率曲线 */
    ctx.beginPath();
    ser.forEach((s, i) => { const x = X(i), y = Y(s.demandMet); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
    ctx.strokeStyle = P.a3; ctx.lineWidth = 2.2; ctx.stroke();
    /* 紧张日标记 */
    ser.forEach((s, i) => {
      if (s.demandMet < 0.80) {
        ctx.fillStyle = 'rgba(194,86,74,.55)';
        ctx.fillRect(X(i) - 0.8, py, 1.6, ph);
      }
    });
    lab(ctx, px, py + ph + 16, '第 1 天', 'rgba(255,255,255,.35)');
    lab(ctx, px + pw - 34, py + ph + 16, '第 ' + ser.length + ' 天', 'rgba(255,255,255,.35)');
    lab(ctx, px, py - 6, '浅蓝 = 当日来水相对水平；橙 = 当日需求满足率；红竖线 = 紧张日（<80%）', 'rgba(255,255,255,.35)');
    lab(ctx, px, py + ph + 34, '相关（来水 vs 满足率）r = ' + st.model.seasonCorr, 'rgba(255,255,255,.4)');
  }

  const PAINTERS = { chain: drawChain, robust: drawRobust, tamper: drawTamper, advice: drawAdvice, season: drawSeason };

  /* ============================================================
     模块
     ============================================================ */
  SIM.workbench = {
    mount(host, api) {
      const h = api.h;
      const st = {
        tab: 'chain', rule: 'area', n: 8, spread: 0.55, supply: 1.0,
        lining: 'earth', reach: 120, reuse: 0.45, order: 'up', fieldEff: 1.00,
        mcMetric: 'demandMet', mcN: 300, jitter: 1.0,
        tamperId: 'H05', tamperDelta: 0.25,
        w: { fair: 0.30, met: 0.30, gap: 0.20, loss: 0.20 },
        seasonDays: 120, peak: 0.30, floor: 0.45, peakGain: 1.45
      };
      let model = null;

      const L0 = () => (api.lang() === 'en' ? B.en : B.zh);
      let T = L0();

      /* ---- 骨架 ---- */
      const tabsBar = h('div', { class: 'bench-tabs', role: 'tablist' });
      const stage = h('div', { class: 'stage' });
      const screen = h('div', { class: 'screen' });
      const canvas = h('canvas', { role: 'img', 'aria-label': '木刻分水推演台' });
      const hud = h('div', { class: 'hud' });
      screen.appendChild(canvas); screen.appendChild(hud);
      const ctrls = h('div', { class: 'ctrls' });
      stage.appendChild(screen); stage.appendChild(ctrls);
      host.appendChild(tabsBar); host.appendChild(stage);

      const TABDEFS = [
        { id: 'chain', k: 'chain' }, { id: 'robust', k: 'robust' },
        { id: 'tamper', k: 'tamper' }, { id: 'advice', k: 'advice' }, { id: 'season', k: 'season' }
      ];
      const tabBtns = TABDEFS.map((td) => {
        const b = h('button', { class: 'chip', type: 'button', role: 'tab', text: T[td.k] });
        b.addEventListener('click', () => { st.tab = td.id; refreshTabs(); rebuildCtrls(); recompute(); });
        tabsBar.appendChild(b);
        return { el: b, id: td.id };
      });
      function refreshTabs() {
        T = L0();
        tabBtns.forEach((t, i) => {
          t.el.textContent = T[TABDEFS[i].k];
          t.el.setAttribute('aria-pressed', t.id === st.tab ? 'true' : 'false');
        });
      }

      /* ---- 计算 ---- */
      function sceneOf() {
        return L.makeScene({ seed: 20261018, n: st.n, spread: st.spread, supplyRatio: st.supply });
      }
      function computeModel() {
        const scene = sceneOf();
        const chainOpt = { lining: st.lining, reach: st.reach, reuse: st.reuse, order: st.order, fieldEff: st.fieldEff };
        const chain = E.chainPlan(scene, st.rule, chainOpt);
        let mc = null, tamper = null, advice = null, season = null, seasonCorr = 0;
        if (st.tab === 'robust') {
          mc = E.monteCarlo({
            N: st.mcN, seed: 7717,
            base: { seed: 20261018, n: st.n, spread: st.spread, supplyRatio: st.supply, demandPerMu: 480 },
            jitter: { spread: 0.15 * st.jitter, supply: 0.12 * st.jitter, k: 0.30 * st.jitter, demand: 0.08 * st.jitter },
            chain: chainOpt
          });
        } else if (st.tab === 'tamper') {
          tamper = E.tamper(scene, st.rule, st.tamperId, st.tamperDelta);
        } else if (st.tab === 'advice') {
          advice = E.recommend(scene, { w: st.w, chain: chainOpt });
        } else if (st.tab === 'season') {
          season = E.seasonSeries(scene, st.rule, {
            days: st.seasonDays, peak: st.peak, dryFloor: st.floor,
            peakGain: st.peakGain, chain: chainOpt
          });
          seasonCorr = E.seasonCorr(season);
        }
        model = { scene: scene, chain: chain, mc: mc, tamper: tamper, advice: advice, season: season, seasonCorr: seasonCorr };
        return model;
      }

      /* ---- 控制面板 ---- */
      function row(label, children) {
        const r = h('label', { class: 'row bench-row' });
        r.appendChild(h('span', { text: label }));
        (Array.isArray(children) ? children : [children]).forEach((c) => r.appendChild(c));
        return r;
      }
      function slider(label, key, min, max, stepv, fmt) {
        const out = h('span', { class: 'readout', text: fmt(st[key]) });
        const inp = h('input', { type: 'range', min: min, max: max, step: stepv, value: st[key], 'aria-label': label });
        inp.addEventListener('input', () => { st[key] = +inp.value; out.textContent = fmt(+inp.value); recompute(); });
        return row(label, [out, inp]);
      }
      function chips(list, cur, onPick) {
        const box = h('div', { class: 'btns' });
        list.forEach((it) => {
          const b = h('button', { class: 'chip', type: 'button', 'aria-pressed': it.id === cur ? 'true' : 'false', text: it.label });
          b.addEventListener('click', () => onPick(it, Array.from(box.children)));
          box.appendChild(b);
        });
        return box;
      }
      function metricBox(pairs) {
        const m = h('div', { class: 'metrics' });
        const els = {};
        pairs.forEach(([k, label]) => {
          const d = h('div');
          d.appendChild(h('span', { text: label }));
          const b = h('b', { text: '—' });
          d.appendChild(b); m.appendChild(d); els[k] = b;
        });
        return { el: m, els: els };
      }

      function ruleCtrl() {
        const c = h('div', { class: 'ctrl' });
        c.appendChild(h('h4', { text: T.rule + ' / rule' }));
        c.appendChild(chips(RULES.map((r) => ({ id: r.id, label: r.zh })), st.rule, (it, all) => {
          st.rule = it.id; all.forEach((b, i) => b.setAttribute('aria-pressed', RULES[i].id === st.rule ? 'true' : 'false'));
          recompute();
        }));
        return c;
      }
      function sceneCtrl() {
        const c = h('div', { class: 'ctrl' });
        c.appendChild(h('h4', { text: T.scen + ' / scenario' }));
        c.appendChild(slider('户数 n', 'n', 4, 12, 1, (v) => v + ' 户'));
        c.appendChild(slider('田亩差异', 'spread', 0, 1, 0.05, (v) => v.toFixed(2)));
        c.appendChild(slider('来水保证率', 'supply', 0.4, 1.3, 0.05, (v) => (v * 100).toFixed(0) + '%'));
        return c;
      }
      function chainCtrl() {
        const c = h('div', { class: 'ctrl' });
        c.appendChild(h('h4', { text: T.chainOpt + ' / conveyance' }));
        c.appendChild(h('p', { class: 'small', text: T.lining + ' lining' }));
        c.appendChild(chips(LIN.map((k) => ({ id: k, label: E.LININGS[k].zh })), st.lining, (it) => { st.lining = it.id; recompute(); }));
        c.appendChild(slider(T.reach, 'reach', 40, 260, 10, (v) => v + ' m'));
        c.appendChild(slider(T.reuse, 'reuse', 0, 1, 0.05, (v) => (v * 100).toFixed(0) + '%'));
        c.appendChild(slider(T.fieldEff, 'fieldEff', 0.7, 1, 0.01, (v) => v.toFixed(2)));
        c.appendChild(h('p', { class: 'small', text: T.order + ' order' }));
        c.appendChild(chips([{ id: 'up', label: T.up }, { id: 'down', label: T.down }], st.order, (it) => { st.order = it.id; recompute(); }));
        return c;
      }

      let mbox = null;
      function rebuildCtrls() {
        T = L0();
        ctrls.innerHTML = '';
        mbox = null;
        if (st.tab === 'chain') {
          const mb = metricBox([
            ['met', '到田满足率 / 名义'],
            ['gap', '缺口总量 m³'],
            ['gini', '亩均基尼 名义→到田'],
            ['loss', '渗漏 + 田间损失 m³'],
            ['tail', '沟尾弃水 m³'],
            ['span', '首末户到田亩均差']
          ]);
          mbox = { ...mb.els };
          ctrls.appendChild(ruleCtrl());
          ctrls.appendChild(sceneCtrl());
          ctrls.appendChild(chainCtrl());
          const c = h('div', { class: 'ctrl' });
          c.appendChild(h('h4', { text: '到田指标 / delivered' }));
          c.appendChild(mb.el);
          ctrls.appendChild(c);
        } else if (st.tab === 'robust') {
          const mb = metricBox([['lo', 'P5 下界'], ['mid', '中位数 P50'], ['hi', 'P95 上界'], ['spread', '四分位宽 IQR'], ['win', '当前指标胜出']]);
          mbox = { ...mb.els };
          const c = h('div', { class: 'ctrl' });
          c.appendChild(h('h4', { text: T.metric + ' / metric' }));
          c.appendChild(chips([
            { id: 'demandMet', label: '需求满足率' }, { id: 'giniPerMu', label: '亩均基尼' }, { id: 'gapTotal', label: '缺口总量' }, { id: 'utilEff', label: '有效利用率' }
          ], st.mcMetric, (it) => { st.mcMetric = it.id; recompute(); }));
          ctrls.appendChild(c);
          const c2 = h('div', { class: 'ctrl' });
          c2.appendChild(h('h4', { text: T.draws + ' / draws' }));
          c2.appendChild(slider(T.draws, 'mcN', 100, 800, 100, (v) => v + ' 次'));
          c2.appendChild(slider(T.jitter, 'jitter', 0.2, 3, 0.1, (v) => v.toFixed(1) + '×'));
          ctrls.appendChild(c2);
          ctrls.appendChild(sceneCtrl());
          ctrls.appendChild(chainCtrl());
          const c3 = h('div', { class: 'ctrl' });
          c3.appendChild(h('h4', { text: '分布 / distribution' }));
          c3.appendChild(mb.el);
          ctrls.appendChild(c3);
        } else if (st.tab === 'tamper') {
          const mb = metricBox([['gain', '动手者多拿 m³'], ['loss', '其余户共损 m³'], ['worst', '最大受害户'], ['mm', '刻口凿宽'], ['vis', '是否可察觉'], ['pct', '最大受害降幅']]);
          mbox = { ...mb.els };
          const c = h('div', { class: 'ctrl' });
          c.appendChild(h('h4', { text: T.target + ' / who' }));
          c.appendChild((function () {
            const n = st.n, houses = [];
            for (let i = 1; i <= n; i++) houses.push({ id: 'H' + String(i).padStart(2, '0'), label: 'H' + String(i).padStart(2, '0') });
            if (!houses.some((x) => x.id === st.tamperId)) st.tamperId = houses[0].id;
            return chips(houses, st.tamperId, (it, all) => {
              st.tamperId = it.id;
              all.forEach((b) => b.setAttribute('aria-pressed', b.textContent === it.label ? 'true' : 'false'));
              recompute();
            });
          })());
          ctrls.appendChild(c);
          const c2 = h('div', { class: 'ctrl' });
          c2.appendChild(h('h4', { text: T.amount + ' / amount' }));
          c2.appendChild(slider(T.amount, 'tamperDelta', 0, 1, 0.05, (v) => '+' + (v * 100).toFixed(0) + '%'));
          ctrls.appendChild(c2);
          ctrls.appendChild(ruleCtrl());
          ctrls.appendChild(sceneCtrl());
          const c3 = h('div', { class: 'ctrl' });
          c3.appendChild(h('h4', { text: '侵占账 / account' }));
          c3.appendChild(mb.el);
          ctrls.appendChild(c3);
        } else if (st.tab === 'advice') {
          const mb = metricBox([['best', '当前权重最优'], ['gapScore', '首末得分差'], ['note', '稳定性']]);
          mbox = { ...mb.els };
          const c = h('div', { class: 'ctrl' });
          c.appendChild(h('h4', { text: T.adviceW + ' / weights' }));
          c.appendChild(h('p', { class: 'small', text: '四个权重只取相对大小，归一化后加权' }));
          ctrls.appendChild(c);
          const cw = h('div', { class: 'ctrl' });
          cw.appendChild(h('h4', { text: '准则权重 / criteria weights' }));
          [['fair', T.fair], ['met', T.met], ['gap', T.gap], ['loss', T.loss]].forEach(([k, name]) => {
            cw.appendChild((function () {
              const out = h('span', { class: 'readout', text: st.w[k].toFixed(2) });
              const inp = h('input', { type: 'range', min: 0, max: 1, step: 0.05, value: st.w[k], 'aria-label': name });
              inp.addEventListener('input', () => { st.w[k] = +inp.value; out.textContent = (+inp.value).toFixed(2); recompute(); });
              return row(name, [out, inp]);
            })());
          });
          ctrls.appendChild(ruleCtrl());
          ctrls.appendChild(cw);
          ctrls.appendChild(sceneCtrl());
          ctrls.appendChild(chainCtrl());
        } else if (st.tab === 'season') {
          const mb = metricBox([['short', '紧张日占比'], ['worst', '最差日满足率'], ['best', '最好日满足率'], ['corr', '来水↔满足 相关'], ['days', '期长']]);
          mbox = { ...mb.els };
          const c = h('div', { class: 'ctrl' });
          c.appendChild(h('h4', { text: T.season + ' / season' }));
          c.appendChild(slider(T.days, 'seasonDays', 60, 180, 10, (v) => v + ' 天'));
          c.appendChild(slider(T.peak, 'peak', 0, 1, 0.05, (v) => v.toFixed(2)));
          c.appendChild(slider(T.floor, 'floor', 0.1, 1, 0.05, (v) => v.toFixed(2)));
          c.appendChild(slider(T.peakGain, 'peakGain', 0.8, 2.2, 0.05, (v) => v.toFixed(2) + '×'));
          ctrls.appendChild(c);
          ctrls.appendChild(ruleCtrl());
          ctrls.appendChild(sceneCtrl());
          ctrls.appendChild(chainCtrl());
        }
        /* 通用工具 */
        const cu = h('div', { class: 'ctrl' });
        cu.appendChild(h('h4', { text: '导出 / export' }));
        const b1 = h('button', { class: 'chip', type: 'button', text: T.exportCsv });
        b1.addEventListener('click', exportCsv);
        const b2 = h('button', { class: 'chip', type: 'button', text: T.copyLink });
        b2.addEventListener('click', () => {
          const q = new URLSearchParams({ tab: st.tab, rule: st.rule, n: st.n, spread: st.spread, supply: st.supply, lining: st.lining, reach: st.reach, reuse: st.reuse, order: st.order, fieldEff: st.fieldEff });
          const url = location.origin + location.pathname + '?' + q.toString() + '#m_bench';
          try { navigator.clipboard.writeText(url); b2.textContent = '已复制 ✓'; setTimeout(() => { b2.textContent = T.copyLink; }, 1600); }
          catch (e) { window.prompt('复制此链接：', url); }
        });
        const bt = h('div', { class: 'btns' });
        bt.appendChild(b1); bt.appendChild(b2);
        cu.appendChild(bt);
        ctrls.appendChild(cu);
      }

      function exportCsv() {
        let head, rows;
        if (st.tab === 'chain') {
          head = ['户', '田亩', '里程m', '名义m3', '到田m3', '需求m3', '到田亩均'];
          rows = model.chain.rows.map((r) => [r.id, r.area, r.dist, r.alloc, r.delivered, r.demand, r.perMu]);
        } else if (st.tab === 'robust') {
          head = ['规则', 'P5', 'P25', 'P50', 'P75', 'P95'];
          rows = RULES.map((r) => { const s = model.mc.stats[r.id][st.mcMetric]; return [r.zh, s.p5, s.p25, s.p50, s.p75, s.p95]; });
        } else if (st.tab === 'tamper') {
          head = ['户', '原份额m3', '侵占后m3', '增减m3', '变化%'];
          rows = model.tamper.rows.map((r) => [r.id, r.before, r.after, r.diff, (r.diffPct * 100).toFixed(2)]);
        } else if (st.tab === 'advice') {
          head = ['排名', '规则', '得分', '亩均基尼', '满足率', '缺口率', '渗漏率'];
          rows = model.advice.rank.map((x) => [x.rank, (RULES.find((r) => r.id === x.rule) || {}).zh, x.score, x.metrics.fair.toFixed(4), x.metrics.met.toFixed(4), x.metrics.gap.toFixed(4), x.metrics.loss.toFixed(4)]);
        } else {
          head = ['天', '来水因子', '来水量m3', '满足率', '缺口m3', '最小亩均'];
          rows = model.season.series.map((s) => [s.day, s.factor, s.supply, s.demandMet, s.gapTotal, s.minPerMu]);
        }
        download('木刻分水_' + st.tab + '.csv', rowsToCsv(head, rows));
      }

      /* ---- 指标刷新 ---- */
      function updateMetrics() {
        if (!model || !mbox) return;
        const m = model.chain.metrics;
        const nm = L.compareRules(model.scene).results.find((r) => r.rule === st.rule).metrics;
        if (st.tab === 'chain') {
          mbox.met.textContent = (m.demandMet * 100).toFixed(1) + '% / ' + (nm.demandMet * 100).toFixed(1) + '%';
          mbox.gap.textContent = m.gapTotal.toFixed(0);
          mbox.gini.textContent = m.giniPerMuNominal.toFixed(3) + ' → ' + m.giniPerMu.toFixed(3);
          mbox.loss.textContent = (m.conveyLoss + m.fieldLoss).toFixed(0);
          mbox.tail.textContent = m.tail.toFixed(1);
          const r0 = model.chain.rows[0], rN = model.chain.rows[model.chain.rows.length - 1];
          mbox.span.textContent = (rN.perMu - r0.perMu).toFixed(0) + ' m³/亩';
        } else if (st.tab === 'robust') {
          const s = model.mc.stats[st.rule][st.mcMetric];
          const wr = model.mc.winRate[st.mcMetric === 'giniPerMu' ? 'giniPerMu' : 'demandMet'];
          const top = Object.keys(wr).sort((a, b) => wr[b] - wr[a])[0];
          mbox.lo.textContent = s.p5.toFixed(3);
          mbox.mid.textContent = s.p50.toFixed(3);
          mbox.hi.textContent = s.p95.toFixed(3);
          mbox.spread.textContent = (s.p75 - s.p25).toFixed(3);
          mbox.win.textContent = ((RULES.find((r) => r.id === top) || {}).zh || top) + ' ' + (wr[top] * 100).toFixed(0) + '%';
        } else if (st.tab === 'tamper') {
          const tp = model.tamper;
          mbox.gain.textContent = '+' + tp.gain.toFixed(0);
          mbox.loss.textContent = '-' + tp.lossTotal.toFixed(0);
          mbox.worst.textContent = tp.worstVictim ? tp.worstVictim.id + ' -' + tp.worstVictim.loss.toFixed(0) : '—';
          mbox.mm.textContent = tp.detect.deltaMm + ' mm';
          mbox.vis.textContent = tp.detect.visible ? '肉眼可辨' : '肉眼难辨';
          mbox.pct.textContent = tp.worstVictim ? (tp.worstVictim.lossPct * 100).toFixed(1) + '%' : '—';
        } else if (st.tab === 'advice') {
          const rc = model.advice;
          mbox.best.textContent = (RULES.find((r) => r.id === rc.best) || {}).zh;
          mbox.gapScore.textContent = rc.rank.length > 1 ? (rc.rank[0].score - rc.rank[rc.rank.length - 1].score).toFixed(3) : '—';
          mbox.note.textContent = rc.swingNote.indexOf('小') >= 0 ? '敏感 · 权重易翻转' : '稳健';
        } else if (st.tab === 'season') {
          const ss = model.season;
          mbox.short.textContent = (ss.summary.shortageRate * 100).toFixed(0) + '%';
          mbox.worst.textContent = (ss.summary.worstMet * 100).toFixed(1) + '%';
          mbox.best.textContent = (ss.summary.bestMet * 100).toFixed(1) + '%';
          mbox.corr.textContent = model.seasonCorr.toFixed(3);
          mbox.days.textContent = ss.days + ' 天';
        }
      }

      /* ---- 绘制 ---- */
      function repaint() {
        const { ctx, w, h: hh } = window.__fit(canvas, 0.62);
        const P = window.__palette();
        ctx.clearRect(0, 0, w, hh);
        bg(ctx, w, hh);
        const fn = PAINTERS[st.tab];
        if (!fn || !model) return;                      /* 尚未算好就先不画 */
        if (st.tab === 'robust' && !model.mc) return;
        if (st.tab === 'tamper' && !model.tamper) return;
        if (st.tab === 'advice' && !model.advice) return;
        if (st.tab === 'season' && !model.season) return;
        try { fn(ctx, w, hh, { ...st, model: model, scene: model.scene }, P, T); } catch (e) { console.error(e); }
        hud.textContent = st.tab + ' · ' + st.rule + ' · n=' + st.n;
      }
      function recompute() { computeModel(); updateMetrics(); repaint(); }

      /* ---- 自动化 API（与既有水账本同风格）---- */
      SIM.workbench.api = {
        set(s) {
          s = s || {};
          ['tab', 'rule', 'lining', 'order', 'mcMetric'].forEach((k) => { if (s[k]) st[k] = s[k]; });
          ['n', 'spread', 'supply', 'reach', 'reuse', 'fieldEff', 'mcN', 'jitter', 'tamperDelta', 'seasonDays', 'peak', 'floor', 'peakGain'].forEach((k) => { if (s[k] != null) st[k] = +s[k]; });
          if (s.tamperId) st.tamperId = s.tamperId;
          if (s.w) Object.assign(st.w, s.w);
          refreshTabs(); rebuildCtrls(); recompute();
          return { ok: true, tab: st.tab, deliveredMet: model.chain.metrics.demandMet, giniPerMu: model.chain.metrics.giniPerMu };
        },
        state() { return JSON.parse(JSON.stringify(st)); },
        model() { return model; }
      };

      /* ---- URL 参数回填 ---- */
      try {
        const q = new URLSearchParams(location.search);
        ['rule', 'lining', 'order', 'tamperId'].forEach((k) => { if (q.get(k)) st[k] = q.get(k); });
        [['n', 8], ['spread', 0.55], ['supply', 1], ['reach', 120], ['reuse', 0.45], ['fieldEff', 1]].forEach(([k, d]) => { if (q.get(k) != null && !isNaN(+q.get(k))) st[k] = +q.get(k); });
        if (q.get('tab') && PAINTERS[q.get('tab')]) st.tab = q.get('tab');
      } catch (e) { }

      refreshTabs();
      rebuildCtrls();
      recompute();
      new ResizeObserver(() => repaint()).observe(canvas);
    }
  };
})();
