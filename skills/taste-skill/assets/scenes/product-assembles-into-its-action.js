// tasteskill / scenes / product-assembles-into-its-action.js — the product's own working screen builds
// itself in the order of its own story while the page is held, then every piece folds into its one action.
// The stage opens on the screen empty (an invoice with nothing on it yet, the board before its first card),
// slid up from the bottom edge as the stage arrives. Each step of the hold slides the next part of the
// screen in from an edge of the stage (a line item, a second one, the totals, the send button, the paid
// mark), one large plain caption saying what that step adds. The newest row lands marked by the accent (its
// type in the accent, no tinted ground) and settles back to a plain row within its step. Then the
// parts fold back into the action, nearest first, row by row; the screen's card follows them in and closes
// round the action (12px around it), then goes, and the action stands alone on the page ground, larger, as
// the last frame's one subject. It stays a real button: live, clickable and in the tab order. A plain
// "Skip" link jumps to the end and puts the focus on the action.
// Needs stage.css + stage.js, GSAP 3.15.0 and ScrollTrigger (see stage.js for the script tags).
//
// It is the scroll-driven partner of the timed product replay (assets/replay.js, references/motion.md,
// "Product replay"): the same kind of fragment, the product's own screen built in HTML (data-ui) in its
// finished state, each part marked by the step it arrives at (data-at, as the replay marks its beats). The
// HTML is the finished screen: reduced motion, no script, a failed CDN and a phone set to "rest" show it as
// written, with the captions as a short list beside it. For software pages (saas, dev tools, fintech) that
// can show their real working screen; a page that already carries the replay keeps one of the two.
// The count of steps is told by the screen itself (the lines on the invoice): never a percent, a counter
// or a progress bar.
//
// DOM (the script adds nothing):
//   <section class="scene" id="how" data-scene="product-assembles-into-its-action" data-options='{"hold":2.4}' aria-labelledby="pa-h">
//     <div class="scene-stage">
//       <div class="pa-copy">
//         <h2 class="pa-heading" id="pa-h">Two lines at most</h2>
//         <ol class="pa-steps">                         one caption a step, 4-6 steps, 4-10 words each,
//           <li class="pa-step">What step 1 shows</li>   in the text face; the first one is the empty screen
//           <li class="pa-step">What step 2 adds</li> …
//         </ol>
//         <p class="pa-close">One line for the fold, 4-8 words</p>      optional, shown from the fold on
//         <a class="pa-skip" href="#how">Skip</a>                        live only; jumps to the end
//       </div>
//       <div class="pa-screen" data-ui>                 the product's screen in its finished state. Its rows
//         <div>…the screen's own header…</div>          are its direct children, top to bottom; the empty
//         <div data-at="2">…a row step 2 adds…</div>    screen is every row with no data-at (step 1)
//         <div data-at="3">…</div>
//         <div>                                          the action's row
//           <button type="button" data-at="5" data-action>Send invoice</button>
//           <span data-at="6">Paid 14 Nov</span>       a part beside the action folds into it sideways
//         </div>
//         <p>…a row under the action…</p>              folds up into it
//       </div>
//     </div>
//   </section>
// Marks inside .pa-screen:
//   data-at="k"         the part arrives at step k (2 … number of captions) and slides in whole; several
//                       parts with one k arrive together. A row or any element inside a row. A row (a direct
//                       child of the screen) lands marked: its type in the accent, on no ground of its own
//                       (--pa-mark, see the CSS), settling back to a plain row by 85% of its step. Set rows as
//                       plain type on the screen's ground, not filled bars; data-mark="off" skips the mark.
//   data-edge           the edge of the stage it slides in from: top | right | bottom | left (default: the
//                       edge option). Send a part only across ground that holds no words before it arrives:
//                       its own empty slot and the stage beyond the screen (a line from the right along its
//                       row; the action from the right when the slot beside it is still empty; from the
//                       bottom only when nothing lies under it).
//   data-was="Draft"    with data-at: the element is not moved; it reads "Draft" until step k, then its own
//                       text (a status that turns to Paid). As in the replay, the HTML holds the final text.
//   data-action         the one action: a real <button> or <a>, the screen's primary control. It folds
//                       nothing of its own and is never hidden after its step.
// Give the screen its parts at real size (17-19px main text on desktop, 15-16px labels, 16px on phones), so
// each step is a whole, readable screen. Elements hidden at a width are skipped.
//
// OPTIONS (data-options JSON) default, range
//   hold 2.4 (2-2.5)        screens the stage is held on desktop and tablet
//   phoneHold 2.2 (2-2.5)   the same on phones
//   scrub 0.6 (0.1-0.8)     seconds of catch-up; true locks it to the scrollbar
//   edge "right"            the edge a part slides in from when it has no data-edge (top|right|bottom|left)
//   phoneEdge (= edge)      the same on phones
//   mark true               false: rows land plain, with no accent mark
//   fold true               false: no fold; the finished screen holds to the end with the action live
//   recap true              wide screens end on the captions as the short list, the closing line under them,
//                           beside the action (the finished composition's copy); false: the closing line alone
//   grow 1.4 (1-1.6)        how much the action grows at the end; phoneGrow 1.3 (1-1.5)
//   phone "same"            "same" | "rest" (phones get the finished composition)
// The number of steps is read from the markup: one per caption (.pa-step, 4-6; at most 6 are used), and
// parts marked past the last caption arrive with it.
// CSS custom properties on the section: --pa-bg (stage ground), --pa-ink, --pa-accent, --pa-paper (the
// screen's card), --pa-radius, --pa-pad, --pa-gx (side margin), --pa-screen-w, --pa-gap, --pa-cap-size
// (see the CSS).
//
// Timeline (fractions of the hold): the empty screen slides up from the stage's bottom edge while the stage
// scrolls in (its own scrubbed trigger, done as the hold starts) and holds, whole, with caption 1 to 0.04.
// Steps 2 … N share 0.04-0.8 equally (the last step, the screen finished, holds on to 0.875), so the hold
// never stands still for long (scenes.mjs dead-hold): each step's parts slide in over the first half of its
// share (power3.out, parts of one step 0.012 apart); a row keeps its accent mark to 55% of the share and
// settles to plain by 85%. Caption k leaves just before step k+1
// begins and the next one rises after it, so two captions never share pixels. The fold, 0.875-0.945: the
// parts beside the action fold into
// it sideways, then the rows above it fold down into it one at a time, the nearest first (each clipped from
// its top while every row above slides down by the same amount, so no row passes over another; each over
// 72% of its slot), rows under it fold up the same way, and the card's top and foot follow the rows in, so
// it never stands empty. 0.945-0.97: the card's sides close in to 12px round the action; 0.97-0.99: the
// card goes (its edge comes in to the action's own edge); 0.95-1: the action travels to the middle of the
// screen's place and grows. From 0.875 the section carries .is-end: on wide screens the captions fade back in
// place as the short list, 0.006 apart, the closing line under them; narrow screens and phones show the
// closing line alone. The Skip link leaves at 0.97.
// scenes.mjs may warn dead-hold over the first steps: a step adds a row of text, fewer pixels than its 1.5%
// threshold, though every tenth of the hold shows something new. Read the sheet: if a row, a total or the
// action lands at each step, the warning is defended; never pad the steps or slow them to quiet it.
(() => {
  if (!window.Stage) return;
  const ID = 'product-assembles-into-its-action';
  const num = (v, d, lo, hi) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
  const EDGES = ['top', 'right', 'bottom', 'left'];
  const edgeOr = (v, d) => (EDGES.includes(v) ? v : d);

  const STEPS = [0.04, 0.8];
  const ENTER = 0.5;           // share of a step's slot its parts take to slide in
  const MARK = [0.55, 0.85];   // share of a step's slot: the newest row keeps its mark, then settles
  const ROWS = [0.875, 0.945]; // the rows fold into the action
  const CLOSE = [0.945, 0.97]; // the card's sides close in round the action
  const GONE = [0.97, 0.99];   // the card goes
  const GO = [0.95, 1];        // the action travels to the middle and grows
  const HUG = 12;              // px of card left round the action before it goes
  const OUT = 24;              // px past the stage edge a part starts from

  // An element's layout box inside an ancestor, transforms ignored: where it rests when it has landed.
  const boxIn = (el, root) => {
    let x = 0;
    let y = 0;
    for (let e = el; e && e !== root; e = e.offsetParent) { x += e.offsetLeft; y += e.offsetTop; }
    return { x, y, w: el.offsetWidth, h: el.offsetHeight };
  };
  const shown = (el) => el.getClientRects().length > 0;

  function build(tl, ctx, o) {
    const { root, stage, phone, q } = ctx;
    const screen = root.querySelector('.pa-screen');
    if (!screen) return;
    const caps = q('.pa-step');
    const close = root.querySelector('.pa-close');
    const skip = root.querySelector('.pa-skip');
    const action = screen.querySelector('[data-action]');
    const swaps = [...screen.querySelectorAll('[data-at][data-was]')];
    const marked = [...screen.querySelectorAll('[data-at]:not([data-was])')].filter(shown);
    const maxAt = Math.max(1, ...marked.map((p) => Math.round(+p.dataset.at) || 1));
    const N = Math.min(6, caps.length ? caps.length : maxAt);
    const atOf = (el) => Math.min(N, Math.max(1, Math.round(+el.dataset.at) || 1));
    const pieces = marked.filter((p) => atOf(p) > 1);
    const share = N > 1 ? (STEPS[1] - STEPS[0]) / (N - 1) : 0;
    const startOf = (k) => STEPS[0] + (k - 2) * share;     // step k >= 2
    const edgeOf = (el) => edgeOr(el.dataset.edge, phone ? o.phoneEdge : o.edge);
    const grow = phone ? o.phoneGrow : o.grow;

    // the rows of the screen and the fold's order: the parts beside the action, then the rows above it from
    // the nearest up, then the rows under it from the nearest down
    const rows = [...screen.children].filter(shown);
    const arow = action ? rows.find((r) => r.contains(action)) : null;
    const ai = arow ? rows.indexOf(arow) : -1;
    const above = ai > 0 ? rows.slice(0, ai) : [];
    const below = ai >= 0 ? rows.slice(ai + 1) : [];
    const sides = arow ? [...arow.children].filter((c) => !c.contains(action) && shown(c)) : [];
    const events = [];
    if (sides.length) events.push({ type: 'side' });
    for (let i = above.length - 1; i >= 0; i--) events.push({ type: 'up', i });
    for (let j = 0; j < below.length; j++) events.push({ type: 'down', j });
    const folding = o.fold && !!action && !!arow;

    // Every place is measured from the layout (offsets, no transforms) once per refresh.
    let G = null;
    const measure = () => {
      const S = { w: stage.clientWidth, h: stage.clientHeight };
      const R = boxIn(screen, stage);
      const P = pieces.map((p) => {
        const b = boxIn(p, stage);
        const e = edgeOf(p);
        let x0 = 0;
        let y0 = 0;
        if (e === 'right') x0 = S.w - b.x + OUT;
        else if (e === 'left') x0 = -(b.x + b.w) - OUT;
        else if (e === 'bottom') y0 = S.h - b.y + OUT;
        else y0 = -(b.y + b.h) - OUT;
        return { x0, y0 };
      });
      const out = { S, R, P, pre: R.h ? ((S.h - R.y + OUT) / R.h) * 100 : 100 };
      if (folding) {
        const A = boxIn(action, screen);
        const W = screen.offsetWidth;
        const H = screen.offsetHeight;
        const rad0 = parseFloat(getComputedStyle(screen).borderTopLeftRadius) || 0;
        const radA = parseFloat(getComputedStyle(action).borderTopLeftRadius) || 0;
        // each row above takes the room down to the next row (its gap included); each row below the room up
        // to the row before it
        const top = (r) => r.offsetTop;
        const hu = above.map((r, i) => (i + 1 < above.length ? top(above[i + 1]) : top(arow)) - top(r));
        const prevBottom = (j) => (j === 0 ? top(arow) + arow.offsetHeight : top(below[j - 1]) + below[j - 1].offsetHeight);
        const hd = below.map((r, j) => top(r) + r.offsetHeight - prevBottom(j));
        // a part beside the action is clipped toward it, a few px past its own width so no sliver stays
        // (the action and the parts beside it share the screen as their offset parent)
        const sideClip = sides.map((c) => (c.offsetLeft >= A.x + A.w / 2 ? `inset(0px ${c.offsetWidth + 4}px 0px 0px)` : `inset(0px 0px 0px ${c.offsetWidth + 4}px)`));
        // the card after e events: its top comes down by what has folded above, its foot up by what has
        // folded below, so it never holds an empty stretch
        const paper = [];
        let t = 0;
        let b = 0;
        paper.push([t, b]);
        for (const ev of events) {
          if (ev.type === 'up') t += hu[ev.i];
          else if (ev.type === 'down') b += hd[ev.j];
          paper.push([t, b]);
        }
        const rect = (pad, rad) => `inset(${A.y - pad}px ${W - A.x - A.w - pad}px ${H - A.y - A.h - pad}px ${A.x - pad}px round ${Math.max(0, rad)}px)`;
        out.fold = {
          hu, hd, sideClip,
          paper: paper.map(([pt, pb]) => `inset(${pt}px 0px ${pb}px 0px round ${rad0}px)`),
          hug: rect(HUG, radA + HUG),
          // gone: 1px inside the action's edge, so no light fringe of the card shows round it
          gone: rect(-1, radA - 1),
        };
        const g = Math.max(1, Math.min(grow, (R.w * 0.9) / Math.max(1, A.w)));
        out.go = { x: W / 2 - (A.x + A.w / 2), y: H / 2 - (A.y + A.h / 2), s: g, o: `${A.x + A.w / 2}px ${A.y + A.h / 2}px` };
      }
      return out;
    };
    const geo = () => G || (G = measure());
    const forget = () => { G = null; };
    ScrollTrigger.addEventListener('refreshInit', forget);

    // 1. The empty screen slides up from the stage's bottom edge while the stage scrolls in, so it is in
    // place, whole, the moment the hold starts. yPercent, so it never meets the x/y/scale of the end.
    gsap.fromTo(screen, { yPercent: () => geo().pre }, {
      yPercent: 0, ease: 'power2.out',
      scrollTrigger: { trigger: root, start: 'top bottom', end: 'top top', scrub: o.scrub, invalidateOnRefresh: true },
    });

    // 2. The steps: each part waits hidden (out of the tab order) beyond its edge, then slides in whole
    // over the first share of its step. A row lands marked by the accent and settles back to plain.
    const order = new Map();
    pieces.forEach((p, i) => {
      const k = atOf(p);
      const n = order.get(k) || 0;
      order.set(k, n + 1);
      const t0 = startOf(k) + n * 0.012;
      const d = Math.max(0.02, share * ENTER);
      tl.fromTo(p, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.001 }, t0);
      tl.fromTo(p, { x: () => geo().P[i].x0, y: () => geo().P[i].y0, force3D: true }, { x: 0, y: 0, duration: d, ease: 'power3.out' }, t0);
      if (o.mark && p.parentElement === screen && p.dataset.mark !== 'off') {
        tl.fromTo(p, { '--pa-mark': 1 }, { '--pa-mark': 0, duration: share * (MARK[1] - MARK[0]), ease: 'power1.inOut' }, startOf(k) + share * MARK[0]);
      }
    });

    // 3. The captions: one at a time, out before the next comes in. The first is there from the start.
    const ending = folding || !!close;
    const lastOut = ending ? ROWS[0] - 0.014 : null;
    caps.slice(0, N).forEach((c, i) => {
      const k = i + 1;
      if (k > 1) tl.fromTo(c, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.02, ease: 'power2.out' }, startOf(k) + 0.002);
      const end = k < N ? startOf(k + 1) - 0.014 : lastOut;
      if (end != null) tl.fromTo(c, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -10, duration: 0.012, ease: 'power1.in', immediateRender: false }, end);
    });
    caps.slice(N).forEach((c) => gsap.set(c, { autoAlpha: 0 }));
    // The end (.is-end on the section from the fold on): on wide screens the captions come back as the short
    // list, in place (a fade, no travel), with the closing line under them, beside the action; narrow screens
    // and phones show the closing line alone (the CSS hides the list there).
    const recap = ending && o.recap;
    if (recap) caps.slice(0, N).forEach((c, i) => tl.fromTo(c, { autoAlpha: 0, y: 0 }, { autoAlpha: 1, y: 0, duration: 0.012, ease: 'power1.out', immediateRender: false }, ROWS[0] + 0.004 + i * 0.006));
    if (close) tl.fromTo(close, { autoAlpha: 0, y: recap ? 0 : 14 }, { autoAlpha: 1, y: 0, duration: 0.016, ease: 'power2.out' }, ROWS[0] + 0.004);

    // 4. The fold: one event at a time, each over the first 72% of its slot, so at any moment one row at
    // most is part-way folded; the card's top and foot follow the rows in.
    if (folding) {
      const E = 'power2.inOut';
      const slot = events.length ? (ROWS[1] - ROWS[0]) / events.length : 0;
      const w = slot * 0.72;
      // how far a row has moved before event e: the rooms of the rows that folded past it before then
      const before = (type, idx, e) => {
        let s = 0;
        for (let x = 0; x < e; x++) {
          const ev = events[x];
          if (type === 'up' && ev.type === 'up' && ev.i > idx) s += geo().fold.hu[ev.i];
          if (type === 'down' && ev.type === 'down' && ev.j < idx) s -= geo().fold.hd[ev.j];
        }
        return s;
      };
      events.forEach((ev, e) => {
        const t0 = ROWS[0] + e * slot;
        const at = { duration: w, ease: E, immediateRender: false };
        if (ev.type === 'side') {
          sides.forEach((c, s) => tl.fromTo(c, { clipPath: 'inset(0px 0px 0px 0px)' }, { clipPath: () => geo().fold.sideClip[s], ...at }, t0));
          return;
        }
        const up = ev.type === 'up';
        const el = up ? above[ev.i] : below[ev.j];
        tl.fromTo(el, { clipPath: 'inset(0px 0px 0px 0px)' }, {
          clipPath: () => (up ? `inset(${geo().fold.hu[ev.i]}px 0px 0px 0px)` : `inset(0px 0px ${geo().fold.hd[ev.j]}px 0px)`), ...at,
        }, t0);
        // every row further out slides toward the action by the same room, so the rows stay edge to edge
        const further = up ? above.map((r, i) => i).filter((i) => i < ev.i) : below.map((r, j) => j).filter((j) => j > ev.j);
        for (const idx of further) {
          const r = up ? above[idx] : below[idx];
          const by = () => (up ? geo().fold.hu[ev.i] : -geo().fold.hd[ev.j]);
          tl.fromTo(r, { y: () => before(ev.type, idx, e) }, { y: () => before(ev.type, idx, e) + by(), ...at }, t0);
        }
        tl.fromTo(screen, { clipPath: () => geo().fold.paper[e] }, { clipPath: () => geo().fold.paper[e + 1], ...at }, t0);
      });
      // 5. The card closes in round the action, then goes; the action travels to the middle and grows.
      tl.fromTo(screen, { clipPath: () => geo().fold.paper[events.length] }, {
        clipPath: () => geo().fold.hug, duration: CLOSE[1] - CLOSE[0], ease: 'power2.inOut', immediateRender: false,
      }, CLOSE[0]);
      tl.fromTo(screen, { clipPath: () => geo().fold.hug }, {
        clipPath: () => geo().fold.gone, duration: GONE[1] - GONE[0], ease: 'power2.in', immediateRender: false,
      }, GONE[0]);
      tl.fromTo(screen, { x: 0, y: 0, scale: 1, transformOrigin: () => geo().go.o }, {
        x: () => geo().go.x, y: () => geo().go.y, scale: () => geo().go.s, transformOrigin: () => geo().go.o,
        duration: GO[1] - GO[0], ease: 'power3.inOut', immediateRender: false,
      }, GO[0]);
    }
    if (skip) tl.fromTo(skip, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.01, immediateRender: false }, folding ? GONE[0] : STEPS[1] + 0.02);

    // 6. A status that turns at its step (data-was), and the step on the section for CSS (data-step).
    for (const e of swaps) if (e.__final == null) e.__final = e.textContent;
    let now = 0;
    const setStep = (k) => {
      if (k === now) return;
      now = k;
      root.dataset.step = String(k);
      for (const e of swaps) e.textContent = atOf(e) <= k ? e.__final : e.dataset.was;
    };
    const stepAt = (t) => { let k = 1; for (let s = 2; s <= N; s++) if (t >= startOf(s)) k = s; return k; };
    setStep(1);
    let end = false;
    tl.eventCallback('onUpdate', () => {
      const t = tl.time();
      setStep(stepAt(t));
      // the captions change layout (one stack → the list) only while every one of them is hidden
      const e = ending && t >= ROWS[0] - 0.001;
      if (e !== end) { end = e; root.classList.toggle('is-end', e); }
    });

    // 7. Skip: to the end of the hold, then the focus on the action.
    // Caught on the way down (capture, on the section), so Lenis's own anchor handling never sees the click.
    const onSkip = (ev) => {
      if (!skip || !skip.contains(ev.target)) return;
      ev.preventDefault();
      ev.stopPropagation();
      const st = tl.scrollTrigger;
      if (!st) return;
      const focus = () => { if (action && shown(action)) action.focus({ preventScroll: true }); };
      if (Stage.lenis) Stage.lenis.scrollTo(st.end, { duration: 1.2, onComplete: () => setTimeout(focus, 700) });
      else { window.scrollTo({ top: st.end, behavior: 'instant' }); setTimeout(focus, 900); }
    };
    if (skip) root.addEventListener('click', onSkip, true);

    // Whatever was written outside GSAP goes back when the stage reverts this build.
    if (gsap.context) {
      gsap.context(() => () => {
        ScrollTrigger.removeEventListener('refreshInit', forget);
        if (skip) root.removeEventListener('click', onSkip, true);
        for (const e of swaps) if (e.__final != null) e.textContent = e.__final;
        delete root.dataset.step;
        root.classList.remove('is-end');
      });
    }
  }

  window.Scenes = window.Scenes || {};
  window.Scenes[ID] = (root, opts = {}) => {
    const edge = edgeOr(opts.edge, 'right');
    const o = {
      hold: num(opts.hold, 2.4, 2, 2.5),
      phoneHold: num(opts.phoneHold, 2.2, 2, 2.5),
      scrub: opts.scrub === true || +opts.scrub === 0 ? true : num(opts.scrub, 0.6, 0.1, 0.8),
      edge,
      phoneEdge: edgeOr(opts.phoneEdge, edge),
      mark: opts.mark !== false,
      fold: opts.fold !== false,
      recap: opts.recap !== false,
      grow: num(opts.grow, 1.4, 1, 1.6),
      phoneGrow: num(opts.phoneGrow, 1.3, 1, 1.5),
    };
    const run = (tl, ctx) => build(tl, ctx, o);
    return Stage.scene(root, {
      hold: o.hold,
      scrub: o.scrub,
      build: run,
      phone: opts.phone === 'rest' ? 'rest' : { hold: o.phoneHold, build: run },
    });
  };
})();
