// tasteskill / replay.js — the product's window plays one short task when it scrolls into view.
//
// The best software sites make this their big moment (references/motion.md, "Product replay"): the product's
// own interface, at a readable size, does the one job the page promises in 3-5 beats, once, starting as a
// third of the window comes into view. The HTML is the final state, every pane filled: reduced motion, no
// script, the inspector and a screenshot that never scrolls see it as written. The script takes the window back
// to its first state only as it comes within half a screen of the view (it arms), and plays forward from there.
// Load it at the end of <body>, after base.js. Zero dependencies.
//
//   <figure class="replay" data-replay="900,1300,1100,1600" aria-hidden="true">   ms each beat lasts, 3-5 beats
//     <div data-ui> … the product panel, in its final state …
//       <input value="Invoice Acme for March" data-type-at="1">     typed in at beat 1 (40-60 ms a letter)
//       <li data-at="2">Acme · 4,200 €</li>                         appears at beat 2 (its slot is kept)
//       <button data-press-at="3">Send</button>                     the cursor goes here and presses at beat 3
//       <span data-at="4" data-from="Pending">Paid</span>           shows "Pending" until beat 4
//       <b data-roll-at="4" data-from="38">41</b>                   the figure rolls from 38 at beat 4
//       <tr data-select-at="4" class="is-selected">…</tr>           selected at beat 4 (style .is-selected)
//       <li data-flip-at="4" data-flip-from="#todo">…</li>          starts at the top of #todo, moves here at beat 4
//       <i data-style-at="2" data-style-from="left: 12%; height: 30%"></i>   a mark that travels to its place
//       <p data-says="2:Reading 412 entries|3:Checking the bank feed|4:Fixed: a duplicate refund">…</p>
//       <td data-frame-at="2">…</td>                                the accent frame stands here at beat 2
//     </div>
//     <span class="replay__cursor" data-replay-cursor aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M1 1l5 14 2-6 6-2z" fill="currentColor"/></svg></span>
//   </figure>
//   <p class="replay__said">One plain sentence of what happens, for everyone (screen readers included).</p>
//   <button type="button" class="button" data-replay-again>Replay</button>
//
// Several named cursors (teammates taking turns): give each cursor data-name="Ines" and each target
// data-cursor="Ines". Feature lines beside the window ([data-line-at="2"], buttons) turn full ink at their beat
// (.is-current) and, pressed, send the window back to that beat. Never a video, a GIF or screenshots.
(() => {
  if (!window.matchMedia || matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const all = (root, sel) => [...root.querySelectorAll(sel)];
  const at = (k) => (e, key) => +e.dataset[key] === k;
  const LEAD = 300; // ms from a third of the window in view to the first change (under 500)
  // every number in a text, so "1,240 rows" rolls to "3,912 rows" in the same format
  const NUM = /\d[\d,.\s]*\d|\d/g;
  const parse = (s) => +String(s).replace(/[,\s]/g, '');
  const format = (n, like) => {
    const dec = (like.split('.')[1] || '').replace(/\D/g, '').length;
    const fixed = n.toFixed(dec);
    return /,/.test(like) ? Number(fixed).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : fixed;
  };
  const rollTo = (el, from, to, ms) => {
    const a = (from.match(NUM) || []).map(parse);
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - p, 3);
      let i = 0;
      el.textContent = to.replace(NUM, (m) => { const s = a[i] ?? parse(m), v = s + (parse(m) - s) * e; i++; return format(v, m); });
      if (p < 1) el.__raf = requestAnimationFrame(step); else el.textContent = to;
    };
    cancelAnimationFrame(el.__raf); el.__raf = requestAnimationFrame(step);
  };
  // a field is typed into by its value; anything else (li, output, option and the rest also have a value) by its text
  const isField = (el) => el.matches('input, textarea');
  const typeIn = (el, text) => {
    const field = isField(el);
    let i = 0; clearTimeout(el.__type);
    const tick = () => { i++; if (field) el.value = text.slice(0, i); else el.textContent = text.slice(0, i); if (i < text.length) el.__type = setTimeout(tick, 40 + Math.random() * 20); };
    tick();
  };

  for (const root of document.querySelectorAll('[data-replay]')) {
    const beats = String(root.dataset.replay).split(',').map(Number).filter((n) => n > 0).slice(0, 5);
    if (!beats.length) continue;
    // its Replay button and feature lines: in the same section (or the figure's parent)
    const scope = root.closest('section, article, [data-replay-scope]') || root.parentElement || root;
    const els = {
      at: all(root, '[data-at]'), type: all(root, '[data-type-at]'), roll: all(root, '[data-roll-at]'),
      select: all(root, '[data-select-at]'), flip: all(root, '[data-flip-at]'), press: all(root, '[data-press-at], [data-point-at]'),
      style: all(root, '[data-style-at]'), says: all(root, '[data-says]'), frame: all(root, '[data-frame-at]'),
      lines: all(scope, '[data-line-at]'),
    };
    const cursors = all(root, '[data-replay-cursor]');
    const again = scope.querySelector('[data-replay-again]');
    // the final state, as written
    for (const e of els.at) if (e.dataset.from != null) e.__final = e.textContent;
    for (const e of els.type) e.__final = isField(e) ? e.value : e.textContent;
    for (const e of els.roll) e.__final = e.textContent;
    for (const e of els.style) e.__final = e.getAttribute('style') || '';
    for (const e of els.says) { e.__final = e.textContent; e.__says = e.dataset.says.split('|').map((x) => { const m = x.match(/^(\d+):(.*)$/); return m ? [+m[1], m[2]] : null; }).filter(Boolean); }
    for (const e of els.flip) { e.__home = [e.parentElement, e.nextElementSibling]; e.__from = root.querySelector(e.dataset.flipFrom); }
    const finalSel = new Set(els.select.filter((e) => e.classList.contains('is-selected')));

    // the state after beats 1..k (k = 0: the first state)
    const set = (k) => {
      for (const e of els.at) { e.classList.toggle('is-on', +e.dataset.at <= k); if (e.__final != null) e.textContent = +e.dataset.at <= k ? e.__final : e.dataset.from; }
      for (const e of els.select) e.classList.toggle('is-selected', +e.dataset.selectAt <= k && finalSel.has(e));
      for (const e of els.says) { const s = e.__says.filter(([n]) => n <= k).pop(); e.textContent = s ? s[1] : ''; e.style.visibility = s ? '' : 'hidden'; }
      for (const e of els.frame) e.classList.toggle('is-framed', +e.dataset.frameAt === k);
      for (const e of els.lines) e.classList.toggle('is-current', +e.dataset.lineAt === k);
      if (k === 0) {
        for (const e of els.type) { if (isField(e)) e.value = ''; else e.textContent = ''; }
        for (const e of els.roll) e.textContent = e.dataset.from ?? e.__final;
        for (const e of els.style) { e.style.transition = 'none'; e.setAttribute('style', `${e.__final};${e.dataset.styleFrom}`); e.style.transition = 'none'; }
        for (const e of els.flip) if (e.__from) e.__from.prepend(e);
        // the cursor waits low on the window, out of the way of what it will press
        for (const c of cursors) c.style.transform = `translate3d(${Math.round(root.clientWidth * 0.72)}px, ${Math.round(root.clientHeight * 0.82)}px, 0)`;
      }
    };
    const cursorFor = (e) => cursors.find((c) => c.dataset.name && c.dataset.name === e.dataset.cursor) || cursors[0];
    const aim = (c, e) => {
      const r = e.getBoundingClientRect(), o = root.getBoundingClientRect();
      c.style.transform = `translate3d(${Math.round(r.left - o.left + r.width / 2)}px, ${Math.round(r.top - o.top + r.height / 2)}px, 0)`;
    };
    // what moves at beat k
    const enter = (k) => {
      for (const e of els.press) {
        if (+e.dataset.pressAt !== k && +e.dataset.pointAt !== k) continue;
        const c = cursorFor(e); if (c) aim(c, e);
        if (+e.dataset.pressAt === k) setTimeout(() => { e.classList.add('is-pressed'); setTimeout(() => e.classList.remove('is-pressed'), 160); }, c ? 620 : 0);
      }
      for (const e of els.type) if (at(k)(e, 'typeAt')) typeIn(e, e.__final);
      for (const e of els.roll) if (at(k)(e, 'rollAt')) rollTo(e, e.dataset.from ?? e.__final, e.__final, 600);
      for (const e of els.style) if (at(k)(e, 'styleAt')) { e.style.transition = 'all 600ms cubic-bezier(0.76, 0, 0.24, 1)'; requestAnimationFrame(() => { e.setAttribute('style', e.__final); e.style.transition = 'all 600ms cubic-bezier(0.76, 0, 0.24, 1)'; }); }
      const moving = els.flip.filter((e) => at(k)(e, 'flipAt'));
      if (moving.length) {
        // FLIP: every item of the lists it leaves and joins is measured, moved, then played from where it was
        const lists = new Set(moving.flatMap((e) => [e.parentElement, e.__home[0]]));
        const items = [...lists].flatMap((l) => [...l.children]);
        const first = new Map(items.map((e) => [e, e.getBoundingClientRect()]));
        for (const e of moving) e.__home[0].insertBefore(e, e.__home[1] && e.__home[1].parentElement === e.__home[0] ? e.__home[1] : null);
        for (const e of items) {
          const a = first.get(e), b = e.getBoundingClientRect(); if (!a) continue;
          const dx = a.left - b.left, dy = a.top - b.top; if (!dx && !dy) continue;
          e.animate([{ transform: `translate(${dx}px, ${dy}px)${moving.includes(e) ? ' rotate(2deg)' : ''}` }, { transform: 'none' }], { duration: 450, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
        }
      }
      set(k);
    };

    // a clock that only runs while a third of the window is in view; beats wait, never skip
    const clock = { k: 0, left: LEAD, t: 0, timer: 0, on: false, done: false };
    const next = () => {
      clock.timer = 0;
      if (clock.k >= beats.length) { clock.done = true; root.classList.add('is-done'); return; }
      clock.k++; enter(clock.k);
      clock.left = beats[clock.k - 1]; play();
    };
    const play = () => { if (clock.done || clock.timer || !clock.on) return; clock.t = performance.now(); clock.timer = setTimeout(next, clock.left); };
    const pause = () => { if (!clock.timer) return; clearTimeout(clock.timer); clock.timer = 0; clock.left = Math.max(0, clock.left - (performance.now() - clock.t)); };
    // armed (taken back to its first state) only when it comes within half a screen of the view, so a page that is
    // never scrolled, a full-page capture included, shows the finished window
    let armed = false;
    const arm = () => { if (armed) return; armed = true; root.classList.add('is-armed'); set(0); };
    const restart = (k = 0) => { arm(); pause(); clock.done = false; root.classList.remove('is-done'); clock.k = 0; clock.left = LEAD; set(0); for (let i = 1; i <= k; i++) { clock.k = i; enter(i); } if (k) clock.left = beats[k - 1]; play(); };

    const near = new IntersectionObserver(([e]) => { if (e.isIntersecting) { arm(); near.disconnect(); } }, { rootMargin: '0px 0px 50% 0px' });
    near.observe(root);
    new IntersectionObserver(([e]) => { clock.on = e.intersectionRatio >= 0.33; if (clock.on) { arm(); play(); } else pause(); }, { threshold: [0, 0.33, 0.6] }).observe(root);
    if (again) again.addEventListener('click', () => restart(0));
    for (const l of els.lines) if (l.matches('button, a')) l.addEventListener('click', (ev) => { if (l.tagName === 'A') ev.preventDefault(); restart(+l.dataset.lineAt); pause(); clock.done = true; root.classList.add('is-done'); });
  }
})();
