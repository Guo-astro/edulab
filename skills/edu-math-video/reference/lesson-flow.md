# 板书模板流程（chalk / lab / whiteboard / notebook）

选了四种板书模板之一时，按本文件做，**代替** SKILL.md 的第 4~11 步（第 1 步解题、第 0 步选模板和配音照常）。
`LESSON` = `SKILL/lesson`，`PROJ` = `WS/<ascii_folder_name>`（用户当前目录下的视频文件夹）。

与手绘模板的区别：不写 anim.js，而是写一个声明式的 `lesson.json`（讲稿 + 板书 + 图形动作），引擎自动排版、擦黑板、算立体图虚实线、转视角；字幕只有中文（逐字高亮），没有背景音乐；同一份 lesson.json 四种风格随时切换。

## L1. 环境

1. `LESSON/node_modules` 不存在 → **先问用户**，同意后在 `LESSON` 执行 `npm install`（playwright、katex、字体，约 100 MB，只装一次）。
2. 有 `ffmpeg`（系统安装，或工作区 `node_modules/ffmpeg-static`）；有 Chrome（没有就 `cd LESSON && npx playwright install chromium`）。
3. 配音 key 已在 SKILL.md 第 0 步用 `tts.py check` 确认过（`READY`）；没做就先回去做，key 不通过不要写 lesson.json。**不要打印或回显密钥。**

## L2. 写讲稿 `PROJ/lesson.json`

格式见 [../lesson/reference/lesson-schema.md](../lesson/reference/lesson-schema.md)，讲法见 [../lesson/reference/teaching-guide.md](../lesson/reference/teaching-guide.md)，图形见 [../lesson/reference/figures.md](../lesson/reference/figures.md)。完整范例：`LESSON/examples/prism-de/lesson.json`（高中立体几何，两问）、`examples/parabola`（函数图像）、`examples/triangle`（平面几何）。

- `meta.style` 写第 0 步选的模板，`meta.tts` 写选的配音引擎，`meta.problem` / `meta.answer` 记录题目和答案。
- 每小问一个 scene；scene 内按"审题 → 思路 → 板书 → 小结"组织 beats。
- 一个 beat = 一句口播（`say`）+ 这句话期间发生的动作（`do`）。动作用 `"at": "关键词"` 对齐到口播里的词。
- 板书每行 ≤ 22 个汉字左右；结论行用 `!!…!!` 并跟 `{"emph": "last"}`。
- 需要空间想象时用 `cam` 动作转动视角（`"cam": "face"` 会自动选出正对某个面的最佳角度），讲完转回 `home`。
- 几何题作图坐标：直角顶点放原点、棱沿坐标轴、数值取第 1 步算出的真实值，这样图与题完全吻合。

## L3. 免费预览：版面 + 读音（不调 TTS）

```bash
node LESSON/scripts/make.mjs PROJ/lesson.json --preview
```
- 按估算时长构建无声的 `preview.html` 并截图，不花钱。
- 输出 JSON 的 `warnings`（锚点没找到、`读音未固定` 等）和 `layout` 必须清零，退出码 3 = 还有问题：
  - `overflow-x` / `overflow-y`：板书行太长 / 一页写不下 → 拆行、精简。
  - `label-overlap`（两个图形标签重叠）、`label-under-board` / `label-under-tip` / `label-under-caption`（标签被板书、提示框、字幕盖住）、`label-outside`（出画）→ 换 `camera.home` 或 `cam` 角度、调 `figure.zoom`、减少同时显示的线，或把 `tip` 挪到别的句子。这些是程序量出来的，不用靠看图找。
  - `读音未固定`：直接在 `say` 里给该字标音 `当[dāng]`（字幕会自动去掉标注）。
- 然后**只看拼图 `sheets`**（每张 12 帧，左上角是时间）：确认关键线清楚、旋转角度能说明问题、图与题意一致。拼图上看不清的那一帧再打开 `check/` 里的单张原图。完整报告在 `check/report.json`，一般不用读。

## L4. 真正配音 + 检查

```bash
node LESSON/scripts/make.mjs PROJ/lesson.json --no-render          # --tts <引擎> 可临时覆盖 meta.tts
```
- `warnings` / `layout` 仍须为 0。板书内容和图形不随时长变化，所以**只要这两项为 0 就不用再看一遍拼图**；不为 0 时修完再看对应的那几帧。
- 每句配音按文本缓存在 `PROJ/build/tts/`，改了某句只会重新合成那一句。

## L5. 打开预览给用户看

`open PROJ/preview.html`：在浏览器里直接播放（带配音），点画面或 ▶ 播放/暂停，拖进度条跳转，←/→ 快退/快进 5 秒，右下角可切换四种板书风格。预览和导出的 MP4 用的是同一个渲染引擎，画面一致。
**用户想换成另一种板书风格**：`make.mjs ... --style <s> --no-render` 重建即可（配音有缓存，不重新花钱）。想换成手绘模板则要按 handdrawn-flow.md 重做。

## L6. 问要不要导出 MP4（可选）

用户在请求里已经说了要视频文件 / 要发给别人 / 要上传，就直接导出；说了只要预览就不导出。否则用 AskUserQuestion 问一句"要不要导出 MP4？"：
- "先不导出"：说明 `preview.html` 已经可以直接播放；但它依赖本机的技能字体和同目录的 `audio.wav`，**只能在这台电脑上看**。
- "导出 MP4"：说明需要大约视频时长 2～3 倍的时间，适合发给别人、上传平台、在手机上看。

用户选导出时：
```bash
node LESSON/scripts/render.mjs PROJ
```
4 路并行渲染。完成后用 `ffprobe` 确认时长与分辨率（1920×1080），并抽 2～3 帧用 Read 查看。用户以后想要 MP4，随时跑这一条即可（不用重新配音）。

## L7. 交付

告诉用户：`PROJ/preview.html`（直接播放）、`subtitles.srt` 的路径；导出了的话再加 `video.mp4`、`cover.png`；视频时长，所用模板和配音引擎（音色），以及题目最终答案。没导出时提一句"要 MP4 随时说"。**说明你无法听音频，请用户试听读音**，特别列出你标注过读音的字。

## 故障处理

| 现象 | 处理 |
|---|---|
| `XXX_API_KEY is missing` | 按 tts-setup.md 引导用户配置，或换引擎 |
| `TTS 失败（shared/tts.py 退出码 1）` | 看上方输出是哪一句、哪个错误码（tts-setup.md 报错表）；其余句子有缓存 |
| `找不到装了 requests + pypinyin 的 python` | `PY -m pip install --user requests pypinyin`，或 `PY=/path/to/python3 node ...` |
| `这是 --preview 构建（没有配音）` | 去掉 `--preview` 重新构建再渲染 |
| `锚点未找到` | 锚点词要逐字出现在 `say` 中（字母大小写一致），或改用数字秒数 |
| `overflow-x` | 该行太长：拆成两行或精简 |
| 标签重叠 / 图太挤 | 换 `camera.home` 角度、减少同时出现的辅助线、`figure.zoom` 调到 0.7 |
| 测试 | `cd LESSON && npm test`（编译器/图形/读法的单元测试） |
