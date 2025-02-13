const { db } = require("../firebaseConfig");
const admin = require("firebase-admin");

const isTableEmpty = async (table) => {
  const usersSnapshot = await db.collection(table).get();
  return usersSnapshot.empty;
};

const getUserById = async (uid) => {
  try {
    const userRef = db.collection("users").doc(uid);
    const userSnapshot = await userRef.get();
    if (!userSnapshot.exists) {
      throw new Error("User not found in DB");
    }
    return { success: true, data: userSnapshot.data() };
  } catch (error) {
    throw new Error("Failed to get user: " + error.message);
  }
};

const existUserById = async (uid) => {
  try {
    const userRef = db.collection("users").doc(uid);
    const userSnapshot = await userRef.get();

    if (userSnapshot.exists) {
      return true;
    }
    return false;
  } catch (error) {
    if (error.code === "not-found") {
      return false;
    }
    throw new Error("Failed to check user existence: " + error.message);
  }
};

// Add a new user
const addUser = async (userData) => {
  try {
    const userRef = db.collection("users").doc(userData.uid);
    await userRef.set(userData);
    return { success: true, message: "User added successfully" };
  } catch (error) {
    throw new Error("Failed to add user: " + error.message);
  }
};

const updateUser = async (uid, userData) => {
  try {
    await db.collection("users").doc(uid).update(userData);
    return { success: true, message: "User updated successfully" };
  } catch (error) {
    throw new Error("Failed to update user information: " + error.message);
  }
};

// Update user role
const updateUserRole = async (uid, role) => {
  try {
    const userRef = db.collection("users").doc(uid);
    await userRef.update({ role });
    return { success: true, message: "User role updated successfully" };
  } catch (error) {
    throw new Error("Failed to update user role: " + error.message);
  }
};

// Update user status
const updateUserStatus = async (uid, status) => {
  try {
    const userRef = db.collection("users").doc(uid);
    await userRef.update({ status });
    return { success: true, message: "User status updated successfully" };
  } catch (error) {
    throw new Error("Failed to update user status: " + error.message);
  }
};

// Get all users
const getAllUsers = async () => {
  try {
    const usersSnapshot = await db.collection("users").get();
    const users = [];
    usersSnapshot.forEach((doc) => users.push(doc.data()));
    return { success: true, data: users };
  } catch (error) {
    throw new Error("Failed to get users: " + error.message);
  }
};

const addOrUpdateUser = async (userData) => {
  try {
    const userRef = db.collection("users").doc(userData.uid);

    const managerRole = userData.manager_role === "Admin" ? "Operator" : "User";
    const newStatus = userData.status === "Pending" ? "Pending" : "Approved";

    await userRef.set(
      {
        name: userData.name,
        surname: userData.surname,
        phone: userData.phone,
        region: userData.region,
        manager_uid: userData.manager,
        manager_name: userData.manager_name,
        role: managerRole,
        status: newStatus,
      },
      { merge: true }
    );

    return { success: true, message: "User updated successfully" };
  } catch (error) {
    throw new Error("Failed to add or update user: " + error.message);
  }
};

// const getRegions = async () => {
//   try {
//     const regionsSnapshot = await db.collection("regions").get();
//     return regionsSnapshot.docs.map((doc) => doc.data());
//   } catch (error) {
//     throw new Error("Failed to get regions: " + error.message);
//   }
// };

const getManagers = async () => {
  try {
    const managersSnapshot = await db
      .collection("users")
      .where("role", "in", ["Admin", "Operator"])
      .where("status", "in", ["Approved"])
      .get();
    return managersSnapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    throw new Error("Failed to get managers: " + error.message);
  }
};

const deleteUserById = async (uid) => {
  try {
    const userRef = db.collection("users").doc(uid);
    await userRef.delete();
    await admin.auth().deleteUser(uid);
    return { success: true, message: "User deleted successfully" };
  } catch (error) {
    throw new Error("Error deleting user: " + error.message);
  }
};

module.exports = {
  getUserById,
  existUserById,
  isTableEmpty,
  addUser,
  updateUser,
  updateUserRole,
  updateUserStatus,
  getAllUsers,
  addOrUpdateUser,
  getManagers,
  deleteUserById,
};
