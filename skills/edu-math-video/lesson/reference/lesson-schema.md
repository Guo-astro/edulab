# lesson.json 格式

```jsonc
{
  "meta": {
    "title": "直三棱柱中的线面平行与线面距离",   // 预览页标题
    "grade": "高二", "topic": "立体几何",         // 黑板角落显示
    "style": "chalk",                             // chalk | lab | whiteboard | notebook（--style 可覆盖）
    "speechRate": 0,                              // 语速 [-50,100]（-10 = 0.9 倍速）；小学建议 -10；不写 = 引擎默认
    "tts": "doubao",                              // 配音引擎 glm | doubao | minimax | edge | say（--tts 可覆盖；不写 = TTS_ENGINE / 自动）
    "problem": "题干原文", "answer": "最终答案"     // 记录用
  },
  "figure": { ... },                              // 见 figures.md；纯代数题可省略（板书占满全宽）
  "scenes": [ Scene, ... ]
}
```

## Scene

```jsonc
{
  "title": "第(1)问",        // 板书标题前缀（白板风格显示为红色标签）
  "short": "线面平行",       // lab 风格顶部步骤条上的名字
  "goal": "证明：{DE} ∥ 平面 {BCC1B1}",   // 标题行内容
  "beats": [ Beat, ... ]
}
```
每个 scene 开始时自动"擦黑板"翻到新的一页。

## Beat

```jsonc
{
  "say": "所以 DE 是这个三角形的中位线，DE 平行于 BC₁。",   // 字幕（≤26 字自动分行）
  "speak": "…",       // 可选：TTS 实际朗读的文本；缺省时由 say 自动转换（字母逐个读、符号转读法）
  "pause": 0.35,      // 可选：这句之后的停顿秒数
  "do": [ Action, ... ]
}
```

## 文本记号（write / tip / goal / tag 中可用）

| 写法 | 效果 |
|---|---|
| `{BC1}` | 数学斜体，数字变下标：*BC*₁ |
| `$x^2-2x$` | 任意 KaTeX 公式 |
| `**…**` | 重点色 |
| `==…==` | 荧光笔涂抹（写完后扫出） |
| `!!…!!` | 结论色 |

## Action（所有动作都可带 `"at"`、`"delay"`、`"dur"`、`"id"`）

- `"at"`：字符串 = 对齐到口播中该词开始的时刻；数字 = 距本句开始的秒数；缺省 = 按顺序均匀分布在这句话里。
  豆包、MiniMax 返回逐字时间戳，锚点精确到字；GLM / edge / say 没有时间戳，按该词在 `say` 中的位置比例估算（略有偏差，重要的同步点可改用数字秒数）。
- `"delay"`：在 at 基础上再推迟的秒数。
- `"id"`：给动作起名，供 `hide` / `emph` 引用。

| 动作 | 示例 | 说明 |
|---|---|---|
| 写一行板书 | `{"write": "连接 {BC1}，", "role": "note"}` | role 可选 `note`（小号注释）；多行依次写，自动排版、满页自动翻页 |
| 强调已写的行 | `{"emph": "last", "text": "答案\n1"}` | chalk/whiteboard 画圈，lab 发光框，notebook 盖章（`text` 为章上文字） |
| 提示 | `{"tip": "看到**中点**想中位线", "hold": 5}` | chalk 黄框、lab 提示框、whiteboard 便利贴、notebook 猫头鹰气泡；`hold` 秒后消失 |
| 画线段 | `{"fig": "seg", "a": "B", "b": "C1", "role": "aux"}` | role：`edge` `given` `aux`（辅助线）`key`（关键线）`axis`；`"dash": true` 强制虚线 |
| 填充面 | `{"fig": "poly", "pts": ["A","B","C1"], "role": "tri"}` | role：`tri` `plane` `plane2`；或 `"fill": "#e03131", "opacity": 0.85` 指定任意颜色（如涂色题） |
| 新增点 | `{"fig": "point", "name": "F", "mid": ["A","C"]}` | 或 `"pos": [x,y,z]`；默认显示点和标签，`"show": false` 只定义不显示 |
| 点 / 标签 | `{"fig": "dot", "p": "P"}` / `{"fig": "label", "p": "P", "text": "P"}` | |
| 平行标记 | `{"fig": "par", "a": "D", "b": "E", "role": "key", "n": 1}` | 线段中点的箭头，`n` 为箭头个数 |
| 直角标记 | `{"fig": "rt", "v": "F", "a": "D", "b": "C"}` | 在顶点 v 处、朝 a 和 b 方向 |
| 角弧 | `{"fig": "angle", "v": "E", "a": "D", "b": "F", "text": "45°"}` | |
| 坐标轴 | `{"fig": "axes", "origin": "C", "names": ["x","y","z"]}` | 立体图建系时用 |
| 函数曲线 | `{"fig": "curve", "f": "x^2-2*x+3", "from": -1, "to": 3, "label": "y=f(x)"}` | 仅 graph |
| 图上文字 | `{"fig": "text", "p": "E", "text": "1", "dx": 10}` | |
| 隐藏 | `{"hide": "tri1"}` | 让之前带 id 的图形淡出 |
| 转视角 | `{"cam": "face", "target": ["B","C","C1","B1"], "tag": "正对平面 {BCC1B1}"}` | 自动选最佳角度；`tag` 显示在图右上角 |
| | `{"cam": "view", "az": 275, "el": 22}` | 指定方位角/仰角（度） |
| | `{"cam": "spin", "daz": 90}` | 相对转动 |
| | `{"cam": "home"}` | 回到初始视角 |
| 翻页 | `{"clear": true}` | 强制擦黑板 |

## 时间规则（编译器自动处理）

- 板书行不会重叠：后一行最早在前一行写完时开始。
- 写一行的时长 ≈ 字数 × 0.085 秒（0.5～2.4 秒）。
- 一句话的时长 = max(口播时长, 最后一个动作结束) + `pause`。
