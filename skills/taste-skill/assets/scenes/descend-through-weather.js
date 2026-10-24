// tasteskill / scenes / descend-through-weather.js — the hero sinks through a cloud deck onto the place below.
//
// A held full-bleed photograph is a camera going down through the weather. The giant place name creeps
// up and loses focus while two cloud layers rise past it at different speeds; a soft wall of cloud then
// fills the frame with mist while one line in the display face rises slowly through it; the frame clears
// from the bottom, under a ceiling of cloud, onto a second photograph where a two-line statement rises
// out of its masks. A signature hero exit for travel, hospitality, outdoor, architecture or wellness pages
// with two strong pictures.
//
// The clouds are real photographs of cloud, keyed to transparency when the scene starts: bright cloud
// stays, darker sky or ground drops out, and the cloud whites are graded to --mist exactly so they meet
// the flat mist of the deck without a seam. The cutting runs in a Worker (OffscreenCanvas), so the page
// never stalls while it is scrolled; the finished art is handed to the layers one per frame, and the
// deck's art is swapped in only while the scene is still or the deck is off screen. Without Worker
// support it runs on the main thread in small slices. Give it one photograph of a cloud sea seen from
// above (tops) and one of fog drifting over darker ground (wisps). Their pixels are read, so they must be
// same-origin or served with CORS (Access-Control-Allow-Origin). Without them it cuts its cloud from the
// lower part of the first photograph. If pixels cannot be read, the deck still rises as a soft flat wall
// of mist and nothing breaks. No gradients anywhere: soft edges are keyed photographs or blurred flat fills.
//
// DOM. The script builds the title copies, cloud layers, deck, haze and ground band itself.
//
//   <section class="scene" data-scene="descend-through-weather" aria-label="Skarven, from the ridge to the sound"
//            data-options='{"tops": "cloud-sea.jpg", "wisps": "fog.jpg"}'>
//     <div class="scene-stage">
//       <figure class="wx-above"><img src="above.jpg" alt="…" width="2400" height="1600" fetchpriority="high"></figure>
//       <header class="wx-hero">
//         <h1 class="wx-title">Skarven</h1>                      one word, 4-10 letters (h2 mid-page)
//         <p class="wx-tagline">One sentence of 8-14 words.</p>
//       </header>
//       <p class="wx-note">Inside the cloud, 800 metres up</p>    3-7 words, the line on the white
//       <figure class="wx-below"><img src="below.jpg" alt="…" width="2400" height="1500" loading="eager"></figure>
//       <h2 class="wx-statement">                                  two lines (house rule: headlines two lines)
//         <span class="wx-line">Below the cloud,</span>
//         <span class="wx-line">the whole sound opens.</span>
//       </h2>
//     </div>
//   </section>
//
// Pictures. Above: the view on top of the weather, landscape: a peak, ridge or headland over a cloud sea
// under a blue or dusk sky. Give it contrast for the weather to swallow (dark rock, a saturated sky): a
// photograph that is already white makes the descent read as a fade to white. Its lower third holds the
// title (white by default, so keep it mid to dark there, or set --on-above dark for a pale one). Below:
// an aerial or high view of the place, its top quarter the palest part (hazy sky), its bottom third dark
// and calm (it fades into --ground), warmer and more saturated than the first so the descent reads as
// arriving. Both at least 2400px wide. --above-pos / --below-pos set their object-position (the phone
// crops them to portrait).
//
// Tokens (set on :root or the section): --mist (#eef2f4, the cloud and the deck; match it to the
// brightest cloud in the first photograph), --on-mist (#1c2329: the note on the white), --on-above (#fff:
// the title on the first photograph), --on-sky (--on-mist: the tagline, set in the calm sky), --ground
// (#12201e, sample it from the dark bottom of the second photograph; the next section uses it),
// --on-ground (#f4f1ea, the statement), --font-display, --font-text. A dusk or smoke variant: a dark
// --mist (#15120f) with --on-mist white; the keyed cloud takes the dark tone.
//
// Options (data-options JSON). Default, then range:
//   hold         3        screens the stage is held on desktop (2.4-4)
//   phoneHold    2.2      screens held under 768px (1.8-3)
//   phone        'same'   'same' runs the phone plan (smaller numbers, a narrower far cloud); 'rest'
//                         shows the finished composition on phones
//   scrub        auto     true when Lenis smooths the page, else 0.8 (seconds of catch-up)
//   tops         photo A  URL of a cloud-sea photograph seen from above (keyed into the far cloud, the
//                         deck's top edge and, turned over, the cloud ceiling below)
//   topsCrop     [0,0,1,1]   part of it to use, as fractions [left, top, right, bottom]
//                         (without `tops`: [0, 0.5, 1, 1] of photo A)
//   wisps        tops     URL of fog over darker ground (keyed into the near veil)
//   wispsCrop    [0,0,1,1]
//   art          'key'    'key' keys ordinary photographs; 'alpha' takes ready-made transparent cloud art
//                         as it is (still read through CORS)
//   fill         0.86     share of the width the title is fitted to (0.6-0.94); held under 36% of the
//                         height, so very wide screens keep the word inside the bottom band. Phones fit
//                         it 0.1 wider (up to 0.98).
//   blur         14       px of blur on the lost title copy (8-16); the soft copy carries a third of it
//   feather      60       svh of soft cloud edge on each side of the deck (40-80; softer is calmer)
//   phoneFeather 40       the same under 768px (30-60)
//   settle       1.2      scale photo B settles from (1.08-1.25); phone 1.12
//
// The root also gets data-sky="above" | "in" | "below" as the scene plays (in = 0.44-0.60), so a fixed
// nav can change colour: body:has([data-sky="in"]) .nav { color: … }. It is removed whenever the scene
// shows its finished composition.
//
// Progress map (desktop, hold 3): 0 photo A still, the white title sharp at about 66-95svh over the dark
// foot of the picture, tagline read in the sky, a 4svh cloud lip below the title. 0-50% photo A zooms 1
// to 1.12 and drifts up 8svh; the title rises 42svh (0.28x). 10-20% a 5px copy of the title fades in over
// it and 17-25% the sharp copy leaves (soft, still read to about 24%); 28-40% the 14px copy takes over;
// 30-48% the word fades to a ghost and out. 14-22% the tagline leaves. Far cloud 96 to 14svh (0.55x),
// near veil 118 to -30svh (1.07x, scale 1.25). 24-48% the deck rises 100 to -60svh (power1.in) and the
// frame is mist from 48%; 42-58% the note rises 14 to -14svh through the mist (read 45-55%). 50% photo
// A, title and clouds are switched off under the deck; photo B settles 1.2 to 1 (to 100%, power2.out).
// 41-48% photo A pales to 0.4 into the mist. 52-78% the deck leaves upward (power1.out) and the frame
// clears from the bottom through thinning, pale cloud; 54-86% a cloud ceiling with grey undersides lifts
// off the top behind it (a 64svh layer, 6 to -64svh, its dense part held in the top third); 58-84% the
// haze clears; 66-80% the ground band darkens the bottom; 74-85% the statement rises line by line;
// 85-100% held.
// Phone (hold 2.2): the far cloud on a narrower layer (100 to 8svh); the near veil 112 to -30svh, scale
// 1.15, no sideways drift; the title fitted to 0.96 of the width, rising 30svh with a 10px lost copy;
// deck feathers of 40svh (180svh deck); ceiling 5 to -50svh; photo B settles from 1.12. Same fractions.
//
// Finished composition (no script, reduced motion, phone 'rest'): photo A with the title, a seam of
// mist carrying the note, photo B with the statement. With the script present the seam's edges are the
// keyed cloud (cloud tops above, the turned-over cloud below); without it, a soft flat band.
(() => {
  const ID = 'descend-through-weather';
  const num = (v, d, a, b) => (typeof v === 'number' && isFinite(v) ? clamp(v, a, b) : d);
  const box = (v, d) => (Array.isArray(v) && v.length === 4 && v.every((n) => typeof n === 'number') ? v.map((n) => clamp(n, 0, 1)) : d);

  const settings = (opts) => {
    const o = opts || {};
    return {
      hold: num(o.hold, 3, 2.4, 4),
      phoneHold: num(o.phoneHold, 2.2, 1.8, 3),
      phone: o.phone === 'rest' ? 'rest' : 'same',
      scrub: typeof o.scrub === 'boolean' ? o.scrub : typeof o.scrub === 'number' ? clamp(o.scrub, 0, 2) : null,
      tops: typeof o.tops === 'string' && o.tops ? o.tops : '',
      wisps: typeof o.wisps === 'string' && o.wisps ? o.wisps : '',
      topsCrop: box(o.topsCrop, null),
      wispsCrop: box(o.wispsCrop, null),
      art: o.art === 'alpha' ? 'alpha' : 'key',
      fill: num(o.fill, 0.86, 0.6, 0.94),
      blur: num(o.blur, 14, 8, 16),
      feather: num(o.feather, 60, 40, 80),
      phoneFeather: num(o.phoneFeather, 40, 30, 60),
      settle: num(o.settle, 1.2, 1.08, 1.25),
    };
  };

  // ---------- pure helpers (also sent to the worker as source, so they stay plain functions) ----------

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function ss(a, b, x) { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }

  // The part of the picture to draw into a w x h canvas: trimmed at the sides when it is wider than
  // needed, a band out of its height when it is much taller (clouds may stretch sideways up to 1.8x).
  function cropRect(iw, ih, crop, w, h) {
    let sx = crop[0] * iw, sy = crop[1] * ih, sw = Math.max(1, (crop[2] - crop[0]) * iw), sh = Math.max(1, (crop[3] - crop[1]) * ih);
    const A = w / h, C = sw / sh, MAX = 1.8;
    if (C > A) { const nw = sh * A; sx += (sw - nw) / 2; sw = nw; }
    else if (C < A / MAX) { const nh = sw / (A / MAX); sy += (sh - nh) / 2; sh = nh; }
    return [Math.round(sx), Math.round(sy), Math.max(1, Math.round(sw)), Math.max(1, Math.round(sh))];
  }

  // Keying. edge: 'top' (soft edge at the top, solid toward the bottom), 'bottom', or 'all' (a veil, no
  // solid part). Along the soft edge only the brightest crests survive; deeper in, the threshold slides
  // down until the darkest troughs fill too, so the cloud turns solid along its own shapes instead of along
  // a straight line. Split in passes over rows so the main-thread fallback can give frames back between.
  function keyLum(p, lum, hist, j0, j1) {
    for (let j = j0, i = j0 * 4; j < j1; j++, i += 4) {
      const L = (0.2126 * p[i] + 0.7152 * p[i + 1] + 0.0722 * p[i + 2]) / 255;
      lum[j] = L;
      hist[(L * 255) | 0]++;
    }
  }
  function keyPlan(w, h, k, hist) {
    const n = w * h;
    const pct = (q) => { let s = 0; const t = q * n; for (let b = 0; b < 256; b++) { s += hist[b]; if (s >= t) return b / 255; } return 1; };
    const lo = pct(k.qLo), hi = Math.max(lo + 0.14, pct(k.qHi));
    const rowShift = new Float32Array(h), rowFade = new Float32Array(h), rowSolid = new Float32Array(h), rowMist = new Float32Array(h);
    for (let y = 0; y < h; y++) {
      const v = y / (h - 1);
      if (k.edge === 'all') { rowFade[y] = ss(0, k.vside, v) * ss(0, k.vside, 1 - v); continue; }
      const e = k.edge === 'top' ? v : 1 - v;           // distance from the soft edge
      rowShift[y] = k.crest * (1 - ss(0, k.soft, e)) - ss(k.fill[0], k.fill[1], e);
      rowFade[y] = ss(0, k.fade, e);
      rowSolid[y] = ss(0.95, 1, e);                      // the far border is solid for certain
      rowMist[y] = ss(k.fill[0], Math.min(1, k.fill[1] + 0.05), e);
    }
    const colZ = new Float32Array(w);
    for (let x = 0; x < w; x++) { const u = x / (w - 1); colZ[x] = ss(0, k.side, u) * ss(0, k.side, 1 - u); }
    return { lo, hi, rowShift, rowFade, rowSolid, rowMist, colZ };
  }
  function keyRows(p, lum, w, k, P, y0, y1) {
    const [sr, sg, sb] = k.shade, [lr, lg, lb] = k.light, [mr, mg, mb] = k.mist;
    const { lo, hi, rowShift, rowFade, rowSolid, rowMist, colZ } = P;
    for (let y = y0, j = y0 * w; y < y1; y++) {
      const sh = rowShift[y], fade = rowFade[y] * k.gain, solid = rowSolid[y], mix = rowMist[y];
      const a0 = lo + sh, a1 = hi + sh * 0.6;
      for (let x = 0; x < w; x++, j++) {
        const L = lum[j];
        let a = ss(a0, a1, L) * fade;
        if (a < solid) a = solid;
        a *= colZ[x];
        const t = ss(lo, hi, L);
        let r = sr + (lr - sr) * t, gg = sg + (lg - sg) * t, b = sb + (lb - sb) * t;
        r += (mr - r) * mix; gg += (mg - gg) * mix; b += (mb - b) * mix;
        const i = j * 4;
        p[i] = r; p[i + 1] = gg; p[i + 2] = b; p[i + 3] = a * 255;
      }
    }
  }
  function keyAll(p, w, h, k) {
    const lum = new Float32Array(w * h), hist = new Uint32Array(256);
    keyLum(p, lum, hist, 0, w * h);
    keyRows(p, lum, w, k, keyPlan(w, h, k, hist), 0, h);
  }

  // The worker: fetches and decodes the pictures, cuts every piece of art and sends it back as
  // ImageBitmaps (one per layer that shows it), so the main thread only hands them to the canvases.
  function workerMain() {
    const pics = new Map();
    const pic = (src) => {
      if (!pics.has(src)) {
        pics.set(src, fetch(src, { mode: 'cors', credentials: 'same-origin' }).then((res) => {
          if (!res.ok) throw new Error('cloud picture failed to load: ' + src + ' (' + res.status + ')');
          return res.blob();
        }).then((b) => createImageBitmap(b)));
      }
      return pics.get(src);
    };
    async function cut(job) {
      const img = await pic(job.src);
      const { w, h } = job;
      const c = new OffscreenCanvas(w, h);
      const g = c.getContext('2d', { willReadFrequently: !!job.k });
      const r = cropRect(img.width, img.height, job.crop, w, h);
      let part = null;
      try { part = await createImageBitmap(img, r[0], r[1], r[2], r[3], { resizeWidth: w, resizeHeight: h, resizeQuality: 'high' }); } catch (e) { part = null; }
      if (job.blur && 'filter' in g) g.filter = 'blur(' + job.blur.toFixed(2) + 'px)';
      if (job.flip) { g.translate(0, h); g.scale(1, -1); }
      if (part) { g.drawImage(part, 0, 0, w, h); part.close(); } else g.drawImage(img, r[0], r[1], r[2], r[3], 0, 0, w, h);
      g.setTransform(1, 0, 0, 1, 0, 0);
      if ('filter' in g) g.filter = 'none';
      if (job.k) {
        const d = g.getImageData(0, 0, w, h);
        keyAll(d.data, w, h, job.k);
        g.putImageData(d, 0, 0);
      } else if (job.shade) {
        g.globalCompositeOperation = 'source-atop';
        g.globalAlpha = 0.28;
        g.fillStyle = 'rgb(' + job.shade.map((n) => Math.round(n)).join(' ') + ')';
        g.fillRect(0, 0, w, h);
      }
      // the keyed canvas is CPU-backed (its pixels were read); copy it once into an ordinary canvas, which
      // the browser keeps on the GPU, so the bitmaps handed to the page need no upload when they show
      let src = c;
      if (job.k) {
        const gpu = new OffscreenCanvas(w, h);
        const gg = gpu.getContext('2d');
        if (gg) { gg.drawImage(c, 0, 0); src = gpu; }
      }
      const out = [];
      for (let i = 1; i < job.copies; i++) out.push(await createImageBitmap(src));
      out.push(src.transferToImageBitmap());
      return out;
    }
    self.onmessage = async (e) => {
      const { id, jobs } = e.data;
      try {
        for (let n = 0; n < jobs.length; n++) {
          const bitmaps = await cut(jobs[n]);
          self.postMessage({ id, n, bitmaps }, bitmaps);
        }
        self.postMessage({ id, done: true });
      } catch (err) {
        self.postMessage({ id, error: String((err && err.message) || err) });
      } finally {
        for (const p of pics.values()) p.then((b) => b.close(), () => {});
        pics.clear();
      }
    };
  }

  let worker = null, workerOff = false, seq = 0;
  const pending = new Map();
  const workerFailed = (why) => {
    workerOff = true;
    try { if (worker) worker.terminate(); } catch {}
    worker = null;
    for (const j of pending.values()) j.fail(why);
    pending.clear();
  };
  function getWorker() {
    if (worker || workerOff) return worker;
    if (!window.Worker || !window.OffscreenCanvas || !window.createImageBitmap || !window.Blob || !window.URL || !URL.createObjectURL) { workerOff = true; return null; }
    try {
      const src = [clamp, ss, cropRect, keyLum, keyPlan, keyRows, keyAll, workerMain].map(String).join('\n') + '\nworkerMain();';
      const url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
      worker = new Worker(url);
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      worker.onmessage = (e) => { const j = pending.get(e.data.id); if (j) j.on(e.data); };
      worker.onerror = (e) => { if (e && e.preventDefault) e.preventDefault(); workerFailed('worker'); };
    } catch { workerOff = true; worker = null; }
    return worker;
  }
  // resolves with one array of ImageBitmaps per job; rejects with 'worker' when the worker itself cannot
  // run (the caller then cuts on the main thread), or with the job's own error (a picture that failed)
  function cutInWorker(jobs) {
    return new Promise((resolve, reject) => {
      const w = getWorker();
      if (!w) { reject(new Error('worker')); return; }
      const id = ++seq;
      const out = new Array(jobs.length);
      pending.set(id, {
        on: (d) => {
          if (d.error) { pending.delete(id); out.forEach((b) => b && b.forEach((x) => x.close())); reject(new Error(d.error)); }
          else if (d.done) { pending.delete(id); resolve(out); }
          else out[d.n] = d.bitmaps;
        },
        fail: (why) => { out.forEach((b) => b && b.forEach((x) => x.close())); reject(new Error(why)); },
      });
      try { w.postMessage({ id, jobs }); } catch { pending.delete(id); workerFailed('worker'); reject(new Error('worker')); }
    });
  }

  // The main-thread fallback: the same cut, in slices that give the browser a frame back every few ms.
  const breathe = () => new Promise((res) => setTimeout(res, 0));
  const images = new Map();
  const viaImg = (src) => new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(() => res(img));
    img.onerror = () => rej(new Error('cloud picture failed to load: ' + src));
    img.src = src;
  });
  const load = (src) => {
    if (!images.has(src)) {
      images.set(src, (async () => {
        if (!window.createImageBitmap || !window.fetch) return viaImg(src);
        const res = await fetch(src, { mode: 'cors', credentials: 'same-origin' });
        if (!res.ok) throw new Error('cloud picture failed to load: ' + src + ' (' + res.status + ')');
        return createImageBitmap(await res.blob());
      })());
    }
    return images.get(src);
  };
  async function cutOnMain(jobs, alive) {
    const out = [];
    for (const job of jobs) {
      if (!alive()) return out;
      const img = await load(job.src);
      const { w, h } = job;
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const g = c.getContext('2d', { willReadFrequently: !!job.k });
      const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
      const r = cropRect(iw, ih, job.crop, w, h);
      let part = null;
      try { if (window.createImageBitmap) part = await createImageBitmap(img, r[0], r[1], r[2], r[3], { resizeWidth: w, resizeHeight: h, resizeQuality: 'high' }); } catch { part = null; }
      if (job.blur && 'filter' in g) g.filter = 'blur(' + job.blur.toFixed(2) + 'px)';
      if (job.flip) { g.translate(0, h); g.scale(1, -1); }
      if (part) { g.drawImage(part, 0, 0, w, h); part.close(); } else g.drawImage(img, r[0], r[1], r[2], r[3], 0, 0, w, h);
      g.setTransform(1, 0, 0, 1, 0, 0);
      if ('filter' in g) g.filter = 'none';
      await breathe();
      if (job.k) {
        const d = g.getImageData(0, 0, w, h);
        const p = d.data, lum = new Float32Array(w * h), hist = new Uint32Array(256);
        const rows = Math.max(8, Math.floor(60000 / w));
        for (let y = 0; y < h; y += rows) { keyLum(p, lum, hist, y * w, Math.min(h, y + rows) * w); await breathe(); }
        const P = keyPlan(w, h, job.k, hist);
        for (let y = 0; y < h; y += rows) { keyRows(p, lum, w, job.k, P, y, Math.min(h, y + rows)); await breathe(); }
        g.putImageData(d, 0, 0);
      } else if (job.shade) {
        g.globalCompositeOperation = 'source-atop';
        g.globalAlpha = 0.28;
        g.fillStyle = 'rgb(' + job.shade.map((n) => Math.round(n)).join(' ') + ')';
        g.fillRect(0, 0, w, h);
      }
      const copies = [];
      for (let i = 0; i < job.copies; i++) copies.push(window.createImageBitmap ? await createImageBitmap(c) : c);
      out.push(copies);
      await breathe();
    }
    return out;
  }

  // Hand one piece of art to a layer: an ImageBitmap goes in without a copy (bitmaprenderer).
  function show(canvas, art) {
    canvas.__art = true;
    const bitmap = typeof ImageBitmap !== 'undefined' && art instanceof ImageBitmap;
    const br = window.ImageBitmapRenderingContext && (bitmap || window.createImageBitmap) ? canvas.getContext('bitmaprenderer') : null;
    if (br && !bitmap && window.createImageBitmap) { createImageBitmap(art).then((b) => show(canvas, b)).catch(() => {}); return; }
    canvas.width = art.width; canvas.height = art.height;
    if (br && bitmap) { br.transferFromImageBitmap(art); return; }
    const g = canvas.getContext('2d');
    if (g) { g.clearRect(0, 0, art.width, art.height); g.drawImage(art, 0, 0); }
    if (bitmap) art.close();
  }

  const rgbOf = (value, fallback) => {
    const c = document.createElement('canvas').getContext('2d');
    c.fillStyle = fallback;
    if (value) c.fillStyle = value.trim();
    const s = c.fillStyle;
    if (s[0] === '#') return [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
    const m = s.match(/[\d.]+/g);
    return m ? m.slice(0, 3).map(Number) : [238, 242, 244];
  };
  const sizeOf = (el, fallbackW, fallbackH, cap) => {
    const w = el.offsetWidth || fallbackW, h = el.offsetHeight || fallbackH;
    const k = Math.min(1, cap / w);
    return [Math.max(64, Math.round(w * k)), Math.max(32, Math.round(h * k))];
  };
  const abs = (src) => { try { return new URL(src, document.baseURI).href; } catch { return src; } };

  // ---------- markup the script owns ----------

  const make = (tag, cls, parent) => {
    const el = document.createElement(tag);
    el.className = cls;
    el.setAttribute('aria-hidden', 'true');
    parent.append(el);
    return el;
  };

  function setup(root) {
    if (root.__wx) return root.__wx;
    const $ = (s) => root.querySelector(s);
    const stage = root.querySelector(':scope > .scene-stage') || root.firstElementChild;
    const r = {
      root, stage,
      above: $('.wx-above'), aImg: $('.wx-above img'),
      below: $('.wx-below'), bImg: $('.wx-below img'),
      hero: $('.wx-hero'), title: $('.wx-title'), tagline: $('.wx-tagline'),
      note: $('.wx-note'), statement: $('.wx-statement'),
    };

    // the title: the word itself for readers, two blurred copies on top whose opacity alone changes. The
    // copies are drawn as generated content, so the heading's text stays the one word.
    if (r.title && !r.title.querySelector('.wx-title__word')) {
      const word = r.title.textContent.trim().replace(/\s+/g, ' ');
      r.title.textContent = '';
      const w = document.createElement('span');
      w.className = 'wx-title__word';
      w.textContent = word;
      r.title.append(w);
      for (const k of ['soft', 'lost']) {
        const copy = make('span', 'wx-title__ghost is-' + k, r.title);
        copy.dataset.word = word;
      }
    }
    if (r.title) {
      r.word = r.title.querySelector('.wx-title__word');
      r.soft = r.title.querySelector('.wx-title__ghost.is-soft');
      r.lost = r.title.querySelector('.wx-title__ghost.is-lost');
    }

    // the statement: each line rises out of its own mask
    if (r.statement) {
      if (!r.statement.querySelector('.wx-line')) {
        const line = document.createElement('span');
        line.className = 'wx-line';
        while (r.statement.firstChild) line.append(r.statement.firstChild);
        r.statement.append(line);
      }
      for (const line of r.statement.querySelectorAll('.wx-line')) {
        if (line.querySelector(':scope > .wx-line__in')) continue;
        const inner = document.createElement('span');
        inner.className = 'wx-line__in';
        while (line.firstChild) inner.append(line.firstChild);
        line.append(inner);
      }
      r.lines = [...r.statement.querySelectorAll('.wx-line__in')];
    } else r.lines = [];

    // layers: shown only while the scene runs (the deck also edges the seam of the finished composition)
    r.haze = make('div', 'wx-layer wx-haze', stage);
    r.ground = make('div', 'wx-layer wx-ground', stage);
    r.far = make('canvas', 'wx-layer wx-cloud wx-cloud--far', stage);
    r.near = make('canvas', 'wx-layer wx-cloud wx-cloud--near', stage);
    r.under = make('canvas', 'wx-layer wx-cloud wx-cloud--under', stage);
    r.deck = make('div', 'wx-layer wx-deck', stage);
    r.deckTop = make('canvas', 'wx-deck__top', r.deck);
    r.deckBody = make('div', 'wx-deck__body', r.deck);
    r.deckBottom = make('canvas', 'wx-deck__bottom', r.deck);
    make('div', 'wx-deck__soft wx-deck__soft--top', r.deck);
    make('div', 'wx-deck__soft wx-deck__soft--bottom', r.deck);

    // the layers take their art as bitmaps; giving them that context (and a 1px bitmap) now means they
    // are already composited when the art arrives, so the handover is a swap, not a new layer
    if (window.ImageBitmapRenderingContext && window.createImageBitmap && window.ImageData) {
      for (const c of [r.far, r.near, r.under, r.deckTop, r.deckBottom]) {
        const br = c.getContext('bitmaprenderer');
        if (br) createImageBitmap(new ImageData(1, 1)).then((b) => { if (!c.__art) { c.width = 1; c.height = 1; br.transferFromImageBitmap(b); } else b.close(); }).catch(() => {});
      }
    }

    root.__wx = r;
    return r;
  }

  // ---------- the title is fitted to the width, held under a share of the height ----------

  function fit(r, o, phone) {
    if (!r.title || !r.word) return;
    const t = r.title;
    t.style.removeProperty('--wx-title-size');
    const fs = parseFloat(getComputedStyle(t).fontSize) || 100;
    const natural = r.word.offsetWidth;
    if (!natural) return;
    const H = r.stage.offsetHeight > 0 && r.root.classList.contains('is-live') ? r.stage.offsetHeight : window.innerHeight;
    const share = phone ? Math.min(0.98, o.fill + 0.1) : o.fill;
    const size = Math.min((fs * t.clientWidth * share) / natural, H * (phone ? 0.2 : 0.36), 460);
    t.style.setProperty('--wx-title-size', size.toFixed(1) + 'px');
  }

  // ---------- cloud art ----------

  let warned = false;
  // mode: 'desktop' | 'phone' (the running scene) or 'rest' (the seam of the finished composition)
  async function paint(r, o, mode, token) {
    const alive = () => token === r.token;
    const aSrc = r.aImg ? r.aImg.currentSrc || r.aImg.src : '';
    const topsSrc = abs(o.tops || aSrc);
    const wispsSrc = abs(o.wisps || o.tops || aSrc);
    if (!o.tops && !aSrc) throw new Error('no picture to cut the cloud from');
    const topsCrop = o.topsCrop || (o.tops ? [0, 0, 1, 1] : [0, 0.5, 1, 1]);
    const wispsCrop = o.wispsCrop || (o.wisps ? [0, 0, 1, 1] : o.tops ? topsCrop : [0, 0.35, 1, 1]);
    const mist = rgbOf(getComputedStyle(r.root).getPropertyValue('--wx-mist'), '#eef2f4');
    const tone = (m) => mist.map((c, i) => c * m[i]);
    const phone = mode === 'phone' || (mode === 'rest' && window.matchMedia('(max-width: 767px)').matches);
    const cap = phone ? 1400 : 1800;
    const W = window.innerWidth, H = window.innerHeight;
    const rest = mode === 'rest';
    const topsSize = rest ? sizeOf(r.deckTop, W * 1.7, H * 0.26, cap) : sizeOf(r.far, W * 1.8, H * 0.8, cap);
    const lowSize = sizeOf(r.deckBottom, W * 1.7, H * (rest ? 0.26 : 0.6), cap);
    const key = o.art === 'key';
    // tops: sunlit crests, solid toward the bottom (the far cloud and the deck's top edge). low: the same
    // sea turned over for the deck's lower edge, the part that lies over the land as the frame clears, so
    // it stays pale (shade close to the mist), is blurred further and fades over most of its height: it
    // thins out instead of drawing grey sheets with hard lower edges. under: the ceiling behind the deck,
    // kept in the upper half of the frame, so it may carry the grey-blue undersides of real cloud.
    // wisps: a veil, shaded deeper so it reads on pale ground too.
    const jobs = [
      { src: topsSrc, crop: topsCrop, w: topsSize[0], h: topsSize[1], flip: false, blur: topsSize[0] / 1400, copies: rest ? 1 : 2,
        // (in the still seam the cloud closes sooner and is shaded lighter: nothing there moves to explain
        // the darker troughs, so they would read as smudges)
        k: key ? { edge: 'top', soft: rest ? 0.4 : 0.5, crest: rest ? 0.1 : 0.18, fill: rest ? [0.35, 0.85] : [0.45, 0.9], fade: 0.3, gain: 1, side: 0.08, qLo: 0.1, qHi: 0.8, shade: tone(rest ? [0.87, 0.89, 0.915] : [0.8, 0.835, 0.875]), light: mist, mist } : null },
      { src: topsSrc, crop: topsCrop, w: lowSize[0], h: lowSize[1], flip: true, blur: lowSize[0] / 340, copies: 1,
        k: key ? { edge: 'bottom', soft: 0.72, crest: 0.32, fill: [0.5, 0.94], fade: 0.66, gain: 1, side: 0.08, qLo: 0.12, qHi: 0.82, shade: tone([0.93, 0.945, 0.96]), light: mist, mist } : null,
        shade: key ? null : tone([0.94, 0.95, 0.96]) },
    ];
    if (!rest) {
      const underSize = sizeOf(r.under, W * 2, H * 0.64, cap);
      const wispSize = sizeOf(r.near, W * 2.3, H * 1.4, cap);
      jobs.push(
        { src: topsSrc, crop: topsCrop, w: underSize[0], h: underSize[1], flip: true, blur: underSize[0] / 600, copies: 1,
          k: key ? { edge: 'bottom', soft: 0.55, crest: 0.2, fill: [0.45, 0.9], fade: 0.5, gain: 1, side: 0.08, qLo: 0.1, qHi: 0.8, shade: tone([0.84, 0.865, 0.9]), light: mist, mist } : null,
          shade: key ? null : tone([0.86, 0.88, 0.91]) },
        { src: wispsSrc, crop: wispsCrop, w: wispSize[0], h: wispSize[1], flip: false, blur: wispSize[0] / 1400, copies: 1,
          k: key ? { edge: 'all', gain: 0.74, side: 0.14, vside: 0.2, qLo: 0.35, qHi: 0.97, shade: tone([0.78, 0.81, 0.85]), light: mist, mist } : null });
    }
    let arts;
    try { arts = await cutInWorker(jobs); }
    catch (err) {
      if (err.message !== 'worker') throw err;
      arts = await cutOnMain(jobs, alive);
    }
    if (!alive()) { arts.forEach((a) => a && a.forEach((x) => x.close && x.close())); return; }
    const [tops, low, under, wisps] = arts;
    const items = rest
      ? [{ c: r.deckTop, a: tops[0], deck: true }, { c: r.deckBottom, a: low[0], deck: true }]
      : [{ c: r.far, a: tops[0] }, { c: r.near, a: wisps[0] }, { c: r.under, a: under[0] },
        { c: r.deckTop, a: tops[1], deck: true }, { c: r.deckBottom, a: low[0], deck: true }];
    await commit(r, items, token);
  }

  // One canvas per frame, and only while the page is still: a layer never changes under a moving scroll.
  // The deck's art (and the class that drops its flat stand-in edges) waits until the scene is still or
  // the deck is off screen; the other layers go in after a short wait even if the reader keeps scrolling.
  function commit(r, items, token) {
    return new Promise((resolve) => {
      const t0 = performance.now();
      const step = () => {
        if (token !== r.token) { items.forEach((x) => x.a.close && x.a.close()); resolve(false); return; }
        const now = performance.now();
        const still = now - (r.moved || 0) > 140;
        const deckFree = still || !r.live || r.p < 0.2 || r.p > 0.82;
        const i = items.findIndex((x) => (x.deck ? deckFree : still || now - t0 > 1200));
        if (i >= 0) {
          const x = items.splice(i, 1)[0];
          show(x.c, x.a);
          if (x.deck && !items.some((y) => y.deck)) r.root.classList.add('wx-art');
        }
        if (!items.length) { resolve(true); return; }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  function cut(r, o, mode) {
    const token = ++r.token;
    r.root.classList.remove('wx-noart');
    paint(r, o, mode, token).catch((err) => {
      if (token !== r.token) return;
      r.root.classList.add('wx-noart');
      if (!warned) { warned = true; console.warn('[' + ID + '] cloud art unavailable, using the soft mist wall: ' + err.message); }
    });
  }

  // ---------- the scene ----------

  window.Scenes = window.Scenes || {};
  window.Scenes[ID] = (root, opts = {}) => {
    const o = settings(opts);
    const r = setup(root);
    r.token = 0;
    r.p = 0;
    r.moved = 0;
    r.live = false;

    // keep the title fitted in every state (rest included): after fonts, on resize
    let raf = 0;
    const refit = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => fit(r, o, window.matchMedia('(max-width: 767px)').matches)); };
    if (!root.__wxFit) {
      root.__wxFit = true;
      window.addEventListener('resize', refit);
      if (document.fonts) { document.fonts.ready.then(refit); document.fonts.addEventListener('loadingdone', refit); }
    }
    refit();

    // state the timeline leaves on the root: cleared whenever the scene is rebuilt or shows its rest
    const clean = () => {
      delete root.dataset.sky;
      root.classList.remove('wx-near');
    };

    function build(tl, ctx) {
      const P = ctx.phone;
      const stage = r.stage;
      const H = () => stage.offsetHeight || window.innerHeight;
      const Wd = () => stage.offsetWidth || window.innerWidth;
      const sv = (n) => () => (n / 100) * H();
      const vw = (n) => () => (n / 100) * Wd();
      const F = P ? o.phoneFeather : o.feather;
      clean();
      r.live = true;
      r.p = 0;
      root.style.setProperty('--wx-feather', F + 'svh');
      root.style.setProperty('--wx-blur', (P ? Math.min(o.blur, 10) : o.blur) + 'px');
      fit(r, o, P);

      // photo B must be decoded before it is revealed; the cloud art is cut while the hero is read
      if (r.bImg && r.bImg.decode) r.bImg.decode().catch(() => {});
      cut(r, o, P ? 'phone' : 'desktop');

      // will-change only while the scene is near the screen
      ScrollTrigger.create({
        trigger: root, start: 'top bottom', end: 'bottom top',
        onToggle: (self) => root.classList.toggle('wx-near', self.isActive),
      });

      let sky = '';
      tl.eventCallback('onUpdate', () => {
        const p = tl.progress();
        r.p = p;
        r.moved = performance.now();
        const s = p < 0.44 ? 'above' : p < 0.6 ? 'in' : 'below';
        if (s !== sky) { sky = s; root.dataset.sky = s; }
      });

      // photo A and the title (the picture scales from a quarter down its height, so the zoom always
      // covers the drift and its foot never lifts off the frame); in the last of the deck's rise the
      // picture pales into the mist, so nothing sharp-edged still shows through the thinning cloud
      if (r.aImg) {
        tl.fromTo(r.aImg, { scale: 1, y: 0 }, { scale: P ? 1.08 : 1.12, y: sv(P ? -5 : -8), duration: 0.5 }, 0)
          .fromTo(r.aImg, { opacity: 1 }, { opacity: 0.4, duration: 0.07 }, 0.41);
      }
      if (r.above) tl.fromTo(r.above, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.01 }, 0.49);
      if (r.title) {
        tl.fromTo(r.title, { y: 0 }, { y: sv(P ? -30 : -42), duration: 0.5 }, 0);
        // each blurrier copy fades in on top before the one under it leaves, so the word never dims or
        // doubles; autoAlpha hides what has faded out, so nothing invisible still counts as text on screen
        tl.fromTo(r.soft, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }, 0.1)
          .fromTo(r.word, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.08 }, 0.17)
          .fromTo(r.lost, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12 }, 0.28)
          .fromTo(r.soft, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.08, immediateRender: false }, 0.36);
        tl.fromTo(r.title, { autoAlpha: 1 }, { autoAlpha: 0.55, duration: 0.14 }, 0.3)
          .fromTo(r.title, { autoAlpha: 0.55 }, { autoAlpha: 0, duration: 0.04, immediateRender: false }, 0.44);
      }
      if (r.tagline) tl.fromTo(r.tagline, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: sv(-3), duration: 0.08, ease: 'power1.in' }, P ? 0.16 : 0.14);

      // clouds above the deck: the far sea of cloud tops and the near veil cross the word
      tl.fromTo(r.far, { y: sv(P ? 100 : 96), x: 0 }, { y: sv(P ? 8 : 14), x: vw(P ? -10 : -6), duration: 0.5 }, 0)
        .fromTo(r.far, { autoAlpha: 0.9 }, { autoAlpha: 0, duration: 0.01 }, 0.5);
      tl.fromTo(r.near, { y: sv(P ? 112 : 118), x: 0, scale: 1 }, { y: sv(-30), x: P ? 0 : vw(8), scale: P ? 1.15 : 1.25, duration: 0.46 }, 0.04)
        .fromTo(r.near, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.01 }, 0.5);

      // the deck: in with power1.in (it accelerates into the cloud), out with power1.out
      tl.fromTo(r.deck, { y: sv(100) }, { y: sv(-F), duration: 0.24, ease: 'power1.in' }, 0.24)
        .fromTo(r.deck, { y: sv(-F) }, { y: sv(-(2 * F + 100)), duration: 0.26, ease: 'power1.out', immediateRender: false }, 0.52);

      // the one line on the white: it rises slowly through the mist on its own, held by the deck's solid
      // body the whole time it is visible (the body covers it from 0.44 to past 0.57)
      if (r.note) {
        tl.fromTo(r.note, { yPercent: -50, y: sv(14) }, { y: sv(-14), duration: 0.16 }, 0.42)
          .fromTo(r.note, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.03, ease: 'power1.out' }, 0.44)
          .fromTo(r.note, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.025, immediateRender: false }, 0.545);
      }

      // the cloud ceiling behind the deck: slower than the deck's own edge (it is farther off), kept in
      // the upper half of the frame while the land clears below it, gone by 0.86
      tl.fromTo(r.under, { autoAlpha: 0 }, { autoAlpha: 0.92, duration: 0.01 }, 0.5)
        .fromTo(r.under, { y: sv(P ? 5 : 6), x: 0 }, { y: sv(P ? -50 : -64), x: P ? 0 : vw(-5), duration: 0.32 }, 0.54);

      // photo B and the landing
      if (r.bImg) tl.fromTo(r.bImg, { scale: P ? Math.min(o.settle, 1.12) : o.settle, y: sv(P ? 4 : 6) }, { scale: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.5);
      // the haze is a blurred fill, so it is not drawn at all while photo A covers it
      tl.fromTo(r.haze, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, 0.49)
        .fromTo(r.haze, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.26, immediateRender: false }, 0.58)
        .fromTo(r.ground, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.14 }, 0.66);
      // one tween per line (a staggered fromTo only sets its first target before it starts); each line is
      // hidden while it waits in its mask and shown the moment it starts to rise
      r.lines.forEach((line, i) => {
        const at = 0.74 + i * 0.03;
        tl.fromTo(line, { yPercent: 110 }, { yPercent: 0, duration: 0.08, ease: 'power3.out' }, at)
          .fromTo(line, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.002 }, at);
      });
    }

    // the finished composition: the seam of mist gets the keyed cloud on its edges (cut once per size)
    const W = () => window.innerWidth + 'x' + window.innerHeight;
    const rest = (again) => {
      clean();
      r.live = false;
      refit();
      if (!again && r.mode === 'rest' && r.restSize === W()) return;
      r.mode = 'rest';
      r.restSize = W();
      cut(r, o, 'rest');
    };
    const live = build;
    const mm = Stage.scene(root, {
      hold: o.hold,
      scrub: o.scrub ?? (Stage.lenis ? true : 0.8),
      build: (tl, ctx) => { r.mode = 'live'; live(tl, ctx); },
      phone: o.phone === 'rest' ? 'rest' : { hold: o.phoneHold, build: (tl, ctx) => { r.mode = 'live'; live(tl, ctx); } },
      rest: () => rest(false),
    });

    // Stage.scene calls rest() only when one of its media conditions matches; a desktop with reduced
    // motion matches neither, so the scene also watches reduced motion itself. It checks a frame later,
    // after GSAP has reverted the running scene, and then also clears what the timeline left on the root.
    const settle = () => requestAnimationFrame(() => { if (!root.classList.contains('is-live')) rest(false); });
    if (!root.classList.contains('is-live')) settle();
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotion = () => settle();
    if (rm.addEventListener) rm.addEventListener('change', onMotion); else if (rm.addListener) rm.addListener(onMotion);
    let rt = 0;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => { if (r.mode === 'rest' && !root.classList.contains('is-live') && r.restSize !== W()) rest(true); }, 300);
    });
    return mm;
  };
})();
