import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let isFirebaseInitialized = false;

// Attempt to initialize Firebase Admin SDK
try {
    // Look for the service account key in the backend root directory
    const serviceAccountPath = path.join(__dirname, '..', 'firebase-adminsdk.json');
    
    if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        
        isFirebaseInitialized = true;
        console.log("🔥 Firebase Admin SDK initialized successfully.");
    } else {
        console.warn("⚠️ Firebase Admin SDK config not found (firebase-adminsdk.json). Push notifications are disabled.");
    }
} catch (error) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", error);
}

/**
 * Sends a push notification to one or multiple device tokens
 * @param {string|string[]} tokens - Single FCM token or array of tokens
 * @param {object} payload - Notification payload { title, body, data }
 * @returns {Promise<any>} Response from Firebase
 */
export const sendPushNotification = async (tokens, payload) => {
    if (!isFirebaseInitialized) {
        console.log("Firebase not initialized. Simulating push notification:", payload.title);
        return { success: false, simulated: true };
    }

    if (!tokens || (Array.isArray(tokens) && tokens.length === 0)) {
        return { success: false, reason: "No tokens provided" };
    }

    try {
        const message = {
            notification: {
                title: payload.title,
                body: payload.body,
            },
            data: payload.data || {},
        };

        if (Array.isArray(tokens)) {
            // Multicast to multiple devices
            const response = await admin.messaging().sendEachForMulticast({
                ...message,
                tokens: tokens
            });
            console.log(`Push notification sent to ${response.successCount} devices. failed: ${response.failureCount}`);
            return response;
        } else {
            // Send to single device
            const response = await admin.messaging().send({
                ...message,
                token: tokens
            });
            console.log("Push notification sent single device.");
            return response;
        }
    } catch (error) {
        console.error("Error sending push notification:", error);
        return null;
    }
};

export default {
    sendPushNotification
};
