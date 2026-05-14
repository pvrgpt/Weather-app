// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// Call this function (e.g., via HTTPS callable or directly in Cloud Functions logs) ONCE
// to make a specific user an admin.
// To make it callable via HTTPS (for easy triggering from browser after deploying):
exports.setAdminClaim = functions.https.onCall(async (data, context) => {
    // Ensure the caller is authenticated (optional, but good practice if you want to restrict who can call this)
    // if (!context.auth) {
    //   throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    // }
    // For super admin calling this, you might check if context.auth.uid is YOUR super admin UID

    const emailToMakeAdmin = data.email; // Pass the email of the user to make admin
    if (!emailToMakeAdmin) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with an "email" argument containing the email of the user to make an admin.');
    }

    try {
        const user = await admin.auth().getUserByEmail(emailToMakeAdmin);
        await admin.auth().setCustomUserClaims(user.uid, { admin: true });
        return { message: `Success! ${emailToMakeAdmin} is now an admin.` };
    } catch (error) {
        console.error("Error setting admin claim:", error);
        throw new functions.https.HttpsError('internal', 'Unable to set admin claim.', error.message);
    }
});

// Helper to check claims (for testing)
exports.checkMyClaims = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    return context.auth.token;
});
