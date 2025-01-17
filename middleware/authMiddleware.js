const { db } = require("../firebaseConfig");
const admin = require("firebase-admin");

// Middleware to validate Firebase token
const validateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Check if the user's email is verified
    if (!decodedToken.email_verified) {
      return res
        .status(403)
        .json({ success: false, message: "ERR_EMAIL_IS_NOT_VERIFIED" });
    }

    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: "Invalid token" });
  }
};

const authorizeUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;

    // Check if the user's email is verified
    if (!decodedToken.email_verified) {
      return res
        .status(403)
        .json({ success: false, message: "ERR_EMAIL_IS_NOT_VERIFIED" });
    }

    // Check if the user's status is "Approved" in Firestore
    const userRef = db.collection("users").doc(decodedToken.uid);
    const userSnapshot = await userRef.get();

    if (!userSnapshot.exists || userSnapshot.data().status !== "Approved") {
      return res
        .status(403)
        .json({ success: false, message: "ERR_EMAIL_IS_NOT_APPROVED" });
    }

    // Attach user data to the request
    req.userData = userSnapshot.data();
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: "Invalid token" });
  }
};

module.exports = { validateToken, authorizeUser };
