const express = require("express");
const {
  validateToken,
  authorizeUser,
} = require("../middleware/authMiddleware");
const {
  getRegions,
  addRegion,
  updateRegion,
  deleteRegion,
} = require("../services/regionService");
const {
  sendNotificationsForRegion,
} = require("../services/subscriptionService");

const router = express.Router();

// Get all regions
router.get("/", validateToken, async (req, res) => {
  try {
    const regions = await getRegions();
    res.status(200).json(regions);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add a new region (Admin only)
router.post("/add", authorizeUser, async (req, res) => {
  if (req.userData.role !== "Admin") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }
  try {
    const region = await addRegion(req.body);
    res.status(201).json(region);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update a region (Admin only)
router.put("/:id", authorizeUser, async (req, res) => {
  if (req.userData.role !== "Admin") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }
  try {
    await updateRegion(req.params.id, req.body);
    res
      .status(200)
      .json({ success: true, message: "Region updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a region (Admin only)
router.delete("/:id", authorizeUser, async (req, res) => {
  if (req.userData.role !== "Admin") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }
  try {
    await deleteRegion(req.params.id);
    res
      .status(200)
      .json({ success: true, message: "Region deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send notifications to all approved users in a region
router.post("/:regionId/notify", async (req, res) => {
  try {
    const { regionId } = req.params;

    // Call the notification service
    await sendNotificationsForRegion(regionId);
    res
      .status(200)
      .json({ success: true, message: "Notifications sent successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
