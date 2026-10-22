/* ============================================================
   sim.js —— 《木刻分水》交互模块：水账本
   规则内核在 algo.js（window.LEDGER）；本文件只负责：绘制 / 交互 / 状态同步。
   ============================================================ */
(function () {
  'use strict';
  const L = window.LEDGER;
  const SIM = window.SIM = window.SIM || {};

  const RULES = [
    { id: 'area', zh: '按亩分配', en: 'By area', color: 'a1' },
    { id: 'household', zh: '按户均分', en: 'By household', color: 'a2' },
    { id: 'rotation', zh: '按时段轮灌', en: 'By rotation', color: 'a3' }
  ];

  function state2scene(st) {
    return L.makeScene({
      seed: 20261018, n: st.n, spread: st.spread, supplyRatio: st.supply
    });
  }
  function compute(st) {
    const sc = state2scene(st);
    const cur = L.allocate(sc, st.rule);
    const cmp = L.compareRules(sc);
    const np = L.notchPlan(sc, cur.rows);
    return { sc, cur, cmp, np, verdict: L.fairnessVerdict(cmp) };
  }

  /* ---------------- 绘制 ---------------- */
  function makePainter(canvas) {
    return function paint(model, st) {
      const { ctx, w, h } = window.__fit(canvas, 0.62);
      const P = window.__palette();
      ctx.clearRect(0, 0, w, h);
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#0a0c10'); g.addColorStop(1, '#101318');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      const C = { a1: P.a1, a2: P.a2, a3: P.a3 };
      const colOf = (r) => C[RULES.find((x) => x.id === r).color];

      const topH = h * 0.56;
      const bottomY = topH + 12;

      /* ---------- 左上：洛伦兹曲线 ---------- */
      const boxW = Math.min(w * 0.40, topH - 26);
      const boxX = 34, boxY = 18, boxS = boxW;
      ctx.strokeStyle = 'rgba(255,255,255,.13)';
      ctx.lineWidth = 1;
      ctx.strokeRect(boxX, boxY, boxS, boxS);
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = 'rgba(255,255,255,.22)';
      ctx.beginPath(); ctx.moveTo(boxX, boxY + boxS); ctx.lineTo(boxX + boxS, boxY); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,255,255,.45)';
      ctx.font = '10px system-ui,sans-serif';
      ctx.fillText('LORENZ · 累计份额', boxX, boxY - 6);
      ctx.fillText('1.0', boxX - 24, boxY + 10);
      ctx.fillText('0', boxX - 12, boxY + boxS + 4);
      model.cmp.results.forEach((r) => {
        const pts = L.lorenz(r.rows.map((x) => (st.byMu ? x.perMu : x.alloc)));
        ctx.beginPath();
        pts.forEach((p, i) => {
          const x = boxX + p.p * boxS, y = boxY + boxS - p.L * boxS;
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        });
        const isCur = r.rule === st.rule;
        ctx.strokeStyle = colOf(r.rule);
        ctx.globalAlpha = isCur ? 1 : 0.4;
        ctx.lineWidth = isCur ? 2.1 : 1.2;
        ctx.stroke();
        ctx.globalAlpha = 1;
      });
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      ctx.font = '9.5px ui-monospace,monospace';
      ctx.fillText(st.byMu ? 'per-mu water' : 'volume', boxX + boxS - 62, boxY + boxS + 14);

      /* ---------- 右上：每户水量与需求 ---------- */
      const barsX = boxX + boxS + 30;
      const barsW = w - barsX - 16;
      const barsY = boxY + 6;
      const barsH = boxS - 22;
      const rows = model.cur.rows;
      const maxV = Math.max.apply(null, rows.map((r) => Math.max(r.demand, r.alloc))) * 1.12 || 1;
      const bw = barsW / rows.length;
      ctx.fillStyle = 'rgba(255,255,255,.45)';
      ctx.font = '10px system-ui,sans-serif';
      ctx.fillText('每户水量 vs 需求（红 = 缺口）', barsX, boxY - 6);
      rows.forEach((r, i) => {
        const x = barsX + i * bw + bw * 0.16;
        const ww = bw * 0.68;
        const hDemand = (r.demand / maxV) * barsH;
        const hAlloc = (r.alloc / maxV) * barsH;
        const baseY = barsY + barsH;
        /* 需求轮廓 */
        ctx.strokeStyle = 'rgba(255,255,255,.30)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, baseY - hDemand, ww, hDemand);
        ctx.fillStyle = 'rgba(255,255,255,.55)';
        ctx.fillRect(x, baseY - hDemand - 2, ww, 2);
        /* 到手水量 */
        ctx.fillStyle = colOf(st.rule);
        ctx.globalAlpha = 0.85;
        ctx.fillRect(x, baseY - hAlloc, ww, hAlloc);
        ctx.globalAlpha = 1;
        /* 缺口 */
        if (r.gap > 0.01) {
          ctx.fillStyle = '#c2564a';
          ctx.globalAlpha = 0.85;
          ctx.fillRect(x, baseY - hDemand, ww, hDemand - hAlloc);
          ctx.globalAlpha = 1;
        }
        /* 溢出三角 */
        if (r.spill > 0.01) {
          ctx.fillStyle = 'rgba(217,176,97,.5)';
          ctx.beginPath();
          ctx.moveTo(x, baseY - hAlloc);
          ctx.lineTo(x + ww, baseY - hAlloc);
          ctx.lineTo(x + ww, baseY - hAlloc - 6);
          ctx.closePath(); ctx.fill();
        }
        ctx.fillStyle = 'rgba(255,255,255,.42)';
        ctx.font = '8.5px ui-monospace,monospace';
        ctx.fillText(r.id.slice(1), x + ww / 2 - 4, baseY + 11);
        ctx.fillText(r.area.toFixed(1), x + ww / 2 - 6, baseY + 21);
      });
      ctx.fillStyle = 'rgba(255,255,255,.3)';
      ctx.font = '9px ui-monospace,monospace';
      ctx.fillText('户号 / 田亩(亩)', barsX, barsY + barsH + 34);

      /* ---------- 下：分水木刻 ---------- */
      const by = topH + 38;
      const bx = 34, bwAll = w - 68, bh = Math.max(46, Math.min(96, h - by - 34));
      ctx.fillStyle = 'rgba(255,255,255,.45)';
      ctx.font = '10px system-ui,sans-serif';
      ctx.fillText('分水木刻（刻口宽度 ∝ 水权份额，' + (model.np.feasible ? '总宽 ' + (model.np.totalWidth * 1000).toFixed(0) + ' mm ≤ 木刻可用宽' : '⚠ 刻口总宽超出木刻可用宽'), bx, by - 8);
      /* 木头 */
      const grdWood = ctx.createLinearGradient(0, by, 0, by + bh);
      grdWood.addColorStop(0, '#4a3a2a'); grdWood.addColorStop(0.5, '#6b5237'); grdWood.addColorStop(1, '#3a2d21');
      ctx.fillStyle = grdWood;
      ctx.fillRect(bx, by, bwAll, bh);
      /* 刻口 */
      const slotsW = bwAll;
      let cursor = bx + 1;
      const nrows = model.np.notches;
      nrows.forEach((n, i) => {
        const nw = Math.max(3, n.share * (slotsW - 2) - 2);
        const col = colOf(st.rule);
        /* 水槽（刻口） */
        ctx.fillStyle = '#0b1a24';
        ctx.fillRect(cursor, by, nw, bh);
        /* 水流 */
        ctx.strokeStyle = col; ctx.globalAlpha = 0.55; ctx.lineWidth = 1.2;
        for (let k = 1; k <= 2; k++) {
          const yy = by + (bh * k) / 3;
          ctx.beginPath();
          ctx.moveTo(cursor + 1, yy);
          ctx.lineTo(cursor + nw - 1, yy);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        /* 宽度标注 */
        ctx.fillStyle = 'rgba(240,236,228,.72)';
        ctx.font = '8.5px ui-monospace,monospace';
        if (nw > 16) ctx.fillText((n.notch * 1000).toFixed(0), cursor + 2, by + bh + 12);
        cursor += nw + 2;
      });
      /* 水头标注 */
      ctx.strokeStyle = 'rgba(255,255,255,.25)';
      ctx.beginPath();
      ctx.moveTo(bx + 6, by - 4); ctx.lineTo(bx + 6, by + bh + 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.4)';
      ctx.font = '8.5px ui-monospace,monospace';
      ctx.fillText('h=' + (model.np.head * 100).toFixed(0) + 'cm', bx + 10, by + bh - 4);
      ctx.fillText('mm', bx + bwAll - 16, by + bh + 12);
    };
  }

  /* ---------------- 模块 ---------------- */
  SIM.waterLedger = {
    mount(host, api) {
      const { h, pick, Art } = api;
      const st = { rule: 'area', n: 8, spread: 0.55, supply: 1.0, byMu: false };
      let model = compute(st);

      const stage = h('div', { class: 'stage' });
      const screen = h('div', { class: 'screen' });
      const canvas = h('canvas', { role: 'img', 'aria-label': '水账本：洛伦兹曲线、每户水量与需求对比、分水木刻刻口' });
      const hud = h('div', { class: 'hud' });
      hud.style.left = 'auto'; hud.style.right = '12px'; hud.style.top = '8px'; hud.style.bottom = 'auto';
      const hudA = h('span', { text: '' });
      const hudB = h('span', { text: '' });
      hud.appendChild(hudA); hud.appendChild(hudB);
      screen.appendChild(canvas); screen.appendChild(hud);
      stage.appendChild(screen);

      const ctrls = h('div', { class: 'ctrls' });

      /* 规则切换 */
      const c1 = h('div', { class: 'ctrl' });
      c1.appendChild(h('h4', { text: '分水规则 / Allocation rule' }));
      const b1 = h('div', { class: 'btns' });
      const rbtns = RULES.map((r) => {
        const btn = h('button', {
          class: 'chip', type: 'button',
          'aria-pressed': r.id === st.rule ? 'true' : 'false',
          text: pick({ zh: r.zh, en: r.en })
        });
        btn.addEventListener('click', () => { st.rule = r.id; sync(); rebuild(); });
        b1.appendChild(btn); return btn;
      });
      c1.appendChild(b1);
      const b1b = h('div', { class: 'btns' });
      const muBtn = h('button', { class: 'chip', type: 'button', text: '口径：每户水量 / 亩均水量' });
      muBtn.addEventListener('click', () => { st.byMu = !st.byMu; sync(); rebuild(); });
      b1b.appendChild(muBtn);
      c1.appendChild(b1b);

      /* 参数 */
      const c2 = h('div', { class: 'ctrl' });
      c2.appendChild(h('h4', { text: '村寨与来水（合成参数）/ Scenario' }));
      const vals = {}, refs = {};
      function slider(label, key, min, max, step, val, fmt) {
        const row = h('label', { class: 'row' });
        row.appendChild(h('span', { text: label }));
        const out = h('span', { class: 'readout', text: fmt(val) });
        const inp = h('input', { type: 'range', min: min, max: max, step: step, value: val, 'aria-label': label });
        inp.addEventListener('input', () => {
          out.textContent = fmt(+inp.value); vals[key] = +inp.value; rebuild();
        });
        row.appendChild(out); row.appendChild(inp);
        c2.appendChild(row);
        vals[key] = val; refs[key] = { inp, out, fmt };
        return inp;
      }
      slider('户数', 'n', 4, 12, 1, st.n, (v) => v + ' 户');
      slider('田亩差异度', 'spread', 0, 1, 0.05, st.spread, (v) => v.toFixed(2));
      slider('来水量（保证率）', 'supply', 0.4, 1.3, 0.05, st.supply, (v) => (v * 100).toFixed(0) + '%');

      /* 指标 */
      const c3 = h('div', { class: 'ctrl' });
      c3.appendChild(h('h4', { text: '水账指标（本作品模型输出）' }));
      const metrics = h('div', { class: 'metrics' });
      const rowsEl = {};
      [
        ['verdict', '亩均最公平的规则'],
        ['gini', '水量基尼 / 亩均基尼'],
        ['met', '需求满足率'],
        ['gap', '缺口总量（m³）'],
        ['min', '最小亩均 / 定额'],
        ['loss', '输水损失（m³）']
      ].forEach(([k, label]) => {
        const d = h('div');
        d.appendChild(h('span', { text: label }));
        const b = h('b', { text: '—' });
        d.appendChild(b); metrics.appendChild(d); rowsEl[k] = b;
      });
      c3.appendChild(metrics);

      ctrls.appendChild(c1); ctrls.appendChild(c2); ctrls.appendChild(c3);
      stage.appendChild(ctrls);
      host.appendChild(stage);

      const paint = makePainter(canvas);

      function sync() {
        rbtns.forEach((b, i) => b.setAttribute('aria-pressed', RULES[i].id === st.rule ? 'true' : 'false'));
        muBtn.setAttribute('aria-pressed', st.byMu ? 'true' : 'false');
      }
      function updateMetrics() {
        const { cur, cmp, verdict, sc, np } = model;
        const rn = (id) => (RULES.find((x) => x.id === id) || {}).zh || id;
        rowsEl.verdict.textContent = rn(verdict.bestBy.giniPerMu);
        rowsEl.gini.textContent = cur.metrics.giniVol.toFixed(3) + ' / ' + cur.metrics.giniPerMu.toFixed(3);
        rowsEl.met.textContent = (cur.metrics.demandMet * 100).toFixed(1) + '%';
        rowsEl.gap.textContent = cur.metrics.gapTotal.toFixed(0) + ' / 需求 ' + cur.metrics.demandTotal.toFixed(0);
        rowsEl.min.textContent = cur.metrics.minPerMu.toFixed(0) + ' / ' + sc.demandPerMu.toFixed(0) + ' m³/亩';
        rowsEl.loss.textContent = cur.metrics.loss.toFixed(0) + (np.feasible ? ' · 刻口可行' : ' · 刻口超宽');
        hudA.textContent = st.rule + (st.byMu ? ' · per-mu' : ' · volume');
        hudB.textContent = 'gap ' + cur.metrics.gapTotal.toFixed(0) + ' m³';
      }
      function rebuild() {
        model = compute(st);
        updateMetrics();
        paint(model, st);
      }

      /* 自动化 API（录屏 / 截图 / 断言都靠它） */
      SIM.waterLedger.api = {
        set(s) {
          s = s || {};
          if (s.rule && RULES.some((r) => r.id === s.rule)) st.rule = s.rule;
          ['n', 'spread', 'supply'].forEach((k) => {
            if (s[k] != null) {
              st[k] = +s[k];
              if (refs[k]) { refs[k].inp.value = +s[k]; refs[k].out.textContent = refs[k].fmt(+s[k]); }
            }
          });
          if (s.byMu != null) st.byMu = !!s.byMu;
          sync(); rebuild();
          return { ok: true, rule: st.rule, giniPerMu: model.cur.metrics.giniPerMu, gap: model.cur.metrics.gapTotal };
        },
        model() { return model; },
        state() { return Object.assign({}, st); }
      };

      sync(); updateMetrics(); paint(model, st);
      new ResizeObserver(() => paint(model, st)).observe(canvas);
    }
  };

  /* ---------------- 封面与画廊视觉（本作品母题：等高线 + 刻口） ---------------- */
  SIM.art = {
    cover(ctx, w, h, t) {
      const P = window.__palette();
      ctx.clearRect(0, 0, w, h);
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#070a0d'); g.addColorStop(0.55, '#0d1218'); g.addColorStop(1, '#0a0e12');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      const nz = window.Core.noise2(20261018);
      /* 梯田等高线：一组被扰动的水平曲线 */
      for (let i = 0; i < 26; i++) {
        const y0 = h * 0.14 + (i / 26) * h * 0.78;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 4) {
          const u = x / w;
          const v = nz(u * 3.4 + i * 0.21, i * 0.13 + t * 0.00008);
          const y = y0 + (v - 0.5) * 34 * Math.sin(Math.PI * u) + Math.sin(u * 7 + i * 0.8) * 5;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = i % 6 === 0 ? 'rgba(201,98,47,.5)' : 'rgba(217,176,97,.16)';
        ctx.lineWidth = i % 6 === 0 ? 1.3 : 0.8;
        ctx.stroke();
      }
      /* 一条水沟：从左上流下 */
      ctx.beginPath();
      for (let y = 0; y <= h; y += 3) {
        const u = y / h;
        const x = w * (0.18 + u * 0.12) + Math.sin(u * 9 + t * 0.0004) * 12;
        y === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(120,190,215,.55)'; ctx.lineWidth = 2.2; ctx.stroke();
      /* 木刻：右下角一块带刻口的木板 */
      const bx = w * 0.62, by = h * 0.62, bw = w * 0.3, bh = h * 0.11;
      const gw = ctx.createLinearGradient(0, by, 0, by + bh);
      gw.addColorStop(0, '#4a3a2a'); gw.addColorStop(0.5, '#6b5237'); gw.addColorStop(1, '#372b1f');
      ctx.fillStyle = gw; ctx.fillRect(bx, by, bw, bh);
      let cx2 = bx + bw * 0.1;
      const shares = [0.10, 0.14, 0.12, 0.16, 0.09, 0.13];
      shares.forEach((s, i) => {
        const nw = bw * 0.8 * s;
        ctx.fillStyle = '#0b1a24';
        ctx.fillRect(cx2, by, nw, bh);
        ctx.strokeStyle = 'rgba(201,98,47,.7)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx2 + 1, by + bh * 0.5); ctx.lineTo(cx2 + nw - 1, by + bh * 0.5); ctx.stroke();
        cx2 += nw + bw * 0.012;
      });
      /* 底部渐暗 */
      const gg = ctx.createLinearGradient(0, h * 0.5, 0, h);
      gg.addColorStop(0, 'rgba(10,12,16,0)'); gg.addColorStop(1, 'rgba(10,12,16,.93)');
      ctx.fillStyle = gg; ctx.fillRect(0, h * 0.5, w, h * 0.5);
    },

    card(kind, ctx, w, h, i) {
      const P = window.__palette();
      ctx.clearRect(0, 0, w, h);
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#0b0e12'); g.addColorStop(1, '#12161c');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      const col = kind === 'area' ? P.a1 : kind === 'house' ? P.a2 : kind === 'rotate' ? P.a3 : '#8ab6c8';
      const r = window.Core.rng(window.Core.hash(kind + i));
      const n = 8;
      if (kind === 'notch') {
        /* 木刻条 */
        const bh = h * 0.22, by = h * 0.42;
        const gw = ctx.createLinearGradient(0, by, 0, by + bh);
        gw.addColorStop(0, '#4a3a2a'); gw.addColorStop(0.5, '#6b5237'); gw.addColorStop(1, '#372b1f');
        ctx.fillStyle = gw; ctx.fillRect(w * 0.08, by, w * 0.84, bh);
        let cx = w * 0.1;
        const ws = [];
        for (let k = 0; k < n; k++) ws.push(0.06 + r() * 0.1);
        const sum = ws.reduce((s, v) => s + v, 0);
        ws.forEach((v) => {
          const nw = (v / sum) * w * 0.8;
          ctx.fillStyle = '#0b1a24'; ctx.fillRect(cx, by, Math.max(3, nw - 3), bh);
          ctx.strokeStyle = col; ctx.globalAlpha = 0.6; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(cx + 1, by + bh * 0.5); ctx.lineTo(cx + Math.max(3, nw - 3), by + bh * 0.5); ctx.stroke();
          ctx.globalAlpha = 1;
          cx += nw;
        });
        return;
      }
      /* 水量条 / 亩均条 */
      const bars = n, bw = (w * 0.84) / bars;
      for (let k = 0; k < bars; k++) {
        let v;
        if (kind === 'area') v = 0.35 + r() * 0.6;            // 水量差异大
        else if (kind === 'house') v = 0.62;                   // 水量全等
        else v = 0.6;                                          // 轮灌名义全等
        const hh = v * h * 0.5;
        const x = w * 0.08 + k * bw;
        ctx.fillStyle = col; ctx.globalAlpha = 0.85;
        ctx.fillRect(x + bw * 0.15, h * 0.72 - hh, bw * 0.7, hh);
        ctx.globalAlpha = 1;
        /* 需求轮廓 */
        const dv = 0.4 + r() * 0.55;
        ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 1;
        ctx.strokeRect(x + bw * 0.15, h * 0.72 - dv * h * 0.5, bw * 0.7, dv * h * 0.5);
      }
      ctx.strokeStyle = 'rgba(255,255,255,.16)';
      ctx.beginPath(); ctx.moveTo(w * 0.06, h * 0.72); ctx.lineTo(w * 0.94, h * 0.72); ctx.stroke();
      /* 右上角标签线 */
      ctx.strokeStyle = col; ctx.globalAlpha = 0.5; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(w * 0.08, h * 0.16); ctx.lineTo(w * 0.08 + w * 0.2, h * 0.16); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  };
})();
