/* ============================================================
   content.js —— 《木刻分水：哈尼梯田的水账本》内容真源（中英双语）
   规则：凡"制度/遗产/地理"事实 → 见 modules.src.refs（真实来源）；
        凡"数字" → 分两类标注：①公开资料定性事实 ②本作品模型输出。
        **村寨户数、田亩、来水量、需水定额均为本作品设定的合成参数，
          不代表任何真实村寨的统计数字。**
   ============================================================ */
window.CONTENT = {
  key: 'hani-water-ledger',
  title: { zh: '木刻分水', en: 'The Notched Ledger' },
  titleEn: { zh: 'THE NOTCHED LEDGER', en: 'A COMPUTABLE WATER LEDGER FOR THE HANI TERRACES' },
  foot: {
    line1: {
      zh: '《木刻分水：哈尼梯田的水账本》· 2026 第十四届全国大学生数字媒体科技作品及创意竞赛 · 乡村振兴科创赋能赛项 · 离线可运行网页作品，零外部依赖。',
      en: 'The Notched Ledger · 2026 CMIT · Track: Rural Revitalization through Science and Technology · Offline single-page work with zero external dependencies.'
    },
    line2: {
      zh: '作品中的户数、田亩、来水量与需水定额均为本作品设定的合成参数，不是任何真实村寨的统计数字；制度与遗产事实的来源见「来源」一节。',
      en: 'Household counts, field areas, inflow and water duties in this work are synthetic parameters set by the work itself — not statistics of any real village. Sources for institutional and heritage facts are listed in “Sources”.'
    }
  },

  modules: [
    /* ---------------- 封面 ---------------- */
    {
      type: 'cover', id: 'cover',
      eyebrow: { zh: '乡村振兴 · 科创赋能 ｜ 2026 数媒竞赛', en: 'Rural Revitalization · 2026 CMIT' },
      title: { zh: '木刻分水', en: 'The Notched Ledger' },
      titleEn: { zh: 'THE NOTCHED LEDGER', en: 'A COMPUTABLE WATER LEDGER FOR THE HANI TERRACES' },
      lead: {
        zh: '哈尼梯田把一座山切成几千层田，也把一条水沟切成几十份「谁家先浇、浇多少」。分水木刻是这套制度的实物凭证：一块木板上刻出宽窄不同的缺口，水从缺口流进各家的田。本作品把它写成三种可计算的分水规则——按亩、按户、按时段轮灌——然后让每一户的水量、基尼系数与干旱缺口自己算出来。',
        en: 'The Hani terraces cut a mountain into thousands of field steps, and cut a single channel into dozens of answers to one question: who irrigates first, and how much. The notched wooden board — mukefenshui — is the material record of that rule: notches of different widths let water into different households’ fields. This work rewrites the rule as three computable allocation schemes — by area, by household, by rotation — and lets every household’s volume, the Gini coefficient and the drought shortfall be computed.'
      },
      tags: [
        { zh: '灌溉制度', en: 'irrigation institution' },
        { zh: '水权分配', en: 'water allocation' },
        { zh: '基尼系数', en: 'Gini coefficient' },
        { zh: '可复算模型', en: 'recomputable model' }
      ]
    },

    /* ---------------- 问题 ---------------- */
    {
      type: 'prose', id: 'why', nav: { zh: '问题', en: 'Problem' },
      eyebrow: { zh: '01 问题的提出', en: '01 The Problem' },
      title: { zh: '一条水沟，几十户人家，怎么分才算公平', en: 'One channel, dozens of households: what counts as fair' },
      lead: {
        zh: '梯田的水从高山森林下来，沿水沟一层层往下走。水是有限的，田是分散的，于是「怎么分」变成一件每年都要重新回答的事。木刻分水给出的答案是：把份额刻在木头上，让缺口宽度替你说话。',
        en: 'Water comes down from the mountain forest and travels along channels from terrace to terrace. Water is limited and fields are scattered, so “how to divide it” has to be answered again every year. The notched board answers it by carving each share into wood, letting the width of a notch speak for its holder.'
      },
      text: {
        zh: [
          '这套制度被反复描述为「按灌溉面积的大小和农户修沟出力的多少来分配」，而它的载体是一块刻了缺口的木板。描述很清楚，但它不可计算：没有人能回答"如果今年来水只有常年的六成，按亩分和按户分，哪一家先不够？缺口是多少立方米？"',
          '于是本作品做一件很小的事：把三种常见的分法写成三个可以跑的函数，把每一户的水量、亩均水量、缺口、基尼系数算出来，再把三种分法放在同一张表上比。它不评价哈尼人该怎么分水——那是当地人的事；它只把"不同分法会带来什么后果"变成可以看见的数字。'
        ],
        en: [
          'The institution is commonly described as allocating water “according to the size of the irrigated area and each household’s contribution to digging the channel”, materialised in a notched wooden board. The description is clear but not computable: nobody can answer “if inflow this year is only sixty percent of normal, under allocation by area versus by household, who runs short first, and by how many cubic metres?”',
          'So this work does one small thing: it writes three common schemes as three runnable functions, computes every household’s volume, volume per mu, shortfall and the Gini coefficient, then puts the three schemes on one table. It does not tell Hani villagers how to divide water — that is theirs to decide; it only turns “what different schemes would produce” into numbers you can look at.'
        ]
      },
      kv: [
        { v: { zh: '2013', en: '2013' }, k: { zh: '红河哈尼梯田文化景观列入联合国教科文组织《世界遗产名录》（文化景观）', en: 'Cultural Landscape of Honghe Hani Rice Terraces inscribed on the World Heritage List' } },
        { v: { zh: '2010', en: '2010' }, k: { zh: '云南红河哈尼稻作梯田系统被联合国粮农组织认定为全球重要农业文化遗产（GIAHS）', en: 'Honghe Hani Rice Terraces System recognised as a Globally Important Agricultural Heritage System (FAO)' } },
        { v: { zh: '木刻分水', en: 'notched-board allocation' }, k: { zh: '以刻有不同宽度缺口的木板作为分水凭证的习惯制度（公开资料常见表述）', en: 'A customary rule that uses a wooden board with notches of different widths as the record of water shares' } }
      ]
    },

    /* ---------------- 三条规则 ---------------- */
    {
      type: 'prose', id: 'what', nav: { zh: '三条规则', en: 'Three rules' },
      eyebrow: { zh: '02 把制度写成三个函数', en: '02 Turning an institution into three functions' },
      title: { zh: '三种分法，三种"公平"', en: 'Three schemes, three kinds of fairness' },
      lead: {
        zh: '本作品实现三种分水规则。它们的分歧不在算术，而在"公平"指的是什么：是按每户一样多，还是按每块田一样多，还是按时间轮流。三种口径都能自称公平，而它们的数字完全不同。',
        en: 'This work implements three allocation schemes. They differ not in arithmetic but in what “fair” means: the same volume per household, the same depth per field, or an equal turn in time. All three can call themselves fair; their numbers do not agree.'
      },
      cols: [
        {
          title: { zh: '① 按亩分配（水 ∝ 田亩）', en: '① By area (water ∝ field size)' },
          text: {
            zh: [
              '每户到手水量与其田亩成正比：q_i = Q · A_i / ΣA。这是木刻分水最接近的数学形式——刻口宽度与应得水量成正比，而应得水量与灌溉面积挂钩。',
              '后果：每户的"亩均水量"完全相同，亩均基尼系数恒为 0；但每户拿到的总水量差异很大，水量基尼系数就等于田亩分布的基尼系数。'
            ],
            en: [
              'Each household’s volume is proportional to its area: q_i = Q · A_i / ΣA. This is the closest mathematical form of the notched-board rule — notch width proportional to entitlement, entitlement tied to irrigated area.',
              'Consequence: volume per mu is identical for everyone, so the per-mu Gini is exactly zero; but total volumes differ a lot, and the volume Gini simply equals the Gini of the land distribution.'
            ]
          }
        },
        {
          title: { zh: '② 按户均分（水 ∝ 户数）', en: '② By household (water ∝ households)' },
          text: {
            zh: [
              '不论田亩多少，每户等量：q_i = Q / n。听起来最"人人平等"，也很容易执行。',
              '后果：水量基尼系数为 0——但亩均水量差异被放大：田多的人家亩均水最少。在平水年（来水刚好等于按定额算出的总需求）里，本作品默认场景下最大家（3.88 亩）亩均只有 358.87 m³，比定额 480 m³ 少 25%，并凭空产生 764.4 m³ 的缺口——不是水不够，是分法不匹配。'
            ],
            en: [
              'Everyone gets the same regardless of area: q_i = Q / n. It sounds the most “equal”, and it is the easiest to run.',
              'Consequence: the volume Gini is zero — but the disparity in depth per field is amplified: the household with the most land gets the least water per mu. In a normal year (inflow exactly equal to total demand at the water duty), the largest farm in this work’s default scenario (3.88 mu) receives only 358.87 m³ per mu — 25% below the 480 m³ duty — and a 764.4 m³ shortfall appears out of nowhere. Not because water is scarce, but because the scheme does not match the fields.'
            ]
          }
        },
        {
          title: { zh: '③ 按时段轮灌（水 ∝ 时间）', en: '③ By rotation (water ∝ time)' },
          text: {
            zh: [
              '把灌溉期切成 n 段，每户独占全流量一个时段。河水不会因为某家暂时不需要就停流，所以必须排队。',
              '后果：轮灌的名义水量也是每户等量，但每开一次闸都有启动与湿润损失，本作品按"一日流量"的比例计入，于是总有效水量随户数增加而减少：默认场景下 8 户轮灌损失 371 m³，重旱年缺口比按户再多 167 m³。'
            ],
            en: [
              'The season is cut into n turns; each household commands the full flow during its turn. A river does not stop because one household does not need water yet, so turns must be queued.',
              'Consequence: nominal rotation volumes are also equal per household, but every opening of the gate costs a start-up and wetting loss, modelled here as a fraction of one day’s flow. Effective supply therefore falls as the number of turns grows: in the default scenario eight turns lose 371 m³, and in a severe drought year the shortfall is 167 m³ larger than under allocation by household.'
            ]
          }
        }
      ]
    },

    /* ---------------- 交互：水账本 ---------------- */
    {
      type: 'sim', id: 'lab', nav: { zh: '解剖台', en: 'Ledger' }, mount: 'waterLedger',
      eyebrow: { zh: '03 可操作的水账本', en: '03 An operable water ledger' },
      title: { zh: '换一种分法，看谁先不够', en: 'Switch the scheme and see who runs short' },
      lead: {
        zh: '下面这台水账本同时画三件事：上格是洛伦兹曲线（越贴近对角线越平均，三种规则各一条）；下格是每户的到手水量与需求（缺口就是红色那一段）；右侧是一条分水木刻——刻口宽度由算法按水权份额算出。改动户数、田亩差异度或来水量，三张图与下面的指标一起重算。',
        en: 'The ledger below draws three things at once: the Lorenz curve (closer to the diagonal means more even; one curve per scheme), per-household volume against demand (the red part is the shortfall), and a notched board whose notch widths are computed from the water shares. Change household count, land disparity or inflow, and all three redraw with the metrics.'
      }
    },

    /* ---------------- 四种水账（画廊） ---------------- */
    {
      type: 'gallery', id: 'proto', nav: { zh: '四种水账', en: 'Four ledgers' },
      eyebrow: { zh: '04 四种水账的形态', en: '04 Four shapes of a water ledger' },
      title: { zh: '把制度画成可以对比的四种图形', en: 'Four diagrams you can compare' },
      lead: {
        zh: '下面四张图不是装饰，是四种分法在同一组场景下的几何特征：水量条越平说明每户越接近等量，亩均条越平说明每块田越接近同深度，刻口条则是木头上的实际宽度。图形与数据出自同一个函数。',
        en: 'These four panels are not decoration but the geometry of the schemes under one scenario: flatter volume bars mean more equal volumes per household, flatter depth bars mean more equal depth per field, and the notch bars are the actual widths carved in wood. Pictures and numbers come from the same function.'
      },
      items: [
        { art: 'area', title: { zh: '按亩：田多水多', en: 'By area: more land, more water' }, caption: { zh: '亩均水量全等 → 亩均基尼 0；水量基尼 = 田亩基尼 0.0936', en: 'Equal depth per mu → per-mu Gini 0; volume Gini = land Gini 0.0936' } },
        { art: 'house', title: { zh: '按户：水量全等，亩均悬殊', en: 'By household: equal volumes, unequal depth' }, caption: { zh: '水量基尼 0；亩均基尼 0.0938；平水年缺口 764.4 m³', en: 'Volume Gini 0; per-mu Gini 0.0938; normal-year shortfall 764.4 m³' } },
        { art: 'rotate', title: { zh: '轮灌：等量但带输水损失', en: 'Rotation: equal but leaky' }, caption: { zh: '名义等量，扣除 8 次开闸损失后总水量少 371 m³', en: 'Nominally equal; after eight gate openings 371 m³ less in total' } },
        { art: 'notch', title: { zh: '木刻：把份额刻成宽度', en: 'The board: shares carved as widths' }, caption: { zh: '8 户刻口合计 0.315 m，最窄 28.2 mm，最宽 52.6 mm', en: 'Eight notches total 0.315 m; narrowest 28.2 mm, widest 52.6 mm' } }
      ]
    },

    /* ---------------- 数据 ---------------- */
    {
      type: 'dataviz', id: 'data', nav: { zh: '实测数据', en: 'Measured' },
      eyebrow: { zh: '05 本作品模型输出', en: '05 Output of this work’s model' },
      title: { zh: '同一场旱情下，三种分法的数字', en: 'One drought, three sets of numbers' },
      lead: {
        zh: '下表由 `algo.js` 在固定参数下算得（`node test/t04.test.cjs` 可复跑，33 条断言全通过）。全部数值都是本作品模型输出，不是任何村寨的统计值；来水量按"总需求 × 保证率"构造。',
        en: 'The table is computed by `algo.js` under fixed parameters (re-runnable via `node test/t04.test.cjs`, 33 assertions all passing). Every value is this work’s own model output, not a statistic of any village; inflow is constructed as “total demand × reliability”.'
      },
      bars: [
        { label: { zh: '按亩 · 平水年缺口率', en: 'By area · normal-year shortfall' }, value: 0, display: '0%' },
        { label: { zh: '按户 · 平水年缺口率', en: 'By household · normal-year shortfall' }, value: 6.87, display: '6.9%' },
        { label: { zh: '轮灌 · 平水年缺口率', en: 'Rotation · normal-year shortfall' }, value: 8.53, display: '8.5%' },
        { label: { zh: '按户 · 最大家庭亩均水（m³/亩）', en: 'By household · depth of largest farm' }, value: 358.87, display: '358.9' }
      ],
      table: {
        head: [
          { zh: '场景 / 规则', en: 'Scenario / rule' }, { zh: '分配总量 m³', en: 'allocated m³' },
          { zh: '缺口 m³', en: 'shortfall m³' }, { zh: '缺口率', en: 'gap rate' },
          { zh: '水量基尼', en: 'volume Gini' }, { zh: '亩均基尼', en: 'per-mu Gini' },
          { zh: '最小亩均 m³', en: 'min per mu' }
        ],
        rows: [
          ['平水年 100% · 按亩', '11130.7', '0', '0%', '0.0936', '0', '480'],
          ['平水年 100% · 按户', '11130.7', '764.4', '6.9%', '0', '0.0938', '358.87'],
          ['平水年 100% · 轮灌', '10759.7', '949.9', '8.5%', '0', '0.0938', '346.91'],
          ['一般干旱 75% · 按亩', '8348', '2782.7', '25.0%', '0.0936', '0', '360'],
          ['一般干旱 75% · 按户', '8348', '2828.8', '25.4%', '0', '0.0938', '269.15'],
          ['一般干旱 75% · 轮灌', '8069.8', '3072.2', '27.6%', '0', '0.0938', '260.18'],
          ['重旱 45% · 按亩', '5008.8', '6121.9', '55.0%', '0.0936', '0', '216'],
          ['重旱 45% · 轮灌', '4841.8', '6288.9', '56.5%', '0', '0.0938', '156.11']
        ]
      },
      note: {
        zh: '口径：默认场景 8 户、总田亩 23.189 亩、亩均需水定额 480 m³（本作品设定）、灌溉期 120 天、来水量按保证率相对定额总需求折算；轮灌的每次开闸损失取"一日流量 × 0.5"。以上全部为本作品算法输出，可复跑；换参数结果会变，作品不隐藏这一点。',
        en: 'Method: 8 households, 23.189 mu in total, water duty 480 m³/mu (a parameter set by this work), 120-day season, inflow scaled from the total duty demand by the reliability ratio; each rotation gate opening loses “one day of flow × 0.5”. All figures are this work’s computed output and can be recomputed; different parameters give different numbers, and the work does not hide that.'
      }
    },

    /* ---------------- 制度沿革 ---------------- */
    {
      type: 'timeline', id: 'time', nav: { zh: '沿革', en: 'Context' },
      eyebrow: { zh: '06 从习惯法到名录', en: '06 From customary rule to heritage list' },
      title: { zh: '一套分水规矩，如何被看见', en: 'How a water rule became visible' },
      lead: {
        zh: '以下节点的年代与名称以公开来源为准（见文末清单）。本作品不对制度的起源年代作学术结论；未标注来源的表述一律不写。',
        en: 'Dates and names below follow public sources (listed at the end). This work makes no scholarly claim about when the institution originated, and makes no unsourced statement.'
      },
      items: [
        { k: { zh: '长期沿用', en: 'long-standing' }, title: { zh: '木刻分水作为习惯制度', en: 'The notched board as customary rule' }, text: { zh: '公开资料常把分水木刻描述为哈尼梯田灌溉分配的传统凭证：按灌溉面积与修沟出力确定份额，把份额刻在木板上，作为分水的实物依据。', en: 'Public accounts commonly describe the notched board as the traditional record of irrigation shares in the Hani terraces: shares fixed by irrigated area and by each household’s contribution to channel digging, carved into wood as the material basis of allocation.' } },
        { k: { zh: '2010', en: '2010' }, title: { zh: '全球重要农业文化遗产', en: 'Globally Important Agricultural Heritage System' }, text: { zh: '云南红河哈尼稻作梯田系统被联合国粮农组织认定为全球重要农业文化遗产（公开资料常见表述）。', en: 'The Honghe Hani Rice Terraces System was recognised by FAO as a Globally Important Agricultural Heritage System (a common account in public sources).' } },
        { k: { zh: '2013', en: '2013' }, title: { zh: '世界遗产 · 文化景观', en: 'World Heritage cultural landscape' }, text: { zh: '红河哈尼梯田文化景观列入联合国教科文组织《世界遗产名录》。', en: 'The Cultural Landscape of Honghe Hani Rice Terraces was inscribed on the UNESCO World Heritage List.' } },
        { k: { zh: '近十余年', en: 'recent decade' }, title: { zh: '保护、旅游与劳动力外流', en: 'Safeguarding, tourism, out-migration' }, text: { zh: '梯田保护、旅游开发与青壮年外出务工同时发生，传统管水方式面临"谁来管水"的现实问题（公开讨论中常见议题）。', en: 'Terrace conservation, tourism development and out-migration of young labour happen at the same time, and the practical question of “who maintains the water rules” is a recurring topic in public discussion.' } },
        { k: { zh: '本作品', en: 'this work' }, title: { zh: '把规则做成可试算的对象', en: 'Making the rule testable' }, text: { zh: '本作品不替代任何村寨的分水决定，只提供一个可以拨动参数、查看结果的沙盘：换一种分法，谁先不够、差多少，能当场看到。', en: 'This work does not replace any village’s decision; it offers a sandbox where parameters can be moved and results seen: switch the scheme and watch who runs short, and by how much.' } }
      ]
    },

    /* ---------------- 术语库 ---------------- */
    {
      type: 'library', id: 'terms', nav: { zh: '术语', en: 'Lexicon' },
      eyebrow: { zh: '07 术语库（28 条）', en: '07 Lexicon (28 entries)' },
      title: { zh: '读懂这本水账需要的词', en: 'The words you need to read this ledger' },
      lead: {
        zh: '制度与遗产类术语以公开来源为限；算法与水工类术语按通用定义给出，并在释义中标明哪些是本作品的自设参数。',
        en: 'Institutional and heritage terms are limited to public sources; algorithmic and hydraulic terms follow standard definitions, and entries mark which quantities are parameters set by this work.'
      },
      terms: [
        { zh: '木刻分水', en: 'notched-board water allocation', def: { zh: '哈尼梯田中以刻有不同宽度缺口的木板作为分水凭证的习惯制度（公开资料常见表述）。', en: 'A customary rule in the Hani terraces that uses a wooden board with notches of different widths as the record of water shares.' } },
        { zh: '分水木刻', en: 'the notched board', def: { zh: '制度的实物载体：一块横跨水沟的木板，缺口宽窄对应各户应得份额。', en: 'The physical carrier: a board laid across the channel whose notch widths correspond to each household’s share.' } },
        { zh: '刻口', en: 'notch', def: { zh: '木板上让水流过的缺口；本作品中其宽度由算法按水权份额算出。', en: 'The opening that lets water pass; in this work its width is computed from the water share.' } },
        { zh: '水权', en: 'water right', def: { zh: '对某一水量或某一时段水流的支配资格；本作品把它量化为分配到户的水量。', en: 'Entitlement to a quantity or a time slot of flow; this work quantifies it as the volume allocated to a household.' } },
        { zh: '灌溉面积', en: 'irrigated area', def: { zh: '实际接受灌溉的田亩数，是"按亩分配"的权重。', en: 'The area actually irrigated; the weight used in allocation by area.' } },
        { zh: '亩', en: 'mu', def: { zh: '中国市制面积单位，1 亩 ≈ 666.67 m²；本作品统一按此换算。', en: 'A Chinese area unit, 1 mu ≈ 666.67 m²; used throughout this work.' } },
        { zh: '梯田', en: 'terraced field', def: { zh: '沿山坡等高线筑埂形成的水田，逐层承接上游来水。', en: 'Paddy fields built along hill contours, receiving water from the level above.' } },
        { zh: '水沟（沟渠）', en: 'irrigation channel', def: { zh: '把高山森林的水引到梯田的通道；分水木刻架设在其分水口处。', en: 'The conduit carrying water from the mountain forest to the terraces; the notched board sits at its division points.' } },
        { zh: '分水口', en: 'division point', def: { zh: '一条沟分成几条的地方，也是分配发生的地方。', en: 'Where one channel splits into several — and where allocation happens.' } },
        { zh: '按亩分配', en: 'allocation by area', def: { zh: '水量与田亩成正比的分法；本作品中亩均水量因此完全相同。', en: 'Volume proportional to area; in this work volume per mu is therefore identical for all.' } },
        { zh: '按户均分', en: 'allocation by household', def: { zh: '不论田亩、每户等量的分法；本作品中水量基尼为 0 但亩均差异被放大。', en: 'Equal volume per household regardless of area; here the volume Gini is zero while depth disparity is amplified.' } },
        { zh: '轮灌', en: 'rotational irrigation', def: { zh: '把灌溉期切成时段、各户轮流独占全流量的分法。', en: 'Dividing the season into turns, each household commanding the full flow in its turn.' } },
        { zh: '轮灌周期', en: 'rotation interval', def: { zh: '一轮轮灌所需的总时间；户数越多，单户时段越短。', en: 'Total time for one full round; more households mean shorter turns.' } },
        { zh: '灌溉定额', en: 'irrigation water duty', def: { zh: '单位面积在整个生育期需要的灌溉水量；本作品取 480 m³/亩作为设定参数，可调。', en: 'Irrigation water per unit area over the season; set here to 480 m³/mu as a parameter and adjustable.' } },
        { zh: '需水量', en: 'water demand', def: { zh: '某户按其田亩与定额算出的应得水量。', en: 'A household’s required volume, from its area and the duty.' } },
        { zh: '缺口', en: 'shortfall', def: { zh: '需求减去实际到手水量（不小于 0）的差额。', en: 'Demand minus delivered volume, floored at zero.' } },
        { zh: '溢出（弃水）', en: 'spill', def: { zh: '分配超出需求的部分，在田块间无法转移时即为浪费。', en: 'The part of an allocation exceeding demand; wasted if it cannot be transferred between fields.' } },
        { zh: '需求满足率', en: 'demand satisfaction ratio', def: { zh: 'min(分配给, 需求) 之和与总需求之比，衡量"有多少需求被真正满足"。', en: 'Sum of min(allocation, demand) over total demand — how much demand is actually met.' } },
        { zh: '有效水利用率', en: 'effective utilization ratio', def: { zh: '被真正用掉的水量与来水量之比；轮灌的启动损失会拉低它。', en: 'Water actually used over inflow; rotation start-up losses lower it.' } },
        { zh: '灌溉保证率', en: 'irrigation reliability', def: { zh: '来水量相对"刚好满足定额需求"的比值；本作品用它构造丰水年与干旱年。', en: 'Inflow relative to “just enough to meet duty demand”; used here to construct wet and dry years.' } },
        { zh: '基尼系数', en: 'Gini coefficient', def: { zh: '衡量分布不均等的指标，0 为完全平均、1 为完全集中；本作品给出"水量基尼"与"亩均基尼"两种口径。', en: 'A measure of inequality: 0 perfectly even, 1 perfectly concentrated; this work reports both volume Gini and per-mu Gini.' } },
        { zh: '洛伦兹曲线', en: 'Lorenz curve', def: { zh: '按份额从小到大累积绘出的曲线，越贴近对角线越平均；基尼系数等于其与对角线间面积的两倍。', en: 'The cumulative share curve from smallest to largest; closer to the diagonal means more even, and the Gini equals twice the area between it and the diagonal.' } },
        { zh: '矩形薄壁堰', en: 'rectangular sharp-crested weir', def: { zh: '用一块薄板上的矩形缺口量水的构筑物；木刻分水的刻口在形式上与它同类。', en: 'A measuring structure using a rectangular notch in a thin plate; a notch in the wooden board is formally the same kind of device.' } },
        { zh: '堰流公式', en: 'weir equation', def: { zh: 'Q = (2/3)·Cd·√(2g)·b·h^1.5，流量与宽度成正比、与水头的 1.5 次方成正比。', en: 'Q = (2/3)·Cd·√(2g)·b·h^1.5 — linear in width, to the 1.5 power in head.' } },
        { zh: '流量系数', en: 'discharge coefficient', def: { zh: '堰流公式中的经验系数；本作品取 Cd = 0.62（工程常用值）。', en: 'The empirical coefficient in the weir equation; 0.62 here, a common engineering value.' } },
        { zh: '四素同构', en: 'forest–village–terrace–water system', def: { zh: '公开资料常用以概括哈尼梯田"森林—村寨—梯田—水系"相互支撑的整体结构。', en: 'A phrase used in public sources for the mutually supporting forest–village–terrace–water structure of the Hani terraces.' } },
        { zh: '可复算', en: 'recomputable', def: { zh: '任何人用同一份代码与同一组参数都得到同一组数字。', en: 'Anyone running the same code with the same parameters obtains the same numbers.' } },
        { zh: '反向验证', en: 'reverse verification', def: { zh: '故意注入已知缺陷，确认判定器会失败，以证明判定有效。', en: 'Injecting a known defect to confirm that the checker fails — proving the checker works.' } }
      ]
    },

    /* ---------------- 来源与披露 ---------------- */
    {
      type: 'sources', id: 'src', nav: { zh: '来源', en: 'Sources' },
      eyebrow: { zh: '08 来源与披露', en: '08 Sources & disclosure' },
      title: { zh: '每一条事实的去处', en: 'Where every fact comes from' },
      lead: {
        zh: '本作品把材料分成两类：来自公开资料的"制度与遗产事实"，和由本作品算法算出的"模型输出"。两类不混写、不互证。',
        en: 'Materials fall into two classes: institutional and heritage facts from public sources, and outputs computed by this work’s model. They are never mixed or used to corroborate each other.'
      },
      refs: [
        { text: { zh: 'UNESCO 世界遗产中心：<b>Cultural Landscape of Honghe Hani Rice Terraces</b>（红河哈尼梯田文化景观，2013 年列入《世界遗产名录》）', en: 'UNESCO World Heritage Centre: <b>Cultural Landscape of Honghe Hani Rice Terraces</b> (inscribed 2013)' }, url: 'https://whc.unesco.org/en/list/1111/' },
        { text: { zh: '联合国粮农组织（FAO）全球重要农业文化遗产（GIAHS）：<b>Honghe Hani Rice Terraces System</b>（云南红河哈尼稻作梯田系统，2010 年认定）', en: 'FAO Globally Important Agricultural Heritage Systems (GIAHS): <b>Honghe Hani Rice Terraces System</b> (recognised 2010)' }, url: 'https://www.fao.org/giahs/giahs-around-the-world/china/en/' },
        { text: { zh: '红河哈尼族彝族自治州人民政府《红河概况》（地理、梯田与民族文化概况）', en: 'Honghe Hani and Yi Autonomous Prefecture Government, “Overview of Honghe” (geography, terraces, ethnic culture)' }, url: 'https://www.hh.gov.cn/zjhh/hhgk.htm' },
        { text: { zh: '公开科普报道《哈尼梯田与分水木刻》：分水木刻作为灌溉分配制度实物载体的常见描述（用于制度定性描述，不取其统计数字）', en: 'Public popular-science article “Hani terraces and the notched board”: the common description of the board as the material carrier of irrigation shares (used only for qualitative description, no statistics taken from it)' }, url: 'https://m.sohu.com/a/153056764_99924506' },
        { text: { zh: '本作品算法实现：algo.js（场景生成 / 三种分水规则 / 基尼系数 / 堰流与刻口 / 干旱扫描），node test/t04.test.cjs 33 条断言', en: 'This work’s algorithm: algo.js (scenario generation, three allocation schemes, Gini, weir and notch plan, drought sweep); 33 assertions in node test/t04.test.cjs' } },
        { text: { zh: '本作品模型输出：test/stats.json（五个场景 × 三种规则的实测表，固定参数可复跑）', en: 'This work’s model output: test/stats.json (five scenarios × three schemes, re-runnable under fixed parameters)' } }
      ],
      disclosure: [
        {
          title: { zh: 'AI 工具使用情况', en: 'Use of AI tools' },
          text: {
            zh: [
              '文本：初稿由大语言模型辅助起草，团队逐条核校制度与遗产表述，凡无法落到来源的句子一律删除或标注"公开资料常见表述"。',
              '代码：分配算法、基尼系数、堰流公式与界面由团队开发；大语言模型参与代码建议与排错。断言是否成立由实际运行结果决定，不由模型声称。',
              '图像与声音：全部由本作品代码实时生成（Canvas 绘图；Web Audio 合成），未使用任何生成式图像/音频模型，未使用任何图库素材。'
            ],
            en: [
              'Text: drafted with LLM assistance, then fact-checked line by line; sentences that could not be traced to a source were deleted or hedged as “a common account in public sources”.',
              'Code: the allocation algorithms, Gini computation, weir formula and interface were developed by the team; the LLM was used for suggestions and debugging. Whether an assertion holds is decided by running it.',
              'Images and sound: generated in real time by this work’s own code (Canvas drawing; Web Audio synthesis). No generative image or audio model was used, and no stock assets are included.'
            ]
          }
        },
        {
          title: { zh: '第三方资源与许可', en: 'Third-party resources' },
          text: {
            zh: ['无。作品零外部依赖：不加载任何网络资源、外部字体、第三方 JS 库、图片或音频素材；字形使用系统字体。'],
            en: ['None. Zero external dependencies: no network resources, web fonts, third-party JS libraries, images or audio. Typefaces are system fonts.']
          }
        },
        {
          title: { zh: '团队分工与原创贡献（匿名）', en: 'Team roles and original contribution (anonymized)' },
          text: {
            zh: [
              '成员 A：算法与前端开发（三种分水规则、基尼系数与洛伦兹曲线、堰流与刻口、水账本交互与绘图）。',
              '成员 B：制度与遗产资料核校、文案（术语释义、来源比对、事实查证，含"不虚构统计数字"口径把关）。',
              '成员 C：视觉设计与展示材料（封面母题、截图、演示视频、展板）。',
              '指导教师：内容导向与原创性把关。'
            ],
            en: [
              'Member A: algorithms and front-end development (three allocation schemes, Gini and Lorenz curve, weir and notch plan, ledger interaction and drawing).',
              'Member B: verification of institutional and heritage material, writing (definitions, source comparison, fact-checking, including the “no invented statistics” rule).',
              'Member C: visual design and presentation materials (cover motif, screenshots, demo video, poster).',
              'Supervising teacher: content orientation and originality review.'
            ]
          }
        },
        {
          title: { zh: '已知局限（如实声明）', en: 'Known limitations (stated plainly)' },
          text: {
            zh: [
              '村寨的一切数量（户数、田亩、来水量、定额、损失比例）都是本作品设定的合成参数，用于演示模型的敏感性与后果；**不是任何真实村寨的统计数字**，也不可用于推算真实分配。',
              '模型是"水量账"级别的一阶模型：只算总量与时段，不含作物生育期响应、土壤含水、蒸发蒸腾过程与地下水；不构成灌溉设计或水权仲裁依据。',
              '木刻刻口按矩形薄壁堰估算（Cd=0.62、水头 5 cm），真实刻口形状、磨损与安装误差都会改变流量；本作品的刻口宽度只是数量级的工程估算。',
              '本作品未开展田野调查与访谈，未取得任何村寨的实际分水记录；制度的实际运行方式（谁主持、如何议定、如何处罚）不在本作品范围内。'
            ],
            en: [
              'Every quantity describing the village (household count, areas, inflow, duty, loss fraction) is a synthetic parameter set by this work to demonstrate model sensitivity and consequences; **none is a statistic of any real village**, and none may be used to infer real allocations.',
              'The model is a first-order water-volume ledger: totals and turns only, without crop-stage response, soil moisture, evapotranspiration or groundwater. It is not a basis for irrigation design or water-rights arbitration.',
              'Notches are estimated as rectangular sharp-crested weirs (Cd = 0.62, head 5 cm); real notch geometry, wear and installation error change the discharge, so the widths here are order-of-magnitude engineering estimates.',
              'No fieldwork or interviews were conducted and no actual allocation records were obtained; how the institution is actually run (who convenes, how shares are agreed, how breaches are handled) is outside this work’s scope.'
            ]
          }
        }
      ]
    }
  ]
};
