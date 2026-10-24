// tasteskill / scenes / fly-into-the-shape.js — the brand's own mark turns to face you, then you fly into it.
//
// The mark rides up with the content and arrives at the centre of the screen exactly as the stage is
// held: a big, solid mark with a real extruded side, standing behind a large centred title. It turns to
// face you, then dives: it grows in log space about the centre of its largest inscribed circle until its
// thinnest part has passed every edge of the screen, and the next chapter (a photograph of its world)
// is already there inside it, coming towards you as you go through. The title is never faded: two
// identical copies split it along the mark's edges (ink on the paper, light on the face and on the dark
// side), so every fragment of every glyph sits on its own ground. The face starts as the solid accent and clears
// to the picture as the mark covers the screen; the chapter's first sentence settles last.
// data-dir="out" plays it backwards at a chapter's end: the world shrinks back into the mark, the face
// fills with the accent, and the mark turns upright as it lands behind the closing title, so a pair of
// scenes lets the reader leave the way they came in.
//
// Needs gsap + ScrollTrigger, stage.js and fly-into-the-shape.css. Use it as the doorway into a dark
// or immersive chapter on a page whose brand has an ownable, solid symbol (a monogram, an emblem, a
// building's silhouette, a keyhole). Skip it when there is no such mark: a plain circle is the generic
// version. The clips are written as clip-path: path() in screen pixels every frame, so the edges stay
// vector-sharp at any zoom; browsers without clip-path: path() get the finished composition.
//
// DOM (the CSS file draws the finished composition from the same markup):
//   <section class="scene" data-scene="fly-into-the-shape" data-dir="in" data-options='{}' aria-labelledby="t">
//     <div class="scene-stage">
//       <div class="portal-outside">                          the outgoing paper (var(--ground))
//         <p class="portal-aside">3-6 words</p>               optional: top-left, fades as the dive starts
//         <p class="portal-cue" aria-hidden="true">Scroll</p>  optional: bottom centre (live only)
//       </div>
//       <h2 class="portal-title portal-title--out" id="t">    the title, ink on the paper
//         <span class="portal-line">Line one</span> <span class="portal-line">line two</span>
//       </h2>                                                2-6 words on 2 lines, 12 characters a line at most
//       <div class="portal-world">                            the next chapter; never transformed, only clipped
//         <picture><source media="(max-width: 767px)" srcset="9:16 crop">
//           <img class="portal-media" src alt width height></picture>   or <video class="portal-media" muted loop playsinline poster>
//         <div class="portal-scrim" aria-hidden="true"></div>   flat scrim so light type reads on the picture
//         <div class="portal-tint" aria-hidden="true"></div>    the mark's face: the solid accent, cleared by scroll
//         <svg class="portal-mark" viewBox="0 0 100 100" aria-hidden="true"><use href="#mark"/></svg>  finished state only
//         <p class="portal-sub">10-18 words that open the chapter</p>
//       </div>
//       <svg class="portal-src" viewBox="0 0 100 100" width="0" height="0" aria-hidden="true">
//         <path id="mark" d="one closed path" data-anchor="50 61.2" data-rin="34.7"/>
//       </svg>
//     </div>
//   </section>
// While it runs, the script adds the extruded side (<div class="portal-depth">, between the ink title
// and the world) and the light copy of the title (<div class="portal-lit">, over the world, clipped to
// the whole mark). An older .portal-title--in inside the world is not needed and stays hidden.
//
// The split title and the page inspector: scripts/inspect.mjs reports "covered-text" for this scene,
// because the ink h2 lies under the mark, and the light copy over it is what the reader sees there.
// That is the design, not a collision: run the inspector with --allow covered-text for a page that
// uses this scene, and never "fix" it by removing a copy of the title (the mark's edge would then pass
// over ink on blue, or white on paper).
//
// The mark: one closed path in its viewBox (a 100x100 box is usual), any SVG commands (relative,
// shorthand and arcs are converted on load). It needs a solid core: an inscribed circle of at least
// 15% of the box height, or the cover zoom runs long and the edge sweeps for too long.
// data-anchor (the centre of the largest inscribed circle) and data-rin (its radius) are computed when
// they are missing. fill-rule="evenodd" on the path is honoured.
//
// Options (data-options JSON; defaults, ranges):
//   dir        "in"     "in" | "out"   prefer the data-dir attribute, which the CSS also reads
//   hold       2        1.4-2.6   screens the stage is held on desktop
//   phoneHold  1.6      1.2-2.4   screens on a phone (under 768px)
//   size       0.4      0.2-0.6   height of the mark's box at rest, as a share of the stage's height (and
//                                 at most 0.45 of its width): the hero of the first frame, behind the title.
//                                 A number above 1 is read as px (96-720).
//   phoneSize  0.55     0.3-0.75  on a phone, as a share of the stage's width (at most 0.4 of its height);
//                                 above 1 = px (64-360)
//   turn       30       0-180     degrees of the turn: "in" runs -turn -> 0 before the dive, "out" lands
//                                 from +turn -> 0 as the mark shrinks home
//   phoneTurn  30       0-180
//   depth      0.06     0-0.15    thickness of the extruded side at rest, as a share of the mark's box
//                                 (above 1 = px); it thickens as the mark comes closer. 0 = a flat mark
//   phoneDepth 0.05     0-0.15
//   ease       "sine.inOut"       the zoom's curve in log space: "sine.inOut" (a legible lock, then a
//                                 gentle arrival) or "none" (a constant rate of approach)
//   zoom       1.3      1-1.6     how far the world's picture grows with the dive (about the anchor, eased
//                                 like the dive), so you travel into the world, not only through the frame
//   blur       0        0-6       px of blur on the world's picture through the fastest part of the dive
//                                 (desktop only). Off by default: a full-screen filter every frame cost
//                                 2-3x the frame time in testing; 2-3 is enough when the machines allow it
//   scrub      true with Lenis, else 0.8   seconds of catch-up, or true (locked to the scrollbar)
//   phone      "same"   "same" | "rest" (the phone gets the finished composition)
//
// Colours come from the page: var(--ground) paper, var(--ink) title outside, var(--accent) the mark's
// face (light type sits on it, so keep 3:1 or more against --portal-light), --portal-side the extruded
// side (default: the accent mixed with 45% black), --portal-night the world's ground (give the next
// section exactly this ground), --portal-light the title inside, --portal-soft the sub-line.
// --portal-focus sets the picture's focal point (object-position, default 50% 50%); the picture always
// grows about the anchor, the centre of the stage.
//
// Pictures: one landscape photograph of the chapter's world, 16:10 or 16:9, 2000px or more, dark
// (mean luminance about 20% or less) with a calm centre across 40% x 30% where the title and the
// sub-line sit, a dark bottom edge (the stage scrolls up into the next section's flat ground), and a
// 9:16 crop for phones. A night sky, a deep interior, a lit street all suit.
//
// Testing: the section carries data-z, data-rot and data-cover while it runs.
(() => {
  const ID = 'fly-into-the-shape';
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const num = (v, d, a, b) => { const n = typeof v === 'string' && v.trim() !== '' ? +v : v; return typeof n === 'number' && isFinite(n) ? clamp(n, a, b) : d; };
  // a share (0-1) or, above 1, px
  const share = (v, d, a, b, pa, pb) => { const n = num(v, d, 0, 1e4); return n > 1 ? clamp(n, pa, pb) : clamp(n, a, b); };
  const TAU = Math.PI * 2;
  const f1 = (v) => v.toFixed(1);
  if (window.ScrollTrigger) ScrollTrigger.config({ ignoreMobileResize: true });

  // ---------- one SVG path -> absolute M / L / C / Q / Z segments ----------
  // Relative commands, H/V, S/T shorthand and arcs are rewritten, so the per-frame transform only has
  // to move points.
  function arcToCubics(x1, y1, rx, ry, phi, fa, fs, x2, y2) {
    if (!rx || !ry || (x1 === x2 && y1 === y2)) return [[x1, y1, x2, y2, x2, y2]];
    rx = Math.abs(rx); ry = Math.abs(ry);
    const sp = Math.sin((phi * Math.PI) / 180), cp = Math.cos((phi * Math.PI) / 180);
    const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
    const xp = cp * dx + sp * dy, yp = -sp * dx + cp * dy;
    const lam = (xp * xp) / (rx * rx) + (yp * yp) / (ry * ry);
    if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
    const nume = rx * rx * ry * ry - rx * rx * yp * yp - ry * ry * xp * xp;
    const deno = rx * rx * yp * yp + ry * ry * xp * xp;
    const co = (fa === fs ? -1 : 1) * Math.sqrt(Math.max(0, nume / (deno || 1)));
    const cxp = (co * rx * yp) / ry, cyp = (-co * ry * xp) / rx;
    const cx = cp * cxp - sp * cyp + (x1 + x2) / 2, cy = sp * cxp + cp * cyp + (y1 + y2) / 2;
    const ang = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
    const t1 = ang(1, 0, (xp - cxp) / rx, (yp - cyp) / ry);
    let dt = ang((xp - cxp) / rx, (yp - cyp) / ry, (-xp - cxp) / rx, (-yp - cyp) / ry);
    if (!fs && dt > 0) dt -= TAU; else if (fs && dt < 0) dt += TAU;
    const n = Math.max(1, Math.ceil(Math.abs(dt) / (Math.PI / 2) - 1e-9)), d = dt / n, k = (4 / 3) * Math.tan(d / 4);
    const e = (ux, uy) => [cp * rx * ux - sp * ry * uy + cx, sp * rx * ux + cp * ry * uy + cy];
    const out = [];
    for (let i = 0; i < n; i++) {
      const a1 = t1 + i * d, a2 = a1 + d, c1 = Math.cos(a1), s1 = Math.sin(a1), c2 = Math.cos(a2), s2 = Math.sin(a2);
      out.push([...e(c1 - k * s1, s1 + k * c1), ...e(c2 + k * s2, s2 - k * c2), ...e(c2, s2)]);
    }
    return out;
  }

  function parsePath(d) {
    const t = String(d).match(/[a-df-zA-DF-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g) || [];
    const segs = [];
    let i = 0, cmd = '', x = 0, y = 0, sx = 0, sy = 0, lc = null, lq = null;
    const isCmd = (s) => /^[a-zA-Z]$/.test(s);
    const n = () => { const v = +t[i++]; if (!isFinite(v)) throw new Error('bad number'); return v; };
    const flag = () => { const s = t[i]; if (s && s.length > 1 && (s[0] === '0' || s[0] === '1')) { t[i] = s.slice(1); return +s[0]; } i++; return +s; };
    while (i < t.length) {
      if (isCmd(t[i])) cmd = t[i++];
      else if (!cmd) throw new Error('path must start with M');
      const C = cmd.toUpperCase(), rel = cmd !== C, ox = rel ? x : 0, oy = rel ? y : 0;
      if (C === 'Z') { segs.push({ c: 'Z', p: [] }); x = sx; y = sy; lc = lq = null; if (i < t.length && !isCmd(t[i])) throw new Error('numbers after Z'); continue; }
      if (C === 'M') { x = ox + n(); y = oy + n(); sx = x; sy = y; segs.push({ c: 'M', p: [x, y] }); cmd = rel ? 'l' : 'L'; lc = lq = null; }
      else if (C === 'L') { x = ox + n(); y = oy + n(); segs.push({ c: 'L', p: [x, y] }); lc = lq = null; }
      else if (C === 'H') { x = ox + n(); segs.push({ c: 'L', p: [x, y] }); lc = lq = null; }
      else if (C === 'V') { y = oy + n(); segs.push({ c: 'L', p: [x, y] }); lc = lq = null; }
      else if (C === 'C' || C === 'S') {
        const r = C === 'S' ? (lc ? [2 * x - lc[0], 2 * y - lc[1]] : [x, y]) : [ox + n(), oy + n()];
        const p = [r[0], r[1], ox + n(), oy + n(), ox + n(), oy + n()];
        segs.push({ c: 'C', p }); lc = [p[2], p[3]]; lq = null; x = p[4]; y = p[5];
      } else if (C === 'Q' || C === 'T') {
        const r = C === 'T' ? (lq ? [2 * x - lq[0], 2 * y - lq[1]] : [x, y]) : [ox + n(), oy + n()];
        const p = [r[0], r[1], ox + n(), oy + n()];
        segs.push({ c: 'Q', p }); lq = [p[0], p[1]]; lc = null; x = p[2]; y = p[3];
      } else if (C === 'A') {
        const rx = n(), ry = n(), phi = n(), fa = flag(), fs = flag(), ex = ox + n(), ey = oy + n();
        for (const p of arcToCubics(x, y, rx, ry, phi, fa, fs, ex, ey)) segs.push({ c: 'C', p });
        x = ex; y = ey; lc = lq = null;
      } else throw new Error('unknown command ' + cmd);
    }
    if (!segs.length || segs[0].c !== 'M') throw new Error('empty path');
    return segs;
  }

  // ---------- segments -> closed sub-paths of edges ----------
  // Every edge carries its own start: { c: 'L', p: [x0, y0, x1, y1] } or { c: 'C', p: [x0, y0, c1, c2, x1, y1] }
  // (quadratics become cubics), and every sub-path is closed with a line when it ends elsewhere.
  function toSubs(segs) {
    const subs = [];
    let cur = null, x = 0, y = 0;
    const end = () => {
      if (!cur) return;
      if (Math.hypot(x - cur.x0, y - cur.y0) > 1e-6) cur.edges.push({ c: 'L', p: [x, y, cur.x0, cur.y0] });
      x = cur.x0; y = cur.y0; cur = null;
    };
    for (const s of segs) {
      const p = s.p;
      if (s.c === 'M') { end(); x = p[0]; y = p[1]; continue; }
      if (s.c === 'Z') { end(); continue; }
      if (!cur) { cur = { x0: x, y0: y, edges: [] }; subs.push(cur); }
      if (s.c === 'L') cur.edges.push({ c: 'L', p: [x, y, p[0], p[1]] });
      else if (s.c === 'Q') cur.edges.push({ c: 'C', p: [x, y, x + (2 / 3) * (p[0] - x), y + (2 / 3) * (p[1] - y), p[2] + (2 / 3) * (p[0] - p[2]), p[3] + (2 / 3) * (p[1] - p[3]), p[2], p[3]] });
      else cur.edges.push({ c: 'C', p: [x, y, ...p] });
      x = p[p.length - 2]; y = p[p.length - 1];
    }
    end();
    return subs.filter((s) => s.edges.length);
  }
  const reverseSub = (s) => {
    const edges = s.edges.slice().reverse().map((e) => { const q = []; for (let k = e.p.length - 2; k >= 0; k -= 2) q.push(e.p[k], e.p[k + 1]); return { c: e.c, p: q }; });
    return { x0: edges[0].p[0], y0: edges[0].p[1], edges };
  };

  // Points along the outline (densest where it is longest), one closed ring per sub-path.
  const ctrlLen = (p) => { let L = 0; for (let k = 2; k < p.length; k += 2) L += Math.hypot(p[k] - p[k - 2], p[k + 1] - p[k - 1]); return L; };
  const bez = (p, u) => { const v = 1 - u; return [v * v * v * p[0] + 3 * v * v * u * p[2] + 3 * v * u * u * p[4] + u * u * u * p[6], v * v * v * p[1] + 3 * v * v * u * p[3] + 3 * v * u * u * p[5] + u * u * u * p[7]]; };
  function sample(subs, total = 2048) {
    const sum = subs.reduce((a, s) => a + s.edges.reduce((b, e) => b + ctrlLen(e.p), 0), 0) || 1;
    return subs.map((s) => {
      const ring = [[s.x0, s.y0]];
      for (const e of s.edges) {
        const p = e.p, m = Math.max(2, Math.round((total * ctrlLen(p)) / sum));
        for (let k = 1; k <= m; k++) { const u = k / m; ring.push(e.c === 'L' ? [p[0] + (p[2] - p[0]) * u, p[1] + (p[3] - p[1]) * u] : bez(p, u)); }
      }
      return ring;
    });
  }
  const area = (r) => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += r[j][0] * r[i][1] - r[i][0] * r[j][1]; return a / 2; };

  const inside = (rings, x, y) => {
    let c = false;
    for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const [xi, yi] = r[i], [xj, yj] = r[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  const edgeDist = (rings, x, y) => {
    let m = Infinity;
    for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const ax = r[j][0], ay = r[j][1], dx = r[i][0] - ax, dy = r[i][1] - ay;
      const q = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
      m = Math.min(m, Math.hypot(x - ax - q * dx, y - ay - q * dy));
    }
    return m;
  };

  // The pole of inaccessibility (centre of the largest inscribed circle): a grid search, refined twice.
  function pole(rings) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const r of rings) for (const [x, y] of r) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    const coarse = rings.map((r) => r.filter((_, k) => k % 4 === 0));
    let best = [(x0 + x1) / 2, (y0 + y1) / 2, 0];
    let step = Math.max(x1 - x0, y1 - y0) / 48;
    const scan = (ax, ay, bx, by, st, rs) => {
      for (let y = ay; y <= by; y += st) for (let x = ax; x <= bx; x += st) {
        if (!inside(rs, x, y)) continue;
        const d = edgeDist(rs, x, y);
        if (d > best[2]) best = [x, y, d];
      }
    };
    scan(x0, y0, x1, y1, step, coarse);
    for (let k = 0; k < 2; k++) { const [bx, by] = best; best[2] = 0; scan(bx - step, by - step, bx + step, by + step, step / 6, rings); step /= 6; }
    best[2] = edgeDist(rings, best[0], best[1]);
    return best;
  }

  // First-exit radius from the anchor in each 1-degree bin (in the shape's own frame).
  function exitTable(rings, ax, ay) {
    const bins = new Array(360).fill(Infinity);
    for (const r of rings) for (const [x, y] of r) {
      const a = ((Math.atan2(y - ay, x - ax) * 180) / Math.PI + 360) % 360;
      const b = Math.floor(a) % 360, d = Math.hypot(x - ax, y - ay);
      if (d < bins[b]) bins[b] = d;
    }
    // empty bins take the nearer of their nearest filled neighbours
    const filled = bins.map((v) => v < Infinity);
    if (!filled.some(Boolean)) return null;
    return bins.map((v, b) => {
      if (filled[b]) return v;
      for (let k = 1; k < 180; k++) {
        const l = bins[(b - k + 360) % 360], r = bins[(b + k) % 360];
        if (l < Infinity || r < Infinity) return Math.min(l, r);
      }
      return v;
    });
  }

  // Zoom at which the mark's thinnest part, rotated by rot degrees, passes every point of a W x H
  // screen's edge (96 points with the corners), with a 3% and 2px safety margin.
  function coverZoom(table, rin, s0, W, H, rot) {
    const cx = W / 2, cy = H / 2;
    const fallback = (1.03 * (Math.hypot(cx, cy) + 2)) / (s0 * rin);
    if (!table) return fallback;
    const pts = [[0, 0], [W, 0], [W, H], [0, H]];
    const per = 2 * (W + H);
    for (let k = 0; k < 92; k++) {
      let d = (per * (k + 0.5)) / 92;
      if (d < W) pts.push([d, 0]); else if ((d -= W) < H) pts.push([W, d]); else if ((d -= H) < W) pts.push([W - d, H]); else pts.push([0, H - (d - W)]);
    }
    let z = 0;
    for (const [px, py] of pts) {
      const a = ((((Math.atan2(py - cy, px - cx) * 180) / Math.PI - rot) % 360) + 360) % 360;
      let r = Infinity;
      for (let k = -2; k <= 2; k++) r = Math.min(r, table[(Math.floor(a) + k + 360) % 360]);
      if (!(r > 0) || r === Infinity) return fallback;
      z = Math.max(z, (Math.hypot(px - cx, py - cy) + 2) / (s0 * r));
    }
    return Math.max(1, 1.03 * z);
  }

  const P = (x, y) => f1(x) + ' ' + f1(y);

  // Parsed marks are kept per path element, so a page can hold a pair of scenes on one mark.
  const cache = new WeakMap();
  function readMark(path) {
    if (cache.has(path)) return cache.get(path);
    const subs = toSubs(parsePath(path.getAttribute('d') || ''));
    if (!subs.length) throw new Error('no closed shape');
    const rings = sample(subs);
    const svg = path.ownerSVGElement;
    const vb = svg && svg.viewBox && svg.viewBox.baseVal && svg.viewBox.baseVal.height ? svg.viewBox.baseVal : null;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const r of rings) for (const [x, y] of r) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    const box = vb ? Math.max(vb.width, vb.height) : Math.max(x1 - x0, y1 - y0);
    const given = String(path.dataset.anchor || '').trim().split(/[\s,]+/).map(Number);
    let ax, ay, rin;
    if (given.length === 2 && given.every(isFinite) && inside(rings, given[0], given[1])) {
      [ax, ay] = given;
      rin = num(path.dataset.rin, edgeDist(rings, ax, ay), 0.001, 1e6);
    } else [ax, ay, rin] = pole(rings);
    const table = exitTable(rings, ax, ay);
    const evenodd = (path.getAttribute('fill-rule') || '').trim() === 'evenodd';
    if (rin / box < 0.15) console.warn(`${ID}: the mark's solid core is thin (inscribed radius ${(100 * rin / box).toFixed(0)}% of its box); the dive will run long. 15% or more reads best.`);
    // the side is a nonzero union of copies: wind every outer ring one way (sg) and, for an even-odd
    // mark, its holes the other way; a nonzero mark keeps its own windings inside each outer ring
    const areas = rings.map(area);
    let big = 0;
    areas.forEach((a, i) => { if (Math.abs(a) > Math.abs(areas[big])) big = i; });
    const sg = Math.sign(areas[big]) || 1;
    const depthOf = rings.map((r, i) => rings.reduce((d, q, j) => d + (j !== i && inside([q], r[0][0], r[0][1]) ? 1 : 0), 0));
    const rootOf = (i) => (depthOf[i] === 0 ? i : rings.findIndex((q, j) => j !== i && depthOf[j] === 0 && inside([q], rings[i][0][0], rings[i][0][1])));
    const sideSubs = subs.map((s, i) => {
      const flip = evenodd ? Math.sign(areas[i]) !== (depthOf[i] % 2 ? -sg : sg) : Math.sign(areas[rootOf(i)] ?? areas[i]) !== sg;
      return flip ? reverseSub(s) : s;
    });
    const mark = { subs, sideSubs, sg, ax, ay, rin, box, table, rule: evenodd ? 'evenodd, ' : '' };
    cache.set(path, mark);
    return mark;
  }

  window.Scenes = window.Scenes || {};
  window.Scenes[ID] = (root, opts = {}) => {
    const dir = String(root.dataset.dir || opts.dir || 'in') === 'out' ? 'out' : 'in';
    root.dataset.dir = dir;
    const o = {
      hold: num(opts.hold, 2, 1.4, 2.6),
      phoneHold: num(opts.phoneHold, 1.6, 1.2, 2.4),
      size: share(opts.size, 0.4, 0.2, 0.6, 96, 720),
      phoneSize: share(opts.phoneSize, 0.55, 0.3, 0.75, 64, 360),
      turn: num(opts.turn, 30, 0, 180),
      phoneTurn: num(opts.phoneTurn, 30, 0, 180),
      depth: share(opts.depth, 0.06, 0, 0.15, 0, 48),
      phoneDepth: share(opts.phoneDepth, 0.05, 0, 0.15, 0, 24),
      ease: opts.ease === 'none' ? 'none' : 'sine.inOut',
      zoom: num(opts.zoom, 1.3, 1, 1.6),
      blur: num(opts.blur, 0, 0, 6),
      scrub: opts.scrub === true ? true : typeof opts.scrub === 'number' ? clamp(opts.scrub, 0, 2) : null,
      phone: opts.phone === 'rest' ? 'rest' : 'same',
    };
    const $ = (s) => root.querySelector(s);
    const $$ = (s) => [...root.querySelectorAll(s)];

    // Without clip-path: path() the scene keeps its finished composition.
    const canClip = window.CSS && CSS.supports && CSS.supports('clip-path', 'path("M0 0L1 0L1 1Z")');
    const srcPath = $('.portal-src path') || (() => { const u = $('.portal-mark use'); const id = u && (u.getAttribute('href') || u.getAttribute('xlink:href') || '').replace(/^#/, ''); return id ? document.getElementById(id) : null; })();
    let mark = null;
    try { if (srcPath) mark = readMark(srcPath); } catch (e) { console.warn(`${ID}: the mark's path could not be read (${e.message}); showing the finished composition.`); }
    if (!srcPath) console.warn(`${ID}: needs <svg class="portal-src"><path d="…"></svg> for the mark; showing the finished composition.`);

    function build(tl, ctx) {
      const { stage, phone } = ctx;
      const world = $('.portal-world'), outTitle = $('.portal-title--out');
      const media = $('.portal-media'), tint = $('.portal-tint'), sub = $('.portal-sub'), outside = $('.portal-outside');
      const IN = dir === 'in';
      // the paper's notes leave as the dive starts ("in"), or arrive once the mark is home ("out";
      // a scroll cue makes no sense there and stays hidden in the CSS)
      const notes = $$(IN ? '.portal-aside, .portal-cue' : '.portal-aside');
      const turn = phone ? o.phoneTurn : o.turn;
      const depthOpt = phone ? o.phoneDepth : o.depth;
      const blurPx = phone ? 0 : o.blur;
      let dead = false;
      const made = [];

      gsap.context(() => {
        // the extruded side: a dark accent layer between the ink title and the world, clipped to the
        // mark swept along the side's vector
        let side = null;
        if (depthOpt > 0) {
          side = document.createElement('div');
          side.className = 'portal-depth';
          side.setAttribute('aria-hidden', 'true');
          outTitle.parentNode.insertBefore(side, outTitle.nextSibling);
          made.push(side);
        }
        // the light title: one copy over the world, clipped to the whole mark (face and side), so every
        // glyph is light wherever the mark is and ink wherever the paper is. One copy, not one in the
        // world and another on the side: Chrome antialiases text and boxes differently under one clip,
        // and two light copies meeting at the face's edge leave a 1px dark seam through the letters.
        // The clip sits on a stage-sized layer (stage px); the title inside it scales freely. To the eye
        // it is a heading (so page checks read it as one block); assistive tech hears only the h2.
        const lit = document.createElement('div');
        lit.className = 'portal-lit';
        lit.setAttribute('aria-hidden', 'true');
        const light = document.createElement('div');
        light.className = 'portal-title portal-title--light';
        light.setAttribute('role', 'heading');
        light.setAttribute('aria-level', /^H[1-6]$/.test(outTitle.tagName) ? outTitle.tagName[1] : '2');
        light.innerHTML = outTitle.innerHTML;
        light.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
        lit.appendChild(light);
        world.parentNode.insertBefore(lit, world.nextSibling);
        made.push(lit);
        const titles = [outTitle, light];

        const st = { zl: 0, rot: 0, tint: 1, ts: 1, note: 1, sub: 0, bl: 0 };
        const g = { W: 0, H: 0, s0: 1, k0: 0, zCover: 1, w: -1, box: 0 };
        const last = {};
        // writes a style only when it changed (this build's own memory, so a rebuild starts clean)
        const written = new Map();
        const put = (el, prop, v) => {
          if (!el) return;
          let m = written.get(el);
          if (!m) written.set(el, (m = {}));
          if (m[prop] !== v) { m[prop] = v; el.style[prop] = v; }
        };

        // the mark's box at rest: a share of the stage (its height on desktop, its width on a phone)
        const boxPx = (W, H) => {
          if (phone) return o.phoneSize > 1 ? o.phoneSize : Math.min(o.phoneSize * W, 0.4 * H);
          return o.size > 1 ? o.size : Math.min(o.size * H, 0.45 * W);
        };
        const measure = () => {
          if (dead) return;
          const W = stage.clientWidth || innerWidth, H = stage.clientHeight || innerHeight;
          // on a phone the URL bar never re-measures it: 100svh is stable, and only a new width counts
          if (!phone || W !== g.w || !g.zCover || Math.abs(H - g.H) > 120) {
            g.box = boxPx(W, H);
            g.s0 = g.box / mark.box;
            // "in" covers once it is upright; "out" leaves the cover still turned
            g.zCover = coverZoom(mark.table, mark.rin, g.s0, W, H, IN ? 0 : turn);
            g.k0 = depthOpt > 1 ? depthOpt : depthOpt * g.box;
            g.w = W;
          }
          g.W = W; g.H = H;
          root.style.setProperty('--portal-th', outTitle.offsetHeight + 'px');
          root.dataset.cover = g.zCover.toFixed(2);
        };

        // sub-paths in screen px: rotated and scaled by (c, n), moved by (tx, ty)
        const subsPath = (subs, c, n, tx, ty) => {
          let s = '';
          for (const sp of subs) {
            s += 'M' + P(c * sp.x0 - n * sp.y0 + tx, n * sp.x0 + c * sp.y0 + ty);
            for (const e of sp.edges) {
              const p = e.p;
              s += e.c;
              for (let k = 2; k < p.length; k += 2) s += ' ' + P(c * p[k] - n * p[k + 1] + tx, n * p[k] + c * p[k + 1] + ty);
            }
            s += 'Z';
          }
          return s;
        };
        // the extruded side: copies of the outline stepped along the side's vector, 1.25px or less
        // apart, in one nonzero path. Their union is the solid swept mark: the copies overlap (they never
        // share an edge, so no seam can open between them), and the first copy already covers the
        // face's own edge. The face itself sits on top, so the copy at 0 is not needed.
        const sidePath = (c, n, tx, ty, k) => {
          const N = clamp(Math.ceil(k / 1.25), 4, 32);
          let s = '';
          for (let j = 1; j <= N; j++) s += subsPath(mark.sideSubs, c, n, tx + (VX * k * j) / N, ty + (VY * k * j) / N);
          return s;
        };
        // the side's direction on screen: down and to the right, fixed while the mark turns (a light
        // from the upper left)
        const VX = 0.6 / Math.hypot(0.6, 1), VY = 1 / Math.hypot(0.6, 1);

        const render = () => {
          if (dead || !g.W) return;
          const zl = clamp(st.zl, 0, 1);
          const z = Math.exp(zl * Math.log(g.zCover));
          const s = g.s0 * z, a = (st.rot * Math.PI) / 180, c = Math.cos(a) * s, n = Math.sin(a) * s;
          const tx = g.W / 2 - (c * mark.ax - n * mark.ay), ty = g.H / 2 - (n * mark.ax + c * mark.ay);
          const covered = zl >= 0.9999;
          const face = covered ? '' : subsPath(mark.subs, c, n, tx, ty);
          put(world, 'clipPath', covered ? 'none' : `path(${mark.rule}"${face}")`);
          // once the world covers the stage the paper side is out of sight: stop painting it, and clip
          // the ink h2 to nothing the screen-reader way (it stays the section's accessible name)
          put(outside, 'visibility', covered ? 'hidden' : '');
          put(outTitle, 'clipPath', covered ? 'inset(50%)' : '');
          let whole = `path(${mark.rule}"${face}")`;
          if (side) {
            // the side thickens as the mark comes closer (z^0.35: perspective, not a drop shadow)
            const k = g.k0 * Math.pow(z, 0.35);
            put(side, 'visibility', covered ? 'hidden' : '');
            if (!covered) {
              const sp = sidePath(c, n, tx, ty, k);
              put(side, 'clipPath', `path("${sp}")`);
              // nonzero: the face's own copy uses the side's windings, so an even-odd mark keeps its holes
              whole = `path("${subsPath(mark.sideSubs, c, n, tx, ty)}${sp}")`;
            }
          }
          put(lit, 'clipPath', covered ? 'none' : whole);
          put(tint, 'opacity', st.tint.toFixed(3));
          const ts = `scale(${st.ts.toFixed(4)})`;
          for (const t of titles) put(t, 'transform', ts);
          if (media) {
            // the world comes towards you with the dive: it grows about the anchor, in step with the zoom
            const ms = Math.pow(o.zoom, zl);
            put(media, 'transform', ms > 1.0001 ? `scale(${ms.toFixed(4)})` : 'none');
            const b = blurPx * clamp(st.bl, 0, 1);
            put(media, 'filter', b > 0.05 ? `blur(${b.toFixed(2)}px)` : 'none');
          }
          for (const el of notes) put(el, 'opacity', st.note.toFixed(3));
          if (sub) { put(sub, 'opacity', st.sub.toFixed(3)); put(sub, 'transform', `translate3d(0, ${(16 * (1 - st.sub)).toFixed(2)}px, 0)`); }
          const zs = z.toFixed(2), rs = st.rot.toFixed(1);
          if (last.z !== zs) { last.z = zs; root.dataset.z = zs; }
          if (last.r !== rs) { last.r = rs; root.dataset.rot = rs; }
        };

        // the timeline: every tween drives the state object; render() writes the DOM once per update
        const E = o.ease;
        if (IN) {
          tl.fromTo(st, { zl: 0 }, { zl: 1, duration: 0.7, ease: E }, 0.06)
            .fromTo(st, { rot: -turn }, { rot: 0, duration: 0.3, ease: 'power2.out' }, 0.06)
            .fromTo(st, { tint: 1 }, { tint: 0, duration: 0.52, ease: 'sine.inOut' }, 0.2)
            .fromTo(st, { ts: 0.94 }, { ts: 1, duration: 0.7, ease: 'sine.inOut' }, 0.06)
            .fromTo(st, { note: 1 }, { note: 0, duration: 0.08 }, 0.06)
            .fromTo(st, { sub: 0 }, { sub: 1, duration: 0.1, ease: 'power2.out' }, 0.8)
            // the rush: the world's picture blurs a little as it streams past, only through the
            // fastest part of the dive (a full-screen filter is not free)
            .fromTo(st, { bl: 0 }, { bl: 1, duration: 0.15, ease: 'sine.inOut' }, 0.4)
            .to(st, { bl: 0, duration: 0.15, ease: 'sine.inOut' }, 0.55);
        } else {
          tl.fromTo(st, { zl: 1 }, { zl: 0, duration: 0.7, ease: E }, 0.1)
            .fromTo(st, { tint: 0 }, { tint: 1, duration: 0.5, ease: 'sine.inOut' }, 0.22)
            // still turned as its edge comes into view, the mark rights itself as it lands
            .fromTo(st, { rot: turn }, { rot: 0, duration: 0.33, ease: 'power2.out' }, 0.45)
            .fromTo(st, { ts: 1 }, { ts: 0.94, duration: 0.7, ease: 'sine.inOut' }, 0.1)
            .fromTo(st, { sub: 1 }, { sub: 0, duration: 0.08 }, 0.04)
            .fromTo(st, { note: 0 }, { note: 1, duration: 0.08 }, 0.8)
            .fromTo(st, { bl: 0 }, { bl: 1, duration: 0.15, ease: 'sine.inOut' }, 0.24)
            .to(st, { bl: 0, duration: 0.15, ease: 'sine.inOut' }, 0.39);
        }
        tl.set({}, {}, 1);
        tl.eventCallback('onUpdate', render);

        measure();
        render();
        // re-measure on every refresh (resize, fonts, pictures), then redraw
        ScrollTrigger.create({ trigger: root, start: 'top bottom', end: 'bottom top', onRefresh: () => { measure(); render(); } });
        // late fonts change the title's height, which places the sub-line
        let ro = null;
        if ('ResizeObserver' in window) { ro = new ResizeObserver(() => { if (!dead) root.style.setProperty('--portal-th', outTitle.offsetHeight + 'px'); }); ro.observe(outTitle); }
        // pictures decode before they move; a video plays only while the section is on screen
        if (media && media.tagName === 'IMG') { media.loading = 'eager'; if (media.decode) media.decode().catch(() => {}); }
        if (media && blurPx > 0) media.style.willChange = 'transform, filter';
        let io = null;
        if (media && media.tagName === 'VIDEO' && 'IntersectionObserver' in window) {
          io = new IntersectionObserver(([e]) => { if (e.isIntersecting) media.play().catch(() => {}); else media.pause(); });
          io.observe(root);
        }

        return () => {
          dead = true;
          tl.eventCallback('onUpdate', null);
          if (ro) ro.disconnect();
          if (io) io.disconnect();
          for (const el of made) el.remove();
          world.style.removeProperty('clip-path');
          outTitle.style.removeProperty('clip-path');
          if (outside) outside.style.removeProperty('visibility');
          if (media) { media.style.removeProperty('filter'); media.style.removeProperty('will-change'); }
          for (const el of [outTitle, media, tint, sub, ...notes]) if (el) { el.style.removeProperty('transform'); el.style.removeProperty('opacity'); }
          for (const k of ['z', 'rot', 'cover']) delete root.dataset[k];
          root.style.removeProperty('--portal-th');
        };
      });
    }

    const plan = canClip && mark && $('.portal-world') && $('.portal-title--out') ? build : null;
    if (mark && !plan && canClip) console.warn(`${ID}: needs .portal-world and an h2.portal-title--out; showing the finished composition.`);
    return Stage.scene(root, {
      hold: o.hold,
      scrub: o.scrub ?? (Stage.lenis ? true : 0.8),
      build: plan,
      phone: o.phone === 'rest' || !plan ? 'rest' : { hold: o.phoneHold, build: plan },
    });
  };
})();
