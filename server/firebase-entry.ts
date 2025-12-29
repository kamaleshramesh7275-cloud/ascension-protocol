import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { app } from './app';
import { registerRoutes } from './routes';

// Initialize Firebase Admin
admin.initializeApp();

// Initialize the Express app routes
// registerRoutes returns a Promise<Server>
const routesPromise = registerRoutes(app);

// Export the Express app as a Cloud Function
export const api = functions.https.onRequest(async (req, res) => {
    await routesPromise;
    return app(req, res);
});
