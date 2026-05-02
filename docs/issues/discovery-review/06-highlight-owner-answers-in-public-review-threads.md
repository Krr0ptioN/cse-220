# Highlight owner answers in public review threads

Type: AFK

User stories covered: 20, 21, 22, 23, 24, 36, 37

## Parent

`docs/DISCOVERY_REVIEW_PRD.md`

## What to build

Let authenticated owners answer reviews for restaurants they own from the selected restaurant review section. Owner replies should appear as official business answers with distinct presentation, while normal user comments remain standard comments.

## Acceptance criteria

- [ ] Owners can answer reviews for restaurants they own from the selected restaurant review section.
- [ ] Owners cannot create official business answers for restaurants they do not own.
- [ ] Normal users can comment but cannot create official business answers.
- [ ] Business answers render directly under the review with an owner or business label.
- [ ] Business answers use distinct styling from normal user comments.
- [ ] Business answers do not change the restaurant average rating or top-level review count.
- [ ] Backend tests cover owner permission, non-owner rejection, serialized owner-answer distinction, and aggregate non-impact.
- [ ] Frontend tests cover business answer rendering separately from normal comments.

## Blocked by

- Blocked by `01-align-restaurant-scoped-review-threads.md`
- Blocked by `05-comment-on-reviews-with-one-level-threads.md`
