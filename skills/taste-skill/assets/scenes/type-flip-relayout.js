// tasteskill / scenes / type-flip-relayout.js — a list in giant capitals, re-set three times by the scroll.
//
// A short list (what a studio makes, a programme, a set of benefits) is set in capitals as large as the
// measure allows, on a held, picture-free stage. First its ragged lines spread into a justified slab,
// each line catching up a beat after the one above, and the short last item slides across to flush
// right. Then the hierarchy swaps: the heading shrinks into small letters that relay one by one to the
// opposite corner, the slab folds, line by line, into a small index in the corner the heading left, and
// the heading swells to display size over a paragraph at statement size. The scene opens on a giant
// list under a small title and ends on a giant title over a small index. Type, one flat ground and one
// ink colour; for editorial, type-led and minimalist pages.
//
// Why a list: the house rule keeps every headline to two lines, and a sentence set this large over five
// lines reads as a five-line headline. A list item set large is its own line of content, so the giant
// type is a <ul> of four to six short items and the section's heading is the one-word title above it.
//
// DOM (the script splits the words and letters, keeps the clean text for screen readers in .rl-sr, and
// appends a hidden measuring copy, div.rl-ghost):
//
//   <section class="scene" data-scene="type-flip-relayout" data-options='{}' aria-labelledby="rl-title">
//     <div class="scene-stage">
//       <h2 class="rl-label" id="rl-title">Work</h2>          one word, 4-7 letters: the section's heading
//       <ul class="rl-block">                                 3-6 items (up to 12 work, smaller), one line each
//         <li class="rl-line">Books and zines</li>            every item but the last: 2-4 words, 11-16 characters
//         <li class="rl-line">Labels for beer</li>
//         …
//         <li class="rl-line">Posters</li>                    the last: 1-2 words, 9 characters at most
//       </ul>
//       <p class="rl-body">About 25 words, at most three lines at statement size.</p>
//     </div>
//   </section>
//
// Fitting: the type is sized to the copy, not to the viewport. It grows until the most demanding item
// fills the measure with `gap` em between its words (so the spread is a visible move and the tightest
// line justifies with that gap), never letting the widest item pass `fill` of the measure, up to `size`
// vw and up to the height the stage leaves under the heading. When the height or the cap holds it below
// that size, the measure narrows by whole columns instead, so the slab stays dense and its gaps stay as
// tight as the copy allows (12 items, a short window, a landscape phone, a 2560px screen). The finished
// composition does not spread, so it is set denser: the widest item fills `fill` of the measure, with
// the same cap and narrowing and no height limit. Lines never wrap.
//
// Content: an item much shorter than the longest opens justified gaps over 4.5em that read as holes,
// and a single-word item (other than the last) cannot justify at all; the script warns once in the
// console, naming the item. The fix is the copy, not the code.
//
// Options (data-options JSON). Default, then range:
//   hold       3       screens the stage is held on desktop (2-4)
//   phone      'rest'  under 768px: 'rest' shows the finished composition (heading, justified slab,
//                      paragraph) as an ordinary section; 'same' holds a compact version that keeps the
//                      spread and the slide (no relay, no fold) and ends on the justified slab
//   phoneHold  1.5     screens held under 768px when phone is 'same' (1-3)
//   scrub      auto    true when Lenis smooths the page, else 0.8 (seconds of catch-up); set to override
//   size       12      largest display size, in vw (6-16)
//   gap        1.2     the tightest justified gap, in em, the live type is sized for (0.6-3): smaller sets
//                      bigger type and a subtler spread
//   fill       0.94    share of the measure the widest ragged item may take (0.8-0.98); the finished
//                      composition is set to exactly this
//   cols       12      most columns of the 12-column grid the list may span from the left, desktop (4-12)
//   index      'auto'  index type size in px (14-32); 'auto' follows the width: 24px at 1440, 20-32px
//   relay      true    the heading's relay to the far corner; false keeps it still at the top left and
//                      lands the index under it (a quieter scene, no swell)
//   grow       true    after the relay, the heading swells to the width of the paragraph's columns
//   dot        0.3     scale of a letter while it travels (0.12-0.4)
//   stagger    0.016   delay between letters in the relay, as a share of the scene (0.010-0.025)
//
// Progress map (desktop, 1440x900, the demo's five items fitted to 125px, a 52px heading):
//   0      ragged list flush left in the bottom band (y 279-852), heading at the top left, paragraph hidden
//   0.05   line i spreads to the full measure from 0.05 + 0.04i over 0.18 (its first word never moves);
//          gaps open from 0.26em to 1.2-2.8em
//   0.30   the last item slides from flush left to flush right, 0.30-0.44
//   0.44   rest: a justified slab from 40 to 1400, last item flush right
//   0.52   the heading's letters shrink to 0.3 (16px), last letter first; they cross the top band and
//          regrow at the top right by 0.70
//   0.58   line i folds into index row i from 0.58 + 0.032i over 0.12: it rises, shrinks to the index
//          size and its words close up; each line trails the one above it, so lines never cross
//   0.75   the folding lines have cleared the top right: the heading swells from its corner to span
//          columns 6-12 (52px to about 255px), to 0.86
//   0.77   the paragraph rises 24px and fades in at the bottom right, columns 6-12, to 0.85
//   0.86   rest: index top left, giant heading top right, paragraph bottom right
// Phone ('same', 390x844, hold 1.5): heading, list and paragraph as one group in the middle of the
// stage; spread 0.06 + 0.05i over 0.24, last item 0.42-0.66, rest on the justified slab to 1. Under
// 340px wide, or when the type would fit only under 30px, the phone shows the finished composition.
// Portrait over 767px (narrower than 10:11, a tablet held upright) also shows the finished composition,
// since the held stage would be more than half empty; turning the window rebuilds the scene.
// Eases: the spec's curves are quadratic where it says power2 and cubic where it says power3, which are
// GSAP's power1 and power2; the timeline uses those, so its frames match the studied progress map.
// Rendering: moving words are composited (force3D 'auto') and drop back to 2D at every rest, so the
// index lands on whole pixels and re-rasterises sharp; the swelling heading is painted (2D) throughout,
// so its large letters never show a stretched small raster.
(() => {
  const ID = 'type-flip-relayout';
  const GAP = 0.26; // the base word gap in em, as in the CSS
  const WIDE = '(min-aspect-ratio: 10/11)'; // matches unless the window is clearly portrait
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const num = (v, d, a, b) => (typeof v === 'number' && isFinite(v) ? clamp(v, a, b) : d);
  const node = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const rects = (els) => els.map((e) => e.getBoundingClientRect());

  const settings = (o = {}) => ({
    hold: num(o.hold, 3, 2, 4),
    phoneHold: num(o.phoneHold, 1.5, 1, 3),
    phone: o.phone === 'same' ? 'same' : 'rest',
    scrub: typeof o.scrub === 'boolean' || typeof o.scrub === 'number' ? o.scrub : null,
    size: num(o.size, 12, 6, 16),
    gap: num(o.gap, 1.2, 0.6, 3),
    fill: num(o.fill, 0.94, 0.8, 0.98),
    cols: Math.round(num(o.cols, 12, 4, 12)),
    index: typeof o.index === 'number' ? num(o.index, 24, 14, 32) : null,
    relay: o.relay !== false,
    grow: o.grow !== false,
    dot: num(o.dot, 0.3, 0.12, 0.4),
    stagger: num(o.stagger, 0.016, 0.01, 0.025),
  });

  // Timings as fractions of the scene. Spreads and folds are staggered by whole lines only; with many
  // lines the stagger shrinks so the chain still ends where the plan says.
  const PLAN = {
    desk: { spreadAt: 0.05, spreadStep: 0.04, spreadSpan: 0.16, spreadDur: 0.18, lastAt: 0.30, lastDur: 0.14, relayAt: 0.52, foldAt: 0.58, foldStep: 0.032, foldSpan: 0.13, foldDur: 0.12, growLead: 0.35, growDur: 0.11, bodyLead: 0.5, bodyDur: 0.08 },
    phone: { spreadAt: 0.06, spreadStep: 0.05, spreadSpan: 0.2, spreadDur: 0.24, lastAt: 0.42, lastDur: 0.24 },
  };

  const make = (root, opts = {}) => {
    const o = settings(opts);
    const stage = root.querySelector(':scope > .scene-stage') || root.firstElementChild;
    const block = stage && stage.querySelector('.rl-block');
    if (!stage || !block) return null;
    const label = stage.querySelector('.rl-label');
    const body = stage.querySelector('.rl-body');

    if (!o.relay) root.dataset.relay = 'off';
    root.style.setProperty('--rl-cols-desk', o.cols);
    if (o.index) root.style.setProperty('--rl-index-set', o.index + 'px');

    // --- split: letters of the heading, words of every item; the clean text stays for screen readers
    let chars = [];
    if (label) {
      let row = label.querySelector('.rl-label-row');
      if (!row) {
        const text = label.textContent.trim().replace(/\s+/g, ' ');
        label.textContent = '';
        row = node('span', 'rl-label-row');
        row.setAttribute('aria-hidden', 'true');
        for (const ch of [...text]) row.append(node('span', 'rl-ch', ch === ' ' ? '\u00a0' : ch));
        label.append(node('span', 'rl-sr', text), row);
      }
      chars = [...row.querySelectorAll('.rl-ch')];
    }
    const lines = [...block.children].filter((n) => n.matches('li, .rl-line'));
    for (const [i, line] of lines.entries()) {
      line.classList.add('rl-line');
      // earlier lines paint on top, so the text box of a line never lies over the capitals above it
      line.style.zIndex = String(lines.length - i);
      if (line.querySelector('.rl-words')) continue;
      const text = line.textContent.trim().replace(/\s+/g, ' ');
      line.textContent = '';
      const row = node('span', 'rl-words');
      row.setAttribute('aria-hidden', 'true');
      for (const w of text.split(' ').filter(Boolean)) row.append(node('span', 'rl-word', w));
      line.append(node('span', 'rl-sr', text), row);
    }
    const items = lines
      .map((el) => ({ el, name: (el.querySelector('.rl-sr') || el).textContent.trim(), words: [...el.querySelectorAll('.rl-word')] }))
      .filter((it) => it.words.length);
    if (!items.length) return null;
    const lineWords = items.map((it) => it.words);
    const words = lineWords.flat();

    // --- the hidden measuring copy: the list and the heading's letters, without ids or hidden text
    const ghost = node('div', 'rl-ghost');
    ghost.setAttribute('aria-hidden', 'true');
    const gBlock = node('div', block.className);
    for (const it of items) {
      const gl = node('div', it.el.className);
      gl.append(it.el.querySelector('.rl-words').cloneNode(true));
      gBlock.append(gl);
    }
    const gLabel = label ? node('p', 'rl-label') : null;
    if (gLabel) { const row = label.querySelector('.rl-label-row'); if (row) gLabel.append(row.cloneNode(true)); }
    ghost.append(...[gLabel, gBlock].filter(Boolean));
    stage.append(ghost);
    const gLineWords = [...gBlock.children].map((l) => [...l.querySelectorAll('.rl-word')]);
    const gWords = gLineWords.flat();
    const gChars = gLabel ? [...gLabel.querySelectorAll('.rl-ch')] : [];
    const labelRow = label ? label.querySelector('.rl-label-row') : null;

    const S = { phone: false, fs: 0, sI: 0.17, dxL: 0, sL: 1, xL: 0, at: new Map(), warned: false };
    const isLive = () => root.classList.contains('is-live');
    const setClass = (el, cls) => { el.classList.remove('is-justified', 'is-index', 'is-right'); if (cls) el.classList.add(cls); };
    const px = (el, prop) => parseFloat(getComputedStyle(el)[prop]) || 0;
    const cssNum = (name, d) => { const v = parseFloat(getComputedStyle(root).getPropertyValue(name)); return isFinite(v) ? v : d; };

    // Size the type to the copy. The measure an item needs, in em, is its words plus `gap` em between
    // each pair (so the spread is a visible move and the tightest line still justifies with that gap),
    // and the widest item at the base gap is at most `fill` of it (so nothing wraps). The type grows
    // until the most demanding item uses the whole measure, up to `size` vw and the free height. When
    // the cap or the height holds it smaller, the measure narrows by whole columns instead, so the slab
    // stays dense and no gap opens into a hole. Word widths do not depend on the justification and the
    // line pitch is 0.9em, so everything is read at one size and scaled.
    const fitType = (blk, lws, availH, gapEm) => {
      root.style.removeProperty('--rl-fs');
      root.style.removeProperty('--rl-fit-cols');
      const fs0 = px(blk, 'fontSize');
      const M = blk.clientWidth;
      if (!fs0 || !M) return 0;
      const wordsEm = (fs) => lws.map((ws) => ({ n: ws.length, w: ws.reduce((a, w) => a + w.getBoundingClientRect().width, 0) / fs }));
      const widestEm = (ls) => Math.max(...ls.map((l) => l.w + GAP * (l.n - 1)));
      const ls = wordsEm(fs0);
      const needEm = Math.max(widestEm(ls) / o.fill, ...ls.slice(0, -1).filter((l) => l.n > 1).map((l) => l.w + gapEm * (l.n - 1)));
      const vw = document.documentElement.clientWidth || window.innerWidth;
      const fsFit = M / needEm;
      const fsCap = (o.size * vw) / 100;
      const fsH = availH / (0.9 * lws.length + 0.1);
      let fs = Math.max(12, Math.floor(Math.min(fsFit, fsCap, fsH) * 100) / 100);
      root.style.setProperty('--rl-fs', fs + 'px');
      if (fs < fsFit * 0.98) {
        const cols = cssNum('--rl-cols', 12);
        const g = cssNum('--g', 24);
        const unit = (M + g) / cols;
        const n = clamp(Math.ceil((needEm * fs + g) / unit - 0.001), Math.min(4, cols), cols);
        if (n < cols) root.style.setProperty('--rl-fit-cols', String(n));
      }
      // type does not scale exactly linearly: check the widest item against the measure it now has
      const M2 = blk.clientWidth;
      const w2 = widestEm(wordsEm(fs)) * fs;
      if (w2 > o.fill * M2 + 1) {
        fs = Math.floor(((fs * o.fill * M2) / w2) * 100) / 100;
        root.style.setProperty('--rl-fs', fs + 'px');
      }
      return fs;
    };

    // Gaps over 4.5em read as holes, and a one-word item cannot justify: say so once, with the item.
    const checkCopy = (rectLines, fs) => {
      if (S.warned || !fs) return;
      for (let li = 0; li < rectLines.length - 1; li++) {
        const rs = rectLines[li];
        let msg = '';
        if (rs.length < 2) msg = 'is a single word, so it cannot justify and stays flush left; give it a second word.';
        else {
          let gap = 0;
          for (let q = 1; q < rs.length; q++) gap = Math.max(gap, rs[q].left - rs[q - 1].right);
          if (gap / fs > 4.5) msg = `justifies with gaps of ${(gap / fs).toFixed(1)}em, which read as holes; give it another word or shorten the longest item.`;
        }
        if (msg) { S.warned = true; console.warn(`type-flip-relayout: "${items[li].name}" ${msg}`); return; }
      }
    };

    // Finished composition: nothing spreads, so the slab is set as dense as it goes (the widest item
    // fills `fill` of the measure), with the same cap and narrowing and no height limit.
    const fitStatic = () => {
      if (isLive()) return;
      const fs = fitType(block, lineWords, Infinity, GAP);
      if (fs) checkCopy(lineWords.map(rects), fs);
    };

    // Live: fit on the ghost, then read every word in the three settings and every heading letter in
    // both corners. Runs after fonts are in and on every refresh.
    const measure = () => {
      if (!isLive()) return;
      setClass(gBlock, null);
      if (gLabel) setClass(gLabel, null);
      let availH;
      if (S.phone) {
        // the heading, the list and the paragraph share the stage
        const cs = getComputedStyle(stage);
        availH = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)
          - (label ? label.offsetHeight + px(block, 'marginTop') : 0)
          - (body ? body.offsetHeight + px(body, 'marginTop') : 0);
      } else {
        // the list keeps a band of 48px under the heading; its bottom edge does not move with the size
        const lb = gLabel ? gLabel.getBoundingClientRect() : null;
        availH = gBlock.getBoundingClientRect().bottom - (lb ? lb.bottom + 48 : stage.getBoundingClientRect().top + 24);
      }
      fitType(gBlock, gLineWords, availH, o.gap);
      S.fs = px(gBlock, 'fontSize');
      if (!S.fs) return;

      const s0 = stage.getBoundingClientRect();
      const R = rects(gWords);
      setClass(gBlock, 'is-justified');
      const J = rects(gWords);
      let I = null;
      if (!S.phone) { setClass(gBlock, 'is-index'); I = rects(gWords); S.sI = px(gBlock, 'fontSize') / S.fs; }
      setClass(gBlock, null);
      words.forEach((w, n) => {
        const r = R[n], j = J[n], i = I ? I[n] : r;
        if (!r) return;
        S.at.set(w, {
          dxJ: j.left - r.left,
          // the index lands on whole pixels so the small type re-rasterises sharp
          dxI: Math.round(i.left - s0.left) - (r.left - s0.left),
          dyI: Math.round(i.top - s0.top) - (r.top - s0.top),
        });
      });
      if (gLabel && gChars.length) {
        const a = gChars[0].getBoundingClientRect().left;
        setClass(gLabel, 'is-right');
        const b = gChars[0].getBoundingClientRect().left;
        setClass(gLabel, null);
        S.dxL = Math.round(b - a);
      }
      // the heading's swell at the top right: as wide as the paragraph's columns, and clear of the
      // paragraph by 48px. It scales about the row's top-left corner and shifts back left by what the
      // scale adds, so its top and right edges stay where the relay put them. Layout boxes only
      // (offset*), which transforms never change.
      S.sL = 1; S.xL = 0;
      if (!S.phone && labelRow && labelRow.offsetWidth) {
        const w = labelRow.offsetWidth, h = labelRow.offsetHeight;
        const right = stage.clientWidth - cssNum('--m', 40);
        const top = label.offsetTop;
        const tw = body ? right - body.offsetLeft : stage.clientWidth * 0.5;
        const th = (body ? body.offsetTop - 48 : stage.clientHeight * 0.45) - top;
        S.sL = Math.max(1, Math.min(tw / w, th / h));
        S.xL = Math.round((1 - S.sL) * (S.dxL + w));
      }
      let n = 0;
      checkCopy(gLineWords.map((ws) => { const rs = J.slice(n, n + ws.length); n += ws.length; return rs; }), S.fs);
    };

    const toStatic = () => {
      root.classList.remove('is-live');
      root.classList.add('is-rest');
      root.style.removeProperty('--hold');
      fitStatic();
    };

    const val = (key) => (i, el) => { const m = S.at.get(el); return m ? m[key] : 0; };
    // composited while they move, 2D at every rest (force3D 'auto'), never left on a layer
    const T = (vars) => Object.assign({ immediateRender: false, force3D: 'auto' }, vars);

    // A portrait window over 767px (a tablet held upright, a narrow desktop window) leaves the held
    // stage more than half empty, since the type is held by the width; it gets the finished composition.
    const upright = () => !!window.matchMedia && !window.matchMedia(WIDE).matches;

    const build = (tl, c) => {
      S.phone = !!c.phone;
      measure();
      if (S.phone ? (stage.clientWidth < 340 || S.fs < 30) : upright()) { toStatic(); return; }
      const P = S.phone ? PLAN.phone : PLAN.desk;
      const L = lineWords.length;

      // 1. spread: line i, all its words on one timing, to the justified setting
      const sStep = L > 2 ? Math.min(P.spreadStep, P.spreadSpan / (L - 2)) : 0;
      for (let i = 0; i < L - 1; i++) {
        tl.fromTo(lineWords[i], { x: 0 }, T({ x: val('dxJ'), duration: P.spreadDur, ease: 'power1.out' }), P.spreadAt + sStep * i);
      }
      // 2. the last item slides flush right
      tl.fromTo(lineWords[L - 1], { x: 0 }, T({ x: val('dxJ'), duration: P.lastDur, ease: 'power1.inOut' }), P.lastAt);

      if (!S.phone) {
        // 3. the heading relays to the far corner, last letter leading
        if (o.relay && chars.length) {
          const n = chars.length;
          const st = Math.min(o.stagger, 0.1 / Math.max(1, n - 1));
          const sh = st * 0.75;
          chars.forEach((ch, i) => {
            const k = n - 1 - i;
            tl.fromTo(ch, { scale: 1 }, T({ scale: o.dot, duration: 0.03, ease: 'power1.in' }), P.relayAt + sh * k)
              .fromTo(ch, { x: 0 }, T({ x: () => S.dxL, duration: 0.09, ease: 'power2.inOut' }), P.relayAt + 0.02 + st * k)
              .fromTo(ch, { scale: o.dot }, T({ scale: 1, duration: 0.03, ease: 'power1.out' }), P.relayAt + 0.09 + st * k);
          });
        }

        // 4. fold: line i rises into index row i, shrinking about its top-left corner, words closing up
        const fStep = L > 1 ? Math.min(P.foldStep, P.foldSpan / (L - 1)) : 0;
        for (let i = 0; i < L; i++) {
          tl.fromTo(lineWords[i], { x: val('dxJ'), y: 0, scale: 1 },
            T({ x: val('dxI'), y: val('dyI'), scale: () => S.sI, duration: P.foldDur, ease: 'power2.inOut' }), P.foldAt + fStep * i);
        }

        const lastFold = P.foldAt + fStep * (L - 1);

        // 5. the hierarchy swaps: once the folding lines have cleared the top right, the heading swells
        // from its corner to the width of the paragraph's columns. Painted, not composited (force3D
        // false), so the large letters stay sharp while they grow.
        if (o.relay && o.grow && labelRow) {
          tl.fromTo(labelRow, { x: 0, scale: 1 },
            { x: () => S.xL, scale: () => S.sL, duration: P.growDur, ease: 'power2.inOut', immediateRender: false, force3D: false }, lastFold + P.growLead * P.foldDur);
        }

        // 6. the paragraph, once the last item is halfway up and clear of its box
        if (body) {
          tl.fromTo(body, { autoAlpha: 0, y: 24 }, T({ autoAlpha: 1, y: 0, duration: P.bodyDur, ease: 'power1.out' }), lastFold + P.bodyLead * P.foldDur);
        }
      }

      // rest to the end; the timeline is exactly 1 long
      tl.to({}, { duration: Math.max(0, 1 - tl.duration()) }, tl.duration());
    };

    // Fonts that arrive late and size changes re-measure; ScrollTrigger re-reads the function values
    // (invalidateOnRefresh), and the scrub restores the same progress, so nothing jumps.
    let fontWait = 0, sizeWait = 0;
    if (window.ScrollTrigger) ScrollTrigger.addEventListener('refreshInit', () => { if (isLive()) measure(); else fitStatic(); });
    if (document.fonts) {
      document.fonts.addEventListener('loadingdone', () => {
        clearTimeout(fontWait);
        fontWait = setTimeout(() => { if (isLive() && window.ScrollTrigger) ScrollTrigger.refresh(); else fitStatic(); }, 60);
      });
      document.fonts.ready.then(() => { if (!isLive()) fitStatic(); });
    }
    // the finished composition has no ScrollTrigger refresh to ride on, so it refits on resize itself
    window.addEventListener('resize', () => {
      clearTimeout(sizeWait);
      sizeWait = setTimeout(() => { if (!isLive()) fitStatic(); }, 200);
    });

    fitStatic();
    if (!window.Stage) return null;
    const scrub = o.scrub !== null ? o.scrub : (Stage.lenis ? true : 0.8);
    const start = () => Stage.scene(root, {
      hold: o.hold,
      scrub,
      build,
      phone: o.phone === 'same' ? { hold: o.phoneHold, build } : 'rest',
      rest: () => fitStatic(),
    });
    let mm = start();
    if (mm && window.matchMedia) {
      const motion = window.matchMedia('(prefers-reduced-motion: no-preference)');
      const small = window.matchMedia('(max-width: 767px)');
      const wide = window.matchMedia(WIDE);
      // Stage work-around: gsap.matchMedia calls back only when one of its conditions matches, and
      // reduced motion on a desktop matches neither, so the stage never marks the rest there. The CSS
      // default is already the finished composition; this only adds the class and fits the type.
      const orphan = () => {
        if (motion.matches || small.matches) return;
        root.classList.remove('is-live');
        root.classList.add('is-rest');
        root.style.removeProperty('--hold');
        fitStatic();
      };
      orphan();
      motion.addEventListener('change', () => setTimeout(orphan));
      small.addEventListener('change', () => setTimeout(orphan));
      // Stage work-around: the stage rebuilds only when its own conditions change, so a turn between
      // portrait and landscape over 767px starts the scene again here (after the stage's own handlers).
      let turnWait = 0;
      wide.addEventListener('change', () => {
        clearTimeout(turnWait);
        turnWait = setTimeout(() => {
          if (small.matches || !motion.matches || !mm) return;
          if (mm.kill) mm.kill(true); else mm.revert();
          mm = start();
          if (window.ScrollTrigger) ScrollTrigger.refresh();
        }, 120);
      });
    }
    return mm;
  };

  window.Scenes = window.Scenes || {};
  window.Scenes[ID] = make;
})();
