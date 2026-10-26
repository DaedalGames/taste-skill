# Handoff: taste-skill v2.5 (work in progress, not released)

Branch `v2.5` in `D:\taste-skill` (pushed; last commit 2549095). Main is v2.1.5. Remove this file before merging.

## Where things are

- Plan and every input: `D:\tasteskill-v25\PLAN.md`; progress log `D:\tasteskill-v25\LOG.md`
- Review of 51 v2.1.4 pages: `D:\tasteskill-v25\NIGHT-SHIFT-REVIEW.md`
- Study numbers (124 pro sites, 99 award sites, the friend's 30 builds): `D:\tasteskill-v25\STUDY-NUMBERS.md`; crawls in `D:\aww-study\pro`, `D:\aww-study\whichai` (private, learning only, never commit screenshots)
- Test rounds: `D:\tasteskill-v25-tests` (BRIEFS.md, round1/2-workflow.js, pN folders with VERDICT-roundN.json, PROBLEMS-roundN.json, gallery-v25-rounds-1-2.jpg)
- Tools: `D:\tasteskill-v25\tools` (deal-stats.mjs, replace.mjs, apply-*.mjs, edits-*.mjs), `D:\tasteskill-v25\inspect-all.mjs`, `D:\tasteskill-v25\specimens.mjs`

## What v2.5 changed (so far)

- draw.mjs deals everything, no choosing among options:
  - type from library/fonts.json (lib/type-deal.mjs);
  - restrained palettes (lib/colour-deal.mjs);
  - the frame: navigation, footer, corners, spacing, picture treatment, tool, video (lib/frame-deal.mjs);
  - weighted and loud-gated directions;
  - 5 professional directions and 6 heroes;
  - banned heroes and sections;
  - atmosphere scenes only on loud or creative pages, scene holds capped.
- Inspector (lib/probe-extra.mjs, lib/rules-extra.mjs, plus content measurement in probe.mjs):
  - giant-footer, credit-wall, picture-in-headline, picture-in-sentence;
  - upscaled-picture, colour-sprawl, colour-ground;
  - drag-bar, cut-text, sticky-band, no-nav;
  - dead-scroll, hollow-box, repeated-picture;
  - and more (see RULE_IDS in rules.mjs).
- All 30 scroll scenes pass scenes.mjs (12 repaired).
- SKILL.md and references rewritten to match.

## Test results

Round 1: v2.5 won 3 of 5. Round 2: 3 of 6. Round 3 (the three round-2 losses rebuilt): 2 of 3; Mara Lind (Sonnet) still loses: work slots showed stock skylines, kinetic wordmark ended broken. All fixes are committed (5dabfc2, 0f9a7a3, 7daebfd no drawn illustrations and word budgets, 2549095); the last two are untested.

Judges reward a strong idea and brand world. They mark down:
- long or broken-looking scroll scenes;
- small heroes;
- pictures that do not show the subject;
- hollow boxes;
- colour drift.

## Next

1. Round 4 after the weekly reset (2026-10-31 23:00): Mara Lind on Sonnet again, plus two fresh briefs (a shop, a dev tool) on different models. A 3-build round costs about 6-7% of the weekly limit. Weekly usage was 93% on 2026-10-26; Leon allowed up to 95%.
2. Release only when v2.5 pages clearly beat v2.1 across models. Then:
   - CHANGELOG, README and manifests to 2.5.0;
   - remove HANDOFF.md;
   - PR to main.

## Before every commit

```
node tests/frontmatter.mjs
node tests/text-encoding.mjs
node --test tests/profile-cleanup.mjs tests/inspection-files.mjs
```

Skill descriptions stay `>-` block scalars (and 1024 characters or fewer). Demo media lives on the orphan branch `scene-media`.
