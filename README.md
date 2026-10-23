# 木刻分水 · The Notched Ledger

哈尼梯田木刻分水制度的可计算水账本。

把「木刻分水」这套乡土水权制度落成三种可执行规则（按亩 / 按户 / 按时段轮灌），
实时算出每户水量、基尼系数、干旱缺口，并用矩形薄壁堰公式把水权份额反算成刻口宽度。

- 纯静态单页，零依赖、可离线运行
- 中英双语切换
- 第 05 章「推演台」：把名义分配推进到真实到田（输水链 / 稳健性 / 私刻口 / 多准则推荐 / 灌溉期）
- 在线访问：<https://kacy-kx.github.io/hani-muke-fenshui/>

## 本地预览

直接双击 `index.html`，或：

```bash
python -m http.server 8000
# 打开 http://localhost:8000
```

## 文件构成

| 文件 | 作用 |
|---|---|
| `algo.js` | 名义分配算法内核（纯函数，Node/浏览器双用） |
| `engine.js` | 推演层内核：输水链、蒙特卡洛、私刻口、TOPSIS、灌溉期日过程 |
| `sim.js` | 第 04 章水账本交互模块 |
| `bench.js` | 第 05 章推演台交互模块（5 个标签页） |
| `content.js` | 全站文案与数据（中英双语） |
| `app.js` / `core.js` | 渲染器与基础工具 |
| `deck/index.html` | 答辩演示（20 页单文件 HTML，截图已 base64 内嵌） |

## 答辩演示（20 页）

`deck/index.html` 是答辩用演示文稿（单文件 HTML，可离线双击打开）。

- ← / → 翻页，F 全屏，自动适配 16:9
- 在线访问：<https://kacy-kx.github.io/hani-muke-fenshui/deck/>
- 独立地址（推荐现场使用）：<https://kacy-kx.github.io/muke-fenshui-deck/>
