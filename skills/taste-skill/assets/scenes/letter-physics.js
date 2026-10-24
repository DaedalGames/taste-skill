// tasteskill / scenes / letter-physics.js — a claim bursts apart in true 3D; an answer lands in the light.
//
// A bold claim (headline A) sits readable on a dark stage, breathes in, then flies apart: every letter
// leaves along its own vector from the headline's centre, with drag, spin, tumble and a little gravity,
// the centre letters rushing nearest the viewer. From that same centre a feathered disc of light opens,
// and a one-sentence answer (B) flies out of depth into the light and lands dark on white. A hero or a
// chapter opener for a 12-36 character claim; it needs no picture, and one dark photograph with a light
// source at its centre makes it richer.
//
// DOM (the finished composition is this markup with the default CSS; no script needed to read it):
//
//   <section class="scene lp" data-scene="letter-physics" data-options='{}' aria-labelledby="lp-a">
//     <div class="scene-stage">
//       <div class="lp-bg" aria-hidden="true">                      optional picture
//         <img class="lp-bg-img" src="room-2400.jpg" alt="" width="2400" height="1350">
//         <div class="lp-scrim"></div>
//       </div>
//       <div class="lp-space"><h2 class="lp-a" id="lp-a">Darkness is a material.</h2></div>
//       <div class="lp-pool">
//         <div class="lp-halo" aria-hidden="true"></div>
//         <div class="lp-disc" aria-hidden="true"></div>
//         <p class="lp-b">One sentence of 40-90 characters that answers the claim.</p>
//       </div>
//       <div class="lp-labels"><p class="lp-label">How we work</p><p class="lp-label">Since 2011</p></div>  optional
//       <span class="lp-cue" aria-hidden="true">Scroll</span>       optional, only when the scene opens the page
//     </div>
//   </section>
//
// A: one claim, 12-36 characters (hard cap 40); it is fitted to two lines at most, inside 86% of the
// width. On the phone a short claim also grows, from 13.5vw up to 19vw (--lp-a-grow), while it still
// fits those two lines. Two lines of 86vw hold only about 30 characters at 40px, so on a 390px phone a
// longer claim is set below 40px (measured in a normal-width grotesk at 750: 31-32 characters 42-46px,
// 33 characters 40px, 37-41 characters 33-38px; a wide face drops sooner, from about 26). A claim of
// 12-20 characters in short words usually reaches 70-74px. Keep claims for the phone short, or accept
// the smaller size there. B: one sentence, 40-90 characters (longer B flies in by words), set at
// 0.047 D (22-32px; 32px is the house ceiling for a sentence set large) and 20px on the phone, inside
// the disc's solid core. Labels: 1-3 words each, sentence case; they sit beside A on desktop, live and at
// rest, and are hidden on the phone, where there is no room beside it (and at 768-1099px when no script
// runs to measure A against them). Colours come from custom properties on the section:
// --lp-ground (#0a0d0b), --lp-paper (A, #f2f3f0), --lp-ink (B, #0b0e0c), --lp-light (the disc),
// --lp-scrim (.74, the flat fill over the picture); faces from the page's --font-display and --font-text.
//
// Options (data-options JSON). Default, then range:
//   hold       2.5       screens the stage is held on desktop (2-3.2)
//   phoneHold  2         screens held under 768px (1.6-2.6)
//   phone      'same'    'same' runs the scene with phone numbers; 'rest' shows the finished composition
//   scrub      auto      true when Lenis smooths the page, else 0.8 (seconds of catch-up); set to override
//   exit       'burst'   how A leaves: 'burst' (3D, drag, spin, gravity), 'detonate' (flung flat, wider,
//                        fast spin, shrinking at the end of its life) or 'crumble' (letters drop away in
//                        place, no push, no depth)
//   spread     0.36      burst radius as a share of the stage width (0.3-0.45; 240-600px on desktop)
//   depth      520       how near the centre letters come, px (380-540; perspective is 900)
//   gravity    0.22      fall over the burst as a share of the stage height (0.12-0.3)
//   light      'white'   the disc: 'white', 'warm' (#fff6e8), any CSS colour, or 'none' (no pool: B lands
//                        in the paper colour on the dark ground, and the picture dims only to 0.7)
//   disc       0.8       disc diameter as a share of the stage height on desktop (0.5-1)
//   phoneDisc  1.15      disc diameter as a share of the stage width on the phone (0.9-1.3)
//   payoff     'land'    'land' holds B to the end; 'pass' carries B through the screen plane and away
//                        over 0.84-0.98 (only when the next section continues the statement)
//   intro      false     true: when the scene opens the page and it loads unscrolled, the letters gather
//                        from a loose cloud over 1.1s; the first scroll ends it
//   particles  'auto'    'chars', 'words', or 'auto' (words on a phone when A is over 36 characters or
//                        the device has 4 cores or fewer)
//   seed       0         any integer; changes every letter's path (paths are always the same on every pass)
//
// Progress map (desktop 1440x900, hold 2.5): 0-6% A at rest, labels in; 6-16% A breathes in to 95.5%;
// 16-60% the burst (A unreadable from about 25%, every letter gone by 51%; letters rising into the top
// 96px are at 0.4 or less, for a sticky nav); 20-34% the window glows: a wide soft bloom swells from the
// centre; 26-40% the disc condenses inside it (already about 70px across when it appears, never a crisp
// dot) and opens to 0.8 of the stage height by 62%, the halo with it, the picture dims to 0.42; 50-80% B
// flies in from depth in reading order and lands; 80-100% B held, ink on light.
(() => {
  const ID = 'letter-physics';
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const num = (v, d, a, b) => (typeof v === 'number' && isFinite(v) ? clamp(v, a, b) : d);
  const pick = (v, list, d) => (list.includes(v) ? v : d);
  const LIGHTS = { white: '#ffffff', warm: '#fff6e8' };
  const DRAG = 1 - Math.exp(-3);
  // A letter whose top edge rises into the top 96px of the stage (under a sticky nav) is at 0.4 or less,
  // and gone by 32px: 1 at 192px, 0.4 at 96px, 0 at 32px.
  const navFade = (top) => clamp01((top - 32) / 160);

  const settings = (o) => ({
    hold: num(o.hold, 2.5, 2, 3.2),
    phoneHold: num(o.phoneHold, 2, 1.6, 2.6),
    phone: o.phone === 'rest' ? 'rest' : 'same',
    scrub: typeof o.scrub === 'boolean' || typeof o.scrub === 'number' ? o.scrub : null,
    exit: pick(o.exit, ['burst', 'detonate', 'crumble'], 'burst'),
    spread: num(o.spread, 0.36, 0.3, 0.45),
    depth: num(o.depth, 520, 380, 540),
    gravity: num(o.gravity, 0.22, 0.12, 0.3),
    light: typeof o.light === 'string' && o.light.trim() ? o.light.trim() : 'white',
    disc: num(o.disc, 0.8, 0.5, 1),
    phoneDisc: num(o.phoneDisc, 1.15, 0.9, 1.3),
    payoff: pick(o.payoff, ['land', 'pass'], 'land'),
    intro: o.intro === true,
    particles: pick(o.particles, ['auto', 'chars', 'words'], 'auto'),
    seed: Number.isInteger(o.seed) ? o.seed : 0,
  });

  // Seeded randomness: every letter's path comes from the text, so scrubbing back and forth replays it.
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const prng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

  // Split into words (inline-block, nowrap, so lines break exactly as the unsplit text) and characters.
  // The full text stays readable to screen readers in a hidden span; the split spans are hidden from them.
  const seg = window.Intl && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
  const graphemes = (s) => (seg ? [...seg.segment(s)].map((x) => x.segment) : Array.from(s));
  const split = (el) => {
    if (el.__lp) return el.__lp;
    const html = el.innerHTML;
    const words = [], chars = [];
    const walk = (node) => {
      for (const n of [...node.childNodes]) {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          for (const part of n.textContent.split(/(\s+)/)) {
            if (!part) continue;
            if (!part.trim()) { frag.append(' '); continue; }
            const w = document.createElement('span');
            w.className = 'lp-word';
            w.setAttribute('aria-hidden', 'true');
            const wi = words.length;
            for (const g of graphemes(part)) {
              const c = document.createElement('span');
              c.className = 'lp-char';
              c.textContent = g;
              w.append(c);
              chars.push({ el: c, wi });
            }
            words.push({ el: w, wi });
            frag.append(w);
          }
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      }
    };
    const text = el.textContent.trim().replace(/\s+/g, ' ');
    walk(el);
    const sr = document.createElement('span');
    sr.className = 'lp-sr';
    sr.textContent = text;
    el.prepend(sr);
    el.__lp = { html, words, chars, text };
    return el.__lp;
  };
  // Layout position of el inside box, transforms ignored. offsetParent is not enough on its own: an element
  // with preserve-3d (each word) is the offset parent of its characters in Chrome.
  const offset = (el, box) => {
    let x = 0, y = 0, n = el;
    while (n && n !== box) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    if (n === box) return { x, y };
    let bx = 0, by = 0;
    for (let m = box; m; m = m.offsetParent) { bx += m.offsetLeft; by += m.offsetTop; }
    return { x: x - bx, y: y - by };
  };
  const unsplit = (el) => {
    if (!el || !el.__lp) return;
    el.innerHTML = el.__lp.html;
    delete el.__lp;
  };

  const make = (root, opts = {}) => {
    const o = settings(opts || {});
    const stage = root.querySelector(':scope > .scene-stage') || root.firstElementChild;
    const a = root.querySelector('.lp-a');
    if (!stage || !a) return null;
    const b = root.querySelector('.lp-b');
    const space = root.querySelector('.lp-space');
    const bg = root.querySelector('.lp-bg');
    const disc = root.querySelector('.lp-disc');
    const halo = root.querySelector('.lp-halo');
    const labels = root.querySelector('.lp-labels');
    const cue = root.querySelector('.lp-cue');
    const lightOn = o.light !== 'none' && !!disc;
    root.dataset.light = lightOn ? 'on' : 'none';
    // the bloom: the first, widest and softest light, under the disc (decoration, hidden from readers)
    let bloom = null;
    if (lightOn) {
      bloom = root.querySelector('.lp-bloom');
      if (!bloom) {
        bloom = document.createElement('div');
        bloom.className = 'lp-bloom';
        bloom.setAttribute('aria-hidden', 'true');
        disc.before(bloom);
      }
    }
    if (lightOn) root.style.setProperty('--lp-light', LIGHTS[o.light] || o.light);
    root.style.setProperty('--lp-disc', String(o.disc));
    root.style.setProperty('--lp-disc-phone', String(o.phoneDisc));

    const clean = (el) => (el ? el.textContent.trim().replace(/\s+/g, ' ') : '');
    const textA = clean(a), textB = clean(b);
    const seed = (hash(textA + '|' + textB) ^ o.seed) >>> 0;
    const S = { live: false, phone: false, key: '', geo: null, pa: [], pb: [], fonts: 0, clean: true, P: { u: 0 }, nW: 1 };

    // Fit A to two lines at most inside the width it may use: 86% of the stage, and never into the side
    // labels where they sit beside it. Also no taller than half the stage. The CSS size is the start; a
    // claim that does not fit shrinks, and where --lp-a-grow is over 1 (the phone) a short one grows, up
    // to that factor, for as long as it still fits.
    const cssNum = (name, d) => parseFloat(getComputedStyle(root).getPropertyValue(name)) || d;
    const lineHeight = () => cssNum('--lp-lh', 0.92);
    const fitA = () => {
      // marks the claim as measured, which lets the CSS keep the labels beside it at any desktop width
      // (set first, so the measure below sees the labels where they will be)
      root.dataset.fit = '';
      const live = root.classList.contains('is-live');
      const W = stage.clientWidth || window.innerWidth;
      const H = live ? stage.clientHeight : window.innerHeight;
      let avail = 0.86 * W;
      if (labels && getComputedStyle(labels).display !== 'none' && !window.matchMedia('(max-width: 767px)').matches) {
        const lw = Math.max(0, ...[...labels.children].map((l) => l.offsetWidth));
        avail = Math.min(avail, W - 2 * (48 + lw + 40));
      }
      avail = Math.max(avail, Math.min(0.86 * W, 280));
      root.style.setProperty('--lp-a-max', Math.round(avail) + 'px');
      root.style.setProperty('--lp-fit', '1');
      const LH = lineHeight();
      const grow = clamp(cssNum('--lp-a-grow', 1), 1, 2);
      // overflow from layout offsets: scrollWidth would count letters the burst has already thrown
      const overflows = () => {
        if (!a.__lp) return a.scrollWidth > a.clientWidth + 1;
        const cw = a.clientWidth;
        return a.__lp.words.some((w) => { const q = offset(w.el, a); return q.x < -1 || q.x + w.el.offsetWidth > cw + 1; });
      };
      const ok = () => {
        const fs = parseFloat(getComputedStyle(a).fontSize) || 16;
        return Math.round(a.offsetHeight / (fs * LH)) <= 2 && !overflows() && a.offsetHeight <= 0.5 * H;
      };
      let lo = 0.3, hi = 1;
      if (ok()) {
        if (grow <= 1) return;
        root.style.setProperty('--lp-fit', grow.toFixed(4));
        if (ok()) return;
        lo = 1; hi = grow;
      }
      for (let i = 0; i < 9; i++) {
        const m = (lo + hi) / 2;
        root.style.setProperty('--lp-fit', m.toFixed(4));
        if (ok()) lo = m; else hi = m;
      }
      root.style.setProperty('--lp-fit', lo.toFixed(4));
    };

    // Particles and their seeded values. The draw order of the generator never depends on the mode, so a
    // given text and seed always gives the same letters the same character.
    const prepare = (phone) => {
      S.phone = phone;
      const sa = split(a);
      const sb = b ? split(b) : null;
      const byWords = o.particles === 'words' || (o.particles === 'auto' && phone && ([...textA].length > 36 || (navigator.hardwareConcurrency || 8) <= 4));
      const rnd = prng(seed);
      const sgn = () => (rnd() < 0.5 ? -1 : 1);
      S.pa = (byWords ? sa.words : sa.chars).map((p, i) => {
        const v = { el: p.el, wi: p.wi, i };
        v.jit = (rnd() * 2 - 1) * (10 * Math.PI) / 180;
        v.k = 0.8 + 0.45 * rnd();
        v.spinR = rnd(); v.spinS = sgn();
        v.tx = sgn() * 50 * rnd(); v.ty = sgn() * 50 * rnd();
        v.cr = rnd(); v.cd = 0.04 + 0.07 * rnd();
        v.drop = 40 + 120 * rnd(); v.dx = (rnd() * 2 - 1) * 10; v.rot = (rnd() * 2 - 1) * 20;
        v.cs = Math.min(0.16 + 0.01 * p.wi + 0.25 * v.cr, 0.58 - v.cd);
        return v;
      });
      const rb = prng(seed ^ 0x9e3779b9);
      const sgb = () => (rb() < 0.5 ? -1 : 1);
      const bWords = sb && [...textB].length > 90;
      S.pb = sb ? (bWords ? sb.words : sb.chars).map((p, i) => ({ el: p.el, wi: p.wi, i, r: rb(), s: sgb(), rx: sgb() * 40 * rb(), rz: sgb() * 15 * rb(), zr: rb() })) : [];
      S.nW = sb ? sb.words.length : 1;
    };
    const resetA = () => {
      for (const p of S.pa) { p.el.style.transform = ''; p.el.style.opacity = ''; }
      S.clean = true;
    };

    // Geometry, measured with layout offsets (transforms never count) and redone whenever the stage size,
    // the mode or the fonts change.
    const key = () => `${stage.clientWidth}x${stage.clientHeight}|${S.phone}|${S.fonts}|${document.fonts ? document.fonts.status : ''}`;
    const G = () => {
      const k = key();
      if (k === S.key && S.geo) return S.geo;
      S.key = k;
      fitA();
      const W = stage.clientWidth, H = stage.clientHeight, ph = S.phone;
      const c = ph
        ? { R: 0.62 * W, Zc: 340, Ze: 90, L: 0.05 * H, Gv: 0.16 * H, spin: [40, 100], tilt: false }
        : { R: clamp(o.spread * W, 240, 600), Zc: o.depth, Ze: 140, L: 0.06 * H, Gv: o.gravity * H, spin: [60, 140], tilt: true };
      if (o.exit === 'detonate') Object.assign(c, { R: (ph ? 0.75 : 0.52) * W, Zc: 0, Ze: 0, L: 0.1 * H, spin: [180, 360], tilt: false });
      c.P = (space && parseFloat(getComputedStyle(space).perspective)) || (ph ? 700 : 900);
      const aw = a.clientWidth, ah = a.clientHeight;
      const pts = S.pa.map((p) => { const q = offset(p.el, a); return { x: q.x + p.el.offsetWidth / 2 - aw / 2, y: q.y + p.el.offsetHeight / 2 - ah / 2, hh: p.el.offsetHeight / 2 }; });
      const dmax = Math.max(1, ...pts.map((q) => Math.hypot(q.x, q.y)));
      const av = pts.map((q, i) => {
        const d = Math.hypot(q.x, q.y);
        let nx = 0, ny = -1;
        if (d >= 4) { nx = q.x / d; ny = q.y / d; }
        const j = S.pa[i].jit, cs = Math.cos(j), sn = Math.sin(j);
        // by, hh: where the letter starts against the stage centre, for the fade under a sticky nav;
        // f0: that fade at rest, so a letter that starts high is never dimmed on the first frame
        return { nx: nx * cs - ny * sn, ny: nx * sn + ny * cs, dn: d / dmax, by: q.y, hh: q.hh, f0: navFade(H / 2 + q.y - q.hh) };
      });
      let bv = [];
      if (b && S.pb.length) {
        const bw = b.clientWidth, bh = b.clientHeight;
        bv = S.pb.map((p) => {
          const q = offset(p.el, b), x = q.x + p.el.offsetWidth / 2 - bw / 2, y = q.y + p.el.offsetHeight / 2 - bh / 2;
          return { x: x * 0.5 + p.s * (20 + 40 * p.r), y: y * 0.5 + (20 + 40 * p.r), z: -(800 + 600 * p.zr) };
        });
      }
      S.geo = { c, a: av, b: bv, W, H };
      if (S.live) bake();
      return S.geo;
    };

    // The light, painted once per size: a flat circle softened by a Gaussian (a canvas shadow, sigma =
    // shadowBlur / 2), so the scrub only scales a finished bitmap. A live CSS blur would be filtered again
    // on every frame the disc grows. Disc: circle 0.79 D, sigma 0.051 D, in a 1.1 D box; halo: circle
    // 1.1 D at 26% of the light, sigma 0.15 D, in a 2 D box; bloom (live only, made here): circle 0.56 D,
    // sigma 0.24 D, in a 2.2 D box, a wide soft swell about half as bright as the disc at its centre. A
    // baked feather shrinks with its bitmap, so the disc is never shown small: the bloom makes the first
    // light, and the disc condenses inside it. The finished composition keeps the CSS blur.
    const glow = (el) => el.querySelector(':scope > .lp-glow') || el.appendChild(Object.assign(document.createElement('canvas'), { className: 'lp-glow' }));
    const paint = (el, box, r, sigma, alpha, cap) => {
      const w = el.clientWidth;
      if (!w) return;
      const cv = glow(el), n = Math.max(8, Math.round(Math.min(w, cap))), D = w / box, k = n / w;
      cv.width = n; cv.height = n;
      const ctx = cv.getContext('2d');
      if (!ctx) return;
      const col = getComputedStyle(root).getPropertyValue('--lp-light').trim() || '#ffffff';
      const off = n * 3;
      ctx.clearRect(0, 0, n, n);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = col;
      ctx.shadowColor = col;
      ctx.shadowBlur = 2 * sigma * D * k;
      ctx.shadowOffsetX = off;
      ctx.beginPath();
      ctx.arc(n / 2 - off, n / 2, r * D * k, 0, Math.PI * 2);
      ctx.fill();
      // a light seeded dither (about 2 levels) on the feather only, so a long soft falloff on a dark ground
      // does not step into rings; the solid core stays clean under B
      try {
        const img = ctx.getImageData(0, 0, n, n), px = img.data, rnd = prng(n * 7919 + 17);
        for (let i = 3; i < px.length; i += 4) {
          const v = px[i];
          if (v > 0 && v < 250) px[i] = clamp(Math.round(v + (rnd() + rnd() - 1) * 2), 0, 255);
        }
        ctx.putImageData(img, 0, 0);
      } catch (e) { /* a tainted or lost canvas keeps the plain feather */ }
    };
    const bake = () => {
      if (!lightOn) return;
      paint(disc, 1.1, 0.395, 0.051, 1, 720);
      if (halo) paint(halo, 2, 0.55, 0.15, 0.26, 560);
      if (bloom) paint(bloom, 2.2, 0.28, 0.24, 1, 400);
    };

    // The burst, in closed form (no physics engine under a scrub): u is the burst's own progress, 0-1.
    //   s = (1 - e^-3u) / (1 - e^-3)        air drag: fast launch, decelerating
    //   x = n.x R k s,  y = n.y R k s - L s + G u^2,  z = (Zc - (Zc - Ze) dn) s
    //   opacity = 1 - clamp((u - 0.04) / (0.30 + 0.45 dn))   centre letters go first, edge letters last
    // times the nav fade of the letter's projected top edge (perspective P, A's own scale), so a letter
    // that rises into the top 96px is already faint there.
    const renderA = (u) => {
      if (!S.pa.length) return;
      if (u <= 0) { if (!S.clean) resetA(); return; }
      S.clean = false;
      const g = G(), c = g.c;
      if (o.exit === 'crumble') {
        const t = 0.16 + 0.44 * u;
        for (const p of S.pa) {
          const f = clamp01((t - p.cs) / p.cd), e = f * f;
          p.el.style.transform = f > 0 ? `translate3d(${(p.dx * e).toFixed(2)}px,${(p.drop * e).toFixed(2)}px,0) rotate(${(p.rot * e).toFixed(2)}deg)` : '';
          p.el.style.opacity = f > 0 ? (1 - f).toFixed(3) : '';
        }
        return;
      }
      const s = (1 - Math.exp(-3 * u)) / DRAG;
      const fall = c.Gv * u * u, lift = c.L * s;
      // A's own scale at this u, from the release tween (0.955 → 1.06 over 0.16-0.40, power2.out), worked
      // out rather than read, so a reverse scrub (which renders the timeline's tweens in reverse order)
      // gives exactly the same frame
      const tr0 = clamp01((0.44 * u) / 0.24), sA = 0.955 + 0.105 * (1 - (1 - tr0) * (1 - tr0)), H2 = g.H / 2;
      for (const p of S.pa) {
        const q = g.a[p.i];
        const x = q.nx * c.R * p.k * s;
        const y = q.ny * c.R * p.k * s - lift + fall;
        const z = (c.Zc - (c.Zc - c.Ze) * q.dn) * s;
        const life = (u - 0.04) / (0.3 + 0.45 * q.dn);
        let tr = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,${z.toFixed(2)}px)`;
        if (c.tilt) tr += ` rotateX(${(p.tx * s).toFixed(2)}deg) rotateY(${(p.ty * s).toFixed(2)}deg)`;
        tr += ` rotateZ(${(p.spinS * (c.spin[0] + c.spin[1] * p.spinR) * u).toFixed(2)}deg)`;
        if (o.exit === 'detonate' && life > 0.85) { const f = clamp01((life - 0.85) / 0.15); tr += ` scale(${(1 - 0.2 * f * f).toFixed(3)})`; }
        let op = 1 - clamp01(life);
        if (op > 0 && q.f0 > 0) {
          const top = H2 + sA * (q.by + y - q.hh) * (c.P / Math.max(c.P * 0.2, c.P - z));
          op *= Math.min(1, navFade(top) / q.f0);
        }
        p.el.style.transform = tr;
        p.el.style.opacity = op.toFixed(3);
      }
    };

    const build = (tl, c) => {
      S.live = true;
      if (lightOn) root.classList.add('is-baked');
      prepare(c.phone);
      resetA();
      S.key = '';
      S.geo = null;
      S.P = { u: 0 };
      G();
      // T1 the side labels and the cue step aside
      const chrome = [labels, cue].filter(Boolean);
      if (chrome.length) tl.fromTo(chrome, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -12, duration: 0.12, ease: 'power1.in', immediateRender: false }, 0.04);
      // T2-T3 the breath in, then the release that carries the burst
      if (o.exit !== 'crumble') {
        tl.fromTo(a, { scale: 1 }, { scale: 0.955, duration: 0.1, ease: 'power2.inOut', immediateRender: false }, 0.06)
          .to(a, { scale: 1.06, duration: 0.24, ease: 'power2.out' }, 0.16);
      }
      // T4 the burst, written per letter from the proxy; T5 A leaves the page for good
      tl.fromTo(S.P, { u: 0 }, { u: 1, duration: 0.44, ease: 'none', immediateRender: false, onUpdate: () => renderA(S.P.u) }, 0.16)
        .set(a, { visibility: 'hidden' }, 0.6);
      // T6 the picture dims as the light opens, and drifts closer over the whole hold
      if (bg) {
        tl.fromTo(bg, { opacity: 1 }, { opacity: lightOn ? 0.42 : 0.7, duration: 0.42, ease: 'power1.inOut', immediateRender: false }, 0.18)
          .fromTo(bg, { scale: 1 }, { scale: 1.04, duration: 1, ease: 'none' }, 0);
      }
      // T7 the window glows first: the bloom swells from the headline's centre (0.20-0.34), then thins to
      // a skirt round the disc. T8 the disc condenses inside it: it starts at 0.12 of its size, so it is
      // already about 70px across when it begins to show, and comes in slowly (0.26-0.40) while it grows,
      // so its edge never reads crisp against the bloom; it opens to full by 0.62. T9 the halo spills
      // round both and settles. The fades use autoAlpha, so the three wide layers are not composited at all
      // while they are invisible (the first fifth of the scene).
      if (lightOn) {
        if (bloom) {
          tl.fromTo(bloom, { scale: 0.3 }, { scale: 1, duration: 0.2, ease: 'power1.out' }, 0.2)
            .fromTo(bloom, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.14 }, 0.2)
            .to(bloom, { autoAlpha: 0.35, duration: 0.24, ease: 'power1.inOut' }, 0.38);
        }
        tl.fromTo(disc, { scale: 0.12 }, { scale: 1, duration: 0.42, ease: 'power2.inOut' }, 0.2)
          .fromTo(disc, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.14, ease: 'power1.in' }, 0.26);
        if (halo) {
          tl.fromTo(halo, { scale: 0.2 }, { scale: 1, duration: 0.44, ease: 'power2.out' }, 0.22)
            .fromTo(halo, { autoAlpha: 0 }, { autoAlpha: 0.9, duration: 0.18, ease: 'power1.out' }, 0.22)
            .to(halo, { autoAlpha: 0.55, duration: 0.26, ease: 'power1.inOut' }, 0.4);
        }
      }
      // T10 B flies out of depth in reading order, shuffled inside each word, and lands by 0.80
      if (b && S.pb.length) {
        const span = Math.max(1, S.nW - 1);
        S.pb.forEach((p, i) => {
          const at = 0.5 + 0.1 * (p.wi / span) + 0.04 * p.r;
          tl.fromTo(p.el,
            { x: () => G().b[i].x, y: () => G().b[i].y, z: () => G().b[i].z, rotationX: p.rx, rotation: p.rz },
            { x: 0, y: 0, z: 0, rotationX: 0, rotation: 0, duration: 0.16, ease: 'expo.out' }, at)
            .fromTo(p.el, { opacity: 0 }, { opacity: 1, duration: 0.16, ease: 'power2.out' }, at);
        });
        tl.fromTo(b, { scale: 0.92 }, { scale: 1, duration: 0.3, ease: 'power2.out' }, 0.5);
        if (o.payoff === 'pass') tl.to(b, { z: 220, opacity: 0, duration: 0.14, ease: 'power1.in' }, 0.84);
      }
      // will-change only while the stage is on screen
      ScrollTrigger.create({ trigger: root, start: 'top bottom', end: 'bottom top', onToggle: (self) => root.classList.toggle('is-active', self.isActive) });
      S.tl = tl;
    };

    // The finished composition: unsplit text, A fitted to two lines.
    const rest = () => {
      S.live = false;
      S.tl = null;
      root.classList.remove('is-active', 'is-baked');
      unsplit(a);
      unsplit(b);
      S.pa = []; S.pb = [];
      S.phone = window.matchMedia('(max-width: 767px)').matches;
      fitA();
    };

    // Optional load intro for a scene that opens the page: the letters gather from a loose cloud.
    const intro = () => {
      if (!o.intro || !S.live || window.scrollY > 10 || root.getBoundingClientRect().top + window.scrollY > 10) return;
      const I = { u: 0.18 };
      const ls = labels ? [...labels.children] : [];
      const EV = ['wheel', 'touchstart', 'keydown', 'scroll'];
      let done = false, tw = null, lt = null;
      const stop = (e) => {
        if (done || (e && e.type === 'scroll' && window.scrollY <= 10)) return;
        done = true;
        if (tw) tw.kill();
        if (lt) lt.progress(1).kill();
        else if (ls.length) gsap.set(ls, { opacity: 1 });
        EV.forEach((n) => window.removeEventListener(n, stop));
        S.clean = false;
        renderA(S.P.u);
      };
      // the cloud waits for the fonts, so the letters gather in the face they will be read in
      if (ls.length) gsap.set(ls, { opacity: 0 });
      renderA(I.u);
      EV.forEach((n) => window.addEventListener(n, stop, { passive: true }));
      (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => requestAnimationFrame(() => {
        if (done) return;
        tw = gsap.to(I, { u: 0, duration: 1.1, ease: 'expo.out', onUpdate: () => { S.clean = false; renderA(I.u); }, onComplete: stop });
        lt = ls.length ? gsap.to(ls, { opacity: 1, duration: 0.4, delay: 0.6 }) : null;
      }));
    };

    // Late fonts and refreshes: refit and re-measure, then redraw the burst where the scroll left it.
    if (window.ScrollTrigger) {
      ScrollTrigger.addEventListener('refresh', () => { if (S.live && S.pa.length) { S.clean = false; renderA(S.P.u); } });
    }
    if (document.fonts) {
      let wait = 0;
      document.fonts.addEventListener('loadingdone', () => {
        S.fonts += 1;
        clearTimeout(wait);
        wait = setTimeout(() => {
          if (S.live && window.ScrollTrigger) { S.key = ''; ScrollTrigger.refresh(); } else fitA();
        }, 60);
      });
    }
    // the finished composition refits on resize (a live stage refits through the ScrollTrigger refresh)
    let raf = 0;
    if (window.ResizeObserver) new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { if (!S.live) fitA(); }); }).observe(stage);

    if (!window.Stage) return null;
    const scrub = o.scrub !== null ? o.scrub : (Stage.lenis ? true : 0.8);
    const mm = Stage.scene(root, {
      hold: o.hold,
      scrub,
      build,
      phone: o.phone === 'rest' ? 'rest' : { hold: o.phoneHold, build },
      rest,
    });
    if (!mm) return null;
    intro();
    // Stage work-around: gsap.matchMedia only calls back when one of its conditions matches, and reduced
    // motion on a desktop matches neither (motion, phone), so the stage never shows the finished
    // composition there. Do it here, and again whenever the media change into that state.
    if (window.matchMedia) {
      const motion = window.matchMedia('(prefers-reduced-motion: no-preference)');
      const small = window.matchMedia('(max-width: 767px)');
      const orphan = () => {
        if (motion.matches || small.matches) return;
        root.classList.remove('is-live');
        root.classList.add('is-rest');
        root.style.removeProperty('--hold');
        rest();
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
