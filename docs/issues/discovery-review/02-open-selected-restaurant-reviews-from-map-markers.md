# Open selected restaurant reviews from map markers

Type: AFK

User stories covered: 1, 2, 3, 4, 6, 7, 8, 9, 33, 34, 35, 40

## Parent

`docs/DISCOVERY_REVIEW_PRD.md`

## What to build

Build the desktop discovery flow where restaurants appear as MapCN-based markers and selecting a marker opens a persistent right-side review section for that restaurant. The selected marker should remain visibly active, and changing or closing selection should be clear and keyboard accessible.

## Acceptance criteria

- [ ] Restaurants from discovery data render as clickable map markers.
- [ ] Selecting a marker opens the right-side review section for that restaurant on desktop.
- [ ] Selecting a different marker switches the review section to the new restaurant.
- [ ] The active marker is visually distinguishable from inactive markers.
- [ ] The review section loads review data only after marker selection.
- [ ] Users can close the selected restaurant review section and return to browsing.
- [ ] Marker buttons and panel controls are keyboard reachable and have clear accessible names.
- [ ] Frontend behavior tests verify marker selection opens the correct selected restaurant review section.

## Blocked by

- Blocked by `01-align-restaurant-scoped-review-threads.md`
