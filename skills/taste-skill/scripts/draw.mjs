#!/usr/bin/env node
// tasteskill / draw — deal an art direction from the research library.
//
// The script chooses, not the model: a model asked to pick a direction returns the category
// default every time. The draw is random within what fits the brief, and it remembers recent
// draws so consecutive projects do not look alike.
//
//   node draw.mjs --sector <sector> --brief "one line" [--sections hero,showcase,pricing,footer]
//                 [--tone quiet|bold|warm|technical|playful|luxury|editorial]
//                 [--have photography,product-photo,product-ui,illustration,video,document]   assets you really have
//                        also mark (the brand's own solid mark), route (a real route with stops), plan (a real plan or exploded drawing),
//                        names (eight or more real names of its rooms, dishes, places, clients or products)
//                 [--keep palette,type]        the brand already fixes these; draw the rest
//                 [--avoid id,id] [--seed N] [--out DIR]
//                 [--options 3]                show three dealt directions to choose from, write nothing
//                 [--direction <id>]           deal the full sheet for the chosen direction
//                 [--technique <id> | --no-technique]   force one researched technique in place of a scene, or deal none
//   node draw.mjs --show                       reprint the saved direction sheet
//   node draw.mjs --redraw hero|type|palette|photos|scenes|entrance|replay|section:<role>|direction   re-deal one slot
//   node draw.mjs --redraw scenes=<id>[,<id>] | scenes=none   take scenes by id, or build without one. Scenes are redrawn
//                                              twice at most: a third --redraw scenes lists the ones that still fit instead
//   node draw.mjs --list sectors|directions|roles|tones|scenes|techniques|entrances|replays
//   node draw.mjs --site <id>                  print one studied reference site in full
//   node draw.mjs --app --kind <kind> ...      deal a style for an app screen instead (see lib/app-draw.mjs)
//
// Zero dependencies. Node 18+.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomInt } from 'node:crypto';
import { homedir } from 'node:os';
import { dealTypeSystem, THIN_TEXT } from './lib/type-deal.mjs';
import { dealPaletteV25 } from './lib/colour-deal.mjs';
import { dealFrame } from './lib/frame-deal.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const LIB = join(HERE, '..', 'library');
const ASSETS_PATH = join(HERE, 'assets.mjs').split('\\').join('/');
const ASSETS_CMD = `node ${/\s/.test(ASSETS_PATH) ? `"${ASSETS_PATH}"` : ASSETS_PATH}`;
const load = (name) => JSON.parse(readFileSync(join(LIB, name + '.json'), 'utf8'));

const argv = process.argv.slice(2);
const opt = (name, def) => { const i = argv.indexOf('--' + name); if (i === -1) return def; const v = argv[i + 1]; return v === undefined || v.startsWith('--') ? true : v; };
const list = (v) => (typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : []);
const outDir = resolve(String(opt('out', '.taste-skill')));
const sheetPath = join(outDir, 'direction.json');

const SECTORS = ['saas', 'dev-tool', 'ai-product', 'consumer-app', 'finance', 'agency', 'studio-portfolio', 'personal-portfolio', 'ecommerce', 'physical-product', 'fashion', 'hospitality', 'restaurant', 'real-estate', 'architecture', 'event', 'health', 'education', 'nonprofit', 'culture', 'music', 'other'];
const TONES = ['quiet', 'bold', 'warm', 'technical', 'playful', 'luxury', 'editorial'];
const SOFTWARE = ['saas', 'dev-tool', 'ai-product', 'consumer-app', 'finance']; // the sectors whose subject is software
// Scenes judged cheap twice (a page curl, a torn-paper seam), hollow twice (stepped columns built empty ink boxes in
// r4-p23 and r5-p26) or a stock trope twice (scatter and lock, r4-p24 and r5-p28): never dealt; the files stay
const NEVER_SCENES = new Set(['peel-tear-and-drag', 'stepped-columns-raise-a-stage', 'scatter-and-lock']);
// Atmosphere scenes (light, a burst of lines, letters) carry one line and no information. In round 1 of the v2.5 tests
// every one of them was the stretch judges called dead scroll on a product page: dealt only to loud or creative pages.
const ATMOSPHERE = new Set(['warp-jump', 'light-flood', 'letter-physics', 'wordmark-under-strain', 'object-through-giant-type', 'type-flip-relayout']);
// The first screen's picture. Archetypes that set it small (a poster, a mosaic, a strip), unless the blueprint makes the
// picture full-bleed, and the heroes whose blueprint sets it small whatever their archetype: a photograph on three of
// twelve columns, two 280px doors, a portrait or a print a third of the width, one 450px control on half the screen.
const SMALL_PICTURE = new Set(['type-poster', 'giant-wordmark', 'colour-field', 'inline-media-sentence', 'index', 'mosaic', 'tiles', 'quiet-column', 'artefact']);
const SMALL_PICTURE_HEROES = new Set(['name-split-to-corners', 'pinned-title-over-portraits', 'two-doors-on-a-dark-wall', 'counter-object-wide-wordmark', 'two-prints-in-darkness', 'control-reads-the-page']);
// What a scene really takes ("needs" in library/scenes.json), checked against what the brief has (--have, its words
// and the imagery mode):
//   product-photo  photographs or renders of this very product, building or work (--have product-photo)
//   pictures:N     N distinct photographs of one family of the subject's world
//   series:N       N photographs shot or chosen as one series: one subject and framing, in other states or light
//   names:N        N or more real names of the client's own rooms, dishes, places, clients or products (--have names,
//                  or a sector that has such lists; never a product page without photographs or a software page)
//   mark           the brand's own solid mark (--have mark or --have logo; a brief saying "no logo yet" has none)
//   route          a real route with stops that the subject travels (--have route, or one the brief names)
//   product-ui     the product's own interface (a software page)
//   plan           a real plan or exploded drawing (--have plan)
//   video          footage or a frame sequence of this very product (--have video)
//   own            (techniques) the client's own photographs: --have photography or product-photo
//   document       (techniques) a document the product makes: one the brief names, or --have document
//   a|b            either
// A page with no photographs of its product, or a software page, can honestly show about three photographs of the
// subject (its kind in use, its world) and no series; a page with no photographs of its own at all plans three to six
// (the sheet's imagery section). The cap counts the scenes of a page together: in r6-p31 a cargo bike page redrew its
// scenes five times for photo cards, chapters, a mark and a route it could not fill.
const SCENE_PICTURE_CAP = { 'no-product-photo': 3, interface: 3, atmosphere: 6 };
// A page short of pictures of its own subject (no photographs of its product, or a brief that says it has few) is dealt
// first from the scenes and techniques that need no photograph or one: scenes of type, the product's own interface
// where the page has it, techniques labelled 0 or 1. In r7-p34 a cargo bike page with no photographs redrew its scenes
// three times, each wanting three to six photographs of one family, and was built with no scene at all.
const FEW_PICTURE_WORDS = /\b(?:no|few|without|hardly any|not many)\s+(?:(?:good|real|own|usable|product)\s+)?(?:photo(?:graph)?s?|pictures?|images?|imagery)\b/i;
function fewPictures(input) { const mode = imageryMode(input); return mode === 'no-product-photo' || (mode !== 'own' && FEW_PICTURE_WORDS.test(input.brief || '')); }
function lightScene(sc) { return scenePictures(sc) <= 1; }
const ROUTE_WORDS = /\b(?:routes?|treks?|itinerar(?:y|ies)|voyages?|crossings?|ferr(?:y|ies)|pilgrimages?|expeditions?)\b/i;
// months, weekdays and seasons are not places: "open from May to September" names no route
const NOT_PLACE = /^(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|mon(?:day)?|tues?(?:day)?|wed(?:nesday)?|thu(?:rs?(?:day)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?|spring|summer|autumn|fall|winter|easter|christmas)s?$/i;
// "from Oban to Mull"
const routeInBrief = (brief) => ROUTE_WORDS.test(brief) || [...String(brief || '').matchAll(/\bfrom (\p{Lu}\p{L}+) to (\p{Lu}\p{L}+)/gu)].some((m) => !NOT_PLACE.test(m[1]) && !NOT_PLACE.test(m[2]));
// sectors whose pages really list eight or more names of their own (rooms, dishes, places, clients, products)
const NAME_SECTORS = ['hospitality', 'restaurant', 'event', 'culture', 'music', 'agency', 'studio-portfolio', 'personal-portfolio', 'architecture', 'real-estate', 'education', 'nonprofit'];
// A place people go to: a café, a bar, a restaurant, a shop, a guesthouse, a studio with a door. The restaurant and
// hospitality sectors, or a word for one in the brief's own subject ("a design studio" has no door to visit; "a pottery
// studio" has; "a studio designing for restaurants" has none: briefHead stops before the clients).
// Its visit block names the street and the way there (visitBlock).
const DOOR_WORDS = /\b(?:caf[eé]s?|coffee (?:bar|shop|house)s?|bars?|pubs?|restaurants?|bistros?|trattorias?|osterias?|bakery|bakeries|roaster(?:y|ies)|brewer(?:y|ies)|taprooms?|delis?|shops?|stores?|boutiques?|bookshops?|florists?|market halls?|guest ?houses?|hotels?|inns?|hostels?|b&bs?|lodges?|cabins?|huts?|campsites?|salons?|barbers?|galler(?:y|ies)|museums?|saunas?|spas?|gyms?|clinics?|(?:dental|medical|physio\w*|vet\w*|doctors?'?|family) practices?|dentists?|theat(?:re|er)s?|cinemas?|venues?|librar(?:y|ies)|winer(?:y|ies)|distiller(?:y|ies)|kiosks?|(?:yoga|pilates|dance|pottery|ceramics?|tattoo|hair|nail|fitness|climbing|print) studios?)\b/i;
const briefHead = (b) => String(b || '').split(/\s(?:that|which|who|for|with|whose|making|selling|serving|shooting|designing|building)\s|[:;(]/i)[0];
// The category's stock shots, named on the sheet so they stay off the page unless art-directed (r9-p44 filled a
// roastery page with full-frame beans and burlap sacks, and the judge read them as generic). The brief's trade first,
// then the sector's; references/imagery.md §2 keeps the list. The third part finds them among the dealt photographs.
const CLICHES = [
  [/\b(?:coffee|espresso|roaster(?:y|ies)?)\b/i, 'full-frame beans, burlap sacks, top-down latte art', /\bbeans filling\b|\bcoffee beans\b|\bburlap\b|\bhessian\b|\bjute sacks?\b|\blatte art\b|\b(?:cup|mug) of coffee\b[^.]*\bfrom above\b/i],
  [/\b(?:bakery|bakeries|bakers?|bread|patisserie|pastr(?:y|ies))\b/i, 'flour dusted over a board, a loaf on a cloth from above', /\bflour\b[^.]*\bboard\b|\bloaf\b[^.]*\bfrom above\b/i],
  [/\b(?:wines?|winery|vineyards?)\b/i, 'a glass swirled against the light, vines at sunset', /\bwine ?glass\b|\bvines?\b[^.]*\b(?:sunset|dusk)\b/i],
  [/\b(?:teas?)\b/i, 'leaves spilled from a spoon, steam over a cup', /\bsteam\b[^.]*\b(?:cup|mug)\b|\btea leaves\b/i],
  [/\b(?:beers?|brewer(?:y|ies)|taprooms?)\b/i, 'a row of taps, a pint held to the light', /\b(?:beer )?taps\b|\bpint\b/i],
  [/\b(?:yoga|pilates|fitness|gyms?)\b/i, 'a silhouette at sunrise, a row of dumbbells', /\bdumbbells?\b|\bsilhouett\w*\b[^.]*\bsunrise\b/i],
];
const SECTOR_CLICHES = {
  saas: 'hands on a laptop, a team round a screen', 'dev-tool': 'hands on a laptop, code on a dark screen', 'ai-product': 'a glowing brain, hands on a laptop', 'consumer-app': 'a hand holding up a phone', finance: 'stacked coins, a handshake, a chart on a screen',
  hospitality: 'a made bed shot straight on, a folded towel, a pool at sunset', restaurant: 'a flat lay of ingredients, a chef plating with tweezers', 'real-estate': 'keys handed over, a drone shot of roofs', architecture: 'a drone shot of roofs, a hard hat on drawings',
  agency: 'sticky notes on a glass wall, a team laughing at a laptop', 'studio-portfolio': 'a desk with a laptop and a plant', education: 'a raised hand in a lecture hall, books with an apple', health: 'a stethoscope on a desk, a silhouette at sunrise', nonprofit: 'hands joined in a circle, a child looking into the lens',
  ecommerce: 'smiling models in a studio, the product floating in mid-air on a bright colour', 'physical-product': 'the product floating in mid-air on a bright colour, a smiling model holding it', event: 'confetti over a crowd, a microphone in close-up',
};
const SECTOR_CLICHE_PHOTOS = {
  restaurant: /\b(?:bowls?|salad|plates?|ingredients|cutting board|pastry|nuts)\b[^.]*\b(?:from above|overhead)\b|\boverhead (?:view|arrangement)\b[^.]*\b(?:board|bowls?|pan|kitchen)\b|\bflat ?lay\b/i,
  hospitality: /\bmade bed\b|\bfolded towels?\b|\bpool at (?:sunset|dusk)\b/i,
  saas: /\blaptop\b/i, 'dev-tool': /\blaptop\b/i, 'ai-product': /\blaptop\b/i, finance: /\bcoins?\b(?!-operated)|\bhandshake\b/i,
  'real-estate': /\bkeys\b|\bdrone\b/i, health: /\bstethoscope\b/i, event: /\bconfetti\b/i,
};
const NEED_WORDS = { 'product-photo': 'photographs of this very product, building or work', mark: "the brand's own solid mark", route: 'a real route with stops', 'product-ui': "the product's own interface", plan: 'a real plan or exploded drawing', video: 'footage or a frame sequence of this very product' };
function needWords(need) {
  const parts = need.split('|').map((n) => {
    const [k, v] = n.split(':');
    if (k === 'pictures') return +v > 1 ? `${v} photographs of one family` : +v ? 'one photograph' : 'no photographs';
    if (k === 'series') return `${v} photographs shot or chosen as one series`;
    if (k === 'names') return `${v} or more real names of the client's own rooms, dishes, places, clients or products`;
    return NEED_WORDS[k] || k;
  });
  return parts.length > 1 ? `one of: ${parts.join('; ')}` : parts[0];
}
// The distinct photographs a scene takes (its pictures:N), for the page's cap.
function scenePictures(sc) { return Math.max(0, ...(sc.needs || []).flatMap((n) => n.split('|')).filter((n) => n.startsWith('pictures:')).map((n) => +n.split(':')[1] || 0)); }
function sceneNeedsWords(sc) { const w = (sc.needs || []).map(needWords); return w.length > 1 ? `${w.slice(0, -1).join(', ')}, and ${w.at(-1)}` : w[0] || 'its words only'; }
// Researched techniques (library/techniques.json, exported from the lab's study of award sites): about one page in two
// gets one in place of one of its dealt scenes, so the deal spreads over the whole research library and not only over
// the scenes already built. The builder makes it fresh on the shared stage (sheet section 9).
const TECHNIQUE_RATE = 0.5;
const TECHNIQUE_RECENT = 6; // draws whose technique the next deal avoids while others fit
const TECHNIQUE_TRIGGERS = ['scroll-scrub', 'scroll-enter']; // a scene runs on native scroll (references/scenes.md §7 rule 3)
// the sections a technique can carry: its position, and in the middle of the page what it carries
const TECHNIQUE_ROLES = {
  opening: ['hero'],
  closing: ['cta', 'contact'],
  transition: ['intro', 'about', 'work', 'features', 'gallery', 'list', 'how-it-works', 'contact'],
  work: ['work', 'gallery', 'showcase'],
  content: ['features', 'showcase', 'how-it-works', 'list', 'gallery', 'stats', 'about'],
  // the page's own statement: a customer's quote with its attribution cannot fill a manifesto set at display size
  statement: ['intro', 'about'],
  atmosphere: ['intro', 'about', 'gallery'],
  // a middle one built from the product's interface goes where the product is explained; a statement made of a list
  // (what the business does) is no quotation
  ui: ['how-it-works', 'features', 'showcase', 'intro', 'about'],
  'statement-list': ['intro', 'about', 'features'],
};
function techniqueRoles(t) {
  const roles = t.position !== 'middle' ? TECHNIQUE_ROLES[t.position] || []
    : t.needs?.ui ? TECHNIQUE_ROLES.ui
    : TECHNIQUE_ROLES[t.carries === 'statement' && t.needs?.words === 'list' ? 'statement-list' : t.carries] || [];
  // a gallery is pictures: one made of type, or of a single picture, never takes its place
  return (TECHNIQUE_PICTURES[t.needs?.pictures] ?? 0) < 2 ? roles.filter((r) => r !== 'gallery') : roles;
}
// its picture label as the photographs it takes (the scene vocabulary above, counted against the page's cap): the
// directions ask for the top of the range more often than the bottom (three of '2-3', six or more of '4-8')
const TECHNIQUE_PICTURES = { 0: 0, 1: 1, '2-3': 3, '4-8': 6, many: 8 };
NEED_WORDS.own = "the client's own photographs of this very subject (its work, this product, one place in two states)";
NEED_WORDS.document = 'a document the product really makes (an invoice, a contract, a report, a ticket)';
// what the brief must name for a technique that needs a document (`--have document` says it too)
const DOCUMENT_WORDS = /\b(invoic\w*|contracts?|receipts?|statements?|reports?|reporting|quotes?|quoting|proposals?|tickets?|ticketing|invitations?|letters?|documents?)\b/i;
// A technique in the shape of a scene, so the scene deal checks and places it by the same rules. The client's own
// photographs are needed for a work-carrying one with pictures: a stand-in is never a studio's work.
function techniqueScene(t) {
  const n = t.needs || {}; const pictures = TECHNIQUE_PICTURES[n.pictures] ?? 0;
  const needs = [`pictures:${pictures}`, (n.own || (t.carries === 'work' && pictures > 0)) && 'own', n.names && 'names:8', n.ui && 'product-ui', n.video && 'video', n.document && 'document'].filter(Boolean);
  return {
    id: t.id, technique: true, name: t.name, family: t.family, position: t.position, trigger: t.trigger, energy: t.energy, kind: t.carries,
    roles: techniqueRoles(t), sectors: t.sectors || ['*'], needs,
    // the stage holds a scene one screen at least; a closing one holds about one screen (scenes.md §7 rule 2)
    hold: Math.max(1, t.hold || 0), researchHold: t.hold || 0, lines: t.position === 'closing' ? 1 : undefined,
    phone: t.phone, score: t.score, principle: t.principle, freshTake: t.freshTake, breaksWhen: t.breaksWhen,
  };
}
const DEFAULT_SECTIONS = {
  saas: ['hero', 'showcase', 'features', 'how-it-works', 'testimonial', 'pricing', 'faq', 'cta', 'footer'],
  'dev-tool': ['hero', 'showcase', 'features', 'how-it-works', 'pricing', 'faq', 'cta', 'footer'],
  'ai-product': ['hero', 'showcase', 'features', 'how-it-works', 'testimonial', 'pricing', 'cta', 'footer'],
  'consumer-app': ['hero', 'showcase', 'features', 'testimonial', 'cta', 'footer'],
  finance: ['hero', 'showcase', 'features', 'stats', 'testimonial', 'faq', 'cta', 'footer'],
  agency: ['hero', 'intro', 'work', 'services', 'about', 'cta', 'footer'],
  'studio-portfolio': ['hero', 'work', 'intro', 'services', 'about', 'cta', 'footer'],
  'personal-portfolio': ['hero', 'work', 'about', 'cta', 'footer'],
  ecommerce: ['hero', 'gallery', 'features', 'intro', 'testimonial', 'cta', 'footer'],
  'physical-product': ['hero', 'showcase', 'features', 'gallery', 'intro', 'pricing', 'cta', 'footer'],
  fashion: ['hero', 'gallery', 'intro', 'work', 'cta', 'footer'],
  hospitality: ['hero', 'intro', 'gallery', 'features', 'list', 'contact', 'footer'],
  restaurant: ['hero', 'intro', 'list', 'gallery', 'contact', 'footer'],
  'real-estate': ['hero', 'intro', 'gallery', 'features', 'stats', 'contact', 'footer'],
  architecture: ['hero', 'work', 'intro', 'about', 'contact', 'footer'],
  event: ['hero', 'intro', 'list', 'features', 'pricing', 'faq', 'cta', 'footer'],
  health: ['hero', 'intro', 'features', 'how-it-works', 'testimonial', 'faq', 'cta', 'footer'],
  education: ['hero', 'intro', 'features', 'how-it-works', 'testimonial', 'pricing', 'faq', 'cta', 'footer'],
  nonprofit: ['hero', 'intro', 'stats', 'features', 'about', 'cta', 'footer'],
  culture: ['hero', 'intro', 'gallery', 'list', 'about', 'cta', 'footer'],
  music: ['hero', 'list', 'gallery', 'about', 'cta', 'footer'],
  other: ['hero', 'intro', 'features', 'showcase', 'cta', 'footer'],
};
// requested role names → the role vocabulary used by library/sections.json
const ROLE_ALIAS = { features: 'features', feature: 'features', benefits: 'features', services: 'features', showcase: 'showcase', product: 'showcase', demo: 'showcase', 'how-it-works': 'how-it-works', how: 'how-it-works', process: 'how-it-works', steps: 'how-it-works', testimonial: 'testimonial', testimonials: 'testimonial', quotes: 'testimonial', proof: 'proof', logos: 'proof', press: 'proof', stats: 'stats', numbers: 'stats', pricing: 'pricing', plans: 'pricing', faq: 'faq', cta: 'cta', footer: 'footer', intro: 'intro', manifesto: 'intro', about: 'about', team: 'about', work: 'work', projects: 'work', index: 'work', 'case-studies': 'work', gallery: 'gallery', images: 'gallery', list: 'list', menu: 'list', schedule: 'list', lineup: 'list', 'line-up': 'list', speakers: 'list', agenda: 'list', programme: 'list', program: 'list', timetable: 'list', rooms: 'list', tickets: 'pricing', price: 'pricing', contact: 'contact', booking: 'contact', newsletter: 'contact', signup: 'contact' };

// App screens (dashboards, admin, settings) have their own library and sheet: scripts/lib/app-draw.mjs.
const savedKind = (() => { try { return JSON.parse(readFileSync(sheetPath, 'utf8')).kind; } catch { return null; } })();
if (opt('app') || ((opt('show') || opt('redraw')) && savedKind === 'app')) await import('./lib/app-draw.mjs');

if (opt('list')) {
  const what = opt('list');
  if (what === 'sectors') console.log(SECTORS.join('\n'));
  else if (what === 'tones') console.log(TONES.join('\n'));
  else if (what === 'roles') console.log([...new Set(Object.values(ROLE_ALIAS))].join('\n'));
  else if (what === 'scenes') { const all = existsSync(join(LIB, 'scenes.json')) ? load('scenes') : []; for (const sc of all) console.log(`${sc.id.padEnd(34)} ${sc.name} — ${sc.family}; ${sc.summary.split(/(?<=\.)\s/)[0]} Needs: ${sceneNeedsWords(sc)}.${sc.weight === 0 || NEVER_SCENES.has(sc.id) ? ' (not dealt)' : ''}`); if (!all.length) console.log('No scene library yet.'); }
  else if (what === 'techniques') { const all = existsSync(join(LIB, 'techniques.json')) ? load('techniques') : []; const scenes = existsSync(join(LIB, 'scenes.json')) ? load('scenes') : []; for (const t of all) { const sc = techniqueScene(t); const built = scenes.find((x) => x.source === t.id); console.log(`${t.id}  ${t.name} — ${t.family}; ${t.position}, ${t.energy}, hold ${t.hold}; ${t.sectors.join(', ')}. Needs: ${sceneNeedsWords(sc)}.${built ? ` (not dealt: now the tested scene ${built.id})` : ''}`); } if (!all.length) console.log('No technique library yet.'); }
  else if (what === 'entrances') { const all = existsSync(join(LIB, 'entrances.json')) ? load('entrances') : []; for (const e of all) console.log(`${e.id.padEnd(16)} ${e.name} — ${e.family}, ${e.energy}, weight ${e.weight}; ${e.summary || e.sees.split(/(?<=\.)\s/)[0]}`); if (!all.length) console.log('No entrance library yet.'); }
  else if (what === 'replays') { const all = existsSync(join(LIB, 'replays.json')) ? load('replays') : []; for (const r of all) console.log(`${r.id.padEnd(14)} ${r.name} — ${r.sectors.join(', ')}${r.brief ? ` (or a brief matching /${r.brief}/)` : ''}; ${r.beats}`); if (!all.length) console.log('No replay library yet.'); }
  else for (const d of load('directions')) console.log(`${d.id.padEnd(30)} ${d.name} — ${d.sectors.join(', ')}`);
  process.exit(0);
}
if (opt('photos')) {
  const lib = load('photos'); const q = String(opt('photos'));
  const line = (ph) => `- https://picsum.photos/id/${ph.id}/1600/1000 — ${ph.alt} · ${ph.tone} tone · ${(ph.colours || []).join(', ')}${ph.mono ? ' · black-and-white' : ''}${ph.calm && ph.calm !== 'none' ? ` · calm area: ${ph.calm}` : ''} · photo: ${ph.by}`;
  if (q === 'list' || q === 'true') { for (const [id, set] of Object.entries(lib.sets)) console.log(`${id.padEnd(22)} ${String(set.photos.length).padStart(3)} photos — ${set.note}`); }
  else if (lib.sets[q]) { console.log(`# ${lib.sets[q].title} — ${lib.sets[q].note}`); for (const ph of lib.sets[q].photos) console.log(line(ph)); }
  else { // free-text search across all descriptions
    const words = q.toLowerCase().split(/[^a-z]+/).filter((w) => w.length >= 3);
    const hits = Object.values(lib.sets).flatMap((s) => s.photos).filter((ph) => words.some((w) => (ph.alt + ' ' + (ph.colours || []).join(' ')).toLowerCase().includes(w)));
    if (!hits.length) console.log('No photograph matches. `--photos list` shows the sets.'); else for (const ph of hits.slice(0, 24)) console.log(line(ph));
  }
  console.log('\nPath numbers are width/height; ?grayscale only where section 0 of the sheet deals the black-and-white treatment. A line marked black-and-white is a black-and-white file: never where the pictures carry the colour (food, seasons, rooms, products, a client named for a colour or a light). Photographs are atmosphere, never a stand-in for a person; a room, a dish or a product only as a picture of its kind, listed as such in the report.');
  process.exit(0);
}
if (opt('site')) {
  const s = load('sites').find((x) => x.id === opt('site') || x.name.toLowerCase() === String(opt('site')).toLowerCase());
  if (!s) { console.error('No studied site with that id. Ids appear in the direction sheet under "Real references".'); process.exit(2); }
  console.log(siteCard(s, true)); process.exit(0);
}

// ---------- randomness (seedable) ----------
let seed = opt('seed') !== undefined && opt('seed') !== true ? Number(opt('seed')) : randomInt(1, 2 ** 31 - 1);
const startSeed = seed;
const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const wpick = (pairs) => { const t = pairs.reduce((s, [, w]) => s + w, 0); let r = rnd() * t; for (const [v, w] of pairs) { r -= w; if (r <= 0) return v; } return pairs.at(-1)[0]; };
const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
// prefer items not used recently, without ever emptying the pool
const fresh = (pool, recent) => { const f = pool.filter((x) => !recent.includes(x.id)); return f.length ? f : pool; };

// ---------- history (project + user level) ----------
const userHist = process.env.TASTE_SKILL_HISTORY || join(homedir(), '.taste-skill', 'history.json');
const readHist = () => { for (const p of [userHist]) { try { return JSON.parse(readFileSync(p, 'utf8')); } catch {} } return []; };
const writeHist = (entry) => { try { mkdirSync(dirname(userHist), { recursive: true }); const h = readHist(); h.unshift(entry); writeFileSync(userHist, JSON.stringify(h.slice(0, 24), null, 1)); } catch {} };
const patchHist = (at, fields) => { try { const h = readHist(); const e = h.find((x) => x.at === at); if (!e || Object.entries(fields).every(([k, v]) => JSON.stringify(e[k]) === JSON.stringify(v))) return; Object.assign(e, fields); writeFileSync(userHist, JSON.stringify(h, null, 1)); } catch {} };

// ---------- show / redraw ----------
const saved = existsSync(sheetPath) ? JSON.parse(readFileSync(sheetPath, 'utf8')) : null;
if (opt('show')) {
  if (!saved) { console.error('No saved direction. Run a draw first.'); process.exit(2); }
  console.log(render(saved)); process.exit(0);
}

const L = { directions: load('directions'), heroes: load('heroes'), sections: load('sections'), type: load('type'), palettes: load('palettes'), photos: load('photos'), sites: load('sites'), motions: load('motions'), fonts: load('fonts').fonts, scenes: existsSync(join(LIB, 'scenes.json')) ? load('scenes') : [], entrances: existsSync(join(LIB, 'entrances.json')) ? load('entrances') : [], replays: existsSync(join(LIB, 'replays.json')) ? load('replays') : [] };
// a technique since built and tested as a scene (the scene's `source`) is dealt as that scene, never built fresh again
L.techniques = (existsSync(join(LIB, 'techniques.json')) ? load('techniques') : []).filter((t) => !L.scenes.some((sc) => sc.source === t.id)).map(techniqueScene);
const sceneById = (id) => L.scenes.find((x) => x.id === id) || L.techniques.find((x) => x.id === id);
// --technique <id> forces one in place of a scene (for tests); --no-technique deals none, and the sheet keeps it so
const FORCED_TECHNIQUE = opt('technique') === undefined ? null : opt('technique');
if (FORCED_TECHNIQUE === true) { console.error('--technique needs an id. `node draw.mjs --list techniques` lists them.'); process.exit(2); }
if (FORCED_TECHNIQUE && opt('no-technique')) { console.error('Use --technique <id> or --no-technique, not both.'); process.exit(2); }
const hist = readHist();
const recent = (key, n) => hist.slice(0, n).map((h) => h[key]).filter(Boolean);

let sheet;
if (opt('alternatives')) {
  // The other blueprints of one role that suit the saved direction: for when the dealt one cannot hold
  // the real content (it assumes three plans and there is one; it needs five quotes and there are none).
  if (!saved) { console.error('Run a draw first.'); process.exit(2); }
  const role = ROLE_ALIAS[String(opt('alternatives'))] || String(opt('alternatives'));
  const dir = L.directions.find((d) => d.id === saved.direction.id);
  const current = saved.sections.find((s) => s.role === role)?.id;
  const pool = sectionPool(dir, role, saved.input);
  if (!pool.length) { console.error('No blueprints for role ' + role + '. Roles: --list roles'); process.exit(2); }
  const line = (s) => `- \`${s.id}\`${s.id === current ? ' (dealt)' : ''} — **${s.name}** (${s.shape}). ${s.blueprint.split(/(?<=\.)\s/).slice(0, 2).join(' ')}\n`;
  console.log(`# ${role}: blueprints that suit "${dir.name}"\n`);
  for (const s of pool) console.log(line(s));
  const software = imageryMode(saved.input) === 'interface';
  const others = L.sections.filter((s) => s.role === role && !s.banned && !pool.includes(s) && (software || !softwareOnly(s)) && (s.needs || []).every((n) => saved.input.have.includes(n) || (n === 'product-ui' && software)));
  if (others.length) {
    console.log(`# Other ${role} blueprints (written for other directions; if one fits the content better, take its geometry and set it in this direction's type, colour and manner)\n`);
    for (const s of others) console.log(line(s));
  }
  console.log(`Choose by what the content really is (how many plans, quotes, items exist), then: node draw.mjs --redraw section:${role}=<id>   and say why in your report.`);
  process.exit(0);
}
if (opt('redraw')) {
  if (!saved) { console.error('Nothing to redraw. Run a draw first.'); process.exit(2); }
  sheet = saved; sheet.redraws = (sheet.redraws || 0) + 1; // the sheet keeps its original seed; slot redraws are counted
  const what = String(opt('redraw'));
  const dir = L.directions.find((d) => d.id === sheet.direction.id);
  if (what === 'direction') {
    // a new direction keeps the count of scene redraws, so it is no way around the limit of two, and deals none of the
    // scenes already redrawn away from
    // (the old direction's own scenes among them: r9 brought the same track back under a new direction)
    const { sceneRedraws } = sheet;
    const scenesTried = [...new Set([...(sheet.scenesTried || []), ...(sheet.scenes || []).map((x) => x.id)])];
    sheet = deal({ ...sheet.input, direction: null, avoid: [...(sheet.input.avoid || []), sheet.direction.id] }, sheet.redraws, scenesTried);
    Object.assign(sheet, { scenesTried, ...(sceneRedraws ? { sceneRedraws } : {}) });
  }
  else if (what === 'hero') sheet.hero = dealHero(dir, sheet.input, [sheet.hero?.id]);
  else if (what === 'type') sheet.type = dealType(dir, [sheet.type?.id], sheet.input.tone, isDark(sheet.palette));
  else if (what === 'palette') {
    sheet.palette = dealPalette(dir, sheet.input, [sheet.palette?.id], nameColours(sheet.input.brief).lean);
    // the type deal leaves thin text faces off dark grounds; one dealt for a pale ground is dealt again
    if (isDark(sheet.palette) && sheet.type && THIN_TEXT.has(sheet.type.text.family)) sheet.type = dealType(dir, [sheet.type.id], sheet.input.tone, true);
  }
  else if (what === 'photos') sheet.photos = dealPhotos(dir, sheet.input);
  else if (what === 'scenes' || what.startsWith('scenes=')) {
    // the replay keeps its section; a scene never carries it or a section next to it
    const reserved = sheet.replay ? [sheet.replay.carries] : [];
    const wanted = what.startsWith('scenes=') ? what.slice(7).trim().toLowerCase() : null;
    delete sheet.lightOptions;
    // none is still allowed, but the sheet names the scenes that need no photograph or one and still fit
    if (wanted === 'none') { sheet.scenesTried = [...new Set([...(sheet.scenesTried || []), ...(sheet.scenes || []).map((x) => x.id)])]; sheet.scenes = []; sheet.noScenes = true; sheet.lightOptions = lightOptions(dir, sheet); }
    else if (wanted !== null) {
      // a scene taken by id: it must fit this page (sector, needs) and find a section to carry. The ones it replaces are
      // kept as dealt, so a later redraw does not bring them back (r9: a fly-through returned after a scene taken by id)
      try {
        const next = dealScenes(dir, sheet.input, [], reserved, list(wanted));
        sheet.scenesTried = [...new Set([...(sheet.scenesTried || []), ...(sheet.scenes || []).map((x) => x.id)])];
        sheet.scenes = next; sheet.noScenes = false;
      } catch (e) { console.error(e.message); process.exit(2); }
    } else {
      // Scenes are redrawn twice at most: the builder of r6-p31 redrew them five times for scenes it could not fill. The
      // third asks for a choice instead: the scenes that still fit, with what each needs, and the two ways out.
      sheet.sceneRedraws = (sheet.sceneRedraws || 0) + 1;
      if (sheet.sceneRedraws > 2) {
        sheet.redraws -= 1; // a list, not a redraw
        mkdirSync(outDir, { recursive: true });
        writeFileSync(sheetPath, JSON.stringify(sheet, null, 1));
        console.log(sceneChoices(dir, sheet));
        process.exit(0);
      }
      // a technique that could not be built honestly gives way to tested scenes; otherwise the redraw may deal one again.
      // Nothing dealt on this sheet before comes back, across all its redraws: in r7-p36 two redraws both returned the
      // same fly-through.
      const hadTechnique = (sheet.scenes || []).some((x) => x.technique);
      sheet.scenesTried = [...new Set([...(sheet.scenesTried || []), ...(sheet.scenes || []).map((x) => x.id)])];
      let next = dealScenes(dir, sheet.input, sheet.scenesTried, reserved);
      // (a page short of pictures may take another technique that needs none or one: better than a scene it cannot fill)
      // (and when no tested scene is left to deal, a technique that fits is dealt rather than nothing)
      if (!hadTechnique || fewPictures(sheet.input) || !next.length) next = dealTechnique(dir, sheet.input, next, reserved, { exclude: sheet.scenesTried, always: !next.length });
      if (!next.length) {
        // nothing that has not been dealt here fits: no redraw, the list of what does instead
        sheet.sceneRedraws -= 1; sheet.redraws -= 1;
        mkdirSync(outDir, { recursive: true });
        writeFileSync(sheetPath, JSON.stringify(sheet, null, 1));
        console.log(sceneChoices(dir, sheet, 'none-new'));
        process.exit(0);
      }
      sheet.scenes = next; sheet.noScenes = false;
    }
  } else if (what === 'entrance') sheet.entrance = dealEntrance(sheet, [sheet.entrance?.id].filter(Boolean));
  else if (what === 'replay') {
    if (!isSoftware(sheet.input)) { console.error('A product replay is dealt only on a software page (a software sector, or --have product-ui).'); process.exit(2); }
    sheet.replay = dealReplay(sheet, [sheet.replay?.id].filter(Boolean));
    if (sheet.replay) sheet.motion = null;
  }
  else if (what.startsWith('section:')) {
    // section:<role> re-deals at random; section:<role>=<id> takes a named alternative (see --alternatives)
    const [roleRaw, wanted] = what.slice(8).split('=');
    const role = ROLE_ALIAS[roleRaw] || roleRaw;
    const i = sheet.sections.findIndex((s) => s.role === role);
    if (i === -1) { console.error('No section with role ' + role + ' in this sheet.'); process.exit(2); }
    const used = sheet.sections.map((s) => s.id);
    if (wanted) {
      // a blueprint written for another role may be borrowed when its geometry fits the content better
      const chosen = L.sections.find((s) => s.id === wanted);
      if (!chosen) { console.error(`No blueprint with id ${wanted}. List them with --alternatives <role>.`); process.exit(2); }
      if (chosen.banned) { console.error(`${wanted} is not dealt: ${chosen.bannedWhy || 'it is retired.'}`); process.exit(2); }
      sheet.sections[i] = chosen.role === role ? chosen : { ...chosen, role, name: `${chosen.name} (borrowed from ${chosen.role})` };
    } else sheet.sections[i] = dealSection(dir, role, used, sheet.sections[i - 1]?.shape, sheet.sections[i + 1]?.shape, sheet.input) || sheet.sections[i];
  } else { console.error('Unknown slot. Use hero, type, palette, photos, scenes, scenes=<id>[,<id>], scenes=none, entrance, replay, section:<role>, section:<role>=<id> or direction.'); process.exit(2); }
  // a new hero or new scenes can change what the first screen shows: keep the entrance only while it still fits
  if (sheet.entrance && what !== 'direction') {
    const mode = heroMode(sheet);
    sheet.entrance = entranceFits(sheet, sheet.entrance, mode) ? { ...sheet.entrance, mode } : dealEntrance(sheet, []);
    settleMotion(sheet);
  }
} else {
  const sector = String(opt('sector', ''));
  if (!SECTORS.includes(sector)) {
    console.error(`--sector is required. One of:\n  ${SECTORS.join(', ')}\nPick the closest; use "other" only when nothing fits.`);
    process.exit(2);
  }
  const requested = list(opt('sections'));
  const input = {
    brief: typeof opt('brief') === 'string' ? opt('brief') : '', sector,
    tone: TONES.includes(opt('tone')) ? opt('tone') : null,
    have: list(opt('have')), keep: list(opt('keep')), avoid: list(opt('avoid')),
    sections: (requested.length ? requested : DEFAULT_SECTIONS[sector]).map((r) => ROLE_ALIAS[r] || r).filter((r) => r !== 'hero'),
    direction: typeof opt('direction') === 'string' ? opt('direction') : null,
    ...(opt('no-technique') ? { noTechnique: true } : {}),
  };
  if (input.direction && !L.directions.some((d) => d.id === input.direction)) { console.error(`No direction with id ${input.direction}. List them with --list directions.`); process.exit(2); }
  if (opt('options')) {
    const n = Math.max(2, Math.min(5, Number(opt('options')) || 3));
    const options = dealOptions(input, n);
    console.log(`# ${n} directions dealt for this brief\n`);
    console.log('Choose the one whose way of composing can best carry an idea from your inventory (SKILL.md steps 1 and 4), not the');
    console.log('most familiar one. Then deal it in full with the same command plus `--direction <id>` (and without --options).\n');
    for (const d of options) {
      console.log(`## \`${d.id}\` — ${d.name}`);
      console.log(`Idea engine: ${d.idea.split(/(?<=\.)\s/).slice(0, 2).join(' ')}`);
      console.log(`Composition: ${d.composition.split(/(?<=\.)\s/).slice(0, 2).join(' ')}`);
      if (d.needsPictures) console.log('Needs: many pictures. Without photographs of its own, each is a real picture of the subject\'s world found with scripts/assets.mjs, or a drawing you make.');
      console.log('');
    }
    process.exit(0);
  }
  sheet = deal(input, 0);
}

mkdirSync(outDir, { recursive: true });
writeFileSync(sheetPath, JSON.stringify(sheet, null, 1));
// a slot redraw keeps the history entry of its sheet, but the scenes and the entrance it builds are the ones the next
// deal must avoid (scenes taken by id, or none, included)
const techniqueOf = (s) => (s.scenes || []).find((x) => x.technique)?.id || null;
// a technique given up (--redraw scenes) stays in the entry, so the next draws still avoid it
if (opt('redraw') && String(opt('redraw')) !== 'direction') patchHist(sheet.at, { scenes: (sheet.scenes || []).map((x) => x.id), technique: techniqueOf(sheet) || hist.find((h) => h.at === sheet.at)?.technique || null, entrance: sheet.entrance?.id || null, replay: sheet.replay?.id || null });
if (!opt('redraw') || String(opt('redraw')) === 'direction') writeHist({ at: sheet.at, direction: sheet.direction.id, type: sheet.type?.id, families: sheet.type ? [...new Set([sheet.type.display.family, sheet.type.text.family])] : [], palette: sheet.palette?.id, ground: sheet.palette?.ground || null, hue: sheet.palette?.hue || null, frame: sheet.frame ? Object.fromEntries(Object.entries(sheet.frame).map(([k, v]) => [k, v.id])) : null, hero: sheet.hero?.id, sector: sheet.input.sector, scenes: (sheet.scenes || []).map((x) => x.id), technique: techniqueOf(sheet), entrance: sheet.entrance?.id || null, replay: sheet.replay?.id || null });
console.log(render(sheet));

// ---------- dealing ----------
// What kind of pictures this build can honestly have. It decides which blueprints are dealt and how the
// sheet tells the agent to fill picture slots.
function imageryMode(input) {
  if (input.have.includes('product-photo') || input.have.includes('photography')) return 'own';
  if (SOFTWARE.includes(input.sector)) return 'interface';
  if (['physical-product', 'ecommerce'].includes(input.sector)) return 'no-product-photo';
  return 'atmosphere';
}
// A software page (its product replay, one scene at most) is decided by what the subject is, not by its
// pictures: a saas page with its own photography is still software.
function isSoftware(input) { return SOFTWARE.includes(input.sector) || (input.have || []).includes('product-ui'); }
function pictureLed(x) { return (x.tags || []).includes('photo-led') || (x.tags || []).includes('object-led'); }
function worksWithoutPictures(x) { return !pictureLed(x) || (x.tags || []).some((t) => ['ui-led', 'type-led', 'colour-field'].includes(t)); }

// The directions that suit this brief and the assets it really has.
function directionPool(input) {
  const has = (need) => input.have.includes(need) || need === 'photography'; // the photo library covers photography
  // a direction of weight 0 stays in the library (and --direction) but is never dealt or offered
  let pool = L.directions.filter((d) => (d.sectors.includes(input.sector) || d.sectors.includes('*')) && !input.avoid.includes(d.id) && (d.weight ?? 1) > 0);
  const feasible = pool.filter((d) => (d.needs || []).every(has));
  if (feasible.length) pool = feasible;
  // directions built on photographs of the subject itself are not dealt when it has none: software shows its own
  // interface, and a product with none is shown by real photographs of its kind in use, which fill its picture slots
  // but never a direction built around a portrait of this one model
  const mode = imageryMode(input);
  if (mode === 'interface' || mode === 'no-product-photo') { const plain = pool.filter((d) => !d.needsPictures); if (plain.length >= 3) pool = plain; }
  // software shows itself large on the first screen: not a direction whose first screen has no picture, or none of whose
  // heroes sets one large (a first screen of type only was dealt to saas pages whose sheet asked for the product large)
  if (isSoftware(input)) { const meets = heroMeets(input); const shown = pool.filter((d) => !firstScreenBare(d) && heroPool(d, input).some((h) => meets(h) && heroShowsLarge(h))); if (shown.length >= 3) pool = shown; }
  // a client named for a light or a pale colour stands on a light ground with bright pictures: not a direction whose
  // grounds are nearly all dark (Hvit lost on navy-black in r6, and r7-p35 put a dark overlay on a house named white)
  if (nameColours(input.brief).lean === 'light') { const lit = pool.filter((d) => !darkDirection(d)); if (lit.length >= 3) pool = lit; }
  if (input.tone) { const toned = pool.filter((d) => (d.tones || []).includes(input.tone)); if (toned.length >= 2) pool = toned; }
  // directions that put whole pages on loud colour are dealt only when the brief asks for a loud tone
  if (!['bold', 'playful'].includes(input.tone)) { const calm = pool.filter((d) => !d.loud); if (calm.length >= 2) pool = calm; }
  if (!pool.length) pool = L.directions.filter((d) => !input.avoid.includes(d.id) && (d.weight ?? 1) > 0);
  return pool;
}
// A direction whose own palettes are nearly all on dark grounds (dark-room).
function darkDirection(d) {
  const pool = L.palettes.filter((p) => (d.palettes || []).includes(p.id) || (p.tags || []).some((t) => (d.paletteTags || []).includes(t)));
  return pool.length > 0 && pool.filter((p) => groundTone(p) === 'dark').length / pool.length > 0.8;
}
// Three directions dealt at random from the pool, for the builder to choose the one that carries its idea.
function dealOptions(input, n) {
  const pool = directionPool(input); const out = [];
  let rest = fresh(pool, recent('direction', Math.min(5, pool.length - n)));
  while (out.length < n && pool.length > out.length) {
    if (!rest.length) rest = pool.filter((d) => !out.includes(d));
    const d = pick(rest); out.push(d); rest = rest.filter((x) => x !== d);
  }
  return out;
}
function deal(input, redraws, sceneExclude = []) {
  const pool = directionPool(input);
  const forced = input.direction ? L.directions.find((d) => d.id === input.direction) : null;
  // weighted: the directions every model already reaches for carry a weight under 1 in the library
  const dir = forced || wpick(fresh(pool, recent('direction', Math.min(5, pool.length - 1))).map((d) => [d, d.weight ?? 1]));
  const s = { version: 1, at: new Date().toISOString(), seed: startSeed, redraws, input, imagery: imageryMode(input), allow: dir.allow || [], direction: dir };
  s.hero = dealHero(dir, input, []);
  // colour first, so a dark ground never gets a hairline text face
  // a colour or a light in the client's name decides the ground from the first deal (SKILL.md step 1)
  s.palette = input.keep.includes('palette') ? null : dealPalette(dir, input, [], nameColours(input.brief).lean);
  s.type = input.keep.includes('type') ? null : dealType(dir, [], input.tone, isDark(s.palette));
  s.photos = dealPhotos(dir, input);
  // signature moves that built the reviewed pages' worst parts (drag rails, a scaling giant name, colour
  // chapters) are not dealt; another move is drawn instead
  const NO_MOTION = new Set(['drag-row', 'scaling-wordmark', 'colour-on-scroll', 'curtain-footer']);
  // the hero's own move most of the time; otherwise any allowed move, so the same few do not repeat
  const wanted = rnd() < 0.4 ? null : [s.hero?.motion, dir.motion].find((id) => id && !NO_MOTION.has(id));
  s.motion = L.motions.find((m) => m.id === wanted) || wpick(L.motions.filter((m) => !NO_MOTION.has(m.id) && !['carried-picture', 'index-preview'].includes(m.id)).map((m) => [m, m.id === 'stillness' ? 0.5 : 1]));
  s.sections = [];
  for (const role of input.sections) {
    const sec = dealSection(dir, role, s.sections.map((x) => x.id), s.sections.at(-1)?.shape, null, input);
    if (sec) s.sections.push(sec); else s.sections.push({ id: null, role, shape: null, name: role, blueprint: null });
  }
  s.references = dealReferences(dir, input);
  // a software page's big moment is its product replaying one task in its own window, not a second scene:
  // the replay takes its section first, and the one scene goes where it neither carries nor touches it. The
  // replay is the signature move, so no other one is dealt
  s.replay = dealReplay(s, []);
  if (s.replay) s.motion = null;
  s.scenes = dealScenes(dir, input, sceneExclude, s.replay ? [s.replay.carries] : []);
  // a forced technique is for the first deal only; a new direction deals at the usual rate
  try { s.scenes = dealTechnique(dir, input, s.scenes, s.replay ? [s.replay.carries] : [], { forced: opt('redraw') ? null : FORCED_TECHNIQUE, exclude: sceneExclude }); } catch (e) { console.error(e.message); process.exit(2); }
  const last = hist[0]?.frame || {};
  s.frame = dealFrame({ rnd, input, imagery: s.imagery, recent: last });
  // pictures that carry the colour are never black-and-white: dealt again until the treatment keeps colour
  s.colourPictures = picturesCarryColour(input);
  if (s.colourPictures && s.frame.treatment.id === 'mono') {
    let t = s.frame.treatment;
    for (let i = 0; i < 60 && t.id === 'mono'; i++) t = dealFrame({ rnd, input, imagery: s.imagery, recent: { ...last, treatment: 'mono' } }).treatment;
    s.frame.treatment = { ...(t.id === 'mono' ? { id: 'natural', text: 'Pictures in natural colour, as shot, with matching light; no filters, no tints, no grain.' } : t), notMono: true };
  }
  // last, because whether an entrance fits depends on the hero, the move and the scenes
  s.entrance = dealEntrance(s, []);
  settleMotion(s);
  return s;
}
// The first screen's entrance (library/entrances.json; the CSS is in assets/base.css). Every model built the same
// one (lines rising out of masks, a clip-path shutter on the picture), so it had become the plainest sign of this
// skill: it is now one of seven, dealt by weight from those that fit the tone and what the first screen shows.
// What the first screen shows: 'type-only' when the direction or the hero puts no picture there, 'interface' when the
// pictures are the product's own interface, otherwise 'photo'.
function heroMode(s) {
  const noPicture = firstScreenBare(s.direction) || s.hero?.picture === false || /\bno (?:image|picture)\b/i.test(s.hero?.blueprint || '');
  return noPicture ? 'type-only' : s.imagery === 'interface' ? 'interface' : 'photo';
}
function entranceFits(s, e, mode = heroMode(s)) {
  // no tone in the brief: the direction's own tones decide, so a quiet direction never gets the bold entrances
  const tones = s.input.tone ? [s.input.tone] : (s.direction.tones || []);
  const blueprint = s.hero?.blueprint || ''; const scenes = s.scenes || [];
  const WINDOW_SCENES = new Set(['thumbnail-becomes-the-stage', 'fly-into-the-shape', 'shaped-window-over-fixed-world']);
  const dealtPhotos = (s.photos?.photos || []).slice(0, 4);
  const meets = {
    // a page whose first screen does not move needs life somewhere else, or the inspector fails it as still
    'page-has-scene-or-moving-picture': () => scenes.length > 0 || (s.frame && s.frame.clip.id !== 'none') || s.motion?.id === 'slow-crossfade' || !!s.replay,
    'photo-in-first-screen': () => mode === 'photo',
    'ui-fragment-in-first-screen': () => mode === 'interface',
    'hero-picture-at-least-half-the-screen': () => mode !== 'type-only' && heroPictureLarge(s.hero),
    // the same trick twice on one page: a window opening on load and again on scroll
    'no-opening-window-move-on-sheet': () => s.motion?.id !== 'opening-window' && !scenes.some((x) => WINDOW_SCENES.has(x.id)) && !/small window|becomes the whole screen/i.test(blueprint),
    'no-scene-on-first-screen': () => !scenes.some((x) => x.carries === 'hero'),
    // heroes set wholly at text size (a specimen wall, a text band) have no display lines to mask or cover
    'display-headline': () => !s.hero?.noHeadline,
    // a black-and-white picture has no colour to bring up, and an img filter would snap at the end
    'no-filter-treatment': () => s.frame?.treatment?.id !== 'mono' && !/grayscale/i.test(s.direction.photoTreatment || ''),
    // on a pale photograph the over-exposed first frame is nearly the photograph and reads as a glitch
    'mid-or-dark-photos-or-dark-page': () => isDark(s.palette) || !dealtPhotos.length || dealtPhotos.filter((ph) => ph.tone !== 'light').length * 2 >= dealtPhotos.length,
  }; // the hero's height and the headline's lines are measured by the inspector on the built page
  return e.fits.imagery.includes(mode) && (!tones.length || e.fits.tones.some((t) => tones.includes(t))) && e.fits.requires.every((r) => (meets[r] || (() => true))());
}
function dealEntrance(s, exclude) {
  if (!L.entrances.length) return null;
  const mode = heroMode(s);
  const TONE_OF = { quiet: 'calm', luxury: 'calm', warm: 'calm', editorial: 'serious', technical: 'serious', bold: 'bold', playful: 'playful' };
  // Stillness promises a page with no load animation: only the entrance where nothing arrives keeps that promise
  if (s.motion?.id === 'stillness' && !exclude.includes('already-there')) { const still = L.entrances.find((e) => e.id === 'already-there'); if (still && entranceFits(s, still, mode)) return { ...still, mode }; }
  let pool = L.entrances.filter((e) => !exclude.includes(e.id) && entranceFits(s, e, mode));
  if (!pool.length) pool = L.entrances.filter((e) => entranceFits(s, e, mode));
  if (!pool.length) pool = L.entrances.filter((e) => e.id === 'already-there'); // nothing moves, so it fits every page
  // One of the same family as either of the last two builds (two mask reveals, two lens changes) is about a third as
  // likely, like the frame's history; and with no tone in the brief, the bold ones are half as likely.
  const familyOf = (id) => L.entrances.find((x) => x.id === id)?.family || id;
  const used = recent('entrance', 2).map(familyOf);
  const e = wpick(pool.map((x) => [x, x.weight * (x.toneWeight?.[TONE_OF[s.input.tone]] ?? 1) * (used.includes(x.family || x.id) ? 0.35 : 1) * (x.energy === 'bold' && !s.input.tone ? 0.5 : 1)]));
  return { ...e, mode };
}
// The masked headline and the shutter are the set-type entrance now: never dealt as the signature move, with set-type
// or without it (set-type already holds both). Aperture never shares a page with the opening window, and Stillness
// (no load animation) only comes with the entrance where nothing arrives.
function settleMotion(s) {
  if (!s.motion || !s.entrance) return;
  const clash = (m) => ['masked-headline', 'shutter-image'].includes(m.id) || (m.id === 'opening-window' && s.entrance.id === 'aperture') || (m.id === 'stillness' && s.entrance.id !== 'already-there');
  if (!clash(s.motion)) return;
  const NOT_DEALT = ['drag-row', 'scaling-wordmark', 'colour-on-scroll', 'curtain-footer', 'carried-picture', 'index-preview'];
  s.motion = wpick(L.motions.filter((m) => !NOT_DEALT.includes(m.id) && !clash(m)).map((m) => [m, m.id === 'stillness' ? 0.5 : 1]));
}
// Why a scene cannot go on this page, or null when it can: never dealt, written for other sectors, a need the brief
// does not meet, a first screen it would take from the product, a closing scene on a software page, or an atmosphere
// scene on a page that is neither loud nor creative. With sector false the sector is not asked (the deal's fallback
// when fewer than two fit it).
function sceneWhyNot(sc, input, sector = true) {
  if (sc.technique) return techniqueWhyNot(sc, input);
  if (NEVER_SCENES.has(sc.id) || (sc.weight ?? 1) <= 0) return 'it is not dealt (references/scenes.md §9 says why)';
  if (sector && !(sc.sectors || ['*']).some((x) => x === '*' || x === input.sector)) return `it is not written for a ${input.sector} page`;
  const unmet = unmetNeeds(sc, input);
  if (unmet.length) return `it needs ${unmet.map((n) => needWhy(n, input)).join(' and ')}`;
  // a client named for a light or a pale colour takes a light ground and bright pictures (imagery.md §6): never a
  // chapter on the ink that ends on a dark photograph (Hvit was dealt line-carries-colour-swap into its intro)
  if (sc.inkChapter && nameColours(input.brief).lean === 'light') return "it puts a chapter on the ink under a dark photograph, and this client's name asks for a light ground and bright pictures";
  // a product with no photographs of its own shows its kind large on the first screen; a scene there shows a place (r6-p31)
  if (imageryMode(input) === 'no-product-photo' && sc.position === 'opening') return "it takes the first screen for a picture of a place, and this page's first screen shows the product large";
  // a software page's first screen shows its own interface large: never an opening scene that carries the first screen
  // without it (r8-p38 was dealt the dither field, which allows no pictures, and had to redraw it away)
  if (isSoftware(input) && sc.position === 'opening' && !(sc.needs || []).some((n) => n.split('|').includes('product-ui'))) return "it takes the first screen, which on a software page shows the product's own interface large";
  // on a software page the product replay is the big moment: a closing scene would end the page on a second one
  if (isSoftware(input) && sc.position === 'closing') return 'a software page ends on its product, not on a closing scene';
  if (!creativePage(input) && ATMOSPHERE.has(sc.id)) return 'it carries one line and no information, which only a loud or creative page can spend';
  return null;
}
// Why a technique cannot go on this page, or null: by its labels, with the scene rules above and two of its own (a
// software page's first screen shows its interface; the energy suits the tone). Its sector is always asked.
function techniqueWhyNot(t, input) {
  if (!TECHNIQUE_TRIGGERS.includes(t.trigger)) return 'it does not run on scroll';
  if (!t.sectors.some((x) => x === '*' || x === input.sector)) return `it is not written for a ${input.sector} page`;
  const unmet = unmetNeeds(t, input);
  if (unmet.length) return `it needs ${unmet.map((n) => needWhy(n, input)).join(' and ')}`;
  if (imageryMode(input) === 'no-product-photo' && t.position === 'opening') return "it takes the first screen, and this page's first screen shows the product large";
  if (isSoftware(input) && t.position === 'closing') return 'a software page ends on its product, not on a closing scene';
  if (isSoftware(input) && t.position === 'opening' && !t.needs.includes('product-ui')) return "it takes the first screen, which on a software page shows the product's own interface large";
  if (t.kind === 'atmosphere' && !creativePage(input)) return 'it carries atmosphere and no information, which only a loud or creative page can spend';
  // loud ones on a loud page (a bold or playful tone, or a creative sector with no tone given); calm ones never on a bold or playful one
  const loud = ['bold', 'playful'].includes(input.tone);
  if (t.energy === 'loud' && !loud && !(!input.tone && creativePage(input))) return input.tone ? `it is loud, and this page is ${input.tone}` : 'it is loud, and this page is not';
  if (t.energy === 'calm' && loud) return `it is calm, and this page is ${input.tone}`;
  return null;
}
function isAtmosphere(sc) { return ATMOSPHERE.has(sc.id) || (sc.technique && sc.kind === 'atmosphere'); }
// The needs of a scene this brief does not meet (see the vocabulary at the top).
function unmetNeeds(sc, input) {
  const mode = imageryMode(input); const have = input.have || [];
  const met = (need) => {
    const [k, v] = need.split(':');
    if (k === 'pictures') return +v <= (SCENE_PICTURE_CAP[mode] ?? Infinity);
    if (k === 'series') return !(mode in SCENE_PICTURE_CAP);
    // a reel of bare names held a dead screen on a cargo bike page (r6-p31): never there or on software
    if (k === 'names') return mode !== 'no-product-photo' && !isSoftware(input) && (have.includes('names') || NAME_SECTORS.includes(input.sector));
    if (k === 'product-ui') return isSoftware(input);
    // only a mark the client has: "no logo yet" or "designs logos" in a brief is none
    if (k === 'mark') return have.includes('mark') || have.includes('logo');
    if (k === 'route') return have.includes('route') || routeInBrief(input.brief);
    // the client's own photographs (a technique's need): a stand-in from the open collections is not its own
    if (k === 'own') return mode === 'own';
    // a document the product makes, named in the brief (a technique's need): not every product makes one
    if (k === 'document') return have.includes('document') || DOCUMENT_WORDS.test(input.brief || '');
    return k === 'photography' || have.includes(k);
  };
  return (sc.needs || []).filter((n) => !n.split('|').some(met));
}
function needWhy(need, input) {
  const cap = SCENE_PICTURE_CAP[imageryMode(input)];
  if (need.startsWith('pictures:')) return `${needWords(need)}, and this page can honestly show about ${cap}`;
  if (need.startsWith('series:')) return `${needWords(need)}, which this page cannot honestly have`;
  if (need.startsWith('names:')) return `${needWords(need)}, which ${imageryMode(input) === 'no-product-photo' || isSoftware(input) ? 'this kind of page does not list' : 'this page does not have (`--have names` when it does)'}`;
  if (need === 'own') return `${needWords(need)}, which the brief does not give (\`--have photography\` or \`product-photo\` when it does)`;
  if (need === 'document') return `${needWords(need)}, which the brief does not name (\`--have document\` when the product makes one)`;
  return `${needWords(need)}, which the brief does not give`;
}
function creativePage(input) { return ['bold', 'playful'].includes(input.tone) || ['agency', 'studio-portfolio', 'personal-portfolio', 'music', 'fashion', 'event', 'culture'].includes(input.sector); }
// How many scenes a page takes: one on a software page (its big moment is the product replay), three on a long, loud page.
function sceneMost(input) {
  const loud = ['bold', 'playful'].includes(input.tone) || (!input.tone && ['agency', 'fashion', 'music', 'event'].includes(input.sector));
  return isSoftware(input) ? 1 : input.sections.length + 1 >= 8 && loud ? 3 : 2;
}
// The page's big scroll moments (references/scenes.md): two tested scenes from different families, each
// placed on a section of the argument it can carry; three only on a long, loud page (eight sections or
// more, with a bold or playful tone, or a loud sector when no tone is given); one on a software page, whose
// big moment is the product replay. A page with scenes keeps its length budget (about 12-16 screens at
// 1440), so the scenes hold about six screens in all.
// reserved: sections a scene may neither carry nor touch (the product replay's)
// chosen: ids the builder takes (--redraw scenes=<id>,<id>), placed in that order; one that does not fit or
// cannot be placed throws, with the reason
function dealScenes(dir, input, exclude, reserved = [], chosen = null) {
  if (!L.scenes.length) { if (chosen) throw new Error('There is no scene library.'); return []; }
  const BUDGET = 6.5; // screens of hold for all the page's scenes together
  const LONG = 3;     // a scene over this is the page's one long scene, and never carries the work
  const creative = creativePage(input);
  // A scene of weight 0 (scenes.json) stays in the library but is never dealt; a software page with nothing that
  // fits gets no scene at all.
  // (whether the sector is asked is decided before the exclusions: a redraw that has used up a sector's scenes deals
  // a technique or prints the list, never scenes written for other sectors)
  let sectorAsked = true;
  let pool = L.scenes.filter((sc) => !sceneWhyNot(sc, input));
  if (pool.length < 2) { sectorAsked = false; pool = L.scenes.filter((sc) => !sceneWhyNot(sc, input, false)); }
  pool = pool.filter((sc) => !exclude.includes(sc.id));
  const most = sceneMost(input);
  if (chosen) {
    if (!chosen.length) throw new Error('Name a scene: --redraw scenes=<id>, scenes=<id>,<id> or scenes=none.');
    if (new Set(chosen).size !== chosen.length) throw new Error('The same scene is named twice.');
    if (chosen.length > most) throw new Error(`This page takes ${['', 'one scene', 'two scenes', 'three scenes'][most]} at most${most === 1 ? ': on a software page the product replay is the big moment' : ''}.`);
    for (const id of chosen) {
      const sc = sceneById(id);
      if (!sc) throw new Error(`No scene with id ${id}. \`node draw.mjs --list scenes\` lists them all; once scenes have been redrawn twice, \`--redraw scenes\` lists the ones that fit this page.`);
      const why = sceneWhyNot(sc, input, sectorAsked);
      if (why) throw new Error(`${id} does not fit this page: ${why}. Once scenes have been redrawn twice, \`--redraw scenes\` lists the ones that fit; \`--redraw scenes=none\` builds the page without one.`);
    }
  }
  if (!pool.length && !chosen) return []; // chosen ones are checked above (a technique may go where no scene fits)
  const roles = ['hero', ...input.sections];
  const n = Math.min(pool.length, most);
  const recentIds = hist.slice(0, 4).flatMap((h) => h.scenes || []);
  // Each scene is placed as it is picked, on a section of the argument it can carry, with a quiet section
  // between it and every other scene; a scene with no such section is not dealt. Closing scenes take their
  // latest section, the others their own first choice. At most one scene over three screens, about six
  // screens in all; a scene that carries the work holds three screens at most, so the work itself is on
  // screen by the fourth or fifth screen and not after a long ride. The one exception is the fly-through in
  // stop mode, where each piece stops flat and large: it may hold longer and is then the page's long scene.
  const out = []; const families = new Set(); const taken = new Set();
  const reset = () => { out.length = 0; families.clear(); taken.clear(); for (const r of reserved) { const i = roles.indexOf(r); if (i >= 0) taken.add(i); } };
  reset();
  const holdOf = (sc) => sc.hold || 2;
  // a scene earns about one screen per beat: two screens of hold on most pages, three on a loud or creative one
  const cap = creative ? 3 : 2;
  // a closing scene of type holds about one screen (its own hold, never more than a screen a line): the line has been read
  const CLOSING = new Set(['cta', 'contact', 'footer']);
  const stops = (sc, r) => r === 'work' && sc.id === 'depth-card-flythrough' && !!sc.byRole?.work;
  // the fly-through in stop mode is budgeted for the most pieces it takes (six: 0.7 a piece plus 0.3)
  const holdAt = (sc, r) => (stops(sc, r) ? 0.7 * 6 + 0.3 : Math.min(holdOf(sc), cap, CLOSING.has(r) ? sc.lines ?? Infinity : Infinity));
  const free = (r) => { const i = roles.indexOf(r); return i >= 0 && !taken.has(i) && !taken.has(i - 1) && !taken.has(i + 1); };
  const place = (sc) => {
    if (sc.position === 'opening') return free('hero') ? 'hero' : null;
    const ok = (sc.roles || []).filter((r) => r !== 'hero' && free(r) && !(r === 'work' && holdOf(sc) > LONG && !stops(sc, r)));
    if (!ok.length) return null;
    return sc.position === 'closing' ? ok.sort((a, b) => roles.indexOf(b) - roles.indexOf(a))[0] : ok[0];
  };
  const held = () => out.reduce((s, x) => s + x.hold, 0);
  // the photographs a page can honestly show are counted for its scenes together, not for each alone
  const pictureCap = SCENE_PICTURE_CAP[imageryMode(input)];
  const whyNotPlaced = (sc) => {
    if (out.some((o) => o.id === sc.id)) return 'it is already on the page';
    const kin = out.find((o) => o.family === sc.family); if (kin) return `it is of one family with ${kin.id} (${sc.family}); take two families`;
    if (isAtmosphere(sc) && out.some(isAtmosphere)) return 'a page takes one atmosphere scene at most';
    if (sc.technique && out.some((o) => o.technique)) return 'a page takes one technique at most';
    const pictures = out.reduce((t, o) => t + scenePictures(o), 0) + scenePictures(sc);
    if (pictureCap !== undefined && out.length && pictures > pictureCap) return `together the scenes would need ${pictures} photographs, and this page can honestly show about ${pictureCap}`;
    const role = place(sc);
    if (!role) return sc.position === 'opening' ? 'the first screen, or the section after it, is taken' : `none of the sections it can carry (${(sc.roles || []).filter((r) => r !== 'hero').join(', ')}) is on this page and clear of the replay and the other scenes, with a section between`;
    // the budget counts a scene at its default hold (a capped hold is a promise the builder may not keep),
    // the fly-through in stop mode at the hold its pieces need
    const h = holdAt(sc, role);
    if (h > LONG && out.some((o) => o.hold > LONG)) return 'the page already has its one long scene';
    if (held() + (stops(sc, role) ? h : holdOf(sc)) > BUDGET) return 'together the scenes would hold more than about six screens';
    return null;
  };
  const allowed = (sc) => !whyNotPlaced(sc);
  const add = (sc) => { const role = place(sc); taken.add(roles.indexOf(role)); families.add(sc.family); out.push({ ...sc, carries: role, hold: holdAt(sc, role), defaultHold: holdOf(sc) }); };
  if (chosen) {
    // where each one lands depends on the order they are placed in: try every order (six at most) before refusing
    const orders = (xs) => (xs.length < 2 ? [xs] : xs.flatMap((x, i) => orders([...xs.slice(0, i), ...xs.slice(i + 1)]).map((rest) => [x, ...rest])));
    let first = null;
    for (const order of orders(chosen)) {
      reset(); let why = null;
      for (const id of order) { const sc = sceneById(id); const w = whyNotPlaced(sc); if (w) { why = `${id} cannot be placed on this page: ${w}`; break; } add(sc); }
      if (!why) return out.sort((a, b) => roles.indexOf(a.carries) - roles.indexOf(b.carries));
      first ||= why;
    }
    throw new Error(chosen.length > 1 ? `These scenes do not go on this page together, in any order (${first}).` : `${first}.`);
  }
  // a page short of pictures takes the scenes that need no photograph or one first (fewPictures, at the top)
  const tiers = fewPictures(input) ? [pool.filter(lightScene), pool] : [pool];
  while (out.length < n) {
    let cands = [];
    for (const tier of tiers) { cands = fresh(tier, recentIds).filter(allowed); if (!cands.length) cands = tier.filter(allowed); if (cands.length) break; }
    if (!cands.length) break;
    // a scene's weight (scenes.json, default 1) lowers the odds of the ones pages across models already
    // repeat, so the deal spreads over the whole library instead of the same few set pieces
    add(wpick(cands.map((c) => [c, c.weight ?? 1])));
  }
  return out.sort((a, b) => roles.indexOf(a.carries) - roles.indexOf(b.carries));
}
// About one page in two (TECHNIQUE_RATE), one researched technique takes the place of one dealt scene (or the one slot
// of a page dealt none). It is picked by its labels (techniqueWhyNot: sector, needs, position, energy), weighted by
// score, avoiding the techniques of the last few draws, and placed by the scene rules (a free section for its position
// clear of the replay and the other scenes, another family, the picture cap, the hold budget, one long scene).
// forced: an id that must go on (--technique); it throws with the reason when it cannot. exclude: ids not to deal.
function dealTechnique(dir, input, scenes, reserved, { forced = null, exclude = [], always = false } = {}) {
  if (!L.techniques.length || input.noTechnique) return scenes;
  // A page short of pictures takes only those that need no photograph or one, and always one when no tested scene of
  // that kind could be dealt (none, or one that wants several photographs), in place of the hungriest first: it never
  // ends with no scene, or a scene it cannot fill, for want of photographs.
  const few = fewPictures(input);
  const hungry = few && (!scenes.length || scenes.some((x) => !lightScene(x)));
  if (!forced && !hungry && !always && rnd() >= TECHNIQUE_RATE) return scenes;
  const ids = scenes.map((x) => x.id);
  let why = null;
  const placed = (t) => {
    // in place of each dealt scene in turn, in random order (on a page short of pictures, the hungry ones first)
    const order = ids.length ? shuffle(ids.map((_, k) => k)) : [-1];
    if (few) order.sort((a, b) => (a < 0 || b < 0 ? 0 : scenePictures(scenes[b]) - scenePictures(scenes[a])));
    for (const i of order) {
      try { const out = dealScenes(dir, input, [], reserved, [...ids.filter((_, k) => k !== i), t.id]); if (out.some((x) => x.id === t.id)) return out; } catch (e) { why = e.message; }
    }
    // on a page short of pictures, alone, keeping only the dealt scenes that need no photograph or one beside it
    if (few && ids.length) {
      const light = scenes.filter(lightScene).map((x) => x.id);
      for (const keep of [light, []]) { if (keep.length === ids.length) continue; try { const out = dealScenes(dir, input, [], reserved, [...keep, t.id]); if (out.some((x) => x.id === t.id)) return out; } catch (e) { why = e.message; } }
    }
    return null;
  };
  if (forced) {
    const t = L.techniques.find((x) => x.id === forced);
    const built = L.scenes.find((sc) => sc.source === forced);
    if (!t) throw new Error(built ? `${forced} is now the tested scene ${built.id}: deal without --technique, then take it with \`--redraw scenes=${built.id}\`.` : `No technique with id ${forced}. \`node draw.mjs --list techniques\` lists them.`);
    const unfit = techniqueWhyNot(t, input);
    if (unfit) throw new Error(`${forced} does not fit this page: ${unfit}.`);
    // in place of one dealt scene, else alone: the scene it would sit beside may clash with it
    let out = placed(t);
    if (!out) { try { out = dealScenes(dir, input, [], reserved, [t.id]); } catch (e) { why = e.message; } }
    if (!out) throw new Error(why || `${forced} cannot go on this page.`);
    return out;
  }
  const recentIds = hist.slice(0, TECHNIQUE_RECENT).map((h) => h.technique).filter(Boolean);
  let fits = L.techniques.filter((t) => !exclude.includes(t.id) && !techniqueWhyNot(t, input));
  if (few) fits = fits.filter(lightScene);
  // the ones of recent draws only when none of the others can be placed
  const tried = new Set();
  for (const first of [fresh(fits, recentIds), fits]) {
    let pool = first.filter((x) => !tried.has(x));
    while (pool.length) {
      // score 7, 8, 9 weigh 1, 2, 3; one written for every sector at half, so the few that fit every page do not take most deals
      const t = wpick(pool.map((x) => [x, Math.max(1, x.score - 6) * (x.sectors.includes('*') ? 0.5 : 1)]));
      tried.add(t);
      const out = placed(t);
      if (out) return out;
      pool = pool.filter((x) => x !== t);
    }
  }
  return scenes;
}
// After two scene redraws, a choice instead of a third: every scene that fits this page and has a section to carry,
// one line each with what it needs, and the two ways out (one by id, or none).
// why: 'cap' after two redraws; 'none-new' when no scene that has not been dealt on this sheet fits
function sceneChoices(dir, s, why = 'cap') {
  const reserved = s.replay ? [s.replay.carries] : [];
  const now = (s.scenes || []).map((x) => x.id); const before = s.scenesTried || [];
  const few = fewPictures(s.input);
  const fit = [];
  for (const sc of L.scenes) { try { const [d] = dealScenes(dir, s.input, [], reserved, [sc.id]); if (d) fit.push(d); } catch { /* does not fit */ } }
  const lightTechniques = few || !fit.length ? fittingTechniques(dir, s).filter(lightScene).slice(0, 5) : [];
  const most = sceneMost(s.input);
  const o = why === 'none-new' ? ['# Scroll scenes: nothing new fits, so a choice', ''] : ['# Scroll scenes: redrawn twice, so now a choice', ''];
  o.push(why === 'none-new' ? 'Every scene that fits this page, and every technique that would, has been dealt on this sheet already, so a redraw would only deal one again. This one did not count.' : 'Scenes are redrawn at most twice: a page with one honest scene, or none, beats a fifth redraw.', '');
  if (!fit.length && !lightTechniques.length) {
    o.push('No scene in the library fits this page. Build it without one: `node draw.mjs --redraw scenes=none`, and say so in your report.');
    return o.join('\n');
  }
  // two that fit alone may still clash (one family, one section, the photographs between them): each line names the
  // ones it goes with
  const partners = new Map(fit.map((d) => [d.id, []]));
  if (most > 1) for (let i = 0; i < fit.length; i++) for (let j = i + 1; j < fit.length; j++) { try { dealScenes(dir, s.input, [], reserved, [fit[i].id, fit[j].id]); partners.get(fit[i].id).push(fit[j].id); partners.get(fit[j].id).push(fit[i].id); } catch { /* not together */ } }
  const pairs = [...partners.values()].some((x) => x.length);
  const goes = (d) => (most < 2 ? '' : partners.get(d.id).length ? ` Goes with ${partners.get(d.id).map((x) => `\`${x}\``).join(', ')}.` : ' Goes with none of the others.');
  const sceneLine = (d) => `- \`${d.id}\` — ${d.name} (${d.family}). Needs: ${sceneNeedsWords(d)}. Carries ${d.carries === 'hero' ? 'the first screen' : `the ${d.carries} section`}, hold ${d.hold}.${goes(d)}${now.includes(d.id) ? ' On the sheet now.' : before.includes(d.id) ? ' Dealt before.' : ''}`;
  const techLine = (d) => `- \`${d.id}\` — ${d.name} (${d.family}), a researched technique to build fresh. ${String(d.principle || '').split(/(?<=\.)\s/)[0]} Needs: ${sceneNeedsWords(d)}. Carries ${d.carries === 'hero' ? 'the first screen' : `the ${d.carries} section`}, hold ${d.hold}.${now.includes(d.id) ? ' On the sheet now.' : before.includes(d.id) ? ' Dealt before.' : ''}`;
  const TECH = 'A technique has no files and no demo: you build it on the shared stage (references/scenes.md §8) and check it like any scene.';
  if (few) {
    // a page short of pictures of its own subject: the ones that need no photograph or one first, tested or not
    const lightFit = fit.filter(lightScene), heavy = fit.filter((d) => !lightScene(d));
    if (lightFit.length || lightTechniques.length) {
      o.push('This page is short of pictures of its own subject. These need no photograph or one and still fit it (its sector, what the brief really has, a section free to carry them); take one of them first. Its one picture may be a photograph the page already shows, at another crop.', '');
      for (const d of lightFit) o.push(sceneLine(d));
      for (const d of lightTechniques) o.push(techLine(d));
      if (lightTechniques.length) o.push('', TECH);
    }
    if (heavy.length) { o.push('', `${lightFit.length || lightTechniques.length ? 'These fit too, but need more photographs than this page is likely to find:' : 'These still fit this page (its sector, what the brief really has, a section free to carry them):'}`, ''); for (const d of heavy) o.push(sceneLine(d)); }
  } else {
    if (fit.length) { o.push('These still fit this page (its sector, what the brief really has, a section free to carry them):', ''); for (const d of fit) o.push(sceneLine(d)); }
    if (lightTechniques.length) { o.push('', 'No tested scene fits, but a researched technique that needs no photograph or one does:', ''); for (const d of lightTechniques) o.push(techLine(d)); o.push('', TECH); }
  }
  const light = fit.some(lightScene) || lightTechniques.length > 0;
  o.push('', 'Two ways out; say which in your report:');
  o.push(`- Take ${pairs ? 'one, or two that go together,' : 'one'} you can fill honestly: \`node draw.mjs --redraw scenes=<id>\`${pairs ? ', or `--redraw scenes=<id>,<id>`' : ''}.`);
  o.push(`- Build without a scene: \`node draw.mjs --redraw scenes=none\`${light ? ', only when not even one that needs no photograph or one can be filled' : ''}. The page's motion then comes from the entrance, the replay or moving pictures, and its length budget drops.`);
  return o.join('\n');
}
// The researched techniques that fit this page and find a section to carry, alone.
function fittingTechniques(dir, s) {
  const reserved = s.replay ? [s.replay.carries] : [];
  const out = [];
  for (const t of L.techniques) { try { const [d] = dealScenes(dir, s.input, [], reserved, [t.id]); if (d) out.push(d); } catch { /* does not fit */ } }
  return out.sort((a, b) => (b.score || 0) - (a.score || 0));
}
// The scenes, then the techniques, that need no photograph or one and still fit this page: printed under a page built
// without a scene, since none should be the way out only when not even these can be filled.
function lightOptions(dir, s) {
  const reserved = s.replay ? [s.replay.carries] : [];
  const scenes = [];
  for (const sc of L.scenes.filter(lightScene)) { try { const [d] = dealScenes(dir, s.input, [], reserved, [sc.id]); if (d) scenes.push(d.id); } catch { /* does not fit */ } }
  return [...scenes, ...fittingTechniques(dir, s).filter(lightScene).map((d) => d.id)].slice(0, 6);
}
// The product replay (library/replays.json, built with assets/replay.js): on a software page the product's
// own window, large, acts out what the product does for the visitor. The best software sites (Linear, Stripe,
// Vercel, Attio) make that their big moment, held while the visitor's scroll steps its beats. Dealt by weight
// from the patterns that fit the sector or the brief, a pattern of either of the last two builds about a third
// as likely.
function dealReplay(s, exclude = []) {
  if (!isSoftware(s.input) || !L.replays.length) return null;
  const brief = s.input.brief || '';
  const recentIds = recent('replay', 2);
  const weight = (r) => {
    const byBrief = !!r.brief && new RegExp(r.brief, 'i').test(brief);
    const bySector = r.sectors.includes('*') || r.sectors.includes(s.input.sector);
    const base = r.weightBy?.[s.input.sector] ?? r.weight;
    const w = byBrief ? r.briefWeight ?? base * 2 : base;
    return (bySector || byBrief) && !exclude.includes(r.id) ? w * (recentIds.includes(r.id) ? 0.35 : 1) : 0;
  };
  const pool = L.replays.map((r) => [r, weight(r)]).filter(([, w]) => w > 0);
  if (!pool.length) return null;
  return placeReplay(s, wpick(pool));
}
// The section it plays in: never the hero (the hero's fragment is the entrance's), never a section a scene
// carries or touches. Its own preferred sections first, then the usual places for the product.
function placeReplay(s, r) {
  const roles = ['hero', ...s.input.sections];
  const near = new Set();
  for (const sc of s.scenes || []) { const i = roles.indexOf(sc.carries); near.add(i); near.add(i - 1); near.add(i + 1); }
  const order = [...(r.roles || []), 'showcase', 'how-it-works', 'features', 'intro'];
  const free = (role) => role !== 'hero' && roles.includes(role) && !near.has(roles.indexOf(role));
  const carried = (role) => (s.scenes || []).some((sc) => sc.carries === role);
  const carries = order.find(free) || order.find((x) => x !== 'hero' && roles.includes(x) && !carried(x)) || s.input.sections.find((x) => !['footer', 'cta', 'faq', 'pricing'].includes(x) && !carried(x)) || null;
  return carries ? { id: r.id, name: r.name, sees: r.sees, beats: r.beats, action: r.action, phone: r.phone, carries } : null;
}
// The heroes this direction can deal on this brief, before the deal picks one.
function heroPool(dir, input) {
  // the direction's own list, and any hero written for this direction since (the October 2026 study added some)
  // banned heroes (pictures in the letters, folder tabs) are never dealt; saturated first screens only for a loud tone
  const loudOk = ['bold', 'playful'].includes(input.tone);
  const allowed = (h) => !h.banned && (loudOk || !h.loud);
  let pool = L.heroes.filter((h) => allowed(h) && ((dir.heroes || []).includes(h.id) || (h.directions || []).includes(dir.id)));
  if (!pool.length) pool = L.heroes.filter(allowed);
  if (imageryMode(input) !== 'interface' && !input.have.includes('product-ui')) { const plain = pool.filter((h) => !softwareOnly(h)); if (plain.length) pool = plain; }
  // a product with no photographs of its own is shown large on the first screen, or the first screen is type and it
  // comes large right after: never a strip on three columns, two small doors or a small figure under open sky (r6-p31)
  const meets = heroMeets(input);
  // (a direction with none such keeps its other heroes but the sky-led ones, and the product comes right after them)
  if (imageryMode(input) === 'no-product-photo') {
    const shown = pool.filter((h) => meets(h) && (heroNoPicture(h) || heroShowsLarge(h)));
    const noSky = pool.filter((h) => meets(h) && !heroSkyLed(h));
    if (shown.length) pool = shown; else if (noSky.length) pool = noSky;
  }
  // software shows its own interface large on the first screen, at a size a visitor can read (SKILL.md step 6), so only
  // the heroes that set their picture large: never type alone, a small frame or a subject under open sky. The sheet's
  // imagery section asked for the product large over a first screen of type in round 6. directionPool keeps the
  // directions with none such away from software; one taken by --direction keeps its heroes and the sheet says so
  if (isSoftware(input)) { const shown = pool.filter((h) => meets(h) && heroShowsLarge(h)); if (shown.length) pool = shown; }
  // pictures that carry the colour are never turned grey by the hero's own blueprint
  if (picturesCarryColour(input)) { const coloured = pool.filter((h) => !/gr[ae]yscale/i.test(h.blueprint || '')); if (coloured.length) pool = coloured; }
  // a client named for a light or a pale colour gets no hero that sits in the dark or darkens its picture for white
  // type (Hvit was dealt two prints in darkness and a darkened open sky beside its bright line)
  if (nameColours(input.brief).lean === 'light') { const lit = pool.filter((h) => !/low-key|near-black|in the dark(?! ink)|darken|brightness\(0\.|All type is white/i.test(h.blueprint || '')); if (lit.length) pool = lit; }
  return pool;
}
function heroMeets(input) { return (h) => (h.needs || []).every((n) => n === 'photography' || input.have.includes(n)); }
function dealHero(dir, input, exclude) {
  const pool = heroPool(dir, input); const meets = heroMeets(input);
  const ok = pool.filter((h) => !exclude.includes(h.id) && meets(h));
  return pick(fresh(ok.length ? ok : pool.filter((h) => !exclude.includes(h.id)).length ? pool.filter((h) => !exclude.includes(h.id)) : pool, recent('hero', 3)));
}
// The first screen's picture: none, small or large (SMALL_PICTURE and SMALL_PICTURE_HEROES at the top).
function heroNoPicture(h) {
  const b = h?.blueprint || '';
  return h?.picture === false || /\bno (?:image|picture)\b/i.test(b) || !/photo|picture|image|film|footage|video|render|product|object|cut-out/i.test(b);
}
function heroPictureLarge(h) {
  if (!h || heroNoPicture(h) || SMALL_PICTURE_HEROES.has(h.id)) return false;
  // the picture and its size in one sentence: "a flat field of one soft colour fills the viewport" is not a picture
  const big = (h.blueprint || '').split(/(?<=\.)\s/).some((x) => /photo|picture|image|film|footage|video/i.test(x) && /full-bleed|100vw|100svh|fills/i.test(x));
  return !SMALL_PICTURE.has(h.archetype) || big;
}
// The size a fluid step reaches at a width, in px: lib/type-deal.mjs writes clamp(<a>rem, <b>rem + <c>vw, <d>rem).
function stepAt(v, width) {
  const m = String(v || '').match(/clamp\(\s*([\d.]+)rem,\s*(-?[\d.]+)rem\s*\+\s*([\d.]+)vw,\s*([\d.]+)rem\s*\)/);
  if (!m) return null;
  const [a, b, c, d] = m.slice(1).map(Number);
  return Math.min(Math.max(a * 16, b * 16 + (c * width) / 100), d * 16);
}
// The display step of a split hero: the same floor for phones, about 76px at 1440, up to 88px or the step's own top.
function splitDisplay(v) {
  const m = String(v || '').match(/clamp\(\s*([\d.]+)rem,.*?,\s*([\d.]+)rem\s*\)/);
  return m ? `clamp(${m[1]}rem, 0.600rem + 4.60vw, ${Math.max(+m[2], 5.5).toFixed(3)}rem)` : v;
}
// a hero chosen for its open sky sets the subject low and small under it
function heroSkyLed(h) { return /\b(?:sky|horizon)\b/i.test(h?.blueprint || ''); }
// a first screen whose picture shows the product large enough to see: large, and not a small subject under open sky
function heroShowsLarge(h) { return heroPictureLarge(h) && !heroSkyLed(h); }
// a direction whose own first screen has no picture, whatever hero it deals
function firstScreenBare(d) { return d.photos === false || /first screen has no picture/i.test(d.imagery || ''); }
// Type is dealt from the font collection (library/fonts.json): the kind of pairing, the faces, weights,
// case and a six-step scale, avoiding the faces of recent builds. The direction leans the deal, never fixes it.
function isDark(p) { return groundTone(p) === 'dark'; }
// dark, light (white, off-white, stone, a pale tint) or mid (a coloured field)
function groundTone(p) { if (!p?.bg || !/^#[0-9a-f]{6}$/i.test(p.bg)) return 'mid'; const n = parseInt(p.bg.slice(1), 16); const y = (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255; return y < 0.35 ? 'dark' : y >= 0.8 ? 'light' : 'mid'; }
function dealType(dir, exclude, tone, dark = false) {
  const recentFamilies = hist.slice(0, 6).flatMap((h) => h.families || []);
  const without = exclude.filter(Boolean).flatMap((id) => L.fonts.filter((f) => String(id).includes(f.family.toLowerCase().replace(/\s+/g, '-'))).map((f) => f.family));
  return dealTypeSystem({ rnd, fonts: L.fonts, tone: tone || null, dirClasses: dir.typeClasses || [], recentFamilies, exclude: without, dark });
}
// Colour: about half the time a restrained palette generated for this page (one ground, one ink, one
// accent), otherwise a studied palette from the library. Loud, many-field palettes are dealt only for a
// bold or playful tone: on other pages they made the site look like a sweet shop.
function LOUD(p) { return (p.tags || []).some((t) => ['flat-loud', 'pastel-fields'].includes(t)) || (p.fields || []).length >= 3; }
function dealPalette(dir, input, exclude, lean = null) {
  // a redraw for a client whose name names a light or a dark colour (Hvit, Ember) keeps to that ground
  if (lean) {
    let p = null; const tried = [...exclude];
    for (let i = 0; i < 16; i++) { p = dealPalette(dir, input, tried); if (groundTone(p) === lean) return p; tried.push(p?.id); }
    return p;
  }
  const loudOk = ['bold', 'playful'].includes(input.tone);
  const recentGrounds = hist.slice(0, 4).map((h) => h.ground).filter(Boolean);
  if (rnd() < 0.55) return dealPaletteV25({ rnd, tone: input.tone, recent: [...recentGrounds, ...hist.slice(0, 3).map((h) => h.hue).filter(Boolean)] });
  let pool = L.palettes.filter((p) => (dir.palettes || []).includes(p.id) || (p.tags || []).some((t) => (dir.paletteTags || []).includes(t)));
  if (!pool.length) pool = L.palettes;
  if (!loudOk) { const calm = pool.filter((p) => !LOUD(p)); pool = calm.length >= 2 ? calm : L.palettes.filter((p) => !LOUD(p)); }
  const p = pool.filter((x) => !exclude.includes(x.id));
  return pick(fresh(p.length ? p : pool, recent('palette', Math.min(6, pool.length - 1))));
}
function dealPhotos(dir, input) {
  if (dir.photos === false) return null; // image-free directions
  const words = briefWords(input.brief);
  const mode = imageryMode(input);
  const SOFT_SETS = ['architecture', 'fog-and-quiet', 'sky-and-space', 'texture', 'water'];
  // where colour is expected, a photograph whose file is black-and-white is never dealt (references/imagery.md §6),
  // and a set is counted by its photographs in colour
  const colour = !!picturesCarryColour(input);
  const usable = (set) => (colour ? set.photos.filter((ph) => !ph.mono) : set.photos);
  // subject first (sector + words of the brief), then the direction's preferred tone
  const scored = Object.entries(L.photos.sets).map(([id, set]) => {
    let score = (set.sectors || []).includes(input.sector) ? 3 : 0;
    if ((set.primary || []).includes(input.sector)) score += 5;
    // the dealt set carries the hero and the atmosphere, where a stock room or table would pass for this very house:
    // for places to stay it is the surroundings. Each room is shown beside its facts with a photograph of its kind,
    // found in the open collections (the imagery section's "shown, not boxed" line)
    if (mode === 'atmosphere' && ['hospitality', 'real-estate'].includes(input.sector) && id === 'interior-and-table') score -= 6;
    score += words.filter((w) => (set.keywords || []).some((k) => k === w || (k.length >= 5 && w.startsWith(k)) || (w.length >= 5 && k.startsWith(w)))).length * 4;
    score += set.photos.filter((ph) => words.some((w) => ph.alt.toLowerCase().includes(w))).length;
    if (dir.photoTone) score += set.photos.filter((ph) => ph.tone === dir.photoTone).length / set.photos.length;
    // a client named for a light or a pale colour leans to the sets with the most bright photographs
    if (nameColours(input.brief).lean === 'light') score += (2 * set.photos.filter((ph) => ph.tone === 'light').length) / set.photos.length - (2 * set.photos.filter((ph) => ph.tone === 'dark').length) / set.photos.length;
    return { id, set, score };
  }).filter((x) => x.score > 0 && usable(x.set).length >= 5 && (mode !== 'interface' || SOFT_SETS.includes(x.id))).sort((a, b) => b.score - a.score);
  if (!scored.length) return null;
  // one set, so the photographs share a subject and a light; choose among the best-fitting few
  const top = scored.filter((x) => x.score >= scored[0].score * 0.6).slice(0, 4);
  const chosen = pick(top);
  // a page whose pictures carry the colour is dealt no black-and-white photographs, however few are left
  let pool = usable(chosen.set);
  if (dir.photoTone) { const toned = pool.filter((ph) => ph.tone === dir.photoTone || ph.tone === 'mid'); if (toned.length >= 6) pool = toned; }
  // a client named for a light or a pale colour (Hvit, Snow, Linen) gets bright pictures, whatever the direction's tone
  const bright = nameColours(input.brief).lean === 'light';
  if (bright) { const b = pool.filter((ph) => ph.tone !== 'dark'); if (b.length >= 6) pool = b; }
  // A picture that matches the brief comes first. Without product photographs, a picture of the same kind of
  // thing is what shows the visitor what the product is (r5-p28 lost a cargo-bike page that never showed a
  // bike): one that matches is marked, so if it shows the kind it is shown in use and never claimed as this model.
  // (on a product page with no photographs, only a picture naming the product's own kind is marked: "front" in
  // "front-box" marked a woman holding a sparkler "in front of her")
  const kind = mode === 'no-product-photo' ? briefSubject(input).map((w) => w.toLowerCase().replace(/(?:es|s)$/, '')).filter((w) => w.length >= 3) : [];
  const things = kind.length ? kind : words.filter((w) => w.length >= 5);
  const matches = (ph) => things.some((w) => new RegExp(`\\b${w.replace(/[^\p{L}\p{N}]/gu, '')}`, 'iu').test(ph.alt));
  const rank = (ph) => ph.quality + (matches(ph) ? 2 : 0) + (bright && ph.tone === 'light' ? 1 : 0);
  const ranked = shuffle(pool).sort((a, b) => rank(b) - rank(a))
    .map((ph) => (mode === 'no-product-photo' && matches(ph) ? { ...ph, sameKind: true } : ph));
  return { set: chosen.id, title: chosen.set.title, note: chosen.set.note, treatment: dir.photoTreatment || null, others: scored.filter((x) => x.id !== chosen.id).slice(0, 4).map((x) => x.id), photos: ranked.slice(0, mode === 'interface' ? 4 : 8) };
}
function briefStop() {
  return new Set(['with', 'that', 'this', 'from', 'page', 'site', 'website', 'landing', 'their', 'they', 'have', 'will', 'your', 'about', 'into', 'make', 'build', 'create', 'design', 'small', 'based', 'called', 'named', 'which', 'where', 'what', 'need', 'want', 'like', 'also', 'some', 'very', 'more', 'most', 'just', 'than', 'then', 'them', 'and', 'the', 'for', 'one', 'hand', 'handmade', 'made', 'batch', 'ship', 'ships', 'week', 'within', 'across', 'euro', 'euros', 'cost', 'price', 'open', 'only', 'each', 'every', 'there', 'images', 'photos', 'photograph', 'static', 'html']);
}
// The words of the brief, the client's name among them, that name a colour, a material or a light. One in the
// client's name decides the ground (SKILL.md step 1): a guesthouse named Hvit, "white", lost a blind test on a
// navy-black ground. Elsewhere in the brief a word may name what the client replaces or works on ("invoicing
// that replaces paper"), so there it only lends the palette its colours.
function briefColours(brief, inName = false) {
  const LIGHT = ['white', 'snow', 'chalk', 'linen', 'paper', 'salt', 'milk', 'bone', 'ivory', 'pearl', 'fog', 'foggy', 'mist', 'haze', 'frost', 'ice', 'cotton', 'porcelain', 'birch', 'hvit', 'hvid', 'hvít', 'vit', 'weiss', 'weiß', 'blanc', 'blanche', 'blanco', 'blanca', 'bianco', 'bianca', 'branco', 'branca',
    // snow and light in other languages ("Snø" was dealt a dark room, "Lys" a black ground); never "lin", a surname
    'snø', 'sne', 'snö', 'schnee', 'neige', 'neve', 'nieve', 'lumi', 'kreide', 'craie', 'alabaster'];
  // light itself counts only as a name, capitalised ("Lys, a guesthouse"): "light-filled rooms" or "a light lunch" in a
  // brief names no ground
  const LIGHT_NAMES = ['light', 'lys', 'ljus', 'licht', 'lumen', 'lux', 'luz', 'luce'];
  const lit = inName ? [...new Set((String(brief || '').match(/\p{Lu}\p{Ll}+/gu) || []).map((w) => w.toLowerCase()).filter((w) => LIGHT_NAMES.includes(w)))] : [];
  const DARK =['black', 'night', 'midnight', 'coal', 'charcoal', 'soot', 'ink', 'obsidian', 'ebony', 'raven', 'onyx', 'ember', 'slate', 'iron', 'basalt', 'peat', 'svart', 'schwarz', 'noir', 'noire', 'nero', 'nera', 'zwart', 'preto', 'preta'];
  const OTHER = ['red', 'blue', 'green', 'yellow', 'orange', 'grey', 'gray', 'gold', 'golden', 'silver', 'copper', 'brass', 'bronze', 'rust', 'amber', 'honey', 'moss', 'olive', 'sage', 'sand', 'clay', 'ochre', 'oak', 'walnut', 'cedar', 'stone', 'marble', 'concrete', 'granite', 'wool', 'leather', 'steel', 'ash', 'smoke', 'dusk', 'dawn', 'moon', 'saffron', 'coral'];
  const words = String(brief || '').toLowerCase().split(/[^\p{L}]+/u).filter(Boolean);
  const hit = (list) => [...new Set(words.filter((w) => list.some((k) => w === k || w === k + 's' || w === k + 'y')))];
  const light = [...new Set([...hit(LIGHT), ...lit])], dark = hit(DARK), other = hit(OTHER);
  return { words: [...light, ...dark, ...other], lean: light.length && !dark.length ? 'light' : dark.length && !light.length ? 'dark' : null };
}
// The client's name is the brief's first phrase, up to its first comma ("Hvit, a guesthouse in the Westfjords").
function nameColours(brief) { return briefColours(String(brief || '').split(',')[0], true); }
// Why this page's pictures must carry colour, or null: food and drink (a hot sauce, a gin), flowers, fashion, cosmetics
// and jewellery, the seasons and landscapes
// through the year, rooms and tables, or a client whose name or brief names a colour or a light. A black-and-white
// treatment turned Hvit ("white") grey and made its four seasons look alike (r6-p30). Greys, fog and hard materials
// (stone, steel, oak) are not reasons: black-and-white suits them.
// Products count too: a product shown grey hides the colour the brief gives it.
function picturesCarryColour(input) {
  const brief = String(input.brief || '');
  const BY_SECTOR = { restaurant: 'a restaurant page', hospitality: 'a hospitality page', fashion: 'a fashion page', 'physical-product': "the product's own colours", ecommerce: "the products' own colours" };
  if (BY_SECTOR[input.sector]) return BY_SECTOR[input.sector];
  const NEUTRAL = new Set(['grey', 'gray', 'ash', 'smoke', 'smoky', 'silver', 'slate', 'charcoal', 'iron', 'steel', 'concrete', 'stone', 'granite', 'marble', 'basalt', 'oak', 'walnut', 'cedar', 'wool', 'leather', 'coal', 'soot', 'peat', 'obsidian', 'ebony', 'ink', 'fog', 'foggy', 'mist', 'misty', 'haze', 'hazy']);
  // pale materials count in the client's name (a house called Linen is a white house), elsewhere only colours do
  // ("invoicing that replaces paper" names no colour)
  const PALE = new Set(['paper', 'linen', 'cotton', 'porcelain', 'bone', 'salt', 'birch']);
  const plain = (w) => w.replace(/(?:s|y)$/, '');
  const named = [...new Set([...nameColours(brief).words, ...briefColours(brief).words.filter((w) => !PALE.has(w) && !PALE.has(plain(w)))])].filter((w) => !NEUTRAL.has(w) && !NEUTRAL.has(plain(w)));
  if (named.length) return `the brief names ${named.map((w) => `"${w}"`).join(', ')}`;
  const SUBJECT = /\b(?:food|foods|drinks?|wines?|winery|vineyards?|coffee|tea|teas|bakery|bakers?|bread|pastry|pastries|patisserie|chocolate|gelato|ice cream|cheese|fruits?|vegetables?|greengrocer|kitchen|chefs?|menus?|dish|dishes|recipes?|restaurants?|bistro|caf[eé]s?|brewery|beers?|cocktails?|sauces?|chil(?:l?i|l?ies|l?is)|spices?|honey|jams?|oils?|gin|whiske?y|whiskies|rum|spirits|distiller(?:y|ies)|ciders?|sake|juices?|smoothies?|kombucha|snacks?|sweets|cand(?:y|ies)|pizzas?|sushi|ramen|tacos?|burgers?|deli|butchers?|grocer(?:y|ies)|farms?|orchards?|harvests?|dining|brunch|breakfasts?|dinners?|cosmetics|make-?up|lipsticks?|perfumes?|jewell?ery|jewelry|flowers?|florists?|floral|gardens?|plants?|blooms?|fashion|clothing|clothes|knitwear|textiles?|dyes?|paints?|seasons?|spring|summer|autumn|winter|all year|year-round|through the year|hotels?|guesthouses?|guest house|inns?|hostels?|lodges?|cabins?|resorts?|campsites?|glamping|rooms|bedrooms?|interiors?|sunlight|daylight|sunsets?|sunrises?|aurora|northern lights|colou?rs?|colou?rful)\b/i;
  const m = brief.match(SUBJECT);
  return m ? `its pictures show ${m[0].toLowerCase()}` : null;
}
// The line under the palette that says so.
function colourWords(s) {
  const { words: inBrief, lean } = briefColours(s.input.brief);
  // (a light that counts only as a name, Lys, is among the name's words alone)
  const words = [...new Set([...nameColours(s.input.brief).words, ...inBrief])];
  if (!words.length) return 'When the client\'s name names a colour, a material or a light (white, black, ember, slate, linen, fog, in any language), the page\'s ground follows it; redraw this palette if it contradicts that (SKILL.md step 1).';
  const name = nameColours(s.input.brief), nameLean = name.lean;
  const tone = groundTone(s.palette);
  const list = (ws) => ws.map((w) => `"${w}"`).join(', ');
  const ground = nameLean || (lean === tone ? lean : null);
  const eg = ground === 'dark' ? 'a dark material for the ground' : ground === 'light' ? 'a pale material for the ground' : 'the material for the ground';
  if (nameLean) {
    const named = `**The client's name carries ${list(name.words)}: the page's ground follows it.**`;
    // a name of light or a pale colour is a promise about the pictures too: Hvit (r7-p35) opened on a grey sky under a
    // dark overlay
    const bright = nameLean === 'light' ? ' **Its pictures are bright and high-key too:** daylight, pale grounds, open shadows, bright pictures of its own place or subject (snow, a white house in summer light, a pale fjord), never a sunnier coast standing in for it; no dark overlay, no scrim and no dimmed hero, and never a grey-sky or dusk photograph as the first picture. Text on a picture sits on its calm pale part in the ink, or beside it.' : '';
    if (tone !== nameLean) return `${named} It asks for a ${nameLean} ground and the one dealt above is ${tone === 'mid' ? 'a coloured field' : tone}: redraw the palette (\`--redraw palette\` keeps to a ${nameLean} ground) and say so in the report.${bright}`;
    return `${named} The ${nameLean} ground dealt above fits it; take the colours from what it names where the dealt ones do not fit (${eg}, a strong hue for the accent), and say so in the report.${bright}`;
  }
  const many = words.length > 1;
  return `**The brief names ${list(words)}.** Where ${many ? 'they describe' : 'it describes'} the client or what it makes (its name, its material, its light) rather than something it replaces or works on, keep the proportions above and take the colours from what ${many ? 'they name' : 'it names'} where the dealt ones do not fit (${eg}, a strong hue for the accent), and say so in the report.`;
}
function briefWords(brief) {
  const stop = briefStop();
  return [...new Set(String(brief || '').toLowerCase().split(/[^a-z]+/).filter((w) => w.length >= 4 && !stop.has(w)).map((w) => w.replace(/(ies|es|s)$/, '')))].filter((w) => w.length >= 4);
}
// First queries for scripts/assets.mjs, built from the brief: the place in old postcards and maps, then the
// subject itself. In testing "<place> postcard" and "<place> old map" found archival material far more
// reliably than a place and a year. A start only: the better queries come from the builder's inventory.
function assetQueries(input) {
  const brief = String(input.brief || '');
  const notPlace = /^(?:january|february|march|april|may|june|july|august|september|october|november|december|monday|tuesday|wednesday|thursday|friday|saturday|sunday)s?$/i;
  const placeRe = /(?:^|[\s,(])(?:in|at|near|from|on|above|below|beside|outside|off|over)\s+(\p{Lu}[\p{L}'’-]*(?:\s+(?:\p{Lu}[\p{L}'’-]*|de|da|do|dos|das|di|del|van|von|der|den))*)/gu;
  const place = [...brief.matchAll(placeRe)].map((m) => m[1].trim()).find((p) => !notPlace.test(p.split(/\s+/)[0]));
  const subject = briefSubject(input).join(' ') || (input.sector !== 'other' ? input.sector.replace(/-/g, ' ') : null);
  const out = [];
  if (place) out.push(`${place.toLowerCase()} postcard`, `${place.toLowerCase()} old map`);
  if (subject) out.push(subject.toLowerCase());
  return [...new Set(out)];
}
// The subject: the last plain words of the first noun phrase ("a 38-seat Italian restaurant in ..." gives "restaurant",
// "an electric front-box cargo bike for families" gives "cargo bike").
function briefSubject(input) {
  const stop = briefStop();
  const generic = new Set(['seat', 'seats', 'room', 'rooms', 'minute', 'minutes', 'hour', 'hours', 'night', 'nights', 'year', 'years', 'people', 'family', 'local', 'short', 'best', 'making', 'selling', 'serving', 'offering', 'business', 'company', 'brand', 'shop', 'store', 'studio', 'service', 'services', 'dinner', 'lunch', 'breakfast', 'included', 'online', 'modern']);
  const words = String(input.brief || '').split(/\s+/).filter(Boolean); const phrase = [];
  for (let k = words.findIndex((w) => /^an?$/i.test(w)) + 1; k < words.length; k++) {
    if (/^(?:in|at|on|for|from|with|near|above|below|by|that|which|who|of|and|to)$/i.test(words[k])) break;
    phrase.push(words[k].replace(/[,.;:()!?]+$/, ''));
    if (/[,.;:()!?]$/.test(words[k])) break;
  }
  return phrase.filter((w) => /^\p{Ll}{3,}$/u.test(w) && !stop.has(w) && !generic.has(w)).slice(-2);
}
// The category's stock shots for this brief, its trade's and its sector's (CLICHES at the top), or none.
function clicheFor(input) { const b = String(input.brief || ''); const hit = CLICHES.find(([re]) => re.test(b)); return [hit?.[1], SECTOR_CLICHES[input.sector]].filter(Boolean).join('; ') || null; }
// Whether a dealt photograph is one of those stock shots.
function clichePhoto(input, alt) { const b = String(input.brief || ''); const hit = CLICHES.find(([re]) => re.test(b)); return [hit?.[2], SECTOR_CLICHE_PHOTOS[input.sector]].some((re) => re && re.test(alt || '')); }
// Blueprints written for showing software (an interface fragment is their picture).
function softwareOnly(x) { return (x.directions || [])[0] === 'product-performs' || (x.tags || []).includes('ui-led') || /data-ui|interface fragment/i.test(x.blueprint || ''); }
// Blueprints were measured on real sites and carry that site's sizes, greys, faces, colours and corners.
// This lists, for one blueprint, exactly where it disagrees with the house rules and the dealt system,
// so the builder does not have to work it out section by section.
function adjustments(bp, s) {
  const text = [bp.blueprint, bp.mobile, bp.headline].filter(Boolean).join(' ');
  const notes = [];
  const sizes = (re) => [...new Set([...text.matchAll(re)].map((m) => m[1] + 'px'))];
  const notSpacing = String.raw`(?!\s*(?:gaps?|gutters?|margins?|padding|radius|corners?|apart|from|inset|offset|high|tall|wide|thick|square|borders?|stroke|rules?|line\b|dots?|circles?|bars?|of|between|beneath|below|above|under|down|up|across|deep|left|right|in\b|to\b|and\b|each))`;
  const tiny = sizes(new RegExp(String.raw`(?<!(?:radius|radii|gap|margin|padding|inset|offset)[:\s]{0,3}(?:of\s)?)\b(9|10|11|12)(?:\.\d)?px\b` + notSpacing, 'g'));
  if (tiny.length) notes.push(`It sets text at ${tiny.join(', ')}: use your small step (13px or more) for a caption or a label, and your body step for running, list or table text.`);
  // (round 9: running, list and table text under 14px fails, 14-15px warns on desktop, under 15px fails on a phone)
  const running = [...new Set([...sizes(/\b(13|14|15)px\s*(?:paragraphs?|body|text|descriptions?|copy|sentences?|answers?)/gi), ...sizes(/(?<!legal )\b(?:paragraphs?|text(?! links?)|descriptions?|copy|sentences?|answers?|notes?)\b[^.;:]{0,24}?\bat\s+(13|14|15)(?:\.\d)?(?:[–-]1[4-6])?px\b/gi)])].sort();
  if (running.length) notes.push(`It sets running, list or table text at ${running.join(', ')}: use your body step (16px or more, 15px at the least on a phone). The inspector fails it under 14px and warns under 16px (\`small-body\`).`);
  // (round 9: a wall of six or more tiles in three fills or more fails, r8-p37)
  if (/\btile colou?rs rotate|\btiles\b[^.]{0,80}\b(?:colou?rs? rotate|rotat\w+ through[^.]{0,20}colou?rs|(?:its|their) own (?:flat )?colou?r|(?:different|alternating) colou?rs|in (?:two|three|four|several)\b[^.]{0,20}colou?rs)|\b(?:tile|fill) is a flat (?:palette )?colou?r\b|\bflat fill, rotating\b/i.test(text)) notes.push('It fills its tiles in several colours: set every tile on one fill (the ground, or one surface) and let the pictures carry the colour. Six tiles or more in three fills read as a wall of boxes (`tile-wall`).');
  // (round 9: words on a photograph are read against the pixels under them, at every width; r7-p35 failed on the tablet and the phone)
  if (/(?<!\b(?:no|never|without|not) (?:\w+ ){0,2})\b(?:on|over|across) (?:the |a |its |each )?(?:full-bleed )?(?:photograph|picture|image|photo)(?:'s)?\b(?! (?:of|and|beside|next))|\b(?:photograph|picture|image)'s (?:calm(?:est)?|quiet(?:est)?) (?:area|part|side|corner)|\boverlap\w* (?:the )?(?:photograph|picture|image)/i.test(text)) notes.push('It sets words on a photograph: put them on its calm part, of one tone, and look again at 768 and 390, where the crop moves; the inspector reads the pixels under the letters at every width (`text-on-photo`).');
  if (/\d{1,2}% (?:opacity|black|ink|grey|gray|white)|opacity:? ?0?\.\d|\b(?:rest|others?|remaining)\b[^.;]{0,25}\b(?:at|to) \d{1,2}%(?! (?:of|width|wide))|full (?:ink|white|strength)[^.;]{0,60}\bat \d{1,2}%(?! (?:of|width|wide))/i.test(text)) notes.push('It fades text: anything a visitor reads, inactive items of a list included, is `--ink` or `--muted` at full strength (contrast 4.5:1 or more). The active item is told apart by `--ink` against `--muted`, weight or the accent, not by fading the rest.');
  if (/\d+px (?:corner )?radius|radius (?:of )?\d+px|\brounded\b|\bpill/i.test(text)) notes.push('It names its own corners: use the one radius of this page (square unless the direction says otherwise) and one button shape.');
  if (/\b(?:serif|sans-serif|condensed|grotesk|italic|monospace|mono|all caps|uppercase|capitals|script)\b/i.test(text)) notes.push(s.type ? `It names a kind of typeface: use the dealt faces (display ${s.type.display.family}, text ${s.type.text.family}) and their settings; capitals only where the type system sets them.` : 'It names a kind of typeface: use the brand faces.');
  const colours = [...new Set([...text.matchAll(/\b(green|red|blue|yellow|orange|pink|purple|teal|navy|cream|beige|brown|grey|gray|white|black)\b(?![- ](?:space|studio|background disappears))/gi)].map((m) => m[1].toLowerCase()))];
  if (colours.length) notes.push(`It names colours (${colours.join(', ')}): map them onto this palette's roles (ground \`--bg\`, panels \`--surface\` and the fields, text \`--ink\`/\`--muted\`, the accent \`--accent\` on the primary action only).`);
  if (/(?<!\b(?:no|without|never|not|nor) (?:a |any )?)\b(?:rule|rules|hairline|border|borders|divider|underline|thin line|1px line)\b/i.test(text)) notes.push('It draws lines or borders: keep them only inside a table, a form or a `data-ui` fragment; elsewhere separate with space or a change of ground.');
  if (/shadow|glow/i.test(text)) notes.push('It mentions a shadow: only on something open above the page (a menu, a dialog), never on a resting element.');
  const bigSentence = [...text.matchAll(/\b(?:sentence|statement|paragraph|quotation|quote)\b[^.;]{0,40}?\b(?:at|to)\s+(?:clamp\(\s*\d+(?:\.\d+)?px,\s*)?(\d+(?:\.\d+)?)(px|vw)/gi)].some((m) => (m[2] === 'px' && +m[1] > 36) || (m[2] === 'vw' && +m[1] > 2.6));
  // (a split hero's headline is 5vw or more, so the smaller statement is no way out there: split-hero-title fails it)
  if (bigSentence) notes.push(bp.split ? 'It sets a sentence large over several lines: jurors read that as a long headline. Cut it to a two-line headline at display size (5vw, 72px at 1440); beside the picture a smaller statement is not a way out (`split-hero-title`).' : 'It sets a sentence large over several lines: jurors read that as a long headline. Either cut it to a two-line headline at display size, or keep it a statement at 36px or less on three lines (24px, four lines on a phone).');
  if (/(?:sticky|pinned|pins?\b|stays? (?:fixed|put|in place))/i.test(text) && /\b(?:three|four|five|six) (?:to (?:four|five|six) )?(?:viewports|screens)\b|\b[3-6]00svh\b/i.test(text)) notes.push('It pins something for three screens or more: hold a pin for two or three screens at most, give every screen under it its own content, and let nothing pass over the pinned words (the inspector checks all three).');
  if (/\b(indented|stepped|staggered)\b[^.]{0,60}\b(line|heading|title)|\b(heading|title)[^.]{0,60}\b(indented|stepped|staggered)/i.test(text)) notes.push('It steps or indents the lines of a heading: set every line of a heading on one left edge. A staggered heading read as a gimmick in round 4.');
  if (/\b(paper|slip|receipt|sheet of paper|card)\b[^.]{0,80}\b(on|over) (a |the )?(contrasting|full-bleed|dark|flat)\b/i.test(text)) notes.push('It puts the content on a panel of another tone: set it on the section\'s own ground. A panel in a colour the palette does not name is a fourth surface (the inspector warns, surface-count).');
  if (/mix-blend-mode:\s*(?:difference|exclusion)/i.test(text)) notes.push('It blends text with `difference`: over anything but black, white or grey that gives random hues. Use a solid ink chosen for each ground instead.');
  if (/tops? of the (?:letters|word|name|wordmark)|(?:letters|wordmark|name|word)\b[^.;]{0,30}\b(?:sliced|cut|cropped|clipped)[^.;]{0,20}\btop/i.test(text)) notes.push('It crops letters along their top: the inspector fails that (jurors read it as broken). Crop at the bottom edge or a side instead.');
  if (bp.archetype && /single action[^.;]{0,40}?\b(?:text link|underlined (?:text )?link)/i.test(text)) notes.push('Its action is a text link: the primary action on the first screen is a real button (filled or solid-bordered, 44px or taller), placed where the blueprint puts the link. A second action may stay a link.');
  if (['condensed-heavy', 'condensed'].includes(s.type?.class) &&/\d+(?:\.\d+)?vw/.test(text)) notes.push('Its vw sizes assume a face of normal width: with this condensed display face, size the words to fill the measure the blueprint gives them instead of copying the vw value.');
  if (/\b0[1-9]\b(?![:.,]\d)|numbered|index number/i.test(text)) notes.push('It numbers things 01, 02: drop the numbers unless they are real data (a price, a date, a count).');
  // the rooms of a house and the products of a shop are each shown (r7-p35 listed four rooms and pictured one)
  const each = { hospitality: 'room', ecommerce: 'product' }[s.input.sector];
  if (each && bp.role === 'list' && !/photo|picture|image/i.test(bp.blueprint || '')) notes.push(`It lists without pictures: on this page each ${each} it names has its own photograph beside it (section 5), as many photographs as ${each}s. Set each ${each}'s row beside its picture, or take a list that pictures each item (\`--alternatives list\`); with fewer good pictures, list fewer ${each}s.`);
  const visit = visitNote(s, text);
  if (visit) notes.push(visit);
  // a blueprint that turns its pictures grey keeps the page's one treatment: colour where the pictures carry it (a
  // black-and-white file included), black-and-white only where section 0 deals it
  if (/(?<!\b(?:no|never|not|without)\s(?:\w+\s)?)\b(?:gr[ae]yscale|black-and-white|desaturat\w*)/i.test(text)) {
    const colour = s.colourPictures ?? picturesCarryColour(s.input);
    if (colour) notes.push(`It turns its pictures grey: on this page the pictures carry the colour (${colour}), so keep every picture in colour and leave out any photograph whose file is black-and-white (references/imagery.md §6).`);
    else if (s.frame?.treatment?.id !== 'mono') notes.push('It turns its pictures grey: give them the treatment section 0 deals instead, the same for every picture on the page.');
  }
  // a client named for a light gets bright pictures: a blueprint that darkens one for white type is set the other way
  if (nameColours(s.input.brief).lean === 'light' && /darken|brightness\(0\.|scrim|low-key|white type|type is white/i.test(text)) notes.push('This client\'s name asks for bright pictures (section 4): keep the photograph untouched, no scrim and no `brightness()` under 1; set the words in the ink on its pale calm part, or beside it.');
  // a hero written without a navigation bar fails the inspector's no-nav check (r8-p38's mid-screen rail)
  if (bp.archetype && /\bno navigation\b/i.test(text)) notes.push('It has no navigation bar: the page keeps the navigation section 0 deals, a bar at the top of the first screen apart from the h1, with the real sections as links and the one action.');
  // the hero's geometry is binding, within the house rules: a drawn shape and a headline on a card are not (round 10)
  if (bp.archetype && /drawn in CSS|inline SVG path|flat shape at enormous scale/i.test(text)) notes.push('It draws a shape: no drawn or decorative shapes on this page. Cut a photograph of the subject to that outline at the same size and place, or leave the ground plain; the button keeps the page\'s one shape.');
  if (bp.archetype && /\b(?:printed|menu) card\b/i.test(text)) notes.push('It sets the headline on a card: no headline in a card, panel or box (`hero-in-card`). That half is the page\'s own ground, the same colour, running to the edges with no inset and no corners; the words keep their place and size on it, and the photograph keeps its half.');
  if (bp.archetype && /\bportrait card\b/i.test(text)) notes.push('It sets the title on a card: no headline in a card, panel or box (`hero-in-card`). The page\'s ground is the paper: the names and the date, time and place sit straight on it where the card held them, with no card, no scalloped corners and no diamond between the lines.');
  return notes;
}
// A street, hours and a phone the brief does not give are never made up as placeholders (r7-p36 printed Musterstrasse
// 12 and 030 000 000 00 in its visit and footer block). Asked of every blueprint and of the footer dealt in section 0,
// which outranks them. A product sold online, an app or a portfolio has no door to print, unless its brief gives a
// street; a place people go to prints a real street without a number and the way there (visitBlock, section 7).
function visitNote(s, text) {
  const given = visitGiven(s.input.brief);
  // ("on a phone" is the phone layout; a delivery or email address is a form field, and the "address, time or price" of
  // a table row is not where the client is)
  const asksStreet = /\bpostcode\b|(?<!(?:delivery|billing|shipping|e-?mail|web|ip) )\baddress(?:es)?\b(?!,\s*time)/i.test(text);
  const asksPhone = /\b(?:tele)?phone numbers?\b|\btelephone\b/i.test(text);
  if (noDoor(s.input)) return asksStreet || asksPhone ? `This page has no door in its brief: no street, hours${given.phone ? '' : ' or phone'}. In their place the email on the brand's own domain${given.phone ? ', the phone the brief gives' : ''} and the city, if the brief names one; the report lists what to fill (references/copy.md §5).` : null;
  const street = asksStreet && !given.street, phone = asksPhone && !given.phone;
  if (!street && !phone) return null;
  const where = hasDoor(s.input)
    ? 'in place of the street address, a real street in the right district of the town, with no house number, and the way there, as "The visit" in section 7 says'
    : 'in place of the street, the town the brief names';
  return `It prints ${[street && 'a street address', phone && 'a phone number'].filter(Boolean).join(' and ')}, which the brief does not give: ${[street && `${where}; never a placeholder street (Musterstrasse 12, 1 Main Street)`, phone && 'leave the phone out, never a zeroed or patterned number'].filter(Boolean).join('; ')}. The email stays on the brand's own domain, and the report lists what to fill (references/copy.md §5).`;
}
function noDoor(input) { return (isSoftware(input) || ['physical-product', 'ecommerce', 'personal-portfolio'].includes(input.sector)) && !visitGiven(input.brief).street; }
// A place people go to (DOOR_WORDS at the top): its sector, or a word for one in the brief's own subject (never its
// clients: "designs for restaurants, bars and hotels" is a studio with no door; an event is dated, never open daily).
function hasDoor(input) { return !noDoor(input) && (['hospitality', 'restaurant'].includes(input.sector) || (input.sector !== 'event' && DOOR_WORDS.test(briefHead(input.brief)))); }
// The visit block of a place people go to (r9-p44 gave hours and an email under "Open in Berlin": no street, district,
// stop or map, and the judge marked it high). Printed once in section 7; the inspector warns visit-without-directions.
function visitBlock(s) {
  if (!hasDoor(s.input)) return null;
  const given = visitGiven(s.input.brief);
  const house = s.input.sector === 'hospitality';
  const where = s.input.sections.includes('contact') ? 'the contact section' : 'a short visit section before the footer, which a place people go to always has';
  // a district the brief names ("Berlin-Neukoelln", "the Kiez") is the client's, not sample copy
  const district = /\b\p{Lu}\p{L}+-\p{Lu}\p{L}+\b|\b(?:district|quarter|neighbou?rhood|borough|arrondissement|Kiez)\b/u.test(String(s.input.brief || ''));
  const sample = [!given.street && 'the street', !district && 'the district', 'the way there', house ? 'the season' : 'the hours', !given.phone && 'the email'].filter(Boolean);
  const remote = (x) => (given.street ? '' : x);
  return `**The visit: this is a place people go to, so the page says how to get there** (in ${where}): ${given.street ? 'the address the brief gives' : 'the street, a real street in the right district of the town the brief names, with no house number (the brief gives none), or for a remote place or a brief that names only a region, the nearest town and the road from it'}; the district or area${district ? ' the brief names' : ''}; the nearest stop and its line (read from a map in this session or one you are sure of, otherwise the district\'s main station)${remote(', or for a remote place the drive from that town, with no travel time')}; ${house ? 'the season and the check-in times' : 'the opening hours'}; a "Directions" link to a maps service searching that ${given.street ? 'street' : 'street or road'} and town; and one contact (${given.phone ? 'the phone the brief gives, or ' : ''}the email on the brand's own domain${given.phone ? '' : ', since the brief gives no phone'}). Never a placeholder street, never a zeroed phone, never the city's name alone (\`visit-without-directions\`). The report marks ${sample.slice(0, -1).join(', ')} and ${sample.at(-1)} as sample copy for the client to confirm.`;
}
// Whether the brief gives a street address (a number beside a street word) and a phone number.
function visitGiven(brief) {
  const b = String(brief || '');
  const STREET = '(?:street|st\\.?|road|rd\\.?|avenue|ave\\.?|lane|row|square|quay|terrace|rue|via|calle|avenida|piazza|plaza|strasse|straße|gasse|weg|platz|allee|ufer|damm)';
  return {
    street: new RegExp(`\\b\\d{1,4}[a-z]?,?\\s+(?:[\\p{L}'’.-]+\\s+){0,3}${STREET}(?![\\p{L}])|\\b${STREET}\\s+(?:[\\p{L}'’.-]+\\s+){0,3}\\d{1,4}\\b|\\p{L}+(?:strasse|straße|str\\.|gasse|weg|platz|allee|vej|gata|gade|vegur|vägen|straat|laan)\\s*\\d{1,4}\\b`, 'iu').test(b),
    // international or national ("+47 ...", "030 ..."), and North American ("(212) 555-0147", "212-555-0147")
    phone: /(?:\+\d|\b0\d)[\d\s()./-]{6,}\d|\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/.test(b),
  };
}
// Every blueprint of a role that suits this direction and this build's real assets.
function sectionPool(dir, role, input) {
  // banned blueprints (drag rails, progress bars, folder tabs) are never dealt
  let pool = L.sections.filter((s) => s.role === role && !s.banned);
  if (!pool.length) return [];
  const mode = imageryMode(input);
  const feasible = pool.filter((s) => (s.needs || []).every((n) => n === 'photography' || input.have.includes(n) || (n === 'product-ui' && mode === 'interface')));
  if (feasible.length) pool = feasible;
  if (mode !== 'interface' && !input.have.includes('product-ui')) { const plain = pool.filter((s) => !softwareOnly(s)); if (plain.length) pool = plain; }
  if (mode === 'interface' || mode === 'no-product-photo') {
    // prefer compositions that do not hang on a photograph of the thing
    const honest = pool.filter((s) => (mode === 'interface' ? worksWithoutPictures(s) : !(s.tags || []).includes('object-led') || worksWithoutPictures(s)));
    if (honest.length >= 2) pool = honest;
  }
  const byDirection = pool.filter((s) => (s.directions || []).includes(dir.id));
  if (byDirection.length) return byDirection;
  const byTag = pool.filter((s) => (s.tags || []).some((t) => (dir.sectionTags || []).includes(t)));
  return byTag.length ? byTag : pool;
}
function dealSection(dir, role, usedIds, prevShape, nextShape, input) {
  let pool = sectionPool(dir, role, input);
  if (!pool.length) return null;
  if (imageryMode(input) === 'interface') { const ui = pool.filter((s) => (s.tags || []).includes('ui-led')); if (ui.length >= 2 && rnd() < 0.6) pool = ui; }
  const unused = pool.filter((s) => !usedIds.includes(s.id)); if (unused.length) pool = unused;
  const varied = pool.filter((s) => s.shape !== prevShape && s.shape !== nextShape); if (varied.length) pool = varied;
  return pick(pool);
}
function dealReferences(dir, input) {
  const named = (dir.seenIn || []).map((n) => L.sites.find((s) => s.id === n || s.name === n)).filter(Boolean);
  // the October 2026 panel scored on a lower scale (its top band starts at 7.5, the first panel's at about 7.6)
  const good = (s, a, b) => s.score >= (s.panel === '2026-10' ? b : a);
  const sameKind = L.sites.filter((s) => s.kind === input.sector && good(s, 7.2, 7.3) && !named.includes(s));
  const out = [...shuffle(named).slice(0, 2), ...shuffle(sameKind).slice(0, 1)];
  return out.length ? out : shuffle(L.sites.filter((s) => good(s, 7.6, 7.5))).slice(0, 2);
}

// ---------- rendering ----------
function siteCard(s, full) {
  // on the sheet only the idea: the details of another site's look are what builders copied literally
  const lines = [`- **${s.name}** (${s.source}, studied score ${s.score}) \`${s.id}\``, `  Idea: ${s.idea}`];
  if (full) {
    lines.push(`  Hero: ${s.hero}`, `  Type: ${s.type}`, `  Colour: ${s.colour}`, `  Imagery: ${s.imagery}`, `  Layout: ${s.layout}`);
    if (s.media) lines.push(`  Pictures and footage: ${s.media}`);
    if (s.motion) lines.push(`  Motion: ${s.motion}`);
    for (const sec of s.sections || []) lines.push(`  Section (${sec.role}): ${sec.description}`);
    for (const t of s.steal || []) lines.push(`  Worth taking: ${t}`);
    lines.push(`  URL: ${s.url}`);
  }
  return lines.join('\n');
}
// The dealt entrance, printed under the signature move: what it is, the markup, where its CSS lives, the rule below the fold.
function entranceBlock(e, s, p) {
  const mode = e.mode || 'photo';
  p();
  p(`### Entrance — ${e.name} (\`${e.id}\`), dealt`);
  p(e.id === 'set-type'
    ? 'This is the masked line rise with the clip-path shutter: once every page\'s default, now one entrance of seven and rarely dealt. Build it as base.css has it.'
    : 'It replaces the old default (headline lines rising out of masks, a clip-path shutter on the picture): build this one and neither of those.');
  p(`- **What the visitor sees:** ${e.sees}${e.byImagery?.[mode] ? ' ' + e.byImagery[mode] : ''} Settled by ${e.settled}.`);
  const parts = mode === 'type-only'
    ? '`data-e="headline"`, `data-e="lead"` and `data-e="action"` (no picture on this first screen)'
    : '`data-e="headline"`, `data-e="lead"`, `data-e="action"` and `data-e="picture"` (on the element that already crops the picture, with `--picture-ground` sampled from the picture; the img, video, picture or `[data-ui]` is its first child)';
  // what the script already knows is decided here, not left to the builder
  const serious = s.input.tone ? ['editorial', 'technical'].includes(s.input.tone) : !(s.direction.tones || []).some((t) => ['bold', 'playful'].includes(t));
  const decided = [
    e.id === 'line-blocks' && (serious ? 'The blocks are the ink: put `--block: var(--ink)` on the body.' : 'The blocks are the accent (the default `--block`).'),
    e.id === 'exposure' && isDark(s.palette) && 'This page is dark, so the photograph comes up from dim: put `--exposure-from: brightness(0.35) saturate(0.5)` on the body.',
  ].filter(Boolean).join(' ');
  p(`- **Markup:** \`<body data-entrance="${e.id}">\`; the first screen is \`[data-hero]\`, its parts ${parts}.${e.markup ? ' ' + e.markup : ''}${decided ? ' ' + decided : ''}`);
  if (mode === 'photo') p('- **The hero picture:** paste the snippet from motion.md, "The hero picture", in a `<script>` right after the hero, so a photograph that has not arrived waits on its ground instead of the entrance playing over an empty frame.');
  if ((s.scenes || []).some((x) => x.carries === 'hero')) p('- **A scene carries the first screen:** mark its headline, sentence and action only; its picture moves with the scene.');
  p(`- **CSS:** already in \`<skill>/assets/base.css\` (the \`${e.id}\` block under "the entrance"); write none of your own. It needs \`<script>document.documentElement.classList.add('js')</script>\` in the head and base.js at the end of the body. To watch it run: \`<skill>/assets/entrances/demo.html?e=${e.id}\`.`);
  const rule = e.below.rule;
  p(`- **Below the fold: ${e.below.label}.** ${rule}${/data-reveal/.test(rule) && /nothing else|nothing enters|stray/i.test(rule) ? '' : ' No other block gets `data-reveal`: no fade-up on every block.'}`);
}
// The dealt product replay, printed as the signature move of a software page.
function replayBlock(r, s, p) {
  p(`**The product replay: ${r.name}, in the ${r.carries} section.** This is the page's big moment: the product's own window, large, acts out what the product does for the visitor, a beat at a time, while its section holds and the visitor's scroll steps the beats. ${r.sees}`);
  p(`- **Beats:** ${r.beats}. Three to five, each one large change with real labels and figures that add up (a count is right at every beat). ${r.action === 'agent' ? 'The agent acts: its status line names what it does to the rows in view, and the rows it works on take the accent fill.' : r.action === 'zoom' ? 'The view moves in on a whole column or block at each stop (data-zoom-at, never a single row, so the crop falls in a gap), the value there changes as its row takes the accent, and the last beat moves back out.' : r.action === 'names' ? 'Each person changes one whole block in turn; the block takes the accent fill and carries their name inside it, and a comment opens on the ink and closes as its change lands.' : r.action === 'move' ? 'The item at work takes the accent fill (data-focus-at) and travels at full size from column to column (data-flip-at) while the items round it make room; no panel opens.' : 'The item at work takes the accent fill (data-focus-at) and the panel that does the work opens over the window on the ink (data-open-at).'} No drawn cursor: the change itself shows the action (\`replay-cursor\`).`);
  p('- **Size and hold:** the heading (the promise), the window, one sentence and a Replay button stand in one stage, the last thing in its section: `<section class="replay-hold"><div class="replay-stage">`. The window 70% of the width or more on desktop and 40% of the screen\'s height, nearly the full width on a phone, nothing in it under 14px. replay.js centres the held stage, so the stage is 75% of the screen\'s height or more (about 680px at 1440 by 900). It holds the stage about half a screen of scroll per beat; scrolling back steps back; Replay plays the beats once in place.');
  p('- **The first state is a full window:** before beat 1 the visitor scrolls the window in and sees its first state for about a screen, so it is the visitor\'s own work before the task: the rows, figures and labels already there, at full size. Beats change it or add to it; they never fill an empty one. Never empty table headers, a count of 0 or a blank list waiting for its rows (round 8: the judge scrolled past an empty box). Mark only what the task adds or changes with `data-at`; a window that shows under half its words at beat 0 is started by replay.js on the first beat that fills it, and the changes up to that beat never play.');
  p('- **The still:** the HTML is the final state, every pane filled. Reduced motion and no script see it, and nothing is held.');
  p('- **Never** a video, a GIF or screenshots in sequence, never a device frame or browser dots.');
  p(`- **Not with the entrance:** this fragment carries \`data-replay\` and no \`data-e\`, \`data-reveal\` or \`data-moment\`; the hero's fragment is the entrance's.${s.entrance?.id === 'product-at-work' ? ' The dealt entrance animates the hero\'s fragment; the replay is a second fragment further down.' : ''}`);
  p(`- **Build it** with \`<skill>/assets/replay.js\` (references/motion.md, "Product replay"); a working example of all six patterns: \`<skill>/assets/replay-demo.html\`. On a phone: ${r.phone || 'one panel of it, the same beats.'}`);
  p('Around it the page still needs the rest of the motion layer (SKILL.md step 9): the entrance below and feedback on every control. The inspector fails a page without the replay the sheet deals (`replay-missing`), a window too small (`replay-small`), a stage that is not held (`replay-not-held`), a beat that never shows in the scroll film (`replay-unseen`) or barely changes the screen (`replay-faint`), empty bands round the held stage (`replay-bands`) and a drawn cursor (`replay-cursor`).');
}
// A dealt technique in sheet section 9: printed like a scene, but marked as one to build fresh, with the direction to
// take, what breaks it, its hold and phone, how to build it on the stage and the way out.
function techniqueBlock(sc, s, p) {
  const what = sc.carries === 'hero' ? 'the first screen' : `the ${sc.carries} section`;
  p(`### ${sc.name} (\`${sc.id}\`) — a technique to build fresh, ${sc.position === 'transition' ? `the hand-over into ${what}` : `carries ${what}`}`);
  p(`Not a tested scene: a technique from the research library (\`<skill>/library/techniques.json\`), dealt so pages stop reusing the same few big moments. It has no files and no demo: you build it, and it is checked like any scene. ${sc.principle}`);
  // what broke the dealt techniques of round 8 comes first: r8-p40's card hand (lib-0109) was one strip on an empty
  // screen, then a fan that hid three of its four texts, each text 900px from its title; r8-p39's line (lib-0240)
  // stranded its words with wide gaps between them and ended on the line alone on flat colour
  p(`- **Avoid, first of all, what breaks it:** ${sc.breaksWhen}`);
  p('- **Every frame of the hold is a finished, readable composition,** not only the last: never one strip, card or word alone on an empty screen while the rest waits; never a fan, stack or overlap that hides the texts a visitor needs (a covered card shows only what still reads, or nothing); every text beside its own title, never a screen away from it; every word whole and in its place or clearly on its way to it, never stranded with wide gaps between words; no word split into flying letters, no title sliced by a mask, nothing that looks broken halfway. **A hold that steps** (statements or pictures in turn): where its steps carry pictures, each step its own picture or a clearly different crop, never one photograph held under every step; where it needs none (see Needs below), the statements stand on the ground alone, with no photograph added; statements as short headlines at display size (40px or more on desktop, two lines at most, marked up as h2 or h3: the 36px statement rule is for paragraphs), never 30px lines beside a picture; no frame between two steps near empty; and without the pin (reduced motion, tablet, phone) no picture repeats: with one picture, show it once and set the steps beside it (`repeated-picture`). Check the 10% frames of the scenes.mjs sheets one by one: a frame you would not ship as a still is unfinished.');
  p(`- **The direction to take:** ${sc.freshTake} That was written for another client: keep the principle and the manner, and take the subject, the pictures and the words from this page.`);
  const why = sc.hold < sc.defaultHold ? ` (the research held it for ${sc.defaultHold}; ${sc.position === 'closing' ? 'a closing scene holds about one screen' : `on this page a scene holds ${sc.hold} at most`})` : !sc.researchHold ? ' (the research ran it without a pin; on the stage it holds one screen)' : '';
  p(`- **Hold:** ${sc.hold} screen${sc.hold === 1 ? '' : 's'} of scroll${why}: \`hold: ${sc.hold}\` in \`Stage.scene\`, its section ${sc.hold + 1} screens tall, each beat about half a screen and something new on screen in every one.`);
  if (sc.trigger === 'scroll-enter') p('- **On the scroll, not on a clock:** in the research it plays once on entry; here spread its timings over the hold so it moves under the scroll, never on a clock inside a held screen.');
  p(`- **Needs:** ${sceneNeedsWords(sc)}.`);
  p(`- **On a phone:** ${sc.phone === 'same' ? "the same move at phone size (`phone: 'same'`)." : "its own version, as the direction above says (`phone: { hold, build }` in `Stage.scene`), or `phone: 'rest'` with a finished composition that reads whole; never the desktop move squeezed."} Below 600px a list laid over a picture drops into the flow under it, and nothing a visitor reads is clipped by the stage (\`clipped-text\`). Check it at phone width like the desktop.`);
  if (s.replay && sc.needs.includes('product-ui')) p("- **Beside the product replay:** the replay keeps the page's one framed window and its task. Build this one from the product's own interface on the page's own ground, cropped, with no window frame, and let it show something the replay does not.");
  p(`- **Build it on the shared stage** as references/scenes.md §8 shows: a file of your own that registers \`Scenes['<a short id>'] = (root, opts = {}) => Stage.scene(root, { hold: opts.hold ?? ${sc.hold}, build(tl, { q, phone }) { … } })\`, the markup \`<section class="scene" data-scene="<that id>">\` holding one \`.scene-stage\`, and its CSS written as the finished composition first, the live layout under \`.scene.is-live\`. Build it with transforms, clip-path and CSS 3D on the stage's pinned GSAP; where the direction mentions WebGL or a 3D library, take its CSS 3D route. Never copy any site: no layout, picture, word or colour from wherever this was seen; set it in this page's own type, colour, pictures and words. Every rule of references/scenes.md §7 holds (native scroll, readable at rest, no drawn shapes, tracks or particles, no dead frames). Check it with \`node <skill>/scripts/scenes.mjs <page>\` like any scene and look at every sheet.`);
  p(`- **If it cannot be built honestly** within the usual three look-and-fix rounds, take \`--redraw scenes\` and say why in your report; it counts toward the same limit of two scene redraws, and the redraw deals ${fewPictures(s.input) ? 'another scene or technique that needs no photograph or one' : 'tested scenes'}.`);
}
function render(s) {
  const d = s.direction; const o = [];
  const p = (x = '') => o.push(x);
  p(`# DIRECTION SHEET — ${d.name}`);
  p(`seed ${s.seed} · drawn ${s.at.slice(0, 10)}${s.redraws ? ` · redraws: ${s.redraws}` : ''}${s.sceneRedraws ? ` (scenes ${Math.min(s.sceneRedraws, 2)} of 2)` : ''} · sector ${s.input.sector}${s.input.tone ? ' · tone ' + s.input.tone : ''}`);
  if (s.input.brief) p(`Brief: ${s.input.brief}`);
  p();
  p('| | |'); p('| --- | --- |');
  p(`| Direction | ${d.name} |`);
  p(`| Hero | ${s.hero.name} |`);
  p(`| Type | ${s.type ? s.type.name : 'kept from the brand'} |`);
  p(`| Colour | ${s.palette ? s.palette.name : 'kept from the brand'} |`);
  p(`| Sections | ${s.sections.map((x) => x.role + (s.replay && x.role === s.replay.carries ? ' (the product replay)' : x.name && x.name !== x.role ? ' (' + x.name + ')' : '')).join(' → ')} |`);
  p(`| Motion | ${s.replay ? `the product replay: ${s.replay.name}, in the ${s.replay.carries} section` : s.motion ? s.motion.name : '—'} |`);
  if (s.entrance) p(`| Entrance | ${s.entrance.name} |`);
  p(`| Photographs | ${s.photos ? 'the "' + (s.photos.title || s.photos.set) + '" set, as atmosphere' : 'none'} |`);
  if (s.frame) {
    const f = s.frame;
    p(`| Navigation · footer | ${f.nav.id} · ${f.footer.id} |`);
    p(`| Corners · spacing · pictures | ${f.corners.id} · ${f.spacing.id} · ${f.treatment.id} |`);
    p(`| Interactive piece · video | ${f.interaction.id} · ${f.clip.id} |`);
  }
  p();
  if (s.frame) {
    const f = s.frame;
    p('## 0. The frame (dealt; these replace whatever a blueprint below says about them)');
    p(`- **Navigation:** ${f.nav.text} Every page has it, with the real sections as links and the one action.`);
    const visit = visitNote(s, f.footer.text);
    p(`- **Footer:** ${f.footer.text}${visit ? ` ${visit}` : ''} Never a giant name or email; picture credits, if a licence needs them, behind one small "Image credits" link.`);
    p(`- **Corners:** ${f.corners.text} (\`--radius: ${f.corners.radius}\`, buttons \`${f.corners.button === 'square' ? '0' : f.corners.button}\`).`);
    p(`- **Spacing:** ${f.spacing.text}`);
    p(`- **Pictures:** ${f.treatment.text}${f.treatment.notMono ? ` Not black-and-white: on this page the pictures carry the colour (${s.colourPictures}).` : ''}`);
    p(`- **Interactive piece:** ${f.interaction.text}`);
    p(`- **Video:** ${f.clip.text}`);
    p();
  }
  p('This is the direction for this build. Adopt it. Do not blend it with the layout you would have made anyway,');
  p('and do not redraw because it is unfamiliar: unfamiliar is the point. Redraw a slot only when it conflicts');
  p('with a stated brand constraint or needs an asset that does not exist, and say why in your report.');
  p();
  p('The parts of this sheet were written separately and will disagree in small ways. Settle every disagreement in this order:');
  p('**house rules** (including type no smaller than 13px, and running, list and table text of 16px or more) → **the direction** (the idea, the composition habits, where the');
  p('one accent goes) → **the frame, the type system and the palette** (sections 0, 3 and 4: they win over any colour, face, size, corner or footer');
  p('a direction or blueprint names) → **the hero blueprint** → **the section blueprints**. Under each blueprint, "Adjusted for this page" lists where it disagrees.');
  p('The hero\'s geometry is binding (section 6): on the first screen it outranks the direction\'s composition, never the house rules, the frame, the type or the palette. Section blueprints are examples of a shape, not drawings to trace: keep the idea of the shape (what is large, what sits beside what) and let the real');
  p('content decide the details. Map every size onto the six type steps. One button shape, one corner radius and one pair of page margins on the');
  p('whole page. If a direction or blueprint asks for a loud colour, a heavy face or a giant size the dealt system does not have, the dealt system wins.');
  p();
  p('## 1. The idea'); p(d.idea); p();
  p('Before anything else, write one sentence in your notes: "On this page, <the subject\'s own material> becomes <the device>."');
  p('Fill the first blank from your inventory of what only this client has (its name and what it means, its street, its numbers, its');
  p('constraint), then put the nearest competitor in the sentence: if it still works, the idea is the category\'s, not the client\'s.');
  p('If section 0 deals an interactive piece, decide now what it is, from the subject (SKILL.md step 4).'); p();
  p('## 2. Composition'); p(d.composition); p();
  if (s.type) {
    const t = s.type;
    p(`## 3. Type — ${t.name}`); p(t.note);
    p('```html'); for (const l of [...new Set([t.display.css, t.text.css].filter(Boolean))]) p(l); p('```');
    p(`- Display: **${t.display.family}** — ${t.display.settings}`);
    p(`- Text: **${t.text.family}** — ${t.text.settings}`);
    // a split hero takes a large headline (r7-p34: 48px beside a half-screen picture read as a shop template): the display
    // step is raised to reach 72px (5vw) at 1440 when the type system's own falls short
    const disp = t.scale?.['step-display']; const at = stepAt(disp, 1440); const raise = s.hero?.split && at !== null && at < 72 ? splitDisplay(disp) : null;
    if (t.scale) { p('```css'); p(':root {'); for (const [k, v] of Object.entries(t.scale)) p(`  --${k}: ${k === 'step-display' && raise ? raise : v};`); p('}'); p('```'); }
    if (raise) p(`\`--step-display\` is raised above for this page's split hero (section 6): it reaches ${Math.round(stepAt(raise, 1440))}px at 1440, where the type system's own stops at ${Math.round(at)}px. The other steps stand.`);
    if (d.typography) p(d.typography);
    p('The direction decides sizes and how many of them; the type system decides how this face is set. Where the two give different tracking or leading, use the values of the type system: they are tuned to this face.');
    p('These six steps are the whole scale. Map every size a blueprint names onto the nearest step; the hero headline takes `--step-display`, whatever size the hero blueprint gives.');
    p();
  } else { p('## 3. Type'); p('Kept from the brand. ' + (d.typography || '')); p(); }
  if (s.palette) {
    const c = s.palette;
    p(`## 4. Colour — ${c.name}`); p('```css'); p(':root {');
    for (const k of ['bg', 'surface', 'ink', 'muted', 'accent', 'accentInk']) if (c[k]) p(`  --${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}: ${c[k]};`);
    (c.fields || []).forEach((f, i) => p(`  --field-${i + 1}: ${f.bg};${f.ink ? `  --field-${i + 1}-ink: ${f.ink};` : ''}`));
    p('}'); p('```'); p(c.note); if (d.colour) p(d.colour); p(colourWords(s)); p();
  } else { p('## 4. Colour'); p('Kept from the brand. ' + (d.colour || '')); p(); }
  p('## 5. Imagery');
  // where to look for real pictures of the subject's world, with first queries built from the brief
  const qs = assetQueries(s.input);
  const find = qs.length
    ? `\`${ASSETS_CMD} "${qs[0]}"\`${qs.length > 1 ? `, then ${qs.slice(1).map((q) => `"${q}"`).join(' and ')}` : ''}, then queries from your inventory (its street, its materials, its trade's tools and history)`
    : `\`${ASSETS_CMD} "<a place, material or object from your inventory>"\``;
  const SOURCES = 'Order of sources: (1) the project\'s own pictures; (2) pictures you generate, if you have an image tool (the best way to show this exact subject); (3) the dealt photographs below and the rest of the library (`node <skill>/scripts/draw.mjs --photos <words>`): sharp, modern and free of credits; (4) real photographs from the open collections (' + find + '), only sharp modern photographs at 1800px or more, each looked at full size first and cropped or dropped if it shows another maker\'s name or logo, a shop or company sign, a readable house number or licence plate, words that would embarrass the client, or a child who could be recognised (references/imagery.md §2), credited in the Image credits dialog (`--credits` prints it), never in the footer; (5) type and space: never a drawing in place of a picture (inline SVG only for the logo and small icons, and a chart only inside a product fragment, `data-ui`; a drawn diagram, chart or illustration on the page fails, labels or not, so say a process in words: `drawn-illustration`). Logos of known products the page names (Gmail, Figma, Slack, Chrome, ChatGPT, Claude) are the real marks, never drawn: `' + ASSETS_CMD + ' --logo gmail,figma` saves them from Simple Icons at a pinned version, and a brand missing there comes from its own press kit, unchanged; never an initial in a circle in its place. Archive photographs, old maps and engravings only when they are the idea itself (the history this subject continues, shown sharp and large as one family, like the slip boxes behind a notes app), never as filler, never small, never a random old picture of the place.';
  const MODE = {
    interface: '**This subject is software and there are no screenshots, so its pictures are its own interface.** Wherever this sheet says photograph, image or object, build a believable fragment of the product in HTML at real size (real labels, numbers that add up, one item hovered or selected) by the app-screen rules (references/app-screens.md: deal its style once with `node <skill>/scripts/draw.mjs --app --kind <kind> --keep palette,type --out .taste-skill/app`, and build it with assets/app.css and assets/charts.js), put the attribute `data-ui` on its root, and crop or scale it the way the blueprint treats a photograph: a full-bleed close crop, a tile, the fixed half of a split. Where a fragment makes no sense, use a flat colour field with type on it. Never a fake dashboard of grey bars, never a device frame. **The interface sits in the page\'s own ground:** in the page\'s colours (the app style dealt with `--keep palette`), cropped, or bleeding off an edge of the screen or of its section, with at most one framed window on the whole page (the replay\'s, when one is dealt). Never the template every model builds: a black ground with a white interface slab in every section. Never form controls as decoration: a switch, checkbox or slider appears only where it does what the product does, never as a row of greyed toggles. ' + (heroMode(s) !== 'type-only' && heroShowsLarge(s.hero) ? 'The first screen shows the product large (at least half the screen), in the picture slot the hero blueprint sets,' : `The first screen of this sheet is ${heroMode(s) === 'type-only' ? 'set in type' : 'one whose picture is small'} (a direction taken by choice; a dealt one never is), so the product comes large (at least half the screen) in the first section after it, before anything else,`) + ' at a size a visitor can read (labels 12px or more, its main text 14px or more; crop to fewer rows rather than shrink it). Further down, at least one more large picture that is not interface: a photograph or an object that carries the product\'s idea (for a notes app, a card catalogue), or a large figure. Never more than two sections in a row built from interface cards: a page of dark cards on a dark ground reads as one long screenshot. If the product works on something physical (ships, plants, buildings, a city), one real picture of that world can carry a section: find it with `' + ASSETS_CMD + ' "<that world>"`, download it with `--get`, credit it in the Image credits dialog if its licence asks, and never let it pass for the product or its customers.',
    'no-product-photo': '**There are no photographs of this product, so its kind carries the pictures.** A visitor must see what the thing is: show the product type large, in real photographs of that kind of product in use (a cargo bike loaded at a city kerb, a kettle on a lit hob), ' + (heroMode(s) !== 'type-only' && heroShowsLarge(s.hero) ? 'in the hero, where the product fills about half the hero or more (never a small figure in a landscape), and in one or two sections after it' : `in the first section after the first screen (${heroMode(s) === 'type-only' || heroNoPicture(s.hero) ? 'the first screen dealt here is set in type' : heroSkyLed(s.hero) ? 'the first screen dealt here sets its subject small under open sky' : 'the picture the first screen dealt here holds is too small for it'}), where the product fills about half the screen or more, and in one or two sections after it`) + '. Find them in the open collections (`' + ASSETS_CMD + ' "<the kind of product> in use"`), sharp and of one light, credited in the Image credits dialog when the licence asks, and pick ones where no other maker\'s name or logo shows and that look like the brief\'s description (its shape, material, colour); one that contradicts it is left out. **The brief decides what the product is, never the photographs found:** a two-wheeled cargo bike stays two-wheeled, and a photograph of a trike is left out, never a reason to rewrite the product, its specifications or its words (one page turned its bike into a trike to match its stock photographs). **The kind looks alike in every picture:** the same configuration and build (all long-tail cargo bikes, or all with a box in front; all gooseneck kettles), of a similar colour, never a different maker\'s design in each. One good photograph of the right kind, shown large and once more as a close crop of a detail (the loaded box), beats three of three different vehicles. **At least one picture shows it in use with the people it is for** (a parent riding with two children in the box, the children from behind or far off), never only the product parked in an empty street. If no photograph of the right kind exists, show fewer pictures and let type and the product\'s own facts carry the page (the first screen set in type, the specifications large), and say so in the report. They show the kind, never this model: no name, price or claim of this product is set on one as if it were the product itself. If you have an image tool, generate the product as it really is (its shape, material and colour from the brief) instead, and say so in the report. A picture of what the name means (the bird or the animal the brand is named after) never stands in for the product: the name lives in the words, the product in the pictures. Never a drawn illustration of the product (references/imagery.md §8). In your report, say that these are not the client\'s photographs, which slots they fill, and that the client\'s own product photography should replace them.',
    atmosphere: '**The project has no photographs of its own yet.** Plan the set before building: three to six sharp pictures of one family (one light, one treatment) that show the subject\'s world, reused at different crops instead of a new picture for every slot. They show the world around the client and never pass for its people, its team or its customers. Where no honest picture exists, leave the slot to type and space; never a drawn illustration in its place (references/imagery.md §8). List every picture and its source in your report.',
    own: '**Use the images that belong to the project in every picture slot.** For slots they cannot fill, the dealt photographs or sharp photographs of the subject\'s world come next.',
  };
  p(MODE[s.imagery || 'atmosphere']); p();
  // Rooms, dishes and products are shown, not boxed: Hvit (r6-p30) set its five rooms as grey spec panels
  // the library has almost no rooms (one bedroom among its tables), so rooms come from the open collections
  // N listed, N pictures: Hvit (r7-p35) listed four rooms and pictured one, with a blurred mug and a stock dining set
  const SHOWN = {
    hospitality: ['room', 'Every room the page lists has its own photograph of that kind of room (the bed under its window, the view out of it), matched to its details', `the open collections (\`${ASSETS_CMD} "<that kind of room>"\`)`, 'a grey spec panel, a tab or a filled box', 'its facts (bed, size, view, rate)', 'the house', 'four rooms', 'list the kinds of room the house has, two or three, each with its picture'],
    restaurant: ['dish', 'Every dish the page features has its own photograph of that dish as served (the menu itself stays a list of names and prices)', `the library (\`node <skill>/scripts/draw.mjs --photos interior-and-table\`) or the open collections (\`${ASSETS_CMD} "<the dish>"\`)`, 'a filled box or a coloured panel', 'its name and price', 'the restaurant', 'three dishes', 'feature the dishes you can show and leave the rest to the menu list'],
    ecommerce: ['product', 'Every product the page sells has its own photograph', `the library (\`node <skill>/scripts/draw.mjs --photos object-still\`) or the open collections (\`${ASSETS_CMD} "<the product>"\`)`, 'a filled box or a grey panel', 'its name and price', null, 'six products', 'show the products you can picture and name the others in one plain line'],
  }[s.input.sector];
  if (SHOWN) {
    const [what, each, where, box, facts, place, eg, fewer] = SHOWN;
    const whats = what === 'dish' ? 'dishes' : what + 's';
    p(`**Each ${what} is shown, not boxed: as many pictures as ${whats} listed.** ${each}: the client's own where they exist; otherwise a real photograph of that kind of ${what}${s.imagery === 'no-product-photo' ? ', as above' : ` from ${where}`}, all in one light, and the report lists each as a stand-in for the client's own. A section that lists ${eg} shows ${eg.replace(/ \w+$/, '')} photographs, one beside each, never one picture for the lot or a detail (a mug, a corner) in place of the ${what}; with fewer good pictures, ${fewer}, rather than a ${what} without its picture. Never ${box} in place of the picture: ${facts} sit beside or under the photograph, on the page's ground.${place ? ` A stand-in sits beside the ${what} it stands for, never as the first picture of ${place}.` : ''}`);
    p();
  }
  p(SOURCES); p(); p(d.imagery);
  const cliche = clicheFor(s.input);
  p(); p(`**Pictures: fewer, better, larger (the inspector checks them).** Three to eight pictures that show this subject, each requested at least 1.5 times the size it is shown (twice for the hero), all with the treatment dealt in section 0. Before placing one, look at it: if it is soft, random, or could belong to any site, leave the slot out instead.${cliche ? ` Not the category's stock shot (${cliche}) unless it is art-directed for this page; ${isSoftware(s.input) ? 'the product\'s own interface and the customer\'s world come first' : 'the client\'s own place, people at work and the product in use come first, and without the client\'s own, the work in close-up'} (references/imagery.md §2).` : ''}` + ' No thumbnails inside sentences, no pictures inside headlines, no small pictures filling a gap, no caption under a picture unless it says something the visitor needs. SVG drawings do not count as pictures. Every file the page asks for exists: a `src`, a `srcset` crop or a CSS background that is not there fails (`missing-image`). Words on a photograph sit on its calm part, of one tone, at 1440, 768 and 390 alike, since the crop moves as the screen narrows (`text-on-photo`). Video only as section 0 deals it.');
  if (s.photos) {
    p();
    p(s.imagery === 'interface' ? `Optional atmosphere, two at most, from the "${s.photos.title || s.photos.set}" set (${s.photos.note}). The page does not need them.` : `Photographs dealt for this build, from the "${s.photos.title || s.photos.set}" set (${s.photos.note})`);
    p('They are real photographs (Unsplash licence, no credit needed, served by picsum.photos) of places, light and texture: atmosphere,');
    p('never a stand-in for a person or an interface, and a room, dish or product only as this section says. List the ones you use in your report so they can be replaced.');
    const colour = s.colourPictures ?? picturesCarryColour(s.input);
    const brightName = nameColours(s.input.brief).lean === 'light';
    if (s.photos.treatment) p(brightName && /dark|dim|brightness|scrim|overlay/i.test(s.photos.treatment) ? 'Treatment: bright and untouched, never darkened, dimmed or under a scrim: the client\'s name asks for light (section 4); text goes on a picture\'s calm pale part, or beside it.' : colour && /gr[ae]yscale|black-and-white/i.test(s.photos.treatment) ? 'Treatment: every photograph in full colour, never greyscale (on this page the pictures carry the colour).' : `Treatment: ${s.photos.treatment}`);
    else if (brightName) p('Treatment: bright and untouched, high-key, never darkened, dimmed or under a scrim (section 4).');
    // one treatment for every picture (references/imagery.md §6): a black-and-white file is listed only where section 0
    // deals the black-and-white treatment, so a page in colour never mixes the two (nor does --redraw photos)
    for (const ph of s.photos.photos.filter((x) => !x.mono || s.frame?.treatment?.id === 'mono')) p(`- \`https://picsum.photos/id/${ph.id}/1600/1000\` — ${ph.alt} · ${ph.tone} tone · ${(ph.colours || []).join(', ')}${ph.mono ? ' · black-and-white' : ''}${ph.sameKind ? ' · **may show this kind of product: if it does, show it as the kind in use, never named or priced as this model**' : ''}${ph.calm && ph.calm !== 'none' ? ` · calm area: ${ph.calm}` : ''} · native ${ph.ratio >= 1.15 ? 'landscape' : ph.ratio <= 0.87 ? 'portrait' : 'square'} · photo: ${ph.by}${clichePhoto(s.input, ph.alt) ? ' · **the stock shot named above: leave it out unless art-directed**' : ''}`);
    p('The last two path numbers are width and height: request the exact crop you render (`/1200/1500` for a 4:5 portrait, `/2400/1350` for a hero) and');
    // a page with no photographs of its product is not filled with whatever was dealt (Haulet's cargo bikes got a honey
    // dipper and a teapot): with none of its kind here, these are for the world around it at most
    const kindShown = s.photos.photos.some((ph) => ph.sameKind);
    const howMany = s.imagery === 'interface' ? 'Use at most two.' : s.imagery === 'no-product-photo' ? (kindShown ? 'Use the ones marked as this kind of product first, and one or two others for the world around it at most.' : 'None of these shows the product: use one or two for the world around it, or none.') : 'Use three to six of them, not all eight.';
    p((colour ? 'keep them in colour; a black-and-white file from anywhere else is left out too (references/imagery.md §6). ' : s.frame?.treatment?.id === 'mono' ? 'add `?grayscale` for the black-and-white treatment section 0 deals. ' : 'keep them as shot. ') + howMany + ' Always set `width`, `height`, `alt` and `loading="lazy"` (not on the hero image).');
    if (s.photos.others?.length) p(`Other sets that fit this brief: ${s.photos.others.join(', ')} — \`node draw.mjs --photos <set>\` prints one in full; \`--photos list\` shows all sets. Taking photographs from another set is your call and is not a redraw; keep them to one light and one treatment.`);
  } else if (d.photos === false) {
    p(); p('This direction does not lead with photographs: use the few pictures the content really needs, where the direction allows them.');
  }
  p();
  const adjust = (bp) => { const n = adjustments(bp, s); if (n.length) { p(); p('Adjusted for this page:'); for (const x of n) p(`- ${x}`); } };
  p(`## 6. Hero — ${s.hero.name}`); p(s.hero.blueprint); p(); p(`On a phone: ${s.hero.mobile}`); if (s.hero.headline) p(`Headline: ${s.hero.headline}`);
  // r9-p44 was dealt the object on a plain ground and built the stack every model builds (the judge: any café)
  const sceneHero = (s.scenes || []).some((x) => x.carries === 'hero');
  p(`**Within the house rules and the adjustments under it, this geometry is binding:** what is large, where the words sit and how the picture is cut, in the dealt type and colour; where section 2 describes the first screen otherwise, this is it${sceneHero ? '. The scene in section 9 sets the first screen\'s picture and its motion; the words keep their places here' : ''}. Its largest type carries the page's own idea (the Headline above says how) or, for a name whose meaning the page is built on (Klee is clover), the name; never a bare category line with nothing of this client in it. Never the template stack of a centred headline, a line under it, two actions and a photograph card with round corners under or beside them (\`template-hero\`).`);
  if (s.hero.split) p('**A split hero takes a large headline:** beside a picture that holds half the screen, the `h1` is 72px (5vw) or more at 1440, on two lines at most, so about 26-30 characters. If the words cannot be that large in their part, the picture goes full-bleed behind them instead; never a small headline in a 50/50 split, which reads as a shop template.');
  adjust(s.hero); p();
  p('## 7. Sections, in order');
  p('**Words: the whole page is about 300-500 words, a section about 20-80.** Award sites carry about 27 words a screen. Say each thing once, as a fact: one heading per idea, never a heading that restates the one above it or a label repeated over every step (`restated-heading`, `repeated-label`).');
  p('Each is one example of a shape for this section: keep what is large and what sits beside what, and let the real content decide the');
  p('details (sizes from the six steps, colours from section 4, corners from section 0). Re-order or drop a section when the argument of the');
  p('page needs it (see references/copy.md), never to fall back to a card grid. A section a scene carries (section 9) is that scene.');
  const visitText = visitBlock(s); if (visitText) { p(); p(visitText); }
  s.sections.forEach((sec, i) => {
    p();
    if (sec.role === 'footer' && s.frame) { const visit = visitNote(s, s.frame.footer.text); p(`### ${i + 1}. footer — as dealt in section 0`); p(`${s.frame.footer.text}${visit ? ` ${visit}` : ''}`); return; }
    // the replay's stage is the last thing in its section and is held (replay-not-held): no second shape around it
    if (s.replay && sec.role === s.replay.carries) { p(`### ${i + 1}. ${sec.role} — the product replay (section 8)`); p('This section is the replay\'s held stage: the heading that states the promise, the window, one sentence and the Replay button, with nothing after them. No other shape is built here.'); return; }
    if (!sec.blueprint) { p(`### ${i + 1}. ${sec.role}`); p('No blueprint in the library for this role. Compose it from the direction above, using a layout shape not used by its neighbours.'); return; }
    p(`### ${i + 1}. ${sec.role} — ${sec.name} (${sec.shape})`); p(sec.blueprint); if (sec.mobile) p(`On a phone: ${sec.mobile}`); adjust(sec);
  });
  p();
  if (s.motion || s.entrance || s.replay) {
    p(`## 8. Motion${s.replay ? ' — the product replay' : s.motion ? ` — ${s.motion.name}` : ''}`);
    if (s.replay) replayBlock(s.replay, s, p);
    else if (s.motion) { p(s.motion.description); p(`This is the signature move, the one loud moment. Around it the page still needs the rest of the motion layer (SKILL.md step 9): ${s.entrance ? 'the entrance below' : 'a quiet entrance on the first screen (never a fade on every section)'} and feedback on every control; video only as section 0 deals it. The inspector fails a page that barely moves. Recipes: references/motion.md.`); }
    if (s.entrance) entranceBlock(s.entrance, s, p);
    p();
  }
  if (s.scenes?.length) {
    p('## 9. Scroll scenes');
    const one = s.scenes.length === 1;
    const toBuild = s.scenes.filter((x) => x.technique).length; const tested = s.scenes.length - toBuild;
    const kinds = !toBuild ? 'tested and ready to fill' : one ? 'a researched technique to build fresh' : `${['', 'one', 'two'][tested] || tested} tested and ready to fill, and one researched technique to build fresh`;
    p(`${s.replay ? `One scroll scene, ${kinds}; the big moment is the product replay (section 8).` : one ? `The page's big moment: one scroll scene, ${kinds}.` : `The page's big moments: ${s.scenes.length} scroll scenes, ${kinds}.`} ${one ? 'It is part of the composition, so build it in step 6 with the section it carries' : 'They are part of the composition, so build them in step 6 with the section they carry'}, not as a motion afterthought. ${one ? 'It runs' : 'Each runs'} on the shared stage (assets/scenes/stage.js and stage.css, with GSAP and Lenis from the pinned CDN lines in stage.js) and ships its own finished composition for reduced motion and for phones that rest. How to put one on a page, fill it and check it: references/scenes.md. Check them with \`node <skill>/scripts/scenes.mjs <page>\` and look at every sheet.`);
    const held = s.scenes.reduce((t, x) => t + (x.hold || 2), 0);
    p(`**The length budget.** ${s.scenes.length === 1 ? 'This scene holds' : 'Together these scenes hold'} about ${+held.toFixed(1)} screens of scroll (a scene's section is its hold plus one screen tall). A scene replaces the content of the section it carries: it is that section, not extra screens in front of it, and it never adds screens of nothing. The whole page still runs about 12-16 screens at 1440 (the inspector's header counts them), so build the other sections to their content and keep each hold to the beats it has.`);
    p(`**The ${tested ? 'demo' : 'example'} is not the content.** ${tested ? "Each scene's demo page is a working example for a made-up client: its town, its photographs, its map, its object and its words are placeholders." : "The direction a technique gives is written for another client: its business, its objects and its words are examples."} Every picture, word and drawn thing in your scene comes from this subject (your inventory, SKILL.md step 1): a route map shows the real route with its real coast, water and relief; a fly-through passes through this client's own work; a quote is the client's own words. A scene that still shows the ${tested ? "demo's" : "example's"} content${tested ? ', or the stand-in a script draws when it is given nothing (the route\'s bare ground with only the road, the plain jet),' : ''} is unfinished.`);
    if (fewPictures(s.input) && s.scenes.every(lightScene)) p(`**This page is short of pictures of its own subject, so ${one ? 'its scene needs' : 'its scenes need'} no photograph or one.** Fill ${one ? 'it' : 'them'} from the words and the product's own facts; a scene's one picture may be a photograph the page already shows, at another crop. If even that cannot be filled, \`--redraw scenes\` deals another of the same kind before any that needs more.`);
    for (const sc of s.scenes) {
      p();
      if (sc.technique) { techniqueBlock(sc, s, p); continue; }
      const what = sc.carries === 'hero' ? 'the first screen' : `the ${sc.carries} section`;
      p(`### ${sc.name} (\`${sc.id}\`) — ${sc.position === 'transition' ? `the hand-over into ${what}` : `carries ${what}`}`);
      p(`${sc.summary}${sc.hold ? ` Hold: ${sc.hold} screen${sc.hold === 1 ? '' : 's'}${sc.defaultHold > sc.hold ? ` (set \`data-options\` hold to ${sc.hold}, or the lowest value the scene allows; its default is ${sc.defaultHold})` : ''}. Every frame of the hold must read as a finished layout: no word split into flying letters, no title sliced by a mask, nothing that looks broken halfway; on a phone a heading set in letters is whole wherever the scroll stops (\`letters-mid-reveal\`), and below 600px a list laid over the picture drops into the flow under it, never clipped by the stage (\`clipped-text\`).` : ''}`);
      if (sc.place) p(`Where: ${sc.place}`);
      if (sc.carries === 'work' && !sc.byRole?.work) p('On the work, the scene is the work: four to six pieces, each stopped flat and large with its own title under it for half a screen, each linking to its piece; the rest go to a plain index under the scene.');
      if (sc.byRole?.[sc.carries]) p(sc.byRole[sc.carries]);
      if (sc.content) p(`Content: ${sc.content}`);
      if (sc.options) p(`Options (data-options): ${sc.options}`);
      // a scene that shades its picture for white type keeps it bright for a client named for a light
      const shades = [...String(sc.options || '').matchAll(/\b(shade|dim)\s+0?\.\d+/g)].map((m) => m[1]);
      if (shades.length && nameColours(s.input.brief).lean === 'light') p(`For this client's bright pictures (section 4): set ${shades.map((x) => `\`${x}\``).join(' and ')} to 0, and put the words in the ink on the picture's pale calm part.`);
      p(`Files: \`<skill>/assets/scenes/${sc.id}.js\` and \`${sc.id}.css\`; a working example (its content is a placeholder): \`<skill>/assets/scenes/demo/${sc.id}.html\`.${sc.phone ? ' On a phone: ' + sc.phone : ''}`);
    }
    p();
    p('Leave a quiet section between two scenes so each one lands. A scene whose content you cannot fill honestly is redrawn (`--redraw scenes`), never faked; scenes are redrawn twice at most, and after that you take one that fits by id or build without one (`--redraw scenes=none`): one honest scene, or none, beats a fifth redraw. A page with scenes is long: keep the navigation, or at least the one action, in reach on every screen (references/layout.md §7).');
    p();
  } else if (s.noScenes) {
    p('## 9. Scroll scenes');
    // an entrance where nothing arrives is not motion
    const moves = [s.entrance && s.entrance.family !== 'still' && `the entrance (${s.entrance.name})`, s.replay && `the product replay (${s.replay.name})`, !s.replay && s.motion && s.motion.id !== 'stillness' && `the signature move (${s.motion.name})`, s.frame && s.frame.clip.id !== 'none' && 'the moving picture section 0 deals'].filter(Boolean);
    const and = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}` : xs[0]);
    p(`**None: this page is built without a scroll scene** (\`--redraw scenes=none\`): no scene could be filled honestly. ${moves.length ? `Its motion comes from ${and(moves)}: build ${moves.length > 1 ? 'them' : 'it'} with care, with feedback on every control, and put no pinned stretch in place of a scene.` : 'Nothing else dealt here moves (the entrance is one where nothing arrives): take a moving one with `--redraw entrance`, since the inspector fails a page that barely moves, and put no pinned stretch in place of a scene.'}`);
    p('**The length budget drops:** about 8-12 screens at 1440 (the study\'s median page is 8.7; references/layout.md), every section built to its content, with no stretch held for a scene.');
    if (s.lightOptions?.length) p(`**A scene that needs no photograph, or one, still fits this page:** ${s.lightOptions.map((id) => `\`${id}\``).join(', ')} (\`node draw.mjs --list scenes\` and \`--list techniques\` say what each is). Before building without one, take one of them with \`node draw.mjs --redraw scenes=<id>\` (taking one by id is not one of the two redraws) and fill it from the words and the one picture you have; none is for a page that cannot fill even these, and the report says why.`);
    p();
  }
  if (d.richness) { p('## 10. Where the richness comes from'); p(d.richness); p(); }
  if (d.pitfalls) { p('## 11. How this direction goes wrong'); p(d.pitfalls); p(); }
  if (s.references?.length) {
    p('## 12. Real references');
    p('Studied sites that work this way. Take the principle, never the specifics: no names, copy, images or signature assets of theirs.');
    for (const r of s.references) p(siteCard(r, false));
    p('Full notes on any of them: `node draw.mjs --site <id>`.'); p();
  }
  p('## Always');
  p('Headlines two lines or fewer at every width. No eyebrow labels, no monospace, no 01/02/03, no thin rules, no gradients, no shadows at rest,');
  p('no cream-and-terracotta, no violet. The frame: one h1 on the first screen that says what this is, equal outer margins, no');
  p('section huddled on one side with the other half empty, no blank stretch over half a screen, a heading on every section. No picture inside a');
  p('headline or a sentence, no headline in a card, no centred stack of headline, line, two actions and photograph card, no giant name or');
  p('email anywhere, no credits in the footer, no drag or progress bars or range sliders, no switch or checkbox that changes nothing and no');
  p('line with a knob or dots on it, no page built from boxes, no bento grid, no wall of tiles in several fills and no list drawn as boxes, no');
  p('heading alone in its column or on its screen, no drawn diagram or chart outside a product fragment, one accent hue, few words, running,');
  p('list and table text 16px or more.');
  p('`inspect.mjs` measures all of it.');
  if (s.allow?.length) p(`This direction is allowed: ${s.allow.join(', ')} (the inspector reads this from the saved sheet).`);
  p();
  p(`Saved to ${sheetPath.split('\\').join('/')} · reprint with \`node draw.mjs --show\``);
  return o.join('\n');
}
