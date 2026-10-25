// tasteskill / scenes / object-through-giant-type.js — one cut-out object falls through a wall of giant type.
//
// A short quote or manifesto is set in huge capitals that fill the held stage. One cut-out object (a coin,
// a clock face, a stone, a watch head) falls down the wall: each line parts at its word gap and the halves
// open around the object in a bell-shaped wake, then close behind it; each line turns from a muted tone
// to full ink as the object reaches it, while the wall itself climbs. In the last line the object swells
// toward the camera and smashes the lines around it into letters that tumble out across the stage (two
// of them swell to giant size behind it) while it tips and drops out; then every letter flies home and
// the whole quote stands closed, in full ink, with its credit. Use it once per page, for a statement
// worth reading slowly, paired with one clean cut-out (or a photograph of a round thing, see below).
//
// DOM. One element per line, class ott-line (a <p> or a <span>; without any, each <p> of the quote is a
// line). A line holds two .ott-half spans with the real space between them, outside both spans, so copy
// and screen readers get the whole sentence. A line written without halves is parted by the script at the
// word gap nearest its middle; a single word of six letters or more at its middle letter; a shorter single
// word is never cut and steps aside whole as the object passes. Write the text in sentence case; the
// stylesheet sets it in capitals. No eyebrow above the quote: anything that introduces it goes into the
// credit.
//
//   <section class="scene ott" data-scene="object-through-giant-type" data-options='{}' aria-label="The quote">
//     <div class="scene-stage">
//       <blockquote class="ott-quote">
//         <p class="ott-line"><span class="ott-half">Twelve</span> <span class="ott-half">minutes</span></p>
//         …  3 to 7 lines make one wall (5 reads best). 8 to 12 lines become a travelling wall, taller
//            than the stage, that climbs through it and pulls back at the end to show the whole quote.
//            10-14 characters a line, 15 at most, with the gap near the middle: the more evenly a line
//            splits, the larger the type can be, because a parted line must still fit the stage. Halves
//            of two short words re-wrap into a tall wall on the phone; a long single word costs size there
//       </blockquote>
//       <div class="ott-object" aria-hidden="true">
//         <img class="ott-object__img" src="object.webp" width="640" height="640" alt="">
//         <img class="ott-object__back" src="back.webp" width="640" height="640" alt="">   flip mode, optional
//       </div>
//       <p class="ott-credit">Ingrid Holm, head roaster</p>                     optional, 5 words at most
//     </div>
//   </section>
//
// The object: a transparent WebP or PNG cropped close to the subject (its box is what lies over the type),
// a compact silhouette (aspect 0.7-1.4), clean alpha with no halo and no baked ground shadow, about twice
// its largest display size (the exit swells it to `grow`, so 900px or more for a sharp climax). Its
// width and height attributes set the box's proportions. It must stand apart from the ground and the ink
// by itself: the house style gives it no drop shadow. A part that sticks out (a handle, a strap) is safest
// pointing sideways. No cut-out at hand: a photograph of a round thing (a clock face, a coin, a record)
// works when the page makes the img square and round itself:
//   .ott-object img { aspect-ratio: 1; object-fit: cover; object-position: <x>% 50%; border-radius: 50%; }
// with width and height attributes equal, and the photo framed so the round thing fills its height.
// For the flip mode use a flat two-faced thing (a coin, a clock face, a badge: `edge` 'round'; a card or a
// label: 'flat'); the back face is the front again unless you give .ott-object__back. Colours and faces
// come from the page: --ground, --ink, --font-display, --font-text (fallbacks: warm paper, near black,
// inherit); --ott-stretch (desktop, default 100%) and --ott-stretch-phone (75%) set the width axis of a
// variable display face. Lines the object has not reached are the ink at the `rest` opacity (3:1 or
// better on the ground). The leading opens by itself only between two lines where a comma or an accent
// would touch the line above or below.
//
// Options (data-options JSON). Default, then range:
//   hold        3        screens the stage is held on desktop (2.5-4)
//   phoneHold   3.5      screens held under 768px (2.5-4.5)
//   phone       'same'   'same' runs the scene with phone numbers; 'rest' shows the poster frame
//   reflow      true     phone: the author's halves are re-wrapped into lines as wide as the phone allows,
//                        preferring the wrap that fills the screen with the largest type and cuts no word;
//                        false keeps the desktop lines
//   travel      'auto'   true / false forces the travelling wall; 'auto' uses it above 7 lines (8 on the
//                        phone) when fitting the whole block would shrink the type by more than 15%
//   scrub       auto     true when Lenis smooths the page, else 0.6 (seconds of catch-up)
//   mode        'tumble' 'tumble' turns the object in the picture plane; 'flip' spins it about its
//                        vertical axis like a coin: a face in every line, edge-on between lines
//   rim         ''       flip: colour of the object's edge seen edge-on (default a mid metal grey)
//   edge        'round'  flip: 'round' (coin, dial) or 'flat' (card) for the shape of that edge
//   thick       0.06     flip: thickness of the object as a share of its width (0.02-0.14)
//   size        1.45     object box as a multiple of the type size (1.1-1.8); phoneSize 1.9 (1.3-2.2)
//   push        1.4      how far the halves of the line the object sits in part, x the object radius
//                        (1.1-1.8); phonePush, the same on the phone (default: push)
//   radius      2.4      reach of the wake, x the object radius (1.8-3)
//   falloff     2.5      shape of the wake (1.5 = soft and wide, opens three lines; 4 = a tight slit)
//   lag         0.15     seconds the halves trail their place (0 = rigid, 0.35 = like water)
//   follow      0.4      how far the object leans toward each line's own word gap instead of falling
//                        dead straight (0-1); it keeps long halves on the stage when gaps sit off-centre
//   enter       'above'  'above': the object starts just above the wall and drops into line 1 by 8%, so the
//                        first frame is the whole quote, closed; 'inside': it starts in line 1 (the spec's
//                        first frame; that line must then fit the margins parted, which costs type size)
//   tilt        [-9, 15] object rotation in degrees at the first and at the last line; 17 more on the exit
//   exit        'break'  'break': the swelling object smashes the last lines into tumbling letters that
//                        fly home once it has gone; 'fall': it only swells, tips and drops out while the
//                        wall opens around it (never past the stage edge) and closes behind it
//   shatter     3        break: how many lines, counted up from the last, break into letters (1-6); the
//                        throw weakens line by line away from the object. Two lines in five always stay
//                        whole (a 3-line quote breaks only its last line), so the quote is never all letters
//   giants      2        break: letters of the last line that swell to half the stage height behind the
//                        object (0-3)
//   seed        7        break: the throw is seeded, so scrubbing back and forth shows the same picture;
//                        another number deals another throw
//   grow        2.4      scale the object swells to as it leaves (1.2-2.8)
//   tip         45       degrees it tips toward the camera as it drops (0-70)
//   drift       0.07     the wall climbs 2 x drift x stage height over the hold (0-0.12); phoneDrift 0.09
//   rest        0.5      opacity of the lines the object has not reached yet (0.42-0.7)
//   fill        0.86     widest closed line as a share of the stage width (0.7-0.92); phoneFill 0.88
//
// Type size: min(11.1vw, 17.8vh) on desktop and 20vw on the phone, then smaller if needed so the widest
// closed line fills `fill` of the width at most, the block (or six lines of a travelling wall) fits the
// height clear of the credit, and parted lines stay on the stage: inside the page margins in the first
// frame, inside half a margin for the line the object sits in (the one being read), and past the stage
// edge by 5% of the width at most (24px on the phone) for a line only partly open. The object box is
// `size` times that. The phone re-wraps the author's halves and keeps the wrap that fills the screen
// best at the largest size without cutting a word (the author's own lines win a near tie).
//
// Progress map (desktop, 5 lines): 0% the object hangs just above the wall, face on, every line closed and
// muted, line 1 starting to part under it; 8% it has dropped into line 1, which is parted and in ink;
// it meets one line every 13% (line 2 at 21%, line 3 at 34%, line 4 at 47%), a face (flip) in each,
// edge-on between, the halves parting before it and closing behind it, the wall climbing; 60% it sits
// in the last line. Exit 'break': 60-62% it swells and the last three lines burst into letters, nearest
// first, thrown out and up, tumbling in depth, many past the stage edges, two swelling to giant size low
// behind it; 62-74% it tips, falls and leaves; 70-79% every letter flies home (power3.inOut) and the
// lines close; 75-85% the credit comes in; 79-100% the closed quote is held in ink. Exit 'fall': the
// object swells (1.9x by 65%) while the last lines open wide, then drops out by 74%; credit 74-84%.
// The phone: the same with phone lines and a longer hold. A travelling wall: the object falls through
// the middle third of the stage while the taller wall climbs past it, lines fading as the stage edge cuts
// into them; 74-84% the wall pulls back (scales down) until the whole quote fits, centred, and holds.
// Reduced motion, a failed CDN and phone 'rest': one poster frame, the object resting in the middle
// line that parts at a word gap, the wake around it held still, every line in ink. No script: the object
// above the closed quote.
(() => {
  const ID = 'object-through-giant-type';
  const TRAVEL = 0.6;   // the object meets the last line here
  const EXIT = 0.14;    // and has left the stage this much later
  const ENTER = 0.08;   // from just above the wall into line 1 (or held in line 1)
  const BREAK = 0.603;  // the first letters leave here (exit 'break')
  const HOME = 0.79;    // and every letter is back in its place here
  const FIT0 = 0.74, FIT1 = 0.84;   // a travelling wall pulls back to show the whole quote
  const ASIDE = 1.15;   // a word that steps aside stops this many object radii from the object's centre
  const WALL = 7, PHONE_WALL = 8;   // more lines than this travel through the stage
  const TIP = -1;       // rotationX sign that tips the object's top edge toward the viewer
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const num = (v, d, a, b) => (typeof v === 'number' && isFinite(v) ? clamp(v, a, b) : d);
  const pair = (v, d, a, b) => (Array.isArray(v) && v.length === 2 && v.every((x) => typeof x === 'number' && isFinite(x)) ? [clamp(v[0], a, b), clamp(v[1], a, b)] : d);
  const smooth = (t) => t * t * (3 - 2 * t);
  const out3 = (t) => 1 - Math.pow(1 - t, 3);
  const inOut3 = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();
  const letters = (s) => s.replace(/[^\p{L}\p{N}]/gu, '').length;
  // seeded random numbers (mulberry32): the same throw every time the scene is scrubbed
  const seeded = (seed) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const settings = (o) => {
    const push = num(o.push, 1.4, 1.1, 1.8);
    return {
      hold: num(o.hold, 3, 2.5, 4),
      phoneHold: num(o.phoneHold, 3.5, 2.5, 4.5),
      phone: o.phone === 'rest' ? 'rest' : 'same',
      reflow: o.reflow !== false,
      travel: typeof o.travel === 'boolean' ? o.travel : 'auto',
      scrub: typeof o.scrub === 'boolean' || typeof o.scrub === 'number' ? o.scrub : null,
      mode: o.mode === 'flip' ? 'flip' : 'tumble',
      rim: typeof o.rim === 'string' && o.rim ? o.rim : '',
      edge: o.edge === 'flat' ? 'flat' : 'round',
      thick: num(o.thick, 0.06, 0.02, 0.14),
      size: num(o.size, 1.45, 1.1, 1.8),
      phoneSize: num(o.phoneSize, 1.9, 1.3, 2.2),
      push,
      phonePush: num(o.phonePush, push, 1.1, 1.8),
      radius: num(o.radius, 2.4, 1.8, 3),
      falloff: num(o.falloff, 2.5, 1.5, 4),
      lag: num(o.lag, 0.15, 0, 0.35),
      follow: num(o.follow, 0.4, 0, 1),
      enter: o.enter === 'inside' ? 'inside' : 'above',
      tilt: pair(o.tilt, [-9, 15], -45, 45),
      exit: o.exit === 'fall' ? 'fall' : 'break',
      shatter: Math.round(num(o.shatter, 3, 1, 6)),
      giants: Math.round(num(o.giants, 2, 0, 3)),
      seed: Math.round(num(o.seed, 7, 0, 2147483647)),
      grow: num(o.grow, 2.4, 1.2, 2.8),
      tip: num(o.tip, 45, 0, 70),
      drift: num(o.drift, 0.07, 0, 0.12),
      phoneDrift: num(o.phoneDrift, 0.09, 0, 0.12),
      rest: num(o.rest, 0.5, 0.42, 0.7),
      fill: num(o.fill, 0.86, 0.7, 0.92),
      phoneFill: num(o.phoneFill, 0.88, 0.7, 0.92),
    };
  };

  // Where a line parts: the word gap nearest its middle; one word of six letters or more parts at the
  // letter nearest its middle (three letters a side at least); a shorter word is never cut, it steps
  // aside whole as the object passes.
  const split = (text) => {
    const t = norm(text);
    const gaps = [];
    for (let i = 0; i < t.length; i++) if (t[i] === ' ') gaps.push(i);
    if (gaps.length) {
      const mid = t.length / 2;
      let at = gaps[0];
      for (const g of gaps) if (Math.abs(g + 0.5 - mid) < Math.abs(at + 0.5 - mid)) at = g;
      return { a: t.slice(0, at), b: t.slice(at + 1), sep: ' ' };
    }
    const ch = [...t];
    if (letters(t) < 6) return { a: t, b: '', sep: '' };
    const at = clamp(Math.round(ch.length / 2), 3, ch.length - 3);
    return { a: ch.slice(0, at).join(''), b: ch.slice(at).join(''), sep: '' };
  };

  // The lines as written: the .ott-line elements (spans or paragraphs), or else each <p> of the quote;
  // the author's halves where a line has two, else the script's split.
  const readLine = (p) => {
    const h = [...p.children].filter((c) => c.classList.contains('ott-half'));
    if (h.length >= 2) {
      const nodes = [...p.childNodes];
      const between = nodes.slice(nodes.indexOf(h[0]) + 1, nodes.indexOf(h[1])).map((n) => n.textContent).join('');
      return { a: norm(h[0].textContent), b: norm(h.slice(1).map((x) => x.textContent).join(' ')), sep: /\s/.test(between) ? ' ' : '' };
    }
    return split(p.textContent);
  };
  const read = (quote) => {
    const found = quote.querySelectorAll('.ott-line');
    return [...(found.length ? found : quote.querySelectorAll('p'))].map(readLine).filter((l) => l.a || l.b);
  };

  // Glyph extents of the display face as shares of its size (accents above the capitals, commas and
  // tails below the baseline). Not cached across measures: a face that loads late is measured again.
  const pen = document.createElement('canvas').getContext('2d');
  const face = (el) => {
    const cs = getComputedStyle(el);
    const font = `${cs.fontStyle} ${cs.fontWeight} 100px ${cs.fontFamily}`;
    const seen = new Map();
    const glyph = (ch) => {
      if (!seen.has(ch)) {
        let m = { asc: 0.7, desc: 0 };
        try { pen.font = font; const t = pen.measureText(ch); m = { asc: t.actualBoundingBoxAscent / 100, desc: Math.max(0, t.actualBoundingBoxDescent / 100) }; } catch {}
        seen.set(ch, m);
      }
      return seen.get(ch);
    };
    const cap = glyph('H').asc;
    return { cap: cap > 0.3 && cap < 1 ? cap : 0.7, glyph };
  };

  const make = (root, opts = {}) => {
    const o = settings(opts || {});
    const stage = root.querySelector(':scope > .scene-stage') || root.firstElementChild;
    const quote = root.querySelector('.ott-quote');
    const obj = root.querySelector('.ott-object');
    if (!stage || !quote || !obj) return null;
    const note = root.querySelector('.ott-note');
    const credit = root.querySelector('.ott-credit');
    const front = obj.querySelector('.ott-object__img') || obj.querySelector('img');
    const model = read(quote);
    if (!model.length) return null;
    const plain = model.map((l) => l.a + l.sep + l.b).join(' ');

    root.dataset.mode = o.mode;
    let rimBar = null;
    if (o.mode === 'flip' && front) {
      front.classList.add('ott-object__img');
      if (!obj.querySelector('.ott-object__back')) {
        const back = front.cloneNode();
        back.className = 'ott-object__back';
        obj.append(back);
      }
      // the thickness: a few discs (or plates) of the edge colour stacked between the two faces, and a bar
      // across the middle for the moment it is exactly edge-on
      if (!obj.querySelector('.ott-object__disc')) {
        for (let j = 0; j < 5; j++) {
          const d = document.createElement('i');
          d.className = 'ott-object__disc';
          d.style.setProperty('--z', ((j - 2) * 0.4).toFixed(2));
          obj.append(d);
        }
      }
      rimBar = obj.querySelector('.ott-object__rim') || obj.appendChild(Object.assign(document.createElement('i'), { className: 'ott-object__rim' }));
      root.dataset.edge = o.edge;
      if (o.rim) root.style.setProperty('--ott-rim', o.rim);
      root.style.setProperty('--ott-thick', String(o.thick));
    }
    // the picture's proportions inside the object's square box (for the faces and the edge): the width and
    // height attributes when given (a photo cropped square by the page keeps a square box), else the file's
    const aspect = () => {
      const w = (front && (+front.getAttribute('width') || front.naturalWidth)) || 1;
      const h = (front && (+front.getAttribute('height') || front.naturalHeight)) || 1;
      root.style.setProperty('--ott-pwk', (w >= h ? 1 : w / h).toFixed(4));
      root.style.setProperty('--ott-phk', (w >= h ? h / w : 1).toFixed(4));
    };
    aspect();
    // decode before anything moves
    for (const img of obj.querySelectorAll('img')) if (img.decode) img.decode().then(aspect).catch(() => {});

    // how many lines break (exit 'break'): `shatter`, but two lines in five stay whole and readable
    // through the break, so a short quote never turns entirely into flying letters
    const shatterOf = (n) => clamp(Math.min(o.shatter, n - Math.max(1, Math.ceil(0.4 * n))), 1, n);

    const S = { live: false, posed: false, phone: false, key: '', geo: null, fonts: 0, ver: 0, putVer: -1, tl: null, lines: [], A: [], B: [], side: [], cut: [], L: [], on: [], put: null, setX: null, x: [], op: [], rimOp: NaN };

    // A half's letters, one span each, laid over the half's own text and shown only while the line is
    // broken (exit 'break'); hidden from screen readers and from copying, so the sentence is said once.
    const letterBox = (half, i) => {
      const box = document.createElement('span');
      box.className = 'ott-chs';
      box.setAttribute('aria-hidden', 'true');
      const text = half.textContent;
      let off = 0;
      for (const ch of text) {
        if (!/\s/.test(ch)) {
          const el = document.createElement('span');
          el.className = 'ott-ch';
          el.textContent = ch;
          box.append(el);
          S.L.push({ el, i, half, off, len: ch.length, ch, tr: '' });
        }
        off += ch.length;
      }
      half.append(box);
    };

    // Build the lines (once per set of lines): each a <p> with its two halves and the real space between.
    const render = (lines) => {
      const sig = JSON.stringify(lines);
      if (quote.dataset.sig !== sig) {
        quote.textContent = '';
        S.L = [];
        const cut = lines.some((l) => l.b && !l.sep);
        const breaking = o.exit === 'break' ? shatterOf(lines.length) : 0;
        lines.forEach((l, i) => {
          const p = document.createElement('p');
          p.className = 'ott-line';
          // at tight leading a line's glyph box reaches into the next line's: earlier lines stack on top, so
          // what lies over the foot of a line is its own ink, never the next line's empty glyph box
          p.style.zIndex = String(lines.length - i);
          const a = document.createElement('span');
          a.className = 'ott-half ott-half--a';
          a.textContent = l.a;
          p.append(a);
          let b = null;
          if (l.b) {
            b = document.createElement('span');
            b.className = 'ott-half ott-half--b';
            b.textContent = l.b;
            p.append(document.createTextNode(l.sep), b);
          }
          // words cut in two read badly aloud: the lines are hidden and the sentence is given whole
          if (cut) p.setAttribute('aria-hidden', 'true');
          quote.append(p);
          if (i >= lines.length - breaking) { letterBox(a, i); if (b) letterBox(b, i); }
        });
        if (cut) {
          const sr = document.createElement('span');
          sr.className = 'ott-sr';
          sr.textContent = plain;
          quote.append(sr);
        }
        quote.dataset.sig = sig;
        S.ver++;
      }
      S.lines = [...quote.querySelectorAll(':scope > .ott-line')];
      S.A = S.lines.map((p) => p.querySelector('.ott-half--a'));
      S.B = S.lines.map((p) => p.querySelector('.ott-half--b'));
      S.cut = lines.map((l) => !!(l.b && !l.sep));
      S.on = S.lines.map(() => false);
      // a line of one short word steps aside whole; consecutive ones go to opposite sides
      let turn = 0;
      S.side = S.B.map((b) => (b ? 0 : (turn++ % 2 ? 1 : -1)));
    };

    // Everything the script moved goes back to the stylesheet's place.
    const clear = () => {
      const els = [quote, obj, credit, rimBar, ...S.lines, ...S.A, ...S.B].filter(Boolean);
      if (window.gsap) gsap.set(els, { clearProps: 'transform,opacity,visibility' });
      else for (const el of els) { el.style.transform = ''; el.style.opacity = ''; el.style.visibility = ''; }
      for (const L of S.L) { L.el.style.transform = ''; L.tr = ''; }
      for (const l of S.lines) l.classList.remove('is-broken');
      S.on = S.lines.map(() => false);
    };

    // Phone lines: the author's phrases packed into lines as wide as the phone allows. Each wrap is set at
    // the largest size its lines fit the width, the height and (parted) the stage at; a wrap scores by
    // that size and by how much of the screen's height its wall fills, and wraps that would cut a word or
    // strand a short one are penalised, so two words share a line wherever they fit.
    const phoneLines = (W, room, lh, cap, fill, settle, k, above) => {
      // the author's phrases (the halves), each marked when it starts one of the author's lines
      const units = model.flatMap((l) => (l.b && l.sep ? [{ ws: l.a.split(' '), start: true }, { ws: l.b.split(' ') }] : [{ ws: (l.a + l.sep + l.b).split(' '), start: true }]));
      const probe = document.createElement('p');
      probe.className = 'ott-line';
      probe.style.cssText = 'position:absolute;left:0;top:0;visibility:hidden;white-space:nowrap;margin:0';
      const spans = [];
      units.forEach((u) => u.ws.forEach((w) => {
        if (spans.length) probe.append(' ');
        const s = document.createElement('span');
        s.className = 'ott-half';
        s.textContent = w;
        probe.append(s);
        spans.push(s);
      }));
      quote.append(probe);
      const rs = spans.map((s) => s.getBoundingClientRect());
      probe.remove();
      const sp = rs.length > 1 ? rs.slice(1).reduce((a, r, j) => a + (r.left - rs[j].right), 0) / (rs.length - 1) / 100 : 0.25;
      let q = 0;
      for (const u of units) { u.w = u.ws.map(() => rs[q++].width / 100); u.width = u.w.reduce((a, b) => a + b, 0) + sp * (u.ws.length - 1); }
      // greedy, either across the author's line breaks or keeping them (then only splitting a line)
      const pack = (max, keep) => {
        const out = [];
        let cur = [], cw = 0;
        const add = (t, w) => {
          if (cur.length && cw + sp + w > max) { out.push(cur.join(' ')); cur = []; cw = 0; }
          cw = cur.length ? cw + sp + w : w;
          cur.push(t);
        };
        for (const u of units) {
          if (keep && u.start && cur.length) { out.push(cur.join(' ')); cur = []; cw = 0; }
          if (u.width <= max) add(u.ws.join(' '), u.width);
          else for (let j = 0; j < u.ws.length; j++) { if (u.w[j] > max) return null; add(u.ws[j], u.w[j]); }
        }
        if (cur.length) out.push(cur.join(' '));
        return out;
      };
      // a wrap's closed lines in type sizes, for partLimit
      const wordW = new Map();
      units.forEach((u) => u.ws.forEach((w, j) => wordW.set(w, u.w[j])));
      const widthOf = (t) => t.split(' ').reduce((a, w, j) => a + (j ? sp : 0) + (wordW.get(w) || 0.6 * w.length), 0);
      const parted = new Map();
      const partOf = (lines) => {
        const key = lines.join('|');
        if (!parted.has(key)) {
          let turn = 0;
          const side = [];
          const ref = lines.map((t) => {
            const s = split(t);
            const whole = widthOf(t);
            const aw = s.b && !s.sep ? (whole * [...s.a].length) / [...t].length : widthOf(s.a);
            const gap = s.b && s.sep ? sp : 0;
            const lw = s.b ? (s.sep ? aw + gap + widthOf(s.b) : whole) : aw;
            side.push(s.b ? 0 : (turn++ % 2 ? 1 : -1));
            return { le: -lw / 2, re: lw / 2, sp: s.b ? -lw / 2 + aw + gap / 2 : 0, aw };
          });
          parted.set(key, partLimit(ref, lines.map((_, i) => i * lh), lh, side, k, W, true, above));
        }
        return parted.get(key);
      };
      // every wrap from the narrowest (a word or two a line) to the widest, each set at the largest size
      // its widest line, its parted lines and the height allow
      let best = null;
      const seen = new Set();
      for (let m = 1.2; m <= (fill * W) / Math.max(16, 0.08 * W); m += 0.05) for (const keep of [true, false]) {
        const lines = pack(m, keep);
        if (!lines) continue;
        const sig = lines.join('|');
        if (seen.has(sig)) continue;
        seen.add(sig);
        const n = lines.length;
        const Fw = Math.min(0.2 * W, (fill * W) / Math.max(...lines.map(widthOf)));
        const { F: Fe, travel } = settle(Math.min(Fw, partOf(lines)), n, (n - 1) * lh + cap, room, lh, cap);
        const cuts = lines.filter((t) => !t.includes(' ') && letters(t) >= 6).length;
        const lone = lines.filter((t) => !t.includes(' ') && letters(t) < 6).length;
        // how much of the room the wall fills: a band across the middle third scores less than a wall
        // that stands from top to bottom at nearly the same size
        const cover = clamp((((n - 1) * lh + cap) * Fe) / (0.72 * room), 0, 1);
        // the author's own lines win a near tie, so the phone keeps the desktop's phrasing when it can
        const own = lines.length === model.length && lines.every((t, i) => t === norm(model[i].a + model[i].sep + model[i].b));
        const score = Fe * (0.4 + 0.6 * cover) * (1 - 0.3 * cuts - 0.06 * lone) * (travel ? 0.85 : 1) * (own ? 1.04 : 1);
        if (!best || score > best.score + 1e-6) best = { score, lines };
      }
      return best ? best.lines.map(split) : model;
    };

    // The largest type size at which parted lines stay on the stage, sampled over the whole fall (all in
    // type sizes, so it holds at any size): lines open in the first frame stay inside the page margins; a
    // line the object sits in, the one being read, stays inside half a margin; a line only partly open
    // may pass the stage edge by `allow` (5% of the width, 24px on the phone). A word that steps aside
    // fits on one side of the object.
    const partLimit = (ref, cyE, Pm, side, k, W, phone, above) => {
      const n = ref.length, r1 = k / 2, R = o.radius * r1;
      const gut = Math.max(16, 0.04 * W), allow = phone ? 24 : 0.05 * W;
      const gE = { cx: 0, r: r1, P: Pm, n, cy: cyE, sp: ref.map((r) => r.sp), aw: ref.map((r) => r.aw), side, push: phone ? o.phonePush : o.push };
      gE.fx = ref.map((r, i) => (side[i] ? 0 : o.follow * r.sp));
      let F = Infinity;
      ref.forEach((r, i) => { if (side[i]) F = Math.min(F, (W / 2 - gut) / (r.aw + ASIDE * r1 + 0.1)); });
      const yS = cyE[0] - above, steps = 6 * n;
      for (let j = 0; j <= steps; j++) {
        const yb = yS + ((cyE[n - 1] - yS) * j) / steps;
        const xo = leanAt(gE, yb);
        for (let i = 0; i < n; i++) {
          if (side[i]) continue;
          const [xa, xb] = wakeAt(gE, yb, 1, xo, i);
          const ext = Math.max(-(ref[i].le + xa), ref[i].re + xb);
          const d = yb - cyE[i], f = d * d < R * R ? Math.pow(1 - (d * d) / (R * R), o.falloff) : 0;
          const lim = j === 0 ? W / 2 - gut : W / 2 + allow * (1 - f) - (gut / 2) * f;
          if (ext > 0) F = Math.min(F, lim / ext);
        }
      }
      return F;
    };

    // The wake of line i: where its halves sit and how much ink it has, a pure function of where the
    // object is in the wall (yb: its centre in the wall's own coordinates), its scale s and its x offset
    // xo. Scrubbing back is exact, and the poster frame is the same picture held still. g may be in px or
    // in type sizes (em); gut, the page margin, only in px (and with it the stage edges are known).
    const wakeAt = (g, yb, s, xo, i, gut) => {
      // as the object swells the halves part with it, but the wake's reach grows only half as fast, so the
      // lines slam shut right behind it as it drops
      const r = g.r * s, R = o.radius * g.r * (1 + (s - 1) / 2), R2 = R * R;
      const d = yb - g.cy[i];
      const f = d * d < R2 ? Math.pow(1 - (d * d) / R2, o.falloff) : 0;
      let xa = 0, xb = 0;
      const ox = g.cx + xo;
      if (g.side[i]) {
        // a short word steps aside whole, never past the page margin
        const c = g.sp[i], half = g.aw[i] / 2;
        let want = g.side[i] < 0 ? Math.min(0, ox - ASIDE * r - (c + half)) : Math.max(0, ox + ASIDE * r - (c - half));
        if (gut != null) want = g.side[i] < 0 ? Math.max(want, gut - (c - half)) : Math.min(want, g.W - gut - (c + half));
        xa = want * smooth(clamp(f / 0.5, 0, 1));
      } else {
        // the bias moves the gap onto the object even when the word gap is not where the object falls
        // (eagerly: a gap is centred on the object before the line is fully open, so a round object that
        // swings toward the next line's gap never clips the letters of the line it is leaving)
        const bias = (ox - g.sp[i]) * smooth(clamp(f / 0.55, 0, 1)), p = g.push * r * (1 + 0.5 * (s - 1)) * f;
        xa = bias - p;
        xb = bias + p;
        // as the object swells on its way out the halves are thrown wider, but never past the stage edge,
        // so no word is left standing half cut: each half stops half a margin inside it (or where it
        // already was at full size, if that was further out)
        if (s > 1 && gut != null && g.le) {
          const p1 = g.push * g.r * Math.pow(Math.max(0, 1 - (d * d) / Math.pow(o.radius * g.r, 2)), o.falloff);
          xa = Math.max(xa, Math.min(bias - p1, gut / 2 - g.le[i]));
          xb = Math.min(xb, Math.max(bias + p1, g.W - gut / 2 - g.re[i]));
        }
      }
      // ink: from half a line above the line to its centre, and it stays
      const ink = smooth(clamp(1 + d / (0.5 * g.P), 0, 1));
      return [xa, xb, ink];
    };
    // The object's x offset at depth yb: it leans toward each line's own gap (by `follow`) and eases from
    // one to the next between lines, so it moves straight down at every line it sits in.
    const leanAt = (g, yb) => {
      const n = g.n;
      if (!o.follow) return 0;
      if (yb <= g.cy[0] || n < 2) return g.fx[0];
      if (yb >= g.cy[n - 1]) return g.fx[n - 1];
      let i = 0;
      while (i < n - 2 && yb > g.cy[i + 1]) i++;
      const t = (yb - g.cy[i]) / (g.cy[i + 1] - g.cy[i] || 1);
      return g.fx[i] + (g.fx[i + 1] - g.fx[i]) * (1 - Math.cos(Math.PI * t)) / 2;
    };

    // The throw (exit 'break'): for every letter of the breaking lines, where it flies, how it turns and
    // when, all dealt from the seed and the measured geometry, so the frame at any progress is fixed.
    const throwOf = (g, Lm, cap) => {
      const { W, H, n, cx, cy, F } = g;
      const rand = seeded(o.seed);
      const N = shatterOf(n);
      const M = Math.max(W, H);
      const ox = cx + g.fx[n - 1], oy = cy[n - 1] + g.byA;   // the object's centre as it breaks the wall
      // the giants: one of the two widest letters of each half of the last line, each swelling on its
      // own half's side of the stage
      const halves = [S.A[n - 1], S.B[n - 1]].filter(Boolean);
      const giants = new Map();
      for (let k = 0; k < o.giants; k++) {
        const h = halves[k % halves.length];
        const cand = S.L.map((L, j) => j).filter((j) => S.L[j].half === h && /\p{L}/u.test(S.L[j].ch) && !giants.has(j));
        cand.sort((a, b) => Lm[b].w - Lm[a].w || a - b);
        if (!cand.length) continue;
        giants.set(cand[Math.floor(rand() * Math.min(2, cand.length))], h === S.B[n - 1] ? 1 : -1);
      }
      // nothing thrown crosses the lines that stay whole: every letter's path and every giant stays below
      // the lowest of them (a line being read is never covered)
      const whole = n - 1 - N;
      const floor = whole >= 0 ? cy[whole] + g.byA + (cap * F) / 2 + 0.3 * F : 0;
      return S.L.map((L, j) => {
        const u = Array.from({ length: 9 }, rand);
        const lx = Lm[j].x, ly = cy[L.i] + g.byA;
        const vx = lx - ox, vy = ly - oy, d0 = Math.hypot(vx, vy);
        const k = n - 1 - L.i, e = Math.pow(Math.max(0, 1 - (k / N) * (k / N)), 1.5);
        if (giants.has(j)) {
          // swelling low on its own side, cut by the stage's bottom edge, behind the object; the first
          // one large, the next one smaller and higher, so the two never read as a pair of initials
          const side = giants.get(j), first = giants.size < 2 || side < 0;
          let capT = (first ? 0.42 + 0.08 * u[0] : 0.27 + 0.06 * u[0]) * Math.min(H, 1.3 * W);
          capT = Math.min(capT, (H - floor) / (first ? 0.8 : 1.1));
          const tx = W / 2 + side * (first ? 0.2 + 0.06 * u[1] : 0.25 + 0.06 * u[1]) * W;
          const ty = first ? H - 0.3 * capT : H - 0.62 * capT;
          return {
            pin: true, dx: tx - lx, dy: ty - ly, rot: side * (first ? 4 + 6 * u[2] : 10 + 8 * u[2]), rx: 0, ry: -side * (12 + 14 * u[3]),
            sc: capT / (cap * F), t0: BREAK + (first ? 0.004 : 0.012), t1: BREAK + (first ? 0.09 : 0.085), b0: first ? 0.7 : 0.694, b1: HOME, persp: 4 * M,
          };
        }
        // thrown out to its own side, fanning up and down, harder the nearer the object; a letter that
        // would rise into the whole lines above is sent down instead
        const dirX = (vx < 0 ? -1 : 1) * (0.7 + 0.3 * u[0]);
        const dirY = (u[5] - 0.42) * 0.95 + 0.25 * clamp(vy / (2 * g.P), -1, 0);
        const reach = e * (0.2 + 0.5 * u[1]) * W;
        const sc = 0.6 + 1.3 * u[2] * e + (1 - e) * 0.4;
        let dy = dirY * reach;
        const lim = floor + 0.45 * F * sc;
        if (ly + dy < lim) dy = Math.max(lim - ly, Math.abs(dy) * 0.6);
        const t0 = BREAK + 0.02 * Math.min(1, d0 / (0.5 * W)) + 0.004 * u[2];
        const t1 = t0 + 0.065 + 0.025 * u[3];
        const b0 = Math.max(t1 + 0.004, 0.695 + 0.02 * u[4]);
        return {
          pin: false,
          dx: dirX * reach,
          dy,
          rot: (u[6] * 2 - 1) * 200 * Math.sqrt(e),
          rx: (u[7] * 2 - 1) * 140 * e,
          ry: (u[8] * 2 - 1) * 320 * e,
          sc,
          t0, t1, b0, b1: Math.min(HOME, b0 + 0.065 + 0.01 * u[4]),
          persp: Math.max(500, 6 * F),
        };
      });
    };
    // how far along its throw a letter is at progress p: out (power3.out), drifting on, home (power3.inOut);
    // and how much of its swell it keeps (a giant shrinks back sooner than it travels, so two giants
    // flying home never stack into one blot)
    const thrown = (f, p) => {
      if (p <= f.t0 || p >= f.b1) return [0, 0];
      if (p < f.t1) { const a = out3((p - f.t0) / (f.t1 - f.t0)); return [a, a]; }
      if (p < f.b0) return [1 + (0.06 * (p - f.t1)) / (f.b0 - f.t1), 1];
      const a = 1 - inOut3((p - f.b0) / (f.b1 - f.b0));
      return [1.06 * a, f.pin ? Math.pow(a, 2.5) : a];
    };

    // Type size and geometry, measured with every transform cleared.
    const measure = () => {
      const W = stage.clientWidth, H = stage.clientHeight;
      const phone = S.phone, posed = S.posed;
      const k = phone ? o.phoneSize : o.size;
      const fill = phone ? o.phoneFill : o.fill;
      const D = posed ? 0 : (phone ? o.phoneDrift : o.drift) * H;
      const gut = Math.max(16, 0.04 * W);
      // a size limited by the width (Fw) against the height: the whole block fits the stage (one wall), or,
      // for more than 7 lines (8 on the phone) that would have to shrink by more than 15% to fit, six lines
      // fit and the wall travels through the stage
      const settle = (Fw, n, blockE, room, lh, cap) => {
        const fit = room / blockE, win = room / (5 * lh + cap);
        const travel = !posed && (o.travel === true || (o.travel === 'auto' && n > (phone ? PHONE_WALL : WALL) && fit < 0.85 * Fw));
        return { F: Math.min(Fw, travel ? win : fit), travel };
      };
      root.classList.add('ott-measure');
      root.style.setProperty('--ott-F', '100px');
      for (const l of S.lines) l.style.marginTop = '';
      const st0 = stage.getBoundingClientRect();
      const cxA = st0.left + W / 2;
      // the block clears the top edge (and a note) at the start, and the credit at the end
      const base = 0.04 * H + 14;
      const topE = note ? Math.max(base, note.getBoundingClientRect().bottom - st0.top + 14) : base;
      const credE = credit ? Math.max(base, st0.bottom - credit.getBoundingClientRect().top + 14) : base;
      const room = H - 2 * Math.max(topE + D, credE - D);
      const lh = parseFloat(getComputedStyle(quote).lineHeight) / 100 || (phone ? 0.9 : 0.88);
      const fc = face(quote);
      const cap = fc.cap;

      const above0 = o.enter === 'inside' ? 0 : cap / 2 + 0.525 * k + 0.08;
      render(phone && o.reflow ? phoneLines(W, room, lh, cap, fill, settle, k, above0) : model);
      for (const l of S.lines) l.style.marginTop = '';
      const n = S.lines.length;

      // closed lines at 100px: edges, the gap, the halves (in type sizes from the stage centre)
      const ref = S.lines.map((l, i) => {
        const a = S.A[i].getBoundingClientRect(), b = S.B[i] ? S.B[i].getBoundingClientRect() : null;
        return {
          le: (a.left - cxA) / 100,
          re: ((b || a).right - cxA) / 100,
          sp: ((b ? (a.right + b.left) / 2 : (a.left + a.right) / 2) - cxA) / 100,
          aw: a.width / 100,
        };
      });
      // the leading opens only between two lines whose glyphs would touch: a comma or a tail over a
      // capital, an accent under a letter (the halves' own text; their letter layers are copies)
      const marks = S.lines.map((line) => {
        const out = [];
        const rg = document.createRange();
        const walk = document.createTreeWalker(line, NodeFilter.SHOW_TEXT, { acceptNode: (t) => (t.parentElement && t.parentElement.closest('.ott-chs') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
        for (let t; (t = walk.nextNode());) {
          const s = t.textContent;
          for (let j = 0; j < s.length; j++) {
            if (/\s/.test(s[j]) || (s.charCodeAt(j) & 0xfc00) === 0xdc00) continue;
            rg.setStart(t, j);
            rg.setEnd(t, Math.min(s.length, j + ((s.charCodeAt(j) & 0xfc00) === 0xd800 ? 2 : 1)));
            const r = rg.getBoundingClientRect();
            const m = fc.glyph(s[j].toUpperCase());
            out.push({ x0: r.left / 100, x1: r.right / 100, asc: Math.max(m.asc, cap), desc: m.desc });
          }
        }
        return out;
      });
      const extra = [0];
      for (let i = 1; i < n; i++) {
        let need = 0;
        for (const g of marks[i - 1]) for (const h of marks[i]) {
          if (g.desc < 0.03 && h.asc < cap + 0.03) continue;
          if (g.x1 + 0.02 < h.x0 || h.x1 + 0.02 < g.x0) continue;
          need = Math.max(need, g.desc + h.asc + 0.03);
        }
        extra.push(Math.max(0, Math.round((need - lh) * 1000) / 1000));
      }
      const cyE = [];
      extra.reduce((acc, e, i) => { const y = i ? acc + lh + e : 0; cyE.push(y); return y; }, 0);
      const bh = cyE[n - 1] + cap;
      const Pm = n > 1 ? cyE[n - 1] / (n - 1) : lh;

      // type size
      let Fw = phone ? 0.2 * W : Math.min(0.111 * W, 0.178 * H);
      Fw = Math.min(Fw, (fill * W) / Math.max(0.01, ...ref.map((r) => r.re - r.le)));
      const r1 = k / 2;
      const above = o.enter === 'inside' && !S.cut[0] && !S.side[0] ? 0 : cap / 2 + 1.05 * r1 + 0.08;
      Fw = Math.min(Fw, partLimit(ref, cyE, Pm, S.side, k, W, phone, above));
      const fit = settle(Fw, n, bh, room, lh, cap);
      const travel = fit.travel;
      const F = Math.max(16, fit.F);
      root.style.setProperty('--ott-F', F.toFixed(2) + 'px');
      root.style.setProperty('--ott-S', (k * F).toFixed(2) + 'px');
      S.lines.forEach((l, i) => { l.style.marginTop = extra[i] ? extra[i] + 'em' : ''; });

      // the laid-out lines at that size: cap centres, gaps, halves, closed edges (stage px)
      const st = stage.getBoundingClientRect();
      const cy = [], sp = [], aw = [], le = [], re = [];
      S.lines.forEach((l, i) => {
        const probe = document.createElement('i');
        probe.className = 'ott-probe';
        l.append(probe);
        cy.push(probe.getBoundingClientRect().bottom - st.top - (cap * F) / 2);
        probe.remove();
        const a = S.A[i].getBoundingClientRect(), b = S.B[i] ? S.B[i].getBoundingClientRect() : null;
        sp.push((b ? (a.right + b.left) / 2 : (a.left + a.right) / 2) - st.left);
        aw.push(a.width);
        le.push(a.left - st.left);
        re.push((b || a).right - st.left);
      });
      // the letters of the breaking lines: each laid exactly over its own glyph (kerning kept)
      const rg = document.createRange();
      const Lm = S.L.map((L) => {
        const t = L.half.firstChild;
        if (!t || t.nodeType !== 3) return { x: 0, w: 0 };
        rg.setStart(t, L.off);
        rg.setEnd(t, L.off + L.len);
        const r = rg.getBoundingClientRect(), hr = L.half.getBoundingClientRect();
        L.el.style.fontSize = '';
        L.el.style.transformOrigin = '';
        L.el.style.left = ((r.left - hr.left) / F).toFixed(4) + 'em';
        return { x: r.left + r.width / 2 - st.left, w: r.width, l: (r.left - hr.left) / F };
      });
      root.classList.remove('ott-measure');
      const r = (k * F) / 2;
      const P = n > 1 ? (cy[n - 1] - cy[0]) / (n - 1) : lh * F;
      const cx = W / 2;
      // the wall's offset: a slow climb by 2D (one wall), or a climb past the object (a travelling wall:
      // line 1 where a six-line wall's first line would be, the last line where its sixth would be)
      let by0 = D, byA = D - 2 * D * TRAVEL;
      if (travel) {
        const win = (5 * lh + cap) * F;
        by0 = H / 2 - win / 2 + (cap * F) / 2 + D - cy[0];
        byA = H / 2 + win / 2 - (cap * F) / 2 + D - 2 * D * TRAVEL - cy[n - 1];
      }
      const by1 = byA - 2 * D * (1 - TRAVEL);
      const at = (t) => byA + ((by1 - byA) * (t - TRAVEL)) / (1 - TRAVEL);
      const byEnd = at(TRAVEL + EXIT);
      // after the exit: one wall keeps climbing; a travelling wall pulls back (scales down about the stage
      // centre) until the whole quote fits between the top margin and the credit, centred there
      let byE = at(FIT0), byM = at(FIT1), byZ = by1, scale = 1;
      if (travel) {
        const top = topE, bottom = H - credE;
        const block = cy[n - 1] - cy[0] + cap * F * 1.3;
        scale = Math.min(1, (bottom - top) / block);
        byM = (top + bottom) / 2 - H / 2 - ((cy[0] + cy[n - 1]) / 2 - H / 2) * scale;
        byZ = byM;
      }
      // entering from above, it drops into line 1 by `enter`, then meets one line every
      // (TRAVEL - enter) / (n - 1)
      const enter = above ? ENTER : 0;
      const g = {
        W, H, F, P, r, n, cx, cy, sp, aw, le, re, D, gut, travel, enter, capH: cap * F,
        side: S.side, push: phone ? o.phonePush : o.push,
        fx: sp.map((x, i) => (S.side[i] ? 0 : o.follow * (x - cx))),
        by0, byA, by1: byZ, byE, byM, scale,
        y0: cy[0] + by0 - above * F,
        y1: cy[0] + by0 + ((byA - by0) * ENTER) / TRAVEL,
        yA: cy[n - 1] + byA,
        // gone below the stage, and far enough past the last line that the wake has closed
        yEnd: Math.max(H + 1.1 * o.grow * r + 10, cy[n - 1] + byEnd + o.radius * r * (1 + (o.grow - 1) / 2) + 4),
      };
      g.fl = S.L.length && !posed ? throwOf(g, Lm, cap) : [];
      // a giant is set at its swollen size and scaled down to its glyph at rest, so the browser draws it
      // sharp at the size it is seen at (a small glyph scaled up six times is drawn soft on a phone)
      g.fl.forEach((f, j) => {
        if (!f.pin) return;
        const L = S.L[j];
        f.m = Math.max(1, f.sc);
        f.cx = Lm[j].w / 2;
        f.cy = (lh * F) / 2;
        L.el.style.fontSize = f.m.toFixed(3) + 'em';
        L.el.style.left = ((Lm[j].l || 0) / f.m).toFixed(4) + 'em';
        L.el.style.transformOrigin = '0 0';
      });
      // the stretch of the scene each breaking line spends in letters
      g.brk = S.lines.map(() => null);
      g.fl.forEach((f, j) => {
        const i = S.L[j].i, b = g.brk[i] || (g.brk[i] = [1, 0]);
        b[0] = Math.min(b[0], f.t0);
        b[1] = Math.max(b[1], f.b1);
      });
      return g;
    };
    const key = () => `${stage.clientWidth}x${stage.clientHeight}|${S.fonts}|${S.phone ? 'p' : 'd'}|${S.posed ? 'r' : 'l'}`;
    const G = () => {
      const k = key();
      if (k !== S.key || !S.geo) { S.geo = measure(); S.key = key(); }
      return S.geo;
    };

    // the halves follow their places at once, or eased when `lag` is on; rebuilt when the lines change
    // and on every build (gsap.matchMedia reverts the old context, which kills these functions)
    const setters = () => {
      const one = (el) => {
        if (!el) return () => {};
        if (!o.lag) { const set = gsap.quickSetter(el, 'x', 'px'); return (v) => set(v); }
        const to = gsap.quickTo(el, 'x', { duration: o.lag, ease: 'power3.out' });
        return (v, now) => (now ? to(v, v) : to(v));
      };
      const fa = S.A.map(one), fb = S.B.map(one);
      S.x = S.lines.map(() => [NaN, NaN]);
      S.op = S.lines.map(() => NaN);
      S.put = (i, xa, xb, now) => {
        const x = S.x[i];
        if (now || x[0] !== xa) { fa[i](xa, now); x[0] = xa; }
        if (now || x[1] !== xb) { fb[i](xb, now); x[1] = xb; }
      };
      S.setX = gsap.quickSetter(obj, 'x', 'px');
      S.putVer = S.ver;
    };
    const wake = (now) => {
      const g = S.geo;
      if (!g || !S.live || !window.gsap) return;
      if (S.putVer !== S.ver || !S.put) setters();
      const yo = gsap.getProperty(obj, 'y'), s = gsap.getProperty(obj, 'scale') || 1;
      const by = gsap.getProperty(quote, 'y'), sq = gsap.getProperty(quote, 'scale') || 1;
      // the object's centre in the wall's own coordinates (the wall may be climbing and, at the end of a
      // travelling wall, scaled about the stage centre)
      const yb = (yo - by - g.H / 2) / sq + g.H / 2;
      const xo = leanAt(g, yb);
      S.setX(Math.round(xo * 10) / 10);
      const back = g.scale < 1 ? clamp((1 - sq) / (1 - g.scale), 0, 1) : 0;
      for (let i = 0; i < g.n; i++) {
        const [xa, xb, ink] = wakeAt(g, yb, s, xo, i, g.gut);
        S.put(i, Math.round(xa * 10) / 10, Math.round(xb * 10) / 10, now === true);
        let op = o.rest + (1 - o.rest) * ink;
        // a travelling wall: a line fades as the stage edge cuts into it, so no half-cut line is left
        // standing at the top or the bottom; as the wall pulls back every line comes back in full
        if (g.travel) {
          const c = g.H / 2 + (g.cy[i] - g.H / 2) * sq + by, h = (g.capH / 2) * sq;
          op *= Math.max(back, smooth(clamp(Math.min(c - h, g.H - c - h) / (0.45 * g.F * sq) + 0.15, 0, 1)));
        }
        // on the halves, not the line: each half is its own layer already, so a faded line costs no extra
        // offscreen surface in the compositor
        op = Math.round(op * 1000) / 1000;
        if (op !== S.op[i]) {
          const v = op >= 1 ? '' : String(op);
          S.A[i].style.opacity = v;
          if (S.B[i]) S.B[i].style.opacity = v;
          S.op[i] = op;
        }
      }
      // the break: the lines in letters while their throw lasts, each letter where its throw has it
      if (g.fl.length) {
        const p = S.tl ? S.tl.progress() : 0;
        const hx = new Map();
        S.lines.forEach((l, i) => {
          const on = !!g.brk[i] && p > g.brk[i][0] && p < g.brk[i][1];
          if (on !== S.on[i]) { l.classList.toggle('is-broken', on); S.on[i] = on; }
        });
        S.L.forEach((L, j) => {
          const f = g.fl[j];
          const [a, as] = f ? thrown(f, p) : [0, 0];
          let tr = '';
          if (f && f.m) {
            // a giant (set at its swollen size, origin at its corner): turned about its glyph's centre and
            // scaled down by its own size, so at rest it is exactly its glyph
            let dx = 0, dy = 0;
            if (a > 0) {
              // it lands where it was thrown, wherever its half has moved meanwhile
              if (!hx.has(L.half)) hx.set(L.half, gsap.getProperty(L.half, 'x') || 0);
              dx = f.dx * a - hx.get(L.half) * Math.min(1, a);
              dy = f.dy * a;
            }
            const sc = (1 + (f.sc - 1) * as) / f.m;
            tr = `translate3d(${(dx + f.cx).toFixed(1)}px,${(dy + f.cy).toFixed(1)}px,0) perspective(${Math.round(f.persp)}px) rotate(${(f.rot * a).toFixed(1)}deg) rotateY(${(f.ry * a).toFixed(1)}deg) scale(${sc.toFixed(4)}) translate(${(-f.cx * f.m).toFixed(1)}px,${(-f.cy * f.m).toFixed(1)}px)`;
          } else if (a > 0) {
            const dx = f.dx * a, dy = f.dy * a;
            const sc = 1 + (f.sc - 1) * as;
            tr = `perspective(${Math.round(f.persp)}px) translate3d(${dx.toFixed(1)}px,${dy.toFixed(1)}px,0) rotate(${(f.rot * a).toFixed(1)}deg) rotateX(${(f.rx * a).toFixed(1)}deg) rotateY(${(f.ry * a).toFixed(1)}deg) scale(${sc.toFixed(3)})`;
          }
          if (tr !== L.tr) { L.el.style.transform = tr; L.tr = tr; }
        });
      }
      // the bar across the edge shows only near edge-on; face-on it would read as a line across the face
      if (rimBar) {
        const a = Math.abs(Math.sin((gsap.getProperty(obj, 'rotationY') * Math.PI) / 180));
        const op = Math.round(smooth(clamp((a - 0.82) / 0.14, 0, 1)) * 100) / 100;
        if (op !== S.rimOp) { rimBar.style.opacity = String(op); S.rimOp = op; }
      }
    };

    const build = (tl, c) => {
      S.live = true; S.posed = false; S.phone = c.phone; S.tl = tl;
      // the old context's quickTo / quickSetter functions died with it: make new ones
      S.put = null;
      root.classList.remove('is-posed');
      clear();
      S.key = ''; S.geo = null; S.rimOp = NaN;
      G();
      const t0 = o.tilt[0], t1 = o.tilt[1];
      // the pull-back is eased for a travelling wall; one wall keeps an even climb through it
      const fitEase = (t) => (S.geo && S.geo.travel ? inOut3(t) : t);
      tl.fromTo(quote, { y: () => G().by0, scale: 1 }, { y: () => G().byA, duration: TRAVEL }, 0)
        .fromTo(quote, { y: () => G().byA }, { y: () => G().byE, duration: FIT0 - TRAVEL, immediateRender: false }, TRAVEL)
        .fromTo(quote, { y: () => G().byE, scale: 1 }, { y: () => G().byM, scale: () => G().scale, duration: FIT1 - FIT0, ease: fitEase, immediateRender: false }, FIT0)
        .fromTo(quote, { y: () => G().byM }, { y: () => G().by1, duration: 1 - FIT1, immediateRender: false }, FIT1)
        // in: from just above the wall into line 1 (or held in line 1 when it starts there)
        .fromTo(obj, { y: () => G().y0, scale: 1, rotationX: 0 }, { y: () => G().y1, duration: ENTER }, 0)
        .fromTo(obj, { y: () => G().y1 }, { y: () => G().yA, duration: TRAVEL - ENTER, immediateRender: false }, ENTER)
        .fromTo(obj, { rotation: t0 }, { rotation: t1, duration: TRAVEL }, 0)
        // the exit: it swells toward the camera while it still hangs in the last line (the wall breaks or
        // bursts open around it), then tips and falls out of the stage
        .fromTo(obj, { y: () => G().yA }, { y: () => G().yEnd, duration: EXIT, ease: 'power3.in', immediateRender: false }, TRAVEL)
        .fromTo(obj, { scale: 1 }, { scale: o.grow, duration: EXIT, ease: 'power2.out', immediateRender: false }, TRAVEL)
        .fromTo(obj, { rotation: t1, rotationX: 0 }, { rotation: t1 + 17, rotationX: TIP * o.tip, duration: EXIT, ease: 'power2.in', immediateRender: false }, TRAVEL);
      if (o.mode === 'flip') {
        const turn = () => 180 * Math.max(1, G().n - 1);
        // a face at every line, edge-on between lines (half a turn on the way in when it enters from above)
        tl.fromTo(obj, { rotationY: () => (G().enter ? -180 : 0) }, { rotationY: 0, duration: ENTER }, 0)
          .fromTo(obj, { rotationY: 0 }, { rotationY: turn, duration: TRAVEL - ENTER, immediateRender: false }, ENTER)
          .fromTo(obj, { rotationY: turn }, { rotationY: () => turn() + 180, duration: EXIT, ease: 'power2.in', immediateRender: false }, TRAVEL);
      }
      // the credit comes in once the object has gone (and, after a break, once the letters are nearly home)
      if (credit) tl.fromTo(credit, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.1, ease: 'power2.out' }, o.exit === 'break' ? 0.75 : TRAVEL + EXIT);
      tl.eventCallback('onUpdate', wake);
      wake(true);
    };

    // The poster frame: the object resting inside the middle line that parts at a word gap (its
    // neighbours parted just around it, so no word is shown cut), every line in ink. Needs no GSAP.
    const pose = (phone) => {
      S.live = false; S.posed = true; S.phone = !!phone; S.put = null;
      root.classList.add('is-posed');
      clear();
      S.key = ''; S.geo = null;
      const g = G();
      const mid = (g.n - 1) / 2;
      const ok = (i) => !!S.B[i] && !S.cut[i];
      const cost = (i) => (ok(i) ? 0 : 100) + (S.cut[i - 1] || S.cut[i + 1] ? 10 : 0) + Math.abs(i - mid);
      const host = [...g.cy.keys()].sort((a, b) => cost(a) - cost(b) || a - b)[0];
      const yb = g.cy[host], xo = leanAt(g, yb);
      S.lines.forEach((l, i) => {
        const [xa, xb] = wakeAt(g, yb, 1, xo, i, g.gut);
        S.A[i].style.transform = Math.abs(xa) > 0.05 ? `translate3d(${xa.toFixed(1)}px,0,0)` : '';
        if (S.B[i]) S.B[i].style.transform = Math.abs(xb) > 0.05 ? `translate3d(${xb.toFixed(1)}px,0,0)` : '';
      });
      obj.style.transform = `translate3d(${xo.toFixed(1)}px,${yb.toFixed(1)}px,0) rotate(-4deg)`;
      if (rimBar) rimBar.style.opacity = '0';
    };
    const rest = (c) => pose(!!(c && c.phone));

    // Late fonts and resizes: a poster is posed again; a live scene re-measures through a refresh (a
    // window resize is left to ScrollTrigger's own refresh, so it is not done twice).
    let wait = 0, win = '';
    const again = () => {
      clearTimeout(wait);
      wait = setTimeout(() => {
        const w = `${window.innerWidth}x${window.innerHeight}`;
        const resized = w !== win;
        win = w;
        if (S.posed) pose(S.phone);
        else if (S.live && window.ScrollTrigger && key() !== S.key && !resized) ScrollTrigger.refresh();
      }, 60);
    };
    win = `${window.innerWidth}x${window.innerHeight}`;
    if (document.fonts) document.fonts.addEventListener('loadingdone', () => { S.fonts++; again(); });
    if (window.ResizeObserver) new ResizeObserver(again).observe(stage);
    if (window.ScrollTrigger) ScrollTrigger.addEventListener('refresh', () => { if (S.live) wake(true); });

    if (!window.Stage) return null;
    if (Stage.live && Stage.touch) ScrollTrigger.config({ ignoreMobileResize: true });
    const scrub = o.scrub !== null ? o.scrub : (Stage.lenis ? true : 0.6);
    const mm = Stage.scene(root, {
      hold: o.hold,
      scrub,
      build,
      phone: o.phone === 'rest' ? 'rest' : { hold: o.phoneHold, build },
      rest,
    });
    // Stage work-around: gsap.matchMedia only calls back when one of its conditions matches, and reduced
    // motion on a desktop matches neither (motion, phone), so the stage never shows the finished
    // composition there. Pose it here, and again whenever the media change into that state.
    if (mm && window.matchMedia) {
      const motion = window.matchMedia('(prefers-reduced-motion: no-preference)');
      const small = window.matchMedia('(max-width: 767px)');
      const orphan = () => {
        if (motion.matches || small.matches) return;
        root.classList.remove('is-live');
        root.classList.add('is-rest');
        root.style.removeProperty('--hold');
        pose(false);
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
