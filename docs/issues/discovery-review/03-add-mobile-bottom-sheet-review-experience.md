# Add mobile bottom-sheet review experience

Type: AFK

User stories covered: 5, 6, 8, 10, 11, 12, 13, 33, 34, 35

## Parent

`docs/DISCOVERY_REVIEW_PRD.md`

## What to build

Adapt the selected restaurant review experience for mobile by opening reviews in a bottom sheet when a marker is selected. The bottom sheet should show the same selected restaurant context and review states while preserving a mobile-friendly map discovery flow.

## Acceptance criteria

- [ ] Selecting a marker on mobile opens the selected restaurant reviews in a bottom sheet.
- [ ] The bottom sheet shows restaurant context before the review list.
- [ ] Users can close the bottom sheet and return to map discovery.
- [ ] Loading, error, and empty states are readable in the bottom sheet.
- [ ] The empty state invites the first review when no reviews exist.
- [ ] Focus behavior and accessible names make the bottom sheet usable by keyboard and assistive technology.
- [ ] Frontend behavior tests or documented manual verification cover mobile bottom-sheet selection behavior.

## Blocked by

- Blocked by `02-open-selected-restaurant-reviews-from-map-markers.md`
