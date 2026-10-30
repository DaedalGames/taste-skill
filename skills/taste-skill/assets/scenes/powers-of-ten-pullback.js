// tasteskill / scenes / powers-of-ten-pullback.js — a camera pulls back through nested pictures.
//
// A full-bleed film (or a still from it) shrinks until it is a screen on the wall of a real place: a
// screen hung on a calm wall (the scene draws its housing), or a measured opening such as a window, a
// frame or a billboard. Then the place shrinks until it is the picture inside an object resting on the
// page's plain ground: a framed print or a device screen, built in CSS so it registers by construction.
// Three flat layers scale at different rates in log space, all driven by eased values, so the film lands
// on its wall and stays there. By default it is one reveal (jumps 1): the film becomes the screen on the
// wall and the pull-back ends full-bleed in the place, with the copy on a band of the page's ground. The
// second reveal into a framed print (jumps 2, about an 11x pull-back, 18x on a phone) is kept for pages
// built with it; it is the stock half of the scene, so it is no longer the default. Use it when the
// punchline is context: a reel shown in a space, a product in its setting, something at its true scale.
// The phone runs the same reveal on the 4:5 crop of the place, with the copy on the band.
//
// Needs gsap + ScrollTrigger, stage.js and powers-of-ten-pullback.css. No SplitText.
//
// DOM (the CSS file draws the finished composition from the same markup):
//   <section class="scene pb" data-scene="powers-of-ten-pullback" data-options='{}' aria-labelledby="pb-head">
//     <div class="scene-stage pb-stage">
//       <div class="pb-field" aria-hidden="true"></div>
//       <div class="pb-tilt">                                   the settle: rotation and drop
//         <div class="pb-world">                                level 2: the object (frame or bezel)
//           <div class="pb-slot">                               the object's picture opening
//             <div class="pb-room" style="--wx:.335;--wy:.245;--ww:.33;--wh:.2784;
//                                        --wx-sm:.275;--wy-sm:.255;--ww-sm:.45;--wh-sm:.2025">
//               <picture>                                       level 1: the place
//                 <source media="(max-width: 767px)" srcset="room-4x5.webp 1600w, room-4x5-l.webp 2666w"
//                         sizes="175vw" width="1600" height="2000">
//                 <img class="pb-room-img" src="room.webp" srcset="room.webp 2400w, room-l.webp 3600w"
//                      sizes="170vw" width="3600" height="2400" alt="the place">   sizes = depth x 100vw: the
//                                                       room is laid out at its start scale and only shrinks
//               </picture>
//               <div class="pb-inner">                         level 0: the film's box
//                 <img class="pb-film" src="still.webp" width="2560" height="1440" alt="the film">
//                 (or <video class="pb-film" muted loop playsinline controls preload="metadata" poster="still.webp">:
//                  the live scene hides the controls and plays it; at rest it is the poster with controls)
//               </div>
//             </div>
//             <div class="pb-glass" aria-hidden="true"></div>
//           </div>
//           <div class="pb-object" aria-hidden="true"></div>    the frame and mat, drawn in CSS
//         </div>
//       </div>
//       <div class="pb-scrim" aria-hidden="true"></div>
//       <header class="pb-title"><p>the film's name, 2-6 words</p><p>one sentence, 8-16 words</p></header>
//       <p class="pb-label">the wall label, 6-10 words</p>   live, it joins the copy as plain words under the
//                                                           headline (never a card on the picture); at rest
//                                                           it is the last line of the caption
//       <div class="pb-copy"><h2 id="pb-head">3-8 words, two lines</h2><p>18-32 words</p><a href="#">2-3 words</a></div>
//       <div class="pb-ground" aria-hidden="true"></div>       optional (made when missing): jumps 1 only
//     </div>
//   </section>
// The copy's headline is the section's heading (any level; it is .pb-copy's first child). The opening
// title is .pb-title's first child; at rest it becomes the caption under the object, so it is a <p>.
//
// Timing (jumps 1): the camera rides the scroll (the film settles into its window over 0.10-0.28, the room
// pulls back around it over 0.10-0.62, then a rest on the wall to 0.76).
// What must never stand half done runs on a short clock once the scroll passes its point, and plays back
// when the scroll returns: the opening title and its scrim leave in 0.3s at 0.04; at 0.76 the band rises
// from the foot to the landed screen's bottom edge (so whatever stands under the screen is covered whole,
// never sliced by the band's edge) and the headline and the wall label settle on it; the words and the
// link follow at 0.86. A stopped scroll never shows a grey ghost of the title or half-faded copy.
//
// The window. --wx --wy --ww --wh on .pb-room are where the film sits, as fractions of the room picture's
// natural box (x y width height, 4 decimals): the screen's picture area on a calm wall, or the INNER edge
// of a real opening. Its pixel aspect is the film's aspect. The -sm set is used under 768px, where the
// room should be a 4:5 portrait crop given through <picture><source> (the window about 0.45 of its width,
// over the wall, with the people or things that give the place its scale left in view below it). Both the
// live scene and the finished composition read them, so the film is registered with or without script.
// Never put object-fit or a CSS size on the room picture; give it its real width and height attributes
// (on the <source> too). The live scene moves the room so the window sits as near the stage's centre as
// the picture allows; a window whose middle is at 38-48% of the picture's height reads best.
//
// Options (data-options JSON; defaults, ranges):
//   jumps       1          1 | 2     1 = film -> room, ending full-bleed in the room with the copy on a
//                                    band of ground (the default); 2 = film -> room -> object, the
//                                    framed print (the default before fix-002: give it to keep it)
//   hold        1.8 (3 at jumps 2)   1.5-4 screens the stage is held on desktop
//   holdPhone   2.2 (2.6 at jumps 2) 1.6-3.2 screens on a phone
//   depth       1.7        1-2.2     the room's start scale: 1 = the film flies back into a still wall,
//                                    1.7 = a dolly out of a hall, 2.2 = strong parallax (needs a 4800px room)
//   depthPhone  1.8        1-2.2
//   end         0.32       0.24-0.44 the object's opening at the end, as a share of the stage width
//   endPhone    0.56       0.4-0.7   the same on a phone, where the print settles centred at the top
//   side        "right"    "right" | "left": where the object settles; the copy takes the other side
//                          (for "left" also put class="pb-side-left" on the section, so the finished
//                          composition matches without script)
//   tilt        0          0-6       jumps 2: degrees the object turns as it settles (0 = flat, the
//                                    default since fix-002; phones and upright tablets use at most 2)
//   drop        0.02       0-0.06    how far it drops as it settles, as a share of the stage height
//   drift       0.08 (0 for a video) 0-0.15  the still's slow zoom inside its box, so held frames live
//   scrub       0.8 (0.4 with Lenis) seconds of catch-up, or true
//   phone       "same"     "same" | "rest" (the phone gets the finished composition)
// Upright tablets (768-1099px wide, under 1.2:1) settle the object centred near the top at 0.52 of the
// width, with the copy centred under it; landscape tablets use the desktop layout.
//
// CSS custom properties on the section (the finished composition reads them too):
//   --pb-aspect 1.7778     the object's opening (width / height); the room is cropped to it
//   --pb-aspect-sm .8      the same on a phone (a portrait print)
//   --pb-housing .018      the screen's housing around the film, as a share of the film's width; it
//                          scales with the film, so the screen's edge shows first and the wall second.
//                          0 when the window is a real opening (a window, a frame) with its own edge.
//   --pb-housing-color var(--ink)
//   --pb-frame  0.035      frame thickness, as a share of the opening's width
//   --pb-mat    0.11       mat thickness (0 for a device bezel)
//   --pb-frame-color var(--ink)   --pb-mat-color var(--surface)   --pb-radius 0 (the opening's corners)
//   --pb-scrim  rgb(0 0 0 / .34)  flat scrim under the opening title while the film is full-bleed
//   --pb-glass  rgb(255 255 255 / .06)  flat glazing over the room once it is a picture in the object
// Page tokens: --ground (the field), --ink, --muted, --surface (the mat), --accent
// (the link), --font-display, --font-text.
//
// Pictures: the film, 16:9 (the window's aspect), 2560 wide, its subject in the centre third (the phone
// starts on the middle quarter). The room: a place seen straight on, 3:2 or 4:3, 3600 wide or more, with a
// calm wall (or one rectangular opening) for the window at 0.30-0.36 of its width, centred within 6%, and
// what gives it depth and scale around it: a floor, a ceiling, lines leading in, a person, a bench. A dark
// room makes the film glow. A video film needs muted, loop and playsinline, and a good poster: it plays
// only while the section is near the screen.
(() => {
  const ID = 'powers-of-ten-pullback';
  const num = (v, d) => { const n = parseFloat(v); return Number.isFinite(n) ? n : d; };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const px = (n) => Math.round(n * 100) / 100 + 'px';
  // the one-jump pull-back runs on two eased values. The film settles into its window fast (most of the
  // way in its first sixth, so the wall frames the film at once, never a strip of room along one edge,
  // and the film is over the figures under its window only briefly); the room keeps pulling back with the
  // film registered in it, on a gentle curve, so every tenth until it lands shows the camera moving (one
  // value for both stood still for its last three tenths)
  const pullEase = (t) => 0.7 * (1 - Math.pow(1 - t, 10)) + 0.3 * (1 - Math.pow(1 - t, 2));
  const roomEase = (t) => 1 - Math.pow(1 - t, 1.4);

  window.Scenes = window.Scenes || {};
  Scenes[ID] = (root, opts = {}) => {
    const jumps = +opts.jumps === 2 ? 2 : 1;
    const side = (opts.side ?? (root.classList.contains('pb-side-left') ? 'left' : 'right')) === 'left' ? 'left' : 'right';
    const o = {
      jumps,
      side,
      hold: clamp(num(opts.hold, jumps === 1 ? 1.8 : 3), 1.5, 4),
      holdPhone: clamp(num(opts.holdPhone, jumps === 1 ? 2.2 : 2.6), 1.6, 3.2),
      depth: clamp(num(opts.depth, 1.7), 1, 2.2),
      depthPhone: clamp(num(opts.depthPhone, 1.8), 1, 2.2),
      end: clamp(num(opts.end, 0.32), 0.24, 0.44),
      endPhone: clamp(num(opts.endPhone, 0.56), 0.4, 0.7),
      tilt: clamp(Math.abs(num(opts.tilt, 0)), 0, 6),
      drop: clamp(num(opts.drop, 0.02), 0, 0.06),
      drift: opts.drift == null ? null : clamp(num(opts.drift, 0.08), 0, 0.15),
    };
    const q1 = (sel) => root.querySelector(sel);
    const el = {
      stage: q1('.pb-stage') || q1('.scene-stage'),
      tilt: q1('.pb-tilt'), world: q1('.pb-world'), slot: q1('.pb-slot'), room: q1('.pb-room'),
      img: q1('.pb-room-img'), inner: q1('.pb-inner'), film: q1('.pb-film'), glass: q1('.pb-glass'),
      object: q1('.pb-object'), scrim: q1('.pb-scrim'), title: q1('.pb-title'), label: q1('.pb-label'),
      copy: q1('.pb-copy'), ground: q1('.pb-ground'),
    };
    root.classList.add('pb');
    root.classList.toggle('pb-side-left', side === 'left');
    // the finished composition follows the plan: the framed print, and its resting tilt, only at jumps 2
    root.classList.toggle('pb-print', jumps === 2);
    root.style.setProperty('--pb-tilt', String(o.tilt));
    const video = el.film && el.film.tagName === 'VIDEO' ? el.film : null;
    const drift = o.drift ?? (video ? 0 : 0.08);
    let inst = null;

    // The film: a video plays only while the scene is live and near the screen; at rest it is a poster
    // with controls, and nothing autoplays.
    const restVideo = () => {
      if (!video) return;
      video.pause(); video.removeAttribute('autoplay'); video.controls = true;
    };

    function live(tl, ctx, mode) {
      if (inst) inst.destroy();
      const { stage, tilt, world, slot, room, img, inner, film, glass, scrim, title, label, copy } = el;
      if (!stage || !world || !slot || !room || !img || !inner) { console.warn(ID + ': markup incomplete'); return; }
      let ground = el.ground;
      let madeGround = false;
      if (mode === 'one' && !ground) {
        ground = document.createElement('div');
        ground.className = 'pb-ground'; ground.setAttribute('aria-hidden', 'true');
        stage.appendChild(ground); madeGround = true;
      }
      root.classList.add(mode === 'one' ? 'pb-one' : 'pb-two');
      // the wall label joins the copy, as plain words under its headline: no card is laid on the picture.
      // It goes back to its place in the finished composition when the live scene is cleared.
      let labelHome = null;
      if (label && copy && label.parentElement !== copy) {
        labelHome = [label.parentElement, label.nextSibling];
        const h = copy.firstElementChild;
        copy.insertBefore(label, h ? h.nextSibling : copy.firstChild);
      }
      // j1: the room's pull-back; jf: the film into its window (one value with j1 at jumps 2)
      const j1 = { v: 0 }, j2 = { v: 0 }, jf = mode === 'one' ? { v: 0 } : j1;
      const g = { Z: 1, D0: 1, r2: 1, H: 1, W: 1, tiltDeg: 0 };
      const touched = [world, slot, room, inner, label, tilt, stage, ground].filter(Boolean);
      let dead = false;   // the proxies' tweens call draw() while GSAP reverts them, after destroy()

      const draw = () => {
        if (dead) return;
        room.style.transform = `scale(${Math.pow(g.Z, -j1.v)})`;
        // the film's box is registered with its window once jf is 1, at any scale of the room around it
        inner.style.transform = `scale(${Math.pow(g.D0, -jf.v)})`;
        world.style.transform = mode === 'two' ? `scale(${Math.pow(g.r2, j2.v)})` : '';
      };

      // the room picture's box: its natural size once known, else the width and height attributes of the
      // <source> the browser picked (a phone's portrait crop), else the <img>'s own
      const dims = () => {
        if (img.naturalWidth && img.naturalHeight) return [img.naturalWidth, img.naturalHeight];
        const pic = img.parentElement && img.parentElement.tagName === 'PICTURE' ? img.parentElement : null;
        for (const s of pic ? pic.querySelectorAll('source') : []) {
          if (s.media && !window.matchMedia(s.media).matches) continue;
          const w = num(s.getAttribute('width'), 0), h = num(s.getAttribute('height'), 0);
          if (w && h) return [w, h];
          break;
        }
        return [num(img.getAttribute('width'), 3), num(img.getAttribute('height'), 2)];
      };

      const layout = () => {
        if (dead) return;
        const W = stage.clientWidth || window.innerWidth, H = stage.clientHeight || window.innerHeight;
        // a phone or an upright tablet stacks: the object settles centred at the top, the copy under it
        const stack = mode === 'two' && (ctx.phone || (W < 1100 && W / H < 1.2));
        const tablet = stack && !ctx.phone;
        root.classList.toggle('pb-stack', stack);
        const [nw, nh] = dims();
        const AR = nw / nh;
        const rs = getComputedStyle(room), ss = getComputedStyle(root);
        const wx = num(rs.getPropertyValue('--pb-wx'), 0.335), wy = num(rs.getPropertyValue('--pb-wy'), 0.335);
        const ww = num(rs.getPropertyValue('--pb-ww'), 0.33), wh = num(rs.getPropertyValue('--pb-wh'), 0.33);
        const aspect = ctx.phone
          ? clamp(num(ss.getPropertyValue('--pb-aspect-sm'), 0.8), 0.5, 3)
          : clamp(num(ss.getPropertyValue('--pb-aspect'), 16 / 9), 0.5, 3);
        const housing = clamp(num(ss.getPropertyValue('--pb-housing'), 0.018), 0, 0.08);
        // (1) the slot: the object's opening, covering the stage at the start (the stage itself for one
        //     jump). The mat overlaps the room's edge by `ov` layout px, sized so it still covers about 1.6
        //     screen px once the world has shrunk, and the slot overscans the stage so none of it shows at 0.
        const endShare = ctx.phone ? o.endPhone : tablet ? Math.max(o.end, 0.52) : o.end;
        let slotW = W, slotH = H, ov = 1;
        if (mode === 'two') {
          ov = clamp(1.6 * Math.max(W, H * aspect) / (endShare * W), 1, 8);
          const os = ov + 3;
          slotW = Math.max(W + 2 * os, (H + 2 * os) * aspect); slotH = slotW / aspect;
        }
        const sx = (W - slotW) / 2, sy = (H - slotH) / 2;
        // (2) the room at rest: a cover fit of the slot, moved (inside the cover) so the window's centre
        //     sits as near the slot's centre as the picture allows. Oc = the window's centre; the landed film.
        const rW = Math.max(slotW, slotH * AR), rH = rW / AR;
        const fx = wx + ww / 2, fy = wy + wh / 2;
        const rx = clamp(slotW / 2 - fx * rW, slotW - rW, 0), ry = clamp(slotH / 2 - fy * rH, slotH - rH, 0);
        const ocx = rx + fx * rW, ocy = ry + fy * rH;
        const lw = ww * rW + 4, lh = wh * rH + 4;                   // 2px outset on every side
        const filmAR = lw / lh;
        // (4) the film's start box: 1.06 x the cover needed around Oc, so no room shows at 0
        const cx = sx + ocx, cy = sy + ocy;
        const l0W = 1.06 * Math.max(2 * Math.max(cx, W - cx), 2 * Math.max(cy, H - cy) * filmAR);
        const l0H = l0W / filmAR;
        // (3) the room is laid out at its start scale and only ever scales down; origin = the window's centre
        const Z = Math.min(ctx.phone ? o.depthPhone : o.depth, l0W / lw);
        const RW = rW * Z, RH = rH * Z, ox = fx * RW, oy = fy * RH;
        Object.assign(room.style, { left: px(ocx - ox), top: px(ocy - oy), width: px(RW), height: px(RH), transformOrigin: `${px(ox)} ${px(oy)}` });
        Object.assign(inner.style, { left: px(ox - l0W / 2), top: px(oy - l0H / 2), width: px(l0W), height: px(l0H) });
        // the housing is drawn in the film's own px, so it scales with the film and lands with it
        inner.style.setProperty('--pb-hpx', px(housing * l0W));
        g.Z = Z; g.D0 = l0W / (lw * Z); g.W = W; g.H = H;
        // (5) the world: frame and mat around the slot; it scales to r2 about the fixed point F
        if (mode === 'two') {
          const fr = clamp(num(ss.getPropertyValue('--pb-frame'), 0.035), 0, 0.3) * slotW;
          const mt = clamp(num(ss.getPropertyValue('--pb-mat'), 0.11), 0, 0.4) * slotW;
          const b = fr + mt;
          const left = side === 'left';
          g.r2 = Math.min(0.95, (endShare * W) / slotW);
          g.tiltDeg = (stack ? Math.min(o.tilt, 2) : o.tilt) * (left ? 1 : -1);
          const ow = (slotW + 2 * b) * g.r2, oh = (slotH + 2 * b) * g.r2, rad = Math.abs(g.tiltDeg) * Math.PI / 180;
          const ex = (stack ? 0.5 : left ? 1 - 0.66 : 0.66) * W;
          // a phone centres the settled print and the copy under it as one group on the stage
          const half = (oh / 2) * Math.cos(rad) + (ow / 2) * Math.sin(rad);
          const groupH = 2 * half + 36 + (copy ? copy.offsetHeight : 0);
          const ey = ctx.phone ? clamp((H - groupH) / 2, 0.05 * H, 0.2 * H) - o.drop * H + half : (tablet ? 0.34 : 0.46) * H;
          const Fx = W / 2 + (ex - W / 2) / (1 - g.r2), Fy = H / 2 + (ey - H / 2) / (1 - g.r2);
          Object.assign(world.style, { left: px(sx - b), top: px(sy - b), width: px(slotW + 2 * b), height: px(slotH + 2 * b), transformOrigin: `${px(Fx - (sx - b))} ${px(Fy - (sy - b))}` });
          Object.assign(slot.style, { left: px(b), top: px(b), width: px(slotW), height: px(slotH) });
          world.style.setProperty('--pb-fpx', px(fr));
          world.style.setProperty('--pb-mpx', px(mt));
          world.style.setProperty('--pb-opx', px(ov));
          if (tilt) tilt.style.transformOrigin = `${px(ex)} ${px(ey)}`;
          // where the settled object ends, so a stacked layout starts its copy under it
          const bottom = ey + o.drop * H + half;
          stage.style.setProperty('--pb-copy-top', px(Math.min(bottom + (ctx.phone ? 36 : 48), 0.7 * H)));
        } else {
          Object.assign(world.style, { left: '0px', top: '0px', width: px(W), height: px(H), transformOrigin: '' });
          Object.assign(slot.style, { left: '0px', top: '0px', width: px(W), height: px(H) });
          g.r2 = 1; g.tiltDeg = 0;
          // the band of ground that carries the copy at the end starts at the landed screen's bottom edge (its
          // housing, overlapped by 1px so no line of wall shows): whatever stands under the screen, a person,
          // a dog, a bench, is covered whole and never sliced by the band's edge (48px under the film, the
          // band cut the head of the figure under it into a half-disc)
          const top = clamp(cy + lh / 2 + housing * lw - 1, 0.34 * H, 0.66 * H);
          stage.style.setProperty('--pb-band', px(top));
        }
        draw();
      };

      const onRefreshInit = () => layout();
      ScrollTrigger.addEventListener('refreshInit', onRefreshInit);
      ScrollTrigger.addEventListener('refresh', draw);
      const onLoad = () => { layout(); };
      img.addEventListener('load', onLoad);
      layout();
      // decode before anything moves; a late picture re-lays the scene out
      Promise.all([img.decode ? img.decode().catch(() => {}) : null, film && film.decode ? film.decode().catch(() => {}) : null])
        .then(() => { if (inst && inst.layout === layout) { layout(); ScrollTrigger.refresh(); } });

      const head = copy ? copy.firstElementChild : null;
      // the headline and the wall label arrive together; the words and the link follow
      const lead = [head, label && label.parentElement === copy ? label : null].filter(Boolean);
      const rest = copy ? [...copy.children].filter((c) => !lead.includes(c)) : [];
      // One jump: the camera rides the scroll, and everything that must never stand half done runs on a
      // short clock once the scroll passes its point (and plays back when the scroll returns), so a stopped
      // scroll never shows a grey ghost of the title, a band whose edge slices the figure under the screen,
      // or half-faded copy. The tenths: the title over the film (0), the bare film (10%), the film framed by
      // its wall (20%: most of the way back at once, so the room never shows as a strip along one edge), the
      // film in its window from 0.28 while the room keeps pulling back around it, 6-12% smaller at every
      // tenth to 60%, the rest on the wall (0.62-0.76, a tenth and a half), the band with the headline and
      // the wall label (80%), the whole copy (90-100%).
      // Two jumps keep their scrubbed timing (only the title is on a clock there too).
      const A = mode === 'two'
        ? { j1: [0.04, 0.38], ease: 'sine.inOut', t1: 0.04, j2: [0.56, 0.28], tilt: 0.70, h: [0.82, 0.10], r: [0.85, 0.10], y: 32 }
        : { jf: [0.10, 0.18], j1: [0.10, 0.52], ease: roomEase, t1: 0.04, band: 0.76, r: 0.86, y: 24 };

      // 1. the first reveal, in log space. Two jumps: room and film read one eased value, so they land
      // together. One jump: the film is in its window by 0.28 (at the 20% step its edge already clears the
      // head of the figure under the window), the room lands at 0.62
      tl.fromTo(j1, { v: 0 }, { v: 1, duration: A.j1[1], ease: A.ease, onUpdate: draw }, A.j1[0]);
      if (jf !== j1) tl.fromTo(jf, { v: 0 }, { v: 1, duration: A.jf[1], ease: pullEase, onUpdate: draw }, A.jf[0]);
      if (film && drift) tl.fromTo(film, { scale: 1 + drift }, { scale: 1, duration: mode === 'two' ? 0.84 : 0.86, ease: 'none' }, 0);
      // clocks: a paused tween per beat, played when the scroll passes its point and reversed when it
      // comes back; a landing far from the point (a reload mid-page) jumps instead of animating
      const clocks = [];
      const clock = (at, tw) => { const c = { at, tw, on: false }; clocks.push(c); return c; };
      // 2. the opening title and its scrim leave on a 0.3s clock as the pull-back is about to start
      const t1 = gsap.timeline({ paused: true });
      if (scrim) t1.fromTo(scrim, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3, ease: 'power1.inOut', immediateRender: false }, 0);
      if (title) t1.fromTo(title, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -24, duration: 0.3, ease: 'power1.inOut', immediateRender: false }, 0);
      if (t1.duration()) clock(A.t1, t1);
      if (mode === 'two') {
        // 4. the second reveal: the world shrinks about F, so the slot travels straight to its end point
        tl.fromTo(j2, { v: 0 }, { v: 1, duration: A.j2[1], ease: 'sine.inOut', onUpdate: draw }, A.j2[0]);
        if (glass) tl.fromTo(glass, { opacity: 0 }, { opacity: 1, duration: 0.10 }, A.j2[0]);
        // 5. the settle, after the zoom has landed
        if (tilt) tl.fromTo(tilt, { rotation: 0, y: 0 }, { rotation: () => g.tiltDeg, y: () => o.drop * g.H, duration: 0.20, ease: 'power2.out' }, A.tilt);
        // 6. the copy (with the wall label under its headline), on the plain field
        if (lead.length) tl.fromTo(lead, { autoAlpha: 0, y: A.y }, { autoAlpha: 1, y: 0, duration: A.h[1], ease: 'power3.out' }, A.h[0]);
        if (rest.length) tl.fromTo(rest, { autoAlpha: 0, y: A.y }, { autoAlpha: 1, y: 0, duration: A.r[1], ease: 'power3.out' }, A.r[0]);
      } else {
        // 4. one jump: a band of the page's ground rises from the foot to the screen's bottom edge (0.45s),
        // then the headline and the wall label settle on it (so no word is ever over the moving band)
        const bandTl = gsap.timeline({ paused: true });
        if (ground) bandTl.fromTo(ground, { yPercent: 100 }, { yPercent: 0, duration: 0.45, ease: 'power2.out', immediateRender: false }, 0);
        if (lead.length) bandTl.fromTo(lead, { autoAlpha: 0, y: A.y }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power3.out', immediateRender: false }, ground ? 0.42 : 0);
        if (bandTl.duration()) clock(A.band, bandTl);
        // 5. the words and the link
        const restTl = gsap.timeline({ paused: true });
        if (rest.length) restTl.fromTo(rest, { autoAlpha: 0, y: A.y }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power3.out', immediateRender: false }, 0);
        if (restTl.duration()) clock(A.r, restTl);
        // the starting state, before the first clock runs
        if (ground) gsap.set(ground, { yPercent: 100 });
        if (lead.length || rest.length) gsap.set([...lead, ...rest], { autoAlpha: 0, y: A.y });
      }
      tl.set({}, {}, 1);
      const tick = () => {
        if (dead) return;
        const p = tl.progress();
        for (const c of clocks) {
          const on = p >= c.at;
          if (on === c.on) continue;
          c.on = on;
          if (Math.abs(p - c.at) > 0.25) c.tw.progress(on ? 1 : 0).pause();
          else if (on) c.tw.play(); else c.tw.reverse();
        }
      };
      if (clocks.length) { tl.eventCallback('onUpdate', tick); tick(); }

      // the film plays only near the screen; the three moving layers are promoted only then
      ScrollTrigger.create({
        trigger: root, start: 'top bottom', end: 'bottom top',
        onToggle: (self) => {
          root.classList.toggle('pb-near', self.isActive);
          if (!video) return;
          if (self.isActive) { const p = video.play(); if (p && p.catch) p.catch(() => {}); } else video.pause();
        },
      });
      if (video) { video.muted = true; video.loop = true; video.playsInline = true; video.controls = false; }
      draw();

      inst = {
        layout,
        destroy() {
          dead = true;
          ScrollTrigger.removeEventListener('refreshInit', onRefreshInit);
          ScrollTrigger.removeEventListener('refresh', draw);
          img.removeEventListener('load', onLoad);
          for (const n of touched) {
            for (const p of ['left', 'top', 'width', 'height', 'maxWidth', 'transform', 'transformOrigin']) n.style[p] = '';
          }
          for (const v of ['--pb-fpx', '--pb-mpx', '--pb-opx']) world.style.removeProperty(v);
          inner.style.removeProperty('--pb-hpx');
          stage.style.removeProperty('--pb-band');
          stage.style.removeProperty('--pb-copy-top');
          if (madeGround && ground) ground.remove();
          if (labelHome && labelHome[0]) labelHome[0].insertBefore(label, labelHome[1] && labelHome[1].parentNode === labelHome[0] ? labelHome[1] : null);
          root.classList.remove('pb-one', 'pb-two', 'pb-near', 'pb-stack');
          if (video) video.pause();
          inst = null;
        },
      };
    }

    // Reduced motion on a desktop matches neither of the stage's conditions, so the stage never calls
    // rest() there: watch the query here too, so a live scene switched to reduced motion is cleared.
    const rmq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    const onReduce = () => { if (rmq && rmq.matches) { if (inst) inst.destroy(); restVideo(); } };
    if (rmq) { if (rmq.addEventListener) rmq.addEventListener('change', onReduce); else if (rmq.addListener) rmq.addListener(onReduce); onReduce(); }

    const scrub = opts.scrub ?? (window.Stage && Stage.lenis ? 0.4 : 0.8);
    const build = (tl, ctx) => live(tl, ctx, jumps === 2 ? 'two' : 'one');
    return Stage.scene(root, {
      hold: o.hold,
      scrub,
      build,
      phone: opts.phone === 'rest' ? 'rest' : { hold: o.holdPhone, build },
      rest() { if (inst) inst.destroy(); restVideo(); },
    });
  };
})();
