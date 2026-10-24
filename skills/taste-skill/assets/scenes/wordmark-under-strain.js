// tasteskill / scenes / wordmark-under-strain.js — one giant word put under load by the scroll.
//
// The closing word of a page (the brand name, 4-8 letters) is held on screen and strained by the scroll:
// it is crushed onto its baseline and springs back, recedes into a stepped echo of stacked copies, and
// its one straight letter loosens, falls out and lands flat as the call to action. Type, one flat
// ground colour and one label; use it once per page, as the closing section.
//
// DOM. Only the heading (with its visually hidden word) and the link are required; the script builds the
// stack of copies to the plan. Authoring the copies as below gives the stepped word without script too.
//
//   <section class="scene ws" data-scene="wordmark-under-strain" aria-labelledby="ws-title" data-options='{}'>
//     <div class="scene-stage">
//       <div class="ws-top"><p>One sentence, 45+ characters, about the offer.</p><p>Porto, since 2009</p></div>
//       <h2 class="ws-word" id="ws-title">
//         <span class="ws-sr">FLINT</span>
//         <span class="ws-stack" aria-hidden="true">
//           <span class="ws-copy" style="--i:0">FL<span class="ws-l">I</span>NT</span>
//           …  --i:1 to --i:4, the same
//           <span class="ws-copy ws-copy--front" style="--i:5">FL<span class="ws-l ws-slot">I</span>NT</span>
//         </span>
//       </h2>
//       <a class="ws-drop" href="#contact"><span class="ws-drop__label">Start a project</span></a>
//       <div class="ws-meta"><a href="mailto:…">hello@…</a><span>Street, City</span><a href="…">Journal</a></div>
//     </div>
//   </section>
//
// The page needs, like every scene: <script>document.documentElement.classList.add('js')</script> in
// <head> (the stage only holds a live scene under html.js; this file adds the class itself if a page
// forgot it, but then the first paint shows the finished composition), one flat ground colour (--ground)
// shared with the section after the scene, and the word in .ws-sr (or data-word on .ws-word).
//
// The word: capitals (or numerals) read best, with a straight letter (I, l, 1) that is not the first or
// last; with none, a square full stop is added after the word (in the front copy only) and falls instead.
// Mixed case works: letters that rise above the capitals (b d f h k l t, the dot of i) get taller ground
// plates of their own, so their bands keep the rhythm, and the word keeps its clearance under the top row.
// A first or last letter whose outer side is mostly open (E F K L Z, A R C at the end) gets a wider plate
// on that side, so the echo there steps only through its top bands instead of leaving a dotted trail.
//
// CSS custom properties a page can set on the section (all optional):
//   --ws-chars   5       letters in the word. Only used when no script runs at all, to size the word from
//                        CSS alone; set it for words that are not 5 letters long
//   --ws-weight  800     weight of the word;  --ws-tracking  -.02em  its letter spacing
//   --ws-text-size 18px  top and bottom rows; --ws-label-size 16px the button label
//   --ground, --ink, --font-display, --font-text  the page's tokens, picked up as they are
//
// Options (data-options JSON). Default, then range:
//   hold       2.5      screens the stage is held on desktop (1.5-4)
//   phoneHold  2        screens held under 768px (1.5-3)
//   phone      'same'   'same' runs the scene with phone numbers; 'rest' shows the finished composition
//   scrub      auto     true when Lenis smooths the page, else 0.8 (seconds of catch-up); set to override
//   copies     6        copies in the echo, back to front (4-8); fewer, bigger steps if bands would be thin
//                       or if the echo could not be complete by 45% of the hold (50% without the drop)
//   step       1/13     scale each copy loses (1/16-1/9)
//   shift      2        how far each copy sinks, in % of the word height (1-4)
//   squash     0.10     how far the word is crushed onto its baseline (0-0.15; 0 = a calm, graphic opening)
//   spring     3        strength of the spring back, back.out (1.5-3)
//   drop       true     the straight letter falls out and becomes the button; false keeps the word whole,
//                       the button sits under it from the start and the echo takes the whole hold
//   letter     auto     0-based index of the letter that falls
//   size       [300,64] landed button on desktop, px (240-360 x 56-72); phoneSize [240,52]
//   radius     0        landed corner radius, px (0-8), rounded only after the handoff
//   accent     ''       a colour the button takes as it lands (keep 4.5:1 against the ground-coloured label)
//   reveal     'wipe'   how the label appears on the falling bar: 'wipe' (written left to right) or 'fade'
//   fill       0.92     width of the word's ink as a share of the stage width (0.8-0.96)
//   maxHeight  0.42     limit on the word's cap height as a share of the stage height (0.3-0.45)
//   stretch    'normal' font-stretch of the word on desktop ('extra-condensed' to 'expanded')
//   phoneStretch 'condensed'  font-stretch under 768px: a font with a width axis gains height on the
//                       phone; a font without one simply keeps its normal width
//
// Progress map (desktop): 0-5% still; 5-16% crushed to 90% height; 16-28% springs back past 100%;
// 16-52% the echo opens (front copy to 61.5%). The copies behind never fade: each one steps out at full
// ink, nearest first, the moment its edge is 6px or more — first its side strips (from about 33%), then
// its top band (about 36-40%) — so the echo grows outward from the word and never shows a hairline.
// 52% the straight letter becomes a bar of the same size; 52-60% it loosens (tilts 8 degrees, sags);
// from 57% it drops with gravity before it turns (about 18 degrees at 70%, flat at 80%). It swings on
// a hinge on its own axis, and the hinge and the side it tips to are chosen by moving the bar along
// each candidate path over the word and keeping the one that touches the other letters least (a high
// hinge keeps the part still inside the word in its own slot while its foot swings out below the
// baseline), so it never fuses with a neighbour; it drifts to its landing point late, once it has
// dropped. It stays the size of the letter while it crosses the word
// and stretches into the button as it clears it; 72-80% the label is written along it; 80-88% it lands
// with a squash; 84% clickable; 88-100% held. It lands under the word's centre (on desktop, straight
// under its slot when the letter came from near one end of the word). With drop: false the echo opens
// over 16-85%, fast first, and is complete by half the hold.
// Eases: the studied progress map is quadratic where it says power2 (0.979 at 10%, e = 0.778 at 40%),
// and GSAP's power2 is cubic, so the curves here are one GSAP step lower (power1 for power2, power2 for
// power3). Ease 'none' everywhere else; back.out only for the spring and the landing, as the spec asks.
(() => {
  const ID = 'wordmark-under-strain';
  const STRAIGHT = 'Il1|';
  const html = document.documentElement;
  if (!html.classList.contains('js')) html.classList.add('js');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const num = (v, d, a, b) => (typeof v === 'number' && isFinite(v) ? clamp(v, a, b) : d);
  const pair = (v, d, [a, b], [c, e]) => (Array.isArray(v) && v.length === 2 ? [num(v[0], d[0], a, b), num(v[1], d[1], c, e)] : d);
  const trimmed = !!(window.CSS && CSS.supports && (CSS.supports('text-box', 'trim-both cap alphabetic') || CSS.supports('text-box-trim', 'trim-both')));
  const sheet = document.createElement('canvas');
  const pen = sheet.getContext('2d', { willReadFrequently: true });
  const WIDTHS = ['extra-condensed', 'condensed', 'semi-condensed', 'normal', 'semi-expanded', 'expanded'];
  const MIN = 6; // no band, strip or gap of the echo is ever thinner than this, in px

  // The eases the timeline uses, as plain functions (GSAP's own curves), so thresholds and the bar's path
  // can be computed exactly; INV inverts the echo eases.
  const EASE = {
    'power1.inOut': (t) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t)),
    'power2.out': (t) => 1 - (1 - t) ** 3,
  };
  const INV = {
    'power1.inOut': (e) => (e < 0.5 ? Math.sqrt(e / 2) : 1 - Math.sqrt((1 - e) / 2)),
    'power2.out': (e) => 1 - Math.cbrt(1 - e),
  };
  const sine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
  const backOut2 = (t) => { const q = t - 1; return t ? q * q * (3 * q + 2) + 1 : 0; };
  const ECHO_AT = 0.16;

  const settings = (opts) => {
    const o = opts || {};
    return {
      hold: num(o.hold, 2.5, 1.5, 4),
      phoneHold: num(o.phoneHold, 2, 1.5, 3),
      phone: o.phone === 'rest' ? 'rest' : 'same',
      scrub: typeof o.scrub === 'boolean' || typeof o.scrub === 'number' ? o.scrub : null,
      copies: Math.round(num(o.copies, 6, 4, 8)),
      step: num(o.step, 1 / 13, 1 / 16, 1 / 9),
      shift: num(o.shift, 2, 1, 4),
      squash: num(o.squash, 0.1, 0, 0.15),
      spring: num(o.spring, 3, 1.5, 3),
      drop: o.drop !== false,
      letter: Number.isInteger(o.letter) ? o.letter : -1,
      size: pair(o.size, [300, 64], [240, 360], [56, 72]),
      phoneSize: pair(o.phoneSize, [240, 52], [200, 300], [44, 60]),
      radius: num(o.radius, 0, 0, 8),
      accent: typeof o.accent === 'string' ? o.accent : '',
      reveal: o.reveal === 'fade' ? 'fade' : 'wipe',
      fill: num(o.fill, 0.92, 0.8, 0.96),
      maxHeight: num(o.maxHeight, 0.42, 0.3, 0.45),
      stretch: WIDTHS.includes(o.stretch) ? o.stretch : 'normal',
      phoneStretch: WIDTHS.includes(o.phoneStretch) ? o.phoneStretch : 'condensed',
    };
  };

  // Echo plans, tried in order: the first whose thinnest band, strip and gap are all at least MIN px and
  // whose echo is complete in time wins; none means no echo. py is the plate's top overflow in % of the
  // cap height; xr the plate's side overflow past the ink as a share of half the ink width.
  const XR = (b) => 0.8 * (b.py / 100) * b.step / (b.shift / 100 + b.step);
  const plans = (o, phone) => (phone
    ? [{ n: 4, step: 1 / 9, shift: 5, py: 9, minH: 0.11 }, { n: 3, step: 1 / 7, shift: 6, py: 9 }]
    : [{ n: o.copies, step: Math.min(o.step, 0.6 / (o.copies - 1)), shift: o.shift, py: 5 },
      { n: 5, step: 1 / 10, shift: 3, py: 5 }, { n: 4, step: 1 / 8, shift: 4, py: 5 }]
      .filter((p, k) => k === 0 || p.n < o.copies)).map((b) => ({ ...b, xr: XR(b), strips: true }));
  // With the echo opened to e (0-1), copy j's top band shows above copy j+1's plate:
  //   H0 * (e * (shift + step + py * (j + 1) * step) - py)
  // and its side strips outside copy j+1's plate: e * step * (half + X * (j + 1)) - X, where half is half
  // the ink width (the copies scale about the ink's centre) and X the plate's side overflow.
  const thinnest = (p, h0, half) => {
    let m = Infinity;
    const X = p.xr * half, py = p.py / 100;
    for (let j = 0; j < p.n - 1; j++) {
      const sk = 1 - (j + 1) * p.step;
      m = Math.min(m, h0 * (p.shift / 100 + p.step + py * (j + 1) * p.step - py), py * h0 * sk);
      if (p.strips) m = Math.min(m, p.step * (half + X * (j + 1)) - X, X * sk);
    }
    return m;
  };
  // When each copy behind the front one steps out, in echo time (0-1): show = its side strips are MIN
  // px wide (its band is still clipped away), full = its band is MIN px thick too. Nearest copy first,
  // each at least 0.008 of the hold after the one in front of it, so the echo visibly grows outward.
  const schedule = (p, h0, half, echo) => {
    const st = p.step, sf = p.shift / 100, py = p.py / 100, X = p.xr * half, inv = INV[echo.ease];
    const du = 0.008 / echo.dur, show = [], full = [];
    for (let j = p.n - 2; j >= 0; j--) {
      const eb = (py + MIN / h0) / (sf + st + py * (j + 1) * st);
      const es = p.strips ? (X + MIN) / (st * (half + X * (j + 1))) : eb;
      let us = inv(Math.min(1, es)), uf = inv(Math.min(1, Math.max(eb, es)));
      if (j < p.n - 2) { us = Math.max(us, show[j + 1] + du); uf = Math.max(uf, full[j + 1] + du); }
      show[j] = Math.min(1, us); full[j] = Math.min(1, Math.max(uf, us));
      if (!p.strips) show[j] = full[j];
    }
    return { show, full };
  };
  const choose = (o, phone, h0, stageH, half, strips, echo, deadline) => {
    let best = null;
    for (const base of plans(o, phone)) {
      if (base.minH && h0 < base.minH * stageH) continue;
      const sf = 1 - (base.n - 1) * base.step;
      // the side overflow keeps the ground gaps between the strips open
      const xr = Math.max(base.xr, (MIN + 1) / (sf * half));
      // a shorter word needs a taller plate overflow to keep the ground gaps between its bands open;
      // a lower plate lets the bands appear sooner, so it is lowered (down to that limit) when the echo
      // would otherwise be complete too late
      const low = (100 * (MIN + 0.5)) / (h0 * sf);
      for (let py = Math.max(base.py, low); py >= low - 1e-6; py -= 0.5) {
        const p = { ...base, xr, py, strips };
        if (thinnest(p, h0, half) < MIN) continue;
        const done = ECHO_AT + schedule(p, h0, half, echo).full[0] * echo.dur;
        if (done <= deadline) return p;
        if (!best || done < best.done) best = { p, done };
        if (py === low) break;
        if (py - 0.5 < low) py = low + 0.5;
      }
    }
    return best ? best.p : { n: 1, step: 0, shift: 0, py: phone ? 9 : 5, xr: 0, strips: false };
  };

  // Ink box of one glyph at the element's font, relative to its pen position and baseline: l and r are
  // the ink's left and right edges right of the pen, a and d the ink above and below the baseline.
  // measureText's bounding box is not trusted (variable fonts report the outline's design box, several
  // pixels off), so the glyph is drawn and its pixels are read; edge coverage gives sub-pixel edges.
  // With `zone`, also how much of the cap height is inked within zone px of the left and right ink edges.
  const STRETCH = { 50: 'ultra-condensed', 62.5: 'extra-condensed', 75: 'condensed', 87.5: 'semi-condensed', 100: 'normal', 112.5: 'semi-expanded', 125: 'expanded', 150: 'extra-expanded', 200: 'ultra-expanded' };
  const fontOf = (el) => {
    const cs = getComputedStyle(el);
    return { font: `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`, stretch: STRETCH[parseFloat(cs.fontStretch)] || 'normal', fs: parseFloat(cs.fontSize) || 16 };
  };
  const ink = (ch, el, zone, cap) => {
    const { font, stretch, fs } = fontOf(el);
    const setFont = () => { pen.font = font; if ('fontStretch' in pen) pen.fontStretch = stretch; };
    setFont();
    const m = pen.measureText(ch);
    const pad = Math.ceil(fs * 0.3), bx = pad, by = Math.ceil(fs * 1.15);
    sheet.width = Math.ceil(m.width + pad * 2); sheet.height = Math.ceil(fs * 1.6);
    setFont(); pen.fillStyle = '#000'; pen.textBaseline = 'alphabetic'; pen.textAlign = 'left';
    pen.fillText(ch, bx, by);
    const W = sheet.width, H = sheet.height, px = pen.getImageData(0, 0, W, H).data;
    const col = new Float32Array(W), row = new Float32Array(H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const a = px[(y * W + x) * 4 + 3]; if (a) { if (a > col[x]) col[x] = a; if (a > row[y]) row[y] = a; } }
    let x0 = 0, x1 = W - 1, y0 = 0, y1 = H - 1;
    while (x0 < W && !col[x0]) x0++;
    while (x1 > x0 && !col[x1]) x1--;
    while (y0 < H && !row[y0]) y0++;
    while (y1 > y0 && !row[y1]) y1--;
    if (x0 >= W) return { l: 0, r: m.width, a: fs * 0.7, d: 0, w: m.width, fa: m.fontBoundingBoxAscent, fd: m.fontBoundingBoxDescent, edge: null };
    const left = x0 + 1 - col[x0] / 255, right = x1 + col[x1] / 255, topE = y0 + 1 - row[y0] / 255, bottom = y1 + row[y1] / 255;
    let edge = null;
    if (zone && cap) {
      // rows from the cap line to the baseline with ink within `zone` of each outer edge, as runs
      const side = (from, to) => {
        const runs = []; let on = -1, inked = 0;
        const ya = Math.round(by - cap), yb = Math.round(by);
        for (let y = ya; y <= yb; y++) {
          let hit = false;
          for (let x = from; x <= to && !hit; x++) hit = px[(y * W + x) * 4 + 3] > 127;
          if (hit) { inked++; if (on < 0) on = y; } else if (on >= 0) { runs.push([on - ya, y - ya]); on = -1; }
        }
        if (on >= 0) runs.push([on - ya, yb + 1 - ya]);
        const span = yb + 1 - ya;
        return { cover: inked / span, runs: runs.map(([a, b]) => [a / span, b / span]) };
      };
      const z = Math.max(1, Math.round(zone));
      edge = { l: side(x0, Math.min(x1, x0 + z)), r: side(Math.max(x0, x1 - z), x1) };
    }
    return { l: left - bx, r: right - bx, a: by - topE, d: bottom - by, w: m.width, fa: m.fontBoundingBoxAscent, fd: m.fontBoundingBoxDescent, edge };
  };
  // An outer side of the first or last letter that is mostly open would leave a grid of arm ends in the
  // echo (E, L, F, K, Z...). One run of ink that touches the cap line (T, Y, P) continues the top bands,
  // and one long run (D, O, U) reads as an arc, so those keep their strips.
  const open = (s) => {
    if (!s || s.cover >= 0.8) return false;
    if (s.runs.length === 1 && (s.runs[0][0] < 0.04 || s.runs[0][1] - s.runs[0][0] >= 0.5)) return false;
    return true;
  };
  const rel = (el, base) => { const r = el.getBoundingClientRect(); return { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height }; };
  // the laid-out box of the idx-th character (code point) of an element's text: its left edge is the pen
  // position, kerning and letter spacing included
  const charBox = (el, idx) => {
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let n, k = 0;
    while ((n = walk.nextNode())) {
      const cps = [...n.data];
      if (idx < k + cps.length) {
        const at = cps.slice(0, idx - k).join('').length;
        const r = document.createRange();
        r.setStart(n, at); r.setEnd(n, at + cps[idx - k].length);
        return r.getBoundingClientRect();
      }
      k += cps.length;
    }
    return null;
  };
  const em = (v) => v.toFixed(4) + 'em';

  const make = (root, opts = {}) => {
    const o = settings(opts);
    const stage = root.querySelector(':scope > .scene-stage') || root.firstElementChild;
    const word = root.querySelector('.ws-word');
    if (!stage || !word) return null;
    const top = root.querySelector('.ws-top');
    const meta = root.querySelector('.ws-meta');
    const drop = root.querySelector('.ws-drop');
    const label = drop && drop.querySelector('.ws-drop__label');
    let sr = word.querySelector('.ws-sr');
    let stack = word.querySelector('.ws-stack');
    const text = (word.dataset.word || (sr ? sr.textContent : word.textContent) || '').trim().replace(/\s+/g, ' ');
    if (!text) return null;
    if (!sr) { sr = document.createElement('span'); sr.className = 'ws-sr'; sr.textContent = text; word.textContent = ''; word.append(sr); }
    if (!stack) { stack = document.createElement('span'); stack.className = 'ws-stack'; stack.setAttribute('aria-hidden', 'true'); word.append(stack); }

    // the letter that falls: the asked index, else the first straight letter that is not first or last,
    // else a straight first or last letter, else an added square full stop
    const dropOn = o.drop && !!drop;
    const chars = [...text];
    let slotAt = -1, added = false;
    if (dropOn) {
      if (o.letter >= 0 && o.letter < chars.length && chars[o.letter].trim()) slotAt = o.letter;
      if (slotAt < 0) slotAt = chars.findIndex((c, i) => i > 0 && i < chars.length - 1 && STRAIGHT.includes(c));
      if (slotAt < 0) slotAt = chars.findIndex((c) => STRAIGHT.includes(c));
      if (slotAt < 0) { chars.push('.'); slotAt = chars.length - 1; added = true; }
    }
    const real = added ? chars.length - 1 : chars.length; // letters of the word itself
    root.dataset.drop = dropOn ? 'on' : 'off';
    if (/[gjpqy]/.test(text)) root.style.setProperty('--ws-plate-b', '25%');
    // the echo's timing: with the drop it opens over 16-52%; without, over 16-85%, fast first
    const ECHO = dropOn ? { dur: 0.36, ease: 'power1.inOut', due: 0.45 } : { dur: 0.69, ease: 'power2.out', due: 0.5 };

    const S = { phone: false, plan: null, btn: o.size, land: 0.3, key: '', geo: null, live: false, tl: null, front: null, slot: null, list: [], m: null, state: [] };

    // The stack holds the most copies this mode can use; the plan shows the front n of them. The back
    // copies sit in one group (.ws-back) under the front copy. An added full stop is only in the front
    // copy, so the back copies end at the last letter of the word.
    const copies = (n) => {
      const sig = `${n}|${chars.join('')}|${slotAt}`;
      if (stack.dataset.sig !== sig) {
        stack.textContent = '';
        const back = document.createElement('span');
        back.className = 'ws-back';
        stack.append(back);
        for (let i = 0; i < n; i++) {
          const front = i === n - 1;
          const c = document.createElement('span');
          c.className = 'ws-copy' + (front ? ' ws-copy--front' : '');
          c.style.setProperty('--i', i);
          if (slotAt < 0) c.textContent = chars.join('');
          else if (added && !front) c.textContent = chars.slice(0, real).join('');
          else {
            const l = document.createElement('span');
            l.className = 'ws-l' + (front ? ' ws-slot' : '');
            l.textContent = chars[slotAt];
            c.append(chars.slice(0, slotAt).join(''), l, chars.slice(slotAt + 1).join(''));
          }
          (front ? stack : back).append(c);
        }
        stack.dataset.sig = sig;
      }
      S.back = stack.querySelector(':scope > .ws-back');
      S.front = stack.lastElementChild;
      S.list = [...S.back.children, S.front];
      S.slot = S.front.querySelector('.ws-slot');
    };
    // a copy's place in the plan's echo: 0 is the back copy, n - 1 the front; copies the plan leaves out
    // are hidden and stay at 0
    const idx = (i) => Math.max(0, i - (S.list.length - S.plan.n));

    const applyPlan = (p) => {
      S.plan = p;
      const s = root.style;
      const off = S.list.length - p.n;
      S.list.forEach((el, i) => { el.style.display = i < off ? 'none' : ''; el.style.setProperty('--i', Math.max(0, i - off)); });
      s.setProperty('--ws-n', p.n);
      s.setProperty('--ws-step', p.step.toFixed(5));
      s.setProperty('--ws-shift', p.shift);
      s.setProperty('--ws-plate-y', p.py.toFixed(2) + '%');
      s.setProperty('--ws-front', ((p.n - 1) * p.shift / 100).toFixed(4));
      s.setProperty('--ws-land', S.land);
      root.dataset.plan = p.n > 1 ? 'echo' : 'flat';
    };

    // The word's shape in em, read at 100px with the stack and the front copy at rest: where its ink
    // starts and ends inside the copy box (side bearings, kerning and letter spacing included), its cap
    // height, how far each letter rises above the capitals, and whether the first and last letters'
    // outer sides are mostly open.
    const shape = () => {
      const box = S.front.getBoundingClientRect();
      const cap = trimmed ? box.height : ink('H', S.front).a;
      const ls = parseFloat(getComputedStyle(S.front).letterSpacing) || 0;
      const first = chars.findIndex((c) => c.trim()), last = real - 1;
      const cols = chars.map((ch, i) => {
        const r = charBox(S.front, i);
        const x = r ? r.left - box.left : 0;
        if (!ch.trim()) return { x: x / 100, l: null, r: null, rise: 0, edge: null };
        const g = ink(ch, S.front, i === first || i === last ? 0.07 * 100 : 0, cap);
        const adv = r ? r.width - ls : 0;
        // a canvas without font-stretch draws another width of the face: scale to the page's advance
        const k = g.w > 0 && adv > 0 && Math.abs(adv / g.w - 1) > 0.015 ? adv / g.w : 1;
        // round overshoots stay on the cap line; only real ascenders rise
        const rise = g.a - cap > 0.04 * cap ? g.a - cap : 0;
        return { x: x / 100, l: (x + g.l * k) / 100, r: (x + g.r * k) / 100, rise: rise / 100, edge: g.edge };
      });
      const inked = cols.slice(0, real).filter((c) => c.l !== null);
      const L = inked.length ? Math.min(...inked.map((c) => c.l)) : 0;
      const R = inked.length ? Math.max(...inked.map((c) => c.r)) : box.width / 100;
      const RAll = added && cols[chars.length - 1].r !== null ? Math.max(R, cols[chars.length - 1].r) : R;
      const rises = cols.slice(0, real).filter((c) => c.l !== null).map((c) => c.rise);
      return {
        w: box.width / 100, cap: cap / 100, L, R, RAll, cols,
        rise: Math.max(0, ...rises), riseMin: rises.length ? Math.min(...rises) : 0,
        openL: first >= 0 && open(cols[first].edge && cols[first].edge.l),
        openR: last >= 0 && open(cols[last].edge && cols[last].edge.r),
      };
    };

    // Plates and placement from the shape and the plan, all in em so they hold at any size: the plates
    // reach the same distance past the ink on both sides (so the strips are symmetric whatever the side
    // bearings), wider on a side whose outer letter is mostly open (no strips there at all), the copies
    // scale about the ink's centre, and the ink, not the advance box, is centred.
    const place = (m, p) => {
      const s = root.style;
      const half = (m.R - m.L) / 2;
      const X = p.n > 1 ? p.xr * half : 0.01;
      // wide enough that no strip ever shows: step * half / (front scale), plus a margin
      const wide = p.n > 1 ? p.step * half / (1 - (p.n - 1) * p.step) + 0.03 : X;
      const Xl = m.openL ? Math.max(X, wide) : X, Xr = m.openR ? Math.max(X, wide) : X;
      s.setProperty('--ws-plate-l', em(Xl - m.L));
      s.setProperty('--ws-plate-r', em(Xr - (m.w - m.R)));
      s.setProperty('--ws-plate-t', em((p.py / 100) * m.cap + m.rise));
      s.setProperty('--ws-ink-c', em((m.L + m.R) / 2 - m.w / 2));
      s.setProperty('--ws-ink-shift', em(m.w / 2 - (m.L + m.RAll) / 2));
      s.setProperty('--ws-asc', em(m.rise));
      // letters taller than the capitals get a taller plate of their own: the plate's top is a skyline
      const cols = m.cols.slice(0, real);
      if (m.rise > 0 && cols.some((c) => c.rise !== m.rise)) {
        const pl = Xl - m.L;
        const pts = [`0em 100%`, `0em ${em(m.rise - cols[0].rise)}`];
        for (let i = 1; i < cols.length; i++) {
          const x = em(cols[i].x + pl);
          pts.push(`${x} ${em(m.rise - cols[i - 1].rise)}`, `${x} ${em(m.rise - cols[i].rise)}`);
        }
        pts.push(`100% ${em(m.rise - cols[cols.length - 1].rise)}`, '100% 100%');
        s.setProperty('--ws-sky', `polygon(${pts.join(', ')})`);
      } else s.removeProperty('--ws-sky');
    };

    // Fit: the word's ink fills `fill` of the stage width, gutter to gutter, its cap height stays under
    // `maxHeight` of the stage height, and the word, the landing zone and both text rows fit the stage.
    // Free height is shared above the word and above the bottom row.
    const fit = () => {
      const p = S.plan, s = root.style;
      const live = root.classList.contains('is-live');
      const stageW = stage.clientWidth;
      const stageH = live ? stage.clientHeight : Math.min(window.innerHeight, document.documentElement.clientHeight || window.innerHeight);
      const cs = getComputedStyle(stage), rs = getComputedStyle(root);
      const padT = parseFloat(cs.paddingTop) || 0, padB = parseFloat(cs.paddingBottom) || 0;
      // clearances come from the stylesheet (they tighten on short stages); a short stage lands the
      // smaller button
      const topGap = parseFloat(rs.getPropertyValue('--ws-top-gap')) || 48;
      S.gap = parseFloat(rs.getPropertyValue('--ws-gap-min')) || 40;
      S.btn = S.phone || stageH < 600 ? o.phoneSize : o.size;
      s.setProperty('--ws-btn-w', S.btn[0] + 'px');
      s.setProperty('--ws-btn-h', S.btn[1] + 'px');
      const innerW = stage.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
      s.setProperty('--ws-size', '100px');
      if (!trimmed) {
        const h = ink('H', S.front);
        s.setProperty('--ws-lh', ((2 * h.a - h.fa + h.fd) / 100).toFixed(4));
        s.setProperty('--ws-cap-h', (h.a / 100).toFixed(4) + 'em');
      }
      const keep = [stack.style.transform, S.front.style.transform];
      stack.style.transform = 'none'; S.front.style.transform = 'none';
      const m = shape();
      stack.style.transform = keep[0]; S.front.style.transform = keep[1];
      S.m = m;
      const rise = m.rise / m.cap;
      let size = Math.min(o.fill * stageW, innerW) / (m.RAll - m.L);
      size = Math.min(size, (o.maxHeight * stageH) / m.cap);
      const topH = top ? top.offsetHeight : 0, metaH = meta ? meta.offsetHeight : 0;
      const avail = stageH - padT - padB - topH - metaH;
      // height the word needs: clearance under the top row (from its tallest letter), the word, its sink,
      // the landing zone
      const need = (h) => Math.max(topGap, 0.13 * h) + h * (1 + rise + (p.n - 1) * p.shift / 100) + (drop ? land(h) + S.btn[1] / 2 : 0);
      let lo = 0, hi = size * m.cap;
      if (need(hi) > avail) { for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (need(mid) > avail) hi = mid; else lo = mid; } hi = lo; }
      size = Math.max(16, hi / m.cap);
      const h0 = size * m.cap;
      s.setProperty('--ws-size', size.toFixed(2) + 'px');
      s.setProperty('--ws-h0', h0.toFixed(2) + 'px');
      s.setProperty('--ws-lift', Math.max(0, (avail - need(h0)) * 0.5).toFixed(1) + 'px');
      place(m, p);
      return { h0, stageH, half: ((m.R - m.L) / 2) * size };
    };
    // the button's centre below the front copy's baseline: a share of the word height, but never so
    // close that a short word sits on the button
    const land = (h) => Math.max(S.land * h, S.btn[1] / 2 + S.gap);

    // The bar's whole path from the handoff to the landing, as one function of the progress p, so the
    // timeline and the overlap test below move exactly the same bar. x, y: centre in stage px; r: degrees;
    // sx, sy: scale of the landed button's local box (thickness, length).
    // It turns about a hinge on its own axis, lam of the way from its centre to its top end (0 = the
    // centre): the hinge drops with gravity and drifts late, the bar swings about it. A high hinge keeps
    // the part of the bar still inside the word in the slot's own column while its foot swings out below
    // the baseline, so it falls out of the word instead of through its neighbours.
    const bar = (p, g, v = g.v) => {
      const seg = (a, d) => clamp((p - a) / d, 0, 1);
      const dir = v.dir, lam = v.lam;
      // the size of the letter while it crosses the word, then thickness (power2.in) and length (power3.in)
      let sx = g.kx + (1 - g.kx) * seg(0.66, 0.14) ** 3;
      let sy = g.ky + (1 - g.ky) * seg(0.69, 0.11) ** 4;
      const a = (lam * S.btn[0] * Math.min(1, sy)) / 2;                       // hinge to centre, now
      const aEnd = (lam * S.btn[0]) / 2;
      const hy0 = g.sy - (lam * g.h0) / 2, hxE = g.tx + aEnd * dir;          // hinge at the handoff, landed
      const sag = sine(seg(0.52, 0.05)) * 0.03 * g.H0;                       // loosen: it sags
      const fall = seg(0.57, 0.23);                                            // then drops (power1.in)
      const hy = hy0 + sag + (g.ty - hy0 - 0.03 * g.H0) * fall * fall;
      const hx = g.sx + (hxE - g.sx) * seg(0.62, 0.18) ** 3;                  // drifts late (power2.in)
      const r = dir * (8 * sine(seg(0.52, 0.08)) + 82 * seg(0.6, 0.2) ** 3);   // tilts late (power2.in)
      const th = (r * Math.PI) / 180;
      const x = hx - a * Math.sin(th), y = hy + a * Math.cos(th);
      if (p > 0.8) {
        // landing squash: thinner and longer (power1.out), then back with a small overshoot (back.out(2))
        const a = 1 - (1 - seg(0.8, 0.03)) ** 2, b = backOut2(seg(0.83, 0.05));
        const q = p < 0.83 ? a : 1 - b;
        sx *= 1 - 0.16 * q; sy *= 1 + 0.05 * q;
      }
      return { x, y, r, sx, sy };
    };
    // the word's recoil as the letter lets go (stack y), the same curve as the timeline's two tweens
    const recoilAt = (p, g) => {
      const R = (S.phone ? 0.03 : 0.02) * g.H0;
      if (p <= 0.6 || p >= 0.68) return 0;
      if (p < 0.63) { const t = (p - 0.6) / 0.03; return -R * (1 - (1 - t) * (1 - t)); }
      return -R * (1 - EASE['power1.inOut']((p - 0.63) / 0.05));
    };

    // Which way the bar tips and where its hinge sits. Each choice is moved along its path over a drawing
    // of the word at its final echo state; the bar takes the one that overlaps the other letters least,
    // and of close ones the one whose hinge travels least sideways (it reads as falling, not sliding).
    // g.cross is the chosen path's worst overlap from 62% to 78%, as a length of bar.
    let simA = null, simB = null;
    const tipping = (g, f, size) => {
      const k = Math.min(0.4, 560 / g.stageW);
      const W = Math.max(1, Math.ceil(g.stageW * k)), Hc = Math.max(1, Math.ceil(g.stageH * k));
      simA = simA || document.createElement('canvas'); simB = simB || document.createElement('canvas');
      simA.width = simB.width = W; simA.height = simB.height = Hc;
      const a = simA.getContext('2d'), b = simB.getContext('2d', { willReadFrequently: true });
      const { font, stretch } = fontOf(S.front);
      a.setTransform(k * g.s, 0, 0, k * g.s, k * g.ox * (1 - g.s), k * (g.oy * (1 - g.s) + (g.base - g.oy)));
      a.font = font; if ('fontStretch' in a) a.fontStretch = stretch;
      a.fillStyle = '#000'; a.textBaseline = 'alphabetic'; a.textAlign = 'left';
      chars.forEach((ch, i) => { if (i !== slotAt && ch.trim()) a.fillText(ch, f.x + S.m.cols[i].x * size, g.oy); });
      const [bw, bh] = S.btn;
      const run = (v) => {
        let total = 0, worst = 0;
        for (let p = 0.53; p <= 0.8001; p += 0.01) {
          const s = bar(p, g, v), ry = recoilAt(p, g);
          const hw = (bh * s.sx) / 2, hh = (bw * s.sy) / 2, c = Math.cos((s.r * Math.PI) / 180), n = Math.sin((s.r * Math.PI) / 180);
          const pts = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([u, v]) => [(s.x + u * c - v * n) * k, (s.y + u * n + v * c) * k]);
          const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
          const x0 = clamp(Math.floor(Math.min(...xs)), 0, W - 1), x1 = clamp(Math.ceil(Math.max(...xs)), 1, W);
          const y0 = clamp(Math.floor(Math.min(...ys)), 0, Hc - 1), y1 = clamp(Math.ceil(Math.max(...ys)), 1, Hc);
          if (x1 <= x0 || y1 <= y0) continue;
          b.globalCompositeOperation = 'copy';
          b.drawImage(simA, 0, ry * k);
          b.globalCompositeOperation = 'destination-in';
          b.beginPath(); pts.forEach((q, i) => (i ? b.lineTo(q[0], q[1]) : b.moveTo(q[0], q[1]))); b.closePath(); b.fill();
          const d = b.getImageData(x0, y0, x1 - x0, y1 - y0).data;
          let sum = 0;
          for (let i = 3; i < d.length; i += 4) sum += d[i];
          const area = sum / 255 / (k * k);
          total += area;
          if (p >= 0.615 && p <= 0.785) worst = Math.max(worst, area / Math.max(1, bh * s.sx));
        }
        return { v, total, worst, slide: Math.abs(g.tx + (v.lam * bw * v.dir) / 2 - g.sx) };
      };
      const runs = [];
      for (const lam of [0, 0.5, 0.9]) for (const dir of [1, -1]) runs.push(run({ dir, lam }));
      const least = Math.min(...runs.map((q) => q.total));
      const pick = runs.filter((q) => q.total <= Math.max(least * 1.15, least + 300)).sort((q, w) => q.slide - w.slide)[0];
      return { v: pick.v, dir: pick.v.dir, cross: pick.worst, other: Math.max(...runs.map((q) => q.worst)) };
    };

    // Geometry for the handoff, the echo's steps and the landing, measured with the stack and the front
    // copy at rest.
    const measure = () => {
      const p = S.plan;
      const base = stage.getBoundingClientRect();
      const keep = [stack.style.transform, S.front.style.transform];
      stack.style.transform = 'none'; S.front.style.transform = 'none';
      const f = rel(S.front, base);
      const sl = S.slot ? rel(S.slot, base) : null;
      stack.style.transform = keep[0]; S.front.style.transform = keep[1];
      const stageW = base.width;
      const size = parseFloat(getComputedStyle(S.front).fontSize) || 100;
      // the echo's origin: the ink's centre on the baseline
      const H = f.h, ox = f.x + f.w / 2 + ((S.m.L + S.m.R) / 2 - S.m.w / 2) * size, oy = f.y + f.h;
      const s = 1 - (p.n - 1) * p.step, sh = ((p.n - 1) * p.shift) / 100;
      const g = { stageW, stageH: base.height, H0: H, ox, oy, s, base: oy + sh * H, dir: 1, sx: ox, sy: oy, w0: 1, h0: 1, kx: 1, ky: 1, tx: ox, ty: oy, cross: 0 };
      // when each copy behind the front one steps out (echo time), and the plate line its band hides under
      // until then (in the copy's own height: the cap letters' plate top)
      const half = ((S.m.R - S.m.L) / 2) * size;
      Object.assign(g, p.n > 1 ? schedule(p, H, half, ECHO) : { show: [], full: [] });
      g.pt = p.py / 100 + S.m.riseMin / S.m.cap;
      if (sl) {
        const m = ink(S.slot.textContent, S.front);
        const adv = sl.w - (parseFloat(getComputedStyle(S.front).letterSpacing) || 0);
        const k = m.w > 0 && Math.abs(adv / m.w - 1) > 0.015 ? adv / m.w : 1;
        const l = sl.x + m.l * k, r = sl.x + m.r * k, t = oy - m.a, b = oy + m.d;
        const cx = (l + r) / 2, cy = (t + b) / 2;
        const [bw, bh] = S.btn;
        const gut = parseFloat(getComputedStyle(stage).paddingLeft) || 16;
        g.sx = ox + (cx - ox) * s;
        g.sy = oy + (cy - oy) * s + sh * H;
        g.w0 = (r - l) * s;
        g.h0 = (b - t) * s;
        g.kx = g.w0 / bh; g.ky = g.h0 / bw;
        // landing centre: under the word's centre; on desktop, straight under its slot when the letter
        // came from near one end of the word (anything between reads as a near miss). On whole pixels.
        const off = Math.abs(ox - g.sx);
        const tx = S.phone || off <= 0.2 * stageW ? ox : g.sx;
        g.tx = Math.round(clamp(tx, gut + bw / 2, stageW - gut - bw / 2));
        const floor = meta ? rel(meta, base).y - bh / 2 : base.height - bh;
        g.ty = Math.round(Math.min(g.base + land(H), floor));
        g.dir = g.sx <= ox ? 1 : -1;
        g.v = { dir: g.dir, lam: 0 };
        if (S.live) Object.assign(g, tipping(g, f, size));
      }
      root.style.setProperty('--dir', g.dir);
      return g;
    };

    // Fit, plan and geometry, redone whenever the stage size or the fonts change. The plan is chosen
    // again each time: the echo the fitted height can carry (a late web font can change it).
    const key = () => `${stage.clientWidth}x${stage.clientHeight}x${window.innerHeight}|${document.fonts ? document.fonts.status : ''}|${S.fonts || 0}`;
    const G = () => {
      const k = key();
      if (k !== S.key || !S.geo) {
        S.key = k;
        const r = fit();
        const q = choose(o, S.phone, r.h0, r.stageH, r.half, !(S.m.openL && S.m.openR), ECHO, ECHO.due);
        const P = S.plan;
        if (q.n !== P.n || q.step !== P.step || q.shift !== P.shift || q.py !== P.py || q.xr !== P.xr || q.strips !== P.strips) { applyPlan(q); fit(); }
        S.geo = measure();
      }
      return S.geo;
    };

    // Every frame of the live scene: which copies of the echo show (and how much of each), the bar, and
    // the label on it. All of it follows from the timeline's time, so scrolling back undoes it exactly.
    const sync = () => {
      if (!S.tl || !S.live) return;
      // the geometry is kept current by refreshes and resizes; reading it here forces no layout
      const g = S.geo || G(), P = S.plan, t = S.tl.time();
      if (P.n > 1) {
        const u = clamp((t - ECHO_AT) / ECHO.dur, 0, 1), e = EASE[ECHO.ease](u);
        const off = S.list.length - P.n;
        for (let j = 0; j < P.n - 1; j++) {
          const el = S.list[off + j];
          const st = u >= g.full[j] ? 2 : u >= g.show[j] ? 1 : 0;
          let clip = '';
          if (st === 1) {
            // its side strips only: cut it at the next copy's plate top, 1.5px low, so no sliver of the
            // band (still thinner than MIN) shows above that plate
            const sj = 1 - e * j * P.step, sn = 1 - e * (j + 1) * P.step;
            const T = 1 - ((1 + g.pt) * sn - (e * P.shift) / 100) / sj + 1.5 / (g.H0 * sj);
            clip = `inset(${(T * 100).toFixed(3)}% -60% -60% -60%)`;
          }
          const was = S.state[j] || { st: -1, clip: null };
          if (was.st !== st) el.style.visibility = st ? '' : 'hidden';
          if (was.clip !== clip) el.style.clipPath = clip;
          S.state[j] = { st, clip };
        }
      }
      if (dropOn) {
        const b = bar(Math.max(0.52, t), g);
        const tr = `translate(${b.x.toFixed(2)}px, ${b.y.toFixed(2)}px) translate(-50%, -50%) rotate(${b.r.toFixed(3)}deg) scale(${b.sx.toFixed(4)}, ${b.sy.toFixed(4)})`;
        if (drop.style.transform !== tr) drop.style.transform = tr;
        // the label keeps its own size and stays upright to the bar: scaled by the bar's inverse (its
        // axes are the bar's, turned a quarter) and clipped to the bar
        if (label) {
          const lt = `translate(-50%, -50%) rotate(${-90 * g.dir}deg) scale(${(1 / b.sy).toFixed(4)}, ${(1 / b.sx).toFixed(4)})`;
          if (label.style.transform !== lt) label.style.transform = lt;
        }
      }
    };

    const clear = () => {
      S.list.forEach((el) => { el.style.visibility = ''; el.style.clipPath = ''; });
      S.state = [];
      if (drop) drop.style.transform = '';
      if (label) label.style.transform = '';
    };

    const prepare = (phone) => {
      S.phone = phone;
      S.btn = phone ? o.phoneSize : o.size;
      S.land = phone ? 0.8 : 0.3;
      root.style.setProperty('--ws-land', S.land);
      root.style.setProperty('--ws-stretch', phone ? o.phoneStretch : o.stretch);
      if (o.radius) root.style.setProperty('--ws-radius', o.radius + 'px');
      // the accent belongs to the landed button; while it is still the letter it is ink
      if (o.accent && (!S.live || !dropOn)) root.style.setProperty('--ws-btn', o.accent);
      else root.style.removeProperty('--ws-btn');
      const first = plans(o, phone)[0];
      copies(first.n);
      clear();
      applyPlan(first);
      S.key = ''; S.geo = null;
      return G();
    };

    const build = (tl, c) => {
      S.live = true;
      S.tl = null;
      prepare(c.phone);
      const list = S.list;
      const sq = c.phone ? o.squash * 0.7 : o.squash;
      // T2-T3 load and spring, about the baseline
      if (sq > 0) {
        tl.fromTo(stack, { scaleX: 1, scaleY: 1 }, { scaleY: 1 - sq, scaleX: 1 + sq * 0.12, duration: 0.11, ease: 'power1.in' }, 0.05)
          .to(stack, { scaleY: 1, scaleX: 1, duration: 0.12, ease: `back.out(${o.spring})` }, 0.16);
      }
      // T4 the echo: copy i sinks and shrinks, the back copy never moves (values follow the current plan).
      // Which copies show, and how much of each, is decided frame by frame in sync().
      list.forEach((el, i) => {
        if (i) tl.fromTo(el, { scale: 1, yPercent: 0 }, { scale: () => (G(), 1 - idx(i) * S.plan.step), yPercent: () => (G(), idx(i) * S.plan.shift), duration: ECHO.dur, ease: ECHO.ease }, ECHO_AT);
      });
      if (dropOn) {
        const recoil = c.phone ? 0.03 : 0.02;
        gsap.set(drop, { opacity: 0, pointerEvents: 'none' });
        if (label) gsap.set(label, o.reveal === 'fade' ? { opacity: 0 } : { clipPath: 'inset(0% 100% 0% 0%)' });
        // T5 the bar takes the slot glyph's exact place (its path, T6-T13, is bar() above, set in sync())
        tl.set(drop, { opacity: 1 }, 0.52)
          .set(S.slot, { visibility: 'hidden' }, 0.52)
          // T7 the word recoils as the letter lets go
          .fromTo(stack, { y: 0 }, { y: () => -recoil * G().H0, duration: 0.03, ease: 'power1.out', immediateRender: false }, 0.6)
          .to(stack, { y: 0, duration: 0.05, ease: 'power1.inOut' }, 0.63)
          // the timeline spans the whole fall and landing
          .to({}, { duration: 0.36 }, 0.52);
        if (o.radius) tl.fromTo(drop, { borderRadius: 0 }, { borderRadius: o.radius, duration: 0.1, immediateRender: false }, 0.68);
        // T12 the label is written along the bar while it falls, complete before it lands
        if (label) {
          if (o.reveal === 'fade') tl.to(label, { opacity: 1, duration: 0.06 }, 0.74);
          else tl.to(label, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.08 }, 0.72);
        }
        // T14 then it is a button
        tl.set(drop, { pointerEvents: 'auto' }, 0.84);
        if (o.accent) tl.to(drop, { backgroundColor: o.accent, duration: 0.04 }, 0.8);
      }
      tl.eventCallback('onUpdate', sync);
      S.tl = tl;
      sync();
    };

    // Finished composition: the stepped word, the button where the live scene lands it.
    const rest = (c) => {
      S.live = false; S.tl = null;
      prepare(!!(c && c.phone));
      if (!drop) return;
      const g = G();
      const stageW = g.stageW;
      const gut = parseFloat(getComputedStyle(stage).paddingLeft) || 16;
      const cx = dropOn ? g.tx : clamp(g.ox, gut + S.btn[0] / 2, stageW - gut - S.btn[0] / 2);
      root.style.setProperty('--ws-cta-x', (cx - stageW / 2).toFixed(1) + 'px');
    };

    // Keyboard: the link can take focus at any progress; bring the landed button to it.
    if (drop) {
      drop.addEventListener('focus', () => {
        const st = S.live && S.tl && S.tl.scrollTrigger;
        if (!st || st.progress >= 0.86 || !root.classList.contains('is-live')) return;
        if (window.Stage && Stage.lenis) Stage.lenis.scrollTo(st.end, { immediate: true, force: true });
        else window.scrollTo(0, st.end);
      });
    }

    // Fonts that arrive late and resizes refit the word at once; a live scene also re-measures its timeline.
    let wait = 0, last = '';
    const refit = (force) => {
      const k = key();
      if (!force && k === last) return;
      last = k;
      if (root.classList.contains('is-rest') || !(window.Stage && Stage.live)) rest({ phone: window.matchMedia('(max-width: 767px)').matches });
      else if (S.live) { S.key = ''; G(); sync(); }
    };
    if (document.fonts) {
      document.fonts.addEventListener('loadingdone', () => {
        S.fonts = (S.fonts || 0) + 1;
        clearTimeout(wait);
        wait = setTimeout(() => { refit(true); if (S.live && window.ScrollTrigger) ScrollTrigger.refresh(); }, 80);
      });
    }
    if (window.ResizeObserver) new ResizeObserver(() => refit(false)).observe(stage);

    const scrub = o.scrub !== null ? o.scrub : (window.Stage && Stage.lenis ? true : 0.8);
    // for test pages: the live geometry (overlap of the falling bar, the echo's schedule)
    root.wsGeometry = () => S.geo;
    if (!window.Stage) return null;
    const mm = Stage.scene(root, {
      hold: o.hold,
      scrub,
      build,
      phone: o.phone === 'rest' ? 'rest' : { hold: o.phoneHold, build },
      rest,
    });
    // Stage work-around: gsap.matchMedia only calls back when one of its conditions matches, and reduced
    // motion on a desktop matches neither (motion, phone), so the stage never shows the rest composition
    // there. Do it here, and again whenever the media change into that state.
    if (mm && window.matchMedia) {
      const motion = window.matchMedia('(prefers-reduced-motion: no-preference)');
      const small = window.matchMedia('(max-width: 767px)');
      const orphan = () => {
        if (motion.matches || small.matches) return;
        root.classList.remove('is-live');
        root.classList.add('is-rest');
        root.style.removeProperty('--hold');
        rest({ root, stage, phone: false });
      };
      orphan();
      motion.addEventListener('change', () => setTimeout(orphan));
      small.addEventListener('change', () => setTimeout(orphan));
    }
    return mm;
  };

  window.Scenes = window.Scenes || {};
  window.Scenes[ID] = make;
})();
