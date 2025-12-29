import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { app } from '../server/app';
import { registerRoutes } from '../server/routes';

// Initialize Firebase Admin
admin.initializeApp();

// Initialize the Express app routes
// Note: In Cloud Functions, this initialization happens on every instance cold start
const initialized = registerRoutes(app);

// Export the Express app as a Cloud Function
// We use a wrapper to ensure routes are initialized before handling requests
export const api = functions.https.onRequest(async (req, res) => {
    try {
        await initialized;
        return app(req, res);
    } catch (error) {
        console.error('Error in Firebase Function wrapper:', error);
        res.status(500).send('Internal Server Error');
    }
});
