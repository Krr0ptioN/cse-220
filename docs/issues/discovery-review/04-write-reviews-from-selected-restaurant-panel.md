# Write reviews from selected restaurant panel

Type: AFK

User stories covered: 13, 14, 15, 16, 36, 37

## Parent

`docs/DISCOVERY_REVIEW_PRD.md`

## What to build

Let authenticated users write a top-level rating and review from the selected restaurant review section. The flow should validate required fields, guide unauthenticated users to sign in, show submission errors, and update the visible selected restaurant reviews after success.

## Acceptance criteria

- [ ] Authenticated users can submit a rating and review from the selected restaurant review section.
- [ ] The form validates missing rating, invalid rating, and insufficient review content.
- [ ] Unauthenticated users see a clear sign-in path instead of a failing submission.
- [ ] Successful submission adds the new review to the selected restaurant review section or refreshes the list.
- [ ] Failed submission shows a specific error message.
- [ ] Top-level review creation updates restaurant review count and average rating as expected.
- [ ] Backend tests cover authenticated creation, validation failures, unauthenticated behavior, and aggregate updates.
- [ ] Frontend tests cover validation and user-visible success/error behavior where the project setup supports it.

## Blocked by

- Blocked by `01-align-restaurant-scoped-review-threads.md`
- Blocked by `02-open-selected-restaurant-reviews-from-map-markers.md`
