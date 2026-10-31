// tasteskill / business: whether a picture's title or author names a business or a maker. One rule for the two places
// that read credits: assets.mjs notes it on a picture it fetches, and the inspector fails a picture shown as the
// client's own whose credit names one (credit-names-business).

// The business or the maker a title or an author names, or null: a word of the trade beside a name ("Hotel Borg",
// "Flateyri Guesthouse", "Fjordhotell", "Dennis' Coffee"), a hotel word and a name after "at" or "of" ("Hotel room at
// Radisson Blu"), a name before a product word or a model ("Benno longtail bike", "Cintiq 22HD"), a work's author ("...
// by David Revoy"), a company's legal form, a trademark sign. Such a picture is never shown as the client's own
// product, room or work, whatever its credit says (r12-p55, r12-p57 and r12-p58 credited another maker's bike, another
// artist's comic and two hotels' rooms). A title's first word is capitalised anyway, and in a title of capitalised
// words a capital says little; a street or a common noun after the trade word is no name ("Shop Street", "Hotel Room").
// A note to look, never a filter: a name it cannot tell from a place passes ("Espresso at Kaffibarinn").
const BUSINESS_WORD = /^(?:hotels?|h[oó]tel(?:l|li)?|hostel|motel|inn|resort|lodge|guest ?house|gasthof|gasthaus|g[aä]stehaus|pension|pensjonat|gjestehus|gistiheimili\p{L}*|gistih[uú]s|vandrerhjem|restaurant|caf[eé]|bistro|bakery|roaster(?:y|ies|s)?|brewery|winery|showroom|bar|pub|shop|store|studios?|productions?|films|media|agency)$/iu;
const HOTEL_COMPOUND = /^\p{Lu}\p{L}+(?:hotel|hotell|hotelli|h[oó]tel|gasthof|gasthaus|herberge)$/u;
const TRADE_WORD = /^(?:coffee|caf[eé]|bakery|kitchen|bar|bistro|restaurant|hotel|inn|bikes|cycles|shop|store|studio)$/i;
// (a common noun is no name beside a trade word: "Old Tea Shop", "Cafe Racer", "Coffee Culture")
const NOT_NAME = /^(?:street|st|road|lane|square|harbou?r|island|bay|hill|park|beach|avenue|quay|gate|row|place|interior|exterior|rooms?|lobby|entrance|view|terrace|garden|kitchen|counter|sign|front|fa[cç]ade|door|window|bed|suite|staff|menu|table|stools?|chairs?|coffee|tea|wine|beer|book|flower|gift|corner|racer|culture|society|owners?|chain|scene|life)$/i;
// the words for a product of a kind: on a page dealt no photograph of its product, a picture that names one shows
// another maker's (draw.mjs deals none, the inspector fails one)
export const PRODUCT_WORD = /^(?:bikes?|bicycles?|e-?bikes?|longtails?|bakfiets|trikes?|tricycles?|scooters?|chairs?|stools?|sofas?|tables?|lamps?|kettles?|grinders?|mugs?|bowls?|vases?|cameras?|phones?|laptops?|tablets?|displays?|headphones?|helmets?|watch(?:es)?|shoes?|sneakers?|bags?|bottles?)$/i;
// (a word before a product word that names no maker: "Family cargo bike", "Electric bike")
const PLAIN = /^(?:new|old|modern|vintage|classic|electric|family|cargo|city|longtail|front-box|kids?|child(?:ren)?|red|blue|green|black|white|yellow|grey|gray|wooden|oak|steel|ceramic|glass|leather|linen|wool|paper|clay|stone|brass|copper|iron|danish|dutch|german|french|italian)$/i;
// (a word before a code that is no maker: a licence, a camera, a room or a road; "Licence CC0", "Nikon D750", "Room 12B")
const NOT_MAKER = /^(?:licen[cs]e|domain|public|cc|canon|nikon|sony|fuji(?:film)?|leica|pentax|olympus|panasonic|lumix|hasselblad|ricoh|sigma|kodak|gopro|dji|iphone|samsung|pixel|huawei|xiaomi|building|platform|terminal|track|route|line|bus|tram|flight|highway|motorway|autobahn|zone|block|unit|apartment|floor|level|stage|hall|model|type|version|exit|pier|day|no)$/i;
const LEGAL_FORM = /[™®]|&\s*Co\b|\b(?:GmbH|Ltd|Inc|LLC|plc|ApS|SARL)(?![\p{L}])|\s(?:AB|AS|Oy|BV|S\.A\.)(?=\s*(?:$|[,;()]))|\p{Lu}[\p{L}'’-]* & \p{Lu}/u;
export function namesBusiness(title, creator) {
  const t = String(title || '');
  if (LEGAL_FORM.test(t)) return t;
  if (LEGAL_FORM.test(String(creator || ''))) return String(creator);
  const author = t.match(/\bby\s+(?!(?:Night|Day|Morning|Evening|Sea|Lake|River)\b)(\p{Lu}[\p{L}'’-]+(?:\s+\p{Lu}[\p{L}'’-]+)*)/u);
  if (author) return `by ${author[1]}`;
  const words = t.split(/[^\p{L}\p{N}&'’-]+/u).filter(Boolean);
  const cap = (k) => /^\p{Lu}/u.test(words[k] || '');
  // (a title with lowercase words is a sentence: its capitals are names)
  const sentence = words.some((w, k) => k > 0 && /^\p{Ll}{4,}/u.test(w));
  const named = (k) => cap(k) && !BUSINESS_WORD.test(words[k]) && !NOT_NAME.test(words[k]) && (k > 0 || cap(k + 1));
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (HOTEL_COMPOUND.test(w)) return w;
    if (cap(i) && /['’]s?$/.test(w) && TRADE_WORD.test(words[i + 1] || '')) return `${w} ${words[i + 1]}`;
    if (sentence && i > 1 && cap(i) && TRADE_WORD.test(w) && named(i - 1)) return `${words[i - 1]} ${w}`;
    // (a maker's model: letters and figures, or a name and a letter, "Cintiq 22HD", "Babboe Curve-E")
    if ((i > 0 ? named(i) : cap(i)) && !NOT_MAKER.test(w) && !NOT_NAME.test(w) && !BUSINESS_WORD.test(w) && /^(?:(?=\p{L}*\d)(?=\d*\p{L})[\p{L}\d]{3,6}|\p{Lu}\p{Ll}+-\p{Lu}[\p{Lu}\d]{0,2})$/u.test(words[i + 1] || '')) return `${w} ${words[i + 1]}`;
    if (PRODUCT_WORD.test(w)) {
      let j = i - 1;
      while (j >= 0 && i - j <= 3 && ((/^\p{Ll}/u.test(words[j]) && !/^(?:in|at|on|of|and|with|for|by|from|to|a|an|the)$/.test(words[j])) || PLAIN.test(words[j]))) j--;
      // (a title's first word that reads as a verb is no maker: "Parked Bikes outside the station")
      if (j >= 0 && i - j <= 3 && cap(j) && !PLAIN.test(words[j]) && !BUSINESS_WORD.test(words[j]) && !(j === 0 && /^\p{Lu}\p{Ll}{3,}(?:ed|ing)$/u.test(words[j]))) return words.slice(j, i + 1).join(' ');
    }
    if (!BUSINESS_WORD.test(w)) continue;
    if (named(i + 1) && (cap(i) || sentence)) return `${w} ${words[i + 1]}`;
    if (named(i - 1)) return `${words[i - 1]} ${w}`;
    const at = words.slice(i + 1, i + 4).findIndex((x) => /^(?:at|of)$/i.test(x));
    if (at >= 0 && named(i + 2 + at)) return `${w} … ${words[i + 2 + at]}`;
  }
  return null;
}
