const admin = require("firebase-admin");
const serviceAccount = require("./firebaseServiceAccountKey");
const webPush = require("web-push");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// VAPID keys
webPush.setVapidDetails(
  "mailto:abajavascript@gmail.com",
  process.env.VAPID_PUBLIC,
  process.env.VAPID_PRIVATE
);

const db = admin.firestore();
const auth = admin.auth();

module.exports = { db, auth, webPush };
