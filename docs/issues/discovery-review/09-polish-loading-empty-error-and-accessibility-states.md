# Polish loading, empty, error, and accessibility states

Type: AFK

User stories covered: 10, 11, 12, 13, 33, 34, 35, 36, 37

## Parent

`docs/DISCOVERY_REVIEW_PRD.md`

## What to build

Tighten the final user-visible states across the discovery review flow after the core interactions exist. This slice should make the experience coherent across desktop, mobile, authenticated, and unauthenticated states.

## Acceptance criteria

- [ ] Review loading states are visible and do not block unrelated discovery actions.
- [ ] Review fetch failures show a clear retry or recovery path.
- [ ] Empty restaurant review states invite the first review.
- [ ] Unauthenticated review, comment, answer, and reaction states consistently guide users to sign in.
- [ ] Map markers, close controls, review forms, comment forms, and reaction actions are keyboard reachable.
- [ ] Interactive controls have clear accessible names.
- [ ] Desktop right-side section and mobile bottom sheet follow the same content model.
- [ ] Visual styling is consistent with the rest of the app.
- [ ] Automated tests or documented manual checks cover the final loading, empty, error, and accessibility paths.

## Blocked by

- Blocked by `02-open-selected-restaurant-reviews-from-map-markers.md`
- Blocked by `03-add-mobile-bottom-sheet-review-experience.md`
- Blocked by `04-write-reviews-from-selected-restaurant-panel.md`
- Blocked by `05-comment-on-reviews-with-one-level-threads.md`
- Blocked by `06-highlight-owner-answers-in-public-review-threads.md`
- Blocked by `07-react-to-reviews-from-selected-panel.md`
