// tasteskill / scenes / raster-cut.js — the raster cut between chapters (references/scenes.md).
//
// On a held stage the next chapter (B: a full-bleed picture, a calm texture or a flat colour) prints over
// the current one (A: a full-bleed picture or a flat ground) through a raster of horizontal slats with
// whole-pixel edges: bottom-first in two interlaced passes, each slat growing in whole steps, so for most
// of the cut the frame is striped with both chapters. The chapter title is drawn twice in exact register,
// once in each layer, so it changes from A's ink to B's ink line by line and never breaks apart: the slats
// over each line of the title are tied together and print that line whole, in one step, while the raster
// runs on around it. The deck sentence exists only in B and arrives after the last slat has closed. The pin releases onto exactly the
// same B ground, so the joint cannot be seen: over a B picture, the picture lifts off the foot of the stage
// as the deck arrives and leaves a band of --b-ground that runs straight on into the next section.
// Use it as the one repeating joint of a site: at most three cuts a page, three or more screens apart,
// never in neighbouring sections, one pattern per site, always the same direction going forward.
//
// DOM
//   <section class="scene" data-scene="raster-cut" data-options='{"pattern":"slats","nav":".bar"}'
//            style="--a-ground:#0F0F0E; --a-ink:#EDE8DD; --b-ground:#E8E3D7; --b-ink:#151514">
//     <div class="scene-stage">
//       <div class="rc-layer rc-a" aria-hidden="true">
//         <div class="rc-media"><img src="a.jpg" alt="" width="2400" height="1500"></div>  (leave empty for a flat ground)
//         <div class="rc-copy"><p class="rc-title">Two to four words</p></div>
//       </div>
//       <div class="rc-layer rc-b">
//         <div class="rc-media"><img src="b.jpg" alt="" width="2400" height="1500"></div>  (empty = flat ground)
//         <div class="rc-copy">
//           <h2 class="rc-title">Two to four words</h2>     (exactly the words of the A copy)
//           <p class="rc-deck">One sentence of 12-22 words, shown only in B.</p>
//         </div>
//       </div>
//       <p class="rc-line" aria-hidden="true">One short line</p>   (optional, pattern 'bands' only)
//     </div>
//   </section>
//   <section style="background:var(--b-ground)">the next chapter, on exactly --b-ground, title not repeated</section>
//
// Tokens (inline on the section; each ink 7:1 or better on its own ground, grounds ΔL* 50 or more apart):
//   --a-ground --a-ink   default to the page's --ink and --ground (the inverted chapter)
//   --b-ground --b-ink   default to the page's --ground and --ink; the next section's background must equal --b-ground
//   --a-scrim  flat black over an A picture, .3 (0-.6; raise it until the A ink reads 7:1 on the picture's
//              middle band, the demo's misty forest needs .55)
//   --b-scrim  flat wash over a B picture, 0 (0-.6), in --b-scrim-color (default black; use the B ground
//              itself, var(--b-ground), when a pale picture carries dark B ink)
//
// Options (data-options JSON)            default        range
//   pattern     'slats'       'slats' | 'blinds' (vertical windows) | 'bands' (heavy bands) | 'halftone'
//   count       10            slats 3-24 on desktop (8-12 reads best); bands 5 (3-8); blinds 3 (2-5)
//   phoneCount  12            slats 3-24 on a phone (12-15 reads best); bands and blinds as count
//   order       'interlace'   slats: 'interlace' (bottom-first in two passes: every other slat, then the slats
//                             between) | 'bottom' (one rising edge) | 'top' (footer curtain) | 'centre' (from the
//                             title) | 'shuffle'. Bands default to 'bottom'. The slats tied to a title line
//                             count as one slat in every order. Blinds: 'right' (sweeps right to left) | 'left'
//   steps       4             slats: each slat grows in this many whole steps (0 = smoothly, 1-8), never a step
//                             under 22px (a 70px phone slat prints in thirds); blinds, bands and halftone 0
//   amount      0.40          stagger spread 0.2-0.5 (0.30-0.48 reads best; bands 0.24); each slat runs 0.60 - amount
//   ease        'power2.out'  per slat, as GSAP names it: 'none' (mechanical, evenly spaced steps) | 'power2.out'
//                             (cubic, the default; its numbers match the spec's progress map) | 'power3.out'
//                             (quartic, a sharper refresh roll); blinds, bands and halftone default to 'none';
//                             bounce, elastic and back are refused
//   hold        1.2           screens held on desktop, 0.8-2 (above 1.5 only with the bands line)
//   phoneHold   1.2           screens held on a phone, 0.8-2
//   phone       'same'        'same' | 'rest' (the phone shows the finished composition)
//   fold        'auto'        over a B picture: lift the picture off the stage's foot at the end, so the
//                             next section joins on flat --b-ground. 'auto' = on when B has a picture;
//                             false (or data-rc-fold="off" on the section) keeps the picture full-bleed,
//                             for a B texture that the next section repeats as its own ground
//   cell        10            halftone dot pitch in px, 4-24; phoneCell 8
//   seed        7             the fixed shuffle (never random per visit)
//   nav         ''            selector of a fixed nav. It gets data-rc-ground="a|b" and --rc-nav-ink (switched when
//                             B covers its words, and no slat edge ever stops inside them), --rc-nav-ground, and
//                             data-rc-fill once the bar may take the B ground without cutting a picture: over a
//                             flat B as soon as B covers its whole strip, over a B picture when the pin
//                             releases. Style it .bar[data-rc-fill]{background:var(--rc-nav-ground)}
//   scrub       0.5           seconds of catch-up; true when Lenis smooths the page
//
// Progress map (desktop 1440x900, slats, N = 10, steps 4, hold 1.2, a two-line title, B a picture)
//   0-0.12     opening hold: A only, the title readable in A ink; an A picture eases from scale 1 to 1.05
//              until the cut ends
//   0.12-0.62  B prints in. Each slat rises from its own lower edge in quarter steps (22px at 900 tall),
//              cubic out, so the whole cut moves in one stepped, printed rhythm. The grid slides by up to
//              half a slat so an edge falls between the title's lines; the two slats over each line are tied
//              and print that line whole on its last step. Units (a slat, or a tied line) print in two
//              interlaced passes from the bottom: the bottom slat, the third from the bottom, the title's
//              first line, the second from the top; then the second from the bottom, the title's second
//              line, the third from the top, the top slat.
//              0.18-0.57: two or more separate B bands with A between, four from 0.36 to 0.44
//              0.35: the title's first line prints in B ink; 0.49: its second line. Between them each line
//              is whole in one ink on its own ground, never cut through its letters.
//              No strip of either ink is ever under 22px; the nav's words are never split.
//              A B picture settles from scale 1.08 to 1 over 0.12-1
//   0.58-0.62  the last top slit closes, clip-path none
//   0.62-0.76  over a B picture: the picture's foot lifts to 20px or more below the deck (it keeps 4/5 of
//              the stage when the deck allows), leaving a band of --b-ground 48px or more (7% of a tall
//              stage); with no room for that band the picture stays full-bleed
//   0.64-0.78  the deck rises 24px into place (fold and deck follow the cut's last visible step)
//   0.78-1     closing hold (0.26 screen); the pin releases onto the same ground
// Patterns: blinds sweep three windows across the width (0.60/0.45/0.30 of the scene each), and inside the
// title's columns each ink keeps 40px or more; bands print five heavy bands under a difference-blend line
// that the script sets inside one band clear of the title, the deck and the nav (hidden when no band is
// free), and that band prints in one step, so no edge ever crosses the line; halftone (flat B only) prints a
// B dot screen around solid plates that keep the title and the nav on A until the dots touch at about 0.53,
// then flip them to B in one step, so the words are never broken into dots.
// Phone (under 768px): the same cut with 12 slats (70px at 844 tall, printing in thirds) over a 1.2-screen
// hold, the copy inset 24px and the title at clamp(40px, 14.5vw, 60px) so 22 characters still set in two
// lines; up to six B bands at once, the first title line in B ink at about 0.33, the second at 0.51. Blinds
// stay 3, bands stay 5 and drop the line, the halftone pitch is 8px. The stage is 100lvh with the copy
// centred on 50svh.
// Reduced motion, no script or phone 'rest': the finished composition in raster-cut.css, a band of A, then
// B with the title once and the deck, joined by the cut frozen mid-way. Nothing is hidden.
(() => {
  const Scenes = (window.Scenes = window.Scenes || {});
  const CUT = 0.12;   // the cut starts after the opening hold
  const SPAN = 0.6;   // and is closed by 0.72
  const PAD = 2;      // px: both layers reach this far past the stage's top and bottom (raster-cut.css), so
                      // the stage's own clip is the only edge there and no device row blends A into B
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const num = (v, d) => (v === null || v === undefined || v === '' || !Number.isFinite(+v) ? d : +v);
  const safeEase = (e, d) => (typeof e === 'string' && e && !/bounce|elastic|back|rough|slow|steps/i.test(e) ? e : d);
  const svgUrl = (svg) => 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';

  // the fixed shuffle: a seeded generator, so every visit gets the same order
  const seeded = (s) => () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  // halftone: one dot per tile, an SVG mask image (no CSS gradient); quantised to 0.1px and cached, so
  // the browser decodes each size once
  const tiles = new Map();
  const tile = (cell, r) => {
    const k = cell + ':' + r;
    if (!tiles.has(k)) tiles.set(k, svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='${cell}' height='${cell}'><circle cx='${cell / 2}' cy='${cell / 2}' r='${r}'/></svg>`));
    return tiles.get(k);
  };
  // share of a tile a centred dot of radius f (in cells) covers
  const dotCover = (f) => (f <= 0.5 ? Math.PI * f * f : Math.min(1, Math.PI * f * f - 4 * (f * f * Math.acos(0.5 / f) - 0.5 * Math.sqrt(f * f - 0.25))));

  // the nav: every cut on the page claims it while the page is at or past that cut; the lowest claim wins
  const claims = new Map();  // nav element -> Map(scene root -> ['a' | 'b', ink, ground, fill])
  const claimNav = (nav, root, claim) => {
    let mine = claims.get(nav);
    if (!mine) claims.set(nav, (mine = new Map()));
    if (claim) mine.set(root, claim); else mine.delete(root);
    let win = null;
    for (const [r, c] of mine) if (!win || win[0].compareDocumentPosition(r) & Node.DOCUMENT_POSITION_FOLLOWING) win = [r, c];
    if (win) {
      nav.dataset.rcGround = win[1][0];
      nav.toggleAttribute('data-rc-fill', !!win[1][3]);
      nav.style.setProperty('--rc-nav-ink', win[1][1]);
      nav.style.setProperty('--rc-nav-ground', win[1][2]);
    } else {
      delete nav.dataset.rcGround;
      nav.removeAttribute('data-rc-fill');
      nav.style.removeProperty('--rc-nav-ink');
      nav.style.removeProperty('--rc-nav-ground');
    }
  };

  Scenes['raster-cut'] = (root, opts = {}) => {
    if (!root || !window.Stage) return null;
    const asked = opts.pattern || root.dataset.rcPattern;
    const pattern = ['slats', 'blinds', 'bands', 'halftone'].includes(asked) ? asked : 'slats';
    root.dataset.rcPattern = pattern;
    const blinds = pattern === 'blinds', bands = pattern === 'bands', dots = pattern === 'halftone';
    const hold = clamp(num(opts.hold, 1.2), 0.8, 2);
    const phoneHold = clamp(num(opts.phoneHold, Math.min(hold, 1.2)), 0.8, 2);
    const amount = clamp(num(opts.amount, bands ? 0.24 : 0.4), 0.2, 0.5);
    const ease = safeEase(opts.ease, blinds || bands ? 'none' : 'power2.out');
    const order = String(opts.order || (blinds ? 'right' : bands ? 'bottom' : 'interlace')).toLowerCase();
    // slats print in whole steps (a quarter of a slat each by default), so the cut has one printed rhythm
    const steps = clamp(Math.round(num(opts.steps, pattern === 'slats' ? 4 : 0)), 0, 8);
    // no step thinner than 22px: a 70px phone slat prints in thirds, a slat under 44px in one step
    const stepsFor = (slat) => (steps ? clamp(Math.floor(slat / 22), 1, steps) : 0);
    const centre = order === 'centre' || order === 'center';
    const seed = Math.round(num(opts.seed, 7));
    const scrub = opts.scrub ?? (Stage.lenis ? true : 0.5);
    const foldOpt = opts.fold ?? (root.dataset.rcFold === 'off' ? false : 'auto');
    if (foldOpt === false || foldOpt === 'off') root.dataset.rcFold = 'off';
    if (Stage.live && Stage.touch) ScrollTrigger.config({ ignoreMobileResize: true });

    const build = (tl, { stage, phone }) => {
      const a = root.querySelector('.rc-a'), b = root.querySelector('.rc-b');
      if (!a || !b) return;
      const aMedia = a.querySelector('.rc-media'), bMedia = b.querySelector('.rc-media');
      const titleB = b.querySelector('.rc-title') || a.querySelector('.rc-title');
      const deck = b.querySelector('.rc-deck'), line = root.querySelector('.rc-line');
      const pics = (m) => (m ? [...m.children].filter((c) => c.matches('img, video, picture, canvas, svg')) : []);
      const aPics = pics(aMedia), bPics = pics(bMedia);
      const fold = bPics.length > 0 && foldOpt !== false && foldOpt !== 'off';
      const navEl = opts.nav ? document.querySelector(opts.nav) : null;
      const buildId = (root.__rcBuild = (root.__rcBuild || 0) + 1);

      // slats (or windows): screen order, top to bottom (left to right for blinds)
      const n = dots ? 0 : blinds
        ? clamp(Math.round(num(phone ? opts.phoneCount ?? opts.count : opts.count, 3)), 2, 5)
        : bands
          ? clamp(Math.round(num(phone ? opts.phoneCount ?? opts.count : opts.count, 5)), 3, 8)
          : clamp(Math.round(phone ? num(opts.phoneCount, 12) : num(opts.count, 10)), 3, 24);
      const prox = Array.from({ length: n }, () => ({ v: 0 }));
      const slot = new Array(n);  // the proxy that drives screen slat j
      const far = new Array(n);   // true: slat j grows from its lower (right) edge; false: from its upper (left) edge
      const cell = clamp(Math.round(num(phone ? opts.phoneCell : opts.cell, phone ? 8 : 10)), 4, 24);
      const dot = { r: 0 };
      const lift = { f: 0 };

      if (dots) {
        b.style.setProperty('--rc-cell', cell + 'px');
        tl.fromTo(dot, { r: 0 }, { r: 0.73 * cell, duration: SPAN, ease: 'none' }, CUT);
      } else if (blinds) {
        // the windows all start together, the leading one fastest: a sweep across the width
        const leftward = order !== 'left';
        for (let j = 0; j < n; j++) {
          slot[j] = j; far[j] = leftward;
          const t = n === 1 ? 0 : j / (n - 1);
          tl.fromTo(prox[j], { v: 0 }, { v: 1, duration: leftward ? 0.6 - 0.3 * t : 0.3 + 0.3 * t, ease }, CUT);
        }
      } else {
        // which proxy drives which slat is settled in measure() (sequence), once the title's lines are known
        for (let j = 0; j < n; j++) { slot[j] = order === 'top' ? j : n - 1 - j; far[j] = order !== 'top'; }
        tl.fromTo(prox, { v: 0 }, { v: 1, duration: SPAN - amount, ease, stagger: { amount } }, CUT);
      }

      // pictures decode before they move (Stage.ready only waits for the ones still loading). The pictures
      // themselves scale, not .rc-media, so the fold's clip on .rc-media stays a whole-pixel edge.
      for (const img of root.querySelectorAll('.rc-media img')) {
        if (img.loading === 'lazy') img.loading = 'eager';
        if (img.decode) img.decode().catch(() => {});
      }
      // stepped slats show their last step before their tween ends: the fold and the deck follow the last
      // visible step, so nothing waits on a finished frame
      let cutEnd = CUT + SPAN;
      if (!dots && !blinds && steps) {
        const st = stepsFor((stage.getBoundingClientRect().height || innerHeight) / n);
        const ef = gsap.parseEase(ease) || ((x) => x), goal = (st - 0.5) / st;
        let t = 0;
        while (t < 1 && ef(t) < goal) t += 0.005;
        cutEnd = Math.min(CUT + SPAN, CUT + amount + (SPAN - amount) * t);
      }
      if (aPics.length) tl.fromTo(aPics, { scale: 1 }, { scale: 1.05, duration: cutEnd }, 0);
      if (bPics.length) tl.fromTo(bPics, { scale: 1.08 }, { scale: 1, duration: 1 - CUT }, CUT);
      if (fold) tl.fromTo(lift, { f: 0 }, { f: 1, duration: 0.14, ease: 'power2.out' }, cutEnd);
      if (deck) tl.fromTo(deck, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.14, ease: 'power2.out' }, cutEnd + 0.02);
      if (line && bands) tl.fromTo(line, { xPercent: 0 }, { xPercent: -30, duration: 1 }, 0);

      // ---- the nav follows the ground under it ----
      let navOn = false, navPast = false, navState = null, cover = 0, coverBar = 0;
      const inks = {};
      const readInks = () => {
        const cs = getComputedStyle(root);
        for (const s of ['a', 'b']) inks[s] = [cs.getPropertyValue(`--${s}-ink`).trim(), cs.getPropertyValue(`--${s}-ground`).trim()];
      };
      const applyNav = () => {
        if (!navEl || !inks.a) return;
        const s = navOn ? (cover >= 0.5 ? 'b' : 'a') : '';
        // a filled bar is invisible only over flat B: past the cut, or over a flat B that covers the whole strip
        const fill = s === 'b' && (navPast || (!bPics.length && coverBar >= 1));
        const key = s + (fill ? '+' : '');
        if (key === navState) return;
        navState = key;
        claimNav(navEl, root, s ? [s, inks[s][0], inks[s][1], fill] : null);
      };

      // ---- measure(): whole-pixel edges and the guarded rows; render(): the clip from those edges ----
      let W = 0, H = 0, edges = [], snaps = [], downs = [], guards = [], plates = [], foldY = 0;
      let navTxt = null, navBar = 0, sliver = 3, minT = 16, near = null, st = 0;
      let tied = new Int16Array(0);  // per slat: the title line (group) it is tied to, or -1

      // the order the units print in. A unit is one slat, or the slats tied to one title line; units take
      // the timeline's proxies evenly from first to last, so the cut keeps its length whatever the title
      const sequence = (tc) => {
        const units = [];
        for (let j = 0; j < n; j++) {
          const u = units[units.length - 1];
          if (u && tied[j] >= 0 && u.g === tied[j]) u.s.push(j); else units.push({ g: tied[j], s: [j] });
        }
        const U = units.length, idx = [...Array(U).keys()], mid = (u) => (edges[u.s[0]] + edges[u.s[u.s.length - 1] + 1]) / 2;
        let seq;
        if (order === 'top') seq = idx;
        else if (centre) seq = idx.slice().sort((x, y) => Math.abs(mid(units[x]) - tc) - Math.abs(mid(units[y]) - tc) || y - x);
        else if (order === 'shuffle') {
          const rnd = seeded(seed); seq = idx.slice();
          for (let i = U - 1; i > 0; i--) { const k = Math.floor(rnd() * (i + 1)); [seq[i], seq[k]] = [seq[k], seq[i]]; }
        } else if (order === 'bottom') seq = idx.slice().reverse();
        else {
          // interlace (the default): bottom-first in two passes, every other unit and then the units
          // between, so the whole frame is a raster of both chapters while the title changes ink
          const up = idx.slice().reverse();
          seq = [...up.filter((_, k) => k % 2 === 0), ...up.filter((_, k) => k % 2 === 1)];
        }
        seq.forEach((u, i) => {
          const rank = U > 1 ? Math.round((i * (n - 1)) / (U - 1)) : 0;
          for (const j of units[u].s) {
            slot[j] = rank;
            // centre-out: above the title a slat grows upward, below it downward
            far[j] = order === 'top' ? false : centre ? (edges[j] + edges[j + 1]) / 2 <= tc : true;
          }
        });
      };
      // null: the first render always writes, so nothing a previous build left behind survives
      let lastClip = null, lastMask = null, lastLift = null, covered = null;
      const px = (el) => parseFloat(getComputedStyle(el).fontSize) || 0;

      // runs along y (stage pixels) as one polygon; the layer starts PAD above the stage. A run that reaches
      // the stage's edge is drawn past it, and runs are joined by zero-width segments outside the box.
      const polyY = (m) => {
        const top = -2, bottom = H + 2 * PAD + 2;
        const y = (v) => (v <= 0 ? top : v >= H ? bottom : v + PAD);
        return 'polygon(' + m.map(([a0, a1]) => `-2px ${y(a0)}px,${W + 2}px ${y(a0)}px,${W + 2}px ${y(a1)}px,-2px ${y(a1)}px`).join(',') + ')';
      };
      const polyX = (m) => {
        const top = -2, bottom = H + 2 * PAD + 2;
        const x = (v) => (v <= 0 ? -2 : v >= W ? W + 2 : v);
        return 'polygon(' + m.map(([a0, a1]) => `${x(a0)}px ${bottom}px,${x(a0)}px ${top}px,${x(a1)}px ${top}px,${x(a1)}px ${bottom}px`).join(',') + ')';
      };
      const covering = (m, lo, hi) => { let c = 0; for (const r of m) c += Math.max(0, Math.min(r[1], hi) - Math.max(r[0], lo)); return hi > lo ? c / (hi - lo) : 0; };

      const render = () => {
        if (!W || !H) return;
        let clip, mask = null, whole = false;
        if (dots) {
          const r = Math.round(dot.r * 10) / 10;
          if (r <= 0) { clip = 'inset(100% 0 0 0)'; cover = coverBar = 0; }
          else if (r >= cell * 0.7072) { clip = 'none'; cover = coverBar = 1; whole = true; }
          else if (r < cell / 2 || !plates.length) {
            // the dot screen, with the plates (title band, nav strip) kept on solid A until the dots touch
            const open = []; let y0 = 0;
            for (const [p0, p1] of plates) { if (p0 > y0) open.push([y0, p0]); y0 = Math.max(y0, p1); }
            if (y0 < H) open.push([y0, H]);
            clip = plates.length ? polyY(open) : 'none';
            mask = [tile(cell, r), `${cell}px ${cell}px`, 'repeat', '50% 50%'];
            cover = coverBar = plates.length ? 0 : dotCover(r / cell);
          } else {
            // the dots touch: the plates flip to B in one step, the screen closes around them
            clip = 'none';
            mask = [tile(cell, r) + ',' + plateImg(), `${cell}px ${cell}px,100% 100%`, 'repeat,no-repeat', '50% 50%,0 0'];
            cover = coverBar = 1;
          }
        } else {
          const L = blinds ? W : H, runs = [];
          for (let j = 0; j < n; j++) {
            const s = edges[j], e = edges[j + 1], len = e - s, v = prox[slot[j]].v;
            // stepped: the slat takes the last allowed size at or under its step, so a slat that may not
            // stop on the title prints its band there in one go, on its last step, in the same rhythm; a
            // slat tied to a title line prints whole, with its line, on the line's last step
            const g = tied[j] >= 0
              ? ((st ? Math.round(v * st) >= st : v >= 0.5) ? len : 0)
              : st
                ? downs[j][clamp(Math.round((Math.round(v * st) / st) * len), 0, len)]
                : snaps[j][clamp(Math.round(v * len), 0, len)];
            if (g > 0) runs.push(far[j] ? [e - g, e] : [s, s + g]);
          }
          runs.sort((p, q) => p[0] - q[0]);
          let m = [];  // touching or overlapping runs merge, so a finished neighbour leaves no seam
          for (const r of runs) { const t = m[m.length - 1]; if (t && r[0] <= t[1]) t[1] = Math.max(t[1], r[1]); else m.push(r.slice()); }
          if (near) m = tidy(m);
          if (!m.length) clip = blinds ? 'inset(0 0 0 100%)' : 'inset(100% 0 0 0)';
          else if (m.length === 1 && m[0][0] <= 0 && m[0][1] >= L) { clip = 'none'; whole = true; }
          else clip = blinds ? polyX(m) : polyY(m);
          if (navEl) {
            if (blinds) cover = coverBar = covering(m, 0, W);
            else { cover = navTxt ? covering(m, navTxt[0], navTxt[1]) : 0; coverBar = covering(m, 0, navBar); }
          }
        }
        if (clip !== lastClip) { b.style.setProperty('--rc-clip', clip); lastClip = clip; }
        const mk = mask ? mask.join('|') : '';
        if (mk !== lastMask) {
          lastMask = mk;
          const names = ['--rc-mask', '--rc-mask-size', '--rc-mask-repeat', '--rc-mask-pos'];
          names.forEach((p, i) => (mask ? b.style.setProperty(p, mask[i]) : b.style.removeProperty(p)));
        }
        if (fold) {
          const cut = foldY < H ? Math.round(lift.f * (H + PAD - foldY)) : 0;
          const lc = cut > 0 ? `inset(0 0 ${cut}px 0)` : '';
          if (lc !== lastLift) { bMedia.style.clipPath = lc; lastLift = lc; }
        }
        if (whole !== covered) { covered = whole; root.toggleAttribute('data-rc-covered', whole); }  // A rests unpainted under a whole B
        applyNav();
      };

      // around the title (0.6em above its letters to 0.6em below them) no strip of either ink may be thinner
      // than minT: a thin one takes the ink of its neighbours, so a slat closes early (or opens late) there
      // instead of laying an underline or an overline along the words. Flipping a strip only merges it with
      // a neighbour, so it can never make another strip thinner.
      const tidy = (m) => {
        const [z0, z1, min] = near;
        for (let pass = 0; pass < 8; pass++) {
          const pcs = []; let y = 0;
          for (const [a0, a1] of m) { if (a0 > y) pcs.push([y, a0, 0]); pcs.push([a0, a1, 1]); y = a1; }
          if (y < H) pcs.push([y, H, 0]);
          if (pcs.length < 2) return m;
          const thin = pcs.find(([p0, p1]) => p1 - p0 < min && p1 > z0 && p0 < z1);
          if (!thin) return m;
          thin[2] ^= 1;
          m = [];
          for (const [p0, p1, isB] of pcs) if (isB) { const t = m[m.length - 1]; if (t && t[1] >= p0) t[1] = p1; else m.push([p0, p1]); }
        }
        return m;
      };

      // the halftone plates as one mask layer the size of the B layer (W x H + 2 PAD)
      let plateKey = '', plateUrl = '';
      const plateImg = () => {
        const k = W + 'x' + H + ':' + plates.join(';');
        if (k !== plateKey) {
          plateKey = k;
          plateUrl = svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H + 2 * PAD}' viewBox='0 0 ${W} ${H + 2 * PAD}' preserveAspectRatio='none'>` +
            plates.map(([p0, p1]) => `<rect x='-2' y='${p0 + PAD}' width='${W + 4}' height='${p1 - p0}'/>`).join('') + '</svg>');
        }
        return plateUrl;
      };

      // the foot of a B picture at rest: just below the deck (or the title), leaving a band of --b-ground
      const foldAt = () => {
        if (!fold || !H) return H;
        const sr = stage.getBoundingClientRect();
        let low = 0;
        if (titleB) low = titleB.getBoundingClientRect().bottom - sr.top + 0.14 * px(titleB);
        if (deck && deck.offsetParent) low = Math.max(low, deck.offsetParent.getBoundingClientRect().top - sr.top + deck.offsetTop + deck.offsetHeight);
        // the picture keeps 4/5 of the stage when the deck allows, and ends 20px or more under the deck;
        // the band under it is 48px (or 7% of the stage) or more, so a short screen still gets one
        const y = Math.round(Math.max(low + Math.max(20, 0.03 * H), H * 0.8));
        return y > H - Math.max(48, 0.07 * H) ? H : y;   // no room for a band at all: the picture stays full-bleed
      };

      // the bands line sits inside one band, clear of the title, the deck and the nav, and flips in one step
      const placeLine = (sr) => {
        if (!(bands && line) || phone) return null;
        const busy = [];
        if (titleB) { const r = titleB.getBoundingClientRect(), f = px(titleB); busy.push([r.top - sr.top - 0.1 * f, r.bottom - sr.top + 0.2 * f]); }
        if (deck && deck.offsetParent) { const t = deck.offsetParent.getBoundingClientRect().top - sr.top + deck.offsetTop; busy.push([t, t + deck.offsetHeight]); }
        if (navEl) busy.push([0, navBar]);
        const free = (k) => busy.every(([p, q]) => q <= edges[k] || p >= edges[k + 1]);
        const tTop = busy.length ? busy[0][0] : H / 2;
        let k = -1;
        for (let j = n - 1; j >= 0; j--) if (edges[j + 1] <= tTop && free(j)) { k = j; break; }      // nearest band above the title
        if (k < 0) for (let j = 0; j < n; j++) if (edges[j] >= tTop && free(j)) { k = j; break; }    // else the first free band below
        if (k < 0) { root.dataset.rcLine = 'off'; return null; }
        delete root.dataset.rcLine;
        const top = edges[k], h = edges[k + 1] - edges[k], f = Math.round(Math.min(0.09 * W, 0.7 * h));
        root.style.setProperty('--rc-line-top', top + 'px');
        root.style.setProperty('--rc-line-h', h + 'px');
        root.style.setProperty('--rc-line-size', f + 'px');
        return [top, top + h, Infinity];  // its band prints in one step: no edge ever crosses the line
      };

      // for each slat, the nearest grown size that leaves no thin strip: a slat shows B only from `sliver`
      // px and shuts once less than `sliver` of A is left; inside a guarded run of rows (the title) both
      // inks keep at least `min` px; across the nav's words no edge ever stops (min = Infinity)
      const buildSnaps = () => {
        snaps = []; downs = [];
        for (let j = 0; j < n; j++) {
          const s = edges[j], e = edges[j + 1], len = e - s, fj = far[j];
          const ok = new Uint8Array(len + 1);
          for (let g = 0; g <= len; g++) {
            if ((g > 0 && g < sliver) || (len - g > 0 && len - g < sliver)) continue;
            const b0 = fj ? e - g : s, b1 = fj ? e : s + g, a0 = fj ? s : s + g, a1 = fj ? e - g : e;
            let good = true;
            for (const [lo, hi, min] of guards) {
              const bt = Math.min(b1, hi) - Math.max(b0, lo), at = Math.min(a1, hi) - Math.max(a0, lo);
              if (bt > 0 && at > 0 && (bt < min || at < min)) { good = false; break; }
            }
            if (good) ok[g] = 1;
          }
          ok[0] = ok[len] = 1;
          const snap = new Int16Array(len + 1), down = new Int16Array(len + 1);
          for (let g = 0; g <= len; g++) { let d = 0; for (;;) { if (g - d >= 0 && ok[g - d]) { snap[g] = g - d; break; } if (g + d <= len && ok[g + d]) { snap[g] = g + d; break; } d++; } }
          for (let g = 0, last = 0; g <= len; g++) { if (ok[g]) last = g; down[g] = last; }
          snaps.push(snap); downs.push(down);
        }
      };

      // the rows the title's letters actually cover: from the ascenders of its first line to the baseline
      // (or the descenders) of its last line, found with two zero-size baseline markers
      const inkRows = (el, sr) => {
        const f = px(el), mark = () => { const s = document.createElement('span'); s.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline'; return s; };
        const m0 = mark(), m1 = mark();
        el.prepend(m0); el.append(m1);
        const b0 = m0.getBoundingClientRect().bottom, b1 = m1.getBoundingClientRect().bottom;
        m0.remove(); m1.remove();
        let lastTop = -Infinity, last = '', lines = 0;
        const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), rg = document.createRange();
        for (let t = tw.nextNode(); t; t = tw.nextNode()) {
          for (const w of t.nodeValue.matchAll(/\S+/g)) {
            rg.setStart(t, w.index); rg.setEnd(t, w.index + w[0].length);
            const q = rg.getBoundingClientRect();
            if (!q.height) continue;
            if (q.top > lastTop + 1) { lastTop = q.top; last = w[0]; lines++; } else last += w[0];
          }
        }
        const desc = /[gjpqyQ,;]/.test(last);
        // every line's baseline (the lines share one line-height, so they sit at an even pitch)
        const bases = Array.from({ length: Math.max(1, lines) }, (_, k) => b0 - sr.top + (lines > 1 ? (k * (b1 - b0)) / (lines - 1) : 0));
        return [b0 - sr.top - 0.8 * f, b1 - sr.top + (desc ? 0.24 : 0.02) * f, bases];
      };

      const measure = () => {
        const sr = stage.getBoundingClientRect();
        W = Math.round(sr.width); H = Math.round(sr.height);
        if (!W || !H) return;
        const L = blinds ? W : H;
        const slat = n ? L / n : L;
        // horizontal slats follow the title's lines. The grid slides (the top and bottom slats take up the
        // difference, half a slat at most) to put an edge between each pair of lines where it can; every
        // slat over a line's letters is then tied to that line and changes ink with it, in one step, so a
        // line of the title is only ever in one ink. Lines that share a slat change together.
        let phase = 0, ink = null, cores = [];
        sliver = clamp(Math.round(0.2 * slat), 3, 40);
        minT = clamp(Math.round(0.3 * slat), 16, 40);
        st = dots ? 0 : stepsFor(slat);
        if (!blinds && !dots && n > 1 && titleB) {
          ink = inkRows(titleB, sr);
          const f = px(titleB), asc = 0.76 * f, bases = ink[2];
          cores = bases.map((b, i) => [i === 0 ? ink[0] : b - asc, i === bases.length - 1 ? ink[1] : b + 0.02 * f]);
          const gaps = bases.slice(1).map((b, i) => (bases[i] + b - asc) / 2);
          let best = Infinity;
          for (let d = -Math.floor(slat / 2); d <= Math.floor(slat / 2); d++) {
            let miss = 0;
            for (const gc of gaps) {
              let m = Infinity;
              for (let k = 1; k < n; k++) m = Math.min(m, Math.abs(Math.round(k * slat + d) - gc));
              miss += Math.max(0, Math.min(m, slat / 2) - 0.05 * f);
            }
            const cost = Math.round(miss) * 1000 + Math.abs(d);
            if (cost < best) { best = cost; phase = d; }
          }
        }
        edges = Array.from({ length: n + 1 }, (_, k) => (k === 0 ? 0 : k === n ? L : Math.round((k * L) / n + phase)));
        // tie the slats over each line's letters into one unit (lines that share a slat share the unit)
        tied = new Int16Array(n).fill(-1);
        if (cores.length) {
          const par = cores.map((_, i) => i), find = (i) => (par[i] === i ? i : (par[i] = find(par[i])));
          const of = new Array(n).fill(-1);
          for (let j = 0; j < n; j++) for (let i = 0; i < cores.length; i++) {
            if (Math.min(edges[j + 1], cores[i][1]) - Math.max(edges[j], cores[i][0]) <= 0) continue;
            if (of[j] < 0) of[j] = i; else par[find(i)] = find(of[j]);
          }
          for (let j = 0; j < n; j++) if (of[j] >= 0) tied[j] = find(of[j]);
        }
        if (!blinds && !dots) sequence(ink ? (ink[0] + ink[1]) / 2 : H / 2);
        const em = titleB ? px(titleB) : 0;
        near = ink ? [ink[0] - 0.6 * em, ink[1] + 0.6 * em, minT] : null;
        // the nav sits over the stage while it is held: its strip and the rows of its words, in viewport pixels
        navBar = navEl ? clamp(Math.round(navEl.getBoundingClientRect().bottom), 1, H) : 0;
        navTxt = null;
        if (navEl) {
          const rg = document.createRange(); rg.selectNodeContents(navEl);
          let t0 = Infinity, t1 = -Infinity;
          for (const q of rg.getClientRects()) if (q.width > 0 && q.height > 0) { t0 = Math.min(t0, q.top); t1 = Math.max(t1, q.bottom); }
          if (t0 < t1) navTxt = [Math.max(0, Math.floor(t0)), Math.min(H, Math.ceil(t1))];
        }
        guards = []; plates = [];
        if (titleB) {
          const r = titleB.getBoundingClientRect(), f = px(titleB);
          if (blinds) {
            const rg = document.createRange(); rg.selectNodeContents(titleB);
            let l = Infinity, rr = -Infinity;
            for (const q of rg.getClientRects()) if (q.width > 0) { l = Math.min(l, q.left); rr = Math.max(rr, q.right); }
            if (l < rr) guards.push([Math.floor(l - sr.left - 0.04 * f), Math.ceil(rr - sr.left + 0.04 * f), minT]);
          } else {
            // horizontal slats: no edge ever stops inside the title's rows, so each slat prints its part
            // of the title in one step and the title changes ink in whole bands, never in lines
            const t0 = r.top - sr.top, t1 = r.bottom - sr.top;
            guards.push([Math.floor(t0 - 0.06 * f), Math.ceil(t1 + 0.14 * f), Infinity]);
            if (dots) { const p = clamp(0.2 * f, 16, 40); plates.push([Math.max(0, Math.floor(t0 - p)), Math.min(H, Math.ceil(t1 + 0.1 * f + p))]); }
          }
          // a slat that only grazes the title, or lies almost wholly on it, is taken in whole: no thin strip
          // of it can lie on the title, or hug its edge, next to a neighbour of the other ink
          const gd = guards[guards.length - 1], thr = Math.min(gd ? gd[2] : 0, Math.round(0.3 * slat));
          if (gd) for (let j = 0; j < n; j++) {
            const o = Math.min(edges[j + 1], gd[1]) - Math.max(edges[j], gd[0]), len = edges[j + 1] - edges[j];
            if (o > 0 && (o < thr || len - o < thr)) { gd[0] = Math.min(gd[0], edges[j]); gd[1] = Math.max(gd[1], edges[j + 1]); }
          }
        }
        if (!blinds && navTxt) guards.push([navTxt[0], navTxt[1], Infinity]);
        if (dots && navEl) plates.unshift([clamp(Math.floor(navEl.getBoundingClientRect().top), 0, H), navBar]);
        if (plates.length > 1) {  // merge plates that meet
          plates.sort((p, q) => p[0] - q[0]);
          plates = plates.reduce((acc, p) => { const t = acc[acc.length - 1]; if (t && p[0] <= t[1]) t[1] = Math.max(t[1], p[1]); else acc.push(p.slice()); return acc; }, []);
        }
        const lg = placeLine(sr);
        if (lg) guards.push(lg);
        foldY = foldAt();
        if (!dots) buildSnaps();
        readInks();
        lastClip = lastMask = lastLift = covered = null;
        render();
      };

      readInks();
      tl.eventCallback('onUpdate', render);
      // re-measure on every refresh (resize, fonts, pictures), never on a phone toolbar; switch the nav
      // while the page is at or past the scene (the next section is on B by contract)
      ScrollTrigger.create({
        trigger: root,
        start: () => 'top ' + (navEl ? Math.round(navEl.offsetHeight / 2) : 0) + 'px',
        end: 'max',
        onRefresh: (self) => { navOn = self.isActive; measure(); },
        onToggle: (self) => { navOn = self.isActive; applyNav(); },
      });
      if (navEl) {
        // past the cut (the pin has released and the stage starts to scroll away): the bar takes the B
        // ground, so the stage's words and the next section never run under the bar's words
        ScrollTrigger.create({
          trigger: root,
          start: 'bottom bottom',
          end: 'max',
          onRefresh: (self) => { navPast = self.isActive; applyNav(); },
          onToggle: (self) => { navPast = self.isActive; applyNav(); },
        });
      }
      measure();
      // a late font or a reflow changes the title's box: re-measure the guarded rows
      if (titleB && window.ResizeObserver) {
        const ro = new ResizeObserver(() => { if (root.__rcBuild !== buildId || !root.classList.contains('is-live')) return ro.disconnect(); measure(); });
        ro.observe(titleB);
      }

      // when the scene leaves its live state (reduced motion switched on, a phone set to 'rest', a
      // rebuild at another size), hand the nav back to the page and drop the inline fold
      if (window.MutationObserver) {
        const mo = new MutationObserver(() => {
          if (root.__rcBuild !== buildId) return mo.disconnect();
          if (root.classList.contains('is-live')) return;
          navOn = false; navPast = false; applyNav();
          if (bMedia) bMedia.style.clipPath = '';
          mo.disconnect();
        });
        mo.observe(root, { attributes: true, attributeFilter: ['class'] });
      }
    };

    return Stage.scene(root, {
      hold,
      scrub,
      build,
      phone: opts.phone === 'rest' ? 'rest' : { hold: phoneHold, build },
    });
  };
})();
