const { db } = require("../firebaseConfig");
const { getUserById } = require("./userService");

const saveResponse = async (responseData) => {
  try {
    const responseRef = db.collection("responses").doc();
    await responseRef.set(responseData);
  } catch (error) {
    throw new Error("Failed to save response: " + error.message);
  }
};

const getLastResponse = async (uid) => {
  try {
    const responseQuery = await db
      .collection("responses")
      .where("user_uid", "==", uid)
      .orderBy("response_date_time", "desc")
      .limit(1)
      .get();
    if (responseQuery.empty) return null;
    return { ...responseQuery.docs[0].data(), id: responseQuery.docs[0].id };
  } catch (error) {
    throw new Error("Failed to get last response: " + error.message);
  }
};

const getLastRequest = async (uid) => {
  try {
    const requestQuery = await db
      .collection("requests")
      .where("uid", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();
    if (requestQuery.empty) return null;
    return { ...requestQuery.docs[0].data(), id: requestQuery.docs[0].id };
  } catch (error) {
    throw new Error("Failed to get last request: " + error.message);
  }
};

const getLastStatus = async (uid) => {
  const lastResponse = await getLastResponse(uid);
  const lastRequest = await getLastRequest(uid);
  return { lastResponse, lastRequest };
};

const getLastResponses = async (uids) => {
  if (!uids || uids.length === 0) return [];

  try {
    const queries = uids.map((uid) =>
      db
        .collection("responses")
        .where("user_uid", "==", uid)
        .orderBy("response_date_time", "desc")
        .limit(1)
        .get()
    );

    const results = await Promise.all(queries);

    const latestResponses = results
      .map((responseQuery) =>
        !responseQuery.empty
          ? { ...responseQuery.docs[0].data(), id: responseQuery.docs[0].id }
          : null
      )
      .filter(Boolean); // Remove null entries (users with no responses)

    return latestResponses;
  } catch (error) {
    throw new Error("Failed to get last responses: " + error.message);
  }
};

const getLastRequests = async (uids) => {
  if (!uids || uids.length === 0) return [];

  try {
    const queries = uids.map((uid) =>
      db
        .collection("requests")
        .where("uid", "==", uid)
        .orderBy("createdAt", "desc")
        .limit(1)
        .get()
    );

    const results = await Promise.all(queries);

    const latestRequests = results
      .map((requestQuery) =>
        !requestQuery.empty
          ? { ...requestQuery.docs[0].data(), id: requestQuery.docs[0].id }
          : null
      )
      .filter(Boolean); // Remove null entries (users with no requests)

    return latestRequests;
  } catch (error) {
    throw new Error("Failed to get last requests: " + error.message);
  }
};

const getLastStatuses = async (uid) => {
  try {
    const user = await getUserById(uid);

    let uids = [];
    if (user.data.role === "Admin") {
      const usersSnapshot = await db.collection("users").get();
      uids = usersSnapshot.docs.map((doc) => doc.id);
    } else if (user.data.role === "Operator") {
      const usersSnapshot = await db
        .collection("users")
        .where("manager_uid", "==", uid)
        .get();
      uids = usersSnapshot.docs.map((doc) => doc.id);
      uids.push(uid);
    } else {
      uids = [uid];
    }

    const lastResponses = await getLastResponses(uids);
    const lastRequests = await getLastRequests(uids);
    return { lastResponses, lastRequests };
  } catch (error) {
    throw new Error("Failed to get statuses: " + error.message);
  }
};

module.exports = { saveResponse, getLastStatus, getLastStatuses };
