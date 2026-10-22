/* ============================================================
   algo.js —— 《木刻分水：哈尼梯田的水账本》可复算内核
   对象：把哈尼梯田「木刻分水」的水权分配写成三种可计算的规则，
        并给出每户水量、基尼系数、需求满足率与干旱缺口、刻口宽度。
   —— 全部为纯函数，不碰 DOM；浏览器挂 window.LEDGER，Node 直接 require。
   —— 口径：村寨户数、田亩、来水量、需水定额均为**本作品设定的合成参数**，
      不是任何真实村寨的统计数字；制度与遗产事实见内容页「来源」。
   ============================================================ */
(function (root) {
  'use strict';

  const MU = 666.6667;                 // 1 亩 = 666.67 m²
  const G = 9.80665;                   // 重力加速度 m/s²
  const NUM = n => (n >>> 0);

  /* 本地确定性随机（mulberry32）：同 seed 必得同场景，可复现断言的基础 */
  function mulberry(seed) {
    let s = (seed >>> 0) || 1;
    return function () {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------------- 1. 场景：一个"合成村寨"的水账 ----------------
     参数全部由 opt 给出；同 opt 同 seed → 同场景。
     spread：田亩差异度（0 = 每户田亩相同；越大越悬殊）
     来水量按「灌溉保证率」supplyRatio 相对"刚好满足全部需求"折算。 */
  const DEFAULT = {
    seed: 20261018,
    n: 8,                 // 户数
    spread: 0.55,         // 田亩差异度 0–1
    baseArea: 2.6,        // 基准田亩（亩）
    demandPerMu: 480,     // 亩均需水定额 m³/亩（本作品设定，可调）
    supplyRatio: 1.0,     // 来水量 / 按定额算出的总需求
    seasonDays: 120,      // 灌溉期天数（本作品设定）
    startupLossRatio: 0.5,// 轮灌每次开闸的启动/湿润损失，按"一日流量"的比例计
    head: 0.05,           // 木刻刻口的水头 h（m，本作品设定）
    cd: 0.62,             // 矩形薄壁堰流量系数（工程常用值）
    boardWidth: 0.60      // 分水木刻可用总刻口宽度（m，本作品设定）
  };

  function makeScene(opt) {
    const o = Object.assign({}, DEFAULT, opt || {});
    const rnd = mulberry(o.seed);
    const hs = [];
    for (let i = 0; i < o.n; i++) {
      // 对称的差异分布：spread=0 时全部相等
      const j = (rnd() * 2 - 1) * (rnd() * 2 - 1);        // 中间密两端疏
      const area = Math.max(0.4, o.baseArea * (1 + o.spread * 1.9 * j));
      hs.push({ id: 'H' + String(i + 1).padStart(2, '0'), area: +area.toFixed(3) });
    }
    const totalArea = hs.reduce((s, x) => s + x.area, 0);
    const demandTotal = totalArea * o.demandPerMu;
    const supply = demandTotal * o.supplyRatio;
    return {
      opt: o, houses: hs, n: hs.length,
      totalArea: +totalArea.toFixed(3),
      demandPerMu: o.demandPerMu,
      demandTotal: +demandTotal.toFixed(1),
      supply: +supply.toFixed(1),
      seasonDays: o.seasonDays
    };
  }

  /* ---------------- 2. 三种分水规则 ----------------
     household 按户均分：不论田亩，每户等量（"按人头/按户"的朴素公平）
     area      按亩分配：水量 ∝ 田亩（"按灌溉面积"的传统木刻口径）
     rotation  按时段轮灌：灌溉期切成 n 段，每户独占全流量一个时段，
               但每开一次闸都有启动/湿润损失；河水不会因为没有需求而停流。 */
  function allocate(scene, rule) {
    const o = scene.opt, n = scene.n;
    const S = scene.supply;
    const A = scene.totalArea;
    const rows = [];
    let loss = 0, netSupply = S;
    if (rule === 'rotation') {
      const daily = S / o.seasonDays;
      const perTurn = daily * o.startupLossRatio;   // 每次开闸的损失（m³）
      loss = perTurn * n;
      netSupply = Math.max(0, S - loss);
    }
    scene.houses.forEach((h, i) => {
      let alloc;
      if (rule === 'household') alloc = S / n;
      else if (rule === 'area') alloc = S * h.area / A;
      else alloc = netSupply / n;                   // rotation
      const demand = h.area * scene.demandPerMu;
      rows.push({
        id: h.id, area: h.area, demand: +demand.toFixed(2),
        alloc: +alloc.toFixed(2),
        gap: +Math.max(0, demand - alloc).toFixed(2),
        spill: +Math.max(0, alloc - demand).toFixed(2),
        perMu: +(alloc / h.area).toFixed(2),
        metRatio: +(Math.min(alloc, demand) / (demand || 1)).toFixed(4)
      });
    });
    const sum = k => rows.reduce((s, r) => s + r[k], 0);
    const allocTotal = sum('alloc');
    const gapTotal = sum('gap');
    const spillTotal = sum('spill');
    const served = rows.reduce((s, r) => s + Math.min(r.alloc, r.demand), 0);
    const metrics = {
      rule: rule,
      allocTotal: +allocTotal.toFixed(1),
      netSupply: +netSupply.toFixed(1),
      loss: +loss.toFixed(1),
      giniVol: +gini(rows.map(r => r.alloc)).toFixed(4),
      giniPerMu: +gini(rows.map(r => r.perMu)).toFixed(4),
      demandTotal: +sum('demand').toFixed(1),
      gapTotal: +gapTotal.toFixed(1),
      spillTotal: +spillTotal.toFixed(1),
      demandMet: +(served / (scene.demandTotal || 1)).toFixed(4),
      utilEff: +(served / (S || 1)).toFixed(4),
      gapRate: +(gapTotal / (scene.demandTotal || 1)).toFixed(4),
      minPerMu: +Math.min.apply(null, rows.map(r => r.perMu)).toFixed(2),
      maxPerMu: +Math.max.apply(null, rows.map(r => r.perMu)).toFixed(2)
    };
    return { rule: rule, rows: rows, metrics: metrics };
  }

  /* ---------------- 3. 基尼系数与洛伦兹曲线 ----------------
     G = (2·Σ i·x_i − (n+1)·Σ x_i) / (n·Σ x_i)，x 升序，i 从 1 起。
     完全平均 → 0；一户独占 → (n−1)/n。 */
  function gini(values) {
    const x = values.filter(v => Number.isFinite(v)).slice().sort((a, b) => a - b);
    const n = x.length;
    if (!n) return 0;
    const sx = x.reduce((s, v) => s + v, 0);
    if (sx <= 0) return 0;
    let w = 0;
    for (let i = 0; i < n; i++) w += (i + 1) * x[i];
    const g = (2 * w - (n + 1) * sx) / (n * sx);
    return Math.max(0, Math.min(1, g));
  }

  function lorenz(values) {
    const x = values.slice().sort((a, b) => a - b);
    const n = x.length, sx = x.reduce((s, v) => s + v, 0) || 1;
    const pts = [{ p: 0, L: 0 }];
    let acc = 0;
    for (let i = 0; i < n; i++) { acc += x[i]; pts.push({ p: (i + 1) / n, L: acc / sx }); }
    return pts;
  }

  /* ---------------- 4. 三种规则的量化对比 ---------------- */
  function compareRules(scene) {
    const out = ['area', 'household', 'rotation'].map(r => allocate(scene, r));
    const pick = (key, dir) => out.slice().sort((a, b) =>
      dir > 0 ? b.metrics[key] - a.metrics[key] : a.metrics[key] - b.metrics[key])[0].rule;
    return {
      scene: scene,
      results: out,
      bestBy: {
        giniPerMu: pick('giniPerMu', -1),     // 亩均水量最平均
        giniVol: pick('giniVol', -1),         // 每户水量最平均
        demandMet: pick('demandMet', +1),     // 需求满足率最高
        utilEff: pick('utilEff', +1),         // 有效水利用率最高
        gapTotal: pick('gapTotal', -1)        // 缺口最小
      }
    };
  }

  /* ---------------- 5. 木刻刻口：矩形薄壁堰 ----------------
     Q = (2/3)·Cd·√(2g)·b·h^1.5  （SI：Q m³/s，b/h 为 m）
     木刻分水的物理含义：把"应得水量的比例"刻成"刻口宽度的比例"。 */
  function weirFlow(b, h, cd) {
    const c = cd == null ? DEFAULT.cd : cd;
    if (!(b > 0) || !(h > 0)) return 0;
    return (2 / 3) * c * Math.sqrt(2 * G) * b * Math.pow(h, 1.5);
  }

  function notchPlan(scene, rows, opt) {
    const o = Object.assign({}, scene.opt, opt || {});
    const channelFlow = o.channelFlow || (scene.supply / (scene.seasonDays * 86400) * 6); // 进水流量设定
    const total = rows.reduce((s, r) => s + r.alloc, 0) || 1;
    const k = channelFlow / weirFlow(1, o.head, o.cd);       // 单位宽度对应的流量
    const plan = rows.map(r => {
      const b = (r.alloc / total) * k;                        // 刻口宽度 ∝ 水权份额
      return { id: r.id, share: +(r.alloc / total).toFixed(4), notch: +b.toFixed(4) };
    });
    const totalB = plan.reduce((s, p) => s + p.notch, 0);
    return {
      head: o.head, cd: o.cd, channelFlow: +channelFlow.toFixed(6),
      notches: plan,
      totalWidth: +totalB.toFixed(4),
      boardWidth: o.boardWidth,
      feasible: totalB <= o.boardWidth + 1e-9,
      minNotch: +Math.min.apply(null, plan.map(p => p.notch)).toFixed(4)
    };
  }

  /* ---------------- 6. 干旱扫描：来水量 → 缺口 ----------------
     ratios：来水量相对"总需求"的比值序列。 */
  function drySweep(scene, ratios) {
    const rs = ratios && ratios.length ? ratios : [0.35, 0.5, 0.65, 0.8, 0.95, 1.0, 1.15];
    return rs.map(r => {
      const sc = makeScene(Object.assign({}, scene.opt, {
        seed: scene.opt.seed, n: scene.opt.n, spread: scene.opt.spread,
        supplyRatio: r
      }));
      const c = compareRules(sc);
      const line = { supplyRatio: r, supply: sc.supply };
      c.results.forEach(x => {
        line[x.rule] = {
          gapRate: x.metrics.gapRate, demandMet: x.metrics.demandMet,
          giniPerMu: x.metrics.giniPerMu, utilEff: x.metrics.utilEff
        };
      });
      return line;
    });
  }

  /* ---------------- 7. 公平性判据 ----------------
     本作品给两个判据，并允许它们冲突——这正是作品要讲的事：
       agronomic  亩均水量基尼（农业意义上"每块田拿到一样多"）
       volumetric 每户水量基尼（"每户拿到一样多"）
     判据不同 → 最优规则不同；作品不宣布唯一答案。 */
  function fairnessVerdict(compare) {
    const R = compare.results;
    const byRule = {};
    R.forEach(x => {
      byRule[x.rule] = {
        volFair: x.metrics.giniVol <= 1e-6 || x.metrics.giniVol < 0.02,
        perMuFair: x.metrics.giniPerMu <= 1e-6 || x.metrics.giniPerMu < 0.02,
        gapRate: x.metrics.gapRate
      };
    });
    return {
      bestBy: compare.bestBy,
      byRule: byRule,
      conflict: compare.bestBy.giniPerMu !== compare.bestBy.giniVol,
      gapMin: Math.min.apply(null, R.map(x => x.metrics.gapTotal))
    };
  }

  /* ---------------- 8. 现场灌溉一天的入账（供"水账本"逐日演示） ---------------- */
  function dailyLedger(scene, rule, day) {
    const d = Math.max(0, Math.min(scene.seasonDays - 1, day | 0));
    const a = allocate(scene, rule);
    const perDay = scene.supply / scene.seasonDays;
    return {
      day: d, perDay: +perDay.toFixed(2),
      rows: a.rows.map(r => ({
        id: r.id,
        today: +(r.alloc / scene.seasonDays).toFixed(2),
        cumulative: +(r.alloc / scene.seasonDays * (d + 1)).toFixed(1)
      }))
    };
  }

  const API = {
    MU, DEFAULT, makeScene, allocate, gini, lorenz, compareRules,
    weirFlow, notchPlan, drySweep, fairnessVerdict, dailyLedger
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.LEDGER = API;
})(typeof globalThis !== 'undefined' ? globalThis : this);
