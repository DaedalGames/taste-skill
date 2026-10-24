// tasteskill / scenes / depth-card-flythrough.js — a fly-through of captioned photo cards.
//
// The camera runs forward into a one-point-perspective picture (a jetty, a road, a rail line running to
// the horizon). The ground below the horizon streams toward the reader while the far scene closes in,
// and photo cards start as faint chips at the vanishing point, grow to reading size on alternating sides
// and fly out past the screen edges, the near ones as huge passing ghosts. One short statement at a time
// changes on the top-centre axis, paired with the card that is at reading size; the first statement
// opens larger, as the scene's title, and settles as the first card arrives.
// Use it for 5-12 proof points, manifesto lines or a product world; skip it for dense copy or photos
// that cannot be made to look like one place. Load after stage.js.
//
// DOM:
//   <section class="scene fly" data-scene="depth-card-flythrough" data-options='{"inAir":3}' aria-label="…">
//     <div class="scene-stage fly__stage">
//       <div class="fly__backdrop">
//         <img class="fly__backdrop-img" src="…" alt="" width="2400" height="1500" fetchpriority="high">
//         (or, for a moving backdrop: <video class="fly__backdrop-video" src="…" poster="…" muted playsinline preload="auto"></video>)
//       </div>
//       <div class="fly__scrim" aria-hidden="true"></div>                       (optional, see --fly-scrim)
//       <div class="fly__field">
//         <figure class="fly__card" style="--dy:2">                               (x N, 3-12; 7 reads best)
//           <img class="fly__img" src="…" alt="What the photo shows" width="1200" height="800">
//           <span class="fly__fog" aria-hidden="true"></span>
//           <figcaption class="fly__cap">One to four words</figcaption>
//         </figure>
//       </div>
//       <div class="fly__copy">
//         <ol class="fly__lines">
//           <li class="fly__line">Statement one, the scene title.</li>             (x N, statement k pairs with card k)
//         </ol>
//         <p class="fly__count" aria-hidden="true"><span class="fly__count-now">1</span> of <span class="fly__count-all">7</span></p>
//       </div>
//     </div>
//   </section>
// Cards fly on the left, right, left… (data-side="-1" or "1" on a card overrides). --dy is the card's
// drop below the vanishing point in vh, 0-8; leave it out and the pattern 2 0 4 1 5 0 3 repeats.
// Add class is-portrait to a card holding a 4:5 photo (two at most, never two in a row).
// Statements: 4-7 words, about 34 characters, so they hold two lines at the live size. Captions: 1-4
// words, 22 characters at most. In flight the script shows each caption as a flat tag of constant size
// (div.fly__tags, aria-hidden) riding its card's inner top corner: it comes in as the card reaches
// reading size, is fully on by the time its statement does, and leaves as the card grows past reading
// size (or nears the screen edge), so a passing ghost is picture only and no label is ever louder than
// the statement. The figcaption stays in the card for screen readers and the finished composition.
// The backdrop needs its vanishing point on the vertical centre line at --fly-vp (56% of the stage by
// default; set it to where the picture's own lines meet) and a calm, low-detail band above it for the
// statement. With a still picture the script lays a copy of it over the ground (everything below the
// vanishing point) and runs the camera over it: the ground streams toward the reader along the lines that
// meet at the vanishing point, while the far scene holds. That suits a jetty, road, runway, rail line or
// floor; set run 0 for a picture whose lower half is not ground.
// A <video> backdrop is scrubbed instead (currentTime = progress x duration): a 6-10 s muted forward
// move, encoded with a keyframe on every frame so it seeks cleanly
// (ffmpeg -i in.mp4 -an -vf scale=1920:-2 -c:v libx264 -g 1 -crf 24 -movflags +faststart out.mp4),
// and give it a poster for the finished composition.
// Bake one grade into every card photo (same white balance, muted colour); no CSS filters.
//
// Options (data-options), defaults first:
//   inAir       cards in the air at once. 3                                                  (2-4)
//   phoneInAir  cards in the air at once on a phone: two, so the passing card and the next   (2-3)
//               one sit on opposite sides and never overlap. 2
//   hold        screens the stage is held for. Default 0.36 / slot: 3.3 for 7 cards, 1.8 for 3,
//               5.1 for 12 (slot = 1 / (cards + 0.88 inAir - 0.55)); a phone works it out from
//               phoneInAir (3.0 for 7 cards)                                                 (1.5-6)
//   sideX       how far out the cards fly, as a share of the stage width. 0.32                (0.28-0.38)
//   endScale    how large a card is when it leaves. 4 = the bold ghost pass at the edge,      (2.5-5)
//               2.5 = a calm drift. The phone keeps 2.5 at most.
//   yaw         inward turn in degrees: the cards stand as the walls of a corridor. 8;        (0-14)
//               0 = flat cards facing the camera. A turned card straightens as it passes, so
//               its outer edge never comes nearer than 0.8 x perspective; above 8 degrees a
//               passing ghost is fainter, as a turned ghost covers more of the frame.
//   perspective camera lens in px; lower is wider and faster at the edges. 300                (240-600)
//   title       how much larger statement one stands at the start, as the scene's title. It  (1-1.6)
//               settles to statement size as the first card reaches reading size, and never
//               grows wider than the stage. 1.3; 1 = no change
//   dolly       backdrop scale as the camera moves in. 1.35 for a still, 1.08 for a video     (1-1.6)
//               (a phone uses 60% of the move)
//   run         how far the camera runs over the ground of a still backdrop: the share of     (0-0.7)
//               the way to the ground at the bottom edge. 0.45; 0 = the dolly alone
//   arrive      pull back and lift in the last 10%, a short arrival beat. true
//   haze        fog left on a card at its nearest, to pull the photos into one grade. 0      (0-0.3)
//   count       show "3 of 7" under the statement. true
//   phone       'same' (the fly-through with phone numbers) | 'rest' (the finished composition). 'same'
//   phoneMax    more cards than this and a phone gets the finished composition. 9              (3-12)
//   phoneSideX  how far out the cards fly on a phone. 0.33; never less than half a card, so     (0.22-0.45)
//               the passing card and the next one stay on their own sides of the centre line
//   phoneDy     drop below the vanishing point on a phone, in vh. 6                           (0-30)
//   phoneYaw    inward turn on a phone. 3                                                     (0-12)
// The script adds a visually hidden copy of the statements (ol.fly__sr) so a screen reader hears all of
// them while only one is on screen; the visible list is aria-hidden only while the flight runs.
// Page tokens it takes: --ink (statement), --font-display. Set per backdrop on the section (plain
// `.fly { … }` wins; the scene's defaults sit in :where()):
//   --fly-stage (the backdrop's horizon colour; the ground of the finished wall), --fly-fog (haze
//   colour, defaults to --fly-stage), --fly-ink (statement colour on the photo; must reach 4.5:1 on the
//   band behind it), --fly-shade / --fly-scrim (a flat fill over the whole backdrop when white text needs
//   it), --fly-vp / --fly-focus / --fly-lift (where the vanishing point sits; see the CSS),
//   --fly-card-w, --fly-size (statement size), --fly-copy-top and --fly-copy-w (the statement box; see
//   the CSS for how wide it may go).
(() => {
  const ID = 'depth-card-flythrough';
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const num = (v, d, a, b) => (v === undefined || v === null || v === '' || Number.isNaN(+v) ? d : clamp(+v, a, b));
  const DY = [2, 0, 4, 1, 5, 0, 3];
  const DEG = 180 / Math.PI;
  const r3 = (v) => Math.round(v * 1000) / 1000;
  if (window.ScrollTrigger) ScrollTrigger.config({ ignoreMobileResize: true });

  window.Scenes = window.Scenes || {};
  window.Scenes[ID] = (root, opts = {}) => {
    if (!window.Stage) return null;
    const cards = [...root.querySelectorAll('.fly__card')];
    const lines = [...root.querySelectorAll('.fly__line')];
    const N = cards.length;
    const backdrop = root.querySelector('.fly__backdrop');
    const still = backdrop && backdrop.querySelector('.fly__backdrop-img');
    const video = backdrop && backdrop.querySelector('video');
    const field = root.querySelector('.fly__field');
    const copy = root.querySelector('.fly__copy');
    const countNow = root.querySelector('.fly__count-now');
    const countAll = root.querySelector('.fly__count-all');
    if (countAll) countAll.textContent = String(Math.max(N, lines.length));
    if (opts.count === false) root.classList.add('fly--no-count');
    // While the flight runs only one statement is visible; a visually hidden copy of the list keeps all
    // of them, in order, for screen readers (the CSS shows it only under .is-live).
    const list = root.querySelector('.fly__lines');
    if (list && !root.querySelector('.fly__sr')) {
      const sr = document.createElement('ol');
      sr.className = 'fly__sr';
      for (const l of lines) { const li = document.createElement('li'); li.textContent = l.textContent; sr.appendChild(li); }
      list.after(sr);
    }

    // Captions in flight: a constant-size tag per card on a flat layer above the field, riding the
    // card's inner top corner. Text inside a scaling card is either too small to read or louder than
    // the statement; a tag is always 15-20px, sits on its card and never passes the screen edge. The
    // figcaption stays in the card (transparent while the flight runs) for screen readers and the
    // finished composition.
    let tagLayer = root.querySelector('.fly__tags');
    if (!tagLayer && field) {
      tagLayer = document.createElement('div');
      tagLayer.className = 'fly__tags';
      tagLayer.setAttribute('aria-hidden', 'true');
      for (const card of cards) {
        const cap = card.querySelector('.fly__cap');
        const tag = document.createElement('span');
        tag.className = 'fly__tag';
        tag.textContent = cap ? cap.textContent.trim() : '';
        tagLayer.appendChild(tag);
      }
      field.after(tagLayer);
    }
    const tags = tagLayer ? [...tagLayer.children] : [];

    // the clock: slot S between card starts, flight F = c slots, so c cards are in the air at once.
    // A phone runs its own clock (fewer cards in the air), so it gets its own hold.
    const clockOf = (phone) => {
      const c = phone ? num(opts.phoneInAir, 2, 2, 3) : num(opts.inAir, 3, 2, 4);
      const S = 1 / (N + 0.88 * c - 0.55);
      return { c, S, F: c * S, hold: num(opts.hold, clamp(0.36 / S, 1.5, 6), 1.5, 6) };
    };
    const desk = clockOf(false), mob = clockOf(true);
    const runOpt = video || !still ? 0 : num(opts.run, 0.45, 0, 0.7);

    // The ground the camera runs over: a copy of the still backdrop, clipped to below the vanishing
    // point. A forward move maps the ground's picture by (x, y) / (1 - k·y) about the vanishing point
    // (one matrix3d), so the planks stream outward along their own lines while the horizon holds.
    let ground = null;
    if (runOpt > 0) {
      ground = backdrop.querySelector('.fly__ground');
      if (!ground) {
        ground = still.cloneNode(false);
        ground.className = 'fly__ground';
        ground.alt = '';
        ground.setAttribute('aria-hidden', 'true');
        ground.removeAttribute('fetchpriority');
        ground.removeAttribute('id');
        still.after(ground);
      }
    }

    // a video backdrop is scrubbed: one seek at a time, the latest wanted time queued behind it
    const vid = { want: -1, busy: false, at: 0 };
    const seek = (p) => {
      if (!video || !(video.duration > 0)) return;
      const t = clamp(p, 0, 1) * Math.max(0, video.duration - 0.05);
      if (vid.busy && performance.now() - vid.at < 500) { vid.want = t; return; }   // a lost 'seeked' frees it after 0.5 s
      if (Math.abs(video.currentTime - t) < 0.015) return;
      vid.busy = true; vid.want = -1; vid.at = performance.now();
      try { video.currentTime = t; } catch { vid.busy = false; }
    };
    let live = { p: 0 };                      // the running build's clock
    if (video) {
      video.muted = true; video.playsInline = true;
      video.addEventListener('seeked', () => {
        vid.busy = false;
        if (vid.want >= 0) { const t = vid.want; vid.want = -1; if (Math.abs(video.currentTime - t) >= 0.015) { vid.busy = true; vid.at = performance.now(); video.currentTime = t; } }
      });
      video.addEventListener('loadedmetadata', () => { if (root.classList.contains('is-live')) seek(live.p); });
    }

    // everything the script writes, cleared when the scene falls back to its finished composition
    const clean = () => {
      if (window.gsap) gsap.killTweensOf(lines);
      for (const card of cards) {
        card.style.removeProperty('transform'); card.style.removeProperty('opacity'); card.style.removeProperty('visibility');
        card.style.removeProperty('will-change'); card.style.removeProperty('z-index');
        for (const el of card.querySelectorAll('.fly__fog, .fly__cap')) el.style.removeProperty('opacity');
      }
      for (const l of lines) for (const p of ['opacity', 'visibility', 'transform', 'translate']) l.style.removeProperty(p);
      for (const t of tags) { t.style.removeProperty('transform'); t.style.removeProperty('opacity'); }
      if (copy) copy.style.removeProperty('transform');
      if (ground) ground.style.removeProperty('transform');
      if (list) list.removeAttribute('aria-hidden');
      if (field) field.style.removeProperty('perspective');
    };
    // Stage only calls rest() when one of its media conditions matches, so a desktop that switches to
    // reduced motion never gets it: watch for .is-live going away and clear the flight's inline styles.
    new MutationObserver(() => { if (!root.classList.contains('is-live')) clean(); })
      .observe(root, { attributes: true, attributeFilter: ['class'] });

    const build = (tl, ctx) => {
      const phone = ctx.phone;
      const stage = ctx.stage;
      const { c, S, F } = phone ? mob : desk;
      const P = num(opts.perspective, 300, 240, 600);
      const sEnd = Math.min(phone ? 2.5 : 5, num(opts.endScale, 4, 2.5, 5));
      const zStart = -2 * P;                    // scale 1/3: a faint chip at the vanishing point
      const zEnd = P * (1 - 1 / sEnd);          // 0.8P at most: a card's centre never reaches the camera
      const zSafe = 0.8 * P;                    // nor does any point of it, the turned outer edge included
      const sideX = phone ? num(opts.phoneSideX, 0.33, 0.22, 0.45) : num(opts.sideX, 0.32, 0.28, 0.38);
      const yaw = phone ? num(opts.phoneYaw, 3, 0, 12) : num(opts.yaw, 8, 0, 14);
      const sinYaw = Math.sin(yaw / DEG);
      // a turned ghost covers more of the frame on its way out: above 8 degrees it passes fainter
      const ghostDim = 0.35 * clamp((yaw - 8) / 6, 0, 1);
      const haze = num(opts.haze, 0, 0, 0.3);
      const D = num(opts.dolly, video ? 1.08 : 1.35, 1, 1.6);
      const dolly = phone ? 1 + (D - 1) * 0.6 : D;
      const run = runOpt * (phone ? 0.85 : 1);
      const arrive = opts.arrive !== false;
      const titleOpt = num(opts.title, 1.3, 1, 1.6);
      const settle = gsap.parseEase('power2.inOut');
      // within one flight t (0-1): fade in, fog lifts, the caption tag shows as the card reaches reading
      // size (S_READ, in card scale), fade out as the card passes the edge. The tag leaves again as the
      // card grows past reading size (CAP_OUT), so a ghost passes as picture only.
      const IN = 0.2, FOG = 0.45, CAP_LEN = phone ? 0.06 : 0.1, OUT = phone ? 0.84 : 0.78;
      const S_READ = phone ? 0.68 : 0.57;
      const CAP_OUT = phone ? [1.3, 1.55] : [1.15, 1.35];
      const tAt = (s) => (P * (1 - 1 / s) - zStart) / (zEnd - zStart);   // flight time at which a card reaches scale s
      // statement k comes in as card k's caption is fully on, so the reader meets each statement with its
      // picture labelled; it holds until card k+1's caption is
      const CAP = clamp(tAt(S_READ), 0.3, 0.7), tSwap = CAP + CAP_LEN;
      let title = 1, titleEnd = 0.12;

      clean();
      if (field) field.style.perspective = P + 'px';
      if (list) list.setAttribute('aria-hidden', 'true');   // the visually hidden copy speaks for it

      const geo = cards.map((card, i) => {
        const ds = parseFloat(card.dataset.side);
        const side = ds === 1 || ds === -1 ? ds : (i % 2 ? 1 : -1);
        card.dataset.side = String(side);
        const raw = parseFloat(getComputedStyle(card).getPropertyValue('--dy'));
        const dy = phone ? num(opts.phoneDy, 6, 0, 30) : clamp(Number.isFinite(raw) ? raw : DY[i % DY.length], 0, 8);
        card.style.zIndex = String(N - i);       // the earlier card is always the nearer one
        const tag = tags[i] && tags[i].textContent ? tags[i] : null;
        return { card, fog: card.querySelector('.fly__fog'), tag, side, dy, a: S * i - 0.12 * F, half: 0, halfH: 0, ox: 0, tagW: 0, tagH: 0, vis: null, o: -1, f: -1, k: -1 };
      });

      let W = 0, H = 0, VP = 0, gk = -1, ts = -1;
      const measure = () => {
        W = stage.clientWidth || window.innerWidth; H = stage.clientHeight || window.innerHeight;
        VP = field ? parseFloat(getComputedStyle(field).perspectiveOrigin.split(' ')[1]) : NaN;
        if (!Number.isFinite(VP)) VP = H * 0.56;
        for (const g of geo) {
          g.half = g.card.offsetWidth / 2; g.halfH = g.card.offsetHeight / 2;
          // on a phone a card's inner edge never crosses the centre line, so the passing card and the
          // next one, on the other side, never overlap
          g.ox = phone ? Math.max(sideX * W, g.half * 1.06) : sideX * W;
          if (g.tag) { g.tagW = g.tag.offsetWidth; g.tagH = g.tag.offsetHeight; }
        }
        // the title: statement one larger at the start, never wider than the stage less its gutters
        title = 1;
        if (titleOpt > 1 && lines[0]) {
          if (copy) copy.style.transform = '';    // measured at statement size; render() puts the scale back
          const rg = document.createRange(); rg.selectNodeContents(lines[0]);
          const tw = rg.getBoundingClientRect().width;
          title = tw > 0 ? clamp((W - 48) / tw, 1, titleOpt) : 1;
        }
        titleEnd = Math.max(0.04, geo[0] ? geo[0].a + CAP * F : 0.12);
        gk = -1; ts = -1;
      };
      // the camera's run over the ground: linear (constant speed) to 0.9, then it eases back a little
      // as the camera pulls back and lifts for the arrival
      const runAt = (p) => (!arrive ? run * p : p < 0.9 ? (run * p) / 0.9 : run * (1 - 0.2 * settle((p - 0.9) / 0.1)));

      const render = (p) => {
        for (const g of geo) {
          const t = (p - g.a) / F;
          if (t <= 0 || t >= 1) {
            if (g.vis !== false) { g.card.style.visibility = 'hidden'; g.card.style.opacity = '0'; g.card.style.willChange = 'auto'; g.vis = false; g.o = -1; }
            if (g.tag && g.k !== 0) { g.tag.style.opacity = '0'; g.k = 0; }
            continue;
          }
          if (g.vis !== true) { g.card.style.visibility = 'visible'; g.card.style.willChange = 'transform, opacity'; g.vis = true; }
          const z = zStart + (zEnd - zStart) * t; // linear z = constant camera speed; perspective does the rest
          const s = P / (P - z);
          const x = g.side * g.ox, y = (g.dy * H) / 100;
          // a turned card's outer edge is nearer than its centre: straighten it as it passes, so no
          // point of the card comes closer than 0.8P (behind the camera a card flips or vanishes)
          let yw = yaw;
          if (yaw && g.half && (zSafe - z) < g.half * sinYaw) yw = Math.asin(clamp((zSafe - z) / g.half, 0, 1)) * DEG;
          g.card.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(2)}px)` + (yw ? ` rotateY(${(-g.side * yw).toFixed(2)}deg)` : '');
          const u = t > OUT ? 1 - (t - OUT) / (1 - OUT) : 1;
          const dim = ghostDim ? 1 - ghostDim * clamp((s - 1.2) / 0.8, 0, 1) : 1;
          const o = r3(Math.min(1, t / IN) * u * dim);
          if (o !== g.o) { g.card.style.opacity = String(o); g.o = o; }
          const f = r3(haze + (0.7 - haze) * Math.max(0, 1 - t / FOG));
          if (g.fog && f !== g.f) { g.fog.style.opacity = String(f); g.f = f; }
          // the caption tag: on at reading size, off again as the card grows past it. It sits on the card's
          // inner top corner, projected as the card is (turn included), and runs outward along the top
          // edge; over its last 20px before the screen edge it fades rather than be read as a cut word.
          if (g.tag) {
            let k = clamp((t - CAP) / CAP_LEN, 0, 1) * clamp((CAP_OUT[1] - s) / (CAP_OUT[1] - CAP_OUT[0]), 0, 1);
            let tx = 0, ty = 0;
            if (k > 0) {
              const a = (-g.side * yw) / DEG, cx = -g.side * g.half;
              const X = x + cx * Math.cos(a), Z = z - cx * Math.sin(a), sp = P / (P - Z);
              const sx = W / 2 + X * sp, sy = VP + (y - g.halfH) * sp;
              tx = g.side < 0 ? sx - g.tagW : sx; ty = sy - g.tagH;
              // near the screen edge a long tag slides up to 16px in along the card's top edge, then fades
              const room = g.side < 0 ? tx - 8 : W - 8 - tx - g.tagW;
              if (room < 0) tx += g.side * Math.max(room, -16);
              k *= clamp((room + 36) / 20, 0, 1);
            }
            k = r3(k);
            if (k !== g.k) { g.tag.style.opacity = String(k); g.k = k; }
            if (k > 0) g.tag.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0)`;
          }
        }
        if (copy) {
          const v = title > 1 ? r3(1 + (title - 1) * (1 - clamp(p / titleEnd, 0, 1))) : 1;
          if (v !== ts) { copy.style.transform = v === 1 ? '' : `scale(${v})`; ts = v; }
        }
        if (ground) {
          const k = Math.round((runAt(p) / Math.max(1, H - VP)) * 1e8) / 1e8;
          if (k !== gk) { ground.style.transform = `matrix3d(1,0,0,0,0,1,0,${-k},0,0,1,0,0,0,0,1)`; gk = k; }
        }
        if (video) seek(p);
      };

      // statements: a state change, never a scrubbed crossfade. Statement k comes in as card k's caption
      // is fully on (tSwap into its flight), and holds until card k+1's is.
      let cur = -1, lastP = 0, countCall = null;
      const last = Math.max(0, lines.length - 1);
      const lineAt = (p) => clamp(Math.floor(p / S - (tSwap - 0.12) * c + 1e-6), 0, last);
      const setCount = (k) => { if (countNow) countNow.textContent = String(k + 1); };
      const force = (k) => {          // set the line with no animation (a load, a refresh, a jump)
        if (!lines.length) return;
        cur = k;
        lines.forEach((l, i) => { gsap.killTweensOf(l); gsap.set(l, { autoAlpha: i === k ? 1 : 0, yPercent: 0 }); });
        if (countCall) countCall.kill();
        setCount(k);
      };
      const show = (k, dir) => {
        const prev = cur; cur = k;
        lines.forEach((l, i) => { if (i !== k && i !== prev && +gsap.getProperty(l, 'opacity') > 0) gsap.to(l, { autoAlpha: 0, duration: 0.2, overwrite: true }); });
        gsap.to(lines[prev], { yPercent: -40 * dir, autoAlpha: 0, duration: 0.3, ease: 'power2.in', overwrite: true });
        gsap.fromTo(lines[k], { yPercent: 50 * dir, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.55, ease: 'power3.out', delay: 0.08, overwrite: true });
        if (countCall) countCall.kill();
        countCall = gsap.delayedCall(0.3, () => setCount(k));
      };
      const sync = (p) => {
        const k = lineAt(p);
        const jump = Math.abs(p - lastP) > 2 * S;
        const dir = p >= lastP ? 1 : -1;
        lastP = p;
        if (k === cur || !lines.length) return;
        if (jump || cur < 0) force(k); else show(k, dir);
      };

      // the camera: the backdrop dollies in toward the vanishing point, then pulls back and lifts
      if (backdrop) {
        if (arrive) {
          tl.fromTo(backdrop, { scale: 1, yPercent: 0 }, { scale: dolly, duration: 0.9, ease: 'none' }, 0);
          tl.fromTo(backdrop, { scale: dolly, yPercent: 0 }, { scale: 1 + (dolly - 1) * 0.57, yPercent: -2, duration: 0.1, ease: 'power2.inOut', immediateRender: false }, 0.9);
        } else {
          tl.fromTo(backdrop, { scale: 1, yPercent: 0 }, { scale: dolly, duration: 1, ease: 'none' }, 0);
        }
      }
      // one clock drives every card, the title and the ground from the scene's progress, so scrolling
      // back replays it exactly
      const clock = { p: 0 };
      live = clock;
      tl.fromTo(clock, { p: 0 }, { p: 1, duration: 1, ease: 'none', immediateRender: false, onUpdate: () => { render(clock.p); sync(clock.p); } }, 0);

      // Pictures decode before they move, and every card layer is drawn once, invisibly, at reading size
      // before its first flight, so no card meets the screen as a first-time decode and upload. It starts
      // when the section is within two screens, one card per frame.
      let warm = false;
      const prewarm = () => {
        let i = 0;
        const step = () => {
          if (!root.classList.contains('is-live') || live !== clock) return;
          if (i >= geo.length) return;
          const g = geo[i++];
          if (g.vis === true) { requestAnimationFrame(step); return; }   // already flying
          g.card.style.willChange = 'transform, opacity';
          g.card.style.transform = `translate(-50%, -50%) translate3d(${(g.side * g.ox).toFixed(1)}px, ${((g.dy * H) / 100).toFixed(1)}px, 0px)`;
          g.card.style.opacity = '0.01'; g.card.style.visibility = 'visible'; g.vis = 'warm';
          requestAnimationFrame(() => requestAnimationFrame(() => {
            if (g.vis === 'warm') { g.card.style.visibility = 'hidden'; g.card.style.opacity = '0'; g.card.style.willChange = 'auto'; g.vis = false; g.o = -1; }
            step();
          }));
        };
        step();
      };
      const warmUp = () => {
        if (warm) return; warm = true;
        const imgs = [...root.querySelectorAll('img')];
        for (const img of imgs) img.loading = 'eager';
        const cardImgs = imgs.filter((img) => img.closest('.fly__card'));
        Promise.all(cardImgs.map((img) => (img.decode ? img.decode().catch(() => {}) : null))).then(() => requestAnimationFrame(prewarm));
        if (still && still.decode) still.decode().catch(() => {});
        if (video) {
          video.preload = 'auto';
          // iOS paints no frame of a video until it has played once
          const go = video.play && video.play();
          if (go && go.then) go.then(() => { video.pause(); seek(clock.p); }).catch(() => {});
        }
      };
      ScrollTrigger.create({
        trigger: root, start: 'top bottom+=200%', end: 'bottom top',
        onToggle: (self) => { if (self.isActive) warmUp(); },
        // a resize or a rebuild: measure again and put cards, title, ground and statement where the clock is
        onRefresh: () => { measure(); render(clock.p); lastP = clock.p; if (root.classList.contains('is-live')) force(lineAt(clock.p)); },
      });

      measure();
      render(0);
      // statement state is set outside the matchMedia context: a ScrollTrigger refresh reverts what the
      // context recorded, which would undo an in-context gsap.set on the lines
      Promise.resolve().then(() => {
        if (!root.classList.contains('is-live')) return;
        lastP = clock.p;
        force(lineAt(clock.p));
      });
    };

    const tooMany = N > num(opts.phoneMax, 9, 3, 12);
    return Stage.scene(root, {
      hold: desk.hold,
      scrub: Stage.lenis ? true : 0.5,
      build: N ? build : null,
      phone: opts.phone === 'rest' || tooMany ? 'rest' : { hold: mob.hold, build: N ? build : null },
      rest: clean,
    });
  };
})();
