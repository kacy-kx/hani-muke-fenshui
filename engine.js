/* ============================================================
   engine.js —— 《木刻分水：哈尼梯田的水账本》推演层
   ------------------------------------------------------------
   algo.js 给出的是**名义分配**：一口水账，写在纸上、刻在木头上，
   谁占几成，白纸黑字。但水从山箐流到田里，还要走过一段不平等的
   路——这就是本文件要算的东西。

     T1 输水链  chainPlan()      距离衰减 + 渗漏回归 + 上下游取水次序
                                → 名义分配如何变成真实到田水量
     T2 稳健性  monteCarlo()     参数扰动下结论是否站得住（分位数 + 胜出率）
     T3 私刻口  tamper()        某一户把刻口凿宽，其余户被侵占多少
     T4 推荐    recommend()     多准则 TOPSIS：给什么权重，就有什么答案
     T5 灌溉期  seasonSeries()  季节性来水下的逐日满足率

   全部为纯函数：浏览器挂 window.MUKE，Node 直接 require。
   口径声明：村寨、田亩、来水、定额、渠长、衬砌系数均为**本作品设定的
   合成参数**，用于演示模型行为，不是任何真实村寨的实测统计。
   ============================================================ */
(function (root) {
  'use strict';

  var L = (typeof module !== 'undefined' && module.exports)
    ? require('./algo.js')
    : (typeof window !== 'undefined' ? window.LEDGER : null);

  /* ---------- 数值小工具 ---------- */
  const R = (v, d) => { const p = Math.pow(10, d == null ? 2 : d); return Math.round(v * p) / p; };
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

  /* 确定性随机（mulberry32）：同 seed 必同序列，断言可复现 */
  function m32(seed) {
    let s = (seed >>> 0) || 1;
    return function () {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function quantile(arr, p) {
    const a = arr.slice().sort((x, y) => x - y);
    if (!a.length) return 0;
    const i = (a.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i);
    return lo === hi ? a[lo] : a[lo] + (a[hi] - a[lo]) * (i - lo);
  }
  const summary = (arr) => ({
    p5: +quantile(arr, 0.05).toFixed(4), p25: +quantile(arr, 0.25).toFixed(4),
    p50: +quantile(arr, 0.50).toFixed(4), p75: +quantile(arr, 0.75).toFixed(4),
    p95: +quantile(arr, 0.95).toFixed(4), mean: +(arr.reduce((s, v) => s + v, 0) / (arr.length || 1)).toFixed(4),
    n: arr.length
  });

  /* ============================================================
     T1 输水链 —— 名义分配 ≠ 到田水量
     ------------------------------------------------------------
     水从山箐下来，要一段一段地走。每向前走一段，就有水渗进土里；
     渗出去的水并非全丢，有一部分顺着下一级梯田重新回到沟里（回归水），
     于是水账上有四个去向：到田 / 真渗漏 / 回归复用 / 沟尾弃水。
     谁离水源近，谁先舀水——这个次序本身就是制度的一部分。
     ============================================================ */

  /* 衬砌：每 100 m 的渗漏强度 k（衰减系数），工程上土渠≫石砌≫木槽 */
  const LININGS = {
    earth: { zh: '土渠', en: 'Earthen', k: 0.090 },
    stone: { zh: '石砌', en: 'Stone-lined', k: 0.035 },
    wood: { zh: '木槽', en: 'Wooden flume', k: 0.012 }
  };

  const CHAIN_DEFAULT = {
    lining: 'earth',   // 衬砌方式
    reuse: 0.45,       // 渗漏水的回归复用率（0 = 一去不回；1 = 全被下游接住）
    reach: 120,        // 相邻两户之间的渠长（m）
    order: 'up',       // 'up' 上游先取 / 'down' 下游先取
    fieldEff: 1.00,    // 田间水利用系数：设为 1.00 即回到 algo.js 的名义口径
    kScale: 1.00       // 渗漏水强度的缩放（Monte Carlo 用它做扰动）
  };

  /* 一段渠长的到达率：η = exp(−k·L/100) */
  function arrivalRate(lining, lenM, kScale) {
    const conf = LININGS[lining] || LININGS.earth;
    const k = conf.k * (kScale == null ? 1 : kScale);
    return Math.exp(-k * Math.max(0, lenM) / 100);
  }

  function chainPlan(scene, rule, opt) {
    const o = Object.assign({}, CHAIN_DEFAULT, opt || {});
    const nom = L.allocate(scene, rule);          // 名义分配（纸上写好的那一份）
    const order = nom.rows.slice();
    if (o.order === 'down') order.reverse();      // 谁在链的前端，谁先舀水

    const S = scene.supply;
    let q = S;                                    // 沟里当前的水
    let lost = 0, fieldLost = 0, reused = 0, shortfall = 0;
    let pending = order.reduce((s, r) => s + r.alloc, 0);   // 链上尚未取用的名义份额
    const rows = [];

    for (let i = 0; i < order.length; i++) {
      const r = order[i];
      const dist = (i + 0.5) * o.reach;           // 该户到水源的里程（m）

      /* 1) 按名义份额取水。
            木刻刻的是"比例"：沟里水少了，剩下的水按刻口宽度同比例分流，
            而不是前几户照单全收、最后一户颗粒无收。 */
      const ratio = pending > 0 ? Math.min(1, q / pending) : 0;
      const take = r.alloc * ratio;
      const short = +Math.max(0, r.alloc - take).toFixed(3);
      q -= take;
      pending -= r.alloc;

      /* 2) 从本户到下户之间：渗漏 η，(1−η) 渗出去，其中 reuse 比例回到沟里 */
      const eta = arrivalRate(o.lining, o.reach, o.kScale);
      const seep = q * (1 - eta);
      const back = seep * o.reuse;
      q = q - seep + back;
      lost += seep - back;
      reused += back;
      shortfall += short;

      /* 3) 田间水利用系数：入渠口到田面的损失 */
      const toField = take * clamp01(o.fieldEff);
      fieldLost += take - toField;

      const demand = r.demand;
      rows.push({
        id: r.id, area: r.area, demand: demand,
        dist: +dist.toFixed(1), pos: i, order: o.order,
        alloc: +r.alloc.toFixed(2),              // 名义
        delivered: +toField.toFixed(2),          // 到田
        short: short,
        gap: +Math.max(0, demand - toField).toFixed(2),
        spill: +Math.max(0, toField - demand).toFixed(2),
        perMu: +(toField / r.area).toFixed(2),
        perMuNominal: +(r.alloc / r.area).toFixed(2),
        metRatio: +(Math.min(toField, demand) / (demand || 1)).toFixed(4)
      });
    }

    const tail = Math.max(0, q);                  // 流到沟尾、没被取用的水（回江河）
    const served = rows.reduce((s, r) => s + Math.min(r.delivered, r.demand), 0);
    const sum = (k) => rows.reduce((s, r) => s + r[k], 0);

    return {
      opt: o, rule: rule, rows: rows, nominalRows: nom.rows,
      metrics: {
        rule: rule,
        deliveredTotal: +sum('delivered').toFixed(1),
        nominalTotal: +sum('alloc').toFixed(1),
        supply: +S.toFixed(1),
        tail: +tail.toFixed(1),                   // 沟尾弃水
        conveyLoss: +lost.toFixed(1),             // 真渗漏
        fieldLoss: +fieldLost.toFixed(1),         // 田间损失
        reused: +reused.toFixed(1),               // 回归复用
        shortfall: +shortfall.toFixed(1),         // 想取而沟里已无水
        gapTotal: +sum('gap').toFixed(1),
        spillTotal: +sum('spill').toFixed(1),
        demandTotal: +sum('demand').toFixed(1),
        giniVol: +L.gini(rows.map((r) => r.delivered)).toFixed(4),
        giniVolNominal: +L.gini(rows.map((r) => r.alloc)).toFixed(4),
        giniPerMu: +L.gini(rows.map((r) => r.perMu)).toFixed(4),
        giniPerMuNominal: +L.gini(rows.map((r) => r.perMuNominal)).toFixed(4),
        demandMet: +(served / (sum('demand') || 1)).toFixed(4),
        utilEff: +(served / (S || 1)).toFixed(4),
        minPerMu: +Math.min.apply(null, rows.map((r) => r.perMu)).toFixed(2),
        maxPerMu: +Math.max.apply(null, rows.map((r) => r.perMu)).toFixed(2)
      },
      /* 守恒自检：来水 = 到田 + 真渗漏 + 田间损失 + 沟尾弃水 */
      balance: +(S - (sum('delivered') + lost + fieldLost + tail)).toFixed(6)
    };
  }

  /* ============================================================
     T2 稳健性 —— 结论是参数的巧合，还是站得住的判断
     对"田亩差异 / 来水保证率 / 渗漏强度 / 需水定额"施加扰动，
     重复抽样 N 次，看指标的分布与"谁最公平"的胜出率。
     ============================================================ */
  function monteCarlo(opt) {
    const o = Object.assign({
      rules: ['area', 'household', 'rotation'],
      N: 400, seed: 7717,
      base: { seed: 20261018, n: 8, spread: 0.55, supplyRatio: 1.0, demandPerMu: 480 },
      jitter: { spread: 0.15, supply: 0.12, k: 0.30, demand: 0.08 },
      chain: {}
    }, opt || {});

    const rnd = m32(o.seed);
    const acc = {}, pick = {};
    o.rules.forEach((r) => {
      acc[r] = { demandMet: [], giniPerMu: [], gapTotal: [], utilEff: [], minPerMu: [] };
      pick[r] = 0;
    });
    const perFair = {}, perMet = {};
    o.rules.forEach((r) => { perFair[r] = 0; perMet[r] = 0; });

    const base = o.base;
    for (let t = 0; t < o.N; t++) {
      const sp = Math.max(0, base.spread * (1 + (rnd() * 2 - 1) * o.jitter.spread));
      const sr = Math.max(0.15, base.supplyRatio * (1 + (rnd() * 2 - 1) * o.jitter.supply));
      const dm = base.demandPerMu * (1 + (rnd() * 2 - 1) * o.jitter.demand);
      const ks = Math.max(0.05, 1 + (rnd() * 2 - 1) * o.jitter.k);
      const sc = L.makeScene({
        seed: base.seed, n: base.n, spread: sp,
        supplyRatio: sr, demandPerMu: dm
      });
      const res = o.rules.map((rl) => chainPlan(sc, rl, Object.assign({}, o.chain, { kScale: ks })));
      res.forEach((c) => { ['demandMet', 'giniPerMu', 'gapTotal', 'utilEff', 'minPerMu'].forEach((k) => acc[c.rule][k].push(c.metrics[k])); });
      const bestFair = res.slice().sort((a, b) => a.metrics.giniPerMu - b.metrics.giniPerMu)[0].rule;
      const bestMet = res.slice().sort((a, b) => b.metrics.demandMet - a.metrics.demandMet)[0].rule;
      perFair[bestFair]++; perMet[bestMet]++;
    }

    const stats = {};
    o.rules.forEach((r) => {
      stats[r] = {
        demandMet: summary(acc[r].demandMet),
        giniPerMu: summary(acc[r].giniPerMu),
        gapTotal: summary(acc[r].gapTotal),
        utilEff: summary(acc[r].utilEff)
      };
    });
    const rate = (obj) => { const out = {}; Object.keys(obj).forEach((k) => { out[k] = +(obj[k] / o.N).toFixed(4); }); return out; };
    return {
      N: o.N, seed: o.seed, jitter: o.jitter, base: base,
      stats: stats,
      winRate: { giniPerMu: rate(perFair), demandMet: rate(perMet) },
      /* 两个判据是否指向同一个规则——作品的母题 */
      conflictAlways: Object.keys(perFair).every((k) => perFair[k] === o.N)
    };
  }

  /* ============================================================
     T3 私刻口 —— 把别人的份额凿到自己名下
     木刻分水按刻口宽度比例分流：谁把口子凿宽一点，谁就多一份，
     其余人的份额被稀释。这里把这笔账算成一目了然的侵占清单。
     ============================================================ */
  const TAMPER_DEFAULT = { visibleMm: 1.0 };   // 肉眼能察觉的宽度变化（mm）

  function tamper(scene, rule, targetId, delta, opt) {
    const o = Object.assign({}, TAMPER_DEFAULT, opt || {});
    const baseAlloc = L.allocate(scene, rule);
    const np = L.notchPlan(scene, baseAlloc.rows);

    const deltaClamped = Math.max(0, Math.min(2, delta == null ? 0 : delta));
    const plan = np.notches.map((pn) => {
      const now = pn.notch * (pn.id === targetId ? 1 + deltaClamped : 1);
      return { id: pn.id, base: pn.notch, now: +now.toFixed(4), widened: pn.id === targetId };
    });
    const sumNow = plan.reduce((s, p) => s + p.now, 0) || 1;
    const sumBase = plan.reduce((s, p) => s + p.base, 0) || 1;

    const S = scene.supply;
    const rows = baseAlloc.rows.map((r) => {
      const p = plan.find((x) => x.id === r.id);
      const before = r.alloc;
      const after = S * (p.now / sumNow);
      return {
        id: r.id, area: r.area, demand: r.demand,
        notchBase: +p.base.toFixed(4), notchNow: p.now,
        before: +before.toFixed(2), after: +after.toFixed(2),
        diff: +(after - before).toFixed(2),
        diffPct: +(before ? (after - before) / before : 0).toFixed(4),
        perMuAfter: +(after / r.area).toFixed(2)
      };
    });

    const target = rows.find((r) => r.id === targetId) || rows[0];
    const victims = rows.filter((r) => r.id !== targetId)
      .map((r) => ({ id: r.id, loss: +(-r.diff).toFixed(2), lossPct: +(-r.diffPct).toFixed(4) }))
      .sort((a, b) => b.loss - a.loss);

    const pn = np.notches.find((x) => x.id === targetId) || { notch: 0 };
    const deltaMm = +(pn.notch * 1000 * deltaClamped).toFixed(2);

    return {
      targetId: targetId, delta: deltaClamped, rule: rule, plan: plan, rows: rows, victims: victims,
      gain: +target.diff.toFixed(2),
      lossTotal: +victims.reduce((s, v) => s + v.loss, 0).toFixed(2),
      worstVictim: victims[0] || null,
      boardWidthBefore: +sumBase.toFixed(4),
      boardWidthAfter: +sumNow.toFixed(4),
      detect: {
        deltaMm: deltaMm,
        thresholdMm: o.visibleMm,
        visible: Math.abs(deltaMm) >= o.visibleMm,
        note: Math.abs(deltaMm) >= o.visibleMm
          ? '凿宽 ' + deltaMm + ' mm，巡水时肉眼可辨'
          : '凿宽仅 ' + deltaMm + ' mm，肉眼难辨——这正是需要刻板制度的原因'
      },
      feasibleAfter: sumNow <= (np.boardWidth + 1e-9)
    };
  }

  /* ============================================================
     T4 多准则推荐 —— 给什么权重，就有什么答案
     向量归一 → 加权 → 到正/负理想解的距离 → TOPSIS 得分。
     作品不宣布唯一答案，所以权重交给读者。
     ============================================================ */
  const REC_DEFAULT = {
    rules: ['area', 'household', 'rotation'],
    w: { fair: 0.30, met: 0.30, gap: 0.20, loss: 0.20 },
    chain: {}
  };

  function recommend(scene, opt) {
    const o = Object.assign({}, REC_DEFAULT, opt || {});
    const w = Object.assign({}, REC_DEFAULT.w, o.w || {});
    const res = o.rules.map((r) => chainPlan(scene, r, o.chain));

    /* 四个判据：公平(亩均基尼↓)、满足率(↑)、缺口率(↓)、渗漏率(↓) */
    const raw = res.map((c) => {
      const m = c.metrics;
      const gapRate = m.demandTotal ? m.gapTotal / m.demandTotal : 1;
      const lossRate = m.supply ? (m.conveyLoss + m.fieldLoss) / m.supply : 1;
      return { rule: c.rule, fair: m.giniPerMu, met: m.demandMet, gap: gapRate, loss: lossRate };
    });

    const keys = ['fair', 'met', 'gap', 'loss'];
    const dir = { fair: -1, met: +1, gap: -1, loss: -1 };   // +1 越大越好
    const wsum = keys.reduce((s, k) => s + Math.max(0, w[k] || 0), 0) || 1;
    const wk = {}; keys.forEach((k) => { wk[k] = Math.max(0, w[k] || 0) / wsum; });

    /* 向量归一 */
    const norm = {};
    keys.forEach((k) => {
      const den = Math.sqrt(raw.reduce((s, r) => s + r[k] * r[k], 0)) || 1;
      norm[k] = raw.map((r) => r[k] / den);
    });
    const ideal = {}, nadir = {};
    keys.forEach((k, ki) => {
      const vals = norm[k];
      ideal[k] = dir[k] > 0 ? Math.max.apply(null, vals) : Math.min.apply(null, vals);
      nadir[k] = dir[k] > 0 ? Math.min.apply(null, vals) : Math.max.apply(null, vals);
    });

    const out = raw.map((r, i) => {
      let dp = 0, dn = 0;
      keys.forEach((k) => {
        const v = norm[k][i] * wk[k];
        dp += Math.pow(v - ideal[k] * wk[k], 2);
        dn += Math.pow(v - nadir[k] * wk[k], 2);
      });
      dp = Math.sqrt(dp); dn = Math.sqrt(dn);
      const score = (dp + dn) === 0 ? 0 : dn / (dp + dn);
      return { rule: r.rule, raw: r, score: +score.toFixed(4) };
    }).sort((a, b) => b.score - a.score);

    return {
      weights: wk, dir: dir, raw: raw,
      rank: out.map((x, i) => ({ rank: i + 1, rule: x.rule, score: x.score, metrics: x.raw })),
      best: out[0] ? out[0].rule : null,
      /* 权重一变，答案可能就变——把这个敏感性一起给出 */
      swingNote: out.length > 1 ? (out[0].score - out[out.length - 1].score) < 0.08 ? '三种规则差距很小（<0.08），权重微调即可翻转结论' : '结论对当前权重稳健' : ''
    };
  }

  /* ============================================================
     T5 灌溉期日过程 —— 雨季有雨，旱季要轮
     一样的总水量，摊在 120 天上不是均匀的：雨季中段来水足，
     头尾旱，此时轮灌的次序和大小户之间的缺口会被放大。
     ============================================================ */
  /* dryFloor = 旱季下限（相对多年平均的倍数）；peakGain = 雨季峰值倍数。
     雨季中段水会过剩（出现弃水与涝），头尾干旱——一季之内先紧、后松、再紧。 */
  const SEASON_DEFAULT = { days: 120, peak: 0.30, width: 0.20, dryFloor: 0.45, peakGain: 1.45, noise: 0.10, seed: 4242 };

  function seasonSeries(scene, rule, opt) {
    const o = Object.assign({}, SEASON_DEFAULT, opt || {});
    const rnd = m32(o.seed);
    const days = o.days;
    const series = [];
    let shortageDays = 0, worst = 1;

    for (let d = 0; d < days; d++) {
      const u = days > 1 ? d / (days - 1) : 0;
      /* 季节性形状：雨季中段凸起的钟形，峰值可达峰值倍数，下限为旱季水平 */
      const shape = o.dryFloor + (o.peakGain - o.dryFloor) * Math.exp(-Math.pow((u - o.peak) / o.width, 2));
      const factor = Math.max(0.05, shape * (1 + (rnd() * 2 - 1) * o.noise));
      const sc = L.makeScene(Object.assign({}, scene.opt, { supplyRatio: scene.opt.supplyRatio * factor }));
      const c = chainPlan(sc, rule, o.chain);
      const met = c.metrics.demandMet;
      if (met < 0.90) shortageDays++;
      if (met < worst) worst = met;
      series.push({
        day: d + 1,
        factor: +factor.toFixed(4),
        supply: +sc.supply.toFixed(1),
        demandMet: +met.toFixed(4),
        gapTotal: c.metrics.gapTotal,
        minPerMu: c.metrics.minPerMu,
        tail: c.metrics.tail
      });
    }
    return {
      days: days, rule: rule, opt: o, series: series,
      summary: {
        shortageDays: shortageDays,
        shortageRate: +(shortageDays / days).toFixed(4),
        worstMet: +worst.toFixed(4),
        bestMet: +Math.max.apply(null, series.map((s) => s.demandMet)).toFixed(4),
        /* 相关性：来水越小，缺口是否越大（应当是负相关） */
        corr: +Math.abs(0).toFixed(4)
      }
    };
  }

  /* 来水与满足率的相关系数（Pearson），单独算保持 seasonSeries 精简 */
  function seasonCorr(season) {
    const a = season.series.map((s) => s.supply), b = season.series.map((s) => s.demandMet);
    const n = Math.min(a.length, b.length); if (!n) return 0;
    const ma = a.reduce((s, v) => s + v, 0) / n, mb = b.reduce((s, v) => s + v, 0) / n;
    let sa = 0, sb = 0, sab = 0;
    for (let i = 0; i < n; i++) { const da = a[i] - ma, db = b[i] - mb; sa += da * da; sb += db * db; sab += da * db; }
    const dnm = Math.sqrt(sa * sb);
    return +(dnm === 0 ? 0 : sab / dnm).toFixed(4);
  }

  const API = {
    VERSION: '2.0.0',
    LININGS: LININGS, CHAIN_DEFAULT: CHAIN_DEFAULT, SEASON_DEFAULT: SEASON_DEFAULT,
    arrivalRate, chainPlan, monteCarlo, tamper, recommend, seasonSeries, seasonCorr,
    util: { m32, quantile, summary, R }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.MUKE = API;
})(typeof globalThis !== 'undefined' ? globalThis : this);
