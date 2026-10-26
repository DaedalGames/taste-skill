# Handoff: taste-skill v2.5 (work in progress, not released)

Branch `v2.5` in `D:\taste-skill` (pushed). Main is v2.1.5. Remove this file before merging.

- Plan and every input: `D:\tasteskill-v25\PLAN.md`
- Review of 51 v2.1.4 pages (534 issues, 147-item fix list): `D:\tasteskill-v25\NIGHT-SHIFT-REVIEW.md`
- Progress log for this branch: `D:\tasteskill-v25\LOG.md`
- Scroll-scene lab (specs, reviews, scene-shot tool): `D:\scene-lab`
- Test pages and judge verdicts: `D:\tasteskill-v22-tests` (p4-p7 = v2.2 round 1, did not beat v2.1)
- Site study (private, learning only, never commit screenshots): `D:\aww-study`

## Before every commit

```
node tests/frontmatter.mjs
node tests/text-encoding.mjs
node --test tests/profile-cleanup.mjs tests/inspection-files.mjs
```

Skill descriptions stay `>-` block scalars. Demo media lives on the orphan branch `scene-media` (served by jsDelivr), never in the skill folder.

## Release rule

Release v2.5 only when new test pages clearly beat v2.1 pages across models (blind judges). Bump CHANGELOG, README, manifests, then PR to main.
