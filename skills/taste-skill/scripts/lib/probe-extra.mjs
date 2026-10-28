// In-page measurements added in v2.5 for what reviewers kept finding and the first probe did not see:
// pictures inside headlines and sentences, giant footers and credit walls, upscaled pictures, colour
// sprawl, drag rails, pages built from boxes, label clutter, walls of text, rows empty on the left.
// Runs once at the top of the page after the walk, so every reveal has fired. Returns plain JSON.
export function extra() {
  const W = innerWidth, H = innerHeight, D = document.documentElement, B = document.body || D;
  const sy = scrollY || 0;
  const r2 = Math.round;
  const visible = (el) => { const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return false; const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2; };
  const inUI = (el) => !!el.closest('[data-ui], table, pre, code, form, dialog, [role=dialog], [role=table], [role=grid], svg');
  const rgb = (c) => { const m = c && c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return p.length > 3 && p[3] < 0.5 ? null : p.slice(0, 3); };
  const hsl = ([r, g, b]) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); const l = (mx + mn) / 2; let h = 0, s = 0; if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return { h, s, l }; };
  const chromatic = (c) => { if (!c) return null; const x = hsl(c); if (x.s < 0.3 || x.l < 0.12 || x.l > 0.94) return null; if (x.s * (1 - Math.abs(2 * x.l - 1)) < 0.14) return null; return x.h; };
  const groundOf = (el) => { for (let e = el; e && e !== D.parentNode; e = e.parentElement) { const c = rgb(getComputedStyle(e).backgroundColor); if (c) return c; } return [255, 255, 255]; };
  const words = (t) => (t.trim().match(/\S+/g) || []).length;
  const textOf = (el) => (el.innerText || '').trim().replace(/\s+/g, ' ');
  const out = {};

  // --- pictures inside headlines: a photograph or clip set into the words, or letters filled with a picture
  const media = 'img, picture, video, canvas, svg image, [style*="background-image"]';
  out.imageInHeadline = [];
  for (const h of document.querySelectorAll('h1, h2, h3, [role=heading]')) {
    if (!visible(h) || inUI(h)) continue;
    const pics = [...h.querySelectorAll(media)].filter((p) => { const r = p.getBoundingClientRect(); return r.width >= 24 && r.height >= 16 && visible(p); });
    const cs = getComputedStyle(h);
    const clipped = (cs.backgroundClip === 'text' || cs.webkitBackgroundClip === 'text') && /url\(/.test(cs.backgroundImage);
    if (pics.length || clipped) out.imageInHeadline.push({ text: textOf(h).slice(0, 60), how: clipped ? 'letters filled with a picture' : `${pics.length} picture(s) inside the heading` });
  }
  // a picture placed over a headline's line box (absolutely positioned into the words) counts too
  const heads = [...document.querySelectorAll('h1, h2')].filter((h) => visible(h) && !inUI(h)).map((h) => ({ h, r: h.getBoundingClientRect() })).filter((x) => x.r.height >= 40);
  for (const img of document.querySelectorAll('img, video')) {
    if (!visible(img) || inUI(img)) continue;
    const r = img.getBoundingClientRect();
    if (r.width * r.height > W * H * 0.2 || r.width < 40) continue; // a full picture behind a headline is the hero, not an inset
    for (const { h, r: hr } of heads) {
      if (h.contains(img)) continue;
      const ix = Math.min(r.right, hr.right) - Math.max(r.left, hr.left), iy = Math.min(r.bottom, hr.bottom) - Math.max(r.top, hr.top);
      if (ix > r.width * 0.6 && iy > r.height * 0.6 && r.height <= hr.height * 0.9) { out.imageInHeadline.push({ text: textOf(h).slice(0, 60), how: 'a small picture placed among the words' }); break; }
    }
  }

  // --- small pictures inside running text ("mini images in sentences")
  out.inlinePictures = [];
  for (const img of document.querySelectorAll('p img, p video, p picture, li img, span img, a img')) {
    if (!visible(img) || inUI(img) || img.closest('nav, header, footer, button, h1, h2, h3')) continue;
    const r = img.getBoundingClientRect(); const p = img.closest('p, li, span');
    if (!p || r.height > 120 || r.width < 18) continue;
    const t = textOf(p); if (words(t) < 4) continue; // a logo with a name is fine
    out.inlinePictures.push({ text: t.slice(0, 60), size: `${r2(r.width)}x${r2(r.height)}` });
  }

  // --- the footer: its largest type, and credits spread across it
  const foot = document.querySelector('footer') || [...B.children].filter(visible).at(-1);
  if (foot) {
    let big = { size: 0, text: '' };
    for (const el of foot.querySelectorAll('*')) { if (!el.childElementCount && textOf(el) && visible(el)) { const s = parseFloat(getComputedStyle(el).fontSize); if (s > big.size) big = { size: s, text: textOf(el).slice(0, 50) }; } }
    // a single text node can sit in an element with children (a wordmark with a span); check text nodes too
    const tw = document.createTreeWalker(foot, NodeFilter.SHOW_TEXT); let n;
    while ((n = tw.nextNode())) { const el = n.parentElement; if (!n.nodeValue.trim() || !el || !visible(el)) continue; const s = parseFloat(getComputedStyle(el).fontSize); if (s > big.size) big = { size: s, text: n.nodeValue.trim().slice(0, 50) }; }
    const creditRe = /wikimedia|openverse|flickr\.com|unsplash\.com\/@|pexels\.com\/@|creativecommons|\bCC[ -]BY|public domain|\bvia\b.*\b(commons|archive)|photo(graph)?s? by|licen[cs]ed under|\bcourtesy\b/i;
    const creditLinks = [...foot.querySelectorAll('a')].filter((a) => creditRe.test(a.href + ' ' + textOf(a)) && visible(a)).length;
    const creditText = (textOf(foot).match(new RegExp(creditRe.source, 'gi')) || []).length;
    out.footer = { size: r2(big.size), vw: +(big.size / W * 100).toFixed(1), text: big.text, creditLinks, creditMentions: creditText, words: words(textOf(foot)) };
  }

  // --- pictures shown larger than they were made (blurry upscales in big slots)
  out.upscaled = [];
  for (const img of document.querySelectorAll('img')) {
    if (!visible(img) || !img.naturalWidth || /\.svg(\?|$)/i.test(img.currentSrc || img.src)) continue;
    const r = img.getBoundingClientRect();
    if (r.width * r.height < W * H * 0.12) continue;
    const cs = getComputedStyle(img);
    // object-fit: cover shows the natural image scaled to cover the box
    const scale = cs.objectFit === 'cover' ? Math.max(r.width / img.naturalWidth, r.height / img.naturalHeight) : cs.objectFit === 'contain' ? Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight) : r.width / img.naturalWidth;
    if (scale > 1.0) out.upscaled.push({ src: (img.currentSrc || img.src).split('/').pop().split('?')[0].slice(0, 50), shown: `${r2(r.width)}x${r2(r.height)}`, natural: `${img.naturalWidth}x${img.naturalHeight}`, scale: +scale.toFixed(2) });
  }
  for (const v of document.querySelectorAll('video')) {
    if (!visible(v) || !v.videoWidth) continue; const r = v.getBoundingClientRect();
    if (r.width * r.height < W * H * 0.2) continue;
    const scale = Math.max(r.width / v.videoWidth, r.height / v.videoHeight);
    if (scale > 1.25) out.upscaled.push({ src: (v.currentSrc || '').split('/').pop().split('?')[0].slice(0, 50), shown: `${r2(r.width)}x${r2(r.height)}`, natural: `${v.videoWidth}x${v.videoHeight}`, scale: +scale.toFixed(2), video: true });
  }

  // --- colour: the hues a visitor sees on grounds, headings and buttons, and how much page is on colour
  const bins = new Map(); let colouredArea = 0; const pageArea = W * Math.max(H, D.scrollHeight);
  const addHue = (h, why) => { if (h == null) return; const k = Math.floor(((h + 15) % 360) / 30); if (!bins.has(k)) bins.set(k, why); };
  let scanned = 0;
  for (const el of B.querySelectorAll('*')) {
    if (++scanned > 6000) break;
    if (inUI(el)) continue;
    const cs = getComputedStyle(el); const c = rgb(cs.backgroundColor); if (!c) continue;
    const r = el.getBoundingClientRect(); const a = r.width * r.height; if (a < 12000 || !visible(el)) continue;
    const h = chromatic(c);
    if (h != null) { const parent = el.parentElement ? chromatic(groundOf(el.parentElement)) : null; if (parent == null || Math.abs(parent - h) > 20) colouredArea += a; addHue(h, a > W * 200 ? 'a ground' : 'a box or button'); }
  }
  for (const el of document.querySelectorAll('h1, h2, h3, a, button')) { if (!visible(el) || inUI(el)) continue; addHue(chromatic(rgb(getComputedStyle(el).color)), 'type'); }
  out.colour = { hues: bins.size, how: [...bins.values()], colouredShare: +Math.min(1, colouredArea / pageArea).toFixed(2) };

  // --- drag rails: sideways scrollers and progress bars outside a working interface
  out.rails = [];
  scanned = 0;
  for (const el of B.querySelectorAll('div, section, ul, ol, figure, article')) {
    if (++scanned > 5000) break;
    if (inUI(el)) continue;
    const cs = getComputedStyle(el);
    if (!/(auto|scroll)/.test(cs.overflowX) || el.scrollWidth <= el.clientWidth + 40 || !visible(el)) continue;
    const r = el.getBoundingClientRect(); if (r.width < W * 0.5 || r.height < 120) continue;
    out.rails.push({ what: 'a sideways scroller', size: `${r2(r.width)}x${r2(r.height)}`, text: textOf(el).slice(0, 40) });
  }
  // (a range input is reported once, by range-slider below; scenes report their own tracks, scene-track)
  for (const el of document.querySelectorAll('progress, [role=progressbar], [class*=progress i], [class*=scrollbar i], [class*=drag i]')) {
    if (inUI(el) || !visible(el) || el.closest('.scene, [data-scene]')) continue; const r = el.getBoundingClientRect(); if (r.width < 120) continue;
    out.rails.push({ what: 'a progress or drag bar', size: `${r2(r.width)}x${r2(r.height)}`, text: (el.className && String(el.className).slice(0, 40)) || '' });
    if (out.rails.length > 8) break;
  }
  // a range slider used as a page control, forms included (only a product fragment may show one)
  out.ranges = [...document.querySelectorAll('input[type=range]')].filter((i) => visible(i) && !i.closest('[data-ui]')).map((i) => ({ label: ((i.labels && i.labels[0] && textOf(i.labels[0])) || i.getAttribute('aria-label') || i.name || i.id || 'unnamed').slice(0, 40) }));

  // --- boxes: share of running text that sits inside a filled or outlined box
  let inBox = 0, allText = 0;
  for (const p of document.querySelectorAll('p, li, h3')) {
    if (!visible(p) || inUI(p) || p.closest('nav, header, footer')) continue;
    const t = words(textOf(p)); if (t < 4) continue; allText += t;
    for (let e = p.parentElement, d = 0; e && e !== B && d < 5; e = e.parentElement, d++) {
      const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
      if (r.width > W * 0.8) break; // a full-width band is a section ground, not a box
      const filled = rgb(cs.backgroundColor) && String(rgb(cs.backgroundColor)) !== String(groundOf(e.parentElement || B));
      const outlined = parseFloat(cs.borderTopWidth) >= 1 && parseFloat(cs.borderLeftWidth) >= 1 && cs.borderTopStyle !== 'none';
      if ((filled || outlined) && parseFloat(cs.paddingLeft) >= 8) { inBox += t; break; }
    }
  }
  out.boxed = { share: allText ? +(inBox / allText).toFixed(2) : 0, words: allText };

  // --- labels: little standalone texts (timestamps, chips, tags, captions of two words) outside nav, footer and controls
  out.labels = [];
  for (const el of B.querySelectorAll('span, p, div, small, time, figcaption, li, dt, dd')) {
    if (el.childElementCount || !visible(el) || inUI(el) || el.closest('nav, header, footer, button, a, label, h1, h2, h3, h4, [aria-hidden=true]')) continue;
    const t = textOf(el); const n = words(t); if (!t || n > 5) continue;
    const s = parseFloat(getComputedStyle(el).fontSize); if (s > 15.5) continue;
    const r = el.getBoundingClientRect();
    out.labels.push({ text: t.slice(0, 30), y: r2(r.top + sy) });
    if (out.labels.length > 120) break;
  }

  // --- walls of text: long paragraphs, and stretches of words with nothing else in them
  out.walls = [];
  for (const p of document.querySelectorAll('p')) { if (!visible(p) || inUI(p)) continue; const n = words(textOf(p)); if (n > 70) out.walls.push({ text: textOf(p).slice(0, 50), words: n }); }

  // --- rows empty on the left: content of a band huddled in its right part, nothing on the left
  out.rightHuddled = [];
  if (W >= 1100) {
    const bands = [...document.querySelectorAll('section, main > div, body > div > div, article')].filter((s) => { const r = s.getBoundingClientRect(); return r.width >= W * 0.9 && r.height >= 220 && r.height <= H * 2.5 && visible(s); }).slice(0, 40);
    for (const s of bands) {
      const r = s.getBoundingClientRect(); const top = r.top + sy;
      const boxes = [...s.querySelectorAll('h1, h2, h3, p, img, video, a, button, li, figure')].filter(visible).map((e) => e.getBoundingClientRect()).filter((b) => b.width > 20 && b.height > 8);
      if (boxes.length < 2) continue;
      const left = Math.min(...boxes.map((b) => b.left));
      if (left > W * 0.42) out.rightHuddled.push({ y: r2(top), h: r2(r.height), from: r2((left / W) * 100), text: textOf(s).slice(0, 50) });
    }
  }
  // --- words in interfaces: sentence-long titles, and mock-ups that talk too much
  out.longTitles = [];
  for (const h of document.querySelectorAll('h1, h2, h3, h4')) { if (!visible(h)) continue; const n = words(textOf(h)); if (n > 5) out.longTitles.push({ text: textOf(h).slice(0, 60), words: n, ui: !!h.closest('[data-ui]'), level: h.tagName }); }
  out.uiWords = [...document.querySelectorAll('[data-ui]')].filter((u) => !u.parentElement?.closest('[data-ui]') && visible(u)).map((u) => ({ words: words(textOf(u)), text: textOf(u).slice(0, 40) }));
  out.sentences = [...document.querySelectorAll('p, li, td, dd, figcaption')].filter((p) => visible(p) && words(textOf(p)) > 12).length;

  // --- text inside mock-ups too small to read, placeholder contacts, notes the builder left for the client
  out.tinyUi = 0; out.placeholders = []; out.builderNotes = [];
  {
    const tw = document.createTreeWalker(B, NodeFilter.SHOW_TEXT); let n, k = 0;
    const noteRe = /\b(until|once)\b[^.]{0,40}\b(are|is|have been|has been|get|gets)\s+(photographed|shot|supplied)|\bplaceholder (image|photo|picture|text|copy)|\bstand-?in (picture|photo|image|drawing)|\bto be replaced\b|\breplace (this|these) (picture|photo|image)s?\b|\bsample (content|copy|text)\b|\blorem ipsum\b/i;
    while ((n = tw.nextNode()) && k < 6000) {
      const t = n.nodeValue.trim(); if (!t) continue; k++;
      const el = n.parentElement; if (!el || !visible(el)) continue;
      if (el.closest('[data-ui]') && parseFloat(getComputedStyle(el).fontSize) < 11.5) out.tinyUi++;
      if (noteRe.test(t) && out.builderNotes.length < 4) out.builderNotes.push(t.slice(0, 70));
      if (/[\w.-]+@[\w-]+\.example\b|\bexample\.(com|org)\b/i.test(t) && out.placeholders.length < 4) out.placeholders.push(t.slice(0, 50));
    }
    for (const a of document.querySelectorAll('a[href]')) { const h = a.getAttribute('href') || ''; if (/\.example\b|example\.(com|org)/i.test(h) && out.placeholders.length < 4) out.placeholders.push(h.slice(0, 50)); }
  }

  // --- the same large picture twice, the same heading twice, boxes with nothing in them, switches as a feature list
  {
    // the same file twice (keyed by its whole path: /id/12/1600/1000 and /id/40/1600/1000 are two photographs),
    // and one series used again and again: its files' names without numbers, sizes and crop suffixes
    // (zettelarchiv3, zettelarchiv5, zettelarchiv-tll are one archive)
    const seenPics = new Map(), series = new Map();
    const CROP = new Set(['crop', 'wide', 'tall', 'square', 'portrait', 'landscape', 'small', 'large', 'thumb', 'detail', 'close', 'hero', 'full', 'half']);
    const stemOf = (file) => {
      const name = file.replace(/\.[a-z0-9]{2,5}$/i, '').toLowerCase();
      const kept = name.split(/[-_.\s]+/).filter((t, i) => t && !/^\d+$/.test(t) && !/^\d+x\d+$/.test(t) && !/^@?\d+[wx]$/.test(t) && !CROP.has(t) && (i === 0 || t.length >= 4));
      const stem = kept.join('-').replace(/\d+$/, '').replace(/-+$/, '');
      return /^[a-z]/.test(stem) && stem.length >= 4 && !/^(photo|image|img|picture|pic|shot|still|frame|cover|card|work|project|asset|slide|gallery|scene|bg|background)$/.test(stem) ? stem : null;
    };
    for (const img of document.querySelectorAll('img')) {
      if (!visible(img)) continue; const r = img.getBoundingClientRect(); if (r.width * r.height < W * H * 0.02) continue;
      let path = ''; try { path = new URL(img.currentSrc || img.src, location.href).pathname; } catch { path = (img.currentSrc || img.src).split('?')[0]; }
      const file = decodeURIComponent(path.split('/').pop() || '');
      if (path && r.width * r.height >= W * H * 0.08) seenPics.set(path, (seenPics.get(path) || 0) + 1);
      const stem = file && stemOf(file);
      if (stem) { const s = series.get(stem) || { n: 0, files: new Set() }; s.n++; s.files.add(path); series.set(stem, s); }
    }
    out.repeatedPictures = [...seenPics.entries()].filter(([, n]) => n > 1).map(([k, n]) => ({ src: k.split('/').slice(-2).join('/').slice(-40), n }));
    out.pictureSeries = [...series.entries()].filter(([, s]) => s.n >= 3 && s.files.size >= 2).map(([stem, s]) => ({ stem, n: s.n }));
    const heads = new Map();
    for (const h of document.querySelectorAll('h1, h2, h3')) { if (!visible(h) || inUI(h)) continue; const k = textOf(h).toLowerCase(); if (k.length > 3) heads.set(k, (heads.get(k) || 0) + 1); }
    out.repeatedHeadings = [...heads.entries()].filter(([, n]) => n > 1).map(([k]) => k.slice(0, 40));
    out.hollow = [];
    let n2 = 0;
    for (const el of B.querySelectorAll('div, li, article, section > div, a')) {
      if (++n2 > 5000 || out.hollow.length >= 6) break;
      if (inUI(el) || !visible(el)) continue;
      const r = el.getBoundingClientRect(); if (r.width < 180 || r.height < 220 || r.width > W * 0.9) continue;
      const cs = getComputedStyle(el); const filled = rgb(cs.backgroundColor) && String(rgb(cs.backgroundColor)) !== String(groundOf(el.parentElement || B)); const outlined = parseFloat(cs.borderTopWidth) >= 1 && cs.borderTopStyle !== 'none';
      if (!filled && !outlined) continue;
      const kids = [...el.querySelectorAll('*')].filter((k) => !k.childElementCount && visible(k)).map((k) => k.getBoundingClientRect()).filter((b) => b.width > 2 && b.height > 2);
      if (!kids.length) continue;
      const top = Math.min(...kids.map((b) => b.top)), bottom = Math.max(...kids.map((b) => b.bottom));
      const covered = kids.reduce((s, b) => s + b.height, 0);
      // the content's own height against the box: a tall card with a price at the top and two lines at the foot
      if (Math.min(covered, bottom - top) / r.height < 0.3 && (bottom - top) / r.height > 0.6) out.hollow.push({ text: textOf(el).slice(0, 40), h: Math.round(r.height) });
    }
    out.switchList = [...document.querySelectorAll('input[type=checkbox], [role=switch], input[type=radio]')].filter((i) => visible(i) && !i.closest('form, [data-ui], dialog, [role=dialog]')).length;
  }

  // --- drawn illustrations (inline SVG pictures of things), and words in the first screen and per section
  out.drawings = []; out.sceneDrawings = [];
  const sceneOf = (el) => el.closest('.scene, [data-scene]');
  const sceneId = (s) => (s && (s.dataset.scene || s.id)) || 'scene';
  for (const svg of document.querySelectorAll('svg')) {
    if (svg.parentElement?.closest('svg') || !visible(svg) || svg.closest('[data-ui], header, nav, footer, button, a')) continue;
    const r = svg.getBoundingClientRect(); const share = (r.width * r.height) / (W * H);
    const shapes = svg.querySelectorAll('path, circle, ellipse, rect, polygon, polyline, line').length;
    const labels = [...svg.querySelectorAll('text')].filter((t) => t.textContent.trim()).length;
    const scene = sceneOf(svg);
    if (scene) {
      // inside a scene any drawing counts (wheels, waves, axles, morphing shapes); a labelled map or plan and the
      // brand's own mark do not
      if (share >= 0.02 && shapes >= 1 && labels < 3 && !svg.closest('.route-art, [data-map], .portal-src, .portal-mark, [data-plan], [data-mark]') && out.sceneDrawings.length < 6) out.sceneDrawings.push({ id: sceneId(scene), shapes, share: +share.toFixed(3) });
      continue;
    }
    if (share < 0.012) continue;
    if (shapes >= 6 && labels <= 2) out.drawings.push({ share: +share.toFixed(3), shapes, near: textOf(svg.closest('section, article, div') || svg).slice(0, 40) });
    if (out.drawings.length >= 12) break;
  }
  {
    let first = 0; const tw = document.createTreeWalker(B, NodeFilter.SHOW_TEXT); let n;
    while ((n = tw.nextNode())) { const el = n.parentElement; if (!el || !visible(el) || el.closest('nav, header, [data-ui]')) continue; const r = el.getBoundingClientRect(); if (r.top + sy < H && r.bottom + sy > 0) first += words(n.nodeValue); }
    out.firstScreenWords = first;
    out.wordySections = [...document.querySelectorAll('main > section, body > section, main > div > section, section')].filter((s) => visible(s) && !s.parentElement?.closest('section')).map((s) => ({ words: [...s.querySelectorAll('p, li, dd, td, blockquote, figcaption')].filter((p) => visible(p) && !p.closest('[data-ui], footer')).reduce((a, p) => a + words(textOf(p)), 0), head: textOf(s.querySelector('h1, h2, h3') || s).slice(0, 40) })).filter((s) => s.words > 130).slice(0, 6);
  }

  // --- breakage at narrow widths (most of the reviewed pages' high-severity faults were phone or tablet only)
  // text cut by the screen edge or by a clipping box, mock-ups included: a 520px sheet in a 390px screen reads "Sub"
  out.cutText = [];
  {
    const tw = document.createTreeWalker(B, NodeFilter.SHOW_TEXT); let n, seen = 0;
    const clipOf = (el) => { for (let e = el.parentElement; e && e !== B; e = e.parentElement) { const cs = getComputedStyle(e); if (/(hidden|clip)/.test(cs.overflowX) || /(hidden|clip)/.test(cs.overflow)) return e; } return null; };
    while ((n = tw.nextNode()) && seen < 4000) {
      const t = n.nodeValue.trim(); if (t.length < 3) continue; seen++;
      const el = n.parentElement; if (!el || !visible(el) || el.closest('[aria-hidden=true], .marquee, [class*=marquee i], [class*=ticker i]')) continue;
      const range = document.createRange(); range.selectNodeContents(n);
      for (const r of range.getClientRects()) {
        if (r.width < 8 || r.bottom < 0 || r.top > H * 6) continue;
        let cut = null;
        if (r.right > W + 4 || r.left < -4) cut = 'the screen edge';
        else { const c = clipOf(el); if (c) { const cr = c.getBoundingClientRect(); if (r.right > cr.right + 4 || r.left < cr.left - 4) { const scroller = /(auto|scroll)/.test(getComputedStyle(c).overflowX); if (!scroller) cut = 'a clipping box'; } } }
        if (cut) { out.cutText.push({ text: t.slice(0, 40), by: cut, ui: !!el.closest('[data-ui]') }); break; }
      }
      if (out.cutText.length >= 12) break;
    }
  }
  // text shortened with an ellipsis: the number or name that matters, cut to "$1,..."
  out.truncated = [];
  for (const el of B.querySelectorAll('*')) {
    if (out.truncated.length >= 8) break;
    const cs = getComputedStyle(el); if (cs.textOverflow !== 'ellipsis' || !visible(el)) continue;
    if (el.scrollWidth > el.clientWidth + 1) out.truncated.push({ text: textOf(el).slice(0, 40), ui: !!el.closest('[data-ui]') });
  }
  // sticky or fixed bands that eat the screen on a phone or tablet (navigation and scroll scenes excepted)
  out.stickyBands = [];
  for (const el of B.querySelectorAll('*')) {
    const cs = getComputedStyle(el); if (cs.position !== 'sticky' && cs.position !== 'fixed') continue;
    // (a product replay's held stage holds on phones too, like a scene: replay.js)
    if (!visible(el) || el.closest('header, nav, [role=banner], .scene, [data-scene], dialog, [role=dialog], .replay-stage')) continue;
    const r = el.getBoundingClientRect();
    if (r.width >= W * 0.8 && r.height >= H * 0.33 && r.height < H * 0.97) out.stickyBands.push({ what: textOf(el).slice(0, 40) || el.tagName.toLowerCase(), h: Math.round((r.height / H) * 100) });
    if (out.stickyBands.length >= 4) break;
  }
  // a form field set inside a headline or sentence ("Send [you@work.dev] a free key")
  out.formInSentence = [];
  for (const i of document.querySelectorAll('h1 input, h2 input, h3 input, p input, h1 select, h2 select, p select')) { if (visible(i)) out.formInSentence.push({ text: textOf(i.closest('h1, h2, h3, p')).slice(0, 50) }); }
  // a navigation at the top: links to the page's parts or a menu button
  {
    const top = [...B.querySelectorAll('a[href], button')].filter((a) => { const r = a.getBoundingClientRect(); return r.top + sy < 160 && r.bottom > 0 && visible(a) && r.width > 8; });
    const menu = top.some((b) => /menu|navigation/i.test((b.getAttribute('aria-label') || '') + ' ' + textOf(b)) || b.getAttribute('aria-expanded') != null);
    out.nav = { links: top.length, menu };
  }

  // ---------- round 4: what judges found on pages every check above passed ----------
  const opaqueBg = (el) => { const m = getComputedStyle(el).backgroundColor.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return p.length > 3 && p[3] < 0.9 ? null : p.slice(0, 3); };
  const differs = (a, b, d = 6) => !!a && !!b && a.some((v, i) => Math.abs(v - b[i]) >= d);
  const sides = (el) => { const cs = getComputedStyle(el); return ['Top', 'Right', 'Bottom', 'Left'].filter((s) => parseFloat(cs[`border${s}Width`]) >= 1 && cs[`border${s}Style`] !== 'none' && !/rgba\([^)]*,\s*0\)/.test(cs[`border${s}Color`])).length; };
  const filledOn = (el) => { const c = opaqueBg(el); return c && differs(c, groundOf(el.parentElement || B)) ? c : null; };
  const textRects = (root) => { const out = []; const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const rg = document.createRange(); let n; while ((n = tw.nextNode())) { if (!n.nodeValue.trim() || !n.parentElement || !visible(n.parentElement)) continue; rg.selectNodeContents(n); for (const r of rg.getClientRects()) if (r.width > 1 && r.height > 1) out.push(r); } return out; };
  // The share of a box with nothing in it: an 8 x 8 grid of points inside it, a point filled when it falls on a line
  // of text, a picture, or a painted leaf element (a bar, a dot, a field), each grown by 8px.
  const emptyInside = (box) => {
    const b = box.getBoundingClientRect(); if (b.width < 8 || b.height < 8) return 0;
    const fill = textRects(box);
    for (const e of box.querySelectorAll('img, video, svg, canvas, picture, iframe, input, select, textarea')) { if (e.parentElement?.closest('svg') || !visible(e)) continue; fill.push(e.getBoundingClientRect()); }
    for (const e of box.querySelectorAll('*')) { if (e.childElementCount || !visible(e) || e.closest('svg')) continue; const cs = getComputedStyle(e); if (rgb(cs.backgroundColor) || cs.backgroundImage !== 'none' || sides(e)) fill.push(e.getBoundingClientRect()); }
    let empty = 0;
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
      const x = b.left + ((i + 0.5) * b.width) / 8, y = b.top + ((j + 0.5) * b.height) / 8;
      if (!fill.some((r) => x >= r.left - 8 && x <= r.right + 8 && y >= r.top - 8 && y <= r.bottom + 8)) empty++;
    }
    return empty / 64;
  };
  const emailRe = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/;

  // --- giant-contact: an email, a phone or the site's name set at display size anywhere on the page
  out.giantContact = [];
  {
    const sizeIn = (el) => { let s = 0; const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; while ((n = tw.nextNode())) { if (!n.nodeValue.trim() || !n.parentElement || !visible(n.parentElement)) continue; s = Math.max(s, parseFloat(getComputedStyle(n.parentElement).fontSize)); } return s; };
    // a mailto or tel link counts by what it shows: an address or a number, not a closing line set as the link
    const phoneRe = /^\+?[\d\s().\-/]{7,}$/;
    const cands = new Set([...document.querySelectorAll('a[href^="mailto:"], a[href^="tel:"]')].filter((a) => { const t = textOf(a); return emailRe.test(t) || (phoneRe.test(t) && t.replace(/\D/g, '').length >= 6); }));
    // an address split across spans: the smallest element whose whole text holds it
    const tw = document.createTreeWalker(B, NodeFilter.SHOW_TEXT); let n, k = 0;
    while ((n = tw.nextNode()) && k < 8000) { k++; if (!n.nodeValue.includes('@') || !n.parentElement) continue; let e = n.parentElement; for (let d = 0; e && d < 4 && !emailRe.test(e.textContent); d++) e = e.parentElement; if (e && emailRe.test(e.textContent) && e.textContent.length < 120) cands.add(e); }
    const limit = W < 600 ? 28 : Math.max(32, W * 0.024);
    const seen = new Set();
    for (const c of cands) {
      if (!visible(c) || c.closest('[data-ui], dialog, [role=dialog]')) continue;
      const s = sizeIn(c); const t = textOf(c).slice(0, 40);
      if (s > limit && !seen.has(t)) { seen.add(t); out.giantContact.push({ text: t, size: r2(s), vw: +((s / W) * 100).toFixed(1), what: 'contact' }); }
    }
    // the name: the wordmark ([data-wordmark], or the header link that leads to the page itself), at 6vw or more
    // anywhere below the first screen. A header with neither has no name to check.
    const home = (a) => {
      const h = (a.getAttribute('href') || '').trim();
      if (['#', '#top', '/', './', 'index.html', './index.html'].includes(h)) return true;
      if (!h || /^(mailto|tel|javascript):/i.test(h)) return false;
      try { const u = new URL(h, location.href), strip = (p) => p.replace(/index\.html?$/, ''); return u.origin === location.origin && strip(u.pathname) === strip(location.pathname) && (!u.hash || u.hash === '#top'); } catch { return false; }
    };
    const mark = document.querySelector('[data-wordmark]') || [...document.querySelectorAll('header a, nav a, [role=banner] a')].find(home);
    const name = mark ? textOf(mark) : '';
    if (name && name.split(' ').length <= 4 && name.length >= 3) {
      let m = 0;
      for (const el of B.querySelectorAll('h1, h2, h3, p, div, span, a, strong, b, li')) {
        if (++m > 6000) break;
        if (el.closest('header, nav, [role=banner], [data-ui]') || (el.textContent || '').length > 80 || textOf(el).toLowerCase() !== name.toLowerCase() || !visible(el)) continue;
        const r = el.getBoundingClientRect(); if (r.top + sy <= H) continue;
        const s = sizeIn(el);
        if (s >= Math.max(W * 0.06, 40) && !seen.has(name)) { seen.add(name); out.giantContact.push({ text: name.slice(0, 40), size: r2(s), vw: +((s / W) * 100).toFixed(1), what: 'name' }); }
      }
    }
  }

  // --- hero-in-card: the first screen's headline set inside a card or panel
  out.heroCard = null;
  {
    const firsts = [...document.querySelectorAll('h1')].filter((h) => visible(h) && h.getBoundingClientRect().top + sy < H);
    let h = firsts[0];
    if (!h) { let best = 0; for (const el of B.querySelectorAll('h2, p, div, span')) { if (el.childElementCount || !visible(el) || !textOf(el)) continue; const r = el.getBoundingClientRect(); if (r.top + sy >= H) continue; const s = parseFloat(getComputedStyle(el).fontSize); if (s > best) { best = s; h = el; } } }
    if (h && !h.closest('[data-ui]')) {
      const hr = h.getBoundingClientRect();
      const wide = (() => { for (let e = h.parentElement; e && e !== B; e = e.parentElement) if (e.getBoundingClientRect().width >= W * 0.9) return e; return B; })();
      // a canvas is not a picture here: a scene's field (the dither opener) under a headline block filled in the ground colour is no card
      const pictures = [...wide.querySelectorAll('img, video, picture, [style*="background-image"]')].filter(visible);
      for (let a = h.parentElement; a && a !== wide && a !== B; a = a.parentElement) {
        const r = a.getBoundingClientRect(), cs = getComputedStyle(a);
        if (r.width >= W * 0.85 || r.height >= H * 0.95 || r.height < hr.height * 1.5 || /url\(/.test(cs.backgroundImage)) continue;
        const own = opaqueBg(a);
        // filled unlike its ground, or a filled panel lying on a picture
        const onPicture = !!own && pictures.some((p) => !a.contains(p) && !p.contains(a) && (() => { const pr = p.getBoundingClientRect(); const ix = Math.min(pr.right, r.right) - Math.max(pr.left, r.left), iy = Math.min(pr.bottom, r.bottom) - Math.max(pr.top, r.top); return ix > 0 && iy > 0 && ix * iy >= r.width * r.height * 0.8; })());
        const card = (own && (differs(own, groundOf(a.parentElement || B)) || onPicture)) || sides(a) >= 3;
        if (!card) continue;
        // a half of a split screen touches its band on three sides; a card floats inside it
        const wr = wide.getBoundingClientRect();
        const inset = [r.top - wr.top, wr.right - r.right, wr.bottom - r.bottom, r.left - wr.left].filter((d) => d >= 12).length;
        if (inset < 3) continue;
        out.heroCard = { text: textOf(h).slice(0, 50), w: r2(r.width), h: r2(r.height), bg: own ? `rgb(${own.join(', ')})` : 'outlined' };
        break;
      }
    }
  }

  // --- bento: a section built as a grid of boxed cards; its cells' empty share
  out.bento = [];
  {
    const secs = [...document.querySelectorAll('section, main > div, article')].filter((s) => !s.parentElement?.closest('section') && visible(s) && !s.closest('[data-ui], header, footer, nav, .scene, [data-scene]'));
    for (const s of secs.slice(0, 40)) {
      const sr = s.getBoundingClientRect(); if (sr.width < W * 0.6 || sr.height < 200) continue;
      const boxes = [];
      for (const e of s.querySelectorAll('div, li, article, figure, a, aside')) {
        if (boxes.some((b) => b.contains(e)) || e.parentElement?.closest('[data-ui]')) continue;
        const r = e.getBoundingClientRect(); if (r.width < 160 || r.height < 140 || r.width >= sr.width * 0.7 || !visible(e)) continue;
        // a picture tile (a photograph filling its frame) is a picture, not a card
        if ([...e.querySelectorAll('img, video, picture')].some((p) => { const q = p.getBoundingClientRect(); return q.width * q.height >= r.width * r.height * 0.6; })) continue;
        if (filledOn(e) || sides(e) >= 3) boxes.push(e);
        if (boxes.length > 24) break;
      }
      if (boxes.length < 4) continue;
      const rs = boxes.map((b) => b.getBoundingClientRect());
      const distinct = (vals) => vals.sort((a, b) => a - b).filter((v, i, a) => !i || v - a[i - 1] > 8).length;
      const area = rs.reduce((t, r) => t + r.width * r.height, 0);
      if (distinct(rs.map((r) => r.top)) < 2 || distinct(rs.map((r) => r.left)) < 2 || area < sr.width * sr.height * 0.35) continue;
      const voids = boxes.map((b, i) => ({ text: textOf(b).slice(0, 30), empty: emptyInside(b), h: r2(rs[i].height) })).filter((b) => b.empty >= 0.5);
      out.bento.push({ head: textOf(s.querySelector('h1, h2, h3') || s).slice(0, 50), n: boxes.length, voids });
      if (out.bento.length >= 4) break;
    }
  }

  // --- small-body: running text under 16px (15px on a phone), and small text under a display heading
  out.smallBody = []; out.smallUnderHead = [];
  {
    // 16px on desktop, 15px on a phone; a tablet sits between its fluid steps, so it takes the phone floor
    const floor = W < 1100 ? 15 : 16;
    const done = new Set();
    // paragraphs, and any span or div that carries a sentence of its own (a description set as a span)
    const ownWords = (el) => { let t = ''; for (const c of el.childNodes) if (c.nodeType === 3) t += c.nodeValue + ' '; return words(t); };
    const blocks = [...document.querySelectorAll('p, li, dd, blockquote'), ...[...B.querySelectorAll('span, div, small, a, em')].filter((e) => ownWords(e) >= 8 && !e.closest('p, li, dd, blockquote'))];
    for (const p of blocks) {
      if (done.size > 400) break;
      if (!visible(p) || [...done].some((d) => d.contains(p)) || p.closest('[data-ui], nav, header, footer, figcaption, label, button, table, dialog, [role=dialog], [aria-hidden=true]')) continue;
      const t = textOf(p); if (words(t) < 8) continue;
      // the size most of its words are set in (a name at 17px over a 13px description reads as 13px text)
      const by = new Map(); { const tw = document.createTreeWalker(p, NodeFilter.SHOW_TEXT); let n; while ((n = tw.nextNode())) { if (!n.parentElement || !n.nodeValue.trim()) continue; const z = parseFloat(getComputedStyle(n.parentElement).fontSize); by.set(z, (by.get(z) || 0) + n.nodeValue.trim().length); } }
      const s = [...by.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? parseFloat(getComputedStyle(p).fontSize);
      if (s < floor - 0.25) { done.add(p); out.smallBody.push({ text: t.slice(0, 40), size: +s.toFixed(1) }); continue; }
      if (W >= 1100 && s < 17.75) {
        const prev = p.previousElementSibling || (p.parentElement && !p.previousElementSibling ? p.parentElement.previousElementSibling : null);
        const hs = prev && prev.matches('h1, h2, h3, h4') ? parseFloat(getComputedStyle(prev).fontSize) : 0;
        if (hs >= 48) out.smallUnderHead.push({ text: t.slice(0, 40), size: +s.toFixed(1), head: r2(hs) });
      }
    }
    out.smallBody = out.smallBody.slice(0, 12); out.smallUnderHead = out.smallUnderHead.slice(0, 6);
  }

  // --- broken-address: an email, a URL or a phone number broken over two lines
  out.brokenAddress = [];
  {
    const res = [/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, /\b(?:https?:\/\/|www\.)[^\s<>"]+/g, /(?:\+|\(0|\b0)\d[\d ().-]{6,}\d/g];
    const tw = document.createTreeWalker(B, NodeFilter.SHOW_TEXT); const rg = document.createRange(); let n, k = 0;
    while ((n = tw.nextNode()) && k < 8000 && out.brokenAddress.length < 6) {
      k++; const v = n.nodeValue; if (!v || v.length < 6 || !n.parentElement || n.parentElement.closest('[data-ui], svg, script, style') || !visible(n.parentElement)) continue;
      for (const re of res) for (const m of v.matchAll(re)) {
        if (re === res[2] && (m[0].match(/\d/g) || []).length < 8) continue;
        rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length);
        const tops = [...rg.getClientRects()].filter((r) => r.width > 1).map((r) => r.top);
        if (tops.length > 1 && Math.max(...tops) - Math.min(...tops) > 2) out.brokenAddress.push({ text: m[0].slice(0, 40) });
      }
    }
  }

  // --- result-first: a tool whose result stands above the controls that set it
  out.resultFirst = [];
  for (const tool of document.querySelectorAll('form, [data-tool]')) {
    if (!visible(tool) || tool.closest('[data-ui], dialog, [role=dialog]')) continue;
    // a control is drawn by its label when the input itself is hidden (a radio styled as a button)
    const controls = [...tool.querySelectorAll('input:not([type=hidden]), select, textarea, [role=radio], [role=slider]')].filter((c) => !c.closest('[aria-live], output')).map((e) => e.closest('label') || e).filter((e) => { const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2; });
    const results = [...tool.querySelectorAll('output, [aria-live]')].filter(visible);
    if (!controls.length || !results.length) continue;
    const c = controls.map((e) => e.getBoundingClientRect()).sort((a, b) => a.top - b.top)[0];
    for (const res of results) {
      const r = res.getBoundingClientRect();
      const ox = Math.min(r.right, c.right) - Math.max(r.left, c.left);
      if (r.bottom <= c.top + 8 && ox > Math.min(r.width, c.width) * 0.5) { out.resultFirst.push({ text: textOf(res).slice(0, 30), tool: (tool.getAttribute('aria-label') || textOf(tool.querySelector('legend, h2, h3, label') || tool)).slice(0, 30) }); break; }
    }
  }

  // --- surface-count: the grounds a visitor sees (body, bands, panels of 8% of a screen or more)
  {
    const grounds = []; const add = (c, why) => { if (!c) return; const g = grounds.find((x) => !differs(x.c, c, 7)); if (g) g.n++; else grounds.push({ c, why, n: 1 }); };
    add(opaqueBg(B) || opaqueBg(D) || [255, 255, 255], 'page');
    let m = 0;
    for (const el of B.querySelectorAll('*')) {
      if (++m > 6000) break;
      if (/^(IMG|VIDEO|CANVAS|PICTURE|svg|IFRAME|INPUT|BUTTON|SELECT|TEXTAREA)$/.test(el.tagName) || el.closest('[data-ui], svg, dialog, [role=dialog]')) continue;
      const c = opaqueBg(el); if (!c) continue;
      const r = el.getBoundingClientRect(); if (r.width * r.height < W * H * 0.08 || !visible(el)) continue;
      // a frame behind a picture is the picture
      if ([...el.querySelectorAll('img, video, canvas')].some((p) => { const pr = p.getBoundingClientRect(); return pr.width * pr.height >= r.width * r.height * 0.85; })) continue;
      add(c, el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : ''));
    }
    out.surfaces = grounds.map((g) => ({ colour: '#' + g.c.map((v) => v.toString(16).padStart(2, '0')).join(''), where: g.why }));
  }

  // --- empty-box: a filled or outlined box with nothing at all in it (a leftover, or a picture that failed)
  out.emptyBoxes = [];
  {
    let m = 0;
    for (const el of B.querySelectorAll('div, li, article, aside, figure, span, a, section > div')) {
      if (++m > 6000 || out.emptyBoxes.length >= 6) break;
      if (el.closest('[data-ui], .scene, [data-scene], svg, dialog, [role=dialog], [aria-hidden=true]')) continue;
      const r = el.getBoundingClientRect(); if (r.width < 120 || r.height < 60 || r.width >= W * 0.9 || !visible(el)) continue;
      const cs = getComputedStyle(el); if (/url\(/.test(cs.backgroundImage) || (!filledOn(el) && sides(el) < 3)) continue;
      if (textOf(el) || [...el.querySelectorAll('*')].some((k) => visible(k) && (k.childElementCount === 0 || /^(IMG|VIDEO|CANVAS|svg|PICTURE|IFRAME)$/.test(k.tagName)))) continue;
      if (el.querySelector('img:not([src]), img[loading="lazy"]')) continue;
      out.emptyBoxes.push({ size: `${r2(r.width)}x${r2(r.height)}`, at: r2(r.top + sy), near: textOf(el.parentElement || B).slice(0, 30) });
    }
  }

  // --- hollow-fragment: the first screen's product fragment with panes that hold nothing
  out.hollowFragment = [];
  {
    const ui = [...document.querySelectorAll('[data-ui]')].find((u) => !u.parentElement?.closest('[data-ui]') && visible(u) && u.getBoundingClientRect().top + sy < H);
    if (ui) {
      const panes = [ui, ...ui.querySelectorAll('div, section, aside, main, article, ul, ol, form')].filter((p) => { const r = p.getBoundingClientRect(); return r.width >= 160 && r.height >= 120 && visible(p) && (p === ui || filledOn(p) || sides(p) >= 2); });
      for (const p of panes) { const e = emptyInside(p); if (e >= 0.55) out.hollowFragment.push({ text: textOf(p).slice(0, 30), empty: +e.toFixed(2), size: `${r2(p.getBoundingClientRect().width)}x${r2(p.getBoundingClientRect().height)}` }); if (out.hollowFragment.length >= 4) break; }
    }
  }

  // --- scene-track: a rail, scrubber, playhead or progress bar inside a scroll scene
  out.sceneTracks = [];
  {
    const dotLike = (e) => { const w = e.offsetWidth, h = e.offsetHeight; if (w < 4 || h < 4 || w > 20 || h > 20) return false; const cs = getComputedStyle(e); const rad = cs.borderTopLeftRadius; return !!rgb(cs.backgroundColor) && (/%/.test(rad) ? parseFloat(rad) >= 50 : parseFloat(rad) >= Math.min(w, h) / 2 - 0.5); };
    for (const scene of document.querySelectorAll('.scene, [data-scene]')) {
      if (scene.parentElement?.closest('.scene, [data-scene]')) continue;
      const id = sceneId(scene);
      if ([...scene.querySelectorAll('progress, [role=progressbar], [class*=progress i]')].some((e) => e.offsetWidth >= 40 && visible(e))) { out.sceneTracks.push({ id, w: 0, what: 'a progress bar' }); continue; }
      const dots = [...scene.querySelectorAll('span, i, b, div, em')].filter(dotLike);
      for (const l of scene.querySelectorAll('div, span, i, b, li, hr')) {
        if (l.closest('[data-ui]')) continue;
        const w = l.offsetWidth, h = l.offsetHeight; if (h < 1 || h > 6 || w < W * 0.15) continue;
        const cs = getComputedStyle(l); if (!rgb(cs.backgroundColor) && !sides(l) && !(parseFloat(cs.borderTopWidth) >= 1)) continue;
        const r = l.getBoundingClientRect();
        const dot = dots.find((d) => { if (l.contains(d)) return true; const q = d.getBoundingClientRect(); return q.right >= r.left - 4 && q.left <= r.right + 4 && q.bottom >= r.top - 4 && q.top <= r.bottom + 4; });
        const fill = [...l.children].find((c) => rgb(getComputedStyle(c).backgroundColor) && (c.offsetWidth < w - 1 || /matrix\(/.test(getComputedStyle(c).transform)));
        if (dot || fill) { out.sceneTracks.push({ id, w: r2(w), what: dot ? 'a track with a marker' : 'a bar that fills' }); break; }
      }
      if (out.sceneTracks.length >= 4) break;
    }
  }

  // --- the product replay: its beats, its control, never a recording, never doubled with the entrance; the
  // window's size, and how far its section holds it (replay.js holds the stage one beat at a time while the visitor
  // scrolls; a window that plays small and unheld is not noticed, r6-p32)
  out.replays = [...document.querySelectorAll('[data-replay]')].map((r) => {
    const list = String(r.dataset.replay || '').split(',').map(Number).filter((n) => n > 0);
    const beats = list.length === 1 && list[0] <= 8 ? list[0] : list.length;
    const marks = new Set();
    for (const e of r.querySelectorAll('[data-at], [data-type-at], [data-roll-at], [data-select-at], [data-flip-at], [data-press-at], [data-point-at], [data-style-at], [data-frame-at]')) for (const k of ['at', 'typeAt', 'rollAt', 'selectAt', 'flipAt', 'pressAt', 'pointAt', 'styleAt', 'frameAt']) if (e.dataset[k]) marks.add(+e.dataset[k]);
    for (const e of r.querySelectorAll('[data-says]')) for (const m of e.dataset.says.matchAll(/(\d+):/g)) if (+m[1] > 0) marks.add(+m[1]);
    const scope = r.closest('.replay-hold, section, article, [data-replay-scope]') || r.parentElement || r;
    const control = [...scope.querySelectorAll('button, [role=button], a')].some((b) => visible(b) && /replay|again|play/i.test(textOf(b) + ' ' + (b.getAttribute('aria-label') || '')));
    const rr = r.getBoundingClientRect();
    const recording = [...r.querySelectorAll('video, img')].some((m) => { const q = m.getBoundingClientRect(); return q.width * q.height >= rr.width * rr.height * 0.4; });
    const clash = r.matches('[data-e], [data-moment], [data-reveal]') || !!r.querySelector('[data-e], [data-moment], [data-reveal]') || (!!r.closest('[data-hero]') && document.body?.dataset.entrance === 'product-at-work');
    // the window a visitor sees: the product panel inside the figure when there is one
    const ui = r.querySelector('[data-ui]'); const wr = (ui && visible(ui) ? ui : r).getBoundingClientRect();
    // the hold: a sticky stage and the room its section gives it below (replay.js), or a pinned spacer (GSAP)
    let hold = 0;
    for (let e = r; e && e !== B; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.position === 'sticky' && e.parentElement) {
        const p = e.parentElement, pr = p.getBoundingClientRect(), pcs = getComputedStyle(p);
        hold = Math.max(0, pr.bottom - parseFloat(pcs.paddingBottom) - parseFloat(pcs.borderBottomWidth) - e.getBoundingClientRect().bottom);
        break;
      }
      if (e.parentElement?.classList.contains('pin-spacer')) { hold = Math.max(0, e.parentElement.offsetHeight - e.offsetHeight); break; }
    }
    return { beats, marks: marks.size, control, recording, clash, hero: !!r.closest('[data-hero]'), w: +(wr.width / W).toFixed(2), h: +(wr.height / H).toFixed(2), held: +(hold / H).toFixed(2), stage: !!r.closest('.replay-stage') };
  });

  // ---------- round 6: what judges found on pages every check above passed ----------
  // --- boxed-list: a list drawn as boxes. Three or more sibling items (questions, loads, specs, plans, features,
  // options) each on a fill unlike the ground they stand on, or outlined, with ground between them; a zebra list of
  // pills counts. Not inside a product window, a table, a scene or the navigation; not picture tiles; not fields that
  // tile one band edge to edge. r6-p31 (the loads as pill rows, the configurator's option tiles) and r6-p32 (the
  // questions as filled tiles) were called pages of boxes.
  out.boxedLists = [];
  {
    const boxed = (e) => !!filledOn(e) || sides(e) >= 3;
    // an item is drawn as a box itself, or by the one child that fills it (a label whose span is the tile)
    const drawnAs = (item) => {
      if (boxed(item)) return item;
      const kids = [...item.children].filter(visible);
      if (kids.length !== 1) return null;
      const a = kids[0].getBoundingClientRect(), b = item.getBoundingClientRect();
      return a.width * a.height >= b.width * b.height * 0.8 && boxed(kids[0]) ? kids[0] : null;
    };
    const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
    let m = 0;
    for (const list of B.querySelectorAll('*')) {
      if (++m > 8000 || out.boxedLists.length >= 6) break;
      if (list.childElementCount < 3 || out.boxedLists.some((x) => x.el.contains(list))) continue;
      if (list.closest('[data-ui], table, header, nav, footer, svg, dialog, [role=dialog], .scene, [data-scene], [aria-hidden=true], .replay')) continue;
      const items = [...list.children].filter((c) => !/^(SCRIPT|STYLE|TEMPLATE|BR|HR|INPUT)$/.test(c.tagName) && visible(c));
      if (items.length < 3) continue;
      // (filled fields are how a form draws its inputs without outlines; option tiles, radios and checkboxes, still count)
      const FIELD = 'select, textarea, input:not([type=radio]):not([type=checkbox]):not([type=hidden]):not([type=submit]):not([type=button])';
      if (items.filter((c) => c.matches(FIELD) || c.querySelector(FIELD)).length >= items.length * 0.5) continue;
      // (option tiles in a form whose own fields are drawn the same way are that form's look, r6-p30's guests beside
      // its date fields; a configurator of tiles alone, r6-p31, is a page of boxes)
      const form = list.closest('form');
      if (form && items.every((c) => c.querySelector('input[type=radio], input[type=checkbox]')) && [...form.querySelectorAll(FIELD)].some((f) => visible(f) && (filledOn(f) || sides(f) >= 3))) continue;
      const rs = items.map((c) => c.getBoundingClientRect());
      // (a band from screen edge to screen edge is a ground, not a box)
      const filled = items.map((c, i) => ({ c, r: rs[i], d: drawnAs(c) })).filter((x) => x.d && x.r.width >= 44 && x.r.height >= 22 && !(x.r.left <= 1 && x.r.right >= W - 1) && textOf(x.c)
        && ![...x.c.querySelectorAll('img, video, picture, canvas')].some((p) => { const q = p.getBoundingClientRect(); return q.width * q.height >= x.r.width * x.r.height * 0.5; }));
      // of one kind: the same tag, three at least and nearly half the list or more (a zebra list of pills counts)
      const tags = new Map(); for (const x of filled) tags.set(x.c.tagName, (tags.get(x.c.tagName) || 0) + 1);
      const [tag, n] = [...tags.entries()].sort((a, b) => b[1] - a[1])[0] || [null, 0];
      if (n < 3 || n < items.length * 0.45) continue;
      // ground between them: items that tile a band edge to edge are fields of colour, not boxes
      const order = [...rs].sort((a, b) => a.top - b.top || a.left - b.left);
      let touching = 0;
      for (let i = 1; i < order.length; i++) { const a = order[i - 1], b = order[i]; const row = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > Math.min(a.height, b.height) * 0.5; if (Math.abs(row ? b.left - a.right : b.top - a.bottom) <= 1) touching++; }
      if (touching >= (order.length - 1) * 0.6) continue;
      const box = filled.find((x) => x.c.tagName === tag);
      const sec = list.closest('section, article') || list.parentElement;
      out.boxedLists.push({ el: list, head: textOf(sec?.querySelector('h1, h2, h3') || sec || list).slice(0, 40), first: textOf(box.c).slice(0, 30), n, fill: filledOn(box.d) ? hex(filledOn(box.d)) : 'outlined' });
    }
    for (const x of out.boxedLists) delete x.el;
  }

  // --- lone-column: a split whose one column holds a heading and nothing else (one short line at most), or nothing
  // for most of the row's height, while the column beside it runs on (r6-p32: "What it costs" and "Questions" alone at
  // the top of an empty left column). A sticky column travels beside its content and is left out; the hero too.
  out.loneColumns = [];
  if (W >= 700) {
    const MEDIA = 'img, video, picture, canvas, iframe, [data-ui], input, select, textarea, button';
    const contentOf = (el) => {
      const rs = textRects(el);
      const add = (e) => { if (!visible(e)) return; const r = e.getBoundingClientRect(); if (r.width > 2 && r.height > 2) rs.push(r); };
      if (el.matches(MEDIA) || filledOn(el) || sides(el) >= 3) add(el);
      let k = 0;
      for (const e of el.querySelectorAll('*')) {
        if (++k > 600) break;
        if (e.parentElement?.closest('svg, [data-ui]')) continue;
        if (e.matches(MEDIA) || (e.tagName === 'svg' && e.getBoundingClientRect().width >= 40) || filledOn(e) || sides(e) >= 3 || /url\(/.test(getComputedStyle(e).backgroundImage)) add(e);
      }
      return rs;
    };
    // the height a set of boxes covers, each grown by 12px above and below (the gap between two paragraphs is not empty)
    const cover = (rs, top, bot) => {
      const iv = rs.map((r) => [Math.max(top, r.top - 12), Math.min(bot, r.bottom + 12)]).filter(([a, b]) => b > a).sort((a, b) => a[0] - b[0]);
      let tot = 0, s = null, e = null;
      for (const [a, b] of iv) { if (s === null || a > e) { if (s !== null) tot += e - s; s = a; e = b; } else e = Math.max(e, b); }
      return s === null ? 0 : tot + e - s;
    };
    const sticky = (el, row) => { for (let e = el; e && e !== row; e = e.parentElement) if (/sticky|fixed/.test(getComputedStyle(e).position)) return true; return [...el.querySelectorAll('h1, h2, h3, h4, div, aside, header')].some((e) => getComputedStyle(e).position === 'sticky'); };
    let m = 0;
    for (const row of B.querySelectorAll('*')) {
      if (++m > 6000 || out.loneColumns.length >= 6) break;
      if (row.childElementCount < 2) continue;
      if (row.closest('header, nav, footer, [data-ui], table, svg, dialog, [role=dialog], .scene, [data-scene], [data-hero], [aria-hidden=true]')) continue;
      const rr = row.getBoundingClientRect(); if (rr.width < W * 0.55 || rr.height < 200) continue;
      const kids = [...row.children].filter((c) => visible(c) && !/absolute|fixed/.test(getComputedStyle(c).position));
      if (kids.length < 2) continue;
      // the columns: children grouped by the horizontal room they share
      let cols = kids.map((k) => { const r = k.getBoundingClientRect(); return { l: r.left, r: r.right, els: [k] }; });
      for (let merged = true; merged;) {
        merged = false;
        outer: for (let i = 0; i < cols.length; i++) for (let j = i + 1; j < cols.length; j++) {
          if (Math.min(cols[i].r, cols[j].r) - Math.max(cols[i].l, cols[j].l) > 8) { cols[i] = { l: Math.min(cols[i].l, cols[j].l), r: Math.max(cols[i].r, cols[j].r), els: [...cols[i].els, ...cols[j].els] }; cols.splice(j, 1); merged = true; break outer; }
        }
      }
      if (cols.length < 2) continue;
      for (const c of cols) { c.rects = c.els.flatMap(contentOf); c.words = c.els.reduce((a, e) => a + words(textOf(e)), 0); }
      const all = cols.flatMap((c) => c.rects); if (!all.length) continue;
      const top = Math.min(...all.map((r) => r.top)), bot = Math.max(...all.map((r) => r.bottom)), span = bot - top;
      if (span < 260) continue;
      for (const c of cols) c.fill = cover(c.rects, top, bot) / span;
      // the column that runs on is text: beside a picture, a product window or a form, a short column is its caption
      const BIG = 'img, video, picture, canvas, iframe, [data-ui], form, select, textarea, input';
      for (const c of cols) c.media = cover(c.els.flatMap((e) => [e, ...e.querySelectorAll(BIG)]).filter((e) => e.matches(BIG) && visible(e)).map((e) => e.getBoundingClientRect()), top, bot) / span;
      const fullCol = cols.reduce((a, b) => (b.fill > a.fill ? b : a));
      if (fullCol.fill < 0.7 || fullCol.words < 40 || fullCol.media >= 0.5) continue;
      for (const c of cols) {
        if (c === fullCol || c.fill > 0.35 || c.r - c.l < W * 0.12 || c.els.some((e) => sticky(e, row))) continue;
        // a heading and a short line alone; or any column, a tool or a paragraph, that floats over a screen or more of
        // empty ground beside the text that runs on (r4-p25: the brew calculator beside the long menu)
        const short = c.words <= 30;
        if (!short && span * (1 - c.fill) < H * 0.75) continue;
        const h = c.els.map((e) => (e.matches('h1, h2, h3, h4, [role=heading]') ? e : e.querySelector('h1, h2, h3, h4, [role=heading]'))).find(Boolean);
        if (h && h.tagName === 'H1') continue;
        out.loneColumns.push({ text: textOf(h || c.els[0]).slice(0, 40) || 'an empty column', heading: !!h && short, fill: +c.fill.toFixed(2), span: r2(span), y: r2(top + sy) });
        break;
      }
    }
  }
  return out;
}

// Decorative controls (round 6): a switch, checkbox or slider on the page that changes nothing when it is used
// (r6-p32 listed its features as switches, the ones "off" greyed). Each is used once (clicked, or its value moved),
// watched for 300ms and put back. It is real when words on the page change, something appears, goes or fades out, the
// page's own state or colours (html, body, main) change, a picture or another control changes, or it sits in a form that
// is sent (an action, a button or a submit handler). Restyling its own row is not a change. Also the rows that hold
// these controls, by their contrast (a greyed row is text like any other: 4.5:1, 3:1 at 24px or more). Async: run it
// after everything else, it uses the page.
export async function controls() {
  const W = innerWidth, H = innerHeight, B = document.body || document.documentElement;
  const out = { decorative: [], greyed: [], tested: 0 };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const shows = (el) => { if (!el || !el.isConnected) return false; const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return false; const r = el.getBoundingClientRect(); return r.width > 1 && r.height > 1; };
  const textOf = (el) => (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ');
  const SEL = 'input[type=checkbox], [role=switch], [role=checkbox], input[type=range], [role=slider]';
  // (a form with a button of its own, or a submit handler, is sent, by the browser or by script; a switch drawn as a
  // button is not the form's button)
  const sent = (f) => !!f && (f.hasAttribute('action') || f.method === 'dialog' || !!f.onsubmit || [...f.querySelectorAll('button, [type=submit], input[type=image]')].some((b) => !b.matches(SEL) && !b.querySelector(SEL)));
  const all = [...document.querySelectorAll(SEL)].filter((c) => !c.closest('[data-ui], header, nav, [role=banner], dialog, [role=dialog], [aria-hidden=true], .scene, [data-scene]') && !c.disabled);
  // the control as a visitor sees it: itself, or its label when the input is hidden under a styled label
  const face = (c) => (shows(c) && getComputedStyle(c).opacity > 0.05 ? c : c.closest('label') || (c.id && document.querySelector(`label[for="${CSS.escape(c.id)}"]`)) || c);
  const cands = all.filter((c) => !sent(c.form || c.closest('form')) && shows(face(c))).slice(0, 10);
  // its own row: the largest box round it that holds no other control (and is not the page or a whole section of controls)
  const rowOf = (c) => { let row = c; for (let e = c.parentElement; e && e !== B && e !== document.documentElement && !e.matches('main, section, article, form'); e = e.parentElement) { if (all.some((o) => o !== c && e.contains(o))) break; row = e; } return row; };
  // what the page shows outside the control itself (and the label it sits in): the visible words, how many elements
  // show, the pictures, the other controls' state (an output beside a slider is the slider at work), and its look: the
  // page's own colours (a theme switch done in CSS alone) and which texts outside the control's row are faded out (a
  // price switch that swaps prices by opacity). Restyling its own row is not a change.
  const state = (own, row) => {
    const tw = document.createTreeWalker(B, NodeFilter.SHOW_TEXT); let words = '', n;
    while ((n = tw.nextNode())) { const el = n.parentElement; if (!el || own.contains(el) || !n.nodeValue.trim() || el.closest('script, style')) continue; if (el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden') words += n.nodeValue.trim() + ' '; }
    let shown = 0; for (const e of B.querySelectorAll('*')) if (!own.contains(e) && e.getClientRects().length) shown++;
    const pics = [...document.querySelectorAll('img, video, source')].map((e) => e.currentSrc || e.src || '').join('|');
    const ctl = all.filter((o) => !own.contains(o)).map((o) => (o.checked ? 1 : 0) + ':' + (o.value || '') + ':' + (o.getAttribute('aria-checked') || '')).join('|');
    const page = [document.documentElement, B].map((e) => [...e.attributes].map((a) => a.name + '=' + a.value).join(';')).join('|');
    const look = [document.documentElement, B, document.querySelector('main')].filter(Boolean).map((e) => { const cs = getComputedStyle(e); return cs.backgroundColor + ' ' + cs.color; }).join('|');
    let faded = '', k = 0;
    for (const e of B.querySelectorAll('*')) { if (++k > 4000) break; if (row.contains(e) || e.contains(row) || !e.firstChild || /^(SCRIPT|STYLE)$/.test(e.tagName)) continue; if ([...e.childNodes].some((t) => t.nodeType === 3 && t.nodeValue.trim()) && +getComputedStyle(e).opacity < 0.1) faded += k + ','; }
    return { words, shown, pics, ctl, page, look, faded };
  };
  // a slider is moved half its range (an ARIA slider by the arrow key), a checkbox or switch clicked
  const key = (c, k) => c.dispatchEvent(new KeyboardEvent('keydown', { key: k, code: k, bubbles: true, cancelable: true }));
  const use = (c) => {
    if (c.matches('input[type=range]')) { const v = +c.value, max = +(c.max || 100), min = +(c.min || 0); c.value = String(v < max ? Math.min(max, v + (max - min) / 2) : min); c.dispatchEvent(new Event('input', { bubbles: true })); c.dispatchEvent(new Event('change', { bubbles: true })); return v; }
    if (c.matches('[role=slider]')) { if (c.focus) c.focus({ preventScroll: true }); key(c, 'ArrowRight'); return 'key'; }
    c.click(); return null;
  };
  const undo = (c, v) => { if (v === 'key') key(c, 'ArrowLeft'); else if (v != null) { c.value = String(v); c.dispatchEvent(new Event('input', { bubbles: true })); c.dispatchEvent(new Event('change', { bubbles: true })); } else c.click(); };
  // nothing a control does may leave the page: no submit, no link followed
  const stopSubmit = (e) => e.preventDefault();
  const stopLink = (e) => { const a = e.target.closest && e.target.closest('a[href]'); if (a && !/^#/.test(a.getAttribute('href') || '')) e.preventDefault(); };
  addEventListener('submit', stopSubmit, true); addEventListener('click', stopLink, true);
  const x0 = scrollX, y0 = scrollY;
  try {
    for (const c of cands) {
      const row = rowOf(c);
      // a class, src or data change outside the row on an element that holds or is a picture (a swatch recolouring the
      // product) is a change too; style writes are left out, running animations make them all the time
      const seen = [];
      const mo = new MutationObserver((list) => { for (const m of list) if (m.type === 'attributes' && m.attributeName !== 'style' && !row.contains(m.target) && !m.target.contains(row) && (m.target.matches('img, video, picture, canvas, svg') || m.target.querySelector?.('img, video, canvas'))) seen.push(m.attributeName); });
      const own = c.closest('label') || c;
      const before = state(own, row);
      mo.observe(B, { attributes: true, subtree: true });
      const v = use(c); await wait(300);
      mo.disconnect();
      const after = state(own, row);
      undo(c, v); await wait(120);
      out.tested++;
      const changed = ['words', 'shown', 'pics', 'ctl', 'page', 'look', 'faded'].some((k) => before[k] !== after[k]) || seen.length;
      const label = textOf(row).slice(0, 50) || c.getAttribute('aria-label') || c.name || c.id || c.tagName.toLowerCase();
      if (!changed) out.decorative.push({ text: label, what: c.matches('input[type=range], [role=slider]') ? 'slider' : c.matches('[role=switch]') ? 'switch' : 'checkbox' });
    }
  } finally {
    removeEventListener('submit', stopSubmit, true); removeEventListener('click', stopLink, true);
    scrollTo(x0, y0);
  }
  // the rows of a list of controls, by their contrast: the text against the ground it stands on, faded by opacity
  const rgba = (s) => { const m = s && s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const ground = (el) => { for (let e = el; e; e = e.parentElement) { const c = rgba(getComputedStyle(e).backgroundColor); if (c && c.a >= 0.9) return c; } return { r: 255, g: 255, b: 255, a: 1 }; };
  // (the rows of a list of switches or checkboxes outside a form that is sent: a feature list set as settings)
  const rows = cands.map(rowOf);
  if (rows.length >= 2) {
    for (const row of rows.slice(0, 12)) {
      const tw = document.createTreeWalker(row, NodeFilter.SHOW_TEXT); let n;
      while ((n = tw.nextNode())) {
        const el = n.parentElement; const t = n.nodeValue.trim(); if (!el || t.length < 3 || !shows(el)) continue;
        let o = 1; for (let e = el; e && e !== document.documentElement; e = e.parentElement) o *= +getComputedStyle(e).opacity;
        const fg = rgba(getComputedStyle(el).color); if (!fg) continue; const bg = ground(el); const a = fg.a * o;
        const mix = { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a) };
        const l1 = lum(mix), l2 = lum(bg); const ratio = Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 10) / 10;
        // (the contrast check's own targets: 4.5:1 for text, 3:1 for large display, 24px or more)
        const need = parseFloat(getComputedStyle(el).fontSize) >= 24 ? 3 : 4.5;
        if (ratio < need) { out.greyed.push({ text: t.slice(0, 40), ratio, need }); break; }
      }
      if (out.greyed.length >= 6) break;
    }
  }
  return out;
}
