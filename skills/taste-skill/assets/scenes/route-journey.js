// tasteskill / scenes / route-journey.js — "Route journey" (references/scenes.md).
//
// A traveller (a top-down vehicle drawn in SVG, or any cut-out) stays parked at one point of the screen
// while a tilted map slides, turns and leans under it along a route that draws itself in the accent.
// The camera cranes in from a flat, north-up overview of the whole trip to a heading-up chase at 52deg,
// stops at each stop with a slow swing and push-in while standing boards rise beside the road, the rail
// names the stop and a gauge counts a real unit, then cranes back to straight overhead while a wave of
// light sweeps the destination plot from its centre out, in perspective, and the plot settles lit.
// Use it when the story really is a trip with 3 to 5 stops (a delivery, a tour, a process told as a
// route); skip it for a plain list. Everything is derived from the scroll position, so scrolling back
// gives exactly the same frame.
//
// THE DOM. The finished composition is the source: the live 3D world is built from it at run time and
// removed again when the scene falls back (reduced motion, no script, a failed CDN, phone 'rest').
//
// <section class="scene route" data-scene="route-journey" data-options='{}' aria-labelledby="route-title">
//   <div class="scene-stage">
//     <header class="route-intro"><h2 id="route-title">…</h2><p class="route-lede">…</p></header>
//     <figure class="route-map">
//       <svg class="route-still" viewBox="<the route's box + 120>" data-map="<width> <height>" role="img" aria-label="…">
//         <defs>
//           <path id="route-geo" class="route-geo" d="M …"/>                         the route, in map px
//           <symbol id="route-vehicle" class="route-vehicle" viewBox="0 0 128 240" data-size="64 120">…</symbol>
//                 nose up; drawn at 2x and shown at data-size (map px). Parts classed .rv-beacon take the accent,
//                 .rv-outline a near-black rim (--route-vehicle-rim), so the pale parts never alias at tilt
//           <symbol id="route-mark" class="route-mark" viewBox="0 0 32 32">…</symbol>        optional
//         </defs>
//         <g id="route-scene" class="route-scene">          (the class lets the inset's <use> copy take the map colours)
//           <g class="route-art">  the map, in map px: shapes classed .rm-land (one sheet under all) .rm-water .rm-forest .rm-relief-1..3
//             .rm-field-a/b .rm-road .rm-lane .rm-house .rm-light (lit windows) .rm-river, <path class="route-road"
//             d="(the route)"/> and up to three <text class="route-word" transform="translate(x y) rotate(r) scale(1 1.6)">
//           </g>
//           <use href="#route-geo" class="route-still__trail"/>
//           <circle class="route-stop" cx="…" cy="…" r="22"/>   one per stop except the last (the plot)
//           <g class="route-still__plot">…</g>   <use href="#route-vehicle" …/>   (the still's finished state)
//         </g>
//       </svg>
//       <svg class="route-inset" viewBox="<the plot + 70>" aria-hidden="true"><use href="#route-scene"/></svg>  optional
//     </figure>
//     <aside class="route-rail" aria-label="Stops on the route">
//       <p class="route-gauge"><span class="route-gauge__label">Distance driven</span>
//         <span class="route-gauge__value"><b class="route-gauge__num">410</b> <span class="route-gauge__unit">km</span></span></p>
//       <ol class="route-steps">
//         <li class="route-step" data-value="0"><h3 class="route-step__title">…</h3>
//           <p class="route-step__body">…</p><p class="route-step__value">…</p></li>   3 to 5 of them (up to 12 work)
//       </ol>
//       <div class="route-arrive"><p class="route-arrive__line">…</p><a class="route-arrive__cta" href="…">…</a></div>
//     </aside>
//   </div>
// </section>
//
// THE ROUTE. One path in map px, 3000-4200 long, corner radii 160px or more (300 at the stops), the
// first leg heading up the map (within 30deg) and the last within 45deg, so the crane in and out never
// spins the world. Put the sharp turns at the stops, where the traveller is slow, and keep the legs
// between them straight or gently bent (radius 1000+): the heading-up camera turns with the road. End
// the path `plotGap` px short of where the plot's centre should be; the plot (grid x grid tiles) is
// placed on the route's end, along its last heading. Stops sit at the nearest point of the route to
// each .route-stop circle (in order); stops without one are spread evenly between their neighbours. Each step's data-value is the gauge reading at
// that stop, in one real unit. Draw the map well beyond the route's box: the chase looks about 2000 map
// px ahead and 1500 to the sides, so 2000 past the plot and the far bends. End the art in organic shapes
// (forest, fell, field patches), never a straight edge. Keep the top-left corner of the overview (left
// of the route's box, above its middle) quiet: the intro plate sits there at 0%. At night, set
// --route-light (lit windows, .rm-light) and --route-beam (the headlights) on the section.
//
// OPTIONS (data-options, all optional; defaults in brackets)
//   hold        screens held [1.6 + 0.8 x legs: 3 stops 3.2, 4 stops 4.0, 5 stops 4.8, never more than 5], 1-6
//   phoneHold   screens held on a phone [hold x 0.85]
//   phone       'same' [the same scene with phone numbers] | 'rest' (the finished composition)
//   scrub       seconds of catch-up [0.6], 0-1; locked to the bar when Lenis smooths the page
//   heading     'up' [the road ahead always points up the screen] | 'north' (north stays up)
//   tilt        camera tilt in the chase, degrees [52], 0-62; 0 is a flat map chase. phoneTilt [46]
//   zoom        chase zoom [1.25], 1-1.5. phoneZoom [0.9]
//   push        push-in at each stop [0.09], 0-0.12. phonePush [0.07]
//   arrive      zoom over the plot [2.0], 1.3-2.4, lowered by itself until the plot clears the rail and
//               the screen edges. phoneArrive [1.0]
//   orbit       degrees the camera swings at each stop [8], 0-12, towards the coming turn
//   smooth      heading smoothing window in map px [320], 160-400; bigger is calmer in bends
//   plotGap     map px from the route's end to the plot's centre [96]
//   grid        tiles a side of the destination plot [5], 3-7.  tile [56] and gap [10], map px
//   unit        gauge rounding: 'auto' [tens from 1000 up, else whole numbers] or a step such as 0.5
//   perspective stage perspective in px [1000 desktop, 900 compact, 760 phone], 600-2400
//
// LAYOUTS. Desktop (1100px and up): the traveller parked at (58vw, 66svh), intro top left, rail bottom
// left. Compact (768-1099px): traveller centred, intro across the top, rail along the bottom. Phone
// (767px and down): the same with phone numbers. The arrival zoom and the anchor height are trimmed on
// every refresh so the parked traveller and the lit plot never sit under a plate.
//
// TIMELINE (fractions of the hold): landing 0.05-0.13, crane in 0.09-0.18, legs 0.18-0.78 with 0.08
// dwells between them (each leg's time in proportion to its length, the last 0.02 longer; shorter dwells
// and smaller swings beyond 4 legs), crane out to overhead 0.74-0.88; the plot lights from its centre out
// 0.765-0.86 while the camera is still tilted, each tile flashing in the accent and rising into place;
// arrival copy 0.89-0.95, rest from 0.96. The camera never turns more than 36deg per 0.05 of progress.
//
// PERFORMANCE. The map rig is a plain 3D transform over flat layers (only the boards ride a preserve-3d
// rig), so the map is drawn straight to the screen, never through an offscreen surface. The map and the
// line layer keep one raster through the ride (will-change, in the CSS); a copy of the few hundred map px
// seen overhead rasters sharp for the end. The drawn trail adds a finished piece to the big line layer
// every 240 map px, while the piece being drawn lives in a small layer at the tip. Soft map fills skip edge
// anti-aliasing, the fog's solid strip hides the far map from the rasteriser, and the pin and plot pulses
// run only while the scene rests at its two ends.
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (p, start, dur) => clamp((p - start) / dur, 0, 1);
  const wrap180 = (a) => ((((a + 180) % 360) + 360) % 360) - 180;
  const el = (tag, cls, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; };
  const svgEl = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };

  const DEFAULTS = {
    phone: 'same', scrub: 0.6, heading: 'up', tilt: 52, phoneTilt: 46, zoom: 1.25, phoneZoom: 0.9,
    push: 0.09, phonePush: 0.07, arrive: 2.0, phoneArrive: 1.0, orbit: 8, smooth: 320, plotGap: 96,
    grid: 5, tile: 56, gap: 10, unit: 'auto',
  };

  window.Scenes = window.Scenes || {};
  window.Scenes['route-journey'] = (root, opts = {}) => {
    const o = { ...DEFAULTS, ...opts };
    const stops = root.querySelectorAll('.route-step').length;
    const legs = clamp(stops, 2, 12) - 1;
    const hold = clamp(o.hold ?? Math.min(5, 1.6 + 0.8 * legs), 1, 6);
    const phoneHold = o.phoneHold ?? +(hold * 0.85).toFixed(2);
    // without a route or with fewer than two stops there is no trip: show the finished composition
    if (stops < 2 || !root.querySelector('.route-still .route-geo')) {
      console.warn('route-journey: needs svg.route-still with a path.route-geo and two or more .route-step');
      return Stage.scene(root, { hold, build: null });
    }
    const build = (tl, ctx) => buildRoute(tl, ctx, root, o);
    return Stage.scene(root, {
      hold,
      scrub: Stage.lenis ? true : o.scrub,
      phone: o.phone === 'rest' ? 'rest' : { hold: phoneHold, build },
      build,
    });
  };

  function buildRoute(tl, ctx, root, o) {
    const { stage, phone } = ctx;
    if (root.__routeTeardown) root.__routeTeardown();
    const still = root.querySelector('.route-still');
    const geoSrc = still.querySelector('.route-geo');
    const [W, H] = (still.dataset.map || '2400 1800').split(/[\s,]+/).map(Number);
    const steps = [...root.querySelectorAll('.route-step')];
    const N = steps.length, legs = N - 1;
    const intro = root.querySelector('.route-intro');
    const rail = root.querySelector('.route-rail');
    const list = root.querySelector('.route-steps');
    const arriveLine = root.querySelector('.route-arrive__line');
    const arriveCta = root.querySelector('.route-arrive__cta');
    const gaugeNum = root.querySelector('.route-gauge__num');
    const gaugeFinal = gaugeNum ? gaugeNum.textContent : '';
    const values = steps.map((s, i) => { const v = parseFloat(s.dataset.value); return Number.isFinite(v) ? v : i; });
    const vehicle = root.querySelector('.route-vehicle');
    const mark = root.querySelector('.route-mark');
    // The camera's numbers per layout, picked again on every refresh. ax/ay: the anchor the traveller
    // is parked on; ox/oy and fit: the overview; zc/zp/za: chase, push-in and arrival zoom;
    // k: counter-scale numerator for pins and lines; kt: for the traveller (the hero at every zoom).
    // 'compact' (768-1099px: tablets, small laptops) centres the traveller over a rail along the bottom.
    const M = {};
    const compactMQ = window.matchMedia('(min-width: 768px) and (max-width: 1099px)');
    const pickMode = (vw, vh) => {
      if (phone) Object.assign(M, { ax: 0.5, ay: 0.52, persp: 760, tilt: o.phoneTilt, zc: o.phoneZoom, zp: o.phonePush, za: o.phoneArrive, ox: 0.5, oy: 0.64, fitW: vw - 64, fitH: 0.5 * vh, k: 0.9, kt: 0.9, tMax: 2.6, pMax: 2.6, below: true });
      else if (compactMQ.matches) Object.assign(M, { ax: 0.5, ay: 0.5, persp: 900, tilt: o.tilt, zc: o.zoom, zp: o.push, za: o.arrive, ox: 0.5, oy: 0.64, fitW: vw - 96, fitH: 0.5 * vh, k: 1.25, kt: 1.4, tMax: 2.4, pMax: 2.4, below: true });
      else Object.assign(M, { ax: 0.58, ay: 0.66, persp: 1000, tilt: o.tilt, zc: o.zoom, zp: o.push, za: o.arrive, ox: 0.64, oy: 0.54, fitW: 0.56 * vw, fitH: 0.72 * vh, k: 1.25, kt: 1.5, tMax: 2.4, pMax: 2.4, below: false });
      M.tilt = clamp(+M.tilt || 0, 0, 62);
      M.za = clamp(+M.za || 1, 0.3, 2.4);
      if (o.perspective) M.persp = clamp(+o.perspective, 600, 2400) * (phone ? 0.76 : 1);
    };

    // ---------- the live world, built from the finished composition ----------
    const made = [];
    const cam = el('div', 'route-cam'); cam.setAttribute('aria-hidden', 'true');
    const world = el('div', 'route-world', cam);
    world.style.width = W + 'px'; world.style.height = H + 'px';
    const flat = el('div', 'route-flat', world);
    const art = root.querySelector('.route-art');
    const ground = svgEl('svg', { class: 'route-ground', width: W, height: H, viewBox: `0 0 ${W} ${H}` }, flat);
    const cloneArt = (into) => { if (!art) return; const c = art.cloneNode(true); c.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id')); into.appendChild(c); };
    cloneArt(ground);
    // The map keeps one raster through the ride (will-change), which leaves it soft once the camera has
    // zoomed in over the plot. So the few hundred map px seen at the end get a copy of their own that
    // rasters at the final zoom; it shows only once the camera is overhead.
    const groundEnd = svgEl('svg', { class: 'route-ground route-ground--end' }, flat);
    cloneArt(groundEnd);
    // the dotted route ahead and the finished pieces of the trail, in their own layer above the map
    const lines = svgEl('svg', { class: 'route-lines', width: W, height: H, viewBox: `0 0 ${W} ${H}` }, flat);
    const d = geoSrc.getAttribute('d');
    svgEl('path', { class: 'route-ghost', d }, lines);
    const measurePath = svgEl('path', { d }, lines);
    if (!cam.parentNode) stage.insertBefore(cam, stage.firstChild);
    made.push(cam);
    // The standing boards ride a second camera with the same transform. Only that rig keeps preserve-3d:
    // a flat plane inside a 3D context makes the browser draw the whole map into an offscreen surface
    // every frame, while a plain 3D transform on a flat rig draws the map's tiles straight to the screen.
    const cam3 = el('div', 'route-cam route-cam--posts'); cam3.setAttribute('aria-hidden', 'true');
    const world3 = el('div', 'route-world', cam3);
    world3.style.width = W + 'px'; world3.style.height = H + 'px';
    stage.insertBefore(cam3, cam.nextSibling);
    made.push(cam3);

    // ---------- the route's lookup table (getPointAtLength is slow: never per frame) ----------
    const L = measurePath.getTotalLength();
    const STEP = 4;
    const n = Math.max(2, Math.ceil(L / STEP) + 1);
    const X = new Float32Array(n), Y = new Float32Array(n), HD = new Float32Array(n), HS = new Float32Array(n);
    for (let i = 0; i < n; i++) { const pt = measurePath.getPointAtLength(Math.min(L, i * STEP)); X[i] = pt.x; Y[i] = pt.y; }
    measurePath.remove();
    for (let i = 0; i < n; i++) {
      const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1);
      let h = (Math.atan2(Y[b] - Y[a], X[b] - X[a]) * 180) / Math.PI;
      if (i > 0) { while (h - HD[i - 1] > 180) h -= 360; while (h - HD[i - 1] < -180) h += 360; }
      HD[i] = h;
    }
    const win = Math.max(1, Math.round(clamp(+o.smooth || 320, 40, 600) / STEP / 2));
    const pre = new Float64Array(n + 1);
    for (let i = 0; i < n; i++) pre[i + 1] = pre[i] + HD[i];
    for (let i = 0; i < n; i++) { const a = Math.max(0, i - win), b = Math.min(n - 1, i + win); HS[i] = (pre[b + 1] - pre[a]) / (b - a + 1); }
    const sample = (s) => {
      const f = clamp(s, 0, L) / STEP; const i = Math.min(n - 2, Math.floor(f)); const t = f - i;
      return { x: lerp(X[i], X[i + 1], t), y: lerp(Y[i], Y[i + 1], t), h: lerp(HD[i], HD[i + 1], t), hs: lerp(HS[i], HS[i + 1], t) };
    };
    const nearestS = (x, y) => { let best = 0, bd = Infinity; for (let i = 0; i < n; i++) { const dd = (X[i] - x) ** 2 + (Y[i] - y) ** 2; if (dd < bd) { bd = dd; best = i; } } return Math.min(L, best * STEP); };

    // The drawn trail, in pieces of the same route. A finished piece shows in the big line layer (so that
    // layer repaints once per piece, not every frame); the piece being drawn lives in a small SVG of its
    // own that sits on the tip, so a frame only repaints that small layer.
    const CH = 240, chunks = [];
    for (let a = 0; a < L - 0.5; a += CH) {
      const i0 = Math.floor(a / STEP), i1 = Math.min(n - 1, Math.ceil(Math.min(L, a + CH) / STEP));
      let dd = `M${X[i0].toFixed(1)} ${Y[i0].toFixed(1)}`; let len = 0, x0 = X[i0], y0 = Y[i0], x1 = X[i0], y1 = Y[i0];
      for (let i = i0 + 1; i <= i1; i++) {
        dd += `L${X[i].toFixed(1)} ${Y[i].toFixed(1)}`; len += Math.hypot(X[i] - X[i - 1], Y[i] - Y[i - 1]);
        x0 = Math.min(x0, X[i]); x1 = Math.max(x1, X[i]); y0 = Math.min(y0, Y[i]); y1 = Math.max(y1, Y[i]);
      }
      const pc = svgEl('path', { class: 'route-trail', d: dd }, lines);
      pc.style.visibility = 'hidden';
      chunks.push({ el: pc, a: i0 * STEP, b: i0 * STEP + len, len, d: dd, box: [x0, y0, x1, y1], done: false });
    }
    const tipPad = 40;
    const tip = svgEl('svg', { class: 'route-tip', 'aria-hidden': 'true' }, flat);
    const tipPath = svgEl('path', { class: 'route-trail' }, tip);
    let tipChunk = -1, tipShown = '';
    const setTip = (k) => {
      tipChunk = k; tipShown = '';
      if (k < 0) { tip.style.visibility = 'hidden'; return; }
      const c = chunks[k], [x0, y0, x1, y1] = c.box;
      const w = x1 - x0 + 2 * tipPad, h = y1 - y0 + 2 * tipPad;
      tip.setAttribute('width', w.toFixed(0)); tip.setAttribute('height', h.toFixed(0));
      tip.setAttribute('viewBox', `${(x0 - tipPad).toFixed(1)} ${(y0 - tipPad).toFixed(1)} ${w.toFixed(0)} ${h.toFixed(0)}`);
      tip.style.transform = `translate3d(${(x0 - tipPad).toFixed(1)}px,${(y0 - tipPad).toFixed(1)}px,0)`;
      tipPath.setAttribute('d', c.d);
      tipPath.style.strokeDasharray = `${c.len.toFixed(1)} ${(c.len + 10).toFixed(1)}`;
      tip.style.visibility = 'visible';
    };
    setTip(-1);

    // stops: the .route-stop circles in the still (in order); stops without a circle are spread evenly
    // between their neighbours; the first stop is the route's start and the last its end
    const circles = [...still.querySelectorAll('.route-stop')];
    const known = steps.map((_, k) => {
      if (k === 0) return 0;
      if (k === N - 1) return L;
      const c = circles[k];
      return c ? nearestS(+c.getAttribute('cx'), +c.getAttribute('cy')) : null;
    });
    for (let k = 1; k < N - 1; k++) if (known[k] != null && known[k] <= known[k - 1]) known[k] = null; // out of order: spread it
    const stopS = known.slice();
    for (let k = 1; k < N - 1; k++) {
      if (stopS[k] != null) continue;
      let j = k + 1; while (stopS[j] == null) j++;
      const a = stopS[k - 1], b = stopS[j];
      for (let m = k; m < j; m++) stopS[m] = a + ((b - a) * (m - k + 1)) / (j - k + 1);
    }
    for (let k = 1; k < N; k++) stopS[k] = Math.max(stopS[k], stopS[k - 1] + 1);

    // the destination plot, on the route's end along its last heading
    const end = sample(L);
    const gap = +o.plotGap || 96;
    const plotC = { x: end.x + Math.cos((end.h * Math.PI) / 180) * gap, y: end.y + Math.sin((end.h * Math.PI) / 180) * gap };
    const G = clamp(Math.round(+o.grid || 5), 3, 7), TS = +o.tile || 56, TG = +o.gap || 10;
    const plotSize = G * TS + (G - 1) * TG;
    const plot = el('div', 'route-plot', flat);
    plot.style.cssText = `left:${plotC.x - plotSize / 2}px;top:${plotC.y - plotSize / 2}px;width:${plotSize}px;height:${plotSize}px;--tile:${TS}px;--gap:${TG}px;--grid:${G}`;
    const tiles = [];
    const mid = (G - 1) / 2;
    let maxDist = 0;
    for (let r = 0; r < G; r++) for (let c = 0; c < G; c++) {
      const t = el('i', 'route-tile', plot);
      const lit = el('i', 'route-tile__lit', t);
      const flash = el('i', 'route-tile__flash', t);
      const dist = Math.hypot(r - mid, c - mid);
      maxDist = Math.max(maxDist, dist);
      // the plot settles as a pool of light: each ring out from the centre a step dimmer (flat steps)
      const ringN = Math.max(Math.abs(r - mid), Math.abs(c - mid));
      tiles.push({ t, lit, flash, dist, glow: 1 - (0.3 * ringN) / Math.max(1, mid), centre: r === mid && c === mid });
    }
    const centre = tiles.find((t) => t.centre) || tiles[Math.floor(tiles.length / 2)];
    centre.t.classList.add('route-tile--centre');
    const centreFill = el('i', 'route-tile__accent', centre.t);
    let markEl = null;
    if (mark && mark.id) {
      markEl = svgEl('svg', { class: 'route-tile__mark', viewBox: mark.getAttribute('viewBox') || '0 0 32 32' }, centre.t);
      svgEl('use', { href: '#' + mark.id }, markEl);
    }
    for (let i = 0; i < 3; i++) el('i', 'route-plot__ring', plot);

    // pins: one per stop; the last sits on the plot's centre tile
    const pins = steps.map((_, k) => {
      const p = k === N - 1 ? plotC : sample(stopS[k]);
      const pin = el('div', 'route-pin', flat);
      pin.style.left = p.x + 'px'; pin.style.top = p.y + 'px';
      const inner = el('div', 'route-pin__inner', pin);
      for (let i = 0; i < (phone ? 2 : 3); i++) el('i', 'route-pin__ring', inner);
      el('b', 'route-pin__dot', inner);
      return inner;
    });
    pins[N - 1].parentNode.classList.add('route-pin--end');

    // the traveller: its headlights on the road ahead (only where --route-beam is set), the shade it casts
    // while it drops in, the landing ring and the drawn vehicle (a <symbol>, nose up)
    const trav = el('div', 'route-traveller', flat);
    const vb = (vehicle && vehicle.getAttribute('viewBox') || '0 0 64 120').split(/[\s,]+/).map(Number);
    const size = (vehicle && vehicle.dataset.size || '').split(/[\s,]+/).map(Number);
    const TW = size[0] || vb[2] || 64, TH = size[1] || vb[3] || 120;
    trav.style.cssText = `width:${TW}px;height:${TH}px;margin:${-TH / 2}px 0 0 ${-TW / 2}px`;
    // headlights: nested flat pools that step down in strength with distance (no gradient), rounded ahead
    const beam = svgEl('svg', { class: 'route-traveller__beam', viewBox: `0 0 ${TW} ${TH}`, width: TW, height: TH }, trav);
    const bx = TW / 2, ny = TH * 0.03;
    for (const [w0, w1, len] of [[0.36, 1.25, 1.9], [0.34, 0.95, 1.45], [0.32, 0.7, 1.0], [0.3, 0.5, 0.6]]) {
      const x0 = TW * w0, x1 = TW * w1, y1 = ny - TH * len;
      svgEl('path', { d: `M${bx - x0} ${ny}L${bx - x1} ${y1 + x1 * 0.35}Q${bx} ${y1 - x1 * 0.25} ${bx + x1} ${y1 + x1 * 0.35}L${bx + x0} ${ny}Z` }, beam);
    }
    const drop = el('i', 'route-traveller__drop', trav);
    const land = el('i', 'route-traveller__land', trav);
    const body = svgEl('svg', { class: 'route-traveller__body', viewBox: vb.join(' '), width: TW, height: TH }, trav);
    if (vehicle && vehicle.id) svgEl('use', { href: '#' + vehicle.id }, body);
    else svgEl('path', { d: `M${vb[2] / 2} 0 L${vb[2]} ${vb[3]} L${vb[2] / 2} ${vb[3] * 0.78} L0 ${vb[3]}Z`, class: 'route-traveller__chevron' }, body);

    // posts: standing boards for the stops between the first and the last, on the outside of the bend.
    // On short legs (many stops) they stand further out and rise later, so one board is down before the
    // next one rises; the board's plate reaches away from the road, never over the traveller.
    const postsEl = el('div', 'route-posts', world3);
    const posts = [];
    for (let k = 1; k < N - 1; k++) {
      const a = sample(stopS[k]), b0 = sample(Math.max(0, stopS[k] - 120)), b1 = sample(Math.min(L, stopS[k] + 120));
      const legIn = stopS[k] - stopS[k - 1], legOut = stopS[k + 1] - stopS[k];
      const turn = b1.h - b0.h; // > 0 turns right (clockwise on screen)
      const side = turn > 0 ? -1 : 1; // outside of the bend: +1 is right of the road, -1 left
      const off = 56 + 34 * clamp((900 - Math.min(legIn, legOut)) / 500, 0, 1);
      const hr = ((a.h + 90 * side) * Math.PI) / 180;
      const post = el('div', 'route-post', postsEl);
      post.style.left = a.x + Math.cos(hr) * off + 'px'; post.style.top = a.y + Math.sin(hr) * off + 'px';
      const inner = el('div', 'route-post__inner', post);
      if (o.heading !== 'north') inner.classList.add(side > 0 ? 'route-post__inner--right' : 'route-post__inner--left');
      el('span', 'route-post__stem', inner);
      const tile = el('span', 'route-post__tile', inner);
      const title = steps[k].querySelector('.route-step__title');
      tile.textContent = title ? title.textContent.trim() : '';
      posts.push({ inner, s: stopS[k], lead: Math.min(480, 0.55 * legIn), rise: Math.min(200, 0.3 * legIn), tail: Math.min(200, 0.35 * legOut), shown: null });
    }

    // fog over the far plane: a solid strip of the ground colour, then flat bands that step down (no
    // gradient). It slides down from above the screen as the camera tilts and back up as it straightens.
    const fog = el('div', 'route-fog'); fog.setAttribute('aria-hidden', 'true');
    el('i', 'route-fog__solid', fog);
    const FOG = [0.9, 0.76, 0.62, 0.48, 0.36, 0.25, 0.15, 0.07];
    FOG.forEach((a) => { const b = el('i', '', fog); b.style.opacity = a; });
    // the fog lies over the far map but under the boards: a board is near, so it stands in front of the haze
    stage.insertBefore(fog, cam3);
    made.push(fog);

    // the rail: a count line and the leg bars (both decorative; the list itself stays the content)
    const count = el('p', 'route-count'); count.setAttribute('aria-hidden', 'true');
    if (list) list.parentNode.insertBefore(count, list);
    made.push(count);
    const legBar = el('span', 'route-legs'); legBar.setAttribute('aria-hidden', 'true');
    const legFills = [];
    for (let k = 0; k < legs; k++) { const sgm = el('span', 'route-legs__leg', legBar); legFills.push(el('i', '', sgm)); }
    const gauge = root.querySelector('.route-gauge');
    if (gauge) gauge.appendChild(legBar);
    made.push(legBar);
    if (list) list.style.setProperty('--n', N);

    // ---------- timing (fractions of the scene) ----------
    const DWELL = Math.min(0.08, 0.24 / Math.max(1, legs - 1)); // 0.08 up to 4 legs, shorter beyond
    const travel = 0.6 - DWELL * (legs - 1);
    const extra = legs > 1 ? 0.02 : 0;
    // each leg gets travel time in proportion to its length, so the traveller keeps one cruising speed
    // (and the camera one turning rate) however unevenly the stops are spaced; the last leg gets a
    // little more for the braking under the crane out
    const legDur = [], legStart = [], dwellStart = [];
    for (let k = 0; k < legs; k++) legDur.push(((travel - extra) * (stopS[k + 1] - stopS[k])) / L + (k === legs - 1 ? extra : 0));
    let t0 = 0.18;
    for (let k = 0; k < legs; k++) {
      legStart.push(t0); t0 += legDur[k];
      if (k < legs - 1) { dwellStart.push(t0); t0 += DWELL; }
    }
    // at each stop the camera swings the way the road is about to turn, then eases back as the leg
    // starts, so the swing takes some of the turn instead of adding to it (alternates on a straight)
    const orbitSign = dwellStart.map((_, k) => {
      const at = stopS[k + 1], dh = sample(Math.min(L, at + 240)).hs - sample(at).hs;
      return Math.abs(dh) < 4 ? (k % 2 ? -1 : 1) : dh > 0 ? -1 : 1;
    });
    // the swing at each stop shrinks with the dwell when there are many stops (short dwells would whip)
    const orbitDeg = clamp(+o.orbit || 0, 0, 12) * Math.min(1, DWELL / 0.08);
    const E = (name) => gsap.parseEase(name);
    const e = { p2io: E('power2.inOut'), p1io: E('power1.inOut'), sio: E('sine.inOut'), p2i: E('power2.in'), p2o: E('power2.out'), p3o: E('power3.out'), p1o: E('power1.out'), xo: E('expo.out') };
    const unitStep = o.unit === 'auto' || o.unit == null ? (Math.max(...values.map(Math.abs)) >= 1000 ? 10 : 1) : Math.max(0.001, +o.unit);
    const fmt = new Intl.NumberFormat(document.documentElement.lang || undefined, { maximumFractionDigits: unitStep < 1 ? String(unitStep).split('.')[1].length : 0 });
    // the arrival: the light sweeps the plot from its centre out while the camera is still tilted
    const LIGHT0 = 0.765, LIGHT_SPREAD = 0.06, LIGHT_DUR = 0.035;

    // ---------- measuring (on build and on every refresh) ----------
    let vw = 1, vh = 1, z0 = 0.4, bbox = null;
    {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (let i = 0; i < n; i++) { x0 = Math.min(x0, X[i]); x1 = Math.max(x1, X[i]); y0 = Math.min(y0, Y[i]); y1 = Math.max(y1, Y[i]); }
      x0 = Math.min(x0, plotC.x - plotSize / 2); x1 = Math.max(x1, plotC.x + plotSize / 2);
      y0 = Math.min(y0, plotC.y - plotSize / 2); y1 = Math.max(y1, plotC.y + plotSize / 2);
      bbox = { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 };
    }
    const measure = () => {
      vw = stage.clientWidth || innerWidth; vh = stage.clientHeight || innerHeight;
      pickMode(vw, vh);
      z0 = Math.min(M.fitW / bbox.w, M.fitH / bbox.h);
      // keep the parked traveller and the lit plot clear of the rail plate and inside the screen,
      // whatever the window (the plot spans gap + half its size above the anchor, the rest below)
      const plotUp = plotSize / 2 + gap, plotDown = Math.max(plotSize / 2 - gap, TH / 2);
      M.za = Math.min(M.za, (vw - 32) / plotSize);
      if (rail) {
        const top = rail.offsetTop, right = rail.offsetLeft + rail.offsetWidth;
        if (M.below) {
          M.za = Math.min(M.za, (top - 32) / (plotUp + plotDown));
          M.ay = Math.min(M.ay, (top - 16 - plotDown * Math.max(M.za, M.zc)) / vh);
          M.za = Math.max(0.3, Math.min(M.za, (M.ay * vh - 16) / plotUp));
        } else {
          M.za = Math.max(0.3, Math.min(M.za, (M.ax * vw - right - 24) / (plotSize / 2), (vw - M.ax * vw - 24) / (plotSize / 2), (M.ay * vh - 24) / plotUp, (vh - 16 - M.ay * vh) / plotDown));
        }
      }
      // the copy of the map for the end: what the overhead camera sees, plus a margin
      const ex0 = end.x - (M.ax * vw) / M.za - 80, ey0 = end.y - (M.ay * vh) / M.za - 80;
      const ew = vw / M.za + 160, eh = vh / M.za + 160;
      for (const [k, v] of [['width', ew.toFixed(0)], ['height', eh.toFixed(0)], ['viewBox', `${ex0.toFixed(0)} ${ey0.toFixed(0)} ${ew.toFixed(0)} ${eh.toFixed(0)}`]]) groundEnd.setAttribute(k, v);
      groundEnd.style.transform = `translate3d(${ex0.toFixed(0)}px,${ey0.toFixed(0)}px,0)`;
      stage.style.setProperty('--route-persp', M.persp + 'px');
      stage.style.setProperty('--route-ax', M.ax * 100 + '%');
      stage.style.setProperty('--route-ay', M.ay * 100 + '%');
    };

    // ---------- render: everything from the timeline's progress ----------
    const state = { p: 0 };
    const cache = new Map();
    const put = (node, prop, val) => { let c = cache.get(node); if (!c) cache.set(node, (c = {})); if (c[prop] !== val) { c[prop] = val; node.style[prop] = val; } };
    const flag = (node, cls, on) => { const k = 'class:' + cls; let c = cache.get(node); if (!c) cache.set(node, (c = {})); if (c[k] !== on) { c[k] = on; node.classList.toggle(cls, on); } };
    let active = -1, lastGauge = null, lastLw = null;

    // distance along the route at progress q
    const sAt = (q) => {
      let u = 0; for (let k = 0; k < legs; k++) u += e.p1io(seg(q, legStart[k], legDur[k]));
      const kk = Math.min(legs - 1, Math.floor(u));
      return u >= legs ? L : lerp(stopS[kk], stopS[kk + 1], u - kk);
    };
    // The camera's heading is the road's (smoothed) heading averaged over a window of progress with a
    // triangle weight, so a bend the traveller takes at speed is spread over the slower moments around
    // it (the braking, the dwell). The window starts at +-0.06 and widens (to +-0.12 at most) until the
    // camera turns no more than 36deg per 0.05 of progress, whatever the route and the stops. It is a
    // table of progress, built once, so scrolling back gives the same frame.
    const NP = 400, rawH = new Float64Array(NP + 1);
    for (let i = 0; i <= NP; i++) rawH[i] = sample(sAt(i / NP)).hs;
    const smoothH = (w) => {
      const out = new Float64Array(NP + 1), r = Math.max(1, Math.round(w * NP));
      for (let i = 0; i <= NP; i++) {
        let hsum = 0, wsum = 0;
        for (let j = -r; j <= r; j++) { const wt = r + 1 - Math.abs(j); hsum += rawH[clamp(i + j, 0, NP)] * wt; wsum += wt; }
        out[i] = hsum / wsum;
      }
      return out;
    };
    const turnRate = (a) => { let m = 0; const dn = Math.round(0.05 * NP); for (let i = Math.round(0.12 * NP); i + dn <= Math.round(0.82 * NP); i++) for (let j = i + 1; j <= i + dn; j++) m = Math.max(m, Math.abs(a[j] - a[i])); return m; };
    let HP = null;
    for (const w of [0.06, 0.075, 0.09, 0.105, 0.12]) { HP = smoothH(w); if (turnRate(HP) <= 36) break; }
    const headingAt = (p) => { const f = clamp(p, 0, 1) * NP, i = Math.min(NP - 1, Math.floor(f)); return lerp(HP[i], HP[i + 1], f - i); };

    const render = () => {
      const p = state.p;
      // camera
      const cin = e.p2io(seg(p, 0.09, 0.09));
      const cout = e.p2io(seg(p, 0.74, 0.14));
      const s = sAt(p);
      let orbit = 0, push = 0;
      for (let k = 0; k < dwellStart.length; k++) {
        const a = e.sio(seg(p, dwellStart[k], DWELL)) - e.sio(seg(p, legStart[k + 1], Math.min(0.06, legDur[k + 1])));
        orbit += orbitSign[k] * orbitDeg * a; push += a;
      }
      const P = sample(s);
      const C0x = bbox.cx + ((M.ax - M.ox) * vw) / z0, C0y = bbox.cy + ((M.ay - M.oy) * vh) / z0;
      const Cx = lerp(C0x, P.x, cin), Cy = lerp(C0y, P.y, cin);
      const yawMix = o.heading === 'north' ? 0 : cin * (1 - cout);
      const yaw = yawMix > 0 ? wrap180(-(headingAt(p) + 90)) * yawMix + orbit : orbit;
      const tilt = M.tilt * cin * (1 - cout);
      const zoom = lerp(lerp(z0, M.zc, cin) + push * M.zp, M.za, cout);
      const camT = `rotateX(${tilt.toFixed(3)}deg) rotateZ(${yaw.toFixed(3)}deg) scale3d(${zoom.toFixed(4)},${zoom.toFixed(4)},${zoom.toFixed(4)})`;
      const worldT = `translate3d(${(-Cx).toFixed(2)}px,${(-Cy).toFixed(2)}px,0)`;
      cam.style.transform = camT; world.style.transform = worldT;
      // raster lock (see the CSS): the lines drop it once the camera is overhead, so they re-raster sharp
      flag(cam, 'is-ride', p < 0.85);
      put(groundEnd, 'visibility', p >= 0.85 ? 'visible' : 'hidden');
      const postsOn = tilt > 10 && posts.length > 0;
      put(cam3, 'visibility', postsOn ? 'visible' : 'hidden');
      if (postsOn) { cam3.style.transform = camT; world3.style.transform = worldT; }
      // traveller: on the route point, nose along the true heading (it leans into bends)
      const ts = lerp(clamp(M.kt / zoom, 1, M.tMax), 1, cout); // true size over the plot, so it parks on it exactly
      trav.style.transform = `translate3d(${P.x.toFixed(2)}px,${P.y.toFixed(2)}px,0) rotate(${(P.h + 90).toFixed(2)}deg) scale(${ts.toFixed(3)})`;
      const land1 = e.xo(seg(p, 0.05, 0.05));
      put(body, 'transform', `scale(${(3 - 2 * land1).toFixed(3)})`);
      put(body, 'opacity', e.p1o(seg(p, 0.05, 0.02)).toFixed(3));
      // the shade exists only while it is in the air: it slides in under the body and is gone at touchdown
      put(drop, 'transform', `translate3d(${(28 * (1 - land1)).toFixed(2)}px,${(40 * (1 - land1)).toFixed(2)}px,0)`);
      put(drop, 'opacity', (0.32 * Math.sin(Math.PI * land1)).toFixed(3));
      const ring = p < 0.08 ? 0 : e.p2o(seg(p, 0.08, 0.05));
      put(land, 'transform', `scale(${(0.4 + 2.2 * ring).toFixed(3)})`);
      put(land, 'opacity', p < 0.08 || ring >= 1 ? '0' : (0.7 * (1 - ring)).toFixed(3));
      // headlights: on through the chase, off as the truck pulls onto the plot
      const bm = e.p2io(seg(p, 0.11, 0.06)) * (1 - e.p2io(seg(p, 0.8, 0.07)));
      put(beam, 'opacity', bm.toFixed(3));
      put(beam, 'visibility', bm <= 0 ? 'hidden' : 'visible');
      // pins keep their size in the overview
      const ps = clamp(M.k / zoom, 1, M.pMax).toFixed(3);
      for (const pin of pins) put(pin, 'transform', `scale(${ps})`);
      // trail (the lines keep a readable width in the overview)
      const lw = (Math.round(clamp(M.k / zoom, 1, 2.6) * 4) / 4).toFixed(2); // in steps, so the lines repaint rarely
      if (lw !== lastLw) { lastLw = lw; lines.style.setProperty('--lw', lw); tip.style.setProperty('--lw', lw); }
      let tipK = -1;
      for (let k = 0; k < chunks.length; k++) {
        const c = chunks[k], done = s >= c.b - 0.05;
        if (done !== c.done) { c.done = done; c.el.style.visibility = done ? 'visible' : 'hidden'; }
        if (!done && s > c.a && tipK < 0) tipK = k;
      }
      if (tipK !== tipChunk) setTip(tipK);
      if (tipK >= 0) {
        const c = chunks[tipK], v = clamp(s - c.a, 0, c.len), r = (c.len - v).toFixed(1);
        if (r !== tipShown) { tipShown = r; tipPath.style.strokeDashoffset = r; }
      }
      // boards: up shortly before their stop, down again once the traveller has left it
      const vis = clamp((tilt - 10) / 15, 0, 1);
      for (const post of posts) {
        let pop = clamp((s - (post.s - post.lead)) / post.rise, 0, 1) - clamp((s - (post.s + 40)) / post.tail, 0, 1);
        pop = 1 - (1 - pop) * (1 - pop);
        const sc = pop * vis, shown = sc > 0.001;
        if (shown !== post.shown) { post.shown = shown; post.inner.style.visibility = shown ? 'visible' : 'hidden'; }
        if (!shown) continue;
        post.inner.style.transform = `rotateZ(${(-yaw).toFixed(3)}deg) rotateX(${(-tilt).toFixed(3)}deg) scaleY(${sc.toFixed(3)})`;
        put(post.inner, 'opacity', clamp((sc - 0.25) / 0.35, 0, 1).toFixed(3)); // no sliver while it is nearly flat
      }
      // plates and fog (faded text stays in the page for screen readers; the arrival line and button are
      // hidden until they show, and the stops once the arrival has replaced them)
      const io = e.p2i(seg(p, 0.09, 0.05));
      if (intro) { put(intro, 'opacity', (1 - io).toFixed(3)); put(intro, 'transform', `translate3d(0,${(-32 * io).toFixed(2)}px,0)`); }
      const fg = e.p2io(seg(p, 0.1, 0.08)) - e.p2io(seg(p, 0.8, 0.08));
      put(fog, 'transform', `translate3d(0,${(-(1 - fg) * 102).toFixed(2)}%,0)`);
      put(fog, 'visibility', fg <= 0 ? 'hidden' : 'visible');
      const ri = e.p3o(seg(p, 0.12, 0.06));
      if (rail) { put(rail, 'opacity', ri.toFixed(3)); put(rail, 'transform', `translate3d(0,${(40 * (1 - ri)).toFixed(2)}px,0)`); }
      const so = e.p2i(seg(p, 0.86, 0.04));
      for (const node of [list, count]) if (node) { put(node, 'opacity', (1 - so).toFixed(3)); put(node, 'transform', `translate3d(0,${(-16 * so).toFixed(2)}px,0)`); put(node, 'visibility', so >= 1 ? 'hidden' : 'visible'); }
      const al = e.p3o(seg(p, 0.89, 0.05)), ac = e.p3o(seg(p, 0.91, 0.04));
      if (arriveLine) { put(arriveLine, 'opacity', al.toFixed(3)); put(arriveLine, 'transform', `translate3d(0,${(24 * (1 - al)).toFixed(2)}px,0)`); put(arriveLine, 'visibility', al <= 0 ? 'hidden' : 'visible'); }
      if (arriveCta) { put(arriveCta, 'opacity', ac.toFixed(3)); put(arriveCta, 'transform', `translate3d(0,${(24 * (1 - ac)).toFixed(2)}px,0)`); put(arriveCta, 'visibility', ac <= 0 ? 'hidden' : 'visible'); }
      // the plot: a wave of light runs out from the centre tile while the camera is still tilted; each
      // tile flashes in the accent as the wave passes, rises into place and settles lit
      for (const tt of tiles) {
        const at = LIGHT0 + (maxDist ? tt.dist / maxDist : 0) * LIGHT_SPREAD;
        const lit = e.p3o(seg(p, at, LIGHT_DUR));
        put(tt.lit, 'opacity', (lit * tt.glow).toFixed(3));
        put(tt.lit, 'transform', `scale(${(0.8 + 0.2 * lit).toFixed(3)})`);
        put(tt.flash, 'opacity', (0.92 * Math.sin(Math.PI * seg(p, at, LIGHT_DUR * 1.5))).toFixed(3));
      }
      const ca = e.p3o(seg(p, LIGHT0 + 0.02, 0.04));
      put(centreFill, 'opacity', ca.toFixed(3));
      if (markEl) { put(markEl, 'opacity', ca.toFixed(3)); put(markEl, 'transform', `scale(${(0.6 + 0.4 * ca).toFixed(3)})`); }
      put(pins[N - 1].parentNode, 'opacity', (1 - ca).toFixed(3));
      // pulses run only while the scene rests at either end (a running pulse would repaint every frame)
      flag(plot, 'is-arrived', p >= 0.9);
      // which stop is current: derived from s, so scrolling back is exact
      let a = 0;
      for (let k = 1; k < N; k++) if (s >= stopS[k - 1] + 0.4 * (stopS[k] - stopS[k - 1])) a = k;
      if (a !== active) {
        active = a;
        steps.forEach((st, k) => { st.classList.toggle('is-current', k === a); st.classList.toggle('is-passed', k < a); });
        pins.forEach((pn, k) => { pn.parentNode.classList.toggle('is-current', k === a); pn.parentNode.classList.toggle('is-passed', k < a); });
        count.textContent = `Stop ${a + 1} of ${N}`;
      }
      flag(pins[0].parentNode, 'is-pulse', p < 0.06);
      for (let k = 0; k < legs; k++) put(legFills[k], 'transform', `scaleX(${clamp((s - stopS[k]) / (stopS[k + 1] - stopS[k]), 0, 1).toFixed(4)})`);
      // the gauge reads a real unit, piecewise along the stops
      if (gaugeNum) {
        let v = values[N - 1];
        for (let k = 0; k < legs; k++) if (s <= stopS[k + 1]) { v = lerp(values[k], values[k + 1], (s - stopS[k]) / (stopS[k + 1] - stopS[k])); break; }
        const txt = fmt.format(Math.round(v / unitStep) * unitStep);
        if (txt !== lastGauge) { lastGauge = txt; gaugeNum.textContent = txt; }
      }
    };

    measure();
    tl.to(state, { p: 1, duration: 1, ease: 'none', onUpdate: render }, 0);
    const onRefresh = () => { measure(); render(); };
    ScrollTrigger.addEventListener('refresh', onRefresh);
    render();

    // undo everything this build wrote when the scene reverts (reduced motion, breakpoint change)
    const teardown = () => {
      ScrollTrigger.removeEventListener('refresh', onRefresh);
      made.forEach((m) => m.remove());
      for (const node of [intro, rail, list, count, arriveLine, arriveCta]) if (node) for (const k of ['opacity', 'transform', 'visibility']) node.style.removeProperty(k);
      if (list) list.style.removeProperty('--n');
      for (const k of ['--route-persp', '--route-ax', '--route-ay']) stage.style.removeProperty(k);
      steps.forEach((st) => st.classList.remove('is-current', 'is-passed'));
      if (gaugeNum) gaugeNum.textContent = gaugeFinal;
      root.__routeTeardown = null;
    };
    root.__routeTeardown = teardown;
    gsap.context(() => teardown);
  }
})();
