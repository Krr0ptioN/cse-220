# Comment on reviews with one-level threads

Type: AFK

User stories covered: 17, 18, 19, 36, 37

## Parent

`docs/DISCOVERY_REVIEW_PRD.md`

## What to build

Let authenticated users comment on top-level reviews from the selected restaurant review section. Comments should appear directly under the review and remain one level deep so the thread stays easy to scan.

## Acceptance criteria

- [ ] Authenticated users can add a comment under a top-level review.
- [ ] Comments render under the correct review in the selected restaurant review section.
- [ ] The system prevents replies to replies or otherwise keeps the thread one level deep.
- [ ] Unauthenticated users see a clear sign-in path before commenting.
- [ ] Comment validation errors are specific and visible.
- [ ] Comment creation does not change the restaurant average rating or top-level review count.
- [ ] Backend tests cover comment creation, one-level depth enforcement, validation, and aggregate non-impact.
- [ ] Frontend tests cover normalized comment rendering under the correct review.

## Blocked by

- Blocked by `01-align-restaurant-scoped-review-threads.md`
- Blocked by `04-write-reviews-from-selected-restaurant-panel.md`
