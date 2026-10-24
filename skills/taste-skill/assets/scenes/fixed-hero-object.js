// tasteskill / scenes / fixed-hero-object.js — one product stays on its own layer and turns while the
// page's chapters slide up beneath it.
//
// A turntable render of one object (a camera, a watch, a drone, a bottle) sits above a held stage. As the
// page scrolls, the chapter panels rise under it one screen at a time and the object turns with the scroll
// while it flies between reserved lanes: from the centre of the first panel to a right lane where it
// bleeds off the edge beside a heading, across to a left lane beside a spec sheet as a dark ground rises
// under it, then small and centred above a gauge and three numbers. Each chapter can name the pose it
// talks about (data-frame): the turn is routed so the object slows into that pose while the copy is read
// and turns between chapters, landing on its opening pose at the dock. Copy only ever sits in the lane the
// object has left, and only once the object is clear: the lanes are fitted to the object's real
// silhouette in each pose, measured from the frames. Use it once, for a hardware or packaging launch that
// has a turntable render (36-120 frames with alpha).
//
// DOM (the finished composition is this markup, styled by fixed-hero-object.css):
//
//   <section class="scene" data-scene="fixed-hero-object" aria-label="Halden 35"
//            data-options='{"frames":"turn/d/{000}.webp","count":72,"phoneFrames":"turn/p/{000}.webp","phoneCount":36}'>
//     <div class="scene-stage">
//       <div class="fho-track">
//         <article class="fho-panel">                                   first panel: the hero
//           <h2 class="fho-title"><span class="fho-line">Small enough</span> <span class="fho-line">to always take</span></h2>
//           <p class="fho-caption">One sentence, 24 words at most.</p>
//           <figure class="fho-still"><img src="turn/d/000.webp" width="1280" height="960" alt="…"></figure>
//         </article>
//         <article class="fho-panel" id="shutter" data-frame="61">      a chapter (1-4 of them)
//           <div class="fho-copy">
//             <h3 class="fho-head"><span class="fho-line">…</span> <span class="fho-line">…</span></h3>
//             <p>…</p>                                                     any blocks: p, ul, a
//             <dl class="fho-specs"><div><dt>Lens</dt><dd>35 mm f/2</dd></div> …</dl>   3-12 rows
//           </div>
//           <figure class="fho-still"><img src="turn/d/061.webp" loading="lazy" …></figure>   the same pose
//         </article>
//         <article class="fho-panel is-dark"> … </article>                is-dark: the dark ground
//         <article class="fho-panel fho-dock is-dark">                     optional last panel: the dock
//           <h3 class="fho-head">…</h3>
//           <figure class="fho-still"><img src="turn/d/000.webp" loading="lazy" alt=""></figure>
//           <svg class="fho-gauge" viewBox="0 0 200 104" style="--fho-v:.72" aria-hidden="true">
//             <path class="fho-arc" pathLength="100" d="M8 100A92 92 0 0 1 192 100"/>
//             <path class="fho-arc fho-arc--fill" pathLength="100" d="M8 100A92 92 0 0 1 192 100"/></svg>
//           <ul class="fho-readouts"><li><b class="fho-num">312</b> <span class="fho-unit">frames</span>
//             <span class="fho-label">in one day</span></li> … 1-4 of them</ul>
//           <a class="fho-cta" href="#order">Order the 35</a>
//         </article>
//       </div>
//     </div>
//   </section>
//
// The script adds the object (.fho-object: a poster image and a canvas) and the count ("2 of 4") to the
// stage; neither exists without it. Headings: wrap each line in .fho-line (two lines at most); each is
// set on one line, smaller if it is too long for its column. A heading without them rises as one block. Chapters alternate lanes (the object right, copy left; then the
// object left, copy right); data-lane="left|right" on a chapter overrides. data-frame on a chapter is
// the frame of the sequence (0 to count - 1, desktop numbering) its copy talks about: the lens in
// profile beside a paragraph about the lens. Give the still in that chapter the same frame. Numbers
// count up from 0 to the value written in the HTML (or data-to), with as many decimals as written (or
// data-decimals). The gauge fills to --fho-v (0-1); say what it measures in a readout label. A link
// to a chapter's id (href="#shutter") scrolls to the moment that chapter is parked and read. Colours
// come from the page: --ground (light ground), --night (dark ground), --ink, --paper (text on dark),
// --accent (gauge fill and the action), --font-display, --font-text, --margin.
//
// The sequence: frames rendered around a vertical axis at a fixed distance, 10-15 degrees above,
// frame 0 the three-quarter beauty pose, transparent (WebP or AVIF with alpha), no floor shadow, the
// object centred, its widest pose 86-90% of the frame width with 6% or more above and below. 4:3.
// 72 frames at 1280x960 (about 2-3 MB) on desktop, 36 at 960x720 on phones, tablets and any touch
// screen. Frames load from frame 0 and the chapters' poses outward, in strides of 12, 6, 3, 1, once the
// scene is a screen away; the nearest loaded frame is drawn, so the canvas is never blank and there is
// no preloader. Frames are kept as decoded images the browser may release, not as bitmaps it must hold.
// Each frame's opaque box is measured as it loads; the object is clipped to the box of the frame it shows.
//
// Options (data-options JSON). Default, then range:
//   frames       —        URL pattern of the sequence; {000} is the zero-padded index, {i} the plain one.
//                         Without it the hero still stands in, unturned.
//   count        72       frames in one turn (36-120)
//   phoneFrames  frames   the sequence for phones, tablets held upright and touch screens; phoneCount,
//                         its frame count (default count)
//   wideFrames   —        opt-in larger sequence (2000x1500) for stages 1440px and wider at a pixel
//                         ratio of 2 or more, no touch; wideCount, its frame count (default count)
//   turns        auto     whole turns over the route (1-3); auto = the fewest the chapters' poses allow
//                         (flights - 1 when no chapter names a pose)
//   hold         auto     screens held on desktop; auto = 1.75 x panels (7 for 4 panels)
//   phoneHold    auto     screens held on the phone; auto = 1.5 x panels (6 for 4 panels)
//   hero         1.2      scale of the opening pose (0.9-1.3), lowered until it clears the title
//   park         1.42     scale in the right lane (1.15-1.5); a narrow pose (a profile) grows up to 1.2x
//   left         1.15     scale in the left lane (0.9-1.3)
//   bleed        8        how far the object's silhouette runs past the right edge, in vw (0-14)
//   dock         0.62     scale at the dock (0.5-0.7)
//   bank         7        degrees the object banks into each flight (0-10); 5 in the vertical layout
//   sweep        12       degrees it rocks through in the left lane (0-16); 10 in the vertical layout
//   counter      true     the small "2 of 4" in the top-right corner
//   intro        true     when the scene opens the page: the title rises and the object fades in on load
//   scrub        auto     true when Lenis smooths the page, else 0.8 (seconds of catch-up)
//   phone        'same'   'same' runs the vertical route on the phone; 'rest' shows the finished composition
//
// Layouts. Landscape (wider than tall, 768px and up): the object box min(80svh, 54vw) wide, its base
// centre at 50% / 65%. Each lane is fitted to the silhouette of the pose parked in it: in the right lane
// it bleeds `bleed` vw off the edge, never nearer the copy than 3vw nor further than 28vw from it, and
// never under the count; in the left lane it is centred in the space left of the copy, with room for its
// rock. Every pose shown while a chapter's copy is up stays clear of it. The count is drawn in two inks,
// each clipped to its ground, so a passing edge cuts it cleanly. Vertical (phones, and any stage taller
// than wide): no lateral flights; the object rises from the centre (52svh) to a top lane (27svh, scale
// 0.9, a profile up to 1.08) and docks at 30svh (scale dock + 0.12), with all copy in the
// lower lane (47-94svh). A sheet of 7 rows or more goes into two columns there; on desktop its rows get
// shorter so 3-12 rows fit the stage.
//
// Progress map (desktop, 4 panels, the demo's poses): 0% the object large (1.2) in the centre of the
// hero, frame 0, the title top left and the caption bottom left; 5-18% it flies right, banking, growing,
// turning into the lens profile as the next panel rises behind it; 25% parked right on the profile,
// bleeding off the edge, heading and text on the left, 2 of 4; 33-47% it turns through its back while
// it crosses to the left lane, the dark ground's edge sweeping up under it; 50% parked left on the front
// three-quarter, rocking, the spec sheet on the right, 3 of 4; 64-80% it docks small and centred as the
// last panel rises, turning back onto frame 0, where the turn stops at 78%; 77-93% the gauge draws, the
// numbers fade in counting and the action comes in; 93-100% held. Reduced motion, no script and phone
// 'rest': the panels stacked, each with its still, every number final.
(() => {
  const ID = 'fixed-hero-object';
  const VERT = '(max-width: 767px), (max-aspect-ratio: 1/1)';
  const W = { lead: 0.05, flight: 0.125, dockFlight: 0.16, dockShow: 0.13, end: 0.07 };
  const BOX = [0.12, 0.08, 0.88, 0.86]; // a frame's opaque box (l t r b, fractions) until it is measured
  const LEAD = 28; // vw: the furthest the right lane's silhouette sits from its copy
  const cache = new Map();
  const mod = (i, n) => ((i % n) + n) % n;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // The opaque box of a frame, read from a small copy of it. A frame from another origin cannot be read:
  // the default box stands in.
  let probe = null;
  function measure(img) {
    try {
      if (!probe) { probe = document.createElement('canvas'); probe.width = 128; probe.height = 96; }
      const g = probe.getContext('2d', { willReadFrequently: true });
      g.clearRect(0, 0, 128, 96);
      g.drawImage(img, 0, 0, 128, 96);
      const d = g.getImageData(0, 0, 128, 96).data;
      let l = 128, t = 96, r = -1, b = -1;
      for (let y = 0; y < 96; y++) {
        for (let x = 0; x < 128; x++) {
          if (d[(y * 128 + x) * 4 + 3] > 24) { if (x < l) l = x; if (x > r) r = x; if (y < t) t = y; b = y; }
        }
      }
      return r < 0 ? false : [l / 128, t / 96, (r + 1) / 128, (b + 1) / 96];
    } catch (e) { return false; }
  }

  // One turntable sequence, shared by every build of the scene. Frames stay decoded <img>s, which the
  // browser can release under memory pressure (bitmaps of 72 frames at 1280x960 would pin ~350 MB).
  function sequence(pattern, count) {
    const key = pattern + '|' + count;
    if (cache.has(key)) return cache.get(key);
    const url = (i) => pattern.replace(/\{(0+|i)\}/, (m, g) => (g === 'i' ? String(i) : String(i).padStart(g.length, '0')));
    const s = { key, count, url, frames: new Array(count).fill(null), boxes: new Array(count).fill(null), w: 0, h: 0, on: new Set(), started: false, order: [], next: 0 };
    for (const stride of [12, 6, 3, 1]) for (let i = 0; i < count; i += stride) if (!s.order.includes(i)) s.order.push(i);
    // frames wanted early (the chapters' poses) move to the front of what is not yet requested
    s.prefer = (list) => {
      for (const i of list.slice().reverse()) {
        const at = s.order.indexOf(mod(i, count));
        if (at >= s.next) { s.order.splice(at, 1); s.order.splice(s.next, 0, mod(i, count)); }
      }
    };
    s.box = (i) => {
      i = mod(i, count);
      if (s.boxes[i] === null && s.frames[i]) s.boxes[i] = measure(s.frames[i]);
      return s.boxes[i] === null ? null : s.boxes[i] || BOX;
    };
    s.start = () => {
      if (s.started) return;
      s.started = true;
      const worker = async () => {
        while (s.next < s.order.length) {
          const i = s.order[s.next++];
          try {
            const img = new Image();
            img.decoding = 'async';
            img.src = url(i);
            await img.decode();
            if (!s.w) { s.w = img.naturalWidth; s.h = img.naturalHeight; }
            s.frames[i] = img;
            s.boxes[i] = measure(img);
            s.on.forEach((fn) => fn(s, i));
          } catch (e) { /* a missing frame: its neighbours stand in */ }
        }
      };
      for (let k = 0; k < 6; k++) worker();
    };
    cache.set(key, s);
    return s;
  }

  // Draws the frame nearest to the one asked for, only when that changes. One per scene; the build in
  // use says which sequence it reads.
  function painter(root, canvas, poster, onDraw) {
    const g = canvas.getContext('2d');
    let seq = null, n = 1, want = 0, shown = -1;
    const nearest = (i) => {
      for (let d = 0; d <= n / 2; d++) {
        const a = (i + d) % n, b = (i - d + n) % n;
        if (seq.frames[a]) return a;
        if (seq.frames[b]) return b;
      }
      return -1;
    };
    const dist = (a, b) => { const d = Math.abs(a - b) % n; return Math.min(d, n - d); };
    const paint = () => {
      if (!seq) return;
      const j = nearest(want);
      if (j < 0 || j === shown) return;
      // the poster is frame 0: keep it until a loaded frame is closer to the one asked for
      if (shown < 0 && poster.getAttribute('src') && j !== want && dist(j, want) >= dist(0, want)) return;
      if (canvas.width !== seq.w || canvas.height !== seq.h) { canvas.width = seq.w; canvas.height = seq.h; }
      g.clearRect(0, 0, canvas.width, canvas.height);
      g.drawImage(seq.frames[j], 0, 0, canvas.width, canvas.height);
      shown = j;
      canvas.style.visibility = 'visible';
      poster.style.visibility = 'hidden';
      if (onDraw) onDraw(seq.boxes[j] || null);
    };
    const attached = new Set();
    const api = {
      use(s) {
        if (!s || s === seq) return;
        seq = s; n = s.count; shown = -1;
        if (!attached.has(s)) { attached.add(s); s.on.add((from) => { if (from === seq && want !== shown) paint(); }); }
        canvas.style.visibility = 'hidden';
        if (onDraw) onDraw(s.boxes[0] || null);
        poster.src = s.url(0);
        poster.style.visibility = 'visible';
        paint();
      },
      set(i) { want = mod(i, n); if (want !== shown) paint(); },
      get seq() { return seq; },
      get count() { return n; },
      get frame() { return shown; },
      get want() { return want; },
    };
    root.__fhoPainter = api;
    return api;
  }

  // The route of the turn. keys: [{ t, g }], each a moment of the scroll (0-1) and the pose it shows
  // (a fraction of a turn); the last key is the landing. Picks the direction and the whole turns that
  // keep the fastest stretch slowest, then returns u(t) in turns (signed): slow through each key, a
  // steady turn between them, easing to a stop on the landing.
  function route(keys, want) {
    let best = null;
    for (const dir of [1, -1]) {
      const pts = [{ t: 0, u: 0 }];
      keys.forEach((k, j) => {
        const prev = pts[pts.length - 1].u;
        const g = dir > 0 ? mod(k.g, 1) : mod(-k.g, 1);
        let u = Math.floor(prev) + g;
        if (u < prev - 1e-9) u += 1;
        if (j === keys.length - 1 && u < 1e-9) u += 1; // at least one turn
        pts.push({ t: k.t, u });
      });
      const sp = (j) => (pts[j + 1].u - pts[j].u) / Math.max(1e-6, pts[j + 1].t - pts[j].t);
      // extra whole turns, each to the stretch it slows least
      const total = pts[pts.length - 1].u;
      for (let e = Math.round(total); e < want; e++) {
        let pick = 0, low = Infinity;
        for (let j = 0; j < pts.length - 1; j++) {
          const v = (pts[j + 1].u - pts[j].u + 1) / Math.max(1e-6, pts[j + 1].t - pts[j].t);
          if (v < low) { low = v; pick = j; }
        }
        for (let m = pick + 1; m < pts.length; m++) pts[m].u += 1;
      }
      let fast = 0;
      for (let j = 0; j < pts.length - 1; j++) fast = Math.max(fast, sp(j));
      if (!best || fast < best.fast - 1e-6) best = { dir, pts, fast };
    }
    // velocity: a plateau between keys and smooth ramps of up to 0.1 into each key (an eighth of the
    // slower neighbouring pace there, so the pose holds while it is read) and into the landing (at rest)
    const { dir, pts } = best;
    const segs = [];
    const sec = (j) => (pts[j + 1].u - pts[j].u) / Math.max(1e-6, pts[j + 1].t - pts[j].t);
    for (let j = 0; j < pts.length - 1; j++) {
      const L = Math.max(1e-6, pts[j + 1].t - pts[j].t), D = pts[j + 1].u - pts[j].u;
      const w0 = j === 0 ? 0 : Math.min(0.1, 0.4 * L), w1 = Math.min(0.1, 0.4 * L);
      let a = j === 0 ? 0 : 0.125 * Math.min(sec(j - 1), sec(j));
      let b = j === pts.length - 2 ? 0 : 0.125 * Math.min(sec(j), sec(j + 1));
      let P = (D - a * w0 / 2 - b * w1 / 2) / (L - w0 / 2 - w1 / 2);
      if (!(P >= 0)) { a = 0; b = 0; P = D / (L - w0 / 2 - w1 / 2); }
      segs.push({ t0: pts[j].t, L, u0: pts[j].u, a, b, P, w0, w1 });
    }
    const end = pts[pts.length - 1];
    const I = (x) => x * x * x - x * x * x * x / 2; // the integral of smoothstep
    const at = (t) => {
      if (t >= end.t) return dir * end.u;
      let s = segs[0];
      for (const x of segs) if (t >= x.t0) s = x;
      const tau = clamp(t - s.t0, 0, s.L);
      const X0 = (s.a + s.P) * s.w0 / 2, X1 = X0 + s.P * (s.L - s.w0 - s.w1);
      let x;
      if (tau < s.w0) x = s.a * tau + (s.P - s.a) * s.w0 * I(tau / s.w0);
      else if (tau <= s.L - s.w1) x = X0 + s.P * (tau - s.w0);
      else { const v = tau - (s.L - s.w1); x = X1 + s.P * v + (s.b - s.P) * s.w1 * I(v / s.w1); }
      return dir * (s.u0 + x);
    };
    return { at, dir, turns: end.u, end: end.t, fastest: best.fast };
  }

  // A heading's lines, each in its own mask. A heading without .fho-line rises as one block.
  function lines(el) {
    if (!el) return [];
    let ls = [...el.querySelectorAll('.fho-line')];
    if (!ls.length) {
      const span = document.createElement('span');
      span.className = 'fho-line fho-block';
      while (el.firstChild) span.appendChild(el.firstChild);
      el.appendChild(span);
      ls = [span];
    }
    return ls.map((l) => {
      if (!(l.firstElementChild && l.firstElementChild.classList.contains('fho-in'))) {
        const inner = document.createElement('span');
        inner.className = 'fho-in';
        while (l.firstChild) inner.appendChild(l.firstChild);
        l.appendChild(inner);
      }
      return l.firstElementChild;
    });
  }

  // A written number: "312", "0.4", "1,240" (grouped), "0,4" (decimal comma). Counts up in the same form.
  const numberOf = (el) => {
    const raw = (el.dataset.to || el.textContent).trim();
    const grouped = /^-?\d{1,3}([,   ]\d{3})+(\.\d+)?$/.test(raw);
    const comma = !grouped && /^-?\d+,\d+$/.test(raw);
    const plain = grouped ? raw.replace(/[,   ]/g, '') : comma ? raw.replace(',', '.') : raw.replace(/[^\d.-]/g, '');
    const m = plain.match(/\.(\d+)/);
    const dec = el.dataset.decimals != null ? +el.dataset.decimals : m ? m[1].length : 0;
    const nf = new Intl.NumberFormat('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: grouped });
    return { to: parseFloat(plain) || 0, fmt: (v) => { const t = nf.format(v); return comma ? t.replace('.', ',') : t; } };
  };

  window.Scenes = window.Scenes || {};
  window.Scenes[ID] = (root, opts = {}) => {
    const stage = root.querySelector(':scope > .scene-stage');
    const track = root.querySelector('.fho-track');
    if (!stage || !track) return null;
    root.classList.add('fho');
    const panels = [...track.children].filter((p) => p.classList.contains('fho-panel'));
    const N = panels.length;
    if (N < 2) return null;
    const hasDock = N > 2 && panels[N - 1].classList.contains('fho-dock');
    const chapters = panels.slice(1, hasDock ? N - 1 : N);
    const lanes = chapters.map((p, i) => (p.dataset.lane === 'left' || p.dataset.lane === 'right' ? p.dataset.lane : i % 2 === 0 ? 'right' : 'left'));
    chapters.forEach((p, i) => p.classList.add(lanes[i] === 'right' ? 'is-lane-right' : 'is-lane-left'));

    const o = {
      count: 72, turns: 0, hero: 1.2, park: 1.42, left: 1.15, bleed: 8, dock: 0.62, bank: 7, sweep: 12, counter: true, intro: true, phone: 'same',
      ...opts,
    };
    const count = Math.round(o.count) || 72;
    const flights = chapters.length + (hasDock ? 1 : 0);
    const hold = o.hold || Math.round(N * 1.75 * 2) / 2;
    const phoneHold = o.phoneHold || Math.round(N * 1.5 * 2) / 2;
    const heroScale = clamp(+o.hero || 1.2, 0.9, 1.3);
    const park = clamp(+o.park || 1.42, 1.15, 1.5);
    const leftScale = clamp(+o.left || 1.15, 0.9, 1.3);
    const bleed = clamp(o.bleed == null ? 8 : +o.bleed, 0, 14);
    const dockScale = clamp(+o.dock || 0.62, 0.5, 0.7);
    const bank = clamp(+o.bank, 0, 10);
    const sweep = clamp(+o.sweep, 0, 16);
    // the pose each chapter talks about, as a fraction of a turn (null: whatever passes)
    const poses = chapters.map((p) => (p.dataset.frame != null && p.dataset.frame !== '' && isFinite(+p.dataset.frame) ? mod(+p.dataset.frame, count) / count : null));

    // the object: a poster for the first paint, a canvas for the sequence
    let obj = stage.querySelector('.fho-object');
    if (!obj) {
      obj = document.createElement('div');
      obj.className = 'fho-object';
      obj.setAttribute('aria-hidden', 'true');
      obj.innerHTML = '<div class="fho-tilt"><img class="fho-poster" alt="" decoding="async"><canvas class="fho-canvas"></canvas></div>';
      stage.appendChild(obj);
    }
    const tilt = obj.querySelector('.fho-tilt');
    const poster = obj.querySelector('.fho-poster');
    const canvas = obj.querySelector('.fho-canvas');
    if (!o.frames) {
      const still = panels[0].querySelector('.fho-still img');
      if (still) poster.src = still.currentSrc || still.src;
      canvas.style.display = 'none';
    }
    let counter = stage.querySelector('.fho-counter');
    if (o.counter && !counter) {
      counter = document.createElement('div');
      counter.className = 'fho-counter';
      counter.setAttribute('aria-hidden', 'true');
      const one = `<span class="fho-digits"><span class="fho-roll">${panels.map((_, i) => `<span>${i + 1}</span>`).join('')}</span></span><span>of ${N}</span>`;
      counter.innerHTML = `<span class="fho-count">${one}</span><span class="fho-count">${one}</span>`;
      stage.appendChild(counter);
    }
    // two inks for the count, ink over light panels and paper over dark ones, each clipped to its ground
    const digits = counter ? [...counter.querySelectorAll('.fho-roll')] : null;
    const inks = counter ? [...counter.querySelectorAll('.fho-count')] : [];
    const dark = (i) => panels[clamp(i, 0, N - 1)].classList.contains('is-dark');

    // headings, blocks and numbers, prepared once
    const heroTitleEl = panels[0].querySelector('.fho-title, h1, h2');
    const heroTitle = lines(heroTitleEl);
    const caption = panels[0].querySelector('.fho-caption');
    const copyOf = (p) => {
      const box = p.querySelector('.fho-copy') || p;
      const head = box.querySelector('.fho-head, h2, h3');
      const blocks = [], rows = [];
      for (const el of box.children) {
        if (el === head || el.classList.contains('fho-still') || el.classList.contains('fho-gauge') || el.classList.contains('fho-readouts') || el.classList.contains('fho-cta')) continue;
        if (el.classList.contains('fho-specs')) rows.push(...el.children);
        else blocks.push(el);
      }
      return { box, head: lines(head), blocks, rows };
    };
    const chapterCopy = chapters.map(copyOf);
    root.querySelectorAll('.fho-specs').forEach((dl) => dl.style.setProperty('--fho-rows', dl.children.length));
    const dockPanel = hasDock ? panels[N - 1] : null;
    const dockCopy = dockPanel ? copyOf(dockPanel) : null;
    const readouts = dockPanel ? [...dockPanel.querySelectorAll('.fho-readouts > li')].map((li) => {
      const el = li.querySelector('.fho-num');
      return { li, num: el ? { el, ...numberOf(el), text: el.textContent } : null };
    }) : [];
    readouts.forEach((r) => { if (r.num) r.num.el.style.minWidth = r.num.text.trim().length * 0.62 + 'em'; });
    const gauge = dockPanel && dockPanel.querySelector('.fho-gauge');
    const arcBase = gauge && gauge.querySelector('.fho-arc:not(.fho-arc--fill)');
    const arcFill = gauge && gauge.querySelector('.fho-arc--fill');
    const gaugeValue = gauge ? clamp(parseFloat(getComputedStyle(gauge).getPropertyValue('--fho-v')) || +gauge.dataset.value || 0.72, 0, 1) : 0;
    const cta = dockPanel && dockPanel.querySelector('.fho-cta');

    const mq = window.matchMedia(VERT);
    const vert = () => mq.matches;
    const modeEase = (v, d) => { const ev = gsap.parseEase(v), ed = gsap.parseEase(d); return (p) => (mq.matches ? ev(p) : ed(p)); };

    // the sequences: phones, upright tablets and touch screens get the light one; the wide one is opt-in
    const seqs = o.frames ? {
      desk: sequence(o.frames, count),
      phone: sequence(o.phoneFrames || o.frames, Math.round(o.phoneCount || count)),
      wide: o.wideFrames ? sequence(o.wideFrames, Math.round(o.wideCount || count)) : null,
    } : null;
    const pickSeq = () => {
      if (!seqs) return null;
      if (vert() || Stage.touch) return seqs.phone;
      if (seqs.wide && (window.devicePixelRatio || 1) >= 2 && (stage.clientWidth || innerWidth) >= 1440) return seqs.wide;
      return seqs.desk;
    };
    // the object is clipped to the opaque box of the frame it shows, so its empty corners cover nothing
    let clipNow = '';
    const pc = (v) => (Math.max(0, v) * 100).toFixed(2) + '%';
    const clipTo = (b) => {
      const m = 1 / 64;
      const v = b ? `inset(${pc(b[1] - m)} ${pc(1 - b[2] - m)} ${pc(1 - b[3] - m)} ${pc(b[0] - m)})` : '';
      if (v !== clipNow) { clipNow = v; tilt.style.clipPath = v; }
    };
    const paint = seqs ? painter(root, canvas, poster, clipTo) : null;
    const frameOf = (g, s) => mod(Math.round(g * s.count), s.count);
    const preferFor = (s) => s.prefer([0, ...poses.filter((g) => g != null).flatMap((g) => { const i = frameOf(g, s); return [i, i - 1, i + 1, i - 2, i + 2, i - 3, i + 3, i - 4, i + 4, i - 5, i + 5]; })]);

    // frames start loading when the scene is a screen away
    let near = !('IntersectionObserver' in window);
    if (seqs && !near) {
      const io = new IntersectionObserver((es) => {
        if (es.some((e) => e.isIntersecting)) {
          io.disconnect();
          near = true;
          if (paint && paint.seq) paint.seq.start();
        }
      }, { rootMargin: '100% 0px' });
      io.observe(root);
    }
    const useSeq = () => {
      const s = pickSeq();
      if (!s || !paint) return;
      if (s !== paint.seq) { preferFor(s); paint.use(s); }
      if (near) s.start();
    };

    // the lanes are fitted to measured silhouettes; until a pose's frame is in, a default box stands in,
    // and the layout is read again once it arrives
    const waiting = new Set();
    let refreshTimer = 0;
    const askRefresh = () => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => { if (root.classList.contains('is-live') && window.ScrollTrigger) ScrollTrigger.refresh(); }, 250);
    };
    if (seqs) {
      for (const s of Object.values(seqs)) if (s) s.on.add((from, i) => { if (waiting.has(from.key + ':' + i)) { waiting.clear(); askRefresh(); } });
    }
    let posterBox = null;
    poster.addEventListener('load', () => { if (!seqs && waiting.has('poster')) { waiting.clear(); posterBox = null; askRefresh(); } });
    // the opaque box of frame i of the sequence in use (or of the poster when there is none)
    const boxAt = (i) => {
      const s = paint && paint.seq;
      if (s) {
        const b = s.box(i);
        if (b) return b;
        waiting.add(s.key + ':' + mod(i, s.count));
        return BOX;
      }
      if (posterBox) return posterBox;
      if (poster.complete && poster.naturalWidth) { const b = measure(poster); clipTo(b || null); return (posterBox = b || BOX); }
      waiting.add('poster');
      return BOX;
    };
    // the route of the build in use: the pose read at each chapter, and every pose shown while its copy is up
    let R = null;
    const frameAt = (t) => { const s = paint && paint.seq; return s && R ? mod(Math.round(R.route.at(t) * s.count), s.count) : 0; };
    const union = (list) => list.reduce((u, b) => [Math.min(u[0], b[0]), Math.min(u[1], b[1]), Math.max(u[2], b[2]), Math.max(u[3], b[3])], [1, 1, 0, 0]);
    const posesOf = (i) => {
      if (!(paint && paint.seq && R)) { const b = boxAt(0); return { B: b, U: b }; }
      const [a, b] = R.windows[i], seen = new Set();
      for (let t = a; t <= b + 1e-9; t += 0.004) seen.add(frameAt(t));
      seen.add(frameAt(b));
      return { B: boxAt(frameAt(R.reads[i])), U: union([...seen].map(boxAt)) };
    };

    // headings set one line per .fho-line: a line too long for its column is set smaller, not wrapped
    const heads = [heroTitleEl, ...chapterCopy.map((c) => c.head[0] && c.head[0].closest('.fho-title, .fho-head, h2, h3')), dockCopy && dockCopy.head[0] && dockCopy.head[0].closest('.fho-title, .fho-head, h2, h3')].filter(Boolean);
    const fitHeads = () => {
      for (const el of heads) {
        el.style.removeProperty('--fho-fit');
        let over = 1;
        for (const l of el.querySelectorAll('.fho-line:not(.fho-block) > .fho-in')) if (l.clientWidth) over = Math.max(over, l.scrollWidth / l.clientWidth);
        if (over > 1.002) el.style.setProperty('--fho-fit', Math.max(0.6, 0.985 / over).toFixed(3));
      }
    };

    // ------------------------------------------------------------------ the layout of one refresh
    let LAY = null, geo = null;
    if (window.ScrollTrigger) {
      ScrollTrigger.addEventListener('refreshInit', () => {
        LAY = null; geo = null;
        if (root.classList.contains('is-live')) useSeq();
      });
    }
    const lay = () => LAY || (LAY = layout());
    // a chapter's copy, in its panel's coordinates (the panel is at rest when it is read)
    const edgesOf = (c, panel) => {
      if (c.box !== panel) return { l: c.box.offsetLeft, r: c.box.offsetLeft + c.box.offsetWidth, t: c.box.offsetTop };
      let l = Infinity, r = -Infinity, t = Infinity;
      for (const el of panel.children) {
        if (el.classList.contains('fho-still')) continue;
        l = Math.min(l, el.offsetLeft); r = Math.max(r, el.offsetLeft + el.offsetWidth); t = Math.min(t, el.offsetTop);
      }
      return isFinite(l) ? { l, r, t } : { l: 0, r: 0, t: panel.offsetHeight };
    };
    // the object at offset (x, y) and scale s, posed on box B: its silhouette on the stage
    const silhouette = (bx, by, Wb, Hb, x, y, s, B) => ({
      l: bx + x + (B[0] - 0.5) * Wb * s, r: bx + x + (B[2] - 0.5) * Wb * s,
      t: by + y + (B[1] - 0.5) * Hb * s, b: by + y + (B[3] - 0.5) * Hb * s,
    });
    // a narrow pose (a profile) grows a little so it carries the same weight as a wide one
    const boost = (B) => clamp(Math.sqrt(0.72 / Math.max(0.2, B[2] - B[0])), 1, 1.2);
    function layout() {
      fitHeads();
      const w = stage.clientWidth || innerWidth, h = stage.clientHeight || innerHeight;
      const vw = w / 100, vh = h / 100, V = vert();
      const Wb = obj.offsetWidth || 1, Hb = obj.offsetHeight || 1;
      const bx = obj.offsetLeft, by = obj.offsetTop; // the box centre (xPercent/yPercent -50)
      const cBottom = counter ? counter.offsetTop + counter.offsetHeight : 0;
      const B0 = boxAt(0);

      // the opening pose: as large as the option asks, while it clears the title and the caption
      let hs = V ? 1.1 : heroScale;
      if (heroTitleEl) {
        const tb = heroTitleEl.offsetTop + heroTitleEl.offsetHeight + 2 * vh;
        if (B0[1] < 0.5) hs = Math.min(hs, (by - tb) / ((0.5 - B0[1]) * Hb));
      }
      if (caption && !V) {
        const cr = caption.offsetLeft + caption.offsetWidth + 2 * vw;
        const ct = caption.offsetTop;
        const sl = silhouette(bx, by, Wb, Hb, 0, 0, hs, B0);
        if (sl.b > ct && sl.l < cr && B0[0] < 0.5) hs = Math.min(hs, (bx - cr) / ((0.5 - B0[0]) * Wb));
      }
      if (B0[3] > 0.5) hs = Math.min(hs, (h - 1 * vh - by) / ((B0[3] - 0.5) * Hb));
      hs = Math.max(0.8, hs);

      // each chapter: B, the pose read there (placed and sized on it); U, every pose shown while its
      // copy is up (kept clear of the copy and the count)
      const stops = chapters.map((p, i) => {
        const { B, U } = posesOf(i);
        const E = edgesOf(chapterCopy[i], p);
        const hU = (U[3] - U[1]) * Hb, wU = (U[2] - U[0]) * Wb;
        if (V) {
          // the top lane: centred, between the count and the copy below
          const copyTop = E.t - 3 * vh, top = cBottom + 1 * vh;
          let s = 0.9 * boost(B);
          s = Math.min(s, (copyTop - top) / hU, 0.96 * w / wU);
          let y = -25 * vh;
          const sl = silhouette(bx, by, Wb, Hb, 0, y, s, U);
          if (sl.b > copyTop) y -= sl.b - copyTop;
          const s2 = silhouette(bx, by, Wb, Hb, 0, y, s, U);
          if (s2.t < top) y += top - s2.t;
          return { x: 0, y, s, drift: 0 };
        }
        const drift = lanes[i] === 'right' ? -2 * vh : 0;
        if (lanes[i] === 'right') {
          const cR = E.r;
          const top = Math.max(cBottom + 2 * vh, 4 * vh), bottom = h - 4 * vh;
          let s = park * boost(B);
          s = Math.min(s, (bottom - top + drift) / hU);
          // vertically centred on the pose, kept below the count through the drift and above the bottom
          const yMin = top - (by + drift + (U[1] - 0.5) * Hb * s), yMax = bottom - (by + (U[3] - 0.5) * Hb * s);
          const y = Math.max(yMin, Math.min(yMax, 0.5 * h - by - ((B[1] + B[3]) / 2 - 0.5) * Hb * s));
          // across: the pose bleeds off the edge, near enough the copy to belong to it; no pose shown
          // while the copy is up comes nearer it than 3vw
          let x = w + bleed * vw - bx - (B[2] - 0.5) * Wb * s;
          const L = (xx, b) => bx + xx + (b[0] - 0.5) * Wb * s;
          if (L(x, B) > cR + LEAD * vw) x -= L(x, B) - (cR + LEAD * vw);
          if (L(x, U) < cR + 3 * vw) x += cR + 3 * vw - L(x, U);
          return { x, y, s, drift };
        }
        // the left lane: the pose centred in the room left of the copy, every pose shown inside it, with
        // room for the rock
        const cL = E.l;
        const pad = Math.sin((sweep / 2) * Math.PI / 180) * 0.5 * hU * leftScale * 1.2;
        const lo = Math.max(2 * vw, (heroTitleEl ? heroTitleEl.offsetLeft : 4 * vw) * 0.5) + pad, hi = cL - 3 * vw - pad;
        let s = leftScale * boost(B);
        s = Math.min(s, 0.84 * h / hU, (hi - lo) / wU);
        const y = 0.5 * h - by - ((B[1] + B[3]) / 2 - 0.5) * Hb * s;
        let x = (lo + hi) / 2 - bx - ((B[0] + B[2]) / 2 - 0.5) * Wb * s;
        const su = silhouette(bx, by, Wb, Hb, x, y, s, U);
        if (su.r > hi) x -= su.r - hi;
        else if (su.l < lo) x += Math.min(lo - su.l, hi - su.r);
        return { x, y, s, drift: 0 };
      });
      const dock = V ? { x: 0, y: -22 * vh, s: Math.min(0.8, dockScale + 0.12) } : { x: 0, y: -33 * vh, s: dockScale };
      return { hero: { x: 0, y: 0, s: hs }, stops, dock, vh };
    }

    // ------------------------------------------------------------------ links to a chapter
    let parks = new Map();
    const progressOf = (el) => {
      for (const [p, v] of parks) if (p === el || p.contains(el)) return v;
      return null;
    };
    const goTo = (el, instant) => {
      const st = root.__fhoTrigger;
      const p = progressOf(el);
      if (!st || p == null || !root.classList.contains('is-live')) return false;
      const y = st.start + (st.end - st.start) * p;
      requestAnimationFrame(() => {
        if (Stage.lenis) Stage.lenis.scrollTo(y, { immediate: instant, force: true });
        else window.scrollTo({ top: y, behavior: instant ? 'auto' : 'smooth' });
      });
      return true;
    };
    const byHash = (hash) => {
      let id = '';
      try { id = decodeURIComponent((hash || '').slice(1)); } catch (e) { return null; }
      const el = id && document.getElementById(id);
      return el && track.contains(el) ? el : null;
    };
    document.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest && e.target.closest('a[href*="#"]');
      if (!a || !a.hash) return;
      if (a.origin !== location.origin || a.pathname !== location.pathname) return;
      const el = byHash(a.hash);
      if (!el || !goTo(el, false)) return;
      e.preventDefault();
      try { history.pushState(null, '', a.hash); } catch (err) { /* a sandboxed page */ }
    });
    window.addEventListener('hashchange', () => { const el = byHash(location.hash); if (el) goTo(el, false); });
    // arriving with a hash: once the page has settled (fonts, pictures, the refresh after them)
    if (byHash(location.hash)) {
      const arrive = () => {
        let done = false;
        const go = () => { if (done) return; done = true; const el = byHash(location.hash); if (el) goTo(el, true); };
        if (window.ScrollTrigger) {
          const once = () => { ScrollTrigger.removeEventListener('refresh', once); setTimeout(go, 0); };
          ScrollTrigger.addEventListener('refresh', once);
        }
        setTimeout(go, 1500);
      };
      if (document.readyState === 'complete') arrive(); else window.addEventListener('load', arrive, { once: true });
    }

    // ------------------------------------------------------------------ the timeline
    function build(tl, ctx) {
      if (Stage.touch && window.ScrollTrigger) ScrollTrigger.config({ ignoreMobileResize: true });
      root.style.setProperty('--fho-n', N);
      root.__fhoTrigger = tl.scrollTrigger || null;
      LAY = null;
      useSeq();
      if (paint) paint.set(0);

      // timing: every position below is a fraction of the hold
      // a chapter is parked for longer the more it has to show (0.15 for a heading and a paragraph,
      // 0.19 for a heading and five rows)
      const M = chapters.length;
      const parkLen = chapterCopy.map((c) => Math.min(0.24, Math.max(0.13, 0.12 + 0.01 * (c.head.length + c.blocks.length + c.rows.length))));
      const k = 1 / (W.lead + M * W.flight + parkLen.reduce((x, y) => x + y, 0) + (hasDock ? W.dockFlight + W.dockShow : 0) + W.end);
      const stops = [];
      let t = W.lead * k;
      for (let i = 0; i < M; i++) {
        const a = t, b = a + W.flight * k, c = b + parkLen[i] * k;
        // the copy is all in by `landed` and starts to leave at c - 0.03; the pose settles a third of
        // the way into that window and drifts slowly after
        const cc = chapterCopy[i], tIn = b - 0.006 * k;
        const landed = Math.max(tIn + (Math.max(1, cc.head.length) - 1) * 0.012 * k + 0.04 * k,
          cc.blocks.length ? tIn + 0.065 * k + (cc.blocks.length - 1) * 0.01 * k : 0,
          cc.rows.length ? tIn + 0.035 * k + (cc.rows.length - 1) * 0.005 * k : 0);
        const read = Math.min(c - 0.04 * k, landed + 0.3 * Math.max(0, c - 0.03 * k - landed));
        stops.push({ kind: lanes[i], i, fStart: a, fEnd: b, pEnd: c, read });
        t = c;
      }
      let dockAt = 0, dockEnd = 0, showEnd = 0;
      if (hasDock) {
        dockAt = t; dockEnd = t + W.dockFlight * k; showEnd = dockEnd + W.dockShow * k;
        stops.push({ kind: 'dock', fStart: dockAt, fEnd: dockEnd, pEnd: showEnd });
      }
      const turnEnd = hasDock ? dockAt + W.dockFlight * k * 0.875 : stops[stops.length - 1].fEnd;
      parks = new Map([[panels[0], 0], ...chapters.map((p, i) => [p, stops[i].read]), ...(hasDock ? [[dockPanel, 1]] : [])]);

      // the turn: routed through each chapter's pose, whole turns, frame 0 from turnEnd on
      R = null;
      if (paint) {
        const keys = [];
        if (!hasDock) {
          stops.slice(0, -1).forEach((st, i) => { if (poses[i] != null) keys.push({ t: st.read, g: poses[i] }); });
          keys.push({ t: turnEnd, g: poses[M - 1] != null ? poses[M - 1] : 0 });
        } else {
          stops.forEach((st, i) => { if (st.kind !== 'dock' && poses[i] != null) keys.push({ t: st.read, g: poses[i] }); });
          keys.push({ t: turnEnd, g: 0 });
        }
        const named = poses.some((g) => g != null);
        const r = route(keys, Math.min(3, Math.max(0, Math.round(o.turns) || (named ? 0 : Math.max(1, flights - 1)))));
        R = { route: r, windows: stops.slice(0, M).map((st) => [st.fEnd - 0.006 * k, st.pEnd]), reads: stops.slice(0, M).map((st) => st.read) };
        root.__fhoRoute = r;
      }

      // poses: functions of the stage, read again on every refresh
      const pose = (i) => ({
        x: () => lay().stops[i].x, y: () => lay().stops[i].y, s: () => lay().stops[i].s,
        drift: () => lay().stops[i].drift,
      });
      const P = {
        hero: { x: () => 0, y: () => 0, s: () => lay().hero.s, tilt: () => 0 },
        dock: { x: () => 0, y: () => lay().dock.y, s: () => lay().dock.s, tilt: () => 0 },
      };
      const rock = () => (vert() ? 5 : sweep / 2);
      const bankOf = (kind) => () => (kind === 'right' ? -1 : 1) * (vert() ? Math.min(bank, 5) : bank);

      gsap.set(obj, { xPercent: -50, yPercent: -50, x: 0, y: 0, scale: P.hero.s() });
      gsap.set(tilt, { rotation: 0 });
      gsap.set(track, { yPercent: 0 });
      if (digits) gsap.set(digits, { yPercent: 0 });
      const fx = (target, from, to, at, dur, ease = 'none') => tl.fromTo(target, from, { ...to, duration: Math.max(0.0001, dur), ease, immediateRender: false }, at);

      if (R) {
        const proxy = { t: 0 }, r = R.route;
        fx(proxy, { t: 0 }, { t: turnEnd, onUpdate: () => paint.set(Math.round(r.at(proxy.t) * paint.count)) }, 0, turnEnd);
      }

      // the hero pose holds until the first flight (a tween, so a refresh re-reads its scale)
      if (stops.length) fx(obj, { scale: P.hero.s }, { scale: P.hero.s }, 0, stops[0].fStart);

      // flights, parks and the track
      let prev = P.hero, prevKind = 'hero', prevY = () => 0, prevTilt = () => 0;
      stops.forEach((st, i) => {
        const to = st.kind === 'dock' ? P.dock : { ...pose(i), tilt: st.kind === 'right' ? () => 0 : () => -rock() };
        const d = st.fEnd - st.fStart, a = st.fStart;
        const fromX = prev.x, fromS = prev.s, fromY = prevY, fromT = prevTilt;
        if (st.kind === 'dock') {
          const yMid = () => fromY() + (to.y() - fromY()) * (2 / 3);
          fx(obj, { x: fromX }, { x: to.x }, a, d * 0.875, 'power3.inOut');
          fx(obj, { y: fromY }, { y: yMid }, a, d * 0.625, 'power2.inOut');
          fx(obj, { y: yMid }, { y: to.y }, a + d * 0.625, d * 0.375, 'power2.out');
          const sMid = () => (fromS() + to.s()) / 2;
          fx(obj, { scale: fromS }, { scale: sMid }, a, d * 0.47, 'power2.in');
          fx(obj, { scale: sMid }, { scale: to.s }, a + d * 0.47, d * 0.47, 'power2.out');
          fx(tilt, { rotation: fromT }, { rotation: 0 }, a, d * 0.875, 'sine.inOut');
          fx(track, { yPercent: -(100 * i) / N }, { yPercent: -(100 * (i + 1)) / N }, a + d * 0.06, d * 0.75, 'power2.inOut');
        } else {
          const first = prevKind === 'hero';
          fx(obj, { x: fromX }, { x: to.x }, a, d, 'power2.inOut');
          fx(obj, { y: fromY }, { y: to.y }, a, d, first ? 'power2.inOut' : 'sine.inOut');
          const between = !first;
          const sMid = () => (between && vert() ? Math.min(fromS(), to.s()) * 0.925 : (fromS() + to.s()) / 2);
          fx(obj, { scale: fromS }, { scale: sMid }, a, d / 2, modeEase(between ? 'sine.inOut' : 'power1.in', 'power1.in'));
          fx(obj, { scale: sMid }, { scale: to.s }, a + d / 2, d / 2, modeEase(between ? 'sine.inOut' : 'power1.out', 'power1.out'));
          fx(tilt, { rotation: fromT }, { rotation: bankOf(st.kind) }, a, d / 2, 'sine.inOut');
          fx(tilt, { rotation: bankOf(st.kind) }, { rotation: to.tilt }, a + d / 2, d / 2, 'sine.inOut');
          // the page follows the object; out of the hero it follows closely, so the title is gone before
          // the growing object reaches it
          const lag = first ? 0.05 : 0.154;
          fx(track, { yPercent: -(100 * i) / N }, { yPercent: -(100 * (i + 1)) / N }, a + d * lag, d * (1 - lag), 'power2.inOut');
          // the park: a slow drift in the right lane, a rock in the left one
          const pd = st.pEnd - st.fEnd;
          if (st.kind === 'right') {
            fx(obj, { y: to.y }, { y: () => to.y() + to.drift() }, st.fEnd, pd);
            prevY = () => to.y() + to.drift();
            prevTilt = to.tilt;
          } else {
            fx(tilt, { rotation: to.tilt }, { rotation: rock }, st.fEnd, pd);
            prevY = to.y;
            prevTilt = rock;
          }
        }
        // the count turns over as the next panel passes the middle of the stage
        const mid = st.kind === 'dock' ? a + d * 0.435 : a + d * (prevKind === 'hero' ? 0.525 : 0.577);
        if (digits) fx(digits, { yPercent: -(100 * i) / N }, { yPercent: -(100 * (i + 1)) / N }, mid - d * 0.075, d * 0.15, 'power2.inOut');
        prev = to; prevKind = st.kind;
      });

      // the count's two inks, cut exactly where a ground's edge passes behind it
      if (counter && inks.length === 2) {
        const ink = () => {
          const G = geo || (geo = { tops: panels.map((p) => p.offsetTop), th: track.offsetHeight, c0: counter.offsetTop, ch: counter.offsetHeight || 1 });
          const ty = (gsap.getProperty(track, 'yPercent') / 100) * G.th;
          const c0 = G.c0, ch = G.ch;
          let j = 0;
          while (j < N - 1 && G.tops[j + 1] + ty <= c0) j++;
          const edge = j < N - 1 ? G.tops[j + 1] + ty : Infinity;
          const f = clamp((edge - c0) / ch, 0, 1); // the share of the count on panel j
          const top = dark(j), bottom = dark(j + 1);
          const clip = (showTop, showBottom) => (showTop && showBottom ? 'none' : showTop ? `inset(0 0 ${(1 - f) * 100}% 0)` : showBottom ? `inset(${f * 100}% 0 0 0)` : 'inset(0 0 100% 0)');
          inks[0].style.clipPath = clip(!top, f < 1 && !bottom);
          inks[1].style.clipPath = clip(top, f < 1 && bottom);
        };
        tl.eventCallback('onUpdate', ink);
        root.__fhoInk = ink;
        ink();
      }

      // the count: on a vertical stage the rising title would pass under it, so it waits for the first park
      if (counter && stops.length) {
        gsap.set(counter, { opacity: vert() ? 0 : 1 });
        const late = (stops[0].fEnd - stops[0].fStart) * 0.25 / stops[0].fEnd;
        fx(counter, { opacity: () => (vert() ? 0 : 1) }, { opacity: 1 }, 0, stops[0].fEnd, (p) => Math.max(0, (p - 1 + late) / late));
      }

      // the hero caption: on a vertical stage it would rise through the object, so it fades as the flight starts
      if (caption && stops.length) {
        gsap.set(caption, { opacity: 1 });
        fx(caption, { opacity: 1 }, { opacity: () => (vert() ? 0 : 1) }, stops[0].fStart, (stops[0].fEnd - stops[0].fStart) * 0.3, 'power1.in');
      }

      // chapter copy: in once the object is clear of its lane, out before it flies
      chapterCopy.forEach((c, i) => {
        const st = stops[i];
        const last = !hasDock && i === chapterCopy.length - 1;
        // a line waiting under its mask, and copy that has left, is hidden outright (nothing to find or hit)
        gsap.set(c.head, { yPercent: 110, visibility: 'hidden' });
        gsap.set(c.blocks, { opacity: 0, y: 24 });
        gsap.set(c.rows, { opacity: 0, y: 16, clipPath: 'inset(0% 100% 0% 0%)' });
        gsap.set(c.box, { opacity: 1, y: 0, visibility: 'visible' });
        const tIn = st.fEnd - 0.006 * k;
        c.head.forEach((l, j) => {
          fx(l, { visibility: 'hidden' }, { visibility: 'visible' }, tIn + j * 0.012 * k, 0.0001);
          fx(l, { yPercent: 110 }, { yPercent: 0 }, tIn + j * 0.012 * k, 0.04 * k, 'power3.out');
        });
        c.blocks.forEach((b, j) => fx(b, { opacity: 0, y: 24 }, { opacity: 1, y: 0 }, tIn + 0.03 * k + j * 0.01 * k, 0.035 * k, 'power2.out'));
        c.rows.forEach((r, j) => fx(r, { opacity: 0, y: 16, clipPath: 'inset(0% 100% 0% 0%)' }, { opacity: 1, y: 0, clipPath: 'inset(0% 0% 0% 0%)' }, tIn + 0.01 * k + j * 0.005 * k, 0.025 * k, 'power2.out'));
        if (!last) {
          fx(c.box, { opacity: 1, y: 0 }, { opacity: 0, y: -32 }, st.pEnd - 0.03 * k, 0.03 * k, 'power1.in');
          fx(c.box, { visibility: 'visible' }, { visibility: 'hidden' }, st.pEnd - 0.0001, 0.0001);
        }
      });

      // the dock: the gauge draws, the panel lands, then each reading fades in as it starts to count
      if (hasDock) {
        const d = dockEnd - dockAt;
        const landed = dockAt + d * 0.81;
        if (dockCopy) {
          gsap.set(dockCopy.head, { yPercent: 110, visibility: 'hidden' });
          dockCopy.head.forEach((l, j) => {
            fx(l, { visibility: 'hidden' }, { visibility: 'visible' }, dockAt + d * 0.75 + j * 0.01 * k, 0.0001);
            fx(l, { yPercent: 110 }, { yPercent: 0 }, dockAt + d * 0.75 + j * 0.01 * k, 0.035 * k, 'power3.out');
          });
          gsap.set(dockCopy.blocks, { opacity: 0, y: 16 });
          dockCopy.blocks.forEach((b, j) => fx(b, { opacity: 0, y: 16 }, { opacity: 1, y: 0 }, dockEnd + 0.02 * k + j * 0.01 * k, 0.04 * k, 'power2.out'));
        }
        if (arcBase) { gsap.set(arcBase, { strokeDashoffset: 100 }); fx(arcBase, { strokeDashoffset: 100 }, { strokeDashoffset: 0 }, dockAt + d * 0.375, d * 0.75, 'power1.inOut'); }
        if (arcFill) { gsap.set(arcFill, { strokeDashoffset: 100 }); fx(arcFill, { strokeDashoffset: 100 }, { strokeDashoffset: 100 - 100 * gaugeValue }, landed + 0.01 * k, 0.11 * k, 'power2.out'); }
        readouts.forEach((r, j) => {
          const at = landed + j * 0.015 * k;
          gsap.set(r.li, { opacity: 0, y: 12 });
          fx(r.li, { opacity: 0, y: 12 }, { opacity: 1, y: 0 }, at, 0.03 * k, 'power2.out');
          if (r.num) {
            const nm = r.num, p = { v: 0 };
            nm.el.textContent = nm.fmt(0);
            fx(p, { v: 0 }, { v: nm.to, onUpdate: () => { nm.el.textContent = p.v >= nm.to ? nm.text : nm.fmt(p.v); } }, at, 0.11 * k, 'power2.out');
          }
        });
        if (cta) { gsap.set(cta, { opacity: 0, y: 16 }); fx(cta, { opacity: 0, y: 16 }, { opacity: 1, y: 0 }, showEnd - 0.04 * k, 0.04 * k, 'power2.out'); }
      }

      // the load intro: only when the scene opens the page and the page is at its top
      if (o.intro && window.scrollY < 10 && root.getBoundingClientRect().top < 2) {
        gsap.from(heroTitle, { yPercent: 110, duration: 0.9, ease: 'power3.out', stagger: 0.08 });
        gsap.from(tilt, { opacity: 0, scale: 0.94, duration: 1.1, ease: 'power2.out' });
      }

      // every refresh: the sequence for this stage, the opening pose at the very top, the count's inks
      const token = {};
      root.__fhoBuild = token;
      const onRefresh = () => {
        if (root.__fhoBuild !== token) { ScrollTrigger.removeEventListener('refresh', onRefresh); return; }
        useSeq();
        if (tl.progress() < 0.0005) { tl.progress(0.001, true); tl.progress(0, true); }
        // a refresh restores the progress without updates: the frame follows it here
        if (paint && R) paint.set(Math.round(R.route.at(Math.min(tl.progress(), turnEnd)) * paint.count));
        if (root.__fhoInk) root.__fhoInk();
      };
      ScrollTrigger.addEventListener('refresh', onRefresh);

      // numbers back to their written values when the scene stops running
      root.__fhoRestore = () => {
        root.__fhoBuild = null; root.__fhoInk = null; root.__fhoTrigger = null;
        heads.forEach((el) => el.style.removeProperty('--fho-fit'));
        readouts.forEach((r) => { if (r.num) r.num.el.textContent = r.num.text; });
      };
    }

    return Stage.scene(root, {
      hold,
      scrub: o.scrub != null ? o.scrub : Stage.lenis ? true : 0.8,
      build,
      phone: o.phone === 'rest' ? 'rest' : { hold: phoneHold, build },
      rest: () => { if (root.__fhoRestore) root.__fhoRestore(); },
    });
  };
})();
