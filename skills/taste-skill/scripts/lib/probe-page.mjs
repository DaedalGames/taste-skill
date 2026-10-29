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
  const rgba = (c) => { const m = c && c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
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

  // --- framed elements, per section
  out.framed = [];
  {
    // (a card set as a link counts like any card; buttons and fields are controls)
    const SKIP = /^(BUTTON|INPUT|SELECT|TEXTAREA|LABEL|OPTION|IMG|VIDEO|PICTURE|CANVAS|IFRAME|SVG|HR|BR|SCRIPT|STYLE|SUMMARY)$/i;
    const picTile = (e, r) => [...e.querySelectorAll('img, video, picture, canvas')].some((p) => { const q = p.getBoundingClientRect(); return q.width * q.height >= r.width * r.height * 0.6; });
    const framed = (e) => {
      if (e.matches('[data-ui]') && !e.parentElement?.closest('[data-ui]')) { const g = groundOf(e.parentElement || B), drawn = (x) => { const c = rgba(css(x).backgroundColor); return (c && c[3] >= 0.5 && differs(c, g)) || sides(x) >= 3 || css(x).boxShadow !== 'none'; }; return drawn(e) || (e.children.length === 1 && drawn(e.children[0])) ? 'a product window' : null; }
      const c = rgba(css(e).backgroundColor);
      if (c && c[3] >= 0.5 && differs(c, groundOf(e.parentElement || B))) return 'filled ' + hex(c);
      if (sides(e) >= 3) return 'outlined';
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
      const how = framed(e); if (!how || !visible(e)) continue;
      if (how !== 'a product window' && picTile(e, r)) continue;
      if (!textOf(e) && !e.querySelector('img, video, canvas, picture')) continue;
      const sec = sectionOf(e); if (!sec || sec === e) continue;
      counted.push(e);
      const list = bySec.get(sec) || []; list.push({ e, r, how }); bySec.set(sec, list);
    }
    for (const [sec, items] of bySec) {
      // (boxes that touch are drawn as one frame: a ticket's body and its stub, a window's panes)
      const groups = [];
      for (const it of items) {
        const g = groups.find((x) => x.some((y) => y.e.parentElement === it.e.parentElement && Math.max(y.r.left - it.r.right, it.r.left - y.r.right, y.r.top - it.r.bottom, it.r.top - y.r.bottom) <= 3));
        if (g) g.push(it); else groups.push([it]);
      }
      if (groups.length < 2) continue;
      const parents = new Map(); for (const g of groups) parents.set(g[0].e.parentElement, (parents.get(g[0].e.parentElement) || 0) + 1);
      out.framed.push({ head: headOf(sec), n: groups.length, list: Math.max(...parents.values()) >= 3, y: Math.round(sec.getBoundingClientRect().top + sy), items: groups.slice(0, 5).map((g) => `${textOf(g[0].e).slice(0, 28) || desc(g[0].e)} (${g[0].how}, ${Math.round(g[0].r.width)}x${Math.round(g[0].r.height)})`) });
      if (out.framed.length >= 8) break;
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
  const rgba = (c) => { const m = c && c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
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
