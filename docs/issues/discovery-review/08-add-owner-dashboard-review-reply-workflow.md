# Add owner dashboard review reply workflow

Type: AFK

User stories covered: 22, 23, 25, 26, 37

## Parent

`docs/DISCOVERY_REVIEW_PRD.md`

## What to build

Add a concise owner dashboard workflow where authenticated owners can see reviews for their own restaurants and reply to them as official business answers. The dashboard should stay focused on owner-owned restaurants and avoid broad moderation features.

## Acceptance criteria

- [ ] Owner dashboard review reply workflow lists only reviews for restaurants owned by the authenticated owner.
- [ ] Owners can answer a review from the dashboard.
- [ ] Dashboard-created answers appear as official business answers in public review threads.
- [ ] Owners cannot view reply actions for restaurants they do not own.
- [ ] Empty states explain when owned restaurants have no reviews needing replies.
- [ ] Submission errors are specific and visible.
- [ ] Backend tests cover owner-owned review filtering and permission boundaries.
- [ ] Frontend tests or documented manual verification cover the dashboard reply flow.

## Blocked by

- Blocked by `01-align-restaurant-scoped-review-threads.md`
- Blocked by `06-highlight-owner-answers-in-public-review-threads.md`
