// tasteskill / scenes / scrubbed-transformation-sequence.js — Scrubbed transformation sequence.
//
// A held stage shows one hero object going through one change of state (raw to finished, closed to
// open, lifted and handed over) as a frame sequence drawn on a canvas and scrubbed by the scroll. Around
// it the page moves in step: the ground opens from the page colour to the after colour as a hard-edged
// disc from the object's centre (first a halo around the object, then, once the title has lifted away,
// the whole stage), the "before" context (a cut-out the object came from) slides out to the right while
// a pre-blurred copy of it fades in (a rack focus without an animated filter), the before statement lifts
// away word by word, a receiver cut-out (the plinth, shelf, pad or trailer the object ends on) rises from
// below, the object settles onto it, then callouts, the after line and one action land. Use it only when
// you have 80-250 rendered or filmed frames with alpha of the object changing; never fake it by rotating
// one still. Frame the footage tight: the object should fill most of the frame (the box is large).
//
// Needs gsap + ScrollTrigger (+ SplitText for the word moves; without it the words are split by stage.js), stage.js,
// then this file. Read the CSS file's header for colours and placement.
//
// Markup (the phone's callout stack and, if missing, the blurred copy of the before context are made by
// this file; do not write them):
//
//   <section class="scene" data-scene="scrubbed-transformation-sequence" aria-labelledby="xf-title"
//            data-options='{"frames":"media/xf/d/####.webp","count":120,
//                           "phoneFrames":"media/xf/m/####.webp","phoneCount":60}'>
//     <div class="scene-stage">
//       <div class="xf-ground" aria-hidden="true">
//         <div class="xf-ground__after"></div><div class="xf-ground__before"></div>
//       </div>
//       <div class="xf-prop xf-prop--back" aria-hidden="true">              optional: what it came from
//         <img src="…/before-context.webp" alt="" width="678" height="522">
//         <img class="xf-prop__soft" src="…/before-context-soft.webp" alt="">   optional: the same picture
//       </div>                                                    blurred ~4px (else it is made here)
//       <div class="xf-receiver" aria-hidden="true">                       optional: what it ends on
//         <img src="…/receiver.webp" alt="">
//         <img class="xf-receiver__contact" src="…/receiver-contact.webp" alt="">   optional: the same
//       </div>                                       picture with the object's contact shade, faded in as it lands
//       <figure class="xf-object">
//         <img class="xf-still" src="…/d/0119.webp" srcset="…/m/0059.webp 720w, …/d/0119.webp 1200w"
//              sizes="(max-width: 767px) 100vw, 62vw" alt="[the object, finished]" width="1200" height="1200">
//         <div class="xf-before">                                         the finished composition only
//           <img src="…/m/0000.webp" alt="[the object before]"><p>Where it started</p>
//         </div>
//         <canvas class="xf-canvas" aria-hidden="true"></canvas>
//         <ul class="xf-callouts">                                         0-6 callouts, 3 is right
//           <li class="xf-callout" style="--x:64.5%;--y:22%" data-side="right">
//             <span class="xf-mark" aria-hidden="true"></span>
//             <span class="xf-label">Thrown in one sitting</span>          2-6 words, at most 2 lines
//           </li> …
//         </ul>
//       </figure>
//       <div class="xf-copy">
//         <h2 class="xf-statement" id="xf-title">It starts as a lump of clay</h2>   the before; ≤ 2 lines
//         <p class="xf-closing">Fired once, kept for life.</p>                      the after; 3-6 words
//         <a class="xf-cta" href="#next">See the vases</a>                          2-3 words
//       </div>
//     </div>
//   </section>
//
// --x / --y place each callout's marker as a fraction of the object box: put markers on the silhouette
// edge of the LAST frame (look at it; never guess), labels on the side away from the object, none of
// them over the receiver (above ~0.8 of the box in the demo), and the first one ~160px below the stage
// top (the nav). The still keeps the markup's picture (the last
// frame) until the canvas has drawn a frame; a phone gets its 720px frame through srcset. Do not put
// loading="lazy" on the scene's pictures: some are hidden in one mode, never load, and Stage.ready()
// (which waits for every picture in a scene) would never resolve.
//
// Footage: frames are squares with alpha, the object filling most of the frame (about 65% of its width
// at the start, 85% of its height at the end) with its foot at the same place at the end, so the
// receiver lines up. Desktop 1200px, about 120 frames (80-250); phone a second set at 720px, every
// second frame. "####" in the pattern is the zero-padded frame index (any run of #). The before context
// and the receiver are rendered by the cameras of the first and last frames and placed in box units
// (--xf-px/py/pw, --xf-rx/ry/rw in the CSS).
//
// Options (data-options JSON, or the second argument), with defaults and ranges:
//   frames       desktop frame URL pattern                  required (else canvas[data-frames]); none, a
//                                                          data-saving visitor, or a first and last frame
//                                                          that will not load = the finished composition
//   count        desktop frames                             120   (2-400; 80-250 for a good scrub)
//   phoneFrames  phone frame URL pattern                    = frames
//   phoneCount   phone frames                               60 with its own pattern, else = count
//   hold         screens held on desktop                    4     (3-5)
//   phoneHold    screens held on a phone                    3     (2-4)
//   scrub        seconds of catch-up                        0.3 with Stage.smooth(), else 0.6
//   split        share of the frames played linearly        0.85  (0.5-0.95); the rest ease out over 0.62-0.86
//   ground       "iris" | "none"                            "iris"; "none" keeps the page colour (light pages)
//   irisAt       [x, y] where the disc grows from, in box   [0.5, 0.54]: the object's centre in its first
//                fractions                                  frames
//
// Timeline (fractions of the hold; all scrubbed, so scrolling back un-builds it exactly):
//   0.00-0.06  object scale 0.94 → 1, yPercent 4 → 0 as the pin catches (phone: see below)
//   0.04-0.62  frames 0 → split × last, linear;  0.62-0.86  → last frame, power1.out
//   0.08-0.25  ground: an after-colour disc grows to a halo around the object, its edge kept clear of
//              the statement;  0.25-0.44 it holds (growing a little);  0.44-0.56 it fills the stage
//              (power2.in), reaching the statement's words only as they finish lifting away (~0.48)
//   0.30-0.62  before context leaves past the right edge (scale 0.86, opacity 0.5); its blurred copy
//              fades in over 0.30-0.50 and the sharp one out over 0.46-0.56 (not on phones)
//   0.40-0.48  statement words lift away (yPercent -70, 4deg, fading out; no masks, so no word is ever cut)
//   0.52-0.70  receiver rises from below the stage;  0.62-0.78  object settles onto it (its contact
//              shade fades in over 0.68-0.78)
//   0.66-0.84  callouts: marker pops and focuses, its label rises word by word (0.05 apart)
//   0.84-0.92  after line rises into the statement's slot;  0.88-0.93  the action fades up
//   0.92-1.00  hold, then the page scrolls on
// Phone (< 768px): the same fractions on the phone frames; the box is wider than the screen and centred
// higher, the object starts at scale 1.12 and eases to 1 over 0.04-0.40, the after line takes a top
// slot, callout labels become a stack (at most four rows) in the bottom slot, the markers on the object
// and the before context are hidden, no blur.
// Reduced motion, no script, a failed CDN, data-saving visitors and frames that will not load get the
// finished composition (CSS); the first four download no frames.
(() => {
  if (!window.Stage) return;
  const ID = 'scrubbed-transformation-sequence';
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const num = (v, d, a, b) => { const n = v === '' || v == null ? NaN : Number(v); return Number.isFinite(n) ? clamp(n, a, b) : d; };
  const frameUrl = (pattern, i) => pattern.replace(/#+/, (m) => String(i).padStart(m.length, '0'));
  const saveData = () => {
    const c = navigator.connection;
    return !!(c && (c.saveData || /(^|-)(2g|3g)$/.test(c.effectiveType || '')));
  };

  // A frame set. Frames are fetched first, last, then binary midpoints, six at a time, so a fast scroll
  // always has a near frame to show. Each arrives as a small compressed blob. Only the frames around
  // the playhead are decoded, off the main thread, into ImageBitmaps at the canvas's size, nearest
  // first and two at a time; while the playhead races, decoding thins out (every second frame, every
  // third when it really flies, one job at a time) and the gaps fill in once it slows. Frames more than
  // KEEP away are closed, so memory stays bounded and drawing a frame is a plain copy. Where fetch or
  // createImageBitmap is unavailable (a cross-origin host without CORS, an old browser) frames fall
  // back to decoded <img> elements. If the first and the last frame both fail, onFail() is called.
  const WINDOW = 16, KEEP = 24, JOBS = 2;
  const bitmaps = typeof createImageBitmap === 'function';
  function FrameSet(pattern, count, onFail) {
    const blobs = new Array(count).fill(null);
    const bmps = new Array(count).fill(null);
    const bmpGen = new Array(count).fill(-1);
    const imgs = new Array(count).fill(null);
    const failed = new Array(count).fill(false);
    const making = new Set();
    const listeners = new Set();
    let queue = null, active = 0, centre = 0, dir = 1, size = null, gen = 0, natural = null;
    let wanted = [], jobs = 0, limit = JOBS, idle = 0;
    const moves = [];
    const emit = (i) => listeners.forEach((fn) => fn(i));
    const ready = (i) => !!(bmps[i] && bmpGen[i] === gen);
    // frames the playhead travelled over the last 160ms
    const speed = () => { const t = performance.now(); while (moves.length && t - moves[0][0] > 160) moves.shift(); return moves.length > 1 ? Math.abs(moves[moves.length - 1][1] - moves[0][1]) : 0; };
    function makeBitmap(i) {
      making.add(i);
      jobs++;
      const g = gen;
      const want = natural && size ? [Math.min(size[0], natural[0]), Math.min(size[1], natural[1])] : null;
      const job = want
        ? createImageBitmap(blobs[i], { resizeWidth: want[0], resizeHeight: want[1], resizeQuality: 'medium', premultiplyAlpha: 'premultiply' }).catch(() => createImageBitmap(blobs[i]))
        : createImageBitmap(blobs[i], { premultiplyAlpha: 'premultiply' }).catch(() => createImageBitmap(blobs[i]));
      const done = () => { jobs--; if (g === gen) making.delete(i); pumpDecode(); };
      job.then((b) => {
        if (!natural) natural = [b.width, b.height];
        if (g !== gen || Math.abs(i - centre) > KEEP) b.close();
        else {
          if (bmps[i]) bmps[i].close();   // a bitmap of the old size stays drawable until this one is in
          bmps[i] = b;
          bmpGen[i] = g;
          emit(i);
        }
        done();
      }, done);
    }
    function pumpDecode() {
      while (jobs < limit && wanted.length) {
        const i = wanted.shift();
        if (blobs[i] && !ready(i) && !making.has(i) && Math.abs(i - centre) <= WINDOW) makeBitmap(i);
      }
    }
    // what to decode next: the frames around the playhead, nearest first, ahead before behind
    function schedule() {
      for (let i = 0; i < count; i++) if (bmps[i] && Math.abs(i - centre) > KEEP) { bmps[i].close(); bmps[i] = null; }
      const sp = speed();
      const stride = sp > 14 ? 3 : sp > 4 ? 2 : 1;
      limit = stride > 1 ? 1 : JOBS;
      wanted = [];
      for (let d = 0; d <= WINDOW; d++) {
        for (const i of d ? [centre + d * dir, centre - d * dir] : [centre]) {
          if (i < 0 || i >= count || (stride > 1 && d > 1 && i % stride)) continue;
          if (blobs[i] && !ready(i) && !making.has(i)) wanted.push(i);
        }
      }
      pumpDecode();
      clearTimeout(idle);
      if (stride > 1) idle = setTimeout(schedule, 180);
    }
    function lost(i) {
      failed[i] = true;
      if (failed[0] && failed[count - 1]) { if (queue) queue.length = 0; if (onFail) onFail(); }
    }
    function viaImage(i) {
      const img = new Image();
      img.decoding = 'async';
      img.src = frameUrl(pattern, i);
      return img.decode().then(() => { imgs[i] = img; emit(i); }, () => lost(i));
    }
    function fetchOne(i) {
      if (!bitmaps || !window.fetch) return viaImage(i);
      return fetch(frameUrl(pattern, i))
        .then((r) => { if (!r.ok) throw new Error(r.status); return r.blob(); })
        .then((b) => { blobs[i] = b; if (Math.abs(i - centre) <= WINDOW) schedule(); }, () => viaImage(i));
    }
    const order = () => {
      const out = [0, count - 1], seen = new Set(out), spans = [[0, count - 1]];
      while (spans.length) {
        const [a, b] = spans.shift();
        if (b - a < 2) continue;
        const m = (a + b) >> 1;
        if (!seen.has(m)) { seen.add(m); out.push(m); }
        spans.push([a, m], [m, b]);
      }
      for (let i = 0; i < count; i++) if (!seen.has(i)) out.push(i);
      return out;
    };
    const pump = () => {
      while (active < 6 && queue.length) {
        const i = queue.shift();
        active++;
        fetchOne(i).then(() => { active--; pump(); });
      }
    };
    const has = (i) => !!(bmps[i] || imgs[i]);
    return {
      count,
      start() { if (queue) return; queue = order(); pump(); },
      on(fn) { listeners.add(fn); return () => listeners.delete(fn); },
      source: (i) => bmps[i] || imgs[i],
      // move the decode window with the playhead
      focus(k) {
        if (k === centre) return;
        dir = k > centre ? 1 : -1;
        centre = k;
        moves.push([performance.now(), k]);
        schedule();
      },
      // stop fetching (the scene gave up on its frames)
      stop() { if (queue) queue.length = 0; },
      // close every decoded bitmap (the set is not on screen); the compressed blobs stay
      release() {
        gen++;
        centre = -1e6;
        wanted = [];
        making.clear();
        clearTimeout(idle);
        for (let i = 0; i < count; i++) if (bmps[i]) { bmps[i].close(); bmps[i] = null; }
      },
      // decode at the canvas's backing size (never above the frames' own size)
      resize(w, h) {
        if (size && size[0] === w && size[1] === h) return;
        size = [w, h];
        if (!natural) return;
        gen++;
        making.clear();
        schedule();
      },
      // the decoded frame nearest to k, searching outward; -1 while nothing is ready
      nearest(k) {
        k = clamp(k, 0, count - 1);
        if (has(k)) return k;
        for (let d = 1; d < count; d++) {
          if (k - d >= 0 && has(k - d)) return k - d;
          if (k + d < count && has(k + d)) return k + d;
        }
        return -1;
      },
    };
  }

  // words as inline blocks (SplitText, the full text kept for screen readers). Unmasked on purpose: a
  // word is never half cut off by a mask mid-move; it travels a short way and fades instead.
  function words(el) {
    if (!el) return [];
    if (window.SplitText) {
      const s = SplitText.create(el, { type: 'words', aria: 'auto' });
      return s.words;
    }
    return Stage.split(el, 'words');
  }

  window.Scenes = window.Scenes || {};
  window.Scenes[ID] = (root, opts = {}) => {
    const stage = root.querySelector(':scope > .scene-stage') || root.firstElementChild;
    const obj = root.querySelector('.xf-object');
    if (!stage || !obj) return null;
    const canvas = obj.querySelector('.xf-canvas');
    const iris = root.querySelector('.xf-ground__after');
    const groundBefore = root.querySelector('.xf-ground__before');
    const receiver = root.querySelector('.xf-receiver');
    const statement = root.querySelector('.xf-statement');
    const closing = root.querySelector('.xf-closing');
    const cta = root.querySelector('.xf-cta');
    const copy = root.querySelector('.xf-copy');
    const callouts = [...root.querySelectorAll('.xf-callout')];

    // ---- options ----
    const pattern = opts.frames || (canvas && canvas.dataset.frames) || '';
    const count = Math.round(num(opts.count ?? (canvas && canvas.dataset.count), 120, 2, 400));
    const pPattern = opts.phoneFrames || (canvas && canvas.dataset.phoneFrames) || pattern;
    const pCount = Math.round(num(opts.phoneCount ?? (canvas && canvas.dataset.phoneCount), pPattern === pattern ? count : 60, 2, 400));
    const hold = num(opts.hold, 4, 3, 5);
    const phoneHold = num(opts.phoneHold, 3, 2, 4);
    const scrub = opts.scrub ?? (Stage.lenis ? 0.3 : 0.6);
    const split = num(opts.split, 0.85, 0.5, 0.95);
    const irisOn = opts.ground !== 'none' && !!iris;
    const irisAt = Array.isArray(opts.irisAt) ? [num(opts.irisAt[0], 0.5, 0, 1), num(opts.irisAt[1], 0.54, 0, 1)] : [0.5, 0.54];
    const contact = receiver && receiver.querySelector('.xf-receiver__contact');
    if (!irisOn) root.setAttribute('data-xf-ground', 'none');
    if (!pattern && canvas) console.warn(`[${ID}] no frames given: showing the finished composition`);
    const off = !pattern || !canvas || saveData();

    // ---- the before context: a wrapper holding the picture and its blurred copy ----
    let prop = root.querySelector('.xf-prop--back');
    if (prop && prop.tagName === 'IMG') {   // a bare <img class="xf-prop xf-prop--back"> is wrapped
      const wrap = document.createElement('div');
      wrap.className = prop.className;
      wrap.setAttribute('aria-hidden', 'true');
      prop.removeAttribute('class');
      prop.replaceWith(wrap);
      wrap.appendChild(prop);
      prop = wrap;
    }
    const sharp = prop && prop.querySelector('img:not(.xf-prop__soft)');
    let soft = prop && prop.querySelector('.xf-prop__soft');
    // no blurred copy in the markup: paint one once (a blurred canvas, never an animated filter)
    function makeSoft() {
      if (soft || !sharp || !window.CanvasRenderingContext2D || !('filter' in CanvasRenderingContext2D.prototype)) return;
      const c = document.createElement('canvas');
      c.className = 'xf-prop__soft';
      prop.appendChild(c);
      soft = c;
      const paint = () => {
        const w = sharp.naturalWidth, h = sharp.naturalHeight;
        if (!w || !h) return;
        c.width = w;
        c.height = h;
        const g = c.getContext('2d');
        g.filter = `blur(${((4 * w) / Math.max(1, prop.offsetWidth)).toFixed(1)}px)`;
        g.drawImage(sharp, 0, 0);
      };
      (sharp.decode ? sharp.decode() : Promise.resolve()).then(paint, () => {});
    }

    // ---- the phone's callout stack (labels leave the object and line up in the bottom slot) ----
    let stack = copy && copy.querySelector('.xf-stack');
    if (copy && !stack && callouts.length) {
      stack = document.createElement('ol');
      stack.className = 'xf-stack';
      stack.setAttribute('aria-hidden', 'true');
      callouts.forEach((c) => {
        const li = document.createElement('li');
        const mark = document.createElement('span');
        mark.className = 'xf-stack__mark';
        const text = document.createElement('span');
        text.textContent = (c.querySelector('.xf-label') || c).textContent.trim().replace(/\s+/g, ' ');
        li.append(mark, text);
        stack.appendChild(li);
      });
      copy.appendChild(stack);
    }
    const rows = stack ? [...stack.children] : [];

    // ---- drawing ----
    const sets = {};
    const D = { set: null, want: 0, drawn: -1, ctx: null, off: null };
    const G = { box: 0, cx: 0, cy: 0, R: 0, H: 0, recTop: 0, dText: Infinity };
    function measure() {
      const W = stage.clientWidth, H = stage.clientHeight;
      G.box = obj.offsetWidth;
      G.cx = obj.offsetLeft + obj.offsetWidth * irisAt[0];
      G.cy = obj.offsetTop + obj.offsetHeight * irisAt[1];
      G.R = Math.ceil(Math.hypot(Math.max(G.cx, W - G.cx), Math.max(G.cy, H - G.cy))) + 4;
      G.H = H;
      G.recTop = receiver ? receiver.offsetTop : H;
      // how far the disc may grow before its edge touches the statement
      G.dText = Infinity;
      if (statement && statement.offsetParent) {
        const s = statement.getBoundingClientRect(), st = stage.getBoundingClientRect();
        const x = clamp(G.cx, s.left - st.left, s.right - st.left), y = clamp(G.cy, s.top - st.top, s.bottom - st.top);
        G.dText = Math.hypot(G.cx - x, G.cy - y);
      }
    }
    function sizeCanvas() {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(obj.offsetWidth * dpr)), h = Math.max(1, Math.round(obj.offsetHeight * dpr));
      if (D.set) D.set.resize(w, h);
      if (canvas.width === w && canvas.height === h) return;
      canvas.width = w;
      canvas.height = h;
      D.ctx = null;
      D.drawn = -1;
    }
    function draw(force) {
      const set = D.set;
      if (!set || !canvas) return;
      const k = set.nearest(D.want);
      if (k < 0 || (k === D.drawn && !force)) return;   // never clear without a bitmap to draw
      if (!D.ctx) { D.ctx = canvas.getContext('2d'); D.ctx.imageSmoothingEnabled = true; D.ctx.imageSmoothingQuality = 'high'; }
      D.ctx.clearRect(0, 0, canvas.width, canvas.height);
      D.ctx.drawImage(set.source(k), 0, 0, canvas.width, canvas.height);
      D.drawn = k;
      canvas.dataset.frame = String(k);
      if (!root.classList.contains('xf-drawn')) root.classList.add('xf-drawn');   // the still steps aside
    }
    const want = (f) => {
      const k = Math.round(f);
      if (k === D.want && k === D.drawn) return;
      D.want = k;
      if (D.set) D.set.focus(k);
      draw(false);
    };
    if (window.ScrollTrigger) {
      ScrollTrigger.addEventListener('refresh', () => { if (D.set) { sizeCanvas(); draw(true); } });
    }

    // the after-colour disc: a stage-sized flat layer cut by a circular clip-path centred on the object.
    // (A scaled disc would be a ~2000px layer re-rastered at every scale; the clip repaints one flat
    // colour inside the stage.) Radii are measured on every refresh.
    const disc = (r) => `circle(${Math.max(0, Math.round(r))}px at ${Math.round(G.cx)}px ${Math.round(G.cy)}px)`;
    // the halo: around the object, its edge at least `gap` px short of the statement
    const halo = (grow, gap) => () => { measure(); return disc(Math.min(G.box * 0.56 * grow, G.dText - gap)); };

    // ---- frames that will not load: give up and show the finished composition ----
    let mm = null, gaveUp = false;
    const giveUp = () => {
      if (gaveUp) return;
      gaveUp = true;
      console.warn(`[${ID}] the first and last frames did not load: showing the finished composition`);
      Object.values(sets).forEach((s) => s.stop());
      if (mm) mm.revert();
      root.classList.remove('is-live');
      root.classList.add('is-rest');
      root.style.removeProperty('--hold');
      rest();
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    };

    // ---- the timeline ----
    const build = (tl, ctx) => {
      const phone = ctx.phone;
      const set = phone ? (sets.m || (sets.m = FrameSet(pPattern, pCount, giveUp))) : (sets.d || (sets.d = FrameSet(pattern, count, giveUp)));
      Object.values(sets).forEach((s) => { if (s !== set) s.release(); });
      D.set = set;
      D.want = 0;
      D.drawn = -1;
      root.classList.remove('xf-drawn');   // the markup's still shows until a frame is drawn
      if (D.off) D.off();
      D.off = set.on((i) => {
        if (D.drawn === D.want) return;
        if (D.drawn < 0 || Math.abs(i - D.want) < Math.abs(D.drawn - D.want)) draw(false);
      });
      measure();
      sizeCanvas();
      // fetch the frames once the scene is within three screens
      if (root.getBoundingClientRect().top < window.innerHeight * 3) set.start();
      else ScrollTrigger.create({ trigger: root, start: 'top 300%', once: true, onEnter: () => set.start() });
      [sharp, soft && soft.tagName === 'IMG' ? soft : null, receiver && receiver.querySelector('img')].forEach((img) => { if (img && img.decode) img.decode().catch(() => {}); });
      if (!phone) makeSoft();

      // a staggered fromTo renders only its first target up front: set every target's start state first.
      // Words and markers move in 2D (force3D off): scrubbing back and forth across their windows would
      // otherwise promote and drop a compositor layer per word, which costs more than repainting them.
      const tween = (targets, from, to, at) => { gsap.set(targets, from); return tl.fromTo(targets, from, { ...to, force3D: false }, at); };

      const N = set.count, mid = Math.round(split * (N - 1));
      const seq = { f: 0 };
      const step = () => want(seq.f);

      // 1. the object settles as the pin catches (a phone starts closer in and eases back while the
      //    object grows tall, so the wide first frames fill the narrow screen)
      if (phone) {
        tl.fromTo(obj, { yPercent: 4 }, { yPercent: 0, duration: 0.06, ease: 'power2.out' }, 0);
        tl.fromTo(obj, { scale: 1.12 }, { scale: 1, duration: 0.36, ease: 'power1.inOut' }, 0.04);
      } else {
        tl.fromTo(obj, { scale: 0.94, yPercent: 4 }, { scale: 1, yPercent: 0, duration: 0.06, ease: 'power2.out' }, 0);
      }
      // 2-3. the frames: linear, then the last stretch eases in
      tl.fromTo(seq, { f: 0 }, { f: mid, duration: 0.58, ease: 'none', onUpdate: step }, 0.04);
      tl.to(seq, { f: N - 1, duration: 0.24, ease: 'power1.out', onUpdate: step }, 0.62);
      // 4. the ground: a halo around the object while the title is read, then the whole stage once it
      //    has lifted away (power2.in: the edge reaches the title's words only as they finish leaving)
      if (irisOn) {
        tl.fromTo(iris, { clipPath: () => { measure(); return disc(0); } }, { clipPath: halo(1, 28), duration: 0.17, ease: 'power2.out' }, 0.08);
        tl.to(iris, { clipPath: halo(1.05, 20), duration: 0.19, ease: 'none' }, 0.25);
        tl.to(iris, { clipPath: () => { measure(); return disc(G.R); }, duration: 0.12, ease: 'power2.in' }, 0.44);
        // once the disc covers the stage, it and the before colour step aside for the ground's own flat
        // after colour (no visible change, and nothing left to repaint)
        tl.fromTo([iris, groundBefore], { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.001, immediateRender: false }, 0.562);
      }
      // 5. the before context leaves; on a laptop its blurred copy fades in over it (a rack focus)
      if (prop) {
        tl.fromTo(prop, { x: 0, yPercent: 0, scale: 1, opacity: 1 }, { x: () => stage.clientWidth - prop.offsetLeft + 24, yPercent: 6, scale: 0.86, opacity: 0.5, duration: 0.32, ease: 'power1.inOut' }, 0.3);
        if (!phone && soft && sharp) {
          tl.fromTo(soft, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'none' }, 0.3);
          tl.fromTo(sharp, { opacity: 1 }, { opacity: 0, duration: 0.1, ease: 'none' }, 0.46);
        }
      }
      // 6. the before statement lifts out
      const sw = words(statement);
      if (sw.length) tween(sw, { yPercent: 0, rotation: 0, autoAlpha: 1 }, { yPercent: -70, rotation: 4, autoAlpha: 0, duration: 0.04, ease: 'power2.in', stagger: { amount: 0.04 } }, 0.4);
      // 7. the receiver rises from below the stage; 8. the object settles onto it
      if (receiver) tl.fromTo(receiver, { y: () => { measure(); return Math.max(0, G.H - G.recTop) + 8; } }, { y: 0, duration: 0.18, ease: 'power3.out' }, 0.52);
      tl.fromTo(obj, { y: 0 }, { y: () => obj.offsetWidth * (parseFloat(getComputedStyle(root).getPropertyValue('--xf-settle')) || 0), duration: 0.16, ease: 'power2.inOut' }, 0.62);
      if (contact) tl.fromTo(contact, { opacity: 0 }, { opacity: 1, duration: 0.1, ease: 'power1.in' }, 0.68);
      // 9. callouts: the marker pops and focuses, its label rises (on a phone: its row in the stack)
      const n = callouts.length, gap = n > 1 ? Math.min(0.05, 0.13 / (n - 1)) : 0;
      callouts.forEach((c, i) => {
        const t0 = 0.66 + gap * i;
        const mark = c.querySelector('.xf-mark');
        if (phone) {
          if (rows[i]) tl.fromTo(rows[i], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.05, ease: 'power3.out', force3D: false }, t0);
          return;
        }
        if (mark) {
          tl.fromTo(mark, { scale: 0 }, { scale: 1, duration: 0.05, ease: 'expo.out', force3D: false }, t0);
          tl.fromTo(mark, { opacity: 0, filter: 'blur(6px)' }, { opacity: 1, filter: 'blur(0px)', duration: 0.06, ease: 'power2.out' }, t0);
        }
        const lw = words(c.querySelector('.xf-label'));
        if (lw.length) tween(lw, { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.04, ease: 'power3.out', stagger: { amount: 0.02 } }, t0 + 0.02);
      });
      // 10. the after line rises into the slot the statement left; 11. the action
      const cw = words(closing);
      if (cw.length) tween(cw, { yPercent: 70, rotation: -4, autoAlpha: 0 }, { yPercent: 0, rotation: 0, autoAlpha: 1, duration: 0.05, ease: 'power3.out', stagger: { amount: 0.03 } }, 0.84);
      if (cta) tl.fromTo(cta, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.05, ease: 'power2.out' }, 0.88);
      // 12. hold to the end
      tl.set({}, {}, 1);
      step();
    };

    function rest() {
      D.set = null;
      Object.values(sets).forEach((s) => s.release());
      if (D.off) { D.off(); D.off = null; }
      root.classList.remove('xf-drawn');
      if (iris) iris.style.removeProperty('clip-path');
    }

    mm = Stage.scene(root, {
      hold,
      scrub,
      build: off ? undefined : build,
      phone: off ? 'rest' : { hold: phoneHold, build },
      rest,
    });
    return mm;
  };
})();
