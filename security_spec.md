# Security Specification (TDD) - Duma Pickle

In compliance with the **Philippine Data Privacy Act of 2012 (R.A. 10173)** and the Zero-Trust Architecture guidelines, this security specification establishes the data invariants, threat model ("Dirty Dozen" payloads), and Firestore security rules configuration.

## 1. Data Invariants & Access Tiers

*   **User Profiles (`/users/{userId}`)**: 
    *   Only the authenticated owner of the profile can read or write their own profile document.
    *   `createdAt` and `dpaConsentDate` are immutable after creation.
    *   `dpaConsent` must be `true` and verified.

*   **Reviews (`/reviews/{reviewId}`)**:
    *   Any authenticated player can create a review if `userId` matches their authenticated UID.
    *   Public players can read reviews.
    *   Only the review owner can update or delete their review.
    *   Rating scores must be integers between 1 and 5.
    *   `createdAt` is immutable.

*   **Play Events (`/play_events/{eventId}`)**:
    *   Any authenticated player can create a matchmaking play event if they are the organizer.
    *   `organizerId` must match the authenticated user's UID.
    *   Roster slots (`joinedPlayerIds`, `joinedPlayerNames`) must not exceed the specified `maxPlayers`.
    *   Only the organizer can delete/cancel a play event.
    *   Players can join/leave play events, and this update action is restricted to only modify the roster arrays.

---

## 2. The "Dirty Dozen" Threat Payloads

The following payloads represent malicious attempts to bypass security rules and corrupt the database:

1.  **Identity Spoofing in Profiles**: Writing to `/users/attackerUID` with `uid` set to `victimUID`.
2.  **Unverified Privilege Escalation**: Setting `isAdmin` or other privileges inside a player profile.
3.  **PII Data Harvesting**: Unauthorized reading of other users' profile documents containing email addresses.
4.  **Shadow Field Injection (Review)**: Posting a review with an extra field like `isApproved: true` or `flagged: false` to corrupt schemas.
5.  **Rating Value Poisoning**: Posting a court quality score of `10` or `-5`, or sending a non-integer.
6.  **Review Identity Impersonation**: Posting a review where `userId` is set to another user's UID.
7.  **Unauthorized Review Deletion**: An attacker attempting to delete a review created by another player.
8.  **Play Event Capacity Overflow**: Joining a play event when the roster size exceeds `maxPlayers`.
9.  **Organizer Identity Spoofing**: Scheduling a game where `organizerId` is set to another user.
10. **Unauthorized Game Cancellation**: An attacker trying to delete a game organized by another player.
11. **Roster Hijacking**: Attempting to clear the entire roster array of a play event they don't own.
12. **Temporal Timestamp Corruption**: Creating a review or event with a pre-dated or post-dated client timestamp instead of `request.time`.

---

## 3. The Rules Architecture (Draft)

The rules are built upon attributes and helper validation predicates:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Global Safety Net
    match /{document=**} {
      allow read, write: if false;
    }
    
    // Global helpers
    function isSignedIn() { return request.auth != null; }
    function isEmailVerified() { return request.auth.token.email_verified == true; }
    function isOwner(userId) { return isSignedIn() && request.auth.uid == userId; }
    function isValidId(id) { return id is string && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$'); }
    
    ...
  }
}
```
