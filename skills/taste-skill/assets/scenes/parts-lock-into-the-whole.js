// tasteskill / scenes / parts-lock-into-the-whole.js — the subject is put together in front of the visitor.
// The stage opens on one huge word alone (a year, a figure, a name). It steps back into its place in the
// product's own interface while that interface's panels fly in from the four edges (toolbar from the top,
// sidebar from the left, inspector from the right, the main pane from the bottom), land with a seam and
// lock shut into one whole screen. Then three or four layers of detail ink in one at a time (the data, the
// team's comments, an agent's edits) while one caption in the corner changes its line for each layer, and
// the finished screen shrinks into a column beside a short spec list.
// Needs stage.css + stage.js, GSAP 3.15.0 and ScrollTrigger (see stage.js for the script tags).
//
// It is for how-it-works or features on software (saas, dev tools, ai products): the pieces are the
// product's real interface, built in HTML as interface fragments (data-ui) and cut along its own panels.
// Never an illustration drawn for the page, never a screenshot cut into tiles. A picture that cannot be cut
// into meaningful parts (one panel, one chart) is the wrong subject: redraw.
//
// DOM (the script adds nothing but the caption's live line):
//   <section class="scene" data-scene="parts-lock-into-the-whole" data-options='{"hold":2}' aria-labelledby="pl-h">
//     <div class="scene-stage">
//       <p class="pl-word-wrap" aria-hidden="true"><span class="pl-word">2027</span></p>   the opening word
//       <div class="pl-ui">                                  the product's screen, one grid of 3-5 panels
//         <div class="pl-panel pl-bar" data-ui>…</div>        toolbar     (grid-area bar)
//         <div class="pl-panel pl-side" data-ui>…</div>       sidebar     (grid-area side)
//         <div class="pl-panel pl-main" data-ui>             main pane   (grid-area main)
//           <p class="pl-title"><span class="pl-title-lead">Headcount</span> <span class="pl-title-word">2027</span></p>
//           …                                                 the opening word lands on .pl-title-word
//         </div>
//         <div class="pl-panel pl-insp" data-ui>…</div>       inspector   (grid-area insp)
//       </div>
//       <p class="pl-caption" aria-hidden="true">            one corner caption, one line per layer
//         <span class="pl-cap">What layer 1 adds, 5-9 words</span> <span class="pl-cap">…layer 2</span> …
//       </p>
//       <div class="pl-spec">                                the end: heading and a short spec list
//         <h2 class="pl-heading" id="pl-h">Two lines at most</h2>
//         <dl class="pl-list"><div><dt>Name</dt><dd>One short line</dd></div> … 3-4 rows</dl>
//       </div>
//       <div class="pl-endslot" aria-hidden="true"></div>    where the screen rests at the end (CSS places it)
//     </div>
//   </section>
// Detail layers: mark every element of a layer with data-layer="1" … "4" (at most four layers), anywhere
// inside the panels. How it inks in: data-ink="fade" (default: fades and settles 6px), "x" (grows from its
// left edge: data bars, <span class="pl-fill" style="--v:.43">), "y" (rises from its foot: the ink of a
// chart bar, <i style="--h:.6"><b data-layer="1" data-ink="y"></b></i>, inking over the grey plan bar),
// "mark" (a cell's background tints in: the row under discussion, .pl-talk), "strike" (an old value is
// struck through and greyed: <s class="pl-old">; put the new value beside it as <span class="pl-new">,
// which a cell keeps room for). Every layer lands on ground that holds no words before it (an empty row,
// the foot of a pane, the room beside a value, under the words): a layer never covers the interface's own
// text, it adds to it. Before the first layer the screen is already whole (the chart in grey, one earlier
// comment in the thread): no pane waits empty. Elements hidden at a width (display: none) are skipped. The
// caption needs one .pl-cap per layer, in the order of the layers. It is aria-hidden: the spec list says
// the same thing to everyone.
// The opening word: the same word as .pl-title-word, in the same face. Give the main pane's title row
// nothing else (no buttons or figures beside the title): the panes slide in under the landed word.
// Interface type: 14px for the main text, 12-13px for labels, never under 12px; numbers with tabular
// figures. Size every pane so its content fits at 1280x720 and in the tablet grid (see the CSS): a pane that
// clips its own words on a tablet or a phone reads as broken.
// Which edge a panel flies in from: its custom property --pl-from: top | right | bottom | left (the CSS
// sets it per layout: the tablet grid sends the inspector in from the bottom, the phone the sidebar from
// the right). Panels fly in DOM order.
//
// OPTIONS (data-options JSON) default, range
//   hold 1.6 (1.5-2)        screens the stage is held on desktop and tablet (the beats fill 1.6; more only
//                           stretches them)
//   phoneHold 1.6 (1.5-2)   the same on phones
//   scrub 0.6 (0-0.8)       seconds of catch-up; true locks it to the scrollbar
//   gap 14 (0-28)           the seam, in px, the panels land with before they lock shut; phoneGap 8
//   phoneTravel 44 (16-96)  on phones the panels start this far outside their place (not at the screen edge,
//                           which would send them across the whole screen), fading in as they come
//   stagger 0.04 (0-0.04)   between one panel's flight and the next (0.04: the main pane flies late enough
//                           that the shrinking word never lies on its subtitle, at 768 as at 1440)
//   word true               false: no opening word (the title is there from the start, the panels lock
//                           around an empty stage); keep it, the word is what the visitor watches land
//   phone "rest"            "rest" (phones get the finished composition: the heading and the spec list over
//                           the full-width screen, every layer on it) | "same" (the build on the phone too;
//                           its end shrinks the screen into the top half, small, over the spec list)
// CSS custom properties on the section: --pl-bg (stage ground), --pl-ink (stage type), --pl-surface,
// --pl-side-bg, --pl-line, --pl-ui-ink, --pl-ui-muted, --pl-accent, --pl-tint, --pl-gx (side margin),
// --pl-word-size (see parts-lock-into-the-whole.css).
//
// Before the pin: the word waits hidden while the stage scrolls in (a giant word sliced by the screen's
// bottom edge reads as broken) and rises onto the stage, timed, the moment it fits whole on the screen, so
// it is whole when the pin starts. Give the section before it something large low on its screen (a headline, a
// picture): that is what the eye holds while the stage's ground scrolls in empty.
// Timeline (fractions of the hold): the word alone to 0.02; it steps back onto its title 0.02-0.17 (scale
// and place solved from the title's own box, so the swap is exact); panel k flies 0.04 + k*stagger for 0.18
// from beyond its edge of the screen, but shows only from the moment it lies wholly on the screen, fading
// in over the rest of its flight, so no frame has a panel sliced by the screen's edge (phones 0.06 +
// k*stagger for 0.17 from phoneTravel outside its place, fading in over the first half), so the word is
// small before any pane's words come near it; they lock shut over 0.035 after the last lands, and the word swaps for the real
// title as they close; layers ink in from just after the lock (0.387 with four panels) to 0.69, one equal
// share each, each layer's inking moved to the nearest start that keeps it inside one tenth of the hold,
// clear of the 10% marks (three layers: 0.412, 0.512, 0.612), so a frame on any tenth shows a layer not
// begun or whole (the first 55% of a share inking, every part of the layer setting off within 0.03, the
// rest at rest, so the layer reads whole before the next begins); the caption shows with the first layer,
// changes its line at the start of each layer (timed, about 0.35s: the old line fades out and the new one
// in, so no frame shows a half-typed word; always to the line of the layer the scroll is in, so a fast
// flick never leaves it behind) and leaves at 0.70; the screen shrinks onto .pl-endslot 0.72-0.85, and
// the heading and spec rows rise 0.83-0.90 as it clears their ground; the last frame, whole and in full
// ink, holds from 0.90 to 1 (a short rest before the release, not a dead stretch).
(() => {
  if (!window.Stage) return;
  const ID = 'parts-lock-into-the-whole';
  const num = (v, d, lo, hi) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };

  const WORD = [0.02, 0.17];
  const LAYERS = [0.33, 0.69]; // the layers ink in here, never before the panels have locked shut
  const CAP_OUT = 0.7;
  const SHRINK = [0.72, 0.85];
  const SPEC = 0.83;           // the heading and the spec rows rise 0.83-0.90
  const EDGE = 0.012;          // the least room between a layer's inking and a tenth of the hold

  // An element's layout box in the stage, transforms ignored: where it rests when everything has landed.
  const boxIn = (el, root) => {
    let x = 0;
    let y = 0;
    for (let e = el; e && e !== root; e = e.offsetParent) { x += e.offsetLeft; y += e.offsetTop; }
    return { x, y, w: el.offsetWidth, h: el.offsetHeight };
  };
  const SIDES = ['top', 'right', 'bottom', 'left'];
  const sideOf = (p) => {
    const s = getComputedStyle(p).getPropertyValue('--pl-from').trim();
    return SIDES.includes(s) ? s : 'bottom';
  };

  function build(tl, ctx, o) {
    const { root, stage, phone, q } = ctx;
    const ui = root.querySelector('.pl-ui');
    if (!ui) return;
    const panels = q('.pl-panel');
    const word = o.word ? root.querySelector('.pl-word') : null;
    const target = root.querySelector('.pl-title-word');
    const lead = q('.pl-title-lead');
    const caption = root.querySelector('.pl-caption');
    const slot = root.querySelector('.pl-endslot');
    const spec = q('.pl-heading, .pl-list > div');
    const fly0 = phone ? 0.06 : 0.04;
    const fly = phone ? 0.17 : 0.18;
    const lock0 = fly0 + fly + Math.max(0, panels.length - 1) * o.stagger;
    const lock1 = lock0 + 0.035;
    const gap = phone ? o.phoneGap : o.gap;

    // Every place is measured from the layout (offsets, no transforms) once per refresh.
    let G = null;
    const measure = () => {
      const S = { w: stage.clientWidth, h: stage.clientHeight };
      const U = boxIn(ui, stage);
      const P = panels.map((p) => {
        const r = boxIn(p, stage);
        const from = sideOf(p);
        const out = 24;
        let x0 = 0;
        let y0 = 0;
        if (phone) {
          const T = o.phoneTravel;
          if (from === 'top') y0 = -T; else if (from === 'bottom') y0 = T; else if (from === 'left') x0 = -T; else x0 = T;
        } else if (from === 'top') y0 = -(r.y + r.h) - out;
        else if (from === 'bottom') y0 = S.h - r.y + out;
        else if (from === 'left') x0 = -(r.x + r.w) - out;
        else x0 = S.w - r.x + out;
        // the seam: each panel lands a little outside its place, in percent of its own size
        const gx = from === 'left' ? -gap : from === 'right' ? gap : 0;
        const gy = from === 'top' ? -gap : from === 'bottom' ? gap : 0;
        // the share of its flight after which the panel lies wholly on the screen (power3.out solved
        // backwards from the room between its place, seam included, and the screen's edge): it shows
        // only from then on, so no frame has a panel cut by the edge of the screen
        const room = from === 'top' ? r.y : from === 'bottom' ? S.h - r.y - r.h : from === 'left' ? r.x : S.w - r.x - r.w;
        const travel = Math.abs(x0 || y0);
        const inside = travel ? Math.min(1, Math.max(0, 1 - (room - gap) / travel)) : 0;
        const tin = phone ? 0 : 1 - Math.cbrt(1 - inside);
        return { x0, y0, gx: r.w ? (gx / r.w) * 100 : 0, gy: r.h ? (gy / r.h) * 100 : 0, tin };
      });
      const out = { S, U, P, wx: 0, wy: 0, wk: 1, ex: 0, ey: 0, es: 1 };
      if (word && target) {
        const w = boxIn(word, stage);
        const t = boxIn(target, stage);
        const fw = parseFloat(getComputedStyle(word).fontSize) || w.h || 1;
        const ft = parseFloat(getComputedStyle(target).fontSize) || t.h;
        out.wk = ft / fw;
        out.wx = t.x - w.x;
        out.wy = t.y - w.y;
      }
      if (slot && U.w && U.h) {
        const s = boxIn(slot, stage);
        const k = Math.min(1, s.w / U.w, s.h / U.h);
        out.es = k;
        out.ex = s.x + (s.w - U.w * k) / 2 - U.x;
        out.ey = s.y + (s.h - U.h * k) / 2 - U.y;
      }
      return out;
    };
    const geo = () => G || (G = measure());
    const forget = () => { G = null; };
    ScrollTrigger.addEventListener('refreshInit', forget);

    // 0. Before the pin the word waits hidden while the stage scrolls in, then rises onto the stage (timed)
    // the moment it fits whole (its foot clears 95% of the screen, at any word size): it never shows
    // sliced by the screen's edge, and it is whole
    // when the pin starts. Its wrap moves, so the timeline keeps the word itself.
    const wrap = word && word.closest('.pl-word-wrap');
    if (wrap) {
      gsap.fromTo(wrap, { autoAlpha: 0, y: 32 }, {
        autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out',
        scrollTrigger: { trigger: wrap, start: 'bottom 95%', toggleActions: 'play none none reverse' },
      });
    }

    // 1. The word steps back onto its title. Its colour is the stage ink and the interface ink alike, so
    // it reads on the bare stage and on the pane that slides in under it.
    if (word && target) {
      tl.fromTo(word, { x: 0, y: 0, scale: 1, transformOrigin: '0% 0%', force3D: true }, {
        x: () => geo().wx, y: () => geo().wy, scale: () => geo().wk, duration: WORD[1] - WORD[0], ease: 'power2.inOut',
      }, WORD[0]);
      // one instant, no fade: the word and the title it lies on are never both showing (two copies of the
      // same word printed on each other read as a smear, and scenes.mjs counts them as crossing)
      gsap.set(target, { autoAlpha: 0 });
      tl.set(word, { autoAlpha: 0 }, lock1);
      tl.set(target, { autoAlpha: 1 }, lock1);
    }
    if (lead.length) tl.fromTo(lead, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.03, ease: 'power1.out' }, word ? lock1 : lock0);

    // 2. The panels fly in from their edges, land with a seam, and lock shut. The lock is made first: its
    // start state (the seam) stands under the flight's start state.
    panels.forEach((p, i) => {
      const s0 = fly0 + i * o.stagger;
      tl.fromTo(p, { xPercent: () => geo().P[i].gx, yPercent: () => geo().P[i].gy }, {
        xPercent: 0, yPercent: 0, duration: lock1 - lock0, ease: 'power4.inOut',
      }, lock0);
      tl.fromTo(p, { x: () => geo().P[i].x0, y: () => geo().P[i].y0, force3D: true }, {
        x: 0, y: 0, duration: fly, ease: 'power3.out',
      }, s0);
      if (phone) tl.fromTo(p, { autoAlpha: 0 }, { autoAlpha: 1, duration: fly * 0.5, ease: 'power1.out' }, s0);
      else {
        // hidden while any of it is off the screen, then fading in over the rest of its flight
        const seen = (t) => {
          if (t >= 1) return 1;
          const a = geo().P[i].tin;
          return Math.min(1, Math.max(0, (t - a) / Math.max(0.05, Math.min(0.22, 1 - a))));
        };
        tl.fromTo(p, { autoAlpha: 0 }, { autoAlpha: 1, duration: fly, ease: seen }, s0);
      }
    });

    // 3. The layers ink in, one equal share of 0.39-0.72 each: every part of a layer sets off within 0.03 of
    // its start and the layer is whole by 55% of its share, then rests before the next. The caption turns to
    // a layer's line once the layer has begun to show (starts[]), never before.
    const marked = q('[data-layer]').filter((e) => e.getClientRects().length);
    const N = Math.min(4, Math.max(0, ...marked.map((e) => Math.round(+e.dataset.layer) || 0)));
    // the first layer waits for the lock (a later stagger moves the lock later)
    const L0 = Math.max(LAYERS[0], lock1 + EDGE);
    const share = N ? (LAYERS[1] - L0) / N : 0;
    const ink = share * 0.55;
    // Each layer's inking (its spread and its tween) is moved to the nearest start that keeps it inside one
    // tenth of the hold, clear of the 10% marks, so a frame taken on any tenth shows each layer either not
    // begun or whole, never half inked.
    const span = Math.min(0.045, ink * 0.7) + Math.min(0.03, ink - Math.min(0.045, ink * 0.7));
    const t0s = [];
    for (let L = 1, prev = -1; L <= N; L++) {
      const s = L0 + (L - 1) * share;
      const least = Math.max(L0, prev < 0 ? 0 : prev + span + 0.02);
      const tenth = (t) => Math.floor(t * 10 + 1e-9) / 10;
      const ok = (t) => t >= least - 1e-9 && t - tenth(t) >= EDGE - 1e-9 && t + span <= tenth(t) + 0.1 - EDGE + 1e-9;
      let best = Math.max(s, least);
      if (span <= 0.1 - 2 * EDGE && !ok(best)) {
        const m = tenth(s);
        const c = [m - 0.1, m, m + 0.1, m + 0.2].flatMap((t) => [t + EDGE, t + 0.1 - EDGE - span]).filter(ok);
        if (c.length) best = c.reduce((a, b) => (Math.abs(b - s) < Math.abs(a - s) - 1e-9 ? b : a));
      }
      t0s.push(best);
      prev = best;
    }
    const starts = [];
    for (let L = 1; L <= N; L++) {
      const els = marked.filter((e) => Math.round(+e.dataset.layer) === L);
      const t0 = t0s[L - 1];
      starts.push(t0 + Math.min(0.02, ink * 0.35));
      const d = Math.min(0.045, ink * 0.7);
      const spread = Math.min(0.03, ink - d);
      els.forEach((el, j) => {
        const st = t0 + (els.length > 1 ? (spread * j) / (els.length - 1) : 0);
        const how = el.dataset.ink || 'fade';
        if (how === 'x') tl.fromTo(el, { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: d, ease: 'power2.out' }, st);
        else if (how === 'y') tl.fromTo(el, { scaleY: 0, transformOrigin: '50% 100%' }, { scaleY: 1, duration: d, ease: 'power2.out' }, st);
        else if (how === 'mark') tl.fromTo(el, { backgroundColor: 'rgba(255, 255, 255, 0)' }, { backgroundColor: getComputedStyle(el).backgroundColor, duration: d, ease: 'power1.out' }, st);
        else if (how === 'strike') {
          const cs = getComputedStyle(el);
          const ink0 = getComputedStyle(el.parentElement).color;
          tl.fromTo(el, { color: ink0, textDecorationColor: 'rgba(0, 0, 0, 0)' }, { color: cs.color, textDecorationColor: cs.textDecorationColor, duration: d, ease: 'power1.out' }, st);
        } else tl.fromTo(el, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: d, ease: 'power2.out' }, st);
      });
    }

    // 4. The caption: one line, swapped whole at the start of each layer (the old line fades out, the new one
    // fades in, about 0.35s in all). Timed, not scrubbed, but always aimed at the line of the layer the
    // scroll is in.
    let rewrite = null;
    if (caption) {
      const lines = [...caption.querySelectorAll('.pl-cap')].map((e) => e.textContent.replace(/\s+/g, ' ').trim());
      let now = caption.querySelector('.pl-cap-now');
      if (!now) { now = document.createElement('span'); now.className = 'pl-cap-now'; caption.appendChild(now); }
      let shown = -1;
      let text = lines[0] || '';
      now.textContent = text;
      const which = (t) => { let k = 0; for (let i = 0; i < starts.length; i++) if (t >= starts[i]) k = i; return Math.min(k, lines.length - 1); };
      const to = (k) => {
        const next = lines[k] || '';
        if (rewrite) rewrite.kill();
        if (+gsap.getProperty(caption, 'opacity') < 0.05 || !text || next === text) { text = next; now.textContent = next; gsap.set(now, { autoAlpha: 1 }); return; }
        // the old line fades out, the new one fades in: never a half-typed word, never two lines at once
        text = next;
        rewrite = gsap.timeline()
          .to(now, { autoAlpha: 0, duration: 0.14, ease: 'power1.in' })
          .call(() => { now.textContent = next; })
          .to(now, { autoAlpha: 1, duration: 0.2, ease: 'power1.out' });
      };
      tl.fromTo(caption, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.02, ease: 'power1.out' }, starts.length ? starts[0] - 0.01 : LAYERS[0]);
      tl.fromTo(caption, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.015, ease: 'power1.in', immediateRender: false }, CAP_OUT);
      tl.eventCallback('onUpdate', () => {
        const k = which(tl.time());
        if (k !== shown) { shown = k; to(k); }
      });
    }

    // 5. The finished screen shrinks into its column; the heading and the spec rows rise beside it once the
    // screen has left their ground.
    tl.fromTo(ui, { x: 0, y: 0, scale: 1, transformOrigin: '0% 0%' }, {
      x: () => geo().ex, y: () => geo().ey, scale: () => geo().es, duration: SHRINK[1] - SHRINK[0], ease: 'power2.inOut',
    }, SHRINK[0]);
    // one tween each (a staggered fromTo renders only its first target's start state when it is made)
    spec.forEach((el, i) => tl.fromTo(el, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.035, ease: 'power2.out' }, SPEC + i * 0.008));

    // Whatever was written outside GSAP goes back when the stage reverts this build.
    if (gsap.context) {
      gsap.context(() => () => {
        ScrollTrigger.removeEventListener('refreshInit', forget);
        if (rewrite) rewrite.kill();
        const now = caption && caption.querySelector('.pl-cap-now');
        if (now) gsap.set(now, { clearProps: 'opacity,visibility' });
        if (now) now.remove();
      });
    }
  }

  window.Scenes = window.Scenes || {};
  window.Scenes[ID] = (root, opts = {}) => {
    const o = {
      hold: num(opts.hold, 1.6, 1.5, 2),
      phoneHold: num(opts.phoneHold, 1.6, 1.5, 2),
      scrub: opts.scrub === true ? true : num(opts.scrub, 0.6, 0, 0.8),
      gap: num(opts.gap, 14, 0, 28),
      phoneGap: num(opts.phoneGap, 8, 0, 20),
      phoneTravel: num(opts.phoneTravel, 44, 16, 96),
      stagger: num(opts.stagger, 0.04, 0, 0.04),
      word: opts.word !== false,
    };
    const run = (tl, ctx) => build(tl, ctx, o);
    return Stage.scene(root, {
      hold: o.hold,
      scrub: o.scrub,
      build: run,
      // phones get the finished composition unless the page asks for the build ("same")
      phone: opts.phone === 'same' ? { hold: o.phoneHold, build: run } : 'rest',
    });
  };
})();
