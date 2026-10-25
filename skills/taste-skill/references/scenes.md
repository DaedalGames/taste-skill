# Scroll scenes

The big moments of a page: stretches of scroll where the page stops being a column of sections and
becomes a scene. A camera flies through a field of pictures, a picture grows from a window to the whole
screen, a word buckles under the scroll, a set of photographs orbits and lands in a grid. These are what
visitors remember from award sites, and what a page built from tidy sections alone never has.

The scene library is taken apart from recent Awwwards Sites of the Day (October 2026: 43 sites recorded
frame by frame while scrolling, 261 scenes described, 30 types), rebuilt from scratch in our own code,
tested frame by frame at desktop and phone width and under reduced motion, and reviewed against the
scenes it came from. Nothing a site owns is in them. The draw deals them from `library/scenes.json`
(section 9); a page that needs a scene the library does not have builds one on the stage (section 8),
with every rule here.

## Contents

1. What a scene is
2. Putting a scene on a page
3. Filling it
4. Fitting it to the page
5. The phone, reduced motion, no script
6. Checking it
7. Rules for scenes
8. When no scene in the library fits
9. The catalogue

## 1. What a scene is

A tall section whose stage holds still while the page scrolls past it. The stage is
`position: sticky`; the section is (hold + 1) screens tall, so the stage is held for `hold` screens;
a GSAP timeline is scrubbed from 0 to 1 by that scroll. Nothing captures the wheel: the scrollbar always
tells the truth, the keyboard and the trackpad work as everywhere else, and the scene ends.

What a scene is not: a fade-up, a small parallax, a sticky footer, a marquee. Those are the quiet layer
(`references/motion.md`). A scene changes the whole screen.

The direction sheet deals two or three (section 9 of the sheet), from different families, each placed
on the section of the argument it can carry. Build them in step 6, with that section: a scene is
composition, not decoration added at the end.

## 2. Putting a scene on a page

Copy the shared stage and the dealt scene's files into the project (`assets/scenes/stage.css`,
`stage.js`, `<id>.css`, `<id>.js`). Each scene file's header comment lists the markup it expects and
its options; `assets/scenes/demo/<id>.html` is a complete working page to read beside it.

```html
<head>
  <script>document.documentElement.classList.add('js')</script>
  <link rel="stylesheet" href="scenes/stage.css">
  <link rel="stylesheet" href="scenes/<id>.css">
</head>
<body>
  …
  <section class="scene" data-scene="<id>" data-options='{"hold": 3}' aria-label="…">
    <div class="scene-stage">
      <!-- the markup from the scene file's header, filled with this page's content -->
    </div>
  </section>
  …
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/lenis@1.3.26/dist/lenis.min.js"></script>
  <script src="scenes/stage.js"></script>
  <script src="scenes/<id>.js"></script>
  <script>Stage.smooth(); Stage.init();</script>
</body>
```

- Load SplitText (`gsap@3.15.0/dist/SplitText.min.js`) only when a scene file says it needs it.
- `Stage.smooth()` adds weighted wheel scrolling (Lenis at lerp 0.12). It stays off for touch and for
  reduced motion. Leave it out on a quiet page; the scenes work either way.
- `Stage.init()` starts every `[data-scene]` on the page. A page with two scenes loads both files.
- The versions are pinned. Do not change them to `@latest` or an unpinned major.

## 3. Filling it

A scene is only as strong as what goes in it. The scene file's header and the sheet's "Content" line
say how many pictures and words it takes; these hold for all of them:

- **Pictures of one family.** Same light, same grade, same kind of subject: a field of mismatched stock
  photographs breaks the illusion of one space faster than any timing error. Real pictures of the
  subject's world (`assets.mjs`), the project's own, or the dealt photographs, in that order
  (`references/imagery.md`). Size each to its largest display size, set `width` and `height`.
- **Words that read in a breath.** A held statement is 4 to 12 words; captions are one to four words in
  the text face, sentence case. One statement on screen at a time.
- **The scene says something about the subject.** A fly-through of the studio's work, the route a
  shipment really takes, the four rooms of the house, the product's change of state. A scene filled
  with unrelated pictures is a gimmick and reads as one.
- **Real content only.** If the scene needs eight pictures of the subject and there are three, take the
  `--redraw scenes`, never pad it with stand-ins.

## 4. Fitting it to the page

- The scene files read the page's tokens: `--ground`, `--ink`, `--muted`, `--accent`,
  `--font-display`, `--font-text` (with fallbacks). Set them on `:root` from the sheet and the scene
  takes the page's colour and type. Colours a page does not otherwise have (the night of a light
  flood, the two grounds of a raster cut) are the scene's own tokens, named in its file's header.
  Check the demo against your page, not the other way round.
- Display type in a scene uses the dealt display face and the two-line headline rule; statements stay
  at statement size.
- Leave a quiet section between two scenes (a text section, a list, a plain picture) so each one lands.
  Two scenes back to back read as one long ride and the second loses.
- A scene on the first screen must be readable at progress 0: the title, the sentence and the action are
  there on the first frame (motion rule 1), and the scene starts moving only when the visitor scrolls.
- Give the section a heading. If the design has no visible heading in the scene, the section still
  carries one (`aria-label` on the section and a real heading in the finished composition).

## 5. The phone, reduced motion, no script

- **The phone.** Each scene has a phone plan in its file: the same scene with changed numbers, a
  simpler version, or `phone: 'rest'`, where the phone shows the finished composition. Touch scrolling
  is never smoothed. Look at the phone sheet as carefully as the desktop one.
- **Reduced motion and no script.** The section is an ordinary section showing the finished
  composition: the same content, laid out to read without motion. Nothing is hidden waiting for a
  script. The inspector's `reduced-hidden` check and the reduced sheet of `scenes.mjs` show it.
- **A failed CDN** falls back to the finished composition too (the stage adds `.is-rest`). The
  inspector fails a scene that rests on desktop (`scene-not-live`), so a broken script cannot pass.

## 6. Checking it

```bash
node <skill>/scripts/scenes.mjs <page>        # every scene at 0, 10 … 100%, desktop and phone, and reduced motion
node <skill>/scripts/inspect.mjs <page>       # the gate; with scenes on the sheet it also films the scroll
```

`scenes.mjs` writes one contact sheet per scene and width to `.taste-skill/scenes/`. Read every one.
At every frame ask: is there one clear thing to look at; can the statement on screen be read; is
anything popping, blank, cut off or crossing the words; is it as bold as it should be? The inspector's
`desktop-film-NN.jpg` shows the whole page's scroll a third of a screen at a time: check that the
scenes and the quiet sections between them make a rhythm, and that nothing between them is empty.

## 7. Rules for scenes

1. **Two or three per page,** from different families, a quiet section between them. The inspector
   warns over four (`many-scenes`) and when scenes hold more than 60% of the page (`scene-heavy`).
2. **About one screen per beat of the story:** most scenes hold one to four screens; the long set
   pieces (the walk through rooms, the fixed hero object, the orbit, the thumbnail stream, the warp
   jump) hold five or more, so a page carries one of those at most, or its scenes pass the inspector's
   60%. A hold with nothing new to show is cut, not padded.
3. **Native scroll only.** No wheel capture, no locking the page, no scenes that only run on a click.
   Smoothing only through `Stage.smooth()`.
4. **Readable at its rest points.** The statement on screen reads whole; nothing passes over text while
   it is being read; text on a picture has a flat scrim or a calm area under it.
5. **Inside a scene the scene's numbers apply** (motion rule 7): a picture may grow from a window to the
   whole screen, type may cross the stage, a camera may fly through pictures. Outside scenes, the quiet
   limits of `references/motion.md` hold.
6. **Transform, opacity, clip-path.** Nothing that forces layout on every frame. Pictures decoded before
   they move.
7. **The house rules hold inside scenes:** no monospace captions, no 01/07 counters (a plain "3 of 7" if
   a count is needed), no gradients (flat scrims), no shadows or glows, no hairline decoration, no
   decorative particles, no violet.
8. **The finished composition is designed,** not an afterthought: it is what reduced motion, a failed
   script and some phones see.

## 8. When no scene in the library fits

Redraw first (`--redraw scenes`). If the brief really needs a scene the library does not have, build it
on the same stage so it inherits the guards:

```js
Scenes['my-scene'] = (root, opts = {}) => Stage.scene(root, {
  hold: opts.hold ?? 2,          // screens the stage is held for
  scrub: opts.scrub ?? true,     // true when Lenis runs; 0.4-0.8 without it reads as weight
  phone: 'same',                 // or 'rest', or { hold, build } for a phone plan
  build(tl, { q, phone }) {      // positions are fractions of the scene, 0-1
    tl.fromTo(q('.picture'), { clipPath: 'inset(30% 30% 30% 30%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.6 }, 0)
      .to(q('.title'), { yPercent: -40, autoAlpha: 0, duration: 0.25 }, 0.7);
  },
});
```

and write its CSS finished composition first, then the live layout under `.scene.is-live`. Check it
with `scenes.mjs` like any other.

## 9. The catalogue

Thirty scenes in eleven families. The draw deals from `library/scenes.json`, which holds each scene's
full entry (where it goes, its content, its options, its phone plan); `node <skill>/scripts/draw.mjs
--list scenes` prints the list, and each scene file's header is the full contract. A scene marked
*product-photo* is dealt only with `--have product-photo`: photographs or renders of the client's own
product, building or work. Every other scene works with real pictures of the subject's world, with
drawings, or with type alone.

**Camera through space**
- **Descend through the weather** (`descend-through-weather`): the first screen sinks through cloud
  from a peak above the weather onto the place below. Two photographs of the place, from above and
  below the cloud. First screen only.
- **Fly-through of photo cards** (`depth-card-flythrough`): the camera runs into one vanishing-point
  picture while captioned photo cards pass on both sides. A backdrop whose lines meet at one point and
  5-12 photographs in one grade.
- **Powers-of-ten pull-back** (`powers-of-ten-pullback`): a film becomes a screen on a wall, then the
  place becomes a framed print. A film or a still, and a place photographed straight on with an
  opening that can be measured.
- **Route journey** (`route-journey`): a parked traveller rides a tilted map along a route of 3-5 stops
  to a destination that lights up. A real route and a real unit to count; map and vehicle are drawn.
- **Warp jump** (`warp-jump`): a manifesto in timed beats over a field of streaks that speeds up, then a
  jump into the accent. 35-60 words, no pictures.

**Colour and ground**
- **Light flood** (`light-flood`): one sentence plays out a day: light rises, floods the screen, night
  falls. Two short lines, no pictures.
- **Shaped edge carries the new ground** (`shaped-edge-ground-change`): the sky's colour rises over its
  photograph as an arch and becomes the next chapter's ground. One photograph with open, even sky over
  a wide subject.
- **Stepped columns raise a stage** (`stepped-columns-raise-a-stage`): ink fills 3-5 columns like a
  falling bar chart while a square wheel rolls round. Short copy for steps that really go from rough
  to smooth, no pictures.

**Grid reassembly**
- **Orbit to formation** (`orbit-to-formation`): square photographs ride one wheel from an arch to a
  ring to a half-wheel beside the figures. 12-16 photographs in one grade and four real figures.
- **Scatter and lock** (`scatter-and-lock`): one photograph scattered as shards in 3D is assembled by
  the scroll, then grows to full bleed. One strong photograph with texture everywhere.

**Horizontal travel**
- **Arrive and settle on a sideways track** (`arrive-and-settle-track`): the letters of a closing line
  swoop in from the side and settle on a calm end frame with a button; presets for quotes and
  projects. One line of 3-5 words, no pictures.
- **Sideways walk through rooms** (`room-walk-track`): a row of coloured rooms walked sideways, each
  with its own moment, ending on the contact. Fourteen of the client's own photographs
  (*product-photo*).

**Layer stack**
- **Hinged sheets** (`hinged-sheets`): tickets rise from a face-down deck, turn over and land one by
  one. A real paper or ticket idea and two to four tickets with equal copy.

**Mask and reveal**
- **Fly into the shape** (`fly-into-the-shape`): the camera flies into the brand's mark and the next
  chapter opens inside it. An ownable solid mark and one dark photograph of the chapter's world.
- **Shape-shifting window over a fixed world** (`shaped-window-over-fixed-world`): two windows in a
  shutter slide level, merge and push through into a photograph of a place. One wide photograph of
  the place. First screen.
- **Twin-image scanner** (`twin-image-scanner`): a scan line rewrites a photograph of a thing into the
  drawing of its structure. The subject's own photograph or render and a registered line drawing
  (*product-photo*).

**Media sequence**
- **Instrument dial stage** (`instrument-dial-stage`): a dial reads off 3-6 items, each name huge on
  the horizon with its picture in front. One 4:5 picture and one number an item.
- **Lens over a thumbnail stream** (`lens-over-thumbnail-stream`): a strip of thumbnails slides under
  a playhead and each project blooms into a collage. 48-100 of the client's own pictures in 5-12
  projects (*product-photo*).
- **Pinned chapter switcher** (`pinned-chapter-switcher`): 3-6 full-bleed picture chapters change by
  hard wipes, the words swapping at the seam. One picture a chapter, shot or chosen as one series.

**Object scrub**
- **Fixed hero object** (`fixed-hero-object`): one product turns on its own layer while the chapters
  rise beneath it. A turntable render of 36-120 frames (*product-photo*). First screen.
- **Scrubbed transformation sequence** (`scrubbed-transformation-sequence`): an object changes state
  as a scrubbed frame sequence while the ground opens to a new colour. 80-250 frames with alpha of the
  change (*product-photo*).

**Picture transform**
- **Picture develops from marks** (`picture-develops`): a pen drawing draws itself, heaviest strokes
  first, as the camera pulls back. One high-contrast drawing, or a photograph in darkroom mode.
- **Thumbnail becomes the stage** (`thumbnail-becomes-the-stage`): the middle of three thumbnails
  opens to full bleed and the statement's first line becomes its heading. One strong loop or picture.

**Section transition**
- **Peel, tear and drag** (`peel-tear-and-drag`): a plane drags the next page in behind it, a sticker
  peels off, or the ground tears away. A top-down cut-out of a plane for the drag; nothing for the
  tear.
- **Raster cut between chapters** (`raster-cut`): the next chapter prints over the current one through
  slats while the title changes ink line by line. Two grounds and a title of 2-4 words.

**Type choreography**
- **Letter physics** (`letter-physics`): a claim bursts apart in 3D and an answer lands in a disc of
  light. A claim of 12-36 characters and one sentence, no pictures.
- **Object rides through giant type** (`object-through-giant-type`): a cut-out object falls through a
  wall of capitals that parts around it. A quote of 22-30 words and one clean cut-out.
- **Scroll-turned drum** (`scroll-turned-drum`): names turn on a 3D drum like a slot reel, with an
  optional drum of pictures beside it. 8-20 real names.
- **Type re-layout** (`type-flip-relayout`): a list in giant capitals spreads, folds into an index and
  hands its size to the heading. A one-word heading and 3-6 short items, no pictures.
- **Wordmark under strain** (`wordmark-under-strain`): the brand's name is crushed, echoed, and drops
  a letter that becomes the button. A name of 4-8 letters with a straight letter, no pictures.
