## Firestore Security Rules for Transaction Chat

To ensure the transaction chat functionality works properly, make sure your Firestore security rules allow the necessary operations:

### Required Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Messages collection - for transaction chat
    match /messages/{messageId} {
      allow read, write: if request.auth != null &&
        (resource == null || resource.data.profileId == request.auth.uid);
    }

    // Transactions collection - for transaction records with chat
    match /transactions/{transactionId} {
      allow read, write: if request.auth != null &&
        (resource == null || resource.data.userId == request.auth.uid);
    }

    // Sessions collection - for chat sessions
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null &&
        (resource == null || resource.data.profileId == request.auth.uid);
    }

    // User profiles collection
    match /user_profiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Products collection
    match /products/{productId} {
      allow read, write: if request.auth != null &&
        (resource == null || resource.data.userId == request.auth.uid);
    }

    // Notifications collection
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null &&
        (resource == null || resource.data.userId == request.auth.uid);
    }
  }
}
```

### Firestore Indexes

You may need to create composite indexes for optimal query performance:

1. **Messages Collection**:

   - `sessionId` (ASC) + `messageOrder` (ASC)
   - `transactionId` (ASC) + `messageIndex` (ASC)

2. **Transactions Collection**:

   - `userId` (ASC) + `created_at` (DESC)
   - `store_id` (ASC) + `created_at` (DESC)

3. **Sessions Collection**:
   - `profileId` (ASC) + `createdAt` (DESC)

### How to Apply

1. **In Firebase Console**:

   - Go to Firestore Database
   - Click on "Rules" tab
   - Update the rules with the code above
   - Publish the rules

2. **For Indexes**:
   - Firebase will usually prompt you to create indexes when you run queries
   - Alternatively, go to "Indexes" tab in Firestore console
   - Create the composite indexes listed above

### Testing Security

After applying rules, test:

1. Authenticated users can save/load their own messages
2. Users cannot access other users' messages
3. Transaction chat data is properly secured
4. All CRUD operations work as expected

The rules ensure that users can only access their own data while allowing the transaction chat functionality to work properly.
