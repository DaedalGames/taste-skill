// tasteskill / scenes / warp-jump.js — a manifesto over a warp field that heats up with the scroll, then
// a jump through the vanishing point into the brand colour.
//
// The stage holds while a full-bleed canvas of radial streaks speeds up with the scroll: more rays,
// longer and thicker trails, and the streaks heat from the ink colour into the accent. Over it a centred
// uppercase manifesto changes in timed beats: letters arrive out of the vanishing point and leave by
// flying past the camera. An anchor word with two or three endings, then a ring of short principles,
// then a final line. At the end the camera jumps: the centre opens, a disc of the accent swallows the
// field, and the reader lands in the next section, which carries the accent on. For one long statement
// on a tech, research or launch page, or (enter: 'photo') as the portal from a photographic chapter to
// an abstract one. Write the copy fresh for the subject.
//
// DOM. The script adds the canvas, the ink copy of the final line, the count and the photo copies.
//
//   <section class="scene" data-scene="warp-jump" aria-label="What we hold to" data-options='{}'>
//     <div class="scene-stage">
//       <div class="warp-copy">
//         <div class="warp-statement">
//           <h2 class="warp-anchor">A star</h2>             1-2 words, 10 letters or fewer
//           <p class="warp-tail">in a steel box</p>        2-3 endings of 2-4 words, one line each: 16 letters
//           <p class="warp-tail">on the grid</p>            or fewer (12 keeps the full size on a phone)
//         </div>
//         <ol class="warp-points">                         3-12 principles: two short sentences, 4-8 words,
//           <li class="warp-point">Measure twice. Fire once.</li>      40 letters or fewer; each sentence
//           …                                                          is set on its own line
//         </ol>
//         <p class="warp-final">See you at first light</p> 3-6 words, two lines
//       </div>
//     </div>
//   </section>
//   <section style="background: var(--accent)">…</section>  the next section continues in the accent
//
//   enter 'photo' adds, inside .scene-stage before .warp-copy:
//     <figure class="warp-photo"><img src="…" alt="…" width="2000" height="1250"></figure>   1600px+ wide:
//                                                           aerial, terrain, machine, a city at night
//     <p class="warp-lead">One sentence of 8-16 words, read over the photograph.</p>
//
// Any part may be left out (no endings, no points, no final line); the beats close up. The principles
// come four at most to a beat (5-6 make two beats of three, 12 make three of four), so the hold grows
// with them. Each statement line is fitted to the stage on its own: a longer ending than the guide is
// set smaller (never under 0.6 of the anchor; past that it breaks into two balanced lines) and never
// shrinks the anchor, which keeps at least 0.8 of its size. The final line takes a wider measure first,
// then a smaller size down to 0.6, then a third line.
//
// Tokens (on :root or the section): --warp-ground (default var(--ground-dark, #050607): a near-black, or
// the page's darkest tone), --warp-ink (var(--ink-light, #eeeeea)), --warp-accent (var(--accent, #ff5b24):
// any hue but violet, indigo or purple, light enough to read as a 1px line on black, L* 55 or more),
// --font-display (the uppercase display face; a wide or heavy grotesk, 800, wdth 112 if it has the axis),
// --font-text. The final line is set in the ground colour on the accent, or in the ink when the ground
// would fall under 4.5:1 there. The section after the scene takes var(--warp-accent) as its background.
//
// Options (data-options JSON). Default, then range:
//   exit       'disc'    'disc' a disc of the accent opens at the vanishing point and swallows the field;
//                        'flood' the scrim leaves (84-88%), the streaks turn accent, lengthen and thicken
//                        into a solid tunnel by 91%, the final line turns to the exit ink in one 0.25s step
//                        at 89% and a flat accent layer settles under it; 'release' no exit, the field
//                        holds at full speed and the page scrolls on (the next section can be any colour)
//   enter      'field'   'field' the scene opens on the running field with the first statement read;
//                        'photo' it opens on .warp-photo with .warp-lead read, then zooms through the
//                        picture into the field (adds one screen to the hold)
//   speed      1         0.5-1.4  clock of the field; with accentMax it is the restraint dial:
//                        0.5 / 0.25 calm and mostly ink, 1 / 0.5 the default, 1.4 / 0.7 a loud launch
//   accentMax  0.5       0.2-0.7  most of the rays the accent may take
//   rays       1100      600-1600 rays at full speed on desktop (under 1024px 700; phones 600); half
//                        of them are already drawn at 0
//   hold       auto      3-8      screens held on desktop; auto = beats + 1 (+1 for 'photo')
//   phoneHold  auto      3-7      screens held under 768px; auto = beats (+1 for 'photo')
//   phone      'same'    'same' runs the phone plan (fewer rays, a centred column of principles);
//                        'rest' shows the finished composition on phones
//   scrub      0.5       seconds of catch-up, or true
//   count      true      a plain "2 of 4" in the bottom-left corner while the beats run
//
// Progress map (desktop 1440x900, 2 endings + 4 points + final = 4 beats, hold 5). Beat k starts at
// k x 0.84 / beats: 0, 0.21, 0.42, 0.63; the jump runs 0.84 to 1. Field speed d = (p / 0.84)^0.9;
// rays drawn = rays x (0.5 + 0.5d); trail = 0.2 + 0.35d^1.1 (+0.4 in the jump); rim width 3.2 + 2.6d px
// (narrower toward the vanishing point, never under 1px). The field is at warp speed from the first
// frame: the scrim keeps the title readable, so the opening can be loud. The text changes in timed
// beats (0.6s in, 0.32s out) when the playhead crosses a start, never scrubbed, so every rest shows
// whole words at full opacity; each change of beat also surges the field's speed.
//   0%    anchor + ending 1 read, centred on the dark scrim; 550 streaks already running (rim streaks
//         about 180px long, 3.2px wide; the field never stops: it has its own clock, and scrolling pushes
//         it), mostly ink, 15% accent. "1 of 4".
//   21%   ending 1 flies past the camera, ending 2 arrives out of the centre; the anchor stays.
//   25%   anchor + ending 2; about 735 rays, rim streaks about 270px and 4px wide, 27% accent.
//   40-44% the scrim lifts to 0.3 and the field dims to 0.85 for the principles.
//   42%   the statement flies out; four principles stream out of the centre onto ground plates (0.9)
//         around the void, 0.09s apart, settled within 0.9s.
//   50%   the principles fly past: each drifts outward along its ray (-1.5% to +6% of the width) and
//         grows from 0.9 to 1.25 over its beat, as if the camera passed between them.
//   60-64% scrim and field come back to full.
//   63%   the principles leave; the final line arrives and pushes from scale 1 to 1.06 until 84%.
//   75%   dense, long, thick rays (about 450px at the rim, 5.5px wide), 47% accent.
//   82%   the field accelerates into the jump (trails run from the centre to the rim).
//   84%   the count fades; the accent disc opens at the vanishing point (power1.in, radius growing with
//         the square of time: the fall accelerates) under the final line, whose letters turn to the exit
//         ink inside it, to the pixel.
//   90%   disc radius about 150px; the canvas lurches forward (scale to 1.12); nothing is drawn under the disc.
//   98%   the disc covers the stage; the canvas has faded out and stops drawing at 98.5%.
//   100%  a flat accent stage with the final line in the exit ink; the next section carries on.
// Phone (390x844): hold 4, 600 rays at DPR 1, rim width x 0.85 (2.7 to 4.9px), type min(11vw, 7.5svh)
// fitted to 90% of the width, the principles in a centred column (four at most a beat), char stagger
// 0.012s, canvas lurch 1.08. Same fractions.
//
// Cost. The field is one canvas; each streak is a rectangle along its ray (fillRect under a rotation,
// which the GPU batches by colour), about 0.6ms of script a frame. The scrim is a separate small canvas
// drawn once per layout, so its fades are compositor-only. The field draws at the CSS pixel and only
// while the scene is near the screen. A machine that keeps dropping frames steps down on its own: fewer
// rays, then a coarser canvas (phones: 360 rays). Letters move with 2D transforms, so no burst of
// layers at a beat.
//
// Finished composition (reduced motion, no script, a failed CDN, phone 'rest'): an ordinary section on
// the dark ground: the anchor as the one display line with the endings under it in the text face, the
// principles in a grid, the final line in a full-width accent panel that meets the accent section after
// it. With script, the field is drawn once, still, behind the statement.
//
// House rules applied to the source idea: no monospace HUD, no 01/04 counter, no hairline progress bar,
// no gradient scrim or fan (the scrim is a flat ellipse softened once in a canvas), no glow ('lighter'
// blending or shadowBlur), no numbers on the principles, no violet.
(() => {
  const ID = 'warp-jump';
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const num = (v, d, a, b) => (typeof v === 'number' && isFinite(v) ? clamp(v, a, b) : d);
  const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const JUMP = 0.84;
  // exit 'flood': the tunnel is solid accent by FLOOD_END; the final line turns to the exit ink at INK
  // in one short timed change (never scrubbed, so no rest shows half-changed letters)
  const FLOOD_END = 0.91, INK = 0.89;

  const settings = (o = {}) => ({
    exit: ['disc', 'flood', 'release'].includes(o.exit) ? o.exit : 'disc',
    enter: o.enter === 'photo' ? 'photo' : 'field',
    speed: num(o.speed, 1, 0.5, 1.4),
    accentMax: num(o.accentMax, 0.5, 0.2, 0.7),
    rays: Math.round(num(o.rays, 1100, 600, 1600)),
    hold: num(o.hold, 0, 3, 8),
    phoneHold: num(o.phoneHold, 0, 3, 7),
    phone: o.phone === 'rest' ? 'rest' : 'same',
    scrub: o.scrub === true ? true : num(o.scrub, 0.5, 0, 2),
    count: o.count !== false,
  });

  // ---------- colour: tokens resolved to rgb, mixed in JS (a canvas cannot read var()) ----------

  const scratch = document.createElement('canvas').getContext('2d');
  function rgbOf(root, prop, fallback) {
    const probe = document.createElement('i');
    probe.style.cssText = 'position:absolute;visibility:hidden;color:' + fallback;
    probe.style.color = 'var(' + prop + ', ' + fallback + ')';
    root.append(probe);
    const c = getComputedStyle(probe).color;
    probe.remove();
    scratch.fillStyle = fallback;
    scratch.fillStyle = c;
    const s = String(scratch.fillStyle);
    if (s[0] === '#') return [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
    const m = s.match(/[\d.]+/g);
    return m ? m.slice(0, 3).map(Number) : [0, 0, 0];
  }
  const lum = (rgb) => {
    const f = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
  };
  const contrast = (a, b) => { const A = lum(a), B = lum(b); return (Math.max(A, B) + 0.05) / (Math.min(A, B) + 0.05); };
  const css = (rgb) => 'rgb(' + rgb.map((n) => Math.round(n)).join(' ') + ')';

  // ---------- the field: radial streaks on one canvas, batched into 12 paths ----------

  const mulberry32 = (a) => () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  function makeField(canvas, spriteCanvas) {
    const MAX = 1600;
    const rnd = mulberry32(7);
    const cos = new Float32Array(MAX), sin = new Float32Array(MAX), phi = new Float32Array(MAX), k = new Float32Array(MAX), pick = new Float32Array(MAX);
    for (let i = 0; i < MAX; i++) {
      // golden-angle order: the first n rays always cover the circle evenly as the field fills
      const th = i * 2.399963 + (rnd() * 2 - 1) * 0.01;
      cos[i] = Math.cos(th); sin[i] = Math.sin(th);
      phi[i] = rnd(); k[i] = 0.7 + 0.6 * rnd(); pick[i] = rnd();
    }
    const segs = Array.from({ length: 12 }, () => new Float32Array(MAX * 4));
    const counts = new Int32Array(12);
    // width per radius bin: the streaks near the vanishing point are farther away, so thinner, but
    // never under 1px (at the 3.2px floor the innermost is 1.4px, 1.2px on a phone)
    const BIN = [0.45, 0.6, 0.8, 1];
    const f = {
      canvas, ctx: canvas.getContext('2d', { alpha: false }),
      W: 0, H: 0, dpr: 1, cx: 0, cy: 0, R: 1, Rc: 1,
      N: 1100, wScale: 1, speed: 1, accentMax: 0.5, exit: 'disc',
      p: 0, lastP: 0, travel: 0.37, kick: 0, dim: 1, scrim: 1, cover: 0,
      ground: 'rgb(5 6 7)', tones: ['#fff', '#fff', '#fff'], alphas: [0.9, 0.85, 1],
      sprite: spriteCanvas || null, sx: 0, sy: 0, sw: 0, sh: 0,
    };

    f.size = (W, H, dpr) => {
      W = Math.max(1, Math.round(W)); H = Math.max(1, Math.round(H));
      const pw = Math.round(W * dpr), ph = Math.round(H * dpr);
      if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
      f.W = W; f.H = H; f.dpr = dpr;
    };
    // vanishing point and reach; the head runs out to R / (1 - L) so a tail leaves the corner as it wraps
    f.aim = (cx, cy) => {
      f.cx = cx; f.cy = cy;
      f.Rc = Math.hypot(Math.max(cx, f.W - cx), Math.max(cy, f.H - cy));
      f.R = 1.05 * f.Rc;
    };
    // the scrim: a flat ellipse of the ground, softened once into a small sprite (no gradient anywhere)
    f.scrimFor = (groundRgb, boxW, boxH, pad) => {
      const ax = (boxW / 2) * 1.3 + pad, ay = (boxH / 2) * 1.45 + pad;
      f.sw = ax / 0.34; f.sh = ay / 0.34;
      f.sx = f.cx - f.sw / 2; f.sy = f.cy - f.sh / 2;
      const w = 360, h = Math.max(40, Math.round((360 * f.sh) / f.sw));
      const c = f.sprite || document.createElement('canvas');
      c.width = w; c.height = h;
      const g = c.getContext('2d');
      g.clearRect(0, 0, w, h);
      g.fillStyle = 'rgb(' + groundRgb.join(' ') + ' / 0.8)';
      if ('filter' in g) {
        g.filter = 'blur(' + Math.max(2, Math.round(Math.min(w, h) * 0.075)) + 'px)';
        g.beginPath(); g.ellipse(w / 2, h / 2, w * 0.34, h * 0.34, 0, 0, Math.PI * 2); g.fill();
        g.filter = 'none';
      } else {
        // no canvas filter: nested flat ellipses build the same soft edge
        g.fillStyle = 'rgb(' + groundRgb.join(' ') + ' / 0.1)';
        for (let s = 0.46; s >= 0.22; s -= 0.03) { g.beginPath(); g.ellipse(w / 2, h / 2, w * s, h * s, 0, 0, Math.PI * 2); g.fill(); }
      }
      f.sprite = c;
    };

    // The field is already at warp speed at 0: half the rays, trails a fifth of the radius, 3.2px rims.
    // d rises quickly (t^0.9), so a quarter of the way in the field is dense and long.
    f.state = (p, still) => {
      const t = Math.min(1, p / JUMP), d = Math.pow(t, 0.9);
      const j = still || f.exit === 'release' ? 0 : ss(0.82, 0.92, p);
      const fl = !still && f.exit === 'flood' ? ss(JUMP, FLOOD_END, p) : 0;
      let L = Math.min(0.9, 0.2 + 0.35 * Math.pow(d, 1.1) + 0.4 * j);
      let w = (3.2 + 2.6 * d) * f.wScale;
      let acc = Math.min(f.accentMax, 0.15 + 0.35 * d);
      if (fl) { L += (0.95 - L) * fl; w += (9 * f.wScale - w) * fl; acc += (1 - acc) * fl; }
      return {
        d, j, L, w, acc, fl, still: !!still,
        n: Math.min(MAX, Math.round(f.N * (0.5 + 0.5 * d))),
        v: (0.1 + 0.5 * d) * f.speed + 1.6 * j,
        // the void opens with the jump only where the disc covers it ('flood' keeps the tunnel whole)
        r0: (0.005 + (f.exit === 'disc' ? 0.115 : 0) * j) * f.R,
      };
    };

    f.draw = (st) => {
      const { ctx, dpr, cx, cy, R, Rc } = f;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
      // 'flood': the gaps between the streaks fill with the accent too, so the tunnel closes even
      // where there are few rays (a phone)
      const g = st.fl > 0.5 && f.groundRgb ? ss(0.5, 1, st.fl) : 0;
      ctx.fillStyle = g ? 'rgb(' + f.groundRgb.map((c, i) => Math.round(c + (f.accentRgb[i] - c) * g)).join(' ') + ')' : f.ground;
      ctx.fillRect(0, 0, f.W, f.H);
      const keep = 1 - st.L, span = R / keep - st.r0, r0 = st.r0;
      const acc = st.acc, tint = Math.min(1, acc * 1.6);
      const b1 = 0.25 * R, b2 = 0.5 * R, b3 = 0.75 * R, travel = f.travel, cover = f.cover;
      counts.fill(0);
      for (let i = 0; i < st.n; i++) {
        let u = phi[i] + travel * k[i];
        u -= Math.floor(u);
        const rh = r0 + span * Math.pow(u, 2.4);
        if (rh <= cover) continue;
        let rt = rh * keep;
        if (rt < r0) rt = r0;
        if (rt < cover) rt = cover;
        if (rt >= Rc || rh - rt < 0.5) continue;
        const tone = pick[i] < acc ? 2 : pick[i] < tint ? 1 : 0;
        const b = tone * 4 + (rh < b1 ? 0 : rh < b2 ? 1 : rh < b3 ? 2 : 3);
        const a = segs[b], c = counts[b] * 4;
        a[c] = i; a[c + 1] = rt; a[c + 2] = rh;
        counts[b]++;
      }
      // Each streak is a rectangle along its ray (fillRect under a rotation): the GPU batches plain
      // rectangles of one colour into a single draw, where a stroked path of a thousand segments is
      // tessellated on every frame.
      for (let t = 0; t < 3; t++) {
        ctx.fillStyle = f.tones[t];
        ctx.globalAlpha = f.alphas[t] * f.dim;
        for (let bin = 0; bin < 4; bin++) {
          const b = t * 4 + bin, m = counts[b] * 4;
          if (!m) continue;
          const a = segs[b], hw = (st.w * BIN[bin]) / 2, w2 = hw * 2;
          for (let s = 0; s < m; s += 4) {
            const i = a[s], co = cos[i] * dpr, si = sin[i] * dpr, rt = a[s + 1];
            ctx.setTransform(co, si, -si, co, cx * dpr + co * rt, cy * dpr + si * rt);
            ctx.fillRect(0, -hw, a[s + 2] - rt, w2);
          }
        }
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // live, the scrim is its own small canvas over this one (its opacity is a compositor change);
      // only the still drawing of the finished composition paints it in
      if (st.still && f.sprite && f.scrim > 0.004) {
        ctx.globalAlpha = Math.min(1, f.scrim);
        ctx.drawImage(f.sprite, f.sx, f.sy, f.sw, f.sh);
      }
      ctx.globalAlpha = 1;
    };

    // one live frame: the clock never stops, scrolling pushes it forward, a beat change kicks it
    f.step = (dt) => {
      const st = f.state(f.p);
      const dp = Math.abs(f.p - f.lastP);
      f.lastP = f.p;
      const push = Math.min(dp * 4 * (0.5 + st.d), 0.015 + 0.045 * st.d);
      f.kick *= Math.pow(0.5, dt / 0.3);
      f.travel += st.v * dt + push + f.kick * dt;
      f.draw(st);
    };
    f.still = (p) => { f.draw(f.state(p, true)); };
    return f;
  }

  // ---------- text: words and characters in inline-blocks, no line mask (letters fly past the camera) ----------

  // sentences: each sentence in its own .warp-line (a principle's two sentences set as two lines)
  function split(el, sentences) {
    if (el.__warpChars) return el.__warpChars;
    const text = el.textContent.replace(/\s+/g, ' ').trim();
    el.textContent = '';
    const sr = document.createElement('span');
    sr.className = 'warp-sr';
    sr.textContent = text;
    const vis = document.createElement('span');
    vis.className = 'warp-vis';
    vis.setAttribute('aria-hidden', 'true');
    const chars = [];
    const parts = sentences ? text.split(/(?<=[.!?])\s+(?=\S)/) : [text];
    parts.forEach((part, li) => {
      let box = vis;
      if (sentences) {
        if (li) vis.append(' ');
        box = document.createElement('span');
        box.className = 'warp-line';
        vis.append(box);
      }
      part.split(' ').forEach((word, i) => {
        if (i) box.append(' ');
        const w = document.createElement('span');
        w.className = 'warp-w';
        for (const ch of Array.from(word)) {
          const c = document.createElement('span');
          c.className = 'warp-c';
          c.textContent = ch;
          w.append(c);
          chars.push(c);
        }
        box.append(w);
      });
    });
    el.append(sr, vis);
    el.__warpChars = chars;
    return chars;
  }

  const posIn = (el, anc) => {
    let x = 0, y = 0, n = el;
    while (n && n !== anc) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    return { x, y };
  };

  // ---------- the scene ----------

  window.Scenes = window.Scenes || {};
  window.Scenes[ID] = (root, opts = {}) => {
    const o = settings(opts);
    const $ = (s) => root.querySelector(s);
    const $$ = (s) => [...root.querySelectorAll(s)];
    const stage = root.querySelector(':scope > .scene-stage') || root.firstElementChild;
    const statement = $('.warp-statement');
    const anchor = $('.warp-anchor');
    const tails = $$('.warp-tail');
    const points = $$('.warp-point');
    const final = $('.warp-final');
    const photo = o.enter === 'photo' ? $('.warp-photo') : null;
    const photoImg = photo && photo.querySelector('img');
    const lead = o.enter === 'photo' ? $('.warp-lead') : null;
    const isPhoto = !!(photo && photoImg);
    if (!isPhoto) root.classList.remove('warp-enter-photo'); else root.classList.add('warp-enter-photo');
    root.classList.add('warp-exit-' + o.exit);

    // script-owned layers
    let canvas = $('.warp-field');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'warp-field';
      canvas.setAttribute('aria-hidden', 'true');
      stage.prepend(canvas);
    }
    // the scrim: a soft flat ellipse of the ground on its own small canvas, drawn once per layout
    let scrimEl = $('canvas.warp-scrim');
    if (!scrimEl) {
      scrimEl = document.createElement('canvas');
      scrimEl.className = 'warp-scrim';
      scrimEl.setAttribute('aria-hidden', 'true');
      canvas.after(scrimEl);
    }
    // 'disc' carries an ink copy of the final line inside the disc; 'flood' turns the line itself
    let exitEl = $('.warp-exit'), exitCopy = null, inkFinal = null;
    if (!exitEl && o.exit !== 'release' && (final || o.exit === 'flood')) {
      exitEl = document.createElement('div');
      exitEl.className = 'warp-exit';
      exitEl.setAttribute('aria-hidden', 'true');
      if (final && o.exit === 'disc') {
        exitCopy = document.createElement('div');
        exitCopy.className = 'warp-exit-copy';
        exitEl.append(exitCopy);
      }
      stage.append(exitEl);
    } else if (exitEl && o.exit === 'disc') exitCopy = exitEl.querySelector('.warp-exit-copy');
    let countEl = $('.warp-count'), countText = null;
    if (!countEl && o.count) {
      countEl = document.createElement('p');
      countEl.className = 'warp-count';
      countEl.setAttribute('aria-hidden', 'true');
      countText = document.createElement('span');
      countEl.append(countText);
      stage.append(countEl);
    } else if (countEl) countText = countEl.firstElementChild || countEl;
    const zooms = [];
    if (isPhoto) {
      for (let i = 0; i < 3; i++) {
        const z = document.createElement('div');
        z.className = 'warp-zoom';
        z.setAttribute('aria-hidden', 'true');
        const im = document.createElement('img');
        im.alt = '';
        im.decoding = 'async';
        im.src = photoImg.currentSrc || photoImg.src;
        z.append(im);
        photo.after(z);
        zooms.push(z);
      }
    }

    const field = makeField(canvas, scrimEl);
    field.speed = o.speed; field.accentMax = o.accentMax; field.exit = o.exit;

    // ---------- the plan: which text each beat shows, and when it starts ----------

    function makePlan(phone) {
      const beats = [];
      const groups = new Map();
      if (isPhoto && lead) { groups.set('lead', { kind: 'lead', el: lead }); }
      if (anchor) groups.set('anchor', { kind: 'chars', el: anchor });
      tails.forEach((t, i) => groups.set('tail' + i, { kind: 'chars', el: t }));
      // at most four principles a beat (desktop and phone): 5-6 make two beats of three, 12 three of four
      const pointGroups = [];
      for (let g = 0, nG = Math.ceil(points.length / 4), at = 0; g < nG; g++) {
        const size = Math.ceil((points.length - at) / (nG - g));
        pointGroups.push(points.slice(at, at + size));
        at += size;
      }
      pointGroups.forEach((g, i) => groups.set('points' + i, { kind: 'points', items: g }));
      if (final) groups.set('final', { kind: 'final', el: final });
      const story = [];
      if (tails.length) tails.forEach((t, i) => story.push(anchor ? ['anchor', 'tail' + i] : ['tail' + i]));
      else if (anchor) story.push(['anchor']);
      pointGroups.forEach((g, i) => story.push(['points' + i]));
      if (final) story.push(['final']);
      const base = isPhoto ? 0.16 : 0;
      const slot = story.length ? (JUMP - base) / story.length : JUMP;
      if (isPhoto) {
        beats.push({ keys: lead ? ['lead'] : [], start: 0, n: 0 });
        beats.push({ keys: [], start: 0.05, n: 0 });
      }
      story.forEach((keys, i) => beats.push({ keys, start: base + i * slot, n: i + 1 }));
      if (!beats.length) beats.push({ keys: [], start: 0, n: 0 });
      const at = (key) => beats.find((b) => b.keys.includes(key));
      return { beats, groups, pointGroups, slot, total: story.length, at, base };
    }
    const countBeats = (phone) => makePlan(phone).total;
    const holdDesk = o.hold || clamp(countBeats(false) + 1 + (isPhoto ? 1 : 0), 3, 8);
    const holdPhone = o.phoneHold || clamp(countBeats(true) + (isPhoto ? 1 : 0), 3, 7);

    // ---------- state ----------

    let plan = makePlan(false);
    let live = false, phone = false, cur = null, instantUntil = 0, visible = false;
    let W = 0, H = 0;
    const pos = [];          // base centre of each principle in stage px, with its unit vector from the centre
    let colours = null;
    let splitDone = false;

    function readColours() {
      const ground = rgbOf(root, '--warp-ground', '#050607');
      const ink = rgbOf(root, '--warp-ink', '#eeeeea');
      const accent = rgbOf(root, '--warp-accent', '#ff5b24');
      const tint = ink.map((c, i) => (c + accent[i]) / 2);
      field.ground = css(ground);
      field.groundRgb = ground; field.accentRgb = accent;
      field.tones = [css(ink), css(tint), css(accent)];
      const groundOnAccent = contrast(ground, accent) >= 4.5;
      root.style.setProperty('--warp-exit-ink', groundOnAccent ? 'var(--warp-ground)' : 'var(--warp-ink)');
      colours = { ground, ink, accent, exitInk: groundOnAccent ? ground : ink };
    }

    function ensureSplit() {
      if (splitDone) return;
      splitDone = true;
      for (const el of [lead, anchor, ...tails, final]) if (el) split(el);
      for (const li of points) {
        if (li.querySelector(':scope > .warp-plate')) continue;
        const plate = document.createElement('span');
        plate.className = 'warp-plate';
        while (li.firstChild) plate.append(li.firstChild);
        li.append(plate);
        split(plate, true);
      }
      if (final && exitCopy && !inkFinal) {
        inkFinal = document.createElement('p');
        inkFinal.className = final.className;
        inkFinal.textContent = final.querySelector('.warp-sr') ? final.querySelector('.warp-sr').textContent : final.textContent;
        exitCopy.append(inkFinal);
        split(inkFinal);
        inkFinal.querySelector('.warp-sr').remove();
      }
    }

    const charsOf = (el) => (el && el.__warpChars) || [];
    const groupChars = (g) => g.kind === 'points' ? g.items.flatMap((li) => [li.querySelector('.warp-plate'), ...charsOf(li.querySelector('.warp-plate'))])
      : g.kind === 'final' ? [...charsOf(g.el), ...charsOf(inkFinal)] : g.kind === 'lead' ? [g.el, ...charsOf(g.el)] : charsOf(g.el);

    // ---------- measuring: fitted type, the principles' places, char centres, the scrim ----------

    // Each statement line is fitted on its own, inside 90% of the width. The anchor keeps at least 0.8
    // of the full size (under that it may break between its words). An ending that would have to go
    // under 0.6 of the anchor stays at that floor and breaks into two balanced lines instead, so one long
    // ending never shrinks the anchor or the other endings. The final line first takes a wider measure
    // (12ch up to 22ch), and only then a smaller size of its own.
    function fit() {
      const avail = W * 0.9;
      const lines = [anchor, ...tails].filter(Boolean);
      for (const el of lines) { el.style.removeProperty('--warp-fit'); el.classList.remove('warp-wrap'); }
      const widths = lines.map((el) => el.offsetWidth);   // all read at full size on one line
      let sa = 1;
      lines.forEach((el, i) => {
        let s = Math.min(1, avail / Math.max(1, widths[i]));
        const floor = el === anchor ? 0.8 : 0.6 * sa;
        if (s < floor) { s = floor; el.classList.add('warp-wrap'); }
        if (el === anchor) sa = s;
        el.style.setProperty('--warp-fit', s.toFixed(4));
      });
      if (final) {
        const fs = () => parseFloat(getComputedStyle(final).fontSize) || 40;
        const lines = () => Math.round(final.offsetHeight / (fs() * 0.9));
        const widestWord = () => [...final.querySelectorAll('.warp-w')].reduce((m, w) => Math.max(m, w.offsetWidth), 0);
        root.style.setProperty('--warp-final-fit', '1');
        for (const ch of [12, 14, 16, 18, 22]) {
          root.style.setProperty('--warp-final-measure', ch + 'ch');
          if (lines() <= 2) break;
        }
        // smaller until it sits on two lines, but not under 0.6 of the full size (a longer line than
        // the guide then takes a third line); only a single word wider than the stage goes further
        let s = 1;
        for (let i = 0; i < 12; i++) {
          const wide = widestWord() > avail;
          if (!wide && !(lines() > 2 && s > 0.6)) break;
          s *= Math.min(0.94, avail / Math.max(1, widestWord()));
          if (!wide) s = Math.max(0.6, s);
          root.style.setProperty('--warp-final-fit', s.toFixed(4));
        }
      }
    }

    // A plate is as wide as its longest balanced line (a block would keep the full measure and leave a
    // ragged empty end on the plate).
    function sizePlates() {
      for (const li of points) {
        const plate = li.querySelector(':scope > .warp-plate');
        if (!plate) continue;
        plate.style.width = '';
        const words = plate.querySelectorAll('.warp-w');
        if (!words.length) continue;
        const cs = getComputedStyle(plate);
        let l = Infinity, r = 0;
        for (const w of words) { l = Math.min(l, w.offsetLeft); r = Math.max(r, w.offsetLeft + w.offsetWidth); }
        plate.style.width = Math.ceil(r - l + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + 1) + 'px';
      }
    }

    // The principles' pass-by: each drifts outward along its ray and grows, as if the camera flew
    // between them. Start and end offsets as fractions of the stage width, and the scales.
    const DRIFT = { from: -0.015, to: 0.06, s0: 0.9, s1: 1.25 };
    const DRIFT_PHONE = { from: 0, to: 0, s0: 0.96, s1: 1.06 };
    function placePoints() {
      pos.length = 0;
      const m = phone ? 16 : 24;
      const reserve = countEl && o.count ? (phone ? 48 : 64) : 0;
      if (!phone) {
        // each beat's principles (four at most) on an ellipse around the void, placed so that the end of
        // the drift (outward, at the larger scale) still lies inside the stage
        const rx = 0.3 * W, ry = 0.27 * H, cx = W / 2, cy = H / 2, D = DRIFT.to * W, S = DRIFT.s1;
        for (const g of plan.pointGroups) {
          const n = g.length;
          g.forEach((li, j) => {
            const i = points.indexOf(li);
            const deg = -66 + (j * 360) / n + (j % 2 ? 64 / n : 0);
            const a = (deg * Math.PI) / 180;
            const w = li.offsetWidth, h = li.offsetHeight;
            const dx = rx * Math.cos(a), dy = ry * Math.sin(a), len = Math.hypot(dx, dy) || 1;
            const ux = dx / len, uy = dy / len;
            const ex = clamp(cx + dx + D * ux, m + (w * S) / 2, W - m - (w * S) / 2);
            const ey = clamp(cy + dy + D * uy, m + (h * S) / 2, H - m - (h * S) / 2 - reserve);
            pos[i] = { x: ex - D * ux, y: ey - D * uy, w, h, ux, uy };
          });
        }
        return;
      }
      const gap = 14;
      for (const g of plan.pointGroups) {
        const hs = g.map((li) => li.offsetHeight);
        let y = H / 2 - (hs.reduce((a, b) => a + b, 0) + gap * (g.length - 1)) / 2;
        g.forEach((li, j) => {
          const i = points.indexOf(li);
          pos[i] = { x: W / 2, y: y + hs[j] / 2, w: li.offsetWidth, h: hs[j], ux: 0, uy: 0 };
          y += hs[j] + gap;
        });
      }
    }

    function measureChars() {
      const vx = W / 2, vy = H / 2;
      const vec = (chars, base) => chars.map((c) => {
        const q = base(c);
        return { x: q.x + c.offsetWidth / 2 - vx, y: q.y + c.offsetHeight / 2 - vy };
      });
      for (const [, g] of plan.groups) {
        if (g.kind === 'points') {
          g.plates = g.items.map((li) => {
            const i = points.indexOf(li), plate = li.querySelector('.warp-plate'), p = pos[i] || { x: vx, y: vy, w: 0, h: 0 };
            const chars = charsOf(plate);
            return { plate, chars, rel: vec(chars, (c) => { const q = posIn(c, li); return { x: q.x + p.x - p.w / 2, y: q.y + p.y - p.h / 2 }; }) };
          });
        } else {
          g.chars = charsOf(g.el);
          g.rel = vec(g.chars, (c) => posIn(c, stage));
          if (g.kind === 'final') g.ink = charsOf(inkFinal);
        }
      }
    }

    function layout() {
      if (!live) return;
      W = stage.clientWidth || window.innerWidth;
      H = stage.clientHeight || window.innerHeight;
      fit();
      sizePlates();
      placePoints();
      measureChars();
      readColours();
      sizeField();
      const bw = Math.max(statement ? statement.offsetWidth : 0, final ? final.offsetWidth * 1.06 : 0, W * 0.3);
      const bh = Math.max(statement ? statement.offsetHeight : 0, final ? final.offsetHeight * 1.06 : 0, 60);
      field.aim(W / 2, H / 2);
      field.scrimFor(colours.ground, Math.min(bw, W), bh, Math.min(W, H) * 0.04);
      Object.assign(scrimEl.style, { left: field.sx + 'px', top: field.sy + 'px', width: field.sw + 'px', height: field.sh + 'px' });
    }

    // Quality. The streaks are drawn at the CSS pixel (DPR capped at 1.5; phones at 1). A machine that
    // keeps dropping frames steps down (a coarser canvas with fewer rays); a phone with little memory
    // starts at 360 rays.
    let level = 0;
    const LEVELS = [{ res: 1, rays: 1 }, { res: 0.75, rays: 0.8 }, { res: 0.55, rays: 0.6 }];
    function sizeField() {
      const L = LEVELS[level];
      const dpr = phone ? (level >= 2 ? 0.75 : 1) : Math.min(1.5, window.devicePixelRatio || 1) * L.res;
      field.size(W, H, dpr);
      field.aim(W / 2, H / 2);
    }
    function rayCount(width = W) {
      if (phone) return level || (navigator.deviceMemory && navigator.deviceMemory <= 2) ? 360 : 600;
      const n = width < 1024 ? Math.min(700, o.rays) : o.rays;
      return Math.round(n * LEVELS[level].rays);
    }

    // ---------- the timed text beats ----------

    const each = () => (phone ? 0.012 : 0.016);
    // spread: the most the stagger may add in all (a long line still lands inside the beat)
    function enterChars(chars, rel, delay, from, spread = 0.3) {
      if (!chars.length) return;
      gsap.killTweensOf(chars);
      const step = Math.min(each(), spread / Math.max(1, chars.length / 2));
      // 2D transforms: a hundred letters promoted to layers at once costs more than repainting them
      gsap.fromTo(chars,
        { autoAlpha: 0, scale: from, x: (i) => -rel[i].x * 0.45, y: (i) => -rel[i].y * 0.45 },
        { autoAlpha: 1, scale: 1, x: 0, y: 0, duration: 0.6, ease: 'expo.out', delay, force3D: false, stagger: { each: step, from: 'center' } });
    }
    function exitChars(chars, rel) {
      if (!chars.length) return;
      gsap.killTweensOf(chars);
      const stagger = { each: phone ? 0.006 : 0.008, from: 'edges' };
      gsap.to(chars, { x: (i) => rel[i].x * 0.6, y: (i) => rel[i].y * 0.6, scale: 2.4, duration: 0.32, ease: 'power3.in', force3D: false, stagger });
      gsap.to(chars, { autoAlpha: 0, duration: 0.26, ease: 'power1.in', stagger });
    }
    // Plates (the principles' grounds, the lead's) change opacity only, so a hidden principle stays in
    // the accessibility tree; the letters themselves are aria-hidden copies and may be hidden outright.
    function setGroup(g, on) {
      const all = groupChars(g);
      gsap.killTweensOf(all);
      if (g.kind === 'points') {
        for (const pl of g.plates || []) { gsap.set(pl.plate, { opacity: on ? 1 : 0, scale: 1 }); gsap.set(pl.chars, { autoAlpha: 1, x: 0, y: 0, scale: 1 }); }
      } else if (g.kind === 'lead') {
        gsap.set(g.el, { opacity: on ? 1 : 0 });
        gsap.set(g.chars, { autoAlpha: on ? 1 : 0, x: 0, y: 0, scale: 1 });
      } else gsap.set(all, { autoAlpha: on ? 1 : 0, x: 0, y: 0, scale: 1 });
    }
    function enterGroup(g, delay) {
      if (g.kind === 'points') {
        // one after another, but the whole beat settles within about 0.9s
        const plates = g.plates || [];
        const gap = plates.length > 1 ? Math.min(0.09, 0.3 / (plates.length - 1)) : 0;
        plates.forEach((pl, j) => {
          const d = delay + j * gap;
          gsap.killTweensOf([pl.plate, ...pl.chars]);
          gsap.fromTo(pl.plate, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out', delay: d });
          enterChars(pl.chars, pl.rel, d, 0.6, 0.1);
        });
        return;
      }
      if (g.kind === 'lead') { gsap.killTweensOf(g.el); gsap.to(g.el, { opacity: 1, duration: 0.3, ease: 'power2.out', delay }); }
      enterChars(g.chars, g.rel, delay, 0.35);
      if (g.kind === 'final' && g.ink) enterChars(g.ink, g.rel, delay, 0.35);
    }
    function exitGroup(g) {
      if (g.kind === 'points') {
        const plates = (g.plates || []).map((pl) => pl.plate);
        gsap.killTweensOf(plates);
        gsap.to(plates, { opacity: 0, scale: 1.3, duration: 0.25, ease: 'power2.in' });
        return;
      }
      if (g.kind === 'lead') { gsap.killTweensOf(g.el); gsap.to(g.el, { opacity: 0, duration: 0.3, ease: 'power1.in', delay: 0.05 }); }
      exitChars(g.chars, g.rel);
      if (g.kind === 'final' && g.ink) exitChars(g.ink, g.rel);
    }

    function showCount() {
      if (!countText) return;
      const b = cur === null ? null : plan.beats[cur];
      if (!b || !b.n) { countText.style.visibility = 'hidden'; return; }
      countText.style.visibility = '';
      countText.textContent = b.n + ' of ' + plan.total;
    }

    function go(k, instant) {
      const want = new Set(plan.beats[k].keys);
      const had = new Set(cur === null ? [] : plan.beats[cur].keys);
      if (instant) {
        for (const [key, g] of plan.groups) setGroup(g, want.has(key));
      } else {
        let leaving = false;
        for (const key of had) if (!want.has(key)) { exitGroup(plan.groups.get(key)); leaving = true; }
        for (const key of want) if (!had.has(key)) enterGroup(plan.groups.get(key), leaving ? 0.2 : 0);
        // a surge of speed with every change of beat, halving every 0.3s
        field.kick += 0.8;
      }
      cur = k;
      showCount();
    }
    // exit 'flood': the final line changes from the ink to the exit ink in one 0.25s step once the tunnel
    // is solid accent (and back on the way up), with the same hysteresis as the beats
    let inked = null;
    function inkCheck(p) {
      if (o.exit !== 'flood' || !final || !colours) return;
      let want = p >= INK;
      if (inked !== null && want !== inked) { want = inked ? p >= INK - 0.004 : p >= INK + 0.004; if (want === inked) return; }
      if (want === inked) return;
      const instant = inked === null || performance.now() < instantUntil;
      inked = want;
      const to = css(want ? colours.exitInk : colours.ink);
      gsap.killTweensOf(final, 'color');
      if (instant) gsap.set(final, { color: to });
      else gsap.to(final, { color: to, duration: 0.25, ease: 'power1.inOut' });
    }
    const beatAt = (p) => { let k = 0; plan.beats.forEach((b, i) => { if (p >= b.start) k = i; }); return k; };
    function check(p) {
      let k = beatAt(p);
      if (cur !== null && k !== cur) {
        k = k > cur ? beatAt(p - 0.004) : beatAt(p + 0.004);
        if (k === cur) return;
      }
      if (k !== cur) go(k, cur === null || performance.now() < instantUntil);
    }

    // ---------- the draw loop: only while the scene is near the screen and the tab is shown ----------

    let frames = 0, sum = 0, slow = 0, playhead = null, exitOn = null;
    const drawing = () => live && visible && !document.hidden && (field.p <= 0.985 || o.exit === 'release');
    function tick(time, deltaTime) {
      if (!live) return;
      // Read the playhead every frame: ScrollTrigger re-seats it on refresh with its events suppressed,
      // and beats are changed here, never inside a refresh (which would put their styles back).
      if (playhead) { const t = clamp(playhead.time(), 0, 1); if (t !== field.p) onP(t); }
      check(field.p);
      inkCheck(field.p);
      if (!drawing()) return;
      const dt = Math.min(0.05, deltaTime / 1000);
      field.step(dt);
      // adaptive: every 30 drawn frames (after 10 to settle), a slow average or a run of dropped frames
      // steps the quality down (a single hitch elsewhere on the page does not)
      if (level < LEVELS.length - 1 && ++frames > 10) {
        sum += deltaTime;
        if (deltaTime > 34) slow++;
        if (frames === 40) {
          if (sum / 30 > (phone ? 24 : 22) || slow >= 6) { level++; field.N = rayCount(); sizeField(); }
          frames = 0; sum = 0; slow = 0;
        }
      }
    }
    if (window.gsap) gsap.ticker.add(tick);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => { visible = es[es.length - 1].isIntersecting; }, { rootMargin: '100px 0px' }).observe(root);
    } else visible = true;

    function onP(p) {
      const prev = field.p;
      field.p = p;
      if (isPhoto && prev < 0.08 && p >= 0.08) field.kick += 1.2;
      // the exit layer stays out of the render tree until the jump: a full-screen layer, even clipped
      // to nothing, costs compositing on every scrolled frame
      if (exitEl) { const on = p >= JUMP - 0.01; if (on !== exitOn) { exitOn = on; exitEl.style.display = on ? 'block' : 'none'; } }
      // nothing is drawn under the exit disc (same ease as its clip-path, in the canvas's scaled space)
      if (o.exit === 'disc') {
        const t = clamp((p - JUMP) / 0.14, 0, 1), e = t * t;
        field.cover = Math.max(0, (e * (Math.hypot(W / 2, H / 2) + 4)) / (1 + (phone ? 0.08 : 0.12) * e) - 3);
      }
    }

    // ---------- the finished composition: the field drawn once, still, behind the statement ----------

    function restDraw() {
      if (live || !canvas.getContext) return;
      root.classList.add('warp-drawn');
      readColours();
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      field.N = rayCount(w);
      field.wScale = phone ? 0.85 : 1;
      field.size(w, h, phone ? 1 : Math.min(1.5, window.devicePixelRatio || 1));
      const cr = canvas.getBoundingClientRect();
      const sr = (statement || final || canvas).getBoundingClientRect();
      const cx = clamp(sr.left + sr.width / 2 - cr.left, 0, w);
      const cy = clamp(sr.top + sr.height / 2 - cr.top, h * 0.2, h * 0.6);
      field.aim(cx, cy);
      field.dim = 1; field.scrim = 1;
      field.scrimFor(colours.ground, Math.min(sr.width, w), sr.height, Math.min(w, h) * 0.05);
      field.travel = 0.37;
      field.still(0.75);
    }
    let restRaf = 0;
    const restLater = () => { cancelAnimationFrame(restRaf); restRaf = requestAnimationFrame(restDraw); };

    // resize: the canvas follows the stage at once (no stretched frame); measures redo on refresh
    let lastW = 0, lastH = 0;
    if ('ResizeObserver' in window) {
      new ResizeObserver(() => {
        if (!live) { restLater(); return; }
        const w = stage.clientWidth, h = stage.clientHeight;
        if (Stage.touch && w === lastW && Math.abs(h - lastH) < 120) return; // the phone's URL bar
        lastW = w; lastH = h;
        W = w; H = h;
        sizeField();
      }).observe(stage);
    }
    if (document.fonts && document.fonts.addEventListener) {
      document.fonts.addEventListener('loadingdone', () => { if (live && window.ScrollTrigger) ScrollTrigger.refresh(); else restLater(); });
    }
    if (window.ScrollTrigger) {
      ScrollTrigger.addEventListener('refreshInit', () => { if (live) layout(); });
      ScrollTrigger.addEventListener('refresh', () => { if (live) instantUntil = Math.max(instantUntil, performance.now() + 250); });
    }

    // ---------- the scrubbed timeline ----------

    function build(tl, ctx) {
      live = true;
      phone = ctx.phone;
      root.classList.remove('warp-drawn');
      ensureSplit();
      plan = makePlan(phone);
      frames = 0; sum = 0; slow = 0;
      field.wScale = phone ? 0.85 : 1;
      W = stage.clientWidth || window.innerWidth;
      H = stage.clientHeight || window.innerHeight;
      lastW = W; lastH = H;
      field.N = rayCount();
      field.dim = 1; field.scrim = 1;
      layout();
      if (photoImg && photoImg.decode) photoImg.decode().catch(() => {});

      const Wf = () => W, Hf = () => H;
      // The playhead itself drives the field and the beats. (A driver fromTo would also call its
      // onUpdate from the start values it re-applies on every refresh, and report 0 mid-scene.)
      tl.to({}, { duration: 1 }, 0);
      playhead = tl;
      tl.eventCallback('onUpdate', () => onP(clamp(tl.time(), 0, 1)));

      const ps = plan.pointGroups.length ? plan.at('points0').start : null;
      const fs = final ? plan.at('final').start : JUMP;
      const slot = plan.slot;

      // the principles' rest: the plates (ground at 0.9) carry the reading, so the field stays nearly at
      // full strength and the scrim lifts off the void
      if (ps !== null) {
        const back = (final ? fs : JUMP) - 0.03;
        tl.fromTo(field, { dim: 1 }, { dim: 0.85, duration: 0.04 }, Math.max(0, ps - 0.02))
          .fromTo(field, { dim: 0.85 }, { dim: 1, duration: 0.04, immediateRender: false }, back)
          .fromTo(scrimEl, { opacity: 1 }, { opacity: 0.3, duration: 0.04 }, Math.max(0, ps - 0.02))
          .fromTo(scrimEl, { opacity: 0.3 }, { opacity: 1, duration: 0.04, immediateRender: false }, back);
        const dr = phone ? DRIFT_PHONE : DRIFT;
        plan.pointGroups.forEach((g, gi) => {
          const start = plan.at('points' + gi).start;
          g.forEach((li) => {
            const i = points.indexOf(li);
            tl.fromTo(li,
              { xPercent: -50, yPercent: -50, x: () => pos[i].x + dr.from * W * pos[i].ux, y: () => pos[i].y + dr.from * W * pos[i].uy, scale: dr.s0 },
              { xPercent: -50, yPercent: -50, x: () => pos[i].x + dr.to * W * pos[i].ux, y: () => pos[i].y + dr.to * W * pos[i].uy, scale: dr.s1, duration: slot },
              start);
          });
        });
      }
      // the final line pushes in while it is read; its ink copy moves with it
      if (final) tl.fromTo(inkFinal ? [final, inkFinal] : [final], { scale: 1 }, { scale: 1.06, duration: Math.min(slot, JUMP - fs) || 0.01 }, fs);

      // the photograph: a zoom blur made of three scaled copies, then the field takes over
      if (isPhoto) {
        const to = [[0.5, 1.53], [0.35, 1.71], [0.25, 1.89]];
        zooms.forEach((z, i) => {
          tl.fromTo(z, { autoAlpha: 0 }, { autoAlpha: to[i][0], duration: 0.06 }, 0.04)
            .fromTo(z, { scale: 1 }, { scale: to[i][1], duration: 0.12 }, 0.04)
            .fromTo(z, { autoAlpha: to[i][0] }, { autoAlpha: 0, duration: 0.06, immediateRender: false }, 0.1);
        });
        tl.fromTo(photoImg, { filter: 'blur(0px) brightness(1)' }, { filter: 'blur(10px) brightness(0.4)', duration: 0.08 }, 0.06)
          .fromTo(photo, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.04 }, 0.12)
          .fromTo(canvas, { opacity: 0 }, { opacity: 1, duration: 0.08 }, 0.08);
      }

      // the jump
      if (o.exit !== 'release') {
        if (countEl) tl.fromTo(countEl, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.03 }, JUMP);
        tl.fromTo(canvas, { scale: 1 }, { scale: phone ? 1.08 : 1.12, duration: 0.14, ease: 'power1.in' }, JUMP)
          .fromTo(canvas, { opacity: 1 }, { opacity: 0, duration: 0.03, immediateRender: false }, 0.95);
        if (exitEl && o.exit === 'disc') {
          tl.fromTo(scrimEl, { opacity: 1 }, { opacity: 0, duration: 0.06, immediateRender: false }, 0.92);
          tl.fromTo(exitEl,
              { clipPath: 'circle(0px at 50% 50%)' },
              { clipPath: () => 'circle(' + Math.ceil(Math.hypot(Wf() / 2, Hf() / 2) + 4) + 'px at 50% 50%)', duration: 0.14, ease: 'power1.in' },
              JUMP);
        } else {
          // 'flood': the scrim leaves before the field turns to the accent (no dark halo on orange), the
          // line turns to the exit ink once the tunnel is solid (inkCheck), and a flat accent layer under
          // the line settles the stage
          tl.fromTo(scrimEl, { opacity: 1 }, { opacity: 0, duration: 0.04, immediateRender: false }, JUMP);
          if (exitEl) tl.fromTo(exitEl, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04 }, INK);
        }
      }

      // the text at the current progress, without entrances (a refresh or a load mid-scene)
      cur = null;
      exitOn = null;
      inked = null;
      instantUntil = performance.now() + 900;
      onP(clamp(tl.time(), 0, 1));
      check(field.p);
      return tl;
    }

    function rest(ctx) {
      live = false;
      playhead = null;
      exitOn = null;
      if (exitEl) exitEl.style.removeProperty('display');
      phone = !!(ctx && ctx.phone);
      cur = null;
      inked = null;
      if (window.gsap && splitDone) {
        const all = [...$$('.warp-c'), ...$$('.warp-plate'), ...(lead ? [lead] : [])];
        gsap.killTweensOf(all);
        gsap.set(all, { clearProps: 'transform,opacity,visibility' });
        for (const pl of $$('.warp-plate')) pl.style.removeProperty('width');
      }
      if (window.gsap && final) { gsap.killTweensOf(final); gsap.set(final, { clearProps: 'color' }); }
      restLater();
    }

    return Stage.scene(root, {
      hold: holdDesk,
      scrub: o.scrub,
      build,
      phone: o.phone === 'rest' ? 'rest' : { hold: holdPhone, build },
      rest,
    });
  };
})();
