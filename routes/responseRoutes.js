const express = require("express");
const { authorizeUser } = require("../middleware/authMiddleware");
const { saveResponse, getLastStatus } = require("../services/responseService");
const router = express.Router();

// Add a response
router.post("/", authorizeUser, async (req, res) => {
  try {
    // if (req.params.uid !== req.user.uid)
    //   return res
    //     .status(403)
    //     .json({ success: false, message: "Cannot add data for another user" });

    const userUid = req.user.uid;
    const { safety_status, safety_comment } = req.body;

    const responseData = {
      user_uid: userUid,
      safety_status,
      safety_comment,
      response_date: new Date().toISOString().split("T")[0],
      response_date_time: new Date().toISOString(),
    };

    await saveResponse(responseData);
    res
      .status(201)
      .json({ success: true, message: "Response saved successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/status/:uid", authorizeUser, async (req, res) => {
  try {
    const status = await getLastStatus(req.params.uid);
    res.status(200).json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
