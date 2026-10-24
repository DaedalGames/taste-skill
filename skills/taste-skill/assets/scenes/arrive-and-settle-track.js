// tasteskill / scenes / arrive-and-settle-track.js — "Arrive and settle on a sideways track".
//
// A pinned row slides left at the speed of the scroll. Each item's vertical offset and tilt come from
// where that item is on screen: scattered as it enters at the right edge, swooping through its resting
// line and settled by 45% of the width, so the row seems to assemble itself as it passes. The default
// is a giant closing line whose letters land one by one and finish on a calm end frame with a button.
// Two presets use the same mapping for a testimonial staircase and for project pictures that rise.
//
// Needs gsap + ScrollTrigger (no SplitText: the line is split here). Load after stage.js.
//
// ── DOM, preset "type" (the default) ─────────────────────────────────────────────────────────────
// <section class="scene" data-scene="arrive-and-settle-track" aria-label="Book a session">
//   <div class="scene-stage">
//     <div class="settle">
//       <div class="settle__track">
//         <h2 class="settle__line">Shall we make a record?</h2>
//         <div class="settle__cluster">
//           <p class="settle__support">One supporting sentence of six to twelve words.</p>
//           <a class="settle__cta" href="#book">Book a session</a>
//         </div>
//       </div>
//     </div>
//   </div>
// </section>
// The line: plain text, 3-5 words, 14-28 characters, ideally a question or an invitation; the first
// word has four or more letters so it reads the moment the section arrives. It is split into letters
// at runtime (the h2 keeps the text as its aria-label). Kerning is measured and put back per pair.
// Keep the line to 14 characters or more. A shorter line still ends cleanly (the end frame always
// starts on a whole word and the cluster still lands on the right margin), but it has little sideways
// travel: its letters get a short run-in of their own, and the swoop is brief. Under 14 characters,
// use a plain heading instead.
// Longest word: about 11 characters keeps the full size (17vw). A longer word still fits: the whole
// line is set smaller until that word fits between the margins (a 14-character word such as
// "extraordinary?" takes the line from 245px to about 200px at 1440x900), and on the phone the line
// shrinks until its widest word fits the column. Above 16 characters in one word, rewrite the line.
//
// ── DOM, preset "stair" (testimonials; 5-7 cards read best, 3-12 work) ──────────────────────────
// <section class="scene" data-scene="arrive-and-settle-track" data-settle="stair" aria-label="...">
//   <div class="scene-stage"><div class="settle">
//     <h2 class="settle__heading">A heading of six words at most</h2>
//     <div class="settle__track">
//       <article class="settle__card">                       measured, never moved
//         <div class="settle__body">                          moved
//           <blockquote class="settle__quote"><p>A quote of 25-45 words.</p></blockquote>
//           <p class="settle__who"><img class="settle__avatar" src="…" width="96" height="96" alt="">
//             <span><b>Name</b> Role</span></p>
//         </div>
//       </article> …
//     </div>
//   </div></div>
// </section>
//
// ── DOM, preset "rise" (project track; 3-5 projects read best) ───────────────────────────────────
// <section class="scene" data-scene="arrive-and-settle-track" data-settle="rise" aria-label="...">
//   <div class="scene-stage"><div class="settle"><div class="settle__track">
//     <div class="settle__intro"><h2 class="settle__heading">Up to five words</h2><p>One sentence.</p></div>
//     <article class="settle__card"><div class="settle__body">
//       <figure class="settle__picture"><img src="…" width="1200" height="822" alt="…"></figure>   1.46:1
//       <div class="settle__caption"><h3>Title</h3><p>12-20 words.</p><a href="…">Link label</a></div>
//     </div></article> …
//     <div class="settle__outro"><p>One closing sentence.</p><a class="settle__cta" href="…">Action</a></div>
//   </div></div></div>
// </section>
//
// ── Options (data-options='{"speed":0.9}'; defaults per preset: type / stair / rise) ─────────────
//   preset  'type' | 'stair' | 'rise'      the data-settle attribute, else 'type'
//   speed   0.7-1.3    px of sideways travel per px of scroll (1 / 1 / 1.2). Lower is grander and holds
//                      longer. Values from 0.3 to 3 are accepted; outside 0.7-1.3 the move reads as
//                      sluggish or rushed. The hold is measured: travel ÷ (screen × speed) + rest, kept to
//                      1-4 screens. The 4-screen cap wins over `speed` on long lines (a 39-character line
//                      at speed 0.7 reaches it), so there the track runs faster than `speed` asks.
//   rest    0.2-0.6    screens of still end frame after the travel stops (0.3; 0-2 accepted)
//   amp     0.6-1.5    letter offset as a multiple of the letter height (1.5); always clamped so every
//                      letter stays 64px inside the stage (plus `inset`)
//   tilt    0-20       largest letter tilt in degrees (18). A letter's tilt follows its height: it
//                      leans right below its line and left above it, 60-100% of `tilt` at its largest
//                      offset, so neighbours passing each other never lean into each other. Cards: 0
//   lift    20-60      card offset in vh (- / 36 / 60)
//   curve   'swoop' | 'calm' | 'linear'   (swoop / linear / calm). swoop = one 16% overshoot through
//                      the line, calm = power2.out with none, linear = stairs. No bouncing curve ships.
//   settle  0.30-0.60  fraction of the width by which an item has settled (0.45 / 0.30 / 0.50)
//   enter   1.00-1.25  where the move begins, as a fraction of the width (1.04 / 1.20 / 1.20)
//   inset   px         height of a fixed header the letters must stay clear of (0)
//   scrub   true | s   catch-up in seconds, 0.1-3 (true when Lenis runs, else 0.5)
// A value that is not a number (or an unknown curve or preset) falls back to the preset's default, so
// a typo in data-options never switches the effect off or collapses the section.
//
// End frame (type): the line's last words level from the left, the support line and button beside
// them with their bottom on the line's, and the visible margins equal on both sides (the cluster's
// right edge mirrors the first letter's left edge). The travel ends on a word boundary, so the end
// frame never starts on a sliced letter. It keeps two words or more whenever it can: first beside the
// cluster as it is, then beside a narrower support line (down to 20 characters a line), then with the
// cluster under the line. Only when even two words cannot fit does it end on the last word alone.
//
// Phone (below 768px): no pin and no sideways travel. The stack is laid out like the finished
// composition and the same mapping is turned 90°: the letters swoop onto their lines in reading order
// as the line rises from the bottom edge to 42% of the screen (the first row from above or below, the
// rows under it from below, so rows never cross); the support line and button rise in as the last
// letters land. As the first section it keeps a whole first screen, its first word reads level at
// once, its button shows from the start, and the first scroll assembles the rest. Cards rise 16vh.
// Reduced motion and no script: the finished composition (no split, nothing hidden), also when reduced
// motion is switched on while the page is open.
(() => {
  const ID = 'arrive-and-settle-track';
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  // an option as a number, or the default when it is missing or not a number ("long", "", true, null)
  const num = (v, d) => (typeof v === 'number' || (typeof v === 'string' && v.trim() !== '') ? (Number.isFinite(+v) ? +v : d) : d);
  const p2io = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); // power2.inOut
  const sio = (t) => -(Math.cos(Math.PI * t) - 1) / 2;                               // sine.inOut
  const p2o = (t) => 1 - Math.pow(1 - t, 3);                                          // power2.out
  const lin = (t) => t;

  // Fraction of the offset still applied, as a function of u (0 = entering, 1 = settled).
  // Two-segment curves keyed to position; never elastic, back or bouncing eases (house taste, and keyed
  // to position they finish off-screen).
  // swoop: the letter passes through its line into a 16% overshoot and settles. The tilt runs on the
  // same curve as the height (see seeds), so a letter's lean always matches where it is.
  const SWOOP = [[0, 0.55, 1, -0.16, p2io], [0.55, 1, -0.16, 0, sio]];
  const CURVES = {
    swoop: { y: SWOOP, r: SWOOP },
    calm: { y: [[0, 1, 1, 0, p2o]], r: [[0, 1, 1, 0, p2o]] },
    linear: { y: [[0, 1, 1, 0, lin]], r: [[0, 1, 1, 0, lin]] },
  };
  const curveAt = (segs, u) => {
    for (const [a, b, f, t, e] of segs) if (u <= b) return f + (t - f) * e((u - a) / (b - a));
    return 0;
  };

  // Seeds: the scatter is a function of the text, the same on every load, different for other copy.
  const fnv = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return h >>> 0; };
  const mulberry32 = (a) => () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const seeds = (text, n, glyphs) => {
    const rand = mulberry32(fnv(text));
    const out = []; let last = 0, run = 0;
    for (let i = 0; i < n; i++) {
      let sign = rand() < 0.5 ? -1 : 1;
      if (sign === last && run >= 2) sign = -sign;                  // never three the same way in a row
      run = sign === last ? run + 1 : 1; last = sign;
      let m = 0.6 + 0.1 * Math.floor(rand() * 5);                    // 0.6-1.0 of the largest offset
      if (glyphs && /[^\p{L}\p{N}]/u.test(glyphs[i] || '')) m = Math.min(m, 0.8);  // punctuation stays calmer
      rand(); rand();                                                 // (kept: the old tilt draws, so the scatter stays put)
      // The tilt follows the height: a letter below its line leans right (top forward), above it
      // leans left, by as much as it is displaced (0.6-1.0 of the largest tilt with the offset). Two
      // neighbours that pass at the same height are then parallel, and one at another height leans
      // away from the other, so their ink never meets in the tight -0.045em tracking.
      out.push({ a: sign * m, m, r: sign * m });
    }
    return out;
  };

  // Split the line into words (nowrap) of inline-block letters; spaces stay real text between words.
  const split = (line) => {
    if (line.__settle) return line.__settle;
    const text = line.textContent.replace(/\s+/g, ' ').trim();
    const rec = { html: line.innerHTML, label: line.getAttribute('aria-label'), text, chars: [], words: [] };
    if (!rec.label) line.setAttribute('aria-label', text);
    line.textContent = '';
    text.split(' ').forEach((w, i) => {
      if (i) line.append(' ');
      const word = document.createElement('span');
      word.className = 'settle__word';
      for (const ch of Array.from(w)) {
        const c = document.createElement('span');
        c.className = 'settle__char';
        c.setAttribute('aria-hidden', 'true');
        c.textContent = ch;
        word.append(c);
        rec.chars.push(c);
      }
      line.append(word);
      rec.words.push(word);
    });
    line.__settle = rec;
    return rec;
  };
  const unsplit = (line) => {
    const rec = line && line.__settle;
    if (!rec) return;
    line.innerHTML = rec.html;
    if (!rec.label) line.removeAttribute('aria-label');
    delete line.__settle;
  };

  // Splitting into inline-blocks drops kerning; measure each pair on a canvas and put it back.
  let kctx = null;
  const kern = (line, chars) => {
    kctx = kctx || document.createElement('canvas').getContext('2d');
    if (!kctx) return;
    const cs = getComputedStyle(line);
    kctx.font = `${cs.fontStyle} ${cs.fontWeight} 100px ${cs.fontFamily}`;
    if ('fontKerning' in kctx) kctx.fontKerning = 'normal';
    const w = (s) => kctx.measureText(s).width;
    for (let i = 0; i < chars.length; i++) {
      const a = chars[i], b = chars[i + 1];
      const k = b && a.parentNode === b.parentNode ? w(a.textContent + b.textContent) - w(a.textContent) - w(b.textContent) : 0;
      a.style.marginRight = Math.abs(k) > 0.4 ? (k / 100).toFixed(4) + 'em' : '';
    }
  };
  // Where a letter's ink starts inside its box (its left side bearing), in em. Call after kern().
  const bearing = (ch) => {
    if (!kctx) return 0;
    const m = kctx.measureText(ch);
    return Number.isFinite(m.actualBoundingBoxLeft) ? -m.actualBoundingBoxLeft / 100 : 0;
  };

  // Writes only what changed (a still letter costs nothing).
  const put = (it, x, y, r, o) => {
    if (it.x === x && it.y === y && it.r === r) { if (o !== undefined && it.o !== o) { it.el.style.opacity = o === 1 ? '' : o; it.o = o; } return; }
    it.x = x; it.y = y; it.r = r;
    it.el.style.transform = x || y || r ? `translate3d(${x}px, ${y}px, 0)${r ? ` rotate(${r}deg)` : ''}` : '';
    if (o !== undefined && it.o !== o) { it.el.style.opacity = o === 1 ? '' : o; it.o = o; }
  };
  const r1 = (v) => Math.round(v * 10) / 10;
  const r2 = (v) => Math.round(v * 100) / 100;

  // The visible width of a block of text: its widest line, not its box.
  const textWidth = (el) => {
    const rg = document.createRange();
    rg.selectNodeContents(el);
    return rg.getBoundingClientRect().width;
  };

  // One listener for every scene of this type: a web font that arrives late changes every width.
  let fontsWired = false;
  const wireFonts = () => {
    if (fontsWired || !window.ScrollTrigger || !document.fonts || !document.fonts.addEventListener) return;
    fontsWired = true;
    document.fonts.addEventListener('loadingdone', () => ScrollTrigger.refresh());
  };

  const PRESETS = {
    type: { speed: 1, amp: 1.5, tilt: 18, lift: 0, curve: 'swoop', settle: 0.45, enter: 1.04 },
    stair: { speed: 1, amp: 1, tilt: 0, lift: 36, curve: 'linear', settle: 0.3, enter: 1.2 },
    rise: { speed: 1.2, amp: 1, tilt: 0, lift: 60, curve: 'calm', settle: 0.5, enter: 1.2 },
  };

  window.Scenes = window.Scenes || {};
  window.Scenes[ID] = (root, opts = {}) => {
    const preset = PRESETS[opts.preset] ? opts.preset : PRESETS[root.dataset.settle] ? root.dataset.settle : 'type';
    root.dataset.settle = preset;
    // every option falls back to the preset's value when it is missing or not a number
    const P = PRESETS[preset];
    const o = {
      speed: clamp(num(opts.speed, P.speed), 0.3, 3),
      rest: clamp(num(opts.rest, 0.3), 0, 2),
      amp: clamp(num(opts.amp, P.amp), 0, 2),
      tilt: clamp(num(opts.tilt, P.tilt), 0, 30),
      lift: clamp(num(opts.lift, P.lift), 0, 90),
      settle: clamp(num(opts.settle, P.settle), 0.1, 0.9),
      enter: clamp(num(opts.enter, P.enter), 0.9, 1.5),
      inset: Math.max(0, num(opts.inset, 0)),
      curve: Object.prototype.hasOwnProperty.call(CURVES, opts.curve) ? opts.curve : P.curve,
    };
    const curve = CURVES[o.curve];
    const lenis = !!(window.Stage && Stage.lenis);
    const sv = num(opts.scrub, NaN);
    const scrub = opts.scrub === true ? true : Number.isFinite(sv) && sv > 0 ? clamp(sv, 0.1, 3) : lenis ? true : 0.5;

    const $ = (sel) => root.querySelector(sel);
    const $$ = (sel) => [...root.querySelectorAll(sel)];
    const stage = root.querySelector(':scope > .scene-stage') || root.firstElementChild;
    const track = $('.settle__track');
    const box = $('.settle');
    const line = $('.settle__line');
    const cluster = $('.settle__cluster');
    const support = cluster && cluster.querySelector('.settle__support');
    const S = { mode: null, items: [], extras: [], map: null, measure: null, focus: null, dbg: null };
    root.__settle = S;  // state, for inspection in devtools

    const moved = () => [track, ...$$('.settle__char, .settle__support, .settle__cta, .settle__body, .settle__picture, .settle__caption, .settle__outro > *')];
    // the layout measure() writes: the line's fitted size, the support's measure, the cluster's extra
    // margin or its place under the line
    const clearEnd = () => {
      if (cluster) { cluster.style.marginLeft = ''; cluster.style.left = ''; }
      if (support) support.style.maxWidth = '';
      if (box) box.style.removeProperty('--fs');
      root.removeAttribute('data-end');
      root.style.removeProperty('--settle-lift');
    };
    const reset = () => {
      for (const el of moved()) if (el) { el.style.transform = ''; el.style.opacity = ''; }
      root.classList.remove('is-moving');
      root.removeAttribute('data-first');
      clearEnd();
      S.items = []; S.extras = [];
    };
    const setFit = (v) => (v ? root.style.setProperty('--settle-fit', v + 'px') : root.style.removeProperty('--settle-fit'));

    // Largest font size (px) at which an element keeps to `lines` lines and its widest word fits its
    // width (no word cut at the edge, no sideways scroll), from `ceilPx` (else the CSS size) down.
    const fitLines = (el, lines, floorPx, ceilPx) => {
      if (!el) return;
      setFit(ceilPx || 0);
      let fs = parseFloat(getComputedStyle(el).fontSize);
      const lh = () => parseFloat(getComputedStyle(el).lineHeight) || fs * 0.88;
      const over = () => el.offsetHeight > lh() * (lines + 0.5) || el.scrollWidth > el.clientWidth + 1;
      for (let i = 0; i < 24 && over() && fs > floorPx; i++) {
        fs = Math.max(floorPx, fs * 0.93);
        setFit(Math.floor(fs));
      }
    };

    // The end frame of the line. The travel ends where a word starts at the left with nothing of the
    // word before it left on screen. The visible margin that leaves on the left (the first letter's ink,
    // 6vw at most) is mirrored on the right, where the cluster's visible right edge lands, so the frame
    // is balanced for any copy and any width. Choices, best first; two words or more whenever possible:
    //   1. the most words that leave room for the cluster beside them (2.5vw after the last letter's ink)
    //   2. the same beside a narrower support line, down to 20 characters a line
    //   3. the cluster under the line, when the screen is tall enough for the pair and the scatter
    //   4. the last word alone beside the cluster (narrowed if need be), else above it
    const endFrame = (W, H, rec) => {
      const cs = getComputedStyle(track);
      const padL = parseFloat(cs.paddingLeft) || 0.06 * W;
      const gap = parseFloat(cs.columnGap) || 0.04 * W;
      const fs = parseFloat(getComputedStyle(line).fontSize);
      const ink = 0.06 * fs;                                          // tight tracking: ink overhangs the box
      const spans = [];
      for (const c of rec.chars) {
        const l = c.offsetLeft, r = l + c.offsetWidth, last = spans[spans.length - 1];
        if (last && last.word === c.parentNode) last.r = r;
        else spans.push({ word: c.parentNode, l, r, bear: bearing(c.textContent) * fs });
      }
      const n = spans.length;
      if (!n) return { travel: 0, mode: 'side', extra: 0, words: 0 };
      const lineEnd = spans[n - 1].r + ink;
      const at = (i) => (i ? Math.min(spans[i].l, Math.max(spans[i - 1].r + ink, spans[i].l - padL)) : 0);
      const margin = (i) => Math.max(16, spans[i].l - at(i) + spans[i].bear);   // visible, both sides
      const kids = cluster ? [...cluster.children] : [];
      const width = () => (kids.length ? Math.max(...kids.map((el) => (el.matches('a, button') ? el.offsetWidth : textWidth(el)))) : 0);
      const natural = line.offsetLeft + line.offsetWidth + gap;       // where the cluster sits in the flow
      const side = (i) => {
        const t = at(i), cw = width(), right = W - margin(i);
        const g = cw ? Math.max(24, 0.025 * W) : 0;
        if (lineEnd - t + g + cw > right) return null;
        return { travel: t, mode: 'side', extra: cw ? Math.round(right - cw + t - natural) : 0, words: n - i };
      };
      const stack = (i) => {
        const t = at(i);
        if (lineEnd - t > W - margin(i)) return null;
        return { travel: t, mode: 'stack', left: Math.round(spans[i].l + spans[i].bear), words: n - i };
      };
      // the pair stacked still leaves the letters at least half their height of swoop
      const tall = () => {
        if (!cluster) return true;
        const h = rec.chars[0].offsetHeight;
        const lift = (clamp(0.05 * H, 28, 64) + cluster.offsetHeight) / 2;
        return 0.5 * H - lift - 0.5 * h - 64 - o.inset >= 0.5 * h;
      };
      const most = (lo, hi, fn) => { for (let i = lo; i <= hi; i++) { const f = fn(i); if (f) return f; } return null; };
      const narrow = (fn) => {
        if (!support) return null;
        for (let ch = 30; ch >= 20; ch -= 2) { support.style.maxWidth = ch + 'ch'; const f = fn(); if (f) return f; }
        support.style.maxWidth = '';
        return null;
      };
      const two = n - 2;
      return (two >= 0 && (most(0, two, side) || narrow(() => most(0, two, side)) || (tall() && most(0, two, stack))))
        || side(n - 1) || narrow(() => side(n - 1)) || stack(n - 1)
        || { travel: at(n - 1), mode: 'stack', left: Math.round(spans[n - 1].l + spans[n - 1].bear), words: 1 };
    };

    // Cards: move the travel's end to the nearest card boundary, by a little less travel when the last
    // card still fits on the right, else by a little more (at most 20% of the width).
    const snapCards = (base, W) => {
      if (base <= 0) return 0;
      const spans = $$('.settle__card, .settle__intro, .settle__outro').map((el) => ({ l: el.offsetLeft, r: el.offsetLeft + el.offsetWidth }));
      const margin = 0.06 * W;
      const room = (parseFloat(getComputedStyle(track).paddingRight) || 0) - 16;
      const i = spans.findIndex((s) => s.r > base);
      if (i < 0) return base;
      const s = spans[i], prev = spans[i - 1], next = spans[i + 1];
      if (s.l >= base) return base;
      const less = Math.max(prev ? prev.r : -Infinity, s.l - margin);
      if (less <= s.l && base - less <= room) return Math.max(0, less);
      const more = Math.max(s.r, next ? next.l - margin : Infinity);
      return next && more <= next.l && more - base <= 0.2 * W ? more : base;
    };

    // ── desktop: the sideways track ─────────────────────────────────────────────────────────────
    const buildDesk = (tl) => {
      reset();
      S.mode = 'desk';
      setFit(0);
      let W = 1, H = 1, travel = 0, run = 0, T = 1, hold = 1.5;
      const rec = preset === 'type' && line ? split(line) : null;
      const glyphs = rec ? rec.chars.map((c) => c.textContent) : null;
      const sd = rec ? seeds(rec.text, rec.chars.length, glyphs) : null;

      S.measure = () => {
        W = stage.clientWidth || innerWidth;
        H = stage.clientHeight || innerHeight;
        clearEnd();
        let lift = 0, mode = 'side', words = 0;
        if (rec) {
          kern(line, rec.chars);
          // a word wider than the room between the 6vw margins sets the whole line smaller, so the end
          // frame never cuts a word at the edge
          const fs0 = parseFloat(getComputedStyle(line).fontSize);
          const widest = Math.max(0, ...rec.words.map((w) => w.offsetWidth)) + 0.1 * fs0;
          if (box && widest > 0.88 * W) box.style.setProperty('--fs', Math.floor((fs0 * 0.88 * W) / widest) + 'px');
          const f = endFrame(W, H, rec);
          travel = f.travel;
          mode = f.mode;
          words = f.words;
          if (cluster && f.mode === 'stack') {
            root.dataset.end = 'stack';
            cluster.style.left = f.left + 'px';
            lift = Math.round((parseFloat(getComputedStyle(cluster).marginTop) + cluster.offsetHeight) / 2);
            root.style.setProperty('--settle-lift', lift + 'px');
          } else if (cluster && f.extra) cluster.style.marginLeft = f.extra + 'px';
        } else {
          travel = snapCards(Math.max(0, track.offsetWidth - W), W);
        }
        // a short line travels little; its letters get a run-in of their own so they still swoop in
        run = rec ? Math.max(0, 0.45 * W - travel) : 0;
        const ts = (travel + run) / (H * o.speed);
        hold = clamp(ts + o.rest, 1, 4);
        T = travel + run > 0 ? clamp(Math.min(ts, hold - o.rest) / hold, 0.05, 1) : 0;
        root.style.setProperty('--hold', hold.toFixed(4));
        const items = [], extras = [];
        let amax = 0;
        if (rec) {
          const h = rec.chars[0] ? rec.chars[0].offsetHeight : 100;
          amax = Math.max(0, Math.min(o.amp * h, 0.5 * H - lift - 0.5 * h - 64 - o.inset));
          rec.chars.forEach((el, k) => {
            const c = el.offsetLeft + el.offsetWidth / 2;
            items.push({ el, c, s: Math.max(o.settle, (c - travel) / W), A: sd[k].a * amax, R: sd[k].r * o.tilt, e: o.enter });
          });
          if (cluster) {
            // the cluster rises once its left edge is on screen, or (under the line) late, once the
            // letters above it have landed; it lands with the travel's end either way
            const left = cluster.offsetLeft, rf = (left - travel) / W;
            extras.push({ kind: 'cluster', left, rf, rs: Math.min(1, rf + 0.4), els: [cluster.querySelector('.settle__support'), cluster.querySelector('.settle__cta')].filter(Boolean) });
          }
        } else {
          const cards = $$('.settle__card');
          cards.forEach((card, k) => {
            const left = card.offsetLeft, w = card.offsetWidth;
            const c = preset === 'stair' ? left : left + w / 2;
            const lift = (o.lift / 100) * H;
            const body = card.querySelector('.settle__body') || card.firstElementChild;
            if (preset === 'rise') {
              const pic = card.querySelector('.settle__picture') || body;
              const cap = card.querySelector('.settle__caption');
              items.push({ el: pic, c, s: Math.max(o.settle, (c - travel) / W), A: lift, R: 0, e: o.enter });
              // captions fade in over r 0.85 → 0.55; one already on screen at progress 0 reads at once
              const r0 = c / W;
              if (cap) extras.push({ kind: 'caption', c, el: cap, end: Math.max(0.55, (c - travel) / W, r0 < 0.85 ? r0 : 0) });
            } else {
              const tr = o.tilt ? (k % 2 ? -1 : 1) * o.tilt * 0.5 : 0;
              items.push({ el: body, c, s: Math.max(o.settle, (c - travel) / W), A: lift, R: tr, e: o.enter });
            }
          });
          const out = $('.settle__outro');
          if (out) {
            const left = out.offsetLeft, rf = (left - travel) / W;
            extras.push({ kind: 'cluster', left, rf, rs: 1, els: [...out.children] });
          }
        }
        // write caches start empty, so the first map() after a measure writes every element
        S.items = items.map((it) => ({ ...it, x: NaN, y: NaN, r: NaN }));
        S.extras = extras.map((x) => ({ ...x, st: (x.els || [x.el]).map((el) => ({ el, x: NaN, y: NaN, r: NaN, o: NaN })) }));
        S.track = { el: track, x: NaN, y: NaN, r: NaN };
        S.trackW = track.offsetWidth;
        S.dbg = { W, H, travel, run, hold: r2(hold), T: r2(T), mode, words, fs: rec ? parseFloat(getComputedStyle(line).fontSize) : 0, amax: Math.round(amax), lift };
      };

      S.map = (p) => {
        const q = T > 0 ? clamp(p / T, 0, 1) : 1;
        const x = -travel * q;
        const lead = run * (1 - q);                                   // the short line's own run-in
        put(S.track, r1(x), 0, 0);
        for (const it of S.items) {
          const r = (it.c + x + lead) / W;
          const u = it.s >= it.e ? 1 : clamp((it.e - r) / (it.e - it.s), 0, 1);
          if (u === 1 && it.y === 0 && it.r === 0) continue;          // settled, nothing to write
          put(it, 0, r1(it.A * curveAt(curve.y, u)), r2(it.R * curveAt(curve.r, u)));
        }
        for (const ex of S.extras) {
          if (ex.kind === 'cluster') {
            // rises from 40vh with power3.out, keyed to its left edge from rs to its rest
            const rc = (ex.left + x) / W;
            const u = ex.rf >= ex.rs ? 1 : clamp((ex.rs - rc) / (ex.rs - ex.rf), 0, 1);
            ex.st.forEach((st, i) => {
              const v = i ? clamp((u - 0.12 * i) / (1 - 0.12 * i), 0, 1) : u;   // each later child lands just after
              put(st, 0, r1(0.4 * H * Math.pow(1 - v, 4)), 0, r2(clamp(v / 0.3, 0, 1)));
            });
          } else {
            // rise captions: fade and lift in as the column centre moves from 0.85 to 0.55 of the width
            const r = (ex.c + x) / W, end = ex.end;
            const v = end >= 0.85 ? 1 : clamp((0.85 - r) / (0.85 - end), 0, 1);
            put(ex.st[0], 0, r1(24 * (1 - v)), 0, r2(v));
          }
        }
      };

      // tab focus inside the track: bring the scroll to where that item has arrived and settled
      S.focus = (target) => {
        const st = tl.scrollTrigger;
        const box = target.closest('.settle__card, .settle__cluster, .settle__outro');
        if (!st || !(travel + run) || !box) return;
        const left = box.offsetLeft, w = box.offsetWidth;
        const card = box.matches('.settle__card');
        const anchor = preset === 'stair' ? left : left + w / 2;
        const sp = card ? Math.max(o.settle, (anchor - travel) / W) : 0;
        const p = card && travel ? clamp((anchor - sp * W) / travel, 0, 1) * T : T;   // where it has arrived and settled
        const cur = clamp(st.progress, 0, 1);
        const xNow = -travel * clamp(cur / T, 0, 1);
        const visible = left + xNow >= 0 && left + w + xNow <= W;
        const settled = card ? (anchor + xNow) / W <= sp + 0.002 : cur >= T - 0.002;
        if (visible && settled) return;
        const y = st.start + (st.end - st.start) * p;
        if (window.Stage && Stage.lenis) Stage.lenis.scrollTo(y, { immediate: true, force: true });
        else window.scrollTo(0, y);
      };

      S.measure();
      tl.to({}, { duration: 1, ease: 'none' }, 0);
      tl.eventCallback('onUpdate', () => { if (S.mode === 'desk' && S.map) S.map(tl.progress()); });
      S.map(0);
      ScrollTrigger.create({
        trigger: root, start: 'top bottom', end: 'bottom top',
        onToggle: (self) => root.classList.toggle('is-moving', self.isActive),
      });
      requestAnimationFrame(() => ScrollTrigger.refresh());
    };

    // ── phone: the same mapping turned 90°, keyed to the line's own screen position ──────────────
    const buildPhone = () => {
      reset();
      S.mode = 'phone';
      const rec = preset === 'type' && line ? split(line) : null;
      const glyphs = rec ? rec.chars.map((c) => c.textContent) : null;
      const sd = rec ? seeds(rec.text, rec.chars.length, glyphs) : null;
      let H = innerHeight, maxScroll = 0, first = false, top0 = 0, D = 1, clear = 0;
      const docTop = (el) => { let y = 0; for (let n = el; n; n = n.offsetParent) y += n.offsetTop; return y; };

      S.measure = () => {
        H = innerHeight;
        if (rec) {
          // a first section keeps a whole first screen, so the line has room to assemble on screen
          root.toggleAttribute('data-first', docTop(root) < 0.25 * H);
          kern(line, rec.chars);
          fitLines(line, 2, 34, Math.round(0.2 * innerWidth));   // two lines at most, as large as 20vw, widest word inside
        }
        maxScroll = Math.max(0, document.documentElement.scrollHeight - H);
        const items = [], extras = [];
        if (rec) {
          // group letters into visual lines by their layout top
          const rows = [];
          for (const el of rec.chars) {
            const top = el.offsetTop;
            let row = rows.find((r) => Math.abs(r.top - top) < 4);
            if (!row) rows.push((row = { top, els: [] }));
            row.els.push(el);
          }
          const h = rec.chars[0] ? rec.chars[0].offsetHeight : 60;
          const N = rec.chars.length;
          top0 = docTop(line);
          // On screen in the upper part at scroll 0 (the first section): the first word is already
          // level and the first scroll assembles the rest. Otherwise the line assembles as it rises.
          first = top0 < 0.62 * H;
          const w1 = first ? rec.chars.filter((c) => c.parentNode === rec.chars[0].parentNode).length : 0;
          D = first ? clamp(Math.max(0.22 * H, top0 - 0.12 * H), 1, Math.max(1, maxScroll)) : 1;
          const amp = o.amp / 1.5;
          let k = 0;
          rows.forEach((row, ri) => row.els.forEach((el) => {
            const s = sd[k];
            // The first row comes from above or below; the rows under it only from below, so a row
            // never crosses the one above. The first row dips no further than the row under it falls,
            // and a lower row's overshoot stops short of the row above.
            const down = ri > 0 || s.a > 0;
            const m = ri === 0 && down ? 0.6 : s.m;
            items.push({
              el,
              f: k < w1 ? 0 : (k - w1 + 1) / Math.max(1, N - w1),     // place in reading order, 0-1
              A: (down ? 1 : -1) * m * h * amp,
              R: (down ? 1 : -1) * m * 12 * (o.tilt / 18),   // 7-12deg, following the height as on desktop
              cap: ri ? -0.08 * h : -Infinity,
              last: ri === rows.length - 1,
            });
            k++;
          }));
          if (cluster) {
            const kids = [cluster.querySelector('.settle__support'), cluster.querySelector('.settle__cta')].filter(Boolean);
            // room between the line's box and the cluster, less a tilted letter's overhang
            clear = (kids[0] ? kids[0].offsetTop : 0) - (line.offsetTop + line.offsetHeight) - 0.12 * h;
            kids.forEach((el, i) => extras.push({ el, lag: 0.06 * i, lift: 32, fade: true }));
          }
        } else {
          for (const card of $$('.settle__card')) {
            const body = card.querySelector('.settle__body') || card.firstElementChild;
            const top = docTop(card);
            const pic = preset === 'rise' ? card.querySelector('.settle__picture') : null;
            const cap = preset === 'rise' ? card.querySelector('.settle__caption') : null;
            extras.push({ el: pic || body, top, lag: 0, lift: 0.16 * H, from: 1, to: 0.7, fade: false });
            if (cap) extras.push({ el: cap, top, lag: 0.1, lift: 24, from: 1, to: 0.7, fade: true });
          }
          const out = $('.settle__outro');
          if (out) [...out.children].forEach((el, i) => extras.push({ el, top: docTop(el), lag: 0.06 * i, lift: 32, from: 0.95, to: 0.75, fade: true }));
        }
        S.items = items.map((it) => ({ ...it, x: NaN, y: NaN, r: NaN }));
        S.extras = extras.map((it) => ({ fade: true, ...it, x: NaN, y: NaN, r: NaN, o: NaN }));
        S.dbg = { H, first, top0, D: Math.round(D), maxScroll };
      };

      // u for something whose top moves from `from` to `to` of the screen height; if the page ends
      // before it can get there, it settles at the last scroll position instead.
      const window01 = (docY, from, to, sy) => {
        const end = Math.min(Math.max(to * H, docY - maxScroll), from * H - 1);
        return clamp((from * H - (docY - sy)) / (from * H - end), 0, 1);
      };
      // g: the line's progress, 0 (entering at the bottom edge) to 1 (settled at 42% of the screen).
      // A first section starts at 0.5, where the first word has landed.
      const lineAt = (sy) => (first ? 0.5 + 0.5 * clamp(sy / D, 0, 1) : window01(top0, 1, 0.42, sy));
      S.map = () => {
        const sy = window.scrollY;
        if (rec) {
          const g = lineAt(sy);
          let low = 0;                                                  // the last row's deepest letter
          for (const it of S.items) {
            const v = clamp((g - 0.5 * it.f) / 0.5, 0, 1);            // letters land in reading order
            if (v === 1 && it.y === 0 && it.r === 0) continue;
            put(it, 0, r1(Math.max(it.cap, it.A * curveAt(curve.y, v))), r2(it.R * curveAt(curve.r, v)));
            if (it.last && it.y > low) low = it.y;
          }
          for (const ex of S.extras) {
            if (first) {
              // a first section shows its button from the start; the last row's falling letters push
              // the cluster down, and it tucks in under the line as they land
              put(ex, 0, r1(Math.max(0, low - clear)), 0, 1);
            } else {
              // the support line and button rise as the last letters land
              const v = clamp((g - 0.7 - ex.lag) / (0.3 - ex.lag), 0, 1);
              put(ex, 0, r1(ex.lift * Math.pow(1 - v, 3)), 0, r2(clamp(v / 0.6, 0, 1)));
            }
          }
          return;
        }
        for (const ex of S.extras) {
          const u = window01(ex.top, ex.from, ex.to, sy);
          const v = clamp((u - ex.lag) / (1 - ex.lag), 0, 1);
          put(ex, 0, r1(ex.lift * Math.pow(1 - v, 3)), 0, ex.fade ? r2(clamp(v / 0.6, 0, 1)) : undefined);
        }
      };
      S.focus = null;
      S.measure();
      S.map();
      ScrollTrigger.create({
        trigger: root, start: 'top bottom', end: 'bottom top',
        onUpdate: () => S.map(),
        onToggle: (self) => root.classList.toggle('is-moving', self.isActive),
      });
      requestAnimationFrame(() => ScrollTrigger.refresh());
    };

    // ── the finished composition: reduced motion, a phone set to rest, a failed script ───────────
    const toRest = () => {
      reset();
      S.mode = 'rest';
      S.map = null; S.focus = null;
      unsplit(line);
      S.measure = () => { if (line) fitLines(line, 2, 34, Stage.phone ? Math.round(0.2 * innerWidth) : 0); };
      S.measure();
    };
    // Leaving a live layout for the finished one, whoever asks. The stage's matchMedia only runs its
    // callback when one of its conditions matches, so on a desktop that switches to reduced motion
    // while the page is open it never calls rest(); and its context revert cannot undo the inline
    // styles this scene writes. Both cases end here.
    const leave = () => {
      if (S.mode === 'rest') return;
      root.classList.remove('is-live');
      root.classList.add('is-rest');
      root.style.removeProperty('--hold');
      root.style.removeProperty('--p');
      toRest();
    };

    // Once per section: re-measure before ScrollTrigger measures (resize, fonts, pictures), map after.
    if (!root.__settleWired && window.ScrollTrigger) {
      root.__settleWired = true;
      ScrollTrigger.addEventListener('refreshInit', () => { if (S.measure && (root.classList.contains('is-live') || S.mode === 'rest')) S.measure(); });
      ScrollTrigger.addEventListener('refresh', () => { if (S.map && root.classList.contains('is-live')) S.map(S.mode === 'desk' && S.tl ? S.tl.progress() : 0); });
      root.addEventListener('focusin', (e) => {
        if (!S.focus || !root.classList.contains('is-live')) return;
        const t = e.target;
        requestAnimationFrame(() => S.focus && S.focus(t));
      });
      // a late web font (or any change of content) changes the track's size: measure again. The
      // cluster margin measure() itself writes is not a change.
      if (window.ResizeObserver && track) {
        let seen = false, raf = 0;
        new ResizeObserver(() => {
          if (!seen) { seen = true; return; }
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(() => {
            if (!S.measure || S.mode === 'rest') return;
            if (S.mode === 'desk' && Math.abs(track.offsetWidth - (S.trackW || 0)) < 1) return;
            ScrollTrigger.refresh();
          });
        }).observe(track);
      }
      // reduced motion switched on or off while the page is open
      const rm = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null;
      const onReduce = () => S.onReduce && S.onReduce(rm.matches);
      if (rm) rm.addEventListener ? rm.addEventListener('change', onReduce) : rm.addListener && rm.addListener(onReduce);
      // a phone turned into a desktop under reduced motion: the stage's phone context reverts (taking
      // .is-rest with it) and no context replaces it, so mark the finished composition again
      const ph = window.matchMedia ? matchMedia('(max-width: 767px)') : null;
      const onPhone = () => requestAnimationFrame(() => { if (S.mode === 'rest' && !root.classList.contains('is-live')) root.classList.add('is-rest'); });
      if (ph) ph.addEventListener ? ph.addEventListener('change', onPhone) : ph.addListener && ph.addListener(onPhone);
      wireFonts();
      // pictures that move must be decoded first
      for (const img of $$('img')) if (img.decode) img.decode().catch(() => {});
    } else if (!root.__settleWired) {
      // no ScrollTrigger (a failed CDN): the finished composition still refits its line when the web
      // font arrives and when the window changes size
      root.__settleWired = true;
      const again = () => { if (S.mode === 'rest' && S.measure) S.measure(); };
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(again);
      let t = 0;
      addEventListener('resize', () => { clearTimeout(t); t = setTimeout(again, 150); });
    }

    // when the stage's context is reverted (a media change, or a page tearing the scene down), take
    // this scene's own writes with it
    const onRevert = () => {
      if (window.gsap && gsap.context) gsap.context(() => () => { if (S.mode !== 'rest') { reset(); unsplit(line); S.map = null; S.focus = null; S.measure = null; S.mode = null; } });
    };

    const plan = {
      hold: 2,
      scrub,
      build(tl) { S.tl = tl; buildDesk(tl); onRevert(); },
      phone: { hold: 0, build: () => { buildPhone(); onRevert(); } },
      rest: () => toRest(),
    };
    let mm = Stage.scene(root, plan);
    // Reduced motion on: the finished composition, on every screen. Off again: gsap.matchMedia drops a
    // context for good once none of its conditions match, so on a desktop the stage never comes back
    // by itself; start the scene again (the phone's context is still listening and comes back alone).
    S.onReduce = (reduced) => {
      if (reduced) { leave(); return; }
      requestAnimationFrame(() => {
        if (root.classList.contains('is-live') || S.mode !== 'rest' || Stage.reduced) return;
        if (mm && mm.revert) mm.revert();
        const i = Stage.scenes.indexOf(mm);                           // the stage keeps every scene it made
        if (i >= 0) Stage.scenes.splice(i, 1);
        mm = Stage.scene(root, plan);
        root.__scene = mm || true;
      });
    };
    return mm;
  };
})();
