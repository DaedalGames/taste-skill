// tasteskill / scenes / peel-tear-and-drag.js — a physical object brings in the next section.
//
// DRAG (the mode this file builds). Cloud closes in over the old chapter until it is a deck, then a huge
// photographed plane, seen from straight below or above, breaks out of it, crosses the held stage and pulls
// the next page in behind it. The page arrives through a chevron clip whose point stays under the fuselage
// and whose two slanted sides run under the two wings (measured from the cut-out's own pixels); the plane
// casts a soft shadow, on the new page only. The clip and the plane are driven by the same number (--edge,
// the clip's point as a % of the stage) in the same linear tween window, so the seam never comes loose.
//
// On a phone (max-width 767px) the same idea turns vertical: the plane flies bottom to top, nose up, and
// drags the page in from below. Reduced motion, no script, a failed CDN and very small screens (under
// 360px wide or 560px tall) show the finished composition: the old panel with its photo, closing line and
// the plane parked over a band of cloud, stacked above the new page.
//
// DOM (optional parts can be left out):
//   <section class="scene" data-scene="peel-tear-and-drag" data-options='{"dir":"ltr"}'>
//     <div class="scene-stage">
//       <div class="drag-old">                                  outgoing chapter, dark
//         <img class="drag-old__ground" src alt="">             top-down landscape photo (sea, coast, fields from altitude)
//         <div class="drag-old__tint"></div>                    flat brand colour over it (--drag-dark)
//         <p class="drag-old__line">We fly when the ferries can't.</p>       4-10 words
//         <div class="drag-veil" aria-hidden="true">            optional, 0-7 pieces; the first two sit on the right
//           <img class="drag-veil__piece" src="cloud-1.webp" alt="">        soft-edged alpha cut-outs of cloud seen
//                                                                           from above (best: dense ones, 1000-1400px)
//           <img class="drag-veil__piece" src="cloud.jpg" alt="" crossorigin="anonymous"
//                data-key data-crop="0 .4 .7 .6" data-turn="180" data-flip>
//              or an ordinary photo of bright cloud on a dark ground, keyed once into a cut-out in the browser;
//              data-crop (x y w h, fractions) picks the cloud out of the frame, data-turn (90/180/270) and
//              data-flip let one photo serve several pieces, data-key="lo hi" moves the key (default .56 .72)
//         </div>
//       </div>
//       <div class="drag-new">                                  incoming page, light; same ground as the next section
//         <div class="drag-new__inner">
//           <h2 class="drag-new__title">…</h2>                  3-8 words, two lines at most
//           <ul class="drag-new__items"><li>…</li></ul>         2-3 short quotes or 3-12 rows (over 6: three columns)
//           <p class="drag-new__aside">…</p>                    optional, 20 words or fewer, top right
//           <figure class="drag-new__figure"><img …></figure>   a wide photograph along the bottom of the page: the
//                                                               first thing the opening clip shows, so give it one
//         </div>
//       </div>
//       <div class="drag-rig drag-rig--object" aria-hidden="true">
//         <img class="drag-object" src="plane.webp" alt="">     the object: a photographed cut-out, see below
//       </div>
//     </div>
//   </section>
//   The object is a photograph cut out on alpha (WebP/PNG, about 2400px long, under 200KB), seen from straight
//   above or below, nose pointing right, no shadow, its box tight around it; a plane's wingspan about equal to
//   its length. A plane photographed against clear sky keys cleanly. The scene draws the shadow, and reads the
//   cut-out's outline (same origin or CORS) to put the clip's point under the fuselage and its sides under the
//   wings, and to know when the tail has passed each block of words. Without a .drag-object the scene paints
//   a plain drawn jet as a fallback: fine for a sketch, but a real page gives it a photograph.
//
// Options (data-options JSON), name: values [default] what it does
//   dir:       'ltr' | 'rtl'      ['ltr']   direction on desktop; 'rtl' for a second use on one page
//   hold:      1.5-4              [3]       screens the stage is held (2 without a veil)
//   phoneHold: 1.5-3.5            [2.6]
//   phone:     'vertical' | 'rest' ['vertical']  the phone flies bottom to top, or keeps the finished composition
//   scrub:     true | seconds     [true with Lenis, else 0.6]
//   object:    'jet' | 'none'     ['jet']   what to paint when the page has no .drag-object ('none': a bare wipe)
//   len:       0.3-0.9            [0.8]     object length as a share of the stage width
//   phoneLen:  0.4-0.8            [0.62]    the same on the phone, as a share of the stage height
//   grow:      1-1.35             [1.25]    scale the object reaches as it climbs (phoneGrow [1.15])
//   apex:      0.2-0.65           [measured] where the clip's point sits, as a share of the length behind the nose
//   sweep:     0-45 (degrees)     [measured] slant of the clip's sides: 0 is a square edge (a truck's bumper);
//                                           give apex and sweep for an object whose pixels cannot be read
//   bleed:     true | false       [true]    lengthen the object so its wings run off both long edges at any aspect
//   shadow:    true | false       [true]    the cast shadow, on the new page
//   veil:      true | false       [true]    false skips the cloud, drops the hold to 2, starts the drag at 0.10
//   tint:      0-0.7              [0.35]    how much of the flat colour lies over the photo at the start (for the
//                                           closing line); it deepens to 0.75 as the cloud comes in
//
// House rules over the spec: the new page's words land in the object's wake. Each block of text appears once
// the object's own outline (not just its box) has passed it, and never before the block above it, so the plane
// never crosses words being read and they arrive in reading order; the words lie above the shadow. The
// picture along the bottom of the page shows from the first frame of the opening clip.
// The new page has to fit one screen; where it does not (a long list in a short window) the scene keeps its
// finished composition there, and goes live again when the window grows. The spec's PEEL and TEAR modes are
// not in this file: they share no mechanism with the drag (both can be built from transform and clip-path
// alone), and are proposed as scene ids of their own. This file is the DRAG mode.
//
// Page tokens: --drag-dark (old chapter colour, #14204a), --ground (new page = next section), --ink,
// --font-display. Timeline positions are fractions of the scene (0-1).
(() => {
  const ID = 'peel-tear-and-drag';
  if (!window.Stage) { console.warn(ID + ': load stage.js before this file'); return; }

  const DEFAULTS = {
    dir: 'ltr', hold: null, phoneHold: 2.6, phone: 'vertical', scrub: null, object: 'jet',
    tint: 0.35, len: 0.8, phoneLen: 0.62, grow: 1.25, phoneGrow: 1.15, apex: null, sweep: null, bleed: true, shadow: true, veil: true,
  };
  const DPR = () => Math.min(2, window.devicePixelRatio || 1);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // ---------------------------------------------------------------------------------------------------------
  // The fallback object: a white twin-engine freighter seen from straight above, nose right, drawn on a
  // 1000 x 1000 box (length 1000, span 982). Flat tones; soft shading is flat shapes blurred once, never a
  // gradient. It is painted once into a bitmap, so it composites as a plain image while it moves.
  const J = {
    fus: 'M4 494 C60 486 150 459 250 455 L870 455 C940 455 990 470 1000 500 C990 530 940 545 870 545 L250 545 C150 541 60 514 4 506 Z',
    wing: 'M604 455 L330 22 C320 12 306 8 292 9 L284 20 L400 296 L388 455 Z',
    stab: 'M206 463 L84 318 C77 311 66 308 54 309 L50 318 L114 467 Z',
    eng: 'M594 318 C600 326 600 358 594 366 L474 370 L444 358 L444 326 L474 314 Z',
  };
  const flip = (d) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (m, x, y) => `${x} ${1000 - +y}`);
  const both = (d, a = '') => `<path d="${d}"${a}/><path d="${flip(d)}"${a}/>`;
  const JET_SPAN = 0.982;
  const SHADOW_PAD = 0.08;   // padding round the shadow, as a share of the object's length
  const jetSVG = (brand) => {
    const win = Array.from({ length: 26 }, (_, i) => `<rect x="${300 + i * 22}" y="${i % 9 === 4 ? 462 : 463}" width="9" height="${i % 9 === 4 ? 9 : 5}" rx="2"/>`).join('');
    const seams = [330, 420, 520, 640, 760, 860].map((x) => `<path d="M${x} 457 L${x} 543"/>`).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
<defs>
<filter id="b3" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="3"/></filter>
<filter id="b8" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="8"/></filter>
<filter id="b16" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="16"/></filter>
<clipPath id="f"><path d="${J.fus}"/></clipPath>
<clipPath id="w">${both(J.wing)}</clipPath>
<clipPath id="e">${both(J.eng)}</clipPath>
<clipPath id="s">${both(J.stab)}</clipPath>
</defs>
<g fill="#cfd4db">${both('M560 318 L600 300 L612 300 L612 318 Z')}</g>
<g fill="#eceef1">${both(J.eng)}</g>
<g clip-path="url(#e)">
<g fill="#aeb6c2" filter="url(#b8)">${both('M440 300 L610 300 L610 318 L440 318 Z')}${both('M440 366 L610 366 L610 384 L440 384 Z')}</g>
<g fill="#ffffff" filter="url(#b3)">${both('M470 334 L586 334 L586 346 L470 346 Z')}</g>
<g fill="#262c36">${both('M584 300 L604 300 L604 384 L584 384 Z')}</g>
<g fill="#5d6673">${both('M588 304 L604 304 L604 380 L588 380 Z')}</g>
<g fill="#8a929e">${both('M456 330 L424 342 L456 354 Z')}</g>
</g>
<g fill="#eef0f3">${both(J.wing)}</g>
<g clip-path="url(#w)">
<g fill="#dde1e7">${both('M440 455 L330 250 L306 30 L280 20 L400 296 L388 455 Z')}</g>
<g fill="#e6e9ee">${both('M486 455 L370 250 L340 56 L330 250 L440 455 Z')}</g>
<g fill="#ffffff" opacity=".9">${both('M604 455 L330 22 L338 40 L590 455 Z')}</g>
<g fill="none" stroke="#c3c9d2" stroke-width="2">${both('M470 455 L352 150')}${both('M430 455 L330 200')}${both('M560 455 L320 60')}</g>
<g fill="#9fa8b5" opacity=".55" filter="url(#b16)">${both('M620 455 L540 400 L470 455 Z')}</g>
<g fill="${brand}">${both('M334 24 L322 12 L300 9 L292 9 L298 22 Z')}</g>
</g>
<g fill="#eef0f3">${both(J.stab)}</g>
<g clip-path="url(#s)">
<g fill="#dde1e7">${both('M136 465 L70 324 L54 314 L114 467 Z')}</g>
<g fill="${brand}">${both('M92 330 L84 318 L66 309 L56 310 L60 320 Z')}</g>
</g>
<g fill="#e3e7ec">${both('M380 455 C430 430 560 430 640 455 Z')}</g>
<path d="${J.fus}" fill="#f7f8f9"/>
<g clip-path="url(#f)">
<g fill="#b8c0cb" filter="url(#b8)"><path d="M-10 436 L1010 436 L1010 462 L-10 462 Z"/><path d="M-10 538 L1010 538 L1010 564 L-10 564 Z"/></g>
<path d="M-10 484 L1010 484 L1010 516 L-10 516 Z" fill="#ffffff" filter="url(#b8)"/>
<g fill="#5d6673">${win}</g>
<g fill="none" stroke="#d3d8df" stroke-width="2">${seams}</g>
<g fill="none" stroke="#aab2bd" stroke-width="2"><rect x="880" y="459" width="22" height="12" rx="2"/><rect x="250" y="459" width="20" height="12" rx="2"/></g>
<path d="M168 440 L214 440 L214 560 L168 560 Z" fill="${brand}"/>
<path d="M952 476 C963 481 971 490 973 500 C971 510 963 519 952 524 L947 517 C955 513 960 507 961 500 C960 493 955 487 947 483 Z" fill="#1a2233"/>
</g>
<path d="M30 500 C60 497 150 495.5 226 496.5 L232 500 L226 503.5 C150 504.5 60 503 30 500 Z" fill="#dfe3e8"/>
<path d="M30 501 C60 503 150 504.5 226 503.5 L232 500" fill="none" stroke="#a7afba" stroke-width="2"/>
</svg>`;
  };
  const jetShadowSVG = () => {
    const p = SHADOW_PAD * 1000, s = 1000 + 2 * p;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-p} ${-p} ${s} ${s}" width="${s}" height="${s}"><defs><filter id="sh" x="-15%" y="-15%" width="130%" height="130%"><feGaussianBlur stdDeviation="15"/></filter></defs><g fill="#000" filter="url(#sh)"><path d="${J.fus}"/>${both(J.wing)}${both(J.stab)}${both(J.eng)}</g></svg>`;
  };
  // Everything the scene makes is handed to the page as a plain bitmap <img>: a composited image keeps its
  // raster however it is scaled, where a drawing or a canvas inside a scaled box is painted again each frame.
  const BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  const toImg = (canvas, img) => new Promise((done) => {
    canvas.toBlob((blob) => {
      if (!blob) return done();
      const old = img.dataset.blob;
      img.src = img.dataset.blob = URL.createObjectURL(blob);
      img.decode().catch(() => {}).then(() => { if (old) URL.revokeObjectURL(old); done(); });
    }, 'image/png');
  });
  // paint a self-contained SVG at a given pixel size into an <img>; hands the canvas to `then` first
  const paintSvg = (img, svg, size, then) => {
    img.dataset.px = size;
    const src = new Image();
    src.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    return src.decode().then(() => {
      if (+img.dataset.px !== size) return;   // a newer size was asked for meanwhile
      const c = document.createElement('canvas');
      c.width = size; c.height = size;
      c.getContext('2d').drawImage(src, 0, 0, size, size);
      if (then) then(c);
      return toImg(c, img);
    }).catch(() => {});
  };
  // a black, blurred silhouette of the page's own cut-out, drawn once at half size
  const shadowFromImage = (img, out) => {
    const draw = () => {
      const w = Math.max(2, Math.round(Math.min(1400, img.naturalWidth) / 2)), h = Math.max(2, Math.round((w * img.naturalHeight) / img.naturalWidth));
      const pad = Math.round(w * SHADOW_PAD);
      const c = document.createElement('canvas');
      c.width = w + pad * 2; c.height = h + pad * 2;
      out.width = c.width; out.height = c.height;
      const x = c.getContext('2d');
      x.filter = `blur(${Math.round(w * 0.012)}px)`;
      x.drawImage(img, pad, pad, w, h);
      x.filter = 'none';
      x.globalCompositeOperation = 'source-in';
      x.fillStyle = '#000';
      x.fillRect(0, 0, c.width, c.height);
      try { toImg(c, out); } catch {}   // a cut-out served without CORS gets no shadow
    };
    if (img.complete && img.naturalWidth) draw(); else img.decode().then(draw).catch(() => {});
  };

  // The object's outline, read once from its pixels: for 40 bands across it, the opaque runs along it as
  // fractions of its length from the nose. It tells the clip where the wings are, and the words when the
  // tail has passed them. Null when the pixels cannot be read (a cut-out from another origin without CORS).
  const outline = (src, w0, h0) => {
    if (!w0 || !h0) return null;
    const w = 220, h = Math.max(24, Math.round((w * h0) / w0));
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d', { willReadFrequently: true });
    let d;
    try { x.drawImage(src, 0, 0, w, h); d = x.getImageData(0, 0, w, h).data; } catch { return null; }
    const B = 40, bands = [];
    for (let b = 0; b < B; b++) {
      const j0 = Math.floor((b * h) / B), j1 = Math.max(j0 + 1, Math.floor(((b + 1) * h) / B));
      const runs = [];
      let on = -1;
      for (let i = w - 1; i >= -1; i--) {
        let a = false;
        if (i >= 0) for (let j = j0; j < j1 && !a; j++) a = d[(j * w + i) * 4 + 3] > 96;
        if (a && on < 0) on = i;
        if (!a && on >= 0) { runs.push([(w - 1 - on) / w, (w - 1 - i) / w]); on = -1; }
      }
      bands.push({ g0: j0 / h - 0.5, g1: j1 / h - 0.5, runs, rear: runs.length ? runs[runs.length - 1][1] : -1 });
    }
    return bands.some((b) => b.runs.length) ? bands : null;
  };
  // The clip that hides under the object: a point under the fuselage (apex, share of the length behind the
  // nose) and a slant for each side (k: how far back the seam runs per unit across the object) that keep the
  // seam inside the wing on both sides, out to where the stage ends (gEdge).
  const fitSeam = (bands, gEdge) => {
    if (!bands) return null;
    const inRun = (b, f) => { for (const [a0, a1] of b.runs) if (f > a0 && f < a1) return Math.min(f - a0, a1 - f) / (a1 - a0); return -1; };
    const core = bands.filter((b) => b.g0 < 0.02 && b.g1 > -0.02);
    let best = null;
    for (let apex = 0.2; apex <= 0.651; apex += 0.01) {
      if (core.some((b) => inRun(b, apex) < 0)) continue;   // the point itself must sit under the fuselage
      const side = (sg) => {
        let bk = 0, bs = -1;
        for (let k = 0; k <= 1.6; k += 0.02) {
          let sc = 0;
          for (const b of bands) {
            const g = (b.g0 + b.g1) / 2;
            if (g * sg <= 0.03 || Math.abs(g) > gEdge) continue;
            const c = inRun(b, apex + k * Math.abs(g));
            if (c >= 0) sc += 1 + c;
          }
          if (sc > bs + 1e-6) { bs = sc; bk = k; }
        }
        return [bk, bs];
      };
      const [kt, st] = side(-1), [kb, sb] = side(1);
      if (!best || st + sb > best.score) best = { apex, kt, kb, score: st + sb };
    }
    return best;
  };

  // ---------------------------------------------------------------------------------------------------------
  // Cloud from ordinary photographs: bright, neutral pixels become cloud, dark and coloured ones clear, colour
  // goes to a cool grey-white; towards the frame only the densest cloud survives, so a piece ends in cloud-
  // shaped edges rather than a soft box. Done once, then handed back as a bitmap <img>. The photo must come
  // with CORS (crossorigin="anonymous").
  const smooth = (e0, e1, v) => { const t = clamp((v - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
  const keyCloud = (img, piece) => {
    const nw = img.naturalWidth, nh = img.naturalHeight;
    if (!nw) return Promise.resolve();
    const cr = (img.dataset.crop || '0 0 1 1').trim().split(/[\s,]+/).map(Number);
    const [sx, sy, sw, sh] = cr.length === 4 && cr.every((v) => v >= 0 && v <= 1) ? [cr[0] * nw, cr[1] * nh, cr[2] * nw, cr[3] * nh] : [0, 0, nw, nh];
    const kv = (img.dataset.key || '').trim().split(/[\s,]+/).map(Number);
    const [lo, hi] = kv.length === 2 && kv.every((v) => v > 0 && v < 1.5) ? kv : [0.56, 0.72];
    const turn = ((Math.round((+img.dataset.turn || 0) / 90) * 90) % 360 + 360) % 360;
    const side = turn % 180 !== 0;
    const w = 1100, h = Math.round(side ? (w * sw) / sh : (w * sh) / sw);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    piece.width = w; piece.height = h;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.translate(w / 2, h / 2);
    x.rotate((turn * Math.PI) / 180);
    if (img.hasAttribute('data-flip')) x.scale(-1, 1);
    const dw = side ? h : w, dh = side ? w : h;
    x.drawImage(img, sx, sy, sw, sh, -dw / 2, -dh / 2, dw, dh);
    let px;
    try { px = x.getImageData(0, 0, w, h); } catch {
      console.warn(ID + ': a cloud photo without CORS cannot be keyed; add crossorigin="anonymous" or use an alpha cut-out', img.src);
      piece.hidden = true;
      return Promise.resolve();
    }
    const d = px.data;
    for (let j = 0; j < h; j++) {
      const v = (j / (h - 1)) * 2 - 1, v4 = v * v * v * v;
      for (let i = 0; i < w; i++) {
        const u = (i / (w - 1)) * 2 - 1, q = (i + j * w) * 4;
        const frame = 1 - smooth(0.78, 1, Math.pow(u * u * u * u + v4, 0.25));   // a rounded box
        if (frame <= 0) { d[q + 3] = 0; continue; }
        const R = d[q] / 255, G = d[q + 1] / 255, B = d[q + 2] / 255;
        const L = 0.3 * R + 0.59 * G + 0.11 * B, sat = Math.max(R, G, B) - Math.min(R, G, B);
        const lift = (1 - frame) * 0.45;
        const a = smooth(lo + lift, hi + lift, L - 0.6 * sat) * smooth(0, 0.35, frame);
        const t = smooth(0.38, 0.96, L);
        d[q] = 150 + 105 * t; d[q + 1] = 160 + 95 * t; d[q + 2] = 178 + 77 * t; d[q + 3] = 255 * a;
      }
    }
    // specks (roads, roofs, glints, noise in a sky) are not cloud: drop every patch smaller than 1/2500 of the piece
    const N = w * h, lab = new Int32Array(N), sizes = [0], minArea = Math.round(N / 2500);
    for (let s0 = 0; s0 < N; s0++) {
      if (lab[s0] || d[s0 * 4 + 3] < 64) continue;
      const id = sizes.length, st = [s0];
      let n = 0;
      lab[s0] = id;
      while (st.length) {
        const i = st.pop(), xx = i % w;
        n++;
        for (const k of [xx > 0 ? i - 1 : -1, xx < w - 1 ? i + 1 : -1, i - w, i + w]) if (k >= 0 && k < N && !lab[k] && d[k * 4 + 3] >= 64) { lab[k] = id; st.push(k); }
      }
      sizes.push(n);
    }
    for (let i = 0; i < N; i++) {
      const big = lab[i] ? sizes[lab[i]] >= minArea : [i - 1, i + 1, i - w, i + w].some((k) => k >= 0 && k < N && lab[k] && sizes[lab[k]] >= minArea);
      if (!big) d[i * 4 + 3] = 0;
    }
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.putImageData(px, 0, 0);
    return toImg(c, piece);
  };

  // ---------------------------------------------------------------------------------------------------------
  window.Scenes = window.Scenes || {};
  window.Scenes[ID] = (root, opts = {}) => {
    const o = { ...DEFAULTS, ...opts };
    const stage = root.querySelector(':scope > .scene-stage');
    if (!stage) return null;
    const q = (s) => stage.querySelector(s);
    const rtl = (opts.dir || root.dataset.dir) === 'rtl';
    root.dataset.dir = rtl ? 'rtl' : 'ltr';
    const oldEl = q('.drag-old'), newEl = q('.drag-new'), inner = q('.drag-new__inner');
    const ground = q('.drag-old__ground'), tint = q('.drag-old__tint'), line = q('.drag-old__line'), veil = q('.drag-veil');
    const W = () => stage.clientWidth || window.innerWidth;
    const H = () => stage.clientHeight || window.innerHeight;
    // a long list gets the dense layout (three columns, smaller rows), so 12 short rows still fit one screen
    const list = inner && inner.querySelector('.drag-new__items');
    if (list && list.children.length > 6) root.dataset.dense = ''; else delete root.dataset.dense;

    // the object, in its rig above both pages (never clipped)
    let rig = stage.querySelector(':scope > .drag-rig--object');
    if (!rig) { rig = document.createElement('div'); rig.className = 'drag-rig drag-rig--object'; rig.setAttribute('aria-hidden', 'true'); stage.appendChild(rig); }
    let obj = rig.querySelector('.drag-object');
    const isJet = !obj && o.object === 'jet';
    const bitmap = (cls, size) => { const i = new Image(size, size); i.className = cls; i.alt = ''; i.decoding = 'async'; i.src = BLANK; return i; };
    if (isJet) { obj = bitmap('drag-object drag-object--jet', 1000); rig.appendChild(obj); }
    const span = () => (isJet ? JET_SPAN : obj && obj.naturalWidth > 1 ? obj.naturalHeight / obj.naturalWidth : obj && obj.width && obj.height ? obj.height / obj.width : 1);

    // the shadow, in its own rig inside the new page (so it only ever falls on the new page) and under the
    // page's content (so it never lies on the words)
    let shade = newEl && newEl.querySelector('.drag-shadow');
    let srig = shade ? shade.closest('.drag-rig') : null;
    const { shadow: castShadow } = o;
    if (!shade && obj && newEl && castShadow !== false && (isJet || obj.tagName === 'IMG')) {
      srig = document.createElement('div'); srig.className = 'drag-rig drag-rig--shadow'; srig.setAttribute('aria-hidden', 'true'); newEl.insertBefore(srig, newEl.firstChild);
      shade = bitmap('drag-shadow', 600);
      srig.appendChild(shade);
      if (!isJet) shadowFromImage(obj, shade);
    }

    // the outline of the object (see outline()), read once its pixels are in
    let bands = null;
    let refreshSoon = 0;
    const gotOutline = (b) => {
      if (!b) return;
      bands = b;
      // the clip and the words both depend on it: measure again on the next refresh
      if (Stage.live && root.classList.contains('is-live')) { cancelAnimationFrame(refreshSoon); refreshSoon = requestAnimationFrame(() => ScrollTrigger.refresh()); }
    };
    if (obj && !isJet) {
      const read = () => gotOutline(outline(obj, obj.naturalWidth, obj.naturalHeight));
      if (obj.complete && obj.naturalWidth) read(); else obj.decode().then(read).catch(() => {});
    }

    // paint the built-in jet (and its shadow) at the size it will be seen
    const brand = getComputedStyle(root).getPropertyValue('--drag-dark').trim() || '#14204a';
    const paintJet = (L, grow) => {
      if (!isJet) return;
      const px = Math.min(2048, Math.max(600, Math.round(L * grow * DPR() / 100) * 100));
      if (+obj.dataset.px !== px) paintSvg(obj, jetSVG(brand), px, bands ? null : (c) => gotOutline(outline(c, c.width, c.height)));
      const spx = Math.round(Math.min(1200, px * 0.6) / 100) * 100;
      if (shade && +shade.dataset.px !== spx) paintSvg(shade, jetShadowSVG(), spx);
    };
    paintJet(0.8 * W() * 0.62, 1);

    // cloud photographs keyed into cut-outs: each source photo is swapped for a bitmap of its cloud
    if (veil) {
      for (const img of veil.querySelectorAll('img.drag-veil__piece[data-key]')) {
        const piece = new Image(1100, 690);
        piece.className = 'drag-veil__piece drag-veil__piece--keyed';
        piece.alt = '';
        piece.src = BLANK;
        img.replaceWith(piece);
        const go = () => keyCloud(img, piece);
        if (img.complete && img.naturalWidth) go(); else img.decode().then(go).catch(() => img.addEventListener('load', go, { once: true }));
      }
    }
    const pieces = veil && o.veil !== false ? [...veil.querySelectorAll(':scope > .drag-veil__piece')].slice(0, 7) : [];
    if (veil && o.veil === false) veil.hidden = true;
    const veilOn = pieces.length > 0;
    const hold = o.hold ?? (veilOn ? 3 : 2);
    const scrub = o.scrub ?? (Stage.lenis ? true : 0.6);
    // everything that moves is composited for as long as the scene runs (stage.css: [data-move])
    for (const el of [rig, srig, obj, shade, ground, veil, inner, line, ...pieces]) if (el) el.setAttribute('data-move', '');

    // The words of the new page land in the object's wake: each block of text appears once the object's
    // outline has passed it (the pictures it may cross), never before the block above it.
    const words = inner ? [...inner.children].flatMap((c) => (/^(UL|OL)$/.test(c.tagName) ? [...c.children] : [c]))
      .filter((c) => !c.matches('figure, picture, img, video, .drag-rig') && c.textContent.trim()) : [];
    // the fade sits on the elements that hold the text themselves, so each line's own opacity tells the truth
    const ink = words.map((b) => [b, ...b.querySelectorAll('*')].filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim())));
    // (an element inside another one that fades only switches, so the two opacities never multiply)
    const nested = ink.map((l) => l.map((e) => l.some((a) => a !== e && a.contains(e))));
    const shown = ink.map(() => -1);   // last value written, so an unchanged block is left alone
    const FADE = 0.05, GAP = 0.015;    // in drag progress: how long a block takes to land, and the step between blocks

    // geometry, measured on every refresh: object length in px, the seam (point and the depth of each side),
    // the --edge range in %, and when (in drag progress) each block of words may land
    const geo = { L: 0, apex: 0.5, d1: 0, d2: 0, from: -60, to: 160, vertical: false, landAt: [] };
    const measure = () => {
      if (!root.classList.contains('is-live')) return;
      const v = geo.vertical, along = v ? H() : W(), across = v ? W() : H();
      const grow = v ? o.phoneGrow : o.grow;
      const sp = Math.max(0.2, span());
      let L = (v ? o.phoneLen : o.len) * along;
      if (o.bleed !== false && obj) L = Math.max(L, (across * 1.04) / sp);
      const Lp = (L / along) * 100;
      geo.L = L;
      // the seam: given, or fitted to the outline, or a plain chevron
      const fit = o.apex == null && o.sweep == null ? fitSeam(bands, Math.min(0.5, across / 2 / (sp * L))) : null;
      if (fit) {
        geo.apex = fit.apex;
        geo.d1 = (fit.kt * across) / (2 * sp);
        geo.d2 = (fit.kb * across) / (2 * sp);
      } else {
        geo.apex = clamp(+o.apex || 0.5, 0.1, 0.9);
        geo.d1 = geo.d2 = Math.tan((clamp(+(o.sweep ?? 22) || 0, 0, 45) * Math.PI) / 180) * (across / 2);
      }
      const apex = geo.apex, ax = (1 - apex) * 100, axS = ((SHADOW_PAD + 1 - apex) / (1 + 2 * SHADOW_PAD)) * 100;
      geo.dp = (Math.max(geo.d1, geo.d2) / along) * 100;
      geo.from = -apex * Lp - 4;                    // nose just outside the frame
      geo.to = 100 + (1 - apex) * Lp * grow + 2;     // tail just outside the far side
      root.style.setProperty('--drag-len', L.toFixed(1) + 'px');
      root.style.setProperty('--drag-d', geo.d1.toFixed(1) + 'px');
      root.style.setProperty('--drag-d2', geo.d2.toFixed(1) + 'px');
      root.style.setProperty('--drag-ax', ax.toFixed(2) + '%');
      if (obj) gsap.set(obj, { xPercent: -ax, transformOrigin: `${ax}% 50%` });
      if (shade) gsap.set(shade, { xPercent: -axS, transformOrigin: `${axS}% 50%` });
      paintJet(L, grow);
      // each block: how far along the travel its words end, and the band across the travel they occupy, in px
      // of the stage, measured from the text's own line boxes against the page (so the tow cancels out)
      if (!inner) return;
      const ir = inner.getBoundingClientRect(), rg = document.createRange();
      const blocks = ink.map((l) => {
        let far = -Infinity, c0 = Infinity, c1 = -Infinity;
        for (const e of l) for (const nd of e.childNodes) {
          if (nd.nodeType !== 3 || !nd.nodeValue.trim()) continue;
          rg.selectNodeContents(nd);
          for (const r of rg.getClientRects()) {
            const x0 = r.left - ir.left, x1 = r.right - ir.left, y0 = r.top - ir.top, y1 = r.bottom - ir.top;
            far = Math.max(far, v ? H() - y0 : rtl ? W() - x0 : x1);
            c0 = Math.min(c0, v ? x0 : y0); c1 = Math.max(c1, v ? x1 : y1);
          }
        }
        return { far, c0, c1 };
      });
      // where the back of the object is at drag progress u, over the band a block occupies
      const back = (u, b) => {
        const s = 1 + (grow - 1) * u, A = ((geo.from + (geo.to - geo.from) * u) / 100) * along;
        let rear = 1;   // without an outline: the end of the object's box
        if (bands) {
          const hs = sp * L * s, g0 = (b.c0 - across / 2) / hs, g1 = (b.c1 - across / 2) / hs;
          rear = -1;
          for (const bd of bands) if (bd.g1 > g0 && bd.g0 < g1) rear = Math.max(rear, bd.rear);
          if (rear < 0) rear = apex;   // beyond the wingtips only the seam passes
        }
        return A + (apex - rear) * L * s;
      };
      const margin = 0.012 * along;
      let prev = -Infinity;
      geo.landAt = blocks.map((b) => {
        let u = 1;
        if (Number.isFinite(b.far)) {
          if (back(0, b) > b.far + margin) u = 0;
          else if (back(1, b) > b.far + margin) {
            let lo = 0, hi = 1;
            for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; if (back(m, b) > b.far + margin) hi = m; else lo = m; }
            u = hi;
          }
        }
        prev = Math.max(u, prev + GAP);
        return prev;
      });
    };
    const land = (u) => geo.landAt.forEach((at, i) => {
      const v = u >= 1 ? 1 : Math.round(clamp((u - at) / FADE, 0, 1) * 100) / 100;
      if (v === shown[i]) return;
      shown[i] = v;
      ink[i].forEach((e, k) => { e.style.opacity = String(nested[i][k] ? (v > 0 ? 1 : 0) : v); });
    });

    // The incoming page has to fit one held screen. When it does not (a long list, a short window), the
    // scene keeps its finished composition there rather than hide words below the stage, and checks again
    // whenever the window changes size.
    const overflows = () => {
      if (!inner) return false;
      const was = root.classList.contains('is-live');
      if (!was) root.classList.add('is-live');
      const over = inner.scrollHeight > inner.clientHeight + 4;
      if (!was) root.classList.remove('is-live');
      return over;
    };
    let fellBack = false;
    const tooTall = () => {
      if (!fellBack) console.warn(ID + ': the new page is taller than the screen here, so the scene shows its finished composition');
      fellBack = true;
      toRest();
    };

    let liveEdge = null;
    const drag = (vertical) => (tl) => {
      geo.vertical = vertical;
      if (overflows()) { tooTall(); return; }
      fellBack = false;
      if (document.fonts && document.fonts.status !== 'loaded') {
        document.fonts.ready.then(() => {
          if (!root.classList.contains('is-live') || !overflows()) return;
          if (tl.scrollTrigger) tl.scrollTrigger.kill();
          tl.revert();
          tooTall();
          ScrollTrigger.refresh();
        });
      }
      if (obj) gsap.set(obj, { x: 0, y: 0, yPercent: -50, rotation: vertical ? -90 : 0 });
      if (shade) gsap.set(shade, { yPercent: -50, rotation: vertical ? -90 : 0 });
      measure();
      const s = rtl && !vertical ? -1 : 1;
      const grow = vertical ? o.phoneGrow : o.grow;
      const t0 = veilOn ? (vertical ? 0.18 : 0.28) : 0.1, t1 = vertical ? 0.8 : 0.94, dur = t1 - t0;
      const tint0 = clamp(+o.tint || 0, 0, 0.7);
      const at = (edge) => t0 + ((edge - geo.from) / (geo.to - geo.from)) * dur;   // when --edge reaches a value

      // the old chapter closes: the line leaves, the view climbs and darkens, cloud closes into a deck
      // (text and pages fade by opacity, never visibility, so they stay in the accessibility tree)
      if (line) tl.fromTo(line, { opacity: 1, y: 0 }, { opacity: 0, y: () => -0.04 * H(), duration: vertical ? 0.08 : 0.09 }, 0.04);
      if (ground) tl.fromTo(ground, { scale: vertical ? 1.10 : 1.14 }, { scale: 1, duration: vertical ? 0.36 : 0.40 }, 0);
      if (tint && ground) {
        // the flat tint is the old panel's own colour showing through the photo: one layer fewer to composite
        gsap.set(oldEl, { backgroundColor: getComputedStyle(tint).backgroundColor });
        gsap.set(tint, { display: 'none' });
        tl.fromTo(ground, { opacity: 1 - tint0 }, { opacity: 0.25, duration: 0.26 }, 0.05);
      } else if (tint) tl.fromTo(tint, { opacity: tint0 }, { opacity: 0.75, duration: 0.26 }, 0.05);
      if (veilOn) {
        const use = vertical ? pieces.slice(0, 4) : pieces;
        const from = vertical ? [3, 2.6, 2.4, 2.2] : [4, 3.4, 3, 2.8, 2.6, 2.4, 2.2];
        if (pieces.length > use.length) gsap.set(pieces.slice(use.length), { autoAlpha: 0 });
        // the first two (on the right) come while the line is still there; the rest once it has nearly gone;
        // every piece ends fully opaque, so by the time the nose breaks out the frame is a deck of cloud
        // (a piece settles in scale first and firms up after, so the frame is crisp cloud rather than a milky wash)
        const when = vertical ? [0.05, 0.08, 0.11, 0.14] : [0.05, 0.08, 0.11, 0.13, 0.15, 0.17, 0.19];
        use.forEach((p, i) => {
          const d = vertical ? 0.16 : 0.17;
          tl.fromTo(p, { scale: from[i] }, { scale: 1, duration: d, ease: 'power1.out' }, when[i]);
          tl.fromTo(p, { autoAlpha: 0 }, { autoAlpha: 1, duration: d, ease: 'power1.inOut' }, when[i]);
        });
        // the deck drifts back against the flight as the plane passes over it
        tl.fromTo(veil, { scale: 1, xPercent: 0, yPercent: 0 }, vertical ? { scale: 0.88, yPercent: 10, duration: 0.56 } : { scale: 0.9, xPercent: -9 * s, duration: 0.58 }, vertical ? 0.3 : 0.36);
      }

      // THE DRAG. The clip reads --edge; both rigs move by the same number as a % of the stage, in the
      // same window, linear (the scrub gives the weight). The object scales about the clip's point.
      const rigPos = (e) => (vertical || rtl ? 100 - e : e);
      const rigs = [rig, srig].filter(Boolean);
      gsap.set(rigs, { x: 0, y: 0, xPercent: 0, yPercent: 0 });
      if (words.length) { gsap.set(ink.flat(), { opacity: 0 }); shown.fill(0); }
      liveEdge = gsap.fromTo(newEl, { '--edge': () => geo.from }, { '--edge': () => geo.to, duration: dur, ease: 'none', onUpdate() { land(this.progress()); } });
      tl.add(liveEdge, t0);
      tl.fromTo(rigs, vertical ? { yPercent: () => rigPos(geo.from) } : { xPercent: () => rigPos(geo.from) }, vertical ? { yPercent: () => rigPos(geo.to), duration: dur } : { xPercent: () => rigPos(geo.to), duration: dur }, t0);
      if (obj) tl.fromTo(obj, { scaleX: s, scaleY: 1 }, { scaleX: grow * s, scaleY: grow, duration: dur }, t0);
      if (shade) {
        tl.fromTo(shade,
          vertical ? { x: () => -0.05 * W(), y: () => 0.04 * H(), scale: 0.92, opacity: 0.30 } : { x: () => -0.03 * W() * s, y: () => 0.06 * H(), scaleX: 0.92 * s, scaleY: 0.92, opacity: 0.32 },
          vertical ? { x: () => -0.05 * W(), y: () => 0.09 * H(), scale: 0.66, opacity: 0.14, duration: dur } : { x: () => -0.08 * W() * s, y: () => 0.12 * H(), scaleX: 0.62 * s, scaleY: 0.62, opacity: 0.14, duration: dur },
          t0);
      }
      // the new page lags and settles, as if towed
      if (inner) tl.fromTo(inner, vertical ? { yPercent: 5 } : { xPercent: -6 * s }, { xPercent: 0, yPercent: 0, duration: 0.5, ease: 'power2.out' }, t0 + 0.1);
      // nothing is composited that cannot be seen: the new page waits for the clip's point, the old chapter
      // goes once the clip is fully open (0.95 at the latest)
      tl.fromTo(newEl, { opacity: 0 }, { opacity: 1, duration: 0.001 }, Math.max(t0, at(-2)));
      if (oldEl) tl.fromTo(oldEl, { opacity: 1 }, { opacity: 0, duration: 0.001 }, Math.min(0.95, at(100 + geo.dp) + 0.01));
      // a still hold on the finished page
      tl.to({}, { duration: 1 - t1 }, t1);
    };

    // Switching between the live layouts and the finished composition (resize, reduced motion turned on)
    // starts each one from the page's own inline styles, with no transform left behind by the last one.
    const touched = [rig, srig, obj, shade, ground, tint, line, veil, oldEl, newEl, inner, ...pieces, ...ink.flat()].filter(Boolean);
    const own = touched.map((el) => el.getAttribute('style'));
    const clean = () => {
      if (!Stage.live) return;
      gsap.set(touched, { clearProps: 'all' });
      touched.forEach((el, i) => (own[i] == null ? el.removeAttribute('style') : el.setAttribute('style', own[i])));
      shown.fill(-1);
      liveEdge = null;
    };
    const built = (vertical) => { const b = drag(vertical); return (tl) => { clean(); b(tl); }; };
    const toRest = () => { root.classList.remove('is-live'); root.classList.add('is-rest'); root.style.removeProperty('--hold'); clean(); };
    const start = () => Stage.scene(root, {
      hold, scrub,
      build: built(false),
      phone: o.phone === 'rest' ? 'rest' : { hold: o.phoneHold, build: built(true) },
      rest: clean,
    });
    if (!Stage.live) return start();

    // very small screens keep the finished composition; elsewhere the scene runs, and its listeners live
    // exactly as long as it does
    const outer = gsap.matchMedia();
    outer.add({ fits: '(min-width: 360px) and (min-height: 560px)', small: '(max-width: 359px), (max-height: 559px)' }, (c) => {
      if (!c.conditions.fits) { toRest(); return () => root.classList.remove('is-rest'); }
      let m = start();
      // a refresh (resize, fonts) re-renders the timeline without callbacks, so the words are set again after it
      const onRefreshInit = () => measure();
      const onRefresh = () => { if (liveEdge && root.classList.contains('is-live')) { shown.fill(-1); land(liveEdge.progress()); } };
      // a window that has shrunk below the new page falls back to the finished composition, and one that has
      // grown enough for it gets the live scene back
      let wait = 0;
      const onResize = () => {
        clearTimeout(wait);
        wait = setTimeout(() => {
          const live = root.classList.contains('is-live'), over = overflows();
          if (!(live && over) && !(!live && fellBack && !over)) return;
          if (m) m.revert();
          clean();
          m = start();   // its build checks the fit again and keeps the finished composition where the page is too tall
          ScrollTrigger.refresh();
        }, 250);
      };
      ScrollTrigger.addEventListener('refreshInit', onRefreshInit);
      ScrollTrigger.addEventListener('refresh', onRefresh);
      window.addEventListener('resize', onResize);
      return () => {
        ScrollTrigger.removeEventListener('refreshInit', onRefreshInit);
        ScrollTrigger.removeEventListener('refresh', onRefresh);
        window.removeEventListener('resize', onResize);
        clearTimeout(wait);
        cancelAnimationFrame(refreshSoon);
        if (m) m.revert();
        clean();
      };
    });
    return outer;
  };
})();
