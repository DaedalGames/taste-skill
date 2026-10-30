# Scroll scenes

The big moments of a page: stretches of scroll where the page stops being a column of sections and
becomes a scene. A camera rushes through a run of doorways, a picture grows from a window to the whole
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

The direction sheet deals two (section 9 of the sheet), from different families, each placed on the
section of the argument it can carry; a long, loud page (eight sections or more, bold or playful) may
get three. A software page gets one at most, never a closing one: its big moment is the product replay (sheet section 8,
`references/motion.md`, "Product replay"). Build them in step 6, with that section: a scene is composition, not decoration added at the
end. About one page in two, one of them is a researched technique from `library/techniques.json`: a
principle, a direction to take and what breaks it, built fresh.

A scene replaces the content of the section it carries. It is that section, told as a scene, not extra
screens in front of it: the orbit is the about, the words gathered into the cup are the list of what
the farm grows, the lowered jug is the order. A page with scenes keeps its length budget (section 7,
rule 2).

## 2. Putting a scene on a page

Copy the shared stage and the dealt scene's files into the project (`assets/scenes/stage.css`,
`stage.js`, `<id>.css`, `<id>.js`). A dealt technique has no files of its own: build it as section 8
shows. Each scene file's header comment lists the markup it expects and its options;
`assets/scenes/demo/<id>.html` is a complete working page to read beside it.

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

- **The demo is a placeholder.** Each demo page in `assets/scenes/demo/` is a working example for a
  made-up client: its town, its photographs, its object, its quote and its words are there to show the
  scene running, and none of them belongs on your page. Every picture, word and drawn thing in your
  scene comes from this subject (the inventory, SKILL.md step 1). A row of the work shows this client's
  own pieces; the cut-out lowered onto the last line is this client's own product; the words gathered
  into the cup are what this farm really grows; a quote is the client's own words. The same goes for
  the stand-in a script draws when it is given nothing: it shows the scene works, never the place. A
  scene whose pictures or drawings are still the demo's, or the script's stand-in, is unfinished.
- **On the work, the scene is the work.** A scene that carries the work shows the pieces themselves:
  each card, chapter or picture is one piece (its title card, its building, its product), shown once,
  linking to the piece. Pictures of the world around the work (the studio, the materials, the work in
  use) go on the intro or the about, never screens of stock city views before the work. However the
  work is told, each piece stops on screen flat-on (turned 10° or less), at 60% of the width or more,
  with its title on the same element, for half a screen of scroll, and the stage lets go within half
  a screen of the last piece; the first piece is on screen by about the third screen. Sheets that tip
  in and away do this with `{"rest": 0.5}`: each piece lies flat on a full-screen sheet with its name
  on it for half a screen, three pieces in 2.5 screens (scenes.mjs fails a piece that never stops flat
  and large, `piece-unseen`).
- **Each picture once.** A scene's card count is the number of distinct pictures it has. Never repeat a
  picture to fill a ring or a deck, take at most two from one source (one film, one shoot, one
  building) and never put those two side by side; with too few, take fewer cards or redraw.
- **Pictures of one family.** Same light, same grade, same kind of subject: a field of mismatched stock
  photographs breaks the illusion of one space faster than any timing error. Real pictures of the
  subject's world (`assets.mjs`), the project's own, or the dealt photographs, in that order
  (`references/imagery.md`). Size each to its largest display size, set `width` and `height`.
- **Words that read in a breath.** A held statement is 4 to 12 words; captions are one to four words in
  the text face, sentence case. One statement on screen at a time: two statements never share pixels,
  even for the length of a swap.
- **Captions say what is shown.** A caption, a name or a number names what its picture really shows
  (references/imagery.md §3), and at every frame the name, the picture and the number on screen
  belong to the same item.
- **The scene says something about the subject.** The studio's own pieces, the four rooms of the
  house, the product's change of state. A scene filled
  with unrelated pictures is a gimmick and reads as one.
- **Real content only.** If the scene needs eight pictures of the subject and there are three, take the
  `--redraw scenes`, never pad it with stand-ins (twice at most: section 8).

## 4. Fitting it to the page

- The scene files read the page's tokens: `--ground`, `--ink`, `--muted`, `--accent`,
  `--font-display`, `--font-text`, and the weights `--display-weight`, `--strong-weight` and
  `--text-weight` (with fallbacks). Set them on `:root` from the sheet and the scene takes the page's
  colour and type. Colours a page does not otherwise have (the deeper tone of the openings' sheets,
  the wall and floor tints of the closing cut) are the scene's own tokens, named in its file's header.
  Check the demo against your page, not the other way round.
- Display type in a scene uses the dealt display face and the two-line headline rule; statements stay
  at statement size.
- **The weights the scene sets.** Every scene stylesheet sets its weights through
  `--display-weight`, `--strong-weight` and `--text-weight`, falling back to its own default (the
  letter bar's statement 800, the openings' headline 500; the file says which). Set the three tokens on
  `:root` to weights the page loads, or load the scene's default weight of the face. The scenes switch
  the browser's fake bold off, so a weight the page never loaded is drawn at the nearest loaded weight
  instead (lighter than the scene was drawn for); on the page's own type a missing weight is still
  smeared into a fake bold, which the inspector fails (`synthetic-bold`). Check the computed weight of
  each scene's display line against the fonts the inspector reports as loaded.
- **Its own radius and colours give way to the page's.** Corners on the scene's cards and tickets match
  the page's pictures and buttons (square when they are square); fields it brings are the page's
  fields.
- **A fixed header is told about.** Scenes that can keep their type clear of a fixed bar, or recolour it
  over their grounds, take its selector as an option (`nav`, `header`, `chrome`, `inset`); give it,
  since the page keeps its navigation in reach (references/layout.md §7).
- **Links land on the content.** A navigation link or a "skip to" points at the section that holds what
  it names; it never lands on a scene that only introduces it.
- Leave a quiet section between two scenes (a text section, a list, a plain picture) so each one lands.
  Two scenes back to back read as one long ride and the second loses.
- A scene on the first screen must be readable at progress 0: the title, the sentence and the action are
  there on the first frame (motion rule 1), and the scene starts moving only when the visitor scrolls.
- Give the section a heading. If the design has no visible heading in the scene, the section still
  carries one (`aria-label` on the section and a real heading in the finished composition).

## 5. The phone, reduced motion, no script

- **The phone.** Each scene has a phone plan in its file: the same scene with changed numbers, a
  simpler version, or `phone: 'rest'`, where the phone shows the finished composition. Touch scrolling
  is never smoothed. Below 600px a list the scene lays over its picture drops into the normal flow
  under it, and nothing a visitor reads is clipped by the stage, at the end of the hold as much as at
  rest (`clipped-text`, `references/layout.md` §9). Look at the phone sheet as carefully as the
  desktop one.
- **Letters on the phone land on a clock.** A heading set in letters is never keyed to the scroll on a
  phone: wherever the reader stops it would stand half-drawn ("B o"), and the inspector fails it
  (`letters-mid-reveal`). Its letters land in under a second once half of it is on screen (or once the
  scene's timeline passes their moment, when until then they are out of sight under a mask; faded
  letters on screen waiting for it fail too), and drop back only when it leaves again. The scenes that set
  letters already do this; a scene you build on the stage does the same.
- **Small text on a scene's photograph reads at 4.5:1 at every width.** A sky that looks even still
  drops under it somewhere under 19px letters, at one width or another, and the inspector reads the
  pixels under the letters (`text-on-photo`). Where the picture is not calm under the words, set them on
  a solid strip: the ground, or a band in the ink with the type in the ground's colour. Flat, never a
  gradient.
- **Reduced motion and no script.** The section is an ordinary section showing the finished
  composition: the same content, laid out to read without motion. Nothing is hidden waiting for a
  script. The inspector's `reduced-hidden` check and the reduced sheet of `scenes.mjs` show it. Under
  reduced motion the stage adds `.is-rest` and calls the scene's `rest` hook at every width, so a
  scene needs no crossfade of its own there; a build may return `Stage.REST` to give a screen the
  finished composition.
- **A failed CDN** falls back to the finished composition too (the stage adds `.is-rest`). The
  inspector fails a scene that rests on desktop (`scene-not-live`), so a broken script cannot pass.

## 6. Checking it

```bash
node <skill>/scripts/scenes.mjs <page>        # every scene at 0, 10 … 100%, desktop and phone, and reduced motion
node <skill>/scripts/inspect.mjs <page>       # the gate; with scenes on the sheet it also films the scroll
```

`scenes.mjs` writes one contact sheet per scene and width to `.taste-skill/scenes/`. Read every one.
At every frame ask: is there one clear thing to look at; can the statement on screen be read; is
anything popping, blank, cut off or crossing the words; is it as bold as it should be? Then these,
each of which a test page shipped wrong:

- **Nothing moving crosses words being read.** A card, a ticket, a column of ink or a picture that
  passes over a heading or a line of copy while it is on screen is a fault, at 30% as much as at rest.
- **The rest frame reads whole.** At 100% the heading, the closing line and the name are whole on
  screen, at 1440 and at 768 as well as on the phone: a closing line that rests on its last two words
  has lost its verb, and a name that rests broken reads as broken.
- **Nothing is cut off at the end.** `inspect.mjs` fails a list cut short at the scene's end
  (`clipped-text`); `scenes.mjs` warns at the step. One line of display type cropped at the screen's
  side or its foot is a crop and passes.
- **No dead hold.** When the last three frames of a sheet are the same picture, the hold is too long:
  shorten it to its beats.
- **The demo is gone.** Nothing in any frame is the demo's (its map, its town, its pictures, its words).

The inspector's `desktop-film-NN.jpg` shows the whole page's scroll a third of a screen at a time:
check that the scenes and the quiet sections between them make a rhythm, that nothing between them is
empty, and that the navigation or the one action is in reach after the hero.

## 7. Rules for scenes

1. **Two per page,** from different families, a quiet section between them; three only on a long,
   loud page. The inspector warns over four (`many-scenes`) and when scenes hold more than 60% of the
   page (`scene-heavy`).
2. **A page with scenes still has a length budget:** about 12-16 screens at 1440 in all (the study's
   median page is 8.7 screens and 575 words, its middle half up to 14.4; references/research.md), and
   about 45 words or more a screen. The scenes hold about six screens of scroll between them, and at
   most one scene holds more than three: the orbit, the chapter switcher and the scrubbed
   transformation are each a page's one long scene.
   A scene replaces its section's content and never adds screens of nothing: in testing, pages of
   19-28 screens for 700-1,500 words read as long and thin, whatever the scenes did. About one screen
   per beat of the story; a hold with nothing new to show is cut, not padded. A hand-over between two
   chapters holds about two screens at most (three for the drag, which brings a page of its own), and
   one that carries only a title about one (the letter bar's 1.1). A scene on the work holds three screens at most, so the work itself is not kept waiting. The
   walk through rooms holds about nine screens and is a whole page on its own: the draw does not deal
   it (see its entry). When a dealt scene's sheet entry gives a shorter hold than its file's default, set the
   sheet's in `data-options`. **A closing scene holds about one screen.** A scene whose only content is a line or two
   of type is done in about one screen: the line has been read (the inspector fails a short line held
   over 1.2 screens with nothing new, `line-holds`).
3. **Native scroll only.** No wheel capture, no locking the page, no scenes that only run on a click.
   Smoothing only through `Stage.smooth()`.
4. **Readable at its rest points.** The statement on screen reads whole; nothing passes over text while
   it is being read; text on a picture has a flat scrim or a calm area under it. This holds for the
   library's scenes too: when a scene's default sends an edge or a card across its own copy, set the
   option that avoids it or change the copy's place, and
   say so in the report. A scene that crosses its words is a bug, not a licence.
5. **Inside a scene the scene's numbers apply** (motion rule 7): a picture may grow from a window to the
   whole screen, type may cross the stage, a camera may fly through pictures. Outside scenes, the quiet
   limits of `references/motion.md` hold.
6. **Transform, opacity, clip-path.** Nothing that forces layout on every frame. Pictures decoded before
   they move.
7. **The house rules hold inside scenes:** no monospace captions, no 01/07 counters (a plain "3 of 7" if
   a count is needed), no gradients (flat scrims), no shadows or glows, no hairline decoration, no
   decorative particles, no violet, **no drawn shapes, doodles, tracks or markers**: no wheels, waves,
   morphing polygons, dashed axles or blobs, no rail or bar with a moving dot, no progress bars or
   playheads that stand for the scroll. A scene shows real pictures, the product's own interface
   (`data-ui`), a real map or plan with labels, the brand's own mark, or type: mark them `data-map`,
   `data-plan` or `data-mark` (a dial or a gauge is a drawing). Every scene is set in the
   page's visual language (its grounds, type and pictures). The inspector fails a drawing or a track
   inside a scene (`scene-drawing`, `scene-track`).
8. **The finished composition is designed,** not an afterthought: it is what reduced motion, a failed
   script and some phones see. It keeps the section's heading in full ink at the section-heading size
   (never a blurred ghost of it behind the landed pieces), and a name or a closing line reads whole.
9. **No dead frames.** At every frame of a hold the screen shows something to read or see: no stretch
   of more than about one screen where 60% or more of the screen is empty ground, pictures cover less
   than about 15% of it and nothing on it changes. The inspector films the scroll and fails it (`held-dead-screen`);
   scenes.mjs names the steps (`empty-steps`).

## 8. When no scene in the library fits

Redraw first (`--redraw scenes`), twice at most. A redraw never deals again a scene or technique
already dealt on this sheet (one page got the same fly-through from both its redraws), and when nothing
new fits it prints the list below instead. A third `--redraw scenes` prints the scenes that still
fit this page, each with what it needs, and the two ways out: take one by id
(`--redraw scenes=<id>`, or two with `scenes=<id>,<id>`), or build the page without a scene
(`--redraw scenes=none`), its motion then coming from the entrance, the replay or moving pictures. A
page with one honest scene, or none, beats a fifth redraw: a cargo bike page lost two and a half
hours to five.

A page short of pictures of its own subject (no photographs of its product, or a brief that says it
has few) is dealt scenes and techniques that need no photograph or one first, its redraws deal more of
those before any that needs several, and the list after two redraws puts them at the top. Such a scene
is filled from the words and the product's facts; its one picture is one the page shows nowhere else,
never the same photograph again at another crop. `scenes=none` stays possible, but the sheet then names the scenes of that kind
that still fit: none is for a page that cannot fill even these. A cargo bike page with no photographs
redrew three scenes that each wanted three to six photographs, and was built with no scene at all.

If the brief really needs a scene the library does not have, build it on the same stage so it
inherits the guards:

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
with `scenes.mjs` like any other. A dealt technique is built the same way, with the hold the sheet
gives it, and checked with `scenes.mjs` like any scene.

A scene you build that steps (statements, steps or pictures in turn), where its steps carry pictures,
gives each step its own picture, never one photograph held under every step or cropped again for the
next; where it needs none (its Needs line says so), the statements stand on the ground alone,
with no photograph added. It sets its statements as short headlines at display size, 40px or more on
desktop and two lines at most (marked up as h2 or h3: the 36px statement rule is for paragraphs);
leaves no frame between two steps near empty; and its finished composition (reduced motion, tablet,
phone) never repeats one picture: with one picture only, show it once and set the steps beside it. A
roastery added one photograph to a type-only focus pull, set four 30px statements beside it, left an
empty frame halfway and repeated the photograph three times down the tablet page; the judge called it
stock (`repeated-picture`).

## 9. The catalogue

Forty-nine scenes in eleven families. The draw deals from `library/scenes.json`, which holds each
scene's full entry (where it goes, its content, its options, its phone plan);
`node <skill>/scripts/draw.mjs --list scenes` prints the list, and each scene file's header is the full
contract. Each entry's `needs` says what the scene really takes, and the draw deals it only when the
brief has it: *product-photo* (photographs or renders of the client's own product, building or work,
`--have product-photo`), *pictures:N* (N distinct photographs of one family), *series:N* (N
photographs shot or chosen as one series), *names:N* (N real names of its rooms, dishes, places,
clients or products), *mark* (the brand's own solid mark, `--have mark`), *route* (a real route with
stops), *product-ui* (the product's interface), *plan* (a real plan or exploded drawing), *video*
(footage of the product). A page with no photographs of its own product, and a software page, can
honestly show about three photographs of its subject and no series, and a page with no photographs of
its own at all about six, so the scenes dealt there need no more between them; nor, on such a product
page, a scene on the first screen, which shows the product large.
`--list scenes` prints each scene's needs. A scene marked *not dealt* stays in the library as a
reference and is never dealt, nor taken by id; its entry says why. The round 10 audit retired seven,
hinged sheets followed, and round 11 retired the raster cut (weight 0 in `scenes.json`).

**Camera through space**
- **Closing cut under the rise** (`closing-cut-under-the-rise`): the one thing the page is about,
  masked out of the closing photograph, stands in a flat room of that photograph's own wall and floor
  and rises steadily, whole, onto its own row while the camera ducks under it; at the cut, in one frame,
  the flat room gives way to the photograph itself, the same thing in the same place on the same floor
  line, and the last sentence arrives in two or three phrases on a short band of the floor's tint, with
  the one action. One photograph of the subject standing clear on a floor or a table, and the rising
  cut-out masked from that same photograph (*product-photo*); never a drawing or a lookalike. Cut at
  0.28 for a short thing standing low, like the demo's teapot. The end of the page, for one physical
  thing, once; hold 1.6. Built from the researched technique `lib-0241`, which is no longer dealt to
  build fresh.
- **Descend through the weather** (`descend-through-weather`): the first screen sinks through cloud
  from a peak above the weather onto the place below. Two photographs of the place, from above and
  below the cloud. First screen only.
- **Fly-through of photo cards** (`depth-card-flythrough`): the camera runs into one vanishing-point
  picture while captioned photo cards pass on both sides. A backdrop whose lines meet at one point and
  5-12 photographs in one grade, set apart from the backdrop (the backdrop dimmed or softened, or the
  cards matted in the ground colour) so they never melt into it. On the work, the cards are the work,
  in stop mode (`{"stop": 0.5}`): each piece rests centred and flat at about 62% of the width with its
  title under it for half a screen; phones get the pieces stacked full width. Not dealt (round 10
  audit): a counter, skewed cards and slivers at the screen's edges, and the pass along the edges is the
  design.
- **Powers-of-ten pull-back** (`powers-of-ten-pullback`): a film becomes a screen on the wall of a real
  place, and the pull-back ends full-bleed in that place with the copy on a band of ground. The
  product's own film, still or interface (never a stock picture of another maker's), and a place
  photographed straight on with an opening that can be measured.
- **Route journey** (`route-journey`): a parked traveller rides a tilted map along a route of 3-5 stops
  to a destination that lights up. A real route and a real unit to count. The map is drawn for this
  place as the page's own `.route-art`: the water, the coast and the relief where the route really runs
  (traced from an open map), and the destination drawn as the subject seen from above (the house by
  the water, the shop front) as `#route-dest`, never a grid of tiles. Without `.route-art` the script
  rides a bare ground with only the road, a stand-in, never the place. The demo's town, lakes, fields
  and tile plot are placeholders; a coast, a fjord or a mountain road drawn as an inland town is the
  demo showing. Not dealt (round 10 audit): a drawn map, a toy vehicle, a distance gauge, "Stop n of
  4" and drawn rings, which judges marked down in rounds 7 and 9.
- **Through the openings** (`through-the-openings`): the camera rushes through five to eight flat
  sheets of the page's ground, each with one arch, doorway or pointed arch cut in it, two or three
  openings on screen at a time, faster and faster, into the next section's photograph of a place; by
  65% the photograph fills the page and its headline sets in. One photograph of the place, landscape
  with a 9:16 crop for phones and a calm area for the headline, the openings' shape taken from the
  place itself (*pictures:1*), on a page whose ground is one flat colour. Between two sections, into
  a section that opens on that photograph; once; hold 1.5.
- **Warp jump** (`warp-jump`): a manifesto in timed beats over a field of streaks that speeds up, then a
  jump into the accent. 35-60 words, no pictures; three beats hold three screens, one a beat. Not dealt
  (round 10 audit): a drawn field of speed streaks (the hyperspace cliché), an n-of-4 counter and
  boxed captions.

**Colour and ground**
- **Dither-field opener** (`dither-field-opener`): the first screen is live print: one huge numeral,
  year or initial in the display face turns inside a one-bit dither field, and a fast scroll sends bands
  of accent dots across it that settle back to ink. One mark of 1-4 characters, a headline on clear
  ground, no pictures. Hold 0. Never on a software page, whose first screen shows its own interface
  large: no scene that carries the first screen without the product is dealt there.
- **Letter bar floods the ground** (`letter-bar-floods-the-ground`): one short statement holds on one
  line with a straight letter (I, l, i, 1 or a T's stem) on the centre of the screen, and the camera
  zooms on that letter until only its stem is left: a column of ink that widens to full bleed and
  becomes the next section's ground, the next statement arriving inside it while the outgoing words'
  edges are still in frame. A statement of 2-4 words with a straight-stemmed letter near its middle,
  the next section's opening statement, one ground and one ink, no accent (*pictures:0*): a hand-over
  for pages without pictures, in any sector. Between two sections, from the ground to the ink, once;
  hold 1.1. scenes.mjs warns `empty-steps` where the line stands alone on the ground and where the new
  statement stands on the ink: the header defends it.
- **Light flood** (`light-flood`): one sentence plays out a day: light rises, floods the screen, night
  falls. Two short lines, no pictures; it holds about one screen (1.2). Not dealt (round 10 audit): the
  whole look is a blurred dome and blurred text.
- **One line carries the colour swap** (`line-carries-colour-swap`): a square clip crops away the
  photograph that closes one chapter while one line of the display face, at its final size and the
  full width, climbs under it showing only its first word; each further word slides in short and lands
  beside the one before, and on the last word the ground and the ink swap in one jump while the next
  chapter's first picture, already rising, settles whole under the line. A closing photograph, an
  opening picture and one line of 3-5 words (*pictures:2*); a line alone on flat colour reads as an
  empty screen. Between two sections, once; hold 1. Never for a client named for a light or a pale
  colour: its ink chapter ends on a dark photograph. Built from the researched technique `lib-0240`,
  which is no longer dealt to build fresh.
- **Shaped edge carries the new ground** (`shaped-edge-ground-change`): the sky's colour rises over its
  photograph as an arch and becomes the next chapter's ground. One photograph with open, even sky over
  a wide subject.
- **Stepped columns raise a stage** (`stepped-columns-raise-a-stage`): ink fills 3-5 columns like a
  falling bar chart and levels into one block. Short copy, no pictures, no drawing. No ink edge crosses
  copy being read: keep the default `ghost: false`, where each column opens as an ink stub that
  already holds its copy. Not dealt: built as hollow ink boxes twice, and in the round 10 audit red
  slabs rising like a bar chart, a page built from boxes.

**Grid reassembly**
- **Parts lock into the whole** (`parts-lock-into-the-whole`): one huge word or number steps back while
  the product's own interface flies in as its panels and locks into the screen; layers of detail (data,
  comments, an agent's edit) ink in one by one under one caption that changes its line; it ends as a
  column beside a short spec list. The product built as an HTML fragment (`data-ui`), or a real plan cut
  along its walls; never a drawing made for the page. Hold 1.6.
- **Orbit to formation** (`orbit-to-formation`): square photographs ride one wheel from an arch to a
  ring to a half-wheel beside the figures. 12-16 distinct photographs in one grade, none repeated, and
  four real figures about the subject (never constants of its medium). Four screens, so it carries the
  about or the gallery, not the work: its cards are small, and the work is shown at size elsewhere.
- **Scatter and lock** (`scatter-and-lock`): one photograph scattered as shards in 3D is assembled by
  the scroll, then grows to full bleed. One strong photograph with texture everywhere. Not dealt: judged
  a stock trope twice.

**Horizontal travel**
- **A row the scroll speed bends** (`speed-bent-row`): the stage holds while the scroll carries one
  row of six to eight pictures sideways along a gentle curve, each with its name set large under it;
  only the visitor's pace bends it (a fast scroll deepens the curve, leans the leading pictures back and
  lifts the far end), and it eases back to its tidy rest over half a second when the scroll stops. Six
  to eight of the client's own photographs of one series, collection or line-up, one grade, a name of
  1-2 words each (*product-photo*, *pictures:6*). In the middle, on a gallery, a showcase or a list;
  not as the page's work section, where each piece stops at 60% of the width (section 3), since a card
  here is about a quarter of it. Phones get the pictures stacked, the stack bowing with the speed. Hold 2.
- **Arrive and settle on a sideways track** (`arrive-and-settle-track`): the letters of a closing line
  swoop in from the side and settle on a calm end frame with a button; presets for quotes and
  projects. One line of 3-5 words, no pictures. The letters on screen when the section arrives swoop
  within under half the letter size, so the line reads at once; the rest arrive at the whole
  amplitude. The end frame shows the whole line, verb included, at every width. Not dealt (round 10
  audit): every frame from 0 to 60% shows tumbling, half-arrived letters, and the last frames are dead.
- **Panels re-proportion as they arrive** (`panels-reproportion-on-arrival`): a short statement holds
  at display size in a column of the page's ground while four to six large panels arrive beside it one
  at a time; as each settles its picture grows from half the panel to 70% and its name re-sets onto two
  lines in large type, then it steps aside into a narrower slot as the next comes, so two panels at most
  are on screen. One photograph a panel, graded as one set, and a name of two or three words each
  (*pictures:4*, *names:4*): a school's programmes, a developer's buildings, a studio's services. The
  first screen, the statement as its headline; hold 2.2 for five. Built from the researched technique
  `lib-0023`, which is no longer dealt to build fresh.
- **Sideways walk through rooms** (`room-walk-track`): a row of coloured rooms walked sideways, each
  with its own moment, ending on the contact. Fourteen of the client's own photographs
  (*product-photo*). It holds about nine screens and is a whole page on its own, so the draw does not
  deal it beside other scenes; build it only when the client's own photographs carry the whole page,
  as the work, the about and the contact in one, with no other scene.

**Layer stack**
- **Hinged sheets** (`hinged-sheets`): tickets lie face-down in a row under the headline and turn over
  one by one, each on a short clock, so every stop shows a level row. A real paper or ticket idea and
  two to four tickets with equal copy. At rest they read as printed tickets (type set to the stub, the
  copy filling the sheet, the page's own corners), not as rounded pricing cards with a photograph on
  top, and the paper stands off the ground. Not dealt (round 10): its finished row is still a list
  drawn as filled boxes (`boxed-list`), the fault of a guesthouse's seasons set as four tickets.
- **Sheets tip in and away** (`sheets-tip-in-and-away`): three to five pieces lie as full-screen sheets
  of the page's ground, each with its name very large on the top edge over one photograph; a sheet comes
  up turned out of a lower corner, lands flat for a third of a screen, and tips away as the next one
  arrives. One photograph a piece of the client's own work, one family with a clear change of colour
  between neighbours (*product-photo*). Three hold about two screens; on the work set `{"rest": 0.5}`,
  half a screen flat each, and three hold 2.5.
- **Window names its parts** (`window-names-its-parts`): the product's own window steps back and tips
  about 15 degrees while its parts lift apart in depth, tier by tier; a band in the accent crosses it,
  and each part it reaches fills with the accent for a beat while its name, said as what it does for
  the user, drops into a list beside the window; then the window settles flat beside the full list.
  The product's real screen rebuilt as 12-18 separate `data-ui` parts told apart by flat fills and
  gaps, never borders or shadows, and a plain sentence-case name for each ('Receipts read from a
  photo'), never 'Sidebar' or 'Card' (*product-ui*). In the middle of a software page, on the features
  or how it works, in another section than the product replay and with another view of the product;
  hold 1.5. Phones get the central parts flat, without tilt or lift. Dealt less often than most
  (weight 0.7). Built from the researched technique `lib-0365`, which is no longer dealt to build
  fresh.

**Mask and reveal**
- **Fly into the shape** (`fly-into-the-shape`): the brand's mark, a clean mask of its true shape with
  the next chapter's photograph already inside it, rises with the title on its face, and the camera
  flies into it. Never extruded or bevelled. An ownable solid mark and one dark photograph of the
  chapter's world. Dealt as 'out', the way back out at a dark chapter's end, until the way in passes the
  inspector.
- **Shape-shifting window over a fixed world** (`shaped-window-over-fixed-world`): two level windows in
  a shutter, one picture through a mullion, widen, merge and push through into a photograph of a place.
  One wide photograph of the place. First screen. Its dim behind the word stays dark: recoloured to a
  pale ground it is a veil over the photograph (`gradient`).
- **Twin-image scanner** (`twin-image-scanner`): a scan line rewrites a photograph of a thing into the
  drawing of its structure. The subject's own photograph or render and a registered line drawing
  (*product-photo*). Not dealt (round 10 audit): its signature devices, a scan line and a drawn line
  drawing of the machine, are banned (rule 7).

**Media sequence**
- **Instrument dial stage** (`instrument-dial-stage`): a dial reads off 3-6 items, each name huge on
  the horizon with its picture standing under it. One 4:5 picture and one number an item. Not dealt:
  the dial is a drawing (rule 7).
- **Lens over a thumbnail stream** (`lens-over-thumbnail-stream`): a strip of colour thumbnails slides
  under an unseen lens and each project blooms into a collage, the first already open. Five or six of
  the client's own projects, five to ten pictures each (*product-photo*); five hold about three screens.
- **Pinned chapter switcher** (`pinned-chapter-switcher`): 3-6 full-bleed picture chapters change by
  hard wipes, the words swapping at the seam; no count, no lit chapter names, no progress bars. One
  picture a chapter, shot or chosen as one series.
- **Window relay with a trail of stamps** (`window-relay-with-stamps`): the next picture waits as a
  small window in the main picture's corner and opens over it until it covers the slot, the name beside
  it changing in one step, while the old picture shrinks into a stamp that joins a trail of four at most
  along the caption band. Four to six photographs of one family in one light and ground, each subject
  whole in the middle with the top left corner plain, and a name of one or two words and one line each
  (*pictures:4*). In the middle, after a quiet section that introduces the set; not the page's main
  showcase of the work, where the chip would lie on the piece (take sheets that tip in and away
  there). Five hold 2.4 screens. Built from the researched technique `lib-0237`, which is no longer
  dealt to build fresh.

**Object scrub**
- **Fixed hero object** (`fixed-hero-object`): one product turns on its own layer while the chapters
  rise beneath it. A turntable render of 36-120 frames (*product-photo*). First screen, carrying the
  hero and the two sections after it in about five and a half screens. Not dealt while its dock draws a
  gauge (rule 7).
- **Scrubbed transformation sequence** (`scrubbed-transformation-sequence`): an object changes state
  as a scrubbed frame sequence on the page's own ground, short labels landing beside the finished
  object. 80-250 frames with alpha of the change (*product-photo*).
- **Re-forming window** (`one-figure-reforms`): one window in the accent re-forms through three to five
  chapters (a bar rounds into a disc, rises into an arch, draws in to a pill), carrying each chapter's
  own interface, whose late parts land right behind it at the hand-over, so every rest holds a whole
  card; the name, one or two lines and one key figure swap beside it. The interface rides the window
  whole while it re-forms and hands over at the half-way point, so the window is never empty. One
  interface fragment a chapter, each a different screen (*product-ui*). Four hold two screens.
- **Closing object turns over** (`closing-object-turns`): the one object the page is about rises in the
  last screen, turns over in 3D while the closing ground comes up behind it, and lands on its plain
  back, set in the page's type with the closing line and the one action. One cut-out photograph of its
  front, flat and straight on, that differs clearly from the plain back (*product-photo*). The end of
  the page, once; hold 1.
- **Product assembles into its action** (`product-assembles-into-its-action`): the product's working
  screen (`data-ui`) builds from empty in the order of its own story, a part a step, the newest row in
  accent type for a beat (never a tinted ground), then every part folds into its one action, which
  stands alone, live, at the end. Four to six steps a user would really take (*product-ui*). In the
  middle, never beside the product replay; hold 2.4.
- **Object lowered onto the last line** (`object-lowered-onto-the-last-line`): the closing line runs
  across the screen at display size with the action and the price under it, and the product, a
  cut-out, is lowered over the hold with uneven pacing (a slow creep, then most of the travel at the
  end) until its foot rests on the top of one lowercase letter of the last word, like a jug on a shelf,
  every letter whole. One cut-out photograph of the client's own product, never another maker's
  (*product-photo*), and a closing line of 2-5 words. The end of the page, for one physical thing,
  once; hold 0.8; dealt less often than most (weight 0.7). scenes.mjs warns `empty-steps` over the
  ground the object is lowered through and, on a phone, `dead-hold` over the slow creep: the header
  defends both.

**Picture transform**
- **Picture develops from marks** (`picture-develops`): a pen drawing draws itself, heaviest strokes
  first, as the camera pulls back. One high-contrast drawing, or a photograph in darkroom mode. Not
  dealt: its dithered middle frames read as a corrupted, washed-out JPEG (round 8), and a picture keeps
  its colour at every frame.
- **Thumbnail becomes the stage** (`thumbnail-becomes-the-stage`): the middle of three large thumbnails
  grows over its neighbours to full bleed, and the statement becomes its heading word for word. One
  strong loop or picture.

**Section transition**
- **Peel, tear and drag** (`peel-tear-and-drag`): a plane drags the next page in behind it, a sticker
  peels off, or the ground tears away. A top-down cut-out of a plane for the drag; nothing for the
  tear. Not dealt: judged cheap twice (a page curl, a torn-paper seam).
- **Raster cut between chapters** (`raster-cut`): the next chapter prints over the current one through
  slats while the title changes ink line by line. A full-bleed picture for the next chapter (a title
  alone on two flat grounds reads as an empty screen) and a title of 2-4 words. Not dealt (round 11):
  its slats leave slivers at the edges (r10-p47), and after the audit's fix a flat sky still prints as
  a flat bar at 40-50% of the hold.
- **Page lifts off a closing picture** (`page-lifts-off-closing-picture`): the last content section
  lifts away like a sheet at its full width and uncovers a picture held under it all along, which
  settles from a close 1.35x zoom to its framing as the scroll runs out; a band in the picture's own
  top-edge colour carries the closing line and the contact. One photograph with an even top edge (fog,
  sky, a plain wall), or a full-bleed crop of the product's interface (`data-ui`). The end of the page,
  once; hold 1.
- **Section seam bends into a cup that gathers the scattered words**
  (`seam-pocket-gathers-the-words`): eight to twelve short words lie scattered, small and tilted, under
  a section's heading; the scroll carries them one by one into two short columns while the next
  section's dark ground rises into the page as a wide, shallow cup, and each word straightens, grows to
  display size and turns to the light ink where it crosses the edge. Eight to twelve real names that
  sum the section up, one or two words each (*names:8*): what a farm grows, what a studio makes, the
  rooms; no pictures; never on a software page. On the list, into an order, an offer or the contact
  on the ink; once; hold 1.4. Built from the researched technique `lib-0301`, which is no longer dealt
  to build fresh.
- **A still closing line in a field of words** (`closing-line-in-a-field-of-words`): the closing line
  holds still at the lower left at display size, the one action after its last word, while single words
  of the subject come out of a vanishing point above it, grow along six to eight fixed lanes and fade
  while still whole, six at most at once; the last word grows out of the same point and stops over the
  line as the section's heading. 16-30 real words of nine letters or fewer, the page's dishes, places,
  materials or services (*names:16*), a last word of 4-9 letters that can carry the close ('Tonight',
  'Visit'), a closing line of 9-12 words in two clauses of about 22 characters each, a `<br>` between
  them, so it holds two lines at display size on a phone too, and one button; no pictures. The end of
  the page, once, never right after another scene and never on a software page; hold 1. scenes.mjs warns
  `empty-steps` over the flat ground between the words. Dealt a little less often than most (weight
  0.8). Built from the researched technique `lib-0330`.

**Type choreography**
- **Letter physics** (`letter-physics`): a claim bursts apart in 3D and an answer lands in a disc of
  light. A claim of 12-36 characters and one sentence, no pictures.
- **Object rides through giant type** (`object-through-giant-type`): a cut-out object falls through a
  wall of capitals that parts around it. A quote of 12-20 words in three to five short lines, so the
  capitals are giant (about 10vw), and one clean cut-out about a third of the stage high. A longer
  sentence stays a static statement; the scene carries one phrase of it.
- **Scroll-turned drum** (`scroll-turned-drum`): names turn on a 3D drum like a slot reel, with a
  drum of pictures beside it, and nothing else on the front line (no count, no clock). 8-20 real names
  of the client's own rooms, dishes, places, clients or products (`--have names`, or a sector that has
  such lists).
- **Type re-layout** (`type-flip-relayout`): a list in giant capitals spreads, folds into an index and
  hands its size to the heading. A one-word heading and 3-6 short items, no pictures. Not dealt: its
  mid-hold frames show scrambled half-words and a lone fragment over ghost text, and it ran about eight
  screens for five words (round 8).
- **Wordmark under strain** (`wordmark-under-strain`): a closing word is crushed onto its baseline and
  springs back, and its full stop falls out and lands as the button. A word of 4-8 letters, never the
  brand's name (no giant name anywhere), no pictures. For a loud brand (a band, a sports brand, a studio
  that shouts); on a calm house, a craft or a care practice the strain reads as a broken word, so
  redraw. At rest the word reads whole.
- **The dot becomes the full stop** (`dot-becomes-the-full-stop`): one large dot, the display face's
  own full stop set very large, drops onto the page's ground, and a claim grows out of it to the left
  one whole word at a time across nearly the full width, the dot stepping right and a step smaller with
  each word until it is the sentence's own full stop as the last word lands; an optional second beat
  cuts the ground to ink and sets one supporting line under it. One claim of 4-5 words ending on its
  full stop, in a display face whose full stop is a round dot, and an optional line of 8-16 words; no
  pictures, labels or accent on the dot (*pictures:0*). In the middle, after the hero (the intro, the
  about or the proof, never the call to action), the one claim the page stands on: a page short of
  pictures, services above all; once; hold 0.6.
  scenes.mjs warns `empty-steps` while the finished sentence holds over the ground change. Dealt a
  little less often than most (weight 0.8). Built from the researched technique `lib-0370`, which is
  no longer dealt to build fresh.
