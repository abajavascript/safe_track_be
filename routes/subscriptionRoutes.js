const express = require("express");
const {
  authorizeUser,
  validateToken,
} = require("../middleware/authMiddleware");
const { saveSubscription } = require("../services/subscriptionService");

const router = express.Router();

router.post("/", validateToken, async (req, res) => {
  try {
    const { subscription, uid } = req.body;

    if (req.body.uid !== req.user.uid) {
      return res.status(403).json({
        success: false,
        message: "Cannot access another user's data",
        req_user_uid: req.user.uid,
        req_body: req.body,
      });
    }

    await saveSubscription(subscription, uid);
    res.status(201).json({ success: true, message: "Subscription saved." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
