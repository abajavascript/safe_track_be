const e = require("express");
const { db, webPush } = require("../firebaseConfig");

const sendNotification = async (uid, message) => {
  try {
    // Fetch the manager's subscription object
    console.log("sendNotification");
    console.log(uid);

    const subscriptionsRef = db.collection("subscriptions").doc(uid);
    const snapshot = await subscriptionsRef.get();

    if (!snapshot.exists) {
      return;
      // throw new Error("User does not have a subscription.");
    }

    const subscription = snapshot.data().subscription;
    console.log("subscription");
    console.log(subscription);
    webPush
      .sendNotification(subscription, JSON.stringify(message))
      .then(() => {
        console.log("!!! Notification sent successfully.");
      })
      .catch((error) => {
        console.error("Error sending notification:", error);
      });
    // // Send notification to all subscriptions
    // snapshot.forEach((doc) => {
    //   const subscription = doc.data().subscription;
    //   webPush
    //     .sendNotification(subscription, JSON.stringify(message))
    //     .catch((error) => {
    //       console.error("Error sending notification:", error);
    //     });
    // });
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
};

const sendNotificationsForRegion = async (regionId) => {
  try {
    const regionRef = db.collection("regions").doc(regionId);
    const regionSnapshot = await regionRef.get();

    if (!regionSnapshot.exists)
      throw new Error("No region with UID : " + regionId);

    // Get all approved users in the region
    const usersSnapshot = await db
      .collection("users")
      .where("region", "==", regionSnapshot.data().name)
      .where("status", "==", "Approved")
      .get();

    if (usersSnapshot.empty) {
      throw new Error("No approved users in the selected region.");
    }

    // Send push notifications to each user
    const promises = usersSnapshot.docs.map(async (doc) => {
      const userData = doc.data();
      const payload = {
        title: "Self-Check Reminder",
        body: `Dear ${userData.name} ${userData.surname}. Please complete your self-check.`,
        icon: "/logo192.png",
        data: {
          url: "/self-check", // URL to open when the notification is clicked
        },
      };
      // Create a notification request
      const requestRef = db.collection("requests").doc();
      const requestData = {
        //...userData,
        uid: userData.uid,
        email: userData.email,
        region: userData.region,
        regionId,
        createdAt: new Date().toISOString(),
        type: "self-check",
      };
      await requestRef.set(requestData);
      console.log(`userData ${userData.uid}`);
      await sendNotification(userData.uid, payload);
    });
    await Promise.all(promises);
  } catch (error) {
    throw new Error("Failed to send notifications: " + error.message);
  }
};

const saveSubscription = async (subscription, uid) => {
  try {
    const subscriptionRef = db.collection("subscriptions").doc(uid);
    await subscriptionRef.set({ subscription }, { merge: true });
    //    await db.collection("subscriptions").add({ subscription, uid });
  } catch (error) {
    console.error("Failed to save subscription:", error);
  }
};

module.exports = {
  sendNotification,
  sendNotificationsForRegion,
  saveSubscription,
};
