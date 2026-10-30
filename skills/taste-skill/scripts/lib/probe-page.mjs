// Round 10, part B (r9-p41 a notes app, r9-p42 Haulet, r9-p43 Hvít: three pages that won and still read as templates):
// the page as it is built. inspect.mjs runs pageBuild() once at the top of the page after the walk, and once more on the
// reduced-motion page for the scenes' finished compositions; deadControls() runs last, since it uses the page. Every
// function here runs in the page and returns plain JSON.

// pageBuild: what each section is built from and what the page repeats.
//   framed       per section, the framed elements in it: a box with a fill unlike the ground it stands on, a box
//                outlined on three sides or more, or a product window (framed-elements). Buttons, fields, pictures and
//                bands from edge to edge are not frames; boxes that touch are one frame; only the outermost counts.
//   stats        a row of three or more big figures or words, each over a short label (stats-band)
//   emailFields  the email fields on the page outside dialogs (duplicate-form)
//   splits       on desktop, each section in order: a picture beside its text (and how wide the picture is), or not
//                (repeated-split)
//   runOn        on desktop, a split whose left column ends while the right one runs on (empty-left)
//   credits      the pictures shown, the entries of the page's credits list, and the pictures no entry names (credits)
//   opts.scenes  only what is inside scenes (the reduced-motion page shows their finished compositions)
export async function pageBuild(opts = {}) {
  const W = innerWidth, H = innerHeight, sy = scrollY || 0, B = document.body || document.documentElement;
  const memo = new Map(); const css = (e) => { let c = memo.get(e); if (!c) { c = getComputedStyle(e); memo.set(e, c); } return c; };
  const visible = (el) => { const cs = css(el); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return false; const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2; };
  const norm = (t) => (t || '').replace(/\s+/g, ' ').trim();
  const words = (t) => (norm(t).match(/\S+/g) || []).length;
  const textOf = (el) => norm(el.innerText || el.textContent || '');
  // (a fill set with color-mix(), the dealt overlapping cards' tone steps, computes to color(srgb r g b), 0 to 1)
  const rgba = (c) => { const s = String(c || ''); const k = s.match(/color\(srgb\s+([-\d.e]+)\s+([-\d.e]+)\s+([-\d.e]+)(?:\s*\/\s*([-\d.e]+))?\s*\)/); if (k) return [k[1] * 255, k[2] * 255, k[3] * 255, k[4] != null ? +k[4] : 1]; const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
  const groundOf = (el) => { for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const c = rgba(css(e).backgroundColor); if (c && c[3] >= 0.9) return c; } return [255, 255, 255, 1]; };
  const differs = (a, b, d = 6) => !!a && !!b && [0, 1, 2].some((i) => Math.abs(a[i] - b[i]) >= d);
  const sides = (el) => { const cs = css(el); return ['Top', 'Right', 'Bottom', 'Left'].filter((s) => parseFloat(cs[`border${s}Width`]) >= 1 && cs[`border${s}Style`] !== 'none' && (rgba(cs[`border${s}Color`]) || [0, 0, 0, 0])[3] > 0.05).length; };
  const hex = (c) => '#' + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  const desc = (e) => e.tagName.toLowerCase() + (e.classList && e.classList.length ? '.' + [...e.classList].slice(0, 2).join('.') : '');
  const inScene = (el) => !!el.closest('.scene, [data-scene], .pin-spacer');
  // (a live scene shows a moment of its run, not its composition: it is looked at on the reduced-motion page)
  const keep = (el) => (opts.scenes ? inScene(el) : !inScene(el) || !!el.closest('.scene.is-rest'));
  const headOf = (s) => { const h = s.querySelector('h1, h2, h3, [role=heading]'); return textOf(h || s).slice(0, 50); };
  // (the site's bar: a <header> outside the page's sections)
  const siteBar = (el) => { const b = el.closest('header'); return !!b && !b.parentElement?.closest('main, section, article, [data-scene]'); };
  const bodyPx = parseFloat(css(B).fontSize) || 16;
  const out = {};

  // --- the sections: the page's parts, the nearest section, scene or footer (or a child of main when there is none)
  const sectionOf = (el) => el.closest('section, [data-scene], footer') || [...(document.querySelector('main') || B).children].find((c) => c.contains(el)) || null;

  // --- framed elements, per section. Round 11 (Leon: cards are wanted, they show what belongs together): a card on a
  // fill, a picture-led card, a product window are fine in any number. What is reported: a frame with another frame
  // inside it (boxes in boxes), a box laid on a photograph, a box cut to a shape by a mask or a clip-path (a perforated
  // ticket, a notch), and frames drawn by their outline alone.
  out.framed = [];
  {
    // (a card set as a link counts like any card; buttons and fields are controls)
    const SKIP = /^(BUTTON|INPUT|SELECT|TEXTAREA|LABEL|OPTION|IMG|VIDEO|PICTURE|CANVAS|IFRAME|SVG|HR|BR|SCRIPT|STYLE|SUMMARY)$/i;
    const picTile = (e, r) => [...e.querySelectorAll('img, video, picture, canvas')].some((p) => { const q = p.getBoundingClientRect(); return q.width * q.height >= r.width * r.height * 0.6; });
    // the photographs on the page (an img, a film, a canvas, a box with a photograph for its background), by their frame
    // (a canvas is a scene's field, the dither opener's, not a photograph: as hero-in-card has it)
    const photos = [...B.querySelectorAll('img, video, div, section, figure, span, a, li, article')].filter((p) => {
      if (p.closest('nav, dialog, [role=dialog], [data-ui]') || !visible(p)) return false;
      if (/^(IMG|VIDEO)$/.test(p.tagName)) return !/\.svg(\?|#|$)/i.test(p.currentSrc || p.src || '');
      const bi = css(p).backgroundImage; return !!bi && /url\(/.test(bi) && !/\.svg/i.test(bi) && /cover|contain|%/.test(css(p).backgroundSize);
    }).map((p) => ({ p, r: p.getBoundingClientRect() })).filter((x) => x.r.width * x.r.height >= W * H * 0.04);
    // a box laid on a photograph: half of it or more over a picture that is not inside it and is half as large again (the
    // picture is a frame, so the box is a box in a box: r9-p43's note in the corner of the fjord). A card that overlaps a
    // picture's corner with less than half of itself is the overlapping card the sheet deals.
    const onPhoto = (e, r) => photos.find(({ p, r: q }) => {
      if (e.contains(p) || q.width * q.height < r.width * r.height * 1.5) return false;
      // (a band across the picture's whole width at its foot or its top, a third of its height at most, is a card's foot:
      // R2's poster card, its name on a solid foot of the surface tone)
      if (r.width >= q.width * 0.95 && (Math.abs(r.bottom - q.bottom) <= 4 || Math.abs(r.top - q.top) <= 4) && r.height <= q.height * 0.35) return false;
      const ix = Math.min(q.right, r.right) - Math.max(q.left, r.left), iy = Math.min(q.bottom, r.bottom) - Math.max(q.top, r.top);
      return ix > 0 && iy > 0 && ix * iy >= r.width * r.height * 0.5;
    });
    // a box cut to a shape: a mask, or a clip-path that is not a rectangle (rounded corners are a radius, not a shape)
    const plainClip = (v) => v === 'none' || /^inset\(/.test(v) || (/^polygon\(/.test(v) && v.replace(/^polygon\(|\)$/g, '').split(',').every((pt) => pt.trim().split(/\s+/).every((n) => /^(0|0px|0%|100%|calc\(100%\s*[-+]\s*0px\))$/.test(n))));
    const shapedBy = (e, r) => { for (let x = e, i = 0; x && i < 3; i++) { const c = css(x); if ((c.maskImage && c.maskImage !== 'none') || (c.webkitMaskImage && c.webkitMaskImage !== 'none')) return 'a mask'; if (!plainClip(c.clipPath)) return 'a clip-path'; const kids = [...x.children].filter(visible); if (kids.length !== 1) break; const q = kids[0].getBoundingClientRect(); if (q.width * q.height < r.width * r.height * 0.8) break; x = kids[0]; } return null; };
    const framed = (e) => {
      if (e.matches('[data-ui]') && !e.parentElement?.closest('[data-ui]')) { const g = groundOf(e.parentElement || B), drawn = (x) => { const c = rgba(css(x).backgroundColor); return (c && c[3] >= 0.5 && differs(c, g)) || sides(x) >= 3 || css(x).boxShadow !== 'none'; }; return drawn(e) || (e.children.length === 1 && drawn(e.children[0])) ? 'a product window' : null; }
      const c = rgba(css(e).backgroundColor);
      if (c && c[3] >= 0.5 && differs(c, groundOf(e.parentElement || B))) return 'filled ' + hex(c);
      if (sides(e) >= 3) return 'outlined';
      // (a box in the ground's own colour still reads as a box where it lies on a photograph)
      if (c && c[3] >= 0.5 && onPhoto(e, e.getBoundingClientRect())) return 'ground ' + hex(c);
      return null;
    };
    // a frame inside a frame: a box of its own size class (a fifth of the outer's width or 120px, 40px tall), not a
    // control, not a chip, and not the outer box drawn again (nine tenths of it)
    const innerFrame = (outer, ro) => {
      let k2 = 0;
      for (const x of outer.querySelectorAll('*')) {
        if (++k2 > 600) break;
        if (SKIP.test(x.tagName) || x instanceof SVGElement || /^(TABLE|THEAD|TBODY|TFOOT|TR|TD|TH|CAPTION)$/.test(x.tagName)) continue;
        // (a button drawn as a link inside the card is a control; a table's striped rows are the table's)
        const ctl = x.closest('a, button, [role=button]'); if (ctl && ctl !== outer && outer.contains(ctl) && ctl.getBoundingClientRect().height < 64) continue;
        const q = x.getBoundingClientRect();
        if (q.width < Math.max(80, ro.width * 0.2) || q.height < 40 || q.width * q.height >= ro.width * ro.height * 0.9 || !visible(x)) continue;
        // (a field drawn as one box with its button, a newsletter card's email pill, is a control)
        if (q.height <= 96 && (x.matches('form, [role=search]') || x.querySelector('input:not([type=hidden]), select, textarea'))) continue;
        if (x.parentElement?.closest('[data-ui]') && x.parentElement.closest('[data-ui]') !== outer) continue;
        if (!x.matches('[data-ui]') && picTile(x, q)) continue;
        const how = x.matches('[data-ui]') ? 'a product window' : (() => { const c = rgba(css(x).backgroundColor); if (c && c[3] >= 0.5 && differs(c, groundOf(x.parentElement || outer))) return 'filled ' + hex(c); return sides(x) >= 3 ? 'outlined' : null; })();
        if (how && (textOf(x) || x.querySelector('img, video, canvas, picture'))) return `${textOf(x).slice(0, 24) || desc(x)} (${how}, ${Math.round(q.width)}x${Math.round(q.height)})`;
      }
      return null;
    };
    const bySec = new Map(); const counted = [];
    let k = 0;
    for (const e of B.querySelectorAll('*')) {
      if (++k > 9000) break;
      if (SKIP.test(e.tagName) || e instanceof SVGElement || counted.some((c) => c.contains(e))) continue;
      // (the inside of a product's window is its own interface, judged by fragment-boxes; a bare crop is no frame)
      if (e.closest('nav, dialog, [role=dialog], [aria-hidden=true], header[role=banner]') || e.parentElement?.closest('form, [data-ui]') || siteBar(e) || !keep(e)) continue;
      const cs = css(e); if (/fixed|sticky/.test(cs.position) && e.getBoundingClientRect().height < H * 0.3) continue;
      const r = e.getBoundingClientRect();
      if (r.width < 120 || r.height < 56 || r.width * r.height < W * H * 0.012 || r.width >= W * 0.94) continue;
      // (a link drawn as a button, a few words in a box up to 64px tall, is a control)
      if (e.matches('a, [role=button]') && r.height <= 64 && (textOf(e).match(/\S+/g) || []).length <= 5) continue;
      const how = framed(e); if (!how || !visible(e)) continue;
      if (how !== 'a product window' && picTile(e, r)) continue;
      if (!textOf(e) && !e.querySelector('img, video, canvas, picture')) continue;
      const sec = sectionOf(e); if (!sec || sec === e) continue;
      counted.push(e);
      const it = { e, r, how };
      // (a field that runs to the screen's side and holds the product's window is a ground for it, not a box round it)
      const field = (r.left <= 1 || r.right >= W - 1) && r.width >= W * 0.4;
      if (how !== 'a product window') { it.nested = field ? null : innerFrame(e, r); const ph = onPhoto(e, r); if (ph) it.photo = desc(ph.p); it.shaped = shapedBy(e, r); }
      const list = bySec.get(sec) || []; list.push(it); bySec.set(sec, list);
    }
    const label = (it) => `${textOf(it.e).slice(0, 28) || desc(it.e)} (${it.how}, ${Math.round(it.r.width)}x${Math.round(it.r.height)})`;
    for (const [sec, items] of bySec) {
      // (boxes that touch are drawn as one frame: a ticket's body and its stub, a window's panes)
      const groups = [];
      for (const it of items) {
        const g = groups.find((x) => x.some((y) => y.e.parentElement === it.e.parentElement && Math.max(y.r.left - it.r.right, it.r.left - y.r.right, y.r.top - it.r.bottom, it.r.top - y.r.bottom) <= 3));
        if (g) g.push(it); else groups.push([it]);
      }
      const nested = items.filter((x) => x.nested), photo = items.filter((x) => x.photo), shaped = items.filter((x) => x.shaped);
      const outlined = groups.filter((g) => g.every((x) => x.how === 'outlined'));
      if (groups.length < 2 && !nested.length && !photo.length && !shaped.length) continue;
      const parents = new Map(); for (const g of groups) parents.set(g[0].e.parentElement, (parents.get(g[0].e.parentElement) || 0) + 1);
      out.framed.push({ head: headOf(sec), n: groups.length, list: Math.max(...parents.values()) >= 3, y: Math.round(sec.getBoundingClientRect().top + sy), items: groups.slice(0, 5).map((g) => label(g[0])),
        outlined: outlined.length, nested: nested.slice(0, 3).map((x) => `${label(x)} holds ${x.nested}`), onPhoto: photo.slice(0, 3).map((x) => `${label(x)} on ${x.photo}`), shaped: shaped.slice(0, 3).map((x) => `${label(x)} cut by ${x.shaped}`), shapedN: shaped.length });
      if (out.framed.length >= 8) break;
    }
    // the product windows on the first screen, at the top of the page (r8-p38: four windows round the title, "cluttered,
    // nowhere to look"): the [data-ui] roots that meet the first screen, a clear one drawn by its parts included (two
    // of r8-p38's four are clear wrappers round filled query cards)
    out.heroWindows = [];
    if (!opts.scenes && sy < 2) for (const e of B.querySelectorAll('[data-ui]')) {
      if (e.parentElement?.closest('[data-ui]') || e.closest('nav, dialog, [role=dialog], [aria-hidden=true]') || !visible(e)) continue;
      const r = e.getBoundingClientRect(); if (r.width < 120 || r.height < 56 || r.top >= H || r.bottom <= 0) continue;
      out.heroWindows.push(`${textOf(e).slice(0, 24) || desc(e)} (${Math.round(r.width)}x${Math.round(r.height)})`);
    }
  }
  if (opts.scenes) return out;

  // --- a stats band: a row of three or more items, each a big figure or a word or two set large over a short label
  out.stats = [];
  {
    const big = Math.max(28, bodyPx * 1.6);
    const parts = (item) => {
      const by = []; const tw = document.createTreeWalker(item, NodeFilter.SHOW_TEXT); let n;
      while ((n = tw.nextNode())) { const t = norm(n.nodeValue); if (!t || !n.parentElement || !visible(n.parentElement)) continue; by.push({ t, size: parseFloat(css(n.parentElement).fontSize) || 16 }); }
      if (!by.length) return null;
      const max = Math.max(...by.map((x) => x.size));
      const head = norm(by.filter((x) => x.size === max).map((x) => x.t).join(' ')), rest = norm(by.filter((x) => x.size < max).map((x) => x.t).join(' '));
      const restMax = Math.max(0, ...by.filter((x) => x.size < max).map((x) => x.size));
      if (max < big || !rest || restMax > max * 0.6) return null;
      if (!(words(head) <= 2 || (/\d/.test(head) && words(head) <= 3)) || words(rest) > 8) return null;
      return { head: head.slice(0, 24), rest: rest.slice(0, 40) };
    };
    const seen = [];
    let k = 0;
    for (const p of B.querySelectorAll('*')) {
      if (++k > 9000 || out.stats.length >= 4) break;
      if (p.childElementCount < 3 || p.childElementCount > 8 || seen.some((s) => s.contains(p) || p.contains(s))) continue;
      if (p.closest('nav, footer, form, dialog, [data-ui], [aria-hidden=true], table, .replay') || !keep(p) || !visible(p)) continue;
      const items = [...p.children].filter(visible);
      if (items.length < 3 || items.some((i) => words(textOf(i)) > 14)) continue;
      const ok = items.map((i) => ({ i, r: i.getBoundingClientRect(), x: parts(i) })).filter((x) => x.x);
      if (ok.length < 3 || ok.length < items.length * 0.6) continue;
      if (ok.filter((x) => /^[€$£¥]\s?\d|\d\s?(€|kr|eur|usd|chf)\b/i.test(x.x.head)).length >= 2) continue;
      // (three of them on one row)
      const row = ok.filter((a) => ok.filter((b) => Math.abs(a.r.top - b.r.top) <= 16).length >= 3);
      if (row.length < 3) continue;
      seen.push(p);
      out.stats.push({ n: ok.length, head: headOf(sectionOf(p) || p), items: ok.slice(0, 4).map((x) => `"${x.x.head}" over "${x.x.rest}"`) });
    }
  }

  // --- email fields outside dialogs: one sign-up per page
  out.emailFields = [];
  for (const f of document.querySelectorAll('input[type=email], input[autocomplete=email], input[name*=mail i]')) {
    if (f.type === 'hidden' || f.closest('dialog, [role=dialog], [hidden], details:not([open]), [aria-hidden=true]')) continue;
    if (!f.getClientRects().length || css(f).visibility === 'hidden') continue;
    const form = f.closest('form, section, footer') || f.parentElement;
    const label = (f.labels && f.labels[0] ? textOf(f.labels[0]) : '') || f.placeholder || f.getAttribute('aria-label') || '';
    const btn = form ? [...form.querySelectorAll('button, input[type=submit]')].map((b) => textOf(b) || b.value).find(Boolean) : '';
    out.emailFields.push({ label: label.slice(0, 40), button: (btn || '').slice(0, 24), where: headOf(sectionOf(f) || form || f), y: Math.round(f.getBoundingClientRect().top + sy) });
  }

  // --- the picture/text split of each section, in order (desktop): a picture (a photograph, a film or the product's
  // window) at 6% of the screen or more beside the section's text, in it, or held beside it by a sticky stage in the
  // block round it (r9-p42: the hero, the bike and the loads beside one sticky photograph, then the ride beside its own)
  out.splits = [];
  if (W >= 1100) {
    // (a section may be a column of its own beside a sticky picture: r9-p42's sections are 44% of the width)
    const qual = (s) => { if (!visible(s) || s.closest('nav, dialog, header[role=banner]')) return false; const r = s.getBoundingClientRect(); return r.height >= 160 && r.width >= W * 0.3; };
    const secs = [...document.querySelectorAll('section, [data-scene], [data-hero], main > div, main > article')].filter(qual).filter((s, i, a) => !a.some((o) => o !== s && s.contains(o))).sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top).slice(0, 30);
    const docR = (r) => ({ l: r.left, r: r.right, t: r.top + sy, b: r.bottom + sy });
    const MEDIA = 'img, video, canvas, [data-ui]';
    const pics = [...document.querySelectorAll(MEDIA)].filter((m) => !m.parentElement?.closest('[data-ui]') && !m.closest('nav, dialog, header[role=banner], footer') && m.getClientRects().length).map((m) => {
      // (the picture within the boxes that clip it: a crop zoomed inside its frame keeps the frame)
      const q0 = m.getBoundingClientRect(); const r = { left: q0.left, right: q0.right, top: q0.top, bottom: q0.bottom };
      for (let e = m.parentElement, i = 0; e && e !== B && i < 8; e = e.parentElement, i++) { const c = css(e); if (c.overflowX !== 'visible' || c.overflowY !== 'visible' || c.clipPath !== 'none') { const q = e.getBoundingClientRect(); r.left = Math.max(r.left, q.left); r.right = Math.min(r.right, q.right); r.top = Math.max(r.top, q.top); r.bottom = Math.min(r.bottom, q.bottom); } }
      r.width = r.right - r.left; r.height = r.bottom - r.top;
      if (r.width <= 0 || r.height <= 0 || r.width * r.height < W * H * 0.06) return null;
      // (held by a sticky stage: beside everything in the block that holds the stage)
      let span = docR(r), held = false;
      for (let e = m, i = 0; e && e !== B && i < 5; e = e.parentElement, i++) if (css(e).position === 'sticky' && e.parentElement) { const p = docR(e.parentElement.getBoundingClientRect()); span = { l: r.left, r: r.right, t: p.t, b: p.b }; held = true; break; }
      return { m, span, held };
    }).filter(Boolean);
    for (const s of secs) {
      const sr = docR(s.getBoundingClientRect());
      if (s.closest('.scene.is-live, .pin-spacer')) { out.splits.push({ head: headOf(s), kind: 'scene' }); continue; }
      const tr = []; const tw = document.createTreeWalker(s, NodeFilter.SHOW_TEXT); const rg = document.createRange(); let n, k = 0;
      while ((n = tw.nextNode()) && k < 800) { const el = n.parentElement; if (!norm(n.nodeValue) || !el || el.closest('[data-ui], figcaption, button, nav') || !visible(el)) continue; k++; rg.selectNodeContents(n); for (const q of rg.getClientRects()) if (q.width > 8 && q.height > 4) tr.push(docR(q)); }
      if (tr.length < 2) { out.splits.push({ head: headOf(s), kind: 'none' }); continue; }
      const T = { l: Math.min(...tr.map((q) => q.l)), r: Math.max(...tr.map((q) => q.r)), t: Math.min(...tr.map((q) => q.t)), b: Math.max(...tr.map((q) => q.b)) };
      const beside = pics.filter(({ m, span, held }) => (s.contains(m) || held) && Math.min(span.b, sr.b) - Math.max(span.t, sr.t) >= Math.min(sr.b - sr.t, span.b - span.t) * 0.5);
      if (!beside.length) { out.splits.push({ head: headOf(s), kind: 'none' }); continue; }
      const P = { l: Math.min(...beside.map((x) => x.span.l)), r: Math.max(...beside.map((x) => x.span.r)) };
      const ov = Math.min(P.r, T.r) - Math.max(P.l, T.l), pw = P.r - P.l, tw2 = T.r - T.l;
      if (ov > Math.min(pw, tw2) * 0.15 || pw < W * 0.2 || tw2 < W * 0.15) { out.splits.push({ head: headOf(s), kind: 'other' }); continue; }
      // (the text's column: the section itself when the picture is held beside it, else the text's own width)
      const col = beside.every((x) => !s.contains(x.m)) ? Math.max(tw2, sr.r - sr.l) : tw2;
      out.splits.push({ head: headOf(s), kind: 'split', side: P.l < T.l ? 'left' : 'right', share: +(pw / (pw + col)).toFixed(2) });
    }
  }

  // --- a column that runs out (desktop): in a split of two columns, the left one ends while the right one runs on for
  // a third of a screen or more, so the rest of the right column has nothing beside it (r9-p42's order list)
  out.runOn = [];
  if (W >= 1100) {
    const content = (el) => {
      const rs = []; const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); const rg = document.createRange(); let n, k = 0;
      while ((n = tw.nextNode()) && k < 600) { if (!norm(n.nodeValue) || !n.parentElement || !visible(n.parentElement)) continue; k++; rg.selectNodeContents(n); for (const q of rg.getClientRects()) if (q.width > 1 && q.height > 1) rs.push(q); }
      for (const m of el.querySelectorAll('img, video, canvas, [data-ui], input, select, textarea')) if (visible(m)) rs.push(m.getBoundingClientRect());
      return rs;
    };
    let k = 0;
    for (const row of B.querySelectorAll('*')) {
      if (++k > 6000 || out.runOn.length >= 4) break;
      if (row.childElementCount < 2 || row.closest('header, nav, footer, [data-ui], dialog, .scene, [data-scene], [data-hero], table')) continue;
      const rr = row.getBoundingClientRect(); if (rr.width < W * 0.55 || rr.height < 200) continue;
      const kids = [...row.children].filter((c) => visible(c) && !/absolute|fixed/.test(css(c).position));
      if (kids.length !== 2) continue;
      const [a, b] = kids.map((c) => c.getBoundingClientRect()).map((r, i) => ({ el: kids[i], r }));
      const [L, R] = a.r.left <= b.r.left ? [a, b] : [b, a];
      if (Math.min(L.r.right, R.r.right) - Math.max(L.r.left, R.r.left) > 8 || L.r.width < W * 0.15) continue;
      if ([L.el, ...L.el.querySelectorAll('*')].some((e) => css(e).position === 'sticky')) continue;
      const lc = content(L.el), rc = content(R.el); if (!lc.length || rc.length < 4) continue;
      const lb = Math.max(...lc.map((q) => q.bottom)), rb = Math.max(...rc.map((q) => q.bottom)), lt = Math.min(...lc.map((q) => q.top)), rt = Math.min(...rc.map((q) => q.top));
      const media = rc.filter((q) => q.width * q.height > W * H * 0.04).reduce((t, q) => t + q.height, 0);
      if (rb - lb < Math.max(280, H * 0.3) || lt > rt + 60 || media > (rb - rt) * 0.5) continue;
      out.runOn.push({ head: textOf(L.el.querySelector('h1, h2, h3, h4') || L.el).slice(0, 40), gap: Math.round(rb - lb), y: Math.round(lb + sy) });
    }
  }

  // --- credits: the page's credits list (a dialog, list or section named for credits) against the pictures it shows.
  // A picture is named by an entry when its file's words, or the title its assets/credits.json record gives it, are in
  // the entry. Pictures the page shows that no entry names, when there are more pictures than entries, or a recorded
  // picture whose source no entry names, are reported.
  out.credits = null;
  {
    const CRED = /credit|bildnachweis|fotonachweis|image sources|picture sources|photo sources|photographs? by/i;
    const named = (el) => CRED.test([el.id, typeof el.className === 'string' ? el.className : '', el.getAttribute('aria-label') || '', el.getAttribute('aria-labelledby') ? textOf(document.getElementById(el.getAttribute('aria-labelledby')) || el).slice(0, 40) : '', textOf(el.querySelector('h1, h2, h3, h4') || document.createElement('i'))].join(' '));
    const conts = [...document.querySelectorAll('dialog, section, aside, div, ul, ol, details')].filter((el) => named(el) && !el.closest('nav'));
    const entriesOf = (c) => [...c.querySelectorAll('li, p')].filter((e) => !e.querySelector('li, p') && (e.querySelector('a[href]') || /\bby\b|\bcc\b|public domain|unsplash|pexels|wikimedia|commons|licen[cs]e/i.test(textOf(e))) && words(textOf(e)) >= 2);
    const best = conts.map((c) => ({ c, e: entriesOf(c) })).filter((x) => x.e.length).sort((p, q) => q.e.length - p.e.length)[0];
    if (best) {
      const fold = (s) => String(s || '').toLowerCase().replace(/ð/g, 'd').replace(/þ/g, 'th').replace(/æ/g, 'ae').replace(/[øœ]/g, 'o').replace(/ß/g, 'ss').replace(/ł/g, 'l').normalize('NFKD').replace(/\p{M}/gu, '').replace(/[^a-z0-9]+/g, ' ').trim();
      const dec = (u) => { try { return decodeURIComponent(u); } catch { return u; } };
      const entries = best.e.map((e) => fold(textOf(e) + ' ' + [...e.querySelectorAll('a[href]')].map((a) => dec(a.getAttribute('href'))).join(' ')));
      // the pictures shown: photographs at 64px or more, outside dialogs and the product's windows, by file
      const keyOf = (u) => { let p = u; try { const x = new URL(u, location.href); p = (x.origin === location.origin ? '' : x.host) + decodeURIComponent(x.pathname); } catch { p = String(u).split(/[?#]/)[0]; } return p; };
      const base = (k) => (k.split('/').filter(Boolean).slice(-1)[0] || '').replace(/\.[a-z0-9]{2,5}$/i, '');
      const shown = new Map();
      for (const el of B.querySelectorAll('img, video, [style*="background-image"], figure, div, section, span')) {
        if (el.closest('dialog, [role=dialog], [data-ui], nav, header[role=banner]')) continue;
        let src = null;
        if (el.tagName === 'IMG') src = el.currentSrc || el.src; else if (el.tagName === 'VIDEO') src = el.getAttribute('poster') || el.currentSrc; else { const bi = css(el).backgroundImage; const m = bi && bi.match(/url\(["']?([^"')]+)/); if (m && /cover|contain/.test(css(el).backgroundSize)) src = m[1]; }
        if (!src || /^data:|\.svg(\?|#|$)/i.test(src)) continue;
        if (!el.getClientRects().length || css(el).display === 'none') continue;
        const r = el.getBoundingClientRect(); if (r.width < 64 || r.height < 48) continue;
        const k = keyOf(src); if (!shown.has(k)) shown.set(k, base(k));
      }
      // (the record assets.mjs keeps of each picture it fetched: its file and the source's title and page)
      let ledger = [];
      for (const p of ['assets/credits.json', 'credits.json', 'images/credits.json', 'img/credits.json']) { try { const res = await fetch(p, { cache: 'no-store' }); if (res.ok) { const j = await res.json(); if (Array.isArray(j)) { ledger = j; break; } } } catch {} }
      const GENERIC = new Set(['photo', 'photos', 'image', 'images', 'picture', 'pictures', 'hero', 'cover', 'crop', 'cropped', 'wide', 'tall', 'square', 'small', 'large', 'phone', 'mobile', 'desktop', 'tablet', 'thumb', 'final', 'edit', 'copy', 'retouched', 'background', 'still', 'poster', 'portrait', 'landscape', 'detail', 'close', 'closeup', 'night', 'morning', 'evening', 'summer', 'winter', 'spring', 'autumn', 'january', 'february', 'march', 'april', 'june', 'july', 'august', 'september', 'october', 'november', 'december']);
      const unmatched = [], ledgerMiss = [];
      for (const [k, b] of shown) {
        // (recorded: an entry names its title, its author or its page; "Rooms: photographs by Bekah Russom, Mark Solarski
        // and Ali Inay" credits three)
        const rec = ledger.find((l) => l && l.file && base(String(l.file)) === b);
        if (rec) {
          const t = fold(rec.title).slice(0, 40), pg = fold(dec(rec.page || '')).slice(-40), by = fold(rec.creator).split(' ').slice(0, 2).join(' ');
          if (!entries.some((e) => (t && e.includes(t)) || (pg && e.includes(pg)) || (by.length >= 5 && e.includes(by)))) ledgerMiss.push(b + (rec.title ? ` ("${String(rec.title).slice(0, 40)}")` : ''));
          continue;
        }
        // (not recorded: a word of its file name that one entry alone carries, or the service it came from)
        const toks = fold(b).split(' ').filter((w) => (w.length >= 4 && !GENERIC.has(w) && !/^\d+$/.test(w)) || /^\d{3,}$/.test(w));
        const host = /^[a-z0-9.-]+\.[a-z]{2,}\//i.test(k) ? fold(k.split('/')[0].replace(/^www\./, '').split('.').slice(-2, -1)[0] || '') : '';
        const one = (w) => entries.filter((e) => e.includes(w)).length === 1;
        if (!toks.some(one) && !(host.length >= 4 && entries.some((e) => e.includes(host)))) unmatched.push(b);
      }
      // (an entry may credit several pictures: "Roasted beans by …, pour-over by …, café table by …")
      const capacity = best.e.reduce((t, e) => { const s = textOf(e); const src = [...e.querySelectorAll('a[href]')].filter((a) => !/creativecommons\.org\/(licenses|publicdomain)|\/licen[cs]e/i.test(a.getAttribute('href'))).length; return t + Math.max(1, (s.match(/\bby\b/g) || []).length + (s.match(/\s+and\s+\p{Lu}/gu) || []).length, src); }, 0);
      out.credits = { entries: entries.length, capacity, pictures: shown.size, unmatched: unmatched.slice(0, 8), ledgerMiss: ledgerMiss.slice(0, 6), where: desc(best.c), shown: [...shown.values()].slice(0, 16) };
    }
  }
  return out;
}

// Round 11 (Leon, 29 October: "you scroll and the next section is already there, sometimes already in the first view"):
// space() is run at the top of the page after the walk, so every reveal has landed where it rests.
//   hero   the first screen: the block that holds the h1 (the page's blocks as layout() takes them) and what of the block
//          after it shows on the first screen: its words, a picture, a box, or its ground where it differs from the
//          hero's, 8px or more above the foot of the screen (hero-not-alone)
//   air    on desktop, the empty height between one block's last content and the next one's first (words, pictures,
//          controls, boxes), under 12% of the screen; a scene or a pinned stage, whose content moves, is left out, and
//          so are the parts of one block (section-air)
export function space() {
  const W = innerWidth, H = innerHeight, SY = scrollY || 0, B = document.body, D = document.documentElement;
  const memo = new Map(); const css = (e) => { let c = memo.get(e); if (!c) { c = getComputedStyle(e); memo.set(e, c); } return c; };
  const shown = (el) => { for (let p = el, i = 0; p && p !== B && i < 30; p = p.parentElement, i++) { const cs = css(p); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return false; if (i < 4 && (cs.clip === 'rect(0px, 0px, 0px, 0px)' || /inset\(50%\)/.test(cs.clipPath))) return false; } return true; };
  const layered = (el) => { for (let p = el; p && p !== B; p = p.parentElement) if (/fixed/.test(css(p).position)) return true; return false; };
  const norm = (t) => (t || '').replace(/\s+/g, ' ').trim();
  const rgba = (c) => { const s = String(c || ''); const k = s.match(/color\(srgb\s+([-\d.e]+)\s+([-\d.e]+)\s+([-\d.e]+)(?:\s*\/\s*([-\d.e]+))?\s*\)/); if (k) return [k[1] * 255, k[2] * 255, k[3] * 255, k[4] != null ? +k[4] : 1]; const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
  const groundOf = (el) => { for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const c = rgba(css(e).backgroundColor); if (c && c[3] >= 0.9) return c; if (css(e).backgroundImage !== 'none' && /url\(/.test(css(e).backgroundImage)) return 'picture'; } return [255, 255, 255, 1]; };
  const same = (a, b) => (a === 'picture' || b === 'picture' ? a === b : [0, 1, 2].every((i) => Math.abs(a[i] - b[i]) < 6));
  const sel = (el) => (el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '')).slice(0, 50);
  const headOf = (s) => { const h = s.querySelector('h1, h2, h3, [role=heading]'); return norm(h ? h.innerText : s.innerText).slice(0, 48); };
  // the page's blocks: down through single wrappers, a tall block split into its parts (the parts of one block keep its
  // group), the site's bar and fixed layers left out
  // (a site bar 120px tall or more, a masthead laid over the hero, is the bar, not a block)
  const tall = (c) => { const r = c.getBoundingClientRect(); return r.height >= 120 && r.width >= W * 0.6 && css(c).position !== 'fixed' && shown(c) && !(c.matches('header, [role=banner]') && !c.querySelector('h1') && r.height < H * 0.3); };
  let root = B;
  for (let i = 0; i < 12; i++) { const kids = [...root.children].filter(tall); if (kids.length === 1) root = kids[0]; else break; }
  let blocks = [...root.children].filter(tall).map((el) => ({ el, group: el }));
  // (the parts of a section are one section; the parts of a wrapper, main or a div, are blocks of their own)
  const SECTION = 'section, article, aside, footer, [data-scene], [data-hero]';
  for (let pass = 0; pass < 2; pass++) blocks = blocks.flatMap((b) => { const k = [...b.el.children].filter(tall); return b.el.getBoundingClientRect().height > H * 1.6 && k.length >= 2 ? k.map((el) => ({ el, group: b.group !== b.el ? b.group : b.el.matches(SECTION) ? b.el : el })) : [b]; });
  blocks.sort((a, b) => a.el.getBoundingClientRect().top - b.el.getBoundingClientRect().top);
  // what a block shows: its words, pictures, controls and boxes (a fill narrower than the screen), in the flow
  const contentOf = (blk) => {
    const out = []; const tw = document.createTreeWalker(blk, NodeFilter.SHOW_TEXT); const rg = document.createRange(); let n, k = 0;
    while ((n = tw.nextNode()) && k < 1500) {
      const el = n.parentElement; if (!norm(n.nodeValue) || !el || el.closest('script, style, noscript, template, [aria-hidden=true]') || layered(el) || !shown(el)) continue;
      k++; rg.selectNodeContents(n); for (const q of rg.getClientRects()) if (q.width > 2 && q.height > 2) out.push({ what: el.closest('h1, h2, h3, h4') ? 'heading' : 'text', el, t: q.top, b: q.bottom, l: q.left, r: q.right, text: norm(el.closest('h1, h2, h3, h4, p, li, a, button, figcaption, blockquote, dt, dd, span, div')?.innerText || n.nodeValue).slice(0, 40) });
    }
    let m = 0;
    for (const el of blk.querySelectorAll('img, video, canvas, picture, iframe, svg, input, select, textarea, button, div, section, figure, a, li, article, span, aside')) {
      if (++m > 3000) break;
      if (el.parentElement?.closest('svg') || layered(el)) continue;
      const r = el.getBoundingClientRect(); if (r.width < 24 || r.height < 24) continue;
      let what = null;
      if (/^(IMG|VIDEO|CANVAS|PICTURE|IFRAME|svg)$/.test(el.tagName)) what = 'picture';
      else if (/^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(el.tagName)) what = 'control';
      else { const cs = css(el); if (/url\(/.test(cs.backgroundImage)) what = 'picture'; else if (r.width < W * 0.94) { const c = rgba(cs.backgroundColor); if (c && c[3] >= 0.5 && !same(c, groundOf(el.parentElement || B))) what = 'box'; } }
      if (what && shown(el)) out.push({ what, el, tag: el.tagName, t: r.top, b: r.bottom, l: r.left, r: r.right, text: (el.getAttribute('alt') || norm(el.innerText) || sel(el)).slice(0, 40) });
    }
    return out;
  };
  const moving = (el) => !!(el.closest('.scene, [data-scene], .pin-spacer') || el.querySelector('.scene, [data-scene], .pin-spacer') || [...el.querySelectorAll('*')].slice(0, 400).some((e) => css(e).position === 'sticky' && e.getBoundingClientRect().height > H * 0.5));
  const out = { blocks: blocks.length, hero: null, air: [] };
  // --- the first screen alone
  const h1 = [...document.querySelectorAll('h1')].find((h) => { const r = h.getBoundingClientRect(); return r.width > 2 && r.top + SY < H * 0.9 && shown(h); });
  // (a title set in a bar between two parts of the first screen, r8-p38's rail: the last block that starts on the top half)
  let hi = h1 ? blocks.findIndex((b) => b.el.contains(h1)) : -1;
  if (hi < 0) blocks.forEach((b, i) => { if (b.el.getBoundingClientRect().top + SY < H * 0.5) hi = i; });
  // (on a phone the first screen is the small viewport, the address bar shown: 100svh)
  let F = H;
  if (W < 600) { const p = document.createElement('div'); p.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:100svh;visibility:hidden;pointer-events:none'; B.appendChild(p); const v = p.getBoundingClientRect().height; p.remove(); if (v > 200 && v < H) F = Math.round(v); }
  if (hi >= 0 && SY < 2) {
    const hero = blocks[hi], next = blocks.slice(hi + 1).find((b) => b.group !== hero.group && b.el.getBoundingClientRect().top + SY >= hero.el.getBoundingClientRect().top + SY + 40);
    out.hero = { sel: sel(hero.el), bottom: Math.round(hero.el.getBoundingClientRect().bottom + SY), fold: F, next: null, cut: null };
    if (next) {
      const nr = next.el.getBoundingClientRect();
      let seen = null;
      if (nr.top < F - 8) {
        // (shown where it lies: a layer of the next scene held behind the hero, a fixed world, is under it, not in view)
        const hitStyle = document.createElement('style'); hitStyle.textContent = '*, *::before, *::after { pointer-events: auto !important; }'; document.head.appendChild(hitStyle);
        // (the item itself is what paints first at one of five points: a sheet or a cover of the scene's own laid over it,
        // through-the-openings' arch sheet over its cloister photograph, hides it)
        const paints = (e) => { const cs = css(e); if (+cs.opacity < 0.35) return false; if (/^(IMG|VIDEO|CANVAS|IFRAME|PICTURE|OBJECT|EMBED)$/.test(e.tagName) || e instanceof SVGElement) return true; if (cs.backgroundImage !== 'none') return true; const c = rgba(cs.backgroundColor); return !!c && c[3] >= 0.6; };
        const onTop = (c) => { const l = Math.max(c.l, 0), r = Math.min(c.r, W), t = Math.max(c.t, 0), b = Math.min(c.b, F - 1); if (r - l < 2 || b - t < 2) return false; for (const [fx, fy] of [[0.5, 0.5], [0.2, 0.2], [0.8, 0.2], [0.2, 0.8], [0.8, 0.8]]) { for (const e of document.elementsFromPoint(l + (r - l) * fx, t + (b - t) * fy)) { if (layered(e) || e === D || e === B) continue; if (e === c.el || c.el.contains(e)) { if (next.el.contains(e)) return true; break; } if (e.contains(c.el)) continue; if (paints(e)) break; } } return false; };
        let inView = [];
        // (named by what reads first: a heading, then words, then a picture or a box)
        const rank = { heading: 0, text: 1, picture: 2, box: 3, control: 4 };
        try { inView = contentOf(next.el).filter((c) => c.t < F - 8 && c.b > 0 && c.r > 0 && c.l < W && onTop(c)).sort((a, b) => rank[a.what] - rank[b.what] || a.t - b.t); } finally { hitStyle.remove(); }
        if (inView.length) seen = { what: inView[0].what, text: inView[0].text, px: Math.round(F - Math.max(0, inView[0].t)) };
        // its ground, where it differs from the hero's: what paints at the foot of the screen belongs to it
        if (!seen) {
          const hg = groundOf(hero.el);
          for (const fx of [0.1, 0.3, 0.5, 0.7, 0.9]) {
            const at = document.elementsFromPoint(W * fx, F - 6).find((e) => !layered(e) && e !== D && e !== B);
            if (!at || !next.el.contains(at)) continue;
            const g = groundOf(at);
            if (!same(g, hg)) { seen = { what: 'ground', text: g === 'picture' ? 'a picture' : `rgb(${g.slice(0, 3).join(', ')})`, px: Math.round(F - Math.max(0, nr.top)) }; break; }
          }
        }
      }
      out.hero.next = { sel: sel(next.el), head: headOf(next.el), top: Math.round(nr.top + SY), seen };
    }
    // the first screen's foot cutting through what comes next inside the hero: a line of words across the fold, or a
    // picture or box that starts in the lowest fifth of the screen and runs on under it (r9-p41: "2.6 Markdown Offline"
    // showing the tops of its letters under the product window)
    // (a canvas or a drawing may paint nothing where its box lies, and a layer laid on a picture that fills the first
    // screen is part of that picture: words are looked at there, not boxes)
    const hc = contentOf(hero.el);
    const filledBy = hc.some((c) => c.what === 'picture' && c.tag !== 'CANVAS' && c.tag !== 'svg' && (Math.min(c.r, W) - Math.max(c.l, 0)) * (Math.min(c.b, F) - Math.max(c.t, 0)) >= W * F * 0.9);
    // (display type of 56px or more that shows half its line or more is cropped at the foot on purpose, as the library deals
    // it; under half shows only the tops of the letters of what comes next)
    const cut = hc.filter((c) => (c.what === 'text' || c.what === 'heading' ? c.t < F - 8 && c.b > F + 2 && !((c.b - c.t) >= 56 && F - c.t >= (c.b - c.t) * 0.5) : !filledBy && !/^(CANVAS|svg|IFRAME)$/.test(c.tag) && c.t >= F * 0.8 && c.t < F - 8 && c.b > F + 2) && c.r > 0 && c.l < W).sort((a, b) => a.t - b.t);
    if (cut.length) out.hero.cut = { what: cut[0].what, text: cut[0].text, px: Math.round(F - cut[0].t), n: cut.length };
  }
  // --- the air between blocks (desktop)
  if (W >= 1100) {
    const parts = blocks.map((b) => { const c = contentOf(b.el).map((x) => ({ ...x, t: x.t + SY, b: x.b + SY })); return { ...b, moving: moving(b.el), first: c.length ? Math.min(...c.map((x) => x.t)) : null, last: c.length ? Math.max(...c.map((x) => x.b)) : null }; });
    for (let i = 1; i < parts.length; i++) {
      const a = parts[i - 1], b = parts[i];
      if (a.group === b.group || a.moving || b.moving || a.last == null || b.first == null) continue;
      const gap = Math.round(b.first - a.last);
      if (gap < H * 0.12) out.air.push({ a: headOf(a.el), b: headOf(b.el), aSel: sel(a.el), bSel: sel(b.el), gap, y: Math.round(a.last) });
      if (out.air.length >= 8) break;
    }
  }
  return out;
}

// navBar: the site's bar on the first screen (round 11; Leon: an info strip over the navigation is not modern, and r8-p38
// carried a sentence in its bar). The bar is the <header> outside the page's sections, the [role=banner], or the strip
// round the first <nav> with two links or more; when it is taller than a strip, the strip round its links.
//   items     links and buttons in the bar of more than three words (the wordmark's own link aside)
//   sentences text in the bar that is not a link: four words or more, or a sentence that ends in a full stop
//   above     words above the bar's row of links, when that row sits near the top of the page: an announcement or info
//             strip (the wordmark of a bar stacked in two rows aside)
export function navBar() {
  const W = innerWidth, H = innerHeight, SY = scrollY || 0, B = document.body;
  const shows = (el) => { for (let e = el; e && e !== document.documentElement; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.1 || e.hidden) return false; } const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return false; const cs = getComputedStyle(el); return !(cs.clip === 'rect(0px, 0px, 0px, 0px)' || /inset\(50%\)/.test(cs.clipPath) || (r.width <= 2 && r.height <= 2)); };
  const norm = (t) => (t || '').replace(/\s+/g, ' ').trim();
  // (a word has a letter: a phone number or opening hours, "+49 30 1234 5678", are not a sentence)
  const words = (t) => (norm(t).match(/\S*\p{L}\S*/gu) || []).length;
  const strip = (el) => { const r = el.getBoundingClientRect(); return r.width >= W * 0.5 && r.height <= Math.max(160, H * 0.25) && r.height >= 16; };
  const home = (a) => { const h = (a.getAttribute('href') || '').trim(); if (['#', '#top', '/', './', 'index.html', './index.html'].includes(h) || a.matches('[data-wordmark], [rel=home]')) return true; try { const u = new URL(h, location.href); return u.origin === location.origin && u.pathname.replace(/index\.html?$/, '') === location.pathname.replace(/index\.html?$/, '') && (!u.hash || u.hash === '#top'); } catch { return false; } };
  const inSections = (el) => !!el.parentElement?.closest('main, section, article, [data-scene]');
  const linksIn = (el) => [...el.querySelectorAll('a[href], button')].filter((a) => !a.closest('dialog, [role=dialog], [hidden], [aria-hidden=true]') && shows(a));
  const heads = [...document.querySelectorAll('header, [role=banner]')].filter((h) => !inSections(h) && shows(h) && linksIn(h).length >= 1 && h.getBoundingClientRect().top < H);
  const nav = [...document.querySelectorAll('nav')].find((n) => !n.closest('dialog, [role=dialog], [hidden], footer') && shows(n) && linksIn(n).length >= 2 && n.getBoundingClientRect().top < H);
  // (the header that holds the nav first; a hero set in a <header> with one button, the nav standing apart, is not the bar)
  let bar = (nav && heads.find((h) => h.contains(nav))) || heads.find((h) => !nav || strip(h) || linksIn(h).length >= 2) || null;
  if (!bar && nav) { bar = nav; for (let e = nav; e && e !== B; e = e.parentElement) { if (strip(e)) bar = e; else if (e.getBoundingClientRect().height > Math.max(160, H * 0.25)) break; } }
  if (!bar) return null;
  // a bar taller than a strip (a hero set in the header): the strip round its links, or round its first link or button
  // at its top when the links are folded away (a phone); none there, no bar to judge
  if (!strip(bar)) {
    const top0 = bar.getBoundingClientRect().top;
    const anchor = nav && bar.contains(nav) ? nav : linksIn(bar).filter((a) => a.getBoundingClientRect().top < top0 + 120).sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0];
    if (!anchor) return null;
    let s = null; for (let e = anchor; e && e !== bar; e = e.parentElement) if (strip(e)) s = e;
    bar = s || anchor;
  }
  const br = bar.getBoundingClientRect();
  const out = { bar: (bar.tagName.toLowerCase() + (bar.className && typeof bar.className === 'string' ? '.' + bar.className.trim().split(/\s+/)[0] : '')).slice(0, 40), top: Math.round(br.top + SY), h: Math.round(br.height), items: [], sentences: [], above: [] };
  const links = linksIn(bar);
  // (an article is not counted: "Ask for a room" is three words; an icon button's label nobody sees is not read)
  for (const a of links) { if (a.matches('a') && home(a)) continue; const t = norm(a.innerText || ''); if (words(t.replace(/\b(a|an|the)\b/gi, ' ')) > 3) out.items.push(t.slice(0, 60)); }
  // the words in the bar outside its links and buttons, by block
  const seen = new Set(); const tw = document.createTreeWalker(bar, NodeFilter.SHOW_TEXT); let n;
  while ((n = tw.nextNode())) {
    const el = n.parentElement; if (!norm(n.nodeValue) || !el || el.closest('a, button, script, style, dialog, [role=dialog], [hidden], [aria-hidden=true], .sr-only, .visually-hidden') || !shows(el)) continue;
    let blk = el; while (blk.parentElement && blk.parentElement !== bar && /^inline/.test(getComputedStyle(blk).display)) blk = blk.parentElement;
    if (seen.has(blk)) continue; seen.add(blk);
    if (blk.closest('a, button')) continue;
    const t = norm(blk.innerText || blk.textContent); const nw = words(t);
    if (nw >= 4 || (nw >= 2 && /[.!?](\s|$)/.test(t))) out.sentences.push(t.slice(0, 70));
  }
  // the bar's row of links (the row with the most), and anything with words above it while it sits near the top
  const rows = []; for (const a of links) { const r = a.getBoundingClientRect(), c = (r.top + r.bottom) / 2; const row = rows.find((x) => Math.abs(x.c - c) <= 12); if (row) { row.n++; row.top = Math.min(row.top, r.top); row.els.push(a); } else rows.push({ c, n: 1, top: r.top, els: [a] }); }
  const row = rows.sort((a, b) => b.n - a.n || b.c - a.c)[0];
  // (a row of two items or more, the wordmark and a menu button at least; the box that holds the row is the bar's own,
  // and words in it are the bar's, not a strip over it: a side index stacks its links and has no row)
  let rowBox = row ? row.els[0] : null; if (row) while (rowBox && !row.els.every((a) => rowBox.contains(a))) rowBox = rowBox.parentElement;
  // (the wordmark's own row is the bar's too: a bar that wraps on a phone sets the name and the action over the links)
  const mark = links.find((a) => a.matches('a') && home(a)) || bar.querySelector('[data-wordmark]');
  const markC = mark ? (() => { const q = mark.getBoundingClientRect(); return (q.top + q.bottom) / 2; })() : null;
  if (row && row.n >= 2 && row.top + SY >= 20 && row.top + SY <= 200) {
    const tw2 = document.createTreeWalker(B, NodeFilter.SHOW_TEXT); const rg = document.createRange(); const blocks = new Set();
    while ((n = tw2.nextNode())) {
      const el = n.parentElement; if (!norm(n.nodeValue) || !el || el.closest('script, style, noscript, template, dialog, [role=dialog], [hidden], [aria-hidden=true]') || !shows(el)) continue;
      rg.selectNodeContents(n); const q = rg.getBoundingClientRect(); if (q.bottom > row.top + 2 || q.top < -2 || q.width < 2) continue;
      const a = el.closest('a'); if ((a && home(a)) || (rowBox && rowBox !== B && rowBox.contains(el)) || (markC != null && bar.contains(el) && Math.abs((q.top + q.bottom) / 2 - markC) <= 14)) continue;
      const blk = el.closest('p, div, li, span, a, button, h1, h2, h3, h4, h5, h6, aside, section') || el;
      if (blocks.has(blk)) continue; blocks.add(blk);
      out.above.push(norm(blk.innerText || n.nodeValue).slice(0, 60));
      if (out.above.length >= 4) break;
    }
  }
  return out;
}

// crops: pictures whose crop cuts away a large part of them while they carry lettering, or are the work itself (round 11,
// r10-p47: ZUIDKAI, KAAP and "Pelik" shown cut). A picture carries lettering when its alt text speaks of a name, a word,
// letters, capitals, a title, a logo or a sign; it is the work when it sits under a heading or in a block named for the
// work (work, projects, case studies, frames, stills, portfolio, selected). The crop: what object-fit cover and the boxes that
// clip it take off its width or height, or, for a file that is a crop of another the page loaded (pelikaan-tall.png of
// pelikaan.png), how much of the other's width or height it keeps.
export function crops() {
  const W = innerWidth, H = innerHeight;
  // (not "type", "text" or "caps": a camera turned toward the text or a row of bottle caps has no words to cut)
  const LETTER = /\b(names?|words?|letters?|lettering|capitals|typeface|titles?|headline|logo|wordmark|signs?|signage|poster|ident|captions?)\b/i;
  // (not "works" or "cases": "How it works" and "Use cases" are not the work)
  const WORK = /\b(work|projects?|case[- ]stud\w*|frames?|stills?|portfolio|selected|showreel|reel|gallery)\b/i;
  const norm = (t) => (t || '').replace(/\s+/g, ' ').trim();
  const shows = (el) => { for (let e = el; e && e !== document.documentElement; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.1) return false; } return true; };
  const fileOf = (u) => { try { return decodeURIComponent(new URL(u, location.href).pathname); } catch { return String(u).split(/[?#]/)[0]; } };
  const SUFFIX = /[-_.](tall|wide|square|portrait|landscape|crop|cropped|phone|mobile|desktop|tablet|vertical|horizontal|sm|md|lg|xl|small|medium|large|thumb|card|cover|hero|\d{2,4}w|\d{2,4}x\d{2,4})$/i;
  const stemOf = (f) => { let s = f.replace(/\.(jpe?g|png|webp|avif|gif)$/i, ''); for (let i = 0; i < 3 && SUFFIX.test(s); i++) s = s.replace(SUFFIX, ''); return s; };
  // the other files the page loaded, by their stems, with their sizes where an img on the page shows them
  const loaded = new Map();
  for (const im of document.images) if (im.naturalWidth && im.currentSrc) { const f = fileOf(im.currentSrc); loaded.set(f, { w: im.naturalWidth, h: im.naturalHeight }); }
  const out = [];
  for (const im of document.images) {
    if (!im.naturalWidth || !im.currentSrc || /\.svg/i.test(im.currentSrc) || im.closest('nav, dialog, [role=dialog], [data-ui], header[role=banner]') || !shows(im)) continue;
    const r = im.getBoundingClientRect(); if (r.width * r.height < W * H * 0.02) continue;
    const alt = norm(im.getAttribute('alt'));
    // (named for the work by the section's id or heading, or by the picture's folder: a class such as "rw-frame" names a
    // frame of the layout, not the work)
    const sec = im.closest('section, [data-scene]'), hd = sec?.querySelector('h1, h2, h3');
    const work = WORK.test([sec?.id, hd ? hd.innerText : '', fileOf(im.currentSrc).split('/').slice(-2, -1)[0] || ''].join(' '));
    const lettering = LETTER.test(alt);
    // (a picture across the whole width is a ground, cropped by nature, unless it carries lettering)
    if (!lettering && (!work || r.width >= W * 0.9)) continue;
    const cs = getComputedStyle(im);
    // object-fit: the share of the picture's width and height the box shows
    let kw = 1, kh = 1;
    if (cs.objectFit === 'cover') { const s = Math.max(r.width / im.naturalWidth, r.height / im.naturalHeight); kw = r.width / (im.naturalWidth * s); kh = r.height / (im.naturalHeight * s); }
    // the boxes that clip it (a frame narrower than the picture)
    let cl = { l: r.left, r: r.right, t: r.top, b: r.bottom };
    for (let e = im.parentElement, i = 0; e && e !== document.body && i < 6; e = e.parentElement, i++) { const c = getComputedStyle(e); if (c.overflowX !== 'visible' || c.overflowY !== 'visible') { const q = e.getBoundingClientRect(); cl = { l: Math.max(cl.l, q.left), r: Math.min(cl.r, q.right), t: Math.max(cl.t, q.top), b: Math.min(cl.b, q.bottom) }; } }
    if (cl.r > cl.l && cl.b > cl.t) { kw *= (cl.r - cl.l) / r.width; kh *= (cl.b - cl.t) / r.height; }
    // a file that is a crop of another the page loaded
    let from = null;
    const f = fileOf(im.currentSrc), stem = stemOf(f), bare = (x) => x.replace(/\.(jpe?g|png|webp|avif|gif)$/i, '');
    // (only a file named as a crop, pelikaan-tall, of the file named plainly, pelikaan)
    for (const [g, s] of stem !== bare(f) ? loaded : []) {
      if (g === f || bare(g) !== stem) continue;
      const a0 = s.w / s.h, a1 = im.naturalWidth / im.naturalHeight;
      const keep = a1 < a0 ? a1 / a0 : a0 / a1; // the share of the wider one's width (or the taller one's height) kept
      if (keep < 0.85 && s.w * s.h > im.naturalWidth * im.naturalHeight * 0.5) { from = { file: g.split('/').pop(), keep, axis: a1 < a0 ? 'width' : 'height' }; break; }
    }
    const cutW = 1 - kw, cutH = 1 - kh, cutFrom = from ? 1 - from.keep : 0;
    const cut = Math.max(cutW, cutH, cutFrom);
    if (cut < 0.15) continue;
    out.push({ file: f.split('/').pop().slice(0, 48), cut: +cut.toFixed(2), axis: cutFrom >= Math.max(cutW, cutH) ? from.axis : cutW >= cutH ? 'width' : 'height', from: cutFrom >= Math.max(cutW, cutH) && from ? from.file : null, lettering, work, alt: alt.slice(0, 80) });
    if (out.length >= 8) break;
  }
  return out;
}

// Round 11b (the round-11 test pages: r11-p51, a motion designer's portfolio on seven grounds and panels, its work shown
// as type cards, its footer read by the judge as one credit line). Each runs at the top of the page after the walk, on
// desktop.
//   grounds    the tones of the page's grounds and large panels: its own ground, every block across the width and every
//              panel of 8% of a screen or more (a frame behind a picture is the picture; a product window counts by its
//              own frame, which the sheet sets in the page's colours, and what is inside it is the product's), tones a
//              step apart taken as one, and which of them is the page's, the ink, the accent or a dealt field (the
//              dealt palette's, else the text's and the buttons') (surface-count)
export function grounds(pal = null) {
  const W = innerWidth, H = innerHeight, B = document.body, D = document.documentElement;
  const memo = new Map(); const css = (e) => { let c = memo.get(e); if (!c) { c = getComputedStyle(e); memo.set(e, c); } return c; };
  const rgba = (c) => { const s = String(c || ''); const k = s.match(/color\(srgb\s+([-\d.e]+)\s+([-\d.e]+)\s+([-\d.e]+)(?:\s*\/\s*([-\d.e]+))?\s*\)/); if (k) return [k[1] * 255, k[2] * 255, k[3] * 255, k[4] != null ? +k[4] : 1]; const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
  const fromHex = (h) => (/^#[0-9a-f]{6}$/i.test(h || '') ? [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) : null);
  const hex = (c) => '#' + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  const desc = (e) => e.tagName.toLowerCase() + (e.classList && e.classList.length ? '.' + [...e.classList].slice(0, 2).join('.') : '');
  // (shown: laid out and at half its opacity or more, a layer faded away is not a ground)
  const shown = (el) => { let o = 1; for (let e = el; e && e !== D; e = e.parentElement) { const cs = css(e); if (cs.display === 'none' || cs.visibility === 'hidden') return false; o *= +cs.opacity; } return o >= 0.5; };
  // the distance between two tones in CIE Lab: under 8 is a step of one tone, under 3 the same tone to the eye
  const lab = (c) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; const [r, g, b] = c.slice(0, 3).map(f); const t = (v) => (v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116); const x = t((r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047), y = t(r * 0.2126 + g * 0.7152 + b * 0.0722), z = t((r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883); return [116 * y - 16, 500 * (x - y), 200 * (y - z)]; };
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const near = (a, b) => dist(a, b) < 8;
  const tones = []; const add = (c, area, where, wide) => { const k = hex(c); const t = tones.find((x) => x.hex === k); if (t) { t.area += area; t.wide = t.wide || wide; } else tones.push({ hex: k, lab: lab(c), area, where, wide }); };
  const own = [B, D].map((e) => rgba(css(e).backgroundColor)).find((c) => c && c[3] >= 0.9) || [255, 255, 255, 1];
  add(own, W * H, 'page', true);
  let k = 0;
  for (const el of B.querySelectorAll('*')) {
    if (++k > 8000) break;
    if (/^(IMG|VIDEO|CANVAS|PICTURE|IFRAME|INPUT|BUTTON|SELECT|TEXTAREA|OPTION)$/.test(el.tagName) || el instanceof SVGElement) continue;
    if (el.parentElement?.closest('[data-ui]') || el.closest('nav, dialog, [role=dialog]')) continue;
    const c = rgba(css(el).backgroundColor); if (!c || c[3] < 0.9) continue;
    const r = el.getBoundingClientRect(); if (Math.min(r.right, W) - Math.max(r.left, 0) < W * 0.1) continue;
    const wide = r.width >= W * 0.94 && r.height >= 120;
    if (!wide && r.width * r.height < W * H * 0.08) continue;
    // (the site's bar, fixed or sticky over the page, is the navigation's business)
    if (/fixed|sticky/.test(css(el).position) && r.height < H * 0.3) continue;
    if (!shown(el) || [...el.querySelectorAll('img, video, canvas')].some((p) => { const q = p.getBoundingClientRect(); return q.width * q.height >= r.width * r.height * 0.85; })) continue;
    add(c, r.width * r.height, desc(el), wide);
  }
  // the ink, the accent and the dealt fields: the dealt palette's, else the page's text and the fill its buttons carry most
  let ink = fromHex(pal?.ink) || rgba(css(B).color), accent = fromHex(pal?.accent);
  if (!accent) { const n = new Map(); for (const a of document.querySelectorAll('a, button')) { const c = rgba(css(a).backgroundColor), r = a.getBoundingClientRect(); if (!c || c[3] < 0.9 || r.height < 32 || r.height > 96 || r.width > W * 0.5) continue; n.set(hex(c), (n.get(hex(c)) || 0) + 1); } const top = [...n.entries()].sort((a, b) => b[1] - a[1])[0]; if (top) accent = fromHex(top[0]); }
  const inkLab = ink ? lab(ink) : null, accentLab = accent ? lab(accent) : null, fieldLabs = (pal?.fields || []).map(fromHex).filter(Boolean).map(lab);
  // tones a step apart are one, each joined to the largest tone of its group and never along a chain (greys stepped
  // down the page one by one are each a ground): a block across the width joins a tone under 3 from it, a panel one
  // under 8 (a card a step off its ground reads as that ground's surface)
  const groups = [];
  for (const t of [...tones].sort((a, b) => b.area - a.area)) {
    const at = groups.map((g) => [g, dist(g[0].lab, t.lab)]).filter(([, d]) => d < (t.wide ? 3 : 8)).sort((a, b) => a[1] - b[1])[0];
    if (at) at[0].push(t); else groups.push([t]);
  }
  return groups.map((g) => ({ hex: g[0].hex, where: g.find((x) => x.where === 'page') ? 'page' : g[0].where, n: g.length, share: +(g.reduce((s, x) => s + x.area, 0) / (W * H)).toFixed(2),
    role: g.some((x) => x.where === 'page') ? 'page' : inkLab && g.some((x) => near(x.lab, inkLab)) ? 'ink' : accentLab && g.some((x) => near(x.lab, accentLab)) ? 'accent' : fieldLabs.some((f) => g.some((x) => near(x.lab, f))) ? 'field' : null }));
}

//   footing    the site's footer as built: the last <footer> or [role=contentinfo] outside the page's sections (else the
//              last block named for a footer, else the last <footer> anywhere but in an article, a quote or a dialog: one
//              built inside <main>), its height and the rows its words stand on (footer-not-as-dealt)
export function footing() {
  const SY = scrollY || 0;
  const norm = (t) => (t || '').replace(/\s+/g, ' ').trim();
  const shows = (el) => { for (let e = el; e && e !== document.documentElement; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.1) return false; } return el.getClientRects().length > 0; };
  const outside = (f) => !f.parentElement?.closest('main, section, article, footer, [data-scene], dialog, [role=dialog]');
  const foot = [...document.querySelectorAll('footer, [role=contentinfo]')].filter((f) => outside(f) && shows(f)).pop()
    || [...document.querySelectorAll('[class*=footer i], [id*=footer i]')].filter((f) => outside(f) && shows(f) && f.getBoundingClientRect().height >= 16).pop()
    || [...document.querySelectorAll('footer, [role=contentinfo]')].filter((f) => !f.parentElement?.closest('article, blockquote, dialog, [role=dialog]') && shows(f)).pop();
  if (!foot) return { found: false };
  // its rows: the lines its words stand on, by their middles, 8px apart
  const rows = []; const tw = document.createTreeWalker(foot, NodeFilter.SHOW_TEXT); const rg = document.createRange(); let n;
  while ((n = tw.nextNode())) {
    if (!norm(n.nodeValue) || !n.parentElement || n.parentElement.closest('dialog, [role=dialog], [aria-hidden=true], .sr-only, .visually-hidden') || !shows(n.parentElement)) continue;
    rg.selectNodeContents(n); for (const q of rg.getClientRects()) { if (q.width < 2 || q.height < 2) continue; const m = (q.top + q.bottom) / 2 + SY; if (!rows.some((x) => Math.abs(x - m) <= 8)) rows.push(m); }
  }
  const r = foot.getBoundingClientRect();
  return { found: true, sel: foot.tagName.toLowerCase() + (typeof foot.className === 'string' && foot.className.trim() ? '.' + foot.className.trim().split(/\s+/)[0] : ''), h: Math.round(r.height), rows: rows.length, text: norm(foot.innerText).slice(0, 60) };
}

//   work       on a portfolio page: the sections named for the work (by their id, label or first heading; never the hero,
//              whose title is the page's, nor a heading about working, "How I work", "Let's work together", nor a block
//              that holds other sections), the pictures of the work they show (a photograph or a film of 2% of a screen
//              or more, each file once, shown or waiting on a hover), the slots marked for the client's own pictures
//              anywhere on the page (data-slot="work", 2% of a screen or more, no picture in them yet) and the pieces
//              set in type instead, a frame of words with no picture in it (portfolio-without-work)
export function workShown() {
  const W = innerWidth, H = innerHeight, SY = scrollY || 0;
  const WORK = /\b(work|projects?|case[- ]stud\w*|frames?|stills?|portfolio|selected|showreel|reel|gallery)\b/i;
  const NOT = /\b(how|way|where|why|when|what) (i|we) work\b|\bwork(ing)? (with|together)\b|\blet['’]?s work\b/gi;
  const norm = (t) => (t || '').replace(/\s+/g, ' ').trim();
  const named = (s) => WORK.test([s.id.replace(/[-_]+/g, ' '), s.getAttribute('aria-label') || '', norm(document.getElementById(s.getAttribute('aria-labelledby') || '')?.innerText), norm(s.querySelector('h1, h2, h3')?.innerText)].join(' ').replace(NOT, ' '));
  const hero = (s) => s.getBoundingClientRect().top + SY < H * 0.5;
  const all = [...document.querySelectorAll('section, article, [data-scene], div[id]')].filter((s) => !s.closest('nav, footer, dialog, [role=dialog]') && !(s.tagName === 'DIV' && s.querySelector('section, [data-scene]')) && !hero(s) && named(s));
  const secs = all.filter((s) => !all.some((o) => o !== s && o.contains(s)));
  const files = new Set(), held = new Set(); let typeset = 0;
  const slotted = (f) => f.closest('[data-slot="work"]') || f.querySelector('[data-slot="work"]');
  for (const s of secs) {
    for (const el of s.querySelectorAll('img, video, div, figure, a, li, span')) {
      if (el.closest('[data-ui]') || getComputedStyle(el).display === 'none') continue;
      const r = el.getBoundingClientRect(); if (r.width * r.height < W * H * 0.02) continue;
      let src = null;
      if (el.tagName === 'IMG') src = el.currentSrc || el.src; else if (el.tagName === 'VIDEO') src = el.currentSrc || el.getAttribute('src') || el.getAttribute('poster'); else { const m = getComputedStyle(el).backgroundImage.match(/url\(["']?([^"')]+)/); if (m) src = m[1]; }
      if (src && !/^data:|\.svg(\?|#|$)/i.test(src)) { files.add(src.split(/[?#]/)[0]); held.add(el); }
    }
    for (const f of s.querySelectorAll('[data-ui], figure[role=img]')) if (!f.parentElement?.closest('[data-ui]') && !f.querySelector('img, video, picture') && !slotted(f) && norm(f.innerText)) typeset++;
  }
  // a marked slot counts as a piece of the work until the client's picture is in it (then the picture counts)
  const slots = [...document.querySelectorAll('[data-slot="work"]')].filter((f) => { const r = f.getBoundingClientRect(); return r.width * r.height >= W * H * 0.02 && getComputedStyle(f).display !== 'none' && ![...held].some((e) => f.contains(e)); }).length;
  return { sections: secs.map((s) => norm(s.querySelector('h1, h2, h3')?.innerText || s.id).slice(0, 40)), pictures: files.size, slots, typeset };
}

// Round 11c (Leon: three button shapes at one size, a plain bar that hides on scroll; r12-p53's three unrelated buttons,
// r12-p54's six sections of a heading, a line and a list panel, r12-p52's page of slate boxes). On desktop.
//   navForm    the navigation in view now, at load, past the hero on the way down and after a short scroll back up: the
//              links and buttons of the site's bar (a header or nav outside the sections, at load) and of every layer fixed
//              to the screen or sticky outside the sections, on top where they lie, read as one form: a dock at the
//              bottom, a side index (three links or more to the page's own sections stacked at one side), a masthead (the
//              wordmark alone on its row and centred over the links; at load), a centred wordmark, corners (a group in each
//              top corner, nothing between them and no band behind them), a top bar, or none; whether a band lies behind
//              the top groups; and whether a scene or a sticky stage holds the screen (nav-not-as-dealt)
export function navForm(phase = 'load') {
  const W = innerWidth, H = innerHeight, B = document.body, D = document.documentElement;
  const css = (e) => getComputedStyle(e);
  const norm = (t) => (t || '').replace(/\s+/g, ' ').trim();
  const inSections = (el) => !!el.parentElement?.closest('main, section, article, [data-scene]');
  // (on top where it lies: on the screen, not faded, and what the screen shows at its middle)
  const onTop = (el) => { const r = el.getBoundingClientRect(); if (r.width < 4 || r.height < 4 || r.bottom <= 0 || r.top >= H || r.right <= 0 || r.left >= W) return false; for (let e = el; e && e !== D; e = e.parentElement) { const cs = css(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.5) return false; } const hit = document.elementFromPoint(Math.min(W - 1, Math.max(0, r.left + r.width / 2)), Math.min(H - 1, Math.max(0, r.top + r.height / 2))); return !!hit && (el.contains(hit) || hit.contains(el)); };
  // the layer that pins it: its outermost ancestor fixed to the screen, or sticky outside the sections (a sticky stage in a
  // section is the section's); any sticky one for a side index, which may stand in the page's grid
  const pinOf = (el, any = false) => { let p = null; for (let e = el; e && e !== B; e = e.parentElement) { const pos = css(e).position; if (pos === 'fixed' || (pos === 'sticky' && (any || !inSections(e)))) p = e; } return p; };
  const home = (a) => { const h = (a.getAttribute('href') || '').trim(); if (['#', '#top', '/', './', 'index.html', './index.html'].includes(h) || a.matches('[data-wordmark], [rel=home]')) return true; try { const u = new URL(h, location.href); return u.origin === location.origin && u.pathname.replace(/index\.html?$/, '') === location.pathname.replace(/index\.html?$/, '') && (!u.hash || u.hash === '#top'); } catch { return false; } };
  const inBar = (el) => { const b = el.closest('header, [role=banner]'); return !!el.closest('nav') || (!!b && !inSections(b)); };
  const clear = (e) => { const c = css(e).backgroundColor, a = c.match(/^rgba\(.*,\s*([\d.]+)\)$/); return c === 'transparent' || (!!a && +a[1] < 0.5); };
  const items = [], side = [];
  for (const a of document.querySelectorAll('a[href], button, [role=button]')) {
    if (a.closest('[data-ui], dialog, [role=dialog], [aria-hidden=true], footer') || !norm(a.innerText || a.getAttribute('aria-label')) || !onTop(a)) continue;
    const q = a.getBoundingClientRect(), it = { a, l: q.left, r: q.right, t: q.top, b: q.bottom, mark: a.matches('a') && home(a), pin: pinOf(a) };
    if (it.pin || (phase === 'load' && inBar(a))) items.push(it);
    if (/^#[^#\s]+$/.test(a.getAttribute('href') || '') && !it.mark && pinOf(a, true)) side.push(it);
  }
  const mid = (x) => (x.l + x.r) / 2;
  let form = 'none', band = false;
  // a dock: two items or more fixed in the lowest band of the screen, in one group (an action and a Top tab in the two
  // bottom corners are corners)
  const dock = items.filter((x) => x.pin && css(x.pin).position === 'fixed' && x.t > H * 0.6 && x.b > H - 160);
  if (dock.length && Math.max(...dock.map((x) => x.r)) - Math.min(...dock.map((x) => x.l)) > W * 0.6) dock.length = 0;
  // a side index: three links or more to the page's sections, stacked on one left edge, at one side of the screen
  const stack = side.filter((x) => x.r <= W * 0.3 || x.l >= W * 0.7).filter((x, i, a) => a.filter((y) => Math.abs(y.l - x.l) <= 16).length >= 3);
  const top = items.filter((x) => x.t < 140 && x.b < H * 0.3);
  // the wordmark: the bar's link home (a monogram may link home too), else a mark named so in it
  const marks = top.filter((x) => x.mark);
  let mark = marks[0] || null;
  if (!mark && top.length) { const m = [...document.querySelectorAll('[data-wordmark], header [class*=wordmark i], header [class*=logo i], nav [class*=wordmark i], nav [class*=logo i]')].find((e) => onTop(e) && e.getBoundingClientRect().top < 140); if (m) { const q = m.getBoundingClientRect(); mark = { l: q.left, r: q.right, t: q.top, b: q.bottom, a: m }; } }
  if (dock.length >= 2 && new Set(dock.map((x) => x.pin)).size === 1) form = 'bottom dock';
  else if (stack.length >= 3) form = 'side index';
  else if (top.length) {
    const rest = top.filter((x) => x !== mark && !(mark && mark.a.contains(x.a)));
    const markRow = mark ? rest.filter((x) => Math.abs((x.t + x.b) / 2 - (mark.t + mark.b) / 2) <= 12) : [];
    // (the links under the wordmark, the action at the end of their row aside)
    const under = mark ? rest.filter((x) => x.t >= mark.b - 2) : [];
    const links = under.filter((x) => clear(x.a));
    const span = links.length ? [Math.min(...links.map((x) => x.l)), Math.max(...links.map((x) => x.r))] : null;
    // (a band behind the groups: a fill across half the screen or more round all of them)
    if (top.length >= 2) { let c = top[0].a.parentElement; while (c && !top.every((x) => c.contains(x.a))) c = c.parentElement; for (let e = c; e && e !== B && e !== D; e = e.parentElement) { const q = e.getBoundingClientRect(); if (q.width >= W * 0.5 && q.top < 140 && !clear(e)) { band = true; break; } if (q.height > H * 0.3) break; } }
    if (phase === 'load' && mark && !markRow.length && links.length >= 2 && Math.abs(mid(mark) - (span[0] + span[1]) / 2) <= Math.max(48, (span[1] - span[0]) * 0.15) && mid(mark) > W * 0.15) form = 'masthead';
    else if ((marks.length ? marks : [mark]).some((m) => m && Math.abs(mid(m) - W / 2) <= W * 0.04)) form = 'centred wordmark';
    else if (top.some((x) => x.r <= W * 0.4) && top.some((x) => x.l >= W * 0.6) && top.every((x) => x.r <= W * 0.4 || x.l >= W * 0.6) && !band) form = 'corners';
    else form = 'top bar';
  }
  // the screen held by a scene or a sticky stage (a side index or a dock may step aside while one holds it)
  let held = false;
  for (let e = document.elementFromPoint(W / 2, H / 2); e && e !== B && e !== D; e = e.parentElement) { const q = e.getBoundingClientRect(); if ((css(e).position === 'sticky' || e.matches('.pin-spacer, [data-scene], .scene')) && q.height >= H * 0.8 && q.top <= 2) { held = true; break; } }
  return { phase, form, band, held, n: items.length, top: top.length, mark: mark ? norm(mark.a.innerText || mark.a.getAttribute('aria-label')).slice(0, 30) : null, items: top.slice(0, 6).map((x) => norm(x.a.innerText || x.a.getAttribute('aria-label')).slice(0, 20)) };
}

//   buttonShapes  the page's buttons by shape: every link or button drawn as one (a fill unlike its ground, or an outline
//              on three sides), or holding a drawn part half its height or more beside its label (a circle with an arrow),
//              by its corner (square to 3px, soft to 12px, round, pill, circle) and its kind (filled, outlined), with the
//              heights it is built at (the sheet sizes the one button to the bar, a card or a form, so a height is no shape
//              of its own); and every link or button set in type that stands alone as an action (not in a sentence or a
//              list, not the bar's links or the footer's). Controls that are not actions are left out: icons with no word,
//              labels over six words, tabs, switches and toggles (an accordion's rows), the skip link, the wordmark or a
//              monogram linking home, a card or a band set as a link (a heading or a 48px picture in it, or over 96px
//              tall), and the bar's own cells (of three drawn items or more in the bar, only the last is its action)
//              (button-family)
export function buttonShapes() {
  const W = innerWidth, SY = scrollY || 0, B = document.body;
  const memo = new Map(); const css = (e) => { let c = memo.get(e); if (!c) { c = getComputedStyle(e); memo.set(e, c); } return c; };
  const norm = (t) => (t || '').replace(/\s+/g, ' ').trim();
  const rgba = (c) => { const s = String(c || ''); const k = s.match(/color\(srgb\s+([-\d.e]+)\s+([-\d.e]+)\s+([-\d.e]+)(?:\s*\/\s*([-\d.e]+))?\s*\)/); if (k) return [k[1] * 255, k[2] * 255, k[3] * 255, k[4] != null ? +k[4] : 1]; const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
  const groundOf = (el) => { for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const c = rgba(css(e).backgroundColor); if (c && c[3] >= 0.9) return c; } return [255, 255, 255, 1]; };
  const differs = (a, b, d = 6) => !!a && !!b && [0, 1, 2].some((i) => Math.abs(a[i] - b[i]) >= d);
  const sides = (el) => { const cs = css(el); return ['Top', 'Right', 'Bottom', 'Left'].filter((s) => parseFloat(cs[`border${s}Width`]) >= 1 && cs[`border${s}Style`] !== 'none' && (rgba(cs[`border${s}Color`]) || [0, 0, 0, 0])[3] > 0.2).length; };
  // (shown on the page: laid out, at a third of its opacity or more, and not parked off the screen like a skip link)
  const shown = (el) => { for (let e = el, i = 0; e && e !== B && i < 30; e = e.parentElement, i++) { const cs = css(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.3) return false; } const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2 && r.right > 0 && r.left < W && r.bottom + SY > 0; };
  const drawn = (e) => { const c = rgba(css(e).backgroundColor); if (c && c[3] >= 0.5 && differs(c, groundOf(e.parentElement || B))) return 'filled'; return sides(e) >= 3 ? 'outlined' : null; };
  const corner = (e, q) => { const v = css(e).borderTopLeftRadius; const r = /%/.test(v) ? (parseFloat(v) / 100) * Math.min(q.width, q.height) : parseFloat(v) || 0; if (r >= q.height / 2 - 1) return Math.abs(q.width - q.height) <= 4 ? 'circle' : 'pill'; return r <= 3 ? 'square' : r <= 12 ? 'soft' : 'round'; };
  const inBar = (el) => { const b = el.closest('header, [role=banner]'); return !!el.closest('nav') || (!!b && !b.parentElement?.closest('main, section, article, [data-scene]')); };
  // (a link home, read as navForm reads the wordmark)
  const home = (a) => { const h = (a.getAttribute('href') || '').trim(); if (['#', '#top', '/', './', 'index.html', './index.html'].includes(h)) return true; try { const u = new URL(h, location.href); return u.origin === location.origin && u.pathname.replace(/index\.html?$/, '') === location.pathname.replace(/index\.html?$/, '') && (!u.hash || u.hash === '#top'); } catch { return false; } };
  const shapes = new Map(), bar = [];
  const add = (key, label, h = 0) => { const s = shapes.get(key) || { n: 0, labels: [], h: [] }; s.n++; if (s.labels.length < 2 && !s.labels.includes(label)) s.labels.push(label); if (h) s.h.push(Math.round(h)); shapes.set(key, s); };
  for (const el of document.querySelectorAll('a[href], button, [role=button], input[type=submit], input[type=button]')) {
    if (el.closest('[data-ui], dialog, [role=dialog], [aria-hidden=true], [role=tablist], summary') || el.matches('[role=tab], [role=switch], [aria-pressed], [aria-expanded], [data-wordmark], [rel=home]') || !shown(el)) continue;
    if (el.matches('a') && inBar(el) && home(el)) continue;
    // (the words counted on the whole label, before it is cut for the report)
    const text = norm(el.innerText || el.value || ''), label = text.slice(0, 30);
    if (!/\p{L}/u.test(text) || text.split(' ').length > 6 || /^skip\b/i.test(text)) continue;
    const q = el.getBoundingClientRect(); if (q.height > 96 || q.width > W * 0.6 || el.querySelector('h1, h2, h3, h4, h5, h6, [role=heading]') || [...el.querySelectorAll('img, picture, video, canvas')].some((m) => m.getBoundingClientRect().height >= 48)) continue;
    let how = drawn(el), box = el;
    if (!how) for (const c of el.querySelectorAll('*')) { const k = drawn(c), p = c.getBoundingClientRect(); if (k && p.height >= q.height * 0.5 && p.width >= 16) { how = k; box = c; break; } }
    if (how) {
      const p = box.getBoundingClientRect(), key = `${corner(box, p)} ${how}${box !== el ? ', beside its label' : ''}`;
      if (inBar(el)) bar.push({ key, label, x: q.left, h: p.height }); else add(key, label, p.height);
      continue;
    }
    // set in type: an action standing alone (a sentence's link and a list's are not)
    if (inBar(el) || el.closest('footer, li') || el.matches('a[href^="mailto:"], a[href^="tel:"]')) continue;
    const host = el.parentElement?.closest('p, dd, dt, td, th, h1, h2, h3, h4, h5, h6, figcaption, blockquote, label');
    if (host && norm(host.innerText).length > text.length + 2) continue;
    add('type', label);
  }
  for (const b of bar.length <= 2 ? bar : [bar.sort((x, y) => y.x - x.x)[0]]) add(b.key, b.label, b.h);
  return [...shapes].map(([key, s]) => ({ key, n: s.n, labels: s.labels, ...(s.h.length ? { h: [Math.min(...s.h), Math.max(...s.h)] } : {}) }));
}

//   structures each section's structure after the hero (the hero too, marked): where its heading stands against the rest
//              (over it, beside it), how many columns it makes at its widest row, and the largest group it holds (a list,
//              a list in a product window, cards, one panel, a product window, a picture or pictures, a form, a table, or
//              text), read as one word (split for a heading beside the rest, columns for two or more under it, grid,
//              gallery, list, table, single-picture, panel, tool, statement), and whether that group stands in a box
//              (cards, a panel, or a window drawn on a fill unlike its section's). A scene that shows nothing yet but its
//              heading is left out (same-structure, boxed-page)
export function structures() {
  const W = innerWidth, H = innerHeight, SY = scrollY || 0, B = document.body;
  const memo = new Map(); const css = (e) => { let c = memo.get(e); if (!c) { c = getComputedStyle(e); memo.set(e, c); } return c; };
  const visible = (el) => { for (let e = el, i = 0; e && e !== B && i < 30; e = e.parentElement, i++) { const cs = css(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return false; } const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2; };
  const norm = (t) => (t || '').replace(/\s+/g, ' ').trim();
  const words = (t) => (norm(t).match(/\S+/g) || []).length;
  const rgba = (c) => { const s = String(c || ''); const k = s.match(/color\(srgb\s+([-\d.e]+)\s+([-\d.e]+)\s+([-\d.e]+)(?:\s*\/\s*([-\d.e]+))?\s*\)/); if (k) return [k[1] * 255, k[2] * 255, k[3] * 255, k[4] != null ? +k[4] : 1]; const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
  const groundOf = (el) => { for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const c = rgba(css(e).backgroundColor); if (c && c[3] >= 0.9) return c; } return [255, 255, 255, 1]; };
  const differs = (a, b, d = 6) => !!a && !!b && [0, 1, 2].some((i) => Math.abs(a[i] - b[i]) >= d);
  const filled = (e) => { const c = rgba(css(e).backgroundColor); return !!c && c[3] >= 0.5 && differs(c, groundOf(e.parentElement || B)); };
  const area = (q) => Math.max(0, Math.min(W, q.right) - Math.max(0, q.left)) * Math.max(0, q.bottom - q.top);
  const union = (els) => { const rs = els.map((e) => e.getBoundingClientRect()); return { left: Math.min(...rs.map((q) => q.left)), right: Math.max(...rs.map((q) => q.right)), top: Math.min(...rs.map((q) => q.top)), bottom: Math.max(...rs.map((q) => q.bottom)) }; };
  // the sections as the splits take them (the innermost of section, scene, hero, a child of main), the footer aside
  const qual = (s) => { if (!visible(s) || s.closest('nav, footer, dialog, header[role=banner]')) return false; const r = s.getBoundingClientRect(); return r.height >= 160 && r.width >= W * 0.3; };
  const secs = [...document.querySelectorAll('section, [data-scene], [data-hero], main > div, main > article')].filter(qual).filter((s, i, a) => !a.some((o) => o !== s && s.contains(o))).sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top).slice(0, 30);
  const out = [];
  for (const s of secs) {
    const sr = s.getBoundingClientRect(), hero = !!s.querySelector('h1') || sr.top + SY < H * 0.5;
    const h = [...s.querySelectorAll(hero ? 'h1, h2' : 'h2, h3, [role=heading]')].find((x) => visible(x) && !x.closest('[data-ui]'));
    // the head block: the heading and the short text with it, up to the box that also holds a list, a picture or a form
    let hb = h;
    if (h) for (let e = h.parentElement; e && e !== s && s.contains(e); e = e.parentElement) { if (e.matches('ul, ol, dl, table, [role=list], form') || e.querySelector('img, video, canvas, [data-ui], ul, ol, dl, table, form, input, [role=list]') || words(e.innerText) > words(h.innerText) + 60) break; hb = e; }
    const hr = hb ? hb.getBoundingClientRect() : null;
    const apart = (el) => !(hb && (hb.contains(el) || el.contains(hb)));
    // (a band over the heading, a ticker, is not what the section holds; nor a link drawn as a button)
    const above = (q) => !!hr && q.bottom <= hr.top + 2;
    const parts = []; const part = (q) => { const l = Math.max(0, q.left), r = Math.min(W, q.right); if (r - l >= 4 && q.bottom - q.top >= 4 && !above(q)) parts.push({ l, r, t: q.top, b: q.bottom }); };
    const tw = document.createTreeWalker(s, NodeFilter.SHOW_TEXT); const rg = document.createRange(); let n, k = 0;
    while ((n = tw.nextNode()) && k < 800) { const el = n.parentElement; if (!norm(n.nodeValue) || !el || !apart(el) || el.closest('[aria-hidden=true]') || !visible(el)) continue; k++; rg.selectNodeContents(n); for (const q of rg.getClientRects()) part(q); }
    for (const m of s.querySelectorAll('img, video, canvas, [data-ui], input, textarea, select')) if (apart(m) && visible(m) && area(m.getBoundingClientRect()) > 400) part(m.getBoundingClientRect());
    const boxes = [...s.querySelectorAll('div, article, li, figure, aside, a, ul, ol')].filter((e) => { if (!apart(e) || !visible(e) || !filled(e)) return false; const q = e.getBoundingClientRect(); return q.width >= 80 && q.height >= 40 && q.width < W * 0.94 && !above(q) && !(e.matches('a') && q.height <= 64 && words(e.innerText) <= 5); });
    for (const e of boxes) part(e.getBoundingClientRect());
    const rec = { head: norm(h ? h.innerText : s.id).slice(0, 40), y: Math.round(sr.top + SY), hero };
    if (!parts.length) { if (s.closest('.scene, [data-scene], .pin-spacer')) continue; out.push({ ...rec, word: 'statement', lead: 'none', boxed: false }); continue; }
    const body = { l: Math.min(...parts.map((p) => p.l)), r: Math.max(...parts.map((p) => p.r)), t: Math.min(...parts.map((p) => p.t)) };
    rec.pos = !hr ? 'none' : hr.right <= body.l + 8 || hr.left >= body.r - 8 ? 'beside' : hr.bottom <= body.t + 8 ? 'over' : 'mixed';
    // its columns: the most parts side by side at one height (the head block among them where it stands beside)
    const ps = hr && rec.pos === 'beside' ? [...parts, { l: Math.max(0, hr.left), r: Math.min(W, hr.right), t: hr.top, b: hr.bottom }] : parts;
    rec.cols = 0;
    for (const p of ps) { const y = (p.t + p.b) / 2, iv = ps.filter((q) => q.t <= y && q.b >= y).map((q) => [q.l, q.r]).sort((a, b) => a[0] - b[0]), m = []; for (const [l, r] of iv) { const c = m[m.length - 1]; if (c && l <= c[1] + 16) c[1] = Math.max(c[1], r); else m.push([l, r]); } rec.cols = Math.max(rec.cols, m.filter((c) => c[1] - c[0] >= W * 0.06).length); }
    // its groups: lists (three items or more; a list of filled items is cards), product windows (a list when they hold
    // one), cards or one panel, pictures, a form
    const groups = [];
    const itemsOf = (l) => [...l.children].filter((c) => visible(c) && !(hb && c.contains(hb)));
    // (an item is filled by itself or by the frame that holds most of it: a piece of work's coloured frame)
    const itemFilled = (c) => filled(c) || [...c.children].some((x) => filled(x) && area(x.getBoundingClientRect()) >= area(c.getBoundingClientRect()) * 0.6);
    const lists = [...s.querySelectorAll('ul, ol, dl, table, [role=list]')].filter((l) => !(hb && hb.contains(l)) && visible(l) && !l.closest('[data-ui]') && itemsOf(l).length >= 3);
    for (const l of lists) { if (lists.some((o) => o !== l && o.contains(l))) continue; const kids = itemsOf(l), boxed = kids.filter(itemFilled).length >= kids.length * 0.6; groups.push({ kind: boxed ? 'cards' : l.matches('table') ? 'table' : 'list', el: l, q: l.getBoundingClientRect(), boxed }); }
    for (const u of s.querySelectorAll('[data-ui]')) { if (u.parentElement?.closest('[data-ui]') || !apart(u) || !visible(u)) continue; groups.push({ kind: [...u.querySelectorAll('ul, ol, table, [role=list]')].some((l) => [...l.children].filter(visible).length >= 3) ? 'list' : 'window', el: u, q: u.getBoundingClientRect(), boxed: [...u.querySelectorAll('div, article, li, figure, aside')].filter((e) => filled(e) && visible(e) && e.getBoundingClientRect().width >= 80 && e.getBoundingClientRect().height >= 40).length >= 2 }); }
    const outer = boxes.filter((e) => !boxes.some((o) => o !== e && o.contains(e)) && !e.closest('[data-ui]') && !e.querySelector('[data-ui]') && !lists.some((l) => l.contains(e) || e.contains(l)) && norm(e.innerText));
    if (outer.length) groups.push({ kind: outer.length >= 2 ? 'cards' : 'panel', el: outer[0], q: union(outer), boxed: true });
    const pics = [...s.querySelectorAll('img, video, canvas')].filter((m) => apart(m) && visible(m) && !m.closest('[data-ui]') && area(m.getBoundingClientRect()) >= W * H * 0.04);
    if (pics.length) groups.push({ kind: pics.length >= 3 ? 'pictures' : 'picture', el: pics[0], q: union(pics) });
    const fields = [...s.querySelectorAll('form, input:not([type=hidden]), select, textarea')].filter((f) => apart(f) && visible(f) && !f.closest('[data-ui]'));
    if (fields.length) groups.push({ kind: 'tool', el: fields[0], q: union(fields) });
    const lead = groups.filter((g) => !above(g.q)).sort((a, b) => area(b.q) - area(a.q))[0];
    rec.lead = lead ? lead.kind : 'text';
    rec.word = rec.cols >= 2 && rec.pos !== 'beside' && /cards|pictures/.test(rec.lead) ? (rec.lead === 'pictures' ? 'gallery' : 'grid') : rec.pos === 'beside' ? 'split' : rec.cols >= 2 ? 'columns' : { list: 'list', table: 'table', window: 'single-picture', picture: 'single-picture', pictures: 'gallery', cards: 'grid', panel: 'panel', tool: 'tool', text: 'statement' }[rec.lead];
    // in a box: cards or a panel, a window of boxes, or a list or window on a fill unlike the section's, inside the margins
    rec.boxed = !!lead && (!!lead.boxed || (/list|window|table/.test(lead.kind) && (() => { for (let e = lead.el; e && e !== s; e = e.parentElement) if (filled(e) && e.getBoundingClientRect().width < W * 0.94) return true; return false; })()));
    out.push(rec);
  }
  return out;
}

// deadControls: the controls of the first screen that change nothing when used (dead-control). A button, a field or a
// link to "#" on the first screen, and in a product window anything drawn as a control (a field outlined round a few
// words, a filled button of one to four words), is clicked once: it is alive when the page changes beyond what changes
// by itself in the same time (attributes, nodes, text), when focus lands in a field that takes typing, or when the
// address, the scroll or an open dialog changes. r9-p41: the hero's search box and its New note button looked usable
// and did nothing. Runs last; it may leave a menu open.
export async function deadControls() {
  const W = innerWidth, H = innerHeight;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  try { window.scrollTo({ top: 0, behavior: 'instant' }); } catch { window.scrollTo(0, 0); }
  await wait(500);
  const norm = (t) => (t || '').replace(/\s+/g, ' ').trim();
  const words = (t) => (norm(t).match(/\S+/g) || []).length;
  const rgba = (c) => { const s = String(c || ''); const k = s.match(/color\(srgb\s+([-\d.e]+)\s+([-\d.e]+)\s+([-\d.e]+)(?:\s*\/\s*([-\d.e]+))?\s*\)/); if (k) return [k[1] * 255, k[2] * 255, k[3] * 255, k[4] != null ? +k[4] : 1]; const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
  const groundOf = (el) => { for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const c = rgba(getComputedStyle(e).backgroundColor); if (c && c[3] >= 0.9) return c; } return [255, 255, 255, 1]; };
  const shows = (el) => { const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return false; let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) o *= +getComputedStyle(e).opacity; if (o < 0.5) return false; const r = el.getBoundingClientRect(); return r.width > 8 && r.height > 8 && r.top < H * 0.95 && r.bottom > 0 && r.left < W && r.right > 0; };
  const label = (el) => norm(el.innerText || el.value || el.placeholder || el.getAttribute('aria-label') || el.textContent || '').slice(0, 40);
  // (drawn as a control inside a product window: a field outlined round a few words, or a filled box of one to four)
  // (a list's row, a marked word in a sentence or a chip inside running text is not a control)
  const drawn = (el) => {
    if (el.childElementCount > 1 || [...el.children].some((c) => !/^(SVG|SPAN|I|B|KBD|IMG)$/i.test(c.tagName)) || /^(LI|TR|TD|TH|DT|DD|MARK|EM|STRONG|U|P|H\d)$/.test(el.tagName)) return null;
    if (el.parentElement && [...el.parentElement.childNodes].some((n) => n.nodeType === 3 && norm(n.nodeValue).length > 1)) return null;
    // (a figure in a filled tile is a value, not a button)
    const t = norm(el.textContent); if (!t || words(t) > 4 || /^[£$€¥+\-−]?\s?[\d.,\s:%]+\s?[a-z%€£$]{0,4}$/i.test(t)) return null;
    const r = el.getBoundingClientRect(); if (r.height < 22 || r.height > 64 || r.width < 40 || r.width > W * 0.7) return null;
    const cs = getComputedStyle(el), c = rgba(cs.backgroundColor), g = groundOf(el.parentElement);
    const filled = c && c[3] >= 0.5 && [0, 1, 2].some((i) => Math.abs(c[i] - g[i]) >= 8);
    const outlined = ['Top', 'Right', 'Bottom', 'Left'].filter((s) => parseFloat(cs[`border${s}Width`]) >= 1 && cs[`border${s}Style`] !== 'none').length >= 4;
    if (outlined && (words(t) >= 2 || /search|find|type|ask|email|name/i.test(t))) return 'field';
    if (filled && words(t) <= 4 && parseFloat(cs.borderTopLeftRadius) >= 2) return 'button';
    return null;
  };
  const cands = [];
  for (const el of document.querySelectorAll('button, [role=button], input:not([type=hidden]), select, textarea, a[href="#"], a[href=""], [data-ui] *')) {
    if (cands.length >= 10) break;
    // (the site's bar, a header outside the page's sections or a bar fixed at the top, is the navigation's business)
    const bar = el.closest('header'); if (bar && !bar.parentElement?.closest('main, section, article, [data-scene]')) continue;
    if (el.closest('nav, header[role=banner], dialog, [role=dialog], footer') || el.disabled || !shows(el)) continue;
    if ((() => { for (let e = el, i = 0; e && e !== document.body; e = e.parentElement, i++) { const p = getComputedStyle(e).position, r = e.getBoundingClientRect(); if ((p === 'fixed' || p === 'sticky') && r.top <= 2 && r.height < H * 0.2) return true; if (i < 3 && e !== el && e.querySelector(':scope > nav') && r.top < H * 0.15 && r.height < H * 0.2) return true; } return false; })()) continue;
    if (cands.some((c) => c.el.contains(el) || el.contains(c.el))) continue;
    const inUi = !!el.closest('[data-ui]');
    if (inUi && !el.matches('button, [role=button], input, select, textarea, a')) { const k = drawn(el); if (k) cands.push({ el, what: 'drawn ' + k }); continue; }
    if (el.matches('input, textarea, select')) cands.push({ el, what: 'field' }); else cands.push({ el, what: el.matches('a') ? 'link' : 'button' });
  }
  // what the page shows: its words, the classes and states of its elements, open dialogs and menus (a pressed state on
  // the control itself counts; its hover and focus do not)
  const snap = () => { let s = (document.body.innerText || '').slice(0, 60000) + '|' + [...document.querySelectorAll('video, audio')].map((m) => (m.paused ? 'p' : 'r')).join('') + '|'; let k = 0; for (const e of document.body.querySelectorAll('*')) { if (++k > 5000) break; s += (typeof e.className === 'string' ? e.className : '') + (e.getAttribute('aria-pressed') || '') + (e.getAttribute('aria-expanded') || '') + (e.getAttribute('aria-selected') || '') + (e.getAttribute('aria-checked') || '') + (e.hidden ? 'h' : '') + ','; } return s + '|' + document.querySelectorAll('dialog[open]').length; };
  const out = []; let unsure = 0;
  for (const c of cands) {
    // (a control an earlier click took off the page, a list drawn again, is not there to judge)
    if (!c.el.isConnected || !shows(c.el)) continue;
    // a page that changes by itself in the same time (a ticker, a replay, a typing line) cannot be judged: left out
    const s1 = snap(); await wait(350); const s2 = snap();
    if (s1 !== s2) { unsure++; continue; }
    const attrs = () => [c.el, ...c.el.querySelectorAll('*')].map((e) => [...e.attributes].filter((a) => a.name !== 'style').map((a) => a.name + '=' + a.value).join(' ')).join('|');
    const before = { href: location.href, y: Math.round(scrollY), pressed: c.el.getAttribute('aria-pressed') + '|' + c.el.getAttribute('aria-expanded'), attrs: attrs() };
    let answered = false; const onSubmit = (e) => { answered = true; e.preventDefault(); }, onInvalid = () => { answered = true; };
    document.addEventListener('submit', onSubmit, true); document.addEventListener('invalid', onInvalid, true);
    try { c.el.focus({ preventScroll: true }); } catch {}
    try { c.el.click(); } catch {}
    await wait(450);
    const typed = c.el.matches('input, textarea, select') && document.activeElement === c.el && !c.el.readOnly;
    try { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } catch {}
    await wait(60);
    const changed = snap() !== s2;
    const moved = (location.href !== before.href && !/#$/.test(location.href)) || Math.abs(Math.round(scrollY) - before.y) > 4;
    document.removeEventListener('submit', onSubmit, true); document.removeEventListener('invalid', onInvalid, true);
    const toggled = answered || (c.el.getAttribute('aria-pressed') + '|' + c.el.getAttribute('aria-expanded')) !== before.pressed || attrs() !== before.attrs;
    if (!changed && !typed && !moved && !toggled) out.push({ what: c.what, text: label(c.el) });
    if (location.href !== before.href && /#/.test(location.href)) { try { history.replaceState(null, '', before.href); } catch {} }
    if (Math.abs(Math.round(scrollY) - before.y) > 4) { try { window.scrollTo({ top: 0, behavior: 'instant' }); } catch {} await wait(250); }
  }
  return { tested: cands.length, unsure, dead: out };
}
