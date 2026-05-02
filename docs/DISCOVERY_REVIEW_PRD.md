# Discovery Map Reviews PRD

## Problem Statement

Restaurant discovery currently does not give users a complete map-based review experience. A user can browse restaurant listings and open restaurant details, but the discovery flow does not yet behave like a focused restaurant review app where a map marker leads directly to reviews, comments, and business answers.

Users need to inspect restaurants from the map, read social proof, compare comments, and see how the business responds before deciding where to eat. Business owners need a concise way to answer reviews and make those answers visible as official business responses.

## Solution

Build a MapCN-based discovery experience where restaurants appear as clickable markers on a map. When a user selects a restaurant marker, the app opens a persistent right-side review section on desktop. On mobile, the same experience opens as a bottom sheet.

The selected restaurant review section shows restaurant context, reviews, user comments, likes, dislikes, and highlighted business answers. Users can write reviews, comment on reviews, and react to reviews. Owner comments appear as official business answers when the authenticated owner replies for their own restaurant. Owners can answer reviews from the discovery review section and from a concise owner dashboard reply workflow.

The first version should keep map functionality simple. It should display restaurant markers and support marker selection. It should not add route planning, clustering, live location, complex map layers, or advanced geospatial behavior.

## User Stories

1. As a restaurant discovery visitor, I want to see restaurants displayed as markers on a map, so that I can explore places visually.
2. As a restaurant discovery visitor, I want each marker to represent a real restaurant, so that the map matches the list of available restaurants.
3. As a restaurant discovery visitor, I want to click a restaurant marker, so that I can inspect that restaurant without leaving discovery.
4. As a restaurant discovery visitor, I want a right-side review section to open after selecting a marker, so that I can keep map context while reading reviews.
5. As a mobile visitor, I want marker details to open in a bottom sheet, so that the experience fits a small screen.
6. As a visitor, I want the selected restaurant name, rating, review count, category, and location summary visible in the review section, so that I know which restaurant I am evaluating.
7. As a visitor, I want the selected marker to look active, so that I can tell which restaurant the review section belongs to.
8. As a visitor, I want to close or change the selected restaurant, so that I can continue exploring other restaurants.
9. As a visitor, I want reviews to load only after I select a restaurant, so that discovery stays fast.
10. As a visitor, I want to see a loading state while reviews load, so that I understand the app is fetching review data.
11. As a visitor, I want to see a clear error state if reviews fail to load, so that I know the problem is temporary and not missing content.
12. As a visitor, I want to see an empty review state when a restaurant has no reviews, so that I understand no one has reviewed it yet.
13. As a visitor, I want the empty state to invite the first review, so that I know how to contribute.
14. As a reviewer, I want to write a rating and review from the selected restaurant review section, so that I can share my experience without navigating away.
15. As a reviewer, I want review form validation, so that I know when my rating or comment is incomplete.
16. As a reviewer, I want my submitted review to appear in the selected restaurant review section, so that I can confirm it was posted.
17. As a reviewer, I want to comment on another user's review, so that I can add context or continue the discussion.
18. As a reviewer, I want comments to stay one level deep, so that the discussion remains easy to scan.
19. As a visitor, I want to read comments under each review, so that I can see the conversation around a dining experience.
20. As a visitor, I want business owner replies to be highlighted, so that I can distinguish official answers from normal user comments.
21. As a visitor, I want highlighted business answers to appear directly under the relevant review, so that I can understand what the business is responding to.
22. As a business owner, I want to answer reviews for my own restaurant, so that I can respond to customer feedback.
23. As a business owner, I want my answer to be labeled as an official business answer, so that customers know it came from the restaurant.
24. As a business owner, I want to reply from the discovery review section when I am authenticated as the owner, so that I can respond in context.
25. As a business owner, I want a concise owner dashboard section for review replies, so that I can manage feedback without searching through public discovery.
26. As a business owner, I want the dashboard to show only reviews for restaurants I own, so that I do not see unrelated review management tasks.
27. As a normal user, I want to like a review, so that I can signal useful feedback.
28. As a normal user, I want to dislike a review, so that I can signal unhelpful feedback.
29. As a user, I want like and dislike counts to update after I react, so that the interface reflects my action.
30. As a user, I want liking a review to remove my dislike and disliking a review to remove my like, so that my reaction is unambiguous.
31. As a visitor, I want reviews ordered in a sensible default order, so that recent or relevant feedback is easy to find.
32. As a visitor, I want review pagination or incremental loading, so that restaurants with many reviews remain usable.
33. As a visitor, I want the map and review section to remain visually consistent with the rest of the app, so that discovery feels like one product.
34. As a keyboard user, I want map markers, review actions, and close controls to be reachable by keyboard, so that I can use the feature without a mouse.
35. As a screen reader user, I want marker buttons and review actions to have clear accessible names, so that I understand what each control does.
36. As a user, I want unauthenticated review actions to guide me toward sign-in, so that I know how to continue.
37. As a user, I want review and comment submission errors to be specific, so that I can fix my input or retry.
38. As an admin or maintainer, I want one consistent restaurant-scoped review API contract, so that frontend and backend behavior stay aligned.
39. As a developer, I want review thread data normalized behind a small interface, so that UI components do not depend on backend response quirks.
40. As a developer, I want the map selection logic separated from review rendering, so that each module can be tested independently.

## Implementation Decisions

1. Use MapCN for the map foundation because it fits the React, Tailwind, and shadcn-style component model.
2. Keep map behavior limited to restaurant marker display, marker selection, active marker state, and basic viewport presentation.
3. Do not implement routing, clustering, live geolocation, custom geospatial search, advanced layers, or external navigation behavior in this PRD.
4. Add or modify a discovery map module that receives restaurant summaries and emits selected restaurant changes through a simple interface.
5. Add or modify a selected restaurant review section that renders restaurant context, reviews, comments, business answers, reactions, and review/comment forms.
6. Use a persistent right-side section on desktop rather than a floating hover card or overlay.
7. Use a bottom sheet on mobile for the selected restaurant review section.
8. Fetch reviews, comments, and business answers only after a restaurant is selected.
9. Use one restaurant-scoped review API contract for listing, creating reviews, creating comments, creating business answers, and reacting to reviews.
10. Align frontend and backend route expectations so the app does not depend on mismatched review endpoints.
11. Represent top-level reviews separately from one-level comments and replies.
12. Treat an owner reply as a comment with special business-answer presentation when the reply author owns the restaurant.
13. Do not support deep nested threads in this version.
14. Keep a review thread normalization module as a deep module with a stable interface that converts API responses into UI-ready review threads.
15. Keep map selection state separate from review thread data, so map behavior and review behavior can evolve independently.
16. Allow authenticated users to write reviews, comment on reviews, and react to reviews.
17. Allow authenticated owners to answer reviews for restaurants they own.
18. Highlight owner answers with a business label and distinct styling.
19. Add a concise owner dashboard review-reply workflow that only shows review reply actions for restaurants owned by the signed-in owner.
20. Preserve the existing restaurant detail review functionality where possible, but avoid making the detail page the only way to access reviews.
21. Reuse existing restaurant, user, review, and reaction concepts rather than introducing a separate comments domain unless the current model cannot express the required behavior clearly.
22. Keep validation behavior consistent across reviews, comments, business answers, and reactions.
23. Use clear unauthenticated states for actions that require sign-in.
24. Keep loading, error, empty, and success states visible in the selected restaurant review section.
25. Make the feature accessible through semantic buttons, labels, focus states, and keyboard navigation.

## Testing Decisions

Good tests should verify externally visible behavior and contracts. They should not assert private component state, implementation details, CSS class names, or the internal structure of helpers unless that structure is the public interface of a deep module.

1. Test backend review API behavior for restaurant-scoped review listing and creation.
2. Test backend comment creation under a review.
3. Test backend owner-answer behavior for owner replies to reviews on owned restaurants.
4. Test that owner answers are distinguishable in the serialized response.
5. Test that non-owners cannot create official business answers for restaurants they do not own.
6. Test that normal users can create one-level comments but cannot create official business answers.
7. Test that replies remain one level deep.
8. Test reaction behavior for like, dislike, switching reactions, and removing reactions.
9. Test the aligned restaurant-scoped review route contract used by the frontend.
10. Test review aggregation behavior when top-level reviews are created, updated, or deleted.
11. Test that comments and business answers do not incorrectly change restaurant average rating or top-level review count.
12. Test frontend review normalization with representative API payloads, including empty reviews, user comments, owner answers, and missing optional fields.
13. Test frontend marker selection behavior from the user's perspective: selecting a marker opens the review section for that restaurant.
14. Test frontend empty, loading, and error states for the selected restaurant review section.
15. Test frontend rendering of highlighted business answers separately from normal user comments.
16. Use existing Django endpoint tests as prior art for backend API and permission tests.
17. Use existing frontend utility tests as prior art for pure normalization and flow tests.
18. Add component behavior tests only where the project test setup can exercise user-visible interaction reliably.

## Out of Scope

1. Complex map functionality such as routing, navigation, clustering, live user location, shape drawing, heatmaps, and advanced map layers.
2. Full Google Maps or Yelp feature parity.
3. Deep nested discussion threads.
4. Review moderation workflows beyond owner answers and existing permissions.
5. Photo reviews, media upload, or menu-specific reviews.
6. Recommendation ranking, personalized discovery, or machine-learning-based sorting.
7. Real-time updates through WebSockets or push subscriptions.
8. Full owner reputation management tooling beyond concise review replies.
9. Admin moderation dashboards.
10. Complex analytics or review sentiment analysis.
11. Payment, reservation, ordering, or delivery flows.
12. Internationalization beyond existing app conventions.
13. Native mobile app behavior outside responsive web layout.
