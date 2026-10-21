import test from 'node:test';
import assert from 'node:assert/strict';
import { compile, anchorTime, captionText, toSrt } from '../scripts/compile.mjs';

const voice = (d, words) => ({ file: 'x.mp3', duration: d, words });
const W = (w, s, e) => ({ w, s, e });

test('anchor resolves to the start of the spoken word', () => {
  const v = voice(3, [W('连', 0.1, 0.3), W('接', 0.3, 0.5), W('B', 0.6, 0.8), W('C', 0.8, 1.0), W('1', 1.0, 1.2), W('。', 1.2, 1.3)]);
  assert.equal(anchorTime('BC₁', { say: '连接BC₁。' }, v), 0.6);
  assert.equal(anchorTime('{BC1}', { say: '连接BC₁。' }, v), 0.6);
  assert.equal(anchorTime(1.5, {}, v), 1.5);
  assert.equal(anchorTime('不存在', { say: 'abc' }, v), null);
});

test('compile: scene title, anchored ops, sequential writes, duration', () => {
  const lesson = {
    meta: { style: 'lab' },
    scenes: [{ title: '第(1)问', goal: '证明 {DE}', beats: [
      { say: '连接BC₁，写下来。', do: [{ fig: 'seg', a: 'B', b: 'C1', role: 'aux', at: 'BC₁' }, { write: '连接 {BC1}' }, { write: '第二行' }] },
      { say: '下一句。', do: [{ emph: 'last' }, { cam: 'face', target: ['B', 'C', 'C1', 'B1'], tag: '正对' }] },
    ] }],
  };
  const v1 = voice(2, [W('连', 0, 0.2), W('接', 0.2, 0.4), W('B', 0.5, 0.6), W('C', 0.6, 0.7), W('1', 0.7, 0.8)]);
  const v2 = voice(1, [W('下', 0, 0.3)]);
  const tl = compile(lesson, [v1, v2]);
  assert.equal(tl.style, 'lab');
  const title = tl.ops.find((o) => o.role === 'title');
  assert.equal(title.tag, '第(1)问');
  const seg = tl.ops.find((o) => o.op === 'seg');
  const t0 = tl.captions[0].at;
  assert.ok(Math.abs(seg.at - (t0 + 0.5)) < 1e-9, 'seg anchored to "B"');
  const writes = tl.ops.filter((o) => o.kind === 'write');
  for (let i = 1; i < writes.length; i++) assert.ok(writes[i].at >= writes[i - 1].at + writes[i - 1].dur, 'writes do not overlap');
  const emph = tl.ops.find((o) => o.kind === 'emph');
  assert.equal(emph.target, writes[writes.length - 1].id);
  assert.deepEqual(tl.ops.find((o) => o.kind === 'cam').face, ['B', 'C', 'C1', 'B1']);
  assert.ok(tl.duration > tl.captions[1].end);
  assert.deepEqual(tl.warnings, []);
});

test('captions and srt', () => {
  assert.equal(captionText('**{DE}** ∥ 平面 {BCC1B1}'), 'DE ∥ 平面 BCC₁B₁');
  assert.match(toSrt([{ at: 1.5, end: 3.25, text: 'hi' }]), /00:00:01,500 --> 00:00:03,250/);
});

test('long captions are split at punctuation and stay in order', async () => {
  const words = Array.from({ length: 40 }, (_, i) => ({ w: 'x', s: i * 0.1, e: i * 0.1 + 0.1 }));
  const caps = (await import('../scripts/compile.mjs')).splitCaption;
  const out = caps('取 BC 的中点 H，DH 平行于 AC，所以 DH 也垂直于这个平面，DH 就是所求距离。', { duration: 4, words }, 10);
  assert.ok(out.length >= 2);
  out.forEach((c) => assert.ok(c.text.length <= 26, c.text));
  for (let i = 1; i < out.length; i++) assert.ok(out[i].at >= out[i - 1].at);
  assert.equal(out[0].at, 10);
});
