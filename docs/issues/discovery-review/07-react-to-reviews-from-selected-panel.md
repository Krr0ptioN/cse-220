# React to reviews from the selected panel

Type: AFK

User stories covered: 27, 28, 29, 30, 36, 37

## Parent

`docs/DISCOVERY_REVIEW_PRD.md`

## What to build

Wire like and dislike actions into reviews shown in the selected restaurant review section. A user should be able to like, dislike, switch between reactions, and remove a reaction while seeing updated counts.

## Acceptance criteria

- [ ] Authenticated users can like a review from the selected restaurant review section.
- [ ] Authenticated users can dislike a review from the selected restaurant review section.
- [ ] Liking a review removes an existing dislike from the same user.
- [ ] Disliking a review removes an existing like from the same user.
- [ ] Users can remove their current reaction.
- [ ] Reaction counts update after successful actions.
- [ ] Unauthenticated users see a clear sign-in path before reacting.
- [ ] Backend tests cover like, dislike, switch, remove, and authentication behavior.
- [ ] Frontend tests cover visible count and selected reaction updates where practical.

## Blocked by

- Blocked by `01-align-restaurant-scoped-review-threads.md`
- Blocked by `02-open-selected-restaurant-reviews-from-map-markers.md`
