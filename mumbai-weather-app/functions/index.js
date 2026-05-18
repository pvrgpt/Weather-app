const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Firebase Admin privileges
admin.initializeApp();

/**
 * Trigger: Runs automatically whenever a NEW document is created in the 'forecasts' collection.
 */
exports.sendWeatherNotification = functions.firestore
    .document("forecasts/{forecastId}")
    .onCreate(async (snap, context) => {
        // 1. Get the newly posted forecast data
        const newForecast = snap.data();
        const forecastText = newForecast.text;

        console.log("New forecast detected! Preparing to send notifications...");

        try {
            // 2. Fetch all device tokens from the 'fcmTokens' collection
            const tokensSnapshot = await admin.firestore().collection("fcmTokens").get();

            if (tokensSnapshot.empty) {
                console.log("No devices registered for notifications. Aborting.");
                return null;
            }

            // Extract just the token strings into an array
            const tokens = [];
            tokensSnapshot.forEach((doc) => {
                tokens.push(doc.id); // Since we saved the token as the document ID!
            });

            console.log(`Found ${tokens.length} registered devices. Sending...`);

            // 3. Construct the Push Notification Payload
            const payload = {
                notification: {
                    title: "🌦️ Mumbai Weather Update",
                    // Show the first 100 characters of the forecast text
                    body: forecastText.length > 100 ? forecastText.substring(0, 100) + "..." : forecastText,
                },
                data: {
                    url: "https://YOUR-WEBSITE-URL.web.app", // Change this to your actual hosted URL!
                }
            };

            // 4. Send the notification to all tokens at once (Multicast)
            const response = await admin.messaging().sendEachForMulticast({
                tokens: tokens,
                notification: payload.notification,
                data: payload.data,
            });

            console.log(`Successfully sent ${response.successCount} messages.`);
            if (response.failureCount > 0) {
                console.log(`Failed to send ${response.failureCount} messages.`);

                // Optional: Clean up old/expired tokens to save database space
                response.responses.forEach(async (resp, idx) => {
                    if (!resp.success) {
                        const failedToken = tokens[idx];
                        console.log(`Removing invalid token: ${failedToken}`);
                        await admin.firestore().collection("fcmTokens").doc(failedToken).delete();
                    }
                });
            }

            return null;
        } catch (error) {
            console.error("Error sending push notifications:", error);
            return null;
        }
    });