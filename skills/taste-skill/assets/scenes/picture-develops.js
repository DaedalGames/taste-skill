// tasteskill / scenes / picture-develops.js — a drawing draws itself as the page scrolls (references/scenes.md).
//
// A near full-width pen drawing is held on the stage and laid down by the scroll: the heaviest strokes
// first, then the hatching, then the faint construction lines, travelling from the top left downward,
// with a wet vermilion edge on the newest marks. A canvas works on the art's own pixels: every inked
// pixel gets an arrival order from its darkness, its place in the sweep and two noises, equalised by
// ink so coverage follows the scrollbar evenly on any drawing. The camera starts close on the seed
// strokes (scale 1.6, the top left of the drawing brought to the middle of the frame) and pulls back to
// the whole sheet as it fills, so the scene opens on wet marks filling the stage, runs off the frame's
// edges while it draws, and ends on a wide establishing view. The page is never
// blank: seed strokes are already on the sheet when it arrives. The title is static and readable from
// the first frame; once the drawing is finished the crisp picture itself takes over from the canvas, a
// short note rises in, then a still read before the page moves on.
// Use it when the subject owns high-contrast drawn material (sketches, plans, maps, scans) and the story
// is process. For a photograph use mode 'darkroom': the print develops, shadows first.
//
// DOM
//   <section class="scene" data-scene="picture-develops" data-options='{}' aria-labelledby="pd-title">
//     <div class="scene-stage">
//       <header class="pd-head">
//         <h2 class="pd-title" id="pd-title">Three to seven words, two lines at most</h2>
//         <p class="pd-note">25-40 words. Plain text is split into masked lines at runtime; a note with
//            inline markup (a link) is kept whole and rises as one block out of its own mask.</p>
//       </header>
//       <figure class="pd-frame">
//         <div class="pd-art">
//           <picture>
//             <source media="(max-aspect-ratio: 4/5)" srcset="drawing-portrait.svg">  (optional, about 0.77:1:
//                                                    phones and portrait tablets; chosen by shape, not width)
//             <img src="drawing.svg" width="2880" height="1200" alt="One sentence describing the drawing" crossorigin="anonymous">
//           </picture>
//           <canvas class="pd-canvas" aria-hidden="true"></canvas>               (optional, made if missing)
//         </div>
//         <figcaption class="pd-caption">Subject and medium, 2-8 words</figcaption>
//       </figure>
//     </div>
//   </section>
//
// The art: one drawing, landscape 2:1 to 2.4:1, dark ink on white or on a transparent ground (SVG or PNG,
// JPEG only at q85+), 8-24% of its area inked, with three visible tiers: heavy outlines, mid hatching,
// faint construction lines. Draw it with a heavy pen: at its display size the heavy tier should be 3 CSS
// px or more (4 is better), the hatching 2px or more and the construction lines about 2px; hairline art
// breaks into stipple dust on the wet front and reads timid. On a 2880-wide sheet shown 1440 wide that
// is about 8-9 / 4.5-5 / 4 units; a phone sheet of 1200 shown about 390 wide needs 11 / 6.5 / 6. Pen
// pressure (strokes that swell and taper) reads as a hand. The art must be same-origin or served with
// CORS (crossorigin="anonymous"): the canvas reads its pixels. Art too faint to order (under 3% of the
// area darker than mid grey), a tainted canvas or a failed decode all give the finished composition. Art
// denser than 35% is treated as a photograph (mode 'darkroom').
//
// The fit is read from the img's own CSS (object-fit, object-position) and copied exactly by the canvas.
// Defaults: contain at 50% 100% on desktop, cover at 50% 55% on a phone.
//
// Tokens (on the section or the page; the scene takes the page's look)
//   --pd-paper   the sheet           default var(--paper, var(--ground, #f3f3f0))
//   --pd-ink     the drawn line      default var(--ink, #141413)   (12:1 or better on the paper)
//   --pd-accent  the wet edge only   default var(--accent, #e5401a) (3:1 or better on the paper; never on text)
//   The scene reads these on start and on every theme change. When the ink is lighter than the paper (a
//   dark page) it adds the class pd-invert itself, so the finished img (reduced motion, rest, the read
//   hold) is shown inverted: dark art on a light sheet reads as light ink on the dark paper. A page that
//   must look right without script can put pd-invert on the section by hand.
//
// Options (data-options JSON)      default       range
//   mode         'ink'        'ink' (a drawing) | 'darkroom' (a photograph develops, shadows first)
//   hold         2.4          screens held on desktop, 1.6-3.5
//   phoneHold    1.8          screens held on a phone, 1.2-2.6
//   phone        'same'       'same' | 'rest' (the phone shows the finished composition)
//   sweep        'tl-down'    'tl-down' | 'down' | 'up' | 'right' | 'left' | 'radial'
//   focus        '50% 50%'    the origin of a radial sweep, on the art
//   inkWeight    0.40         0.25-0.60: higher is stricter darkest-first, lower a directional wipe
//   sweepWeight  0.42         0.20-0.60
//   coarse       0.13         0-0.20: strokes arrive in longer segments (above 0.2 it reads as a dissolve)
//   fine         0.015        0-0.06: pixel stipple on the front; kept low so the wet front reads as
//                             strokes, not pink dust (darkroom default 0.12)
//   edge         'accent'     'accent' (the wet edge; in darkroom a warm developer cast) | 'off'
//   band         0.10         0.04-0.16: width of the wet edge, in arrival order
//   strength     0.9          0.5-1: how much of the accent the newest marks carry
//   start        0.10         0.06-0.2: share of the order already on the sheet at progress 0 (never blank)
//   phoneStart   0.14         0.06-0.25: the same on a phone, where the sheet is small and needs more seed
//   scale        1.6          1-1.8: the camera's opening close-up; it pulls back to 1 as the drawing
//                             completes (power2.out, done at 0.70), clipped by the frame; 1 turns it off.
//                             The canvas is prepared for it (k x scale, within 1.25 MP; 0.5 MP on a phone)
//   zoomFocus    '30% 34%'    the point of the drawing the camera starts on, brought to the frame's
//                             middle: put it on the seed (with sweep 'tl-down', the upper left)
//   scrub        0.6          seconds of catch-up; true locks it to the scrollbar
//
// Progress map (desktop 1440x900, hold 2.4, ink mode; coverage = share of the final ink, measured on the
// demo; the camera's scale in brackets)
//   0          9%: the seed, broken heavy strokes of the upper sheet, mostly wet (vermilion), the oldest
//              already dried black, seen close (1.6) from just under the title to the lower frame; title
//              readable, note not shown; the section arrives showing this, never blank
//   0.10       24%: heavy outlines of the upper half, a quarter of the visible ink still wet (1.38)
//   0.25       46%: the heavy tier mostly in, hatching starting at the top, a vermilion front below; the
//              house still runs off the frame's right and lower edges (1.16)
//   0.40       67%: hatching filling downward (1.05)
//   0.50       81%: every outline in, hatching most of the way, first construction lines (1.01)
//   0.60       95%
//   0.64-0.70  the wet edge dries; complete at 0.70 (r 1.10): pure ink, scale 1, and the crisp img takes
//              over from the canvas (it hands back if the page scrolls up again)
//   0.70-0.88  the note rises line by line out of its masks (at 0.75: lines 1-3 at 14%, 38%, 80%)
//   0.88-1     a still read; the pin releases on the finished composition
// Phone (390x844, hold 1.8): 13% / 27% / 49% / 82% / 100% at 0 / 0.10 / 0.25 / 0.50 / 0.70, the same
// camera on the portrait sheet. Coverage follows r within about 2% on any suitable art (the order is
// equalised by ink).
//
// Cost: the art is prepared once per size after img.decode(), at idle (about 110-130ms at 1.25 MP for the
// demo's 20%-inked sheet on a busy test machine, 55ms on a phone; it scales with the inked pixels); a frame
// rewrites only the marks whose arrival order is inside the moving front and uploads only the dirty
// tiles of a 16x16 grid (about 1-4ms a frame). Nothing is drawn while the drawing stands still, and
// nothing at all once the img has taken over.
(() => {
  const Scenes = (window.Scenes = window.Scenes || {});
  const DRAW = 0.7;       // the drawing is complete here (r reaches its end)
  const DRY = [0.64, 0.7]; // the wet edge dries over this span
  const NOTE = 0.7;       // the note starts rising here
  const R_END = 1.1;      // 1 + the widest band, so no tint is ever left
  const RAMP = 0.035;     // a mark goes from nothing to full ink over this much order
  const TILES = 16;       // the canvas is uploaded in a 16x16 grid of tiles, only where marks changed
  const LITTLE = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const num = (v, d) => (v === null || v === undefined || v === '' || !Number.isFinite(+v) ? d : +v);
  const lum = (c) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
  // 'x% y%' -> [0-1, 0-1]
  const point = (s, d) => {
    const v = String(s || d).trim().split(/\s+/).map((p) => (Number.isFinite(parseFloat(p)) ? clamp(parseFloat(p) / 100) : 0.5));
    if (v.length < 2) v.push(v[0]);
    return v;
  };
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // seeded generator: the same noise on every visit
  const rng = (s) => () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  // any CSS colour to [r, g, b], through a 1px canvas (works for hex, rgb(), oklch(), color-mix()...)
  let probe = null;
  const rgbOf = (css, fallback) => {
    try {
      if (!probe) { const c = document.createElement('canvas'); c.width = c.height = 1; probe = c.getContext('2d', { willReadFrequently: true }); }
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = fallback; probe.fillStyle = css || fallback;
      probe.fillRect(0, 0, 1, 1);
      const d = probe.getImageData(0, 0, 1, 1).data;
      return [d[0], d[1], d[2]];
    } catch { return [20, 20, 19]; }
  };

  // one object-position component: a share of the free space (0-1) or a length in px
  const posPart = (s, free) => {
    s = (s || '').trim();
    if (s.endsWith('%')) return (free * parseFloat(s)) / 100;
    if (s.endsWith('px')) return parseFloat(s);
    return free / 2;
  };

  Scenes['picture-develops'] = (root, opts = {}) => {
    if (!root || !window.Stage) return null;
    const frame = root.querySelector('.pd-frame');
    const art = root.querySelector('.pd-art');
    const img = art && art.querySelector('img');
    const note = root.querySelector('.pd-note');
    const lowEnd = !!((navigator.connection && navigator.connection.saveData) || (navigator.deviceMemory && navigator.deviceMemory <= 2));
    if (!frame || !art || !img) return Stage.scene(root, { build: null });

    let mode = opts.mode === 'darkroom' ? 'darkroom' : 'ink';
    const dark0 = mode === 'darkroom';
    const hold = clamp(num(opts.hold, 2.4), 1.6, 3.5);
    const phoneHold = clamp(num(opts.phoneHold, 1.8), 1.2, 2.6);
    const sweep = ['tl-down', 'down', 'up', 'right', 'left', 'radial'].includes(opts.sweep) ? opts.sweep : 'tl-down';
    const focus = point(opts.focus, '50% 50%');
    const zoomAt = point(opts.zoomFocus, '30% 34%');
    const wInk = clamp(num(opts.inkWeight, dark0 ? 0.7 : 0.4), 0.25, 0.8);
    const wSweep = clamp(num(opts.sweepWeight, dark0 ? 0.18 : 0.42), 0.1, 0.6);
    const wCoarse = clamp(num(opts.coarse, dark0 ? 0 : 0.13), 0, 0.2);
    const wFine = clamp(num(opts.fine, dark0 ? 0.12 : 0.015), 0, 0.12);
    const edgeOn = opts.edge !== 'off';
    const band = clamp(num(opts.band, 0.1), 0.04, 0.16);
    const strength = clamp(num(opts.strength, 0.9), 0.5, 1);
    const startDesk = clamp(num(opts.start, 0.1), 0.06, 0.2);
    const startPhone = clamp(num(opts.phoneStart, Math.max(0.14, startDesk)), 0.06, 0.25);
    const scaleFrom = clamp(num(opts.scale, 1.6), 1, 1.8);
    const scrub = opts.scrub ?? 0.6;
    let R0 = startDesk;

    // ---- the canvas ----
    let canvas = art.querySelector('canvas.pd-canvas');
    if (!canvas) { canvas = document.createElement('canvas'); canvas.className = 'pd-canvas'; canvas.setAttribute('aria-hidden', 'true'); art.appendChild(canvas); }
    const g = canvas.getContext('2d');

    // ---- state ----
    let P = null;            // the prepared art
    let tl = null;           // the current timeline (desktop and phone each build their own)
    let live = false, phone = false, failed = false, drawn = false, done = false, dirty = true, mm = null;
    let lastR = -1, lastA = -1, prepToken = 0, prepTimer = 0;
    let inkRGB = [20, 20, 19], accRGB = [229, 64, 26], colourKey = '', invert = false, handOff = true;
    // the canvas's opacity for every darkness of the art (0-255), so a mark drawn in --pd-ink over
    // --pd-paper lands on the same tone the img shows there: the hand-over to the img is seamless
    const AL = new Float32Array(256);

    const readColours = () => {
      const cs = getComputedStyle(root);
      const ik = cs.getPropertyValue('--pd-ink').trim(), ac = cs.getPropertyValue('--pd-accent').trim(), pp = cs.getPropertyValue('--pd-paper').trim();
      const key = ik + '|' + ac + '|' + pp;
      if (key === colourKey) return false;
      colourKey = key;
      inkRGB = rgbOf(ik, '#141413');
      accRGB = rgbOf(ac, '#e5401a');
      const paper = rgbOf(pp, '#f3f3f0');
      const li = lum(inkRGB), lp = lum(paper);
      // light ink on dark paper: the finished img is shown inverted (derived, not a class to remember;
      // a photograph in darkroom mode is never inverted)
      invert = li > lp;
      root.classList.toggle('pd-invert', invert && mode === 'ink');
      // the img (inverted or not) shows grey art as its own tone; the canvas reaches that tone with this
      // opacity of the ink. Tokens too close to tell apart fall back to plain darkness.
      const span = invert ? li - lp : lp - li;
      for (let k = 0; k < 256; k++) {
        const d = k / 255;
        AL[k] = span < 0.2 ? d : clamp(invert ? (d - lp) / span : (lp - 1 + d) / span);
      }
      // the img can take over only when it looks like the canvas: a near-neutral ink at the dark (or,
      // inverted, the light) end. A coloured ink keeps the canvas to the end. (A darkroom print always
      // can: the canvas draws the photograph's own colours.)
      const chroma = Math.max(...inkRGB) - Math.min(...inkRGB);
      handOff = chroma < 28 && (invert ? li > 0.78 : li < 0.2);
      return true;
    };

    // where the scroll has the drawing: everything follows the timeline's own time (0-1)
    const now = () => (tl ? Math.min(1, tl.time()) : 0);
    const rAt = (t) => R0 + (R_END - R0) * clamp(t / DRAW);
    const accentAt = (t) => (t <= DRY[0] ? 1 : t >= DRY[1] ? 0 : 1 - (t - DRY[0]) / (DRY[1] - DRY[0]));

    // ---- the note, split into masked lines (re-split when its width or the fonts change) ----
    let lines = [], noteText = null, noteW = 0;
    const plainNote = note && !note.children.length;
    // a note with inline markup is not split (its links and emphasis stay as they are): it is wrapped
    // whole in one mask and rises as a block, so it never slides over the frame unclipped
    const wrapNote = () => {
      let inner = note.querySelector(':scope > .pd-line > .pd-line-in');
      if (!inner) {
        const outer = document.createElement('span');
        outer.className = 'pd-line';
        inner = document.createElement('span');
        inner.className = 'pd-line-in';
        while (note.firstChild) inner.appendChild(note.firstChild);
        outer.appendChild(inner);
        note.appendChild(outer);
      }
      inner.__y = null;
      lines = [inner];
    };
    const splitNote = () => {
      if (!note) { lines = []; return; }
      if (!plainNote) { wrapNote(); return; }
      if (noteText === null) noteText = note.textContent.trim();
      const words = noteText.split(/\s+/);
      note.innerHTML = words.map((w) => `<span class="pd-w">${esc(w)}</span>`).join(' ');
      const groups = [];
      let top = null;
      for (const w of note.querySelectorAll('.pd-w')) {
        const t = w.offsetTop;
        if (top === null || Math.abs(t - top) > 3) { groups.push([]); top = t; }
        groups[groups.length - 1].push(w.textContent);
      }
      note.innerHTML = groups.map((g) => `<span class="pd-line"><span class="pd-line-in">${esc(g.join(' '))}</span></span>`).join(' ');
      lines = [...note.querySelectorAll('.pd-line-in')];
      noteW = note.clientWidth;
      for (const l of lines) l.__y = null;
    };
    const unsplitNote = () => {
      if (note && plainNote && noteText !== null) note.textContent = noteText;
      if (note && !plainNote) {
        const outer = note.querySelector(':scope > .pd-line');
        const inner = outer && outer.firstElementChild;
        if (inner) { while (inner.firstChild) note.insertBefore(inner.firstChild, outer); outer.remove(); }
      }
      lines = [];
    };
    const applyNote = (t) => {
      const n = lines.length;
      if (!n) return;
      const st = n > 1 ? Math.min(0.02, 0.08 / (n - 1)) : 0;
      for (let i = 0; i < n; i++) {
        const p = clamp((t - NOTE - i * st) / 0.1);
        const e = 1 - (1 - p) * (1 - p) * (1 - p); // power3.out
        const y = Math.round((1 - e) * 1100) / 10;
        const el = lines[i];
        if (el.__y === y) continue;
        el.__y = y;
        el.style.transform = y ? `translate3d(0, ${y}%, 0)` : '';
        el.style.opacity = e >= 1 ? '' : e.toFixed(3);
      }
    };

    // ---- preparing the art: an arrival order for every inked pixel ----
    const measure = () => {
      const bw = art.offsetWidth, bh = art.offsetHeight;
      const iw = img.naturalWidth, ih = img.naturalHeight;
      if (!bw || !bh || !iw || !ih) return null;
      const cs = getComputedStyle(img);
      const fit = cs.objectFit || 'fill';
      let sx, sy;
      if (fit === 'fill') { sx = bw / iw; sy = bh / ih; }
      else {
        let s = fit === 'cover' ? Math.max(bw / iw, bh / ih) : fit === 'none' ? 1 : Math.min(bw / iw, bh / ih);
        if (fit === 'scale-down') s = Math.min(1, s);
        sx = sy = s;
      }
      const dw = iw * sx, dh = ih * sy;
      const pos = (cs.objectPosition || '50% 50%').split(/\s+(?![^(]*\))/);
      const dx = posPart(pos[0], bw - dw), dy = posPart(pos[1] || pos[0], bh - dh);
      // the canvas is prepared for the camera's closest view (k x the opening scale), within the size cap,
      // so the close-up strokes are drawn at their own resolution, not an upscaled raster
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5) * (zoom() ? scaleFrom : 1);
      const k = Math.min(dpr, 2400 / bw, Math.sqrt((phone ? 0.5e6 : 1.25e6) / (bw * bh)));
      return { bw, bh, k, W: Math.max(1, Math.round(bw * k)), H: Math.max(1, Math.round(bh * k)), dx, dy, dw, dh, src: img.currentSrc || img.src, fit, pos: cs.objectPosition, phone };
    };
    const keyOf = (m) => m && [m.W, m.H, Math.round(m.dx), Math.round(m.dy), Math.round(m.dw), Math.round(m.dh), m.src, m.phone].join('|');

    // the camera: it starts close on a point of the drawing (zoomFocus), brought to the middle of the
    // frame, and pulls back to the whole sheet. The point is the transform origin (so the scale grows
    // round it) and the pan carries it to the frame's centre; both are read again at every refresh.
    const zoom = () => scaleFrom > 1.001;
    let pan = [0, 0];
    const aim = (m = measure()) => {
      if (!zoom()) return;
      const bw = m ? m.bw : art.offsetWidth, bh = m ? m.bh : art.offsetHeight;
      // a point of the drawing as it is fitted in the box (a share of the box until the picture is in)
      const fx = m ? clamp(m.dx + zoomAt[0] * m.dw, 0, bw) : zoomAt[0] * bw;
      const fy = m ? clamp(m.dy + zoomAt[1] * m.dh, 0, bh) : zoomAt[1] * bh;
      art.style.transformOrigin = `${fx.toFixed(1)}px ${fy.toFixed(1)}px`;
      pan = [Math.round(bw / 2 - fx), Math.round(bh / 2 - fy)];
    };

    const prepare = (m) => {
      const { W, H, k } = m;
      const ax = m.dx * k, ay = m.dy * k, aw = m.dw * k, ah = m.dh * k;
      const off = document.createElement('canvas');
      off.width = W; off.height = H;
      const oc = off.getContext('2d', { willReadFrequently: true });
      oc.drawImage(img, ax, ay, aw, ah);
      const data = oc.getImageData(0, 0, W, H).data; // throws on a tainted canvas
      const N = W * H;
      const artArea = Math.max(1, Math.min(W, aw) * Math.min(H, ah));

      // darkness of every pixel, and the art check; the marks (ink 0.04 and up, or every pixel of a
      // photograph) are gathered once, and every later pass runs over them only
      const darkMode = mode === 'darkroom';
      const wp = darkMode ? 0.98 : 0.92, span = wp - (darkMode ? 0.05 : 0.18), cut = darkMode ? 0 : 0.04;
      // INKF orders the marks (darkness against the white point); DARK is the mark's own darkness against
      // pure white, which the canvas turns into the same tone the img shows (see AL)
      let CAND = new Uint32Array(N >> 2 || 1), INKF = new Float32Array(CAND.length), DARK = new Uint8Array(CAND.length);
      let count = 0, n04 = 0, n50 = 0;
      for (let i = 0, p = 0; i < N; i++, p += 4) {
        const a = data[p + 3];
        if (!a) continue;
        const L = (0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2]) / 255;
        let ink = (wp - L) / span;
        ink = ink < 0 ? 0 : ink > 1 ? 1 : ink;
        if (!darkMode) ink *= a / 255;
        if (ink >= 0.04) n04++;
        if (ink > 0.5) n50++;
        if (ink < cut) continue;
        if (count === CAND.length) {
          const n2 = Math.min(N, count * 2);
          const c2 = new Uint32Array(n2); c2.set(CAND); CAND = c2;
          const f2 = new Float32Array(n2); f2.set(INKF); INKF = f2;
          const k2 = new Uint8Array(n2); k2.set(DARK); DARK = k2;
        }
        CAND[count] = i; INKF[count] = ink; DARK[count] = ((1 - L) * a + 0.5) | 0; count++;
      }
      if (mode === 'ink') {
        if (n04 / artArea > 0.35) { mode = 'darkroom'; root.classList.remove('pd-invert'); return prepare(m); } // a photograph, not a drawing
        if (n50 / artArea < 0.03) throw new Error('art too faint to draw');
      }
      const dark = mode === 'darkroom';
      const wI = dark && opts.inkWeight == null ? 0.7 : wInk;
      const wS = dark && opts.sweepWeight == null ? 0.18 : wSweep;
      const wC = dark && opts.coarse == null ? 0 : wCoarse;
      const wF = dark && opts.fine == null ? 0.12 : wFine;
      const wSum = wI + wS + wC + wF;

      // coarse value noise on a lattice of 1/64 of the art's width (1/40 on a phone): strokes arrive in segments
      const cell = Math.max(4, aw / (m.phone ? 40 : 64));
      const cols = Math.ceil(W / cell) + 2, rows = Math.ceil(H / cell) + 2;
      const lat = new Float32Array(cols * rows);
      const rnd = rng(7);
      for (let i = 0; i < lat.length; i++) lat[i] = rnd();
      const fineCell = m.phone ? 1 : 2;
      const fx = focus[0], fy = focus[1];
      const rmax = Math.hypot(Math.max(fx, 1 - fx), Math.max(fy, 1 - fy)) || 1;

      // raw order, and its ink-weighted histogram
      const BINS = 1024;
      const hist = new Float64Array(BINS);
      const BIN = new Uint16Array(count);
      const sw0 = sweep === 'tl-down';
      for (let c = 0; c < count; c++) {
        const i = CAND[c], ink = INKF[c];
        const y = (i / W) | 0, x = i - y * W;
        let yn = (y + 0.5 - ay) / ah, xn = (x + 0.5 - ax) / aw;
        yn = yn < 0 ? 0 : yn > 1 ? 1 : yn; xn = xn < 0 ? 0 : xn > 1 ? 1 : xn;
        let sw;
        if (sw0) sw = 0.75 * yn + 0.25 * xn;
        else if (sweep === 'down') sw = yn;
        else if (sweep === 'up') sw = 1 - yn;
        else if (sweep === 'right') sw = xn;
        else if (sweep === 'left') sw = 1 - xn;
        else sw = Math.min(1, Math.hypot(xn - fx, yn - fy) / rmax);
        let co = 0;
        if (wC) {
          const cx = x / cell, ix = cx | 0, tx = cx - ix, sx = tx * tx * (3 - 2 * tx);
          const cy = y / cell, iy = cy | 0, ty = cy - iy, sy = ty * ty * (3 - 2 * ty);
          const o = iy * cols + ix;
          const a0 = lat[o] + (lat[o + 1] - lat[o]) * sx;
          const a1 = lat[o + cols] + (lat[o + cols + 1] - lat[o + cols]) * sx;
          co = a0 + (a1 - a0) * sy;
        }
        let fi = 0;
        if (wF) {
          const f1 = 0.06711056 * ((x / fineCell) | 0) + 0.00583715 * ((y / fineCell) | 0);
          const f2 = 52.9829189 * (f1 - Math.floor(f1));
          fi = f2 - Math.floor(f2);
        }
        const raw = (wI * (1 - ink) + wS * sw + wC * co + wF * fi) / wSum;
        const bin = Math.min(BINS - 1, (raw * BINS) | 0);
        BIN[c] = bin;
        hist[bin] += dark ? 1 : ink;
      }
      // equalise: the ink-weighted CDF makes coverage follow the scroll linearly on any art
      const cdf = new Uint8Array(BINS);
      let total = 0;
      for (let b = 0; b < BINS; b++) total += hist[b];
      for (let b = 0, acc = 0; b < BINS; b++) { acc += hist[b]; cdf[b] = Math.round((255 * acc) / (total || 1)); }

      // the marks, bucketed by arrival order (a counting sort), so a frame only touches the orders whose
      // look changed; and for each order the tiles of a 16x16 grid it touches, so a frame only uploads
      // the dirty tiles
      const start = new Uint32Array(257);
      for (let c = 0; c < count; c++) start[cdf[BIN[c]] + 1]++;
      for (let o = 0; o < 256; o++) start[o + 1] += start[o];
      const fill = start.slice(0, 256);
      const IDX = new Uint32Array(count);
      const INK = new Uint8Array(count);
      const SRC = dark ? new Uint32Array(count) : null;
      const d32 = dark ? new Uint32Array(data.buffer) : null;
      const tiles = new Uint16Array(256 * TILES); // per order: a mask of tile columns for each tile row
      for (let c = 0; c < count; c++) {
        const i = CAND[c], o = cdf[BIN[c]], j = fill[o]++;
        const y = (i / W) | 0, x = i - y * W;
        IDX[j] = i;
        INK[j] = DARK[c];
        if (dark) SRC[j] = d32[i];
        tiles[o * TILES + ((y * TILES) / H | 0)] |= 1 << ((x * TILES) / W | 0);
      }
      canvas.width = W; canvas.height = H;
      // the canvas keeps its own aspect when the box changes before the next preparation (a resize is
      // debounced): fitted like the img, never stretched
      canvas.style.objectFit = m.fit === 'cover' ? 'cover' : 'contain';
      canvas.style.objectPosition = m.pos || '';
      const out = g.createImageData(W, H);
      return { key: keyOf(m), W, H, IDX, INK, SRC, start, tiles, out, out32: new Uint32Array(out.data.buffer), row: new Uint32Array(256), dark };
    };

    // upload only the tiles the changed orders touch, merged into runs along each tile row
    const rowMask = new Uint16Array(TILES);
    const putDirty = (lo, hi) => {
      const { tiles, W, H, out } = P;
      rowMask.fill(0);
      for (let o = lo; o <= hi; o++) for (let ty = 0, b = o * TILES; ty < TILES; ty++) rowMask[ty] |= tiles[b + ty];
      let dirtyTiles = 0;
      for (let ty = 0; ty < TILES; ty++) for (let v = rowMask[ty]; v; v &= v - 1) dirtyTiles++;
      if (dirtyTiles > TILES * TILES * 0.6) { g.putImageData(out, 0, 0); return; } // most of it: one upload
      for (let ty = 0; ty < TILES; ty++) {
        const bits = rowMask[ty];
        if (!bits) continue;
        // rows with the same mask go up together
        let tb = ty;
        while (tb < TILES - 1 && rowMask[tb + 1] === bits) tb++;
        const y0 = Math.floor((ty * H) / TILES), y1 = Math.ceil(((tb + 1) * H) / TILES);
        ty = tb;
        for (let tx = 0; tx < TILES; tx++) {
          if (!(bits & (1 << tx))) continue;
          let te = tx;
          while (te < TILES - 1 && bits & (1 << (te + 1))) te++;
          const x0 = Math.floor((tx * W) / TILES), x1 = Math.ceil(((te + 1) * W) / TILES);
          g.putImageData(out, 0, 0, x0, y0, x1 - x0, y1 - y0);
          tx = te;
        }
      }
    };

    // ---- drawing a frame ----
    // once the drawing is complete (pure ink, scale 1) the crisp img takes over and the canvas is hidden;
    // scrolling back under 0.70 hands the stage back to the canvas in the same frame
    const setDone = (v) => {
      if (v === done) return;
      done = v;
      root.classList.toggle('pd-done', v);
    };
    const render = (force = false) => {
      if (!P || !live) return;
      const t = now(), r = rAt(t), acc = edgeOn ? accentAt(t) * strength : 0;
      setDone(t >= DRAW - 1e-4 && (handOff || P.dark));
      if (!force && Math.abs(r - lastR) < 0.0008 && Math.abs(acc - lastA) < 0.004) return;
      // the orders whose look changed since the last frame: those inside the moving front (ramp and wet
      // band) at either the old or the new position; everything before it is finished, everything after blank
      const full = force || lastR < 0;
      const w = Math.max(RAMP, edgeOn ? band : 0);
      const lo = full ? 0 : clamp(Math.floor(255 * (Math.min(r, lastR) - w)) - 1, 0, 255);
      const hi = full ? 255 : clamp(Math.ceil(255 * Math.max(r, lastR)) + 1, 0, 255);
      lastR = r; lastA = acc;
      const { IDX, INK, start, out32, row } = P;
      if (!P.dark) {
        for (let o = lo; o <= hi; o++) {
          const s = start[o], e = start[o + 1];
          if (s === e) continue;
          const d = r - o / 255;
          const al = d <= 0 ? 0 : d >= RAMP ? 1 : d / RAMP;
          if (!al) { for (let j = s; j < e; j++) out32[IDX[j]] = 0; continue; }
          // wet while the mark comes up and for as long again, then drying fast: a vivid front, not a
          // long brown fade
          let m = 0;
          if (acc && d < band) { const u = clamp((d - band * 0.5) / (band * 0.5)); m = acc * (1 - u * u * (3 - 2 * u)); }
          const cr = Math.round(inkRGB[0] + (accRGB[0] - inkRGB[0]) * m);
          const cg = Math.round(inkRGB[1] + (accRGB[1] - inkRGB[1]) * m);
          const cb = Math.round(inkRGB[2] + (accRGB[2] - inkRGB[2]) * m);
          // this order's colour at every darkness of the art, packed for the buffer's byte order
          const s255 = 255 * al;
          if (LITTLE) { const rgb = (cb << 16) | (cg << 8) | cr; for (let k = 0; k < 256; k++) row[k] = ((((AL[k] * s255 + 0.5) | 0) << 24) | rgb) >>> 0; }
          else { const rgb = ((cr << 24) | (cg << 16) | (cb << 8)) >>> 0; for (let k = 0; k < 256; k++) row[k] = (rgb | ((AL[k] * s255 + 0.5) | 0)) >>> 0; }
          for (let j = s; j < e; j++) out32[IDX[j]] = row[INK[j]];
        }
      } else {
        // darkroom: the print's own colour arrives by order at full strength; the newest marks carry a
        // warm developer cast that has cleared by the time they are fixed
        const SRC = P.SRC;
        const tr = 0x5a, tg = 0x3a, tb = 0x22;
        for (let o = lo; o <= hi; o++) {
          const s = start[o], e = start[o + 1];
          if (s === e) continue;
          const d = r - o / 255;
          const a = d <= 0 ? 0 : d >= RAMP ? 255 : Math.round((255 * d) / RAMP);
          if (!a) { for (let j = s; j < e; j++) out32[IDX[j]] = 0; continue; }
          const m = edgeOn && d < band ? 0.35 * (1 - d / band) : 0;
          for (let j = s; j < e; j++) {
            let px = SRC[j];
            if (m) {
              const c0 = LITTLE ? px & 255 : px >>> 24, c1 = LITTLE ? (px >>> 8) & 255 : (px >>> 16) & 255, c2 = LITTLE ? (px >>> 16) & 255 : (px >>> 8) & 255;
              const r0 = (c0 + (tr - c0) * m) | 0, g0 = (c1 + (tg - c1) * m) | 0, b0 = (c2 + (tb - c2) * m) | 0;
              px = LITTLE ? ((b0 << 16) | (g0 << 8) | r0) : (((r0 << 24) | (g0 << 16) | (b0 << 8)) >>> 0);
            } else px = LITTLE ? px & 0x00ffffff : px & 0xffffff00;
            out32[IDX[j]] = (LITTLE ? (a << 24) | px : px | a) >>> 0;
          }
        }
      }
      if (full) g.putImageData(P.out, 0, 0); else putDirty(lo, hi);
      if (!drawn) { drawn = true; root.classList.add('is-drawn'); }
    };

    // ---- failing gracefully: the finished composition, no hold ----
    const fail = () => {
      if (failed) return;
      failed = true;
      P = null;
      setDone(false);
      root.classList.remove('is-drawn');
      if (mm) mm.revert();
      root.classList.remove('is-live');
      root.classList.add('is-rest', 'pd-failed');
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    };

    // (re)prepare when the art box, the source or the device class changed; otherwise just redraw
    const requestPrep = () => {
      if (!live || failed) return;
      const token = ++prepToken;
      const go = () => {
        if (token !== prepToken || !live || failed) return;
        const m = measure();
        if (!m) return;
        aim(m);
        if (P && P.key === keyOf(m)) { render(true); return; }
        try {
          P = prepare(m);
          lastR = -1;
          render(true);
        } catch (e) { fail(); }
      };
      // the picture decodes before anything is drawn from it; a picture that never loads gives the rest state
      const ready = img.decode ? img.decode().catch(() => {}) : Promise.resolve();
      // the preparation is one ~50ms task: run it when the main thread is idle (or within 250ms)
      const soon = window.requestIdleCallback ? (f) => requestIdleCallback(f, { timeout: 250 }) : (f) => setTimeout(f, 16);
      ready.then(() => {
        if (img.naturalWidth) soon(go);
        else if (img.complete) fail();
        else img.addEventListener('error', fail, { once: true });
      });
    };

    const onUpdate = () => { dirty = true; applyNote(now()); };
    const tick = () => { if (dirty) { dirty = false; render(); } };

    const build = (timeline, ctx) => {
      tl = timeline;
      phone = ctx.phone;
      R0 = phone ? startPhone : startDesk;
      live = true;
      readColours();
      // the camera: close on the seed at 0, the whole sheet when the drawing completes (the frame clips it,
      // so nothing ever crosses the title band or the caption)
      if (zoom()) {
        aim(img.naturalWidth ? measure() : null);
        timeline.fromTo(art, { scale: scaleFrom, x: () => pan[0], y: () => pan[1] }, { scale: 1, x: 0, y: 0, duration: DRAW, ease: 'power2.out' }, 0);
      }
      timeline.eventCallback('onUpdate', onUpdate);
      splitNote();
      applyNote(0);
      dirty = true;
      requestPrep();
    };

    // the colours (and with them pd-invert) are read before anything shows, so the finished composition
    // of reduced motion or a phone at rest is right on a dark page too
    readColours();
    // a device that asks to save data, or has very little memory, gets the finished composition
    if (lowEnd) return Stage.scene(root, { build: null });

    mm = Stage.scene(root, {
      hold,
      scrub,
      build,
      phone: opts.phone === 'rest' ? 'rest' : { hold: phoneHold, build },
    });
    if (!mm) return null;

    gsap.ticker.add(tick);

    // leaving the live state (reduced motion switched on, a phone set to rest): give the page back its text
    new MutationObserver(() => {
      const isLive = root.classList.contains('is-live');
      if (isLive || !live) return;
      live = false; tl = null; drawn = false;
      setDone(false);
      root.classList.remove('is-drawn');
      art.style.transformOrigin = '';
      unsplitNote();
    }).observe(root, { attributes: true, attributeFilter: ['class'] });

    // resizes, late fonts, late pictures: re-split the note, re-aim the camera, re-prepare the art when its
    // box changed (meanwhile the canvas keeps its aspect: see prepare)
    // (the camera is aimed as a refresh begins, so the invalidated tween reads the new pan)
    ScrollTrigger.addEventListener('refreshInit', () => { if (live) aim(img.naturalWidth ? measure() : null); });
    ScrollTrigger.addEventListener('refresh', () => {
      if (!live) return;
      if (note && plainNote && note.clientWidth !== noteW) splitNote();
      applyNote(now());
      clearTimeout(prepTimer);
      prepTimer = setTimeout(requestPrep, P ? 200 : 0);
    });
    if (document.fonts && document.fonts.addEventListener) {
      document.fonts.addEventListener('loadingdone', () => { if (live && plainNote) { splitNote(); applyNote(now()); } });
    }
    img.addEventListener('load', () => { if (live) requestPrep(); });

    // theme switches recolour the marks without re-preparing. The page's <html> is watched for a theme
    // attribute, a class or an inline style, but not for the classes Lenis toggles at every scroll start
    // and stop (lenis-scrolling...): those would force a style read twice a gesture for nothing.
    const recolour = () => { if (readColours() && live) render(true); };
    const dm = window.matchMedia('(prefers-color-scheme: dark)');
    if (dm.addEventListener) dm.addEventListener('change', recolour);
    const html = document.documentElement;
    const themeish = (rec) => {
      if (rec.attributeName !== 'class') return true;
      const was = new Set((rec.oldValue || '').split(/\s+/).filter(Boolean)), is = new Set(html.className.split(/\s+/).filter(Boolean));
      for (const c of was) if (!is.has(c) && !c.startsWith('lenis')) return true;
      for (const c of is) if (!was.has(c) && !c.startsWith('lenis')) return true;
      return false;
    };
    new MutationObserver((recs) => { if (recs.some(themeish)) recolour(); })
      .observe(html, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'], attributeOldValue: true });

    return mm;
  };
})();
