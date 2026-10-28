// tasteskill / replay.js — the product's window does the page's one task, a beat at a time, as the visitor scrolls.
//
// The best software sites make this their big moment (references/motion.md, "Product replay"): the product's own
// interface, large, acts out what it does for the visitor, in 3-5 beats. Its section holds: the stage stays on
// screen while each beat takes about half a screen of scroll, so every beat is in view long enough to read, none
// plays while the window is half out of view, and scrolling back steps back. Each beat's change still runs at its
// own pace (typing, a roll, a card's move), so it reads as the product working, not as a scrubbed video.
// The HTML is the final state, every pane filled: reduced motion, no script, the inspector's page sheets and a
// screenshot that never scrolls see it as written. Under reduced motion nothing is held. Load it at the end of
// <body>, after base.js. Zero dependencies.
//
//   <section class="replay-hold" aria-labelledby="t">   the section: replay.js adds the room it holds for
//     <div class="replay-stage">                        everything the section shows, held while the beats play
//       <h2 id="t">Every order ships the day it lands</h2>
//       <figure class="replay" data-replay="900,1300,1100,1600" aria-hidden="true">   3-5 beats (ms each, used by Replay)
//         <div data-ui> … the product panel, in its final state …
//           <input value="Invoice Acme for March" data-type-at="1">     typed in at beat 1 (40-60 ms a letter)
//           <li data-at="2">Acme · 4,200 €</li>                         appears at beat 2 (its slot is kept)
//           <button data-press-at="3">Send</button>                     the cursor goes here and presses at beat 3
//           <span data-at="4" data-from="Pending">Paid</span>           shows "Pending" until beat 4
//           <b data-roll-at="4" data-from="38">41</b>                   the figure rolls from 38 at beat 4
//           <tr data-select-at="4" class="is-selected">…</tr>           selected at beat 4 (style .is-selected)
//           <li data-flip-at="4" data-flip-from="#todo">…</li>          starts at the top of #todo, moves here at beat 4
//           <i data-style-at="2" data-style-from="left: 12%; height: 30%"></i>   a mark that travels to its place
//           <p data-says="2:Reading 412 entries|3:Checking the bank feed|4:Fixed: a duplicate refund">…</p>
//           <td data-frame-at="2">…</td>                                the accent frame stands here at beat 2
//         </div>
//         <span class="replay__cursor" data-replay-cursor aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M1 1l5 14 2-6 6-2z" fill="currentColor"/></svg></span>
//       </figure>
//       <p class="replay__said">One plain sentence of what happens, for everyone (screen readers included).</p>
//       <button type="button" class="button" data-replay-again>Replay</button>
//     </div>
//   </section>
//
// The stage is the last thing in its section (or in a wrapper inside it, or on the section's grid) and fits one
// screen (the window 70% of the width or more on desktop, nearly the full width on a phone). Its parent must not clip
// (overflow: hidden or auto breaks the hold; overflow: clip keeps it). data-replay-step="0.5" on the figure sets the scroll each beat takes, in
// screens (0.4-0.8). The window shows its beat as data-beat (0 = the first state), which the inspector's scroll
// film reads. Several named cursors (teammates taking turns): give each cursor data-name="Ines" and each target
// data-cursor="Ines". Feature lines beside the window ([data-line-at="2"], buttons) turn full ink at their beat
// (.is-current) and, pressed, scroll to that beat. Replay plays the beats through once in place, on the clock the
// data-replay list gives, until the visitor scrolls again. Never a video, a GIF or screenshots.
(() => {
  if (!window.matchMedia || matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const all = (root, sel) => [...root.querySelectorAll(sel)];
  const at = (k) => (e, key) => +e.dataset[key] === k;
  // the hold exists only where the beats play: the stage sticks while the room added under it scrolls by
  if (!document.getElementById('replay-hold-css')) {
    const css = document.createElement('style'); css.id = 'replay-hold-css';
    // (the stage may sit in a wrapper or on a grid: the room spans the grid's full row and the stage keeps its height)
    css.textContent = '.replay-stage.is-held { position: sticky; top: var(--replay-top, 0px); z-index: 1; align-self: start; } .replay-hold__run { display: block; height: 0; pointer-events: none; grid-column: 1 / -1; align-self: start; }';
    document.head.appendChild(css);
  }
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
  const write = (el, text) => { if (isField(el)) el.value = text; else el.textContent = text; };
  const typeIn = (el, text) => {
    let i = 0; clearTimeout(el.__type);
    const tick = () => { i++; write(el, text.slice(0, i)); if (i < text.length) el.__type = setTimeout(tick, 40 + Math.random() * 20); };
    tick();
  };

  for (const root of document.querySelectorAll('[data-replay]')) {
    const list = String(root.dataset.replay).split(',').map(Number).filter((n) => n > 0);
    // data-replay="4" is four beats; data-replay="900,1300,1100,1600" is four beats and the clock Replay uses
    const beats = (list.length === 1 && list[0] <= 8 ? Array(list[0]).fill(1200) : list).slice(0, 5);
    if (!beats.length) continue;
    const n = beats.length;
    const stage = root.closest('.replay-stage');
    const hold = stage && stage.parentElement && stage.parentElement !== document.body ? stage.parentElement : null;
    // its Replay button and feature lines: in the same stage or section (or the figure's parent)
    const scope = stage || root.closest('section, article, [data-replay-scope]') || root.parentElement || root;
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

    // the parts that do not depend on how the state was reached, after beats 1..k (k = 0: the first state)
    const set = (k) => {
      for (const e of els.at) { e.classList.toggle('is-on', +e.dataset.at <= k); if (e.__final != null) e.textContent = +e.dataset.at <= k ? e.__final : e.dataset.from; }
      for (const e of els.select) e.classList.toggle('is-selected', +e.dataset.selectAt <= k && finalSel.has(e));
      // (a status line with nothing to say yet keeps its line, so the window does not change height)
      for (const e of els.says) { const s = e.__says.filter(([b]) => b <= k).pop(); e.textContent = s ? s[1] : '\u00a0'; e.style.visibility = s ? '' : 'hidden'; }
      for (const e of els.frame) e.classList.toggle('is-framed', +e.dataset.frameAt === k);
      for (const e of els.lines) e.classList.toggle('is-current', +e.dataset.lineAt === k);
    };
    // back to the first state, with nothing left running
    const reset = () => {
      for (const e of els.type) { clearTimeout(e.__type); write(e, ''); }
      for (const e of els.roll) { cancelAnimationFrame(e.__raf); e.textContent = e.dataset.from ?? e.__final; }
      for (const e of els.style) { e.style.transition = 'none'; e.setAttribute('style', `${e.__final};${e.dataset.styleFrom}`); e.style.transition = 'none'; }
      for (const e of els.flip) { for (const a of e.getAnimations()) a.cancel(); if (e.__from) e.__from.prepend(e); }
      // the cursor waits low on the window, out of the way of what it will press
      for (const c of cursors) place(c, `translate3d(${Math.round(root.clientWidth * 0.72)}px, ${Math.round(root.clientHeight * 0.82)}px, 0)`, true);
      set(0);
    };
    const place = (c, transform, now) => {
      if (now) { c.style.transition = 'none'; c.style.transform = transform; void c.offsetWidth; c.style.transition = ''; } else c.style.transform = transform;
    };
    const cursorFor = (e) => cursors.find((c) => c.dataset.name && c.dataset.name === e.dataset.cursor) || cursors[0];
    const aim = (c, e, now) => {
      const r = e.getBoundingClientRect(), o = root.getBoundingClientRect();
      place(c, `translate3d(${Math.round(r.left - o.left + r.width / 2)}px, ${Math.round(r.top - o.top + r.height / 2)}px, 0)`, now);
    };
    // what moves at beat k: played, or (now) set at once when the state is rebuilt
    const enter = (k, now) => {
      for (const e of els.press) {
        if (+e.dataset.pressAt !== k && +e.dataset.pointAt !== k) continue;
        const c = cursorFor(e); if (c) aim(c, e, now);
        if (!now && +e.dataset.pressAt === k) setTimeout(() => { e.classList.add('is-pressed'); setTimeout(() => e.classList.remove('is-pressed'), 160); }, c ? 620 : 0);
      }
      for (const e of els.type) if (at(k)(e, 'typeAt')) { if (now) { clearTimeout(e.__type); write(e, e.__final); } else typeIn(e, e.__final); }
      for (const e of els.roll) if (at(k)(e, 'rollAt')) { if (now) { cancelAnimationFrame(e.__raf); e.textContent = e.__final; } else rollTo(e, e.dataset.from ?? e.__final, e.__final, 600); }
      for (const e of els.style) if (at(k)(e, 'styleAt')) {
        if (now) { e.style.transition = 'none'; e.setAttribute('style', e.__final); e.style.transition = 'none'; }
        else { e.style.transition = 'all 600ms cubic-bezier(0.76, 0, 0.24, 1)'; requestAnimationFrame(() => { e.setAttribute('style', e.__final); e.style.transition = 'all 600ms cubic-bezier(0.76, 0, 0.24, 1)'; }); }
      }
      const moving = els.flip.filter((e) => at(k)(e, 'flipAt'));
      if (moving.length) {
        // FLIP: every item of the lists it leaves and joins is measured, moved, then played from where it was
        const lists = new Set(moving.flatMap((e) => [e.parentElement, e.__home[0]]));
        const items = [...lists].flatMap((l) => [...l.children]);
        const first = now ? null : new Map(items.map((e) => [e, e.getBoundingClientRect()]));
        for (const e of moving) e.__home[0].insertBefore(e, e.__home[1] && e.__home[1].parentElement === e.__home[0] ? e.__home[1] : null);
        if (first) for (const e of items) {
          const a = first.get(e), b = e.getBoundingClientRect(); if (!a) continue;
          const dx = a.left - b.left, dy = a.top - b.top; if (!dx && !dy) continue;
          e.animate([{ transform: `translate(${dx}px, ${dy}px)${moving.includes(e) ? ' rotate(2deg)' : ''}` }, { transform: 'none' }], { duration: 450, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
        }
      }
      set(k);
    };
    // the window at beat k: one step forward plays; anything else rebuilds the state and plays only a last step forward
    let cur = null;
    const show = (k, play = true) => {
      if (k === cur) return;
      if (play && cur != null && k === cur + 1) enter(k, false);
      else { reset(); for (let i = 1; i < k; i++) enter(i, true); if (k >= 1) enter(k, !(play && cur != null && k > cur)); }
      cur = k; root.dataset.beat = String(k); root.classList.toggle('is-done', k === n);
    };
    // armed (taken back to its first state) only as it comes within half a screen of the view, so a page that is
    // never scrolled, a full-page capture included, shows the finished window
    let armed = false;
    const arm = (k = 0) => { if (armed) return; armed = true; root.classList.add('is-armed'); show(k, false); };

    // the Replay button: the beats once through in place, on the clock, until the visitor scrolls to another beat
    const clock = { timer: 0, k: 0 };
    const stopClock = () => { clearTimeout(clock.timer); clock.timer = 0; };
    const runClock = (from = 0) => {
      stopClock(); arm(); show(from, false); clock.k = from;
      const next = () => { if (clock.k >= n) { clock.timer = 0; return; } clock.k++; show(clock.k); clock.timer = setTimeout(next, beats[clock.k - 1] || 1200); };
      clock.timer = setTimeout(next, 300);
    };

    if (hold) {
      // held: the visitor's scroll steps the beats. Beat k shows from (k - 0.8) steps into the hold, so the first
      // change comes just after the stage settles and the last state rests most of a step before it lets go.
      hold.classList.add('is-holding'); stage.classList.add('is-held');
      const run = document.createElement('div'); run.className = 'replay-hold__run'; run.setAttribute('aria-hidden', 'true');
      stage.after(run);
      const stepOf = () => Math.max(260, innerHeight * Math.min(0.8, Math.max(0.4, +(root.dataset.replayStep || 0.5))));
      let top = 0, step = stepOf();
      // measured on the final state and when the screen changes, never while it plays: a window that grows or
      // shrinks by a row keeps its top where it is
      const measure = () => {
        step = stepOf();
        const h = stage.offsetHeight;
        // centred while held; a stage taller than the screen holds with its foot on the screen's foot
        top = Math.round(h <= innerHeight ? (innerHeight - h) / 2 : innerHeight - h);
        stage.style.setProperty('--replay-top', top + 'px');
        run.style.height = Math.round(n * step) + 'px';
      };
      // how far the stage has been held: the room under it starts at its foot once it sticks
      const held = () => top + stage.offsetHeight - run.getBoundingClientRect().top;
      const beatAt = (s) => Math.max(0, Math.min(n, Math.floor(s / step + 0.8)));
      let shown = null, queued = false;
      const update = () => {
        queued = false; if (!armed) return;
        const k = beatAt(held());
        if (k === shown) return;
        shown = k; stopClock(); show(k);
      };
      const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
      measure();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!armed) measure(); });
      addEventListener('load', () => { if (!armed) measure(); });
      addEventListener('scroll', queue, { passive: true });
      let lastW = innerWidth, lastH = innerHeight;
      addEventListener('resize', () => { if (innerWidth === lastW && Math.abs(innerHeight - lastH) < 120) return; lastW = innerWidth; lastH = innerHeight; measure(); queue(); });
      new IntersectionObserver(([e]) => { if (e.isIntersecting && !armed) { shown = beatAt(held()); arm(shown); } }, { rootMargin: '0px 0px 50% 0px' }).observe(hold);
      if (again) again.addEventListener('click', () => { runClock(0); shown = beatAt(held()); });
      // a feature line takes the visitor to its beat
      for (const l of els.lines) if (l.matches('button, a')) l.addEventListener('click', (ev) => {
        if (l.tagName === 'A') ev.preventDefault();
        const from = scrollY - held(); // where the hold begins
        scrollTo({ top: Math.round(from + (+l.dataset.lineAt - 0.4) * step), behavior: 'smooth' });
      });
      continue;
    }

    // not held (no .replay-stage round it): it plays on the clock once a third of the window is in view, pauses off
    // screen. The inspector fails a replay without a held stage (replay-not-held); this keeps older pages working.
    let on = false, left = 300, t0 = 0, done = false;
    const tick = () => { clock.timer = 0; if (cur >= n) { done = true; return; } show(cur + 1); left = beats[cur - 1]; go(); };
    const go = () => { if (done || clock.timer || !on) return; t0 = performance.now(); clock.timer = setTimeout(tick, left); };
    const pause = () => { if (!clock.timer) return; stopClock(); left = Math.max(0, left - (performance.now() - t0)); };
    new IntersectionObserver(([e]) => { if (e.isIntersecting) arm(0); }, { rootMargin: '0px 0px 50% 0px' }).observe(root);
    new IntersectionObserver(([e]) => { on = e.intersectionRatio >= 0.33; if (on) { arm(0); go(); } else pause(); }, { threshold: [0, 0.33, 0.6] }).observe(root);
    if (again) again.addEventListener('click', () => { done = true; runClock(0); });
    for (const l of els.lines) if (l.matches('button, a')) l.addEventListener('click', (ev) => { if (l.tagName === 'A') ev.preventDefault(); done = true; stopClock(); arm(); show(+l.dataset.lineAt, false); });
  }
})();
