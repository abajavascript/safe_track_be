const express = require("express");
const {
  getUserById,
  existUserById,
  addUser,
  updateUserRole,
  updateUserStatus,
  updateUser,
  getAllUsers,
  getManagers,
  isTableEmpty,
} = require("../services/userService");
const {
  validateToken,
  authorizeUser,
} = require("../middleware/authMiddleware");
const { auth } = require("../firebaseConfig");
const router = express.Router();
const { sendNotification } = require("../services/subscriptionService");

//Should be above "Get self user information" as ottherwise 'managers' is considered as :uid
router.get("/managers", validateToken, async (req, res) => {
  try {
    const managers = await getManagers();
    res.status(200).json(managers);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get self user information
router.get("/:uid", validateToken, async (req, res) => {
  try {
    if (req.params.uid !== req.user.uid) {
      return res
        .status(403)
        .json({ success: false, message: "Cannot access another user's data" });
    }
    const response = await getUserById(req.params.uid);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Check user exists
router.get("/exist/:uid", validateToken, async (req, res) => {
  try {
    if (req.params.uid !== req.user.uid) {
      return res
        .status(403)
        .json({ success: false, message: "Cannot access another user's data" });
    }
    const response = await existUserById(req.params.uid);
    res.status(200).json({ exist: response });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add or update user (accessible by any user for their own UID)
router.post("/add", validateToken, async (req, res) => {
  try {
    if (req.body.uid !== req.user.uid) {
      return res.status(403).json({
        success: false,
        message: "Cannot add or update another user's data",
      });
    }

    // Determine the role
    let role = "User"; // Default role
    let status = "PendingApproval";
    // Check if there are any existing records in the users table
    if (await isTableEmpty("users")) {
      role = "Admin"; // If no users exist, assign Admin
      status = "Approved";
    } else if (req.body.manager_uid) {
      // Fetch the manager's role
      const managerRef = await getUserById(req.body.manager_uid);
      const managerData = managerRef.data;

      if (managerData.role === "Admin") {
        role = "Operator"; // If the manager is Admin, assign Operator
      }
    }

    // Add the user with the determined role
    const userData = {
      ...req.body,
      role,
      status: status, // Default status for new users
    };
    const response = await addUser(userData);

    // Notify the manager
    const message = {
      title: "Pending Approval",
      body: `${userData.name} ${userData.surname} has submitted their information and requires your approval.`,
      icon: "/logo192.png",
    };
    console.log("user add");
    console.log(userData);

    await sendNotification(userData.manager_uid, message);

    res.status(200).json({
      ...response,
      userData,
      success: true,
      message: "User added and notification sent.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update a user
router.put("/:id", validateToken, async (req, res) => {
  if (req.body.uid !== req.user.uid) {
    return res.status(403).json({
      success: false,
      message: "Cannot add or update another user's data",
    });
  }

  delete req.body.role;
  delete req.body.status;
  try {
    await updateUser(req.params.id, req.body);
    res
      .status(200)
      .json({ success: true, message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user role (Admin only)
router.put("/update-role/:uid", authorizeUser, async (req, res) => {
  try {
    if (req.userData.role !== "Admin") {
      return res
        .status(403)
        .json({ success: false, message: "Only Admins can update roles" });
    }
    const response = await updateUserRole(req.params.uid, req.body.role);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user status (Admin or Operator only)
router.put("/update-status/:uid", authorizeUser, async (req, res) => {
  try {
    if (req.userData.role !== "Admin" && req.userData.role !== "Operator") {
      return res
        .status(403)
        .json({ success: false, message: "Only Admins can update roles" });
    }
    const response = await updateUserStatus(req.params.uid, req.body.status);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user list (Admin: all users, Operator: assigned users, Regular User: self only)
router.get("/", authorizeUser, async (req, res) => {
  try {
    const userRole = req.userData.role;
    const userUid = req.user.uid;

    if (userRole === "Admin" || userRole === "Operator") {
      // Admin: Return all users
      const response = await getAllUsers();
      const assignedUsers = response.data.filter(
        (user) =>
          userRole === "Admin" ||
          (userRole === "Operator" && user.manager_uid === userUid) ||
          user.uid === userUid
      );
      //add emails
      // const assignedUsersWithEmails = await Promise.all(
      //   assignedUsers.map(async (user) => {
      //     if (user.email) {
      //       // Use email from Firestore if available
      //       return user;
      //     } else {
      //       // Fetch email from Firebase Auth
      //       const authUser = await auth.getUser(user.uid);
      //       return { ...user, email: authUser.email };
      //     }
      //   })
      // );

      return res.status(200).json({ success: true, data: assignedUsers });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete user (Admin can delete any user; Operator can delete users assigned to them)
router.delete("/:uid", authorizeUser, async (req, res) => {
  try {
    const userRole = req.userData.role;
    const userUid = req.user.uid;
    const targetUserUid = req.params.uid;

    const targetUserRef = db.collection("users").doc(targetUserUid);
    const targetUserSnapshot = await targetUserRef.get();

    if (!targetUserSnapshot.exists) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const targetUserData = targetUserSnapshot.data();

    // Admin can delete any user
    if (userRole === "Admin") {
      await targetUserRef.delete();
      return res
        .status(200)
        .json({ success: true, message: "User deleted successfully" });
    }

    // Operator can delete users assigned to them
    if (userRole === "Operator" && targetUserData.operator_uid === userUid) {
      await targetUserRef.delete();
      return res
        .status(200)
        .json({ success: true, message: "User deleted successfully" });
    }

    return res.status(403).json({ success: false, message: "Access denied" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// router.get("/regions", validateToken, async (req, res) => {
//   try {
//     const regions = await getRegions();
//     res.status(200).json(regions);
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

router.post("/add-or-update", authorizeUser, async (req, res) => {
  try {
    const response = await addOrUpdateUser(req.body);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
