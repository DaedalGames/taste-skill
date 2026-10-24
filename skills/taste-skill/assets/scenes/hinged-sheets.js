// tasteskill / scenes / hinged-sheets.js — paper with two printed sides, dealt from a face-down deck.
//
// Two to four tickets (prices, passes, stats, letters) rise together from one face-down deck below
// the fold. Each peels off, turns from its ink-coloured back to its paper front on a shared vanishing
// point, lifts towards the viewer at mid-turn and lands in its slot, one by one, left to right. The
// stagger comes from the rise durations, not from delays. Meanwhile the headline the cards pass over
// tips back on its bottom edge and goes soft until it is a backdrop; the line over the row and the fine
// print under it arrive once the last ticket is down, and the finished row holds still.
// Use it when the brand has a paper, ticket, stationery or print idea; without one the turning is a
// trick.
//
// The deal runs when every ticket can be at least 296px wide in one row on a screen 560px tall or more
// (three tickets: about 1040 x 640 and up). Phones, tablets, short windows and more than four tickets
// get the flow version: no held stage; the tickets stand in a column or a grid, and each one rises,
// turns and lands on its own as it scrolls in, face-up and still before it is read. Reduced motion, no
// script and a failed CDN show the finished composition: headline, the line over the row, the tickets
// face-up, the fine print.
//
// DOM (optional parts can be left out):
//   <section class="scene" data-scene="hinged-sheets" id="tickets" aria-labelledby="hs-title">
//     <div class="scene-stage">
//       <div class="hs-head">
//         <h2 class="hs-title" id="hs-title">The sea is open all winter</h2>   4-7 words of plain text,
//                                                                            two lines
//         <p class="hs-sub">One sentence, under 20 words.</p>     optional; leaves before the deal
//       </div>
//       <p class="hs-lead">Prices for October to April</p>      3-8 words: the readable heading once the
//                                                               headline has gone soft behind the row
//       <ol class="hs-row" role="list">
//         <li class="hs-slot">                                 2-4 of them (5-12 run as the flow version)
//           <div class="hs-sheet">                             nothing here may fade, clip or filter
//             <article class="hs-face hs-face--front">
//               <img class="hs-photo" src alt="" width height>  optional, the top 29% of the ticket
//               <div class="hs-body">
//                 <h3 class="hs-name">One swim</h3>             1-2 words
//                 <p class="hs-pitch">…</p>                     10-16 words with a photo, up to 26 without
//                 <ul class="hs-points"><li>…</li></ul>         2-3 points of 2-5 words
//               </div>
//               <div class="hs-stub">                          below the perforation
//                 <p class="hs-price"><span class="hs-amount">€14</span><span class="hs-per">a visit</span></p>
//                 <a class="hs-cta" href="…">Buy one swim</a>   optional
//               </div>
//             </article>
//             <div class="hs-face hs-face--back" aria-hidden="true">   shown only while live
//               <span class="hs-big">1 swim</span>              one or two short words, very large
//               <span class="hs-brand">Selkie Sea Baths</span>
//               <span class="hs-small">Any day of the season</span>
//             </div>
//           </div>
//         </li>
//       </ol>
//       <p class="hs-note">One or two lines of fine print, 15-25 words.</p>
//     </div>
//   </section>
// The script makes the ground wash, the turn shades and the headline's blurred copy (an empty
// <span class="hs-title-soft" aria-hidden="true"> whose words are generated content from data-soft)
// itself. Give every front the same amount of copy: tickets keep a 1:1.414 shape.
//
// Options (data-options JSON; defaults in brackets):
//   hold     1.2-4             [0.9 + 0.5 x tickets: 2.4 for three]  screens the stage is held
//   scrub    true | 0.2-0.6    [true with Lenis, else 0.5]
//   deck     0-1               [1]     how far the tickets start towards one centre deck, in slot
//                                      pitches: 0 rises each one straight up from its own slot
//   stagger  0.08-0.18         [0.14; 0.12 with four]  scene between one landing and the next
//   wobble   0-8 (degrees)     [7]     starting rotation of the deck (pattern -1, +0.7, -0.4, +0.6)
//   lean     0-18 (degrees)    [16]    starting rotationX
//   lift     0-120 (px)        [120]   how far each ticket comes towards the viewer at mid-turn
//   tip      0-28 (degrees)    [24]    how far the headline tips back; 0 keeps it flat (it still softens)
//   soften   0-12 (px)         [7]     blur of the headline's soft copy
//   phone    'flip' | 'rest'   ['flip']  the phone's per-ticket turn, or the finished composition
//
// Page tokens: --accent (the one ink: the backs and every word, #b62118), --paper (#fafaf9),
// --font-display, --font-text. Scene tokens on the section: --hs-ground-a and --hs-ground-b (the ground
// at the start and at the end, a tint of a hue that sets off the ink; b clearly lighter, so the stage
// brightens as the tickets land) and --hs-soft (the colour of the soft headline: a deeper tone of the
// ground, so it reads as mist behind the row). Timeline positions are fractions of the scene (0-1).
//
// Scenes['hinged-sheets'](root, opts) returns a handle: { mm (the live gsap.matchMedia), revert() }.
// revert() stops the scene for good and leaves the finished composition.
(() => {
  const ID = 'hinged-sheets';
  if (!window.Stage) { console.warn(ID + ': load stage.js before this file'); return; }

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const opt = (v, d, lo, hi) => (typeof v === 'number' && Number.isFinite(v) ? clamp(v, lo, hi) : d);
  const RAD = Math.PI / 180;
  const WOBBLE = [-1, 0.714, -0.429, 0.571];
  const SHADE = 0.42;     // darkest a face gets, edge-on
  const MIN_W = 296;      // narrowest ticket the deal runs with (its text is 14px there)

  const make = (tag, cls, parent, first) => {
    const el = document.createElement(tag);
    el.className = cls;
    el.setAttribute('aria-hidden', 'true');
    first ? parent.prepend(el) : parent.append(el);
    return el;
  };

  // The perforation while live: a clip-path (an SVG clipPath in the ticket's own 0-1 box: two notches
  // and a row of punched holes at 70% of its height), not the mask the finished composition uses. Under
  // a moving 3D transform Chrome repaints a masked face, photo and all, on every frame; a path clip
  // repaints nothing. Built once per document, from the same geometry as the CSS mask (a 1000 x 1414
  // box), so the two look the same.
  const perforate = () => {
    if (document.getElementById('hs-perf')) return;
    const W = 1000, H = 1414, Y = 990, f = (v) => +v.toFixed(5);
    const hole = (cx, r) => { const rx = f(r / W), ry = f(r / H), x = f(cx / W), y = f(Y / H); return `M${f(x - rx)} ${y}a${rx} ${ry} 0 1 0 ${f(2 * rx)} 0a${rx} ${ry} 0 1 0 ${f(-2 * rx)} 0z`; };
    let d = 'M0 0H1V1H0z' + hole(0, 26) + hole(W, 26);
    for (let x = 75; x <= 925; x += 34) d += hole(x, 8);
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    const clip = document.createElementNS(NS, 'clipPath');
    clip.id = 'hs-perf';
    clip.setAttribute('clipPathUnits', 'objectBoundingBox');
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('clip-rule', 'evenodd');
    path.setAttribute('d', d);
    clip.append(path);
    svg.append(clip);
    document.body.append(svg);
  };

  Scenes[ID] = (root, opts = {}) => {
    const stage = root.querySelector(':scope > .scene-stage');
    const row = root.querySelector('.hs-row');
    const slots = [...root.querySelectorAll('.hs-slot')].filter((s) => s.querySelector('.hs-sheet'));
    const sheets = slots.map((s) => s.querySelector('.hs-sheet'));
    const N = sheets.length;
    if (!stage || !row || !N) { console.warn(ID + ': needs .scene-stage, .hs-row and at least one .hs-slot > .hs-sheet'); return null; }

    // The headline crossfades into a pre-blurred copy instead of tweening a filter on large type. The
    // sharp words keep the heading; the copy is generated content, so it is never read or measured. The
    // blur sits on the copy's ::before and the fade on the span around it: the blur is painted once into
    // the span's layer, and the fade only changes that layer's opacity, so no frame redraws a blur.
    const title = root.querySelector('.hs-title');
    let sharp = null, soft = null;
    if (title) {
      soft = title.querySelector(':scope > .hs-title-soft');
      if (soft) soft.remove();
      sharp = title.querySelector(':scope > .hs-title-sharp');
      if (!sharp) {
        sharp = document.createElement('span');
        sharp.className = 'hs-title-sharp';
        while (title.firstChild) sharp.append(title.firstChild);
        title.append(sharp);
      }
      soft = soft || document.createElement('span');
      soft.className = 'hs-title-soft';
      soft.setAttribute('aria-hidden', 'true');
      soft.textContent = '';
      soft.dataset.soft = sharp.textContent.replace(/\s+/g, ' ').trim();
      title.append(soft);
    }
    const sub = root.querySelector('.hs-sub');
    const lead = root.querySelector('.hs-lead');
    const note = root.querySelector('.hs-note');
    const wash = stage.querySelector(':scope > .hs-wash') || make('div', 'hs-wash', stage, true);
    const shades = sheets.map((sh) => [...sh.querySelectorAll(':scope > .hs-face')].map((f) => f.querySelector(':scope > .hs-shade') || make('span', 'hs-shade', f)));
    // The backs are print (aria-hidden). During the deal they overlap one another in the deck, so their
    // words become generated content there and are never counted as text lying under a ticket; in the
    // flow they are ordinary text again.
    const printed = [...root.querySelectorAll('.hs-face--back > *:not(.hs-shade)')].filter((el) => !el.children.length);
    const asPrint = (on) => {
      for (const el of printed) {
        if (on && el.dataset.print == null && el.textContent.trim()) { el.dataset.print = el.textContent.replace(/\s+/g, ' ').trim(); el.textContent = ''; }
        else if (!on && el.dataset.print != null) { el.textContent = el.dataset.print; delete el.dataset.print; }
      }
    };
    if (Stage.live) perforate();
    slots.forEach((s, i) => s.style.setProperty('--i', i));
    if (N <= 4) root.style.setProperty('--n', N);
    if (opts.soften != null) root.style.setProperty('--hs-soften', opt(opts.soften, 7, 0, 12) + 'px');
    root.querySelectorAll('img').forEach((img) => { if (img.decode) img.decode().catch(() => {}); }); // decoded before they move

    const o = {
      deck: opt(opts.deck, 1, 0, 1),
      stagger: opt(opts.stagger, N > 3 ? 0.12 : 0.14, 0.08, 0.18),
      wobble: opt(opts.wobble, 7, 0, 8),
      lean: opt(opts.lean, 16, 0, 18),
      lift: opt(opts.lift, 120, 0, 120),
      tip: opt(opts.tip, 24, 0, 28),
    };
    const hold = opt(opts.hold, 0.9 + 0.5 * Math.min(N, 4), 1.2, 4);
    const scrub = typeof opts.scrub === 'boolean' ? opts.scrub : typeof opts.scrub === 'number' ? clamp(opts.scrub, 0.2, 0.6) : (Stage.lenis ? true : 0.5);

    // Turning: |sin(rotationY)| shades both faces, so the edge-on moment reads as paper, not a stray
    // line. Which face shows is left to backface-visibility alone: the browser knows where the eye is,
    // so nothing here can make a ticket vanish. data-face only takes the pointer off the face that is
    // turned away. Everything is read live from the sheet, never from a cache, and turn() runs on every
    // timeline update and after every refresh (a refresh renders the timeline with its events muted).
    const turn = (i) => {
      const sheet = sheets[i];
      const ry = gsap.getProperty(sheet, 'rotationY') * RAD;
      const s = Math.round(Math.abs(Math.sin(ry)) * SHADE * 1000) / 1000;
      const sh = shades[i];
      if (sh.last !== s) { sh.last = s; for (const el of sh) el.style.opacity = s; }
      const face = Math.cos(ry) >= 0 ? 'front' : 'back';
      if (sheet.dataset.face !== face) sheet.dataset.face = face;
    };
    const untouched = () => {
      sheets.forEach((sheet, i) => { delete sheet.dataset.face; shades[i].last = 0; for (const el of shades[i]) el.style.opacity = ''; });
      row.removeAttribute('data-shut');
      root.classList.remove('hs-moving');
    };

    // Is there room for the deal: one row, every ticket MIN_W or wider, a screen 560px tall or more.
    const roomy = () => {
      const W = window.innerWidth, H = window.innerHeight;
      if (N > 4 || W < 768 || H < 560) return false;
      return Math.min(400, (0.92 * W - (N - 1) * 28) / N, (0.66 * H) / 1.414) >= MIN_W;
    };

    // the deal currently running (null in the flow), for the keyboard guard below
    let current = null;
    row.addEventListener('focusin', () => {
      if (!current || !root.classList.contains('is-live')) return;
      const { tl, open } = current, st = tl.scrollTrigger;
      if (!st || tl.progress() >= open) return;
      const y = st.start + 0.8 * (st.end - st.start);   // a keyboard user lands on the finished row
      if (Stage.lenis) Stage.lenis.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y);
    });

    // ---- the deal: held stage, desktop ----
    function deal(tl, { stage: st }) {
      root.classList.remove('hs-flow');
      untouched();
      asPrint(true);
      const ends = sheets.map((_, i) => 0.40 + i * o.stagger);
      const last = ends[N - 1];
      const mid = (N - 1) / 2;
      // slot pitch, measured whenever the timeline is (re)built or refreshed
      const pitch = () => (N > 1 ? slots[1].offsetLeft - slots[0].offsetLeft : 0);
      // the deck's top edge starts 40px below the fold, plus what the wobble raises its corners by
      const below = () => st.clientHeight / 2 + sheets[0].offsetHeight / 2 + 40 + (sheets[0].offsetWidth / 2) * Math.sin(o.wobble * RAD);

      tl.fromTo(wash, { opacity: 0 }, { opacity: 1, duration: last - 0.06 }, 0.06);
      if (sub) tl.fromTo(sub, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -12, ease: 'power1.in', duration: 0.12 }, 0.10);

      sheets.forEach((sheet, i) => {
        const end = ends[i];
        const fs = 0.06 + 0.35 * (end - 0.06), fd = end - 0.04 - fs; // turn starts with a quarter showing, ends before landing
        tl.fromTo(sheet,
          { x: () => (mid - i) * pitch() * o.deck, y: below, rotation: WOBBLE[i % 4] * o.wobble, rotationX: o.lean, transformOrigin: '50% 50%' },
          { x: 0, y: 0, rotation: 0, rotationX: 0, ease: 'power1.inOut', duration: end - 0.06 }, 0.06);
        tl.fromTo(sheet, { rotationY: 180 }, { rotationY: 0, ease: 'power2.inOut', duration: fd }, fs);
        tl.fromTo(sheet, { z: 0 }, { z: o.lift, ease: 'sine.out', duration: fd / 2 }, fs);
        tl.to(sheet, { z: 0, ease: 'sine.in', duration: fd / 2 }, fs + fd / 2);
      });

      // The headline lays down first and softens after: it tips back on its bottom edge from 0.20 to
      // 0.42 while the sharp words are still nearly whole (above 0.7 until about 0.37), then the sharp
      // words fade (0.30-0.48) under a soft copy in a deeper tone of the ground (0.34-0.54), so the
      // overlap reads as the words going out of focus and into the distance, not as a halo.
      if (title) {
        gsap.set(title, { transformOrigin: '50% 100%', transformPerspective: 1200 });
        if (o.tip) tl.fromTo(title, { rotationX: 0, y: 0, scale: 1 }, { rotationX: o.tip, y: -28, scale: 0.94, ease: 'power1.inOut', duration: 0.22 }, 0.20);
        tl.fromTo(sharp, { opacity: 1 }, { opacity: 0, ease: 'power1.inOut', duration: 0.18 }, 0.30);
        tl.fromTo(soft, { opacity: 0 }, { opacity: 0.9, ease: 'power1.inOut', duration: 0.20 }, 0.34);
      }
      if (lead) tl.fromTo(lead, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, ease: 'power2.out', duration: 0.10 }, last - 0.06);
      if (note) tl.fromTo(note, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, ease: 'power2.out', duration: 0.10 }, last - 0.02);
      tl.set({}, {}, 1);

      // the row takes the pointer only once the last ticket is down; the headline's layers are kept
      // (will-change) only while it tips and fades, and painted flat into the stage the rest of the time
      const open = last + 0.02;
      let shut = null, moving = null;
      const update = () => {
        for (let i = 0; i < N; i++) turn(i);
        const p = tl.progress();
        const s = p < open;
        if (s !== shut) { shut = s; if (s) row.setAttribute('data-shut', ''); else row.removeAttribute('data-shut'); }
        const m = p > 0.15 && p < 0.6;
        if (m !== moving) { moving = m; root.classList.toggle('hs-moving', m); }
      };
      tl.eventCallback('onUpdate', update);
      update();
      current = { tl, open, update };
    }

    // ---- the flow: no held stage; each ticket turns over as it scrolls into view ----
    function flow(tl, { phone }) {
      root.classList.add('hs-flow');
      untouched();
      asPrint(false);
      current = null;
      const colOf = (i) => { let c = 0; for (let k = i - 1; k >= 0 && slots[k].offsetTop === slots[i].offsetTop; k--) c++; return c; };
      sheets.forEach((sheet, i) => {
        const d = Math.min(0.3, colOf(i) * 0.1); // tickets side by side still land left to right
        const len = 1 - d;
        const t = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: slots[i], start: 'top 96%', end: 'top 38%', scrub: phone || scrub === true ? 0.4 : scrub, invalidateOnRefresh: true },
        });
        t.fromTo(sheet, { y: 140, rotation: WOBBLE[i % 4] * Math.min(o.wobble, 5), rotationX: 14, transformOrigin: '50% 50%' },
          { y: 0, rotation: 0, rotationX: 0, ease: 'power1.inOut', duration: len }, d)
          .fromTo(sheet, { rotationY: 180 }, { rotationY: 0, ease: 'power2.inOut', duration: 0.65 * len }, d + 0.25 * len)
          .fromTo(sheet, { z: 0 }, { z: Math.min(o.lift, 60), ease: 'sine.out', duration: 0.325 * len }, d + 0.25 * len)
          .to(sheet, { z: 0, ease: 'sine.in', duration: 0.325 * len }, d + 0.575 * len)
          .set({}, {}, 1);
        t.eventCallback('onUpdate', () => turn(i));
        turn(i);
      });
    }

    // A refresh (resize, fonts, pictures, another scene) renders every timeline at its new progress
    // with events muted, so the shades and data-face are brought up to date after each one.
    const refreshed = () => {
      if (!root.classList.contains('is-live')) return;
      if (current) current.update(); else for (let i = 0; i < N; i++) turn(i);
    };

    let mm = null, dealing = null, timer = 0;
    const start = () => {
      mm = Stage.scene(root, {
        hold,
        scrub,
        phone: opts.phone === 'rest' ? 'rest' : { hold: 1, build: flow },
        build: (tl, ctx) => { dealing = roomy(); return dealing ? deal(tl, ctx) : flow(tl, ctx); },
      });
    };
    const stop = () => {
      if (!mm) return;
      const k = Stage.scenes.indexOf(mm);
      if (k > -1) Stage.scenes.splice(k, 1);
      mm.revert();
      mm = null;
      current = null;
      untouched();
    };
    // The stage only switches at the phone width; this scene also switches between the deal and the
    // flow when a resize changes whether the row fits.
    const resized = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!mm || Stage.phone || !root.classList.contains('is-live') || roomy() === dealing) return;
        stop();
        start();
        ScrollTrigger.refresh();
      }, 150);
    };
    start();
    if (mm) {
      window.addEventListener('resize', resized);
      ScrollTrigger.addEventListener('refresh', refreshed);
    }
    // one stable handle for the life of the section, whatever the resizes rebuild underneath it
    return {
      get mm() { return mm; },
      revert() {
        clearTimeout(timer);
        window.removeEventListener('resize', resized);
        if (window.ScrollTrigger) ScrollTrigger.removeEventListener('refresh', refreshed);
        stop();
        asPrint(false);
        root.classList.remove('hs-flow', 'is-live', 'is-rest');
      },
    };
  };
})();
